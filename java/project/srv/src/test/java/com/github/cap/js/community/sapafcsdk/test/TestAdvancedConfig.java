package com.github.capjscommunity.sapafcsdk.test;

import com.github.capjscommunity.sapafcsdk.configuration.AfcSdkProperties;
import com.github.capjscommunity.sapafcsdk.model.scheduling.JobStatusCode;
import java.util.Map;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class TestAdvancedConfig {

  @Bean
  public AfcSdkProperties afcsdkProperties() {
    AfcSdkProperties properties = new AfcSdkProperties();

    AfcSdkProperties.MockProcessing mockProcessing = new AfcSdkProperties.MockProcessing();
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
