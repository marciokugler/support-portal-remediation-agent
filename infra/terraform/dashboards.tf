resource "signalfx_dashboard" "business_transactions" {
  name            = "IBOBS Business Transactions"
  dashboard_group = signalfx_dashboard_group.ibobs_demo.id

  time_range = "-30m"

  chart {
    chart_id = signalfx_time_chart.transaction_latency.id
    width    = 12
    height   = 1
    row      = 0
    column   = 0
  }

  chart {
    chart_id = signalfx_time_chart.transaction_errors.id
    width    = 12
    height   = 1
    row      = 1
    column   = 0
  }
}

resource "signalfx_time_chart" "transaction_latency" {
  name = "Latency by Business Transaction"

  program_text = <<-EOF
    A = data('latency_latest_ms', filter=filter('deployment.environment', var.deployment_environment)).mean(by=['app.business_transaction']).publish(label='Latency')
  EOF
}

resource "signalfx_time_chart" "transaction_errors" {
  name = "Error Rate by Business Transaction"

  program_text = <<-EOF
    A = data('errors', filter=filter('deployment.environment', var.deployment_environment)).sum(by=['app.business_transaction'])
    B = data('requests', filter=filter('deployment.environment', var.deployment_environment)).sum(by=['app.business_transaction'])
    C = (A / B).publish(label='Error Rate')
  EOF
}

resource "signalfx_dashboard" "digital_experience" {
  name            = "IBOBS Digital Experience"
  dashboard_group = signalfx_dashboard_group.ibobs_demo.id

  time_range = "-30m"

  chart {
    chart_id = signalfx_single_value_chart.digital_affected_sessions.id
    width    = 3
    height   = 1
    row      = 0
    column   = 0
  }

  chart {
    chart_id = signalfx_time_chart.digital_journey_latency.id
    width    = 9
    height   = 1
    row      = 0
    column   = 3
  }

  chart {
    chart_id = signalfx_time_chart.digital_frustration_signals.id
    width    = 6
    height   = 1
    row      = 1
    column   = 0
  }

  chart {
    chart_id = signalfx_time_chart.session_replay_ready.id
    width    = 6
    height   = 1
    row      = 1
    column   = 6
  }
}

resource "signalfx_single_value_chart" "digital_affected_sessions" {
  name = "Affected Sessions"

  program_text = <<-EOF
    A = data('affected_sessions', filter=filter('deployment.environment', var.deployment_environment)).sum().publish(label='Affected Sessions')
  EOF
}

resource "signalfx_time_chart" "digital_journey_latency" {
  name = "Journey Latency by Business Transaction"

  program_text = <<-EOF
    A = data('latency_latest_ms', filter=filter('deployment.environment', var.deployment_environment)).mean(by=['app.business_transaction']).publish(label='Latency')
  EOF
}

resource "signalfx_time_chart" "digital_frustration_signals" {
  name = "DEA Frustration Signals"

  program_text = <<-EOF
    A = data('frustration_signals', filter=filter('deployment.environment', var.deployment_environment)).sum(by=['journey']).publish(label='Signals')
  EOF
}

resource "signalfx_time_chart" "session_replay_ready" {
  name = "Session Replay Candidates"

  program_text = <<-EOF
    A = data('session_replay_candidates', filter=filter('deployment.environment', var.deployment_environment)).sum(by=['app.business_transaction']).publish(label='Replay Candidates')
  EOF
}

resource "signalfx_dashboard" "executive_story" {
  name            = "IBOBS Executive Story"
  dashboard_group = signalfx_dashboard_group.ibobs_demo.id

  time_range = "-30m"

  chart {
    chart_id = signalfx_time_chart.customer_support_latency.id
    width    = 6
    height   = 1
    row      = 0
    column   = 0
  }

  chart {
    chart_id = signalfx_single_value_chart.affected_sessions.id
    width    = 6
    height   = 1
    row      = 0
    column   = 6
  }
}

resource "signalfx_time_chart" "customer_support_latency" {
  name = "Customer Support Response Latency"

  program_text = <<-EOF
    A = data('latency_latest_ms', filter=filter('app.business_transaction', 'customer_support_response')).mean().publish(label='Latency')
  EOF
}

resource "signalfx_single_value_chart" "affected_sessions" {
  name = "Affected Sessions"

  program_text = <<-EOF
    A = data('affected_sessions', filter=filter('deployment.environment', var.deployment_environment)).publish(label='Sessions')
  EOF
}

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

resource "signalfx_dashboard" "service_health" {
  name            = "IBOBS Service Health"
  dashboard_group = signalfx_dashboard_group.ibobs_demo.id

  time_range = "-30m"

  chart {
    chart_id = signalfx_time_chart.service_latency.id
    width    = 6
    height   = 1
    row      = 0
    column   = 0
  }

  chart {
    chart_id = signalfx_time_chart.service_errors.id
    width    = 6
    height   = 1
    row      = 0
    column   = 6
  }

  chart {
    chart_id = signalfx_time_chart.suspect_dependency.id
    width    = 12
    height   = 1
    row      = 1
    column   = 0
  }
}

resource "signalfx_time_chart" "service_latency" {
  name = "Latency by Service"

  program_text = <<-EOF
    A = data('latency_latest_ms', filter=filter('deployment.environment', var.deployment_environment)).mean(by=['service']).publish(label='Latency')
  EOF
}

resource "signalfx_time_chart" "service_errors" {
  name = "Errors by Service"

  program_text = <<-EOF
    A = data('errors', filter=filter('deployment.environment', var.deployment_environment)).sum(by=['service'])
    B = data('requests', filter=filter('deployment.environment', var.deployment_environment)).sum(by=['service'])
    C = (A / B).publish(label='Error Rate')
  EOF
}

resource "signalfx_time_chart" "suspect_dependency" {
  name = "Suspect Dependency"

  program_text = <<-EOF
    A = data('suspect_dependency_events', filter=filter('deployment.environment', var.deployment_environment)).sum(by=['suspect_service']).publish(label='Suspect Service')
  EOF
}
