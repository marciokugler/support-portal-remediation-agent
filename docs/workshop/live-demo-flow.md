# Live Demo Flow

This is the presenter script in operational form.

## Demo objective

Show a clear path from customer impact to governed remediation using default Splunk Observability signals.

The audience should leave understanding five points:

1. customer experience is the first signal
2. APM shows which service is slow
3. host filesystem metrics explain the infrastructure condition
4. the remediation path is bounded and governed
5. recovery is validated and auditable

## Demo sequence

### 1. Set the baseline

Say:

> We start in a healthy state with three customer journeys. Only one will degrade during the incident.

Show:

- the support portal
- one successful run of each transaction

### 2. Explain the application side

Say:

> This portal is what a customer or support representative would use to get an AI-generated support answer, check a case, or search a knowledge base. A portal like this matters because customers do not see microservices. They see whether the support experience works.

Show:

- `Customer Support Response`
- `Case Status Lookup`
- `Knowledge Article Search`

### 3. Trigger the fault

Click `Trigger Cache Pressure`.

Then run `Customer Support Response` again.

Narrate:

> We are filling a bounded cache volume used by the support knowledge service. This creates real filesystem pressure in the lab environment and slows the support response path.

### 4. Show healthy comparison journeys

Re-run:

- `Case Status Lookup`
- `Knowledge Article Search`

Narrate:

> The whole application is not down. We have one degraded journey and two healthy comparison journeys. That helps operators avoid broad, risky remediation.

### 5. Move to Splunk Observability

Keep this simple for students:

- In RUM or Digital Experience, click the support portal application and look at the customer journey.
- In APM, click the service map or service list and find `support-knowledge`.
- In Infrastructure Monitoring, filter to the student `INSTANCE` and inspect filesystem utilization.

Narrate:

> We are not relying on logs or custom demo metrics. We are using the default signals students should expect in a real environment: browser experience, APM service health, and host filesystem metrics from the collector.

### 6. Ask Splunk AI Assistant for evidence

Use this prompt:

```text
Investigate the Customer Support Response transaction in the demo environment over the last 15 minutes.

Summarize the issue for an operations leader. Include:
- whether Customer Support Response is degraded
- the likely affected service
- the filesystem or disk signal visible for this student instance
- the APM evidence that supports the finding
- confidence level
- one narrow recommended remediation action

Keep the response concise enough to paste into the remediation console.
```

Fallback evidence if AI Assistant is unavailable:

```text
High confidence that support-knowledge cache filesystem pressure degraded the Customer Support Response transaction.
Host filesystem utilization for the student instance is above threshold, and APM shows elevated support-knowledge request duration.
Case Status Lookup and Knowledge Article Search remain healthy comparison journeys.
Recommended action: clean_service_cache.
```

### 7. Paste the evidence

In the operator console:

1. paste the summary into `Paste Splunk AI Assistant Summary`
2. click `Open Incident From Evidence`
3. review the evidence handoff and policy panels

Narrate:

> The orchestrator is the governance layer. It converts investigation context into structured evidence before the remediation agent is asked to act.

### 8. Explain the proposed action

Expected direction:

- confidence is high
- policy mode is approval required
- action is `clean_service_cache`

Narrate:

> This is not arbitrary automation. The agent has a bounded toolset, the policy check gates execution, and the operator approves before action.

### 9. Approve and execute

Click the approval button when it is enabled.

Narrate:

> Approval calls the remediation agent. In this lab, the action clears the support-knowledge cache pressure through the scenario controller.

### 10. Validate recovery

Re-run `Customer Support Response`.

Show:

- the portal response recovers
- the operator console validation panel updates
- Splunk APM and filesystem signals begin moving back toward normal

Narrate:

> The workshop ends on validation, not recommendation. If you cannot verify recovery, the remediation story is incomplete.

## Presenter pitfalls to avoid

- do not start with backend internals before showing customer impact
- do not imply Splunk directly invokes arbitrary external actions
- do not call the flow fully autonomous
- do not rely on logs for the main story
- do not mention custom demo metrics as the detector source
- do not skip recovery validation
