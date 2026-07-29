import { AI_HINTS_BY_CARD } from "../ai-hints";

export type CorpActionIceRezSupportLiability =
  | "bounded"
  | "temporary"
  | "installment";

export function definitionHasActionIceRezSupport(
  definitionId: string,
): boolean {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return (
    hint?.side === "corp" &&
    hint.effects?.some(
      (effect) =>
        effect.kind === "rez" &&
        effect.scope === "ice" &&
        effect.timing === "action",
    ) === true &&
    hint.targetProfiles?.some(
      (profile) =>
        "kind" in profile &&
        profile.kind === "use_target" &&
        profile.targetType === "installed_ice",
    ) === true
  );
}

export function actionIceRezSupportLiability(
  definitionId: string,
): CorpActionIceRezSupportLiability | undefined {
  if (!definitionHasActionIceRezSupport(definitionId)) return undefined;
  const tacticSignals = new Set(
    AI_HINTS_BY_CARD.get(definitionId)?.tacticSignals ?? [],
  );
  if (
    tacticSignals.has("ice.corp_temporary_rez") &&
    tacticSignals.has("risk.temporary_rez_liability")
  ) {
    return "temporary";
  }
  if (
    tacticSignals.has("ice.corp_installment_rez") &&
    tacticSignals.has("risk.term_counter_payment_liability")
  ) {
    return "installment";
  }
  return "bounded";
}
