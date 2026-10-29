import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AlertBannerProps {
  warnings: string[];
  onDismiss?: () => void;
}

export function AlertBanner({ warnings, onDismiss }: AlertBannerProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Partial Source System Degradation
            </h4>
            <div className="text-xs text-amber-700 space-y-0.5">
              {warnings.map((w, idx) => (
                <p key={idx}>{w}</p>
              ))}
            </div>
            <p className="text-[11px] text-amber-600 italic">
              Displaying work items from currently available upstream systems.
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-amber-500 hover:text-amber-800 p-1 rounded-md"
            aria-label="Dismiss warning"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export const PartialFailureBanner = AlertBanner;

