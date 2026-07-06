import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import { Project, Task, Incident, Notification } from "../types";

interface DataContextType {
  projects: Project[];
  tasks: Task[];
  incidents: Incident[];
  notifications: Notification[];
  loadingData: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // 1. Subscribe to Projects
  useEffect(() => {
    if (!user || !profile) {
      setProjects([]);
      setTasks([]);
      setIncidents([]);
      return;
    }

    setLoadingData(true);
    
    // Firestore security rule handles restricting project list
    const projQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    
    const unsubscribeProjects = onSnapshot(
      projQuery,
      (snapshot) => {
        const projList: Project[] = [];
        snapshot.forEach((doc) => {
          projList.push(doc.data() as Project);
        });
        setProjects(projList);
        setLoadingData(false);
      },
      (error) => {
        console.error("Error listening to projects:", error);
        setLoadingData(false);
      }
    );

    return () => unsubscribeProjects();
  }, [user, profile]);

  // 2. Subscribe to Tasks & Incidents of active projects
  useEffect(() => {
    if (projects.length === 0) {
      setTasks([]);
      setIncidents([]);
      return;
    }

    // Set up listeners for tasks and incidents for each project
    const taskUnsubscribes: (() => void)[] = [];
    const incidentUnsubscribes: (() => void)[] = [];

    // Temporary maps to accumulate real-time data from multiple project streams
    const tasksMap = new Map<string, Task[]>();
    const incidentsMap = new Map<string, Incident[]>();

    const updateAllTasksState = () => {
      const merged: Task[] = [];
      tasksMap.forEach((taskList) => merged.push(...taskList));
      // Sort tasks by updatedAt
      merged.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });
      setTasks(merged);
    };

    const updateAllIncidentsState = () => {
      const merged: Incident[] = [];
      incidentsMap.forEach((incidentList) => merged.push(...incidentList));
      // Sort incidents by updatedAt
      merged.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });
      setIncidents(merged);
    };

    projects.forEach((project) => {
      // Stream Tasks
      const tasksRef = collection(db, "projects", project.id, "tasks");
      const unsubTask = onSnapshot(tasksRef, (snapshot) => {
        const list: Task[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Task);
        });
        tasksMap.set(project.id, list);
        updateAllTasksState();
      }, (err) => {
        console.error(`Error streaming tasks for project ${project.id}:`, err);
      });
      taskUnsubscribes.push(unsubTask);

      // Stream Incidents
      const incidentsRef = collection(db, "projects", project.id, "incidents");
      const unsubIncident = onSnapshot(incidentsRef, (snapshot) => {
        const list: Incident[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Incident);
        });
        incidentsMap.set(project.id, list);
        updateAllIncidentsState();
      }, (err) => {
        console.error(`Error streaming incidents for project ${project.id}:`, err);
      });
      incidentUnsubscribes.push(unsubIncident);
    });

    return () => {
      taskUnsubscribes.forEach((unsub) => unsub());
      incidentUnsubscribes.forEach((unsub) => unsub());
    };
  }, [projects]);

  // 3. Subscribe to Notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const notifRef = collection(db, "users", user.uid, "notifications");
    const notifQuery = query(notifRef, orderBy("createdAt", "desc"));

    const unsubscribeNotifications = onSnapshot(
      notifQuery,
      (snapshot) => {
        const list: Notification[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Notification);
        });
        setNotifications(list);
      },
      (error) => {
        console.error("Error listening to notifications:", error);
      }
    );

    return () => unsubscribeNotifications();
  }, [user]);

  return (
    <DataContext.Provider
      value={{
        projects,
        tasks,
        incidents,
        notifications,
        loadingData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
