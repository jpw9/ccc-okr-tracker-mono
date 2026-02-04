// File: jpw9/ccc-okr-tracker-gemini/jpw9-ccc-okr-tracker-gemini-95067add9b99ae82491d4a539c9da125b63646af/components/MyObjectives/useMyObjectives.ts

import { useState, useMemo } from 'react';
import { Objective, Project, KeyResult, ActionItem } from '../../types'; // Added KeyResult, ActionItem

// Type change: We need the full Objective structure now.
export interface ObjectiveWithContext extends Objective {
    projectTitle: string;
    projectId: number;
    // Attach Initiative/Goal info for context, mirroring what we might need in the UI
    initiativeTitle?: string;
    goalTitle?: string;
}

export const useMyObjectives = (projects: Project[], currentUserLogin: string) => {
    const [filterQuarterYears, setFilterQuarterYears] = useState<string[]>([]); // Empty array = show all, e.g., ["Q1 2025", "Q4 2025"]
    // New State: Filtering for item Type (Objective, KeyResult, ActionItem)
    const [filterType, setFilterType] = useState<string>('Objective'); 
    
    // Derived state: Flatten tree to find user's objectives
    const objectives = useMemo(() => {
        const userObjectives: ObjectiveWithContext[] = [];
        const currentUser = currentUserLogin;

        const traverse = (items: any[], currentProject: Project | null, currentInitiative?: string, currentGoal?: string) => {
            if (!items) return;
            
            items.forEach(item => {
                const projContext = item.type === 'Project' ? item : currentProject;
                const initiativeContext = item.type === 'StrategicInitiative' ? item.title : currentInitiative;
                const goalContext = item.type === 'Goal' ? item.title : currentGoal;

                // Check for Objective assignment (case-insensitive)
                if (item.type === 'Objective' 
                    && item.assignee 
                    && currentUser 
                    && item.assignee.toLowerCase() === currentUser.toLowerCase()
                    && item.isActive) {
                    
                    userObjectives.push({
                        ...item,
                        projectTitle: projContext?.title || 'Unknown Project',
                        projectId: projContext?.id || 0,
                        initiativeTitle: initiativeContext,
                        goalTitle: goalContext,
                        // Ensure keyResults are present to build the hierarchy below
                        keyResults: item.keyResults || []
                    });
                }
                
                // Recurse, passing updated context info
                if (item.initiatives) traverse(item.initiatives, projContext, initiativeContext, goalContext);
                if (item.goals) traverse(item.goals, projContext, initiativeContext, goalContext);
                if (item.objectives) traverse(item.objectives, projContext, initiativeContext, goalContext);
            });
        };

        traverse(projects, null);
        return userObjectives;
    }, [projects, currentUserLogin]);

    // Apply Local Filters (Quarter-Year and Type)
    const filteredObjectives = objectives.filter(obj => {
        const itemQuarterYear = `${obj.quarter} ${obj.year}`;
        const matchesQuarterYear = filterQuarterYears.length === 0 || filterQuarterYears.includes(itemQuarterYear);
        return matchesQuarterYear;
    });

    const filterTypes = ['Objective', 'KeyResult', 'ActionItem'];
    
    // Generate combined quarter-year options (e.g., "Q1 2024", "Q2 2024", etc.)
    const currentYear = new Date().getFullYear();
    const quarterYearOptions = [];
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
        for (const quarter of ['Q1', 'Q2', 'Q3', 'Q4']) {
            quarterYearOptions.push(`${quarter} ${year}`);
        }
    }

    return {
        objectives: filteredObjectives, // These are the root nodes for the new tree view
        filterQuarterYears, setFilterQuarterYears,
        filterType, setFilterType,
        quarterYearOptions,
        filterTypes,
    };
};