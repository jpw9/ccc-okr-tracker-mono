# Development Workflow

This guide covers day-to-day development tasks for the OKR Tracker.

---

## Quick Commands

### Start Local Development

```batch
:: Terminal 1 - Backend (from project root)
cd ccc-okr-tracker-gemini-backend
mvn spring-boot:run -Pdev

:: Terminal 2 - Frontend (from project root)
cd ccc-okr-tracker-gemini
npm run dev
```

**Access:**
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080/api

---

## Backend Development

### Running the Backend

```batch
cd ccc-okr-tracker-gemini-backend

:: With dev profile (local PostgreSQL, Liquibase enabled)
mvn spring-boot:run -Pdev

:: With default prod profile (requires prod database)
mvn spring-boot:run
```

### Building

```batch
:: Build WAR (skip tests for speed)
mvn clean package -DskipTests

:: Build with tests
mvn clean package
```

### Running Tests

```batch
mvn test
```

### Adding a Database Migration

1. Create new changelog file in `src/main/resources/db/changelog/`:
   ```yaml
   # v1.2.0-new-feature.yaml
   databaseChangeLog:
     - changeSet:
         id: add-new-column
         author: your.name
         changes:
           - addColumn:
               tableName: project
               columns:
                 - column:
                     name: new_field
                     type: varchar(255)
   ```

2. Include in `db.changelog-master.yaml`:
   ```yaml
   databaseChangeLog:
     - include: v1.0.0-initial-schema.yaml
     - include: v1.1.0-project-access-control.yaml
     - include: v1.2.0-new-feature.yaml  # Add here
   ```

3. Run with dev profile to apply automatically.

---

## Frontend Development

### Running the Frontend

```batch
cd ccc-okr-tracker-gemini
npm run dev
```

Opens at http://localhost:4200 with hot reload.

### Building for Production

```batch
npm run build
```

Output in `dist/` folder.

### Linting

```batch
npm run lint
```

### Type Checking

```batch
npx tsc --noEmit
```

---

## Making Changes

### Adding a New API Endpoint

1. **Add service method** in `service/HierarchyService.java` (or create new service)

2. **Add controller endpoint** in appropriate controller:
   ```java
   @GetMapping("/new-endpoint")
   @PreAuthorize("hasAuthority('VIEW_STRATEGY')")
   public ResponseEntity<Data> newEndpoint() {
       return ResponseEntity.ok(service.getData());
   }
   ```

3. **Add frontend API call** in `services/dataService.ts`:
   ```typescript
   export async function getNewData(): Promise<Data> {
     const res = await fetch(`${API_BASE}/new-endpoint`, {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     return res.json();
   }
   ```

### Adding a New Entity

1. Create entity in `entity/` package
2. Create repository in `repository/` package
3. Add Liquibase migration for table
4. Add TypeScript interface in `types.ts`
5. Update API and frontend as needed

---

## Debugging

### Backend Debug Mode (VS Code)

1. Install "Extension Pack for Java"
2. Open any Java file
3. Click "Run | Debug" above `main()` method
4. Or use F5 with launch configuration

### Frontend Debug Mode

1. Open Chrome DevTools (F12)
2. Use Sources tab for breakpoints
3. React DevTools extension for component inspection

### Common Debug Points

- `SecurityConfig.java` - Authentication issues
- `HierarchyService.java` - OKR CRUD logic
- `CalculationService.java` - Progress rollup
- `dataService.ts` - API calls
- `KeycloakProvider.tsx` - Auth flow

---

## Testing

### Backend Unit Tests

Location: `src/test/java/com/ccc/okrtracker/`

```batch
:: Run all tests
mvn test

:: Run specific test class
mvn test -Dtest=HierarchyServiceTest

:: Run with coverage
mvn test jacoco:report
```

### Manual API Testing

Use curl or Postman:

```bash
# Get JWT token from Keycloak first, then:
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/api/hierarchy/projects
```

---

## Git Workflow

### Feature Branch

```batch
:: Create feature branch
git checkout -b feature/your-feature-name

:: Make changes and commit
git add .
git commit -m "feat: description of changes"

:: Push to remote
git push -u origin feature/your-feature-name
```

### Commit Message Convention

```
type: description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance
```

---

## Deployment Workflow

### Build and Deploy to Production

```batch
:: 1. Build everything
build-for-tomcat.bat

:: 2. Copy to server
scp build-output/okr-tracker-backend.war admin@10.1.155.29:/tmp/
scp build-output/okr-tracker-ui.war admin@10.1.155.29:/tmp/

:: 3. SSH to server and deploy (see DEPLOYMENT.md)
```

---

## Troubleshooting Development Issues

### "Cannot find module" errors in frontend

```batch
cd ccc-okr-tracker-gemini
rm -rf node_modules
npm install
```

### Backend won't compile

```batch
cd ccc-okr-tracker-gemini-backend
mvn clean
mvn compile
```

### Database connection errors (dev)

Ensure PostgreSQL is running:
```batch
:: Windows
net start postgresql-x64-15

:: Or check services.msc
```

### Keycloak login loop

Check browser console for CSP errors. The `checkLoginIframe: false` setting should prevent this.

### CORS errors on localhost

Verify backend is running on port 8080 and frontend on 4200. Check `SecurityConfig.java` for allowed origins.

---

## Useful URLs (Development)

| Resource | URL |
|----------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:8080/api |
| H2 Console (if enabled) | http://localhost:8080/h2-console |
| Keycloak Admin | https://auth.ccc.net/auth/admin |
| PostgreSQL (local) | localhost:5432/okr_tracker_db |
