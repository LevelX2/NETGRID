import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";
import {
  assessShellTradersRigReplacement,
  buildRunnerShellTradersPipelineSignals,
} from "./shell-traders-plan-signals";

describe("runner Shell Traders pipeline signals", () => {
  it("reserves memory only for programs actually staged by Shell Traders", () => {
    const source = shellTraders();
    const target = card("dwarf-new", 233, "program", {
      installCost: 3,
      memoryCost: 1,
    });
    const otherSetAside = card("dwarf-set-aside", 233, "program", {
      memoryCost: 1,
    });
    const action = shellAction("prepare-dwarf", source.instanceId, target, {
      delayedInstallAbility: "set_aside_from_grip",
      shellCounterAmount: 3,
    });
    const input = runnerInput([action], {
      grip: [target],
      rig: [source],
      setAside: [otherSetAside],
      memoryLimit: 4,
      memoryUsed: 3,
    });
    expect(signals(input, [coverageGap("wall-gap", "breaker_wall")])).toEqual([
      expect.objectContaining({ phase: "prepare", freeMemory: 1 }),
    ]);
  });

  it("stays completely inactive without an installed Shell Traders source", () => {
    const target = card("dwarf", 233, "program", {
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
    const target = card("dwarf", 233, "program", {
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
        priorityClass: "P5",
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
      228,
      "program",
      {
        installCost: 4,
        memoryCost: 1,
        counters: { shell: 1 },
      },
    );
    const dwarf = card("dwarf-installed", 233, "program", {
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
        rejectedActions: [
          {
            actionId: "remove-last-cyfermaster",
            evidenceCode: "runner_shell_traders_holds_harmful_completion",
          },
        ],
        replacementAssessment: expect.objectContaining({
          status: "harmful",
          selectedProgramInstanceIds: ["dwarf-installed"],
        }),
      }),
    ]);
  });

  it("keeps a viable same-role replacement but holds payment without a quoted access path", () => {
    const source = shellTraders();
    const prepared = card("dwarf-new", 233, "program", {
      installCost: 3,
      memoryCost: 1,
      counters: { shell: 1 },
    });
    const oldDwarf = card("dwarf-old", 233, "program", {
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
        phase: "hold",
        actionIds: [],
        priorityClass: "P5",
        accessAssessment: expect.objectContaining({ status: "unknown" }),
        replacementAssessment: expect.objectContaining({
          status: "available",
          selectedProgramInstanceIds: ["dwarf-old"],
        }),
      }),
    ]);
  });

  it("chooses the minimum-displacement memory combination instead of a greedy prefix", () => {
    const target = card("dwarf-new", 233, "program", {
      memoryCost: 2,
    });
    const decoder = card("decoder-wide", 591, "program", {
      memoryCost: 2,
    });
    const firstDwarf = card("dwarf-small-a", 233, "program", {
      memoryCost: 1,
    });
    const secondDwarf = card("dwarf-small-b", 233, "program", {
      memoryCost: 1,
    });
    const gap = coverageGap("wall-gap", "breaker_wall", "remote_2", "P2");
    const input = runnerInput([], {
      rig: [shellTraders(), firstDwarf, secondDwarf, decoder],
      memoryLimit: 4,
      memoryUsed: 4,
    });

    expect(
      assessShellTradersRigReplacement({
        input,
        targetCard: target,
        targetRoles: ["breaker_wall"],
        targetValue: 500,
        targetMemoryCost: 2,
        freeMemory: 0,
        coverageGaps: [gap],
        coverageBinding: gap,
      }),
    ).toEqual({
      status: "available",
      requiredMemory: 2,
      selectedProgramInstanceIds: ["decoder-wide"],
      freedMemory: 2,
      displacedValue: 260,
    });
  });

  it("adds doctrine evidence only for an exact required provider near overflow", () => {
    const source = shellTraders();
    const target = card("dwarf", 233, "program", {
      installCost: 3,
      memoryCost: 1,
    });
    const action = shellAction("prepare-dwarf", source.instanceId, target, {
      delayedInstallAbility: "set_aside_from_grip",
      shellCounterAmount: 3,
    });
    const input = runnerInput([action], {
      grip: [
        target,
        card("buffer-1", "test-buffer-1", "event"),
        card("buffer-2", "test-buffer-2", "event"),
        card("buffer-3", "test-buffer-3", "event"),
      ],
      rig: [source],
    });

    expect(
      signals(
        input,
        [coverageGap("wall-gap", "breaker_wall")],
        shellDoctrineIntent(233),
      ),
    ).toEqual([
      expect.objectContaining({
        phase: "prepare",
        evidenceCodes: expect.arrayContaining([
          "runner_engine_doctrine:stage_before_overflow_draw",
          "runner_engine_owner:runner.shell_traders_pipeline",
        ]),
      }),
    ]);
  });

  it("prepares a useful non-coverage target at full hand capacity", () => {
    const source = shellTraders();
    const target = card(
      "rd-interface",
      351,
      "hardware",
      { installCost: 4 },
    );
    const action = shellAction(
      "prepare-rd-interface",
      source.instanceId,
      target,
      {
        delayedInstallAbility: "set_aside_from_grip",
        shellCounterAmount: 4,
      },
    );
    const input = runnerInput([action], {
      grip: [
        target,
        card("buffer-1", "test-buffer-1", "event"),
        card("buffer-2", "test-buffer-2", "event"),
        card("buffer-3", "test-buffer-3", "event"),
        card("buffer-4", "test-buffer-4", "event"),
      ],
      rig: [source],
    });

    expect(signals(input, [])).toEqual([
      expect.objectContaining({
        phase: "prepare",
        priorityClass: "P4",
        actionIds: ["prepare-rd-interface"],
        evidenceCodes: expect.arrayContaining([
          "runner_shell_traders_prepares_useful_target_at_hand_capacity",
        ]),
      }),
    ]);
  });

  it("rejects a zero-counter preparation that can never reach a last-counter removal", () => {
    const source = shellTraders();
    const target = card(
      "zero-cost-program",
      247,
      "program",
      {
        installCost: 0,
        memoryCost: 1,
      },
    );
    const action = shellAction(
      "prepare-zero-cost-program",
      source.instanceId,
      target,
      {
        delayedInstallAbility: "set_aside_from_grip",
        shellCounterAmount: 0,
      },
    );
    const input = runnerInput([action], {
      grip: [target],
      rig: [source],
    });

    expect(signals(input, [])).toEqual([
      expect.objectContaining({
        phase: "hold",
        actionIds: [],
        rejectedActions: [
          {
            actionId: "prepare-zero-cost-program",
            evidenceCode:
              "runner_shell_traders_rejected_zero_counter_preparation",
          },
        ],
        evidenceCodes: expect.arrayContaining([
          "runner_shell_traders_rejected_zero_counter_preparation",
        ]),
      }),
    ]);
  });
});

function signals(
  input: AiDecisionInput,
  coverageGaps: RunnerCoverageGapSignal[],
  strategicIntent?: RunnerStrategicIntentProfile,
) {
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      "shell-source": 388,
    },
  });
  return buildRunnerShellTradersPipelineSignals({
    input,
    candidates,
    coverageGaps,
    handDevelopment: [],
    ...(strategicIntent ? { strategicIntent } : {}),
  });
}

function shellDoctrineIntent(
  targetDefinitionId: number,
): RunnerStrategicIntentProfile {
  return {
    schemaVersion: "runner-strategic-intent-profile-v1",
    side: "runner",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      plannerEffect: "runtime_projection",
    },
    primaryWinIntent: "runner.steal_agendas_default",
    setupEngine: ["runner.rig_first"],
    engineProviders: [
      {
        providerId: `runner.provider:${targetDefinitionId}`,
        cardId: targetDefinitionId,
        copies: 1,
        capabilities: ["runner.coverage.breaker"],
        supportCapabilities: [],
        persistence: "persistent",
        additivity: "distinct_provider_first",
        compatibleDemandIds: [],
        evidence: [],
      },
    ],
    engineLineIds: ["runner.engine.delayed_install"],
    developmentTendencies: [
      {
        tendencyId: "runner.development.stage_before_overflow_draw",
        strength: "high",
        ownerModuleId: "runner.shell_traders_pipeline",
        dependencyIds: ["runner.dependency.breaker_coverage"],
        exitConditionIds: ["no_stageable_required_provider"],
        evidence: [],
      },
    ],
    pressureVectors: [],
    riskProfile: [],
    rejectedIntents: [],
    confidence: "high",
    evidence: [],
  };
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
        identity: card("runner-identity", 587, "identity"),
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
        identity: card("corp-identity", 3, "identity"),
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
      sourceDefinitionId: 388,
      targetCardId: target.instanceId,
      targetCardDefinitionId: target.definitionId!,
      ...payload,
    },
  };
}

function shellTraders(): VisibleCard {
  return card("shell-source", 388, "resource", {
    installCost: 0,
  });
}

function card(
  instanceId: string,
  definitionId: number,
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

describe("Shell Traders hosted-program displacement", () => {
  it("counts actual host losses while daemon children provide no selectable MU", () => {
    const host = card("afreet", 213, "program", {
      memoryCost: 1,
    });
    const wall = card("wall", 259, "program", {
      memoryCost: 1,
      hostedOn: host.instanceId,
    });
    const filler = card(
      "installer",
      287,
      "program",
      { memoryCost: 1 },
    );
    const target = card("target", 228, "program", {
      memoryCost: 1,
    });
    const gap = coverageGap("wall-gap", "breaker_wall", "remote_1", "P2");
    const result = assessShellTradersRigReplacement({
      input: runnerInput([], {
        rig: [host, wall, filler],
        memoryUsed: 2,
        memoryLimit: 2,
      }),
      targetCard: target,
      targetRoles: ["breaker_gate"],
      targetValue: 500,
      targetMemoryCost: 1,
      freeMemory: 0,
      coverageGaps: [gap],
      coverageBinding: undefined,
    });
    expect(result).toMatchObject({
      status: "available",
      selectedProgramInstanceIds: [filler.instanceId],
      freedMemory: 1,
    });
    const withoutFiller = assessShellTradersRigReplacement({
      input: runnerInput([], {
        rig: [host, wall],
        memoryUsed: 1,
        memoryLimit: 1,
      }),
      targetCard: target,
      targetRoles: ["breaker_gate"],
      targetValue: 500,
      targetMemoryCost: 1,
      freeMemory: 0,
      coverageGaps: [gap],
      coverageBinding: undefined,
    });
    expect(withoutFiller).toMatchObject({
      status: "harmful",
      selectedProgramInstanceIds: [host.instanceId],
      freedMemory: 1,
    });
    expect(withoutFiller.displacedValue).toBeGreaterThanOrEqual(1000);
  });
});
