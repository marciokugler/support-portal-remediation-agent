import { BUSINESS_TRANSACTIONS } from "@ibobs/shared-types";
import { appVersion, deploymentEnvironment, serviceNamespace } from "./config";

export const businessTransactionLabels = {
  [BUSINESS_TRANSACTIONS.customerSupportResponse]: "Customer Support Response",
  [BUSINESS_TRANSACTIONS.caseStatusLookup]: "Case Status Lookup",
  [BUSINESS_TRANSACTIONS.knowledgeArticleSearch]: "Knowledge Article Search"
};

export function buildTelemetryAttributes(transaction: keyof typeof businessTransactionLabels | string) {
  return {
    "service.namespace": serviceNamespace,
    "deployment.environment": deploymentEnvironment,
    "service.version": appVersion,
    "app.version": appVersion,
    "app.business_transaction": transaction
  };
}

export * from "./node";
export * from "./splunk-node";
export * from "./logger";
export * from "./config";
