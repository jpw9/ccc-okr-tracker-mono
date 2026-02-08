# CCC OKR Tracker

A comprehensive **Objectives and Key Results (OKR)** tracking system for managing organizational goals with full hierarchy support, role-based access control, and real-time progress rollup.

## 🎯 Overview

The OKR Tracker enables organizations to:
- Define and track **Projects → Strategic Initiatives → Goals → Objectives → Key Results → Action Items**
- Automatic progress calculation rolling up from Action Items to Projects
- Role-based access control with project-level scoping
- Full audit trail for all changes

## 🏗️ Architecture

| Component | Technology | Port |
|-----------|------------|------|
| **Frontend** | React 19, Vite 6, TypeScript, Tailwind CSS 4 | 4200 (dev) |
| **Backend** | Spring Boot 3.2.1, Java 17, Maven | 8080 (dev) |
| **Database** | PostgreSQL 15+ | 5432 |
| **Auth** | Keycloak (OAuth2/OIDC) | External |

## 📁 Project Structure

```
okr-tracker-monorepo/
├── ccc-okr-tracker-gemini/           # Frontend (React)
│   ├── components/                   # React components
│   ├── services/                     # API service layer
│   └── types.ts                      # TypeScript interfaces
├── ccc-okr-tracker-gemini-backend/   # Backend (Spring Boot)
│   └── src/main/java/com/ccc/okrtracker/
│       ├── controller/               # REST API endpoints
│       ├── service/                  # Business logic
│       ├── repository/               # Data access
│       ├── entity/                   # JPA entities
│       └── config/                   # Security, CORS, etc.
├── docs/                             # Documentation
├── build-for-tomcat.bat              # Production build script
└── build-output/                     # WAR files for deployment
```

## 🚀 Quick Start

### Prerequisites
- **Java 17+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **Maven 3.8+**

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd okr-tracker-monorepo
   ```

2. **Setup Database**
   ```sql
   CREATE DATABASE okr_tracker_db;
   ```

3. **Start Backend**
   ```bash
   cd ccc-okr-tracker-gemini-backend
   ./mvnw spring-boot:run
   ```

4. **Start Frontend**
   ```bash
   cd ccc-okr-tracker-gemini
   npm install
   npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:8080/api

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/GETTING-STARTED.md) | Detailed setup guide |
| [Architecture](docs/ARCHITECTURE.md) | System design and data flow |
| [API Reference](docs/API-REFERENCE.md) | REST API endpoints |
| [Deployment](docs/DEPLOYMENT.md) | Production deployment guide |
| [Configuration](docs/CONFIGURATION.md) | Environment variables |
| [Development](docs/DEVELOPMENT.md) | Day-to-day development workflow |

## 🔐 Authentication

The application uses **Keycloak** for authentication:
- **Realm**: Apps
- **Client ID**: frontend
- **Auth URL**: https://auth.ccc.net/auth

## 🌐 Production Deployment

**Server**: 10.1.155.29 (Tomcat 10, port 8090)

| Component | URL |
|-----------|-----|
| Frontend | https://10.1.155.29:8443/cccokrtracker/ |
| Backend | https://10.1.155.29:8443/okr-tracker-backend/ |

Build and deploy:
```bash
.\build-for-tomcat.bat
# Copy WAR files from build-output/ to server
```

## 📋 Entity Hierarchy

```
Project
└── Strategic Initiative
    └── Goal
        └── Objective (quarterly, assignable)
            └── Key Result (measurable)
                └── Action Item (task)
```

## 🔑 Permissions

| Permission | Description |
|------------|-------------|
| `VIEW_DASHBOARD` | View dashboard statistics |
| `VIEW_STRATEGY` | View OKR hierarchy |
| `MANAGE_STRATEGY` | Create/edit/delete OKR items |
| `MANAGE_USERS` | Manage user accounts |
| `MANAGE_ROLES` | Manage roles and permissions |
| `VIEW_ALL_PROJECTS` | See all projects (bypass scoping) |

## 📄 License

Proprietary - CCC Internal Use Only
