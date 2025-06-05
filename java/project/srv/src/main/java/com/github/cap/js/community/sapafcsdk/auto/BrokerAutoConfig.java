package com.github.cap.js.community.sapafcsdk.auto;

import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cloud.servicebroker.autoconfigure.web.ServiceBrokerAutoConfiguration;
import org.springframework.cloud.servicebroker.autoconfigure.web.servlet.ServiceBrokerWebMvcAutoConfiguration;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "sap-afc-sdk.broker.enabled", havingValue = "true")
@ImportAutoConfiguration({ ServiceBrokerAutoConfiguration.class, ServiceBrokerWebMvcAutoConfiguration.class })
public class BrokerAutoConfig {}
