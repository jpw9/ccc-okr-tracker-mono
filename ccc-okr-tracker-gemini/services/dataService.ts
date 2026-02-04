// File: jpw9/ccc-okr-tracker-gemini/jpw9-ccc-okr-tracker-gemini-1ed46e9b04cb0ee78a5dd0db3d497ccf40d13ba1/services/dataService.ts

import { 
  Project, User, Role
} from '../types';

// MODIFIED: Read the API URL from the VITE environment variable set in .env files.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL environment variable is required. Please check your .env file.');
}

// --- API ERROR INTERFACE ---
interface ApiError {
    status: number;
    error: string;
    message: string;
    timestamp: string;
    path?: string;
    validationErrors?: Record<string, string>;
} 


// --- HELPER: PAYLOAD PREPARATION ---
// Ensures backend receives non-null values for numeric types and initializes arrays 
// to prevent NullPointerExceptions in Java when processing POST/PUT requests.
const preparePayload = (type: string, data: any) => {
    const payload = { ...data };

    // 1. Ensure Numbers are correctly typed
    if (payload.progress !== undefined) payload.progress = Number(payload.progress);
    if (payload.metricStart !== undefined) payload.metricStart = Number(payload.metricStart);
    if (payload.metricTarget !== undefined) payload.metricTarget = Number(payload.metricTarget);
    if (payload.metricCurrent !== undefined) payload.metricCurrent = Number(payload.metricCurrent);
    if (payload.year !== undefined) payload.year = Number(payload.year);
    // Convert project ID to number if it exists and is not null (for User entity)
    if (payload.projectId !== undefined && payload.projectId !== null) payload.projectId = Number(payload.projectId);
    
    // 2. Initialize Empty Arrays/Sets for Child Collections
    // This addresses potential backend validation issues on save.
    if (type === 'Project' && !payload.initiatives) payload.initiatives = [];
    if (type === 'StrategicInitiative' && !payload.goals) payload.goals = [];
    if (type === 'Goal' && !payload.objectives) payload.objectives = [];
    if (type === 'Objective' && !payload.keyResults) payload.keyResults = [];
    if (type === 'KeyResult' && !payload.actionItems) payload.actionItems = [];
    
    // 3. Defaults
    if (payload.isActive === undefined) payload.isActive = true;

    return payload;
};

// --- HELPER: API REQUEST ---
// Generic wrapper for fetching data and handling JSON response/errors.
// MODIFIED: Added token parameter to pass the bearer token for authorization.
const api = async (endpoint: string, options: RequestInit = {}, token: string | null = null) => {
    // If not a file upload, default to application/json
    const isFileUpload = options.body instanceof FormData;
    
    // MODIFIED: Concatenate the base URL with the endpoint.
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = isFileUpload ? {} : { 'Content-Type': 'application/json' };
    
    // NEW: Inject Authorization header if token is provided
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            headers: headers,
            ...options,
        });

        if (!response.ok) {
            // Try to parse structured error response
            let errorData: ApiError;
            try {
                errorData = await response.json();
            } catch {
                // Fallback if response is not JSON
                errorData = {
                    status: response.status,
                    error: response.statusText,
                    message: `Request failed with status ${response.status}`,
                    timestamp: new Date().toISOString()
                };
            }

            // Handle specific error types
            switch (errorData.status) {
                case 401:
                    console.error('Authentication failed:', errorData.message);
                    // Trigger re-authentication in your KeycloakProvider
                    window.dispatchEvent(new CustomEvent('auth:expired'));
                    throw new Error('Session expired. Please log in again.');
                
                case 403:
                    console.error('Access denied:', errorData.message);
                    throw new Error('You do not have permission to perform this action.');
                
                case 404:
                    console.error('Resource not found:', errorData.message);
                    throw new Error(errorData.message || 'The requested resource was not found.');
                
                case 400:
                    // Handle validation errors
                    if (errorData.validationErrors) {
                        const validationMsg = Object.entries(errorData.validationErrors)
                            .map(([field, error]) => `${field}: ${error}`)
                            .join(', ');
                        throw new Error(`Validation failed: ${validationMsg}`);
                    }
                    throw new Error(errorData.message || 'Invalid request.');
                
                case 500:
                    console.error('Server error:', errorData.message);
                    throw new Error('An unexpected server error occurred. Please try again later.');
                
                default:
                    throw new Error(errorData.message || `Request failed with status ${errorData.status}`);
            }
        }
        
        // Handle empty response bodies gracefully
        const text = await response.text();
        // Return raw text if not JSON (e.g., success message from import)
        try {
            return text ? JSON.parse(text) : {};
        } catch (e) {
            return text; 
        }
    } catch (error) {
        // Network errors or errors thrown above
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Network error. Please check your connection and try again.');
    }
};

// --- PROJECTS & HIERARCHY ---

// MODIFIED: Added token parameter
export const getProjects = async (token: string): Promise<Project[]> => {
    // Calls the custom JPQL query in the backend that eagerly loads the full hierarchy
    return await api('/api/hierarchy/projects', {}, token);
};

// MODIFIED: Added token parameter
export const addEntity = async (parentId: number | null, type: string, data: any, token: string): Promise<void> => {
    const payload = preparePayload(type, data);
    
    let endpoint = '';

    // Routes the request to the correct parent-child relationship endpoint
    switch (type) {
        case 'Project':
            endpoint = '/hierarchy/projects';
            break;
        case 'StrategicInitiative':
            endpoint = `/hierarchy/projects/${parentId}/initiatives`;
            break;
        case 'Goal':
            endpoint = `/hierarchy/initiatives/${parentId}/goals`;
            break;
        case 'Objective':
            endpoint = `/hierarchy/goals/${parentId}/objectives`;
            break;
        case 'KeyResult':
            endpoint = `/hierarchy/objectives/${parentId}/key-results`;
            break;
        case 'ActionItem':
            endpoint = `/hierarchy/key-results/${parentId}/action-items`;
            break;
        default:
            throw new Error(`Unknown entity type for add: ${type}`);
    }

    await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
    }, token);
};

// MODIFIED: Added token parameter
export const updateEntity = async (type: string, id: number, updates: Partial<any>, token: string): Promise<void> => {
    const pathSegment = endpointTypeMap[type];
    if (!pathSegment) throw new Error(`Cannot update unknown type: ${type}`);

    // Determine if the endpoint is under /admin or /hierarchy
    let baseUrl = '/api/hierarchy';
    if (type === 'User' || type === 'Role') baseUrl = '/api/admin';

    const payload = preparePayload(type, updates);

    await api(`${baseUrl}/${pathSegment}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    }, token);
};

// --- IMPORT FUNCTION ---
// MODIFIED: Added token parameter
export const importHierarchyFromFile = async (file: File, token: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api('/api/import/hierarchy', {
        method: 'POST',
        body: formData
    }, token);
    // The API is expected to return a success message string or throw an error.
    return response as string; 
};


// --- ENTITY MAPPING (rest of the file remains unchanged) ---

const endpointTypeMap: Record<string, string> = {
    'Project': 'projects',
    'StrategicInitiative': 'initiatives',
    'Goal': 'goals',
    'Objective': 'objectives',
    'KeyResult': 'key-results',
    'ActionItem': 'action-items',
    'User': 'users', 
    'Role': 'roles'
};

// --- USERS (Admin) ---

// MODIFIED: Added token parameter
export const getUsers = async (token: string): Promise<User[]> => {
    return await api('/api/admin/users', {}, token);
};

// MODIFIED: Added token parameter
export const addUser = async (userData: Partial<User>, token: string): Promise<void> => {
    const payload = preparePayload('User', userData);
    await api('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload)
    }, token);
};

// MODIFIED: Added token parameter
export const updateUser = async (id: number, updates: Partial<User>, token: string): Promise<void> => {
    await updateEntity('User', id, updates, token);
};

// MODIFIED: Added token parameter
export const deleteUser = async (id: number, token: string): Promise<void> => {
    // Soft delete via update
    await updateUser(id, { isActive: false }, token);
};

// --- ROLES (Admin) ---

// MODIFIED: Added token parameter
export const getRoles = async (token: string): Promise<Role[]> => {
    return await api('/api/admin/roles', {}, token);
};

// MODIFIED: Added token parameter
export const addRole = async (roleData: Partial<Role>, token: string): Promise<void> => {
    await api('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify(roleData)
    }, token);
};

// MODIFIED: Added token parameter
export const updateRole = async (id: number, updates: Partial<Role>, token: string): Promise<void> => {
    await updateEntity('Role', id, updates, token);
};

// MODIFIED: Added token parameter
export const deleteRole = async (id: number, token: string): Promise<void> => {
    await updateRole(id, { isActive: false }, token);
};

// --- PROJECT ACCESS CONTROL ---

// Get all projects (unfiltered, for admin assignment UI)
export const getAllProjectsForAdmin = async (token: string): Promise<Project[]> => {
    return await api('/api/admin/projects', {}, token);
};

// User-Project Assignment
export const assignUserToProject = async (
    userId: number, 
    projectId: number, 
    accessLevel: string = 'MEMBER',
    token: string
): Promise<void> => {
    await api(`/api/admin/users/${userId}/projects/${projectId}?accessLevel=${accessLevel}`, {
        method: 'POST'
    }, token);
};

export const removeUserFromProject = async (
    userId: number, 
    projectId: number,
    token: string
): Promise<void> => {
    await api(`/api/admin/users/${userId}/projects/${projectId}`, {
        method: 'DELETE'
    }, token);
};

export const getUserProjects = async (userId: number, token: string): Promise<Project[]> => {
    return await api(`/api/admin/users/${userId}/projects`, {}, token);
};

// Role-Project Scoping
export const addProjectToRole = async (
    roleId: number, 
    projectId: number,
    token: string
): Promise<void> => {
    await api(`/api/admin/roles/${roleId}/projects/${projectId}`, {
        method: 'POST'
    }, token);
};

export const removeProjectFromRole = async (
    roleId: number, 
    projectId: number,
    token: string
): Promise<void> => {
    await api(`/api/admin/roles/${roleId}/projects/${projectId}`, {
        method: 'DELETE'
    }, token);
};

export const getRoleScopedProjects = async (roleId: number, token: string): Promise<Project[]> => {
    return await api(`/api/admin/roles/${roleId}/projects`, {}, token);
};

// --- ARCHIVE & RESTORE ---

// MODIFIED: Added token parameter
export const getArchivedItems = async (token: string): Promise<any[]> => {
    return await api('/api/archive', {}, token);
};

// MODIFIED: Added token parameter
export const restoreItem = async (type: string, id: number, token: string): Promise<void> => {
    await api(`/api/archive/restore/${type}/${id}`, {
        method: 'POST'
    }, token);
};

export const getCurrentAppUser = async (token: string): Promise<User> => {
    // Calls the new /api/user/me endpoint
    return await api('/api/user/me', { method: 'GET' }, token);
};