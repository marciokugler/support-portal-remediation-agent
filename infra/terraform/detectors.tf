resource "signalfx_detector" "customer_support_errors" {
  name = "IBOBS Customer Support Response Error Rate"

  program_text = <<-EOF
    A = data('errors', filter=filter('app.business_transaction', 'customer_support_response')).sum()
    B = data('requests', filter=filter('app.business_transaction', 'customer_support_response')).sum()
    C = (A / B).publish(label='A')
    detect(when(C > ${var.customer_support_error_threshold}, lasting='5m')).publish('Customer Support Response Errors')
  EOF

  rule {
    detect_label  = "Customer Support Response Errors"
    severity      = "Major"
    description   = "Customer Support Response error rate exceeded the allowed threshold."
    runbook_url   = var.orchestrator_webhook_url
    notifications = local.detector_webhook_notifications
  }
}

resource "signalfx_detector" "customer_support_latency" {
  name = "IBOBS Customer Support Response Latency"

  program_text = <<-EOF
    A = data('latency_latest_ms', filter=filter('app.business_transaction', 'customer_support_response') and filter('service', 'support-portal-api') and filter('deployment.environment', '${var.deployment_environment}')).max().publish(label='A')
    detect(when(A > ${var.customer_support_latency_threshold_ms}, lasting='30s')).publish('Customer Support Response Latency')
  EOF

  rule {
    detect_label  = "Customer Support Response Latency"
    severity      = "Critical"
    description   = "Customer Support Response latency exceeded the allowed threshold."
    runbook_url   = var.orchestrator_webhook_url
    notifications = local.detector_webhook_notifications
  }
}

resource "signalfx_detector" "knowledge_search_regression" {
  name = "IBOBS Knowledge Article Search Error Guardrail"

  program_text = <<-EOF
    A = data('errors', filter=filter('app.business_transaction', 'knowledge_article_search')).sum().publish(label='A')
    detect(when(A > ${var.knowledge_search_error_threshold}, lasting='3m')).publish('Knowledge Article Search Errors')
  EOF

  rule {
    detect_label = "Knowledge Article Search Errors"
    severity     = "Major"
    description  = "Knowledge Article Search errors indicate blast radius expanded beyond the primary workflow."
  }
}

resource "signalfx_detector" "remediation_duration_high" {
  name = "IBOBS Remediation Duration High"

  program_text = <<-EOF
    A = data('remediation_duration_ms', filter=filter('deployment.environment', '${var.deployment_environment}')).mean().publish(label='A')
    detect(when(A > ${var.remediation_duration_threshold_ms}, lasting='5m')).publish('Remediation Duration High')
  EOF

  rule {
    detect_label = "Remediation Duration High"
    severity     = "Major"
    description  = "Remediation execution or validation is taking too long."
  }
}

resource "signalfx_detector" "remediation_validation_failed" {
  name = "IBOBS Remediation Validation Failed"

  program_text = <<-EOF
    A = data('validation_failed', filter=filter('deployment.environment', '${var.deployment_environment}')).publish(label='A')
    detect(when(A > 0, lasting='1m')).publish('Remediation Validation Failed')
  EOF

  rule {
    detect_label = "Remediation Validation Failed"
    severity     = "Critical"
    description  = "A remediation action failed validation and requires operator review."
  }
}

resource "signalfx_detector" "transaction_blast_radius_guardrail" {
  name = "IBOBS Blast Radius Guardrail"

  program_text = <<-EOF
    A = data('affected_transactions_count', filter=filter('deployment.environment', '${var.deployment_environment}')).max().publish(label='A')
    detect(when(A > ${var.max_affected_transactions}, lasting='2m')).publish('Blast Radius Expanded')
  EOF

  rule {
    detect_label = "Blast Radius Expanded"
    severity     = "Major"
    description  = "More business transactions are impacted than expected for the demo scenario."
  }
}
