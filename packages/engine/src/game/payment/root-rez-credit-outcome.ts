import type {
  CardDefinitionId,
  CardInstanceId,
  CorpRootRezCreditOutcomeQuote,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { CORP_ROOT_REZ_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

export function immediateRootRezCreditGainForDefinition(
  definitionId: CardDefinitionId,
): number | undefined {
  const implementation = cardImplementationForDefinitionId(definitionId);
  const outcome = implementation?.corpRootRezCreditOutcome;
  if (
    outcome?.timing === "after_runner_rez_interrupt_window" &&
    outcome.effect.kind === "gain_credits" &&
    outcome.effect.recipient === "corp" &&
    outcome.effect.visibility === "public" &&
    isExactPositiveInteger(outcome.effect.amount)
  ) {
    return outcome.effect.amount;
  }
  const longtail = implementation?.remainingReplacementLongtail;
  if (
    longtail?.kind !== "obligation_debt" ||
    !isExactPositiveInteger(longtail.gainCreditsOnRez)
  ) {
    return undefined;
  }
  return longtail.gainCreditsOnRez;
}

export function quoteCorpRootRezCreditOutcome(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
  actionId: string,
  rezCredits: number,
): CorpRootRezCreditOutcomeQuote | undefined {
  const source = state.cardInstances[sourceCardInstanceId];
  const targetServerId = state.corp.servers.find((candidate) =>
    candidate.root.includes(sourceCardInstanceId),
  )?.id;
  const server = targetServerId
    ? state.corp.servers.find((candidate) => candidate.id === targetServerId)
    : undefined;
  const grossCreditGain = source
    ? immediateRootRezCreditGainForDefinition(source.definitionId)
    : undefined;
  if (
    !source ||
    source.owner !== "corp" ||
    source.controller !== "corp" ||
    source.rezzed ||
    source.zone.side !== "corp" ||
    source.zone.zone !== "serverRoot" ||
    !targetServerId ||
    !server?.root.includes(sourceCardInstanceId) ||
    grossCreditGain === undefined ||
    grossCreditGain <= 0 ||
    actionId.trim().length === 0 ||
    !isExactNonNegativeInteger(rezCredits)
  ) {
    return undefined;
  }
  const netCreditGain = grossCreditGain - rezCredits;
  if (!Number.isSafeInteger(netCreditGain)) return undefined;
  return {
    schemaVersion: CORP_ROOT_REZ_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION,
    complete: true,
    sourceCardInstanceId,
    targetServerId,
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    actionId,
    resolution: runnerHasActiveRootRezInterrupt(state)
      ? "runner_interruptible"
      : "guaranteed",
    grossCreditGain,
    rezCredits,
    netCreditGain,
  };
}

export function corpRootRezCreditOutcomeQuotePayload(
  quote: CorpRootRezCreditOutcomeQuote,
): NonNullable<LegalAction["payload"]> {
  return {
    rootRezCreditOutcomeQuoteSchemaVersion: quote.schemaVersion,
    rootRezCreditOutcomeQuoteComplete: quote.complete,
    rootRezCreditOutcomeQuoteSourceCardInstanceId: quote.sourceCardInstanceId,
    rootRezCreditOutcomeQuoteTargetServerId: quote.targetServerId,
    rootRezCreditOutcomeQuoteStateVersion: quote.stateVersion,
    rootRezCreditOutcomeQuoteTimingPoint: quote.timingPoint,
    rootRezCreditOutcomeQuoteActionId: quote.actionId,
    rootRezCreditOutcomeQuoteResolution: quote.resolution,
    rootRezCreditOutcomeQuoteGrossCreditGain: quote.grossCreditGain,
    rootRezCreditOutcomeQuoteRezCredits: quote.rezCredits,
    rootRezCreditOutcomeQuoteNetCreditGain: quote.netCreditGain,
  };
}

export const ROOT_REZ_CREDIT_OUTCOME_QUOTE_PAYLOAD_FIELDS = [
  "rootRezCreditOutcomeQuoteSchemaVersion",
  "rootRezCreditOutcomeQuoteComplete",
  "rootRezCreditOutcomeQuoteSourceCardInstanceId",
  "rootRezCreditOutcomeQuoteTargetServerId",
  "rootRezCreditOutcomeQuoteStateVersion",
  "rootRezCreditOutcomeQuoteTimingPoint",
  "rootRezCreditOutcomeQuoteActionId",
  "rootRezCreditOutcomeQuoteResolution",
  "rootRezCreditOutcomeQuoteGrossCreditGain",
  "rootRezCreditOutcomeQuoteRezCredits",
  "rootRezCreditOutcomeQuoteNetCreditGain",
] as const;

function runnerHasActiveRootRezInterrupt(state: GameState): boolean {
  return state.runner.rig.programs.some((cardId) => {
    const source = state.cardInstances[cardId];
    return (
      source?.owner === "runner" &&
      source.controller === "runner" &&
      source.zone.side === "runner" &&
      source.zone.zone === "rig" &&
      cardImplementationForDefinitionId(
        source.definitionId,
      )?.runEncounterInterventions?.some(
        (intervention) =>
          intervention.kind ===
          "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
      ) === true
    );
  });
}

function isExactNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isExactPositiveInteger(value: unknown): value is number {
  return isExactNonNegativeInteger(value) && value > 0;
}
