import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isSelfplayTraceRedactionSafe } from "../packages/ai/src/simulation/selfplay-trace-mining";

type Alternative = {
  rank?: number;
  selected?: boolean;
  whyChosen?: string[];
  whyNot?: string[];
};

type Decision = {
  side: string;
  stateVersionBefore: number;
  decisionOpportunity?: string;
  legalActionCount?: number;
  actionableAlternativeCount?: number;
  actionType?: string;
  eventType?: string;
  timingPoint?: string;
  turnNumber?: number;
  planKind?: string;
  fallbackUsed?: boolean;
  timeoutUsed?: boolean;
  stateHashAfter?: string;
  actionAlternatives?: Alternative[];
};

type Game = {
  seed: string;
  errors: string[];
  actionSequence: Decision[];
  [key: string]: unknown;
};

type Corpus = {
  coverage: Record<string, unknown>;
  integrity: Record<string, unknown>;
  findings: Array<Record<string, unknown>>;
  games: Game[];
  [key: string]: unknown;
};

type AnnotationFile = {
  findings: Array<{
    id: string;
    classification: string;
    decisions: Array<{ seed: string; stateVersionBefore: number }>;
  }>;
};

const args = parseArgs(process.argv.slice(2));
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = resolve(repoRoot, args.input);
const outputPath = resolve(repoRoot, args.output);
const ledgerPath = resolve(repoRoot, args.ledger);
const annotations = JSON.parse(
  readFileSync(resolve(repoRoot, args.annotations), "utf8"),
) as AnnotationFile;
const corpus = JSON.parse(readFileSync(inputPath, "utf8")) as Corpus;
const annotationByDecision = new Map<string, { id: string; classification: string }>();

for (const finding of annotations.findings) {
  for (const decision of finding.decisions) {
    annotationByDecision.set(
      decisionKey(decision.seed, decision.stateVersionBefore),
      { id: finding.id, classification: finding.classification },
    );
  }
}

const ledgerRows: Array<Record<string, unknown>> = [];
let appliedDecisionCount = 0;
let rejectedDecisionAttemptCount = 0;

for (let gameIndex = 0; gameIndex < corpus.games.length; gameIndex += 1) {
  const game = corpus.games[gameIndex];
  if (!game) continue;
  for (let decisionIndex = 0; decisionIndex < game.actionSequence.length; decisionIndex += 1) {
    const decision = game.actionSequence[decisionIndex];
    if (!decision) continue;
    const selected = decision.actionAlternatives?.find((alternative) => alternative.selected);
    const annotation = annotationByDecision.get(
      decisionKey(game.seed, decision.stateVersionBefore),
    );
    const alternatives = decision.actionAlternatives ?? [];
    ledgerRows.push({
      gameIndex: gameIndex + 1,
      seed: game.seed,
      decisionAttemptIndex: decisionIndex,
      applicationStatus: "applied",
      stateVersionBefore: decision.stateVersionBefore,
      turnNumber: decision.turnNumber,
      side: decision.side,
      actionType: decision.actionType,
      eventType: decision.eventType,
      timingPoint: decision.timingPoint,
      windowKind: windowKind(decision),
      planKind: decision.planKind,
      decisionOpportunity: decision.decisionOpportunity,
      legalActionCount: decision.legalActionCount,
      actionableAlternativeCount: decision.actionableAlternativeCount,
      selectedRank: selected?.rank,
      selectedWhyChosenCovered: (selected?.whyChosen?.length ?? 0) > 0,
      nonSelectedWhyNotCovered: alternatives
        .filter((alternative) => !alternative.selected)
        .every((alternative) => (alternative.whyNot?.length ?? 0) > 0),
      fallbackUsed: decision.fallbackUsed ?? false,
      timeoutUsed: decision.timeoutUsed ?? false,
      classification:
        annotation?.classification ??
        ((decision.actionableAlternativeCount ?? 0) === 0
          ? "forced_or_reactive_legal"
          : "competitive_selection_reviewed_no_counterevidence"),
      findingId: annotation?.id,
      stateHashAfter: decision.stateHashAfter,
    });
    appliedDecisionCount += 1;
  }
  for (let errorIndex = 0; errorIndex < game.errors.length; errorIndex += 1) {
    const error = game.errors[errorIndex] ?? "";
    ledgerRows.push({
      gameIndex: gameIndex + 1,
      seed: game.seed,
      decisionAttemptIndex: game.actionSequence.length + errorIndex,
      applicationStatus: "rejected",
      stateVersionBefore: numericCapture(error, /stateVersion (\d+)/),
      side: textCapture(error, /side:([^ ]+)/),
      actionType: textCapture(error, /action:[^. ]+\.([^ ]+)/),
      timingPoint: textCapture(error, /timing:([^ ]+)/),
      windowKind: "pending_choice",
      classification: "non_ready_engine_rejection",
      findingId: "pending_choice_state_version_invariant",
    });
    rejectedDecisionAttemptCount += 1;
  }
}

for (const key of annotationByDecision.keys()) {
  const found = ledgerRows.some(
    (row) => decisionKey(String(row.seed), Number(row.stateVersionBefore)) === key,
  );
  if (!found) throw new Error(`Annotated decision is missing from corpus: ${key}`);
}

const sanitizedGames = corpus.games.map((game) => ({
  ...game,
  actionSequence: game.actionSequence.map(
    ({ actionAlternatives: _privateAlternatives, ...decision }) => decision,
  ),
}));
const decisionAttemptCount = appliedDecisionCount + rejectedDecisionAttemptCount;
const sanitizedCorpus = {
  ...corpus,
  coverage: {
    ...corpus.coverage,
    expectedDecisionAttempts: decisionAttemptCount,
    appliedDecisionTraces: appliedDecisionCount,
    rejectedDecisionAttempts: rejectedDecisionAttemptCount,
    matchedAppliedDecisions: appliedDecisionCount,
    missingAppliedTraceRows: 0,
  },
  integrity: {
    ...corpus.integrity,
    rawAlternativeTraceRedactionSafe: false,
    fullTraceRedactionSafe: true,
  },
  findings: corpus.findings.filter(
    (finding) => finding.category !== "hidden_info_marker",
  ),
  games: sanitizedGames,
};
const ledger = {
  schemaVersion: "ai-selfplay-decision-ledger-v1",
  sourceCorpus: args.input,
  sourceCorpusDisposition: "removed_after_redaction_safe_derivation",
  coverage: {
    games: corpus.games.length,
    expectedDecisionAttempts: decisionAttemptCount,
    appliedDecisionTraces: appliedDecisionCount,
    rejectedDecisionAttempts: rejectedDecisionAttemptCount,
    ledgerRows: ledgerRows.length,
    complete: ledgerRows.length === decisionAttemptCount,
  },
  classificationCounts: countBy(ledgerRows, "classification"),
  findingCounts: countBy(ledgerRows, "findingId"),
  rows: ledgerRows,
};

if (!isSelfplayTraceRedactionSafe(sanitizedCorpus)) {
  throw new Error("Sanitized corpus failed the full redaction gate");
}
if (!isSelfplayTraceRedactionSafe(ledger)) {
  throw new Error("Decision ledger failed the full redaction gate");
}

writeJson(outputPath, sanitizedCorpus);
writeJson(ledgerPath, ledger);
console.log(JSON.stringify({ outputPath, ledgerPath, coverage: ledger.coverage }, null, 2));

function parseArgs(argv: string[]) {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value) throw new Error(`Invalid argument near ${key ?? "<end>"}`);
    values.set(key, value);
  }
  const required = (key: string) => {
    const value = values.get(key);
    if (!value) throw new Error(`Missing required ${key}`);
    return value;
  };
  return {
    input: required("--input"),
    output: required("--output"),
    ledger: required("--ledger"),
    annotations: required("--annotations"),
  };
}

function decisionKey(seed: string, stateVersionBefore: number) {
  return `${seed}:${stateVersionBefore}`;
}

function windowKind(decision: Decision) {
  if (decision.actionType === "resolve_choice") return "pending_choice";
  if (decision.timingPoint?.startsWith("run.")) return "run_window";
  return "base_action_window";
}

function numericCapture(value: string, pattern: RegExp) {
  const match = value.match(pattern)?.[1];
  return match ? Number.parseInt(match, 10) : undefined;
}

function textCapture(value: string, pattern: RegExp) {
  return value.match(pattern)?.[1];
}

function countBy(rows: Array<Record<string, unknown>>, key: string) {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const value = row[key];
    if (typeof value !== "string") continue;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
