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
