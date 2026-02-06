// File: components/Mindmap/MindmapControls.tsx

import React from 'react';
import { Panel, useReactFlow, useStore } from '@xyflow/react';
import { 
    ZoomIn, 
    ZoomOut, 
    Maximize2, 
    ChevronsDownUp, 
    ChevronsUpDown,
    RotateCcw
} from 'lucide-react';
import { styles } from './styles';

interface MindmapControlsProps {
    onExpandAll: () => void;
    onCollapseAll: () => void;
}

export const MindmapControls: React.FC<MindmapControlsProps> = ({
    onExpandAll,
    onCollapseAll,
}) => {
    const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();
    
    // Get current zoom level from store
    const zoom = useStore((state) => state.transform[2]);
    const zoomPercentage = Math.round(zoom * 100);

    // Animated zoom with duration
    const handleZoomIn = () => zoomIn({ duration: 200 });
    const handleZoomOut = () => zoomOut({ duration: 200 });
    const handleFitView = () => fitView({ padding: 0.3, duration: 300 });
    const handleResetView = () => {
        setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
    };

    return (
        <Panel position="top-right" className="!m-4">
            <div className={styles.controls.wrapper}>
                {/* Zoom level indicator */}
                <div className="px-2 py-1 text-xs font-medium text-slate-500 text-center min-w-[3rem]">
                    {zoomPercentage}%
                </div>
                
                <div className={styles.controls.divider} />
                
                {/* Zoom controls */}
                <button
                    onClick={handleZoomIn}
                    className={styles.controls.button}
                    title="Zoom in (Scroll up)"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    onClick={handleZoomOut}
                    className={styles.controls.button}
                    title="Zoom out (Scroll down)"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button
                    onClick={handleFitView}
                    className={styles.controls.button}
                    title="Fit all nodes in view"
                >
                    <Maximize2 className="w-5 h-5" />
                </button>
                <button
                    onClick={handleResetView}
                    className={styles.controls.button}
                    title="Reset view to 100%"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>

                <div className={styles.controls.divider} />

                {/* Expand/Collapse controls */}
                <button
                    onClick={onExpandAll}
                    className={styles.controls.button}
                    title="Expand all nodes"
                >
                    <ChevronsUpDown className="w-5 h-5" />
                </button>
                <button
                    onClick={onCollapseAll}
                    className={styles.controls.button}
                    title="Collapse to root only"
                >
                    <ChevronsDownUp className="w-5 h-5" />
                </button>
            </div>
        </Panel>
    );
};
