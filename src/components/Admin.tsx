import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, Users, Trash2, ArrowUpRight, CheckCircle } from "lucide-react";
import { UserRole } from "../types";

export const Admin: React.FC = () => {
  const { users, profile, updateUserRole } = useAuth();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleRoleChange = async (targetUid: string, targetName: string, newRole: UserRole) => {
    setError("");
    setSuccess("");

    if (profile?.uid === targetUid) {
      setError("You cannot change your own role from this panel to avoid locking yourself out. Please use the simulator or profile settings.");
      return;
    }

    try {
      await updateUserRole(targetUid, newRole);
      setSuccess(`User "${targetName}" upgraded to ${newRole} role successfully!`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update user role due to security restrictions.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm font-medium">
          {success}
        </div>
      )}

      {/* Overview Block */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-6 -mt-6" />
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 text-rose-400 border border-white/10 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white">System Administration Dashboard</h3>
            <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
              As an authorized Admin, you have global directory visibility. You can manage system-wide role-based access controls (RBAC) to delegate project managers or audit developer permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <Users className="w-5 h-5 text-indigo-600" />
          <h4 className="font-display font-bold text-slate-800 text-sm">System Users Directory ({users.length})</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 font-mono font-semibold">
                <th className="p-4 pl-6">Display Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">User UID</th>
                <th className="p-4">Role Delegation</th>
                <th className="p-4 pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrentUser = profile?.uid === u.uid;
                return (
                  <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-slate-800">{u.name} {isCurrentUser && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded ml-1.5 font-mono font-bold uppercase border border-indigo-100">You</span>}</td>
                    <td className="p-4 text-slate-500 font-mono">{u.email}</td>
                    <td className="p-4 text-slate-400 font-mono">{u.uid.substring(0, 12)}...</td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.uid, u.name, e.target.value as UserRole)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg focus:outline-none text-xs font-semibold"
                        disabled={isCurrentUser}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Developer">Developer</option>
                      </select>
                    </td>
                    <td className="p-4 pr-6">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold px-2 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        Active Profile
                      </span>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    No system users available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
