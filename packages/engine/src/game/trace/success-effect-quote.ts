import type {
  CardDefinitionId,
  TraceSuccessEffect,
} from "@netgrid/shared";

import { traceSuccessEffectForCardImplementation } from "../../ability-engine/trace-implementations";
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
  if (!implementation) return [];
  const quotes: TraceSuccessEffectCardImplementationQuote[] = [];
  const relativeTrace = implementation.relativeIce?.dynamicTraceSubroutines;
  if (relativeTrace?.visibility === "public") {
    quotes.push({
      sourceDefinitionId: definitionId,
      traceLimit: relativeTrace.traceLimit,
      traceSuccessEffect: relativeTrace.traceSuccessEffect,
    });
  }
  for (const subroutine of implementation.printedSubroutines ?? []) {
    if (subroutine.kind !== "trace") continue;
    quotes.push({
      sourceDefinitionId: definitionId,
      traceLimit: subroutine.traceLimit,
      traceSuccessEffect: traceSuccessEffectForCardImplementation(
        subroutine.onSuccess,
      ),
    });
  }
  return quotes;
}
