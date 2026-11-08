import { ORIGINALSET_DEFAULT_DECKS, type AiDecisionInput, type GameState, type LegalAction } from "@netgrid/shared";
import { applyAction, createGameAfterSetup, getLegalActions, hashGameState, replayEvents } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import taxedMultiDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-245-01-confirmed-damage-taxed-multidraw-d25.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";
import { bindPublicBoardStealQuoteCompanion } from "../../public-board-steal-quotes.test-support";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { moveRunnerCardToGrip, putCorpRootInRemote, removeEverywhere, toRunnerTurn } from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type ReconstructedDecisionCapture = {
  provenance: "reconstructed_from_persisted_decision_sources";
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

describe("selfplay cycle 245 decision checkpoints", () => {
  it("contests the remote without inventing confirmed damage from discarded Setup", () => {
    const capture = structuredClone(
      taxedMultiDrawJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    bindPublicBoardStealQuoteCompanion(capture.input);
    const decision = chooseAiAction(capture.input as AiDecisionInput);
    expect(runnerDamageThreatAssessment(capture.input).flatlineRisk).toMatchObject({
      level: "suspected", activeDamageSourceCount: 0,
    });
    expect(decision.decisionDebug?.planFirstDecision?.dispositions).not.toContainEqual(
      expect.objectContaining({ evidenceCode: "runner_confirmed_damage_draw_tax_tag_unsafe" }),
    );

    expect(decision).toMatchObject({
      actionId: "runner.start_run.remote_2",
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:runner.contest_remote:remote%3Aremote_2",
          leafExecutorInstanceId:
            "plan:runner.contest_remote:remote%3Aremote_2",
          dispositions: expect.arrayContaining([
            expect.objectContaining({
              actionId:
                "runner.play_event.runner_onr_v1_097_livewires-contacts_3.runner_onr_v1_097_livewires-contacts_3.onr_v1_097_livewires-contacts:abilities_on_play_gain_credits",
              disposition: "explicitly_nonproductive",
              ownerModuleId: "runner.economy",
              evidenceCode:
                "runner_immediate_credit_route_has_no_bound_funding_need",
            }),
          ]),
        },
      },
    });
  });

  it("keeps an over-capacity taxed draw under exactly one disposition owner", () => {
    const capture = structuredClone(
      taxedMultiDrawJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    const overflowTemplate = capture.input.playerView.own.gripOrHq[0];
    expect(overflowTemplate).toBeDefined();
    for (let index = 0; index < 4; index += 1) {
      capture.input.playerView.own.gripOrHq.push({
        ...structuredClone(overflowTemplate!),
        instanceId: `${overflowTemplate!.instanceId}-overflow-${index}`,
      });
    }
    expect(capture.input.playerView.own.gripOrHq.length).toBeGreaterThan(
      capture.input.playerView.own.maxHandSize,
    );
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    bindPublicBoardStealQuoteCompanion(capture.input);
    const decision = chooseAiAction(capture.input as AiDecisionInput);
    const dispositions =
      decision.decisionDebug?.planFirstDecision?.dispositions ?? [];

    expect(decision).toMatchObject({
      actionId: "runner.start_run.remote_2",
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
    });
    expect(
      dispositions.filter((entry) => entry.actionId === "runner.draw_card"),
    ).toEqual([
      expect.objectContaining({
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.develop_board_and_hand",
        evidenceCode: "runner_option_development_draw_bound_reached",
      }),
    ]);
    expect(
      dispositions.filter((entry) => entry.actionId.includes("jack-n-joe")),
    ).toEqual([
      expect.objectContaining({
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.develop_board_and_hand",
        evidenceCode: "runner_hand_development_rejected:no_current_need:runner_onr_v1_095_jack-n-joe_3",
      }),
    ]);
  });

  it.each([0, 4])("keeps one unsafe taxed-draw owner with native active damage, overflow %i", (overflow) => {
    const { state, input, jackId } = activeDrawTaxFixture(overflow);
    expect(runnerDamageThreatAssessment(input).flatlineRisk).toMatchObject({
      level: "confirmed", activeDamageSourceCount: 1, effectiveMaxHandSize: 3,
    });
    resetResidentPlanPortfolioMemory();
    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    const dispositions = decision.decisionDebug?.planFirstDecision?.dispositions ?? [];
    expect(dispositions.filter((d) => d.actionId.includes("jack-n-joe"))).toEqual([
      expect.objectContaining({
        disposition: "explicitly_nonproductive", ownerModuleId: "runner.defense_and_recovery",
        evidenceCode: "runner_confirmed_damage_draw_tax_tag_unsafe",
      }),
    ]);
    expect(dispositions.filter((d) => d.actionId === "runner.draw_card")).toHaveLength(1);
    if (overflow === 0) verifyActualDrawTax(state, jackId);
  });
});

function activeDrawTaxFixture(overflow: number) {
  const jack = "onr_v1_095_jack-n-joe";
  const city = "onr_v1_313_city-surveillance";
  const setup = "onr_v1_340_setup";
  const runnerDeck = { ...ORIGINALSET_DEFAULT_DECKS.runner, cards: [
    ...ORIGINALSET_DEFAULT_DECKS.runner.cards.filter((c) => c.id !== jack),
    { id: jack, quantity: 1 },
  ] };
  const corpDeck = { ...ORIGINALSET_DEFAULT_DECKS.corp, cards: [
    ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter((c) => c.id !== city && c.id !== setup),
    { id: city, quantity: 1 }, { id: setup, quantity: 1 },
  ] };
  const state = toRunnerTurn(createGameAfterSetup({ seed: "active-draw-tax-core-control", runnerDeck, corpDeck }));
  moveRunnerCardToGrip(state, jack);
  const jackId = state.runner.grip.find((id) => state.cardInstances[id]!.definitionId === jack);
  if (!jackId) throw new Error("Missing native Jack draw source");
  const keep = new Set([jackId, ...state.runner.grip.filter((id) => id !== jackId).slice(0, 2)]);
  for (const id of [...state.runner.grip]) if (!keep.has(id)) {
    removeEverywhere(state, id);
    state.runner.heap.push(id);
    state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
  }
  for (const id of state.runner.stack.splice(0, overflow)) {
    state.runner.grip.push(id);
    state.cardInstances[id]!.zone = { side: "runner", zone: "grip" };
  }
  const cityId = putCorpRootInRemote(state, city);
  const setupId = putCorpRootInRemote(state, setup);
  // Each asset needs its own legal one-slot root. Generate the whole view and
  // LegalActions from this Engine state instead of editing a captured DTO.
  removeEverywhere(state, setupId);
  state.corp.servers.push({ id: "remote_2", kind: "remote", label: "Remote 2", ice: [], root: [setupId] });
  state.cardInstances[setupId]!.zone = { side: "corp", zone: "serverRoot", serverId: "remote_2" };
  for (const id of [cityId, setupId]) Object.assign(state.cardInstances[id]!, { rezzed: true, faceup: true });
  Object.assign(state.runner, { credits: 0, clicks: 3, coreDamage: 2 });
  const input = buildAiDecisionInput(state, "runner", { difficulty: "hard", ownDeckSnapshot: {
    side: "runner", deckSnapshotId: "native-active-draw-tax-control",
    cards: runnerDeck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
  } });
  return { state, input, jackId };
}

function verifyActualDrawTax(initial: GameState, jackId: string) {
  let state = structuredClone(initial);
  const act = (action: LegalAction | undefined, optionId?: string) => {
    if (!action) throw new Error("Missing native draw-tax action");
    const result = applyAction(state, {
      matchId: state.matchId, side: "runner", actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(optionId ? { selectedChoices: { choiceId: state.pendingChoice!.choiceId, selectedOptionIds: [optionId] } } : {}),
      idempotencyKey: `native-draw-tax:${state.stateVersion}`,
    });
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  };
  act(getLegalActions(state, "runner").find((a) => a.type === "play_event" && a.source === jackId));
  let choices = 0;
  while (state.pendingChoice && choices < 3) {
    expect(state.pendingChoice.presentationKey).toBe("runner_draw_tax");
    expect(state.pendingChoice.options.map((o) => o.id)).toEqual(["take_tag"]);
    act(getLegalActions(state, "runner").find((a) => a.type === "resolve_choice"), "take_tag");
    choices++;
  }
  expect(choices).toBe(3);
  expect(state.pendingChoice).toBeUndefined();
  expect(state.runner.grip).toHaveLength(5);
  expect(state.runner.tags).toBe(3);
  const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(state));
}
