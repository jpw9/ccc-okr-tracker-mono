// Auditing Interface used by all entities
export interface AuditFields {
  id: number;
  createdBy: string;
  createdDate: string; // ISO String
  updatedBy: string;
  updatedDate: string; // ISO String
  isActive: boolean;
  closedBy?: string;
  closedDate?: string; // ISO String
}

// Common props for hierarchy items
export interface BaseItem extends AuditFields {
  title: string;
  description?: string;
  progress: number; // 0 to 100
}

export enum Quarter {
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4',
}

export interface ActionItem extends BaseItem {
  type: 'ActionItem';
  keyResultId: number;
  dueDate: string;
  assignee: string; // User ID or Name
  isCompleted: boolean;
}

export interface KeyResult extends BaseItem {
  type: 'KeyResult';
  objectiveId: number;
  assignee: string;
  metricStart: number;
  metricTarget: number;
  metricCurrent: number;
  unit: string; // e.g., "%", "$", "Users"
  actionItems: ActionItem[];
}

export interface Objective extends BaseItem {
  type: 'Objective';
  goalId: number;
  assignee: string;
  year: number;
  quarter: Quarter;
  dueDate: string; // Can be specific date
  isArchived: boolean;
  keyResults: KeyResult[];
}

export interface Goal extends BaseItem {
  type: 'Goal';
  strategicInitiativeId: number;
  objectives: Objective[];
}

export interface StrategicInitiative extends BaseItem {
  type: 'StrategicInitiative';
  projectId: number;
  goals: Goal[];
}

export interface Project extends BaseItem {
  type: 'Project';
  initiatives: StrategicInitiative[];
}

// --- ACCESS CONTROL ENTITIES ---

// NEW: Access level enum for user-project assignments
export type AccessLevel = 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';

// NEW: Interface for user-project assignment details
export interface UserProjectAssignment {
  projectId: number;
  accessLevel: AccessLevel;
  assignedDate: string;
  assignedBy: string;
}

export type Permission = 
  | 'VIEW_DASHBOARD'
  | 'VIEW_STRATEGY'
  | 'MANAGE_STRATEGY'
  | 'MANAGE_USERS'
  | 'MANAGE_ROLES'
  | 'VIEW_ALL_PROJECTS'
  | 'EDIT_OWN_OBJECTIVES';

export interface Role extends AuditFields {
  name: string;
  description: string;
  // NOTE: This property is automatically converted from Set<String> to string[] by the JSON mapper
  permissions: Permission[]; 
  isSystem: boolean; // Prevent deletion of core roles
  // NEW: Project IDs this role is scoped to (empty = global role)
  scopedProjectIds: number[];
}

export interface User extends AuditFields { // MODIFIED
  firstName: string;
  lastName: string;
  groupNo: string; // Employee ID or Group Code
  email: string;
  login: string; // Username
  avatar?: string;
  
  // MODIFIED: Renamed to match the entity property name 'primaryProjectId'
  primaryProjectId: number | null; 
  roleIds: number[];
  // MODIFIED: Replaced 'roleIds' with the full 'roles' object returned by the backend
  roles: Role[];
  // NEW: Directly assigned project IDs
  assignedProjectIds: number[];
}

export interface AppTheme {
  primaryColor: string; // Hex
  borderRadius: string; // 'sm', 'md', 'lg'
}