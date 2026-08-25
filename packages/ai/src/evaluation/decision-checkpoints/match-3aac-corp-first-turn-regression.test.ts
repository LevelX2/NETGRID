import { describe, expect, it } from "vitest";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3aac-01-corp-first-turn-no-premature-end-d4.json";
import singleCounterPurgeJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3aac-02-single-tax-counter-no-purge-d67.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";

describe("match 3aac Corp regression evidence", () => {
  it("installs the exact measurable HQ-defense route instead of completing the turn", () => {
    const checkpoint = structuredClone(
      checkpointJson,
    ) as AiDecisionCheckpointV1;
    const result = runAiDecisionCheckpoint(checkpoint);

    expect(checkpoint.difficulty).toBe("hard");
    expect(result.input.playerView.own.clicks).toBe(2);
    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(result.selectedAction).toMatchObject({
      actionId:
        "corp.install_card.corp_onr_proteus_025_homing-missile_2.hq.corp_onr_proteus_025_homing-missile_2.0",
      type: "install_card",
      payload: { serverId: "hq", placement: "ice" },
    });
    const portfolio = residentPlanPortfolioSnapshot(result.input);
    const defenseRootInstanceId =
      "plan:corp.defend_servers:server-defense-portfolio";
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    const defenseRoot = portfolio?.instances.find(
      (instance) => instance.instanceId === defenseRootInstanceId,
    );
    expect(portfolio).toMatchObject({
      rootForegroundInstanceId: defenseRootInstanceId,
      executorInstanceId: defenseRootInstanceId,
    });
    expect(defenseRoot).toMatchObject({
      moduleId: "corp.defend_servers",
      dedupeKey: "server-defense-portfolio",
      phase: "defense",
      persistencePolicy: "locked_sequence",
    });
    expect(executor).toMatchObject({
      moduleId: "corp.defend_servers",
      instanceId: defenseRootInstanceId,
    });
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${defenseRootInstanceId}`,
        `plan_first_executor:${defenseRootInstanceId}`,
        "plan_step_capability:allocate_server_defense",
        "plan_assessment_evidence:engine_certified_global_defense_access_probability_reduced",
      ]),
    );
    expect(result.decision?.decisionDebug?.planFirstDecision).toMatchObject({
      selectionAuthority: "turn_plan_commitment",
      rootPlanInstanceId: defenseRootInstanceId,
      leafExecutorInstanceId: defenseRootInstanceId,
      route: {
        planInstanceId: defenseRootInstanceId,
        actionId: result.selectedAction?.actionId,
        capabilityId: "allocate_server_defense",
      },
      turnPlanning: {
        mode: "cutover",
        selectedLine: {
          phases: [
            expect.objectContaining({
              rootPlanInstanceId: defenseRootInstanceId,
              rootModuleId: "corp.defend_servers",
              rootProvenance: "resident",
            }),
          ],
        },
      },
    });
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
