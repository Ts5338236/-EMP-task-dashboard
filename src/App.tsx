import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { SummaryCards } from './components/SummaryCards';
import { TaskToolbar } from './components/TaskToolbar';
import { TaskTable } from './components/TaskTable';
import { AlertBanner } from './components/AlertBanner';
import { LoadingState } from './components/LoadingState';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { LoginPage } from './components/LoginPage';
import { AdminUserManagement } from './components/AdminUserManagement';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTasks } from './hooks/useTasks';
import { calculateSummaryCounts } from './utils/taskDisplay';

function DashboardView() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [dismissedWarnings, setDismissedWarnings] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);

  const {
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
  } = useTasks();

  // Summary counts calculated accurately from loaded task data
  const summaryCounts = calculateSummaryCounts(tasks);

  const hasActiveFilters =
    employeeFilter !== 'All Employees' ||
    statusFilter !== 'All Statuses' ||
    searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-row antialiased text-slate-800">
      {/* WorkFlow Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        totalTaskCount={tasks.length}
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <DashboardHeader
          onRefresh={refresh}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenAdmin={() => setAdminModalOpen(true)}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Summary KPI Cards */}
          <SummaryCards
            counts={summaryCounts}
            selectedStatus={statusFilter}
            onSelectStatus={(status) => {
              if (status === 'Overdue') {
                setSearchQuery(searchQuery.toLowerCase() === 'overdue' ? '' : 'Overdue');
              } else {
                setStatusFilter(statusFilter === status ? 'All Statuses' : status);
                if (searchQuery.toLowerCase() === 'overdue') {
                  setSearchQuery('');
                }
              }
            }}
            loading={loading}
            isOverdueSelected={searchQuery.toLowerCase() === 'overdue'}
          />

          {/* Background Refresh Failure Notice */}
          {refreshError && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-900 flex items-center justify-between text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Refresh Notice:</strong> {refreshError}
                </span>
              </div>
              <button
                onClick={dismissRefreshError}
                className="text-amber-700 hover:text-amber-950 p-1 rounded-md cursor-pointer"
                aria-label="Dismiss refresh alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Partial Source System Warning Alert Banner */}
          {!dismissedWarnings && warnings.length > 0 && (
            <AlertBanner
              warnings={warnings}
              onDismiss={() => setDismissedWarnings(true)}
            />
          )}

          {/* Task Filtering & Search Toolbar */}
          <TaskToolbar
            employeeFilter={employeeFilter}
            setEmployeeFilter={setEmployeeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            clearFilters={clearFilters}
            clearEmployeeFilter={clearEmployeeFilter}
            clearStatusFilter={clearStatusFilter}
            clearSearch={clearSearch}
            employees={allEmployees}
            totalResults={tasks.length}
          />

          {/* Primary View Area */}
          <section aria-label="Prioritized Tasks">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState
                message={error}
                onRetry={refresh}
                retrying={refreshing}
              />
            ) : tasks.length === 0 ? (
              <EmptyState
                searchQuery={searchQuery}
                hasFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />
            ) : (
              <TaskTable tasks={tasks} />
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
          WorkFlow Enterprise Task Management &middot; Real-time Prioritization from CRM &amp; Helpdesk APIs
        </footer>
      </div>

      {/* Admin User Management Modal */}
      {adminModalOpen && (
        <AdminUserManagement onClose={() => setAdminModalOpen(false)} />
      )}
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-xs uppercase tracking-widest font-semibold text-slate-400">
          Verifying security session...
        </span>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <DashboardView />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
