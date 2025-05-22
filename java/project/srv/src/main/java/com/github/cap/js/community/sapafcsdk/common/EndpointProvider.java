package com.github.cap.js.community.sapafcsdk.common;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.cap.js.community.sapafcsdk.configuration.AFCSDKProperties;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.request.UserInfo;
import java.lang.reflect.InvocationTargetException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class EndpointProvider {

  private static final String SERVER_SUFFIX = "srv";
  private static final String APPROUTER_SUFFIX = "app";

  @Autowired
  private Environment env;

  @Autowired
  private AFCSDKProperties afcsdkProperties;

  private final ObjectMapper objectMapper = new ObjectMapper();

  private String _serverUrl = null;
  private String _approuterUrl = null;

  public String serverUrl() {
    if (this._serverUrl != null) {
      return this._serverUrl;
    }
    String serverUrl = afcsdkProperties.getEndpoints().getServer();
    if (serverUrl != null && !serverUrl.isEmpty()) {
      return this._serverUrl = serverUrl;
    }
    try {
      String vcapApplication = System.getenv("VCAP_APPLICATION");
      if (vcapApplication != null && !vcapApplication.isEmpty()) {
        JsonNode vcap = objectMapper.readTree(vcapApplication);
        String url = vcap.get("uris").get(0).asText();
        if (url != null && !url.isEmpty()) {
          return this._serverUrl = "https://" + url;
        }
      }
    } catch (JsonProcessingException ignored) {}
    String port = System.getenv("PORT");
    if (port == null || port.isEmpty()) {
      port = "8080";
    }
    return this._serverUrl = "http://localhost:" + port;
  }

  public String approuterUrl() {
    if (this._approuterUrl != null) {
      return this._approuterUrl;
    }
    String approuterEndpoint = env.getProperty("cds.multi-tenancy.app-ui.url");
    if (approuterEndpoint != null && !approuterEndpoint.isEmpty()) {
      return this._approuterUrl = approuterEndpoint;
    }
    approuterEndpoint = afcsdkProperties.getEndpoints().getApprouter();
    if (approuterEndpoint != null && !approuterEndpoint.isEmpty()) {
      return this._approuterUrl = approuterEndpoint;
    }

    String baseUrl = this.serverUrl();
    String vcap = System.getenv("VCAP_APPLICATION");

    String regex = String.format("(https://.*?)-%s(.*)", SERVER_SUFFIX);
    Pattern pattern = Pattern.compile(regex);
    Matcher matcher = pattern.matcher(baseUrl);

    if (vcap != null && !vcap.isEmpty()) {
      return this._approuterUrl = matcher.replaceFirst("$1$2");
    } else {
      regex = String.format("(https://.*?)-%s(.*)", SERVER_SUFFIX);
      pattern = Pattern.compile(regex);
      matcher = pattern.matcher(baseUrl);
      return this._approuterUrl = matcher.replaceFirst("$1-" + APPROUTER_SUFFIX + "$2");
    }
  }

  public String approuterDomain() {
    String url = this.approuterUrl();
    if (url.startsWith("https://")) {
      return url.substring(8);
    }
    return url;
  }

  public String approuterWildcardUrl() {
    return "*." + this.approuterDomain();
  }

  public String approuterTenantUrl(EventContext eventContext) {
    if (env.getProperty("cds.multi-tenancy.endpoint.enabled", "false").equals("true")) {
      try {
        UserInfo userInfo = eventContext.getUserInfo();
        String subdomain = (String) userInfo.getClass().getMethod("getSubDomain").invoke(userInfo);
        if (subdomain != null && !subdomain.isEmpty()) {
          String separator = env.getProperty("cds.multi-tenancy.app-ui.tenant-separator", ".");
          return "https://" + subdomain + separator + approuterDomain();
        }
      } catch (NoSuchMethodException | IllegalAccessException | InvocationTargetException ignored) {}
    }
    return approuterUrl();
  }
}
