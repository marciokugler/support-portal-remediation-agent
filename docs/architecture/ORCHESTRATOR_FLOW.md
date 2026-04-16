# Orchestrator Flow

## Purpose

The remediation orchestrator is the governance layer between Splunk investigation and automated action.

## Flow

1. Splunk detector fires on `Customer Support Response`.
2. Webhook hits `POST /webhooks/splunk/detector`.
3. Orchestrator opens an incident record.
4. Presenter investigates in Splunk and copies AI Assistant summary.
5. Summary is posted to `POST /remediation/context`.
6. Orchestrator parses narrative evidence.
7. Orchestrator enriches missing structured fields with targeted Splunk API lookups.
8. Orchestrator builds the final `EvidenceBundle`.
9. Policy engine determines whether the incident is eligible for remediation and which policy mode applies.
10. Remediation agent evaluates bounded actions.
11. Operator approves the action.
12. Action executes and recovery is verified.

## Why This Design

- visible human trust checkpoint
- clear boundary between evidence and action
- deterministic policy outside the LLM
- structured context added even when AI Assistant output is incomplete

