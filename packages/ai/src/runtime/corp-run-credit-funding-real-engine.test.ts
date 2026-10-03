import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameEvent, GameState, LegalAction } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { corpRunDefenseAbilityAssessment } from "../corp/defense/defense-run-response";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";

const BOOT = "onr_proteus_058_executive-boot-camp";
const COLONEL = "onr_proteus_015_colonel-failure";
const decks = Object.fromEntries(
  (["corp", "runner"] as const).map((side) => {
    const id =
      side === "corp"
        ? "standard_corp_syds_ice_pfandhaus_2026_07_09"
        : "standard_runner_bit_denial_lock";
    const deck = catalog.decks.find((d) => d.standardDeckId === id)!;
    return [
      side,
      {
        id,
        name: deck.name,
        side,
        identity: deck.identityCardId,
        cards: deck.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
      },
    ];
  }),
);
beforeEach(() => resetResidentPlanPortfolioMemory());

function apply(state: GameState, action: LegalAction, events?: GameEvent[]) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw Error(result.error.message);
  events?.push(result.event);
  return result.state;
}
function fixture(corpCredits = 15) {
  let state = createGameAfterSetup({
    seed: "boot-current-rez-gap",
    corpDeck: decks.corp!,
    runnerDeck: decks.runner!,
    traceRulesProfile: "modern_open",
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpRemoteRoot("hq", BOOT, 0, { faceup: true, rezzed: true })
    .withCorpIceOnServer("hq", COLONEL)
    .withRunnerProgramInstalled("onr_v1_039_krash")
    .withCorpCredits(corpCredits)
    .withRunnerCredits(13)
    .withCorpHqSize(5);
  state.corp.clicks = 0;
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!,
  );
  return apply(
    state,
    getLegalActions(state, "runner").find(
      (a) => a.type === "start_run" && a.payload?.serverId === "hq",
    )!,
  );
}
function input(state: GameState) {
  const d = decks.corp!;
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: d.id,
      side: "corp",
      cards: d.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
    },
  });
}
function assessment(current: ReturnType<typeof input>) {
  const action = current.legalActions.find(
    (a) =>
      a.type === "activated_card_ability" &&
      a.abilityRef?.sourceAbilityId.endsWith(
        ":during_run_discard_for_two_run_credits",
      ),
  )!;
  const candidate = buildActionSemanticCandidates(current).find(
    (c) => c.actionId === action.actionId,
  )!;
  return corpRunDefenseAbilityAssessment(current, candidate);
}

it.each([15, 16])(
  "funds the current native 17-credit rez from %i credits under Defense",
  (corpCredits) => {
    let state = fixture(corpCredits);
    expect(
      getLegalActions(state, "corp").some((a) => a.type === "rez_ice"),
    ).toBe(false);
    const current = input(state);
    const ice = current.playerView.servers.find((s) => s.id === "hq")!.ice[0]!;
    expect(ice.effectiveRezCostQuote).toMatchObject({
      complete: true,
      finalCredits: 17,
      expiresAtStateVersion: state.stateVersion,
    });
    const before = hashState(state);
    expect(assessment(current)).toMatchObject({
      productive: true,
      serverId: "hq",
    });
    const decision = chooseCorpAction(current);
    const action = getLegalActions(state, "corp").find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action.type).toBe("activated_card_ability");
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("corp.defend_servers");
    expect(hashState(state)).toBe(before);
    const original = structuredClone(state),
      events: GameEvent[] = [];
    state = apply(state, action, events);
    expect(state.corp.credits).toBe(corpCredits + 2);
    expect(state.run?.corpRunTemporaryCredits?.remaining).toBe(2);
    expect(state.corp.hq.length).toBe(original.corp.hq.length - 1);
    const rezDecision = chooseCorpAction(input(state));
    const rez = getLegalActions(state, "corp").find(
      (a) => a.actionId === rezDecision.actionId,
    )!;
    expect(rez.type).toBe("rez_ice");
    expect(rez.source).toBe(ice.instanceId);
    state = apply(state, rez, events);
    expect(state.corp.credits).toBe(corpCredits + 2 - 17);
    expect(state.run?.corpRunTemporaryCredits?.remaining).toBe(0);
    const replay = replayEvents(original, events);
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  },
);

it.each([14, 17, 20])(
  "does not spend a random HQ card when %i credits do not give a closable current gap",
  (credits) => {
    expect(assessment(input(fixture(credits)))?.productive).toBe(false);
  },
);

it.each([
  "missing",
  "stale",
  "other_card",
  "other_server",
  "variable",
  "additional_cost",
])("fails closed for a %s current rez quote", (defect) => {
  const current = input(fixture());
  const ice = current.playerView.servers.find((s) => s.id === "hq")!.ice[0]!;
  const quote = ice.effectiveRezCostQuote!;
  if (defect === "missing") delete ice.effectiveRezCostQuote;
  else if (defect === "stale") quote.expiresAtStateVersion--;
  else if (defect === "other_card") quote.cardId = "other-ice";
  else if (defect === "other_server") quote.targetServerId = "rd";
  else if (defect === "variable")
    Object.assign(quote, { costKind: "variable" });
  else if (quote.complete) quote.mandatoryAdditionalCosts.agendaPoints = 1;
  expect(assessment(current)?.productive).toBe(false);
});

it("preserves the current quote and choice when hidden Runner hand identities change", () => {
  const left = fixture(),
    right = structuredClone(left);
  [right.runner.grip[0], right.runner.stack[0]] = [
    right.runner.stack[0]!,
    right.runner.grip[0]!,
  ];
  right.cardInstances[right.runner.grip[0]!]!.zone = {
    side: "runner",
    zone: "grip",
  };
  right.cardInstances[right.runner.stack[0]!]!.zone = {
    side: "runner",
    zone: "stack",
  };
  expect(getPlayerView(left, "corp")).toEqual(getPlayerView(right, "corp"));
  const first = chooseCorpAction(input(left));
  resetResidentPlanPortfolioMemory();
  expect(chooseCorpAction(input(right)).actionId).toBe(first.actionId);
});
