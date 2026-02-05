# Feature: Project Mindmap View

## Status
🟡 **In Definition** | Owner: [Your Name] | Target: [Sprint/Date]

---

## Overview
A visual mindmap representation of a project's OKR hierarchy, replicating the NotebookLM mindmap experience.

**Entry Point:** Sidenav menu item → "Mindmap" (with project selector at top of view)

**Navigation Flow:**
1. User clicks "Mindmap" in sidenav
2. View opens with project dropdown at top (like Hierarchy view)
3. Mindmap renders for selected project
4. Project selector allows switching without leaving the view

---

## User Stories

- [ ] As a user, I want to view my project hierarchy as an interactive mindmap
- [ ] As a user, I want to expand/collapse branches by clicking nodes
- [ ] As a user, I want to zoom in/out using scroll or controls
- [ ] As a user, I want to pan/drag the mindmap canvas
- [ ] Add more...

---

## NotebookLM Mindmap Reference

### Layout
- [x] **Central node positioning** - Root starts in center
- [x] **Dynamic recentering** - Tree stays centered after expansion, adjusts layout dynamically
- [x] **Interactive positioning** - User can pan/drag to reposition view
- [x] **Curved connectors** - Bezier curves connecting nodes

### Node Appearance
- **Shape:** Rounded rectangles (pill-like)
- **Colors:** Different colors per hierarchy level
- **Text:** Fits within node bounds
- **Reference:** See `docs/features/images/Mindmap Snapshot.jpg`

### Interactions
| Action | Behavior |
|--------|----------|
| Click node | Expand/collapse children |
| Hover node | (TBD - highlight?) |
| Drag canvas | Pan the view |
| Scroll | Zoom in/out |
| Zoom buttons | Lower-right corner controls |

### Animations
- **Expand/collapse:** Smooth transition, normal speed (~300ms)
- **Recentering:** Smooth adjustment when tree grows/shrinks
- **Zoom:** Smooth scaling
- **Pan:** Immediate response to drag

### Responsive Behavior
- **Desktop:** Full interactive experience with zoom controls
- **Tablet:** Touch-friendly, pinch to zoom
- **Mobile:** Simplified view (TBD)

**Reference Video:** `docs/features/videos/Mindmap Video.mp4` 

---

## Mockups / Screenshots

<!-- Add images or links here -->
<!-- ![Mindmap Example](./images/mindmap-mockup.png) -->

---

## Technical Approach

### Frontend Library Options
| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| D3.js | Full control, powerful | Steep learning curve, manual React integration | ❌ |
| React Flow | Native React, built-in zoom/pan, customizable nodes | Less low-level control | ✅ Selected |
| vis.js | Built-in layouts | Needs React wrapper, limited styling | ❌ |
| Mermaid | Simple syntax | Not interactive enough | ❌ |

**Selected:** React Flow (`@xyflow/react`)

### Component Structure
```
components/
  Mindmap/
    index.tsx           # Container with data fetching
    MindmapView.tsx     # Presentation component
    useMindmap.ts       # Custom hook for state/logic
    styles.ts           # Tailwind styles
    MindmapNode.tsx     # Individual node component
    MindmapControls.tsx # Zoom/pan controls
```

### Data Requirements
- **Existing endpoint?** `/api/projects/{id}` with full hierarchy
- **New endpoint needed?** No - use existing hierarchy data
- **Data shape:** See `types.ts` → Project hierarchy

### Hierarchy Depth Control
**Configurable depth** - User can choose how many levels to display:

| Level | Entity | Color (suggested) |
|-------|--------|-------------------|
| 0 | Project | Blue |
| 1 | Strategic Initiative | Purple |
| 2 | Goal | Green |
| 3 | Objective | Orange |
| 4 | Key Result | Yellow |
| 5 | Action Item | Gray |

**UI Control:** Depth slider or dropdown (1-6 levels) in the controls panel

### State Management
- Selected node
- Zoom level
- Pan position
- Expanded/collapsed nodes
- **Max depth level** (1-6, default: 4)

---

## Out of Scope (v1)
- [ ] Editing nodes directly in mindmap
- [ ] Drag-and-drop reorganization
- [ ] Export as image
- [ ] Collaborative real-time view

---

## Open Questions
1. 
2. 
3. 

---

## Implementation Phases

### Phase 1: Static Render
- [ ] Setup component structure
- [ ] Render static mindmap with mock data
- [ ] Basic styling

### Phase 2: Interactions
- [ ] Expand/collapse nodes
- [ ] Zoom controls
- [ ] Pan/drag

### Phase 3: Data Integration
- [ ] Connect to API
- [ ] Loading states
- [ ] Error handling

### Phase 4: Polish
- [ ] Dark mode support
- [ ] Animations
- [ ] Responsive design
- [ ] Accessibility

---

## Notes
<!-- Any additional context -->
