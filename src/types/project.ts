export type ProjectStatus = "Planning" | "In Progress" | "Completed";

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
}

export type ProjectInput = Omit<Project, "id">;
