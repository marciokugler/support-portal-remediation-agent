resource "signalfx_detector" "remediation_validation_failed" {
  name = "IBOBS Remediation Validation Failed"

  program_text = <<-EOF
    A = data('validation_failed', filter=filter('deployment.environment', var.deployment_environment)).publish(label='A')
    detect(when(A > 0, lasting='1m')).publish('Remediation Validation Failed')
  EOF
}

