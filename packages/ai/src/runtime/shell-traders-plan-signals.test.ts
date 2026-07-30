import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import type { RunnerCoverageGapSignal } from "../plans/runner-core-plan-modules";
import { buildRunnerShellTradersPipelineSignals } from "./shell-traders-plan-signals";

describe("runner Shell Traders pipeline signals", () => {
  it("stays completely inactive without an installed Shell Traders source", () => {
    const target = card("dwarf", "onr_v1_021_dwarf", "program", {
      installCost: 3,
      memoryCost: 1,
    });
    const action = shellAction("prepare-dwarf", "shell-source", target, {
      delayedInstallAbility: "set_aside_from_grip",
      shellCounterAmount: 3,
    });
    const input = runnerInput([action], {
      grip: [target],
      rig: [],
    });

    expect(signals(input, [coverageGap("wall-gap", "breaker_wall")])).toEqual(
      [],
    );
  });

  it("binds an exact preparation action to the missing breaker role and server", () => {
    const source = shellTraders();
    const target = card("dwarf", "onr_v1_021_dwarf", "program", {
      installCost: 3,
      memoryCost: 1,
    });
    const action = shellAction("prepare-dwarf", source.instanceId, target, {
      delayedInstallAbility: "set_aside_from_grip",
      shellCounterAmount: 3,
    });
    const input = runnerInput([action], {
      grip: [target],
      rig: [source],
    });

    expect(
      signals(input, [
        coverageGap("wall-gap", "breaker_wall", "remote_1", "P2"),
      ]),
    ).toEqual([
      expect.objectContaining({
        pipelineId: "shell-source:dwarf",
        phase: "prepare",
        sourceCardInstanceId: "shell-source",
        targetCardInstanceId: "dwarf",
        actionIds: ["prepare-dwarf"],
        priorityClass: "P2",
        shellCountersBefore: 3,
        shellCountersAfterAction: 3,
        coverageBinding: {
          gapId: "wall-gap",
          requiredRole: "breaker_wall",
          targetServerId: "remote_1",
        },
      }),
    ]);
  });

  it("holds the last counter when completion would trash another required breaker", () => {
    const source = shellTraders();
    const prepared = card(
      "cyfermaster-prepared",
      "onr_v1_016_cyfermaster",
      "program",
      {
        installCost: 4,
        memoryCost: 1,
        counters: { shell: 1 },
      },
    );
    const dwarf = card("dwarf-installed", "onr_v1_021_dwarf", "program", {
      installCost: 3,
      memoryCost: 1,
    });
    const action = shellAction(
      "remove-last-cyfermaster",
      source.instanceId,
      prepared,
      {
        delayedInstallAbility: "remove_shell_counter",
        remainingCountersBefore: 1,
      },
    );
    const input = runnerInput([action], {
      rig: [source, dwarf],
      setAside: [prepared],
      memoryLimit: 4,
      memoryUsed: 4,
    });

    expect(signals(input, [coverageGap("wall-gap", "breaker_wall")])).toEqual([
      expect.objectContaining({
        phase: "hold",
        actionIds: [],
        rejectedActionIds: ["remove-last-cyfermaster"],
        replacementAssessment: expect.objectContaining({
          status: "harmful",
          selectedProgramInstanceIds: ["dwarf-installed"],
        }),
      }),
    ]);
  });

  it("allows a same-role breaker replacement when it completes an acute target", () => {
    const source = shellTraders();
    const prepared = card("dwarf-new", "onr_v1_021_dwarf", "program", {
      installCost: 3,
      memoryCost: 1,
      counters: { shell: 1 },
    });
    const oldDwarf = card("dwarf-old", "onr_v1_021_dwarf", "program", {
      installCost: 3,
      memoryCost: 1,
    });
    const action = shellAction(
      "remove-last-dwarf",
      source.instanceId,
      prepared,
      {
        delayedInstallAbility: "remove_shell_counter",
        remainingCountersBefore: 1,
      },
    );
    const input = runnerInput([action], {
      rig: [source, oldDwarf],
      setAside: [prepared],
      memoryLimit: 4,
      memoryUsed: 4,
    });

    expect(
      signals(input, [
        coverageGap("wall-gap", "breaker_wall", "remote_2", "P2"),
      ]),
    ).toEqual([
      expect.objectContaining({
        phase: "progress",
        actionIds: ["remove-last-dwarf"],
        priorityClass: "P2",
        replacementAssessment: expect.objectContaining({
          status: "available",
          selectedProgramInstanceIds: ["dwarf-old"],
        }),
      }),
    ]);
  });
});

function signals(
  input: AiDecisionInput,
  coverageGaps: RunnerCoverageGapSignal[],
) {
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      "shell-source": "onr_v1_176_the-shell-traders",
    },
  });
  return buildRunnerShellTradersPipelineSignals({
    input,
    candidates,
    coverageGaps,
    handDevelopment: [],
  });
}

function coverageGap(
  gapId: string,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
  targetServerId?: string,
  priorityClass: RunnerCoverageGapSignal["priorityClass"] = "P5",
): RunnerCoverageGapSignal {
  return {
    gapId,
    requiredRole,
    ...(targetServerId ? { targetServerId } : {}),
    priorityClass,
    evidenceCode: `coverage:${gapId}`,
    deckHasAnswer: true,
    answerInHand: true,
    fundingActionIds: [],
    directSearchActionIds: [],
    searchEngineSetupActionIds: [],
    drawForAnswerActionIds: [],
  };
}

function runnerInput(
  legalActions: LegalAction[],
  options: {
    grip?: VisibleCard[];
    rig?: VisibleCard[];
    setAside?: VisibleCard[];
    memoryLimit?: number;
    memoryUsed?: number;
  },
): AiDecisionInput {
  const input: AiDecisionInput = {
    side: "runner",
    playerView: {
      side: "runner",
      stateVersion: 7,
      timingPoint: "runner_action.main",
      activeSide: "runner",
      phase: "runner_action_phase",
      own: {
        identity: card("runner-identity", "runner_identity_001", "identity"),
        credits: 8,
        clicks: 4,
        agendaPoints: 0,
        gripOrHq: options.grip ?? [],
        stackOrRdCount: 35,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
        rig: options.rig ?? [],
        memoryLimit: options.memoryLimit ?? 4,
        memoryUsed: options.memoryUsed ?? 0,
      },
      opponent: {
        identity: card("corp-identity", "corp_identity_001", "identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 40,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
      ],
      specialZones: {
        setAside: options.setAside ?? [],
        removedFromGame: [],
        setAsideCount: options.setAside?.length ?? 0,
        removedFromGameCount: 0,
      },
      publicEvents: [],
      legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "shell-traders-plan-signals",
    decisionId: "decision-shell-traders",
    actionNumber: 1,
    profileId: "runner-ai-v0.9-normal",
  };
  return input;
}

function shellAction(
  actionId: string,
  source: string,
  target: VisibleCard,
  payload: Record<string, unknown>,
): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "trigger_ability",
    label: `The Shell Traders: ${target.title}`,
    source,
    timingPoint: "runner_action.main",
    costs:
      payload.delayedInstallAbility === "set_aside_from_grip"
        ? [{ clicks: 1 }]
        : [{ credits: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 7,
    payload: {
      cardId: source,
      sourceDefinitionId: "onr_v1_176_the-shell-traders",
      targetCardId: target.instanceId,
      targetCardDefinitionId: target.definitionId!,
      ...payload,
    },
  };
}

function shellTraders(): VisibleCard {
  return card("shell-source", "onr_v1_176_the-shell-traders", "resource", {
    installCost: 0,
  });
}

function card(
  instanceId: string,
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
  extra: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    definitionId,
    known: true,
    title: definitionId,
    type,
    owner:
      type === "identity" && definitionId.startsWith("corp")
        ? "corp"
        : "runner",
    controller:
      type === "identity" && definitionId.startsWith("corp")
        ? "corp"
        : "runner",
    ...extra,
  };
}
