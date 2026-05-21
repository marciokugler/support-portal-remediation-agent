# Environment Setup

This page explains the runtime environment.

## 1. Create `.env`

```bash
cp .env.example .env
```

Then populate values you actually have.

## 2. Student identity

Each student should use a unique `INSTANCE`.

```dotenv
INSTANCE=student-001
OTEL_RESOURCE_ATTRIBUTES=lab.name=ciscolive26,lab.student.id=student-001,service.instance.id=student-001,host.name=student-001,deployment.environment=demo
```

In a shared Splunk Observability Cloud account, this is what lets students filter to their own lab data.

## 3. Minimum useful values

```dotenv
SPLUNK_ACCESS_TOKEN=...
SPLUNK_REALM=...
OPENAI_API_KEY=...
```

The stack can run without these values, but live Splunk export and model-backed remediation will be limited.

## 4. Collector export

For local collector export, use the high host port:

```dotenv
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:14318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

Inside Docker Compose, services use `http://splunk-otel-collector:4318`.

## 5. App ports

Defaults:

```dotenv
ORCHESTRATOR_PORT=18110
API_GATEWAY_PORT=18100
ASSISTANT_SERVICE_PORT=18101
CASE_SERVICE_PORT=18102
KNOWLEDGE_SERVICE_PORT=18103
SCENARIO_CONTROLLER_PORT=18104
REMEDIATION_AGENT_PORT=18800
```

Frontend URLs:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:18100
VITE_ORCHESTRATOR_BASE_URL=http://127.0.0.1:18110
VITE_SCENARIO_CONTROLLER_BASE_URL=http://127.0.0.1:18104
```

## 6. Cache pressure controls

```dotenv
SUPPORT_KNOWLEDGE_CACHE_DIR=/tmp/ciscolive26-${INSTANCE}/support-knowledge-cache
SPLUNK_CACHE_MOUNTPOINT=/var/cache/support-knowledge
SUPPORT_KNOWLEDGE_CACHE_FILL_PERCENT=92
SUPPORT_KNOWLEDGE_CACHE_QUOTA_BYTES=134217728
```

For Docker Compose, the cache directory is mounted as a shared 128 MiB tmpfs volume at `/var/cache/support-knowledge` for both `support-knowledge` and the collector. The scenario fills a real bounded filesystem without touching the host disk, and Splunk filters the detector to `SPLUNK_CACHE_MOUNTPOINT`.

## 7. Optional values

- `VITE_SPLUNK_RUM_TOKEN`
- `VITE_SPLUNK_SESSION_REPLAY_ENABLED=true`
- `ORCHESTRATOR_PUBLIC_WEBHOOK_URL`
- `SPLUNK_WEBHOOK_SHARED_SECRET`

## 8. Load `.env`

```bash
set -a
source .env
set +a
```

Do this before starting collector, backend, or frontend processes.

## 9. Optional public webhook

The primary lab flow uses copied Splunk evidence and does not require a public webhook. Start a tunnel only if you explicitly want Splunk detector delivery into the local orchestrator:

```bash
npm run dev:tunnel
```
