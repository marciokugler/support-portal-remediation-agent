# Codex Implementation Brief

## Goal

Build the `IBOBS-2002` demo application and supporting automation from this repository.

This repository is intended to become:

- a live demo system for Cisco Live
- a best-practice reference app for Splunk Observability Cloud
- an automation-first example of observability configuration as code

## Non-Negotiable Requirements

- multiple business transactions
- one primary degraded transaction and at least two healthy ones
- Splunk RUM, DEA, and optional Session Replay on the frontend
- Splunk OTel instrumentation on backend services
- Python remediation agent instrumented for AI Agent Monitoring
- detector webhook into orchestrator
- human-in-the-loop evidence paste flow from Splunk AI Assistant or Troubleshooting Agent
- targeted Splunk API enrichment for missing structured evidence
- dashboards and detectors created as code where supported

## Preferred Languages and Frameworks

- frontend: React + Vite + TypeScript
- operator console: React + TypeScript
- backend services: Node.js + TypeScript + Fastify
- remediation agent: Python + FastAPI
- infrastructure as code: Terraform using `splunk-terraform/signalfx`

## Business Transactions

Must exist:

- `Customer Support Response`
- `Case Status Lookup`
- `Knowledge Article Search`

Demo incident:

- only `Customer Support Response` should materially degrade

## Required Services

- `frontend`
- `operator-console`
- `api-gateway`
- `assistant-service`
- `case-service`
- `knowledge-service`
- `remediation-orchestrator`
- `remediation-agent`
- `scenario-controller`

## Telemetry Requirements

### Frontend

- Splunk RUM
- DEA
- Session Replay if tenant supports it
- custom actions for each major user interaction

### Backend

- auto-instrument HTTP/framework spans
- manual spans for business operations
- default APM and host metrics as the primary incident evidence
- stable business attributes

### Agent

- model latency
- token usage
- tool calls
- confidence band
- reasoning summary
- final action

## Evidence Flow

1. Splunk detector fires
2. webhook hits orchestrator
3. presenter reviews Splunk AI Assistant output
4. presenter pastes summary into operator console
5. orchestrator enriches missing fields from Splunk APIs
6. orchestrator creates `EvidenceBundle`
7. orchestrator decides whether incident is automation-eligible
8. remediation agent chooses one allowed action
9. operator approves
10. orchestrator executes and verifies

## Engineering Style

- prioritize reliability over feature count
- keep APIs small and explicit
- prefer low-cardinality dimensions
- avoid hidden magic in the orchestrator
- make the operator console explain every decision
- keep the remediation toolset tiny
- design for rehearsal and reset

## Manual-Step Policy

Default rule:

- if it can be automated through Terraform or a supported public API, implement it as code

Exception:

- if business transaction rules or endpoint grouping cannot be automated through supported public interfaces, document them as explicit pre-flight setup tasks rather than inventing brittle workarounds
