package com.github.cap.js.community.sapafcsdk.configuration;

import cds.gen.scheduling.JobStatusCode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "sap-afc-sdk")
public class AfcSdkProperties {

  private Endpoints endpoints;
  private Boolean broker = false;
  private MockProcessing mockProcessing;
  private SyncJob syncJob;
  private TenantCache tenantCache;
  private List<String> apps = List.of("scheduling.monitoring.job");

  public Endpoints getEndpoints() {
    return endpoints;
  }

  public void setEndpoints(Endpoints endpoints) {
    this.endpoints = endpoints;
  }

  public Boolean isBroker() {
    return broker;
  }

  public void setBroker(Boolean broker) {
    this.broker = broker;
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

  public List<String> getApps() {
    return apps;
  }

  public void setApps(List<String> apps) {
    this.apps = apps;
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
}
