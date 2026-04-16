resource "signalfx_detector" "knowledge_search_regression" {
  name = "IBOBS Knowledge Article Search Error Guardrail"

  program_text = <<-EOF
    A = data('errors', filter=filter('app.business_transaction', 'knowledge_article_search')).sum().publish(label='A')
    detect(when(A > var.knowledge_search_error_threshold, lasting='3m')).publish('Knowledge Article Search Errors')
  EOF
}
