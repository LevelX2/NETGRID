import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createHiddenZoneCardImplementationRuntimeDeps,
  type HiddenZoneRuntimeDepsHost,
} from "./hidden-zone-runtime-deps";

const sourceCardId = "source" as CardInstanceId;
const sourceDefinitionId = "source_def" as CardDefinitionId;

function card(
  id: string,
  type: CardDefinition["type"],
  title = id,
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    title,
    type,
  } as CardDefinition;
}

function state(input: {
  stack?: CardInstanceId[];
  heap?: CardInstanceId[];
  grip?: CardInstanceId[];
  credits?: number;
} = {}): GameState {
  return {
    stateVersion: 10,
    pendingChoice: undefined,
    randomCounter: 0,
    run: undefined,
    runner: {
      credits: input.credits ?? 5,
      clicks: 1,
      tags: 0,
      stack: input.stack ?? [],
      grip: input.grip ?? [],
      heap: input.heap ?? [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
      memoryUsed: 0,
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [],
    },
    cardInstances: {},
    eventLog: [],
  } as unknown as GameState;
}

function action(payload: LegalAction["payload"] = {}): LegalAction {
  return {
    actionId: "trigger_ability:source",
    id: "trigger_ability:source",
    side: "runner",
    timingPoint: "runner_action.main",
    type: "trigger_ability",
    label: "Trigger",
    source: sourceCardId,
    payload,
    costs: [],
    targetRequirements: [],
  } as unknown as LegalAction;
}

function host(input: {
  definitions?: Record<string, CardDefinition>;
  canInstallIds?: CardInstanceId[];
  privateLookCalls?: unknown[][];
  exposeTargetIds?: CardInstanceId[];
} = {}): HiddenZoneRuntimeDepsHost {
  const definitions = input.definitions ?? {};
  const canInstallIds = new Set(input.canInstallIds ?? []);
  const exposeTargetIds = input.exposeTargetIds ?? [];
  const searchTargetHost = (gameState: GameState) => ({
    state: gameState,
    constants: {
      topStackTakeMatchingSourceId: "aujourd" as CardDefinitionId,
      randomStackProgramInstallSourceId: "mystery" as CardDefinitionId,
      stackProgramFreeInstallSourceId: "smc" as CardDefinitionId,
      stackSearchGripSourceId: "short_circuit" as CardDefinitionId,
      temporaryProgramInstallSourceId: "sneak_preview" as CardDefinitionId,
    },
    cards: {
      definitionFor: (cardId: CardInstanceId) =>
        definitions[cardId] ?? card(`${cardId}_def`, "program", String(cardId)),
      isUniqueRunnerDefinitionInstalled: () => false,
    },
    install: {
      canInstallRunnerProgramFromZone: (cardId: CardInstanceId) =>
        canInstallIds.has(cardId),
    },
    runnerMemoryLimit: () => 4,
    shuffleRunnerStack: () => undefined,
  });
  const searchHandlerHost = (gameState: GameState, legalAction: LegalAction) => ({
    ...searchTargetHost(gameState),
    legalAction,
  });

  return {
    cards: {
      runnerInstalledCardIds: () => ["installed" as CardInstanceId],
      topRunnerHeapCardId: (gameState) => gameState.runner.heap[0],
    },
    hiddenZone: {
      searchActivationTargetHost: (gameState) => searchTargetHost(gameState),
      searchActivationHandlerHost: (gameState, legalAction) =>
        searchHandlerHost(gameState, legalAction),
      arrangeChoiceHandlerHost: () => ({} as never),
      nonSearchChoiceHandlerHost: () => ({} as never),
      corpZoneChoiceHandlerHost: () => ({} as never),
    },
    callbacks: {
      startRunnerPrivateLookChoice: (...args) => {
        input.privateLookCalls?.push(args);
        return true;
      },
      exposeInstalledCorpCardTargets: () => exposeTargetIds,
      exposeInstalledCorpCard: (
        _state,
        legalAction,
        source,
        sourceDefinition,
        target,
      ) => {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          sourceCardId: source,
          sourceDefinitionId: sourceDefinition,
          exposedCardInstanceId: target,
        };
        return { publicPayload: legalAction.payload ?? {} };
      },
      startExposeInstalledCorpCardsChoice: (_state, legalAction) => ({
        publicPayload: legalAction.payload ?? {},
      }),
      exposeOutermostIceOfEachDataFort: (_state, legalAction) => ({
        publicPayload: legalAction.payload ?? {},
      }),
      outermostIceExposures: () => ["exposure"],
      shuffleGripTrashAndStackThenDrawForCardImplementation: (
        _state,
        legalAction,
      ) => ({
        publicPayload: legalAction.payload ?? {},
      }),
    },
  };
}

describe("hidden-zone card implementation runtime deps", () => {
  it("creates only the hidden-zone/search/expose runtime properties", () => {
    const deps = createHiddenZoneCardImplementationRuntimeDeps(host());
    const expected = [
      "exposeInstalledCorpCard",
      "exposeInstalledCorpCardTargets",
      "exposeOutermostIceEachDataFort",
      "lookTopStackShowToCorpThenInstallMatchingTargetCount",
      "lookTopStackTakeMatchingTargetCount",
      "moveTopTrashToGrip",
      "outermostIceEachDataFortExposeCount",
      "searchStackInstallTargetCount",
      "searchStackToGripTargetCount",
      "searchTrashToGripTargetCount",
      "shuffleGripTrashAndStackThenDraw",
      "stackOrTrashProgramInstallTargetCount",
      "startExposeInstalledCorpCardsChoice",
      "startLookTopStackShowToCorpThenInstallMatchingChoice",
      "startLookTopStackTakeMatchingChoice",
      "startLookTopStackTakeOneArrangeRestChoice",
      "startPrivateLook",
      "startSearchStackInstallChoice",
      "startSearchStackToGripChoice",
      "startSearchTrashToGripChoice",
      "startShowHqAgendasForCreditsChoice",
      "startStackOrTrashProgramInstallChoice",
      "startTrashCardsFromGripForCreditsChoice",
      "startTrashOwnInstalledCardsForCreditsChoice",
      "topTrashToGripTargetCount",
      "topTrashToGripTargetId",
      "trashGripCardTargetCount",
      "trashOwnInstalledCardTargetCount",
    ].sort();

    expect(Object.keys(deps).sort()).toEqual(expected);
  });

  it("delegates private look and expose callbacks with the existing parameters", () => {
    const gameState = state();
    const legalAction = action({ existing: true });
    const privateLookCalls: unknown[][] = [];
    const deps = createHiddenZoneCardImplementationRuntimeDeps(
      host({
        privateLookCalls,
        exposeTargetIds: ["target" as CardInstanceId],
      }),
    );

    expect(
      deps.startPrivateLook(
        gameState,
        legalAction,
        sourceCardId,
        sourceDefinitionId,
        "rd",
        2,
      ),
    ).toEqual({ publicPayload: { existing: true } });
    expect(privateLookCalls[0]).toEqual([
      gameState,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      "rd",
      2,
    ]);

    expect(deps.exposeInstalledCorpCardTargets(gameState, "any_installed")).toEqual([
      "target",
    ]);
    expect(
      deps.exposeInstalledCorpCard(
        gameState,
        legalAction,
        sourceCardId,
        sourceDefinitionId,
        "target" as CardInstanceId,
        "any_installed",
      ).publicPayload,
    ).toMatchObject({
      sourceCardId,
      sourceDefinitionId,
      exposedCardInstanceId: "target",
    });
  });

  it("preserves p3_37 search-to-grip choice construction through existing handlers", () => {
    const stackProgram = "stack_program" as CardInstanceId;
    const heapProgram = "heap_program" as CardInstanceId;
    const gameState = state({
      stack: [stackProgram],
      heap: [heapProgram],
    });
    const legalAction = action();
    const deps = createHiddenZoneCardImplementationRuntimeDeps(
      host({
        definitions: {
          [stackProgram]: card("stack_program_def", "program", "Stack Program"),
          [heapProgram]: card("heap_program_def", "program", "Heap Program"),
        },
      }),
    );

    expect(deps.searchStackToGripTargetCount(gameState, "program")).toBe(1);
    expect(deps.searchTrashToGripTargetCount(gameState, "program")).toBe(1);
    expect(deps.topTrashToGripTargetId(gameState)).toBe(heapProgram);

    const result = deps.startSearchTrashToGripChoice(
      gameState,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      "program",
    );

    expect(gameState.pendingChoice?.choiceId).toBe(
      "p3_37_search_trash_to_grip_11",
    );
    expect(gameState.pendingChoice?.source).toBe(
      "p3_37.search_trash_to_grip:source:source_def:program:11",
    );
    expect(result.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_search_trash_to_grip",
      searchedZone: "runner_heap",
      searchFilter: "program",
    });
  });

  it("preserves search-install target delegation without adding a payment engine", () => {
    const installable = "installable" as CardInstanceId;
    const blocked = "blocked" as CardInstanceId;
    const gameState = state({ stack: [installable, blocked] });
    const legalAction = action();
    const deps = createHiddenZoneCardImplementationRuntimeDeps(
      host({
        canInstallIds: [installable],
        definitions: {
          [installable]: card("installable_def", "program", "Installable"),
          [blocked]: card("blocked_def", "program", "Blocked"),
        },
      }),
    );

    expect(deps.searchStackInstallTargetCount(gameState, "program", "free")).toBe(
      1,
    );

    const result = deps.startSearchStackInstallChoice(
      gameState,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      "program",
      "free",
      true,
    );

    expect(gameState.pendingChoice?.choiceId).toBe(
      "p3_38_search_stack_install_11",
    );
    expect(gameState.pendingChoice?.options[1]).toMatchObject({
      value: blocked,
      selectable: false,
    });
    expect(result.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_38_search_stack_install",
      searchDestination: "install_program",
    });
  });

  it("does not import from the public engine index", () => {
    const source = readFileSync(
      new URL("./hidden-zone-runtime-deps.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });
});
