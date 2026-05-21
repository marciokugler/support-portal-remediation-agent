# Orchestrator Flow

## Purpose

The remediation orchestrator is the governance layer between Splunk investigation and bounded action.

## Flow

1. Cache pressure degrades `AI Claim Status`.
2. Presenter investigates in Splunk using RUM, APM, and host filesystem signals.
3. Presenter copies the AI Assistant or Troubleshooting Agent summary.
4. Operator pastes the summary into the operator console.
5. Operator clicks `Open Incident From Evidence`.
6. Operator console opens the incident through `POST /remediation/demo/incidents`.
7. Summary is posted to `POST /remediation/context`.
8. Orchestrator parses narrative evidence.
9. Orchestrator enriches missing structured fields when Splunk API endpoints are configured.
10. Orchestrator builds the final `EvidenceBundle`.
11. Policy engine determines whether remediation is eligible and which policy mode applies.
12. Remediation agent evaluates bounded actions.
13. Operator approves `clean_claims_knowledge_cache`.
14. Action executes and recovery is verified.

The live detector webhook endpoint, `POST /webhooks/splunk/detector`, remains available as an optional automation path. The core lab does not depend on it.

## Why this design

- visible human trust checkpoint
- clear boundary between evidence and action
- deterministic policy outside the model
- bounded toolset for the agent
- validation after execution
