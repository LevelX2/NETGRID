import { applyAction, createGameAfterSetup, getLegalActions } from "@netgrid/engine";
import type { DeckDefinition, GameState, LegalAction, Side } from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import catalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";

function deck(id: string, side: Side): DeckDefinition {
  const entry = catalog.decks.find((candidate) => candidate.standardDeckId === id);
  if (!entry) throw new Error("Missing standard deck " + id);
  return {
    id,
    name: entry.name,
    side,
    identity: entry.identityCardId,
    cards: entry.cards.map(({ cardId, quantity }) => ({ id: cardId, quantity })),
  };
}

const runnerDeck = deck("standard_runner_connection_pressure_publicity_network", "runner");
const corpDeck = deck("standard_corp_mp1ddh7c", "corp");
const firstAgenda = "onr_v1_213_private-cybernet-police";
const secondAgenda = "onr_v1_207_netwatch-operations-office";

function step(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  if (!action) throw new Error("Missing native action in " + state.stateVersion);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function fixture(firstAgendaExposed: boolean): GameState {
  let state = createGameAfterSetup({
    seed: "meta-730-cumulative-flood-exposure",
    agendaPointsToWin: 7,
    runnerDeck,
    corpDeck,
  });
  state = step(state, "corp", (action) => action.type === "mandatory_draw");
  const builder = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(secondAgenda)
    .withCorpCardInHq("onr_v1_212_priority-requisition")
    .withCorpCardInHq("onr_v1_217_strike-force-kali")
    .withCorpRemoteRoot("remote_1", "onr_v1_208_on-call-solo-team")
    .withRezzedCorpIceOnServer("remote_1", "onr_v1_245_fire-wall")
    .withCorpCredits(19)
    .withRunnerCredits(firstAgendaExposed ? 24 : 5)
    .withRunnerProgramInstalled("onr_v1_039_krash");
  if (firstAgendaExposed) builder.withCorpRemoteRoot("remote_2", firstAgenda);
  else builder.withCorpCardInHq(firstAgenda);

  for (const definitionId of [
    "onr_v1_193_corporate-coup",
    "onr_v1_201_executive-extraction",
    "onr_v1_214_project-babylon",
  ]) {
    builder.withCorpCardInHq(definitionId);
    const id = state.corp.hq.pop()!;
    state.runner.scoreArea.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "runner", zone: "scoreArea" },
      controller: "runner",
      faceup: true,
      rezzed: true,
    };
  }
  for (const id of state.corp.rd.splice(2)) {
    state.corp.archives.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "corp", zone: "archives" },
      faceup: false,
      rezzed: false,
    };
  }
  state.corp.clicks = 2;
  return state;
}

function secondAgendaOffer(action: LegalAction): boolean {
  return (
    action.type === "install_card" &&
    action.payload?.serverId === "new_remote" &&
    action.source.includes(secondAgenda)
  );
}

function projectSecondAgenda(state: GameState): CorpScoreProjectSignal {
  const input = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: corpDeck.id,
      side: "corp",
      cards: corpDeck.cards.map(({ id, quantity }) => ({ cardId: id, quantity })),
    },
  });
  expect(input.playerView.opponent.agendaPoints).toBe(4);
  expect(input.legalActions.some(secondAgendaOffer)).toBe(true);
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  const plan = residentPlanPortfolioSnapshot(input)?.instances.find(
    (instance) =>
      instance.moduleId === "corp.score_agenda" &&
      instance.dedupeKey.includes(secondAgenda) &&
      instance.dedupeKey.endsWith(":new_remote"),
  );
  expect(plan).toBeDefined();
  return (plan!.moduleState as { signal: CorpScoreProjectSignal }).signal;
}

beforeEach(resetResidentPlanPortfolioMemory);

describe("agenda flood exposure across open remotes", () => {
  it("requires protection before offering both point sources in one Runner turn", () => {
    const state = fixture(true);
    expect(projectSecondAgenda(state)).toMatchObject({
      feasible: false,
      routeAssessment: "corp_score_protection_required",
    });

    let exposed = step(state, "corp", secondAgendaOffer);
    exposed = step(exposed, "corp", (action) => action.type === "end_turn");
    for (const serverId of ["remote_2", "remote_3"]) {
      exposed = step(
        exposed,
        "runner",
        (action) => action.type === "start_run" && action.payload?.serverId === serverId,
      );
      exposed = step(exposed, "runner", (action) => action.type === "access_card");
      exposed = step(exposed, "runner", (action) => action.type === "steal_agenda");
    }
    expect(exposed.winner).toBe("runner");
  });

  it("keeps one exposed nonterminal agenda admissible during a genuine R&D emergency", () => {
    expect(projectSecondAgenda(fixture(false))).toMatchObject({
      feasible: true,
      routeAssessment: "corp_deckout_agenda_flood_score_install",
    });
  });
});
