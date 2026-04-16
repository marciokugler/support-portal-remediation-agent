import cors from "@fastify/cors";
import Fastify from "fastify";
import { BUSINESS_TRANSACTIONS } from "@ibobs/shared-types";
import {
  annotateServerEntrySpan,
  createServiceLogger,
  initSplunkNodeTelemetry,
  recordFrustrationSignals,
  recordSessionReplayCandidate
} from "@ibobs/telemetry";

export const scenarios = {
  dependencyLatency: {
    id: "dependency-latency",
    name: "Customer Support Response latency increase",
    affectedTransaction: "customer_support_response"
  },
  dependencyErrors: {
    id: "dependency-errors",
    name: "Customer Support Response error spike",
    affectedTransaction: "customer_support_response"
  }
};

let activeScenario = "healthy";
const knowledgeServiceBaseUrl = process.env.KNOWLEDGE_SERVICE_BASE_URL ?? "http://127.0.0.1:4003";

export function buildServer() {
  const app = Fastify({ loggerInstance: createServiceLogger("scenario-controller") });
  void app.register(cors, {
    origin: true,
    allowedHeaders: ["content-type", "traceparent", "tracestate", "baggage"],
    exposedHeaders: ["Server-Timing"]
  });
  app.addHook("preHandler", async (request) => {
    annotateServerEntrySpan({
      method: request.method,
      route: request.routeOptions.url
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

  app.get("/scenario/state", async () => ({
    activeScenario,
    availableScenarios: Object.values(scenarios)
  }));

  app.post("/scenario/activate/:scenarioId", async (request) => {
    activeScenario = (request.params as { scenarioId: string }).scenarioId;
    request.log.info({ activeScenario }, "scenario activated");
    await fetch(`${knowledgeServiceBaseUrl}/knowledge/scenario`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ mode: activeScenario })
    });
    if (activeScenario !== "healthy") {
      recordFrustrationSignals(3, {
        "deployment.environment": "demo",
        journey: BUSINESS_TRANSACTIONS.customerSupportResponse
      });
      recordSessionReplayCandidate({
        "deployment.environment": "demo",
        "app.business_transaction": BUSINESS_TRANSACTIONS.customerSupportResponse
      });
    }
    return { activeScenario };
  });

  app.post("/scenario/reset", async (request) => {
    activeScenario = "healthy";
    request.log.info({ activeScenario }, "scenario reset");
    await fetch(`${knowledgeServiceBaseUrl}/knowledge/scenario`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ mode: activeScenario })
    });
    return { activeScenario };
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  initSplunkNodeTelemetry("scenario-controller");
  const port = Number(process.env.SCENARIO_CONTROLLER_PORT ?? 4004);
  const server = buildServer();
  server.log.info({ scenarios }, "scenario-controller scaffold ready");
  server.listen({ port, host: "0.0.0.0" }).catch((error) => {
    server.log.error(error);
    process.exit(1);
  });
}
