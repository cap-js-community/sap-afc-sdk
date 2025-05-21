package scheduling.configuration;

import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.cloud.servicebroker.autoconfigure.web.ServiceBrokerAutoConfiguration;
import org.springframework.cloud.servicebroker.autoconfigure.web.servlet.ServiceBrokerWebMvcAutoConfiguration;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableAutoConfiguration(exclude = {
        ServiceBrokerAutoConfiguration.class,
        ServiceBrokerWebMvcAutoConfiguration.class
})
public class AppConfig {
}