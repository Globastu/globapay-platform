import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '../auth/types';
import { fraudService } from '../fraud/fraud.service';
import type { FraudDecision } from '../fraud/types';

export interface CreateCheckoutSessionRequest {
  paymentLinkId?: string;
  merchantId?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
  cancelUrl?: string;
  // 3DS and fraud detection flags
  require3DS?: boolean;
  skipFraudCheck?: boolean;
  // Request context for fraud detection
  ipAddress?: string;
  userAgent?: string;
  browserFingerprint?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod?: {
    type: 'card' | 'wallet' | 'bank_transfer';
    cardFingerprint?: string;
    walletProvider?: string;
    last4?: string;
    country?: string;
  };
}

export interface CheckoutSession {
  id: string;
  token: string;
  paymentLinkId?: string;
  merchantId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  status: 'active' | 'expired' | 'completed' | 'cancelled';
  // URLs for hosted checkout
  checkoutUrl: string;
  returnUrl?: string;
  cancelUrl?: string;
  // 3DS and fraud settings
  require3DS: boolean;
  skipFraudCheck: boolean;
  fraudScore?: number;
  fraudDecision?: FraudDecision;
  fraudProviderTransactionId?: string;
  // Timestamps
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, string>;
}

export class CheckoutService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate a secure session token for checkout
   */
  private generateSessionToken(): string {
    // 32 bytes = 64 character hex string
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate checkout URL for hosted checkout
   */
  private generateCheckoutUrl(token: string): string {
    const baseUrl = process.env.CHECKOUT_BASE_URL || 'https://checkout.globapay.com';
    return `${baseUrl}/session/${token}`;
  }

  /**
   * Create a new checkout session
   */
  async createCheckoutSession(
    request: CreateCheckoutSessionRequest,
    tenant: TenantContext
  ): Promise<CheckoutSession> {
    // If paymentLinkId is provided, get payment link details
    let paymentLink = null;
    if (request.paymentLinkId) {
      paymentLink = await this.prisma.paymentLink.findFirst({
        where: {
          id: request.paymentLinkId,
          merchantId: tenant.merchantId!,
          status: 'pending', // Only allow checkout for pending links
        },
      });

      if (!paymentLink) {
        throw new Error('Payment link not found or not available for checkout');
      }

      // Check if payment link is expired
      if (paymentLink.expiresAt < new Date()) {
        // Mark as expired
        await this.prisma.paymentLink.update({
          where: { id: request.paymentLinkId },
          data: { status: 'expired', updatedAt: new Date() },
        });
        throw new Error('Payment link has expired');
      }
    }

    // Validate request - either paymentLinkId or direct payment details required
    if (!request.paymentLinkId && (!request.amount || !request.currency || !request.description)) {
      throw new Error('Either paymentLinkId or amount/currency/description must be provided');
    }

    // Use payment link details or request details
    const amount = paymentLink?.amount || request.amount!;
    const currency = paymentLink?.currency || request.currency!;
    const description = paymentLink?.description || request.description!;
    const customerEmail = paymentLink?.customerEmail || request.customerEmail;
    const customerName = paymentLink?.customerName || request.customerName;
    const merchantId = paymentLink?.merchantId || request.merchantId || tenant.merchantId!;

    // Generate session token and URLs
    const token = this.generateSessionToken();
    const checkoutUrl = this.generateCheckoutUrl(token);

    // Session expires in 30 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Determine 3DS requirements based on amount and region
    // For amounts over €30 in EU, 3DS is typically required
    const require3DS = request.require3DS ?? (currency === 'EUR' && amount > 3000);

    // Perform fraud check if not skipped
    let fraudScore: number | undefined;
    let fraudDecision: FraudDecision | undefined;
    let fraudProviderTransactionId: string | undefined;
    
    if (!request.skipFraudCheck) {
      try {
        const fraudRequest = fraudService.buildFraudRequest({
          amount,
          currency,
          merchantId,
          customerEmail,
          customerName,
          customerPhone: request.customerPhone,
          paymentMethod: request.paymentMethod || {
            type: 'card', // Default assumption
            country: 'US', // Default assumption
          },
          ipAddress: request.ipAddress || '127.0.0.1',
          userAgent: request.userAgent || 'Unknown',
          browserFingerprint: request.browserFingerprint,
          billingAddress: request.billingAddress,
          metadata: request.metadata,
        });

        const fraudResult = await fraudService.checkFraud(fraudRequest);
        
        fraudScore = fraudResult.score;
        fraudDecision = fraudResult.decision;
        fraudProviderTransactionId = fraudResult.providerTransactionId;

        // If fraud decision is 'decline', we should prevent session creation
        if (fraudResult.decision === 'decline') {
          throw new Error('Transaction declined due to high fraud risk');
        }
      } catch (error) {
        console.error('Fraud check failed during checkout session creation:', error);
        
        // On fraud check failure, default to safe behavior
        if (error instanceof Error && error.message.includes('declined due to high fraud risk')) {
          throw error; // Re-throw decline decisions
        }
        
        // For other errors, allow creation but flag for review
        fraudScore = 50;
        fraudDecision = 'review';
        fraudProviderTransactionId = `error_${Date.now()}`;
      }
    }

    // Create checkout session in database
    const session = await this.prisma.checkoutSession.create({
      data: {
        id: `cs_${randomBytes(16).toString('hex')}`,
        token,
        paymentLinkId: request.paymentLinkId || null,
        merchantId,
        amount,
        currency,
        description,
        customerEmail: customerEmail || null,
        customerName: customerName || null,
        status: 'active',
        checkoutUrl,
        returnUrl: request.returnUrl || null,
        cancelUrl: request.cancelUrl || null,
        require3DS,
        skipFraudCheck: request.skipFraudCheck || false,
        fraudScore: fraudScore || null,
        fraudDecision: fraudDecision || null,
        fraudProviderTransactionId: fraudProviderTransactionId || null,
        expiresAt,
        metadata: request.metadata || {},
      },
    });

    // Update fraud check record with session ID if fraud check was performed
    if (fraudProviderTransactionId && !request.skipFraudCheck) {
      try {
        // Since fraud service creates records, we need to find and update it
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.fraudCheck.updateMany({
          where: {
            providerTransactionId: fraudProviderTransactionId,
            checkoutSessionId: null,
          },
          data: {
            checkoutSessionId: session.id,
          },
        });
        await prisma.$disconnect();
      } catch (error) {
        console.error('Failed to update fraud check with session ID:', error);
      }
    }

    return {
      id: session.id,
      token: session.token,
      paymentLinkId: session.paymentLinkId || undefined,
      merchantId: session.merchantId,
      amount: session.amount,
      currency: session.currency,
      description: session.description,
      customerEmail: session.customerEmail || undefined,
      customerName: session.customerName || undefined,
      status: session.status as CheckoutSession['status'],
      checkoutUrl: session.checkoutUrl,
      returnUrl: session.returnUrl || undefined,
      cancelUrl: session.cancelUrl || undefined,
      require3DS: session.require3DS,
      skipFraudCheck: session.skipFraudCheck,
      fraudScore: session.fraudScore || undefined,
      fraudDecision: session.fraudDecision as FraudDecision || undefined,
      fraudProviderTransactionId: session.fraudProviderTransactionId || undefined,
      expiresAt: session.expiresAt,
      completedAt: session.completedAt || undefined,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      metadata: session.metadata as Record<string, string>,
    };
  }

  /**
   * Get checkout session by token
   */
  async getCheckoutSession(token: string): Promise<CheckoutSession | null> {
    const session = await this.prisma.checkoutSession.findUnique({
      where: { token },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date() && session.status === 'active') {
      await this.prisma.checkoutSession.update({
        where: { token },
        data: { status: 'expired', updatedAt: new Date() },
      });
      
      return {
        ...session,
        status: 'expired',
        fraudDecision: session.fraudDecision as FraudDecision,
      } as CheckoutSession;
    }

    return {
      id: session.id,
      token: session.token,
      paymentLinkId: session.paymentLinkId || undefined,
      merchantId: session.merchantId,
      amount: session.amount,
      currency: session.currency,
      description: session.description,
      customerEmail: session.customerEmail || undefined,
      customerName: session.customerName || undefined,
      status: session.status as CheckoutSession['status'],
      checkoutUrl: session.checkoutUrl,
      returnUrl: session.returnUrl || undefined,
      cancelUrl: session.cancelUrl || undefined,
      require3DS: session.require3DS,
      skipFraudCheck: session.skipFraudCheck,
      fraudScore: session.fraudScore || undefined,
      fraudDecision: session.fraudDecision as FraudDecision || undefined,
      fraudProviderTransactionId: session.fraudProviderTransactionId || undefined,
      expiresAt: session.expiresAt,
      completedAt: session.completedAt || undefined,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      metadata: session.metadata as Record<string, string>,
    };
  }

  /**
   * Complete checkout session (called when payment is successful)
   */
  async completeCheckoutSession(
    token: string,
    transactionId: string,
    fraudScore?: number
  ): Promise<CheckoutSession> {
    const session = await this.prisma.checkoutSession.findUnique({
      where: { token },
    });

    if (!session) {
      throw new Error('Checkout session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Checkout session is not active');
    }

    // Update session as completed
    const updatedSession = await this.prisma.checkoutSession.update({
      where: { token },
      data: {
        status: 'completed',
        fraudScore,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // If this was for a payment link, mark it as completed
    if (session.paymentLinkId) {
      await this.prisma.paymentLink.update({
        where: { id: session.paymentLinkId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          transactionId,
          updatedAt: new Date(),
        },
      });
    }

    return updatedSession as CheckoutSession;
  }

  /**
   * Cancel checkout session
   */
  async cancelCheckoutSession(token: string): Promise<CheckoutSession> {
    const session = await this.prisma.checkoutSession.findUnique({
      where: { token },
    });

    if (!session) {
      throw new Error('Checkout session not found');
    }

    const updatedSession = await this.prisma.checkoutSession.update({
      where: { token },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });

    return updatedSession as CheckoutSession;
  }

  /**
   * Expire old checkout sessions (scheduled job)
   */
  async expireOldSessions(): Promise<{ count: number }> {
    const now = new Date();
    
    const result = await this.prisma.checkoutSession.updateMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'expired',
        updatedAt: now,
      },
    });

    return { count: result.count };
  }

  /**
   * Get checkout sessions for a merchant (for admin/debugging)
   */
  async getCheckoutSessions(
    merchantId: string,
    filters: {
      status?: string;
      paymentLinkId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { status, paymentLinkId, limit = 50, offset = 0 } = filters;

    const where: any = { merchantId };
    
    if (status) {
      where.status = status;
    }
    
    if (paymentLinkId) {
      where.paymentLinkId = paymentLinkId;
    }

    const sessions = await this.prisma.checkoutSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return sessions.map(session => ({
      id: session.id,
      token: session.token,
      paymentLinkId: session.paymentLinkId || undefined,
      merchantId: session.merchantId,
      amount: session.amount,
      currency: session.currency,
      status: session.status,
      require3DS: session.require3DS,
      fraudScore: session.fraudScore || undefined,
      expiresAt: session.expiresAt,
      completedAt: session.completedAt || undefined,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));
  }
}