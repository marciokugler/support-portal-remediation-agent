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
