package com.github.cap.js.community.sapafcsdk.broker;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@Order(1)
public class BrokerSecurityConfig {

  @Autowired
  private BrokerAuthenticationProvider brokerAuthenticationProvider;

  @Bean
  public SecurityFilterChain brokerFilterChain(HttpSecurity http) throws Exception {
    return http
      .csrf(AbstractHttpConfigurer::disable)
      .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .securityMatcher("/broker/**")
      .authenticationManager(authenticationManager())
      .authorizeHttpRequests(request -> request.anyRequest().authenticated())
      .httpBasic(Customizer.withDefaults())
      .build();
  }

  @Bean
  public AuthenticationManager authenticationManager() {
    return new ProviderManager(List.of(brokerAuthenticationProvider));
  }
}
