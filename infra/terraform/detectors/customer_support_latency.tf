resource "signalfx_detector" "customer_support_latency" {
  name = "IBOBS Customer Support Response Latency"

  program_text = <<-EOF
    A = data('latency_latest_ms', filter=filter('app.business_transaction', 'customer_support_response') and filter('service', 'support-portal-api') and filter('deployment.environment', var.deployment_environment)).max().publish(label='A')
    detect(when(A > var.customer_support_latency_threshold_ms, lasting='30s')).publish('Customer Support Response Latency')
  EOF
}
