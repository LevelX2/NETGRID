import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type CounterType,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import type { RestrictedHostedCreditUse } from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  ARMADILLO_ARMORED_ROAD_HOME_ID,
  BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE,
  DRIFTER_MOBILE_ENVIRONMENT_ID,
  HELLS_RUN_ID,
  ZZ22_SPEED_CHIP_ID,
} from "../../compatibility/runtime-compatibility";
import {
  COROLLA_SPEED_CHIP_STRENGTH_HARDWARE_ID,
  ZETATECH_SOFTWARE_INSTALLER_OVERLAY_HOST_ID,
} from "../../mechanics/longtail-card-effects";

type ActiveRun = NonNullable<GameState["run"]>;

type RestrictedHostedCreditPaymentOptions = {
  breakerId?: CardInstanceId | undefined;
  accessedCardId?: CardInstanceId | undefined;
  installCardType?: CardDefinition["type"] | undefined;
};

export type RunDurationPaymentHost = {
  state: GameState;
};

export type RunnerRunCreditSpendResult = {
  handled: boolean;
  paid?: boolean;
  amount?: number;
  normalCreditsSpent?: number;
  hostedCreditsSpent?: number;
  recurringCreditsSpent?: number;
  temporaryRunCreditsSpent?: number;
  badPublicityCreditsSpent?: number;
  remainingTemporaryRunCredits?: number;
  runSpendingCapUsed?: number;
  stateChanged?: boolean;
};

export type RunTaxPaymentResult = {
  handled: boolean;
  paid: boolean;
  amount: number;
  runShouldEnd?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
  stateChanged?: boolean;
};

export type JackOutCostPaymentResult = RunTaxPaymentResult;
export type EncounterTaxPaymentResult = RunTaxPaymentResult;
export type RunOnlyCreditSpendResult = RunnerRunCreditSpendResult;
export type RunSpendingCapResult = {
  handled: boolean;
  runSpendingCapUsed?: number;
};

const TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS = new Set([
  ARMADILLO_ARMORED_ROAD_HOME_ID,
  DRIFTER_MOBILE_ENVIRONMENT_ID,
]);

export function runDurationPaymentHost(
  state: GameState,
): RunDurationPaymentHost {
  return { state };
}

export function restrictedHostedCreditSourceForDefinition(
  definition: CardDefinition,
) {
  return cardImplementationForDefinitionId(definition.id)
    ?.restrictedHostedCreditSource;
}

export function isRestrictedHostedCreditSource(
  definition: CardDefinition,
): boolean {
  return Boolean(restrictedHostedCreditSourceForDefinition(definition));
}

export function shouldLoadLegacyRecurringCredits(
  definition: CardDefinition,
): boolean {
  return (
    (definition.recurringCredits ?? 0) > 0 &&
    !isRestrictedHostedCreditSource(definition) &&
    !cardImplementationForDefinitionId(definition.id)?.virusCounter
  );
}

export function hostedPaymentCounterTypeForSource(
  state: GameState,
  cardId: CardInstanceId,
): Extract<CounterType, "bit" | "recurring_credit"> {
  return isRestrictedHostedCreditSource(definitionFor(state, cardId))
    ? "bit"
    : "recurring_credit";
}

export function hostedPaymentCredits(
  state: GameState,
  cardId: CardInstanceId,
): number {
  return cardCounter(state, cardId, hostedPaymentCounterTypeForSource(state, cardId));
}

export function spendHostedPaymentCredits(
  state: GameState,
  cardId: CardInstanceId,
  amount: number,
): void {
  spendCardCounter(
    state,
    cardId,
    hostedPaymentCounterTypeForSource(state, cardId),
    amount,
  );
}

export function restrictedHostedCreditSourceIds(
  state: GameState,
  use: RestrictedHostedCreditUse,
  options: RestrictedHostedCreditPaymentOptions = {},
): CardInstanceId[] {
  return runnerInstalledCardIds(state)
    .filter((cardId) =>
      restrictedHostedCreditSourceMatchesUse(state, cardId, use, options),
    )
    .sort();
}

export function restrictedHostedCredits(
  state: GameState,
  use: RestrictedHostedCreditUse,
  options: RestrictedHostedCreditPaymentOptions = {},
): number {
  return restrictedHostedCreditSourceIds(state, use, options).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "bit"),
    0,
  );
}

export function spendRestrictedHostedCredits(
  state: GameState,
  use: RestrictedHostedCreditUse,
  amount: number,
  options: RestrictedHostedCreditPaymentOptions = {},
): {
  spent: number;
  sourceDefinitionIds: string[];
} {
  let remaining = Math.max(0, Math.floor(amount));
  let spent = 0;
  const sourceDefinitionIds = new Set<string>();
  for (const cardId of restrictedHostedCreditSourceIds(state, use, options)) {
    if (remaining <= 0) break;
    const cardSpent = Math.min(cardCounter(state, cardId, "bit"), remaining);
    if (cardSpent <= 0) continue;
    spendCardCounter(state, cardId, "bit", cardSpent);
    remaining -= cardSpent;
    spent += cardSpent;
    sourceDefinitionIds.add(definitionFor(state, cardId).id);
  }
  return { spent, sourceDefinitionIds: [...sourceDefinitionIds].sort() };
}

export function runnerRunRecurringCreditSourceIds(
  host: RunDurationPaymentHost,
  breakerId?: CardInstanceId,
): CardInstanceId[] {
  const state = host.state;
  const noisyBreaker =
    breakerId &&
    state.cardInstances[breakerId] &&
    state.runner.rig.programs.includes(breakerId)
      ? cardHasSubtype(definitionFor(state, breakerId), "noisy")
      : false;
  const runnerRig = [
    ...state.runner.rig.hardware,
    ...state.runner.rig.programs,
    ...state.runner.rig.resources,
  ];
  const restrictedRunCostSources =
    breakerId === undefined
      ? runnerRig.filter((cardId) => {
          const source =
            restrictedHostedCreditSourceForDefinition(definitionFor(state, cardId));
          return (
            Boolean(source) &&
            source?.counterType === "bit" &&
            source.usableFor.includes("using_icebreaker_during_run_non_noisy") &&
            cardCounter(state, cardId, "bit") > 0
          );
        })
      : [];
  const restrictedSources = [
    ...restrictedRunCostSources,
    ...restrictedHostedCreditSourceIds(state, "using_icebreaker_during_run", {
      breakerId,
    }),
    ...restrictedHostedCreditSourceIds(
      state,
      "using_icebreaker_during_run_non_noisy",
      { breakerId },
    ),
    ...restrictedHostedCreditSourceIds(state, "using_killer_during_run", {
      breakerId,
    }),
  ];
  const legacySources = runnerRig.filter((cardId) => {
    if (isRestrictedHostedCreditSource(definitionFor(state, cardId))) return false;
    if (cardCounter(state, cardId, "recurring_credit") <= 0) return false;
    const definition = definitionFor(state, cardId);
    if (
      definition.id === ZZ22_SPEED_CHIP_ID ||
      definition.id === COROLLA_SPEED_CHIP_STRENGTH_HARDWARE_ID
    ) {
      return Boolean(
        state.run &&
          breakerId &&
          state.runner.rig.programs.includes(breakerId) &&
          cardHasSubtype(definitionFor(state, breakerId), "killer"),
      );
    }
    if (
      definition.id === ZETATECH_SOFTWARE_INSTALLER_OVERLAY_HOST_ID ||
      TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS.has(definition.id)
    ) {
      return false;
    }
    if (definition.id === HELLS_RUN_ID) return false;
    if (!noisyBreaker) return true;
    return !cardHasSubtype(definition, "stealth");
  });
  return [...new Set([...restrictedSources, ...legacySources])].sort();
}

export function runnerRunRecurringCredits(
  host: RunDurationPaymentHost,
  breakerId?: CardInstanceId,
): number {
  return runnerRunRecurringCreditSourceIds(host, breakerId).reduce(
    (sum, cardId) => sum + hostedPaymentCredits(host.state, cardId),
    0,
  );
}

export function availableRunnerRunCredits(
  host: RunDurationPaymentHost,
  breakerId?: CardInstanceId,
): number {
  const state = host.state;
  return (
    state.runner.credits +
    (state.run?.badPublicityCredits ?? 0) +
    (state.run?.runnerRunTemporaryCredits?.remaining ?? 0) +
    runnerRunRecurringCredits(host, breakerId)
  );
}

export function availableRunnerRunStartCredits(
  host: RunDurationPaymentHost,
): number {
  return host.state.runner.credits + runnerRunRecurringCredits(host);
}

export function spendRunnerRunCredits(
  host: RunDurationPaymentHost,
  amount: number,
  breakerId?: CardInstanceId,
): RunnerRunCreditSpendResult {
  if (amount <= 0) return { handled: false };
  if (availableRunnerRunCredits(host, breakerId) < amount)
    throw new Error("Der Runner kann die Run-Kosten nicht bezahlen.");
  if (breakerId) recordWilsonRunCapSpend(host, amount);
  const run = mustRun(host.state);
  let remaining = amount;
  const fromBadPublicity = Math.min(run.badPublicityCredits ?? 0, remaining);
  if (fromBadPublicity > 0) {
    run.badPublicityCredits = (run.badPublicityCredits ?? 0) - fromBadPublicity;
    remaining -= fromBadPublicity;
  }
  const runTemporaryCredits = run.runnerRunTemporaryCredits;
  const fromRunTemporaryCredits = Math.min(
    runTemporaryCredits?.remaining ?? 0,
    remaining,
  );
  if (runTemporaryCredits && fromRunTemporaryCredits > 0) {
    runTemporaryCredits.remaining -= fromRunTemporaryCredits;
    remaining -= fromRunTemporaryCredits;
  }
  let hostedCreditsSpent = 0;
  let recurringCreditsSpent = 0;
  for (const cardId of runnerRunRecurringCreditSourceIds(host, breakerId)) {
    if (remaining <= 0) break;
    const available = hostedPaymentCredits(host.state, cardId);
    const spent = Math.min(available, remaining);
    if (spent > 0) {
      const counterType = hostedPaymentCounterTypeForSource(host.state, cardId);
      spendHostedPaymentCredits(host.state, cardId, spent);
      hostedCreditsSpent += spent;
      if (counterType === "recurring_credit") recurringCreditsSpent += spent;
      remaining -= spent;
    }
  }
  spendRunnerPoolCredits(host.state, remaining);
  return {
    handled: true,
    paid: true,
    amount,
    normalCreditsSpent: remaining,
    hostedCreditsSpent,
    recurringCreditsSpent,
    badPublicityCreditsSpent: fromBadPublicity,
    temporaryRunCreditsSpent: fromRunTemporaryCredits,
    ...(runTemporaryCredits
      ? { remainingTemporaryRunCredits: runTemporaryCredits.remaining }
      : {}),
    ...(breakerId ? { runSpendingCapUsed: amount } : {}),
    stateChanged: true,
  };
}

export function runJackOutAdditionalCost(run: ActiveRun): number {
  return (
    Math.max(0, Math.floor(run.jackOutAdditionalCostForRun ?? 0)) +
    (run.viral15ActiveSourceIceId ? 1 : 0)
  );
}

export function payRunStartTaxCredits(
  host: RunDurationPaymentHost,
  legalAction: LegalAction,
): RunTaxPaymentResult {
  if (typeof legalAction.payload?.runStartTaxCredits !== "number")
    return { handled: false, paid: false, amount: 0 };
  const taxCredits = legalAction.costs.reduce(
    (sum, cost) =>
      sum + (Number.isInteger(cost.credits) ? (cost.credits ?? 0) : 0),
    0,
  );
  if (taxCredits > 0) spendRunnerRunCredits(host, taxCredits);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runStartTaxPaid: taxCredits,
    runnerCreditsAfter: host.state.runner.credits,
  };
  return {
    handled: true,
    paid: taxCredits > 0,
    amount: taxCredits,
    resolvedPayload: legalAction.payload,
    stateChanged: taxCredits > 0,
  };
}

export function payJackOutAdditionalCost(
  host: RunDurationPaymentHost,
  legalAction: LegalAction,
  payload: NonNullable<LegalAction["payload"]>,
): JackOutCostPaymentResult {
  const jackOutAdditionalCost = legalAction.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  if (jackOutAdditionalCost > 0) {
    spendRunnerRunCredits(host, jackOutAdditionalCost);
    legalAction.payload = {
      ...payload,
      jackOutAdditionalCost,
      runnerCreditsAfter: host.state.runner.credits,
    };
    return {
      handled: true,
      paid: true,
      amount: jackOutAdditionalCost,
      resolvedPayload: legalAction.payload,
      stateChanged: true,
    };
  }
  legalAction.payload = payload;
  return {
    handled: true,
    paid: false,
    amount: 0,
    resolvedPayload: legalAction.payload,
  };
}

export function payEncounterTaxForFutureIce(
  host: RunDurationPaymentHost,
  legalAction?: LegalAction,
): EncounterTaxPaymentResult {
  const run = host.state.run;
  if (!run) return { handled: false, paid: false, amount: 0 };
  const encounterTax = Math.max(
    0,
    Math.floor(run.encounterTaxForFutureIce ?? 0),
  );
  if (encounterTax <= 0) return { handled: false, paid: false, amount: 0 };
  if (availableRunnerRunCredits(host) < encounterTax) {
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        encounterTaxForFutureIce: encounterTax,
        encounterTaxPaid: 0,
        encounterTaxSource: BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE,
      };
    }
    return {
      handled: true,
      paid: false,
      amount: encounterTax,
      runShouldEnd: true,
      ...(legalAction?.payload ? { resolvedPayload: legalAction.payload } : {}),
    };
  }
  spendRunnerRunCredits(host, encounterTax);
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      encounterTaxForFutureIce: encounterTax,
      encounterTaxPaid: encounterTax,
      encounterTaxSource: BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE,
    };
  }
  return {
    handled: true,
    paid: true,
    amount: encounterTax,
    ...(legalAction?.payload ? { resolvedPayload: legalAction.payload } : {}),
    stateChanged: true,
  };
}

export function payEncounterSubroutineRunCost(
  host: RunDurationPaymentHost,
  legalAction: LegalAction | undefined,
  expectedPayment: number,
): RunTaxPaymentResult {
  if (expectedPayment <= 0) return { handled: false, paid: false, amount: 0 };
  const declaredPayment = Math.max(
    0,
    Math.floor(
      Number(legalAction?.payload?.payOrEndRunSubroutinePayment ?? 0) +
        Number(legalAction?.payload?.payOrTrashProgramSubroutinePayment ?? 0),
    ),
  );
  const declaredCost = Math.max(
    0,
    Math.floor(
      (legalAction?.costs ?? []).reduce(
        (sum, cost) => sum + (cost.credits ?? 0),
        0,
      ),
    ),
  );
  if (declaredPayment !== expectedPayment || declaredCost !== expectedPayment)
    throw new Error("Die Pay-or-End-the-Run-Kosten sind nicht mehr gueltig.");
  spendRunnerRunCredits(host, expectedPayment);
  return {
    handled: true,
    paid: true,
    amount: expectedPayment,
    stateChanged: true,
  };
}

export function recordWilsonRunCapSpend(
  host: RunDurationPaymentHost,
  amount: number,
): RunSpendingCapResult {
  const run = host.state.run;
  if (!run?.wilsonRunSpendingCap) return { handled: false };
  const nextSpent = run.wilsonRunSpendingCap.spent + amount;
  if (nextSpent > run.wilsonRunSpendingCap.limit)
    throw new Error("Wilson erlaubt maximal 3 Credits fuer Icebreaker oder Link.");
  run.wilsonRunSpendingCap.spent = nextSpent;
  return {
    handled: true,
    runSpendingCapUsed: nextSpent,
  };
}

export function activeWilsonSourceIds(host: RunDurationPaymentHost): CardInstanceId[] {
  return host.state.runner.rig.resources
    .filter(
      (cardId) =>
        remainingReplacementLongtailKindForCard(host.state, cardId) ===
        "wilson_run_action_spending_cap",
    )
    .sort();
}

function restrictedHostedCreditSourceMatchesUse(
  state: GameState,
  cardId: CardInstanceId,
  use: RestrictedHostedCreditUse,
  options: RestrictedHostedCreditPaymentOptions = {},
): boolean {
  if (!runnerInstalledCardIds(state).includes(cardId)) return false;
  const definition = definitionFor(state, cardId);
  const source = restrictedHostedCreditSourceForDefinition(definition);
  if (!source || source.counterType !== "bit" || !source.usableFor.includes(use))
    return false;
  if (cardCounter(state, cardId, "bit") <= 0) return false;
  if (
    state.run &&
    cardHasSubtype(definition, "stealth") &&
    hasStealthPaymentBlockOnServer(state, state.run.attackedServerId)
  )
    return false;
  if (
    use === "using_icebreaker_during_run" ||
    use === "using_icebreaker_during_run_non_noisy" ||
    use === "using_killer_during_run"
  ) {
    const breakerId = options.breakerId;
    if (!state.run || !breakerId || !state.runner.rig.programs.includes(breakerId))
      return false;
    const breakerDefinition = definitionFor(state, breakerId);
    if (!cardHasSubtype(breakerDefinition, "icebreaker")) return false;
    if (
      source.requireHostedBreakerForIcebreakerUse &&
      state.cardInstances[breakerId]?.hostedOn !== cardId
    )
      return false;
    if (use === "using_icebreaker_during_run") return true;
    if (use === "using_icebreaker_during_run_non_noisy")
      return !cardHasSubtype(breakerDefinition, "noisy");
    return cardHasSubtype(breakerDefinition, "killer");
  }
  if (use === "trash_nodes" || use === "trash_upgrades") {
    const accessedCardId = options.accessedCardId;
    if (!accessedCardId || !state.cardInstances[accessedCardId]) return false;
    const accessedDefinition = definitionFor(state, accessedCardId);
    return use === "trash_nodes"
      ? accessedDefinition.type === "asset"
      : accessedDefinition.type === "upgrade";
  }
  if (use === "install_programs") return options.installCardType === "program";
  return use === "increase_link" || use === "remove_tags";
}

function hasStealthPaymentBlockOnServer(
  state: GameState,
  serverId: Exclude<ActiveRun["attackedServerId"], "new_remote">,
): boolean {
  const server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) throw new Error(`Server fehlt: ${serverId}`);
  return server.root.some((cardId) => {
    const instance = state.cardInstances[cardId];
    return (
      instance?.rezzed === true &&
      cardImplementationForDefinitionId(definitionFor(state, cardId).id)
        ?.fortRunWindows?.some(
          (window) => window.kind === "block_stealth_bits_during_runs_on_this_fort",
        ) === true
    );
  });
}

function remainingReplacementLongtailKindForCard(
  state: GameState,
  cardId: CardInstanceId,
) {
  return cardImplementationForDefinitionId(definitionFor(state, cardId).id)
    ?.remainingReplacementLongtail?.kind;
}

function runnerInstalledCardIds(state: GameState): CardInstanceId[] {
  return [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ];
}

function spendRunnerPoolCredits(state: GameState, amount: number): void {
  if (amount <= 0) return;
  if (state.runner.credits < amount)
    throw new Error("Der Runner kann die Kosten nicht bezahlen.");
  state.runner.credits -= amount;
}

function cardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  return mustInstance(state.cardInstances, cardId).counters?.[counterType] ?? 0;
}

function spendCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Counter amount ist ungueltig.");
  const current = cardCounter(state, cardId, counterType);
  if (current < amount) throw new Error("Nicht genug Counter vorhanden.");
  setCardCounter(state, cardId, counterType, current - amount);
}

function setCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Counter amount ist ungueltig.");
  const instance = mustInstance(state.cardInstances, cardId);
  const counters = { ...(instance.counters ?? {}) };
  if (amount === 0) delete counters[counterType];
  else counters[counterType] = amount;
  const { counters: _counters, ...withoutCounters } = instance;
  void _counters;
  state.cardInstances[cardId] =
    Object.keys(counters).length > 0
      ? { ...withoutCounters, counters }
      : withoutCounters;
}

function cardHasSubtype(definition: CardDefinition, subtype: string): boolean {
  const target = normalizeSubtypeLabel(subtype);
  return (definition.subtypes ?? []).some(
    (candidate) => normalizeSubtypeLabel(candidate) === target,
  );
}

function normalizeSubtypeLabel(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  const instance = mustInstance(state.cardInstances, id);
  const definition = DEMO_CARDS_BY_ID[instance.definitionId];
  if (!definition)
    throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
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
