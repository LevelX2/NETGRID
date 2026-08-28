import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import fundedRdLayerJson from "../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-08-avoid-unfunded-rd-overstack-d110.json";
import type { AiDecisionCheckpointV1 } from "../evaluation/decision-checkpoints/checkpoint-types";
import { runAiDecisionCheckpoint } from "../evaluation/decision-checkpoints/checkpoint-runner";
import { residentPlanPortfolioSnapshot } from "./resident-plan-portfolio-memory";
import {
  corpPlanProgressRoots,
  corpPlanningHeadContinuationScope,
  corpPlanningHeadPriorityCoverage,
  specializedPlanningLineMatchesRoute,
} from "./corp-turn-planner-shadow";
import type { CorpAgendaTurnPlanningSlice } from "./corp-agenda-turn-planning";
import type { CorpPlanDomain } from "./corp-tactical-plan-modules";
import type { TurnPlanningHeadCandidate } from "./turn-planning-contracts";
import { planningHeadMatchesCommittedPhaseRoot } from "./corp-turn-planner-cutover";

describe("Corp TurnPlanner selected-head binding", () => {
  it("uses a blocked score route's explicit replan witness before its stale self head", () => {
    const projectId = "agenda:project-babylon:remote_4";
    const planInstanceId =
      "plan:corp.score_agenda:agenda%3Aproject-babylon%3Aremote_4";
    const actionId = "corp.install_card.project-babylon.remote_4";
    const needId = "score-protection:project-babylon:remote_4";
    const roots = corpPlanProgressRoots({
      domain: {
        scoreProjects: [
          {
            projectId,
            feasible: false,
            evidenceCode: "corp_score_protection_funding_gap:remote_4:1",
            protectionNeed: { needId },
          },
        ],
        remoteProjects: [],
        defenseNeeds: [],
        economyNeeds: [],
        virusPressure: [],
        punishCampaigns: [],
        ambushes: [],
        handManagement: [],
      } as unknown as CorpPlanDomain,
      agendaSlices: [
        {
          projectId,
          slice: {
            selectedLineId: "install-project-babylon",
            selectionReason: "best_expected_value",
            campaignDisposition: "blocked_replan",
            lines: [
              {
                lineId: "install-project-babylon",
                family: "pure_rush",
                currentActionId: actionId,
              },
            ],
          } as CorpAgendaTurnPlanningSlice,
        },
      ],
      heads: [
        {
          rootPlanInstanceId: planInstanceId,
          executorPlanInstanceId: planInstanceId,
          moduleId: "corp.score_agenda",
          currentBinding: { actionId },
        } as unknown as TurnPlanningHeadCandidate,
      ],
      foregroundPlanInstanceId: planInstanceId,
    });

    expect(roots).toEqual([
      expect.objectContaining({
        planInstanceId,
        blocked: true,
        requiredNeedId: needId,
        campaignDisposition: "blocked_replan",
        witness: {
          kind: "replan",
          reasonCode: "score_campaign_has_no_complete_current_line",
        },
      }),
    ]);
  });

  it("keeps an urgent same-turn score head inside its exact agenda root", () => {
    const scoreRoot =
      "plan:corp.score_agenda:agenda%3Ahostile-takeover%3Aremote_1";
    const scoreHead = {
      rootPlanInstanceId: scoreRoot,
      rootPlanModuleId: "corp.score_agenda" as const,
      moduleId: "corp.score_agenda" as const,
      executorPlanInstanceId: scoreRoot,
      priorityClass: "P3" as const,
      nextMilestoneId: "advance_score_agenda",
    };

    expect(corpPlanningHeadContinuationScope(scoreHead)).toBe("same_root");
    expect(
      corpPlanningHeadContinuationScope({
        ...scoreHead,
        priorityClass: "P4",
      }),
    ).toBeUndefined();
    expect(scoreHead).toMatchObject({
      rootPlanInstanceId: scoreRoot,
      executorPlanInstanceId: scoreRoot,
      moduleId: "corp.score_agenda",
      nextMilestoneId: "advance_score_agenda",
    });

    const exactCoverage = corpPlanningHeadPriorityCoverage({
      urgentPriorityClass: "P3",
      urgentExactScoreRootAvailable: true,
      head: scoreHead,
    });
    const siblingCoverage = corpPlanningHeadPriorityCoverage({
      urgentPriorityClass: "P3",
      urgentExactScoreRootAvailable: true,
      head: {
        ...scoreHead,
        moduleId: "corp.economy",
        executorPlanInstanceId:
          "plan:corp.economy:score-support%3Aagenda%3Atycho%3Aremote_1",
      },
    });

    expect(exactCoverage).toMatchObject({
      requiredObligationIds: [
        "priority-band:P3",
        "urgent-exact-score-owner:P3",
      ],
      satisfiedObligationIds: [
        "priority-band:P3",
        "urgent-exact-score-owner:P3",
      ],
      violatedObligationIds: [],
    });
    expect(siblingCoverage).toMatchObject({
      requiredObligationIds: [
        "priority-band:P3",
        "urgent-exact-score-owner:P3",
      ],
      satisfiedObligationIds: ["priority-band:P3"],
      violatedObligationIds: ["urgent-exact-score-owner:P3"],
    });
  });

  it("returns from an exact defense support leaf to its score root", () => {
    const scoreRoot = "plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_2";
    const supportHead = {
      rootPlanInstanceId: scoreRoot,
      rootPlanModuleId: "corp.score_agenda" as const,
      moduleId: "corp.defend_servers" as const,
      executorPlanInstanceId:
        "plan:corp.defend_servers:score-protection%3Aagenda-1%3Aremote_2",
      executorParentPlanInstanceId: scoreRoot,
      executorParentNeedId: "score-protection:agenda-1:remote_2",
      priorityClass: "P4" as const,
      nextMilestoneId: "score_server_protected",
    };

    expect(corpPlanningHeadContinuationScope(supportHead)).toBe("same_root");
    expect(
      planningHeadMatchesCommittedPhaseRoot(supportHead, {
        planInstanceId: scoreRoot,
        moduleId: "corp.score_agenda",
        milestoneId: "score_server_protected",
        provenance: "admitted_support",
      }),
    ).toBe(true);
    expect(
      planningHeadMatchesCommittedPhaseRoot(supportHead, {
        planInstanceId: scoreRoot,
        moduleId: "corp.defend_servers",
        milestoneId: "score_server_protected",
        provenance: "admitted_support",
      }),
    ).toBe(false);
  });

  it("does not let a sibling specialized line suppress an exact funding provider that shares its action", () => {
    const shared = {
      routeActionId: "play-accounts",
      routeModuleId: "corp.economy" as const,
      routePlanInstanceId: "plan:corp.economy:defense-reserve%3Ard%3Aice-1",
      routeDedupeKey: "defense-reserve:rd:ice-1",
      lineActionId: "play-accounts",
      lineOwnerModuleId: "corp.economy" as const,
    };

    expect(
      specializedPlanningLineMatchesRoute({
        ...shared,
        linePlanInstanceId:
          "plan:corp.economy:defense-reserve%3Aremote_1%3Aice-1",
      }),
    ).toBe(false);
    expect(
      specializedPlanningLineMatchesRoute({
        ...shared,
        linePlanInstanceId: shared.routePlanInstanceId,
      }),
    ).toBe(true);
  });

  it("keeps the defense module's selected current head bound through commitment and lease", () => {
    const checkpoint = structuredClone(
      fundedRdLayerJson,
    ) as AiDecisionCheckpointV1;
    checkpoint.source.kind = "synthetic_companion";
    checkpoint.engine.testOnlyGameState.corp.credits = 20;
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
    checkpoint.expectation = {
      acceptableActions: [
        {
          actionId:
            "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
        },
      ],
      planExecution: {
        acceptablePlanKinds: ["corp.defend_servers"],
        acceptableCapabilities: ["allocate_server_defense"],
      },
    };
    const result = runAiDecisionCheckpoint(checkpoint);
    const planning =
      result.decision?.decisionDebug?.planFirstDecision?.turnPlanning;
    const portfolio = residentPlanPortfolioSnapshot(result.input);

    expect(result.ok, result.message).toBe(true);
    expect(result.decision?.actionId).toBe(
      "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
    );
    expect(planning).toMatchObject({
      mode: "cutover",
      shadowComparison: {
        liveActionId:
          "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
        shadowActionId:
          "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
        shadowRootPlanInstanceId:
          "plan:corp.defend_servers:server-defense-portfolio",
        agreement: true,
      },
      commitment: {
        status: "active",
        rematerialization: {
          status: "executable",
          actionId:
            "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
        },
      },
    });
    expect(portfolio).toMatchObject({
      executorInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      turnPlanCommitment: {
        status: "active",
      },
      turnPlanExecutionLease: {
        currentBinding: {
          actionId:
            "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
        },
      },
    });
    expect(portfolio?.turnPlanExecutionLease?.commitmentId).toBe(
      portfolio?.turnPlanCommitment?.commitmentId,
    );
    const cursor = portfolio?.turnPlanCommitment?.cursor;
    const committedNode = cursor
      ? portfolio?.turnPlanCommitment?.phases[cursor.phaseIndex]?.nodes[
          cursor.nodeIndex
        ]
      : undefined;
    expect(portfolio?.turnPlanExecutionLease?.routeKey).toBe(
      committedNode?.invocation.routeKey,
    );
  });
});
