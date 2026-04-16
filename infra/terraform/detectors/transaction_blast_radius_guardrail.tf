resource "signalfx_detector" "transaction_blast_radius_guardrail" {
  name = "IBOBS Blast Radius Guardrail"

  program_text = <<-EOF
    A = data('affected_transactions_count', filter=filter('deployment.environment', var.deployment_environment)).max().publish(label='A')
    detect(when(A > var.max_affected_transactions, lasting='2m')).publish('Blast Radius Expanded')
  EOF
}
