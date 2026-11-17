import { applyAction, createGame, getLegalActions } from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type DeckDefinition,
  type GameState,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { allocateCorpCentralDefenseFromAiFacts } from "../../corp/defense/corp-central-defense-facts-adapter";
import { corpAcuteDefenseHandOptions } from "../../corp/defense/defense-hand-retention";
import { prepareCorpPunishHandRetention } from "../../corp/punish/punish-hand-retention";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { releaseAiMatchRuntime } from "../../runtime/match-runtime-memory";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import { shadoeTagAndBagDeckForTest } from "../meta-ten-standard-decks.test-support";

const TROJAN = 518;
const AUDIT = 495;
const OVERTIME = 509;
const PUNITIVE = 513;
const SCORCHED = 514;
const URBAN = 519;
const POLITICAL_COUP = 421;
const WALL = 491;
const FALL_GUY = 373;
const CREDIT = 493;
const FILLER = 404;
const ON_CALL = 420;
const HUNTER = 461;
const SHOCK = 480;
const CHANCE = 496;

const matchIds = new Set<string>();
afterEach(() => {
  for (const matchId of matchIds) releaseAiMatchRuntime(matchId);
  matchIds.clear();
  resetResidentPlanPortfolioMemory();
});

it("keeps the last tag source when R&D still contains compatible damage", () => {
  const { input, state } = cleanup({
    corpDeck: shadoeTagAndBagDeckForTest(),
    hand: [FILLER, POLITICAL_COUP, TROJAN, OVERTIME, SHOCK, ON_CALL, OVERTIME],
    archives: [
      CREDIT,
      CHANCE,
      CHANCE,
      AUDIT,
      PUNITIVE,
      HUNTER,
      PUNITIVE,
      AUDIT,
    ],
    credits: 9,
  });
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  const { discarded, retained } = resolveCleanup(input, state);
  expect(discarded).toEqual([OVERTIME, OVERTIME]);
  expect(retained.map((card) => card.definitionId)).toContain(TROJAN);
  const retention = prepareCorpPunishHandRetention(input);
  expect(retention(retained)).toMatchObject({
    damage: 0,
    drawOptions: expect.any(Number),
  });
  expect(retention(retained).drawOptions).toBeGreaterThan(0);
  expect(
    retention(retained.filter((card) => card.definitionId !== TROJAN)).value,
  ).toBe(0);
});

describe("native cleanup choice", () => {
  it.each([
    { sources: 2, runnerCredits: 3, damage: 4 },
    { sources: 1, runnerCredits: 6, damage: 0 },
  ])(
    "shares the Runner credit pool across incoming tags with $sources sources and $runnerCredits credits",
    ({ sources, runnerCredits, damage }) => {
      const { input } = cleanup({
        hand: [TROJAN, TROJAN, SCORCHED, OVERTIME, WALL, CREDIT],
        credits: 30,
        grip: 3,
      });
      const opponent = input.playerView.opponent;
      opponent.credits = runnerCredits;
      opponent.rig = Array.from({ length: sources }, (_, index) => ({
        instanceId: `visible-nasuko-${index}`,
        definitionId: 347,
        type: "resource",
        known: true,
      }));
      const retained = input.playerView.own.gripOrHq.filter(
        (card) =>
          card.definitionId === TROJAN || card.definitionId === SCORCHED,
      );
      expect(prepareCorpPunishHandRetention(input)(retained).damage).toBe(
        damage,
      );
    },
  );

  it("keeps two distinct damage instances when both are needed and funded", () => {
    const { input, state } = cleanup({
      hand: [TROJAN, SCORCHED, SCORCHED, OVERTIME, WALL, CREDIT],
      credits: 8,
    });
    const { retained, discarded } = resolveCleanup(input, state);
    expect(discarded).not.toContain(SCORCHED);
    expect(discarded).not.toContain(TROJAN);
    expect(prepareCorpPunishHandRetention(input)(retained).damage).toBe(8);
  });

  it.each([
    { credits: 8, prevention: false, payoff: SCORCHED, grip: 4, damage: 4 },
    { credits: 7, prevention: false, payoff: URBAN, grip: 5, damage: 0 },
    { credits: 8, prevention: true, payoff: URBAN, grip: 5, damage: 0 },
  ])(
    "assesses the funded damage, not a Flatline, with $credits credits, $grip grip and prevention=$prevention",
    (testCase) => {
      const { input } = cleanup({
        hand: [TROJAN, testCase.payoff, POLITICAL_COUP, WALL, CREDIT, FILLER],
        credits: testCase.credits,
        fallGuy: testCase.prevention,
        grip: testCase.grip,
      });
      const retention = prepareCorpPunishHandRetention(input)(
        input.playerView.own.gripOrHq,
      );
      expect(retention.damage).toBe(testCase.damage);
      if (testCase.damage === 0) expect(retention.value).toBe(0);
      else {
        // The same damage exceeds a three-card grip, but only empties four.
        const thinnerGrip = structuredClone(input);
        thinnerGrip.playerView.opponent.handCount -= 1;
        const thinner = prepareCorpPunishHandRetention(thinnerGrip)(
          thinnerGrip.playerView.own.gripOrHq,
        );
        expect(thinner.damage).toBe(retention.damage);
        expect(thinner.value).toBeGreaterThan(retention.value);
      }
    },
  );

  it.each([
    { credits: 12, expectedBursts: 2, grip: 5 },
    { credits: 11, expectedBursts: 1, grip: 5 },
  ])(
    "keeps the funded line with $credits credits",
    ({ credits, expectedBursts, grip }) => {
      const { input, state } = cleanup({
        hand: [OVERTIME, OVERTIME, POLITICAL_COUP, TROJAN, SCORCHED, SCORCHED],
        credits,
        scored: [POLITICAL_COUP, ON_CALL],
        grip,
      });
      const { discarded, retained } = resolveCleanup(input, state);
      expect(
        retained.filter((card) => card.definitionId === OVERTIME),
      ).toHaveLength(expectedBursts);
      expect(discarded).not.toContain(POLITICAL_COUP);
      expect(expectedBursts === 2 ? [TROJAN, SCORCHED] : [OVERTIME]).toContain(
        discarded[0],
      );
    },
  );

  it("keeps the only funded stop for an acute open central over a conditional damage package", () => {
    const { input, state } = cleanup({
      hand: [TROJAN, URBAN, WALL, POLITICAL_COUP, FILLER, FILLER],
      credits: 8,
      agendaPointsToWin: 2,
      grip: 4,
    });
    const allocation = allocateCorpCentralDefenseFromAiFacts({ input });
    expect(allocation).toMatchObject({
      status: "known",
      evidence: { rd: { threat: "terminal" } },
    });
    const options = corpAcuteDefenseHandOptions(input, allocation);
    expect(
      input.playerView.own.gripOrHq
        .filter((card) => options.has(card.instanceId))
        .map((card) => card.definitionId),
    ).toEqual([WALL]);
    const { discarded } = resolveCleanup(input, state);
    expect(discarded).not.toContain(WALL);
  });

  it("does not turn a missing tag or damage in R&D into an option", () => {
    const { input } = cleanup({
      hand: [TROJAN, OVERTIME, OVERTIME, WALL, POLITICAL_COUP, FILLER],
      archives: [PUNITIVE],
      credits: 9,
    });
    expect(
      prepareCorpPunishHandRetention(input)(input.playerView.own.gripOrHq)
        .value,
    ).toBe(0);
    const { input: drawable } = cleanup({
      hand: [TROJAN, OVERTIME, OVERTIME, WALL, POLITICAL_COUP, FILLER],
      deckExtras: [PUNITIVE],
      credits: 9,
    });
    expect(
      prepareCorpPunishHandRetention(drawable)(
        drawable.playerView.own.gripOrHq,
      ),
    ).toMatchObject({ damage: 0, drawOptions: 1 });
  });
});

function resolveCleanup(
  input: AiDecisionInputWithDeckCapabilities,
  state?: GameState,
) {
  matchIds.add(input.matchId!);
  const choice = input.playerView.pendingChoice!;
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBeFalsy();
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.hand_and_agenda_management");
  const legal = input.legalActions.find(
    (action) => action.actionId === decision.actionId,
  )!;
  expect(legal.type).toBe("resolve_choice");
  expect(legal.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  const selectedChoices = decision.selectedChoices;
  if (!selectedChoices) throw Error("missing discard choice");
  expect(selectedChoices.choiceId).toBe(choice.choiceId);
  const optionIds = selectedChoices.selectedOptionIds;
  if (!Array.isArray(optionIds)) throw Error("missing discard payload");
  expect(optionIds).toHaveLength(choice.minSelections);
  const discardedIds = optionIds.map((id) => {
    expect(legal.choiceRequirements?.[0]?.optionIds).toContain(id);
    return choice.options.find((option) => option.id === id)?.value;
  });
  const hq = input.playerView.own.gripOrHq;
  const discarded = discardedIds.map(
    (id) => hq.find((card) => card.instanceId === id)?.definitionId,
  );
  if (state) {
    const resolved = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices,
    });
    if (!resolved.ok) throw Error(resolved.error.message);
    expect(resolved.state.corp.hq).toHaveLength(5);
  }
  return {
    discarded,
    retained: hq.filter((card) => !discardedIds.includes(card.instanceId)),
  };
}

function cleanup(options: {
  corpDeck?: DeckDefinition;
  hand: number[];
  archives?: number[];
  deckExtras?: number[];
  credits: number;
  agendaPointsToWin?: number;
  scored?: number[];
  fallGuy?: boolean;
  grip?: number;
}) {
  const corpDeck =
    options.corpDeck ??
    deck("corp", [
      ...options.hand,
      ...(options.archives ?? []),
      ...(options.deckExtras ?? []),
      ...(options.scored ?? []),
      ...Array<number>(6).fill(FILLER),
    ]);
  const runnerDeck = deck("runner", [FALL_GUY, ...Array<number>(7).fill(251)]);
  const state = createGame({
    seed: "manual-corp-discard-groups",
    setupMode: "completed",
    traceRulesProfile: "classic_blind",
    agendaPointsToWin: options.agendaPointsToWin ?? 7,
    corpDeck,
    runnerDeck,
  });
  const fixture = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(options.credits)
    .withRunnerCredits(12);
  if (options.fallGuy) fixture.withRunnerResourceInstalled(FALL_GUY);
  fixture.withRunnerGripSize(options.grip ?? 5);
  function move(definitionId: number, zone: "hq" | "archives" | "scoreArea") {
    const index = state.corp.rd.findIndex(
      (id) => state.cardInstances[id]?.definitionId === definitionId,
    );
    if (index < 0) throw Error(`fixture missing: ${definitionId}`);
    const [id] = state.corp.rd.splice(index, 1);
    state.corp[zone].push(id!);
    state.cardInstances[id!]!.zone = { side: "corp", zone };
    state.cardInstances[id!]!.faceup = zone === "scoreArea";
    return state.cardInstances[id!]!;
  }
  for (const definitionId of options.hand) move(definitionId, "hq");
  for (const definitionId of options.archives ?? [])
    move(definitionId, "archives");
  for (const definitionId of options.scored ?? [])
    move(definitionId, "scoreArea");
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 0;
  const end = getLegalActions(state, "corp").find(
    (action) => action.type === "end_turn",
  )!;
  const ended = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: end.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!ended.ok) throw Error(ended.error.message);
  return {
    state: ended.state,
    input: buildAiDecisionInput(ended.state, "corp", {
      difficulty: "hard",
      ownDeckSnapshot: {
        deckSnapshotId: corpDeck.id,
        side: "corp",
        cards: corpDeck.cards.map(({ id, quantity }) => ({
          cardId: id,
          quantity,
        })),
      },
    }),
  };
}

function deck(side: "corp" | "runner", definitions: number[]): DeckDefinition {
  const counts = new Map<number, number>();
  for (const id of definitions) counts.set(id, (counts.get(id) ?? 0) + 1);
  return {
    id: `discard-groups-${side}`,
    name: `Discard groups ${side}`,
    side,
    identity: ORIGINALSET_DEFAULT_DECKS[side].identity,
    cards: [...counts].map(([id, quantity]) => ({ id, quantity })),
  };
}
