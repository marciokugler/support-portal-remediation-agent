resource "signalfx_detector" "customer_support_errors" {
  name = "IBOBS Customer Support Response Error Rate"

  program_text = <<-EOF
    A = data('errors', filter=filter('app.business_transaction', 'customer_support_response')).sum()
    B = data('requests', filter=filter('app.business_transaction', 'customer_support_response')).sum()
    C = (A / B).publish(label='A')
    detect(when(C > var.customer_support_error_threshold, lasting='5m')).publish('Customer Support Response Errors')
  EOF
}
