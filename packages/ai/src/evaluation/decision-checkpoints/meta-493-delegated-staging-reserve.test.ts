import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
const sleeper =
  "corp.install_card.corp_onr_v1_270_sleeper_1.remote_1.corp_onr_v1_270_sleeper_1.1";
function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-493-r1-g24-d96.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
function decide(cp: ReturnType<typeof checkpoint>) {
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify([cp.input.playerView, cp.input.legalActions]),
    decision = chooseAiAction(cp.input);
  expect(decision.fallbackUsed).toBe(false);
  expect(
    cp.input.legalActions.some((a) => a.actionId === decision.actionId),
  ).toBe(true);
  expect(
    JSON.stringify([cp.input.playerView, cp.input.legalActions]) === before,
  ).toBe(true);
  return decision;
}
it.each([6, 7])(
  "rejects delegated staging that consumes the current HQ rez reserve at %i credits",
  (credits) => {
    const cp = checkpoint();
    cp.input.playerView.own.credits = credits;
    const triggerman = cp.input.playerView.servers
      .find((s) => s.id === "hq")!
      .ice.find((c) => c.definitionId === "onr_v1_273_triggerman")!;
    expect(triggerman.rezzed).toBe(false);
    const quote = triggerman.effectiveRezCostQuote;
    if (quote?.complete !== true) throw Error("current_complete_native_rez_quote_required");
    expect(quote.finalCredits).toBe(7);
    const decision = decide(cp),
      plan = decision.decisionDebug!.planFirstDecision!;
    expect(decision.actionId).not.toBe(sleeper);
    expect(plan.dispositions).toContainEqual(
      expect.objectContaining({
        actionId: sleeper,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.defend_servers",
      }),
    );
    // Native zero-credit overflow conversion retains one click to reach seven.
    const selected = cp.input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(selected.costs.reduce((n, c) => n + (c.credits ?? 0), 0)).toBe(0);
    expect(
      cp.input.playerView.own.clicks -
        selected.costs.reduce((n, c) => n + (c.clicks ?? 0), 0),
    ).toBe(1);
    expect(plan.rootPlanInstanceId).not.toContain("corp.score_agenda");
  },
);
it.each([
  [8, false],
  [6, true],
] as const)(
  "retains exact Score-to-Defense delegation with %i credits and rezzed=%s",
  (credits, rezzed) => {
    const cp = checkpoint();
    cp.input.playerView.own.credits = credits;
    cp.input.playerView.servers
      .find((s) => s.id === "hq")!
      .ice.find((c) => c.definitionId === "onr_v1_273_triggerman")!.rezzed =
      rezzed;
    const decision = decide(cp),
      plan = decision.decisionDebug!.planFirstDecision!;
    expect(decision.actionId).toBe(sleeper);
    expect(plan.selectedPlan?.moduleId).toBe("corp.defend_servers");
    expect(plan.rootPlanInstanceId).toBe(
      "plan:corp.score_agenda:agenda%3Acorp_onr_v1_217_strike-force-kali_1%3Aremote_1",
    );
    expect(decision.reasonCode).toBe("plan_first.corp.defend_servers");
  },
);
