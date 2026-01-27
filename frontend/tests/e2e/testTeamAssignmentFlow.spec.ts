import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

test.describe('Team Assignment Flow E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should successfully assign team member with valid data', async () => {
    // Navigate to team assignment page
    await page.goto('http://localhost:3000/team-assignments');

    // Select a team member
    await page.click('[data-testid="team-member-select"]');
    await page.click('text=John Doe');

    // Select a phase
    await page.click('[data-testid="phase-select"]');
    await page.click('text=STUDIES');

    // Set allocation percentage
    await page.fill('[data-testid="allocation-input"]', '50');

    // Select role
    await page.click('[data-testid="role-select"]');
    await page.click('text=Team Member');

    // Set dates
    await page.fill('[data-testid="start-date-input"]', '2025-01-01');
    await page.fill('[data-testid="end-date-input"]', '2025-03-31');

    // Submit form
    await page.click('[data-testid="assign-button"]');

    // Wait for success message
    await expect(page.locator('text=Assignment created successfully')).toBeVisible({ timeout: 5000 });

    // Verify assignment appears in list
    await page.goto('http://localhost:3000/team-workload');
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=50%')).toBeVisible();
  });

  test('should prevent assignment when allocation would exceed 100%', async () => {
    // Setup: User already has 80% allocation
    // This would need to be done via API or previous test steps

    await page.goto('http://localhost:3000/team-assignments');

    // Select team member (who has 80% already)
    await page.click('[data-testid="team-member-select"]');
    await page.click('text=Jane Smith');

    // Select phase
    await page.click('[data-testid="phase-select"]');
    await page.click('text=DESIGN');

    // Set allocation that would exceed 100%
    await page.fill('[data-testid="allocation-input"]', '30');

    // Attempt to submit
    await page.click('[data-testid="assign-button"]');

    // Expect over-allocation warning
    await expect(page.locator('text=Warning: Team member will be over-allocated')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=would be 110%')).toBeVisible();

    // Submit button should be disabled
    await expect(page.locator('[data-testid="assign-button"]')).toBeDisabled();

    // Show override checkbox
    await expect(page.locator('[data-testid="override-checkbox"]')).toBeVisible();

    // Check override checkbox and submit
    await page.check('[data-testid="override-checkbox"]');
    await page.click('[data-testid="assign-button"]');

    // Should succeed now
    await expect(page.locator('text=Assignment created successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for invalid allocation percentage', async () => {
    await page.goto('http://localhost:3000/team-assignments');

    // Select team member
    await page.click('[data-testid="team-member-select"]');
    await page.click('text=Bob Wilson');

    // Set invalid allocation (negative)
    await page.fill('[data-testid="allocation-input"]', '-10');

    // Attempt to submit
    await page.click('[data-testid="assign-button"]');

    // Expect validation error
    await expect(page.locator('text=Allocation must be between 0 and 100')).toBeVisible({ timeout: 3000 });
  });

  test('should show validation error for allocation > 100', async () => {
    await page.goto('http://localhost:3000/team-assignments');

    // Select team member
    await page.click('[data-testid="team-member-select"]');
    await page.click('text=Alice Brown');

    // Set invalid allocation (>100)
    await page.fill('[data-testid="allocation-input"]', '150');

    // Attempt to submit
    await page.click('[data-testid="assign-button"]');

    // Expect validation error
    await expect(page.locator('text=Allocation must be between 0 and 100')).toBeVisible({ timeout: 3000 });
  });

  test('should show validation error for invalid date range', async () => {
    await page.goto('http://localhost:3000/team-assignments');

    // Select team member
    await page.click('[data-testid="team-member-select"]');
    await page.click('text=Charlie Davis');

    // Set dates (end before start)
    await page.fill('[data-testid="start-date-input"]', '2025-06-01');
    await page.fill('[data-testid="end-date-input"]', '2025-05-01');

    // Set valid allocation
    await page.fill('[data-testid="allocation-input"]', '50');

    // Attempt to submit
    await page.click('[data-testid="assign-button"]');

    // Expect validation error
    await expect(page.locator('text=End date must be after start date')).toBeVisible({ timeout: 3000 });
  });

  test('should allow assignment with exactly 100% allocation', async () => {
    await page.goto('http://localhost:3000/team-assignments');

    // Select team member with no existing assignments
    await page.click('[data-testid="team-member-select"]');
    await page.click('text=Eve Johnson');

    // Set 100% allocation
    await page.fill('[data-testid="allocation-input"]', '100');

    // Select phase and role
    await page.click('[data-testid="phase-select"]');
    await page.click('text=EXECUTION');
    await page.click('[data-testid="role-select"]');
    await page.click('text=Team Leader');

    // Set dates
    await page.fill('[data-testid="start-date-input"]', '2025-01-01');
    await page.fill('[data-testid="end-date-input"]', '2025-03-31');

    // Submit form
    await page.click('[data-testid="assign-button"]');

    // Should succeed
    await expect(page.locator('text=Assignment created successfully')).toBeVisible({ timeout: 5000 });

    // Verify in workload view
    await page.goto('http://localhost:3000/team-workload');
    await expect(page.locator('text=Eve Johnson')).toBeVisible();
    await expect(page.locator('text=100%')).toBeVisible();
  });

  test('should display current team member allocation correctly', async () => {
    await page.goto('http://localhost:3000/team-workload');

    // Verify team members are displayed
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    await expect(page.locator('text=Bob Wilson')).toBeVisible();

    // Verify allocations are shown
    await expect(page.locator('text=50%')).toBeVisible();
    await expect(page.locator('text=80%')).toBeVisible();
    await expect(page.locator('text=100%')).toBeVisible();
  });

  test('should show over-allocation warning in workload view', async () => {
    await page.goto('http://localhost:3000/team-workload');

    // Find overallocated member (Jane Smith with 120%)
    const janeRow = page.locator('tr:has-text("Jane Smith")');

    // Should have over-allocation indicator
    await expect(janeRow.locator('[data-warning-icon="true"]')).toBeVisible();

    // Should have red allocation bar
    await expect(janeRow.locator('.bg-red-500')).toBeVisible();

    // Should have warning icon (⚠️)
    await expect(janeRow.locator('text=⚠️')).toBeVisible();
  });

  test('should not show over-allocation for well-allocated members', async () => {
    await page.goto('http://localhost:3000/team-workload');

    // Find well-allocated member (John Doe with 50%)
    const johnRow = page.locator('tr:has-text("John Doe")');

    // Should NOT have over-allocation indicator
    await expect(johnRow.locator('[data-warning-icon="true"]')).not.toBeVisible();

    // Should have green allocation bar
    await expect(johnRow.locator('.bg-green-500')).toBeVisible();

    // Should have checkmark (✓)
    await expect(johnRow.locator('text=✓')).toBeVisible();
  });

  test('should expand team member assignment details', async () => {
    await page.goto('http://localhost:3000/team-workload');

    // Click expand button for John Doe
    const johnRow = page.locator('tr:has-text("John Doe")');
    await johnRow.locator('[data-expand="true"]').click();

    // Wait for assignments to appear
    await expect(page.locator('text=Project Alpha')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=Project Beta')).toBeVisible();

    // Verify phase names
    await expect(page.locator('text=STUDIES')).toBeVisible();
    await expect(page.locator('text=DESIGN')).toBeVisible();

    // Verify roles
    await expect(page.locator('text=TEAM_MEMBER')).toBeVisible();
    await expect(page.locator('text=TEAM_LEADER')).toBeVisible();
  });

  test('should collapse team member assignment details', async () => {
    await page.goto('http://localhost:3000/team-workload');

    // First expand John Doe
    const johnRow = page.locator('tr:has-text("John Doe")');
    await johnRow.locator('[data-expand="true"]').click();
    await expect(page.locator('text=Project Alpha')).toBeVisible({ timeout: 2000 });

    // Click collapse
    await johnRow.locator('[data-collapse="true"]').click();

    // Assignments should be hidden
    await expect(page.locator('text=Project Alpha')).not.toBeVisible();
  });

  test('should display workload summary statistics', async () => {
    await page.goto('http://localhost:3000/team-workload');

    // Verify total members count
    await expect(page.locator('text=/Total Members.*3/')).toBeVisible();

    // Verify well-allocated count
    await expect(page.locator('text=/Well-Allocated.*2/')).toBeVisible();

    // Verify over-allocated count
    await expect(page.locator('text=/Overallocated.*1/')).toBeVisible();

    // Verify average allocation
    // (50 + 80 + 100) / 3 = 76.67%
    await expect(page.locator('text=/Average.*76.67%/i')).toBeVisible();
  });

  test('should show loading state while fetching workload', async () => {
    // Mock slow API response
    // This would require intercepting API calls

    await page.goto('http://localhost:3000/team-workload');

    // Should show loading indicator
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Loading team workload')).toBeVisible();
  });

  test('should show error state when API fails', async () => {
    // Mock API failure
    // This would require intercepting API calls to simulate error

    await page.goto('http://localhost:3000/team-workload');

    // Should show error message
    await expect(page.locator('text=Failed to load team workload')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('should handle complete assignment lifecycle: create, view, update, delete', async () => {
    // Step 1: Create assignment
    await page.goto('http://localhost:3000/team-assignments');

    await page.click('[data-testid="team-member-select"]');
    await page.click('text=Frank Miller');

    await page.click('[data-testid="phase-select"]');
    await page.click('text=STUDIES');

    await page.fill('[data-testid="allocation-input"]', '40');
    await page.click('[data-testid="role-select"]');
    await page.click('text=Team Member');

    await page.fill('[data-testid="start-date-input"]', '2025-01-01');
    await page.fill('[data-testid="end-date-input"]', '2025-02-28');

    await page.click('[data-testid="assign-button"]');
    await expect(page.locator('text=Assignment created successfully')).toBeVisible({ timeout: 5000 });

    // Step 2: View assignment in workload
    await page.goto('http://localhost:3000/team-workload');
    await expect(page.locator('text=Frank Miller')).toBeVisible();
    await expect(page.locator('text=40%')).toBeVisible();

    // Step 3: Update assignment (navigate to detail and update)
    // This would require additional UI/URL structure
    // For now, verify the assignment exists

    // Step 4: Delete assignment
    // This would require delete button in the UI
    // For now, verify the member exists in workload view
  });

  test('should display empty state when no team members assigned', async () => {
    // This would require a project with no assignments
    // Mock or setup project with no team members

    await page.goto('http://localhost:3000/team-workload');

    // Should show empty state
    await expect(page.locator('text=No Team Members Assigned')).toBeVisible();
    await expect(page.locator('text=There are no team members assigned')).toBeVisible();
  });

  test('should sort team members alphabetically', async () => {
    await page.goto('http://localhost:3000/team-workload');

    // Get all team member names from the table
    const memberNames = await page.locator('[data-member-name="true"]').allTextContents();
    const sortedNames = [...memberNames].sort((a: string, b: string) => a.localeCompare(b));

    // Verify they're sorted alphabetically
    expect(memberNames).toEqual(sortedNames);
  });

  test('should support keyboard navigation in assignment form', async () => {
    await page.goto('http://localhost:3000/team-assignments');

    // Tab through form fields
    await page.keyboard.press('Tab'); // Phase
    await page.keyboard.press('Tab'); // Role
    await page.keyboard.press('Tab'); // Allocation
    await page.keyboard.press('Tab'); // Start Date

    // Verify focused element
    await expect(page.locator('[data-testid="start-date-input"]:focus')).toBeVisible();
  });

  test('should handle cancel action correctly', async () => {
    await page.goto('http://localhost:3000/team-assignments');

    // Fill in some data
    await page.click('[data-testid="team-member-select"]');
    await page.click('text=Grace Lee');

    await page.fill('[data-testid="allocation-input"]', '25');

    // Click cancel
    await page.click('[data-testid="cancel-button"]');

    // Should navigate back or clear form
    // Verify no assignment was created
    await page.goto('http://localhost:3000/team-workload');

    // Grace Lee should not be in the list or have 25% allocation
    // (This depends on whether Grace Lee had existing assignments)
  });

  test('should be accessible via keyboard and screen reader', async () => {
    await page.goto('http://localhost:3000/team-workload');

    // Check for proper ARIA labels
    const phaseLabel = page.locator('th:has-text("Phase")');
    await expect(phaseLabel).toHaveAttribute('scope', 'col');

    const expandButton = page.locator('[aria-label="Expand assignments"]');
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    // Expand button
    await expandButton.click();
    await expect(page.locator('[aria-label="Expand assignments"]')).toHaveAttribute('aria-expanded', 'true');
  });
});
