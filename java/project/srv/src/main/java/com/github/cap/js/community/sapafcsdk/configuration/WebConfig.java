package com.github.cap.js.community.sapafcsdk.configuration;

import com.github.cap.js.community.sapafcsdk.common.EndpointProvider;
import com.sap.cds.services.runtime.CdsRuntime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.jetbrains.annotations.NotNull;
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

  @Autowired
  private AfcSdkProperties afcSdkProperties;

  @Value("${sap-afc-sdk.ui.enabled:false}")
  private boolean uiEnabled;

  @Override
  public void addCorsMappings(@NotNull CorsRegistry registry) {
    Map<String, Object> apiCors = new HashMap<>();
    if (afcSdkProperties.getApi() != null && afcSdkProperties.getApi().getCors() != null) {
      apiCors = afcSdkProperties.getApi().getCors();
    }
    String[] origins = new String[] { this.endpointProvider.approuterTenantUrl(cdsRuntime.getProvidedUserInfo()) };
    String[] methods = new String[] { "GET", "HEAD", "PUT", "PATCH", "POST", "DELETE" };
    String[] headers = new String[] { "*" };
    Object originValue = apiCors.get("origin");
    if (Boolean.FALSE.equals(originValue)) {
      return;
    }
    if (originValue instanceof String) {
      origins = new String[] { (String) originValue };
    } else if (originValue instanceof LinkedHashMap<?, ?>) {
      origins = ((Map<?, ?>) originValue).values().stream().map(String::valueOf).toArray(String[]::new);
    }
    Object methodsValue = apiCors.get("methods");
    if (methodsValue instanceof String) {
      methods = new String[] { (String) methodsValue };
    } else if (methodsValue instanceof List) {
      methods = ((Map<?, ?>) methodsValue).values().stream().map(String::valueOf).toArray(String[]::new);
    }
    Object headersValue = apiCors.get("headers");
    if (headersValue instanceof String) {
      headers = new String[] { (String) headersValue };
    } else if (headersValue instanceof Map<?, ?>) {
      headers = ((Map<?, ?>) headersValue).values().stream().map(String::valueOf).toArray(String[]::new);
    }
    boolean credentials = true;
    Object credentialsValue = apiCors.get("credentials");
    if (credentialsValue instanceof Boolean) {
      credentials = (Boolean) credentialsValue;
    }
    registry
      .addMapping("/api/**")
      .allowedOrigins(origins)
      .allowedMethods(methods)
      .allowedMethods(methods)
      .allowedHeaders(headers)
      .allowCredentials(credentials);
  }

  @Override
  public void addResourceHandlers(@NotNull ResourceHandlerRegistry registry) {
    if (uiEnabled) {
      registry.addResourceHandler("/**").addResourceLocations("classpath:/app/").setCachePeriod(3600);
    }
  }
}
