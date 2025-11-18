package com.github.capjscommunity.sapafcsdk.configuration;

import com.github.capjscommunity.sapafcsdk.common.EndpointProvider;
import com.sap.cds.services.runtime.CdsRuntime;
import com.sap.cloud.environment.servicebinding.api.ServiceBinding;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.OAuthFlow;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfig {

  @Autowired
  private EndpointProvider endpointProvider;

  @Autowired
  private CdsRuntime cdsRuntime;

  @Bean
  public OpenAPI customOpenAPI() throws IOException {
    try (
      InputStream is = getClass()
        .getClassLoader()
        .getResourceAsStream("openapi/SchedulingProviderV1Service.openapi3.json")
    ) {
      if (is == null) {
        throw new IllegalStateException("Open API not found");
      }
      OpenAPI openAPI = io.swagger.v3.core.util.Json.mapper().readValue(is, OpenAPI.class);
      String serverPath = openAPI.getServers().get(0).getUrl();
      openAPI.setServers(List.of(new Server().url(endpointProvider.serverUrl() + serverPath)));
      openAPI
        .getComponents()
        .addSecuritySchemes(
          "oauth2",
          new io.swagger.v3.oas.models.security.SecurityScheme()
            .type(SecurityScheme.Type.OAUTH2)
            .description("To access this API, use the OAuth 2.0 client credentials grant flow.")
            .flows(new OAuthFlows().clientCredentials(new OAuthFlow().tokenUrl(getXsuaaTokenUrl())))
        )
        .addSecuritySchemes(
          "bearer",
          new io.swagger.v3.oas.models.security.SecurityScheme()
            .type(SecurityScheme.Type.HTTP)
            .scheme("bearer")
            .bearerFormat("JWT")
            .description("To access this API, use the HTTP bearer authentication.")
        );
      return openAPI;
    }
  }

  protected String getXsuaaTokenUrl() {
    Optional<ServiceBinding> service = cdsRuntime
      .getEnvironment()
      .getServiceBindings()
      .filter(binding -> binding.getServiceName().isPresent() && "xsuaa".equals(binding.getServiceName().get()))
      .findFirst();
    if (service.isPresent()) {
      Map<String, Object> credentials = service.get().getCredentials();
      return credentials.get("url").toString() + "/oauth/token";
    }
    return "https://{subdomain}.authentication.{region}.hana.ondemand.com/oauth/token";
  }
}
