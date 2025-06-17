import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';

const sdk = new NodeSDK({
  spanProcessor: new BatchSpanProcessor(new TraceExporter()),
});

sdk.start(); 