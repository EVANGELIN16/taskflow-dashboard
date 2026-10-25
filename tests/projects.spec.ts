
import {
  test,
  expect,
  type Page,
} from "@playwright/test";

type ProjectStatus =
  | "Planning"
  | "In Progress"
  | "Completed";

type MockProject = {
  id: number;
  name: string;
  status: ProjectStatus;
  createdAt: string;
};

const initialProjects: MockProject[] = [
  {
    id: 1,
    name: "TaskFlow Website",
    status: "In Progress",
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: 2,
    name: "Portfolio Website",
    status: "Planning",
    createdAt: "2026-10-02T10:00:00.000Z",
  },
];

async function mockProjectsApi(
  page: Page,
  startingProjects: MockProject[] = initialProjects,
) {
  let projects = startingProjects.map((project) => ({
    ...project,
  }));

  let nextId =
    Math.max(0, ...projects.map((project) => project.id)) + 1;

  // Mock authentication for protected routes.
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

  // Mock project GET, POST, PUT and DELETE requests.
 await page.route("**/api/projects{,/**}", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());

    const pathParts = url.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];

    const projectId =
      lastPart === "projects" ? null : Number(lastPart);

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(projects),
      });
      return;
    }

    if (method === "POST") {
      const body = request.postDataJSON() as {
        name: string;
        status: ProjectStatus;
      };

      const newProject: MockProject = {
        id: nextId++,
        name: body.name,
        status: body.status,
        createdAt: new Date().toISOString(),
      };

      projects = [...projects, newProject];

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(newProject),
      });
      return;
    }

    if (method === "PUT" && projectId !== null) {
      const body = request.postDataJSON() as {
        name: string;
        status: ProjectStatus;
      };

      const existing = projects.find(
        (project) => project.id === projectId,
      );

      if (!existing) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Project not found",
          }),
        });
        return;
      }

      const updatedProject = {
        ...existing,
        name: body.name,
        status: body.status,
      };

      projects = projects.map((project) =>
        project.id === projectId
          ? updatedProject
          : project,
      );

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(updatedProject),
      });
      return;
    }

    if (method === "DELETE" && projectId !== null) {
      projects = projects.filter(
        (project) => project.id !== projectId,
      );

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Project deleted",
        }),
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

test.describe("TaskFlow Projects CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await mockProjectsApi(page);
    await page.goto("/projects");
  });

  test("displays existing projects", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Projects",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "TaskFlow Website",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Portfolio Website",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "All Projects (2)",
      }),
    ).toBeVisible();
  });

  test("creates a new project", async ({ page }) => {
    await page.getByLabel("Project Name").fill(
      "Playwright Test Project",
    );

    await page.getByLabel("Status").selectOption(
      "Planning",
    );

    await page.getByRole("button", {
      name: "Add Project",
    }).click();

    await expect(
      page.getByRole("heading", {
        name: "Playwright Test Project",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "All Projects (3)",
      }),
    ).toBeVisible();
  });

  test("edits an existing project", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "TaskFlow Website",
      }),
    ).toBeVisible();

    // Select the Edit button belonging to this project.
    const projectCard = page
      .getByRole("heading", {
        name: "TaskFlow Website",
      })
      .locator("..")
      .locator("..");

    await projectCard.getByRole("button", {
      name: "Edit",
    }).click();

    await expect(
      page.getByRole("heading", {
        name: "Edit Project",
      }),
    ).toBeVisible();

    await page.getByLabel("Project Name").fill(
      "Updated TaskFlow Website",
    );

    await page.getByLabel("Status").selectOption(
      "Completed",
    );

    await page.getByRole("button", {
      name: "Update Project",
    }).click();

    await expect(
      page.getByRole("heading", {
        name: "Updated TaskFlow Website",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "TaskFlow Website",
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("deletes an existing project", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Portfolio Website",
      }),
    ).toBeVisible();

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    const projectCard = page
      .getByRole("heading", {
        name: "Portfolio Website",
      })
      .locator("..")
      .locator("..");

    await projectCard.getByRole("button", {
      name: "Delete",
    }).click();

    await expect(
      page.getByRole("heading", {
        name: "Portfolio Website",
      }),
    ).toHaveCount(0);

    await expect(
      page.getByRole("heading", {
        name: "All Projects (1)",
      }),
    ).toBeVisible();
  });
});

test("shows an empty state when no projects exist", async ({
  page,
}) => {
  await mockProjectsApi(page, []);
  await page.goto("/projects");

  await expect(
    page.getByText(
      "No projects yet. Create your first project.",
    ),
  ).toBeVisible();
});

