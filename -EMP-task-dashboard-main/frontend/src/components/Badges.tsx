import React from 'react';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Flame, 
  AlertTriangle, 
  Minus, 
  ArrowDown, 
  Layers, 
  Headphones,
  Calendar
} from 'lucide-react';
import { TaskStatus, TaskUrgency, TaskSource, PriorityCategory } from '../types/task';

export function StatusBadge({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden="true" />
          <span>Completed</span>
        </span>
      );
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="h-3 w-3 text-blue-500" aria-hidden="true" />
          <span>In Progress</span>
        </span>
      );
    case 'Pending':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="h-3 w-3 text-amber-500" aria-hidden="true" />
          <span>Pending</span>
        </span>
      );
  }
}

export function UrgencyBadge({ urgency }: { urgency: TaskUrgency }) {
  switch (urgency) {
    case 'Urgent':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <Flame className="h-3 w-3 text-rose-600" aria-hidden="true" />
          <span>Urgent</span>
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
          <AlertTriangle className="h-3 w-3 text-orange-600" aria-hidden="true" />
          <span>High</span>
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
          <Minus className="h-3 w-3 text-slate-500" aria-hidden="true" />
          <span>Medium</span>
        </span>
      );
    case 'Low':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
          <ArrowDown className="h-3 w-3 text-slate-400" aria-hidden="true" />
          <span>Low</span>
        </span>
      );
  }
}

export function SourceBadge({ source }: { source: TaskSource }) {
  if (source === 'CRM') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
        <Layers className="h-3 w-3 text-purple-600" aria-hidden="true" />
        <span>CRM</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
      <Headphones className="h-3 w-3 text-sky-600" aria-hidden="true" />
      <span>Helpdesk</span>
    </span>
  );
}

export function PriorityCategoryBadge({ category }: { category?: PriorityCategory }) {
  if (!category) return null;

  switch (category) {
    case 'Overdue':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-600 text-white shadow-xs">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          <span>Overdue</span>
        </span>
      );
    case 'Due Today':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-600 text-white shadow-xs">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          <span>Due Today</span>
        </span>
      );
    case 'Due Soon':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Clock className="h-3 w-3 text-indigo-500" aria-hidden="true" />
          <span>Due Soon</span>
        </span>
      );
    case 'Upcoming':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          <span>Upcoming</span>
        </span>
      );
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
          <span>Completed</span>
        </span>
      );
    default:
      return null;
  }
}

export const PriorityBadge = PriorityCategoryBadge;
