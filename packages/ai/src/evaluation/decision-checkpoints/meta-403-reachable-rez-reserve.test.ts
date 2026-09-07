import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-reachable-rez-reserve-d80.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreStrategicIntentMemorySnapshot } from "../../strategic-intent-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
import { costProfileForAction } from "../../actions/action-cost-timing";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpCorePlanDomain } from "../../plans/corp-core-plan-modules";
import { corpGlobalDefenseInstallRouteAssessment } from "../../plans/corp-defense-domain-signals";

describe("meta 403 reachable central rez reserve", () => {
  it.each([
    [5, true],
    [3, false],
    [7, false],
  ] as const)(
    "protects only funding windows destroyed by staging at %i credits",
    (credits, protects) => {
      const input = structuredClone(
        checkpointJson.input,
      ) as unknown as AiDecisionInputWithDeckCapabilities;
      input.playerView.own.credits = credits;
      const install = input.legalActions.find(
        (a) =>
          a.type === "install_card" &&
          a.actionId.includes("bolter-cluster") &&
          a.payload?.serverId === "hq",
      )!;
      const source = input.playerView.own.gripOrHq.find(
        (c) => c.instanceId === install.source,
      )!;
      const candidate = {
        actionId: install.actionId,
        sourceCardInstanceId: source.instanceId,
        sourceDefinitionId: source.definitionId,
        costProfile: costProfileForAction(install),
      } as ActionSemanticCandidate;
      const allocation = {
        status: "known",
        selectedServerId: "hq",
        evidence: {
          hq: {
            threat: "material",
            recentRunOrAccessEvents: 1,
            recentSuccessfulAccessRunnerTurns: 1,
            serverBoundEffectIds: [],
            expectedAgendaLoss: { numerator: 1, denominator: 1 },
            expectedTrashableLoss: { numerator: 0, denominator: 1 },
            isMultiaccess: false,
          },
          rd: { threat: "none" },
        },
      } as unknown as CorpCorePlanDomain["centralDefenseAllocation"];
      const assessment = corpGlobalDefenseInstallRouteAssessment(
        input,
        candidate,
        "hq",
        allocation,
        {
          hasExactNonNegativeCostProfile: () => true,
          archivesHasVisibleKnownAgenda: () => false,
        },
      );
      expect(
        assessment.knowledge === "known" &&
          assessment.disposition === "effect_missing" &&
          assessment.evidenceCode ===
            "corp_additional_ice_install_consumes_known_central_rez_reserve:hq",
      ).toBe(protects);
    },
  );
  it("rejects staging which destroys an existing central stopper's reachable funding window", () => {
    const capture = structuredClone(checkpointJson) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    const { input, runtime } = capture;
    resetResidentPlanPortfolioMemory();
    restoreStrategicIntentMemorySnapshot(
      input,
      runtime.strategicIntent,
      input.ownDeckSnapshot!.deckSnapshotId,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      runtime.residentPlanPortfolio,
    );
    const result = chooseAiAction(input);
    // The independent virus owner now selects its legal purge; Defense must
    // not admit the extra ICE layer which destroys its own funding window.
    expect(result.actionId).toBe("corp.purge_runner_virus_counters");
    expect(result.fallbackUsed).toBe(false);
    expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
      true,
    );
    expect(
      result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("corp.respond_to_virus_pressure");
  });
});
