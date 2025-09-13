import type { 
  FraudProvider, 
  FraudCheckRequest, 
  FraudCheckResult,
  FraudCheck 
} from './types';
import { MockFraudProvider } from './providers/mock-fraud-provider';
import { PrismaClient } from '@prisma/client';

export class FraudService {
  private provider: FraudProvider;
  private prisma: PrismaClient;

  constructor(provider?: FraudProvider, prisma?: PrismaClient) {
    this.provider = provider || new MockFraudProvider();
    this.prisma = prisma || new PrismaClient();
  }

  async checkFraud(
    request: FraudCheckRequest,
    checkoutSessionId?: string,
    transactionId?: string
  ): Promise<FraudCheckResult> {
    const startTime = Date.now();
    let fraudCheck: any = null;
    
    try {
      const result = await this.provider.checkFraud(request);
      
      // Store fraud check record in database
      try {
        fraudCheck = await this.prisma.fraudCheck.create({
          data: {
            checkoutSessionId: checkoutSessionId || null,
            transactionId: transactionId || null,
            merchantId: request.merchantId,
            requestData: request as any,
            score: result.score,
            decision: result.decision.toUpperCase() as any,
            confidence: result.confidence,
            riskFactors: result.riskFactors,
            rules: result.rules,
            providerId: result.providerId,
            providerTransactionId: result.providerTransactionId,
            processingTime: result.processingTime,
            status: 'completed',
            recommendation: result.recommendation,
            metadata: result.metadata,
          },
        });
      } catch (dbError) {
        console.error('Failed to store fraud check record:', dbError);
      }
      
      // Log the fraud check for audit purposes
      console.log(`Fraud check completed for merchant ${request.merchantId}:`, {
        score: result.score,
        decision: result.decision,
        confidence: result.confidence,
        processingTime: result.processingTime,
        riskFactorCount: result.riskFactors.length,
        triggeredRules: result.rules.filter(r => r.triggered).length,
      });

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Fraud check failed:', error);
      
      const errorResult = {
        score: 50,
        decision: 'review' as const,
        confidence: 0,
        riskFactors: [{
          factor: 'provider_error',
          severity: 'high' as const,
          score: 50,
          description: 'Fraud provider error - manual review required',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }],
        rules: [],
        providerId: this.provider.name || 'unknown',
        providerTransactionId: `error_${Date.now()}`,
        processingTime,
        recommendation: 'Fraud provider error - please review this transaction manually.',
        metadata: {
          error: true,
          providerId: this.provider.name,
        },
      };

      // Store failed fraud check record
      try {
        await this.prisma.fraudCheck.create({
          data: {
            checkoutSessionId: checkoutSessionId || null,
            transactionId: transactionId || null,
            merchantId: request.merchantId,
            requestData: request as any,
            score: errorResult.score,
            decision: errorResult.decision.toUpperCase() as any,
            confidence: errorResult.confidence,
            riskFactors: errorResult.riskFactors,
            rules: errorResult.rules,
            providerId: errorResult.providerId,
            providerTransactionId: errorResult.providerTransactionId,
            processingTime: errorResult.processingTime,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            recommendation: errorResult.recommendation,
            metadata: errorResult.metadata,
          },
        });
      } catch (dbError) {
        console.error('Failed to store failed fraud check record:', dbError);
      }
      
      return errorResult;
    }
  }

  async updateFraudResult(
    providerTransactionId: string,
    actualOutcome: 'approved' | 'declined' | 'chargeback' | 'legitimate'
  ): Promise<void> {
    if (this.provider.updateResult) {
      await this.provider.updateResult(providerTransactionId, actualOutcome);
    }
  }

  async getProviderStatus() {
    return await this.provider.getStatus();
  }

  getProviderInfo() {
    return {
      name: this.provider.name,
      version: this.provider.version,
    };
  }

  // Helper method to build fraud request from checkout session data
  buildFraudRequest(data: {
    amount: number;
    currency: string;
    merchantId: string;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    paymentMethod: {
      type: 'card' | 'wallet' | 'bank_transfer';
      cardFingerprint?: string;
      walletProvider?: string;
      last4?: string;
      country?: string;
    };
    ipAddress: string;
    userAgent: string;
    browserFingerprint?: string;
    billingAddress?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    sessionId?: string;
    referrer?: string;
    customerHistory?: {
      totalTransactions: number;
      totalAmount: number;
      firstTransactionDate?: Date;
      lastTransactionDate?: Date;
      chargebacks: number;
    };
    metadata?: Record<string, any>;
  }): FraudCheckRequest {
    return {
      amount: data.amount,
      currency: data.currency,
      merchantId: data.merchantId,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      paymentMethod: data.paymentMethod,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      browserFingerprint: data.browserFingerprint,
      billingAddress: data.billingAddress,
      sessionId: data.sessionId,
      referrer: data.referrer,
      customerHistory: data.customerHistory,
      metadata: data.metadata,
    };
  }
}

// Export singleton instance
export const fraudService = new FraudService();