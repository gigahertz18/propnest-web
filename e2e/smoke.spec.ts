import { test, expect } from "@playwright/test"

test("unauthenticated root redirects to login and renders the login form", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/login(\?|$)/)
  await expect(page.getByLabel("Username or email")).toBeVisible()
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible()
})
