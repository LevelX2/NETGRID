import { readFileSync } from "node:fs";
import { beforeEach, describe, it, expect } from "vitest";
import { applyAction, getLegalActions, getPlayerView } from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { runnerEncounterCreditBudgetForInput } from "../../runtime/runner-encounter-credit-budget";
import { completeEncounterBreakerPayment } from "../../runner/run-window/run-window-encounter-payment";
function original() {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta558-noisy-inert-original.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  return {
    ...f,
    input: {
      ...f.native.input,
      playerView: {
        ...f.native.input.playerView,
        ...getPlayerView(f.state, "runner"),
      },
      legalActions: getLegalActions(f.state, "runner"),
    },
  };
}
beforeEach(resetResidentPlanPortfolioMemory);
describe("pairing558: inert optional Noisy loss retains the actual payment (SP-666)", () => {
  it("quotes the real three-credit complete break when there are no Stealth credits", () => {
    const f = original(),
      a = f.input.legalActions.find((a: any) => a.type === "break_subroutine");
    expect(completeEncounterBreakerPayment(f.input, a)).toMatchObject({
      cost: 3,
      cashCost: 3,
      liquidCreditsAfterPayment: 5,
    });
  });
  it.each([false, true])(
    "keeps the persisted root reserve through DTO=%s",
    (dto) => {
      const f = original();
      let input = f.input;
      if (dto) input = { ...input, ...buildAiDecisionInputDto(input) };
      input.planningStateIdentity = buildPlanningStateIdentity(input);
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot.deckSnapshotId,
        f.native.runtime,
      );
      const before = JSON.stringify(input),
        r = chooseAiAction(input),
        a = input.legalActions.find((a: any) => a.actionId === r.actionId);
      expect(a?.type).toBe("continue_run");
      expect(a?.payload?.encounterWillEndRun).toBe(true);
      expect(a?.costs).toEqual([]);
      expect(r.fallbackUsed).toBe(false);
      expect(r.timeoutUsed).toBe(false);
      expect(JSON.stringify(input)).toBe(before);
      expect(r.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
        "runner.convert_run_window",
      );
      const p = applyAction(f.state, {
        matchId: f.state.matchId,
        side: "runner",
        actionId: r.actionId!,
        clientKnownStateVersion: f.state.stateVersion,
      });
      if (!p.ok) throw Error(JSON.stringify(p.error));
      expect(p.state.runner.credits).toBe(8);
      expect(p.state.runner.grip).toEqual(f.state.runner.grip);
      expect(p.state.randomCounter).toBe(f.state.randomCounter);
      expect(p.state.run).toBeUndefined();
    },
  );
  it("compares the complete three-credit break with the one-credit payment when the same root is funded", () => {
    const f = original();
    f.state.runner.credits = 14;
    f.input.playerView = {
      ...f.input.playerView,
      ...getPlayerView(f.state, "runner"),
    };
    f.input.legalActions = getLegalActions(f.state, "runner");
    f.input.planningStateIdentity = buildPlanningStateIdentity(f.input);
    restoreAiRuntimeCheckpoint(
      f.input,
      f.input.ownDeckSnapshot.deckSnapshotId,
      f.native.runtime,
    );
    const r = chooseAiAction(f.input),
      a = f.input.legalActions.find((a: any) => a.actionId === r.actionId);
    expect(a?.type).toBe("continue_run");
    expect(a?.payload?.payOrEndRunSubroutinePayment).toBe(1);
    expect(a?.payload?.encounterWillEndRun).toBe(false);
    expect(r.fallbackUsed).toBe(false);
    expect(r.timeoutUsed).toBe(false);
    expect(r.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
      "runner.convert_run_window",
    );
  });
  it("retains the existing unquoted-side-effect boundary when Stealth is actually available", () => {
    const f = original(),
      a = f.input.legalActions.find((a: any) => a.type === "break_subroutine");
    f.input.playerView.own.rig.push({
      instanceId: "stealth-source",
      definitionId: "stealth-source",
      known: true,
      type: "program",
      owner: "runner",
      controller: "runner",
      subtypes: ["stealth"],
      counterDisplays: [
        {
          id: "stealth",
          amount: 3,
          displayKind: "recurring_credit",
          label: "Stealth",
          ariaLabel: "3 Stealth",
          creditPool: {
            kind: "recurring_credit",
            uses: ["using_icebreaker_during_run_non_noisy"],
          },
        },
      ],
    } as any);
    expect(
      runnerEncounterCreditBudgetForInput(f.input).stealthCreditsBySourceId[
        "stealth-source"
      ],
    ).toBe(3);
    expect(completeEncounterBreakerPayment(f.input, a)).toBeUndefined();
  });
});
