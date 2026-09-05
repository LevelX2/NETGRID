import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chooseAiAction } from "../packages/ai/src/ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../packages/ai/src/evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../packages/ai/src/plans/resident-plan-portfolio-memory";

const directory = resolve(
  process.argv[2] ?? "tmp/hidden-node/checkpoint-original",
);
const captures = JSON.parse(
  readFileSync(resolve(directory, "001.captures.json"), "utf8"),
);
const results = captures.map((capture) => {
  const decide = () => {
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      capture.input,
      capture.deckSnapshot.deckSnapshotId,
      capture.runtime,
    );
    return chooseAiAction(structuredClone(capture.input));
  };
  const first = decide();
  const second = decide();
  if (JSON.stringify(first) !== JSON.stringify(second))
    throw new Error(`nondeterministic_checkpoint:${capture.actionIndex}`);
  const result = {
    actionIndex: capture.actionIndex,
    actionId: first.actionId,
    reason: first.reasonCode,
    deterministic: true,
    planFirst: first.decisionDebug?.planFirstDecision,
  };
  process.stdout.write(
    JSON.stringify({
      actionIndex: capture.actionIndex,
      actionId: first.actionId,
      root: result.planFirst?.rootPlanInstanceId,
      plans: result.planFirst?.portfolio.map((plan) => ({
        id: plan.instanceId,
        viability: plan.viability,
        needs: plan.openNeedIds,
      })),
    }) + "\n",
  );
  return result;
});
writeFileSync(
  resolve(directory, "inspection.json"),
  JSON.stringify(results, null, 2),
);
