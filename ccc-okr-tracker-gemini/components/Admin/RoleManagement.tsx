import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { styles } from './styles';
import { Role, Permission, Project } from '../../types';
import * as DataService from '../../services/dataService';
import { Plus, Edit2, Trash2, X, Shield, Lock } from 'lucide-react';
import { useAuth } from '../../KeycloakProvider';
import { ConfirmDialog, ConfirmDialogState, CONFIRM_DIALOG_INITIAL } from '../shared/ConfirmDialog';

const AVAILABLE_PERMISSIONS: { key: Permission, label: string }[] = [
    { key: 'VIEW_DASHBOARD', label: 'View Dashboard' },
    { key: 'VIEW_STRATEGY', label: 'View Strategy (Read-Only)' },
    { key: 'MANAGE_STRATEGY', label: 'Manage Strategy (Create/Edit/Delete Goals/OKRs)' },
    { key: 'MANAGE_USERS', label: 'Manage Users' },
    { key: 'MANAGE_ROLES', label: 'Manage Roles & Permissions' },
    { key: 'VIEW_ALL_PROJECTS', label: 'View All Projects (Bypass Project Filtering)' },
    { key: 'EDIT_OWN_OBJECTIVES', label: 'Edit Assigned Objectives' }
];

interface RoleManagementProps {
    searchQuery: string;
    token: string; 
}

// Local type for editing with scoped project IDs
interface RoleForEdit extends Role {
    scopedProjectIds: number[];
}

export const RoleManagement: React.FC<RoleManagementProps> = ({ searchQuery, token }) => {
    const { refreshAppUser } = useAuth(); 

    const [roles, setRoles] = useState<Role[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Partial<RoleForEdit>>({});
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(CONFIRM_DIALOG_INITIAL);

    const loadData = useCallback(async () => {
        if (!token) return;
        const [fetchedRoles, fetchedProjects] = await Promise.all([
            DataService.getRoles(token),
            DataService.getAllProjectsForAdmin(token)
        ]);
        
        // Ensure fetchedData is an array and filter out any null/undefined roles
        const validRoles = Array.isArray(fetchedRoles) 
            ? fetchedRoles.filter((role: Role | null | undefined): role is Role => role != null)
            : [];
        
        const sortedData = validRoles.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        
        setRoles(sortedData);
        setProjects(fetchedProjects || []);
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredRoles = useMemo(() => {
        // We filter the already sorted 'roles' state
        if (!searchQuery.trim()) return roles;
        const lowerQ = searchQuery.toLowerCase();
        return roles.filter(role => 
            role.name.toLowerCase().includes(lowerQ) ||
            role.description.toLowerCase().includes(lowerQ)
        );
    }, [roles, searchQuery]);

    const handleEdit = (role: Role) => {
        setEditingRole({ 
            ...role,
            scopedProjectIds: role.scopedProjectIds || []
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingRole({ permissions: [], scopedProjectIds: [] }); 
        setIsModalOpen(true);
    };

    // Handle project scope toggle for roles
    const handleProjectScopeToggle = (projectId: number) => {
        const currentProjects = editingRole.scopedProjectIds || [];
        if (currentProjects.includes(projectId)) {
            setEditingRole({ 
                ...editingRole, 
                scopedProjectIds: currentProjects.filter(id => id !== projectId) 
            });
        } else {
            setEditingRole({ 
                ...editingRole, 
                scopedProjectIds: [...currentProjects, projectId] 
            });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Destructure and exclude read-only fields before sending
        const { createdBy, createdDate, updatedBy, updatedDate, closedBy, closedDate, isSystem, ...payload } = editingRole;
        
        try {
            if (editingRole.id) {
                await DataService.updateRole(editingRole.id, payload, token); 
            } else {
                await DataService.addRole(payload, token); 
            }
            
            setIsModalOpen(false);
            
            // CRITICAL: Immediately refresh both the roles list AND the current user's permissions
            await loadData(); 
            await refreshAppUser(); 

        } catch (error: any) {
            console.error("Save Role Error:", error);
            alert(`Error saving role: ${error.message}`);
        }
    };

    const handleDelete = (id: number) => {
        const role = roles.find(r => r.id === id);
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Role',
            message: `Are you sure you want to delete the role "${role?.name || ''}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await DataService.deleteRole(id, token); 
                    await loadData();
                    await refreshAppUser();
                } catch (error: any) {
                    console.error("Delete Role Error:", error);
                    alert(`Error deleting role: ${error.message}`);
                }
            },
        });
    };

    const togglePermission = (perm: Permission) => {
        const current = editingRole.permissions || [];
        if (current.includes(perm)) {
            setEditingRole({ ...editingRole, permissions: current.filter(p => p !== perm) as Permission[] });
        } else {
            setEditingRole({ ...editingRole, permissions: [...current, perm] as Permission[] });
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header.wrapper}>
                <div>
                    <h1 className={styles.header.title}>Role Management</h1>
                    <p className={styles.header.subtitle}>Define access levels and permissions for the organization.</p>
                </div>
                <button onClick={handleCreate} className={styles.header.primaryBtn}>
                    <Plus className="w-4 h-4 mr-2" /> New Role
                </button>
            </div>

            <div className={styles.table.wrapper}>
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className={styles.table.header}>
                        <tr>
                            <th className={styles.table.headerCell}>Role Name</th>
                            <th className={styles.table.headerCell}>Description</th>
                            <th className={styles.table.headerCell}>Permissions</th>
                            <th className={styles.table.headerCell}>Project Scope</th>
                            <th className={styles.table.actionsCell}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className={styles.table.body}>
                        {filteredRoles.length > 0 ? (
                            filteredRoles.map(role => (
                                <tr key={role.id} className={styles.table.row}>
                                    <td className={styles.table.cell}>
                                        <div className="flex items-center">
                                            <Shield className="w-4 h-4 text-brand-500 mr-3" />
                                            <span className={styles.table.cellTitle}>{role.name}</span>
                                            {role.isSystem && <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">System</span>}
                                        </div>
                                    </td>
                                    <td className={styles.table.cell}>{role.description}</td>
                                    <td className={styles.table.cell}>
                                        <div className="flex flex-wrap gap-1">
                                            {/* Ensure permissions array exists before slicing */}
                                            {role.permissions && role.permissions.slice(0, 3).map(p => (
                                                <span key={p} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded">
                                                    {p.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                            {/* Check the length of the permissions array */}
                                            {role.permissions && role.permissions.length > 3 && (
                                                <span className="text-xs text-slate-500 px-1.5 py-0.5">+{role.permissions.length - 3} more</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={styles.table.cell}>
                                        {/* Show project scope: Global or specific projects */}
                                        {!role.scopedProjectIds || role.scopedProjectIds.length === 0 ? (
                                            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                                                Global
                                            </span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {role.scopedProjectIds.slice(0, 2).map(pid => {
                                                    const proj = projects.find(p => p.id === pid);
                                                    return proj ? (
                                                        <span key={pid} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                                                            {proj.title}
                                                        </span>
                                                    ) : null;
                                                })}
                                                {role.scopedProjectIds.length > 2 && (
                                                    <span className="text-xs text-slate-500">+{role.scopedProjectIds.length - 2}</span>
                                                )}
                                            </div>
                                        )}
                                    </td> 
                                    <td className={styles.table.actionsCell}>
                                        <button onClick={() => handleEdit(role)} className={styles.table.actionBtn}>Edit</button>
                                        {!role.isSystem && (
                                            <button onClick={() => handleDelete(role.id)} className={styles.table.deleteBtn}>Delete</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic">
                                    No roles found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modal.overlay}>
                    <div className={styles.modal.container}>
                        <div className={styles.modal.header}>
                            <h3 className={styles.modal.title}>{editingRole.id ? 'Edit Role' : 'Create New Role'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className={styles.modal.body}>
                                <div className={styles.modal.inputGroup}>
                                    <label className={styles.modal.label}>Role Name <span className="text-red-500">*</span></label>
                                    <input 
                                        required 
                                        className={styles.modal.input} 
                                        value={editingRole.name || ''} 
                                        onChange={e => setEditingRole({ ...editingRole, name: e.target.value })} 
                                    />
                                </div>
                                <div className={styles.modal.inputGroup}>
                                    <label className={styles.modal.label}>Description</label>
                                    <textarea 
                                        className={styles.modal.input} 
                                        value={editingRole.description || ''} 
                                        onChange={e => setEditingRole({ ...editingRole, description: e.target.value })} 
                                        rows={2}
                                    />
                                </div>
                                
                                <div className="mt-4">
                                    <label className={styles.modal.label}>Permissions</label>
                                    <div className={styles.modal.permissionsGrid}>
                                        {AVAILABLE_PERMISSIONS.map(perm => {
                                            const isSelected = editingRole.permissions?.includes(perm.key);
                                            return (
                                                <div 
                                                    key={perm.key} 
                                                    onClick={() => togglePermission(perm.key)}
                                                    className={`${styles.modal.permissionCard} ${isSelected ? 'bg-brand-50 border-brand-200' : 'bg-white'}`}
                                                >
                                                    <div className={`w-4 h-4 mr-3 border rounded flex items-center justify-center ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-slate-300'}`}>
                                                        {isSelected && <Lock className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className={`text-sm ${isSelected ? 'text-brand-800 font-medium' : 'text-slate-600'}`}>
                                                        {perm.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* NEW: Project Scope Section */}
                                <div className="mt-4">
                                    <label className={styles.modal.label}>Project Scope</label>
                                    <p className="text-xs text-slate-500 mb-2">
                                        Leave empty for a global role (applies to all projects). Select specific projects to limit this role's scope.
                                    </p>
                                    <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto bg-slate-50">
                                        {projects.length > 0 ? (
                                            projects.map(project => {
                                                const isScoped = editingRole.scopedProjectIds?.includes(project.id);
                                                return (
                                                    <label key={project.id} className="flex items-center gap-2 py-1.5 hover:bg-slate-100 px-2 rounded cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isScoped || false}
                                                            onChange={() => handleProjectScopeToggle(project.id)}
                                                            className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                                                        />
                                                        <span className={`text-sm ${isScoped ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                                            {project.title}
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">No projects available</p>
                                        )}
                                    </div>
                                    {editingRole.scopedProjectIds && editingRole.scopedProjectIds.length > 0 ? (
                                        <p className="text-xs text-amber-600 mt-2">
                                            ⚠️ This role is scoped to <span className="font-medium">{editingRole.scopedProjectIds.length}</span> project(s)
                                        </p>
                                    ) : (
                                        <p className="text-xs text-green-600 mt-2">
                                            ✓ Global role - applies to all projects
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className={styles.modal.footer}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog 
                state={confirmDialog}
                onClose={() => setConfirmDialog(CONFIRM_DIALOG_INITIAL)}
            />
        </div>
    );
};