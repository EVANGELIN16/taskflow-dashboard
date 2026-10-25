
import { test, expect, type Page } from "@playwright/test";

type TaskStatus = "To Do" | "In Progress" | "Completed";
type TaskPriority = "Low" | "Medium" | "High";

type MockTask = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  projectId: number;
  project: { id: number; name: string };
};

const projects = [
  { id: 1, name: "TaskFlow Website", status: "In Progress" },
  { id: 2, name: "Portfolio Website", status: "Planning" },
];

const initialTasks: MockTask[] = [
  {
    id: 1,
    title: "Build Login Page",
    description: "Implement authentication",
    status: "Completed",
    priority: "High",
    dueDate: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    projectId: 1,
    project: { id: 1, name: "TaskFlow Website" },
  },
  {
    id: 2,
    title: "Create Kanban Board",
    description: "Implement drag and drop",
    status: "In Progress",
    priority: "Medium",
    dueDate: null,
    createdAt: "2026-10-02T10:00:00.000Z",
    projectId: 1,
    project: { id: 1, name: "TaskFlow Website" },
  },
  {
    id: 3,
    title: "Write Documentation",
    description: "Document project setup",
    status: "To Do",
    priority: "Low",
    dueDate: null,
    createdAt: "2026-10-03T10:00:00.000Z",
    projectId: 2,
    project: { id: 2, name: "Portfolio Website" },
  },
];

async function mockTasksApi(page: Page) {
  let tasks = initialTasks.map((task) => ({ ...task }));
  let nextId = 4;

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Authenticated",
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
        },
      }),
    });
  });

  await page.route("**/api/projects{,/**}", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(projects),
    });
  });

  await page.route("**/api/tasks{,/**}", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const parts = url.pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    const taskId = lastPart === "tasks" ? null : Number(lastPart);

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tasks),
      });
      return;
    }

    if (method === "POST") {
      const body = request.postDataJSON() as Omit<
        MockTask,
        "id" | "createdAt" | "project"
      >;

      const project = projects.find(
        (item) => item.id === body.projectId,
      );

      const newTask: MockTask = {
        ...body,
        id: nextId++,
        createdAt: new Date().toISOString(),
        project: {
          id: body.projectId,
          name: project?.name ?? "Unknown Project",
        },
      };

      tasks = [...tasks, newTask];

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(newTask),
      });
      return;
    }

    if (method === "PUT" && taskId !== null) {
      const body = request.postDataJSON() as Partial<MockTask>;

      const project = projects.find(
        (item) => item.id === body.projectId,
      );

      const existing = tasks.find((task) => task.id === taskId);

      if (!existing) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "Task not found" }),
        });
        return;
      }

      const updated: MockTask = {
        ...existing,
        ...body,
        project: project
          ? { id: project.id, name: project.name }
          : existing.project,
      };

      tasks = tasks.map((task) =>
        task.id === taskId ? updated : task,
      );

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(updated),
      });
      return;
    }

    if (method === "DELETE" && taskId !== null) {
      tasks = tasks.filter((task) => task.id !== taskId);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Task deleted" }),
      });
      return;
    }

    await route.fulfill({
      status: 405,
      body: "Method not allowed",
    });
  });
}

test.describe("TaskFlow Tasks", () => {
  test.beforeEach(async ({ page }) => {
    await mockTasksApi(page);
    await page.goto("/tasks");

    await expect(
      page.getByRole("heading", { name: "My Tasks" }),
    ).toBeVisible();
  });

  test("displays existing tasks", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Build Login Page" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Create Kanban Board" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "All Tasks (3)" }),
    ).toBeVisible();
  });

  test("creates a new task", async ({ page }) => {
    await page.getByLabel("Task Title").fill("Test Playwright");

    await page.getByLabel("Description").fill(
      "Automated browser testing",
    );

    await page
      .getByLabel("Project", { exact: true })
      .first()
      .selectOption("1");

    await page
      .getByLabel("Status", { exact: true })
      .first()
      .selectOption("To Do");

    await page
      .getByLabel("Priority", { exact: true })
      .first()
      .selectOption("High");

    await page.getByRole("button", {
      name: "Create Task",
    }).click();

    await expect(
      page.getByText("Task created successfully!"),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Test Playwright" }),
    ).toBeVisible();
  });

  test("edits an existing task", async ({ page }) => {
    const task = page.locator("article").filter({
      has: page.getByRole("heading", {
        name: "Build Login Page",
      }),
    });

    await task.getByRole("button", { name: "Edit" }).click();

    await expect(
      page.getByText("Edit Task", { exact: true }),
    ).toBeVisible();

    await page.getByLabel("Task Title").fill(
      "Updated Login Page",
    );

    await page
      .getByLabel("Status", { exact: true })
      .first()
      .selectOption("In Progress");

    await page.getByRole("button", {
      name: "Update Task",
    }).click();

    await expect(
      page.getByText("Task updated successfully!"),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Updated Login Page",
      }),
    ).toBeVisible();
  });

  test("deletes an existing task", async ({ page }) => {
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    const task = page.locator("article").filter({
      has: page.getByRole("heading", {
        name: "Write Documentation",
      }),
    });

    await task.getByRole("button", {
      name: "Delete",
    }).click();

    await expect(
      page.getByText("Task deleted successfully!"),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Write Documentation",
      }),
    ).toHaveCount(0);
  });

  test("searches tasks", async ({ page }) => {
    await page.getByLabel("Search Tasks").fill("Kanban");

    await expect(
      page.getByRole("heading", {
        name: "Create Kanban Board",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Build Login Page",
      }),
    ).toHaveCount(0);

    await expect(
      page.getByText("Showing 1 of 3 tasks"),
    ).toBeVisible();
  });

  test("filters by status and priority", async ({ page }) => {
    await page
      .getByLabel("Status", { exact: true })
      .last()
      .selectOption("Completed");

    await page
      .getByLabel("Priority", { exact: true })
      .last()
      .selectOption("High");

    await expect(
      page.getByRole("heading", {
        name: "Build Login Page",
      }),
    ).toBeVisible();

    await expect(
      page.getByText("Showing 1 of 3 tasks"),
    ).toBeVisible();
  });

  test("sorts tasks by priority", async ({ page }) => {
    await page
      .getByLabel("Sort Tasks")
      .selectOption("priority");

    const titles = await page
      .locator("article h2")
      .allTextContents();

    expect(titles).toEqual([
      "Build Login Page",
      "Create Kanban Board",
      "Write Documentation",
    ]);
  });
});
