// File: components/Mindmap/layoutUtils.ts
// Utility functions for generating mindmap layout from hierarchy data

import type { Node, Edge } from '@xyflow/react';
import type { Project, StrategicInitiative, Goal, Objective, KeyResult, ActionItem } from '../../types';
import type { MindmapNodeData, HierarchyLevel } from './useMindmap';

// Layout constants - compact nodes with more vertical spacing to prevent overlap
const NODE_WIDTH = 100;
const NODE_HEIGHT = 28;
const HORIZONTAL_SPACING = 140;
const VERTICAL_SPACING = 45;

// Helper to generate unique node ID
const nodeId = (type: string, id: number) => `${type}-${id}`;

// Count all descendants at each level for a node
interface LayoutNode {
    id: string;
    data: MindmapNodeData;
    children: LayoutNode[];
    subtreeHeight: number;
}

// Build a tree structure from project data
export function buildLayoutTree(
    project: Project,
    maxDepth: number,
    expandedNodes: Set<string>
): LayoutNode {
    const projectNodeId = nodeId('project', project.id);
    const isExpanded = expandedNodes.has(projectNodeId);
    
    const projectNode: LayoutNode = {
        id: projectNodeId,
        data: {
            id: projectNodeId,
            label: project.title,
            level: 'project',
            progress: project.progress,
            hasChildren: project.initiatives.length > 0,
            isExpanded,
        },
        children: [],
        subtreeHeight: 1,
    };

    if (maxDepth > 1 && isExpanded) {
        projectNode.children = project.initiatives.map(initiative => 
            buildInitiativeNode(initiative, maxDepth, expandedNodes, 2)
        );
    }

    // Calculate subtree height
    projectNode.subtreeHeight = calculateSubtreeHeight(projectNode);
    
    return projectNode;
}

function buildInitiativeNode(
    initiative: StrategicInitiative,
    maxDepth: number,
    expandedNodes: Set<string>,
    currentDepth: number
): LayoutNode {
    const id = nodeId('initiative', initiative.id);
    const isExpanded = expandedNodes.has(id);
    
    const node: LayoutNode = {
        id,
        data: {
            id,
            label: initiative.title,
            level: 'strategicInitiative',
            progress: initiative.progress,
            hasChildren: initiative.goals.length > 0,
            isExpanded,
        },
        children: [],
        subtreeHeight: 1,
    };

    if (currentDepth < maxDepth && isExpanded) {
        node.children = initiative.goals.map(goal => 
            buildGoalNode(goal, maxDepth, expandedNodes, currentDepth + 1)
        );
    }

    node.subtreeHeight = calculateSubtreeHeight(node);
    return node;
}

function buildGoalNode(
    goal: Goal,
    maxDepth: number,
    expandedNodes: Set<string>,
    currentDepth: number
): LayoutNode {
    const id = nodeId('goal', goal.id);
    const isExpanded = expandedNodes.has(id);
    
    const node: LayoutNode = {
        id,
        data: {
            id,
            label: goal.title,
            level: 'goal',
            progress: goal.progress,
            hasChildren: goal.objectives.length > 0,
            isExpanded,
        },
        children: [],
        subtreeHeight: 1,
    };

    if (currentDepth < maxDepth && isExpanded) {
        node.children = goal.objectives.map(objective => 
            buildObjectiveNode(objective, maxDepth, expandedNodes, currentDepth + 1)
        );
    }

    node.subtreeHeight = calculateSubtreeHeight(node);
    return node;
}

function buildObjectiveNode(
    objective: Objective,
    maxDepth: number,
    expandedNodes: Set<string>,
    currentDepth: number
): LayoutNode {
    const id = nodeId('objective', objective.id);
    const isExpanded = expandedNodes.has(id);
    
    const node: LayoutNode = {
        id,
        data: {
            id,
            label: objective.title,
            level: 'objective',
            progress: objective.progress,
            hasChildren: objective.keyResults.length > 0,
            isExpanded,
        },
        children: [],
        subtreeHeight: 1,
    };

    if (currentDepth < maxDepth && isExpanded) {
        node.children = objective.keyResults.map(kr => 
            buildKeyResultNode(kr, maxDepth, expandedNodes, currentDepth + 1)
        );
    }

    node.subtreeHeight = calculateSubtreeHeight(node);
    return node;
}

function buildKeyResultNode(
    keyResult: KeyResult,
    maxDepth: number,
    expandedNodes: Set<string>,
    currentDepth: number
): LayoutNode {
    const id = nodeId('keyresult', keyResult.id);
    const isExpanded = expandedNodes.has(id);
    
    const node: LayoutNode = {
        id,
        data: {
            id,
            label: keyResult.title,
            level: 'keyResult',
            progress: keyResult.progress,
            hasChildren: keyResult.actionItems.length > 0,
            isExpanded,
        },
        children: [],
        subtreeHeight: 1,
    };

    if (currentDepth < maxDepth && isExpanded) {
        node.children = keyResult.actionItems.map(action => 
            buildActionItemNode(action)
        );
    }

    node.subtreeHeight = calculateSubtreeHeight(node);
    return node;
}

function buildActionItemNode(actionItem: ActionItem): LayoutNode {
    const id = nodeId('action', actionItem.id);
    
    return {
        id,
        data: {
            id,
            label: actionItem.title,
            level: 'actionItem',
            hasChildren: false,
            isExpanded: false,
        },
        children: [],
        subtreeHeight: 1,
    };
}

function calculateSubtreeHeight(node: LayoutNode): number {
    if (node.children.length === 0) {
        return 1;
    }
    return node.children.reduce((sum, child) => sum + child.subtreeHeight, 0);
}

// Convert layout tree to React Flow nodes and edges
export function generateNodesAndEdges(
    tree: LayoutNode
): { nodes: Node<MindmapNodeData>[]; edges: Edge[] } {
    const nodes: Node<MindmapNodeData>[] = [];
    const edges: Edge[] = [];

    // Position the root node at center
    positionNode(tree, 0, 0, nodes, edges, null);

    return { nodes, edges };
}

function positionNode(
    layoutNode: LayoutNode,
    x: number,
    yStart: number,
    nodes: Node<MindmapNodeData>[],
    edges: Edge[],
    parentId: string | null
): void {
    // Calculate vertical center for this node based on its subtree
    const subtreeHeight = layoutNode.subtreeHeight * VERTICAL_SPACING;
    const y = yStart + subtreeHeight / 2 - VERTICAL_SPACING / 2;

    // Add the node
    nodes.push({
        id: layoutNode.id,
        type: 'mindmap',
        position: { x, y },
        data: layoutNode.data,
    });

    // Add edge from parent
    if (parentId) {
        edges.push({
            id: `edge-${parentId}-${layoutNode.id}`,
            source: parentId,
            target: layoutNode.id,
            type: 'simplebezier',
            style: { stroke: '#94a3b8', strokeWidth: 1.5 },
            animated: false,
        });
    }

    // Position children
    let currentY = yStart;
    for (const child of layoutNode.children) {
        positionNode(
            child,
            x + HORIZONTAL_SPACING,
            currentY,
            nodes,
            edges,
            layoutNode.id
        );
        currentY += child.subtreeHeight * VERTICAL_SPACING;
    }
}

// Get all node IDs in the tree (for expand all)
export function getAllNodeIds(tree: LayoutNode): string[] {
    const ids: string[] = [tree.id];
    for (const child of tree.children) {
        ids.push(...getAllNodeIds(child));
    }
    return ids;
}

// Get all node IDs directly from project data (for expand all - regardless of current expansion)
export function getAllNodeIdsFromProject(project: Project): string[] {
    const ids: string[] = [nodeId('project', project.id)];
    
    for (const initiative of project.initiatives) {
        ids.push(nodeId('initiative', initiative.id));
        
        for (const goal of initiative.goals) {
            ids.push(nodeId('goal', goal.id));
            
            for (const objective of goal.objectives) {
                ids.push(nodeId('objective', objective.id));
                
                for (const keyResult of objective.keyResults) {
                    ids.push(nodeId('keyresult', keyResult.id));
                    
                    for (const action of keyResult.actionItems) {
                        ids.push(nodeId('action', action.id));
                    }
                }
            }
        }
    }
    
    return ids;
}

