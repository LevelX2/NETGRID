import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";
import { corpOptionalDrawCapacity } from "./corp-economy/corp-defensive-draw";

const DAY = "onr_v1_288_day-shift";
const ANNUAL = "onr_v1_282_annual-reviews";
const decks = Object.fromEntries(
  (["corp", "runner"] as const).map((side) => {
    const id =
      side === "corp"
        ? "standard_corp_universal_fast_advance"
        : "standard_runner_krashkurs_clown_kreditmaschine_2026_07_11";
    const entry = catalog.decks.find((d) => d.standardDeckId === id)!;
    return [
      side,
      {
        id,
        name: entry.name,
        side,
        identity: entry.identityCardId,
        cards: entry.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
      },
    ];
  }),
);
beforeEach(() => resetResidentPlanPortfolioMemory());
function fixture(drawCard = DAY, extraCard = false) {
  let state = createGameAfterSetup({
    seed: "defense-draw-operation",
    corpDeck: decks.corp!,
    runnerDeck: decks.runner!,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!
      .actionId,
  );
  const f = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(15)
    .withCorpCardInHq(drawCard)
    .withCorpCardInHq("onr_v1_347_vapor-ops")
    .withCorpCardInHq("onr_v1_312_chicago-branch")
    .withRezzedCorpIceOnServer("hq", "onr_proteus_038_snowbank")
    .withRezzedCorpIceOnServer("rd", "onr_v1_237_data-wall")
    .withRunnerCredits(3)
    .withRunnerProgramInstalled("onr_v1_039_krash");
  if (extraCard) f.withCorpCardInHq("onr_v1_297_overtime-incentives");
  state.turnSerial = 6;
  return state;
}
function input(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: decks.corp!.id,
      side: "corp",
      cards: decks.corp!.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
function apply(
  state: GameState,
  actionId: string,
  selectedChoices?: Record<string, unknown>,
) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
it.each([false, true])(
  "uses draw-and-credit under the exact defense owner with extra HQ card %s",
  (extra) => {
    const state = fixture(DAY, extra),
      i = input(state),
      decision = chooseCorpAction(i);
    const action = i.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action.type).toBe("play_operation");
    expect(action.actionId).toContain(DAY);
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("corp.defend_servers");
    expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: action.actionId,
      stateVersion: state.stateVersion,
    });
    expect(decision.fallbackUsed).toBe(false);
    const after = apply(state, action.actionId, decision.selectedChoices);
    expect(after.corp.hq).toHaveLength(state.corp.hq.length + 1);
    expect(after.corp.credits).toBe(state.corp.credits + 1);
    expect(after.corp.clicks).toBe(state.corp.clicks - 1);
  },
);
it("prefers an admitted three-card operation for the same defense search", () => {
  const state = fixture(ANNUAL),
    i = input(state),
    decision = chooseCorpAction(i);
  expect(decision.actionId).toContain(ANNUAL);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
  expect(
    apply(state, decision.actionId!, decision.selectedChoices).corp.hq,
  ).toHaveLength(5);
});
it("retains the basic draw when a three-card operation would overflow HQ", () => {
  const state = fixture(ANNUAL, true),
    i = input(state);
  const operation = i.legalActions.find((a) => a.actionId.includes(ANNUAL))!;
  expect(corpOptionalDrawCapacity(i, operation).eligible).toBe(false);
  expect(chooseCorpAction(i).actionId).toBe("corp.draw_card");
});
it("keeps a terminal score ahead of the admitted defense draw", () => {
  const state = fixture();
  RealEngineFixtureBuilder.forState(state).withCorpRemoteRoot(
    "remote_1",
    "onr_classic_002_superserum",
    3,
  );
  for (const definitionId of [
    "onr_v1_196_corporate-war",
    "onr_v1_194_corporate-downsizing",
  ]) {
    const id = state.corp.rd.find(
      (id) => state.cardInstances[id]!.definitionId === definitionId,
    )!;
    state.corp.rd = state.corp.rd.filter((cardId) => cardId !== id);
    state.corp.scoreArea.push(id);
    Object.assign(state.cardInstances[id]!, {
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    });
  }
  const i = input(state),
    decision = chooseCorpAction(i);
  expect(i.playerView.own.agendaPoints).toBe(5);
  expect(
    i.legalActions.find((a) => a.actionId === decision.actionId)?.type,
  ).toBe("score_agenda");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.score_agenda");
  expect(
    apply(state, decision.actionId!, decision.selectedChoices).stateVersion,
  ).toBe(state.stateVersion + 1);
});
it("does not consume the mandatory-draw reserve through the multi-draw operation", () => {
  const state = fixture();
  const removed = state.corp.rd.splice(2);
  for (const id of removed) {
    state.corp.archives.push(id);
    state.cardInstances[id]!.zone = { side: "corp", zone: "archives" };
  }
  const i = input(state),
    decision = chooseCorpAction(i);
  expect(decision.actionId).not.toContain(DAY);
  expect(decision.decisionDebug?.planFirstDecision?.dispositions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        actionId: i.legalActions.find((a) => a.actionId.includes(DAY))!
          .actionId,
        disposition: "explicitly_nonproductive",
        evidenceCode: expect.stringContaining(
          "corp_voluntary_draw_blocked_deckout_horizon",
        ),
      }),
    ]),
  );
});
