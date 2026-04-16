variable "splunk_access_token" {
  type      = string
  sensitive = true
}

variable "splunk_realm" {
  type    = string
  default = "us1"
}

variable "deployment_environment" {
  type    = string
  default = "demo"
}

variable "orchestrator_webhook_url" {
  type = string
}

variable "public_orchestrator_webhook_url" {
  type    = string
  default = ""
}

variable "enable_webhook_integration" {
  type    = bool
  default = false
}

variable "splunk_webhook_shared_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "existing_webhook_credential_id" {
  type    = string
  default = ""
}

variable "customer_support_latency_threshold_ms" {
  type    = number
  default = 1800
}

variable "customer_support_error_threshold" {
  type    = number
  default = 0.1
}

variable "knowledge_search_error_threshold" {
  type    = number
  default = 2
}

variable "remediation_duration_threshold_ms" {
  type    = number
  default = 120000
}

variable "max_affected_transactions" {
  type    = number
  default = 1
}
