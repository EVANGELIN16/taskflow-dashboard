
import { test, expect } from "@playwright/test";

test.describe("TaskFlow Login Page", () => {
  test("should display the login page", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login/);

    await expect(
      page.getByRole("button", {
        name: /log\s*in|sign\s*in/i,
      }),
    ).toBeVisible();
  });

  test("should display the registration link", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("link", {
        name: /register|sign\s*up|create account/i,
      }),
    ).toBeVisible();
  });
});
