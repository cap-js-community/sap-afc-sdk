package com.github.cap.js.community.sapafcsdk.configuration;

import com.github.cap.js.community.sapafcsdk.model.sapafcsdk.scheduling.JobStatusCode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "sap-afc-sdk")
public class AfcSdkProperties {

  public static List<String> APPS = List.of("scheduling.monitoring.job");

  private Endpoints endpoints;
  private MockProcessing mockProcessing;
  private SyncJob syncJob;
  private TenantCache tenantCache;
  private Ui ui = new Ui();
  private Api api = new Api();
  private Capabilities capabilities = new Capabilities();

  public Endpoints getEndpoints() {
    return endpoints;
  }

  public void setEndpoints(Endpoints endpoints) {
    this.endpoints = endpoints;
  }

  public MockProcessing getMockProcessing() {
    return mockProcessing;
  }

  public void setMockProcessing(MockProcessing mockProcessing) {
    this.mockProcessing = mockProcessing;
  }

  public SyncJob getSyncJob() {
    return syncJob;
  }

  public void setSyncJob(SyncJob syncJob) {
    this.syncJob = syncJob;
  }

  public TenantCache getTenantCache() {
    return tenantCache;
  }

  public void setTenantCache(TenantCache tenantCache) {
    this.tenantCache = tenantCache;
  }

  public Ui getUi() {
    return ui;
  }

  public void setUi(Ui ui) {
    this.ui = ui;
  }

  public Api getApi() {
    return api;
  }

  public void setApi(Api api) {
    this.api = api;
  }

  public Capabilities getCapabilities() {
    return capabilities;
  }

  public void setCapabilities(Capabilities capabilities) {
    this.capabilities = capabilities;
  }

  public static class Endpoints {

    private String approuter;
    private String server;

    public String getApprouter() {
      return approuter;
    }

    public void setApprouter(String approuter) {
      this.approuter = approuter;
    }

    public String getServer() {
      return server;
    }

    public void setServer(String server) {
      this.server = server;
    }
  }

  public static class MockProcessing {

    private Integer min = 0;
    private Integer max = 0;
    private String defaultStatus = JobStatusCode.COMPLETED;
    private Map<String, Double> status = new HashMap<>();

    public Integer getMin() {
      return min;
    }

    public void setMin(Integer min) {
      this.min = min;
    }

    public Integer getMax() {
      return max;
    }

    public void setMax(Integer max) {
      this.max = max;
    }

    public String getDefault() {
      return defaultStatus;
    }

    public void setDefault(String defaultStatus) {
      this.defaultStatus = defaultStatus;
    }

    public Map<String, Double> getStatus() {
      return status;
    }

    public void setStatus(Map<String, Double> status) {
      this.status = status;
    }
  }

  public static class SyncJob {

    private String cron = "0 */1 * * * *";

    public String getCron() {
      return cron;
    }

    public void setCron(String cron) {
      this.cron = cron;
    }
  }

  public static class TenantCache {

    private String cron = "0 */30 * * * *";

    public String getCron() {
      return cron;
    }

    public void setCron(String cron) {
      this.cron = cron;
    }
  }

  public static class Ui {

    private boolean enabled = false;
    private boolean link = true;
    private List<String> apps = APPS;

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public boolean isLink() {
      return link;
    }

    public void setLink(boolean link) {
      this.link = link;
    }

    public List<String> getApps() {
      return apps;
    }

    public void setApps(List<String> apps) {
      this.apps = apps;
    }
  }

  public static class Api {

    private Map<String, Object> cors;

    public Map<String, Object> getCors() {
      return cors;
    }

    public void setCors(Map<String, Object> cors) {
      this.cors = cors;
    }
  }

  public static class Capabilities {

    private boolean supportsNotification = true;

    public boolean isSupportsNotification() {
      return supportsNotification;
    }

    public void setSupportsNotification(boolean supportsNotification) {
      this.supportsNotification = supportsNotification;
    }
  }
}
