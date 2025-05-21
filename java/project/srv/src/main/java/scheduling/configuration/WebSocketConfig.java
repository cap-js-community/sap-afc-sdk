package scheduling.configuration;

import com.sap.cds.reflect.CdsModel;
import com.sap.cds.reflect.CdsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import scheduling.common.SchedulingWebSocket;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static com.sap.cds.reflect.CdsAnnotatable.byAnnotation;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    public static final String WS_PATH = "/ws";

    @Autowired
    private SchedulingWebSocket schedulingWebSocket;

    @Autowired
    private AFCSDKProperties afcsdkProperties;

    @Autowired
    private CdsModel cdsModel;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        Stream<CdsService> services = cdsModel.services()
                .filter(byAnnotation("ws").or(byAnnotation("websocket")));
        for (CdsService service : services.toList()) {
            String path = service.getAnnotationValue("path", "");
            if (!path.isEmpty()) {
                List<String> paths = new ArrayList();
                paths.add(WS_PATH + "/" + path);
                for (String app : afcsdkProperties.getApps()) {
                    paths.add("/" + app + "/webapp" + WS_PATH + "/" + path);
                }
                registry.addHandler(schedulingWebSocket, paths.toArray(new String[0])).setAllowedOrigins("*");
            }
        }
    }
}
