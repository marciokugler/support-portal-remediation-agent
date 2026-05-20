# Draft abstract for .conf26

| Field | Value |
|-------|-------|
| Thread ID | `019d2029-8390-7fe2-a02a-0e9b95f941e9` |
| Started | 2026-03-24T14:04:44.819Z |
| Workspace | `/Users/mkuglerr/code2/codex_projects/ciscolive26` |
| Source file | `/Users/mkuglerr/.codex/sessions/2026/03/24/rollout-2026-03-24T11-04-44-019d2029-8390-7fe2-a02a-0e9b95f941e9.jsonl` |

> Exported from Codex Desktop for Cursor. Reference with `@codex-archive/...` in chat.

## Tools used (summary)

- `exec_command` (2026-03-24T14:05:10)
- `exec_command` (2026-03-24T14:05:10)
- `exec_command` (2026-03-24T14:05:10)
- `exec_command` (2026-03-24T14:05:25)
- `exec_command` (2026-03-24T14:05:25)
- `exec_command` (2026-03-24T14:05:25)
- `exec_command` (2026-03-24T14:05:34)
- `exec_command` (2026-03-24T14:05:34)
- `exec_command` (2026-03-24T14:05:34)
- `exec_command` (2026-03-24T14:05:46)
- `exec_command` (2026-03-24T14:05:46)
- `apply_patch` (2026-03-24T14:06:05)
- `exec_command` (2026-03-24T14:06:09)
- `exec_command` (2026-03-24T14:08:22)

## Conversation

### User — 2026-03-24 14:05:04

can we create a new abstract about this session to submit to .conf26

### User — 2026-03-24 14:05:04

can we create a new abstract about this session to submit to .conf26

### Assistant (commentary) — 2026-03-24 14:05:10

I’m going to inspect the workspace for the session content so I can draft a submission-ready abstract that matches what’s already here.

### Assistant (commentary) — 2026-03-24 14:05:25

I found the session materials in the repo; next I’m reading the outline and speaker notes to extract the core narrative and turn it into a conference-style abstract.

### Assistant (commentary) — 2026-03-24 14:05:34

I have the core positioning now. I’m checking whether there’s already a submission draft or conference-specific format in the repo before I write a new abstract.

### Assistant (commentary) — 2026-03-24 14:05:46

There’s already a note in the outline to produce a refreshed session abstract, so I’m pulling that context and then I’ll draft a submission version into the repo.

### Assistant (commentary) — 2026-03-24 14:05:56

I’m adding a new submission draft file with a primary abstract and a shorter backup version so you have something ready even if the form has a tighter word limit.

### Assistant (commentary) — 2026-03-24 14:06:08

The draft is in place. I’m doing a quick read-back for tone and length, then I’ll give you the clean submission text in the reply.

### Assistant — 2026-03-24 14:06:19

Yes. I created a submission draft at [CONF26_ABSTRACT.md](/Users/mkuglerr/code2/codex_projects/ciscolive26/CONF26_ABSTRACT.md).

Primary abstract:
AI is now part of the customer experience, which means AI failures are no longer isolated technical issues. They are customer trust issues. In this interactive session, we will show how Splunk Observability Cloud can help teams move from detecting a degraded digital experience to making a safe, governed remediation decision. Using an AI-powered support portal scenario, we begin with what the customer sees first: browser slowdown, failed interactions, and frustration visible through RUM, Digital Experience Analytics, and Session Replay. We then connect that experience to the affected business transaction and backend services, use AI-assisted investigation to assemble the evidence, and hand that context to a bounded remediation flow. The session focuses on the real challenge: not whether AI can suggest an action, but whether teams can trust, govern, observe, approve, execute, and validate that action in production. Attendees will leave with a practical model for human-in-the-loop AI remediation with clear guardrails and auditability.

I also included a 96-word backup version in the same file in case the form has a tighter limit. If you want, I can tune this next for a specific `.conf26` field like “abstract,” “session description,” or “why attend.”

### User — 2026-03-24 14:08:15

We need a 500 char version

### User — 2026-03-24 14:08:15

We need a 500 char version

### Assistant (commentary) — 2026-03-24 14:08:19

I’m compressing the abstract to fit a hard 500-character limit and verifying the character count exactly.

### Assistant — 2026-03-24 14:08:30

Use this:

See how Splunk Observability Cloud helps teams move from customer-impact detection to governed AI remediation. Using an AI support portal scenario, this interactive session starts with RUM, Digital Experience Analytics, and Session Replay, connects the issue to the affected business transaction and backend path, and shows how AI-assisted investigation, policy guardrails, human approval, and validation work together to make remediation observable, safe, and auditable.

`471 characters`

If you want, I can also give you:
- a tighter marketing version
- a more technical version
- an exactly `500`-character version

### User — 2026-03-24 14:18:44

If selected, what are 3 learnings an attendee will take away from your session? Each takeaway should be specific, actionable, and measurable.

### User — 2026-03-24 14:18:44

If selected, what are 3 learnings an attendee will take away from your session? Each takeaway should be specific, actionable, and measurable.

### Assistant — 2026-03-24 14:18:51

1. Attendees will be able to describe a repeatable incident flow that starts with customer-impact signals in RUM, Digital Experience Analytics, and Session Replay, then traces that impact to the affected business transaction and service path. They should leave able to map at least one degraded user journey to one backend workflow in their own environment.

2. Attendees will be able to distinguish AI-assisted investigation from AI-driven remediation and define where a human approval step belongs. They should leave able to classify at least three remediation actions in their environment as `recommend only`, `approval required`, or `auto-execute`.

3. Attendees will be able to identify the minimum evidence required to trust an AI remediation action in production. They should leave able to build a checklist containing at least these five elements: customer impact, blast radius, likely cause, policy status, and post-action validation.

### User — 2026-03-24 14:19:08

rewrite with 150 chars max for each response

### User — 2026-03-24 14:19:08

rewrite with 150 chars max for each response

### Assistant — 2026-03-24 14:19:15

1. Map a degraded user journey in RUM/DEA/Replay to one business transaction and one backend service path.

2. Classify 3 remediation actions as recommend-only, approval-required, or auto-execute.

3. Define a 5-point trust checklist: customer impact, blast radius, likely cause, policy status, validation.
