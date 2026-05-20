# Environment Setup

This page explains how to prepare the runtime environment in detail.

## 1. Create `.env`

From the repo root:

```bash
cp .env.example .env
```

Then open `.env` and populate values you actually have.

## 2. Minimum useful environment values

For a realistic workshop, set:

```dotenv
SPLUNK_ACCESS_TOKEN=...
SPLUNK_REALM=...
OPENAI_API_KEY=...
```

## 3. Recommended telemetry values

For collector-based local export, confirm these values:

```dotenv
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

If these are absent or wrong, your services may still run, but local collector export will not behave as intended.

## 4. Load `.env` into your shell before starting services

This matters because the same shell environment needs to carry values into the dev processes.

Run:

```bash
set -a
source .env
set +a
```

Expected result:

- shell exports the values in `.env`
- later `npm run dev:*` commands inherit those values

## 5. Verify critical values are loaded

Run:

```bash
echo "$SPLUNK_REALM"
echo "$OTEL_EXPORTER_OTLP_ENDPOINT"
```

If you are using OpenAI:

```bash
test -n "$OPENAI_API_KEY" && echo "OPENAI_API_KEY is set"
```

## 6. Optional values for richer workshop behavior

Depending on your tenant and demo target:

- `VITE_SPLUNK_RUM_TOKEN`
- `VITE_SPLUNK_SESSION_REPLAY_ENABLED=true`
- `SPLUNK_HEC_URL`
- `SPLUNK_HEC_TOKEN`
- `SPLUNK_HEC_INDEX`
- `ORCHESTRATOR_PUBLIC_WEBHOOK_URL`
- `SPLUNK_WEBHOOK_SHARED_SECRET`

## 7. Environment assumptions used by the repo

The repo includes fallback behavior for local base URLs when explicit `*_BASE_URL` variables are absent. That means you normally do not need to define every service URL manually when using default ports.

Still, avoid changing ports just before the workshop unless you have to. Every extra deviation increases risk.

## 8. Safe validation

Before starting the stack, validate the file is present and readable:

```bash
ls -l .env
```

If you want a non-sensitive sanity check:

```bash
grep -E '^(SPLUNK_REALM|OTEL_EXPORTER_OTLP_ENDPOINT|OTEL_EXPORTER_OTLP_PROTOCOL)=' .env
```

Do not print secrets to a shared screen during rehearsal or the live session.

## 9. Optional: if you need a public detector webhook

The primary lab flow uses copied Splunk evidence and does not require a public webhook. Start the tunnel only if you explicitly want to test live detector-to-orchestrator delivery after the orchestrator itself is working locally.

Use:

```bash
npm run dev:tunnel
```

Do not make tunnel setup your first validation step. First prove the local app, copy/paste evidence path, and local orchestrator work on localhost.
