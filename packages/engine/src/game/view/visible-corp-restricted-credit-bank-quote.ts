import type {
  CardInstanceId,
  GameState,
  CorpRestrictedCreditBankQuote,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { corpGeneralCreditAvailability } from "../payment/corp-general-credit-availability";

/** Mechanical capacity only. A planning owner must bind a finite consumer and horizon. */
export function visibleCorpRestrictedCreditBankQuote(
  state: GameState,
  sourceId: CardInstanceId,
): CorpRestrictedCreditBankQuote | undefined {
  const source = state.cardInstances[sourceId];
  if (
    !source ||
    source.owner !== "corp" ||
    source.controller !== "corp" ||
    !source.rezzed ||
    source.zone.side !== "corp" ||
    source.zone.zone !== "serverRoot"
  )
    return undefined;
  const implementation = cardImplementationForDefinitionId(source.definitionId);
  if (implementation?.advanceable?.while !== "installed_before_and_after_rez")
    return undefined;
  const payouts = (implementation.abilities ?? []).filter(
    (ability) =>
      ability.kind === "activated" &&
      ability.timing === "corp_paid" &&
      ability.condition?.kind === "source_has_advancement_counters" &&
      ability.condition.minimum === 1 &&
      ability.costs.length === 1 &&
      ability.costs[0]?.kind === "advancement_counter" &&
      ability.costs[0].source === "source" &&
      ability.costs[0].amount === 1 &&
      ability.effects.length === 1 &&
      ability.effects[0]?.kind === "gain_temporary_corp_credits" &&
      ability.effects[0].recipient === "corp" &&
      ability.effects[0].usableFor === "install_or_rez" &&
      ability.effects[0].cleanup === "end_of_turn",
  );
  if (payouts.length !== 1) return undefined;
  const ability = payouts[0]!;
  if (
    ability.kind !== "activated" ||
    ability.effects[0]?.kind !== "gain_temporary_corp_credits"
  )
    return undefined;
  const amount = ability.effects[0].amount;
  if (!Number.isSafeInteger(amount) || amount <= 0) return undefined;
  if (
    !Number.isSafeInteger(source.advancementCounters) ||
    source.advancementCounters < 0
  )
    throw new Error("corp_restricted_credit_bank_invalid_counter_count");
  return {
    schemaVersion: "corp-restricted-credit-bank-v1",
    sourceCardInstanceId: sourceId,
    serverId: source.zone.serverId,
    expiresAtStateVersion: state.stateVersion,
    advancementCounters: source.advancementCounters,
    creditsPerCounter: amount,
    generalCreditsAvailable: corpGeneralCreditAvailability(state),
    payoutCounterCost: 1,
    payoutClickCost: 0,
    payoutGeneralCreditCost: 0,
    usableFor: "corp_install_or_rez",
    payoutCleanup: "end_of_turn",
    condition: "source_remains_installed_and_rezzed_at_paid_window",
  };
}
