import {
  type CardDefinition,
  type CardInstanceId,
  type CorpServer,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type ServerId,
  type SubroutineDefinition,
} from "@netgrid/shared";
import {
  appendResolvedSubroutineEffect,
  cleanupEncounterDurationMarkers,
  type EncounterResolutionHost,
  resolveRunDurationMarkerSubroutine,
} from "./encounter-resolution";
import { credits } from "../state/economy-mutation";

type ActiveRun = NonNullable<GameState["run"]>;
type DeflectorTarget = NonNullable<SubroutineDefinition["deflectorTarget"]>;
type SourceMetadata = {
  sourceCardId?: CardInstanceId;
  sourceDefinitionId: string;
  iceId?: CardInstanceId;
  subroutineId: string;
};
type ClassicDeflectorChoiceContext = {
  runId: string;
  sourceIceId: CardInstanceId;
  subroutineIndex: number;
  sourceDefinitionId: string;
  subroutineId: string;
  target: DeflectorTarget;
  cost: number;
  autoBreakIfNoTarget: boolean;
};
type TrashProgramChoiceContext = {
  runId: string;
  sourceIceId: CardInstanceId;
  subroutineIndex: number;
  sourceDefinitionId: string;
  subroutineId: string;
  subroutineType:
    | "initiate_trace"
    | "trash_installed_program"
    | "trash_installed_program_unless_runner_pays";
  continuation: "encounter" | "trace_success";
};

export const CLASSIC_DEFLECTOR_CHOICE_SOURCE_PREFIX =
  "card_implementation.classic_deflector";
export const TRASH_PROGRAM_CHOICE_SOURCE_PREFIX =
  "card_implementation.trash_installed_program";

export type EncounterPrintedNonTraceHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
  };
  servers: {
    mustServer: (
      serverId: Exclude<ServerId, "new_remote"> | string,
    ) => CorpServer;
    publicServerLabel: (
      serverId: Exclude<ServerId, "new_remote"> | string,
    ) => string | undefined;
  };
  encounter: {
    resolutionHost: EncounterResolutionHost;
  };
  payment: {
    spendCorpCredits: (amount: number) => void;
  };
  tags: {
    addRunnerTagsWithPrevention: (
      legalAction: LegalAction,
      amount: number,
      source: string,
    ) => boolean;
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
    selectedChoiceIds: (
      selectedChoices: PlayerAction["selectedChoices"],
    ) => string[];
    revealCorpRdTop: (legalAction: LegalAction) => void;
    startCorpRdArrangeChoice: (input: {
      sourceIceId: CardInstanceId;
      subroutineIndex: number;
      updatePayload: true;
    }) => void;
  };
  callbacks?: {
    beginEncounter?: (
      encounteredIceId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    resetBreakerStrength?: () => void;
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
  runRedirected?: boolean;
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
    credits(host.state, "corp", subroutine.amount ?? 1, {
      kind: "subroutine",
      sourceDefinitionId: definition.id,
      ...(source.sourceCardId ? { sourceCardId: source.sourceCardId } : {}),
      reason: "corp_gain_credit_subroutine",
    });
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
    const amount = subroutine.amount ?? 1;
    if (!legalAction)
      throw new Error("Give-Runner-Tag braucht eine LegalAction.");
    const suspended = host.tags.addRunnerTagsWithPrevention(
      legalAction,
      amount,
      `subroutine:${definition.id}:${subroutine.id}`,
    );
    if (suspended && !run.resolvedSubroutineIndexes.includes(subroutineIndex))
      run.resolvedSubroutineIndexes.push(subroutineIndex);
    return {
      handled: true,
      ...source,
      ...(suspended ? { suspended: true } : {}),
      stateChanged: true,
    };
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
        {
          paidCredits: Math.max(0, Math.floor(subroutine.amount ?? 0)),
          cardsTrashed: 0,
        },
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
  if (subroutine.type === "deflect_run")
    return resolveClassicDeflectorSubroutine(host, {
      definition,
      subroutine,
      subroutineIndex,
      legalAction,
      source,
    });

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
      subroutineIndex,
      legalAction,
    });

  if (subroutine.type === "reveal_corp_rd_top")
    return resolveDirectCorpRdRevealSubroutine(host, {
      legalAction,
      source,
    });

  if (subroutine.type === "reorder_corp_rd_top2")
    return resolveDirectCorpRdReorderSubroutine(host, {
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

function resolveClassicDeflectorSubroutine(
  host: EncounterPrintedNonTraceHost,
  options: {
    definition: CardDefinition;
    subroutine: SubroutineDefinition;
    subroutineIndex: number;
    legalAction?: LegalAction | undefined;
    source: SourceMetadata;
  },
): EncounterPrintedNonTraceEffectResult {
  const targetProfile = options.subroutine.deflectorTarget;
  if (!targetProfile) throw new Error("Deflector-Subroutine ohne Zielprofil.");
  const run = mustRun(host.state);
  const sourceIceId = run.encounteredIceId;
  if (!sourceIceId)
    throw new Error("Deflector-Subroutine braucht ein Encounter-ICE.");
  const targets = eligibleClassicDeflectorTargets(host, targetProfile);
  const cost = Math.max(0, Math.floor(options.subroutine.deflectorCost ?? 0));
  if (targets.length === 0) {
    markSubroutineResolved(run, options.subroutineIndex);
    appendResolvedSubroutineEffect(
      options.legalAction,
      options.definition,
      options.subroutineIndex,
      options.subroutine,
      undefined,
      {},
    );
    legalActionPayload(options.legalAction, {
      classicDeflector: true,
      sourceDefinitionId: options.definition.id,
      deflectedRun: false,
      ...(options.subroutine.deflectorAutoBreakIfNoTarget
        ? { deflectorAutoBroken: true }
        : {}),
    });
    return { handled: true, ...options.source, stateChanged: false };
  }
  if (cost > 0) {
    if (host.state.corp.credits < cost) {
      markSubroutineResolved(run, options.subroutineIndex);
      appendResolvedSubroutineEffect(
        options.legalAction,
        options.definition,
        options.subroutineIndex,
        options.subroutine,
        undefined,
        { paidCredits: 0 },
      );
      legalActionPayload(options.legalAction, {
        classicDeflector: true,
        sourceDefinitionId: options.definition.id,
        deflectedRun: false,
        paidCredits: 0,
      });
      return { handled: true, ...options.source, stateChanged: false };
    }
    startClassicDeflectorChoice(host, {
      run,
      sourceIceId,
      definition: options.definition,
      subroutine: options.subroutine,
      subroutineIndex: options.subroutineIndex,
      targets,
      cost,
      targetProfile,
      legalAction: options.legalAction,
      includeDecline: true,
    });
    markSubroutineResolved(run, options.subroutineIndex);
    return {
      handled: true,
      ...options.source,
      suspended: true,
      stateChanged: true,
    };
  }
  if (targets.length > 1) {
    startClassicDeflectorChoice(host, {
      run,
      sourceIceId,
      definition: options.definition,
      subroutine: options.subroutine,
      subroutineIndex: options.subroutineIndex,
      targets,
      cost,
      targetProfile,
      legalAction: options.legalAction,
      includeDecline: false,
    });
    markSubroutineResolved(run, options.subroutineIndex);
    return {
      handled: true,
      ...options.source,
      suspended: true,
      stateChanged: true,
    };
  }
  const target = targets[0]!;
  markSubroutineResolved(run, options.subroutineIndex);
  appendResolvedSubroutineEffect(
    options.legalAction,
    options.definition,
    options.subroutineIndex,
    options.subroutine,
    undefined,
    {},
  );
  applyClassicDeflectorRedirect(host, {
    sourceDefinitionId: options.definition.id,
    targetServerId: target.id,
    legalAction: options.legalAction,
    paidCredits: 0,
  });
  return {
    handled: true,
    ...options.source,
    runRedirected: true,
    stateChanged: true,
  };
}

export function resolveClassicDeflectorChoice(
  host: EncounterPrintedNonTraceHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = host.state.pendingChoice;
  if (!choice?.source.startsWith(CLASSIC_DEFLECTOR_CHOICE_SOURCE_PREFIX))
    throw new Error("Es ist keine Classic-Deflector-Choice offen.");
  const context = parseClassicDeflectorChoiceSource(choice.source);
  const run = mustRun(host.state);
  if (run.runId !== context.runId)
    throw new Error("Die Deflector-Choice passt nicht mehr zum Run.");
  if (run.encounteredIceId !== context.sourceIceId)
    throw new Error("Die Deflector-Quelle passt nicht mehr zum Encounter.");
  const selected =
    host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const subroutine: SubroutineDefinition = {
    id: context.subroutineId,
    type: "deflect_run",
    deflectorTarget: context.target,
    ...(context.cost > 0 ? { deflectorCost: context.cost } : {}),
    ...(context.autoBreakIfNoTarget
      ? { deflectorAutoBreakIfNoTarget: true }
      : {}),
  };
  const definition = host.cards.definitionFor(context.sourceIceId);
  if (definition.id !== context.sourceDefinitionId)
    throw new Error("Die Deflector-Definition passt nicht mehr.");
  if (selected === "decline") {
    if (context.cost <= 0)
      throw new Error("Diese Deflector-Choice darf nicht abgelehnt werden.");
    markSubroutineResolved(run, context.subroutineIndex);
    appendResolvedSubroutineEffect(
      legalAction,
      definition,
      context.subroutineIndex,
      subroutine,
      undefined,
      { paidCredits: 0 },
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      classicDeflector: true,
      sourceDefinitionId: definition.id,
      deflectedRun: false,
      paidCredits: 0,
    };
    delete host.state.pendingChoice;
    host.state.phase = "run";
    host.state.timingPoint = "run.encounter_ice";
    host.state.activeSide = "runner";
    return;
  }
  if (!selected.startsWith("server_"))
    throw new Error("Die Deflector-Zielauswahl ist ungueltig.");
  const targetServerId = selected.replace(/^server_/, "") as Exclude<
    ServerId,
    "new_remote"
  >;
  const targets = eligibleClassicDeflectorTargets(host, context.target);
  if (!targets.some((server) => server.id === targetServerId))
    throw new Error("Das Deflector-Ziel ist nicht mehr legal.");
  if (context.cost > 0) {
    if (host.state.corp.credits < context.cost)
      throw new Error("Die Korp kann den Deflector nicht bezahlen.");
    host.payment.spendCorpCredits(context.cost);
  }
  markSubroutineResolved(run, context.subroutineIndex);
  appendResolvedSubroutineEffect(
    legalAction,
    definition,
    context.subroutineIndex,
    subroutine,
    undefined,
    { paidCredits: context.cost },
  );
  delete host.state.pendingChoice;
  applyClassicDeflectorRedirect(host, {
    sourceDefinitionId: definition.id,
    targetServerId,
    legalAction,
    paidCredits: context.cost,
  });
}

function startClassicDeflectorChoice(
  host: EncounterPrintedNonTraceHost,
  input: {
    run: ActiveRun;
    sourceIceId: CardInstanceId;
    definition: CardDefinition;
    subroutine: SubroutineDefinition;
    subroutineIndex: number;
    targets: CorpServer[];
    cost: number;
    targetProfile: DeflectorTarget;
    legalAction?: LegalAction | undefined;
    includeDecline: boolean;
  },
): void {
  const choiceId = `classic_deflector_${host.state.stateVersion + 1}`;
  host.state.pendingChoice = {
    choiceId,
    side: "corp",
    source: classicDeflectorChoiceSource({
      runId: input.run.runId,
      sourceIceId: input.sourceIceId,
      subroutineIndex: input.subroutineIndex,
      sourceDefinitionId: input.definition.id,
      subroutineId: input.subroutine.id,
      target: input.targetProfile,
      cost: input.cost,
      autoBreakIfNoTarget:
        input.subroutine.deflectorAutoBreakIfNoTarget === true,
    }),
    prompt:
      input.cost > 0
        ? `Deflector-Ziel wählen (${input.cost} Credits) oder nicht zahlen`
        : "Deflector-Ziel wählen",
    kind: "select_option",
    options: [
      ...(input.includeDecline
        ? [
            {
              id: "decline",
              label: "Nicht zahlen",
              publicLabel: "Kein Redirect",
              value: "decline",
            },
          ]
        : []),
      ...input.targets.map((server) => {
        const label = host.servers.publicServerLabel(server.id) ?? server.id;
        const optionLabel =
          input.cost > 0
            ? `${label} (${input.cost} ${input.cost === 1 ? "Credit" : "Credits"})`
            : label;
        return {
          id: `server_${server.id}`,
          label: optionLabel,
          publicLabel: label,
          value: server.id,
        };
      }),
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
  host.state.activeSide = "corp";
  legalActionPayload(input.legalAction, {
    classicDeflector: true,
    sourceDefinitionId: input.definition.id,
    deflectorChoiceOpened: true,
    deflectorCost: input.cost,
    deflectorTargetProfile: input.targetProfile,
    choiceId,
  });
}

export function applyClassicDeflectorRedirect(
  host: EncounterPrintedNonTraceHost,
  input: {
    sourceDefinitionId: string;
    targetServerId: Exclude<ServerId, "new_remote">;
    legalAction?: LegalAction | undefined;
    paidCredits: number;
  },
): void {
  const server = host.servers.mustServer(input.targetServerId);
  cleanupEncounterDurationMarkers(host.encounter.resolutionHost);
  host.callbacks?.resetBreakerStrength?.();
  const run = mustRun(host.state);
  const rezzedIceIndex = outermostRezzedIceIndex(host, server);
  run.attackedServerId = server.id;
  delete run.accessServerOverride;
  delete run.postPassPayOrEndRun;
  delete run.corpPostPassIceReturnToHq;
  delete run.postPassCancellableFutureIceStrength;
  if (rezzedIceIndex !== undefined) {
    const encounteredIceId = server.ice[rezzedIceIndex]!;
    run.position = {
      kind: "ice",
      serverId: server.id,
      iceIndex: rezzedIceIndex,
    };
    run.approachedIceId = encounteredIceId;
    if (host.callbacks?.beginEncounter) {
      host.callbacks.beginEncounter(encounteredIceId, input.legalAction);
    } else {
      run.phase = "encounter_ice";
      run.encounteredIceId = encounteredIceId;
      run.brokenSubroutineIndexes = [];
      run.resolvedSubroutineIndexes = [];
      run.traceSuccessBySubroutineIndex = {};
      run.bartmossUsedBreakerIdsThisEncounter = [];
      run.blinkUsedSubroutinesByBreakerThisEncounter = {};
      host.state.phase = "run";
      host.state.timingPoint = "run.encounter_ice";
      host.state.activeSide = "runner";
    }
    mustRun(host.state).jackOutLockedUntilEncounterEnds = true;
    legalActionPayload(input.legalAction, {
      classicDeflector: true,
      sourceDefinitionId: input.sourceDefinitionId,
      deflectedRun: true,
      redirectedServerId: server.id,
      redirectedToIceId: encounteredIceId,
      redirectedToRezzedIce: true,
      paidCredits: input.paidCredits,
      corpCreditsAfter: host.state.corp.credits,
    });
    return;
  }
  const lastIceId = server.ice[0];
  run.phase = "movement";
  run.position = { kind: "server", serverId: server.id };
  delete run.approachedIceId;
  delete run.encounteredIceId;
  run.brokenSubroutineIndexes = [];
  run.resolvedSubroutineIndexes = [];
  if (lastIceId) run.lastPassedIceId = lastIceId;
  else delete run.lastPassedIceId;
  host.state.phase = "run";
  host.state.timingPoint = "run.jack_out_window";
  host.state.activeSide = "runner";
  legalActionPayload(input.legalAction, {
    classicDeflector: true,
    sourceDefinitionId: input.sourceDefinitionId,
    deflectedRun: true,
    redirectedServerId: server.id,
    redirectedToRezzedIce: false,
    ...(lastIceId ? { lastPassedIceId: lastIceId } : {}),
    paidCredits: input.paidCredits,
    corpCreditsAfter: host.state.corp.credits,
  });
}

function eligibleClassicDeflectorTargets(
  host: EncounterPrintedNonTraceHost,
  target: DeflectorTarget,
): CorpServer[] {
  if (target === "archives") return [host.servers.mustServer("archives")];
  return host.state.corp.servers
    .slice()
    .filter((server) =>
      target === "subsidiary_data_fort" ? server.kind === "remote" : true,
    );
}

function outermostRezzedIceIndex(
  host: EncounterPrintedNonTraceHost,
  server: CorpServer,
): number | undefined {
  for (let index = server.ice.length - 1; index >= 0; index -= 1) {
    const iceId = server.ice[index]!;
    if (host.state.cardInstances[iceId]?.rezzed === true) return index;
  }
  return undefined;
}

function markSubroutineResolved(run: ActiveRun, subroutineIndex: number): void {
  if (!run.resolvedSubroutineIndexes.includes(subroutineIndex))
    run.resolvedSubroutineIndexes.push(subroutineIndex);
}

function classicDeflectorChoiceSource(
  context: ClassicDeflectorChoiceContext,
): string {
  return [
    CLASSIC_DEFLECTOR_CHOICE_SOURCE_PREFIX,
    encodeURIComponent(context.runId),
    encodeURIComponent(context.sourceIceId),
    String(context.subroutineIndex),
    encodeURIComponent(context.sourceDefinitionId),
    encodeURIComponent(context.subroutineId),
    context.target,
    String(context.cost),
    context.autoBreakIfNoTarget ? "1" : "0",
  ].join(":");
}

function parseClassicDeflectorChoiceSource(
  source: string,
): ClassicDeflectorChoiceContext {
  const [
    prefix,
    encodedRunId,
    encodedSourceIceId,
    indexRaw,
    encodedSourceDefinitionId,
    encodedSubroutineId,
    targetRaw,
    costRaw,
    autoBreakRaw,
  ] = source.split(":");
  if (
    prefix !== CLASSIC_DEFLECTOR_CHOICE_SOURCE_PREFIX ||
    !encodedRunId ||
    !encodedSourceIceId ||
    indexRaw === undefined ||
    !encodedSourceDefinitionId ||
    !encodedSubroutineId ||
    !isDeflectorTarget(targetRaw)
  )
    throw new Error("Deflector-Choice-Quelle ist ungueltig.");
  const subroutineIndex = Number(indexRaw);
  const cost = Number(costRaw ?? "0");
  if (!Number.isInteger(subroutineIndex) || subroutineIndex < 0)
    throw new Error("Deflector-Subroutine-Index ist ungueltig.");
  if (!Number.isInteger(cost) || cost < 0)
    throw new Error("Deflector-Kosten sind ungueltig.");
  return {
    runId: decodeURIComponent(encodedRunId),
    sourceIceId: decodeURIComponent(encodedSourceIceId) as CardInstanceId,
    subroutineIndex,
    sourceDefinitionId: decodeURIComponent(encodedSourceDefinitionId),
    subroutineId: decodeURIComponent(encodedSubroutineId),
    target: targetRaw,
    cost,
    autoBreakIfNoTarget: autoBreakRaw === "1",
  };
}

function isDeflectorTarget(
  value: string | undefined,
): value is DeflectorTarget {
  return (
    value === "archives" ||
    value === "any_data_fort" ||
    value === "subsidiary_data_fort"
  );
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
  const base: EncounterPrintedNonTraceEffectResult = {
    handled: true,
    ...(options.definition
      ? { sourceDefinitionId: options.definition.id }
      : {}),
    ...(options.subroutine ? { subroutineId: options.subroutine.id } : {}),
  };
  if (host.state.runner.rig.programs.length === 0) {
    if (
      options.definition &&
      options.subroutine &&
      options.subroutineIndex !== undefined
    )
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
  if (
    !options.definition ||
    !options.subroutine ||
    options.subroutineIndex === undefined ||
    !options.legalAction
  )
    throw new Error(
      "Programmtrash-Subroutine benötigt gebundene Source-Context.",
    );
  startTrashProgramChoice(host, {
    definition: options.definition,
    subroutine: options.subroutine,
    subroutineIndex: options.subroutineIndex,
    legalAction: options.legalAction,
    continuation: "encounter",
  });
  return {
    ...base,
    trashedCardIds: [],
    suspended: true,
    stateChanged: true,
  };
}

export function resolveTraceSuccessTrashProgramSubroutine(
  host: EncounterPrintedNonTraceHost,
  options: {
    definition: CardDefinition;
    subroutine: SubroutineDefinition;
    subroutineIndex: number;
    legalAction: LegalAction;
  },
): DirectTrashProgramSubroutineResult {
  if (
    options.subroutine.type !== "initiate_trace" ||
    options.subroutine.traceSuccessEffect?.type !==
      "end_run_trash_program_and_run_lock"
  )
    throw new Error(
      "Trace-Programmtrash benötigt eine passende Trace-Erfolgs-Subroutine.",
    );
  const base: EncounterPrintedNonTraceEffectResult = {
    handled: true,
    sourceDefinitionId: options.definition.id,
    subroutineId: options.subroutine.id,
  };
  if (host.state.runner.rig.programs.length === 0)
    return { ...base, trashedCardIds: [], stateChanged: false };
  startTrashProgramChoice(host, {
    ...options,
    continuation: "trace_success",
  });
  return {
    ...base,
    trashedCardIds: [],
    suspended: true,
    stateChanged: true,
  };
}

export type TrashProgramChoiceResolution = {
  traceSuccessContinuation: boolean;
};

export function resolveTrashProgramChoice(
  host: EncounterPrintedNonTraceHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): TrashProgramChoiceResolution {
  const choice = host.state.pendingChoice;
  if (!choice?.source.startsWith(TRASH_PROGRAM_CHOICE_SOURCE_PREFIX))
    throw new Error("Programmtrash-Choice ist nicht offen.");
  const context = parseTrashProgramChoiceSource(choice.source);
  const run = mustRun(host.state);
  if (
    run.runId !== context.runId ||
    run.encounteredIceId !== context.sourceIceId
  )
    throw new Error("Die Programmtrash-Choice passt nicht mehr zum Encounter.");
  const sourceInstance = host.state.cardInstances[context.sourceIceId];
  if (
    !sourceInstance?.rezzed ||
    sourceInstance.zone.side !== "corp" ||
    sourceInstance.zone.zone !== "serverIce"
  )
    throw new Error(
      "Die Programmtrash-Choice-Quelle ist nicht mehr rezzed ICE.",
    );
  const sourceDefinition = host.cards.definitionFor(context.sourceIceId);
  if (sourceDefinition.id !== context.sourceDefinitionId)
    throw new Error("Die Programmtrash-Choice-Quelle passt nicht mehr.");
  const subroutine = sourceDefinition.subroutines?.find(
    (candidate) =>
      candidate.id === context.subroutineId &&
      candidate.type === context.subroutineType,
  );
  if (!subroutine)
    throw new Error("Die Programmtrash-Subroutine passt nicht mehr.");
  if (
    context.continuation === "trace_success" &&
    (subroutine.type !== "initiate_trace" ||
      subroutine.traceSuccessEffect?.type !==
        "end_run_trash_program_and_run_lock")
  )
    throw new Error("Die Trace-Programmtrash-Fortsetzung passt nicht mehr.");
  const selectedOptionId =
    host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const targetProgramId = choice.options.find(
    (option) => option.id === selectedOptionId,
  )?.value as CardInstanceId | undefined;
  if (
    !targetProgramId ||
    !host.state.runner.rig.programs.includes(targetProgramId)
  )
    throw new Error("Das gewählte Programm ist nicht mehr installiert.");
  const targetDefinition = host.cards.definitionFor(targetProgramId);
  const prevented = host.trash.openRunnerInstalledTrashPreventionWindow(
    [targetProgramId],
    "trash_program_subroutine",
    legalAction,
  );
  if (!prevented) {
    host.trash.trashRunnerInstalledProgram(targetProgramId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      trashedCardDefinitionId: targetDefinition.id,
      trashedCardType: "program",
      trashedCount: 1,
    };
  }
  appendResolvedSubroutineEffect(
    legalAction,
    sourceDefinition,
    context.subroutineIndex,
    subroutine,
    undefined,
    prevented
      ? { cardsTrashed: 0 }
      : {
          cardDefinitionId: targetDefinition.id,
          cardTitle: targetDefinition.title,
          cardsTrashed: 1,
        },
  );
  // The Corp has completed the target decision. Any resulting prevention
  // window and the resumed encounter both belong to the Runner.
  host.state.activeSide = "runner";
  if (host.state.pendingChoice === choice) {
    delete host.state.pendingChoice;
  }
  return {
    traceSuccessContinuation: context.continuation === "trace_success",
  };
}

function startTrashProgramChoice(
  host: EncounterPrintedNonTraceHost,
  input: {
    definition: CardDefinition;
    subroutine: SubroutineDefinition;
    subroutineIndex: number;
    legalAction: LegalAction;
    continuation: "encounter" | "trace_success";
  },
): void {
  if (
    input.continuation === "encounter" &&
    input.subroutine.type !== "trash_installed_program" &&
    input.subroutine.type !== "trash_installed_program_unless_runner_pays"
  )
    throw new Error(
      "Programmtrash-Choice benötigt eine Programmtrash-Subroutine.",
    );
  if (
    input.continuation === "trace_success" &&
    (input.subroutine.type !== "initiate_trace" ||
      input.subroutine.traceSuccessEffect?.type !==
        "end_run_trash_program_and_run_lock")
  )
    throw new Error(
      "Trace-Programmtrash-Choice benötigt eine passende Trace-Erfolgs-Subroutine.",
    );
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  const subroutineType = input.subroutine.type as
    | "initiate_trace"
    | "trash_installed_program"
    | "trash_installed_program_unless_runner_pays";
  const run = mustRun(host.state);
  const sourceIceId = run.encounteredIceId;
  if (!sourceIceId)
    throw new Error("Programmtrash-Choice benötigt ein Encounter-ICE.");
  const choiceId = `trash_installed_program_${host.state.stateVersion + 1}`;
  host.state.pendingChoice = {
    choiceId,
    side: "corp",
    source: trashProgramChoiceSource({
      runId: run.runId,
      sourceIceId,
      subroutineIndex: input.subroutineIndex,
      sourceDefinitionId: input.definition.id,
      subroutineId: input.subroutine.id,
      subroutineType,
      continuation: input.continuation,
    }),
    prompt: `${input.definition.title}: installiertes Programm zum Trashing wählen.`,
    kind: "select_cards",
    options: host.state.runner.rig.programs.map((cardId) => ({
      id: `card_${cardId}`,
      label: host.cards.definitionFor(cardId).title,
      value: cardId,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
  if (!run.resolvedSubroutineIndexes.includes(input.subroutineIndex))
    run.resolvedSubroutineIndexes.push(input.subroutineIndex);
  host.state.activeSide = "corp";
  legalActionPayload(input.legalAction, {
    sourceDefinitionId: input.definition.id,
    programTrashChoiceOpened: true,
    programTrashCandidateCount: host.state.runner.rig.programs.length,
    choiceId,
  });
}

function trashProgramChoiceSource(context: TrashProgramChoiceContext): string {
  return [
    TRASH_PROGRAM_CHOICE_SOURCE_PREFIX,
    encodeURIComponent(context.runId),
    encodeURIComponent(context.sourceIceId),
    context.subroutineIndex,
    encodeURIComponent(context.sourceDefinitionId),
    encodeURIComponent(context.subroutineId),
    context.subroutineType,
    context.continuation,
  ].join(":");
}

function parseTrashProgramChoiceSource(
  source: string,
): TrashProgramChoiceContext {
  const [
    prefix,
    runId,
    sourceIceId,
    index,
    sourceDefinitionId,
    subroutineId,
    subroutineType,
    continuation,
  ] = source.split(":");
  if (prefix !== TRASH_PROGRAM_CHOICE_SOURCE_PREFIX)
    throw new Error("Programmtrash-Choice-Quelle ist ungültig.");
  const subroutineIndex = Number(index);
  if (!Number.isInteger(subroutineIndex) || subroutineIndex < 0)
    throw new Error("Programmtrash-Subroutine-Index ist ungültig.");
  if (
    subroutineType !== "initiate_trace" &&
    subroutineType !== "trash_installed_program" &&
    subroutineType !== "trash_installed_program_unless_runner_pays"
  )
    throw new Error("Programmtrash-Subroutinen-Typ ist ungültig.");
  if (continuation !== "encounter" && continuation !== "trace_success")
    throw new Error("Programmtrash-Fortsetzung ist ungültig.");
  if (
    (continuation === "encounter" && subroutineType === "initiate_trace") ||
    (continuation === "trace_success" && subroutineType !== "initiate_trace")
  )
    throw new Error("Programmtrash-Fortsetzung passt nicht zur Subroutine.");
  const parsedSubroutineType = subroutineType as
    | "initiate_trace"
    | "trash_installed_program"
    | "trash_installed_program_unless_runner_pays";
  return {
    runId: decodeURIComponent(runId ?? ""),
    sourceIceId: decodeURIComponent(sourceIceId ?? "") as CardInstanceId,
    subroutineIndex,
    sourceDefinitionId: decodeURIComponent(sourceDefinitionId ?? ""),
    subroutineId: decodeURIComponent(subroutineId ?? ""),
    subroutineType: parsedSubroutineType,
    continuation,
  };
}

function resolveDirectRunLockSubroutine(
  host: EncounterPrintedNonTraceHost,
  options: {
    definition: CardDefinition;
    subroutine: SubroutineDefinition;
    subroutineIndex: number;
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
  appendResolvedSubroutineEffect(
    options.legalAction,
    options.definition,
    options.subroutineIndex,
    options.subroutine,
    undefined,
    { amount },
  );
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
    legalAction?: LegalAction | undefined;
    source: SourceMetadata;
  },
): EncounterPrintedNonTraceEffectResult {
  if (!options.legalAction)
    throw new Error("Continue-Run LegalAction fehlt fuer R&D-Reveal.");
  host.choices.revealCorpRdTop(options.legalAction);
  return { handled: true, ...options.source, stateChanged: true };
}

function resolveDirectCorpRdReorderSubroutine(
  host: EncounterPrintedNonTraceHost,
  options: {
    subroutineIndex: number;
    legalAction?: LegalAction | undefined;
    source: SourceMetadata;
  },
): EncounterPrintedNonTraceEffectResult & { suspended?: boolean } {
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
  return {
    handled: true,
    ...options.source,
    suspended: true,
    stateChanged: true,
  };
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
  if (
    options.subroutine.type === "end_the_run_and_trash_source_at_end_of_turn"
  ) {
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
