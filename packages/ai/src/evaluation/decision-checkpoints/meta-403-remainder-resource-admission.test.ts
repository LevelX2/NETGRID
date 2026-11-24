import { expect, it } from "vitest";
import purgeCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-purge-action-debt.json";
import creditCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-upfront-credit-admission.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it.each([
  {
    id: "SP-290",
    checkpoint: purgeCheckpoint as unknown,
    stateVersion: 232,
    actionId:
      "c2.c2lp.c2lp",
    leaf: "pa1o3tqquxh3idj1dz05ipqkos",
    root: "pa1o3tqquxh3idj1dz05ipqkos",
    semanticActionType: "score.advance_card",
    step: "advance_agenda",
    capability: "advance_score_agenda",
  },
  {
    id: "SP-291",
    checkpoint: creditCheckpoint as unknown,
    stateVersion: 152,
    actionId:
      "ci.c31q.c31q.607",
    leaf: "pby4jc1qx064ugd33m8am6umi4",
    root: "p8lb6gg4bostn5z3b64t0g63d3",
    semanticActionType: "economy.gain_credit",
    step: "fund",
    capability: "develop_or_convert_corp_economy",
  },
])(
  "$id chooses an executable current resource line under its existing owner",
  ({
    id,
    checkpoint,
    stateVersion,
    actionId,
    leaf,
    root,
    step,
    capability,
    semanticActionType,
  }) => {
    const { input, runtime } = structuredClone(checkpoint) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(
      input.legalActions.some((action) => action.actionId === actionId),
    ).toBe(true);
    expect(decision).toMatchObject({
      actionId,
      fallbackUsed: false,
      timeoutUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: root,
          leafExecutorInstanceId: leaf,
          selectedStep: { planInstanceId: leaf, stepId: `${leaf}:${step}` },
          route: {
            actionId,
            stateVersion,
            planInstanceId: leaf,
            capabilityId: capability,
            semanticActionType,
          },
          turnPlanning: {
            coverage: { status: "pass", coveragePercent: 100 },
          },
        },
      },
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine
        .phases[0]?.nodes[0]?.semanticActionType,
    ).toBe(semanticActionType);
    if (id === "SP-291") {
      // The same five-credit-upfront operation now funds the shorter current
      // protection project. Preserve both agenda projects and exact budgets.
      const projects = residentPlanPortfolioSnapshot(input)!.instances.filter(
        (instance) => instance.moduleId === "corp.score_agenda",
      );
      const fundingTarget = (instanceId: string) =>
        (
          projects.find((project) => project.instanceId === instanceId)!
            .moduleState as {
            signal: { fundingMilestone: { targetCredits: number } };
          }
        ).signal.fundingMilestone.targetCredits;
      expect(fundingTarget(root)).toBe(12);
      expect(
        fundingTarget(
          "pa1o3tqquxh3idj1dz05ipqkos",
        ),
      ).toBe(13);
    }
  },
);
