import { readFileSync } from "node:fs";
import {
  applyAction,
  createGame,
  getLegalActions,
  hashState,
  visibleCorpMandatoryDrawCount,
} from "@netgrid/engine";
import { ORIGINALSET_DEFAULT_DECKS, type DeckDefinition, type GameState, type LegalAction } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { releaseAiMatchRuntime } from "../../runtime/match-runtime-memory";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const CHANCE = 496;
const AUDIT = 495;
const PUNITIVE = 513;
const SCORCHED = 514;
const URBAN = 519;
const SHOCK = 480;
const HUNTER = 461;
const WALL = 491;
const POLITICAL = 421;
const ON_CALL = 420;
const FILLER = 404;
const LAB = 7;
const DRAW = "corp.draw_card";

const testedMatches = new Set<string>();
afterEach(() => {
  for (const matchId of testedMatches) releaseAiMatchRuntime(matchId);
  testedMatches.clear();
  resetResidentPlanPortfolioMemory();
});

it("D5 samples once for six compatible damage cards with the exact Hand leaf and Punish parent", () => {
  const { input, runtime, validation, stateHash, stateVersion } = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-manual-20261113-corp-punish-draw-d5.json",
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
  expect(stateHash).toBe("fnv1a:aba2c536");
  expect(stateVersion).toBe(5);
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
  const { decision, action } = select(input);
  expect(action.type).toBe("draw_card");
  expect(action.costs).toEqual([{ clicks: 1 }]);
  expect(action.expiresAtStateVersion).toBe(stateVersion);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.selectedPlan).toMatchObject({
    moduleId: "corp.hand_and_agenda_management",
    phase: "draw_for_plan",
    parentInstanceId: plan.rootPlanInstanceId,
    parentNeedId: "draw-tag-damage-component:corp:0",
  });
  expect(plan.portfolio).toContainEqual(
    expect.objectContaining({
      moduleId: "corp.punish_campaign",
      instanceId: plan.rootPlanInstanceId,
      evidenceCodes: expect.arrayContaining([
        "corp_punish_draw_hits:6/42",
        "corp_punish_draw_missing_roles:damage",
        "corp_punish_draw_line_min_credits:4",
        "corp_punish_draw_line_min_clicks:3",
      ]),
    }),
  );
  expect(plan.route).toMatchObject({
    actionId: DRAW,
    stateVersion,
    semanticActionType: "draw.card",
  });
  expect(plan.executionOrigin).toMatchObject({
    rootPlanInstanceId: plan.rootPlanInstanceId,
    leafPlanInstanceId: plan.leafExecutorInstanceId,
    stateVersion,
  });
  expect(plan.turnPlanning?.boundary).toMatchObject({
    kind: "private_observation",
  });
});

it("can look for the tag when the held damage is already sufficient", () => {
  const { input } = fixture({
    hand: [SCORCHED, PUNITIVE, SHOCK],
    extras: [AUDIT, CHANCE],
  });
  const { action, decision } = select(input);
  expect(action.actionId).toBe(DRAW);
  expect(decision.decisionDebug?.planFirstDecision?.portfolio).toContainEqual(
    expect.objectContaining({
      moduleId: "corp.punish_campaign",
      evidenceCodes: expect.arrayContaining([
        "corp_punish_draw_missing_roles:tag",
      ]),
    }),
  );
});

it.each([
  {
    variant: "full HQ",
    hand: [CHANCE, AUDIT, PUNITIVE, SHOCK, FILLER],
    blocker: "blocked_end_turn_overflow",
  },
  {
    variant: "next mandatory draw adds two",
    scored: LAB,
    blocker: "blocked_mandatory_draw_hand_capacity",
  },
  {
    variant: "one over capacity but all known spares are agendas",
    hand: [CHANCE, PUNITIVE, FILLER, FILLER],
    blocker: "blocked_mandatory_draw_hand_capacity",
  },
])("blocks the sample for $variant", ({ blocker, ...options }) => {
  const { input } = fixture(options);
  const { decision } = select(input);
  expect(decision.actionId).not.toBe(DRAW);
  expect(
    decision.decisionDebug?.planFirstDecision?.dispositions,
  ).toContainEqual(
    expect.objectContaining({
      actionId: DRAW,
      evidenceCode: `corp_draw_admission:${blocker}:punish_component_search`,
    }),
  );
});

it("does not spend the last click on a draw when a concrete score can close", () => {
  const { input, state } = fixture({ score: true });
  const { action, decision } = select(input);
  expect(action.type).toBe("advance_card");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.score_agenda");
  expect(drawBlockedForCompetition(decision)).toBe(true);
  const advanced = apply(state, action);
  const score = getLegalActions(advanced, "corp").find(
    (candidate) => candidate.type === "score_agenda",
  )!;
  expect(apply(advanced, score).corp.scoreArea).toContain(score.source);
});

it("keeps the last click for an acute open central with a real affordable stop", () => {
  const { input, state } = fixture({
    defense: true,
    hand: [CHANCE, PUNITIVE, SHOCK, WALL],
  });
  const { action, decision } = select(input);
  expect(action).toMatchObject({
    type: "install_card",
    payload: { placement: "ice", serverId: "rd" },
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
  expect(drawBlockedForCompetition(decision)).toBe(true);
  expect(
    apply(state, action).corp.servers.find((server) => server.id === "rd")?.ice,
  ).toContain(action.source);
});

it.each([FILLER, SCORCHED])(
  "replans after drawing %s instead of taking a second sample",
  (top) => {
    const { state, input, buildInput } = fixture({
      top,
      clicks: 2,
      hand: [CHANCE, PUNITIVE, SHOCK],
    });
    const before = hashState(state);
    const { action } = select(input);
    expect(action.actionId).toBe(DRAW);
    expect(hashState(state)).toBe(before);
    const drawn = apply(state, action);
    expect(drawn.corp.hq).toHaveLength(4);
    expect(drawn.cardInstances[drawn.corp.hq.at(-1)!]?.definitionId).toBe(top);
    const next = buildInput(drawn);
    expect(next.legalActions.some((a) => a.actionId === DRAW)).toBe(true);
    expect(select(next).decision.actionId).not.toBe(DRAW);
  },
);

it.each([
  { variant: "no finishing damage in R&D", extras: [PUNITIVE, PUNITIVE] },
  {
    variant: "too few hits",
    extras: [SCORCHED, ...Array<number>(6).fill(FILLER)],
  },
  { variant: "tag plus both damage cards cannot be paid", credits: 3 },
  { variant: "the tag response stops the combo", fallGuy: true },
])("does not draw for $variant", (options) => {
  const { input } = fixture(options);
  const { decision } = select(input);
  expect(decision.actionId).not.toBe(DRAW);
  expect(
    decision.decisionDebug?.planFirstDecision?.portfolio,
  ).not.toContainEqual(
    expect.objectContaining({
      phase: "assemble_components",
    }),
  );
});

function drawBlockedForCompetition(
  decision: ReturnType<typeof chooseAiAction>,
) {
  return decision.decisionDebug?.planFirstDecision?.dispositions.some(
    (item) =>
      item.actionId === DRAW &&
      item.evidenceCode ===
        "corp_draw_admission:blocked_competing_score_or_defense:punish_component_search",
  );
}

function select(input: AiDecisionInputWithDeckCapabilities) {
  testedMatches.add(input.matchId!);
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBeFalsy();
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  );
  if (!action) throw Error("decision did not bind a legal action");
  return { action, decision };
}

function apply(state: GameState, action: LegalAction) {
  const applied = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!applied.ok) throw Error(applied.error.message);
  return applied.state;
}

function fixture(
  options: {
    hand?: number[];
    extras?: number[];
    scored?: number;
    top?: number;
    score?: boolean;
    defense?: boolean;
    fallGuy?: boolean;
    clicks?: number;
    credits?: number;
  } = {},
) {
  const hand = options.hand ?? [CHANCE, AUDIT, PUNITIVE, SHOCK];
  const corpDeck = deck("corp", [
    ...hand,
    ...(options.extras ?? [SCORCHED, SCORCHED, URBAN, URBAN]),
    HUNTER,
    ...(options.score ? [WALL, POLITICAL] : []),
    ...(options.defense ? [POLITICAL, ON_CALL] : []),
    ...(options.scored ? [options.scored] : []),
    ...Array<number>(6).fill(FILLER),
  ]);
  const fallGuy = 373;
  const runnerDeck = deck("runner", [
    fallGuy,
    ...Array<number>(7).fill(251),
  ]);
  const state = createGame({
    seed: "punish-component-draw",
    setupMode: "completed",
    traceRulesProfile: "classic_blind",
    corpDeck,
    runnerDeck,
  });
  const builder = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(options.credits ?? 9)
    .withRunnerCredits(5);
  for (const definitionId of hand) {
    const index = state.corp.rd.findIndex(
      (id) => state.cardInstances[id]?.definitionId === definitionId,
    );
    const [id] = state.corp.rd.splice(index, 1);
    state.corp.hq.push(id!);
    state.cardInstances[id!]!.zone = { side: "corp", zone: "hq" };
  }
  if (!options.defense) builder.withCorpIceOnServer("rd", HUNTER);
  if (options.score)
    builder
      .withCorpRemoteRoot("remote_1", POLITICAL, 3)
      .withRezzedCorpIceOnServer("remote_1", WALL);
  if (options.fallGuy)
    builder.withRunnerResourceInstalled(fallGuy).withRunnerGripSize(5);
  const score = (definitionId: number, side: "corp" | "runner") => {
    const index = state.corp.rd.findIndex(
      (id) => state.cardInstances[id]?.definitionId === definitionId,
    );
    const [id] = state.corp.rd.splice(index, 1);
    state[side].scoreArea.push(id!);
    const card = state.cardInstances[id!]!;
    card.zone = { side, zone: "scoreArea" };
    card.faceup = true;
    card.controller = side;
  };
  if (options.defense) {
    score(POLITICAL, "runner");
    score(ON_CALL, "runner");
  }
  if (options.scored) score(options.scored, "corp");
  if (options.top) {
    const index = state.corp.rd.findIndex(
      (id) => state.cardInstances[id]?.definitionId === options.top,
    );
    state.corp.rd.unshift(...state.corp.rd.splice(index, 1));
  }
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = options.clicks ?? 1;
  function buildInput(position: GameState) {
    return buildAiDecisionInput(position, "corp", {
      difficulty: "hard",
      ownDeckSnapshot: {
        deckSnapshotId: corpDeck.id,
        side: "corp",
        cards: corpDeck.cards.map(({ id, quantity }) => ({
          cardId: id,
          quantity,
        })),
      },
    });
  }
  const input = buildInput(state);
  expect(visibleCorpMandatoryDrawCount(input.playerView)).toBe(
    options.scored ? 2 : 1,
  );
  return { state, input, buildInput };
}

function deck(side: "corp" | "runner", definitions: number[]): DeckDefinition {
  const counts = new Map<number, number>();
  for (const id of definitions) counts.set(id, (counts.get(id) ?? 0) + 1);
  return {
    id: `punish-draw-${side}`,
    name: `Punish draw ${side}`,
    side,
    identity: ORIGINALSET_DEFAULT_DECKS[side].identity,
    cards: [...counts].map(([id, quantity]) => ({ id, quantity })),
  };
}
