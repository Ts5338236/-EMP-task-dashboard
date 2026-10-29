import { Task, SummaryCounts } from '../types/task';

export function calculateSummaryCounts(tasks: Task[]): SummaryCounts {
  const now = new Date();

  let overdue = 0;
  let inProgress = 0;
  let completed = 0;

  for (const task of tasks) {
    if (task.status === 'Completed') {
      completed++;
    } else {
      if (task.status === 'In Progress') {
        inProgress++;
      }
      // Check overdue: must not be completed, must have a deadline, and deadline < now
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        if (!isNaN(deadlineDate.getTime()) && deadlineDate < now) {
          overdue++;
        }
      }
    }
  }

  return {
    total: tasks.length,
    overdue,
    inProgress,
    completed,
  };
}

export function formatDeadline(deadlineStr: string | null): {
  formatted: string;
  isOverdue: boolean;
  isToday: boolean;
} {
  if (!deadlineStr) {
    return { formatted: 'No deadline', isOverdue: false, isToday: false };
  }

  const date = new Date(deadlineStr);
  if (isNaN(date.getTime())) {
    return { formatted: 'Invalid date', isOverdue: false, isToday: false };
  }

  const now = new Date();
  const isOverdue = date < now;

  // Format month and day
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });

  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  let label = `${formattedDate}, ${formattedTime}`;
  if (isToday) {
    label = `Today, ${formattedTime}`;
  }

  return {
    formatted: label,
    isOverdue,
    isToday,
  };
}
