/**
 * Interprets declarative CardImplementation effects against the current state.
 *
 * Simple public effects such as credits, tags, and actions mutate state here.
 * Effects that require existing engine primitives, such as draw, damage,
 * hosted-credit mutation, or source trashing, are supplied through the execution
 * context so this module does not import index.ts or duplicate host rules.
 */
import type {
  CardDefinitionId,
  CardInstanceId,
  CounterType,
  DamageType,
  GameEndReason,
  GameState,
  MultiServerSuccessSequenceState,
  ResolvedGameEffect,
  ServerId,
  Side,
  Winner,
} from "@netgrid/shared";
import type {
  CardEffectImplementation,
  CardTraceSuccessEffectImplementation,
} from "./definition-types";
import { executeAdvancementEffect } from "./effect-families/advancement-effects";
import { executeBadPublicityEffect } from "./effect-families/bad-publicity-effects";
import { executeCreditEffect } from "./effect-families/credit-effects";
import { executeCounterEffect } from "./effect-families/counter-effects";
import { executeDamageEffect } from "./effect-families/damage-effects";
import { executeDrawEffect } from "./effect-families/draw-effects";
import type { CardEffectFamilyRuntime } from "./effect-families/family-runtime";
import { executeHostedCreditEffect } from "./effect-families/hosted-credit-effects";
import { executeContextEffect } from "./effect-families/context-effects";
import { executeTagEffect } from "./effect-families/tag-effects";

export type CardEffectExecutionContext = {
  sourceCardId: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  sourceTitle?: string;
  targetCardId?: CardInstanceId;
  xValue?: number;
  targetRezCost?: number;
  controller: Side;
  reason?: string;
  drawCards?: (side: Side, amount: number) => CardEffectDrawCardsResult;
  damageRunner?: (
    damageType: Extract<DamageType, "meat" | "net" | "core">,
    amount: number,
  ) => CardEffectDamageResult;
  unpreventableDamageRunner?: (
    damageType: Extract<DamageType, "meat" | "net" | "core">,
    amount: number,
  ) => CardEffectDamageResult;
  addHostedCredits?: (
    sourceCardId: CardInstanceId,
    amount: number,
  ) => CardEffectHostedCreditsResult;
  addCountersToSource?: (
    sourceCardId: CardInstanceId,
    counterType: Extract<CounterType, "ablative" | "trauma" | "boon">,
    amount: number,
  ) => CardEffectCounterResult;
  removeRunnerTags?: (
    mode: "amount" | "up_to_amount" | "all",
    amount?: number,
  ) => CardEffectRemoveTagsResult;
  avoidNextTag?: (amount: 1) => CardEffectAvoidTagResult;
  returnSourceToGripIfPaid?: (
    sourceCardId: CardInstanceId,
    amount: number,
  ) => CardEffectReturnSourceResult;
  takeHostedCredits?: (
    sourceCardId: CardInstanceId,
    recipient: Side,
    amount: number | "all",
  ) => CardEffectHostedCreditsResult;
  trashSourceWhenEmpty?: (
    sourceCardId: CardInstanceId,
  ) => CardEffectTrashSourceResult;
  trashSource?: (sourceCardId: CardInstanceId) => CardEffectTrashSourceResult;
  startTrace?: (
    sourceCardId: CardInstanceId,
    baseTraceStrength: number,
    successEffects: readonly CardTraceSuccessEffectImplementation[],
  ) => CardEffectTraceResult;
  startRun?: (
    serverId: Exclude<ServerId, "new_remote">,
    options: CardEffectMakeRunOptions,
  ) => CardEffectMakeRunResult;
  addCounterToAllInstalledRunnerIcebreakers?: (
    counterType: CounterType,
    amount: number,
  ) => CardEffectCounterResult;
  shuffleSourceIntoCorpRd?: (
    sourceCardId: CardInstanceId,
  ) => CardEffectHiddenInfoResult;
  trashCorpInstalledCardsInSourceServer?: (
    sourceCardId: CardInstanceId,
  ) => CardEffectHiddenInfoResult;
  gainRunnerEventAgendaPoint?: (amount: 1) => CardEffectHiddenInfoResult;
  runnerLiberatedAgendaSubtypeThisTurn?: (
    subtype: "research" | "gray_ops" | "black_ops",
  ) => boolean;
  corpRandomDiscardFromHq?: (count: number) => CardEffectHiddenInfoResult;
  startCorpDiscardHqWithRetainPayment?: (
    retainCostPerCard: number,
  ) => CardEffectHiddenInfoResult;
  startDerezRezzedBlackIceChoice?: () => CardEffectHiddenInfoResult;
  startRunnerProgramInstallActionBundle?: (
    actionCount: 5,
    temporaryCredit: 1,
  ) => CardEffectHiddenInfoResult;
  chosenRunServerId?: () => Exclude<ServerId, "new_remote">;
  startPrivateLook?: (
    zone: Extract<ServerId, "rd" | "hq">,
    count: number | "all",
  ) => CardEffectPrivateLookResult;
  exposeInstalledCard?: (
    scope: "inside_data_fort" | "any_installed",
  ) => CardEffectHiddenInfoResult;
  startExposeInstalledCards?: (
    min: number,
    max: number,
    scope?: "any_installed" | "single_data_fort",
  ) => CardEffectHiddenInfoResult;
  exposeOutermostIceEachFort?: () => CardEffectHiddenInfoResult;
  startShowHqAgendasForCredits?: (
    creditPerAgenda: number,
  ) => CardEffectHiddenInfoResult;
  startSearchTrashToGrip?: (
    filter: "program" | "any_card",
  ) => CardEffectHiddenInfoResult;
  startSearchStackToGrip?: (
    filter: "program" | "any_card",
    revealToCorp: boolean,
    shuffleAfterwards: true,
  ) => CardEffectHiddenInfoResult;
  moveTopTrashToGrip?: () => CardEffectHiddenInfoResult;
  startSearchStackInstall?: (
    filter: "program",
    installCost: "normal" | "free",
    shuffleAfterwards: true,
  ) => CardEffectHiddenInfoResult;
  startChooseStackOrTrashProgramInstall?: (
    installCost: "free",
    shuffleStackIfSearched: true,
    returnInstalledCardToGripAtEndOfTurn: true,
  ) => CardEffectHiddenInfoResult;
  startLookTopStackShowToCorpThenInstallMatching?: (
    count: 5,
    allowedTypes: readonly "program"[],
    installCost: "free",
    trashSourceIfInstalled: true,
    shuffleAfterwards: true,
  ) => CardEffectHiddenInfoResult;
  startLookTopStackTakeMatching?: (
    count: number,
    allowedTypes: readonly ("program" | "event" | "hardware" | "resource")[],
    costPerTaken: number,
    revealTakenToCorp: true,
    shuffleRemainder: true,
  ) => CardEffectHiddenInfoResult;
  startLookTopStackTakeOneArrangeRest?: (
    count: 5,
  ) => CardEffectHiddenInfoResult;
  startTrashOwnInstalledCardsForCredits?: (
    min: 0 | 1,
    max: "any",
    gainPerTrashed: number,
  ) => CardEffectHiddenInfoResult;
  startTrashCardsFromGripForCredits?: (
    max: number,
    gainPerTrashed: number,
  ) => CardEffectHiddenInfoResult;
  shuffleGripTrashAndStackThenDraw?: (
    drawCount: number,
    removePlayedCardFromGame: true,
  ) => CardEffectHiddenInfoResult;
  startPayRezCostToTrashRezzedIceChoice?: () => CardEffectHiddenInfoResult;
  startTrashUnrezzedIceChoice?: () => CardEffectHiddenInfoResult;
  startCorpChoiceRezOrTrashIceChoice?: () => CardEffectHiddenInfoResult;
  startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice?: () => CardEffectHiddenInfoResult;
  startDistributeAdvancementCounters?: (
    amount: number,
    distribution:
      | "single_target"
      | "any_combination"
      | "up_to_distinct_targets_one_each",
  ) => CardEffectAdvancementChoiceResult;
  startMoveAdvancementCounters?: (
    source: "chosen_card" | "source_card",
    maxAmount: number | "all",
  ) => CardEffectAdvancementChoiceResult;
  addCurrentEncounterAdditionalSubroutine?: (input: {
    subroutineKind: "end_the_run" | "end_the_run_unless_runner_pays";
    amount?: number;
  }) => CardEffectHiddenInfoResult;
  copySameFortIceSubroutineForRun?: () => CardEffectHiddenInfoResult;
  addCurrentRunAccessCount?: (
    server: Extract<ServerId, "hq" | "rd">,
    amount: number,
  ) => CardEffectHiddenInfoResult;
  passCurrentEncounteredIce?: (
    subtypeRequired?: "ap",
  ) => CardEffectHiddenInfoResult;
  rezInstalledIceWithLifecycleCounters?: (input: {
    counterType: Extract<CounterType, "kludge" | "term">;
    amount: number;
    lifecycle:
      | "remove_one_counter_start_corp_turn_trash_on_last"
      | "rent_to_own_start_corp_turn";
  }) => CardEffectHiddenInfoResult;
  replaceFortCardsFromHq?: () => CardEffectHiddenInfoResult;
};

export type CardEffectExecutionResult = {
  publicPayload: Record<string, string | number | boolean>;
  resolvedEffects: ResolvedGameEffect[];
};

export type CardEffectDrawCardsResult = {
  drawnCount: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectDamageResult = {
  resolved: boolean;
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectHostedCreditsResult = {
  amount: number;
  hostedCreditsAfter: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectCounterResult = {
  amount: number;
  counterType: Extract<
    CounterType,
    "ablative" | "trauma" | "boon" | "militech" | "pattel_antibody"
  >;
  countersAfter: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectRemoveTagsResult = {
  removedTags: number;
  runnerTagsAfter: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectAvoidTagResult = {
  amount: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectReturnSourceResult = {
  choiceOpened: boolean;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectTrashSourceResult = {
  sourceTrashed: boolean;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectTraceResult = {
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectMakeRunOptions = {
  accessCount?: number;
  freeTrashAccessZones?: readonly Extract<ServerId, "hq" | "rd">[];
  accessServerOverride?: Extract<ServerId, "hq" | "rd" | "archives">;
  successfulRunAccessReplacement?:
    | "corp_lose_credits"
    | "runner_spend_corp_lose_credits"
    | "private_look_top_rd"
    | "archives_faceup_to_rd"
    | "trash_rezzed_ice_on_fort_and_tag_runner"
    | "runner_gain_agenda_point";
  successfulRunCreditLoss?: number;
  successfulRunRunnerTagGain?: number;
  successfulRunRunnerCreditGain?: number;
  successfulRunRequiresCorpCredits?: boolean;
  successfulRunPrivateLookCount?: number;
  successfulRunArchivesMoveCount?: number;
  followupRunOnEnd?: "optional";
  bypassFirstIce?: boolean;
  runTraceLinkBonus?: number;
  runTemporaryCredits?: {
    side: "runner";
    amount: number;
    usableFor: "any_runner_cost_during_this_run";
    returnUnusedAtRunEnd: true;
  };
  afterRunCompletedUnpreventableCoreDamage?: number;
  prohibitNoisyIcebreakers?: boolean;
  eventApproachIceExposeBeforeRez?: boolean;
  runnerCreditGainOnCorpRez?: number;
  damagePreventionPool?: number;
  badPublicityRunAftermath?: "live_news_feed" | "subliminal_corruption";
  activeSequence?: MultiServerSuccessSequenceState;
};

export type CardEffectMakeRunResult = {
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectPrivateLookResult = {
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectHiddenInfoResult = {
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectAdvancementChoiceResult = {
  publicPayload?: Record<string, string | number | boolean>;
};

function dataFortServerIds(
  state: GameState,
): Exclude<ServerId, "new_remote">[] {
  return state.corp.servers
    .map((server) => server.id)
    .sort((a, b) => dataFortOrder(a).localeCompare(dataFortOrder(b)));
}

function dataFortOrder(serverId: Exclude<ServerId, "new_remote">): string {
  if (serverId === "hq") return "0:hq";
  if (serverId === "rd") return "1:rd";
  if (serverId === "archives") return "2:archives";
  return `3:${serverId}`;
}

function recipientSide(
  context: CardEffectExecutionContext,
  recipient: "controller" | "runner" | "corp",
): Side {
  return recipient === "controller" ? context.controller : recipient;
}

function gainCredits(state: GameState, side: Side, amount: number): void {
  if (side === "corp") {
    const debt = state.actionEconomy?.corpCreditForfeitDebt;
    const forfeited = Math.min(
      amount,
      Math.max(0, Math.floor(debt?.remaining ?? 0)),
    );
    if (debt) {
      debt.remaining = Math.max(0, Math.floor(debt.remaining) - forfeited);
      if (debt.remaining <= 0 && state.actionEconomy)
        delete state.actionEconomy.corpCreditForfeitDebt;
    }
    state.corp.credits += amount - forfeited;
  } else state.runner.credits += amount;
}

function creditsForSide(state: GameState, side: Side): number {
  return side === "corp" ? state.corp.credits : state.runner.credits;
}

function loseCredits(state: GameState, side: Side, amount: number): void {
  if (amount <= 0) return;
  if (side === "corp")
    state.corp.credits = Math.max(0, state.corp.credits - amount);
  else state.runner.credits = Math.max(0, state.runner.credits - amount);
}

function spendCreditsIfAvailable(
  state: GameState,
  side: Side,
  amount: number,
): boolean {
  if (creditsForSide(state, side) < amount) return false;
  if (side === "corp") state.corp.credits -= amount;
  else state.runner.credits -= amount;
  return true;
}

function loserToWinner(side: Side): Winner {
  return side === "runner" ? "corp" : "runner";
}

function loseGame(
  state: GameState,
  side: Side,
  reason: GameEndReason = "unknown",
): Winner {
  const winner = loserToWinner(side);
  state.winner = winner;
  state.gameEndReason = reason;
  state.phase = "game_over";
  state.timingPoint = "game.checkpoint";
  state.activeSide = winner === "draw" ? state.activeSide : winner;
  delete state.pendingChoice;
  delete state.run;
  return winner;
}

function addRunnerTags(state: GameState, amount: number): void {
  if (amount <= 0) return;
  state.runner.tags += amount;
}

function publicEffectId(
  context: CardEffectExecutionContext,
  index: number,
  kind: string,
): string {
  const source = context.sourceDefinitionId ?? "card_implementation";
  const instancePart =
    context.reason && context.reason !== "card_resolver"
      ? `.${context.sourceCardId}`
      : "";
  return `${source}${instancePart}.effect.${index}.${kind}`;
}

function effectReason(context: CardEffectExecutionContext): string {
  return context.reason ?? "card_resolver";
}

function assertPositiveIntegerAmount(kind: string, amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error(`${kind} effect amount must be a positive integer.`);
}

function assertPublicVisibility(kind: string, visibility: string): void {
  if (visibility !== "public")
    throw new Error(`${kind} effect visibility must be public.`);
}

function assertHiddenInfoBarrierVisibility(
  kind: string,
  visibility: string,
): void {
  if (visibility !== "hidden_info_barrier")
    throw new Error(`${kind} effect visibility must be hidden_info_barrier.`);
}

function mergePublicPayload(
  target: Record<string, string | number | boolean>,
  next: Record<string, string | number | boolean> | undefined,
): void {
  if (!next) return;
  for (const [key, value] of Object.entries(next)) {
    if (
      (key === "drawnCards" ||
        key === "drawnCount" ||
        key === "gainedCredits" ||
        key === "creditsLost" ||
        key === "gainedActions" ||
        key === "damageAmount" ||
        key === "cardsTrashed") &&
      typeof value === "number" &&
      typeof target[key] === "number"
    ) {
      target[key] = Number(target[key]) + value;
    } else {
      target[key] = value;
    }
  }
}

/**
 * Executes ordered CardImplementation effects and returns public payload plus
 * redacted ResolvedEffects for event/chronicle consumers.
 *
 * This function is a mutating interpreter. It validates the small declarative
 * vocabulary, preserves effect order, and relies on injected host callbacks for
 * mechanics with their own revalidation or hidden-info contracts.
 */
export function executeCardImplementationEffects(
  state: GameState,
  context: CardEffectExecutionContext,
  effects: readonly CardEffectImplementation[],
): CardEffectExecutionResult {
  const publicPayload: Record<string, string | number | boolean> = {};
  const resolvedEffects: ResolvedGameEffect[] = [];
  const familyRuntime: CardEffectFamilyRuntime = {
    recipientSide,
    gainCredits,
    creditsForSide,
    loseCredits,
    spendCreditsIfAvailable,
    loseGame,
    addRunnerTags,
    publicEffectId,
    effectReason,
    assertPositiveIntegerAmount,
    assertPublicVisibility,
    assertHiddenInfoBarrierVisibility,
    mergePublicPayload,
    dataFortServerIds,
  };

  effects.forEach((effect, index) => {
    const familyInput = {
      state,
      context,
      effect,
      index,
      publicPayload,
      resolvedEffects,
      runtime: familyRuntime,
    };

    // The dispatcher preserves effect order. New reusable effect behavior should
    // live in a focused family module instead of extending this switch forever.
    if (
      executeCreditEffect(familyInput) ||
      executeBadPublicityEffect(familyInput) ||
      executeCounterEffect(familyInput) ||
      executeHostedCreditEffect(familyInput) ||
      executeAdvancementEffect(familyInput) ||
      executeDrawEffect(familyInput) ||
      executeTagEffect(familyInput) ||
      executeDamageEffect(familyInput)
    )
      return;

    executeContextEffect(familyInput);
  });

  return { publicPayload, resolvedEffects };
}
