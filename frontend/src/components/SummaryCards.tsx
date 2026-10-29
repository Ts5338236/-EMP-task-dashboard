import React from 'react';
import { 
  CheckSquare, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { SummaryCounts } from '../types/task';

interface SummaryCardsProps {
  counts: SummaryCounts;
  selectedStatus: string;
  onSelectStatus?: (status: string) => void;
  loading?: boolean;
  isOverdueSelected?: boolean;
}

export function SummaryCards({ counts, selectedStatus, onSelectStatus, loading, isOverdueSelected }: SummaryCardsProps) {
  const cards = [
    {
      id: 'All Statuses',
      label: 'Total Tasks',
      value: counts.total,
      icon: CheckSquare,
      color: 'indigo',
      subtext: 'Across CRM & Helpdesk',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconClass: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'Overdue',
      label: 'Overdue Tasks',
      value: counts.overdue,
      icon: AlertCircle,
      color: 'rose',
      subtext: 'Requiring immediate action',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      iconClass: 'text-rose-600 bg-rose-50',
      isWarning: counts.overdue > 0,
    },
    {
      id: 'In Progress',
      label: 'In Progress',
      value: counts.inProgress,
      icon: Clock,
      color: 'blue',
      subtext: 'Currently being handled',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      iconClass: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'Completed',
      label: 'Completed',
      value: counts.completed,
      icon: CheckCircle2,
      color: 'emerald',
      subtext: 'Resolved work items',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconClass: 'text-emerald-600 bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = card.id === 'Overdue' ? Boolean(isOverdueSelected) : selectedStatus === card.id;

        return (
          <div
            key={card.id}
            onClick={() => {
              if (onSelectStatus) {
                onSelectStatus(card.id);
              }
            }}
            className={`p-5 rounded-xl bg-white border transition-all ${
              isSelected
                ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 shadow-2xs'
            } ${onSelectStatus ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.label}
              </span>
              <div className={`p-2 rounded-lg ${card.iconClass}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              {loading ? (
                <div className="h-8 w-12 bg-slate-200 rounded animate-pulse my-0.5" />
              ) : (
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </div>
              )}
              {!loading && card.isWarning && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  Action Required
                </span>
              )}
            </div>

            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-slate-400" />
              <span>{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
