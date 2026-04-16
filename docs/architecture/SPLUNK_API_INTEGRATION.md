# Splunk API Integration

This document defines the tenant-specific values the remediation orchestrator expects when live Splunk enrichment is enabled.

## Environment Variables

- `SPLUNK_ACCESS_TOKEN`
- `SPLUNK_REALM`
- `SPLUNK_API_BASE_URL`
- `SPLUNK_DETECTOR_ENDPOINT_TEMPLATE`
- `SPLUNK_IMPACT_ENDPOINT_TEMPLATE`
- `SPLUNK_TOPOLOGY_ENDPOINT_TEMPLATE`

The endpoint templates support these placeholders:

- `{detectorId}`
- `{incidentId}`
- `{severity}`

## Expected Response Shapes

The orchestrator does not require exact Splunk-native payloads. It looks for a small set of fields and falls back to demo defaults when they are absent.

### Detector / Change Context

Accepted fields:

- `recentChange`
- `recent_change`
- `event.recentChange`

### Impact / Digital Experience

Accepted fields:

- `affectedSessions`
- `affected_sessions`
- `rum.affectedSessions`
- `p95LatencyMs`
- `latency.p95`
- `apm.p95LatencyMs`
- `errorRate`
- `error_rate`
- `apm.errorRate`
- `sessionReplayUrl`
- `session_replay_url`

### Topology / Blast Radius

Accepted fields:

- `affectedServices`
- `services`
- `apm.affectedServices`
- `suspectService`
- `suspect_service`
- `apm.suspectService`
- `affectedTransactions`
- `transactions`

## Current Behavior

When API enrichment succeeds:

- `evidence.sourceNotes.enrichmentApplied` becomes `true`
- `evidence.sourceNotes.apiEnrichmentSources` lists which endpoints contributed data
- `evidence.sourceNotes.enrichmentWarnings` contains any partial failures

When API enrichment is unavailable:

- the orchestrator still produces a complete evidence bundle
- the evidence is marked as fallback/default data
- warnings remain visible in the operator console

## Current Tenant-Proven Paths

Confirmed working against the current tenant:

- detector context:
  - `GET /v2/detector/{detectorId}`
- topology:
  - `POST /v2/apm/topology`
- metric metadata:
  - `GET /v2/metrictimeseries?query=sf_metric:<metric_name>`
- metric datapoints:
  - `GET /v1/timeserieswindow?query=...&startMs=...&endMs=...&resolution=...`

The orchestrator now uses metric metadata and datapoint queries as a secondary impact-enrichment path for:

- `affected_sessions`
- `frustration_signals`
- `session_replay_candidates`
- `incident_opened`
- `remediation_actions_proposed`
- `requests`
- `errors`
- `latency_latest_ms`

This path is now live for:

- `affectedSessions`
- `errorRate`
- `session replay candidate` presence
- `frustration signal` presence
- `current latency` via `latency_latest_ms`

Important note:

- the orchestrator still populates the `p95LatencyMs` field, but the current live source is `latency_latest_ms`
- this is good enough for the demo and operator workflow, but it is not a true percentile query yet
- if we want the field name and implementation to match exactly, we should either rename the field or add a percentile-specific query path later

## Recommended Tenant Mapping

Use the three endpoint templates for:

1. detector or incident context
2. digital experience or transaction impact
3. service topology or dependency analysis

This keeps the live demo readable while preserving a clean boundary between Splunk evidence and the remediation control plane.
