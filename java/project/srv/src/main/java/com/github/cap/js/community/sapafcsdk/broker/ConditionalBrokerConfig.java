package com.github.cap.js.community.sapafcsdk.broker;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@ConditionalOnProperty(name = "broker.enabled", havingValue = "true")
@Import(
  {
    org.springframework.cloud.servicebroker.autoconfigure.web.ServiceBrokerAutoConfiguration.class,
    org.springframework.cloud.servicebroker.autoconfigure.web.servlet.ServiceBrokerWebMvcAutoConfiguration.class,
  }
)
public class ConditionalBrokerConfig {}
