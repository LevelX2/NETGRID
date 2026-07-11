import type { InteractionAmbienceKind } from "../../app/action-board-ui";

export type WindowEventIconKind =
  | "agenda"
  | "ice-pass"
  | "access"
  | "trash"
  | "trace"
  | "pump-break"
  | "net-damage"
  | "meat-damage"
  | "core-damage";

export function WindowEventIcon({
  kind,
}: {
  kind: WindowEventIconKind | null | undefined;
}) {
  if (!kind) return null;
  return (
    <span
      className={`windowEventIcon windowEventIcon-${kind}`}
      aria-hidden="true"
      data-window-event-icon={kind}
    />
  );
}

export function windowEventIconKindForAmbience(
  ambience: InteractionAmbienceKind | null | undefined,
): WindowEventIconKind | null {
  if (ambience === "movement") return "ice-pass";
  if (ambience === "pump") return "pump-break";
  if (
    ambience === "agenda" ||
    ambience === "access" ||
    ambience === "trash" ||
    ambience === "trace"
  ) {
    return ambience;
  }
  return null;
}
