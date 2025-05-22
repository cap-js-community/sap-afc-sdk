package com.github.cap.js.community.sapafcsdk.scheduling.index;

import com.sap.cds.adapter.IndexContentProvider;
import com.sap.cds.adapter.IndexContentProviderFactory;
import java.io.PrintWriter;

public class APIIndexContentProviderFactory implements IndexContentProviderFactory {

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
      "                    <a href=\"/api/job-scheduling/v1\"><span>/api/job-scheduling/v1</span></a><span>/</span><a href=\"/api-docs/api/job-scheduling/v1\"><span class=\"metadata\">Open API</span></a>\n" +
      "                </h3>\n";

    private static final String ENDPOINT_START = "" + "                <ul>\n";

    private static final String ENDPOINT =
      "" +
      "                    <li>\n" +
      "                        <div><a href=\"/api/job-scheduling/v1/%s\"><span>%s</span></a></div>\n" +
      "                        <div><a href=\"/api-docs/api/job-scheduling/v1\"><span class=\"metadata\">Open API</span></a></div>\n" +
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
      writer.printf(ENDPOINT, contextPath + "JobDefinition", "JobDefinition");
      // writer.printf(ENDPOINT, contextPath + "JobParameterDefinition", "JobParameterDefinition");
      writer.printf(ENDPOINT, contextPath + "Job", "Job");
      // writer.printf(ENDPOINT, contextPath + "JobParameter", "JobParameter");
      writer.printf(ENDPOINT, contextPath + "JobResult", "JobResult");
      // writer.printf(ENDPOINT, contextPath + "JobResultMessage", "JobResultMessage");
      writer.print(ENDPOINT_END);
    }
  }
}
