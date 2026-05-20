# Orchestrator Flow

## Purpose

The remediation orchestrator is the governance layer between Splunk investigation and automated action.

## Flow

1. Splunk detector fires on `Customer Support Response`.
2. Presenter investigates in Splunk and copies the AI Assistant or Troubleshooting Agent summary.
3. Operator pastes the summary into the operator console.
4. Operator clicks `Open Incident From Evidence`.
5. Operator console opens the incident through `POST /remediation/demo/incidents`.
6. Summary is posted to `POST /remediation/context`.
7. Orchestrator parses narrative evidence.
8. Orchestrator enriches missing structured fields with targeted Splunk API lookups.
9. Orchestrator builds the final `EvidenceBundle`.
10. Policy engine determines whether the incident is eligible for remediation and which policy mode applies.
11. Remediation agent evaluates bounded actions.
12. Operator approves the action.
13. Action executes and recovery is verified.

The live detector webhook endpoint, `POST /webhooks/splunk/detector`, remains available as an optional automation path. The core lab does not depend on it.

## Why This Design

- visible human trust checkpoint
- clear boundary between evidence and action
- deterministic policy outside the LLM
- structured context added even when AI Assistant output is incomplete
