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
