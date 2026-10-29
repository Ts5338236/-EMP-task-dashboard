import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskFilterParams, UnifiedTasksResponse } from '../types/task';
import { fetchTasks } from '../services/taskApi';

function getInitialFiltersFromURL() {
  if (typeof window === 'undefined') {
    return { employee: 'All Employees', status: 'All Statuses', search: '' };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    employee: params.get('employee') || 'All Employees',
    status: params.get('status') || 'All Statuses',
    search: params.get('search') || '',
  };
}

export function useTasks() {
  const initial = getInitialFiltersFromURL();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [sources, setSources] = useState<UnifiedTasksResponse['sources']>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter state initialized from URL if available
  const [employeeFilter, setEmployeeFilter] = useState<string>(initial.employee);
  const [statusFilter, setStatusFilter] = useState<string>(initial.status);
  const [searchQuery, setSearchQuery] = useState<string>(initial.search);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initial.search);

  // Debounce search by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Synchronize state to URL query parameters
  useEffect(() => {
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const url = new URL(window.location.href);
      if (employeeFilter && employeeFilter !== 'All Employees') {
        url.searchParams.set('employee', employeeFilter);
      } else {
        url.searchParams.delete('employee');
      }

      if (statusFilter && statusFilter !== 'All Statuses') {
        url.searchParams.set('status', statusFilter);
      } else {
        url.searchParams.delete('status');
      }

      if (debouncedSearch && debouncedSearch.trim()) {
        url.searchParams.set('search', debouncedSearch.trim());
      } else {
        url.searchParams.delete('search');
      }

      window.history.replaceState({}, '', url.toString());
    }
  }, [employeeFilter, statusFilter, debouncedSearch]);

  // Keep track of active AbortController to cancel stale in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadTasks = useCallback(async (isRefresh = false) => {
    // Cancel any active obsolete request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (isRefresh) {
      setRefreshing(true);
      setRefreshError(null);
    } else {
      setLoading(true);
      setError(null);
    }

    const params: TaskFilterParams = {
      employee: employeeFilter,
      status: statusFilter,
      search: debouncedSearch,
    };

    try {
      const response = await fetchTasks(params, controller.signal);
      setTasks(response.tasks || []);
      setSources(response.sources || {});
      setWarnings(response.warnings || []);
      setLastUpdated(new Date());
      setRefreshError(null);
      setError(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        if (isRefresh) {
          // On refresh failure: preserve previously loaded data, show toast/banner, do NOT update lastUpdated
          setRefreshError(err.message || 'Background sync failed. Previously loaded data retained.');
        } else {
          setError(err.message || 'Failed to load tasks from server.');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employeeFilter, statusFilter, debouncedSearch]);

  // Trigger load when filters change
  useEffect(() => {
    loadTasks(false);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadTasks]);

  const refresh = useCallback(() => {
    if (!refreshing) {
      loadTasks(true);
    }
  }, [loadTasks, refreshing]);

  const clearFilters = useCallback(() => {
    setEmployeeFilter('All Employees');
    setStatusFilter('All Statuses');
    setSearchQuery('');
    setDebouncedSearch('');
  }, []);

  const clearEmployeeFilter = useCallback(() => {
    setEmployeeFilter('All Employees');
  }, []);

  const clearStatusFilter = useCallback(() => {
    setStatusFilter('All Statuses');
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearch('');
  }, []);

  const dismissRefreshError = useCallback(() => {
    setRefreshError(null);
  }, []);

  // Compute distinct employee list across all known tasks for the filter dropdown
  const [allEmployees, setAllEmployees] = useState<string[]>([]);
  useEffect(() => {
    if (tasks.length > 0) {
      setAllEmployees(prev => {
        const set = new Set([...prev, ...tasks.map(t => t.employee)]);
        return Array.from(set).sort();
      });
    }
  }, [tasks]);

  return {
    tasks,
    sources,
    warnings,
    loading,
    refreshing,
    error,
    refreshError,
    dismissRefreshError,
    lastUpdated,
    employeeFilter,
    setEmployeeFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    clearFilters,
    clearEmployeeFilter,
    clearStatusFilter,
    clearSearch,
    refresh,
    allEmployees,
  };
}
