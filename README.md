# Cisco Live 2026 Demo App

This repository contains the `IBOBS-2002` Cisco Live demo app and supporting Splunk Observability automation.

## Workspaces

- `apps/frontend`: customer-facing AI support portal
- `apps/operator-console`: presenter-facing evidence and approval console
- `apps/api-gateway`: primary backend entrypoint
- `apps/assistant-service`: support-response workflow
- `apps/case-service`: case status workflow
- `apps/knowledge-service`: knowledge search workflow and cache-pressure source
- `apps/remediation-orchestrator`: evidence intake, enrichment, policy, and action management
- `apps/scenario-controller`: deterministic incident trigger/reset
- `apps/remediation-agent`: Python remediation agent with model-backed action selection
- `packages/shared-types`: evidence, policy, action, and store contracts
- `packages/policy-engine`: deterministic policy logic
- `packages/evidence-parser`: AI Assistant text parsing into normalized evidence
- `packages/telemetry`: shared Splunk telemetry helpers
- `packages/runtime-config`: shared local URL and port helpers
- `infra/splunk`: spec-driven Splunk dashboard and detector authoring
- `infra/terraform`: Terraform-managed Splunk Observability objects

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

The app stack can run without credentials. Add `OPENAI_API_KEY`, `SPLUNK_ACCESS_TOKEN`, `SPLUNK_REALM`, and browser RUM values when you want model-backed remediation and live Splunk export.

Start everything locally:

```bash
npm run dev
```

Useful alternatives:

- `npm run dev:backend`: start only backend services and the remediation agent
- `npm run dev:collector`: start the local Splunk OTel Collector container
- `npm run dev:tunnel`: expose the orchestrator for optional Splunk webhook delivery
- `npm test`: run TypeScript unit tests
- `npm run test:python`: run Splunk object sync tests
- `npm run build`: build npm workspaces that define a build script

When running with telemetry locally, load `.env` before starting the stack:

```bash
set -a
source .env
set +a
npm run dev
```

Key local URLs:

- support portal: `http://127.0.0.1:18080`
- operator console: `http://127.0.0.1:18081`
- API gateway: `http://127.0.0.1:18100`
- assistant service: `http://127.0.0.1:18101`
- case service: `http://127.0.0.1:18102`
- knowledge service: `http://127.0.0.1:18103`
- scenario controller: `http://127.0.0.1:18104`
- remediation orchestrator: `http://127.0.0.1:18110`
- remediation agent: `http://127.0.0.1:18800`
- collector OTLP HTTP on the host: `http://127.0.0.1:14318`

## Demo Scenario

The demo is now metric-driven and uses out-of-the-box Splunk Observability signals:

- Splunk RUM and browser spans show the customer journey.
- Splunk APM service metrics show request duration, request count, and errors.
- Splunk OTel Collector hostmetrics show filesystem pressure.
- The remediation agent can be instrumented for AI Agent Monitoring through Splunk/OpenTelemetry packages.

The deterministic incident is `cache-disk-pressure`. The scenario controller asks `support-knowledge` to fill a bounded cache directory or tmpfs mount. That creates filesystem pressure visible through host metrics and slows the Customer Support Response path through normal APM spans. Case status lookup and knowledge article search remain available as healthy comparison journeys.

The bounded remediation action is `clean_service_cache`. Approval calls the remediation agent, which resets the scenario through the scenario controller and verifies recovery by running a post-remediation support request.

## Student Isolation

For a shared Splunk Observability Cloud account, each student should set a unique `INSTANCE` value:

```dotenv
INSTANCE=student-001
OTEL_RESOURCE_ATTRIBUTES=lab.name=ciscolive26,lab.student.id=student-001,service.instance.id=student-001,host.name=student-001,deployment.environment=demo
```

Dashboards and detectors filter by `deployment.environment` plus `service.instance.id` so multiple students can share one Splunk Observability Cloud account.

## Docker Compose

The repo includes a development compose file at [infra/docker/docker-compose.yml](infra/docker/docker-compose.yml).

```bash
docker compose --env-file .env -f infra/docker/docker-compose.yml up
```

The compose path mounts a shared 128 MiB tmpfs at `/var/cache/support-knowledge` for the knowledge service and the collector. The cache-pressure scenario fills that tmpfs, which gives the collector a real filesystem signal without risking the host disk.

## Splunk Objects

The preferred authoring path is [infra/splunk](infra/splunk):

```bash
npm run splunk:render
npm run splunk:apply
```

Terraform remains available in [infra/terraform](infra/terraform). Current detectors are based on out-of-the-box signals:

- `IBOBS Support Knowledge Cache Filesystem Pressure`
- `IBOBS Support Knowledge APM Latency`
- `IBOBS Support Knowledge APM Error Rate`

## Primary Lab Flow

The workshop does not depend on live detector webhook delivery. The presenter can copy Splunk AI Assistant or Troubleshooting Agent evidence into the operator console and run the governed remediation flow locally.

Optional webhook delivery is still available at `POST /webhooks/splunk/detector` when `ORCHESTRATOR_PUBLIC_WEBHOOK_URL` points to a public URL. If `SPLUNK_WEBHOOK_SHARED_SECRET` is set, the orchestrator requires `x-ibobs-webhook-secret`.
