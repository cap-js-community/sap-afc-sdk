package com.github.cap.js.community.sapafcsdk.scheduling.configuration;

import cds.gen.scheduling.JobStatusCode;
import com.github.cap.js.community.sapafcsdk.configuration.AFCSDKProperties;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class AFCSDKTestSimpleCompletedWithErrorConfig {

  @Bean
  public AFCSDKProperties afcsdkProperties() {
    AFCSDKProperties properties = new AFCSDKProperties();

    AFCSDKProperties.MockProcessing mockProcessing = new AFCSDKProperties.MockProcessing();
    mockProcessing.setDefault(JobStatusCode.COMPLETED_WITH_ERROR);
    properties.setMockProcessing(mockProcessing);

    return properties;
  }
}
