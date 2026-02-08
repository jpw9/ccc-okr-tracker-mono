# Copilot Instructions for OKR Tracker

## Project Overview
This is a monorepo containing a React frontend and Spring Boot backend for OKR (Objectives and Key Results) tracking.

## Architecture (Always Reference)
- **Frontend**: `ccc-okr-tracker-gemini/` - React 19, Vite 6, TypeScript, Tailwind CSS 4
- **Backend**: `ccc-okr-tracker-gemini-backend/` - Spring Boot 3.2.1, Java 17, Maven
- **Database**: PostgreSQL with Liquibase migrations
- **Auth**: Keycloak (OAuth2/OIDC)

## Entity Hierarchy (Critical)
```
Project → StrategicInitiative → Goal → Objective → KeyResult → ActionItem
```
Progress rolls up from bottom to top automatically via `CalculationService.java`.

## Coding Standards

### Frontend (TypeScript/React)
- Components go in `components/` with folder per feature (e.g., `Dashboard/`, `Hierarchy/`)
- Each component folder has: `index.tsx`, `*View.tsx`, `use*.ts` (hook), `styles.ts`
- Use existing patterns from `components/shared/TreeViewShared.tsx`
- API calls go through `services/dataService.ts` (single entry point)
- Types are defined in `types.ts` at root

### Backend (Java/Spring Boot)
- Follow existing package structure: `controller/`, `service/`, `repository/`, `entity/`
- Use `@PreAuthorize` for security checks
- All entities have `isActive` (soft delete), `createdAt`, `updatedAt`
- Database changes via Liquibase in `src/main/resources/db/changelog/`

## Production Environment
- **Server**: 10.1.155.29 (SSH user: gitlab1)
- **Tomcat 10**: Port 8443 (HTTPS), path `/opt/tomcat10`
- **Frontend URL**: https://10.1.155.29:8443/cccokrtracker/
- **Backend URL**: https://10.1.155.29:8443/okr-tracker-backend/api

## Deploy Commands
```powershell
.\deploy              # Full deploy (frontend + backend)
.\deploy -FrontendOnly
.\deploy -BackendOnly
```

## Key Files to Check Before Changes
- `docs/ARCHITECTURE.md` - System design, entity model
- `types.ts` - TypeScript interfaces
- `services/dataService.ts` - API service layer
- `components/Layout.tsx` - Navigation structure

## Current State / Known Issues
<!-- Update this section as project evolves -->
- Hide Progress toggle: Implemented in Hierarchy and My Objectives views
- Case-insensitive email lookup: Fixed in UserRepository.java
- All Tomcat 9 references removed - using Tomcat 10 only

## Completed Features
<!-- Completed features with reference documentation -->

### Mindmap View (Completed: Feb 6, 2026)
- **Spec:** `docs/features/MINDMAP.md`, `docs/features/MINDMAP_CHANGELOG.md`
- **Component:** `components/Mindmap/`
- **Tech Stack:** React Flow (@xyflow/react), TypeScript, Tailwind CSS
- **Description:** Interactive mindmap visualization of project hierarchy with compact nodes, curved bezier edges, expand/collapse functionality, zoom controls, and color-coded legend
- **Key components:** MindmapView, MindmapNode, MindmapControls, useMindmap hook, layoutUtils
- **Features:** Click nodes to expand/collapse, keyboard shortcuts (E/C/F/?), hover tooltips, project selector dropdown
- **Implementation notes:** Uses simplebezier edges, custom tree layout algorithm, compact 100x28px nodes, 7px font with text truncation

## Features in Progress
<!-- Reference feature specs when implementing -->
<!-- No features currently in active development -->
