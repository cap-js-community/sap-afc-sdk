package com.github.cap.js.community.scheduling.common;

import cds.gen.cds.outbox.Messages;
import cds.gen.cds.outbox.Messages_;
import cds.gen.schedulingprocessingservice.SchedulingProcessingService;
import com.github.cap.js.community.scheduling.configuration.OutboxConfig;
import com.sap.cds.ql.Delete;
import com.sap.cds.ql.Select;
import com.sap.cds.services.mt.TenantProviderService;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.services.runtime.CdsRuntime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

import static cds.gen.cds.outbox.Outbox_.MESSAGES;

@Component
@Async
public class SchedulingJobs {

    @Autowired
    TenantProviderService tenantProvider;

    @Autowired
    private CdsRuntime cdsRuntime;

    @Autowired
    @Qualifier(OutboxConfig.OUTBOX_SERVICE)
    protected OutboxService outboxService;

    @Autowired
    private SchedulingProcessingService processingService;

    @Autowired
    private PersistenceService persistenceService;

    private List<String> tenantCache;

    @Scheduled(cron = "${sap-afc-sdk.tenantCache.cron:0 */30 * * * *}")
    public void invalidateTenantCache() {
        tenantCache = null;
    }

    @Scheduled(cron = "${sap-afc-sdk.syncJob.cron:0 */1 * * * *}")
    public void syncJob() {
        List<String> tenants = this.tenantCache;
        if (tenants == null) {
            tenants = tenantCache = tenantProvider.readTenants();
        }
        for (String tenant : tenants) {
            cdsRuntime.requestContext().systemUser(tenant).run(context -> {
                Select<Messages_> query = Select.from(MESSAGES)
                        .where(m -> m.msg().contains("\"event\":\"SchedulingProcessingService\"")
                                .and(m.msg().contains("\"event\":\"syncJob\""))).orderBy(m -> m.timestamp().asc());
                List<Messages> messages = persistenceService.run(query).listOf(Messages.class);
                if (!messages.isEmpty()) {
                    return;
                }

                SchedulingProcessingService processingServiceOutboxed = outboxService.outboxed(processingService);
                processingServiceOutboxed.syncJob();

                messages = persistenceService.run(query).listOf(Messages.class);
                if (messages.size() > 1) {
                    for (int i = 1; i < messages.size(); i++) {
                        Messages message = messages.get(i);
                        persistenceService.run(Delete.from(MESSAGES).where(m -> m.ID().eq(message.getId())));
                    }
                }
            });
        }
    }
}