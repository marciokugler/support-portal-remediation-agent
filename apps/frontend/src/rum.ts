import SplunkRum from "@splunk/otel-web";
import SplunkRumRecorder from "@splunk/otel-web-session-recorder";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { buildRumConfig } from "@ibobs/telemetry/browser";

declare global {
  interface Window {
    __ibobsRumStarted?: boolean;
  }
}

export function initRum() {
  if (typeof window === "undefined" || window.__ibobsRumStarted) {
    return;
  }

  const config = buildRumConfig("ibobs-support-portal");
  if (!config.rumTokenConfigured) {
    console.info("[telemetry:frontend] RUM disabled:", config.deactivatedReason);
    return;
  }

  SplunkRum.init({
    realm: config.realm,
    rumAccessToken: import.meta.env.VITE_SPLUNK_RUM_TOKEN,
    applicationName: config.applicationName,
    deploymentEnvironment: config.deploymentEnvironment,
    tracer: {
      propagateTraceHeaderCorsUrls: [
        /^http:\/\/localhost:4000\//,
        /^http:\/\/127\.0\.0\.1:4000\//,
        /^http:\/\/localhost:4004\//,
        /^http:\/\/127\.0\.0\.1:4004\//,
        /^http:\/\/localhost:4010\//,
        /^http:\/\/127\.0\.0\.1:4010\//
      ]
    },
    instrumentations: {
      fetch: {
        propagateTraceHeaderCorsUrls: [
          /^http:\/\/localhost:4000\//,
          /^http:\/\/127\.0\.0\.1:4000\//,
          /^http:\/\/localhost:4004\//,
          /^http:\/\/127\.0\.0\.1:4004\//,
          /^http:\/\/localhost:4010\//,
          /^http:\/\/127\.0\.0\.1:4010\//
        ],
        applyCustomAttributesOnSpan(span) {
          span.setAttributes({
            "app.frontend_surface": "support_portal",
            "app.rum_to_apm_candidate": true
          });
        }
      },
      xhr: {
        propagateTraceHeaderCorsUrls: [
          /^http:\/\/localhost:4000\//,
          /^http:\/\/127\.0\.0\.1:4000\//,
          /^http:\/\/localhost:4004\//,
          /^http:\/\/127\.0\.0\.1:4004\//,
          /^http:\/\/localhost:4010\//,
          /^http:\/\/127\.0\.0\.1:4010\//
        ]
      }
    },
    spaMetrics: {
      quietTime: 800
    }
  });

  SplunkRum.setGlobalAttributes({
    "app.name": "ibobs-support-portal",
    "app.demo": "ibobs-2002",
    "app.session_type": "customer-facing",
    "deployment.environment": config.deploymentEnvironment
  });

  if (config.sessionReplayEnabled) {
    SplunkRumRecorder.init({
      realm: config.realm,
      rumAccessToken: import.meta.env.VITE_SPLUNK_RUM_TOKEN
    });
  }

  window.__ibobsRumStarted = true;
}

export async function trackBusinessTransaction<T>(
  transactionId: string,
  actionName: string,
  attributes: Record<string, string | number | boolean>,
  fn: () => Promise<T>
) {
  const tracer = trace.getTracer("ibobs-frontend");

  return tracer.startActiveSpan(`ui.${actionName}`, { attributes }, async (span) => {
    try {
      const result = await fn();
      span.setAttributes({
        "app.business_transaction": transactionId,
        "app.transaction_result": "success"
      });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.setAttributes({
        "app.business_transaction": transactionId,
        "app.transaction_result": "failure"
      });
      await SplunkRum.reportError(error instanceof Error ? error : String(error));
      throw error;
    } finally {
      span.end();
    }
  });
}

export function setJourneyContext(attributes: Record<string, string | number | boolean>) {
  SplunkRum.setGlobalAttributes(attributes);
}
