import { useState, type FormEvent } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Search,
  ArrowUpDown,
  ListTodo,
  CalendarDays,
  FolderKanban,
  RotateCcw,
} from "lucide-react";

import Card from "../components/ui/Card";
import { useGetProjectsQuery } from "../services/projectApi";

import {
  useGetTasksQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "../services/taskApi";

import type { Task, TaskStatus, TaskPriority } from "../types/task";

type SortOption = "newest" | "oldest" | "priority" | "dueDate";

const priorityOrder: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const priorityStyles: Record<TaskPriority, string> = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

const statusStyles: Record<TaskStatus, string> = {
  "To Do": "bg-gray-100 text-gray-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
};

const inputClass =
  "block w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

export default function Tasks() {
  // Fetch tasks
  const { data: tasks = [], isLoading, isError, refetch } = useGetTasksQuery();

  // Fetch projects
  const {
    data: projects = [],
    isLoading: projectsLoading,
    isError: projectsError,
    refetch: refetchProjects,
  } = useGetProjectsQuery();

  // Task mutations
  const [addTask, { isLoading: isCreating }] = useAddTaskMutation();

  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  // Create / Edit form
  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");

  const [status, setStatus] = useState<TaskStatus>("To Do");

  const [priority, setPriority] = useState<TaskPriority>("Medium");

  const [dueDate, setDueDate] = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState("All");

  const [filterPriority, setFilterPriority] = useState("All");

  const [filterProject, setFilterProject] = useState("All");

  // Search and sorting
  const [searchQuery, setSearchQuery] = useState("");

  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isSaving = isCreating || isUpdating;
  const isBusy = isSaving || isDeleting;

  // Filter, search and sort
  const filteredTasks = tasks
    .filter((task) => {
      const matchesStatus =
        filterStatus === "All" || task.status === filterStatus;

      const matchesPriority =
        filterPriority === "All" || task.priority === filterPriority;

      const matchesProject =
        filterProject === "All" || task.projectId === Number(filterProject);

      const search = searchQuery.trim().toLowerCase();

      const matchesSearch =
        task.title.toLowerCase().includes(search) ||
        (task.description ?? "").toLowerCase().includes(search);

      return (
        matchesStatus && matchesPriority && matchesProject && matchesSearch
      );
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      if (sortBy === "dueDate") {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;

        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

        return dateA - dateB;
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const hasActiveFilters =
    filterStatus !== "All" ||
    filterPriority !== "All" ||
    filterProject !== "All" ||
    searchQuery.trim() !== "" ||
    sortBy !== "newest";

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setProjectId("");
    setStatus("To Do");
    setPriority("Medium");
    setDueDate("");
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setProjectId(String(task.projectId));
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate?.slice(0, 10) ?? "");

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!projectId) {
      setError("Please select a project.");
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      projectId: Number(projectId),
      status,
      priority,
      dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
    };

    try {
      if (editingId !== null) {
        await updateTask({
          id: editingId,
          ...taskData,
        }).unwrap();

        setSuccess("Task updated successfully!");
      } else {
        await addTask(taskData).unwrap();

        setSuccess("Task created successfully!");
      }

      resetForm();
    } catch {
      setError("Unable to save task. Please try again.");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteTask(id).unwrap();

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Task deleted successfully!");
    } catch {
      setError("Unable to delete task.");
    }
  };

  const clearFilters = () => {
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterProject("All");
    setSearchQuery("");
    setSortBy("newest");
  };

  if (isLoading || projectsLoading) {
    return (
      <div role="status" className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (isError || projectsError) {
    return (
      <Card>
        <p role="alert" className="text-red-600">
          Unable to load tasks or projects.
        </p>

        <button
          type="button"
          onClick={() => {
            void refetch();
            void refetchProjects();
          }}
          className="mt-4 font-medium text-blue-600 underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">My Tasks</h1>

          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Create, organize and manage your tasks.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          <ListTodo size={18} />
          {tasks.length} Total Tasks
        </div>
      </div>

      {/* Create / Edit Task */}
      <Card title={editingId !== null ? "Edit Task" : "Create New Task"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task-title" className={labelClass}>
              Task Title
            </label>

            <input
              id="task-title"
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter task title"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="task-description" className={labelClass}>
              Description
            </label>

            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enter task description"
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label htmlFor="task-project" className={labelClass}>
                Project
              </label>

              <select
                id="task-project"
                required
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className={inputClass}
              >
                <option value="">Select a project</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label htmlFor="task-status" className={labelClass}>
                Status
              </label>

              <select
                id="task-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatus)
                }
                className={inputClass}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="min-w-0">
              <label htmlFor="task-priority" className={labelClass}>
                Priority
              </label>

              <select
                id="task-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                className={inputClass}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="min-w-0">
              <label htmlFor="task-due-date" className={labelClass}>
                Due Date
              </label>

              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              {success}
            </p>
          )}

          {projects.length === 0 && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              Create a project before adding tasks.
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isBusy || projects.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {editingId !== null ? <Pencil size={18} /> : <Plus size={18} />}

              {isSaving
                ? "Saving..."
                : editingId !== null
                  ? "Update Task"
                  : "Create Task"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isBusy}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-medium hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
              >
                <X size={18} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </Card>

      {/* Filters */}
      <Card title="Filter and Search Tasks">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0">
            <label htmlFor="filter-status" className={labelClass}>
              Status
            </label>

            <select
              id="filter-status"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className={inputClass}
            >
              <option value="All">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor="filter-priority" className={labelClass}>
              Priority
            </label>

            <select
              id="filter-priority"
              value={filterPriority}
              onChange={(event) => setFilterPriority(event.target.value)}
              className={inputClass}
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor="filter-project" className={labelClass}>
              Project
            </label>

            <select
              id="filter-project"
              value={filterProject}
              onChange={(event) => setFilterProject(event.target.value)}
              className={inputClass}
            >
              <option value="All">All Projects</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search and sort */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="task-search" className={labelClass}>
              Search Tasks
            </label>

            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="task-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search tasks..."
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div className="min-w-0">
            <label htmlFor="task-sort" className={labelClass}>
              Sort Tasks
            </label>

            <div className="relative">
              <ArrowUpDown
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                id="task-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className={`${inputClass} pl-10`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Highest Priority First</option>
                <option value="dueDate">Earliest Due Date First</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={16} />
            Clear Filters
          </button>
        </div>
      </Card>

      {/* Task list */}
      <Card title={`All Tasks (${filteredTasks.length})`}>
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <ListTodo size={36} className="text-gray-400" />

            <p className="font-medium text-gray-700">
              {tasks.length === 0 ? "No tasks yet" : "No matching tasks"}
            </p>

            <p className="max-w-sm text-sm text-gray-500">
              {tasks.length === 0
                ? "Create your first task using the form above."
                : "Try changing your search or filters."}
            </p>

            {tasks.length > 0 && hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <article
                key={task.id}
                className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Task details */}
                  <div className="min-w-0 flex-1 space-y-3">
                    <h2 className="break-words text-base font-semibold text-gray-900 sm:text-lg">
                      {task.title}
                    </h2>

                    {task.description && (
                      <p className="whitespace-pre-wrap break-words text-sm text-gray-500">
                        {task.description}
                      </p>
                    )}

                    {/* Status and priority */}
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          statusStyles[task.status]
                        }`}
                      >
                        {task.status}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          priorityStyles[task.priority]
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                    </div>

                    {/* Project and due date */}
                    <div className="flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:flex-wrap sm:gap-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <FolderKanban size={16} className="shrink-0" />

                        <span className="break-words">{task.project.name}</span>
                      </div>

                      {task.dueDate && (
                        <div className="flex items-center gap-2">
                          <CalendarDays size={16} className="shrink-0" />

                          <span>Due: {task.dueDate.slice(0, 10)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex w-full gap-2 lg:w-auto lg:shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(task)}
                      disabled={isBusy}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 lg:flex-none"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(task.id)}
                      disabled={isBusy}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50 lg:flex-none"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
