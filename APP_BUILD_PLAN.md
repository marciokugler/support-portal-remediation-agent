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

The app is an AI-powered claims portal with three business transactions:

- `AI Claim Status`
- `Policy Coverage Lookup`
- `Claims FAQ Search`

Only `AI Claim Status` is intentionally affected by the live incident. The other two remain healthy so the demo can show how business transactions, endpoint grouping, and dashboards isolate the affected workflow.

## Service Architecture

### Frontend

Technology:

- React
- Vite
- TypeScript

Responsibilities:

- customer-facing SPA
- route transitions for claim status, policy coverage, and FAQ search
- hidden link or separate route to operator console if useful during development
- Splunk RUM, DEA, and optional Session Replay

### API Gateway

Technology:

- Node.js
- TypeScript
- Fastify

Responsibilities:

- root server entrypoint
- trace and metric correlation
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

- AI workflow orchestration for `AI Claim Status`
- downstream calls to knowledge service
- business attributes on spans

### Case Service

Technology:

- Node.js
- TypeScript

Responsibilities:

- support `Policy Coverage Lookup`
- remain healthy during the primary incident

### Knowledge Service

Technology:

- Node.js
- TypeScript

Responsibilities:

- support `Claims FAQ Search`
- serve as the dependency used by `AI Claim Status`
- support failure injection

### Remediation Orchestrator

Technology:

- Node.js
- TypeScript

Responsibilities:

- receive Splunk webhook alerts
- accept pasted AI Assistant or Troubleshooting Agent context
- enrich with targeted Splunk API calls
- compute policy mode from confidence, environment, and approved action scope
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
- show policy, approval state, and validation evidence
- approve action
- reset demo

## Business Transaction Design

### Transactions

Define at least three business transactions:

- `AI Claim Status`
- `Policy Coverage Lookup`
- `Claims FAQ Search`

### Transaction rules

Preferred model:

- service-based or global-tag-based business transaction rules in Splunk APM
- use stable span attributes so transactions remain legible and low-cardinality

Recommended root span attributes:

- `app.business_transaction`
- `app.workflow`
- `app.customer_journey`
- `app.feature_area`
- `scenario.id`
- `deployment.environment`

Recommended values:

- `app.business_transaction=claim_status_response`
- `app.business_transaction=policy_coverage_lookup`
- `app.business_transaction=claims_faq_search`

### Endpoint and URL grouping

Use Splunk endpoint and operation rules so the UI shows grouped endpoints instead of noisy raw URLs.

Targets for grouping:

- `/api/support/respond`
- `/api/cases/*`
- `/api/articles/search`

If request parameters are introduced later, grouping should prevent endpoint explosion.

## Incident Design

Primary incident:

- fill the cache volume used by the claims knowledge service
- `AI Claim Status` latency and errors rise
- `Policy Coverage Lookup` stays healthy
- `Claims FAQ Search` stays healthy because it does not exercise the same retrieval path in the staged flow

This creates a visible, explainable signal chain:

- customer-facing degradation in RUM and business transactions
- backend latency in APM on the claims knowledge path
- filesystem pressure in Infrastructure Monitoring from collector host metrics
- a bounded `clean_claims_knowledge_cache` remediation action

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
- make traces and default metrics the primary demo evidence
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
  infra/
    docker/
    terraform/
    otel-collector/
  docs/
    runbooks/
    architecture/
```
