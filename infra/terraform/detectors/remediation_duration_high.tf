resource "signalfx_detector" "remediation_duration_high" {
  name = "IBOBS Remediation Duration High"

  program_text = <<-EOF
    A = data('remediation_duration_ms', filter=filter('deployment.environment', var.deployment_environment)).mean().publish(label='A')
    detect(when(A > var.remediation_duration_threshold_ms, lasting='5m')).publish('Remediation Duration High')
  EOF
}
