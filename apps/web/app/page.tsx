"use client";

import {
  Activity,
  Bot,
  Cable,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Flag,
  CopyPlus,
  Download,
  Eye,
  Image,
  Keyboard,
  Layers3,
  Link2,
  ListFilter,
  Moon,
  PanelRightOpen,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  UserPlus,
  Volume2,
  VolumeX,
  X,
  ZoomIn
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { DeckPublicMetadata, LegalAction, PlayerView, PublicGameEvent, Side, VisibleCard, Winner } from "@netrunner/shared";
import {
  CHRONICLE_CATEGORY_LABELS,
  chronicleGroupLabel,
  formatChronicleEvent,
  type ChronicleCategory,
  type ChronicleContext,
  type ChronicleItem
} from "./chronicle";
import {
  deriveOpponentActionCues,
  type ActionSoundKind,
  type BoardHighlight,
  type OpponentActionCue
} from "./action-cues";
import {
  ACTION_CUE_POSITION_STORAGE_KEY,
  DEFAULT_CUE_POSITION,
  RUN_TIMELINE_STEPS,
  actionButtonLabel,
  actionContextStillVisible,
  actionContextTitle,
  actionCostChips,
  actionGroupLabel,
  actionMatchesContext,
  actionSlotDisplay,
  baseActionSlotCapacity,
  breachProgressLabel,
  clampCuePosition,
  contextualCardActionLabel,
  corpInstalledCardState,
  cuePositionClassName,
  cuePositionStyle,
  groupRunnerRigCards,
  hasLegalAction,
  parseCuePositionPreference,
  runTargetServerIds,
  serializeCuePositionPreference,
  serverDisplayLabel,
  splitLegalActions,
  currentRunTimelineStep,
  type ActionContext,
  type CuePositionPreference,
  type CuePositionPreset
} from "./action-board-ui";
import {
  deriveMatchStart,
  humanAiSideLabel,
  playModeLabel,
  sideSelectionLabel,
  type HumanAiSideSelection,
  type HumanSideSelection,
  type PlayMode
} from "./match-start";

const SERVER_HTTP = process.env.NEXT_PUBLIC_NETRUNNER_SERVER_URL ?? "http://127.0.0.1:8787";
const SESSION_KEY = "netrunner-mvp-0-3-session";
const RECENT_SESSIONS_KEY = "netrunner.recentSessions";
const DECK_STORAGE_KEY = "netrunner-v0-6-local-decks";
const AUDIO_STORAGE_KEY = "netrunner-s01-audio";
const COLOR_SCHEME_STORAGE_KEY = "netgrid-color-scheme";
const DISPLAY_NAME_STORAGE_KEY = "netrunner.displayName";
const DEFAULT_RUNNER_SNAPSHOT_ID = "demo_runner_008_snapshot_v0_8";
const DEFAULT_CORP_SNAPSHOT_ID = "demo_corp_008_snapshot_v0_8";
const RunIcon = Shield;
const RUNNER_BASE_HAND_LIMIT = 5;
const DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID = "card-snapshot-0.8";
const DEFAULT_DECK_FORMAT_PROFILE_ID = "local-demo-v0.8";
const APP_STATUS_LABEL = "V1.0.6";
const DEFAULT_IDENTITY_BY_SIDE: Record<Side, string> = {
  runner: "runner_identity_001",
  corp: "corp_identity_001"
};

let sharedAudioContext: AudioContext | null = null;

type MatchStatus =
  | "pending"
  | "waiting_for_runner"
  | "waiting_for_corp"
  | "waiting_for_joiner_decks"
  | "ready_check"
  | "countdown"
  | "active"
  | "cancelled"
  | "abandoned"
  | "forfeited"
  | "finished";
type GameMode = "human_vs_human" | "human_runner_vs_corp_ai" | "human_corp_vs_runner_ai" | "ai_vs_ai";
type MatchFormat = "single_game" | "rules_match" | "two_game_side_swap";
type AiDifficulty = "easy" | "normal" | "hard";
type AiDeckPolicy = "fixed" | "selected" | "seeded_random";
type AiPacingMode = "fast" | "paced" | "manual";
type CardDisplayMode = "placeholder" | "text-card" | "compact";
type ColorScheme = "black" | "white";
type EntryTab = "play" | "catalog" | "decks" | "options";
type DeckSideFilter = Side | "all";

type SeriesResultSummary = {
  seriesId: string;
  mode: "two_game_side_swap";
  status: "active" | "between_games" | "finished";
  gameNumber: number;
  gamesPlanned: number;
  viewerPlayer: "player_a" | "player_b";
  viewerWins: number;
  opponentWins: number;
  draws: number;
  viewerAgendaPoints: number;
  opponentAgendaPoints: number;
  nextAvailable: boolean;
  nextMatchId?: string;
};

type GameResultSummary = {
  winner: Winner;
  winnerSide?: Side;
  loserSide?: Side;
  viewerOutcome: "won" | "lost" | "draw";
  reason: "agenda_points" | "corp_deck_empty" | "flatline" | "draw" | "forfeit" | "unknown";
  matchFormat: MatchFormat;
  agendaPointsToWin: number;
  runnerAgendaPoints: number;
  corpAgendaPoints: number;
  actionCount: number;
  runCount: number;
  successfulRunCount: number;
  stolenAgendaCount: number;
  scoredAgendaCount: number;
  startedAt: string;
  finishedAt: string;
  finalStateHash: string;
  finalEngineStateHash?: string;
  series?: SeriesResultSummary;
};

type LifecycleResultSummary = {
  status: "cancelled" | "abandoned" | "forfeited";
  reason: "cancel" | "leave" | "forfeit";
  occurredAt: string;
  actorSide: Side;
  winnerSide?: Side;
  loserSide?: Side;
  finalEngineStateHash?: string;
};

type ClientPayload = {
  matchId: string;
  matchStatus: MatchStatus;
  matchVersion: number;
  side: Side;
  playerView: PlayerView;
  legalActions: LegalAction[];
  eventTail: PublicGameEvent[];
  opponentStatus: { side: Side; connected: boolean; displayName?: string };
  pendingUndo?: {
    undoRequestId: string;
    requestedBy: Side;
    targetEventId: string;
    reason?: string;
    needsResponse: boolean;
  };
  aiTurnPresentation?: {
    activeAiSide?: Side;
    canAdvanceAi: boolean;
    pacingMode: AiPacingMode;
  };
  winner?: Winner;
  finalStateHash?: string;
  resultSummary?: GameResultSummary;
  lifecycleResult?: LifecycleResultSummary;
};

type LobbyParticipant = {
  displayName: string;
  side?: Side;
  runnerDeckReady: boolean;
  corpDeckReady: boolean;
  connected: boolean;
  connectionQuality: "online" | "unstable" | "offline";
  ready: boolean;
};

type LobbyChatMessage = {
  id: number;
  side: Side;
  displayName: string;
  sentAt: string;
  text: string;
};

type MatchStartLobby = {
  hostReady: boolean;
  joinerReady: boolean;
  countdownSeconds: 3 | 5 | 10;
  countdownStartedAt?: string;
  countdownEndsAt?: string;
  agendaPointsToWin: number;
  matchFormat: MatchFormat;
  sideAssignment: { runnerPlayer: "player_a" | "player_b"; corpPlayer: "player_a" | "player_b" };
  participants: Record<"player_a" | "player_b", LobbyParticipant>;
  chatMessages: LobbyChatMessage[];
};

type LobbyClientPayload = {
  matchId: string;
  matchStatus: MatchStatus;
  matchVersion: number;
  side: Side;
  eventTail: PublicGameEvent[];
  opponentStatus: { side: Side; connected: boolean; displayName?: string };
  lifecycleResult?: LifecycleResultSummary;
  pendingDeckHandshake?: {
    required: boolean;
    message: string;
  };
  startLobby?: MatchStartLobby;
};

type SessionInfo = {
  matchId: string;
  side: Side;
  sessionToken: string;
  reconnectToken: string;
  webSocketUrl: string;
  joinUrl?: string;
  displayName: string;
  pendingDeckHandshake?: boolean;
};

type RecentSessionInfo = {
  matchId: string;
  side: Side;
  displayName: string;
  opponentDisplayName?: string;
  matchStatus?: MatchStatus;
  savedAt: string;
};

type ServerMessage =
  | { type: "state_update"; payload: { matchStatus: MatchStatus; matchVersion: number; playerView: PlayerView } }
  | { type: "lobby_update"; payload: LobbyClientPayload }
  | { type: "legal_actions"; payload: { legalActions: LegalAction[] } }
  | { type: "event_log_update"; payload: { events: PublicGameEvent[] } }
  | { type: "opponent_status"; payload: ClientPayload["opponentStatus"] }
  | { type: "undo_request"; payload: NonNullable<ClientPayload["pendingUndo"]> }
  | { type: "ai_turn"; payload: ClientPayload["aiTurnPresentation"] | null }
  | { type: "match_finished"; payload: { matchStatus: MatchStatus; winner: Winner; finalStateHash: string; resultSummary?: GameResultSummary } }
  | { type: "error"; payload: { code: string; message: string; playerView?: PlayerView } }
  | { type: "action_receipt"; payload: { accepted: boolean; stateVersionAfter: number; errorCode?: string } }
  | { type: "choice_request"; payload: { choice: null } }
  | { type: "pong"; payload: { serverTime: number } };

type CreateMatchResponse = {
  matchId: string;
  matchStatus?: MatchStatus;
  pendingDeckHandshake?: boolean;
  hostSide: Side;
  hostSessionToken: string;
  hostReconnectToken: string;
  joinUrl?: string;
  webSocketUrl: string;
  mode: Exclude<GameMode, "ai_vs_ai">;
  playerView?: PlayerView;
  legalActions: LegalAction[];
  matchVersion: number;
  lobby?: MatchStartLobby;
  aiTurnPresentation?: ClientPayload["aiTurnPresentation"];
  winner?: Winner;
  finalStateHash?: string;
  resultSummary?: GameResultSummary;
  error?: { message: string };
};

type JoinMatchResponse = {
  matchId: string;
  side: Side;
  sessionToken: string;
  reconnectToken: string;
  webSocketUrl: string;
  playerView?: PlayerView;
  legalActions: LegalAction[];
  matchVersion: number;
  matchStatus?: MatchStatus;
  lobby?: MatchStartLobby;
  eventTail?: PublicGameEvent[];
  aiTurnPresentation?: ClientPayload["aiTurnPresentation"];
  winner?: Winner;
  finalStateHash?: string;
  resultSummary?: GameResultSummary;
  error?: { message: string };
};

type LifecycleActionResponse =
  | {
      ok: true;
      actorPayload: ClientPayload | LobbyClientPayload;
      opponentPayload?: ClientPayload | LobbyClientPayload;
      newMatch?: CreateMatchResponse;
    }
  | { ok?: false; error: { message: string } };

type AiSimulationSummary = {
  seed: string;
  winner: Winner | "action_limit_reached";
  actions: number;
  turns: number;
  finalStateHash: string;
  replayOk: boolean;
  errors: string[];
};

type CatalogStatusKey = "imported" | "validated" | "catalog_ready" | "implemented" | "playable" | "deck_legal" | "blocked";

type CatalogStatuses = Record<CatalogStatusKey, boolean>;

type CatalogTypeFilterKey = "ice" | "agenda" | "icebreaker" | "asset" | "upgrade" | "operation" | "event" | "hardware" | "resource" | "program";

type CatalogTypeFilterState = Record<CatalogTypeFilterKey, boolean>;

type CatalogCardSummary = {
  catalogCardId: string;
  title: string;
  side: Side;
  type: string;
  subtypes: string[];
  faction: string;
  setId: string;
  statuses: CatalogStatuses;
  blockReasons: string[];
};

type CatalogCardDetail = CatalogCardSummary & {
  setName: string;
  collectorNumber: string;
  text: string;
  numeric: Record<string, number | null>;
  engineCardId: string | null;
};

type CatalogListResponse = {
  snapshotId: string;
  snapshotHash: string;
  cards: CatalogCardSummary[];
  filters: {
    sides: Side[];
    types: string[];
    statuses: CatalogStatusKey[];
  };
  summary: Partial<Record<CatalogStatusKey, number>>;
};

type DisplayVisibleCard = VisibleCard & {
  imageUrl?: string;
  strengthModifier?: number;
};

type FocusedCard = {
  card: VisibleCard;
  hiddenSide?: Side;
};

type AccessReveal = {
  eventId: string;
  serverLabel: string;
  serverTitleLabel: string;
  serverLocationPhrase: string;
  card: DisplayVisibleCard;
  actions: LegalAction[];
  trashStatus: string;
};

type DeckCardEntry = {
  cardId: string;
  quantity: number;
};

type EditableDeck = {
  deckId: string;
  deckVersion: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  formatProfileId: string;
  cards: DeckCardEntry[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

type DeckTemplate = {
  templateId: string;
  sourceDeckId: string;
  name: string;
  side: Side;
  identityCardId: string;
  editableCopyAllowed: boolean;
  cards: DeckCardEntry[];
};

type DeckValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  totalCards: number;
  agendaPoints: number | null;
};

type DeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId: string;
  deckVersion: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  formatProfileId: string;
  rulesBaselineId: string;
  immutable: boolean;
  cards: DeckCardEntry[];
  validation: DeckValidationResult;
  publicMetadata: DeckPublicMetadata;
  deckHash: string;
};

type DeckSnapshotsResponse = {
  snapshots: DeckSnapshot[];
};

type DeckTemplatesResponse = {
  templates: DeckTemplate[];
};

type DeckValidationResponse = {
  validation: DeckValidationResult;
  snapshot: DeckSnapshot | null;
  error?: { message: string };
};

const CATALOG_STATUS_LABELS: Record<CatalogStatusKey, string> = {
  imported: "imported",
  validated: "validated",
  catalog_ready: "catalog_ready",
  implemented: "implemented",
  playable: "playable",
  deck_legal: "deck_legal",
  blocked: "blocked"
};

const RUNNER_CATALOG_TYPE_FILTERS: Array<{ key: CatalogTypeFilterKey; label: string }> = [
  { key: "event", label: "Event" },
  { key: "hardware", label: "Hardware" },
  { key: "resource", label: "Ressource" },
  { key: "program", label: "Programm" },
  { key: "icebreaker", label: "Icebrecher" }
];

const CORP_CATALOG_TYPE_FILTERS: Array<{ key: CatalogTypeFilterKey; label: string }> = [
  { key: "ice", label: "ICE" },
  { key: "agenda", label: "Agenda" },
  { key: "asset", label: "Asset" },
  { key: "upgrade", label: "Upgrade" },
  { key: "operation", label: "Operation" }
];

const CATALOG_TYPE_FILTER_GROUPS: Array<{ title: string; side: Side; filters: Array<{ key: CatalogTypeFilterKey; label: string }> }> = [
  { title: "Runner", side: "runner", filters: RUNNER_CATALOG_TYPE_FILTERS },
  { title: "Corp", side: "corp", filters: CORP_CATALOG_TYPE_FILTERS }
];

const ALL_CATALOG_TYPE_FILTERS: CatalogTypeFilterState = {
  ice: true,
  agenda: true,
  icebreaker: true,
  asset: true,
  upgrade: true,
  operation: true,
  event: true,
  hardware: true,
  resource: true,
  program: true
};

const NO_CATALOG_TYPE_FILTERS: CatalogTypeFilterState = {
  ice: false,
  agenda: false,
  icebreaker: false,
  asset: false,
  upgrade: false,
  operation: false,
  event: false,
  hardware: false,
  resource: false,
  program: false
};

const CATALOG_NUMERIC_LABELS: Record<string, string> = {
  cost: "Kosten",
  installCost: "Install",
  memoryCost: "MU",
  strength: "Stärke",
  rezCost: "Rez",
  trashCost: "Trash",
  advancementRequirement: "Benötigt",
  agendaPoints: "Agenda"
};

const LOCAL_CARD_IMAGE_IDS = new Set([
  "corp_identity_001",
  "efficient_fracter",
  "runner_identity_001",
  "simple_agenda",
  "simple_barrier_ice",
  "simple_code_gate_ice",
  "simple_decoder",
  "simple_draw_event",
  "simple_draw_operation",
  "simple_economy_asset",
  "simple_economy_event",
  "simple_economy_operation",
  "simple_fracter",
  "simple_killer",
  "simple_priority_agenda",
  "simple_run_event",
  "simple_sentry_ice",
  "simple_setup_hardware",
  "simple_tag_ice",
  "simple_tag_punishment_operation",
  "simple_taxing_barrier_ice",
  "simple_upgrade",
  "v08_adaptive_killer",
  "v08_archive_planning_operation",
  "v08_burst_credit_event",
  "v08_cashout_asset",
  "v08_credit_surge_operation",
  "v08_deep_draw_event",
  "v08_gate_ice",
  "v08_memory_chip",
  "v08_overclock_run_event",
  "v08_precise_decoder",
  "v08_steady_fracter",
  "v08_project_agenda",
  "v08_wall_ice",
  "v08_watchdog_ice",
  "v094_neural_sentry_ice"
]);

const LOCAL_CARD_IMAGE_VERSION = "2026-05-04-generated-card-art-1";

function localCardImageUrl(cardId: string): string | undefined {
  const encodedCardId = encodeURIComponent(cardId);
  if (LOCAL_CARD_IMAGE_IDS.has(cardId)) return `/api/card-images/${encodedCardId}?v=${LOCAL_CARD_IMAGE_VERSION}`;
  if (cardId.startsWith("onr_v1_")) return `/api/card-images/${encodedCardId}`;
  return undefined;
}

function formatCatalogTerm(value: string): string {
  if (value.toLowerCase() === "ice") return "ICE";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatCatalogTypeLine(card: Pick<CatalogCardSummary, "type" | "subtypes">): string {
  const type = formatCatalogTerm(card.type);
  const subtypes = card.subtypes.map(formatCatalogTerm).join(" / ");
  return [type, subtypes].filter(Boolean).join(" - ");
}

function rulesTextLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function shouldShowSubroutineMarkers(cardType: string, text: string): boolean {
  return cardType.toLowerCase() === "ice" && rulesTextLines(text).length > 1;
}

function isSubroutineRuleLine(cardType: string, text: string, line: string): boolean {
  return line.includes("[Subroutine]") || shouldShowSubroutineMarkers(cardType, text);
}

function shouldAddFallbackSubroutineMarker(cardType: string, text: string, line: string): boolean {
  return !line.includes("[Subroutine]") && shouldShowSubroutineMarkers(cardType, text);
}

function renderRuleTextSegments(line: string, keyPrefix: string) {
  return line.split(/(\[Subroutine\])/g).map((part, index) => (part === "[Subroutine]" ? <SubroutineIcon key={`${keyPrefix}-subroutine-${index}`} /> : part));
}

function SubroutineIcon() {
  return (
    <span className="subroutineIcon" role="img" aria-label="Subroutine">
      ↩
    </span>
  );
}

function catalogDetailLines(card: CatalogCardDetail): string[] {
  const typeLine = [card.side, formatCatalogTypeLine(card)].filter(Boolean).join(" · ");
  const numberLine = Object.entries(CATALOG_NUMERIC_LABELS)
    .map(([key, label]) => {
      const value = card.numeric[key];
      return catalogNumericLabel(key, label, value);
    })
    .filter(Boolean)
    .join(" · ");
  return [typeLine, numberLine].filter(Boolean);
}

function catalogNumericLabel(key: string, label: string, value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (key === "advancementRequirement") return neededDevelopmentLabel(value);
  return `${label} ${value}`;
}

function revealedEventCardId(event: PublicGameEvent): string | null {
  const cardId = event.publicPayload.cardDefinitionId;
  return typeof cardId === "string" ? cardId : null;
}

function eventCardDetail(event: PublicGameEvent, detailsById: Record<string, CatalogCardDetail>): CatalogCardDetail | null {
  const cardId = revealedEventCardId(event);
  return cardId ? (detailsById[cardId] ?? null) : null;
}

function visibleKnownCardIds(view: PlayerView | undefined): string[] {
  if (!view) return [];
  const cards = [
    ...view.own.gripOrHq,
    ...view.own.heapOrArchives,
    ...view.own.scoreArea,
    ...(view.own.rig ?? []),
    ...view.opponent.scoreArea,
    ...view.servers.flatMap((server) => [...server.ice, ...server.root]),
    ...(view.run?.encounteredIce ? [view.run.encounteredIce] : [])
  ];
  return Array.from(new Set(cards.filter((card) => card.known && card.definitionId).map((card) => card.definitionId!)));
}

function enrichVisibleCard(card: VisibleCard, detailsById: Record<string, CatalogCardDetail>): DisplayVisibleCard {
  if (!card.known || !card.definitionId) return card;
  const detail = detailsById[card.definitionId];
  const imageUrl = localCardImageUrl(card.definitionId);
  const enriched: DisplayVisibleCard = {
    ...card,
    ...(imageUrl ? { imageUrl } : {})
  };
  if (!detail) return enriched;
  enriched.rulesText = card.rulesText ?? detail.text;
  addNumeric(enriched, "cost", card.cost, detail.numeric.cost);
  addNumeric(enriched, "installCost", card.installCost, detail.numeric.installCost);
  addNumeric(enriched, "memoryCost", card.memoryCost, detail.numeric.memoryCost);
  addNumeric(enriched, "strength", card.strength, detail.numeric.strength);
  addNumeric(enriched, "rezCost", card.rezCost, detail.numeric.rezCost);
  addNumeric(enriched, "trashCost", card.trashCost, detail.numeric.trashCost);
  addNumeric(enriched, "advancementRequirement", card.advancementRequirement, detail.numeric.advancementRequirement);
  addNumeric(enriched, "agendaPoints", card.agendaPoints, detail.numeric.agendaPoints);
  if (typeof card.strength === "number" && typeof detail.numeric.strength === "number" && card.strength > detail.numeric.strength) {
    enriched.strengthModifier = card.strength - detail.numeric.strength;
  }
  return enriched;
}

function visibleCardFromCatalogDetail(card: CatalogCardDetail): DisplayVisibleCard {
  const visible: DisplayVisibleCard = {
    instanceId: `chronicle-${card.catalogCardId}`,
    known: true,
    title: card.title,
    definitionId: card.catalogCardId,
    subtypes: card.subtypes,
    rulesText: card.text
  };
  visible.type = card.type as NonNullable<VisibleCard["type"]>;
  const imageUrl = localCardImageUrl(card.catalogCardId);
  if (imageUrl) visible.imageUrl = imageUrl;
  addNumeric(visible, "cost", undefined, card.numeric.cost);
  addNumeric(visible, "installCost", undefined, card.numeric.installCost);
  addNumeric(visible, "memoryCost", undefined, card.numeric.memoryCost);
  addNumeric(visible, "strength", undefined, card.numeric.strength);
  addNumeric(visible, "rezCost", undefined, card.numeric.rezCost);
  addNumeric(visible, "trashCost", undefined, card.numeric.trashCost);
  addNumeric(visible, "advancementRequirement", undefined, card.numeric.advancementRequirement);
  addNumeric(visible, "agendaPoints", undefined, card.numeric.agendaPoints);
  return visible;
}

function addNumeric(target: VisibleCard, key: keyof Pick<VisibleCard, "cost" | "installCost" | "memoryCost" | "strength" | "rezCost" | "trashCost" | "advancementRequirement" | "agendaPoints">, current: number | undefined, fallback: number | null | undefined): void {
  if (current !== undefined || fallback === null || fallback === undefined) return;
  target[key] = fallback;
}

function accessRevealFromLatestEvent(event: PublicGameEvent | undefined, detailsById: Record<string, CatalogCardDetail>, legalActions: LegalAction[]): AccessReveal | null {
  if (!event || event.publicPayload.actionType !== "access_card") return null;
  const cardId = payloadString(event.publicPayload, "cardDefinitionId");
  const title = payloadString(event.publicPayload, "title");
  if (!cardId || !title) return null;
  const detail = detailsById[cardId] ?? null;
  const card = detail ? visibleCardFromCatalogDetail(detail) : visibleCardFromPublicEvent(event, cardId, title);
  const serverLabel = serverDisplayLabel(payloadString(event.publicPayload, "serverLabel") ?? "einen Server");
  const actions = legalActions.filter((action) => ["steal_agenda", "trash_accessed_card", "decline_trash"].includes(action.type));
  return {
    eventId: event.eventId,
    serverLabel,
    serverTitleLabel: accessServerTitleLabel(serverLabel),
    serverLocationPhrase: accessServerLocationPhrase(serverLabel),
    card,
    actions,
    trashStatus: accessTrashStatus(card, actions)
  };
}

function visibleCardFromPublicEvent(event: PublicGameEvent, cardId: string, title: string): DisplayVisibleCard {
  const card: DisplayVisibleCard = {
    instanceId: `access-${event.eventId}-${cardId}`,
    known: true,
    title,
    definitionId: cardId
  };
  const imageUrl = localCardImageUrl(cardId);
  if (imageUrl) card.imageUrl = imageUrl;
  return card;
}

function payloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function accessTrashStatus(card: DisplayVisibleCard, actions: LegalAction[]): string {
  if (actions.some((action) => action.type === "steal_agenda")) return "Diese Agenda kann jetzt gestohlen werden.";
  if (actions.some((action) => action.type === "trash_accessed_card")) return "Du kannst diese Karte jetzt trashen oder den Zugriff abschließen.";
  if (card.type === "asset" || card.type === "upgrade") return "Du hast aktuell nicht genug Credits, um die Trash-Kosten zu bezahlen. Du kannst den Zugriff abschließen.";
  if (actions.some((action) => action.type === "decline_trash")) return "Diese Karte hat keine Trash-Kosten. Du kannst den Zugriff abschließen.";
  return "Diese Karte hat keine Trash-Kosten. Der Zugriff ist abgeschlossen.";
}

function accessServerTitleLabel(serverLabel: string): string {
  if (serverLabel === "HQ") return "Hauptquartier (HQ)";
  return serverLabel;
}

function accessServerLocationPhrase(serverLabel: string): string {
  if (serverLabel === "HQ") return "im Hauptquartier (HQ)";
  if (serverLabel === "Archive") return "im Archiv";
  if (/^Außenserver \d+$/.test(serverLabel)) return `im ${serverLabel}`;
  return `in ${serverLabel}`;
}

function catalogTypeKeysForCard(card: Pick<CatalogCardSummary, "type" | "subtypes">): CatalogTypeFilterKey[] {
  if (card.type === "program" && card.subtypes.some((subtype) => subtype.toLowerCase() === "icebreaker")) return ["icebreaker"];
  switch (card.type) {
    case "ice":
    case "agenda":
    case "asset":
    case "upgrade":
    case "operation":
    case "event":
    case "hardware":
    case "resource":
    case "program":
      return [card.type];
    default:
      return [];
  }
}

function isCatalogVisibleCard(card: CatalogCardSummary): boolean {
  return card.type !== "identity";
}

function catalogCardMatchesTypeFilters(card: CatalogCardSummary, filters: CatalogTypeFilterState): boolean {
  const keys = catalogTypeKeysForCard(card);
  if (keys.length === 0) return true;
  return keys.some((key) => filters[key]);
}

function summarizeCatalogTypeFilters(cards: CatalogCardSummary[]): Partial<Record<CatalogTypeFilterKey, number>> {
  const counts: Partial<Record<CatalogTypeFilterKey, number>> = {};
  for (const card of cards) {
    for (const key of catalogTypeKeysForCard(card)) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

function summarizeCatalogStatuses(cards: CatalogCardSummary[]): Partial<Record<CatalogStatusKey, number>> {
  const counts: Partial<Record<CatalogStatusKey, number>> = {};
  for (const card of cards) {
    for (const key of Object.keys(CATALOG_STATUS_LABELS) as CatalogStatusKey[]) {
      if (card.statuses[key]) counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

function deckBuilderCardGroup(card: CatalogCardSummary | null): string {
  if (!card) return "Unbekannte Karten";
  const key = catalogTypeKeysForCard(card)[0];
  const labels = [...RUNNER_CATALOG_TYPE_FILTERS, ...CORP_CATALOG_TYPE_FILTERS];
  return labels.find((filter) => filter.key === key)?.label ?? formatCatalogTerm(card.type);
}

function deckBuilderMetricLine(detail: CatalogCardDetail | undefined): string {
  if (!detail) return "";
  return Object.entries(CATALOG_NUMERIC_LABELS)
    .map(([key, label]) => {
      const value = detail.numeric[key];
      return catalogNumericLabel(key, label, value);
    })
    .filter(Boolean)
    .join(" · ");
}

function deckBuilderCardTooltip(card: CatalogCardSummary, detail: CatalogCardDetail | undefined): string {
  return [card.title, formatCatalogTypeLine(card), detail ? deckBuilderMetricLine(detail) : "", detail?.text ?? ""].filter(Boolean).join("\n");
}

function deckFingerprint(deck: EditableDeck): string {
  return JSON.stringify({
    name: deck.name,
    side: deck.side,
    identityCardId: deck.identityCardId,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    formatProfileId: deck.formatProfileId,
    notes: deck.notes ?? "",
    cards: [...deck.cards].sort((left, right) => left.cardId.localeCompare(right.cardId))
  });
}

function deckMetadataFromEditable(deck: EditableDeck | null): DeckPublicMetadata | undefined {
  if (!deck) return undefined;
  return {
    side: deck.side,
    identityCardId: deck.identityCardId,
    deckName: deck.name,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    formatProfileId: deck.formatProfileId,
    deckHash: "wird beim Start geprüft"
  };
}

function serverLanesForSide(side: Side, server: PlayerView["servers"][number]): Array<{ kind: "ice" | "root"; label: "ICE" | "Root"; cards: VisibleCard[] }> {
  const iceLane = { kind: "ice" as const, label: "ICE" as const, cards: server.ice };
  const rootLane = { kind: "root" as const, label: "Root" as const, cards: server.root };
  return side === "runner" ? [rootLane, iceLane] : [iceLane, rootLane];
}

function opponentSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function sideLabel(side: Side): string {
  return side === "corp" ? "Corp" : "Runner";
}

function updateActionSlotCapacity(capacities: Record<Side, number>, side: Side, currentClicks: number, active: boolean, resetActiveSide: boolean): void {
  const baseCapacity = baseActionSlotCapacity(side);
  const safeClicks = Math.max(0, Math.floor(currentClicks));
  if (active && resetActiveSide) {
    capacities[side] = Math.max(baseCapacity, safeClicks);
    return;
  }
  if (active) {
    capacities[side] = Math.max(capacities[side] ?? baseCapacity, safeClicks);
    return;
  }
  if (safeClicks > (capacities[side] ?? baseCapacity)) capacities[side] = safeClicks;
}

function centralServerCardCount(view: PlayerView, serverId: PlayerView["servers"][number]["id"]): number | null {
  switch (serverId) {
    case "hq":
      return view.side === "corp" ? view.own.gripOrHq.length : view.opponent.handCount;
    case "rd":
      return view.side === "corp" ? view.own.stackOrRdCount : view.opponent.deckCount;
    case "archives":
      return view.side === "corp" ? view.own.heapOrArchives.length : (view.opponent.discardCount ?? 0);
    default:
      return null;
  }
}

function serverHighlighted(highlight: BoardHighlight | null, serverId: string): boolean {
  if (!highlight) return false;
  if (highlight.kind === "server" || highlight.kind === "run") return Boolean(highlight.serverId && highlight.serverId === serverId);
  return false;
}

function zoneHighlighted(highlight: BoardHighlight | null, side: Side, zone: "hq" | "rd" | "archives" | "grip" | "stack" | "heap" | "rig" | "scoreArea"): boolean {
  return Boolean(highlight?.kind === "zone" && highlight.side === side && highlight.zone === zone);
}

function chronicleContextByEventId(events: PublicGameEvent[], detailsById: Record<string, CatalogCardDetail>): Record<string, Omit<ChronicleContext, "side">> {
  return Object.fromEntries(
    events.map((event) => {
      const card = eventCardDetail(event, detailsById);
      return [
        event.eventId,
        {
          cardTitle: card?.title ?? null,
          cardText: card?.text ?? null,
          cardType: card?.type ?? null,
          cardDetailLines: card ? catalogDetailLines(card) : [],
          agendaPoints: typeof card?.numeric.agendaPoints === "number" ? card.numeric.agendaPoints : null
        }
      ];
    })
  );
}

function formatCardCount(count: number): string {
  return `${count} ${count === 1 ? "Karte" : "Karten"}`;
}

export default function Page() {
  const [entryTab, setEntryTab] = useState<EntryTab>("play");
  const [mode, setMode] = useState<"host" | "join">("host");
  const [playMode, setPlayMode] = useState<PlayMode>("human_vs_human");
  const [humanSideSelection, setHumanSideSelection] = useState<HumanSideSelection>("random");
  const [humanAiSideSelection, setHumanAiSideSelection] = useState<HumanAiSideSelection>("random");
  const [matchFormat, setMatchFormat] = useState<MatchFormat>("rules_match");
  const [runnerDifficulty, setRunnerDifficulty] = useState<AiDifficulty>("normal");
  const [corpDifficulty, setCorpDifficulty] = useState<AiDifficulty>("normal");
  const [aiDeckPolicy, setAiDeckPolicy] = useState<AiDeckPolicy>("selected");
  const [testSetupMode, setTestSetupMode] = useState(false);
  const [displayName, setDisplayName] = useState("Teilnehmer A");
  const [countdownSeconds, setCountdownSeconds] = useState<3 | 5 | 10>(3);
  const [seed, setSeed] = useState("mvp-0.3-ai-demo");
  const [joinMatchId, setJoinMatchId] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [payload, setPayload] = useState<ClientPayload | null>(null);
  const [lobby, setLobby] = useState<LobbyClientPayload | null>(null);
  const [lobbyChatText, setLobbyChatText] = useState("");
  const [simulation, setSimulation] = useState<AiSimulationSummary | null>(null);
  const [connection, setConnection] = useState<"offline" | "connecting" | "online">("offline");
  const [notice, setNotice] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSide, setCatalogSide] = useState<Side | "all">("all");
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatusKey | "all">("all");
  const [catalogTypeFilters, setCatalogTypeFilters] = useState<CatalogTypeFilterState>({ ...ALL_CATALOG_TYPE_FILTERS });
  const [catalogCards, setCatalogCards] = useState<CatalogCardSummary[]>([]);
  const [catalogFilters, setCatalogFilters] = useState<CatalogListResponse["filters"] | null>(null);
  const [catalogSummary, setCatalogSummary] = useState<Partial<Record<CatalogStatusKey, number>>>({});
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [catalogDetail, setCatalogDetail] = useState<CatalogCardDetail | null>(null);
  const [allCatalogCards, setAllCatalogCards] = useState<CatalogCardSummary[]>([]);
  const [catalogDetailsById, setCatalogDetailsById] = useState<Record<string, CatalogCardDetail>>({});
  const [deckSnapshots, setDeckSnapshots] = useState<DeckSnapshot[]>([]);
  const [deckTemplates, setDeckTemplates] = useState<DeckTemplate[]>([]);
  const [runnerDeckSource, setRunnerDeckSource] = useState<"snapshot" | "local">("snapshot");
  const [corpDeckSource, setCorpDeckSource] = useState<"snapshot" | "local">("snapshot");
  const [participantBRunnerDeckSource, setParticipantBRunnerDeckSource] = useState<"snapshot" | "local">("snapshot");
  const [participantBCorpDeckSource, setParticipantBCorpDeckSource] = useState<"snapshot" | "local">("snapshot");
  const [selectedRunnerSnapshotId, setSelectedRunnerSnapshotId] = useState(DEFAULT_RUNNER_SNAPSHOT_ID);
  const [selectedCorpSnapshotId, setSelectedCorpSnapshotId] = useState(DEFAULT_CORP_SNAPSHOT_ID);
  const [selectedParticipantBRunnerSnapshotId, setSelectedParticipantBRunnerSnapshotId] = useState(DEFAULT_RUNNER_SNAPSHOT_ID);
  const [selectedParticipantBCorpSnapshotId, setSelectedParticipantBCorpSnapshotId] = useState(DEFAULT_CORP_SNAPSHOT_ID);
  const [selectedRunnerLocalDeckId, setSelectedRunnerLocalDeckId] = useState("");
  const [selectedCorpLocalDeckId, setSelectedCorpLocalDeckId] = useState("");
  const [selectedParticipantBRunnerLocalDeckId, setSelectedParticipantBRunnerLocalDeckId] = useState("");
  const [selectedParticipantBCorpLocalDeckId, setSelectedParticipantBCorpLocalDeckId] = useState("");
  const [runnerLocalSnapshot, setRunnerLocalSnapshot] = useState<DeckSnapshot | null>(null);
  const [corpLocalSnapshot, setCorpLocalSnapshot] = useState<DeckSnapshot | null>(null);
  const [localDecks, setLocalDecks] = useState<EditableDeck[]>([]);
  const [localDecksLoaded, setLocalDecksLoaded] = useState(false);
  const [savedDeckFingerprints, setSavedDeckFingerprints] = useState<Record<string, string>>({});
  const [selectedLocalDeckId, setSelectedLocalDeckId] = useState<string | null>(null);
  const [deckValidation, setDeckValidation] = useState<DeckValidationResult | null>(null);
  const [validatedSnapshot, setValidatedSnapshot] = useState<DeckSnapshot | null>(null);
  const [deckImportText, setDeckImportText] = useState("");
  const [deckExportText, setDeckExportText] = useState("");
  const [cardDisplayMode, setCardDisplayMode] = useState<CardDisplayMode>("placeholder");
  const [focusedCard, setFocusedCard] = useState<FocusedCard | null>(null);
  const [dismissedAccessEventId, setDismissedAccessEventId] = useState<string | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("black");
  const [colorSchemeLoaded, setColorSchemeLoaded] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.45);
  const [localAiPacingMode, setLocalAiPacingMode] = useState<AiPacingMode>("paced");
  const [actionCueQueue, setActionCueQueue] = useState<OpponentActionCue[]>([]);
  const [currentActionCue, setCurrentActionCue] = useState<OpponentActionCue | null>(null);
  const [dismissedResultKey, setDismissedResultKey] = useState<string | null>(null);
  const [seriesTransitioning, setSeriesTransitioning] = useState(false);
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [cuePosition, setCuePosition] = useState<CuePositionPreference>(DEFAULT_CUE_POSITION);
  const [selectedActionContext, setSelectedActionContext] = useState<ActionContext | null>(null);
  const [actionSlotCapacities, setActionSlotCapacities] = useState<Record<Side, number>>({
    runner: baseActionSlotCapacity("runner"),
    corp: baseActionSlotCapacity("corp")
  });
  const [recentSession, setRecentSession] = useState<RecentSessionInfo | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const resultAudioPrimedRef = useRef(false);
  const lastAudioResultKeyRef = useRef<string | null>(null);
  const lastSeenCueEventIdRef = useRef<string | null>(null);
  const pendingAiAdvanceKeyRef = useRef<string | null>(null);
  const lastActionSlotTurnRef = useRef<{ matchId: string; activeSide: Side } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("matchId");
    const token = params.get("joinToken");
    const storedDisplayName = window.localStorage.getItem(DISPLAY_NAME_STORAGE_KEY)?.trim();
    if (matchId && token) {
      setEntryTab("play");
      setMode("join");
      setJoinMatchId(matchId);
      setJoinToken(token);
      setDisplayName(storedDisplayName || "Teilnehmer B");
      return;
    }
    if (storedDisplayName) setDisplayName(storedDisplayName);
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      setRecentSession(loadRecentSession());
      return;
    }
    const parsed = JSON.parse(stored) as SessionInfo;
    setSession(parsed);
    void bootstrap(parsed).then((bootstrapped) => {
      if (bootstrapped && "playerView" in bootstrapped) {
        setPayload(bootstrapped);
        setLobby(null);
      } else if (bootstrapped) {
        setLobby(bootstrapped);
        setPayload(null);
      }
      else setNotice("Session konnte nicht geladen werden.");
    });
  }, []);

  useEffect(() => {
    const storedScheme = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    if (storedScheme === "black" || storedScheme === "white") {
      document.documentElement.dataset.theme = storedScheme;
      setColorScheme(storedScheme);
    } else {
      document.documentElement.dataset.theme = "black";
    }
    setColorSchemeLoaded(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = colorScheme;
    if (colorSchemeLoaded) window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, colorScheme);
  }, [colorScheme, colorSchemeLoaded]);

  useEffect(() => {
    const storedDecks = window.localStorage.getItem(DECK_STORAGE_KEY);
    if (storedDecks) {
      try {
        const parsed = JSON.parse(storedDecks) as EditableDeck[];
        setLocalDecks(parsed);
        setSelectedLocalDeckId(parsed[0]?.deckId ?? null);
        setSavedDeckFingerprints(Object.fromEntries(parsed.map((deck) => [deck.deckId, deckFingerprint(deck)])));
        setSelectedRunnerLocalDeckId(parsed.find((deck) => deck.side === "runner")?.deckId ?? "");
        setSelectedCorpLocalDeckId(parsed.find((deck) => deck.side === "corp")?.deckId ?? "");
        setSelectedParticipantBRunnerLocalDeckId(parsed.find((deck) => deck.side === "runner")?.deckId ?? "");
        setSelectedParticipantBCorpLocalDeckId(parsed.find((deck) => deck.side === "corp")?.deckId ?? "");
        if (parsed.some((deck) => deck.side === "runner")) {
          setRunnerDeckSource("local");
          setParticipantBRunnerDeckSource("local");
        }
        if (parsed.some((deck) => deck.side === "corp")) {
          setCorpDeckSource("local");
          setParticipantBCorpDeckSource("local");
        }
      } catch {
        window.localStorage.removeItem(DECK_STORAGE_KEY);
      }
    }
    setLocalDecksLoaded(true);
  }, []);

  useEffect(() => {
    if (!localDecksLoaded) return;
    if (!selectedRunnerLocalDeckId) setSelectedRunnerLocalDeckId(localDecks.find((deck) => deck.side === "runner")?.deckId ?? "");
    if (!selectedCorpLocalDeckId) setSelectedCorpLocalDeckId(localDecks.find((deck) => deck.side === "corp")?.deckId ?? "");
    if (!selectedParticipantBRunnerLocalDeckId) setSelectedParticipantBRunnerLocalDeckId(localDecks.find((deck) => deck.side === "runner")?.deckId ?? "");
    if (!selectedParticipantBCorpLocalDeckId) setSelectedParticipantBCorpLocalDeckId(localDecks.find((deck) => deck.side === "corp")?.deckId ?? "");
  }, [localDecks, localDecksLoaded, selectedRunnerLocalDeckId, selectedCorpLocalDeckId, selectedParticipantBRunnerLocalDeckId, selectedParticipantBCorpLocalDeckId]);

  useEffect(() => {
    const storedAudio = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!storedAudio) return;
    try {
      const parsed = JSON.parse(storedAudio) as { enabled?: boolean; volume?: number };
      setAudioEnabled(Boolean(parsed.enabled));
      if (typeof parsed.volume === "number") setAudioVolume(Math.min(1, Math.max(0, parsed.volume)));
    } catch {
      window.localStorage.removeItem(AUDIO_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({ enabled: audioEnabled, volume: audioVolume }));
  }, [audioEnabled, audioVolume]);

  useEffect(() => {
    setCuePosition(parseCuePositionPreference(window.localStorage.getItem(ACTION_CUE_POSITION_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ACTION_CUE_POSITION_STORAGE_KEY, serializeCuePositionPreference(cuePosition));
  }, [cuePosition]);

  useEffect(() => {
    if (!session) return;
    connectWebSocket(session);
    return () => socketRef.current?.close();
  }, [session?.matchId, session?.sessionToken]);

  const filteredCatalogCards = useMemo(() => catalogCards.filter((card) => catalogCardMatchesTypeFilters(card, catalogTypeFilters)), [catalogCards, catalogTypeFilters]);
  const catalogTypeCounts = useMemo(() => summarizeCatalogTypeFilters(catalogCards), [catalogCards]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (catalogSearch.trim()) params.set("q", catalogSearch.trim());
    if (catalogSide !== "all") params.set("side", catalogSide);
    if (catalogStatus !== "all") params.set("status", catalogStatus);
    void fetch(`/api/cards/catalog?${params.toString()}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<CatalogListResponse>)
      .then((data) => {
        const visibleCards = (data.cards ?? []).filter(isCatalogVisibleCard);
        setCatalogCards(visibleCards);
        setCatalogFilters(data.filters ?? null);
        setCatalogSummary(summarizeCatalogStatuses(visibleCards));
        setSelectedCatalogId((current) => (current && visibleCards.some((card) => card.catalogCardId === current) ? current : visibleCards[0]?.catalogCardId ?? null));
      })
      .catch(() => {
        setCatalogCards([]);
        setCatalogFilters(null);
        setCatalogSummary({});
        setSelectedCatalogId(null);
      });
  }, [catalogSearch, catalogSide, catalogStatus]);

  useEffect(() => {
    setSelectedCatalogId((current) => (current && filteredCatalogCards.some((card) => card.catalogCardId === current) ? current : filteredCatalogCards[0]?.catalogCardId ?? null));
  }, [filteredCatalogCards]);

  useEffect(() => {
    if (!selectedCatalogId) {
      setCatalogDetail(null);
      return;
    }
    void fetch(`/api/cards/catalog/${encodeURIComponent(selectedCatalogId)}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<{ card?: CatalogCardDetail }>)
      .then((data) => setCatalogDetail(data.card ?? null))
      .catch(() => setCatalogDetail(null));
  }, [selectedCatalogId]);

  useEffect(() => {
    const eventIds = (payload?.eventTail ?? []).map(revealedEventCardId).filter((value): value is string => Boolean(value));
    const visibleIds = visibleKnownCardIds(payload?.playerView);
    const missingIds = Array.from(new Set([...eventIds, ...visibleIds])).filter((cardId) => !catalogDetailsById[cardId]);
    if (missingIds.length === 0) return;
    let cancelled = false;
    void Promise.all(
      missingIds.map((cardId) =>
        fetch(`/api/cards/catalog/${encodeURIComponent(cardId)}`, { cache: "no-store" })
          .then((response) => response.json() as Promise<{ card?: CatalogCardDetail }>)
          .then((data) => data.card)
          .catch(() => null)
      )
    ).then((details) => {
      if (cancelled) return;
      setCatalogDetailsById((current) => {
        const next = { ...current };
        details.forEach((detail) => {
          if (detail) next[detail.catalogCardId] = detail;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [payload?.eventTail, payload?.playerView, catalogDetailsById]);

  useEffect(() => {
    void fetch("/api/cards/catalog", { cache: "no-store" })
      .then((response) => response.json() as Promise<CatalogListResponse>)
      .then((data) => setAllCatalogCards((data.cards ?? []).filter(isCatalogVisibleCard)))
      .catch(() => setAllCatalogCards([]));
    void fetch("/api/decks/snapshots", { cache: "no-store" })
      .then((response) => response.json() as Promise<DeckSnapshotsResponse>)
      .then((data) => {
        setDeckSnapshots(data.snapshots ?? []);
        if (!data.snapshots?.some((snapshot) => snapshot.deckSnapshotId === DEFAULT_RUNNER_SNAPSHOT_ID)) setSelectedRunnerSnapshotId(data.snapshots?.find((snapshot) => snapshot.side === "runner")?.deckSnapshotId ?? "");
        if (!data.snapshots?.some((snapshot) => snapshot.deckSnapshotId === DEFAULT_CORP_SNAPSHOT_ID)) setSelectedCorpSnapshotId(data.snapshots?.find((snapshot) => snapshot.side === "corp")?.deckSnapshotId ?? "");
        if (!data.snapshots?.some((snapshot) => snapshot.deckSnapshotId === DEFAULT_RUNNER_SNAPSHOT_ID)) setSelectedParticipantBRunnerSnapshotId(data.snapshots?.find((snapshot) => snapshot.side === "runner")?.deckSnapshotId ?? "");
        if (!data.snapshots?.some((snapshot) => snapshot.deckSnapshotId === DEFAULT_CORP_SNAPSHOT_ID)) setSelectedParticipantBCorpSnapshotId(data.snapshots?.find((snapshot) => snapshot.side === "corp")?.deckSnapshotId ?? "");
      })
      .catch(() => setDeckSnapshots([]));
    void fetch("/api/decks/templates", { cache: "no-store" })
      .then((response) => response.json() as Promise<DeckTemplatesResponse>)
      .then((data) => setDeckTemplates(data.templates ?? []))
      .catch(() => setDeckTemplates([]));
  }, []);

  const activeView = payload?.playerView;
  const latestEventId = payload?.eventTail.at(-1)?.eventId;
  const canReconnect = Boolean(session?.reconnectToken);
  const runnerSnapshots = deckSnapshots.filter((snapshot) => snapshot.side === "runner" && snapshot.validation.ok);
  const corpSnapshots = deckSnapshots.filter((snapshot) => snapshot.side === "corp" && snapshot.validation.ok);
  const defaultCorpSnapshot = corpSnapshots.find((snapshot) => snapshot.deckSnapshotId === DEFAULT_CORP_SNAPSHOT_ID) ?? corpSnapshots[0] ?? null;
  const selectedRunnerSnapshot = deckSnapshots.find((snapshot) => snapshot.deckSnapshotId === selectedRunnerSnapshotId) ?? runnerSnapshots[0] ?? null;
  const selectedCorpSnapshot = deckSnapshots.find((snapshot) => snapshot.deckSnapshotId === selectedCorpSnapshotId) ?? defaultCorpSnapshot;
  const selectedParticipantBRunnerSnapshot = deckSnapshots.find((snapshot) => snapshot.deckSnapshotId === selectedParticipantBRunnerSnapshotId) ?? runnerSnapshots[0] ?? null;
  const selectedParticipantBCorpSnapshot = deckSnapshots.find((snapshot) => snapshot.deckSnapshotId === selectedParticipantBCorpSnapshotId) ?? corpSnapshots[0] ?? null;
  const runnerLocalDeck = localDecks.find((deck) => deck.deckId === selectedRunnerLocalDeckId && deck.side === "runner") ?? null;
  const corpLocalDeck = localDecks.find((deck) => deck.deckId === selectedCorpLocalDeckId && deck.side === "corp") ?? null;
  const participantBRunnerLocalDeck = localDecks.find((deck) => deck.deckId === selectedParticipantBRunnerLocalDeckId && deck.side === "runner") ?? null;
  const participantBCorpLocalDeck = localDecks.find((deck) => deck.deckId === selectedParticipantBCorpLocalDeckId && deck.side === "corp") ?? null;
  const participantARunnerMetadata = runnerDeckSource === "local" ? deckMetadataFromEditable(runnerLocalDeck) : selectedRunnerSnapshot?.publicMetadata;
  const participantACorpMetadata = corpDeckSource === "local" ? deckMetadataFromEditable(corpLocalDeck) : selectedCorpSnapshot?.publicMetadata;
  const participantBRunnerMetadata = participantBRunnerDeckSource === "local" ? deckMetadataFromEditable(participantBRunnerLocalDeck) : selectedParticipantBRunnerSnapshot?.publicMetadata;
  const participantBCorpMetadata = participantBCorpDeckSource === "local" ? deckMetadataFromEditable(participantBCorpLocalDeck) : selectedParticipantBCorpSnapshot?.publicMetadata;
  const matchStart = deriveMatchStart({ playMode, humanSideSelection, humanAiSideSelection });
  const gameMode: GameMode = matchStart.isSimulation ? "ai_vs_ai" : matchStart.technicalMode ?? (playMode === "human_vs_ai" ? "human_runner_vs_corp_ai" : "human_vs_human");
  const hasAiOpponent = matchStart.hasAiOpponent;
  const isHumanVsHuman = playMode === "human_vs_human";
  const isHumanVsAi = playMode === "human_vs_ai";
  const aiSlotDisabled = hasAiOpponent && aiDeckPolicy !== "selected";
  const selectedLocalDeck = localDecks.find((deck) => deck.deckId === selectedLocalDeckId) ?? null;
  const selectedDeckDirty = selectedLocalDeck ? savedDeckFingerprints[selectedLocalDeck.deckId] !== deckFingerprint(selectedLocalDeck) : false;
  const playableCatalogCards = useMemo(
    () => allCatalogCards.filter((card) => card.statuses.playable && card.statuses.deck_legal && (!selectedLocalDeck || card.side === selectedLocalDeck.side) && card.type !== "identity"),
    [allCatalogCards, selectedLocalDeck?.side]
  );
  const gripPreviewCard = activeView?.own.gripOrHq.find((card) => card.known) ?? null;
  const rigPreviewCard = activeView?.own.rig?.find((card) => card.known) ?? null;
  const previewSelection =
    focusedCard ??
    (activeView?.run?.encounteredIce ? { card: activeView.run.encounteredIce, hiddenSide: "corp" as const } : null) ??
    (gripPreviewCard ? { card: gripPreviewCard } : null) ??
    (rigPreviewCard ? { card: rigPreviewCard } : null);
  const previewCard = previewSelection?.card ?? null;
  const previewHiddenSide = previewSelection?.hiddenSide;
  const enrichCard = (card: VisibleCard) => enrichVisibleCard(card, catalogDetailsById);
  const enrichedPreviewCard = previewCard ? enrichCard(previewCard) : null;
  const focusCard = (card: DisplayVisibleCard, hiddenSide?: Side) => setFocusedCard({ card, ...(hiddenSide ? { hiddenSide } : {}) });
  const selectActionCard = (card: DisplayVisibleCard, hiddenSide?: Side) => {
    focusCard(card, hiddenSide);
    if (card.known) {
      setSelectedActionContext((current) => (current?.kind === "card" && current.id === card.instanceId ? null : { kind: "card", id: card.instanceId, label: card.title ?? "Karte" }));
    }
  };
  const accessReveal = payload ? accessRevealFromLatestEvent(payload.eventTail.at(-1), catalogDetailsById, payload.legalActions) : null;
  const showAccessReveal = Boolean(accessReveal && dismissedAccessEventId !== accessReveal.eventId);
  const resultSummary = payload?.resultSummary ?? null;
  const resultKey = resultSummary ? `${payload?.matchId ?? "match"}:${resultSummary.finalStateHash}` : null;
  const showResultModal = Boolean(resultSummary && resultKey && dismissedResultKey !== resultKey);
  const opponentDisplayName = payload?.opponentStatus.displayName ?? lobby?.opponentStatus.displayName ?? null;
  const canForfeit = Boolean(payload && payload.matchStatus === "active" && !payload.winner);
  const activeCueHighlight = currentActionCue?.highlight ?? null;
  const hasDecisionCue = Boolean(currentActionCue?.requiresLocalAttention || activeView?.pendingChoice || (activeView?.activeSide === activeView?.side && payload?.legalActions.length));
  const legalActionSplit = useMemo(() => splitLegalActions(payload?.legalActions ?? []), [payload?.legalActions]);
  const selectedPanelContext = selectedActionContext?.kind === "server" ? selectedActionContext : null;
  const selectedPanelContextActions = selectedPanelContext ? legalActionSplit.contextualActions.filter((action) => actionMatchesContext(action, selectedPanelContext)) : [];
  const cardActionsFor = (card: VisibleCard): LegalAction[] => {
    if (!card.known) return [];
    return legalActionSplit.contextualActions.filter((action) => actionMatchesContext(action, { kind: "card", id: card.instanceId, label: card.title ?? "Karte" }));
  };
  const runActionForServer = (serverId: string): LegalAction | null => {
    const serverContext = { kind: "server" as const, id: serverId, label: serverDisplayLabel(serverId) };
    const runActions = legalActionSplit.contextualActions.filter((action) => action.type === "start_run" && actionMatchesContext(action, serverContext));
    return runActions.length === 1 ? runActions[0]! : null;
  };
  const activeRunTargetIds = activeView ? runTargetServerIds(activeView) : [];
  const effectiveCurrentCorpSnapshot = currentCorpSnapshotForSetup();
  const effectiveAgendaTarget = matchFormat === "single_game" ? effectiveCurrentCorpSnapshot?.validation.agendaPoints ?? undefined : 7;

  useEffect(() => {
    if (!selectedActionContext) return;
    if (!activeView || payload?.winner || !actionContextStillVisible(selectedActionContext, activeView)) setSelectedActionContext(null);
  }, [activeView, payload?.winner, selectedActionContext]);

  useEffect(() => {
    if (!payload || !activeView) return;
    const ownSide = activeView.side;
    const opponent = opponentSide(ownSide);
    const turnKey = { matchId: payload.matchId, activeSide: activeView.activeSide };
    const previousTurnKey = lastActionSlotTurnRef.current;
    const resetActiveSide = !previousTurnKey || previousTurnKey.matchId !== turnKey.matchId || previousTurnKey.activeSide !== turnKey.activeSide;
    lastActionSlotTurnRef.current = turnKey;

    setActionSlotCapacities((current) => {
      const next = { ...current };
      updateActionSlotCapacity(next, ownSide, activeView.own.clicks, activeView.activeSide === ownSide, resetActiveSide);
      updateActionSlotCapacity(next, opponent, activeView.opponent.clicks, activeView.activeSide === opponent, resetActiveSide);
      return next.runner === current.runner && next.corp === current.corp ? current : next;
    });
  }, [activeView?.activeSide, activeView?.own.clicks, activeView?.opponent.clicks, activeView?.side, payload?.matchId, payload?.playerView.stateVersion]);

  useEffect(() => {
    if (entryTab !== "decks" || playableCatalogCards.length === 0) return;
    const missingIds = playableCatalogCards.map((card) => card.catalogCardId).filter((cardId) => !catalogDetailsById[cardId]);
    if (missingIds.length === 0) return;
    let cancelled = false;
    void Promise.all(
      missingIds.map((cardId) =>
        fetch(`/api/cards/catalog/${encodeURIComponent(cardId)}`, { cache: "no-store" })
          .then((response) => response.json() as Promise<{ card?: CatalogCardDetail }>)
          .then((data) => data.card)
          .catch(() => null)
      )
    ).then((details) => {
      if (cancelled) return;
      setCatalogDetailsById((current) => {
        const next = { ...current };
        details.forEach((detail) => {
          if (detail) next[detail.catalogCardId] = detail;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [entryTab, playableCatalogCards, catalogDetailsById]);

  useEffect(() => {
    if (!resultKey || !resultSummary) {
      resultAudioPrimedRef.current = true;
      return;
    }
    if (!resultAudioPrimedRef.current) {
      lastAudioResultKeyRef.current = resultKey;
      return;
    }
    if (!audioEnabled || lastAudioResultKeyRef.current === resultKey) return;
    lastAudioResultKeyRef.current = resultKey;
    playResultSound(seriesAudioOutcome(resultSummary), audioVolume);
  }, [audioEnabled, audioVolume, resultKey, resultSummary]);

  useEffect(() => {
    lastSeenCueEventIdRef.current = payload?.eventTail.at(-1)?.eventId ?? null;
    setActionCueQueue([]);
    setCurrentActionCue(null);
    pendingAiAdvanceKeyRef.current = null;
  }, [session?.matchId, session?.sessionToken]);

  useEffect(() => {
    if (!payload) return;
    const latestId = payload.eventTail.at(-1)?.eventId ?? null;
    const lastSeen = lastSeenCueEventIdRef.current;
    if (lastSeen === null) {
      lastSeenCueEventIdRef.current = latestId;
      return;
    }
    const cues = deriveOpponentActionCues({
      viewerSide: payload.side,
      playerView: payload.playerView,
      events: payload.eventTail,
      lastPresentedEventId: lastSeen,
      contextByEventId: chronicleContextByEventId(payload.eventTail, catalogDetailsById)
    });
    lastSeenCueEventIdRef.current = latestId;
    if (cues.length > 0) setActionCueQueue((current) => [...current, ...cues]);
  }, [payload?.eventTail, payload?.playerView.stateVersion, payload?.side, catalogDetailsById]);

  useEffect(() => {
    if (currentActionCue || actionCueQueue.length === 0) return;
    const [nextCue, ...rest] = actionCueQueue;
    if (!nextCue) return;
    setCurrentActionCue(nextCue);
    setActionCueQueue(rest);
  }, [actionCueQueue, currentActionCue]);

  useEffect(() => {
    if (!currentActionCue) return;
    if (audioEnabled && currentActionCue.sound) playActionCueSound(currentActionCue.sound, audioVolume);
    if (currentActionCue.requiresLocalAttention) return;
    const timeout = window.setTimeout(() => setCurrentActionCue(null), currentActionCue.importance === "critical" ? 2300 : 1700);
    return () => window.clearTimeout(timeout);
  }, [audioEnabled, audioVolume, currentActionCue]);

  useEffect(() => {
    if (!payload?.aiTurnPresentation?.canAdvanceAi || payload.winner || connection !== "online") return;
    if (localAiPacingMode === "manual") return;
    if (currentActionCue || actionCueQueue.length > 0) return;
    const advanceKey = `${payload.matchId}:${payload.matchVersion}:${payload.playerView.stateVersion}:${localAiPacingMode}`;
    if (pendingAiAdvanceKeyRef.current === advanceKey) return;
    pendingAiAdvanceKeyRef.current = advanceKey;
    const timeout = window.setTimeout(() => {
      advanceAi(localAiPacingMode === "fast" ? "until_human" : "single_step");
    }, localAiPacingMode === "fast" ? 120 : 650);
    return () => window.clearTimeout(timeout);
  }, [actionCueQueue.length, connection, currentActionCue, localAiPacingMode, payload?.aiTurnPresentation?.canAdvanceAi, payload?.matchId, payload?.matchVersion, payload?.playerView.stateVersion, payload?.winner]);

  const createMatch = async () => {
    setNotice("");
    setSimulation(null);
    if (matchStart.isSimulation) {
      await runSimulation();
      return;
    }
    let deckPayload: Record<string, unknown>;
    try {
      deckPayload = await matchDeckPayload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Deckauswahl ist nicht matchstartfähig.");
      return;
    }
    const created = await postJson<CreateMatchResponse>("/api/matches", {
      ...matchStart.createRequest,
      displayName,
      seed,
      runnerDifficulty,
      corpDifficulty,
      ...(hasAiOpponent ? { aiPacingMode: "paced" } : {}),
      ...(isHumanVsHuman ? { countdownSeconds } : {}),
      settings: {
        matchFormat,
        ...(matchFormat === "single_game" ? {} : { agendaPointsToWin: 7 })
      },
      ...deckPayload
    });
    if (created.error) {
      setNotice(created.error.message);
      return;
    }
    rememberDisplayName(displayName);
    const nextSession: SessionInfo = {
      matchId: created.matchId,
      side: created.hostSide,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
      webSocketUrl: created.webSocketUrl,
      displayName,
      ...(created.pendingDeckHandshake ? { pendingDeckHandshake: true } : {}),
      ...(created.joinUrl ? { joinUrl: created.joinUrl } : {})
    };
    persistSession(nextSession);
    setSession(nextSession);
    if (created.lobby || created.pendingDeckHandshake || !created.playerView) {
      setPayload(null);
      setLobby(lobbyFromInitialResponse(created, created.hostSide));
      setNotice(`Lobby erstellt. Du startest als ${sideLabel(created.hostSide)}.`);
      return;
    }
    setPayload(fromInitialResponse(created, created.hostSide));
    setLobby(null);
    setNotice(`Match erstellt. Du startest als ${sideLabel(created.hostSide)}.`);
  };

  const startNextSeriesGame = async () => {
    if (!session || !resultSummary?.series?.nextAvailable || seriesTransitioning) return;
    setSeriesTransitioning(true);
    setNotice("");
    try {
      const next = await postJson<CreateMatchResponse & { error?: { message: string } }>(`/api/matches/${encodeURIComponent(session.matchId)}/series-next`, {
        side: session.side,
        sessionToken: session.sessionToken,
        displayName: session.displayName
      });
      if (next.error) {
        setNotice(next.error.message);
        return;
      }
      const nextSession: SessionInfo = {
        matchId: next.matchId,
        side: next.hostSide,
        sessionToken: next.hostSessionToken,
        reconnectToken: next.hostReconnectToken,
        webSocketUrl: next.webSocketUrl,
        displayName: session.displayName,
        ...(next.joinUrl ? { joinUrl: next.joinUrl } : {})
      };
      persistSession(nextSession);
      setSession(nextSession);
      setPayload(fromInitialResponse(next, next.hostSide));
      setLobby(null);
      setDismissedResultKey(null);
      setNotice(next.joinUrl ? "Nächstes Serienspiel erstellt. Teile den neuen Join-Link." : "Nächstes Serienspiel erstellt.");
    } finally {
      setSeriesTransitioning(false);
    }
  };

  const runSimulation = async () => {
    setNotice("");
    let deckPayload: Record<string, unknown>;
    try {
      deckPayload = await matchDeckPayload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Deckauswahl ist nicht matchstartfähig.");
      return;
    }
    const result = await postJson<{ summary: AiSimulationSummary }>("/api/simulations/ai-vs-ai", {
      seed,
      runnerDifficulty,
      corpDifficulty,
      ...deckPayload,
      ...(effectiveAgendaTarget ? { agendaPointsToWin: effectiveAgendaTarget } : {}),
      maxActions: 120
    });
    setSimulation(result.summary);
    setNotice("Simulation abgeschlossen.");
  };

  async function matchDeckPayload() {
    if (gameMode === "ai_vs_ai") return await simulationDeckPayload();
    return {
      participantADecks: await deckPairPayload(runnerDeckSource, selectedRunnerSnapshotId, selectedRunnerLocalDeckId, corpDeckSource, selectedCorpSnapshotId, selectedCorpLocalDeckId),
      ...((isHumanVsHuman && testSetupMode) || (isHumanVsAi && aiDeckPolicy === "selected")
        ? {
            participantBDecks: await deckPairPayload(
              participantBRunnerDeckSource,
              selectedParticipantBRunnerSnapshotId,
              selectedParticipantBRunnerLocalDeckId,
              participantBCorpDeckSource,
              selectedParticipantBCorpSnapshotId,
              selectedParticipantBCorpLocalDeckId
            )
          }
        : {}),
      ...(hasAiOpponent ? { aiDeckPolicy } : {})
    };
  }

  async function simulationDeckPayload() {
    if (aiDeckPolicy === "fixed" || aiDeckPolicy === "seeded_random") return { aiDeckPolicy };
    return {
      aiDeckPolicy,
      ...(await deckSidePayload("runner", runnerDeckSource, selectedRunnerSnapshotId, selectedRunnerLocalDeckId)),
      ...(await deckSidePayload("corp", participantBCorpDeckSource, selectedParticipantBCorpSnapshotId, selectedParticipantBCorpLocalDeckId))
    };
  }

  async function currentSideDeckPayload() {
    const runnerSlot =
      gameMode === "human_corp_vs_runner_ai" || (isHumanVsHuman && humanSideSelection === "corp")
        ? { source: participantBRunnerDeckSource, snapshotId: selectedParticipantBRunnerSnapshotId, localDeckId: selectedParticipantBRunnerLocalDeckId }
        : { source: runnerDeckSource, snapshotId: selectedRunnerSnapshotId, localDeckId: selectedRunnerLocalDeckId };
    const corpSlot =
      gameMode === "human_runner_vs_corp_ai" || gameMode === "ai_vs_ai" || (isHumanVsHuman && humanSideSelection !== "corp")
        ? { source: participantBCorpDeckSource, snapshotId: selectedParticipantBCorpSnapshotId, localDeckId: selectedParticipantBCorpLocalDeckId }
        : { source: corpDeckSource, snapshotId: selectedCorpSnapshotId, localDeckId: selectedCorpLocalDeckId };
    return {
      ...(await deckSidePayload("runner", runnerSlot.source, runnerSlot.snapshotId, runnerSlot.localDeckId)),
      ...(await deckSidePayload("corp", corpSlot.source, corpSlot.snapshotId, corpSlot.localDeckId))
    };
  }

  function currentCorpSnapshotForSetup(): DeckSnapshot | null {
    if ((gameMode === "human_runner_vs_corp_ai" || gameMode === "ai_vs_ai") && aiDeckPolicy === "fixed") return defaultCorpSnapshot;
    if ((gameMode === "human_runner_vs_corp_ai" || gameMode === "ai_vs_ai") && aiDeckPolicy === "seeded_random") return matchFormat === "single_game" ? null : defaultCorpSnapshot;
    if (gameMode === "human_corp_vs_runner_ai" || (isHumanVsHuman && humanSideSelection === "corp")) return corpDeckSource === "local" ? corpLocalSnapshot : selectedCorpSnapshot;
    return participantBCorpDeckSource === "local" ? corpLocalSnapshot : selectedParticipantBCorpSnapshot;
  }

  async function deckPairPayload(runnerSource: "snapshot" | "local", runnerSnapshotId: string, runnerLocalDeckId: string, corpSource: "snapshot" | "local", corpSnapshotId: string, corpLocalDeckId: string) {
    return {
      ...(await deckSidePayload("runner", runnerSource, runnerSnapshotId, runnerLocalDeckId)),
      ...(await deckSidePayload("corp", corpSource, corpSnapshotId, corpLocalDeckId))
    };
  }

  async function deckSidePayload(side: Side, source: "snapshot" | "local", snapshotId: string, localDeckId: string) {
    if (source === "local") {
      const deck = localDecks.find((candidate) => candidate.deckId === localDeckId && candidate.side === side);
      if (!deck) throw new Error(`Bitte wähle ein gespeichertes ${sideLabel(side)}-Deck.`);
      const snapshot = await validateDeckForMatch(deck);
      return side === "runner" ? { runnerDeckSnapshot: snapshot } : { corpDeckSnapshot: snapshot };
    }
    return side === "runner" ? { runnerDeckSnapshotId: snapshotId } : { corpDeckSnapshotId: snapshotId };
  }

  const joinMatch = async () => {
    setNotice("");
    let deckPayload: Record<string, unknown>;
    try {
      deckPayload = await deckPairPayload(
        participantBRunnerDeckSource,
        selectedParticipantBRunnerSnapshotId,
        selectedParticipantBRunnerLocalDeckId,
        participantBCorpDeckSource,
        selectedParticipantBCorpSnapshotId,
        selectedParticipantBCorpLocalDeckId
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Deckauswahl ist nicht matchstartfähig.");
      return;
    }
    const joined = await postJson<JoinMatchResponse>(`/api/matches/${encodeURIComponent(joinMatchId)}/join`, {
      token: joinToken,
      displayName,
      ...deckPayload
    });
    if (joined.error) {
      setNotice(joined.error.message);
      return;
    }
    rememberDisplayName(displayName);
    const nextSession: SessionInfo = {
      matchId: joined.matchId,
      side: joined.side,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
      webSocketUrl: joined.webSocketUrl,
      displayName
    };
    persistSession(nextSession);
    setSession(nextSession);
    if (joined.lobby || !joined.playerView) {
      setPayload(null);
      setLobby(lobbyFromJoinedResponse(joined));
      setNotice(`Beigetreten. Du startest als ${sideLabel(joined.side)}.`);
      return;
    }
    setPayload(fromJoinedResponse(joined));
    setLobby(null);
    setNotice(`Beigetreten. Du startest als ${sideLabel(joined.side)}.`);
  };

  const reconnect = async () => {
    if (!session || !canReconnect) return;
    const reconnected = await postJson<JoinMatchResponse>(`/api/matches/${encodeURIComponent(session.matchId)}/reconnect`, {
      side: session.side,
      reconnectToken: session.reconnectToken,
      displayName: session.displayName
    });
    if (reconnected.error) {
      setNotice(reconnected.error.message);
      return;
    }
    const nextSession = {
      ...session,
      sessionToken: reconnected.sessionToken,
      reconnectToken: reconnected.reconnectToken,
      webSocketUrl: reconnected.webSocketUrl
    };
    persistSession(nextSession);
    setSession(nextSession);
    if (reconnected.lobby || !reconnected.playerView) {
      setPayload(null);
      setLobby(lobbyFromJoinedResponse(reconnected));
    } else {
      setPayload(fromJoinedResponse(reconnected));
      setLobby(null);
    }
    setNotice("Wiederverbindung abgeschlossen.");
  };

  function applyRemotePayload(remotePayload: ClientPayload | LobbyClientPayload) {
    if ("playerView" in remotePayload) {
      setPayload(remotePayload);
      setLobby(null);
    } else {
      setPayload(null);
      setLobby(remotePayload);
    }
    if (session) {
      rememberRecentSession(session, remotePayload);
      setRecentSession(loadRecentSession());
    }
    if (isInvalidatingTerminalStatus(remotePayload.matchStatus)) {
      window.sessionStorage.removeItem(SESSION_KEY);
      socketRef.current?.close();
      setConnection("offline");
    }
  }

  const resumeRecentSession = async () => {
    if (!recentSession) return;
    const nextSession = loadStoredSession();
    if (!nextSession || nextSession.matchId !== recentSession.matchId || nextSession.side !== recentSession.side) {
      setEntryTab("play");
      setMode("join");
      setJoinMatchId(recentSession.matchId);
      setJoinToken("");
      setNotice("Fortsetzen braucht ein Token aus diesem Tab. Für die Wiederverbindung bitte den Link oder Token erneut eintragen.");
      return;
    }
    setSession(nextSession);
    setRecentSession(null);
    setNotice("Letzte Sitzung wird fortgesetzt.");
    const bootstrapped = await bootstrap(nextSession);
    if (bootstrapped && "playerView" in bootstrapped) {
      setPayload(bootstrapped);
      setLobby(null);
      rememberRecentSession(nextSession, bootstrapped);
    } else if (bootstrapped) {
      setPayload(null);
      setLobby(bootstrapped);
      rememberRecentSession(nextSession, bootstrapped);
    } else {
      setNotice("Letzte Sitzung konnte nicht geladen werden.");
    }
  };

  const reconnectFromRecentSession = () => {
    if (!recentSession) return;
    setEntryTab("play");
    setMode("join");
    setJoinMatchId(recentSession.matchId);
    setJoinToken("");
    setNotice("Wiederverbindung vorbereitet. Bitte den aktuellen Join- oder Wiederverbindungs-Token eintragen.");
  };

  const discardRecentSession = () => {
    if (!recentSession) return;
    removeRecentSession(recentSession);
    setRecentSession(loadRecentSession());
    setNotice("Lokaler Sitzungseintrag verworfen.");
  };

  const submitAction = (action: LegalAction) => {
    if (!session || !payload || socketRef.current?.readyState !== WebSocket.OPEN) return;
    if (selectedActionContext && actionMatchesContext(action, selectedActionContext)) setSelectedActionContext(null);
    socketRef.current.send(
      JSON.stringify({
        type: "submit_action",
        payload: {
          matchId: session.matchId,
          side: session.side,
          actionId: action.actionId,
          clientKnownStateVersion: payload.playerView.stateVersion,
          idempotencyKey: `${session.side}-${payload.playerView.stateVersion}-${action.actionId}-${crypto.randomUUID()}`
        }
      })
    );
  };

  const setReady = (ready: boolean) => {
    if (!session || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: "set_ready", payload: { ready } }));
  };

  const cancelCountdown = () => {
    if (!session || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: "cancel_countdown", payload: {} }));
  };

  const cancelMatchLifecycle = async () => {
    if (!session) return;
    const result = await postJson<LifecycleActionResponse>(`/api/matches/${encodeURIComponent(session.matchId)}/cancel`, {
      side: session.side,
      sessionToken: session.sessionToken
    });
    if (!result.ok) {
      setNotice(result.error.message);
      return;
    }
    applyRemotePayload(result.actorPayload);
    setNotice("Match abgebrochen. Der alte Link und die alten Tokens sind ungültig.");
  };

  const leaveMatchLifecycle = async () => {
    if (!session) {
      leaveMatch();
      return;
    }
    const result = await postJson<LifecycleActionResponse>(`/api/matches/${encodeURIComponent(session.matchId)}/leave`, {
      side: session.side,
      sessionToken: session.sessionToken
    });
    if (!result.ok) {
      setNotice(result.error.message);
      return;
    }
    applyRemotePayload(result.actorPayload);
    if (result.actorPayload.matchStatus === "pending") {
      leaveMatch();
      setEntryTab("play");
      setNotice("Du hast die noch nicht aktive Lobby verlassen.");
      return;
    }
    setNotice("Lobby verlassen. Das Match ist jetzt terminal abgebrochen.");
  };

  const forfeitMatch = async () => {
    if (!session || !payload || payload.matchStatus !== "active" || payload.winner) return;
    if (!window.confirm("Möchtest Du dieses Spiel wirklich aufgeben?")) return;
    const result = await postJson<LifecycleActionResponse>(`/api/matches/${encodeURIComponent(session.matchId)}/forfeit`, {
      side: session.side,
      sessionToken: session.sessionToken
    });
    if (!result.ok) {
      setNotice(result.error.message);
      return;
    }
    applyRemotePayload(result.actorPayload);
    setNotice("Spiel aufgegeben. Der Engine-State bleibt der letzte echte Spielzustand.");
  };

  const recreateMatch = async () => {
    if (!session) return;
    const recreated = await postJson<CreateMatchResponse | LifecycleActionResponse>(`/api/matches/${encodeURIComponent(session.matchId)}/recreate`, {
      side: session.side,
      sessionToken: session.sessionToken,
      displayName: session.displayName
    });
    if ("error" in recreated && recreated.error) {
      setNotice(recreated.error.message);
      return;
    }
    if (!("matchId" in recreated)) {
      setNotice("Neu erstellen ist für dieses Match gerade nicht möglich.");
      return;
    }
    const nextSession: SessionInfo = {
      matchId: recreated.matchId,
      side: recreated.hostSide,
      sessionToken: recreated.hostSessionToken,
      reconnectToken: recreated.hostReconnectToken,
      webSocketUrl: recreated.webSocketUrl,
      displayName: session.displayName,
      ...(recreated.pendingDeckHandshake ? { pendingDeckHandshake: true } : {}),
      ...(recreated.joinUrl ? { joinUrl: recreated.joinUrl } : {})
    };
    persistSession(nextSession);
    setSession(nextSession);
    setDismissedResultKey(null);
    if (recreated.lobby || recreated.pendingDeckHandshake || !recreated.playerView) {
      setPayload(null);
      setLobby(lobbyFromInitialResponse(recreated, recreated.hostSide));
    } else {
      setPayload(fromInitialResponse(recreated, recreated.hostSide));
      setLobby(null);
    }
    setEntryTab("play");
    setNotice(recreated.joinUrl ? "Neues Match erstellt. Teile den neuen Join-Link." : "Neues Match erstellt.");
  };

  const returnToSetupFromLobby = () => {
    if (!session || !lobby) {
      leaveMatch();
      setEntryTab("play");
      return;
    }
    const isHost = lobby.startLobby ? playerSlotForSide(lobby.startLobby, lobby.side) === "player_a" : true;
    if (isHost) void cancelMatchLifecycle();
    else void leaveMatchLifecycle();
  };

  const sendLobbyChat = () => {
    if (!session || socketRef.current?.readyState !== WebSocket.OPEN) return;
    const text = lobbyChatText.trim();
    if (!text) return;
    socketRef.current.send(JSON.stringify({ type: "send_lobby_chat", payload: { text } }));
    setLobbyChatText("");
  };

  const advanceAi = (mode: "single_step" | "until_human" = "single_step") => {
    if (!session || !payload || socketRef.current?.readyState !== WebSocket.OPEN || !payload.aiTurnPresentation?.canAdvanceAi) return;
    socketRef.current.send(
      JSON.stringify({
        type: "advance_ai",
        payload: {
          knownStateVersion: payload.playerView.stateVersion,
          knownMatchVersion: payload.matchVersion,
          mode
        }
      })
    );
  };

  const requestUndo = () => {
    if (!latestEventId || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: "request_undo", payload: { targetEventId: latestEventId } }));
  };

  const resolveUndo = (accepted: boolean) => {
    if (!payload?.pendingUndo || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({
        type: accepted ? "accept_undo" : "decline_undo",
        payload: { undoRequestId: payload.pendingUndo.undoRequestId }
      })
    );
  };

  const leaveMatch = () => {
    const leavingSession = session;
    socketRef.current?.close();
    window.sessionStorage.removeItem(SESSION_KEY);
    if (leavingSession) removeRecentSession(leavingSession);
    setRecentSession(loadRecentSession());
    setSession(null);
    setPayload(null);
    setLobby(null);
    setSimulation(null);
    setConnection("offline");
    setSeriesTransitioning(false);
    setNotice("");
  };

  const copyJoinLink = async () => {
    if (!session?.joinUrl) return;
    await navigator.clipboard.writeText(session.joinUrl);
    setNotice("Join-Link kopiert.");
  };

  const updateDisplayName = (value: string) => {
    setDisplayName(value);
    rememberDisplayName(value);
  };

  const createEmptyDeck = (side: Side) => {
    const now = new Date().toISOString();
    const templateIdentity = deckTemplates.find((candidate) => candidate.side === side)?.identityCardId;
    const deck: EditableDeck = {
      deckId: `local_${side}_${crypto.randomUUID().slice(0, 8)}`,
      deckVersion: "0.6.0-local",
      name: side === "runner" ? "Neues Runner-Deck" : "Neues Corp-Deck",
      side,
      identityCardId: templateIdentity ?? DEFAULT_IDENTITY_BY_SIDE[side],
      cardPoolSnapshotId: DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID,
      formatProfileId: DEFAULT_DECK_FORMAT_PROFILE_ID,
      cards: [],
      createdAt: now,
      updatedAt: now
    };
    setLocalDecks((current) => saveDeckLibrary([...current, deck]));
    setSelectedLocalDeckId(deck.deckId);
    selectDeckForSide(deck);
    clearDeckValidation();
    setNotice("Neues Deck gespeichert. Füge Karten hinzu und speichere Änderungen bewusst.");
  };

  const updateSelectedDeck = (nextDeck: EditableDeck) => {
    setLocalDecks((current) => current.map((deck) => (deck.deckId === nextDeck.deckId ? { ...nextDeck, updatedAt: new Date().toISOString() } : deck)));
    clearDeckValidation();
  };

  const saveSelectedDeck = () => {
    if (!selectedLocalDeck) return;
    setLocalDecks((current) => saveDeckLibrary(current));
    setNotice("Deck gespeichert.");
  };

  const updateDeckCardQuantity = (cardId: string, quantity: number) => {
    if (!selectedLocalDeck) return;
    const nextQuantity = Math.max(0, Math.floor(quantity));
    const existing = selectedLocalDeck.cards.some((entry) => entry.cardId === cardId);
    updateSelectedDeck({
      ...selectedLocalDeck,
      cards: (existing ? selectedLocalDeck.cards.map((entry) => (entry.cardId === cardId ? { ...entry, quantity: nextQuantity } : entry)) : [...selectedLocalDeck.cards, { cardId, quantity: nextQuantity }]).filter(
        (entry) => entry.quantity > 0
      )
    });
  };

  const duplicateSelectedDeck = () => {
    if (!selectedLocalDeck) return;
    const now = new Date().toISOString();
    const copy = {
      ...selectedLocalDeck,
      deckId: `${selectedLocalDeck.deckId}_copy_${crypto.randomUUID().slice(0, 6)}`,
      name: `${selectedLocalDeck.name} Kopie`,
      createdAt: now,
      updatedAt: now
    };
    setLocalDecks((current) => saveDeckLibrary([...current, copy]));
    setSelectedLocalDeckId(copy.deckId);
    selectDeckForSide(copy);
    clearDeckValidation();
    setNotice("Deck-Kopie gespeichert.");
  };

  const deleteSelectedDeck = () => {
    if (!selectedLocalDeck) return;
    setLocalDecks((current) => {
      const next = current.filter((deck) => deck.deckId !== selectedLocalDeck.deckId);
      setSelectedLocalDeckId(next[0]?.deckId ?? null);
      return saveDeckLibrary(next);
    });
    clearDeckValidation();
  };

  const validateSelectedDeck = async () => {
    if (!selectedLocalDeck) return;
    const result = await fetch("/api/decks/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deck: selectedLocalDeck })
    }).then((response) => response.json() as Promise<DeckValidationResponse>);
    if (result.error) {
      setNotice(result.error.message);
      return;
    }
    setDeckValidation(result.validation);
    setValidatedSnapshot(result.snapshot);
    setNotice(result.validation.ok ? "Deck validiert." : "Deck braucht noch Korrekturen.");
  };

  const useValidatedDeckForMatch = () => {
    if (!validatedSnapshot) return;
    if (validatedSnapshot.side === "runner") {
      setRunnerLocalSnapshot(validatedSnapshot);
      setRunnerDeckSource("local");
      if (selectedLocalDeck) setSelectedRunnerLocalDeckId(selectedLocalDeck.deckId);
    } else {
      setCorpLocalSnapshot(validatedSnapshot);
      setCorpDeckSource("local");
      if (selectedLocalDeck) setSelectedCorpLocalDeckId(selectedLocalDeck.deckId);
    }
    setEntryTab("play");
    setNotice("Deck-Snapshot für Match Setup gesetzt.");
  };

  const exportSelectedDeck = () => {
    if (!selectedLocalDeck) return;
    setDeckExportText(`${JSON.stringify({ schemaVersion: "editable-deck-v0.6", deck: selectedLocalDeck }, null, 2)}\n`);
  };

  const importLocalDeck = () => {
    let parsed: { deck?: EditableDeck };
    try {
      parsed = JSON.parse(deckImportText) as { deck?: EditableDeck };
    } catch {
      setNotice("Deck-Import konnte nicht gelesen werden.");
      return;
    }
    if (!parsed.deck || (parsed.deck.side !== "runner" && parsed.deck.side !== "corp")) {
      setNotice("Deck-Import konnte nicht gelesen werden.");
      return;
    }
    const now = new Date().toISOString();
    const imported = {
      ...parsed.deck,
      deckId: parsed.deck.deckId || `local_import_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: parsed.deck.createdAt || now,
      updatedAt: now
    };
    setLocalDecks((current) => saveDeckLibrary([...current.filter((deck) => deck.deckId !== imported.deckId), imported]));
    setSelectedLocalDeckId(imported.deckId);
    selectDeckForSide(imported);
    clearDeckValidation();
    setNotice("Deck importiert und gespeichert.");
  };

  function clearDeckValidation() {
    setDeckValidation(null);
    setValidatedSnapshot(null);
  }

  function saveDeckLibrary(nextDecks: EditableDeck[]): EditableDeck[] {
    window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(nextDecks));
    setSavedDeckFingerprints(Object.fromEntries(nextDecks.map((deck) => [deck.deckId, deckFingerprint(deck)])));
    return nextDecks;
  }

  function selectDeckForSide(deck: EditableDeck) {
    if (deck.side === "runner") {
      setSelectedRunnerLocalDeckId(deck.deckId);
      setSelectedParticipantBRunnerLocalDeckId(deck.deckId);
      setRunnerDeckSource("local");
      setParticipantBRunnerDeckSource("local");
    } else {
      setSelectedCorpLocalDeckId(deck.deckId);
      setSelectedParticipantBCorpLocalDeckId(deck.deckId);
      setCorpDeckSource("local");
      setParticipantBCorpDeckSource("local");
    }
  }

  async function validateDeckForMatch(deck: EditableDeck): Promise<DeckSnapshot> {
    const result = await fetch("/api/decks/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deck })
    }).then((response) => response.json() as Promise<DeckValidationResponse>);
    if (result.error) throw new Error(result.error.message);
    if (!result.validation.ok || !result.snapshot) {
      const details = result.validation.errors.length > 0 ? ` ${result.validation.errors.join(" ")}` : "";
      throw new Error(`${deck.name} ist nicht matchstartfähig.${details}`);
    }
    if (deck.side === "runner") setRunnerLocalSnapshot(result.snapshot);
    else setCorpLocalSnapshot(result.snapshot);
    return result.snapshot;
  }

  function connectWebSocket(nextSession: SessionInfo) {
    setConnection("connecting");
    socketRef.current?.close();
    const socket = new WebSocket(nextSession.webSocketUrl);
    socketRef.current = socket;
    socket.onopen = () => {
      if (socketRef.current !== socket) return;
      setConnection("online");
      socket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: nextSession.matchId,
            side: nextSession.side,
            sessionToken: nextSession.sessionToken
          }
        })
      );
    };
    socket.onclose = () => {
      if (socketRef.current === socket) setConnection("offline");
    };
    socket.onerror = () => {
      if (socketRef.current === socket) setConnection("offline");
    };
    socket.onmessage = (event) => {
      if (socketRef.current === socket) applyServerMessage(JSON.parse(event.data as string) as ServerMessage);
    };
  }

  function applyServerMessage(message: ServerMessage) {
    if (message.type === "lobby_update") {
      setLobby(message.payload);
      setPayload(null);
      if (session) rememberRecentSession(session, message.payload);
      return;
    }
    if (message.type === "state_update") {
      setPayload((current) => {
        if (!current) {
          const nextFromLobby = lobby
            ? {
                matchId: lobby.matchId,
                matchStatus: message.payload.matchStatus,
                matchVersion: message.payload.matchVersion,
                side: lobby.side,
                playerView: message.payload.playerView,
                legalActions: [],
                eventTail: [],
                opponentStatus: lobby.opponentStatus
              }
            : null;
          return nextFromLobby;
        }
        const next = {
          ...current,
          matchStatus: message.payload.matchStatus,
          matchVersion: message.payload.matchVersion,
          playerView: message.payload.playerView
        };
        if (message.payload.playerView.winner) return { ...next, winner: message.payload.playerView.winner };
        const { winner: _winner, finalStateHash: _finalStateHash, ...withoutWinner } = next;
        return withoutWinner;
      });
      setLobby(null);
      return;
    }
    if (message.type === "legal_actions") {
      setPayload((current) => (current ? { ...current, legalActions: message.payload.legalActions } : current));
      return;
    }
    if (message.type === "event_log_update") {
      setPayload((current) => (current ? { ...current, eventTail: message.payload.events } : current));
      return;
    }
    if (message.type === "opponent_status") {
      setPayload((current) => (current ? { ...current, opponentStatus: message.payload } : current));
      setLobby((current) => (current ? { ...current, opponentStatus: message.payload } : current));
      return;
    }
    if (message.type === "ai_turn") {
      setPayload((current) => {
        if (!current) return current;
        if (message.payload) return { ...current, aiTurnPresentation: message.payload };
        const { aiTurnPresentation: _aiTurnPresentation, ...withoutAiTurn } = current;
        return withoutAiTurn;
      });
      return;
    }
    if (message.type === "undo_request") {
      setPayload((current) => (current ? { ...current, pendingUndo: message.payload } : current));
      return;
    }
    if (message.type === "match_finished") {
      setPayload((current) =>
        current
          ? {
              ...current,
              winner: message.payload.winner,
              finalStateHash: message.payload.finalStateHash,
              ...(message.payload.resultSummary ? { resultSummary: message.payload.resultSummary } : {}),
              matchStatus: message.payload.matchStatus
            }
          : current
      );
      return;
    }
    if (message.type === "error") {
      setNotice(message.payload.message);
      if (message.payload.playerView) {
        setPayload((current) => (current ? { ...current, playerView: message.payload.playerView!, legalActions: message.payload.playerView!.legalActions } : current));
      }
    }
  }

  const statusText = useMemo(() => {
    if (!session) return "Kein Match";
    if (connection === "online") return "Verbunden";
    if (connection === "connecting") return "Verbindet";
    return "Offline";
  }, [connection, session]);
  const showingStartLobby = Boolean(session && lobby);
  const updateAudioEnabled = (enabled: boolean) => {
    if (enabled) primeAudio(audioVolume);
    setAudioEnabled(enabled);
  };

  if (!session || !payload || !activeView) {
    return (
      <main className="app" data-theme={colorScheme}>
        <header className="topbar">
          <Brand subtitle={`${APP_STATUS_LABEL} · private Matches`} />
          <ConnectionBadge text={statusText} state={connection} />
        </header>
        <div className="setup v07Entry">
          <nav className="entryTabs" aria-label="Startbereiche">
            <button className={`entryTab ${entryTab === "play" ? "active" : ""}`} onClick={() => setEntryTab("play")} type="button" aria-current={entryTab === "play" ? "page" : undefined}>
              <Play size={16} />
              Spiel
            </button>
            <button className={`entryTab ${entryTab === "catalog" ? "active" : ""}`} onClick={() => setEntryTab("catalog")} type="button" aria-current={entryTab === "catalog" ? "page" : undefined}>
              <ListFilter size={16} />
              Katalog
            </button>
            <button className={`entryTab ${entryTab === "decks" ? "active" : ""}`} onClick={() => setEntryTab("decks")} type="button" aria-current={entryTab === "decks" ? "page" : undefined}>
              <Layers3 size={16} />
              Meine Decks
            </button>
            <button className={`entryTab ${entryTab === "options" ? "active" : ""}`} onClick={() => setEntryTab("options")} type="button" aria-current={entryTab === "options" ? "page" : undefined}>
              <SlidersHorizontal size={16} />
              Optionen
            </button>
          </nav>
          {notice ? <p className="notice entryNotice">{notice}</p> : null}
          {session && lobby ? (
            <StartLobbyPanel
              lobby={lobby}
              joinUrl={session.joinUrl}
              chatText={lobbyChatText}
              connection={connection}
              onReady={setReady}
              onCancel={cancelCountdown}
              onCancelMatch={cancelMatchLifecycle}
              onLeaveMatch={leaveMatchLifecycle}
              onRecreate={recreateMatch}
              onDiscardLocal={leaveMatch}
              onReturnToSetup={returnToSetupFromLobby}
              onChatText={setLobbyChatText}
              onSendChat={sendLobbyChat}
              onCopyJoinLink={copyJoinLink}
            />
          ) : null}
          <div className="entryContent">
          {entryTab === "play" && !showingStartLobby && !session && recentSession ? (
            <section className="resumeSessionPanel">
              <div>
                <p className="eyebrow">Letzte Sitzung</p>
                <h2>Match {recentSession.matchId}</h2>
                <p className="meta">
                  {sideLabel(recentSession.side)} · {recentSession.displayName}
                  {recentSession.opponentDisplayName ? ` · gegen ${recentSession.opponentDisplayName}` : ""}
                  {recentSession.matchStatus ? ` · ${recentSession.matchStatus}` : ""}
                </p>
              </div>
              <div className="resumeSessionActions">
                <button className="button primary" onClick={resumeRecentSession} type="button" disabled={!storedSessionMatches(recentSession)}>
                  <Cable size={15} />
                  Fortsetzen
                </button>
                <button className="button" onClick={reconnectFromRecentSession} type="button">
                  <Link2 size={15} />
                  Wieder verbinden über Link
                </button>
                <button className="button" onClick={discardRecentSession} type="button">
                  <Trash2 size={15} />
                  Verwerfen
                </button>
              </div>
            </section>
          ) : null}
          {entryTab === "play" && !showingStartLobby ? (
          <section className="setupPanel">
            <div className="tabs">
              <button className={`tab ${mode === "host" ? "active" : ""}`} onClick={() => setMode("host")}>
                Match erstellen
              </button>
              <button className={`tab ${mode === "join" ? "active" : ""}`} onClick={() => setMode("join")}>
                Beitreten
              </button>
            </div>

            {mode === "host" ? (
              <div className="formGrid">
                <label>
                  Spielart
                  <select value={playMode} onChange={(event) => setPlayMode(event.target.value as PlayMode)}>
                    <option value="human_vs_human">{playModeLabel("human_vs_human")}</option>
                    <option value="human_vs_ai">{playModeLabel("human_vs_ai")}</option>
                    <option value="ai_vs_ai">{playModeLabel("ai_vs_ai")}</option>
                  </select>
                </label>
                {isHumanVsHuman ? (
                  <label>
                    Seitenzuteilung
                    <select value={humanSideSelection} onChange={(event) => setHumanSideSelection(event.target.value as HumanSideSelection)}>
                      <option value="random">{sideSelectionLabel("random")}</option>
                      <option value="runner">{sideSelectionLabel("runner")}</option>
                      <option value="corp">{sideSelectionLabel("corp")}</option>
                    </select>
                  </label>
                ) : null}
                {isHumanVsAi ? (
                  <label>
                    Deine Seite
                    <select value={humanAiSideSelection} onChange={(event) => setHumanAiSideSelection(event.target.value as HumanAiSideSelection)}>
                      <option value="random">{humanAiSideLabel("random")}</option>
                      <option value="runner">{humanAiSideLabel("runner")}</option>
                      <option value="corp">{humanAiSideLabel("corp")}</option>
                    </select>
                  </label>
                ) : null}
                <label>
                  Spielziel
                  <select value={matchFormat} onChange={(event) => setMatchFormat(event.target.value as MatchFormat)}>
                    <option value="rules_match">Regelmatch · 7 Agendapunkte</option>
                    <option value="single_game">Einzelspiel · Deckziel</option>
                    <option value="two_game_side_swap">Private Matchserie · Seitenwechsel</option>
                  </select>
                </label>
                <label>
                  Name
                  <input value={displayName} onChange={(event) => updateDisplayName(event.target.value)} />
                </label>
                {isHumanVsHuman ? (
                  <label>
                    Countdown
                    <select value={countdownSeconds} onChange={(event) => setCountdownSeconds(Number(event.target.value) as 3 | 5 | 10)}>
                      <option value={3}>3 Sekunden</option>
                      <option value={5}>5 Sekunden</option>
                      <option value={10}>10 Sekunden</option>
                    </select>
                  </label>
                ) : null}
                {isHumanVsHuman ? (
                  <label className={`deckBuilderToggle ${testSetupMode ? "checked" : ""}`}>
                    <input checked={testSetupMode} onChange={(event) => setTestSetupMode(event.target.checked)} type="checkbox" />
                    Testkonstellation · beide Teilnehmer festlegen
                  </label>
                ) : null}
                {(isHumanVsAi && humanAiSideSelection !== "runner") || gameMode === "ai_vs_ai" ? (
                  <label>
                    Runner-KI
                    <select value={runnerDifficulty} onChange={(event) => setRunnerDifficulty(event.target.value as AiDifficulty)}>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                ) : null}
                {(isHumanVsAi && humanAiSideSelection !== "corp") || gameMode === "ai_vs_ai" ? (
                  <label>
                    Corp-KI
                    <select value={corpDifficulty} onChange={(event) => setCorpDifficulty(event.target.value as AiDifficulty)}>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                ) : null}
                <label>
                  Seed
                  <input value={seed} onChange={(event) => setSeed(event.target.value)} />
                </label>
                {hasAiOpponent ? (
                  <label>
                    KI-Decks
                    <select value={aiDeckPolicy} onChange={(event) => setAiDeckPolicy(event.target.value as AiDeckPolicy)}>
                      <option value="selected">Explizit gewählte KI-Decks</option>
                      <option value="fixed">Feste Standard-Decks</option>
                      <option value="seeded_random">Deterministisch zufällig</option>
                    </select>
                  </label>
                ) : null}
                <div className="deckSlotGrid">
                  <DeckSlotSelect
                    label="Teilnehmer A · Runner-Deck"
                    snapshots={runnerSnapshots}
                    localDecks={localDecks.filter((deck) => deck.side === "runner")}
                    source={runnerDeckSource}
                    selectedSnapshotId={selectedRunnerSnapshotId}
                    selectedLocalDeckId={selectedRunnerLocalDeckId}
                    onSource={setRunnerDeckSource}
                    onSnapshot={setSelectedRunnerSnapshotId}
                    onLocalDeck={setSelectedRunnerLocalDeckId}
                  />
                  <DeckSlotSelect
                    label="Teilnehmer A · Corp-Deck"
                    snapshots={corpSnapshots}
                    localDecks={localDecks.filter((deck) => deck.side === "corp")}
                    source={corpDeckSource}
                    selectedSnapshotId={selectedCorpSnapshotId}
                    selectedLocalDeckId={selectedCorpLocalDeckId}
                    onSource={setCorpDeckSource}
                    onSnapshot={setSelectedCorpSnapshotId}
                    onLocalDeck={setSelectedCorpLocalDeckId}
                  />
                  {isHumanVsHuman && !testSetupMode ? (
                    <p className="deckHandshakeHint">Teilnehmer B wählt eigene Decks beim Beitritt.</p>
                  ) : null}
                  {(isHumanVsHuman && testSetupMode) || (hasAiOpponent && aiDeckPolicy === "selected") ? (
                    <>
                      <DeckSlotSelect
                        label={hasAiOpponent ? "KI · Runner-Deck" : "Teilnehmer B · Runner-Deck"}
                        snapshots={runnerSnapshots}
                        localDecks={localDecks.filter((deck) => deck.side === "runner")}
                        source={participantBRunnerDeckSource}
                        selectedSnapshotId={selectedParticipantBRunnerSnapshotId}
                        selectedLocalDeckId={selectedParticipantBRunnerLocalDeckId}
                        disabled={aiSlotDisabled}
                        onSource={setParticipantBRunnerDeckSource}
                        onSnapshot={setSelectedParticipantBRunnerSnapshotId}
                        onLocalDeck={setSelectedParticipantBRunnerLocalDeckId}
                      />
                      <DeckSlotSelect
                        label={hasAiOpponent ? "KI · Corp-Deck" : "Teilnehmer B · Corp-Deck"}
                        snapshots={corpSnapshots}
                        localDecks={localDecks.filter((deck) => deck.side === "corp")}
                        source={participantBCorpDeckSource}
                        selectedSnapshotId={selectedParticipantBCorpSnapshotId}
                        selectedLocalDeckId={selectedParticipantBCorpLocalDeckId}
                        disabled={aiSlotDisabled}
                        onSource={setParticipantBCorpDeckSource}
                        onSnapshot={setSelectedParticipantBCorpSnapshotId}
                        onLocalDeck={setSelectedParticipantBCorpLocalDeckId}
                      />
                    </>
                  ) : null}
                </div>
                <DeckMetadataLine
                  entries={[
                    { label: "A Runner", metadata: participantARunnerMetadata },
                    { label: "A Corp", metadata: participantACorpMetadata },
                    ...(aiSlotDisabled || (isHumanVsHuman && !testSetupMode)
                      ? []
                      : [
                          { label: hasAiOpponent ? "KI Runner" : "B Runner", metadata: participantBRunnerMetadata },
                          { label: hasAiOpponent ? "KI Corp" : "B Corp", metadata: participantBCorpMetadata }
                        ])
                  ]}
                />
                <button className="button primary wide" onClick={createMatch}>
                  {gameMode === "ai_vs_ai" ? <Bot size={16} /> : <UserPlus size={16} />}
                  {gameMode === "ai_vs_ai" ? "Simulation starten" : "Match erstellen"}
                </button>
                {simulation ? <SimulationResult summary={simulation} /> : null}
              </div>
            ) : (
              <div className="formGrid">
                <label>
                  Name
                  <input value={displayName} onChange={(event) => updateDisplayName(event.target.value)} />
                </label>
                <label>
                  Match
                  <input value={joinMatchId} onChange={(event) => setJoinMatchId(event.target.value)} />
                </label>
                <label>
                  Token
                  <input value={joinToken} onChange={(event) => setJoinToken(event.target.value)} />
                </label>
                <div className="deckSlotGrid">
                  <DeckSlotSelect
                    label="Dein Runner-Deck"
                    snapshots={runnerSnapshots}
                    localDecks={localDecks.filter((deck) => deck.side === "runner")}
                    source={participantBRunnerDeckSource}
                    selectedSnapshotId={selectedParticipantBRunnerSnapshotId}
                    selectedLocalDeckId={selectedParticipantBRunnerLocalDeckId}
                    onSource={setParticipantBRunnerDeckSource}
                    onSnapshot={setSelectedParticipantBRunnerSnapshotId}
                    onLocalDeck={setSelectedParticipantBRunnerLocalDeckId}
                  />
                  <DeckSlotSelect
                    label="Dein Corp-Deck"
                    snapshots={corpSnapshots}
                    localDecks={localDecks.filter((deck) => deck.side === "corp")}
                    source={participantBCorpDeckSource}
                    selectedSnapshotId={selectedParticipantBCorpSnapshotId}
                    selectedLocalDeckId={selectedParticipantBCorpLocalDeckId}
                    onSource={setParticipantBCorpDeckSource}
                    onSnapshot={setSelectedParticipantBCorpSnapshotId}
                    onLocalDeck={setSelectedParticipantBCorpLocalDeckId}
                  />
                </div>
                <button className="button primary wide" onClick={joinMatch} disabled={!joinMatchId || !joinToken}>
                  <Link2 size={16} />
                  Mit Decks beitreten
                </button>
              </div>
            )}
          </section>
          ) : null}
          {entryTab === "catalog" ? (
            <CatalogPanel
            cards={filteredCatalogCards}
            detail={catalogDetail}
            filters={catalogFilters}
            search={catalogSearch}
            side={catalogSide}
            status={catalogStatus}
            summary={catalogSummary}
            selectedId={selectedCatalogId}
            typeCounts={catalogTypeCounts}
            typeFilters={catalogTypeFilters}
            onSearch={setCatalogSearch}
            onSide={setCatalogSide}
            onStatus={setCatalogStatus}
            onSelect={setSelectedCatalogId}
            onTypeFilter={(key, selected) => setCatalogTypeFilters((current) => ({ ...current, [key]: selected }))}
            onSelectAllTypes={() => setCatalogTypeFilters({ ...ALL_CATALOG_TYPE_FILTERS })}
            onClearTypeFilters={() => setCatalogTypeFilters({ ...NO_CATALOG_TYPE_FILTERS })}
          />
          ) : null}
          {entryTab === "decks" ? (
            <DeckEditorPanel
            localDecks={localDecks}
            selectedDeck={selectedLocalDeck}
            selectedDeckDirty={selectedDeckDirty}
            validation={deckValidation}
            validatedSnapshot={validatedSnapshot}
            playableCards={playableCatalogCards}
            cardDetailsById={catalogDetailsById}
            importText={deckImportText}
            exportText={deckExportText}
            onCreateEmpty={createEmptyDeck}
            onSelectDeck={setSelectedLocalDeckId}
            onUpdateDeck={updateSelectedDeck}
            onSave={saveSelectedDeck}
            onUpdateQuantity={updateDeckCardQuantity}
            onDuplicate={duplicateSelectedDeck}
            onDelete={deleteSelectedDeck}
            onValidate={validateSelectedDeck}
            onUseForMatch={useValidatedDeckForMatch}
            onExport={exportSelectedDeck}
            onImportText={setDeckImportText}
            onImport={importLocalDeck}
          />
          ) : null}
          {entryTab === "options" ? (
            <OptionsPanel
              audioEnabled={audioEnabled}
              audioVolume={audioVolume}
              cardDisplayMode={cardDisplayMode}
              colorScheme={colorScheme}
              onAudioEnabled={updateAudioEnabled}
              onAudioVolume={setAudioVolume}
              onCardDisplayMode={setCardDisplayMode}
              onColorScheme={setColorScheme}
            />
          ) : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app" data-theme={colorScheme}>
      <header className="topbar">
        <Brand subtitle={`${APP_STATUS_LABEL} · ${session.side === "runner" ? "Runner" : "Corp"}${opponentDisplayName ? ` gegen ${opponentDisplayName}` : ""}`} />
        <div className="toolbar">
          <ConnectionBadge text={statusText} state={connection} />
          <div className="audioMenu">
            <button className="button iconOnly" onClick={() => setAudioMenuOpen((current) => !current)} title="Audio einstellen" aria-label="Audio einstellen" type="button">
              {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            {audioMenuOpen ? (
              <div className="audioPopover">
                <AudioSettings enabled={audioEnabled} volume={audioVolume} onEnabled={updateAudioEnabled} onVolume={setAudioVolume} />
              </div>
            ) : null}
          </div>
          {session.joinUrl ? (
            <button className="button" onClick={copyJoinLink} title="Join-Link kopieren">
              <Clipboard size={16} />
              Link
            </button>
          ) : null}
          <button className="button" onClick={reconnect} disabled={!canReconnect} title="Wieder verbinden">
            <Cable size={16} />
            Wieder verbinden
          </button>
          <button className="button dangerButton" onClick={forfeitMatch} disabled={!canForfeit} title="Spiel aufgeben">
            <Flag size={16} />
            Aufgeben
          </button>
          <button className="button" onClick={leaveMatch} title="Lokale Sitzung verwerfen">
            <RotateCcw size={16} />
            Verwerfen
          </button>
        </div>
      </header>

      <div className="matchStrip">
        <span>{payload.matchStatus}</span>
        <span>Match {payload.matchId}</span>
        <span>Gegenüber {opponentDisplayName ?? sideLabel(payload.opponentStatus.side)}</span>
        <span>Version {payload.matchVersion}</span>
        <span>State {activeView.stateVersion}</span>
        <span>{notice}</span>
      </div>
      <OpponentActionOverlay
        cue={currentActionCue}
        queued={actionCueQueue.length}
        position={cuePosition}
        onPosition={setCuePosition}
        onDismiss={() => setCurrentActionCue(null)}
      />

      <div className="main">
        <aside className="column panel sidePanel">
          <OpponentPanel
            view={activeView}
            connected={payload.opponentStatus.connected}
            actionCapacity={actionSlotCapacities[opponentSide(activeView.side)]}
            {...(payload.opponentStatus.displayName ? { displayName: payload.opponentStatus.displayName } : {})}
          />
          <AiPacingControls
            presentation={payload.aiTurnPresentation}
            mode={localAiPacingMode}
            connection={connection}
            onMode={setLocalAiPacingMode}
            onAdvance={() => advanceAi(localAiPacingMode === "fast" ? "until_human" : "single_step")}
          />
          <LegalActionsPanel
            primaryActions={legalActionSplit.primaryActions}
            contextualActions={selectedPanelContextActions}
            selectedContext={selectedPanelContext}
            hasHiddenContextActions={legalActionSplit.contextualActions.length > 0 && selectedActionContext?.kind !== "card"}
            cardContextActive={selectedActionContext?.kind === "card"}
            disabled={Boolean(payload.winner) || connection !== "online"}
            highlighted={hasDecisionCue}
            onAction={submitAction}
            onClearContext={() => setSelectedActionContext(null)}
          />
          <UndoPanel pendingUndo={payload.pendingUndo} latestEventId={latestEventId} connection={connection} onRequest={requestUndo} onResolve={resolveUndo} />
        </aside>

        <section className="board boardPanel">
          <RunnerRigStrip
            view={activeView}
            cardDetailsById={catalogDetailsById}
            displayMode={cardDisplayMode}
            selectedContext={selectedActionContext}
            contextualActions={legalActionSplit.contextualActions}
            actionDisabled={Boolean(payload.winner) || connection !== "online"}
            onFocus={focusCard}
            onActionContext={selectActionCard}
            onAction={submitAction}
          />
          <RunTimeline view={activeView} legalActions={payload.legalActions} cardDetailsById={catalogDetailsById} highlighted={activeCueHighlight?.kind === "run"} />
          {payload.winner ? (
            <div className="runBar">
              <Sparkles size={18} />
              <span className="winner">
                {payload.winner === "runner" ? "Runner" : payload.winner === "corp" ? "Corp" : "Draw"} gewinnt.
              </span>
            </div>
          ) : null}
          <div className="serverGrid">
            {activeView.servers.map((server) => {
              const cardCount = centralServerCardCount(activeView, server.id);
              const runAction = runActionForServer(server.id);
              return (
                <article
                  className={`server ${serverHighlighted(activeCueHighlight, server.id) ? "cueHighlight" : ""} ${activeRunTargetIds.includes(server.id) ? "activeRunTarget" : ""} ${selectedActionContext?.kind === "server" && selectedActionContext.id === server.id ? "selectedActionSource" : ""}`}
                  key={server.id}
                >
                  <h3 className="serverTitle">
                    <button className="serverContextButton" type="button" onClick={() => setSelectedActionContext({ kind: "server", id: server.id, label: serverDisplayLabel(server.id) })}>
                      {serverDisplayLabel(server.id)}
                    </button>
                    {runAction ? (
                      <button className="serverRunButton" type="button" onClick={() => submitAction(runAction)} disabled={Boolean(payload.winner) || connection !== "online"} aria-label={`${actionButtonLabel(runAction)} starten`} title={actionButtonLabel(runAction)}>
                        <RunIcon size={13} />
                        <CostChips action={runAction} />
                      </button>
                    ) : null}
                    {cardCount !== null ? <span className="serverCount">{formatCardCount(cardCount)}</span> : null}
                  </h3>
                  {serverLanesForSide(activeView.side, server).map((lane) => (
                    <div className="serverLaneGroup" key={lane.label}>
                      <div className="laneLabel">
                        <span>{lane.label}</span>
                        {lane.kind === "ice" && lane.cards.length > 0 ? <span className="laneDirection">Außen → Server</span> : null}
                      </div>
                      <div className="lane">
                        {lane.cards.map((card, index) => {
                          const displayCard = enrichCard(card);
                          return (
                            <CardView
                              key={card.instanceId}
                              card={displayCard}
                              compact
                              displayMode={cardDisplayMode}
                              hiddenSide="corp"
                              installedCorpCard
                              selected={selectedActionContext?.kind === "card" && selectedActionContext.id === card.instanceId}
                              actions={cardActionsFor(card)}
                              actionDisabled={Boolean(payload.winner) || connection !== "online"}
                              {...(lane.kind === "ice" ? { positionBadge: String(index + 1) } : {})}
                              onAction={submitAction}
                              onFocus={focusCard}
                              onActionContextSelect={selectActionCard}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </article>
              );
            })}
          </div>
          {activeView.own.rig ? (
            <section className="section panel boardSection">
              <div className="sectionTitleLine boardSectionTitle">
                <h2>Rig</h2>
                <ZoneLimitBadge label="MU" value={`${activeView.own.memoryUsed ?? 0}/${activeView.own.memoryLimit ?? 0}`} />
              </div>
              <div className={`cards ${zoneHighlighted(activeCueHighlight, activeView.side, "rig") ? "cueHighlightSoft" : ""}`}>
                {activeView.own.rig.map((card) => {
                  const displayCard = enrichCard(card);
                  return (
                    <CardView
                      key={card.instanceId}
                      card={displayCard}
                      displayMode={cardDisplayMode}
                      selected={selectedActionContext?.kind === "card" && selectedActionContext.id === card.instanceId}
                      actions={cardActionsFor(card)}
                      actionDisabled={Boolean(payload.winner) || connection !== "online"}
                      onAction={submitAction}
                      onFocus={focusCard}
                      onActionContextSelect={selectActionCard}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}
          <section className="section panel boardSection">
            <div className="sectionTitleLine boardSectionTitle">
              <h2>{session.side === "runner" ? "Grip" : "HQ"}</h2>
              {activeView.side === "runner" ? <ZoneLimitBadge label="Grip" value={`${activeView.own.gripOrHq.length}/${runnerHandLimit(activeView)}`} /> : null}
            </div>
            <div className={`cards ${zoneHighlighted(activeCueHighlight, activeView.side, activeView.side === "runner" ? "grip" : "hq") ? "cueHighlightSoft" : ""}`}>
              {activeView.own.gripOrHq.map((card) => {
                const displayCard = enrichCard(card);
                return (
                  <CardView
                    key={card.instanceId}
                    card={displayCard}
                    displayMode={cardDisplayMode}
                    hiddenSide={activeView.side}
                    selected={selectedActionContext?.kind === "card" && selectedActionContext.id === card.instanceId}
                    actions={cardActionsFor(card)}
                    actionDisabled={Boolean(payload.winner) || connection !== "online"}
                    onAction={submitAction}
                    onFocus={focusCard}
                    onActionContextSelect={selectActionCard}
                  />
                );
              })}
            </div>
          </section>
        </section>

        <aside className="log panel rightRail">
          <CardPreviewPanel card={enrichedPreviewCard} displayMode={cardDisplayMode} onDisplayMode={setCardDisplayMode} {...(previewHiddenSide ? { hiddenSide: previewHiddenSide } : {})} />
          <PlayerPanel view={activeView} title={sideLabel(activeView.side)} actionCapacity={actionSlotCapacities[activeView.side]} />
          <ChroniclePanel events={payload.eventTail} side={payload.side} cardDetailsById={catalogDetailsById} displayMode={cardDisplayMode} onFocusCard={focusCard} />
          <section className="section">
            <button className="button wide" onClick={() => setDiagnosticsOpen((current) => !current)}>
              <PanelRightOpen size={15} />
              Diagnostics
            </button>
          </section>
          <DiagnosticsDrawer open={diagnosticsOpen} payload={payload} connection={connection} />
        </aside>
      </div>
      {showResultModal && resultSummary ? (
        <GameOverModal
          result={resultSummary}
          side={session.side}
          onDismiss={() => {
            if (resultKey) setDismissedResultKey(resultKey);
          }}
          onNewMatch={leaveMatch}
          nextSeriesPending={seriesTransitioning}
          {...(opponentDisplayName ? { opponentName: opponentDisplayName } : {})}
          {...(resultSummary.series?.nextAvailable ? { onNextSeriesGame: startNextSeriesGame } : {})}
        />
      ) : null}
      {showAccessReveal && accessReveal ? (
        <AccessRevealModal
          reveal={accessReveal}
          displayMode={cardDisplayMode}
          disabled={Boolean(payload.winner) || connection !== "online"}
          onAction={submitAction}
          onDismiss={() => setDismissedAccessEventId(accessReveal.eventId)}
        />
      ) : null}
    </main>
  );
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div className="brand">
      <div className="mark">
        <Sparkles size={18} />
      </div>
      <div>
        <h1>Netrunner</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function StartLobbyPanel({
  lobby,
  joinUrl,
  chatText,
  connection,
  onReady,
  onCancel,
  onCancelMatch,
  onLeaveMatch,
  onRecreate,
  onDiscardLocal,
  onReturnToSetup,
  onChatText,
  onSendChat,
  onCopyJoinLink
}: {
  lobby: LobbyClientPayload;
  joinUrl?: string | undefined;
  chatText: string;
  connection: "offline" | "connecting" | "online";
  onReady: (ready: boolean) => void;
  onCancel: () => void;
  onCancelMatch: () => void;
  onLeaveMatch: () => void;
  onRecreate: () => void;
  onDiscardLocal: () => void;
  onReturnToSetup: () => void;
  onChatText: (value: string) => void;
  onSendChat: () => void;
  onCopyJoinLink: () => void;
}) {
  const start = lobby.startLobby;
  const selfPlayer = start ? playerSlotForSide(start, lobby.side) : "player_a";
  const self = start?.participants[selfPlayer];
  const opponentPlayer = selfPlayer === "player_a" ? "player_b" : "player_a";
  const opponent = start?.participants[opponentPlayer];
  const selfReady = self?.ready ?? false;
  const countdownActive = lobby.matchStatus === "countdown" && Boolean(start?.countdownEndsAt);
  const opponentReady = opponent?.ready ?? false;
  const terminal = isInvalidatingTerminalStatus(lobby.matchStatus) || lobby.matchStatus === "forfeited" || lobby.matchStatus === "finished";
  const isHost = selfPlayer === "player_a";
  const opponentName = lobby.opponentStatus.displayName ?? opponent?.displayName ?? "Gegenüber";
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const element = chatMessagesRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [start?.chatMessages.length]);
  return (
    <section className="startLobbyPanel">
      <div className="startLobbyHeader">
        <div>
          <p className="eyebrow">{terminal ? "Terminaler Matchstatus" : "Startbereitschaftslobby"}</p>
          <h2>{terminal ? terminalLobbyTitle(lobby.matchStatus, lobby.lifecycleResult) : start ? `Du startest als ${sideLabel(lobby.side)}` : "Match erstellt"}</h2>
          <p className="meta">{opponentName ? `Gegenüber: ${opponentName}` : ""}</p>
        </div>
        <div className="startLobbyHeaderActions">
          <span className={`statusPill ${connection}`}>{connection === "online" ? "online" : connection === "connecting" ? "verbindet" : "offline"}</span>
          {terminal ? (
            <>
              <button className="button primary" onClick={onRecreate} type="button">
                <CopyPlus size={15} />
                Neu erstellen
              </button>
              <button className="button subtle" onClick={onDiscardLocal} type="button">
                <Trash2 size={15} />
                Verwerfen
              </button>
            </>
          ) : (
            <button className="button subtle" onClick={onReturnToSetup} type="button">
              <RotateCcw size={15} />
              Zurück zur Auswahl
            </button>
          )}
        </div>
      </div>
      {joinUrl && lobby.pendingDeckHandshake ? (
        <div className="joinLinkRow">
          <input value={joinUrl} readOnly aria-label="Join-Link" />
          <button className="button" onClick={onCopyJoinLink} type="button">
            <Clipboard size={15} />
            Join-Link kopieren
          </button>
        </div>
      ) : null}
      {terminal ? (
        <p className="muted">{terminalLobbyMessage(lobby.matchStatus, lobby.lifecycleResult)}</p>
      ) : start ? (
        <>
          <div className="lobbyFacts">
            <span>{matchFormatLabel(start.matchFormat)}</span>
            <span title="Agenda-Punkte, die für den Spielsieg erreicht werden müssen.">Zielwert {start.agendaPointsToWin} Agenda-Punkte</span>
            <span>Countdown {start.countdownSeconds}s</span>
          </div>
          <div className="lobbyParticipants">
            <LobbyParticipantCard title="Du" participant={self} />
            <LobbyParticipantCard title="Gegenüber" participant={opponent} />
          </div>
          <div className="readinessSummary">
            <span>{selfReady ? "Du bist bereit." : "Du bist noch nicht bereit."}</span>
            <span>{opponentReady ? "Gegenüber ist bereit." : "Gegenüber ist noch nicht bereit."}</span>
          </div>
          <div className="lobbyActions">
            <button className="button primary" onClick={() => onReady(!selfReady)} type="button" disabled={connection !== "online"}>
              <Check size={15} />
              {selfReady ? "Bereitschaft zurücknehmen" : "Ich bin bereit"}
            </button>
            {countdownActive ? (
              <button className="button" onClick={onCancel} type="button">
                <X size={15} />
                Countdown abbrechen
              </button>
            ) : null}
            <button className="button dangerButton" onClick={isHost ? onCancelMatch : onLeaveMatch} type="button" disabled={connection !== "online"}>
              <X size={15} />
              {isHost ? "Match abbrechen" : "Lobby verlassen"}
            </button>
            <span className="countdownText">{countdownActive ? `Countdown bis ${formatLobbyTime(start.countdownEndsAt)}` : "Startet automatisch, sobald beide bereit sind."}</span>
          </div>
          <div className="lobbyChat">
            <div className="lobbyChatMessages" ref={chatMessagesRef}>
              {start.chatMessages.length === 0 ? <p className="muted">Noch keine Nachrichten.</p> : null}
              {start.chatMessages.map((message) => (
                <p key={message.id}>
                  <strong>{message.displayName}</strong>
                  <span>{formatLobbyTime(message.sentAt)}</span>
                  {message.text}
                </p>
              ))}
            </div>
            <div className="lobbyChatInput">
              <input
                value={chatText}
                maxLength={300}
                onChange={(event) => onChatText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onSendChat();
                }}
                placeholder="Kurze Nachricht"
              />
              <button className="button" onClick={onSendChat} type="button">
                Senden
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="muted">{lobby.pendingDeckHandshake?.message ?? "Die Lobby wird vorbereitet."}</p>
          <div className="lobbyActions">
            <button className="button dangerButton" onClick={isHost ? onCancelMatch : onLeaveMatch} type="button">
              <X size={15} />
              {isHost ? "Match abbrechen" : "Lobby verlassen"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function LobbyParticipantCard({ title, participant }: { title: string; participant?: LobbyParticipant | undefined }) {
  return (
    <div className="lobbyParticipantCard">
      <strong>{title}</strong>
      <span>{participant?.displayName ?? "Noch nicht verbunden"}</span>
      <span>{participant?.side ? sideLabel(participant.side) : "Seite offen"}</span>
      <span>{participant?.runnerDeckReady && participant.corpDeckReady ? "Decks geprüft" : "Decks offen"}</span>
      <span>{participant?.ready ? "Status: bereit" : "Status: nicht bereit"}</span>
      <span>{connectionQualityLabel(participant?.connectionQuality)}</span>
    </div>
  );
}

function AccessRevealModal({
  reveal,
  displayMode,
  disabled,
  onAction,
  onDismiss
}: {
  reveal: AccessReveal;
  displayMode: CardDisplayMode;
  disabled: boolean;
  onAction(action: LegalAction): void;
  onDismiss(): void;
}) {
  const primaryActions = reveal.actions.filter((action) => action.type !== "decline_trash");
  const declineAction = reveal.actions.find((action) => action.type === "decline_trash") ?? null;
  const runAction = (action: LegalAction) => {
    onAction(action);
    onDismiss();
  };

  return (
    <div className="accessRevealOverlay" role="dialog" aria-modal="true" aria-labelledby="access-reveal-title">
      <div className="accessRevealBackdrop" aria-hidden="true" />
      <section className="accessRevealPanel">
        <div className="accessRevealHeader">
          <div>
            <p className="eyebrow">Zugriff</p>
            <h2 id="access-reveal-title">Zugriff auf {reveal.serverTitleLabel}</h2>
            <p>Du hast auf eine Karte {reveal.serverLocationPhrase} zugegriffen.</p>
          </div>
          <button className="button iconOnly" onClick={onDismiss} aria-label="Fenster schließen" title="Schließen">
            <X size={16} />
          </button>
        </div>
        <div className="accessRevealBody">
          <div className="accessRevealCard">
            <CardView card={reveal.card} displayMode={displayMode} preview />
          </div>
          <div className="accessRevealDecision">
            <strong>{reveal.card.title}</strong>
            <p>{reveal.trashStatus}</p>
            {reveal.card.rulesText ? (
              <div className="cardRulesDetail">
                <strong>Regeltext</strong>
                <span className="cardRulesDetailText">
                  {rulesTextLines(reveal.card.rulesText).map((line, index) => (
                    <span key={`${reveal.card.instanceId}-access-rules-${index}`} className={isSubroutineRuleLine(reveal.card.type ?? "", reveal.card.rulesText ?? "", line) ? "subroutineLine" : undefined}>
                      {shouldAddFallbackSubroutineMarker(reveal.card.type ?? "", reveal.card.rulesText ?? "", line) ? <SubroutineIcon /> : null}
                      {renderRuleTextSegments(line, `${reveal.card.instanceId}-access-rules-${index}`)}
                    </span>
                  ))}
                </span>
              </div>
            ) : null}
            <div className="accessRevealActions">
              {primaryActions.map((action) => (
                <button className={`button primary ${action.type === "trash_accessed_card" || action.type === "trash_resource" ? "dangerButton" : ""}`} key={action.actionId} onClick={() => runAction(action)} disabled={disabled}>
                  {action.type === "trash_accessed_card" || action.type === "trash_resource" ? <Trash2 size={15} /> : <Shield size={15} />}
                  {accessDecisionLabel(action)}
                </button>
              ))}
              {declineAction ? (
                <button className="button" onClick={() => runAction(declineAction)} disabled={disabled}>
                  <Check size={15} />
                  {accessDecisionLabel(declineAction)}
                </button>
              ) : null}
              {reveal.actions.length === 0 ? (
                <button className="button" onClick={onDismiss}>
                  <Check size={15} />
                  Verstanden
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function accessDecisionLabel(action: LegalAction): string {
  if (action.type === "steal_agenda") return "Agenda stehlen";
  if (action.type === "trash_accessed_card") return "Trashen";
  if (action.type === "trash_resource") return "Resource trashen";
  if (action.type === "decline_trash") return "Nicht trashen";
  return action.label;
}

function GameOverModal({
  result,
  side,
  onDismiss,
  onNewMatch,
  onNextSeriesGame,
  opponentName,
  nextSeriesPending = false
}: {
  result: GameResultSummary;
  side: Side;
  onDismiss(): void;
  onNewMatch(): void;
  onNextSeriesGame?: () => void;
  opponentName?: string;
  nextSeriesPending?: boolean;
}) {
  const outcomeText =
    result.viewerOutcome === "won"
      ? "Du hast das Spiel gewonnen."
      : result.viewerOutcome === "lost"
        ? "Du hast das Spiel verloren."
        : "Das Spiel endet unentschieden.";
  const seriesText = result.series ? seriesStatusText(result.series) : null;
  return (
    <div className={`gameOverOverlay ${result.viewerOutcome}`} role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <div className="gameOverBackdrop" aria-hidden="true" />
      <section className="gameOverPanel">
        <div className="gameOverHero">
          <p className="eyebrow">{matchFormatLabel(result.matchFormat)}</p>
          <h2 id="game-over-title">{outcomeText}</h2>
          <p>{resultReasonLabel(result.reason)}</p>
        </div>
        <div className="gameOverStats">
          <Stat label="Runner Agenda" value={result.runnerAgendaPoints} />
          <Stat label="Corp Agenda" value={result.corpAgendaPoints} />
          <Stat label="Zielwert" value={result.agendaPointsToWin} />
          <Stat label="Aktionen" value={result.actionCount} />
          <Stat label="Runs" value={result.runCount} />
          <Stat label="Erfolgreich" value={result.successfulRunCount} />
          <Stat label="Gestohlen" value={result.stolenAgendaCount} />
          <Stat label="Gescored" value={result.scoredAgendaCount} />
        </div>
        {result.series ? (
          <div className="seriesStrip">
            <div>
              <span>Serienspiel {result.series.gameNumber}/{result.series.gamesPlanned}</span>
              <small>{seriesText}</small>
            </div>
            <div className="seriesScore">
              <span>Du {result.series.viewerWins}</span>
              <span>Gegenseite {result.series.opponentWins}</span>
              <span>Draws {result.series.draws}</span>
              <span>Agenda Du {result.series.viewerAgendaPoints}</span>
              <span>Agenda Gegenseite {result.series.opponentAgendaPoints}</span>
            </div>
          </div>
        ) : null}
        <div className="gameOverFooter">
          <div>
            <span>{result.winner === "draw" ? "Draw" : result.winner === side ? "Deine Seite gewinnt" : `${opponentName ?? "Gegenseite"} gewinnt`}</span>
            <small>{shortDiagnosticsHash(result.finalStateHash)}</small>
          </div>
          <div className="gameOverActions">
            <button className="button" onClick={onDismiss}>
              Board ansehen
            </button>
            {onNextSeriesGame ? (
              <button className="button primary" onClick={onNextSeriesGame} disabled={nextSeriesPending}>
                {nextSeriesPending ? "Erstelle..." : "Nächstes Serienspiel"}
              </button>
            ) : null}
            <button className="button primary" onClick={onNewMatch}>
              Neues Spiel
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function matchFormatLabel(format: MatchFormat): string {
  if (format === "two_game_side_swap") return "Private Matchserie";
  if (format === "rules_match") return "Regelmatch";
  return "Einzelspiel";
}

function resultReasonLabel(reason: GameResultSummary["reason"]): string {
  if (reason === "agenda_points") return "Das Agenda-Ziel wurde erreicht.";
  if (reason === "corp_deck_empty") return "Die Corp konnte keine Karte mehr ziehen.";
  if (reason === "flatline") return "Der Runner wurde flatlined.";
  if (reason === "draw") return "Beide Seiten erreichen gleichzeitig das Ziel.";
  if (reason === "forfeit") return "Das Spiel wurde durch Aufgabe beendet.";
  return "Das Spiel wurde abgeschlossen.";
}

function terminalLobbyTitle(status: MatchStatus, result?: LifecycleResultSummary): string {
  if (status === "cancelled") return "Match abgebrochen";
  if (status === "abandoned") return "Lobby verlassen";
  if (status === "forfeited") return result?.loserSide ? `${sideLabel(result.loserSide)} hat aufgegeben` : "Spiel aufgegeben";
  if (status === "finished") return "Spiel abgeschlossen";
  return "Match nicht mehr aktiv";
}

function terminalLobbyMessage(status: MatchStatus, result?: LifecycleResultSummary): string {
  if (status === "cancelled") return "Der Host hat dieses Match beendet. Der alte Join-Link und die alten Tokens sind ungültig.";
  if (status === "abandoned") return "Die Gegenseite hat die Lobby verlassen. Dieses Match springt nicht in die Bereitschaftslobby zurück.";
  if (status === "forfeited") return result?.winnerSide ? `${sideLabel(result.winnerSide)} gewinnt durch Aufgabe. Der Engine-State bleibt unverändert.` : "Das Spiel wurde durch Aufgabe beendet.";
  if (status === "finished") return "Das Spiel wurde regelgerecht beendet.";
  return "Dieser Matchzustand kann nicht fortgesetzt werden.";
}

function isInvalidatingTerminalStatus(status: MatchStatus): boolean {
  return status === "cancelled" || status === "abandoned";
}

function isKnownMatchStatus(status: string): status is MatchStatus {
  return (
    status === "pending" ||
    status === "waiting_for_runner" ||
    status === "waiting_for_corp" ||
    status === "waiting_for_joiner_decks" ||
    status === "ready_check" ||
    status === "countdown" ||
    status === "active" ||
    status === "cancelled" ||
    status === "abandoned" ||
    status === "forfeited" ||
    status === "finished"
  );
}

function seriesStatusText(series: SeriesResultSummary): string {
  if (series.status === "finished") {
    if (series.viewerWins > series.opponentWins) return "Du hast die Matchserie gewonnen.";
    if (series.viewerWins < series.opponentWins) return "Du hast die Matchserie verloren.";
    return "Die Matchserie endet unentschieden.";
  }
  return series.nextAvailable ? "Bereit für das nächste Spiel mit Seitenwechsel." : "Nächstes Serienspiel wurde bereits erstellt.";
}

function OptionsPanel({
  audioEnabled,
  audioVolume,
  cardDisplayMode,
  colorScheme,
  onAudioEnabled,
  onAudioVolume,
  onCardDisplayMode,
  onColorScheme
}: {
  audioEnabled: boolean;
  audioVolume: number;
  cardDisplayMode: CardDisplayMode;
  colorScheme: ColorScheme;
  onAudioEnabled(value: boolean): void;
  onAudioVolume(value: number): void;
  onCardDisplayMode(value: CardDisplayMode): void;
  onColorScheme(value: ColorScheme): void;
}) {
  return (
    <section className="optionsPanel panel">
      <div className="catalogHeader">
        <div>
          <h2>Optionen</h2>
          <p className="meta">Darstellung und Audio</p>
        </div>
        <SlidersHorizontal size={18} />
      </div>
      <div className="optionsContent">
        <ColorSchemeSettings scheme={colorScheme} onChange={onColorScheme} />
        <CardDisplaySettings mode={cardDisplayMode} onChange={onCardDisplayMode} />
        <BoardPreview displayMode={cardDisplayMode} />
        <AudioSettings enabled={audioEnabled} volume={audioVolume} onEnabled={onAudioEnabled} onVolume={onAudioVolume} />
        <SystemStatus />
      </div>
    </section>
  );
}

function SystemStatus() {
  return (
    <div className="systemStatus">
      <span>
        <Shield size={15} />
        Hidden-Info geschützt
      </span>
      <span>
        <Activity size={15} />
        Replay bereit
      </span>
    </div>
  );
}

function ColorSchemeSettings({ scheme, onChange }: { scheme: ColorScheme; onChange(value: ColorScheme): void }) {
  return (
    <div className="colorSchemeSettings">
      <div>
        <span className="settingsTitle">Farbschema</span>
        <span className="meta">Lokale Anzeigeoption, kein Match-State</span>
      </div>
      <div className="segmented themeToggle" role="group" aria-label="Farbschema">
        <button className={scheme === "black" ? "active" : ""} onClick={() => onChange("black")} type="button" title="Schwarzes Farbschema" aria-label="Schwarzes Farbschema">
          <Moon size={15} />
          Schwarz
        </button>
        <button className={scheme === "white" ? "active" : ""} onClick={() => onChange("white")} type="button" title="Weißes Farbschema" aria-label="Weißes Farbschema">
          <Sun size={15} />
          Weiß
        </button>
      </div>
    </div>
  );
}

function CardDisplaySettings({ mode, onChange, compact = false }: { mode: CardDisplayMode; onChange(value: CardDisplayMode): void; compact?: boolean }) {
  return (
    <div className={`cardDisplaySettings ${compact ? "compact" : ""}`}>
      <div>
        <span className="settingsTitle">Kartenanzeige</span>
        {!compact ? <span className="meta">Lokale Anzeigeoption, kein Match-State</span> : null}
      </div>
      <CardDisplayModeSelector mode={mode} onChange={onChange} iconOnly={compact} />
    </div>
  );
}

function CardDisplayModeSelector({ mode, onChange, iconOnly = false }: { mode: CardDisplayMode; onChange(value: CardDisplayMode): void; iconOnly?: boolean }) {
  return (
    <div className={`segmented cardDisplaySelector ${iconOnly ? "iconOnlySelector" : ""}`} role="group" aria-label="Kartenanzeige">
      <button className={mode === "placeholder" ? "active" : ""} onClick={() => onChange("placeholder")} type="button" title="Bildmodus: Regeltext für bekannte Karten per Hover oder Fokus" aria-label="Bildmodus">
        <Image size={15} />
        {!iconOnly ? "Bild" : <span className="srOnly">Bild</span>}
      </button>
      <button className={mode === "text-card" ? "active" : ""} onClick={() => onChange("text-card")} type="button" title="Textmodus ohne große leere Bildfläche" aria-label="Textmodus">
        <Keyboard size={15} />
        {!iconOnly ? "Text" : <span className="srOnly">Text</span>}
      </button>
      <button className={mode === "compact" ? "active" : ""} onClick={() => onChange("compact")} type="button" title="Kompaktmodus mit Regeltext per Tooltip oder Fokus" aria-label="Kompaktmodus">
        <ZoomIn size={15} />
        {!iconOnly ? "Kompakt" : <span className="srOnly">Kompakt</span>}
      </button>
    </div>
  );
}

function AudioSettings({
  enabled,
  volume,
  onEnabled,
  onVolume
}: {
  enabled: boolean;
  volume: number;
  onEnabled(value: boolean): void;
  onVolume(value: number): void;
}) {
  return (
    <div className="audioSettings">
      <button className={`button ${enabled ? "primary" : ""}`} type="button" onClick={() => onEnabled(!enabled)} title={enabled ? "Audioeffekte ausschalten" : "Audioeffekte einschalten · Testton"}>
        {enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        Audio
      </button>
      <label>
        Lautstärke
        <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(event) => onVolume(Number(event.target.value))} />
      </label>
    </div>
  );
}

function BoardPreview({ displayMode }: { displayMode: CardDisplayMode }) {
  const previewCards: VisibleCard[] = [
    { instanceId: "preview-runner", known: true, title: "Demo Program", type: "program", subtypes: ["Icebreaker"], strength: 2, rulesText: "1 Credit: +1 Stärke. 1 Credit: Brich 1 ICE-Subroutine." },
    { instanceId: "preview-corp", known: true, title: "Demo ICE", type: "ice", subtypes: ["Barrier"], strength: 3, rulesText: "End the run." },
    { instanceId: "preview-hidden", known: false }
  ];
  return (
    <div className="boardPreview" aria-label="Board-Vorschau">
      {previewCards.map((card) => (
        <CardView key={card.instanceId} card={card} displayMode={displayMode} compact hiddenSide="corp" />
      ))}
    </div>
  );
}

function OpponentActionOverlay({
  cue,
  queued,
  position,
  onPosition,
  onDismiss
}: {
  cue: OpponentActionCue | null;
  queued: number;
  position: CuePositionPreference;
  onPosition(position: CuePositionPreference): void;
  onDismiss(): void;
}) {
  const overlayRef = useRef<HTMLElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  if (!cue) return null;

  const setPreset = (preset: CuePositionPreset) => onPosition({ kind: "preset", preset });
  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragCue = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const overlay = overlayRef.current;
    const offset = dragOffsetRef.current;
    if (!overlay || !offset) return;
    const rect = overlay.getBoundingClientRect();
    onPosition(
      clampCuePosition(
        ((event.clientX - offset.x) / window.innerWidth) * 100,
        ((event.clientY - offset.y) / window.innerHeight) * 100,
        window.innerWidth,
        window.innerHeight,
        rect.width,
        rect.height
      )
    );
  };
  const stopDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <aside
      ref={overlayRef}
      className={`opponentCueOverlay ${cuePositionClassName(position)} importance-${cue.importance} visibility-${cue.visibility}`}
      style={cuePositionStyle(position)}
      aria-live="polite"
    >
      <div className="opponentCueIcon" aria-hidden="true">
        {cue.source === "ai" ? <Bot size={18} /> : cue.requiresLocalAttention ? <Sparkles size={18} /> : <Activity size={18} />}
      </div>
      <div className="opponentCueText">
        <span>{cue.requiresLocalAttention ? "Du bist gefragt" : cue.actorLabel}</span>
        <strong>{cue.title}</strong>
        {cue.description ? <p>{cue.description}</p> : null}
      </div>
      {queued > 0 ? <small>{queued} weitere</small> : null}
      <button
        className="button iconOnly cueDragHandle"
        onPointerDown={startDrag}
        onPointerMove={dragCue}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        aria-label="Hinweis verschieben"
        title="Hinweis verschieben"
        type="button"
      >
        <SlidersHorizontal size={15} />
      </button>
      <button className="button iconOnly" onClick={onDismiss} aria-label="Hinweis schließen" title="Hinweis schließen" type="button">
        <X size={15} />
      </button>
      <div className="opponentCueControls">
        <select
          aria-label="Hinweisposition"
          value={position.kind === "preset" ? position.preset : "custom"}
          onChange={(event) => {
            if (event.target.value === "custom") return;
            setPreset(event.target.value as CuePositionPreset);
          }}
        >
          <option value="top-right">Oben rechts</option>
          <option value="top-left">Oben links</option>
          <option value="bottom-right">Unten rechts</option>
          <option value="bottom-left">Unten links</option>
          <option value="center">Mitte</option>
          {position.kind === "custom" ? <option value="custom">Eigene Position</option> : null}
        </select>
        <button className="button" onClick={() => setPreset("top-right")} type="button">
          Zurücksetzen
        </button>
      </div>
    </aside>
  );
}

function AiPacingControls({
  presentation,
  mode,
  connection,
  onMode,
  onAdvance
}: {
  presentation: ClientPayload["aiTurnPresentation"] | undefined;
  mode: AiPacingMode;
  connection: "offline" | "connecting" | "online";
  onMode(mode: AiPacingMode): void;
  onAdvance(): void;
}) {
  if (!presentation) return null;
  const activeLabel = presentation.activeAiSide ? `${sideLabel(presentation.activeAiSide)}-KI ist am Zug` : "KI wartet";
  return (
    <section className="section aiPacingPanel">
      <div className="sectionTitleLine">
        <h2>KI-Takt</h2>
        <Bot size={16} />
      </div>
      <p className="meta">{activeLabel}</p>
      <div className="segmented aiPacingModes" role="group" aria-label="KI-Takt">
        {(["paced", "manual", "fast"] as const).map((value) => (
          <button className={mode === value ? "active" : ""} key={value} onClick={() => onMode(value)} type="button">
            {value === "paced" ? "Getaktet" : value === "manual" ? "Einzelschritt" : "Schnell"}
          </button>
        ))}
      </div>
      <button className="button wide primary" onClick={onAdvance} disabled={!presentation.canAdvanceAi || connection !== "online"} type="button">
        <Play size={15} />
        KI-Schritt
      </button>
    </section>
  );
}

function RunnerRigStrip({
  view,
  cardDetailsById,
  displayMode,
  selectedContext,
  contextualActions,
  actionDisabled,
  onFocus,
  onActionContext,
  onAction
}: {
  view: PlayerView;
  cardDetailsById: Record<string, CatalogCardDetail>;
  displayMode: CardDisplayMode;
  selectedContext: ActionContext | null;
  contextualActions: LegalAction[];
  actionDisabled: boolean;
  onFocus(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContext(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onAction(action: LegalAction): void;
}) {
  if (opponentSide(view.side) !== "runner") return null;
  const runnerRig = view.opponent.rig ?? [];
  const groups = groupRunnerRigCards(runnerRig);
  const cardActionsForRig = (card: VisibleCard): LegalAction[] => {
    if (!card.known) return [];
    return contextualActions.filter((action) => actionMatchesContext(action, { kind: "card", id: card.instanceId, label: card.title ?? "Karte" }));
  };
  return (
    <section className="runnerRigStrip">
      <div className="sectionTitleLine">
        <h2>Runner-Rig</h2>
        <RunIcon size={16} />
      </div>
      {groups.length > 0 ? (
        <div className="rigGroups">
          {groups.map((group) => (
            <div className="rigGroup" key={group.key}>
              <h3>{group.label}</h3>
              <div className="cards miniCards">
                {group.cards.map((card) => {
                  const displayCard = enrichVisibleCard(card, cardDetailsById);
                  return (
                    <CardView
                      key={card.instanceId}
                      card={displayCard}
                      compact
                      displayMode={displayMode}
                      selected={selectedContext?.kind === "card" && selectedContext.id === card.instanceId}
                      actions={cardActionsForRig(card)}
                      actionDisabled={actionDisabled}
                      onFocus={onFocus}
                      onActionContextSelect={onActionContext}
                      onAction={onAction}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="meta">Keine installierten Runner-Karten.</p>
      )}
    </section>
  );
}

function RunTimeline({
  view,
  legalActions,
  cardDetailsById,
  highlighted = false
}: {
  view: PlayerView;
  legalActions: LegalAction[];
  cardDetailsById: Record<string, CatalogCardDetail>;
  highlighted?: boolean;
}) {
  const currentStep = currentRunTimelineStep(view, legalActions);
  const encounteredIce = view.run?.encounteredIce ? enrichVisibleCard(view.run.encounteredIce, cardDetailsById) : null;
  const jackOutAvailable = hasLegalAction(legalActions, "jack_out");
  const breachProgress = breachProgressLabel(view);
  return (
    <div className={`runTimeline ${view.run ? "active" : ""} ${highlighted ? "cueHighlight" : ""}`}>
      <div className="runTimelineHead">
        <RunIcon size={18} />
        <span>{view.run ? `Run auf ${serverDisplayLabel(view.run.attackedServerId)}` : "Kein aktiver Run"}</span>
      </div>
      <div className="runSteps">
        {RUN_TIMELINE_STEPS.map((step) => (
          <span className={currentStep === step.id ? "current" : ""} key={step.id}>
            {step.label}
          </span>
        ))}
      </div>
      {jackOutAvailable ? <p className="runHint">Du kannst den Run jetzt abbrechen (Jack-out).</p> : null}
      {breachProgress ? <p className="runHint">{breachProgress}</p> : null}
      {encounteredIce ? (
        <div className="encounterFocus">
          <span>Begegnung</span>
          <strong>{encounteredIce.known ? [encounteredIce.title, encounteredIce.rulesText].filter(Boolean).join(" · ") : "Verdecktes ICE"}</strong>
        </div>
      ) : null}
    </div>
  );
}

function serverLabelFromId(serverId: string): string {
  return serverDisplayLabel(serverId);
}

function LegalActionsPanel({
  primaryActions,
  contextualActions,
  selectedContext,
  hasHiddenContextActions,
  cardContextActive = false,
  disabled,
  highlighted = false,
  onAction,
  onClearContext
}: {
  primaryActions: LegalAction[];
  contextualActions: LegalAction[];
  selectedContext: ActionContext | null;
  hasHiddenContextActions: boolean;
  cardContextActive?: boolean;
  disabled: boolean;
  highlighted?: boolean;
  onAction(action: LegalAction): void;
  onClearContext(): void;
}) {
  const grouped = primaryActions.reduce<Record<string, LegalAction[]>>((acc, action) => {
    const group = actionGroupLabel(action.type);
    acc[group] = [...(acc[group] ?? []), action];
    return acc;
  }, {});
  return (
    <section className={`section ${highlighted ? "cueHighlight" : ""}`}>
      <h2>Mögliche Aktionen</h2>
      <div className="actions">
        {Object.entries(grouped).map(([group, groupActions]) => (
          <div className="actionGroup" key={group}>
            <span>{group}</span>
            {groupActions.map((action) => (
              <button className="button actionButton primary" key={action.actionId} onClick={() => onAction(action)} disabled={disabled}>
                <Play size={15} />
                <span className="actionButtonLabel">{actionButtonLabel(action)}</span>
                <CostChips action={action} />
              </button>
            ))}
          </div>
        ))}
        {selectedContext ? (
          <div className="actionGroup selectedActionGroup">
            <div className="selectedActionTitle">
              <span>{actionContextTitle(selectedContext)}</span>
              <button className="button iconOnly" onClick={onClearContext} type="button" aria-label="Auswahl aufheben" title="Auswahl aufheben">
                <X size={14} />
              </button>
            </div>
            {contextualActions.map((action) => (
              <button className="button actionButton" key={action.actionId} onClick={() => onAction(action)} disabled={disabled}>
                <Play size={15} />
                <span className="actionButtonLabel">{actionButtonLabel(action)}</span>
                <CostChips action={action} />
              </button>
            ))}
            {contextualActions.length === 0 ? <p className="meta">Keine Aktion für diese Auswahl in diesem Fenster.</p> : null}
          </div>
        ) : hasHiddenContextActions ? (
          <p className="meta">Wähle eine eigene Karte oder ein sichtbares Boardobjekt für weitere Aktionen.</p>
        ) : null}
        {primaryActions.length === 0 && !selectedContext && !cardContextActive ? <p className="meta">Keine Aktion in diesem Fenster.</p> : null}
      </div>
    </section>
  );
}

function CostChips({ action }: { action: LegalAction }) {
  const chips = actionCostChips(action);
  if (chips.length === 0) return null;
  return (
    <span className="costChips" aria-label={`Kosten: ${chips.map((chip) => chip.label).join(" + ")}`}>
      {chips.map((chip) => (
        <span className={`costChip ${chip.kind}`} key={`${chip.kind}-${chip.amount}`}>
          <span className={chip.kind === "action" ? "costActionIcon" : "costCreditIcon"} aria-hidden="true" />
          {chip.amount}
        </span>
      ))}
    </span>
  );
}

function UndoPanel({
  pendingUndo,
  latestEventId,
  connection,
  onRequest,
  onResolve
}: {
  pendingUndo: ClientPayload["pendingUndo"] | undefined;
  latestEventId: string | undefined;
  connection: "offline" | "connecting" | "online";
  onRequest(): void;
  onResolve(accepted: boolean): void;
}) {
  return (
    <section className="section">
      <h2>Zurücknehmen</h2>
      {pendingUndo?.needsResponse ? (
        <div className="undoBox">
          <p className="meta">{pendingUndo.requestedBy === "runner" ? "Runner" : "Corp"} fragt Zurücknehmen an.</p>
          <div className="splitButtons">
            <button className="button primary" onClick={() => onResolve(true)}>
              <Check size={15} />
              OK
            </button>
            <button className="button" onClick={() => onResolve(false)}>
              <X size={15} />
              Nein
            </button>
          </div>
        </div>
      ) : (
        <button className="button wide" onClick={onRequest} disabled={!latestEventId || connection !== "online"}>
          <RotateCcw size={15} />
          Letzte Aktion anfragen
        </button>
      )}
    </section>
  );
}

function CardPreviewPanel({
  card,
  displayMode,
  onDisplayMode,
  hiddenSide
}: {
  card: DisplayVisibleCard | null;
  displayMode: CardDisplayMode;
  onDisplayMode(value: CardDisplayMode): void;
  hiddenSide?: Side;
}) {
  return (
    <section className="section cardPreviewPanel">
      <div className="previewTitleLine">
        <div>
          <h2>Vorschau</h2>
          <p className="meta">Kartenanzeige</p>
        </div>
        <CardDisplayModeSelector mode={displayMode} onChange={onDisplayMode} iconOnly />
      </div>
      {card ? (
        <div className={`previewModeShell mode-${displayMode}`}>
          <CardView card={card} displayMode={displayMode} {...(hiddenSide ? { hiddenSide } : {})} preview />
        </div>
      ) : (
        <p className="meta">Wähle eine Karte für die Vorschau.</p>
      )}
    </section>
  );
}

function ChroniclePanel({
  events,
  side,
  cardDetailsById,
  displayMode,
  onFocusCard
}: {
  events: PublicGameEvent[];
  side: Side;
  cardDetailsById: Record<string, CatalogCardDetail>;
  displayMode: CardDisplayMode;
  onFocusCard(card: DisplayVisibleCard): void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const entries = events
    .slice()
    .reverse()
    .map((event) => {
      const card = eventCardDetail(event, cardDetailsById);
      const item = formatChronicleEvent(event, side, {
        cardTitle: card?.title ?? null,
        cardText: card?.text ?? null,
        cardType: card?.type ?? null,
        cardDetailLines: card ? catalogDetailLines(card) : [],
        agendaPoints: typeof card?.numeric.agendaPoints === "number" ? card.numeric.agendaPoints : null
      });
      return { card, item };
    });

  return (
    <section className={`section chroniclePanel ${collapsed ? "collapsed" : ""}`}>
      <div className="sectionTitleLine">
        <div>
          <h2>Spielchronik</h2>
          {collapsed && entries.length > 0 ? <p className="chronicleCollapsedMeta">{entries.length} Einträge</p> : null}
        </div>
        <button
          className="button iconOnly chronicleToggle"
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Spielchronik ausklappen" : "Spielchronik einklappen"}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
      {!collapsed ? (
        <div className="chronicleList">
          {entries.length === 0 ? <p className="meta">Noch keine Einträge.</p> : null}
          {entries.map((entry, index) => {
            const group = chronicleGroupLabel(entry.item);
            const previousGroup = index > 0 ? chronicleGroupLabel(entries[index - 1]!.item) : null;
            return (
              <Fragment key={entry.item.id}>
                {group !== previousGroup ? <div className="chronicleGroup">{group}</div> : null}
                <ChronicleEntry item={entry.item} card={entry.card} displayMode={displayMode} onFocusCard={onFocusCard} />
              </Fragment>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function ChronicleEntry({
  item,
  card,
  displayMode,
  onFocusCard
}: {
  item: ChronicleItem;
  card: CatalogCardDetail | null;
  displayMode: CardDisplayMode;
  onFocusCard(card: DisplayVisibleCard): void;
}) {
  const tooltipText = card ? [card.title, ...item.cardDetailLines, card.text].filter(Boolean).join("\n") : item.cardTitle;
  const titleContainsCard = Boolean(item.cardTitle && item.title.includes(item.cardTitle));
  const previewCard = card ? visibleCardFromCatalogDetail(card) : null;
  return (
    <article className={`chronicleEntry chronicle-${item.category} importance-${item.importance} visibility-${item.visibility}`}>
      <div className="chronicleRail" aria-hidden={!item.actionUse}>
        <span className="chronicleRailIcon">
          <ChronicleIcon category={item.category} />
        </span>
        {item.actionUse ? (
          <span className="chronicleActionOrdinal" tabIndex={0} aria-label={item.actionUse.title}>
            {item.actionUse.label}
            <span className="chronicleActionTooltip" role="tooltip">
              {item.actionUse.title}
            </span>
          </span>
        ) : null}
      </div>
      <div className="chronicleContent">
        <div className="chronicleTopLine">
          <strong>
            <ChronicleTitle item={item} card={card} previewCard={previewCard} displayMode={displayMode} onFocusCard={onFocusCard} />
          </strong>
          <span className="chronicleCategory">{CHRONICLE_CATEGORY_LABELS[item.category]}</span>
        </div>
        {item.description ? <p className="chronicleDescription">{item.description}</p> : null}
        {item.chips.length > 0 ? (
          <div className="chronicleChips">
            {item.chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        ) : null}
        {item.cardTitle && !titleContainsCard ? (
          <button className="chronicleCardLine" type="button" disabled={!previewCard} onClick={() => previewCard && onFocusCard(previewCard)} title={tooltipText}>
            Karte: {item.cardTitle}
            <ChronicleCardHover card={card} item={item} displayMode={displayMode} />
          </button>
        ) : null}
        {item.cardText ? <p className="chronicleEffect">Effekt: {item.cardText}</p> : null}
      </div>
    </article>
  );
}

function ChronicleTitle({
  item,
  card,
  previewCard,
  displayMode,
  onFocusCard
}: {
  item: ChronicleItem;
  card: CatalogCardDetail | null;
  previewCard: DisplayVisibleCard | null;
  displayMode: CardDisplayMode;
  onFocusCard(card: DisplayVisibleCard): void;
}) {
  if (!item.cardTitle) return <>{item.title}</>;
  const index = item.title.indexOf(item.cardTitle);
  if (index < 0) return <>{item.title}</>;
  const title = card ? [card.title, ...item.cardDetailLines, card.text].filter(Boolean).join("\n") : item.cardTitle;
  return (
    <>
      {item.title.slice(0, index)}
      <button className={`chronicleCardName ${previewCard ? "hasDetail" : ""}`} type="button" disabled={!previewCard} onClick={() => previewCard && onFocusCard(previewCard)} title={title}>
        {item.cardTitle}
        <ChronicleCardHover card={card} item={item} displayMode={displayMode} />
      </button>
      {item.title.slice(index + item.cardTitle.length)}
    </>
  );
}

function ChronicleCardHover({ card, item, displayMode }: { card: CatalogCardDetail | null; item: ChronicleItem; displayMode: CardDisplayMode }) {
  if (!card) return null;
  const imageUrl = displayMode === "placeholder" ? localCardImageUrl(card.catalogCardId) : undefined;
  return (
    <span className={`chronicleCardTooltip ${imageUrl ? "imageMode" : "textMode"}`} role="tooltip">
      {imageUrl ? (
        <img className="chronicleCardImage" src={imageUrl} alt={`Kartenbild ${card.title}`} />
      ) : (
        <>
          <strong>{card.title}</strong>
          {item.cardDetailLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
          <p>{card.text}</p>
        </>
      )}
    </span>
  );
}

function ChronicleIcon({ category }: { category: ChronicleCategory }) {
  switch (category) {
    case "turn":
      return <Activity size={15} />;
    case "economy":
      return <Plus size={15} />;
    case "card":
      return <Layers3 size={15} />;
    case "run":
      return <Cable size={15} />;
    case "agenda":
      return <Shield size={15} />;
    case "danger":
      return <X size={15} />;
    case "hidden":
      return <Eye size={15} />;
    case "system":
    default:
      return <PanelRightOpen size={15} />;
  }
}

function DiagnosticsDrawer({ open, payload, connection }: { open: boolean; payload: ClientPayload; connection: "offline" | "connecting" | "online" }) {
  if (!open) return null;
  const hash = payload.finalStateHash ?? payload.eventTail.at(-1)?.stateHashAfter ?? payload.playerView.publicEvents.at(-1)?.stateHashAfter ?? "pending";
  return (
    <section className="section diagnosticsDrawer">
      <h2>Diagnostics</h2>
      <dl>
        <div>
          <dt>Connection</dt>
          <dd>{connection}</dd>
        </div>
        <div>
          <dt>StateVersion</dt>
          <dd>{payload.playerView.stateVersion}</dd>
        </div>
        <div>
          <dt>MatchVersion</dt>
          <dd>{payload.matchVersion}</dd>
        </div>
        <div>
          <dt>StateHash</dt>
          <dd>{shortDiagnosticsHash(hash)}</dd>
        </div>
        <div>
          <dt>Sync</dt>
          <dd>{connection === "online" ? "live" : "wartet"}</dd>
        </div>
        <div>
          <dt>Visibility</dt>
          <dd>side-filtered</dd>
        </div>
      </dl>
    </section>
  );
}

function shortDiagnosticsHash(hash: string): string {
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 14)}…`;
}

function CatalogPanel({
  cards,
  detail,
  filters,
  search,
  side,
  status,
  summary,
  selectedId,
  typeCounts,
  typeFilters,
  onSearch,
  onSide,
  onStatus,
  onSelect,
  onTypeFilter,
  onSelectAllTypes,
  onClearTypeFilters
}: {
  cards: CatalogCardSummary[];
  detail: CatalogCardDetail | null;
  filters: CatalogListResponse["filters"] | null;
  search: string;
  side: Side | "all";
  status: CatalogStatusKey | "all";
  summary: Partial<Record<CatalogStatusKey, number>>;
  selectedId: string | null;
  typeCounts: Partial<Record<CatalogTypeFilterKey, number>>;
  typeFilters: CatalogTypeFilterState;
  onSearch(value: string): void;
  onSide(value: Side | "all"): void;
  onStatus(value: CatalogStatusKey | "all"): void;
  onSelect(value: string): void;
  onTypeFilter(key: CatalogTypeFilterKey, selected: boolean): void;
  onSelectAllTypes(): void;
  onClearTypeFilters(): void;
}) {
  const catalogImageUrl = detail ? localCardImageUrl(detail.catalogCardId) : undefined;
  const detailRef = useRef<HTMLElement | null>(null);
  const [catalogListHeight, setCatalogListHeight] = useState<number | null>(null);

  useEffect(() => {
    const detailElement = detailRef.current;
    if (!detailElement) return;
    const syncListHeight = () => {
      if (!window.matchMedia("(min-width: 1081px)").matches) {
        setCatalogListHeight(null);
        return;
      }
      setCatalogListHeight(Math.max(380, Math.ceil(detailElement.getBoundingClientRect().height)));
    };
    syncListHeight();
    const observer = new ResizeObserver(syncListHeight);
    observer.observe(detailElement);
    window.addEventListener("resize", syncListHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncListHeight);
    };
  }, [detail?.catalogCardId]);

  return (
    <section className="catalogPanel panel">
      <div className="catalogHeader">
        <div>
          <h2>Katalog</h2>
          <p className="meta">
            {cards.length} Karten · {summary.playable ?? 0} playable · {summary.blocked ?? 0} blocked
          </p>
        </div>
      </div>
      <div className="catalogControls">
        <div className="searchBox catalogField">
          <label htmlFor="catalogSearch">Suche</label>
          <Search className="searchIcon" size={16} />
          <input id="catalogSearch" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Kartenname, Text, Subtyp" />
          {search ? (
            <button className="searchClearButton" onClick={() => onSearch("")} type="button" aria-label="Suche löschen" title="Suche löschen">
              <X size={14} />
            </button>
          ) : null}
        </div>
        <label>
          Seite
          <select value={side} onChange={(event) => onSide(event.target.value as Side | "all")}>
            <option value="all">Alle</option>
            {(filters?.sides ?? ["runner", "corp"]).map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => onStatus(event.target.value as CatalogStatusKey | "all")}>
            <option value="all">Alle</option>
            {(filters?.statuses ?? Object.keys(CATALOG_STATUS_LABELS)).map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="catalogTypeFilters">
          <legend>Kartentypen</legend>
          <div className="typeFilterActions">
            <button type="button" onClick={onSelectAllTypes}>
              Alle
            </button>
            <button type="button" onClick={onClearTypeFilters}>
              Keine
            </button>
          </div>
          <div className="typeFilterGroups">
            {CATALOG_TYPE_FILTER_GROUPS.map((group) => (
              <div className={`typeFilterGroup ${group.side}`} key={group.title}>
                <div className="typeFilterGroupTitle">{group.title}</div>
                <div className="typeFilterGrid">
                  {group.filters.map((filter) => (
                    <label className={`typeToggle ${group.side} ${typeFilters[filter.key] ? "checked" : ""}`} key={filter.key}>
                      <input checked={typeFilters[filter.key]} onChange={(event) => onTypeFilter(filter.key, event.target.checked)} type="checkbox" />
                      <span>{filter.label}</span>
                      <small>{typeCounts[filter.key] ?? 0}</small>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="catalogLayout">
        <div className="catalogList" style={catalogListHeight ? { maxHeight: `${catalogListHeight}px` } : undefined}>
          {cards.map((card) => (
            <button className={`catalogItem ${selectedId === card.catalogCardId ? "active" : ""}`} key={card.catalogCardId} onClick={() => onSelect(card.catalogCardId)}>
              <strong>{card.title}</strong>
              <span>
                {card.side} · {formatCatalogTypeLine(card)}
              </span>
              <StatusBadges statuses={card.statuses} compact />
            </button>
          ))}
          {cards.length === 0 ? <p className="meta catalogEmpty">Keine Treffer.</p> : null}
        </div>
        <article className="catalogDetail" ref={detailRef}>
          {detail ? (
            <>
              <div className="catalogDetailHead">
                <div>
                  <h3>{detail.title}</h3>
                  <p className="meta">
                    {detail.side} · {formatCatalogTypeLine(detail)} · {detail.setName} #{detail.collectorNumber}
                  </p>
                </div>
                <span className={`sideBadge ${detail.side}`}>{detail.side}</span>
              </div>
              {catalogImageUrl ? (
                <div className="catalogImagePreview">
                  <img src={catalogImageUrl} alt={`Kartenbild ${detail.title}`} />
                </div>
              ) : null}
              <StatusBadges statuses={detail.statuses} />
              <p className="catalogText">
                {rulesTextLines(detail.text).map((line, index) => (
                  <span key={`${detail.catalogCardId}-rules-${index}`} className={isSubroutineRuleLine(detail.type, detail.text, line) ? "subroutineLine" : undefined}>
                    {shouldAddFallbackSubroutineMarker(detail.type, detail.text, line) ? <SubroutineIcon /> : null}
                    {renderRuleTextSegments(line, `${detail.catalogCardId}-rules-${index}`)}
                  </span>
                ))}
              </p>
              <div className="catalogMetaGrid">
                {Object.entries(detail.numeric)
                  .filter(([, value]) => value !== null)
                  .map(([key, value]) => (
                    <span key={key}>
                      <strong>{value}</strong>
                      {key}
                    </span>
                  ))}
                <span>
                  <strong>{detail.engineCardId ? "ja" : "nein"}</strong>
                  engine
                </span>
              </div>
              {detail.blockReasons.length > 0 ? <p className="notice catalogNotice">{detail.blockReasons.join(" ")}</p> : null}
            </>
          ) : (
            <p className="meta">Keine Karte ausgewählt.</p>
          )}
        </article>
      </div>
    </section>
  );
}

function DeckSlotSelect({
  label,
  snapshots,
  localDecks,
  source,
  selectedSnapshotId,
  selectedLocalDeckId,
  disabled = false,
  onSource,
  onSnapshot,
  onLocalDeck
}: {
  label: string;
  snapshots: DeckSnapshot[];
  localDecks: EditableDeck[];
  source: "snapshot" | "local";
  selectedSnapshotId: string;
  selectedLocalDeckId: string;
  disabled?: boolean;
  onSource(value: "snapshot" | "local"): void;
  onSnapshot(value: string): void;
  onLocalDeck(value: string): void;
}) {
  return (
    <label className="deckSlotSelect">
      {label}
      <select
        value={source === "local" && selectedLocalDeckId ? `local:${selectedLocalDeckId}` : selectedSnapshotId}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.value.startsWith("local:")) {
            onSource("local");
            onLocalDeck(event.target.value.slice("local:".length));
          }
          else {
            onSource("snapshot");
            onSnapshot(event.target.value);
          }
        }}
      >
        {snapshots.map((snapshot) => (
          <option value={snapshot.deckSnapshotId} key={snapshot.deckSnapshotId}>
            Projekt-Snapshot · {snapshot.name}
          </option>
        ))}
        {localDecks.map((deck) => (
          <option value={`local:${deck.deckId}`} key={deck.deckId}>
            Meine Decks · {deck.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function DeckMetadataLine({ entries }: { entries: Array<{ label: string; metadata: DeckPublicMetadata | undefined }> }) {
  const visible = entries.filter((entry) => entry.metadata);
  if (visible.length === 0) return null;
  return (
    <div className="deckMetadataLine">
      {visible.map((entry) => (
        <span key={entry.label}>
          {entry.label}: {entry.metadata!.deckName} · {entry.metadata!.deckHash}
        </span>
      ))}
    </div>
  );
}

function DeckEditorPanel({
  localDecks,
  selectedDeck,
  selectedDeckDirty,
  validation,
  validatedSnapshot,
  playableCards,
  cardDetailsById,
  importText,
  exportText,
  onCreateEmpty,
  onSelectDeck,
  onUpdateDeck,
  onSave,
  onUpdateQuantity,
  onDuplicate,
  onDelete,
  onValidate,
  onUseForMatch,
  onExport,
  onImportText,
  onImport
}: {
  localDecks: EditableDeck[];
  selectedDeck: EditableDeck | null;
  selectedDeckDirty: boolean;
  validation: DeckValidationResult | null;
  validatedSnapshot: DeckSnapshot | null;
  playableCards: CatalogCardSummary[];
  cardDetailsById: Record<string, CatalogCardDetail>;
  importText: string;
  exportText: string;
  onCreateEmpty(side: Side): void;
  onSelectDeck(deckId: string): void;
  onUpdateDeck(deck: EditableDeck): void;
  onSave(): void;
  onUpdateQuantity(cardId: string, quantity: number): void;
  onDuplicate(): void;
  onDelete(): void;
  onValidate(): void;
  onUseForMatch(): void;
  onExport(): void;
  onImportText(value: string): void;
  onImport(): void;
}) {
  const [builderSearch, setBuilderSearch] = useState("");
  const [builderTypeFilters, setBuilderTypeFilters] = useState<CatalogTypeFilterState>({ ...ALL_CATALOG_TYPE_FILTERS });
  const [builderOnlyInDeck, setBuilderOnlyInDeck] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deckSideFilter, setDeckSideFilter] = useState<DeckSideFilter>("all");
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const totalCards = selectedDeck?.cards.reduce((sum, entry) => sum + entry.quantity, 0) ?? 0;
  const deckQuantities = useMemo(() => new Map(selectedDeck?.cards.map((entry) => [entry.cardId, entry.quantity]) ?? []), [selectedDeck?.cards]);
  const cardLookup = useMemo(() => new Map(playableCards.map((card) => [card.catalogCardId, card])), [playableCards]);
  const builderTypeCounts = useMemo(() => summarizeCatalogTypeFilters(playableCards), [playableCards]);
  const runnerDeckCount = localDecks.filter((deck) => deck.side === "runner").length;
  const corpDeckCount = localDecks.filter((deck) => deck.side === "corp").length;
  const filteredLocalDecks = useMemo(() => (deckSideFilter === "all" ? localDecks : localDecks.filter((deck) => deck.side === deckSideFilter)), [deckSideFilter, localDecks]);
  const visibleTypeFilterGroups = selectedDeck ? CATALOG_TYPE_FILTER_GROUPS.filter((group) => group.side === selectedDeck.side) : CATALOG_TYPE_FILTER_GROUPS;
  const libraryCards = useMemo(() => {
    const search = builderSearch.trim().toLowerCase();
    return playableCards
      .filter((card) => {
        if (builderOnlyInDeck && !deckQuantities.has(card.catalogCardId)) return false;
        if (!catalogCardMatchesTypeFilters(card, builderTypeFilters)) return false;
        if (!search) return true;
        return [card.title, card.type, card.faction, ...card.subtypes].some((value) => value.toLowerCase().includes(search));
      })
      .sort((left, right) => deckBuilderCardGroup(left).localeCompare(deckBuilderCardGroup(right)) || left.title.localeCompare(right.title));
  }, [builderOnlyInDeck, builderSearch, builderTypeFilters, deckQuantities, playableCards]);
  const deckRows = useMemo(
    () =>
      (selectedDeck?.cards ?? [])
        .map((entry) => ({ entry, card: cardLookup.get(entry.cardId) ?? null }))
        .sort((left, right) => deckBuilderCardGroup(left.card).localeCompare(deckBuilderCardGroup(right.card)) || (left.card?.title ?? left.entry.cardId).localeCompare(right.card?.title ?? right.entry.cardId)),
    [cardLookup, selectedDeck?.cards]
  );
  const previewCard = (previewCardId ? cardLookup.get(previewCardId) : null) ?? libraryCards[0] ?? deckRows[0]?.card ?? null;
  const previewQuantity = previewCard ? deckQuantities.get(previewCard.catalogCardId) ?? 0 : 0;
  useEffect(() => {
    if (!selectedDeck || deckSideFilter === "all" || selectedDeck.side === deckSideFilter) return;
    setDeckSideFilter(selectedDeck.side);
  }, [deckSideFilter, selectedDeck?.side]);
  const handleDeckSideFilter = (nextFilter: DeckSideFilter) => {
    setDeckSideFilter(nextFilter);
    const candidates = nextFilter === "all" ? localDecks : localDecks.filter((deck) => deck.side === nextFilter);
    if (selectedDeck && candidates.some((deck) => deck.deckId === selectedDeck.deckId)) return;
    onSelectDeck(candidates[0]?.deckId ?? "");
  };
  const createBlankDeck = (side: Side) => {
    setDeckSideFilter(side);
    onCreateEmpty(side);
  };
  const setVisibleBuilderTypes = (selected: boolean) => {
    setBuilderTypeFilters((current) => {
      const next = { ...current };
      for (const group of visibleTypeFilterGroups) {
        for (const filter of group.filters) next[filter.key] = selected;
      }
      return next;
    });
  };
  return (
    <section className="deckPanel panel">
      <div className="catalogHeader">
        <div>
          <h2>Meine Decks</h2>
          <p className="meta">
            Meine Decks · {localDecks.length} gespeichert · Runner {runnerDeckCount} · Corp {corpDeckCount}
          </p>
        </div>
        <div className="deckHeaderActions">
          <button className="button" onClick={() => createBlankDeck("runner")}>
            <Plus size={15} />
            Neues Runner-Deck
          </button>
          <button className="button corp" onClick={() => createBlankDeck("corp")}>
            <Plus size={15} />
            Neues Corp-Deck
          </button>
          <button className={`button ${importOpen ? "primary" : ""}`} onClick={() => setImportOpen((current) => !current)} type="button" aria-expanded={importOpen}>
            <Upload size={15} />
            Import
          </button>
        </div>
      </div>
      {importOpen ? (
        <div className="deckImportBox deckImportInline">
          <h3>Deck importieren</h3>
          <textarea className="deckTextArea" value={importText} onChange={(event) => onImportText(event.target.value)} placeholder='{"schemaVersion":"editable-deck-v0.6","deck":...}' />
          <button className="button wide" onClick={onImport} disabled={!importText.trim()}>
            <Upload size={15} />
            Importieren
          </button>
        </div>
      ) : null}
      <div className="deckWorkspace">
        <div className="deckEditor">
          <div className="deckDisplayRow">
            <div>
              <span className="settingsTitle">Anzeige</span>
              <span className="meta">{filteredLocalDecks.length} Decks in dieser Auswahl</span>
            </div>
            <div className="segmented deckSideFilter" role="group" aria-label="Deckseite anzeigen">
              <button className={deckSideFilter === "all" ? "active" : ""} onClick={() => handleDeckSideFilter("all")} type="button" aria-pressed={deckSideFilter === "all"}>
                Alle
              </button>
              <button className={deckSideFilter === "runner" ? "active runner" : "runner"} onClick={() => handleDeckSideFilter("runner")} type="button" aria-pressed={deckSideFilter === "runner"}>
                Runner
              </button>
              <button className={deckSideFilter === "corp" ? "active corp" : "corp"} onClick={() => handleDeckSideFilter("corp")} type="button" aria-pressed={deckSideFilter === "corp"}>
                Corp
              </button>
            </div>
          </div>
          <div className="deckSelectGrid">
            <label>
              Deck anzeigen
              <select value={selectedDeck && filteredLocalDecks.some((deck) => deck.deckId === selectedDeck.deckId) ? selectedDeck.deckId : ""} onChange={(event) => onSelectDeck(event.target.value)} disabled={filteredLocalDecks.length === 0}>
                <option value="">Kein lokales Deck</option>
                {filteredLocalDecks.map((deck) => (
                  <option value={deck.deckId} key={deck.deckId}>
                    {sideLabel(deck.side)} · {deck.name}
                  </option>
                ))}
              </select>
            </label>
            {selectedDeck ? (
              <label>
                Deckname ändern
                <input value={selectedDeck.name} onChange={(event) => onUpdateDeck({ ...selectedDeck, name: event.target.value })} />
              </label>
            ) : null}
          </div>
          {selectedDeck ? (
            <>
              <div className="deckFormGrid">
                <label>
                  Seite
                  <input value={selectedDeck.side} readOnly />
                </label>
                <label>
                  Karten
                  <input value={totalCards} readOnly />
                </label>
                <label>
                  Notiz
                  <input value={selectedDeck.notes ?? ""} onChange={(event) => onUpdateDeck({ ...selectedDeck, notes: event.target.value })} />
                </label>
              </div>
              {previewCard ? (
                <DeckBuilderPreview
                  card={previewCard}
                  detail={cardDetailsById[previewCard.catalogCardId]}
                  quantity={previewQuantity}
                  onAdd={() => onUpdateQuantity(previewCard.catalogCardId, previewQuantity + 1)}
                  onRemove={() => onUpdateQuantity(previewCard.catalogCardId, previewQuantity - 1)}
                />
              ) : null}
              <div className="deckBuilderGrid">
                <section className="deckLibraryPanel">
                  <div className="deckBuilderPanelHeader">
                    <div>
                      <h3>Kartenbibliothek</h3>
                      <p className="meta">
                        {libraryCards.length} von {playableCards.length} gültigen {sideLabel(selectedDeck.side)}-Karten
                      </p>
                    </div>
                    <Search size={17} />
                  </div>
                  <label className="deckBuilderSearch">
                    Suche
                    <input value={builderSearch} onChange={(event) => setBuilderSearch(event.target.value)} placeholder="Titel, Typ, Subtyp" />
                  </label>
                  <div className="deckBuilderFilterLine">
                    <label className={`deckBuilderToggle ${builderOnlyInDeck ? "checked" : ""}`}>
                      <input checked={builderOnlyInDeck} onChange={(event) => setBuilderOnlyInDeck(event.target.checked)} type="checkbox" />
                      Nur im Deck
                    </label>
                    <button type="button" onClick={() => setVisibleBuilderTypes(true)}>
                      Alle Typen
                    </button>
                    <button type="button" onClick={() => setVisibleBuilderTypes(false)}>
                      Keine Typen
                    </button>
                  </div>
                  <div className="deckBuilderTypes">
                    {visibleTypeFilterGroups.map((group) => (
                      <div className={`typeFilterGroup ${group.side}`} key={group.title}>
                        <div className="typeFilterGrid">
                          {group.filters.map((filter) => (
                            <label className={`typeToggle ${group.side} ${builderTypeFilters[filter.key] ? "checked" : ""}`} key={filter.key}>
                              <input checked={builderTypeFilters[filter.key]} onChange={(event) => setBuilderTypeFilters((current) => ({ ...current, [filter.key]: event.target.checked }))} type="checkbox" />
                              <span>{filter.label}</span>
                              <small>{builderTypeCounts[filter.key] ?? 0}</small>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="deckLibraryList">
                    {libraryCards.map((card) => (
                      <DeckLibraryCard
                        card={card}
                        detail={cardDetailsById[card.catalogCardId]}
                        key={card.catalogCardId}
                        quantity={deckQuantities.get(card.catalogCardId) ?? 0}
                        selected={previewCard?.catalogCardId === card.catalogCardId}
                        onAdd={() => onUpdateQuantity(card.catalogCardId, (deckQuantities.get(card.catalogCardId) ?? 0) + 1)}
                        onRemove={() => onUpdateQuantity(card.catalogCardId, (deckQuantities.get(card.catalogCardId) ?? 0) - 1)}
                        onSelect={() => setPreviewCardId(card.catalogCardId)}
                      />
                    ))}
                    {libraryCards.length === 0 ? <p className="meta deckEmpty">Keine passende Karte gefunden.</p> : null}
                  </div>
                </section>
                <section className="deckListPanel">
                  <div className="deckBuilderPanelHeader">
                    <div>
                      <h3>Deckliste</h3>
                      <p className="meta">{totalCards} Karten im aktuellen Entwurf</p>
                    </div>
                    <Layers3 size={17} />
                  </div>
                  <div className="deckCardList">
                    {deckRows.map((row, index) => {
                      const group = deckBuilderCardGroup(row.card);
                      const previousGroup = index > 0 ? deckBuilderCardGroup(deckRows[index - 1]?.card ?? null) : "";
                      return (
                        <Fragment key={row.entry.cardId}>
                          {group !== previousGroup ? <div className="deckCardGroup">{group}</div> : null}
                          <DeckListCard
                            card={row.card}
                            cardId={row.entry.cardId}
                            detail={row.card ? cardDetailsById[row.card.catalogCardId] : undefined}
                            quantity={row.entry.quantity}
                            onIncrement={() => onUpdateQuantity(row.entry.cardId, row.entry.quantity + 1)}
                            onDecrement={() => onUpdateQuantity(row.entry.cardId, row.entry.quantity - 1)}
                            onRemove={() => onUpdateQuantity(row.entry.cardId, 0)}
                            onSelect={() => setPreviewCardId(row.entry.cardId)}
                          />
                        </Fragment>
                      );
                    })}
                    {deckRows.length === 0 ? <p className="meta deckEmpty">Dieses Deck ist noch leer.</p> : null}
                  </div>
                </section>
              </div>
              <div className="deckActions">
                <button className="button primary" onClick={onSave} disabled={!selectedDeckDirty}>
                  <Save size={15} />
                  Speichern
                </button>
                <button className="button primary" onClick={onValidate}>
                  <Check size={15} />
                  Prüfen
                </button>
                <button className="button" onClick={onUseForMatch} disabled={!validatedSnapshot}>
                  <Play size={15} />
                  Im Matchstart auswählen
                </button>
                <button className="button" onClick={onExport}>
                  <Download size={15} />
                  Export
                </button>
                <button className="button" onClick={onDuplicate}>
                  <CopyPlus size={15} />
                  Duplizieren
                </button>
                <button className="button" onClick={onDelete}>
                  <Trash2 size={15} />
                  Löschen
                </button>
              </div>
              <p className={`deckSaveStatus ${selectedDeckDirty ? "dirty" : validation?.ok ? "ok" : validation && !validation.ok ? "bad" : "ok"}`}>
                {selectedDeckDirty ? "Ungespeicherte Änderungen" : validation?.ok ? "Gespeichert · geprüft · matchstartfähig" : validation && !validation.ok ? "Gespeichert · geprüft · nicht matchstartfähig" : "Gespeichert"}
              </p>
              <DeckValidationSummary validation={validation} snapshot={validatedSnapshot} />
              {exportText ? <textarea className="deckTextArea" value={exportText} readOnly /> : null}
            </>
          ) : (
            <p className="meta deckEmpty">
              {localDecks.length === 0 ? "Erstelle ein neues Deck oder importiere ein lokales Deck." : "In dieser Auswahl ist noch kein Deck vorhanden."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function DeckBuilderPreview({ card, detail, quantity, onAdd, onRemove }: { card: CatalogCardSummary; detail: CatalogCardDetail | undefined; quantity: number; onAdd(): void; onRemove(): void }) {
  const metrics = deckBuilderMetricLine(detail);
  return (
    <section className="deckBuilderPreview" aria-label="Kartenpreview">
      <DeckCardThumb cardId={card.catalogCardId} title={card.title} large />
      <div className="deckBuilderPreviewText">
        <span>{deckBuilderCardGroup(card)}</span>
        <strong>{card.title}</strong>
        <small>{formatCatalogTypeLine(card)}</small>
        {metrics ? <small>{metrics}</small> : null}
        <p>{detail?.text ?? "Kartentext wird geladen."}</p>
      </div>
      <div className="deckQuantityControls preview">
        <button className="deckQtyButton" onClick={onRemove} disabled={quantity <= 0} type="button" aria-label={`${card.title} entfernen`}>
          -
        </button>
        <output>{quantity}</output>
        <button className="deckQtyButton" onClick={onAdd} type="button" aria-label={`${card.title} hinzufügen`}>
          +
        </button>
      </div>
    </section>
  );
}

function DeckLibraryCard({
  card,
  detail,
  quantity,
  selected,
  onAdd,
  onRemove,
  onSelect
}: {
  card: CatalogCardSummary;
  detail: CatalogCardDetail | undefined;
  quantity: number;
  selected: boolean;
  onAdd(): void;
  onRemove(): void;
  onSelect(): void;
}) {
  const metrics = deckBuilderMetricLine(detail);
  const title = deckBuilderCardTooltip(card, detail);
  return (
    <article className={`deckLibraryCard ${quantity > 0 ? "inDeck" : ""} ${selected ? "selected" : ""}`} onClick={onSelect} title={title}>
      <DeckCardThumb cardId={card.catalogCardId} title={card.title} />
      <div className="deckBuilderCardText">
        <strong>{card.title}</strong>
        <span>{formatCatalogTypeLine(card)}</span>
        {metrics ? <small>{metrics}</small> : null}
        {detail?.text ? <p>{detail.text}</p> : null}
      </div>
      <div className="deckQuantityControls" aria-label={`${card.title} Menge`}>
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onRemove(); }} disabled={quantity <= 0} type="button" aria-label={`${card.title} entfernen`}>
          -
        </button>
        <output>{quantity}</output>
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onAdd(); }} type="button" aria-label={`${card.title} hinzufügen`}>
          +
        </button>
      </div>
    </article>
  );
}

function DeckListCard({
  card,
  cardId,
  detail,
  quantity,
  onIncrement,
  onDecrement,
  onRemove,
  onSelect
}: {
  card: CatalogCardSummary | null;
  cardId: string;
  detail: CatalogCardDetail | undefined;
  quantity: number;
  onIncrement(): void;
  onDecrement(): void;
  onRemove(): void;
  onSelect(): void;
}) {
  const title = card ? deckBuilderCardTooltip(card, detail) : cardId;
  const metrics = deckBuilderMetricLine(detail);
  return (
    <article className="deckListCard" onClick={onSelect} title={title}>
      <DeckCardThumb cardId={card?.catalogCardId ?? cardId} title={card?.title ?? cardId} />
      <div className="deckBuilderCardText">
        <strong>{card?.title ?? cardId}</strong>
        <span>{card ? formatCatalogTypeLine(card) : "Nicht im gültigen Kartenpool"}</span>
        {metrics ? <small>{metrics}</small> : null}
      </div>
      <div className="deckQuantityControls">
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onDecrement(); }} type="button" aria-label={`${card?.title ?? cardId} reduzieren`}>
          -
        </button>
        <output>{quantity}</output>
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onIncrement(); }} type="button" aria-label={`${card?.title ?? cardId} erhöhen`}>
          +
        </button>
        <button className="deckQtyButton remove" onClick={(event) => { event.stopPropagation(); onRemove(); }} type="button" aria-label={`${card?.title ?? cardId} entfernen`}>
          <Trash2 size={13} />
        </button>
      </div>
    </article>
  );
}

function DeckCardThumb({ cardId, title, large = false }: { cardId: string; title: string; large?: boolean }) {
  const imageUrl = localCardImageUrl(cardId);
  return (
    <span className={`deckCardThumb ${large ? "large" : ""} ${imageUrl ? "hasImage" : ""}`} aria-hidden="true">
      {imageUrl ? <img src={imageUrl} alt="" /> : <span>{title.slice(0, 1)}</span>}
    </span>
  );
}

function DeckValidationSummary({ validation, snapshot }: { validation: DeckValidationResult | null; snapshot: DeckSnapshot | null }) {
  if (!validation) return null;
  return (
    <div className={`deckValidation ${validation.ok ? "ok" : "bad"}`}>
      <strong>{validation.ok ? "Validiert" : "Nicht valide"}</strong>
      <span>
        {validation.totalCards} Karten{validation.agendaPoints !== null ? ` · ${validation.agendaPoints} Agenda Points` : ""}
      </span>
      {snapshot ? <small>{snapshot.deckHash}</small> : null}
      {[...validation.errors, ...validation.warnings].map((message) => (
        <small key={message}>{message}</small>
      ))}
    </div>
  );
}

function StatusBadges({ statuses, compact = false }: { statuses: CatalogStatuses; compact?: boolean }) {
  return (
    <div className={`statusBadges ${compact ? "compact" : ""}`}>
      {Object.entries(CATALOG_STATUS_LABELS)
        .filter(([key]) => statuses[key as CatalogStatusKey])
        .map(([key, label]) => (
          <span className={`statusBadge ${key}`} key={key}>
            {label}
          </span>
        ))}
    </div>
  );
}

function ConnectionBadge({ text, state }: { text: string; state: "offline" | "connecting" | "online" }) {
  return <span className={`connection ${state}`}>{text}</span>;
}

function OpponentPanel({ view, connected, displayName, actionCapacity }: { view: PlayerView; connected: boolean; displayName?: string; actionCapacity: number }) {
  const side = opponentSide(view.side);
  return (
    <section className="section">
      <h2>{displayName ? `${displayName} · ${sideLabel(side)}` : sideLabel(side)}</h2>
      <div className="stats">
        <CreditBadge credits={view.opponent.credits} />
        <ActionSlotMeter side={side} currentClicks={view.opponent.clicks} displayCapacity={actionCapacity} active={view.activeSide === side} compact />
        <Stat label="Agenda" value={view.opponent.agendaPoints} />
        {side === "runner" ? <Stat label="Tags" value={view.opponent.tags} /> : null}
      </div>
      <p className="meta statusLine">{connected ? "Verbunden" : "Offline"} · {view.activeSide === side ? "Aktiv" : "Wartet"}</p>
    </section>
  );
}

function PlayerPanel({ view, title, actionCapacity }: { view: PlayerView; title: string; actionCapacity: number }) {
  const visibleTags = view.side === "runner" ? view.own.tags : view.opponent.tags;
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="stats">
        <CreditBadge credits={view.own.credits} />
        <ActionSlotMeter side={view.side} currentClicks={view.own.clicks} displayCapacity={actionCapacity} active={view.activeSide === view.side} />
        <Stat label="Agenda" value={view.own.agendaPoints} />
        <Stat label="Tags" value={visibleTags} />
      </div>
      {view.deckMetadata ? (
        <div className="deckMini">
          <span>{view.deckMetadata.own.deckName}</span>
          <small>{view.deckMetadata.own.deckHash}</small>
        </div>
      ) : null}
      <p className="meta statusLine">{view.activeSide === view.side ? "Aktiv" : "Wartet"} · {view.timingPoint}</p>
    </section>
  );
}

function ActionSlotMeter({ side, currentClicks, displayCapacity, active, compact = false }: { side: Side; currentClicks: number; displayCapacity: number; active: boolean; compact?: boolean }) {
  const display = actionSlotDisplay(side, currentClicks, displayCapacity, active);
  return (
    <div className={`stat resourceStat actionResource ${active ? "active" : "inactive"} ${compact ? "compact" : ""}`} aria-label={`${display.label}${active ? " verfügbar" : " aktuell"}`}>
      <div className="resourceStatTop">
        <strong>{display.available}</strong>
        <span>Aktionen</span>
      </div>
      <div className="actionSlots" aria-hidden="true">
        {display.slots.map((slot) => (
          <span className={`actionSlot ${slot.state} ${slot.bonus ? "bonus" : ""}`} key={slot.index} />
        ))}
      </div>
    </div>
  );
}

function CreditBadge({ credits }: { credits: number }) {
  return (
    <div className="stat resourceStat creditResource" aria-label={`${credits} Credits`}>
      <div className="resourceStatTop">
        <span className="creditCoin" aria-hidden="true" />
        <strong>{credits}</strong>
      </div>
      <span>Credits</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SimulationResult({ summary }: { summary: AiSimulationSummary }) {
  return (
    <div className="simulationResult">
      <div className="stats">
        <Stat label="Aktionen" value={summary.actions} />
        <Stat label="Züge" value={summary.turns} />
      </div>
      <p className="meta statusLine">
        {summary.winner === "action_limit_reached" ? "Limit erreicht" : `${summary.winner === "runner" ? "Runner" : summary.winner === "corp" ? "Corp" : "Draw"} gewinnt`}
        {" · "}
        {summary.replayOk ? "Replay ok" : "Replay prüfen"}
      </p>
      <p className="meta hashLine">{summary.finalStateHash}</p>
      {summary.errors.length > 0 ? <p className="notice">{summary.errors.join(", ")}</p> : null}
    </div>
  );
}

function CardView({
  card,
  compact = false,
  preview = false,
  displayMode,
  hiddenSide,
  installedCorpCard = false,
  selected = false,
  actions = [],
  actionDisabled = false,
  positionBadge,
  onFocus,
  onActionContextSelect,
  onAction
}: {
  card: DisplayVisibleCard;
  compact?: boolean;
  preview?: boolean;
  displayMode: CardDisplayMode;
  hiddenSide?: Side;
  installedCorpCard?: boolean;
  selected?: boolean;
  actions?: LegalAction[];
  actionDisabled?: boolean;
  positionBadge?: string;
  onFocus?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContextSelect?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onAction?(action: LegalAction): void;
}) {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const [tooltipPlacement, setTooltipPlacement] = useState<"above" | "below">("below");
  const [actionMenuPlacement, setActionMenuPlacement] = useState<"above" | "below">("below");
  const [suppressCardTooltip, setSuppressCardTooltip] = useState(false);
  const hasCardActions = actions.length > 0;
  const showCardActions = selected && hasCardActions && Boolean(onAction);
  const typeClass = card.known && card.type ? ` ${card.type}` : "";
  const isCompact = compact || displayMode === "compact";
  const modeClass = displayMode === "text-card" ? " textCard" : displayMode === "compact" ? " compactCard" : " placeholderCard";
  const previewCard = preview ? cardWithoutDevelopmentCounters(card) : card;
  const detailLines = card.known ? cardDetailLines(previewCard) : [];
  const rulesText = card.known ? (card.rulesText ?? "") : "";
  const hasRulesText = rulesText.length > 0;
  const hasSubroutineMarkers = rulesTextLines(rulesText).some((line) => isSubroutineRuleLine(card.type ?? "", rulesText, line));
  const tooltipText = card.known ? [card.title, ...detailLines, rulesText].filter(Boolean).join("\n") : undefined;
  const showTooltip = card.known && hasRulesText && !showCardActions && !suppressCardTooltip;
  const tooltipId = showTooltip ? `card-tooltip-${card.instanceId.replace(/[^A-Za-z0-9_-]/g, "-")}` : undefined;
  const nativeTitle = showTooltip || showCardActions || suppressCardTooltip ? undefined : tooltipText;
  const cardImageUrl = card.known && displayMode === "placeholder" ? card.imageUrl : undefined;
  const visualImageUrl = cardImageUrl;
  const showArtBlock = !visualImageUrl && displayMode === "placeholder";
  const metaText = card.known ? detailLines.join(" · ") : "Verdeckt";
  const showMetaLine = !visualImageUrl && Boolean(metaText) && (!card.known || !compact || displayMode === "compact" || preview);
  const showRulesPreview = !visualImageUrl && card.known && hasRulesText && !isCompact;
  const installedState = installedCorpCard ? corpInstalledCardState(card) : null;
  const advancementCount = preview ? 0 : Math.max(0, Math.floor(card.advancementCounters ?? 0));
  const advancementLabel = advancementCount > 0 ? developmentCountLabel(advancementCount) : null;
  const strengthModifier = preview ? 0 : Math.max(0, Math.floor(card.strengthModifier ?? 0));
  const cardAriaLabel = card.known ? `Karte ${card.title}${advancementLabel ? `, ${advancementLabel}` : ""}` : advancementLabel ? `Verdeckte Karte, ${advancementLabel}` : "Verdeckte Karte";

  const updateOverlayPlacement = () => {
    const element = cardRef.current;
    if (!element) return;
    const cardRect = element.getBoundingClientRect();
    const boundary = nearestTooltipBoundary(element);
    const boundaryTop = Math.max(0, boundary.top);
    const boundaryBottom = Math.min(window.innerHeight, boundary.bottom);
    const spaceBelow = boundaryBottom - cardRect.bottom;
    const spaceAbove = cardRect.top - boundaryTop;
    const nextTooltipPlacement = spaceBelow < 118 && spaceAbove > spaceBelow ? "above" : "below";
    const estimatedActionMenuHeight = Math.min(196, Math.max(58, actions.length * 54 + 16));
    const nextActionMenuPlacement = spaceBelow < estimatedActionMenuHeight && spaceAbove > spaceBelow ? "above" : "below";
    if (card.known && hasRulesText) setTooltipPlacement(nextTooltipPlacement);
    if (hasCardActions) setActionMenuPlacement(nextActionMenuPlacement);
  };

  return (
    <div className={`cardSlot${showCardActions ? " actionMenuOpen" : ""}`}>
      {positionBadge ? (
        <span className="cardPositionBadge" aria-label={`ICE ${positionBadge}: äußerstes ICE zuerst`}>
          {positionBadge}
        </span>
      ) : null}
      <button
        ref={cardRef}
        type="button"
        className={`card${card.known ? typeClass : " hidden"}${modeClass}${visualImageUrl ? " withImage" : ""}${preview ? " preview" : ""}${installedState === "unrezzed" ? " unrezzedInstalled" : ""}${installedState === "rezzed" ? " rezzedInstalled" : ""}${hasCardActions ? " hasActions" : ""}${selected ? " selectedActionSource" : ""}`}
        onClick={() => {
          if (showCardActions) setSuppressCardTooltip(true);
          updateOverlayPlacement();
          onFocus?.(card, hiddenSide);
        }}
        onFocus={() => {
          updateOverlayPlacement();
          onFocus?.(card, hiddenSide);
        }}
        onPointerEnter={updateOverlayPlacement}
        onPointerLeave={() => setSuppressCardTooltip(false)}
        aria-label={cardAriaLabel}
        aria-describedby={tooltipId}
        title={nativeTitle}
      >
        {visualImageUrl ? <img className="cardImage" src={visualImageUrl} alt="" aria-hidden="true" /> : null}
        {showArtBlock ? <span className="cardArt" aria-hidden="true" /> : null}
        {visualImageUrl ? null : <span className="cardTitle">{card.known ? card.title : "Verdeckte Karte"}</span>}
        {showMetaLine ? <span className="cardMeta">{metaText}</span> : null}
        {showRulesPreview ? (
          <span className="cardRulesPreview">
            {rulesTextLines(rulesText).map((line, index) => (
              <span key={`${card.instanceId}-rules-${index}`} className={hasSubroutineMarkers ? "subroutineLine" : undefined}>
                {shouldAddFallbackSubroutineMarker(card.type ?? "", rulesText, line) ? <SubroutineIcon /> : null}
                {renderRuleTextSegments(line, `${card.instanceId}-rules-${index}`)}
              </span>
            ))}
          </span>
        ) : null}
        {advancementCount > 0 ? <AdvancementGems card={card} count={advancementCount} /> : null}
        {strengthModifier > 0 ? <StrengthBoostBadge amount={strengthModifier} /> : null}
        {tooltipId ? (
          <span className={`cardTooltip ${tooltipPlacement}`} id={tooltipId} role="tooltip">
            <strong>{card.title}</strong>
            {detailLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <span className="cardTooltipText">
              {rulesTextLines(rulesText).map((line, index) => (
                <span key={`${card.instanceId}-tooltip-rules-${index}`} className={hasSubroutineMarkers ? "subroutineLine" : undefined}>
                  {shouldAddFallbackSubroutineMarker(card.type ?? "", rulesText, line) ? <SubroutineIcon /> : null}
                  {renderRuleTextSegments(line, `${card.instanceId}-tooltip-rules-${index}`)}
                </span>
              ))}
            </span>
          </span>
        ) : null}
      </button>
      {hasCardActions ? (
        <button
          className={`cardActionMarker${showCardActions ? " active" : ""}`}
          type="button"
          aria-label={showCardActions ? "Kartenaktionen einklappen" : "Kartenaktionen anzeigen"}
          aria-expanded={showCardActions}
          onClick={() => {
            if (showCardActions) setSuppressCardTooltip(true);
            updateOverlayPlacement();
            onFocus?.(card, hiddenSide);
            if (card.known) onActionContextSelect?.(card, hiddenSide);
          }}
          onDoubleClick={() => {
            if (actions.length === 1 && onAction && !actionDisabled) onAction(actions[0]!);
          }}
          onPointerEnter={updateOverlayPlacement}
          onPointerLeave={() => setSuppressCardTooltip(false)}
        >
          <Play size={10} />
        </button>
      ) : null}
      {showCardActions ? <CardActionsPopover actions={actions} disabled={actionDisabled} placement={actionMenuPlacement} onAction={onAction!} /> : null}
    </div>
  );
}

function CardActionsPopover({ actions, disabled, placement, onAction }: { actions: LegalAction[]; disabled: boolean; placement: "above" | "below"; onAction(action: LegalAction): void }) {
  return (
    <div className={`cardActionsPopover ${placement}`} role="menu" aria-label="Kartenaktionen">
      {actions.map((action) => (
        <button className="button actionButton cardActionButton" key={action.actionId} onClick={() => onAction(action)} disabled={disabled} type="button" role="menuitem">
          <Play size={14} />
          <span className="actionButtonLabel">{contextualCardActionLabel(action)}</span>
          <CostChips action={action} />
        </button>
      ))}
    </div>
  );
}

function AdvancementGems({ card, count }: { card: DisplayVisibleCard; count: number }) {
  const visibleGemCount = Math.min(count, 4);
  return (
    <span className="advancementGems" aria-hidden="true">
      {Array.from({ length: visibleGemCount }, (_, index) => (
        <span className="advancementGem" key={`${card.instanceId}-development-${index}`} style={advancementGemStyle(card.instanceId, index)} />
      ))}
      {count > visibleGemCount ? <span className="advancementGemCount">x{count}</span> : null}
    </span>
  );
}

function StrengthBoostBadge({ amount }: { amount: number }) {
  return (
    <span className="strengthBoostBadge" aria-label={`+${amount} Stärke`}>
      +{amount} Stärke
    </span>
  );
}

function advancementGemStyle(instanceId: string, index: number): CSSProperties {
  const seed = hashString(`${instanceId}:${index}`);
  const x = 18 + (seed % 58);
  const y = 14 + (Math.floor(seed / 7) % 45);
  const rotation = (Math.floor(seed / 17) % 38) - 19;
  const scale = 0.9 + ((Math.floor(seed / 31) % 18) / 100);
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: `rotate(${rotation}deg) scale(${scale})`
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nearestTooltipBoundary(element: HTMLElement): DOMRect {
  let current = element.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflow = `${style.overflow} ${style.overflowY} ${style.overflowX}`;
    if (/(auto|scroll|hidden|clip)/.test(overflow)) return current.getBoundingClientRect();
    current = current.parentElement;
  }
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
}

function cardDetailLines(card: VisibleCard): string[] {
  const typeLine = [card.type, card.subtypes?.join(" / ")].filter(Boolean).join(" · ");
  const numberLine = [
    card.advancementCounters && card.advancementCounters > 0 ? developmentCountLabel(card.advancementCounters) : null,
    valueLabel("Kosten", card.cost),
    valueLabel("Install", card.installCost),
    valueLabel("MU", card.memoryCost),
    valueLabel("Rez", card.rezCost),
    valueLabel("Trash", card.trashCost),
    neededDevelopmentLabel(card.advancementRequirement),
    valueLabel("Agenda", card.agendaPoints),
    valueLabel("Stärke", card.strength)
  ]
    .filter(Boolean)
    .join(" · ");
  return [typeLine, numberLine].filter(Boolean);
}

function cardWithoutDevelopmentCounters(card: DisplayVisibleCard): DisplayVisibleCard {
  const { advancementCounters: _advancementCounters, ...nativeCard } = card;
  return nativeCard;
}

function valueLabel(label: string, value: number | undefined): string | null {
  return value === undefined ? null : `${label} ${value}`;
}

function developmentCountLabel(count: number): string {
  return `${count} ${count === 1 ? "Entwicklung" : "Entwicklungen"}`;
}

function neededDevelopmentLabel(count: number | undefined): string | null {
  return count === undefined ? null : `Benötigt ${count} ${count === 1 ? "Entwicklung" : "Entwicklungen"}`;
}

function runnerHandLimit(_view: PlayerView): number {
  return RUNNER_BASE_HAND_LIMIT;
}

function ZoneLimitBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="zoneLimitBadge" aria-label={`${label} ${value}`}>
      <strong>{label}</strong>
      <span>{value}</span>
    </span>
  );
}

function fromInitialResponse(response: CreateMatchResponse, side: Side): ClientPayload {
  if (!response.playerView) throw new Error("Match ist noch nicht aktiv.");
  const winner = response.winner ?? response.playerView.winner;
  const payload: ClientPayload = {
    matchId: response.matchId,
    matchStatus: response.matchStatus ?? (response.mode === "human_vs_human" ? "pending" : "active"),
    matchVersion: response.matchVersion,
    side,
    playerView: response.playerView,
    legalActions: response.legalActions,
    eventTail: response.playerView.publicEvents,
    opponentStatus: { side: side === "runner" ? "corp" : "runner", connected: response.mode !== "human_vs_human" }
  };
  if (response.aiTurnPresentation) payload.aiTurnPresentation = response.aiTurnPresentation;
  if (winner) payload.winner = winner;
  if (response.finalStateHash) payload.finalStateHash = response.finalStateHash;
  if (response.resultSummary) payload.resultSummary = response.resultSummary;
  return payload;
}

function fromJoinedResponse(response: JoinMatchResponse): ClientPayload {
  if (!response.playerView) throw new Error("Match ist noch nicht aktiv.");
  const winner = response.winner ?? response.playerView.winner;
  const payload: ClientPayload = {
    matchId: response.matchId,
    matchStatus: response.matchStatus ?? "active",
    matchVersion: response.matchVersion,
    side: response.side,
    playerView: response.playerView,
    legalActions: response.legalActions,
    eventTail: response.eventTail ?? response.playerView.publicEvents,
    opponentStatus: { side: response.side === "runner" ? "corp" : "runner", connected: false }
  };
  if (response.aiTurnPresentation) payload.aiTurnPresentation = response.aiTurnPresentation;
  if (winner) payload.winner = winner;
  if (response.finalStateHash) payload.finalStateHash = response.finalStateHash;
  if (response.resultSummary) payload.resultSummary = response.resultSummary;
  return payload;
}

function lobbyFromInitialResponse(response: CreateMatchResponse, side: Side): LobbyClientPayload {
  return {
    matchId: response.matchId,
    matchStatus: response.matchStatus ?? "pending",
    matchVersion: response.matchVersion,
    side,
    eventTail: [],
    opponentStatus: { side: side === "runner" ? "corp" : "runner", connected: false },
    ...(response.pendingDeckHandshake ? { pendingDeckHandshake: { required: true, message: "Die Lobby wartet auf die Deckauswahl von Teilnehmer B." } } : {}),
    ...(response.lobby ? { startLobby: response.lobby } : {})
  };
}

function lobbyFromJoinedResponse(response: JoinMatchResponse): LobbyClientPayload {
  return {
    matchId: response.matchId,
    matchStatus: response.matchStatus ?? "ready_check",
    matchVersion: response.matchVersion,
    side: response.side,
    eventTail: response.eventTail ?? [],
    opponentStatus: { side: response.side === "runner" ? "corp" : "runner", connected: false },
    ...(response.lobby ? { startLobby: response.lobby } : {})
  };
}

async function bootstrap(session: SessionInfo): Promise<ClientPayload | LobbyClientPayload | null> {
  const response = await fetch(`${SERVER_HTTP}/api/matches/${encodeURIComponent(session.matchId)}/bootstrap?side=${session.side}`, {
    headers: { authorization: `Bearer ${session.sessionToken}` },
    cache: "no-store"
  });
  if (!response.ok) return null;
  return (await response.json()) as ClientPayload | LobbyClientPayload;
}

function playerSlotForSide(lobby: MatchStartLobby, side: Side): "player_a" | "player_b" {
  return lobby.sideAssignment.runnerPlayer === "player_a" && side === "runner" ? "player_a" : lobby.sideAssignment.corpPlayer === "player_a" && side === "corp" ? "player_a" : "player_b";
}

function connectionQualityLabel(quality: LobbyParticipant["connectionQuality"] | undefined): string {
  if (quality === "online") return "online";
  if (quality === "unstable") return "instabil";
  return "offline";
}

function formatLobbyTime(value: string | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}

function rememberDisplayName(name: string): void {
  const trimmed = name.trim();
  if (trimmed) window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, trimmed);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${SERVER_HTTP}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return (await response.json()) as T;
}

function seriesAudioOutcome(result: GameResultSummary): GameResultSummary["viewerOutcome"] {
  if (result.series?.status !== "finished") return result.viewerOutcome;
  if (result.series.viewerWins > result.series.opponentWins) return "won";
  if (result.series.viewerWins < result.series.opponentWins) return "lost";
  return "draw";
}

function primeAudio(volume: number): void {
  playActionCueSound("choice", volume);
}

function audioContext(): AudioContext | null {
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedAudioContext || sharedAudioContext.state === "closed") sharedAudioContext = new AudioCtor();
  if (sharedAudioContext.state === "suspended") void sharedAudioContext.resume().catch(() => undefined);
  return sharedAudioContext;
}

function playResultSound(outcome: GameResultSummary["viewerOutcome"], volume: number): void {
  const context = audioContext();
  if (!context) return;
  const safeVolume = Math.min(1, Math.max(0, volume));
  const notes =
    outcome === "won"
      ? [523.25, 659.25, 783.99]
      : outcome === "lost"
        ? [392, 329.63, 261.63]
        : [440, 493.88, 440];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * 0.11;
    oscillator.type = outcome === "lost" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, safeVolume * 0.12), start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.17);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.19);
  });
}

function playActionCueSound(kind: ActionSoundKind, volume: number): void {
  const context = audioContext();
  if (!context) return;
  const safeVolume = Math.min(1, Math.max(0, volume));
  const pattern = actionSoundPattern(kind);
  pattern.forEach((note, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * 0.075;
    oscillator.type = note.type;
    oscillator.frequency.setValueAtTime(note.frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, safeVolume * note.gain), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + note.duration + 0.02);
  });
}

function actionSoundPattern(kind: ActionSoundKind): Array<{ frequency: number; duration: number; gain: number; type: OscillatorType }> {
  switch (kind) {
    case "draw":
      return [{ frequency: 660, duration: 0.11, gain: 0.07, type: "sine" }];
    case "credit":
      return [{ frequency: 784, duration: 0.09, gain: 0.08, type: "triangle" }];
    case "install_hidden":
      return [{ frequency: 220, duration: 0.13, gain: 0.07, type: "triangle" }];
    case "install_known":
      return [{ frequency: 392, duration: 0.11, gain: 0.07, type: "sine" }];
    case "play":
      return [
        { frequency: 440, duration: 0.09, gain: 0.06, type: "sine" },
        { frequency: 554, duration: 0.1, gain: 0.05, type: "sine" }
      ];
    case "rez":
      return [
        { frequency: 196, duration: 0.09, gain: 0.07, type: "sawtooth" },
        { frequency: 392, duration: 0.12, gain: 0.05, type: "sawtooth" }
      ];
    case "run":
      return [
        { frequency: 330, duration: 0.07, gain: 0.06, type: "square" },
        { frequency: 494, duration: 0.08, gain: 0.05, type: "square" }
      ];
    case "access":
      return [{ frequency: 587, duration: 0.14, gain: 0.07, type: "triangle" }];
    case "agenda":
      return [
        { frequency: 523, duration: 0.1, gain: 0.07, type: "sine" },
        { frequency: 784, duration: 0.14, gain: 0.06, type: "sine" }
      ];
    case "trash":
      return [{ frequency: 174, duration: 0.15, gain: 0.08, type: "triangle" }];
    case "tag_or_damage":
      return [
        { frequency: 247, duration: 0.08, gain: 0.08, type: "square" },
        { frequency: 220, duration: 0.1, gain: 0.06, type: "square" }
      ];
    case "choice":
      return [{ frequency: 880, duration: 0.12, gain: 0.07, type: "sine" }];
    case "game_end":
      return [
        { frequency: 523, duration: 0.1, gain: 0.07, type: "sine" },
        { frequency: 659, duration: 0.1, gain: 0.06, type: "sine" }
      ];
    case "turn":
    default:
      return [{ frequency: 330, duration: 0.1, gain: 0.05, type: "sine" }];
  }
}

function persistSession(session: SessionInfo, remotePayload?: ClientPayload | LobbyClientPayload) {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  rememberRecentSession(session, remotePayload);
}

function rememberRecentSession(session: SessionInfo, remotePayload?: ClientPayload | LobbyClientPayload) {
  const recent = loadRecentSessions().filter((candidate) => !(candidate.matchId === session.matchId && candidate.side === session.side));
  const next: RecentSessionInfo[] = [safeRecentSession(session, remotePayload), ...recent].slice(0, 4);
  window.localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(next));
}

function safeRecentSession(session: SessionInfo, remotePayload?: ClientPayload | LobbyClientPayload): RecentSessionInfo {
  return {
    matchId: session.matchId,
    side: session.side,
    displayName: session.displayName,
    ...(remotePayload?.opponentStatus.displayName ? { opponentDisplayName: remotePayload.opponentStatus.displayName } : {}),
    ...(remotePayload?.matchStatus ? { matchStatus: remotePayload.matchStatus } : {}),
    savedAt: new Date().toISOString()
  };
}

function loadRecentSession(): RecentSessionInfo | null {
  return loadRecentSessions()[0] ?? null;
}

function loadRecentSessions(): RecentSessionInfo[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SESSIONS_KEY) ?? "[]") as unknown[];
    const sanitized = parsed
      .map(sanitizeRecentSession)
      .filter((session): session is RecentSessionInfo => Boolean(session))
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
      .slice(0, 4);
    if (sanitized.length > 0) window.localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(sanitized));
    else window.localStorage.removeItem(RECENT_SESSIONS_KEY);
    return sanitized;
  } catch {
    window.localStorage.removeItem(RECENT_SESSIONS_KEY);
    return [];
  }
}

function sanitizeRecentSession(value: unknown): RecentSessionInfo | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.matchId !== "string") return null;
  if (candidate.side !== "runner" && candidate.side !== "corp") return null;
  const savedAt = typeof candidate.savedAt === "string" ? candidate.savedAt : new Date().toISOString();
  const displayName = typeof candidate.displayName === "string" && candidate.displayName.trim() ? candidate.displayName : "Du";
  const matchStatus = typeof candidate.matchStatus === "string" && isKnownMatchStatus(candidate.matchStatus) ? candidate.matchStatus : undefined;
  const opponentDisplayName = typeof candidate.opponentDisplayName === "string" && candidate.opponentDisplayName.trim() ? candidate.opponentDisplayName : undefined;
  return {
    matchId: candidate.matchId,
    side: candidate.side,
    displayName,
    ...(opponentDisplayName ? { opponentDisplayName } : {}),
    ...(matchStatus ? { matchStatus } : {}),
    savedAt
  };
}

function loadStoredSession(): SessionInfo | null {
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as SessionInfo;
    if (!parsed.matchId || !parsed.sessionToken || !parsed.reconnectToken || (parsed.side !== "runner" && parsed.side !== "corp")) return null;
    return parsed;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function storedSessionMatches(recent: RecentSessionInfo | null): boolean {
  if (!recent) return false;
  const stored = loadStoredSession();
  return Boolean(stored && stored.matchId === recent.matchId && stored.side === recent.side);
}

function removeRecentSession(session: Pick<RecentSessionInfo | SessionInfo, "matchId" | "side">): void {
  const next = loadRecentSessions().filter((candidate) => !(candidate.matchId === session.matchId && candidate.side === session.side));
  if (next.length > 0) window.localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(next));
  else window.localStorage.removeItem(RECENT_SESSIONS_KEY);
}
