import React, { useState, useCallback, useRef } from 'react';
import { Task, TaskListHeaderProps, TaskListTableProps } from 'gantt-task-react';
import { ChevronRight, ChevronDown } from 'lucide-react';

// --- Hierarchy depth from task ID ---
function getDepth(task: Task): number {
  if (task.id.startsWith('project-')) return 0;
  if (task.id.startsWith('initiative-')) return 1;
  if (task.id.startsWith('goal-')) return 2;
  return 3; // objective
}

function getTypeLabel(task: Task): string {
  if (task.id.startsWith('project-')) return 'P';
  if (task.id.startsWith('initiative-')) return 'SI';
  if (task.id.startsWith('goal-')) return 'G';
  return 'O';
}

const TYPE_COLORS: Record<string, string> = {
  P: 'bg-slate-700 text-white',
  SI: 'bg-slate-500 text-white',
  G: 'bg-brand-500 text-white',
  O: 'bg-emerald-500 text-white',
};

function formatShortDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ============================================================
// Resizable Column Hook
// ============================================================
function useResizable(initial: number, min: number = 60) {
  const [width, setWidth] = useState(initial);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientX - startX.current;
      setWidth(Math.max(min, startW.current + delta));
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width, min]);

  return { width, onMouseDown };
}

// ============================================================
// Resize Handle
// ============================================================
const ResizeHandle: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => (
  <div
    onMouseDown={onMouseDown}
    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-400 active:bg-brand-500 z-10"
    style={{ userSelect: 'none' }}
  />
);

// ============================================================
// Custom Header
// ============================================================
export const CustomTaskListHeader: React.FC<TaskListHeaderProps & { colWidths?: { name: number; from: number; to: number }; onResizeName?: (e: React.MouseEvent) => void; onResizeFrom?: (e: React.MouseEvent) => void }> = ({
  headerHeight,
  colWidths,
  onResizeName,
  onResizeFrom,
}) => {
  const nameW = colWidths?.name ?? 180;
  const fromW = colWidths?.from ?? 80;
  const toW = colWidths?.to ?? 80;

  return (
    <div
      className="flex items-end border-b border-slate-300 bg-slate-100 select-none"
      style={{ height: headerHeight, fontFamily: 'inherit' }}
    >
      <div className="relative flex items-center px-2 border-r border-slate-200" style={{ width: nameW, height: '100%' }}>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Name</span>
        {onResizeName && <ResizeHandle onMouseDown={onResizeName} />}
      </div>
      <div className="relative flex items-center px-2 border-r border-slate-200 justify-center" style={{ width: fromW, height: '100%' }}>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">From</span>
        {onResizeFrom && <ResizeHandle onMouseDown={onResizeFrom} />}
      </div>
      <div className="flex items-center px-2 justify-center" style={{ width: toW, height: '100%' }}>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">To</span>
      </div>
    </div>
  );
};

// ============================================================
// Custom Table
// ============================================================
export const CustomTaskListTable: React.FC<TaskListTableProps & { colWidths?: { name: number; from: number; to: number }; }> = ({
  tasks,
  rowHeight,
  selectedTaskId,
  setSelectedTask,
  onExpanderClick,
  colWidths,
}) => {
  const nameW = colWidths?.name ?? 180;
  const fromW = colWidths?.from ?? 80;
  const toW = colWidths?.to ?? 80;

  return (
    <div className="select-none" style={{ fontFamily: 'inherit' }}>
      {tasks.map((task) => {
        const depth = getDepth(task);
        const typeLabel = getTypeLabel(task);
        const typeColor = TYPE_COLORS[typeLabel];
        const isProject = task.type === 'project';
        const isSelected = task.id === selectedTaskId;
        const hasExpander = isProject;

        return (
          <div
            key={task.id}
            className={`flex items-center border-b border-slate-100 cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-50' : depth % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
            } hover:bg-blue-50/60`}
            style={{ height: rowHeight }}
            onClick={() => setSelectedTask(task.id)}
          >
            {/* Name Column */}
            <div
              className="flex items-center gap-1 overflow-hidden border-r border-slate-100"
              style={{ width: nameW, paddingLeft: 4 + depth * 16, height: '100%' }}
            >
              {/* Expander */}
              {hasExpander ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onExpanderClick(task); }}
                  className="flex-shrink-0 p-0.5 rounded hover:bg-slate-200 transition-colors"
                >
                  {task.hideChildren
                    ? <ChevronRight className="w-3 h-3 text-slate-500" />
                    : <ChevronDown className="w-3 h-3 text-slate-500" />
                  }
                </button>
              ) : (
                <span className="w-4 flex-shrink-0" />
              )}

              {/* Type Badge */}
              <span className={`flex-shrink-0 text-[8px] font-bold rounded px-1 py-0 leading-tight ${typeColor}`}>
                {typeLabel}
              </span>

              {/* Title */}
              <span
                className={`truncate text-[11px] ${
                  depth === 0 ? 'font-bold text-slate-900' :
                  depth === 1 ? 'font-semibold text-slate-800' :
                  depth === 2 ? 'font-medium text-slate-700' :
                  'text-slate-600'
                }`}
                title={task.name}
              >
                {task.name}
              </span>
            </div>

            {/* From Column */}
            <div
              className="flex items-center justify-center border-r border-slate-100 px-1"
              style={{ width: fromW, height: '100%' }}
            >
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                {formatShortDate(task.start)}
              </span>
            </div>

            {/* To Column */}
            <div
              className="flex items-center justify-center px-1"
              style={{ width: toW, height: '100%' }}
            >
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                {formatShortDate(task.end)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// Wrapper that manages column widths and passes them to both
// ============================================================
export function useTaskListColumns() {
  const nameCol = useResizable(200, 100);
  const fromCol = useResizable(85, 60);

  const colWidths = {
    name: nameCol.width,
    from: fromCol.width,
    to: 85,
  };

  const totalWidth = colWidths.name + colWidths.from + colWidths.to;

  return {
    colWidths,
    totalWidth,
    onResizeName: nameCol.onMouseDown,
    onResizeFrom: fromCol.onMouseDown,
  };
}
