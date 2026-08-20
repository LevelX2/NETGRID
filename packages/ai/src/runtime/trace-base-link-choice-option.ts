import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { selectableChoiceOptions } from "./choice-option";

export type TraceBaseLinkChoiceAssessment = {
  readonly selectedOptionId: string;
  readonly choiceId: string;
  readonly traceId: string;
};

/** Completes only the payload of the Engine-owned trace base-link window. */
export function assessTraceBaseLinkChoice(
  input: AiDecisionInput,
  action: LegalAction,
): TraceBaseLinkChoiceAssessment | undefined {
  const choice = input.playerView.pendingChoice;
  const trace = input.playerView.trace;
  const quote = input.playerView.own.runnerTraceSupportQuote;
  if (
    input.side !== "runner" ||
    !choice ||
    choice.side !== "runner" ||
    choice.kind !== "select_option" ||
    !trace ||
    trace.phase !== "base_link" ||
    choice.source !== `trace_base_link:${trace.traceId}` ||
    choice.choiceId !== `${trace.traceId}.base_link.${input.playerView.stateVersion}` ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    action.side !== "runner" ||
    action.type !== "resolve_choice" ||
    action.source !== "game_rule" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.choiceRequirements?.length !== 1 ||
    !quote
  ) {
    return undefined;
  }

  const selectableOptions = selectableChoiceOptions(choice.options);
  const [requirement] = action.choiceRequirements;
  if (
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== 1 ||
    requirement.maxSelections !== 1 ||
    requirement.optionIds.length !== selectableOptions.length ||
    selectableOptions.some(
      (option) => !requirement.optionIds.includes(option.id),
    )
  ) {
    return undefined;
  }

  const passOptions = selectableOptions.filter(
    (option) => option.id === "pass" && option.value === undefined,
  );
  const baselineQuotes = quote.baseLinkOptions.filter(
    (option) => option.sourceDefinitionId === undefined,
  );
  if (
    passOptions.length !== 1 ||
    baselineQuotes.length !== 1 ||
    baselineQuotes[0]!.activationCost !== 0 ||
    baselineQuotes[0]!.safeForAccess !== true ||
    baselineQuotes[0]!.sideEffect !== undefined
  ) {
    return undefined;
  }

  const rigByInstanceId = new Map(
    (input.playerView.own.rig ?? [])
      .filter(
        (card) =>
          card.known !== false &&
          typeof card.definitionId === "string" &&
          card.definitionId.length > 0,
      )
      .map((card) => [card.instanceId, card] as const),
  );
  const candidates = selectableOptions
    .filter((option) => option.id !== "pass")
    .map((option) => {
      if (
        typeof option.value !== "string" ||
        option.id !== `trace_base_link_${option.value}`
      ) {
        return undefined;
      }
      const card = rigByInstanceId.get(option.value);
      if (!card?.definitionId) return undefined;
      const matchingQuotes = quote.baseLinkOptions.filter(
        (candidate) =>
          candidate.sourceDefinitionId === card.definitionId &&
          option.label ===
            `${candidate.sourceTitle}: Base Link ${candidate.baseLink}`,
      );
      if (matchingQuotes.length !== 1) return undefined;
      const matchingQuote = matchingQuotes[0]!;
      if (
        !Number.isSafeInteger(matchingQuote.baseLink) ||
        matchingQuote.baseLink < 0 ||
        !Number.isSafeInteger(matchingQuote.activationCost) ||
        matchingQuote.activationCost < 0
      ) {
        return undefined;
      }
      return {
        optionId: option.id,
        netTraceStrength:
          matchingQuote.baseLink - matchingQuote.activationCost,
        safeForAccess:
          matchingQuote.safeForAccess === true &&
          matchingQuote.sideEffect === undefined,
      };
    });
  if (
    candidates.some((candidate) => candidate === undefined) ||
    candidates.length !== quote.baseLinkOptions.length - 1
  ) {
    return undefined;
  }

  const baselineStrength = baselineQuotes[0]!.baseLink;
  const selectedOptionId = candidates
    .filter(
      (candidate): candidate is NonNullable<typeof candidate> =>
        candidate !== undefined &&
        candidate.safeForAccess &&
        candidate.netTraceStrength > baselineStrength,
    )
    .sort(
      (left, right) =>
        right.netTraceStrength - left.netTraceStrength ||
        left.optionId.localeCompare(right.optionId),
    )[0]?.optionId;

  return {
    selectedOptionId: selectedOptionId ?? passOptions[0]!.id,
    choiceId: choice.choiceId,
    traceId: trace.traceId,
  };
}
