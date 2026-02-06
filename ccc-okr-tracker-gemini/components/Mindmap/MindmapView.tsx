// File: components/Mindmap/MindmapView.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    ReactFlow,
    Background,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useMindmap } from './useMindmap';
import { MindmapNode } from './MindmapNode';
import { MindmapControls } from './MindmapControls';

import { styles } from './styles';
import { Network, AlertTriangle, FolderOpen, Keyboard } from 'lucide-react';
import type { Project } from '../../types';

interface MindmapViewProps {
    projects: Project[];
}



const MindmapCanvas: React.FC<{
    nodes: any[];
    edges: any[];
    onNodesChange: any;
    onEdgesChange: any;
    onNodeClick: (nodeId: string) => void;
    expandAll: () => void;
    collapseAll: () => void;
}> = ({ nodes, edges, onNodesChange, onEdgesChange, onNodeClick, expandAll, collapseAll }) => {
    const { fitView } = useReactFlow();
    const prevNodeCount = useRef(nodes.length);
    const [showShortcuts, setShowShortcuts] = useState(false);

    useEffect(() => {
        if (nodes.length !== prevNodeCount.current) {
            const timer = setTimeout(() => {
                fitView({ padding: 0.3, duration: 300 });
            }, 50);
            prevNodeCount.current = nodes.length;
            return () => clearTimeout(timer);
        }
    }, [nodes.length, fitView]);

    // Fixed Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
            
            switch (e.key.toLowerCase()) {
                case 'e': expandAll(); break;
                case 'c': collapseAll(); break;
                case 'f': fitView({ padding: 0.3, duration: 300 }); break;
                case '?': setShowShortcuts(prev => !prev); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [expandAll, collapseAll, fitView]);

    // Create nodeTypes with the click handler
    const nodeTypes = useMemo(() => ({
        mindmap: (props: any) => (
            <MindmapNode {...props} onNodeClick={onNodeClick} />
        ),
    }), [onNodeClick]);

    return (
        <>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3, duration: 300 }}
                minZoom={0.1}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{
                    type: 'simplebezier',
                    animated: false,
                    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
                }}
            >
                <Background color="#e2e8f0" gap={20} />
                <MindmapControls
                    onExpandAll={expandAll}
                    onCollapseAll={collapseAll}
                />
            </ReactFlow>

            {showShortcuts && (
                <div className={styles.shortcuts.wrapper}>
                    <div className={styles.shortcuts.title}>Keyboard Shortcuts</div>
                    <div className={styles.shortcuts.row}><span className={styles.shortcuts.key}>E</span><span>Expand all</span></div>
                    <div className={styles.shortcuts.row}><span className={styles.shortcuts.key}>C</span><span>Collapse all</span></div>
                    <div className={styles.shortcuts.row}><span className={styles.shortcuts.key}>F</span><span>Fit view</span></div>
                    <div className={styles.shortcuts.row}><span className={styles.shortcuts.key}>?</span><span>Toggle shortcuts</span></div>
                </div>
            )}
        </>
    );
};

export const MindmapView: React.FC<MindmapViewProps> = ({ projects }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
        projects.length > 0 ? projects[0].id : null
    );

    const selectedProject = useMemo(() => 
        projects.find(p => p.id === selectedProjectId), 
    [projects, selectedProjectId]);

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        maxDepth,
        setMaxDepth,
        isLoading,
        error,
        toggleNode,
        expandAll,
        collapseAll,
    } = useMindmap({ projectId: selectedProjectId, projectData: selectedProject });

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedProjectId(value ? parseInt(value, 10) : null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header.wrapper}>
                <div>
                    <h1 className={styles.header.title}>Mindmap</h1>
                    <p className={styles.header.subtitle}>Visualize your project hierarchy</p>
                </div>
                
                <div className={styles.header.controls}>
                    <select 
                        className={styles.header.select}
                        value={selectedProjectId ?? ''}
                        onChange={handleProjectChange}
                    >
                        <option value="">Select a project...</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>{project.title}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg px-3 py-2">
                        <label className={styles.header.depthLabel}>Levels</label>
                        <input
                            type="range"
                            min={1}
                            max={6}
                            value={maxDepth}
                            onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
                            className={styles.header.depthSlider}
                        />
                        <span className="text-sm font-semibold text-brand-600 min-w-[1.5rem] text-center">{maxDepth}</span>
                    </div>

                    <button className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <Keyboard className="w-4 h-4" />
                        <span className="hidden xl:inline">Press ? for shortcuts</span>
                    </button>
                </div>
            </div>

            {/* Legend */}
            {selectedProjectId && (
                <div className={styles.legend.wrapper}>
                    <span className="text-xs font-medium text-slate-500 mr-2">Legend:</span>
                    <div className={styles.legend.item}>
                        <span className={`${styles.legend.dot} bg-blue-500`} />
                        <span>Project</span>
                    </div>
                    <div className={styles.legend.item}>
                        <span className={`${styles.legend.dot} bg-purple-500`} />
                        <span>Initiative</span>
                    </div>
                    <div className={styles.legend.item}>
                        <span className={`${styles.legend.dot} bg-green-500`} />
                        <span>Goal</span>
                    </div>
                    <div className={styles.legend.item}>
                        <span className={`${styles.legend.dot} bg-orange-500`} />
                        <span>Objective</span>
                    </div>
                    <div className={styles.legend.item}>
                        <span className={`${styles.legend.dot} bg-yellow-500`} />
                        <span>Key Result</span>
                    </div>
                    <div className={styles.legend.item}>
                        <span className={`${styles.legend.dot} bg-slate-500`} />
                        <span>Action</span>
                    </div>
                </div>
            )}

            <div className={styles.canvas.wrapper}>
                {projects.length === 0 ? (
                    <div className={styles.noProjects.wrapper}>
                        <FolderOpen className={styles.noProjects.icon} />
                        <h2 className={styles.noProjects.title}>No projects available</h2>
                    </div>
                ) : !selectedProjectId ? (
                    <div className={styles.empty.wrapper}>
                        <Network className={styles.empty.icon} />
                        <h2 className={styles.empty.title}>No project selected</h2>
                    </div>
                ) : error ? (
                    <div className={styles.error.wrapper}>
                        <AlertTriangle className={styles.error.icon} />
                        <h2 className={styles.error.title}>Failed to load</h2>
                        <p className={styles.error.subtitle}>{error}</p>
                    </div>
                ) : isLoading ? (
                    <div className={styles.loading.wrapper}>
                        <div className={styles.loading.spinner} />
                        <p className={styles.loading.text}>Loading mindmap...</p>
                    </div>
                ) : (
                    <ReactFlowProvider>
                        <MindmapCanvas
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onNodeClick={toggleNode}
                            expandAll={expandAll}
                            collapseAll={collapseAll}
                        />
                    </ReactFlowProvider>
                )}
            </div>
        </div>
    );
};