import type {
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  PurgeableRunnerVirusCounterType,
  Side,
} from "@netgrid/shared";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import type {
  ActivatedCardAbilityImplementation,
  CardAbilityCostImplementation,
} from "./definition-types";
import { syncPendingChoiceAfterRunnerCostPenaltySupport } from "../game/payment/runner-payment-support";

export function assertActivatedCostAmount(
  cost: CardAbilityCostImplementation,
): number {
  if (!Number.isInteger(cost.amount) || cost.amount < 0)
    throw new Error(
      "Activated CardImplementation cost amount must be non-negative.",
    );
  return cost.amount;
}

export function activatedAbilityLegalActionCosts(
  ability: ActivatedCardAbilityImplementation,
): LegalAction["costs"] {
  let clicks = 0;
  let credits = 0;
  for (const cost of ability.costs) {
    const amount = assertActivatedCostAmount(cost);
    if (cost.kind === "action") clicks += amount;
    else if (cost.kind === "credit") credits += amount;
    else if (cost.kind === "advancement_counter") {
      if (cost.source !== "source")
        throw new Error(
          "Activated CardImplementation advancement counter cost must use source.",
        );
    } else if (cost.kind === "source_counter") {
      if (cost.source !== "source")
        throw new Error(
          "Activated CardImplementation source counter cost must use source.",
        );
    } else if (cost.kind === "trash_source") {
      if (cost.amount !== 1)
        throw new Error(
          "Activated CardImplementation trash_source cost amount must be 1.",
        );
    } else if (cost.kind === "tap_source") {
      if (cost.amount !== 1)
        throw new Error(
          "Activated CardImplementation tap_source cost amount must be 1.",
        );
    } else if (cost.kind === "corp_random_discard_hq") {
      if (cost.amount <= 0)
        throw new Error(
          "Activated CardImplementation corp_random_discard_hq cost must be positive.",
        );
    } else if (cost.kind === "trash_corp_rd_top") {
      if (cost.amount !== 2)
        throw new Error(
          "Activated CardImplementation trash_corp_rd_top cost amount must be 2.",
        );
    } else if (cost.kind === "corp_purgeable_runner_virus_counter") {
      if (cost.amount !== 1)
        throw new Error(
          "Activated CardImplementation virus-counter cost amount must be 1.",
        );
    } else {
      const unknownCost = cost as { kind?: string };
      throw new Error(
        `Unsupported activated CardImplementation cost: ${
          unknownCost.kind ?? "unknown"
        }`,
      );
    }
  }
  return clicks > 0 || credits > 0
    ? [
        {
          ...(clicks > 0 ? { clicks } : {}),
          ...(credits > 0 ? { credits } : {}),
        },
      ]
    : [];
}

function corpPurgeableRunnerVirusCounterCostsForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
) {
  return ability.costs.filter(
    (
      cost,
    ): cost is Extract<
      CardAbilityCostImplementation,
      { kind: "corp_purgeable_runner_virus_counter" }
    > => cost.kind === "corp_purgeable_runner_virus_counter",
  );
}

function validatedPurgeableCounterAmount(
  state: GameState,
  server: "archives" | "hq" | "rd",
  counterType: PurgeableRunnerVirusCounterType,
): number {
  const amount =
    state.purgeableRunnerVirusCounters?.servers?.[server]?.[counterType] ?? 0;
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error("runtime_invalid_central_virus_counter_amount");
  return amount;
}

type PurgeableVirusCounterCostPreflight = {
  server: "archives" | "hq" | "rd";
  counterType: PurgeableRunnerVirusCounterType;
  amount: number;
};

function preflightPurgeableVirusCounterCosts(
  state: GameState,
  ability: ActivatedCardAbilityImplementation,
): PurgeableVirusCounterCostPreflight[] | undefined {
  const requiredByCounter = new Map<
    string,
    PurgeableVirusCounterCostPreflight
  >();
  for (const cost of corpPurgeableRunnerVirusCounterCostsForActivatedAbility(
    ability,
  )) {
    const key = `${cost.server}:${cost.counterType}`;
    const existing = requiredByCounter.get(key);
    requiredByCounter.set(key, {
      server: cost.server,
      counterType: cost.counterType,
      amount: (existing?.amount ?? 0) + cost.amount,
    });
  }
  const costs = [...requiredByCounter.values()];
  for (const cost of costs) {
    const available = validatedPurgeableCounterAmount(
      state,
      cost.server,
      cost.counterType,
    );
    if (available < cost.amount) return undefined;
  }
  return costs;
}

export function creditCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  return activatedAbilityLegalActionCosts(ability)[0]?.credits ?? 0;
}

export function advancementCounterCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  return ability.costs
    .filter((cost) => cost.kind === "advancement_counter")
    .reduce((sum, cost) => sum + assertActivatedCostAmount(cost), 0);
}

export function sourceCounterCostsForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): Array<{
  counterType: Extract<CounterType, "boon" | "remap">;
  amount: number;
}> {
  return ability.costs
    .filter((cost) => cost.kind === "source_counter")
    .map((cost) => ({
      counterType: cost.counterType,
      amount: assertActivatedCostAmount(cost),
    }));
}

export function hasTrashSourceCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): boolean {
  return ability.costs.some((cost) => cost.kind === "trash_source");
}

export function hasTapSourceCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): boolean {
  return ability.costs.some((cost) => cost.kind === "tap_source");
}

export function randomCorpHqDiscardCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  return ability.costs
    .filter((cost) => cost.kind === "corp_random_discard_hq")
    .reduce((sum, cost) => sum + assertActivatedCostAmount(cost), 0);
}

export function topCorpRdTrashCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  return ability.costs
    .filter((cost) => cost.kind === "trash_corp_rd_top")
    .reduce((sum, cost) => sum + assertActivatedCostAmount(cost), 0);
}

export function validateActivatedAbilityCosts(
  ability: ActivatedCardAbilityImplementation,
  legalAction: LegalAction,
): void {
  const expectedCosts = activatedAbilityLegalActionCosts(ability);
  const expectedFirst = expectedCosts[0] ?? {};
  const actualFirst = legalAction.costs[0] ?? {};
  if (
    legalAction.costs.length !== expectedCosts.length ||
    (actualFirst.clicks ?? 0) !== (expectedFirst.clicks ?? 0) ||
    (actualFirst.credits ?? 0) !== (expectedFirst.credits ?? 0)
  )
    throw new Error("Die aktivierte Kartenfaehigkeit hat andere Kosten.");
}

export function canPayActivatedCardImplementationCosts(
  state: GameState,
  side: Side,
  cardId: CardInstanceId,
  ability: ActivatedCardAbilityImplementation,
): boolean {
  const legalCosts = activatedAbilityLegalActionCosts(ability);
  const clicks = legalCosts[0]?.clicks ?? 0;
  const credits = legalCosts[0]?.credits ?? 0;
  if ((side === "corp" ? state.corp.clicks : state.runner.clicks) < clicks)
    return false;
  const corpReservedInstallRezCredits = Math.max(
    0,
    Math.floor(state.corpTemporaryInstallRezCredits?.remaining ?? 0),
  );
  const corpSpendableCredits = Math.max(
    0,
    state.corp.credits - corpReservedInstallRezCredits,
  );
  if ((side === "corp" ? corpSpendableCredits : state.runner.credits) < credits)
    return false;
  const advancementCounterCost =
    advancementCounterCostForActivatedAbility(ability);
  if (advancementCounterCost > 0) {
    const source = state.cardInstances[cardId];
    if (!source || source.advancementCounters < advancementCounterCost)
      return false;
  }
  for (const cost of sourceCounterCostsForActivatedAbility(ability)) {
    const source = state.cardInstances[cardId];
    const counters = source?.counters?.[cost.counterType] ?? 0;
    if (!source || counters < cost.amount) return false;
  }
  if (hasTrashSourceCostForActivatedAbility(ability)) {
    const source = state.cardInstances[cardId];
    if (
      !source ||
      source.controller !== side ||
      source.zone.side !== side ||
      (side === "runner" && source.zone.zone !== "rig") ||
      (side === "corp" &&
        source.zone.zone !== "serverRoot" &&
        source.zone.zone !== "serverIce")
    )
      return false;
  }
  if (hasTapSourceCostForActivatedAbility(ability)) {
    const source = state.cardInstances[cardId];
    if (
      !source ||
      source.controller !== side ||
      source.zone.side !== side ||
      source.tapped === true
    )
      return false;
  }
  const randomDiscardCost = randomCorpHqDiscardCostForActivatedAbility(ability);
  if (randomDiscardCost > 0) {
    if (side !== "corp" || state.corp.hq.length < randomDiscardCost)
      return false;
  }
  const topCorpRdTrashCost = topCorpRdTrashCostForActivatedAbility(ability);
  if (topCorpRdTrashCost > 0) {
    if (side !== "corp" || state.corp.rd.length < topCorpRdTrashCost)
      return false;
  }
  if (preflightPurgeableVirusCounterCosts(state, ability) === undefined)
    return false;
  return true;
}

export function payActivatedCardImplementationCosts(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
  side: Side,
  cardId: CardInstanceId,
  ability: ActivatedCardAbilityImplementation,
): Record<string, string | number | boolean> {
  const publicPayload: Record<string, string | number | boolean> = {};
  const virusCounterCosts =
    corpPurgeableRunnerVirusCounterCostsForActivatedAbility(ability);
  const virusCounterPayment = preflightPurgeableVirusCounterCosts(
    state,
    ability,
  );
  if (virusCounterCosts.length > 0 && virusCounterPayment === undefined)
    throw new Error("Die Korp hat nicht genug zentrale Virus-Counter.");
  const legalCosts = activatedAbilityLegalActionCosts(ability);
  const clicks = legalCosts[0]?.clicks ?? 0;
  const creditCost = legalCosts[0]?.credits ?? 0;
  for (let spentClicks = 0; spentClicks < clicks; spentClicks += 1) {
    deps.spendClick(state, side);
  }
  if (creditCost > 0) deps.spendCredits(state, side, creditCost);
  const advancementCounterCost =
    advancementCounterCostForActivatedAbility(ability);
  if (advancementCounterCost > 0) {
    const source = state.cardInstances[cardId];
    if (!source || source.advancementCounters < advancementCounterCost)
      throw new Error("Die Quelle hat nicht genug Advancement-Counter.");
    source.advancementCounters -= advancementCounterCost;
  }
  for (const cost of sourceCounterCostsForActivatedAbility(ability)) {
    const source = state.cardInstances[cardId];
    const counters = source?.counters?.[cost.counterType] ?? 0;
    if (!source || counters < cost.amount)
      throw new Error("Die Quelle hat nicht genug Source-Counter.");
    source.counters = {
      ...(source.counters ?? {}),
      [cost.counterType]: counters - cost.amount,
    };
  }
  if (hasTrashSourceCostForActivatedAbility(ability)) {
    const trashResult = deps.trashSource(state, cardId);
    if (!trashResult.sourceTrashed)
      throw new Error("Die Quelle konnte nicht getrasht werden.");
    Object.assign(publicPayload, trashResult.publicPayload);
  }
  if (hasTapSourceCostForActivatedAbility(ability)) {
    const source = state.cardInstances[cardId];
    if (!source || source.tapped === true)
      throw new Error("Die Quelle ist bereits getappt.");
    Object.assign(
      publicPayload,
      deps.revealHiddenRunnerResource(state, cardId),
    );
    source.faceup = true;
    source.rezzed = true;
    source.tapped = true;
    publicPayload.cardImplementationTapSourceCost = true;
  }
  const randomDiscardCost = randomCorpHqDiscardCostForActivatedAbility(ability);
  if (randomDiscardCost > 0) {
    if (side !== "corp")
      throw new Error("Nur die Korp kann zufaellige HQ-Discard-Kosten zahlen.");
    if (state.corp.hq.length < randomDiscardCost)
      throw new Error(
        "HQ enthaelt nicht genug Karten fuer den Random-Discard.",
      );
    Object.assign(
      publicPayload,
      deps.corpRandomDiscardFromHq(
        state,
        deps.definitionFor(state, cardId).id,
        randomDiscardCost,
      ).publicPayload,
    );
    publicPayload.cardImplementationRandomHqDiscardCost = randomDiscardCost;
  }
  const topCorpRdTrashCost = topCorpRdTrashCostForActivatedAbility(ability);
  if (topCorpRdTrashCost > 0) {
    if (side !== "corp")
      throw new Error("Nur die Korp kann R&D-Trash-Kosten zahlen.");
    if (topCorpRdTrashCost !== 2)
      throw new Error("R&D-Trash-Kosten muessen genau zwei Karten trashen.");
    if (state.corp.rd.length < topCorpRdTrashCost)
      throw new Error("R&D enthaelt nicht genug Karten fuer diese Kosten.");
    Object.assign(
      publicPayload,
      deps.trashTopCorpRdCards(
        state,
        legalAction,
        deps.definitionFor(state, cardId).id,
        topCorpRdTrashCost as 2,
      ).publicPayload,
    );
    publicPayload.cardImplementationTopCorpRdTrashCost = topCorpRdTrashCost;
  }
  if (virusCounterCosts.length > 0) {
    for (const cost of virusCounterPayment ?? []) {
      const bucket = state.purgeableRunnerVirusCounters?.servers?.[cost.server];
      const before = validatedPurgeableCounterAmount(
        state,
        cost.server,
        cost.counterType,
      );
      if (!bucket || before < cost.amount)
        throw new Error("Die Korp hat nicht genug zentrale Virus-Counter.");
      const after = before - cost.amount;
      if (after > 0) bucket[cost.counterType] = after;
      else delete bucket[cost.counterType];
    }
    const counters = state.purgeableRunnerVirusCounters;
    if (counters?.servers) {
      for (const serverId of ["archives", "hq", "rd"] as const)
        if (
          counters.servers[serverId] &&
          Object.keys(counters.servers[serverId]!).length === 0
        )
          delete counters.servers[serverId];
      if (Object.keys(counters.servers).length === 0) delete counters.servers;
    }
    if (counters && !counters.corp && !counters.servers && !counters.effects)
      delete state.purgeableRunnerVirusCounters;
    publicPayload.virusCounterCostsSpent = virusCounterCosts.length;
    publicPayload.virusCounterCostTypes = virusCounterCosts
      .map((cost) => `${cost.server}:${cost.counterType}`)
      .join(",");
  }
  if (ability.timing === "runner_cost_penalty_support") {
    syncPendingChoiceAfterRunnerCostPenaltySupport(state);
  }
  return publicPayload;
}
