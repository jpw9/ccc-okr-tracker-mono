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
- All `@OneToMany` collections use `@BatchSize(size = 50)` to prevent N+1 queries
- `CalculationService` relies on Hibernate dirty-checking within `@Transactional` — do NOT add individual `save()` calls on managed entities
- Avoid `entityManager.clear()` — use `entityManager.refresh(entity)` for specific entities instead

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

## Current Focus
<!-- Update this when starting work on a new screen -->
**Status:** Idle
**Last Updated:** Feb 13, 2026
**Current Task:** None - Gantt Chart implementation completed
**Backlog:** See `docs/BACKLOG.md` for full list

## Current State / Known Issues
<!-- Update this section as project evolves -->
- Modern filter bar design: Completed for Hierarchy and My Objectives (Feb 8, 2026)
- Hide Progress toggle: Implemented in Hierarchy and My Objectives views
- Case-insensitive email lookup: Fixed in UserRepository.java
- All Tomcat 9 references removed - using Tomcat 10 only
- Action Item consistency: Progress and isCompleted automatically synced (Feb 8, 2026)
- User Management: Added inactive user toggle and reactivation (Feb 12, 2026)
- User Management: Fixed createUser to properly handle roles and project assignments (Feb 12, 2026)
- Deploy script: -BackendOnly flag now skips frontend build (Feb 12, 2026)
- API routing fix: addEntity endpoints in dataService.ts were missing `/api` prefix, causing 403 on all create operations (Feb 13, 2026)
- System Administrator role: Now automatically granted all permissions regardless of role_permissions table (Feb 13, 2026)
- Gantt Chart: Fully implemented with drag-and-drop, filters, objective modal, custom task list (Feb 13, 2026)
- Performance: N+1 query fix via `@BatchSize(50)` on all entity collections + `hibernate.default_batch_fetch_size=50` (Feb 13, 2026)
- Performance: Removed redundant `flush()`, `findById()` re-fetches, and verbose `logger.info()` from all update methods (Feb 13, 2026)
- Performance: `CalculationService.recalculateProject()` no longer calls individual `save()` on every entity — relies on Hibernate dirty-checking (Feb 13, 2026)
- Performance: `getAllProjects()` uses `findByIdInAndIsActiveTrue()` instead of loading all projects and filtering in memory (Feb 13, 2026)
- isActive filtering: Mindmap and Gantt views now filter out soft-deleted entities at all hierarchy levels (Feb 13, 2026)
- Clear All Filters: Added to Hierarchy and My Objectives filter bars (Feb 13, 2026)

## Completed Features
<!-- Completed features with reference documentation -->

### Modern Filter Bar UI (Completed: Feb 8-9, 2026)
- **Screens:** Hierarchy View, My Objectives
- **Description:** Modern, compact filter bar design with grouped controls, gradient backgrounds, and improved visual hierarchy
- **Key improvements:** Gradient card backgrounds, compact form controls (h-8), grouped filter sections with white cards, better toggle buttons with brand colors, visual dividers, consistent spacing
- **Responsive:** Optimized flex wrapping, truncated text with tooltips, selection count display for multi-select dropdowns

### Mindmap View (Completed: Feb 6, 2026)
- **Spec:** `docs/features/MINDMAP.md`, `docs/features/MINDMAP_CHANGELOG.md`
- **Component:** `components/Mindmap/`
- **Tech Stack:** React Flow (@xyflow/react), TypeScript, Tailwind CSS
- **Description:** Interactive mindmap visualization of project hierarchy with compact nodes, curved bezier edges, expand/collapse functionality, zoom controls, and color-coded legend
- **Key components:** MindmapView, MindmapNode, MindmapControls, useMindmap hook, layoutUtils
- **Features:** Click nodes to expand/collapse, keyboard shortcuts (E/C/F/?), hover tooltips, project selector dropdown
- **Implementation notes:** Uses simplebezier edges, custom tree layout algorithm, compact 100x28px nodes, 7px font with text truncation

### Gantt Chart (Completed: Feb 13, 2026)
- **Spec:** `docs/features/GANTT_CHART.md`
- **Component:** `components/Gantt/`
- **Tech Stack:** gantt-task-react, TypeScript, Tailwind CSS
- **Description:** Interactive Gantt chart showing Objectives on a timeline, grouped by Project → Initiative → Goal hierarchy
- **Key components:** GanttView, CustomTaskList (resizable columns), ObjectiveModal, useGantt hook
- **Features:** Drag-and-drop timeline editing (admin-only), project/quarter/year filters, zoom controls (Day/Week/Month/Year), expand/collapse hierarchy, click objective to view Key Results in modal
- **Access:** Visible to users with VIEW_STRATEGY or MANAGE_STRATEGY; drag-and-drop restricted to System Administrators (isSystem role)
- **Color coding:** Objective bars colored by parent Goal ID; 10-color palette with transparency for grouping rows
- **Data flow:** Start date derived from Objective's year+quarter; end date from dueDate; drag updates dueDate and quarter via dataService.updateEntity

### System Administrator Permissions (Completed: Feb 13, 2026)
- **Component:** `UserService.java` (mapJwtToAuthorities)
- **Description:** System Administrator role (identified by `role.isSystem = true` and `name = 'System Administrator'`) now automatically receives all application permissions regardless of what's configured in role_permissions table
- **Permissions granted:** MANAGE_STRATEGY, VIEW_STRATEGY, MANAGE_USERS, MANAGE_ROLES

## Features in Progress
<!-- Reference feature specs when implementing -->
<!-- No features currently in active development -->
