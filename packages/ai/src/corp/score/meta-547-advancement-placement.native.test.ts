import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  createGameAfterSetup,
  applyAction,
  replayEvents,
  hashGameState,
} from "@netgrid/engine";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
function fixture(decision: number) {
  const saved = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-547-r1-g12-d" +
          decision +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(saved.validation).every(Boolean)).toBe(true);
  return {
    input: { ...saved.input, ...buildAiDecisionInputDto(saved.input) },
    runtime: saved.runtime,
  };
}
afterEach(resetResidentPlanPortfolioMemory);
describe("exact advancement placement from the chosen score parent", () => {
  it("finishes the cheaper installed Babylon before spending the operation on its sibling", () => {
    const before = fixture(175);
    restoreAiRuntimeCheckpoint(
      before.input,
      before.input.ownDeckSnapshot!.deckSnapshotId,
      before.runtime,
    );
    const first = chooseAiAction(before.input);
    expect(first).toMatchObject({
      actionId:
        "corp.advance_card.corp_onr_v1_214_project-babylon_1.corp_onr_v1_214_project-babylon_1",
      fallbackUsed: false,
    });
  });
  it("binds both counters to the exact current Engine target and replays the distribution", () => {
    const saved = fixture(175),
      snapshot = saved.input.ownDeckSnapshot!;
    const initial = createGameAfterSetup({
      seed: "current-advancement-binding",
      matchId: "current-advancement-binding",
      corpDeck: {
        id: snapshot.deckSnapshotId,
        name: "Current advancement binding",
        side: "corp",
        identity: "corp_identity_001",
        cards: snapshot.cards.map((card) => ({
          id: card.cardId,
          quantity: card.quantity,
        })),
      },
    });
    initial.activeSide = "corp";
    initial.phase = "corp_action_phase";
    initial.timingPoint = "corp_action.main";
    initial.corp.clicks = 2;
    RealEngineFixtureBuilder.forState(initial)
      .withCorpHqSize(0)
      .withCorpCredits(7)
      .withCorpCardInHq("onr_v1_304_systematic-layoffs")
      .withCorpRemoteRoot("remote_1", "onr_v1_214_project-babylon")
      .withRezzedCorpIceOnServer("remote_1", "onr_v1_237_data-wall");
    const agendaId = initial.corp.servers.find(
      (server) => server.id === "remote_1",
    )!.root[0]!;
    const input = buildAiDecisionInput(initial, "corp", {
      difficulty: "hard",
      ownDeckSnapshot: snapshot,
    });
    const first = chooseAiAction(input);
    expect(
      initial.cardInstances[
        input.legalActions.find((action) => action.actionId === first.actionId)!
          .source!
      ]!.definitionId,
    ).toBe("onr_v1_304_systematic-layoffs");
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    const executor = portfolio.instances.find(
      (i) => i.instanceId === portfolio.executorInstanceId,
    )!;
    expect(executor.moduleState).toMatchObject({
      choiceContinuation: {
        targetCardId: agendaId,
        placements: [{ targetCardId: agendaId, amount: 2 }],
      },
    });
    const played = applyAction(initial, {
      matchId: initial.matchId,
      side: "corp",
      actionId: first.actionId!,
      clientKnownStateVersion: initial.stateVersion,
      ...(first.selectedChoices
        ? { selectedChoices: first.selectedChoices }
        : {}),
    });
    if (!played.ok) throw Error(played.error.message);
    const choice = buildAiDecisionInput(played.state, "corp", {
      difficulty: "hard",
      ownDeckSnapshot: snapshot,
    });
    const result = chooseAiAction(choice);
    expect(result).toMatchObject({
      actionId: "corp.resolve_choice",
      fallbackUsed: false,
      timeoutUsed: false,
      selectedChoices: { selectedOptionIds: [`placement_${agendaId}_2`] },
    });
    const resolved = applyAction(played.state, {
      matchId: initial.matchId,
      side: "corp",
      actionId: result.actionId!,
      clientKnownStateVersion: played.state.stateVersion,
      ...(result.selectedChoices
        ? { selectedChoices: result.selectedChoices }
        : {}),
    });
    if (!resolved.ok) throw Error(resolved.error.message);
    expect(resolved.state.cardInstances[agendaId]!.advancementCounters).toBe(2);
    const replay = replayEvents(
      initial,
      resolved.state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(resolved.state));
  });
  it("fails closed when an otherwise exact choice origin omits its allocation", () => {
    const saved = fixture(176);
    restoreAiRuntimeCheckpoint(
      saved.input,
      saved.input.ownDeckSnapshot!.deckSnapshotId,
      saved.runtime,
    );
    expect(() => chooseAiAction(saved.input)).toThrow(/window_origin_missing/);
  });
});
