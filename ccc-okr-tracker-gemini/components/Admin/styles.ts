export const styles = {
  container: "space-y-6 animate-in fade-in duration-500",
  header: {
    wrapper: "flex justify-between items-center pb-6 border-b border-slate-200",
    title: "text-2xl font-bold text-slate-900",
    subtitle: "text-slate-500 mt-1",
    actions: "flex items-center gap-3",
    primaryBtn: "flex items-center px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 shadow-sm transition-colors",
  },
  table: {
    wrapper: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden",
    header: "bg-slate-50 border-b border-slate-200",
    headerCell: "px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider",
    body: "divide-y divide-slate-100",
    row: "hover:bg-slate-50 transition-colors",
    cell: "px-6 py-4 whitespace-nowrap text-sm text-slate-700",
    cellTitle: "font-medium text-slate-900",
    actionsCell: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium",
    actionBtn: "text-brand-600 hover:text-brand-900 mx-2 hover:underline",
    deleteBtn: "text-rose-600 hover:text-rose-900 mx-2 hover:underline"
  },
  modal: {
    overlay: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200",
    container: "bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200",
    header: "px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50",
    title: "text-lg font-bold text-slate-800",
    body: "p-6 space-y-4 max-h-[80vh] overflow-y-auto",
    footer: "px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50",
    inputGroup: "space-y-1.5",
    label: "block text-sm font-medium text-slate-700",
    input: "block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
    select: "block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white",
    checkboxGroup: "flex items-center gap-2",
    checkbox: "w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500",
    permissionsGrid: "grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2",
    permissionCard: "flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
  }
};