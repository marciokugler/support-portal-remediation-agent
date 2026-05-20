# Prerequisites

This page is the pre-flight checklist. Use it before you start debugging application code. Most same-day workshop failures are environment failures, not repo failures.

## Required software

### Node.js and npm

The repo uses npm workspaces and Vite-based frontend apps.

Verify:

```bash
node --version
npm --version
```

Expected result:

- `node` resolves successfully
- `npm` resolves successfully

If either command fails, install a current Node.js release first.

### Python 3

The remediation agent and some Splunk helper scripts use Python.

Verify:

```bash
python3 --version
```

Expected result:

- Python 3 is available

### Docker

The local collector is started with Docker Compose.

Verify:

```bash
docker --version
docker info
```

Expected result:

- Docker CLI is installed
- Docker daemon is running

If `docker info` fails, start Docker Desktop before continuing.

### Optional advanced path: cloudflared

You only need this if you explicitly want Splunk to deliver detector webhooks into your local orchestrator through a public URL. The primary workshop flow uses copied Splunk evidence and does not require a tunnel.

Verify:

```bash
cloudflared --version
```

## Required credentials

### For a realistic workshop run

Recommended:

- `SPLUNK_ACCESS_TOKEN`
- `SPLUNK_REALM`
- `OPENAI_API_KEY`

Optional, depending on your intended demo:

- `SPLUNK_HEC_URL`
- `SPLUNK_HEC_TOKEN`
- `SPLUNK_HEC_INDEX`
- `VITE_SPLUNK_RUM_TOKEN`
- `ORCHESTRATOR_PUBLIC_WEBHOOK_URL`

### What happens if credentials are missing

- without Splunk credentials, the app can still run locally but telemetry export to Splunk will be absent
- without OpenAI credentials, the remediation agent may not perform its intended model-backed path
- without a public webhook URL, only the optional live detector-to-orchestrator webhook path is unavailable

## Required ports

The default local layout uses:

- `5173` frontend
- `5174` operator console
- `4000` API gateway
- `4004` scenario controller
- `4010` remediation orchestrator
- `8000` remediation agent
- `4318` OTLP HTTP collector

Check for collisions if anything refuses to start:

```bash
lsof -i :5173 -i :5174 -i :4000 -i :4004 -i :4010 -i :8000 -i :4318
```

## Required local files

Before the workshop, make sure these exist:

- repo checked out locally
- `.env` if you are using real credentials
- `apps/remediation-agent/.venv` after Python setup

## Recommended browser setup

Use a Chromium-based browser for the demo because it tends to align best with local frontend tooling, Playwright-based traffic generation, and RUM validation.

Recommended:

- keep one window for the frontend
- keep one window for the operator console
- keep one tab ready for any Splunk views you plan to show

## Recommended presenter terminal setup

Use at least two terminals:

1. collector terminal
2. app stack terminal

Optional extra terminals:

3. traffic simulation
4. ad hoc curl or debugging
5. optional tunnel, only if testing live webhook delivery

## Final go/no-go checklist

Do not start the workshop until all of the following are true:

- Node and npm work
- Python 3 works
- Docker is running
- repo dependencies are installed
- remediation agent virtual environment exists
- required credentials are available
- intended local ports are free
