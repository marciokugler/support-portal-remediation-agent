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
