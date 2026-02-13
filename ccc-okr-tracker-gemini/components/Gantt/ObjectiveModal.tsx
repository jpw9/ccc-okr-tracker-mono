import React from 'react';
import { X } from 'lucide-react';
import { ObjectiveMetadata } from './useGantt';

interface ObjectiveModalProps {
  metadata: ObjectiveMetadata;
  onClose: () => void;
}

export const ObjectiveModal: React.FC<ObjectiveModalProps> = ({ metadata, onClose }) => {
  const { objective, projectTitle, initiativeTitle, goalTitle } = metadata;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-brand-50 to-indigo-50">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{objective.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {projectTitle} → {initiativeTitle} → {goalTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-lg hover:bg-slate-200 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {/* Objective Info */}
          <div className="mb-4">
            {objective.description && (
              <p className="text-sm text-slate-600 mb-3">{objective.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Progress:</span>
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-brand-500"
                    style={{ width: `${objective.progress}%` }}
                  />
                </div>
                <span className="font-semibold text-slate-700">{objective.progress}%</span>
              </div>
              <div>
                <span className="text-slate-500">Quarter:</span>{' '}
                <span className="font-semibold text-slate-700">{objective.quarter} {objective.year}</span>
              </div>
            </div>
            {objective.dueDate && (
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Due Date:</span>{' '}
                <span className="font-semibold text-slate-700">{new Date(objective.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            {objective.assignee && (
              <div className="mt-1 text-sm">
                <span className="text-slate-500">Assignee:</span>{' '}
                <span className="font-semibold text-slate-700">{objective.assignee}</span>
              </div>
            )}
          </div>

          {/* Key Results */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              Key Results
              <span className="text-xs font-normal bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {objective.keyResults?.length || 0}
              </span>
            </h3>
            {objective.keyResults && objective.keyResults.length > 0 ? (
              <div className="space-y-2">
                {objective.keyResults.map((kr) => (
                  <div
                    key={kr.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{kr.title}</p>
                      {kr.assignee && (
                        <p className="text-xs text-slate-500">{kr.assignee}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${kr.progress}%`,
                            backgroundColor: kr.progress >= 100 ? '#10B981' : kr.progress >= 50 ? '#F59E0B' : '#3B82F6',
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 w-8 text-right">
                        {kr.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic py-4 text-center">No Key Results defined.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
