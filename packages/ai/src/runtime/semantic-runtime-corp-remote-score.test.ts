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

  it("routes first access-stop ICE toward R&D under visible R&D Interface pressure", () => {
    const etrIce = corpCard("barrier", "ice", {
      definitionId: "simple_barrier_ice",
      rezCost: 3,
    });
    const input = corpInputForCentralInstall(etrIce, {
      agendaInHq: false,
      runnerRig: [
        runnerCard("rd-interface", "hardware", {
          definitionId: "onr_v1_139_r-and-d-interface",
          title: "R&D Interface",
        }),
      ],
    });

    const hqScore = centralInstallScore(etrIce, "hq", input);
    const rdScore = centralInstallScore(etrIce, "rd", input);

    expect(hqScore).toBe(1050);
    expect(rdScore).toBe(1350);
    expect(rdScore).toBeGreaterThan(hqScore);
  });

  it("does not treat unaffordable central ICE as real R&D protection", () => {
    const etrIce = corpCard("expensive-barrier", "ice", {
      definitionId: "simple_barrier_ice",
      rezCost: 6,
    });
    const input = corpInputForCentralInstall(etrIce, {
      agendaInHq: false,
      credits: 2,
      runnerRig: [rdInterface()],
    });

    expect(centralInstallScore(etrIce, "rd", input)).toBe(250);
  });

  it("downgrades solo Dog Pile when visible Killer coverage can break it", () => {
    const dogPile = corpCard("dog-pile", "ice", {
      definitionId: "onr_proteus_021_dog-pile",
      title: "Dog Pile",
      rezCost: 3,
    });
    const input = corpInputForCentralInstall(dogPile, {
      agendaInHq: false,
      runnerRig: [rdInterface(), killerBreaker()],
    });

    expect(centralInstallScore(dogPile, "rd", input)).toBe(250);
  });

  it("does not overvalue solo Hunting Pack before outside ICE creates subroutines", () => {
    const huntingPack = corpCard("hunting-pack", "ice", {
      definitionId: "onr_proteus_026_hunting-pack",
      title: "Hunting Pack",
      rezCost: 4,
    });
    const input = corpInputForCentralInstall(huntingPack, {
      agendaInHq: false,
      runnerRig: [rdInterface()],
    });

    expect(centralInstallScore(huntingPack, "rd", input)).toBe(200);
  });

  it("keeps Credit Blocks strong only when the wall mode is fundable against visible Killer coverage", () => {
    const creditBlocks = corpCard("credit-blocks", "ice", {
      definitionId: "onr_proteus_017_credit-blocks",
      title: "Credit Blocks",
      rezCost: 3,
    });
    const fundableWallModeInput = corpInputForCentralInstall(creditBlocks, {
      agendaInHq: false,
      credits: 5,
      runnerRig: [rdInterface(), killerBreaker()],
    });
    const unfundableWallModeInput = corpInputForCentralInstall(creditBlocks, {
      agendaInHq: false,
      credits: 3,
      runnerRig: [rdInterface(), killerBreaker()],
    });

    expect(centralInstallScore(creditBlocks, "rd", fundableWallModeInput)).toBe(
      1350,
    );
    expect(
      centralInstallScore(creditBlocks, "rd", unfundableWallModeInput),
    ).toBe(650);
  });

  it("downranks Archives ICE without concrete Archives risk under R&D pressure", () => {
    const etrIce = corpCard("barrier", "ice", {
      definitionId: "simple_barrier_ice",
      rezCost: 2,
    });
    const input = corpInputForCentralInstall(etrIce, {
      agendaInHq: false,
      runnerRig: [rdInterface()],
    });

    const archivesScore = installIceScore(etrIce, "archives", input);
    const rdScore = centralInstallScore(etrIce, "rd", input);

    expect(archivesScore).toBe(-450);
    expect(rdScore).toBe(1350);
    expect(archivesScore).toBeLessThan(rdScore);
  });

  it("keeps Archives ICE valuable when an agenda is actually in Archives", () => {
    const etrIce = corpCard("barrier", "ice", {
      definitionId: "simple_barrier_ice",
      rezCost: 2,
    });
    const input = corpInputForCentralInstall(etrIce, {
      agendaInHq: false,
      archivesCards: [
        corpCard("archived-agenda", "agenda", {
          agendaPoints: 2,
        }),
      ],
    });

    expect(installIceScore(etrIce, "archives", input)).toBe(900);
  });

  it("does not treat dynamic-only remote ICE as a full scoring remote build", () => {
    const huntingPack = corpCard("hunting-pack", "ice", {
      definitionId: "onr_proteus_026_hunting-pack",
      title: "Hunting Pack",
      rezCost: 1,
    });
    const input = corpInputForCentralInstall(huntingPack, {
      agendaInHq: true,
      credits: 3,
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
        { id: "remote_1", label: "Remote 1", ice: [], root: [] },
      ],
    });

    expect(installIceScore(huntingPack, "remote_1", input)).toBe(450);
  });
});

function centralInstallScore(
  ice: VisibleCard,
  serverId: "hq" | "rd",
  input = corpInputForCentralInstall(ice),
): number {
  const action = centralInstallIceAction(ice, serverId);
  return semanticRuntimeCorpInstallRemoteScore(
    input,
    action,
    [],
    centralInstallDependencies(),
  );
}

function installIceScore(
  ice: VisibleCard,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  input = corpInputForCentralInstall(ice),
): number {
  const action = centralInstallIceAction(ice, serverId);
  return semanticRuntimeCorpInstallRemoteScore(
    input,
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
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
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

function corpInputForCentralInstall(
  ice: VisibleCard,
  options: {
    agendaInHq?: boolean;
    credits?: number;
    runnerRig?: VisibleCard[];
    archivesCards?: VisibleCard[];
    servers?: AiDecisionInput["playerView"]["servers"];
  } = {},
): AiDecisionInput {
  const agendaInHq = options.agendaInHq ?? true;
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
        credits: options.credits ?? 5,
        clicks: 3,
        heapOrArchives: options.archivesCards ?? [],
        gripOrHq: [
          ice,
          ...(agendaInHq
            ? [
                {
                  instanceId: "agenda-in-hq",
                  known: true,
                  type: "agenda",
                  owner: "corp",
                },
              ]
            : []),
        ],
      },
      opponent: {
        credits: 4,
        rig: options.runnerRig ?? [],
        identity: {
          counterDisplays: [],
        },
      },
      servers: options.servers ?? [
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

function rdInterface(): VisibleCard {
  return runnerCard("rd-interface", "hardware", {
    definitionId: "onr_v1_139_r-and-d-interface",
    title: "R&D Interface",
  });
}

function killerBreaker(): VisibleCard {
  return runnerCard("loony-goon", "program", {
    title: "Loony Goon",
    subtypes: ["Icebreaker", "Killer"],
    rulesText: "Break sentry subroutines.",
  });
}

function runnerCard(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type,
    owner: "runner",
    controller: "runner",
    ...overrides,
  } as VisibleCard;
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
