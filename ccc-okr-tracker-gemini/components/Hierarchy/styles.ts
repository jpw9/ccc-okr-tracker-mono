// File: components/Hierarchy/styles.ts

export const styles = {
    container: "pb-20 max-w-6xl mx-auto px-4",
    header: {
        wrapper: "flex flex-col md:flex-row justify-between md:items-end mb-6 border-b border-slate-200 pb-4 gap-4",
        title: "text-2xl font-bold text-slate-900 tracking-tight",
        subtitle: "text-slate-500 mt-1 text-sm md:text-base",
        addButton: "flex items-center px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 shadow-sm transition-all whitespace-nowrap cursor-pointer select-none"
    },
    filterBar: {
        wrapper: "bg-gradient-to-br from-slate-50 to-white p-3 rounded-xl shadow-sm border border-slate-200/60 mb-6 flex flex-col gap-3",
        row: "flex flex-wrap items-center gap-3",
        filterGroup: "inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200/60 shadow-sm",
        label: "text-xs font-semibold text-slate-600 uppercase tracking-wide",
        select: "h-8 px-2.5 py-1 border-0 bg-slate-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition-all min-w-[120px] max-w-[180px] text-slate-700 font-medium",
        toggleBtn: (isActive: boolean) => `inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border shadow-sm ${
            isActive 
            ? 'bg-brand-500 text-white border-brand-600 shadow-brand-200' 
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:shadow-md'
        }`,
        divider: "h-6 w-px bg-slate-200",
    },
    list: {
        wrapper: "space-y-6 animate-in fade-in duration-500",
        emptyState: "text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-300",
        emptyIconWrapper: "mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4",
        emptyIcon: "w-8 h-8 text-slate-400",
        emptyTitle: "text-lg font-medium text-slate-900",
        emptyDesc: "text-slate-500 max-w-sm mx-auto mt-2 mb-6",
        emptyButton: "px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50"
    },
    node: {
        wrapper: "relative pl-4 md:pl-6",
        lineVertical: (isLast: boolean) => `absolute left-0 top-0 bottom-0 w-px bg-slate-200 ${isLast ? 'h-5' : ''}`,
        lineHorizontal: "absolute left-0 top-5 w-4 md:w-6 h-px bg-slate-200",
        contentWrapper: "group relative",
        row: (level: number) => `flex items-start py-2 px-2 rounded-lg border border-transparent hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all cursor-default ${level === 1 ? 'mb-1' : ''}`,
        toggleBtn: (hasChildren: boolean, nextType: string | null) => `mt-1 mr-2 p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10 ${!hasChildren && !nextType ? 'invisible' : ''}`,
        iconBadge: (badgeClass: string) => `flex items-center justify-center w-5 h-5 rounded shrink-0 ${badgeClass}`,
        titleRow: "flex items-start gap-2 flex-wrap min-w-0 flex-1", // Changed items-center to start, added flex-1
        title: (level: number) => `font-medium break-words leading-relaxed ${level === 1 ? 'text-base text-slate-800' : 'text-sm text-slate-700'} flex-1 min-w-0`, // Removed truncate, added flex-1 and min-w-0
        metaBadge: "flex items-center shrink-0 text-xs font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider",
        assigneeBadge: "shrink-0 text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200",
        doneBadge: "shrink-0 text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider",
        progressRow: "flex items-center mt-1.5",
        progressBarBg: "w-16 bg-slate-100 rounded-full h-1",
        progressBarFill: (progress: number) => `h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-slate-400'}`,
        metricText: "text-xs text-slate-400 font-medium ml-2",
        actionsWrapper: "flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg shadow-sm border border-slate-100 ml-2 shrink-0",
        actionBtn: "p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded",
        description: (isHidden: boolean) => `text-xs text-slate-500 mt-1 ${isHidden ? 'hidden' : 'max-h-64 overflow-y-auto block'}`,
        childCountBadge: "shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 border border-slate-300"
    },
    projectCard: {
        container: "bg-white rounded-lg border border-slate-200 shadow-sm mb-4 overflow-hidden",
        header: "bg-slate-50/80 p-3 md:p-4 border-b border-slate-200 flex items-start justify-between group",
        title: "text-lg font-bold text-slate-800 leading-snug break-words flex-1",
        description: (isHidden: boolean) => `text-sm text-slate-500 mt-1 ${isHidden ? 'hidden' : 'max-h-64 overflow-y-auto block'}`,
        progressWrapper: "flex items-center gap-3 mt-2",
        progressBg: "w-24 md:w-32 bg-slate-200 rounded-full h-1.5",
        progressFill: (progress: number) => `h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-brand-600'}`,
        progressText: "text-xs font-bold text-slate-600",
        actions: "flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-4 shrink-0",
        actionBtn: "p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg",
        content: "p-2 md:p-4 md:pl-0"
    },
    dialog: {
        overlay: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200",
        container: "bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200",
        header: "px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50",
        title: "text-lg font-bold text-slate-800",
        form: "p-6",
        label: "block text-sm font-medium text-slate-700 mb-1.5",
        input: "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow",
        textarea: "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow resize-none",
        select: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-white",
        footer: "flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100",
        btnCancel: "px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors",
        btnSave: "px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm transition-colors"
    }
};