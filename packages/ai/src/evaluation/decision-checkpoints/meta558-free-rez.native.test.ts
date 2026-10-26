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
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { toPublicEventForSide } from "../../../../engine/src/game/view/public-event-view";
const original = (game: number) =>
  JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta558-free-rez-g" +
          game +
          "-original.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
beforeEach(resetResidentPlanPortfolioMemory);
describe("pairing558 irrelevant random strength before Priority score", () => {
  it.each([
    [8, false],
    [8, true],
    [9, false],
    [9, true],
  ])("preserves native Score and free-rez binding G%s DTO=%s", (game, dto) => {
    const f = original(Number(game));
    expect(Object.values(f.native.validation).every((v) => v === true)).toBe(
      true,
    );
    expect(hashGameState(f.state)).toBe(f.native.stateHash);
    let state = f.state,
      input = f.native.input;
    if (dto) input = { ...input, ...buildAiDecisionInputDto(input) };
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      f.native.runtime,
    );
    const before = JSON.stringify(input),
      score = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(score.fallbackUsed).toBe(false);
    expect(score.timeoutUsed).toBe(false);
    const action = input.legalActions.find(
      (a: any) => a.actionId === score.actionId,
    )!;
    expect(action.type).toBe("score_agenda");
    expect(score.decisionDebug!.planFirstDecision!.selectedPlan!.moduleId).toBe(
      "corp.score_agenda",
    );
    expect(score.decisionDebug!.planFirstDecision!.route).toMatchObject({
      actionId: action.actionId,
      stateVersion: state.stateVersion,
    });
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    const executor = portfolio.instances.find(
      (x) => x.instanceId === portfolio.executorInstanceId,
    )!;
    const continuation = (executor.moduleState as any).choiceContinuation;
    expect(continuation).toMatchObject({
      family: "corp_scored_agenda_on_score",
      selectedActionId: action.actionId,
      selectedAtStateVersion: state.stateVersion,
      targetCardId: action.payload.cardId,
    });
    const binding = continuation.freeRezChoiceBinding;
    expect(binding).toMatchObject({
      targetCardId: expect.any(String),
      selectedVariantId: "fixed",
    });
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: score.actionId!,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!applied.ok) throw Error(JSON.stringify(applied.error));
    state = applied.state;
    input = {
      ...input,
      playerView: { ...input.playerView, ...getPlayerView(state, "corp") },
      legalActions: getLegalActions(state, "corp"),
      eventTail: state.eventLog.map((e: any) =>
        toPublicEventForSide(e, "corp"),
      ),
      decisionId: input.decisionId.split(":")[0] + ":" + state.stateVersion,
      actionNumber: input.actionNumber + 1,
    };
    if (dto) input = { ...input, ...buildAiDecisionInputDto(input) };
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    const choice = chooseAiAction(input);
    expect(
      input.legalActions.find((a: any) => a.actionId === choice.actionId)?.type,
    ).toBe("resolve_choice");
    expect(choice.selectedChoices?.selectedOptionIds).toEqual([
      binding.selectedOptionId,
    ]);
    expect(residentPlanPortfolioSnapshot(input)?.executorInstanceId).toBe(
      executor.instanceId,
    );
    if (!choice.selectedChoices) throw Error("Missing bound free-rez option");
    const rezzed = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: choice.actionId!,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: choice.selectedChoices,
    });
    if (!rezzed.ok) throw Error(JSON.stringify(rezzed.error));
    expect(rezzed.state.cardInstances[binding.targetCardId]?.rezzed).toBe(true);
    expect(getPlayerView(rezzed.state, "corp").own.agendaPoints).toBe(
      f.native.input.playerView.own.agendaPoints + 3,
    );
    expect(hashGameState(f.state)).toBe(f.native.stateHash);
  });
});
