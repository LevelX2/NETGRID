import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getPlayerView,
} from "@netgrid/engine";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import { metaTenStandardDecks as catalog } from "../evaluation/meta-ten-standard-decks.test-support";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";

afterEach(resetResidentPlanPortfolioMemory);
function fixture(runnerId: string, corpId: string) {
  const runner = catalog.decks.find((d) => d.standardDeckId === runnerId)!,
    corp = catalog.decks.find((d) => d.standardDeckId === corpId)!;
  const deck = (d: typeof runner): DeckDefinition => ({
    id: d.standardDeckId,
    name: d.name,
    side: d.side as "runner" | "corp",
    identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  });
  const state = createGameAfterSetup({
    seed: "meta-ten-cause-control",
    runnerDeck: deck(runner),
    corpDeck: deck(corp),
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = 1;
  return {
    state,
    snapshot: {
      deckSnapshotId: runner.standardDeckId,
      side: "runner" as const,
      cards: runner.cards,
    },
  };
}
function apply(state: GameState, side: "runner" | "corp", actionId: string) {
  const r = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!r.ok) throw Error(r.error.message);
  return r.state;
}

it("admits HQ access via empty Archives while rejecting the ordinary Archives run", () => {
  const { state, snapshot } = fixture(
    "standard_runner_ice_destruction_runner",
    "standard_corp_cheap_bag_tricks",
  );
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(26)
    .withRunnerProgramInstalled("onr_v1_062_shredder-uplink-protocol");
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: snapshot,
    eventTail: state.eventLog,
  });
  const targets = evaluateRunnerRunTargets({ input });
  const shredder = targets.find((t) =>
    t.actionId.includes("shredder-uplink-protocol"),
  );
  expect(shredder).toMatchObject({
    targetServerId: "archives",
    accessServerId: "hq",
  });
  const decision = chooseAiAction(input);
  expect(
    decision.decisionDebug?.actionAlternatives
      ?.find((a) => a.actionId === shredder!.actionId)
      ?.whyNot?.join("|") ?? "",
  ).not.toContain("known_no_current_payoff:archives");
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const archivePlan = portfolio.instances.find(
    (p) =>
      p.moduleId === "runner.pressure_central" && p.target?.id === "archives",
  )!;
  expect(archivePlan.moduleState).toMatchObject({
    signal: { reachable: true },
  });
  expect(
    decision.decisionDebug?.actionAlternatives
      ?.find((a) => a.actionId === "runner.start_run.archives")
      ?.whyNot?.join("|"),
  ).toContain("runner_archives_visible_state_has_no_agenda_payoff");
});

it.each([false, true])(
  "uses the conditional points through its existing owner, terminal=%s",
  (terminal) => {
    const runner = catalog.decks.find((d) =>
      d.cards.some((c) => c.cardId === "onr_v1_090_hot-tip-for-wns"),
    )!;
    const corp = catalog.decks.find((d) => d.side === "corp")!;
    const { state, snapshot } = fixture(
      runner.standardDeckId,
      corp.standardDeckId,
    );
    RealEngineFixtureBuilder.forState(state)
      .withRunnerCredits(10)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip("onr_v1_090_hot-tip-for-wns");
    if (terminal) {
      const agenda = Object.values(state.cardInstances).find((c) =>
        c.definitionId.includes("corporate-war"),
      )!;
      RealEngineFixtureBuilder.forState(state).withCorpCardInHq(
        agenda.definitionId,
      );
      state.corp.hq = state.corp.hq.filter((id) => id !== agenda.instanceId);
      state.runner.scoreArea.push(agenda.instanceId);
      state.cardInstances[agenda.instanceId]!.zone = {
        side: "runner",
        zone: "scoreArea",
      };
      state.cardInstances[agenda.instanceId]!.faceup = true;
      state.agendaPointsToWin =
        getPlayerView(state, "runner").own.agendaPoints + 1;
    }
    state.runnerTurnFlags = {
      ...state.runnerTurnFlags,
      stoleAgendaThisTurn: true,
      stoleAgendaLastTurn: false,
      stoleBlackOpsAgendaThisTurn: true,
    };
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: snapshot,
      eventTail: state.eventLog,
    });
    const projected = { ...input, ...buildAiDecisionInputDto(input) };
    const event = projected.legalActions.find((a) =>
      a.source?.includes("hot-tip-for-wns"),
    )!;
    expect(event.payload?.runnerConditionalAgendaPointQuoteAmount).toBe(1);
    const decision = chooseAiAction(projected);
    expect(decision.actionId).toBe(event.actionId);
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe(
      terminal ? "runner.secure_terminal_win" : "runner.develop_board_and_hand",
    );
    const result = apply(state, "runner", decision.actionId!);
    expect(getPlayerView(result, "runner").own.agendaPoints).toBe(
      projected.playerView.own.agendaPoints + 1,
    );
  },
);

it.each(["none", "previous_turn"])(
  "does not claim a conditional point after %s",
  (condition) => {
    const runner = catalog.decks.find((d) =>
        d.cards.some((c) => c.cardId === "onr_v1_090_hot-tip-for-wns"),
      )!,
      corp = catalog.decks.find((d) => d.side === "corp")!;
    const { state, snapshot } = fixture(
      runner.standardDeckId,
      corp.standardDeckId,
    );
    RealEngineFixtureBuilder.forState(state)
      .withRunnerCredits(10)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip("onr_v1_090_hot-tip-for-wns");
    state.agendaPointsToWin =
      getPlayerView(state, "runner").own.agendaPoints + 1;
    state.runnerTurnFlags = {
      ...state.runnerTurnFlags,
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: condition === "previous_turn",
      stoleBlackOpsAgendaThisTurn: false,
    };
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: snapshot,
      eventTail: state.eventLog,
    });
    expect(
      input.legalActions.find((a) => a.source?.includes("hot-tip-for-wns"))
        ?.payload?.runnerConditionalAgendaPointQuoteAmount,
    ).toBe(0);
    expect(chooseAiAction(input).actionId).not.toContain("hot-tip-for-wns");
  },
);

it.each(["missing", "stale", "source", "capability"])(
  "rejects a %s conditional-point quote",
  (boundary) => {
    const runner = catalog.decks.find((d) =>
        d.cards.some((c) => c.cardId === "onr_v1_090_hot-tip-for-wns"),
      )!,
      corp = catalog.decks.find((d) => d.side === "corp")!;
    const { state, snapshot } = fixture(
      runner.standardDeckId,
      corp.standardDeckId,
    );
    RealEngineFixtureBuilder.forState(state)
      .withRunnerCredits(10)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip("onr_v1_090_hot-tip-for-wns");
    state.runnerTurnFlags = {
      ...state.runnerTurnFlags,
      stoleAgendaThisTurn: true,
      stoleAgendaLastTurn: false,
      stoleBlackOpsAgendaThisTurn: true,
    };
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: snapshot,
      eventTail: state.eventLog,
    });
    const payload = input.legalActions.find((a) =>
      a.source?.includes("hot-tip-for-wns"),
    )!.payload!;
    if (boundary === "missing")
      delete payload.runnerConditionalAgendaPointQuoteSchema;
    if (boundary === "stale")
      payload.runnerConditionalAgendaPointQuoteStateVersion =
        state.stateVersion + 1;
    if (boundary === "source")
      payload.runnerConditionalAgendaPointQuoteSourceCardInstanceId =
        "another-source";
    if (boundary === "capability")
      payload.runnerConditionalAgendaPointQuoteSourceCapabilityId =
        "another-capability";
    expect(() => chooseAiAction(input)).toThrow(/missing_action_semantics/);
  },
);
