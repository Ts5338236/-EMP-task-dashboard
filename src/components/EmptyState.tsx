import React from 'react';
import { SearchX, Filter } from 'lucide-react';

interface EmptyStateProps {
  searchQuery: string;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function EmptyState({ searchQuery, hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs space-y-4">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
        <SearchX className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-base text-slate-800">
          No matching tasks found
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {searchQuery
            ? `No work items matched "${searchQuery}". Try revising your keywords or adjusting filters.`
            : 'No work items match the selected employee or status filters.'}
        </p>
      </div>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  );
}
