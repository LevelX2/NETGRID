import { describe, expect, it } from "vitest";
import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";
import { buildActionCardSemanticProfilesByDefinitionId } from "./actions/action-card-semantic-profiles";
import { buildActionSemanticCandidates } from "./action-semantic-candidate";
import { RealEngineFixtureBuilder } from "./evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./runtime/ai-decision-input";
import { chooseAiAction } from "./ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "./plans/resident-plan-portfolio-memory";
import { runnerStrategicExchangeKinds } from "./runtime/runner-strategic-exchange";
const id = "onr_proteus_108_faked-hit";
const poisonedWaterSupply = "onr_proteus_117_poisoned-water-supply";
const entry = cardSpecPlanningCards().find((c) => c.definition.id === id)!;
const payoff = {
  kind: "run_tax",
  scope: "corp",
  timing: "action",
  target: "bad_publicity_pressure",
  amount: 1,
  finite: true,
};
function nativeInput(eventId = id, additionalCards: readonly string[] = []) {
  let state = createGameAfterSetup({
    seed: "fixed-bad-publicity-profile",
    runnerDeck: {
      id: "bp-runner",
      name: "BP",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        eventId,
        "onr_v1_108_score",
        "onr_v1_097_livewires-contacts",
        "onr_v1_039_krash",
        "onr_v1_014_codecracker",
        ...additionalCards,
      ].map((id) => ({ id, quantity: 3 })),
    },
    corpDeck: {
      id: "bp-corp",
      name: "Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 8 },
        { id: "simple_barrier_ice", quantity: 8 },
      ],
    },
  });
  for (const type of ["mandatory_draw", "end_turn"] as const) {
    if (type === "end_turn")
      RealEngineFixtureBuilder.forState(state).withCorpHqSize(0);
    const a = getLegalActions(state, "corp").find((a) => a.type === type)!;
    const r = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: a.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: type,
    });
    if (!r.ok) throw Error(JSON.stringify(r.error));
    state = r.state;
  }
  const f = RealEngineFixtureBuilder.forState(state)
    .withRunnerGripSize(0)
    .withRunnerCredits(5);
  for (const def of [
    eventId,
    "onr_v1_108_score",
    "onr_v1_097_livewires-contacts",
    "onr_v1_039_krash",
    "onr_v1_014_codecracker",
  ])
    f.withRunnerCardInGrip(def);
  return {
    state,
    input: buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: {
        deckSnapshotId: "bp-runner",
        side: "runner",
        cards: [
          eventId,
          "onr_v1_108_score",
          "onr_v1_097_livewires-contacts",
          "onr_v1_039_krash",
          "onr_v1_014_codecracker",
          ...additionalCards,
        ].map((cardId) => ({ cardId, quantity: 3 })),
      },
    }),
  };
}
describe("fixed public bad-publicity effect translation", () => {
  it("preserves actual benefit and separate self-damage in the canonical compiler", () => {
    const hint = deriveCardSpecAiHint(entry);
    expect(hint.effects).toContainEqual(payoff);
    expect(hint.functionSignals).toContain("corp.bad_publicity_pressure");
    expect(hint.effects).toContainEqual(
      expect.objectContaining({
        kind: "damage",
        scope: "runner",
        resource: "brain_damage",
        amount: 2,
      }),
    );
    expect(hint.strategicExchangeKinds).toContain("self_damage");
  });
  it("translates the typed effect independently of card identity", () => {
    const renamed = {
      ...structuredClone(entry),
      definition: {
        ...entry.definition,
        id: "onr_v1_108_score",
        title: "Synthetic Pressure",
      },
    };
    expect(deriveCardSpecAiHint(renamed).effects).toContainEqual(payoff);
  });
  it.each([0, -1, 0.5, Number.NaN])(
    "fails closed on an invalid public amount %s",
    (amount) => {
      const malformed = structuredClone(entry);
      const effect = malformed.planning.engine.abilities![0]!.effects.find(
        (e) => e.kind === "add_bad_publicity",
      )!;
      Object.assign(effect, { amount });
      expect(() => deriveCardSpecAiHint(malformed)).toThrow(
        "card_spec_unknown_bad_publicity_gain_shape",
      );
    },
  );
  it("rejects a nonpublic effect instead of inventing a public benefit", () => {
    const malformed = structuredClone(entry);
    Object.assign(malformed.planning.engine.abilities![0]!.effects[0]!, {
      visibility: "hidden_info_barrier",
    });
    expect(() => deriveCardSpecAiHint(malformed)).toThrow(
      "card_spec_unknown_bad_publicity_gain_shape",
    );
  });
  it("carries the generated benefit through the productive profile and exact native action", () => {
    const { state, input } = nativeInput();
    const profiles = buildActionCardSemanticProfilesByDefinitionId();
    expect(profiles[id]!.functionalEffects).toContainEqual(payoff);
    const action = input.legalActions.find(
      (a) =>
        a.type === "play_event" &&
        state.cardInstances[a.source!]?.definitionId === id,
    )!;
    expect(
      action,
      JSON.stringify(
        input.legalActions.map((a) => ({
          id: a.actionId,
          type: a.type,
          source: a.source,
          payload: a.payload,
        })),
      ),
    ).toBeDefined();
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: state.stateVersion,
      visibleSourceDefinitionsByInstanceId: { [action.source!]: id },
      cardSemanticProfilesByDefinitionId: profiles,
    });
    expect(candidate!.functionalEffects).toContainEqual(payoff);
    expect(
      candidate!.randomBadPublicityModel?.badPublicity?.thresholdStatus,
    ).not.toBe("reached");
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "native-bp",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.corp.badPublicity - state.corp.badPublicity).toBe(1);
    expect(result.state.runner.coreDamage - state.runner.coreDamage).toBe(2);
    const replay = replayEvents(state, [result.event]);
    expect(replay.ok).toBe(true);
    if (replay.ok)
      expect(hashState(replay.state)).toBe(hashState(result.state));
    resetResidentPlanPortfolioMemory();
    const decision = chooseAiAction(input);
    expect(
      input.legalActions.some((a) => a.actionId === decision.actionId),
    ).toBe(true);
    expect(decision.fallbackUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    ).toBeTruthy();
  });
  it("carries the Connection sacrifice and its distinct public benefit to the legal play", () => {
    const connectionIds = ["onr_v1_154_broker", "onr_v1_170_nomad-allies"];
    const { state } = nativeInput(poisonedWaterSupply, connectionIds);
    const fixture = RealEngineFixtureBuilder.forState(state);
    fixture.withRunnerResourceInstalled(connectionIds[0]!);
    const isPlay = (action: ReturnType<typeof getLegalActions>[number]) =>
      action.type === "play_event" &&
      state.cardInstances[action.source!]?.definitionId === poisonedWaterSupply;
    expect(getLegalActions(state, "runner").some(isPlay)).toBe(false);
    fixture.withRunnerResourceInstalled(connectionIds[1]!);
    const action = getLegalActions(state, "runner").find(isPlay)!;
    expect(action).toBeDefined();
    const profiles = buildActionCardSemanticProfilesByDefinitionId();
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: state.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        [action.source!]: poisonedWaterSupply,
      },
      cardSemanticProfilesByDefinitionId: profiles,
    });
    expect(candidate!.functionalEffects).toContainEqual(payoff);
    expect(candidate!.functionalEffects).toContainEqual({
      kind: "resource_trash",
      scope: "installed_card",
      timing: "action",
      resource: "cards",
      target: "installed_card_trash_cost",
      amount: 2,
      finite: true,
    });
    expect(candidate!.costProfile.selfDamage).toBeUndefined();
    expect(runnerStrategicExchangeKinds(candidate!)).toContain(
      "board_or_hand_sacrifice",
    );
    expect(runnerStrategicExchangeKinds(candidate!)).not.toContain(
      "self_damage",
    );
    const opened = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(opened.state.runner.credits).toBe(state.runner.credits - 4);
    expect(opened.state.corp.badPublicity).toBe(state.corp.badPublicity);
    const choice = opened.state.pendingChoice!;
    expect(choice.options).toHaveLength(2);
    const resolution = getLegalActions(opened.state, "runner").find(
      (a) => a.type === "resolve_choice",
    )!;
    const resolved = applyAction(opened.state, {
      matchId: state.matchId,
      side: "runner",
      actionId: resolution.actionId,
      clientKnownStateVersion: opened.state.stateVersion,
      selectedChoices: {
        choiceId: choice.choiceId,
        selectedOptionIds: choice.options.map((option) => option.id),
      },
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.state.corp.badPublicity).toBe(state.corp.badPublicity + 1);
    expect(resolved.state.runner.coreDamage).toBe(state.runner.coreDamage);
    expect(resolved.state.runner.rig.resources).toHaveLength(0);
    const replay = replayEvents(state, [opened.event, resolved.event]);
    expect(replay.ok).toBe(true);
    if (replay.ok)
      expect(hashState(replay.state)).toBe(hashState(resolved.state));
  });
});
