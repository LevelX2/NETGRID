"use client";

import {
  Activity,
  Bot,
  Cable,
  Check,
  Clipboard,
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
import type { DeckPublicMetadata, LegalAction, PlayerView, PublicGameEvent, Side, VisibleCard, Winner } from "@netrunner/shared";
import {
  CHRONICLE_CATEGORY_LABELS,
  chronicleGroupLabel,
  formatChronicleEvent,
  type ChronicleCategory,
  type ChronicleItem
} from "./chronicle";

const SERVER_HTTP = process.env.NEXT_PUBLIC_NETRUNNER_SERVER_URL ?? "http://127.0.0.1:8787";
const SESSION_KEY = "netrunner-mvp-0-3-session";
const DECK_STORAGE_KEY = "netrunner-v0-6-local-decks";
const AUDIO_STORAGE_KEY = "netrunner-s01-audio";
const COLOR_SCHEME_STORAGE_KEY = "netgrid-color-scheme";
const DEFAULT_RUNNER_SNAPSHOT_ID = "demo_runner_008_snapshot_v0_8";
const DEFAULT_CORP_SNAPSHOT_ID = "demo_corp_008_snapshot_v0_8";
const DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID = "card-snapshot-0.8";
const DEFAULT_DECK_FORMAT_PROFILE_ID = "local-demo-v0.8";
const APP_STATUS_LABEL = "V1.0.1";
const DEFAULT_IDENTITY_BY_SIDE: Record<Side, string> = {
  runner: "runner_identity_001",
  corp: "corp_identity_001"
};

type MatchStatus = "waiting_for_runner" | "waiting_for_corp" | "waiting_for_joiner_decks" | "active" | "finished";
type GameMode = "human_vs_human" | "human_runner_vs_corp_ai" | "human_corp_vs_runner_ai" | "ai_vs_ai";
type MatchFormat = "single_game" | "rules_match" | "two_game_side_swap";
type AiDifficulty = "easy" | "normal" | "hard";
type AiDeckPolicy = "fixed" | "selected" | "seeded_random";
type CardDisplayMode = "placeholder" | "text-card" | "compact";
type ColorScheme = "black" | "white";
type EntryTab = "play" | "catalog" | "decks" | "options";

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
  viewerOutcome: "won" | "lost" | "draw";
  reason: "agenda_points" | "corp_deck_empty" | "flatline" | "draw" | "unknown";
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
  series?: SeriesResultSummary;
};

type ClientPayload = {
  matchId: string;
  matchStatus: MatchStatus;
  matchVersion: number;
  side: Side;
  playerView: PlayerView;
  legalActions: LegalAction[];
  eventTail: PublicGameEvent[];
  opponentStatus: { side: Side; connected: boolean };
  pendingUndo?: {
    undoRequestId: string;
    requestedBy: Side;
    targetEventId: string;
    reason?: string;
    needsResponse: boolean;
  };
  winner?: Winner;
  finalStateHash?: string;
  resultSummary?: GameResultSummary;
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

type ServerMessage =
  | { type: "state_update"; payload: { matchStatus: MatchStatus; matchVersion: number; playerView: PlayerView } }
  | { type: "legal_actions"; payload: { legalActions: LegalAction[] } }
  | { type: "event_log_update"; payload: { events: PublicGameEvent[] } }
  | { type: "opponent_status"; payload: ClientPayload["opponentStatus"] }
  | { type: "undo_request"; payload: NonNullable<ClientPayload["pendingUndo"]> }
  | { type: "match_finished"; payload: { winner: Winner; finalStateHash: string; resultSummary?: GameResultSummary } }
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
  playerView: PlayerView;
  legalActions: LegalAction[];
  matchVersion: number;
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
  playerView: PlayerView;
  legalActions: LegalAction[];
  matchVersion: number;
  eventTail?: PublicGameEvent[];
  winner?: Winner;
  finalStateHash?: string;
  resultSummary?: GameResultSummary;
  error?: { message: string };
};

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
};

type FocusedCard = {
  card: VisibleCard;
  hiddenSide?: Side;
};

type AccessReveal = {
  eventId: string;
  serverLabel: string;
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
  advancementRequirement: "Fortschritt",
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

function cardBackImageUrl(side: Side): string {
  return `/api/card-images/back_${side}`;
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

function catalogDetailLines(card: CatalogCardDetail): string[] {
  const typeLine = [card.side, formatCatalogTypeLine(card)].filter(Boolean).join(" · ");
  const numberLine = Object.entries(CATALOG_NUMERIC_LABELS)
    .map(([key, label]) => {
      const value = card.numeric[key];
      return value === null || value === undefined ? null : `${label} ${value}`;
    })
    .filter(Boolean)
    .join(" · ");
  return [typeLine, numberLine].filter(Boolean);
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
  const serverLabel = payloadString(event.publicPayload, "serverLabel") ?? "einen Server";
  const actions = legalActions.filter((action) => ["steal_agenda", "trash_accessed_card", "decline_trash"].includes(action.type));
  return {
    eventId: event.eventId,
    serverLabel,
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
  if (actions.some((action) => action.type === "decline_trash")) return "Trashen ist aktuell nicht möglich. Du kannst den Zugriff abschließen.";
  if (card.type === "operation" || card.type === "event") return "Diese Karte kann nicht getrasht werden. Der Zugriff ist abgeschlossen.";
  return "Für diese Karte ist aktuell keine weitere Zugriffentscheidung offen.";
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
      return value === null || value === undefined ? null : `${label} ${value}`;
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

function serverLanesForSide(side: Side, server: PlayerView["servers"][number]): Array<{ label: "ICE" | "Root"; cards: VisibleCard[] }> {
  const iceLane = { label: "ICE" as const, cards: server.ice };
  const rootLane = { label: "Root" as const, cards: server.root };
  return side === "runner" ? [rootLane, iceLane] : [iceLane, rootLane];
}

function opponentSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function sideLabel(side: Side): string {
  return side === "corp" ? "Corp" : "Runner";
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

function formatCardCount(count: number): string {
  return `${count} ${count === 1 ? "Karte" : "Karten"}`;
}

export default function Page() {
  const [entryTab, setEntryTab] = useState<EntryTab>("play");
  const [mode, setMode] = useState<"host" | "join">("host");
  const [gameMode, setGameMode] = useState<GameMode>("human_vs_human");
  const [matchFormat, setMatchFormat] = useState<MatchFormat>("rules_match");
  const [runnerDifficulty, setRunnerDifficulty] = useState<AiDifficulty>("normal");
  const [corpDifficulty, setCorpDifficulty] = useState<AiDifficulty>("normal");
  const [aiDeckPolicy, setAiDeckPolicy] = useState<AiDeckPolicy>("selected");
  const [testSetupMode, setTestSetupMode] = useState(false);
  const [displayName, setDisplayName] = useState("Runner");
  const [hostSide, setHostSide] = useState<Side | "random">("runner");
  const [seed, setSeed] = useState("mvp-0.3-ai-demo");
  const [joinMatchId, setJoinMatchId] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [payload, setPayload] = useState<ClientPayload | null>(null);
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
  const [dismissedResultKey, setDismissedResultKey] = useState<string | null>(null);
  const [seriesTransitioning, setSeriesTransitioning] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const resultAudioPrimedRef = useRef(false);
  const lastAudioResultKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("matchId");
    const token = params.get("joinToken");
    if (matchId && token) {
      setEntryTab("play");
      setMode("join");
      setJoinMatchId(matchId);
      setJoinToken(token);
      setDisplayName("Runner");
      return;
    }
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored) as SessionInfo;
    setSession(parsed);
    void bootstrap(parsed).then((bootstrapped) => {
      if (bootstrapped) setPayload(bootstrapped);
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
    if (!session || session.pendingDeckHandshake) return;
    connectWebSocket(session);
    return () => socketRef.current?.close();
  }, [session?.matchId, session?.sessionToken, session?.pendingDeckHandshake]);

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
  const hasAiOpponent = gameMode === "human_runner_vs_corp_ai" || gameMode === "human_corp_vs_runner_ai" || gameMode === "ai_vs_ai";
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
  const accessReveal = payload ? accessRevealFromLatestEvent(payload.eventTail.at(-1), catalogDetailsById, payload.legalActions) : null;
  const showAccessReveal = Boolean(accessReveal && dismissedAccessEventId !== accessReveal.eventId);
  const resultSummary = payload?.resultSummary ?? null;
  const resultKey = resultSummary ? `${payload?.matchId ?? "match"}:${resultSummary.finalStateHash}` : null;
  const showResultModal = Boolean(resultSummary && resultKey && dismissedResultKey !== resultKey);
  const effectiveCurrentCorpSnapshot = currentCorpSnapshotForSetup();
  const effectiveAgendaTarget = matchFormat === "single_game" ? effectiveCurrentCorpSnapshot?.validation.agendaPoints ?? undefined : 7;

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

  const createMatch = async () => {
    setNotice("");
    setSimulation(null);
    if (gameMode === "ai_vs_ai") {
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
      hostSide: gameMode === "human_runner_vs_corp_ai" ? "runner" : gameMode === "human_corp_vs_runner_ai" ? "corp" : hostSide,
      displayName,
      seed,
      mode: gameMode,
      runnerDifficulty,
      corpDifficulty,
      settings: {
        matchFormat,
        ...(effectiveAgendaTarget ? { agendaPointsToWin: effectiveAgendaTarget } : {})
      },
      ...deckPayload
    });
    if (created.error) {
      setNotice(created.error.message);
      return;
    }
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
    if (created.pendingDeckHandshake || !created.playerView) {
      setPayload(null);
      setNotice("Lobby erstellt. Der Joiner wählt beim Beitritt eigene Decks.");
      return;
    }
    setPayload(fromInitialResponse(created, created.hostSide));
    setNotice("Match erstellt.");
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
    const current = await currentSideDeckPayload();
    if (gameMode === "ai_vs_ai") return await simulationDeckPayload();
    return {
      ...current,
      participantADecks: await deckPairPayload(runnerDeckSource, selectedRunnerSnapshotId, selectedRunnerLocalDeckId, corpDeckSource, selectedCorpSnapshotId, selectedCorpLocalDeckId),
      ...((gameMode === "human_vs_human" && testSetupMode) || (hasAiOpponent && aiDeckPolicy === "selected")
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
      gameMode === "human_corp_vs_runner_ai" || (gameMode === "human_vs_human" && hostSide === "corp")
        ? { source: participantBRunnerDeckSource, snapshotId: selectedParticipantBRunnerSnapshotId, localDeckId: selectedParticipantBRunnerLocalDeckId }
        : { source: runnerDeckSource, snapshotId: selectedRunnerSnapshotId, localDeckId: selectedRunnerLocalDeckId };
    const corpSlot =
      gameMode === "human_runner_vs_corp_ai" || gameMode === "ai_vs_ai" || (gameMode === "human_vs_human" && hostSide !== "corp")
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
    if (gameMode === "human_corp_vs_runner_ai" || (gameMode === "human_vs_human" && hostSide === "corp")) return corpDeckSource === "local" ? corpLocalSnapshot : selectedCorpSnapshot;
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
    setPayload(fromJoinedResponse(joined));
    setNotice("Beigetreten.");
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
    setPayload(fromJoinedResponse(reconnected));
    setNotice("Reconnect abgeschlossen.");
  };

  const submitAction = (action: LegalAction) => {
    if (!session || !payload || socketRef.current?.readyState !== WebSocket.OPEN) return;
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
    socketRef.current?.close();
    window.sessionStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPayload(null);
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

  const createDeckFromTemplate = (templateId: string) => {
    const template = deckTemplates.find((candidate) => candidate.templateId === templateId);
    if (!template) return;
    const now = new Date().toISOString();
    const deck: EditableDeck = {
      deckId: `local_${template.sourceDeckId}_${crypto.randomUUID().slice(0, 8)}`,
      deckVersion: "0.6.0-local",
      name: `${template.name} Kopie`,
      side: template.side,
      identityCardId: template.identityCardId,
      cardPoolSnapshotId: DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID,
      formatProfileId: DEFAULT_DECK_FORMAT_PROFILE_ID,
      cards: template.cards.map((entry) => ({ ...entry })),
      createdAt: now,
      updatedAt: now
    };
    setLocalDecks((current) => saveDeckLibrary([...current, deck]));
    setSelectedLocalDeckId(deck.deckId);
    selectDeckForSide(deck);
    clearDeckValidation();
    setNotice("Deck-Kopie gespeichert. Du kannst den Decknamen direkt ändern.");
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
    if (message.type === "state_update") {
      setPayload((current) => {
        if (!current) return null;
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
              matchStatus: "finished"
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
          {session?.pendingDeckHandshake && session.joinUrl ? (
            <div className="pendingLobbyBox">
              <strong>Lobby wartet auf Joiner-Decks.</strong>
              <input value={session.joinUrl} readOnly aria-label="Join-Link" />
              <button className="button" onClick={copyJoinLink} type="button">
                <Clipboard size={15} />
                Join-Link kopieren
              </button>
            </div>
          ) : null}
          <div className="entryContent">
          {entryTab === "play" ? (
          <section className="setupPanel">
            <div className="tabs">
              <button className={`tab ${mode === "host" ? "active" : ""}`} onClick={() => setMode("host")}>
                Host
              </button>
              <button className={`tab ${mode === "join" ? "active" : ""}`} onClick={() => setMode("join")}>
                Join
              </button>
            </div>

            {mode === "host" ? (
              <div className="formGrid">
                <label>
                  Modus
                  <select value={gameMode} onChange={(event) => setGameMode(event.target.value as GameMode)}>
                    <option value="human_vs_human">Human vs Human</option>
                    <option value="human_runner_vs_corp_ai">Runner vs Corp-KI</option>
                    <option value="human_corp_vs_runner_ai">Corp vs Runner-KI</option>
                    <option value="ai_vs_ai">KI vs KI</option>
                  </select>
                </label>
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
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </label>
                {gameMode === "human_vs_human" ? (
                  <label>
                    Seite
                    <select value={hostSide} onChange={(event) => setHostSide(event.target.value as Side | "random")}>
                      <option value="runner">Runner</option>
                      <option value="corp">Corp</option>
                      <option value="random">Random</option>
                    </select>
                  </label>
                ) : null}
                {gameMode === "human_vs_human" ? (
                  <label className={`deckBuilderToggle ${testSetupMode ? "checked" : ""}`}>
                    <input checked={testSetupMode} onChange={(event) => setTestSetupMode(event.target.checked)} type="checkbox" />
                    Testkonstellation · beide Teilnehmer festlegen
                  </label>
                ) : null}
                {gameMode === "human_corp_vs_runner_ai" || gameMode === "ai_vs_ai" ? (
                  <label>
                    Runner-KI
                    <select value={runnerDifficulty} onChange={(event) => setRunnerDifficulty(event.target.value as AiDifficulty)}>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                ) : null}
                {gameMode === "human_runner_vs_corp_ai" || gameMode === "ai_vs_ai" ? (
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
                  {gameMode === "human_vs_human" && !testSetupMode ? (
                    <p className="deckHandshakeHint">Teilnehmer B wählt eigene Decks beim Beitritt.</p>
                  ) : null}
                  {(gameMode === "human_vs_human" && testSetupMode) || (hasAiOpponent && aiDeckPolicy === "selected") ? (
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
                    ...(aiSlotDisabled || (gameMode === "human_vs_human" && !testSetupMode)
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
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
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
            templates={deckTemplates}
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
            onCreateFromTemplate={createDeckFromTemplate}
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
              onAudioEnabled={setAudioEnabled}
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
        <Brand subtitle={`${APP_STATUS_LABEL} · ${session.side === "runner" ? "Runner" : "Corp"}`} />
        <div className="toolbar">
          <ConnectionBadge text={statusText} state={connection} />
          <button className="button iconOnly" onClick={() => setAudioEnabled((current) => !current)} title={audioEnabled ? "Audio aus" : "Audio an"} aria-label={audioEnabled ? "Audio aus" : "Audio an"}>
            {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {session.joinUrl ? (
            <button className="button" onClick={copyJoinLink} title="Join-Link kopieren">
              <Clipboard size={16} />
              Link
            </button>
          ) : null}
          <button className="button" onClick={reconnect} disabled={!canReconnect} title="Reconnect">
            <Cable size={16} />
            Reconnect
          </button>
          <button className="button" onClick={leaveMatch} title="Match verlassen">
            <RotateCcw size={16} />
            Neu
          </button>
        </div>
      </header>

      <div className="matchStrip">
        <span>{payload.matchStatus}</span>
        <span>Match {payload.matchId}</span>
        <span>Version {payload.matchVersion}</span>
        <span>State {activeView.stateVersion}</span>
        <span>{notice}</span>
      </div>

      <div className="main">
        <aside className="column panel sidePanel">
          <OpponentPanel view={activeView} connected={payload.opponentStatus.connected} />
          <LegalActionsPanel actions={payload.legalActions} disabled={Boolean(payload.winner) || connection !== "online"} onAction={submitAction} />
          <UndoPanel pendingUndo={payload.pendingUndo} latestEventId={latestEventId} connection={connection} onRequest={requestUndo} onResolve={resolveUndo} />
        </aside>

        <section className="board boardPanel">
          <BoardHeader view={activeView} />
          <RunTimeline view={activeView} cardDetailsById={catalogDetailsById} />
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
              return (
                <article className="server" key={server.id}>
                  <h3 className="serverTitle">
                    <span>{server.label}</span>
                    {cardCount !== null ? <span className="serverCount">{formatCardCount(cardCount)}</span> : null}
                  </h3>
                  {serverLanesForSide(activeView.side, server).map((lane) => (
                    <div className="serverLaneGroup" key={lane.label}>
                      <div className="laneLabel">{lane.label}</div>
                      <div className="lane">{lane.cards.map((card) => <CardView key={card.instanceId} card={enrichCard(card)} compact displayMode={cardDisplayMode} hiddenSide="corp" onFocus={focusCard} />)}</div>
                    </div>
                  ))}
                </article>
              );
            })}
          </div>
          {activeView.own.rig ? (
            <section className="section panel boardSection">
              <h2>Rig</h2>
              <div className="cards">{activeView.own.rig.map((card) => <CardView key={card.instanceId} card={enrichCard(card)} displayMode={cardDisplayMode} onFocus={focusCard} />)}</div>
            </section>
          ) : null}
          <section className="section panel boardSection">
            <h2>{session.side === "runner" ? "Grip" : "HQ"}</h2>
            <div className="cards">{activeView.own.gripOrHq.map((card) => <CardView key={card.instanceId} card={enrichCard(card)} displayMode={cardDisplayMode} hiddenSide={activeView.side} onFocus={focusCard} />)}</div>
          </section>
        </section>

        <aside className="log panel rightRail">
          <section className="section">
            <CardDisplaySettings mode={cardDisplayMode} onChange={setCardDisplayMode} compact />
          </section>
          <CardPreviewPanel card={enrichedPreviewCard} displayMode={cardDisplayMode} {...(previewHiddenSide ? { hiddenSide: previewHiddenSide } : {})} />
          <PlayerPanel view={activeView} title={sideLabel(activeView.side)} />
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
            <p className="eyebrow">Access</p>
            <h2 id="access-reveal-title">Zugriff auf {reveal.serverLabel}</h2>
            <p>Du hast auf eine Karte in {reveal.serverLabel} zugegriffen.</p>
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
                <span>{reveal.card.rulesText}</span>
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
  nextSeriesPending = false
}: {
  result: GameResultSummary;
  side: Side;
  onDismiss(): void;
  onNewMatch(): void;
  onNextSeriesGame?: () => void;
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
            <span>{result.winner === "draw" ? "Draw" : result.winner === side ? "Deine Seite gewinnt" : "Gegenseite gewinnt"}</span>
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
  return "Das Spiel wurde abgeschlossen.";
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
        <span className="settingsTitle">Card Display</span>
        {!compact ? <span className="meta">Lokale Anzeigeoption, kein Match-State</span> : null}
      </div>
      <div className="segmented" role="group" aria-label="Card Display Mode">
        <button className={mode === "placeholder" ? "active" : ""} onClick={() => onChange("placeholder")} type="button" title="Bildmodus: Regeltext für bekannte Karten per Hover oder Fokus" aria-label="Bildmodus">
          <Image size={15} />
          {!compact ? "Bild" : null}
        </button>
        <button className={mode === "text-card" ? "active" : ""} onClick={() => onChange("text-card")} type="button" title="Text-Fallback mit Regeltext auf der Karte" aria-label="Text-Fallback">
          <Keyboard size={15} />
          {!compact ? "Text" : null}
        </button>
        <button className={mode === "compact" ? "active" : ""} onClick={() => onChange("compact")} type="button" title="Kompakte Karten mit Regeltext im Tooltip" aria-label="Kompakte Karten">
          <ZoomIn size={15} />
          {!compact ? "Kompakt" : null}
        </button>
      </div>
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
      <button className={`button ${enabled ? "primary" : ""}`} type="button" onClick={() => onEnabled(!enabled)} title={enabled ? "Audioeffekte ausschalten" : "Audioeffekte einschalten"}>
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
    <div className="boardPreview" aria-label="Board Preview">
      {previewCards.map((card) => (
        <CardView key={card.instanceId} card={card} displayMode={displayMode} compact hiddenSide="corp" />
      ))}
    </div>
  );
}

function BoardHeader({ view }: { view: PlayerView }) {
  return (
    <div className={`boardHeader ${view.side}`}>
      <div>
        <p className="eyebrow">{view.side === "runner" ? "Runner View" : "Corp View"}</p>
        <h2>{view.activeSide === view.side ? "Dein Fenster" : "Gegenseite aktiv"}</h2>
      </div>
    </div>
  );
}

function RunTimeline({ view, cardDetailsById }: { view: PlayerView; cardDetailsById: Record<string, CatalogCardDetail> }) {
  const phase = view.run?.phase;
  const encounteredIce = view.run?.encounteredIce ? enrichVisibleCard(view.run.encounteredIce, cardDetailsById) : null;
  const steps = ["target", "approach_ice", "encounter_ice", "break", "access", "complete"] as const;
  const labels: Record<(typeof steps)[number], string> = {
    target: "Ziel",
    approach_ice: "Approach",
    encounter_ice: "Encounter",
    break: "Break",
    access: "Access",
    complete: "Ergebnis"
  };
  return (
    <div className={`runTimeline ${view.run ? "active" : ""}`}>
      <div className="runTimelineHead">
        <Shield size={18} />
        <span>{view.run ? `Run auf ${view.run.attackedServerId}` : "Kein aktiver Run"}</span>
      </div>
      <div className="runSteps">
        {steps.map((step) => (
          <span className={phase === step || (!phase && step === "target") ? "current" : ""} key={step}>
            {labels[step]}
          </span>
        ))}
      </div>
      {encounteredIce ? (
        <div className="encounterFocus">
          <span>Encounter</span>
          <strong>{encounteredIce.known ? [encounteredIce.title, encounteredIce.rulesText].filter(Boolean).join(" · ") : "Verdecktes ICE"}</strong>
        </div>
      ) : null}
    </div>
  );
}

function LegalActionsPanel({ actions, disabled, onAction }: { actions: LegalAction[]; disabled: boolean; onAction(action: LegalAction): void }) {
  const grouped = actions.reduce<Record<string, LegalAction[]>>((acc, action) => {
    const group = action.type.replaceAll("_", " ");
    acc[group] = [...(acc[group] ?? []), action];
    return acc;
  }, {});
  return (
    <section className="section">
      <h2>LegalActions</h2>
      <div className="actions">
        {Object.entries(grouped).map(([group, groupActions]) => (
          <div className="actionGroup" key={group}>
            <span>{group}</span>
            {groupActions.map((action) => (
              <button className="button actionButton primary" key={action.actionId} onClick={() => onAction(action)} disabled={disabled}>
                <Play size={15} />
                {action.label}
              </button>
            ))}
          </div>
        ))}
        {actions.length === 0 ? <p className="meta">Keine Aktion im aktuellen Fenster.</p> : null}
      </div>
    </section>
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
      <h2>Undo</h2>
      {pendingUndo?.needsResponse ? (
        <div className="undoBox">
          <p className="meta">{pendingUndo.requestedBy === "runner" ? "Runner" : "Corp"} fragt Undo an.</p>
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
          Undo
        </button>
      )}
    </section>
  );
}

function CardPreviewPanel({ card, displayMode, hiddenSide }: { card: DisplayVisibleCard | null; displayMode: CardDisplayMode; hiddenSide?: Side }) {
  const showSupplementalDetails = Boolean(card?.known && (displayMode === "compact" || (displayMode === "placeholder" && card.imageUrl)));
  return (
    <section className="section cardPreviewPanel">
      <div className="sectionTitleLine">
        <h2>Preview</h2>
        <Eye size={16} />
      </div>
      {card ? (
        <>
          <CardView card={card} displayMode={displayMode} {...(hiddenSide ? { hiddenSide } : {})} preview />
          {showSupplementalDetails ? (
            <>
              <p className="meta">{[card.type, card.subtypes?.join(" / "), card.strength !== undefined ? `Stärke ${card.strength}` : ""].filter(Boolean).join(" · ")}</p>
              {card.rulesText ? (
                <div className="cardRulesDetail">
                  <strong>Regeltext</strong>
                  <span>{card.rulesText}</span>
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <p className="meta">Fokussiere eine bekannte Karte.</p>
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
    <section className="section chroniclePanel">
      <div className="sectionTitleLine">
        <h2>Spielchronik</h2>
        <Activity size={16} />
      </div>
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
      <div className="chronicleRail" aria-hidden="true">
        <ChronicleIcon category={item.category} />
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
        <ListFilter size={18} />
      </div>
      <div className="catalogControls">
        <label className="searchBox">
          <span>Suche</span>
          <Search size={16} />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Kartenname, Text, Subtyp" />
        </label>
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
              <p className="catalogText">{detail.text}</p>
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
  templates,
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
  onCreateFromTemplate,
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
  templates: DeckTemplate[];
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
  onCreateFromTemplate(templateId: string): void;
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
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const totalCards = selectedDeck?.cards.reduce((sum, entry) => sum + entry.quantity, 0) ?? 0;
  const deckQuantities = useMemo(() => new Map(selectedDeck?.cards.map((entry) => [entry.cardId, entry.quantity]) ?? []), [selectedDeck?.cards]);
  const cardLookup = useMemo(() => new Map(playableCards.map((card) => [card.catalogCardId, card])), [playableCards]);
  const builderTypeCounts = useMemo(() => summarizeCatalogTypeFilters(playableCards), [playableCards]);
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
            Meine Decks · {localDecks.length} gespeichert
          </p>
        </div>
        <div className="deckHeaderActions">
          <button className={`button ${importOpen ? "primary" : ""}`} onClick={() => setImportOpen((current) => !current)} type="button" aria-expanded={importOpen}>
            <Upload size={15} />
            Import
          </button>
          <Save size={18} />
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
      <div className="deckCreateRow">
        <button className="button" onClick={() => onCreateEmpty("runner")}>
          <Plus size={15} />
          Neues Runner-Deck
        </button>
        <button className="button corp" onClick={() => onCreateEmpty("corp")}>
          <Plus size={15} />
          Neues Corp-Deck
        </button>
      </div>
      <details className="deckTemplateBox" open={templatesOpen} onToggle={(event) => setTemplatesOpen(event.currentTarget.open)}>
        <summary>Vorgefertigte Decks anzeigen</summary>
        <div className="deckTemplateRow">
          {templates.map((template) => (
            <button className={`button ${template.side === "corp" ? "corp" : ""}`} key={template.templateId} onClick={() => onCreateFromTemplate(template.templateId)}>
              <CopyPlus size={15} />
              {template.name}
            </button>
          ))}
        </div>
      </details>
      <div className="deckWorkspace">
        <div className="deckEditor">
          <div className="deckSelectGrid">
            <label>
              Deck auswählen
              <select value={selectedDeck?.deckId ?? ""} onChange={(event) => onSelectDeck(event.target.value)} disabled={localDecks.length === 0}>
                <option value="">Kein lokales Deck</option>
                {localDecks.map((deck) => (
                  <option value={deck.deckId} key={deck.deckId}>
                    {deck.name}
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
            <p className="meta deckEmpty">Erstelle eine Kopie aus einem Template oder importiere ein lokales Deck.</p>
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

function OpponentPanel({ view, connected }: { view: PlayerView; connected: boolean }) {
  const side = opponentSide(view.side);
  return (
    <section className="section">
      <h2>{sideLabel(side)}</h2>
      <div className="stats">
        <Stat label="Credits" value={view.opponent.credits} />
        <Stat label="Clicks" value={view.opponent.clicks} />
        <Stat label="Agenda" value={view.opponent.agendaPoints} />
        {side === "runner" ? <Stat label="Tags" value={view.opponent.tags} /> : null}
      </div>
      {view.deckMetadata ? (
        <div className="deckMini">
          <span>{view.deckMetadata.opponent.deckName}</span>
          <small>{view.deckMetadata.opponent.deckHash}</small>
        </div>
      ) : null}
      <p className="meta statusLine">{connected ? "Verbunden" : "Offline"} · {view.activeSide === side ? "Aktiv" : "Wartet"}</p>
    </section>
  );
}

function PlayerPanel({ view, title }: { view: PlayerView; title: string }) {
  const visibleTags = view.side === "runner" ? view.own.tags : view.opponent.tags;
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="stats">
        <Stat label="Credits" value={view.own.credits} />
        <Stat label="Clicks" value={view.own.clicks} />
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
        <Stat label="Actions" value={summary.actions} />
        <Stat label="Turns" value={summary.turns} />
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
  onFocus
}: {
  card: DisplayVisibleCard;
  compact?: boolean;
  preview?: boolean;
  displayMode: CardDisplayMode;
  hiddenSide?: Side;
  onFocus?(card: DisplayVisibleCard, hiddenSide?: Side): void;
}) {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const [tooltipPlacement, setTooltipPlacement] = useState<"above" | "below">("below");
  const typeClass = card.known && card.type ? ` ${card.type}` : "";
  const isCompact = compact || displayMode === "compact";
  const modeClass = displayMode === "text-card" ? " textCard" : displayMode === "compact" ? " compactCard" : " placeholderCard";
  const detailLines = card.known ? cardDetailLines(card) : [];
  const tooltipText = card.known ? [card.title, ...detailLines, card.rulesText].filter(Boolean).join("\n") : undefined;
  const tooltipId = card.known && card.rulesText ? `card-tooltip-${card.instanceId.replace(/[^A-Za-z0-9_-]/g, "-")}` : undefined;
  const nativeTitle = tooltipId ? undefined : tooltipText;
  const cardImageUrl = card.known && displayMode === "placeholder" ? card.imageUrl : undefined;
  const cardBackUrl = !card.known && displayMode === "placeholder" && hiddenSide ? cardBackImageUrl(hiddenSide) : undefined;
  const visualImageUrl = cardImageUrl ?? cardBackUrl;

  const updateTooltipPlacement = () => {
    const element = cardRef.current;
    if (!element || !card.known || !card.rulesText) return;
    const cardRect = element.getBoundingClientRect();
    const boundary = nearestTooltipBoundary(element);
    const boundaryTop = Math.max(0, boundary.top);
    const boundaryBottom = Math.min(window.innerHeight, boundary.bottom);
    const spaceBelow = boundaryBottom - cardRect.bottom;
    const spaceAbove = cardRect.top - boundaryTop;
    setTooltipPlacement(spaceBelow < 118 && spaceAbove > spaceBelow ? "above" : "below");
  };

  return (
    <button
      ref={cardRef}
      type="button"
      className={`card${card.known ? typeClass : " hidden"}${modeClass}${visualImageUrl ? " withImage" : ""}${preview ? " preview" : ""}`}
      onClick={() => onFocus?.(card, hiddenSide)}
      onFocus={updateTooltipPlacement}
      onPointerEnter={updateTooltipPlacement}
      aria-label={card.known ? `Karte ${card.title}` : "Verdeckte Karte"}
      aria-describedby={tooltipId}
      title={nativeTitle}
    >
      {visualImageUrl ? <img className="cardImage" src={visualImageUrl} alt="" aria-hidden="true" /> : <span className="cardArt" aria-hidden="true" />}
      {visualImageUrl ? null : <span className="cardTitle">{card.known ? card.title : "Verdeckte Karte"}</span>}
      {!visualImageUrl && !isCompact ? <span className="cardMeta">{card.known ? [card.type, card.subtypes?.join(" / ")].filter(Boolean).join(" · ") : "Redacted"}</span> : null}
      {!visualImageUrl && card.known && card.rulesText ? <span className="cardRulesPreview">{card.rulesText}</span> : null}
      {!visualImageUrl && card.known && card.advancementCounters ? <span className="cardMeta">Adv: {card.advancementCounters}</span> : null}
      {!visualImageUrl && card.known && card.strength !== undefined ? <span className="cardMeta">Stärke {card.strength}</span> : null}
      {card.known && card.rulesText ? (
        <span className={`cardTooltip ${tooltipPlacement}`} id={tooltipId} role="tooltip">
          <strong>{card.title}</strong>
          {detailLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
          <span className="cardTooltipText">{card.rulesText}</span>
        </span>
      ) : null}
    </button>
  );
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
    valueLabel("Kosten", card.cost),
    valueLabel("Install", card.installCost),
    valueLabel("MU", card.memoryCost),
    valueLabel("Rez", card.rezCost),
    valueLabel("Trash", card.trashCost),
    valueLabel("Fortschritt", card.advancementRequirement),
    valueLabel("Agenda", card.agendaPoints),
    valueLabel("Stärke", card.strength)
  ]
    .filter(Boolean)
    .join(" · ");
  return [typeLine, numberLine].filter(Boolean);
}

function valueLabel(label: string, value: number | undefined): string | null {
  return value === undefined ? null : `${label} ${value}`;
}

function fromInitialResponse(response: CreateMatchResponse, side: Side): ClientPayload {
  const winner = response.winner ?? response.playerView.winner;
  const payload: ClientPayload = {
    matchId: response.matchId,
    matchStatus: response.mode === "human_vs_human" ? (response.hostSide === "runner" ? "waiting_for_corp" : "waiting_for_runner") : "active",
    matchVersion: response.matchVersion,
    side,
    playerView: response.playerView,
    legalActions: response.legalActions,
    eventTail: response.playerView.publicEvents,
    opponentStatus: { side: side === "runner" ? "corp" : "runner", connected: response.mode !== "human_vs_human" }
  };
  if (winner) payload.winner = winner;
  if (response.finalStateHash) payload.finalStateHash = response.finalStateHash;
  if (response.resultSummary) payload.resultSummary = response.resultSummary;
  return payload;
}

function fromJoinedResponse(response: JoinMatchResponse): ClientPayload {
  const winner = response.winner ?? response.playerView.winner;
  const payload: ClientPayload = {
    matchId: response.matchId,
    matchStatus: "active",
    matchVersion: response.matchVersion,
    side: response.side,
    playerView: response.playerView,
    legalActions: response.legalActions,
    eventTail: response.eventTail ?? response.playerView.publicEvents,
    opponentStatus: { side: response.side === "runner" ? "corp" : "runner", connected: false }
  };
  if (winner) payload.winner = winner;
  if (response.finalStateHash) payload.finalStateHash = response.finalStateHash;
  if (response.resultSummary) payload.resultSummary = response.resultSummary;
  return payload;
}

async function bootstrap(session: SessionInfo): Promise<ClientPayload | null> {
  const response = await fetch(`${SERVER_HTTP}/api/matches/${encodeURIComponent(session.matchId)}/bootstrap?side=${session.side}`, {
    headers: { authorization: `Bearer ${session.sessionToken}` },
    cache: "no-store"
  });
  if (!response.ok) return null;
  return (await response.json()) as ClientPayload;
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

function playResultSound(outcome: GameResultSummary["viewerOutcome"], volume: number): void {
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return;
  const context = new AudioCtor();
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
  window.setTimeout(() => void context.close(), 700);
}

function persistSession(session: SessionInfo) {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.removeItem(SESSION_KEY);
}
