package com.github.cap.js.community.sapafcsdk.configuration;

import com.github.cap.js.community.sapafcsdk.common.EndpointProvider;
import com.sap.cds.services.runtime.CdsRuntime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Autowired
  private EndpointProvider endpointProvider;

  @Autowired
  private CdsRuntime cdsRuntime;

  @Value("${sap-afc-sdk.ui.enabled:false}")
  private boolean uiEnabled;

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    String approuterUrl = this.endpointProvider.approuterTenantUrl(cdsRuntime.getProvidedUserInfo());
    if (approuterUrl != null && !approuterUrl.isEmpty()) {
      registry
        .addMapping("/api/**")
        .allowedOrigins(approuterUrl)
        .allowedMethods("GET", "HEAD", "PUT", "PATCH", "POST", "DELETE")
        .allowedHeaders("*")
        .allowCredentials(true);
    }
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    if (uiEnabled) {
      registry.addResourceHandler("/**").addResourceLocations("classpath:/app/").setCachePeriod(3600);
    }
  }
}
