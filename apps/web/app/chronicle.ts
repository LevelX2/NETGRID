import type { PublicGameEvent, Side } from "@netrunner/shared";

export type ChronicleCategory = "turn" | "economy" | "card" | "run" | "agenda" | "danger" | "system" | "hidden";
export type ChronicleImportance = "normal" | "important" | "critical";
export type ChronicleVisibility = "public" | "side" | "redacted" | "system";

export type ChronicleContext = {
  side: Side;
  cardTitle?: string | null;
  cardText?: string | null;
  cardType?: string | null;
  cardDetailLines?: string[];
  agendaPoints?: number | null;
};

export type ChronicleItem = {
  id: string;
  category: ChronicleCategory;
  importance: ChronicleImportance;
  visibility: ChronicleVisibility;
  actor?: Side;
  actionUse?: ChronicleActionUse;
  title: string;
  description?: string;
  chips: string[];
  cardTitle?: string;
  cardText?: string;
  cardDetailLines: string[];
  groupLabel: string;
};

export type ChronicleActionUse = {
  label: string;
  title: string;
  clicks: number;
  start: number;
  end: number;
};

export const CHRONICLE_CATEGORY_LABELS: Record<ChronicleCategory, string> = {
  turn: "Zug",
  economy: "Economy",
  card: "Karte",
  run: "Run",
  agenda: "Agenda",
  danger: "Gefahr",
  system: "System",
  hidden: "Verdeckt"
};

type EffectSummary = {
  category?: ChronicleCategory;
  suffix?: string;
  sentence?: string;
  chips: string[];
};

export function formatChronicleEvent(event: PublicGameEvent, side: Side, context: Omit<ChronicleContext, "side"> = {}): ChronicleItem {
  const payload = event.publicPayload ?? {};
  const actionType = stringValue(payload.actionType) ?? event.type;
  const actor = sideValue(payload.actor);
  const amount = numberValue(payload.amount);
  const serverLabel = displayServerLabel(stringValue(payload.serverLabel));
  const zoneLabel = stringValue(payload.zoneLabel);
  const result = stringValue(payload.result);
  const runPhase = stringValue(payload.runPhase);
  const redactedKind = stringValue(payload.redactedKind);
  const agendaPoints = numberValue(payload.agendaPoints) ?? context.agendaPoints;
  const actionUse = actionUseFromPayload(payload);
  const label = stringValue(payload.label);
  const explicitCardTitle = context.cardTitle ?? stringValue(payload.title);
  const labelCardTitle = extractCardTitleFromLabel(actionType, label, actor);
  const cardTitle = explicitCardTitle ?? labelCardTitle;
  const cardText = context.cardText ?? undefined;
  const isAi = Boolean(stringValue(payload.aiExplanation) || stringValue(payload.aiReasonCode));
  const subject = subjectFor(actor, side, isAi);
  const effect = summarizeEffect(cardText);

  const baseChipList = baseChips(actor, isAi);
  const cardDetailLines = context.cardDetailLines ?? [];
  let category: ChronicleCategory = effect.category ?? categoryFor(actionType);
  let importance: ChronicleImportance = "normal";
  let visibility: ChronicleVisibility = "public";
  let title = "";
  let description: string | undefined;
  const chips = [...baseChipList];

  switch (actionType) {
    case "game_created":
      category = "system";
      visibility = "system";
      title = "Das Spiel wurde erstellt.";
      chips.push("Spielstart");
      break;
    case "mandatory_draw":
      category = "turn";
      title = phrase(subject, `${possessiveFor(subject)} Pflichtkarte gezogen`);
      chips.push("Pflichtkarte");
      break;
    case "gain_credit":
      category = "economy";
      title = phrase(subject, `${creditText(amount ?? 1)} genommen`);
      chips.push(`+${amount ?? 1} Credit${amount === 1 || amount === undefined ? "" : "s"}`);
      break;
    case "draw_card":
      category = "card";
      title = phrase(subject, `${cardCountText(amount ?? 1)} gezogen`);
      chips.push(amount && amount > 1 ? `${amount} Karten` : "Karte ziehen");
      break;
    case "install_card":
      if (actor === "corp" && (redactedKind || !cardTitle)) {
        category = "hidden";
        visibility = "redacted";
        title = phrase(subject, `eine verdeckte Karte${installLocation(serverLabel, zoneLabel, label)} installiert`);
        chips.push("Verdeckt", installAreaFromPayload(serverLabel, zoneLabel, label));
      } else {
        category = "card";
        title = phrase(subject, `${cardTitle ?? "eine Karte"}${installDestinationForTitle(actor, serverLabel, zoneLabel, label)} installiert`);
        chips.push("Install", installAreaFromPayload(serverLabel, zoneLabel, label));
      }
      break;
    case "play_event":
    case "play_operation":
      title = phrase(subject, `${cardTitle ?? "eine Karte"} gespielt${effect.suffix ? ` und ${effect.suffix}` : ""}`);
      chips.push(actionType === "play_event" ? "Event" : "Operation", ...effect.chips);
      break;
    case "advance_card":
      category = "hidden";
      visibility = actor === "corp" && (redactedKind || !cardTitle) ? "redacted" : "public";
      title = phrase(subject, advanceTitlePart(cardTitle, context.cardType, serverLabel, visibility === "redacted"));
      chips.push("+1 Entwicklung", ...(serverLabel ? [serverLabel] : []), ...(visibility === "redacted" ? ["Verdeckt"] : []));
      break;
    case "score_agenda": {
      category = "agenda";
      importance = "important";
      const points = agendaPointSuffix(agendaPoints);
      title = phrase(subject, `${cardTitle ?? "eine Agenda"} gescored${points}`);
      chips.push("Score", ...agendaPointChips(agendaPoints));
      break;
    }
    case "start_run": {
      category = "run";
      importance = "important";
      const target = serverLabel ?? runTargetFromLabel(label);
      title = phrase(subject, `einen Run auf ${target} gestartet`);
      chips.push("Run", target);
      break;
    }
    case "rez_ice":
      category = context.cardType === "asset" || context.cardType === "upgrade" ? "card" : "run";
      title = phrase(subject, `${cardTitle ?? "eine Karte"} gerezzt${rezSuffix(context.cardType, effect)}`);
      chips.push("Rez", ...effect.chips);
      if (context.cardType === "ice" || cardTitle?.includes("ICE")) chips.push("Begegnung");
      break;
    case "decline_rez":
      category = "run";
      title = phrase(subject, "nicht gerezzt. Der Run geht weiter");
      chips.push("Run", "Kein Rez");
      break;
    case "pump_breaker":
      category = "run";
      title = phrase(subject, `${cardTitle ?? "einen Icebreaker"} gepumpt`);
      chips.push("Breaker", "+Stärke");
      break;
    case "break_subroutine":
      category = "run";
      title = phrase(subject, "eine Subroutine gebrochen");
      chips.push("Subroutine", "Gebrochen");
      break;
    case "continue_run":
      category = "run";
      title = phrase(subject, result === "ended" ? "den Run beendet" : "den Run fortgesetzt");
      chips.push("Run", ...(runPhase ? [runPhaseLabel(runPhase)] : []));
      break;
    case "access_card":
      category = "run";
      importance = "important";
      title = phrase(subject, `auf ${cardTitle ?? "eine Karte"} zugegriffen`);
      chips.push("Zugriff", ...(serverLabel ? [serverLabel] : []));
      break;
    case "steal_agenda": {
      category = "agenda";
      importance = "critical";
      const points = agendaPointSuffix(agendaPoints);
      title = phrase(subject, `${cardTitle ?? "eine Agenda"} gestohlen${points}`);
      chips.push("Steal", ...agendaPointChips(agendaPoints));
      break;
    }
    case "trash_accessed_card":
      category = "card";
      importance = "important";
      title = phrase(subject, `${cardTitle ?? "die zugegriffene Karte"} getrasht`);
      chips.push("Trash");
      break;
    case "trash_resource":
      category = "danger";
      importance = "important";
      title = phrase(subject, `${cardTitle ?? "eine Resource"} getrasht`);
      chips.push("Resource", "Trash");
      break;
    case "decline_trash":
      category = "run";
      title = phrase(subject, "den Zugriff abgeschlossen");
      chips.push("Zugriff");
      break;
    case "remove_tag":
      category = "danger";
      importance = "important";
      title = phrase(subject, "einen Tag entfernt");
      chips.push("Tag entfernt");
      break;
    case "end_turn":
      category = "turn";
      title = phrase(subject, "den Zug beendet");
      chips.push("Zugende");
      break;
    default:
      category = "system";
      visibility = "system";
      title = actor ? phrase(subject, "eine legale Aktion ausgeführt") : "Das Spiel hat einen Systemschritt ausgeführt.";
      chips.push("Aktion");
      if (!description && label) description = `Hinweis: ${safeLabel(label)}`;
      break;
  }

  if (effect.sentence && !description) description = effect.sentence;

  return {
    id: event.eventId,
    category,
    importance,
    visibility,
    ...(actor ? { actor } : {}),
    ...(actionUse ? { actionUse } : {}),
    title: ensurePeriod(title),
    ...(description ? { description: ensurePeriod(description) } : {}),
    chips: uniqueChips(chips.filter(Boolean)),
    ...(cardTitle && visibility !== "redacted" ? { cardTitle } : {}),
    ...(cardText && visibility !== "redacted" ? { cardText } : {}),
    cardDetailLines: visibility === "redacted" ? [] : cardDetailLines,
    groupLabel: groupLabelFor(category, actor, label, serverLabel)
  };
}

function actionUseFromPayload(payload: Record<string, unknown>): ChronicleActionUse | undefined {
  const clicks = positiveIntegerValue(payload.actionCostClicks);
  const start = positiveIntegerValue(payload.turnActionOrdinalStart);
  const end = positiveIntegerValue(payload.turnActionOrdinalEnd) ?? start;
  if (!clicks || !start || !end) return undefined;
  const label = start === end ? String(start) : `${start}-${end}`;
  const title = start === end ? `${start}. Aktion in diesem Zug` : `Aktionen ${start} bis ${end} in diesem Zug`;
  return { label, title, clicks, start, end };
}

export function chronicleGroupLabel(item: ChronicleItem): string {
  return item.groupLabel;
}

function categoryFor(actionType: string): ChronicleCategory {
  if (["mandatory_draw", "end_turn"].includes(actionType)) return "turn";
  if (["gain_credit"].includes(actionType)) return "economy";
  if (["start_run", "rez_ice", "decline_rez", "pump_breaker", "break_subroutine", "continue_run", "access_card", "decline_trash"].includes(actionType)) return "run";
  if (["score_agenda", "steal_agenda"].includes(actionType)) return "agenda";
  if (["remove_tag"].includes(actionType)) return "danger";
  if (["game_created"].includes(actionType)) return "system";
  return "card";
}

function subjectFor(actor: Side | undefined, side: Side, isAi: boolean): string {
  if (!actor) return "Das Spiel";
  if (actor === side) return "Du";
  if (actor === "corp") return isAi ? "Die Corp-KI" : "Die Corp";
  return isAi ? "Die Runner-KI" : "Der Runner";
}

function possessiveFor(subject: string): string {
  if (subject === "Du") return "deine";
  if (subject === "Die Corp" || subject.endsWith("-KI")) return "ihre";
  if (subject === "Der Runner") return "seine";
  return "die";
}

function phrase(subject: string, action: string): string {
  return `${subject} ${subject === "Du" ? "hast" : "hat"} ${action}`;
}

function baseChips(actor: Side | undefined, isAi: boolean): string[] {
  const chips: string[] = [];
  if (actor) chips.push(actor === "corp" ? "Corp" : "Runner");
  if (isAi) chips.push("KI");
  return chips;
}

function summarizeEffect(cardText: string | undefined): EffectSummary {
  if (!cardText) return { chips: [] };
  const gain = cardText.match(/Erhalte\s+(\d+)\s+Credits/i);
  if (gain) return { category: "economy", suffix: "Credits erhalten", chips: [`+${gain[1]} Credits`] };
  const draw = cardText.match(/Ziehe\s+(\d+)\s+Karten/i);
  if (draw) return { category: "card", suffix: "Karten gezogen", chips: [`${draw[1]} Karten`] };
  const lose = cardText.match(/Runner verliert\s+(\d+)\s+Credits/i);
  if (lose) return { category: "danger", sentence: `Der Runner verliert bis zu ${lose[1]} Credits.`, chips: [`-${lose[1]} Runner-Credits`] };
  const tag = cardText.match(/Gib dem Runner\s+(\d+)\s+Tag/i);
  if (tag) return { category: "danger", sentence: `Der Runner erhält ${tag[1]} Tag.`, chips: [`+${tag[1]} Tag`] };
  if (/Run auf einen Server/i.test(cardText)) return { category: "run", suffix: "Run-Druck aufgebaut", chips: ["Run"] };
  return { chips: [] };
}

function rezSuffix(cardType: string | null | undefined, effect: EffectSummary): string {
  if (effect.suffix) return ` und ${effect.suffix}`;
  if (cardType === "ice") return ". Die Begegnung beginnt";
  return "";
}

function creditText(amount: number): string {
  return `${amount} Credit${amount === 1 ? "" : "s"}`;
}

function cardCountText(amount: number): string {
  return amount === 1 ? "eine Karte" : `${amount} Karten`;
}

function installLocation(serverLabel: string | undefined, zoneLabel: string | undefined, label: string | undefined): string {
  if (serverLabel) return zoneLabel === "ICE" ? ` vor ${serverLabel}` : ` in ${serverLabel}`;
  if (zoneLabel === "Rig") return " im Rig";
  if (zoneLabel === "Resource") return " als Resource";
  const area = installAreaFromLabel(label);
  if (area === "Außenserver") return " in einem Außenserver";
  if (area === "ICE") return " als ICE";
  return "";
}

function installDestinationForTitle(actor: Side | undefined, serverLabel: string | undefined, zoneLabel: string | undefined, label: string | undefined): string {
  if (zoneLabel === "Resource") return " als Resource";
  if (actor === "runner" || zoneLabel === "Rig") return " im Rig";
  return installLocation(serverLabel, zoneLabel, label);
}

function installAreaFromPayload(serverLabel: string | undefined, zoneLabel: string | undefined, label: string | undefined): string {
  if (zoneLabel) return zoneLabel;
  if (serverLabel) return /Außenserver/.test(serverLabel) ? "Außenserver" : serverLabel;
  return installAreaFromLabel(label);
}

function installAreaFromLabel(label: string | undefined): string {
  if (!label) return "Installation";
  if (/ice|vor/i.test(label)) return "ICE";
  if (/remote|außenserver|aussenserver/i.test(label)) return "Außenserver";
  return "Installation";
}

function advanceTitlePart(cardTitle: string | undefined, cardType: string | null | undefined, serverLabel: string | undefined, redacted: boolean): string {
  if (redacted || !cardTitle) return `eine Installation${serverLabel ? ` in ${serverLabel}` : ""} ausgebaut`;
  if (cardType === "agenda") return `das Projekt ${cardTitle} weiterentwickelt`;
  if (cardType === "asset") return `die Anlage ${cardTitle} ausgebaut`;
  if (cardType === "upgrade") return `das Upgrade ${cardTitle} ausgebaut`;
  return `${cardTitle} weiterentwickelt`;
}

function displayServerLabel(label: string | undefined): string | undefined {
  if (!label) return undefined;
  return label.replace(/\bRemote\s+(\d+)\b/g, "Außenserver $1").replace(/\bneuem Remote\b/g, "neuem Außenserver");
}

function runTargetFromLabel(label: string | undefined): string {
  const match = label?.match(/Run auf (.+)$/i);
  return match?.[1]?.trim() || "einen Server";
}

function extractCardTitleFromLabel(actionType: string, label: string | undefined, actor: Side | undefined): string | undefined {
  if (!label || (actor === "corp" && ["install_card", "advance_card"].includes(actionType))) return undefined;
  const patterns: RegExp[] = [];
  if (["install_card", "play_event", "play_operation", "rez_ice", "pump_breaker", "trash_accessed_card", "trash_resource", "steal_agenda"].includes(actionType)) {
    patterns.push(/^(.+?)\s+(?:installieren|spielen|rezzen|pumpen|trashen|stehlen)$/i);
    patterns.push(/^(.+?)\s+auf\s+.+$/i);
  }
  for (const pattern of patterns) {
    const match = label.match(pattern);
    const title = match?.[1]?.trim();
    if (title && !isGenericCardLabel(title)) return title;
  }
  return undefined;
}

function isGenericCardLabel(value: string): boolean {
  return /^(karte|eine karte|agenda|corp|runner|run|nicht)$/i.test(value);
}

function runPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    approach_ice: "Annäherung",
    encounter_ice: "Begegnung",
    break: "Brechen",
    access: "Zugriff",
    complete: "Abschluss"
  };
  return labels[phase] ?? phase;
}

function groupLabelFor(category: ChronicleCategory, actor: Side | undefined, label: string | undefined, serverLabel: string | undefined): string {
  if (category === "system") return "System";
  if (category === "run") return `Run${serverLabel ? ` auf ${serverLabel}` : label && /Run auf/i.test(label) ? ` auf ${runTargetFromLabel(label)}` : ""}`;
  if (actor === "corp") return "Corp-Zug";
  if (actor === "runner") return "Runner-Zug";
  return "Spiel";
}

function agendaPointSuffix(points: number | null | undefined): string {
  return typeof points === "number" ? ` und ${points} Agenda-Punkte erhalten` : "";
}

function agendaPointChips(points: number | null | undefined): string[] {
  return typeof points === "number" ? [`+${points} Agenda`] : [];
}

function safeLabel(label: string): string {
  return label.replace(/\b[a-z]+_[a-z0-9_.-]+/gi, "Aktion");
}

function ensurePeriod(value: string): string {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function uniqueChips(chips: string[]): string[] {
  return Array.from(new Set(chips));
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function positiveIntegerValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function sideValue(value: unknown): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}
