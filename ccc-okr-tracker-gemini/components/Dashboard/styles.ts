
export const styles = {
  container: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
  header: {
    wrapper: "",
    title: "text-3xl font-bold text-slate-900",
    subtitle: "text-slate-500 mt-2"
  },
  grid: {
    kpi: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
    charts: "grid grid-cols-1 lg:grid-cols-3 gap-8"
  },
  card: {
    base: "bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow",
    header: "flex items-start justify-between",
    title: "text-sm font-semibold text-slate-500 uppercase tracking-wide",
    valueWrapper: "mt-2 flex items-baseline gap-2",
    value: "text-3xl font-bold text-slate-900",
    subtext: "text-sm font-medium text-slate-400",
    iconWrapper: "p-3 rounded-lg"
  },
  chartCard: {
    container: "bg-white p-6 rounded-xl shadow-sm border border-slate-200",
    header: "flex items-center justify-between mb-6",
    title: "text-lg font-bold text-slate-800",
    action: "text-sm text-brand-600 font-medium hover:text-brand-700",
    areaChartWrapper: "h-72",
    donutChartWrapper: "h-64 relative",
    donutCenter: "absolute inset-0 flex flex-col items-center justify-center pointer-events-none",
    donutTotal: "text-3xl font-bold text-slate-800",
    donutLabel: "text-xs text-slate-500 font-medium uppercase",
    legend: "grid grid-cols-2 gap-4 mt-4"
  },
  projectList: {
    container: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden",
    header: "px-6 py-4 border-b border-slate-200 bg-slate-50/50",
    headerTitle: "text-lg font-bold text-slate-800",
    list: "divide-y divide-slate-100",
    item: "p-6 hover:bg-slate-50 transition-colors",
    itemHeader: "flex justify-between items-center mb-2",
    itemTitle: "text-base font-semibold text-slate-800",
    itemDesc: "text-sm text-slate-500 mt-1",
    itemMeta: "text-right",
    percentage: "text-2xl font-bold text-slate-900",
    label: "text-xs text-slate-400 font-medium uppercase",
    progressBg: "w-full bg-slate-100 rounded-full h-2 mt-2",
    progressBar: (progress: number) => `h-2 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-brand-600'}`
  }
};
