import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  evaluatePracticalTacticBenchmark,
  frozenLegacyPracticalTacticSelector,
  runAiSelfplayTraceMining,
} from "../packages/ai/src/index";
import { applyPracticalTacticOverlay } from "../packages/ai/src/runtime/practical-tactic-overlay";
import type { AiDecision, AiDecisionInput } from "@netgrid/shared";

const DEFAULT_SEEDS = [
  "ai-v143-tuning-001",
  "ai-v143-tuning-002",
  "ai-v143-tuning-003",
  "ai-v143-tuning-004",
  "ai-v143-tuning-005",
];

const args = parseArgs(process.argv.slice(2));
const repoRoot = findRepoRoot(process.cwd());
const outPath = resolve(repoRoot, args.out);
const seeds = args.seeds ?? DEFAULT_SEEDS;
const maxActions = args.maxActions ?? 160;
const tacticLegacy = evaluatePracticalTacticBenchmark(
  frozenLegacyPracticalTacticSelector,
);
const tacticCandidate = evaluatePracticalTacticBenchmark((input) =>
  applyPracticalTacticOverlay(input, frozenLegacyDecision(input), {
    practicalTacticOverlay: { enabled: true },
  }),
);

const legacyVsLegacy = runAiSelfplayTraceMining({
  seeds,
  maxActions,
  maxFindings: 50,
  runnerControllerMode: "basic_runner_ai",
  corpControllerMode: "basic_corp_ai",
});

const candidateRunnerVsLegacyCorp = runAiSelfplayTraceMining({
  seeds,
  maxActions,
  maxFindings: 50,
  runnerControllerMode: "current_candidate",
  corpControllerMode: "basic_corp_ai",
  aiDecisionRuntimeOptions: {
    practicalTacticOverlay: { enabled: true },
  },
});

const legacyRunnerVsCandidateCorp = runAiSelfplayTraceMining({
  seeds,
  maxActions,
  maxFindings: 50,
  runnerControllerMode: "basic_runner_ai",
  corpControllerMode: "current_candidate",
  aiDecisionRuntimeOptions: {
    practicalTacticOverlay: { enabled: true },
  },
});

const output = {
  schemaVersion: "ai224-practical-tactic-paired-benchmark-v1",
  generatedAt: new Date().toISOString(),
  config: {
    seeds,
    maxActions,
    candidate: "current_candidate + practicalTacticOverlay.enabled",
    legacy: "basic_runner_ai/basic_corp_ai",
  },
  tacticBenchmark: {
    legacy: tacticLegacy,
    candidate: tacticCandidate,
    hitRateDelta: round(tacticCandidate.hitRate - tacticLegacy.hitRate),
  },
  pairedMatches: {
    legacyVsLegacy: summarize(legacyVsLegacy),
    candidateRunnerVsLegacyCorp: summarize(candidateRunnerVsLegacyCorp),
    legacyRunnerVsCandidateCorp: summarize(legacyRunnerVsCandidateCorp),
  },
  decision: decision(),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify(output.decision, null, 2));

function decision() {
  const aggregates = [
    candidateRunnerVsLegacyCorp.aggregate,
    legacyRunnerVsCandidateCorp.aggregate,
  ];
  const safetyGreen = aggregates.every(
    (aggregate) =>
      aggregate.illegalActions === 0 &&
      aggregate.replayFailures === 0 &&
      aggregate.redactionSafe === true,
  );
  const tacticBetter = tacticCandidate.hitRate - tacticLegacy.hitRate >= 0.2;
  const practicalMetricBetter =
    candidateRunnerVsLegacyCorp.aggregate.actionLimitReached <
      legacyVsLegacy.aggregate.actionLimitReached ||
    legacyRunnerVsCandidateCorp.aggregate.actionLimitReached <
      legacyVsLegacy.aggregate.actionLimitReached ||
    candidateRunnerVsLegacyCorp.aggregate.runnerAgendaSteals >
      legacyVsLegacy.aggregate.runnerAgendaSteals ||
    legacyRunnerVsCandidateCorp.aggregate.corpAgendaScores >
      legacyVsLegacy.aggregate.corpAgendaScores;
  const mergeAllowed = safetyGreen && tacticBetter && practicalMetricBetter;
  return {
    mergeAllowed,
    recommendation: mergeAllowed ? "keep_candidate_opt_in" : "keep_default_off",
    safetyGreen,
    tacticBetter,
    practicalMetricBetter,
    evidence: [
      `tactic_hit_rate_delta:${round(tacticCandidate.hitRate - tacticLegacy.hitRate)}`,
      `legacy_action_limits:${legacyVsLegacy.aggregate.actionLimitReached}`,
      `candidate_runner_action_limits:${candidateRunnerVsLegacyCorp.aggregate.actionLimitReached}`,
      `candidate_corp_action_limits:${legacyRunnerVsCandidateCorp.aggregate.actionLimitReached}`,
      `legacy_runner_steals:${legacyVsLegacy.aggregate.runnerAgendaSteals}`,
      `candidate_runner_steals:${candidateRunnerVsLegacyCorp.aggregate.runnerAgendaSteals}`,
      `legacy_corp_scores:${legacyVsLegacy.aggregate.corpAgendaScores}`,
      `candidate_corp_scores:${legacyRunnerVsCandidateCorp.aggregate.corpAgendaScores}`,
      `candidate_runner_illegal:${candidateRunnerVsLegacyCorp.aggregate.illegalActions}`,
      `candidate_corp_illegal:${legacyRunnerVsCandidateCorp.aggregate.illegalActions}`,
      `candidate_runner_replay_failures:${candidateRunnerVsLegacyCorp.aggregate.replayFailures}`,
      `candidate_corp_replay_failures:${legacyRunnerVsCandidateCorp.aggregate.replayFailures}`,
    ],
  };
}

function summarize(result: ReturnType<typeof runAiSelfplayTraceMining>) {
  return {
    aggregate: result.aggregate,
    summaries: result.summaries.map((summary) => ({
      seed: summary.seed,
      winner: summary.winner,
      actions: summary.actions,
      turns: summary.turns,
      finalAgendaPoints: summary.finalAgendaPoints,
      replayOk: summary.replayOk,
      redactionSafe: summary.redactionSafe,
      actionLimitReached: summary.actionLimitReached,
    })),
  };
}

function frozenLegacyDecision(input: AiDecisionInput): AiDecision {
  const actionId = frozenLegacyPracticalTacticSelector(input).actionId;
  return {
    actionId,
    reasonCode: "frozen_legacy.practical_tactic_reference",
    explanation: "Frozen legacy reference for AI224 paired benchmark.",
    consideredActionIds: input.legalActions.map((action) => action.actionId),
    fallbackUsed: false,
  };
}

function parseArgs(argv: string[]): {
  out: string;
  seeds?: string[];
  maxActions?: number;
} {
  let out: string | undefined;
  let seeds: string[] | undefined;
  let maxActions: number | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--out" && next) {
      out = next;
      index += 1;
      continue;
    }
    if (arg === "--seeds" && next) {
      seeds = next
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      index += 1;
      continue;
    }
    if (arg === "--max-actions" && next) {
      maxActions = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
  }
  if (!out) throw new Error("Missing required --out <path> argument.");
  return {
    out,
    ...(seeds && seeds.length > 0 ? { seeds } : {}),
    ...(Number.isFinite(maxActions) ? { maxActions } : {}),
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
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
    if (parent === current) {
      throw new Error(`Could not find NETGRID repo root from ${start}`);
    }
    current = parent;
  }
}
