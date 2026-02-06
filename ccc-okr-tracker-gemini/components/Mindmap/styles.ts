// File: components/Mindmap/styles.ts

export const styles = {
    container: "h-[calc(100vh-4rem)] w-full flex flex-col",
    
    header: {
        wrapper: "flex flex-col md:flex-row justify-between md:items-center px-4 py-3 border-b border-slate-200 bg-white gap-3",
        title: "text-xl font-bold text-slate-900 tracking-tight",
        subtitle: "text-slate-500 text-sm hidden sm:block",
        controls: "flex flex-wrap items-center gap-2 sm:gap-4",
        select: "h-10 sm:h-9 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white min-w-[180px] sm:min-w-[200px] touch-manipulation",
        depthLabel: "text-sm font-medium text-slate-600 hidden sm:inline",
        depthSlider: "w-20 sm:w-24 accent-brand-600 cursor-pointer touch-manipulation",
    },

    canvas: {
        wrapper: "flex-1 bg-slate-50 relative touch-pan-x touch-pan-y",
    },

    controls: {
        wrapper: "flex flex-col gap-1 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5",
        button: "p-2.5 sm:p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 active:bg-brand-100 rounded-lg transition-colors touch-manipulation",
        buttonActive: "p-2.5 sm:p-2 text-brand-600 bg-brand-50 rounded-lg",
        divider: "h-px bg-slate-200 mx-1 my-0.5",
        tooltip: "absolute right-full mr-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
    },

    legend: {
        wrapper: "flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto",
        item: "flex items-center gap-1.5 text-xs text-slate-600 shrink-0",
        dot: "w-2.5 h-2.5 rounded-full",
    },

    // Node colors by hierarchy level
    nodeColors: {
        project: {
            bg: "bg-blue-500",
            border: "border-blue-600",
            text: "text-white",
            light: "bg-blue-50 border-blue-200 text-blue-800",
        },
        strategicInitiative: {
            bg: "bg-purple-500",
            border: "border-purple-600",
            text: "text-white",
            light: "bg-purple-50 border-purple-200 text-purple-800",
        },
        goal: {
            bg: "bg-green-500",
            border: "border-green-600",
            text: "text-white",
            light: "bg-green-50 border-green-200 text-green-800",
        },
        objective: {
            bg: "bg-orange-500",
            border: "border-orange-600",
            text: "text-white",
            light: "bg-orange-50 border-orange-200 text-orange-800",
        },
        keyResult: {
            bg: "bg-yellow-500",
            border: "border-yellow-600",
            text: "text-white",
            light: "bg-yellow-50 border-yellow-200 text-yellow-800",
        },
        actionItem: {
            bg: "bg-slate-500",
            border: "border-slate-600",
            text: "text-white",
            light: "bg-slate-50 border-slate-200 text-slate-800",
        },
    },

    node: {
        wrapper: "px-2 py-1 rounded-full border shadow-sm min-w-[70px] max-w-[120px] text-center transition-all duration-200 ease-out hover:shadow-md hover:scale-105 active:scale-100 select-none overflow-visible",
        title: "font-medium text-[7px] leading-tight truncate overflow-hidden text-ellipsis whitespace-nowrap tracking-tight",
        expandIndicator: "absolute right-[-12px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-500 shadow-sm transition-all duration-200 hover:border-brand-400 hover:text-brand-600 z-10",
    },

    loading: {
        wrapper: "flex-1 flex flex-col items-center justify-center bg-slate-50",
        spinner: "w-10 h-10 sm:w-8 sm:h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin",
        text: "mt-4 text-slate-500 text-sm",
    },

    empty: {
        wrapper: "flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 text-center",
        icon: "w-20 h-20 sm:w-16 sm:h-16 text-slate-300 mb-4",
        title: "text-lg font-medium text-slate-700",
        subtitle: "text-slate-500 text-sm mt-1 max-w-xs",
    },

    error: {
        wrapper: "flex-1 flex flex-col items-center justify-center bg-red-50 p-6 text-center",
        icon: "w-16 h-16 text-red-300 mb-4",
        title: "text-lg font-medium text-red-700",
        subtitle: "text-red-500 text-sm mt-1 max-w-md",
        button: "mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors",
    },

    noProjects: {
        wrapper: "flex-1 flex flex-col items-center justify-center bg-amber-50 p-6 text-center",
        icon: "w-16 h-16 text-amber-300 mb-4",
        title: "text-lg font-medium text-amber-700",
        subtitle: "text-amber-600 text-sm mt-1 max-w-xs",
    },

    shortcuts: {
        wrapper: "absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-3 text-xs text-slate-600 hidden lg:block",
        title: "font-semibold text-slate-700 mb-2",
        row: "flex items-center gap-2 py-0.5",
        key: "px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-xs",
    },
};
