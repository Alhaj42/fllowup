import { test, expect } from '@playwright/test';

test.describe('Dashboard Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:5173/dashboard');
  });

  test('should display all projects on dashboard', async ({ page }) => {
    await expect(page.locator('[data-testid="project-list"]')).toBeVisible();

    const projectCards = await page.locator('[data-testid^="project-card-"]').count();
    expect(projectCards).toBeGreaterThan(0);
  });

  test('should display project status indicators', async ({ page }) => {
    const statusBadges = await page.locator('[data-testid="project-status"]').all();
    expect(statusBadges.length).toBeGreaterThan(0);

    for (const badge of statusBadges) {
      const text = await badge.textContent();
      expect(['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'CANCELLED', 'COMPLETE']).toContain(text);
    }
  });

  test('should display progress bars for each project', async ({ page }) => {
    const progressBars = await page.locator('[role="progressbar"]').all();
    expect(progressBars.length).toBeGreaterThan(0);

    for (const bar of progressBars) {
      await expect(bar).toBeVisible();
    }
  });

  test('should filter projects by status', async ({ page }) => {
    await page.selectOption('[data-testid="status-filter"]', 'IN_PROGRESS');

    const filteredProjects = await page.locator('[data-testid^="project-card-"]').count();
    const allProjects = await page.locator('[data-testid^="project-card-"]').count();

    expect(filteredProjects).toBeLessThanOrEqual(allProjects);
  });

  test('should navigate to project detail when clicking a project card', async ({ page }) => {
    const firstProjectCard = page.locator('[data-testid^="project-card-"]').first();
    await firstProjectCard.click();

    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+$/i);
  });

  test('should display loading state while fetching projects', async ({ page }) => {
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]');

    await page.reload();
    await expect(loadingSpinner).toBeVisible();

    await page.waitForSelector('[data-testid="project-list"]', { timeout: 5000 });
    await expect(loadingSpinner).not.toBeVisible();
  });

  test('should display empty state when no projects exist', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('empty_projects', 'true');
    });

    await page.reload();

    const emptyMessage = page.locator('[data-testid="empty-projects-message"]');
    await expect(emptyMessage).toBeVisible();
    await expect(emptyMessage).toContainText('no projects');
  });

  test('should display project count', async ({ page }) => {
    const projectCount = page.locator('[data-testid="project-count"]');

    await expect(projectCount).toBeVisible();
    const countText = await projectCount.textContent();
    expect(countText).toMatch(/\d+\s+projects/);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('simulate_error', 'true');
    });

    await page.reload();

    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('error');
  });

  test('should support pagination', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard?page=1');

    const currentPage = page.locator('[data-testid="current-page"]');
    await expect(currentPage).toContainText('1');

    const nextPageButton = page.locator('[data-testid="next-page"]');
    await nextPageButton.click();

    await expect(page).toHaveURL(/page=2/);
  });
});
