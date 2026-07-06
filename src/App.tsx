import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { Login } from "./components/Login";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Projects } from "./components/Projects";
import { Tasks } from "./components/Tasks";
import { Incidents } from "./components/Incidents";
import { Profile } from "./components/Profile";
import { Admin } from "./components/Admin";
import { Briefcase } from "lucide-react";

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState("dashboard");

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
          <Briefcase className="w-5 h-5 text-indigo-600 absolute" />
        </div>
        <p className="text-xs text-slate-400 font-semibold font-mono tracking-wider uppercase animate-pulse">
          Syncing secure workspace...
        </p>
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    return <Login />;
  }

  // Active Tab Component Selector
  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard />;
      case "projects":
        return <Projects />;
      case "tasks":
        return <Tasks />;
      case "incidents":
        return <Incidents />;
      case "profile":
        return <Profile />;
      case "admin":
        return <Admin />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderTabContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
