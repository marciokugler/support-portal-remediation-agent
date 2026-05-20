# Prepare workshop run-through

| Field | Value |
|-------|-------|
| Thread ID | `019e27c9-9bfb-7aa2-8588-376fe4f906b2` |
| Started | 2026-05-14T18:39:44.648Z |
| Workspace | `/Users/mkuglerr/code2/codex_projects/ciscolive26` |
| Source file | `/Users/mkuglerr/.codex/sessions/2026/05/14/rollout-2026-05-14T15-39-44-019e27c9-9bfb-7aa2-8588-376fe4f906b2.jsonl` |

> Exported from Codex Desktop for Cursor. Reference with `@codex-archive/...` in chat.

## Tools used (summary)

- `exec_command` (2026-05-14T18:40:22)
- `exec_command` (2026-05-14T18:40:22)
- `exec_command` (2026-05-14T18:40:30)
- `exec_command` (2026-05-14T18:40:30)
- `exec_command` (2026-05-14T18:40:30)
- `exec_command` (2026-05-14T18:40:30)
- `exec_command` (2026-05-14T18:40:39)
- `exec_command` (2026-05-14T18:40:39)
- `exec_command` (2026-05-14T18:40:39)
- `exec_command` (2026-05-14T18:40:39)
- `exec_command` (2026-05-14T19:28:05)
- `exec_command` (2026-05-14T19:28:05)
- `exec_command` (2026-05-14T19:28:05)
- `exec_command` (2026-05-14T19:28:05)

## Conversation

### User — 2026-05-14 18:40:13

i have a practice session with my co presenter. Can you please tell me how we can run through the workshop and explain to them? don't overcomplicate

### User — 2026-05-14 18:40:13

i have a practice session with my co presenter. Can you please tell me how we can run through the workshop and explain to them? don't overcomplicate

### Assistant (commentary) — 2026-05-14 18:40:22

I’ll quickly look at the workspace structure so the run-through advice matches the actual workshop materials instead of staying generic.

### Assistant (commentary) — 2026-05-14 18:40:30

I found dedicated workshop and rehearsal docs. I’ll pull the session outline, speaker notes, and rehearsal plan, then give you a simple co-presenter run-through.

### Assistant (commentary) — 2026-05-14 18:40:39

The materials are already organized around a simple incident-room story: customer impact first, evidence next, governed action last. I’m checking the startup notes so the rehearsal plan includes only the commands and screens that matter.

### Assistant — 2026-05-14 18:41:00

Use the practice session as a simple story rehearsal, not a deep technical review.

**Core Story**

Tell your co-presenter:

> “We are running this like an incident room. First we show the customer experience breaking, then we show the evidence, then we show how an AI remediation flow can act only with guardrails, approval, and validation.”

**Run-Through Plan**

1. **Align on roles**
   - You: incident commander / customer impact.
   - Co-presenter: AI operations / governance / trust boundaries.

2. **Start with the healthy app**
   - Open frontend: `http://127.0.0.1:5173`
   - Open operator console: `http://127.0.0.1:5174`
   - Run the three transactions:
     - `Customer Support Response`
     - `Case Status Lookup`
     - `Knowledge Article Search`

3. **Trigger the incident**
   - Use scenario controls to trigger the latency/degradation scenario.
   - Re-run `Customer Support Response`.
   - Show that this workflow is degraded, while the others remain healthy.

4. **Move to evidence**
   - Go to the operator console.
   - Explain: “Now we move from symptoms to structured evidence.”
   - If needed, paste the AI Assistant / Troubleshooting Agent summary.
   - Show enrichment, blast radius, policy mode, and recommendation.

5. **Show governed remediation**
   - The remediation agent proposes a bounded action, likely disabling the feature flag.
   - Co-presenter explains: “This is not autonomous everything. This is controlled action with approval.”
   - Approve the action.

6. **Validate recovery**
   - Re-run the degraded transaction.
   - Confirm latency/errors recover.
   - End with: “The story finishes on validation and auditability, not just recommendation.”

**Simple Handoff Script**

You:

> “The customer sees the problem first. Let’s look at the experience before we look at the backend.”

Co-presenter:

> “Now that we have evidence, the important question is whether the system should recommend, request approval, or execute automatically.”

You:

> “For this scenario, approval required is the right default.”

Co-presenter:

> “The action is bounded, policy-checked, approved, and then validated.”

**Do Not Overdo**

Avoid deep architecture unless asked. Do not imply Splunk directly controls the external remediation agent. Do not call it fully autonomous. Do not skip the final recovery validation.

Reference docs are here: [rehearsal-plan.md](/Users/mkuglerr/code2/codex_projects/ciscolive26/docs/workshop/rehearsal-plan.md) and [live-demo-flow.md](/Users/mkuglerr/code2/codex_projects/ciscolive26/docs/workshop/live-demo-flow.md).

### User — 2026-05-14 19:27:51

how can we demo splunk in this scenario?

### User — 2026-05-14 19:27:51

how can we demo splunk in this scenario?

### Assistant (commentary) — 2026-05-14 19:28:05

I’ll keep this grounded in your existing demo rather than turning it into a Splunk product tour. I’m checking the Splunk-specific runbook and object docs so the sequence matches what’s already provisioned.

### Assistant — 2026-05-14 19:28:27

Demo Splunk as the **evidence layer**.

The simple message is:

> “Splunk shows us what the customer experienced, what transaction degraded, what service path is involved, and whether recovery actually happened. The remediation agent acts separately, but Splunk gives us the evidence and validation.”

**Use This Demo Flow**

1. **Start in the customer app**
   - Run the three workflows:
     - `Customer Support Response`
     - `Case Status Lookup`
     - `Knowledge Article Search`
   - Say: “Everything is healthy, and we have three distinct business transactions.”

2. **Go to Splunk Digital Experience / RUM**
   - Show the healthy browser experience.
   - After triggering the fault, show latency, failed interactions, or session impact.
   - Say: “We start from what the customer felt, not from backend guesses.”

3. **Show Business Transactions**
   - Show that `Customer Support Response` is degraded.
   - Show the other two workflows are still healthy.
   - Say: “The whole app is not broken. One customer journey is unhealthy.”

4. **Show APM / Service Health**
   - Move from transaction health into backend services.
   - Point to the affected path: frontend → API gateway → assistant service → knowledge service.
   - Say: “Splunk helps us narrow the blast radius and identify the likely dependency path.”

5. **Use Splunk AI Assistant / Troubleshooting Agent**
   - Have it summarize the incident evidence.
   - Keep this simple:
     - affected transaction
     - likely service
     - latency/error signal
     - recent change or feature flag
     - suggested remediation direction
   - Say: “This gives the operator a concise evidence package.”

6. **Move to the operator console**
   - Paste or reference the Splunk AI summary.
   - Show the orchestrator turning that into structured evidence.
   - Say: “Splunk provides the evidence. The remediation path applies policy and approval.”

7. **Approve remediation**
   - Show the proposed bounded action, for example disabling the feature flag.
   - Say: “This is approval-required, not blind automation.”

8. **Return to Splunk for validation**
   - Show latency/error recovery in Splunk.
   - Show the affected transaction returning to normal.
   - Say: “We do not end at recommendation. We validate recovery.”

**Tabs To Prepare**

Keep only these Splunk views ready:

- Digital Experience / RUM
- Business Transactions dashboard
- Service Health / APM service map
- Remediation Operations dashboard
- Optional: AI Agent Monitoring, if available and working

**Best One-Line Framing**

> “In this workshop, Splunk is how we prove impact, cause, blast radius, and recovery. The remediation agent is only allowed to act after that evidence is reviewed and governed.”
