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
import { runnerRemoteBreakerPreparation } from "../../runner/rig-coverage/coverage-remote-breaker-preparation";
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
  return JSON.parse(
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
    (e) => e.actionId === "runner.start_run.remote_1",
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
      .find((s) => s.id === "remote_1")!
      .ice.find((c) => !c.known)!;
    expect(unknown.definitionId).toBeUndefined();
    // An opaque identity changes no visible quote or source binding.
    unknown.instanceId = "hidden_other";
  }
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
  });
  const result = runnerRemoteBreakerPreparation(
    input,
    candidates,
    target,
    input.ownDeckCapabilities!,
  );
  if (variant === "original" || variant === "hidden_definition") {
    expect(result?.totalRecoveryCost).toBe(14);
    expect(result?.evidenceCodes).toContain(
      "remote_breaker_preparation_projected_known_cost:10",
    );
    expect(result?.evidenceCodes).toContain(
      "remote_breaker_preparation_unknown_ice:1",
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
  expect(action.source).toContain("loony-goon");
  expect(action.payload?.runnerProgramTrashBeforeInstall).not.toBe(true);
  expect(decision.reasonCode).toBe("plan_first.runner.rig_and_coverage");
  expect(decision.fallbackUsed).toBe(false);
  const debug = decision.decisionDebug!.planFirstDecision!;
  expect(debug.selectedPlan?.moduleId).toBe("runner.rig_and_coverage");
  expect(debug.selectedPlan?.parentInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(debug.selectedStep?.planInstanceId).toBe(debug.leafExecutorInstanceId);
  expect(JSON.stringify(debug)).toContain(
    "remote_breaker_preparation_total_known_cost:14",
  );
});

it("revalidates the cheaper path after Engine installation and starts the bound remote run", () => {
  const snapshot = capture(163).input.ownDeckSnapshot!;
  const corpCards = [
    "onr_v1_238_data-wall-2-0",
    "onr_v1_268_shock-r",
    "onr_proteus_015_colonel-failure",
    "onr_v1_355_crystal-palace-station-grid",
    "onr_v1_358_dr-dreff",
    "onr_v1_199_employee-empowerment",
    "onr_v1_205_main-office-relocation",
    "onr_proteus_008_project-zurich",
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
  installRunnerProgramForTest(state, "onr_v1_039_krash");
  moveRunnerCardToGrip(state, "onr_v1_040_loony-goon");
  const agenda = putCorpRootInRemote(state, "onr_v1_199_employee-empowerment");
  state.cardInstances[agenda]!.advancementCounters = 1;
  for (const id of [
    "onr_v1_355_crystal-palace-station-grid",
    "onr_v1_358_dr-dreff",
  ]) {
    const card = state.cardInstances[putCorpRootInRemote(state, id)]!;
    card.rezzed = true;
    card.faceup = true;
  }
  for (const id of corpCards.slice(0, 3)) {
    const card =
      state.cardInstances[putCorpIceOnServer(state, "remote_1", id)]!;
    card.rezzed = !id.includes("colonel");
    card.faceup = card.rezzed;
  }
  state.runner.credits = 18;
  state.runner.clicks = 2;
  state.corp.credits = 45;
  scoreCorpAgendaForTest(state, "onr_v1_205_main-office-relocation");
  scoreCorpAgendaForTest(state, "onr_proteus_008_project-zurich");
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
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId)?.source,
  ).toContain("loony-goon");
  state = applyMatching(state, (a) => a.actionId === decision.actionId);
  expect(state.runner.credits).toBe(14);
  expect(state.runner.clicks).toBe(1);
  const nextInput = inputForState();
  const remote = nextInput.playerView.servers.find((s) => s.id === "remote_1")!;
  const path = assessKnownRezzedIcePath(
    remote.ice,
    nextInput.playerView.own.rig!,
    10,
    remote.root,
    nextInput.playerView.opponent.credits,
  );
  expect(path.visibleBreakCost).toBe(10);
  const next = chooseRunnerAction(nextInput);
  const runAction = nextInput.legalActions.find(
    (a) => a.actionId === next.actionId,
  )!;
  expect(runAction.type).toBe("start_run");
  expect(runAction.payload?.serverId).toBe("remote_1");
  expect(next.fallbackUsed).toBe(false);
  state = applyMatching(state, (a) => a.actionId === next.actionId);
  expect(state.run?.attackedServerId).toBe("remote_1");
  const replay = replayEvents(initial, state.eventLog.slice(eventStart));
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
