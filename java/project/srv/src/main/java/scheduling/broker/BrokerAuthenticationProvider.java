package scheduling.broker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.Objects;

@Component
public class BrokerAuthenticationProvider implements AuthenticationProvider {

    static Logger log = LoggerFactory.getLogger("brokerSecurity");

    @Autowired
    private BrokerProperties brokerProperties;

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String username = authentication.getName();
        String password = authentication.getCredentials().toString();
        if (verifyHashedCredentials(username, password)) {
            List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("broker"));
            return new UsernamePasswordAuthenticationToken(username, password, authorities);
        }
        throw new BadCredentialsException("Invalid credentials");
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }

    public boolean verifyHashedCredentials(String username, String password) {
        if (!Objects.equals(brokerProperties.getUser(), username)) {
            return false;
        }
        String expected = brokerProperties.getCredentialsHash();
        boolean authorized = false;
        if (expected != null) {
            String[] parts = expected.split(":");
            if (parts.length != 3) {
                log.debug("Invalid expected credential format");
                return false;
            }

            String algo = parts[0];
            byte[] salt = Base64.getDecoder().decode(parts[1]);
            byte[] expectedDigest = Base64.getDecoder().decode(parts[2]);
            try {
                MessageDigest md = MessageDigest.getInstance(algo);
                md.update(salt);
                md.update(password.getBytes(StandardCharsets.UTF_8));
                byte[] providedDigest = md.digest();

                authorized = MessageDigest.isEqual(providedDigest, expectedDigest);
            } catch (NoSuchAlgorithmException e) {
                log.debug("Unknown hash algorithm: {}", algo);
            }
        }
        if (!authorized) {
            log.debug("Hashed basic credentials do not match");
        }
        return authorized;
    }
}