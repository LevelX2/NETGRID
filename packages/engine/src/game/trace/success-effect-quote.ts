import type { CardDefinitionId, TraceSuccessEffect } from "@netgrid/shared";

import { printedSubroutinesForCardImplementation } from "../../ability-engine/printed-subroutine-implementations";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

export type TraceSuccessEffectCardImplementationQuote = {
  sourceDefinitionId: CardDefinitionId;
  traceLimit: number;
  traceSuccessEffect: TraceSuccessEffect;
};

export function traceSuccessEffectCardImplementationQuotesForDefinition(
  definitionId: CardDefinitionId,
): TraceSuccessEffectCardImplementationQuote[] {
  const implementation = cardImplementationForDefinitionId(definitionId);
  const definition = CARD_DEFINITIONS_BY_ID[definitionId];
  if (!implementation || !definition) return [];
  const quotes: TraceSuccessEffectCardImplementationQuote[] = [];
  const relativeTrace = implementation.relativeIce?.dynamicTraceSubroutines;
  if (
    relativeTrace?.visibility === "public" &&
    typeof relativeTrace.traceLimit === "number" &&
    relativeTrace.traceSuccessEffect
  ) {
    quotes.push({
      sourceDefinitionId: definitionId,
      traceLimit: relativeTrace.traceLimit,
      traceSuccessEffect: relativeTrace.traceSuccessEffect,
    });
  }
  const printedSubroutines =
    printedSubroutinesForCardImplementation(definition) ??
    definition.subroutines ??
    [];
  for (const subroutine of printedSubroutines) {
    if (
      subroutine.type !== "initiate_trace" ||
      typeof subroutine.traceLimit !== "number" ||
      !subroutine.traceSuccessEffect
    )
      continue;
    quotes.push({
      sourceDefinitionId: definitionId,
      traceLimit: subroutine.traceLimit,
      traceSuccessEffect: subroutine.traceSuccessEffect,
    });
  }
  return quotes;
}
