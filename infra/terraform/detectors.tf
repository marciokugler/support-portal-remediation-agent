resource "signalfx_detector" "support_knowledge_filesystem_pressure" {
  name = "IBOBS Support Knowledge Cache Filesystem Pressure"

  program_text = <<-EOF
    A = data('system.filesystem.utilization', filter=filter('deployment.environment', '${var.deployment_environment}') and filter('service.instance.id', '${var.instance}') and filter('mountpoint', '${var.cache_mountpoint}')).max().publish(label='Cache Filesystem Utilization')
    detect(when(A > ${var.filesystem_utilization_threshold}, lasting='2m')).publish('Support Knowledge Cache Filesystem Pressure')
  EOF

  rule {
    detect_label  = "Support Knowledge Cache Filesystem Pressure"
    severity      = "Critical"
    description   = "Out-of-the-box filesystem utilization is above the lab threshold for the support knowledge cache mount."
    runbook_url   = var.orchestrator_webhook_url
    notifications = local.detector_webhook_notifications
  }
}

resource "signalfx_detector" "support_knowledge_latency" {
  name = "IBOBS Support Knowledge APM Latency"

  program_text = <<-EOF
    A = data('service.request.duration.ns', filter=filter('deployment.environment', '${var.deployment_environment}') and filter('service.instance.id', '${var.instance}') and filter('sf_service', 'support-knowledge')).percentile(pct=95).publish(label='P95 Duration')
    detect(when(A > ${var.apm_latency_threshold_ns}, lasting='2m')).publish('Support Knowledge APM Latency')
  EOF

  rule {
    detect_label  = "Support Knowledge APM Latency"
    severity      = "Major"
    description   = "Splunk APM service request duration is elevated for the support-knowledge service."
    runbook_url   = var.orchestrator_webhook_url
    notifications = local.detector_webhook_notifications
  }
}

resource "signalfx_detector" "support_knowledge_error_rate" {
  name = "IBOBS Support Knowledge APM Error Rate"

  program_text = <<-EOF
    A = data('service.request', filter=filter('deployment.environment', '${var.deployment_environment}') and filter('service.instance.id', '${var.instance}') and filter('sf_service', 'support-knowledge') and filter('sf_error', 'true')).count()
    B = data('service.request', filter=filter('deployment.environment', '${var.deployment_environment}') and filter('service.instance.id', '${var.instance}') and filter('sf_service', 'support-knowledge')).count()
    C = (A / B).publish(label='Error Rate')
    detect(when(C > ${var.apm_error_threshold}, lasting='2m')).publish('Support Knowledge APM Error Rate')
  EOF

  rule {
    detect_label  = "Support Knowledge APM Error Rate"
    severity      = "Major"
    description   = "Splunk APM service request error rate is elevated for the support-knowledge service."
    runbook_url   = var.orchestrator_webhook_url
    notifications = local.detector_webhook_notifications
  }
}
