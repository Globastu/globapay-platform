import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';

// Environment configuration
const JAEGER_ENDPOINT = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';
const PROMETHEUS_PORT = parseInt(process.env.PROMETHEUS_PORT || '9464');
const SERVICE_NAME = process.env.SERVICE_NAME || 'globapay-api';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Configure resource
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
  [SemanticResourceAttributes.SERVICE_VERSION]: SERVICE_VERSION,
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: ENVIRONMENT,
});

// Configure trace exporters
const getTraceExporter = () => {
  if (ENVIRONMENT === 'production' && process.env.JAEGER_ENDPOINT) {
    return new JaegerExporter({
      endpoint: JAEGER_ENDPOINT,
    });
  }
  // For development, use console exporter
  return new ConsoleSpanExporter();
};

// Configure metrics exporters
const prometheusExporter = new PrometheusExporter({
  port: PROMETHEUS_PORT,
}, () => {
  console.log(`Prometheus metrics available at http://localhost:${PROMETHEUS_PORT}/metrics`);
});

// Initialize OpenTelemetry SDK
export const sdk = new NodeSDK({
  resource,
  traceExporter: getTraceExporter(),
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable some instrumentations that might be noisy
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },
    }),
  ],
});

// Custom tracer for manual instrumentation
export const tracer = trace.getTracer(SERVICE_NAME, SERVICE_VERSION);

/**
 * Create a span for a specific operation
 */
export function createSpan(
  name: string,
  options: {
    kind?: SpanKind;
    attributes?: Record<string, string | number | boolean>;
    parentSpan?: any;
  } = {}
) {
  return tracer.startSpan(name, {
    kind: options.kind || SpanKind.INTERNAL,
    attributes: options.attributes,
  }, options.parentSpan);
}

/**
 * Trace an async function
 */
export async function traceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  options: {
    attributes?: Record<string, string | number | boolean>;
    kind?: SpanKind;
  } = {}
): Promise<T> {
  const span = createSpan(name, options);
  
  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Trace a synchronous function
 */
export function traceSync<T>(
  name: string,
  fn: () => T,
  options: {
    attributes?: Record<string, string | number | boolean>;
    kind?: SpanKind;
  } = {}
): T {
  const span = createSpan(name, options);
  
  try {
    const result = fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Add attributes to the current active span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>) {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    Object.entries(attributes).forEach(([key, value]) => {
      activeSpan.setAttribute(key, value);
    });
  }
}

/**
 * Add a span event
 */
export function addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>) {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.addEvent(name, attributes);
  }
}

/**
 * Initialize tracing
 */
export function initializeTracing() {
  try {
    sdk.start();
    console.log('OpenTelemetry tracing initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry:', error);
  }
}

/**
 * Shutdown tracing
 */
export async function shutdownTracing() {
  try {
    await sdk.shutdown();
    console.log('OpenTelemetry tracing shutdown successfully');
  } catch (error) {
    console.error('Failed to shutdown OpenTelemetry:', error);
  }
}