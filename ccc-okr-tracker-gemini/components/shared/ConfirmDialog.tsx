/**
 * Styled confirmation dialog to replace native window.confirm() across the app.
 * Matches the ItemDialog styling from TreeViewShared for visual consistency.
 */

import React, { useEffect, useCallback } from 'react';
import { AlertTriangle, Trash2, RefreshCw, X } from 'lucide-react';
import { styles as hierarchyStyles } from '../Hierarchy/styles';

export interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    warning?: string;          // Optional warning shown with amber highlight
    confirmLabel?: string;     // Button text (default: "Delete")
    variant?: 'danger' | 'warning' | 'info'; // Controls color scheme
    onConfirm: (() => void) | null;
}

export const CONFIRM_DIALOG_INITIAL: ConfirmDialogState = {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
};

interface ConfirmDialogProps {
    state: ConfirmDialogState;
    onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ state, onClose }) => {
    if (!state.isOpen) return null;

    const variant = state.variant || 'danger';
    const confirmLabel = state.confirmLabel || 'Delete';

    // Close on Escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        // Prevent body scroll
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [handleKeyDown]);

    const variantConfig = {
        danger: {
            icon: Trash2,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        },
        warning: {
            icon: AlertTriangle,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
        },
        info: {
            icon: RefreshCw,
            iconBg: 'bg-brand-100',
            iconColor: 'text-brand-600',
            confirmBtn: 'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500',
        },
    };

    const config = variantConfig[variant];
    const Icon = config.icon;

    const handleConfirm = () => {
        if (state.onConfirm) state.onConfirm();
        onClose();
    };

    return (
        <div className={hierarchyStyles.dialog.overlay} onClick={onClose}>
            <div 
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">{state.title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex gap-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${config.iconColor}`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 leading-relaxed">{state.message}</p>
                            
                            {state.warning && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-amber-800 font-medium leading-relaxed">{state.warning}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.confirmBtn}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
