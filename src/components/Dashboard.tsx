import React from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { markNotificationAsRead, deleteNotification } from "../lib/services";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { 
  Folder, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Bell, 
  BellOff,
  Trash2, 
  Check, 
  AlertTriangle, 
  Briefcase,
  HelpCircle
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { projects, tasks, incidents, notifications } = useData();

  // 1. Calculate general statistics
  const totalProjects = projects.length;
  
  // Tasks counts
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "To Do" || t.status === "In Progress" || t.status === "Review").length;
  
  // Calculate Blocked tasks
  // A task is blocked if it is not completed AND has dependencies that are not completed
  const blockedTasks = tasks.filter((task) => {
    if (task.status === "Completed") return false;
    if (!task.dependencies || task.dependencies.length === 0) return false;
    
    // Check if any dependency task is not Completed
    return tasks.some(
      (otherTask) => task.dependencies.includes(otherTask.id) && otherTask.status !== "Completed"
    );
  }).length;

  // Incidents counts
  const openIncidents = incidents.filter((i) => i.status !== "Closed" && i.status !== "Resolved").length;
  const totalIncidents = incidents.length;

  // 2. Prepare Chart Data
  // Pie Chart: Task Distribution
  const taskDistributionData = [
    { name: "Completed", value: completedTasks, color: "#10b981" },
    { name: "Pending", value: pendingTasks - blockedTasks, color: "#6366f1" },
    { name: "Blocked", value: blockedTasks, color: "#ef4444" }
  ].filter(item => item.value > 0);

  // Default value for chart if empty
  const isTasksEmpty = tasks.length === 0;
  const emptyTaskData = [{ name: "No Tasks", value: 1, color: "#e2e8f0" }];

  // Bar Chart: Project Breakdown
  // Shows number of Completed vs Total tasks per project
  const projectBreakdownData = projects.map(proj => {
    const projTasks = tasks.filter(t => t.projectId === proj.id);
    const completed = projTasks.filter(t => t.status === "Completed").length;
    const pending = projTasks.length - completed;
    return {
      name: proj.name.length > 12 ? proj.name.substring(0, 10) + "..." : proj.name,
      Completed: completed,
      Pending: pending,
    };
  });

  // Incident status chart data
  const incidentStatusCounts = {
    Open: incidents.filter(i => i.status === "Open").length,
    "In Progress": incidents.filter(i => i.status === "In Progress").length,
    Resolved: incidents.filter(i => i.status === "Resolved").length,
    Closed: incidents.filter(i => i.status === "Closed").length,
  };

  const incidentChartData = Object.entries(incidentStatusCounts).map(([status, count]) => ({
    name: status,
    Count: count,
  })).filter(item => item.Count > 0);

  // Helpers for notifications
  const handleMarkAsRead = async (notifId: string) => {
    if (profile) {
      await markNotificationAsRead(profile.uid, notifId);
    }
  };

  const handleDismiss = async (notifId: string) => {
    if (profile) {
      await deleteNotification(profile.uid, notifId);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "dependency_blocked":
      case "task_rejected":
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case "task_completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "incident_assigned":
        return <AlertOctagon className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getNotifBg = (type: string) => {
    switch (type) {
      case "dependency_blocked":
      case "task_rejected":
        return "bg-rose-50 border-rose-100";
      case "task_completed":
        return "bg-emerald-50 border-emerald-100";
      case "incident_assigned":
        return "bg-amber-50 border-amber-100";
      default:
        return "bg-indigo-50 border-indigo-100";
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 select-none">
        {/* Total Projects */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm shadow-slate-100/40 flex items-center gap-4 hover:shadow-md hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider uppercase">PROJECTS</p>
            <h3 className="text-2xl font-extrabold text-slate-800 font-display mt-0.5 tracking-tight">{totalProjects}</h3>
            <span className="text-[9px] font-mono text-indigo-500 font-semibold uppercase">Active work</span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm shadow-slate-100/40 flex items-center gap-4 hover:shadow-md hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider uppercase">COMPLETED</p>
            <h3 className="text-2xl font-extrabold text-slate-800 font-display mt-0.5 tracking-tight">{completedTasks}</h3>
            <span className="text-[9px] font-mono text-emerald-500 font-semibold uppercase">Verified OK</span>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm shadow-slate-100/40 flex items-center gap-4 hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider uppercase">PENDING</p>
            <h3 className="text-2xl font-extrabold text-slate-800 font-display mt-0.5 tracking-tight">{pendingTasks}</h3>
            <span className="text-[9px] font-mono text-blue-500 font-semibold uppercase">In backlog</span>
          </div>
        </div>

        {/* Blocked Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm shadow-slate-100/40 flex items-center gap-4 hover:shadow-md hover:shadow-rose-500/5 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider uppercase">BLOCKED</p>
            <h3 className="text-2xl font-extrabold text-slate-800 font-display mt-0.5 tracking-tight">{blockedTasks}</h3>
            <span className="text-[9px] font-mono text-rose-500 font-semibold uppercase">Unresolved dep</span>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm shadow-slate-100/40 flex items-center gap-4 hover:shadow-md hover:shadow-amber-500/5 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider uppercase">INCIDENTS</p>
            <h3 className="text-2xl font-extrabold text-slate-800 font-display mt-0.5 tracking-tight">{openIncidents}</h3>
            <span className="text-[9px] font-mono text-amber-500 font-semibold uppercase">Open blockers</span>
          </div>
        </div>
      </div>

      {/* Main Stats Charts & Notifications Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Real-time Reporting Charts Section */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Task Status Share */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm shadow-slate-100/40 flex flex-col">
              <h4 className="font-display font-bold text-slate-800 text-sm mb-4">Task Deliverable Status</h4>
              <div className="h-56 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={isTasksEmpty ? emptyTaskData : taskDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(isTasksEmpty ? emptyTaskData : taskDistributionData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                    <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                {isTasksEmpty && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <p className="text-xs text-slate-400 font-medium">Create projects & tasks to populate charts</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Workload Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm shadow-slate-100/40 flex flex-col">
              <h4 className="font-display font-bold text-slate-800 text-sm mb-4">Task Metrics per Project</h4>
              <div className="h-56">
                {projectBreakdownData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectBreakdownData}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconSize={10} />
                      <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Pending" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    No projects available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Incident Chart / Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm shadow-slate-100/40">
            <h4 className="font-display font-bold text-slate-800 text-sm mb-4">Incident Log Distributions</h4>
            <div className="h-48">
              {incidents.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incidentChartData} layout="vertical">
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="Count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No incidents reported yet. Smooth sailing!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Notifications Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm shadow-slate-100/40 flex flex-col h-[530px]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              <h4 className="font-display font-bold text-slate-800 text-sm">Notifications Feed</h4>
            </div>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full font-mono animate-pulse">
                {notifications.filter(n => !n.read).length} new
              </span>
            )}
          </div>

          {/* Notification List Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const isBlocked = notif.type === "dependency_blocked" || notif.type === "task_rejected";
                const isCompleted = notif.type === "task_completed";
                const isIncident = notif.type === "incident_assigned";
                
                const leftBorderColor = isBlocked 
                  ? "border-l-4 border-l-rose-500" 
                  : isCompleted 
                    ? "border-l-4 border-l-emerald-500" 
                    : isIncident 
                      ? "border-l-4 border-l-amber-500" 
                      : "border-l-4 border-l-indigo-500";

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-xl border text-xs relative group transition-all duration-200 ${leftBorderColor} ${
                      notif.read 
                        ? "bg-slate-50/50 border-slate-100 text-slate-500" 
                        : `${getNotifBg(notif.type)} text-slate-800 font-medium shadow-sm hover:translate-x-0.5`
                    }`}
                  >
                    <div className="flex gap-2.5 items-start">
                      <div className="mt-0.5 shrink-0">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 pr-6">
                        <p className="leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          {notif.createdAt?.seconds 
                            ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : "Just now"}
                        </p>
                      </div>
                    </div>

                    {/* Notification Action Buttons */}
                    <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-inherit pl-2 rounded-lg">
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          title="Mark as read"
                          className="p-1 hover:bg-white rounded-md text-emerald-600 border border-slate-200 shadow-sm cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(notif.id)}
                        title="Dismiss"
                        className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-rose-600 border border-slate-200 shadow-sm cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 text-center">
                <BellOff className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-xs">No notifications yet.</p>
                <p className="text-[10px] text-slate-400 max-w-[180px] mt-1 leading-tight">
                  Updates on assignments, rejections, and incidents appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
