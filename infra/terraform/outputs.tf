output "dashboard_group" {
  value = {
    id   = signalfx_dashboard_group.ibobs_demo.id
    name = signalfx_dashboard_group.ibobs_demo.name
  }
}

output "dashboards" {
  value = {
    executive_story = {
      id   = signalfx_dashboard.executive_story.id
      name = signalfx_dashboard.executive_story.name
      url  = signalfx_dashboard.executive_story.url
    }
    business_transactions = {
      id   = signalfx_dashboard.business_transactions.id
      name = signalfx_dashboard.business_transactions.name
      url  = signalfx_dashboard.business_transactions.url
    }
    digital_experience = {
      id   = signalfx_dashboard.digital_experience.id
      name = signalfx_dashboard.digital_experience.name
      url  = signalfx_dashboard.digital_experience.url
    }
    service_health = {
      id   = signalfx_dashboard.service_health.id
      name = signalfx_dashboard.service_health.name
      url  = signalfx_dashboard.service_health.url
    }
    operator_remediation = {
      id   = signalfx_dashboard.operator_remediation.id
      name = signalfx_dashboard.operator_remediation.name
      url  = signalfx_dashboard.operator_remediation.url
    }
  }
}

output "detectors" {
  value = {
    customer_support_latency = {
      id   = signalfx_detector.customer_support_latency.id
      name = signalfx_detector.customer_support_latency.name
      url  = signalfx_detector.customer_support_latency.url
    }
    customer_support_errors = {
      id   = signalfx_detector.customer_support_errors.id
      name = signalfx_detector.customer_support_errors.name
      url  = signalfx_detector.customer_support_errors.url
    }
    knowledge_search_regression = {
      id   = signalfx_detector.knowledge_search_regression.id
      name = signalfx_detector.knowledge_search_regression.name
      url  = signalfx_detector.knowledge_search_regression.url
    }
    remediation_duration_high = {
      id   = signalfx_detector.remediation_duration_high.id
      name = signalfx_detector.remediation_duration_high.name
      url  = signalfx_detector.remediation_duration_high.url
    }
    remediation_validation_failed = {
      id   = signalfx_detector.remediation_validation_failed.id
      name = signalfx_detector.remediation_validation_failed.name
      url  = signalfx_detector.remediation_validation_failed.url
    }
    blast_radius_guardrail = {
      id   = signalfx_detector.transaction_blast_radius_guardrail.id
      name = signalfx_detector.transaction_blast_radius_guardrail.name
      url  = signalfx_detector.transaction_blast_radius_guardrail.url
    }
  }
}
