import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { corpVoluntaryDrawLeavesUnsafeMandatoryHorizon } from "../../runtime/corp-draw-admission";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { corpDrawHorizonPreservationSignals } from "../../corp/hand-management/hand-draw-horizon";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
  runnerKnownPathAssessmentIsCostNoAccess,
} from "../../visible-run-analysis";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function restoredInput(name: string) {
  const { input, runtime } = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r4-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  return input;
}

it("classifies an unaffordable next-ICE lock break as funding rather than missing coverage", () => {
  const input = restoredInput("g31-d346");
  const rig = input.playerView.own.rig;
  if (!rig) throw Error("checkpoint must include the installed breaker");
  const server = input.playerView.servers.find((s) => s.id === "remote_1")!;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    rig,
    runnerRunPathCreditBudgetWithVisiblePools(10, rig),
    server.root,
  );
  expect(runnerKnownPathAssessmentIsCostNoAccess(assessment)).toBe(true);
  expect(assessment.knownPathBlockedByMissingCoverage).not.toBe(true);
  const funded = assessKnownRezzedIcePath(
    server.ice,
    rig,
    runnerRunPathCreditBudgetWithVisiblePools(22, rig),
    server.root,
  );
  expect(funded).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 18,
    creditsAfterPath: 4,
  });
});

it.each([true, false])(
  "binds the sufficient bank payout to the contest parent with an unsafe loan available: %s",
  (loanAvailable) => {
    const input = restoredInput("g31-d346");
    if (!loanAvailable)
      input.legalActions = input.legalActions.filter(
        (candidate) =>
          !candidate.actionId.includes(
            "install_card.runner_onr_v1_168_loan-from-chiba",
          ),
      );
    const result = chooseAiAction(input);
    const action = input.legalActions.find(
      (a) => a.actionId === result.actionId,
    )!;
    expect(action.actionId).toBe(
      "runner.activated_card_ability.runner_onr_v1_154_broker_1.runner_onr_v1_154_broker_1.activated.onr_v1_154_broker:withdraw_credits",
    );
    if (loanAvailable) {
      const target = evaluateRunnerRunTargets({ input }).find(
        (candidate) => candidate.actionId === "runner.start_run.remote_1",
      )!;
      expect(target.pathCost).toBe(12);
      const funded = structuredClone(input);
      funded.playerView.own.credits += 12;
      const wholePath = evaluateRunnerRunTargets({ input: funded }).find(
        (candidate) => candidate.actionId === target.actionId,
      )!;
      expect(wholePath).toMatchObject({ pathCost: 18, creditsAfterRun: 4 });
    }
    expect(result.fallbackUsed).toBe(false);
    expect(result.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId:
        "plan:runner.credit_bank:runner_onr_v1_154_broker_1",
    });
    expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: action.actionId,
      stateVersion: input.playerView.stateVersion,
    });
  },
);

it("replenishes empty R&D through the Engine-quoted shuffle and draw route", () => {
  const input = restoredInput("g34-d436");
  const action = input.legalActions.find((a) =>
    a.actionId.includes("hq_archives_shuffle_draw"),
  )!;
  expect(chooseAiAction(input)).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        route: {
          actionId: action.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it.each([
  "safe_deck",
  "insufficient_replenishment",
  "unknown_quote",
  "hand_overflow",
  "stale_action",
] as const)(
  "does not certify draw-horizon preservation with %s",
  (boundary) => {
    const input = restoredInput("g34-d436");
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
    });
    const candidate = candidates.find((c) =>
      c.actionId.includes("hq_archives_shuffle_draw"),
    )!;
    expect(
      corpDrawHorizonPreservationSignals(input, [candidate], 0),
    ).toHaveLength(1);
    if (boundary === "safe_deck") input.playerView.own.stackOrRdCount = 3;
    if (boundary === "insufficient_replenishment")
      candidate.economyProjection!.netDrawPileDelta = 2;
    if (boundary === "unknown_quote")
      delete candidate.economyProjection!.netDrawPileDelta;
    if (boundary === "hand_overflow")
      candidate.economyProjection!.netHandDelta = 1;
    if (boundary === "stale_action")
      input.legalActions.find(
        (a) => a.actionId === candidate.actionId,
      )!.expiresAtStateVersion -= 1;
    expect(
      corpDrawHorizonPreservationSignals(input, [candidate], 0),
    ).toHaveLength(0);
  },
);

it("retains missing coverage when the required breaker really is absent", () => {
  const input = restoredInput("g31-d346");
  const server = input.playerView.servers.find((s) => s.id === "remote_1")!;
  const assessment = assessKnownRezzedIcePath(server.ice, [], 100, server.root);
  expect(assessment.knownPathBlockedByMissingCoverage).toBe(true);
  expect(runnerKnownPathAssessmentIsCostNoAccess(assessment)).toBe(false);
});

it.each([4, 6])(
  "retains the funding cause when both source and future breaks exceed %i credits",
  (credits) => {
    const input = restoredInput("g31-d346");
    const server = input.playerView.servers.find((s) => s.id === "remote_1")!;
    const rig = input.playerView.own.rig;
    if (!rig) throw Error("checkpoint must include the installed breaker");
    const assessment = assessKnownRezzedIcePath(
      server.ice,
      rig,
      runnerRunPathCreditBudgetWithVisiblePools(credits, rig),
      server.root,
    );
    expect(runnerKnownPathAssessmentIsCostNoAccess(assessment)).toBe(true);
    expect(assessment.knownPathBlockedByMissingCoverage).not.toBe(true);
  },
);

it.each([
  [0, -25, false],
  [0, -2, true],
  [3, 1, true],
  [4, 1, false],
  [0, 0, true],
] as const)(
  "checks the signed deck change from %i with consumption %i",
  (before, consumption, unsafe) => {
    expect(
      corpVoluntaryDrawLeavesUnsafeMandatoryHorizon({
        remainingDeckCardsBeforeDraw: before,
        netDeckConsumption: consumption,
        terminalNeedBeforeMandatoryDraw: false,
      }),
    ).toBe(unsafe);
  },
);

it("uses the paid-for break to preserve the bound hand floor despite an unaffordable access path", () => {
  const input = restoredInput("g39-d94");
  const action = input.legalActions.find(
    (a) =>
      a.type === "break_subroutine" &&
      a.actionId.includes("printed_subroutines_damage_net"),
  )!;
  expect(action).toBeDefined();
  expect(chooseAiAction(input)).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_88",
        route: {
          actionId: action.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it("does not waive the future-path guard for a damage break above the hand floor", () => {
  const input = restoredInput("g39-d94");
  input.playerView.own.gripOrHq.push({
    ...input.playerView.own.gripOrHq[0]!,
    instanceId: "hand-floor-boundary",
  });
  const action = input.legalActions.find((a) => a.type === "continue_run")!;
  expect(chooseAiAction(input)).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
  });
});
