package com.dartcounter.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker
        // Clients subscribe to /topic/session/{code} to receive updates
        config.enableSimpleBroker("/topic");

        // Prefix for messages FROM clients TO server
        // Clients send to /app/session/{code}/throw, /app/session/{code}/undo, etc.
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint that clients connect to
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
            .withSockJS(); // Fallback for browsers without WebSocket support

        // Also register without SockJS for native WebSocket clients
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*");
    }
}
