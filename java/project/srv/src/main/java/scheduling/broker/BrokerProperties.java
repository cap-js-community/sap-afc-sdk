package scheduling.broker;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "broker")
public class BrokerProperties {

    private String name;
    private boolean enabled;
    private String user;
    private String credentialsHash;
    private Map<String, String> endpoints;
    private List<String> credentialTypes;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getCredentialsHash() {
        return credentialsHash;
    }

    public void setCredentialsHash(String credentialsHash) {
        this.credentialsHash = credentialsHash;
    }

    public Map<String, String> getEndpoints() {
        return endpoints;
    }

    public void setEndpoints(Map<String, String> endpoints) {
        this.endpoints = endpoints;
    }

    public List<String> getCredentialTypes() {
        return credentialTypes;
    }

    public void setCredentialTypes(List<String> credentialTypes) {
        this.credentialTypes = credentialTypes;
    }
}
