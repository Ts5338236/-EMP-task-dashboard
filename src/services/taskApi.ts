import { UnifiedTasksResponse, TaskFilterParams } from '../types/task';

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || '';
  if (typeof window !== 'undefined') {
    const isRemote = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isRemote && (configured.includes('localhost') || configured.includes('127.0.0.1'))) {
      return '';
    }
  }
  return configured;
}

const API_BASE = getApiBaseUrl();

export async function fetchTasks(
  params: TaskFilterParams = {},
  signal?: AbortSignal,
  token?: string | null
): Promise<UnifiedTasksResponse> {
  const query = new URLSearchParams();

  if (params.employee && params.employee.trim() && params.employee !== 'All Employees') {
    query.set('employee', params.employee.trim());
  }

  if (params.status && params.status.trim() && params.status !== 'All Statuses') {
    query.set('status', params.status.trim());
  }

  if (params.search && params.search.trim()) {
    query.set('search', params.search.trim());
  }

  const queryString = query.toString();
  const endpoint = `${API_BASE}/api/tasks${queryString ? `?${queryString}` : ''}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
    credentials: 'include',
    signal,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Ignore JSON parse error on non-JSON error pages
    }
    throw new Error(errorDetail);
  }

  const data: UnifiedTasksResponse = await response.json();
  return data;
}
