declare module 'gantt-task-react' {
  import { FC } from 'react';

  export enum ViewMode {
    Hour = 'Hour',
    QuarterDay = 'Quarter Day',
    HalfDay = 'Half Day',
    Day = 'Day',
    Week = 'Week',
    Month = 'Month',
    Year = 'Year',
  }

  export interface Task {
    id: string;
    name: string;
    type: 'task' | 'milestone' | 'project';
    start: Date;
    end: Date;
    progress: number;
    dependencies?: string[];
    project?: string;
    hideChildren?: boolean;
    isDisabled?: boolean;
    styles?: {
      backgroundColor?: string;
      backgroundSelectedColor?: string;
      progressColor?: string;
      progressSelectedColor?: string;
    };
    [key: string]: any;
  }

  export interface TaskListHeaderProps {
    headerHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
  }

  export interface TaskListTableProps {
    rowHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    locale: string;
    tasks: Task[];
    selectedTaskId: string;
    setSelectedTask: (taskId: string) => void;
    onExpanderClick: (task: Task) => void;
  }

  export interface GanttProps {
    tasks: Task[];
    viewMode?: ViewMode;
    onDateChange?: (task: Task, children: Task[]) => void;
    onProgressChange?: (task: Task, children: Task[]) => void;
    onDoubleClick?: (task: Task) => void;
    onClick?: (task: Task) => void;
    onSelect?: (task: Task, isSelected: boolean) => void;
    onExpanderClick?: (task: Task) => void;
    onDelete?: (task: Task) => boolean;
    listCellWidth?: string;
    columnWidth?: number;
    ganttHeight?: number;
    barCornerRadius?: number;
    barFill?: number;
    fontSize?: string;
    headerHeight?: number;
    rowHeight?: number;
    todayColor?: string;
    preStepsCount?: number;
    locale?: string;
    rtl?: boolean;
    TaskListHeader?: FC<TaskListHeaderProps>;
    TaskListTable?: FC<TaskListTableProps>;
    TooltipContent?: FC<any>;
  }

  export const Gantt: FC<GanttProps>;
}

declare module 'gantt-task-react/dist/index.css' {
  const content: string;
  export default content;
}
