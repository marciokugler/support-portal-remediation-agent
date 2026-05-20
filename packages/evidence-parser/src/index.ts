import { ACTION_TYPES, BLAST_RADIUS, BUSINESS_TRANSACTIONS, type AssistantEvidenceInput } from "@ibobs/shared-types";

export type ParsedAssistantEvidence = {
  likelyCause: string;
  confidenceBand: "low" | "medium" | "high";
  blastRadius: "low" | "medium" | "high";
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
    normalized.includes("disable_feature_flag") ||
    normalized.includes("disable the feature flag") ||
    normalized.includes("feature flag") ||
    normalized.includes("support_knowledge_v2")
  ) {
    actions.add(ACTION_TYPES.disableFeatureFlag);
  }

  if (normalized.includes("rollback") || normalized.includes("roll back")) {
    actions.add(ACTION_TYPES.rollbackCanary);
  }

  if (normalized.includes("restart")) {
    actions.add(ACTION_TYPES.restartService);
  }

  if (normalized.includes("scale")) {
    actions.add(ACTION_TYPES.scaleWorkerPool);
  }

  if (actions.size === 0) {
    actions.add(ACTION_TYPES.disableFeatureFlag);
  }

  if (actions.has(ACTION_TYPES.rollbackCanary) && !actions.has(ACTION_TYPES.disableFeatureFlag)) {
    actions.add(ACTION_TYPES.disableFeatureFlag);
  }

  const preferredOrder = [
    ACTION_TYPES.disableFeatureFlag,
    ACTION_TYPES.rollbackCanary,
    ACTION_TYPES.restartService,
    ACTION_TYPES.scaleWorkerPool
  ];

  return preferredOrder.filter((action) => actions.has(action));
}

function inferBlastRadius(text: string) {
  const normalized = text.toLowerCase();
  const explicitBlastRadius = matchFirst(text, [
    /blast radius\s*(?:is|:)\s*(low|medium|high)\b/i,
    /blast radius\s*(?:is|:)\s*([^\n.]+)/i
  ]);
  const blastText = explicitBlastRadius?.toLowerCase();
  const containsWord = (value: string, word: string) => new RegExp(`\\b${word}\\b`, "i").test(value);

  if (blastText && containsWord(blastText, "high")) {
    return BLAST_RADIUS.high;
  }

  if (
    blastText && containsWord(blastText, "low")
  ) {
    return BLAST_RADIUS.low;
  }

  if (blastText && containsWord(blastText, "medium")) {
    return BLAST_RADIUS.medium;
  }

  if (normalized.includes("multiple business transactions")) {
    return BLAST_RADIUS.high;
  }

  if (
    normalized.includes("single service only") ||
    normalized.includes("isolated to one service")
  ) {
    return BLAST_RADIUS.low;
  }

  if (
    normalized.includes("only one business transaction") ||
    normalized.includes("limited to the customer_support_response transaction") ||
    normalized.includes("primarily isolated")
  ) {
    return BLAST_RADIUS.medium;
  }

  return BLAST_RADIUS.medium;
}

function inferConfidence(text: string) {
  const normalized = text.toLowerCase();
  if (
    normalized.includes("high confidence") ||
    normalized.includes("feature flag:") ||
    normalized.includes("release version:") ||
    normalized.includes("traceid:")
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
  const featureFlag = matchFirst(text, [/feature flag:\s*([^\n]+)/i]);
  const releaseVersion = matchFirst(text, [/release version:\s*([^\n]+)/i]);
  const slowDependency = matchFirst(text, [
    /slow dependencies or services:\s*([^\n]+)/i,
    /service:\s*(support-[^\n]+)/i
  ]);
  const latencyEvidence = matchFirst(text, [
    /latency evidence:\s*([^\n]+)/i,
    /evidence of latency:\s*([^\n]+)/i
  ]);

  const parts = [recentChange, featureFlag, releaseVersion, slowDependency, latencyEvidence]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/\s+/g, " ").trim());

  if (parts.length > 0) {
    return parts.join(" | ");
  }

  return text.trim() || "AI Assistant summary pending.";
}

export function parseAssistantEvidence(input: AssistantEvidenceInput): ParsedAssistantEvidence {
  const text = input.rawText.trim();
  const inferredTransaction = inferTransaction(text);
  const candidateActions = inferCandidateActions(text);
  const blastRadius = inferBlastRadius(text);
  const confidenceBand = inferConfidence(text);

  return {
    likelyCause: buildLikelyCauseSummary(text),
    confidenceBand,
    blastRadius,
    candidateActions,
    inferredTransaction
  };
}
