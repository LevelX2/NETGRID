import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";

type CentralRunActionSequenceEntry = {
  side?: string;
  actionType?: string;
  targetServerId?: string;
  reasonCode: string;
};

export function isEconomyStallExemptAction(
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
): boolean {
  if (decision.fallbackUsed) return true;
  if (decision.reasonCode.endsWith(".recover_economy")) return true;
  if (
    action.type === "mandatory_draw" ||
    action.type === "end_turn" ||
    action.type === "decline_rez" ||
    action.type === "resolve_choice"
  )
    return true;
  if (input.side !== "runner") return false;
  return (
    action.type === "pump_breaker" ||
    action.type === "break_subroutine" ||
    action.type === "continue_run" ||
    action.type === "access_card" ||
    action.type === "steal_agenda"
  );
}

export function isAgendaFloodExposureExemptAction(
  action: LegalAction,
  decision: AiDecision,
  sourceDefinition?: { type?: string },
): boolean {
  if (decision.fallbackUsed) return true;
  if (decision.reasonCode.endsWith(".recover_economy")) return true;
  if (
    decision.reasonCode.endsWith(".protect_hq") ||
    decision.reasonCode.endsWith(".protect_rnd")
  )
    return true;
  if (
    action.type === "install_card" &&
    action.payload?.placement !== "ice" &&
    sourceDefinition?.type !== "agenda"
  )
    return true;
  return (
    action.type === "mandatory_draw" ||
    action.type === "end_turn" ||
    action.type === "decline_rez" ||
    action.type === "rez_ice" ||
    action.type === "resolve_choice"
  );
}

export function repeatedLowValueCentralRunTags(
  actionSequence: readonly CentralRunActionSequenceEntry[],
): string[] {
  const tags: string[] = [];
  const lastCentralRunByServer = new Map<string, number>();
  for (const [index, entry] of actionSequence.entries()) {
    if (
      entry.side !== "runner" ||
      entry.actionType !== "start_run" ||
      !entry.targetServerId ||
      !["rd", "hq", "archives"].includes(entry.targetServerId)
    )
      continue;
    const previous = lastCentralRunByServer.get(entry.targetServerId);
    if (
      previous !== undefined &&
      index - previous <= 4 &&
      !entry.reasonCode.includes("contest") &&
      !entry.reasonCode.includes("trash")
    )
      tags.push("repeated_low_value_central_run");
    lastCentralRunByServer.set(entry.targetServerId, index);
  }
  return tags;
}
