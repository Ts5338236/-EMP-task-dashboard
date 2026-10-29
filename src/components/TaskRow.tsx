import React from 'react';
import { ExternalLink, Calendar } from 'lucide-react';
import { Task } from '../types/task';
import { 
  StatusBadge, 
  UrgencyBadge, 
  SourceBadge, 
  PriorityCategoryBadge 
} from './Badges';
import { formatDeadline } from '../utils/taskDisplay';

interface TaskRowProps {
  task: Task;
}

export function TaskTableRow({ task }: TaskRowProps) {
  const { formatted, isOverdue } = formatDeadline(task.deadline);
  const isCompleted = task.status === 'Completed';
  const taskUrl = task.url || `/mock/${task.source.toLowerCase()}/${task.id}`;

  return (
    <tr className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${
      isCompleted ? 'bg-slate-50/40 text-slate-500' : ''
    }`}>
      {/* Title and ID */}
      <td className="py-3.5 px-4 max-w-sm sm:max-w-md">
        <div className="flex flex-col">
          <a
            href={taskUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 inline-flex items-center gap-1.5 group"
          >
            <span>{task.title}</span>
            <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-indigo-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              ID: {task.id}
            </span>
            {task.description && (
              <span className="text-xs text-slate-500 line-clamp-1 hidden lg:inline">
                &middot; {task.description}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Assigned Employee */}
      <td className="py-3.5 px-4 text-xs font-medium text-slate-800 whitespace-nowrap">
        {task.employee}
      </td>

      {/* Source System */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <SourceBadge source={task.source} />
      </td>

      {/* Urgency */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <UrgencyBadge urgency={task.urgency} />
      </td>

      {/* Deadline */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className={`h-3.5 w-3.5 ${
            isOverdue && !isCompleted ? 'text-rose-500' : 'text-slate-400'
          }`} />
          <span className={`font-mono ${
            isOverdue && !isCompleted ? 'text-rose-600 font-semibold' : 'text-slate-700'
          }`}>
            {formatted}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <StatusBadge status={task.status} />
      </td>

      {/* Priority Tier */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <PriorityCategoryBadge category={task.priority_category} />
      </td>

      {/* Deep Link Action */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <a
          href={taskUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          aria-label={`Open ${task.source} record ${task.id} in source application`}
        >
          <span>Open {task.source}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </td>
    </tr>
  );
}

export function TaskCard({ task }: TaskRowProps) {
  const { formatted, isOverdue } = formatDeadline(task.deadline);
  const isCompleted = task.status === 'Completed';
  const taskUrl = task.url || `/mock/${task.source.toLowerCase()}/${task.id}`;

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <SourceBadge source={task.source} />
          <span className="text-xs font-mono text-slate-400">#{task.id}</span>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <a
        href={taskUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block font-semibold text-sm text-slate-900 hover:text-indigo-600 leading-snug"
      >
        {task.title}
      </a>

      {task.description && (
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
        <UrgencyBadge urgency={task.urgency} />
        {task.priority_category && (
          <PriorityCategoryBadge category={task.priority_category} />
        )}
      </div>

      <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{task.employee}</span>
        <div className="flex items-center gap-1">
          <Calendar className={`h-3 w-3 ${isOverdue && !isCompleted ? 'text-rose-500' : 'text-slate-400'}`} />
          <span className={isOverdue && !isCompleted ? 'text-rose-600 font-semibold' : ''}>
            {formatted}
          </span>
        </div>
      </div>

      <a
        href={taskUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
      >
        <span>Open in {task.source}</span>
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
