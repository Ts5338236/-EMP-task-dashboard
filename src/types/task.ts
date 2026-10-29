export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskUrgency = 'Urgent' | 'High' | 'Medium' | 'Low';
export type TaskSource = 'CRM' | 'Helpdesk';
export type PriorityCategory = 'Overdue' | 'Due Today' | 'Due Soon' | 'Upcoming' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  employee: string;
  status: TaskStatus;
  deadline: string | null;
  urgency: TaskUrgency;
  source: TaskSource;
  url: string;
  priority_category?: PriorityCategory;
  priority_rank?: number;
  is_overdue?: boolean;
  hours_until_deadline?: number | null;
}

export interface SourceStatus {
  status: 'success' | 'unavailable' | 'error';
  task_count: number;
}

export interface UnifiedTasksResponse {
  tasks: Task[];
  sources: {
    crm?: SourceStatus;
    helpdesk?: SourceStatus;
    [key: string]: SourceStatus | undefined;
  };
  warnings: string[];
  total: number;
}

export interface TaskFilterParams {
  employee?: string;
  status?: string;
  search?: string;
  simulate_crm_error?: boolean;
  simulate_helpdesk_error?: boolean;
}

export interface SummaryCounts {
  total: number;
  overdue: number;
  inProgress: number;
  completed: number;
}
