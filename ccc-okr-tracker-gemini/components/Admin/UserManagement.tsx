import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { styles } from './styles';
import { User, Role, Project } from '../../types';
import * as DataService from '../../services/dataService';
import { Plus, X, User as UserIcon } from 'lucide-react';

interface UserManagementProps {
    searchQuery: string;
    token: string; // NEW PROP
}

// NEW: Local type for form state, mapping entity fields for convenience
interface UserForEdit extends Omit<User, 'primaryProjectId' | 'roles' | 'assignedProjectIds'> {
    // Reintroduce simple 'projectId' for the local select field's value
    projectId: number | null; 
    // Reintroduce 'roleIds' for the local checkbox/button logic
    roleIds: number[];
    // NEW: Assigned project IDs for multi-project assignment
    assignedProjectIds: number[];
}


export const UserManagement: React.FC<UserManagementProps> = ({ searchQuery, token }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [showInactive, setShowInactive] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    // MODIFIED: Use the UserForEdit type
    const [editingUser, setEditingUser] = useState<Partial<UserForEdit>>({}); 

    // MODIFIED: loadData uses useCallback and token dependency
    const loadData = useCallback(async () => {
        if (!token) return;
        const [u, r, p] = await Promise.all([
            DataService.getUsers(token, showInactive), // Pass token and showInactive flag
            DataService.getRoles(token), // Pass token
            DataService.getAllProjectsForAdmin(token) // Use admin endpoint for all projects
        ]);
        setUsers(u);
        setRoles(r);
        setProjects(p);
    }, [token, showInactive]);

    useEffect(() => {
        loadData();
    }, [loadData]); // Depend on loadData (which depends on token)

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const lowerQ = searchQuery.toLowerCase();
        return users.filter(user => 
            user.firstName.toLowerCase().includes(lowerQ) ||
            user.lastName.toLowerCase().includes(lowerQ) ||
            user.email.toLowerCase().includes(lowerQ) ||
            user.login.toLowerCase().includes(lowerQ) ||
            user.groupNo.toLowerCase().includes(lowerQ)
        );
    }, [users, searchQuery]);

    // MODIFIED: Map the fetched User entity to the local UserForEdit type for the form
    const handleEdit = (user: User) => {
        setEditingUser({ 
            ...user, 
            projectId: user.primaryProjectId, // Map entity field
            roleIds: user.roles.map(r => r.id), // Map roles array to ID array
            assignedProjectIds: user.assignedProjectIds || [] // NEW: Map assigned projects
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingUser({ roleIds: [], projectId: null, assignedProjectIds: [] });
        setIsModalOpen(true);
    };

    // NEW: Handle project assignment toggle
    const handleProjectToggle = (projectId: number) => {
        const currentProjects = editingUser.assignedProjectIds || [];
        if (currentProjects.includes(projectId)) {
            setEditingUser({ 
                ...editingUser, 
                assignedProjectIds: currentProjects.filter(id => id !== projectId) 
            });
        } else {
            setEditingUser({ 
                ...editingUser, 
                assignedProjectIds: [...currentProjects, projectId] 
            });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Map local fields back to the expected backend payload structure
        const payload: Partial<User> = {
            ...editingUser,
            primaryProjectId: editingUser.projectId, // Map projectId back to primaryProjectId
            roleIds: editingUser.roleIds, // Send roleIds for Spring to process
        } as Partial<User>; // Cast to Partial<User>

        // Ensure numbers
        if (payload.primaryProjectId) payload.primaryProjectId = Number(payload.primaryProjectId);
        
        // Remove transient properties used only for UI before sending
        delete payload.projectId; 
        delete payload.roles; // Ensure roles array is not sent if we are sending roleIds

        try {
            if (editingUser.id) {
                await DataService.updateUser(editingUser.id, payload, token); // Pass token
            } else {
                await DataService.addUser(payload, token); // Pass token
            }
            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            console.error("Save User Error:", error);
            alert(`Error saving user: ${error.message}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to deactivate this user?')) {
            try {
                await DataService.deleteUser(id, token); // Pass token
                loadData();
            } catch (error: any) {
                console.error("Delete User Error:", error);
                alert(`Error deactivating user: ${error.message}`);
            }
        }
    };

    const handleReactivate = async (id: number) => {
        if (window.confirm('Are you sure you want to reactivate this user?')) {
            try {
                await DataService.updateUser(id, { isActive: true }, token);
                loadData();
            } catch (error: any) {
                console.error("Reactivate User Error:", error);
                alert(`Error reactivating user: ${error.message}`);
            }
        }
    };

    const handleRoleChange = (roleId: number) => {
        const currentRoles = editingUser.roleIds || [];
        if (currentRoles.includes(roleId)) {
             setEditingUser({ ...editingUser, roleIds: currentRoles.filter(r => r !== roleId) });
        } else {
             setEditingUser({ ...editingUser, roleIds: [...currentRoles, roleId] });
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header.wrapper}>
                <div>
                    <h1 className={styles.header.title}>User Management</h1>
                    <p className={styles.header.subtitle}>Manage employees, accounts, and role assignments.</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Show inactive users
                    </label>
                    <button onClick={handleCreate} className={styles.header.primaryBtn}>
                        <Plus className="w-4 h-4 mr-2" /> Add User
                    </button>
                </div>
            </div>

            <div className={styles.table.wrapper}>
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className={styles.table.header}>
                        <tr>
                            <th className={styles.table.headerCell}>User</th>
                            <th className={styles.table.headerCell}>Group No / Login</th>
                            <th className={styles.table.headerCell}>Assigned Projects</th>
                            <th className={styles.table.headerCell}>Roles</th>
                            <th className={styles.table.actionsCell}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className={styles.table.body}>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <tr key={user.id} className={`${styles.table.row} ${!user.isActive ? 'opacity-50 bg-slate-50' : ''}`}>
                                    <td className={styles.table.cell}>
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">
                                                {user.avatar || 'U'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={styles.table.cellTitle}>{user.firstName} {user.lastName}</span>
                                                    {!user.isActive && (
                                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.table.cell}>
                                        <div className="text-sm text-slate-900">{user.login}</div>
                                        <div className="text-xs text-slate-500">{user.groupNo}</div>
                                    </td>
                                    <td className={styles.table.cell}>
                                        {/* MODIFIED: Show assigned projects count and list */}
                                        {user.assignedProjectIds && user.assignedProjectIds.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {user.assignedProjectIds.slice(0, 2).map(pid => {
                                                    const proj = projects.find(p => p.id === pid);
                                                    return proj ? (
                                                        <span key={pid} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                                            {proj.title}
                                                        </span>
                                                    ) : null;
                                                })}
                                                {user.assignedProjectIds.length > 2 && (
                                                    <span className="text-xs text-slate-500">+{user.assignedProjectIds.length - 2} more</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">No projects</span>
                                        )}
                                    </td>
                                    <td className={styles.table.cell}>
                                        <div className="flex flex-wrap gap-1">
                                            {/* MODIFIED: Map from user.roles property (now an array of Role objects) */}
                                            {user.roles.map(role => (
                                                <span key={role.id} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                                                    {role.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className={styles.table.actionsCell}>
                                        <button onClick={() => handleEdit(user)} className={styles.table.actionBtn}>Edit</button>
                                        {user.isActive ? (
                                            <button onClick={() => handleDelete(user.id)} className={styles.table.deleteBtn}>Deactivate</button>
                                        ) : (
                                            <button onClick={() => handleReactivate(user.id)} className="px-3 py-1 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors border border-green-200">
                                                Reactivate
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic">
                                    No users found matching your search.
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
                            <h3 className={styles.modal.title}>{editingUser.id ? 'Edit User' : 'Add New User'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className={styles.modal.body}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={styles.modal.inputGroup}>
                                        <label className={styles.modal.label}>First Name <span className="text-red-500">*</span></label>
                                        <input required className={styles.modal.input} value={editingUser.firstName || ''} onChange={e => setEditingUser({...editingUser, firstName: e.target.value})} />
                                    </div>
                                    <div className={styles.modal.inputGroup}>
                                        <label className={styles.modal.label}>Last Name <span className="text-red-500">*</span></label>
                                        <input required className={styles.modal.input} value={editingUser.lastName || ''} onChange={e => setEditingUser({...editingUser, lastName: e.target.value})} />
                                    </div>
                                    <div className={styles.modal.inputGroup}>
                                        <label className={styles.modal.label}>Login (Username) <span className="text-red-500">*</span></label>
                                        <input required className={styles.modal.input} value={editingUser.login || ''} onChange={e => setEditingUser({...editingUser, login: e.target.value})} />
                                    </div>
                                    <div className={styles.modal.inputGroup}>
                                        <label className={styles.modal.label}>Group No (ID) <span className="text-red-500">*</span></label>
                                        <input required className={styles.modal.input} value={editingUser.groupNo || ''} onChange={e => setEditingUser({...editingUser, groupNo: e.target.value})} />
                                    </div>
                                    <div className={`${styles.modal.inputGroup} col-span-2`}>
                                        <label className={styles.modal.label}>Email Address <span className="text-red-500">*</span></label>
                                        <input type="email" required className={styles.modal.input} value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                                    </div>
                                    
                                    <div className={`${styles.modal.inputGroup} col-span-2`}>
                                        <label className={styles.modal.label}>Primary Project (Legacy)</label>
                                        <select 
                                            className={styles.modal.select} 
                                            // MODIFIED: Use projectId for the local form field
                                            value={editingUser.projectId || ''} 
                                            // MODIFIED: Update projectId for the local form field
                                            onChange={e => setEditingUser({...editingUser, projectId: e.target.value ? Number(e.target.value) : null})}
                                        >
                                            <option value="">-- No Specific Project --</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.title}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500 mt-1">Legacy field. Use "Project Access" below for multi-project assignment.</p>
                                    </div>

                                    {/* NEW: Multi-project assignment section */}
                                    <div className={`${styles.modal.inputGroup} col-span-2`}>
                                        <label className={styles.modal.label}>Project Access</label>
                                        <p className="text-xs text-slate-500 mb-2">Select projects this user can access. Users without project access will see an empty project list.</p>
                                        <div className="border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-slate-50">
                                            {projects.length > 0 ? (
                                                projects.map(project => {
                                                    const isAssigned = editingUser.assignedProjectIds?.includes(project.id);
                                                    return (
                                                        <label key={project.id} className="flex items-center gap-2 py-1.5 hover:bg-slate-100 px-2 rounded cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isAssigned || false}
                                                                onChange={() => handleProjectToggle(project.id)}
                                                                className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                                                            />
                                                            <span className={`text-sm ${isAssigned ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                                                {project.title}
                                                            </span>
                                                        </label>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-sm text-slate-500 italic">No projects available</p>
                                            )}
                                        </div>
                                        {editingUser.assignedProjectIds && editingUser.assignedProjectIds.length > 0 && (
                                            <p className="text-xs text-slate-600 mt-2">
                                                <span className="font-medium">{editingUser.assignedProjectIds.length}</span> project(s) selected
                                            </p>
                                        )}
                                    </div>

                                    <div className={`${styles.modal.inputGroup} col-span-2`}>
                                        <label className={styles.modal.label}>Assigned Roles</label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {roles.map(role => {
                                                // MODIFIED: Use roleIds from the local form field
                                                const isSelected = editingUser.roleIds?.includes(role.id);
                                                return (
                                                    <button 
                                                        key={role.id}
                                                        type="button"
                                                        onClick={() => handleRoleChange(role.id)}
                                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${isSelected ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                                                    >
                                                        {role.name}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.modal.footer}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};