import test from "node:test";
import assert from "node:assert/strict";
import { parseAssistantEvidence } from "../../packages/evidence-parser/src/index.ts";
import { ACTION_TYPES, BUSINESS_TRANSACTIONS } from "../../packages/shared-types/src/index.ts";

test("parseAssistantEvidence extracts cache pressure remediation signals", () => {
  const parsed = parseAssistantEvidence({
    source: "splunk_ai_assistant",
    rawText: `High confidence latency regression detected.
Business transaction: AI Claim Status
Service: claims-knowledge
Disk utilization: cache mount above 90 percent
Latency evidence: claims-knowledge p90 latency is elevated
Recommended action: clean_claims_knowledge_cache.`
  });

  assert.equal(parsed.inferredTransaction, BUSINESS_TRANSACTIONS.customerSupportResponse);
  assert.equal(parsed.confidenceBand, "high");
  assert.deepEqual(parsed.candidateActions, [ACTION_TYPES.cleanServiceCache]);
  assert.match(parsed.likelyCause, /cache mount/);
  assert.match(parsed.likelyCause, /claims-knowledge/);
});

test("parseAssistantEvidence includes restart only when it is explicitly recommended", () => {
  const parsed = parseAssistantEvidence({
    source: "splunk_ai_assistant",
    rawText: "High confidence service pressure on claims-knowledge. Restart the service only if cache cleanup fails."
  });

  assert.equal(parsed.inferredTransaction, BUSINESS_TRANSACTIONS.customerSupportResponse);
  assert.deepEqual(parsed.candidateActions, [
    ACTION_TYPES.cleanServiceCache,
    ACTION_TYPES.restartService
  ]);
});

test("parseAssistantEvidence defaults to cache cleanup and medium confidence when evidence is sparse", () => {
  const parsed = parseAssistantEvidence({
    source: "splunk_ai_assistant",
    rawText: "Something is slow."
  });

  assert.equal(parsed.inferredTransaction, BUSINESS_TRANSACTIONS.customerSupportResponse);
  assert.equal(parsed.confidenceBand, "medium");
  assert.deepEqual(parsed.candidateActions, [ACTION_TYPES.cleanServiceCache]);
});

test("parseAssistantEvidence accepts legacy support aliases but returns claims identifiers", () => {
  const parsed = parseAssistantEvidence({
    source: "splunk_ai_assistant",
    rawText: `Business transaction: customer_support_response
Service: support-knowledge
Recommended action: clean_service_cache.`
  });

  assert.equal(parsed.inferredTransaction, BUSINESS_TRANSACTIONS.customerSupportResponse);
  assert.equal(parsed.confidenceBand, "high");
  assert.deepEqual(parsed.candidateActions, [ACTION_TYPES.cleanServiceCache]);
});
