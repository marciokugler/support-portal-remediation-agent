import cors from "@fastify/cors";
import Fastify from "fastify";
import { mkdir, readdir, rm, stat, statfs, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defaultPorts, localServicePort } from "@ibobs/runtime-config";
import { BUSINESS_TRANSACTIONS } from "@ibobs/shared-types";
import {
  annotateServerEntrySpan,
  annotateCurrentSpan,
  buildNodeTelemetryConfig,
  buildTelemetryAttributes,
  createServiceLogger,
  initSplunkNodeTelemetry,
  runInSpan
} from "@ibobs/telemetry";

export const knowledgeService = {
  name: "support-knowledge",
  supportsTransactions: [
    BUSINESS_TRANSACTIONS.customerSupportResponse,
    BUSINESS_TRANSACTIONS.knowledgeArticleSearch
  ],
  telemetry: buildTelemetryAttributes(BUSINESS_TRANSACTIONS.knowledgeArticleSearch),
  failureModes: ["cache-disk-pressure"]
};

type ScenarioMode = "healthy" | "cache-disk-pressure";

let activeScenario: ScenarioMode = "healthy";
const cacheDirectory = process.env.SUPPORT_KNOWLEDGE_CACHE_DIR ?? "/tmp/ciscolive26-support-knowledge-cache";
const cacheFillTargetPercent = Number(process.env.SUPPORT_KNOWLEDGE_CACHE_FILL_PERCENT ?? "92");
const cacheBlockBytes = Number(process.env.SUPPORT_KNOWLEDGE_CACHE_BLOCK_BYTES ?? 1024 * 1024);
const cacheQuotaBytes = Number(process.env.SUPPORT_KNOWLEDGE_CACHE_QUOTA_BYTES ?? 128 * 1024 * 1024);

async function cachePressureBytes() {
  await mkdir(cacheDirectory, { recursive: true });
  const entries = await readdir(cacheDirectory, { withFileTypes: true });
  const fileSizes = await Promise.all(
    entries
      .filter((entry) => entry.name.startsWith("cache-pressure-") && entry.isFile())
      .map(async (entry) => stat(join(cacheDirectory, entry.name)).then((file) => file.size))
  );
  return fileSizes.reduce((total, size) => total + size, 0);
}

async function cacheStatus() {
  await mkdir(cacheDirectory, { recursive: true });
  const stats = await statfs(cacheDirectory);
  const filesystemTotalBytes = Number(stats.blocks) * Number(stats.bsize);
  const filesystemFreeBytes = Number(stats.bavail) * Number(stats.bsize);
  const filesystemUsedBytes = Math.max(filesystemTotalBytes - filesystemFreeBytes, 0);
  const filesystemUsedPercent =
    filesystemTotalBytes > 0 ? Math.round((filesystemUsedBytes / filesystemTotalBytes) * 1000) / 10 : 0;
  const totalBytes = cacheQuotaBytes > 0 ? cacheQuotaBytes : filesystemTotalBytes;
  const usedBytes = Math.min(await cachePressureBytes(), totalBytes);
  const freeBytes = Math.max(totalBytes - usedBytes, 0);
  const usedPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0;

  return {
    path: cacheDirectory,
    totalBytes,
    freeBytes,
    usedBytes,
    usedPercent,
    filesystemTotalBytes,
    filesystemFreeBytes,
    filesystemUsedBytes,
    filesystemUsedPercent
  };
}

async function clearDemoCache() {
  await mkdir(cacheDirectory, { recursive: true });
  const entries = await readdir(cacheDirectory, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.name.startsWith("cache-pressure-"))
      .map((entry) => rm(join(cacheDirectory, entry.name), { recursive: true, force: true }))
  );
}

async function createCachePressure() {
  await clearDemoCache();
  const block = Buffer.alloc(cacheBlockBytes, "x");
  let status = await cacheStatus();
  const maxBlocks = Number(process.env.SUPPORT_KNOWLEDGE_CACHE_MAX_BLOCKS ?? "2048");
  let blockIndex = 0;

  while (status.usedPercent < cacheFillTargetPercent && blockIndex < maxBlocks) {
    try {
      await writeFile(join(cacheDirectory, `cache-pressure-${String(blockIndex).padStart(4, "0")}.bin`), block);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOSPC") {
        break;
      }
      throw error;
    }
    blockIndex += 1;
    status = await cacheStatus();
  }

  return status;
}

async function maybeDelay(transaction: string) {
  if (activeScenario !== "cache-disk-pressure" || transaction !== BUSINESS_TRANSACTIONS.customerSupportResponse) {
    return;
  }

  const status = await cacheStatus();
  const delayMs = status.usedPercent >= 85 ? 2200 : 900;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

function knowledgeAttributes(transaction: string) {
  const pressureAffectsTransaction =
    activeScenario === "cache-disk-pressure" && transaction === BUSINESS_TRANSACTIONS.customerSupportResponse;

  return {
    "app.business_transaction": transaction,
    "app.scenario": activeScenario,
    "app.failure_mode": pressureAffectsTransaction ? "filesystem_pressure" : "none"
  };
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
  app.get("/knowledge/cache/status", async () => cacheStatus());
  app.get("/knowledge/scenario", async () => ({
    activeScenario,
    cache: await cacheStatus()
  }));
  app.post("/knowledge/scenario", async (request) => {
    activeScenario = ((request.body as { mode?: ScenarioMode }).mode ?? "healthy") as ScenarioMode;
    const cache =
      activeScenario === "cache-disk-pressure"
        ? await createCachePressure()
        : await clearDemoCache().then(() => cacheStatus());
    request.log.info({ activeScenario, cache }, "knowledge scenario updated");
    return {
      activeScenario,
      cache
    };
  });
  app.post("/knowledge/query", async (request, reply) => {
    const transaction = (request.body as { transaction?: string }).transaction ?? BUSINESS_TRANSACTIONS.knowledgeArticleSearch;
    request.log.info({ knowledgeRequest: request.body, transaction, activeScenario }, "knowledge query received");
    const telemetry = {
      ...buildTelemetryAttributes(transaction),
      ...knowledgeAttributes(transaction)
    };
    annotateCurrentSpan(telemetry);
    await runInSpan("knowledge.apply_cache_pressure", telemetry, () => maybeDelay(transaction));

    const cache = await cacheStatus();
    const cacheFullForSupport =
      activeScenario === "cache-disk-pressure" &&
      transaction === BUSINESS_TRANSACTIONS.customerSupportResponse &&
      cache.usedPercent >= 98;

    if (cacheFullForSupport) {
      reply.code(503);
      request.log.warn({ transaction, activeScenario, cache }, "knowledge cache volume is full");
      return {
        transaction,
        telemetry,
        scenario: activeScenario,
        error: "Knowledge cache volume is full for the customer support response workflow."
      };
    }

    request.log.info({ transaction, activeScenario, cache }, "knowledge query served");

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
  server.log.info({ knowledgeService, cacheDirectory, cacheQuotaBytes }, "knowledge-service scaffold ready");
  server.listen({ port, host: "0.0.0.0" }).catch((error) => {
    server.log.error(error);
    process.exit(1);
  });
}
