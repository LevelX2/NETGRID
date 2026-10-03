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
const installed = "corp_onr_v1_217_strike-force-kali_1";
const newInstall =
  "corp.install_card.corp_onr_v1_212_priority-requisition_1.new_remote.corp_onr_v1_212_priority-requisition_1";
function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-493-r3-g37-d374.json",
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
  const before = JSON.stringify([cp.input.playerView, cp.input.legalActions]);
  const result = chooseAiAction(cp.input);
  expect(result.fallbackUsed).toBe(false);
  expect(cp.input.legalActions).toContainEqual(
    expect.objectContaining({
      actionId: result.actionId,
      expiresAtStateVersion: cp.input.playerView.stateVersion,
    }),
  );
  expect(JSON.stringify([cp.input.playerView, cp.input.legalActions])).toBe(
    before,
  );
  return result;
}
it("funds the already certified terminal continuation instead of opening an unprotected last-draw agenda", () => {
  const cp = checkpoint();
  const agenda = cp.input.playerView.servers
    .flatMap((s) => s.root)
    .find((c) => c.instanceId === installed)!;
  expect(agenda.scoreContinuationQuote).toMatchObject({
    complete: true,
    terminalScore: true,
    remainingAdvancementCounters: 2,
    expiresAtStateVersion: 373,
  });
  const result = decide(cp),
    plan = result.decisionDebug!.planFirstDecision!;
  expect(result.actionId).toBe("corp.gain_credit");
  expect(plan.selectedPlan?.moduleId).toBe("corp.economy");
  expect(plan.rootPlanInstanceId).toBe(
    "plan:corp.score_agenda:agenda%3Acorp_onr_v1_217_strike-force-kali_1%3Aremote_1",
  );
  expect(plan.priority?.effectiveClass).toBe("P2");
  expect(plan.leafExecutorInstanceId).toBe(plan.selectedPlan?.instanceId);
  expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(
    plan.portfolio?.find((p) =>
      p.dedupeKey.includes("priority-requisition_1:new_remote"),
    )?.evidenceCodes,
  ).not.toContain("corp_last_viable_deckout_matchpoint_install:new_remote");
});
it.each(["stale", "incomplete", "nonterminal", "unfundable"] as const)(
  "retains the real emergency install with a %s installed continuation",
  (variant) => {
    const cp = checkpoint(),
      agenda = cp.input.playerView.servers
        .flatMap((s) => s.root)
        .find((c) => c.instanceId === installed)!;
    const quote = agenda.scoreContinuationQuote!;
    if (quote.complete !== true)
      throw Error("complete_native_continuation_required");
    if (variant === "stale") quote.expiresAtStateVersion--;
    if (variant === "incomplete")
      agenda.scoreContinuationQuote = {
        context: quote.context,
        agendaCardId: quote.agendaCardId,
        serverId: quote.serverId,
        expiresAtStateVersion: quote.expiresAtStateVersion,
        complete: false,
        reason: "not_completable_next_corp_turn",
      };
    if (variant === "nonterminal") quote.terminalScore = false;
    if (variant === "unfundable")
      quote.creditsRequiredBeforeNextCorpTurn =
        cp.input.playerView.own.clicks + 1;
    const result = decide(cp),
      plan = result.decisionDebug!.planFirstDecision!;
    expect(result.actionId).toBe(newInstall);
    expect(plan.selectedPlan?.moduleId).toBe("corp.score_agenda");
    expect(plan.selectedPlan?.evidenceCodes).toContain(
      "corp_last_viable_deckout_matchpoint_install:new_remote",
    );
    expect(plan.priority?.effectiveClass).toBe("P2");
  },
);
