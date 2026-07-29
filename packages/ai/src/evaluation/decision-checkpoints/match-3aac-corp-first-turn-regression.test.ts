import { describe, expect, it } from "vitest";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3aac-01-corp-first-turn-no-premature-end-d4.json";
import singleCounterPurgeJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3aac-02-single-tax-counter-no-purge-d67.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";

describe("match 3aac Corp regression evidence", () => {
  it("funds one exact HQ-defense route instead of completing the turn", () => {
    const checkpoint = structuredClone(
      checkpointJson,
    ) as AiDecisionCheckpointV1;
    const result = runAiDecisionCheckpoint(checkpoint);

    expect(checkpoint.difficulty).toBe("hard");
    expect(result.input.playerView.own.clicks).toBe(2);
    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).toBe("gain_credit");
    const portfolio = residentPlanPortfolioSnapshot(result.input);
    const defenseRootInstanceId =
      "plan:corp.defend_servers:server-defense-portfolio";
    const defenseNeedId =
      "install:hq:corp.install_card.corp_onr_proteus_017_credit-blocks_2.hq.corp_onr_proteus_017_credit-blocks_2.0";
    const fundingLeafInstanceId =
      "plan:corp.economy:defense-reserve%3Ahq%3Acorp_onr_proteus_017_credit-blocks_2";
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    const defenseRoot = portfolio?.instances.find(
      (instance) => instance.instanceId === defenseRootInstanceId,
    );
    expect(portfolio).toMatchObject({
      rootForegroundInstanceId: defenseRootInstanceId,
      executorInstanceId: fundingLeafInstanceId,
    });
    expect(defenseRoot).toMatchObject({
      moduleId: "corp.defend_servers",
      dedupeKey: "server-defense-portfolio",
      phase: "defense",
      persistencePolicy: "locked_sequence",
      openNeedIds: expect.arrayContaining([defenseNeedId]),
    });
    expect(executor).toMatchObject({
      moduleId: "corp.economy",
      parentInstanceId: defenseRootInstanceId,
      parentNeedId: defenseNeedId,
      persistencePolicy: "flexible_support",
      moduleState: {
        kind: "economy",
        signal: {
          kind: "parent_funding",
          gap: 1,
          immediateDefenseConversion: true,
          parentPlanInstanceId: defenseRootInstanceId,
          parentNeedId: defenseNeedId,
          parentPriorityClass: "P2",
          incrementalDefenseReserve: {
            targetCredits: 6,
            serverId: "hq",
            iceInstanceId: "corp_onr_proteus_017_credit-blocks_2",
          },
        },
      },
    });
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${defenseRootInstanceId}`,
        `plan_first_executor:${fundingLeafInstanceId}`,
        `plan_priority_delegated_from:${defenseRootInstanceId}`,
        `plan_priority_need:${defenseNeedId}`,
        `plan_assessment_evidence:corp_defense_exact_route_funding_required:hq:corp.install_card.corp_onr_proteus_017_credit-blocks_2.hq.corp_onr_proteus_017_credit-blocks_2.0`,
      ]),
    );
  });

  it("rejects a three-action purge for one visible virus counter", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(singleCounterPurgeJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).not.toBe("purge_runner_virus_counters");
    expect(
      result.decision?.decisionDebug?.actionAlternatives?.find(
        (entry) => entry.actionType === "purge_runner_virus_counters",
      ),
    ).toMatchObject({
      selected: false,
      excluded: true,
      whyNot: expect.arrayContaining([
        "explicitly_nonproductive:corp.respond_to_virus_pressure:corp_virus_purge_has_no_visible_strategic_pressure",
      ]),
    });
  });
});
