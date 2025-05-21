package scheduling.configuration;

import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.runtime.CdsRuntime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OutboxConfig {
    public static final String OUTBOX_SERVICE = "defaultOutboxService";

    @Autowired
    public CdsRuntime cdsRuntime;

    @Bean(OutboxConfig.OUTBOX_SERVICE)
    public OutboxService outboxService() {
        return cdsRuntime.getServiceCatalog().getService(OutboxService.class, OutboxService.PERSISTENT_ORDERED_NAME);
    }
}