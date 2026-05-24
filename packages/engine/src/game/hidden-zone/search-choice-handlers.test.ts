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

const programId = "program_1" as CardInstanceId;
const secondProgramId = "program_2" as CardInstanceId;
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
    installFromStack?: (cardId: CardInstanceId) => boolean;
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
    },
    constants: {
      aujourdOuiResourceCardId: aujourdOuiId,
      selfModifyingCodeId,
      shortCircuitResourceCardId: shortCircuitId,
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
