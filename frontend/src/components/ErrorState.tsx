import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}

export function ErrorState({ message, onRetry, retrying }: ErrorStateProps) {
  return (
    <div className="bg-white rounded-xl border border-rose-200 p-10 text-center shadow-2xs space-y-4">
      <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto border border-rose-200">
        <AlertOctagon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-base text-slate-900">
          Unable to Load Employee Tasks
        </h3>
        <p className="text-xs text-rose-600 max-w-md mx-auto font-mono bg-rose-50/60 p-2 rounded border border-rose-100">
          {message}
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Verify that the FastAPI backend server is running and accessible.
        </p>
      </div>
      <div>
        <button
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Retrying Connection...' : 'Retry Request'}</span>
        </button>
      </div>
    </div>
  );
}
