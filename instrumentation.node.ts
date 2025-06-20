import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';

console.log('[OpenTelemetry] Initializing Node.js instrumentation...')

const sdk = new NodeSDK({
  spanProcessor: new BatchSpanProcessor(new TraceExporter()),
});

console.log('[OpenTelemetry] Starting SDK...')
sdk.start();
console.log('[OpenTelemetry] SDK started successfully') 