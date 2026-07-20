import { writeFileSync } from "node:fs";
import { listMatchProgressionBenchmarkDeckSlots } from "../packages/ai/src/simulation";
import { runAiBehaviorBaselineSlot } from "./ai-behavior-baseline-slot";

const args = parseArgs(process.argv.slice(2));
const slot = listMatchProgressionBenchmarkDeckSlots().find(
  (candidate) => candidate.slotId === args.slotId,
);
if (!slot) throw new Error(`Unknown AI behavior baseline slot: ${args.slotId}`);
if (slot.status !== "runnable")
  throw new Error(
    `AI behavior baseline slot ${args.slotId} is ${slot.status}.`,
  );

const run = runAiBehaviorBaselineSlot({
  slot,
  seeds: args.seeds,
  maxActions: args.maxActions,
  maxFindings: args.maxFindings,
});
writeFileSync(
  args.rawOut,
  `${JSON.stringify({ descriptor: run.descriptor, trace: run.trace })}\n`,
  "utf8",
);
writeFileSync(args.resultOut, `${JSON.stringify(run.result)}\n`, "utf8");

function parseArgs(argv: string[]): {
  slotId: string;
  seeds: string[];
  maxActions: number;
  maxFindings: number;
  rawOut: string;
  resultOut: string;
} {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name?.startsWith("--") || !value)
      throw new Error(`Invalid baseline worker argument at index ${index}.`);
    values.set(name, value);
  }
  const slotId = required(values, "--slot-id");
  const seeds = required(values, "--seeds")
    .split(",")
    .filter((seed) => seed.length > 0);
  const maxActions = Number.parseInt(required(values, "--max-actions"), 10);
  const maxFindings = Number.parseInt(required(values, "--max-findings"), 10);
  if (seeds.length === 0) throw new Error("Baseline worker requires seeds.");
  if (!Number.isInteger(maxActions) || maxActions < 1)
    throw new Error("Baseline worker maxActions must be positive.");
  if (!Number.isInteger(maxFindings) || maxFindings < 1)
    throw new Error("Baseline worker maxFindings must be positive.");
  return {
    slotId,
    seeds,
    maxActions,
    maxFindings,
    rawOut: required(values, "--raw-out"),
    resultOut: required(values, "--result-out"),
  };
}

function required(values: ReadonlyMap<string, string>, name: string): string {
  const value = values.get(name);
  if (!value) throw new Error(`Missing baseline worker argument ${name}.`);
  return value;
}
