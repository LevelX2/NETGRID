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
import { paidBreakPrecedesHarmlessResolution } from "../../runner/run-window/run-window-harmless-resolution";
import { completeEncounterBreakerPayment } from "../../runner/run-window/run-window-encounter-payment";
function original() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta557-staged-encounter-original.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
beforeEach(resetResidentPlanPortfolioMemory);
describe("pairing557 staged harmless encounter resolution", () => {
  it.each([
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ])("requotes real next group through DTO=%s resident=%s", (dto, resident) => {
    const f = original();
    let state = f.state;
    let input = f.native.input;
    if (dto) input = { ...input, ...buildAiDecisionInputDto(input) };
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    if (resident)
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot.deckSnapshotId,
        f.native.runtime,
      );
    const initialHash = hashGameState(state);
    let selectedRoot: string | undefined;
    for (let step = 0; step < 2; step++) {
      const before = JSON.stringify(input),
        r = chooseAiAction(input),
        a = input.legalActions.find((a: any) => a.actionId === r.actionId);
      expect(r.fallbackUsed).toBe(false);
      expect(r.timeoutUsed).toBe(false);
      expect(JSON.stringify(input)).toBe(before);
      expect(a?.type).toBe("continue_run");
      expect(a?.costs).toEqual(step === 0 ? [] : [{ credits: 1 }]);
      const pf = r.decisionDebug!.planFirstDecision!;
      expect(pf.selectedPlan?.moduleId).toBe("runner.convert_run_window");
      expect(pf.route).toMatchObject({
        actionId: a.actionId,
        stateVersion: state.stateVersion,
      });
      if (step === 0) selectedRoot = pf.rootPlanInstanceId;
      else expect(pf.rootPlanInstanceId).toBe(selectedRoot);
      if (!r.actionId) throw Error("Missing selected action");
      const applied = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: r.actionId,
        clientKnownStateVersion: state.stateVersion,
      });
      if (!applied.ok) throw Error(JSON.stringify(applied.error));
      state = applied.state;
      input = {
        ...input,
        playerView: { ...input.playerView, ...getPlayerView(state, "runner") },
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
    expect(state.runner.credits).toBe(8);
    expect(state.runner.coreDamage).toBe(0);
    expect(state.run.phase).toBe("movement");
    expect(state.run.runId).toBe(f.state.run.runId);
    expect(hashGameState(f.state)).toBe(initialHash);
  });
  it("does not label a later-group action as a complete payment for this group", () => {
    const f = original();
    const a = f.native.input.legalActions.find(
      (a: any) =>
        a.type === "break_subroutine" && a.payload?.subroutineIndex === 2,
    );
    expect(completeEncounterBreakerPayment(f.native.input, a)).toBeUndefined();
  });
  it.each(["certificate", "full-break", "paid-continue", "ends-run"])(
    "preserves other obligations: %s",
    (kind) => {
      const f = original(),
        i = f.native.input,
        a = i.legalActions.find(
          (a: any) =>
            a.type === "break_subroutine" && a.payload?.subroutineIndex === 2,
        ),
        co = i.legalActions.find((a: any) => a.type === "continue_run");
      expect(paidBreakPrecedesHarmlessResolution(i, a)).toBe(true);
      if (kind === "certificate")
        for (const b of i.legalActions)
          delete b.payload?.breakSubroutinePurpose;
      if (kind === "full-break") co.payload.encounterFullBreakDamage = 1;
      if (kind === "paid-continue") co.costs = [{ credits: 1 }];
      if (kind === "ends-run") co.payload.encounterWillEndRun = true;
      expect(paidBreakPrecedesHarmlessResolution(i, a)).toBe(false);
    },
  );
});
