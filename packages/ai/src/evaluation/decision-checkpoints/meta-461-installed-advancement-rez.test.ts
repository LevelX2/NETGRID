import { expect, it } from "vitest";
import { referencesDefaultDeckCard } from "./compact-card-reference.test-support";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-461-r9-g5-d207.json";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";
function input() {
  const x = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const rt = structuredClone(
    checkpoint.runtime,
  ) as unknown as AiRuntimeCheckpointV1;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(x, x.ownDeckSnapshot!.deckSnapshotId, rt);
  restoreResidentPlanPortfolioMemorySnapshot(x, rt.residentPlanPortfolio!);
  return x;
}
it("rezzes installed advancement support as the exact first step of the winning score", () => {
  const x = input();
  const path = corpSameTurnScoreConversionPaths(x).find(
    (p) => p.steps[0]?.kind === "rez_score_support",
  );
  expect(path).toMatchObject({ creditsRequired: 6, clicksRequired: 2 });
  const decision = chooseAiAction(x);
  const action = x.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(action.type).toBe("rez_card");
  expect(action.source).toBe("c38m");
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "p9cjat7so2g0t24r7ujibgxn83",
  );
  expect(decision.fallbackUsed).toBe(false);
});
it.each(["credits", "stale", "source", "other_server"])(
  "rejects invalid preparation %s",
  (kind) => {
    const x = input();
    const rez = x.legalActions.find(
      (a) => a.type === "rez_card" && referencesDefaultDeckCard(a.source, 524),
    )!;
    if (kind === "credits") x.playerView.own.credits = 5;
    if (kind === "stale") rez.expiresAtStateVersion--;
    if (kind === "source") rez.source = "foreign";
    if (kind === "other_server") rez.payload!.serverId = "r99";
    expect(
      corpSameTurnScoreConversionPaths(x).some((p) =>
        p.steps.some((s) => s.kind === "rez_score_support"),
      ),
    ).toBe(false);
  },
);
