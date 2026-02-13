# Backlog - Bugs & Enhancements

## Priority Legend
- 🔴 **Critical** - Blocking users, must fix immediately
- 🟠 **High** - Major UX issue, fix soon
- 🟡 **Medium** - Improvement, plan for next sprint
- 🟢 **Low** - Nice-to-have, when time permits

## Status Legend
- [ ] Not started
- [x] Completed
- 🔄 In progress

---

## Dashboard
**Component:** `components/Dashboard/`
**Status:** Not reviewed

### Bugs
- [ ] 

### Enhancements
- [ ] 

---

## Hierarchy View
**Component:** `components/Hierarchy/`
**Status:** ✅ Filter redesign complete (Feb 8, 2026)

### Bugs
- [x] 🟠 Edit Action Item: "Mark as Completed" checked but progress not 100% → Fixed: Frontend (TreeViewShared.tsx) uses progress as source of truth, backend validates consistency
- [x] 🟠 Edit Action Item: Order changes after editing (should maintain sort order) → Fixed: Backend (KeyResult.java) uses @OrderBy("id ASC")
- [x] 🟠 Existing ActionItems with progress=100% but isCompleted=false → Fixed: Backend validation auto-corrects on save

### Enhancements
- [x] 🟡 Filter bar redesign: Modernized with compact grouped filters, gradient background, improved visual hierarchy, better responsiveness 

---

## Mindmap
**Component:** `components/Mindmap/`
**Status:** ✅ Phase 5 Complete (Feb 6, 2026)

### Bugs
- [ ] 

### Enhancements
- [ ] 🟢 Dark mode support
- [ ] 🟢 Export as image

---

## My Objectives
**Component:** `components/MyObjectives/`
**Status:** ✅ Filter redesign complete (Feb 8, 2026)

### Bugs
- [x] 🟠 Edit Action Item: "Mark as Completed" checked but progress not 100% → Fixed: Shared component fix applies here
- [x] 🟠 Edit Action Item: Order changes after editing (should maintain sort order) → Fixed: Shared backend fix applies here
- [x] 🟠 Assigned items not showing: KeyResults/ActionItems assigned to user didn't appear → Fixed: useMyObjectives.ts now checks all hierarchy levels
- [x] 🟠 Showing unrelated siblings: When assigned to lower-level item, showed all parallel items → Fixed: Hierarchical filtering (top-down shows all, bottom-up shows path only)

### Enhancements
- [x] 🟡 Filter bar redesign: Modernized to match Strategy Map with compact grouped filters, gradient background, improved responsiveness 

---

## Settings
**Component:** `components/Settings/`
**Status:** Not reviewed

### Bugs
- [ ] 

### Enhancements
- [ ] 

---

## Admin (User Management)
**Component:** `components/Admin/UserManagement.tsx`
**Status:** Not reviewed

### Bugs
- [ ] 

### Enhancements
- [ ] 

---

## Gantt Chart
**Component:** `components/Gantt/` (to be created)
**Status:** 🔄 In Progress (Started Feb 12, 2026)
**Spec:** `docs/features/GANTT_CHART.md`

### Bugs
- [ ] 

### Enhancements
- [ ] 

---

## Admin (User Management)
**Component:** `components/Admin/UserManagement.tsx`
**Status:** ✅ Recent fixes complete (Feb 12, 2026)

### Bugs
- [x] 🔴 Create user doesn't save roles and project assignments → Fixed: createUser now processes roleIds and assignedProjectIds
- [x] 🔴 Deactivate user clears firstName, lastName, login, groupNo → Fixed: updateUser now only updates non-null fields (partial update)
- [x] 🟠 Deactivated users still appear in User Management table → Fixed: Backend filters inactive users by default, added toggle

### Enhancements
- [x] 🟡 Add "Show inactive users" toggle with reactivation capability

---

## Admin (Role Management)
**Component:** `components/Admin/RoleManagement.tsx`
**Status:** Not reviewed

### Bugs
- [ ] 

### Enhancements
- [ ] 

---

## Global / Cross-Screen Issues
**Affects:** Multiple screens

### Bugs
- [ ] 

### Enhancements
- [ ] 

---

## Backend API Issues
**Component:** `ccc-okr-tracker-gemini-backend/`

### Bugs
- [ ] 

### Enhancements
- [ ] 

---

## Completed Items

### February 2026
| Date | Screen | Type | Description |
|------|--------|------|-------------|
| Feb 12 | User Management | Bug Fix | Fixed createUser to handle roles and project assignments |
| Feb 12 | User Management | Bug Fix | Fixed updateUser to only update non-null fields (partial update) |
| Feb 12 | User Management | Enhancement | Added "Show inactive users" toggle and reactivation |
| Feb 8 | Hierarchy View | Enhancement | Modern compact filter bar with grouped filters, gradient design, improved UX |
| Feb 8 | My Objectives | Enhancement | Filter bar redesign matching Strategy Map modern design |
| Feb 6 | Mindmap | Feature | Phase 5 - UI refinements complete |

---

## Notes
<!-- Add any context, decisions, or dependencies here -->

