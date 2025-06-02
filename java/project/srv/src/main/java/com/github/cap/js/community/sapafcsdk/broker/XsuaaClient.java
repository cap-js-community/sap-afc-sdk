package com.github.cap.js.community.sapafcsdk.broker;

import static java.lang.String.format;

import com.sap.cds.services.runtime.CdsRuntime;
import com.sap.cloud.environment.servicebinding.api.ServiceBinding;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriBuilder;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

@Component
public class XsuaaClient {

  static Logger log = LoggerFactory.getLogger("xsuaaClient");

  static class Endpoints {

    private static final String CLONES_URI = "/sap/rest/broker/clones";
    private static final String PARAM_SERVICE_INSTANCE_ID = "serviceinstanceid";
    private static final String PARAM_ORG_ID = "orgid";
    private static final String PARAM_SUBACCOUNT_ID = "subaccountid";
    private static final String INSTANCE_URI = CLONES_URI + "/%s";
    private static final String BINDING_URI = CLONES_URI + "/%s/binding/%s";
  }

  static String TOKEN_URI = "/oauth/token";

  @Autowired
  private CdsRuntime cdsRuntime;

  @Autowired
  private BrokerProperties brokerProperties;

  private XsuaaData xsuaaData;
  private WebClient webClient;

  public XsuaaClient() {
    super();
  }

  @PostConstruct
  public void init() {
    this.xsuaaData = new XsuaaData();
    Optional<ServiceBinding> service = cdsRuntime
      .getEnvironment()
      .getServiceBindings()
      .filter(binding -> binding.getServiceName().isPresent() && "xsuaa".equals(binding.getServiceName().get()))
      .findFirst();
    if (service.isPresent()) {
      Map<String, Object> credentials = service.get().getCredentials();
      if (credentials.get("clientid") != null) {
        xsuaaData.setClientId(credentials.get("clientid").toString());
      }
      if (credentials.get("clientsecret") != null) {
        xsuaaData.setClientSecret(credentials.get("clientsecret").toString());
      }
      if (credentials.get("url") != null) {
        xsuaaData.setUrl(credentials.get("url").toString());
      }
      if (credentials.get("certificate") != null) {
        xsuaaData.setCertificate(credentials.get("certificate").toString());
      }
      if (credentials.get("key") != null) {
        xsuaaData.setKey(credentials.get("key").toString());
      }
      if (credentials.get("certurl") != null) {
        xsuaaData.setCertUrl(credentials.get("certurl").toString());
      }
      if (credentials.get("xsappname") != null) {
        xsuaaData.setXsappname(credentials.get("xsappname").toString());
      }
      if (credentials.get("subaccountid") != null) {
        xsuaaData.setSubaccountId(credentials.get("subaccountid").toString());
      }
    }
    this.webClient = initWebClient();
  }

  public Mono<Void> createXsuaaClone(String serviceInstanceId, String orgId) {
    String subaccountId = xsuaaData.getSubaccountId();
    log.info(
      "Creating xsuaa clone for Service Instance id '{}', org id '{}', subaccount id '{}' clone xsAppName '{}'",
      serviceInstanceId,
      orgId,
      subaccountId,
      serviceInstanceId
    );
    Function<UriBuilder, URI> uriPath = subaccountId != null
      ? buildCreateClonesUriPath(serviceInstanceId, Endpoints.PARAM_SUBACCOUNT_ID, subaccountId)
      : buildCreateClonesUriPath(serviceInstanceId, Endpoints.PARAM_ORG_ID, orgId);
    return getOauthToken(xsuaaData).flatMap(token ->
      this.webClient.post()
        .uri(uriPath)
        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .header(HttpHeaders.AUTHORIZATION, format("Bearer %s", token.getAccessToken()))
        .bodyValue(buildCreateBody(serviceInstanceId))
        .retrieve()
        .bodyToMono(Void.class)
        .doOnSuccess(e ->
          log.info(
            "Created xsuaa clone for Service Instance id '{}', org id '{}', subaccount id '{}' clone xsAppName '{}'",
            serviceInstanceId,
            orgId,
            subaccountId,
            serviceInstanceId
          )
        )
        .doOnError(e ->
          log.error(
            "Create request failed for xsuaa clone for Service Instance id '{}', reason: '{}'",
            serviceInstanceId,
            e.getMessage()
          )
        )
    );
  }

  public Mono<XsuaaData> getXsuaaClone(String serviceInstanceId) {
    log.info("Getting xsuaa clone for Service Instance id '{}'", serviceInstanceId);
    return getOauthToken(xsuaaData).flatMap(token ->
      this.webClient.put()
        .uri(format(Endpoints.INSTANCE_URI, serviceInstanceId))
        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .header(HttpHeaders.AUTHORIZATION, format("Bearer %s", token.getAccessToken()))
        .bodyValue(Map.of())
        .retrieve()
        .bodyToMono(XsuaaData.class)
        .doOnSuccess(e ->
          log.info("Existence check successful for xsuaa clone for Service Instance id '{}'", serviceInstanceId)
        )
        .doOnError(e ->
          log.error(
            "Get request failed for xsuaa clone for Service Instance id '{}', reason: '{}'",
            serviceInstanceId,
            e.getMessage()
          )
        )
    );
  }

  public Mono<Void> deleteXsuaaClone(String serviceInstanceId) {
    log.info("Deleting xsuaa clone for Service Instance id '{}'", serviceInstanceId);
    return getOauthToken(xsuaaData).flatMap(token ->
      this.webClient.delete()
        .uri(format(Endpoints.INSTANCE_URI, serviceInstanceId))
        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .header(HttpHeaders.AUTHORIZATION, format("Bearer %s", token.getAccessToken()))
        .retrieve()
        .bodyToMono(Void.class)
        .doOnSuccess(e ->
          log.info("Deleting successful for xsuaa clone for Service Instance id '{}'", serviceInstanceId)
        )
        .doOnError(e ->
          log.error(
            "Deletion failed for xsuaa clone for Service Instance id '{}', reason: '{}'",
            serviceInstanceId,
            e.getMessage()
          )
        )
    );
  }

  public Mono<XsuaaData> bindXsuaaClone(String serviceInstanceId, String bindingId) {
    log.info("Getting xsuaa clone credentials for Service Instance id '{}'", serviceInstanceId);
    return getOauthToken(xsuaaData).flatMap(token ->
      this.webClient.put()
        .uri(format(Endpoints.BINDING_URI, serviceInstanceId, bindingId))
        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .header(HttpHeaders.AUTHORIZATION, format("Bearer %s", token.getAccessToken()))
        .bodyValue(Map.of())
        .retrieve()
        .bodyToMono(XsuaaData.class)
        .doOnSuccess(e ->
          log.info("Get request successful for xsuaa clone credentials for Service Instance id '{}'", serviceInstanceId)
        )
        .doOnError(e ->
          log.error(
            "Get request failed for xsuaa clone credentials for Service Instance id '{}', reason: '{}'",
            serviceInstanceId,
            e.getMessage()
          )
        )
    );
  }

  public Mono<Void> unbindXsuaaClone(String serviceInstanceId, String bindingId) {
    log.info("Deleting xsuaa clone credentials for Service Instance id '{}'", serviceInstanceId);
    return getOauthToken(xsuaaData).flatMap(token ->
      this.webClient.delete()
        .uri(format(Endpoints.BINDING_URI, serviceInstanceId, bindingId))
        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .header(HttpHeaders.AUTHORIZATION, format("Bearer %s", token.getAccessToken()))
        .retrieve()
        .bodyToMono(Void.class)
        .doOnSuccess(e ->
          log.info("Deleting successful for xsuaa clone credentials for Service Instance id '{}'", serviceInstanceId)
        )
        .doOnError(e ->
          log.error(
            "Deletion failed for xsuaa clone credentials for Service Instance id '{}', reason: '{}'",
            serviceInstanceId,
            e.getMessage()
          )
        )
    );
  }

  private Function<UriBuilder, URI> buildCreateClonesUriPath(
    String serviceInstanceId,
    String tenantParam,
    String tenantId
  ) {
    return uriBuilder ->
      uriBuilder
        .path(Endpoints.CLONES_URI)
        .queryParam(Endpoints.PARAM_SERVICE_INSTANCE_ID, serviceInstanceId)
        .queryParam(tenantParam, tenantId)
        .build();
  }

  private Map<String, Object> buildCreateBody(String xsappname) {
    List<String> credentialsTypes = brokerProperties.getCredentialTypes();
    Map<String, Object> data = new HashMap<>(
      Map.of(
        "xsappname",
        xsappname,
        "endpoints",
        brokerProperties.getEndpoints(),
        "oauth2-configuration",
        Map.of("credential-types", credentialsTypes)
      )
    );
    List<String> authorities = brokerProperties.getAuthorities();
    if (authorities != null) {
      data.put("authorities", authorities);
    }
    return data;
  }

  private WebClient initWebClient() {
    return WebClient.builder().baseUrl(xsuaaData.getUrl()).build();
  }

  public Mono<OAuthToken> getOauthToken(XsuaaData xsuaaData) {
    if (xsuaaData.getCertificate() != null) {
      return getOauthToken(
        xsuaaData.getClientId(),
        xsuaaData.getCertificate(),
        xsuaaData.getKey(),
        xsuaaData.getCertUrl()
      );
    }
    return getOauthToken(xsuaaData.getClientId(), xsuaaData.getClientSecret(), xsuaaData.getUrl());
  }

  public Mono<OAuthToken> getOauthToken(String clientId, String clientSecret, String uaaUrl) {
    return this.webClient.post()
      .uri(uaaUrl + TOKEN_URI)
      .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
      .body(
        BodyInserters.fromFormData("grant_type", "client_credentials")
          .with("client_id", clientId)
          .with("client_secret", clientSecret)
      )
      .retrieve()
      .bodyToMono(OAuthToken.class)
      .doOnError(e -> log.error(e.getMessage()));
  }

  public Mono<OAuthToken> getOauthToken(String clientId, String certificate, String key, String uaaCertUrl) {
    WebClient certWebClient = createCertBasedWebClient(uaaCertUrl, certificate, key);
    return certWebClient
      .post()
      .uri(uaaCertUrl + TOKEN_URI)
      .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
      .body(BodyInserters.fromFormData("grant_type", "client_credentials").with("client_id", clientId))
      .retrieve()
      .bodyToMono(OAuthToken.class)
      .doOnError(e -> log.error(e.getMessage()));
  }

  public static WebClient createCertBasedWebClient(String url, String certificateChain, String privateKey) {
    SslContext sslContext = createSslContext(certificateChain, privateKey);
    HttpClient httpClient = HttpClient.create().secure(sslContextSpec -> sslContextSpec.sslContext(sslContext));
    return WebClient.builder().baseUrl(url).clientConnector(new ReactorClientHttpConnector(httpClient)).build();
  }

  private static SslContext createSslContext(String certificateChain, String privateKey) {
    byte[] certificateChainBytes = certificateChain.getBytes(StandardCharsets.UTF_8);
    byte[] privateKeyBytes = privateKey.getBytes(StandardCharsets.UTF_8);
    try (
      InputStream certificateInputStream = new ByteArrayInputStream(certificateChainBytes);
      InputStream privateKeyInputStream = new ByteArrayInputStream(privateKeyBytes)
    ) {
      return SslContextBuilder.forClient().keyManager(certificateInputStream, privateKeyInputStream).build();
    } catch (IOException e) {
      throw new RuntimeException("Could not provide ssl context from certificate and key", e);
    }
  }
}
