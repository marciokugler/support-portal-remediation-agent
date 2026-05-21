# Splunk Objects

## Dashboards to provision as code

- Executive Story
- APM Service Requests
- Digital Experience
- Service Health
- Remediation Operations
- AI Agent Monitoring companion views, when enabled in the tenant

## Detectors to provision as code

- Support Knowledge Cache Filesystem Pressure
- Support Knowledge APM Latency
- Support Knowledge APM Error Rate

## Signal source

Use default Splunk Observability signals:

- `system.filesystem.utilization`
- `service.request`
- `service.request.duration.ns`
- RUM and browser spans
- AI/remediation spans

## Provisioning direction

Use `infra/splunk/specs` for iterative dashboard and detector authoring. Use Terraform when you need managed state and controlled rollout.
