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
  | "core-damage"
  | "run-hq"
  | "run-rd"
  | "run-archives"
  | "run-remote";

export function windowEventIconKindForActionCue(input: {
  actionType: string;
  ambience: InteractionAmbienceKind | null | undefined;
  serverId?: string;
  serverLabel?: string;
}): WindowEventIconKind | null {
  if (input.actionType !== "start_run") {
    return windowEventIconKindForAmbience(input.ambience);
  }

  const target = `${input.serverId ?? ""} ${input.serverLabel ?? ""}`
    .trim()
    .toLowerCase();
  if (target.includes("archives") || target.includes("archiv")) {
    return "run-archives";
  }
  if (target.includes("remote")) return "run-remote";
  if (target.includes("rd") || target.includes("r&d") || target.includes("research")) {
    return "run-rd";
  }
  return "run-hq";
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
