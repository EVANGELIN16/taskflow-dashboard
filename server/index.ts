
import express from "express";
import cors from "cors";
import { prisma } from "./db.js";
import bcrypt from "bcrypt";
import { sessionMiddleware } from "./session.js";
import { requireAuth } from "./authMiddleware.js";

const app = express();

const PORT = Number(process.env.PORT) || 5000;

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://taskflow-dashboard-eight-rouge.vercel.app",
    ],
    credentials: true,
  })
);

type ProjectStatus = "Planning" | "In Progress" | "Completed";

const validStatuses: ProjectStatus[] = [
  "Planning",
  "In Progress",
  "Completed",
];

function isValidStatus(value: unknown): value is ProjectStatus {
  return validStatuses.some((status) => status === value);
}

function parseProjectId(value: string | string[]): number | null {
  if (Array.isArray(value) || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

// Health check
app.get("/", (_req, res) => {
  res.send("TaskFlow Backend is Running!");
});

// All project routes require authentication
app.use("/api/projects", requireAuth);

// GET - Only projects belonging to the logged-in user
app.get("/api/projects", async (req, res) => {
  const userId = req.session.userId!;

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { id: "asc" },
    });

    return res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
});

// GET - Single project belonging to the logged-in user
app.get("/api/projects/:id", async (req, res) => {
  const id = parseProjectId(req.params.id);
  const userId = req.session.userId!;

  if (id === null) {
    return res.status(400).json({
      message: "Invalid project ID",
    });
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({
      message: "Failed to fetch project",
    });
  }
});

// POST - Create a project for the logged-in user
app.post("/api/projects", async (req, res) => {
  const userId = req.session.userId!;
  const { name, status } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      message: "Project name is required",
    });
  }

  if (!isValidStatus(status)) {
    return res.status(400).json({
      message: "Invalid project status",
    });
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        status,
        userId,
      },
    });

    return res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      message: "Failed to create project",
    });
  }
});

// PUT - Update only a project owned by the logged-in user
app.put("/api/projects/:id", async (req, res) => {
  const id = parseProjectId(req.params.id);
  const userId = req.session.userId!;
  const { name, status } = req.body ?? {};

  if (id === null) {
    return res.status(400).json({
      message: "Invalid project ID",
    });
  }

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      message: "Project name is required",
    });
  }

  if (!isValidStatus(status)) {
    return res.status(400).json({
      message: "Invalid project status",
    });
  }

  try {
    const result = await prisma.project.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        name: name.trim(),
        status,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const updatedProject = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    return res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return res.status(500).json({
      message: "Failed to update project",
    });
  }
});

// DELETE - Delete only a project owned by the logged-in user
app.delete("/api/projects/:id", async (req, res) => {
  const id = parseProjectId(req.params.id);
  const userId = req.session.userId!;

  if (id === null) {
    return res.status(400).json({
      message: "Invalid project ID",
    });
  }

  try {
    const result = await prisma.project.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({
      message: "Failed to delete project",
    });
  }
});

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 12
    ) {
      return res.status(400).json({
        message:
          "Valid name, email and password (12+ characters) are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Unable to register user",
    });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regeneration error:", error);

        return res.status(500).json({
          message: "Unable to create login session",
        });
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError);

          return res.status(500).json({
            message: "Unable to save login session",
          });
        }

        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to login",
    });
  }
});

// CHECK CURRENT USER
app.get("/api/auth/me", async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Authenticated",
      user,
    });
  } catch (error) {
    console.error("Authentication check error:", error);

    return res.status(500).json({
      message: "Unable to verify authentication",
    });
  }
});

// LOGOUT
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);

      return res.status(500).json({
        message: "Unable to logout",
      });
    }

  res.clearCookie("taskflow.sid", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});

    return res.status(200).json({
      message: "Logged out successfully",
    });
  });
});


/* =========================================
   TASK MANAGEMENT API
========================================= */

type TaskStatus = "To Do" | "In Progress" | "Completed";
type TaskPriority = "Low" | "Medium" | "High";

const taskStatuses: TaskStatus[] = [
  "To Do",
  "In Progress",
  "Completed",
];

const taskPriorities: TaskPriority[] = [
  "Low",
  "Medium",
  "High",
];

function isTaskStatus(value: unknown): value is TaskStatus {
  return taskStatuses.some((status) => status === value);
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return taskPriorities.some((priority) => priority === value);
}

function parseTaskId(value: string | string[]): number | null {
  if (Array.isArray(value) || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

function parseTaskDueDate(
  value: unknown
): Date | null | undefined {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

// Protect all task routes with authentication.
app.use("/api/tasks", requireAuth);

// GET - Fetch tasks belonging to the current user's projects.
app.get("/api/tasks", async (req, res) => {
  const userId = req.session.userId!;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          userId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);

    return res.status(500).json({
      message: "Failed to fetch tasks",
    });
  }
});

// GET - Fetch a single task owned by the current user.
app.get("/api/tasks/:id", async (req, res) => {
  const id = parseTaskId(req.params.id);
  const userId = req.session.userId!;

  if (id === null) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  try {
    const task = await prisma.task.findFirst({
      where: {
        id,
        project: {
          userId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error("Error fetching task:", error);

    return res.status(500).json({
      message: "Failed to fetch task",
    });
  }
});

// POST - Create a task inside a project owned by the user.
app.post("/api/tasks", async (req, res) => {
  const userId = req.session.userId!;

  const {
    title,
    description,
    status,
    priority,
    dueDate,
    projectId,
  } = req.body ?? {};

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({
      message: "Task title is required",
    });
  }

  if (
    typeof projectId !== "number" ||
    !Number.isSafeInteger(projectId) ||
    projectId <= 0
  ) {
    return res.status(400).json({
      message: "Valid project ID is required",
    });
  }

  if (description !== undefined &&
      description !== null &&
      typeof description !== "string") {
    return res.status(400).json({
      message: "Description must be text",
    });
  }

  const taskStatus = status ?? "To Do";
  const taskPriority = priority ?? "Medium";

  if (!isTaskStatus(taskStatus)) {
    return res.status(400).json({
      message: "Invalid task status",
    });
  }

  if (!isTaskPriority(taskPriority)) {
    return res.status(400).json({
      message: "Invalid task priority",
    });
  }

  const parsedDueDate = parseTaskDueDate(dueDate ?? null);

  if (parsedDueDate === undefined) {
    return res.status(400).json({
      message: "Invalid due date",
    });
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: taskStatus,
        priority: taskPriority,
        dueDate: parsedDueDate,
        projectId,
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);

    return res.status(500).json({
      message: "Failed to create task",
    });
  }
});

// PUT - Update a task belonging to the user's project.
app.put("/api/tasks/:id", async (req, res) => {
  const id = parseTaskId(req.params.id);
  const userId = req.session.userId!;

  if (id === null) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  const {
    title,
    description,
    status,
    priority,
    dueDate,
    projectId,
  } = req.body ?? {};

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({
      message: "Task title is required",
    });
  }

  if (!isTaskStatus(status)) {
    return res.status(400).json({
      message: "Invalid task status",
    });
  }

  if (!isTaskPriority(priority)) {
    return res.status(400).json({
      message: "Invalid task priority",
    });
  }

  if (
    typeof projectId !== "number" ||
    !Number.isSafeInteger(projectId) ||
    projectId <= 0
  ) {
    return res.status(400).json({
      message: "Valid project ID is required",
    });
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return res.status(400).json({
      message: "Description must be text",
    });
  }

  const parsedDueDate = parseTaskDueDate(dueDate ?? null);

  if (parsedDueDate === undefined) {
    return res.status(400).json({
      message: "Invalid due date",
    });
  }

  try {
    // Verify the destination project belongs to this user.
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Update only if the existing task belongs to this user.
    const result = await prisma.task.updateMany({
      where: {
        id,
        project: {
          userId,
        },
      },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status,
        priority,
        dueDate: parsedDueDate,
        projectId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const updatedTask = await prisma.task.findFirst({
      where: {
        id,
        project: {
          userId,
        },
      },
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);

    return res.status(500).json({
      message: "Failed to update task",
    });
  }
});

// DELETE - Delete a task belonging to the current user.
app.delete("/api/tasks/:id", async (req, res) => {
  const id = parseTaskId(req.params.id);
  const userId = req.session.userId!;

  if (id === null) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  try {
    const result = await prisma.task.deleteMany({
      where: {
        id,
        project: {
          userId,
        },
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting task:", error);

    return res.status(500).json({
      message: "Failed to delete task",
    });
  }
});

// Start backend
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TaskForge backend running on port ${PORT}`);
});
