import { useState, useEffect } from 'react';
import { Quarter } from '../../types';
// UPDATED: Replaced Briefcase with Layers in imports
import { BarChart2, Folder, Target, Award, List, CheckSquare, Layers } from 'lucide-react'; 

// Utility for persistent storage
const STORAGE_KEY_PREFIX = 'okr-expansion-';

const getInitialExpansionState = (id: number, defaultState: boolean): boolean => {
    try {
        // Retrieve state from localStorage
        const stored = localStorage.getItem(STORAGE_KEY_PREFIX + id);
        if (stored === null) {
            return defaultState;
        }
        return JSON.parse(stored);
    } catch (error) {
        console.error("Error reading localStorage", error);
        return defaultState;
    }
};

const setExpansionState = (id: number, state: boolean) => {
    try {
        // Save state to localStorage
        localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify(state));
    } catch (error) {
        console.error("Error writing to localStorage", error);
    }
};

export const useHierarchyNode = (
    item: any, 
    level: number, 
    isSearchActive: boolean,
    expandSignal: number // 0 = neutral, >0 = expand all, <0 = collapse all
) => {
    // Only open projects (level 0) by default, and use item.id for persistent state
    const defaultOpen = level < 1; 
    const [isOpen, internalSetIsOpen] = useState(
        getInitialExpansionState(item.id, defaultOpen)
    ); 

    // Function that updates state AND saves to localStorage
    const setIsOpen = (newOpenState: boolean) => {
        internalSetIsOpen(newOpenState);
        setExpansionState(item.id, newOpenState);
    };


    // React to global expansion signals (These override individual state temporarily)
    useEffect(() => {
        if (expandSignal > 0) {
            internalSetIsOpen(true);
        }
        if (expandSignal < 0) {
            internalSetIsOpen(false);
        }
    }, [expandSignal]);

    // React to search (Search always overrides saved state to expand all relevant nodes)
    useEffect(() => {
        if (isSearchActive) internalSetIsOpen(true);
    }, [isSearchActive]);

    // Logic: Determine visuals based on type
    const getTypeConfig = (type: string) => {
        switch (type) {
          // Project: CHANGED icon to Layers
          case 'Project': return { icon: Layers, color: 'text-slate-800', badge: 'bg-brand-50 border-brand-200 text-brand-700' };
          
          // StrategicInitiative: Cyan (Strategic Layer)
          case 'StrategicInitiative': return { icon: BarChart2, color: 'text-cyan-600', badge: 'bg-cyan-50 border-cyan-200 text-cyan-700' };
          
          // Goal: Indigo (Deep Blue - Outcomes)
          case 'Goal': return { icon: Target, color: 'text-slate-700', badge: 'bg-indigo-50 border-indigo-200 text-indigo-700' };
          
          // Objective: Violet (Purple - Core Focus/OKRs)
          case 'Objective': return { icon: Award, color: 'text-slate-700', badge: 'bg-violet-50 border-violet-200 text-violet-700' };
          
          // KeyResult: Amber (Orange/Gold - Metrics/Warning Focus)
          case 'KeyResult': return { icon: List, color: 'text-slate-700', badge: 'bg-amber-50 border-amber-200 text-amber-700' };
          
          // ActionItem: Emerald (Green - Task/Completion)
          case 'ActionItem': return { icon: CheckSquare, color: 'text-slate-700', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700' };
          
          default: return { icon: Folder, color: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' };
        }
    };

    const config = getTypeConfig(item.type);
    
    // Logic: Get Children - Ensure array is always returned
    const children = 
      item.initiatives || item.goals || item.objectives || 
      item.keyResults || item.actionItems || [];
  
    // Logic: Determine next type in hierarchy for the "Add" function
    const getNextType = (currentType: string) => {
        if (currentType === 'Project') return 'StrategicInitiative';
        if (currentType === 'StrategicInitiative') return 'Goal';
        if (currentType === 'Goal') return 'Objective';
        if (currentType === 'Objective') return 'KeyResult';
        if (currentType === 'KeyResult') return 'ActionItem';
        return null;
    }
    const nextType = getNextType(item.type);

    return {
        isOpen,
        setIsOpen,
        config,
        children,
        nextType,
        Quarter
    };
};