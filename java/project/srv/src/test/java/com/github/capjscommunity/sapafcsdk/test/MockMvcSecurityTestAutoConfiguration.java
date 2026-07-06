package com.github.capjscommunity.sapafcsdk.test;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;

@AutoConfiguration
public class MockMvcSecurityTestAutoConfiguration {

  @Bean
  public MockMvcBuilderCustomizer mockMvcSecurityBuilderCustomizer() {
    return builder -> builder.apply(SecurityMockMvcConfigurers.springSecurity());
  }
}
