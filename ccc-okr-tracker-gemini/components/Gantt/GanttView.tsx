import React, { useRef, useMemo, useCallback } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { Calendar, ZoomIn, ZoomOut, BarChart3, AlertCircle, Filter } from 'lucide-react';
import { useGantt } from './useGantt';
import { ObjectiveModal } from './ObjectiveModal';
import { CustomTaskListHeader, CustomTaskListTable, useTaskListColumns } from './CustomTaskList';
import { Project, Quarter } from '../../types';
import { useAuth } from '../../KeycloakProvider';

interface GanttViewProps {
  projects: Project[];
  token: string;
}

const VIEW_MODES: { mode: ViewMode; label: string }[] = [
  { mode: ViewMode.Day, label: 'Day' },
  { mode: ViewMode.Week, label: 'Week' },
  { mode: ViewMode.Month, label: 'Month' },
  { mode: ViewMode.Year, label: 'Year' },
];

const QUARTERS: { value: Quarter; label: string }[] = [
  { value: Quarter.Q1, label: 'Q1' },
  { value: Quarter.Q2, label: 'Q2' },
  { value: Quarter.Q3, label: 'Q3' },
  { value: Quarter.Q4, label: 'Q4' },
];

// Generate year options: current year ± 2
function getYearOptions(): number[] {
  const current = new Date().getFullYear();
  return [current - 2, current - 1, current, current + 1, current + 2];
}

const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' };

export const GanttView: React.FC<GanttViewProps> = ({ projects, token }) => {
  const { appUser } = useAuth();
  const isAdmin = appUser?.roles?.some(r => r.isSystem) || false;
  const containerRef = useRef<HTMLDivElement>(null);
  const { colWidths, totalWidth, onResizeName, onResizeFrom } = useTaskListColumns();

  const {
    tasks,
    viewMode,
    setViewMode,
    selectedProjectId,
    setSelectedProjectId,
    selectedQuarter,
    setSelectedQuarter,
    selectedYear,
    setSelectedYear,
    selectedObjective,
    isModalOpen,
    handleDateChange,
    handleTaskClick,
    handleExpanderClick,
    closeModal,
  } = useGantt(projects, token, isAdmin);

  const currentModeIndex = VIEW_MODES.findIndex(v => v.mode === viewMode);

  const zoomIn = () => {
    if (currentModeIndex > 0) setViewMode(VIEW_MODES[currentModeIndex - 1].mode);
  };
  const zoomOut = () => {
    if (currentModeIndex < VIEW_MODES.length - 1) setViewMode(VIEW_MODES[currentModeIndex + 1].mode);
  };

  const activeFilterCount =
    (selectedProjectId !== null ? 1 : 0) +
    (selectedQuarter !== null ? 1 : 0) +
    (selectedYear !== null ? 1 : 0);

  const yearOptions = useMemo(() => getYearOptions(), []);

  // Custom TaskListHeader with column widths wired in
  const TaskListHeaderComponent = useCallback(
    (props: any) => (
      <CustomTaskListHeader {...props} colWidths={colWidths} onResizeName={onResizeName} onResizeFrom={onResizeFrom} />
    ),
    [colWidths, onResizeName, onResizeFrom]
  );

  // Custom TaskListTable with column widths wired in
  const TaskListTableComponent = useCallback(
    (props: any) => (
      <CustomTaskListTable {...props} colWidths={colWidths} />
    ),
    [colWidths]
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Compact Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        {/* Left: Title + Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            <h1 className="text-sm font-bold text-slate-900">Gantt Chart</h1>
            <span className="text-xs text-slate-400 ml-1">
              {tasks.length} item{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Filters */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />

            {/* Project Filter */}
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
              className="h-7 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700 px-2 pr-6 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 appearance-none cursor-pointer"
              style={selectStyle}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={selectedYear ?? ''}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
              className="h-7 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700 px-2 pr-6 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 appearance-none cursor-pointer"
              style={selectStyle}
            >
              <option value="">All Years</option>
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Quarter Filter */}
            <select
              value={selectedQuarter ?? ''}
              onChange={(e) => setSelectedQuarter(e.target.value ? (e.target.value as Quarter) : null)}
              className="h-7 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700 px-2 pr-6 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 appearance-none cursor-pointer"
              style={selectStyle}
            >
              <option value="">All Quarters</option>
              {QUARTERS.map(q => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setSelectedProjectId(null); setSelectedQuarter(null); setSelectedYear(null); }}
                className="h-7 px-2 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-md transition-colors font-medium"
              >
                Clear ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* Right: View Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 overflow-hidden">
            <button
              onClick={zoomIn}
              disabled={currentModeIndex === 0}
              className="p-1.5 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              onClick={zoomOut}
              disabled={currentModeIndex === VIEW_MODES.length - 1}
              className="p-1.5 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

          <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 overflow-hidden">
            {VIEW_MODES.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                  viewMode === mode
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {isAdmin && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-1 rounded hidden lg:inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Drag to adjust
            </span>
          )}
        </div>
      </div>

      {/* Gantt Chart Area */}
      <div ref={containerRef} className="flex-1 min-h-0 bg-white gantt-container" style={{ overflow: 'auto' }}>
        {tasks.length > 0 ? (
          <Gantt
            tasks={tasks}
            viewMode={viewMode}
            onDateChange={handleDateChange}
            onClick={handleTaskClick}
            onExpanderClick={handleExpanderClick}
            listCellWidth={`${totalWidth}px`}
            columnWidth={viewMode === ViewMode.Year ? 300 : viewMode === ViewMode.Month ? 100 : viewMode === ViewMode.Week ? 60 : 40}
            ganttHeight={0}
            barCornerRadius={3}
            barFill={70}
            fontSize="11px"
            headerHeight={40}
            rowHeight={30}
            todayColor="rgba(59, 130, 246, 0.06)"
            TaskListHeader={TaskListHeaderComponent}
            TaskListTable={TaskListTableComponent}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
            <AlertCircle className="w-10 h-10 mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No objectives to display</p>
            <p className="text-xs mt-1">
              {activeFilterCount > 0
                ? 'Try adjusting your filters to see more results.'
                : 'Add objectives with due dates or quarter assignments to see them on the timeline.'}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedObjective && (
        <ObjectiveModal metadata={selectedObjective} onClose={closeModal} />
      )}

      {/* Custom styles for compact gantt */}
      <style>{`
        .gantt-container {
          font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        }
        .gantt-container * {
          font-family: inherit !important;
        }
        .gantt-container .ganttTable {
          border-right: 1px solid #e2e8f0;
        }
        .gantt-container ._2B2zv {
          fill: #fafbfc;
        }
        .gantt-container ._2B2zv:nth-child(even) {
          fill: #f1f5f9;
        }
        .gantt-container > div {
          min-width: fit-content;
        }
        .gantt-container::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .gantt-container::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 5px;
        }
        .gantt-container::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
};
