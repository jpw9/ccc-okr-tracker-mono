package com.ccc.okrtracker;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * Required for WAR deployment to external Tomcat server.
 * This class extends SpringBootServletInitializer to configure the application
 * when deployed as a WAR file instead of being run with the embedded Tomcat.
 */
public class ServletInitializer extends SpringBootServletInitializer {
    
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(OkrTrackerApplication.class);
    }
}
