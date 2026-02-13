/**
 * Shared tree view components and utilities for both Hierarchy and MyObjectives views.
 * This provides a unified, consistent tree interface with identical features across both screens.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Quarter, User } from '../../types';
import { 
    ChevronRight, ChevronDown, Plus, Edit2, Trash2, CheckSquare, X,
    Layers, BarChart2, Target, Award, List, Folder
} from 'lucide-react';
import * as DataService from '../../services/dataService';
import { styles as hierarchyStyles } from '../Hierarchy/styles';

// ============================================================================
// NODE CONFIG & TYPE UTILITIES (Unified across both views)
// ============================================================================

export const getNodeConfig = (type: string) => {
    const configMap: Record<string, any> = {
        'Project': { 
            icon: Layers, 
            color: 'text-slate-800', 
            badge: 'bg-brand-50 border-brand-200 text-brand-700',
            nextType: 'StrategicInitiative',
            childrenKey: 'initiatives'
        },
        'StrategicInitiative': { 
            icon: BarChart2, 
            color: 'text-cyan-600', 
            badge: 'bg-cyan-50 border-cyan-200 text-cyan-700',
            nextType: 'Goal',
            childrenKey: 'goals'
        },
        'Goal': { 
            icon: Target, 
            color: 'text-slate-700', 
            badge: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            nextType: 'Objective',
            childrenKey: 'objectives'
        },
        'Objective': { 
            icon: Award, 
            color: 'text-slate-700', 
            badge: 'bg-violet-50 border-violet-200 text-violet-700',
            nextType: 'KeyResult',
            childrenKey: 'keyResults'
        },
        'KeyResult': { 
            icon: List, 
            color: 'text-slate-700', 
            badge: 'bg-amber-50 border-amber-200 text-amber-700',
            nextType: 'ActionItem',
            childrenKey: 'actionItems'
        },
        'ActionItem': { 
            icon: CheckSquare, 
            color: 'text-slate-700', 
            badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            nextType: null,
            childrenKey: null
        },
    };
    
    return configMap[type] || { 
        icon: Folder, 
        color: 'text-slate-600', 
        badge: 'bg-slate-100 text-slate-700',
        nextType: null,
        childrenKey: null
    };
};

export const formatNodeType = (type: string, plural: boolean = false): string => {
    if (type === 'ALL') return 'ALL';
    if (!type || typeof type !== 'string') return plural ? 'Items' : 'Item';
    
    let formatted = type.replace(/([A-Z])/g, ' $1').trim();
    if (plural) {
        return formatted.endsWith('s') ? formatted : formatted + 's';
    }
    return formatted;
};

// ============================================================================
// TREE NODE EXPANSION STATE HOOK (Shared localStorage-backed state)
// ============================================================================

const STORAGE_KEY_PREFIX = 'okr-expansion-';

const getInitialExpansionState = (id: number, defaultState: boolean): boolean => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_PREFIX + id);
        if (stored === null) return defaultState;
        return JSON.parse(stored);
    } catch (error) {
        console.error("Error reading localStorage", error);
        return defaultState;
    }
};

const setExpansionState = (id: number, state: boolean) => {
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify(state));
    } catch (error) {
        console.error("Error writing to localStorage", error);
    }
};

export const useTreeNodeState = (
    item: any,
    level: number,
    isSearchActive: boolean,
    expandSignal: number = 0
) => {
    const defaultOpen = level < 1; // Only open root level by default
    const [isOpen, internalSetIsOpen] = useState(
        getInitialExpansionState(item.id, defaultOpen)
    );

    const setIsOpen = (newOpenState: boolean) => {
        internalSetIsOpen(newOpenState);
        setExpansionState(item.id, newOpenState);
    };

    // React to global expansion signals
    useEffect(() => {
        if (expandSignal > 0) {
            internalSetIsOpen(true);
        }
        if (expandSignal < 0) {
            internalSetIsOpen(false);
        }
    }, [expandSignal]);

    // React to search
    useEffect(() => {
        if (isSearchActive) internalSetIsOpen(true);
    }, [isSearchActive]);

    const config = getNodeConfig(item.type);
    const children = item[config.childrenKey] || [];

    return {
        isOpen,
        setIsOpen,
        config,
        children,
    };
};

// ============================================================================
// SHARED ITEM DIALOG COMPONENT
// ============================================================================

export interface ItemDialogProps {
    isOpen: boolean;
    mode: 'ADD' | 'EDIT';
    nodeType: string;
    initialData?: any;
    allUsers: User[];
    onClose: () => void;
    onSave: (data: any) => void;
}

export const ItemDialog: React.FC<ItemDialogProps> = ({ 
    isOpen, mode, nodeType, initialData, allUsers, onClose, onSave 
}) => {
    if (!isOpen) return null;

    const getInitialState = () => {
        const defaultState: any = { 
            progress: 0, 
            year: new Date().getFullYear(),
            quarter: Quarter.Q1, 
            isCompleted: false
        };

        const cleanedData = { ...initialData };

        if (cleanedData.dueDate) {
            const date = new Date(cleanedData.dueDate);
            if (!isNaN(date.getTime())) {
                cleanedData.dueDate = date.toISOString().split('T')[0];
            }
        }
        
        if (cleanedData.dueDate === null) cleanedData.dueDate = '';

        return { ...defaultState, ...cleanedData };
    };

    const [formData, setFormData] = useState<any>(getInitialState());

    // Prevent body scroll when dialog is open
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;

        setFormData((prev: any) => {
            const newData = { 
                ...prev, 
                [name]: type === 'checkbox' 
                    ? checked 
                    : (type === 'number' ? (value === '' ? null : Number(value)) : value) 
            };
            
            // If isCompleted checkbox is changed, also update progress to sync them
            if (name === 'isCompleted' && type === 'checkbox') {
                newData.progress = checked ? 100 : 0;
            }
            
            return newData;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // For ActionItems, enforce sync between isCompleted and progress
        // Progress field takes priority as the source of truth
        if (nodeType === 'ActionItem') {
            const finalData = { ...formData };
            
            // Sync isCompleted based on progress value
            if (finalData.progress === 100) {
                finalData.isCompleted = true;
            } else if (finalData.progress != null && finalData.progress < 100) {
                finalData.isCompleted = false;
            }
            
            onSave(finalData);
        } else {
            onSave(formData);
        }
    };

    const formattedNodeType = formatNodeType(nodeType);
    const title = mode === 'ADD' 
        ? `Add New ${formattedNodeType}` 
        : `Edit ${formattedNodeType}`;
    
    // Progress rules:
    // - Project, StrategicInitiative, Goal: calculated from children → hide in ADD, read-only in EDIT
    // - Objective, KeyResult, ActionItem: user-editable in EDIT, hidden in ADD
    const isCalculatedType = ['Project', 'StrategicInitiative', 'Goal'].includes(nodeType);
    const isEditableProgressType = ['Objective', 'KeyResult', 'ActionItem'].includes(nodeType);
    const showProgressInput = mode === 'EDIT' && (isCalculatedType || isEditableProgressType);
    const isProgressReadOnly = isCalculatedType; // Calculated types are always read-only

    return (
        <div className={hierarchyStyles.dialog.overlay}>
            <div className={hierarchyStyles.dialog.container}>
                <div className={hierarchyStyles.dialog.header}>
                    <h3 className={hierarchyStyles.dialog.title}>{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className={hierarchyStyles.dialog.form}>
                    <div className="space-y-4">
                        <div>
                            <label className={hierarchyStyles.dialog.label}>Title <span className="text-red-500">*</span></label>
                            <input 
                                name="title" 
                                value={formData.title || ''} 
                                onChange={handleChange} 
                                className={hierarchyStyles.dialog.input} 
                                required 
                            />
                        </div>
                        <div>
                            <label className={hierarchyStyles.dialog.label}>Description</label>
                            <textarea 
                                name="description" 
                                value={formData.description || ''} 
                                onChange={handleChange} 
                                className={hierarchyStyles.dialog.textarea} 
                                rows={2}
                            />
                        </div>
                        
                        {showProgressInput && (
                            <div>
                                <label className={hierarchyStyles.dialog.label}>
                                    Progress (%)
                                    {isProgressReadOnly && (
                                        <span className="ml-2 text-xs text-slate-400 font-normal">— auto-calculated from children</span>
                                    )}
                                </label>
                                <input 
                                    type="number" 
                                    name="progress" 
                                    value={formData.progress ?? ''} 
                                    onChange={handleChange} 
                                    className={`${hierarchyStyles.dialog.input} ${isProgressReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} 
                                    min="0"
                                    max="100"
                                    placeholder="0 to 100"
                                    disabled={isProgressReadOnly}
                                    readOnly={isProgressReadOnly}
                                />
                            </div>
                        )}

                        {nodeType === 'Objective' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={hierarchyStyles.dialog.label}>Quarter</label>
                                    <select name="quarter" value={formData.quarter || 'Q1'} onChange={handleChange} className={hierarchyStyles.dialog.select}>
                                        <option value="Q1">Q1</option>
                                        <option value="Q2">Q2</option>
                                        <option value="Q3">Q3</option>
                                        <option value="Q4">Q4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={hierarchyStyles.dialog.label}>Year</label>
                                    <input type="number" name="year" value={formData.year || new Date().getFullYear()} onChange={handleChange} className={hierarchyStyles.dialog.input} />
                                </div>
                                <div>
                                    <label className={hierarchyStyles.dialog.label}>Due Date</label>
                                    <input type="date" name="dueDate" value={formData.dueDate || ''} onChange={handleChange} className={hierarchyStyles.dialog.input} />
                                </div>
                            </div>
                        )}

                        {nodeType === 'KeyResult' && (
                            <div>
                                <label className={hierarchyStyles.dialog.label}>Due Date</label>
                                <input type="date" name="dueDate" value={formData.dueDate || ''} onChange={handleChange} className={hierarchyStyles.dialog.input} />
                            </div>
                        )}
                        
                        {(nodeType === 'ActionItem' || nodeType === 'Objective' || nodeType === 'KeyResult') && (
                            <div>
                                <label className={hierarchyStyles.dialog.label}>Assignee</label>
                                <select 
                                    name="assignee" 
                                    value={formData.assignee || ''} 
                                    onChange={handleChange} 
                                    className={hierarchyStyles.dialog.select}
                                >
                                    <option value="">-- Select Assignee --</option>
                                    {allUsers.map(user => (
                                        <option key={user.id} value={user.login}>
                                            {user.firstName} {user.lastName} ({user.login})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                         
                        {nodeType === 'ActionItem' && (
                            <>
                                <div>
                                    <label className={hierarchyStyles.dialog.label}>Due Date</label>
                                    <input type="date" name="dueDate" value={formData.dueDate || ''} onChange={handleChange} className={hierarchyStyles.dialog.input} />
                                </div>
                                <div className="flex items-center mt-3">
                                    <input 
                                        type="checkbox" 
                                        name="isCompleted" 
                                        checked={formData.isCompleted || false} 
                                        onChange={handleChange}
                                        className="h-4 w-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                                    />
                                    <label className="ml-2 text-sm font-medium text-slate-700">Mark as Completed</label>
                                </div>
                            </>
                        )}
                    </div>
                    <div className={hierarchyStyles.dialog.footer}>
                        <button type="button" onClick={onClose} className={hierarchyStyles.dialog.btnCancel}>Cancel</button>
                        <button type="submit" className={hierarchyStyles.dialog.btnSave}>
                            {mode === 'ADD' ? 'Create Item' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================================================
// UNIFIED TREE NODE ITEM COMPONENT
// ============================================================================

export interface TreeNodeItemProps {
    item: any;
    level: number;
    parentId: number | null;
    isLast?: boolean;
    isSearchActive: boolean;
    expandSignal: number;
    zoomClass: string;
    hideDescription: boolean;
    onAdd: (parentId: number, type: string) => void;
    onEdit: (item: any) => void;
    onDelete: (item: any) => void;
    onComplete: (item: any) => void;
    showProjectCard?: boolean; // True for level 0 in Hierarchy view
    canManageStrategy: boolean; // Whether user can add/edit/delete items
    showFilteredProgress?: boolean; // Whether to show filtered progress calculation
    hideProgress?: boolean; // NEW: Hide progress bars and percentages
}

export const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
    item,
    level,
    parentId,
    isLast,
    isSearchActive,
    expandSignal,
    zoomClass,
    hideDescription,
    hideProgress = false,
    onAdd,
    onEdit,
    onDelete,
    onComplete,
    showProjectCard = true,
    canManageStrategy = false,
    showFilteredProgress = false
}) => {
    const { isOpen, setIsOpen, config, children } = useTreeNodeState(item, level, isSearchActive, expandSignal);

    const Icon = config.icon;
    const activeChildren = children.filter((c: any) => c.isActive);
    const hasChildren = activeChildren.length > 0;
    const childCount = activeChildren.length;
    const sortedActiveChildren = activeChildren.slice().sort((a: any, b: any) => a.id - b.id);

    const nextType = config.nextType;
    const formattedNextTypePlural = nextType ? formatNodeType(nextType, true) : null;
    const formattedNextTypeSingular = nextType ? formatNodeType(nextType, false) : null;

    // Calculate filtered progress if showFilteredProgress is enabled
    const filteredProgress = showFilteredProgress ? calculateFilteredProgress(item) : null;
    const actualProgress = item.progress || 0;

    // Render as Project Card for level 0 in Hierarchy view
    if (level === 0 && showProjectCard) {
        return (
            <div className={`${hierarchyStyles.projectCard.container} ${zoomClass}`}>
                <div className={hierarchyStyles.projectCard.header} onClick={() => setIsOpen(!isOpen)}>
                    <div className="flex items-center gap-4 flex-1 cursor-pointer">
                        <div className={`p-2.5 rounded-lg shadow-sm ${config.badge}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <h3 className={hierarchyStyles.projectCard.title}>{item.title}</h3>
                                {childCount > 0 && formattedNextTypePlural && (
                                    <span className={hierarchyStyles.node.childCountBadge}>
                                        {childCount} {formattedNextTypePlural}
                                    </span>
                                )}
                            </div>
                            <p className={hierarchyStyles.projectCard.description(hideDescription)}>{item.description}</p>
                            {!hideProgress && (
                                <div className={hierarchyStyles.projectCard.progressWrapper}>
                                    <div className={hierarchyStyles.projectCard.progressBg}>
                                        <div 
                                            className={hierarchyStyles.projectCard.progressFill(actualProgress)}
                                            style={{ width: `${actualProgress}%` }} 
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={hierarchyStyles.projectCard.progressText}>{actualProgress}%</span>
                                        {showFilteredProgress && filteredProgress !== null && filteredProgress !== actualProgress && (
                                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded" title="Progress based on current filter">
                                                Filtered: {filteredProgress}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={hierarchyStyles.projectCard.actions}>
                        <div className="flex gap-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
                                title={isOpen ? "Collapse Project" : "Expand Project"} 
                                className={hierarchyStyles.projectCard.actionBtn}
                            >
                                {isOpen ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                            </button>
                            
                            {nextType && canManageStrategy && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onAdd(item.id, nextType); }} 
                                    title={`Add ${formattedNextTypeSingular}`} 
                                    className={hierarchyStyles.projectCard.actionBtn}
                                >
                                    <Plus className="w-4 h-4"/>
                                </button>
                            )}
                            {canManageStrategy && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
                                    title="Edit Project" 
                                    className={hierarchyStyles.projectCard.actionBtn}
                                >
                                    <Edit2 className="w-4 h-4"/>
                                </button>
                            )}
                            {canManageStrategy && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(item); }} 
                                    title="Archive Project" 
                                    className={hierarchyStyles.projectCard.actionBtn}
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                {isOpen && (
                    <div className={hierarchyStyles.projectCard.content}>
                        {sortedActiveChildren.map((child: any, idx: number, arr: any[]) => (
                            <TreeNodeItem 
                                key={child.id}
                                item={child} 
                                level={level + 1} 
                                parentId={item.id} 
                                isLast={idx === arr.length - 1}
                                isSearchActive={isSearchActive}
                                expandSignal={expandSignal}
                                zoomClass={zoomClass}
                                hideDescription={hideDescription}
                                hideProgress={hideProgress}
                                onAdd={onAdd}
                                onEdit={onEdit} 
                                onDelete={onDelete} 
                                onComplete={onComplete}
                                showProjectCard={showProjectCard}
                                canManageStrategy={canManageStrategy}
                                showFilteredProgress={showFilteredProgress}
                            />
                        ))}
                        {activeChildren.length === 0 && formattedNextTypePlural && formattedNextTypeSingular && (
                            <div className="text-center py-6 text-slate-400 text-sm italic">
                                No {formattedNextTypePlural.toLowerCase()} defined yet.
                                {canManageStrategy && (
                                    <button onClick={(e) => { e.stopPropagation(); onAdd(item.id, nextType!); }} className="ml-2 text-brand-600 hover:underline font-medium">
                                        + Add First {formattedNextTypeSingular}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Render as standard nested node item
    return (
        <div className={hierarchyStyles.node.wrapper}>
            <div className={hierarchyStyles.node.lineVertical(!!isLast)}></div>
            <div className={hierarchyStyles.node.lineHorizontal}></div>

            <div className={`${hierarchyStyles.node.contentWrapper} ${zoomClass}`}>
                <div className={hierarchyStyles.node.row(level)}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                        className={`${hierarchyStyles.node.toggleBtn(hasChildren, nextType)}`}
                    >
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
                    </button>

                    <div className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer" onClick={() => setIsOpen(!isOpen)}> 
                        <div className={`mt-0.5 ${hierarchyStyles.node.iconBadge(config.badge)}`}>
                            <Icon className="w-3 h-3" />
                        </div>
                                
                        <div className="flex-1 min-w-0">
                            <div className={hierarchyStyles.node.titleRow}>
                                <span className={`${hierarchyStyles.node.title(level)} ${config.color}`}>
                                    {item.title}
                                </span>

                                {item.assignee && (
                                    <span className={hierarchyStyles.node.assigneeBadge}>
                                        {item.assignee}
                                    </span>
                                )}
                                
                                {item.type === 'Objective' && item.quarter && item.year && item.year > 0 && (
                                    <span className={hierarchyStyles.node.metaBadge}>
                                        {item.quarter} {item.year}
                                    </span>
                                )}
                                {childCount > 0 && formattedNextTypePlural && (
                                    <span className={hierarchyStyles.node.childCountBadge}>
                                        {childCount} {formattedNextTypePlural}
                                    </span>
                                )}
                                {item.type === 'ActionItem' && item.progress === 100 && (
                                    <span className={hierarchyStyles.node.doneBadge}>Done</span>
                                )}
                            </div>
                                    
                            {item.description && <p className={hierarchyStyles.node.description(hideDescription)}>{item.description}</p>}

                            {item.type === 'KeyResult' && item.manualProgressSet && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold flex items-center gap-1">
                                        🔒 Manual Progress
                                    </span>
                                </div>
                            )}

                            {!hideProgress && (
                                <div className={hierarchyStyles.node.progressRow}>
                                    <div className={hierarchyStyles.node.progressBarBg}>
                                        <div 
                                            className={hierarchyStyles.node.progressBarFill(actualProgress)}
                                            style={{ width: `${actualProgress}%` }} 
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-medium ml-2">{actualProgress}%</span>
                                        {showFilteredProgress && filteredProgress !== null && filteredProgress !== actualProgress && (
                                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded" title="Progress based on current filter">
                                                Filtered: {filteredProgress}%
                                            </span>
                                        )}
                                    </div>
                                    {item.type === 'KeyResult' && item.dueDate && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">
                                                Due: {new Date(item.dueDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                            
                    <div className={hierarchyStyles.node.actionsWrapper}>
                        {item.type === 'ActionItem' && canManageStrategy && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onComplete(item); }} 
                                title={item.isCompleted ? "Mark as Undone" : "Mark as Done"} 
                                className={`${hierarchyStyles.node.actionBtn} ${item.isCompleted ? 'text-green-600' : ''}`}
                            >
                                <CheckSquare className="w-3.5 h-3.5"/>
                            </button>
                        )}
                        
                        {nextType && canManageStrategy && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onAdd(item.id, nextType); }} 
                                title={`Add ${formattedNextTypeSingular}`} 
                                className={hierarchyStyles.node.actionBtn}
                            >
                                <Plus className="w-3.5 h-3.5"/>
                            </button>
                        )}

                        {canManageStrategy && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
                                title={`Edit ${item.type}`}
                                className={hierarchyStyles.node.actionBtn}
                            >
                                <Edit2 className="w-3.5 h-3.5"/>
                            </button>
                        )}

                        {canManageStrategy && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(item); }} 
                                title={`Delete ${item.type}`}
                                className={hierarchyStyles.node.actionBtn}
                            >
                                <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                        )}
                    </div>
                </div>

                {isOpen && (
                    <div className="ml-3">
                        {sortedActiveChildren.length > 0 ? (
                            sortedActiveChildren.map((child: any, idx: number, arr: any[]) => (
                                <TreeNodeItem 
                                    key={child.id}
                                    item={child} 
                                    level={level + 1}
                                    parentId={item.id}
                                    isLast={idx === arr.length - 1}
                                    isSearchActive={isSearchActive}
                                    expandSignal={expandSignal}
                                    zoomClass={zoomClass}
                                    hideDescription={hideDescription}
                                    hideProgress={hideProgress}
                                    onAdd={onAdd}
                                    onEdit={onEdit} 
                                    onDelete={onDelete} 
                                    onComplete={onComplete}
                                    showProjectCard={showProjectCard}
                                    canManageStrategy={canManageStrategy}
                                    showFilteredProgress={showFilteredProgress}
                                />
                            ))
                        ) : formattedNextTypePlural && formattedNextTypeSingular ? (
                            <div className="flex items-center gap-2 py-2 px-4 ml-6 border-l border-dashed border-slate-300">
                                <span className="text-xs text-slate-400 italic">No {formattedNextTypePlural.toLowerCase()} defined.</span>
                                {canManageStrategy && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onAdd(item.id, nextType!); }}
                                        className="text-xs font-semibold text-brand-600 hover:underline flex items-center"
                                    >
                                        <Plus className="w-3 h-3 mr-1"/> Add {formattedNextTypeSingular}
                                    </button>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// ROLLUP CALCULATION UTILITY
// ============================================================================

/**
 * Calculate progress rollup from child items to parent
 * Child progress automatically rolls up to parent if not manually set
 */
export const calculateRollupProgress = (item: any): number => {
    const config = getNodeConfig(item.type);
    const children = item[config.childrenKey] || [];

    // If item has manual progress set or is a leaf, use its progress
    if (item.manualProgressSet || !children.length) {
        return item.progress || 0;
    }

    // Calculate average of children's progress
    if (children.length > 0) {
        const activeChildren = children.filter((c: any) => c.isActive);
        if (activeChildren.length > 0) {
            const totalProgress = activeChildren.reduce((sum: number, child: any) => {
                return sum + calculateRollupProgress(child);
            }, 0);
            return Math.round(totalProgress / activeChildren.length);
        }
    }

    return item.progress || 0;
};

/**
 * Calculate filtered progress based on visible children in current tree
 * This is for display only and shows progress based on filtered view
 */
export const calculateFilteredProgress = (item: any): number => {
    const config = getNodeConfig(item.type);
    const children = item[config.childrenKey] || [];

    // If no children or leaf node, use actual progress
    if (!children || children.length === 0) {
        return item.progress || 0;
    }

    // Calculate average progress from visible active children
    const activeChildren = children.filter((c: any) => c.isActive);
    if (activeChildren.length > 0) {
        const totalProgress = activeChildren.reduce((sum: number, child: any) => {
            return sum + calculateFilteredProgress(child);
        }, 0);
        return Math.round(totalProgress / activeChildren.length);
    }

    return item.progress || 0;
};

/**
 * Update item with rolled-up progress from children
 */
export const applyProgressRollup = (item: any): any => {
    const config = getNodeConfig(item.type);
    const childrenKey = config.childrenKey;
    
    if (childrenKey && item[childrenKey]) {
        item[childrenKey] = item[childrenKey].map((child: any) => applyProgressRollup(child));
    }

    // Only auto-calculate if manual progress is not set
    if (!item.manualProgressSet) {
        item.progress = calculateRollupProgress(item);
    }

    return item;
};
