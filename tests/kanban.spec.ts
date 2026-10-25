
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
  project: {
    id: number;
    name: string;
  };
};

const projects = [
  {
    id: 1,
    name: "TaskFlow Website",
    status: "In Progress",
  },
  {
    id: 2,
    name: "Portfolio Website",
    status: "Planning",
  },
];

const initialTasks: MockTask[] = [
  {
    id: 1,
    title: "Build Login Page",
    description: "Create authentication UI",
    status: "To Do",
    priority: "High",
    dueDate: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    projectId: 1,
    project: {
      id: 1,
      name: "TaskFlow Website",
    },
  },
  {
    id: 2,
    title: "Create Kanban Board",
    description: "Implement task management",
    status: "In Progress",
    priority: "Medium",
    dueDate: null,
    createdAt: "2026-10-02T10:00:00.000Z",
    projectId: 1,
    project: {
      id: 1,
      name: "TaskFlow Website",
    },
  },
  {
    id: 3,
    title: "Write Documentation",
    description: "Document project setup",
    status: "Completed",
    priority: "Low",
    dueDate: null,
    createdAt: "2026-10-03T10:00:00.000Z",
    projectId: 2,
    project: {
      id: 2,
      name: "Portfolio Website",
    },
  },
];

async function mockKanbanApi(
  page: Page,
  startingTasks: MockTask[] = initialTasks,
  failUpdates = false,
) {
  let tasks = startingTasks.map((task) => ({
    ...task,
    project: { ...task.project },
  }));

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
    const parts = new URL(request.url())
      .pathname.split("/")
      .filter(Boolean);

    const lastPart = parts[parts.length - 1];
    const taskId =
      lastPart === "tasks" ? null : Number(lastPart);

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tasks),
      });
      return;
    }

    if (method === "PUT" && taskId !== null) {
      if (failUpdates) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Unable to update task",
          }),
        });
        return;
      }

      const body = request.postDataJSON() as Partial<MockTask>;

      const existing = tasks.find(
        (task) => task.id === taskId,
      );

      if (!existing) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Task not found",
          }),
        });
        return;
      }

      const updatedTask: MockTask = {
        ...existing,
        ...body,
        project: existing.project,
      };

      tasks = tasks.map((task) =>
        task.id === taskId ? updatedTask : task,
      );

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(updatedTask),
      });
      return;
    }

    await route.fulfill({
      status: 405,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Method not allowed",
      }),
    });
  });
}

function getColumn(page: Page, status: TaskStatus) {
  return page.locator("section").filter({
    has: page.getByRole("heading", {
      name: status,
      exact: true,
    }),
  });
}

test.describe("TaskFlow Kanban Board", () => {
  test.beforeEach(async ({ page }) => {
    await mockKanbanApi(page);
    await page.goto("/kanban");

    await expect(
  page.getByRole("heading", {
    name: "Kanban Board",
    exact: true,
  }),
).toBeVisible();
 });

  test("displays tasks in correct columns", async ({
    page,
  }) => {
    await expect(
      getColumn(page, "To Do").getByText("Build Login Page"),
    ).toBeVisible();

    await expect(
      getColumn(page, "In Progress").getByText(
        "Create Kanban Board",
      ),
    ).toBeVisible();

    await expect(
      getColumn(page, "Completed").getByText(
        "Write Documentation",
      ),
    ).toBeVisible();
  });

  test("filters tasks by project", async ({ page }) => {
    await page.getByLabel("Filter by Project").selectOption(
      "1",
    );

    await expect(
      page.getByText("Build Login Page"),
    ).toBeVisible();

    await expect(
      page.getByText("Create Kanban Board"),
    ).toBeVisible();

    await expect(
      page.getByText("Write Documentation"),
    ).toHaveCount(0);
  });

  test("moves a task using status dropdown", async ({
    page,
  }) => {
    const taskCard = getColumn(page, "To Do").locator(
      '[draggable="true"]',
    );

    await taskCard.getByLabel("Move to").selectOption(
      "Completed",
    );

    await expect(
      getColumn(page, "Completed").getByText(
        "Build Login Page",
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        '"Build Login Page" moved to Completed.',
      ),
    ).toBeVisible();
  });

  test("drags a task to another column", async ({
    page,
  }) => {
    const sourceTask = getColumn(page, "To Do").locator(
      '[draggable="true"]',
    );

    const destination = getColumn(page, "In Progress");

    await sourceTask.dragTo(destination);

    await expect(
      destination.getByText("Build Login Page"),
    ).toBeVisible();

    await expect(
      page.getByText(
        '"Build Login Page" moved to In Progress.',
      ),
    ).toBeVisible();
  });

  test("shows an error when task update fails", async ({
    page,
  }) => {
    await page.route("**/api/tasks/1", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Server error",
        }),
      });
    });

    const taskCard = getColumn(page, "To Do").locator(
      '[draggable="true"]',
    );

    await taskCard.getByLabel("Move to").selectOption(
      "Completed",
    );

    await expect(
      page.getByRole("alert"),
    ).toHaveText(
      'Unable to update "Build Login Page". Please try again.',
    );
  });

  test("shows empty columns when no tasks exist", async ({
    page,
  }) => {
    await mockKanbanApi(page, []);
    await page.reload();

    await expect(
      page.getByText("Drop tasks here."),
    ).toHaveCount(3);
  });
  
});
