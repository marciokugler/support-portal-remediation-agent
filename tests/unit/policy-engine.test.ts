import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePolicy } from "../../packages/policy-engine/src/index.ts";
import {
  BLAST_RADIUS,
  BUSINESS_TRANSACTIONS,
  POLICY_MODES,
  type EvidenceBundle
} from "../../packages/shared-types/src/index.ts";

function buildEvidence(overrides?: Partial<EvidenceBundle>): EvidenceBundle {
  return {
    incidentId: "incident-123",
    scenarioId: "dependency-latency",
    detector: {
      detectorId: "det-1",
      detectorName: "Customer Support Response Latency",
      severity: "critical",
      triggeredAt: "2026-04-08T12:00:00Z",
      dimensions: { service: "support-portal-api", environment: "demo" }
    },
    browserExperience: {
      affectedSessions: 24,
      frustrationSignals: ["rage_click"],
      affectedJourney: BUSINESS_TRANSACTIONS.customerSupportResponse
    },
    serviceImpact: {
      affectedServices: ["support-portal-api"],
      suspectService: "support-knowledge",
      affectedTransactions: [BUSINESS_TRANSACTIONS.customerSupportResponse]
    },
    investigation: {
      likelyCause: "feature flag rollout",
      confidenceBand: "high",
      blastRadius: BLAST_RADIUS.medium
    },
    candidateActions: [],
    sourceNotes: {
      enrichmentApplied: false
    },
    ...overrides
  };
}

test("evaluatePolicy blocks automation when confidence is low", () => {
  const decision = evaluatePolicy(
    buildEvidence({
      investigation: {
        likelyCause: "uncertain evidence",
        confidenceBand: "low",
        blastRadius: BLAST_RADIUS.medium
      }
    })
  );

  assert.deepEqual(decision, {
    eligible: false,
    policyMode: POLICY_MODES.recommendOnly,
    reason: "Confidence is too low for automated remediation."
  });
});

test("evaluatePolicy keeps high blast radius incidents in recommendation-only mode", () => {
  const decision = evaluatePolicy(
    buildEvidence({
      investigation: {
        likelyCause: "cross-transaction impact",
        confidenceBand: "high",
        blastRadius: BLAST_RADIUS.high
      }
    })
  );

  assert.deepEqual(decision, {
    eligible: true,
    policyMode: POLICY_MODES.recommendOnly,
    reason: "High blast radius requires recommendation-only behavior."
  });
});

test("evaluatePolicy requires approval for normal customer-facing incidents", () => {
  const decision = evaluatePolicy(buildEvidence());

  assert.deepEqual(decision, {
    eligible: true,
    policyMode: POLICY_MODES.approvalRequired,
    reason: "Customer-facing production workflow requires approval before action."
  });
});
