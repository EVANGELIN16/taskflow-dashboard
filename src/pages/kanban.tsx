import { useState, type DragEvent } from "react";
import { GripVertical, Loader2, Filter, CheckCircle2 } from "lucide-react";

import Card from "../components/ui/Card";
import { useGetProjectsQuery } from "../services/projectApi";

import { useGetTasksQuery, useUpdateTaskMutation } from "../services/taskApi";

import type { Task, TaskStatus, TaskPriority } from "../types/task";

const columns: TaskStatus[] = ["To Do", "In Progress", "Completed"];

const priorityStyles: Record<TaskPriority, string> = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-red-100 text-red-700",
};

const columnStyles: Record<TaskStatus, string> = {
  "To Do": "border-t-gray-400",
  "In Progress": "border-t-blue-500",
  Completed: "border-t-green-500",
};

export default function Kanban() {
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useGetTasksQuery();

  const {
    data: projects = [],
    isLoading: projectsLoading,
    isError: projectsError,
    refetch: refetchProjects,
  } = useGetProjectsQuery();

  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const [selectedProject, setSelectedProject] = useState("All");

  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredTasks = tasks.filter(
    (task) =>
      selectedProject === "All" || task.projectId === Number(selectedProject),
  );

  const moveTask = async (task: Task, newStatus: TaskStatus) => {
    if (task.status === newStatus || isUpdating) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await updateTask({
        id: task.id,
        title: task.title,
        description: task.description ?? "",
        projectId: task.projectId,
        priority: task.priority,
        dueDate: task.dueDate,
        status: newStatus,
      }).unwrap();

      setSuccess(`"${task.title}" moved to ${newStatus}.`);
    } catch {
      setError(`Unable to update "${task.title}". Please try again.`);
    }
  };

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    taskId: number,
  ) => {
    if (isUpdating) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(taskId));

    setDraggedTaskId(taskId);
    setError("");
    setSuccess("");
  };

  const handleDragOver = (
    event: DragEvent<HTMLElement>,
    column: TaskStatus,
  ) => {
    if (isUpdating) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setActiveColumn(column);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setActiveColumn(null);
  };

  const handleDrop = async (
    event: DragEvent<HTMLElement>,
    newStatus: TaskStatus,
  ) => {
    event.preventDefault();

    const taskId = draggedTaskId;

    setDraggedTaskId(null);
    setActiveColumn(null);

    if (taskId === null || isUpdating) return;

    const task = filteredTasks.find((item) => item.id === taskId);

    if (!task) return;

    await moveTask(task, newStatus);
  };

  if (tasksLoading || projectsLoading) {
    return <p role="status">Loading Kanban board...</p>;
  }

  if (tasksError || projectsError) {
    return (
      <Card>
        <p role="alert" className="text-red-600">
          Unable to load Kanban board data.
        </p>

        <button
          type="button"
          onClick={() => {
            void refetchTasks();
            void refetchProjects();
          }}
          className="mt-4 text-blue-600 underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  const renderTask = (task: Task) => (
    <div
      key={task.id}
      draggable={!isUpdating}
      onDragStart={(event) => handleDragStart(event, task.id)}
      onDragEnd={handleDragEnd}
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md ${
        isUpdating ? "cursor-wait" : "cursor-grab active:cursor-grabbing"
      } ${draggedTaskId === task.id ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="break-words font-semibold text-gray-900">
          {task.title}
        </h3>

        <GripVertical size={18} className="shrink-0 text-gray-400" />
      </div>

      {task.description && (
        <p className="mt-2 break-words text-sm text-gray-500">
          {task.description}
        </p>
      )}

      <p className="mt-3 text-xs text-gray-500">Project: {task.project.name}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            priorityStyles[task.priority]
          }`}
        >
          {task.priority}
        </span>

        {task.dueDate && (
          <span className="text-xs text-gray-500">
            Due: {task.dueDate.slice(0, 10)}
          </span>
        )}
      </div>

      {/* Mobile-friendly status dropdown */}
      <div className="mt-4">
        <label
          htmlFor={`status-${task.id}`}
          className="mb-1 block text-xs font-medium text-gray-600"
        >
          Move to
        </label>

        <select
          id={`status-${task.id}`}
          value={task.status}
          disabled={isUpdating}
          onChange={(event) => {
            void moveTask(task, event.target.value as TaskStatus);
          }}
          onDragStart={(event) => event.stopPropagation()}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        >
          {columns.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-bold">Kanban Board</h1>

        <p className="mt-2 text-gray-500">
          Organize tasks by project and move them between status columns.
        </p>
      </div>

      {/* Project filter */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-blue-600" />
            <label htmlFor="kanban-project" className="font-medium">
              Filter by Project
            </label>
          </div>

          <select
            id="kanban-project"
            value={selectedProject}
            onChange={(event) => {
              setSelectedProject(event.target.value);
              setSuccess("");
              setError("");
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 sm:max-w-xs"
          >
            <option value="All">All Projects</option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Feedback */}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-green-700"
        >
          <CheckCircle2 size={17} />
          {success}
        </p>
      )}

      {isUpdating && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-blue-600"
        >
          <Loader2 size={16} className="animate-spin" />
          Saving task status...
        </p>
      )}

      {/* Kanban columns */}
      <div className="grid gap-5 lg:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter(
            (task) => task.status === column,
          );

          return (
            <section
              key={column}
              onDragOver={(event) => handleDragOver(event, column)}
              onDragLeave={() => setActiveColumn(null)}
              onDrop={(event) => void handleDrop(event, column)}
              className={`min-w-0 rounded-xl border border-gray-200 border-t-4 p-4 transition-colors ${
                columnStyles[column]
              } ${activeColumn === column ? "bg-blue-100" : "bg-gray-50"}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-gray-800">{column}</h2>

                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-600">
                  {columnTasks.length}
                </span>
              </div>

              <div className="min-h-40 space-y-3">
                {columnTasks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                    Drop tasks here.
                  </p>
                ) : (
                  columnTasks.map(renderTask)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
