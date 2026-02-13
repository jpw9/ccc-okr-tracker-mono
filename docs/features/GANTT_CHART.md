# Feature Specification: Interactive Admin Gantt Chart

**Status:** ✅ Completed (Feb 13, 2026)
**Component:** `components/Gantt/`
**Key Files:** `GanttView.tsx`, `CustomTaskList.tsx`, `ObjectiveModal.tsx`, `useGantt.ts`, `index.tsx`

## 1. Access Control & Navigation
- **View Access**: The Gantt Chart is visible to users with `VIEW_STRATEGY` or `MANAGE_STRATEGY` permissions.
- **Drag-and-Drop Access**: Restricted to **System Administrators** only (users with a `Role` where `isSystem: true`).
- **System Administrator Bypass**: System Administrator role automatically receives all permissions regardless of `role_permissions` table entries (enforced in `UserService.mapJwtToAuthorities()`).
- **Sidebar Integration**: 
  - Location: Positioned in the navigation sidebar directly under the **Mindmap** link.
  - Conditional Rendering: The link is only visible if the user has `VIEW_STRATEGY` or `MANAGE_STRATEGY` permission.
- **Route Protection**: The `/gantt` route renders `GanttView` component with `projects` and `token` props.

## 2. Technical Stack & Data Logic
- **Library**: `gantt-task-react` (React/TypeScript, interactive timeline).
- **Hierarchy Mapping**: 
  - Project > Strategic Initiative > Goal > **Objective (Leaf Node)**.
  - Key Results are NOT displayed as rows but are shown in the Objective detail modal.
- **Timeline Logic**:
  - **Start Date**: Automatically calculated as the first day of the Objective's assigned `year` and `Quarter`.
  - **End Date**: Driven by the `Objective.dueDate`.
- **Filters**: Project selector, Quarter filter (Q1-Q4), Year selector (±2 years from current).
- **Zoom Levels**: Day, Week, Month, Year — controlled by zoom in/out buttons.
- **Visuals**:
  - **Color Coding**: Objective bars are color-coded based on their parent **Goal ID** using a 10-color palette. Grouping rows (Goal, Initiative, Project) use semi-transparent versions of the same colors.
  - **Progress**: Uses the `progress` field (0-100) to render the internal fill of each bar.
  - **Labels**: Project, Initiative, and Goal rows display **average progress** of their child Objectives.
- **Custom Task List**: Resizable columns (Name, From, To) with drag-to-resize handles. Hierarchy depth indicated by indentation and type badges (P/SI/G/O).

## 3. Interactivity (Admin Only)
- **Drag & Drop**: Only users with `isSystem` role can drag Objective bars to change timelines. Non-admin users see `isDisabled: true` on task bars.
- **Date/Quarter Synchronization**: 
  - When a bar is moved, the `dueDate` is updated.
  - If the new date falls into a different month range, the `Quarter` enum (Q1, Q2, Q3, or Q4) is automatically recalculated.
- **Backend Persistence**: 
  - On drop, triggers `updateEntity('Objective', id, { dueDate, quarter }, token)` from `dataService.ts`.
- **Expand/Collapse**: All hierarchy levels (Project, Initiative, Goal) support expand/collapse via chevron toggles.

## 4. Objective Detail Modal
- **Trigger**: Clicking an Objective task bar opens a detail modal.
- **Content**:
  - Breadcrumb: Project → Initiative → Goal path.
  - Displays Objective `title`, `description`, `progress` (with visual bar), `quarter`, `year`, `dueDate`, and `assignee`.
  - Lists all child **Key Results** with their titles, assignees, and individual progress bars.
  - Progress color coding: blue (<50%), amber (50-99%), green (100%).
- **Dismiss**: Click outside or X button to close.

## 5. Implementation Details
- **Data Source**: Uses `getProjects()` from `dataService.ts` to fetch the full hierarchy.
- **Hook**: `useGantt.ts` transforms hierarchy data into `gantt-task-react` Task array, manages filters, expand state, and modal state.
- **Admin Check**: `const isAdmin = appUser?.roles?.some(r => r.isSystem) || false` — from `useAuth()` context.
- **Theme**: Uses `ThemeContext` for general UI borders and primary layout colors.
- **Custom Components**: `CustomTaskListHeader` and `CustomTaskListTable` replace default gantt-task-react task list with resizable columns and hierarchy-aware rendering.
- **Error Handling**: Failed drag-and-drop updates show an alert and log to console.