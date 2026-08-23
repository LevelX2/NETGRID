import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REPLAY_SCHEMA_VERSION =
  "netgrid-ai-decision-checkpoint-replay-v1" as const;
const ANALYSIS_SCHEMA_VERSION = "netgrid-decision-analysis-context-v4";
const REQUIRED_VALIDATIONS = [
  "snapshotHashMatches",
  "sideSafeInput",
  "inputMatchesActor",
  "inputMatchesStateVersion",
  "legalActionSetMatchesHistoricalAudit",
  "actorStateMatchesHistoricalSnapshot",
  "publicEventPrefixComplete",
  "deckConsumersMatchPersistedProjection",
  "humanPrivateHandExcluded",
] as const;

type JsonRecord = Record<string, unknown>;

export type ExportedAiDecisionReplayFixture = JsonRecord & {
  schemaVersion: typeof REPLAY_SCHEMA_VERSION;
  provenance: "reconstructed_from_persisted_decision_sources";
  actor: "runner" | "corp";
  stateVersion: number;
  stateHash: string;
  input: JsonRecord;
  runtime: JsonRecord;
  validation: Record<(typeof REQUIRED_VALIDATIONS)[number], true>;
};

export type AiDecisionReplayExportRequest = {
  matchId: string;
  decisionIndex: number;
};

export function decisionAnalysisUrl(
  serverBaseUrl: string,
  request: AiDecisionReplayExportRequest,
): URL {
  assertMatchId(request.matchId);
  assertDecisionIndex(request.decisionIndex);
  const baseUrl = new URL(serverBaseUrl);
  assertLocalAnalysisBaseUrl(baseUrl);
  return new URL(
    `/api/storage/maintenance/analysis/matches/${encodeURIComponent(request.matchId)}/decisions/${request.decisionIndex}`,
    baseUrl,
  );
}

export function validatedReplayFixtureFromDecisionAnalysis(
  payload: unknown,
  request: AiDecisionReplayExportRequest,
): ExportedAiDecisionReplayFixture {
  assertMatchId(request.matchId);
  assertDecisionIndex(request.decisionIndex);
  const context = requiredRecord(payload, "decision_analysis_response_invalid");
  if (context.schemaVersion !== ANALYSIS_SCHEMA_VERSION) {
    throw new Error("decision_analysis_schema_unsupported");
  }

  const decision = requiredRecord(
    context.decision,
    "decision_analysis_decision_missing",
  );
  if (decision.matchId !== request.matchId) {
    throw new Error("decision_analysis_match_binding_mismatch");
  }
  if (decision.decisionIndex !== request.decisionIndex) {
    throw new Error("decision_analysis_index_binding_mismatch");
  }

  const replay = requiredRecord(
    context.checkpointReplay,
    "decision_checkpoint_replay_missing",
  );
  if (replay.schemaVersion !== REPLAY_SCHEMA_VERSION) {
    throw new Error("decision_checkpoint_replay_schema_unsupported");
  }
  if (replay.provenance !== "reconstructed_from_persisted_decision_sources") {
    const reason =
      typeof replay.reason === "string" ? replay.reason : "unknown";
    throw new Error(`decision_checkpoint_replay_unavailable:${reason}`);
  }

  const actor = requiredSide(replay.actor, "decision_checkpoint_actor_invalid");
  const stateVersion = requiredNonNegativeInteger(
    replay.stateVersion,
    "decision_checkpoint_state_version_invalid",
  );
  requiredNonEmptyString(
    replay.stateHash,
    "decision_checkpoint_state_hash_invalid",
  );
  const input = requiredRecord(
    replay.input,
    "decision_checkpoint_input_missing",
  );
  const runtime = requiredRecord(
    replay.runtime,
    "decision_checkpoint_runtime_missing",
  );
  if (runtime.schemaVersion !== "ai-runtime-checkpoint-v1") {
    throw new Error("decision_checkpoint_runtime_schema_unsupported");
  }
  const validation = requiredRecord(
    replay.validation,
    "decision_checkpoint_validation_missing",
  );

  for (const key of REQUIRED_VALIDATIONS) {
    if (validation[key] !== true) {
      throw new Error(`decision_checkpoint_validation_failed:${key}`);
    }
  }

  if (input.matchId !== request.matchId) {
    throw new Error("decision_checkpoint_input_match_binding_mismatch");
  }
  if (input.side !== actor) {
    throw new Error("decision_checkpoint_input_actor_binding_mismatch");
  }
  if (!Array.isArray(input.legalActions)) {
    throw new Error("decision_checkpoint_legal_actions_missing");
  }
  const playerView = requiredRecord(
    input.playerView,
    "decision_checkpoint_player_view_missing",
  );
  if (playerView.side !== actor) {
    throw new Error("decision_checkpoint_player_view_actor_binding_mismatch");
  }
  if (playerView.stateVersion !== stateVersion) {
    throw new Error("decision_checkpoint_player_view_state_binding_mismatch");
  }

  const selectedActionId = decision.selectedActionId;
  if (typeof selectedActionId !== "string" || selectedActionId.length === 0) {
    throw new Error("decision_checkpoint_observed_action_missing");
  }
  if (
    !input.legalActions.some(
      (action) => isRecord(action) && action.actionId === selectedActionId,
    )
  ) {
    throw new Error("decision_checkpoint_observed_action_not_legal");
  }

  return structuredClone(replay) as ExportedAiDecisionReplayFixture;
}

export async function loadDecisionReplayFixture(params: {
  serverBaseUrl: string;
  request: AiDecisionReplayExportRequest;
  fetchImplementation?: typeof fetch;
}): Promise<{
  fixture: ExportedAiDecisionReplayFixture;
  observedActionId: string;
}> {
  const url = decisionAnalysisUrl(params.serverBaseUrl, params.request);
  const requestFetch = params.fetchImplementation ?? fetch;
  const response = await requestFetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`maintenance_analysis_request_failed:${response.status}`);
  }
  const payload = (await response.json()) as unknown;
  const fixture = validatedReplayFixtureFromDecisionAnalysis(
    payload,
    params.request,
  );
  const decision = requiredRecord(
    requiredRecord(payload, "decision_analysis_response_invalid").decision,
    "decision_analysis_decision_missing",
  );
  return {
    fixture,
    observedActionId: requiredNonEmptyString(
      decision.selectedActionId,
      "decision_checkpoint_observed_action_missing",
    ),
  };
}

export function writeDecisionReplayFixture(
  outputPath: string,
  fixture: ExportedAiDecisionReplayFixture,
): string {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(fixture, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  return resolvedPath;
}

type CliArgs = AiDecisionReplayExportRequest & {
  serverBaseUrl: string;
  outputPath: string;
};

export function parseAiDecisionReplayExportArgs(values: string[]): CliArgs {
  const arguments_ = values[0] === "--" ? values.slice(1) : values;
  const value = (name: string): string => {
    const index = arguments_.indexOf(name);
    const result = index >= 0 ? arguments_[index + 1] : undefined;
    if (!result) throw new Error(`missing_argument:${name}`);
    return result;
  };
  const knownArguments = new Set([
    "--match-id",
    "--decision-index",
    "--out",
    "--server-base-url",
  ]);
  for (let index = 0; index < arguments_.length; index += 2) {
    if (!knownArguments.has(arguments_[index] ?? "")) {
      throw new Error(`unknown_argument:${arguments_[index] ?? ""}`);
    }
    if (arguments_[index + 1] === undefined) {
      throw new Error(`missing_argument:${arguments_[index]}`);
    }
  }

  const matchId = value("--match-id");
  const decisionIndex = Number(value("--decision-index"));
  assertMatchId(matchId);
  assertDecisionIndex(decisionIndex);
  return {
    matchId,
    decisionIndex,
    outputPath: value("--out"),
    serverBaseUrl:
      optionalValue(arguments_, "--server-base-url") ??
      process.env.NETGRID_SERVER_BASE_URL ??
      "http://127.0.0.1:8787",
  };
}

async function main(): Promise<void> {
  const args = parseAiDecisionReplayExportArgs(process.argv.slice(2));
  const { fixture, observedActionId } = await loadDecisionReplayFixture({
    serverBaseUrl: args.serverBaseUrl,
    request: args,
  });
  writeDecisionReplayFixture(args.outputPath, fixture);
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      schemaVersion: fixture.schemaVersion,
      matchId: args.matchId,
      decisionIndex: args.decisionIndex,
      actor: fixture.actor,
      stateVersion: fixture.stateVersion,
      stateHash: fixture.stateHash,
      observedActionId,
      out: args.outputPath,
      expectationIncluded: false,
      dataClass: "D6_ai_debug_data",
    })}\n`,
  );
}

function optionalValue(values: string[], name: string): string | undefined {
  const index = values.indexOf(name);
  return index >= 0 ? values[index + 1] : undefined;
}

function assertMatchId(matchId: string): void {
  if (!/^match_[a-f0-9]{16}$/.test(matchId)) {
    throw new Error("invalid_argument:--match-id");
  }
}

function assertDecisionIndex(decisionIndex: number): void {
  if (!Number.isInteger(decisionIndex) || decisionIndex <= 0) {
    throw new Error("invalid_argument:--decision-index");
  }
}

function assertLocalAnalysisBaseUrl(url: URL): void {
  const loopbackHosts = new Set(["127.0.0.1", "[::1]", "::1", "localhost"]);
  if (
    url.protocol !== "http:" ||
    !loopbackHosts.has(url.hostname) ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new Error("maintenance_analysis_base_url_must_be_local_loopback");
  }
}

function requiredRecord(value: unknown, errorCode: string): JsonRecord {
  if (!isRecord(value)) throw new Error(errorCode);
  return value;
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requiredSide(value: unknown, errorCode: string): "runner" | "corp" {
  if (value !== "runner" && value !== "corp") throw new Error(errorCode);
  return value;
}

function requiredNonNegativeInteger(value: unknown, errorCode: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(errorCode);
  }
  return value as number;
}

function requiredNonEmptyString(value: unknown, errorCode: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(errorCode);
  }
  return value;
}

const invokedScriptPath = process.argv[1];
if (
  invokedScriptPath &&
  import.meta.url === pathToFileURL(resolve(invokedScriptPath)).href
) {
  await main();
}
