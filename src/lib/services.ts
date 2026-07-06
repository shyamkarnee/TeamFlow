import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Project, Task, Incident, Notification, TaskStatus, IncidentStatus } from "../types";

// --- Notification Helpers ---

export async function createNotification(userId: string, message: string, type: string) {
  try {
    const notifRef = doc(collection(db, "users", userId, "notifications"));
    const notification: Notification = {
      id: notifRef.id,
      userId,
      message,
      read: false,
      type,
      createdAt: serverTimestamp() as any
    };
    await setDoc(notifRef, notification);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

// --- Project Services ---

export async function createProject(name: string, description: string, managerId: string, members: string[]) {
  const projectRef = doc(collection(db, "projects"));
  
  // Make sure the manager is in the members list
  const uniqueMembers = Array.from(new Set([managerId, ...members]));
  
  const project: Project = {
    id: projectRef.id,
    name,
    description,
    managerId,
    members: uniqueMembers,
    createdAt: serverTimestamp() as any
  };

  try {
    await setDoc(projectRef, project);
    
    // Send notifications to all assigned project members
    for (const memberId of uniqueMembers) {
      if (memberId !== managerId) {
        await createNotification(
          memberId,
          `You have been added to the project "${name}".`,
          "project_added"
        );
      }
    }
    return project;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${projectRef.id}`);
  }
}

export async function updateProject(projectId: string, name: string, description: string, members: string[]) {
  const projectRef = doc(db, "projects", projectId);
  try {
    await updateDoc(projectRef, {
      name,
      description,
      members
    });
    
    // Notify users
    for (const memberId of members) {
      await createNotification(
        memberId,
        `Project "${name}" has been updated by the manager.`,
        "project_updated"
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
  }
}

export async function deleteProject(projectId: string) {
  const projectRef = doc(db, "projects", projectId);
  try {
    await deleteDoc(projectRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
  }
}

// --- Task Services ---

export async function createTask(
  projectId: string, 
  projectName: string,
  title: string, 
  description: string, 
  assignedTo: string, 
  dependencies: string[],
  status: TaskStatus = "To Do"
) {
  const taskRef = doc(collection(db, "projects", projectId, "tasks"));
  const task: Task = {
    id: taskRef.id,
    projectId,
    title,
    description,
    assignedTo,
    status,
    dependencies,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any
  };

  try {
    await setDoc(taskRef, task);
    
    // Notify the assigned developer
    await createNotification(
      assignedTo,
      `You have been assigned the task "${title}" in project "${projectName}".`,
      "task_assigned"
    );
    return task;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${projectId}/tasks/${taskRef.id}`);
  }
}

export async function updateTaskStatus(
  projectId: string,
  projectName: string,
  task: Task,
  newStatus: TaskStatus,
  allProjectTasks: Task[],
  isManagerUser: boolean,
  reviewerComment: string = ""
): Promise<void> {
  const taskRef = doc(db, "projects", projectId, "tasks", task.id);
  const oldStatus = task.status;

  // 1. Business Rule: Completed tasks cannot be edited (unless by Admin/Manager, let's allow reopening)
  if (oldStatus === "Completed" && !isManagerUser) {
    throw new Error("Only Managers or Admins can modify completed tasks.");
  }

  // 2. Business Rule: Status transition path validation
  // Sequence: To Do -> In Progress -> Review -> Completed
  if (!isManagerUser) {
    // Developers can only transition in standard sequence:
    // To Do -> In Progress
    // In Progress -> Review
    // Review -> In Progress (if sent back, though usually done by manager)
    if (newStatus === "Completed") {
      throw new Error("Only Managers or Admins can review and mark a task as Completed.");
    }

    const isValidTransition = 
      (oldStatus === "To Do" && newStatus === "In Progress") ||
      (oldStatus === "In Progress" && newStatus === "Review") ||
      (oldStatus === "Review" && newStatus === "In Progress");

    if (!isValidTransition) {
      throw new Error(`Invalid developer workflow transition from "${oldStatus}" to "${newStatus}".`);
    }
  }

  // 3. Business Rule: Task Dependencies Conflict Handling
  // If moving to "In Progress", all dependent tasks must be "Completed"
  if (newStatus === "In Progress" && task.dependencies && task.dependencies.length > 0) {
    const incompleteDeps = allProjectTasks.filter(
      t => task.dependencies.includes(t.id) && t.status !== "Completed"
    );

    if (incompleteDeps.length > 0) {
      const depTitles = incompleteDeps.map(t => `"${t.title}"`).join(", ");
      
      // Send a notification to the assigned user about the block
      await createNotification(
        task.assignedTo,
        `Task "${task.title}" is blocked. Dependent tasks ${depTitles} are not completed.`,
        "dependency_blocked"
      );

      throw new Error(
        `This task cannot start because its dependency task (${depTitles}) is not completed.`
      );
    }
  }

  // 4. Business Rule 8: Review Workflow Rules
  // Only Managers can review completed tasks. If approved: Review -> Completed. If rejected: Review -> In Progress.
  // The reviewer must provide a comment when rejecting a task.
  const updateData: any = {
    status: newStatus,
    updatedAt: serverTimestamp()
  };

  if (oldStatus === "Review" && newStatus === "In Progress") {
    if (!reviewerComment.trim()) {
      throw new Error("The reviewer must provide a rejection comment when returning a task to In Progress.");
    }
    updateData.reviewerComment = reviewerComment;
    
    // Notify assignee of rejection
    await createNotification(
      task.assignedTo,
      `Your task "${task.title}" was returned to "In Progress". Comment: "${reviewerComment}"`,
      "task_rejected"
    );
  } else if (newStatus === "Completed") {
    // Approved
    updateData.reviewerComment = ""; // clear previous comments
    
    // Notify assignee of completion/approval
    await createNotification(
      task.assignedTo,
      `Your task "${task.title}" has been reviewed and marked as Completed!`,
      "task_completed"
    );
  } else if (newStatus === "Review") {
    // Submitted for review, notify the project manager
    // Get the project to find the manager's UID
    try {
      const projectSnap = await getDoc(doc(db, "projects", projectId));
      if (projectSnap.exists()) {
        const projData = projectSnap.data() as Project;
        await createNotification(
          projData.managerId,
          `Task "${task.title}" in "${projectName}" has been submitted for review.`,
          "task_submitted"
        );
      }
    } catch (e) {
      console.error("Could not notify manager of task review", e);
    }
  } else {
    // General status change notification
    await createNotification(
      task.assignedTo,
      `Task "${task.title}" status updated to "${newStatus}".`,
      "status_changed"
    );
  }

  try {
    await updateDoc(taskRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}/tasks/${task.id}`);
  }
}

export async function deleteTask(projectId: string, taskId: string) {
  const taskRef = doc(db, "projects", projectId, "tasks", taskId);
  try {
    await deleteDoc(taskRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}/tasks/${taskId}`);
  }
}

// --- Incident Services ---

export async function createIncident(
  projectId: string, 
  projectName: string,
  title: string, 
  description: string, 
  reportedBy: string, 
  assignedTo: string
) {
  const incidentRef = doc(collection(db, "projects", projectId, "incidents"));
  const incident: Incident = {
    id: incidentRef.id,
    projectId,
    title,
    description,
    reportedBy,
    assignedTo,
    status: "Open",
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any
  };

  try {
    await setDoc(incidentRef, incident);
    
    // Notify the assigned user
    await createNotification(
      assignedTo,
      `You have been assigned incident "${title}" in "${projectName}".`,
      "incident_assigned"
    );
    
    return incident;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${projectId}/incidents/${incidentRef.id}`);
  }
}

export async function updateIncidentStatus(
  projectId: string,
  projectName: string,
  incident: Incident,
  newStatus: IncidentStatus,
  assignedTo: string
) {
  const incidentRef = doc(db, "projects", projectId, "incidents", incident.id);
  
  try {
    const updateData: any = {
      status: newStatus,
      assignedTo,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(incidentRef, updateData);
    
    // Notify reporter and assignee
    if (newStatus !== incident.status) {
      await createNotification(
        incident.reportedBy,
        `Incident "${incident.title}" has been updated to "${newStatus}".`,
        "incident_updated"
      );
    }
    
    if (assignedTo !== incident.assignedTo) {
      await createNotification(
        assignedTo,
        `You have been assigned to incident "${incident.title}" in "${projectName}".`,
        "incident_assigned"
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}/incidents/${incident.id}`);
  }
}

export async function deleteIncident(projectId: string, incidentId: string) {
  const incidentRef = doc(db, "projects", projectId, "incidents", incidentId);
  try {
    await deleteDoc(incidentRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}/incidents/${incidentId}`);
  }
}

// --- Notification Read Helper ---

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const notifRef = doc(db, "users", userId, "notifications", notificationId);
  try {
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/notifications/${notificationId}`);
  }
}

export async function deleteNotification(userId: string, notificationId: string) {
  const notifRef = doc(db, "users", userId, "notifications", notificationId);
  try {
    await deleteDoc(notifRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/notifications/${notificationId}`);
  }
}
