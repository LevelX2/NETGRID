import type { ChoiceRequest, LegalAction, PlayerAction } from "@netgrid/shared";

export function validateChoiceAction(
  choice: ChoiceRequest | undefined,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): string | undefined {
  if (!choice)
    return legalAction.type === "resolve_choice"
      ? "Es ist keine Choice offen."
      : undefined;
  if (
    choice.side === "corp" &&
    choice.source.startsWith("trace:") &&
    legalAction.side === "corp" &&
    legalAction.type === "activated_card_ability" &&
    legalAction.payload?.cardImplementationAbilityTiming === "corp_trace_window"
  )
    return undefined;
  if (
    choice.side === "runner" &&
    legalAction.side === "runner" &&
    legalAction.type === "activated_card_ability" &&
    legalAction.payload?.cardImplementationAbilityTiming ===
      "runner_cost_penalty_support"
  )
    return undefined;
  if (legalAction.type !== "resolve_choice")
    return "Solange eine Choice offen ist, sind keine anderen Aktionen legal.";
  if (playerAction.side !== choice.side)
    return "Diese Choice gehoert der anderen Seite.";
  if (choice.stateVersion !== playerAction.clientKnownStateVersion)
    return "Diese Choice gehoert zu einem anderen Spielzustand.";
  if (playerAction.selectedChoices?.choiceId !== choice.choiceId)
    return "Die ChoiceId ist ungueltig.";
  const selectedOptionIds = selectedChoiceIds(playerAction.selectedChoices);
  if (
    selectedOptionIds.length < choice.minSelections ||
    selectedOptionIds.length > choice.maxSelections
  )
    return "Die Anzahl der gewaehlten Optionen ist ungueltig.";
  const optionIds = new Set(choice.options.map((option) => option.id));
  if (selectedOptionIds.some((id) => !optionIds.has(id)))
    return "Eine gewaehlte Option ist nicht legal.";
  if (
    selectedOptionIds.some(
      (id) =>
        choice.options.find((option) => option.id === id)?.selectable === false,
    )
  )
    return "Eine gewaehlte Option ist fuer diesen Effekt nicht auswaehlbar.";
  if (new Set(selectedOptionIds).size !== selectedOptionIds.length)
    return "Eine Option wurde doppelt gewaehlt.";
  return undefined;
}

export function selectedChoiceIds(
  selectedChoices: PlayerAction["selectedChoices"],
): string[] {
  const raw =
    selectedChoices?.selectedOptionIds ??
    selectedChoices?.optionIds ??
    selectedChoices?.options ??
    selectedChoices?.selectedOptions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string");
}
