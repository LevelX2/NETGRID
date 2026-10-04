import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { DeckDefinition } from "@netgrid/shared";
import { metaTenStandardDecks as catalog } from "../evaluation/meta-ten-standard-decks.test-support";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { selectedForcedChoiceOptionIds } from "./select-card-choice-option";

afterEach(resetResidentPlanPortfolioMemory);

function reorderWindow(definitions: string[]) {
  const runner = catalog.decks.find(
    (d) =>
      d.standardDeckId === "standard_runner_rent_i_con_shellspiel_2026_07_17",
  )!;
  const corp = catalog.decks.find(
    (d) => d.standardDeckId === "standard_corp_original_speed_v10",
  )!;
  const deck = (d: typeof corp): DeckDefinition => ({
    id: d.standardDeckId,
    name: d.name,
    side: d.side as "runner" | "corp",
    identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  });
  let state = createGameAfterSetup({
    seed: "sp513-ordered-rd",
    runnerDeck: deck(runner),
    corpDeck: deck(corp),
  });
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 1;
  const builder = RealEngineFixtureBuilder.forState(state)
    .withCorpCredits(10)
    .withCorpCardInHq("onr_v1_298_planning-consultants");
  const top = definitions.map((definition) => {
    builder.withCorpCardInHq(definition);
    const id = state.corp.hq.find(
      (id) => state.cardInstances[id]!.definitionId === definition,
    )!;
    state.corp.hq = state.corp.hq.filter((candidate) => candidate !== id);
    state.cardInstances[id]!.zone = { side: "corp", zone: "rd" };
    return id;
  });
  state.corp.rd.unshift(...top);
  const operation = getLegalActions(state, "corp").find(
    (a) =>
      a.type === "play_operation" && a.source?.includes("planning-consultants"),
  )!;
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: operation.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw Error(result.error.message);
  state = result.state;
  const input = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: corp.standardDeckId,
      side: "corp",
      cards: corp.cards,
    },
    eventTail: state.eventLog,
  });
  return { state, input: { ...input, ...buildAiDecisionInputDto(input) } };
}

const exposedTycho = [
  "onr_v1_220_tycho-extension",
  "onr_v1_288_day-shift",
  "onr_v1_232_crystal-wall",
  "onr_v1_277_virizz",
  "onr_v1_226_canis-minor",
];
const exposedTwoAgendas = [
  "onr_v1_214_project-babylon",
  "onr_v1_220_tycho-extension",
  "onr_v1_277_virizz",
  "onr_v1_261_quandary",
  "onr_v1_252_keeper",
];

it.each([[exposedTycho], [exposedTwoAgendas]])(
  "owns and applies a free permutation of the actual top five cards: %j",
  (definitions) => {
    const { state, input } = reorderWindow(definitions);
    expect(input.playerView.pendingChoice?.selectionOrdering).toBe("ordered");
    const decision = chooseAiAction(input);
    const owner = `plan:corp.hand_and_agenda_management:${encodeURIComponent(`rd-reorder:${input.playerView.pendingChoice!.choiceId}:${input.playerView.stateVersion}`)}`;
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      selectedPlan: { moduleId: "corp.hand_and_agenda_management" },
      rootPlanInstanceId: owner,
      leafExecutorInstanceId: owner,
      route: { stepId: `${owner}:rd_reorder_window` },
    });
    const selected = decision.selectedChoices as {
      choiceId: string;
      selectedOptionIds: string[];
    };
    expect(new Set(selected.selectedOptionIds)).toEqual(
      new Set(input.playerView.pendingChoice!.options.map((o) => o.id)),
    );
    const reordered = selected.selectedOptionIds.map(
      (id) =>
        input.playerView.pendingChoice!.options.find((o) => o.id === id)!.card!,
    );
    expect(reordered.slice(0, 2).every((card) => card.type !== "agenda")).toBe(
      true,
    );
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: decision.actionId!,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: decision.selectedChoices!,
    });
    if (!result.ok) throw Error(result.error.message);
    expect(result.state.corp.rd.slice(0, 5)).toEqual(
      reordered.map((card) => card.instanceId),
    );
  },
);

it.each(["side", "state", "source", "quote"])(
  "rejects a changed ordered-choice %s",
  (boundary) => {
    const { input } = reorderWindow(exposedTwoAgendas),
      choice = input.playerView.pendingChoice!;
    if (boundary === "side") choice.side = "runner";
    if (boundary === "state") choice.stateVersion++;
    if (boundary === "source") choice.sourceCardInstanceId = "different-source";
    if (boundary === "quote") input.playerView.corpCentralAccessQuotes = [];
    expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
  },
);

it("distinguishes the forced set from a free ordered permutation", () => {
  const { input } = reorderWindow(exposedTycho),
    choice = input.playerView.pendingChoice!;
  expect(selectedForcedChoiceOptionIds(choice, choice.options)).toBeUndefined();
  expect(
    selectedForcedChoiceOptionIds(
      { ...choice, selectionOrdering: "unordered" },
      choice.options,
    ),
  ).toEqual(choice.options.map((o) => o.id));
});
