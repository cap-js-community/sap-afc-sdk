package scheduling.configuration;

import cds.gen.scheduling.JobStatusCode;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class AFCSDKTestSimpleFailedConfig {

    @Bean
    public AFCSDKProperties afcsdkProperties() {
        AFCSDKProperties properties = new AFCSDKProperties();

        AFCSDKProperties.MockProcessing mockProcessing = new AFCSDKProperties.MockProcessing();
        mockProcessing.setDefault(JobStatusCode.FAILED);
        properties.setMockProcessing(mockProcessing);

        return properties;
    }
}