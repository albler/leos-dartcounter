package com.dartcounter.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${auth0.audience}")
    private String audience;

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuer;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints - game functionality works without auth
                .requestMatchers("/").permitAll()
                .requestMatchers("/index.html").permitAll()
                .requestMatchers("/app.js").permitAll()
                .requestMatchers("/styles.css").permitAll()
                .requestMatchers("/favicon.ico").permitAll()
                .requestMatchers("/ws/**").permitAll()  // WebSocket
                .requestMatchers(HttpMethod.POST, "/api/sessions").permitAll()  // Create game
                .requestMatchers(HttpMethod.GET, "/api/sessions/**").permitAll()  // Get game state
                .requestMatchers(HttpMethod.POST, "/api/sessions/*/join").permitAll()  // Join game
                .requestMatchers(HttpMethod.POST, "/api/sessions/*/start").permitAll()  // Start game
                .requestMatchers(HttpMethod.POST, "/api/sessions/*/reset").permitAll()  // Reset game
                // Protected endpoints - require authentication
                .requestMatchers("/api/auth/**").authenticated()
                .requestMatchers("/api/users/**").authenticated()
                .requestMatchers("/api/stats/**").authenticated()
                // Allow everything else (static resources, SPA routes)
                .anyRequest().permitAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.decoder(jwtDecoder()))
            );

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder jwtDecoder = JwtDecoders.fromOidcIssuerLocation(issuer);

        OAuth2TokenValidator<Jwt> audienceValidator = new AudienceValidator(audience);
        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuer);
        OAuth2TokenValidator<Jwt> withAudience = new DelegatingOAuth2TokenValidator<>(withIssuer, audienceValidator);

        jwtDecoder.setJwtValidator(withAudience);

        return jwtDecoder;
    }
}
