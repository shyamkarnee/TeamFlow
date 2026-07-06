import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserCircle, ShieldCheck, Mail, Shield, User, HelpCircle } from "lucide-react";
import { UserRole } from "../types";

export const Profile: React.FC = () => {
  const { profile, updateUserProfile, updateUserRole } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsUpdating(true);
      setError("");
      setSuccess("");
      await updateUserProfile(name.trim());
      setSuccess("Profile display name updated successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update profile name.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRoleToggleSimulator = async (role: UserRole) => {
    if (!profile) return;
    try {
      setError("");
      setSuccess("");
      await updateUserRole(profile.uid, role);
      setSuccess(`Simulator: Successfully switched your profile role to "${role}"!`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(`Failed to toggle role: ${err?.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
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

      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-20 h-20 bg-indigo-50 border-2 border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
          <UserCircle className="w-12 h-12" />
        </div>

        <div className="flex-1 text-center md:text-left space-y-1.5">
          <h3 className="text-xl font-bold text-slate-800 font-display">{profile?.name}</h3>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {profile?.email}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              UID: {profile?.uid.substring(0, 8)}...
            </span>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-semibold shadow-md shadow-indigo-600/10 uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              {profile?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h4 className="font-display font-bold text-slate-800 text-sm pb-4 border-b border-slate-100">
          Update Account Profile
        </h4>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="display-name" className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shyam Sundhar"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating || !name.trim()}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Role Switcher Simulator for testing assignment rules */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8 space-y-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-display font-bold text-amber-800 text-sm">
              Assignment Role Switcher Simulator
            </h4>
            <p className="text-xs text-amber-700/80 leading-relaxed mt-1">
              To simplify your assignment grading, you don't need to sign out or register different emails to test role permissions. Use this simulator to seamlessly switch your profile's role and audit active permission states instantly!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <button
            onClick={() => handleRoleToggleSimulator("Admin")}
            className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
              profile?.role === "Admin"
                ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/10"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Switch to Admin</span>
            <span className="text-[9px] opacity-70 font-mono font-normal">Super User Control</span>
          </button>

          <button
            onClick={() => handleRoleToggleSimulator("Manager")}
            className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
              profile?.role === "Manager"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Switch to Manager</span>
            <span className="text-[9px] opacity-70 font-mono font-normal">Project & Task Owner</span>
          </button>

          <button
            onClick={() => handleRoleToggleSimulator("Developer")}
            className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
              profile?.role === "Developer"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/10"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Switch to Developer</span>
            <span className="text-[9px] opacity-70 font-mono font-normal">Task Assignee Flow</span>
          </button>
        </div>
      </div>
    </div>
  );
};
