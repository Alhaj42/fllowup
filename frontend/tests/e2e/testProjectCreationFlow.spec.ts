import { test, expect } from '@playwright/test';

test.describe('Project Creation Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'manager@example.com');
    await page.fill('input[name="password"]', 'test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should navigate to project creation form', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');

    await page.click('button:has-text("Create Project")');
    await page.waitForURL('**/projects/create');

    await expect(page.locator('h1:has-text("Create Project")')).toBeVisible();
  });

  test('should create project with required fields', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/create');

    await page.fill('input[name="name"]', 'E2E Test Project');
    await page.fill('input[name="contractCode"]', 'E2E-001');

    await page.click('label:has-text("Client") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Test Client")');

    await page.fill('input[name="contractSigningDate"]', '2025-01-01');
    await page.fill('input[name="builtUpArea"]', '1500');
    await page.fill('input[name="startDate"]', '2025-01-15');
    await page.fill('input[name="estimatedEndDate"]', '2025-03-15');

    await page.click('button:has-text("Create Project")');

    await expect(page.locator('.MuiAlert-filledSuccess')).toBeVisible();
    await expect(page.locator('.MuiAlert-filledSuccess:has-text("Project created successfully")')).toBeVisible();

    await page.waitForURL('**/projects/**');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/create');

    await page.click('button:has-text("Create Project")');

    await expect(page.locator('text=Project name is required')).toBeVisible();
    await expect(page.locator('text=Contract code is required')).toBeVisible();
    await expect(page.locator('text=Client is required')).toBeVisible();
    await expect(page.locator('text=Start date is required')).toBeVisible();
    await expect(page.locator('text=Estimated end date is required')).toBeVisible();
  });

  test('should validate date sequence', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/create');

    await page.fill('input[name="name"]', 'Date Test Project');
    await page.fill('input[name="contractCode"]', 'DATE-001');
    await page.click('label:has-text("Client") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Test Client")');
    await page.fill('input[name="contractSigningDate"]', '2025-01-01');
    await page.fill('input[name="startDate"]', '2025-03-01');
    await page.fill('input[name="estimatedEndDate"]', '2025-01-01');

    await page.click('button:has-text("Create Project")');

    await expect(page.locator('text=Estimated end date must be after start date')).toBeVisible();
  });

  test('should create project with all optional fields', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/create');

    await page.fill('input[name="name"]', 'Full Project Test');
    await page.fill('input[name="contractCode"]', 'FULL-001');
    await page.click('label:has-text("Client") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Test Client")');
    await page.fill('input[name="contractSigningDate"]', '2025-01-01');
    await page.fill('input[name="builtUpArea"]', '2500');
    await page.click('label:has-text("License Type") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Residential")');
    await page.click('label:has-text("Project Type") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Renovation")');
    await page.fill('textarea[name="requirements"]', 'Test requirements for full project');
    await page.fill('input[name="startDate"]', '2025-01-15');
    await page.fill('input[name="estimatedEndDate"]', '2025-03-15');
    await page.fill('input[name="modificationAllowedTimes"]', '3');
    await page.fill('input[name="modificationDaysPerTime"]', '5');

    await page.click('button:has-text("Create Project")');

    await expect(page.locator('.MuiAlert-filledSuccess')).toBeVisible();
    await page.waitForURL('**/projects/**');
  });

  test('should navigate back on cancel', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/create');

    await page.click('button:has-text("Cancel")');

    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/create');

    await page.fill('input[name="name"]', 'Loading Test Project');
    await page.fill('input[name="contractCode"]', 'LOAD-001');
    await page.click('label:has-text("Client") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Test Client")');
    await page.fill('input[name="contractSigningDate"]', '2025-01-01');
    await page.fill('input[name="builtUpArea"]', '1000');
    await page.fill('input[name="startDate"]', '2025-01-15');
    await page.fill('input[name="estimatedEndDate"]', '2025-03-15');

    const submitButton = page.locator('button:has-text("Create Project")');
    await submitButton.click();

    await expect(page.locator('.MuiCircularProgress-root')).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test('should handle error responses gracefully', async ({ page, context }) => {
    await context.route('http://localhost:3000/api/v1/projects', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('http://localhost:5173/projects/create');

    await page.fill('input[name="name"]', 'Error Test Project');
    await page.fill('input[name="contractCode"]', 'ERR-001');
    await page.click('label:has-text("Client") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Test Client")');
    await page.fill('input[name="contractSigningDate"]', '2025-01-01');
    await page.fill('input[name="builtUpArea"]', '1000');
    await page.fill('input[name="startDate"]', '2025-01-15');
    await page.fill('input[name="estimatedEndDate"]', '2025-03-15');

    await page.click('button:has-text("Create Project")');

    await expect(page.locator('.MuiAlert-filledError')).toBeVisible();
    await expect(page.locator('text=Failed to save project')).toBeVisible();
  });

  test('should allow editing existing project', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');

    await page.click('.ProjectCard:has-text("Test Project")');
    await page.waitForURL('**/projects/**');

    await page.click('button:has-text("Edit")');
    await page.waitForURL('**/projects/**/edit');

    await expect(page.locator('h1:has-text("Edit Project")')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toHaveValue('Test Project');

    await page.fill('input[name="name"]', 'Edited Test Project');
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('.MuiAlert-filledSuccess')).toBeVisible();
    await expect(page.locator('.MuiAlert-filledSuccess:has-text("Project updated successfully")')).toBeVisible();
  });

  test('should handle version conflict on concurrent edit', async ({ page, context }) => {
    await context.route('http://localhost:3000/api/v1/projects/**', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Version conflict: The record was modified by another user' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('http://localhost:5173/projects/existing-project-id/edit');

    await page.fill('input[name="name"]', 'Concurrent Edit');
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('.MuiAlert-filledError')).toBeVisible();
    await expect(page.locator('text=Version conflict')).toBeVisible();
  });

  test('should display project details after creation', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/create');

    await page.fill('input[name="name"]', 'Detail Test Project');
    await page.fill('input[name="contractCode"]', 'DTL-001');
    await page.click('label:has-text("Client") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Test Client")');
    await page.fill('input[name="contractSigningDate"]', '2025-01-01');
    await page.fill('input[name="builtUpArea"]', '1000');
    await page.fill('input[name="startDate"]', '2025-01-15');
    await page.fill('input[name="estimatedEndDate"]', '2025-03-15');

    await page.click('button:has-text("Create Project")');

    await page.waitForURL('**/projects/**');

    await expect(page.locator('text=Detail Test Project')).toBeVisible();
    await expect(page.locator('text=DTL-001')).toBeVisible();
    await expect(page.locator('text=Test Client')).toBeVisible();
  });

  test('should be accessible via keyboard', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/create');

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="name"]')).toBeFocused();

    await page.keyboard.type('Keyboard Test Project');
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="contractCode"]')).toBeFocused();

    await page.keyboard.type('KEY-001');
    await page.keyboard.press('Tab');
    await expect(page.locator('label:has-text("Client") + div >> .MuiSelect-root')).toBeFocused();
  });

  test('should work with screen reader', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/create');

    const formTitle = page.locator('h1:has-text("Create Project")');
    await expect(formTitle).toHaveAttribute('role', 'heading');

    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveAttribute('aria-required', 'true');
    await expect(nameInput).toHaveAccessibleName();

    const submitButton = page.locator('button:has-text("Create Project")');
    await expect(submitButton).toHaveAccessibleName();
  });

  test('should maintain state across navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/create');

    await page.fill('input[name="name"]', 'Persistent Project');
    await page.fill('input[name="contractCode"]', 'PERS-001');
    await page.click('button:has-text("Back")');

    await page.waitForURL('**/dashboard');
    await page.goto('http://localhost:5173/projects/create');

    await expect(page.locator('input[name="name"])).toHaveValue('');
    await expect(page.locator('input[name="contractCode"]')).toHaveValue('');
  });
});
