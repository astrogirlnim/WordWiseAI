// OpenTelemetry instrumentation temporarily disabled due to package version conflicts
// This will be re-enabled once OpenTelemetry dependencies are resolved

// import { NodeSDK } from '@opentelemetry/sdk-node';
// import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
// import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';

// const sdk = new NodeSDK({
//   spanProcessor: new BatchSpanProcessor(new TraceExporter()),
// });

// sdk.start();

console.log('📊 OpenTelemetry instrumentation disabled - Firebase deployment mode');

// Export to make this a valid module
export {}; 