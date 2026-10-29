import React from 'react';
import { Search, X, Filter, User, Tag } from 'lucide-react';

interface TaskToolbarProps {
  employeeFilter: string;
  setEmployeeFilter: (emp: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  clearEmployeeFilter?: () => void;
  clearStatusFilter?: () => void;
  clearSearch?: () => void;
  employees: string[];
  totalResults: number;
}

export function TaskToolbar({
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
  employees,
  totalResults,
}: TaskToolbarProps) {
  const hasEmployeeFilter = employeeFilter !== 'All Employees';
  const hasStatusFilter = statusFilter !== 'All Statuses';
  const hasSearchFilter = searchQuery.trim().length > 0;
  const hasActiveFilters = hasEmployeeFilter || hasStatusFilter || hasSearchFilter;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, ID, employee, description, or source..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            aria-label="Search tasks"
          />
          {searchQuery && (
            <button
              onClick={() => {
                if (clearSearch) clearSearch();
                else setSearchQuery('');
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Employee Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-hidden cursor-pointer"
              aria-label="Filter by employee"
            >
              <option value="All Employees">All Employees</option>
              {employees.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-hidden cursor-pointer"
              aria-label="Filter by status"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              aria-label="Clear all filters"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips (Individual Clear Actions) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Active:
          </span>
          {hasEmployeeFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span>Employee: {employeeFilter}</span>
              <button
                onClick={() => (clearEmployeeFilter ? clearEmployeeFilter() : setEmployeeFilter('All Employees'))}
                className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded-full cursor-pointer"
                aria-label={`Clear employee filter for ${employeeFilter}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {hasStatusFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span>Status: {statusFilter}</span>
              <button
                onClick={() => (clearStatusFilter ? clearStatusFilter() : setStatusFilter('All Statuses'))}
                className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded-full cursor-pointer"
                aria-label={`Clear status filter for ${statusFilter}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {hasSearchFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span>Search: "{searchQuery}"</span>
              <button
                onClick={() => (clearSearch ? clearSearch() : setSearchQuery(''))}
                className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded-full cursor-pointer"
                aria-label="Clear search term"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Result Count and Ranking Explanation Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <span className="font-medium text-slate-700">
          Showing <span className="font-semibold text-slate-900">{totalResults}</span> tasks
          {hasActiveFilters && ' matching current filters'}
        </span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Ranked deterministically: Overdue &rarr; Due Today &rarr; Due Soon &rarr; Upcoming &rarr; Completed
        </span>
      </div>
    </div>
  );
}
