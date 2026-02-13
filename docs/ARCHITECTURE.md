# System Architecture

## Overview

The OKR Tracker follows a modern three-tier architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              React Frontend (Vite + TypeScript)          │   │
│  │  • Components (Dashboard, Hierarchy, Mindmap, Gantt,     │   │
│  │    Admin, Settings)                                       │   │
│  │  • Services (dataService.ts - single API entry point)    │   │
│  │  • Keycloak Provider (authentication state)              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (JSON)
                              │ Bearer Token (JWT)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API LAYER                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Spring Boot Backend (Java 17)                 │   │
│  │  • Controllers (REST endpoints)                          │   │
│  │  • Services (business logic, calculations)               │   │
│  │  • Security (OAuth2 Resource Server, CORS)               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ JDBC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL                            │   │
│  │  • Liquibase migrations                                  │   │
│  │  • JPA entities with audit fields                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Entity Model

### OKR Hierarchy

```
Project (root)
│   ├── title, description, progress
│   └── isActive (soft delete)
│
└── StrategicInitiative
    │   ├── title, description, progress
    │   └── projectId (FK)
    │
    └── Goal
        │   ├── title, description, progress
        │   └── initiativeId (FK)
        │
        └── Objective
            │   ├── title, description, progress
            │   ├── assignee, year, quarter, dueDate
            │   └── goalId (FK)
            │
            └── KeyResult
                │   ├── title, description, progress
                │   ├── metricStart, metricTarget, metricCurrent, unit
                │   ├── manualProgressSet (flag)
                │   └── objectiveId (FK)
                │
                └── ActionItem
                    ├── title, description, progress
                    ├── assignee, dueDate, isCompleted
                    └── keyResultId (FK)
```

### Access Control Model

```
User
│   ├── firstName, lastName, email, login
│   ├── groupNo, avatar
│   └── primaryProjectId
│
├── user_roles (M:N) ──────────► Role
│                                   ├── name, description
│                                   ├── isSystem
│                                   └── permissions[]
│
└── user_projects (M:N) ───────► Project
    ├── access_level (OWNER/MANAGER/MEMBER/VIEWER)
    ├── assigned_date
    └── assigned_by

Role ──── role_projects (M:N) ──► Project (scoping)
```

## Data Flow

### Progress Calculation (Bottom-Up)

```
ActionItem.isCompleted → progress (0 or 100)
        │
        ▼
KeyResult.progress = avg(ActionItems) OR manual
        │
        ▼
Objective.progress = avg(KeyResults)
        │
        ▼
Goal.progress = avg(Objectives)
        │
        ▼
StrategicInitiative.progress = avg(Goals)
        │
        ▼
Project.progress = avg(Initiatives)
```

### Authentication Flow

```
1. User opens frontend
        │
        ▼
2. KeycloakProvider checks authentication
        │
        ├── Not authenticated → Redirect to Keycloak login
        │
        └── Authenticated → Load user from /api/user/me
                │
                ▼
3. JWT token attached to all API requests
        │
        ▼
4. Backend validates JWT with Keycloak issuer
        │
        ▼
5. UserService maps JWT email → app user → role permissions
   (System Administrator gets all permissions automatically)
        │
        ▼
6. SecurityConfig checks @PreAuthorize permissions
```

## Backend Architecture

### Package Structure

```
com.ccc.okrtracker/
├── OkrTrackerApplication.java     # Main entry point
├── controller/
│   ├── HierarchyController.java   # /api/hierarchy/* endpoints
│   ├── AdminController.java       # /api/admin/* endpoints
│   ├── UserController.java        # /api/user/* endpoints
│   ├── ArchiveController.java     # /api/archive/* endpoints
│   └── ImportController.java      # /api/import/* endpoints
├── service/
│   ├── HierarchyService.java      # OKR CRUD operations
│   ├── CalculationService.java    # Progress rollup logic
│   ├── UserService.java           # JWT→permissions mapping, System Admin bypass
│   ├── ProjectAccessService.java  # User/role project access
│   └── ImportService.java         # CSV import
├── repository/
│   ├── ProjectRepository.java     # JPA repository
│   ├── UserRepository.java        # JPA repository
│   ├── UserPreferenceRepository.java # User preferences
│   ├── UserProjectRepository.java # JdbcTemplate (extra columns)
│   └── RoleProjectRepository.java # JdbcTemplate (scoping)
├── entity/
│   ├── BaseEntity.java            # Common audit fields
│   ├── Project.java
│   ├── User.java
│   ├── UserPreference.java        # Per-user key-value settings
│   ├── Role.java
│   └── ... (all hierarchy entities)
├── config/
│   ├── SecurityConfig.java        # OAuth2, CORS, authorization
│   ├── JpaAuditingConfig.java     # Audit field population
│   └── GlobalExceptionHandler.java
├── dto/
│   └── UserDTO.java               # Data transfer objects
└── exception/
    └── ResourceNotFoundException.java
```

## Frontend Architecture

### Component Structure

```
ccc-okr-tracker-gemini/
├── App.tsx                        # Main app with routing
├── KeycloakProvider.tsx           # Auth context provider
├── types.ts                       # TypeScript interfaces
├── services/
│   └── dataService.ts             # All API calls (single source)
└── components/
    ├── Layout.tsx                 # Main layout wrapper
    ├── ThemeContext.tsx           # Dark/light theme
    ├── Dashboard/                 # Dashboard view
    ├── Hierarchy/                 # OKR tree view
    │   ├── HierarchyView.tsx
    │   └── useHierarchy.ts        # Hook for state management
    ├── Mindmap/                   # Interactive mindmap visualization
    │   ├── MindmapView.tsx        # Main container with ReactFlow
    │   ├── MindmapNode.tsx        # Custom node component
    │   ├── MindmapControls.tsx   # Zoom/pan/expand controls
    │   ├── useMindmap.ts          # State management hook
    │   ├── layoutUtils.ts         # Tree layout algorithm
    │   └── styles.ts              # Tailwind classes
    ├── Gantt/                     # Interactive Gantt chart
    │   ├── GanttView.tsx          # Main view with toolbar & filters
    │   ├── CustomTaskList.tsx     # Resizable task list columns
    │   ├── ObjectiveModal.tsx     # Click-to-view Key Results modal
    │   ├── useGantt.ts            # State, data transform, handlers
    │   └── index.tsx              # Module export
    ├── MyObjectives/              # User's assigned objectives
    ├── Admin/
    │   ├── UserManagement.tsx
    │   └── RoleManagement.tsx
    ├── Settings/                  # User settings
    └── shared/
        └── TreeViewShared.tsx     # Reusable tree components
```

## Security Model

### Permission Hierarchy

| Permission | Allows |
|------------|--------|
| `VIEW_DASHBOARD` | View dashboard statistics |
| `VIEW_STRATEGY` | View OKR hierarchy (filtered by project access) |
| `MANAGE_STRATEGY` | Create, update, delete OKR items |
| `MANAGE_USERS` | Admin user management |
| `MANAGE_ROLES` | Admin role management |
| `VIEW_ALL_PROJECTS` | Bypass project-level filtering |

> **System Administrator Bypass:** Users with the "System Administrator" role (`isSystem = true`) automatically receive all permissions (`MANAGE_STRATEGY`, `VIEW_STRATEGY`, `MANAGE_USERS`, `MANAGE_ROLES`) regardless of what's configured in the `role_permissions` table. This is enforced in `UserService.mapJwtToAuthorities()`.

### Request Authorization

```java
@PreAuthorize("hasAuthority('MANAGE_STRATEGY')")
public ResponseEntity<Project> createProject(...) { }

@PreAuthorize("hasAnyAuthority('VIEW_STRATEGY', 'MANAGE_STRATEGY')")
public ResponseEntity<List<Project>> getAllProjects() { }
```

## Database Migrations

Managed by **Liquibase**:

```yaml
# db.changelog-master.yaml
databaseChangeLog:
  - include: v1.0.0-initial-schema.yaml         # Base tables
  - include: v1.1.0-project-access-control.yaml  # Access control
  - include: v1.2.0-keyresult-duedate.yaml        # KeyResult due date column
  - include: v1.3.0-user-preferences.yaml         # User preferences (key-value)
```

Tables:
- `project`, `strategic_initiative`, `goal`, `objective`, `key_result`, `action_item`
- `app_users`, `role`, `role_permissions`
- `user_roles` (M:N join)
- `user_projects` (M:N with access_level)
- `role_projects` (M:N for scoping)
- `user_preferences` (user_id + preference_key → preference_value)
