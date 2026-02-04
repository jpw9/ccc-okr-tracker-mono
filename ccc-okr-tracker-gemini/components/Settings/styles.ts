
export const styles = {
    container: "max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500",
    header: {
        title: "text-3xl font-bold text-slate-900",
        subtitle: "text-slate-500 mt-2"
    },
    grid: "grid gap-8",
    section: {
        wrapper: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden",
        header: "p-6 border-b border-slate-100 flex items-center gap-3",
        iconBox: (bgColor: string = "bg-slate-100", textColor: string = "text-slate-600") => `p-2 ${bgColor} rounded-lg ${textColor}`,
        title: "text-lg font-bold text-slate-800",
        content: "p-8",
        contentPadded: "p-6 space-y-4"
    },
    theme: {
        label: "block text-sm font-medium text-slate-700 mb-4",
        colorsWrapper: "flex flex-wrap gap-4",
        colorBtn: (isActive: boolean) => `group relative w-12 h-12 rounded-full border-2 transition-all duration-200 focus:outline-none ${isActive ? 'border-slate-800 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`,
        checkMarkWrapper: "absolute inset-0 flex items-center justify-center",
        checkMark: "w-2.5 h-2.5 bg-white rounded-full shadow-sm",
        helpText: "mt-4 text-sm text-slate-500"
    },
    data: {
        row: "flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100",
        rowTitle: "font-semibold text-slate-800",
        rowDesc: "text-sm text-slate-500 mt-1",
        actionBtn: "px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
    },
    modal: {
        overlay: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200",
        container: "bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]",
        header: "px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50",
        title: "text-lg font-bold text-slate-800",
        body: "flex-1 overflow-y-auto p-0",
        footer: "px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50",
        emptyState: "p-10 text-center text-slate-500",
        table: "w-full text-sm text-left",
        th: "px-6 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 sticky top-0",
        td: "px-6 py-4 border-b border-slate-100",
        row: "hover:bg-slate-50 transition-colors",
        restoreBtn: "flex items-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors",
        typeBadge: (type: string) => {
             const colors: any = { 
                 Project: 'bg-blue-50 text-blue-700 border-blue-100',
                 StrategicInitiative: 'bg-violet-50 text-violet-700 border-violet-100',
                 User: 'bg-slate-100 text-slate-700 border-slate-200',
                 Role: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                 ActionItem: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                 Goal: 'bg-orange-50 text-orange-700 border-orange-100',
                 Objective: 'bg-amber-50 text-amber-700 border-amber-100'
             };
             return `px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colors[type] || 'bg-gray-50 text-gray-600'}`;
        }
    }
};
