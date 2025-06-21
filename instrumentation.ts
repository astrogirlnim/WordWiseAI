export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      await import('./instrumentation.node');
      console.log('📊 Node.js instrumentation loaded successfully');
    } catch (error) {
      console.warn('⚠️ Node.js instrumentation failed to load:', error instanceof Error ? error.message : String(error));
      console.log('📊 Continuing without OpenTelemetry instrumentation');
    }
  }
} 