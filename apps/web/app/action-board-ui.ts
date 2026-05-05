import type { LegalAction, PlayerView, Side, VisibleCard } from "@netrunner/shared";

export const ACTION_CUE_POSITION_STORAGE_KEY = "netrunner.actionCuePosition.v1";

export type ActionContext = {
  kind: "card" | "server";
  id: string;
  label: string;
};

export type CuePositionPreset = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center";

export type CuePositionPreference =
  | { kind: "preset"; preset: CuePositionPreset }
  | { kind: "custom"; xPercent: number; yPercent: number };

export const DEFAULT_CUE_POSITION: CuePositionPreference = { kind: "preset", preset: "top-right" };

const BASE_ACTION_TYPES = new Set<LegalAction["type"]>(["mandatory_draw", "gain_credit", "draw_card", "start_run", "remove_tag", "purge_virus_counters", "end_turn"]);
const DECISION_ACTION_TYPES = new Set<LegalAction["type"]>([
  "resolve_choice",
  "access_card",
  "trash_accessed_card",
  "decline_trash",
  "steal_agenda",
  "jack_out",
  "continue_run",
  "rez_ice",
  "decline_rez",
  "pump_breaker",
  "break_subroutine"
]);

const ACTION_GROUP_LABELS: Record<LegalAction["type"], string> = {
  mandatory_draw: "Karten ziehen",
  gain_credit: "Credits",
  draw_card: "Karten ziehen",
  install_card: "Installieren",
  play_event: "Spielen",
  play_operation: "Spielen",
  advance_card: "Agenda/Server",
  score_agenda: "Agenda/Server",
  start_run: "Run",
  jack_out: "Run",
  rez_ice: "Begegnung",
  decline_rez: "Begegnung",
  pump_breaker: "Begegnung",
  break_subroutine: "Begegnung",
  continue_run: "Run",
  access_card: "Zugriff",
  steal_agenda: "Zugriff",
  trash_accessed_card: "Zugriff",
  trash_resource: "Tags/Ressourcen",
  decline_trash: "Zugriff",
  remove_tag: "Tags/Ressourcen",
  purge_virus_counters: "Virus-Counter",
  resolve_choice: "Entscheidung",
  trigger_ability: "Weitere Aktionen",
  end_turn: "Zug"
};

export const RUN_TIMELINE_STEPS = [
  { id: "target", label: "Ziel" },
  { id: "approach_ice", label: "Annäherung" },
  { id: "encounter_ice", label: "Begegnung" },
  { id: "break", label: "Brechen" },
  { id: "movement", label: "Bewegung" },
  { id: "access", label: "Zugriff" },
  { id: "complete", label: "Abschluss" }
] as const;

export type RunTimelineStepId = (typeof RUN_TIMELINE_STEPS)[number]["id"];

export function splitLegalActions(actions: LegalAction[]): { primaryActions: LegalAction[]; contextualActions: LegalAction[] } {
  const primaryActions: LegalAction[] = [];
  const contextualActions: LegalAction[] = [];
  for (const action of actions) {
    if (isContextualLegalAction(action)) contextualActions.push(action);
    else primaryActions.push(action);
  }
  return { primaryActions, contextualActions };
}

export function isContextualLegalAction(action: LegalAction): boolean {
  if (isPriorityAction(action)) return false;
  return cardRefsForAction(action).length > 0 || objectBoundAction(action);
}

export function actionMatchesContext(action: LegalAction, context: ActionContext): boolean {
  if (context.kind === "card") return cardRefsForAction(action).includes(context.id);
  return serverRefsForAction(action).includes(context.id);
}

export function actionContextStillVisible(context: ActionContext, view: PlayerView): boolean {
  if (context.kind === "server") return view.servers.some((server) => server.id === context.id);
  return visibleActionCards(view).some((card) => card.instanceId === context.id && card.known);
}

export function actionGroupLabel(type: LegalAction["type"]): string {
  return ACTION_GROUP_LABELS[type] ?? "Weitere Aktionen";
}

export function actionButtonLabel(action: LegalAction): string {
  switch (action.type) {
    case "mandatory_draw":
      return "Pflichtkarte ziehen";
    case "gain_credit":
      return "Credit nehmen";
    case "draw_card":
      return "Karte ziehen";
    case "jack_out":
      return "Run abbrechen (Jack-out)";
    case "decline_rez":
      return "Nicht rezzen";
    case "continue_run":
      return normalizeVisibleTerms(action.label || "Run fortsetzen");
    case "decline_trash":
      return "Zugriff abschließen";
    case "end_turn":
      return "Zug beenden";
    case "resolve_choice":
      return normalizeVisibleTerms(action.label || "Entscheidung bestätigen");
    default:
      return normalizeVisibleTerms(action.label);
  }
}

export function normalizeVisibleTerms(value: string): string {
  return value
    .replace(/\bR&D\b/g, "F&E (R&D)")
    .replace(/\bArchives\b/g, "Archive")
    .replace(/\bApproach\b/g, "Annäherung")
    .replace(/\bEncounter\b/g, "Begegnung")
    .replace(/\bAccess\b/g, "Zugriff")
    .replace(/\bBreach\b/g, "Zugriffsphase")
    .replace(/\bBreak\b/g, "Brechen");
}

export function serverDisplayLabel(serverIdOrLabel: string): string {
  if (serverIdOrLabel === "hq" || serverIdOrLabel === "HQ") return "HQ";
  if (serverIdOrLabel === "rd" || serverIdOrLabel === "R&D") return "F&E (R&D)";
  if (serverIdOrLabel === "archives" || serverIdOrLabel === "Archives") return "Archive";
  if (serverIdOrLabel === "new_remote") return "neuem Remote";
  const remote = /^remote_(\d+)$/.exec(serverIdOrLabel);
  if (remote?.[1]) return `Remote ${remote[1]}`;
  return normalizeVisibleTerms(serverIdOrLabel);
}

export function currentRunTimelineStep(view: PlayerView, actions: LegalAction[]): RunTimelineStepId | null {
  if (!view.run) return null;
  if (view.run.accessedCard || actions.some((action) => ["access_card", "trash_accessed_card", "decline_trash", "steal_agenda"].includes(action.type))) return "access";
  if (view.run.phase === "access") return "access";
  if (view.run.phase === "movement") return "movement";
  if (view.run.phase === "encounter_ice" && actions.some((action) => action.type === "pump_breaker" || action.type === "break_subroutine")) return "break";
  if (view.run.phase === "encounter_ice") return "encounter_ice";
  if (view.run.phase === "approach_ice") return "approach_ice";
  return "target";
}

export function runTargetServerIds(view: PlayerView): string[] {
  if (!view.run) return [];
  return view.servers.some((server) => server.id === view.run?.attackedServerId) ? [view.run.attackedServerId] : [];
}

export function hasLegalAction(actions: LegalAction[], type: LegalAction["type"]): boolean {
  return actions.some((action) => action.type === type);
}

export function breachProgressLabel(view: PlayerView): string | null {
  const breach = view.run?.breach;
  if (!breach) return null;
  const current = breach.currentIndex + 1;
  const knownTotal = breach.completed ? breach.currentIndex + 1 : breach.currentIndex + 1 + breach.remainingCount;
  return `Zugriff ${current} von ${Math.max(current, knownTotal)}`;
}

export function groupRunnerRigCards(cards: VisibleCard[]): Array<{ key: string; label: string; cards: VisibleCard[] }> {
  const groups = [
    { key: "program", label: "Programme", cards: cards.filter((card) => card.type === "program") },
    { key: "hardware", label: "Hardware", cards: cards.filter((card) => card.type === "hardware") },
    { key: "resource", label: "Ressourcen", cards: cards.filter((card) => card.type === "resource") },
    { key: "other", label: "Sonstiges", cards: cards.filter((card) => card.type !== "program" && card.type !== "hardware" && card.type !== "resource") }
  ];
  return groups.filter((group) => group.cards.length > 0);
}

export function corpInstalledCardState(card: VisibleCard): "hidden" | "unrezzed" | "rezzed" | "known" {
  if (!card.known) return "hidden";
  if (card.rezzed === false) return "unrezzed";
  if (card.rezzed === true) return "rezzed";
  return "known";
}

export function parseCuePositionPreference(raw: string | null): CuePositionPreference {
  if (!raw) return DEFAULT_CUE_POSITION;
  try {
    return normalizeCuePositionPreference(JSON.parse(raw));
  } catch {
    return DEFAULT_CUE_POSITION;
  }
}

export function normalizeCuePositionPreference(value: unknown): CuePositionPreference {
  if (!value || typeof value !== "object") return DEFAULT_CUE_POSITION;
  const candidate = value as Partial<CuePositionPreference> & { preset?: unknown; xPercent?: unknown; yPercent?: unknown };
  if (candidate.kind === "preset" && isCuePreset(candidate.preset)) return { kind: "preset", preset: candidate.preset };
  if (candidate.kind === "custom" && finitePercent(candidate.xPercent) && finitePercent(candidate.yPercent)) {
    return { kind: "custom", xPercent: candidate.xPercent, yPercent: candidate.yPercent };
  }
  return DEFAULT_CUE_POSITION;
}

export function serializeCuePositionPreference(position: CuePositionPreference): string {
  return JSON.stringify(position);
}

export function cuePositionClassName(position: CuePositionPreference): string {
  return position.kind === "preset" ? `cuePosition-${position.preset}` : "cuePosition-custom";
}

export function cuePositionStyle(position: CuePositionPreference): Record<string, string> {
  if (position.kind !== "custom") return {};
  return {
    left: `${position.xPercent}%`,
    top: `${position.yPercent}%`
  };
}

export function clampCuePosition(xPercent: number, yPercent: number, viewportWidth: number, viewportHeight: number, overlayWidth: number, overlayHeight: number): CuePositionPreference {
  const margin = 12;
  const safeWidth = Math.max(1, viewportWidth);
  const safeHeight = Math.max(1, viewportHeight);
  const maxLeft = Math.max(margin, safeWidth - overlayWidth - margin);
  const maxTop = Math.max(margin, safeHeight - overlayHeight - margin);
  const leftPx = clamp((xPercent / 100) * safeWidth, margin, maxLeft);
  const topPx = clamp((yPercent / 100) * safeHeight, margin, maxTop);
  return {
    kind: "custom",
    xPercent: roundPercent((leftPx / safeWidth) * 100),
    yPercent: roundPercent((topPx / safeHeight) * 100)
  };
}

export function actionContextTitle(context: ActionContext): string {
  return context.kind === "card" ? `Ausgewählte Karte: ${context.label}` : `Ausgewähltes Objekt: ${serverDisplayLabel(context.label)}`;
}

function isPriorityAction(action: LegalAction): boolean {
  if (BASE_ACTION_TYPES.has(action.type)) return true;
  if (DECISION_ACTION_TYPES.has(action.type)) return true;
  return action.timingPoint.startsWith("run.") || action.timingPoint.startsWith("access.");
}

function objectBoundAction(action: LegalAction): boolean {
  if (action.type === "start_run") return false;
  return serverRefsForAction(action).length > 0 || ["advance_card", "score_agenda", "trash_resource", "trigger_ability"].includes(action.type);
}

function cardRefsForAction(action: LegalAction): string[] {
  const refs = new Set<string>();
  if (action.source !== "basic_action" && action.source !== "game_rule") refs.add(action.source);
  const payload = action.payload ?? {};
  addStringRef(refs, payload.cardId);
  addStringRef(refs, payload.resourceId);
  addStringRef(refs, payload.breakerId);
  if (action.abilityRef?.sourceCardInstanceId) refs.add(action.abilityRef.sourceCardInstanceId);
  for (const requirement of action.targetRequirements) {
    if (requirement.sourceIceRef) refs.add(requirement.sourceIceRef);
  }
  return Array.from(refs);
}

function serverRefsForAction(action: LegalAction): string[] {
  const refs = new Set<string>();
  const serverId = action.payload?.serverId;
  if (typeof serverId === "string") refs.add(serverId);
  for (const requirement of action.targetRequirements) {
    for (const allowedServer of requirement.allowedServers ?? []) refs.add(allowedServer);
  }
  return Array.from(refs);
}

function visibleActionCards(view: PlayerView): VisibleCard[] {
  return [
    ...view.own.gripOrHq,
    ...view.own.heapOrArchives,
    ...view.own.scoreArea,
    ...(view.own.rig ?? []),
    ...view.opponent.scoreArea,
    ...(view.opponent.rig ?? []),
    ...view.servers.flatMap((server) => [...server.ice, ...server.root]),
    ...(view.run?.encounteredIce ? [view.run.encounteredIce] : []),
    ...(view.run?.accessedCard ? [view.run.accessedCard] : [])
  ];
}

function addStringRef(refs: Set<string>, value: unknown): void {
  if (typeof value === "string" && value.trim()) refs.add(value);
}

function isCuePreset(value: unknown): value is CuePositionPreset {
  return value === "top-right" || value === "top-left" || value === "bottom-right" || value === "bottom-left" || value === "center";
}

function finitePercent(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}
