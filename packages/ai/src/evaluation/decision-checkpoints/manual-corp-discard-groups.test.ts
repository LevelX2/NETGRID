import { readFileSync } from "node:fs";
import { applyAction, createGame, getLegalActions } from "@netgrid/engine";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { allocateCorpCentralDefenseFromAiFacts } from "../../corp/defense/corp-central-defense-facts-adapter";
import { corpAcuteDefenseHandOptions } from "../../corp/defense/defense-hand-retention";
import { prepareCorpPunishHandRetention } from "../../corp/punish/punish-hand-retention";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { releaseAiMatchRuntime } from "../../runtime/match-runtime-memory";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const TROJAN = "onr_v1_306_trojan-horse";
const AUDIT = "onr_v1_283_audit-of-call-records";
const OVERTIME = "onr_v1_297_overtime-incentives";
const PUNITIVE = "onr_v1_301_punitive-counterstrike";
const SCORCHED = "onr_v1_302_scorched-earth";
const URBAN = "onr_v1_307_urban-renewal";
const POLITICAL_COUP = "onr_v1_209_political-coup";
const WALL = "onr_v1_279_wall-of-static";
const FALL_GUY = "onr_v1_161_fall-guy";
const CREDIT = "onr_v1_281_accounts-receivable";
const FILLER = "onr_v1_192_corporate-boon";
const ON_CALL = "onr_v1_208_on-call-solo-team";

const matchIds = new Set<string>();
afterEach(() => {
  for (const matchId of matchIds) releaseAiMatchRuntime(matchId);
  matchIds.clear();
  resetResidentPlanPortfolioMemory();
});

it("keeps the last tag source with real R&D complements at manual D45", () => {
  const { input, runtime, validation, stateHash, stateVersion } = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-manual-20261113-corp-discard-d45.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
    stateHash: string;
    stateVersion: number;
  };
  expect(stateHash).toBe("fnv1a:231077bd");
  expect(stateVersion).toBe(93);
  expect(Object.values(validation).every(Boolean)).toBe(true);
  expect(input.matchId).toBe("match_f9840b7522f5d61e");
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    runtime.residentPlanPortfolio,
  );
  const { discarded, retained } = resolveCleanup(input);
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
  hand: string[];
  archives?: string[];
  deckExtras?: string[];
  credits: number;
  agendaPointsToWin?: number;
  scored?: string[];
  fallGuy?: boolean;
  grip?: number;
}) {
  const corpDeck = deck("corp", [
    ...options.hand,
    ...(options.archives ?? []),
    ...(options.deckExtras ?? []),
    ...(options.scored ?? []),
    ...Array<string>(6).fill(FILLER),
  ]);
  const runnerDeck = deck("runner", [
    FALL_GUY,
    ...Array<string>(7).fill("onr_v1_039_krash"),
  ]);
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
  function move(definitionId: string, zone: "hq" | "archives" | "scoreArea") {
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

function deck(side: "corp" | "runner", definitions: string[]): DeckDefinition {
  const counts = new Map<string, number>();
  for (const id of definitions) counts.set(id, (counts.get(id) ?? 0) + 1);
  return {
    id: `discard-groups-${side}`,
    name: `Discard groups ${side}`,
    side,
    identity: `${side}_identity_001`,
    cards: [...counts].map(([id, quantity]) => ({ id, quantity })),
  };
}
