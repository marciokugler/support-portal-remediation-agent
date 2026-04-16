import { BLAST_RADIUS, POLICY_MODES, type EvidenceBundle, type PolicyDecision } from "@ibobs/shared-types";

export function evaluatePolicy(evidence: EvidenceBundle): PolicyDecision {
  if (evidence.investigation.confidenceBand === "low") {
    return {
      eligible: false,
      policyMode: POLICY_MODES.recommendOnly,
      reason: "Confidence is too low for automated remediation."
    };
  }

  if (evidence.investigation.blastRadius === BLAST_RADIUS.high) {
    return {
      eligible: true,
      policyMode: POLICY_MODES.recommendOnly,
      reason: "High blast radius requires recommendation-only behavior."
    };
  }

  return {
    eligible: true,
    policyMode: POLICY_MODES.approvalRequired,
    reason: "Customer-facing production workflow requires approval before action."
  };
}

