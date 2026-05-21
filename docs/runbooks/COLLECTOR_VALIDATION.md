# Collector Validation

## Goal

Prove that traces, APM service metrics, RUM data, and host filesystem metrics leave the demo app through the Splunk Distribution of the OpenTelemetry Collector before checking Splunk UI views.

## Preconditions

1. Docker daemon is running.
2. `.env` contains:
   - `SPLUNK_ACCESS_TOKEN`
   - `SPLUNK_REALM`
   - `INSTANCE`
   - `OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:14318`
   - `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`
3. Workspace dependencies and the remediation-agent virtual environment are installed.

## Start order

1. Start the collector:
   ```bash
   npm run dev:collector
   ```
2. In another terminal, start the app stack:
   ```bash
   npm run dev:all
   ```

## Generate traffic

1. Open the portal at `http://127.0.0.1:18080`.
2. Execute all three transactions:
   - AI Claim Status
   - Policy Coverage Lookup
   - Claims FAQ Search
3. Trigger `cache-disk-pressure`.
4. Re-run AI Claim Status.
5. Create an incident in the operator console and drive the remediation proposal flow.

## What to look for

APM services:

- `claims-portal-api`
- `claims-assistant`
- `claims-knowledge`
- `remediation-orchestrator`
- `remediation-agent`

Metrics:

- `service.request`
- `service.request.duration.ns`
- `system.filesystem.utilization`

Browser:

- RUM application for the claims portal, if `VITE_SPLUNK_RUM_TOKEN` is set
- browser spans with `app.business_transaction`

## If signals do not appear

1. Confirm app processes started with `.env` loaded.
2. Confirm the collector host port `14318` is available.
3. Confirm fresh traffic was generated after the collector was already running.
4. Confirm `INSTANCE` and `OTEL_RESOURCE_ATTRIBUTES` match the filter you are using in Splunk.
5. Confirm app services log normal startup without telemetry initialization errors.

## After collector verification

1. Check APM service views.
2. Check Infrastructure Monitoring filesystem utilization.
3. Render Splunk objects with `npm run splunk:render`.
4. Apply dashboards and detectors only after the live signals exist.
