import { metrics, type Counter, type Histogram, type ObservableGauge } from "@opentelemetry/api";
import type { BlastRadius, PolicyMode } from "@ibobs/shared-types";

type Attrs = Record<string, string | number | boolean>;

type Instruments = {
  latencyHistogram: Histogram;
  latestLatencyGauge: ObservableGauge;
  requestCounter: Counter;
  errorCounter: Counter;
  affectedSessionsCounter: Counter;
  frustrationSignalsCounter: Counter;
  sessionReplayCandidatesCounter: Counter;
  remediationPolicyDecisionsCounter: Counter;
  remediationActionsProposedCounter: Counter;
  remediationDurationHistogram: Histogram;
  incidentOpenedCounter: Counter;
  suspectDependencyCounter: Counter;
  affectedTransactionsHistogram: Histogram;
  validationFailedCounter: Counter;
};

let instruments: Instruments | undefined;
const latestLatencyByAttrs = new Map<string, { attributes: Attrs; value: number }>();

function normalizeAttrs(attributes: Attrs): Attrs {
  const normalized = { ...attributes };
  const service = typeof normalized.service === "string" ? normalized.service : undefined;
  const serviceName = typeof normalized["service.name"] === "string" ? normalized["service.name"] : undefined;

  if (serviceName && !service) {
    normalized.service = serviceName;
  }

  for (const resourceBackedKey of [
    "service.name",
    "service.namespace",
    "deployment.environment",
    "service.version",
    "app.version"
  ]) {
    delete normalized[resourceBackedKey];
  }

  return normalized;
}

function attrsKey(attributes: Attrs) {
  const normalized = normalizeAttrs(attributes);
  return JSON.stringify(
    Object.entries(normalized)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, String(value)])
  );
}

function getInstruments(): Instruments {
  if (instruments) {
    return instruments;
  }

  const meter = metrics.getMeter("ibobs-demo");

  instruments = {
    latencyHistogram: meter.createHistogram("latency", {
      description: "Business transaction latency in milliseconds",
      unit: "ms"
    }),
    latestLatencyGauge: meter.createObservableGauge("latency_latest_ms", {
      description: "Latest observed business transaction latency in milliseconds",
      unit: "ms"
    }),
    requestCounter: meter.createCounter("requests", {
      description: "Business transaction requests"
    }),
    errorCounter: meter.createCounter("errors", {
      description: "Business transaction errors"
    }),
    affectedSessionsCounter: meter.createCounter("affected_sessions", {
      description: "Affected user sessions from RUM or DEA"
    }),
    frustrationSignalsCounter: meter.createCounter("frustration_signals", {
      description: "DEA frustration signals associated with a journey"
    }),
    sessionReplayCandidatesCounter: meter.createCounter("session_replay_candidates", {
      description: "Sessions flagged as replay candidates"
    }),
    remediationPolicyDecisionsCounter: meter.createCounter("remediation_policy_decisions", {
      description: "Remediation policy decisions by mode"
    }),
    remediationActionsProposedCounter: meter.createCounter("remediation_actions_proposed", {
      description: "Proposed remediation actions"
    }),
    remediationDurationHistogram: meter.createHistogram("remediation_duration_ms", {
      description: "Remediation execution and verification duration in milliseconds",
      unit: "ms"
    }),
    incidentOpenedCounter: meter.createCounter("incident_opened", {
      description: "Incidents opened by the orchestrator"
    }),
    suspectDependencyCounter: meter.createCounter("suspect_dependency_events", {
      description: "Events attributed to a suspect downstream service"
    }),
    affectedTransactionsHistogram: meter.createHistogram("affected_transactions_count", {
      description: "Number of affected business transactions per incident"
    }),
    validationFailedCounter: meter.createCounter("validation_failed", {
      description: "Failed remediation validations"
    })
  };

  instruments.latestLatencyGauge.addCallback((result) => {
    for (const entry of latestLatencyByAttrs.values()) {
      result.observe(entry.value, entry.attributes);
    }
  });

  return instruments;
}

export function recordLatency(durationMs: number, attributes: Attrs) {
  const normalized = normalizeAttrs(attributes);
  getInstruments().latencyHistogram.record(durationMs, normalized);
  latestLatencyByAttrs.set(attrsKey(attributes), {
    attributes: normalized,
    value: durationMs
  });
}

export function recordRequest(attributes: Attrs, count = 1) {
  getInstruments().requestCounter.add(count, normalizeAttrs(attributes));
}

export function recordError(attributes: Attrs, count = 1) {
  getInstruments().errorCounter.add(count, normalizeAttrs(attributes));
}

export function recordAffectedSessions(count: number, attributes: Attrs) {
  getInstruments().affectedSessionsCounter.add(count, normalizeAttrs(attributes));
}

export function recordFrustrationSignals(count: number, attributes: Attrs) {
  getInstruments().frustrationSignalsCounter.add(count, normalizeAttrs(attributes));
}

export function recordSessionReplayCandidate(attributes: Attrs, count = 1) {
  getInstruments().sessionReplayCandidatesCounter.add(count, normalizeAttrs(attributes));
}

export function recordPolicyDecision(policyMode: PolicyMode, attributes: Attrs) {
  getInstruments().remediationPolicyDecisionsCounter.add(1, {
    ...normalizeAttrs(attributes),
    policy_mode: policyMode
  });
}

export function recordActionProposed(actionType: string, attributes: Attrs) {
  getInstruments().remediationActionsProposedCounter.add(1, {
    ...normalizeAttrs(attributes),
    "action.type": actionType
  });
}

export function recordRemediationDuration(durationMs: number, attributes: Attrs) {
  getInstruments().remediationDurationHistogram.record(durationMs, normalizeAttrs(attributes));
}

export function recordIncidentOpened(blastRadius: BlastRadius, attributes: Attrs) {
  getInstruments().incidentOpenedCounter.add(1, {
    ...normalizeAttrs(attributes),
    blast_radius: blastRadius
  });
}

export function recordAffectedTransactionsCount(count: number, attributes: Attrs) {
  getInstruments().affectedTransactionsHistogram.record(count, normalizeAttrs(attributes));
}

export function recordSuspectDependency(suspectService: string, attributes: Attrs) {
  getInstruments().suspectDependencyCounter.add(1, {
    ...normalizeAttrs(attributes),
    suspect_service: suspectService
  });
}

export function recordValidationFailed(attributes: Attrs, count = 1) {
  getInstruments().validationFailedCounter.add(count, normalizeAttrs(attributes));
}
