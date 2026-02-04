# Getting Started

Complete guide to setting up the OKR Tracker development environment.

## Prerequisites

| Requirement | Version | Download |
|-------------|---------|----------|
| Java JDK | 17+ | [Adoptium](https://adoptium.net/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| PostgreSQL | 15+ | [postgresql.org](https://www.postgresql.org/) |
| Maven | 3.8+ | Included via `mvnw` wrapper |

## Database Setup

### 1. Create Database

```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE okr_tracker_db;
CREATE USER postgres WITH PASSWORD 'Pa55w0rd';
GRANT ALL PRIVILEGES ON DATABASE okr_tracker_db TO postgres;
```

### 2. Verify Connection

```bash
psql -h localhost -U postgres -d okr_tracker_db
```

## Backend Setup

### 1. Navigate to Backend

```bash
cd ccc-okr-tracker-gemini-backend
```

### 2. Run with Dev Profile

The `pom.xml` is configured to automatically use the `dev` profile when running locally:

```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

### 3. Verify Backend

```bash
curl http://localhost:8080/api/user/me
# Should return 401 (requires authentication)
```

### Configuration Files

| File | Purpose |
|------|---------|
| `application.properties` | Base configuration (defaults to prod) |
| `application-dev.properties` | Local development settings |
| `application-prod.properties` | Production server settings |

## Frontend Setup

### 1. Navigate to Frontend

```bash
cd ccc-okr-tracker-gemini
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Access Application

Open http://localhost:4200 in your browser.

### Environment Files

| File | Purpose |
|------|---------|
| `.env.development` | Local development (localhost:8080) |
| `.env.production` | Production server settings |

## Authentication

The application uses **Keycloak** for authentication. You need valid Keycloak credentials to log in.

**Keycloak Configuration:**
- URL: https://auth.ccc.net/auth
- Realm: Apps
- Client ID: frontend

## Verify Everything Works

1. ✅ Backend starts without errors on port 8080
2. ✅ Frontend starts without errors on port 4200
3. ✅ Keycloak login redirects properly
4. ✅ After login, API calls return data

## Common Issues

### Backend won't start

**Issue**: `Connection refused` to database
```
Solution: Ensure PostgreSQL is running and database exists
```

**Issue**: `Port 8080 already in use`
```bash
# Find and kill process
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```

### Frontend CORS errors

**Issue**: `CORS policy blocked`
```
Solution: Verify backend is running and CORS origins include localhost:4200
```

### Keycloak errors

**Issue**: `Invalid redirect_uri`
```
Solution: Ensure localhost:4200 is registered in Keycloak client settings
```

## Next Steps

- [Architecture Overview](ARCHITECTURE.md)
- [API Reference](API-REFERENCE.md)
- [Deployment Guide](DEPLOYMENT.md)
