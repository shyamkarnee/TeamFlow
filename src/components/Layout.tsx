import React from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  AlertTriangle, 
  UserCircle, 
  ShieldAlert, 
  LogOut, 
  Bell, 
  BellOff, 
  Briefcase 
} from "lucide-react";

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, setCurrentTab, children }) => {
  const { profile, signOut } = useAuth();
  const { notifications } = useData();

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "incidents", label: "Incidents", icon: AlertTriangle },
    { id: "profile", label: "Profile Settings", icon: UserCircle },
  ];

  const showAdminTab = profile?.role === "Admin";

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 select-none">
        {/* Brand / Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 transition-transform duration-300 hover:rotate-6">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-lg tracking-tight leading-none">TeamFlow</h2>
            <span className="text-[9px] font-mono text-indigo-400 font-semibold tracking-wider uppercase">Systems Eng</span>
          </div>
        </div>

        {/* User Context Info Card */}
        <div className="p-4 mx-4 my-4 bg-slate-800/30 border border-slate-800/60 rounded-xl hover:border-slate-700/60 transition-all duration-300">
          <p className="text-[10px] text-slate-500 font-semibold font-mono tracking-wider uppercase">Logged in as</p>
          <p className="text-sm font-semibold text-white truncate mt-0.5">{profile?.name || "Loading..."}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
            <span className="text-[9px] font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-900/50 px-2 py-0.5 rounded uppercase tracking-wide">
              {profile?.role}
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 translate-x-1"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 hover:translate-x-0.5"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? "scale-110 text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.id === "dashboard" && unreadNotificationsCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce shadow-md shadow-indigo-500/20">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            );
          })}

          {showAdminTab && (
            <button
              onClick={() => setCurrentTab("admin")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                currentTab === "admin"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 translate-x-1"
                  : "text-rose-400/80 hover:text-rose-200 hover:bg-rose-950/20 hover:translate-x-0.5"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          )}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-500 hover:text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0 shadow-sm shadow-slate-100/50">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-slate-800 text-lg tracking-tight capitalize">
              {currentTab === "admin" ? "Admin Management" : currentTab.replace("-", " ")}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              <span>Firebase Cloud Live</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
