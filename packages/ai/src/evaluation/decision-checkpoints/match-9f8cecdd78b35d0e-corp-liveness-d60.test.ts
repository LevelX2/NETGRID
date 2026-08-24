import { CURRENT_RULES_BASELINE, type AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { buildCorpAgendaTurnPlanningSlice } from "../../plans/corp-agenda-turn-planning";
import { corpTurnLiquidityDevelopmentNeed } from "../../plans/corp-economy-domain-signals";
import type {
  CorpDefenseSignal,
  CorpEconomyLiquidityDevelopmentSignal,
  CorpScoreProjectSignal,
} from "../../plans/corp-core-plan-modules";
import { scoreConsumerSupportState } from "../../plans/corp-remote-project-signals";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { buildPlanningRulesContext } from "../../plans/turn-planning-contracts";
import {
  checkpointDefenseCandidate,
  checkpointRemoteProject,
} from "./corp-defense-checkpoint-test-support";

describe("match 9f8cecdd78b35d0e Corp scoring liveness at decision 60", () => {
  it("keeps one stable cross-turn liquidity target while the bound score milestone is unchanged", () => {
    const observedTargets: Array<number | undefined> = [];
    let previous: ResidentPlanPortfolio | undefined;

    for (const [index, credits] of [11, 14, 17].entries()) {
      const turnSerial = 20 + index;
      const input = decisionInput(credits, turnSerial, 60 + index);
      const signal = corpTurnLiquidityDevelopmentNeed(
        input,
        [basicCreditCandidate(input.playerView.stateVersion)],
        previous,
        `corp:${turnSerial}`,
      );
      observedTargets.push(signal?.targetCredits);
      if (signal) {
        previous = portfolioFor(signal, input.playerView.stateVersion);
      }
    }

    expect(observedTargets).toEqual([14, undefined, undefined]);
  });

  it("converts the unchanged blocked score root through its exact Defense provider", () => {
    const input = decisionInput(11, 20, 60);
    const parentNeedId = "score-protection:agenda:agenda-1:remote_1:revision-4";
    const project = {
      projectId: "agenda:agenda-1:remote_1",
      agendaDefinitionId: "agenda-definition",
      agendaInstanceId: "agenda-1",
      agendaPoints: 2,
      serverId: "remote_1",
      phase: "install_agenda",
      sameTurnCloseout: false,
      terminalScore: false,
      feasible: false,
      protectionNeed: {
        needId: parentNeedId,
        parentProjectId: "agenda:agenda-1:remote_1",
        targetServerId: "remote_1",
        observedAtStateVersion: 60,
      },
      evidenceCode: "corp_score_protection_required:remote_1",
    } as unknown as CorpScoreProjectSignal;
    const provider = checkpointDefenseCandidate(
      "bound-score-and-remote-demand",
      "remote_1",
      "remote-hardening-ice",
    );
    const defenseProvider: CorpDefenseSignal = {
      kind: "score_protection_staging_install",
      defenseId: "score-protection-staging:agenda-1:remote_1",
      serverId: "remote_1",
      phase: "install_ice",
      parentProjectId: project.projectId,
      parentNeedId,
      delegatedPriorityClass: "P4",
      actionId: provider.actionId,
      sourceCardInstanceId: provider.sourceCardInstanceId!,
      sourceDefinitionId: provider.sourceDefinitionId!,
      evidenceCode: "score_protection_staging_install:d60",
    };
    const remoteProject = checkpointRemoteProject(
      "remote-hardening:strategic-score-remote:4",
    );
    const slice = buildCorpAgendaTurnPlanningSlice({
      input,
      project,
      candidates: [provider, basicCreditCandidate(60)],
      defenseNeeds: [defenseProvider],
      rulesContext: buildPlanningRulesContext({
        rulesBaseline: CURRENT_RULES_BASELINE,
        formatProfileId: "d60-corp-liveness",
        cardPoolSnapshotId: "d60-corp-liveness",
      }),
      stateIdentity: {
        stateVersion: 60,
        sideSafePlanningFingerprint: "d60-corp-liveness-state",
      },
    });

    expect(scoreConsumerSupportState(project)).toEqual({
      kind: "awaiting_remote_protection",
      agendaInstanceId: "agenda-1",
      targetServerId: "remote_1",
      protectionNeedId: parentNeedId,
    });
    expect(remoteProject).toMatchObject({
      projectId: "strategic-score-remote",
      target: { status: "bound", serverId: "remote_1" },
      need: {
        capability: "improve_remote_protection_path",
        targetServerId: "remote_1",
      },
    });
    expect(slice).toMatchObject({
      selectedFamily: "safe_setup",
      campaignDisposition: "continue",
      lines: [
        expect.objectContaining({
          family: "safe_setup",
          currentActionId: provider.actionId,
          parentNeedId,
          providerModuleId: "corp.defend_servers",
          expectedNeedProgress: "monotonic_protection_improvement",
        }),
      ],
    });
    expect(
      corpTurnLiquidityDevelopmentNeed(
        decisionInput(14, 21, 61),
        [basicCreditCandidate(61)],
        undefined,
        "corp:21",
      ),
    ).toBeUndefined();
  });
});

function portfolioFor(
  signal: CorpEconomyLiquidityDevelopmentSignal,
  stateVersion: number,
): ResidentPlanPortfolio {
  return {
    stateVersion,
    instances: [
      {
        moduleId: "corp.economy",
        dedupeKey: signal.needId,
        moduleState: { kind: "economy", signal },
      },
    ],
  } as unknown as ResidentPlanPortfolio;
}

function decisionInput(
  credits: number,
  turnSerial: number,
  stateVersion: number,
): AiDecisionInput {
  return {
    side: "corp",
    actionNumber: stateVersion,
    legalActions: [
      {
        actionId: "basic-credit",
        side: "corp",
        type: "gain_credit",
        source: "basic_action",
        expiresAtStateVersion: stateVersion,
        targetRequirements: [],
        choiceRequirements: [],
        costs: [{ clicks: 1 }],
      },
      {
        actionId: "bound-score-and-remote-demand",
        side: "corp",
        type: "install_card",
        source: "remote-hardening-ice",
        expiresAtStateVersion: stateVersion,
        targetRequirements: [],
        choiceRequirements: [],
        costs: [{ clicks: 1, credits: 0 }],
        payload: {
          placement: "ice",
          serverId: "remote_1",
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteFinalCredits: 14,
        },
      },
      ...["agenda-1", "agenda-2"].map((agendaInstanceId) => ({
        actionId: `install-${agendaInstanceId}-remote-1`,
        side: "corp" as const,
        type: "install_card" as const,
        source: agendaInstanceId,
        expiresAtStateVersion: stateVersion,
        targetRequirements: [],
        choiceRequirements: [],
        costs: [{ clicks: 1, credits: 0 }],
        payload: {
          placement: "root" as const,
          serverId: "remote_1",
          cardId: agendaInstanceId,
        },
      })),
    ],
    playerView: {
      stateVersion,
      turnSerial,
      own: {
        credits,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [
          { instanceId: "agenda-1", known: true, type: "agenda" },
          { instanceId: "agenda-2", known: true, type: "agenda" },
        ],
        maxHandSize: 5,
      },
      servers: [
        { id: "hq", ice: [], root: [] },
        { id: "rd", ice: [], root: [] },
        { id: "archives", ice: [], root: [] },
        {
          id: "remote_1",
          ice: [
            { instanceId: "remote-ice-1", known: true, rezzed: false },
            { instanceId: "remote-ice-2", known: true, rezzed: false },
          ],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function basicCreditCandidate(stateVersion: number): ActionSemanticCandidate {
  return {
    actionId: "basic-credit",
    stateVersion,
    sourceKind: "basic_action",
    actionType: "gain_credit",
    semanticActionType: "economy.gain_credit",
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      additionalCosts: [],
    },
    economyProjection: {
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: 1,
      netLiquidCreditGain: 1,
      cardsDrawn: 0,
      cardsConsumed: 0,
      netHandDelta: 0,
      payoutMode: "fixed",
      repeatable: true,
      reliability: "guaranteed",
      source: "basic_action_contract",
      confidence: "medium",
    },
  } as unknown as ActionSemanticCandidate;
}
