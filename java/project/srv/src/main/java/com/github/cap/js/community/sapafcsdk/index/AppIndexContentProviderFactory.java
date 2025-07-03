package com.github.cap.js.community.sapafcsdk.index;

import static com.github.cap.js.community.sapafcsdk.configuration.AfcSdkProperties.APPS;

import com.sap.cds.adapter.IndexContentProvider;
import com.sap.cds.adapter.IndexContentProviderFactory;
import com.sap.cds.services.runtime.CdsRuntime;
import com.sap.cds.services.runtime.CdsRuntimeAware;
import java.io.PrintWriter;

public class AppIndexContentProviderFactory implements IndexContentProviderFactory, CdsRuntimeAware {

  private CdsRuntime runtime;

  @Override
  public IndexContentProvider create() {
    return new UiIndexContentProvider(this.runtime);
  }

  @Override
  public boolean isEnabled() {
    return this.runtime.getEnvironment().getProperty("sap-afc-sdk.ui.enabled", Boolean.class, false);
  }

  @Override
  public void setCdsRuntime(CdsRuntime runtime) {
    this.runtime = runtime;
  }

  private static class UiIndexContentProvider implements IndexContentProvider {

    private static final String ENDPOINT_START = "" + "                <ul>\n";

    private static final String ENDPOINT =
      "" +
      "                    <li>\n" +
      "                        <div><a href=\"%s\"><span>%s</span></a></div>\n" +
      "                    </li>\n";

    private static final String ENDPOINT_END = "" + "                </ul>\n";

    private final CdsRuntime runtime;

    public UiIndexContentProvider(CdsRuntime runtime) {
      this.runtime = runtime;
    }

    @Override
    public String getSectionTitle() {
      return "Web Applications";
    }

    @Override
    public void writeContent(PrintWriter writer, String contextPath) {
      writer.print(ENDPOINT_START);
      writer.printf(ENDPOINT, contextPath + "/launchpad.html", "/launchpad.html");
      for (String app : this.runtime.getEnvironment().getProperty(
        "sap-afc-sdk.ui.apps",
        String[].class,
        APPS.toArray(new String[0])
      )) {
        writer.printf(ENDPOINT, contextPath + "/" + app + "/webapp/index.html", "/" + app);
      }
      writer.print(ENDPOINT_END);
    }

    @Override
    public int order() {
      return -40;
    }
  }
}
