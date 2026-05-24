import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  handleHiddenZoneSearchChoice,
  type HiddenZoneSearchChoiceHandlerHost,
} from "./search-choice-handlers";
import { handleMysteryBoxTopFiveProgramInstallActivation } from "./search-choice-activations";

const programId = "program_1" as CardInstanceId;
const secondProgramId = "program_2" as CardInstanceId;
const hardwareId = "hardware_1" as CardInstanceId;
const sourceCardId = "source_card" as CardInstanceId;
const sourceDefinitionId = "source_definition" as CardDefinitionId;
const selfModifyingCodeId =
  "onr_v1_059_self-modifying-code" as CardDefinitionId;
const aujourdOuiId = "onr_v1_089_aujourd-oui" as CardDefinitionId;
const shortCircuitId = "onr_v1_096_the-short-circuit" as CardDefinitionId;

function definition(
  id: CardDefinitionId,
  type: CardDefinition["type"],
  extra: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id,
    title: id,
    side: type === "agenda" || type === "asset" || type === "ice" || type === "operation" || type === "upgrade"
      ? "corp"
      : "runner",
    type,
    ...extra,
  } as CardDefinition;
}

function choice(input: {
  source: string;
  options?: ChoiceRequest["options"];
}): ChoiceRequest {
  return {
    choiceId: "choice_1",
    side: "runner",
    source: input.source,
    prompt: "Choice",
    kind: "select_cards",
    options: input.options ?? [
      { id: `card_${programId}`, label: "Program", value: programId },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 1,
    visibility: "hidden_info_barrier",
  };
}

function playerAction(...optionIds: string[]): PlayerAction {
  return {
    actionId: "choice",
    type: "resolve_choice",
    side: "runner",
    selectedChoices: { selectedOptionIds: optionIds },
  } as unknown as PlayerAction;
}

function host(
  selectedChoice: ChoiceRequest,
  selectedPlayerAction: PlayerAction,
  overrides: {
    stack?: CardInstanceId[];
    heap?: CardInstanceId[];
    credits?: number;
    definitions?: Record<string, CardDefinition>;
    canInstall?: (cardId: CardInstanceId) => boolean;
    installFromStack?: (cardId: CardInstanceId) => boolean;
    installForFree?: (cardId: CardInstanceId) => CardInstanceId;
  } = {},
): HiddenZoneSearchChoiceHandlerHost {
  const definitions = {
    [programId]: definition("program_definition" as CardDefinitionId, "program", {
      installCost: 1,
      memoryCost: 1,
    }),
    [secondProgramId]: definition("second_program_definition" as CardDefinitionId, "program", {
      installCost: 1,
      memoryCost: 1,
    }),
    [hardwareId]: definition("hardware_definition" as CardDefinitionId, "hardware"),
    [sourceCardId]: definition(sourceDefinitionId, "resource"),
    ...overrides.definitions,
  };
  const runner = {
    stack: overrides.stack ?? [programId],
    heap: overrides.heap ?? [],
    grip: [] as CardInstanceId[],
    credits: overrides.credits ?? 5,
    memoryUsed: 0,
    rig: {
      programs: [sourceCardId],
      resources: [sourceCardId],
      hardware: [],
    },
  };
  const cardInstances: Record<CardInstanceId, any> = {};
  for (const cardId of [
    ...runner.stack,
      ...runner.heap,
      hardwareId,
      ...runner.rig.programs,
    ...runner.rig.resources,
  ]) {
    cardInstances[cardId] = {
      id: cardId,
      owner: "runner",
      definitionId: definitions[cardId]?.id ?? sourceDefinitionId,
      zone: { side: "runner", zone: "stack" },
      faceup: true,
      rezzed: true,
    };
  }
  const legalAction = {
    actionId: "choice",
    type: "resolve_choice",
    side: "runner",
    payload: {},
  } as LegalAction;
  const shuffles: string[] = [];
  const trashed: CardInstanceId[] = [];
  return {
    choice: selectedChoice,
    playerAction: selectedPlayerAction,
    legalAction,
    state: {
      runner: runner as unknown as HiddenZoneSearchChoiceHandlerHost["state"]["runner"],
      cardInstances,
      stateVersion: 1,
      randomCounter: 0,
      run: {
        runId: "run-1",
        phase: "movement",
      } as unknown as NonNullable<HiddenZoneSearchChoiceHandlerHost["state"]["run"]>,
    },
    constants: {
      aujourdOuiResourceCardId: aujourdOuiId,
      mysteryBoxId: "mystery_box" as CardDefinitionId,
      selfModifyingCodeId,
      shortCircuitResourceCardId: shortCircuitId,
      sneakPreviewId: "sneak_preview" as CardDefinitionId,
    },
    cards: {
      definitionFor: (cardId) => {
        const cardDefinition = definitions[cardId];
        if (!cardDefinition) throw new Error(`Definition fehlt: ${cardId}`);
        return cardDefinition;
      },
      isUniqueRunnerDefinitionInstalled: () => false,
      runnerProgramUsesMemory: () => true,
    },
    zones: {
      removeFromAllZones: (cardId) => {
        runner.stack = runner.stack.filter((id) => id !== cardId);
        runner.heap = runner.heap.filter((id) => id !== cardId);
        runner.grip = runner.grip.filter((id) => id !== cardId);
        runner.rig.programs = runner.rig.programs.filter((id) => id !== cardId);
        runner.rig.resources = runner.rig.resources.filter((id) => id !== cardId);
      },
      addToGrip: (cardId) => runner.grip.push(cardId),
      trashRunnerInstalledCardToHeap: (cardId) => trashed.push(cardId),
    },
    shuffleRunnerStack: (purpose) => shuffles.push(purpose),
    spendRunnerCredits: (amount) => {
      runner.credits -= amount;
    },
    installRunnerProgramFromStackWithoutClick:
      overrides.installFromStack ?? (() => true),
    startSelfModifyingCodeFreeMuChoice: () => false,
    availableRunnerProgramInstallCredits: () => 5,
    runnerMemoryLimit: () => 4,
    install: {
      canInstallRunnerProgramFromZone: (cardId) =>
        overrides.canInstall?.(cardId) ?? true,
      installRunnerProgramFromZoneWithoutClick: () => true,
      installRunnerProgramForFree: (cardId) =>
        overrides.installForFree?.(cardId) ?? cardId,
      searchStackInstallTargets: () => runner.stack,
      sneakPreviewInstallableProgramIds: (sourceZone) =>
        sourceZone === "heap" ? runner.heap : runner.stack,
      lookTopStackShowToCorpThenInstallMatchingTargets: () => runner.stack,
    },
  };
}

describe("hidden-zone search choice handlers", () => {
  it("handles stack search-to-grip choices and shuffles only stack searches", () => {
    const testHost = host(
      choice({ source: "v098.search_stack:1" }),
      playerAction(`card_${programId}`),
    );

    const result = handleHiddenZoneSearchChoice(testHost);

    expect(result).toMatchObject({
      handled: true,
      deletePendingChoice: true,
      shufflePerformed: true,
      movedCardIds: [programId],
    });
    expect(testHost.state.runner.grip).toEqual([programId]);
    expect(testHost.legalAction.payload).toMatchObject({
      hiddenZoneAction: "search_stack",
      searchDestination: "runner_grip",
      shuffled: true,
    });
  });

  it("handles trash search-to-grip choices without stack shuffle", () => {
    const testHost = host(
      choice({
        source: `p3_37.search_trash_to_grip:${sourceCardId}:${sourceDefinitionId}:program:reveal:no_shuffle`,
      }),
      playerAction(`card_${programId}`),
      {
        stack: [],
        heap: [programId],
      },
    );

    const result = handleHiddenZoneSearchChoice(testHost);

    expect(result).toMatchObject({
      handled: true,
      deletePendingChoice: true,
      shufflePerformed: false,
      movedCardIds: [programId],
    });
    expect(testHost.state.runner.grip).toEqual([programId]);
    expect(testHost.legalAction.payload).toMatchObject({
      hiddenZoneAction: "p3_37_search_trash_to_grip",
      searchedZone: "runner_heap",
      publicRevealKind: "reveal",
    });
  });

  it("handles top-N take-matching choices without performing payment outside the handler", () => {
    const testHost = host(
      choice({
        source: `p3_37.look_top_stack_take_matching:${sourceCardId}:${sourceDefinitionId}:2:program:1:reveal:shuffle`,
        options: [
          { id: `card_${programId}`, label: "Program", value: programId },
          { id: `card_${secondProgramId}`, label: "Program 2", value: secondProgramId },
        ],
      }),
      playerAction(`card_${programId}`),
      {
        stack: [programId, secondProgramId],
      },
    );

    const result = handleHiddenZoneSearchChoice(testHost);

    expect(result).toMatchObject({
      handled: true,
      deletePendingChoice: true,
      shufflePerformed: true,
      movedCardIds: [programId],
    });
    expect(testHost.state.runner.credits).toBe(4);
    expect(testHost.legalAction.payload).toMatchObject({
      hiddenZoneAction: "p3_37_look_top_stack_take_matching",
      paidCredits: 1,
      runnerCreditsAfter: 4,
    });
  });

  it("handles Self-Modifying Code stack install choices through the install callback", () => {
    const installed: CardInstanceId[] = [];
    const testHost = host(
      choice({
        source: `v1911.self_modifying_code_install_program:${sourceCardId}:1`,
      }),
      playerAction(`card_${programId}`),
      {
        installFromStack: (cardId) => {
          installed.push(cardId);
          return true;
        },
      },
    );

    const result = handleHiddenZoneSearchChoice(testHost);

    expect(result).toMatchObject({
      handled: true,
      deletePendingChoice: true,
      shufflePerformed: true,
      installedCardId: programId,
    });
    expect(installed).toEqual([programId]);
    expect(testHost.legalAction.payload).toMatchObject({
      hiddenZoneAction: "self_modifying_code_install_program",
      installed: true,
      searchDestination: "runner_rig",
    });
  });

  it("handles Sneak Preview source choices by opening a program choice", () => {
    const testHost = host(
      choice({
        source: "v1911.sneak_preview_source:1",
        options: [{ id: "source_stack", label: "Stack", value: "stack" }],
      }),
      playerAction("source_stack"),
    );

    const result = handleHiddenZoneSearchChoice(testHost);

    expect(result).toMatchObject({
      handled: true,
      stateChanged: true,
    });
    expect(testHost.state.pendingChoice?.source).toContain(
      "v1911.sneak_preview_stack_install",
    );
    expect(testHost.legalAction.payload).toMatchObject({
      hiddenZoneAction: "sneak_preview_source_selected",
      choiceVisibility: "runner_private",
    });
  });

  it("handles Sneak Preview program choices with free install and temporary return", () => {
    const installed: CardInstanceId[] = [];
    const testHost = host(
      choice({
        source: "v1911.sneak_preview_stack_install:1",
      }),
      playerAction(`card_${programId}`),
      {
        installForFree: (cardId) => {
          installed.push(cardId);
          return cardId;
        },
      },
    );

    const result = handleHiddenZoneSearchChoice(testHost);

    expect(result).toMatchObject({
      handled: true,
      deletePendingChoice: true,
      shufflePerformed: true,
      installedCardId: programId,
    });
    expect(installed).toEqual([programId]);
    expect(testHost.state.sneakPreviewTemporaryInstalls).toEqual([
      { cardId: programId, sourceCardDefinitionId: "sneak_preview" },
    ]);
    expect(testHost.legalAction.payload).toMatchObject({
      hiddenZoneAction: "sneak_preview_program_install",
      temporaryInstall: true,
      publicRevealKind: "reveal",
    });
  });

  it("handles Mystery Box activation no-install path", () => {
    const testHost = host(
      choice({ source: "unused" }),
      playerAction(),
      {
        stack: [hardwareId],
        definitions: {
          [sourceCardId]: definition("mystery_box" as CardDefinitionId, "program"),
        },
      },
    );
    testHost.legalAction.payload = { cardId: sourceCardId };

    const result = handleMysteryBoxTopFiveProgramInstallActivation(testHost);

    expect(result).toMatchObject({
      handled: true,
      shufflePerformed: true,
    });
    expect(testHost.legalAction.payload).toMatchObject({
      programFound: false,
      installedProgramCount: 0,
      selfTrashed: false,
      randomCounterAfter: 0,
    });
  });

  it("handles Mystery Box install choices with source-trash metadata", () => {
    const installed: CardInstanceId[] = [];
    const testHost = host(
      choice({
        source: `v1915.mystery_box:${sourceCardId}:${programId}:1`,
      }),
      playerAction(`card_${programId}`),
      {
        definitions: {
          [sourceCardId]: definition("mystery_box" as CardDefinitionId, "program"),
        },
        installForFree: (cardId) => {
          installed.push(cardId);
          return cardId;
        },
      },
    );

    const result = handleHiddenZoneSearchChoice(testHost);

    expect(result).toMatchObject({
      handled: true,
      deletePendingChoice: true,
      shufflePerformed: true,
      installedCardId: programId,
      sourceTrashCardIds: [sourceCardId],
    });
    expect(installed).toEqual([programId]);
    expect(testHost.legalAction.payload).toMatchObject({
      hiddenZoneAction: "mystery_box_program_install",
      installedProgramDefinitionId: "program_definition",
      installedProgramCount: 1,
      selfTrashed: true,
    });
  });

  it("handles p3_38 stack install choices", () => {
    const testHost = host(
      choice({
        source: `p3_38.search_stack_install:${sourceCardId}:${sourceDefinitionId}:program:free:shuffle`,
      }),
      playerAction(`card_${programId}`),
    );

    const result = handleHiddenZoneSearchChoice(testHost);

    expect(result).toMatchObject({
      handled: true,
      deletePendingChoice: true,
      shufflePerformed: true,
      installedCardId: programId,
    });
    expect(testHost.legalAction.payload).toMatchObject({
      hiddenZoneAction: "p3_38_search_stack_install",
      searchDestination: "runner_rig",
      installedProgramCount: 1,
    });
  });

  it("rejects invalid search selections", () => {
    const testHost = host(
      choice({ source: "v098.search_stack:1" }),
      playerAction("card_missing"),
    );

    expect(() => handleHiddenZoneSearchChoice(testHost)).toThrow(
      "Die gewaehlte Kartenoption ist ungueltig.",
    );
  });
});
