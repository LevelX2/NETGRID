import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  handleTopFiveProgramInstallActivation,
  searchStackInstallTargets,
  searchStackToGripTargets,
  searchTrashToGripTargets,
  temporaryProgramInstallSourceOptions,
  startLookTopStackShowToCorpThenInstallMatchingActivation,
  startLookTopStackTakeMatchingActivation,
  startSearchStackInstallActivation,
  startSearchStackToGripActivation,
  startSearchTrashToGripActivation,
  startTemporaryProgramInstallSourceActivation,
  type HiddenZoneSearchActivationHost,
} from "./search-choice-activations";

const sourceCardId = "source" as CardInstanceId;
const sourceDefinitionId = "source_def" as CardDefinitionId;

function card(
  id: string,
  type: CardDefinition["type"],
  title = id,
  memoryCost = 0,
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    title,
    type,
    memoryCost,
  } as CardDefinition;
}

function makeHost(
  input: {
    stack?: CardInstanceId[];
    heap?: CardInstanceId[];
    definitions?: Record<string, CardDefinition>;
    credits?: number;
    rigPrograms?: CardInstanceId[];
    canInstallIds?: CardInstanceId[];
    run?: NonNullable<HiddenZoneSearchActivationHost["state"]["run"]>;
  } = {},
): HiddenZoneSearchActivationHost {
  const definitions = input.definitions ?? {};
  const canInstallIds = new Set(input.canInstallIds ?? []);
  return {
    legalAction: {
      side: "runner",
      payload: { cardId: sourceCardId },
    } as unknown as LegalAction,
    state: {
      stateVersion: 10,
      pendingChoice: undefined,
      randomCounter: 3,
      run: input.run,
      runner: {
        stack: input.stack ?? [],
        heap: input.heap ?? [],
        grip: [],
        credits: input.credits ?? 5,
        memoryUsed: 0,
        rig: {
          programs: input.rigPrograms ?? [],
          hardware: [],
          resources: [sourceCardId],
        },
      },
    } as unknown as HiddenZoneSearchActivationHost["state"],
    constants: {
      topStackTakeMatchingSourceId: "aujourd" as CardDefinitionId,
      randomStackProgramInstallSourceId: "mystery_box" as CardDefinitionId,
      stackProgramFreeInstallSourceId: "smc" as CardDefinitionId,
      stackSearchGripSourceId: "short_circuit" as CardDefinitionId,
      temporaryProgramInstallSourceId: "sneak_preview" as CardDefinitionId,
    },
    cards: {
      definitionFor: (cardId) => definitions[cardId] ?? card(cardId, "program"),
      isUniqueRunnerDefinitionInstalled: () => false,
    },
    install: {
      canInstallRunnerProgramFromZone: (cardId) => canInstallIds.has(cardId),
    },
    runnerMemoryLimit: () => 4,
    shuffleRunnerStack: () => undefined,
  };
}

describe("hidden-zone search choice activations", () => {
  it("builds p3_37 search-to-grip pending choices with stable payload markers", () => {
    const stackProgram = "stack_program" as CardInstanceId;
    const stackResource = "stack_resource" as CardInstanceId;
    const heapProgram = "heap_program" as CardInstanceId;
    const host = makeHost({
      stack: [stackProgram, stackResource],
      heap: [heapProgram],
      definitions: {
        [stackProgram]: card("stack_program_def", "program", "Stack Program"),
        [stackResource]: card(
          "stack_resource_def",
          "resource",
          "Stack Resource",
        ),
        [heapProgram]: card("heap_program_def", "program", "Heap Program"),
      },
    });

    expect(searchStackToGripTargets(host, "program")).toEqual([stackProgram]);
    const stackResult = startSearchStackToGripActivation(host, {
      sourceCardId,
      sourceDefinitionId,
      filter: "program",
      revealToCorp: true,
      shuffleAfterwards: true,
    });
    expect(host.state.pendingChoice?.choiceId).toBe(
      "p3_37_search_stack_to_grip_11",
    );
    expect(host.state.pendingChoice?.source).toBe(
      "p3_37.search_stack_to_grip:source:source_def:program:reveal:shuffle:11",
    );
    expect(stackResult.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_search_stack_to_grip",
      searchedZone: "runner_stack",
      searchRevealToCorp: true,
    });

    delete host.state.pendingChoice;
    expect(searchTrashToGripTargets(host, "program")).toEqual([heapProgram]);
    const trashResult = startSearchTrashToGripActivation(host, {
      sourceCardId,
      sourceDefinitionId,
      filter: "program",
    });
    expect(
      (host.state.pendingChoice as unknown as { choiceId: string }).choiceId,
    ).toBe("p3_37_search_trash_to_grip_11");
    expect(trashResult.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_search_trash_to_grip",
      searchedZone: "runner_heap",
      searchFilter: "program",
    });
  });

  it("builds top-n take matching activation with stable cost and reveal metadata", () => {
    const program = "program" as CardInstanceId;
    const resource = "resource" as CardInstanceId;
    const host = makeHost({
      stack: [program, resource],
      definitions: {
        [program]: card("program_def", "program", "Program"),
        [resource]: card("resource_def", "resource", "Resource"),
      },
      credits: 1,
    });

    const result = startLookTopStackTakeMatchingActivation(host, {
      sourceCardId,
      sourceDefinitionId,
      count: 5,
      allowedTypes: ["program"],
      costPerTaken: 1,
      revealTakenToCorp: true,
      shuffleRemainder: true,
    });

    expect(host.state.pendingChoice?.choiceId).toBe(
      "p3_37_look_top_stack_take_matching_11",
    );
    expect(host.state.pendingChoice?.maxSelections).toBe(1);
    expect(host.state.pendingChoice?.options[1]).toMatchObject({
      value: resource,
      selectable: false,
    });
    expect(result.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_look_top_stack_take_matching",
      privateLookCount: 2,
      costPerTaken: 1,
    });
  });

  it("builds p3_38 search stack install activation from installable candidates", () => {
    const installable = "installable" as CardInstanceId;
    const blocked = "blocked" as CardInstanceId;
    const host = makeHost({
      stack: [installable, blocked],
      canInstallIds: [installable],
      definitions: {
        [installable]: card("installable_def", "program", "Installable"),
        [blocked]: card("blocked_def", "program", "Blocked"),
      },
    });

    expect(searchStackInstallTargets(host, "program", "free")).toEqual([
      installable,
    ]);
    const result = startSearchStackInstallActivation(host, {
      sourceCardId,
      sourceDefinitionId,
      filter: "program",
      installCost: "free",
      shuffleAfterwards: true,
    });

    expect(host.state.pendingChoice?.choiceId).toBe(
      "p3_38_search_stack_install_11",
    );
    expect(host.state.pendingChoice?.options[1]).toMatchObject({
      value: blocked,
      selectable: false,
    });
    expect(result.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_38_search_stack_install",
      searchDestination: "install_program",
    });
  });

  it("starts p3_38 Mystery Box with a Corp review before Runner program choice", () => {
    const program = "program" as CardInstanceId;
    const resource = "resource" as CardInstanceId;
    const run = { runId: "run_1" };
    const host = makeHost({
      run: run as NonNullable<HiddenZoneSearchActivationHost["state"]["run"]>,
      stack: [program, resource],
      rigPrograms: [sourceCardId],
      canInstallIds: [program],
      definitions: {
        [sourceCardId]: card("mystery_box", "program", "Mystery Box"),
        [program]: card("program_def", "program", "Program"),
        [resource]: card("resource_def", "resource", "Resource"),
      },
    });

    const result = startLookTopStackShowToCorpThenInstallMatchingActivation(
      host,
      {
        sourceCardId,
        sourceDefinitionId,
        count: 5,
        allowedTypes: ["program"],
        installCost: "free",
        trashSourceIfInstalled: true,
        shuffleAfterwards: true,
      },
    );

    expect(result.publicPayload).toMatchObject({
      hiddenZoneAction:
        "p3_38_look_top_stack_show_to_corp_then_install_matching",
      revealCount: 2,
      programFound: true,
      choiceVisibility: "corp_review",
      shufflePerformed: false,
    });
    expect(host.state.pendingChoice).toMatchObject({
      choiceId: "p3_38_mystery_box_corp_review_11",
      side: "corp",
      source: `p3_38.mystery_box_corp_review:${sourceCardId}:${sourceDefinitionId}:${program},${resource}:11`,
      visibility: "public",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(
      host.state.pendingChoice?.options.map((option) => option.id),
    ).toEqual([`shown_${program}`, `shown_${resource}`, "done"]);
    expect(host.state.run?.successfulRunAbilityUsedSourceIds).toBeUndefined();
  });

  it("builds Sneak Preview source activation from heap and stack options", () => {
    const heapProgram = "heap_program" as CardInstanceId;
    const stackProgram = "stack_program" as CardInstanceId;
    const host = makeHost({
      stack: [stackProgram],
      heap: [heapProgram],
      definitions: {
        [heapProgram]: card("heap_program_def", "program", "Heap Program"),
        [stackProgram]: card("stack_program_def", "program", "Stack Program"),
      },
    });

    expect(
      temporaryProgramInstallSourceOptions(host).map((option) => option.value),
    ).toEqual(["heap", "stack"]);
    startTemporaryProgramInstallSourceActivation(host);

    expect(host.state.pendingChoice?.choiceId).toBe(
      "v1911_sneak_preview_source_11",
    );
    expect(host.state.pendingChoice?.source).toBe(
      "v1911.sneak_preview_source:11",
    );
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "temporary_program_install_source_choice",
      choiceVisibility: "runner_private",
    });
  });

  it("starts Mystery Box public install choice without changing payload fields", () => {
    const program = "program" as CardInstanceId;
    const resource = "resource" as CardInstanceId;
    const run = { runId: "run_1" };
    const host = makeHost({
      run: run as NonNullable<HiddenZoneSearchActivationHost["state"]["run"]>,
      stack: [program, resource],
      rigPrograms: [sourceCardId],
      definitions: {
        [sourceCardId]: card("mystery_box", "program", "Mystery Box"),
        [program]: card("program_def", "program", "Program"),
        [resource]: card("resource_def", "resource", "Resource"),
      },
    });

    const result = handleTopFiveProgramInstallActivation(host);

    expect(result.handled).toBe(true);
    expect(host.state.pendingChoice?.choiceId).toBe("v1915_mystery_box_11");
    expect(host.state.pendingChoice?.visibility).toBe("public");
    expect(host.legalAction.payload).toMatchObject({
      cardId: sourceCardId,
      programFound: true,
      choiceVisibility: "public",
    });
    expect(host.state.run?.hiddenStackInstallUsedSourceIdsThisRun).toEqual([
      sourceCardId,
    ]);
  });
});
