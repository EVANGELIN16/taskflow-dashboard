
import { test, expect, type Page } from "@playwright/test";

const mockUser = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
};

const mockProjects = [
  {
    id: 1,
    name: "TaskFlow Website",
    description: "Project management application",
    status: "In Progress",
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: 2,
    name: "Portfolio Website",
    description: "Personal portfolio",
    status: "Planning",
    createdAt: "2026-10-02T10:00:00.000Z",
  },
];

const mockTasks = [
  {
    id: 1,
    title: "Build Login Page",
    description: "Create authentication form",
    status: "Completed",
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
    title: "Build Kanban Board",
    description: "Implement task board",
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
];

async function mockDashboardApi(page: Page) {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Authenticated",
        user: mockUser,
      }),
    });
  });

  await page.route("**/api/projects", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockProjects),
    });
  });

  await page.route("**/api/tasks", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockTasks),
    });
  });
}

test.describe("TaskFlow Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockDashboardApi(page);
    await page.goto("/dashboard");
  });

  test("shows the dashboard and user profile", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", {
        name: "Dashboard Overview",
      }),
    ).toBeVisible();

    await expect(
      page.getByText("Welcome, Test User"),
    ).toBeVisible();

    await expect(
      page.getByText("test@example.com"),
    ).toBeVisible();
  });

  test("displays project and task statistics", async ({
    page,
  }) => {
    const projectSection = page
      .getByRole("heading", {
        name: "Project Statistics",
      })
      .locator("..");

    const taskSection = page
      .getByRole("heading", {
        name: "Task Statistics",
      })
      .locator("..");

    await expect(
      projectSection.getByText("Total Projects"),
    ).toBeVisible();

    await expect(
      taskSection.getByText("Total Tasks"),
    ).toBeVisible();

    await expect(
      page.getByText("TaskFlow Website"),
    ).toBeVisible();

    await expect(
      page.getByText("Portfolio Website"),
    ).toBeVisible();
  });

  test("navigates to Tasks and Kanban Board", async ({
    page,
  }) => {
    const navigation = page.getByRole("navigation");

    await navigation
      .getByRole("link", { name: "My Tasks" })
      .click();

    await expect(page).toHaveURL(/\/tasks$/);

    await navigation
      .getByRole("link", { name: "Kanban Board" })
      .click();

    await expect(page).toHaveURL(/\/kanban$/);
  });

  test("logs out successfully", async ({ page }) => {
    await page.route(
      "**/api/auth/logout",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Logged out",
          }),
        });
      },
    );

    await page.getByRole("button", {
      name: "Logout",
    }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
