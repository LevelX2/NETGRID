import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  semanticRuntimeCorpInstallRemoteScore,
  semanticRuntimeCorpShouldBuildProtectedScoreRemote,
} from "./semantic-runtime-corp-remote-score";

describe("semanticRuntimeCorpShouldBuildProtectedScoreRemote", () => {
  it("uses semantic candidate credit cost for protected remote reserve checks", () => {
    const action = remoteInstallIceAction();
    const input = corpInput();
    const candidate = semanticCandidate(action.actionId, 3);

    const result = semanticRuntimeCorpShouldBuildProtectedScoreRemote(
      input,
      action,
      {
        actionServerId: () => "remote_1",
        server: () => ({ id: "remote_1", ice: [], root: [] }),
        hasStabilizingAlternative: () => false,
        isRemoteServerTarget: () => true,
        emptyRemoteCount: () => 0,
        remoteIsProtected: () => false,
        actionIsScoreLine: () => false,
        remoteHasScoreLine: () => false,
        actionCreditCost: () => 99,
        advanceCompletesScore: () => false,
        visibleIceRezCost: (card) => card.rezCost,
        actionSourceCard: () => undefined,
      },
      candidate,
    );

    expect(result).toBe(true);
  });
});

describe("semanticRuntimeCorpInstallRemoteScore central ICE", () => {
  it("values real HQ access-stop ICE above damage-only ICE under HQ agenda pressure", () => {
    const damageIce = corpCard("brain-wash", "ice", {
      definitionId: "onr_proteus_011_brain-wash",
      rezCost: 2,
    });
    const etrIce = corpCard("barrier", "ice", {
      definitionId: "simple_barrier_ice",
      rezCost: 3,
    });

    const damageScore = centralInstallScore(damageIce, "hq");
    const etrScore = centralInstallScore(etrIce, "hq");

    expect(damageScore).toBe(450);
    expect(etrScore).toBe(1350);
    expect(damageScore).toBeLessThan(etrScore);
  });

  it("still gives a small central value to damage-only ICE without treating it as access-stop defense", () => {
    const damageIce = corpCard("brain-wash", "ice", {
      definitionId: "onr_proteus_011_brain-wash",
      rezCost: 2,
    });

    expect(centralInstallScore(damageIce, "rd")).toBe(250);
  });
});

function centralInstallScore(
  ice: VisibleCard,
  serverId: "hq" | "rd",
): number {
  const action = centralInstallIceAction(ice, serverId);
  return semanticRuntimeCorpInstallRemoteScore(
    corpInputForCentralInstall(ice),
    action,
    [],
    centralInstallDependencies(),
  );
}

function remoteInstallIceAction(): LegalAction {
  return {
    actionId: "install-remote-ice",
    label: "Install remote ICE",
    type: "install_card",
    side: "corp",
    costs: [],
    timingPoint: "corp_action.main",
    visibility: "private_to_actor",
    expiresAtStateVersion: 12,
    targetRequirements: [],
    choiceRequirements: [],
    payload: {
      placement: "ice",
    },
  } as unknown as LegalAction;
}

function centralInstallIceAction(
  ice: VisibleCard,
  serverId: "hq" | "rd",
): LegalAction {
  return {
    actionId: `install-${serverId}-ice`,
    label: "Install central ICE",
    type: "install_card",
    side: "corp",
    source: ice.instanceId,
    costs: [],
    timingPoint: "corp_action.main",
    visibility: "private_to_actor",
    expiresAtStateVersion: 12,
    targetRequirements: [],
    choiceRequirements: [],
    payload: {
      placement: "ice",
      serverId,
    },
  } as unknown as LegalAction;
}

function corpInput(): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    profileId: "test-corp",
    difficulty: "normal",
    eventTail: [],
    seed: "corp-remote-score-candidate-test",
    decisionId: "corp-remote-score-candidate-test.1",
    actionNumber: 1,
    playerView: {
      stateVersion: 11,
      own: {
        credits: 5,
        clicks: 3,
        gripOrHq: [
          {
            known: true,
            type: "agenda",
          },
        ],
      },
      opponent: {
        identity: {
          counterDisplays: [],
        },
      },
      servers: [
        {
          id: "remote_1",
          ice: [],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function corpInputForCentralInstall(ice: VisibleCard): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    profileId: "test-corp",
    difficulty: "normal",
    eventTail: [],
    seed: "corp-central-score-candidate-test",
    decisionId: "corp-central-score-candidate-test.1",
    actionNumber: 1,
    playerView: {
      stateVersion: 11,
      own: {
        credits: 5,
        clicks: 3,
        gripOrHq: [
          ice,
          {
            instanceId: "agenda-in-hq",
            known: true,
            type: "agenda",
            owner: "corp",
          },
        ],
      },
      opponent: {
        credits: 4,
        identity: {
          counterDisplays: [],
        },
      },
      servers: [
        {
          id: "hq",
          ice: [],
          root: [],
        },
        {
          id: "rd",
          ice: [],
          root: [],
        },
        {
          id: "archives",
          ice: [],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function corpCard(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type,
    owner: "corp",
    ...overrides,
  } as VisibleCard;
}

function semanticCandidate(
  actionId: string,
  creditCost: number,
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "install_card",
    actorSide: "corp",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId,
      actionType: "install_card",
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    abilityBindingMethod: "explicit_ability_id",
    semanticActionType: "install.ice",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      creditCost,
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}

function centralInstallDependencies() {
  return {
    actionServerId: (_input: AiDecisionInput, action: LegalAction) =>
      typeof action.payload?.serverId === "string"
        ? action.payload.serverId
        : undefined,
    server: (input: AiDecisionInput, serverId: string | undefined) =>
      input.playerView.servers.find((candidate) => candidate.id === serverId),
    hasStabilizingAlternative: () => false,
    isRemoteServerTarget: (serverId: string | undefined) =>
      serverId?.startsWith("remote_") === true,
    emptyRemoteCount: () => 0,
    remoteIsProtected: (
      server: AiDecisionInput["playerView"]["servers"][number] | undefined,
    ) => (server?.ice.length ?? 0) > 0,
    actionIsScoreLine: () => false,
    remoteHasScoreLine: () => false,
    actionCreditCost: () => 0,
    advanceCompletesScore: () => false,
    visibleIceRezCost: (card: VisibleCard) => card.rezCost,
    actionSourceCard: (input: AiDecisionInput, action: LegalAction) =>
      input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === action.source,
      ),
  };
}
