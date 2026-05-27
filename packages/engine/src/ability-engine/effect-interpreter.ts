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
  ResolvedGameEffect,
  ServerId,
  Side,
  Winner,
} from "@netgrid/shared";
import type {
  CardEffectImplementation,
  CardTraceSuccessEffectImplementation,
} from "./definition-types";

export type CardEffectExecutionContext = {
  sourceCardId: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  sourceTitle?: string;
  controller: Side;
  reason?: string;
  drawCards?: (
    side: Side,
    amount: number,
  ) => CardEffectDrawCardsResult;
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
  trashSource?: (
    sourceCardId: CardInstanceId,
  ) => CardEffectTrashSourceResult;
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
    | "archives_faceup_to_rd";
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

function recipientSide(
  context: CardEffectExecutionContext,
  recipient: "controller" | "runner" | "corp",
): Side {
  return recipient === "controller" ? context.controller : recipient;
}

function gainCredits(state: GameState, side: Side, amount: number): void {
  if (side === "corp") state.corp.credits += amount;
  else state.runner.credits += amount;
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

function assertHiddenInfoBarrierVisibility(kind: string, visibility: string): void {
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
      (
        key === "drawnCards" ||
        key === "drawnCount" ||
        key === "gainedCredits" ||
        key === "creditsLost" ||
        key === "gainedActions" ||
        key === "damageAmount" ||
        key === "cardsTrashed"
      ) &&
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

  effects.forEach((effect, index) => {
    switch (effect.kind) {
      case "gain_credits": {
        assertPositiveIntegerAmount("gain_credits", effect.amount);
        const side = recipientSide(context, effect.recipient);
        gainCredits(state, side, effect.amount);
        publicPayload.gainedCredits =
          Number(publicPayload.gainedCredits ?? 0) + effect.amount;
        publicPayload[
          side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"
        ] = side === "corp" ? state.corp.credits : state.runner.credits;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "gain_credits"),
          kind: "gain_credits",
          visibility: effect.visibility,
          side,
          amount: effect.amount,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "add_bad_publicity": {
        assertPositiveIntegerAmount("add_bad_publicity", effect.amount);
        assertPublicVisibility("add_bad_publicity", effect.visibility);
        const sourceVisibility = effect.sourceVisibility ?? "public";
        if (sourceVisibility !== "public" && sourceVisibility !== "redacted")
          throw new Error(
            "add_bad_publicity sourceVisibility must be public or redacted.",
          );
        const before = state.corp.badPublicity;
        state.corp.badPublicity += effect.amount;
        publicPayload.badPublicityAdded =
          Number(publicPayload.badPublicityAdded ?? 0) + effect.amount;
        if (typeof publicPayload.corpBadPublicityBefore !== "number")
          publicPayload.corpBadPublicityBefore = before;
        publicPayload.corpBadPublicityAfter = state.corp.badPublicity;
        publicPayload.sourceVisibility = sourceVisibility;
        if (sourceVisibility === "redacted") {
          publicPayload.redactedKind = "hidden_resource_source";
        }
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "add_bad_publicity"),
          kind: "add_bad_publicity",
          visibility: effect.visibility,
          side: "corp",
          amount: effect.amount,
          reason: effectReason(context),
          ...(sourceVisibility === "redacted"
            ? { redactedKind: "hidden_resource_source" }
            : {}),
          ...(sourceVisibility === "public" && context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(sourceVisibility === "public" && context.sourceTitle
            ? { sourceTitle: context.sourceTitle }
            : {}),
        });
        return;
      }
      case "gain_credits_per_advancement_counter_on_source": {
        assertPositiveIntegerAmount(
          "gain_credits_per_advancement_counter_on_source",
          effect.amountPerCounter,
        );
        assertPublicVisibility(
          "gain_credits_per_advancement_counter_on_source",
          effect.visibility,
        );
        const source = state.cardInstances[context.sourceCardId];
        if (!source)
          throw new Error(
            "gain_credits_per_advancement_counter_on_source source is missing.",
          );
        const advancementCounterCount = Math.max(
          0,
          Math.floor(source.advancementCounters),
        );
        const amount = advancementCounterCount * effect.amountPerCounter;
        const side = recipientSide(context, effect.recipient);
        gainCredits(state, side, amount);
        publicPayload.advancementCounterCount = advancementCounterCount;
        publicPayload.gainedCredits =
          Number(publicPayload.gainedCredits ?? 0) + amount;
        publicPayload[
          side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"
        ] = side === "corp" ? state.corp.credits : state.runner.credits;
        resolvedEffects.push({
          effectId: publicEffectId(
            context,
            index,
            "gain_credits_per_advancement_counter_on_source",
          ),
          kind: "gain_credits",
          visibility: effect.visibility,
          side,
          amount,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "draw_cards": {
        assertPositiveIntegerAmount("draw_cards", effect.amount);
        assertPublicVisibility("draw_cards", effect.visibility);
        if (!context.drawCards)
          throw new Error(
            "draw_cards effect requires a drawCards execution context.",
          );
        const side = recipientSide(context, effect.recipient);
        const drawResult = context.drawCards(side, effect.amount);
        mergePublicPayload(publicPayload, drawResult.publicPayload);
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "draw_cards"),
          kind: "draw_cards",
          visibility: effect.visibility,
          side,
          amount: drawResult.drawnCount,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "lose_credits": {
        assertPublicVisibility("lose_credits", effect.visibility);
        const mode = effect.mode ?? "amount";
        if (mode !== "amount" && mode !== "all")
          throw new Error("lose_credits effect mode must be amount or all.");
        if (mode === "amount") {
          if (effect.amount === undefined)
            throw new Error("lose_credits amount mode requires an amount.");
          assertPositiveIntegerAmount("lose_credits", effect.amount);
        }
        const side = recipientSide(context, effect.recipient);
        const amountToLose =
          mode === "all"
            ? creditsForSide(state, side)
            : Math.min(creditsForSide(state, side), effect.amount ?? 0);
        loseCredits(state, side, amountToLose);
        publicPayload.creditsLost =
          Number(publicPayload.creditsLost ?? 0) + amountToLose;
        publicPayload[
          side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"
        ] = creditsForSide(state, side);
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "lose_credits"),
          kind: "lose_credits",
          visibility: effect.visibility,
          side,
          amount: amountToLose,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "pay_credits_or_lose_game": {
        assertPositiveIntegerAmount(
          "pay_credits_or_lose_game",
          effect.amount,
        );
        assertPublicVisibility("pay_credits_or_lose_game", effect.visibility);
        if (effect.reason !== "source_left_play")
          throw new Error(
            "pay_credits_or_lose_game reason must be source_left_play.",
          );
        const payer = recipientSide(context, effect.payer);
        const loseSide = recipientSide(context, effect.loseSide);
        const paid = spendCreditsIfAvailable(state, payer, effect.amount);
        const winner = paid ? undefined : loseGame(state, loseSide);
        publicPayload.creditsPaid =
          Number(publicPayload.creditsPaid ?? 0) + (paid ? effect.amount : 0);
        publicPayload.payCreditsOrLoseGameAmount = effect.amount;
        publicPayload.payCreditsOrLoseGamePaid = paid;
        publicPayload[payer === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"] =
          creditsForSide(state, payer);
        if (!paid) {
          publicPayload.gameLost = true;
          publicPayload.winner = winner ?? "";
        }
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "pay_credits_or_lose_game"),
          kind: "pay_credits_or_lose_game",
          visibility: effect.visibility,
          side: payer,
          amount: effect.amount,
          paidCredits: paid ? effect.amount : 0,
          gameLost: !paid,
          ...(winner ? { winner } : {}),
          reason: effect.reason,
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "add_tags": {
        assertPositiveIntegerAmount("add_tags", effect.amount);
        assertPublicVisibility("add_tags", effect.visibility);
        if ((effect as { recipient?: string }).recipient !== "runner")
          throw new Error("add_tags effect recipient must be runner.");
        addRunnerTags(state, effect.amount);
        publicPayload.tagsAdded =
          Number(publicPayload.tagsAdded ?? 0) + effect.amount;
        publicPayload.runnerTagsAfter = state.runner.tags;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "add_tags"),
          kind: "add_tags",
          visibility: effect.visibility,
          side: "runner",
          amount: effect.amount,
          reason: effectReason(context),
          runnerTagsAfter: state.runner.tags,
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "add_current_encounter_additional_subroutine": {
        assertPublicVisibility(
          "add_current_encounter_additional_subroutine",
          effect.visibility,
        );
        if (effect.target !== "encountered_ice_self")
          throw new Error(
            "add_current_encounter_additional_subroutine supports only encountered_ice_self.",
          );
        if (effect.append !== "after_existing")
          throw new Error(
            "add_current_encounter_additional_subroutine supports only after_existing append.",
          );
        if (effect.subroutine.visibility !== "public")
          throw new Error(
            "add_current_encounter_additional_subroutine requires a public subroutine.",
          );
        if (!context.addCurrentEncounterAdditionalSubroutine)
          throw new Error(
            "add_current_encounter_additional_subroutine requires an encounter execution context.",
          );
        const result = context.addCurrentEncounterAdditionalSubroutine({
          subroutineKind: effect.subroutine.kind,
          ...(effect.subroutine.kind === "end_the_run_unless_runner_pays"
            ? { amount: effect.subroutine.amount }
            : {}),
        });
        mergePublicPayload(publicPayload, result.publicPayload);
        return;
      }
      case "remove_tags": {
        assertPublicVisibility("remove_tags", effect.visibility);
        if (effect.recipient !== "runner")
          throw new Error("remove_tags effect recipient must be runner.");
        if (effect.mode !== "amount" && effect.mode !== "up_to_amount" && effect.mode !== "all")
          throw new Error("remove_tags effect mode is invalid.");
        if (effect.mode !== "all") {
          if (effect.amount === undefined)
            throw new Error("remove_tags amount modes require an amount.");
          assertPositiveIntegerAmount("remove_tags", effect.amount);
        }
        if (!context.removeRunnerTags)
          throw new Error(
            "remove_tags effect requires a removeRunnerTags execution context.",
          );
        const removeResult = context.removeRunnerTags(
          effect.mode,
          effect.amount,
        );
        publicPayload.removedTags =
          Number(publicPayload.removedTags ?? 0) + removeResult.removedTags;
        publicPayload.runnerTagsAfter = removeResult.runnerTagsAfter;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "remove_tags"),
          kind: "remove_tags",
          visibility: effect.visibility,
          side: "runner",
          amount: removeResult.removedTags,
          reason: effectReason(context),
          runnerTagsAfter: removeResult.runnerTagsAfter,
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "avoid_next_tag": {
        assertPublicVisibility("avoid_next_tag", effect.visibility);
        if (effect.recipient !== "runner")
          throw new Error("avoid_next_tag effect recipient must be runner.");
        if (effect.amount !== 1)
          throw new Error("avoid_next_tag supports only amount 1.");
        if (!context.avoidNextTag)
          throw new Error(
            "avoid_next_tag effect requires an avoidNextTag execution context.",
          );
        const avoidResult = context.avoidNextTag(effect.amount);
        mergePublicPayload(publicPayload, avoidResult.publicPayload);
        publicPayload.preventedTagsNext =
          Number(publicPayload.preventedTagsNext ?? 0) + avoidResult.amount;
        return;
      }
      case "return_source_to_grip_if_paid": {
        assertPublicVisibility(
          "return_source_to_grip_if_paid",
          effect.visibility,
        );
        assertPositiveIntegerAmount(
          "return_source_to_grip_if_paid",
          effect.amount,
        );
        if (!context.returnSourceToGripIfPaid)
          throw new Error(
            "return_source_to_grip_if_paid requires a returnSourceToGripIfPaid execution context.",
          );
        const returnResult = context.returnSourceToGripIfPaid(
          context.sourceCardId,
          effect.amount,
        );
        mergePublicPayload(publicPayload, returnResult.publicPayload);
        return;
      }
      case "add_counters_to_source": {
        assertPositiveIntegerAmount("add_counters_to_source", effect.amount);
        assertPublicVisibility("add_counters_to_source", effect.visibility);
        if (
          effect.counterType !== "ablative" &&
          effect.counterType !== "trauma" &&
          effect.counterType !== "boon"
        )
          throw new Error(
            "add_counters_to_source supports only explicit source counters.",
          );
        if (!context.addCountersToSource)
          throw new Error(
            "add_counters_to_source effect requires an addCountersToSource execution context.",
          );
        const addResult = context.addCountersToSource(
          context.sourceCardId,
          effect.counterType,
          effect.amount,
        );
        mergePublicPayload(publicPayload, addResult.publicPayload);
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "add_counters_to_source"),
          kind: "counter_change",
          visibility: effect.visibility,
          side: context.controller,
          amount: addResult.amount,
          counterType: addResult.counterType,
          addedCounterAmount: addResult.amount,
          remainingCounters: addResult.countersAfter,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "damage": {
        assertPositiveIntegerAmount("damage", effect.amount);
        assertPublicVisibility("damage", effect.visibility);
        if ((effect as { recipient?: string }).recipient !== "runner")
          throw new Error("damage effect recipient must be runner.");
        if (
          !["meat", "net", "core"].includes(
            (effect as { damageType?: string }).damageType ?? "",
          )
        )
          throw new Error("damage effect damageType must be meat, net, or core.");
        const preventable = (effect as { preventable?: boolean }).preventable;
        if (preventable !== true && preventable !== false)
          throw new Error("damage effect preventable must be true or false.");
        const damageRunner =
          preventable === true
            ? context.damageRunner
            : context.unpreventableDamageRunner;
        if (!damageRunner)
          throw new Error(
            preventable === true
              ? "damage effect requires a damageRunner execution context."
              : "unpreventable damage effect requires an unpreventableDamageRunner execution context.",
          );
        const damageResult = damageRunner(
          effect.damageType,
          effect.amount,
        );
        mergePublicPayload(publicPayload, damageResult.publicPayload);
        if (!damageResult.resolved) return;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "damage"),
          kind: "damage",
          visibility: effect.visibility,
          side: "runner",
          amount: damageResult.amount,
          damageType: damageResult.damageType,
          cardsTrashed: damageResult.cardsTrashed,
          preventable,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "trace": {
        assertPositiveIntegerAmount("trace", effect.baseTraceStrength);
        assertPublicVisibility("trace", effect.visibility);
        if (effect.onFailure && effect.onFailure.length > 0)
          throw new Error("Trace onFailure effects are not supported yet.");
        if (!context.startTrace)
          throw new Error("trace effect requires a startTrace execution context.");
        const traceResult = context.startTrace(
          context.sourceCardId,
          effect.baseTraceStrength,
          effect.onSuccess,
        );
        mergePublicPayload(publicPayload, traceResult.publicPayload);
        return;
      }
      case "add_counter_to_all_installed_runner_icebreakers": {
        assertPositiveIntegerAmount(
          "add_counter_to_all_installed_runner_icebreakers",
          effect.amount,
        );
        assertPublicVisibility(
          "add_counter_to_all_installed_runner_icebreakers",
          effect.visibility,
        );
        if (
          effect.counterType !== "militech" &&
          effect.counterType !== "pattel_antibody"
        )
          throw new Error(
            "add_counter_to_all_installed_runner_icebreakers supports only configured public icebreaker counters.",
          );
        if (!context.addCounterToAllInstalledRunnerIcebreakers)
          throw new Error(
            "add_counter_to_all_installed_runner_icebreakers requires a counter execution context.",
          );
        const addResult = context.addCounterToAllInstalledRunnerIcebreakers(
          effect.counterType,
          effect.amount,
        );
        mergePublicPayload(publicPayload, addResult.publicPayload);
        resolvedEffects.push({
          effectId: publicEffectId(
            context,
            index,
            "add_counter_to_all_installed_runner_icebreakers",
          ),
          kind: "counter_change",
          visibility: effect.visibility,
          side: "runner",
          amount: addResult.amount,
          counterType: addResult.counterType,
          addedCounterAmount: addResult.amount,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "shuffle_source_into_corp_rd": {
        assertHiddenInfoBarrierVisibility(
          "shuffle_source_into_corp_rd",
          effect.visibility,
        );
        if (!context.shuffleSourceIntoCorpRd)
          throw new Error(
            "shuffle_source_into_corp_rd requires a movement execution context.",
          );
        const moveResult = context.shuffleSourceIntoCorpRd(context.sourceCardId);
        mergePublicPayload(publicPayload, moveResult.publicPayload);
        return;
      }
      case "trash_corp_installed_cards_in_source_server": {
        assertHiddenInfoBarrierVisibility(
          "trash_corp_installed_cards_in_source_server",
          effect.visibility,
        );
        if (effect.include !== "root_and_ice")
          throw new Error(
            "trash_corp_installed_cards_in_source_server supports only root_and_ice.",
          );
        if (!context.trashCorpInstalledCardsInSourceServer)
          throw new Error(
            "trash_corp_installed_cards_in_source_server requires a server trash context.",
          );
        const trashResult = context.trashCorpInstalledCardsInSourceServer(
          context.sourceCardId,
        );
        mergePublicPayload(publicPayload, trashResult.publicPayload);
        return;
      }
      case "gain_runner_event_agenda_point": {
        assertPublicVisibility("gain_runner_event_agenda_point", effect.visibility);
        if (effect.amount !== 1)
          throw new Error("gain_runner_event_agenda_point supports only amount 1.");
        if (!context.gainRunnerEventAgendaPoint)
          throw new Error(
            "gain_runner_event_agenda_point requires an agenda-point context.",
          );
        const result = context.gainRunnerEventAgendaPoint(effect.amount);
        mergePublicPayload(publicPayload, result.publicPayload);
        return;
      }
      case "gain_runner_event_agenda_point_if_liberated_agenda_subtype": {
        assertPublicVisibility(
          "gain_runner_event_agenda_point_if_liberated_agenda_subtype",
          effect.visibility,
        );
        if (effect.amount !== 1 || effect.subtype !== "black_ops")
          throw new Error(
            "gain_runner_event_agenda_point_if_liberated_agenda_subtype supports only Black Ops amount 1.",
          );
        if (!context.runnerLiberatedAgendaSubtypeThisTurn)
          throw new Error(
            "gain_runner_event_agenda_point_if_liberated_agenda_subtype requires a history context.",
          );
        if (!context.runnerLiberatedAgendaSubtypeThisTurn(effect.subtype)) {
          publicPayload.agendaPointsGained = 0;
          return;
        }
        if (!context.gainRunnerEventAgendaPoint)
          throw new Error(
            "gain_runner_event_agenda_point_if_liberated_agenda_subtype requires an agenda-point context.",
          );
        const result = context.gainRunnerEventAgendaPoint(effect.amount);
        mergePublicPayload(publicPayload, result.publicPayload);
        return;
      }
      case "corp_random_discard_from_hq": {
        assertPositiveIntegerAmount("corp_random_discard_from_hq", effect.count);
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "corp_random_discard_from_hq visibility must be hidden_info_barrier.",
          );
        if (!context.corpRandomDiscardFromHq)
          throw new Error(
            "corp_random_discard_from_hq requires a random-discard context.",
          );
        const result = context.corpRandomDiscardFromHq(effect.count);
        mergePublicPayload(publicPayload, result.publicPayload);
        return;
      }
      case "corp_discard_hq_with_retain_payment": {
        assertPositiveIntegerAmount(
          "corp_discard_hq_with_retain_payment",
          effect.retainCostPerCard,
        );
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "corp_discard_hq_with_retain_payment visibility must be hidden_info_barrier.",
          );
        if (!context.startCorpDiscardHqWithRetainPayment)
          throw new Error(
            "corp_discard_hq_with_retain_payment requires a hidden choice context.",
          );
        const result = context.startCorpDiscardHqWithRetainPayment(
          effect.retainCostPerCard,
        );
        mergePublicPayload(publicPayload, result.publicPayload);
        return;
      }
      case "derez_rezzed_black_ice": {
        assertPublicVisibility("derez_rezzed_black_ice", effect.visibility);
        if (effect.target !== "chosen_rezzed_black_ice")
          throw new Error("derez_rezzed_black_ice target is invalid.");
        if (!context.startDerezRezzedBlackIceChoice)
          throw new Error(
            "derez_rezzed_black_ice requires a target choice context.",
          );
        const result = context.startDerezRezzedBlackIceChoice();
        mergePublicPayload(publicPayload, result.publicPayload);
        return;
      }
      case "start_runner_program_install_action_bundle": {
        assertPublicVisibility(
          "start_runner_program_install_action_bundle",
          effect.visibility,
        );
        if (
          effect.actionCount !== 5 ||
          effect.temporaryCredit !== 1 ||
          effect.allowedActionKind !== "install_program" ||
          effect.mayStopEarly !== true
        )
          throw new Error(
            "start_runner_program_install_action_bundle supports only the Valu-Pak profile.",
          );
        if (!context.startRunnerProgramInstallActionBundle)
          throw new Error(
            "start_runner_program_install_action_bundle requires a restricted-action context.",
          );
        const result = context.startRunnerProgramInstallActionBundle(
          effect.actionCount,
          effect.temporaryCredit,
        );
        mergePublicPayload(publicPayload, result.publicPayload);
        return;
      }
      case "make_run": {
        assertPublicVisibility("make_run", effect.visibility);
        if (!context.startRun)
          throw new Error("make_run effect requires a startRun execution context.");
        const serverId =
          effect.target.kind === "central_server"
            ? effect.target.server
            : context.chosenRunServerId?.();
        if (!serverId)
          throw new Error("make_run effect requires a chosen run server.");
        const runResult = context.startRun(serverId, {
          ...(effect.accessCount !== undefined
            ? { accessCount: effect.accessCount }
            : {}),
          ...(effect.freeTrashAccessZones
            ? { freeTrashAccessZones: effect.freeTrashAccessZones }
            : {}),
          ...(effect.accessServerOverride
            ? { accessServerOverride: effect.accessServerOverride }
            : {}),
          ...(effect.successfulRunAccessReplacement
            ? {
                successfulRunAccessReplacement:
                  effect.successfulRunAccessReplacement,
              }
            : {}),
          ...(effect.successfulRunCreditLoss !== undefined
            ? { successfulRunCreditLoss: effect.successfulRunCreditLoss }
            : {}),
          ...(effect.successfulRunRunnerTagGain !== undefined
            ? { successfulRunRunnerTagGain: effect.successfulRunRunnerTagGain }
            : {}),
          ...(effect.successfulRunRunnerCreditGain !== undefined
            ? {
                successfulRunRunnerCreditGain:
                  effect.successfulRunRunnerCreditGain,
              }
            : {}),
          ...(effect.successfulRunRequiresCorpCredits !== undefined
            ? {
                successfulRunRequiresCorpCredits:
                  effect.successfulRunRequiresCorpCredits,
              }
            : {}),
          ...(effect.successfulRunPrivateLookCount !== undefined
            ? { successfulRunPrivateLookCount: effect.successfulRunPrivateLookCount }
            : {}),
          ...(effect.successfulRunArchivesMoveCount !== undefined
            ? { successfulRunArchivesMoveCount: effect.successfulRunArchivesMoveCount }
            : {}),
          ...(effect.followupRunOnEnd
            ? { followupRunOnEnd: effect.followupRunOnEnd }
            : {}),
          ...(effect.bypassFirstIce !== undefined
            ? { bypassFirstIce: effect.bypassFirstIce }
            : {}),
          ...(effect.runTraceLinkBonus !== undefined
            ? { runTraceLinkBonus: effect.runTraceLinkBonus }
            : {}),
          ...(effect.runTemporaryCredits !== undefined
            ? { runTemporaryCredits: effect.runTemporaryCredits }
            : {}),
          ...(effect.afterRunCompletedUnpreventableCoreDamage !== undefined
            ? {
                afterRunCompletedUnpreventableCoreDamage:
                  effect.afterRunCompletedUnpreventableCoreDamage,
              }
            : {}),
        });
        mergePublicPayload(publicPayload, runResult.publicPayload);
        return;
      }
      case "pay_rez_cost_to_trash_rezzed_ice": {
        assertPublicVisibility("pay_rez_cost_to_trash_rezzed_ice", effect.visibility);
        if (effect.target !== "chosen_rezzed_ice")
          throw new Error("pay_rez_cost_to_trash_rezzed_ice target is invalid.");
        if (!context.startPayRezCostToTrashRezzedIceChoice)
          throw new Error("pay_rez_cost_to_trash_rezzed_ice requires a choice context.");
        const result = context.startPayRezCostToTrashRezzedIceChoice();
        mergePublicPayload(publicPayload, result.publicPayload);
        return;
      }
      case "trash_unrezzed_ice": {
        assertPublicVisibility("trash_unrezzed_ice", effect.visibility);
        if (effect.target !== "chosen_unrezzed_ice")
          throw new Error("trash_unrezzed_ice target is invalid.");
        if (!context.startTrashUnrezzedIceChoice)
          throw new Error("trash_unrezzed_ice requires a choice context.");
        const result = context.startTrashUnrezzedIceChoice();
        mergePublicPayload(publicPayload, result.publicPayload);
        return;
      }
      case "corp_choice_rez_or_trash_ice": {
        assertPublicVisibility("corp_choice_rez_or_trash_ice", effect.visibility);
        if (effect.target !== "chosen_installed_ice")
          throw new Error("corp_choice_rez_or_trash_ice target is invalid.");
        if (!context.startCorpChoiceRezOrTrashIceChoice)
          throw new Error("corp_choice_rez_or_trash_ice requires a choice context.");
        const result = context.startCorpChoiceRezOrTrashIceChoice();
        mergePublicPayload(publicPayload, result.publicPayload);
        return;
      }
      case "private_look": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error("private_look visibility must be hidden_info_barrier.");
        if (!context.startPrivateLook)
          throw new Error(
            "private_look effect requires a startPrivateLook execution context.",
          );
        if (effect.zone !== "rd" && effect.zone !== "hq")
          throw new Error("private_look supports only R&D and HQ.");
        if (
          effect.count !== "all" &&
          (!Number.isInteger(effect.count) || effect.count <= 0)
        )
          throw new Error("private_look count must be positive or all.");
        const lookResult = context.startPrivateLook(effect.zone, effect.count);
        mergePublicPayload(publicPayload, lookResult.publicPayload);
        return;
      }
      case "expose_installed_card": {
        assertPublicVisibility("expose_installed_card", effect.visibility);
        if (effect.target !== "chosen_installed_corp_card")
          throw new Error(
            "expose_installed_card target must be chosen_installed_corp_card.",
          );
        if (
          effect.scope !== "inside_data_fort" &&
          effect.scope !== "any_installed"
        )
          throw new Error(
            "expose_installed_card scope must be inside_data_fort or any_installed.",
          );
        if (!context.exposeInstalledCard)
          throw new Error(
            "expose_installed_card requires an exposeInstalledCard execution context.",
          );
        const exposeResult = context.exposeInstalledCard(effect.scope);
        mergePublicPayload(publicPayload, exposeResult.publicPayload);
        return;
      }
      case "expose_installed_cards": {
        assertPublicVisibility("expose_installed_cards", effect.visibility);
        if (effect.targets !== "chosen_installed_corp_cards")
          throw new Error(
            "expose_installed_cards targets must be chosen_installed_corp_cards.",
          );
        if (
          !Number.isInteger(effect.min) ||
          !Number.isInteger(effect.max) ||
          effect.min < 0 ||
          effect.max < effect.min
        )
          throw new Error("expose_installed_cards min/max are invalid.");
        if (!context.startExposeInstalledCards)
          throw new Error(
            "expose_installed_cards requires a startExposeInstalledCards execution context.",
          );
        const exposeResult = context.startExposeInstalledCards(
          effect.min,
          effect.max,
        );
        mergePublicPayload(publicPayload, exposeResult.publicPayload);
        return;
      }
      case "expose_outermost_ice_each_fort": {
        assertPublicVisibility(
          "expose_outermost_ice_each_fort",
          effect.visibility,
        );
        if (!context.exposeOutermostIceEachFort)
          throw new Error(
            "expose_outermost_ice_each_fort requires an exposeOutermostIceEachFort execution context.",
          );
        const exposeResult = context.exposeOutermostIceEachFort();
        mergePublicPayload(publicPayload, exposeResult.publicPayload);
        return;
      }
      case "show_hq_agendas_for_credits": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "show_hq_agendas_for_credits visibility must be hidden_info_barrier.",
          );
        assertPositiveIntegerAmount(
          "show_hq_agendas_for_credits",
          effect.creditPerAgenda,
        );
        if (!context.startShowHqAgendasForCredits)
          throw new Error(
            "show_hq_agendas_for_credits requires a startShowHqAgendasForCredits execution context.",
          );
        const revealResult = context.startShowHqAgendasForCredits(
          effect.creditPerAgenda,
        );
        mergePublicPayload(publicPayload, revealResult.publicPayload);
        return;
      }
      case "search_trash_to_grip": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "search_trash_to_grip visibility must be hidden_info_barrier.",
          );
        if (effect.filter !== "program" && effect.filter !== "any_card")
          throw new Error("search_trash_to_grip filter is invalid.");
        if (!context.startSearchTrashToGrip)
          throw new Error(
            "search_trash_to_grip requires a startSearchTrashToGrip execution context.",
          );
        const searchResult = context.startSearchTrashToGrip(effect.filter);
        mergePublicPayload(publicPayload, searchResult.publicPayload);
        return;
      }
      case "search_stack_to_grip": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "search_stack_to_grip visibility must be hidden_info_barrier.",
          );
        if (effect.filter !== "program" && effect.filter !== "any_card")
          throw new Error("search_stack_to_grip filter is invalid.");
        if (effect.shuffleAfterwards !== true)
          throw new Error("search_stack_to_grip must shuffle afterwards.");
        if (!context.startSearchStackToGrip)
          throw new Error(
            "search_stack_to_grip requires a startSearchStackToGrip execution context.",
          );
        const searchResult = context.startSearchStackToGrip(
          effect.filter,
          effect.revealToCorp,
          effect.shuffleAfterwards,
        );
        mergePublicPayload(publicPayload, searchResult.publicPayload);
        return;
      }
      case "move_top_trash_to_grip": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "move_top_trash_to_grip visibility must be hidden_info_barrier.",
          );
        if (effect.recipient !== "runner")
          throw new Error("move_top_trash_to_grip recipient must be runner.");
        if (!context.moveTopTrashToGrip)
          throw new Error(
            "move_top_trash_to_grip requires a moveTopTrashToGrip execution context.",
          );
        const moveResult = context.moveTopTrashToGrip();
        mergePublicPayload(publicPayload, moveResult.publicPayload);
        return;
      }
      case "search_stack_install": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "search_stack_install visibility must be hidden_info_barrier.",
          );
        if (effect.filter !== "program")
          throw new Error("search_stack_install supports only program filter.");
        if (effect.installCost !== "normal" && effect.installCost !== "free")
          throw new Error("search_stack_install installCost is invalid.");
        if (effect.shuffleAfterwards !== true)
          throw new Error("search_stack_install must shuffle afterwards.");
        if (!context.startSearchStackInstall)
          throw new Error(
            "search_stack_install requires a startSearchStackInstall execution context.",
          );
        const searchResult = context.startSearchStackInstall(
          effect.filter,
          effect.installCost,
          effect.shuffleAfterwards,
        );
        mergePublicPayload(publicPayload, searchResult.publicPayload);
        return;
      }
      case "choose_stack_or_trash_program_install": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "choose_stack_or_trash_program_install visibility must be hidden_info_barrier.",
          );
        if (
          effect.installCost !== "free" ||
          effect.shuffleStackIfSearched !== true ||
          effect.returnInstalledCardToGripAtEndOfTurn !== true
        )
          throw new Error(
            "choose_stack_or_trash_program_install supports only free temporary program installs.",
          );
        if (!context.startChooseStackOrTrashProgramInstall)
          throw new Error(
            "choose_stack_or_trash_program_install requires a host choice context.",
          );
        const choiceResult = context.startChooseStackOrTrashProgramInstall(
          effect.installCost,
          effect.shuffleStackIfSearched,
          effect.returnInstalledCardToGripAtEndOfTurn,
        );
        mergePublicPayload(publicPayload, choiceResult.publicPayload);
        return;
      }
      case "look_top_stack_show_to_corp_then_install_matching": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "look_top_stack_show_to_corp_then_install_matching visibility must be hidden_info_barrier.",
          );
        if (
          effect.count !== 5 ||
          effect.installCost !== "free" ||
          effect.trashSourceIfInstalled !== true ||
          effect.shuffleAfterwards !== true ||
          effect.allowedTypes.some((type) => type !== "program")
        )
          throw new Error(
            "look_top_stack_show_to_corp_then_install_matching supports only top-five free program installs.",
          );
        if (!context.startLookTopStackShowToCorpThenInstallMatching)
          throw new Error(
            "look_top_stack_show_to_corp_then_install_matching requires a host choice context.",
          );
        const lookResult =
          context.startLookTopStackShowToCorpThenInstallMatching(
            effect.count,
            effect.allowedTypes,
            effect.installCost,
            effect.trashSourceIfInstalled,
            effect.shuffleAfterwards,
          );
        mergePublicPayload(publicPayload, lookResult.publicPayload);
        return;
      }
      case "look_top_stack_take_matching": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "look_top_stack_take_matching visibility must be hidden_info_barrier.",
          );
        assertPositiveIntegerAmount("look_top_stack_take_matching", effect.count);
        if (
          !Number.isInteger(effect.costPerTaken) ||
          effect.costPerTaken < 0
        )
          throw new Error(
            "look_top_stack_take_matching costPerTaken must be a non-negative integer.",
          );
        if (effect.revealTakenToCorp !== true || effect.shuffleRemainder !== true)
          throw new Error(
            "look_top_stack_take_matching must reveal taken cards and shuffle remainder.",
          );
        if (!context.startLookTopStackTakeMatching)
          throw new Error(
            "look_top_stack_take_matching requires a startLookTopStackTakeMatching execution context.",
          );
        const lookResult = context.startLookTopStackTakeMatching(
          effect.count,
          effect.allowedTypes,
          effect.costPerTaken,
          effect.revealTakenToCorp,
          effect.shuffleRemainder,
        );
        mergePublicPayload(publicPayload, lookResult.publicPayload);
        return;
      }
      case "look_top_stack_take_one_arrange_rest": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "look_top_stack_take_one_arrange_rest visibility must be hidden_info_barrier.",
          );
        if (effect.count !== 5)
          throw new Error(
            "look_top_stack_take_one_arrange_rest supports only count 5.",
          );
        if (!context.startLookTopStackTakeOneArrangeRest)
          throw new Error(
            "look_top_stack_take_one_arrange_rest requires a startLookTopStackTakeOneArrangeRest execution context.",
          );
        const lookResult = context.startLookTopStackTakeOneArrangeRest(
          effect.count,
        );
        mergePublicPayload(publicPayload, lookResult.publicPayload);
        return;
      }
      case "trash_own_installed_cards_for_credits": {
        assertPublicVisibility(
          "trash_own_installed_cards_for_credits",
          effect.visibility,
        );
        if (effect.target !== "chosen_installed_runner_cards")
          throw new Error(
            "trash_own_installed_cards_for_credits target must be chosen_installed_runner_cards.",
          );
        if (effect.min !== 0 && effect.min !== 1)
          throw new Error(
            "trash_own_installed_cards_for_credits min must be 0 or 1.",
          );
        if (effect.max !== "any")
          throw new Error(
            "trash_own_installed_cards_for_credits max must be any.",
          );
        assertPositiveIntegerAmount(
          "trash_own_installed_cards_for_credits",
          effect.gainPerTrashed,
        );
        if (!context.startTrashOwnInstalledCardsForCredits)
          throw new Error(
            "trash_own_installed_cards_for_credits requires a host choice context.",
          );
        const choiceResult = context.startTrashOwnInstalledCardsForCredits(
          effect.min,
          effect.max,
          effect.gainPerTrashed,
        );
        mergePublicPayload(publicPayload, choiceResult.publicPayload);
        return;
      }
      case "trash_cards_from_grip_for_credits": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "trash_cards_from_grip_for_credits visibility must be hidden_info_barrier.",
          );
        if (effect.target !== "chosen_runner_grip_cards")
          throw new Error(
            "trash_cards_from_grip_for_credits target must be chosen_runner_grip_cards.",
          );
        assertPositiveIntegerAmount(
          "trash_cards_from_grip_for_credits",
          effect.max,
        );
        assertPositiveIntegerAmount(
          "trash_cards_from_grip_for_credits",
          effect.gainPerTrashed,
        );
        if (!context.startTrashCardsFromGripForCredits)
          throw new Error(
            "trash_cards_from_grip_for_credits requires a host choice context.",
          );
        const choiceResult = context.startTrashCardsFromGripForCredits(
          effect.max,
          effect.gainPerTrashed,
        );
        mergePublicPayload(publicPayload, choiceResult.publicPayload);
        return;
      }
      case "shuffle_grip_trash_and_stack_then_draw": {
        if (effect.visibility !== "hidden_info_barrier")
          throw new Error(
            "shuffle_grip_trash_and_stack_then_draw visibility must be hidden_info_barrier.",
          );
        assertPositiveIntegerAmount(
          "shuffle_grip_trash_and_stack_then_draw",
          effect.drawCount,
        );
        if (effect.removePlayedCardFromGame !== true)
          throw new Error(
            "shuffle_grip_trash_and_stack_then_draw must remove the played card from the game.",
          );
        if (!context.shuffleGripTrashAndStackThenDraw)
          throw new Error(
            "shuffle_grip_trash_and_stack_then_draw requires a host zone context.",
          );
        const shuffleResult = context.shuffleGripTrashAndStackThenDraw(
          effect.drawCount,
          effect.removePlayedCardFromGame,
        );
        mergePublicPayload(publicPayload, shuffleResult.publicPayload);
        return;
      }
      case "distribute_advancement_counters": {
        assertPositiveIntegerAmount(
          "distribute_advancement_counters",
          effect.amount,
        );
        assertPublicVisibility(
          "distribute_advancement_counters",
          effect.visibility,
        );
        if (effect.target !== "installed_advanceable_cards")
          throw new Error(
            "distribute_advancement_counters target must be installed_advanceable_cards.",
          );
        if (!context.startDistributeAdvancementCounters)
          throw new Error(
            "distribute_advancement_counters requires a host choice context.",
          );
        const choiceResult = context.startDistributeAdvancementCounters(
          effect.amount,
          effect.distribution,
        );
        mergePublicPayload(publicPayload, choiceResult.publicPayload);
        return;
      }
      case "move_advancement_counters": {
        assertPublicVisibility("move_advancement_counters", effect.visibility);
        if (effect.target !== "chosen_installed_advanceable_card")
          throw new Error(
            "move_advancement_counters target must be chosen_installed_advanceable_card.",
          );
        if (
          effect.maxAmount !== "all" &&
          (!Number.isInteger(effect.maxAmount) || effect.maxAmount <= 0)
        )
          throw new Error(
            "move_advancement_counters maxAmount must be all or a positive integer.",
          );
        if (!context.startMoveAdvancementCounters)
          throw new Error(
            "move_advancement_counters requires a host choice context.",
          );
        const choiceResult = context.startMoveAdvancementCounters(
          effect.source,
          effect.maxAmount,
        );
        mergePublicPayload(publicPayload, choiceResult.publicPayload);
        return;
      }
      case "add_hosted_credits": {
        assertPositiveIntegerAmount("add_hosted_credits", effect.amount);
        assertPublicVisibility("add_hosted_credits", effect.visibility);
        if ((effect as { target?: string }).target !== "source")
          throw new Error("add_hosted_credits effect target must be source.");
        if (!context.addHostedCredits)
          throw new Error(
            "add_hosted_credits effect requires an addHostedCredits execution context.",
          );
        const addResult = context.addHostedCredits(
          context.sourceCardId,
          effect.amount,
        );
        mergePublicPayload(publicPayload, addResult.publicPayload);
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "add_hosted_credits"),
          kind: "add_hosted_credits",
          visibility: effect.visibility,
          side: context.controller,
          amount: addResult.amount,
          counterType: "bit",
          addedCounterAmount: addResult.amount,
          remainingCounters: addResult.hostedCreditsAfter,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "take_hosted_credits": {
        assertPublicVisibility("take_hosted_credits", effect.visibility);
        if ((effect as { source?: string }).source !== "source")
          throw new Error("take_hosted_credits effect source must be source.");
        if ((effect as { recipient?: string }).recipient !== "controller")
          throw new Error(
            "take_hosted_credits effect recipient must be controller.",
          );
        const mode = effect.mode ?? "up_to_amount_if_available";
        if (mode !== "up_to_amount_if_available" && mode !== "all")
          throw new Error(
            "take_hosted_credits effect mode must be up_to_amount_if_available or all.",
          );
        if (mode === "up_to_amount_if_available") {
          if (effect.amount === undefined)
            throw new Error(
              "take_hosted_credits amount mode requires an amount.",
            );
          assertPositiveIntegerAmount("take_hosted_credits", effect.amount);
        }
        if (!context.takeHostedCredits)
          throw new Error(
            "take_hosted_credits effect requires a takeHostedCredits execution context.",
          );
        const side = recipientSide(context, effect.recipient);
        const takeResult = context.takeHostedCredits(
          context.sourceCardId,
          side,
          mode === "all" ? "all" : effect.amount!,
        );
        mergePublicPayload(publicPayload, takeResult.publicPayload);
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "take_hosted_credits"),
          kind: "take_hosted_credits",
          visibility: effect.visibility,
          side,
          amount: takeResult.amount,
          counterType: "bit",
          removedCounterAmount: takeResult.amount,
          remainingCounters: takeResult.hostedCreditsAfter,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "trash_source_when_empty": {
        assertPublicVisibility("trash_source_when_empty", effect.visibility);
        if ((effect as { source?: string }).source !== "source")
          throw new Error(
            "trash_source_when_empty effect source must be source.",
          );
        if (!context.trashSourceWhenEmpty)
          throw new Error(
            "trash_source_when_empty effect requires a trashSourceWhenEmpty execution context.",
          );
        const trashResult = context.trashSourceWhenEmpty(context.sourceCardId);
        mergePublicPayload(publicPayload, trashResult.publicPayload);
        if (!trashResult.sourceTrashed) return;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "trash_source_when_empty"),
          kind: "trash_source_when_empty",
          visibility: effect.visibility,
          side: context.controller,
          amount: 1,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "gain_actions": {
        assertPositiveIntegerAmount("gain_actions", effect.amount);
        assertPublicVisibility("gain_actions", effect.visibility);
        const side = recipientSide(context, effect.recipient);
        if (side === "corp") state.corp.clicks += effect.amount;
        else state.runner.clicks += effect.amount;
        publicPayload.gainedActions =
          Number(publicPayload.gainedActions ?? 0) + effect.amount;
        publicPayload[
          side === "corp" ? "corpClicksAfter" : "runnerClicksAfter"
        ] = side === "corp" ? state.corp.clicks : state.runner.clicks;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "gain_actions"),
          kind: "gain_actions",
          visibility: effect.visibility,
          side,
          amount: effect.amount,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "trash_source": {
        assertPublicVisibility("trash_source", effect.visibility);
        if (!context.trashSource)
          throw new Error(
            "trash_source effect requires a trashSource execution context.",
          );
        const trashResult = context.trashSource(context.sourceCardId);
        mergePublicPayload(publicPayload, trashResult.publicPayload);
        if (!trashResult.sourceTrashed) return;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "trash_source"),
          kind: "trash_source",
          visibility: effect.visibility,
          side: context.controller,
          amount: 1,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "use_base_link":
      case "increase_trace_link": {
        throw new Error(
          `${effect.kind} effects are resolved by the trace window host.`,
        );
      }
      default: {
        const unknownEffect = effect as { kind?: string };
        throw new Error(
          `Unsupported card implementation effect: ${
            unknownEffect.kind ?? "unknown"
          }`,
        );
      }
    }
  });

  return { publicPayload, resolvedEffects };
}
