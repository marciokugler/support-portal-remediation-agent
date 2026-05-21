import { ACTION_TYPES, BUSINESS_TRANSACTIONS, type AssistantEvidenceInput } from "@ibobs/shared-types";

export type ParsedAssistantEvidence = {
  likelyCause: string;
  confidenceBand: "low" | "medium" | "high";
  candidateActions: string[];
  inferredTransaction: string;
};

function matchFirst(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

function normalizeTransaction(text: string) {
  const value = text.toLowerCase();
  if (value.includes("case_status_lookup") || value.includes("case status")) {
    return BUSINESS_TRANSACTIONS.caseStatusLookup;
  }
  if (value.includes("knowledge_article_search") || value.includes("knowledge article search")) {
    return BUSINESS_TRANSACTIONS.knowledgeArticleSearch;
  }
  return BUSINESS_TRANSACTIONS.customerSupportResponse;
}

function inferTransaction(text: string) {
  const explicitTransaction = matchFirst(text, [
    /business transaction:\s*([^\n]+)/i,
    /affected transaction:\s*([^\n]+)/i
  ]);

  if (explicitTransaction) {
    return normalizeTransaction(explicitTransaction);
  }

  const normalized = text.toLowerCase();
  return normalized.includes("case")
    ? BUSINESS_TRANSACTIONS.caseStatusLookup
    : normalized.includes("search")
      ? BUSINESS_TRANSACTIONS.knowledgeArticleSearch
      : BUSINESS_TRANSACTIONS.customerSupportResponse;
}

function inferCandidateActions(text: string) {
  const normalized = text.toLowerCase();
  const actions = new Set<string>();

  if (
    normalized.includes("clean_service_cache") ||
    normalized.includes("clean service cache") ||
    normalized.includes("clean the cache") ||
    normalized.includes("cache cleanup") ||
    normalized.includes("cache pressure") ||
    normalized.includes("disk pressure") ||
    normalized.includes("filesystem pressure") ||
    normalized.includes("disk utilization")
  ) {
    actions.add(ACTION_TYPES.cleanServiceCache);
  }

  if (normalized.includes("restart")) {
    actions.add(ACTION_TYPES.restartService);
  }

  if (actions.size === 0) {
    actions.add(ACTION_TYPES.cleanServiceCache);
  }

  const preferredOrder = [
    ACTION_TYPES.cleanServiceCache,
    ACTION_TYPES.restartService
  ];

  return preferredOrder.filter((action) => actions.has(action));
}

function inferConfidence(text: string) {
  const normalized = text.toLowerCase();
  if (
    normalized.includes("high confidence") ||
    normalized.includes("disk utilization") ||
    normalized.includes("filesystem utilization") ||
    normalized.includes("traceid:") ||
    normalized.includes("support-knowledge")
  ) {
    return "high";
  }

  if (normalized.includes("low confidence")) {
    return "low";
  }

  return "medium";
}

function buildLikelyCauseSummary(text: string) {
  const recentChange = matchFirst(text, [
    /recent (?:change|changes):\s*([^\n]+)/i,
    /recent change:\s*([^\n]+)/i
  ]);
  const diskSignal = matchFirst(text, [
    /disk (?:signal|evidence|utilization):\s*([^\n]+)/i,
    /filesystem (?:signal|evidence|utilization):\s*([^\n]+)/i
  ]);
  const slowDependency = matchFirst(text, [
    /slow dependencies or services:\s*([^\n]+)/i,
    /service:\s*(support-[^\n]+)/i
  ]);
  const latencyEvidence = matchFirst(text, [
    /latency evidence:\s*([^\n]+)/i,
    /evidence of latency:\s*([^\n]+)/i
  ]);

  const parts = [recentChange, diskSignal, slowDependency, latencyEvidence]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/\s+/g, " ").trim());

  if (parts.length > 0) {
    return parts.join(" | ");
  }

  return text.trim() || "AI Assistant summary pending.";
}

export function parseAssistantEvidence(input: AssistantEvidenceInput): ParsedAssistantEvidence {
  const text = (input.rawText ?? input.assistantResponseText ?? "").trim();
  const inferredTransaction = inferTransaction(text);
  const candidateActions = inferCandidateActions(text);
  const confidenceBand = inferConfidence(text);

  return {
    likelyCause: buildLikelyCauseSummary(text),
    confidenceBand,
    candidateActions,
    inferredTransaction
  };
}
