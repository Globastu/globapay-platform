import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '../auth/types';
import { AuditService } from '../audit/audit.service';

export interface TransactionListFilters {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  paymentLinkId?: string;
  merchantId?: string;
  customerEmail?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  paymentMethod?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TransactionWithDetails {
  id: string;
  merchantId: string;
  paymentLinkId?: string;
  checkoutSessionId?: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  status: string;
  paymentMethodId?: string;
  paymentMethodType?: string;
  reference?: string;
  fraudScore?: number;
  require3DS: boolean;
  threeDSStatus?: string;
  processorTransactionId?: string;
  processorResponse?: Record<string, any>;
  failureCode?: string;
  failureMessage?: string;
  refundedAmount?: number;
  fees?: TransactionFee[];
  refunds?: Refund[];
  paymentLink?: {
    id: string;
    shortCode: string;
    description: string;
  };
  checkoutSession?: {
    id: string;
    token: string;
    checkoutUrl: string;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processorRefundId?: string;
  processorResponse?: Record<string, any>;
  failureCode?: string;
  failureMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TransactionFee {
  id: string;
  transactionId: string;
  type: 'payment_processing' | 'platform_fee' | 'merchant_service_charge';
  amount: number;
  currency: string;
  description: string;
  createdAt: Date;
}

export interface RefundRequest {
  amount: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundValidationResult {
  valid: boolean;
  error?: string;
  maxRefundAmount?: number;
  availableAmount?: number;
}

export class TransactionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get paginated list of transactions with filters
   */
  async getTransactions(
    tenant: TenantContext,
    filters: TransactionListFilters = {}
  ): Promise<{
    transactions: TransactionWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const {
      status,
      paymentLinkId,
      merchantId,
      customerEmail,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      currency,
      paymentMethod,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause with tenant scoping
    const where: any = {
      organizationId: tenant.organizationId,
      ...(tenant.merchantId && { merchantId: tenant.merchantId }),
      ...(status && { status }),
      ...(paymentLinkId && { paymentLinkId }),
      ...(merchantId && { merchantId }),
      ...(customerEmail && { customerEmail: { contains: customerEmail, mode: 'insensitive' } }),
      ...(dateFrom && { createdAt: { gte: dateFrom } }),
      ...(dateTo && { createdAt: { ...where.createdAt, lte: dateTo } }),
      ...(minAmount && { amount: { gte: minAmount } }),
      ...(maxAmount && { amount: { ...where.amount, lte: maxAmount } }),
      ...(currency && { currency }),
      ...(paymentMethod && { paymentMethodType: paymentMethod }),
    };

    // Add search functionality
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { processorTransactionId: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get transactions with related data
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          refunds: {
            orderBy: { createdAt: 'desc' },
          },
          fees: {
            orderBy: { createdAt: 'desc' },
          },
          paymentLink: {
            select: {
              id: true,
              shortCode: true,
              description: true,
            },
          },
          checkoutSession: {
            select: {
              id: true,
              token: true,
              checkoutUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      transactions: transactions.map(this.mapTransactionWithDetails),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get transaction by ID with full details
   */
  async getTransactionById(
    transactionId: string,
    tenant: TenantContext
  ): Promise<TransactionWithDetails | null> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        organizationId: tenant.organizationId,
        ...(tenant.merchantId && { merchantId: tenant.merchantId }),
      },
      include: {
        refunds: {
          orderBy: { createdAt: 'desc' },
        },
        fees: {
          orderBy: { createdAt: 'desc' },
        },
        paymentLink: {
          select: {
            id: true,
            shortCode: true,
            description: true,
          },
        },
        checkoutSession: {
          select: {
            id: true,
            token: true,
            checkoutUrl: true,
          },
        },
      },
    });

    return transaction ? this.mapTransactionWithDetails(transaction) : null;
  }

  /**
   * Validate refund request
   */
  validateRefund(
    transaction: TransactionWithDetails,
    refundRequest: RefundRequest
  ): RefundValidationResult {
    // Only completed transactions can be refunded
    if (transaction.status !== 'completed') {
      return {
        valid: false,
        error: 'Only completed transactions can be refunded',
      };
    }

    // Calculate available refund amount
    const refundedAmount = transaction.refundedAmount || 0;
    const availableAmount = transaction.amount - refundedAmount;

    if (availableAmount <= 0) {
      return {
        valid: false,
        error: 'Transaction has already been fully refunded',
        maxRefundAmount: 0,
        availableAmount: 0,
      };
    }

    // Validate refund amount
    if (refundRequest.amount <= 0) {
      return {
        valid: false,
        error: 'Refund amount must be greater than zero',
        maxRefundAmount: availableAmount,
        availableAmount,
      };
    }

    if (refundRequest.amount > availableAmount) {
      return {
        valid: false,
        error: `Refund amount (${refundRequest.amount / 100}) exceeds available amount (${availableAmount / 100})`,
        maxRefundAmount: availableAmount,
        availableAmount,
      };
    }

    // Check refund window (e.g., 180 days)
    const refundWindowDays = 180;
    const refundWindowMs = refundWindowDays * 24 * 60 * 60 * 1000;
    const transactionAge = Date.now() - transaction.createdAt.getTime();

    if (transactionAge > refundWindowMs) {
      return {
        valid: false,
        error: `Refund window has expired. Transactions can only be refunded within ${refundWindowDays} days.`,
        maxRefundAmount: availableAmount,
        availableAmount,
      };
    }

    return {
      valid: true,
      maxRefundAmount: availableAmount,
      availableAmount,
    };
  }

  /**
   * Process refund for transaction
   */
  async refundTransaction(
    transactionId: string,
    refundRequest: RefundRequest,
    tenant: TenantContext,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    refund?: Refund;
    error?: string;
  }> {
    // Get transaction with full details
    const transaction = await this.getTransactionById(transactionId, tenant);
    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    // Validate refund
    const validation = this.validateRefund(transaction, refundRequest);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      // Begin transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create refund record
        const refund = await tx.refund.create({
          data: {
            id: `re_${Math.random().toString(36).substr(2, 16)}`,
            transactionId,
            merchantId: transaction.merchantId,
            amount: refundRequest.amount,
            currency: transaction.currency,
            reason: refundRequest.reason || 'Requested by merchant',
            status: 'pending',
            organizationId: tenant.organizationId,
            metadata: refundRequest.metadata || {},
          },
        });

        // Update transaction refunded amount and status
        const newRefundedAmount = (transaction.refundedAmount || 0) + refundRequest.amount;
        const isFullyRefunded = newRefundedAmount >= transaction.amount;
        const newStatus = isFullyRefunded ? 'refunded' : 'partially_refunded';

        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            refundedAmount: newRefundedAmount,
            status: newStatus,
            updatedAt: new Date(),
          },
        });

        return refund;
      });

      // In a real implementation, this would integrate with payment processor
      // For now, we'll simulate successful refund processing
      await this.simulateRefundProcessing(result.id);

      // Log refund audit event
      await AuditService.logTransactionRefund(
        tenant,
        transactionId,
        result.id,
        refundRequest.amount,
        transaction.currency,
        refundRequest.reason || 'Requested by merchant',
        'SUCCESS',
        undefined,
        ipAddress,
        userAgent
      );

      return {
        success: true,
        refund: this.mapRefund(result),
      };
    } catch (error) {
      console.error('Refund processing failed:', error);

      // Log failed refund attempt
      await AuditService.logTransactionRefund(
        tenant,
        transactionId,
        `re_failed_${Date.now()}`,
        refundRequest.amount,
        transaction.currency,
        refundRequest.reason || 'Requested by merchant',
        'FAILURE',
        error instanceof Error ? error.message : 'Unknown error',
        ipAddress,
        userAgent
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed',
      };
    }
  }

  /**
   * Get transaction statistics for dashboard
   */
  async getTransactionStats(
    tenant: TenantContext,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalTransactions: number;
    totalAmount: number;
    completedTransactions: number;
    completedAmount: number;
    refundedTransactions: number;
    refundedAmount: number;
    averageTransactionAmount: number;
    successRate: number;
  }> {
    const where = {
      organizationId: tenant.organizationId,
      ...(tenant.merchantId && { merchantId: tenant.merchantId }),
      ...(dateFrom && { createdAt: { gte: dateFrom } }),
      ...(dateTo && { createdAt: { ...where.createdAt, lte: dateTo } }),
    };

    const [
      totalStats,
      completedStats,
      refundedStats,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where,
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, status: 'completed' },
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, status: { in: ['refunded', 'partially_refunded'] } },
        _count: { id: true },
        _sum: { refundedAmount: true },
      }),
    ]);

    const totalTransactions = totalStats._count.id;
    const totalAmount = totalStats._sum.amount || 0;
    const completedTransactions = completedStats._count.id;
    const completedAmount = completedStats._sum.amount || 0;
    const refundedTransactions = refundedStats._count.id;
    const refundedAmount = refundedStats._sum.refundedAmount || 0;

    const averageTransactionAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    const successRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0;

    return {
      totalTransactions,
      totalAmount,
      completedTransactions,
      completedAmount,
      refundedTransactions,
      refundedAmount,
      averageTransactionAmount,
      successRate,
    };
  }

  /**
   * Export transactions to CSV format
   */
  generateTransactionsCSV(transactions: TransactionWithDetails[]): string {
    const headers = [
      'Transaction ID',
      'Date',
      'Customer Email',
      'Customer Name',
      'Description',
      'Amount',
      'Currency',
      'Status',
      'Payment Method',
      'Reference',
      'Fraud Score',
      '3DS Required',
      '3DS Status',
      'Refunded Amount',
      'Fees',
      'Processor ID',
      'Failure Code',
      'Payment Link',
      'Created At',
      'Completed At',
    ].join(',');

    const rows = transactions.map(tx => [
      tx.id,
      tx.createdAt.toISOString().split('T')[0], // Date only
      tx.customerEmail || '',
      tx.customerName || '',
      `"${tx.description.replace(/"/g, '""')}"`, // Escape quotes
      (tx.amount / 100).toFixed(2), // Convert cents to currency
      tx.currency,
      tx.status,
      tx.paymentMethodType || '',
      tx.reference || '',
      tx.fraudScore?.toString() || '',
      tx.require3DS ? 'Yes' : 'No',
      tx.threeDSStatus || '',
      tx.refundedAmount ? (tx.refundedAmount / 100).toFixed(2) : '0.00',
      tx.fees?.reduce((sum, fee) => sum + fee.amount, 0) || 0,
      tx.processorTransactionId || '',
      tx.failureCode || '',
      tx.paymentLink?.shortCode || '',
      tx.createdAt.toISOString(),
      tx.completedAt?.toISOString() || '',
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  // Private helper methods
  private mapTransactionWithDetails(transaction: any): TransactionWithDetails {
    return {
      id: transaction.id,
      merchantId: transaction.merchantId,
      paymentLinkId: transaction.paymentLinkId,
      checkoutSessionId: transaction.checkoutSessionId,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      customerEmail: transaction.customerEmail,
      customerName: transaction.customerName,
      status: transaction.status,
      paymentMethodId: transaction.paymentMethodId,
      paymentMethodType: transaction.paymentMethodType,
      reference: transaction.reference,
      fraudScore: transaction.fraudScore,
      require3DS: transaction.require3DS,
      threeDSStatus: transaction.threeDSStatus,
      processorTransactionId: transaction.processorTransactionId,
      processorResponse: transaction.processorResponse as Record<string, any>,
      failureCode: transaction.failureCode,
      failureMessage: transaction.failureMessage,
      refundedAmount: transaction.refundedAmount,
      fees: transaction.fees?.map(this.mapTransactionFee) || [],
      refunds: transaction.refunds?.map(this.mapRefund) || [],
      paymentLink: transaction.paymentLink,
      checkoutSession: transaction.checkoutSession,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      completedAt: transaction.completedAt,
      metadata: transaction.metadata as Record<string, any>,
    };
  }

  private mapRefund(refund: any): Refund {
    return {
      id: refund.id,
      transactionId: refund.transactionId,
      amount: refund.amount,
      currency: refund.currency,
      reason: refund.reason,
      status: refund.status,
      processorRefundId: refund.processorRefundId,
      processorResponse: refund.processorResponse as Record<string, any>,
      failureCode: refund.failureCode,
      failureMessage: refund.failureMessage,
      createdAt: refund.createdAt,
      updatedAt: refund.updatedAt,
      completedAt: refund.completedAt,
    };
  }

  private mapTransactionFee(fee: any): TransactionFee {
    return {
      id: fee.id,
      transactionId: fee.transactionId,
      type: fee.type,
      amount: fee.amount,
      currency: fee.currency,
      description: fee.description,
      createdAt: fee.createdAt,
    };
  }

  /**
   * Simulate refund processing (in real implementation, this would call payment processor)
   */
  private async simulateRefundProcessing(refundId: string): Promise<void> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update refund status to completed
    await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        processorRefundId: `processor_ref_${Math.random().toString(36).substr(2, 8)}`,
        updatedAt: new Date(),
      },
    });
  }
}