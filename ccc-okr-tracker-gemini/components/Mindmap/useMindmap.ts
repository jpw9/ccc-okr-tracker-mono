// File: components/Mindmap/useMindmap.ts

import { useState, useCallback, useEffect } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { Edge } from '@xyflow/react';
import { buildLayoutTree, generateNodesAndEdges, getAllNodeIds, getAllNodeIdsFromProject } from './layoutUtils';
import type { Project } from '../../types';

// Hierarchy level types for type safety
export type HierarchyLevel = 
    | 'project' 
    | 'strategicInitiative' 
    | 'goal' 
    | 'objective' 
    | 'keyResult' 
    | 'actionItem';

export const HIERARCHY_LEVELS: HierarchyLevel[] = [
    'project',
    'strategicInitiative', 
    'goal',
    'objective',
    'keyResult',
    'actionItem',
];

export interface MindmapNodeData {
    [key: string]: unknown; // Index signature for React Flow compatibility
    id: string;
    label: string;
    level: HierarchyLevel;
    progress?: number;
    hasChildren: boolean;
    isExpanded: boolean;
    parentId?: string;
}

interface UseMindmapProps {
    projectId: number | null;
    projectData: Project | null;
}

export const useMindmap = ({ projectId, projectData }: UseMindmapProps) => {
    // State for nodes and edges (React Flow)
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    
    // UI State
    const [maxDepth, setMaxDepth] = useState(4); // Default to showing 4 levels
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize when projectData changes
    useEffect(() => {
        if (!projectId || !projectData) {
            setNodes([]);
            setEdges([]);
            setExpandedNodes(new Set());
            return;
        }

        // Initialize with root node expanded
        setExpandedNodes(new Set([`project-${projectData.id}`]));
    }, [projectId, projectData, setNodes, setEdges]);


    // Regenerate nodes/edges when data, depth, or expansion changes
    useEffect(() => {
        if (!projectData) return;

        const tree = buildLayoutTree(projectData, maxDepth, expandedNodes);
        const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(tree);
        
        setNodes(newNodes);
        setEdges(newEdges);
    }, [projectData, maxDepth, expandedNodes, setNodes, setEdges]);

    // Toggle node expansion
    const toggleNode = useCallback((nodeId: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    }, []);

    // Check if a node is expanded
    const isNodeExpanded = useCallback((nodeId: string) => {
        return expandedNodes.has(nodeId);
    }, [expandedNodes]);

    // Expand all nodes
    const expandAll = useCallback(() => {
        if (!projectData) return;
        const allIds = getAllNodeIdsFromProject(projectData);
        setExpandedNodes(new Set(allIds));
        setMaxDepth(6); // Show all levels
    }, [projectData]);

    // Collapse all nodes (keep only root expanded)
    const collapseAll = useCallback(() => {
        if (!projectData) return;
        setExpandedNodes(new Set([`project-${projectData.id}`]));
    }, [projectData]);

    // Fit view helper - will be connected to React Flow instance
    const [fitViewTrigger, setFitViewTrigger] = useState(0);
    const triggerFitView = useCallback(() => {
        setFitViewTrigger(prev => prev + 1);
    }, []);

    return {
        // React Flow state
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        setNodes,
        setEdges,

        // UI State
        maxDepth,
        setMaxDepth,
        isLoading,
        error,

        // Expansion controls
        expandedNodes,
        toggleNode,
        isNodeExpanded,
        expandAll,
        collapseAll,

        // View controls
        fitViewTrigger,
        triggerFitView,
    };
};
