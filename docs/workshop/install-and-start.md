# Install and Start

This page is the full bring-up runbook.

## Phase 1: install dependencies

### 1. Install Node workspace dependencies

From the repo root:

```bash
npm install
```

What this does:

- installs workspace dependencies for all apps and packages
- prepares the frontend, backend, simulation, and TypeScript tooling

What good looks like:

- command exits successfully
- no missing package-manager errors

### 2. Create the remediation agent virtual environment

From the repo root:

```bash
cd apps/remediation-agent
python3 -m venv .venv
.venv/bin/pip install -e .
cd ../..
```

What this does:

- creates an isolated Python environment
- installs the remediation agent in editable mode

What good looks like:

- `.venv` exists
- the install step completes without dependency or build errors

## Phase 2: start optional supporting services

### 3. Start Docker

Make sure the Docker daemon is running before you start the collector.

### 4. Start the local Splunk OTel collector

In a dedicated terminal:

```bash
set -a
source .env
set +a
npm run dev:collector
```

Use this when:

- you want collector-based telemetry export
- you want to validate logs, traces, and metrics locally before opening Splunk

Do not block the whole workshop on this step if your main objective is just app bring-up. The workshop story is stronger with telemetry, but the application itself should be proven first.

## Phase 3: start the application stack

### 5. Start all services

In another terminal:

```bash
set -a
source .env
set +a
npm run dev:all
```

This should start:

- knowledge service
- assistant service
- case service
- scenario controller
- API gateway
- remediation orchestrator
- remediation agent
- frontend
- operator console

### 6. Wait for steady state

Do not start clicking immediately. Wait until the console output shows the services have actually bound their ports and the Vite servers are ready.

### 7. Verify key local endpoints

Open these in your browser:

- `http://127.0.0.1:5173`
- `http://127.0.0.1:5174`

Optional API sanity checks from a terminal:

```bash
curl -i http://127.0.0.1:4000
curl -i http://127.0.0.1:4004
curl -i http://127.0.0.1:4010
curl -i http://127.0.0.1:8000
```

Exact response bodies may differ, but the ports should be reachable.

## Phase 4: establish a clean baseline

### 8. Exercise the healthy system

Before any failure injection:

1. Open the frontend.
2. Execute `Customer Support Response`.
3. Execute `Case Status Lookup`.
4. Execute `Knowledge Article Search`.

What you want to prove:

- the app works at baseline
- the three transactions are distinct
- the audience can later understand that only one degraded

### 9. Check the operator console

Open the operator console and confirm:

- no unexpected stale incident is blocking the flow
- policy and remediation panes load
- the UI is usable before you induce the fault

## Phase 5: trigger and run the incident

### 10. Trigger the scenario

Use the scenario controls to activate the dependency latency path.

### 11. Reproduce the degraded transaction

Run `Customer Support Response` again after the scenario is active.

Expected result:

- degraded latency and possibly failures show up for that workflow
- the other two transactions remain healthy

### 12. Drive the remediation flow

The intended sequence is:

1. move to the operator console
2. copy the Splunk AI Assistant or Troubleshooting Agent summary
3. paste it into `Paste Splunk AI Assistant Summary`
4. click `Open Incident From Evidence`
5. let the orchestrator enrich evidence
6. review policy mode
7. review agent recommendation
8. approve the bounded action
9. verify recovery

## Phase 6: optional simulators

### 13. Use backend traffic simulation

If you want extra backend signal volume:

```bash
npm run simulate:traffic
```

Use this for:

- backend metrics and detectors
- non-browser traffic generation

### 14. Use browser simulation

If you want real browser sessions:

```bash
RUM_SIMULATOR_USERS=5 RUM_SIMULATOR_ROUNDS=10 npm run simulate:rum
```

Use this for:

- Splunk RUM
- DEA
- session replay candidate generation

## Stop conditions

Do not move into the live workshop until these are true:

- frontend works
- operator console works
- at least one healthy baseline journey was executed
- the fault can be triggered deterministically
- the remediation flow can be completed end to end
