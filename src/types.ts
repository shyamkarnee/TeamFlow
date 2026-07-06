export type UserRole = "Admin" | "Manager" | "Developer";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: any; // Firestore Timestamp
}

export interface Project {
  id: string;
  name: string;
  description: string;
  managerId: string;
  members: string[]; // array of user uids
  createdAt: any; // Firestore Timestamp
}

export type TaskStatus = "To Do" | "In Progress" | "Review" | "Completed";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string; // user uid
  status: TaskStatus;
  dependencies: string[]; // task IDs in the same project
  reviewerComment?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export type IncidentStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface Incident {
  id: string;
  projectId: string;
  title: string;
  description: string;
  reportedBy: string; // user uid
  assignedTo: string; // user uid
  status: IncidentStatus;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: any; // Firestore Timestamp
}
