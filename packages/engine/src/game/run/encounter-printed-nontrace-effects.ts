import {
  type CardDefinition,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type SubroutineDefinition,
} from "@netgrid/shared";
import {
  ICE_PICK_WILLIE_ID,
  TOO_MANY_DOORS_ID,
} from "../../compatibility/runtime-compatibility";
import {
  appendResolvedSubroutineEffect,
  type EncounterResolutionHost,
  resolveRunDurationMarkerSubroutine,
} from "./encounter-resolution";

type ActiveRun = NonNullable<GameState["run"]>;
type SourceMetadata = {
  sourceCardId?: CardInstanceId;
  sourceDefinitionId: string;
  iceId?: CardInstanceId;
  subroutineId: string;
};

export type EncounterPrintedNonTraceHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
  };
  encounter: {
    resolutionHost: EncounterResolutionHost;
  };
  trash: {
    openRunnerInstalledTrashPreventionWindow: (
      targetCardIds: CardInstanceId[],
      source: string,
      legalAction: LegalAction,
    ) => boolean;
    trashRunnerInstalledProgram: (cardId: CardInstanceId) => void;
  };
  choices: {
    revealCorpRdTop: (legalAction: LegalAction) => void;
    startCorpRdArrangeChoice: (input: {
      sourceIceId: CardInstanceId;
      subroutineIndex: number;
      updatePayload: true;
    }) => void;
  };
};

export type EncounterPrintedNonTraceEffectResult = {
  handled: boolean;
  suspended?: boolean;
  sourceCardId?: CardInstanceId | undefined;
  sourceDefinitionId?: string | undefined;
  iceId?: CardInstanceId | undefined;
  subroutineId?: string | undefined;
  runShouldEnd?: boolean;
  stateChanged?: boolean | undefined;
};

export type DirectEndRunSubroutineResult =
  EncounterPrintedNonTraceEffectResult & {
    runShouldEnd: boolean;
    paidCredits?: number;
  };

export type DirectTrashProgramSubroutineResult =
  EncounterPrintedNonTraceEffectResult & {
    trashedCardIds: CardInstanceId[];
    programTrashPreventionWindowOpened?: boolean;
  };

export type DirectActionForgoSubroutineResult =
  EncounterPrintedNonTraceEffectResult & {
    runnerForgoNextActions: number;
  };

export type DirectRunLockSubroutineResult =
  EncounterPrintedNonTraceEffectResult & {
    cannotRunUntilActionsSpent: number;
  };

export type DirectNextIceLockSubroutineResult =
  EncounterPrintedNonTraceEffectResult & {
    nextIceCannotBreak: boolean;
    cannotJackOutUntilAfterEncounter?: boolean;
    setRunMarkers: string[];
  };

export type EncounterPrintedNonTraceResult =
  | EncounterPrintedNonTraceEffectResult
  | DirectEndRunSubroutineResult
  | DirectTrashProgramSubroutineResult
  | DirectActionForgoSubroutineResult
  | DirectRunLockSubroutineResult
  | DirectNextIceLockSubroutineResult;

export function encounterPrintedNonTraceHost(
  state: GameState,
  host: Omit<EncounterPrintedNonTraceHost, "state">,
): EncounterPrintedNonTraceHost {
  return { state, ...host };
}

export function resolveEncounterPrintedNonTraceEffect(
  host: EncounterPrintedNonTraceHost,
  options: {
    definition: CardDefinition;
    subroutine: SubroutineDefinition;
    subroutineIndex: number;
    legalAction?: LegalAction | undefined;
    paidPayOrEndRunIndexes?: ReadonlySet<number> | undefined;
    paidPayOrTrashProgramIndexes?: ReadonlySet<number> | undefined;
  },
): EncounterPrintedNonTraceResult {
  const { definition, subroutine, subroutineIndex, legalAction } = options;
  const run = mustRun(host.state);
  const source = sourceMetadata(run, definition, subroutine);

  if (subroutine.type === "corp_gain_credit") {
    host.state.corp.credits += subroutine.amount ?? 1;
    return { handled: true, ...source, stateChanged: true };
  }
  if (subroutine.type === "runner_lose_credits") {
    host.state.runner.credits = Math.max(
      0,
      host.state.runner.credits - (subroutine.amount ?? 1),
    );
    return { handled: true, ...source, stateChanged: true };
  }
  if (subroutine.type === "give_runner_tag") {
    host.state.runner.tags += subroutine.amount ?? 1;
    return { handled: true, ...source, stateChanged: true };
  }
  if (subroutine.type === "trash_installed_program") {
    return resolveDirectTrashProgramSubroutine(host, {
      definition,
      subroutine,
      subroutineIndex,
      legalAction,
    });
  }
  if (subroutine.type === "trash_installed_program_unless_runner_pays") {
    if (options.paidPayOrTrashProgramIndexes?.has(subroutineIndex)) {
      appendResolvedSubroutineEffect(
        legalAction,
        definition,
        subroutineIndex,
        subroutine,
        undefined,
        { paidCredits: Math.max(0, Math.floor(subroutine.amount ?? 0)), cardsTrashed: 0 },
      );
      return { handled: true, ...source, stateChanged: true };
    }
    return resolveDirectTrashProgramSubroutine(host, {
      definition,
      subroutine,
      subroutineIndex,
      legalAction,
    });
  }

  const markerResult = resolveRunDurationMarkerSubroutine(
    host.encounter.resolutionHost,
    { definition, subroutine, legalAction },
  );
  if (markerResult.handled) {
    if (subroutine.type === "set_runner_forgo_next_action") {
      return {
        handled: true,
        ...source,
        runnerForgoNextActions: 1,
        stateChanged: true,
      } satisfies DirectActionForgoSubroutineResult;
    }
    if (
      subroutine.type === "set_next_encounter_no_break_subroutines" ||
      subroutine.type === "set_next_encounter_lock"
    ) {
      return {
        handled: true,
        ...source,
        nextIceCannotBreak: true,
        ...(subroutine.type === "set_next_encounter_lock"
          ? { cannotJackOutUntilAfterEncounter: true }
          : {}),
        setRunMarkers: markerResult.setRunMarkers ?? [],
        stateChanged: markerResult.stateChanged,
      } satisfies DirectNextIceLockSubroutineResult;
    }
    return {
      handled: true,
      ...source,
      stateChanged: markerResult.stateChanged,
    };
  }

  if (subroutine.type === "set_runner_run_lock_actions")
    return resolveDirectRunLockSubroutine(host, {
      definition,
      subroutine,
      legalAction,
    });

  if (subroutine.type === "reveal_corp_rd_top")
    return resolveDirectCorpRdRevealSubroutine(host, {
      definition,
      legalAction,
      source,
    });

  if (subroutine.type === "reorder_corp_rd_top2")
    return resolveDirectCorpRdReorderSubroutine(host, {
      definition,
      subroutineIndex,
      legalAction,
      source,
    });

  if (
    subroutine.type === "end_the_run" ||
    subroutine.type === "end_the_run_and_trash_source_at_end_of_turn" ||
    subroutine.type === "end_the_run_unless_runner_pays"
  )
    return resolveDirectEndRunSubroutine(host, {
      definition,
      subroutine,
      subroutineIndex,
      legalAction,
      paidPayOrEndRunIndexes: options.paidPayOrEndRunIndexes,
      source,
    });

  return { handled: false };
}

export function resolveDirectTrashProgramSubroutine(
  host: EncounterPrintedNonTraceHost,
  options: {
    definition?: CardDefinition | undefined;
    subroutine?: SubroutineDefinition | undefined;
    subroutineIndex?: number | undefined;
    legalAction?: LegalAction | undefined;
  } = {},
): DirectTrashProgramSubroutineResult {
  const targetProgramId = pickRunnerProgramForTrash(host);
  const base: EncounterPrintedNonTraceEffectResult = {
    handled: true,
    ...(options.definition ? { sourceDefinitionId: options.definition.id } : {}),
    ...(options.subroutine ? { subroutineId: options.subroutine.id } : {}),
  };
  if (!targetProgramId) {
    if (options.definition && options.subroutine && options.subroutineIndex !== undefined)
      appendResolvedSubroutineEffect(
        options.legalAction,
        options.definition,
        options.subroutineIndex,
        options.subroutine,
        undefined,
        { cardsTrashed: 0 },
      );
    return { ...base, trashedCardIds: [], stateChanged: false };
  }
  const targetDefinition = host.cards.definitionFor(targetProgramId);
  if (
    options.legalAction &&
    host.trash.openRunnerInstalledTrashPreventionWindow(
      [targetProgramId],
      "trash_program_subroutine",
      options.legalAction,
    )
  ) {
    if (options.definition && options.subroutine && options.subroutineIndex !== undefined)
      appendResolvedSubroutineEffect(
        options.legalAction,
        options.definition,
        options.subroutineIndex,
        options.subroutine,
        undefined,
        { cardsTrashed: 0 },
      );
    return {
      ...base,
      trashedCardIds: [],
      programTrashPreventionWindowOpened: true,
      stateChanged: true,
    };
  }
  host.trash.trashRunnerInstalledProgram(targetProgramId);
  if (options.legalAction) {
    options.legalAction.payload = {
      ...(options.legalAction.payload ?? {}),
      trashedCardDefinitionId: targetDefinition.id,
      trashedCardType: "program",
      trashedCount: 1,
    };
  }
  if (options.definition && options.subroutine && options.subroutineIndex !== undefined)
    appendResolvedSubroutineEffect(
      options.legalAction,
      options.definition,
      options.subroutineIndex,
      options.subroutine,
      undefined,
      {
        cardDefinitionId: targetDefinition.id,
        cardTitle: targetDefinition.title,
        cardsTrashed: 1,
      },
    );
  return {
    ...base,
    trashedCardIds: [targetProgramId],
    stateChanged: true,
  };
}

function resolveDirectRunLockSubroutine(
  host: EncounterPrintedNonTraceHost,
  options: {
    definition: CardDefinition;
    subroutine: SubroutineDefinition;
    legalAction?: LegalAction | undefined;
  },
): DirectRunLockSubroutineResult {
  const amount = Math.max(0, Math.floor(options.subroutine.amount ?? 0));
  const flags = ensureRunnerTurnFlags(host.state);
  flags.runLockActionsPending =
    Math.max(0, Math.floor(flags.runLockActionsPending ?? 0)) + amount;
  legalActionPayload(options.legalAction, {
    v1922CorpIceAbility: "direct_run_lock",
    runLockActionsAdded: amount,
    runLockActionsPending: flags.runLockActionsPending,
    sourceDefinitionId: options.definition.id,
  });
  return {
    handled: true,
    sourceDefinitionId: options.definition.id,
    subroutineId: options.subroutine.id,
    ...(host.state.run?.encounteredIceId
      ? {
          sourceCardId: host.state.run.encounteredIceId,
          iceId: host.state.run.encounteredIceId,
        }
      : {}),
    cannotRunUntilActionsSpent: flags.runLockActionsPending,
    stateChanged: amount > 0,
  };
}

function resolveDirectCorpRdRevealSubroutine(
  host: EncounterPrintedNonTraceHost,
  options: {
    definition: CardDefinition;
    legalAction?: LegalAction | undefined;
    source: SourceMetadata;
  },
): EncounterPrintedNonTraceEffectResult {
  if (options.definition.id !== ICE_PICK_WILLIE_ID)
    throw new Error("Die R&D-Reveal-Subroutine passt nicht zum ICE.");
  if (!options.legalAction)
    throw new Error("Continue-Run LegalAction fehlt fuer R&D-Reveal.");
  host.choices.revealCorpRdTop(options.legalAction);
  return { handled: true, ...options.source, stateChanged: true };
}

function resolveDirectCorpRdReorderSubroutine(
  host: EncounterPrintedNonTraceHost,
  options: {
    definition: CardDefinition;
    subroutineIndex: number;
    legalAction?: LegalAction | undefined;
    source: SourceMetadata;
  },
): EncounterPrintedNonTraceEffectResult & { suspended?: boolean } {
  if (options.definition.id !== TOO_MANY_DOORS_ID)
    throw new Error("Die R&D-Reorder-Subroutine passt nicht zum ICE.");
  const arrangeCount = host.state.corp.rd.slice(0, 2).length;
  const run = mustRun(host.state);
  if (arrangeCount < 2) {
    legalActionPayload(options.legalAction, {
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_corp_reorder_rd_top2",
      arrangedCount: arrangeCount,
    });
    if (!run.resolvedSubroutineIndexes.includes(options.subroutineIndex))
      run.resolvedSubroutineIndexes.push(options.subroutineIndex);
    return { handled: true, ...options.source, stateChanged: false };
  }
  if (!options.legalAction)
    throw new Error("Continue-Run LegalAction fehlt fuer R&D-Reorder.");
  if (!run.encounteredIceId)
    throw new Error("R&D-Reorder-Subroutine benoetigt ein Encounter-ICE.");
  host.choices.startCorpRdArrangeChoice({
    sourceIceId: run.encounteredIceId,
    subroutineIndex: options.subroutineIndex,
    updatePayload: true,
  });
  if (!run.resolvedSubroutineIndexes.includes(options.subroutineIndex))
    run.resolvedSubroutineIndexes.push(options.subroutineIndex);
  return { handled: true, ...options.source, suspended: true, stateChanged: true };
}

function resolveDirectEndRunSubroutine(
  host: EncounterPrintedNonTraceHost,
  options: {
    definition: CardDefinition;
    subroutine: SubroutineDefinition;
    subroutineIndex: number;
    legalAction?: LegalAction | undefined;
    paidPayOrEndRunIndexes?: ReadonlySet<number> | undefined;
    source: SourceMetadata;
  },
): DirectEndRunSubroutineResult {
  if (options.subroutine.type === "end_the_run") {
    appendResolvedSubroutineEffect(
      options.legalAction,
      options.definition,
      options.subroutineIndex,
      options.subroutine,
    );
    return {
      handled: true,
      ...options.source,
      runShouldEnd: true,
      stateChanged: false,
    };
  }
  if (options.subroutine.type === "end_the_run_and_trash_source_at_end_of_turn") {
    const sourceCardId = host.state.run?.encounteredIceId;
    if (!sourceCardId)
      throw new Error("End-of-turn-Trash-Subroutine benötigt Encounter-ICE.");
    const flags = ensureRunnerTurnFlags(host.state);
    flags.delayedCorpInstalledCardTrashAtTurnEndIds = [
      ...new Set([
        ...(flags.delayedCorpInstalledCardTrashAtTurnEndIds ?? []),
        sourceCardId,
      ]),
    ].sort();
    appendResolvedSubroutineEffect(
      options.legalAction,
      options.definition,
      options.subroutineIndex,
      options.subroutine,
      undefined,
      { endedRun: true },
    );
    legalActionPayload(options.legalAction, {
      delayedCorpInstalledCardTrashAtTurnEnd: true,
      delayedCorpInstalledCardTrashAtTurnEndId: sourceCardId,
      sourceDefinitionId: options.definition.id,
    });
    return {
      handled: true,
      ...options.source,
      runShouldEnd: true,
      stateChanged: true,
    };
  }
  const amount = Math.max(0, Math.floor(options.subroutine.amount ?? 0));
  if (options.paidPayOrEndRunIndexes?.has(options.subroutineIndex)) {
    appendResolvedSubroutineEffect(
      options.legalAction,
      options.definition,
      options.subroutineIndex,
      options.subroutine,
      undefined,
      { paidCredits: amount, endedRun: false },
    );
    return {
      handled: true,
      ...options.source,
      runShouldEnd: false,
      paidCredits: amount,
      stateChanged: amount > 0,
    };
  }
  appendResolvedSubroutineEffect(
    options.legalAction,
    options.definition,
    options.subroutineIndex,
    options.subroutine,
    undefined,
    { paidCredits: 0, endedRun: true },
  );
  return {
    handled: true,
    ...options.source,
    runShouldEnd: true,
    paidCredits: 0,
    stateChanged: false,
  };
}

function pickRunnerProgramForTrash(
  host: EncounterPrintedNonTraceHost,
): CardInstanceId | undefined {
  return host.state.runner.rig.programs.slice().sort((left, right) => {
    const leftDefinition = host.cards.definitionFor(left);
    const rightDefinition = host.cards.definitionFor(right);
    const byInstallCost =
      (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
    if (byInstallCost !== 0) return byInstallCost;
    const byMemoryCost =
      (rightDefinition.memoryCost ?? 0) - (leftDefinition.memoryCost ?? 0);
    if (byMemoryCost !== 0) return byMemoryCost;
    return left.localeCompare(right);
  })[0];
}

function sourceMetadata(
  run: ActiveRun,
  definition: CardDefinition,
  subroutine: SubroutineDefinition,
): SourceMetadata {
  return {
    sourceDefinitionId: definition.id,
    subroutineId: subroutine.id,
    ...(run.encounteredIceId
      ? {
          sourceCardId: run.encounteredIceId,
          iceId: run.encounteredIceId,
        }
      : {}),
  };
}

function ensureRunnerTurnFlags(
  state: GameState,
): NonNullable<GameState["runnerTurnFlags"]> {
  state.runnerTurnFlags ??= {
    stoleAgendaThisTurn: false,
    stoleAgendaLastTurn: false,
  };
  return state.runnerTurnFlags;
}

function legalActionPayload(
  legalAction: LegalAction | undefined,
  payload: NonNullable<LegalAction["payload"]>,
): void {
  if (!legalAction) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...payload,
  };
}

function mustRun(state: GameState): ActiveRun {
  if (!state.run) throw new Error("Es läuft kein Run.");
  return state.run;
}
