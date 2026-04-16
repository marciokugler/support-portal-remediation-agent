# App Build Plan

## Objective

Build a small but production-shaped reference application for `IBOBS-2002` that demonstrates:

- multiple business transactions
- customer-facing digital experience instrumentation
- backend APM instrumentation
- AI remediation orchestration
- automation-first Splunk setup where public APIs or Terraform support exist

The app should be small enough to build quickly and rehearse repeatedly, but structured like a real production system so the codebase can serve as a best-practice reference.

## Product Shape

The app is an AI-powered support portal with three business transactions:

- `Customer Support Response`
- `Case Status Lookup`
- `Knowledge Article Search`

Only `Customer Support Response` is intentionally affected by the live incident. The other two remain healthy so the demo can show how business transactions, endpoint grouping, and dashboards isolate the blast radius.

## Service Architecture

### Frontend

Technology:

- React
- Vite
- TypeScript

Responsibilities:

- customer-facing SPA
- route transitions for support, case status, and search
- hidden link or separate route to operator console if useful during development
- Splunk RUM, DEA, and optional Session Replay

### API Gateway

Technology:

- Node.js
- TypeScript
- Fastify

Responsibilities:

- root server entrypoint
- trace and log correlation
- stable root spans for each business transaction
- routing to downstream services

Primary endpoints:

- `POST /api/support/respond`
- `GET /api/cases/:caseId`
- `GET /api/articles/search`

### Assistant Service

Technology:

- Node.js
- TypeScript

Responsibilities:

- AI workflow orchestration for `Customer Support Response`
- downstream calls to knowledge service
- business attributes on spans

### Case Service

Technology:

- Node.js
- TypeScript

Responsibilities:

- support `Case Status Lookup`
- remain healthy during the primary incident

### Knowledge Service

Technology:

- Node.js
- TypeScript

Responsibilities:

- support `Knowledge Article Search`
- serve as the dependency used by `Customer Support Response`
- support failure injection

### Remediation Orchestrator

Technology:

- Node.js
- TypeScript

Responsibilities:

- receive Splunk webhook alerts
- accept pasted AI Assistant or Troubleshooting Agent context
- enrich with targeted Splunk API calls
- compute blast radius and policy mode
- call remediation agent
- store incident and action state

### Remediation Agent

Technology:

- Python
- FastAPI
- OpenAI-compatible client using ChatGPT API

Responsibilities:

- consume bounded `EvidenceBundle`
- choose from approved actions only
- return structured reasoning and action selection
- execute only after orchestrator approval
- expose telemetry for AI Agent Monitoring

### Scenario Controller

Technology:

- Node.js
- TypeScript

Responsibilities:

- trigger incident
- reset incident
- expose deterministic scenario state

### Operator Console

Technology:

- React
- TypeScript

Responsibilities:

- show current incident
- paste AI Assistant summary
- show enriched evidence
- show blast radius and policy
- approve action
- reset demo

## Business Transaction Design

### Transactions

Define at least three business transactions:

- `Customer Support Response`
- `Case Status Lookup`
- `Knowledge Article Search`

### Transaction rules

Preferred model:

- service-based or global-tag-based business transaction rules in Splunk APM
- use stable span attributes so transactions remain legible and low-cardinality

Recommended root span attributes:

- `app.business_transaction`
- `app.workflow`
- `app.customer_journey`
- `feature_flag.name`
- `feature_flag.variant`
- `deployment.environment`

Recommended values:

- `app.business_transaction=customer_support_response`
- `app.business_transaction=case_status_lookup`
- `app.business_transaction=knowledge_article_search`

### Endpoint and URL grouping

Use Splunk endpoint and operation rules so the UI shows grouped endpoints instead of noisy raw URLs.

Targets for grouping:

- `/api/support/respond`
- `/api/cases/*`
- `/api/articles/search`

If request parameters are introduced later, grouping should prevent endpoint explosion.

## Incident Design

Primary incident:

- enable or change a feature flag that routes `Customer Support Response` through a degraded knowledge path
- `Customer Support Response` latency and errors rise
- `Case Status Lookup` stays healthy
- `Knowledge Article Search` stays healthy or only lightly degraded

This creates a visible, explainable blast radius:

- customer-facing
- limited to one major business transaction
- bounded remediation action available

## API Contracts

### Frontend to backend

- `POST /api/support/respond`
- `GET /api/cases/:caseId`
- `GET /api/articles/search?q=...`

### Orchestrator

- `POST /webhooks/splunk/detector`
- `POST /remediation/context`
- `POST /remediation/approve/:actionId`
- `GET /remediation/actions/:actionId`
- `GET /remediation/incidents/:incidentId`

### Agent

- `POST /agent/evaluate`
- `POST /agent/execute/:actionId`
- `POST /agent/verify/:actionId`

## Engineering Best Practices

- use a monorepo
- define shared types once
- use strict TypeScript
- use structured logs everywhere
- keep all IDs explicit: `trace_id`, `incident_id`, `scenario_id`, `action_id`
- emit low-cardinality business attributes on root spans
- keep remediation tools tiny and explicit
- make every remediation action idempotent
- make every webhook path idempotent
- build reset logic before polishing UI
- keep one primary happy path and one recovery path

## Suggested Repository Layout

```text
ciscolive26/
  apps/
    frontend/
    operator-console/
    api-gateway/
    assistant-service/
    case-service/
    knowledge-service/
    remediation-orchestrator/
    remediation-agent/
    scenario-controller/
  packages/
    shared-types/
    telemetry/
    evidence-parser/
    policy-engine/
    feature-flags/
  infra/
    docker/
    terraform/
    otel-collector/
  docs/
    runbooks/
    architecture/
```
