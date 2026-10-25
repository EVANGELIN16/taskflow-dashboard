import { useState, type FormEvent } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";

import {
  useGetProjectsQuery,
  useAddProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from "../services/projectApi";

import type { Project, ProjectStatus } from "../types/project";

const statuses: ProjectStatus[] = ["Planning", "In Progress", "Completed"];

function Projects() {
  const {
    data: projects = [],
    isLoading,
    isError,
    refetch,
  } = useGetProjectsQuery();

  const [addProject, { isLoading: isAdding }] = useAddProjectMutation();

  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();

  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Planning");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isSaving = isAdding || isUpdating;
  const isBusy = isSaving || isDeleting;

  const resetForm = () => {
    setName("");
    setStatus("Planning");
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Project name is required");
      return;
    }

    try {
      if (editingId !== null) {
        await updateProject({
          id: editingId,
          name: trimmedName,
          status,
        }).unwrap();
      } else {
        await addProject({
          name: trimmedName,
          status,
        }).unwrap();
      }

      resetForm();
    } catch {
      setError("Unable to save project. Please try again.");
    }
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setName(project.name);
    setStatus(project.status);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this project?")) return;

    try {
      await deleteProject(id).unwrap();

      if (editingId === id) resetForm();
      setError("");
    } catch {
      setError("Unable to delete project. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="mt-2 text-text-secondary">
          Manage your projects through the TaskFlow API.
        </p>
      </div>

      <Card title={editingId !== null ? "Edit Project" : "Create Project"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Project Name"
            value={name}
            placeholder="Enter project name"
            error={error}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
          />

          <div className="space-y-2">
            <label
              htmlFor="project-status"
              className="block text-sm font-medium"
            >
              Status
            </label>

            <select
              id="project-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full rounded-lg border border-border bg-white p-3"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isBusy}>
              <Plus size={18} />
              {isSaving
                ? "Saving..."
                : editingId !== null
                  ? "Update Project"
                  : "Add Project"}
            </Button>

            <Button variant="secondary" onClick={resetForm} disabled={isBusy}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {isLoading ? (
        <p role="status">Loading projects...</p>
      ) : isError ? (
        <Card>
          <p role="alert" className="text-danger">
            Unable to fetch projects. Check your backend server.
          </p>
          <div className="mt-4">
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </Card>
      ) : (
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            All Projects ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <Card>
              <p className="text-text-secondary">
                No projects yet. Create your first project.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id}>
                  <div className="space-y-4">
                    <h3 className="break-words text-lg font-semibold">
                      {project.name}
                    </h3>

                    <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                      {project.status}
                    </span>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(project)}
                        disabled={isBusy}
                      >
                        <Pencil size={16} />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(project.id)}
                        disabled={isBusy}
                      >
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Projects;
