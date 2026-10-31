import { chooseAiAction } from "./ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "./plans/resident-plan-portfolio-memory";
import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";
import { buildAiDecisionInput } from "./runtime/ai-decision-input";
import {
  createGameAfterSetup,
  applyAction,
  getLegalActions,
} from "@netgrid/engine";
import { RealEngineFixtureBuilder } from "./evaluation/real-engine-fixture-builder";
import { evaluateRunnerHandDevelopment } from "./runner/hand-development/hand-development-evaluation";
import standardCatalog from "../../../data/decks/standard-deck-catalog-1.0.0.json";
const id = "onr_v1_064_skivviss";
const entry = () =>
  cardSpecPlanningCards().find((c) => c.definition.id === id)!;
const expected = {
  kind: "persistent_counter_effect",
  scope: "corp",
  timing: "start_of_turn",
  resource: "cards",
  target: "virus.corp_forced_draw_per_counter",
  amount: 1,
  amountKind: "dynamic",
  repeatable: true,
};
function mechanical() {
  const e = entry();
  return { ...e, planning: { ...e.planning, planningAnnotations: undefined } };
}
function nativeInput() {
  const e = standardCatalog.decks.find(
    (d) =>
      d.cards.some((c) => c.cardId === id) &&
      d.name === "Skivviss Mill Pressure",
  )!;
  if (!e) throw Error("missing_standard_deck");
  const deck = {
    id: e.standardDeckId,
    name: e.name,
    side: "runner" as const,
    identity: e.identityCardId,
    cards: e.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  };
  let s = createGameAfterSetup({
    seed: "meta575-forced-draw-regression",
    runnerDeck: deck,
  });
  RealEngineFixtureBuilder.forState(s).withCorpHqSize(0);
  for (let n = 0; n < 8 && s.activeSide === "corp"; n++) {
    const a = getLegalActions(s, "corp").find(
      (a) => a.type === "mandatory_draw" || a.type === "end_turn",
    );
    if (!a) throw Error("missing_transition");
    const r = applyAction(s, {
      matchId: s.matchId,
      side: "corp",
      actionId: a.actionId,
      clientKnownStateVersion: s.stateVersion,
    });
    if (!r.ok) throw Error(r.error.message);
    s = r.state;
  }
  RealEngineFixtureBuilder.forState(s)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip(id)
    .withRunnerCardInGrip("onr_v1_095_jack-n-joe")
    .withRunnerCardInGrip("onr_v1_097_livewires-contacts")
    .withRunnerCardInGrip("onr_v1_133_militech-mram-chip")
    .withRunnerCredits(10)
    .withRunnerClicks(4);
  const input = buildAiDecisionInput(s, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: deck.id,
      side: "runner",
      cards: deck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
    },
  });
  return { state: s, input };
}
describe("canonical forced Corp draw reaches Runner development", () => {
  it("materializes the real pressure preparation with legal owner and unchanged input", () => {
    resetResidentPlanPortfolioMemory();
    const { state, input } = nativeInput(),
      before = JSON.stringify(input);
    const d = chooseAiAction(input);
    expect(d.actionId).toContain("install_card.runner_onr_v1_064_skivviss");
    expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
      "runner.pressure_central",
    );
    expect(d.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: d.actionId,
      stateVersion: state.stateVersion,
    });
    expect(d.fallbackUsed).toBe(false);
    expect(JSON.stringify(input)).toBe(before);
    const r = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: d.actionId!,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw Error(r.error.message);
    expect(
      r.state.runner.rig.programs.some(
        (i) => r.state.cardInstances[i]?.definitionId === id,
      ),
    ).toBe(true);
  });
  it("projects the exact counter payoff without a strategy annotation", () => {
    expect(deriveCardSpecAiHint(mechanical() as never).effects).toContainEqual(expected);
    expect(AI_HINTS_BY_CARD.get(id)?.effects).toContainEqual(expected);
  });
  it("uses mechanics rather than the card identity", () => {
    const source = mechanical(),
      base = cardSpecPlanningCards().find(
        (c) =>
          c.definition.side === "runner" &&
          !c.planning.engine.abilities &&
          !c.planning.engine.virusCounter,
      )!;
    expect(
      deriveCardSpecAiHint({
        ...base,
        definition: {
          ...base.definition,
          title: "Unrelated identity",
          rulesText: "Unrelated text",
        },
        planning: {
          ...base.planning,
          planningAnnotations: undefined,
          engine: {
            ...base.planning.engine,
            virusCounter: source.planning.engine.virusCounter,
          },
        },
      } as never).effects,
    ).toContainEqual(expected);
  });
  it.each([0, -1, 1.5])(
    "rejects an invalid per-counter amount %s",
    (amountPerCounter) => {
      const e = mechanical();
      expect(() =>
        deriveCardSpecAiHint({
          ...e,
          planning: {
            ...e.planning,
            engine: {
              ...e.planning.engine,
              virusCounter: {
                ...e.planning.engine.virusCounter,
                startOfCorpTurn: {
                  kind: "draw_extra_cards_per_counter",
                  amountPerCounter,
                  visibility: "hidden_info_barrier",
                },
              },
            },
          },
        } as never),
      ).toThrow("card_spec_unknown_virus_forced_draw_shape");
    },
  );
  it("keeps the actual target as Corp pressure instead of Runner draw/search", () => {
    const { input } = nativeInput(),
      before = JSON.stringify(input);
    const v = evaluateRunnerHandDevelopment({
      input,
      deckCapabilities: input.ownDeckCapabilities!,
      strategicIntent: input.ownRunnerStrategicIntent!,
    }).find((v) => v.definitionId === id)!;
    expect(v.developmentRole).toBe("access_payoff");
    expect(
      evaluateRunnerHandDevelopment({ input }).find(
        (v) => v.definitionId === "onr_v1_095_jack-n-joe",
      )?.developmentRole,
    ).toBe("draw_or_search_engine");
    expect(v.persistentInstallEvaluation?.newFunctionalCoverage).toContain(
      "access_support",
    );
    expect(v.persistentInstallEvaluation?.newFunctionalCoverage).not.toContain(
      "search_support",
    );
    expect(input.legalActions.some((a) => a.actionId === v.legalActionId)).toBe(
      true,
    );
    expect(JSON.stringify(input)).toBe(before);
    expect(
      input.ownDeckStrategyProfile!.strategyScores["runner.rnd_pressure"]!
        .anchorScore,
    ).toBeGreaterThan(0);
  });
});
