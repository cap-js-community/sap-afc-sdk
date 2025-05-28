package com.github.cap.js.community.sapafcsdk.configuration;

import com.github.cap.js.community.sapafcsdk.common.EndpointProvider;
import com.sap.cds.services.runtime.CdsRuntime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.server.MimeMappings;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
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
        if (this.endpointProvider.approuterTenantUrl(cdsRuntime.getProvidedUserInfo()) != null) {
            registry.addMapping("/api/**")
                    .allowedOrigins(this.endpointProvider.approuterUrl())
                    .allowedMethods("*")
                    .allowedHeaders("*")
                    .allowCredentials(true);
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (uiEnabled) {
            registry.addResourceHandler("/**")
                    .addResourceLocations("classpath:/app/")
                    .setCachePeriod(3600);
        }
    }
}