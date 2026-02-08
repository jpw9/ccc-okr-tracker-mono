# Deployment Guide

## Overview

The OKR Tracker is deployed as two separate WAR files on **Tomcat 10** (port 8090):
- **Backend**: Spring Boot 3 WAR (`okr-tracker-backend.war`)
- **Frontend**: Static React build as WAR (`cccokrtracker.war`)

> **Note**: Spring Boot 3 requires Jakarta EE (Tomcat 10+). Both applications run on the same Tomcat instance.

---

## Prerequisites

### Production Server (10.1.155.29)

- Java 17 installed
- Tomcat 10 - `/opt/tomcat10` (port 8090)
- PostgreSQL access to `postgres.ccc.net:5432`
- Network access to Keycloak at `auth.ccc.net`

### Build Machine

- Java 17 JDK
- Node.js 18+ and npm
- Maven 3.8+

---

## Build Process

### Option 1: Automated Build Script (Recommended)

```batch
cd d:\Develop\okr-tracker-monorepo
build-for-tomcat.bat
```

This script:
1. Builds the backend WAR with Maven (prod profile)
2. Builds the frontend with Vite
3. Packages frontend as WAR
4. Copies both to `build-output/`

### Option 2: Manual Build

**Backend:**
```batch
cd ccc-okr-tracker-gemini-backend
mvn clean package -DskipTests
```

Output: `target/okr-tracker-backend-0.0.1-SNAPSHOT.war.original`

**Frontend:**
```batch
cd ccc-okr-tracker-gemini
npm install
npm run build
```

Output: `dist/` folder

---

## Deployment Steps

### 1. Transfer Files to Server

```bash
# From build machine
scp build-output/okr-tracker-backend.war admin@10.1.155.29:/tmp/
scp build-output/okr-tracker-ui.war admin@10.1.155.29:/tmp/
```

### 2. Deploy Backend (Tomcat 10)

```bash
# On production server
sudo systemctl stop tomcat10

# Copy WAR (rename to match context path)
sudo cp /tmp/okr-tracker-backend.war /opt/tomcat10/webapps/okr-tracker-backend.war

# Copy production properties
sudo cp /opt/tomcat10/conf/application-prod.properties \
        /opt/tomcat10/webapps/okr-tracker-backend/WEB-INF/classes/

# Start Tomcat
sudo systemctl start tomcat10

# Check logs
sudo tail -f /opt/tomcat10/logs/catalina.out
```

**Verify:** `https://10.1.155.29:8443/okr-tracker-backend/api/hierarchy/projects`

### 3. Deploy Frontend (Tomcat 10)

```bash
# On production server (WAR auto-deploys, no restart needed)
sudo cp /tmp/okr-tracker-ui.war /opt/tomcat10/webapps/cccokrtracker.war

# Or if you need to restart
sudo systemctl restart tomcat10

# Check logs
sudo tail -f /opt/tomcat10/logs/catalina.out
```

**Verify:** `https://10.1.155.29:8443/cccokrtracker/`

---

## Tomcat Configuration

### Tomcat 10 (`/opt/tomcat10`)

**`/opt/tomcat10/conf/server.xml`:**
```xml
<Connector port="8090" protocol="HTTP/1.1"
           connectionTimeout="20000"
           redirectPort="8443"
           maxParameterCount="1000" />
```

**`/opt/tomcat10/conf/application-prod.properties`:**
```properties
spring.profiles.active=prod
spring.datasource.url=jdbc:postgresql://postgres.ccc.net:5432/ccc_okr_db
spring.datasource.username=okruser
spring.datasource.password=<password>
server.servlet.context-path=/okr-tracker-backend
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://auth.ccc.net/auth/realms/Apps
```

---

## Environment-Specific Configuration

### Production (`.env.production`)

Located in frontend folder before build:

```env
VITE_API_BASE_URL=https://10.1.155.29:8443/okr-tracker-backend
VITE_KEYCLOAK_URL=https://auth.ccc.net/auth
VITE_KEYCLOAK_REALM=Apps
VITE_KEYCLOAK_CLIENT_ID=frontend
```

### Backend Profiles

| Profile | Database | Context Path | Liquibase |
|---------|----------|--------------|-----------|
| `prod` | postgres.ccc.net/ccc_okr_db | /okr-tracker-backend | disabled |
| `dev` | localhost/okr_tracker_db | none | enabled |

Production profile is **default** via `spring.profiles.default=prod`.

---

## Health Checks

### Backend Health

```bash
curl https://10.1.155.29:8443/okr-tracker-backend/actuator/health
```

### Frontend Availability

```bash
curl -I https://10.1.155.29:8443/cccokrtracker/
```

---

## Troubleshooting

### Backend won't start on Tomcat 9

**Error:** `ClassNotFoundException: jakarta.servlet.ServletException`

**Solution:** Spring Boot 3 requires Tomcat 10+. Use Tomcat 10 only.

---

### CORS errors in browser

**Error:** `Access-Control-Allow-Origin` missing

**Solution:** Verify `SecurityConfig.java` CORS settings include production origin:

```java
.allowedOrigins("https://10.1.155.29:8443")
```

---

### Database connection refused

**Error:** `Connection to postgres.ccc.net:5432 refused`

**Check:**
1. PostgreSQL is running
2. Firewall allows 5432 from app server
3. `pg_hba.conf` allows connection from app server IP

---

### Keycloak authentication fails

**Error:** `Invalid issuer`

**Check:**
1. `spring.security.oauth2.resourceserver.jwt.issuer-uri` matches exactly
2. Network path to `auth.ccc.net` is open
3. Keycloak realm "Apps" exists

---

### Frontend shows blank page

**Check:**
1. WAR extracted correctly in webapps
2. Browser console for JS errors
3. API calls return 200 (Network tab)

---

## Rollback Procedure

```bash
# Keep previous WAR backups
sudo cp /opt/tomcat10/webapps/okr-tracker-backend.war \
        /opt/tomcat10/webapps-backup/okr-tracker-backend.war.$(date +%Y%m%d)

# To rollback
sudo systemctl stop tomcat10
sudo cp /opt/tomcat10/webapps-backup/okr-tracker-backend.war.YYYYMMDD \
        /opt/tomcat10/webapps/okr-tracker-backend.war
sudo systemctl start tomcat10
```

---

## Service Management

```bash
# Tomcat 10 (both Frontend and Backend)
sudo systemctl start tomcat10
sudo systemctl stop tomcat10
sudo systemctl restart tomcat10
sudo systemctl status tomcat10

# View logs
sudo journalctl -u tomcat10 -f
sudo tail -f /opt/tomcat10/logs/catalina.out
```

---

## Production URLs

| Component | URL |
|-----------|-----|
| Frontend | https://10.1.155.29:8443/cccokrtracker/ |
| Backend API | https://10.1.155.29:8443/okr-tracker-backend/api |
| Keycloak | https://auth.ccc.net/auth/admin/Apps/console |
| PostgreSQL | postgres.ccc.net:5432/ccc_okr_db |
