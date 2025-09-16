package com.github.cap.js.community.sapafcsdk.index;

import com.sap.cds.adapter.IndexContentProvider;
import com.sap.cds.adapter.IndexContentProviderFactory;
import java.io.PrintWriter;

public class ApiIndexContentProviderFactory implements IndexContentProviderFactory {

  @Override
  public IndexContentProvider create() {
    return new UiIndexContentProvider();
  }

  @Override
  public boolean isEnabled() {
    return true;
  }

  private static class UiIndexContentProvider implements IndexContentProvider {

    private static final String HEADER =
      "" +
      "                <h3 class=\"header\">\n" +
      "                    <a href=\"/api/job-scheduling/v1\"><span>/api/job-scheduling/v1</span></a><span>/</span><a target=\"_blank\" href=\"/api-docs/api/job-scheduling/v1\"><span class=\"metadata\">Open API</span></a>\n" +
      "                </h3>\n";

    private static final String ENDPOINT_START = "" + "                <ul>\n";

    private static final String ENDPOINT =
      "" +
      "                    <li>\n" +
      "                        <div><a href=\"%s\"><span>%s</span></a></div>\n" +
      "                        <div><a target=\"_blank\" href=\"/api-docs/api/job-scheduling/v1\"><span class=\"metadata\">Open API</span></a></div>\n" +
      "                    </li>\n";

    private static final String ENDPOINT_END = "" + "                </ul>\n";

    @Override
    public String getSectionTitle() {
      return "API endpoints";
    }

    @Override
    public void writeContent(PrintWriter writer, String contextPath) {
      writer.print(HEADER);
      writer.print(ENDPOINT_START);
      writer.printf(ENDPOINT, contextPath + "/api/job-scheduling/v1/Capabilities", "Capabilities");
      writer.printf(ENDPOINT, contextPath + "/api/job-scheduling/v1/JobDefinition", "JobDefinition");
      writer.printf(ENDPOINT, contextPath + "/api/job-scheduling/v1/JobParameterDefinition", "JobParameterDefinition");
      writer.printf(ENDPOINT, contextPath + "/api/job-scheduling/v1/Job", "Job");
      writer.printf(ENDPOINT, contextPath + "/api/job-scheduling/v1/JobParameter", "JobParameter");
      writer.printf(ENDPOINT, contextPath + "/api/job-scheduling/v1/JobResult", "JobResult");
      writer.printf(ENDPOINT, contextPath + "/api/job-scheduling/v1/JobResultMessage", "JobResultMessage");
      writer.print(ENDPOINT_END);
    }

    @Override
    public int order() {
      return -30;
    }
  }
}
