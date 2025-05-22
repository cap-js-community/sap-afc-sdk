package com.github.cap.js.community.sapafcsdk.scheduling.configuration;

import cds.gen.scheduling.JobStatusCode;
import com.github.cap.js.community.sapafcsdk.configuration.AFCSDKProperties;
import java.util.Map;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class AFCSDKTestAdvancedConfig {

  @Bean
  public AFCSDKProperties afcsdkProperties() {
    AFCSDKProperties properties = new AFCSDKProperties();

    AFCSDKProperties.MockProcessing mockProcessing = new AFCSDKProperties.MockProcessing();
    mockProcessing.setMin(0);
    mockProcessing.setMax(10);
    mockProcessing.setDefault(JobStatusCode.COMPLETED);
    mockProcessing.setStatus(
      Map.of(
        JobStatusCode.COMPLETED,
        0.5,
        JobStatusCode.COMPLETED_WITH_WARNING,
        0.2,
        JobStatusCode.COMPLETED_WITH_ERROR,
        0.2,
        JobStatusCode.FAILED,
        0.1
      )
    );
    properties.setMockProcessing(mockProcessing);

    return properties;
  }
}
