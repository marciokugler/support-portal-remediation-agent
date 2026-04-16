# Terraform Provisioning

This directory provisions the demo dashboards, dashboard group, and detectors for the Cisco Live app.

Terraform remains available for the currently deployed estate, but new dashboard and detector authoring should move through the spec-driven Python workflow in [infra/splunk](/Users/mkuglerr/code2/codex_projects/ciscolive26/infra/splunk/README.md).

## What It Creates

- dashboard group: `IBOBS 2002 Demo`
- dashboards:
  - executive story
  - business transactions
  - digital experience
  - service health
  - remediation operations
- detectors:
  - customer support latency
  - customer support errors
  - knowledge article search guardrail
  - remediation validation failed
  - remediation duration high
  - blast radius guardrail

## Required Variables

- `splunk_access_token`
- `orchestrator_webhook_url`

Optional:

- `splunk_realm`
- `deployment_environment`
- `public_orchestrator_webhook_url`
- `enable_webhook_integration`
- `existing_webhook_credential_id`
- threshold variables from [variables.tf](/Users/mkuglerr/code2/codex_projects/ciscolive26/infra/terraform/variables.tf)

## Example Usage

```bash
terraform -chdir=infra/terraform init
terraform -chdir=infra/terraform plan \
  -var="splunk_access_token=$SPLUNK_ACCESS_TOKEN" \
  -var="orchestrator_webhook_url=https://demo.example/webhooks/splunk/detector"
terraform -chdir=infra/terraform apply \
  -var="splunk_access_token=$SPLUNK_ACCESS_TOKEN" \
  -var="orchestrator_webhook_url=https://demo.example/webhooks/splunk/detector"
```

For this repo, the easier path is to keep the existing Splunk webhook integration ID in `.env` and update only the detector rules:

```bash
npm run terraform:webhook-plan
npm run terraform:webhook-apply
```

## Notes

- The metrics referenced in the dashboards and detectors are the target metric names for the app and orchestrator to emit.
- The webhook URL should point to the remediation orchestrator endpoint exposed to Splunk.
- A local URL like `http://127.0.0.1:4010/...` is acceptable for Terraform planning and detector runbook links, but it will not work for real Splunk webhook notifications because Splunk Cloud cannot call back into localhost.
- Use a public tunnel or externally reachable endpoint before wiring detector notifications directly to the orchestrator.
- When you expose the webhook publicly, set `SPLUNK_WEBHOOK_SHARED_SECRET` in the app and configure the same value in the eventual Splunk webhook integration headers or shared-secret field.
- Creating `signalfx_webhook_integration` objects requires an admin-capable Splunk token. With a standard token, keep `enable_webhook_integration=false` and only update detector runbook URLs.
- The repo-level wrapper scripts read `ORCHESTRATOR_PUBLIC_WEBHOOK_URL` and `SPLUNK_EXISTING_WEBHOOK_CREDENTIAL_ID` from `.env` so tunnel URL rotation is just an env change plus `npm run terraform:webhook-apply`.
- Run `terraform validate` before planning or applying.

## Current Status

The current root module has been applied successfully and manages:

- 1 dashboard group
- 5 dashboards
- 6 detectors
- 15 charts

These objects are now present in the target Splunk org and tracked in Terraform state.

## Repo Layout Note

The root module now relies on the split files under:

- `dashboard-groups/`
- `dashboards/`
- `detectors/`

The duplicate monolithic resource files were removed to avoid double-definition drift.
