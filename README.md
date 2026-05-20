# Cisco Live 2026 Demo App

This repository contains the implementation for the `IBOBS-2002` demo app and supporting Splunk Observability automation.

## Workspaces

- `apps/frontend`: customer-facing AI support portal
- `apps/operator-console`: presenter-facing evidence and approval console
- `apps/api-gateway`: primary backend entrypoint
- `apps/assistant-service`: support-response workflow
- `apps/case-service`: case status workflow
- `apps/knowledge-service`: knowledge search workflow and failure source
- `apps/remediation-orchestrator`: detector webhook intake, enrichment, policy, action management
- `apps/scenario-controller`: deterministic incident trigger/reset
- `apps/remediation-agent`: Python remediation agent with ChatGPT-backed action selection
- `packages/shared-types`: business transactions, evidence, policy, and action contracts
- `packages/policy-engine`: deterministic policy logic
- `packages/evidence-parser`: AI Assistant text parsing into normalized evidence
- `packages/telemetry`: shared telemetry naming helpers
- `infra/terraform`: Splunk Observability configuration as code

## Local Development

Prerequisites:

- Node.js 22 and npm
- Python 3.11 or newer
- Docker Desktop or another Docker daemon, only if you want the local Splunk OTel Collector or Docker Compose flow
- `cloudflared`, only if you want to test the optional live Splunk webhook delivery path

One-time setup from the repository root:

```bash
test -f .env || cp .env.example .env
npm install
python3 -m venv apps/remediation-agent/.venv
apps/remediation-agent/.venv/bin/pip install -e apps/remediation-agent
```

The app stack can run without credentials in `.env`. Add `OPENAI_API_KEY`, `SPLUNK_ACCESS_TOKEN`, `SPLUNK_HEC_TOKEN`, and the related Splunk values when you want AI-backed remediation, telemetry export, logs, RUM, or Splunk API integration.

Start everything locally:

```bash
npm run dev
```

`npm run dev` is an alias for `npm run dev:all`. It starts the backend services, Python remediation agent, customer frontend, and operator console in one process group.

Useful alternatives:

- `npm run dev:backend`: start only the backend services and remediation agent
- `npm run dev:collector`: start the local Splunk OTel Collector container
- `npm run dev:tunnel`: expose the orchestrator on a public Cloudflare tunnel URL for the optional webhook path
- `npm test`: run the TypeScript unit tests
- `npm run test:python`: run the Python Splunk object sync tests
- `npm run build`: build all npm workspaces that define a build script

When running with telemetry locally, load `.env` in the shell before starting the stack:

```bash
set -a
source .env
set +a
npm run dev
```

Key local URLs:
- frontend: `http://127.0.0.1:5173`
- operator console: `http://127.0.0.1:5174`
- API gateway: `http://127.0.0.1:4000`
- scenario controller: `http://127.0.0.1:4004`
- remediation orchestrator: `http://127.0.0.1:4010`
- remediation agent: `http://127.0.0.1:8000`

Runtime config note:
- backend services now derive local base URLs from the matching `*_PORT` value when the explicit `*_BASE_URL` env var is unset
- the frontend and operator console do the same for `VITE_*_BASE_URL`
- this keeps local port changes aligned without editing multiple fallback sites in code

## Docker Compose

The repo includes a development-oriented compose file at [infra/docker/docker-compose.yml](infra/docker/docker-compose.yml).

Run it from the repository root:

```bash
docker compose -f infra/docker/docker-compose.yml up
```

If you want OpenAI or Splunk credentials available inside the containers, run it from a shell where `.env` is loaded or use:

```bash
docker compose --env-file .env -f infra/docker/docker-compose.yml up
```

This path is slower than the local workspace flow because each container installs dependencies on startup, but it keeps the demo reproducible and avoids hand-built containers during early development.

## Telemetry

Backend services use the Splunk Distribution of OpenTelemetry for Node.js when `SPLUNK_ACCESS_TOKEN` and `SPLUNK_REALM` are set.

The Python remediation agent uses `splunk-opentelemetry` plus FastAPI and HTTPX instrumentors under the same env gate. If Splunk credentials are absent, the app still runs without exporting telemetry.

The Node services start Splunk auto-instrumentation before the app imports, so HTTP, Fastify, and outbound client spans are captured automatically. `SPLUNK_PROFILER_ENABLED=true` can be used to turn on always-on profiler collection for the Node services when you want code-level profiling in APM.

Telemetry now also includes release metadata for faster root cause analysis:
- resource attributes include `service.version` and `app.version`
- the knowledge-service spans add `demo.release_version`, `feature_flag.key`, and `feature_flag.variant`
- when the latency scenario is active, the affected dependency reports `support_knowledge_v2` on `2.1.0-canary`; after remediation it returns to `2.0.4`

You can override those demo release markers with:
- `APP_VERSION` or `OTEL_SERVICE_VERSION`
- `KNOWLEDGE_STABLE_VERSION`
- `KNOWLEDGE_CANARY_VERSION`

The frontend uses `@splunk/otel-web` for Splunk RUM and can optionally enable session replay with `@splunk/otel-web-session-recorder` when `VITE_SPLUNK_SESSION_REPLAY_ENABLED=true`. Browser-side custom spans are emitted around the three business transactions so the customer journey remains readable in RUM and correlated backend traces.

For the current demo, keep both Splunk auto-instrumentation and the custom RED-style metrics (`latency_latest_ms`, `requests`, and `errors`) enabled so the existing dashboards and detectors continue to work. In a later cleanup, disable those custom RED metrics and migrate the affected dashboards and detectors to Splunk APM native RED views and detectors.

For local telemetry debugging, the repo now supports routing OTLP traffic through the Splunk Distribution of the OpenTelemetry Collector using [infra/otel-collector/config.yaml](infra/otel-collector/config.yaml).

Structured log collection is now enabled for the backend services and remediation agent. Services write JSON logs to `var/log/*.log`, including trace and span correlation fields plus raw request payloads such as prompts, customer queries, and case IDs. The local collector reads those files and forwards them to Splunk HEC using `SPLUNK_HEC_URL`, `SPLUNK_HEC_TOKEN`, and `SPLUNK_HEC_INDEX`.

The operator-guided remediation path is now wired to a real demo control plane:
- approving `disable_feature_flag` resets the active scenario through the scenario controller
- verification runs a post-remediation support request and checks latency against `REMEDIATION_VALIDATION_LATENCY_THRESHOLD_MS`
- incident records persist approval, execution, verification, and recovery timestamps for the operator console

Infrastructure monitoring is also enabled in the local collector through `hostmetrics`, so the same collector forwards host CPU, memory, filesystem, network, and process telemetry to Splunk Observability Cloud. Container-level Docker stats are environment-dependent and may require extra Docker socket permissions beyond this local setup.

Recommended local validation order:

1. Start Docker Desktop or another Docker daemon.
2. Start the collector with `npm run dev:collector`.
3. Start the app stack with `npm run dev:backend` or `npm run dev:all`.
4. Trigger traffic and scenarios from the frontend or operator console.
5. Inspect collector logs to confirm traces and custom metrics such as `latency`, `errors`, and `affected_sessions` are arriving before checking Splunk UI visibility.
6. Confirm the collector `logs` pipeline is reading `var/log/*.log` and forwarding events to HEC before validating log-to-trace correlation in Splunk.

Restart note:

- Always load `.env` before restarting backend or frontend processes so local shells keep `VITE_SPLUNK_RUM_TOKEN`, `SPLUNK_ACCESS_TOKEN`, and the OTEL env vars:
  ```bash
  set -a
  source .env
  set +a
  ```
- `npm run dev:backend`, `npm run dev:all`, and the Terraform webhook helpers are safe to run from a shell where `.env` is loaded. They do not overwrite or delete the RUM token.

Traffic generation modes:

- `npm run simulate:traffic`
  - sends API traffic directly to the backend
  - useful for detector and backend metric validation
  - does not create browser RUM sessions
- `npm run simulate:rum`
  - uses Playwright to open real browser contexts against the frontend
  - useful for Splunk RUM, Digital Experience Analytics, and session replay validation
  - creates distinct browser sessions by closing each browser context after a short journey

Recommended RUM validation command:

```bash
RUM_SIMULATOR_USERS=5 RUM_SIMULATOR_ROUNDS=10 npm run simulate:rum
```

## Splunk Provisioning Status

The Terraform root module in [infra/terraform](infra/terraform) has been applied successfully against the target org and currently manages:

- dashboard group: `IBOBS 2002 Demo`
- dashboards:
  - `IBOBS Executive Story`
  - `IBOBS Business Transactions`
  - `IBOBS Digital Experience`
  - `IBOBS Service Health`
  - `IBOBS Remediation Operations`
- detectors:
  - `IBOBS Customer Support Response Latency`
  - `IBOBS Customer Support Response Error Rate`
  - `IBOBS Knowledge Article Search Error Guardrail`
  - `IBOBS Remediation Duration High`
  - `IBOBS Remediation Validation Failed`
  - `IBOBS Blast Radius Guardrail`

Primary lab flow:

- the workshop no longer depends on live detector webhook delivery
- the presenter copies Splunk AI Assistant or Troubleshooting Agent evidence into the operator console
- the operator console opens the incident and submits the copied evidence to the orchestrator

Optional webhook path:

- Splunk Cloud cannot send webhooks to a local `127.0.0.1` endpoint
- use a public URL or tunnel only when you explicitly want to test live detector-to-orchestrator delivery

Webhook hardening:

- if `SPLUNK_WEBHOOK_SHARED_SECRET` is set, the orchestrator requires `x-ibobs-webhook-secret` on `POST /webhooks/splunk/detector`
- this remains available for the optional webhook integration object once a public URL is available
