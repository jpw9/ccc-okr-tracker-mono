
export const styles = {
    container: "space-y-8 max-w-4xl mx-auto pb-10",
    header: {
        wrapper: "flex flex-col md:flex-row md:items-end justify-between gap-6",
        title: "text-3xl font-bold text-slate-900",
        subtitle: "text-slate-500 mt-1",
        filterWrapper: "flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm",
        filterBtn: (active: boolean) => `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            active 
            ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200' 
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
        }`
    },
    grid: "grid gap-6",
    card: {
        wrapper: "bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group",
        header: "p-6 border-b border-slate-100",
        headerContent: "flex items-start justify-between",
        iconWrapper: "mt-1 p-2.5 rounded-lg bg-indigo-50 text-indigo-600 hidden sm:block",
        titleRow: "flex flex-wrap items-center gap-3",
        title: "text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors",
        quarterBadge: "flex items-center text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider",
        metaRow: "flex flex-wrap items-center gap-4 sm:gap-6 mt-3 text-sm text-slate-500",
        metaItem: "flex items-center gap-1.5",
        statusText: (progress: number) => progress < 30 ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium',
        chartWrapper: "hidden md:block flex-shrink-0 ml-4",
        circularChart: "relative w-16 h-16 flex items-center justify-center",
        circularText: "absolute text-xs font-bold text-slate-700",
        content: "bg-slate-50/50 p-6 space-y-4",
        contentTitle: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
    },
    keyResult: {
        wrapper: "bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4",
        info: "flex-1",
        header: "flex items-center justify-between mb-2",
        title: "font-medium text-slate-700",
        metric: "text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600",
        progressBg: "w-full bg-slate-100 rounded-full h-2",
        progressFill: (progress: number) => `h-2 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`,
        doneState: "text-emerald-600 flex items-center text-sm font-medium whitespace-nowrap"
    },
    emptyState: {
        wrapper: "text-center py-16 bg-white rounded-xl border border-dashed border-slate-300",
        icon: "w-12 h-12 text-slate-300 mx-auto mb-4",
        title: "text-lg font-medium text-slate-900",
        text: "text-slate-500",
        krEmpty: "text-sm text-slate-400 italic flex items-center gap-2 py-2"
    },
    loading: "p-10 text-center text-slate-500"
};
