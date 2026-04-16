# Splunk Objects

## Dashboards to Provision as Code

- Executive Story
- Business Transactions
- Digital Experience
- Service Health
- Remediation
- AI Agent Monitoring companion dashboard

## Detectors to Provision as Code

- Customer Support Response Latency
- Customer Support Response Error Rate
- Knowledge Service Latency
- Remediation Validation Failed
- Remediation Duration Too Long

## Manual or Tenant-Validation Candidates

- business transaction rules
- endpoint grouping rules
- operation grouping rules
- session replay tenant configuration

## Provisioning Direction

Use Terraform first for dashboards, dashboard groups, and detectors.
If a required object cannot be expressed cleanly with the provider, add a focused script or document the manual pre-flight step.

