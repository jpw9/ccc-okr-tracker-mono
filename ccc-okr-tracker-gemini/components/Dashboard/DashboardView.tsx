import React from 'react';
import { Project } from '../../types';
import { styles } from './styles';
import { useDashboard } from './useDashboard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle, XCircle, Target, Activity } from 'lucide-react';

interface DashboardViewProps {
  projects: Project[];
}

// Sub-component for Cards (Pure View)
const StatCard = ({ title, value, subtext, icon: Icon, colorClass, bgClass }: any) => (
  <div className={styles.card.base}>
    <div className={styles.card.header}>
      <div>
        <p className={styles.card.title}>{title}</p>
        <div className={styles.card.valueWrapper}>
          <span className={styles.card.value}>{value}</span>
          <span className={styles.card.subtext}>{subtext}</span>
        </div>
      </div>
      <div className={`${styles.card.iconWrapper} ${bgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
    </div>
  </div>
);

export const DashboardView: React.FC<DashboardViewProps> = ({ projects }) => {
  const { stats, pieData, trendData } = useDashboard(projects);

  return (
    <div className={styles.container}>
      <div className={styles.header.wrapper}>
        <h1 className={styles.header.title}>Executive Dashboard</h1>
        <p className={styles.header.subtitle}>Real-time overview of strategic performance and OKR health.</p>
      </div>

      {/* KPI Cards */}
      <div className={styles.grid.kpi}>
        <StatCard 
          title="Overall Progress" 
          value={`${stats.avgProjectProgress}%`} 
          subtext="Across portfolio"
          icon={Activity} 
          colorClass="text-brand-600" 
          bgClass="bg-brand-50"
        />
        <StatCard 
          title="Total Objectives" 
          value={stats.totalObjectives} 
          subtext="Active goals"
          // UPDATED: Changed from text-violet-600 to text-indigo-600/bg-indigo-50 for Objectives on Dashboard
          icon={Target} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50"
        />
        <StatCard 
          title="At Risk" 
          value={stats.atRisk} 
          subtext="Needs attention"
          icon={AlertTriangle} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50"
        />
        <StatCard 
          title="Off Track" 
          value={stats.offTrack} 
          subtext="Critical issues"
          icon={XCircle} 
          colorClass="text-rose-600" 
          bgClass="bg-rose-50"
        />
      </div>

      <div className={styles.grid.charts}>
        {/* Main Chart */}
        <div className={`${styles.chartCard.container} lg:col-span-2`}>
          <div className={styles.chartCard.header}>
             <h3 className={styles.chartCard.title}>Performance Trend</h3>
             <button className={styles.chartCard.action}>View Details</button>
          </div>
          <div className={styles.chartCard.areaChartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                  itemStyle={{color: '#fff'}}
                />
                <Area type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProgress)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className={styles.chartCard.container}>
          <h3 className={`${styles.chartCard.title} mb-6`}>Objective Health</h3>
          <div className={styles.chartCard.donutChartWrapper}>
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.chartCard.donutCenter}>
                <span className={styles.chartCard.donutTotal}>{stats.totalObjectives}</span>
                <span className={styles.chartCard.donutLabel}>Total</span>
            </div>
          </div>
          <div className={styles.chartCard.legend}>
             {pieData.map((d) => (
                 <div key={d.name} className="flex items-center text-sm">
                     <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: d.color}}></span>
                     <span className="text-slate-600">{d.name}</span>
                 </div>
             ))}
          </div>
        </div>
      </div>

      {/* Project List */}
      <div className={styles.projectList.container}>
         <div className={styles.projectList.header}>
             <h3 className={styles.projectList.headerTitle}>Active Strategic Projects</h3>
         </div>
         <div className={styles.projectList.list}>
             {projects.filter(p => p.isActive).map(project => (
               <div key={project.id} className={styles.projectList.item}>
                 <div className={styles.projectList.itemHeader}>
                   <div>
                       <span className={styles.projectList.itemTitle}>{project.title}</span>
                       <p className={styles.projectList.itemDesc}>{project.description}</p>
                   </div>
                   <div className={styles.projectList.itemMeta}>
                       <span className={styles.projectList.percentage}>{project.progress}%</span>
                       <p className={styles.projectList.label}>Completion</p>
                   </div>
                 </div>
                 <div className={styles.projectList.progressBg}>
                   <div 
                      className={styles.projectList.progressBar(project.progress)}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                 </div>
               </div>
             ))}
         </div>
      </div>
    </div>
  );
};