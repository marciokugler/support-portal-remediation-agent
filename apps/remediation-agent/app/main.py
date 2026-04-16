import json
import os
import time
import urllib.error
import urllib.request

import httpx
from fastapi import FastAPI
from openai import OpenAI
from pydantic import BaseModel
from .telemetry import agent_logger, annotate_current_span, init_agent_telemetry

try:
    import certifi
except ImportError:  # pragma: no cover - certifi is normally available via httpx/openai deps
    certifi = None

try:
    import truststore
except ImportError:  # pragma: no cover - installed in the agent venv for local TLS compatibility
    truststore = None

if truststore is not None:
    truststore.inject_into_ssl()

app = FastAPI(title="IBOBS Remediation Agent")
telemetry_started = init_agent_telemetry(app)


class EvaluateRequest(BaseModel):
    incidentId: str
    candidateActions: list[str]
    likelyCause: str
    confidenceBand: str


class ActionRequest(BaseModel):
    incidentId: str
    actionType: str
    target: str
    businessTransaction: str | None = None


scenario_controller_base_url = os.getenv("SCENARIO_CONTROLLER_BASE_URL", "http://127.0.0.1:4004")
api_gateway_base_url = os.getenv("API_GATEWAY_BASE_URL", "http://127.0.0.1:4000")
validation_latency_threshold_ms = float(os.getenv("REMEDIATION_VALIDATION_LATENCY_THRESHOLD_MS", "1200"))


def preferred_model() -> str:
    return os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


def openai_client() -> OpenAI | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    http_client = None
    if truststore is None and certifi is not None:
        http_client = httpx.Client(verify=certifi.where())
    return OpenAI(api_key=api_key, http_client=http_client)


def post_json(url: str, payload: dict | None = None) -> tuple[int, dict]:
    body = None if payload is None else str.encode(json.dumps(payload))
    headers = {"content-type": "application/json"} if payload is not None else {}
    request = urllib.request.Request(
        url,
        data=body,
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        response_body = response.read().decode("utf-8")
        return response.status, json.loads(response_body) if response_body else {}


def get_json(url: str) -> tuple[int, dict]:
    request = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(request, timeout=10) as response:
        response_body = response.read().decode("utf-8")
        return response.status, json.loads(response_body) if response_body else {}


@app.get("/agent/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "model": preferred_model(),
        "telemetry": "enabled" if telemetry_started else "disabled",
    }


@app.post("/agent/evaluate")
def evaluate(payload: EvaluateRequest) -> dict:
    candidate_actions = payload.candidateActions or ["disable_feature_flag"]
    client = openai_client()

    reasoning_summary = payload.likelyCause
    recommended_action = candidate_actions[0]

    if client:
        prompt = (
            "You are a remediation agent. Choose the safest bounded action from the candidate actions. "
            "Return a short explanation only.\n"
            f"Incident: {payload.incidentId}\n"
            f"Likely cause: {payload.likelyCause}\n"
            f"Candidate actions: {', '.join(candidate_actions)}\n"
        )
        agent_logger.info(
            "submitting remediation prompt",
            extra={"incident_id": payload.incidentId, "candidate_actions": candidate_actions, "prompt": prompt},
        )
        try:
            response = client.responses.create(
                model=preferred_model(),
                input=prompt,
            )
            reasoning_summary = response.output_text or payload.likelyCause
            if "rollback" in reasoning_summary.lower() and "rollback_canary" in candidate_actions:
                recommended_action = "rollback_canary"
        except Exception as error:
            agent_logger.warning(
                "openai remediation call failed; using fallback path",
                extra={
                    "incident_id": payload.incidentId,
                    "candidate_actions": candidate_actions,
                    "error": str(error),
                },
            )
    else:
        agent_logger.info(
            "using remediation fallback path",
            extra={"incident_id": payload.incidentId, "candidate_actions": candidate_actions, "likely_cause": payload.likelyCause},
        )

    annotate_current_span(
        {
            "service.namespace": "ibobs2002",
            "deployment.environment": os.getenv("DEPLOYMENT_ENVIRONMENT", "demo"),
            "app.business_transaction": "remediation_decision",
            "incident.id": payload.incidentId,
            "agent.model": preferred_model(),
            "agent.confidence_band": payload.confidenceBand,
            "agent.recommended_action": recommended_action,
            "gen_ai.system": "openai" if client else "fallback",
        }
    )
    agent_logger.info(
        "remediation decision completed",
        extra={
            "incident_id": payload.incidentId,
            "confidence_band": payload.confidenceBand,
            "recommended_action": recommended_action,
            "reasoning_summary": reasoning_summary,
        },
    )

    return {
        "incidentId": payload.incidentId,
        "recommendedAction": recommended_action,
        "model": preferred_model(),
        "confidenceBand": payload.confidenceBand,
        "reasoningSummary": reasoning_summary,
        "needsApproval": True,
    }


@app.post("/agent/execute/{action_id}")
def execute(action_id: str, payload: ActionRequest) -> dict:
    notes: list[str] = []
    status = "executed"
    scenario_state = "unknown"

    try:
        if payload.actionType in {"disable_feature_flag", "rollback_canary"}:
            _, response_payload = post_json(f"{scenario_controller_base_url}/scenario/reset")
            scenario_state = response_payload.get("activeScenario", "unknown")
            notes.append("Reset customer-impacting scenario through the scenario controller.")
        else:
            status = "failed"
            notes.append(f"Action type {payload.actionType} is not wired to a demo control plane.")
    except urllib.error.URLError as error:
        status = "failed"
        notes.append(f"Execution request failed: {error.reason}")

    annotate_current_span(
        {
            "service.namespace": "ibobs2002",
            "deployment.environment": os.getenv("DEPLOYMENT_ENVIRONMENT", "demo"),
            "app.business_transaction": "remediation_execution",
            "action.id": action_id,
            "action.type": payload.actionType,
            "action.target": payload.target,
            "action.status": status,
            "scenario.state": scenario_state,
        }
    )
    agent_logger.info(
        "remediation action executed",
        extra={
            "action_id": action_id,
            "incident_id": payload.incidentId,
            "action_type": payload.actionType,
            "action_target": payload.target,
            "status": status,
            "scenario_state": scenario_state,
            "notes": notes,
        },
    )
    return {
        "actionId": action_id,
        "actionType": payload.actionType,
        "target": payload.target,
        "status": status,
        "scenarioState": scenario_state,
        "notes": notes,
    }


@app.post("/agent/verify/{action_id}")
def verify(action_id: str, payload: ActionRequest) -> dict:
    notes: list[str] = []
    scenario_state = "unknown"
    support_request_status = None
    measured_latency_ms = None
    status = "failed"

    try:
        _, scenario_payload = get_json(f"{scenario_controller_base_url}/scenario/state")
        scenario_state = scenario_payload.get("activeScenario", "unknown")
        if scenario_state != "healthy":
            notes.append(f"Scenario controller still reports {scenario_state}.")
        else:
            started_at = time.perf_counter()
            support_request_status, _ = post_json(
                f"{api_gateway_base_url}/api/support/respond",
                {"prompt": "post-remediation validation"},
            )
            measured_latency_ms = round((time.perf_counter() - started_at) * 1000, 1)
            if support_request_status == 200 and measured_latency_ms <= validation_latency_threshold_ms:
                status = "validated"
                notes.append("Customer support validation request completed within threshold.")
            else:
                notes.append("Validation request did not recover within the expected threshold.")
    except urllib.error.URLError as error:
        notes.append(f"Verification request failed: {error.reason}")

    annotate_current_span(
        {
            "service.namespace": "ibobs2002",
            "deployment.environment": os.getenv("DEPLOYMENT_ENVIRONMENT", "demo"),
            "app.business_transaction": "remediation_verification",
            "action.id": action_id,
            "action.type": payload.actionType,
            "action.target": payload.target,
            "scenario.state": scenario_state,
            "validation.status": status,
            "validation.latency_ms": measured_latency_ms or 0,
            "validation.threshold_ms": validation_latency_threshold_ms,
        }
    )
    agent_logger.info(
        "remediation action verified",
        extra={
            "action_id": action_id,
            "incident_id": payload.incidentId,
            "action_type": payload.actionType,
            "action_target": payload.target,
            "status": status,
            "scenario_state": scenario_state,
            "measured_latency_ms": measured_latency_ms,
            "latency_threshold_ms": validation_latency_threshold_ms,
            "support_request_status": support_request_status,
            "notes": notes,
        },
    )
    return {
        "actionId": action_id,
        "actionType": payload.actionType,
        "status": status,
        "scenarioState": scenario_state,
        "measuredLatencyMs": measured_latency_ms,
        "latencyThresholdMs": validation_latency_threshold_ms,
        "supportRequestStatus": support_request_status,
        "notes": notes,
    }
