import { referencesDefaultDeckCard } from "../evaluation/decision-checkpoints/compact-card-reference.test-support";
import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import type {
  DeckDefinition,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { beforeEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { corpFundedCentralProtectionReserve } from "../corp/defense/corp-server-protection-reserve";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { corpSameTurnScoreConversionPaths } from "../plans/tactical-plan-corp-score-conversion";
import { corpInstalledAdvancementPreparations } from "../plans/corp-installed-advancement-preparation";
import { buildAiDecisionInput } from "./ai-decision-input";

const SUPPORT = 524,
  AGENDA = 432;
function deck(id: string): DeckDefinition {
  const current = standardDeckCatalog.decks.find(
    (d) => d.standardDeckId === id,
  );
  if (!current) throw new Error(`Missing standard deck ${id}`);
  return {
    id,
    name: current.name,
    side: current.side as "corp" | "runner",
    identity: current.identityCardId,
    cards: current.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  };
}
const baseCorpDeck = deck("standard_corp_cheap_bag_tricks");
const corpDeck: DeckDefinition = {
    ...baseCorpDeck,
    id: "score-reserve-native-payout-control",
    cards: [
      ...baseCorpDeck.cards,
      { id: 415, quantity: 1 },
    ],
  },
  runnerDeck = deck("standard_runner_last_call_at_rd");
function apply(
  state: GameState,
  action: LegalAction,
  selectedChoices?: PlayerAction["selectedChoices"],
): GameState {
  if (!action) throw new Error("Missing native action");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `reserve:${state.stateVersion}`,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.state;
}
function nativeFixture(
  credits: number,
  reserve = true,
  terminal = false,
): GameState {
  let state = createGameAfterSetup({
    matchId: "score-reserve",
    seed: "score-reserve",
    agendaPointsToWin: 7,
    runnerDeck,
    corpDeck,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  if (terminal) {
    RealEngineFixtureBuilder.forState(state).withCorpRemoteRoot(
      "r2",
      AGENDA,
      4,
    );
    state = apply(
      state,
      getLegalActions(state, "corp").find(
        (a) =>
          a.type === "score_agenda" && referencesDefaultDeckCard(a.source, 432),
      )!,
    );
    expect(getPlayerView(state, "corp").own.agendaPoints).toBe(4);
  }
  const builder = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(405)
    .withCorpCardInHq(SUPPORT)
    .withCorpCredits(20)
    .withRezzedCorpIceOnServer("rd", 483)
    .withRunnerCredits(20)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip(351)
    .withRunnerCardInGrip(291)
    .withRunnerCardInGrip(320)
    .withRunnerCardInGrip(309);
  if (reserve) builder.withCorpIceOnServer("rd", 457);
  state = apply(
    state,
    getLegalActions(state, "corp").find(
      (a) =>
        a.type === "install_card" &&
        referencesDefaultDeckCard(a.source, 524) &&
        a.payload?.serverId === "new_remote",
    )!,
  );
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!,
  );
  state = apply(
    state,
    getLegalActions(state, "runner").find(
      (a) =>
        a.type === "install_card" && referencesDefaultDeckCard(a.source, 351),
    )!,
  );
  state = apply(
    state,
    getLegalActions(state, "runner").find(
      (a) => a.type === "start_run" && a.payload?.serverId === "hq",
    )!,
  );
  for (
    let n = 0;
    n < 6 && getPlayerView(state, "runner").own.agendaPoints === 0;
    n++
  ) {
    const runner = getLegalActions(state, "runner"),
      corp = getLegalActions(state, "corp");
    state = apply(
      state,
      (runner.find((a) => a.type === "steal_agenda") ??
        runner.find((a) => a.type === "access_card") ??
        runner.find((a) => a.type === "continue_run") ??
        corp.find((a) => a.type === "decline_rez"))!,
    );
  }
  expect(getPlayerView(state, "runner").own.agendaPoints).toBe(2);
  state = apply(
    state,
    getLegalActions(state, "runner").find((a) => a.type === "end_turn")!,
  );
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  const current = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(417)
    .withCorpCredits(credits)
    .withRunnerCredits(5)
    .withRunnerProgramInstalled(286)
    .withRunnerProgramInstalled(266)
    .withRunnerProgramInstalled(226);
  if (!terminal)
    current
      .withCorpCardInHq(AGENDA)
      .withCorpCardInHq(411);
  state.runner.memoryUsed = 3;
  return state;
}
function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    decisionId: `reserve:${state.stateVersion}`,
    profileId: "score-reserve",
    ownDeckSnapshot: {
      deckSnapshotId: "score-reserve",
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
function finishNativeScore(
  state: GameState,
  agendaDefinitionId = AGENDA,
  activations = 2,
): GameState {
  let executor: string | undefined, target: string | undefined;
  const types: string[] = [];
  for (let n = 0; n < 7 && getPlayerView(state, "corp").own.clicks >= 0; n++) {
    const input = inputFor(state),
      decision = chooseAiAction(input),
      action = input.legalActions.find(
        (a) => a.actionId === decision.actionId,
      )!;
    expect(decision.fallbackUsed).toBe(false);
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    if (n === 0) {
      executor = portfolio.executorInstanceId;
      target = action.source;
      expect(state.cardInstances[target!]?.definitionId).toBe(
        agendaDefinitionId,
      );
    }
    if (action.type === "resolve_choice") {
      const option = input.playerView.pendingChoice!.options.find(
        (o) => o.value === `${target}:2`,
      )!;
      expect(decision.selectedChoices).toEqual({
        choiceId: input.playerView.pendingChoice!.choiceId,
        selectedOptionIds: [option.id],
      });
    } else expect(decision.reasonCode).toBe("plan_first.corp.score_agenda");
    if (n === 1) {
      const server = state.corp.servers.find((s) => s.root.includes(target!))!;
      executor = executor!.replace("%3Anew_remote", `%3A${server.id}`);
    }
    expect(portfolio.executorInstanceId).toBe(executor);
    types.push(action.type);
    state = apply(state, action, decision.selectedChoices);
    if (action.type === "score_agenda") break;
  }
  expect(types.filter((t) => t === "activated_card_ability")).toHaveLength(
    activations,
  );
  expect(types.at(-1)).toBe("score_agenda");
  return state;
}
beforeEach(() => resetResidentPlanPortfolioMemory());

it("excludes rezzed support after a native root replacement sends it to Archives", () => {
  let state = createGameAfterSetup({
    matchId: "archived-score-support",
    seed: "archived-score-support",
    agendaPointsToWin: 7,
    runnerDeck,
    corpDeck,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(20)
    .withCorpCardInHq(SUPPORT)
    .withCorpCardInHq(417);
  state = apply(
    state,
    getLegalActions(state, "corp").find(
      (a) =>
        a.type === "install_card" &&
        referencesDefaultDeckCard(a.source, 524) &&
        a.payload?.serverId === "new_remote",
    )!,
  );
  const source = state.corp.servers
      .flatMap((s) => s.root)
      .find((id) => state.cardInstances[id]?.definitionId === SUPPORT)!,
    server = state.corp.servers.find((s) => s.root.includes(source))!;
  state = apply(
    state,
    getLegalActions(state, "corp").find(
      (a) => a.type === "rez_card" && a.source === source,
    )!,
  );
  state = apply(
    state,
    getLegalActions(state, "corp").find(
      (a) =>
        a.type === "install_card" &&
        referencesDefaultDeckCard(a.source, 417) &&
        a.payload?.serverId === server.id,
    )!,
  );
  expect(state.corp.archives).toContain(source);
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!,
  );
  state = apply(
    state,
    getLegalActions(state, "runner").find((a) => a.type === "end_turn")!,
  );
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(0).withCorpCredits(9);
  const input = inputFor(state),
    archived = input.playerView.servers
      .find((s) => s.id === "archives")!
      .root.find((c) => c.instanceId === source)!;
  expect(archived.rezzed).toBe(true);
  expect(
    input.legalActions.some(
      (a) => a.type === "activated_card_ability" && a.source === source,
    ),
  ).toBe(false);
  expect(corpInstalledAdvancementPreparations(input)).toEqual([]);
  expect(corpSameTurnScoreConversionPaths(input)).toEqual([]);
});

it("rejects the exact engine-funded nonterminal score before it consumes current terminal central defense", () => {
  const input = inputFor(nativeFixture(9));
  expect(corpFundedCentralProtectionReserve(input)).toBe(5);
  expect(
    corpSameTurnScoreConversionPaths(input).find(
      (p) =>
        referencesDefaultDeckCard(p.agendaCardId, 432) &&
        p.targetServerId === "new_remote",
    ),
  ).toMatchObject({ creditsRequired: 8, clicksRequired: 3 });
  const decision = chooseAiAction(input),
    action = input.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(referencesDefaultDeckCard(action.source, 432)).toBe(false);
  expect(decision.fallbackUsed).toBe(false);
  const scores = residentPlanPortfolioSnapshot(input)!
    .instances.filter((p) => p.moduleId === "corp.score_agenda")
    .map(
      (p) =>
        p.moduleState as {
          kind: "score";
          signal: {
            agendaDefinitionId?: number;
            sameTurnConversionProof?: string;
            routeAssessment?: string;
            feasible: boolean;
          };
        },
    );
  expect(
    scores.filter(
      (p) =>
        p.signal.agendaDefinitionId === AGENDA &&
        p.signal.sameTurnConversionProof === "engine_quoted_path",
    ).length,
  ).toBeGreaterThan(0);
  expect(
    scores
      .filter(
        (p) =>
          p.signal.agendaDefinitionId === AGENDA &&
          p.signal.sameTurnConversionProof === "engine_quoted_path",
      )
      .every(
        (p) =>
          !p.signal.feasible &&
          p.signal.routeAssessment ===
            "corp_same_turn_score_consumes_funded_defense_reserve",
      ),
  ).toBe(true);
});
it("preserves all five reserve credits while completing both native activations with thirteen credits", () => {
  const state = finishNativeScore(nativeFixture(13));
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(4);
  expect(state.corp.credits).toBe(5);
});
it("admits the same eight-credit native conversion without a funded central protection claim", () => {
  const state = nativeFixture(9, false);
  const input = inputFor(state);
  expect(corpFundedCentralProtectionReserve(input)).toBe(0);
  chooseAiAction(input);
  const scores = residentPlanPortfolioSnapshot(input)!
    .instances.filter((p) => p.moduleId === "corp.score_agenda")
    .map(
      (p) =>
        p.moduleState as {
          signal: {
            agendaDefinitionId?: number;
            sameTurnConversionProof?: string;
            feasible: boolean;
          };
        },
    );
  expect(
    scores.some(
      (p) =>
        p.signal.agendaDefinitionId === AGENDA &&
        p.signal.sameTurnConversionProof === "engine_quoted_path" &&
        p.signal.feasible,
    ),
  ).toBe(true);
});
it("keeps the native terminal score at P1 even when the remaining reserve is lower", () => {
  let state = nativeFixture(9, true, true);
  const input = inputFor(state);
  expect(input.playerView.own.agendaPoints).toBe(4);
  expect(input.playerView.own.clicks).toBe(3);
  expect(corpFundedCentralProtectionReserve(input)).toBe(5);
  expect(
    corpSameTurnScoreConversionPaths(input).some((p) =>
      referencesDefaultDeckCard(p.agendaCardId, 417),
    ),
  ).toBe(true);
  state = finishNativeScore(state, 417);
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(7);
  expect(state.corp.credits).toBe(1);
});

it("quotes the already rezzed support before a new native target exists and completes the next terminal score", () => {
  let state = finishNativeScore(nativeFixture(20));
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!,
  );
  state = apply(
    state,
    getLegalActions(state, "runner").find((a) => a.type === "end_turn")!,
  );
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(417)
    .withCorpCredits(9);
  resetResidentPlanPortfolioMemory();
  const input = inputFor(state);
  expect(input.playerView.own.agendaPoints).toBe(4);
  expect(
    input.legalActions.some(
      (a) =>
        a.type === "activated_card_ability" &&
        referencesDefaultDeckCard(a.source, 524),
    ),
  ).toBe(false);
  expect(
    corpSameTurnScoreConversionPaths(input).find(
      (p) =>
        referencesDefaultDeckCard(p.agendaCardId, 417) &&
        p.targetServerId === "new_remote",
    ),
  ).toMatchObject({ creditsRequired: 6, clicksRequired: 3 });
  state = finishNativeScore(state, 417);
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(7);
  expect(state.corp.credits).toBe(3);
});

it("finances the native support costs first and restores the reserve with an unconditional on-score payout", () => {
  let state = nativeFixture(9);
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(415);
  const input = inputFor(state);
  expect(corpFundedCentralProtectionReserve(input)).toBe(5);
  expect(
    corpSameTurnScoreConversionPaths(input).find(
      (p) => p.targetServerId === "new_remote",
    ),
  ).toMatchObject({ creditsRequired: 6, clicksRequired: 3 });
  state = finishNativeScore(state, 415, 1);
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(1);
  expect(state.corp.credits).toBe(8);
});
