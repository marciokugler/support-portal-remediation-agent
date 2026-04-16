resource "signalfx_dashboard" "operator_remediation" {
  name            = "IBOBS Remediation Operations"
  dashboard_group = signalfx_dashboard_group.ibobs_demo.id

  time_range = "-30m"

  chart {
    chart_id = signalfx_time_chart.remediation_policy_modes.id
    width    = 6
    height   = 1
    row      = 0
    column   = 0
  }

  chart {
    chart_id = signalfx_time_chart.remediation_actions.id
    width    = 6
    height   = 1
    row      = 0
    column   = 6
  }

  chart {
    chart_id = signalfx_time_chart.remediation_duration.id
    width    = 6
    height   = 1
    row      = 1
    column   = 0
  }

  chart {
    chart_id = signalfx_time_chart.blast_radius_distribution.id
    width    = 6
    height   = 1
    row      = 1
    column   = 6
  }
}

resource "signalfx_time_chart" "remediation_policy_modes" {
  name = "Remediation Policy Mode Volume"

  program_text = <<-EOF
    A = data('remediation_policy_decisions', filter=filter('deployment.environment', var.deployment_environment)).sum(by=['policy_mode']).publish(label='Policy Decisions')
  EOF
}

resource "signalfx_time_chart" "remediation_actions" {
  name = "Remediation Actions Proposed"

  program_text = <<-EOF
    A = data('remediation_actions_proposed', filter=filter('deployment.environment', var.deployment_environment)).sum(by=['action.type']).publish(label='Actions')
  EOF
}

resource "signalfx_time_chart" "remediation_duration" {
  name = "Remediation Duration"

  program_text = <<-EOF
    A = data('remediation_duration_ms', filter=filter('deployment.environment', var.deployment_environment)).mean(by=['action.type']).publish(label='Duration')
  EOF
}

resource "signalfx_time_chart" "blast_radius_distribution" {
  name = "Blast Radius Distribution"

  program_text = <<-EOF
    A = data('incident_opened', filter=filter('deployment.environment', var.deployment_environment)).sum(by=['blast_radius']).publish(label='Incidents')
  EOF
}
