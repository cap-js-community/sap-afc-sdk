package com.github.capjscommunity.sapafcsdk.broker;

import static java.lang.String.format;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.servicebroker.model.instance.*;
import org.springframework.cloud.servicebroker.service.ServiceInstanceService;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Primary
public class ServiceInstanceServiceImpl implements ServiceInstanceService {

  private final String INSTANCE_NOT_FOUND_ERROR = "Service instance with id '%s' not found";

  @Autowired
  private XsuaaClient xsuaaClient;

  @Override
  public Mono<CreateServiceInstanceResponse> createServiceInstance(CreateServiceInstanceRequest request) {
    UUID instanceId = UUID.fromString(request.getServiceInstanceId());
    return xsuaaClient
      .createXsuaaClone(instanceId.toString(), (String) request.getContext().getProperty("organizationGuid"))
      .thenReturn(CreateServiceInstanceResponse.builder().instanceExisted(false).build());
  }

  @Override
  public Mono<GetServiceInstanceResponse> getServiceInstance(GetServiceInstanceRequest request) {
    UUID instanceId = UUID.fromString(request.getServiceInstanceId());
    return xsuaaClient
      .getXsuaaClone(instanceId.toString())
      .thenReturn(GetServiceInstanceResponse.builder().build())
      .switchIfEmpty(Mono.error(new IllegalArgumentException(format(INSTANCE_NOT_FOUND_ERROR, instanceId))));
  }

  @Override
  public Mono<GetLastServiceOperationResponse> getLastOperation(GetLastServiceOperationRequest request) {
    return Mono.just(GetLastServiceOperationResponse.builder().operationState(OperationState.SUCCEEDED).build());
  }

  @Override
  public Mono<DeleteServiceInstanceResponse> deleteServiceInstance(DeleteServiceInstanceRequest request) {
    UUID instanceId = UUID.fromString(request.getServiceInstanceId());
    return xsuaaClient
      .deleteXsuaaClone(instanceId.toString())
      .thenReturn(DeleteServiceInstanceResponse.builder().operation("delete").build())
      .switchIfEmpty(Mono.error(new IllegalArgumentException(String.format(INSTANCE_NOT_FOUND_ERROR, instanceId))));
  }
}
