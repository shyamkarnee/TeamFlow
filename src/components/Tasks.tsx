import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { createTask, updateTaskStatus, deleteTask } from "../lib/services";
import { Task, TaskStatus, Project } from "../types";
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  CornerDownRight, 
  User, 
  Check, 
  X,
  PlusSquare,
  ClipboardList
} from "lucide-react";

export const Tasks: React.FC = () => {
  const { profile, users } = useAuth();
  const { projects, tasks } = useData();

  // Active Selected Project
  const [activeProjectId, setActiveProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : ""
  );

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [initialStatus, setInitialStatus] = useState<TaskStatus>("To Do");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Review Comment Form State
  const [rejectionTaskId, setRejectionTaskId] = useState<string | null>(null);
  const [rejectionComment, setRejectionComment] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const projectTasks = tasks.filter((t) => t.projectId === activeProjectId);

  const isManagerOrAdmin = profile?.role === "Manager" || profile?.role === "Admin";

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!activeProjectId) {
      setError("Please select a project first.");
      return;
    }
    if (!title.trim() || !description.trim() || !assignedTo) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createTask(
        activeProjectId,
        activeProject?.name || "Project",
        title.trim(),
        description.trim(),
        assignedTo,
        dependencies,
        initialStatus
      );

      setSuccess("Task successfully created!");
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDependencies([]);
      setInitialStatus("To Do");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to create task due to security rule bounds.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await deleteTask(activeProjectId, taskId);
      setSuccess("Task deleted successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Permission Denied. Only project managers can delete tasks.");
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleStatusTransition = async (task: Task, newStatus: TaskStatus) => {
    setError("");
    setSuccess("");

    // If rejecting, check if rejectionComment is typed
    if (task.status === "Review" && newStatus === "In Progress" && !rejectionTaskId) {
      // Trigger rejection comment UI inline
      setRejectionTaskId(task.id);
      setRejectionComment("");
      return;
    }

    try {
      const comment = rejectionTaskId === task.id ? rejectionComment : "";
      await updateTaskStatus(
        activeProjectId,
        activeProject?.name || "",
        task,
        newStatus,
        projectTasks,
        isManagerOrAdmin,
        comment
      );

      setSuccess(`Task moved to "${newStatus}"!`);
      setRejectionTaskId(null);
      setRejectionComment("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Transition failed. Check security rules or dependency requirements.");
      setTimeout(() => setError(""), 6000);
    }
  };

  const handleDependencyToggle = (taskId: string) => {
    setDependencies((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getUserName = (uid: string) => {
    const found = users.find((u) => u.uid === uid);
    return found ? found.name : "Unknown User";
  };

  const isTaskBlocked = (task: Task) => {
    if (task.status === "Completed") return false;
    if (!task.dependencies || task.dependencies.length === 0) return false;
    return projectTasks.some(
      (other) => task.dependencies.includes(other.id) && other.status !== "Completed"
    );
  };

  // Groups tasks into columns
  const columns: { title: TaskStatus; bg: string; border: string; text: string }[] = [
    { title: "To Do", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600" },
    { title: "In Progress", bg: "bg-indigo-50/40", border: "border-indigo-100", text: "text-indigo-600" },
    { title: "Review", bg: "bg-amber-50/40", border: "border-amber-100", text: "text-amber-600" },
    { title: "Completed", bg: "bg-emerald-50/40", border: "border-emerald-100", text: "text-emerald-600" }
  ];

  return (
    <div className="space-y-6">
      {/* Active Project Picker */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <label htmlFor="active-proj-select" className="block text-xs font-semibold text-slate-400 font-mono uppercase mb-1">
            Active Project Workspace
          </label>
          <p className="text-xs text-slate-500">Choose a project to plan deliverables and resolve tasks.</p>
        </div>
        
        <select
          id="active-proj-select"
          value={activeProjectId}
          onChange={(e) => {
            setActiveProjectId(e.target.value);
            setError("");
          }}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-800"
        >
          <option value="" disabled>Select a project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

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

      {activeProjectId ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Create Task Card (Managers/Admins only) */}
          <div className="lg:col-span-1">
            {isManagerOrAdmin ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <PlusSquare className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-display font-bold text-slate-800 text-sm">Create Project Task</h3>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  {/* Task Title */}
                  <div>
                    <label htmlFor="task-title" className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                      Task Title *
                    </label>
                    <input
                      id="task-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Implement schema migration"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                      maxLength={150}
                      required
                    />
                  </div>

                  {/* Task Description */}
                  <div>
                    <label htmlFor="task-desc" className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                      Description *
                    </label>
                    <textarea
                      id="task-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Specify requirements, dependencies, and expected outcomes..."
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed resize-none"
                      maxLength={1000}
                      required
                    />
                  </div>

                  {/* Assign To */}
                  <div>
                    <label htmlFor="task-assignee" className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                      Assignee *
                    </label>
                    <select
                      id="task-assignee"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800"
                      required
                    >
                      <option value="">Select teammate...</option>
                      {/* Only list members assigned to this project */}
                      {users
                        .filter(u => activeProject?.members?.includes(u.uid) || u.uid === activeProject?.managerId)
                        .map((u) => (
                          <option key={u.uid} value={u.uid}>{u.name} ({u.role})</option>
                        ))}
                    </select>
                  </div>

                  {/* Dependencies Checklist */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                      Set Task Dependencies
                    </label>
                    <p className="text-[9px] text-slate-400 mb-2 leading-tight">
                      This task will be blocked from starting until selected tasks are Completed.
                    </p>
                    
                    <div className="max-h-32 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50 space-y-1.5 text-xs text-left">
                      {projectTasks.map((t) => (
                        <label 
                          key={t.id} 
                          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-all ${
                            dependencies.includes(t.id) ? "bg-indigo-50" : "hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={dependencies.includes(t.id)}
                            onChange={() => handleDependencyToggle(t.id)}
                            className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                          />
                          <span className="truncate text-[11px] text-slate-700 font-medium">{t.title}</span>
                        </label>
                      ))}
                      {projectTasks.length === 0 && (
                        <p className="text-[11px] text-slate-400 text-center py-2">Create a task first to link dependencies.</p>
                      )}
                    </div>
                  </div>

                  {/* Initial Task Status (Managers/Admins only) */}
                  {isManagerOrAdmin && (
                    <div>
                      <label htmlFor="task-initial-status" className="block text-xs font-semibold text-slate-500 font-mono uppercase mb-2">
                        Initial Task Status
                      </label>
                      <select
                        id="task-initial-status"
                        value={initialStatus}
                        onChange={(e) => setInitialStatus(e.target.value as TaskStatus)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800"
                        required
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/5 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Create Task
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
                <AlertTriangle className="w-6 h-6 text-slate-400 mb-1" />
                <p className="text-xs font-bold text-slate-700">Planning Restricted</p>
                <p className="text-[10px] text-slate-400 max-w-[180px] mt-1 leading-relaxed">
                  Only Managers can define and assign tasks. You can view, update progress, and submit your assigned tasks for review on the board.
                </p>
              </div>
            )}
          </div>

          {/* Kanban Board Layout */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
            {columns.map((col) => {
              const colTasks = projectTasks.filter((t) => t.status === col.title);
              
              return (
                <div key={col.title} className={`rounded-2xl p-4 border ${col.border} ${col.bg} flex flex-col min-h-[500px] shadow-sm shadow-slate-100/30`}>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <span className={`text-xs font-bold font-display uppercase tracking-wide ${col.text}`}>
                      {col.title}
                    </span>
                    <span className="bg-white/90 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono text-slate-500 shadow-sm">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards Column */}
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {colTasks.map((task) => {
                      const isAssignedToMe = profile?.uid === task.assignedTo;
                      const isBlocked = isTaskBlocked(task);
                      
                      // Match layout border styles with notification feeds for high visual harmony
                      let statusBorderColor = "border-l-4 border-l-slate-400";
                      if (task.status === "In Progress") statusBorderColor = "border-l-4 border-l-indigo-500";
                      else if (task.status === "Review") statusBorderColor = "border-l-4 border-l-amber-500";
                      else if (task.status === "Completed") statusBorderColor = "border-l-4 border-l-emerald-500";
                      
                      if (isBlocked) statusBorderColor = "border-l-4 border-l-rose-500";

                      return (
                        <div 
                          key={task.id}
                          className={`bg-white rounded-xl border border-slate-100 p-4 shadow-sm relative group hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-0.5 ${statusBorderColor}`}
                        >
                          {/* Title */}
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="text-xs font-bold text-slate-800 leading-snug break-words">
                              {task.title}
                            </h5>
                            {isManagerOrAdmin && (
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors duration-200"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-[11px] text-slate-500 leading-normal my-2 break-words">
                            {task.description}
                          </p>

                          {/* Dependency Markers */}
                          {task.dependencies && task.dependencies.length > 0 && (
                            <div className="mt-2.5 space-y-1 bg-slate-50/50 p-2 border border-slate-100 rounded-lg">
                              <p className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">PREREQUISITES:</p>
                              <div className="flex flex-wrap gap-1">
                                {task.dependencies.map((depId) => {
                                  const dep = projectTasks.find(t => t.id === depId);
                                  const isDepCompleted = dep?.status === "Completed";
                                  return (
                                    <span 
                                      key={depId} 
                                      title={dep?.title || "Prerequisite"}
                                      className={`text-[8px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold ${
                                        isDepCompleted 
                                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                          : "bg-rose-50 text-rose-600 border border-rose-100"
                                      }`}
                                    >
                                      {isDepCompleted ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                      {dep ? dep.title.substring(0, 10) + "..." : "Deleted task"}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Rejection comment */}
                          {task.reviewerComment && (
                            <div className="mt-2.5 p-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-700 leading-normal flex items-start gap-1.5 shadow-sm">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                              <p className="italic">"{task.reviewerComment}"</p>
                            </div>
                          )}

                          {/* Beautiful Initials Avatar Footer */}
                          {(() => {
                            const name = getUserName(task.assignedTo);
                            const initials = name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .substring(0, 2);
                            
                            let bgClass = "bg-indigo-50 text-indigo-700";
                            if (initials.charCodeAt(0) % 3 === 0) bgClass = "bg-emerald-50 text-emerald-700";
                            else if (initials.charCodeAt(0) % 3 === 1) bgClass = "bg-amber-50 text-amber-700";
                            
                            return (
                              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                <div className={`w-6 h-6 rounded-lg ${bgClass} font-extrabold text-[10px] flex items-center justify-center border border-current/10 shrink-0`}>
                                  {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold text-slate-700 truncate leading-none">{name}</p>
                                  <p className="text-[8px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">Assignee</p>
                                </div>
                                {isBlocked ? (
                                  <span className="text-[8px] font-mono font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded">
                                    BLOCKED
                                  </span>
                                ) : task.status === "In Progress" ? (
                                  <span className="text-[8px] font-mono font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded animate-pulse">
                                    IN DEV
                                  </span>
                                ) : task.status === "Review" ? (
                                  <span className="text-[8px] font-mono font-bold bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded">
                                    REVIEW
                                  </span>
                                ) : task.status === "Completed" ? (
                                  <span className="text-[8px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded">
                                    DONE
                                  </span>
                                ) : null}
                              </div>
                            );
                          })()}

                          {/* Interactive Status Transition Panel */}
                          {(isAssignedToMe || isManagerOrAdmin) && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                              
                              {/* Manager/Admin Overriding Dropdown Selector */}
                              {isManagerOrAdmin && (
                                <div className="space-y-1">
                                  <label htmlFor={`override-status-${task.id}`} className="block text-[9px] font-mono font-extrabold text-slate-400 tracking-wider uppercase">
                                    Set Status (Manager/Admin):
                                  </label>
                                  <select
                                    id={`override-status-${task.id}`}
                                    value={task.status}
                                    onChange={(e) => handleStatusTransition(task, e.target.value as TaskStatus)}
                                    className="w-full text-[11px] text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/20 cursor-pointer font-sans font-medium hover:border-slate-300 transition-colors"
                                  >
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Review">Review</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                </div>
                              )}

                              {/* Standard transitions / Rejection text input */}
                              {rejectionTaskId === task.id ? (
                                <div className="bg-slate-50 p-2 border border-slate-100 rounded-lg space-y-2 mt-1">
                                  <textarea
                                    value={rejectionComment}
                                    onChange={(e) => setRejectionComment(e.target.value)}
                                    placeholder="Comment for developer rejection..."
                                    className="w-full p-1.5 bg-white border border-slate-200 rounded text-[10px] text-slate-800 leading-normal resize-none focus:outline-none"
                                    rows={2}
                                    maxLength={500}
                                    required
                                  />
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleStatusTransition(task, "In Progress")}
                                      disabled={!rejectionComment.trim()}
                                      className="flex-1 py-1 px-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded text-[9px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                    >
                                      Confirm Reject
                                    </button>
                                    <button
                                      onClick={() => setRejectionTaskId(null)}
                                      className="py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded text-[9px] cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 mt-0.5">
                                  {/* TO DO -> IN PROGRESS */}
                                  {task.status === "To Do" && !isManagerOrAdmin && (
                                    <button
                                      onClick={() => handleStatusTransition(task, "In Progress")}
                                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
                                    >
                                      Start Task
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  )}

                                  {/* IN PROGRESS -> SUBMIT TO REVIEW */}
                                  {task.status === "In Progress" && !isManagerOrAdmin && (
                                    <button
                                      onClick={() => handleStatusTransition(task, "Review")}
                                      className="w-full flex items-center justify-center gap-1.5 py-1 px-2 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 cursor-pointer transition-all"
                                    >
                                      Submit for Review
                                      <CheckCircle2 className="w-3 h-3" />
                                    </button>
                                  )}

                                  {/* REVIEW COLUMN -> APPROVE / REJECT */}
                                  {task.status === "Review" && (
                                    <div className="w-full space-y-2">
                                      {isManagerOrAdmin ? (
                                        <div className="flex gap-1.5 w-full">
                                          <button
                                            onClick={() => handleStatusTransition(task, "Completed")}
                                            className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-emerald-600/10"
                                          >
                                            <Check className="w-3 h-3" />
                                            Approve
                                          </button>
                                          <button
                                            onClick={() => handleStatusTransition(task, "In Progress")}
                                            className="flex-1 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-rose-600/10"
                                          >
                                            <X className="w-3 h-3" />
                                            Reject
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-slate-400 text-center italic py-1 border border-dashed border-slate-200 rounded-lg w-full">
                                          Awaiting Manager Review
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* COMPLETED COLUMN -> ALLOW REOPEN */}
                                  {task.status === "Completed" && isManagerOrAdmin && (
                                    <button
                                      onClick={() => handleStatusTransition(task, "In Progress")}
                                      className="w-full py-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer transition-all"
                                    >
                                      Re-open Task
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white/50 text-[11px]">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold">No Workspace Loaded</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Please create or select a project using the project dropdown selector to load its active deliverable tasks.
          </p>
        </div>
      )}
    </div>
  );
};
