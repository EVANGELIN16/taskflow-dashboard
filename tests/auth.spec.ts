
import { test, expect } from "@playwright/test";

test.describe("TaskFlow Authentication", () => {
  test("displays the login form", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "TaskFlow" }),
    ).toBeVisible();

    await expect(
      page.getByLabel("Email"),
    ).toBeVisible();

    await expect(
      page.getByLabel("Password"),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Sign In" }),
    ).toBeVisible();
  });

  test("shows an error for invalid credentials", async ({
    page,
  }) => {
    await page.route(
      "**/api/auth/login",
      async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Invalid credentials",
          }),
        });
      },
    );

    await page.goto("/login");

    await page.getByLabel("Email").fill(
      "wrong@example.com",
    );

    await page.getByLabel("Password").fill(
      "wrongpassword",
    );

    await page.getByRole("button", {
      name: "Sign In",
    }).click();

    await expect(
      page.getByRole("alert"),
    ).toHaveText("Invalid email or password");
  });

  test("redirects to dashboard after successful login", async ({
    page,
  }) => {
    await page.route(
      "**/api/auth/login",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Login successful",
            user: {
              id: 1,
              name: "Test User",
              email: "test@example.com",
            },
          }),
        });
      },
    );

    await page.route(
      "**/api/auth/me",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: 1,
              name: "Test User",
              email: "test@example.com",
            },
          }),
        });
      },
    );

    await page.goto("/login");

    await page.getByLabel("Email").fill(
      "test@example.com",
    );

    await page.getByLabel("Password").fill(
      "testpassword",
    );

    await page.getByRole("button", {
      name: "Sign In",
    }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
