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
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta557-staged-codebreaker-original.json",
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
describe("pairing557 full staged pay-ETR scope (SP-664)", () => {
  it.each([
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ])(
    "compares one shared pump with both real payments through DTO=%s resident=%s",
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
        "pump_breaker",
        "break_subroutine",
        "break_subroutine",
        "continue_run",
      ];
      for (let n = 0; n < 4; n++) {
        const inputBefore = JSON.stringify(input),
          r = chooseAiAction(input),
          a = input.legalActions.find((a: any) => a.actionId === r.actionId);
        expect(a?.type).toBe(expected[n]);
        expect(
          a?.costs.reduce((s: number, c: any) => s + (c.credits ?? 0), 0),
        ).toBe(n === 0 ? 1 : 0);
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
      expect(state.runner.credits).toBe(9);
      expect(state.run.phase).toBe("movement");
      expect(state.randomCounter).toBe(f.state.randomCounter);
      expect(state.runner.grip).toEqual(f.state.runner.grip);
      expect(hashGameState(f.state)).toBe(beforeHash);
    },
  );
  it("quotes next payment and all remaining payments separately without changing action IDs or state", () => {
    const f = current(),
      co = f.input.legalActions.find(
        (a: any) => a.type === "continue_run" && a.costs.length,
      )!;
    const before = hashGameState(f.state);
    expect(co.payload.unbrokenSubroutineCount).toBe(1);
    expect(co.payload.encounterRemainingSubroutineCount).toBe(2);
    expect(co.actionId).toBe(
      f.native.input.legalActions.find(
        (a: any) => a.costs[0]?.credits === 1 && a.type === "continue_run",
      ).actionId,
    );
    expect(pureEndRunEncounterPayment(f.input, co)).toMatchObject({
      cost: 2,
      cashCost: 2,
    });
    expect(hashGameState(f.state)).toBe(before);
    const ap = applyAction(f.state, {
      matchId: f.state.matchId,
      side: "runner",
      actionId: co.actionId,
      clientKnownStateVersion: f.state.stateVersion,
    });
    if (!ap.ok) throw Error("Pay rejected");
    const after = getLegalActions(ap.state, "runner").filter(
      (a) => a.type === "continue_run",
    );
    for (const a of after) {
      expect(a.payload?.encounterRemainingSubroutineCount).toBe(1);
      expect(a.payload?.encounterRemainingSubroutineIds).toBe(
        a.payload?.encounterSubroutineIds,
      );
    }
  });
  it("does not invent an affordable full payment from one affordable first group", () => {
    const f = current();
    f.input.playerView.own.credits = 1;
    const co = f.input.legalActions.find(
      (a: any) => a.type === "continue_run" && a.costs.length,
    )!;
    expect(pureEndRunEncounterPayment(f.input, co)).toBeUndefined();
    const pump = f.input.legalActions.find(
      (a: any) => a.type === "pump_breaker" && a.source.includes("codecracker"),
    )!;
    expect(pureEndRunEncounterPayment(f.input, pump)).toMatchObject({
      cost: 1,
      cashCost: 1,
    });
  });
  it("leaves a partial group explicitly unavailable as a whole-encounter quote without the Engine scope", () => {
    const f = current();
    for (const a of f.input.legalActions) {
      delete a.payload?.encounterRemainingSubroutineIds;
      delete a.payload?.encounterRemainingSubroutineCount;
    }
    expect(currentEncounterCompleteSubroutineIndexes(f.input)).toBeUndefined();
    const co = f.input.legalActions.find(
      (a: any) => a.type === "continue_run" && a.costs.length,
    )!;
    expect(pureEndRunEncounterPayment(f.input, co)).toBeUndefined();
  });
  it.each(["count", "duplicate", "unknown", "omit-next", "stale"])(
    "rejects inconsistent complete scope: %s",
    (kind) => {
      const f = current();
      for (const a of f.input.legalActions.filter(
        (a: any) => a.type === "continue_run",
      )) {
        if (kind === "count") a.payload.encounterRemainingSubroutineCount = 1;
        if (kind === "duplicate")
          a.payload.encounterRemainingSubroutineIds =
            a.payload.encounterSubroutineIds +
            "," +
            a.payload.encounterSubroutineIds;
        if (kind === "unknown")
          a.payload.encounterRemainingSubroutineIds =
            a.payload.encounterSubroutineIds + ",foreign";
        if (kind === "omit-next") {
          a.payload.encounterRemainingSubroutineIds = String(
            a.payload.encounterRemainingSubroutineIds,
          ).split(",")[1];
          a.payload.encounterRemainingSubroutineCount = 1;
        }
        if (kind === "stale") a.expiresAtStateVersion--;
      }
      expect(() => currentEncounterCompleteSubroutineIndexes(f.input)).toThrow(
        /missing_action_semantics/,
      );
    },
  );
  it("compares the proven current saving while preserving unknown inner ICE and strength boundaries", () => {
    const f = current();
    expect(
      f.input.playerView.servers
        .find((s: any) => s.id === "rd")
        .ice.some((c: any) => !c.known || !c.rezzed),
    ).toBe(true);
    const pump = f.input.legalActions.find(
      (a: any) => a.type === "pump_breaker" && a.source.includes("codecracker"),
    );
    const payment = pureEndRunEncounterPayment(f.input, pump)!;
    expect(completeCurrentEncounterEconomics(f.input, payment)).toMatchObject({
      totalCost: 1,
      cashCost: 1,
    });
    expect(
      completeCurrentEncounterEconomics(f.input, {
        ...payment,
        carriesStrengthAcrossIce: true,
      }),
    ).toBeUndefined();
    expect(
      completeCurrentEncounterEconomics(f.input, {
        ...payment,
        budget: { ...payment.budget, paymentSupportCreditsGained: 1 },
      }),
    ).toBeUndefined();
  });
});
