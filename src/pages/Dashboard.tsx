
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  Activity,
  UserRound,
  LogOut,
  Clock3,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";

import Card from "../components/ui/Card";
import { useGetProjectsQuery } from "../services/projectApi";
import { useGetTasksQuery } from "../services/taskApi";

// Render backend URL in production.
// Empty string allows local requests to use the Vite proxy.
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

type CurrentUser = {
  id: number;
  name: string;
  email: string;
};

type AuthResponse = {
  message: string;
  user: CurrentUser;
};

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authError, setAuthError] = useState("");

  // Fetch projects from backend
  const {
    data: projects = [],
    isLoading: projectsLoading,
    isError: projectsError,
    refetch: refetchProjects,
  } = useGetProjectsQuery();

  // Fetch tasks from backend
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useGetTasksQuery();

  // Fetch logged-in user
  useEffect(() => {
    const controller = new AbortController();

    async function fetchCurrentUser() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (response.status === 401) {
          if (!controller.signal.aborted) {
            navigate("/login", { replace: true });
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load user information");
        }

        const data: AuthResponse = await response.json();

        if (!controller.signal.aborted) {
          setUser(data.user);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setAuthError(
          error instanceof Error
            ? error.message
            : "Unable to load user information"
        );
      } finally {
        if (!controller.signal.aborted) {
          setUserLoading(false);
        }
      }
    }

    void fetchCurrentUser();

    return () => controller.abort();
  }, [navigate]);

  // Logout
  const handleLogout = async () => {
    setLoggingOut(true);
    setAuthError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed. Please try again.");
      }

      // Full reload clears user-specific cached data.
      window.location.replace("/login");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Logout failed"
      );
      setLoggingOut(false);
    }
  };

  // Project statistics
  const projectStats = [
    {
      title: "Total Projects",
      value: projects.length,
      icon: FolderKanban,
      color: "text-blue-600",
    },
    {
      title: "Planning",
      value: projects.filter(
        (project) => project.status === "Planning"
      ).length,
      icon: ListTodo,
      color: "text-amber-600",
    },
    {
      title: "In Progress",
      value: projects.filter(
        (project) => project.status === "In Progress"
      ).length,
      icon: Activity,
      color: "text-blue-600",
    },
    {
      title: "Completed",
      value: projects.filter(
        (project) => project.status === "Completed"
      ).length,
      icon: CheckCircle2,
      color: "text-green-600",
    },
  ];

  // Today's date in local calendar format
  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  // Task statistics
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  );

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  );

  const overdueTasks = tasks.filter(
    (task) =>
      task.status !== "Completed" &&
      task.dueDate != null &&
      task.dueDate.slice(0, 10) < todayString
  );

  const taskStats = [
    {
      title: "Total Tasks",
      value: tasks.length,
      icon: ListTodo,
      color: "text-blue-600",
    },
    {
      title: "In Progress",
      value: inProgressTasks.length,
      icon: Clock3,
      color: "text-amber-600",
    },
    {
      title: "Completed",
      value: completedTasks.length,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      title: "Overdue",
      value: overdueTasks.length,
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ];

  // Upcoming tasks: incomplete tasks due today or later
  const upcomingTasks = tasks
    .filter(
      (task) =>
        task.status !== "Completed" &&
        task.dueDate != null &&
        task.dueDate.slice(0, 10) >= todayString
    )
    .sort((a, b) =>
      (a.dueDate ?? "").localeCompare(b.dueDate ?? "")
    )
    .slice(0, 5);

  if (projectsLoading || tasksLoading || userLoading) {
    return (
      <div role="status" className="p-8 text-center">
        Loading dashboard...
      </div>
    );
  }

  if (projectsError || tasksError) {
    return (
      <Card>
        <p role="alert" className="text-red-600">
          Unable to load dashboard data.
        </p>

        <button
          type="button"
          onClick={() => {
            void refetchProjects();
            void refetchTasks();
          }}
          className="mt-4 text-blue-600 underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard heading and user profile */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Dashboard Overview
          </h1>

          <p className="mt-2 text-text-secondary">
            Live project and task information from your Node.js API.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
            <UserRound
              className="text-blue-600"
              size={22}
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {user ? `Welcome, ${user.name}` : "Welcome"}
            </p>

            <p className="truncate text-xs text-text-secondary">
              {user?.email}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <LogOut size={16} />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>

      {authError && (
        <p role="alert" className="text-sm text-red-600">
          {authError}
        </p>
      )}

      {/* Project statistics */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">
          Project Statistics
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {projectStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.title}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">
                    {stat.title}
                  </p>

                  <Icon
                    size={22}
                    className={stat.color}
                  />
                </div>

                <h3 className="mt-4 text-3xl font-bold">
                  {stat.value}
                </h3>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Task statistics */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">
          Task Statistics
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {taskStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.title}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">
                    {stat.title}
                  </p>

                  <Icon
                    size={22}
                    className={stat.color}
                  />
                </div>

                <h3 className="mt-4 text-3xl font-bold">
                  {stat.value}
                </h3>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent projects */}
      <Card title="Recent Projects">
        {projects.length === 0 ? (
          <p className="text-text-secondary">
            No projects available.
          </p>
        ) : (
          <div className="space-y-3">
            {projects
              .slice(-5)
              .reverse()
              .map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <h3 className="break-words font-semibold">
                    {project.name}
                  </h3>

                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">
                    {project.status}
                  </span>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Upcoming deadlines */}
      <Card title="Upcoming Deadlines">
        {upcomingTasks.length === 0 ? (
          <p className="text-text-secondary">
            No upcoming task deadlines.
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col justify-between gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-semibold">
                    {task.title}
                  </h3>

                  <p className="mt-1 text-sm text-text-secondary">
                    Project: {task.project.name}
                  </p>

                  <p className="mt-1 text-sm text-text-secondary">
                    Priority: {task.priority}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <CalendarDays size={17} />

                  <span>
                    Due: {task.dueDate?.slice(0, 10)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default Dashboard;
