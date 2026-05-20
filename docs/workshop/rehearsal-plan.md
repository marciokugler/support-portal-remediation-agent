# Rehearsal Plan

This page assumes you have about four hours until the workshop.

The goal is not to perfect every optional path. The goal is to reduce risk in the core story.

## Hour 1: environment readiness

Target outcome:

- dependencies installed
- `.env` prepared
- collector optional decision made
- app stack starts cleanly

Checklist:

1. verify Node, Python, Docker
2. populate `.env`
3. run `npm install`
4. create the remediation agent virtual environment
5. start `npm run dev:all`
6. confirm frontend and operator console load

## Hour 2: technical validation

Target outcome:

- baseline healthy flow proven
- deterministic incident trigger proven
- remediation path proven

Checklist:

1. run all three business transactions in healthy mode
2. trigger the latency scenario
3. re-run `Customer Support Response`
4. confirm the other two remain healthy
5. step through the operator console
6. approve and validate recovery

If collector telemetry matters for your talk, validate that in this hour as well.

## Hour 3: presenter rehearsal

Target outcome:

- clear narration
- no handoff confusion
- consistent slide-to-demo transitions

Checklist:

1. rehearse the baseline explanation
2. rehearse the incident trigger
3. rehearse the evidence-to-action explanation
4. rehearse the approval and validation explanation
5. rehearse the close on governance and trust

## Hour 4: stabilization

Target outcome:

- known-good terminals
- browser windows arranged
- fallback path ready

Checklist:

1. restart only if necessary
2. clear stale browser tabs
3. keep one terminal on app logs
4. keep another terminal on collector logs if telemetry is part of the rehearsal
5. bookmark the fallback story if live signals drift

## Final 15-minute checklist

Right before the workshop:

1. verify the frontend loads
2. verify the operator console loads
3. verify one healthy support response works
4. verify the scenario can still be triggered
5. verify the presenter knows the fallback narrative

## What not to spend time on

Avoid last-minute detours into:

- design polish
- non-critical refactors
- changing default ports
- rewriting telemetry strategy
- adding new demo scope

The workshop succeeds if the story is clear and the core flow is repeatable.
