# Cisco Live 2026 Workshop Runbook

This site is the operator guide for running the `IBOBS-2002` workshop from this repository.

The goal is not generic project documentation. The goal is to get the workshop running reliably, explain the architecture clearly, and give the presenter a step-by-step path for bringing up the environment, triggering the incident, and walking the audience through remediation.

## What this repo demonstrates

- a customer-facing AI support portal
- multiple business transactions, with one degraded and two healthy
- Splunk RUM, DEA, Session Replay, APM telemetry, and correlated logs
- a remediation orchestrator that receives detector context and enriches evidence
- a bounded remediation agent with policy-driven approval
- a repeatable demo path that starts with customer impact and ends with validation

## Recommended reading order

If you have only a few hours before the workshop, use this order:

1. [Quick Start](workshop/quickstart.md)
2. [Prerequisites](workshop/prerequisites.md)
3. [Environment Setup](workshop/environment.md)
4. [Install and Start](workshop/install-and-start.md)
5. [Live Demo Flow](workshop/live-demo-flow.md)
6. [Troubleshooting](workshop/troubleshooting.md)

## Serve the docs locally

From the repo root:

```bash
python3 -m pip install -r requirements-docs.txt
python3 -m mkdocs serve
```

Then open `http://127.0.0.1:8000/`.

## Core customer story

A company launches an AI-powered support portal. During peak usage, a dependency or feature flag change degrades the `Customer Support Response` workflow. Splunk observability surfaces the customer impact first. The remediation orchestrator collects evidence, enriches it, applies policy, asks for approval when required, executes a bounded action, and verifies recovery.

## Fast facts

- Main frontend: `http://127.0.0.1:5173`
- Operator console: `http://127.0.0.1:5174`
- API gateway: `http://127.0.0.1:4000`
- Scenario controller: `http://127.0.0.1:4004`
- Remediation orchestrator: `http://127.0.0.1:4010`
- Remediation agent: `http://127.0.0.1:8000`

## Important note

This documentation was added to make the repo runnable as a workshop guide. It does not depend on an existing documentation framework in the repo. You will need to install `mkdocs` locally to serve the site.
