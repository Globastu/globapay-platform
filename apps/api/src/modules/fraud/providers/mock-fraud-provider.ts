import type { 
  FraudProvider, 
  FraudCheckRequest, 
  FraudCheckResult, 
  FraudDecision,
  FraudRiskFactor,
  FraudRule,
  FraudThresholds 
} from '../types';

export class MockFraudProvider implements FraudProvider {
  name = 'Mock Fraud Provider';
  version = '1.0.0';
  
  private thresholds: FraudThresholds = {
    approveBelow: 30,
    reviewAbove: 30,
    declineAbove: 70,
  };

  async checkFraud(request: FraudCheckRequest): Promise<FraudCheckResult> {
    const startTime = Date.now();
    
    // Simulate processing delay
    await this.delay(Math.random() * 500 + 100);
    
    const riskFactors = this.analyzeRiskFactors(request);
    const rules = this.evaluateRules(request, riskFactors);
    
    // Calculate base score from risk factors
    let baseScore = riskFactors.reduce((sum, factor) => sum + factor.score, 0);
    baseScore = Math.max(0, Math.min(100, baseScore));
    
    // Apply rule modifications
    const ruleModifications = rules
      .filter(rule => rule.triggered)
      .reduce((sum, rule) => sum + rule.weight, 0);
    
    const finalScore = Math.max(0, Math.min(100, baseScore + ruleModifications));
    const decision = this.calculateDecision(finalScore);
    const confidence = this.calculateConfidence(finalScore, riskFactors);
    
    const processingTime = Date.now() - startTime;
    const providerTransactionId = `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      score: Math.round(finalScore),
      decision,
      confidence: Math.round(confidence),
      riskFactors,
      rules,
      providerId: 'mock-fraud-provider',
      providerTransactionId,
      processingTime,
      recommendation: this.generateRecommendation(decision, finalScore, riskFactors),
      metadata: {
        baseScore: Math.round(baseScore),
        ruleModifications,
        version: this.version,
      },
    };
  }

  async updateResult(
    providerTransactionId: string,
    actualOutcome: 'approved' | 'declined' | 'chargeback' | 'legitimate'
  ): Promise<void> {
    // In a real implementation, this would update ML models or rule weights
    console.log(`Mock Fraud Provider: Updated result for ${providerTransactionId} -> ${actualOutcome}`);
  }

  async getStatus(): Promise<{ healthy: boolean; latency?: number; errorRate?: number; metadata?: Record<string, any> }> {
    return {
      healthy: true,
      latency: Math.random() * 100 + 50, // 50-150ms
      errorRate: Math.random() * 0.01, // 0-1%
      metadata: {
        version: this.version,
        lastHealthCheck: new Date().toISOString(),
      },
    };
  }

  private analyzeRiskFactors(request: FraudCheckRequest): FraudRiskFactor[] {
    const factors: FraudRiskFactor[] = [];

    // High transaction amount
    if (request.amount > 500000) { // > $5000
      factors.push({
        factor: 'high_transaction_amount',
        severity: 'high',
        score: 25,
        description: `Transaction amount $${(request.amount / 100).toFixed(2)} is unusually high`,
        details: { amount: request.amount, threshold: 500000 },
      });
    } else if (request.amount > 100000) { // > $1000
      factors.push({
        factor: 'elevated_transaction_amount',
        severity: 'medium',
        score: 10,
        description: `Transaction amount $${(request.amount / 100).toFixed(2)} is above average`,
        details: { amount: request.amount, threshold: 100000 },
      });
    }

    // International transactions
    const isForeign = request.billingAddress?.country !== 'US' || 
                     request.paymentMethod.country !== 'US';
    if (isForeign) {
      factors.push({
        factor: 'international_transaction',
        severity: 'medium',
        score: 15,
        description: 'Transaction originates from outside the US',
        details: { 
          billingCountry: request.billingAddress?.country,
          cardCountry: request.paymentMethod.country 
        },
      });
    }

    // New customer
    if (!request.customerHistory || request.customerHistory.totalTransactions === 0) {
      factors.push({
        factor: 'new_customer',
        severity: 'medium',
        score: 12,
        description: 'First-time customer with no transaction history',
      });
    }

    // Customer with chargebacks
    if (request.customerHistory?.chargebacks && request.customerHistory.chargebacks > 0) {
      const score = Math.min(30, request.customerHistory.chargebacks * 10);
      factors.push({
        factor: 'chargeback_history',
        severity: request.customerHistory.chargebacks > 2 ? 'critical' : 'high',
        score,
        description: `Customer has ${request.customerHistory.chargebacks} previous chargebacks`,
        details: { chargebacks: request.customerHistory.chargebacks },
      });
    }

    // Suspicious email patterns
    if (request.customerEmail) {
      const email = request.customerEmail.toLowerCase();
      if (email.includes('test') || email.includes('fake') || email.includes('spam')) {
        factors.push({
          factor: 'suspicious_email',
          severity: 'high',
          score: 20,
          description: 'Email address contains suspicious patterns',
          details: { email: request.customerEmail },
        });
      }
      
      // Temporary email domains
      const tempDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
      const domain = email.split('@')[1];
      if (tempDomains.includes(domain)) {
        factors.push({
          factor: 'temporary_email',
          severity: 'high',
          score: 25,
          description: 'Email uses temporary/disposable email service',
          details: { domain },
        });
      }
    }

    // Velocity checks (simplified)
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6) {
      factors.push({
        factor: 'unusual_hour',
        severity: 'low',
        score: 5,
        description: 'Transaction occurring during unusual hours (2-6 AM)',
        details: { hour },
      });
    }

    // Missing customer info
    if (!request.customerEmail || !request.customerName) {
      factors.push({
        factor: 'incomplete_customer_info',
        severity: 'medium',
        score: 8,
        description: 'Customer information is incomplete',
        details: {
          hasEmail: !!request.customerEmail,
          hasName: !!request.customerName,
          hasPhone: !!request.customerPhone,
        },
      });
    }

    return factors;
  }

  private evaluateRules(request: FraudCheckRequest, riskFactors: FraudRiskFactor[]): FraudRule[] {
    const rules: FraudRule[] = [];

    // Rule 1: Block known bad email domains
    const blockedDomains = ['example.com', 'test.com', 'fraud.com'];
    const emailDomain = request.customerEmail?.split('@')[1]?.toLowerCase();
    const rule1Triggered = emailDomain ? blockedDomains.includes(emailDomain) : false;
    rules.push({
      ruleId: 'blocked_email_domain',
      ruleName: 'Blocked Email Domain',
      triggered: rule1Triggered,
      action: rule1Triggered ? 'decline' : 'approve',
      weight: rule1Triggered ? 50 : 0,
      description: 'Automatically decline transactions from blocked email domains',
      metadata: { domain: emailDomain, blockedDomains },
    });

    // Rule 2: High amount without history
    const hasHistory = request.customerHistory && request.customerHistory.totalTransactions > 0;
    const highAmount = request.amount > 200000; // > $2000
    const rule2Triggered = highAmount && !hasHistory;
    rules.push({
      ruleId: 'high_amount_new_customer',
      ruleName: 'High Amount New Customer',
      triggered: rule2Triggered,
      action: rule2Triggered ? 'review' : 'approve',
      weight: rule2Triggered ? 20 : 0,
      description: 'Flag high-value transactions from new customers for review',
      metadata: { amount: request.amount, hasHistory },
    });

    // Rule 3: Multiple high-risk factors
    const highRiskFactors = riskFactors.filter(f => f.severity === 'high' || f.severity === 'critical');
    const rule3Triggered = highRiskFactors.length >= 2;
    rules.push({
      ruleId: 'multiple_high_risk_factors',
      ruleName: 'Multiple High Risk Factors',
      triggered: rule3Triggered,
      action: rule3Triggered ? 'review' : 'approve',
      weight: rule3Triggered ? 15 : 0,
      description: 'Flag transactions with multiple high-risk factors',
      metadata: { 
        highRiskFactorCount: highRiskFactors.length,
        factors: highRiskFactors.map(f => f.factor) 
      },
    });

    // Rule 4: Suspicious IP patterns (simplified)
    const rule4Triggered = this.isSuspiciousIP(request.ipAddress);
    rules.push({
      ruleId: 'suspicious_ip',
      ruleName: 'Suspicious IP Address',
      triggered: rule4Triggered,
      action: rule4Triggered ? 'review' : 'approve',
      weight: rule4Triggered ? 10 : 0,
      description: 'Flag transactions from suspicious IP addresses',
      metadata: { ipAddress: request.ipAddress },
    });

    return rules;
  }

  private isSuspiciousIP(ipAddress: string): boolean {
    // Simplified suspicious IP detection
    // In real implementation, this would check against threat intelligence feeds
    const suspiciousPatterns = [
      '192.168.', // Local network (shouldn't happen in production)
      '10.0.', // Private network
      '127.', // Localhost
    ];
    
    return suspiciousPatterns.some(pattern => ipAddress.startsWith(pattern));
  }

  private calculateDecision(score: number): FraudDecision {
    if (score < this.thresholds.approveBelow) {
      return 'approve';
    } else if (score <= this.thresholds.declineAbove) {
      return 'review';
    } else {
      return 'decline';
    }
  }

  private calculateConfidence(score: number, riskFactors: FraudRiskFactor[]): number {
    // Higher confidence when:
    // - Score is clearly in one threshold range
    // - Multiple risk factors agree
    // - High-severity factors are present
    
    let confidence = 70; // Base confidence
    
    const { approveBelow, declineAbove } = this.thresholds;
    
    // Distance from thresholds increases confidence
    if (score <= approveBelow) {
      confidence += Math.min(20, (approveBelow - score) * 2);
    } else if (score >= declineAbove) {
      confidence += Math.min(20, (score - declineAbove) * 2);
    } else {
      // In review range - lower confidence
      confidence -= 15;
    }
    
    // Multiple high-severity factors increase confidence
    const highSeverityCount = riskFactors.filter(f => 
      f.severity === 'high' || f.severity === 'critical'
    ).length;
    confidence += Math.min(10, highSeverityCount * 3);
    
    // Very few risk factors decrease confidence
    if (riskFactors.length < 2) {
      confidence -= 10;
    }
    
    return Math.max(0, Math.min(100, confidence));
  }

  private generateRecommendation(
    decision: FraudDecision, 
    score: number, 
    riskFactors: FraudRiskFactor[]
  ): string {
    switch (decision) {
      case 'approve':
        return 'Transaction appears legitimate. Process normally with standard monitoring.';
      
      case 'review':
        const topFactors = riskFactors
          .sort((a, b) => b.score - a.score)
          .slice(0, 2)
          .map(f => f.factor)
          .join(', ');
        return `Manual review recommended. Key concerns: ${topFactors}. Consider additional verification.`;
      
      case 'decline':
        const criticalFactors = riskFactors
          .filter(f => f.severity === 'critical' || f.severity === 'high')
          .map(f => f.factor)
          .join(', ');
        return `High fraud risk detected. Decline transaction. Primary risks: ${criticalFactors}.`;
      
      default:
        return 'Unable to generate recommendation.';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Testing utilities
  public setThresholds(thresholds: Partial<FraudThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  public getThresholds(): FraudThresholds {
    return { ...this.thresholds };
  }
}