import { test, expect } from '@playwright/test';

test.describe('Payment Links E2E - Mock Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're in mock mode for these tests
    await page.addInitScript(() => {
      localStorage.setItem('msw_latency', '100'); // Add some latency for realistic testing
    });
  });

  test('should create a payment link and see it in the list', async ({ page }) => {
    // Navigate to payment links page
    await page.goto('/payment-links');

    // Wait for page to load and check for Demo Data badge
    await expect(page.locator('text=🎭 Demo Data')).toBeVisible();

    // Click create payment link button
    await page.click('text=Create Payment Link');
    await expect(page).toHaveURL('/payment-links/new');

    // Fill out the form
    await page.fill('[name="amount"]', '25.99');
    await page.selectOption('[name="currency"]', 'USD');
    await page.fill('[name="description"]', 'E2E Test Payment Link');
    await page.fill('[name="customerEmail"]', 'e2e-test@example.com');
    await page.fill('[name="customerName"]', 'E2E Test Customer');
    await page.fill('[name="reference"]', 'E2E-TEST-001');

    // Check the preview shows correct information
    await expect(page.locator('text=$25.99')).toBeVisible();
    await expect(page.locator('text=E2E Test Payment Link')).toBeVisible();
    await expect(page.locator('text=E2E Test Customer')).toBeVisible();

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to payment links list
    await expect(page).toHaveURL(/\/payment-links/);

    // Verify the new payment link appears in the list
    await expect(page.locator('text=E2E Test Payment Link')).toBeVisible();
    await expect(page.locator('text=e2e-test@example.com')).toBeVisible();
    await expect(page.locator('text=E2E Test Customer')).toBeVisible();
    await expect(page.locator('text=$25.99')).toBeVisible();
    await expect(page.locator('text=E2E-TEST-001')).toBeVisible();

    // Verify it has pending status
    await expect(page.locator('text=pending')).toBeVisible();
  });

  test('should survive page reload', async ({ page }) => {
    // First create a payment link
    await page.goto('/payment-links/new');
    await page.fill('[name="amount"]', '10.50');
    await page.selectOption('[name="currency"]', 'USD');
    await page.fill('[name="description"]', 'Reload Test Payment');
    await page.fill('[name="customerEmail"]', 'reload-test@example.com');
    await page.click('button[type="submit"]');

    // Wait for redirect and verify it's there
    await expect(page).toHaveURL(/\/payment-links/);
    await expect(page.locator('text=Reload Test Payment')).toBeVisible();

    // Reload the page
    await page.reload();

    // Wait for page to load and verify the payment link is still there
    await expect(page.locator('text=🎭 Demo Data')).toBeVisible();
    await expect(page.locator('text=Reload Test Payment')).toBeVisible();
    await expect(page.locator('text=reload-test@example.com')).toBeVisible();
    await expect(page.locator('text=$10.50')).toBeVisible();
  });

  test('should filter payment links by status', async ({ page }) => {
    await page.goto('/payment-links');

    // Wait for data to load
    await expect(page.locator('text=🎭 Demo Data')).toBeVisible();

    // Get initial count of all links
    const allLinksCount = await page.locator('tbody tr').count();
    expect(allLinksCount).toBeGreaterThan(0);

    // Filter by pending status
    await page.selectOption('[name="status"]', 'pending');
    await page.click('button:has-text("Apply Filters")');

    // Wait for results and check all visible links are pending
    await page.waitForLoadState('networkidle');
    const pendingRows = page.locator('tbody tr');
    const pendingCount = await pendingRows.count();

    for (let i = 0; i < pendingCount; i++) {
      const row = pendingRows.nth(i);
      await expect(row.locator('.bg-yellow-100')).toBeVisible(); // Pending status styling
    }

    // Filter by completed status
    await page.selectOption('[name="status"]', 'completed');
    await page.click('button:has-text("Apply Filters")');

    await page.waitForLoadState('networkidle');
    const completedRows = page.locator('tbody tr');
    const completedCount = await completedRows.count();

    for (let i = 0; i < completedCount; i++) {
      const row = completedRows.nth(i);
      await expect(row.locator('.bg-green-100')).toBeVisible(); // Completed status styling
    }

    // Reset filters
    await page.click('button:has-text("Reset")');
    await page.waitForLoadState('networkidle');

    // Should show all links again
    const resetCount = await page.locator('tbody tr').count();
    expect(resetCount).toBe(allLinksCount);
  });

  test('should search payment links', async ({ page }) => {
    await page.goto('/payment-links');
    await expect(page.locator('text=🎭 Demo Data')).toBeVisible();

    // Search for "consultation" - should find medical consultation fee
    await page.fill('[name="search"]', 'consultation');
    await page.click('button:has-text("Apply Filters")');

    await page.waitForLoadState('networkidle');

    // Should find at least one result
    const searchResults = await page.locator('tbody tr').count();
    expect(searchResults).toBeGreaterThan(0);

    // Verify results contain the search term
    await expect(page.locator('text=Medical Consultation Fee')).toBeVisible();

    // Clear search
    await page.fill('[name="search"]', '');
    await page.click('button:has-text("Apply Filters")');

    await page.waitForLoadState('networkidle');

    // Should show more results
    const allResults = await page.locator('tbody tr').count();
    expect(allResults).toBeGreaterThan(searchResults);
  });

  test('should void a pending payment link', async ({ page }) => {
    // First create a new payment link to void
    await page.goto('/payment-links/new');
    await page.fill('[name="amount"]', '15.00');
    await page.selectOption('[name="currency"]', 'USD');
    await page.fill('[name="description"]', 'Link to Void Test');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/payment-links/);
    await expect(page.locator('text=Link to Void Test')).toBeVisible();

    // Find the void button for our new link and click it
    const linkRow = page.locator('tr').filter({ hasText: 'Link to Void Test' });
    await linkRow.locator('button:has-text("Void")').click();

    // Wait for the action to complete
    await page.waitForLoadState('networkidle');

    // The link should now show as voided
    const voidedRow = page.locator('tr').filter({ hasText: 'Link to Void Test' });
    await expect(voidedRow.locator('.bg-red-100')).toBeVisible(); // Voided status styling

    // Void button should no longer be available
    await expect(voidedRow.locator('button:has-text("Void")')).not.toBeVisible();
    await expect(voidedRow.locator('button:has-text("Resend")')).not.toBeVisible();
  });

  test('should resend a payment link with email', async ({ page }) => {
    // Create a new payment link with email to resend
    await page.goto('/payment-links/new');
    await page.fill('[name="amount"]', '20.00');
    await page.selectOption('[name="currency"]', 'USD');
    await page.fill('[name="description"]', 'Link to Resend Test');
    await page.fill('[name="customerEmail"]', 'resend-test@example.com');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/payment-links/);

    // Find the resend button for our new link and click it
    const linkRow = page.locator('tr').filter({ hasText: 'Link to Resend Test' });
    await linkRow.locator('button:has-text("Resend")').click();

    // Wait for the action to complete
    await page.waitForLoadState('networkidle');

    // The link should still be pending and resendable
    await expect(linkRow.locator('.bg-yellow-100')).toBeVisible(); // Still pending
    await expect(linkRow.locator('button:has-text("Resend")')).toBeVisible(); // Still resendable
  });

  test('should handle pagination', async ({ page }) => {
    await page.goto('/payment-links');
    await expect(page.locator('text=🎭 Demo Data')).toBeVisible();

    // Check if pagination is present
    const paginationExists = await page.locator('nav[aria-label="pagination"]').isVisible().catch(() => false);

    if (paginationExists) {
      // Get first page results
      const firstPageLinks = await page.locator('tbody tr td:first-child').allTextContents();

      // Go to next page if available
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');

        // Get second page results
        const secondPageLinks = await page.locator('tbody tr td:first-child').allTextContents();

        // Results should be different
        expect(firstPageLinks).not.toEqual(secondPageLinks);

        // Go back to previous page
        await page.locator('button:has-text("Previous")').click();
        await page.waitForLoadState('networkidle');

        // Should show first page results again
        const backToFirstPage = await page.locator('tbody tr td:first-child').allTextContents();
        expect(backToFirstPage).toEqual(firstPageLinks);
      }
    }
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/payment-links/new');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should prevent submission and show validation
    await expect(page).toHaveURL('/payment-links/new');

    // Fill required fields
    await page.fill('[name="amount"]', '0'); // Invalid amount
    await page.fill('[name="description"]', ''); // Empty description

    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Amount must be greater than 0')).toBeVisible();

    // Fill valid data
    await page.fill('[name="amount"]', '10.00');
    await page.fill('[name="description"]', 'Valid Payment');

    // Add invalid email
    await page.fill('[name="customerEmail"]', 'invalid-email');
    await page.click('button[type="submit"]');

    // Should show email validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();

    // Fix email
    await page.fill('[name="customerEmail"]', 'valid@example.com');
    await page.click('button[type="submit"]');

    // Should now succeed
    await expect(page).toHaveURL(/\/payment-links$/);
  });

  test('should show loading states', async ({ page }) => {
    // Set higher latency to see loading states
    await page.addInitScript(() => {
      localStorage.setItem('msw_latency', '1000');
    });

    await page.goto('/payment-links');

    // Should show loading spinner initially
    await expect(page.locator('text=Loading payment links...')).toBeVisible();

    // Wait for data to load
    await expect(page.locator('text=🎭 Demo Data')).toBeVisible();
    await expect(page.locator('text=Loading payment links...')).not.toBeVisible();

    // Test loading state during creation
    await page.click('text=Create Payment Link');
    await page.fill('[name="amount"]', '5.00');
    await page.fill('[name="description"]', 'Loading Test');
    
    await page.click('button[type="submit"]');
    
    // Should show loading state
    await expect(page.locator('button:has-text("Creating...")')).toBeVisible();
    
    // Wait for completion
    await expect(page).toHaveURL(/\/payment-links$/);
  });

  test('should work with different currencies', async ({ page }) => {
    await page.goto('/payment-links/new');

    // Test EUR currency
    await page.fill('[name="amount"]', '100.00');
    await page.selectOption('[name="currency"]', 'EUR');
    await page.fill('[name="description"]', 'Euro Payment Test');

    // Preview should show EUR formatting
    await expect(page.locator('text=€100.00')).toBeVisible();

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/payment-links/);

    // Should show EUR in the list
    await expect(page.locator('text=€100.00')).toBeVisible();
  });
});