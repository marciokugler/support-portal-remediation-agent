# Architecture Summary

This page explains the repo in workshop terms instead of implementation-only terms.

## Core design

The system is split into two layers:

1. observability and evidence
2. action and governance

That distinction matters. It keeps the story technically credible and keeps the trust model clear.

## User-facing layer

### `apps/frontend`

This is the customer-facing AI support portal.

It demonstrates:

- customer support response
- case status lookup
- knowledge article search

It is the place where the incident becomes visible first.

### `apps/operator-console`

This is the presenter-facing operations and approval interface.

It is the place where you show:

- incident intake
- evidence context
- policy mode
- proposed action
- approval state
- validation result

## Application services

### `apps/api-gateway`

Primary backend entry point for the frontend.

### `apps/assistant-service`

Implements the support response workflow.

This is part of the main degraded path in the workshop.

### `apps/case-service`

Implements case status lookup.

This should remain healthy during the demo incident.

### `apps/knowledge-service`

Implements knowledge search and is an important failure source in the scenario.

### `apps/scenario-controller`

Provides deterministic incident trigger and reset behavior.

This makes the workshop repeatable.

## Remediation layer

### `apps/remediation-orchestrator`

This is the governance layer.

Responsibilities:

- receive detector context
- accept human-readable investigation summaries
- parse evidence
- enrich missing structured fields
- build the final evidence bundle
- apply deterministic policy
- manage approval and execution flow

### `apps/remediation-agent`

Python remediation agent with a bounded toolset and model-backed action selection.

This is intentionally separated from Splunk investigation capabilities.

## Shared packages

### `packages/shared-types`

Contracts for evidence, policy, actions, and store data.

### `packages/policy-engine`

Deterministic policy logic outside the LLM.

### `packages/evidence-parser`

Parses human-readable AI summary text into structured evidence.

### `packages/telemetry`

Shared telemetry naming and helper logic.

### `packages/runtime-config`

Runtime configuration helpers for browser and service apps.

## Infrastructure and Splunk objects

### `infra/terraform`

Splunk dashboards, detectors, webhooks, and related objects as code.

### `infra/splunk`

Spec-driven authoring path for dashboards and detectors.

### `infra/otel-collector`

Local collector configuration for OTLP and log forwarding.

## Architecture story to tell live

The cleanest narrative is:

1. customer experience degrades
2. observability correlates the impact
3. the orchestrator turns investigation output into structured evidence
4. deterministic policy decides what is allowed
5. the remediation agent proposes a bounded action
6. the operator approves
7. the system validates recovery

That is the workshop in one sequence.
