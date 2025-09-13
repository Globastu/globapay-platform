import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '../auth/types';

export interface CreatePaymentLinkRequest {
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  reference?: string;
  metadata?: Record<string, string>;
  expiresInDays?: number;
}

export interface UpdatePaymentLinkRequest {
  description?: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, string>;
}

export interface PaymentLinksListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export class PaymentLinksService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate a short, unique code for payment links
   */
  private generateShortCode(): string {
    // Generate 8 character code: 4 chars + 4 numbers
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I, O for readability
    const numbers = '23456789'; // Exclude 0, 1 for readability
    
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    for (let i = 0; i < 4; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return code;
  }

  /**
   * Generate public URL for payment link
   */
  private generatePaymentUrl(shortCode: string): string {
    const baseUrl = process.env.PAYMENT_LINK_BASE_URL || 'https://pay.globapay.com';
    return `${baseUrl}/link/${shortCode}`;
  }

  /**
   * Create a new payment link
   */
  async createPaymentLink(
    request: CreatePaymentLinkRequest,
    tenant: TenantContext
  ) {
    // Generate unique short code (retry if collision)
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      shortCode = this.generateShortCode();
      const existing = await this.prisma.paymentLink.findUnique({
        where: { shortCode },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique short code');
    }

    // Calculate expiration date
    const expiresInDays = request.expiresInDays || 7; // Default 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create payment link
    const paymentLink = await this.prisma.paymentLink.create({
      data: {
        merchantId: tenant.merchantId!,
        shortCode,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        customerEmail: request.customerEmail,
        customerName: request.customerName,
        reference: request.reference,
        status: 'pending',
        url: this.generatePaymentUrl(shortCode),
        expiresAt,
        metadata: request.metadata || {},
      },
    });

    return paymentLink;
  }

  /**
   * Get payment links list with filtering and pagination
   */
  async getPaymentLinks(
    params: PaymentLinksListParams,
    tenant: TenantContext
  ) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      merchantId: tenant.merchantId,
    };

    // Status filter
    if (params.status && params.status !== 'all') {
      where.status = params.status;
    }

    // Date range filter
    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) {
        where.createdAt.gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        where.createdAt.lte = new Date(params.toDate);
      }
    }

    // Search filter
    if (params.search) {
      const search = params.search.toLowerCase();
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search.toUpperCase(), mode: 'insensitive' } },
      ];
    }

    // Get total count and paginated results
    const [totalCount, paymentLinks] = await Promise.all([
      this.prisma.paymentLink.count({ where }),
      this.prisma.paymentLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: paymentLinks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get single payment link by ID
   */
  async getPaymentLink(id: string, tenant: TenantContext) {
    const paymentLink = await this.prisma.paymentLink.findFirst({
      where: {
        id,
        merchantId: tenant.merchantId,
      },
    });

    if (!paymentLink) {
      throw new Error('Payment link not found');
    }

    return paymentLink;
  }

  /**
   * Update payment link
   */
  async updatePaymentLink(
    id: string,
    request: UpdatePaymentLinkRequest,
    tenant: TenantContext
  ) {
    // Check if payment link exists and belongs to merchant
    const existing = await this.getPaymentLink(id, tenant);

    // Can only update if status is pending
    if (existing.status !== 'pending') {
      throw new Error('Can only update pending payment links');
    }

    const updated = await this.prisma.paymentLink.update({
      where: { id },
      data: {
        description: request.description,
        customerEmail: request.customerEmail,
        customerName: request.customerName,
        metadata: request.metadata,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Void a payment link
   */
  async voidPaymentLink(id: string, tenant: TenantContext) {
    // Check if payment link exists and belongs to merchant
    const existing = await this.getPaymentLink(id, tenant);

    // Can only void if status is pending
    if (existing.status !== 'pending') {
      throw new Error('Can only void pending payment links');
    }

    const voided = await this.prisma.paymentLink.update({
      where: { id },
      data: {
        status: 'voided',
        updatedAt: new Date(),
      },
    });

    return voided;
  }

  /**
   * Resend payment link notification
   */
  async resendPaymentLink(id: string, tenant: TenantContext) {
    // Check if payment link exists and belongs to merchant
    const existing = await this.getPaymentLink(id, tenant);

    // Can only resend if status is pending
    if (existing.status !== 'pending') {
      throw new Error('Can only resend pending payment links');
    }

    if (!existing.customerEmail) {
      throw new Error('Customer email is required to resend payment link');
    }

    // In a real implementation, this would send an email
    // For now, we'll just update the lastSentAt timestamp
    const updated = await this.prisma.paymentLink.update({
      where: { id },
      data: {
        // lastSentAt: new Date(), // Would need to add this field to schema
        updatedAt: new Date(),
      },
    });

    // TODO: Send email notification
    console.log(`Resending payment link to ${existing.customerEmail}: ${existing.url}`);

    return {
      success: true,
      message: `Payment link resent to ${existing.customerEmail}`,
      paymentLink: updated,
    };
  }

  /**
   * Mark payment link as completed (called when payment is successful)
   */
  async completePaymentLink(id: string, transactionId: string) {
    const completed = await this.prisma.paymentLink.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        transactionId,
        updatedAt: new Date(),
      },
    });

    return completed;
  }

  /**
   * Mark expired payment links (scheduled job)
   */
  async markExpiredPaymentLinks() {
    const now = new Date();
    
    const expired = await this.prisma.paymentLink.updateMany({
      where: {
        status: 'pending',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'expired',
        updatedAt: now,
      },
    });

    return expired;
  }
}