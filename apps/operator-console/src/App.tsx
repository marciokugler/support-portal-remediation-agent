import { useEffect, useState } from "react";

const exampleAssistantOutput = `High confidence that support_knowledge_v2 degraded the Customer Support Response transaction.
Likely blast radius is medium because only one business transaction is materially affected.
Recommended action: disable_feature_flag.`;

type OrchestratorResponse = {
  incident?: {
    incidentId: string;
    detectorId?: string;
    detectorName?: string;
    status?: string;
    businessTransaction?: string;
    blastRadius?: string;
    approvedAt?: string;
    executedAt?: string;
    verifiedAt?: string;
  };
  enrichment?: {
    apiBacked?: boolean;
    sources?: string[];
    warnings?: string[];
    affectedServices?: string[];
    suspectService?: string;
    affectedTransactions?: string[];
  };
  evidence?: {
    browserExperience?: {
      affectedSessions?: number;
      affectedJourney?: string;
      sessionReplayUrl?: string;
    };
    serviceImpact?: {
      affectedServices?: string[];
      suspectService?: string;
      p95LatencyMs?: number;
      errorRate?: number;
      affectedTransactions?: string[];
    };
    investigation?: {
      blastRadius?: string;
      recentChange?: string;
      confidenceBand?: string;
    };
    sourceNotes?: {
      enrichmentApplied?: boolean;
      apiEnrichmentSources?: string[];
      enrichmentWarnings?: string[];
    };
  };
  policy?: {
    eligible?: boolean;
    policyMode?: string;
    reason?: string;
  };
  proposedAction?: {
    actionId?: string;
    type?: string;
    target?: string;
    confidenceBand?: string;
    policyMode?: string;
    reasoningSummary?: string;
    validationPlan?: string[];
    status?: string;
  };
  approved?: boolean;
  actionId?: string;
  verifyResult?: {
    status?: string;
    scenarioState?: string;
    measuredLatencyMs?: number;
    latencyThresholdMs?: number;
    supportRequestStatus?: number;
    notes?: string[];
  };
  executeResult?: {
    status?: string;
    scenarioState?: string;
    actionType?: string;
    target?: string;
    notes?: string[];
  };
};

type StoredIncident = {
  incidentId: string;
  detectorId?: string;
  detectorName?: string;
  status?: string;
  businessTransaction?: string;
  blastRadius?: string;
  approvedAt?: string;
  executedAt?: string;
  verifiedAt?: string;
  evidence?: OrchestratorResponse["evidence"];
  proposedAction?: OrchestratorResponse["proposedAction"];
  executeResult?: OrchestratorResponse["executeResult"];
  verifyResult?: OrchestratorResponse["verifyResult"];
};

type WebhookReceipt = {
  incidentId?: string;
  detectorId?: string;
  detectorName?: string;
};

function readResponse(value: string): OrchestratorResponse | null {
  try {
    return JSON.parse(value) as OrchestratorResponse;
  } catch {
    return null;
  }
}

export function App() {
  const [assistantSummary, setAssistantSummary] = useState(exampleAssistantOutput);
  const [incidentId, setIncidentId] = useState("");
  const [result, setResult] = useState<string>("No incident loaded yet.");
  const [scenarioState, setScenarioState] = useState("healthy");
  const parsedResult = readResponse(result);
  const baseUrl = import.meta.env.VITE_ORCHESTRATOR_BASE_URL ?? "http://127.0.0.1:4010";
  const scenarioBaseUrl =
    import.meta.env.VITE_SCENARIO_CONTROLLER_BASE_URL ?? "http://127.0.0.1:4004";

  async function refreshIncidents() {
    const [incidentsResponse, receiptsResponse] = await Promise.all([
      fetch(`${baseUrl}/remediation/incidents`),
      fetch(`${baseUrl}/remediation/webhook-receipts`)
    ]);
    const incidents = (await incidentsResponse.json()) as StoredIncident[];
    const receipts = (await receiptsResponse.json()) as WebhookReceipt[];
    const latestIncident = incidents.at(-1);

    if (!latestIncident) {
      return;
    }

    const matchingReceipt = receipts.find((receipt) => receipt.incidentId === latestIncident.incidentId);
    const incidentWithDetector = {
      ...latestIncident,
      detectorId: latestIncident.detectorId ?? matchingReceipt?.detectorId,
      detectorName: latestIncident.detectorName ?? matchingReceipt?.detectorName
    };

    const detailResponse = await fetch(
      `${baseUrl}/remediation/incidents/${encodeURIComponent(incidentWithDetector.incidentId)}`
    );
    const detailedIncident = detailResponse.ok
      ? ((await detailResponse.json()) as StoredIncident)
      : incidentWithDetector;
    const hydratedIncident = {
      ...detailedIncident,
      detectorId: detailedIncident.detectorId ?? incidentWithDetector.detectorId,
      detectorName: detailedIncident.detectorName ?? incidentWithDetector.detectorName
    };

    setIncidentId(hydratedIncident.incidentId);

    setResult((current) => {
      const parsed = readResponse(current);
      if (
        parsed?.incident?.incidentId === hydratedIncident.incidentId &&
        parsed?.incident?.detectorId === hydratedIncident.detectorId &&
        parsed?.incident?.detectorName === hydratedIncident.detectorName &&
        parsed?.proposedAction?.actionId === hydratedIncident.proposedAction?.actionId &&
        parsed?.verifyResult?.status === hydratedIncident.verifyResult?.status
      ) {
        return current;
      }

      return JSON.stringify(
        {
          incident: {
            incidentId: hydratedIncident.incidentId,
            detectorId: hydratedIncident.detectorId,
            detectorName: hydratedIncident.detectorName,
            status: hydratedIncident.status,
            businessTransaction: hydratedIncident.businessTransaction,
            blastRadius: hydratedIncident.blastRadius,
            approvedAt: hydratedIncident.approvedAt,
            executedAt: hydratedIncident.executedAt,
            verifiedAt: hydratedIncident.verifiedAt
          },
          evidence: hydratedIncident.evidence,
          proposedAction: hydratedIncident.proposedAction,
          executeResult: hydratedIncident.executeResult,
          verifyResult: hydratedIncident.verifyResult
        },
        null,
        2
      );
    });
  }

  useEffect(() => {
    void refreshScenario();
    void refreshIncidents();

    const intervalId = window.setInterval(() => {
      void refreshScenario();
      void refreshIncidents();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function createIncident() {
    const response = await fetch(`${baseUrl}/webhooks/splunk/detector`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        detectorId: "det-frontend-demo",
        detectorName: "Customer Support Response Latency",
        severity: "critical",
        triggeredAt: new Date().toISOString()
      })
    });
    const payload = await response.json();
    setIncidentId(payload.incident.incidentId);
    setResult(JSON.stringify(payload, null, 2));
  }

  async function proposeAction() {
    const response = await fetch(`${baseUrl}/remediation/propose`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "splunk_ai_assistant",
        rawText: assistantSummary,
        pastedBy: "operator",
        pastedAt: new Date().toISOString(),
        incidentId
      })
    });
    const payload = await response.json();
    setResult(JSON.stringify(payload, null, 2));
  }

  async function approveAction() {
    if (!parsedResult) {
      setResult("Current result is not valid JSON.");
      return;
    }

    const actionId = parsedResult.proposedAction?.actionId;
    if (!actionId || !incidentId) {
      setResult("No proposed action available to approve.");
      return;
    }

    const response = await fetch(`${baseUrl}/remediation/approve/${actionId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ incidentId })
    });
    const payload = await response.json();
    setResult(JSON.stringify(payload, null, 2));
  }

  async function explainEvidence() {
    if (!incidentId) {
      setResult("Create an incident before requesting an explanation.");
      return;
    }

    const response = await fetch(`${baseUrl}/remediation/explain`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "splunk_ai_assistant",
        rawText: assistantSummary,
        pastedBy: "operator",
        pastedAt: new Date().toISOString(),
        incidentId
      })
    });
    const payload = await response.json();
    setResult(JSON.stringify(payload, null, 2));
  }

  async function refreshScenario() {
    const response = await fetch(`${scenarioBaseUrl}/scenario/state`);
    const payload = (await response.json()) as { activeScenario: string };
    setScenarioState(payload.activeScenario);
  }

  async function activateScenario(scenarioId: string) {
    const response = await fetch(`${scenarioBaseUrl}/scenario/activate/${scenarioId}`, {
      method: "POST"
    });
    const payload = (await response.json()) as { activeScenario: string };
    setScenarioState(payload.activeScenario);
  }

  async function resetScenario() {
    const response = await fetch(`${scenarioBaseUrl}/scenario/reset`, {
      method: "POST"
    });
    const payload = (await response.json()) as { activeScenario: string };
    setScenarioState(payload.activeScenario);
  }

  const enrichmentWarnings =
    parsedResult?.evidence?.sourceNotes?.enrichmentWarnings ?? parsedResult?.enrichment?.warnings ?? [];
  const enrichmentSources =
    parsedResult?.evidence?.sourceNotes?.apiEnrichmentSources ?? parsedResult?.enrichment?.sources ?? [];

  return (
    <main
      style={{
        fontFamily: "ui-sans-serif, system-ui",
        margin: "0 auto",
        maxWidth: 1120,
        padding: 32,
        color: "#10223a"
      }}
    >
      <h1>Operator Console</h1>
      <p>Webhook-triggered incident intake, human-reviewed evidence handoff, API enrichment, approval, and recovery.</p>
      <section>
        <h2>Incident Flow</h2>
        <ol>
          <li>Detector webhook opens the incident.</li>
          <li>Presenter pastes AI Assistant summary.</li>
          <li>Orchestrator enriches missing fields.</li>
          <li>Policy decides whether automation is eligible.</li>
          <li>Remediation agent proposes action.</li>
        </ol>
      </section>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 20,
          alignItems: "start"
        }}
      >
        <div>
        <h2>Evidence Intake</h2>
        <textarea
          value={assistantSummary}
          onChange={(event) => setAssistantSummary(event.target.value)}
          rows={8}
          style={{ width: "100%", borderRadius: 12, border: "1px solid #c7d7ea", padding: 12 }}
        />
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={createIncident}>Create Incident</button>
          <button onClick={refreshIncidents}>Refresh Incidents</button>
          <button onClick={explainEvidence} disabled={!incidentId}>
            Explain Evidence
          </button>
          <button onClick={proposeAction} disabled={!incidentId}>
            Propose Action
          </button>
          <button onClick={approveAction} disabled={!incidentId}>
            Approve Action
          </button>
        </div>
        <p>Current incident: {incidentId || "none"}</p>
        </div>
        <aside
          style={{
            border: "1px solid #d8e3f1",
            borderRadius: 16,
            padding: 16,
            background: "#f8fbff"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Live Summary</h2>
          <p>
            <strong>Incident ID:</strong>{" "}
            {parsedResult?.incident?.incidentId ?? incidentId ?? "none"}
          </p>
          <p>
            <strong>Detector ID:</strong>{" "}
            {parsedResult?.incident?.detectorId ??
              "n/a"}
          </p>
          <p>
            <strong>Detector name:</strong>{" "}
            {parsedResult?.incident?.detectorName ?? "n/a"}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {parsedResult?.proposedAction?.status ??
              parsedResult?.incident?.status ??
              parsedResult?.verifyResult?.status ??
              "idle"}
          </p>
          <p>
            <strong>Policy:</strong> {parsedResult?.policy?.policyMode ?? "not evaluated"}
          </p>
          <p>
            <strong>Blast radius:</strong>{" "}
            {parsedResult?.evidence?.investigation?.blastRadius ?? parsedResult?.incident?.blastRadius ?? "unknown"}
          </p>
          <p>
            <strong>Affected transaction:</strong>{" "}
            {parsedResult?.evidence?.browserExperience?.affectedJourney ??
              parsedResult?.incident?.businessTransaction ??
              "not set"}
          </p>
          <p>
            <strong>Sessions impacted:</strong> {parsedResult?.evidence?.browserExperience?.affectedSessions ?? "n/a"}
          </p>
          <p>
            <strong>Suspect service:</strong>{" "}
            {parsedResult?.evidence?.serviceImpact?.suspectService ??
              parsedResult?.enrichment?.suspectService ??
              "n/a"}
          </p>
          <p>
            <strong>Action:</strong> {parsedResult?.proposedAction?.type ?? parsedResult?.actionId ?? "not proposed"}
          </p>
          <p>
            <strong>Approval:</strong> {parsedResult?.approved ? "approved" : parsedResult?.incident?.approvedAt ? "approved" : "pending"}
          </p>
          <p>
            <strong>Execution:</strong> {parsedResult?.executeResult?.status ?? "not executed"}
          </p>
          <p>
            <strong>Verification:</strong> {parsedResult?.verifyResult?.status ?? "not verified"}
          </p>
          <p>
            <strong>Scenario:</strong> {scenarioState}
          </p>
        </aside>
      </section>
      <section style={{ marginTop: 20, border: "1px solid #d8e3f1", borderRadius: 16, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Scenario Controls</h2>
        <p>Use this to trigger the customer-impacting path before creating the incident.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => activateScenario("dependency-latency")}>Trigger Latency</button>
          <button onClick={() => activateScenario("dependency-errors")}>Trigger Errors</button>
          <button onClick={resetScenario}>Reset Scenario</button>
          <button onClick={refreshScenario}>Refresh Status</button>
        </div>
      </section>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 20
        }}
      >
        <article style={{ border: "1px solid #d8e3f1", borderRadius: 16, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Enrichment</h2>
          <p>
            <strong>API enrichment:</strong>{" "}
            {parsedResult?.evidence?.sourceNotes?.enrichmentApplied ??
            parsedResult?.enrichment?.apiBacked
              ? "applied"
              : "fallback defaults"}
          </p>
          <p>
            <strong>Sources:</strong> {enrichmentSources.length > 0 ? enrichmentSources.join(", ") : "none"}
          </p>
          <p>
            <strong>Recent change:</strong>{" "}
            {parsedResult?.evidence?.investigation?.recentChange ?? "not available"}
          </p>
          <p>
            <strong>Release signal:</strong>{" "}
            {parsedResult?.evidence?.investigation?.recentChange
              ? "new change identified"
              : "not identified"}
          </p>
          <p>
            <strong>Session replay:</strong>{" "}
            {parsedResult?.evidence?.browserExperience?.sessionReplayUrl ? "linked" : "not available"}
          </p>
          {enrichmentWarnings.length > 0 ? (
            <div>
              <strong>Warnings</strong>
              <ul>
                {enrichmentWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
        <article style={{ border: "1px solid #d8e3f1", borderRadius: 16, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Action Context</h2>
          <p>
            <strong>Confidence:</strong>{" "}
            {parsedResult?.proposedAction?.confidenceBand ??
              parsedResult?.evidence?.investigation?.confidenceBand ??
              "unknown"}
          </p>
          <p>
            <strong>Reason:</strong> {parsedResult?.policy?.reason ?? parsedResult?.proposedAction?.reasoningSummary ?? "n/a"}
          </p>
          <p>
            <strong>Services:</strong>{" "}
            {parsedResult?.evidence?.serviceImpact?.affectedServices?.join(", ") ?? "n/a"}
          </p>
          <p>
            <strong>Execution notes:</strong>{" "}
            {parsedResult?.executeResult?.notes?.join(" | ") ?? "n/a"}
          </p>
          <p>
            <strong>Verification notes:</strong>{" "}
            {parsedResult?.verifyResult?.notes?.join(" | ") ?? "n/a"}
          </p>
          <p>
            <strong>Recovered scenario state:</strong>{" "}
            {parsedResult?.verifyResult?.scenarioState ?? parsedResult?.executeResult?.scenarioState ?? "n/a"}
          </p>
          <p>
            <strong>Measured latency:</strong>{" "}
            {parsedResult?.verifyResult?.measuredLatencyMs !== undefined
              ? `${parsedResult.verifyResult.measuredLatencyMs} ms`
              : "n/a"}
          </p>
          <p>
            <strong>Latency threshold:</strong>{" "}
            {parsedResult?.verifyResult?.latencyThresholdMs !== undefined
              ? `${parsedResult.verifyResult.latencyThresholdMs} ms`
              : "n/a"}
          </p>
          <p>
            <strong>Validation plan:</strong>
          </p>
          <ul>
            {(parsedResult?.proposedAction?.validationPlan ?? []).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </article>
      </section>
      <section style={{ marginTop: 20 }}>
        <h2>Raw Response</h2>
        <pre style={{ background: "#f6f8fb", padding: 16, borderRadius: 12, overflowX: "auto" }}>{result}</pre>
      </section>
    </main>
  );
}
