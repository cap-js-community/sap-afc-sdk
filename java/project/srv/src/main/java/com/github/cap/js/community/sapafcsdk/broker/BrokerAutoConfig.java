package com.github.cap.js.community.sapafcsdk.broker;

import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cloud.servicebroker.autoconfigure.web.ServiceBrokerAutoConfiguration;
import org.springframework.cloud.servicebroker.autoconfigure.web.servlet.ServiceBrokerWebMvcAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "broker.enabled", havingValue = "true")
@ComponentScan({ "com.github.cap.js.community.sapafcsdk.broker" })
@ImportAutoConfiguration({ ServiceBrokerAutoConfiguration.class, ServiceBrokerWebMvcAutoConfiguration.class })
public class BrokerAutoConfig {}
