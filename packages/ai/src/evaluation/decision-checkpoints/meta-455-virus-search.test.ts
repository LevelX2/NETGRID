import { expect, it } from "vitest";
import purgeCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r3-g4-d199.json";
import searchCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r3-g23-d60.json";
import { corpPurgeImpactScoreComponent } from "../../corp/virus-pressure/corp-purge-impact";
import { buildCorpVirusPressureSignals } from "../../corp/virus-pressure/virus-pressure-signals";
import { createCorpVirusPressureModule } from "../../corp/virus-pressure/virus-pressure-plan-module";
import type { PlanSchedulerContext } from "../../plans/plan-scheduler";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { runnerAffordableCoverageSearchActionIds } from "../../runner/rig-coverage/coverage-search-alternatives";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";

it.each([0, 1, 2])(
  "counts only effective Crumble pressure beside Vienna: %i",
  (crumble) => {
    const input = structuredClone(
      purgeCheckpoint.input,
    ) as AiDecisionInputWithDeckCapabilities;
    // One is the historical state; zero and two isolate the activation boundary.
    input.playerView.own.identity.counterDisplays =
      input.playerView.own.identity.counterDisplays!.map((display) =>
        display.counterType === "crumble"
          ? { ...display, amount: crumble }
          : display,
      );
    const action = input.legalActions.find(
      (a) => a.type === "purge_runner_virus_counters",
    )!;
    const signals = buildCorpVirusPressureSignals(input);
    expect(signals[0]).toMatchObject({
      virusCounters: crumble >= 2 ? 3 : 1,
      purgeUseful: crumble >= 2,
    });
    const impact = corpPurgeImpactScoreComponent(input, action, {
      primary: "low_value",
      severity: "low",
    });
    expect(impact!.value > 0).toBe(crumble >= 2);
    const context = {
      input,
      actionCandidates: [
        {
          actionId: action.actionId,
          semanticActionType: "counter.purge_runner_virus",
        },
      ],
      domain: {
        virusPressure: signals,
        punishCampaigns: [],
        ambushes: [],
        handManagement: [],
      },
    } as unknown as PlanSchedulerContext;
    const proposals = createCorpVirusPressureModule().discover(context);
    expect(proposals).toHaveLength(crumble >= 2 ? 1 : 0);
    if (crumble >= 2)
      expect(proposals[0]).toMatchObject({
        moduleId: "corp.respond_to_virus_pressure",
        initialViability: "ready",
      });
  },
);

it.each(["unfunded", "hand_answer_payable", "no_memory", "full_hand"] as const)(
  "does not promote a staged search with %s",
  (constraint) => {
    const input = structuredClone(
      searchCheckpoint.input,
    ) as AiDecisionInputWithDeckCapabilities;
    const action = input.legalActions.find(
      (a) => a.payload?.cardImplementationEffectKind === "search_stack_to_grip",
    )!;
    const gap: RunnerCoverageGapSignal = {
      gapId: "coverage:breaker_code_gate",
      requiredRole: "breaker_code_gate",
      priorityClass: "P4",
      evidenceCode: "target:hq",
      deckHasAnswer: true,
      answerInHand: true,
      answerInstallCost: 10,
      fundingActionIds: [],
      directSearchActionIds: [action.actionId],
      searchEngineSetupActionIds: [],
      drawForAnswerActionIds: [],
      directSearchChoiceBindings: [
        {
          actionId: action.actionId,
          sourceCardInstanceId: action.source!,
          sourceDefinitionId: "onr_v1_177_the-short-circuit",
          targetDefinitionId: "onr_proteus_095_skeleton-passkeys",
        },
      ],
    };
    const candidate = {
      actionId: action.actionId,
      costProfile: { costKnownStatus: "known", creditCost: 1 },
    } as ActionSemanticCandidate;
    // Controlled acquisition constraints on the real search binding.
    if (constraint === "unfunded") input.playerView.own.credits = 3;
    if (constraint === "hand_answer_payable") gap.answerInstallCost = 5;
    if (constraint === "no_memory")
      input.playerView.own.memoryLimit = input.playerView.own.memoryUsed;
    if (constraint === "full_hand")
      input.playerView.own.maxHandSize = input.playerView.own.gripOrHq.length;
    expect(
      runnerAffordableCoverageSearchActionIds(input, [candidate], gap),
    ).toEqual([]);
  },
);

it("retains an affordable bound search despite an unaffordable breaker in hand", () => {
  const checkpoint = structuredClone(searchCheckpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const { input, runtime } = checkpoint;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  const search = input.legalActions.find(
    (a) => a.payload?.cardImplementationEffectKind === "search_stack_to_grip",
  )!;
  expect(decision.actionId).toBe(search.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toContain("runner.rig_and_coverage");
  expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: search.actionId,
    stateVersion: 59,
  });
});
