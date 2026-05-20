/**
 * Orchestrates generic CardImplementation execution.
 *
 * The runtime turns declarative card abilities and lifecycle hooks into actions
 * or ordered effect execution. It owns CardImplementation revalidation and
 * payload merging, but delegates engine primitives through dependencies so it
 * does not import index.ts or contain card-specific branches.
 */
import type {
  ActionType,
  CardDefinition,
  CardInstance,
  CardInstanceId,
  DamageType,
  GameState,
  LegalAction,
  ResolvedGameEffect,
  Side,
  TraceSuccessEffect,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import {
  executeCardImplementationEffects,
  type CardEffectDamageResult,
  type CardEffectDrawCardsResult,
  type CardEffectHostedCreditsResult,
  type CardEffectTrashSourceResult,
} from "./effect-interpreter";
import {
  canUseCardImplementationAbilityLimit,
  cardImplementationAbilityLimitFailureMessage,
  markCardImplementationAbilityLimitUsed,
  type CardImplementationAbilityLimitHost,
} from "./card-implementation-ability-limits";
import type {
  ActivatedCardAbilityImplementation,
  CardConditionImplementation,
  CardEffectImplementation,
  CardLifecycleImplementation,
  CardLifecycleTriggeredAbilityImplementation,
  OnPlayCardAbilityImplementation,
} from "./definition-types";

type ImmediateLifecycle = Exclude<
  keyof CardLifecycleImplementation,
  | "start_of_corp_turn"
  | "start_of_runner_turn"
  | "end_of_runner_turn"
  | "on_runner_run_start"
>;

type RuntimeEffectCollector = ResolvedGameEffect[];

export type CardImplementationRuntimeDependencies = {
  // Host-owned primitives keep movement, payment, draw, damage, and trash
  // semantics centralized in the engine while this runtime stays card-generic.
  definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
  mustInstance: (
    source: Record<CardInstanceId, CardInstance>,
    cardId: CardInstanceId,
  ) => CardInstance;
  cardCounter: (
    state: GameState,
    cardId: CardInstanceId,
    counterType: "bit",
  ) => number;
  rezzedCorpRootCardIds: (state: GameState) => CardInstanceId[];
  runnerInstalledCardIds: (state: GameState) => CardInstanceId[];
  runnerRunAttemptsLastTurn: (state: GameState) => number;
  spendClick: (state: GameState, side: Side) => void;
  createAction: (
    state: GameState,
    side: Side,
    type: ActionType,
    label: string,
    source: LegalAction["source"],
    costs?: LegalAction["costs"],
    payload?: LegalAction["payload"],
  ) => LegalAction;
  appendResolvedEffectsToPayload: (
    legalAction: LegalAction | undefined,
    effects: RuntimeEffectCollector,
  ) => void;
  drawCards: (
    state: GameState,
    side: Side,
    amount: number,
  ) => CardEffectDrawCardsResult;
  damageRunner: (
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinition["id"],
    damageType: Extract<DamageType, "meat">,
    amount: number,
  ) => CardEffectDamageResult;
  startTrace: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    baseTraceStrength: number,
    successEffect: TraceSuccessEffect,
  ) => Record<string, string | number | boolean>;
  addHostedCredits: (
    state: GameState,
    sourceCardId: CardInstanceId,
    amount: number,
  ) => CardEffectHostedCreditsResult;
  takeHostedCredits: (
    state: GameState,
    sourceCardId: CardInstanceId,
    side: Side,
    amount: number | "all",
  ) => CardEffectHostedCreditsResult;
  trashSourceWhenEmpty: (
    state: GameState,
    sourceCardId: CardInstanceId,
  ) => CardEffectTrashSourceResult;
  trashSource: (
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction?: LegalAction,
  ) => CardEffectTrashSourceResult;
  abilityLimits: CardImplementationAbilityLimitHost;
};

function printedCostOnPlayImplementation(
  definition: CardDefinition,
): OnPlayCardAbilityImplementation | undefined {
  return cardImplementationForDefinitionId(definition.id)?.abilities?.find(
    (ability): ability is OnPlayCardAbilityImplementation =>
      ability.kind === "on_play" && ability.costs === "printed",
  );
}

/**
 * Evaluates the small declarative condition vocabulary used by migrated cards.
 *
 * Conditions are checked during LegalAction generation and revalidation;
 * unsupported condition kinds fail closed instead of silently becoming legal.
 */
function cardImplementationConditionMet(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  condition: CardConditionImplementation,
  sourceCardId?: CardInstanceId,
): boolean {
  switch (condition.kind) {
    case "runner_is_tagged":
      return state.runner.tags > 0;
    case "source_has_hosted_credits":
      return Boolean(
        sourceCardId &&
          state.cardInstances[sourceCardId] &&
          deps.cardCounter(state, sourceCardId, "bit") > 0,
      );
    case "runner_attempted_run_last_turn":
      return (
        deps.runnerRunAttemptsLastTurn(state) >=
        Math.max(0, condition.minimumRuns)
      );
    default: {
      const unknownCondition = condition as { kind?: string };
      throw new Error(
        `Unsupported card implementation condition: ${
          unknownCondition.kind ?? "unknown"
        }`,
      );
    }
  }
}

function canResolveOnPlayCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  ability: OnPlayCardAbilityImplementation,
): boolean {
  return ability.condition
    ? cardImplementationConditionMet(deps, state, ability.condition)
    : true;
}

function canResolveActivatedCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  ability: ActivatedCardAbilityImplementation,
  sourceCardId?: CardInstanceId,
): boolean {
  if (
    ability.condition &&
    !cardImplementationConditionMet(deps, state, ability.condition, sourceCardId)
  )
    return false;
  if (
    !canUseCardImplementationAbilityLimit(
      deps.abilityLimits,
      state,
      sourceCardId,
      ability.limit,
    )
  )
    return false;
  return true;
}

export function canPlayPrintedCostOnPlayImplementation(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  definition: CardDefinition,
): boolean {
  const ability = printedCostOnPlayImplementation(definition);
  return ability
    ? canResolveOnPlayCardImplementationAbility(deps, state, ability)
    : false;
}

function assertOnPlayCardImplementationAbilityCanResolve(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  ability: OnPlayCardAbilityImplementation,
): void {
  if (canResolveOnPlayCardImplementationAbility(deps, state, ability)) return;
  if (ability.condition?.kind === "runner_is_tagged")
    throw new Error("Der Runner muss getaggt sein.");
  if (ability.condition?.kind === "runner_attempted_run_last_turn")
    throw new Error("Der Runner hat im letzten Zug nicht genug Runs versucht.");
  throw new Error("Die On-Play-Kartenbedingung ist nicht erfuellt.");
}

function assertActivatedCardImplementationAbilityCanResolve(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  ability: ActivatedCardAbilityImplementation,
  sourceCardId?: CardInstanceId,
): void {
  if (
    canResolveActivatedCardImplementationAbility(
      deps,
      state,
      ability,
      sourceCardId,
    )
  )
    return;
  if (ability.condition?.kind === "runner_is_tagged")
    throw new Error("Der Runner muss getaggt sein.");
  if (ability.condition?.kind === "source_has_hosted_credits")
    throw new Error("Auf der Quelle muessen Credits liegen.");
  if (ability.condition?.kind === "runner_attempted_run_last_turn")
    throw new Error("Der Runner hat im letzten Zug nicht genug Runs versucht.");
  const limitFailureMessage = cardImplementationAbilityLimitFailureMessage(
    ability.limit,
  );
  if (limitFailureMessage) throw new Error(limitFailureMessage);
  throw new Error("Die aktivierte Kartenbedingung ist nicht erfuellt.");
}

function cardImplementationLifecycleEffects(
  definition: CardDefinition,
  lifecycle: ImmediateLifecycle,
): readonly CardEffectImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle?.[lifecycle] ??
    []
  );
}

function lifecycleReason(lifecycle: ImmediateLifecycle): string | undefined {
  return lifecycle === "on_leave_play" ? "source_left_play" : undefined;
}

/**
 * Dispatches immediate lifecycle effects such as on_rez, on_install, and
 * on_score for one source card.
 *
 * These hooks are intentionally narrow lifecycle entry points, not a general
 * trigger registry. Callers choose the timing and source; this helper only
 * executes the declared effects for the current source.
 */
export function executeCardImplementationLifecycleEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction | undefined,
  definition: CardDefinition,
  cardId: CardInstanceId,
  lifecycle: ImmediateLifecycle,
): void {
  const effects = cardImplementationLifecycleEffects(definition, lifecycle);
  if (effects.length === 0) return;
  const reason = lifecycleReason(lifecycle);
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: cardId,
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      controller: deps.mustInstance(state.cardInstances, cardId).controller,
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
      takeHostedCredits: (sourceCardId, side, amount) =>
        deps.takeHostedCredits(state, sourceCardId, side, amount),
      trashSourceWhenEmpty: (sourceCardId) =>
        deps.trashSourceWhenEmpty(state, sourceCardId),
      trashSource: (sourceCardId) =>
        deps.trashSource(state, sourceCardId, legalAction),
      ...(reason ? { reason } : {}),
    },
    effects,
  );
  if (!legalAction) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: definition.id,
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
}

function cardImplementationStartOfCorpTurnAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.start_of_corp_turn ?? []
  );
}

function cardImplementationStartOfRunnerTurnAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.start_of_runner_turn ?? []
  );
}

function cardImplementationRunnerRunStartAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.on_runner_run_start ?? []
  );
}

function cardImplementationEndOfRunnerTurnAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.end_of_runner_turn ?? []
  );
}

function cardImplementationStartOfCorpTurnSourceIds(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
): CardInstanceId[] {
  return [...deps.rezzedCorpRootCardIds(state), ...state.corp.scoreArea].sort();
}

function cardImplementationRunnerInstalledSourceIds(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
): CardInstanceId[] {
  return deps.runnerInstalledCardIds(state).slice().sort();
}

function isActiveCardImplementationStartOfCorpTurnSource(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
): boolean {
  const instance = state.cardInstances[cardId];
  if (!instance || instance.controller !== "corp") return false;
  if (
    definition.type === "agenda" &&
    instance.zone.side === "corp" &&
    instance.zone.zone === "scoreArea" &&
    state.corp.scoreArea.includes(cardId)
  )
    return true;
  if (definition.type === "agenda") return false;
  return (
    instance.zone.side === "corp" &&
    instance.zone.zone === "serverRoot" &&
    instance.rezzed === true &&
    state.corp.servers.some((server) => server.root.includes(cardId))
  );
}

function isActiveCardImplementationStartOfRunnerTurnSource(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const instance = state.cardInstances[cardId];
  return (
    instance?.controller === "runner" &&
    instance.zone.side === "runner" &&
    instance.zone.zone === "rig" &&
    deps.runnerInstalledCardIds(state).includes(cardId)
  );
}

/**
 * Runs deterministic start-of-Corp-turn lifecycle effects for active Corp
 * sources only. The caller owns turn transition ordering; this helper just
 * queries eligible CardImplementation sources and executes their effects.
 */
export function executeCardImplementationStartOfCorpTurnEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  effects?: RuntimeEffectCollector,
): void {
  const sourceIds = cardImplementationStartOfCorpTurnSourceIds(deps, state);
  for (const cardId of sourceIds) {
    const instance = state.cardInstances[cardId];
    if (!instance) continue;
    const definition = deps.definitionFor(state, cardId);
    const startAbilities = cardImplementationStartOfCorpTurnAbilities(definition);
    if (startAbilities.length === 0) continue;
    if (
      !isActiveCardImplementationStartOfCorpTurnSource(
        deps,
        state,
        cardId,
        definition,
      )
    )
      continue;
    for (const ability of startAbilities) {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        continue;
      const result = executeCardImplementationEffects(
        state,
        {
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          controller: instance.controller,
          reason: "start_of_turn",
          addHostedCredits: (sourceCardId, amount) =>
            deps.addHostedCredits(state, sourceCardId, amount),
          takeHostedCredits: (sourceCardId, side, amount) =>
            deps.takeHostedCredits(state, sourceCardId, side, amount),
          trashSourceWhenEmpty: (sourceCardId) =>
            deps.trashSourceWhenEmpty(state, sourceCardId),
          trashSource: (sourceCardId) => deps.trashSource(state, sourceCardId),
        },
        ability.effects,
      );
      effects?.push(...result.resolvedEffects);
      if (
        !isActiveCardImplementationStartOfCorpTurnSource(
          deps,
          state,
          cardId,
          definition,
        )
      )
        break;
    }
  }
}

/**
 * Runs deterministic start-of-Runner-turn lifecycle effects for installed
 * Runner sources only. This is intentionally narrower than a general trigger
 * system and has no optional trigger or priority handling.
 */
export function executeCardImplementationStartOfRunnerTurnEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  effects?: RuntimeEffectCollector,
): void {
  const sourceIds = cardImplementationRunnerInstalledSourceIds(deps, state);
  for (const cardId of sourceIds) {
    const instance = state.cardInstances[cardId];
    if (!instance) continue;
    const definition = deps.definitionFor(state, cardId);
    const startAbilities =
      cardImplementationStartOfRunnerTurnAbilities(definition);
    if (startAbilities.length === 0) continue;
    if (
      !isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId)
    )
      continue;
    for (const ability of startAbilities) {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        continue;
      const result = executeCardImplementationEffects(
        state,
        {
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          controller: instance.controller,
          reason: "start_of_turn",
          addHostedCredits: (sourceCardId, amount) =>
            deps.addHostedCredits(state, sourceCardId, amount),
          takeHostedCredits: (sourceCardId, side, amount) =>
            deps.takeHostedCredits(state, sourceCardId, side, amount),
          trashSourceWhenEmpty: (sourceCardId) =>
            deps.trashSourceWhenEmpty(state, sourceCardId),
          trashSource: (sourceCardId) => deps.trashSource(state, sourceCardId),
        },
        ability.effects,
      );
      effects?.push(...result.resolvedEffects);
      if (!isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId))
        break;
    }
  }
}

/**
 * Runs the narrow runner-run-start lifecycle path for installed Runner sources.
 *
 * It exists for source-scoped cleanup effects and must not grow into a general
 * run/access replacement engine.
 */
export function executeCardImplementationRunnerRunStartEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction?: LegalAction,
): void {
  const sourceIds = cardImplementationRunnerInstalledSourceIds(deps, state);
  for (const cardId of sourceIds) {
    const instance = state.cardInstances[cardId];
    if (!instance) continue;
    const definition = deps.definitionFor(state, cardId);
    const runStartAbilities = cardImplementationRunnerRunStartAbilities(definition);
    if (runStartAbilities.length === 0) continue;
    if (
      !isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId)
    )
      continue;
    for (const ability of runStartAbilities) {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        continue;
      const result = executeCardImplementationEffects(
        state,
        {
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          controller: instance.controller,
          reason: "run_start",
          addHostedCredits: (sourceCardId, amount) =>
            deps.addHostedCredits(state, sourceCardId, amount),
          takeHostedCredits: (sourceCardId, side, amount) =>
            deps.takeHostedCredits(state, sourceCardId, side, amount),
          trashSourceWhenEmpty: (sourceCardId) =>
            deps.trashSourceWhenEmpty(state, sourceCardId),
          trashSource: (sourceCardId) =>
            deps.trashSource(state, sourceCardId, legalAction),
        },
        ability.effects,
      );
      deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
      if (!isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId))
        break;
    }
  }
}

function endOfRunnerTurnPayload(
  cardId: CardInstanceId,
  abilityIndex: number,
): Record<string, string | number | boolean> {
  return {
    cardId,
    cardImplementationLifecycleAction: "end_of_runner_turn",
    cardImplementationLifecycleAbilityIndex: abilityIndex,
  };
}

export function pushCardImplementationEndOfRunnerTurnActions(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  actions: LegalAction[],
): void {
  for (const cardId of cardImplementationRunnerInstalledSourceIds(deps, state)) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.controller !== "runner") continue;
    const definition = deps.definitionFor(state, cardId);
    const abilities = cardImplementationEndOfRunnerTurnAbilities(definition);
    if (abilities.length === 0) continue;
    if (
      !isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId)
    )
      continue;
    abilities.forEach((ability, index) => {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        return;
      actions.push(
        deps.createAction(
          state,
          "runner",
          "end_turn",
          `${definition.title} trashen und Zug beenden`,
          cardId,
          [],
          endOfRunnerTurnPayload(cardId, index),
        ),
      );
    });
  }
}

export function resolveCardImplementationEndOfRunnerTurnAction(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
): boolean {
  if (
    legalAction.payload?.cardImplementationLifecycleAction !==
    "end_of_runner_turn"
  )
    return false;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf diese End-of-turn-Faehigkeit nutzen.");
  if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
    throw new Error(
      "Diese End-of-turn-Faehigkeit ist nur am Ende des Runner-Zugs nutzbar.",
    );
  const cardId = legalAction.payload.cardId;
  if (typeof cardId !== "string" || !state.cardInstances[cardId])
    throw new Error("Die End-of-turn-Faehigkeit hat keine gueltige Quelle.");
  if (!isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId))
    throw new Error("Die End-of-turn-Faehigkeit ist nicht installiert.");
  const definition = deps.definitionFor(state, cardId);
  const abilityIndex = Number(
    legalAction.payload.cardImplementationLifecycleAbilityIndex,
  );
  const ability = cardImplementationEndOfRunnerTurnAbilities(definition)[
    abilityIndex
  ];
  if (!ability || !Number.isInteger(abilityIndex) || abilityIndex < 0)
    throw new Error("Die End-of-turn-Faehigkeit passt nicht zur Karte.");
  if (
    ability.condition &&
    !cardImplementationConditionMet(deps, state, ability.condition, cardId)
  )
    throw new Error("Die End-of-turn-Kartenbedingung ist nicht erfuellt.");
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: cardId,
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      controller: deps.mustInstance(state.cardInstances, cardId).controller,
      reason: "end_of_turn",
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
      takeHostedCredits: (sourceCardId, side, amount) =>
        deps.takeHostedCredits(state, sourceCardId, side, amount),
      trashSourceWhenEmpty: (sourceCardId) =>
        deps.trashSourceWhenEmpty(state, sourceCardId),
      trashSource: (sourceCardId) =>
        deps.trashSource(state, sourceCardId, legalAction),
    },
    ability.effects,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: definition.id,
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
  return true;
}

function activatedCardImplementationAbilitiesForTiming(
  definition: CardDefinition,
  timing: ActivatedCardAbilityImplementation["timing"],
): Array<{ ability: ActivatedCardAbilityImplementation; index: number }> {
  const implementation = cardImplementationForDefinitionId(definition.id);
  return (
    implementation?.abilities
      ?.map((ability, index) => ({ ability, index }))
      .filter(
        (
          entry,
        ): entry is {
          ability: ActivatedCardAbilityImplementation;
          index: number;
        } => entry.ability.kind === "activated" && entry.ability.timing === timing,
      ) ?? []
  );
}

function actionCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  const actionCosts = ability.costs.filter((cost) => cost.kind === "action");
  if (
    ability.costs.length !== 1 ||
    actionCosts.length !== 1 ||
    !Number.isInteger(actionCosts[0]?.amount) ||
    (actionCosts[0]?.amount ?? 0) <= 0
  ) {
    throw new Error(
      "Activated CardImplementation ability supports exactly one positive action cost.",
    );
  }
  return actionCosts[0]!.amount;
}

function activatedAbilityPayload(
  cardId: CardInstanceId,
  ability: ActivatedCardAbilityImplementation,
  abilityIndex: number,
): Record<string, string | number | boolean> {
  return {
    cardId,
    cardImplementationAbility: "activated",
    cardImplementationAbilityIndex: abilityIndex,
    cardImplementationAbilityTiming: ability.timing,
    ...(ability.label ? { cardImplementationAbilityLabel: ability.label } : {}),
  };
}

/**
 * Adds LegalActions for active declarative abilities on an already-valid source.
 *
 * This is action construction only. The same source, timing, condition, cost,
 * and limit rules are checked again by resolveActivatedCardImplementationAbility
 * before any click is spent or effect mutates state.
 */
export function pushActivatedCardImplementationActions(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  actions: LegalAction[],
  side: Side,
  sourceCardId: CardInstanceId,
  definition: CardDefinition,
): void {
  if (deps.mustInstance(state.cardInstances, sourceCardId).controller !== side)
    return;
  const timing = side === "corp" ? "corp_main" : "runner_main";
  for (const { ability, index } of activatedCardImplementationAbilitiesForTiming(
    definition,
    timing,
  )) {
    if (
      !canResolveActivatedCardImplementationAbility(
        deps,
        state,
        ability,
        sourceCardId,
      )
    )
      continue;
    const actionCost = actionCostForActivatedAbility(ability);
    const availableClicks =
      side === "corp" ? state.corp.clicks : state.runner.clicks;
    if (availableClicks < actionCost) continue;
    actions.push(
      deps.createAction(
        state,
        side,
        "activated_card_ability",
        ability.label ?? `${definition.title}: Fähigkeit nutzen`,
        sourceCardId,
        [{ clicks: actionCost }],
        activatedAbilityPayload(sourceCardId, ability, index),
      ),
    );
  }
}

function corpActivatedCardImplementationSourceIsAvailable(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
): boolean {
  if (definition.type === "agenda") return state.corp.scoreArea.includes(cardId);
  return deps.rezzedCorpRootCardIds(state).includes(cardId);
}

function activatedAbilityForLegalAction(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
): {
  cardId: CardInstanceId;
  definition: CardDefinition;
  ability: ActivatedCardAbilityImplementation;
  abilityIndex: number;
} | undefined {
  if (legalAction.payload?.cardImplementationAbility !== "activated")
    return undefined;
  const cardId = legalAction.payload.cardId;
  if (typeof cardId !== "string" || !state.cardInstances[cardId])
    throw new Error("Die aktivierte Kartenfaehigkeit hat keine gueltige Quelle.");
  const definition = deps.definitionFor(state, cardId);
  const abilityIndex = Number(legalAction.payload.cardImplementationAbilityIndex);
  if (!Number.isInteger(abilityIndex) || abilityIndex < 0)
    throw new Error("Die aktivierte Kartenfaehigkeit hat keinen gueltigen Index.");
  const ability = cardImplementationForDefinitionId(definition.id)?.abilities?.[
    abilityIndex
  ];
  if (!ability || ability.kind !== "activated")
    throw new Error("Die aktivierte Kartenfaehigkeit passt nicht zur Karte.");
  return { cardId, definition, ability, abilityIndex };
}

function validateActivatedCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
  match: {
    cardId: CardInstanceId;
    definition: CardDefinition;
    ability: ActivatedCardAbilityImplementation;
    abilityIndex: number;
  },
): void {
  const { cardId, ability } = match;
  if (deps.mustInstance(state.cardInstances, cardId).controller !== legalAction.side)
    throw new Error("Diese aktivierte Kartenfaehigkeit gehoert der anderen Seite.");
  const actionCost = actionCostForActivatedAbility(ability);
  if (legalAction.costs[0]?.clicks !== actionCost)
    throw new Error("Die aktivierte Kartenfaehigkeit hat andere Aktionskosten.");
  if (
    legalAction.payload?.cardImplementationAbilityTiming !== ability.timing ||
    legalAction.payload?.cardImplementationAbilityIndex !== match.abilityIndex
  )
    throw new Error("Die aktivierte Kartenfaehigkeit passt nicht zum Profil.");
  if (ability.timing === "runner_main") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf diese aktivierte Kartenfaehigkeit nutzen.");
    if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
      throw new Error(
        "Diese aktivierte Kartenfaehigkeit ist nur in der Runner-Aktionsphase nutzbar.",
      );
    if (!deps.runnerInstalledCardIds(state).includes(cardId))
      throw new Error("Die aktivierte Runner-Kartenfaehigkeit ist nicht installiert.");
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf diese aktivierte Kartenfaehigkeit nutzen.");
  if (state.phase !== "corp_action_phase" || state.activeSide !== "corp")
    throw new Error(
      "Diese aktivierte Kartenfaehigkeit ist nur in der Korp-Aktionsphase nutzbar.",
    );
  if (
    !corpActivatedCardImplementationSourceIsAvailable(
      deps,
      state,
      cardId,
      match.definition,
    )
  )
    throw new Error("Die aktivierte Korp-Kartenfaehigkeit ist nicht verfuegbar.");
  assertActivatedCardImplementationAbilityCanResolve(
    deps,
    state,
    ability,
    cardId,
  );
}

/**
 * Revalidates and resolves one activated CardImplementation ability.
 *
 * Costs are paid only after source status, timing, conditions, and ability
 * limits have been checked against the current state, which rejects stale
 * actions without partial effect execution.
 */
export function resolveActivatedCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
): boolean {
  const match = activatedAbilityForLegalAction(deps, state, legalAction);
  if (!match) return false;
  validateActivatedCardImplementationAbility(deps, state, legalAction, match);
  const actionCost = actionCostForActivatedAbility(match.ability);
  for (let spentClicks = 0; spentClicks < actionCost; spentClicks += 1) {
    deps.spendClick(state, legalAction.side);
  }
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: match.cardId,
      sourceDefinitionId: match.definition.id,
      sourceTitle: match.definition.title,
      controller: deps.mustInstance(state.cardInstances, match.cardId).controller,
      drawCards: (side, amount) => deps.drawCards(state, side, amount),
      damageRunner: (damageType, amount) =>
        deps.damageRunner(
          state,
          legalAction,
          match.definition.id,
          damageType,
          amount,
        ),
      startTrace: (sourceCardId, baseTraceStrength, successEffect) => ({
        ...deps.startTrace(
          state,
          legalAction,
          sourceCardId,
          match.definition.id,
          baseTraceStrength,
          successEffect,
        ),
      }),
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
      takeHostedCredits: (sourceCardId, side, amount) =>
        deps.takeHostedCredits(state, sourceCardId, side, amount),
      trashSourceWhenEmpty: (sourceCardId) =>
        deps.trashSourceWhenEmpty(state, sourceCardId),
    },
    match.ability.effects,
  );
  if (match.ability.limit)
    markCardImplementationAbilityLimitUsed(
      deps.abilityLimits,
      state,
      match.cardId,
      match.ability.limit,
    );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: match.definition.id,
    ...(match.ability.limit
      ? {
          cardImplementationAbilityLimit: match.ability.limit.kind,
          cardImplementationSourceAbilityUsedThisTurn: true,
        }
      : {}),
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
  return true;
}

/**
 * Resolves a printed-cost on-play CardImplementation ability after the host has
 * accepted the play action. The runtime executes only declarative effects; play
 * legality, card movement, and printed cost payment stay in the host.
 */
export function executeOnPlayCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
  definition: CardDefinition,
  cardId: CardInstanceId,
): void {
  const ability = printedCostOnPlayImplementation(definition);
  if (!ability)
    throw new Error(`Kein On-Play-Implementation-Resolver fuer ${definition.id}.`);
  assertOnPlayCardImplementationAbilityCanResolve(deps, state, ability);
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: cardId,
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      controller: deps.mustInstance(state.cardInstances, cardId).controller,
      drawCards: (side, amount) => deps.drawCards(state, side, amount),
      damageRunner: (damageType, amount) =>
        deps.damageRunner(state, legalAction, definition.id, damageType, amount),
      startTrace: (sourceCardId, baseTraceStrength, successEffect) => ({
        ...deps.startTrace(
          state,
          legalAction,
          sourceCardId,
          definition.id,
          baseTraceStrength,
          successEffect,
        ),
      }),
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
      takeHostedCredits: (sourceCardId, side, amount) =>
        deps.takeHostedCredits(state, sourceCardId, side, amount),
      trashSourceWhenEmpty: (sourceCardId) =>
        deps.trashSourceWhenEmpty(state, sourceCardId),
    },
    ability.effects,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
}
