
import { useTheme } from '../ThemeContext';

export const useSettings = () => {
    const { theme, updateTheme } = useTheme();

    const colors = [
        { hex: '#3b82f6', name: 'Blue' },
        { hex: '#0ea5e9', name: 'Sky' },
        { hex: '#10b981', name: 'Emerald' },
        { hex: '#8b5cf6', name: 'Violet' },
        { hex: '#f59e0b', name: 'Amber' },
        { hex: '#ef4444', name: 'Rose' },
        { hex: '#ec4899', name: 'Pink' },
        { hex: '#6366f1', name: 'Indigo' },
    ];

    return {
        theme,
        updateTheme,
        colors
    };
};
