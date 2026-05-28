package com.github.capjscommunity.sapafcsdk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.servicebroker.autoconfigure.web.ServiceBrokerAutoConfiguration;
import org.springframework.cloud.servicebroker.autoconfigure.web.servlet.ServiceBrokerWebMvcAutoConfiguration;

@SpringBootApplication(exclude = { ServiceBrokerAutoConfiguration.class, ServiceBrokerWebMvcAutoConfiguration.class })
public class Application {

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
