import type { LegalAction, PlayerView, PublicGameEvent, Side, VisibleCard } from "@netgrid/shared";
import { actionHasAbility } from "./action-payload";

export const ACTION_CUE_POSITION_STORAGE_KEY = "netgrid.actionCuePosition.v1";
export const LEGACY_ACTION_CUE_POSITION_STORAGE_KEY = "netgrid.actionCuePosition.v1";

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
  "break_subroutine",
  "move_to_set_aside",
  "move_to_removed_from_game",
  "return_from_set_aside",
  "change_card_control"
]);

const ACTION_GROUP_LABELS: Record<LegalAction["type"], string> = {
  mandatory_draw: "Karten ziehen",
  gain_credit: "Credits",
  draw_card: "Karten ziehen",
  install_card: "Installieren",
  play_event: "Spielen",
  play_operation: "Spielen",
  advance_card: "Ausbauen",
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
  move_to_set_aside: "Spezialzonen",
  move_to_removed_from_game: "Spezialzonen",
  return_from_set_aside: "Spezialzonen",
  change_card_control: "Kontrolle",
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

export type ActionSlotVisual = {
  index: number;
  state: "available" | "spent";
  bonus: boolean;
};

export type ActionSlotDisplay = {
  label: string;
  available: number;
  spent: number;
  capacity: number;
  baseCapacity: number;
  slots: ActionSlotVisual[];
};

export type AiPacingTriggerMode = "fast" | "paced" | "manual";

export type CostChipView = {
  kind: "action" | "credit";
  amount: number;
  label: string;
};

export type CardCreditCounterVisual = {
  safeAmount: number;
  showCount: boolean;
  iconCount: number;
  iconColumns: number;
};

type StoredCreditCounterType = "power" | "bit";

const STORED_CREDIT_COUNTER_SOURCES: Record<string, { label: string; counter: StoredCreditCounterType }> = {
  "onr_v1_154_broker": { label: "Broker", counter: "power" },
  "onr_v1_178_short-term-contract": { label: "Short-Term Contract", counter: "power" },
  "onr_v1_309_bbs-whispering-campaign": { label: "BBS Whispering Campaign", counter: "bit" },
  "onr_v1_311_braindance-campaign": { label: "Braindance Campaign", counter: "bit" }
};

export function storedCreditSourceLabel(card: Pick<VisibleCard, "definitionId">): string | null {
  return storedCreditCounterSource(card)?.label ?? null;
}

export function storedCreditAmount(card: Pick<VisibleCard, "definitionId" | "counters">): number {
  const source = storedCreditCounterSource(card);
  if (!source) return 0;
  const amount = card.counters?.[source.counter] ?? 0;
  return Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
}

function storedCreditCounterSource(card: Pick<VisibleCard, "definitionId">): { label: string; counter: StoredCreditCounterType } | null {
  return card.definitionId ? STORED_CREDIT_COUNTER_SOURCES[card.definitionId] ?? null : null;
}

export function cardCreditCounterVisual(amount: number): CardCreditCounterVisual {
  const safeAmount = Math.max(0, Math.floor(amount));
  const showCount = safeAmount >= 10;
  const iconCount = showCount ? 1 : Math.min(9, safeAmount);
  const iconColumns = Math.max(1, Math.min(3, iconCount));
  return { safeAmount, showCount, iconCount, iconColumns };
}

export function splitLegalActions(actions: LegalAction[]): { primaryActions: LegalAction[]; contextualActions: LegalAction[] } {
  const primaryActions: LegalAction[] = [];
  const contextualActions: LegalAction[] = [];
  for (const action of actions) {
    if (isContextualLegalAction(action)) contextualActions.push(action);
    else primaryActions.push(action);
  }
  return { primaryActions, contextualActions };
}

export function automaticEndTurnAction(view: PlayerView, actions: LegalAction[], side: Side): LegalAction | undefined {
  if (view.winner || view.pendingChoice || view.activeSide !== side) return undefined;
  const ownActions = actions.filter((action) => action.side === side);
  const endTurn = ownActions.find((action) => action.type === "end_turn");
  if (!endTurn) return undefined;
  return ownActions.every((action) => action.type === "end_turn") ? endTurn : undefined;
}

export function automaticCorpMandatoryDrawAction(view: PlayerView, actions: LegalAction[], side: Side): LegalAction | undefined {
  if (side !== "corp" || view.winner || view.pendingChoice || view.activeSide !== "corp") return undefined;
  const ownActions = actions.filter((action) => action.side === side);
  const mandatoryDraw = ownActions.find((action) => action.type === "mandatory_draw");
  if (!mandatoryDraw) return undefined;
  return ownActions.every((action) => action.type === "mandatory_draw") ? mandatoryDraw : undefined;
}

export function isContextualLegalAction(action: LegalAction): boolean {
  if (action.type === "start_run" && serverRefsForAction(action).length > 0) return true;
  if (action.type === "rez_ice" && cardRefsForAction(action).length > 0 && !action.timingPoint.startsWith("run.")) return true;
  if (action.type === "gain_credit" && cardRefsForAction(action).length > 0 && action.source !== "basic_action" && action.source !== "game_rule") return true;
  if ((action.type === "pump_breaker" || action.type === "break_subroutine") && cardRefsForAction(action).length > 0) return true;
  if (action.type === "trigger_ability" && cardRefsForAction(action).length > 0) return true;
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
      return action.source === "basic_action" ? "Credit nehmen" : normalizeVisibleTerms(action.label);
    case "draw_card":
      return "Karte ziehen";
    case "jack_out":
      return "Run abbrechen (Jack-out)";
    case "decline_rez":
      return "Nicht rezzen";
    case "continue_run":
      return normalizeVisibleTerms(action.label || "Run fortsetzen");
    case "access_card":
      return "Zugriff auf Karte";
    case "decline_trash":
      return "Zugriff abschließen";
    case "advance_card":
      return "Installation ausbauen";
    case "end_turn":
      return "Zug beenden";
    case "resolve_choice":
      return normalizeVisibleTerms(action.label || "Entscheidung bestätigen");
    case "pump_breaker":
      return pumpBreakerActionLabel(action);
    case "break_subroutine":
      return breakSubroutineActionLabel(action);
    case "trigger_ability":
      return triggerAbilityActionLabel(action);
    default:
      return normalizeVisibleTerms(action.label);
  }
}

export function contextualCardActionLabel(action: LegalAction): string {
  switch (action.type) {
    case "gain_credit":
      return scoredAgendaAbilityContextLabel(action) ?? installedCardAbilityContextLabel(action) ?? actionButtonLabel(action);
    case "install_card":
      return installContextLabel(action);
    case "play_event":
      return playEventContextLabel(action);
    case "play_operation":
      return "Spielen";
    case "advance_card":
      return "Ausbauen";
    case "score_agenda":
      return "Scoren";
    case "rez_ice":
      return "Rezzen";
    case "pump_breaker":
      return pumpBreakerActionLabel(action);
    case "break_subroutine":
      return breakSubroutineActionLabel(action);
    case "trash_accessed_card":
    case "trash_resource":
      return "Trashen";
    case "steal_agenda":
      return "Stehlen";
    case "trigger_ability":
      return triggerAbilityActionLabel(action, true);
    default:
      return actionButtonLabel(action);
  }
}

function triggerAbilityActionLabel(action: LegalAction, compact = false): string {
  if (actionHasAbility(action, "self_modifying_code_install_program")) {
    return compact ? "Programm suchen" : "Trashen: Programm aus Stack installieren";
  }
  return withActionCostPrefix(action, resourceAbilityContextLabel(action) ?? normalizeVisibleTerms(action.label));
}

function installedCardAbilityContextLabel(action: LegalAction): string | null {
  if (typeof action.payload?.v1917AssetAbility === "string") {
    switch (action.payload.v1917AssetAbility) {
      case "gain_credits": {
        const amount = Number(action.payload.gainCreditsAmount ?? action.payload.gainedCredits ?? 0);
        return amount > 0 ? `${amount} ${amount === 1 ? "Credit" : "Credits"}` : stripActionSourcePrefix(action.label);
      }
      case "trace_3_tag": {
        const strength = Number(action.payload.traceStrength ?? 3);
        return Number.isFinite(strength) && strength > 0 ? `Trace ${strength} starten` : stripActionSourcePrefix(action.label);
      }
      case "reveal_rd_top":
        return "R&D-Spitze revealn";
      case "reorder_rd_top2":
        return "R&D-Spitze anordnen";
      case "rescheduler_hq_shuffle_draw":
        return "HQ in R&D mischen und ziehen";
      case "meat_damage_1":
        return "1 Meat Damage";
      case "spinn_load_pool": {
        const amount = Number(action.payload.addCounterAmount ?? 6);
        return Number.isFinite(amount) && amount > 0 ? `${amount} Bits laden` : "Bits laden";
      }
      case "trash_installed_runner_card":
      case "remove_virus_counter":
        return stripActionSourcePrefix(action.label);
      default:
        return stripActionSourcePrefix(action.label);
    }
  }
  if (
    action.payload?.v1920AssetAbility ===
    "south_african_mining_corp_gain_6_trash"
  ) {
    const amount = Number(action.payload.gainCreditsAmount ?? action.payload.gainedCredits ?? 6);
    return amount > 0 ? `${amount} ${amount === 1 ? "Credit" : "Credits"} nehmen` : "Credits nehmen";
  }
  return null;
}

function scoredAgendaAbilityContextLabel(action: LegalAction): string | null {
  if (action.payload?.agendaAbility !== "corporate_coup" && action.payload?.agendaAbility !== "political_coup") return null;
  const amount = Number(action.payload.gainCreditsAmount ?? action.payload.gainedCredits ?? 3);
  return amount > 0 ? `${amount} ${amount === 1 ? "Credit" : "Credits"} nehmen` : "Credits nehmen";
}

function stripActionSourcePrefix(label: string): string {
  const stripped = /^[^:]+:\s*(.+)$/.exec(label.trim())?.[1] ?? label;
  return normalizeVisibleTerms(stripped);
}

function resourceAbilityContextLabel(action: LegalAction): string | null {
  if (action.payload?.runnerAbility === "remove_data_raven_counter") return "Raven-Counter entfernen";
  if (action.payload?.shellTradersAbility === "set_aside_from_grip") return "Karte vorbereiten";
  if (action.payload?.shellTradersAbility === "remove_shell_counter") return "Shell-Counter entfernen";
  switch (action.payload?.resourceAbility) {
    case "broker_load_credits":
      return "3 Credits laden";
    case "broker_take_credits": {
      const amount = Number(action.payload.gainCreditsAmount ?? action.payload.gainedCredits ?? 0);
      return amount > 0 ? `${amount} ${amount === 1 ? "Credit" : "Credits"} nehmen` : "Credits nehmen";
    }
    case "short_term_contract_take_credits": {
      const amount = Number(action.payload.gainCreditsAmount ?? action.payload.gainedCredits ?? 2);
      return amount > 0 ? `${amount} ${amount === 1 ? "Credit" : "Credits"} nehmen` : "Credits nehmen";
    }
    default:
      return null;
  }
}

function pumpBreakerActionLabel(action: LegalAction): string {
  const breakerName = breakerNameFromActionLabel(action.label, "pumpen") ?? breakerNameFromActionLabel(action.label, "stärke \\+1");
  const label = breakerName ? `Stärke +1 (${normalizeVisibleTerms(breakerName)})` : "Stärke +1";
  return withActionCostPrefix(action, label);
}

function breakSubroutineActionLabel(action: LegalAction): string {
  const rawIndex = action.payload?.subroutineIndex;
  const hasIndex = typeof rawIndex === "number" && Number.isFinite(rawIndex) && rawIndex >= 0;
  const base = hasIndex ? `Subroutine ${Math.floor(rawIndex) + 1} brechen` : "Subroutine brechen";
  const breakerName = breakerNameFromActionLabel(action.label, "subroutine \\d+ brechen") ?? breakerNameFromActionLabel(action.label, "subroutine brechen");
  const label = breakerName ? `${base} (${normalizeVisibleTerms(breakerName)})` : base;
  return withActionCostPrefix(action, label);
}

function withActionCostPrefix(action: Pick<LegalAction, "costs"> & Partial<Pick<LegalAction, "type" | "payload">>, label: string): string {
  const costLabel = actionCostText(action);
  return costLabel ? `${costLabel} - ${label}` : label;
}

function actionCostText(action: Pick<LegalAction, "costs"> & Partial<Pick<LegalAction, "type" | "payload">>): string | null {
  const chips = actionCostChips(action);
  if (chips.length === 0) return null;
  return chips.map((chip) => chip.label).join(" + ");
}

function breakerNameFromActionLabel(label: string | undefined, actionSuffixPattern: string): string | null {
  if (!label) return null;
  const trimmed = label.trim();
  const prefixed = new RegExp(`^(.+?):\\s*${actionSuffixPattern}$`, "i").exec(trimmed);
  if (prefixed?.[1]) return prefixed[1].trim();
  const trailing = new RegExp(`^(.+)\\s+${actionSuffixPattern}$`, "i").exec(trimmed);
  if (trailing?.[1]) return trailing[1].trim();
  return null;
}

function installContextLabel(action: LegalAction): string {
  const serverId = typeof action.payload?.serverId === "string" ? action.payload.serverId : null;
  const selectedServerId = typeof action.payload?.selectedServerId === "string" ? action.payload.selectedServerId : null;
  if (!serverId && selectedServerId) return `Auf ${serverDisplayLabel(selectedServerId)} ausrichten`;
  if (!serverId) return "Installieren";
  const serverLabel = serverDisplayLabel(serverId);
  if (action.payload?.placement === "ice") return `Vor ${serverLabel}`;
  if (
    action.payload?.placement === "root" &&
    action.payload?.rootReplacement === "asset_to_agenda"
  )
    return `In ${serverLabel} (Node ersetzen)`;
  if (action.payload?.placement === "root") return `In ${serverLabel}`;
  return `Installieren: ${serverLabel}`;
}

function playEventContextLabel(action: LegalAction): string {
  const serverId = typeof action.payload?.serverId === "string" ? action.payload.serverId : null;
  if (!serverId) return "Spielen";
  const serverLabel = serverDisplayLabel(serverId);
  const fullLabel = actionButtonLabel(action);
  if (/\bRun\b/i.test(fullLabel) || /\bDeep Dive\b/i.test(fullLabel)) return `Run auf ${serverLabel}`;
  return `Spielen auf ${serverLabel}`;
}

export function baseActionSlotCapacity(side: Side): number {
  return side === "runner" ? 4 : 3;
}

export function actionSlotDisplay(side: Side, currentClicks: number, displayCapacity: number | undefined, active: boolean): ActionSlotDisplay {
  const available = Math.max(0, Math.floor(currentClicks));
  const baseCapacity = baseActionSlotCapacity(side);
  const shouldShowSlots = active || available > 0;
  const capacity = shouldShowSlots ? Math.max(baseCapacity, Math.floor(displayCapacity ?? baseCapacity), available) : 0;
  const spent = Math.max(0, capacity - available);
  const slots = Array.from({ length: capacity }, (_, index): ActionSlotVisual => {
    return {
      index,
      state: index < spent ? "spent" : "available",
      bonus: index >= baseCapacity
    };
  });
  return {
    label: `${available} ${available === 1 ? "Aktion" : "Aktionen"}`,
    available,
    spent,
    capacity,
    baseCapacity,
    slots
  };
}

export function actionSlotCapacityForTurn(side: Side, currentClicks: number, events: PublicGameEvent[]): number {
  const available = Math.max(0, Math.floor(currentClicks));
  return Math.max(baseActionSlotCapacity(side), available + spentActionClicksThisTurn(side, events));
}

function spentActionClicksThisTurn(side: Side, events: PublicGameEvent[]): number {
  let spent = 0;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    const payload = event?.publicPayload ?? {};
    if (payload.actor !== side) continue;
    if ((payload.actionType ?? event?.type) === "end_turn") break;
    spent += positiveInteger(payload.actionCostClicks);
  }
  return spent;
}

function positiveInteger(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 0;
}

export function actionCostChips(action: Pick<LegalAction, "costs"> & Partial<Pick<LegalAction, "type" | "payload">>): CostChipView[] {
  if (isSelfModifyingCodeAction(action)) return [];
  const totals = action.costs.reduce<{ clicks: number; credits: number }>(
    (acc, cost) => {
      acc.clicks += cost.clicks ?? 0;
      acc.credits += cost.credits ?? 0;
      return acc;
    },
    { clicks: 0, credits: 0 }
  );
  const chips: CostChipView[] = [];
  if (totals.clicks > 0) {
    chips.push({
      kind: "action",
      amount: totals.clicks,
      label: `${totals.clicks} ${totals.clicks === 1 ? "Aktion" : "Aktionen"}`
    });
  }
  if (totals.credits > 0) {
    chips.push({
      kind: "credit",
      amount: totals.credits,
      label: `${totals.credits} ${totals.credits === 1 ? "Credit" : "Credits"}`
    });
  }
  return chips;
}

export function actionConsumesClick(action: Pick<LegalAction, "costs">): boolean {
  return action.costs.some((cost) => positiveInteger(cost.clicks) > 0);
}

export function aiPacingDelayMs(mode: AiPacingTriggerMode, hasPendingCue: boolean, autoDismissMs: number): number | null {
  if (mode === "manual") return null;
  if (!hasPendingCue) return mode === "fast" ? 120 : 650;
  if (autoDismissMs <= 0) return mode === "fast" ? 750 : 900;
  const minimum = mode === "fast" ? 320 : 650;
  return Math.max(autoDismissMs, minimum);
}

export function aiPacingFallbackDelayMs(mode: AiPacingTriggerMode, hasPendingAiCue: boolean): number | null {
  if (hasPendingAiCue) return null;
  if (mode === "manual") return 0;
  return 4000;
}

export function serverBoardRows<T extends { id: string }>(servers: T[], viewerSide: Side): Array<{ kind: "remotes" | "centrals"; servers: T[] }> {
  const centralOrder = new Map([
    ["hq", 0],
    ["rd", 1],
    ["archives", 2]
  ]);
  const central = servers.filter((server) => centralOrder.has(server.id)).sort((left, right) => centralOrder.get(left.id)! - centralOrder.get(right.id)!);
  const remotes = servers.filter((server) => /^remote_\d+$/.test(server.id)).sort((left, right) => remoteNumber(left.id) - remoteNumber(right.id));
  const other = servers.filter((server) => !centralOrder.has(server.id) && !/^remote_\d+$/.test(server.id));
  const centralRow = { kind: "centrals" as const, servers: central };
  const remoteRow = { kind: "remotes" as const, servers: [...remotes, ...other] };
  return viewerSide === "corp" ? [remoteRow, centralRow] : [centralRow, remoteRow];
}

export function normalizeVisibleTerms(value: string): string {
  return value
    .replace(/\bKarte accessen\b/gi, "Zugriff auf Karte")
    .replace(/\bWeiter accessen\b/gi, "Weiter zugreifen")
    .replace(/\bAccess abschließen\b/g, "Zugriff abschließen")
    .replace(/\bR&D\b/g, "R&D")
    .replace(/\bArchives\b/g, "Archive")
    .replace(/\bRemote\s+(\d+)\b/g, "Fort $1")
    .replace(/\bneuem Remote\b/g, "neuem Fort")
    .replace(/\bApproach\b/g, "Annäherung")
    .replace(/\bEncounter\b/g, "Begegnung")
    .replace(/\bAccess\b/g, "Zugriff")
    .replace(/\bBreach\b/g, "Zugriffsphase")
    .replace(/\bBreak\b/g, "Brechen");
}

export function serverDisplayLabel(serverIdOrLabel: string): string {
  if (serverIdOrLabel === "hq" || serverIdOrLabel === "HQ") return "HQ";
  if (serverIdOrLabel === "rd" || serverIdOrLabel === "R&D") return "R&D";
  if (serverIdOrLabel === "archives" || serverIdOrLabel === "Archives") return "Archive";
  if (serverIdOrLabel === "new_remote") return "neuem Fort";
  const remote = /^remote_(\d+)$/.exec(serverIdOrLabel);
  if (remote?.[1]) return `Fort ${remote[1]}`;
  return normalizeVisibleTerms(serverIdOrLabel);
}

export function accessRevealStatusLabel(card: Pick<VisibleCard, "type" | "trashCost">, actions: LegalAction[], actorSide: Side, viewerSide: Side, serverLabel: string): string {
  const fromArchives = serverDisplayLabel(serverLabel) === "Archive";
  if (actorSide !== viewerSide) return observedAccessStatusLabel(card, actorSide, fromArchives);
  if (actions.some((action) => action.type === "steal_agenda")) return "Diese Agenda kann jetzt gestohlen werden.";
  if (fromArchives && (card.type === "asset" || card.type === "upgrade")) {
    return "Diese Karte liegt bereits im Archiv. Sie kann beim Archivzugriff nicht noch einmal getrasht werden. Du kannst weiter zugreifen oder den Zugriff abschließen.";
  }
  if (actions.some((action) => action.type === "trash_accessed_card")) return "Du kannst diese Karte jetzt trashen oder den Zugriff abschließen.";
  if (actions.some((action) => action.type === "access_card")) return "Der Zugriff auf diese Karte ist abgeschlossen. Du kannst direkt zur nächsten Karte weitergehen.";
  if (card.type === "asset" || card.type === "upgrade") return "Du hast aktuell nicht genug Credits, um die Trash-Kosten zu bezahlen. Du kannst den Zugriff abschließen.";
  if (actions.some((action) => action.type === "decline_trash")) return "Diese Karte hat keine Trash-Kosten. Du kannst den Zugriff abschließen.";
  return "Diese Karte hat keine Trash-Kosten. Der Zugriff ist abgeschlossen.";
}

export function retainedAccessRevealEvent(events: PublicGameEvent[], dismissedEventId: string | null): PublicGameEvent | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event || event.eventId === dismissedEventId) return null;
    if (event.publicPayload.actionType !== "access_card") continue;
    if (typeof event.publicPayload.cardDefinitionId !== "string") continue;
    if (typeof event.publicPayload.title !== "string") continue;
    return event;
  }
  return null;
}

function observedAccessStatusLabel(card: Pick<VisibleCard, "type" | "trashCost">, actorSide: Side, fromArchives: boolean): string {
  const subject = actorSide === "corp" ? "Die Korp" : "Der Runner";
  if (card.type === "agenda") return `${subject} kann diese Agenda jetzt stehlen.`;
  if (fromArchives && (card.type === "asset" || card.type === "upgrade")) return `${subject} hat diese Karte im Archiv gesehen; sie kann dort nicht erneut getrasht werden.`;
  if ((card.type === "asset" || card.type === "upgrade") && typeof card.trashCost === "number") return `${subject} entscheidet jetzt, ob diese Karte getrasht oder liegen gelassen wird.`;
  return `${subject} hat diese Karte gesehen; der Zugriff ist abgeschlossen.`;
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

export function shouldUseCardChoicePanel(choice: NonNullable<PlayerView["pendingChoice"]>): boolean {
  if (choice.kind !== "select_cards") return false;
  if (choice.stackSearchResolution || choice.source.includes("search_stack")) return true;
  if (choice.options.some((option) => option.card)) return true;
  const minSelections = Math.max(0, Math.floor(choice.minSelections));
  const maxSelections = Math.max(minSelections, Math.floor(choice.maxSelections));
  return minSelections !== 1 || maxSelections !== 1;
}

export function breachProgressLabel(view: PlayerView): string | null {
  const breach = view.run?.breach;
  if (!breach) return null;
  const current = breach.currentIndex + 1;
  const knownTotal = breach.completed ? breach.currentIndex + 1 : breach.currentIndex + 1 + breach.remainingCount;
  return `Zugriff ${current} von ${Math.max(current, knownTotal)}`;
}

export function activeRunIceInstanceId(view: PlayerView): string | null {
  const run = view.run;
  if (!run) return null;
  if (run.encounteredIce?.instanceId) return run.encounteredIce.instanceId;
  if (run.position?.kind !== "ice") return null;
  const server = view.servers.find((candidate) => candidate.id === run.position?.serverId);
  return server?.ice[run.position.iceIndex]?.instanceId ?? null;
}

export function runCurrentIceLabel(view: PlayerView): string | null {
  const position = view.run?.position;
  if (position?.kind !== "ice") return null;
  return `ICE ${position.iceIndex + 1}`;
}

function runCurrentIceTargetLabel(view: PlayerView): string | null {
  const iceLabel = runCurrentIceLabel(view);
  const title = view.run?.encounteredIce?.known === false ? null : view.run?.encounteredIce?.title;
  if (title && iceLabel) return `${title} (${iceLabel})`;
  return title ?? iceLabel;
}

export function runPositionStatusLabel(view: PlayerView): string | null {
  const run = view.run;
  if (!run?.position) return null;
  if (run.position.kind === "server") {
    if (run.phase === "access") return "Aktuell: Zugriff auf den Server";
    return "Aktuell: vor dem Zugriff auf den Server";
  }
  const server = view.servers.find((candidate) => candidate.id === run.position?.serverId);
  const total = Math.max(run.position.iceIndex + 1, server?.ice.length ?? 0);
  const approachNumber = Math.max(1, total - run.position.iceIndex);
  const iceLabel = `ICE ${run.position.iceIndex + 1} (${approachNumber} von ${total})`;
  if (run.phase === "encounter_ice") return `Aktuell: Begegnung mit ${iceLabel}`;
  if (run.phase === "approach_ice") return `Aktuell: Annäherung an ${iceLabel}`;
  return `Aktuell: vor ${iceLabel}`;
}

export function runWindowStatusLabel(view: PlayerView): string | null {
  const run = view.run;
  const position = run?.position;
  if (!run || !position) return null;
  if (position.kind === "server") return run.phase === "access" ? "Serverzugriff" : "Vor dem Zugriff";
  const server = view.servers.find((candidate) => candidate.id === position.serverId);
  const total = Math.max(position.iceIndex + 1, server?.ice.length ?? 0);
  const approachNumber = Math.max(1, total - position.iceIndex);
  return `ICE ${position.iceIndex + 1} (${approachNumber} von ${total})`;
}

export function runAwareActionButtonLabel(view: PlayerView, action: LegalAction): string {
  const base = actionButtonLabel(action);
  if (!view.run) return base;
  const iceLabel = runCurrentIceLabel(view);
  if (action.type === "jack_out") {
    return iceLabel ? `Run abbrechen an ${iceLabel}` : "Run abbrechen vor Zugriff";
  }
  if (action.type === "continue_run") {
    if (action.payload?.encounterContinue === true) {
      if (base === "ICE passieren" && iceLabel) return `${iceLabel} passieren`;
      return iceLabel ? `${base} an ${iceLabel}` : base;
    }
    if (view.run.phase === "movement") return iceLabel ? `Run fortsetzen zu ${iceLabel}` : "Run fortsetzen zum Zugriff";
    if (view.run.phase === "approach_ice" && iceLabel) return `Annäherung an ${iceLabel} fortsetzen`;
  }
  if ((action.type === "pump_breaker" || action.type === "break_subroutine") && iceLabel && action.payload?.iceId === activeRunIceInstanceId(view)) {
    return `${base} gegen ${runCurrentIceTargetLabel(view) ?? iceLabel}`;
  }
  return base;
}

export function runWindowActions(view: PlayerView, actions: LegalAction[]): LegalAction[] {
  if (!view.run) return [];
  return actions.filter((action) => {
    if (action.type === "access_card") return true;
    if (!action.timingPoint.startsWith("run.")) return false;
    if (action.type === "jack_out" || action.type === "continue_run" || action.type === "rez_ice" || action.type === "decline_rez") return true;
    if (action.type === "pump_breaker" || action.type === "break_subroutine") return action.payload?.iceId === activeRunIceInstanceId(view);
    return isRunWindowTriggerAction(action);
  });
}

export function runWindowActionButtonLabel(view: PlayerView, action: LegalAction): string {
  if (isSelfModifyingCodeAction(action)) {
    return `${sourceCardTitleForAction(view, action) ?? "Self-Modifying Code"} trashen: Programm suchen`;
  }
  return runAwareActionButtonLabel(view, action);
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

export function runnerRigMemorySummary(view: PlayerView, owner: "own" | "opponent"): { used: number; limit: number; text: string; ariaLabel: string } | null {
  const source = owner === "own" ? view.own : view.opponent;
  if (typeof source.memoryUsed !== "number" || typeof source.memoryLimit !== "number") return null;
  return {
    used: source.memoryUsed,
    limit: source.memoryLimit,
    text: `${source.memoryUsed}/${source.memoryLimit}`,
    ariaLabel: `MU ${source.memoryUsed} von ${source.memoryLimit}`
  };
}

export function corpInstalledCardState(card: VisibleCard): "hidden" | "unrezzed" | "rezzed" | "known" {
  if (!card.known) return "hidden";
  if (card.rezzed === false) return "unrezzed";
  if (card.rezzed === true) return "rezzed";
  return "known";
}

export function showInstalledCorpState(serverId: PlayerView["servers"][number]["id"], laneKind: "ice" | "root"): boolean {
  if (laneKind === "ice") return true;
  return serverId !== "archives";
}

export function splitArchiveCardsForDisplay(
  viewerSide: Side,
  cards: VisibleCard[],
  totalArchivesCount: number
): { faceupCards: VisibleCard[]; facedownCount: number } {
  if (viewerSide === "runner") {
    const faceupCards = cards.filter((card) => card.known);
    return {
      faceupCards,
      facedownCount: Math.max(0, totalArchivesCount - faceupCards.length)
    };
  }

  const faceupCards = cards.filter((card) => card.rezzed === true);
  return {
    faceupCards,
    facedownCount: Math.max(0, totalArchivesCount - faceupCards.length)
  };
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

function isSelfModifyingCodeAction(action: Partial<Pick<LegalAction, "type" | "payload">>): boolean {
  return action.type === "trigger_ability" && actionHasAbility(action, "self_modifying_code_install_program");
}

function isStartupImmolatorAction(action: Partial<Pick<LegalAction, "type" | "payload">>): boolean {
  return action.type === "trigger_ability" && actionHasAbility(action, "startup_immolator_trash_ice");
}

function isRunWindowTriggerAction(action: Partial<Pick<LegalAction, "type" | "payload">>): boolean {
  return isSelfModifyingCodeAction(action) || isStartupImmolatorAction(action);
}

function sourceCardTitleForAction(view: PlayerView, action: LegalAction): string | null {
  const sourceId = action.abilityRef?.sourceCardInstanceId ?? (action.source !== "basic_action" && action.source !== "game_rule" ? action.source : undefined);
  if (!sourceId) return null;
  const sourceCard = visibleActionCards(view).find((card) => card.instanceId === sourceId);
  return sourceCard?.known ? sourceCard.title ?? null : null;
}

function cardRefsForAction(action: LegalAction): string[] {
  const refs = new Set<string>();
  if (action.source !== "basic_action" && action.source !== "game_rule") refs.add(action.source);
  const payload = action.payload ?? {};
  addStringRef(refs, payload.cardId);
  addStringRef(refs, payload.resourceId);
  addStringRef(refs, payload.breakerId);
  if (action.abilityRef?.sourceCardInstanceId) refs.add(action.abilityRef.sourceCardInstanceId);
  if (action.type !== "pump_breaker" && action.type !== "break_subroutine") {
    for (const requirement of action.targetRequirements) {
      if (requirement.sourceIceRef) refs.add(requirement.sourceIceRef);
    }
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

function remoteNumber(serverId: string): number {
  return Number(/^remote_(\d+)$/.exec(serverId)?.[1] ?? Number.MAX_SAFE_INTEGER);
}
