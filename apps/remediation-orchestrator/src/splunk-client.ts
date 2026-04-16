import type { DetectorWebhookPayload, EvidenceBundle } from "@ibobs/shared-types";

export type SplunkEnrichmentResult = {
  apiBacked: boolean;
  sources: string[];
  warnings: string[];
  affectedSessions?: number;
  sessionReplayUrl?: string;
  p95LatencyMs?: number;
  errorRate?: number;
  affectedServices: string[];
  suspectService?: string;
  recentChange?: string;
  affectedTransactions?: string[];
};

export class SplunkObservabilityClient {
  private readonly impactMetricNames = [
    "affected_sessions",
    "frustration_signals",
    "session_replay_candidates",
    "incident_opened",
    "remediation_actions_proposed",
    "requests",
    "errors",
    "latency_latest_ms"
  ];

  constructor(
    private readonly baseUrl: string,
    private readonly accessToken: string
  ) {}

  async enrichDetector(payload: DetectorWebhookPayload): Promise<SplunkEnrichmentResult> {
    const fallback = this.buildFallback(payload);
    if (!this.accessToken) {
      return fallback;
    }

    const sources: string[] = [];
    const warnings: string[] = [];
    let merged = { ...fallback };

    const detector = await this.fetchCandidateJson(
      this.resolvePath(process.env.SPLUNK_DETECTOR_ENDPOINT_TEMPLATE, payload),
      warnings
    );
    if (detector) {
      sources.push("detector");
      if (!this.stringFrom(detector, ["recentChange", "recent_change", "event.recentChange"])) {
        warnings.push("Detector API responded, but did not include recent change context.");
      }
      merged = {
        ...merged,
        recentChange: this.stringFrom(detector, ["recentChange", "recent_change", "event.recentChange"]) ?? merged.recentChange
      };
    }

    const impact = await this.fetchCandidateJson(
      this.resolvePath(process.env.SPLUNK_IMPACT_ENDPOINT_TEMPLATE, payload),
      warnings
    );
    if (impact) {
      sources.push("impact");
      merged = {
        ...merged,
        affectedSessions: this.numberFrom(impact, ["affectedSessions", "affected_sessions", "rum.affectedSessions"]) ?? merged.affectedSessions,
        p95LatencyMs: this.numberFrom(impact, ["p95LatencyMs", "latency.p95", "apm.p95LatencyMs"]) ?? merged.p95LatencyMs,
        errorRate: this.numberFrom(impact, ["errorRate", "error_rate", "apm.errorRate"]) ?? merged.errorRate,
        sessionReplayUrl: this.stringFrom(impact, ["sessionReplayUrl", "session_replay_url"]) ?? merged.sessionReplayUrl
      };
    } else {
      const metricImpact = await this.enrichImpactFromMetricSignals(payload, warnings);
      if (metricImpact) {
        sources.push("impact_metrics");
        merged = {
          ...merged,
          affectedSessions: metricImpact.affectedSessions ?? merged.affectedSessions,
          p95LatencyMs: metricImpact.p95LatencyMs ?? merged.p95LatencyMs,
          errorRate: metricImpact.errorRate ?? merged.errorRate,
          affectedTransactions: metricImpact.affectedTransactions ?? merged.affectedTransactions,
          sessionReplayUrl: metricImpact.sessionReplayObserved ? merged.sessionReplayUrl : undefined
        };
      }
    }

    const topology = await this.fetchCandidateJson(
      this.resolvePath(process.env.SPLUNK_TOPOLOGY_ENDPOINT_TEMPLATE, payload),
      warnings
    );
    if (topology) {
      sources.push("topology");
      const topologyServices =
        this.arrayFrom(topology, ["affectedServices", "services", "apm.affectedServices"]) ??
        this.topologyNodeServices(topology);
      const containsDemoService =
        topologyServices?.some((service) => service.startsWith("support-") || service === payload.dimensions?.service) ??
        false;
      if (topologyServices && containsDemoService) {
        merged = {
          ...merged,
          affectedServices: topologyServices,
          suspectService:
            this.stringFrom(topology, ["suspectService", "suspect_service", "apm.suspectService"]) ??
            topologyServices[0] ??
            merged.suspectService,
          affectedTransactions: this.arrayFrom(topology, ["affectedTransactions", "transactions"]) ?? merged.affectedTransactions
        };
      } else {
        warnings.push(
          "Topology API responded, but it did not include demo service names."
        );
      }
    }

    return {
      ...merged,
      apiBacked: sources.length > 0,
      sources,
      warnings
    };
  }

  async explainEvidence(evidence: EvidenceBundle) {
    return {
      businessTransaction: evidence.browserExperience.affectedJourney,
      blastRadius: evidence.investigation.blastRadius,
      summary: evidence.investigation.likelyCause
    };
  }

  private buildFallback(payload: DetectorWebhookPayload): SplunkEnrichmentResult {
    return {
      apiBacked: false,
      sources: [],
      warnings: this.accessToken
        ? ["Splunk enrichment did not return complete incident context."]
        : ["SPLUNK_ACCESS_TOKEN not configured; live Splunk enrichment is unavailable."],
      affectedServices: payload.dimensions?.service ? [payload.dimensions.service] : [],
      affectedTransactions: payload.dimensions?.transaction ? [payload.dimensions.transaction] : undefined
    };
  }

  private resolvePath(template: string | undefined, payload: DetectorWebhookPayload) {
    if (!template) {
      return undefined;
    }

    return template
      .replaceAll("{detectorId}", encodeURIComponent(payload.detectorId))
      .replaceAll("{incidentId}", encodeURIComponent(payload.incidentId ?? ""))
      .replaceAll("{severity}", encodeURIComponent(payload.severity));
  }

  private async fetchCandidateJson(path: string | undefined, warnings: string[]) {
    if (!path) {
      return null;
    }

    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    try {
      const request = this.buildRequest(url);
      const response = await fetch(url, request);

      if (!response.ok) {
        warnings.push(`Splunk API ${url} returned ${response.status}.`);
        return null;
      }

      return response.json();
    } catch (error) {
      warnings.push(
        `Splunk API ${url} failed: ${error instanceof Error ? error.message : "unknown error"}.`
      );
      return null;
    }
  }

  private async enrichImpactFromMetricSignals(payload: DetectorWebhookPayload, warnings: string[]) {
    const metricMatches = await Promise.all(
      this.impactMetricNames.map(async (metricName) => {
        const result = await this.fetchMetricTimeseries(metricName, warnings);
        return {
          metricName,
          match: this.selectMetricSeries(result, payload)
        };
      })
    );

    const matched = metricMatches.filter((entry) => entry.match);
    if (matched.length === 0) {
      return null;
    }

    const affectedTransaction = matched
      .map((entry) => entry.match?.dimensions?.["app.business_transaction"])
      .find((value): value is string => typeof value === "string" && value.length > 0);

    const transaction = affectedTransaction ?? "customer_support_response";
    const affectedServices = Array.from(
      new Set(
        matched
          .map((entry) => entry.match?.dimensions?.["service.name"] ?? entry.match?.dimensions?.service)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      )
    );
    const suspectService =
      affectedServices.find((service) => service === "support-knowledge") ?? affectedServices.at(-1);
    const affectedSessions = await this.queryLatestMetricValue(
      "affected_sessions",
      [
        `sf_metric:"affected_sessions" AND app.business_transaction:"${transaction}"`,
        payload.incidentId
          ? `sf_metric:"affected_sessions" AND incident_id:"${payload.incidentId}"`
          : undefined
      ].filter((value): value is string => Boolean(value)),
      warnings
    );
    const frustrationSignals = await this.queryLatestMetricValue(
      "frustration_signals",
      [`sf_metric:"frustration_signals" AND journey:"${transaction}"`],
      warnings
    );
    const sessionReplayCandidates = await this.queryLatestMetricValue(
      "session_replay_candidates",
      [
        payload.incidentId
          ? `sf_metric:"session_replay_candidates" AND incident_id:"${payload.incidentId}"`
          : undefined,
        `sf_metric:"session_replay_candidates" AND app.business_transaction:"${transaction}"`
      ].filter((value): value is string => Boolean(value)),
      warnings
    );
    const requestCount = await this.queryLatestMetricValue(
      "requests",
      [`sf_metric:"requests" AND app.business_transaction:"${transaction}"`],
      warnings
    );
    const errorCount = await this.queryLatestMetricValue(
      "errors",
      [`sf_metric:"errors" AND app.business_transaction:"${transaction}"`],
      warnings,
      false
    );
    const latestLatencyMs = await this.queryLatestMetricValue(
      "latency_latest_ms",
      [`sf_metric:"latency_latest_ms" AND app.business_transaction:"${transaction}"`],
      warnings
    );

    if (affectedSessions === undefined && frustrationSignals === undefined && sessionReplayCandidates === undefined) {
      warnings.push(
        "Impact metric metadata exists in Splunk, but no recent datapoints matched the current incident filters."
      );
    }

    return {
      affectedSessions,
      affectedServices,
      suspectService,
      affectedTransactions: affectedTransaction ? [affectedTransaction] : undefined,
      frustrationSignals,
      sessionReplayObserved: (sessionReplayCandidates ?? 0) > 0 || matched.some((entry) => entry.metricName === "session_replay_candidates"),
      p95LatencyMs: latestLatencyMs,
      errorRate:
        requestCount && requestCount > 0
          ? Number((((errorCount ?? 0) as number) / requestCount).toFixed(4))
          : undefined
    };
  }

  private async fetchMetricTimeseries(metricName: string, warnings: string[]) {
    const url = `${this.baseUrl}/v2/metrictimeseries?query=${encodeURIComponent(`sf_metric:${metricName}`)}`;
    try {
      const response = await fetch(url, {
        headers: {
          "content-type": "application/json",
          "x-sf-token": this.accessToken
        }
      });

      if (!response.ok) {
        warnings.push(`Splunk metric metadata ${metricName} returned ${response.status}.`);
        return null;
      }

      return response.json();
    } catch (error) {
      warnings.push(
        `Splunk metric metadata ${metricName} failed: ${error instanceof Error ? error.message : "unknown error"}.`
      );
      return null;
    }
  }

  private async queryLatestMetricValue(
    metricName: string,
    queries: string[],
    warnings: string[],
    warnOnMiss = true
  ) {
    for (const query of queries) {
      const value = await this.fetchLatestWindowValue(query, warnings);
      if (value !== undefined) {
        return value;
      }
    }

    if (warnOnMiss) {
      warnings.push(`No recent datapoints matched metric query for ${metricName}.`);
    }
    return undefined;
  }

  private async fetchLatestWindowValue(query: string, warnings: string[]) {
    const endMs = Date.now();
    const startMs = endMs - 60 * 60 * 1000;
    const params = new URLSearchParams({
      query,
      startMs: String(startMs),
      endMs: String(endMs),
      resolution: "60000"
    });
    const url = `${this.baseUrl.replace(/\/v2$/, "").replace(/\/$/, "")}/v1/timeserieswindow?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          "content-type": "application/json",
          "x-sf-token": this.accessToken
        }
      });

      if (!response.ok) {
        return undefined;
      }

      const payload = (await response.json()) as {
        data?: Record<string, Array<[number, number]>>;
        errors?: unknown[];
      };
      const series = payload.data ? Object.values(payload.data) : [];
      const values = series
        .flatMap((points) => points)
        .map((point) => point?.[1])
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

      if (values.length === 0) {
        return undefined;
      }

      return values[values.length - 1];
    } catch (error) {
      warnings.push(
        `Splunk timeseries query failed for ${query}: ${error instanceof Error ? error.message : "unknown error"}.`
      );
      return undefined;
    }
  }

  private selectMetricSeries(payload: unknown, detectorPayload: DetectorWebhookPayload) {
    const results = this.valueAtPath(payload, "results");
    if (!Array.isArray(results)) {
      return undefined;
    }

    return results.find((result) => {
      if (!result || typeof result !== "object") {
        return false;
      }

      const item = result as {
        metric?: string;
        dimensions?: Record<string, string>;
        customProperties?: Record<string, string>;
      };

      const dimensions = item.dimensions ?? {};
      const properties = item.customProperties ?? {};
      const incidentMatch =
        detectorPayload.incidentId &&
        (dimensions.incident_id === detectorPayload.incidentId || properties.incident_id === detectorPayload.incidentId);
      const transactionMatch =
        dimensions["app.business_transaction"] === "customer_support_response" ||
        properties["app.business_transaction"] === "customer_support_response";

      return Boolean(incidentMatch || transactionMatch);
    }) as
      | {
          metric?: string;
          dimensions?: Record<string, string>;
          customProperties?: Record<string, string>;
        }
      | undefined;
  }

  private buildRequest(url: string) {
    if (url.endsWith("/v2/apm/topology")) {
      const end = new Date();
      const start = new Date(end.getTime() - 15 * 60 * 1000);
      return {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-sf-token": this.accessToken
        },
        body: JSON.stringify({
          timeRange: `${start.toISOString().replace(".000", "")}/${end.toISOString().replace(".000", "")}`
        })
      };
    }

    return {
      headers: {
        "content-type": "application/json",
        "x-sf-token": this.accessToken
      }
    };
  }

  private stringFrom(payload: unknown, paths: string[]) {
    for (const path of paths) {
      const value = this.valueAtPath(payload, path);
      if (typeof value === "string" && value.length > 0) {
        return value;
      }
    }

    return undefined;
  }

  private numberFrom(payload: unknown, paths: string[]) {
    for (const path of paths) {
      const value = this.valueAtPath(payload, path);
      if (typeof value === "number") {
        return value;
      }
      if (typeof value === "string" && value.length > 0 && !Number.isNaN(Number(value))) {
        return Number(value);
      }
    }

    return undefined;
  }

  private arrayFrom(payload: unknown, paths: string[]) {
    for (const path of paths) {
      const value = this.valueAtPath(payload, path);
      if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === "string");
      }
    }

    return undefined;
  }

  private valueAtPath(payload: unknown, path: string) {
    if (!payload || typeof payload !== "object") {
      return undefined;
    }

    return path.split(".").reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object") {
        return undefined;
      }
      return (current as Record<string, unknown>)[segment];
    }, payload);
  }

  private topologyNodeServices(payload: unknown) {
    const nodes = this.valueAtPath(payload, "data.nodes");
    if (!Array.isArray(nodes)) {
      return undefined;
    }

    return nodes
      .map((node) =>
        node && typeof node === "object" && typeof (node as Record<string, unknown>).serviceName === "string"
          ? ((node as Record<string, unknown>).serviceName as string)
          : undefined
      )
      .filter((service): service is string => typeof service === "string")
      .slice(0, 10);
  }
}
