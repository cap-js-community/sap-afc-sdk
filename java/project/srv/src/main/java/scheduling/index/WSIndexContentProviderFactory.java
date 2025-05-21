package scheduling.index;

import com.sap.cds.adapter.IndexContentProvider;
import com.sap.cds.adapter.IndexContentProviderFactory;

import java.io.PrintWriter;

public class WSIndexContentProviderFactory implements IndexContentProviderFactory {

    @Override
    public IndexContentProvider create() {
        return new UiIndexContentProvider();
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    private static class UiIndexContentProvider implements IndexContentProvider {

        private static final String HEADER = "" +
                "                <h3 class=\"header\">\n" +
                "                    <a href=\"/ws/job-scheduling\"><span>/ws/job-scheduling</span></a>\n" +
                "                </h3>\n";

        @Override
        public String getSectionTitle() {
            return "WS endpoints";
        }

        @Override
        public void writeContent(PrintWriter writer, String contextPath) {
            writer.print(HEADER);
        }

    }

}