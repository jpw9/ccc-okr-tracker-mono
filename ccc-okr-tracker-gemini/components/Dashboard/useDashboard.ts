import { useMemo } from 'react';
import { Project } from '../../types';

export const useDashboard = (projects: Project[]) => {
  const stats = useMemo(() => {
    let totalObjectives = 0;
    let completedObjectives = 0;
    let atRisk = 0;
    let offTrack = 0;
    let totalProgress = 0;
    let projectCount = 0;

    const traverse = (items: any[]) => {
      items.forEach(item => {
        if (item.type === 'Objective' && item.isActive) {
          totalObjectives++;
          if (item.progress === 100) completedObjectives++;
          else if (item.progress < 30) offTrack++;
          else if (item.progress < 70) atRisk++;
        }
        if (item.type === 'Project' && item.isActive) {
            projectCount++;
            totalProgress += item.progress;
        }
        
        if (item.initiatives) traverse(item.initiatives);
        if (item.goals) traverse(item.goals);
        if (item.objectives) traverse(item.objectives);
      });
    };
    
    traverse(projects);
    const avgProjectProgress = projectCount > 0 ? Math.round(totalProgress / projectCount) : 0;

    return { totalObjectives, completedObjectives, atRisk, offTrack, avgProjectProgress, projectCount };
  }, [projects]);

  const pieData = [
    { name: 'Completed', value: stats.completedObjectives, color: '#10B981' }, 
    { name: 'On Track', value: stats.totalObjectives - stats.completedObjectives - stats.atRisk - stats.offTrack, color: '#3B82F6' },
    { name: 'At Risk', value: stats.atRisk, color: '#F59E0B' },
    { name: 'Off Track', value: stats.offTrack, color: '#EF4444' },
  ].filter(d => d.value > 0);

  // MODIFIED: Updated to show a Quarterly trend simulation
  const trendData = [
    { name: 'Q4 2024', progress: 40 },
    { name: 'Q1 2025', progress: 65 },
    { name: 'Q2 YTD', progress: stats.avgProjectProgress },
  ];

  return {
    stats,
    pieData,
    trendData
  };
};