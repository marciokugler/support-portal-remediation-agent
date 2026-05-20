# Quick Start

This is the shortest reliable path to a working workshop run.

Use it when you need to get the demo environment up quickly and do not want to read every document first.

## Outcome

At the end of this flow you should have:

- an `mkdocs` site you can serve locally
- the app stack running locally
- optional collector telemetry running
- the frontend and operator console reachable
- a known healthy starting state
- a deterministic way to trigger the incident
- a clear sequence for the live workshop

## 1. Confirm you have the required tools

You need:

- Node.js and `npm`
- Python 3
- `pip` for installing `mkdocs`
- Docker Desktop or another local Docker daemon
- optionally Splunk and OpenAI credentials in `.env`

If you are not sure, read [Prerequisites](prerequisites.md).

## 2. Install and serve the documentation site

From the repo root:

```bash
python3 -m pip install -r requirements-docs.txt
mkdocs serve
```

Expected result:

- MkDocs starts a local docs server
- the runbook is available at `http://127.0.0.1:8000/` by default

If `mkdocs` is not on your shell path after installation, use:

```bash
python3 -m mkdocs serve
```

## 3. Create `.env` if you need real Splunk or OpenAI integration

From the repo root:

```bash
cp .env.example .env
```

Then fill in the values you actually have.

Minimum useful values for a full demo:

- `SPLUNK_ACCESS_TOKEN`
- `SPLUNK_REALM`
- `OPENAI_API_KEY`

If you do not have these values, the stack can still run locally, but the live observability story will be limited.

## 4. Install Node dependencies

From the repo root:

```bash
npm install
```

Expected result:

- `node_modules/` is created
- workspaces install without fatal errors

## 5. Create the remediation agent virtual environment

From the repo root:

```bash
cd apps/remediation-agent
python3 -m venv .venv
.venv/bin/pip install -e .
cd ../..
```

Expected result:

- `apps/remediation-agent/.venv` exists
- the Python package installs in editable mode

## 6. Start the collector if you are validating telemetry

In terminal 1:

```bash
npm run dev:collector
```

Do this only if Docker is running and your `.env` is ready for telemetry export.

## 7. Start the application stack

In terminal 2:

```bash
npm run dev:all
```

Expected result:

- frontend and operator console Vite servers start
- backend services bind to localhost ports
- the Python remediation agent starts on port `8000`

## 8. Open the two main UIs

- frontend: `http://127.0.0.1:5173`
- operator console: `http://127.0.0.1:5174`

## 9. Establish a healthy baseline

Before showing a fault:

1. Run all three transactions once in the frontend.
2. Confirm they respond normally.
3. Confirm the operator console shows no unexpected stale incident state.

The three transactions are:

- `Customer Support Response`
- `Case Status Lookup`
- `Knowledge Article Search`

## 10. Trigger the demo incident

Use the scenario controls to trigger the dependency latency scenario.

Then:

1. Run `Customer Support Response` again.
2. Keep the other two transactions healthy.
3. Open the operator console.
4. Copy the Splunk AI Assistant or Troubleshooting Agent summary.
5. Paste the summary into the operator console.
6. Click `Open Incident From Evidence`.

## 11. Complete the remediation story

The intended live sequence is:

1. Show customer impact first.
2. Show that only one business transaction is degraded.
3. Paste copied Splunk evidence into the operator console.
4. Walk through orchestrator evidence enrichment.
5. Show policy and bounded action selection.
6. Approve the action.
7. Verify recovery.
8. Close on auditability and trust.

## If anything breaks

Go straight to [Troubleshooting](troubleshooting.md).
