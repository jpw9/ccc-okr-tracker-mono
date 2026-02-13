import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Project, Quarter, User, Permission } from '../../types';
import { useMyObjectives } from './useMyObjectives';
import { useAuth } from '../../KeycloakProvider';
import { styles as hierarchyStyles } from '../Hierarchy/styles';
import * as DataService from '../../services/dataService';
import { 
    ItemDialog, 
    TreeNodeItem, 
    formatNodeType, 
    getNodeConfig,
    applyProgressRollup 
} from '../shared/TreeViewShared';
import { ConfirmDialog, ConfirmDialogState, CONFIRM_DIALOG_INITIAL } from '../shared/ConfirmDialog';

import { ZoomIn, ZoomOut, EyeOff, Target, X } from 'lucide-react';


// --- MAIN VIEW COMPONENT (MyObjectivesView) ---
interface MyObjectivesViewProps {
    projects: Project[];
    currentUserLogin: string; 
    token: string;
    refreshData: () => void;
    // Get search query from App.tsx instead of relying on a local input
    searchQuery: string; 
}

export const MyObjectivesView: React.FC<MyObjectivesViewProps> = ({ projects, currentUserLogin, token, refreshData, searchQuery }) => {
    // Get authentication and permissions
    const { permissions } = useAuth();
    const canEditObjectives = permissions.has('EDIT_OWN_OBJECTIVES');
    
    const { 
        objectives, 
        filterQuarterYears, setFilterQuarterYears,
        quarterYearOptions,
        filterType, setFilterType,
        filterTypes
    } = useMyObjectives(projects, currentUserLogin); 
    
    // UI State for Modals and Filters
    const [allUsers, setAllUsers] = useState<User[]>([]); 
    const [zoomLevel, setZoomLevel] = useState<'small' | 'medium' | 'large'>('medium');
    const [hideDescription, setHideDescription] = useState(false);
    const [hideProgress, setHideProgress] = useState(false); // NEW: Hide progress toggle
    const [expandSignal, setExpandSignal] = useState(0);
    const [quarterYearDropdownOpen, setQuarterYearDropdownOpen] = useState(false);
    
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        mode: 'ADD' | 'EDIT';
        nodeType: string;
        parentId: number | null;
        item?: any;
    }>({
        isOpen: false,
        mode: 'ADD',
        nodeType: 'Objective',
        parentId: null
    });

    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(CONFIRM_DIALOG_INITIAL);

    const isSearchActive = !!searchQuery;
    
    // Fetch all users for the assignee dropdown
    useEffect(() => {
        const fetchUsers = async () => {
            if (token) {
                try {
                    const users = await DataService.getUsers(token);
                    const activeUsers = users
                        .filter(u => u.isActive)
                        .sort((a, b) => a.lastName.localeCompare(b.lastName));
                    setAllUsers(activeUsers);
                } catch (e) {
                    console.error("Failed to fetch users for assignment dropdown:", e);
                }
            }
        };
        fetchUsers();
    }, [token]);

    const zoomClassMap: Record<'small' | 'medium' | 'large', string> = {
        'small': 'hierarchy-zoom-sm',
        'medium': '', 
        'large': 'hierarchy-zoom-lg',
    };
    const zoomClass = zoomLevel === 'medium' ? '' : zoomClassMap[zoomLevel];

    const cycleZoom = (direction: 'in' | 'out') => {
        setZoomLevel(prev => {
            if (direction === 'in') {
                if (prev === 'small') return 'medium';
                if (prev === 'medium') return 'large';
                return 'large';
            } else {
                if (prev === 'large') return 'medium';
                if (prev === 'medium') return 'small';
                return 'small';
            }
        });
    };
    
    const openAddDialog = (parentId: number | null, type: string) => {
        setDialogState({
            isOpen: true,
            mode: 'ADD',
            nodeType: type,
            parentId: parentId,
            item: {}
        });
    };

    const openEditDialog = (item: any) => {
        setDialogState({
            isOpen: true,
            mode: 'EDIT',
            nodeType: item.type,
            parentId: null,
            item: item
        });
    };

    const handleSave = async (formData: any) => {
        try {
            if (dialogState.mode === 'ADD') {
                await DataService.addEntity(dialogState.parentId, dialogState.nodeType, formData, token);
            } else {
                const updates: any = { ...formData };
                // Clean up transient properties before sending update
                const excludeKeys = ['initiatives', 'goals', 'objectives', 'keyResults', 'actionItems', 'createdBy', 'createdDate', 'updatedBy', 'updatedDate', 'closedBy', 'closedDate', 'projectTitle', 'projectId', 'initiativeTitle', 'goalTitle'];
                excludeKeys.forEach(key => delete updates[key]);
                
                await DataService.updateEntity(dialogState.nodeType, dialogState.item.id, updates, token);
            }
            
            setDialogState(prev => ({ ...prev, isOpen: false }));
            refreshData(); // Refresh app data to see changes
        } catch (error: any) {
            console.error("Save Error:", error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleDelete = (item: any) => {
        // Helper function to count active children
        const getChildrenInfo = (item: any) => {
            let childCount = 0;
            let childType = '';
            
            switch (item.type) {
                case 'Objective':
                    childCount = item.keyResults?.filter((kr: any) => kr.isActive)?.length || 0;
                    childType = 'Key Result';
                    break;
                case 'KeyResult':
                    childCount = item.actionItems?.filter((ai: any) => ai.isActive)?.length || 0;
                    childType = 'Action Item';
                    break;
                case 'ActionItem':
                    childCount = 0;
                    break;
            }
            
            return { childCount, childType };
        };
        
        const { childCount, childType } = getChildrenInfo(item);
        const formattedType = formatNodeType(item.type);
        
        const warning = childCount > 0
            ? `"${item.title}" has ${childCount} active ${childType}${childCount > 1 ? 's' : ''}. Archiving will also archive all its children.`
            : undefined;

        setConfirmDialog({
            isOpen: true,
            title: `Archive ${formattedType}`,
            message: `Are you sure you want to archive "${item.title}"? This moves it to the Recycle Bin.`,
            warning,
            confirmLabel: 'Archive',
            variant: childCount > 0 ? 'warning' : 'danger',
            onConfirm: async () => {
                try {
                    await DataService.updateEntity(item.type, item.id, { isActive: false }, token);
                    refreshData();
                } catch (error: any) {
                    console.error("Delete Error:", error);
                    alert(`Failed to delete item: ${error.message}`);
                }
            },
        });
    };

    const handleComplete = async (item: any) => {
        try {
            await DataService.updateEntity(item.type, item.id, { isCompleted: true, progress: 100 }, token);
            refreshData();
        } catch (error: any) {
            alert(`Error completing item: ${error.message}`);
        }
    };

    const filteredForTree = useMemo(() => {
        // Filter the objective tree structure based on the selected type filter
        const recursiveFilter = (node: any): any | null => {
            if (!node.isActive) return null;
            
            let clonedNode = { ...node };
            const config = getNodeConfig(node.type);
            const childrenKey = config.childrenKey;
            let hasMatchingDescendant = false;

            if (childrenKey && clonedNode[childrenKey] && Array.isArray(clonedNode[childrenKey])) {
                const filteredChildren = clonedNode[childrenKey]
                    .map(recursiveFilter)
                    .filter((n: any) => n !== null);

                if (filteredChildren.length > 0) {
                    hasMatchingDescendant = true;
                    clonedNode[childrenKey] = filteredChildren;
                } else {
                    clonedNode[childrenKey] = [];
                }
            }

            // Keep the node if it matches the current filter type OR has matching descendants
            const matchesSelf = filterType === 'Objective' || node.type === filterType;
            return (matchesSelf || hasMatchingDescendant) ? clonedNode : null;
        };

        // If filterType is Objective, we use the raw objective list (already filtered by quarter)
        if (filterType === 'Objective') {
             return objectives;
        }

        // Otherwise, apply the recursive filter to keep only branches containing the target type
        return objectives.map(recursiveFilter).filter(o => o !== null);
    }, [objectives, filterType]);
    
    

    return (
        <div className={hierarchyStyles.container}>
             <div className={hierarchyStyles.header.wrapper}>
                <div>
                    <h1 className={hierarchyStyles.header.title}>My Assigned Objectives</h1>
                    <p className={hierarchyStyles.header.subtitle}>Focus on objectives, key results, and action items assigned to you.</p>
                </div>
                
                <div className={hierarchyStyles.header.addButton}>
                    
                    {/* Zoom Controls (Simplified: no XLarge) */}
                    <div className="flex gap-2 items-center mr-4 bg-white/10 rounded-lg p-0.5">
                        <button 
                            onClick={() => cycleZoom('out')}
                            disabled={zoomLevel === 'small'}
                            className="p-1.5 text-slate-100 disabled:text-slate-500 disabled:hover:bg-transparent hover:text-white hover:bg-brand-500 rounded transition-colors" 
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => cycleZoom('in')}
                            disabled={zoomLevel === 'large'}
                            className="p-1.5 text-slate-100 disabled:text-slate-500 disabled:hover:bg-transparent hover:text-white hover:bg-brand-500 rounded transition-colors" 
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>

                </div>
            </div>

            {/* MODERN COMPACT FILTER BAR */}
            <div className={hierarchyStyles.filterBar.wrapper}>
                <div className={hierarchyStyles.filterBar.row}>
                   {/* Quarter Filter */}
                   <div className={hierarchyStyles.filterBar.filterGroup}>
                       <label className={hierarchyStyles.filterBar.label}>Quarter</label>
                       <div className="relative">
                           <button
                               onClick={() => setQuarterYearDropdownOpen(!quarterYearDropdownOpen)}
                               className="h-8 px-2.5 py-1 bg-slate-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition-all min-w-[120px] max-w-[180px] text-slate-700 font-medium flex items-center justify-between gap-2"
                           >
                               <span className="truncate text-left flex-1">
                                   {filterQuarterYears.length === 0 
                                       ? 'All' 
                                       : filterQuarterYears.length === 1
                                       ? filterQuarterYears[0]
                                       : `${filterQuarterYears.length} selected`}
                               </span>
                               <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                               </svg>
                           </button>
                           {quarterYearDropdownOpen && (
                               <div className="absolute z-50 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                                   <div className="p-2 space-y-0.5">
                                       {quarterYearOptions.map(qy => (
                                           <label key={qy} className="flex items-center gap-2 px-2 py-1.5 hover:bg-brand-50 rounded cursor-pointer transition-colors">
                                               <input
                                                   type="checkbox"
                                                   checked={filterQuarterYears.includes(qy)}
                                                   onChange={(e) => {
                                                       const newQuarterYears = e.target.checked
                                                           ? [...filterQuarterYears, qy]
                                                           : filterQuarterYears.filter(fqy => fqy !== qy);
                                                       setFilterQuarterYears(newQuarterYears);
                                                   }}
                                                   className="h-3.5 w-3.5 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                                               />
                                               <span className="text-sm text-slate-700">{qy}</span>
                                           </label>
                                       ))}
                                   </div>
                                   <div className="border-t border-slate-200 p-2">
                                       <button
                                           onClick={() => {
                                               setFilterQuarterYears([]);
                                           }}
                                           className="w-full px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                       >
                                           Clear All
                                       </button>
                                   </div>
                               </div>
                           )}
                       </div>
                   </div>

                    {/* View Filter */}
                    <div className={hierarchyStyles.filterBar.filterGroup}>
                        <label className={hierarchyStyles.filterBar.label}>View</label>
                        <select 
                           value={filterType} 
                           onChange={e => setFilterType(e.target.value)} 
                           className={hierarchyStyles.filterBar.select}
                       >
                           {filterTypes.map(type => (
                               <option key={type} value={type}>{formatNodeType(type)}</option>
                           ))}
                       </select>
                    </div>

                    <div className={hierarchyStyles.filterBar.divider}></div>
                
                    {/* View Toggles */}
                    <button 
                        onClick={() => setHideDescription(!hideDescription)}
                        className={hierarchyStyles.filterBar.toggleBtn(hideDescription)}
                        title={hideDescription ? 'Show Descriptions' : 'Hide Descriptions'}
                    >
                        <EyeOff className="w-3.5 h-3.5"/> 
                        <span>Descriptions</span>
                    </button>
                    
                    <button 
                        onClick={() => setHideProgress(!hideProgress)}
                        className={hierarchyStyles.filterBar.toggleBtn(hideProgress)}
                        title={hideProgress ? 'Show Progress' : 'Hide Progress'}
                    >
                        <EyeOff className="w-3.5 h-3.5"/> 
                        <span>Progress</span>
                    </button>
                    
                    <div className={hierarchyStyles.filterBar.divider}></div>
                    
                    {/* Clear All Filters Button */}
                    <button 
                        onClick={() => {
                            setFilterQuarterYears([]);
                            setFilterType('Objective');
                            setHideDescription(false);
                            setHideProgress(false);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 hover:bg-white/60 rounded-md transition-colors"
                        title="Clear All Filters"
                    >
                        <X className="w-3.5 h-3.5"/> 
                        <span>Clear All</span>
                    </button>
                </div>
            </div>

            <div className={hierarchyStyles.list.wrapper}>
                {filteredForTree.length > 0 ? (
                    filteredForTree.map(objective => (
                        <TreeNodeItem 
                            key={`obj-${objective.id}`} 
                            item={objective} 
                            level={0}
                            parentId={objective.goalId}
                            isSearchActive={isSearchActive}
                            expandSignal={expandSignal}
                            zoomClass={zoomClass}
                            hideDescription={hideDescription}
                            hideProgress={hideProgress}
                            onAdd={openAddDialog}
                            onEdit={openEditDialog}
                            onDelete={handleDelete}
                            onComplete={handleComplete}
                            showProjectCard={false}
                            canManageStrategy={canEditObjectives}
                            showFilteredProgress={filterQuarterYears.length > 0}
                        />
                    ))
                ) : (
                    <div className={hierarchyStyles.list.emptyState}>
                        <div className={hierarchyStyles.list.emptyIconWrapper}>
                            <Target className={hierarchyStyles.list.emptyIcon} />
                        </div>
                        <h3 className={hierarchyStyles.list.emptyTitle}>No Assigned Objectives Found</h3>
                        <p className={hierarchyStyles.list.emptyDesc}>
                            No objectives found matching your filters. Make sure you are assigned to objectives via your user login ({currentUserLogin}).
                        </p>
                        <button 
                            onClick={() => setFilterQuarterYears([])}
                            className={hierarchyStyles.list.emptyButton}
                        >
                            Clear Quarter Filter
                        </button>
                    </div>
                )}
            </div>

            <ItemDialog 
                isOpen={dialogState.isOpen}
                mode={dialogState.mode}
                nodeType={dialogState.nodeType}
                initialData={dialogState.item}
                allUsers={allUsers}
                onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
                onSave={handleSave}
            />

            <ConfirmDialog 
                state={confirmDialog}
                onClose={() => setConfirmDialog(CONFIRM_DIALOG_INITIAL)}
            />
        </div>
    );
};