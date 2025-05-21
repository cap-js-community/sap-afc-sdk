package scheduling.broker;

import org.springframework.cloud.servicebroker.model.binding.*;
import org.springframework.cloud.servicebroker.service.ServiceInstanceBindingService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.UUID;

import static java.lang.String.format;

@Service
public class ServiceInstanceBindingServiceImpl implements ServiceInstanceBindingService {

    private final XsuaaClient xsuaaClient;
    private final BrokerProperties brokerProperties;

    private final String BINDING_NOT_FOUND_ERROR = "Service binding with ID %s was not found";

    public ServiceInstanceBindingServiceImpl(XsuaaClient xsuaaClient, BrokerProperties brokerProperties) {
        this.xsuaaClient = xsuaaClient;
        this.brokerProperties = brokerProperties;
    }

    @Override
    public Mono<CreateServiceInstanceBindingResponse> createServiceInstanceBinding(
            CreateServiceInstanceBindingRequest request) {
        UUID bindingId = UUID.fromString(request.getBindingId());
        UUID serviceInstanceId = UUID.fromString(request.getServiceInstanceId());
        return Mono.justOrEmpty(xsuaaClient.getXsuaaClone(String.valueOf(serviceInstanceId), String.valueOf(bindingId)))
                .map(
                        serviceInstance -> createBindingResponse(null, true))
                .switchIfEmpty(createNewBinding(serviceInstanceId, bindingId));
    }

    @Override
    public Mono<DeleteServiceInstanceBindingResponse> deleteServiceInstanceBinding(
            DeleteServiceInstanceBindingRequest request) {
        UUID bindingId = UUID.fromString(request.getBindingId());
        UUID serviceInstanceId = UUID.fromString(request.getServiceInstanceId());
        return Mono.justOrEmpty(xsuaaClient.getXsuaaClone(String.valueOf(serviceInstanceId), String.valueOf(bindingId)))
                .flatMap(serviceInstance -> {
                    return Mono.fromCallable(() ->
                            DeleteServiceInstanceBindingResponse.builder().operation("delete").build());
                })
                .switchIfEmpty(
                        Mono.error(new IllegalArgumentException(format(BINDING_NOT_FOUND_ERROR, bindingId))));
    }

    @Override
    public Mono<GetServiceInstanceBindingResponse> getServiceInstanceBinding(
            GetServiceInstanceBindingRequest request) {
        UUID bindingId = UUID.fromString(request.getBindingId());
        UUID serviceInstanceId = UUID.fromString(request.getServiceInstanceId());

        return xsuaaClient.getXsuaaClone(String.valueOf(serviceInstanceId), String.valueOf(bindingId))
                .map(xsuaaProperties ->
                        (GetServiceInstanceBindingResponse) GetServiceInstanceAppBindingResponse.builder()
                                .credentials(xsuaaProperties.credentials())
                                .build()).switchIfEmpty(
                        Mono.error(new IllegalArgumentException(format(BINDING_NOT_FOUND_ERROR, bindingId))));
    }

    private Mono<Map<String, Object>> generateCredentials(UUID serviceInstanceId, UUID bindingId) {
        return xsuaaClient.getXsuaaClone(serviceInstanceId.toString(), bindingId.toString())
                .map(xsuaaProperties -> Map.of(
                        "credentials", Map.of(
                                "client-id", xsuaaProperties.getClientId(),
                                "client-secret", xsuaaProperties.getClientSecret()
                        ),
                        "endpoints", brokerProperties.getEndpoints(),
                        "service-instance-id", serviceInstanceId
                ));
    }

    private CreateServiceInstanceBindingResponse createBindingResponse(
            Map<String, Object> credentials, boolean bindingExisted) {
        return CreateServiceInstanceAppBindingResponse.builder()
                .credentials(credentials)
                .bindingExisted(bindingExisted)
                .build();
    }

    private Mono<CreateServiceInstanceAppBindingResponse> createNewBinding(UUID serviceInstanceId, UUID bindingId) {
        return generateCredentials(serviceInstanceId, bindingId).map(credentials ->
                (CreateServiceInstanceAppBindingResponse) createBindingResponse(credentials, false)
        );
    }
}