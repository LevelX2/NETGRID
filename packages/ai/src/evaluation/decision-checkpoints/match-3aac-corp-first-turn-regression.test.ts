import { describe, expect, it } from "vitest";
import { applyAction } from "@netgrid/engine";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3aac-01-corp-first-turn-no-premature-end-d4.json";
import singleCounterPurgeJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3aac-02-single-tax-counter-no-purge-d67.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";

describe("match 3aac Corp regression evidence", () => {
  it("funds the exact measurable HQ-defense route and installs it instead of completing the turn", () => {
    const checkpoint = structuredClone(
      checkpointJson,
    ) as AiDecisionCheckpointV1;
    checkpoint.expectation.acceptableActions = [
      { actionId: "corp.gain_credit" },
    ];
    checkpoint.expectation.planExecution = {
      acceptablePlanKinds: ["corp.economy"],
      acceptableCapabilities: ["develop_or_convert_corp_economy"],
      requiredAssessmentEvidence: [
        "corp_defense_exact_route_funding_required:hq:corp.install_card.corp_onr_proteus_017_credit-blocks_2.hq.corp_onr_proteus_017_credit-blocks_2.0",
      ],
    };
    const result = runAiDecisionCheckpoint(checkpoint);

    expect(checkpoint.difficulty).toBe("hard");
    expect(result.input.playerView.own.clicks).toBe(2);
    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(result.selectedAction).toMatchObject({
      actionId: "corp.gain_credit",
      type: "gain_credit",
    });
    const portfolio = residentPlanPortfolioSnapshot(result.input);
    const defenseRootInstanceId =
      "plan:corp.defend_servers:server-defense-portfolio";
    const fundingExecutorId =
      "plan:corp.economy:defense-reserve%3Ahq%3Acorp_onr_proteus_017_credit-blocks_2";
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    const defenseRoot = portfolio?.instances.find(
      (instance) => instance.instanceId === defenseRootInstanceId,
    );
    expect(portfolio).toMatchObject({
      rootForegroundInstanceId: defenseRootInstanceId,
      executorInstanceId: fundingExecutorId,
    });
    expect(defenseRoot).toMatchObject({
      moduleId: "corp.defend_servers",
      dedupeKey: "server-defense-portfolio",
      phase: "defense",
      persistencePolicy: "locked_sequence",
    });
    expect(executor).toMatchObject({
      moduleId: "corp.economy",
      instanceId: fundingExecutorId,
      parentInstanceId: defenseRootInstanceId,
      parentNeedId:
        "install:hq:corp.install_card.corp_onr_proteus_017_credit-blocks_2.hq.corp_onr_proteus_017_credit-blocks_2.0",
    });
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${defenseRootInstanceId}`,
        `plan_first_executor:${fundingExecutorId}`,
        "plan_step_capability:develop_or_convert_corp_economy",
        "plan_assessment_evidence:corp_defense_exact_route_funding_required:hq:corp.install_card.corp_onr_proteus_017_credit-blocks_2.hq.corp_onr_proteus_017_credit-blocks_2.0",
      ]),
    );
    expect(result.decision?.decisionDebug?.planFirstDecision).toMatchObject({
      selectionAuthority: "turn_plan_commitment",
      rootPlanInstanceId: defenseRootInstanceId,
      leafExecutorInstanceId: fundingExecutorId,
      route: {
        planInstanceId: fundingExecutorId,
        actionId: result.selectedAction?.actionId,
        capabilityId: "develop_or_convert_corp_economy",
      },
      turnPlanning: {
        mode: "cutover",
        selectedLine: {
          phases: [
            expect.objectContaining({
              rootPlanInstanceId: defenseRootInstanceId,
              rootModuleId: "corp.defend_servers",
              rootProvenance: "admitted_support",
              supportBindings: expect.arrayContaining([
                expect.objectContaining({
                  planInstanceId: fundingExecutorId,
                  parentNeedId:
                    "install:hq:corp.install_card.corp_onr_proteus_017_credit-blocks_2.hq.corp_onr_proteus_017_credit-blocks_2.0",
                }),
              ]),
            }),
          ],
        },
      },
    });
    const before = structuredClone(checkpoint.engine.testOnlyGameState);
    before.eventLog = structuredClone(checkpoint.engine.eventPrefix);
    const funded = applyAction(before, {
      matchId: before.matchId,
      side: "corp",
      actionId: result.decision!.actionId!,
      clientKnownStateVersion: before.stateVersion,
    });
    expect(funded.ok).toBe(true);
    if (!funded.ok) throw Error(JSON.stringify(funded.error));
    expect([funded.state.corp.credits, funded.state.corp.clicks]).toEqual([
      6, 1,
    ]);
    const next = buildAiDecisionInput(funded.state, "corp", {
      ownDeckSnapshot: checkpoint.deckSnapshot,
      difficulty: "hard",
    });
    const install = chooseAiAction(next);
    expect(install.actionId).toBe(
      "corp.install_card.corp_onr_proteus_017_credit-blocks_2.hq.corp_onr_proteus_017_credit-blocks_2.0",
    );
    expect(install.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: defenseRootInstanceId,
      leafExecutorInstanceId: defenseRootInstanceId,
    });
    expect(
      applyAction(funded.state, {
        matchId: before.matchId,
        side: "corp",
        actionId: install.actionId!,
        clientKnownStateVersion: funded.state.stateVersion,
      }).ok,
    ).toBe(true);
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
