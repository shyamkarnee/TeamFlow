import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { createIncident, updateIncidentStatus, deleteIncident } from "../lib/services";
import { Incident, IncidentStatus } from "../types";
import { 
  AlertTriangle, 
  PlusSquare, 
  Clock, 
  CheckCircle, 
  Trash2, 
  User, 
  ShieldAlert,
  Archive,
  Info
} from "lucide-react";

export const Incidents: React.FC = () => {
  const { profile, users } = useAuth();
  const { projects, incidents } = useData();

  // Filter project incidents
  const [projectIdFilter, setProjectIdFilter] = useState<string>("all");

  // Form State
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeProject = projects.find((p) => p.id === projectId);
  const isManagerOrAdmin = profile?.role === "Manager" || profile?.role === "Admin";

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!projectId || !title.trim() || !description.trim() || !assignedTo) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createIncident(
        projectId,
        activeProject?.name || "Project",
        title.trim(),
        description.trim(),
        profile?.uid || "",
        assignedTo
      );

      setSuccess(`Incident "${title}" logged and team notified successfully!`);
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to log incident due to access rules.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (incident: Incident, newStatus: IncidentStatus) => {
    setError("");
    setSuccess("");

    try {
      const proj = projects.find((p) => p.id === incident.projectId);
      await updateIncidentStatus(
        incident.projectId,
        proj?.name || "",
        incident,
        newStatus,
        incident.assignedTo
      );
      setSuccess(`Incident status updated to "${newStatus}"!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to update status. Check permissions.");
    }
  };

  const handleAssigneeChange = async (incident: Incident, newAssignee: string) => {
    setError("");
    setSuccess("");

    try {
      const proj = projects.find((p) => p.id === incident.projectId);
      await updateIncidentStatus(
        incident.projectId,
        proj?.name || "",
        incident,
        incident.status,
        newAssignee
      );
      setSuccess("Incident assigned to developer successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to update assignee.");
    }
  };

  const handleDeleteIncident = async (projectId: string, incidentId: string) => {
    if (!window.confirm("Are you sure you want to delete this incident report?")) {
      return;
    }

    try {
      await deleteIncident(projectId, incidentId);
      setSuccess("Incident log deleted successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to delete incident log.");
    }
  };

  const getUserName = (uid: string) => {
    const found = users.find((u) => u.uid === uid);
    return found ? found.name : "Unknown User";
  };

  const getProjectName = (projId: string) => {
    const found = projects.find((p) => p.id === projId);
    return found ? found.name : "Unknown Project";
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case "Open":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Closed":
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // Filtered list
  const filteredIncidents = incidents.filter(
    (inc) => projectIdFilter === "all" || inc.projectId === projectIdFilter
  );

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
        
        {/* Report New Incident Panel (Anyone logged in can create) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <PlusSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="font-display font-bold text-slate-800 text-sm">Report Blocker Incident</h3>
            </div>

            <form onSubmit={handleReportIncident} className="space-y-4">
              {/* Select Project */}
              <div>
                <label htmlFor="inc-proj-select" className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                  Project Blocker
                </label>
                <select
                  id="inc-proj-select"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800"
                  required
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="inc-title" className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                  Incident Summary
                </label>
                <input
                  id="inc-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Database API keys are expired"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  maxLength={150}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="inc-desc" className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                  Detailed Description
                </label>
                <textarea
                  id="inc-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is the blocker? How can we reproduce or solve this incident?"
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed resize-none"
                  maxLength={1000}
                  required
                />
              </div>

              {/* Assigned To (for handling the fix) */}
              <div>
                <label htmlFor="inc-assigned" className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                  Assign Incident Handler
                </label>
                <select
                  id="inc-assigned"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800"
                  required
                >
                  <option value="">Select developer...</option>
                  {/* List project members or managers */}
                  {projectId && activeProject ? (
                    users
                      .filter(u => activeProject.members?.includes(u.uid) || u.uid === activeProject.managerId)
                      .map((u) => (
                        <option key={u.uid} value={u.uid}>{u.name} ({u.role})</option>
                      ))
                  ) : (
                    users.map((u) => (
                      <option key={u.uid} value={u.uid}>{u.name} ({u.role})</option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Log Incident
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Incidents List Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-indigo-600" />
              <h3 className="font-display font-bold text-slate-800 text-sm">Logged Incidents ({filteredIncidents.length})</h3>
            </div>

            <select
              value={projectIdFilter}
              onChange={(e) => setProjectIdFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none font-semibold text-slate-700"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Incidents Cards List */}
          <div className="space-y-4">
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((inc) => {
                const canModify = profile?.role === "Admin" || 
                                  inc.assignedTo === profile?.uid || 
                                  projects.find(p => p.id === inc.projectId)?.managerId === profile?.uid;
                
                const isClosed = inc.status === "Closed";

                return (
                  <div 
                    key={inc.id} 
                    className={`bg-white rounded-2xl border border-slate-100/80 p-6 shadow-sm shadow-slate-100/40 flex flex-col hover:shadow-lg hover:shadow-rose-500/5 hover:-translate-y-0.5 transition-all duration-300 relative ${
                      isClosed ? "opacity-75 bg-slate-50/50" : "border-l-4 border-l-amber-500"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-display font-bold text-slate-800 text-sm leading-tight">
                            {inc.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border uppercase tracking-wider ${getStatusBadge(inc.status)}`}>
                            {inc.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-indigo-600 font-mono font-bold mt-1.5">
                          PROJECT: {getProjectName(inc.projectId)}
                        </p>
                      </div>

                      {isManagerOrAdmin && (
                        <button
                          onClick={() => handleDeleteIncident(inc.projectId, inc.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors duration-200"
                          title="Delete incident log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 whitespace-pre-wrap">
                      {inc.description}
                    </p>

                    {/* Metadata Footer */}
                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-slate-100 text-[10px] text-slate-400 font-mono">
                      <div>
                        <p className="font-bold text-slate-400 uppercase tracking-wide">REPORTED BY:</p>
                        <p className="text-slate-700 font-sans font-semibold mt-0.5">{getUserName(inc.reportedBy)}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 uppercase tracking-wide">ASSIGNED HANDLER:</p>
                        {isClosed || !canModify ? (
                          <p className="text-slate-700 font-sans font-semibold mt-0.5">{getUserName(inc.assignedTo)}</p>
                        ) : (
                          <select
                            value={inc.assignedTo}
                            onChange={(e) => handleAssigneeChange(inc, e.target.value)}
                            className="text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/20 mt-1 cursor-pointer font-sans font-medium"
                          >
                            {users.map((u) => (
                              <option key={u.uid} value={u.uid}>{u.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Incident Status Transitions (Authorized users, unlocked unless Closed) */}
                    {canModify && !isClosed && (
                      <div className="mt-4 pt-2 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Transition:</span>
                        
                        {inc.status === "Open" && (
                          <button
                            onClick={() => handleStatusChange(inc, "In Progress")}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-sm shadow-amber-500/10 transition-colors duration-200"
                          >
                            Mark In Progress
                          </button>
                        )}

                        {inc.status === "In Progress" && (
                          <button
                            onClick={() => handleStatusChange(inc, "Resolved")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-sm shadow-emerald-500/10 transition-colors duration-200"
                          >
                            Mark Resolved
                          </button>
                        )}

                        {inc.status === "Resolved" && isManagerOrAdmin && (
                          <button
                            onClick={() => handleStatusChange(inc, "Closed")}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-sm transition-colors duration-200"
                          >
                            Close Incident (Lock)
                          </button>
                        )}

                        {inc.status === "Resolved" && !isManagerOrAdmin && (
                          <span className="text-[10px] text-slate-400 italic font-medium">Awaiting Manager closure...</span>
                        )}
                      </div>
                    )}

                    {isClosed && (
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono italic">
                        <Archive className="w-3.5 h-3.5 text-slate-400" />
                        <span>Closed incident logs are locked for integrity assurance.</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
                <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold">No Incidents Reported</p>
                <p className="text-xs text-slate-400 mt-1">
                  Everything is functioning perfectly. Click the Left form to report any project blocking incidents.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
