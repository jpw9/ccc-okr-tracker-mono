# Feature Specification: Interactive Admin Gantt Chart

## 1. Access Control & Navigation
- **Restricted Access**: The Gantt Chart is exclusively available to **System Administrators**.
- **Admin Definition**: A user is identified as an Admin if their `Role` object has `isSystem: true` (System Administrator role as per the roles in the application).
- **Sidebar Integration**: 
  - Location: Positioned in the navigation sidebar directly under the **Mindmap** link.
  - Conditional Rendering: The link is only visible if the user meets the Admin criteria.
- **Route Protection**: The `/gantt` route must be protected via a route guard that redirects non-admin users to the Dashboard.

## 2. Technical Stack & Data Logic
- **Library**: `gantt-task-react` (recommended for React/TypeScript and interactivity).
- **Hierarchy Mapping**: 
  - Project > Strategic Initiative > Goal > **Objective (Leaf Node)**.
  - Key Results are NOT displayed as rows but are included as metadata within the Objective bar.
- **Timeline Logic**:
  - **Start Date**: Automatically calculated as the first day of the Objective's assigned `year` and `Quarter`.
  - **End Date**: Driven by the `Objective.dueDate`.
- **Visuals**:
  - **Color Coding**: Objective bars must be color-coded based on their parent **Goal ID** to visually group related strategy items.
  - **Progress**: Use the `progress` field (0-100) to render the internal fill of the bar.
  - **Labels**: Display the **average progress** of underlying items for the Project, Initiative, and Goal grouping rows.

## 3. Interactivity (Admin Only)
- **Drag & Drop**: Admins can drag the Objective bar to change its timeline.
- **Date/Quarter Synchronization**: 
  - When a bar is moved, update the `dueDate`.
  - If the new date falls into a different month range, automatically update the `Quarter` enum (Q1, Q2, Q3, or Q4).
- **Backend Persistence**: 
  - On drop, trigger `updateEntity('Objective', id, updates, token)` from `dataService.ts`.

## 4. Objective Detail Modal
- **Trigger**: Clicking an Objective task bar opens a detail modal.
- **Content**:
  - Displays Objective `title`, `description`, and `progress`.
  - Lists all child **Key Results** associated with that Objective, showing their titles and individual progress.

## 5. Implementation Requirements for Copilot
- **Service**: Ensure the frontend `dataService.ts` is used for all hierarchy fetching (`getProjects`) and updates.
- **Context**: Use `ThemeContext` for general UI borders and primary layout colors.
- **Permissions**: Verify the `currentUser` permissions before enabling drag-and-drop events in the Gantt component.