import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getPlayerView,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type DeckDefinition,
  type GameState,
} from "@netgrid/shared";
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

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import type { RunnerPlanDomain } from "../plans/runner-tactical-plan-contracts";
import { centralPressureModule } from "../runner/central-pressure/central-pressure-plan-module";
import { remoteContestModule } from "../runner/remote-contest/remote-contest-plan-module";

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
  return fixtureFromDecks(deck(runner), deck(corp));
}

function fixtureFromDecks(
  runnerDeck: DeckDefinition,
  corpDeck: DeckDefinition,
) {
  const state = createGameAfterSetup({
    seed: "meta-ten-cause-control",
    runnerDeck,
    corpDeck,
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = 1;
  return {
    state,
    snapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner" as const,
      cards: runnerDeck.cards.map((card) => ({
        cardId: card.id,
        quantity: card.quantity,
      })),
    },
  };
}

/** Card-mechanic fixtures explicitly own their required cards. Product deck
 * revisions must not decide whether this conditional-point contract is tested. */
function conditionalPointFixture() {
  return fixtureFromDecks(
    {
      ...DEMO_DECKS.demo_runner_001,
      id: "fixture_hot_tip_runner",
      cards: [
        ...DEMO_DECKS.demo_runner_001.cards,
        { id: 302, quantity: 1 },
      ],
    },
    {
      ...DEMO_DECKS.demo_corp_001,
      id: "fixture_hot_tip_corp",
      cards: [
        ...DEMO_DECKS.demo_corp_001.cards,
        { id: 408, quantity: 1 },
      ],
    },
  );
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
    .withRunnerProgramInstalled(274);
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

it.each(["rd", "remote_1"] as const)(
  "blocks a route to %s whose exact action is dispositioned by Defense",
  (serverId) => {
    const { state, snapshot } = fixture(
      "standard_runner_ice_destruction_runner",
      "standard_corp_cheap_bag_tricks",
    );
    RealEngineFixtureBuilder.forState(state).withCorpIceOnServer(
      "remote_1",
      473,
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: snapshot,
    });
    const actionCandidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const actionId = "runner.start_run." + serverId;
    expect(
      actionCandidates.some((candidate) => candidate.actionId === actionId),
    ).toBe(true);
    const centralPressure: RunnerPlanDomain["centralPressure"] = [
      {
        pressureId: "central:rd",
        serverId: "rd",
        purpose: "access",
        priorityClass: "P4",
        strategyLineIds: [],
        reachable: true,
        marginalValue: 10,
        evidenceCode: "central_run_available_before_safety_assessment",
        runActionIds: [actionId],
      },
    ];
    const remoteContests: RunnerPlanDomain["remoteContests"] = [
      {
        contestId: "remote:remote_1",
        serverId: "remote_1",
        purpose: "access",
        knownAgendaThreat: false,
        reachable: true,
        marginalValue: 10,
        evidenceCode: "remote_run_available_before_safety_assessment",
        runActionAssessments: {
          [actionId]: {
            verdict: "executable",
            stepValue: 10,
            evidenceCodes: [],
          },
        },
      },
    ];
    const context = {
      input,
      actionCandidates,
      turnKey: "runner:turn:1",
      domain: {
        centralPressure: serverId === "rd" ? centralPressure : [],
        remoteContests: serverId === "rd" ? [] : remoteContests,
        terminalWins: [],
        developments: [],
        runWindows: [],
      },
    };
    const owner =
      serverId === "rd" ? centralPressureModule() : remoteContestModule();
    expect(owner.discover(context)[0]?.initialViability).toBe("ready");
    expect(
      owner.discover({
        ...context,
        actionDispositions: [
          {
            actionId,
            disposition: "explicitly_nonproductive",
            ownerModuleId: "runner.defense_and_recovery",
            evidenceCode: "runner_optional_run_would_enable_known_next_corp_turn_flatline",
          },
        ],
      })[0]?.initialViability,
    ).toBe("blocked");
  },
);

it.each([false, true])(
  "uses the conditional points through its existing owner, terminal=%s",
  (terminal) => {
    const { state, snapshot } = conditionalPointFixture();
    RealEngineFixtureBuilder.forState(state)
      .withRunnerCredits(10)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip(302);
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
    const { state, snapshot } = conditionalPointFixture();
    RealEngineFixtureBuilder.forState(state)
      .withRunnerCredits(10)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip(302);
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
    const { state, snapshot } = conditionalPointFixture();
    RealEngineFixtureBuilder.forState(state)
      .withRunnerCredits(10)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip(302);
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
