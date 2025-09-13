import { test, expect } from '@playwright/test';

test.describe('Mock Mode Payment Links', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock environment variable for the test
    await page.addInitScript(() => {
      (window as any)._test_mock_mode = true;
    });
  });

  test('should create a new payment link and see it in the list', async ({ page }) => {
    // Start from the payment links page in mock mode
    await page.goto('http://localhost:3000/payment-links?mock=1');

    // Wait for the page to load and MSW to initialize
    await page.waitForLoadState('networkidle');

    // Check for Demo Data badge (indicates mock mode is active)
    await expect(page.locator('text=🎭 Demo Data')).toBeVisible();

    // Look for "Create Payment Link" button or similar
    const createButton = page.locator('button', { hasText: /create.*payment.*link/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      // Alternative: navigate directly to create form
      await page.goto('http://localhost:3000/payment-links/create?mock=1');
    }

    // Fill out the payment link form
    await page.fill('[name="description"]', 'E2E Test Payment');
    await page.fill('[name="amount"]', '10000'); // $100.00
    await page.selectOption('[name="currency"]', 'USD');
    await page.fill('[name="customerEmail"]', 'test@example.com');
    await page.fill('[name="customerName"]', 'Test Customer');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for success message or redirect
    await page.waitForLoadState('networkidle');

    // Navigate back to payment links list (if not already there)
    await page.goto('http://localhost:3000/payment-links?mock=1');

    // Verify the new payment link appears in the list
    await expect(page.locator('text=E2E Test Payment')).toBeVisible();
    await expect(page.locator('text=test@example.com')).toBeVisible();
    await expect(page.locator('text=$100.00')).toBeVisible();

    // Verify it has the correct status
    await expect(page.locator('text=pending').first()).toBeVisible();
  });

  test('should show realistic demo data in payment links list', async ({ page }) => {
    await page.goto('http://localhost:3000/payment-links?mock=1');
    await page.waitForLoadState('networkidle');

    // Check for Demo Data badge
    await expect(page.locator('text=🎭 Demo Data')).toBeVisible();

    // Verify mock data is displayed
    await expect(page.locator('text=Medical Consultation Fee')).toBeVisible();
    await expect(page.locator('text=sarah.johnson@email.com')).toBeVisible();
    await expect(page.locator('text=Telehealth Session')).toBeVisible();

    // Check for various statuses
    await expect(page.locator('text=completed')).toBeVisible();
    await expect(page.locator('text=pending')).toBeVisible();
  });

  test('should show realistic demo data in transactions list', async ({ page }) => {
    await page.goto('http://localhost:3000/transactions?mock=1');
    await page.waitForLoadState('networkidle');

    // Check for Demo Data badge
    await expect(page.locator('text=🎭 Demo Data')).toBeVisible();

    // Verify mock transaction data is displayed
    await expect(page.locator('text=sarah.johnson@email.com')).toBeVisible();
    await expect(page.locator('text=captured')).toBeVisible();

    // Check for payment method info (card ending in some digits)
    await expect(page.locator('text=••••')).toBeVisible();
  });

  test('should allow processing a refund on a transaction', async ({ page }) => {
    await page.goto('http://localhost:3000/transactions?mock=1');
    await page.waitForLoadState('networkidle');

    // Find a captured transaction
    const capturedTransaction = page.locator('tr:has-text("captured")').first();
    await expect(capturedTransaction).toBeVisible();

    // Click on the transaction to view details (or find refund button)
    await capturedTransaction.click();

    // Look for refund button
    const refundButton = page.locator('button', { hasText: /refund/i });
    if (await refundButton.isVisible()) {
      await refundButton.click();

      // Fill refund form
      await page.fill('[name="amount"]', '5000'); // $50.00
      await page.fill('[name="reason"]', 'E2E Test Refund');

      // Submit refund
      await page.click('button[type="submit"]');

      // Wait for success message
      await expect(page.locator('text=processed successfully')).toBeVisible();
    }
  });

  test('should show different UI elements based on mock mode', async ({ page }) => {
    // Test with mock mode
    await page.goto('http://localhost:3000/dashboard?mock=1');
    await page.waitForLoadState('networkidle');

    // Should show Demo Data badge in mock mode
    await expect(page.locator('text=🎭 Demo Data')).toBeVisible();

    // Test without mock mode (if possible)
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Should NOT show Demo Data badge in regular mode
    await expect(page.locator('text=🎭 Demo Data')).not.toBeVisible();
  });
});