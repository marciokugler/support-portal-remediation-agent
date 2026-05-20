# Live Demo Flow

This is the presenter script in operational form.

Use it during rehearsal and right before going on stage.

## Demo objective

Show a clear path from customer impact to governed remediation.

The audience should leave understanding five points:

1. customer experience is the first signal
2. only one business transaction is degraded
3. observability provides the evidence package
4. the remediation path is bounded and governed
5. recovery is validated and auditable

## Demo sequence

### 1. Set the baseline

Say:

> We start in a healthy state with three business transactions. Only one will degrade during the incident.

Show:

- the frontend in healthy state
- one successful run of each transaction

### 2. Frame the problem

Say:

> This is an AI-powered support portal. When it slows down, the customer sees the problem before the operators agree on the cause.

Show:

- `Customer Support Response`
- `Case Status Lookup`
- `Knowledge Article Search`

### 3. Trigger the fault

Activate the latency scenario from the scenario controls.

Then run `Customer Support Response` again.

Narrate:

> We are introducing a deterministic dependency or feature-flag-related degradation that affects the support response path.

### 4. Show the contained blast radius

Re-run:

- `Case Status Lookup`
- `Knowledge Article Search`

Narrate:

> The whole application is not broken. One workflow is unhealthy. Two are still healthy. That is what makes the incident realistic.

### 5. Move to the operator console

Show the incident handling interface.

Narrate:

> Now we move from symptoms to evidence. We copy the investigation summary from Splunk, paste it into the operator console, and the orchestrator builds a structured evidence bundle.

### 6. Paste the investigation summary

Use the human-in-the-loop copy/paste step as the primary lab flow:

1. copy the AI Assistant or Troubleshooting Agent summary from Splunk
2. paste it into `Paste Splunk AI Assistant Summary`
3. click `Open Incident From Evidence`

If Splunk AI Assistant is not available during rehearsal, use this fallback text:

```text
High confidence that support_knowledge_v2 degraded the Customer Support Response transaction.
Affected transaction: Customer Support Response.
Blast radius is medium because only one business transaction is materially affected.
Recent change: support_knowledge_v2 canary / feature flag.
Recommended action: disable_feature_flag.
```

Narrate:

> We keep a visible human trust checkpoint. Splunk provides the evidence, the operator carries it into the governed workflow, and the LLM is not directly taking arbitrary action in production.

### 7. Explain evidence enrichment

Show or describe:

- parsed narrative evidence
- enrichment from Splunk APIs or fallback data
- blast radius interpretation
- policy mode

Narrate:

> The orchestrator is the governance layer. It converts investigation context into structured evidence before the remediation agent is asked to act.

### 8. Show the proposed action

Expected demo direction:

- bounded action such as `disable_feature_flag`
- approval required policy mode

Narrate:

> This is not autonomous everything. It is bounded automation with explicit scope and approval.

### 9. Approve and execute

Approve the action in the operator console.

Narrate:

> The action executes only after policy and approval allow it.

### 10. Validate recovery

Re-run the degraded transaction and show it has recovered.

Narrate:

> The workshop ends on validation, not on recommendation. If you cannot verify recovery, the remediation story is incomplete.

### 11. Close on auditability

Call out:

- recommendation
- approval state
- execution result
- recovery timestamps

Narrate:

> The real value is not only that the system found a next step. It is that the step was explainable, bounded, approved, executed, and verified.

## Presenter pitfalls to avoid

- do not start with backend internals before showing user impact
- do not imply Splunk directly invokes an arbitrary external agent
- do not describe the flow as fully autonomous
- do not let the two healthy transactions disappear from the story
- do not skip the recovery validation step

## If the live demo misbehaves

Fall back to this structure:

1. show baseline
2. explain the intended degraded path
3. show the operator console state you do have
4. explain the bounded action and guardrails
5. close on architecture and trust

That preserves the message even if a live signal is incomplete.
