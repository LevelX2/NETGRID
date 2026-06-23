import { DEMO_CARDS_BY_ID, type LegalAction, type PlayerView, type PublicGameEvent, type Side, type VisibleCard } from "@netgrid/shared";
import { actionHasAbility } from "./action-payload";
export {
  DEFAULT_CUE_POSITION,
  clampCuePosition,
  cuePositionClassName,
  cuePositionStyle,
  normalizeCuePositionPreference,
  parseCuePositionPreference,
  serializeCuePositionPreference,
  type CuePositionPreference,
  type CuePositionPreset
} from "../features/actions/cue-position";

export const ACTION_CUE_POSITION_STORAGE_KEY = "netgrid.actionCuePosition.v1";
export const LEGACY_ACTION_CUE_POSITION_STORAGE_KEY = "netgrid.actionCuePosition.v1";

export type ActionContext = {
  kind: "card" | "server";
  id: string;
  label: string;
};

export type InactiveCardZone = "heap" | "archives";

export function inactiveCardZoneBadgeLabel(zone: InactiveCardZone): string {
  return zone === "heap" ? "Heap" : "Archiv";
}

export function inactiveCardZoneAriaSuffix(zone: InactiveCardZone): string {
  return zone === "heap" ? ", im Heap abgelegt" : ", im Archiv abgelegt";
}

export function inactiveCardZoneClassName(zone: InactiveCardZone): string {
  return zone === "heap" ? "inactiveZoneHeap" : "inactiveZoneArchives";
}

const BASE_ACTION_TYPES = new Set<LegalAction["type"]>(["mandatory_draw", "gain_credit", "draw_card", "start_run", "remove_tag", "purge_virus_counters", "purge_runner_virus_counters", "forgo_action", "end_turn"]);
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
  activated_card_ability: "Kartenfähigkeit",
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
  purge_runner_virus_counters: "Virus-Counter",
  forgo_action: "Zug",
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

export type CardCounterBadgeView = {
  amount: number;
  label: string;
  ariaLabel: string;
  shortLabel: string;
  testId: string;
  tooltip: string;
};

export type IdentityCounterChipView = {
  key: string;
  amount: number;
  label: string;
  ariaLabel: string;
  tooltip: string;
};

export type ServerCounterChipView = {
  key: string;
  amount: number;
  label: string;
  ariaLabel: string;
  tooltip: string;
};

export type RunnerProgramInstallTrashChoiceInfo = {
  title: string;
  question: string;
  effectHint: string;
  submitLabel: string;
  canSubmit: boolean;
  requiredMemoryToFree: number;
  selectedMemoryFreed: number;
};

export type FieldCardChoiceInfo = {
  title: string;
  prompt: string;
  counterLabel: string;
  canSubmit: boolean;
  canClear: boolean;
  submitLabel: string;
  clearLabel: string;
};

export type IceModifierBadgeView = {
  key: string;
  shortLabel: string;
  ariaLabel: string;
  tooltip: string;
  testId: string;
};

export type AdvancementCounterDisplay = {
  amount: number;
  ariaLabel: string;
  visibleGemCount: number;
  overflowLabel: string | null;
};

const TESSERACT_FORT_CONSTRUCTION_ID = "onr_v1_370_tesseract-fort-construction";
const PURGEABLE_RUNNER_VIRUS_HELP = "Purgefähig: Die Korp kann alle Runner-Virus-Counter entfernen; danach muss sie ihre nächsten 3 Aktionen aussetzen.";

export function iceModifierBadgesForServer(server: PlayerView["servers"][number]): IceModifierBadgeView[] {
  if (!serverHasRezzedTesseractFortConstruction(server)) return [];
  return [
    {
      key: "tesseract-additional-subroutine",
      shortLabel: "+Sub",
      ariaLabel: "Tesseract Fort Construction: zusätzliche Subroutine auf diesem ICE",
      tooltip: "Tesseract Fort Construction: zusätzliche Subroutine",
      testId: "tesseract-ice-subroutine-badge"
    }
  ];
}

function serverHasRezzedTesseractFortConstruction(server: PlayerView["servers"][number]): boolean {
  return server.root.some((card) => card.known && card.rezzed === true && card.definitionId === TESSERACT_FORT_CONSTRUCTION_ID);
}

export function storedCreditSourceLabel(card: Pick<VisibleCard, "counterDisplays">): string | null {
  const display = counterDisplayById(card, "stored_credits");
  return display?.label ?? null;
}

export function storedCreditAmount(card: Pick<VisibleCard, "counterDisplays">): number {
  const display = counterDisplayById(card, "stored_credits");
  return display ? safeCounterDisplayAmount(display.amount) : 0;
}

export function armoredFridgeAblativeCounterBadge(card: Pick<VisibleCard, "counterDisplays">): CardCounterBadgeView | null {
  const display = counterDisplayById(card, "ablative");
  return display ? counterDisplayBadgeView(display, "ablative-counter-badge") : null;
}

export function counterDisplayById(card: Pick<VisibleCard, "counterDisplays">, id: string): NonNullable<VisibleCard["counterDisplays"]>[number] | null {
  return card.counterDisplays?.find((display) => display.id === id && safeCounterDisplayAmount(display.amount) > 0) ?? null;
}

export function counterDisplayBadgeView(display: NonNullable<VisibleCard["counterDisplays"]>[number], testId: string): CardCounterBadgeView {
  const amount = safeCounterDisplayAmount(display.amount);
  const label = display.label;
  return {
    amount,
    label: `${amount} ${label}`,
    ariaLabel: display.ariaLabel,
    shortLabel: `${amount} ${counterDisplayShortLabel(label)}`,
    testId,
    tooltip: counterDisplayTooltipText(display)
  };
}

export function counterDisplayTooltipText(display: NonNullable<VisibleCard["counterDisplays"]>[number]): string {
  const amount = safeCounterDisplayAmount(display.amount);
  const countLabel = `${amount} ${counterDisplayShortLabel(display.label)}`;
  switch (display.counterType) {
    case "cockroach":
      return amount >= 2
        ? `Cockroach: ${amount} Cockroach-Counter machen HQ-Discards zufällig. Diese Cockroach-Counter zählen als Virus-Counter, weil Cockroach ein Programm-Virus ist, und werden durch Virus-Purge entfernt.`
        : `Cockroach: Ab 2 Cockroach-Countern werden HQ-Discards zufällig. Diese Cockroach-Counter zählen als Virus-Counter, weil Cockroach ein Programm-Virus ist, und werden durch Virus-Purge entfernt.`;
    case "cascade":
      return amount >= 2
        ? `Cascade: Je 2 Cascade-Counter zwingen die Korp zu Beginn ihres Zugs, 1 offene Karte aus R&D ins Archiv zu legen. Aktuell sind das ${Math.floor(amount / 2)} ${Math.floor(amount / 2) === 1 ? "Karte" : "Karten"}. ${PURGEABLE_RUNNER_VIRUS_HELP}`
        : `Cascade: Ab 2 Cascade-Countern muss die Korp zu Beginn ihres Zugs 1 offene Karte aus R&D ins Archiv legen. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    case "doom":
      return `Armageddon: Bei jeder Korp-Installation wird pro Doom-Counter ein Würfel geworfen. Jede 6 trasht die installierte Karte und entfernt 1 Doom-Counter. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    case "crumble":
      return amount >= 2
        ? `Crumble: ${countLabel} erlauben dem Runner, Karten beim HQ-Zugriff kostenlos zu trashen, auch wenn sie normalerweise nicht trashbar sind. ${PURGEABLE_RUNNER_VIRUS_HELP}`
        : `Crumble: Ab 2 Crumble-Countern darf der Runner Karten beim HQ-Zugriff kostenlos trashen. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    case "garbage":
      return amount >= 2
        ? `Garbage In: ${countLabel} erlauben dem Runner, Karten beim R&D-Zugriff kostenlos zu trashen, auch wenn sie normalerweise nicht trashbar sind. Wenn das genutzt wird, verliert die Korp 2 Garbage-Counter. ${PURGEABLE_RUNNER_VIRUS_HELP}`
        : `Garbage In: Ab 2 Garbage-Countern darf der Runner Karten beim R&D-Zugriff kostenlos trashen. Wenn das genutzt wird, verliert die Korp 2 Garbage-Counter. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    case "highlighter": {
      const bonus = Math.max(0, amount - 1);
      return bonus > 0
        ? `Highlighter: ${countLabel} geben dem Runner ${bonus} zusätzliche ${bonus === 1 ? "R&D-Karte" : "R&D-Karten"} beim Zugriff auf R&D. ${PURGEABLE_RUNNER_VIRUS_HELP}`
        : `Highlighter: Jeder Highlighter-Counter nach dem ersten gibt dem Runner 1 zusätzlichen R&D-Zugriff. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    }
    case "scaldan":
      return `Scaldan: Zu Beginn jedes Korp-Zugs wird pro Scaldan-Counter gewürfelt. Bei 5 oder 6 erhält die Korp 1 Bad Publicity. Bei 7 Bad Publicity verliert die Korp. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    case "tax": {
      const loss = Math.floor(amount / 2);
      return loss > 0
        ? `Taxman: ${countLabel} lassen die Korp zu Beginn ihres Zugs ${loss} ${loss === 1 ? "Credit" : "Credits"} verlieren. ${PURGEABLE_RUNNER_VIRUS_HELP}`
        : `Taxman: Je 2 Tax-Counter verliert die Korp zu Beginn ihres Zugs 1 Credit. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    }
    case "vienna":
      return `Vienna 22: ${countLabel} geben dem Runner ${amount} zusätzliche ${amount === 1 ? "HQ-Karte" : "HQ-Karten"} beim Zugriff auf HQ. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    case "socket_archives":
      return `Viral Pipeline: Socket-Counter auf Archives. Sobald je 1 Socket auf Archives, HQ und R&D liegt, werden diese drei Socket-Counter in 1 Pipe-Counter umgewandelt. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    case "socket_hq":
      return `Viral Pipeline: Socket-Counter auf HQ. Sobald je 1 Socket auf Archives, HQ und R&D liegt, werden diese drei Socket-Counter in 1 Pipe-Counter umgewandelt. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    case "socket_rd":
      return `Viral Pipeline: Socket-Counter auf R&D. Sobald je 1 Socket auf Archives, HQ und R&D liegt, werden diese drei Socket-Counter in 1 Pipe-Counter umgewandelt. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    case "pipe":
      return `Viral Pipeline: Zu Beginn jedes Korp-Zugs muss die Korp pro Pipe-Counter 1 Aktion aussetzen. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
    case "spy":
      return "I Spy: Solange der Spy-Counter auf diesem Fort liegt, bleiben alle installierten Korp-Karten in oder auf diesem Fort für den Runner sichtbar. Die Korp kann 1 Aktion nehmen und 4 Credits zahlen, um 1 Spy-Counter zu entfernen.";
    case "doppelganger_antibody":
      return `Doppelganger Antibody: Zu Beginn jedes Runner-Zugs verliert der Runner pro Doppelganger-Counter 1 Credit. Der Runner kann 1 Aktion nehmen und 4 Credits zahlen, um 1 Doppelganger-Counter zu entfernen.`;
    case "pattel_antibody":
      return `Pattel Antibody: Jeder Pattel-Counter auf einem Icebreaker reduziert dessen Stärke um 1.`;
    case "mark":
      if (display.id === "ice_transmutation")
        return `Ice Transmutation: Das gewählte ICE hat +1 Stärke. Jede Subroutine wird direkt nach ihrem ursprünglichen Platz einmal zusätzlich ausgeführt.`;
      return display.ariaLabel;
    case "bad_publicity":
      return `Bad Publicity: Jede Bad Publicity gibt dem Runner zu Beginn eines Runs 1 temporären Credit. Bei 7 Bad Publicity verliert die Korp.`;
    case "install_cost_modifier":
      if (display.id.startsWith("restrictive_net_zoning_install_cost_")) {
        return `Restrictive Net Zoning: Die Korp muss ${amount} zusätzliche ${amount === 1 ? "Credit" : "Credits"} zahlen, um ICE vor diesem Fort zu installieren.`;
      }
      return display.ariaLabel;
    default:
      if (display.id === "pox")
        return `Pox: Je 2 Pox-Counter in diesem Fort erhöhen die Korp-Installationskosten in oder auf diesem Fort um 1 Credit. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
      if (display.id === "skivviss")
        return `Skivviss: Jeder Skivviss-Counter lässt die Korp zu Beginn ihres Zugs 1 zusätzliche Karte ziehen. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
      if (display.counterType === "virus")
        return `Virus-Counter: Kartenabhängiger Virus-Counter. Die konkrete Wirkung steht auf der Karte oder im aktuellen Run-Kontext. ${PURGEABLE_RUNNER_VIRUS_HELP}`;
      return display.ariaLabel;
  }
}

export function counterDisplaysForRendering(card: Pick<VisibleCard, "counterDisplays">): NonNullable<VisibleCard["counterDisplays"]> {
  return (card.counterDisplays ?? []).filter(
    (display) =>
      display.displayKind !== "advancement" &&
      safeCounterDisplayAmount(display.amount) > 0,
  );
}

export function selectedSubtypeDetailLabel(card: Pick<VisibleCard, "selectedSubtypeLabel">): string | null {
  if (!card.selectedSubtypeLabel) return null;
  return `Gewählter Typ: ${card.selectedSubtypeLabel}`;
}

export function selectedTargetDetailLabel(card: Pick<VisibleCard, "selectedTargetLabel">): string | null {
  if (!card.selectedTargetLabel) return null;
  return `Ziel-ICE: ${card.selectedTargetLabel}`;
}

export function hostedOnDetailLabel(card: Pick<VisibleCard, "hostedOnLabel">): string | null {
  if (!card.hostedOnLabel) return null;
  return `Gehostet auf: ${card.hostedOnLabel}`;
}

export function identityCounterChipsForDisplays(counterDisplays: VisibleCard["counterDisplays"]): IdentityCounterChipView[] {
  return (counterDisplays ?? [])
    .filter(
      (display) =>
        display.displayKind !== "advancement" &&
        safeCounterDisplayAmount(display.amount) > 0,
    )
    .map((display) => ({
      key: display.id,
      amount: safeCounterDisplayAmount(display.amount),
      label: counterDisplayShortLabel(display.label),
      ariaLabel: display.ariaLabel,
      tooltip: counterDisplayTooltipText(display),
    }));
}

export function serverCounterChipsForDisplays(counterDisplays: VisibleCard["counterDisplays"]): ServerCounterChipView[] {
  return (counterDisplays ?? [])
    .filter(
      (display) =>
        display.displayKind !== "advancement" &&
        safeCounterDisplayAmount(display.amount) > 0,
    )
    .map((display) => ({
      key: display.id,
      amount: safeCounterDisplayAmount(display.amount),
      label: serverCounterChipLabel(display),
      ariaLabel: display.ariaLabel,
      tooltip: counterDisplayTooltipText(display),
    }));
}

export function safeCounterDisplayAmount(amount: number): number {
  return Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
}

function counterDisplayShortLabel(label: string): string {
  return label.replace(/-Counter$/u, "").replace(/\s+Counter$/u, "");
}

function serverCounterChipLabel(display: NonNullable<VisibleCard["counterDisplays"]>[number]): string {
  if (
    display.counterType === "socket_archives" ||
    display.counterType === "socket_hq" ||
    display.counterType === "socket_rd"
  ) {
    return "Socket";
  }
  return counterDisplayShortLabel(display.label)
    .replace(/\s+(Archives|HQ|R&D)$/u, "")
    .trim();
}

export function advancementCounterDisplay(card: Pick<VisibleCard, "known" | "advancementCounters">): AdvancementCounterDisplay | null {
  const amount = card.advancementCounters ?? 0;
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  if (safeAmount <= 0) return null;
  const hiddenCard = card.known === false;
  const showCount = safeAmount >= 10;
  const visibleGemCount = showCount ? 1 : Math.min(safeAmount, 9);
  return {
    amount: safeAmount,
    ariaLabel: hiddenCard
      ? `${safeAmount} öffentliche Advancement-Counter`
      : `${safeAmount} ${safeAmount === 1 ? "Entwicklung" : "Entwicklungen"}`,
    visibleGemCount,
    overflowLabel: showCount ? String(safeAmount) : null
  };
}

export function cardCreditCounterVisual(amount: number): CardCreditCounterVisual {
  const safeAmount = Math.max(0, Math.floor(amount));
  const showCount = safeAmount >= 10;
  const iconCount = showCount ? 1 : Math.min(9, safeAmount);
  const iconColumns = Math.max(1, Math.min(3, iconCount));
  return { safeAmount, showCount, iconCount, iconColumns };
}

export function counterDisplayUsesCreditBadge(display: NonNullable<VisibleCard["counterDisplays"]>[number]): boolean {
  return (
    display.creditPool !== undefined ||
    (display.displayKind === "restricted_pool" && display.counterType === "bit")
  );
}

export function counterDisplayUsesRefreshingCreditBadge(display: NonNullable<VisibleCard["counterDisplays"]>[number]): boolean {
  return display.creditPool?.refresh !== undefined || display.displayKind === "recurring_credit";
}

export function splitLegalActions(actions: LegalAction[]): { primaryActions: LegalAction[]; contextualActions: LegalAction[] } {
  const primaryActions: LegalAction[] = [];
  const contextualActions: LegalAction[] = [];
  for (const action of actions) {
    if (isContextualLegalAction(action)) {
      if (!hasSelectableActionContext(action)) {
        warnContextlessLegalAction(action);
        primaryActions.push(action);
      } else {
        contextualActions.push(action);
      }
    } else {
      primaryActions.push(action);
    }
  }
  return { primaryActions, contextualActions };
}

function hasSelectableActionContext(action: LegalAction): boolean {
  return cardRefsForAction(action).length > 0 || serverRefsForAction(action).length > 0;
}

function warnContextlessLegalAction(action: LegalAction): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn("NETGRID legal action was classified as contextual without a selectable context; keeping it visible as a primary action.", {
    actionId: action.actionId,
    type: action.type,
    source: action.source,
    timingPoint: action.timingPoint,
    label: action.label
  });
}

export function automaticEndTurnAction(view: PlayerView, actions: LegalAction[], side: Side, options: { accessRevealVisible?: boolean } = {}): LegalAction | undefined {
  if (options.accessRevealVisible) return undefined;
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
  if (action.type === "start_run" && action.payload?.bonusRunNoClick === true) return false;
  if (action.type === "start_run" && serverRefsForAction(action).length > 0) return true;
  if (action.type === "rez_ice" && cardRefsForAction(action).length > 0 && !action.timingPoint.startsWith("run.")) return true;
  if (action.type === "activated_card_ability" && cardRefsForAction(action).length > 0) return true;
  if (action.type === "gain_credit" && cardRefsForAction(action).length > 0 && action.source !== "basic_action" && action.source !== "game_rule") return true;
  if ((action.type === "pump_breaker" || action.type === "break_subroutine") && cardRefsForAction(action).length > 0) return true;
  if (isApproachIceExposeAction(action)) return false;
  if (isRemoveSpyCounterAction(action)) return false;
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
      return action.payload?.citySurveillanceDrawDecision
        ? normalizeVisibleTerms(action.label)
        : "Karte ziehen";
    case "activated_card_ability":
      return normalizeVisibleTerms(action.label || "Kartenfähigkeit nutzen");
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
      return scoredAgendaAbilityContextLabel(action) ?? installedCardAbilityContextLabel(action) ?? cardContextFallbackLabel(action);
    case "activated_card_ability":
      return cardContextFallbackLabel(action);
    case "install_card":
      return installContextLabel(action);
    case "play_event":
      return playEventContextLabel(action);
    case "start_run":
      return cardContextFallbackLabel(action);
    case "play_operation":
      return "Spielen";
    case "advance_card":
      return "Ausbauen";
    case "score_agenda":
      return scoreAgendaContextLabel(action);
    case "rez_ice":
      return "Rezzen";
    case "pump_breaker":
      return stripTrailingActionSourceParenthetical(pumpBreakerActionLabel(action));
    case "break_subroutine":
      return stripTrailingActionSourceParenthetical(breakSubroutineActionLabel(action));
    case "trash_accessed_card":
    case "trash_resource":
      return "Trashen";
    case "steal_agenda":
      return "Stehlen";
    case "trigger_ability":
      return triggerAbilityActionLabel(action, true);
    default:
      return cardContextFallbackLabel(action);
  }
}

export function orderedCardContextActions(actions: LegalAction[]): LegalAction[] {
  return actions
    .map((action, index) => ({ action, index }))
    .sort((left, right) => {
      const leftNewRemoteInstall = isNewRemoteInstallAction(left.action) ? 1 : 0;
      const rightNewRemoteInstall = isNewRemoteInstallAction(right.action) ? 1 : 0;
      return leftNewRemoteInstall - rightNewRemoteInstall || left.index - right.index;
    })
    .map(({ action }) => action);
}

function triggerAbilityActionLabel(action: LegalAction, compact = false): string {
  if (actionHasAbility(action, "self_modifying_code_install_program")) {
    return compact ? "Programm suchen" : "Trashen: Programm aus Stack installieren";
  }
  if (isApproachIceExposeAction(action)) {
    return approachIceExposeActionLabel(action);
  }
  return resourceAbilityContextLabel(action) ?? (compact ? cardContextFallbackLabel(action) : normalizeVisibleTerms(action.label));
}

function approachIceExposeActionLabel(action: LegalAction): string {
  const normalizedLabel = normalizeVisibleTerms(action.label);
  const sourceTitle = /^([^:]+):/.exec(normalizedLabel)?.[1]?.trim();
  const prefix = sourceTitle ? `${sourceTitle}: ` : "";
  if (action.payload?.approachIceExposeViewDecision === "finish")
    return `${prefix}Ansehen beenden`;
  return action.payload?.approachIceExposeDecision === "decline"
    ? `${prefix}Ansehen überspringen`
    : `${prefix}ICE ansehen`;
}

function installedCardAbilityContextLabel(action: LegalAction): string | null {
  if (typeof action.payload?.v1911HiddenZoneAbility === "string") {
    return stripActionSourcePrefix(action.label);
  }
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

function cardContextFallbackLabel(action: LegalAction): string {
  return stripActionSourcePrefix(action.label || actionButtonLabel(action));
}

function stripTrailingActionSourceParenthetical(label: string): string {
  return normalizeVisibleTerms(label.replace(/\s+\([^)]*\)\s*$/u, "").trim());
}

function resourceAbilityContextLabel(action: LegalAction): string | null {
  if (action.payload?.runnerAbility === "remove_data_raven_counter") return "Raven-Counter entfernen";
  if (action.payload?.shellTradersAbility === "set_aside_from_grip") {
    const targetTitle = shellTradersTargetTitle(action);
    return targetTitle ? `${targetTitle} zur Seite legen` : "Karte zur Seite legen";
  }
  if (action.payload?.shellTradersAbility === "remove_shell_counter") {
    const targetTitle = shellTradersTargetTitle(action);
    return targetTitle ? `Shell-Counter von ${targetTitle} entfernen` : "Shell-Counter entfernen";
  }
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
    case "junkyard_bbs_return_top_heap": {
      const targetTitle = targetTitleFromDefinition(action);
      return targetTitle ? `${targetTitle} aus dem Heap auf die Hand nehmen` : "Oberste Heap-Karte auf die Hand nehmen";
    }
    default:
      return null;
  }
}

function targetTitleFromDefinition(action: LegalAction): string | null {
  const targetDefinitionId = typeof action.payload?.targetCardDefinitionId === "string" ? action.payload.targetCardDefinitionId : undefined;
  return targetDefinitionId ? DEMO_CARDS_BY_ID[targetDefinitionId]?.title ?? null : null;
}

function shellTradersTargetTitle(action: LegalAction): string | null {
  const titleFromDefinition = targetTitleFromDefinition(action);
  if (titleFromDefinition) return titleFromDefinition;
  if (action.payload?.shellTradersAbility === "set_aside_from_grip") {
    const labelTarget = /^The Shell Traders:\s*(.+?)\s+(?:vorbereiten|beiseitelegen|zur Seite legen)$/i.exec(action.label.trim())?.[1]?.trim();
    if (labelTarget) return normalizeVisibleTerms(labelTarget);
  }
  return null;
}

function pumpBreakerActionLabel(action: LegalAction): string {
  const breakerName = breakerNameFromActionLabel(action.label, "pumpen") ?? breakerNameFromActionLabel(action.label, "stärke \\+1");
  return breakerName ? `Stärke +1 (${normalizeVisibleTerms(breakerName)})` : "Stärke +1";
}

function breakSubroutineActionLabel(action: LegalAction): string {
  const rawIndex = action.payload?.subroutineIndex;
  const hasIndex = typeof rawIndex === "number" && Number.isFinite(rawIndex) && rawIndex >= 0;
  const base = hasIndex ? `Subroutine ${Math.floor(rawIndex) + 1} brechen` : "Subroutine brechen";
  const breakerName = breakerNameFromActionLabel(action.label, "subroutine \\d+ brechen") ?? breakerNameFromActionLabel(action.label, "subroutine brechen");
  return breakerName ? `${base} (${normalizeVisibleTerms(breakerName)})` : base;
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
  if (action.payload?.runnerProgramTrashBeforeInstall === true) return "Mit Programmtrash installieren";
  if (!serverId && selectedServerId) return `Auf ${serverDisplayLabel(selectedServerId)} ausrichten`;
  if (!serverId) return "Installieren";
  if (isNewRemoteInstallAction(action)) return "Neues Remote erstellen";
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

function isNewRemoteInstallAction(action: Pick<LegalAction, "type" | "payload">): boolean {
  return action.type === "install_card" && action.payload?.serverId === "new_remote";
}

function playEventContextLabel(action: LegalAction): string {
  const serverId = typeof action.payload?.serverId === "string" ? action.payload.serverId : null;
  if (!serverId) return "Spielen";
  const serverLabel = serverDisplayLabel(serverId);
  const fullLabel = actionButtonLabel(action);
  if (action.payload?.runnerEventRun === true || /\bRun\b/i.test(fullLabel) || /\bDeep Dive\b/i.test(fullLabel))
    return `Run auf ${serverLabel}`;
  return `Spielen auf ${serverLabel}`;
}

function scoreAgendaContextLabel(action: LegalAction): string {
  const selectedServerLabel =
    typeof action.payload?.selectedServerLabel === "string"
      ? action.payload.selectedServerLabel
      : typeof action.payload?.selectedServerId === "string"
        ? serverDisplayLabel(action.payload.selectedServerId)
        : null;
  return selectedServerLabel ? `Scoren: ${selectedServerLabel} wählen` : "Scoren";
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
  if (serverIdOrLabel === "new_remote") return "neuem Remote";
  const remote = /^remote_(\d+)$/.exec(serverIdOrLabel);
  if (remote?.[1]) return `Remote ${remote[1]}`;
  return normalizeVisibleTerms(serverIdOrLabel);
}

export function accessRevealStatusLabel(card: Pick<VisibleCard, "type" | "trashCost">, actions: LegalAction[], actorSide: Side, viewerSide: Side, serverLabel: string): string {
  const fromArchives = serverDisplayLabel(serverLabel) === "Archive";
  const withServer = (status: string) => `${accessServerStatusPrefix(serverLabel)}: ${status}`;
  if (actorSide !== viewerSide) return withServer(observedAccessStatusLabel(card, actorSide, fromArchives));
  const stealCostStatus = accessRevealStealCostStatus(actions);
  if (stealCostStatus) return withServer(stealCostStatus);
  if (actions.some((action) => action.type === "steal_agenda")) return withServer("Diese Agenda kann jetzt gestohlen werden.");
  if (fromArchives && (card.type === "asset" || card.type === "upgrade")) {
    return withServer("Du hast diese Karte im Archiv gesehen. Du kannst weiter zugreifen oder den Zugriff abschließen.");
  }
  const freeTrashSource = accessFreeTrashSourceLabel(actions);
  if (freeTrashSource)
    return withServer(`${freeTrashSource}: Du kannst diese Karte kostenlos trashen, auch wenn sie normalerweise keine Trash-Kosten hat.`);
  if (actions.some((action) => action.type === "trash_accessed_card")) return withServer("Du kannst diese Karte jetzt trashen oder den Zugriff abschließen.");
  if (actions.some((action) => action.type === "access_card")) return withServer("Der Zugriff auf diese Karte ist abgeschlossen. Du kannst direkt zur nächsten Karte weitergehen.");
  if (actions.length === 0) {
    if (serverDisplayLabel(serverLabel) === "R&D") return withServer("Angezeigte Karte aus Research and Development.");
    return withServer("Angezeigte Karte. Du kannst das Fenster schließen.");
  }
  if (card.type === "asset" || card.type === "upgrade") return withServer("Du hast aktuell nicht genug Credits, um die Trash-Kosten zu bezahlen. Du kannst den Zugriff abschließen.");
  if (actions.some((action) => action.type === "decline_trash")) return withServer("Diese Karte hat keine Trash-Kosten. Du kannst den Zugriff abschließen.");
  return withServer("Diese Karte hat keine Trash-Kosten. Der Zugriff ist abgeschlossen.");
}

function accessServerStatusPrefix(serverLabel: string): string {
  const label = serverDisplayLabel(serverLabel);
  return `${label === "Archive" ? "Archiv" : label}-Zugriff`;
}

function accessFreeTrashSourceLabel(actions: LegalAction[]): string | null {
  const freeTrashAction = actions.find(
    (action) =>
      action.type === "trash_accessed_card" &&
      action.payload?.freeAccessTrash === true,
  );
  const counterType = freeTrashAction?.payload?.proteusRunnerVirusFreeTrashCounterType;
  if (counterType === "garbage") return "Garbage In";
  if (counterType === "crumble") return "Crumble";
  if (freeTrashAction) return "Gratis-Trash";
  return null;
}

function accessRevealStealCostStatus(actions: LegalAction[]): string | null {
  const stealAction = actions.find((action) => action.type === "steal_agenda");
  const blockedAction = actions.find(
    (action) => action.type === "decline_trash" && action.payload?.stealBlockedByCost === true,
  );
  const sourceAction = stealAction ?? blockedAction;
  if (!sourceAction) return null;
  const additionalCost = positiveInteger(sourceAction.payload?.stealAdditionalCost) || positiveInteger(sourceAction.payload?.stealCost);
  if (additionalCost <= 0) return null;
  const sourceLabel = stealCostSourceLabel(sourceAction.payload?.stealCostSourceTitles);
  const costSummary = `${sourceLabel}: ${additionalCost} ${additionalCost === 1 ? "Credit" : "Credits"} zusätzliche Stehlkosten.`;
  if (blockedAction && !stealAction)
    return `${costSummary} Du hast nicht genug Credits, um diese Agenda zu stehlen.`;
  return `${costSummary} Diese Agenda kann jetzt gestohlen werden.`;
}

function stealCostSourceLabel(value: unknown): string {
  if (typeof value !== "string") return "Stehlkosten";
  const titles = value
    .split(",")
    .map((title) => normalizeVisibleTerms(title.trim()))
    .filter(Boolean);
  if (titles.length === 0) return "Stehlkosten";
  if (titles.length === 1) return titles[0]!;
  return titles.slice(0, -1).join(", ") + " und " + titles.at(-1);
}

export function retainedAccessRevealEvent(events: PublicGameEvent[], dismissedEventId: string | null): PublicGameEvent | null {
  const newerEvents: PublicGameEvent[] = [];
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event || event.eventId === dismissedEventId) return null;
    if (event.publicPayload.actionType !== "access_card") {
      newerEvents.push(event);
      continue;
    }
    if (typeof event.publicPayload.cardDefinitionId !== "string") return null;
    if (typeof event.publicPayload.title !== "string") return null;
    return newerEvents.every((newerEvent) => accessRevealCanBeRetainedPast(newerEvent, event)) ? event : null;
  }
  return null;
}

export function latestRetainableAccessRevealEvent(events: PublicGameEvent[]): PublicGameEvent | null {
  return retainedAccessRevealEvent(events, null);
}

export function retainedExposeReviewEvent(events: PublicGameEvent[], dismissedEventId: string | null): PublicGameEvent | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event || event.eventId === dismissedEventId) return null;
    if (event.publicPayload.approachIceExposeViewDecision === "finish") return null;
    if (event.publicPayload.hiddenZoneAction === "approach_ice_expose_finish") return null;
    if (event.publicPayload.hiddenZoneAction === "expose_installed_card_review") return null;
    if (event.publicPayload.hiddenZoneAction === "expose_installed_card_finish") return null;
    if (event.publicPayload.publicRevealKind !== "expose") continue;
    if (event.publicPayload.hiddenZoneAction === "approach_ice_expose") return null;
    if (event.publicPayload.approachIceExposeDecision) return null;
    if (!eventHasPublicRevealDefinition(event)) return null;
    return event;
  }
  return null;
}

export function approachIceExposeViewingIceId(actions: LegalAction[]): string | null {
  const action = actions.find(
    (candidate) =>
      isApproachIceExposeAction(candidate) &&
      candidate.payload?.approachIceExposeViewDecision === "finish" &&
      typeof candidate.payload.iceId === "string"
  );
  return typeof action?.payload?.iceId === "string" ? action.payload.iceId : null;
}

export function isSingleInstalledCorpExposeChoice(
  choice: NonNullable<PlayerView["pendingChoice"]> | null | undefined,
): boolean {
  return Boolean(
    choice &&
      choice.kind === "select_cards" &&
      choice.source.startsWith("p3_36.expose_installed_card:") &&
      choice.minSelections === 1 &&
      choice.maxSelections === 1,
  );
}

export function isInstalledCorpExposeReviewChoice(
  choice: NonNullable<PlayerView["pendingChoice"]> | null | undefined,
): boolean {
  return Boolean(
    choice &&
      choice.kind === "select_option" &&
      choice.source.startsWith("p3_36.expose_installed_card_review:"),
  );
}

export function installedCorpExposeReviewCardId(
  choice: NonNullable<PlayerView["pendingChoice"]> | null | undefined,
): string | null {
  if (!isInstalledCorpExposeReviewChoice(choice)) return null;
  return choice?.source.split(":")[1] ?? null;
}

function accessRevealCanBeRetainedPast(newerEvent: PublicGameEvent, accessEvent: PublicGameEvent): boolean {
  if (newerEvent.stateVersionAfter === accessEvent.stateVersionAfter) return true;
  const actionType = String(newerEvent.publicPayload.actionType ?? "");
  if (
    actionType === "resolve_choice" &&
    (typeof newerEvent.publicPayload.ambushDefinitionId === "string" ||
      typeof newerEvent.publicPayload.accessEffectSourceDefinitionId === "string")
  )
    return true;
  return ["continue_run", "decline_trash", "steal_agenda", "trash_accessed_card", "end_turn"].includes(actionType);
}

function eventHasPublicRevealDefinition(event: PublicGameEvent): boolean {
  if (typeof event.publicPayload.publicRevealDefinitionId === "string") return true;
  return (
    typeof event.publicPayload.publicRevealDefinitionIds === "string" &&
    event.publicPayload.publicRevealDefinitionIds
      .split(",")
      .some((item) => item.trim().length > 0)
  );
}

function observedAccessStatusLabel(card: Pick<VisibleCard, "type" | "trashCost">, actorSide: Side, fromArchives: boolean): string {
  const subject = actorSide === "corp" ? "Die Korp" : "Der Runner";
  if (card.type === "agenda") return `${subject} kann diese Agenda jetzt stehlen.`;
  if (fromArchives && (card.type === "asset" || card.type === "upgrade")) return `${subject} hat diese Karte im Archiv gesehen.`;
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
  if (cardChoiceIsReadonlyPrivateLook(choice)) return true;
  if (choice.source.startsWith("v1922.corp_archives_to_hq")) return true;
  if (isHiddenZoneReadableCardChoiceSource(choice.source)) return true;
  if (choice.cardSearchPresentation || choice.stackSearchResolution || choice.source.includes("search_stack")) return true;
  if (choice.options.some((option) => option.card)) return true;
  const minSelections = Math.max(0, Math.floor(choice.minSelections));
  const maxSelections = Math.max(minSelections, Math.floor(choice.maxSelections));
  return minSelections !== 1 || maxSelections !== 1;
}

export function cardChoiceUsesReadableCards(choice: NonNullable<PlayerView["pendingChoice"]>): boolean {
  return (
    choice.kind === "select_cards" &&
    Boolean(
      cardChoiceIsReadonlyPrivateLook(choice) ||
        choice.cardSearchPresentation ||
        choice.stackSearchResolution ||
        choice.source.includes("search_stack") ||
        isHiddenZoneReadableCardChoiceSource(choice.source) ||
        choice.options.some((option) => option.card),
    )
  );
}

export function cardChoiceIsReadonlyPrivateLook(choice: NonNullable<PlayerView["pendingChoice"]>): boolean {
  if (
    choice.kind !== "select_cards" ||
    !(
      choice.source.startsWith("p3_33.private_look:") ||
      choice.source.startsWith("p3_38.mystery_box_corp_review:")
    )
  )
    return false;
  const doneOptions = choice.options.filter((option) => option.id === "done" && option.selectable !== false);
  const cardOptions = choice.options.filter((option) => option.id !== "done");
  return (
    doneOptions.length === 1 &&
    cardOptions.length > 0 &&
    cardOptions.every((option) => option.selectable === false && Boolean(option.card))
  );
}

export function cardChoiceReadonlyConfirmationOptionId(choice: NonNullable<PlayerView["pendingChoice"]>): string | null {
  if (!cardChoiceIsReadonlyPrivateLook(choice)) return null;
  return choice.options.find((option) => option.id === "done" && option.selectable !== false)?.id ?? null;
}

export function cardChoiceUsesOrderedSelection(choice: NonNullable<PlayerView["pendingChoice"]>): boolean {
  const minSelections = Math.max(0, Math.floor(choice.minSelections));
  const maxSelections = Math.max(minSelections, Math.floor(choice.maxSelections));
  return (
    choice.kind === "select_cards" &&
    minSelections === maxSelections &&
    maxSelections > 1 &&
    isHiddenZoneOrderedCardChoiceSource(choice.source)
  );
}

export function newBloodReorderTargetLabel(
  choice: NonNullable<PlayerView["pendingChoice"]>,
  selectionIndex: number,
): string | null {
  if (choice.kind !== "select_cards" || !choice.source.startsWith("p3_58.new_blood_reorder")) return null;
  if (!Number.isInteger(selectionIndex) || selectionIndex < 0) return null;
  const targetOption = choice.options[selectionIndex];
  if (!targetOption) return null;
  const publicLabel = typeof targetOption.publicLabel === "string" ? targetOption.publicLabel.trim() : "";
  if (publicLabel) return normalizeVisibleTerms(publicLabel);
  const label = targetOption.label.trim();
  const parenthetical = /\(([^()]+)\)\s*$/.exec(label)?.[1]?.trim();
  if (parenthetical) return normalizeVisibleTerms(parenthetical);
  return `Zielslot ${selectionIndex + 1}`;
}

export function newBloodReorderTargetSequenceHint(
  choice: NonNullable<PlayerView["pendingChoice"]>,
): string | null {
  if (choice.kind !== "select_cards" || !choice.source.startsWith("p3_58.new_blood_reorder")) return null;
  const labels = choice.options
    .map((_, index) => newBloodReorderTargetLabel(choice, index))
    .filter((label): label is string => Boolean(label));
  if (labels.length === 0) return null;
  return `Wähle die ICE in Zielslot-Reihenfolge: ${labels.join(" -> ")}.`;
}

function isHiddenZoneReadableCardChoiceSource(source: string): boolean {
  return (
    source.startsWith("v098.arrange_stack_top2") ||
    source.startsWith("v1911.arrange_stack_top2") ||
    source.startsWith("v1911.corp_rd_arrange_top2") ||
    source.startsWith("v1917.corp_rd_arrange_top2") ||
    source.startsWith("v1922.corp_rd_arrange_top5") ||
    source.startsWith("corp.start_of_run_redirect.herman_reorder") ||
    source.startsWith("v1922.runner_stack_top5_choose_one_arrange_rest") ||
    source.startsWith("p3_37.runner_stack_top5_choose_one_arrange_rest")
  );
}

function isHiddenZoneOrderedCardChoiceSource(source: string): boolean {
  return (
    isHiddenZoneReadableCardChoiceSource(source) ||
    source.startsWith("p3_58.fortress_respecification") ||
    source.startsWith("p3_58.new_blood_reorder")
  );
}

export function shouldUseFieldCardChoice(
  choice: NonNullable<PlayerView["pendingChoice"]>,
  view: PlayerView,
): boolean {
  if (choice.kind !== "select_cards") return false;
  if (choice.source === "discard_phase") return false;
  if (choice.source.startsWith("v1922.corp_archives_to_hq")) return false;
  if (choice.source.startsWith("corp.start_of_run_redirect.herman_reorder")) return false;
  if (choice.cardSearchPresentation || choice.stackSearchResolution || choice.source.includes("search_stack")) return false;
  const selectableOptions = choice.options.filter((option) => option.selectable !== false);
  if (selectableOptions.length === 0) return false;
  const fieldCards = visibleFieldCards(view);
  return selectableOptions.every(
    (option) => fieldCards.some((card) => fieldCardChoiceOptionTargetsCard(option, card)),
  );
}

export function fieldCardChoiceOptionForCard(
  choice: NonNullable<PlayerView["pendingChoice"]> | null | undefined,
  view: PlayerView,
  card: Pick<VisibleCard, "instanceId">,
): NonNullable<PlayerView["pendingChoice"]>["options"][number] | null {
  if (!choice || !shouldUseFieldCardChoice(choice, view)) return null;
  return choice.options.find((option) => option.selectable !== false && fieldCardChoiceOptionTargetsCard(option, card)) ?? null;
}

function fieldCardChoiceOptionTargetsCard(
  option: NonNullable<PlayerView["pendingChoice"]>["options"][number],
  card: Pick<VisibleCard, "instanceId">,
): boolean {
  return (
    option.value === card.instanceId ||
    option.id === `card_${card.instanceId}`
  );
}

export function fieldCardChoiceInfo(
  choice: NonNullable<PlayerView["pendingChoice"]>,
  selectedOptionIds: string[],
): FieldCardChoiceInfo {
  const minSelections = Math.max(0, Math.floor(choice.minSelections));
  const maxSelections = Math.max(minSelections, Math.floor(choice.maxSelections));
  const selectedCount = selectedOptionIds.filter((optionId) =>
    choice.options.some((option) => option.id === optionId && option.selectable !== false),
  ).length;
  const exactSelection = minSelections === maxSelections;
  const canSubmit = selectedCount >= minSelections && selectedCount <= maxSelections;
  return {
    title: maxSelections === 1 ? "Feldkarte auswählen" : "Feldkarten auswählen",
    prompt: choice.prompt,
    counterLabel: exactSelection ? `${selectedCount}/${maxSelections}` : `${selectedCount}/${minSelections}-${maxSelections}`,
    canSubmit,
    canClear: selectedCount > 0,
    submitLabel: selectedCount === 0 && minSelections === 0 ? "Ohne Auswahl übernehmen" : "Auswahl übernehmen",
    clearLabel: "Auswahl leeren"
  };
}

function visibleFieldCards(view: PlayerView): VisibleCard[] {
  return [
    ...(view.own.rig ?? []),
    ...(view.opponent.rig ?? []),
    ...view.servers.flatMap((server) => [...server.ice, ...server.root]),
    ...(view.run?.approachedIce ? [view.run.approachedIce] : []),
    ...(view.run?.encounteredIce ? [view.run.encounteredIce] : [])
  ];
}

export function runnerProgramInstallTrashChoiceInfo(
  choice: NonNullable<PlayerView["pendingChoice"]>,
  view: PlayerView,
  selectedOptionIds: string[],
): RunnerProgramInstallTrashChoiceInfo | null {
  if (!choice.source.startsWith("runner_program_trash_before_install:"))
    return null;
  const sourceCardId = choice.source.split(":")[1] ?? "";
  const sourceCard = view.own.gripOrHq.find((card) => card.instanceId === sourceCardId);
  const sourceMemoryCost = Math.max(0, Math.floor(sourceCard?.memoryCost ?? 0));
  const memoryUsed = Math.max(0, Math.floor(view.own.memoryUsed ?? 0));
  const memoryLimit = Math.max(0, Math.floor(view.own.memoryLimit ?? 0));
  const requiredMemoryToFree = Math.max(0, memoryUsed + sourceMemoryCost - memoryLimit);
  const selectedOptionIdSet = new Set(selectedOptionIds);
  const optionCards = visibleCardsForChoiceInfo(view);
  const selectedMemoryFreed = choice.options.reduce((sum, option) => {
    if (!selectedOptionIdSet.has(option.id) || typeof option.value !== "string")
      return sum;
    const card = optionCards.get(option.value);
    return sum + Math.max(0, Math.floor(card?.memoryCost ?? 0));
  }, 0);
  const memoryRequired = requiredMemoryToFree > 0;
  const enoughMemoryFreed = selectedMemoryFreed >= requiredMemoryToFree;
  return {
    title: memoryRequired ? "MU freimachen" : "Programme vorher trashen?",
    question: runnerProgramInstallTrashQuestion(
      memoryRequired,
      requiredMemoryToFree,
      selectedMemoryFreed,
      selectedOptionIds.length,
    ),
    effectHint: memoryRequired
      ? "Die Installation wird nur durchgeführt, wenn genug MU frei wird. Ohne Auswahl wird sie abgebrochen."
      : "Du kannst ohne Trash installieren oder vorher installierte Programme trashen.",
    submitLabel: runnerProgramInstallTrashSubmitLabel(
      memoryRequired,
      selectedOptionIds.length,
    ),
    canSubmit: !memoryRequired || enoughMemoryFreed || selectedOptionIds.length === 0,
    requiredMemoryToFree,
    selectedMemoryFreed,
  };
}

function runnerProgramInstallTrashQuestion(
  memoryRequired: boolean,
  requiredMemoryToFree: number,
  selectedMemoryFreed: number,
  selectedCount: number,
): string {
  if (!memoryRequired) {
    if (selectedCount === 0) return "Ohne Trash installieren?";
    return selectedCount === 1
      ? "Dieses Programm vorher trashen und dann installieren?"
      : `${selectedCount} Programme vorher trashen und dann installieren?`;
  }
  if (selectedCount === 0)
    return `Wähle Programme mit mindestens ${requiredMemoryToFree} MU oder brich die Installation ab.`;
  if (selectedMemoryFreed >= requiredMemoryToFree)
    return `${selectedMemoryFreed}/${requiredMemoryToFree} MU gewählt. Auswahl bestätigen?`;
  return `Noch ${requiredMemoryToFree - selectedMemoryFreed} MU freimachen (${selectedMemoryFreed}/${requiredMemoryToFree}).`;
}

function runnerProgramInstallTrashSubmitLabel(
  memoryRequired: boolean,
  selectedCount: number,
): string {
  if (memoryRequired && selectedCount === 0) return "Nicht installieren";
  if (memoryRequired) return "Auswahl bestätigen";
  if (selectedCount === 0) return "Ohne Trash installieren";
  return "Installieren";
}

function visibleCardsForChoiceInfo(view: PlayerView): Map<string, VisibleCard> {
  return new Map(
    [
      view.own.identity,
      ...view.own.gripOrHq,
      ...view.own.heapOrArchives,
      ...view.own.scoreArea,
      ...(view.own.rig ?? []),
      view.opponent.identity,
      ...(view.opponent.discardCards ?? []),
      ...view.opponent.scoreArea,
      ...(view.opponent.rig ?? []),
      ...view.servers.flatMap((server) => [...server.ice, ...server.root]),
      ...(view.specialZones?.setAside ?? []),
      ...(view.specialZones?.removedFromGame ?? []),
      ...(view.run?.approachedIce ? [view.run.approachedIce] : []),
      ...(view.run?.encounteredIce ? [view.run.encounteredIce] : []),
      ...(view.run?.accessedCard ? [view.run.accessedCard] : []),
    ].map((card) => [card.instanceId, card]),
  );
}

export function breachProgressLabel(view: PlayerView): string | null {
  const breach = view.run?.breach;
  if (!breach) return null;
  const current = breach.currentIndex + 1;
  const knownTotal = breach.completed ? current : breach.currentIndex + breach.remainingCount;
  return `Zugriff ${current} von ${Math.max(current, knownTotal)}`;
}

export function breachHighlighterAccessHint(view: PlayerView): string | null {
  const run = view.run;
  const breach = run?.breach;
  if (!run || !breach || run.attackedServerId !== "rd" || breach.currentIndex <= 0) return null;
  const highlighterCounters = corpHighlighterCounterAmount(view);
  if (highlighterCounters <= 1) return null;
  const current = breach.currentIndex + 1;
  const knownTotal = Math.max(current, breach.completed ? current : breach.currentIndex + breach.remainingCount);
  return `Zusätzlicher R&D-Zugriff ${current} von ${knownTotal}: Die Korp hat ${highlighterCounters} Highlighter-Counter.`;
}

function corpHighlighterCounterAmount(view: PlayerView): number {
  const corpIdentity = view.side === "corp" ? view.own.identity : view.opponent.identity;
  const display = corpIdentity.counterDisplays?.find(
    (counter) =>
      counter.counterType === "highlighter" ||
      counter.id === "runner_virus_corp_highlighter",
  );
  return Math.max(0, Math.floor(display?.amount ?? 0));
}

export function activeRunIceInstanceId(view: PlayerView): string | null {
  const run = view.run;
  if (!run) return null;
  if (run.approachedIce?.instanceId) return run.approachedIce.instanceId;
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
  const activeIce = view.run?.encounteredIce ?? view.run?.approachedIce;
  const title = activeIce?.known === false ? null : activeIce?.title;
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
    return iceLabel ? `Jack-out: an ${iceLabel} abbrechen` : "Jack-out: vor Zugriff abbrechen";
  }
  if (action.type === "continue_run") {
    if (action.payload?.encounterContinue === true) {
      if (base === "ICE passieren" && iceLabel) return `${iceLabel} passieren`;
      return iceLabel ? `${base} an ${iceLabel}` : base;
    }
    if (view.run.phase === "movement") return iceLabel ? `Weiterlaufen: zu ${iceLabel}` : "Weiterlaufen: zum Zugriff";
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
    if (action.type === "resolve_choice" && view.pendingChoice) return true;
    if (isAccessWindowAction(action)) return true;
    if (!action.timingPoint.startsWith("run.")) return false;
    if (action.type === "pump_breaker" || action.type === "break_subroutine") return action.payload?.iceId === activeRunIceInstanceId(view);
    return true;
  });
}

function isAccessWindowAction(action: LegalAction): boolean {
  return action.type === "access_card" || action.timingPoint.startsWith("access.");
}

export function runWindowActionButtonLabel(view: PlayerView, action: LegalAction): string {
  const activeIceId = activeRunIceInstanceId(view);
  if (isSelfModifyingCodeAction(action)) {
    return "SMC: Programm suchen";
  }
  if (action.type === "continue_run" && view.run?.phase === "encounter_ice") {
    const base = actionButtonLabel(action);
    if (/^Subroutinen auslösen\b/i.test(base)) return base;
  }
  if (
    (action.type === "pump_breaker" || action.type === "break_subroutine") &&
    activeIceId &&
    action.payload?.iceId === activeIceId
  ) {
    return compactRunWindowBreakerLabel(view, action);
  }
  return runAwareActionButtonLabel(view, action);
}

export function runBreakerActionHint(view: PlayerView, actions: LegalAction[]): string | null {
  if (view.run?.phase !== "encounter_ice") return null;
  const breakerActions = encounterBreakerActions(view, actions);
  if (breakerActions.length > 0) {
    const labels = Array.from(new Set(breakerActions.map((action) => runWindowActionButtonLabel(view, action)))).slice(0, 2);
    return `Eisbrecher: ${labels.join(", ")}${breakerActions.length > labels.length ? " ..." : ""}`;
  }
  if (view.side !== "runner") {
    const visibleBreakers = visibleMatchingRunnerBreakers(view);
    if (visibleBreakers.length === 1) return `Runner-Rig zeigt passenden Eisbrecher: ${visibleBreakers[0]!.title}.`;
    if (visibleBreakers.length > 1) return `Runner-Rig zeigt passende Eisbrecher: ${visibleBreakers.slice(0, 2).map((card) => card.title).join(", ")}${visibleBreakers.length > 2 ? " ..." : ""}.`;
    return null;
  }
  return "Kein passender Eisbrecher für dieses ICE verfügbar.";
}

function compactRunWindowBreakerLabel(view: PlayerView, action: LegalAction): string {
  const breakerTitle = sourceCardTitleForAction(view, action);
  if (action.type === "pump_breaker") {
    return `${breakerTitle ? `${breakerTitle} ` : ""}+1 Stärke`;
  }
  const rawIndex = action.payload?.subroutineIndex;
  const subroutineLabel =
    typeof rawIndex === "number" && Number.isFinite(rawIndex) && rawIndex >= 0
      ? `Subroutine ${Math.floor(rawIndex) + 1} brechen`
      : "Subroutine brechen";
  return `${breakerTitle ? `${breakerTitle}: ` : ""}${subroutineLabel}`;
}

export function encounterBreakerActions(view: PlayerView, actions: LegalAction[]): LegalAction[] {
  const activeIceId = activeRunIceInstanceId(view);
  const encounteredIce = view.run?.encounteredIce ?? null;
  const rigById = new Map(runnerRigForView(view).map((card) => [card.instanceId, card]));
  return actions.filter((action) => {
    if (action.type !== "pump_breaker" && action.type !== "break_subroutine") return false;
    if (activeIceId && action.payload?.iceId !== activeIceId) return false;
    if (action.type === "break_subroutine") return true;
    const breakerId = breakerIdFromAction(action);
    if (!breakerId) return false;
    const breaker = rigById.get(breakerId);
    return breaker ? breakerMatchesEncounteredIce(breaker, encounteredIce) : false;
  });
}

function visibleMatchingRunnerBreakers(view: PlayerView): VisibleCard[] {
  const encounteredIce = view.run?.encounteredIce ?? null;
  return runnerRigForView(view)
    .filter((card) => card.known && Boolean(card.title))
    .filter(isVisibleIcebreaker)
    .filter((card) => breakerMatchesEncounteredIce(card, encounteredIce));
}

function runnerRigForView(view: PlayerView): VisibleCard[] {
  return view.side === "runner" ? (view.own.rig ?? []) : (view.opponent.rig ?? []);
}

function breakerIdFromAction(action: LegalAction): string | null {
  if (typeof action.payload?.breakerId === "string") return action.payload.breakerId;
  return action.source !== "basic_action" && action.source !== "game_rule" ? action.source : null;
}

function breakerMatchesEncounteredIce(breaker: VisibleCard, encounteredIce: VisibleCard | null): boolean {
  if (!encounteredIce?.known) return true;
  const iceSubtypes = new Set((encounteredIce.subtypes ?? []).map(normalizeBreakerSubtype));
  if (iceSubtypes.size === 0) return true;
  const rulesText = normalizeBreakerRulesText(breaker.rulesText ?? "");
  if (/\bbreak\s+(?:1\s+)?ice\s+subroutine\b/.test(rulesText)) return true;
  if (iceSubtypes.has("sentry") && /\bbreak\s+(?:1\s+)?sentry\s+subroutine\b/.test(rulesText)) return true;
  if (iceSubtypes.has("wall") && /\bbreak\s+(?:1\s+)?wall\s+subroutine\b/.test(rulesText)) return true;
  if (iceSubtypes.has("code gate") && /\bbreak\s+(?:1\s+)?code gate\s+subroutine\b/.test(rulesText)) return true;
  return false;
}

function isVisibleIcebreaker(card: VisibleCard): boolean {
  const subtypes = new Set((card.subtypes ?? []).map(normalizeBreakerSubtype));
  if (subtypes.has("icebreaker")) return true;
  return /\bbreak\s+(?:1\s+)?(?:ice|sentry|wall|code gate)\s+subroutine\b/.test(normalizeBreakerRulesText(card.rulesText ?? ""));
}

function normalizeBreakerSubtype(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeBreakerRulesText(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
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

export function hiddenCorpRootCardForOpponent(card: VisibleCard): VisibleCard {
  if (card.known) return card;
  return {
    instanceId: card.instanceId,
    known: false,
    rezzed: false,
    ...(typeof card.advancementCounters === "number" ? { advancementCounters: card.advancementCounters } : {}),
    ...(card.counterDisplays ? { counterDisplays: card.counterDisplays } : {})
  };
}

export function corpRootCardsForDisplay(
  viewerSide: Side,
  serverId: PlayerView["servers"][number]["id"],
  cards: VisibleCard[]
): VisibleCard[] {
  if (viewerSide === "corp" || serverId === "archives") return cards;
  return cards.map(hiddenCorpRootCardForOpponent);
}

export function splitArchiveCardsForDisplay(
  viewerSide: Side,
  cards: VisibleCard[],
  totalArchivesCount: number
): { faceupCards: VisibleCard[]; facedownCards: VisibleCard[]; facedownCount: number } {
  if (viewerSide === "runner") {
    const faceupCards = cards.filter((card) => card.known);
    return {
      faceupCards,
      facedownCards: [],
      facedownCount: Math.max(0, totalArchivesCount - faceupCards.length)
    };
  }

  const faceupCards = cards.filter((card) => card.rezzed === true);
  const facedownCards = cards.filter((card) => card.rezzed !== true);
  return {
    faceupCards,
    facedownCards,
    facedownCount: Math.max(facedownCards.length, totalArchivesCount - faceupCards.length)
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
  return serverRefsForAction(action).length > 0 || ["advance_card", "score_agenda", "trash_resource"].includes(action.type);
}

function isSelfModifyingCodeAction(action: Partial<Pick<LegalAction, "type" | "payload">>): boolean {
  return action.type === "trigger_ability" && actionHasAbility(action, "self_modifying_code_install_program");
}

function isApproachIceExposeAction(action: Partial<Pick<LegalAction, "type" | "payload">>): boolean {
  return (
    action.type === "trigger_ability" &&
    (typeof action.payload?.approachIceExposeDecision === "string" ||
      typeof action.payload?.approachIceExposeViewDecision === "string")
  );
}

function isRemoveSpyCounterAction(action: Partial<Pick<LegalAction, "type" | "payload">>): boolean {
  return (
    action.type === "trigger_ability" &&
    action.payload?.corpAbility === "remove_spy_counter"
  );
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
    ...(view.run?.approachedIce ? [view.run.approachedIce] : []),
    ...(view.run?.encounteredIce ? [view.run.encounteredIce] : []),
    ...(view.run?.accessedCard ? [view.run.accessedCard] : [])
  ];
}

function addStringRef(refs: Set<string>, value: unknown): void {
  if (typeof value === "string" && value.trim()) refs.add(value);
}

function remoteNumber(serverId: string): number {
  return Number(/^remote_(\d+)$/.exec(serverId)?.[1] ?? Number.MAX_SAFE_INTEGER);
}
