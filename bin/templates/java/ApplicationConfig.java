package customer;

import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.cloud.servicebroker.autoconfigure.web.ServiceBrokerAutoConfiguration;
import org.springframework.cloud.servicebroker.autoconfigure.web.servlet.ServiceBrokerWebMvcAutoConfiguration;

@Configuration
@EnableAutoConfiguration(exclude = {
    ServiceBrokerAutoConfiguration.class,
    ServiceBrokerWebMvcAutoConfiguration.class
})
public class ApplicationConfig {
}