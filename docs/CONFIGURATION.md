# Configuration Reference

This document details all configuration files and environment variables for the OKR Tracker application.

---

## Backend Configuration

### Main Properties (`application.properties`)

Location: `ccc-okr-tracker-gemini-backend/src/main/resources/application.properties`

```properties
# Application name
spring.application.name=okr-tracker-backend

# Default profile (production)
spring.profiles.default=prod

# Server port
server.port=8080

# Jackson JSON configuration
spring.jackson.serialization.WRITE_DATES_AS_TIMESTAMPS=false
spring.jackson.deserialization.FAIL_ON_UNKNOWN_PROPERTIES=false

# File upload limits (for CSV import)
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

---

### Development Profile (`application-dev.properties`)

Location: `ccc-okr-tracker-gemini-backend/src/main/resources/application-dev.properties`

```properties
# PostgreSQL connection (local)
spring.datasource.url=jdbc:postgresql://localhost:5432/okr_tracker_db
spring.datasource.username=postgres
spring.datasource.password=postgres

# JPA settings
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Liquibase (enabled for development)
spring.liquibase.enabled=true
spring.liquibase.change-log=classpath:db/changelog/db.changelog-master.yaml

# Keycloak OAuth2
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://auth.ccc.net/auth/realms/Apps

# Logging
logging.level.com.ccc.okrtracker=DEBUG
logging.level.org.springframework.security=DEBUG
```

---

### Production Profile (`application-prod.properties`)

Location: `ccc-okr-tracker-gemini-backend/src/main/resources/application-prod.properties`

```properties
# PostgreSQL connection (production)
spring.datasource.url=jdbc:postgresql://postgres.ccc.net:5432/ccc_okr_db
spring.datasource.username=okruser
spring.datasource.password=${DB_PASSWORD:changeme}

# Context path for Tomcat deployment
server.servlet.context-path=/okr-tracker-backend

# JPA settings
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

# Liquibase (disabled - use manual migrations)
spring.liquibase.enabled=false

# Keycloak OAuth2
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://auth.ccc.net/auth/realms/Apps

# Logging
logging.level.com.ccc.okrtracker=INFO
logging.level.org.springframework.security=WARN
```

---

## Frontend Configuration

### Development Environment (`.env.development`)

Location: `ccc-okr-tracker-gemini/.env.development`

```env
# API endpoint (local backend)
VITE_API_BASE_URL=http://localhost:8080

# Keycloak settings
VITE_KEYCLOAK_URL=https://auth.ccc.net/auth
VITE_KEYCLOAK_REALM=Apps
VITE_KEYCLOAK_CLIENT_ID=frontend
```

---

### Production Environment (`.env.production`)

Location: `ccc-okr-tracker-gemini/.env.production`

```env
# API endpoint (production backend)
VITE_API_BASE_URL=http://10.1.155.28:8090/okr-tracker-backend

# Keycloak settings
VITE_KEYCLOAK_URL=https://auth.ccc.net/auth
VITE_KEYCLOAK_REALM=Apps
VITE_KEYCLOAK_CLIENT_ID=frontend
```

---

### Vite Configuration (`vite.config.ts`)

Location: `ccc-okr-tracker-gemini/vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4200,      // Dev server port
    open: true       // Open browser on start
  },
  build: {
    outDir: 'dist'   // Build output directory
  }
})
```

---

### TypeScript Configuration (`tsconfig.json`)

Location: `ccc-okr-tracker-gemini/tsconfig.json`

Key settings:
- `target`: ES2020
- `module`: ESNext
- `strict`: true
- `jsx`: react-jsx

---

## Keycloak Configuration

### Realm Settings

| Setting | Value |
|---------|-------|
| Realm | Apps |
| Client ID | frontend |
| Client Protocol | openid-connect |
| Access Type | public |
| Valid Redirect URIs | http://localhost:4200/*, http://10.1.155.28:8080/* |
| Web Origins | http://localhost:4200, http://10.1.155.28:8080 |

### Token Configuration

- Access Token Lifespan: 5 minutes
- SSO Session Idle: 30 minutes
- SSO Session Max: 10 hours

---

## Database Configuration

### PostgreSQL Settings

**Development:**
```
Host: localhost
Port: 5432
Database: okr_tracker_db
User: postgres
Password: postgres
```

**Production:**
```
Host: postgres.ccc.net
Port: 5432
Database: ccc_okr_db
User: okruser
Password: <secure_password>
```

### Connection Pool (HikariCP)

Defaults used (Spring Boot auto-configuration):
- Maximum Pool Size: 10
- Minimum Idle: 10
- Connection Timeout: 30000ms
- Idle Timeout: 600000ms

To customize, add to properties:
```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

---

## CORS Configuration

Defined in `SecurityConfig.java`:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(
        "http://localhost:4200",           // Local dev
        "http://10.1.155.28:8080",         // Production frontend
        "http://10.1.155.28"               // Production base
    ));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);
    // ...
}
```

---

## Build Configuration

### Maven (`pom.xml`)

Key dependencies and their versions:

| Dependency | Version |
|------------|---------|
| Spring Boot | 3.2.1 |
| Java | 17 |
| PostgreSQL Driver | (managed by Spring Boot) |
| Liquibase | (managed by Spring Boot) |
| Lombok | (managed by Spring Boot) |
| Apache Commons CSV | 1.10.0 |

**Packaging:** WAR (for Tomcat deployment)

### Maven Profiles

```xml
<profiles>
    <profile>
        <id>dev</id>
        <properties>
            <spring.profiles.active>dev</spring.profiles.active>
        </properties>
    </profile>
</profiles>
```

Run with dev profile: `mvn spring-boot:run -Pdev`

---

### npm (`package.json`)

Key dependencies:

| Dependency | Version |
|------------|---------|
| React | 19.1.0 |
| React DOM | 19.1.0 |
| React Router DOM | 7.6.1 |
| Keycloak-js | 25.0.0 |
| Tailwind CSS | 4.1.7 |
| Vite | 6.3.5 |
| TypeScript | 5.8.3 |

---

## IDE Configuration

### VS Code (`.vscode/settings.json`)

```json
{
  "java.configuration.updateBuildConfiguration": "automatic",
  "java.compile.nullAnalysis.mode": "automatic",
  "java.project.sourcePaths": [
    "ccc-okr-tracker-gemini-backend/src/main/java",
    "ccc-okr-tracker-gemini-backend/src/test/java"
  ]
}
```

### Cursor (`.cursorrules`)

Contains project-specific AI assistant rules for consistent code generation.

---

## Environment Variables Summary

### Backend (Java)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | changeme | Database password (production) |
| `SPRING_PROFILES_ACTIVE` | prod | Active Spring profile |

### Frontend (Vite)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_KEYCLOAK_URL` | Keycloak server URL |
| `VITE_KEYCLOAK_REALM` | Keycloak realm name |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID |

> **Note:** Vite environment variables must be prefixed with `VITE_` to be exposed to the frontend code.

---

## Git Configuration

### Proxy (Corporate Network)

```bash
git config --global http.proxy http://proxya.gr.ccg.local:8080
git config --global https.proxy http://proxya.gr.ccg.local:8080
```

To remove:
```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
```
