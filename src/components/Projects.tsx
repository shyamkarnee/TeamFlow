import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { createProject, deleteProject } from "../lib/services";
import { 
  FolderPlus, 
  Trash2, 
  Users, 
  FolderDot, 
  User, 
  FolderLock,
  X,
  Plus
} from "lucide-react";

export const Projects: React.FC = () => {
  const { profile, users } = useAuth();
  const { projects, tasks, incidents } = useData();

  // Create Project Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Checks for permissions
  const isManagerOrAdmin = profile?.role === "Manager" || profile?.role === "Admin";

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !description.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    // Business Rule: Project names must be unique
    const isNameTaken = projects.some(
      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (isNameTaken) {
      setError("A project with this name already exists. Project names must be unique.");
      return;
    }

    if (!profile) return;

    try {
      setIsCreating(true);
      // Create project with current user as manager (or if admin, current user)
      // Managers assign tasks, but the creator manager remains the owner
      await createProject(
        name.trim(),
        description.trim(),
        profile.uid,
        selectedMembers
      );

      setSuccess(`Project "${name}" created successfully!`);
      setName("");
      setDescription("");
      setSelectedMembers([]);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to create project due to security rules.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (projectId: string, projName: string) => {
    if (!window.confirm(`Are you sure you want to delete the project "${projName}"? This action is permanent.`)) {
      return;
    }

    try {
      await deleteProject(projectId);
      setSuccess("Project deleted successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Permission Denied. Only managers of this project can delete it.");
      setTimeout(() => setError(""), 4000);
    }
  };

  const getUserName = (uid: string) => {
    const found = users.find(u => u.uid === uid);
    return found ? found.name : "Unknown User";
  };

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Project Creation Form (Authorized users only) */}
        <div className="lg:col-span-1">
          {isManagerOrAdmin ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-display font-bold text-slate-800 text-sm">Create New Project</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Project Name */}
                <div>
                  <label htmlFor="proj-name" className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                    Project Name
                  </label>
                  <input
                    id="proj-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apollo Engine rewrite"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                    maxLength={100}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="proj-desc" className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                    Description
                  </label>
                  <textarea
                    id="proj-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What are the goals, deadlines, or constraints for this project?"
                    rows={4}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 leading-relaxed resize-none"
                    maxLength={1000}
                    required
                  />
                </div>

                {/* Select Members Multi-select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                    Assign Project Members
                  </label>
                  <p className="text-[10px] text-slate-400 mb-3 leading-tight">
                    Select team members who can access and submit tasks to this project.
                  </p>
                  
                  <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2">
                    {users.map((u) => (
                      <label 
                        key={u.uid} 
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                          selectedMembers.includes(u.uid)
                            ? "bg-indigo-50 border border-indigo-100"
                            : "hover:bg-slate-100 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(u.uid)}
                          onChange={() => handleMemberToggle(u.uid)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                        />
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-800 leading-none">{u.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{u.role} ({u.email})</p>
                        </div>
                      </label>
                    ))}
                    {users.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No registered system users.</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Project
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
              <FolderLock className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700">Creation Restricted</p>
              <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-relaxed">
                Only Managers or Admins can initialize new projects. Developers can view projects they are assigned to.
              </p>
            </div>
          )}
        </div>

        {/* Project Lists Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2.5">
            <FolderDot className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display font-bold text-slate-800 text-sm">Active Projects ({projects.length})</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.length > 0 ? (
              projects.map((proj) => {
                const projTasks = tasks.filter(t => t.projectId === proj.id);
                const complTasks = projTasks.filter(t => t.status === "Completed").length;
                const activeIncidents = incidents.filter(i => i.projectId === proj.id && i.status !== "Closed" && i.status !== "Resolved").length;
                const canDelete = profile?.role === "Admin" || proj.managerId === profile?.uid;

                return (
                  <div 
                    key={proj.id} 
                    className="bg-white rounded-2xl border border-slate-100/80 shadow-sm shadow-slate-100/40 p-6 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col relative group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h4 className="font-display font-bold text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition-colors duration-200">
                          {proj.name}
                        </h4>
                        <div className="flex items-center gap-1 mt-1.5 text-slate-400 text-[10px] font-mono">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Manager: <span className="text-slate-600 font-semibold">{getUserName(proj.managerId)}</span></span>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDelete(proj.id, proj.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors duration-200"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-relaxed flex-1 my-3">
                      {proj.description}
                    </p>

                    {/* Stats bar */}
                    <div className="space-y-2 pt-4 border-t border-slate-50">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-500 font-medium">{proj.members?.length || 1} assigned members</span>
                        </span>
                        <span className="font-bold font-mono text-indigo-600">
                          {complTasks}/{projTasks.length} tasks
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500 shadow-sm"
                          style={{ 
                            width: `${projTasks.length > 0 ? (complTasks / projTasks.length) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Footer indicators */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 text-[10px]">
                      <span className="text-slate-400 font-mono">
                        Started {proj.createdAt?.seconds ? new Date(proj.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                      </span>
                      {activeIncidents > 0 && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 font-bold rounded-lg flex items-center gap-1 font-mono animate-pulse shadow-sm shadow-rose-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {activeIncidents} active blockers
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
                <FolderLock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold">No Projects Created Yet</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  As an Admin or Manager, you can create a project to start planning deliverables and assigning tasks.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
