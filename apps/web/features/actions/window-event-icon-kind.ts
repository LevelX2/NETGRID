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
  | "run-remote"
  | "draw-card"
  | "gain-credit"
  | "install-card"
  | "play-card"
  | "rez-card"
  | "advance-card"
  | "remove-tag"
  | "purge"
  | "card-ability"
  | "choice"
  | "run-end"
  | "turn-end"
  | "action";

export function windowEventIconKindForActionCue(input: {
  actionType: string;
  ambience: InteractionAmbienceKind | null | undefined;
  serverId?: string;
  serverLabel?: string;
}): WindowEventIconKind {
  if (input.actionType !== "start_run") {
    const ambienceKind = windowEventIconKindForAmbience(input.ambience);
    if (ambienceKind) return ambienceKind;
    return windowEventIconKindForActionType(input.actionType);
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

export function windowEventIconKindForChoice(input: {
  ambience: InteractionAmbienceKind | null | undefined;
  source: string;
  title: string;
}): WindowEventIconKind {
  const ambienceKind = windowEventIconKindForAmbience(input.ambience);
  if (ambienceKind) return ambienceKind;

  const signal = `${input.source} ${input.title}`.toLowerCase();
  if (signal.includes("credit") || signal.includes("econom")) {
    return "gain-credit";
  }
  if (signal.includes("install")) return "install-card";
  if (signal.includes("tag")) return "remove-tag";
  if (signal.includes("purge") || signal.includes("virus")) return "purge";
  if (
    signal.includes("search") ||
    signal.includes("stack") ||
    signal.includes("grip") ||
    signal.includes("hq") ||
    signal.includes("rd_") ||
    signal.includes("r&d") ||
    signal.includes("draw") ||
    signal.includes("look") ||
    signal.includes("arrange") ||
    signal.includes("reorder") ||
    signal.includes("anordnen") ||
    signal.includes("durchsuchen")
  ) {
    return "draw-card";
  }
  return "choice";
}

function windowEventIconKindForActionType(
  actionType: string,
): WindowEventIconKind {
  switch (actionType) {
    case "mandatory_draw":
    case "draw_card":
    case "draw_cards":
      return "draw-card";
    case "gain_credit":
    case "gain_credits":
    case "lose_credits":
    case "take_hosted_credits":
    case "add_hosted_credits":
      return "gain-credit";
    case "install_card":
    case "install":
      return "install-card";
    case "play_event":
    case "play_operation":
      return "play-card";
    case "rez_ice":
    case "rez_card":
    case "decline_rez":
      return "rez-card";
    case "advance_card":
      return "advance-card";
    case "score_agenda":
    case "steal_agenda":
      return "agenda";
    case "access_card":
    case "decline_trash":
      return "access";
    case "trash_accessed_card":
    case "trash_resource":
    case "trash_card":
    case "trash_source":
    case "trash_source_when_empty":
      return "trash";
    case "purge_virus_counters":
    case "purge_runner_virus_counters":
    case "purge_counters":
      return "purge";
    case "remove_tag":
    case "remove_tags":
      return "remove-tag";
    case "activated_card_ability":
    case "trigger_ability":
    case "resolve_subroutine":
      return "card-ability";
    case "resolve_choice":
      return "choice";
    case "jack_out":
      return "run-end";
    case "end_turn":
    case "forgo_action":
      return "turn-end";
    default:
      return "action";
  }
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
