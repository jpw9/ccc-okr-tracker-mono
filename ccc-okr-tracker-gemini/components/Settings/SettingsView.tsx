import React, { useState, useEffect, useRef, useCallback } from 'react';
import { styles } from './styles';
import { useSettings } from './useSettings';
import { Palette, Archive, X, RotateCcw, Trash2, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import * as DataService from '../../services/dataService';

interface SettingsViewProps {
    refreshData: () => Promise<void>;
    token: string; // NEW PROP
}

export const SettingsView: React.FC<SettingsViewProps> = ({ refreshData, token }) => {
    const { theme, updateTheme, colors } = useSettings();
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [archivedItems, setArchivedItems] = useState<any[]>([]);
    
    // State for Import Feature
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // MODIFIED: fetchArchive uses useCallback and token dependency
    const fetchArchive = useCallback(async () => {
        if (!token) return;
        const items = await DataService.getArchivedItems(token); // Pass token
        setArchivedItems(items);
    }, [token]);

    useEffect(() => {
        if (isArchiveOpen && token) {
            fetchArchive();
        }
    }, [isArchiveOpen, token, fetchArchive]);

    const handleRestore = async (type: string, id: number) => {
        try {
            await DataService.restoreItem(type, id, token); // Pass token
            fetchArchive(); // Refresh list
            refreshData(); // Also refresh main app data
        } catch (error: any) {
            console.error("Restore Error:", error);
            alert(`Error restoring item: ${error.message}`);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setFileToImport(file);
            setImportMessage(null);
        }
    };
    
    const handleImport = async () => {
        if (!fileToImport) {
            setImportMessage({ type: 'error', text: 'Please select a CSV file.' });
            return;
        }

        setImportLoading(true);
        setImportMessage(null);
        
        try {
            // MODIFIED: Pass token to importHierarchyFromFile
            const result = await DataService.importHierarchyFromFile(fileToImport, token); 
            setImportMessage({ type: 'success', text: result || 'Import completed successfully.' });
            setFileToImport(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset file input
            }
            refreshData(); // Refresh main app hierarchy after successful import
        } catch (error: any) {
            console.error("Import Error:", error);
            setImportMessage({ type: 'error', text: error.message || 'Import failed due to a server error.' });
        } finally {
            setImportLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div>
                 <h1 className={styles.header.title}>Settings & Preferences</h1>
                 <p className={styles.header.subtitle}>Manage your workspace appearance and configurations.</p>
            </div>
            
            <div className={styles.grid}>
                {/* Appearance Section */}
                <div className={styles.section.wrapper}>
                    <div className={styles.section.header}>
                        <div className={styles.section.iconBox("bg-brand-50", "text-brand-600")}><Palette className="w-5 h-5"/></div>
                        <h3 className={styles.section.title}>Workspace Theme</h3>
                    </div>
                    <div className={styles.section.content}>
                        <label className={styles.theme.label}>Primary Brand Color</label>
                        <div className={styles.theme.colorsWrapper}>
                            {colors.map(color => (
                                <button
                                    key={color.hex}
                                    onClick={() => updateTheme({ primaryColor: color.hex })}
                                    className={styles.theme.colorBtn(theme.primaryColor === color.hex)}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                >
                                    {theme.primaryColor === color.hex && (
                                        <div className={styles.theme.checkMarkWrapper}>
                                            <div className={styles.theme.checkMark}></div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <p className={styles.theme.helpText}>This color will be applied to buttons, active states, and charts throughout the application.</p>
                    </div>
                </div>

                {/* Data Management */}
                <div className={styles.section.wrapper}>
                    <div className={styles.section.header}>
                        <div className={styles.section.iconBox()}><Archive className="w-5 h-5"/></div>
                        <h3 className={styles.section.title}>Data Management</h3>
                    </div>
                    <div className={styles.section.contentPadded}>
                        
                        {/* New: Batch Import Row */}
                        <div className={styles.data.row}>
                            <div>
                                <p className={styles.data.rowTitle}>Batch OKR Import</p>
                                <p className={styles.data.rowDesc}>Upload a CSV file to create a hierarchy of Initiatives, Goals, Objectives, and Key Results.</p>
                                {importMessage && (
                                    <div className={`mt-2 flex items-center gap-2 text-sm p-2 rounded-lg ${importMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                        {importMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        <span className="font-medium">{importMessage.text}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv"
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                                />
                                <button 
                                    onClick={handleImport} 
                                    className={`${styles.data.actionBtn} flex items-center justify-center`}
                                    disabled={!fileToImport || importLoading || !token} // Disable if no token
                                >
                                    {importLoading ? 'Importing...' : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Start Import
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Existing: Recycle Bin Row */}
                        <div className={styles.data.row}>
                            <div>
                                <p className={styles.data.rowTitle}>Recycle Bin</p>
                                <p className={styles.data.rowDesc}>View and restore soft-deleted objectives, projects, users, and roles.</p>
                            </div>
                            <button onClick={() => setIsArchiveOpen(true)} className={styles.data.actionBtn} disabled={!token}>
                                View Archive
                            </button>
                        </div>
                        
                        {/* Existing: Audit Logs Row */}
                        <div className={styles.data.row}>
                            <div>
                                <p className={styles.data.rowTitle}>Audit Logs</p>
                                <p className={styles.data.rowDesc}>Track changes made by users across the system.</p>
                            </div>
                            <button className={styles.data.actionBtn} disabled={!token}>
                                View Logs
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Archive Modal */}
            {isArchiveOpen && (
                <div className={styles.modal.overlay}>
                    <div className={styles.modal.container}>
                         <div className={styles.modal.header}>
                            <div className="flex items-center">
                                <Trash2 className="w-5 h-5 text-slate-500 mr-2" />
                                <h3 className={styles.modal.title}>Recycle Bin</h3>
                            </div>
                            <button onClick={() => setIsArchiveOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                         </div>
                         <div className={styles.modal.body}>
                            {archivedItems.length > 0 ? (
                                <table className={styles.modal.table}>
                                    <thead>
                                        <tr>
                                            <th className={styles.modal.th}>Type</th>
                                            <th className={styles.modal.th}>Name / Title</th>
                                            <th className={styles.modal.th}>Deleted Date</th>
                                            <th className={styles.modal.th}>Deleted By</th>
                                            <th className={styles.modal.th}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {archivedItems.map((item) => (
                                            <tr key={`${item.type}-${item.id}`} className={styles.modal.row}>
                                                <td className={styles.modal.td}>
                                                    <span className={styles.modal.typeBadge(item.type)}>
                                                        {item.type.replace(/([A-Z])/g, ' $1').trim()}
                                                    </span>
                                                </td>
                                                <td className={styles.modal.td}>
                                                    <span className="font-medium text-slate-700">{item.title}</span>
                                                </td>
                                                <td className={styles.modal.td}>
                                                    {item.deletedDate ? new Date(item.deletedDate).toLocaleDateString() + ' ' + new Date(item.deletedDate).toLocaleTimeString() : '-'}
                                                </td>
                                                <td className={styles.modal.td}>
                                                    {item.deletedBy || 'System'}
                                                </td>
                                                <td className={styles.modal.td}>
                                                    <button onClick={() => handleRestore(item.type, item.id)} className={styles.modal.restoreBtn}>
                                                        <RotateCcw className="w-3 h-3 mr-1" /> Restore
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className={styles.modal.emptyState}>
                                    <Archive className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <p className="text-lg font-medium text-slate-900">Recycle Bin is Empty</p>
                                    <p className="text-slate-400 text-sm mt-1">There are no soft-deleted items to restore.</p>
                                </div>
                            )}
                         </div>
                         <div className={styles.modal.footer}>
                             <button onClick={() => setIsArchiveOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Close</button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};