export type LocalServiceOptions = {
  baseUrlEnvVar: string;
  portEnvVar: string;
  defaultPort: number;
  defaultHost?: string;
  protocol?: "http" | "https";
};

export function localServicePort(
  env: Record<string, string | undefined>,
  portEnvVar: string,
  defaultPort: number
) {
  return Number(env[portEnvVar] ?? defaultPort);
}

export function localServiceUrl(
  env: Record<string, string | undefined>,
  { baseUrlEnvVar, portEnvVar, defaultPort, defaultHost = "127.0.0.1", protocol = "http" }: LocalServiceOptions
) {
  const configured = env[baseUrlEnvVar];
  if (configured) {
    return configured;
  }

  const port = localServicePort(env, portEnvVar, defaultPort);
  return `${protocol}://${defaultHost}:${port}`;
}

export const defaultPorts = {
  apiGateway: 4000,
  assistantService: 4001,
  caseService: 4002,
  knowledgeService: 4003,
  scenarioController: 4004,
  orchestrator: 4010,
  remediationAgent: 8000
} as const;
