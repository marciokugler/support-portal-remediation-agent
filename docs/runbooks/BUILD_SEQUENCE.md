# Build Sequence

## Current Local Build Order

1. Install workspace dependencies with `npm install`.
2. Create the remediation-agent virtual environment and install it with `pip install -e .`.
3. Optionally copy `.env.example` to `.env`.
4. Start Docker so the local Splunk Collector can run.
5. Start the collector with `npm run dev:collector`.
6. Start the full stack with `npm run dev:all`.
7. Open the frontend and operator console.
8. Trigger a scenario from either UI.
9. Reproduce the incident in the frontend.
10. Use the operator console to create the incident, explain evidence, propose action, and approve it.

## Verification Order

1. Collector starts and accepts OTLP on `4318`.
2. Frontend loads.
3. API Gateway responds.
4. Scenario controller toggles state.
5. Collector logs show traces and custom metrics.
6. Webhook creates incident.
7. Evidence paste produces policy result.
8. Agent evaluation produces bounded action.
9. Approval executes and validates.
10. Terraform validates with `terraform -chdir=infra/terraform validate`.

## Remaining Integration Work

1. Wire tenant-specific Splunk API endpoints into the orchestrator.
2. Validate the custom metrics and events in Splunk after collector-based export.
3. Add richer frontend styling and demo-state views.
4. Provision and test Splunk objects against the target tenant.
