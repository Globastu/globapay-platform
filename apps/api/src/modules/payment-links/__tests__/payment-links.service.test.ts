import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentLinksService } from '../payment-links.service';
import type { TenantContext } from '../../auth/types';

// Mock Prisma
const mockPrisma = {
  paymentLink: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
};

describe('PaymentLinksService', () => {
  let service: PaymentLinksService;
  let mockTenantContext: TenantContext;

  beforeEach(() => {
    service = new PaymentLinksService(mockPrisma as any);
    mockTenantContext = {
      organizationId: 'org-123',
      merchantId: 'merchant-456',
      userId: 'user-789',
      permissions: ['PAYMENT_LINKS_WRITE'],
      isApiKey: false,
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('createPaymentLink', () => {
    it('should create a payment link with valid data', async () => {
      const createRequest = {
        amount: 10000, // $100.00
        currency: 'USD',
        description: 'Test payment',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
      };

      const mockCreatedLink = {
        id: 'pl-123',
        merchantId: 'merchant-456',
        shortCode: 'ABCD1234',
        amount: 10000,
        currency: 'USD',
        description: 'Test payment',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        status: 'pending',
        url: 'https://pay.globapay.com/link/ABCD1234',
        expiresAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.paymentLink.findUnique.mockResolvedValue(null); // No collision
      mockPrisma.paymentLink.create.mockResolvedValue(mockCreatedLink);

      const result = await service.createPaymentLink(createRequest, mockTenantContext);

      expect(result).toEqual(mockCreatedLink);
      expect(mockPrisma.paymentLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          merchantId: 'merchant-456',
          amount: 10000,
          currency: 'USD',
          description: 'Test payment',
          customerEmail: 'test@example.com',
          customerName: 'Test Customer',
          status: 'pending',
          shortCode: expect.any(String),
          url: expect.stringContaining('https://pay.globapay.com/link/'),
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should retry short code generation on collision', async () => {
      const createRequest = {
        amount: 5000,
        currency: 'USD',
        description: 'Test payment',
      };

      // First call returns existing link (collision), second returns null
      mockPrisma.paymentLink.findUnique
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      mockPrisma.paymentLink.create.mockResolvedValue({
        id: 'pl-123',
        shortCode: 'EFGH5678',
      });

      await service.createPaymentLink(createRequest, mockTenantContext);

      expect(mockPrisma.paymentLink.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.paymentLink.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error after max collision attempts', async () => {
      const createRequest = {
        amount: 5000,
        currency: 'USD',
        description: 'Test payment',
      };

      // Always return existing link (collision)
      mockPrisma.paymentLink.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createPaymentLink(createRequest, mockTenantContext)
      ).rejects.toThrow('Unable to generate unique short code');

      expect(mockPrisma.paymentLink.findUnique).toHaveBeenCalledTimes(5);
      expect(mockPrisma.paymentLink.create).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentLinks', () => {
    it('should return paginated payment links', async () => {
      const mockLinks = [
        { id: 'pl-1', description: 'Payment 1', createdAt: new Date() },
        { id: 'pl-2', description: 'Payment 2', createdAt: new Date() },
      ];

      mockPrisma.paymentLink.count.mockResolvedValue(25);
      mockPrisma.paymentLink.findMany.mockResolvedValue(mockLinks);

      const result = await service.getPaymentLinks(
        { page: 2, limit: 10 },
        mockTenantContext
      );

      expect(result).toEqual({
        data: mockLinks,
        pagination: {
          page: 2,
          limit: 10,
          totalCount: 25,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: true,
        },
      });

      expect(mockPrisma.paymentLink.findMany).toHaveBeenCalledWith({
        where: { merchantId: 'merchant-456' },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });

    it('should filter by status', async () => {
      mockPrisma.paymentLink.count.mockResolvedValue(5);
      mockPrisma.paymentLink.findMany.mockResolvedValue([]);

      await service.getPaymentLinks(
        { status: 'pending' },
        mockTenantContext
      );

      expect(mockPrisma.paymentLink.findMany).toHaveBeenCalledWith({
        where: {
          merchantId: 'merchant-456',
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should filter by search term', async () => {
      mockPrisma.paymentLink.count.mockResolvedValue(2);
      mockPrisma.paymentLink.findMany.mockResolvedValue([]);

      await service.getPaymentLinks(
        { search: 'invoice' },
        mockTenantContext
      );

      expect(mockPrisma.paymentLink.findMany).toHaveBeenCalledWith({
        where: {
          merchantId: 'merchant-456',
          OR: [
            { description: { contains: 'invoice', mode: 'insensitive' } },
            { customerEmail: { contains: 'invoice', mode: 'insensitive' } },
            { customerName: { contains: 'invoice', mode: 'insensitive' } },
            { reference: { contains: 'invoice', mode: 'insensitive' } },
            { shortCode: { contains: 'INVOICE', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getPaymentLink', () => {
    it('should return payment link for valid ID', async () => {
      const mockLink = {
        id: 'pl-123',
        merchantId: 'merchant-456',
        description: 'Test payment',
      };

      mockPrisma.paymentLink.findFirst.mockResolvedValue(mockLink);

      const result = await service.getPaymentLink('pl-123', mockTenantContext);

      expect(result).toEqual(mockLink);
      expect(mockPrisma.paymentLink.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'pl-123',
          merchantId: 'merchant-456',
        },
      });
    });

    it('should throw error for non-existent payment link', async () => {
      mockPrisma.paymentLink.findFirst.mockResolvedValue(null);

      await expect(
        service.getPaymentLink('pl-999', mockTenantContext)
      ).rejects.toThrow('Payment link not found');
    });
  });

  describe('voidPaymentLink', () => {
    it('should void a pending payment link', async () => {
      const mockLink = {
        id: 'pl-123',
        merchantId: 'merchant-456',
        status: 'pending',
      };

      const mockVoidedLink = {
        ...mockLink,
        status: 'voided',
        updatedAt: new Date(),
      };

      mockPrisma.paymentLink.findFirst.mockResolvedValue(mockLink);
      mockPrisma.paymentLink.update.mockResolvedValue(mockVoidedLink);

      const result = await service.voidPaymentLink('pl-123', mockTenantContext);

      expect(result).toEqual(mockVoidedLink);
      expect(mockPrisma.paymentLink.update).toHaveBeenCalledWith({
        where: { id: 'pl-123' },
        data: {
          status: 'voided',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error for non-pending payment link', async () => {
      const mockLink = {
        id: 'pl-123',
        merchantId: 'merchant-456',
        status: 'completed',
      };

      mockPrisma.paymentLink.findFirst.mockResolvedValue(mockLink);

      await expect(
        service.voidPaymentLink('pl-123', mockTenantContext)
      ).rejects.toThrow('Can only void pending payment links');

      expect(mockPrisma.paymentLink.update).not.toHaveBeenCalled();
    });
  });

  describe('resendPaymentLink', () => {
    it('should resend a pending payment link with email', async () => {
      const mockLink = {
        id: 'pl-123',
        merchantId: 'merchant-456',
        status: 'pending',
        customerEmail: 'test@example.com',
        url: 'https://pay.globapay.com/link/ABCD1234',
      };

      const mockUpdatedLink = {
        ...mockLink,
        updatedAt: new Date(),
      };

      mockPrisma.paymentLink.findFirst.mockResolvedValue(mockLink);
      mockPrisma.paymentLink.update.mockResolvedValue(mockUpdatedLink);

      const result = await service.resendPaymentLink('pl-123', mockTenantContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('test@example.com');
      expect(result.paymentLink).toEqual(mockUpdatedLink);
    });

    it('should throw error for payment link without email', async () => {
      const mockLink = {
        id: 'pl-123',
        merchantId: 'merchant-456',
        status: 'pending',
        customerEmail: null,
      };

      mockPrisma.paymentLink.findFirst.mockResolvedValue(mockLink);

      await expect(
        service.resendPaymentLink('pl-123', mockTenantContext)
      ).rejects.toThrow('Customer email is required to resend payment link');
    });
  });

  describe('markExpiredPaymentLinks', () => {
    it('should mark expired payment links', async () => {
      const mockResult = { count: 5 };
      mockPrisma.paymentLink.updateMany.mockResolvedValue(mockResult);

      const result = await service.markExpiredPaymentLinks();

      expect(result).toEqual(mockResult);
      expect(mockPrisma.paymentLink.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'pending',
          expiresAt: {
            lt: expect.any(Date),
          },
        },
        data: {
          status: 'expired',
          updatedAt: expect.any(Date),
        },
      });
    });
  });
});