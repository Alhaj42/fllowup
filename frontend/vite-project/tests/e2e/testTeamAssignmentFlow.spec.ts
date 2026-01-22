import { test, expect } from '@playwright/test';

test.describe('Team Assignment Flow - E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
  });

  test('should complete full team assignment flow', async ({ page }) => {
    test.slow();

    await page.goto('http://localhost:5174/dashboard');

    await page.click('text=Projects');

    await expect(page.locator('h1')).toContainText('Projects');

    await page.click('[data-testid="project-card"]:first-child');

    await expect(page.locator('h1')).toContainText(/project/i);

    await page.click('text=Team Assignment');

    await expect(page.locator('h2')).toContainText(/team assignment/i);

    await page.click('text=Assign Team Member');

    await expect(page.locator('[data-testid="assignment-form"]')).toBeVisible();

    await page.selectOption('[data-testid="team-member-select"]', 'user-1');

    await expect(page.locator('[data-testid="team-member-select"]')).toHaveValue('user-1');

    await page.selectOption('[data-testid="role-select"]', 'TEAM_MEMBER');

    await page.fill('[data-testid="working-percentage-input"]', '100');

    await page.fill('[data-testid="start-date-input"]', '2024-02-01');

    await page.fill('[data-testid="end-date-input"]', '2024-02-28');

    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/assignment created/i);

    await expect(page.locator('[data-testid="assignment-form"]')).not.toBeVisible();
  });

  test('should validate form before submission', async ({ page }) => {
    await page.goto('http://localhost:5174/projects/project-1');

    await page.click('text=Team Assignment');

    await page.click('text=Assign Team Member');

    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

    await expect(page.locator('[data-testid="error-message"]')).toContainText(/team member is required/i);
  });

  test('should prevent over-allocation warning', async ({ page }) => {
    test.slow();

    await page.goto('http://localhost:5174/projects/project-1');

    await page.click('text=Team Assignment');

    await page.click('text=Assign Team Member');

    await page.selectOption('[data-testid="team-member-select"]', 'user-1');

    await page.fill('[data-testid="working-percentage-input"]', '75');

    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

    await page.click('text=Assign Team Member');

    await page.selectOption('[data-testid="team-member-select"]', 'user-1');

    await page.fill('[data-testid="working-percentage-input"]', '50');

    await page.fill('[data-testid="start-date-input"]', '2024-02-01');

    await page.fill('[data-testid="end-date-input"]', '2024-02-28');

    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="warning-toast"]')).toBeVisible();

    await expect(page.locator('[data-testid="warning-toast"]')).toContainText(/over-allocation warning/i);
  });

  test('should view team allocation dashboard', async ({ page }) => {
    await page.goto('http://localhost:5174/team-allocation');

    await expect(page.locator('h1')).toContainText(/team allocation/i);

    await expect(page.locator('[data-testid="total-members"]')).toContainText('10');

    await expect(page.locator('[data-testid="allocated-members"]')).toContainText('8');

    await expect(page.locator('[data-testid="overallocated-members"]')).toContainText('2');

    const teamMemberRows = await page.locator('[data-testid="team-member-row"]').count();

    expect(teamMemberRows).toBeGreaterThanOrEqual(1);
  });

  test('should filter allocations by project', async ({ page }) => {
    await page.goto('http://localhost:5174/team-allocation');

    await page.selectOption('[data-testid="project-filter"]', 'project-1');

    await expect(page.locator('[data-testid="team-member-row"]')).toHaveCount(3);
  });

  test('should filter allocations by date range', async ({ page }) => {
    await page.goto('http://localhost:5174/team-allocation');

    await page.fill('[data-testid="start-date-filter"]', '2024-02-01');

    await page.fill('[data-testid="end-date-filter"]', '2024-02-28');

    await expect(page.locator('[data-testid="team-member-row"]')).toHaveCount(2);
  });

  test('should show over-allocation warning in dashboard', async ({ page }) => {
    await page.goto('http://localhost:5174/team-allocation');

    const overallocatedCount = await page.locator('[data-testid="overallocated-count"]').textContent();

    expect(overallocatedCount).toContain('2');

    const warningIndicator = page.locator('[data-testid="overallocated-indicator"]');

    await expect(warningIndicator).toBeVisible();
    await expect(warningIndicator).toHaveClass(/warning/i);
  });

  test('should expand assignment details', async ({ page }) => {
    await page.goto('http://localhost:5174/team-allocation');

    await page.click('[data-testid="expand-assignments"]:first-child');

    await expect(page.locator('[data-testid="assignment-details"]')).toBeVisible();

    await expect(page.locator('text=Project Alpha')).toBeVisible();
    await expect(page.locator('text=100%')).toBeVisible();
    await expect(page.locator('text=2024-02-01')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    test.slow();

    await page.route('**/api/v1/team/allocation', route => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }));

    await page.goto('http://localhost:5174/team-allocation');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

    await expect(page.locator('[data-testid="error-message"]')).toContainText(/failed to load allocations/i);

    await page.click('button:has-text("Retry")');

    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
  });

  test('should cancel assignment creation', async ({ page }) => {
    await page.goto('http://localhost:5174/projects/project-1');

    await page.click('text=Team Assignment');

    await page.click('text=Assign Team Member');

    await expect(page.locator('[data-testid="assignment-form"]')).toBeVisible();

    await page.click('button:has-text("Cancel")');

    await expect(page.locator('[data-testid="assignment-form"]')).not.toBeVisible();
  });

  test('should navigate from project detail to team assignment', async ({ page }) => {
    await page.goto('http://localhost:5174/projects/project-1');

    await expect(page.locator('h1')).toBeVisible();

    await page.click('[data-testid="team-assignment-tab"]');

    await expect(page.locator('h2')).toContainText(/team assignment/i);
  });
});
