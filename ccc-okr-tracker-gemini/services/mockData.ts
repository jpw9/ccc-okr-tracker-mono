import { Project, Quarter, AuditFields, Role, User } from '../types';

const CURRENT_USER = "admin_user";

// Helper for mock data generation
const createAudit = (id: number): AuditFields => ({
  id,
  createdBy: CURRENT_USER,
  createdDate: new Date().toISOString(),
  updatedBy: CURRENT_USER,
  updatedDate: new Date().toISOString(),
  isActive: true,
});

// --- MOCK ROLES ---
export const initialMockRoles: Role[] = [
  {
    ...createAudit(1),
    name: "System Administrator",
    description: "Full access to all system modules and settings.",
    permissions: ['VIEW_DASHBOARD', 'VIEW_STRATEGY', 'MANAGE_STRATEGY', 'MANAGE_USERS', 'MANAGE_ROLES', 'VIEW_ALL_PROJECTS', 'EDIT_OWN_OBJECTIVES'],
    isSystem: true
  },
  {
    ...createAudit(2),
    name: "Project Manager",
    description: "Can manage strategy and objectives for assigned projects.",
    permissions: ['VIEW_DASHBOARD', 'VIEW_STRATEGY', 'MANAGE_STRATEGY', 'EDIT_OWN_OBJECTIVES'],
    isSystem: false
  },
  {
    ...createAudit(3),
    name: "Standard User",
    description: "Can view dashboard and update assigned objectives.",
    permissions: ['VIEW_DASHBOARD', 'EDIT_OWN_OBJECTIVES'],
    isSystem: true
  },
  {
    ...createAudit(4),
    name: "Strategy Viewer",
    description: "Can view strategy and OKRs but cannot edit or create.",
    permissions: ['VIEW_DASHBOARD', 'VIEW_STRATEGY'],
    isSystem: false
  }
];

// --- MOCK USERS ---
export const initialMockUsers: User[] = [
  {
    ...createAudit(101),
    firstName: "Admin",
    lastName: "User",
    groupNo: "GRP-001",
    email: "admin@ccc.com",
    login: "admin_user",
    projectId: null,
    roleIds: [1],
    avatar: "AU"
  },
  {
    ...createAudit(102),
    firstName: "John",
    lastName: "Doe",
    groupNo: "GRP-002",
    email: "john.doe@ccc.com",
    login: "jdoe",
    projectId: 1,
    roleIds: [2],
    avatar: "JD"
  },
  {
    ...createAudit(103),
    firstName: "Jane",
    lastName: "Smith",
    groupNo: "GRP-003",
    email: "jane.smith@ccc.com",
    login: "jsmith",
    projectId: 2,
    roleIds: [2],
    avatar: "JS"
  },
  {
    ...createAudit(104),
    firstName: "Dev",
    lastName: "Lead",
    groupNo: "GRP-DEV",
    email: "dev.lead@ccc.com",
    login: "dev_lead",
    projectId: 1,
    roleIds: [3],
    avatar: "DL"
  }
];

export const initialMockProjects: Project[] = [
  // --- PROJECT 1: Digital Transformation ---
  {
    ...createAudit(1),
    type: 'Project',
    title: "Global Digital Transformation",
    description: "Modernizing the entire tech stack and customer experience ecosystem across all regions.",
    progress: 0,
    initiatives: [
      {
        ...createAudit(11),
        type: 'StrategicInitiative',
        projectId: 1,
        title: "Cloud Migration Strategy",
        description: "Move 100% of on-premise infrastructure to hybrid cloud environment.",
        progress: 0,
        goals: [
          {
            ...createAudit(111),
            type: 'Goal',
            strategicInitiativeId: 11,
            title: "Decommission Data Centers",
            description: "Close down 3 legacy data centers in NA and EMEA.",
            progress: 0,
            objectives: [
              {
                ...createAudit(1111),
                type: 'Objective',
                goalId: 111,
                title: "Migrate Legacy CRM",
                description: "Shift all sales data to Salesforce Cloud.",
                assignee: "admin_user",
                year: 2024,
                quarter: Quarter.Q1,
                dueDate: "2024-03-31",
                isArchived: false,
                progress: 0,
                keyResults: [
                  {
                    ...createAudit(11111),
                    type: 'KeyResult',
                    objectiveId: 1111,
                    title: "Transfer 1M customer records",
                    description: "Ensure zero data loss during transfer.",
                    assignee: "admin_user",
                    metricStart: 0,
                    metricTarget: 1000000,
                    metricCurrent: 850000,
                    unit: "Records",
                    progress: 85,
                    actionItems: [
                       { ...createAudit(111111), type: 'ActionItem', keyResultId: 11111, title: "Run ETL Scripts", description: "Execute final batch scripts.", dueDate: "2024-02-20", assignee: "dev", isCompleted: true, progress: 100 },
                       { ...createAudit(111112), type: 'ActionItem', keyResultId: 11111, title: "Verify Data Integrity", description: "Run checksum validation.", dueDate: "2024-02-25", assignee: "qa", isCompleted: true, progress: 100 }
                    ]
                  },
                  {
                    ...createAudit(11112),
                    type: 'KeyResult',
                    objectiveId: 1111,
                    title: "Maintain 99.9% availability",
                    description: "No downtime during migration window.",
                    assignee: "dev_lead",
                    metricStart: 90,
                    metricTarget: 99.9,
                    metricCurrent: 99.5,
                    unit: "%",
                    progress: 96,
                    actionItems: []
                  }
                ]
              },
              {
                 ...createAudit(1112),
                 type: 'Objective',
                 goalId: 111,
                 title: "Virtualize ERP System",
                 description: "Containerize SAP modules for cloud deployment.",
                 assignee: "admin_user",
                 year: 2024,
                 quarter: Quarter.Q2,
                 dueDate: "2024-06-30",
                 isArchived: false,
                 progress: 0,
                 keyResults: []
              }
            ]
          },
          {
             ...createAudit(112),
             type: 'Goal',
             strategicInitiativeId: 11,
             title: "Cloud Security Framework",
             description: "Achieve ISO 27001 compliance for new cloud infra.",
             progress: 0,
             objectives: []
          }
        ]
      },
      {
        ...createAudit(12),
        type: 'StrategicInitiative',
        projectId: 1,
        title: "AI & Machine Learning",
        description: "Integrate predictive AI into core product offerings.",
        progress: 0,
        goals: [
          {
            ...createAudit(121),
            type: 'Goal',
            strategicInitiativeId: 12,
            title: "Predictive Analytics",
            description: "Launch customer behavior prediction models.",
            progress: 0,
            objectives: [
              {
                ...createAudit(1211),
                type: 'Objective',
                goalId: 121,
                title: "Launch Recommendation Engine",
                description: "Deploy model v2.0 to production.",
                assignee: "ai_lead",
                year: 2024,
                quarter: Quarter.Q3,
                dueDate: "2024-09-30",
                isArchived: false,
                progress: 0,
                keyResults: [
                  {
                    ...createAudit(12111),
                    type: 'KeyResult',
                    objectiveId: 1211,
                    title: "Increase CTR by 15%",
                    description: "Improve ad relevance scores.",
                    assignee: "data_scientist",
                    metricStart: 5,
                    metricTarget: 20,
                    metricCurrent: 12,
                    unit: "% CTR",
                    progress: 0,
                    actionItems: [
                        { ...createAudit(121111), type: 'ActionItem', keyResultId: 12111, title: "Evaluate Models", description: "Compare BERT vs GPT approaches.", dueDate: "2024-07-15", assignee: "admin_user", isCompleted: true, progress: 100 },
                        { ...createAudit(121112), type: 'ActionItem', keyResultId: 12111, title: "A/B Test", description: "Run split test on 5% traffic.", dueDate: "2024-08-01", assignee: "devops", isCompleted: false, progress: 0 }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // --- PROJECT 2: Sustainability ---
  {
    ...createAudit(2),
    type: 'Project',
    title: "Sustainability 2025",
    description: "Achieve carbon neutrality and implement circular economy practices.",
    progress: 0,
    initiatives: [
      {
        ...createAudit(21),
        type: 'StrategicInitiative',
        projectId: 2,
        title: "Green Logistics",
        description: "Reduce transportation emissions by 40%.",
        progress: 0,
        goals: [
          {
             ...createAudit(211),
             type: 'Goal',
             strategicInitiativeId: 21,
             title: "Fleet Electrification",
             description: "Transition delivery vehicles to EV.",
             progress: 0,
             objectives: [
                 {
                     ...createAudit(2111),
                     type: 'Objective',
                     goalId: 211,
                     title: "Phase 1 EV Rollout",
                     description: "Deploy 500 EVs in urban centers.",
                     assignee: "ops_vp",
                     year: 2024,
                     quarter: Quarter.Q4,
                     dueDate: "2024-12-31",
                     isArchived: false,
                     progress: 0,
                     keyResults: [
                         {
                             ...createAudit(21111),
                             type: 'KeyResult',
                             objectiveId: 2111,
                             title: "Procure 500 EVs",
                             description: "Sign contracts with manufacturers.",
                             assignee: "admin_user",
                             metricStart: 0,
                             metricTarget: 500,
                             metricCurrent: 120,
                             unit: "Trucks",
                             progress: 24,
                             actionItems: [
                               { ...createAudit(211111), type: 'ActionItem', keyResultId: 21111, title: "RFP Process", description: "Select top 3 vendors.", dueDate: "2024-01-15", assignee: "procurement", isCompleted: true, progress: 100 },
                               { ...createAudit(211112), type: 'ActionItem', keyResultId: 21111, title: "Test Drive", description: "Field test prototype units.", dueDate: "2024-02-01", assignee: "drivers", isCompleted: false, progress: 0 }
                             ]
                         }
                     ]
                 }
             ]
          },
          {
             ...createAudit(212),
             type: 'Goal',
             strategicInitiativeId: 21,
             title: "Route Optimization",
             description: "Use AI to reduce miles driven.",
             progress: 0,
             objectives: [
                 {
                     ...createAudit(2121),
                     type: 'Objective',
                     goalId: 212,
                     title: "Deploy Routing Software",
                     description: "Implement RouteMax v3 globally.",
                     assignee: "logistics_lead",
                     year: 2024,
                     quarter: Quarter.Q2,
                     dueDate: "2024-06-01",
                     isArchived: false,
                     progress: 0,
                     keyResults: []
                 }
             ]
          }
        ]
      },
      {
          ...createAudit(22),
          type: 'StrategicInitiative',
          projectId: 2,
          title: "Sustainable Campus",
          description: "Make HQ and regional offices zero-waste.",
          progress: 0,
          goals: [
              {
                  ...createAudit(221),
                  type: 'Goal',
                  strategicInitiativeId: 22,
                  title: "Zero Waste Operations",
                  description: "Divert 90% of waste from landfills.",
                  progress: 0,
                  objectives: [
                      {
                          ...createAudit(2211),
                          type: 'Objective',
                          goalId: 221,
                          title: "Remove Single-Use Plastics",
                          description: "Ban plastic bottles and cutlery.",
                          assignee: "admin_user",
                          year: 2024,
                          quarter: Quarter.Q2,
                          dueDate: "2024-05-30",
                          isArchived: false,
                          progress: 0,
                          keyResults: [
                              {
                                  ...createAudit(22111),
                                  type: 'KeyResult',
                                  objectiveId: 2211,
                                  title: "Install water stations",
                                  description: "One station per 50 employees.",
                                  assignee: "facilities",
                                  metricStart: 0,
                                  metricTarget: 20,
                                  metricCurrent: 20,
                                  unit: "Stations",
                                  progress: 100,
                                  actionItems: []
                              }
                          ]
                      }
                  ]
              }
          ]
      }
    ]
  }
];