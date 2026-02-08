# API Reference

## Overview

The OKR Tracker backend exposes a RESTful API organized into five controller domains:
- **Hierarchy** - OKR item management
- **User** - Current user operations
- **Admin** - User and role administration
- **Archive** - Soft-deleted item retrieval
- **Import** - CSV bulk import

All endpoints require JWT authentication via Keycloak.

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://10.1.155.29:8443/okr-tracker-backend/api` |
| Development | `http://localhost:8080/api` |

## Authentication

All requests must include a valid JWT Bearer token:

```
Authorization: Bearer <JWT_TOKEN>
```

Token is obtained from Keycloak (`https://auth.ccc.net/auth/realms/Apps`).

---

## Hierarchy API (`/api/hierarchy`)

Manages the OKR hierarchy: Projects → Initiatives → Goals → Objectives → Key Results → Action Items.

### Get All Projects

```http
GET /api/hierarchy/projects
```

**Authorization:** `VIEW_STRATEGY` or `MANAGE_STRATEGY`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Project Alpha",
    "description": "Description",
    "progress": 75.5,
    "isActive": true,
    "initiatives": [...]
  }
]
```

---

### Create Project

```http
POST /api/hierarchy/projects
```

**Authorization:** `MANAGE_STRATEGY`

**Request Body:**
```json
{
  "title": "New Project",
  "description": "Project description"
}
```

**Response:** `200 OK` - Created project with ID

---

### Update Project

```http
PUT /api/hierarchy/projects/{id}
```

**Authorization:** `MANAGE_STRATEGY`

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "isActive": true
}
```

---

### Create Strategic Initiative

```http
POST /api/hierarchy/projects/{projectId}/initiatives
```

**Authorization:** `MANAGE_STRATEGY`

**Request Body:**
```json
{
  "title": "Initiative Name",
  "description": "Initiative description"
}
```

---

### Update Strategic Initiative

```http
PUT /api/hierarchy/initiatives/{id}
```

**Authorization:** `MANAGE_STRATEGY`

---

### Create Goal

```http
POST /api/hierarchy/initiatives/{initId}/goals
```

**Authorization:** `MANAGE_STRATEGY`

**Request Body:**
```json
{
  "title": "Goal Name",
  "description": "Goal description"
}
```

---

### Update Goal

```http
PUT /api/hierarchy/goals/{id}
```

**Authorization:** `MANAGE_STRATEGY`

---

### Create Objective

```http
POST /api/hierarchy/goals/{goalId}/objectives
```

**Authorization:** `MANAGE_STRATEGY`

**Request Body:**
```json
{
  "title": "Objective Name",
  "description": "Objective description",
  "assignee": "user@example.com",
  "year": 2024,
  "quarter": "Q1",
  "dueDate": "2024-03-31"
}
```

---

### Update Objective

```http
PUT /api/hierarchy/objectives/{id}
```

**Authorization:** `MANAGE_STRATEGY`

---

### Create Key Result

```http
POST /api/hierarchy/objectives/{objId}/key-results
```

**Authorization:** `MANAGE_STRATEGY`

**Request Body:**
```json
{
  "title": "Key Result Name",
  "description": "KR description",
  "metricStart": 0,
  "metricTarget": 100,
  "metricCurrent": 0,
  "unit": "%"
}
```

---

### Update Key Result

```http
PUT /api/hierarchy/key-results/{id}
```

**Authorization:** `MANAGE_STRATEGY`

**Request Body:**
```json
{
  "title": "Updated KR",
  "metricCurrent": 50,
  "manualProgressSet": true
}
```

---

### Create Action Item

```http
POST /api/hierarchy/key-results/{krId}/action-items
```

**Authorization:** `MANAGE_STRATEGY`

**Request Body:**
```json
{
  "title": "Action Item Name",
  "description": "Action description",
  "assignee": "user@example.com",
  "dueDate": "2024-02-15",
  "isCompleted": false
}
```

---

### Update Action Item

```http
PUT /api/hierarchy/action-items/{id}
```

**Authorization:** `MANAGE_STRATEGY`

**Request Body:**
```json
{
  "title": "Action Item Name",
  "isCompleted": true
}
```

**Note:** When `isCompleted` changes, progress recalculation triggers up the hierarchy.

---

## User API (`/api/user`)

Current user operations.

### Get Current User

```http
GET /api/user/me
```

**Authorization:** Any authenticated user

**Response:** `200 OK`
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "login": "jdoe",
  "groupNo": "IT-001",
  "avatar": null,
  "primaryProjectId": 1,
  "isActive": true,
  "roles": [
    {
      "id": 1,
      "name": "Manager",
      "permissions": ["VIEW_DASHBOARD", "VIEW_STRATEGY", "MANAGE_STRATEGY"]
    }
  ]
}
```

**Response:** `404 Not Found` - If user not in database

---

### Get All Active Users

```http
GET /api/user/all
```

**Authorization:** Any authenticated user

**Response:** `200 OK` - Array of active users (for assignment dropdowns)

---

## Admin API (`/api/admin`)

User and role administration.

### List All Users

```http
GET /api/admin/users
```

**Authorization:** `MANAGE_USERS`

**Response:** `200 OK` - Array of all users with roles and project assignments

---

### Create User

```http
POST /api/admin/users
```

**Authorization:** `MANAGE_USERS`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "login": "jsmith",
  "groupNo": "HR-001"
}
```

---

### Update User

```http
PUT /api/admin/users/{id}
```

**Authorization:** `MANAGE_USERS`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "login": "jsmith",
  "groupNo": "HR-001",
  "primaryProjectId": 1,
  "roleIds": [1, 2],
  "assignedProjectIds": [1, 3, 5]
}
```

---

### Assign User to Project

```http
POST /api/admin/users/{userId}/projects/{projectId}?accessLevel=MEMBER
```

**Authorization:** `MANAGE_USERS`

**Query Parameters:**
- `accessLevel`: `OWNER`, `MANAGER`, `MEMBER`, `VIEWER` (default: `MEMBER`)

---

### Remove User from Project

```http
DELETE /api/admin/users/{userId}/projects/{projectId}
```

**Authorization:** `MANAGE_USERS`

---

### Get User's Projects

```http
GET /api/admin/users/{userId}/projects
```

**Authorization:** `MANAGE_USERS`

---

### List All Roles

```http
GET /api/admin/roles
```

**Authorization:** `MANAGE_ROLES`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Administrator",
    "description": "Full system access",
    "isSystem": true,
    "permissions": ["MANAGE_USERS", "MANAGE_ROLES", "VIEW_DASHBOARD", "VIEW_STRATEGY", "MANAGE_STRATEGY"],
    "scopedProjectIds": []
  }
]
```

---

### Create Role

```http
POST /api/admin/roles
```

**Authorization:** `MANAGE_ROLES`

**Request Body:**
```json
{
  "name": "Project Viewer",
  "description": "Can view specific projects",
  "permissions": ["VIEW_DASHBOARD", "VIEW_STRATEGY"],
  "scopedProjectIds": [1, 2]
}
```

---

### Update Role

```http
PUT /api/admin/roles/{id}
```

**Authorization:** `MANAGE_ROLES`

---

### Add Project Scope to Role

```http
POST /api/admin/roles/{roleId}/projects/{projectId}
```

**Authorization:** `MANAGE_ROLES`

---

### Remove Project Scope from Role

```http
DELETE /api/admin/roles/{roleId}/projects/{projectId}
```

**Authorization:** `MANAGE_ROLES`

---

## Archive API (`/api/archive`)

Soft-deleted items management.

### Get Archived Items

```http
GET /api/archive
```

**Authorization:** `VIEW_STRATEGY` or `MANAGE_STRATEGY`

**Response:** `200 OK` - Array of archived items

---

### Restore Item

```http
POST /api/archive/restore/{type}/{id}
```

**Authorization:** `MANAGE_STRATEGY`

**Path Parameters:**
- `type`: Entity type (`Project`, `Initiative`, etc.)
- `id`: Entity ID

---

## Import API (`/api/import`)

Bulk data import via CSV.

### Import Hierarchy

```http
POST /api/import/hierarchy
Content-Type: multipart/form-data
```

**Authorization:** `MANAGE_USERS`

**Form Data:**
- `file`: CSV file

**CSV Format (24 columns):**
```csv
Project Title,Project Description,Initiative Title,Initiative Description,Goal Title,Goal Description,Objective Title,Objective Description,Objective Assignee,Objective Year,Objective Quarter,Objective Due Date,KR Title,KR Description,KR Assignee,KR Metric Start,KR Metric Target,KR Metric Current,KR Unit,Action Item Title,Action Item Description,Action Item Assignee,Action Item Due Date,Action Item Is Completed
```

**Response:** `200 OK`
```
Hierarchy imported successfully. Total records processed: 150
```

**Error Response:** `500`
```
Import failed. The CSV file must contain exactly 24 columns...
```

---

## Error Responses

### 400 Bad Request
Invalid request data or parameters.

### 401 Unauthorized
Missing or invalid JWT token.

### 403 Forbidden
Insufficient permissions for the operation.

### 404 Not Found
Requested resource does not exist.

### 500 Internal Server Error
Server-side error (check server logs).

---

## Permissions Reference

| Permission | Description |
|------------|-------------|
| `VIEW_DASHBOARD` | View dashboard statistics |
| `VIEW_STRATEGY` | View OKR hierarchy (filtered) |
| `MANAGE_STRATEGY` | Create/update/delete OKR items |
| `VIEW_ALL_PROJECTS` | Bypass project filtering |
| `MANAGE_USERS` | Administer users |
| `MANAGE_ROLES` | Administer roles |
