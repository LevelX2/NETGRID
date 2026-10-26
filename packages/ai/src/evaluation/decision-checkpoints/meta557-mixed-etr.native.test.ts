import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
} from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { toPublicEventForSide } from "../../../../engine/src/game/view/public-event-view";
import { currentEncounterCompleteSubroutineIndexes } from "../../runtime/current-encounter";
import { pureEndRunEncounterPayment } from "../../runner/run-window/run-window-pure-etr-economics";
import { completeCurrentEncounterEconomics } from "../../runner/run-window/run-window-encounter-payment";

function original() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta557-mixed-etr-original.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
function current() {
  const f = original();
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
describe("pairing557 mixed pay and hard-ETR scope (SP-664)", () => {
  it.each([
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ])(
    "pays the cheap current tax and breaks only the later hard stop through DTO=%s resident=%s",
    (dto, resident) => {
      const f = current();
      let state = f.state,
        input = f.input;
      if (dto) input = { ...input, ...buildAiDecisionInputDto(input) };
      input.planningStateIdentity = buildPlanningStateIdentity(input);
      if (resident)
        restoreAiRuntimeCheckpoint(
          input,
          input.ownDeckSnapshot.deckSnapshotId,
          f.native.runtime,
        );
      const beforeHash = hashGameState(state);
      let root: string | undefined;
      const expected = [
        "continue_run",
        "pump_breaker",
        "pump_breaker",
        "pump_breaker",
        "break_subroutine",
        "continue_run",
      ];
      for (let n = 0; n < 6; n++) {
        const inputBefore = JSON.stringify(input),
          r = chooseAiAction(input),
          a = input.legalActions.find((a: any) => a.actionId === r.actionId);
        expect(a?.type).toBe(expected[n]);
        expect(
          a?.costs.reduce((s: number, c: any) => s + (c.credits ?? 0), 0),
        ).toBe(n < 4 ? 1 : n === 4 ? 2 : 0);
        expect(r.fallbackUsed).toBe(false);
        expect(r.timeoutUsed).toBe(false);
        expect(JSON.stringify(input)).toBe(inputBefore);
        const pf = r.decisionDebug!.planFirstDecision!;
        if (pf.selectedPlan)
          expect(pf.selectedPlan.moduleId).toBe("runner.convert_run_window");
        if (n === 0) root = pf.rootPlanInstanceId;
        else if (pf.selectedPlan) expect(pf.rootPlanInstanceId).toBe(root);
        if (!r.actionId) throw Error("Missing selected action");
        const ap = applyAction(state, {
          matchId: state.matchId,
          side: "runner",
          actionId: r.actionId,
          clientKnownStateVersion: state.stateVersion,
        });
        if (!ap.ok) throw Error(JSON.stringify(ap.error));
        state = ap.state;
        input = {
          ...input,
          playerView: {
            ...input.playerView,
            ...getPlayerView(state, "runner"),
          },
          legalActions: getLegalActions(state, "runner"),
          eventTail: state.eventLog.map((e: any) =>
            toPublicEventForSide(e, "runner"),
          ),
          decisionId: input.decisionId.split(":")[0] + ":" + state.stateVersion,
          actionNumber: input.actionNumber + 1,
        };
        if (dto) input = { ...input, ...buildAiDecisionInputDto(input) };
        input.planningStateIdentity = buildPlanningStateIdentity(input);
      }
      expect(state.runner.credits).toBe(3);
      expect(state.run.phase).toBe("movement");
      expect(state.randomCounter).toBe(f.state.randomCounter);
      expect(state.runner.grip).toEqual(f.state.runner.grip);
      expect(hashGameState(f.state)).toBe(beforeHash);
    },
  );
  it("quotes the fixed first payment plus the remaining hard stop, not an all-break route", () => {
    const f = current();
    const pay = f.input.legalActions.find(
      (a: any) =>
        a.type === "continue_run" &&
        a.payload?.payOrEndRunSubroutinePayment === 1,
    );
    const pump = f.input.legalActions.find(
      (a: any) => a.type === "pump_breaker" && a.source.includes("raptor"),
    );
    expect(pureEndRunEncounterPayment(f.input, pay)).toMatchObject({
      cost: 6,
      cashCost: 6,
      liquidCreditsAfterPayment: 3,
      carriesStrengthAcrossIce: false,
    });
    expect(pureEndRunEncounterPayment(f.input, pump)).toMatchObject({
      cost: 7,
      cashCost: 7,
      liquidCreditsAfterPayment: 2,
    });
    const p = pureEndRunEncounterPayment(f.input, pay)!;
    expect(completeCurrentEncounterEconomics(f.input, p)).toMatchObject({
      totalCost: 6,
      cashCost: 6,
    });
    expect(
      p.rig.find((c: any) => c.definitionId.includes("raptor"))?.strength,
    ).toBe(1);
  });
  it("does not certify a full mixed response when only the first payment is funded", () => {
    const f = current();
    f.input.playerView.own.credits = 5;
    const pay = f.input.legalActions.find(
      (a: any) =>
        a.type === "continue_run" &&
        a.payload?.payOrEndRunSubroutinePayment === 1,
    );
    expect(pureEndRunEncounterPayment(f.input, pay)).toBeUndefined();
  });
  it("preserves the current actual break prohibition for the later hard stop", () => {
    const f = current();
    f.input.playerView.run.noBreakSubroutinesActive = true;
    const pay = f.input.legalActions.find(
      (a: any) =>
        a.type === "continue_run" &&
        a.payload?.payOrEndRunSubroutinePayment === 1,
    );
    expect(pureEndRunEncounterPayment(f.input, pay)).toBeUndefined();
  });
  it("does not substitute a stop head or a mismatching payment for the actual fixed payment", () => {
    const f = current();
    const stop = f.input.legalActions.find(
      (a: any) =>
        a.type === "continue_run" && a.payload?.encounterWillEndRun === true,
    );
    expect(pureEndRunEncounterPayment(f.input, stop)).toBeUndefined();
    const pay = f.input.legalActions.find(
      (a: any) =>
        a.type === "continue_run" &&
        a.payload?.payOrEndRunSubroutinePayment === 1,
    );
    pay.payload.payOrEndRunSubroutinePayment = 2;
    expect(pureEndRunEncounterPayment(f.input, pay)).toBeUndefined();
  });
});
