package com.github.cap.js.community.sapafcsdk.broker;

import com.fasterxml.jackson.annotation.JsonProperty;

public class XsuaaData {

  @JsonProperty("xsappname")
  private String xsappname;

  @JsonProperty("url")
  private String url;

  @JsonProperty("subaccountid")
  private String subaccountId;

  @JsonProperty("serviceInstanceId")
  private String serviceInstanceId;

  @JsonProperty("clientid")
  private String clientId;

  @JsonProperty("clientsecret")
  private String clientSecret;

  @JsonProperty("credential-type")
  private String credentialType;

  @JsonProperty("identityzone")
  private String identityZone;

  @JsonProperty("identityzoneid")
  private String identityZoneId;

  @JsonProperty("sburl")
  private String sbUrl;

  @JsonProperty("apiurl")
  private String apiUrl;

  @JsonProperty("tenantid")
  private String tenantId;

  @JsonProperty("tenantmode")
  private String tenantMode;

  @JsonProperty("uaadomain")
  private String uaaDomain;

  @JsonProperty("verificationkey")
  private String verificationKey;

  @JsonProperty("zoneid")
  private String zoneId;

  @JsonProperty("certificate")
  private String certificate;

  @JsonProperty("key")
  private String key;

  @JsonProperty("certurl")
  private String certUrl;

  public String getXsappname() {
    return xsappname;
  }

  public void setXsappname(String xsappname) {
    this.xsappname = xsappname;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getApiUrl() {
    return apiUrl;
  }

  public void setApiUrl(String apiUrl) {
    this.apiUrl = apiUrl;
  }

  public String getClientId() {
    return clientId;
  }

  public void setClientId(String clientId) {
    this.clientId = clientId;
  }

  public String getClientSecret() {
    return clientSecret;
  }

  public void setClientSecret(String clientSecret) {
    this.clientSecret = clientSecret;
  }

  public String getCredentialType() {
    return credentialType;
  }

  public void setCredentialType(String credentialType) {
    this.credentialType = credentialType;
  }

  public String getIdentityZone() {
    return identityZone;
  }

  public void setIdentityZone(String identityZone) {
    this.identityZone = identityZone;
  }

  public String getIdentityZoneId() {
    return identityZoneId;
  }

  public void setIdentityZoneId(String identityZoneId) {
    this.identityZoneId = identityZoneId;
  }

  public String getSbUrl() {
    return sbUrl;
  }

  public void setSbUrl(String sbUrl) {
    this.sbUrl = sbUrl;
  }

  public String getServiceInstanceId() {
    return serviceInstanceId;
  }

  public void setServiceInstanceId(String serviceInstanceId) {
    this.serviceInstanceId = serviceInstanceId;
  }

  public String getSubaccountId() {
    return subaccountId;
  }

  public void setSubaccountId(String subaccountId) {
    this.subaccountId = subaccountId;
  }

  public String getTenantId() {
    return tenantId;
  }

  public void setTenantId(String tenantId) {
    this.tenantId = tenantId;
  }

  public String getTenantMode() {
    return tenantMode;
  }

  public void setTenantMode(String tenantMode) {
    this.tenantMode = tenantMode;
  }

  public String getUaaDomain() {
    return uaaDomain;
  }

  public void setUaaDomain(String uaaDomain) {
    this.uaaDomain = uaaDomain;
  }

  public String getVerificationKey() {
    return verificationKey;
  }

  public void setVerificationKey(String verificationKey) {
    this.verificationKey = verificationKey;
  }

  public String getZoneId() {
    return zoneId;
  }

  public void setZoneId(String zoneId) {
    this.zoneId = zoneId;
  }

  public String getCertificate() {
    return certificate;
  }

  public void setCertificate(String certificate) {
    this.certificate = certificate;
  }

  public String getKey() {
    return key;
  }

  public void setKey(String key) {
    this.key = key;
  }

  public String getCertUrl() {
    return certUrl;
  }

  public void setCertUrl(String certUrl) {
    this.certUrl = certUrl;
  }
}
