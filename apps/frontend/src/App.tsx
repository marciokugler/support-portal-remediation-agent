import { useEffect, useState } from "react";
import { setJourneyContext, trackBusinessTransaction } from "./rum";

const transactions = [
  {
    name: "Customer Support Response",
    status: "At risk",
    detail: "AI-generated support response backed by the knowledge service."
  },
  {
    name: "Case Status Lookup",
    status: "Healthy",
    detail: "Independent transaction kept healthy during the primary incident."
  },
  {
    name: "Knowledge Article Search",
    status: "Healthy",
    detail: "Search remains available to demonstrate contained blast radius."
  }
];

export function App() {
  const [supportPrompt, setSupportPrompt] = useState("My support portal is slow and I need help understanding why.");
  const [caseId, setCaseId] = useState("CASE-1024");
  const [articleQuery, setArticleQuery] = useState("reset password");
  const [result, setResult] = useState("Choose a transaction to see live API output.");
  const [activeScenario, setActiveScenario] = useState("healthy");
  const [scenarioMessage, setScenarioMessage] = useState("No scenario active.");
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000";
  const scenarioBaseUrl =
    import.meta.env.VITE_SCENARIO_CONTROLLER_BASE_URL ?? "http://127.0.0.1:4004";

  useEffect(() => {
    setJourneyContext({
      "app.business_transaction": "customer_support_response",
      "app.active_scenario": activeScenario
    });
  }, [activeScenario]);

  useEffect(() => {
    void refreshScenario();
  }, []);

  async function callSupportResponse() {
    const payload = await trackBusinessTransaction(
      "customer_support_response",
      "support_question_submit",
      {
        "app.business_transaction": "customer_support_response",
        "app.transaction_name": "Customer Support Response",
        "app.active_scenario": activeScenario,
        "app.ui_surface": "support_portal"
      },
      async () => {
        const response = await fetch(`${apiBaseUrl}/api/support/respond`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: supportPrompt })
        });

        if (!response.ok) {
          throw new Error(`Support response request failed with status ${response.status}`);
        }

        return response.json();
      }
    );

    setResult(JSON.stringify(payload, null, 2));
  }

  async function callCaseLookup() {
    const payload = await trackBusinessTransaction(
      "case_status_lookup",
      "case_lookup",
      {
        "app.business_transaction": "case_status_lookup",
        "app.transaction_name": "Case Status Lookup",
        "app.active_scenario": activeScenario,
        "app.ui_surface": "support_portal"
      },
      async () => {
        const response = await fetch(`${apiBaseUrl}/api/cases/${encodeURIComponent(caseId)}`);
        if (!response.ok) {
          throw new Error(`Case lookup failed with status ${response.status}`);
        }
        return response.json();
      }
    );

    setResult(JSON.stringify(payload, null, 2));
  }

  async function callArticleSearch() {
    const payload = await trackBusinessTransaction(
      "knowledge_article_search",
      "knowledge_search",
      {
        "app.business_transaction": "knowledge_article_search",
        "app.transaction_name": "Knowledge Article Search",
        "app.active_scenario": activeScenario,
        "app.ui_surface": "support_portal"
      },
      async () => {
        const response = await fetch(`${apiBaseUrl}/api/articles/search?q=${encodeURIComponent(articleQuery)}`);
        if (!response.ok) {
          throw new Error(`Knowledge search failed with status ${response.status}`);
        }
        return response.json();
      }
    );

    setResult(JSON.stringify(payload, null, 2));
  }

  async function refreshScenario() {
    const response = await fetch(`${scenarioBaseUrl}/scenario/state`);
    const payload = (await response.json()) as { activeScenario: string };
    setActiveScenario(payload.activeScenario);
    setScenarioMessage(
      payload.activeScenario === "healthy"
        ? "No scenario active."
        : `Scenario active: ${payload.activeScenario}`
    );
  }

  async function activateScenario(scenarioId: string) {
    const response = await fetch(`${scenarioBaseUrl}/scenario/activate/${scenarioId}`, {
      method: "POST"
    });
    const payload = (await response.json()) as { activeScenario: string };
    setActiveScenario(payload.activeScenario);
    setScenarioMessage(`Scenario active: ${payload.activeScenario}`);
  }

  async function resetScenario() {
    const response = await fetch(`${scenarioBaseUrl}/scenario/reset`, {
      method: "POST"
    });
    const payload = (await response.json()) as { activeScenario: string };
    setActiveScenario(payload.activeScenario);
    setScenarioMessage("Scenario reset to healthy.");
  }

  return (
    <main
      style={{
        fontFamily: "ui-sans-serif, system-ui",
        margin: "0 auto",
        maxWidth: 1080,
        padding: 32,
        color: "#14213d"
      }}
    >
      <h1 style={{ marginBottom: 8 }}>AI Support Portal</h1>
      <p style={{ maxWidth: 720 }}>
        Demo app for Cisco Live. This frontend will be instrumented with Splunk RUM, Digital Experience Analytics,
        and optional Session Replay. The goal is to show one degraded business transaction while the rest of the app
        remains healthy.
      </p>
      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "2fr 1fr",
          alignItems: "start",
          marginTop: 24
        }}
      >
        <article
          style={{
            border: "1px solid #d7e3f4",
            borderRadius: 16,
            padding: 20,
            background: "linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)"
          }}
        >
          <h2>Customer Support Response</h2>
          <p>
            Ask the AI assistant a support question. This is the primary transaction that will degrade when the
            feature-flag scenario is activated.
          </p>
          <textarea
            value={supportPrompt}
            onChange={(event) => setSupportPrompt(event.target.value)}
            rows={4}
            style={{ width: "100%", marginBottom: 12 }}
          />
          <button onClick={callSupportResponse}>Submit Support Question</button>
        </article>
        <aside
          style={{
            border: "1px solid #d7e3f4",
            borderRadius: 16,
            padding: 20,
            background: "#ffffff"
          }}
        >
          <h3>Customer Journeys</h3>
          <p>Three business transactions are instrumented so the affected workflow stands out.</p>
          <div style={{ display: "grid", gap: 8 }}>
            <input value={caseId} onChange={(event) => setCaseId(event.target.value)} />
            <button onClick={callCaseLookup}>Check Case Status</button>
            <input value={articleQuery} onChange={(event) => setArticleQuery(event.target.value)} />
            <button onClick={callArticleSearch}>Search Knowledge Articles</button>
          </div>
        </aside>
      </section>
      <section
        style={{
          marginTop: 24,
          border: "1px solid #d7e3f4",
          borderRadius: 16,
          padding: 20,
          background: "#ffffff"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Scenario Control</h2>
        <p>
          Current state: <strong>{activeScenario}</strong>
        </p>
        <p>{scenarioMessage}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => activateScenario("dependency-latency")}>Trigger Latency</button>
          <button onClick={() => activateScenario("dependency-errors")}>Trigger Errors</button>
          <button onClick={resetScenario}>Reset Scenario</button>
          <button onClick={refreshScenario}>Refresh Status</button>
        </div>
      </section>
      <section>
        <h2>Business Transactions</h2>
        <ul>
          {transactions.map((transaction) => (
            <li key={transaction.name}>
              <strong>{transaction.name}</strong>: {transaction.status} - {transaction.detail}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Live API Result</h2>
        <pre style={{ background: "#f6f8fb", padding: 16, borderRadius: 12, overflowX: "auto" }}>{result}</pre>
      </section>
    </main>
  );
}
