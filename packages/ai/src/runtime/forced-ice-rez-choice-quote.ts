import type {
  CorpForcedIceRezChoiceQuote,
  VisibleCard,
  VisibleChoiceRequest,
  VisibleChoiceOption,
  VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";

export function sanitizeForcedIceRezChoiceQuote(
  value: unknown,
  binding: {
    choice: VisibleChoiceRequest;
    option: VisibleChoiceOption;
    stateVersion: number;
    ownCredits: number;
    ownAgendaPoints: number;
    ice: VisibleCard | undefined;
    serverId: string | undefined;
  },
  sanitizeRunQuote: (value: unknown) => VisibleEffectiveIceRunQuote | undefined,
): CorpForcedIceRezChoiceQuote | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const q = value as CorpForcedIceRezChoiceQuote;
  const { choice, option, ice, serverId } = binding;
  const effectiveRunQuote = sanitizeRunQuote(q.effectiveRunQuote);
  if (
    q.schemaVersion !== 1 ||
    choice.side !== "corp" ||
    !/^card_implementation\.corp_choice_rez_or_trash_ice_decision:[^:]+:[0-9]+$/.test(
      choice.source,
    ) ||
    q.choiceId !== choice.choiceId ||
    q.choiceSource !== choice.source ||
    q.optionId !== option.id ||
    option.value !== option.id ||
    !/^rez_ice(?:_[1-9][0-9]*)?$/.test(option.id) ||
    q.stateVersion !== binding.stateVersion ||
    q.stateVersion !== choice.stateVersion ||
    !ice ||
    !ice.known ||
    ice.type !== "ice" ||
    ice.rezzed !== false ||
    q.iceInstanceId !== ice.instanceId ||
    q.iceDefinitionId !== ice.definitionId ||
    !choice.source.includes(`:${ice.instanceId}:${q.stateVersion}`) ||
    q.serverId !== serverId ||
    typeof q.rezActionId !== "string" ||
    q.rezActionId.length === 0 ||
    ![
      q.rezCredits,
      q.mandatoryAgendaPointCost,
      q.creditsBeforeRez,
      q.creditsAfterRez,
      q.agendaPointsBeforeRez,
      q.agendaPointsAfterRez,
    ].every((n) => Number.isSafeInteger(n) && n >= 0) ||
    q.creditsBeforeRez !== binding.ownCredits ||
    q.agendaPointsBeforeRez !== binding.ownAgendaPoints ||
    q.creditsAfterRez !== q.creditsBeforeRez - q.rezCredits ||
    q.agendaPointsAfterRez !==
      q.agendaPointsBeforeRez - q.mandatoryAgendaPointCost ||
    !Array.isArray(q.effectiveSubtypes) ||
    q.effectiveSubtypes.some((s) => typeof s !== "string" || !s.length) ||
    new Set(q.effectiveSubtypes).size !== q.effectiveSubtypes.length ||
    !effectiveRunQuote ||
    !Number.isSafeInteger(effectiveRunQuote.effectiveStrength) ||
    effectiveRunQuote.effectiveStrength < 0 ||
    !Array.isArray(effectiveRunQuote.subroutines) ||
    effectiveRunQuote.iceInstanceId !== ice.instanceId ||
    effectiveRunQuote.iceDefinitionId !== ice.definitionId
  )
    return undefined;
  return {
    schemaVersion: 1,
    choiceId: q.choiceId,
    choiceSource: q.choiceSource,
    optionId: q.optionId,
    stateVersion: q.stateVersion,
    iceInstanceId: q.iceInstanceId,
    iceDefinitionId: q.iceDefinitionId,
    serverId: q.serverId,
    rezActionId: q.rezActionId,
    rezCredits: q.rezCredits,
    mandatoryAgendaPointCost: q.mandatoryAgendaPointCost,
    creditsBeforeRez: q.creditsBeforeRez,
    creditsAfterRez: q.creditsAfterRez,
    agendaPointsBeforeRez: q.agendaPointsBeforeRez,
    agendaPointsAfterRez: q.agendaPointsAfterRez,
    effectiveSubtypes: [...q.effectiveSubtypes],
    effectiveRunQuote,
  };
}
