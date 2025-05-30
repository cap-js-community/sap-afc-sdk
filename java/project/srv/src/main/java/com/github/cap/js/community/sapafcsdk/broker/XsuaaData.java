package com.github.cap.js.community.sapafcsdk.broker;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.HashMap;
import java.util.Map;

public class XsuaaData {

  private String xsappname;
  private String url;
  private String subaccountId;

  @JsonProperty("serviceinstanceid")
  private String serviceInstanceId;

  @JsonProperty("clientid")
  private String clientId;

  @JsonProperty("clientsecret")
  private String clientSecret;

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

  public String getSubaccountId() {
    return subaccountId;
  }

  public void setSubaccountId(String subaccountId) {
    this.subaccountId = subaccountId;
  }

  public String getServiceInstanceId() {
    return serviceInstanceId;
  }

  public void setServiceInstanceId(String serviceInstanceId) {
    this.serviceInstanceId = serviceInstanceId;
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

  public Map<String, Object> credentials() {
    Map<String, Object> map = new HashMap<>();
    map.put("clientid", clientId);
    map.put("clientsecret", clientSecret);
    return map;
  }
}
