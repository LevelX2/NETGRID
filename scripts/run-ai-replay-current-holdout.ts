import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { buildAiDecisionInput, chooseAiAction } from "../packages/ai/src/index";
import { getLegalActions } from "../packages/engine/src/index";
import type {
  AiDecision,
  GameEvent,
  GameState,
  LegalAction,
  Side,
} from "../packages/shared/src/index";
import {
  buildCurrentAiHoldoutRunnerReport,
  currentAiHoldoutActionDigest,
  currentAiHoldoutCaseKey,
  renderCurrentAiHoldoutRunnerMarkdown,
  type CurrentAiHoldoutEvaluation,
} from "../packages/ai/src/evaluation/current-ai-holdout-runner";
import { replayDecisionCaseSplit } from "../packages/ai/src/evaluation/replay-decision-case-extraction";
import { assertSemanticObjectSideSafe } from "../packages/ai/src/diagnostics/semantic-redaction";

type TraceRow = {
  matchId: string;
  mode: string;
  status: string;
  traceId: string;
  eventId: string;
  stateVersion: number;
  matchVersion: number;
  side: Side;
  turn: number;
  decisionIndex: number;
  selectedActionId?: string | null;
  selectedActionType?: string | null;
  planKind?: string | null;
  score?: number | null;
  confidence?: number | null;
  createdAt: string;
  traceJson: string;
};

type SnapshotRow = {
  stateVersion: number;
  matchVersion: number;
  gameStateJson: string;
};

type MatchRecordRow = {
  recordJson: string;
};

type PrivateDeckSnapshotRow = {
  privateDeckSnapshotsJson?: string | null;
};

type DeckSnapshots = {
  runner?: unknown;
  corp?: unknown;
};

const repoRoot = findRepoRoot(process.cwd());
const runId = safeRunId(optionValue("--run-id") ?? "latest");
const dbPathOption = optionValue("--db");
const cutoff = optionValue("--cutoff") ?? optionValue("--max-created-at");
const outputDir = resolve(
  repoRoot,
  optionValue("--out-dir") ?? `data/local/ai-replay/${runId}`,
);
const summaryOut = resolve(
  repoRoot,
  optionValue("--summary-out") ??
    `docs/reviews/ai/ai-replay-current-holdout-runner-${runId}.md`,
);

if (!dbPathOption) {
  throw new Error(
    "Missing required --db <path>. Current-AI holdout execution requires an explicitly provided SQLite database.",
  );
}

const dbPath = resolve(repoRoot, dbPathOption);
const db = new DatabaseSync(dbPath, { readOnly: true });
const traces = selectHoldoutTraces(db, cutoff);
const evaluations = traces.map((trace) => evaluateTrace(db, trace));
const report = buildCurrentAiHoldoutRunnerReport(evaluations, {
  runId,
  sourceLabel: sourceLabelFor(dbPath),
  dbProvided: true,
  ...(cutoff ? { cutoff } : {}),
  generatedAt: new Date().toISOString(),
  fixedPattern: {
    historicalActionType: "draw_card",
    historicalPlanKind: "runner.obtain_breaker_coverage",
    currentActionType: "start_run",
    currentPlanKind: "simple_hq_or_rnd_pressure",
  },
});

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  resolve(outputDir, `${runId}-current-ai-holdout-report.json`),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  resolve(outputDir, `${runId}-current-ai-holdout-report.md`),
  renderCurrentAiHoldoutRunnerMarkdown(report),
  "utf8",
);
mkdirSync(dirname(summaryOut), { recursive: true });
writeFileSync(summaryOut, renderCurrentAiHoldoutRunnerMarkdown(report), "utf8");
console.log(JSON.stringify({ outputDir, summaryOut, aggregate: report.aggregate }, null, 2));

function selectHoldoutTraces(db: DatabaseSync, maxCreatedAt?: string): TraceRow[] {
  const sql = `${selectTraceRowsSql()}
    ${maxCreatedAt ? "WHERE t.created_at <= ?" : ""}
    ORDER BY m.created_at ASC, t.decision_index ASC, t.trace_id ASC`;
  const rows = (maxCreatedAt
    ? db.prepare(sql).all(maxCreatedAt)
    : db.prepare(sql).all()) as TraceRow[];
  return rows
    .map((row) => ({
      ...row,
      stateVersion: Number(row.stateVersion),
      matchVersion: Number(row.matchVersion),
      turn: Number(row.turn),
      decisionIndex: Number(row.decisionIndex),
    }))
    .filter((row) => replayDecisionCaseSplit(row.matchId) === "holdout");
}

function selectTraceRowsSql(): string {
  return `SELECT
      m.match_id AS matchId,
      m.mode AS mode,
      m.status AS status,
      t.trace_id AS traceId,
      t.event_id AS eventId,
      t.state_version AS stateVersion,
      t.match_version AS matchVersion,
      t.side AS side,
      t.turn AS turn,
      t.decision_index AS decisionIndex,
      t.selected_action_id AS selectedActionId,
      t.selected_action_type AS selectedActionType,
      t.plan_kind AS planKind,
      t.score AS score,
      t.confidence AS confidence,
      t.created_at AS createdAt,
      t.trace_json AS traceJson
    FROM ai_decision_traces t
    JOIN matches m ON m.match_id = t.match_id`;
}

function evaluateTrace(db: DatabaseSync, trace: TraceRow): CurrentAiHoldoutEvaluation {
  const base = baseEvaluation(trace);
  try {
    const state = stateForTrace(db, trace);
    if (!state) {
      return {
        ...base,
        status: "reconstruction_error",
        errorCode: "snapshot_missing",
      };
    }
    const legalActions = getLegalActions(state, trace.side);
    if (legalActions.length === 0) {
      return {
        ...base,
        status: "reconstruction_error",
        errorCode: "legal_actions_missing",
      };
    }
    const controller = aiControllerFor(db, trace.matchId, trace.side);
    const ownDeckSnapshot = ownDeckSnapshotFor(db, trace.matchId, trace.side);
    const input = buildAiDecisionInput(state, trace.side, {
      difficulty: controller?.difficulty ?? "normal",
      profileId:
        controller?.profileId ??
        `${trace.side}-current-holdout-ai-${controller?.difficulty ?? "normal"}`,
      decisionId: `${trace.matchId}:${state.stateVersion}:${trace.side}:current-holdout`,
      actionNumber: state.stateVersion,
      ...(ownDeckSnapshot ? { ownDeckSnapshot } : {}),
    });
    assertSemanticObjectSideSafe(input, "CurrentAiHoldoutAiInput");
    const decision = chooseAiAction(input);
    const selected = legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    return {
      ...base,
      status: "evaluated",
      current: currentDecisionSummary(decision, selected, legalActions),
      changedDecision:
        (selected?.actionId ?? decision.actionId) !==
        (trace.selectedActionId ?? ""),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...base,
      status: message.includes("forbidden hidden-info marker")
        ? "redaction_violation"
        : "ai_error",
      errorCode: safeErrorCode(message),
    };
  }
}

function baseEvaluation(trace: TraceRow): CurrentAiHoldoutEvaluation {
  const raw = safeTraceJson(trace.traceJson);
  const challenger = rankedAlternative(raw, 0);
  return {
    status: "reconstruction_error",
    caseKey: currentAiHoldoutCaseKey({
      matchId: trace.matchId,
      traceId: trace.traceId,
      eventId: trace.eventId,
      stateVersion: trace.stateVersion,
      decisionIndex: trace.decisionIndex,
    }),
    side: trace.side,
    historical: {
      actionType: trace.selectedActionType ?? "none",
      ...(trace.selectedActionId
        ? { actionIdDigest: currentAiHoldoutActionDigest(trace.selectedActionId) }
        : {}),
      ...(trace.planKind ? { planKind: trace.planKind } : {}),
      ...(challenger?.selectedActionType
        ? { challengerActionType: challenger.selectedActionType }
        : {}),
      ...(challenger?.planKind ? { challengerPlanKind: challenger.planKind } : {}),
    },
  };
}

function safeTraceJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function rankedAlternative(
  raw: Record<string, unknown>,
  index: number,
): { selectedActionType?: string; planKind?: string } | undefined {
  const alternatives = raw.rankedAlternatives;
  if (!Array.isArray(alternatives)) return undefined;
  const entry = alternatives[index];
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    return undefined;
  }
  const record = entry as Record<string, unknown>;
  return {
    ...(typeof record.selectedActionType === "string"
      ? { selectedActionType: record.selectedActionType }
      : {}),
    ...(typeof record.planKind === "string" ? { planKind: record.planKind } : {}),
  };
}

function stateForTrace(db: DatabaseSync, trace: TraceRow): GameState | undefined {
  const row = db
    .prepare(
      `SELECT state_version AS stateVersion, match_version AS matchVersion, game_state_json AS gameStateJson
       FROM state_snapshots
       WHERE match_id = ? AND state_version = ?
       ORDER BY match_version DESC
       LIMIT 1`,
    )
    .get(trace.matchId, trace.stateVersion) as SnapshotRow | undefined;
  if (!row?.gameStateJson) return undefined;
  const state = JSON.parse(row.gameStateJson) as GameState;
  state.eventLog = engineEventsFor(db, trace.matchId).filter(
    (event) => event.stateVersionAfter <= state.stateVersion,
  );
  return state;
}

function engineEventsFor(db: DatabaseSync, matchId: string): GameEvent[] {
  const rows = db
    .prepare(
      "SELECT event_json AS eventJson FROM engine_events WHERE match_id = ? ORDER BY event_index ASC",
    )
    .all(matchId) as Array<{ eventJson: string }>;
  return rows.map((row) => JSON.parse(row.eventJson) as GameEvent);
}

function aiControllerFor(
  db: DatabaseSync,
  matchId: string,
  side: Side,
): { difficulty?: "easy" | "normal" | "hard"; profileId?: string } | undefined {
  const row = db
    .prepare("SELECT record_json AS recordJson FROM matches WHERE match_id = ?")
    .get(matchId) as MatchRecordRow | undefined;
  if (!row?.recordJson) return undefined;
  const record = JSON.parse(row.recordJson) as {
    match?: {
      aiControllers?: Partial<
        Record<Side, { difficulty?: "easy" | "normal" | "hard"; profileId?: string }>
      >;
    };
  };
  return record.match?.aiControllers?.[side];
}

function ownDeckSnapshotFor(
  db: DatabaseSync,
  matchId: string,
  side: Side,
): Parameters<typeof buildAiDecisionInput>[2]["ownDeckSnapshot"] | undefined {
  const row = db
    .prepare(
      "SELECT private_deck_snapshots_json AS privateDeckSnapshotsJson FROM private_deck_snapshots WHERE match_id = ?",
    )
    .get(matchId) as PrivateDeckSnapshotRow | undefined;
  if (!row?.privateDeckSnapshotsJson) return undefined;
  const snapshots = JSON.parse(row.privateDeckSnapshotsJson) as DeckSnapshots;
  return snapshots[side] as Parameters<typeof buildAiDecisionInput>[2]["ownDeckSnapshot"];
}

function currentDecisionSummary(
  decision: AiDecision,
  selected: LegalAction | undefined,
  legalActions: readonly LegalAction[],
): NonNullable<CurrentAiHoldoutEvaluation["current"]> {
  return {
    ...(selected ? { actionType: selected.type } : {}),
    actionIdDigest: currentAiHoldoutActionDigest(decision.actionId),
    ...(decision.decisionDebug?.planKind
      ? { planKind: decision.decisionDebug.planKind }
      : {}),
    reasonCode: decision.reasonCode,
    ...(decision.confidence !== undefined ? { confidence: decision.confidence } : {}),
    legalActionCount: legalActions.length,
    legal: Boolean(selected),
  };
}

function optionValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function sourceLabelFor(path: string): string {
  const repoRelative = relative(repoRoot, resolve(path));
  return repoRelative.startsWith("..")
    ? "local_sqlite_runtime:external_sqlite"
    : `local_sqlite_runtime:${repoRelative.replaceAll("\\", "/")}`;
}

function safeRunId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "-").slice(0, 80) || "latest";
}

function safeErrorCode(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_.:-]/g, "_")
    .slice(0, 80);
}

function findRepoRoot(start: string): string {
  let current = resolve(start);
  for (;;) {
    try {
      const packageJson = JSON.parse(
        readFileSync(join(current, "package.json"), "utf8"),
      ) as { name?: string };
      if (packageJson.name === "netgrid-app") return current;
    } catch {
      // Continue walking up.
    }
    const parent = dirname(current);
    if (parent === current) throw new Error(`Could not find NETGRID repo root from ${start}`);
    current = parent;
  }
}
