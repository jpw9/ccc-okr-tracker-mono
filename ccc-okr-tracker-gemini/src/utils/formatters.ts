// ccc-okr-tracker-gemini/src/utils/formatters.ts

export const formatNodeType = (type: string, plural: boolean = false) => {
    if (type === 'ALL') return 'ALL';
    
    if (!type || typeof type !== 'string') return plural ? 'Items' : 'Item';
    let formatted = type.replace(/([A-Z])/g, ' $1').trim();
    if (plural) {
        return formatted.endsWith('s') ? formatted : formatted + 's';
    }
    return formatted;
};
