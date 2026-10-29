import React, { useState, useEffect } from 'react';
import { Users, UserPlus, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { User, CreateUserInput, UserRole } from '../types/auth';
import { fetchAdminUsersApi, createAdminUserApi, deactivateAdminUserApi } from '../services/authApi';
import { useAuth } from '../context/AuthContext';

interface AdminUserManagementProps {
  onClose: () => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ onClose }) => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New user form state
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('EMPLOYEE');
  const [newEmployeeName, setNewEmployeeName] = useState<string>('');

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsersApi(token);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!newUsername.trim() || !newEmail.trim() || !newPassword) {
      setError('Username, email, and password are required.');
      return;
    }

    setActionLoading(true);
    try {
      const payload: CreateUserInput = {
        username: newUsername.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        employee_name: newEmployeeName.trim() || undefined,
      };

      await createAdminUserApi(payload, token);
      setSuccessMsg(`User '${newUsername}' provisioned successfully.`);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewEmployeeName('');
      setShowCreateForm(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to deactivate user account '${username}'?`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setActionLoading(true);
    try {
      await deactivateAdminUserApi(userId, token);
      setSuccessMsg(`User '${username}' deactivated successfully.`);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">User &amp; Role Management</h2>
              <p className="text-xs text-slate-500">
                Administrator console &middot; Active user directory and provisioning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Notifications */}
        <div className="px-6 pt-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-2 flex-1 overflow-y-auto space-y-4">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Registered Accounts ({users.length})
            </span>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{showCreateForm ? 'Cancel' : 'Provision User'}</span>
            </button>
          </div>

          {/* Provision Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Provision New Account
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. alexr"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. alex@workflow.local"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Password (min 8 chars) *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Secure password"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Assigned Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="EMPLOYEE">EMPLOYEE (Restricted to assigned tasks)</option>
                    <option value="MANAGER">MANAGER (All tasks &amp; source filters)</option>
                    <option value="ADMIN">ADMIN (Full management &amp; tasks)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-600 mb-1">
                    Mapped Employee Name (from mock feeds, optional)
                  </label>
                  <input
                    type="text"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    placeholder="e.g. Alex Rivera, Sarah Jenkins, Tushar Gupta"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>Save Account</span>
                </button>
              </div>
            </form>
          )}

          {/* User Table */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="text-xs">Loading user registry...</span>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Mapped Employee</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{u.username}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                              u.role === 'ADMIN'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : u.role === 'MANAGER'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {u.employee_name || <span className="text-slate-400 italic">Unassigned</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isSelf ? (
                            <span className="text-[10px] text-slate-400 italic">Current User</span>
                          ) : u.is_active ? (
                            <button
                              onClick={() => handleDeactivate(u.id, u.username)}
                              disabled={actionLoading}
                              className="text-[11px] text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">Deactivated</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
