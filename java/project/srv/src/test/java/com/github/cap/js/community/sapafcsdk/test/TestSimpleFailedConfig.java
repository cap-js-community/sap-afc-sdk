package com.github.cap.js.community.sapafcsdk.test;

import com.github.cap.js.community.sapafcsdk.configuration.AfcSdkProperties;
import com.github.cap.js.community.sapafcsdk.model.scheduling.JobStatusCode;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class TestSimpleFailedConfig {

  @Bean
  public AfcSdkProperties afcsdkProperties() {
    AfcSdkProperties properties = new AfcSdkProperties();

    AfcSdkProperties.MockProcessing mockProcessing = new AfcSdkProperties.MockProcessing();
    mockProcessing.setDefault(JobStatusCode.FAILED);
    properties.setMockProcessing(mockProcessing);

    return properties;
  }
}
