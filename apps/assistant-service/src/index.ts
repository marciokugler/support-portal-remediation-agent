import cors from "@fastify/cors";
import Fastify from "fastify";
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

export const assistantService = {
  name: "support-assistant",
  businessTransaction: BUSINESS_TRANSACTIONS.customerSupportResponse,
  telemetry: buildTelemetryAttributes(BUSINESS_TRANSACTIONS.customerSupportResponse),
  operations: ["support.request.validate", "assistant.compose_response", "knowledge.fetch_context"]
};

const knowledgeServiceBaseUrl = process.env.KNOWLEDGE_SERVICE_BASE_URL ?? "http://127.0.0.1:4003";

export function buildServer() {
  const app = Fastify({ loggerInstance: createServiceLogger(assistantService.name) });
  void buildNodeTelemetryConfig({ serviceName: assistantService.name });
  void app.register(cors, { origin: true });
  app.addHook("preHandler", async (request) => {
    const routePath = request.routeOptions.url;
    annotateServerEntrySpan({
      method: request.method,
      route: routePath,
      transaction: routePath === "/assistant/respond" ? assistantService.businessTransaction : undefined,
      attributes: routePath === "/assistant/respond" ? assistantService.telemetry : undefined
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

  app.get("/assistant/health", async () => ({ status: "ok", service: assistantService.name }));
  app.post("/assistant/respond", async (request, reply) => {
    const prompt = (request.body as { prompt?: string }).prompt ?? "";
    request.log.info({ prompt }, "assistant request received");
    const startedAt = performance.now();
    annotateCurrentSpan({
      ...assistantService.telemetry,
      "support.prompt_length": prompt.length
    });
    const knowledgeResponse = await runInSpan(
      "assistant.knowledge_fetch_context",
      assistantService.telemetry,
      () =>
        fetch(`${knowledgeServiceBaseUrl}/knowledge/query`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            transaction: BUSINESS_TRANSACTIONS.customerSupportResponse,
            prompt
          })
        })
    );

    const knowledgePayload = await knowledgeResponse.json();
    recordLatency(performance.now() - startedAt, {
      ...assistantService.telemetry,
      service: assistantService.name
    });
    recordRequest({
      ...assistantService.telemetry,
      service: assistantService.name
    });
    if (!knowledgeResponse.ok) {
      recordError({
        ...assistantService.telemetry,
        service: assistantService.name
      });
      reply.code(knowledgeResponse.status);
      request.log.warn({ prompt, dependency: knowledgePayload }, "assistant dependency returned an error");
      return {
        transaction: BUSINESS_TRANSACTIONS.customerSupportResponse,
        telemetry: assistantService.telemetry,
        operations: assistantService.operations,
        dependency: knowledgePayload
      };
    }

    request.log.info({ prompt, dependency: knowledgePayload }, "assistant response generated");
    return {
      transaction: BUSINESS_TRANSACTIONS.customerSupportResponse,
      telemetry: assistantService.telemetry,
      operations: assistantService.operations,
      response: "Generated support response placeholder.",
      dependency: knowledgePayload
    };
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  initSplunkNodeTelemetry(assistantService.name);
  const port = Number(process.env.ASSISTANT_SERVICE_PORT ?? 4001);
  const server = buildServer();
  server.log.info({ assistantService }, "assistant-service scaffold ready");
  server.listen({ port, host: "0.0.0.0" }).catch((error) => {
    server.log.error(error);
    process.exit(1);
  });
}
