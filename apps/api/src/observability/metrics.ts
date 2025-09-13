import { metrics, ValueType } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Initialize metrics
const SERVICE_NAME = process.env.SERVICE_NAME || 'globapay-api';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
  [SemanticResourceAttributes.SERVICE_VERSION]: SERVICE_VERSION,
});

const meterProvider = new MeterProvider({ resource });
metrics.setGlobalMeterProvider(meterProvider);

const meter = metrics.getMeter(SERVICE_NAME, SERVICE_VERSION);

// Auth rate metrics
export const authAttemptCounter = meter.createCounter('auth_attempts_total', {
  description: 'Total number of authentication attempts',
  valueType: ValueType.INT,
});

export const authSuccessCounter = meter.createCounter('auth_success_total', {
  description: 'Total number of successful authentications',
  valueType: ValueType.INT,
});

export const authFailureCounter = meter.createCounter('auth_failures_total', {
  description: 'Total number of failed authentications',
  valueType: ValueType.INT,
});

export const authRateGauge = meter.createGauge('auth_rate', {
  description: 'Authentication success rate (percentage)',
  valueType: ValueType.DOUBLE,
});

// Payment capture rate metrics
export const captureAttemptCounter = meter.createCounter('capture_attempts_total', {
  description: 'Total number of payment capture attempts',
  valueType: ValueType.INT,
});

export const captureSuccessCounter = meter.createCounter('capture_success_total', {
  description: 'Total number of successful payment captures',
  valueType: ValueType.INT,
});

export const captureFailureCounter = meter.createCounter('capture_failures_total', {
  description: 'Total number of failed payment captures',
  valueType: ValueType.INT,
});

export const captureRateGauge = meter.createGauge('capture_rate', {
  description: 'Payment capture success rate (percentage)',
  valueType: ValueType.DOUBLE,
});

// Webhook lag metrics
export const webhookLagHistogram = meter.createHistogram('webhook_lag_seconds', {
  description: 'Webhook processing lag in seconds',
  valueType: ValueType.DOUBLE,
  boundaries: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 300], // Define latency buckets
});

export const webhookProcessedCounter = meter.createCounter('webhooks_processed_total', {
  description: 'Total number of webhooks processed',
  valueType: ValueType.INT,
});

export const webhookFailedCounter = meter.createCounter('webhooks_failed_total', {
  description: 'Total number of failed webhook deliveries',
  valueType: ValueType.INT,
});

// Transaction metrics
export const transactionCounter = meter.createCounter('transactions_total', {
  description: 'Total number of transactions processed',
  valueType: ValueType.INT,
});

export const transactionAmountHistogram = meter.createHistogram('transaction_amount_cents', {
  description: 'Transaction amounts in cents',
  valueType: ValueType.DOUBLE,
  boundaries: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000], // Amount buckets
});

// Fraud detection metrics
export const fraudCheckCounter = meter.createCounter('fraud_checks_total', {
  description: 'Total number of fraud checks performed',
  valueType: ValueType.INT,
});

export const fraudDecisionCounter = meter.createCounter('fraud_decisions_total', {
  description: 'Fraud decisions by type',
  valueType: ValueType.INT,
});

export const fraudScoreHistogram = meter.createHistogram('fraud_score', {
  description: 'Fraud scores distribution',
  valueType: ValueType.DOUBLE,
  boundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], // Score buckets
});

// API performance metrics
export const requestDurationHistogram = meter.createHistogram('http_request_duration_seconds', {
  description: 'HTTP request duration in seconds',
  valueType: ValueType.DOUBLE,
  boundaries: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10], // Duration buckets
});

export const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total HTTP requests',
  valueType: ValueType.INT,
});

// Rate tracking for auth and capture rates
class RateTracker {
  private attempts = 0;
  private successes = 0;
  private lastUpdateTime = Date.now();
  private readonly windowSize = 300000; // 5 minutes in milliseconds

  recordAttempt() {
    this.attempts++;
    this.updateRate();
  }

  recordSuccess() {
    this.successes++;
    this.updateRate();
  }

  private updateRate() {
    const now = Date.now();
    if (now - this.lastUpdateTime > this.windowSize) {
      // Reset counters after window
      this.attempts = 0;
      this.successes = 0;
      this.lastUpdateTime = now;
    }
  }

  getRate(): number {
    return this.attempts > 0 ? (this.successes / this.attempts) * 100 : 0;
  }
}

const authRateTracker = new RateTracker();
const captureRateTracker = new RateTracker();

// Update rates periodically
setInterval(() => {
  authRateGauge.record(authRateTracker.getRate(), {
    service: SERVICE_NAME,
  });

  captureRateGauge.record(captureRateTracker.getRate(), {
    service: SERVICE_NAME,
  });
}, 60000); // Update every minute

// Metrics recording functions
export const recordAuthAttempt = (result: 'success' | 'failure', method: string, tenantId?: string) => {
  const labels = {
    method,
    tenant_id: tenantId || 'unknown',
    service: SERVICE_NAME,
  };

  authAttemptCounter.add(1, labels);
  authRateTracker.recordAttempt();

  if (result === 'success') {
    authSuccessCounter.add(1, labels);
    authRateTracker.recordSuccess();
  } else {
    authFailureCounter.add(1, { ...labels, result });
  }
};

export const recordCaptureAttempt = (
  result: 'success' | 'failure',
  amount: number,
  currency: string,
  merchantId?: string
) => {
  const labels = {
    result,
    currency,
    merchant_id: merchantId || 'unknown',
    service: SERVICE_NAME,
  };

  captureAttemptCounter.add(1, labels);
  captureRateTracker.recordAttempt();

  if (result === 'success') {
    captureSuccessCounter.add(1, labels);
    captureRateTracker.recordSuccess();
    transactionAmountHistogram.record(amount, labels);
  } else {
    captureFailureCounter.add(1, labels);
  }

  transactionCounter.add(1, labels);
};

export const recordWebhookLag = (lagSeconds: number, webhookType: string, status: string) => {
  const labels = {
    webhook_type: webhookType,
    status,
    service: SERVICE_NAME,
  };

  webhookLagHistogram.record(lagSeconds, labels);
  webhookProcessedCounter.add(1, labels);

  if (status === 'failed') {
    webhookFailedCounter.add(1, labels);
  }
};

export const recordFraudCheck = (score: number, decision: string, merchantId?: string) => {
  const labels = {
    decision,
    merchant_id: merchantId || 'unknown',
    service: SERVICE_NAME,
  };

  fraudCheckCounter.add(1, labels);
  fraudDecisionCounter.add(1, labels);
  fraudScoreHistogram.record(score, labels);
};

export const recordHttpRequest = (
  method: string,
  path: string,
  statusCode: number,
  durationSeconds: number,
  tenantId?: string
) => {
  const labels = {
    method,
    path,
    status_code: statusCode.toString(),
    tenant_id: tenantId || 'unknown',
    service: SERVICE_NAME,
  };

  requestCounter.add(1, labels);
  requestDurationHistogram.record(durationSeconds, labels);
};

// Export meter for custom metrics
export { meter };