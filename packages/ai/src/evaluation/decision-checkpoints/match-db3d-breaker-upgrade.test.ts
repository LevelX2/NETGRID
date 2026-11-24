import { bindSyntheticAgendaStealQuotes } from "../../agenda-steal-quotes.test-support";
import { withCurrentPrintedLockCompanion } from "./current-printed-lock.test-support";
import { createRunnerProgramInstallTrashContext } from "../../runtime/runner-program-install-trash-context";
import { aiLiveRuntimeDependencies } from "../../ai-runtime-public-entrypoints";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { cardRolesForId } from "../../runtime/card-role-lookup";
const installServices = createRunnerProgramInstallTrashContext({
  ...aiLiveRuntimeDependencies,
  rolesForCardId: (id) => cardRolesForId(id, AI_HINTS_BY_CARD),
});
import {
  runnerCentralPressureHasMaterialMarginalValue,
  runnerCentralPressureCadence,
} from "../../runner/central-pressure/central-pressure-signals";
import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import {
  installRunnerProgramForTest,
  moveRunnerCardToGrip,
  putCorpIceOnServer,
  putCorpRootInRemote,
  scoreCorpAgendaForTest,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { chooseRunnerAction } from "../../index";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import {
  runnerRunTargetCanConvertNow,
  runnerRunFundingSupport,
} from "../../run-analysis/runner-plan-run-funding";
import { runnerSameTurnBreakerPreparation } from "../../runner/rig-coverage/coverage-same-turn-breaker-preparation";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function capture(index: number) {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-db3d-${index}-breaker-upgrade.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  // Explicit current-rule companion; the historical fixture stays unchanged.
  fixture.input = withCurrentPrintedLockCompanion(fixture.input);
  // No public steal surcharge or known agenda in this companion.
  bindSyntheticAgendaStealQuotes(fixture.input, "r1", 0, {});
  return fixture;
}
afterEach(() => resetResidentPlanPortfolioMemory());

it.each([
  "original",
  "short_cash",
  "last_click",
  "no_savings",
  "full_memory",
  "no_legal_install",
  "no_payoff",
  "hidden_definition",
])("quotes only an executable, worthwhile preparation: %s", (variant) => {
  const { input } = capture(163);
  const target = evaluateRunnerRunTargets({ input }).find(
    (e) => e.actionId === "rs.r1",
  )!;
  if (variant === "short_cash") input.playerView.own.credits = 13;
  if (variant === "last_click") input.playerView.own.clicks = 1;
  if (variant === "full_memory")
    input.playerView.own.memoryUsed = input.playerView.own.memoryLimit!;
  if (variant === "no_payoff") target.accessPayoffContestable = false;
  if (variant === "no_savings")
    for (const a of input.legalActions)
      if (a.type === "install_card") a.costs = [{ clicks: 1, credits: 5 }];
  if (variant === "no_legal_install")
    input.legalActions = input.legalActions.filter(
      (a) => a.type !== "install_card",
    );
  if (variant === "hidden_definition") {
    const unknown = input.playerView.servers
      .find((s) => s.id === "r1")!
      .ice.find((c) => !c.known)!;
    expect(unknown.definitionId).toBeUndefined();
    // An opaque identity changes no visible quote or source binding.
    unknown.instanceId = "hidden_other";
  }
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
  });
  const result = runnerSameTurnBreakerPreparation(
    input,
    candidates,
    target,
    input.ownDeckCapabilities!,
    {
      assessProgramInstallTarget:
        installServices.runnerProgramInstallTrashAssessmentForCard,
      runnerRunTargetCanConvertNow,
      runnerRunFundingSupport,
      runnerCentralPressureHasMaterialMarginalValue,
      runnerCentralPressureCadence,
    },
  );
  if (variant === "original" || variant === "hidden_definition") {
    expect(result?.totalRecoveryCost).toBe(14);
    expect(result?.evidenceCodes).toContain(
      "same_turn_breaker_preparation_projected_known_cost:10",
    );
    expect(result?.evidenceCodes).toContain(
      "same_turn_breaker_preparation_unknown_ice:1",
    );
  } else expect(result).toBeUndefined();
});

it("keeps db3d/89 as funding: the BBS access is not yet affordable", () => {
  const { input, runtime } = capture(89);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseRunnerAction(input);
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
  ).toBe("gain_credit");
  const target = evaluateRunnerRunTargets({ input }).find(
    (e) => e.targetKind === "remote",
  )!;
  expect(target.accessPayoff).toBe("trash_unaffordable");
  expect(target.routeQuote?.fundingGap).toBe(4);
});
it("installs the exact cheaper breaker under the remote parent at db3d/163", () => {
  const { input, runtime } = capture(163);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseRunnerAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.type).toBe("install_card");
  expect(
    input.playerView.own.gripOrHq.find((card) => card.instanceId === action.source)
      ?.definitionId,
  ).toBe(252);
  expect(action.payload?.runnerProgramTrashBeforeInstall).not.toBe(true);
  expect(decision.reasonCode).toBe("plan_first.runner.rig_and_coverage");
  expect(decision.fallbackUsed).toBe(false);
  const debug = decision.decisionDebug!.planFirstDecision!;
  expect(debug.selectedPlan?.moduleId).toBe("runner.rig_and_coverage");
  expect(debug.selectedPlan?.parentInstanceId).toBe(
    "p1p4xezjcxov79rno40lq3f7rv",
  );
  expect(debug.selectedStep?.planInstanceId).toBe(debug.leafExecutorInstanceId);
  expect(JSON.stringify(debug)).toContain(
    "same_turn_breaker_preparation_total_known_cost:14",
  );
});

it("revalidates the installed cheaper breaker and starts the remote only with the unknown-ICE reserve funded", () => {
  const snapshot = capture(163).input.ownDeckSnapshot!;
  const corpCards = [
    450,
    480,
    73,
    567,
    570,
    411,
    417,
    66,
  ];
  let state = createGameAfterSetup({
    seed: "remote-breaker-preparation",
    runnerDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.runner,
      cards: snapshot.cards.map((c) => ({
        id: c.cardId,
        quantity: c.quantity,
      })),
    },
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        ...corpCards.map((id) => ({ id, quantity: 1 })),
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (c) => !corpCards.includes(c.id),
        ),
      ],
    },
  });
  state = applyMatching(state, (a) => a.type === "mandatory_draw");
  state = applyMatching(state, (a) => a.type === "end_turn");
  while (state.activeSide === "corp" && state.pendingChoice)
    state = applyMatching(
      state,
      (a) => a.type === "resolve_choice",
      state.pendingChoice.options[0]!.id,
    );
  installRunnerProgramForTest(state, 251);
  moveRunnerCardToGrip(state, 252);
  const agenda = putCorpRootInRemote(state, 411);
  state.cardInstances[agenda]!.advancementCounters = 1;
  for (const id of [
    567,
    570,
  ]) {
    const card = state.cardInstances[putCorpRootInRemote(state, id)]!;
    card.rezzed = true;
    card.faceup = true;
  }
  for (const id of corpCards.slice(0, 3)) {
    const card =
      state.cardInstances[putCorpIceOnServer(state, "r1", id)]!;
    card.rezzed = id !== 73;
    card.faceup = card.rezzed;
  }
  state.runner.credits = 14;
  state.runner.clicks = 2;
  state.corp.credits = 45;
  scoreCorpAgendaForTest(state, 417);
  scoreCorpAgendaForTest(state, 66);
  const initial = structuredClone(state);
  const eventStart = state.eventLog.length;
  const inputForState = () =>
    buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      eventTail: state.eventLog,
      ownDeckSnapshot: snapshot,
      decisionId: `${state.matchId}:${state.stateVersion}`,
      actionNumber: state.stateVersion,
    });
  const input = inputForState();
  const decision = chooseRunnerAction(input);
  const selected = input.legalActions.find((a) => a.actionId === decision.actionId);
  expect(selected?.type).toBe("install_card");
  expect(state.cardInstances[selected!.source!]?.definitionId).toBe(252);
  state = applyMatching(state, (a) => a.actionId === decision.actionId);
  expect(state.runner.credits).toBe(10);
  expect(state.runner.clicks).toBe(1);
  const nextInput = inputForState();
  const remote = nextInput.playerView.servers.find((s) => s.id === "r1")!;
  const path = assessKnownRezzedIcePath(
    remote.ice,
    nextInput.playerView.own.rig!,
    10,
    remote.root,
    nextInput.playerView.opponent.credits,
  );
  expect(path.visibleBreakCost).toBe(10);
  const reserve = evaluateRunnerRunTargets({ input: nextInput }).find(
    (target) => target.actionId === "rs.r1",
  )!.prerunReserveQuote!;
  expect(reserve.status).toBe("blocked");
  expect(reserve.creditGap).toBeGreaterThan(0);
  expect(chooseRunnerAction(nextInput).actionId).not.toBe(
    "rs.r1",
  );
  const preparationReplay = replayEvents(
    initial,
    state.eventLog.slice(eventStart),
  );
  expect(preparationReplay.ok).toBe(true);
  expect(hashGameState(preparationReplay.state)).toBe(hashGameState(state));

  // Companion position: same installed breaker/path, with exactly the missing
  // reserve supplied. This fixture boundary starts its own Engine replay.
  state.runner.credits += reserve.creditGap;
  const fundedInitial = structuredClone(state);
  const fundedEventStart = state.eventLog.length;
  const fundedInput = inputForState();
  const next = chooseRunnerAction(fundedInput);
  const runAction = fundedInput.legalActions.find(
    (a) => a.actionId === next.actionId,
  )!;
  expect(runAction.type).toBe("start_run");
  expect(runAction.payload?.serverId).toBe("r1");
  expect(next.fallbackUsed).toBe(false);
  state = applyMatching(state, (a) => a.actionId === next.actionId);
  expect(state.run?.attackedServerId).toBe("r1");
  const replay = replayEvents(
    fundedInitial,
    state.eventLog.slice(fundedEventStart),
  );
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(state));
});

function applyMatching(
  state: GameState,
  matches: (action: LegalAction) => boolean,
  optionId?: string,
): GameState {
  const action = getLegalActions(state, state.activeSide).find(matches);
  if (!action)
    throw new Error(`Missing preparation action at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `breaker-preparation:${state.stateVersion}`,
    ...(optionId
      ? {
          selectedChoices: {
            choiceId: state.pendingChoice?.choiceId,
            selectedOptionIds: [optionId],
          },
        }
      : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
