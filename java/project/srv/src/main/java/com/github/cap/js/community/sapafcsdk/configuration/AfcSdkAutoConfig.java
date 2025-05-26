package com.github.cap.js.community.sapafcsdk.configuration;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@ComponentScan(
  {
    "com.github.cap.js.community.sapafcsdk.broker",
    "com.github.cap.js.community.sapafcsdk.common",
    "com.github.cap.js.community.sapafcsdk.configuration",
    "com.github.cap.js.community.sapafcsdk.scheduling",
  }
)
public class AfcSdkAutoConfig {}
