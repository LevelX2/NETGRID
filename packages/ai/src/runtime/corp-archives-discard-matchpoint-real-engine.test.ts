import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { chooseCorpAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";

beforeEach(() => resetResidentPlanPortfolioMemory());

function fixture() {
  const deck = (id: string, side: "corp" | "runner") => {
    const d = catalog.decks.find((x) => x.standardDeckId === id)!;
    return {
      id,
      side,
      name: d.name,
      identity: d.identityCardId,
      cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
    };
  };
  const corpDeck = deck("standard_corp_syds_ice_pfandhaus_2026_07_09", "corp");
  let state = createGameAfterSetup({
    seed: "existing-archives-discard-matchpoint",
    corpDeck,
    runnerDeck: deck("standard_runner_bit_denial_lock", "runner"),
    traceRulesProfile: "modern_open",
  });
  const draw = getLegalActions(state, "corp").find(
    (a) => a.type === "mandatory_draw",
  )!;
  const drawn = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: draw.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!drawn.ok) throw Error(drawn.error.message);
  state = drawn.state;
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(0).withCorpCredits(5);
  const moved = new Set<string>();
  const place = (definition: string, zone: "hq" | "archives") => {
    const card = Object.values(state.cardInstances).find(
      (c) => c.definitionId === definition && !moved.has(c.instanceId),
    )!;
    moved.add(card.instanceId);
    state.corp.rd = state.corp.rd.filter((id) => id !== card.instanceId);
    state.corp.hq = state.corp.hq.filter((id) => id !== card.instanceId);
    state.corp.archives = state.corp.archives.filter(
      (id) => id !== card.instanceId,
    );
    state.corp[zone].push(card.instanceId);
    card.zone = { side: "corp", zone };
    card.faceup = zone === "archives";
    return card.instanceId;
  };
  const existing = place("onr_v1_197_data-fort-reclamation", "archives");
  place("onr_v1_197_data-fort-reclamation", "hq");
  place("onr_v1_197_data-fort-reclamation", "hq");
  place("onr_proteus_007_project-venice", "hq");
  place("onr_v1_216_security-purge", "hq");
  place("onr_classic_018_reclamation-project", "hq");
  place("onr_proteus_015_colonel-failure", "hq");
  state.runner.agendaPoints = 4;
  state.corp.agendaPoints = 6;
  state.corp.clicks = 0;
  const end = getLegalActions(state, "corp").find(
    (a) => a.type === "end_turn",
  )!;
  const ended = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: end.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!ended.ok) throw Error(ended.error.message);
  return { state: ended.state, corpDeck, existing };
}

it("binds a nonagenda discard through the existing hand owner and replays the native choice", () => {
  const { state, corpDeck, existing } = fixture();
  const input = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: corpDeck.id,
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
  expect(
    input.playerView.own.heapOrArchives.find((c) => c.instanceId === existing)
      ?.agendaPoints,
  ).toBe(2);
  const before = hashState(state);
  const decision = chooseCorpAction(input);
  const native = getLegalActions(state, "corp").find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(native.type).toBe("resolve_choice");
  const pf = decision.decisionDebug!.planFirstDecision!;
  expect(pf.selectedPlan!.moduleId).toBe("corp.hand_and_agenda_management");
  expect(pf.selectedPlan!.phase).toBe("discard_window");
  expect(decision.selectedChoices!.choiceId).toBe(
    state.pendingChoice!.choiceId,
  );
  const options = decision.selectedChoices!.selectedOptionIds;
  expect(options).toHaveLength(1);
  const selected = state.pendingChoice!.options.find(
    (o) => o.id === options[0],
  )!;
  const card = state.cardInstances[String(selected.value)]!;
  expect(card.definitionId).not.toBe("onr_v1_197_data-fort-reclamation");
  expect(card.definitionId).not.toBe("onr_v1_216_security-purge");
  expect(card.definitionId).not.toBe("onr_proteus_007_project-venice");
  expect(hashState(state)).toBe(before);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: native.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: decision.selectedChoices,
  });
  if (!result.ok) throw Error(result.error.message);
  expect(result.state.corp.hq).toHaveLength(5);
  const replay = replayEvents(state, [result.event]);
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(result.state));
});
