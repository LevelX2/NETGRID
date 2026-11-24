import type { LegalAction } from "@netgrid/shared";

export function semanticRuntimeActionTypeIsReactive(
  type: LegalAction["type"],
): boolean {
  return (
    type === "mandatory_draw" ||
    type === "resolve_choice" ||
    type === "access_card" ||
    type === "steal_agenda" ||
    type === "trash_accessed_card" ||
    type === "decline_trash" ||
    type === "break_subroutine" ||
    type === "pump_breaker" ||
    type === "continue_run" ||
    type === "jack_out"
  );
}
