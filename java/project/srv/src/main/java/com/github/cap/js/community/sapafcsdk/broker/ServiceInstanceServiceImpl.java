package com.github.cap.js.community.sapafcsdk.broker;

import static java.lang.String.format;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.servicebroker.model.Context;
import org.springframework.cloud.servicebroker.model.instance.*;
import org.springframework.cloud.servicebroker.service.ServiceInstanceService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ServiceInstanceServiceImpl implements ServiceInstanceService {

  private final String INSTANCE_NOT_FOUND_ERROR = "Service instance with ID %s was not found";

  @Autowired
  private XsuaaClient xsuaaClient;

  @Override
  public Mono<CreateServiceInstanceResponse> createServiceInstance(CreateServiceInstanceRequest request) {
    UUID instanceId = UUID.fromString(request.getServiceInstanceId());
    return Mono.justOrEmpty(createNewXsuaaClone(request.getContext(), instanceId.toString())).then(
      createServiceInstance(instanceId).map(appServiceInstance ->
        CreateServiceInstanceResponse.builder().instanceExisted(false).build()
      )
    );
  }

  @Override
  public Mono<GetServiceInstanceResponse> getServiceInstance(GetServiceInstanceRequest request) {
    UUID instanceId = UUID.fromString(request.getServiceInstanceId());
    return Mono.justOrEmpty(xsuaaClient.existsXsuaaClone(String.valueOf(instanceId)))
      .map(appServiceInstance -> GetServiceInstanceResponse.builder().build())
      .switchIfEmpty(Mono.error(new IllegalArgumentException(format(INSTANCE_NOT_FOUND_ERROR, instanceId))));
  }

  @Override
  public Mono<DeleteServiceInstanceResponse> deleteServiceInstance(DeleteServiceInstanceRequest request) {
    UUID instanceId = UUID.fromString(request.getServiceInstanceId());

    return Mono.justOrEmpty(xsuaaClient.deleteXsuaaClone(String.valueOf(instanceId)))
      .then(Mono.just(DeleteServiceInstanceResponse.builder().operation("delete").build()))
      .switchIfEmpty(Mono.error(new IllegalArgumentException(String.format(INSTANCE_NOT_FOUND_ERROR, instanceId))));
  }

  public Mono<UUID> createServiceInstance(UUID instanceId) {
    return Mono.just(instanceId);
  }

  private Mono<Void> createNewXsuaaClone(Context context, String instanceId) {
    return xsuaaClient.createXsuaaClone(instanceId, (String) context.getProperty("organizationGuid"));
  }
}
