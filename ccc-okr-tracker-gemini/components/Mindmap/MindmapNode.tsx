// File: components/Mindmap/MindmapNode.tsx

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronRight, Minus, Plus } from 'lucide-react';
import { styles } from './styles';
import type { MindmapNodeData, HierarchyLevel } from './useMindmap';

// Node props type
interface MindmapNodeProps {
    data: MindmapNodeData;
    onNodeClick?: (nodeId: string) => void;
}

// Color mapping for each hierarchy level
const levelColors: Record<HierarchyLevel, keyof typeof styles.nodeColors> = {
    project: 'project',
    strategicInitiative: 'strategicInitiative',
    goal: 'goal',
    objective: 'objective',
    keyResult: 'keyResult',
    actionItem: 'actionItem',
};

// Progress bar color based on value
const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'bg-emerald-500';
    if (progress >= 70) return 'bg-green-400';
    if (progress >= 40) return 'bg-yellow-400';
    return 'bg-orange-400';
};

// Get node style classes based on level - use filled colors for all levels
const getNodeClasses = (level: HierarchyLevel): string => {
    const colorKey = levelColors[level];
    const colors = styles.nodeColors[colorKey];
    return `${colors.bg} ${colors.border} ${colors.text}`;
};

export const MindmapNode: React.FC<MindmapNodeProps> = memo(({ data, onNodeClick }) => {
    const nodeClasses = getNodeClasses(data.level);
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (data.hasChildren && onNodeClick) {
            onNodeClick(data.id as string);
        }
    };
    return (
        <div 
            className={`${styles.node.wrapper} ${nodeClasses} ${data.hasChildren ? 'cursor-pointer' : 'cursor-default'} relative`}
            onClick={handleClick}
            title={data.label}
        >
            {/* Connection handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-slate-400 !w-2 !h-2 !border-0 !opacity-0"
            />
            {/* Node content */}
            <div className={styles.node.title}>{data.label}</div>
            {/* Expand/collapse indicator */}
            {data.hasChildren && (
                <div className={styles.node.expandIndicator}>
                    {data.isExpanded ? (
                        <Minus className="w-1.5 h-1.5" />
                    ) : (
                        <Plus className="w-1.5 h-1.5" />
                    )}
                </div>
            )}
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-slate-400 !w-2 !h-2 !border-0 !opacity-0"
            />
        </div>
    );
});

MindmapNode.displayName = 'MindmapNode';
