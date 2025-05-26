package com.github.cap.js.community.sapafcsdk.test;

import cds.gen.scheduling.JobStatusCode;
import com.github.cap.js.community.sapafcsdk.configuration.AfcSdkProperties;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class TestSimpleCompletedConfig {

  @Bean
  public AfcSdkProperties afcsdkProperties() {
    AfcSdkProperties properties = new AfcSdkProperties();

    AfcSdkProperties.MockProcessing mockProcessing = new AfcSdkProperties.MockProcessing();
    mockProcessing.setDefault(JobStatusCode.COMPLETED);
    properties.setMockProcessing(mockProcessing);

    return properties;
  }
}
