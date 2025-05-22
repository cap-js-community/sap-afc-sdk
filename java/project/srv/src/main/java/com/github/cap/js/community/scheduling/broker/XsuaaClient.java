package com.github.cap.js.community.scheduling.broker;

import com.sap.cds.services.runtime.CdsRuntime;
import com.sap.cloud.environment.servicebinding.api.ServiceBinding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

import static java.lang.String.format;

@Component
public class XsuaaClient {

    static Logger log = LoggerFactory.getLogger("xsuaaClient");

    static class Endpoints {
        private static final String CLONES_URI = "/sap/rest/broker/clones";
        private static final String PARAM_SERVICE_INSTANCE_ID = "serviceinstanceid";
        private static final String PARAM_ORG_ID = "orgid";
        private static final String PARAM_SUBACCOUNT_ID = "subaccountid";
        private static final String GET_URI = CLONES_URI + "/%s";
        private static final String GET_BINDING_URI = CLONES_URI + "/%s/binding/%s";
        private static final String DELETE_URI = CLONES_URI + "/%s";
    }

    private final CdsRuntime cdsRuntime;
    private final WebClient webClient;
    private final XsuaaData xsuaaData;
    private final BrokerProperties brokerProperties;

    public XsuaaClient(CdsRuntime cdsRuntime, BrokerProperties brokerProperties) {
        super();
        this.cdsRuntime = cdsRuntime;
        this.xsuaaData = new XsuaaData();
        this.brokerProperties = brokerProperties;
        this.webClient = initWebClient();
        this.initXsuaa();
    }

    protected void initXsuaa() {
        Optional<ServiceBinding> service = cdsRuntime.getEnvironment().
                getServiceBindings().filter(binding -> binding.getServiceName().
                        get().equals("xsuaa")).findFirst();
        if (service.isPresent()) {
            Map<String, Object> credentials = service.get().getCredentials();
            this.xsuaaData.setClientId(credentials.get("clientid").toString());
            this.xsuaaData.setClientSecret(credentials.get("clientsecret").toString());
            this.xsuaaData.setUrl(credentials.get("url").toString());
            this.xsuaaData.setXsappname(credentials.get("xsappname").toString());
            this.xsuaaData.setSubaccountId(credentials.get("subaccountid").toString());
        }
    }

    public Mono<Void> createXsuaaClone(String serviceInstanceId, String orgId) {
        String subaccountId = xsuaaData.getSubaccountId();
        log.info(
                "Creating xsuaa clone for Service Instance id '{}', org id '{}', subaccount id '{}' clone xsAppName '{}'",
                serviceInstanceId, orgId, subaccountId, serviceInstanceId);

        Function<UriBuilder, URI> uriPath = orgId == null
                ? buildCreateClonesUriPath(serviceInstanceId, Endpoints.PARAM_SUBACCOUNT_ID, subaccountId)
                : buildCreateClonesUriPath(serviceInstanceId, Endpoints.PARAM_ORG_ID, orgId);

        return getOauthToken(xsuaaData.getClientId(), xsuaaData.getClientSecret(), xsuaaData.getUrl()).flatMap(
                        token -> this.webClient.post()
                                .uri(uriPath)
                                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                .header(HttpHeaders.AUTHORIZATION,
                                        format("Bearer %s", token.getAccessToken()))
                                .bodyValue(buildCreateClonesBody(serviceInstanceId))
                                .retrieve()
                                .bodyToMono(Void.class)
                                .doOnError(e -> log.error(
                                        "Create request failed for xsuaa clone for Service Instance id '{}', reason: '{}'",
                                        serviceInstanceId, e.getMessage())))
                .doOnSuccess(e -> log.info(
                        "Created xsuaa clone for Service Instance id '{}', org id '{}', subaccount id '{}' clone xsAppName '{}'",
                        serviceInstanceId, orgId, subaccountId, serviceInstanceId));
    }

    public Mono<XsuaaData> existsXsuaaClone(String serviceInstanceId) {
        log.info("Getting xsuaa clone for Service Instance id '{}'", serviceInstanceId);
        return getOauthToken(xsuaaData.getClientId(), xsuaaData.getClientSecret(), xsuaaData.getUrl()).flatMap(
                        token -> this.webClient.put()
                                .uri(format(Endpoints.GET_URI, serviceInstanceId))
                                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                .header(HttpHeaders.AUTHORIZATION,
                                        format("Bearer %s", token.getAccessToken()))
                                .bodyValue(Map.of())
                                .retrieve()
                                .bodyToMono(XsuaaData.class)
                                .doOnError(e -> log.error(
                                        "Get request failed for xsuaa clone for Service Instance id '{}', reason: '{}'",
                                        serviceInstanceId, e.getMessage())))
                .doOnSuccess(
                        e -> log.info("Get request successful for xsuaa clone for Service Instance id '{}'",
                                serviceInstanceId));
    }

    public Mono<XsuaaData> getXsuaaClone(String serviceInstanceId, String bindingId) {
        log.info("Getting xsuaa clone for Service Instance id '{}'", serviceInstanceId);
        return getOauthToken(xsuaaData.getClientId(), xsuaaData.getClientSecret(), xsuaaData.getUrl()).flatMap(
                        token -> this.webClient.put()
                                .uri(format(Endpoints.GET_BINDING_URI, serviceInstanceId, bindingId))
                                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                .header(HttpHeaders.AUTHORIZATION,
                                        format("Bearer %s", token.getAccessToken()))
                                .bodyValue(Map.of())
                                .retrieve()
                                .bodyToMono(XsuaaData.class)
                                .doOnError(e -> log.error(
                                        "Get request failed for xsuaa clone for Service Instance id '{}', reason: '{}'",
                                        serviceInstanceId, e.getMessage())))
                .doOnSuccess(
                        e -> log.info("Get request successful for xsuaa clone for Service Instance id '{}'",
                                serviceInstanceId));
    }

    public Mono<Void> deleteXsuaaClone(String serviceInstanceId) {
        log.info("Deleting xsuaa clone for Service Instance id '{}'", serviceInstanceId);
        return getOauthToken(xsuaaData.getClientId(), xsuaaData.getClientSecret(), xsuaaData.getUrl()).flatMap(
                        token -> this.webClient.delete()
                                .uri(format(Endpoints.DELETE_URI, serviceInstanceId))
                                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                .header(HttpHeaders.AUTHORIZATION,
                                        format("Bearer %s", token.getAccessToken()))
                                .retrieve()
                                .bodyToMono(Void.class)
                                .doOnError(e -> log.error(
                                        "Deletion failed for xsuaa clone for Service Instance id '{}', reason: '{}'",
                                        serviceInstanceId, e.getMessage())))
                .doOnSuccess(
                        e -> log.info("Deleting successful for xsuaa clone for Service Instance id '{}'",
                                serviceInstanceId));
    }

    private Function<UriBuilder, URI> buildCreateClonesUriPath(String serviceInstanceId,
                                                               String tenantParam,
                                                               String tenantId) {
        return uriBuilder -> uriBuilder.path(Endpoints.CLONES_URI)
                .queryParam(Endpoints.PARAM_SERVICE_INSTANCE_ID, serviceInstanceId)
                .queryParam(tenantParam, tenantId)
                .build();
    }

    private Map<String, Object> buildCreateClonesBody(String xsappnameClone) {
        List<String> credentialsTypes = brokerProperties.getCredentialTypes();
        if (credentialsTypes == null) {
            credentialsTypes = List.of("binding-secret", "x509");
        }
        return Map.of(
                "xsappname", xsappnameClone,
                "oauth2-configuration", Map.of("credential-types", credentialsTypes));
    }

    private WebClient initWebClient() {
        return WebClient.builder()
                .baseUrl(xsuaaData.getUrl())
                .build();
    }

    public Mono<OAuthToken> getOauthToken(String clientId, String clientSecret, String uaaUrl) {
        String TOKEN_URI = "/oauth/token";
        return this.webClient.post()
                .uri(uaaUrl + TOKEN_URI)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                .body(BodyInserters.fromFormData("grant_type", "client_credentials")
                        .with("client_id", clientId)
                        .with("client_secret", clientSecret))
                .retrieve()
                .bodyToMono(OAuthToken.class)
                .doOnError(e -> log.error(e.getMessage()));
    }
}