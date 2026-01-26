import { test, expect } from '@playwright/test';

test.describe('Task Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Mock authentication - in real tests, this would be real login
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'TEAM_LEADER',
      }));
    });

    await page.reload();
  });

  test('should display task list for assigned phase', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');

    await expect(page.locator('h1').filter({ hasText: 'Test Project' })).toBeVisible();

    // Navigate to phase tasks
    await page.click('text=Studies');

    await expect(page.locator('.task-list')).toBeVisible();
    await expect(page.locator('text=No tasks found')).not.toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await page.click('text=Create Task');

    await expect(page.locator('dialog').filter({ hasText: /Create Task|New Task/i })).toBeVisible();

    await page.fill('input[name="code"]', 'TASK-001');
    await page.fill('textarea[name="description"]', 'Test task description');
    await page.fill('input[name="duration"]', '5');
    await page.selectOption('select[name="status"]', 'PLANNED');

    await page.click('dialog button:has-text("Create")');

    await expect(page.locator('.task-list').toContainText('TASK-001'));
    await expect(page.locator('.task-list').toContainText('Test task description'));
  });

  test('should edit an existing task', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await page.locator('.task-item').first().locator('button[aria-label="Edit task"]').click();

    await expect(page.locator('dialog').filter({ hasText: /Update Task|Edit Task/i })).toBeVisible();

    await page.fill('textarea[name="description"]', 'Updated task description');

    await page.click('dialog button:has-text("Update")');

    await expect(page.locator('.task-list').toContainText('Updated task description'));
  });

  test('should delete a task', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    const taskCountBefore = await page.locator('.task-item').count();

    await page.locator('.task-item').first().locator('button[aria-label="Delete task"]').click();

    await page.click('button:has-text("Delete")'); // Confirm deletion

    const taskCountAfter = await page.locator('.task-item').count();

    expect(taskCountAfter).toBe(taskCountBefore - 1);
  });

  test('should assign task to team member', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await page.click('text=Create Task');

    await page.fill('input[name="code"]', 'TASK-ASSIGNED');
    await page.fill('textarea[name="description"]', 'Assigned task');
    await page.fill('input[name="duration"]', '7');
    await page.selectOption('select[name="assignedTeamMemberId"]', 'John Doe');

    await page.click('dialog button:has-text("Create")');

    await expect(page.locator('.task-item').toContainText('John Doe'));
  });

  test('should mark task as completed', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await page.locator('.task-item').first().locator('input[type="checkbox"]').click();

    await expect(page.locator('.task-item').first()).toHaveClass(/completed/i);
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await page.selectOption('select[name="statusFilter"]', 'IN_PROGRESS');

    const inProgressTasks = await page.locator('.task-item').count();

    await page.selectOption('select[name="statusFilter"]', 'COMPLETED');

    const completedTasks = await page.locator('.task-item').count();

    expect(inProgressTasks).not.toBe(completedTasks);
  });

  test('should validate task duration (0.5 - 365 days)', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await page.click('text=Create Task');

    await page.fill('input[name="code"]', 'TASK-INVALID');
    await page.fill('input[name="duration"]', '0');

    await page.click('dialog button:has-text("Create")');

    await expect(page.locator('text=/Duration must be between 0\.5 and 365 days/i')).toBeVisible();
  });

  test('should validate task description (10 - 500 characters)', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await page.click('text=Create Task');

    await page.fill('input[name="code"]', 'TASK-INVALID');
    await page.fill('input[name="duration"]', '5');
    await page.fill('textarea[name="description"]', 'Short');

    await page.click('dialog button:has-text("Create")');

    await expect(page.locator('text=/Description must be between 10 and 500 characters/i')).toBeVisible();
  });

  test('should auto-complete phase when all tasks are completed', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await expect(page.locator('.phase-status').toHaveText('IN_PROGRESS'));

    await page.locator('.task-item').all().then(async (tasks) => {
      for (const task of tasks) {
        await task.locator('input[type="checkbox"]').click();
      }
    });

    await expect(page.locator('.phase-status')).toHaveText('COMPLETED');
  });

  test('should auto-start next phase when previous phase completes', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await expect(page.locator('.next-phase-status').toHaveText('PLANNED'));

    await page.locator('.task-item').all().then(async (tasks) => {
      for (const task of tasks) {
        await task.locator('input[type="checkbox"]').click();
      }
    });

    await expect(page.locator('.next-phase-status')).toHaveText('IN_PROGRESS');
  });

  test('should show read-only view for Team Member', async ({ page }) => {
    // Mock Team Member role
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'test-team-member-id',
        email: 'teammember@example.com',
        role: 'TEAM_MEMBER',
      }));
    });

    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await expect(page.locator('button:has-text("Create Task")')).not.toBeVisible();
    await expect(page.locator('button[aria-label="Edit task"]')).not.toBeVisible();
    await expect(page.locator('button[aria-label="Delete task"]')).not.toBeVisible();

    await expect(page.locator('.task-list')).toBeVisible();
  });

  test('should allow Team Leader to manage tasks', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await expect(page.locator('button:has-text("Create Task")')).toBeVisible();
    await expect(page.locator('button[aria-label="Edit task"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Delete task"]')).toBeVisible();
  });

  test('should display task count', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    await expect(page.locator('text=/\d+ tasks/')).toBeVisible();
  });

  test('should display loading state', async ({ page, request }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    // Mock API call delay
    await page.route('**/api/v1/phases/**/tasks', route => {
      route.fulfill({
        status: 200,
        body: '[]',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await expect(page.locator('text=Loading')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');
    await page.click('text=Studies');

    // Mock API error
    await page.route('**/api/v1/tasks', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Failed to create task' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.click('text=Create Task');
    await page.fill('input[name="code"]', 'TASK-ERROR');
    await page.fill('textarea[name="description"]', 'Error task');
    await page.fill('input[name="duration"]', '5');
    await page.click('dialog button:has-text("Create")');

    await expect(page.locator('text=Failed to create task')).toBeVisible();
  });

  test('should handle phase expansion/collapse', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/test-project-id');

    await expect(page.locator('.phase-section')).toBeVisible();

    await page.locator('.phase-header').click();

    await expect(page.locator('.phase-tasks')).not.toBeVisible();

    await page.locator('.phase-header').click();

    await expect(page.locator('.phase-tasks')).toBeVisible();
  });
});
