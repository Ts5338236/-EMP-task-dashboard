import React from 'react';

export function LoadingState() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="h-4 bg-slate-200 rounded w-48 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-slate-100 rounded w-1/3 animate-pulse" />
            </div>
            <div className="h-6 bg-slate-200 rounded-full w-20 animate-pulse hidden sm:block" />
            <div className="h-6 bg-slate-200 rounded w-16 animate-pulse hidden md:block" />
            <div className="h-6 bg-slate-200 rounded w-24 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
