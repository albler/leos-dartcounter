package com.dartcounter.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
            .addResourceLocations("classpath:/static/")
            .resourceChain(false)
            .addResolver(new PathResourceResolver() {
                @Override
                protected Resource getResource(String resourcePath, Resource location) throws IOException {
                    Resource requestedResource = location.createRelative(resourcePath);

                    // If the resource exists and is readable, return it
                    if (requestedResource.exists() && requestedResource.isReadable()) {
                        return requestedResource;
                    }

                    // For API and WebSocket paths, return null to let other handlers process
                    if (resourcePath.startsWith("api/") || resourcePath.startsWith("ws")) {
                        return null;
                    }

                    // Only forward to index.html for paths without file extensions (SPA routes)
                    if (resourcePath.contains(".")) {
                        return null;
                    }

                    // For all other paths (SPA routes), return index.html
                    return new ClassPathResource("/static/index.html");
                }
            });
    }
}
