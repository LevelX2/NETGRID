import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
const native = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta560-r2-g22-d188-score-capacity.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const original = JSON.parse(
  readFileSync(
    new URL(
      "./fixtures/meta560-r2-g22-d188-score-capacity.state.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
function initial(dto: boolean) {
  const input = structuredClone(native.input);
  if (dto) Object.assign(input, buildAiDecisionInputDto(input));
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    native.runtime,
  );
  return input;
}
function choose(input: any) {
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  const before = JSON.stringify(input),
    result = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  const action = input.legalActions.find(
    (x: any) => x.actionId === result.actionId,
  )!;
  expect(action).toBeDefined();
  const plan = result.decisionDebug!.planFirstDecision!;
  expect(plan.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: input.playerView.stateVersion,
    planInstanceId: plan.leafExecutorInstanceId,
  });
  return { result, action, plan };
}
beforeEach(resetResidentPlanPortfolioMemory);
describe("pairing 560: exact score before redundant material-capacity release", () => {
  it.each([false, true])(
    "finishes the real two-advance score without a Runner window through DTO=%s",
    (dto) => {
      expect(Object.values(native.validation)).toEqual(Array(9).fill(true));
      expect(hashGameState(original)).toBe(native.stateHash);
      let state = structuredClone(original),
        input = initial(dto);
      for (const type of ["advance_card", "advance_card", "score_agenda"]) {
        const { action, plan } = choose(input);
        expect(action.type).toBe(type);
        expect(action.source).toBe("corp_onr_v1_205_main-office-relocation_1");
        expect(plan.selectedPlan?.moduleId).toBe("corp.score_agenda");
        expect(state.activeSide).toBe("corp");
        const applied = applyAction(state, {
          matchId: state.matchId,
          side: "corp",
          actionId: action.actionId,
          clientKnownStateVersion: state.stateVersion,
        });
        expect(applied.ok).toBe(true);
        if (!applied.ok) throw Error(JSON.stringify(applied.error));
        state = applied.state;
        input = {
          ...input,
          playerView: getPlayerView(state, "corp"),
          legalActions: getLegalActions(state, "corp"),
        };
        if (dto) Object.assign(input, buildAiDecisionInputDto(input));
      }
      expect(getPlayerView(state, "corp").own).toMatchObject({
        agendaPoints: 3,
        credits: 5,
        clicks: 1,
      });
      expect(
        getPlayerView(state, "corp").own.gripOrHq.some(
          (x: any) => x.instanceId === "corp_onr_v1_238_data-wall-2-0_1",
        ),
      ).toBe(true);
      const replay = replayEvents(
        original,
        state.eventLog.slice(original.eventLog.length),
      );
      expect(replay.errors).toEqual([]);
      expect(hashGameState(replay.state)).toBe(hashGameState(state));
    },
  );
  it("keeps the material-capacity route when no current executable score action exists (explicit countermodel)", () => {
    const input = initial(false);
    input.legalActions = input.legalActions.filter(
      (x: any) => x.type !== "advance_card",
    );
    const { action, plan } = choose(input);
    expect(action.source).toBe("corp_onr_v1_238_data-wall-2-0_1");
    expect(action.payload.serverId).toBe("rd");
    expect(plan.selectedPlan?.moduleId).toBe("corp.defend_servers");
  });
});
