export type TaskStatus = "To Do" | "In Progress" | "Completed";

export type TaskPriority = "Low" | "Medium" | "High";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  projectId: number;
  project: {
    id: number;
    name: string;
  };
}

export interface TaskInput {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId: number;
}

export interface UpdateTaskInput extends TaskInput {
  id: number;
}
