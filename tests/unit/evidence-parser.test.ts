import test from "node:test";
import assert from "node:assert/strict";
import { parseAssistantEvidence } from "../../packages/evidence-parser/src/index.ts";
import { ACTION_TYPES, BLAST_RADIUS, BUSINESS_TRANSACTIONS } from "../../packages/shared-types/src/index.ts";

test("parseAssistantEvidence extracts structured signals from assistant text", () => {
  const parsed = parseAssistantEvidence({
    source: "splunk_ai_assistant",
    rawText: `High confidence latency regression detected.
Business transaction: Customer Support Response
Blast radius: medium
Feature flag: support_knowledge_v2
Recent change: canary enabled for support_knowledge_v2
Release version: 2.1.0-canary`
  });

  assert.equal(parsed.inferredTransaction, BUSINESS_TRANSACTIONS.customerSupportResponse);
  assert.equal(parsed.confidenceBand, "high");
  assert.equal(parsed.blastRadius, BLAST_RADIUS.medium);
  assert.deepEqual(parsed.candidateActions, [ACTION_TYPES.disableFeatureFlag]);
  assert.match(parsed.likelyCause, /support_knowledge_v2/);
  assert.match(parsed.likelyCause, /2\.1\.0-canary/);
});

test("parseAssistantEvidence falls back to rollback plus disable flag when rollback is recommended", () => {
  const parsed = parseAssistantEvidence({
    source: "splunk_ai_assistant",
    rawText: "Rollback the canary for knowledge article search because the blast radius is high."
  });

  assert.equal(parsed.inferredTransaction, BUSINESS_TRANSACTIONS.knowledgeArticleSearch);
  assert.equal(parsed.blastRadius, BLAST_RADIUS.high);
  assert.deepEqual(parsed.candidateActions, [
    ACTION_TYPES.disableFeatureFlag,
    ACTION_TYPES.rollbackCanary
  ]);
});

test("parseAssistantEvidence defaults to customer support and medium confidence when evidence is sparse", () => {
  const parsed = parseAssistantEvidence({
    source: "splunk_ai_assistant",
    rawText: "Something is slow."
  });

  assert.equal(parsed.inferredTransaction, BUSINESS_TRANSACTIONS.customerSupportResponse);
  assert.equal(parsed.confidenceBand, "medium");
  assert.equal(parsed.blastRadius, BLAST_RADIUS.medium);
  assert.deepEqual(parsed.candidateActions, [ACTION_TYPES.disableFeatureFlag]);
});
