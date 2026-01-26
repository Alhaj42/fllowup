import { test, expect } from '@playwright/test';

test.describe('Team Assignment Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'manager@example.com');
    await page.fill('input[name="password"]', 'test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should navigate to team allocation view', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');

    await page.click('button:has-text("Team Allocation")');
    await page.waitForURL('**/projects/test-project-id/team');

    await expect(page.locator('h1:has-text("Team Allocation")')).toBeVisible();
  });

  test('should display team allocations list', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await expect(page.locator('.team-allocation-list')).toBeVisible();
    await expect(page.locator('text=Alice Johnson')).toBeVisible();
    await expect(page.locator('text=Bob Smith')).toBeVisible();
  });

  test('should show allocation percentages', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await expect(page.locator('text=75%')).toBeVisible();
    await expect(page.locator('text=50%')).toBeVisible();
  });

  test('should show over-allocation warning', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await expect(page.locator('.over-allocation-warning')).toBeVisible();
    await expect(page.locator('text=Over-allocated')).toBeVisible();
  });

  test('should open team assignment form', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await page.click('button:has-text("Assign Team Member")');
    await page.waitForURL('**/team/assign');

    await expect(page.locator('h2:has-text("Assign Team Member")')).toBeVisible();
  });

  test('should validate team member selection', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team/assign');

    await page.click('button:has-text("Assign")');

    await expect(page.locator('text=Team member is required')).toBeVisible();
  });

  test('should validate allocation percentage range', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team/assign');

    await page.click('label:has-text("Team Member") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Alice Johnson")');

    await page.fill('input[name="workingPercent"]', '150');

    await page.click('button:has-text("Assign")');

    await expect(page.locator('text=Allocation must be between 0 and 100')).toBeVisible();
  });

  test('should validate date sequence', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team/assign');

    await page.click('label:has-text("Team Member") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Alice Johnson")');

    await page.fill('input[name="startDate"]', '2025-03-01');
    await page.fill('input[name="endDate"]', '2025-01-01');

    await page.click('button:has-text("Assign")');

    await expect(page.locator('text=End date must be after start date')).toBeVisible();
  });

  test('should detect over-allocation and warn', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team/assign');

    await page.click('label:has-text("Team Member") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Alice Johnson")');

    await page.fill('input[name="workingPercent"]', '75');

    await expect(page.locator('text=User is currently allocated 80%')).toBeVisible();
    await expect(page.locator('.over-allocation-warning')).toBeVisible();
  });

  test('should create assignment successfully', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team/assign');

    await page.click('label:has-text("Team Member") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Alice Johnson")');

    await page.fill('input[name="workingPercent"]', '50');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.fill('input[name="endDate"]', '2025-03-01');

    await page.click('button:has-text("Assign")');

    await expect(page.locator('.MuiAlert-filledSuccess')).toBeVisible();
    await expect(page.locator('text=Team member assigned successfully')).toBeVisible();
  });

  test('should filter allocations by phase', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await page.click('label:has-text("Filter by Phase") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Studies")');

    await expect(page.locator('text=50%')).toBeVisible();
  });

  test('should sort allocations by percentage', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await page.click('label:has-text("Sort by") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Allocation (High to Low)")');

    await expect(page.locator('.team-allocation-list')).toBeVisible();
  });

  test('should show assignment details on expand', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await page.click('.team-allocation-card:has-text("Alice Johnson")');

    await expect(page.locator('text=Studies - 50%')).toBeVisible();
    await expect(page.locator('text=Design - 25%')).toBeVisible();
    await expect(page.locator('text=Jan 1, 2025')).toBeVisible();
    await expect(page.locator('text=Mar 1, 2025')).toBeVisible();
  });

  test('should remove assignment', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await page.click('.team-allocation-card:has-text("Alice Johnson")');

    await page.click('button:has-text("Remove Assignment")');

    await expect(page.locator('.MuiAlert-filledSuccess')).toBeVisible();
    await expect(page.locator('text=Assignment removed successfully')).toBeVisible();
  });

  test('should navigate back on cancel', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team/assign');

    await page.click('button:has-text("Cancel")');

    await page.waitForURL('**/projects/test-project-id/team');
    await expect(page.locator('h1:has-text("Team Allocation")')).toBeVisible();
  });

  test('should show loading state during assignment creation', async ({ page, context }) => {
    await context.route('http://localhost:3000/api/v1/phases/**/assignments', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'new-assign-id' }),
        delay: 1000,
      });
    });

    await page.goto('http://localhost:5173/projects/test-project-id/team/assign');

    await page.click('label:has-text("Team Member") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Alice Johnson")');
    await page.fill('input[name="workingPercent"]', '50');

    const submitButton = page.locator('button:has-text("Assign")');
    await submitButton.click();

    await expect(page.locator('.MuiCircularProgress-root')).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test('should handle error responses gracefully', async ({ page, context }) => {
    await context.route('http://localhost:3000/api/v1/phases/**/assignments', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('http://localhost:5173/projects/test-project-id/team/assign');

    await page.click('label:has-text("Team Member") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Alice Johnson")');
    await page.fill('input[name="workingPercent"]', '50');

    await page.click('button:has-text("Assign")');

    await expect(page.locator('.MuiAlert-filledError')).toBeVisible();
    await expect(page.locator('text=Failed to assign team member')).toBeVisible();
  });

  test('should display team member avatars', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    const avatars = page.locator('.avatar-initials');
    await expect(avatars).toHaveCount(2);

    await expect(page.locator('text=AJ')).toBeVisible();
    await expect(page.locator('text=BS')).toBeVisible();
  });

  test('should work with keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page.locator('.team-allocation-card')).toBeFocused();
  });

  test('should be accessible via screen reader', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    const teamList = page.locator('[role="list"]');
    await expect(teamList).toHaveAttribute('aria-label', 'Team allocations list');

    const teamCards = page.locator('.team-allocation-card');
    const firstCard = teamCards.first();
    await expect(firstCard).toHaveAttribute('role', 'article');
    await expect(firstCard).toHaveAttribute('aria-label');
  });

  test('should handle empty allocation list', async ({ page, context }) => {
    await context.route('http://localhost:3000/api/v1/team/allocation', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await expect(page.locator('text=No team allocations found')).toBeVisible();
    await expect(page.locator('button:has-text("Assign First Team Member")')).toBeVisible();
  });

  test('should show role badges for assignments', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await page.click('.team-allocation-card:has-text("Alice Johnson")');

    await expect(page.locator('.MuiChip-content:has-text("TEAM_MEMBER")')).toBeVisible();
  });

  test('should support responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/projects/test-project-id/team');

    await expect(page.locator('.team-allocation-list')).toBeVisible();

    const teamCards = page.locator('.team-allocation-card');
    await expect(teamCards).toHaveCount(2);
  });

  test('should allow team leader assignment', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/phase/test-phase-id');

    await page.click('button:has-text("Assign Team Leader")');

    await page.click('label:has-text("Team Leader") + div >> .MuiSelect-root');
    await page.click('.MuiMenuItem:has-text("Team Leader User")');

    await page.click('button:has-text("Save")');

    await expect(page.locator('.MuiAlert-filledSuccess')).toBeVisible();
    await expect(page.locator('text=Team leader assigned successfully')).toBeVisible();
  });

  test('should remove team leader assignment', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id/phase/test-phase-id');

    await page.click('button:has-text("Remove Team Leader")');

    await expect(page.locator('.MuiAlert-filledSuccess')).toBeVisible();
    await expect(page.locator('text=Team leader removed successfully')).toBeVisible();
  });
});
