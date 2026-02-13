import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, ViewMode } from 'gantt-task-react';
import { Project, Objective, Quarter } from '../../types';
import * as DataService from '../../services/dataService';

// Color palette for Goal-based coloring
const GOAL_COLORS = [
  { bg: '#3B82F6', progress: '#2563EB', bgSel: '#2563EB', progSel: '#1D4ED8' }, // blue
  { bg: '#10B981', progress: '#059669', bgSel: '#059669', progSel: '#047857' }, // emerald
  { bg: '#F59E0B', progress: '#D97706', bgSel: '#D97706', progSel: '#B45309' }, // amber
  { bg: '#EF4444', progress: '#DC2626', bgSel: '#DC2626', progSel: '#B91C1C' }, // red
  { bg: '#8B5CF6', progress: '#7C3AED', bgSel: '#7C3AED', progSel: '#6D28D9' }, // violet
  { bg: '#EC4899', progress: '#DB2777', bgSel: '#DB2777', progSel: '#BE185D' }, // pink
  { bg: '#06B6D4', progress: '#0891B2', bgSel: '#0891B2', progSel: '#0E7490' }, // cyan
  { bg: '#F97316', progress: '#EA580C', bgSel: '#EA580C', progSel: '#C2410C' }, // orange
  { bg: '#14B8A6', progress: '#0D9488', bgSel: '#0D9488', progSel: '#0F766E' }, // teal
  { bg: '#6366F1', progress: '#4F46E5', bgSel: '#4F46E5', progSel: '#4338CA' }, // indigo
];

function getGoalColor(goalId: number) {
  return GOAL_COLORS[goalId % GOAL_COLORS.length];
}

function quarterStartMonth(quarter: Quarter): number {
  switch (quarter) {
    case Quarter.Q1: return 0;  // Jan
    case Quarter.Q2: return 3;  // Apr
    case Quarter.Q3: return 6;  // Jul
    case Quarter.Q4: return 9;  // Oct
  }
}

function getQuarterFromMonth(month: number): Quarter {
  if (month < 3) return Quarter.Q1;
  if (month < 6) return Quarter.Q2;
  if (month < 9) return Quarter.Q3;
  return Quarter.Q4;
}

function parseDate(dateStr: string | undefined, fallback: Date): Date {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? fallback : d;
}

export interface ObjectiveMetadata {
  objective: Objective;
  projectTitle: string;
  initiativeTitle: string;
  goalTitle: string;
  goalId: number;
}

export function useGantt(projects: Project[], token: string, isAdmin: boolean) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveMetadata | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());

  // Initialize all project-level items as expanded
  useEffect(() => {
    const ids = new Set<string>();
    projects.forEach(p => {
      ids.add(`project-${p.id}`);
      p.initiatives?.forEach(si => {
        ids.add(`initiative-${si.id}`);
        si.goals?.forEach(g => {
          ids.add(`goal-${g.id}`);
        });
      });
    });
    setExpandedIds(ids);
  }, [projects]);

  const toggleExpand = useCallback((taskId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  // Apply project filter
  const filteredProjects = useMemo(() => {
    if (selectedProjectId === null) return projects;
    return projects.filter(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Flatten hierarchy into gantt-task-react Task array
  const { tasks, objectiveMap } = useMemo(() => {
    const taskList: Task[] = [];
    const objMap = new Map<string, ObjectiveMetadata>();
    const now = new Date();

    filteredProjects.forEach(project => {
      const projectId = `project-${project.id}`;
      const projectHidden = !expandedIds.has(projectId);

      // Collect all objective dates for the project-level bar
      let projectStart = new Date(now.getFullYear(), 0, 1);
      let projectEnd = new Date(now.getFullYear(), 11, 31);
      let projectProgressSum = 0;
      let projectObjectiveCount = 0;

      const initiativeTasks: Task[] = [];

      project.initiatives?.forEach(initiative => {
        const initiativeId = `initiative-${initiative.id}`;
        const initiativeHidden = !expandedIds.has(initiativeId);

        let initStart = new Date(now.getFullYear() + 1, 0, 1);
        let initEnd = new Date(now.getFullYear() - 1, 11, 31);
        let initProgressSum = 0;
        let initObjectiveCount = 0;

        const goalTasks: Task[] = [];

        initiative.goals?.forEach(goal => {
          const goalId = `goal-${goal.id}`;
          const goalHidden = !expandedIds.has(goalId);
          const colors = getGoalColor(goal.id);

          let goalStart = new Date(now.getFullYear() + 1, 0, 1);
          let goalEnd = new Date(now.getFullYear() - 1, 11, 31);
          let goalProgressSum = 0;
          let goalObjectiveCount = 0;

          const objectiveTasks: Task[] = [];

          goal.objectives?.forEach(obj => {
            if (!obj.isActive) return;
            if (selectedQuarter && obj.quarter !== selectedQuarter) return;
            if (selectedYear && obj.year && obj.year !== selectedYear) return;

            const startMonth = quarterStartMonth(obj.quarter || Quarter.Q1);
            const objYear = obj.year || now.getFullYear();
            const start = new Date(objYear, startMonth, 1);
            const end = parseDate(obj.dueDate, new Date(objYear, startMonth + 3, 0));

            // Track ranges
            if (start < goalStart) goalStart = start;
            if (end > goalEnd) goalEnd = end;
            goalProgressSum += obj.progress || 0;
            goalObjectiveCount++;

            const taskId = `objective-${obj.id}`;
            objMap.set(taskId, {
              objective: obj,
              projectTitle: project.title,
              initiativeTitle: initiative.title,
              goalTitle: goal.title,
              goalId: goal.id,
            });

            objectiveTasks.push({
              start,
              end,
              name: obj.title,
              id: taskId,
              type: 'task',
              progress: obj.progress || 0,
              project: goalId,
              isDisabled: !isAdmin,
              styles: {
                backgroundColor: colors.bg,
                backgroundSelectedColor: colors.bgSel,
                progressColor: colors.progress,
                progressSelectedColor: colors.progSel,
              },
            });
          });

          if (goalObjectiveCount === 0) return;

          // Adjust initiative range
          if (goalStart < initStart) initStart = goalStart;
          if (goalEnd > initEnd) initEnd = goalEnd;
          initProgressSum += goalProgressSum;
          initObjectiveCount += goalObjectiveCount;

          goalTasks.push({
            start: goalStart,
            end: goalEnd,
            name: goal.title,
            id: goalId,
            type: 'project',
            progress: Math.round(goalProgressSum / goalObjectiveCount),
            hideChildren: goalHidden,
            isDisabled: true,
            styles: {
              backgroundColor: colors.bg + '40',
              backgroundSelectedColor: colors.bgSel + '60',
              progressColor: colors.progress,
              progressSelectedColor: colors.progSel,
            },
          });

          // Add objective tasks after goal (they are children via project field)
          goalTasks.push(...objectiveTasks);
        });

        if (initObjectiveCount === 0) return;

        // Adjust project range
        if (initStart < projectStart) projectStart = initStart;
        if (initEnd > projectEnd) projectEnd = initEnd;
        projectProgressSum += initProgressSum;
        projectObjectiveCount += initObjectiveCount;

        initiativeTasks.push({
          start: initStart,
          end: initEnd,
          name: initiative.title,
          id: initiativeId,
          type: 'project',
          progress: Math.round(initProgressSum / initObjectiveCount),
          project: projectId,
          hideChildren: initiativeHidden,
          isDisabled: true,
          styles: {
            backgroundColor: '#64748B40',
            backgroundSelectedColor: '#47556960',
            progressColor: '#475569',
            progressSelectedColor: '#334155',
          },
        });

        // Add goal tasks after initiative
        goalTasks.forEach(gt => {
          // Goals are children of initiative
          if (gt.type === 'project' && gt.id.startsWith('goal-')) {
            gt.project = initiativeId;
          }
          initiativeTasks.push(gt);
        });
      });

      if (projectObjectiveCount === 0) return;

      // Project-level bar
      taskList.push({
        start: projectStart,
        end: projectEnd,
        name: project.title,
        id: projectId,
        type: 'project',
        progress: Math.round(projectProgressSum / projectObjectiveCount),
        hideChildren: projectHidden,
        isDisabled: true,
        styles: {
          backgroundColor: '#1E293B40',
          backgroundSelectedColor: '#0F172A60',
          progressColor: '#1E293B',
          progressSelectedColor: '#0F172A',
        },
      });

      taskList.push(...initiativeTasks);
    });

    return { tasks: taskList, objectiveMap: objMap };
  }, [filteredProjects, expandedIds, isAdmin, selectedQuarter, selectedYear]);

  // Handle date change from drag-and-drop
  const handleDateChange = useCallback(async (task: Task) => {
    if (!isAdmin || !task.id.startsWith('objective-')) return;

    const objId = parseInt(task.id.replace('objective-', ''));
    const newEnd = task.end;
    const newQuarter = getQuarterFromMonth(newEnd.getMonth());
    const newDueDate = newEnd.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      await DataService.updateEntity('Objective', objId, {
        dueDate: newDueDate,
        quarter: newQuarter,
      }, token);
    } catch (error) {
      console.error('Failed to update objective timeline:', error);
      alert('Failed to save the timeline change. Please try again.');
    }
  }, [isAdmin, token]);

  // Handle click to show detail modal
  const handleTaskClick = useCallback((task: Task) => {
    if (task.id.startsWith('objective-')) {
      const metadata = objectiveMap.get(task.id);
      if (metadata) {
        setSelectedObjective(metadata);
        setIsModalOpen(true);
      }
    }
  }, [objectiveMap]);

  // Handle expander click
  const handleExpanderClick = useCallback((task: Task) => {
    toggleExpand(task.id);
  }, [toggleExpand]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedObjective(null);
  }, []);

  return {
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
  };
}
