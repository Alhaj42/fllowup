import { test, expect } from '@playwright/test';

test.describe('Dashboard Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
  });

  test('should display dashboard page', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should display project list', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-list"]', { timeout: 5000 });
    const projectCards = await page.locator('[data-testid="project-card"]').all();
    expect(projectCards.length).toBeGreaterThan(0);
  });

  test('should display project status indicators', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 5000 });

    const statusBadges = await page.locator('[data-testid="project-status"]').all();
    expect(statusBadges.length).toBeGreaterThan(0);

    const firstBadge = statusBadges[0];
    const badgeText = await firstBadge.textContent();
    expect(['Planned', 'In Progress', 'On Hold', 'Completed', 'Cancelled']).toContain(badgeText || '');
  });

  test('should display progress bars', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 5000 });

    const progressBars = await page.locator('[data-testid="progress-bar"]').all();
    expect(progressBars.length).toBeGreaterThan(0);

    const firstProgressBar = progressBars[0];
    const progressValue = await firstProgressBar.getAttribute('aria-valuenow');
    expect(progressValue).not.toBeNull();
    const progress = parseInt(progressValue || '0', 10);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  test('should display project names', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 5000 });

    const projectCards = await page.locator('[data-testid="project-card"]').all();
    const firstCard = projectCards[0];
    const projectName = await firstCard.locator('[data-testid="project-name"]').textContent();
    expect(projectName).toBeTruthy();
    expect(projectName?.length).toBeGreaterThan(0);
  });

  test('should display contract codes', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 5000 });

    const firstCard = page.locator('[data-testid="project-card"]').first();
    const contractCode = await firstCard.locator('[data-testid="contract-code"]').textContent();
    expect(contractCode).toMatch(/CONTRACT-/i);
  });

  test('should display client names', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 5000 });

    const firstCard = page.locator('[data-testid="project-card"]').first();
    const clientName = await firstCard.locator('[data-testid="client-name"]').textContent();
    expect(clientName).toBeTruthy();
    expect(clientName?.length).toBeGreaterThan(0);
  });

  test('should filter projects by status', async ({ page }) => {
    await page.waitForSelector('[data-testid="status-filter"]', { timeout: 5000 });

    const statusFilter = page.locator('[data-testid="status-filter"]');
    await statusFilter.selectOption('In Progress');
    await page.waitForTimeout(500);

    const projectCards = await page.locator('[data-testid="project-card"]').all();
    for (const card of projectCards) {
      const statusBadge = await card.locator('[data-testid="project-status"]').textContent();
      expect(statusBadge).toBe('In Progress');
    }
  });

  test('should filter projects by phase', async ({ page }) => {
    await page.waitForSelector('[data-testid="phase-filter"]', { timeout: 5000 });

    const phaseFilter = page.locator('[data-testid="phase-filter"]');
    await phaseFilter.selectOption('STUDIES');
    await page.waitForTimeout(500);

    const projectCards = await page.locator('[data-testid="project-card"]').all();
    for (const card of projectCards) {
      const phaseText = await card.locator('[data-testid="project-phase"]').textContent();
      expect(phaseText).toBe('STUDIES');
    }
  });

  test('should navigate to project detail on card click', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 5000 });

    const firstCard = page.locator('[data-testid="project-card"]').first();
    const projectName = await firstCard.locator('[data-testid="project-name"]').textContent();

    await firstCard.click();
    await page.waitForURL(/projects\/\d+/, { timeout: 3000 });

    const detailTitle = await page.locator('h1').textContent();
    expect(detailTitle).toContain(projectName || '');
  });

  test('should display pagination controls', async ({ page }) => {
    await page.waitForSelector('[data-testid="pagination"]', { timeout: 5000 });

    const pagination = page.locator('[data-testid="pagination"]');
    await expect(pagination).toBeVisible();

    const prevButton = page.locator('[data-testid="prev-page"]');
    const nextButton = page.locator('[data-testid="next-page"]');

    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.waitForSelector('[data-testid="pagination"]', { timeout: 5000 });

    const nextButton = page.locator('[data-testid="next-page"]');
    const currentPageInfo = await page.locator('[data-testid="page-info"]').textContent();

    await nextButton.click();
    await page.waitForTimeout(500);

    const newPageInfo = await page.locator('[data-testid="page-info"]').textContent();
    expect(newPageInfo).not.toBe(currentPageInfo);
  });

  test('should display project count', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-count"]', { timeout: 5000 });

    const projectCount = await page.locator('[data-testid="project-count"]').textContent();
    expect(projectCount).toMatch(/\d+\s+projects/i);
  });

  test('should display search functionality', async ({ page }) => {
    await page.waitForSelector('[data-testid="search-input"]', { timeout: 5000 });

    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Test Project');
    await page.waitForTimeout(500);

    const projectCards = await page.locator('[data-testid="project-card"]').all();
    const firstCard = projectCards[0];
    const projectName = await firstCard.locator('[data-testid="project-name"]').textContent();
    expect(projectName).toContain('Test Project');
  });

  test('should handle empty project list', async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.setItem('test-empty-projects', 'true');
    });
    await page.reload();
    await page.waitForSelector('[data-testid="empty-state"]', { timeout: 5000 });

    const emptyMessage = await page.locator('[data-testid="empty-state"]').textContent();
    expect(emptyMessage).toContain('No projects');
  });

  test('should display loading state', async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.setItem('test-loading', 'true');
    });
    await page.reload();

    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible({ timeout: 3000 });
  });

  test('should handle error state', async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.setItem('test-error', 'true');
    });
    await page.reload();

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 3000 });

    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toContain('Failed to load');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    await page.waitForSelector('[data-testid="project-list"]', { timeout: 5000 });

    const projectCards = await page.locator('[data-testid="project-card"]').all();
    expect(projectCards.length).toBeGreaterThan(0);

    const mobileLayout = await page.locator('[data-testid="mobile-layout"]');
    await expect(mobileLayout).toBeVisible();
  });

  test('should display project dates', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 5000 });

    const firstCard = page.locator('[data-testid="project-card"]').first();
    const startDate = await firstCard.locator('[data-testid="start-date"]').textContent();
    const endDate = await firstCard.locator('[data-testid="end-date"]').textContent();

    expect(startDate).toBeTruthy();
    expect(endDate).toBeTruthy();
    expect(startDate).toMatch(/\d{4}-\d{2}-\d{2}|Jan|Feb|Mar/i);
  });

  test('should be accessible via keyboard', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-list"]', { timeout: 5000 });

    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper page title', async ({ page }) => {
    await expect(page).toHaveTitle(/dashboard/i);
  });

  test('should display total project count', async ({ page }) => {
    await page.waitForSelector('[data-testid="total-projects"]', { timeout: 5000 });

    const totalProjects = await page.locator('[data-testid="total-projects"]').textContent();
    const totalCount = parseInt(totalProjects.replace(/\D/g, ''), 10);
    expect(totalCount).toBeGreaterThan(0);
  });
});
