"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/lib/auth-context";
import { getAdminUsersApi, updateUserRoleApi, toggleUserStatusApi } from "@/lib/api";
import {
  ShieldCheck,
  Users,
  UserCheck,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldAlert,
} from "lucide-react";

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getAdminUsersApi();
      setUsers(data);
    } catch (err) {
      setError(err.message || "Failed to load platform users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateUserRoleApi(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setSuccess(`Role updated to '${newRole}' successfully.`);
    } catch (err) {
      setError(err.message || "Failed to update user role.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (userId, currentActive) => {
    setActionLoading(userId);
    setError(null);
    setSuccess(null);

    try {
      const updated = await toggleUserStatusApi(userId, !currentActive);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setSuccess(`Account status ${!currentActive ? "activated" : "deactivated"} successfully.`);
    } catch (err) {
      setError(err.message || "Failed to toggle account status.");
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#176B5B]/30 border-t-[#176B5B] rounded-full animate-spin" />
      </div>
    );
  }

  // Permission Guard for non-admins
  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          title="Access Restricted"
          subtitle="Administrator permissions are required to access this console."
        />
        <div className="p-6 max-w-2xl mx-auto mt-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#202A28]">
            Administrator Privileges Required
          </h2>
          <p className="text-sm text-[#6B7773] mt-2 leading-relaxed">
            Your current account session is registered with role:{" "}
            <span className="font-semibold text-[#176B5B] uppercase">{user?.role || "GUEST"}</span>.
            Managing system credentials, lake zones, and platform permissions requires an Administrator account.
          </p>
          <div className="mt-6 p-4 rounded-xl bg-white border border-[#E4EAE7] text-xs text-left space-y-2 text-[#6B7773]">
            <p className="font-semibold text-[#202A28]">How to access Administrator functions:</p>
            <p>1. Run the safe setup script in your project backend: <code>python -m backend.scripts.create_admin</code></p>
            <p>2. Sign out of your current session and log in using your administrator credentials.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const operatorCount = users.filter((u) => u.role === "operator").length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Admin Console & User Permissions"
        subtitle="Manage operators, researchers, security roles, and platform access"
        actionButton={
          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4EAE7] bg-white text-xs font-semibold text-[#202A28] hover:bg-[#F7F9F8] shadow-2xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[#E4EAE7] p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#6B7773] text-xs mb-1">
              <span>Total Registered</span>
              <Users className="w-4 h-4 text-[#176B5B]" />
            </div>
            <div className="text-2xl font-bold text-[#202A28]">{totalUsers}</div>
            <div className="text-[11px] text-[#6B7773] mt-1">Platform specialists</div>
          </div>

          <div className="bg-white rounded-xl border border-[#E4EAE7] p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#6B7773] text-xs mb-1">
              <span>Administrators</span>
              <ShieldCheck className="w-4 h-4 text-[#176B5B]" />
            </div>
            <div className="text-2xl font-bold text-[#176B5B]">{adminCount}</div>
            <div className="text-[11px] text-[#6B7773] mt-1">Full control privileges</div>
          </div>

          <div className="bg-white rounded-xl border border-[#E4EAE7] p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#6B7773] text-xs mb-1">
              <span>Operators & Researchers</span>
              <UserCheck className="w-4 h-4 text-[#247A52]" />
            </div>
            <div className="text-2xl font-bold text-[#247A52]">{operatorCount}</div>
            <div className="text-[11px] text-[#6B7773] mt-1">Simulation & field planning</div>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Users Table Card */}
        <div className="bg-white rounded-xl border border-[#E4EAE7] shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E4EAE7] flex items-center justify-between bg-[#FCFDFD]">
            <div>
              <h2 className="text-sm font-bold text-[#202A28]">Registered Users & Roles</h2>
              <p className="text-xs text-[#6B7773] mt-0.5">
                Enforced by backend role verification and Row Level Security.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#6B7773]">
              <div className="w-6 h-6 border-2 border-[#176B5B]/30 border-t-[#176B5B] rounded-full animate-spin mx-auto mb-2" />
              Loading user credentials...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#6B7773]">
              No users registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9F8] text-[#6B7773] border-b border-[#E4EAE7]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Registered</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE7]">
                  {users.map((u) => {
                    const isSelf = u.id === user?.id;
                    const isPending = actionLoading === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-[#F9FBFA] transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#202A28] flex items-center gap-2">
                            <span>{u.display_name}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#6B7773]">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              u.role === "admin"
                                ? "bg-[#EAF5F2] text-[#176B5B] border border-[#CDE5DE]"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {u.role === "admin" ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            <span className="capitalize">{u.role}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                              u.is_active ? "bg-[#247A52]" : "bg-red-400"
                            }`}
                          />
                          <span className="text-[#6B7773]">{u.is_active ? "Active" : "Inactive"}</span>
                        </td>
                        <td className="py-3 px-4 text-[#6B7773]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Demo"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Role Switcher */}
                            <select
                              value={u.role}
                              disabled={isPending}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="text-xs bg-white border border-[#D5DFDC] rounded-lg px-2 py-1 text-[#202A28] focus:border-[#176B5B] outline-hidden cursor-pointer disabled:opacity-50"
                            >
                              <option value="operator">Operator</option>
                              <option value="admin">Administrator</option>
                              <option value="guest">Guest</option>
                            </select>

                            {/* Active Toggle */}
                            {!isSelf && (
                              <button
                                onClick={() => handleStatusToggle(u.id, u.is_active)}
                                disabled={isPending}
                                className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition ${
                                  u.is_active
                                    ? "border-red-200 text-red-600 hover:bg-red-50"
                                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {u.is_active ? "Deactivate" : "Activate"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
