import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Workflow, 
  X,
  Server,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  totalTaskCount: number;
  onOpenAdmin?: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  totalTaskCount,
  onOpenAdmin,
}: SidebarProps) {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'all-tasks', label: 'All Tasks', icon: CheckSquare, count: totalTaskCount },
    { id: 'employees', label: 'Employees', icon: Users },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ id: 'admin-users', label: 'User Directory', icon: Shield });
  }

  const renderNavList = () => (
    <nav className="flex-1 px-3 py-6 space-y-1">
      <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Workspaces
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'admin-users' && onOpenAdmin) {
                onOpenAdmin();
              } else {
                setActiveTab(item.id);
              }
              setMobileOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </div>
            {item.count !== undefined && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const renderFooter = () => (
    <div className="p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-300 flex items-center gap-1.5">
          <Server className="h-3.5 w-3.5 text-emerald-400" />
          Backend Sync
        </span>
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Aggregating live feeds from CRM &amp; Helpdesk REST endpoints.
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0">
        <div className="flex flex-col h-full bg-slate-900 text-slate-200 w-64 border-r border-slate-800">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
                <Workflow className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white">WorkFlow</span>
                <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Enterprise Desk</span>
              </div>
            </div>
          </div>
          {renderNavList()}
          {renderFooter()}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" data-testid="mobile-drawer">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full shadow-2xl z-10 bg-slate-900 text-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-lg tracking-tight text-white">WorkFlow</span>
                  <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Enterprise Desk</span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavList()}
            {renderFooter()}
          </div>
        </div>
      )}
    </>
  );
}
