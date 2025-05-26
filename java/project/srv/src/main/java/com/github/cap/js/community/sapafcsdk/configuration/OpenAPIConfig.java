package com.github.cap.js.community.sapafcsdk.configuration;

import com.github.cap.js.community.sapafcsdk.common.EndpointProvider;
import com.sap.cds.services.runtime.CdsRuntime;
import com.sap.cloud.environment.servicebinding.api.ServiceBinding;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.OAuthFlow;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfig {

  final String securitySchemeName = "oauth2";

  @Autowired
  private EndpointProvider endpointProvider;

  @Autowired
  private CdsRuntime cdsRuntime;

  @Bean
  public OpenAPI customOpenAPI() {
    return new OpenAPI()
      .servers(List.of(new Server().url(endpointProvider.serverUrl())))
      .info(
        new Info()
          .title("SAP Advanced Financial Closing Scheduling Service Provider Interface")
          .description(
            "The Scheduling Service Provider Interface of SAP Advanced Financial Closing allows the integration of third-party scheduling systems with SAP Advanced Financial Closing. It includes the retrieval of job definitions, as well as the scheduling and synchronization of jobs. <a href=\"https://api.sap.com/api/SSPIV1/overview\" target=\"_blank\">See OpenAPI Specification on SAP Business Accelerator Hub</a>."
          )
          .version("1.0.0")
      )
      .tags(List.of(new Tag().name("Job Definition"), new Tag().name("Job"), new Tag().name("Job Result")))
      .externalDocs(
        new ExternalDocumentation()
          .description("SAP Advanced Financial Closing SDK for CDS")
          .url("https://github.com/cap-js-community/sap-afc-sdk")
      )
      .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
      .components(
        new io.swagger.v3.oas.models.Components()
          .addSecuritySchemes(
            securitySchemeName,
            new io.swagger.v3.oas.models.security.SecurityScheme()
              .type(SecurityScheme.Type.OAUTH2)
              .description("To access this API, use the OAuth 2.0 client credentials grant flow.")
              .flows(new OAuthFlows().clientCredentials(new OAuthFlow().tokenUrl(getXsuaaTokenUrl())))
          )
      );
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
