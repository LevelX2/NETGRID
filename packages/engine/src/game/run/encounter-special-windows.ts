import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type ChoiceRequest,
  type CorpServer,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type Side,
  type SubroutineDefinition,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { STARTUP_IMMOLATOR_TRASH_ICE_PROGRAM_ID } from "../../mechanics/longtail-card-effects";
import { buildLegalAction } from "../turn/action-builders";

type ActiveRun = NonNullable<GameState["run"]>;

export type EncounterSpecialWindowHost = {
  state: GameState;
  callbacks?: {
    derezCorpInstalledCard?: (cardId: CardInstanceId) => void;
    finishRun?: (successful: boolean, legalAction?: LegalAction) => void;
    quoteIceRezCost?: (iceId: CardInstanceId) => number;
    resetBreakerStrength?: () => void;
    rollDie?: (purpose: string) => number;
    spendCredits?: (side: Side, amount: number) => void;
    trashCorpInstalledCard?: (cardId: CardInstanceId) => void;
  };
};

export type EncounterSpecialWindowResult = {
  handled: boolean;
  suspended?: boolean;
  runShouldEnd?: boolean;
  stateChanged?: boolean;
};

export type TooManyDoorsSecretBidResult = EncounterSpecialWindowResult & {
  secretBidCorpAmount?: number;
  secretBidRunnerAmount?: number;
  revealed?: boolean;
};

export type VacuumLinkRepositionResult = EncounterSpecialWindowResult & {
  dieRoll?: number;
  repositionIceId?: CardInstanceId;
  repositionIndex?: number;
  runnerJacksOut?: boolean;
};

export type StartupImmolatorWindowResult = EncounterSpecialWindowResult & {
  sourceCardId?: CardInstanceId;
  iceId?: CardInstanceId;
  paymentAmount?: number;
  paid?: boolean;
  iceTrashed?: boolean;
};

export type FullyBrokenPassedIceWindowResult = EncounterSpecialWindowResult & {
  sourceCardId?: CardInstanceId;
  iceId?: CardInstanceId;
  paymentAmount?: number;
  paid?: boolean;
  iceDerezzed?: boolean;
};

export type SubmarinePostBidMarkerResult = EncounterSpecialWindowResult & {
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: string;
  forcedJackOutAfterEncounter?: boolean;
};

export type PostPassIceWindowResult = EncounterSpecialWindowResult & {
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: string;
  dieRoll?: number;
};

export function encounterSpecialWindowHost(
  state: GameState,
  callbacks: EncounterSpecialWindowHost["callbacks"] = {},
): EncounterSpecialWindowHost {
  return { state, callbacks };
}

export function resolveEncounterSpecialWindowSubroutine(
  host: EncounterSpecialWindowHost,
  options: {
    definition: CardDefinition;
    subroutine: SubroutineDefinition;
    subroutineIndex: number;
    legalAction?: LegalAction | undefined;
  },
): EncounterSpecialWindowResult {
  const { subroutine, subroutineIndex, legalAction } = options;
  if (
    subroutine.type ===
    "secret_spend_compare_end_run_unless_corp_spent_at_least_runner"
  ) {
    const run = mustRun(host.state);
    startTooManyDoorsSecretSpendCorpChoice(
      host,
      mustEncounteredIce(run),
      subroutineIndex,
      legalAction,
    );
    if (!run.resolvedSubroutineIndexes.includes(subroutineIndex))
      run.resolvedSubroutineIndexes.push(subroutineIndex);
    return { handled: true, suspended: true, stateChanged: true };
  }
  if (subroutine.type === "rewind_run_to_rezzed_ice_by_die")
    return resolveVacuumLinkRewindSubroutine(host, legalAction);
  return { handled: false };
}

export function startTooManyDoorsSecretSpendCorpChoice(
  host: EncounterSpecialWindowHost,
  sourceIceId: CardInstanceId,
  subroutineIndex: number,
  legalAction?: LegalAction,
): TooManyDoorsSecretBidResult {
  const state = host.state;
  if (state.pendingChoice || state.secretSpendComparison)
    throw new Error("Es ist bereits eine Secret-Spend-Choice offen.");
  const run = mustRun(state);
  const source = `p3_56.too_many_doors_secret_spend:${run.runId}:${sourceIceId}:${subroutineIndex}`;
  state.secretSpendComparison = {
    source: "too_many_doors",
    runId: run.runId,
    sourceIceId,
    subroutineIndex,
  };
  state.pendingChoice = secretSpendChoice(
    state,
    "corp",
    source,
    "Too Many Doors: Korp geheim 0, 1 oder 2 Credits ausgeben.",
    state.corp.credits,
  );
  state.activeSide = "corp";
  legalActionPayload(legalAction, {
    secretSpendStarted: true,
    sourceDefinitionId: definitionFor(state, sourceIceId).id,
    secretSpendAmounts: "0,1,2",
  });
  return { handled: true, stateChanged: true };
}

export function resolveTooManyDoorsSecretSpendChoice(
  host: EncounterSpecialWindowHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): TooManyDoorsSecretBidResult {
  const state = host.state;
  const choice = state.pendingChoice;
  const comparison = state.secretSpendComparison;
  if (
    !choice ||
    !comparison ||
    !choice.source.startsWith("p3_56.too_many_doors_secret_spend")
  )
    throw new Error("Too-Many-Doors-Secret-Spend-Choice ist nicht offen.");
  const selected = selectedBidAmount(choice, playerAction);
  if (selected < 0 || selected > 2)
    throw new Error("Too Many Doors erlaubt nur 0, 1 oder 2 Credits.");
  if (choice.side === "corp") {
    if (state.corp.credits < selected)
      throw new Error("Die Korp kann diesen Secret Spend nicht bezahlen.");
    state.secretSpendComparison = {
      ...comparison,
      corpSpend: selected,
    };
    state.pendingChoice = secretSpendChoice(
      state,
      "runner",
      choice.source,
      "Too Many Doors: Runner geheim 0, 1 oder 2 Credits ausgeben.",
      state.runner.credits,
    );
    state.activeSide = "runner";
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      secretSpendStep: "corp_selected",
      sourceDefinitionId: definitionFor(state, comparison.sourceIceId).id,
      hiddenInfoBarrier: true,
    };
    return {
      handled: true,
      secretBidCorpAmount: selected,
      stateChanged: true,
    };
  }
  const corpSpend = comparison.corpSpend;
  if (corpSpend === undefined)
    throw new Error("Der Korp-Secret-Spend fehlt.");
  if (state.corp.credits < corpSpend || state.runner.credits < selected)
    throw new Error("Secret Spend ist nicht mehr bezahlbar.");
  spendCredits(host, "corp", corpSpend);
  spendCredits(host, "runner", selected);
  const endRun = corpSpend < selected;
  delete state.pendingChoice;
  delete state.secretSpendComparison;
  if (state.run) {
    state.timingPoint = "run.encounter_ice";
    state.activeSide = "runner";
    if (endRun) host.callbacks?.finishRun?.(false, legalAction);
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    choiceVisibility: "public",
    secretSpendRevealed: true,
    secretSpendCorp: corpSpend,
    secretSpendRunner: selected,
    tooManyDoorsEndRun: endRun,
    sourceDefinitionId: definitionFor(state, comparison.sourceIceId).id,
  };
  return {
    handled: true,
    secretBidCorpAmount: corpSpend,
    secretBidRunnerAmount: selected,
    revealed: true,
    runShouldEnd: endRun,
    stateChanged: true,
  };
}

export function resolveVacuumLinkRewindSubroutine(
  host: EncounterSpecialWindowHost,
  legalAction?: LegalAction,
): VacuumLinkRepositionResult {
  const state = host.state;
  const run = mustRun(state);
  if (!run.encounteredIceId)
    throw new Error("Vacuum-Link-Rewind benötigt einen aktiven ICE-Encounter.");
  if (run.position.kind !== "ice")
    throw new Error("Vacuum-Link-Rewind erwartet eine ICE-Position.");
  const server = mustServer(state, run.position.serverId);
  const currentIndex =
    server.ice[run.position.iceIndex] === run.encounteredIceId
      ? run.position.iceIndex
      : server.ice.findIndex((cardId) => cardId === run.encounteredIceId);
  if (currentIndex < 0)
    throw new Error(
      "Vacuum-Link-Rewind konnte das Encounter-ICE nicht finden.",
    );

  const randomPurpose = `${definitionFor(state, run.encounteredIceId).id}.rewind.${run.runId}.${run.encounteredIceId}`;
  const die = rollDie(host, randomPurpose);
  legalActionPayload(legalAction, { vacuumLinkDieRoll: die });
  if (die >= 4) {
    legalActionPayload(legalAction, { vacuumLinkRewindApplied: false });
    return {
      handled: true,
      dieRoll: die,
      stateChanged: false,
    };
  }

  let targetIndex = outermostIceIndex(server);
  let remainingRezzedBack = die;
  for (let index = currentIndex + 1; index < server.ice.length; index += 1) {
    const cardId = server.ice[index];
    if (!cardId || !mustInstance(state.cardInstances, cardId).rezzed) continue;
    remainingRezzedBack -= 1;
    if (remainingRezzedBack === 0) {
      targetIndex = index;
      break;
    }
  }
  if (remainingRezzedBack > 0) targetIndex = outermostIceIndex(server);
  const targetIceId = mustArrayValue(
    server.ice,
    targetIndex,
    "Vacuum-Link-Ziel-ICE fehlt.",
  );

  const {
    encounteredIceId: _encounteredIceId,
    accessedCardId: _accessedCardId,
    ...runWithoutEncounter
  } = run;
  void _encounteredIceId;
  void _accessedCardId;
  state.run = {
    ...runWithoutEncounter,
    phase: "movement",
    position: { kind: "ice", serverId: server.id, iceIndex: targetIndex },
    approachedIceId: targetIceId,
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
  };
  state.timingPoint = "run.jack_out_window";
  state.activeSide = "runner";
  host.callbacks?.resetBreakerStrength?.();
  legalActionPayload(legalAction, {
    vacuumLinkRewindApplied: true,
    vacuumLinkRewindRezzedIceBack: die,
    vacuumLinkTargetIceId: targetIceId,
    vacuumLinkTargetIceIndex: targetIndex,
  });
  return {
    handled: true,
    suspended: true,
    dieRoll: die,
    repositionIceId: targetIceId,
    repositionIndex: targetIndex,
    stateChanged: true,
  };
}

export function applyRioDeJaneiroCityGridPassedIceTrigger(
  host: EncounterSpecialWindowHost,
  passedIceId: CardInstanceId,
  legalAction?: LegalAction,
): PostPassIceWindowResult {
  const state = host.state;
  const run = mustRun(state);
  if (run.position.kind !== "ice") return { handled: false };
  const server = mustServer(state, run.position.serverId);
  const rioIds = server.root
    .filter((cardId) => {
      const instance = state.cardInstances[cardId];
      return (
        instance?.rezzed === true &&
        isRioPassRezzedIceSource(state, cardId)
      );
    })
    .sort();
  if (rioIds.length === 0) return { handled: false };

  for (const rioId of rioIds) {
    const rioDefinitionId = definitionFor(state, rioId).id;
    const randomPurpose = `v1921.die.${rioDefinitionId}.passed_ice.${run.runId}.${passedIceId}.${rioId}`;
    const dieRoll = rollDie(host, randomPurpose);
    const runEnded = dieRoll === 1;
    legalActionPayload(legalAction, {
      v1921UpgradeAbility: "rio_de_janeiro_passed_ice",
      sourceCardId: rioId,
      sourceDefinitionId: rioDefinitionId,
      passedIceId,
      passedIceDefinitionId: definitionFor(state, passedIceId).id,
      ...(server.label ? { serverLabel: server.label } : {}),
      v1921DieRoll: dieRoll,
      randomPurpose,
      randomCounterAfter: state.randomCounter,
      rioRunEnded: runEnded,
    });
    if (runEnded) {
      host.callbacks?.finishRun?.(false, legalAction);
      return {
        handled: true,
        sourceCardId: rioId,
        sourceDefinitionId: rioDefinitionId,
        dieRoll,
        runShouldEnd: true,
        stateChanged: true,
      };
    }
  }
  return { handled: true, stateChanged: true };
}

export function startupImmolatorPostPassActions(
  host: EncounterSpecialWindowHost,
): LegalAction[] {
  const state = host.state;
  const run = state.run;
  const targetIceId = run?.startupImmolatorPendingPassedIceId;
  if (!run || !targetIceId || !state.cardInstances[targetIceId]) return [];
  if (!rezzedInstalledIceIds(state).includes(targetIceId)) return [];
  if (!run.fullyBrokenIceIds?.includes(targetIceId)) return [];
  const used = new Set(
    ensureRunnerTurnFlags(state).startupImmolatorUsedSourceIdsThisTurn ?? [],
  );
  const rezCost = quoteIceRezCost(host, targetIceId);
  if (state.runner.credits < rezCost) return [];
  const targetDefinition = definitionFor(state, targetIceId);
  return state.runner.rig.programs
    .filter((cardId) => isStartupImmolatorSource(state, cardId))
    .filter((cardId) => !used.has(cardId))
    .sort()
    .map((sourceCardId) =>
      buildLegalAction(
        state,
        "runner",
        "trigger_ability",
        `${definitionFor(state, sourceCardId).title}: ICE trashen`,
        sourceCardId,
        rezCost > 0 ? [{ credits: rezCost }] : [],
        {
          cardId: sourceCardId,
          targetIceId,
          targetIceDefinitionId: targetDefinition.id,
          v1922RunnerProgramAbility: "startup_immolator_trash_ice",
          rezCostPaid: rezCost,
        },
      ),
    );
}

export function fullyBrokenPassedIcePostPassActions(
  host: EncounterSpecialWindowHost,
): LegalAction[] {
  const state = host.state;
  const run = state.run;
  const targetIceId = run?.fullyBrokenPassedIcePendingId;
  if (!run || !targetIceId || !state.cardInstances[targetIceId]) return [];
  if (!rezzedInstalledIceIds(state).includes(targetIceId)) return [];
  if (!run.fullyBrokenIceIds?.includes(targetIceId)) return [];
  const targetDefinition = definitionFor(state, targetIceId);
  return state.runner.rig.programs
    .filter((cardId) => fullyBrokenPassedIceDerezImplementationForCard(state, cardId))
    .filter((cardId) => {
      const implementation = fullyBrokenPassedIceDerezImplementationForCard(
        state,
        cardId,
      );
      const amount = Math.max(0, Math.floor(implementation?.cost.amount ?? 0));
      return state.runner.credits >= amount;
    })
    .sort()
    .map((sourceCardId) => {
      const sourceDefinition = definitionFor(state, sourceCardId);
      const implementation = fullyBrokenPassedIceDerezImplementationForCard(
        state,
        sourceCardId,
      );
      const amount = Math.max(0, Math.floor(implementation?.cost.amount ?? 0));
      return buildLegalAction(
        state,
        "runner",
        "trigger_ability",
        `${sourceDefinition.title}: ICE derezzen und Run beenden`,
        sourceCardId,
        amount > 0 ? [{ credits: amount }] : [],
        {
          cardId: sourceCardId,
          targetIceId,
          targetIceDefinitionId: targetDefinition.id,
          runnerUtilityAbility: "derez_fully_broken_passed_ice_and_end_run",
          paymentAmount: amount,
        },
      );
    });
}

export function resolveFullyBrokenPassedIceDerezAndEndRun(
  host: EncounterSpecialWindowHost,
  legalAction: LegalAction,
): FullyBrokenPassedIceWindowResult {
  const state = host.state;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf diese Post-Pass-Faehigkeit nutzen.");
  const run = mustRun(state);
  if (run.phase !== "movement")
    throw new Error("Die Post-Pass-Faehigkeit ist nur nach dem Passieren von ICE legal.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  const targetIceId = String(legalAction.payload?.targetIceId ?? "") as CardInstanceId;
  if (!state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Die Post-Pass-Quelle ist nicht installiert.");
  const implementation = fullyBrokenPassedIceDerezImplementationForCard(
    state,
    sourceCardId,
  );
  if (!implementation)
    throw new Error("Die Post-Pass-Faehigkeit passt nicht zur Karte.");
  if (
    !targetIceId ||
    run.fullyBrokenPassedIcePendingId !== targetIceId ||
    !run.fullyBrokenIceIds?.includes(targetIceId) ||
    !rezzedInstalledIceIds(state).includes(targetIceId)
  )
    throw new Error("Das Post-Pass-ICE-Ziel ist nicht legal.");
  const amount = Math.max(0, Math.floor(implementation.cost.amount));
  const paid = Number(legalAction.payload?.paymentAmount ?? amount);
  if (!Number.isInteger(paid) || paid !== amount)
    throw new Error("Die Post-Pass-Kosten passen nicht mehr.");
  spendCredits(host, "runner", amount);
  const targetDefinitionId = definitionFor(state, targetIceId).id;
  if (!host.callbacks?.derezCorpInstalledCard)
    throw new Error("Corp-Derez-Callback fehlt.");
  host.callbacks.derezCorpInstalledCard(targetIceId);
  const {
    fullyBrokenPassedIcePendingId: _fullyBrokenPassedIcePendingId,
    ...runWithoutPending
  } = run;
  void _fullyBrokenPassedIcePendingId;
  if (state.run) state.run = runWithoutPending;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runnerUtilityAbility: "derez_fully_broken_passed_ice_and_end_run",
    sourceDefinitionId: definitionFor(state, sourceCardId).id,
    targetIceDefinitionId: targetDefinitionId,
    targetCardDefinitionId: targetDefinitionId,
    paymentAmount: amount,
    paidCredits: amount,
    derezzedCount: 1,
    endedRun: true,
    runnerCreditsAfter: state.runner.credits,
  };
  host.callbacks?.finishRun?.(false, legalAction);
  return {
    handled: true,
    sourceCardId,
    iceId: targetIceId,
    paymentAmount: amount,
    paid: amount > 0,
    iceDerezzed: true,
    runShouldEnd: true,
    stateChanged: true,
  };
}

export function resolveStartupImmolatorTrashIce(
  host: EncounterSpecialWindowHost,
  legalAction: LegalAction,
): StartupImmolatorWindowResult {
  const state = host.state;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Startup Immolator nutzen.");
  const run = mustRun(state);
  if (run.phase !== "movement")
    throw new Error("Startup Immolator ist nur nach dem Passieren von ICE legal.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  const targetIceId = String(legalAction.payload?.targetIceId ?? "");
  if (!state.runner.rig.programs.includes(sourceCardId as CardInstanceId))
    throw new Error("Startup Immolator ist nicht installiert.");
  if (!isStartupImmolatorSource(state, sourceCardId as CardInstanceId))
    throw new Error("Die Startup-Immolator-Faehigkeit passt nicht zur Karte.");
  const flags = ensureRunnerTurnFlags(state);
  const used = flags.startupImmolatorUsedSourceIdsThisTurn ?? [];
  if (used.includes(sourceCardId as CardInstanceId))
    throw new Error("Startup Immolator wurde in diesem Zug bereits genutzt.");
  if (
    !targetIceId ||
    run.startupImmolatorPendingPassedIceId !== targetIceId ||
    !run.fullyBrokenIceIds?.includes(targetIceId as CardInstanceId) ||
    !rezzedInstalledIceIds(state).includes(targetIceId as CardInstanceId)
  )
    throw new Error("Das Startup-Immolator-Ziel ist nicht legal.");
  const rezCost = quoteIceRezCost(host, targetIceId as CardInstanceId);
  const paid = Number(legalAction.payload?.rezCostPaid ?? rezCost);
  if (!Number.isInteger(paid) || paid !== rezCost)
    throw new Error("Startup Immolator muss exakt die Rez-Kosten zahlen.");
  spendCredits(host, "runner", rezCost);
  const targetDefinitionId = definitionFor(
    state,
    targetIceId as CardInstanceId,
  ).id;
  if (!host.callbacks?.trashCorpInstalledCard)
    throw new Error("Corp-Trash-Callback fehlt.");
  host.callbacks.trashCorpInstalledCard(targetIceId as CardInstanceId);
  flags.startupImmolatorUsedSourceIdsThisTurn = [
    ...used,
    sourceCardId as CardInstanceId,
  ];
  const {
    startupImmolatorPendingPassedIceId: _startupPending,
    ...runWithoutStartupPending
  } = run;
  void _startupPending;
  if (state.run) state.run = runWithoutStartupPending;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerProgramAbility: "startup_immolator_trash_ice",
    sourceDefinitionId: definitionFor(state, sourceCardId as CardInstanceId).id,
    targetIceDefinitionId: targetDefinitionId,
    rezCostPaid: rezCost,
    trashedCount: 1,
    trashedCardDefinitionId: targetDefinitionId,
    runnerCreditsAfter: state.runner.credits,
    startupImmolatorExhausted: true,
  };
  return {
    handled: true,
    sourceCardId: sourceCardId as CardInstanceId,
    iceId: targetIceId as CardInstanceId,
    paymentAmount: rezCost,
    paid: rezCost > 0,
    iceTrashed: true,
    stateChanged: true,
  };
}

export function isSubmarineUplinkSource(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  return (
    cardImplementationForDefinitionId(definitionFor(state, cardId).id)
      ?.runnerUtilityLongtail?.kind ===
    "submarine_uplink_trace_link_force_jack_out"
  );
}

export function markSubmarineUplinkJackOutAfterEncounter(
  host: EncounterSpecialWindowHost,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): SubmarinePostBidMarkerResult {
  const state = host.state;
  if (!state.run || !isSubmarineUplinkSource(state, cardId))
    return { handled: false };
  state.run.forceJackOutAfterEncounterSourceId = cardId;
  const sourceDefinitionId = definitionFor(state, cardId).id;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    forceJackOutAfterEncounter: true,
    sourceDefinitionId,
  };
  return {
    handled: true,
    sourceCardId: cardId,
    sourceDefinitionId,
    forcedJackOutAfterEncounter: true,
    stateChanged: true,
  };
}

function secretSpendChoice(
  state: GameState,
  side: Side,
  source: string,
  prompt: string,
  maxSpend: number,
): ChoiceRequest {
  const boundedMax = Math.min(2, Math.max(0, Math.floor(maxSpend)));
  return {
    choiceId: `${source}.${side}.${state.stateVersion + 1}`,
    side,
    source,
    prompt,
    kind: "bid_amount",
    options: Array.from({ length: boundedMax + 1 }, (_, amount) => ({
      id: `bid_${amount}`,
      label: `${amount} Credits`,
      publicLabel: `${amount} Credits`,
      value: amount,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function selectedBidAmount(
  choice: ChoiceRequest | undefined,
  playerAction: PlayerAction,
): number {
  if (!choice) throw new Error("Es ist keine Bid-Choice offen.");
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
  const selected = choice.options.find(
    (option) => option.id === selectedOptionId,
  );
  const amount =
    typeof selected?.value === "number" ? selected.value : Number.NaN;
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Der Trace-Bid ist ungueltig.");
  return amount;
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

function isStartupImmolatorSource(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const definition = definitionFor(state, cardId);
  return (
    cardImplementationForDefinitionId(definition.id)?.runnerUtilityLongtail
      ?.kind === "startup_immolator_trash_fully_broken_ice" ||
    definition.id === STARTUP_IMMOLATOR_TRASH_ICE_PROGRAM_ID
  );
}

function fullyBrokenPassedIceDerezImplementationForCard(
  state: GameState,
  cardId: CardInstanceId,
):
  | {
      kind: "derez_fully_broken_passed_ice_and_end_run";
      cost: { kind: "credit"; amount: number };
      timing: "after_passing_fully_broken_ice";
      target: "that_ice";
      visibility: "public";
    }
  | undefined {
  const implementation = cardImplementationForDefinitionId(
    definitionFor(state, cardId).id,
  )?.runnerUtilityLongtail;
  return implementation?.kind === "derez_fully_broken_passed_ice_and_end_run"
    ? implementation
    : undefined;
}

function isRioPassRezzedIceSource(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  return (
    cardImplementationForDefinitionId(definitionFor(state, cardId).id)
      ?.fortRunWindows?.some(
        (window) => window.kind === "roll_die_on_pass_rezzed_ice_on_same_fort",
      ) === true
  );
}

function rezzedInstalledIceIds(state: GameState): CardInstanceId[] {
  const installed: CardInstanceId[] = [];
  for (const server of state.corp.servers)
    installed.push(...server.ice);
  return installed.filter((cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    return instance.zone.zone === "serverIce" && instance.rezzed;
  });
}

function quoteIceRezCost(
  host: EncounterSpecialWindowHost,
  iceId: CardInstanceId,
): number {
  if (!host.callbacks?.quoteIceRezCost)
    throw new Error("Rez-Kosten-Callback fehlt.");
  return host.callbacks.quoteIceRezCost(iceId);
}

function spendCredits(
  host: EncounterSpecialWindowHost,
  side: Side,
  amount: number,
): void {
  if (amount <= 0) return;
  if (!host.callbacks?.spendCredits)
    throw new Error("Payment-Callback fehlt.");
  host.callbacks.spendCredits(side, amount);
}

function rollDie(host: EncounterSpecialWindowHost, purpose: string): number {
  if (!host.callbacks?.rollDie) throw new Error("RNG-Callback fehlt.");
  return host.callbacks.rollDie(purpose);
}

function outermostIceIndex(server: CorpServer): number {
  return server.ice.length - 1;
}

function mustArrayValue<T>(values: readonly T[], index: number, message: string): T {
  const value = values[index];
  if (value === undefined) throw new Error(message);
  return value;
}

function mustEncounteredIce(run: ActiveRun): CardInstanceId {
  if (!run.encounteredIceId)
    throw new Error("Es gibt kein aktives Encounter-ICE.");
  return run.encounteredIceId;
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

function ensureRunnerTurnFlags(state: GameState): NonNullable<GameState["runnerTurnFlags"]> {
  state.runnerTurnFlags ??= {
    stoleAgendaThisTurn: false,
    stoleAgendaLastTurn: false,
  };
  return state.runnerTurnFlags;
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

function mustServer(state: GameState, id: string): CorpServer {
  const server = state.corp.servers.find((candidate) => candidate.id === id);
  if (!server) throw new Error(`Server fehlt: ${id}`);
  return server;
}
