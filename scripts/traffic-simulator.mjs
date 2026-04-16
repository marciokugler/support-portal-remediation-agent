#!/usr/bin/env node

const baseUrl = process.env.SIMULATOR_BASE_URL ?? "http://127.0.0.1:4000";
const durationSeconds = Number.parseInt(process.env.SIMULATOR_DURATION_SECONDS ?? "120", 10);
const intervalMs = Number.parseInt(process.env.SIMULATOR_INTERVAL_MS ?? "500", 10);
const mix = process.env.SIMULATOR_MIX ?? "support-heavy";

const supportPrompt = {
  prompt: "My support portal is slow and I need help understanding why."
};

const articleQuery = "reset password";
const caseId = "CASE-1024";

function pickTransaction() {
  const roll = Math.random();

  if (mix === "support-only") {
    return "support";
  }

  if (mix === "balanced") {
    if (roll < 0.34) {
      return "support";
    }

    if (roll < 0.67) {
      return "case";
    }

    return "article";
  }

  if (roll < 0.75) {
    return "support";
  }

  if (roll < 0.9) {
    return "case";
  }

  return "article";
}

async function fireSupportRequest() {
  return fetch(`${baseUrl}/api/support/respond`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(supportPrompt)
  });
}

async function fireCaseLookup() {
  return fetch(`${baseUrl}/api/cases/${caseId}`);
}

async function fireArticleSearch() {
  return fetch(`${baseUrl}/api/articles/search?q=${encodeURIComponent(articleQuery)}`);
}

async function runOneRequest() {
  const transaction = pickTransaction();
  const started = Date.now();

  try {
    const response =
      transaction === "support"
        ? await fireSupportRequest()
        : transaction === "case"
          ? await fireCaseLookup()
          : await fireArticleSearch();

    const elapsedMs = Date.now() - started;
    console.log(
      JSON.stringify({
        transaction,
        status: response.status,
        ok: response.ok,
        elapsedMs
      })
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        transaction,
        status: 0,
        ok: false,
        elapsedMs: Date.now() - started,
        error: error instanceof Error ? error.message : String(error)
      })
    );
  }
}

async function main() {
  const deadline = Date.now() + durationSeconds * 1000;

  console.log(
    JSON.stringify({
      baseUrl,
      durationSeconds,
      intervalMs,
      mix
    })
  );

  while (Date.now() < deadline) {
    await runOneRequest();
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

await main();
