package com.github.cap.js.community.scheduling.configuration;

import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.runtime.CdsRuntime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class OutboxTestConfig {

    @Autowired
    public CdsRuntime cdsRuntime;

    @Bean(OutboxConfig.OUTBOX_SERVICE)
    @Primary
    public OutboxService testOutboxService() {
        return cdsRuntime.getServiceCatalog().getService(OutboxService.class, OutboxService.INMEMORY_NAME);
    }
}
