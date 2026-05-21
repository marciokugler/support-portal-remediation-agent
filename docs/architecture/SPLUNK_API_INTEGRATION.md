# Splunk API Integration

This document defines the tenant-specific values the remediation orchestrator expects when live Splunk enrichment is enabled.

## Environment variables

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

## Expected response shapes

The orchestrator does not require exact Splunk-native payloads. It looks for a small set of fields and falls back to demo defaults when they are absent.

### Detector / Change Context

Accepted fields:

- `recentChange`
- `recent_change`
- `event.recentChange`

### Impact / Digital Experience / APM

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

### Topology / Service Context

Accepted fields:

- `affectedServices`
- `services`
- `apm.affectedServices`
- `suspectService`
- `suspect_service`
- `apm.suspectService`
- `affectedTransactions`
- `transactions`

## Current behavior

When API enrichment succeeds:

- `evidence.sourceNotes.enrichmentApplied` becomes `true`
- `evidence.sourceNotes.apiEnrichmentSources` lists contributing endpoints
- `evidence.sourceNotes.enrichmentWarnings` contains partial failures

When API enrichment is unavailable:

- the orchestrator still produces a complete evidence bundle
- the evidence is marked as fallback/default data
- warnings remain visible in the operator console

## Signal strategy

The current lab intentionally does not query custom demo metrics from the orchestrator.

Use Splunk UI, detectors, and dashboards for default signals:

- APM service request metrics such as `service.request` and `service.request.duration.ns`
- host filesystem metrics such as `system.filesystem.utilization`
- RUM and browser spans for the support portal
- AI/remediation spans for agent visibility

The API integration remains a lightweight enrichment hook. It should enrich context, not become the source of truth for remediation execution.
