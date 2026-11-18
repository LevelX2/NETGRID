import type { CorpPlanDomain } from "./corp-tactical-plan-contracts";
import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import fundedRdLayerJson from "../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-08-avoid-unfunded-rd-overstack-d110.json";
import type { AiDecisionCheckpointV1 } from "../evaluation/decision-checkpoints/checkpoint-types";
import { runAiDecisionCheckpoint } from "../evaluation/decision-checkpoints/checkpoint-runner";
import { residentPlanPortfolioSnapshot } from "./resident-plan-portfolio-memory";
import {
  corpPlanProgressRoots,
  corpDefensePlanningLineMatchesRoute,
  corpPlanningHeadContinuationScope,
  corpPlanningHeadPriorityCoverage,
  specializedPlanningLineMatchesRoute,
} from "./corp-turn-planner-shadow";
import type { CorpAgendaTurnPlanningSlice } from "../corp/score/corp-agenda-turn-planning";

import type { TurnPlanningHeadCandidate } from "./turn-planning-contracts";
import { planningHeadMatchesCommittedPhaseRoot } from "./corp-turn-planner-cutover";

describe("Corp TurnPlanner selected-head binding", () => {
  it("uses a blocked score route's explicit replan witness before its stale self head", () => {
    const projectId = "agenda:project-babylon:r4";
    const planInstanceId =
      "pc7wfim8zpglz9gsyoxji7hmn1";
    const actionId = "cc.project-babylon.r4";
    const needId = "score-protection:project-babylon:r4";
    const roots = corpPlanProgressRoots({
      domain: {
        scoreProjects: [
          {
            projectId,
            feasible: false,
            evidenceCode: "corp_score_protection_funding_gap:r4:1",
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

  it.each([false, true])(
    "replans a score line without an executable provider even when project feasible=%s",
    (feasible) => {
      const projectId = "agenda:priority-requisition:new_remote";
      const planInstanceId =
        "p4agjryeicpfg6glkecanrbmcs";
      const actionId = "cc.priority-requisition.new_remote";
      const needId = "score-protection:priority-requisition:new_remote";
      const roots = corpPlanProgressRoots({
        domain: {
          scoreProjects: [
            {
              projectId,
              feasible,
              evidenceCode: "corp_score_protection_required:new_remote",
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
              selectedLineId: "install-priority-requisition",
              selectionReason: "best_expected_value",
              campaignDisposition: "continue",
              lines: [
                {
                  lineId: "install-priority-requisition",
                  family: "pure_rush",
                  currentActionId: actionId,
                },
              ],
            } as CorpAgendaTurnPlanningSlice,
          },
        ],
        heads: [],
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
    },
  );

  it("keeps an urgent same-turn score head inside its exact agenda root", () => {
    const scoreRoot =
      "pchlqdcyntxk1pahj3fn7cxz3n";
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
          "pdcotdsq4fiusvarcf6xpuq08z",
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
    const scoreRoot = "pbdqaaet57fc1fsqhucpd7r0x4";
    const supportHead = {
      rootPlanInstanceId: scoreRoot,
      rootPlanModuleId: "corp.score_agenda" as const,
      moduleId: "corp.defend_servers" as const,
      executorPlanInstanceId:
        "pb4asuxdk3s7jp403ftjy1f34a",
      executorParentPlanInstanceId: scoreRoot,
      executorParentNeedId: "score-protection:agenda-1:r2",
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
      routePlanInstanceId: "pkb9qmfqz08nftxe07cix61nn",
      routeDedupeKey: "defense-reserve:rd:ice-1",
      lineActionId: "play-accounts",
      lineOwnerModuleId: "corp.economy" as const,
    };

    expect(
      specializedPlanningLineMatchesRoute({
        ...shared,
        linePlanInstanceId:
          "paz0at5vyrfvy2ol0k6r0275p4",
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
    ) as unknown as AiDecisionCheckpointV1;
    checkpoint.source.kind = "synthetic_companion";
    checkpoint.engine.testOnlyGameState.corp.credits = 20;
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
    checkpoint.expectation = {
      acceptableActions: [
        {
          actionId:
            "cc.cfx.rd.cfx.4",
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
      "cc.cfx.rd.cfx.4",
    );
    expect(planning).toMatchObject({
      mode: "cutover",
      shadowComparison: {
        liveActionId:
          "cc.cfx.rd.cfx.4",
        shadowActionId:
          "cc.cfx.rd.cfx.4",
        shadowRootPlanInstanceId:
          "penw02zfrkklof54c2nuye5att",
        agreement: true,
      },
      commitment: {
        status: "active",
        rematerialization: {
          status: "executable",
          actionId:
            "cc.cfx.rd.cfx.4",
        },
      },
    });
    expect(portfolio).toMatchObject({
      executorInstanceId: "penw02zfrkklof54c2nuye5att",
      turnPlanCommitment: {
        status: "active",
      },
      turnPlanExecutionLease: {
        currentBinding: {
          actionId:
            "cc.cfx.rd.cfx.4",
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

describe("Corp defense provider authority", () => {
  const binding = {
    parentPlanInstanceId: "pdncsswqpavgvqw6oq05011eh1",
    parentNeedId: "score-protection:one:r1",
  };
  const route = {
    instance: {
      parentInstanceId: binding.parentPlanInstanceId,
      parentNeedId: binding.parentNeedId,
    },
    step: { target: { kind: "server", id: "r1" } },
  } as never;
  it("keeps exact parent, need and server support and rejects unrelated projected siblings", () => {
    const line = { targetServerId: "r1", supportBinding: binding };
    expect(corpDefensePlanningLineMatchesRoute(line, route)).toBe(true);
    expect(
      corpDefensePlanningLineMatchesRoute(
        { ...line, targetServerId: "hq" },
        route,
      ),
    ).toBe(false);
    expect(
      corpDefensePlanningLineMatchesRoute(
        { targetServerId: line.targetServerId },
        route,
      ),
    ).toBe(false);
    expect(
      corpDefensePlanningLineMatchesRoute(
        {
          ...line,
          supportBinding: {
            ...binding,
            parentPlanInstanceId: "different-score-parent",
          },
        },
        route,
      ),
    ).toBe(false);
    expect(
      corpDefensePlanningLineMatchesRoute(
        {
          ...line,
          supportBinding: { ...binding, parentNeedId: "different-need" },
        },
        route,
      ),
    ).toBe(false);
  });
  it("keeps independent global defense and prevents bound lines from borrowing its authority", () => {
    const general = { instance: {}, step: {} } as never;
    expect(
      corpDefensePlanningLineMatchesRoute({ targetServerId: "hq" }, general),
    ).toBe(true);
    expect(
      corpDefensePlanningLineMatchesRoute(
        { targetServerId: "r1", supportBinding: binding },
        general,
      ),
    ).toBe(false);
  });
});
