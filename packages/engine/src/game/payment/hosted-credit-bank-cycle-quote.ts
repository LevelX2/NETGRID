import {
  canonicalCapabilityId,
  engineCardByDefinitionId,
} from "@netgrid/cards/engine";
import type {
  CorpHostedCreditBankCycleQuote,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

/** Narrow declarative quote; no hidden opponent data or future Action IDs. */
export function quoteCorpHostedCreditBankCycle(
  state: GameState,
  action: LegalAction,
): CorpHostedCreditBankCycleQuote | undefined {
  if (
    state.activeSide !== "corp" ||
    state.timingPoint !== "corp_action.main" ||
    state.run ||
    state.pendingChoice ||
    state.actionEconomy ||
    state.corp.clicks < 2 ||
    state.corp.clicks > 3 ||
    action.side !== "corp" ||
    action.expiresAtStateVersion !== state.stateVersion ||
    (action.type !== "rez_card" && action.type !== "activated_card_ability")
  )
    return undefined;
  const source = state.cardInstances[action.source];
  const server = state.corp.servers.find((s) => s.root.includes(action.source));
  const implementation = source
    ? cardImplementationForDefinitionId(source.definitionId)
    : undefined;
  if (
    !source ||
    source.owner !== "corp" ||
    source.controller !== "corp" ||
    !server ||
    !server.id.startsWith("remote_") ||
    !implementation ||
    implementation.abilities?.length !== 2 ||
    Object.keys(implementation).some(
      (k) => k !== "cardDefinitionId" && k !== "abilities",
    )
  )
    return undefined;
  const abilities = engineCardByDefinitionId(source.definitionId)?.engine
    .abilities;
  if (!abilities) return undefined;
  const load = abilities.find(
    (a) =>
      a.kind === "activated" &&
      a.timing === "corp_main" &&
      a.condition === undefined &&
      a.limit === undefined &&
      a.costs.length === 1 &&
      a.costs[0]?.kind === "action" &&
      a.costs[0].amount === 1 &&
      a.effects.length === 1 &&
      a.effects[0]?.kind === "add_hosted_credits" &&
      a.effects[0].target === "source" &&
      a.effects[0].visibility === "public" &&
      Number.isSafeInteger(a.effects[0].amount) &&
      a.effects[0].amount > 1,
  );
  const cashout = abilities.find(
    (a) =>
      a.kind === "activated" &&
      a.timing === "corp_main" &&
      a.condition?.kind === "source_has_hosted_credits" &&
      a.limit === undefined &&
      a.costs.length === 1 &&
      a.costs[0]?.kind === "action" &&
      a.costs[0].amount === 1 &&
      a.effects.length === 1 &&
      a.effects[0]?.kind === "take_hosted_credits" &&
      a.effects[0].source === "source" &&
      a.effects[0].recipient === "controller" &&
      a.effects[0].mode === "all" &&
      a.effects[0].visibility === "public",
  );
  if (
    !load ||
    load.kind !== "activated" ||
    !cashout ||
    cashout.kind !== "activated" ||
    load.effects[0]?.kind !== "add_hosted_credits"
  )
    return undefined;
  const loadAbilityId = canonicalCapabilityId(
    source.definitionId,
    load.capabilityKey,
  );
  const cashoutAbilityId = canonicalCapabilityId(
    source.definitionId,
    cashout.capabilityKey,
  );
  const headKind = source.rezzed ? "load" : "rez";
  if (
    headKind === "rez"
      ? action.type !== "rez_card" || action.payload?.rootRez !== true
      : action.type !== "activated_card_ability" ||
        action.abilityRef?.sourceAbilityId !== loadAbilityId ||
        action.abilityRef.sourceCardInstanceId !== source.instanceId
  )
    return undefined;
  if (
    action.costs.some((cost) =>
      Object.entries(cost).some(
        ([k, v]) =>
          (k !== "credits" && k !== "clicks") ||
          !Number.isSafeInteger(v) ||
          Number(v) < 0,
      ),
    )
  )
    return undefined;
  const setupCreditCost = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  const headClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  if (
    headKind === "rez"
      ? headClicks !== 0
      : headClicks !== 1 || setupCreditCost !== 0
  )
    return undefined;
  const currentHostedCredits = source.counters?.bit ?? 0;
  if (
    !Number.isSafeInteger(currentHostedCredits) ||
    currentHostedCredits < 0 ||
    state.corp.credits < setupCreditCost
  )
    return undefined;
  const loadExecutions = state.corp.clicks - 1;
  const loadCredits = load.effects[0].amount;
  const cashoutCredits = currentHostedCredits + loadExecutions * loadCredits;
  const netLiquidCreditGain = cashoutCredits - setupCreditCost;
  const baselineLiquidCreditGain =
    currentHostedCredits > 0
      ? currentHostedCredits + state.corp.clicks - 1
      : state.corp.clicks;
  const extraLiquidCredits = netLiquidCreditGain - baselineLiquidCreditGain;
  if (!Number.isSafeInteger(cashoutCredits) || extraLiquidCredits <= 0)
    return undefined;
  return {
    schemaVersion: "corp-hosted-credit-bank-cycle-quote-v1",
    actionId: action.actionId,
    sourceCardInstanceId: source.instanceId,
    sourceDefinitionId: source.definitionId,
    sourceServerId: server.id,
    stateVersion: state.stateVersion,
    headKind,
    loadAbilityId,
    cashoutAbilityId,
    currentCredits: state.corp.credits,
    currentClicks: state.corp.clicks,
    currentHostedCredits,
    setupCreditCost,
    loadCredits,
    loadExecutions,
    totalClickCost: state.corp.clicks,
    cashoutCredits,
    netLiquidCreditGain,
    baselineLiquidCreditGain,
    extraLiquidCredits,
  };
}
