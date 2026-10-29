import React from 'react';
import { RefreshCw, Menu, Clock, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardHeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
  lastUpdated: Date | null;
  onOpenMobileMenu: () => void;
  onOpenAdmin?: () => void;
}

export function DashboardHeader({
  onRefresh,
  refreshing,
  lastUpdated,
  onOpenMobileMenu,
  onOpenAdmin,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
            aria-label="Open sidebar menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Employee Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Consolidated, deadline-prioritized work items from CRM and Helpdesk APIs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {formattedTime && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80 font-mono">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Updated {formattedTime}</span>
            </div>
          )}

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer focus:outline-hidden"
            aria-label="Refresh tasks feed"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* User Profile and Role Badge */}
          {user && (
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">
                  {user.username.slice(0, 2)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.employee_name || user.username}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold tracking-wider uppercase border ${
                        user.role === 'ADMIN'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : user.role === 'MANAGER'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin console button */}
              {user.role === 'ADMIN' && onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                  title="Admin User Management"
                  aria-label="Open User Management"
                >
                  <Shield className="h-4 w-4" />
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
