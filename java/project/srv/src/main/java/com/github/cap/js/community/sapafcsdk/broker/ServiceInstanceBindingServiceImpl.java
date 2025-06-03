package com.github.cap.js.community.sapafcsdk.broker;

import static java.lang.String.format;

import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.servicebroker.model.binding.*;
import org.springframework.cloud.servicebroker.model.instance.OperationState;
import org.springframework.cloud.servicebroker.service.ServiceInstanceBindingService;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Primary
public class ServiceInstanceBindingServiceImpl implements ServiceInstanceBindingService {

  private final String BINDING_NOT_FOUND_ERROR =
    "Service binding with id '%s' for service instance with id '%s' not found";

  @Autowired
  private XsuaaClient xsuaaClient;

  @Autowired
  private BrokerProperties brokerProperties;

  @Override
  public Mono<CreateServiceInstanceBindingResponse> createServiceInstanceBinding(
    CreateServiceInstanceBindingRequest request
  ) {
    UUID serviceInstanceId = UUID.fromString(request.getServiceInstanceId());
    UUID bindingId = UUID.fromString(request.getBindingId());
    return xsuaaClient
      .bindXsuaaClone(serviceInstanceId.toString(), bindingId.toString())
      .map(xsuaaData ->
        CreateServiceInstanceAppBindingResponse.builder()
          .credentials(credentials(xsuaaData))
          .bindingExisted(false)
          .build()
      );
  }

  @Override
  public Mono<GetServiceInstanceBindingResponse> getServiceInstanceBinding(GetServiceInstanceBindingRequest request) {
    UUID serviceInstanceId = UUID.fromString(request.getServiceInstanceId());
    UUID bindingId = UUID.fromString(request.getBindingId());
    return xsuaaClient
      .getXsuaaCloneBinding(serviceInstanceId.toString(), bindingId.toString())
      .map(xsuaaData ->
        (GetServiceInstanceBindingResponse) GetServiceInstanceAppBindingResponse.builder()
          .credentials(credentials(xsuaaData))
          .build()
      )
      .switchIfEmpty(
        Mono.error(new IllegalArgumentException(format(BINDING_NOT_FOUND_ERROR, bindingId, serviceInstanceId)))
      );
  }

  @Override
  public Mono<GetLastServiceBindingOperationResponse> getLastOperation(GetLastServiceBindingOperationRequest request) {
    return Mono.just(GetLastServiceBindingOperationResponse.builder().operationState(OperationState.SUCCEEDED).build());
  }

  @Override
  public Mono<DeleteServiceInstanceBindingResponse> deleteServiceInstanceBinding(
    DeleteServiceInstanceBindingRequest request
  ) {
    UUID serviceInstanceId = UUID.fromString(request.getServiceInstanceId());
    UUID bindingId = UUID.fromString(request.getBindingId());
    return xsuaaClient
      .unbindXsuaaClone(serviceInstanceId.toString(), bindingId.toString())
      .thenReturn(DeleteServiceInstanceBindingResponse.builder().operation("delete").build())
      .switchIfEmpty(
        Mono.error(new IllegalArgumentException(format(BINDING_NOT_FOUND_ERROR, bindingId, serviceInstanceId)))
      );
  }

  public Map<String, Object> credentials(XsuaaData xsuaaData) {
    return Map.of(
      "endpoints",
      brokerProperties.getEndpoints(),
      "oauth2-configuration",
      Map.of("credential-types", brokerProperties.getOauth2Configuration().getCredentialTypes()),
      "uaa",
      xsuaaData
    );
  }
}
