import React from 'react';
import { Task } from '../types/task';
import { TaskTableRow, TaskCard } from './TaskRow';

interface TaskTableProps {
  tasks: Task[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th scope="col" className="py-3 px-4">Task &amp; Details</th>
              <th scope="col" className="py-3 px-4">Employee</th>
              <th scope="col" className="py-3 px-4">Source</th>
              <th scope="col" className="py-3 px-4">Urgency</th>
              <th scope="col" className="py-3 px-4">Deadline (UTC)</th>
              <th scope="col" className="py-3 px-4">Status</th>
              <th scope="col" className="py-3 px-4">Priority Tier</th>
              <th scope="col" className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <TaskTableRow key={`${task.source}-${task.id}`} task={task} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout View */}
      <div className="md:hidden p-4 space-y-3">
        {tasks.map((task) => (
          <TaskCard key={`${task.source}-${task.id}`} task={task} />
        ))}
      </div>
    </div>
  );
}
