import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  formatMatchProgressionBenchmarkSuiteReport,
  listMatchProgressionBenchmarkDeckSlots,
  runMatchProgressionBenchmarkSuite,
  type SimulationBenchmarkProfileId,
} from "../packages/ai/src/index";

const PROFILE_IDS = [
  "random_legal_bot",
  "basic_corp_ai",
  "basic_runner_ai",
  "plan_corp_v1_4_0",
  "plan_runner_v1_4_1",
  "belief_ai_v1_4_2",
  "current_candidate",
] as const satisfies readonly SimulationBenchmarkProfileId[];

const repoRoot = findRepoRoot(process.cwd());
const args = parseArgs(process.argv.slice(2));

if (args.listSlots) {
  console.log(JSON.stringify(listMatchProgressionBenchmarkDeckSlots(), null, 2));
  process.exit(0);
}

if (!args.outJson) {
  throw new Error("Missing required --out-json <path> argument.");
}

const suite = runMatchProgressionBenchmarkSuite({
  includeHoldout: args.includeHoldout,
  maxActions: args.maxActions,
  baselineProfile: args.baselineProfile,
  candidateProfile: args.candidateProfile,
  ...(args.comparisonProfiles
    ? { comparisonProfiles: args.comparisonProfiles }
    : {}),
  ...(args.seeds ? { seeds: args.seeds } : {}),
  ...(args.slotIds ? { slotIds: args.slotIds } : {}),
});
const report = formatMatchProgressionBenchmarkSuiteReport(suite);
const outJson = resolve(repoRoot, args.outJson);
mkdirSync(dirname(outJson), { recursive: true });
writeFileSync(outJson, `${JSON.stringify(suite, null, 2)}\n`, "utf8");

if (args.outMd) {
  const outMd = resolve(repoRoot, args.outMd);
  mkdirSync(dirname(outMd), { recursive: true });
  writeFileSync(outMd, report, "utf8");
}

console.log(
  JSON.stringify(
    {
      outJson,
      ...(args.outMd ? { outMd: resolve(repoRoot, args.outMd) } : {}),
      slots: suite.slots.length,
      runnableSlots: suite.slots.filter((slot) => slot.status === "runnable")
        .length,
      pendingSlots: suite.slots.filter((slot) => slot.status === "pending")
        .length,
      disabledSlots: suite.slots.filter((slot) => slot.status === "disabled")
        .length,
      seeds: suite.seeds.length,
      ...(args.slotIds ? { slotIds: args.slotIds } : {}),
    },
    null,
    2,
  ),
);

function parseArgs(argv: string[]): {
  outJson?: string;
  outMd?: string;
  maxActions?: number;
  includeHoldout: boolean;
  baselineProfile?: SimulationBenchmarkProfileId;
  candidateProfile?: SimulationBenchmarkProfileId;
  comparisonProfiles?: SimulationBenchmarkProfileId[];
  seeds?: string[];
  slotIds?: string[];
  listSlots: boolean;
} {
  let outJson: string | undefined;
  let outMd: string | undefined;
  let maxActions: number | undefined;
  let baselineProfile: SimulationBenchmarkProfileId | undefined;
  let candidateProfile: SimulationBenchmarkProfileId | undefined;
  let comparisonProfiles: SimulationBenchmarkProfileId[] | undefined;
  let seeds: string[] | undefined;
  let slotIds: string[] | undefined;
  let includeHoldout = false;
  let listSlots = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--out-json" && next) {
      outJson = next;
      index += 1;
      continue;
    }
    if (arg === "--out-md" && next) {
      outMd = next;
      index += 1;
      continue;
    }
    if (arg === "--max-actions" && next) {
      maxActions = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (arg === "--baseline-profile" && next) {
      baselineProfile = parseProfile(next, arg);
      index += 1;
      continue;
    }
    if (arg === "--candidate-profile" && next) {
      candidateProfile = parseProfile(next, arg);
      index += 1;
      continue;
    }
    if (arg === "--comparison-profiles" && next) {
      comparisonProfiles = next
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map((value) => parseProfile(value, arg));
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
    if (arg === "--slot-ids" && next) {
      slotIds = next
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      index += 1;
      continue;
    }
    if (arg === "--include-holdout") {
      includeHoldout = true;
      continue;
    }
    if (arg === "--list-slots") {
      listSlots = true;
      continue;
    }
  }

  if (
    maxActions !== undefined &&
    (!Number.isFinite(maxActions) || maxActions <= 0)
  ) {
    throw new Error(`Invalid --max-actions ${maxActions}.`);
  }

  return {
    ...(outJson ? { outJson } : {}),
    ...(outMd ? { outMd } : {}),
    ...(maxActions !== undefined ? { maxActions } : {}),
    includeHoldout,
    ...(baselineProfile ? { baselineProfile } : {}),
    ...(candidateProfile ? { candidateProfile } : {}),
    ...(comparisonProfiles ? { comparisonProfiles } : {}),
    ...(seeds ? { seeds } : {}),
    ...(slotIds ? { slotIds } : {}),
    listSlots,
  };
}

function parseProfile(
  value: string,
  optionName: string,
): SimulationBenchmarkProfileId {
  if (PROFILE_IDS.includes(value as (typeof PROFILE_IDS)[number])) {
    return value as SimulationBenchmarkProfileId;
  }
  throw new Error(
    `Invalid ${optionName} ${value}; expected one of ${PROFILE_IDS.join(", ")}.`,
  );
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
