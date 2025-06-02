package com.github.cap.js.community.sapafcsdk.broker;

import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "sap-afc-sdk.broker")
public class BrokerProperties {

  private String name;
  private boolean enabled;
  private String user;
  private String credentialsHash;
  private Map<String, String> endpoints;
  private List<String> credentialTypes = List.of("binding-secret", "x509");
  private List<String> authorities;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getUser() {
    return user;
  }

  public void setUser(String user) {
    this.user = user;
  }

  public String getCredentialsHash() {
    return credentialsHash;
  }

  public void setCredentialsHash(String credentialsHash) {
    this.credentialsHash = credentialsHash;
  }

  public Map<String, String> getEndpoints() {
    return endpoints;
  }

  public void setEndpoints(Map<String, String> endpoints) {
    this.endpoints = endpoints;
  }

  public List<String> getCredentialTypes() {
    return credentialTypes;
  }

  public void setCredentialTypes(List<String> credentialTypes) {
    this.credentialTypes = credentialTypes;
  }

  public List<String> getAuthorities() {
    return authorities;
  }

  public void setAuthorities(List<String> authorities) {
    this.authorities = authorities;
  }
}
