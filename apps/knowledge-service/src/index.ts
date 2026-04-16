import cors from "@fastify/cors";
import Fastify from "fastify";
import { defaultPorts, localServicePort } from "@ibobs/runtime-config";
import { BUSINESS_TRANSACTIONS } from "@ibobs/shared-types";
import {
  annotateServerEntrySpan,
  annotateCurrentSpan,
  buildNodeTelemetryConfig,
  buildTelemetryAttributes,
  createServiceLogger,
  initSplunkNodeTelemetry,
  recordError,
  recordLatency,
  recordRequest,
  runInSpan
} from "@ibobs/telemetry";

export const knowledgeService = {
  name: "support-knowledge",
  supportsTransactions: [
    BUSINESS_TRANSACTIONS.customerSupportResponse,
    BUSINESS_TRANSACTIONS.knowledgeArticleSearch
  ],
  telemetry: buildTelemetryAttributes(BUSINESS_TRANSACTIONS.knowledgeArticleSearch),
  failureModes: ["latency", "errors", "malformed-response"]
};

type ScenarioMode = "healthy" | "dependency-latency" | "dependency-errors";

let activeScenario: ScenarioMode = "healthy";
const featureFlagName = "support_knowledge_v2";
const stableKnowledgeVersion = process.env.KNOWLEDGE_STABLE_VERSION ?? "2.0.4";
const canaryKnowledgeVersion = process.env.KNOWLEDGE_CANARY_VERSION ?? "2.1.0-canary";

function knowledgeChangeAttributes(transaction: string) {
  const featureEnabled = activeScenario !== "healthy";
  const releaseVersion = featureEnabled ? canaryKnowledgeVersion : stableKnowledgeVersion;

  return {
    "feature_flag.key": featureFlagName,
    "feature_flag.provider_name": "demo-control-plane",
    "feature_flag.variant": featureEnabled ? "enabled" : "disabled",
    "demo.recent_change": featureEnabled ? `${featureFlagName} enabled` : `${featureFlagName} disabled`,
    "demo.release_version": releaseVersion,
    "app.release_version": releaseVersion,
    "app.business_transaction": transaction
  };
}

async function maybeDelay(transaction: string) {
  if (activeScenario === "dependency-latency" && transaction === BUSINESS_TRANSACTIONS.customerSupportResponse) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

export function buildServer() {
  const app = Fastify({ loggerInstance: createServiceLogger(knowledgeService.name) });
  void buildNodeTelemetryConfig({ serviceName: knowledgeService.name });
  void app.register(cors, { origin: true });
  app.addHook("preHandler", async (request) => {
    const routePath = request.routeOptions.url;
    annotateServerEntrySpan({
      method: request.method,
      route: routePath
    });
    request.log.info(
      {
        http: { method: request.method, url: request.url },
        params: request.params,
        query: request.query,
        body: request.body
      },
      "request received"
    );
  });
  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      {
        http: { method: request.method, url: request.url, status_code: reply.statusCode }
      },
      "request completed"
    );
  });

  app.get("/knowledge/health", async () => ({ status: "ok", service: knowledgeService.name }));
  app.get("/knowledge/scenario", async () => ({
    activeScenario,
    featureFlag: {
      name: featureFlagName,
      state: activeScenario === "healthy" ? "disabled" : "enabled",
      releaseVersion: activeScenario === "healthy" ? stableKnowledgeVersion : canaryKnowledgeVersion
    }
  }));
  app.post("/knowledge/scenario", async (request) => {
    activeScenario = ((request.body as { mode?: ScenarioMode }).mode ?? "healthy") as ScenarioMode;
    request.log.info({ activeScenario }, "knowledge scenario updated");
    return {
      activeScenario,
      featureFlag: {
        name: featureFlagName,
        state: activeScenario === "healthy" ? "disabled" : "enabled",
        releaseVersion: activeScenario === "healthy" ? stableKnowledgeVersion : canaryKnowledgeVersion
      }
    };
  });
  app.post("/knowledge/query", async (request, reply) => {
    const transaction = (request.body as { transaction?: string }).transaction ?? BUSINESS_TRANSACTIONS.knowledgeArticleSearch;
    request.log.info({ knowledgeRequest: request.body, transaction, activeScenario }, "knowledge query received");
    const startedAt = performance.now();
    const telemetry = {
      ...buildTelemetryAttributes(transaction),
      ...knowledgeChangeAttributes(transaction)
    };
    annotateCurrentSpan(telemetry);
    await runInSpan("knowledge.apply_scenario", telemetry, () => maybeDelay(transaction));

    if (activeScenario === "dependency-errors" && transaction === BUSINESS_TRANSACTIONS.customerSupportResponse) {
      recordLatency(performance.now() - startedAt, {
        ...telemetry,
        service: knowledgeService.name
      });
      recordRequest({
        ...telemetry,
        service: knowledgeService.name
      });
      recordError({
        ...telemetry,
        service: knowledgeService.name
      });
      reply.code(503);
      request.log.warn({ transaction, activeScenario }, "knowledge dependency failure simulated");
      return {
        transaction,
        telemetry,
        scenario: activeScenario,
        error: "Knowledge dependency is failing for the customer support response workflow."
      };
    }

    recordLatency(performance.now() - startedAt, {
      ...telemetry,
      service: knowledgeService.name
    });
    recordRequest({
      ...telemetry,
      service: knowledgeService.name
    });
    request.log.info({ transaction, activeScenario }, "knowledge query served");

    return {
      transaction,
      telemetry,
      scenario: activeScenario,
      answer:
        transaction === BUSINESS_TRANSACTIONS.customerSupportResponse
          ? "Generated support answer using the knowledge service."
          : "Knowledge lookup placeholder."
    };
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  initSplunkNodeTelemetry(knowledgeService.name);
  const port = localServicePort(process.env, "KNOWLEDGE_SERVICE_PORT", defaultPorts.knowledgeService);
  const server = buildServer();
  server.log.info({ knowledgeService }, "knowledge-service scaffold ready");
  server.listen({ port, host: "0.0.0.0" }).catch((error) => {
    server.log.error(error);
    process.exit(1);
  });
}
