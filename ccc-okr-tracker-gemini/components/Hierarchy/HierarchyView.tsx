import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Project, Quarter, User } from '../../types'; 
import { styles } from './styles';
import * as DataService from '../../services/dataService';
import { useAuth } from '../../KeycloakProvider';
import { 
    ItemDialog, 
    TreeNodeItem as NodeItem, 
    formatNodeType, 
    getNodeConfig,
    applyProgressRollup,
    useTreeNodeState 
} from '../shared/TreeViewShared';
import { ChevronsUp, ChevronsDown, Plus, ZoomIn, ZoomOut, EyeOff, Layers } from 'lucide-react';

// --- TYPE DEFINITIONS FOR FILTERING ---
interface FilterState {
    filterType: string;
    filterQuarterYears: string[]; // e.g., ["Q1 2025", "Q4 2025", "Q1 2026"] - Empty array = show all
    filterStatus: string;
    hideDescription: boolean;
    filterInitiativeId: number | 'ALL';
}

const LEVEL_TYPES = ['ALL', 'Project', 'StrategicInitiative', 'Goal', 'Objective', 'KeyResult', 'ActionItem'];
const STATUS_TYPES = ['ALL', 'COMPLETED', 'ON_TRACK', 'AT_RISK'];

// Generate available years (current year +/- 2 years)
const currentYear = new Date().getFullYear();

// Generate combined quarter-year options (e.g., "Q1 2024", "Q2 2024", etc.)
const QUARTER_YEAR_OPTIONS = [];
for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    for (const quarter of ['Q1', 'Q2', 'Q3', 'Q4']) {
        QUARTER_YEAR_OPTIONS.push(`${quarter} ${year}`);
    }
}


// --- FILTERING LOGIC (UNCHANGED) ---
const filterHierarchyTree = (projects: Project[], filters: FilterState): Project[] => {
// ... (unchanged) ...
    const isNodeMatch = (item: any): boolean => {
        // 1. Type Filter
        if (filters.filterType !== 'ALL' && item.type !== filters.filterType) {
            return false;
        }

        // 2. Quarter-Year Filter (only applies to Objectives)
        if (item.type === 'Objective' && filters.filterQuarterYears.length > 0) {
            // Check if objective's quarter-year combination is in selected options
            const itemQuarterYear = `${item.quarter} ${item.year}`;
            if (!filters.filterQuarterYears.includes(itemQuarterYear)) {
                return false;
            }
        }

        // 3. Status Filter (Applies to anything with a progress field)
        if (filters.filterStatus !== 'ALL' && item.progress !== undefined) {
            const progress = item.progress;
            switch (filters.filterStatus) {
                case 'COMPLETED':
                    if (progress !== 100) return false;
                    break;
                case 'AT_RISK':
                    if (progress >= 70 || progress === 100) return false;
                    break;
                case 'ON_TRACK':
                    if (progress < 70 || progress === 100) return false;
                    break;
                default:
                    break;
            }
        }

        return true;
    };

    const recursiveFilter = (node: any): any | null => {
        if (!node.isActive) return null;

        let clonedNode = { ...node };
        let hasMatchingDescendant = false;

        // ISOLATION STEP: Prune non-matching Initiatives
        if (filters.filterInitiativeId !== 'ALL' && clonedNode.type === 'StrategicInitiative') {
            if (clonedNode.id !== filters.filterInitiativeId) {
                return null; // Eliminate non-target Initiative
            }
        }
        
        const childrenKeys = ['initiatives', 'goals', 'objectives', 'keyResults', 'actionItems'];
        
        for (const key of childrenKeys) {
            if (clonedNode[key] && Array.isArray(clonedNode[key])) {
                
                const filteredChildren = clonedNode[key]
                    .map(recursiveFilter)
                    .filter((n: any) => n !== null);

                if (filteredChildren.length > 0) {
                    hasMatchingDescendant = true;
                    clonedNode[key] = filteredChildren;
                } else {
                    clonedNode[key] = [];
                }
            }
        }

        const matchesSelf = isNodeMatch(node);

        // ABSOLUTE FILTERING: For Objectives with Quarter/Year filter, enforce strict matching
        // Don't allow descendants to override quarter/year filtering
        if (clonedNode.type === 'Objective' && filters.filterQuarterYears.length > 0) {
            if (!matchesSelf) {
                return null; // Strictly filter out Objectives that don't match the quarter/year
            }
        }

        // HIDE EMPTY PARENTS: When quarter filtering is active, hide parent nodes with no descendant Objectives
        if (filters.filterQuarterYears.length > 0) {
            const parentTypes = ['Project', 'StrategicInitiative', 'Goal'];
            if (parentTypes.includes(clonedNode.type) && !hasMatchingDescendant) {
                return null; // Hide parent nodes that have no matching descendant Objectives
            }
        }

        // FINAL PRUNING STEP: Handle Projects
        if (clonedNode.type === 'Project') {
            if (filters.filterInitiativeId !== 'ALL') {
                // If we are isolating an Initiative, keep the Project only if it contains the target Initiative.
                if (!hasMatchingDescendant) {
                    return null;
                }
                // Also, prune any other Initiatives from the Project's list if they exist (should be handled by the isolation step above, but ensures clean output)
                clonedNode.initiatives = clonedNode.initiatives.filter((init: any) => init.id === filters.filterInitiativeId);
            }
        }
        
        // Keep the node if it matches the criteria OR has matching descendants.
        return (matchesSelf || hasMatchingDescendant) ? clonedNode : null;
    };

    return projects.map(recursiveFilter).filter(p => p !== null);
};



// ItemDialog is now imported from shared/TreeViewShared.tsx

// NodeItem is now imported from shared/TreeViewShared.tsx as TreeNodeItem

// --- MAIN VIEW COMPONENT ---
interface HierarchyManagerProps {
    projects: Project[];
    refreshData: () => void;
    isSearchActive: boolean;
    token: string; 
}

export const HierarchyView: React.FC<HierarchyManagerProps> = ({ projects, refreshData, isSearchActive, token }) => {
    // Get authentication and permissions
    const { permissions } = useAuth();
    const canManageStrategy = permissions.has('MANAGE_STRATEGY');
    const isAdmin = permissions.has('MANAGE_USERS') || permissions.has('MANAGE_ROLES');
    
    // NEW STATE: To hold all users fetched from the backend
    const [allUsers, setAllUsers] = useState<User[]>([]); 

    const [expandSignal, setExpandSignal] = useState(0); 
    const [zoomLevel, setZoomLevel] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
    const [quarterYearDropdownOpen, setQuarterYearDropdownOpen] = useState(false);

    const [filters, setFilters] = useState<FilterState>({
        filterType: 'ALL',
        filterQuarterYears: [], // Empty array = show all
        filterStatus: 'ALL',
        hideDescription: false,
        filterInitiativeId: 'ALL',
    });

    // Extract all Initiatives for the isolation filter dropdown
    const allInitiatives = useMemo(() => {
        const initiatives: { id: number, title: string, projectTitle: string }[] = [];
        projects.forEach(p => {
            if (p.initiatives) {
                p.initiatives.forEach(init => {
                    if (init.isActive) {
                        initiatives.push({ 
                            id: init.id, 
                            title: init.title, 
                            projectTitle: p.title 
                        });
                    }
                });
            }
        });
        return initiatives;
    }, [projects]);
    
    // NEW EFFECT: Fetch all users when the component mounts or token changes
    useEffect(() => {
        const fetchUsers = async () => {
            if (token) {
                try {
                    // This uses the fixed getUsers endpoint which should now point to /user/all
                    const users = await DataService.getUsers(token);
                    // Filter for active users only, sort alphabetically
                    const activeUsers = users
                        .filter(u => u.isActive)
                        .sort((a, b) => a.lastName.localeCompare(b.lastName));
                    setAllUsers(activeUsers);
                } catch (e) {
                    console.error("Failed to fetch users for assignment dropdown:", e);
                    // Continue even if user fetch fails
                }
            }
        };
        fetchUsers();
    }, [token]);


    const zoomClassMap: Record<'small' | 'medium' | 'large' | 'xlarge', string> = {
        'small': 'hierarchy-zoom-sm',
        'medium': '', 
        'large': 'hierarchy-zoom-lg',
        'xlarge': 'hierarchy-zoom-xl'
    };

    const zoomClass = zoomLevel === 'medium' ? '' : zoomClassMap[zoomLevel];

    const cycleZoom = (direction: 'in' | 'out') => {
        setZoomLevel(prev => {
            if (direction === 'in') {
                if (prev === 'small') return 'medium';
                if (prev === 'medium') return 'large';
                if (prev === 'large') return 'xlarge';
                return 'xlarge';
            } else {
                if (prev === 'xlarge') return 'large';
                if (prev === 'large') return 'medium';
                if (prev === 'medium') return 'small';
                return 'small';
            }
        });
    };
    
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        mode: 'ADD' | 'EDIT';
        nodeType: string;
        parentId: number | null;
        item?: any;
    }>({
        isOpen: false,
        mode: 'ADD',
        nodeType: 'Project',
        parentId: null
    });

    const handleFilterChange = (name: keyof FilterState, value: string | boolean | number) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredHierarchy = useMemo(() => {
        return filterHierarchyTree(projects, filters);
    }, [projects, filters]);


    const handleExpandAll = () => setExpandSignal(Date.now());
    const handleCollapseAll = () => setExpandSignal(-Date.now());

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
                // MODIFIED: Pass token to addEntity
                await DataService.addEntity(dialogState.parentId, dialogState.nodeType, formData, token);
            } else {
                const updates: any = { ...formData };
                delete updates.initiatives;
                delete updates.goals;
                delete updates.objectives;
                delete updates.keyResults;
                delete updates.actionItems;
                delete updates.createdBy;
                delete updates.createdDate;
                delete updates.updatedBy;
                delete updates.updatedDate;
                delete updates.closedBy;
                delete updates.closedDate;
                
                // MODIFIED: Pass token to updateEntity
                await DataService.updateEntity(dialogState.nodeType, dialogState.item.id, updates, token);
            }
            
            setDialogState(prev => ({ ...prev, isOpen: false }));
            refreshData();
        } catch (error: any) {
            console.error("Save Error:", error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleDelete = async (item: any) => {
        // Helper function to count active children
        const getChildrenInfo = (item: any) => {
            let childCount = 0;
            let childType = '';
            
            switch (item.type) {
                case 'Project':
                    childCount = item.initiatives?.filter((i: any) => i.isActive)?.length || 0;
                    childType = 'Strategic Initiative';
                    break;
                case 'StrategicInitiative':
                    childCount = item.goals?.filter((g: any) => g.isActive)?.length || 0;
                    childType = 'Goal';
                    break;
                case 'Goal':
                    childCount = item.objectives?.filter((o: any) => o.isActive)?.length || 0;
                    childType = 'Objective';
                    break;
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
        
        let confirmMessage = `Are you sure you want to archive "${item.title}"? This moves it to the Recycle Bin.`;
        
        if (childCount > 0) {
            const plural = childCount > 1 ? 's' : '';
            confirmMessage = `⚠️ WARNING: "${item.title}" has ${childCount} active ${childType}${plural}.\n\n` +
                           `Deleting this ${item.type} will also archive all its children.\n\n` +
                           `Are you sure you want to continue?`;
        }
        
        if (window.confirm(confirmMessage)) {
            try {
                // MODIFIED: Pass token to updateEntity
                await DataService.updateEntity(item.type, item.id, { isActive: false }, token);
                refreshData();
            } catch (error: any) {
                console.error("Delete Error:", error);
                alert(`Failed to delete item: ${error.message}`);
            }
        }
    };

    const handleComplete = async (item: any) => {
        try {
            // Toggle completion based on current isCompleted status
            const newCompleted = !item.isCompleted;
            console.log('Mark as Done clicked:', { itemId: item.id, itemType: item.type, currentIsCompleted: item.isCompleted, newCompleted });
            // MODIFIED: Pass token to updateEntity
            await DataService.updateEntity(item.type, item.id, { isCompleted: newCompleted }, token);
            console.log('Update completed, refreshing data...');
            refreshData();
        } catch (error: any) {
            console.error('handleComplete error:', error);
            alert(`Error completing item: ${error.message}`);
        }
    };

    return (
        <div className={styles.container}>
          <div className={styles.header.wrapper}>
             <div>
                 <h2 className={styles.header.title}>Strategy Map</h2>
                 <p className={styles.header.subtitle}>Define, track, and manage your organization's hierarchy.</p>
             </div>
             <div className={styles.header.addButton}>
                
                {/* Zoom Controls */}
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
                        disabled={zoomLevel === 'xlarge'}
                        className="p-1.5 text-slate-100 disabled:text-slate-500 disabled:hover:bg-transparent hover:text-white hover:bg-brand-500 rounded transition-colors" 
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px bg-slate-400/30 mx-0.5 h-4"></div>
                </div>

                {/* Existing: Expand/Collapse Controls */}
                <div className="flex gap-2 items-center mr-4 bg-white/10 rounded-lg p-0.5">
                    <button onClick={handleExpandAll} className="p-1.5 text-slate-100 hover:text-white hover:bg-brand-500 rounded transition-colors" title="Expand All">
                        <ChevronsDown className="w-4 h-4" />
                    </button>
                    <div className="w-px bg-slate-400/30 mx-0.5 h-4"></div>
                    <button onClick={handleCollapseAll} className="p-1.5 text-slate-100 hover:text-white hover:bg-brand-500 rounded transition-colors" title="Collapse All">
                        <ChevronsUp className="w-4 h-4" />
                    </button>
                 </div>
                 {isAdmin && (
                     <button onClick={() => openAddDialog(null, 'Project')} className="flex items-center font-semibold">
                         <Plus className="w-4 h-4 mr-2" />
                         New Project
                     </button>
                 )}
             </div>
          </div>
          
          {/* COMPACT FILTER BAR */}
          <div className={styles.filterBar.wrapper}>
              <div className={styles.filterBar.group}>
                   <label className={styles.filterBar.label}>Level:</label>
                   {/* Level Filter - ALL displays as one word */}
                   <select 
                       value={filters.filterType} 
                       onChange={e => handleFilterChange('filterType', e.target.value)} 
                       className={styles.filterBar.select}
                   >
                       {LEVEL_TYPES.map(type => (
                           <option key={type} value={type}>{formatNodeType(type)}</option>
                       ))}
                   </select>

                   <label className={styles.filterBar.label}>Status:</label>
                   {/* Status Filter */}
                   <select 
                       value={filters.filterStatus} 
                       onChange={e => handleFilterChange('filterStatus', e.target.value)} 
                       className={styles.filterBar.select}
                   >
                       {STATUS_TYPES.map(status => (
                           <option key={status} value={status}>
                               {status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                           </option>
                       ))}
                   </select>

                   <label className={styles.filterBar.label}>Quarter:</label>
                   {/* Quarter-Year Combined Filter - Multi-select dropdown */}
                   <div className="relative">
                       <button
                           onClick={() => setQuarterYearDropdownOpen(!quarterYearDropdownOpen)}
                           className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                       >
                           <span className="text-slate-700">
                               {filters.filterQuarterYears.length === 0 
                                   ? 'All Quarters' 
                                   : filters.filterQuarterYears.join(', ')}
                           </span>
                           <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                       </button>
                       {quarterYearDropdownOpen && (
                           <div className="absolute z-50 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                               <div className="p-2 space-y-1">
                                   {QUARTER_YEAR_OPTIONS.map(qy => (
                                       <label key={qy} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer">
                                           <input
                                               type="checkbox"
                                               checked={filters.filterQuarterYears.includes(qy)}
                                               onChange={(e) => {
                                                   const newQuarterYears = e.target.checked
                                                       ? [...filters.filterQuarterYears, qy]
                                                       : filters.filterQuarterYears.filter(fqy => fqy !== qy);
                                                   handleFilterChange('filterQuarterYears', newQuarterYears);
                                               }}
                                               className="h-4 w-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                                           />
                                           <span className="text-sm text-slate-700">{qy}</span>
                                       </label>
                                   ))}
                               </div>
                               <div className="border-t border-slate-200 p-2 flex gap-2">
                                   <button
                                       onClick={() => {
                                           handleFilterChange('filterQuarterYears', []);
                                       }}
                                       className="flex-1 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
                                   >
                                       Clear All
                                   </button>
                               </div>
                           </div>
                       )}
                   </div>
                   
                   <label className={styles.filterBar.label}>Isolate:</label>
                   {/* Initiative Isolation Filter: Now constrained by max-w-[200px] in styles.ts */}
                   <select 
                        value={filters.filterInitiativeId} 
                        onChange={e => handleFilterChange('filterInitiativeId', e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))} 
                        className={styles.filterBar.select}
                    >
                        <option value="ALL">All Initiatives</option>
                        {allInitiatives.map(init => (
                            <option key={init.id} value={init.id}>
                                {init.title} ({init.projectTitle})
                            </option>
                        ))}
                    </select>


              </div>
              
              {/* Hide Description Toggle */}
              <button 
                  onClick={() => handleFilterChange('hideDescription', !filters.hideDescription)}
                  className={styles.filterBar.toggleBtn(filters.hideDescription)}
                  title={filters.hideDescription ? 'Show Descriptions' : 'Hide Descriptions'}
              >
                  <EyeOff className="w-4 h-4 mr-1"/> 
                  {filters.hideDescription ? 'Descriptions Hidden' : 'Hide Descriptions'}
              </button>
          </div>

          <div className={styles.list.wrapper}>
            {filteredHierarchy.map(project => (
                <NodeItem 
                    key={`project-${project.id}`} 
                    item={project} 
                    level={0} 
                    parentId={null}
                    isSearchActive={isSearchActive}
                    expandSignal={expandSignal}
                    zoomClass={zoomClass}
                    hideDescription={filters.hideDescription}
                    onAdd={openAddDialog}
                    onEdit={openEditDialog}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                    showProjectCard={true}
                    canManageStrategy={canManageStrategy}
                    showFilteredProgress={filters.filterQuarterYears.length > 0}
                />
            ))}
            {filteredHierarchy.length === 0 && (
                <div className={styles.list.emptyState}>
                    <div className={styles.list.emptyIconWrapper}>
                        <Layers className={styles.list.emptyIcon} />
                    </div>
                    <h3 className={styles.list.emptyTitle}>No Items Found</h3>
                    <p className={styles.list.emptyDesc}>Adjust your filters to view the strategic map.</p>
                    <button 
                      onClick={() => setFilters({ filterType: 'ALL', filterQuarterYears: [], filterStatus: 'ALL', hideDescription: false, filterInitiativeId: 'ALL' })}
                      className={styles.list.emptyButton}
                    >
                        Clear All Filters
                    </button>
                </div>
            )}
          </div>

          <ItemDialog 
            isOpen={dialogState.isOpen}
            mode={dialogState.mode}
            nodeType={dialogState.nodeType}
            initialData={dialogState.item}
            allUsers={allUsers} // PROP: Pass user list to dialog
            onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
            onSave={handleSave}
          />
        </div>
    );
};