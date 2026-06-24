import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type DamageType,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type SubroutineDefinition,
} from "@netgrid/shared";
import { dynamicSubroutineAttributionFor } from "../../ability-engine/additional-subroutine-modifiers";
import { FATAL_ATTRACTOR_NEXT_ENCOUNTER_DAMAGE_SOURCE } from "../../compatibility/runtime-compatibility";
import { ACTIVE_ICE_TRASH_PROGRAM_SOURCE } from "../../mechanics/longtail-card-effects";
import {
  payEncounterSubroutineRunCost,
  runDurationPaymentHost,
  runJackOutAdditionalCost,
} from "./run-duration-payment";

type ActiveRun = NonNullable<GameState["run"]>;
type EncounterSubroutine = SubroutineDefinition;

export type EncounterResolutionHost = {
  state: GameState;
  callbacks?: {
    applyRunnerForgoNextAction?: () => void;
    trashRunnerInstalledProgram?: (cardId: CardInstanceId) => void;
  };
};

export type DamageSummary = {
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  runnerGripBefore?: number;
  runnerGripAfter?: number;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
};

export type SubroutineEffectResolutionResult = {
  handled: boolean;
  sourceDefinitionId?: string;
  subroutineId?: string;
  setRunMarkers?: string[];
  encounterTaxAmount?: number;
  jackOutAdditionalCost?: number;
  mustTrashProgramAfterPass?: boolean;
  nextEncounterDamage?: number;
  stateChanged?: boolean;
};

export type RunDurationMarkerResult = SubroutineEffectResolutionResult;

export type EncounterResolutionResult = {
  handled: boolean;
  paidPayOrEndRunIndexes?: Set<number>;
  payOrEndRunIndexesForThisContinue?: Set<number>;
  paidPayOrTrashProgramIndexes?: Set<number>;
  payOrTrashProgramIndexesForThisContinue?: Set<number>;
  stateChanged?: boolean;
};

export type PostEncounterResult = {
  handled: boolean;
  forcedJackOutAfterEncounter?: boolean;
  runShouldEnd?: boolean;
  stateChanged?: boolean;
};

export type PassIceFollowupResult = {
  handled: boolean;
  choiceOpened?: boolean;
  sourceDefinitionId?: string;
  stateChanged?: boolean;
};

export function encounterResolutionHost(
  state: GameState,
  callbacks: EncounterResolutionHost["callbacks"] = {},
): EncounterResolutionHost {
  return { state, callbacks };
}

export function preparePayOrEndRunSubroutinePayment(
  host: EncounterResolutionHost,
  subroutines: readonly EncounterSubroutine[],
  legalAction?: LegalAction,
): EncounterResolutionResult {
  const run = mustRun(host.state);
  const payOrEndRunIndexesForThisContinue = new Set(
    encounterSubroutineIndexesForNextContinue(run, subroutines).filter(
      (index) =>
        subroutines[index]?.type === "end_the_run_unless_runner_pays",
    ),
  );
  const payOrTrashProgramIndexesForThisContinue = new Set(
    encounterSubroutineIndexesForNextContinue(run, subroutines).filter(
      (index) =>
        subroutines[index]?.type === "trash_installed_program_unless_runner_pays",
    ),
  );
  const expectedSubroutineIds =
    typeof legalAction?.payload?.encounterSubroutineIds === "string"
      ? String(legalAction.payload.encounterSubroutineIds)
      : undefined;
  if (expectedSubroutineIds !== undefined) {
    const currentSubroutineIds = encounterSubroutinesForNextContinue(
      run,
      subroutines,
    )
      .map((subroutine) => subroutine.id)
      .join(",");
    if (currentSubroutineIds !== expectedSubroutineIds)
      throw new Error("Die Encounter-Subroutinen sind nicht mehr gueltig.");
  }
  const paidPayOrEndRunIndexes = new Set<number>();
  const paidPayOrTrashProgramIndexes = new Set<number>();
  const payOrEndRunIndexPayload =
    typeof legalAction?.payload?.payOrEndRunSubroutineIndexes === "string"
      ? String(legalAction.payload.payOrEndRunSubroutineIndexes)
      : "";
  for (const rawIndex of payOrEndRunIndexPayload.split(",")) {
    if (!rawIndex) continue;
    const index = Number(rawIndex);
    if (!Number.isInteger(index) || index < 0)
      throw new Error("Die Pay-or-End-the-Run-Subroutine ist ungueltig.");
    paidPayOrEndRunIndexes.add(index);
  }
  const payOrTrashProgramIndexPayload =
    typeof legalAction?.payload?.payOrTrashProgramSubroutineIndexes === "string"
      ? String(legalAction.payload.payOrTrashProgramSubroutineIndexes)
      : "";
  for (const rawIndex of payOrTrashProgramIndexPayload.split(",")) {
    if (!rawIndex) continue;
    const index = Number(rawIndex);
    if (!Number.isInteger(index) || index < 0)
      throw new Error("Die Pay-or-Trash-Program-Subroutine ist ungueltig.");
    paidPayOrTrashProgramIndexes.add(index);
  }
  let expectedPayOrEndRunPayment = 0;
  for (const index of paidPayOrEndRunIndexes) {
    const subroutine = subroutines[index];
    if (
      !subroutine ||
      subroutine.type !== "end_the_run_unless_runner_pays" ||
      run.brokenSubroutineIndexes.includes(index) ||
      run.resolvedSubroutineIndexes.includes(index)
    ) {
      throw new Error("Die Pay-or-End-the-Run-Subroutine ist nicht mehr gueltig.");
    }
    expectedPayOrEndRunPayment += Math.max(
      0,
      Math.floor(subroutine.amount ?? 0),
    );
  }
  let expectedPayOrTrashProgramPayment = 0;
  for (const index of paidPayOrTrashProgramIndexes) {
    const subroutine = subroutines[index];
    if (
      !subroutine ||
      subroutine.type !== "trash_installed_program_unless_runner_pays" ||
      run.brokenSubroutineIndexes.includes(index) ||
      run.resolvedSubroutineIndexes.includes(index)
    ) {
      throw new Error("Die Pay-or-Trash-Program-Subroutine ist nicht mehr gueltig.");
    }
    expectedPayOrTrashProgramPayment += Math.max(
      0,
      Math.floor(subroutine.amount ?? 0),
    );
  }
  payEncounterSubroutineRunCost(
    runDurationPaymentHost(host.state),
    legalAction,
    expectedPayOrEndRunPayment + expectedPayOrTrashProgramPayment,
  );
  return {
    handled: true,
    paidPayOrEndRunIndexes,
    payOrEndRunIndexesForThisContinue,
    paidPayOrTrashProgramIndexes,
    payOrTrashProgramIndexesForThisContinue,
    stateChanged:
      expectedPayOrEndRunPayment > 0 || expectedPayOrTrashProgramPayment > 0,
  };
}

export function resolveRunDurationMarkerSubroutine(
  host: EncounterResolutionHost,
  options: {
    definition: CardDefinition;
    subroutine: EncounterSubroutine;
    legalAction?: LegalAction | undefined;
  },
): RunDurationMarkerResult {
  const run = mustRun(host.state);
  const { definition, subroutine, legalAction } = options;
  const setRunMarkers: string[] = [];
  if (subroutine.type === "set_run_encounter_tax") {
    const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
    run.encounterTaxForFutureIce =
      Math.max(0, Math.floor(run.encounterTaxForFutureIce ?? 0)) + amount;
    return {
      handled: true,
      sourceDefinitionId: definition.id,
      subroutineId: subroutine.id,
      setRunMarkers: ["encounterTaxForFutureIce"],
      encounterTaxAmount: amount,
      stateChanged: amount > 0,
    };
  }
  if (subroutine.type === "set_run_break_subroutine_cost_modifier") {
    const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
    run.breakSubroutineAdditionalCost =
      runBreakSubroutineAdditionalCost(run) + amount;
    legalActionPayload(legalAction, {
      v1922CorpIceAbility: "virizz_break_cost_modifier",
      breakSubroutineAdditionalCost: run.breakSubroutineAdditionalCost,
      sourceDefinitionId: definition.id,
    });
    return {
      handled: true,
      sourceDefinitionId: definition.id,
      subroutineId: subroutine.id,
      setRunMarkers: ["breakSubroutineAdditionalCost"],
      stateChanged: amount > 0,
    };
  }
  if (subroutine.type === "set_run_future_end_the_run_subroutine") {
    if (run.encounteredIceId)
      run.futureEncounterEndTheRunSourceIceId = run.encounteredIceId;
    legalActionPayload(legalAction, {
      v1922CorpIceAbility: "tutor_future_end_the_run_subroutine",
      sourceDefinitionId: definition.id,
    });
    return {
      handled: true,
      sourceDefinitionId: definition.id,
      subroutineId: subroutine.id,
      setRunMarkers: ["futureEncounterEndTheRunSourceIceId"],
      stateChanged: true,
    };
  }
  if (subroutine.type === "set_run_active_ice_program_trash") {
    if (!run.encounteredIceId)
      throw new Error("Active ICE Program Trash benoetigt ein Encounter-ICE.");
    run.activeIceProgramTrashSourceIceId = run.encounteredIceId;
    legalActionPayload(legalAction, {
      v1922CorpIceAbility: "active_ice_program_trash_run_modifier",
      jackOutAdditionalCost: runJackOutAdditionalCost(run),
      sourceDefinitionId: definition.id,
    });
    return {
      handled: true,
      sourceDefinitionId: definition.id,
      subroutineId: subroutine.id,
      setRunMarkers: ["activeIceProgramTrashSourceIceId"],
      jackOutAdditionalCost: runJackOutAdditionalCost(run),
      mustTrashProgramAfterPass: true,
      stateChanged: true,
    };
  }
  if (subroutine.type === "set_run_jack_out_additional_cost") {
    const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
    run.jackOutAdditionalCostForRun =
      Math.max(0, Math.floor(run.jackOutAdditionalCostForRun ?? 0)) + amount;
    legalActionPayload(legalAction, {
      jackOutAdditionalCost: runJackOutAdditionalCost(run),
      sourceDefinitionId: definition.id,
    });
    return {
      handled: true,
      sourceDefinitionId: definition.id,
      subroutineId: subroutine.id,
      setRunMarkers: ["jackOutAdditionalCostForRun"],
      jackOutAdditionalCost: runJackOutAdditionalCost(run),
      stateChanged: amount > 0,
    };
  }
  if (subroutine.type === "set_run_pass_rezzed_ice_program_trash") {
    if (!run.encounteredIceId)
      throw new Error("Program-Trash-Runmodifier benoetigt ein Encounter-ICE.");
    run.passRezzedIceProgramTrashSourceIceId = run.encounteredIceId;
    legalActionPayload(legalAction, {
      passIceTrashProgramPrompt: true,
      sourceDefinitionId: definition.id,
    });
    return {
      handled: true,
      sourceDefinitionId: definition.id,
      subroutineId: subroutine.id,
      setRunMarkers: ["passRezzedIceProgramTrashSourceIceId"],
      mustTrashProgramAfterPass: true,
      stateChanged: true,
    };
  }
  if (subroutine.type === "set_run_future_strength_bonus") {
    const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
    run.futureEncounterIceStrengthBonus =
      Math.max(0, Math.floor(run.futureEncounterIceStrengthBonus ?? 0)) +
      amount;
    const cancelPayment = subroutine.runFutureStrengthCancelPaymentAmount;
    if (cancelPayment !== undefined && run.encounteredIceId) {
      run.postPassCancellableFutureIceStrength = {
        sourceCardInstanceId: run.encounteredIceId,
        sourceDefinitionId: definition.id,
        passedIceId: run.encounteredIceId,
        serverId: run.attackedServerId,
        amount,
        paymentAmount: Math.max(0, Math.floor(cancelPayment)),
      };
    }
    return {
      handled: true,
      sourceDefinitionId: definition.id,
      subroutineId: subroutine.id,
      setRunMarkers: [
        "futureEncounterIceStrengthBonus",
        ...(cancelPayment !== undefined
          ? ["postPassCancellableFutureIceStrength"]
          : []),
      ],
      stateChanged: amount > 0,
    };
  }
  if (subroutine.type === "set_next_encounter_unless_fully_break_damage") {
    const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
    run.nextEncounterFatalDamage =
      Math.max(0, Math.floor(run.nextEncounterFatalDamage ?? 0)) + amount;
    return {
      handled: true,
      sourceDefinitionId: definition.id,
      subroutineId: subroutine.id,
      setRunMarkers: ["nextEncounterFatalDamage"],
      nextEncounterDamage: amount,
      stateChanged: amount > 0,
    };
  }
  if (
    subroutine.type === "set_next_encounter_lock" ||
    subroutine.type === "set_next_encounter_no_break_subroutines"
  ) {
    run.nextEncounterNoBreakSubroutines = true;
    setRunMarkers.push("nextEncounterNoBreakSubroutines");
    if (subroutine.type === "set_next_encounter_lock") {
      run.nextEncounterJackOutLock = true;
      setRunMarkers.push("nextEncounterJackOutLock");
    }
    return {
      handled: true,
      sourceDefinitionId: definition.id,
      subroutineId: subroutine.id,
      setRunMarkers,
      stateChanged: true,
    };
  }
  if (subroutine.type === "set_run_jack_out_lock") {
    run.jackOutLockedForRun = true;
    return {
      handled: true,
      sourceDefinitionId: definition.id,
      subroutineId: subroutine.id,
      setRunMarkers: ["jackOutLockedForRun"],
      stateChanged: true,
    };
  }
  if (subroutine.type === "set_runner_forgo_next_action") {
    host.callbacks?.applyRunnerForgoNextAction?.();
    return {
      handled: true,
      sourceDefinitionId: definition.id,
      subroutineId: subroutine.id,
      setRunMarkers: ["runnerForgoNextAction"],
      stateChanged: true,
    };
  }
  return { handled: false };
}

export function appendUnpaidPayOrEndRunEffects(
  options: {
    definition: CardDefinition;
    subroutines: readonly EncounterSubroutine[];
    legalAction?: LegalAction | undefined;
    payOrEndRunIndexesForThisContinue: Set<number>;
    paidPayOrEndRunIndexes: Set<number>;
    ended: boolean;
  },
): { ended: boolean } {
  let ended = options.ended;
  for (const index of options.payOrEndRunIndexesForThisContinue) {
    if (ended) break;
    if (options.paidPayOrEndRunIndexes.has(index)) continue;
    const alreadyResolved = (options.legalAction?.resolvedEffects ?? []).some(
      (effect) =>
        effect.kind === "resolve_subroutine" &&
        effect.subroutineIndex === index,
    );
    if (alreadyResolved) continue;
    const subroutine = options.subroutines[index];
    if (!subroutine || subroutine.type !== "end_the_run_unless_runner_pays")
      continue;
    appendResolvedSubroutineEffect(
      options.legalAction,
      options.definition,
      index,
      subroutine,
      undefined,
      { paidCredits: 0, endedRun: true },
    );
    ended = true;
  }
  return { ended };
}

export function resolvePostEncounterNetDamage(
  host: EncounterResolutionHost,
  options: {
    subroutines: readonly EncounterSubroutine[];
    damageSummaries: DamageSummary[];
    legalAction?: LegalAction | undefined;
    dealDamage: (input: {
      damageId: string;
      damageType: "net";
      amount: number;
      source: string;
    }) => DamageSummary;
    setDamagePayload: (summary: DamageSummary) => void;
  },
): PostEncounterResult {
  const run = mustRun(host.state);
  const encounteredIceId = run.encounteredIceId;
  const encounterFullyBroken = encounteredIceId
    ? encounterWasFullyBrokenByRunner(run, options.subroutines)
    : false;
  if (encounteredIceId && encounterFullyBroken)
    recordRunFullyBrokenIce(run, encounteredIceId);
  if (run.fatalDamageActiveForEncounter) {
    const fatalDamageAmount = Math.max(
      0,
      Math.floor(run.fatalDamageAmountForEncounter ?? 0),
    );
    if (!encounterFullyBroken && fatalDamageAmount > 0 && encounteredIceId) {
      const summary = options.dealDamage({
        damageId: `${run.runId}.${encounteredIceId}.post_encounter_net_damage`,
        damageType: "net",
        amount: fatalDamageAmount,
        source: FATAL_ATTRACTOR_NEXT_ENCOUNTER_DAMAGE_SOURCE,
      });
      options.damageSummaries.push(summary);
      options.setDamagePayload(aggregateDamageSummaries(options.damageSummaries));
      return { handled: true, stateChanged: true };
    }
  }
  return { handled: Boolean(run.fatalDamageActiveForEncounter) };
}

export function cleanupEncounterDurationMarkers(host: EncounterResolutionHost): void {
  const run = mustRun(host.state);
  run.fatalDamageActiveForEncounter = false;
  delete run.fatalDamageAmountForEncounter;
  run.noBreakSubroutinesActive = false;
  run.jackOutLockedUntilEncounterEnds = false;
}

export function passedIceFollowupMarkersForCurrentIce(
  host: EncounterResolutionHost,
): {
  activeIceProgramTrashPendingPassedIceId?: CardInstanceId;
  passRezzedIceProgramTrashPendingPassedIceId?: CardInstanceId;
  fullyBrokenPassedIcePendingId?: CardInstanceId;
  fullyBrokenPassedIceTrashPendingId?: CardInstanceId;
} {
  const run = mustRun(host.state);
  const passedIceId = run.encounteredIceId;
  return {
    ...(run.activeIceProgramTrashSourceIceId &&
    passedIceId &&
    mustInstance(host.state.cardInstances, passedIceId).rezzed
      ? { activeIceProgramTrashPendingPassedIceId: passedIceId }
      : {}),
    ...(run.passRezzedIceProgramTrashSourceIceId &&
    passedIceId &&
    mustInstance(host.state.cardInstances, passedIceId).rezzed
      ? { passRezzedIceProgramTrashPendingPassedIceId: passedIceId }
      : {}),
    ...(passedIceId &&
    mustInstance(host.state.cardInstances, passedIceId).rezzed &&
    run.fullyBrokenIceIds?.includes(passedIceId)
      ? {
          fullyBrokenPassedIcePendingId: passedIceId,
          fullyBrokenPassedIceTrashPendingId: passedIceId,
        }
      : {}),
  };
}

export function consumeForcedJackOutAfterEncounter(
  host: EncounterResolutionHost,
  legalAction?: LegalAction,
): PostEncounterResult {
  const run = mustRun(host.state);
  if (!run.forceJackOutAfterEncounterSourceId) return { handled: false };
  legalActionPayload(legalAction, {
    forcedJackOutAfterEncounter: true,
    forceJackOutAfterEncounterSourceDefinitionId: definitionFor(
      host.state,
      run.forceJackOutAfterEncounterSourceId,
    ).id,
  });
  return {
    handled: true,
    forcedJackOutAfterEncounter: true,
    runShouldEnd: true,
  };
}

export function startActiveIceProgramTrashChoice(
  host: EncounterResolutionHost,
  passedIceId: CardInstanceId,
  legalAction?: LegalAction,
): PassIceFollowupResult {
  const state = host.state;
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const run = mustRun(state);
  const sourceIceId = run.activeIceProgramTrashSourceIceId;
  if (!sourceIceId) return { handled: false };
  if (definitionFor(state, sourceIceId).id !== ACTIVE_ICE_TRASH_PROGRAM_SOURCE)
    throw new Error("Active-ICE-Program-Trash-Quelle ist ungueltig.");
  const programOptions = state.runner.rig.programs
    .filter((cardId) => state.cardInstances[cardId])
    .sort()
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    });
  if (programOptions.length === 0) {
    legalActionPayload(legalAction, {
      v1922CorpIceAbility: "active_ice_program_trash",
      sourceDefinitionId: ACTIVE_ICE_TRASH_PROGRAM_SOURCE,
      activeIceProgramTrashChoiceOpened: false,
      trashedCount: 0,
    });
    return {
      handled: true,
      choiceOpened: false,
      sourceDefinitionId: ACTIVE_ICE_TRASH_PROGRAM_SOURCE,
    };
  }
  state.pendingChoice = {
    choiceId: `active_ice_program_trash_${state.stateVersion + 1}`,
    side: "runner",
    source: `card_implementation.active_ice_program_trash:${sourceIceId}:${passedIceId}:${state.stateVersion + 1}`,
    prompt: "Active ICE Program Trash: installiertes Programm trashen.",
    kind: "select_cards",
    options: programOptions,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalActionPayload(legalAction, {
    v1922CorpIceAbility: "active_ice_program_trash",
    sourceDefinitionId: ACTIVE_ICE_TRASH_PROGRAM_SOURCE,
    activeIceProgramTrashChoiceOpened: true,
    activeIceProgramTrashCandidateCount: programOptions.length,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "active_ice_program_trash_choice",
  });
  return {
    handled: true,
    choiceOpened: true,
    sourceDefinitionId: ACTIVE_ICE_TRASH_PROGRAM_SOURCE,
    stateChanged: true,
  };
}

export function startPassRezzedIceProgramTrashChoice(
  host: EncounterResolutionHost,
  passedIceId: CardInstanceId,
  legalAction?: LegalAction,
): PassIceFollowupResult {
  const state = host.state;
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const run = mustRun(state);
  const sourceIceId = run.passRezzedIceProgramTrashSourceIceId;
  if (!sourceIceId) return { handled: false };
  const sourceDefinition = definitionFor(state, sourceIceId);
  const programOptions = state.runner.rig.programs
    .filter((cardId) => state.cardInstances[cardId])
    .sort()
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    });
  if (programOptions.length === 0) {
    legalActionPayload(legalAction, {
      passIceTrashProgramPrompt: false,
      sourceDefinitionId: sourceDefinition.id,
      programTrashCount: 0,
    });
    return {
      handled: true,
      choiceOpened: false,
      sourceDefinitionId: sourceDefinition.id,
    };
  }
  state.pendingChoice = {
    choiceId: `p3_56_pass_ice_program_trash_${state.stateVersion + 1}`,
    side: "runner",
    source: `p3_56.pass_ice_program_trash:${sourceIceId}:${passedIceId}:${state.stateVersion + 1}`,
    prompt: `${sourceDefinition.title}: installiertes Programm trashen.`,
    kind: "select_cards",
    options: programOptions,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalActionPayload(legalAction, {
    passIceTrashProgramPrompt: true,
    sourceDefinitionId: sourceDefinition.id,
    passIceTrashProgramCandidateCount: programOptions.length,
    hiddenZoneBarrier: true,
  });
  return {
    handled: true,
    choiceOpened: true,
    sourceDefinitionId: sourceDefinition.id,
    stateChanged: true,
  };
}

export function resolveActiveIceProgramTrashChoice(
  host: EncounterResolutionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): PassIceFollowupResult {
  const state = host.state;
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("card_implementation.active_ice_program_trash"))
    throw new Error("Active-ICE-Program-Trash-Choice ist nicht offen.");
  const [, sourceIceId, passedIceId] = choice.source.split(":");
  if (
    !sourceIceId ||
    !state.cardInstances[sourceIceId] ||
    definitionFor(state, sourceIceId).id !== ACTIVE_ICE_TRASH_PROGRAM_SOURCE
  )
    throw new Error("Active-ICE-Program-Trash-Quelle ist nicht mehr gueltig.");
  if (!passedIceId || !state.cardInstances[passedIceId])
    throw new Error("Das passierte ICE fuer Active ICE Program Trash fehlt.");
  const selectedProgramId = selectedChoiceCardIds(choice, playerAction)[0];
  if (
    !selectedProgramId ||
    !state.runner.rig.programs.includes(selectedProgramId)
  )
    throw new Error("Das gewaehlte Programm ist nicht installiert.");
  const selectedDefinitionId = definitionFor(state, selectedProgramId).id;
  if (!host.callbacks?.trashRunnerInstalledProgram)
    throw new Error("Programmtrash-Callback fehlt.");
  host.callbacks.trashRunnerInstalledProgram(selectedProgramId);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922CorpIceAbility: "active_ice_program_trash",
    sourceDefinitionId: ACTIVE_ICE_TRASH_PROGRAM_SOURCE,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "active_ice_program_trash",
    trashedCount: 1,
    trashedCardDefinitionId: selectedDefinitionId,
  };
  return {
    handled: true,
    sourceDefinitionId: ACTIVE_ICE_TRASH_PROGRAM_SOURCE,
    stateChanged: true,
  };
}

export function resolvePassRezzedIceProgramTrashChoice(
  host: EncounterResolutionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): PassIceFollowupResult {
  const state = host.state;
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_56.pass_ice_program_trash"))
    throw new Error("Pass-ICE-Programmtrash-Choice ist nicht offen.");
  const [, sourceIceId, passedIceId] = choice.source.split(":");
  if (!sourceIceId || !state.cardInstances[sourceIceId])
    throw new Error("Die Programmtrash-Quelle ist nicht mehr gueltig.");
  if (!passedIceId || !state.cardInstances[passedIceId])
    throw new Error("Das passierte ICE fuer Programmtrash fehlt.");
  const selectedProgramId = selectedChoiceCardIds(choice, playerAction)[0];
  if (
    !selectedProgramId ||
    !state.runner.rig.programs.includes(selectedProgramId)
  )
    throw new Error("Das gewaehlte Programm ist nicht installiert.");
  const selectedDefinitionId = definitionFor(state, selectedProgramId).id;
  if (!host.callbacks?.trashRunnerInstalledProgram)
    throw new Error("Programmtrash-Callback fehlt.");
  host.callbacks.trashRunnerInstalledProgram(selectedProgramId);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    passIceTrashProgramPrompt: false,
    sourceDefinitionId: definitionFor(state, sourceIceId).id,
    hiddenZoneBarrier: true,
    programTrashCount: 1,
    trashedCardDefinitionId: selectedDefinitionId,
  };
  return {
    handled: true,
    sourceDefinitionId: definitionFor(state, sourceIceId).id,
    stateChanged: true,
  };
}

export function handlePostPassProgramTrashChoices(
  host: EncounterResolutionHost,
  legalAction?: LegalAction,
): PassIceFollowupResult {
  const run = mustRun(host.state);
  if (run.activeIceProgramTrashPendingPassedIceId) {
    const pendingPassedIceId = run.activeIceProgramTrashPendingPassedIceId;
    const { activeIceProgramTrashPendingPassedIceId: _pending, ...runWithoutPending } = run;
    void _pending;
    host.state.run = runWithoutPending;
    const result = startActiveIceProgramTrashChoice(
      host,
      pendingPassedIceId,
      legalAction,
    );
    if (result.choiceOpened) return result;
  }
  if (host.state.run?.passRezzedIceProgramTrashPendingPassedIceId) {
    const pendingPassedIceId =
      host.state.run.passRezzedIceProgramTrashPendingPassedIceId;
    const {
      passRezzedIceProgramTrashPendingPassedIceId: _pending,
      ...runWithoutPending
    } = host.state.run;
    void _pending;
    host.state.run = runWithoutPending;
    const result = startPassRezzedIceProgramTrashChoice(
      host,
      pendingPassedIceId,
      legalAction,
    );
    if (result.choiceOpened) return result;
  }
  return { handled: false };
}

export function clearFullyBrokenPassedIceTrashPostPassMarker(
  host: EncounterResolutionHost,
): void {
  const run = host.state.run;
  if (!run?.fullyBrokenPassedIceTrashPendingId) return;
  const {
    fullyBrokenPassedIceTrashPendingId: _fullyBrokenPassedIceTrashPending,
    ...runWithoutFullyBrokenPassedIceTrashPending
  } = run;
  void _fullyBrokenPassedIceTrashPending;
  host.state.run = runWithoutFullyBrokenPassedIceTrashPending;
}

export function clearFullyBrokenPassedIcePostPassMarker(
  host: EncounterResolutionHost,
): void {
  const run = host.state.run;
  if (!run?.fullyBrokenPassedIcePendingId) return;
  const {
    fullyBrokenPassedIcePendingId: _fullyBrokenPassedIcePendingId,
    ...runWithoutPending
  } = run;
  void _fullyBrokenPassedIcePendingId;
  host.state.run = runWithoutPending;
}

export function appendResolvedSubroutineEffect(
  legalAction: LegalAction | undefined,
  definition: CardDefinition,
  subroutineIndex: number,
  subroutine: EncounterSubroutine,
  damageSummary?: DamageSummary,
  options: {
    paidCredits?: number;
    endedRun?: boolean;
    cardDefinitionId?: string;
    cardTitle?: string;
    cardsTrashed?: number;
  } = {},
): void {
  if (!legalAction) return;
  const dynamicAttribution = dynamicSubroutineAttributionFor(subroutine);
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    {
      effectId: `subroutine_${subroutineIndex + 1}`,
      kind: "resolve_subroutine",
      visibility: "public",
      side: "runner",
      reason: "ice_subroutine",
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      subroutineIndex,
      subroutineType: subroutine.type,
      ...(dynamicAttribution
        ? {
            cardDefinitionId: dynamicAttribution.sourceDefinitionId,
            cardTitle: dynamicAttribution.sourceTitle,
          }
        : {}),
      ...(damageSummary
        ? {
            damageType: damageSummary.damageType,
            amount: damageSummary.amount,
            cardsTrashed: damageSummary.cardsTrashed,
          }
        : {}),
      ...(options.paidCredits !== undefined
        ? { paidCredits: options.paidCredits }
        : {}),
      ...(options.cardDefinitionId
        ? { cardDefinitionId: options.cardDefinitionId }
        : {}),
      ...(options.cardTitle ? { cardTitle: options.cardTitle } : {}),
      ...(options.cardsTrashed !== undefined
        ? { cardsTrashed: options.cardsTrashed }
        : {}),
      ...(subroutine.type === "end_the_run" || options.endedRun
        ? { endedRun: true }
        : {}),
    },
  ];
}

export function encounterWasFullyBrokenByRunner(
  run: ActiveRun,
  subroutines: readonly EncounterSubroutine[],
): boolean {
  if (subroutines.length === 0) return true;
  for (let index = 0; index < subroutines.length; index += 1) {
    const subroutine = subroutines[index];
    if (!subroutine) continue;
    if (!run.brokenSubroutineIndexes.includes(index)) return false;
  }
  return true;
}

export function recordRunFullyBrokenIce(run: ActiveRun, iceId: CardInstanceId): void {
  const current = run.fullyBrokenIceIds ?? [];
  if (current.includes(iceId)) return;
  run.fullyBrokenIceIds = [...current, iceId].sort();
}

function encounterSubroutinesForNextContinue(
  run: ActiveRun,
  subroutines: readonly EncounterSubroutine[],
): EncounterSubroutine[] {
  return encounterSubroutineIndexesForNextContinue(run, subroutines).flatMap(
    (index) => (subroutines[index] ? [subroutines[index]!] : []),
  );
}

function encounterSubroutineIndexesForNextContinue(
  run: ActiveRun,
  subroutines: readonly EncounterSubroutine[],
): number[] {
  const indexes: number[] = [];
  for (let index = 0; index < subroutines.length; index += 1) {
    const subroutine = subroutines[index];
    if (
      !subroutine ||
      run.brokenSubroutineIndexes.includes(index) ||
      run.resolvedSubroutineIndexes.includes(index)
    )
      continue;
    indexes.push(index);
    if (subroutine.type === "initiate_trace") break;
  }
  return indexes;
}

function aggregateDamageSummaries(summaries: DamageSummary[]): DamageSummary {
  return summaries.reduce<DamageSummary>(
    (aggregate, summary) => ({
      damageType: summary.damageType,
      amount: aggregate.amount + summary.amount,
      cardsTrashed: aggregate.cardsTrashed + summary.cardsTrashed,
      flatline: aggregate.flatline || summary.flatline,
      ...(aggregate.runnerGripBefore !== undefined
        ? { runnerGripBefore: aggregate.runnerGripBefore }
        : summary.runnerGripBefore !== undefined
          ? { runnerGripBefore: summary.runnerGripBefore }
          : {}),
      ...(summary.runnerGripAfter !== undefined
        ? { runnerGripAfter: summary.runnerGripAfter }
        : aggregate.runnerGripAfter !== undefined
          ? { runnerGripAfter: aggregate.runnerGripAfter }
          : {}),
      ...(summary.coreDamageAfter !== undefined
        ? { coreDamageAfter: summary.coreDamageAfter }
        : {}),
      ...(summary.runnerMaxHandSizeAfter !== undefined
        ? { runnerMaxHandSizeAfter: summary.runnerMaxHandSizeAfter }
        : {}),
    }),
    {
      damageType: summaries[0]?.damageType ?? "net",
      amount: 0,
      cardsTrashed: 0,
      flatline: false,
    },
  );
}

function runBreakSubroutineAdditionalCost(run: GameState["run"]): number {
  return Math.max(0, Math.floor(run?.breakSubroutineAdditionalCost ?? 0));
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

function selectedChoiceIds(
  selectedChoices: PlayerAction["selectedChoices"],
): string[] {
  const raw =
    selectedChoices?.selectedOptionIds ??
    selectedChoices?.optionIds ??
    selectedChoices?.options ??
    selectedChoices?.selectedOptions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string");
}

export function selectedChoiceCardIds(
  choice: NonNullable<GameState["pendingChoice"]>,
  playerAction: PlayerAction,
): CardInstanceId[] {
  const selectedIds = selectedChoiceIds(playerAction.selectedChoices);
  return selectedIds.flatMap((optionId) => {
    const option = choice.options.find((candidate) => candidate.id === optionId);
    return typeof option?.value === "string"
      ? [option.value as CardInstanceId]
      : [];
  });
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  const instance = mustInstance(state.cardInstances, id);
  const definition = DEMO_CARDS_BY_ID[instance.definitionId];
  if (!definition) throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
  return definition;
}

function mustInstance(
  source: Record<CardInstanceId, CardInstance>,
  id: CardInstanceId,
): CardInstance {
  const instance = source[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  return instance;
}

function mustRun(state: GameState): ActiveRun {
  if (!state.run) throw new Error("Es läuft kein Run.");
  return state.run;
}
