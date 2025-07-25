package com.github.cap.js.community.sapafcsdk.test;

import com.github.cap.js.community.sapafcsdk.configuration.OutboxConfig;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.runtime.CdsRuntime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class OutboxTestConfig {

  @Autowired
  public CdsRuntime cdsRuntime;

  @Bean(OutboxConfig.OUTBOX_SERVICE)
  public OutboxService testOutboxService() {
    return cdsRuntime.getServiceCatalog().getService(OutboxService.class, OutboxService.INMEMORY_NAME);
  }
}
