import { test, expect } from '@playwright/test';

test.describe('Project Creation Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(1000);
  });

  test('should navigate to create project page', async ({ page }) => {
    const createButton = page.locator('[data-testid="create-project-button"]');
    await createButton.click();

    await expect(page).toHaveURL(/projects\/new/);
  });

  test('should display project creation form', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    await page.waitForSelector('[data-testid="project-form"]', { timeout: 5000 });

    await expect(page.locator('[data-testid="project-form"]')).toBeVisible();

    const projectNameInput = page.locator('[data-testid="project-name"]');
    await expect(projectNameInput).toBeVisible();
    await expect(projectNameInput).toHaveAttribute('aria-required', 'true');

    const contractCodeInput = page.locator('[data-testid="contract-code"]');
    await expect(contractCodeInput).toBeVisible();
    await expect(contractCodeInput).toHaveAttribute('aria-required', 'true');

    const clientSelect = page.locator('[data-testid="client-select"]');
    await expect(clientSelect).toBeVisible();

    const startDateInput = page.locator('[data-testid="start-date"]');
    await expect(startDateInput).toBeVisible();

    const endDateInput = page.locator('[data-testid="end-date"]');
    await expect(endDateInput).toBeVisible();
  });

  test('should populate client dropdown', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    const clientSelect = page.locator('[data-testid="client-select"]');
    await clientSelect.click();

    const firstOption = page.locator('[data-testid="client-select"] option').first();
    const clientName = await firstOption.textContent();

    await expect(clientName).toBeTruthy();
    await expect(clientName?.length).toBeGreaterThan(0);
  });

  test('should fill required fields and submit', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    await page.fill('[data-testid="project-name"]', 'E2E Test Project');
    await page.fill('[data-testid="contract-code"]', `E2E-${Date.now()}`);

    const clientSelect = page.locator('[data-testid="client-select"]');
    await clientSelect.selectOption({ index: 0 });

    await page.fill('[data-testid="built-up-area"]', '1500');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    await page.fill('[data-testid="start-date"]', startDate.toISOString().split('T')[0]);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2);
    await page.fill('[data-testid="end-date"]', endDate.toISOString().split('T')[0]);

    const submitButton = page.locator('[data-testid="submit-project"]');
    await submitButton.click();

    await expect(page).toHaveURL(/projects\/\d+/, { timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    const submitButton = page.locator('[data-testid="submit-project"]');
    await submitButton.click();

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 3000 });

    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toMatch(/required/i);
  });

  test('should validate built-up area is positive', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    await page.fill('[data-testid="project-name"]', 'Invalid Area Test');
    await page.fill('[data-testid="contract-code"]', `AREA-${Date.now()}`);
    await page.fill('[data-testid="built-up-area"]', '-1000');

    const clientSelect = page.locator('[data-testid="client-select"]');
    await clientSelect.selectOption({ index: 0 });

    await page.fill('[data-testid="start-date"]', '2024-02-01');
    await page.fill('[data-testid="end-date"]', '2024-04-30');

    const submitButton = page.locator('[data-testid="submit-project"]');
    await submitButton.click();

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 3000 });

    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toMatch(/positive/i);
  });

  test('should validate date sequence', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    await page.fill('[data-testid="project-name"]', 'Invalid Date Test');
    await page.fill('[data-testid="contract-code"]', `DATE-${Date.now()}`);

    const clientSelect = page.locator('[data-testid="client-select"]');
    await clientSelect.selectOption({ index: 0 });

    await page.fill('[data-testid="start-date"]', '2024-04-30');
    await page.fill('[data-testid="end-date"]', '2024-02-15');

    const submitButton = page.locator('[data-testid="submit-project"]');
    await submitButton.click();

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 3000 });

    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toMatch(/after start date/i);
  });

  test('should handle form cancellation', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    await page.fill('[data-testid="project-name"]', 'Cancel Test');

    const cancelButton = page.locator('[data-testid="cancel-button"]');
    await cancelButton.click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 3000 });

    const projectNameInput = page.locator('[data-testid="project-name"]');
    const projectName = await projectNameInput.inputValue();
    expect(projectName).toBeFalsy();
  });

  test('should display modification tracking fields', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    const modificationTimesInput = page.locator('[data-testid="modification-times"]');
    await expect(modificationTimesInput).toBeVisible();
    await expect(modificationTimesInput).toHaveAttribute('placeholder', '3');

    const modificationDaysInput = page.locator('[data-testid="modification-days"]');
    await expect(modificationDaysInput).toBeVisible();
    await expect(modificationDaysInput).toHaveAttribute('placeholder', '5');

    await page.fill('[data-testid="modification-times"]', '5');
    await page.fill('[data-testid="modification-days"]', '10');
  });

  test('should display optional fields', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    const licenseTypeSelect = page.locator('[data-testid="license-type"]');
    await expect(licenseTypeSelect).toBeVisible();
    await licenseTypeSelect.click();

    const firstLicenseOption = page.locator('[data-testid="license-type"] option').first();
    const licenseOption = await firstLicenseOption.textContent();

    await expect(licenseOption).toBeTruthy();

    const projectTypeSelect = page.locator('[data-testid="project-type"]');
    await expect(projectTypeSelect).toBeVisible();
    await projectTypeSelect.click();

    const firstProjectOption = page.locator('[data-testid="project-type"] option').first();
    const projectOption = await firstProjectOption.textContent();

    await expect(projectOption).toBeTruthy();

    const requirementsTextarea = page.locator('[data-testid="requirements"]');
    await expect(requirementsTextarea).toBeVisible();
  });

  test('should show success message after creation', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    await page.fill('[data-testid="project-name"]', 'Success Test Project');
    await page.fill('[data-testid="contract-code"]', `SUCCESS-${Date.now()}`);

    const clientSelect = page.locator('[data-testid="client-select"]');
    await clientSelect.selectOption({ index: 0 });

    await page.fill('[data-testid="built-up-area"]', '1000');
    await page.fill('[data-testid="start-date"]', '2024-02-01');
    await page.fill('[data-testid="end-date"]', '2024-04-30');

    const submitButton = page.locator('[data-testid="submit-project"]');
    await submitButton.click();

    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });

    const successMessage = await page.locator('[data-testid="success-message"]').textContent();
    expect(successMessage).toContain('created');
  });

  test('should redirect to project detail after creation', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    await page.fill('[data-testid="project-name"]', 'Redirect Test Project');
    await page.fill('[data-testid="contract-code"]', `REDIRECT-${Date.now()}`);

    const clientSelect = page.locator('[data-testid="client-select"]');
    await clientSelect.selectOption({ index: 0 });

    await page.fill('[data-testid="built-up-area"]', '1000');
    await page.fill('[data-testid="start-date"]', '2024-02-01');
    await page.fill('[data-testid="end-date"]', '2024-04-30');

    const submitButton = page.locator('[data-testid="submit-project"]');
    await submitButton.click();

    await expect(page).toHaveURL(/projects\/\d+/, { timeout: 5000 });
  });

  test('should display loading state during submission', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    await page.fill('[data-testid="project-name"]', 'Loading Test Project');
    await page.fill('[data-testid="contract-code"]', `LOADING-${Date.now()}`);

    const clientSelect = page.locator('[data-testid="client-select"]');
    await clientSelect.selectOption({ index: 0 });

    await page.fill('[data-testid="built-up-area"]', '1000');
    await page.fill('[data-testid="start-date"]', '2024-02-01');
    await page.fill('[data-testid="end-date"]', '2024-04-30');

    const submitButton = page.locator('[data-testid="submit-project"]');
    await submitButton.click();

    await expect(page.locator('[data-testid="submit-project"]')).toBeDisabled({ timeout: 1000 });
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible({ timeout: 1000 });
  });

  test('should handle server errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    await page.fill('[data-testid="project-name"]', 'Error Test Project');
    await page.fill('[data-testid="contract-code"]', 'ERROR-DUPLICATE');

    const clientSelect = page.locator('[data-testid="client-select"]');
    await clientSelect.selectOption({ index: 0 });

    await page.fill('[data-testid="built-up-area"]', '1000');
    await page.fill('[data-testid="start-date"]', '2024-02-01');
    await page.fill('[data-testid="end-date"]', '2024-04-30');

    const submitButton = page.locator('[data-testid="submit-project"]');
    await submitButton.click();

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('should be accessible via keyboard', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    await page.keyboard.press('Tab');
    focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBeTruthy();

    await page.keyboard.press('Tab');
    focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBeTruthy();
  });

  test('should display form validation in real-time', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    const projectNameInput = page.locator('[data-testid="project-name"]');
    await projectNameInput.fill('Test Project Name');

    await page.waitForTimeout(100);

    const validationMessage = page.locator('[data-testid="validation-message"]');
    const isValid = await validationMessage.count() === 0 || (await validationMessage.textContent()) === '';

    expect(isValid).toBe(true);
  });

  test('should handle back navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    const backButton = page.locator('[data-testid="back-button"]');
    await backButton.click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 3000 });
  });

  test('should preserve form data on page refresh', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/new');

    await page.fill('[data-testid="project-name"]', 'Preserved Test');
    await page.fill('[data-testid="contract-code"]', 'PRESERVED-001');

    await page.reload();

    await page.waitForSelector('[data-testid="project-form"]', { timeout: 5000 });

    const projectName = await page.locator('[data-testid="project-name"]').inputValue();
    expect(projectName).toBe('Preserved Test');

    const contractCode = await page.locator('[data-testid="contract-code"]').inputValue();
    expect(contractCode).toBe('PRESERVED-001');
  });
});
