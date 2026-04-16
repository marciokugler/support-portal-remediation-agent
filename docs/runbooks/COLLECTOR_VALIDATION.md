# Collector Validation

## Goal

Prove that traces and custom metrics leave the demo app through the Splunk Distribution of the OpenTelemetry Collector before checking Splunk UI visibility.

## Preconditions

1. Docker daemon is running.
2. `.env` contains:
   - `SPLUNK_ACCESS_TOKEN`
   - `SPLUNK_REALM`
   - `OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318`
   - `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`
3. Workspace dependencies and the remediation-agent virtual environment are installed.

## Start Order

1. Start the collector:
   ```bash
   npm run dev:collector
   ```
2. In another terminal, start the local app stack:
   ```bash
   npm run dev:all
   ```

## Generate Traffic

1. Open the frontend at `http://127.0.0.1:5173`.
2. Execute all three transactions at least once:
   - Customer Support Response
   - Case Status Lookup
   - Knowledge Article Search
3. Trigger `dependency-latency` from the frontend or operator console.
4. Re-run Customer Support Response to create degraded traffic.
5. Create an incident in the operator console and drive the remediation proposal flow.

## What To Look For In Collector Logs

The collector debug exporter should show:

- traces for:
  - `support-portal-api`
  - `support-assistant`
  - `support-knowledge`
  - `remediation-orchestrator`
  - `remediation-agent`
- custom metrics with names such as:
  - `latency`
  - `errors`
  - `affected_sessions`
  - `frustration_signals`
  - `session_replay_candidates`
  - `incident_opened`
  - `remediation_actions_proposed`
  - `remediation_duration_ms`

## If Metrics Do Not Appear

1. Confirm the app processes started with `.env` loaded.
2. Confirm the collector is listening on `4318`.
3. Confirm the app services log normal startup without telemetry initialization errors.
4. Reproduce traffic after the collector is already running.
5. If traces appear but metrics do not, inspect the business-transaction metric helper usage in:
   - `/Users/mkuglerr/code2/codex_projects/ciscolive26/packages/telemetry/src/metrics.ts`
   - `/Users/mkuglerr/code2/codex_projects/ciscolive26/apps/api-gateway/src/index.ts`
   - `/Users/mkuglerr/code2/codex_projects/ciscolive26/apps/assistant-service/src/index.ts`
   - `/Users/mkuglerr/code2/codex_projects/ciscolive26/apps/knowledge-service/src/index.ts`
   - `/Users/mkuglerr/code2/codex_projects/ciscolive26/apps/remediation-orchestrator/src/index.ts`

## After Collector Verification

Once the collector clearly shows the expected metrics and traces:

1. Query Splunk metric metadata again.
2. Re-test the impact enrichment adapter.
3. Apply Terraform objects and verify dashboard/detector wiring against live signals.
