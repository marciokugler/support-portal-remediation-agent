# Troubleshooting

This page is optimized for workshop-day failures.

## Symptom: `npm install` fails

Check:

- internet access or package registry access
- Node version compatibility
- whether a previous partial install left a corrupted `node_modules`

Action:

1. re-run `npm install`
2. if it still fails, capture the first real error, not the last cascade error
3. resolve that root issue before changing anything else

## Symptom: Python agent setup fails

Check:

- `python3 --version`
- virtual environment creation succeeded
- pip install failure message

Action:

```bash
cd apps/remediation-agent
rm -rf .venv
python3 -m venv .venv
.venv/bin/pip install -e .
```

Use caution with the delete step and only do it if you intend to recreate the virtual environment.

## Symptom: collector will not start

Check:

- Docker daemon is running
- `.env` has telemetry variables loaded
- port `4318` is free

Action:

1. run `docker info`
2. confirm `OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318`
3. restart `npm run dev:collector`

Then use [Collector Validation](../runbooks/COLLECTOR_VALIDATION.md).

## Symptom: frontend or operator console does not load

Check:

- `npm run dev:all` is still running
- Vite server did not fail due to a port conflict
- browser is pointed at the correct localhost URL

Action:

```bash
lsof -i :5173 -i :5174
```

If another process owns those ports, stop it or adjust your environment deliberately.

## Symptom: backend services are up, but the demo flow is inconsistent

Check:

- did you establish a healthy baseline first
- did you trigger the intended scenario only once
- is the operator console showing a stale incident from a previous run

Action:

1. reset the scenario state
2. refresh both UIs
3. run the three transactions again in healthy mode
4. re-trigger the scenario

## Symptom: the degraded transaction does not degrade

Check:

- whether the scenario toggle actually took effect
- whether you re-ran `Customer Support Response` after enabling the scenario
- whether you are accidentally exercising the healthy transactions instead

Action:

1. confirm the scenario controller state
2. re-run only `Customer Support Response`
3. observe whether latency or error behavior changes

## Symptom: telemetry is not visible in Splunk

Check locally first, not in the UI first.

Action:

1. confirm collector is running
2. confirm app processes started with `.env` loaded
3. generate fresh traffic only after the collector is already live
4. inspect collector output for traces and metrics

Use:

- [Collector Validation](../runbooks/COLLECTOR_VALIDATION.md)
- [Splunk API Integration](../architecture/SPLUNK_API_INTEGRATION.md)

## Symptom: optional webhook delivery does not work

This is not a core lab blocker. The primary workshop path is to copy the Splunk AI Assistant or Troubleshooting Agent summary and paste it into the operator console.

Check:

- whether the orchestrator works locally first
- whether `cloudflared` is running
- whether your public webhook URL is current
- whether any shared secret values match

Action:

1. prove local orchestrator behavior on `127.0.0.1`
2. start the tunnel
3. update webhook configuration only after the tunnel URL is stable
4. fall back to the copy/paste evidence path if tunnel setup is unstable

## Symptom: remediation recommendation or execution is missing

Check:

- evidence submission path
- policy mode result
- remediation agent availability on port `8000`

Action:

1. confirm the operator console submitted context
2. confirm the orchestrator built an evidence bundle
3. confirm the remediation agent is reachable

## Safe workshop fallback

If the full live path is unstable and time is running out:

1. keep the frontend and operator console up
2. demonstrate healthy versus degraded workflow behavior
3. narrate the intended enrichment and policy steps
4. use architecture and runbook pages to complete the story

That is better than improvising unsupported claims about automation.
