export const BUSINESS_TRANSACTIONS = {
  customerSupportResponse: "customer_support_response",
  caseStatusLookup: "case_status_lookup",
  knowledgeArticleSearch: "knowledge_article_search"
} as const;

export const ACTION_TYPES = {
  cleanServiceCache: "clean_service_cache",
  restartService: "restart_service"
} as const;

export const POLICY_MODES = {
  recommendOnly: "recommend_only",
  approvalRequired: "approval_required",
  autoExecute: "auto_execute"
} as const;

export type BusinessTransaction =
  (typeof BUSINESS_TRANSACTIONS)[keyof typeof BUSINESS_TRANSACTIONS];

export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES];
export type PolicyMode = (typeof POLICY_MODES)[keyof typeof POLICY_MODES];

export type BrowserExperienceSummary = {
  affectedSessions?: number;
  frustrationSignals: string[];
  sessionReplayUrl?: string;
  affectedJourney: BusinessTransaction;
};

export type DetectorContext = {
  detectorId: string;
  detectorName: string;
  severity: "info" | "warning" | "critical";
  triggeredAt: string;
  dimensions: Record<string, string>;
};

export type ServiceImpact = {
  affectedServices: string[];
  suspectService?: string;
  p95LatencyMs?: number;
  errorRate?: number;
  affectedTransactions: BusinessTransaction[];
};

export type InvestigationSummary = {
  likelyCause: string;
  recentChange?: string;
  confidenceBand: "low" | "medium" | "high";
};

export type AssistantEvidenceInput = {
  source: "splunk_ai_assistant" | "splunk_troubleshooting_agent";
  rawText?: string;
  assistantResponseText?: string;
  pastedBy?: string;
  pastedAt?: string;
  detectorId?: string;
  incidentId?: string;
};

export type EvidenceBundle = {
  incidentId: string;
  scenarioId: string;
  detector: DetectorContext;
  browserExperience: BrowserExperienceSummary;
  serviceImpact: ServiceImpact;
  investigation: InvestigationSummary;
  candidateActions: ActionType[];
  sourceNotes: {
    assistantSummary?: string;
    enrichmentApplied: boolean;
    apiEnrichmentSources?: string[];
    enrichmentWarnings?: string[];
  };
};

export type ProposedAction = {
  actionId: string;
  incidentId: string;
  type: ActionType;
  target: string;
  confidenceBand: "low" | "medium" | "high";
  policyMode: PolicyMode;
  reasoningSummary: string;
  validationPlan: string[];
  status: "proposed" | "approved" | "executed" | "validated" | "rejected";
};

export type ActionExecutionResult = {
  actionId: string;
  actionType: ActionType;
  status: "executed" | "failed";
  target: string;
  scenarioState?: string;
  notes?: string[];
};

export type ActionVerificationResult = {
  actionId: string;
  actionType: ActionType;
  status: "validated" | "failed";
  scenarioState: string;
  measuredLatencyMs?: number;
  latencyThresholdMs?: number;
  supportRequestStatus?: number;
  notes?: string[];
};

export type PolicyDecision = {
  eligible: boolean;
  policyMode: PolicyMode;
  reason: string;
};

export type IncidentRecord = {
  incidentId: string;
  scenarioId: string;
  businessTransaction: BusinessTransaction;
  detectorId?: string;
  detectorName?: string;
  status: "open" | "proposed" | "approved" | "executing" | "validated" | "closed";
};

export type DetectorWebhookPayload = {
  detectorId: string;
  detectorName: string;
  severity: "info" | "warning" | "critical";
  triggeredAt: string;
  incidentId?: string;
  dimensions?: Record<string, string>;
};

export type WebhookReceipt = {
  receiptId: string;
  receivedAt: string;
  sourceHost?: string;
  detectorId: string;
  detectorName: string;
  incidentId?: string;
  severity: "info" | "warning" | "critical";
  triggeredAt: string;
  eventType?: string;
  status?: string;
  dimensions?: Record<string, string>;
};

export * from "./store";
