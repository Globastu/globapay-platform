import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { paymentLinkHandlers } from '../payment-links';

// Create a mock server with our handlers
const server = setupServer(...paymentLinkHandlers);

describe('Payment Links MSW Handlers', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /payment-links', () => {
    it('should return paginated payment links', async () => {
      const response = await fetch('/payment-links');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        totalCount: expect.any(Number),
        totalPages: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPrevPage: expect.any(Boolean),
      });
    });

    it('should filter by status', async () => {
      const response = await fetch('/payment-links?status=pending');
      const data = await response.json();

      expect(response.status).toBe(200);
      data.data.forEach((link: any) => {
        expect(link.status).toBe('pending');
      });
    });

    it('should search payment links', async () => {
      const response = await fetch('/payment-links?search=consultation');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.length).toBeGreaterThan(0);
      
      // At least one result should match the search term
      const hasMatch = data.data.some((link: any) =>
        link.description.toLowerCase().includes('consultation') ||
        link.customerName?.toLowerCase().includes('consultation') ||
        link.customerEmail?.toLowerCase().includes('consultation')
      );
      expect(hasMatch).toBe(true);
    });

    it('should support pagination', async () => {
      const page1Response = await fetch('/payment-links?page=1&limit=2');
      const page1Data = await page1Response.json();

      const page2Response = await fetch('/payment-links?page=2&limit=2');
      const page2Data = await page2Response.json();

      expect(page1Data.data.length).toBeLessThanOrEqual(2);
      expect(page2Data.data.length).toBeLessThanOrEqual(2);
      
      // Results should be different
      if (page1Data.data.length > 0 && page2Data.data.length > 0) {
        expect(page1Data.data[0].id).not.toBe(page2Data.data[0].id);
      }
    });

    it('should respect latency parameter', async () => {
      const startTime = Date.now();
      await fetch('/payment-links?latency=100');
      const endTime = Date.now();

      // Should take at least 100ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some variance
    });
  });

  describe('GET /payment-links/:id', () => {
    it('should return specific payment link', async () => {
      // First get a list to find a valid ID
      const listResponse = await fetch('/payment-links');
      const listData = await listResponse.json();
      const firstLink = listData.data[0];

      const response = await fetch(`/payment-links/${firstLink.id}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.id).toBe(firstLink.id);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        merchantId: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        description: expect.any(String),
        status: expect.any(String),
        url: expect.any(String),
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 404 for non-existent payment link', async () => {
      const response = await fetch('/payment-links/non-existent-id');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toMatchObject({
        type: 'https://globapay.com/problems/not-found',
        title: 'Payment Link Not Found',
        status: 404,
        detail: expect.stringContaining('non-existent-id'),
      });
    });
  });

  describe('POST /payment-links', () => {
    it('should create a new payment link', async () => {
      const newLink = {
        amount: 5000,
        currency: 'USD',
        description: 'Test Payment Link',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        reference: 'TEST-001',
      };

      const response = await fetch('/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        amount: 5000,
        currency: 'USD',
        description: 'Test Payment Link',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        reference: 'TEST-001',
        status: 'pending',
        url: expect.any(String),
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should validate required fields', async () => {
      const invalidLink = {
        currency: 'USD',
        // Missing amount and description
      };

      const response = await fetch('/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidLink),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        type: 'https://globapay.com/problems/validation-error',
        title: 'Validation Error',
        status: 400,
        errors: expect.any(Object),
      });
    });

    it('should simulate processing delay', async () => {
      const newLink = {
        amount: 1000,
        currency: 'USD',
        description: 'Test with delay',
      };

      const startTime = Date.now();
      const response = await fetch('/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      });
      const endTime = Date.now();

      expect(response.status).toBe(201);
      // Should have some processing delay (at least 400ms from the handler)
      expect(endTime - startTime).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PUT /payment-links/:id', () => {
    it('should update an existing payment link', async () => {
      // First get a link to update
      const listResponse = await fetch('/payment-links');
      const listData = await listResponse.json();
      const linkToUpdate = listData.data.find((link: any) => link.status === 'pending');

      if (!linkToUpdate) {
        // Create one first
        const createResponse = await fetch('/payment-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 1000,
            currency: 'USD',
            description: 'Link to update',
          }),
        });
        const createData = await createResponse.json();
        linkToUpdate = createData.data;
      }

      const updates = {
        description: 'Updated Description',
        customerName: 'Updated Customer',
      };

      const response = await fetch(`/payment-links/${linkToUpdate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.description).toBe('Updated Description');
      expect(data.data.customerName).toBe('Updated Customer');
      expect(data.data.updatedAt).not.toBe(linkToUpdate.updatedAt);
    });

    it('should return 404 for non-existent payment link', async () => {
      const response = await fetch('/payment-links/non-existent-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Updated' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /payment-links/:id/void', () => {
    it('should void a pending payment link', async () => {
      // Create a new link to void
      const createResponse = await fetch('/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          currency: 'USD',
          description: 'Link to void',
        }),
      });
      const createData = await createResponse.json();
      const linkToVoid = createData.data;

      const response = await fetch(`/payment-links/${linkToVoid.id}/void`, {
        method: 'POST',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('voided');
      expect(data.message).toContain('voided successfully');
    });

    it('should not void non-pending payment link', async () => {
      // Find a completed link
      const listResponse = await fetch('/payment-links');
      const listData = await listResponse.json();
      const completedLink = listData.data.find((link: any) => link.status === 'completed');

      if (completedLink) {
        const response = await fetch(`/payment-links/${completedLink.id}/void`, {
          method: 'POST',
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.detail).toContain('Can only void pending payment links');
      }
    });

    it('should return 404 for non-existent payment link', async () => {
      const response = await fetch('/payment-links/non-existent-id/void', {
        method: 'POST',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /payment-links/:id/resend', () => {
    it('should resend a payment link with customer email', async () => {
      // Create a new link with email to resend
      const createResponse = await fetch('/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          currency: 'USD',
          description: 'Link to resend',
          customerEmail: 'customer@example.com',
        }),
      });
      const createData = await createResponse.json();
      const linkToResend = createData.data;

      const response = await fetch(`/payment-links/${linkToResend.id}/resend`, {
        method: 'POST',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('customer@example.com');
      expect(data.data.id).toBe(linkToResend.id);
    });

    it('should not resend without customer email', async () => {
      // Create a new link without email
      const createResponse = await fetch('/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          currency: 'USD',
          description: 'Link without email',
        }),
      });
      const createData = await createResponse.json();
      const linkWithoutEmail = createData.data;

      const response = await fetch(`/payment-links/${linkWithoutEmail.id}/resend`, {
        method: 'POST',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.detail).toContain('email is required');
    });
  });
});