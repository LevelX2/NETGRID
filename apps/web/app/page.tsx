"use client";

import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  Building2,
  Cable,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Crosshair,
  Flag,
  CopyPlus,
  Download,
  Eye,
  EyeOff,
  Fingerprint,
  Award,
  Goal,
  Image,
  Keyboard,
  Layers3,
  Link2,
  ListFilter,
  Move,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  PanelTopClose,
  PanelTopOpen,
  Play,
  Plus,
  Route,
  RotateCcw,
  Save,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  User,
  UserPlus,
  Volume2,
  VolumeX,
  X,
  Zap,
  ZoomIn
} from "lucide-react";
import { createContext, Fragment, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type {
  ApiAiPacingMode,
  ApiClientGameMode,
  ApiCreateMatchResponse,
  ApiGameResultSummary,
  ApiJoinMatchResponse,
  ApiLifecycleResultSummary,
  ApiLobbyParticipantPayload,
  ApiLobbyPayload,
  ApiMatchFormat,
  ApiMatchStartLobbyPayload,
  ApiMatchStatus,
  ApiSeriesResultSummary,
  ApiServerMessage,
  ApiSidePayload,
  DeckPublicMetadata,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
  Winner,
} from "@netgrid/shared";
import {
  CHRONICLE_CATEGORY_LABELS,
  chronicleGroupLabel,
  chronicleTurnNumberByEventId,
  formatChronicleEvent,
  formatChronicleEffectItems,
  type ChronicleCategory,
  type ChronicleContext,
  type ChronicleItem
} from "./chronicle";
import {
  actionSoundCountForAction,
  actionSoundForActionType,
  deriveOpponentActionCues,
  turnStartAudioCue,
  type ActionSoundKind,
  type BoardHighlight,
  type OpponentActionCue,
  type TurnStartAudioState
} from "./action-cues";
import {
  ACTION_CUE_POSITION_STORAGE_KEY,
  DEFAULT_CUE_POSITION,
  LEGACY_ACTION_CUE_POSITION_STORAGE_KEY,
  RUN_TIMELINE_STEPS,
  accessRevealStatusLabel,
  actionButtonLabel,
  actionConsumesClick,
  actionContextStillVisible,
  actionContextTitle,
  actionCostChips,
  aiPacingFallbackDelayMs,
  aiPacingDelayMs,
  actionMatchesContext,
  actionSlotCapacityForTurn,
  actionSlotDisplay,
  activeRunIceInstanceId,
  automaticEndTurnAction,
  baseActionSlotCapacity,
  breachProgressLabel,
  cardCreditCounterVisual,
  clampCuePosition,
  contextualCardActionLabel,
  corpInstalledCardState,
  cuePositionClassName,
  cuePositionStyle,
  groupRunnerRigCards,
  hasLegalAction,
  parseCuePositionPreference,
  normalizeVisibleTerms,
  retainedAccessRevealEvent,
  runTargetServerIds,
  runAwareActionButtonLabel,
  runWindowActionButtonLabel,
  runWindowActions,
  runCurrentIceLabel,
  runnerRigMemorySummary,
  runPositionStatusLabel,
  runWindowStatusLabel,
  serializeCuePositionPreference,
  showInstalledCorpState,
  shouldUseCardChoicePanel,
  serverBoardRows,
  serverDisplayLabel,
  splitArchiveCardsForDisplay,
  splitLegalActions,
  storedCreditAmount,
  storedCreditSourceLabel,
  currentRunTimelineStep,
  type ActionContext,
  type CuePositionPreference,
  type CuePositionPreset
} from "./action-board-ui";
import { CardImage, isGeneratedCardImageId, localCardImageUrl } from "./card-image-service";
import {
  deriveMatchStart,
  humanAiSideLabel,
  matchFormatCardLabel,
  matchStartSummary,
  parseJoinLinkInput,
  playModeCardLabel,
  sideSelectionLabel,
  type MatchFormatSelection,
  type HumanAiSideSelection,
  type HumanSideSelection,
  type PlayMode
} from "./match-start";
import { parseMatchStartSettingsFromStorage, serializeMatchStartSettingsForStorage } from "./match-start-storage";
import { createMatchSeed, normalizeMatchSeed } from "./match-seed";
import {
  CATALOG_RARITY_FILTERS,
  catalogCardMatchesTypeFilters,
  catalogRarityLabel,
  filterCatalogCardsByRarity,
  catalogTypeKeysForCard,
  filterCatalogCardsBySet,
  filterCatalogCardsByType,
  nextCatalogSelection,
  summarizeCatalogRarityFilters,
  summarizeCatalogSetFilters,
  summarizeCatalogTypeFilters,
  type CatalogRarityFilterKey,
  type CatalogSetFilterKey,
  type CatalogTypeFilterKey,
  type CatalogTypeFilterState
} from "./catalog-ui";
import { isCardActionSurfaceTarget } from "./card-action-menu-ui";
import { actionNeedsRegionReplacementConfirmation } from "./action-payload";
import { scoredAgendaCreditCounterSource, scoredAgendaEffectLineForScoreArea } from "./score-area-ui";
import {
  clearStoredSession,
  loadRecentSession,
  loadStoredSession,
  persistSession,
  rememberRecentSession,
  removeRecentSession,
  storedSessionMatches,
  type RecentSessionInfo,
  type SessionInfo
} from "./session-recovery";

const SERVER_HTTP = process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";
const SERVER_UNREACHABLE_NOTICE = `Multiplayer-Server nicht erreichbar (${SERVER_HTTP}). Bitte starte den lokalen Multiplayer-Server und versuche es erneut.`;
const DECK_STORAGE_KEY = "netgrid-v0-6-local-decks";
const LEGACY_DECK_STORAGE_KEY = "netgrid-v0-6-local-decks";
const AUDIO_STORAGE_KEY = "netgrid-s01-audio";
const LEGACY_AUDIO_STORAGE_KEY = "netgrid-s01-audio";
const ACTION_CUE_SETTINGS_STORAGE_KEY = "netgrid.actionCueSettings.v1";
const LEGACY_ACTION_CUE_SETTINGS_STORAGE_KEY = "netgrid.actionCueSettings.v1";
const GAMEPLAY_SETTINGS_STORAGE_KEY = "netgrid.gameplaySettings.v1";
const LEGACY_GAMEPLAY_SETTINGS_STORAGE_KEY = "netgrid.gameplaySettings.v1";
const CARD_TOOLTIP_SETTINGS_STORAGE_KEY = "netgrid.cardTooltipSettings.v1";
const LEGACY_CARD_TOOLTIP_SETTINGS_STORAGE_KEY = "netgrid.cardTooltipSettings.v1";
const CARD_SIZE_SETTINGS_STORAGE_KEY = "netgrid.cardSizeSettings.v1";
const LEGACY_CARD_SIZE_SETTINGS_STORAGE_KEY = "netgrid.cardSizeSettings.v1";
const DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY = "netgrid.deckTableViewSettings.v1";
const LEGACY_DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY = "netgrid.deckTableViewSettings.v1";
const CARD_DISPLAY_MODE_STORAGE_KEY = "netgrid.cardDisplayMode.v1";
const LEGACY_CARD_DISPLAY_MODE_STORAGE_KEY = "netgrid.cardDisplayMode.v1";
const CARD_PREVIEW_COLLAPSED_STORAGE_PREFIX = "netgrid.cardPreviewCollapsed.v1";
const AI_PACING_MODE_STORAGE_KEY = "netgrid.aiPacingMode.v1";
const LEGACY_AI_PACING_MODE_STORAGE_KEY = "netgrid.aiPacingMode.v1";
const MATCH_START_SETTINGS_STORAGE_KEY = "netgrid.matchStartSettings.v1";
const LEGACY_MATCH_START_SETTINGS_STORAGE_KEY = "netgrid.matchStartSettings.v1";
const RUN_OVERLAY_POSITION_STORAGE_KEY = "netgrid.runOverlayPosition.v1";
const LEGACY_RUN_OVERLAY_POSITION_STORAGE_KEY = "netgrid.runOverlayPosition.v1";
const COLOR_SCHEME_STORAGE_KEY = "netgrid-color-scheme";
const DISPLAY_NAME_STORAGE_KEY = "netgrid.displayName";
const LEGACY_DISPLAY_NAME_STORAGE_KEY = "netgrid.displayName";
const DEFAULT_RUNNER_SNAPSHOT_ID = "demo_runner_008_snapshot_v0_8";
const DEFAULT_CORP_SNAPSHOT_ID = "demo_corp_008_snapshot_v0_8";
const RunIcon = Route;
const RunnerRoleIcon = Fingerprint;
const CorpRoleIcon = Building2;
const AgendaIcon = Award;
const TagIcon = Goal;
const CoreDamageIcon = Brain;
const DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID = "card-snapshot-0.8";
const DEFAULT_DECK_CARD_POOL_VERSION = "private-local-onr-v1";
const DEFAULT_DECK_FORMAT_PROFILE_ID = "netgrid_private_local_v1";
const DEFAULT_DECK_FORMAT_PROFILE_VERSION = "1.3.0";
const APP_NAME = "NETGRID";
const APP_STATUS_LABEL = "V1.9.22";
const APP_BRAND_ASSET_VERSION = "2026-05-10-brand-fix-2";
const APP_ICON_SRC = `/brand/netgrid-icon-cyber-v1.png?v=${APP_BRAND_ASSET_VERSION}`;
const APP_WORDMARK_SRC = `/brand/netgrid-wordmark-cyber-v1.png?v=${APP_BRAND_ASSET_VERSION}`;
const CARD_TOOLTIP_HOVER_DELAY_OPTIONS = [300, 500, 750, 1000, 1250, 1500] as const;
const CARD_TOOLTIP_HOVER_OPEN_DELAY_MS = 1000;
const CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS = 120;
const CARD_TOOLTIP_PIN_EVENT = "netgrid:card-tooltip-pin";
const CARD_SCALE_PERCENT_MIN = 50;
const CARD_SCALE_PERCENT_MAX = 170;
const CARD_SCALE_PERCENT_STEP = 5;
const CARD_SCALE_DEFAULT_PERCENT = 100;
const DEFAULT_IDENTITY_BY_SIDE: Record<Side, string> = {
  runner: "runner_identity_001",
  corp: "corp_identity_001"
};

let sharedAudioContext: AudioContext | null = null;

type MatchStatus = ApiMatchStatus;
type GameMode = ApiClientGameMode;
type MatchFormat = ApiMatchFormat;
type AiDifficulty = "easy" | "normal" | "hard";
type AiDeckPolicy = "fixed" | "selected" | "seeded_random";
type AiPacingMode = ApiAiPacingMode;
type CardDisplayMode = "placeholder" | "text-card" | "compact";
type ColorScheme = "black" | "white";
type EntryTab = "play" | "catalog" | "decks" | "options";
type ActiveMatchWorkspace = "game" | "catalog" | "decks" | "options";
type DeckSideFilter = Side | "all";
type CueAutoDismissMs = 0 | 1500 | 2500 | 4000 | 6000;
type CardTooltipHoverDelayMs = (typeof CARD_TOOLTIP_HOVER_DELAY_OPTIONS)[number];
type CardTooltipMode = "simple" | "enhanced" | "image";
type RunOverlayPositionPreference = { kind: "default" } | { kind: "custom"; xPercent: number; yPercent: number };

type ConfirmationDialogRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
  onConfirm(): void | Promise<void>;
};

type CardTooltipSettings = {
  hoverOpenDelayMs: CardTooltipHoverDelayMs;
  mode: CardTooltipMode;
};

type CardScaleSettings = {
  tooltipPercent: number;
  handPercent: number;
  archivePercent: number;
  zonePercent: number;
  boardPercent: number;
  rigPercent: number;
};

const CardTooltipSettingsContext = createContext<CardTooltipSettings>({
  hoverOpenDelayMs: CARD_TOOLTIP_HOVER_OPEN_DELAY_MS,
  mode: "enhanced"
});

const CardScaleSettingsContext = createContext<CardScaleSettings>({
  tooltipPercent: CARD_SCALE_DEFAULT_PERCENT,
  handPercent: CARD_SCALE_DEFAULT_PERCENT,
  archivePercent: CARD_SCALE_DEFAULT_PERCENT,
  zonePercent: CARD_SCALE_DEFAULT_PERCENT,
  boardPercent: CARD_SCALE_DEFAULT_PERCENT,
  rigPercent: CARD_SCALE_DEFAULT_PERCENT
});

function useCardTooltipSettings(): CardTooltipSettings {
  return useContext(CardTooltipSettingsContext);
}

function useCardScaleSettings(): CardScaleSettings {
  return useContext(CardScaleSettingsContext);
}

type SeriesResultSummary = ApiSeriesResultSummary;
type GameResultSummary = ApiGameResultSummary;
type LifecycleResultSummary = ApiLifecycleResultSummary;
type ClientPayload = ApiSidePayload;

function effectiveAiTurnPresentation(payload: ClientPayload | null): ClientPayload["aiTurnPresentation"] | undefined {
  const presentation = payload?.aiTurnPresentation;
  if (!payload || !presentation?.activeAiSide) return presentation;
  const aiHasCurrentControl = payload.playerView.activeSide === presentation.activeAiSide || payload.playerView.pendingChoice?.side === presentation.activeAiSide;
  if (aiHasCurrentControl) return presentation;
  return { ...presentation, canAdvanceAi: false };
}

type LobbyParticipant = ApiLobbyParticipantPayload;
type MatchStartLobby = ApiMatchStartLobbyPayload;
type LobbyClientPayload = ApiLobbyPayload;
type ServerMessage = ApiServerMessage;
type CreateMatchResponse = ApiCreateMatchResponse;
type JoinMatchResponse = ApiJoinMatchResponse;

function removePendingUndo<T extends { pendingUndo?: unknown }>(payload: T): Omit<T, "pendingUndo"> {
  const { pendingUndo: _pendingUndo, ...withoutPendingUndo } = payload;
  return withoutPendingUndo;
}

type OpenMatchEntry = {
  matchId: string;
  hostDisplayName: string;
  mode: "human_vs_human";
  status: "pending";
  createdAt: string;
  ageSeconds: number;
};

type OpenMatchesResponse = {
  matches?: OpenMatchEntry[];
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

type RetentionProtectionResponse =
  | { ok: true; payload: ClientPayload | LobbyClientPayload }
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

type CatalogStatusKey = "imported" | "validated" | "catalog_ready" | "implemented" | "engine_supported" | "playable" | "human_playable" | "ai_supported" | "deck_legal" | "format_legal" | "blocked";

type CatalogStatuses = Record<CatalogStatusKey, boolean>;

type CatalogCardSummary = {
  catalogCardId: string;
  title: string;
  side: Side;
  type: string;
  subtypes: string[];
  faction: string;
  setId: string;
  rarity?: {
    code: string;
    labelDe: string;
    labelEn?: string;
    sourceValue?: string;
    sourceId?: string;
  };
  statuses: CatalogStatuses;
  blockReasons: string[];
};

type CatalogCardDetail = CatalogCardSummary & {
  setName: string;
  collectorNumber: string;
  text: string;
  numeric: Record<string, number | null>;
  engineCardId: string | null;
  aiHints?: CatalogAiHints | null;
};

type DeckBuilderCardDetail = CatalogCardDetail & {
  definitionId?: string;
};

type CatalogAiHints = {
  roles: string[];
  planRoles: string[];
  requiredMechanics: string[];
  valueHints: Record<string, number>;
  riskTags: string[];
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported";
  scenarioRefs: string[];
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

type VisibleChoice = NonNullable<PlayerView["pendingChoice"]>;
type VisibleChoiceOption = VisibleChoice["options"][number];

type FocusedCard = {
  card: VisibleCard;
  matchId: string;
  hiddenSide?: Side;
};

type AccessReveal = {
  eventId: string;
  actorSide: Side;
  viewerSide: Side;
  serverLabel: string;
  serverTitleLabel: string;
  serverLocationPhrase: string;
  description: string;
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
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  validationStatus?: "valid" | "invalid" | "needs_revalidation";
  cards: DeckCardEntry[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
  tableLayout?: DeckTableLayout;
};

type DeckEditorMode = "list" | "table";

type DeckTableSortKey = "name" | "type" | "install" | "rez" | "trash" | "cost" | "strength" | "agenda";
type DeckTablePileSortMode = "free" | DeckTableSortKey;
type DeckTableArrangeMode = "type" | "install-piles" | DeckTableSortKey;

type DeckTableLayoutEntry = {
  cardId: string;
  quantity: number;
  order: number;
};

type DeckTablePile = {
  id: string;
  name?: string;
  order: number;
  sortMode: DeckTablePileSortMode;
  entries: DeckTableLayoutEntry[];
};

type DeckTableLayout = {
  schemaVersion: "deck-table-layout-v0.1";
  showPileNames: boolean;
  piles: DeckTablePile[];
};

type DeckTableSelectionEntry = {
  pileId: string;
  cardId: string;
  order: number;
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
  errorCodes?: string[];
  warnings: string[];
  totalCards: number;
  agendaPoints: number | null;
  influenceSpent?: number | null;
};

type DeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId: string;
  deckVersion: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
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

type DeckLibraryResponse = {
  decks?: EditableDeck[];
  storagePath?: string;
  error?: { message: string };
};

const CATALOG_STATUS_LABELS: Record<CatalogStatusKey, string> = {
  imported: "Importiert",
  validated: "Geprüft",
  catalog_ready: "Im Katalog",
  implemented: "Implementiert",
  engine_supported: "Engine",
  playable: "Runtime spielbar",
  human_playable: "Für Menschen spielbar",
  ai_supported: "KI geeignet",
  deck_legal: "Deckbau erlaubt",
  format_legal: "Im lokalen Format",
  blocked: "Blockiert"
};

const PRIMARY_CATALOG_STATUS_KEYS: CatalogStatusKey[] = ["human_playable", "deck_legal", "format_legal", "ai_supported", "blocked"];

const TECHNICAL_CATALOG_STATUS_KEYS: CatalogStatusKey[] = ["imported", "validated", "catalog_ready", "implemented", "engine_supported", "playable"];

const CATALOG_STATUS_FILTER_KEYS: CatalogStatusKey[] = [...PRIMARY_CATALOG_STATUS_KEYS, ...TECHNICAL_CATALOG_STATUS_KEYS];

const RUNNER_CATALOG_TYPE_FILTERS: Array<{ key: CatalogTypeFilterKey; label: string }> = [
  { key: "event", label: "Prep" },
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
  { title: "Korp", side: "corp", filters: CORP_CATALOG_TYPE_FILTERS }
];

const DECK_SOURCE_FILTERS: Array<{ key: CatalogSetFilterKey; label: string }> = [
  { key: "all", label: "Alle Sets" },
  { key: "original", label: "Original NETGRID" },
  { key: "test", label: "Testkarten" },
  { key: "other", label: "Andere Sets" }
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

const ARCHIVES_STACK_PREVIEW_LIMIT = 18;
const RUNNER_HEAP_PREVIEW_LIMIT = 18;
const SPECIAL_ZONE_PREVIEW_LIMIT = 14;
const SCORE_AREA_PREVIEW_LIMIT = 18;
const CARD_DISPLAY_BASE_MIN_WIDTH = 108;
const DECK_TABLE_CARD_WIDTH_DEFAULT = 94;
const DECK_TABLE_CARD_WIDTH_MIN = 72;
const DECK_TABLE_CARD_WIDTH_MAX = 190;
const DECK_TABLE_CARD_WIDTH_STEP = 2;
const DECK_TABLE_OVERLAP_DEFAULT = 64;
const DECK_TABLE_OVERLAP_MIN = 0;
const DECK_TABLE_OVERLAP_MAX = 82;
const DECK_TABLE_OVERLAP_STEP = 2;
const DECK_TABLE_LIBRARY_WIDTH_DEFAULT = 250;
const DECK_TABLE_LIBRARY_WIDTH_MIN = 160;
const DECK_TABLE_LIBRARY_WIDTH_MAX = 760;
const DECK_TABLE_LIBRARY_WIDTH_STEP = 10;
const DECK_TABLE_LIBRARY_CARD_WIDTH_DEFAULT = 92;
const DECK_TABLE_LIBRARY_CARD_WIDTH_MIN = 58;
const DECK_TABLE_LIBRARY_CARD_WIDTH_MAX = 190;
const DECK_TABLE_LIBRARY_CARD_WIDTH_STEP = 2;
const DECK_TABLE_LIBRARY_OVERLAP_DEFAULT = 0;
const DECK_TABLE_LIBRARY_OVERLAP_MIN = 0;
const DECK_TABLE_LIBRARY_OVERLAP_MAX = 72;
const DECK_TABLE_LIBRARY_OVERLAP_STEP = 2;

type DeckTableViewSettings = {
  cardWidth: number;
  overlapPercent: number;
  libraryWidth: number;
  libraryCardWidth: number;
  libraryOverlapPercent: number;
};

function normalizeCueAutoDismissMs(value: unknown): CueAutoDismissMs {
  if (value === 0 || value === 1500 || value === 2500 || value === 4000 || value === 6000) return value;
  return 2500;
}

function normalizeCardTooltipHoverDelayMs(value: unknown): CardTooltipHoverDelayMs {
  return CARD_TOOLTIP_HOVER_DELAY_OPTIONS.includes(value as CardTooltipHoverDelayMs) ? (value as CardTooltipHoverDelayMs) : CARD_TOOLTIP_HOVER_OPEN_DELAY_MS;
}

function normalizeCardTooltipMode(value: unknown): CardTooltipMode {
  return value === "simple" || value === "enhanced" || value === "image" ? value : "enhanced";
}

function normalizeCardDisplayMode(value: unknown): CardDisplayMode {
  return value === "placeholder" || value === "text-card" || value === "compact" ? value : "placeholder";
}

function normalizeAiPacingMode(value: unknown): AiPacingMode {
  return value === "manual" || value === "paced" || value === "fast" ? value : "paced";
}

function normalizeCardScalePercent(value: unknown, min = CARD_SCALE_PERCENT_MIN, max = CARD_SCALE_PERCENT_MAX): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return CARD_SCALE_DEFAULT_PERCENT;
  const clamped = Math.max(min, Math.min(max, Math.round(numeric)));
  const snapped = Math.round(clamped / CARD_SCALE_PERCENT_STEP) * CARD_SCALE_PERCENT_STEP;
  return Math.max(min, Math.min(max, snapped));
}

function usePersistentCardScaleSettings() {
  const [cardTooltipScalePercent, setCardTooltipScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardHandScalePercent, setCardHandScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardArchiveScalePercent, setCardArchiveScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardZoneScalePercent, setCardZoneScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardBoardScalePercent, setCardBoardScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardRigScalePercent, setCardRigScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardSizeSettingsLoaded, setCardSizeSettingsLoaded] = useState(false);

  useEffect(() => {
    const stored = readLocalStorageWithLegacy(CARD_SIZE_SETTINGS_STORAGE_KEY, LEGACY_CARD_SIZE_SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          tooltipPercent?: unknown;
          handPercent?: unknown;
          archivePercent?: unknown;
          zonePercent?: unknown;
          boardPercent?: unknown;
          rigPercent?: unknown;
          opponentPercent?: unknown;
        };
        setCardTooltipScalePercent(normalizeCardScalePercent(parsed.tooltipPercent));
        setCardHandScalePercent(normalizeCardScalePercent(parsed.handPercent));
        setCardArchiveScalePercent(normalizeCardScalePercent(parsed.archivePercent ?? parsed.zonePercent));
        setCardZoneScalePercent(normalizeCardScalePercent(parsed.zonePercent));
        setCardBoardScalePercent(normalizeCardScalePercent(parsed.boardPercent));
        setCardRigScalePercent(normalizeCardScalePercent(parsed.rigPercent ?? parsed.opponentPercent));
      } catch {
        removeLocalStorageKeys(CARD_SIZE_SETTINGS_STORAGE_KEY, LEGACY_CARD_SIZE_SETTINGS_STORAGE_KEY);
      }
    }
    setCardSizeSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!cardSizeSettingsLoaded) return;
    window.localStorage.setItem(
      CARD_SIZE_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        tooltipPercent: cardTooltipScalePercent,
        handPercent: cardHandScalePercent,
        archivePercent: cardArchiveScalePercent,
        zonePercent: cardZoneScalePercent,
        boardPercent: cardBoardScalePercent,
        rigPercent: cardRigScalePercent
      })
    );
  }, [cardSizeSettingsLoaded, cardTooltipScalePercent, cardHandScalePercent, cardArchiveScalePercent, cardZoneScalePercent, cardBoardScalePercent, cardRigScalePercent]);

  return {
    cardTooltipScalePercent,
    cardHandScalePercent,
    cardArchiveScalePercent,
    cardZoneScalePercent,
    cardBoardScalePercent,
    cardRigScalePercent,
    setCardTooltipScalePercent,
    setCardHandScalePercent,
    setCardArchiveScalePercent,
    setCardZoneScalePercent,
    setCardBoardScalePercent,
    setCardRigScalePercent
  };
}

function normalizeSteppedNumber(value: unknown, fallback: number, min: number, max: number, step: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const clamped = Math.max(min, Math.min(max, Math.round(numeric)));
  const snapped = Math.round(clamped / step) * step;
  return Math.max(min, Math.min(max, snapped));
}

function normalizeDeckTableViewSettings(value: unknown): DeckTableViewSettings {
  const candidate = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    cardWidth: normalizeSteppedNumber(candidate.cardWidth, DECK_TABLE_CARD_WIDTH_DEFAULT, DECK_TABLE_CARD_WIDTH_MIN, DECK_TABLE_CARD_WIDTH_MAX, DECK_TABLE_CARD_WIDTH_STEP),
    overlapPercent: normalizeSteppedNumber(candidate.overlapPercent, DECK_TABLE_OVERLAP_DEFAULT, DECK_TABLE_OVERLAP_MIN, DECK_TABLE_OVERLAP_MAX, DECK_TABLE_OVERLAP_STEP),
    libraryWidth: normalizeSteppedNumber(candidate.libraryWidth, DECK_TABLE_LIBRARY_WIDTH_DEFAULT, DECK_TABLE_LIBRARY_WIDTH_MIN, DECK_TABLE_LIBRARY_WIDTH_MAX, DECK_TABLE_LIBRARY_WIDTH_STEP),
    libraryCardWidth: normalizeSteppedNumber(candidate.libraryCardWidth, DECK_TABLE_LIBRARY_CARD_WIDTH_DEFAULT, DECK_TABLE_LIBRARY_CARD_WIDTH_MIN, DECK_TABLE_LIBRARY_CARD_WIDTH_MAX, DECK_TABLE_LIBRARY_CARD_WIDTH_STEP),
    libraryOverlapPercent: normalizeSteppedNumber(candidate.libraryOverlapPercent, DECK_TABLE_LIBRARY_OVERLAP_DEFAULT, DECK_TABLE_LIBRARY_OVERLAP_MIN, DECK_TABLE_LIBRARY_OVERLAP_MAX, DECK_TABLE_LIBRARY_OVERLAP_STEP)
  };
}

function parseDeckTableViewSettings(raw: string | null): DeckTableViewSettings {
  if (!raw) return normalizeDeckTableViewSettings(null);
  try {
    return normalizeDeckTableViewSettings(JSON.parse(raw));
  } catch {
    return normalizeDeckTableViewSettings(null);
  }
}

function formatCatalogTerm(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === "ice") return "ICE";
  if (normalized === "event") return "Prep";
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

type OverlayTextDensityClass = "overlayTextDensityLarge" | "overlayTextDensityMedium" | "overlayTextDensityCompact";

function normalizedOverlayLineLength(line: string): number {
  return line.replace(/\s+/g, " ").trim().length;
}

function overlayTextDensityClass(title: string, rulesLines: string[]): OverlayTextDensityClass {
  const lineCount = rulesLines.length;
  const titleLength = title.trim().length;
  const ruleLength = rulesLines.reduce((sum, line) => sum + normalizedOverlayLineLength(line), 0);
  if (lineCount === 0) return titleLength > 24 ? "overlayTextDensityMedium" : "overlayTextDensityLarge";
  if (lineCount === 1) {
    if (ruleLength <= 28 && titleLength <= 24) return "overlayTextDensityLarge";
    if (ruleLength <= 52) return "overlayTextDensityMedium";
    return "overlayTextDensityCompact";
  }
  if (ruleLength <= 64 && titleLength <= 24) return "overlayTextDensityMedium";
  return "overlayTextDensityCompact";
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

function isHardwareCardType(type: string | undefined | null): boolean {
  return (type ?? "").toLowerCase() === "hardware";
}

function isOperationCardType(type: string | undefined | null): boolean {
  return (type ?? "").toLowerCase() === "operation";
}

function hasGeneratedCardArt(cardId: string | undefined | null): boolean {
  return isGeneratedCardImageId(cardId);
}

function CardImageOverlay({
  title,
  kindLabel,
  rulesText,
  cost,
  variantClassName,
  className,
  maxLines = 2
}: {
  title: string;
  kindLabel: string;
  rulesText?: string;
  cost?: number;
  variantClassName?: string;
  className?: string;
  maxLines?: number;
}) {
  const overlayRules = rulesText ? rulesTextLines(rulesText).slice(0, Math.max(0, maxLines)) : [];
  const typographyClassName = overlayTextDensityClass(title, overlayRules);
  const overlayClassName = ["hardwareImageOverlay", variantClassName, className, typographyClassName].filter(Boolean).join(" ");
  return (
    <span className={overlayClassName} aria-hidden="true">
      <span className="hardwareImageOverlayTop">
        <span className="hardwareImageOverlayName">{title}</span>
      </span>
      {cost != null ? <span className="hardwareImageOverlayCost">{cost}</span> : null}
      <span className="hardwareImageOverlayFrame">
        <span className="hardwareImageOverlayKind">{kindLabel}</span>
        {overlayRules.length > 0 ? (
          <span className="hardwareImageOverlayRules">
            {overlayRules.map((line, index) => (
              <span key={`${title}-${kindLabel}-overlay-rule-${index}`}>{renderRuleTextSegments(line, `${title}-${kindLabel}-overlay-rule-${index}`)}</span>
            ))}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function HardwareImageOverlay({
  title,
  rulesText,
  installCost,
  className,
  maxLines = 2
}: {
  title: string;
  rulesText?: string;
  installCost?: number | null | undefined;
  className?: string;
  maxLines?: number;
}) {
  return (
    <CardImageOverlay
      title={title}
      kindLabel="Hardware"
      maxLines={maxLines}
      {...(rulesText ? { rulesText } : {})}
      {...(installCost != null ? { cost: installCost } : {})}
      {...(className ? { className } : {})}
    />
  );
}

function OperationImageOverlay({
  title,
  rulesText,
  cost,
  className,
  maxLines = 2
}: {
  title: string;
  rulesText?: string;
  cost?: number | null | undefined;
  className?: string;
  maxLines?: number;
}) {
  return (
    <CardImageOverlay
      title={title}
      kindLabel="Operation"
      variantClassName="operationImageOverlay"
      maxLines={maxLines}
      {...(rulesText ? { rulesText } : {})}
      {...(cost != null ? { cost } : {})}
      {...(className ? { className } : {})}
    />
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
  const cardId = event.publicPayload.cardDefinitionId ?? event.publicPayload.sourceDefinitionId ?? event.publicPayload.targetCardDefinitionId;
  return typeof cardId === "string" ? cardId : null;
}

function revealedEventCardIds(event: PublicGameEvent): string[] {
  const ids = [
    revealedEventCardId(event),
    ...payloadStringList(event.publicPayload, "publicRevealDefinitionIds"),
    ...payloadStringList(event.publicPayload, "revealedAgendaDefinitionIds")
  ].filter((value): value is string => Boolean(value));
  return Array.from(new Set(ids));
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
    ...(view.opponent.discardCards ?? []),
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

function accessRevealFromLatestEvent(event: PublicGameEvent | undefined, detailsById: Record<string, CatalogCardDetail>, legalActions: LegalAction[], viewerSide: Side): AccessReveal | null {
  if (!event || event.publicPayload.actionType !== "access_card") return null;
  const cardId = payloadString(event.publicPayload, "cardDefinitionId");
  const title = payloadString(event.publicPayload, "title");
  if (!cardId || !title) return null;
  const actorSide = payloadSide(event.publicPayload, "actor") ?? "runner";
  const detail = detailsById[cardId] ?? null;
  const card = detail ? visibleCardFromCatalogDetail(detail) : visibleCardFromPublicEvent(event, cardId, title);
  const serverLabel = serverDisplayLabel(payloadString(event.publicPayload, "serverLabel") ?? "einen Server");
  const actions = legalActions.filter((action) => ["access_card", "steal_agenda", "trash_accessed_card", "decline_trash"].includes(action.type));
  return {
    eventId: event.eventId,
    actorSide,
    viewerSide,
    serverLabel,
    serverTitleLabel: accessServerTitleLabel(serverLabel),
    serverLocationPhrase: accessServerLocationPhrase(serverLabel),
    description: accessRevealDescription(actorSide, viewerSide, serverLabel),
    card,
    actions,
    trashStatus: accessRevealStatusLabel(card, actions, actorSide, viewerSide, serverLabel)
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

function payloadStringList(payload: Record<string, unknown>, key: string): string[] {
  return (
    payloadString(payload, key)
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function payloadSide(payload: Record<string, unknown>, key: string): Side | null {
  const value = payloadString(payload, key);
  return value === "corp" || value === "runner" ? value : null;
}

function accessRevealDescription(actorSide: Side, viewerSide: Side, serverLabel: string): string {
  const location = accessServerLocationPhrase(serverLabel);
  if (actorSide === viewerSide) return `Du hast auf eine Karte ${location} zugegriffen.`;
  return `${accessActorSubject(actorSide)} hat auf eine Karte ${location} zugegriffen.`;
}

function accessActorSubject(side: Side): string {
  return side === "corp" ? "Die Korp" : "Der Runner";
}

function accessServerTitleLabel(serverLabel: string): string {
  if (serverLabel === "HQ") return "Hauptquartier (HQ)";
  return serverLabel;
}

function accessServerLocationPhrase(serverLabel: string): string {
  if (serverLabel === "HQ") return "im Hauptquartier (HQ)";
  if (serverLabel === "Archive") return "im Archiv";
  if (/^Fort \d+$/.test(serverLabel)) return `im ${serverLabel}`;
  return `in ${serverLabel}`;
}

function isCatalogVisibleCard(card: CatalogCardSummary): boolean {
  return card.type !== "identity";
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

function catalogImageMetricTooltip(detail: CatalogCardDetail | null | undefined): string | undefined {
  if (!detail) return undefined;
  const tooltipParts = [
    detail.numeric.installCost !== null ? `Installkosten: ${detail.numeric.installCost}` : null,
    detail.numeric.strength !== null ? `Stärke: ${detail.numeric.strength}` : null,
    detail.numeric.cost !== null ? `Kosten: ${detail.numeric.cost}` : null
  ].filter((value): value is string => value !== null);
  if (tooltipParts.length === 0) return undefined;
  return tooltipParts.join(" · ");
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
    tableLayout: deck.tableLayout ?? null,
    cards: [...deck.cards].sort((left, right) => left.cardId.localeCompare(right.cardId))
  });
}

const DEFAULT_DECK_TABLE_PILE_COUNT = 8;
const MIN_DECK_TABLE_PILE_COUNT = 1;
const MAX_DECK_TABLE_PILE_COUNT = 20;
const DECK_TABLE_MAX_COPIES_PER_CARD = 3;

function defaultDeckTablePileName(side: Side, index: number): string {
  const runnerNames = ["Eisbrecher", "Programme", "Ressourcen", "Hardware", "Events", "Support", "Tempo", "Offen"];
  const corpNames = ["ICE", "Agendas", "Assets", "Operationen", "Upgrades", "Ökonomie", "Schutz", "Offen"];
  return (side === "runner" ? runnerNames : corpNames)[index] ?? `Stapel ${index + 1}`;
}

function defaultDeckTablePileIndexForCard(card: CatalogCardSummary | undefined): number {
  if (!card) return 0;
  const type = card.type.toLowerCase();
  const subtypes = card.subtypes.map((subtype) => subtype.toLowerCase());
  if (card.side === "runner") {
    if (type === "program" && subtypes.includes("icebreaker")) return 0;
    if (type === "program") return 1;
    if (type === "resource") return 2;
    if (type === "hardware") return 3;
    if (type === "event") return 4;
    return 7;
  }
  if (type === "ice") return 0;
  if (type === "agenda") return 1;
  if (type === "asset") return 2;
  if (type === "operation") return 3;
  if (type === "upgrade") return 4;
  return 7;
}

function normalizeDeckTablePileSortMode(value: unknown): DeckTablePileSortMode {
  return value === "name" || value === "type" || value === "install" || value === "rez" || value === "trash" || value === "cost" || value === "strength" || value === "agenda" ? value : "free";
}

function normalizeDeckTableLayout(deck: EditableDeck, cardLookup?: Map<string, CatalogCardSummary>, detailsById: Record<string, CatalogCardDetail> = {}): DeckTableLayout {
  const desired = new Map<string, number>();
  for (const entry of deck.cards) {
    if (!entry.cardId || !Number.isFinite(entry.quantity)) continue;
    desired.set(entry.cardId, (desired.get(entry.cardId) ?? 0) + Math.max(0, Math.floor(entry.quantity)));
  }
  const sourcePiles = [...(deck.tableLayout?.piles ?? [])]
    .filter((pile) => pile && typeof pile.id === "string")
    .sort((left, right) => left.order - right.order);
  const pileCount = Math.min(MAX_DECK_TABLE_PILE_COUNT, Math.max(MIN_DECK_TABLE_PILE_COUNT, deck.tableLayout?.piles.length ?? DEFAULT_DECK_TABLE_PILE_COUNT));
  const normalizedPiles: DeckTablePile[] = Array.from({ length: pileCount }, (_, index) => {
    const source = sourcePiles[index];
    return {
      id: source?.id || `pile-${index + 1}`,
      name: typeof source?.name === "string" ? source.name.slice(0, 40) : defaultDeckTablePileName(deck.side, index),
      order: index,
      sortMode: normalizeDeckTablePileSortMode(source?.sortMode),
      entries: []
    };
  });
  const remaining = new Map(desired);
  for (let pileIndex = 0; pileIndex < normalizedPiles.length; pileIndex += 1) {
    const source = sourcePiles[pileIndex];
    if (!source) continue;
    const entries = [...(source.entries ?? [])].sort((left, right) => left.order - right.order);
    for (const entry of entries) {
      const available = remaining.get(entry.cardId) ?? 0;
      if (available <= 0) continue;
      const quantity = Math.min(available, Math.max(0, Math.floor(entry.quantity)));
      if (quantity <= 0) continue;
      for (let copy = 0; copy < quantity; copy += 1) {
        normalizedPiles[pileIndex]!.entries.push({ cardId: entry.cardId, quantity: 1, order: normalizedPiles[pileIndex]!.entries.length });
      }
      remaining.set(entry.cardId, available - quantity);
    }
  }
  for (const [cardId, quantity] of remaining) {
    if (quantity <= 0) continue;
    const pileIndex = Math.min(normalizedPiles.length - 1, Math.max(0, defaultDeckTablePileIndexForCard(cardLookup?.get(cardId))));
    const fallbackPile = normalizedPiles[pileIndex]!;
    for (let copy = 0; copy < quantity; copy += 1) {
      fallbackPile.entries.push({ cardId, quantity: 1, order: fallbackPile.entries.length });
    }
  }
  return {
    schemaVersion: "deck-table-layout-v0.1",
    showPileNames: deck.tableLayout?.showPileNames ?? false,
    piles: normalizedPiles.map((pile) => applyDeckTablePileSort(pile, cardLookup ?? new Map<string, CatalogCardSummary>(), detailsById))
  };
}

function deckCardsFromTableLayout(layout: DeckTableLayout): DeckCardEntry[] {
  const byCard = new Map<string, number>();
  for (const pile of layout.piles) {
    for (const entry of pile.entries) {
      byCard.set(entry.cardId, (byCard.get(entry.cardId) ?? 0) + Math.max(0, Math.floor(entry.quantity)));
    }
  }
  return [...byCard.entries()]
    .map(([cardId, quantity]) => ({ cardId, quantity }))
    .filter((entry) => entry.quantity > 0)
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
}

function deckTableCardTotal(layout: DeckTableLayout, cardId: string): number {
  return layout.piles.reduce((sum, pile) => sum + pile.entries.filter((entry) => entry.cardId === cardId).reduce((pileSum, entry) => pileSum + entry.quantity, 0), 0);
}

function reorderDeckTableEntries(entries: DeckTableLayoutEntry[]): DeckTableLayoutEntry[] {
  return entries.map((entry, order) => ({ ...entry, order }));
}

function insertDeckTableEntry(entries: DeckTableLayoutEntry[], entry: DeckTableLayoutEntry, targetOrder?: number): DeckTableLayoutEntry[] {
  const orderedEntries = [...entries].sort((left, right) => left.order - right.order);
  if (targetOrder === undefined) return reorderDeckTableEntries([...orderedEntries, { ...entry, order: orderedEntries.length }]);
  const targetIndex = orderedEntries.findIndex((candidate) => candidate.order === targetOrder);
  if (targetIndex < 0) return reorderDeckTableEntries([...orderedEntries, { ...entry, order: orderedEntries.length }]);
  return reorderDeckTableEntries([...orderedEntries.slice(0, targetIndex), { ...entry, order: targetIndex }, ...orderedEntries.slice(targetIndex)]);
}

function insertDeckTableEntries(entries: DeckTableLayoutEntry[], insertedEntries: DeckTableLayoutEntry[], targetOrder?: number): DeckTableLayoutEntry[] {
  const orderedEntries = [...entries].sort((left, right) => left.order - right.order);
  const normalizedInserted = insertedEntries.map((entry, offset) => ({ ...entry, order: offset }));
  if (targetOrder === undefined) return reorderDeckTableEntries([...orderedEntries, ...normalizedInserted]);
  const targetIndex = orderedEntries.findIndex((candidate) => candidate.order === targetOrder);
  if (targetIndex < 0) return reorderDeckTableEntries([...orderedEntries, ...normalizedInserted]);
  return reorderDeckTableEntries([...orderedEntries.slice(0, targetIndex), ...normalizedInserted, ...orderedEntries.slice(targetIndex)]);
}

function deckTableSelectionKey(pileId: string, cardId: string, order: number): string {
  return `${pileId}::${order}::${cardId}`;
}

function deckTableSortLabel(sortBy: DeckTableSortKey): string {
  switch (sortBy) {
    case "type":
      return "Typ";
    case "install":
      return "Installkosten";
    case "rez":
      return "Rez-Kosten";
    case "trash":
      return "Trashkosten";
    case "cost":
      return "Kosten";
    case "strength":
      return "Stärke";
    case "agenda":
      return "Agenda-Punkte";
    default:
      return "Name";
  }
}

function deckTableNumericKey(sortBy: DeckTableSortKey): string | null {
  if (sortBy === "install") return "installCost";
  if (sortBy === "rez") return "rezCost";
  if (sortBy === "trash") return "trashCost";
  if (sortBy === "cost") return "cost";
  if (sortBy === "strength") return "strength";
  if (sortBy === "agenda") return "agendaPoints";
  return null;
}

function sortDeckTableEntries(entries: DeckTableLayoutEntry[], cardLookup: Map<string, CatalogCardSummary>, detailsById: Record<string, CatalogCardDetail>, sortBy: DeckTableSortKey): DeckTableLayoutEntry[] {
  const numericValue = (entry: DeckTableLayoutEntry, key: string): number => {
    const value = detailsById[entry.cardId]?.numeric[key];
    return value === null || value === undefined ? Number.POSITIVE_INFINITY : value;
  };
  const titleValue = (entry: DeckTableLayoutEntry): string => cardLookup.get(entry.cardId)?.title ?? entry.cardId;
  const typeValue = (entry: DeckTableLayoutEntry): string => deckBuilderCardGroup(cardLookup.get(entry.cardId) ?? null);
  const numericKey = deckTableNumericKey(sortBy);
  return reorderDeckTableEntries(
    [...entries].sort((left, right) => {
      if (numericKey) return numericValue(left, numericKey) - numericValue(right, numericKey) || typeValue(left).localeCompare(typeValue(right)) || titleValue(left).localeCompare(titleValue(right));
      if (sortBy === "type") return typeValue(left).localeCompare(typeValue(right)) || titleValue(left).localeCompare(titleValue(right));
      return titleValue(left).localeCompare(titleValue(right));
    })
  );
}

function deckTablePileSortModeLabel(sortMode: DeckTablePileSortMode): string {
  return sortMode === "free" ? "Frei" : deckTableSortLabel(sortMode);
}

function applyDeckTablePileSort(pile: DeckTablePile, cardLookup: Map<string, CatalogCardSummary>, detailsById: Record<string, CatalogCardDetail>): DeckTablePile {
  if (pile.sortMode === "free") return { ...pile, entries: reorderDeckTableEntries(pile.entries) };
  return { ...pile, entries: sortDeckTableEntries(pile.entries, cardLookup, detailsById, pile.sortMode) };
}

function deckTableEntryNumericValue(entry: DeckTableLayoutEntry, detailsById: Record<string, CatalogCardDetail>, key: string): number | null {
  const value = detailsById[entry.cardId]?.numeric[key];
  return value === null || value === undefined ? null : value;
}

function deckTableEntryBuildCost(entry: DeckTableLayoutEntry, detailsById: Record<string, CatalogCardDetail>): number | null {
  const detail = detailsById[entry.cardId];
  if (!detail) return null;
  if (detail.type === "agenda") return detail.numeric.advancementRequirement ?? null;
  return detail.numeric.installCost ?? detail.numeric.rezCost ?? detail.numeric.cost ?? null;
}

function deckTableBuildCostGroupName(key: string, entries: DeckTableLayoutEntry[], cardLookup: Map<string, CatalogCardSummary>): string {
  if (key === "overflow") return "Weitere Kosten";
  if (key === "none") return "Keine Kartenkosten";
  const hasAgenda = entries.some((entry) => cardLookup.get(entry.cardId)?.type === "agenda");
  const hasNonAgenda = entries.some((entry) => cardLookup.get(entry.cardId)?.type !== "agenda");
  if (hasAgenda && !hasNonAgenda) return `Benötigt ${key}`;
  if (hasAgenda && hasNonAgenda) return `Kosten/Benötigt ${key}`;
  return `Kosten ${key}`;
}

function deckTableTypeGroupOrder(side: Side, label: string): number {
  const filters = side === "corp" ? CORP_CATALOG_TYPE_FILTERS : RUNNER_CATALOG_TYPE_FILTERS;
  const index = filters.findIndex((filter) => filter.label === label);
  return index >= 0 ? index : filters.length;
}

function distributeDeckTableByType(layout: DeckTableLayout, side: Side, cardLookup: Map<string, CatalogCardSummary>, detailsById: Record<string, CatalogCardDetail>): DeckTableLayout {
  const allEntries = sortDeckTableEntries(layout.piles.flatMap((pile) => pile.entries), cardLookup, detailsById, "name");
  const grouped = new Map<string, DeckTableLayoutEntry[]>();
  for (const entry of allEntries) {
    const label = deckBuilderCardGroup(cardLookup.get(entry.cardId) ?? null);
    grouped.set(label, [...(grouped.get(label) ?? []), entry]);
  }
  const groups = [...grouped.entries()].sort((left, right) => deckTableTypeGroupOrder(side, left[0]) - deckTableTypeGroupOrder(side, right[0]) || left[0].localeCompare(right[0]));
  const groupCount = Math.min(MAX_DECK_TABLE_PILE_COUNT, Math.max(MIN_DECK_TABLE_PILE_COUNT, groups.length || 1));
  return {
    ...layout,
    piles: Array.from({ length: groupCount }, (_, index) => {
      const [label, entries] = groups[index] ?? [defaultDeckTablePileName(side, index), []];
      const sourcePile = layout.piles[index];
      return {
        id: sourcePile?.id ?? `pile-${index + 1}`,
        name: label,
        order: index,
        sortMode: "name",
        entries: reorderDeckTableEntries(entries)
      };
    })
  };
}

function distributeDeckTableByInstallCost(layout: DeckTableLayout, side: Side, cardLookup: Map<string, CatalogCardSummary>, detailsById: Record<string, CatalogCardDetail>): DeckTableLayout {
  const allEntries = sortDeckTableEntries(layout.piles.flatMap((pile) => pile.entries), cardLookup, detailsById, "name").sort((left, right) => {
    const leftValue = deckTableEntryBuildCost(left, detailsById);
    const rightValue = deckTableEntryBuildCost(right, detailsById);
    const normalizedLeft = leftValue === null ? Number.POSITIVE_INFINITY : leftValue;
    const normalizedRight = rightValue === null ? Number.POSITIVE_INFINITY : rightValue;
    const leftType = deckBuilderCardGroup(cardLookup.get(left.cardId) ?? null);
    const rightType = deckBuilderCardGroup(cardLookup.get(right.cardId) ?? null);
    return normalizedLeft - normalizedRight || leftType.localeCompare(rightType) || (cardLookup.get(left.cardId)?.title ?? left.cardId).localeCompare(cardLookup.get(right.cardId)?.title ?? right.cardId);
  });
  const grouped = new Map<string, DeckTableLayoutEntry[]>();
  for (const entry of allEntries) {
    const value = deckTableEntryBuildCost(entry, detailsById);
    const key = value === null ? "none" : String(value);
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  }
  const groups = [...grouped.entries()].sort((left, right) => {
    const leftValue = left[0] === "none" ? Number.POSITIVE_INFINITY : Number(left[0]);
    const rightValue = right[0] === "none" ? Number.POSITIVE_INFINITY : Number(right[0]);
    return leftValue - rightValue;
  });
  const visibleGroups =
    groups.length > MAX_DECK_TABLE_PILE_COUNT
      ? [...groups.slice(0, MAX_DECK_TABLE_PILE_COUNT - 1), ["overflow", groups.slice(MAX_DECK_TABLE_PILE_COUNT - 1).flatMap(([, entries]) => entries)] as [string, DeckTableLayoutEntry[]]]
      : groups;
  const groupCount = Math.min(MAX_DECK_TABLE_PILE_COUNT, Math.max(MIN_DECK_TABLE_PILE_COUNT, visibleGroups.length || 1));
  return {
    ...layout,
    piles: Array.from({ length: groupCount }, (_, index) => {
      const [key, entries] = visibleGroups[index] ?? [String(index), []];
      const sourcePile = layout.piles[index];
      const name = deckTableBuildCostGroupName(key, entries, cardLookup);
      return {
        id: sourcePile?.id ?? `pile-${index + 1}`,
        name: entries.length > 0 ? name : defaultDeckTablePileName(side, index),
        order: index,
        sortMode: "name",
        entries: reorderDeckTableEntries(entries)
      };
    })
  };
}

function deckMetadataFromEditable(deck: EditableDeck | null): DeckPublicMetadata | undefined {
  if (!deck) return undefined;
  return {
    side: deck.side,
    identityCardId: deck.identityCardId,
    deckName: deck.name,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    ...(deck.cardPoolVersion ? { cardPoolVersion: deck.cardPoolVersion } : {}),
    formatProfileId: deck.formatProfileId,
    ...(deck.formatProfileVersion ? { formatProfileVersion: deck.formatProfileVersion } : {}),
    deckHash: "wird beim Start geprüft"
  };
}

function serverLanesForSide(_side: Side, server: PlayerView["servers"][number]): Array<{ kind: "ice" | "root"; label: "ICE" | "Root"; cards: VisibleCard[] }> {
  const iceLane = { kind: "ice" as const, label: "ICE" as const, cards: server.ice };
  const rootLane = { kind: "root" as const, label: "Root" as const, cards: server.root };
  return [rootLane, iceLane];
}

function iceStackSlotClass(card: VisibleCard): string {
  const installedState = corpInstalledCardState(card);
  return installedState === "rezzed" ? "iceCardSlot rezzedIceStackSlot" : "iceCardSlot unrezzedIceStackSlot";
}

function opponentSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function sideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}

function turnSideForView(view: PlayerView): Side | null {
  if (view.phase === "corp_draw_phase" || view.phase === "corp_action_phase") return "corp";
  if (view.phase === "runner_action_phase" || view.phase === "run") return "runner";
  return null;
}

function turnActionHeaderLabel(view: PlayerView, side: Side, activeAiSide?: Side): string {
  const actorLabel = `${sideLabel(side)}${activeAiSide === side ? "-KI" : ""}`;
  return `Zug: ${currentTurnNumberForView(view)}  ${actorLabel} Aktionen`;
}

function currentTurnNumberForView(view: PlayerView): number {
  let activeSide: Side = "corp";
  let activeTurnNumber = 1;

  for (const event of view.publicEvents) {
    const actionType = typeof event.publicPayload.actionType === "string" ? event.publicPayload.actionType : event.type;
    const actor = sideFromPublicPayload(event.publicPayload.actor);
    if (!actor) continue;

    if (actionType === "mandatory_draw" && actor === "corp") {
      if (activeSide !== "corp") {
        activeSide = "corp";
        activeTurnNumber += 1;
      }
      continue;
    }

    if (actionType === "end_turn") {
      if (activeSide !== actor) activeSide = actor;
      activeSide = actor === "corp" ? "runner" : "corp";
      activeTurnNumber += 1;
    }
  }

  return activeTurnNumber;
}

function sideFromPublicPayload(value: unknown): Side | null {
  return value === "corp" || value === "runner" ? value : null;
}

function updateActionSlotCapacity(capacities: Record<Side, number>, side: Side, currentClicks: number, active: boolean, resetActiveSide: boolean, events: PublicGameEvent[]): void {
  const baseCapacity = baseActionSlotCapacity(side);
  const safeClicks = Math.max(0, Math.floor(currentClicks));
  const turnCapacity = active ? actionSlotCapacityForTurn(side, safeClicks, events) : safeClicks;
  if (active && resetActiveSide) {
    capacities[side] = Math.max(baseCapacity, turnCapacity);
    return;
  }
  if (active) {
    capacities[side] = Math.max(capacities[side] ?? baseCapacity, turnCapacity);
    return;
  }
  if (safeClicks > (capacities[side] ?? baseCapacity)) capacities[side] = safeClicks;
}

function centralServerCountLabel(view: PlayerView, serverId: PlayerView["servers"][number]["id"]): string | null {
  switch (serverId) {
    case "hq":
      return formatHandLimitCount(view.side === "corp" ? view.own.gripOrHq.length : view.opponent.handCount, view.side === "corp" ? view.own.maxHandSize : view.opponent.maxHandSize);
    case "rd":
      return formatCardCount(view.side === "corp" ? view.own.stackOrRdCount : view.opponent.deckCount);
    case "archives":
      return formatCardCount(view.side === "corp" ? view.own.heapOrArchives.length : (view.opponent.discardCount ?? 0));
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
  const turnNumberByEventId = chronicleTurnNumberByEventId(events);
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
          agendaPoints: typeof card?.numeric.agendaPoints === "number" ? card.numeric.agendaPoints : null,
          turnNumber: turnNumberByEventId[event.eventId] ?? null
        }
      ];
    })
  );
}

function formatCardCount(count: number): string {
  return `${count} ${count === 1 ? "Karte" : "Karten"}`;
}

function formatHandLimitCount(count: number, limit: number): string {
  return `${count} von ${limit} Karten`;
}

export default function Page() {
  const [entryTab, setEntryTab] = useState<EntryTab>("play");
  const [activeMatchWorkspace, setActiveMatchWorkspace] = useState<ActiveMatchWorkspace>("game");
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
  const [matchStartSettingsLoaded, setMatchStartSettingsLoaded] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<3 | 5 | 10>(3);
  const [seed, setSeed] = useState(() => createMatchSeed());
  const [joinLinkInput, setJoinLinkInput] = useState("");
  const [joinMatchId, setJoinMatchId] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [discoverableInLan, setDiscoverableInLan] = useState(true);
  const [openLanMatches, setOpenLanMatches] = useState<OpenMatchEntry[]>([]);
  const [openLanLoading, setOpenLanLoading] = useState(false);
  const [openLanError, setOpenLanError] = useState("");
  const [openLanUpdatedAt, setOpenLanUpdatedAt] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [payload, setPayload] = useState<ClientPayload | null>(null);
  const [lobby, setLobby] = useState<LobbyClientPayload | null>(null);
  const [lobbyChatText, setLobbyChatText] = useState("");
  const [simulation, setSimulation] = useState<AiSimulationSummary | null>(null);
  const [simulationPending, setSimulationPending] = useState(false);
  const [connection, setConnection] = useState<"offline" | "connecting" | "online">("offline");
  const [notice, setNotice] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSide, setCatalogSide] = useState<Side | "all">("all");
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatusKey | "all">("all");
  const [catalogExpertStatuses, setCatalogExpertStatuses] = useState(false);
  const [catalogTypeFilters, setCatalogTypeFilters] = useState<CatalogTypeFilterState>({ ...ALL_CATALOG_TYPE_FILTERS });
  const [catalogRarityFilter, setCatalogRarityFilter] = useState<CatalogRarityFilterKey>("all");
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
  const [deckLibraryStoragePath, setDeckLibraryStoragePath] = useState("");
  const [selectedLocalDeckId, setSelectedLocalDeckId] = useState<string | null>(null);
  const [deckValidation, setDeckValidation] = useState<DeckValidationResult | null>(null);
  const [validatedSnapshot, setValidatedSnapshot] = useState<DeckSnapshot | null>(null);
  const [deckImportText, setDeckImportText] = useState("");
  const [deckExportText, setDeckExportText] = useState("");
  const [cardDisplayMode, setCardDisplayMode] = useState<CardDisplayMode>("placeholder");
  const [cardPreviewCollapsed, setCardPreviewCollapsed] = useState(false);
  const [runnerHeapCollapsed, setRunnerHeapCollapsed] = useState(false);
  const [archivesCollapsed, setArchivesCollapsed] = useState(false);
  const [scoreAreaOverlays, setScoreAreaOverlays] = useState<Record<Side, boolean>>({ runner: false, corp: false });
  const [scoreAreaOverlayPositions, setScoreAreaOverlayPositions] = useState<Record<Side, RunOverlayPositionPreference>>({
    runner: { kind: "default" },
    corp: { kind: "default" }
  });
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [undoPanelOpen, setUndoPanelOpen] = useState(false);
  const [focusedCard, setFocusedCard] = useState<FocusedCard | null>(null);
  const [dismissedAccessEventId, setDismissedAccessEventId] = useState<string | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [matchDetailsOpen, setMatchDetailsOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("black");
  const [colorSchemeLoaded, setColorSchemeLoaded] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.45);
  const [audioSettingsLoaded, setAudioSettingsLoaded] = useState(false);
  const [localAiPacingMode, setLocalAiPacingMode] = useState<AiPacingMode>("paced");
  const [aiPacingModeLoaded, setAiPacingModeLoaded] = useState(false);
  const [cardDisplayModeLoaded, setCardDisplayModeLoaded] = useState(false);
  const [actionCueQueue, setActionCueQueue] = useState<OpponentActionCue[]>([]);
  const [currentActionCue, setCurrentActionCue] = useState<OpponentActionCue | null>(null);
  const [aiPacingFallbackVisible, setAiPacingFallbackVisible] = useState(false);
  const [dismissedResultKey, setDismissedResultKey] = useState<string | null>(null);
  const [seriesTransitioning, setSeriesTransitioning] = useState(false);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogRequest | null>(null);
  const [actionCuesEnabled, setActionCuesEnabled] = useState(true);
  const [actionCueAutoDismissMs, setActionCueAutoDismissMs] = useState<CueAutoDismissMs>(2500);
  const [automaticEffectCuesEnabled, setAutomaticEffectCuesEnabled] = useState(false);
  const [actionCueSettingsLoaded, setActionCueSettingsLoaded] = useState(false);
  const [autoEndTurnEnabled, setAutoEndTurnEnabled] = useState(false);
  const [autoDiscardEnabled, setAutoDiscardEnabled] = useState(false);
  const [topbarStickyEnabled, setTopbarStickyEnabled] = useState(true);
  const [gameplaySettingsLoaded, setGameplaySettingsLoaded] = useState(false);
  const [discardChoiceSelection, setDiscardChoiceSelection] = useState<{ choiceId: string; selectedOptionIds: string[] } | null>(null);
  const [cuePosition, setCuePosition] = useState<CuePositionPreference>(DEFAULT_CUE_POSITION);
  const [cuePositionLoaded, setCuePositionLoaded] = useState(false);
  const [cardTooltipHoverDelayMs, setCardTooltipHoverDelayMs] = useState<CardTooltipHoverDelayMs>(CARD_TOOLTIP_HOVER_OPEN_DELAY_MS);
  const [cardTooltipMode, setCardTooltipMode] = useState<CardTooltipMode>("enhanced");
  const [cardTooltipSettingsLoaded, setCardTooltipSettingsLoaded] = useState(false);
  const {
    cardTooltipScalePercent,
    cardHandScalePercent,
    cardArchiveScalePercent,
    cardZoneScalePercent,
    cardBoardScalePercent,
    cardRigScalePercent,
    setCardTooltipScalePercent,
    setCardHandScalePercent,
    setCardArchiveScalePercent,
    setCardZoneScalePercent,
    setCardBoardScalePercent,
    setCardRigScalePercent
  } = usePersistentCardScaleSettings();
  const [selectedActionContext, setSelectedActionContext] = useState<ActionContext | null>(null);
  const [actionSlotCapacities, setActionSlotCapacities] = useState<Record<Side, number>>({
    runner: baseActionSlotCapacity("runner"),
    corp: baseActionSlotCapacity("corp")
  });
  const [recentSession, setRecentSession] = useState<RecentSessionInfo | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<SessionInfo | null>(null);
  const lobbyRef = useRef<LobbyClientPayload | null>(null);
  const resultAudioPrimedRef = useRef(false);
  const lastAudioResultKeyRef = useRef<string | null>(null);
  const lastSeenCueEventIdRef = useRef<string | null>(null);
  const lastTurnStartAudioStateRef = useRef<TurnStartAudioState | null>(null);
  const lastTurnStartAudioCueKeyRef = useRef<string | null>(null);
  const locallyPlayedActionSoundKeysRef = useRef<Set<string>>(new Set());
  const autoEndTurnSubmittedKeyRef = useRef<string | null>(null);
  const autoDiscardSubmittedKeyRef = useRef<string | null>(null);
  const pendingAiAdvanceKeyRef = useRef<string | null>(null);
  const localAiPacingModeRef = useRef<AiPacingMode>("paced");
  const hasStoredMatchStartSettingsRef = useRef(false);
  const lastActionSlotTurnRef = useRef<{ matchId: string; activeSide: Side } | null>(null);
  const cardPreviewCollapsedStorageKey = session ? cardPreviewCollapsedStorageKeyFor(session.matchId, session.side) : null;

  const updateCardPreviewCollapsed = (collapsed: boolean) => {
    setCardPreviewCollapsed(collapsed);
    if (cardPreviewCollapsedStorageKey) window.localStorage.setItem(cardPreviewCollapsedStorageKey, collapsed ? "true" : "false");
  };

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    lobbyRef.current = lobby;
  }, [lobby]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("matchId");
    const token = params.get("joinToken");
    const reconnectToken = params.get("reconnectToken");
    const reconnectSide = params.get("side");
    const storedDisplayName = readLocalStorageWithLegacy(DISPLAY_NAME_STORAGE_KEY, LEGACY_DISPLAY_NAME_STORAGE_KEY)?.trim();
    const rawMatchStartSettings = readLocalStorageWithLegacy(MATCH_START_SETTINGS_STORAGE_KEY, LEGACY_MATCH_START_SETTINGS_STORAGE_KEY);
    const storedMatchStartSettings = parseMatchStartSettingsFromStorage(rawMatchStartSettings);
    if (rawMatchStartSettings && !storedMatchStartSettings) removeLocalStorageKeys(MATCH_START_SETTINGS_STORAGE_KEY, LEGACY_MATCH_START_SETTINGS_STORAGE_KEY);
    if (storedMatchStartSettings) {
      hasStoredMatchStartSettingsRef.current = true;
      if (storedMatchStartSettings.mode) setMode(storedMatchStartSettings.mode);
      if (storedMatchStartSettings.playMode) setPlayMode(storedMatchStartSettings.playMode);
      if (storedMatchStartSettings.humanSideSelection) setHumanSideSelection(storedMatchStartSettings.humanSideSelection);
      if (storedMatchStartSettings.humanAiSideSelection) setHumanAiSideSelection(storedMatchStartSettings.humanAiSideSelection);
      if (storedMatchStartSettings.matchFormat) setMatchFormat(storedMatchStartSettings.matchFormat);
      if (storedMatchStartSettings.runnerDifficulty) setRunnerDifficulty(storedMatchStartSettings.runnerDifficulty);
      if (storedMatchStartSettings.corpDifficulty) setCorpDifficulty(storedMatchStartSettings.corpDifficulty);
      if (storedMatchStartSettings.aiDeckPolicy) setAiDeckPolicy(storedMatchStartSettings.aiDeckPolicy);
      if (typeof storedMatchStartSettings.testSetupMode === "boolean") setTestSetupMode(storedMatchStartSettings.testSetupMode);
      if (storedMatchStartSettings.countdownSeconds) setCountdownSeconds(storedMatchStartSettings.countdownSeconds);
      if (typeof storedMatchStartSettings.seed === "string") setSeed(normalizeMatchSeed(storedMatchStartSettings.seed));
      if (storedMatchStartSettings.runnerDeckSource) setRunnerDeckSource(storedMatchStartSettings.runnerDeckSource);
      if (storedMatchStartSettings.corpDeckSource) setCorpDeckSource(storedMatchStartSettings.corpDeckSource);
      if (storedMatchStartSettings.participantBRunnerDeckSource) setParticipantBRunnerDeckSource(storedMatchStartSettings.participantBRunnerDeckSource);
      if (storedMatchStartSettings.participantBCorpDeckSource) setParticipantBCorpDeckSource(storedMatchStartSettings.participantBCorpDeckSource);
      if (typeof storedMatchStartSettings.selectedRunnerSnapshotId === "string") setSelectedRunnerSnapshotId(storedMatchStartSettings.selectedRunnerSnapshotId);
      if (typeof storedMatchStartSettings.selectedCorpSnapshotId === "string") setSelectedCorpSnapshotId(storedMatchStartSettings.selectedCorpSnapshotId);
      if (typeof storedMatchStartSettings.selectedParticipantBRunnerSnapshotId === "string") setSelectedParticipantBRunnerSnapshotId(storedMatchStartSettings.selectedParticipantBRunnerSnapshotId);
      if (typeof storedMatchStartSettings.selectedParticipantBCorpSnapshotId === "string") setSelectedParticipantBCorpSnapshotId(storedMatchStartSettings.selectedParticipantBCorpSnapshotId);
      if (typeof storedMatchStartSettings.selectedRunnerLocalDeckId === "string") setSelectedRunnerLocalDeckId(storedMatchStartSettings.selectedRunnerLocalDeckId);
      if (typeof storedMatchStartSettings.selectedCorpLocalDeckId === "string") setSelectedCorpLocalDeckId(storedMatchStartSettings.selectedCorpLocalDeckId);
      if (typeof storedMatchStartSettings.selectedParticipantBRunnerLocalDeckId === "string") setSelectedParticipantBRunnerLocalDeckId(storedMatchStartSettings.selectedParticipantBRunnerLocalDeckId);
      if (typeof storedMatchStartSettings.selectedParticipantBCorpLocalDeckId === "string") setSelectedParticipantBCorpLocalDeckId(storedMatchStartSettings.selectedParticipantBCorpLocalDeckId);
    } else {
      hasStoredMatchStartSettingsRef.current = false;
    }
    setMatchStartSettingsLoaded(true);
    const storedSession = loadStoredSession();
    if (matchId && reconnectToken && (reconnectSide === "runner" || reconnectSide === "corp")) {
      setEntryTab("play");
      setMode("join");
      void reconnectSession(
        {
          matchId,
          side: reconnectSide,
          sessionToken: "",
          reconnectToken,
          webSocketUrl: "",
          displayName: storedDisplayName || "Du"
        },
        "Wiederverbindung konnte nicht geladen werden."
      );
      return;
    }
    if (matchId && token) {
      if (storedSession && storedSession.matchId === matchId) {
        setSession(storedSession);
        void bootstrap(storedSession)
          .then((bootstrapped) => {
            if (bootstrapped && "playerView" in bootstrapped) {
              setPayload(bootstrapped);
              setLobby(null);
              persistSession(storedSession, bootstrapped);
              return;
            }
            if (bootstrapped) {
              setLobby(bootstrapped);
              setPayload(null);
              persistSession(storedSession, bootstrapped);
              return;
            }
            if (storedSession.reconnectToken) {
              void reconnectSession(storedSession, "Session konnte nicht geladen werden.");
              return;
            }
            setNotice("Session konnte nicht geladen werden.");
          })
          .catch(() => {
            if (storedSession.reconnectToken) void reconnectSession(storedSession, "Session konnte nicht geladen werden.");
            else setNotice("Session konnte nicht geladen werden.");
          });
        return;
      }
      setEntryTab("play");
      setMode("join");
      setJoinLinkInput(window.location.href);
      setJoinMatchId(matchId);
      setJoinToken(token);
      setDisplayName(storedDisplayName || "Teilnehmer B");
      return;
    }
    if (storedDisplayName) setDisplayName(storedDisplayName);
    if (!storedSession) {
      setRecentSession(loadRecentSession());
      return;
    }
    setSession(storedSession);
    void bootstrap(storedSession)
      .then((bootstrapped) => {
        if (bootstrapped && "playerView" in bootstrapped) {
          setPayload(bootstrapped);
          setLobby(null);
          persistSession(storedSession, bootstrapped);
        } else if (bootstrapped) {
          setLobby(bootstrapped);
          setPayload(null);
          persistSession(storedSession, bootstrapped);
        } else if (storedSession.reconnectToken) {
          void reconnectSession(storedSession, "Session konnte nicht geladen werden.");
        }
        else setNotice("Session konnte nicht geladen werden.");
      })
      .catch(() => {
        if (storedSession.reconnectToken) void reconnectSession(storedSession, "Session konnte nicht geladen werden.");
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
    const stored = readLocalStorageWithLegacy(CARD_DISPLAY_MODE_STORAGE_KEY, LEGACY_CARD_DISPLAY_MODE_STORAGE_KEY);
    if (stored !== null) setCardDisplayMode(normalizeCardDisplayMode(stored));
    setCardDisplayModeLoaded(true);
  }, []);

  useEffect(() => {
    if (!cardDisplayModeLoaded) return;
    window.localStorage.setItem(CARD_DISPLAY_MODE_STORAGE_KEY, cardDisplayMode);
  }, [cardDisplayModeLoaded, cardDisplayMode]);

  useEffect(() => {
    if (!cardPreviewCollapsedStorageKey) {
      setCardPreviewCollapsed(false);
      return;
    }
    const stored = window.localStorage.getItem(cardPreviewCollapsedStorageKey);
    if (stored === "true" || stored === "false") {
      setCardPreviewCollapsed(stored === "true");
      return;
    }
    if (stored !== null) window.localStorage.removeItem(cardPreviewCollapsedStorageKey);
    setCardPreviewCollapsed(false);
  }, [cardPreviewCollapsedStorageKey]);

  useEffect(() => {
    const stored = readLocalStorageWithLegacy(AI_PACING_MODE_STORAGE_KEY, LEGACY_AI_PACING_MODE_STORAGE_KEY);
    if (stored !== null) setLocalAiPacingMode(normalizeAiPacingMode(stored));
    setAiPacingModeLoaded(true);
  }, []);

  useEffect(() => {
    if (!aiPacingModeLoaded) return;
    window.localStorage.setItem(AI_PACING_MODE_STORAGE_KEY, localAiPacingMode);
  }, [aiPacingModeLoaded, localAiPacingMode]);

  useEffect(() => {
    let cancelled = false;
    const legacyDecks = readLegacyBrowserDecks();
    async function loadDeckLibrary() {
      try {
        const response = await fetch("/api/decks/library", { cache: "no-store" });
        const data = (await response.json()) as DeckLibraryResponse;
        if (!response.ok || data.error) throw new Error(data.error?.message ?? "deck_library_load_failed");
        let decks = data.decks ?? [];
        if (decks.length === 0 && legacyDecks.length > 0) {
          const migrated = await persistDeckLibrary(legacyDecks);
          decks = migrated.decks;
          if (!cancelled) setNotice("Bisherige Browser-Decks wurden in die lokale Datei-Deckbibliothek übernommen.");
        }
        if (cancelled) return;
        setDeckLibraryStoragePath(data.storagePath ?? "");
        applyLoadedDecks(decks);
      } catch {
        if (!cancelled) {
          applyLoadedDecks(legacyDecks);
          if (legacyDecks.length > 0) setNotice("Datei-Deckbibliothek nicht erreichbar; Browser-Decks wurden nur als Übergang geladen.");
        }
      } finally {
        if (!cancelled) setLocalDecksLoaded(true);
      }
    }
    void loadDeckLibrary();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!localDecksLoaded) return;
    const fallbackRunnerDeckId = localDecks.find((deck) => deck.side === "runner")?.deckId ?? "";
    const fallbackCorpDeckId = localDecks.find((deck) => deck.side === "corp")?.deckId ?? "";
    if (!localDecks.some((deck) => deck.side === "runner" && deck.deckId === selectedRunnerLocalDeckId)) setSelectedRunnerLocalDeckId(fallbackRunnerDeckId);
    if (!localDecks.some((deck) => deck.side === "corp" && deck.deckId === selectedCorpLocalDeckId)) setSelectedCorpLocalDeckId(fallbackCorpDeckId);
    if (!localDecks.some((deck) => deck.side === "runner" && deck.deckId === selectedParticipantBRunnerLocalDeckId)) setSelectedParticipantBRunnerLocalDeckId(fallbackRunnerDeckId);
    if (!localDecks.some((deck) => deck.side === "corp" && deck.deckId === selectedParticipantBCorpLocalDeckId)) setSelectedParticipantBCorpLocalDeckId(fallbackCorpDeckId);
  }, [localDecks, localDecksLoaded, selectedRunnerLocalDeckId, selectedCorpLocalDeckId, selectedParticipantBRunnerLocalDeckId, selectedParticipantBCorpLocalDeckId]);

  useEffect(() => {
    const storedAudio = readLocalStorageWithLegacy(AUDIO_STORAGE_KEY, LEGACY_AUDIO_STORAGE_KEY);
    if (storedAudio) {
      try {
        const parsed = JSON.parse(storedAudio) as { enabled?: boolean; volume?: number };
        setAudioEnabled(Boolean(parsed.enabled));
        if (typeof parsed.volume === "number") setAudioVolume(Math.min(1, Math.max(0, parsed.volume)));
      } catch {
        removeLocalStorageKeys(AUDIO_STORAGE_KEY, LEGACY_AUDIO_STORAGE_KEY);
      }
    }
    setAudioSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!audioSettingsLoaded) return;
    window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({ enabled: audioEnabled, volume: audioVolume }));
  }, [audioSettingsLoaded, audioEnabled, audioVolume]);

  useEffect(() => {
    const stored = readLocalStorageWithLegacy(ACTION_CUE_SETTINGS_STORAGE_KEY, LEGACY_ACTION_CUE_SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { enabled?: boolean; autoDismissMs?: number; automaticEffectsEnabled?: boolean };
        if (typeof parsed.enabled === "boolean") setActionCuesEnabled(parsed.enabled);
        if (typeof parsed.automaticEffectsEnabled === "boolean") setAutomaticEffectCuesEnabled(parsed.automaticEffectsEnabled);
        setActionCueAutoDismissMs(normalizeCueAutoDismissMs(parsed.autoDismissMs));
      } catch {
        removeLocalStorageKeys(ACTION_CUE_SETTINGS_STORAGE_KEY, LEGACY_ACTION_CUE_SETTINGS_STORAGE_KEY);
      }
    }
    setActionCueSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!actionCueSettingsLoaded) return;
    window.localStorage.setItem(ACTION_CUE_SETTINGS_STORAGE_KEY, JSON.stringify({ enabled: actionCuesEnabled, autoDismissMs: actionCueAutoDismissMs, automaticEffectsEnabled: automaticEffectCuesEnabled }));
  }, [actionCueSettingsLoaded, actionCuesEnabled, actionCueAutoDismissMs, automaticEffectCuesEnabled]);

  useEffect(() => {
    const stored = readLocalStorageWithLegacy(GAMEPLAY_SETTINGS_STORAGE_KEY, LEGACY_GAMEPLAY_SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { autoDiscardEnabled?: unknown; autoEndTurnEnabled?: unknown; topbarStickyEnabled?: unknown };
        if (typeof parsed.autoEndTurnEnabled === "boolean") setAutoEndTurnEnabled(parsed.autoEndTurnEnabled);
        if (typeof parsed.autoDiscardEnabled === "boolean") setAutoDiscardEnabled(parsed.autoDiscardEnabled);
        if (typeof parsed.topbarStickyEnabled === "boolean") setTopbarStickyEnabled(parsed.topbarStickyEnabled);
      } catch {
        removeLocalStorageKeys(GAMEPLAY_SETTINGS_STORAGE_KEY, LEGACY_GAMEPLAY_SETTINGS_STORAGE_KEY);
      }
    }
    setGameplaySettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!gameplaySettingsLoaded) return;
    window.localStorage.setItem(GAMEPLAY_SETTINGS_STORAGE_KEY, JSON.stringify({ autoDiscardEnabled, autoEndTurnEnabled, topbarStickyEnabled }));
  }, [gameplaySettingsLoaded, autoDiscardEnabled, autoEndTurnEnabled, topbarStickyEnabled]);

  useEffect(() => {
    const stored = readLocalStorageWithLegacy(CARD_TOOLTIP_SETTINGS_STORAGE_KEY, LEGACY_CARD_TOOLTIP_SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { hoverOpenDelayMs?: unknown; mode?: unknown };
        setCardTooltipHoverDelayMs(normalizeCardTooltipHoverDelayMs(parsed.hoverOpenDelayMs));
        setCardTooltipMode(normalizeCardTooltipMode(parsed.mode));
      } catch {
        removeLocalStorageKeys(CARD_TOOLTIP_SETTINGS_STORAGE_KEY, LEGACY_CARD_TOOLTIP_SETTINGS_STORAGE_KEY);
      }
    }
    setCardTooltipSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!cardTooltipSettingsLoaded) return;
    window.localStorage.setItem(CARD_TOOLTIP_SETTINGS_STORAGE_KEY, JSON.stringify({ hoverOpenDelayMs: cardTooltipHoverDelayMs, mode: cardTooltipMode }));
  }, [cardTooltipSettingsLoaded, cardTooltipHoverDelayMs, cardTooltipMode]);

  useEffect(() => {
    setCuePosition(parseCuePositionPreference(readLocalStorageWithLegacy(ACTION_CUE_POSITION_STORAGE_KEY, LEGACY_ACTION_CUE_POSITION_STORAGE_KEY)));
    setCuePositionLoaded(true);
  }, []);

  useEffect(() => {
    if (!cuePositionLoaded) return;
    window.localStorage.setItem(ACTION_CUE_POSITION_STORAGE_KEY, serializeCuePositionPreference(cuePosition));
  }, [cuePositionLoaded, cuePosition]);

  useEffect(() => {
    if (!matchStartSettingsLoaded || !localDecksLoaded) return;
    window.localStorage.setItem(
      MATCH_START_SETTINGS_STORAGE_KEY,
      serializeMatchStartSettingsForStorage({
        mode,
        playMode,
        humanSideSelection,
        humanAiSideSelection,
        matchFormat: matchFormat === "two_game_side_swap" ? "two_game_side_swap" : "rules_match",
        runnerDifficulty,
        corpDifficulty,
        aiDeckPolicy,
        testSetupMode,
        countdownSeconds,
        seed,
        runnerDeckSource,
        corpDeckSource,
        participantBRunnerDeckSource,
        participantBCorpDeckSource,
        selectedRunnerSnapshotId,
        selectedCorpSnapshotId,
        selectedParticipantBRunnerSnapshotId,
        selectedParticipantBCorpSnapshotId,
        selectedRunnerLocalDeckId,
        selectedCorpLocalDeckId,
        selectedParticipantBRunnerLocalDeckId,
        selectedParticipantBCorpLocalDeckId
      })
    );
  }, [
    matchStartSettingsLoaded,
    mode,
    playMode,
    humanSideSelection,
    humanAiSideSelection,
    matchFormat,
    runnerDifficulty,
    corpDifficulty,
    aiDeckPolicy,
    testSetupMode,
    countdownSeconds,
    seed,
    runnerDeckSource,
    corpDeckSource,
    participantBRunnerDeckSource,
    participantBCorpDeckSource,
    selectedRunnerSnapshotId,
    selectedCorpSnapshotId,
    selectedParticipantBRunnerSnapshotId,
    selectedParticipantBCorpSnapshotId,
    selectedRunnerLocalDeckId,
    selectedCorpLocalDeckId,
    selectedParticipantBRunnerLocalDeckId,
    selectedParticipantBCorpLocalDeckId,
    localDecksLoaded
  ]);

  useEffect(() => {
    if (!session) return;
    connectWebSocket(session);
    return () => socketRef.current?.close();
  }, [session?.matchId, session?.sessionToken]);

  const rarityFilteredCatalogCards = useMemo(() => filterCatalogCardsByRarity(catalogCards, catalogRarityFilter), [catalogCards, catalogRarityFilter]);
  const filteredCatalogCards = useMemo(() => filterCatalogCardsByType(rarityFilteredCatalogCards, catalogTypeFilters), [catalogTypeFilters, rarityFilteredCatalogCards]);
  const catalogRarityCounts = useMemo(() => summarizeCatalogRarityFilters(catalogCards), [catalogCards]);
  const catalogTypeCounts = useMemo(() => summarizeCatalogTypeFilters(rarityFilteredCatalogCards), [rarityFilteredCatalogCards]);

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
        setSelectedCatalogId((current) => nextCatalogSelection(current, visibleCards, catalogTypeFilters));
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
    let ignore = false;
    void fetch(`/api/cards/catalog/${encodeURIComponent(selectedCatalogId)}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<{ card?: CatalogCardDetail }>)
      .then((data) => {
        if (!ignore) setCatalogDetail(data.card ?? null);
      })
      .catch(() => {
        if (!ignore) setCatalogDetail(null);
      });
    return () => {
      ignore = true;
    };
  }, [selectedCatalogId]);

  useEffect(() => {
    const eventIds = (payload?.eventTail ?? []).flatMap(revealedEventCardIds);
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
  const activeDiscardChoice = activeView?.pendingChoice?.source === "discard_phase" ? activeView.pendingChoice : null;
  const activeDiscardOptionIds = useMemo(() => new Set(activeDiscardChoice?.options.map((option) => option.id) ?? []), [activeDiscardChoice]);
  const currentDiscardChoiceSelection = discardChoiceSelection;
  const selectedDiscardOptionIds =
    currentDiscardChoiceSelection && currentDiscardChoiceSelection.choiceId === activeDiscardChoice?.choiceId
      ? currentDiscardChoiceSelection.selectedOptionIds.filter((optionId) => activeDiscardOptionIds.has(optionId))
      : [];
  const selectedDiscardOptionIdSet = useMemo(() => new Set(selectedDiscardOptionIds), [selectedDiscardOptionIds.join("|")]);
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
  const aiTurnPresentation = effectiveAiTurnPresentation(payload);
  const hasPendingAiCue = currentActionCue?.source === "ai" || actionCueQueue.some((cue) => cue.source === "ai");
  const aiPacingFallbackDelay = aiPacingFallbackDelayMs(localAiPacingMode, hasPendingAiCue);
  const showAiPacingFallbackControls = Boolean(aiTurnPresentation?.canAdvanceAi && !payload?.winner && aiPacingFallbackDelay !== null && (aiPacingFallbackDelay === 0 || aiPacingFallbackVisible));
  const startSummary = matchStartSummary({
    playMode,
    matchFormat: matchFormat === "two_game_side_swap" ? "two_game_side_swap" : "rules_match",
    humanSideSelection,
    humanAiSideSelection,
    aiDeckPolicy,
    testSetupMode
  });
  const aiSlotDisabled = hasAiOpponent && aiDeckPolicy !== "selected";
  const openLanJoinableIds = new Set(openLanMatches.map((entry) => entry.matchId));
  const joinMatchIdTrimmed = joinMatchId.trim();
  const joinTokenTrimmed = joinToken.trim();
  const canJoinViaOpenLan = joinMatchIdTrimmed.length > 0 && joinTokenTrimmed.length === 0 && openLanJoinableIds.has(joinMatchIdTrimmed);
  const canSubmitJoin = joinMatchIdTrimmed.length > 0 && (joinTokenTrimmed.length > 0 || canJoinViaOpenLan);
  const visibleDeckMetadataEntries =
    gameMode === "ai_vs_ai"
      ? aiDeckPolicy === "selected"
        ? [
            { label: "Runner-KI", metadata: participantARunnerMetadata },
            { label: "Korp-KI", metadata: participantACorpMetadata }
          ]
        : []
      : [
          { label: "A Runner", metadata: participantARunnerMetadata },
          { label: "A Korp", metadata: participantACorpMetadata },
          ...(aiSlotDisabled || (isHumanVsHuman && !testSetupMode)
            ? []
            : [
                { label: hasAiOpponent ? "KI Runner" : "B Runner", metadata: participantBRunnerMetadata },
                { label: hasAiOpponent ? "KI Korp" : "B Korp", metadata: participantBCorpMetadata }
              ])
        ];
  const simulationStatusText = simulationPending ? "Simulation läuft..." : gameMode === "ai_vs_ai" ? notice : "";
  const selectedLocalDeck = localDecks.find((deck) => deck.deckId === selectedLocalDeckId) ?? null;
  const selectedDeckDirty = selectedLocalDeck ? savedDeckFingerprints[selectedLocalDeck.deckId] !== deckFingerprint(selectedLocalDeck) : false;
  const playableCatalogCards = useMemo(
    () => allCatalogCards.filter((card) => card.statuses.playable && card.statuses.deck_legal && (!selectedLocalDeck || card.side === selectedLocalDeck.side) && card.type !== "identity"),
    [allCatalogCards, selectedLocalDeck?.side]
  );
  const gripPreviewCard = activeView?.own.gripOrHq.find((card) => card.known) ?? null;
  const rigPreviewCard = activeView?.own.rig?.find((card) => card.known) ?? null;
  const currentFocusedCard = focusedCard?.matchId === payload?.matchId ? focusedCard : null;
  const previewSelection =
    currentFocusedCard ??
    (activeView?.run?.encounteredIce ? { card: activeView.run.encounteredIce, hiddenSide: "corp" as const } : null) ??
    (gripPreviewCard ? { card: gripPreviewCard } : null) ??
    (rigPreviewCard ? { card: rigPreviewCard } : null);
  const previewCard = previewSelection?.card ?? null;
  const previewHiddenSide = previewSelection?.hiddenSide;
  const enrichCard = (card: VisibleCard) => enrichVisibleCard(card, catalogDetailsById);
  const enrichedPreviewCard = previewCard ? enrichCard(previewCard) : null;
  const focusCard = (card: DisplayVisibleCard, hiddenSide?: Side) => {
    if (!payload?.matchId) return;
    setFocusedCard({ card, matchId: payload.matchId, ...(hiddenSide ? { hiddenSide } : {}) });
  };
  const selectActionCard = (card: DisplayVisibleCard, hiddenSide?: Side) => {
    focusCard(card, hiddenSide);
    if (card.known) {
      setSelectedActionContext((current) => (current?.kind === "card" && current.id === card.instanceId ? null : { kind: "card", id: card.instanceId, label: card.title ?? "Karte" }));
    }
  };
  const discardOptionForCard = (card: VisibleCard): VisibleChoiceOption | null => {
    if (!activeDiscardChoice) return null;
    return activeDiscardChoice.options.find((option) => option.value === card.instanceId) ?? null;
  };
  const toggleDiscardOption = (optionId: string) => {
    if (!activeDiscardChoice) return;
    const required = activeDiscardChoice.maxSelections;
    setDiscardChoiceSelection((current) => {
      const currentSelected = current?.choiceId === activeDiscardChoice.choiceId ? current.selectedOptionIds.filter((id) => activeDiscardOptionIds.has(id)) : [];
      const nextSelected = currentSelected.includes(optionId)
        ? currentSelected.filter((id) => id !== optionId)
        : currentSelected.length >= required
          ? currentSelected
          : [...currentSelected, optionId];
      return { choiceId: activeDiscardChoice.choiceId, selectedOptionIds: nextSelected };
    });
  };
  const accessRevealEvent = payload ? retainedAccessRevealEvent(payload.eventTail, dismissedAccessEventId) : null;
  const accessReveal = payload ? accessRevealFromLatestEvent(accessRevealEvent ?? undefined, catalogDetailsById, payload.legalActions, payload.side) : null;
  const showAccessReveal = Boolean(accessReveal && dismissedAccessEventId !== accessReveal.eventId);
  const resultSummary = payload?.resultSummary ?? null;
  const resultKey = resultSummary ? `${payload?.matchId ?? "match"}:${resultSummary.finalStateHash}` : null;
  const showResultModal = Boolean(resultSummary && resultKey && dismissedResultKey !== resultKey);
  const canReturnToStart = Boolean(payload && (resultSummary || payload.winner || payload.matchStatus === "finished" || payload.matchStatus === "forfeited"));
  const opponentDisplayName = payload?.opponentStatus.displayName ?? lobby?.opponentStatus.displayName ?? null;
  const canForfeit = Boolean(payload && payload.matchStatus === "active" && !payload.winner);
  const activeMatchIsGame = activeMatchWorkspace === "game";
  const activeCueHighlight = currentActionCue?.highlight ?? null;
  const hasDecisionCue = Boolean(currentActionCue?.requiresLocalAttention || activeView?.pendingChoice || (activeView?.activeSide === activeView?.side && payload?.legalActions.length));
  const legalActionSplit = useMemo(() => splitLegalActions(payload?.legalActions ?? []), [payload?.legalActions]);
  const runActions = useMemo(() => (activeView ? runWindowActions(activeView, payload?.legalActions ?? []) : []), [activeView, payload?.legalActions]);
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
  const activeRunIceId = activeView ? activeRunIceInstanceId(activeView) : null;
  const hiddenContextHint = activeView ? runHiddenContextActionHint(activeView, legalActionSplit.contextualActions) : null;
  const ownRigGroups = activeView ? groupRunnerRigCards(activeView.own.rig ?? []) : [];
  const scoreAreaCardsBySide = (side: Side): VisibleCard[] => {
    if (!activeView) return [];
    return side === activeView.side ? activeView.own.scoreArea : activeView.opponent.scoreArea;
  };
  const agendaPointsBySide = (side: Side): number => {
    if (!activeView) return 0;
    return side === activeView.side ? activeView.own.agendaPoints : activeView.opponent.agendaPoints;
  };
  const toggleScoreAreaOverlay = (side: Side) => {
    setScoreAreaOverlays((value) => ({ ...value, [side]: !value[side] }));
  };
  const effectiveAgendaTarget = activeView?.agendaPointsToWin ?? 7;

  useEffect(() => {
    if (runnerSnapshots.length === 0) return;
    const firstRunnerSnapshotId = runnerSnapshots[0]?.deckSnapshotId ?? "";
    const runnerSnapshotIds = new Set(runnerSnapshots.map((snapshot) => snapshot.deckSnapshotId));
    if (!runnerSnapshotIds.has(selectedRunnerSnapshotId)) setSelectedRunnerSnapshotId(firstRunnerSnapshotId);
    if (!runnerSnapshotIds.has(selectedParticipantBRunnerSnapshotId)) setSelectedParticipantBRunnerSnapshotId(firstRunnerSnapshotId);
  }, [runnerSnapshots, selectedRunnerSnapshotId, selectedParticipantBRunnerSnapshotId]);

  useEffect(() => {
    if (corpSnapshots.length === 0) return;
    const firstCorpSnapshotId = corpSnapshots[0]?.deckSnapshotId ?? "";
    const corpSnapshotIds = new Set(corpSnapshots.map((snapshot) => snapshot.deckSnapshotId));
    if (!corpSnapshotIds.has(selectedCorpSnapshotId)) setSelectedCorpSnapshotId(firstCorpSnapshotId);
    if (!corpSnapshotIds.has(selectedParticipantBCorpSnapshotId)) setSelectedParticipantBCorpSnapshotId(firstCorpSnapshotId);
  }, [corpSnapshots, selectedCorpSnapshotId, selectedParticipantBCorpSnapshotId]);

  useEffect(() => {
    if (!selectedActionContext) return;
    if (!activeView || payload?.winner || !actionContextStillVisible(selectedActionContext, activeView)) setSelectedActionContext(null);
  }, [activeView, payload?.winner, selectedActionContext]);

  useEffect(() => {
    if (selectedActionContext?.kind !== "card") return;
    const closeCardActionMenu = (event: PointerEvent) => {
      if (isCardActionSurfaceTarget(event.target)) return;
      setSelectedActionContext(null);
    };
    window.addEventListener("pointerdown", closeCardActionMenu, { capture: true });
    return () => window.removeEventListener("pointerdown", closeCardActionMenu, { capture: true });
  }, [selectedActionContext]);

  useEffect(() => {
    if (!activeDiscardChoice) {
      setDiscardChoiceSelection(null);
      autoDiscardSubmittedKeyRef.current = null;
      return;
    }
    setDiscardChoiceSelection((current) => {
      if (!current || current.choiceId !== activeDiscardChoice.choiceId) return { choiceId: activeDiscardChoice.choiceId, selectedOptionIds: [] };
      const nextSelected = current.selectedOptionIds.filter((optionId) => activeDiscardOptionIds.has(optionId));
      return nextSelected.length === current.selectedOptionIds.length ? current : { choiceId: activeDiscardChoice.choiceId, selectedOptionIds: nextSelected };
    });
  }, [activeDiscardChoice?.choiceId, activeDiscardOptionIds]);

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
      updateActionSlotCapacity(next, ownSide, activeView.own.clicks, activeView.activeSide === ownSide, resetActiveSide, activeView.publicEvents);
      updateActionSlotCapacity(next, opponent, activeView.opponent.clicks, activeView.activeSide === opponent, resetActiveSide, activeView.publicEvents);
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
    lastTurnStartAudioStateRef.current = null;
    lastTurnStartAudioCueKeyRef.current = null;
    setActionCueQueue([]);
    setCurrentActionCue(null);
    pendingAiAdvanceKeyRef.current = null;
    setFocusedCard(null);
  }, [session?.matchId, session?.sessionToken]);

  useEffect(() => {
    if (connection === "online") pendingAiAdvanceKeyRef.current = null;
  }, [connection]);

  useEffect(() => {
    if (payload?.pendingUndo) setUndoPanelOpen(true);
  }, [payload?.pendingUndo?.undoRequestId, payload?.pendingUndo?.needsResponse]);

  const updateLocalAiPacingMode = (mode: AiPacingMode) => {
    localAiPacingModeRef.current = mode;
    pendingAiAdvanceKeyRef.current = null;
    setLocalAiPacingMode(mode);
  };

  useEffect(() => {
    if (!payload) {
      lastTurnStartAudioStateRef.current = null;
      lastTurnStartAudioCueKeyRef.current = null;
      return;
    }
    const current: TurnStartAudioState = {
      matchId: payload.matchId,
      stateVersion: payload.playerView.stateVersion,
      activeSide: payload.playerView.activeSide,
      phase: payload.playerView.phase
    };
    const cue = turnStartAudioCue(current, lastTurnStartAudioStateRef.current);
    lastTurnStartAudioStateRef.current = current;
    if (!audioEnabled || !cue || lastTurnStartAudioCueKeyRef.current === cue.key) return;
    lastTurnStartAudioCueKeyRef.current = cue.key;
    playActionCueSound(cue.sound, audioVolume);
  }, [audioEnabled, audioVolume, payload?.matchId, payload?.playerView.activeSide, payload?.playerView.phase, payload?.playerView.stateVersion]);

  useEffect(() => {
    if (!payload) return;
    const latestId = payload.eventTail.at(-1)?.eventId ?? null;
    const lastSeen = lastSeenCueEventIdRef.current;
    if (lastSeen === null) {
      lastSeenCueEventIdRef.current = latestId;
      return;
    }
    const newEvents = publicEventsAfter(payload.eventTail, lastSeen);
    const contextByEventId = chronicleContextByEventId(payload.playerView.publicEvents, catalogDetailsById);
    const cues = actionCuesEnabled
      ? deriveOpponentActionCues({
          viewerSide: payload.side,
          playerView: payload.playerView,
          events: payload.eventTail,
          lastPresentedEventId: lastSeen,
          includeAutomaticEffectCues: automaticEffectCuesEnabled,
          contextByEventId
        })
      : [];
    lastSeenCueEventIdRef.current = latestId;
    if (cues.length > 0) setActionCueQueue((current) => [...current, ...cues]);
    if (!audioEnabled || newEvents.length === 0) return;
    const overlayEventIds = new Set(cues.map((cue) => cue.eventId));
    for (const event of newEvents) {
      if (overlayEventIds.has(event.eventId)) continue;
      const item = formatChronicleEvent(event, payload.side, contextByEventId[event.eventId] ?? {});
      const actionType = eventActionType(event);
      const actor = sideFromPublicPayload(event.publicPayload.actor);
      if (actor === payload.side && locallyPlayedActionSoundKeysRef.current.delete(localActionSoundKey(actor, event.stateVersionBefore, actionType))) continue;
      const sound = actionSoundForActionType(actionType, item.visibility);
      if (sound) playActionCueSound(sound, audioVolume, actionSoundCountForAction(actionType, event.publicPayload));
    }
  }, [actionCuesEnabled, automaticEffectCuesEnabled, audioEnabled, audioVolume, payload?.eventTail, payload?.playerView.stateVersion, payload?.side, catalogDetailsById]);

  useEffect(() => {
    if (currentActionCue || actionCueQueue.length === 0) return;
    const [nextCue, ...rest] = actionCueQueue;
    if (!nextCue) return;
    setCurrentActionCue(nextCue);
    setActionCueQueue(rest);
  }, [actionCueQueue, currentActionCue]);

  useEffect(() => {
    if (!currentActionCue) return;
    if (audioEnabled && currentActionCue.sound) playActionCueSound(currentActionCue.sound, audioVolume, currentActionCue.soundCount);
    if (localAiPacingMode === "manual" && currentActionCue.source === "ai" && aiTurnPresentation?.canAdvanceAi) return;
    if (actionCueAutoDismissMs === 0) return;
    const timeout = window.setTimeout(() => setCurrentActionCue(null), actionCueAutoDismissMs);
    return () => window.clearTimeout(timeout);
  }, [actionCueAutoDismissMs, aiTurnPresentation?.canAdvanceAi, audioEnabled, audioVolume, currentActionCue, localAiPacingMode]);

  useEffect(() => {
    if (!payload || !aiTurnPresentation?.canAdvanceAi || payload.winner || connection !== "online") return;
    const delayMs = aiPacingDelayMs(localAiPacingMode, Boolean(currentActionCue) || actionCueQueue.length > 0, actionCueAutoDismissMs);
    if (delayMs === null) return;
    const advanceKey = `${payload.matchId}:${payload.matchVersion}:${payload.playerView.stateVersion}:${localAiPacingMode}`;
    if (pendingAiAdvanceKeyRef.current === advanceKey) return;
    pendingAiAdvanceKeyRef.current = advanceKey;
    const timeout = window.setTimeout(() => {
      if (localAiPacingModeRef.current !== localAiPacingMode || localAiPacingModeRef.current === "manual") {
        if (pendingAiAdvanceKeyRef.current === advanceKey) pendingAiAdvanceKeyRef.current = null;
        return;
      }
      if (currentActionCue) setCurrentActionCue(null);
      const sent = advanceAi(localAiPacingModeRef.current === "fast" ? "until_human" : "single_step");
      if (!sent && pendingAiAdvanceKeyRef.current === advanceKey) pendingAiAdvanceKeyRef.current = null;
    }, delayMs);
    const retryTimeout = window.setTimeout(() => {
      if (pendingAiAdvanceKeyRef.current === advanceKey) pendingAiAdvanceKeyRef.current = null;
    }, Math.max(delayMs + 2500, 3200));
    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(retryTimeout);
      if (pendingAiAdvanceKeyRef.current === advanceKey) pendingAiAdvanceKeyRef.current = null;
    };
  }, [actionCueAutoDismissMs, actionCueQueue.length, aiTurnPresentation?.canAdvanceAi, connection, currentActionCue, localAiPacingMode, payload?.matchId, payload?.matchVersion, payload?.playerView.stateVersion, payload?.winner]);

  useEffect(() => {
    if (!aiTurnPresentation?.canAdvanceAi || payload?.winner || aiPacingFallbackDelay === null) {
      setAiPacingFallbackVisible(false);
      return;
    }
    if (aiPacingFallbackDelay === 0) {
      setAiPacingFallbackVisible(true);
      return;
    }
    setAiPacingFallbackVisible(false);
    const timeout = window.setTimeout(() => setAiPacingFallbackVisible(true), aiPacingFallbackDelay);
    return () => window.clearTimeout(timeout);
  }, [aiPacingFallbackDelay, aiTurnPresentation?.canAdvanceAi, payload?.matchId, payload?.matchVersion, payload?.playerView.stateVersion, payload?.winner]);

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
    const matchSeed = normalizeMatchSeed(seed);
    setSeed(matchSeed);
    let created: CreateMatchResponse;
    try {
      created = await postJson<CreateMatchResponse>("/api/matches", {
        ...matchStart.createRequest,
        displayName,
        seed: matchSeed,
        runnerDifficulty,
        corpDifficulty,
        ...(hasAiOpponent ? { aiPacingMode: "paced" } : {}),
        ...(isHumanVsHuman ? { countdownSeconds } : {}),
        ...(isHumanVsHuman ? { discoverableInLan } : {}),
        settings: {
          matchFormat,
          agendaPointsToWin: effectiveAgendaTarget
        },
        ...deckPayload
      });
    } catch (error) {
      setNotice(serverErrorNotice(error, "Match konnte nicht erstellt werden."));
      return;
    }
    if (created.error) {
      setNotice(created.error.message);
      return;
    }
    rememberDisplayName(displayName);
    setSeed(createMatchSeed());
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
    } catch (error) {
      setNotice(serverErrorNotice(error, "Nächstes Serienspiel konnte nicht erstellt werden."));
    } finally {
      setSeriesTransitioning(false);
    }
  };

  const runSimulation = async () => {
    setNotice("");
    setSimulation(null);
    setSimulationPending(true);
    try {
      const deckPayload = await matchDeckPayload();
      const result = await postJson<{ summary?: AiSimulationSummary; error?: { message: string } }>("/api/simulations/ai-vs-ai", {
        seed,
        runnerDifficulty,
        corpDifficulty,
        ...deckPayload,
        agendaPointsToWin: effectiveAgendaTarget,
        maxActions: 120
      });
      if (result.error) {
        setNotice(result.error.message);
        return;
      }
      if (!result.summary) {
        setNotice("Simulation konnte keine Ergebnisdaten liefern.");
        return;
      }
      setSimulation(result.summary);
      setNotice("Simulation abgeschlossen.");
    } catch (error) {
      setNotice(serverErrorNotice(error, "Simulation konnte nicht gestartet werden."));
    } finally {
      setSimulationPending(false);
    }
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
      ...(await deckSidePayload("corp", corpDeckSource, selectedCorpSnapshotId, selectedCorpLocalDeckId))
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
      if (savedDeckFingerprints[deck.deckId] !== deckFingerprint(deck)) throw new Error(`Bitte speichere das ${sideLabel(side)}-Deck vor dem Matchstart.`);
      const snapshot = await validateDeckForMatch(deck);
      return side === "runner" ? { runnerDeckSnapshot: snapshot } : { corpDeckSnapshot: snapshot };
    }
    return side === "runner" ? { runnerDeckSnapshotId: snapshotId } : { corpDeckSnapshotId: snapshotId };
  }

  const refreshOpenLanMatches = async (silent = false) => {
    if (!silent) setOpenLanLoading(true);
    setOpenLanError("");
    try {
      const response = await fetchOpenLanMatches();
      if (response.error) {
        setOpenLanMatches([]);
        setOpenLanError(response.error.message);
        setOpenLanUpdatedAt(new Date().toISOString());
        return;
      }
      setOpenLanMatches(response.matches ?? []);
      setOpenLanUpdatedAt(new Date().toISOString());
    } catch (error) {
      setOpenLanMatches([]);
      setOpenLanError(serverErrorNotice(error, "Offene Spiele konnten nicht geladen werden."));
      setOpenLanUpdatedAt(new Date().toISOString());
    } finally {
      if (!silent) setOpenLanLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== "join" || session) return;
    void refreshOpenLanMatches();
    const timer = window.setInterval(() => {
      void refreshOpenLanMatches(true);
    }, 7000);
    return () => {
      window.clearInterval(timer);
    };
  }, [mode, session?.matchId]);

  const updateJoinLinkInput = (value: string) => {
    setJoinLinkInput(value);
    const parsed = parseJoinLinkInput(value);
    if (!parsed) return;
    setJoinMatchId(parsed.matchId);
    setJoinToken(parsed.joinToken);
  };

  const selectOpenLanMatch = (matchId: string) => {
    setJoinMatchId(matchId);
    setJoinToken("");
    setJoinLinkInput("");
  };

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
    let joined: JoinMatchResponse;
    try {
      joined = await postJson<JoinMatchResponse>(`/api/matches/${encodeURIComponent(joinMatchIdTrimmed)}/join`, {
        token: joinTokenTrimmed,
        displayName,
        ...deckPayload
      });
    } catch (error) {
      setNotice(serverErrorNotice(error, "Beitritt konnte nicht gestartet werden."));
      return;
    }
    if (joined.error) {
      if (canJoinViaOpenLan) {
        setNotice("Das ausgewählte Spiel ist nicht mehr offen. Die LAN-Liste wurde aktualisiert.");
        void refreshOpenLanMatches(true);
      } else {
        setNotice(joined.error.message);
      }
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

  const reconnectSession = async (baseSession: SessionInfo, fallbackNotice = "Wiederverbindung konnte nicht gestartet werden.") => {
    let reconnected: JoinMatchResponse;
    try {
      reconnected = await postJson<JoinMatchResponse>(`/api/matches/${encodeURIComponent(baseSession.matchId)}/reconnect`, {
        side: baseSession.side,
        reconnectToken: baseSession.reconnectToken,
        displayName: baseSession.displayName
      });
    } catch (error) {
      setNotice(serverErrorNotice(error, fallbackNotice));
      return false;
    }
    if (reconnected.error) {
      setNotice(reconnected.error.message);
      clearStoredSession(baseSession);
      removeRecentSession(baseSession);
      setRecentSession(loadRecentSession());
      setSession(null);
      setPayload(null);
      setLobby(null);
      setConnection("offline");
      return false;
    }
    const nextSession = {
      ...baseSession,
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
    return true;
  };

  const reconnect = async () => {
    if (!session || !canReconnect) return;
    await reconnectSession(session);
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
      if (session) {
        clearStoredSession(session);
        removeRecentSession(session);
        setRecentSession(loadRecentSession());
      } else {
        clearStoredSession();
      }
      socketRef.current?.close();
      setConnection("offline");
    }
    if (session && shouldForgetRecoveryStatus(remotePayload.matchStatus)) {
      clearStoredSession(session);
      removeRecentSession(session);
      setRecentSession(loadRecentSession());
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
    let bootstrapped: ClientPayload | LobbyClientPayload | null;
    try {
      bootstrapped = await bootstrap(nextSession);
    } catch (error) {
      setNotice(serverErrorNotice(error, "Letzte Sitzung konnte nicht geladen werden."));
      return;
    }
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

  const playImmediateActionAudio = (action: LegalAction, stateVersion: number) => {
    if (!audioEnabled) return;
    const sound = localActionSoundKind(action);
    if (!sound) return;
    playActionCueSound(sound, audioVolume);
    const keys = locallyPlayedActionSoundKeysRef.current;
    keys.add(localActionSoundKey(action.side, stateVersion, action.type));
    const oldestKey = keys.values().next().value;
    if (keys.size > 20 && oldestKey) keys.delete(oldestKey);
  };

  const submitAction = (action: LegalAction, options: { immediateAudio?: boolean; confirmed?: boolean } = {}): boolean => {
    if (!session || !payload || !ensureSocketConnected()) return false;
    if (!options.confirmed && actionNeedsRegionReplacementConfirmation(action)) {
      setConfirmationDialog({
        title: "Region ersetzen",
        message: "Diese Installation ersetzt die vorhandene Region. Die bisherige Region wird ins Archiv gelegt.",
        confirmLabel: "Fortfahren",
        onConfirm: () => {
          submitAction(action, { ...options, confirmed: true });
        },
      });
      return false;
    }
    const stateVersion = payload.playerView.stateVersion;
    if (options.immediateAudio !== false) playImmediateActionAudio(action, stateVersion);
    if (selectedActionContext && actionMatchesContext(action, selectedActionContext)) setSelectedActionContext(null);
    socketRef.current?.send(
      JSON.stringify({
        type: "submit_action",
        payload: {
          matchId: session.matchId,
          side: session.side,
          actionId: action.actionId,
          clientKnownStateVersion: stateVersion,
          idempotencyKey: `${session.side}-${stateVersion}-${action.actionId}-${runtimeRandomId()}`
        }
      })
    );
    return true;
  };

  useEffect(() => {
    if (!autoEndTurnEnabled || !gameplaySettingsLoaded || !session || !payload || connection !== "online") return;
    const action = automaticEndTurnAction(payload.playerView, payload.legalActions, session.side);
    if (!action) return;
    const key = `${session.matchId}:${session.side}:${payload.playerView.stateVersion}:${action.actionId}`;
    if (autoEndTurnSubmittedKeyRef.current === key) return;
    if (submitAction(action, { immediateAudio: false })) autoEndTurnSubmittedKeyRef.current = key;
  }, [autoEndTurnEnabled, gameplaySettingsLoaded, session, payload, connection, submitAction]);

  const submitChoiceOption = (action: LegalAction, choiceId: string, selectedOptionId: string) => {
    if (!session || !payload || !ensureSocketConnected()) return;
    const stateVersion = payload.playerView.stateVersion;
    playImmediateActionAudio(action, stateVersion);
    socketRef.current?.send(
      JSON.stringify({
        type: "submit_action",
        payload: {
          matchId: session.matchId,
          side: session.side,
          actionId: action.actionId,
          clientKnownStateVersion: stateVersion,
          selectedChoices: { choiceId, selectedOptionIds: [selectedOptionId] },
          idempotencyKey: `${session.side}-${stateVersion}-${action.actionId}-${selectedOptionId}-${runtimeRandomId()}`
        }
      })
    );
  };

  const submitChoiceOptions = (action: LegalAction, choiceId: string, selectedOptionIds: string[], options: { immediateAudio?: boolean } = {}): boolean => {
    if (!session || !payload || !ensureSocketConnected()) return false;
    const stateVersion = payload.playerView.stateVersion;
    if (options.immediateAudio !== false) playImmediateActionAudio(action, stateVersion);
    socketRef.current?.send(
      JSON.stringify({
        type: "submit_action",
        payload: {
          matchId: session.matchId,
          side: session.side,
          actionId: action.actionId,
          clientKnownStateVersion: stateVersion,
          selectedChoices: { choiceId, selectedOptionIds },
          idempotencyKey: `${session.side}-${stateVersion}-${action.actionId}-${selectedOptionIds.join(".")}-${runtimeRandomId()}`
        }
      })
    );
    return true;
  };

  useEffect(() => {
    if (!autoDiscardEnabled || !gameplaySettingsLoaded || !session || !payload || connection !== "online" || !activeDiscardChoice) return;
    const discardAction = payload.legalActions.find((action) => action.type === "resolve_choice" && action.payload?.choiceId === activeDiscardChoice.choiceId);
    const required = activeDiscardChoice.maxSelections;
    if (!discardAction || required <= 0 || selectedDiscardOptionIds.length !== required) return;
    const key = `${session.matchId}:${session.side}:${payload.playerView.stateVersion}:${discardAction.actionId}:${selectedDiscardOptionIds.join(".")}`;
    if (autoDiscardSubmittedKeyRef.current === key) return;
    if (submitChoiceOptions(discardAction, activeDiscardChoice.choiceId, selectedDiscardOptionIds, { immediateAudio: false })) autoDiscardSubmittedKeyRef.current = key;
  }, [autoDiscardEnabled, gameplaySettingsLoaded, session, payload, connection, activeDiscardChoice, selectedDiscardOptionIds, submitChoiceOptions]);

  const setReady = (ready: boolean) => {
    if (!session || !ensureSocketConnected()) return;
    socketRef.current?.send(JSON.stringify({ type: "set_ready", payload: { ready } }));
  };

  const cancelCountdown = () => {
    if (!session || !ensureSocketConnected()) return;
    socketRef.current?.send(JSON.stringify({ type: "cancel_countdown", payload: {} }));
  };

  const cancelMatchLifecycle = async () => {
    if (!session) return;
    let result: LifecycleActionResponse;
    try {
      result = await postJson<LifecycleActionResponse>(`/api/matches/${encodeURIComponent(session.matchId)}/cancel`, {
        side: session.side,
        sessionToken: session.sessionToken
      });
    } catch (error) {
      setNotice(serverErrorNotice(error, "Match konnte nicht abgebrochen werden."));
      return;
    }
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
    let result: LifecycleActionResponse;
    try {
      result = await postJson<LifecycleActionResponse>(`/api/matches/${encodeURIComponent(session.matchId)}/leave`, {
        side: session.side,
        sessionToken: session.sessionToken
      });
    } catch (error) {
      setNotice(serverErrorNotice(error, "Lobby konnte nicht verlassen werden."));
      return;
    }
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
    let result: LifecycleActionResponse;
    try {
      result = await postJson<LifecycleActionResponse>(`/api/matches/${encodeURIComponent(session.matchId)}/forfeit`, {
        side: session.side,
        sessionToken: session.sessionToken
      });
    } catch (error) {
      setNotice(serverErrorNotice(error, "Spiel konnte nicht aufgegeben werden."));
      return;
    }
    if (!result.ok) {
      setNotice(result.error.message);
      return;
    }
    applyRemotePayload(result.actorPayload);
    setNotice("Spiel aufgegeben. Der Engine-State bleibt der letzte echte Spielzustand.");
  };

  const requestForfeitMatch = () => {
    if (!session || !payload || payload.matchStatus !== "active" || payload.winner) return;
    setConfirmationDialog({
      title: "Spiel aufgeben?",
      message: "Diese Aufgabe beendet das Match für beide Seiten. Der Engine-State bleibt der letzte echte Spielzustand.",
      confirmLabel: "Aufgeben",
      tone: "danger",
      onConfirm: forfeitMatch
    });
  };

  const setRetentionProtection = async (protectedValue: boolean) => {
    if (!session) return;
    let result: RetentionProtectionResponse;
    try {
      result = await postJson<RetentionProtectionResponse>(`/api/matches/${encodeURIComponent(session.matchId)}/retention-protection`, {
        side: session.side,
        sessionToken: session.sessionToken,
        protected: protectedValue
      });
    } catch (error) {
      setNotice(serverErrorNotice(error, "Löschschutz konnte nicht geändert werden."));
      return;
    }
    if (!result.ok) {
      setNotice("error" in result ? result.error.message : "Löschschutz konnte nicht geändert werden.");
      return;
    }
    applyRemotePayload(result.payload);
    setNotice(protectedValue ? "Dieses Spiel ist gegen automatisches Löschen geschützt." : "Löschschutz ist aufgehoben.");
  };

  const recreateMatch = async () => {
    if (!session) return;
    let recreated: CreateMatchResponse | LifecycleActionResponse;
    try {
      recreated = await postJson<CreateMatchResponse | LifecycleActionResponse>(`/api/matches/${encodeURIComponent(session.matchId)}/recreate`, {
        side: session.side,
        sessionToken: session.sessionToken,
        displayName: session.displayName
      });
    } catch (error) {
      setNotice(serverErrorNotice(error, "Match konnte nicht neu erstellt werden."));
      return;
    }
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
    if (!session || !ensureSocketConnected()) return;
    const text = lobbyChatText.trim();
    if (!text) return;
    socketRef.current?.send(JSON.stringify({ type: "send_lobby_chat", payload: { text } }));
    setLobbyChatText("");
  };

  const advanceAi = (mode: "single_step" | "until_human" = "single_step"): boolean => {
    if (!session || !payload || !aiTurnPresentation?.canAdvanceAi) return false;
    if (!ensureSocketConnected()) return false;
    try {
      socketRef.current?.send(
        JSON.stringify({
          type: "advance_ai",
          payload: {
            knownStateVersion: payload.playerView.stateVersion,
            knownMatchVersion: payload.matchVersion,
            mode
          }
        })
      );
      return true;
    } catch {
      pendingAiAdvanceKeyRef.current = null;
      setNotice("KI-Schritt konnte nicht gesendet werden. Bitte verbinde Dich erneut oder nutze den KI-Schritt erneut.");
      return false;
    }
  };

  const requestUndo = () => {
    if (!latestEventId || !ensureSocketConnected()) return;
    socketRef.current?.send(JSON.stringify({ type: "request_undo", payload: { targetEventId: latestEventId } }));
  };

  const resolveUndo = (accepted: boolean) => {
    if (!payload?.pendingUndo || !ensureSocketConnected()) return;
    socketRef.current?.send(
      JSON.stringify({
        type: accepted ? "accept_undo" : "decline_undo",
        payload: { undoRequestId: payload.pendingUndo.undoRequestId }
      })
    );
  };

  const leaveMatch = () => {
    const leavingSession = session;
    socketRef.current?.close();
    clearStoredSession(leavingSession ?? undefined);
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

  const ensureSocketConnected = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return true;
    setNotice("Serververbindung ist offline. Bitte prüfe, ob der lokale Multiplayer-Server läuft, und verbinde Dich erneut.");
    return false;
  };

  const copyJoinLink = async () => {
    if (!session?.joinUrl) return;
    const copied = await copyTextToClipboard(session.joinUrl);
    setNotice(copied ? "Join-Link kopiert." : "Kopieren war nicht möglich. Bitte Link manuell markieren und kopieren.");
  };

  const copyReconnectLink = async () => {
    if (!session?.reconnectToken) return;
    const copied = await copyTextToClipboard(reconnectUrlForSession(session));
    setNotice(copied ? "Wiederverbindungslink kopiert." : "Kopieren war nicht möglich. Bitte Link manuell markieren und kopieren.");
  };

  const discardLocalActiveSession = () => {
    setConfirmationDialog({
      title: "Lokale Sitzung löschen?",
      message: "Das Spiel wird nicht aufgegeben. Für den Wiedereinstieg brauchst Du den Wiederverbindungslink.",
      confirmLabel: "Sitzung löschen",
      tone: "danger",
      onConfirm: () => {
        setOptionsDialogOpen(false);
        leaveMatch();
      }
    });
  };

  const updateDisplayName = (value: string) => {
    setDisplayName(value);
    rememberDisplayName(value);
  };

  const createEmptyDeck = (side: Side) => {
    const now = new Date().toISOString();
    const templateIdentity = deckTemplates.find((candidate) => candidate.side === side)?.identityCardId;
    const deck: EditableDeck = {
      deckId: `local_${side}_${runtimeRandomId().slice(0, 8)}`,
      deckVersion: "0.6.0-local",
      name: side === "runner" ? "Neues Runner-Deck" : "Neues Korp-Deck",
      side,
      identityCardId: templateIdentity ?? DEFAULT_IDENTITY_BY_SIDE[side],
      cardPoolSnapshotId: DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID,
      cardPoolVersion: DEFAULT_DECK_CARD_POOL_VERSION,
      formatProfileId: DEFAULT_DECK_FORMAT_PROFILE_ID,
      formatProfileVersion: DEFAULT_DECK_FORMAT_PROFILE_VERSION,
      validationStatus: "needs_revalidation",
      cards: [],
      createdAt: now,
      updatedAt: now
    };
    const nextDecks = [...localDecks, deck];
    setLocalDecks(nextDecks);
    void commitDeckLibrary(nextDecks, "Neues Deck gespeichert. Füge Karten hinzu und speichere Änderungen bewusst.");
    setSelectedLocalDeckId(deck.deckId);
    selectDeckForSide(deck);
    clearDeckValidation();
  };

  const updateSelectedDeck = (nextDeck: EditableDeck) => {
    setLocalDecks((current) => current.map((deck) => (deck.deckId === nextDeck.deckId ? { ...nextDeck, updatedAt: new Date().toISOString() } : deck)));
    clearDeckValidation();
  };

  const saveSelectedDeck = () => {
    if (!selectedLocalDeck) return;
    void commitDeckLibrary(localDecks, "Deck gespeichert.");
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
      deckId: `${selectedLocalDeck.deckId}_copy_${runtimeRandomId().slice(0, 6)}`,
      name: `${selectedLocalDeck.name} Kopie`,
      createdAt: now,
      updatedAt: now
    };
    const nextDecks = [...localDecks, copy];
    setLocalDecks(nextDecks);
    void commitDeckLibrary(nextDecks, "Deck-Kopie gespeichert.");
    setSelectedLocalDeckId(copy.deckId);
    selectDeckForSide(copy);
    clearDeckValidation();
  };

  const deleteSelectedDeck = () => {
    if (!selectedLocalDeck) return;
    const nextDecks = localDecks.filter((deck) => deck.deckId !== selectedLocalDeck.deckId);
    setLocalDecks(nextDecks);
    setSelectedLocalDeckId(nextDecks[0]?.deckId ?? null);
    void commitDeckLibrary(nextDecks, "Deck gelöscht.");
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

  const useValidatedDeckForNextMatch = () => {
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
    setNotice("Deck-Snapshot für den nächsten Matchstart vorgemerkt.");
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
      deckId: parsed.deck.deckId || `local_import_${runtimeRandomId().slice(0, 8)}`,
      createdAt: parsed.deck.createdAt || now,
      updatedAt: now
    };
    const nextDecks = [...localDecks.filter((deck) => deck.deckId !== imported.deckId), imported];
    setLocalDecks(nextDecks);
    void commitDeckLibrary(nextDecks, "Deck importiert und gespeichert.");
    setSelectedLocalDeckId(imported.deckId);
    selectDeckForSide(imported);
    clearDeckValidation();
  };

  function clearDeckValidation() {
    setDeckValidation(null);
    setValidatedSnapshot(null);
  }

  async function commitDeckLibrary(nextDecks: EditableDeck[], successNotice: string) {
    try {
      const result = await persistDeckLibrary(nextDecks);
      setLocalDecks(result.decks);
      setSavedDeckFingerprints(Object.fromEntries(result.decks.map((deck) => [deck.deckId, deckFingerprint(deck)])));
      if (result.storagePath) setDeckLibraryStoragePath(result.storagePath);
      setNotice(successNotice);
    } catch {
      setNotice("Deck konnte nicht in der lokalen Datei-Deckbibliothek gespeichert werden.");
    }
  }

  async function persistDeckLibrary(nextDecks: EditableDeck[]): Promise<{ decks: EditableDeck[]; storagePath?: string }> {
    const response = await fetch("/api/decks/library", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decks: nextDecks })
    });
    const data = (await response.json()) as DeckLibraryResponse;
    if (!response.ok || data.error) throw new Error(data.error?.message ?? "deck_library_save_failed");
    return { decks: data.decks ?? nextDecks, ...(data.storagePath ? { storagePath: data.storagePath } : {}) };
  }

  function applyLoadedDecks(decks: EditableDeck[]) {
    const firstRunnerDeckId = decks.find((deck) => deck.side === "runner")?.deckId ?? "";
    const firstCorpDeckId = decks.find((deck) => deck.side === "corp")?.deckId ?? "";
    const hasRunnerDeck = firstRunnerDeckId.length > 0;
    const hasCorpDeck = firstCorpDeckId.length > 0;
    setLocalDecks(decks);
    setSelectedLocalDeckId(decks[0]?.deckId ?? null);
    setSavedDeckFingerprints(Object.fromEntries(decks.map((deck) => [deck.deckId, deckFingerprint(deck)])));
    setSelectedRunnerLocalDeckId((current) => (hasRunnerDeck && decks.some((deck) => deck.side === "runner" && deck.deckId === current) ? current : firstRunnerDeckId));
    setSelectedCorpLocalDeckId((current) => (hasCorpDeck && decks.some((deck) => deck.side === "corp" && deck.deckId === current) ? current : firstCorpDeckId));
    setSelectedParticipantBRunnerLocalDeckId((current) => (hasRunnerDeck && decks.some((deck) => deck.side === "runner" && deck.deckId === current) ? current : firstRunnerDeckId));
    setSelectedParticipantBCorpLocalDeckId((current) => (hasCorpDeck && decks.some((deck) => deck.side === "corp" && deck.deckId === current) ? current : firstCorpDeckId));
    if (!hasStoredMatchStartSettingsRef.current) {
      if (hasRunnerDeck) setRunnerDeckSource("local");
      if (hasCorpDeck) setCorpDeckSource("local");
    }
  }

  function readLegacyBrowserDecks(): EditableDeck[] {
    const storedDecks = readLocalStorageWithLegacy(DECK_STORAGE_KEY, LEGACY_DECK_STORAGE_KEY);
    if (!storedDecks) return [];
    try {
      const parsed = JSON.parse(storedDecks) as EditableDeck[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      removeLocalStorageKeys(DECK_STORAGE_KEY, LEGACY_DECK_STORAGE_KEY);
      return [];
    }
  }

  function selectDeckForSide(deck: EditableDeck) {
    if (deck.side === "runner") {
      setSelectedRunnerLocalDeckId(deck.deckId);
      setRunnerDeckSource("local");
    } else {
      setSelectedCorpLocalDeckId(deck.deckId);
      setCorpDeckSource("local");
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
    const socket = new WebSocket(normalizeWebSocketUrl(nextSession.webSocketUrl));
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
      if (sessionRef.current) rememberRecentSession(sessionRef.current, message.payload);
      return;
    }
    if (message.type === "state_update") {
      pendingAiAdvanceKeyRef.current = null;
      setPayload((current) => {
        if (!current) {
          const currentLobby = lobbyRef.current;
          const activeSession = sessionRef.current;
          const side = currentLobby?.side ?? activeSession?.side;
          const matchId = currentLobby?.matchId ?? activeSession?.matchId;
          const nextFromLobby =
            side && matchId
              ? {
                  matchId,
                  matchStatus: message.payload.matchStatus,
                  matchVersion: message.payload.matchVersion,
                  side,
                  playerView: message.payload.playerView,
                  legalActions: [],
                  eventTail: [],
                  opponentStatus: currentLobby?.opponentStatus ?? { side: side === "runner" ? "corp" : "runner", connected: false }
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
        const nextWithUndo = message.payload.pendingUndo ? { ...next, pendingUndo: message.payload.pendingUndo } : removePendingUndo(next);
        if (message.payload.playerView.winner) return { ...next, winner: message.payload.playerView.winner };
        const { winner: _winner, finalStateHash: _finalStateHash, ...withoutWinner } = nextWithUndo;
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
      pendingAiAdvanceKeyRef.current = null;
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
      const activeSession = sessionRef.current;
      if (activeSession && shouldForgetRecoveryStatus(message.payload.matchStatus)) {
        clearStoredSession(activeSession);
        removeRecentSession(activeSession);
        setRecentSession(loadRecentSession());
      }
      return;
    }
    if (message.type === "error") {
      pendingAiAdvanceKeyRef.current = null;
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
  const handCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, cardHandScalePercent / 100);
  const zoneCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, cardZoneScalePercent / 100);
  const boardCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, cardBoardScalePercent / 100);
  const rigCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, cardRigScalePercent / 100);
  const handCardsStyle = useMemo(
    () => ({ "--cards-min-width": `${Math.round(CARD_DISPLAY_BASE_MIN_WIDTH * handCardScale)}px` } as CSSProperties),
    [handCardScale]
  );
  const ownRigCardsStyle = useMemo(
    () => ({ "--cards-min-width": `${Math.round(CARD_DISPLAY_BASE_MIN_WIDTH * rigCardScale)}px` } as CSSProperties),
    [rigCardScale]
  );
  const zoneCardsStyle = useMemo(() => ({ "--zone-card-scale": String(zoneCardScale) } as CSSProperties), [zoneCardScale]);
  const boardLaneStyle = useMemo(() => ({ "--lane-card-scale": String(boardCardScale) } as CSSProperties), [boardCardScale]);

  if (!session || !payload || !activeView) {
    return (
      <CardScaleSettingsContext.Provider
        value={{
          tooltipPercent: cardTooltipScalePercent,
          handPercent: cardHandScalePercent,
          archivePercent: cardArchiveScalePercent,
          zonePercent: cardZoneScalePercent,
          boardPercent: cardBoardScalePercent,
          rigPercent: cardRigScalePercent
        }}
      >
      <CardTooltipSettingsContext.Provider value={{ hoverOpenDelayMs: cardTooltipHoverDelayMs, mode: cardTooltipMode }}>
      <main className="app" data-theme={colorScheme}>
        <header className="topbar">
          <div className="topbarStatusGroup">
            <Brand />
            <div className="topbarMeta">
              <span className="topbarVersion">{APP_STATUS_LABEL}</span>
              <ConnectionBadge text={statusText} state={connection} />
            </div>
          </div>
        </header>
        <div className="setup v07Entry" data-testid="setup-screen">
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
              Deck-Editor
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
          <div className={`entryContent ${entryTab === "decks" ? "deckEntryContent" : ""}`}>
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
              <div className="matchStartConsole">
                <section className="matchStartSection" aria-label="Spielart">
                  <p className="eyebrow">Spielart</p>
                  <div className="choiceCardGrid playModeCards">
                    {(["human_vs_human", "human_vs_ai", "ai_vs_ai"] as PlayMode[]).map((option) => {
                      const label = playModeCardLabel(option);
                      const Icon = option === "human_vs_human" ? Link2 : option === "human_vs_ai" ? Bot : Activity;
                      return (
                        <button
                          key={option}
                          className={`choiceCard ${playMode === option ? "active" : ""}`}
                          onClick={() => setPlayMode(option)}
                          type="button"
                          aria-pressed={playMode === option}
                          data-testid={`play-mode-${option.replaceAll("_", "-")}`}
                        >
                          <Icon size={18} />
                          <span>
                            <strong>{label.title}</strong>
                            <small>{label.description}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
                <section className="matchStartSection" aria-label="Spielziel">
                  <p className="eyebrow">Format</p>
                  <div className="choiceCardGrid formatCards">
                    {(["rules_match", "two_game_side_swap"] as MatchFormatSelection[]).map((option) => {
                      const label = matchFormatCardLabel(option);
                      return (
                        <button
                          key={option}
                          className={`choiceCard ${matchFormat === option ? "active" : ""}`}
                          onClick={() => setMatchFormat(option)}
                          type="button"
                          aria-pressed={matchFormat === option}
                          data-testid={option === "rules_match" ? "match-format-rules-match" : "match-format-series"}
                        >
                          <Flag size={18} />
                          <span>
                            <strong>{label.title}</strong>
                            <small>{label.description}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
                <div className="formGrid primaryStartGrid">
                <label>
                  Name
                  <input value={displayName} onChange={(event) => updateDisplayName(event.target.value)} />
                </label>
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
                {gameMode === "ai_vs_ai" ? (
                  <label>
                    Runner-KI
                    <select value={runnerDifficulty} onChange={(event) => setRunnerDifficulty(event.target.value as AiDifficulty)}>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                ) : null}
                {gameMode === "ai_vs_ai" ? (
                  <label>
                    Korp-KI
                    <select value={corpDifficulty} onChange={(event) => setCorpDifficulty(event.target.value as AiDifficulty)}>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                ) : null}
                </div>
                {gameMode !== "ai_vs_ai" || aiDeckPolicy === "selected" ? (
                  <div className="deckSlotGrid">
                    <DeckSlotSelect
                      label={gameMode === "ai_vs_ai" ? "Runner-KI · Runner-Deck" : "Teilnehmer A · Runner-Deck"}
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
                      label={gameMode === "ai_vs_ai" ? "Korp-KI · Korp-Deck" : "Teilnehmer A · Korp-Deck"}
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
                  </div>
                ) : null}
                <div className="matchStartSummary" data-testid="match-start-summary">
                  {startSummary.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <button className="button primary wide" onClick={createMatch} data-testid="create-match" disabled={simulationPending}>
                  {gameMode === "ai_vs_ai" ? <Bot size={16} /> : <UserPlus size={16} />}
                  {gameMode === "ai_vs_ai" ? (simulationPending ? "Simulation läuft" : "Simulation starten") : isHumanVsHuman ? "Lobby erstellen" : "Match erstellen"}
                </button>
                {simulationStatusText ? (
                  <p className="notice startFeedback" role="status" aria-live="polite">
                    {simulationStatusText}
                  </p>
                ) : null}
                <details className="advancedMatchOptions" data-testid="advanced-match-options">
                  <summary>
                    <SlidersHorizontal size={15} />
                    Erweiterte Optionen
                  </summary>
                  <div className="formGrid advancedMatchGrid">
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
                      <label className={`deckBuilderToggle ${discoverableInLan ? "checked" : ""}`}>
                        <input checked={discoverableInLan} onChange={(event) => setDiscoverableInLan(event.target.checked)} type="checkbox" />
                        In LAN-Liste sichtbar
                      </label>
                    ) : null}
                    <label>
                      Seed
                      <input value={seed} onChange={(event) => setSeed(event.target.value)} />
                    </label>
                    {isHumanVsHuman ? (
                      <label className={`deckBuilderToggle ${testSetupMode ? "checked" : ""}`}>
                        <input checked={testSetupMode} onChange={(event) => setTestSetupMode(event.target.checked)} type="checkbox" />
                        Testkonstellation · beide Teilnehmer festlegen
                      </label>
                    ) : null}
                    {(isHumanVsAi && humanAiSideSelection !== "runner") ? (
                      <label>
                        Runner-KI
                        <select value={runnerDifficulty} onChange={(event) => setRunnerDifficulty(event.target.value as AiDifficulty)}>
                          <option value="easy">Easy</option>
                          <option value="normal">Normal</option>
                          <option value="hard">Hard</option>
                        </select>
                      </label>
                    ) : null}
                    {(isHumanVsAi && humanAiSideSelection !== "corp") ? (
                      <label>
                        Korp-KI
                        <select value={corpDifficulty} onChange={(event) => setCorpDifficulty(event.target.value as AiDifficulty)}>
                          <option value="easy">Easy</option>
                          <option value="normal">Normal</option>
                          <option value="hard">Hard</option>
                        </select>
                      </label>
                    ) : null}
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
                  </div>
                  {(isHumanVsHuman && testSetupMode) || (isHumanVsAi && aiDeckPolicy === "selected") ? (
                    <div className="deckSlotGrid advancedDeckSlots">
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
                        label={hasAiOpponent ? "KI · Korp-Deck" : "Teilnehmer B · Korp-Deck"}
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
                    </div>
                  ) : null}
                </details>
                <DeckMetadataLine entries={visibleDeckMetadataEntries} />
                {simulation ? <SimulationResult summary={simulation} /> : null}
              </div>
            ) : (
              <div className="matchStartConsole joinConsole">
                <section className="openLanMatchesPanel" aria-label="Offene Spiele im LAN" data-testid="open-lan-panel">
                  <div className="openLanMatchesHeader">
                    <p className="eyebrow">Offene Spiele im LAN</p>
                    <button className="button" onClick={() => void refreshOpenLanMatches()} type="button" disabled={openLanLoading} data-testid="refresh-open-lan">
                      <RotateCcw size={14} />
                      Aktualisieren
                    </button>
                  </div>
                  <p className="openLanNotice" data-testid="open-lan-scope-note">
                    Hier erscheinen nur private Duelle (Mensch gegen Mensch) mit aktivierter LAN-Sichtbarkeit.
                  </p>
                  {openLanError ? (
                    <p className="notice openLanNotice" role="status">
                      {openLanError}
                    </p>
                  ) : null}
                  {openLanMatches.length === 0 ? (
                    <p className="openLanEmpty">{openLanLoading ? "Lade offene Spiele ..." : "Keine offenen Spiele gefunden."}</p>
                  ) : (
                    <ul className="openLanList" data-testid="open-lan-list">
                      {openLanMatches.map((entry) => (
                        <li key={entry.matchId}>
                          <button
                            className={`openLanEntry ${joinMatchIdTrimmed === entry.matchId && joinTokenTrimmed.length === 0 ? "selected" : ""}`}
                            onClick={() => selectOpenLanMatch(entry.matchId)}
                            type="button"
                          >
                            <strong>{shortMatchId(entry.matchId)}</strong>
                            <small>
                              {entry.hostDisplayName} · Mensch vs Mensch · Status: wartend · Alter: {openMatchAgeLabel(entry.ageSeconds)}
                            </small>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {openLanUpdatedAt ? <p className="openLanTimestamp">Zuletzt aktualisiert: {formatLobbyTime(openLanUpdatedAt)}</p> : null}
                </section>
                <label className="joinLinkField">
                  Join-Link
                  <input value={joinLinkInput} onChange={(event) => updateJoinLinkInput(event.target.value)} data-testid="join-link-input" />
                </label>
                <label>
                  Name
                  <input value={displayName} onChange={(event) => updateDisplayName(event.target.value)} />
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
                    label="Dein Korp-Deck"
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
                <details className="advancedMatchOptions" data-testid="manual-join-options">
                  <summary>
                    <Keyboard size={15} />
                    Manuell eingeben
                  </summary>
                  <div className="formGrid advancedMatchGrid">
                    <label>
                      Match
                      <input value={joinMatchId} onChange={(event) => setJoinMatchId(event.target.value)} />
                    </label>
                    <label>
                      Token
                      <input value={joinToken} onChange={(event) => setJoinToken(event.target.value)} />
                    </label>
                  </div>
                </details>
                <button className="button primary wide" onClick={joinMatch} disabled={!canSubmitJoin} data-testid="join-match">
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
            showExpertStatuses={catalogExpertStatuses}
            rarityCounts={catalogRarityCounts}
            rarityFilter={catalogRarityFilter}
            typeCounts={catalogTypeCounts}
            typeFilters={catalogTypeFilters}
            onSearch={setCatalogSearch}
            onSide={setCatalogSide}
            onStatus={setCatalogStatus}
            onSelect={setSelectedCatalogId}
            onToggleExpertStatuses={setCatalogExpertStatuses}
            onRarity={setCatalogRarityFilter}
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
            storagePath={deckLibraryStoragePath}
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
              actionCueAutoDismissMs={actionCueAutoDismissMs}
              actionCuesEnabled={actionCuesEnabled}
              automaticEffectCuesEnabled={automaticEffectCuesEnabled}
              autoDiscardEnabled={autoDiscardEnabled}
              autoEndTurnEnabled={autoEndTurnEnabled}
              topbarStickyEnabled={topbarStickyEnabled}
              audioEnabled={audioEnabled}
              audioVolume={audioVolume}
              cardTooltipHoverDelayMs={cardTooltipHoverDelayMs}
              cardTooltipMode={cardTooltipMode}
              cardTooltipScalePercent={cardTooltipScalePercent}
              cardHandScalePercent={cardHandScalePercent}
              cardArchiveScalePercent={cardArchiveScalePercent}
              cardZoneScalePercent={cardZoneScalePercent}
              cardBoardScalePercent={cardBoardScalePercent}
              cardRigScalePercent={cardRigScalePercent}
              cardDisplayMode={cardDisplayMode}
              colorScheme={colorScheme}
              cuePosition={cuePosition}
              aiPacingMode={localAiPacingMode}
              onActionCueAutoDismissMs={setActionCueAutoDismissMs}
              onActionCuesEnabled={setActionCuesEnabled}
              onAutomaticEffectCuesEnabled={setAutomaticEffectCuesEnabled}
              onAutoDiscardEnabled={setAutoDiscardEnabled}
              onAutoEndTurnEnabled={setAutoEndTurnEnabled}
              onTopbarStickyEnabled={setTopbarStickyEnabled}
              onAudioEnabled={updateAudioEnabled}
              onAudioVolume={setAudioVolume}
              onCardTooltipHoverDelayMs={setCardTooltipHoverDelayMs}
              onCardTooltipMode={setCardTooltipMode}
              onCardTooltipScalePercent={setCardTooltipScalePercent}
              onCardHandScalePercent={setCardHandScalePercent}
              onCardArchiveScalePercent={setCardArchiveScalePercent}
              onCardZoneScalePercent={setCardZoneScalePercent}
              onCardBoardScalePercent={setCardBoardScalePercent}
              onCardRigScalePercent={setCardRigScalePercent}
              onCardDisplayMode={setCardDisplayMode}
              onColorScheme={setColorScheme}
              onCuePosition={setCuePosition}
              onAiPacingMode={updateLocalAiPacingMode}
            />
          ) : null}
          </div>
        </div>
      </main>
      </CardTooltipSettingsContext.Provider>
      </CardScaleSettingsContext.Provider>
    );
  }

  return (
    <CardScaleSettingsContext.Provider
      value={{
        tooltipPercent: cardTooltipScalePercent,
        handPercent: cardHandScalePercent,
        archivePercent: cardArchiveScalePercent,
        zonePercent: cardZoneScalePercent,
        boardPercent: cardBoardScalePercent,
        rigPercent: cardRigScalePercent
      }}
    >
    <CardTooltipSettingsContext.Provider value={{ hoverOpenDelayMs: cardTooltipHoverDelayMs, mode: cardTooltipMode }}>
    <main className={`app activeMatch${topbarStickyEnabled ? "" : " topbarStickyDisabled"}`} data-theme={colorScheme}>
      <header className="topbar">
        <div className="topbarStatusGroup">
          <Brand />
          <div className="topbarMeta">
            <span className="topbarVersion">{APP_STATUS_LABEL}</span>
            <ConnectionBadge text={statusText} state={connection} />
          </div>
        </div>
        <ActiveMatchWorkspaceNav workspace={activeMatchWorkspace} onWorkspace={setActiveMatchWorkspace} />
        {activeMatchIsGame ? (
        <div className="toolbar">
          <button
            className={`button iconOnly topbarUndoToggle ${undoPanelOpen ? "active" : ""} ${payload.pendingUndo ? "attention" : ""}`}
            onClick={() => setUndoPanelOpen((open) => !open)}
            title={payload.pendingUndo?.needsResponse ? "Zurücknahme beantworten" : "Zurücknahme anfragen"}
            aria-label={payload.pendingUndo?.needsResponse ? "Zurücknahme beantworten" : "Zurücknahme anfragen"}
            aria-expanded={undoPanelOpen}
            aria-controls="undo-strip"
            type="button"
          >
            <RotateCcw size={16} />
          </button>
          {connection !== "online" ? (
            <button className="button" onClick={reconnect} disabled={!canReconnect} title="Wieder verbinden">
              <Cable size={16} />
              Wieder verbinden
            </button>
          ) : null}
          <button
            className={`button iconOnly matchDetailsToggle ${matchDetailsOpen ? "active" : ""}`}
            onClick={() => setMatchDetailsOpen((open) => !open)}
            title={matchDetailsOpen ? "Aktives Spiel: Status ausblenden" : "Aktives Spiel: Status einblenden"}
            aria-label={matchDetailsOpen ? "Aktives Spiel: Status ausblenden" : "Aktives Spiel: Status einblenden"}
            aria-expanded={matchDetailsOpen}
            aria-controls="match-details-strip"
            type="button"
          >
            {matchDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {canReturnToStart ? (
            <button className="button primary" onClick={leaveMatch} title="Zurück zum Startbildschirm" type="button">
              <Play size={16} />
              Startbildschirm
            </button>
          ) : null}
          {canForfeit ? (
            <button className="button dangerButton" onClick={requestForfeitMatch} title="Spiel aufgeben">
              <Flag size={16} />
              Aufgeben
            </button>
          ) : null}
          <button
            className={`button iconOnly rightRailHeaderToggle ${rightRailCollapsed ? "is-hidden" : "is-visible"}`}
            onClick={() => setRightRailCollapsed((current) => !current)}
            title={rightRailCollapsed ? "Rechten Bereich einblenden" : "Rechten Bereich ausblenden"}
            aria-label={rightRailCollapsed ? "Rechten Bereich einblenden" : "Rechten Bereich ausblenden"}
            aria-pressed={rightRailCollapsed}
            type="button"
          >
            {rightRailCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
          </button>
        </div>
        ) : null}
      </header>

      {matchDetailsOpen ? (
        <div className="matchStrip" id="match-details-strip" aria-label="Status zum aktiven Spiel">
          <span title={payload.matchStatus}><strong>Status</strong> {payload.matchStatus}</span>
          <span title={payload.matchId}><strong>Match</strong> {shortDiagnosticsHash(payload.matchId)}</span>
          <span><strong>Gegenüber</strong> {opponentDisplayName ?? sideLabel(payload.opponentStatus.side)}</span>
          {activeView.deckMetadata ? <span title={activeView.deckMetadata.own.deckName}><strong>Deck</strong> {activeView.deckMetadata.own.deckName} · geprüft</span> : null}
          <span><strong>Version</strong> {payload.matchVersion}</span>
          <span><strong>State</strong> {activeView.stateVersion}</span>
          {notice ? <span className="matchStripNotice">{notice}</span> : null}
        </div>
      ) : notice ? (
        <div className="matchNotice" role="status" aria-live="polite">
          {notice}
        </div>
      ) : null}
      <UndoPanel
        open={undoPanelOpen}
        pendingUndo={payload.pendingUndo}
        latestEventId={latestEventId}
        connection={connection}
        onRequest={requestUndo}
        onResolve={resolveUndo}
      />
      {activeMatchIsGame ? (
      <OpponentActionOverlay
        cue={currentActionCue}
        queued={actionCueQueue.length}
        position={cuePosition}
        cardDetailsById={catalogDetailsById}
        displayMode={cardDisplayMode}
        canAdvanceAi={Boolean(aiTurnPresentation?.canAdvanceAi && connection === "online")}
        onPosition={setCuePosition}
        onDismiss={() => setCurrentActionCue(null)}
        onAdvanceAi={() => {
          setCurrentActionCue(null);
          advanceAi(localAiPacingMode === "fast" ? "until_human" : "single_step");
        }}
      />
      ) : null}
      {activeMatchIsGame && activeView?.run ? (
        <RunTimelineOverlay
          view={activeView}
          legalActions={payload.legalActions}
          runActions={runActions}
          cardDetailsById={catalogDetailsById}
          actionDisabled={Boolean(payload.winner) || connection !== "online"}
          highlighted={activeCueHighlight?.kind === "run"}
          onAction={submitAction}
        />
      ) : null}
      {activeMatchIsGame ? (
      <ScoredAgendaOverlay
        side="corp"
        cards={scoreAreaCardsBySide("corp")}
        agendaPoints={agendaPointsBySide("corp")}
        agendaPointsToWin={effectiveAgendaTarget}
        open={Boolean(scoreAreaOverlays.corp)}
        position={scoreAreaOverlayPositions.corp}
        cardDisplayMode={cardDisplayMode}
        enrichCard={enrichCard}
        cardActionsFor={cardActionsFor}
        actionDisabled={Boolean(payload.winner) || connection !== "online"}
        selectedContext={selectedActionContext}
        onAction={submitAction}
        onFocus={focusCard}
        onActionContextSelect={selectActionCard}
        onClose={() => setScoreAreaOverlays((value) => ({ ...value, corp: false }))}
        onPosition={(position) => setScoreAreaOverlayPositions((value) => ({ ...value, corp: position }))}
      />
      ) : null}
      {activeMatchIsGame ? (
      <ScoredAgendaOverlay
        side="runner"
        cards={scoreAreaCardsBySide("runner")}
        agendaPoints={agendaPointsBySide("runner")}
        agendaPointsToWin={effectiveAgendaTarget}
        open={Boolean(scoreAreaOverlays.runner)}
        position={scoreAreaOverlayPositions.runner}
        cardDisplayMode={cardDisplayMode}
        enrichCard={enrichCard}
        cardActionsFor={cardActionsFor}
        actionDisabled={Boolean(payload.winner) || connection !== "online"}
        selectedContext={selectedActionContext}
        onAction={submitAction}
        onFocus={focusCard}
        onActionContextSelect={selectActionCard}
        onClose={() => setScoreAreaOverlays((value) => ({ ...value, runner: false }))}
        onPosition={(position) => setScoreAreaOverlayPositions((value) => ({ ...value, runner: position }))}
      />
      ) : null}

      {activeMatchIsGame ? (
      <div className={`main${rightRailCollapsed ? " rightRailCollapsed" : ""}`} data-testid="active-game">
        <aside className="column panel sidePanel">
          <OpponentPanel
            view={activeView}
            scoreAreaCards={scoreAreaCardsBySide(opponentSide(activeView.side))}
            scoreAreaOpen={scoreAreaOverlays[opponentSide(activeView.side)]}
            agendaPointsToWin={effectiveAgendaTarget}
            scoreAreaHighlighted={zoneHighlighted(activeCueHighlight, opponentSide(activeView.side), "scoreArea")}
            onToggleScoreArea={() => toggleScoreAreaOverlay(opponentSide(activeView.side))}
            connected={payload.opponentStatus.connected}
            {...(payload.opponentStatus.displayName ? { displayName: payload.opponentStatus.displayName } : {})}
          />
          {showAiPacingFallbackControls ? (
            <AiPacingControls
              presentation={aiTurnPresentation}
              mode={localAiPacingMode}
              connection={connection}
              onAdvance={() => advanceAi(localAiPacingMode === "fast" ? "until_human" : "single_step")}
            />
          ) : null}
          <LegalActionsPanel
            view={activeView}
            primaryActions={legalActionSplit.primaryActions}
            contextualActions={selectedPanelContextActions}
            selectedContext={selectedPanelContext}
            hasHiddenContextActions={legalActionSplit.contextualActions.length > 0 && selectedActionContext?.kind !== "card"}
            cardContextActive={selectedActionContext?.kind === "card"}
            hiddenContextHint={hiddenContextHint}
            actionCapacities={actionSlotCapacities}
            {...(aiTurnPresentation?.activeAiSide ? { activeAiSide: aiTurnPresentation.activeAiSide } : {})}
            disabled={Boolean(payload.winner) || connection !== "online"}
            highlighted={hasDecisionCue}
            selectedDiscardOptionIds={selectedDiscardOptionIds}
            onAction={submitAction}
            onChoiceOption={submitChoiceOption}
            onChoiceOptions={submitChoiceOptions}
            onDiscardChoiceToggle={toggleDiscardOption}
            enrichCard={enrichCard}
            connection={connection}
            onClearContext={() => setSelectedActionContext(null)}
          />
          <PlayerPanel
            view={activeView}
            title={`Du · ${sideLabel(activeView.side)}`}
            scoreAreaCards={scoreAreaCardsBySide(activeView.side)}
            scoreAreaOpen={scoreAreaOverlays[activeView.side]}
            agendaPointsToWin={effectiveAgendaTarget}
            scoreAreaHighlighted={zoneHighlighted(activeCueHighlight, activeView.side, "scoreArea")}
            onToggleScoreArea={() => toggleScoreAreaOverlay(activeView.side)}
          />
          <SpecialZonesStrip view={activeView} cardDetailsById={catalogDetailsById} displayMode={cardDisplayMode} compact onFocus={focusCard} />
        </aside>

        <section className="board boardPanel" data-testid="active-board">
          {activeView.side === "corp" ? (
            <section className="opponentRunnerBoardStrip" aria-label="Runner-Bereich">
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
              <RunnerOpponentZonesStrip
                view={activeView}
                cardDetailsById={catalogDetailsById}
                displayMode={cardDisplayMode}
                selectedContext={selectedActionContext}
                contextualActions={legalActionSplit.contextualActions}
                actionDisabled={Boolean(payload.winner) || connection !== "online"}
                highlightedZone={activeCueHighlight}
                onFocus={focusCard}
                onActionContext={selectActionCard}
                onAction={submitAction}
              />
            </section>
          ) : (
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
          )}
          {payload.winner ? (
            <div className="runBar">
              <Sparkles size={18} />
              <span className="winner">
                {payload.winner === "runner" ? "Runner" : payload.winner === "corp" ? "Korp" : "Draw"} gewinnt.
              </span>
            </div>
          ) : null}
          <div className="serverGrid">
            {serverBoardRows(activeView.servers, activeView.side).map((row) =>
              row.servers.length > 0 ? (
                <div className={`serverRow ${row.kind}`} key={row.kind} data-testid={`server-row-${row.kind}`}>
                  {row.servers.map((server) => {
                    const countLabel = centralServerCountLabel(activeView, server.id);
                    const runAction = runActionForServer(server.id);
                    const lanes = serverLanesForSide(activeView.side, server);
                    const isOwnCorpHq = activeView.side === "corp" && server.id === "hq";
                    const renderLaneCards = (lane: { kind: "ice" | "root"; label: "ICE" | "Root"; cards: VisibleCard[] }) => {
                      if (server.id === "archives" && lane.kind === "root") {
                        return (
                          <ArchivesDualStackLane
                            viewerSide={activeView.side}
                            visibleCards={lane.cards}
                            totalArchivesCount={activeView.side === "runner" ? (activeView.opponent.discardCount ?? lane.cards.length) : lane.cards.length}
                            collapsed={archivesCollapsed}
                            displayMode={cardDisplayMode}
                            selectedContext={selectedActionContext}
                            actionDisabled={Boolean(payload.winner) || connection !== "online"}
                            cardActionsFor={cardActionsFor}
                            onAction={submitAction}
                            onFocus={focusCard}
                            onActionContextSelect={selectActionCard}
                            enrichCard={enrichCard}
                          />
                        );
                      }
                      if (lane.cards.length === 0) {
                        return (
                          <span className="laneEmptyPlaceholder" aria-label={`${lane.label} leer`}>
                            Leer
                          </span>
                        );
                      }
                      return lane.cards.map((card, index) => {
                        const displayCard = enrichCard(card);
                        return (
                          <CardView
                            key={card.instanceId}
                            card={displayCard}
                            compact
                            displayMode={cardDisplayMode}
                            hiddenSide="corp"
                            installedCorpCard={showInstalledCorpState(server.id, lane.kind)}
                            selected={selectedActionContext?.kind === "card" && selectedActionContext.id === card.instanceId}
                            actions={cardActionsFor(card)}
                            actionDisabled={Boolean(payload.winner) || connection !== "online"}
                            {...(lane.kind === "ice" ? { slotClassName: iceStackSlotClass(card) } : {})}
                            {...(lane.kind === "ice" ? { positionBadge: String(index + 1) } : {})}
                            runPositionActive={lane.kind === "ice" && activeRunIceId === card.instanceId}
                            {...(lane.kind === "ice" && activeRunIceId === card.instanceId
                              ? { runPositionLabel: runPositionStatusLabel(activeView) ?? "Aktuelles ICE" }
                              : {})}
                            onAction={submitAction}
                            onFocus={focusCard}
                            onActionContextSelect={selectActionCard}
                          />
                        );
                      });
                    };
                    return (
                      <article
                        className={`server ${isOwnCorpHq ? "corpHqServer" : ""} ${serverHighlighted(activeCueHighlight, server.id) ? "cueHighlight" : ""} ${activeRunTargetIds.includes(server.id) ? "activeRunTarget" : ""} ${selectedActionContext?.kind === "server" && selectedActionContext.id === server.id ? "selectedActionSource" : ""}`}
                        key={server.id}
                        data-testid="server"
                        data-server-id={server.id}
                      >
                        <div className="serverLayout">
                          <div className="serverLead">
                            <div className="serverLeadTop">
                              <button className={`serverContextButton serverContextSideButton rigGroupSideLabel ${zoneSideClass("corp")}`} type="button" onClick={() => setSelectedActionContext({ kind: "server", id: server.id, label: serverDisplayLabel(server.id) })}>
                                {serverDisplayLabel(server.id)}
                              </button>
                              {countLabel !== null ? <span className={`serverCount serverCountSideLabel ${zoneSideClass("corp")}`}>{countLabel}</span> : null}
                              {server.id === "archives" ? (
                                <ZoneCollapseButton
                                  side="corp"
                                  label="Archive"
                                  collapsed={archivesCollapsed}
                                  onToggle={() => setArchivesCollapsed((current) => !current)}
                                />
                              ) : null}
                            </div>
                            <ZoneIdentityIcon side="corp" kind={serverZoneIdentityIconKind(server.id)} label={serverDisplayLabel(server.id)} />
                            {runAction ? (
                              <button
                                className="serverRunButton serverRunButtonSide serverRunButtonCorner"
                                type="button"
                                onClick={() => submitAction(runAction)}
                                disabled={Boolean(payload.winner) || connection !== "online"}
                                aria-label={`${actionButtonLabel(runAction)} starten`}
                                data-tooltip={actionButtonLabel(runAction)}
                                data-testid="server-run-action"
                                data-server-id={server.id}
                              >
                                <span className="serverRunGlyph" aria-hidden="true">
                                  <RunIcon size={14} />
                                </span>
                                <span className="serverRunActionIcon" aria-hidden="true">
                                  <span className="costActionIcon" />
                                </span>
                              </button>
                            ) : null}
                          </div>
                          <div className="serverBody">
                            <div className={isOwnCorpHq ? "corpHqComposite" : "pairedServerLanes"}>
                              {isOwnCorpHq ? (
                                <>
                                  <div className={`corpHqHandPanel ${zoneHighlighted(activeCueHighlight, activeView.side, "hq") ? "cueHighlightSoft" : ""}`}>
                                    <div className="corpHqHandHead">
                                      <span>Handkarten</span>
                                    </div>
                                    <div className="cards fixedZoneCards corpHqHandCards" style={handCardsStyle}>
                                      {activeView.own.gripOrHq.map((card) => {
                                        const displayCard = enrichCard(card);
                                        const discardOption = discardOptionForCard(card);
                                        return (
                                          <CardView
                                            key={card.instanceId}
                                            card={displayCard}
                                            displayMode={cardDisplayMode}
                                            hiddenSide={activeView.side}
                                            selected={selectedActionContext?.kind === "card" && selectedActionContext.id === card.instanceId}
                                            actions={cardActionsFor(card)}
                                            actionDisabled={Boolean(payload.winner) || connection !== "online"}
                                            {...(discardOption
                                              ? {
                                                  discardShortcut: {
                                                    selected: selectedDiscardOptionIdSet.has(discardOption.id),
                                                    disabled: Boolean(payload.winner) || connection !== "online",
                                                    onToggle: () => toggleDiscardOption(discardOption.id)
                                                  }
                                                }
                                              : {})}
                                            onAction={submitAction}
                                            onFocus={focusCard}
                                            onActionContextSelect={selectActionCard}
                                          />
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <span className="corpHqConnector" aria-hidden="true" />
                                  <div className="pairedServerLanes corpHqServerLanes">
                                    {lanes.map((lane) => (
                                      <div className="serverLaneGroup pairedServerLane" key={lane.label}>
                                        <div className="laneLabel">
                                          <span>{lane.label}</span>
                                        </div>
                                        <div className={`lane ${lane.kind === "ice" ? "iceLane" : "rootLane"}`} style={boardLaneStyle}>
                                          {renderLaneCards(lane)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                lanes.map((lane) => (
                                  <div className="serverLaneGroup pairedServerLane" key={lane.label}>
                                    <div className="laneLabel">
                                      <span>{lane.label}</span>
                                    </div>
                                    <div className={`lane ${lane.kind === "ice" ? "iceLane" : "rootLane"}`} style={boardLaneStyle}>
                                      {renderLaneCards(lane)}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null
            )}
          </div>
          {activeView.own.rig ? (
            <section className="section panel boardSection rigBoardSection">
              <div className={`rigSectionLayout ${zoneHighlighted(activeCueHighlight, activeView.side, "rig") ? "cueHighlightSoft" : ""}`}>
                <div className="rigSectionLead">
                  <ZoneIdentityIcon side="runner" kind="rig" label="Rig" className="rigSectionIcon" />
                  <div className="sideZoneLeadTop">
                    <h2 className={`rigSectionTitle rigGroupSideLabel ${zoneSideClass("runner")}`}>Rig</h2>
                  </div>
                </div>
                {ownRigGroups.length > 0 ? (
                  <div className="rigGroups rigGroupsHorizontal rigGroupsTrack">
                    {ownRigGroups.map((group) => (
                      <div className="rigGroup rigGroupHorizontal" key={group.key} style={ownRigCardsStyle}>
                        <div className="rigGroupLead">
                          <h3 className={`rigGroupSideLabel ${zoneSideClass("runner")}`}>{group.label}</h3>
                          {group.key === "program" ? (
                            <span className="zoneLimitBadge rigMemoryBadge" aria-label={`MU ${activeView.own.memoryUsed ?? 0} von ${activeView.own.memoryLimit ?? 0}`}>
                              MU <strong>{activeView.own.memoryUsed ?? 0}/{activeView.own.memoryLimit ?? 0}</strong>
                            </span>
                          ) : null}
                        </div>
                        <div className="cards rigGroupCards rigGroupCardsFull">
                          {group.cards.map((card) => {
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="meta">Keine installierten Runner-Karten.</p>
                )}
              </div>
            </section>
          ) : null}
          <section className="section panel boardSection zoneBoardSection">
            {activeView.side === "runner" ? (
              <div className="runnerGripHeapLayout">
                <SideZoneFrame side="runner" label="Grip" countLabel={formatHandLimitCount(activeView.own.gripOrHq.length, activeView.own.maxHandSize)} iconKind="grip" highlighted={zoneHighlighted(activeCueHighlight, activeView.side, "grip")} className="runnerGripZone">
                  <div className="cards fixedZoneCards" style={handCardsStyle}>
                    {activeView.own.gripOrHq.map((card) => {
                      const displayCard = enrichCard(card);
                      const discardOption = discardOptionForCard(card);
                      return (
                        <CardView
                          key={card.instanceId}
                          card={displayCard}
                          displayMode={cardDisplayMode}
                          hiddenSide={activeView.side}
                          selected={selectedActionContext?.kind === "card" && selectedActionContext.id === card.instanceId}
                          actions={cardActionsFor(card)}
                          actionDisabled={Boolean(payload.winner) || connection !== "online"}
                          {...(discardOption
                            ? {
                                discardShortcut: {
                                  selected: selectedDiscardOptionIdSet.has(discardOption.id),
                                  disabled: Boolean(payload.winner) || connection !== "online",
                                  onToggle: () => toggleDiscardOption(discardOption.id)
                                }
                              }
                            : {})}
                          onAction={submitAction}
                          onFocus={focusCard}
                          onActionContextSelect={selectActionCard}
                        />
                      );
                    })}
                  </div>
                </SideZoneFrame>
                <SideZoneFrame
                  side="runner"
                  label="Heap"
                  countLabel={formatCardCount(activeView.own.heapOrArchives.length)}
                  iconKind="heap"
                  highlighted={zoneHighlighted(activeCueHighlight, activeView.side, "heap")}
                  className="runnerHeapZone"
                  collapsed={runnerHeapCollapsed}
                  onToggleCollapse={() => setRunnerHeapCollapsed((current) => !current)}
                  collapseLabel="Heap"
                >
                  {activeView.own.heapOrArchives.length > 0 ? (
                    <div className="runnerHeapOverlapRow" style={zoneCardsStyle}>
                      {activeView.own.heapOrArchives.slice(0, RUNNER_HEAP_PREVIEW_LIMIT).map((card) => {
                        const displayCard = enrichCard(card);
                        return (
                          <CardView
                            key={card.instanceId}
                            card={displayCard}
                            compact
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
                      {activeView.own.heapOrArchives.length > RUNNER_HEAP_PREVIEW_LIMIT ? <span className="archivesOverflowBadge">+{activeView.own.heapOrArchives.length - RUNNER_HEAP_PREVIEW_LIMIT}</span> : null}
                    </div>
                  ) : (
                    <p className="archivesPileEmpty" style={zoneCardsStyle}>Keine Karten im Heap.</p>
                  )}
                </SideZoneFrame>
                <SideZoneFrame side="runner" label="Stack" countLabel={formatCardCount(activeView.own.stackOrRdCount)} iconKind="stack" highlighted={zoneHighlighted(activeCueHighlight, activeView.side, "stack")} className="runnerStackZone">
                  <div className="runnerStackPreview" style={zoneCardsStyle} aria-label={`Stack ${formatCardCount(activeView.own.stackOrRdCount)}`}>
                    {activeView.own.stackOrRdCount > 0 ? (
                      <div className="runnerStackBack" aria-hidden="true">
                        <span />
                      </div>
                    ) : (
                      <p className="archivesPileEmpty">Keine Karten im Stack.</p>
                    )}
                  </div>
                </SideZoneFrame>
              </div>
            ) : (
              null
            )}
          </section>
        </section>

        <aside className="log panel rightRail">
          {!rightRailCollapsed ? (
            <>
              <CardPreviewPanel
                card={enrichedPreviewCard}
                displayMode={cardDisplayMode}
                onDisplayMode={setCardDisplayMode}
                collapsed={cardPreviewCollapsed}
                onCollapsed={updateCardPreviewCollapsed}
                {...(previewHiddenSide ? { hiddenSide: previewHiddenSide } : {})}
              />
              <ChroniclePanel
                events={payload.eventTail}
                turnContextEvents={payload.playerView.publicEvents}
                side={payload.side}
                cardDetailsById={catalogDetailsById}
                displayMode={cardDisplayMode}
                onFocusCard={focusCard}
              />
              <section className="section">
                <button className="button wide" onClick={() => setDiagnosticsOpen((current) => !current)}>
                  <PanelRightOpen size={15} />
                  Diagnostics
                </button>
              </section>
              <DiagnosticsDrawer open={diagnosticsOpen} payload={payload} connection={connection} />
            </>
          ) : null}
        </aside>
      </div>
      ) : (
        <div className={`activeMatchWorkspace ${activeMatchWorkspace === "decks" ? "deckWorkspaceView" : ""}`} data-testid={`active-match-${activeMatchWorkspace}`}>
          {activeMatchWorkspace === "catalog" ? (
            <CatalogPanel
              cards={filteredCatalogCards}
              detail={catalogDetail}
              filters={catalogFilters}
              search={catalogSearch}
              side={catalogSide}
              status={catalogStatus}
              summary={catalogSummary}
              selectedId={selectedCatalogId}
              showExpertStatuses={catalogExpertStatuses}
              rarityCounts={catalogRarityCounts}
              rarityFilter={catalogRarityFilter}
              typeCounts={catalogTypeCounts}
              typeFilters={catalogTypeFilters}
              onSearch={setCatalogSearch}
              onSide={setCatalogSide}
              onStatus={setCatalogStatus}
              onSelect={setSelectedCatalogId}
              onToggleExpertStatuses={setCatalogExpertStatuses}
              onRarity={setCatalogRarityFilter}
              onTypeFilter={(key, selected) => setCatalogTypeFilters((current) => ({ ...current, [key]: selected }))}
              onSelectAllTypes={() => setCatalogTypeFilters({ ...ALL_CATALOG_TYPE_FILTERS })}
              onClearTypeFilters={() => setCatalogTypeFilters({ ...NO_CATALOG_TYPE_FILTERS })}
            />
          ) : null}
          {activeMatchWorkspace === "decks" ? (
            <DeckEditorPanel
              localDecks={localDecks}
              selectedDeck={selectedLocalDeck}
              selectedDeckDirty={selectedDeckDirty}
              storagePath={deckLibraryStoragePath}
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
              onUseForMatch={useValidatedDeckForNextMatch}
              useForMatchLabel="Für nächsten Start vormerken"
              onExport={exportSelectedDeck}
              onImportText={setDeckImportText}
              onImport={importLocalDeck}
            />
          ) : null}
          {activeMatchWorkspace === "options" ? (
            <OptionsPanel
              actionCueAutoDismissMs={actionCueAutoDismissMs}
              actionCuesEnabled={actionCuesEnabled}
              automaticEffectCuesEnabled={automaticEffectCuesEnabled}
              autoDiscardEnabled={autoDiscardEnabled}
              autoEndTurnEnabled={autoEndTurnEnabled}
              topbarStickyEnabled={topbarStickyEnabled}
              audioEnabled={audioEnabled}
              audioVolume={audioVolume}
              cardTooltipHoverDelayMs={cardTooltipHoverDelayMs}
              cardTooltipMode={cardTooltipMode}
              cardTooltipScalePercent={cardTooltipScalePercent}
              cardHandScalePercent={cardHandScalePercent}
              cardArchiveScalePercent={cardArchiveScalePercent}
              cardZoneScalePercent={cardZoneScalePercent}
              cardBoardScalePercent={cardBoardScalePercent}
              cardRigScalePercent={cardRigScalePercent}
              cardDisplayMode={cardDisplayMode}
              colorScheme={colorScheme}
              cuePosition={cuePosition}
              aiPacingMode={localAiPacingMode}
              session={session}
              onActionCueAutoDismissMs={setActionCueAutoDismissMs}
              onActionCuesEnabled={setActionCuesEnabled}
              onAutomaticEffectCuesEnabled={setAutomaticEffectCuesEnabled}
              onAutoDiscardEnabled={setAutoDiscardEnabled}
              onAutoEndTurnEnabled={setAutoEndTurnEnabled}
              onTopbarStickyEnabled={setTopbarStickyEnabled}
              onAudioEnabled={updateAudioEnabled}
              onAudioVolume={setAudioVolume}
              onCardTooltipHoverDelayMs={setCardTooltipHoverDelayMs}
              onCardTooltipMode={setCardTooltipMode}
              onCardTooltipScalePercent={setCardTooltipScalePercent}
              onCardHandScalePercent={setCardHandScalePercent}
              onCardArchiveScalePercent={setCardArchiveScalePercent}
              onCardZoneScalePercent={setCardZoneScalePercent}
              onCardBoardScalePercent={setCardBoardScalePercent}
              onCardRigScalePercent={setCardRigScalePercent}
              onCardDisplayMode={setCardDisplayMode}
              onColorScheme={setColorScheme}
              onCuePosition={setCuePosition}
              onAiPacingMode={updateLocalAiPacingMode}
              onCopyReconnectLink={copyReconnectLink}
              onDiscardLocalSession={discardLocalActiveSession}
            />
          ) : null}
        </div>
      )}
      {activeMatchIsGame && showResultModal && resultSummary ? (
        <GameOverModal
          result={resultSummary}
          side={session.side}
          onDismiss={() => {
            if (resultKey) setDismissedResultKey(resultKey);
          }}
          onNewMatch={leaveMatch}
          nextSeriesPending={seriesTransitioning}
          retentionProtected={payload?.retentionProtected === true}
          onRetentionProtection={setRetentionProtection}
          {...(opponentDisplayName ? { opponentName: opponentDisplayName } : {})}
          {...(resultSummary.series?.nextAvailable ? { onNextSeriesGame: startNextSeriesGame } : {})}
        />
      ) : null}
      {activeMatchIsGame && showAccessReveal && accessReveal ? (
        <AccessRevealModal
          reveal={accessReveal}
          displayMode={cardDisplayMode}
          disabled={Boolean(payload.winner) || connection !== "online"}
          onAction={submitAction}
          onDismiss={() => setDismissedAccessEventId(accessReveal.eventId)}
        />
      ) : null}
      {optionsDialogOpen ? (
        <OptionsDialog onDismiss={() => setOptionsDialogOpen(false)}>
          <OptionsPanel
            actionCueAutoDismissMs={actionCueAutoDismissMs}
            actionCuesEnabled={actionCuesEnabled}
            automaticEffectCuesEnabled={automaticEffectCuesEnabled}
            autoDiscardEnabled={autoDiscardEnabled}
            autoEndTurnEnabled={autoEndTurnEnabled}
            topbarStickyEnabled={topbarStickyEnabled}
            audioEnabled={audioEnabled}
            audioVolume={audioVolume}
            cardTooltipHoverDelayMs={cardTooltipHoverDelayMs}
            cardTooltipMode={cardTooltipMode}
            cardTooltipScalePercent={cardTooltipScalePercent}
            cardHandScalePercent={cardHandScalePercent}
            cardArchiveScalePercent={cardArchiveScalePercent}
            cardZoneScalePercent={cardZoneScalePercent}
            cardBoardScalePercent={cardBoardScalePercent}
            cardRigScalePercent={cardRigScalePercent}
            cardDisplayMode={cardDisplayMode}
            colorScheme={colorScheme}
            cuePosition={cuePosition}
            aiPacingMode={localAiPacingMode}
            modal
            session={session}
            onActionCueAutoDismissMs={setActionCueAutoDismissMs}
            onActionCuesEnabled={setActionCuesEnabled}
            onAutomaticEffectCuesEnabled={setAutomaticEffectCuesEnabled}
            onAutoDiscardEnabled={setAutoDiscardEnabled}
            onAutoEndTurnEnabled={setAutoEndTurnEnabled}
            onTopbarStickyEnabled={setTopbarStickyEnabled}
            onAudioEnabled={updateAudioEnabled}
            onAudioVolume={setAudioVolume}
            onCardTooltipHoverDelayMs={setCardTooltipHoverDelayMs}
            onCardTooltipMode={setCardTooltipMode}
            onCardTooltipScalePercent={setCardTooltipScalePercent}
            onCardHandScalePercent={setCardHandScalePercent}
            onCardArchiveScalePercent={setCardArchiveScalePercent}
            onCardZoneScalePercent={setCardZoneScalePercent}
            onCardBoardScalePercent={setCardBoardScalePercent}
            onCardRigScalePercent={setCardRigScalePercent}
            onCardDisplayMode={setCardDisplayMode}
            onColorScheme={setColorScheme}
            onCuePosition={setCuePosition}
            onAiPacingMode={updateLocalAiPacingMode}
            onCopyReconnectLink={copyReconnectLink}
            onDiscardLocalSession={discardLocalActiveSession}
          />
        </OptionsDialog>
      ) : null}
      {confirmationDialog ? (
        <ConfirmationDialog
          request={confirmationDialog}
          onCancel={() => setConfirmationDialog(null)}
          onConfirm={() => {
            const request = confirmationDialog;
            setConfirmationDialog(null);
            void request.onConfirm();
          }}
        />
      ) : null}
    </main>
    </CardTooltipSettingsContext.Provider>
    </CardScaleSettingsContext.Provider>
  );
}

function publicEventsAfter(events: PublicGameEvent[], lastPresentedEventId: string | null): PublicGameEvent[] {
  if (!lastPresentedEventId) return events;
  const index = events.findIndex((event) => event.eventId === lastPresentedEventId);
  return index >= 0 ? events.slice(index + 1) : events;
}

function eventActionType(event: PublicGameEvent): string {
  return payloadString(event.publicPayload, "actionType") ?? event.type;
}

function localActionSoundKey(side: Side, stateVersion: number, actionType: string): string {
  return `${side}:${stateVersion}:${actionType}`;
}

function localActionSoundKind(action: LegalAction): ActionSoundKind | undefined {
  if (action.type === "end_turn") return undefined;
  const visibility = action.side === "corp" && (action.type === "install_card" || action.type === "advance_card") ? "redacted" : "public";
  return actionSoundForActionType(action.type, visibility) ?? "choice";
}

function Brand() {
  return (
    <div className="brand">
      <div className="mark">
        <img className="brandLogo" src={APP_ICON_SRC} alt="" aria-hidden="true" />
      </div>
      <div className="brandLockup">
        <img className="brandWordmark" src={APP_WORDMARK_SRC} alt="" aria-hidden="true" />
        <h1 className="srOnly">{APP_NAME}</h1>
      </div>
    </div>
  );
}

function ActiveMatchWorkspaceNav({
  workspace,
  onWorkspace
}: {
  workspace: ActiveMatchWorkspace;
  onWorkspace(workspace: ActiveMatchWorkspace): void;
}) {
  const items: Array<{ id: ActiveMatchWorkspace; label: string; title: string; icon: ReactNode }> =
    workspace === "game"
      ? [
          { id: "catalog", label: "Katalog", title: "Katalog öffnen", icon: <ListFilter size={16} /> },
          { id: "decks", label: "Decks", title: "Decks öffnen", icon: <Layers3 size={16} /> },
          { id: "options", label: "Optionen", title: "Optionen öffnen", icon: <SlidersHorizontal size={16} /> }
        ]
      : [
          { id: "game", label: "Aktives Spiel", title: "Zurück zum aktiven Spiel", icon: <Play size={16} /> },
          { id: "catalog", label: "Katalog", title: "Katalog öffnen", icon: <ListFilter size={16} /> },
          { id: "decks", label: "Decks", title: "Decks öffnen", icon: <Layers3 size={16} /> },
          { id: "options", label: "Optionen", title: "Optionen öffnen", icon: <SlidersHorizontal size={16} /> }
        ];

  return (
    <nav className={`activeWorkspaceNav ${workspace === "game" ? "compact" : ""}`} aria-label="Aktives Spiel und Werkzeuge">
      {items.map((item) => (
        <button
          className={`button activeWorkspaceButton ${workspace === item.id ? "active" : ""} ${item.id === "game" && workspace !== "game" ? "runningGame" : ""}`}
          key={item.id}
          onClick={() => onWorkspace(item.id)}
          type="button"
          title={item.title}
          aria-label={item.title}
          aria-current={workspace === item.id ? "page" : undefined}
        >
          {item.icon}
          <span className="workspaceLabel">{item.label}</span>
        </button>
      ))}
    </nav>
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
  const canUseReadiness = Boolean(start && (lobby.matchStatus === "ready_check" || lobby.matchStatus === "countdown"));
  const showJoinLink = Boolean(joinUrl && !terminal && (lobby.pendingDeckHandshake || lobby.matchStatus === "pending"));
  const opponentName = lobby.opponentStatus.displayName ?? (opponent?.connected ? opponent.displayName : "Wartet auf Gegenüber");
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now());
  const countdownValue = useMemo(() => {
    if (!countdownActive || !start?.countdownEndsAt) return null;
    const remainingMs = new Date(start.countdownEndsAt).getTime() - countdownNowMs;
    if (remainingMs <= 0) return null;
    return Math.ceil(remainingMs / 1000);
  }, [countdownActive, start?.countdownEndsAt, countdownNowMs]);
  useEffect(() => {
    const element = chatMessagesRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [start?.chatMessages.length]);
  useEffect(() => {
    if (!countdownActive || !start?.countdownEndsAt) return;
    setCountdownNowMs(Date.now());
    const handle = window.setInterval(() => setCountdownNowMs(Date.now()), 120);
    return () => window.clearInterval(handle);
  }, [countdownActive, start?.countdownEndsAt]);
  return (
    <section className="startLobbyPanel" data-testid="start-lobby">
      {countdownValue ? (
        <div className="lobbyCountdownOverlay" aria-live="polite" aria-atomic="true">
          <span className="lobbyCountdownDigit" key={countdownValue}>
            {countdownValue}
          </span>
        </div>
      ) : null}
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
              <button className="button primary" onClick={onRecreate} type="button" data-testid="recreate-match">
                <CopyPlus size={15} />
                Neu erstellen
              </button>
              <button className="button subtle" onClick={onDiscardLocal} type="button" data-testid="discard-local-session">
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
      {showJoinLink ? (
        <div className="joinLinkRow">
          <input value={joinUrl} readOnly aria-label="Join-Link" data-testid="join-link" />
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
          {canUseReadiness ? (
            <>
              <div className="readinessSummary">
                <span>{selfReady ? "Du bist bereit." : "Du bist noch nicht bereit."}</span>
                <span>{opponentReady ? "Gegenüber ist bereit." : "Gegenüber ist noch nicht bereit."}</span>
              </div>
              <div className="lobbyActions">
                <button className={`button lobbyReadyToggle${selfReady ? " is-ready" : ""}`} onClick={() => onReady(!selfReady)} type="button" disabled={connection !== "online"} data-testid="ready-toggle">
                  {selfReady ? "Bereitschaft zurücknehmen" : "Ich bin bereit"}
                </button>
                {countdownActive ? (
                  <button className="button" onClick={onCancel} type="button">
                    <X size={15} />
                    Countdown abbrechen
                  </button>
                ) : null}
                <button className="button dangerButton" onClick={isHost ? onCancelMatch : onLeaveMatch} type="button" disabled={connection !== "online"} data-testid={isHost ? "cancel-match" : "leave-lobby"}>
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
            <div className="lobbyActions">
              <span className="countdownText">{lobby.pendingDeckHandshake?.message ?? "Gegenüber kann jetzt über den Join-Link beitreten."}</span>
              <button className="button dangerButton" onClick={isHost ? onCancelMatch : onLeaveMatch} type="button" disabled={connection !== "online"} data-testid={isHost ? "cancel-match" : "leave-lobby"}>
                <X size={15} />
                {isHost ? "Match abbrechen" : "Lobby verlassen"}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="muted">{lobby.pendingDeckHandshake?.message ?? "Die Lobby wird vorbereitet."}</p>
          <div className="lobbyActions">
            <button className="button dangerButton" onClick={isHost ? onCancelMatch : onLeaveMatch} type="button" data-testid={isHost ? "cancel-match" : "leave-lobby"}>
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
            <p>{reveal.description}</p>
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
                  {action.type === "trash_accessed_card" || action.type === "trash_resource" ? <Trash2 size={15} /> : <AgendaIcon size={15} />}
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
  if (action.type === "access_card") return "Nächste Karte";
  if (action.type === "steal_agenda") return "Agenda stehlen";
  if (action.type === "trash_accessed_card") return "Trashen";
  if (action.type === "trash_resource") return "Resource trashen";
  if (action.type === "decline_trash") return normalizeVisibleTerms(action.label);
  return normalizeVisibleTerms(action.label);
}

function GameOverModal({
  result,
  side,
  onDismiss,
  onNewMatch,
  onNextSeriesGame,
  opponentName,
  retentionProtected,
  onRetentionProtection,
  nextSeriesPending = false
}: {
  result: GameResultSummary;
  side: Side;
  onDismiss(): void;
  onNewMatch(): void;
  onNextSeriesGame?: () => void;
  opponentName?: string;
  retentionProtected: boolean;
  onRetentionProtection(protectedValue: boolean): void;
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
          <Stat label="Agenda" value={`${result.runnerAgendaPoints} / ${result.agendaPointsToWin}`} unit="Runner" icon={<AgendaIcon size={14} />} />
          <Stat label="Agenda" value={`${result.corpAgendaPoints} / ${result.agendaPointsToWin}`} unit="Korp" icon={<AgendaIcon size={14} />} />
          <Stat value={result.agendaPointsToWin} unit="Zielwert" />
          <Stat value={result.actionCount} unit="Aktionen" />
          <Stat value={result.runCount} unit="Runs" />
          <Stat value={result.successfulRunCount} unit="Zugriffe" />
          <Stat value={result.stolenAgendaCount} unit="Gestohlen" />
          <Stat value={result.scoredAgendaCount} unit="Gescored" />
        </div>
        {result.series ? (
          <div className="seriesStrip">
            <div>
              <span>Serienspiel {result.series.gameNumber}/{result.series.gamesPlanned}</span>
              <small>{seriesText}</small>
            </div>
            <div className="seriesScore">
              <span>Matchpunkte Du {result.series.viewerMatchPoints}</span>
              <span>Matchpunkte Gegenseite {result.series.opponentMatchPoints}</span>
              <span>Siege Du {result.series.viewerWins}</span>
              <span>Siege Gegenseite {result.series.opponentWins}</span>
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
            <button className="button" onClick={() => onRetentionProtection(!retentionProtected)}>
              <Save size={15} />
              {retentionProtected ? "Nicht mehr aufheben" : "Spiel aufheben"}
            </button>
            <button className="button" onClick={onDismiss}>
              Board ansehen
            </button>
            {onNextSeriesGame ? (
              <button className="button primary" onClick={onNextSeriesGame} disabled={nextSeriesPending}>
                {nextSeriesPending ? "Erstelle..." : "Nächstes Serienspiel"}
              </button>
            ) : null}
            <button className="button primary" onClick={onNewMatch}>
              Zurück zum Startbildschirm
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ConfirmationDialog({
  request,
  onCancel,
  onConfirm
}: {
  request: ConfirmationDialogRequest;
  onCancel(): void;
  onConfirm(): void;
}) {
  const tone = request.tone ?? "neutral";
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className={`confirmationDialogOverlay ${tone}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-message"
    >
      <div className="confirmationDialogBackdrop" aria-hidden="true" onClick={onCancel} />
      <section className="confirmationDialogPanel">
        <div className="confirmationDialogHeader">
          <span className="confirmationDialogIcon" aria-hidden="true">
            {tone === "danger" ? <AlertTriangle size={18} /> : <Shield size={18} />}
          </span>
          <div>
            <p className="eyebrow">Bestätigung</p>
            <h2 id="confirmation-dialog-title">{request.title}</h2>
          </div>
        </div>
        <p id="confirmation-dialog-message">{request.message}</p>
        <div className="confirmationDialogActions">
          <button ref={cancelButtonRef} className="button" onClick={onCancel} type="button">
            <X size={15} />
            {request.cancelLabel ?? "Abbrechen"}
          </button>
          <button className={`button primary ${tone === "danger" ? "dangerButton" : ""}`} onClick={onConfirm} type="button">
            {tone === "danger" ? <AlertTriangle size={15} /> : <Check size={15} />}
            {request.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function matchFormatLabel(format: MatchFormat): string {
  if (format === "two_game_side_swap") return "Private Matchserie";
  return "Regelmatch";
}

function resultReasonLabel(reason: GameResultSummary["reason"]): string {
  if (reason === "agenda_points") return "Das Agenda-Ziel wurde erreicht.";
  if (reason === "corp_deck_empty") return "Die Korp konnte keine Karte mehr ziehen.";
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

function shouldForgetRecoveryStatus(status: MatchStatus): boolean {
  return status === "cancelled" || status === "abandoned" || status === "finished" || status === "forfeited";
}

function seriesStatusText(series: SeriesResultSummary): string {
  if (series.status === "finished") {
    if (series.viewerSeriesOutcome === "won") return series.seriesDecision === "match_points" ? "Du hast die Matchserie nach Matchpunkten gewonnen." : "Du hast die Matchserie gewonnen.";
    if (series.viewerSeriesOutcome === "lost") return series.seriesDecision === "match_points" ? "Du hast die Matchserie nach Matchpunkten verloren." : "Du hast die Matchserie verloren.";
    return "Die Matchserie endet unentschieden.";
  }
  return series.nextAvailable ? "Bereit für das nächste Spiel mit Seitenwechsel." : "Nächstes Serienspiel wurde bereits erstellt.";
}

function OptionsPanel({
  actionCueAutoDismissMs,
  actionCuesEnabled,
  automaticEffectCuesEnabled,
  autoDiscardEnabled,
  autoEndTurnEnabled,
  topbarStickyEnabled,
  audioEnabled,
  audioVolume,
  cardTooltipHoverDelayMs,
  cardTooltipMode,
  cardTooltipScalePercent,
  cardHandScalePercent,
  cardArchiveScalePercent,
  cardZoneScalePercent,
  cardBoardScalePercent,
  cardRigScalePercent,
  cardDisplayMode,
  colorScheme,
  cuePosition,
  aiPacingMode,
  modal = false,
  session = null,
  onActionCueAutoDismissMs,
  onActionCuesEnabled,
  onAutomaticEffectCuesEnabled,
  onAutoDiscardEnabled,
  onAutoEndTurnEnabled,
  onTopbarStickyEnabled,
  onAudioEnabled,
  onAudioVolume,
  onCardTooltipHoverDelayMs,
  onCardTooltipMode,
  onCardTooltipScalePercent,
  onCardHandScalePercent,
  onCardArchiveScalePercent,
  onCardZoneScalePercent,
  onCardBoardScalePercent,
  onCardRigScalePercent,
  onCardDisplayMode,
  onColorScheme,
  onCuePosition,
  onAiPacingMode,
  onCopyReconnectLink,
  onDiscardLocalSession
}: {
  actionCueAutoDismissMs: CueAutoDismissMs;
  actionCuesEnabled: boolean;
  automaticEffectCuesEnabled: boolean;
  autoDiscardEnabled: boolean;
  autoEndTurnEnabled: boolean;
  topbarStickyEnabled: boolean;
  audioEnabled: boolean;
  audioVolume: number;
  cardTooltipHoverDelayMs: CardTooltipHoverDelayMs;
  cardTooltipMode: CardTooltipMode;
  cardTooltipScalePercent: number;
  cardHandScalePercent: number;
  cardArchiveScalePercent: number;
  cardZoneScalePercent: number;
  cardBoardScalePercent: number;
  cardRigScalePercent: number;
  cardDisplayMode: CardDisplayMode;
  colorScheme: ColorScheme;
  cuePosition: CuePositionPreference;
  aiPacingMode: AiPacingMode;
  modal?: boolean;
  session?: SessionInfo | null;
  onActionCueAutoDismissMs(value: CueAutoDismissMs): void;
  onActionCuesEnabled(value: boolean): void;
  onAutomaticEffectCuesEnabled(value: boolean): void;
  onAutoDiscardEnabled(value: boolean): void;
  onAutoEndTurnEnabled(value: boolean): void;
  onTopbarStickyEnabled(value: boolean): void;
  onAudioEnabled(value: boolean): void;
  onAudioVolume(value: number): void;
  onCardTooltipHoverDelayMs(value: CardTooltipHoverDelayMs): void;
  onCardTooltipMode(value: CardTooltipMode): void;
  onCardTooltipScalePercent(value: number): void;
  onCardHandScalePercent(value: number): void;
  onCardArchiveScalePercent(value: number): void;
  onCardZoneScalePercent(value: number): void;
  onCardBoardScalePercent(value: number): void;
  onCardRigScalePercent(value: number): void;
  onCardDisplayMode(value: CardDisplayMode): void;
  onColorScheme(value: ColorScheme): void;
  onCuePosition(value: CuePositionPreference): void;
  onAiPacingMode(value: AiPacingMode): void;
  onCopyReconnectLink?: (() => void) | undefined;
  onDiscardLocalSession?: (() => void) | undefined;
}) {
  return (
    <section className={`optionsPanel panel${modal ? " inModal" : ""}`}>
      {!modal ? (
        <div className="catalogHeader">
          <div>
            <h2>Optionen</h2>
            <p className="meta">Darstellung, Hinweise und Audio</p>
          </div>
          <SlidersHorizontal size={18} />
        </div>
      ) : null}
      <div className="optionsContent">
        {session ? <SessionAccessSettings session={session} onCopyReconnectLink={onCopyReconnectLink} onDiscardLocalSession={onDiscardLocalSession} /> : null}
        <ColorSchemeSettings scheme={colorScheme} onChange={onColorScheme} />
        <CardDisplaySettings mode={cardDisplayMode} onChange={onCardDisplayMode} />
        <CardTooltipSettings mode={cardTooltipMode} hoverOpenDelayMs={cardTooltipHoverDelayMs} onMode={onCardTooltipMode} onHoverOpenDelayMs={onCardTooltipHoverDelayMs} />
        <CardSizeSettings
          tooltipPercent={cardTooltipScalePercent}
          handPercent={cardHandScalePercent}
          archivePercent={cardArchiveScalePercent}
          zonePercent={cardZoneScalePercent}
          boardPercent={cardBoardScalePercent}
          rigPercent={cardRigScalePercent}
          onTooltipPercent={onCardTooltipScalePercent}
          onHandPercent={onCardHandScalePercent}
          onArchivePercent={onCardArchiveScalePercent}
          onZonePercent={onCardZoneScalePercent}
          onBoardPercent={onCardBoardScalePercent}
          onRigPercent={onCardRigScalePercent}
        />
        <GameplaySettings
          autoDiscardEnabled={autoDiscardEnabled}
          autoEndTurnEnabled={autoEndTurnEnabled}
          topbarStickyEnabled={topbarStickyEnabled}
          onAutoDiscardEnabled={onAutoDiscardEnabled}
          onAutoEndTurnEnabled={onAutoEndTurnEnabled}
          onTopbarStickyEnabled={onTopbarStickyEnabled}
        />
        <AiPacingSettings mode={aiPacingMode} onMode={onAiPacingMode} />
        <ActionCueSettings
          enabled={actionCuesEnabled}
          automaticEffectsEnabled={automaticEffectCuesEnabled}
          position={cuePosition}
          autoDismissMs={actionCueAutoDismissMs}
          onEnabled={onActionCuesEnabled}
          onAutomaticEffectsEnabled={onAutomaticEffectCuesEnabled}
          onPosition={onCuePosition}
          onAutoDismissMs={onActionCueAutoDismissMs}
        />
        <AudioSettings enabled={audioEnabled} volume={audioVolume} onEnabled={onAudioEnabled} onVolume={onAudioVolume} />
        <SystemStatus />
      </div>
    </section>
  );
}

function OptionsDialog({ children, onDismiss }: { children: ReactNode; onDismiss(): void }) {
  return (
    <div className="optionsDialogOverlay" role="dialog" aria-modal="true" aria-labelledby="options-dialog-title">
      <div className="optionsDialogBackdrop" aria-hidden="true" onClick={onDismiss} />
      <section className="optionsDialogPanel">
        <div className="optionsDialogHeader">
          <div>
            <p className="eyebrow">Lokal</p>
            <h2 id="options-dialog-title">Optionen</h2>
          </div>
          <button className="button iconOnly" onClick={onDismiss} aria-label="Optionen schließen" title="Schließen" type="button">
            <X size={16} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function SessionAccessSettings({
  session,
  onCopyReconnectLink,
  onDiscardLocalSession
}: {
  session: SessionInfo;
  onCopyReconnectLink?: (() => void) | undefined;
  onDiscardLocalSession?: (() => void) | undefined;
}) {
  const reconnectUrl = reconnectUrlForSession(session);
  return (
    <div className="sessionAccessSettings">
      <div>
        <span className="settingsTitle">Sitzung</span>
        <span className="meta">Lokaler Zugang zu diesem Spiel</span>
      </div>
      <div className="sessionAccessLink">
        <label>
          Wiederverbindungslink
          <input value={reconnectUrl} readOnly aria-label="Wiederverbindungslink" />
        </label>
        <button className="button" onClick={onCopyReconnectLink} type="button" disabled={!onCopyReconnectLink || !session.reconnectToken}>
          <Clipboard size={15} />
          Kopieren
        </button>
      </div>
      <p className="settingsHelp">
        Der Link enthält Deinen Reconnect-Token für {sideLabel(session.side)}. Wer ihn hat, kann diese Seite des Matches weiterführen.
      </p>
      <div className="sessionDangerRow">
        <button className="button dangerButton" onClick={onDiscardLocalSession} type="button" disabled={!onDiscardLocalSession}>
          <Trash2 size={15} />
          Lokale Sitzung löschen
        </button>
        <span className="settingsHelp">Löscht nur diesen Browserzugang. Das Spiel wird nicht aufgegeben.</span>
      </div>
    </div>
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
      <button className={mode === "placeholder" ? "active" : ""} onClick={() => onChange("placeholder")} type="button" title="Bildmodus: Regeltext für bekannte Karten per Hover oder Fokus" aria-label="Bildmodus" data-testid="card-display-image">
        <Image size={15} />
        {!iconOnly ? "Bild" : <span className="srOnly">Bild</span>}
      </button>
      <button className={mode === "text-card" ? "active" : ""} onClick={() => onChange("text-card")} type="button" title="Textmodus ohne große leere Bildfläche" aria-label="Textmodus" data-testid="card-display-text">
        <Keyboard size={15} />
        {!iconOnly ? "Text" : <span className="srOnly">Text</span>}
      </button>
      <button className={mode === "compact" ? "active" : ""} onClick={() => onChange("compact")} type="button" title="Kompaktmodus mit Regeltext per Tooltip oder Fokus" aria-label="Kompaktmodus" data-testid="card-display-compact">
        <ZoomIn size={15} />
        {!iconOnly ? "Kompakt" : <span className="srOnly">Kompakt</span>}
      </button>
    </div>
  );
}

function CardTooltipSettings({
  mode,
  hoverOpenDelayMs,
  onMode,
  onHoverOpenDelayMs
}: {
  mode: CardTooltipMode;
  hoverOpenDelayMs: CardTooltipHoverDelayMs;
  onMode(value: CardTooltipMode): void;
  onHoverOpenDelayMs(value: CardTooltipHoverDelayMs): void;
}) {
  return (
    <div className="cardTooltipSettings">
      <div>
        <span className="settingsTitle">Kartentooltip</span>
        <span className="meta">Lokale Anzeigeoption, kein Match-State</span>
      </div>
      <label>
        Modus
        <select value={mode} onChange={(event) => onMode(normalizeCardTooltipMode(event.target.value))}>
          <option value="simple">Einfach</option>
          <option value="enhanced">Verbessert</option>
          <option value="image">Kartenbild</option>
        </select>
      </label>
      <label>
        Hover-Verzögerung
        <select value={hoverOpenDelayMs} onChange={(event) => onHoverOpenDelayMs(normalizeCardTooltipHoverDelayMs(Number(event.target.value)))}>
          <option value={300}>0,3 Sekunden</option>
          <option value={500}>0,5 Sekunden</option>
          <option value={750}>0,75 Sekunden</option>
          <option value={1000}>1,0 Sekunden</option>
          <option value={1250}>1,25 Sekunden</option>
          <option value={1500}>1,5 Sekunden</option>
        </select>
      </label>
    </div>
  );
}

function CardSizeSettings({
  tooltipPercent,
  handPercent,
  archivePercent,
  zonePercent,
  boardPercent,
  rigPercent,
  onTooltipPercent,
  onHandPercent,
  onArchivePercent,
  onZonePercent,
  onBoardPercent,
  onRigPercent
}: {
  tooltipPercent: number;
  handPercent: number;
  archivePercent: number;
  zonePercent: number;
  boardPercent: number;
  rigPercent: number;
  onTooltipPercent(value: number): void;
  onHandPercent(value: number): void;
  onArchivePercent(value: number): void;
  onZonePercent(value: number): void;
  onBoardPercent(value: number): void;
  onRigPercent(value: number): void;
}) {
  return (
    <div className="cardSizeSettings">
      <div>
        <span className="settingsTitle">Kartengrößen</span>
        <span className="meta">Lokale Anzeigeoption, kein Match-State</span>
      </div>
      <CardSizeSliderRow label="Tooltip-Karte" value={tooltipPercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onTooltipPercent} />
      <CardSizeSliderRow label="Handkarten" value={handPercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onHandPercent} />
      <CardSizeSliderRow label="Archive" value={archivePercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onArchivePercent} />
      <CardSizeSliderRow label="Stack/Heap" value={zonePercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onZonePercent} />
      <CardSizeSliderRow label="Spielfeld/Forts" value={boardPercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onBoardPercent} />
      <CardSizeSliderRow label="Rig" value={rigPercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onRigPercent} />
    </div>
  );
}

function CardSizeSliderRow({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange(value: number): void;
}) {
  return (
    <label className="cardSizeSliderRow">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={CARD_SCALE_PERCENT_STEP}
        value={value}
        onChange={(event) => onChange(normalizeCardScalePercent(event.target.value, min, max))}
      />
      <strong>{value}%</strong>
    </label>
  );
}

function GameplaySettings({
  autoDiscardEnabled,
  autoEndTurnEnabled,
  topbarStickyEnabled,
  onAutoDiscardEnabled,
  onAutoEndTurnEnabled,
  onTopbarStickyEnabled
}: {
  autoDiscardEnabled: boolean;
  autoEndTurnEnabled: boolean;
  topbarStickyEnabled: boolean;
  onAutoDiscardEnabled(value: boolean): void;
  onAutoEndTurnEnabled(value: boolean): void;
  onTopbarStickyEnabled(value: boolean): void;
}) {
  return (
    <div className="gameplaySettings">
      <div className="settingsHeaderLine">
        <div>
          <span className="settingsTitle">Spielablauf</span>
          <span className="meta">Lokale Komfortoption, kein Match-State</span>
        </div>
        <div className="settingsToggleGroup">
          <label className={`settingsToggle ${autoEndTurnEnabled ? "checked" : ""}`}>
            <input type="checkbox" checked={autoEndTurnEnabled} onChange={(event) => onAutoEndTurnEnabled(event.target.checked)} />
            Auto-Zugende
          </label>
          <label className={`settingsToggle ${autoDiscardEnabled ? "checked" : ""}`}>
            <input type="checkbox" checked={autoDiscardEnabled} onChange={(event) => onAutoDiscardEnabled(event.target.checked)} />
            Auto-Abwerfen
          </label>
          <label className={`settingsToggle ${topbarStickyEnabled ? "checked" : ""}`}>
            <input data-testid="sticky-topbar-toggle" type="checkbox" checked={topbarStickyEnabled} onChange={(event) => onTopbarStickyEnabled(event.target.checked)} />
            Kopfzeile fixieren
          </label>
        </div>
      </div>
      <p className="settingsHelp">Auto-Zugende beendet Deinen Zug, wenn nur noch Zug beenden offen ist. Auto-Abwerfen bestätigt eine Discard-Auswahl sofort, sobald genau die nötige Anzahl Handkarten gewählt ist. Kopfzeile fixieren hält die aktive Spielkopfzeile beim Scrollen sichtbar.</p>
    </div>
  );
}

function AiPacingSettings({ mode, onMode }: { mode: AiPacingMode; onMode(value: AiPacingMode): void }) {
  return (
    <div className="aiPacingSettings">
      <div>
        <span className="settingsTitle">KI-Steuerung</span>
        <span className="meta">Lokale Ablaufoption, kein Match-State</span>
      </div>
      <div className="segmented aiPacingSelector" role="group" aria-label="KI-Steuerung">
        {(["manual", "paced", "fast"] as const).map((value) => (
          <button className={mode === value ? "active" : ""} key={value} onClick={() => onMode(value)} type="button" title={aiPacingModeHelp(value)}>
            {value === "manual" ? "Einzelschritt" : value === "paced" ? "Getaktet" : "Schnell"}
          </button>
        ))}
      </div>
      <p className="settingsHelp">{aiPacingModeHelp(mode)}</p>
    </div>
  );
}

function ActionCueSettings({
  enabled,
  automaticEffectsEnabled,
  position,
  autoDismissMs,
  onEnabled,
  onAutomaticEffectsEnabled,
  onPosition,
  onAutoDismissMs
}: {
  enabled: boolean;
  automaticEffectsEnabled: boolean;
  position: CuePositionPreference;
  autoDismissMs: CueAutoDismissMs;
  onEnabled(value: boolean): void;
  onAutomaticEffectsEnabled(value: boolean): void;
  onPosition(value: CuePositionPreference): void;
  onAutoDismissMs(value: CueAutoDismissMs): void;
}) {
  const setPreset = (preset: CuePositionPreset) => onPosition({ kind: "preset", preset });
  return (
    <div className="actionCueSettings">
      <div className="settingsHeaderLine">
        <div>
          <span className="settingsTitle">Infofenster</span>
          <span className="meta">Lokale Hinweise zu KI- und Gegenzügen</span>
        </div>
        <label className={`settingsToggle ${enabled ? "checked" : ""}`}>
          <input type="checkbox" checked={enabled} onChange={(event) => onEnabled(event.target.checked)} />
          Anzeigen
        </label>
        <label className={`settingsToggle ${automaticEffectsEnabled ? "checked" : ""}`}>
          <input type="checkbox" checked={automaticEffectsEnabled} onChange={(event) => onAutomaticEffectsEnabled(event.target.checked)} disabled={!enabled} />
          Automatische Effekte anzeigen
        </label>
      </div>
      <div className="settingsControlGrid">
        <label>
          Position
          <select
            value={position.kind === "preset" ? position.preset : "custom"}
            onChange={(event) => {
              if (event.target.value === "custom") return;
              setPreset(event.target.value as CuePositionPreset);
            }}
            disabled={!enabled}
          >
            <option value="top-right">Oben rechts</option>
            <option value="top-left">Oben links</option>
            <option value="bottom-right">Unten rechts</option>
            <option value="bottom-left">Unten links</option>
            <option value="center">Mitte</option>
            {position.kind === "custom" ? <option value="custom">Eigene Position</option> : null}
          </select>
        </label>
        <label>
          Automatisch ausblenden
          <select value={autoDismissMs} onChange={(event) => onAutoDismissMs(normalizeCueAutoDismissMs(Number(event.target.value)))} disabled={!enabled}>
            <option value={1500}>Nach 1,5 Sekunden</option>
            <option value={2500}>Nach 2,5 Sekunden</option>
            <option value={4000}>Nach 4 Sekunden</option>
            <option value={6000}>Nach 6 Sekunden</option>
            <option value={0}>Nicht automatisch</option>
          </select>
        </label>
        <button className="button" onClick={() => setPreset("top-right")} type="button" disabled={!enabled}>
          Zurücksetzen
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

function OpponentActionOverlay({
  cue,
  queued,
  position,
  cardDetailsById,
  displayMode,
  canAdvanceAi = false,
  onPosition,
  onDismiss,
  onAdvanceAi
}: {
  cue: OpponentActionCue | null;
  queued: number;
  position: CuePositionPreference;
  cardDetailsById: Record<string, CatalogCardDetail>;
  displayMode: CardDisplayMode;
  canAdvanceAi?: boolean;
  onPosition(position: CuePositionPreference): void;
  onDismiss(): void;
  onAdvanceAi?(): void;
}) {
  const overlayRef = useRef<HTMLElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  if (!cue) return null;

  const relatedCard = cue.relatedCard ? enrichVisibleCard(cue.relatedCard, cardDetailsById) : null;
  const cueCardDisplayMode: CardDisplayMode = displayMode === "placeholder" ? displayMode : "placeholder";
  const showHiddenCardBack = cue.visibility === "redacted" && cue.actionType === "install_card";
  const showAiAdvanceButton = Boolean(cue.source === "ai" && canAdvanceAi && onAdvanceAi);
  const dismissLabel = showAiAdvanceButton ? "Weiter" : "Ausblenden";
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
      className={`opponentCueOverlay ${cuePositionClassName(position)} actor-${cue.actor ?? "system"} importance-${cue.importance} visibility-${cue.visibility}`}
      style={cuePositionStyle(position)}
      aria-live="polite"
      data-testid="opponent-cue"
    >
      <div className="opponentCueHeader">
        <div className="opponentCueIdentity">
          <span className="opponentCueIcon" aria-hidden="true">
            {cue.source === "ai" ? <Bot size={18} /> : cue.source === "human" ? <User size={18} /> : cue.requiresLocalAttention ? <Sparkles size={18} /> : <Activity size={18} />}
          </span>
          <span>{cue.actorLabel}</span>
          {cue.actionUse ? <span className="opponentCueActionUse" title={cue.actionUse.title}>{cueActionUseLabel(cue)}</span> : null}
        </div>
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
          <Move size={15} />
        </button>
      </div>
      <div className="opponentCueBody">
        {relatedCard || showHiddenCardBack ? (
          <div className="opponentCueVisual">
            <span className="opponentCueActionBadge">{cueVisualLabel(cue)}</span>
            {relatedCard ? (
              <div className="opponentCueCard">
                <CardView card={relatedCard} displayMode={cueCardDisplayMode} compact preview />
              </div>
            ) : (
              <div className="opponentCueCardBack" aria-hidden="true">
                <span>Verdeckte Karte</span>
              </div>
            )}
          </div>
        ) : null}
        <div className="opponentCueText">
          <strong>{cue.title}</strong>
          {cue.description ? <p>{cue.description}</p> : null}
        </div>
      </div>
      <div className="opponentCueFooter">
        {queued > 0 ? <small>{queued} weitere {queued === 1 ? "Meldung" : "Meldungen"}</small> : <span aria-hidden="true" />}
        <button className="button cueAdvanceButton" onClick={showAiAdvanceButton && onAdvanceAi ? onAdvanceAi : onDismiss} aria-label={dismissLabel} title={dismissLabel} type="button">
          {showAiAdvanceButton ? <Play size={14} /> : <Check size={14} />}
          {dismissLabel}
        </button>
      </div>
    </aside>
  );
}

function cueActionUseLabel(cue: OpponentActionCue): string {
  const actor = cue.actor === "corp" ? "Korp" : cue.actor === "runner" ? "Runner" : "Spiel";
  if (!cue.actionUse) return actor;
  return cue.actionUse.start === cue.actionUse.end ? `${cue.actionUse.start}. ${actor}-Aktion` : `${actor}-Aktionen ${cue.actionUse.start}-${cue.actionUse.end}`;
}

function cueVisualLabel(cue: OpponentActionCue): string {
  if (cue.source === "system") return "Auto-Effekt";
  switch (cue.actionType) {
    case "install_card":
      return cue.visibility === "redacted" ? "verdeckt installiert" : "installiert";
    case "play_event":
    case "play_operation":
      return "gespielt";
    case "access_card":
      return "gezeigt";
    case "rez_ice":
      return "gerezzt";
    case "score_agenda":
      return "erzielt";
    case "steal_agenda":
      return "gestohlen";
    case "advance_card":
      return "entwickelt";
    case "trash_accessed_card":
    case "trash_resource":
      return "getrasht";
    default:
      return "Karte";
  }
}

function AiPacingControls({
  presentation,
  mode,
  connection,
  onAdvance
}: {
  presentation: ClientPayload["aiTurnPresentation"] | undefined;
  mode: AiPacingMode;
  connection: "offline" | "connecting" | "online";
  onAdvance(): void;
}) {
  if (!presentation?.canAdvanceAi) return null;
  return (
    <section className="section aiPacingPanel" data-testid="ai-pacing">
      <div className="sectionTitleLine">
        <h2>KI-Steuerung</h2>
        <Bot size={16} />
      </div>
      <p className="aiPacingHint">
        {mode === "manual" ? "Einzelschritt aktiv." : mode === "paced" ? "Getakteter Automatiklauf aktiv." : "Schneller Automatiklauf aktiv."}
      </p>
      <button className="aiStepButton" onClick={onAdvance} disabled={!presentation.canAdvanceAi || connection !== "online"} type="button">
        <Bot size={14} />
        {mode === "manual" ? "KI-Schritt" : "KI fortsetzen"}
      </button>
    </section>
  );
}

function aiPacingModeHelp(mode: AiPacingMode): string {
  if (mode === "manual") return "Einzelschritt: Die KI macht nur dann genau einen Schritt, wenn Du KI-Schritt klickst.";
  if (mode === "fast") return "Schnell: Die KI läuft ohne Präsentationspausen bis zum nächsten menschlichen Fenster.";
  return "Getaktet: Die KI macht ihre Schritte automatisch, aber mit kurzen Pausen, damit Du sie verfolgen kannst.";
}

function RunnerOpponentZonesStrip({
  view,
  cardDetailsById,
  displayMode,
  selectedContext,
  contextualActions,
  actionDisabled,
  highlightedZone,
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
  highlightedZone: BoardHighlight | null;
  onFocus(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContext(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onAction(action: LegalAction): void;
}) {
  const { zonePercent } = useCardScaleSettings();
  const zoneCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, zonePercent / 100);
  const zoneCardsStyle = useMemo(() => ({ "--zone-card-scale": String(zoneCardScale) } as CSSProperties), [zoneCardScale]);
  const [heapCollapsed, setHeapCollapsed] = useState(false);
  if (view.side !== "corp") return null;
  const heapCards = view.opponent.discardCards ?? [];
  const heapCount = view.opponent.discardCount ?? heapCards.length;
  const gripCountLabel = formatHandLimitCount(view.opponent.handCount, view.opponent.maxHandSize);
  const stackCountLabel = formatCardCount(view.opponent.deckCount);
  const heapCountLabel = formatCardCount(heapCount);
  const cardActionsForHeap = (card: VisibleCard): LegalAction[] => {
    if (!card.known) return [];
    return contextualActions.filter((action) => actionMatchesContext(action, { kind: "card", id: card.instanceId, label: card.title ?? "Karte" }));
  };

  return (
    <section className="runnerOpponentZonesStrip" aria-label="Runner-Zonen" data-testid="runner-opponent-zones">
      <SideZoneFrame
        side="runner"
        label="Grip"
        countLabel={gripCountLabel}
        iconKind="grip"
        highlighted={zoneHighlighted(highlightedZone, "runner", "grip")}
        className="runnerOpponentZone runnerOpponentCountZone runnerOpponentGripZone"
        title="Grip: Runner-Hand. Aus Korp-Sicht ist nur die Kartenanzahl sichtbar."
        ariaLabel={`Runner-Grip ${gripCountLabel}`}
      >
        <span className="runnerOpponentZoneHeightShim" style={zoneCardsStyle} aria-hidden="true" />
      </SideZoneFrame>
      <SideZoneFrame
        side="runner"
        label="Heap"
        countLabel={heapCountLabel}
        iconKind="heap"
        highlighted={zoneHighlighted(highlightedZone, "runner", "heap")}
        className="runnerOpponentZone runnerOpponentHeapCompact"
        title="Heap: öffentliche Runner-Ablage."
        ariaLabel={`Runner-Heap ${heapCountLabel}`}
        collapsed={heapCollapsed}
        onToggleCollapse={() => setHeapCollapsed((current) => !current)}
        collapseLabel="Heap"
      >
        {heapCards.length > 0 ? (
          <div className="runnerHeapCompactPreview runnerHeapOverlapRow" style={zoneCardsStyle}>
            {heapCards.slice(0, RUNNER_HEAP_PREVIEW_LIMIT).map((card) => {
              const displayCard = enrichVisibleCard(card, cardDetailsById);
              return (
                <CardView
                  key={card.instanceId}
                  card={displayCard}
                  compact
                  displayMode={displayMode}
                  selected={selectedContext?.kind === "card" && selectedContext.id === card.instanceId}
                  actions={cardActionsForHeap(card)}
                  actionDisabled={actionDisabled}
                  onAction={onAction}
                  onFocus={onFocus}
                  onActionContextSelect={onActionContext}
                />
              );
            })}
            {heapCount > RUNNER_HEAP_PREVIEW_LIMIT ? <span className="archivesOverflowBadge">+{heapCount - RUNNER_HEAP_PREVIEW_LIMIT}</span> : null}
          </div>
        ) : (
          <p className="archivesPileEmpty">Keine Karten im Heap.</p>
        )}
      </SideZoneFrame>
      <SideZoneFrame
        side="runner"
        label="Stack"
        countLabel={stackCountLabel}
        iconKind="stack"
        highlighted={zoneHighlighted(highlightedZone, "runner", "stack")}
        className="runnerOpponentZone runnerOpponentCountZone runnerOpponentStackZone"
        title="Stack: Runner-Deck. Aus Korp-Sicht ist nur die Kartenanzahl sichtbar."
        ariaLabel={`Runner-Stack ${stackCountLabel}`}
      >
        <span className="runnerOpponentZoneHeightShim" style={zoneCardsStyle} aria-hidden="true" />
      </SideZoneFrame>
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
  const { rigPercent } = useCardScaleSettings();
  const opponentMiniCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, rigPercent / 100);
  const opponentMiniCardsStyle = useMemo(
    () => ({ "--mini-cards-min-width": `${Math.round(CARD_DISPLAY_BASE_MIN_WIDTH * opponentMiniCardScale)}px` } as CSSProperties),
    [opponentMiniCardScale]
  );
  if (opponentSide(view.side) !== "runner") return null;
  const runnerRig = view.opponent.rig ?? [];
  const groups = groupRunnerRigCards(runnerRig);
  const memorySummary = runnerRigMemorySummary(view, "opponent");
  const cardActionsForRig = (card: VisibleCard): LegalAction[] => {
    if (!card.known) return [];
    return contextualActions.filter((action) => actionMatchesContext(action, { kind: "card", id: card.instanceId, label: card.title ?? "Karte" }));
  };
  return (
    <section className="runnerRigStrip" data-testid="runner-rig">
      <div className="rigSectionLayout rigSectionLayoutCompact">
        <div className="rigSectionLead rigSectionLeadCompact">
          <ZoneIdentityIcon side="runner" kind="rig" label="Rig" className="rigSectionIcon" />
          <h2 className={`rigSectionTitle rigGroupSideLabel ${zoneSideClass("runner")}`}>Rig</h2>
        </div>
        {groups.length > 0 ? (
          <div className="rigGroups rigGroupsHorizontal rigGroupsTrack">
            {groups.map((group) => (
              <div className="rigGroup rigGroupHorizontal" key={group.key} style={opponentMiniCardsStyle}>
                <div className="rigGroupLead">
                  <h3 className={`rigGroupSideLabel ${zoneSideClass("runner")}`}>{group.label}</h3>
                  {group.key === "program" && memorySummary ? (
                    <span className="zoneLimitBadge rigMemoryBadge" aria-label={memorySummary.ariaLabel}>
                      MU <strong>{memorySummary.text}</strong>
                    </span>
                  ) : null}
                </div>
                <div className="cards rigGroupCards rigGroupCardsMini">
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
                        actionLabelForAction={(action) => runAwareActionButtonLabel(view, action)}
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
      </div>
    </section>
  );
}

function SpecialZonesStrip({
  view,
  cardDetailsById,
  displayMode,
  compact = false,
  onFocus
}: {
  view: PlayerView;
  cardDetailsById: Record<string, CatalogCardDetail>;
  displayMode: CardDisplayMode;
  compact?: boolean;
  onFocus?(card: DisplayVisibleCard, hiddenSide?: Side): void;
}) {
  const zones = view.specialZones;
  if (!zones || (zones.setAsideCount === 0 && zones.removedFromGameCount === 0)) return null;
  const groups = [
    { key: "set-aside", label: "Set Aside", count: zones.setAsideCount, cards: zones.setAside },
    { key: "removed", label: "Aus dem Spiel entfernt", count: zones.removedFromGameCount, cards: zones.removedFromGame }
  ].filter((group) => group.count > 0);

  return (
    <section className={`specialZoneStrip${compact ? " compact" : ""}`} data-testid="special-zones">
      <div className="sectionTitleLine">
        <h2>Spezialzonen</h2>
        <Layers3 size={16} />
      </div>
      <div className="specialZoneGroups">
        {groups.map((group) => (
          <div className="specialZoneGroup" key={group.key}>
            <div className="specialZoneHead">
              <strong>{group.label}</strong>
              <span>{group.count}</span>
            </div>
            {compact ? (
              <div className="specialZoneOverlapRow">
                {group.cards.slice(0, SPECIAL_ZONE_PREVIEW_LIMIT).map((card) => {
                  const displayCard = enrichVisibleCard(card, cardDetailsById);
                  return <CardView key={card.instanceId} card={displayCard} compact displayMode={displayMode} actions={[]} actionDisabled {...(onFocus ? { onFocus } : {})} />;
                })}
                {group.cards.length > SPECIAL_ZONE_PREVIEW_LIMIT ? <span className="archivesOverflowBadge">+{group.cards.length - SPECIAL_ZONE_PREVIEW_LIMIT}</span> : null}
              </div>
            ) : (
              <div className="cards miniCards">
                {group.cards.map((card) => {
                  const displayCard = enrichVisibleCard(card, cardDetailsById);
                  return <CardView key={card.instanceId} card={displayCard} compact displayMode={displayMode} actions={[]} actionDisabled {...(onFocus ? { onFocus } : {})} />;
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function RunTimelineOverlay({
  view,
  legalActions,
  runActions,
  cardDetailsById,
  actionDisabled,
  highlighted = false,
  onAction
}: {
  view: PlayerView;
  legalActions: LegalAction[];
  runActions: LegalAction[];
  cardDetailsById: Record<string, CatalogCardDetail>;
  actionDisabled: boolean;
  highlighted?: boolean;
  onAction(action: LegalAction): void;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const [position, setPosition] = useState<RunOverlayPositionPreference>(() =>
    typeof window === "undefined"
      ? { kind: "default" }
      : parseRunOverlayPositionPreference(readLocalStorageWithLegacy(RUN_OVERLAY_POSITION_STORAGE_KEY, LEGACY_RUN_OVERLAY_POSITION_STORAGE_KEY))
  );
  useEffect(() => {
    window.localStorage.setItem(RUN_OVERLAY_POSITION_STORAGE_KEY, serializeRunOverlayPositionPreference(position));
  }, [position]);
  const run = view.run;
  if (!run) return null;

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragOverlay = (event: ReactPointerEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    const offset = dragOffsetRef.current;
    if (!overlay || !offset) return;
    const rect = overlay.getBoundingClientRect();
    setPosition(
      clampRunOverlayPosition(
        ((event.clientX - offset.x) / window.innerWidth) * 100,
        ((event.clientY - offset.y) / window.innerHeight) * 100,
        window.innerWidth,
        window.innerHeight,
        rect.width,
        rect.height
      )
    );
  };
  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const currentStep = currentRunTimelineStep(view, legalActions);
  const verticalSteps = [...RUN_TIMELINE_STEPS].reverse();
  const encounteredIce = run.encounteredIce ? enrichVisibleCard(run.encounteredIce, cardDetailsById) : null;
  const jackOutAvailable = hasLegalAction(legalActions, "jack_out");
  const breachProgress = breachProgressLabel(view);
  const headerStatus = runWindowStatusLabel(view);
  const breakerHint = runBreakerActionHint(view, legalActions);
  const positionStyle: CSSProperties = position.kind === "custom" ? { left: `${position.xPercent}%`, top: `${position.yPercent}%`, transform: "none" } : {};

  const overlay = (
    <div ref={overlayRef} className={`runTimelineOverlay ${position.kind === "custom" ? "custom" : ""}`} style={positionStyle} aria-live="polite" aria-atomic="true">
      <div className={`runTimeline active overlay ${highlighted ? "cueHighlight" : ""}`} data-testid="run-timeline" role="status">
        <div
          className="runTimelineHead runTimelineDragHandle"
          onPointerDown={startDrag}
          onPointerMove={dragOverlay}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          title="Run-Fenster verschieben"
          aria-label="Run-Fenster verschieben"
        >
          <RunIcon size={18} />
          <span className="runTimelineTitle">
            <strong>{`Run auf ${serverDisplayLabel(run.attackedServerId)}`}</strong>
            {headerStatus ? <small>{headerStatus}</small> : null}
          </span>
          <Move size={15} aria-hidden="true" />
        </div>
        <div className="runSteps">
          {verticalSteps.map((step) => (
            <span className={currentStep === step.id ? "current" : ""} key={step.id}>
              {step.label}
            </span>
          ))}
        </div>
        {runActions.length > 0 ? (
          <div className="runActionBar" aria-label="Run-Aktionen" data-testid="run-action-bar">
            {runActions.map((action) => (
              <button
                className="button primary actionButton runActionButton"
                key={action.actionId}
                onClick={() => onAction(action)}
                disabled={actionDisabled}
                type="button"
                data-testid="run-action-button"
                data-action-type={action.type}
              >
                <ActionLeadIcon action={action} size={14} />
                <span className="actionButtonLabel">{runWindowActionButtonLabel(view, action)}</span>
                <CostChips action={action} />
              </button>
            ))}
          </div>
        ) : jackOutAvailable ? (
          <p className="runHint">Du kannst den Run jetzt abbrechen (Jack-out).</p>
        ) : null}
        {breachProgress ? <p className="runHint">{breachProgress}</p> : null}
        {breakerHint ? <p className="runHint runBreakerHint">{breakerHint}</p> : null}
        {encounteredIce ? (
          <div className="encounterFocus">
            {encounteredIce.known ? (
              <div className="encounterFocusBody">
                <strong>{encounteredIce.title ?? "Sichtbares ICE"}</strong>
                {encounteredIce.rulesText ? <p>{encounteredIce.rulesText}</p> : null}
              </div>
            ) : (
              <strong>Verdecktes ICE</strong>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}

function runBreakerActionHint(view: PlayerView, actions: LegalAction[]): string | null {
  if (view.run?.phase !== "encounter_ice") return null;
  const breakerActions = encounterBreakerActions(view, actions);
  if (breakerActions.length === 0) return "Kein passender Eisbrecher für dieses ICE verfügbar.";
  const labels = Array.from(new Set(breakerActions.map((action) => runAwareActionButtonLabel(view, action)))).slice(0, 2);
  return `Eisbrecher möglich: ${labels.join(", ")}${breakerActions.length > labels.length ? " ..." : ""}`;
}

function ScoredAgendaOverlay({
  side,
  cards,
  agendaPoints,
  agendaPointsToWin,
  open,
  position,
  cardDisplayMode,
  enrichCard,
  cardActionsFor,
  actionDisabled,
  selectedContext,
  onAction,
  onFocus,
  onActionContextSelect,
  onClose,
  onPosition
}: {
  side: Side;
  cards: VisibleCard[];
  agendaPoints: number;
  agendaPointsToWin: number;
  open: boolean;
  position: RunOverlayPositionPreference;
  cardDisplayMode: CardDisplayMode;
  enrichCard(card: VisibleCard): DisplayVisibleCard;
  cardActionsFor(card: VisibleCard): LegalAction[];
  actionDisabled: boolean;
  selectedContext: ActionContext | null;
  onAction(action: LegalAction): void;
  onFocus?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContextSelect?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onClose(): void;
  onPosition(position: RunOverlayPositionPreference): void;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const { handPercent } = useCardScaleSettings();
  const handCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, handPercent / 100);
  const scoredAgendaCardsStyle = useMemo(
    () => {
      const columnCount = Math.min(Math.max(cards.length, 1), 3);
      const cardMinWidth = Math.round(CARD_DISPLAY_BASE_MIN_WIDTH * handCardScale);
      return {
        "--cards-min-width": `${cardMinWidth}px`,
        "--score-area-columns": String(columnCount),
        "--score-area-list-width": `${cardMinWidth * columnCount + 8 * (columnCount - 1)}px`
      } as CSSProperties;
    },
    [cards.length, handCardScale]
  );
  const visibleCards = cards.map((card) => enrichCard(card));
  if (!open || visibleCards.length === 0) return null;
  const visibleLimitCards = visibleCards.slice(0, SCORE_AREA_PREVIEW_LIMIT);
  const title = side === "corp" ? "Entwickelt" : "Gestohlen";
  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragOverlay = (event: ReactPointerEvent<HTMLElement>) => {
    const overlay = overlayRef.current;
    const offset = dragOffsetRef.current;
    if (!overlay || !offset) return;
    const rect = overlay.getBoundingClientRect();
    onPosition(
      clampRunOverlayPosition(
        ((event.clientX - offset.x) / window.innerWidth) * 100,
        ((event.clientY - offset.y) / window.innerHeight) * 100,
        window.innerWidth,
        window.innerHeight,
        rect.width,
        rect.height
      )
    );
  };
  const stopDrag = (event: ReactPointerEvent<HTMLElement>) => {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const overlayPositionStyle: CSSProperties = position.kind === "custom"
    ? { left: `${position.xPercent}%`, top: `${position.yPercent}%`, right: "auto", transform: "none" }
    : {};

  return (
    <div
      ref={overlayRef}
      className={`scoredAgendaOverlay ${side} ${position.kind === "custom" ? "custom" : ""}`}
      style={overlayPositionStyle}
    >
      <section className={`scoredAgendaPanel ${side}`}>
        <header
          className={`scoredAgendaHead ${side}`}
          onPointerDown={startDrag}
          onPointerMove={dragOverlay}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          title={`${title}-Fenster verschieben`}
          aria-label={`${title}-Fenster verschieben`}
        >
          <div className="scoreAreaWindowControls" aria-hidden="true">
            <span className="scoreAreaDragHint">
              <Move size={14} />
            </span>
          </div>
          <div className="scoredAgendaTitleBlock">
            <strong>{title}</strong>
            <span className="scoredAgendaPointBadge">{agendaPoints} / {agendaPointsToWin} Agenda-Punkte</span>
          </div>
        </header>
        <button
          className="button iconOnly scoreAreaFloatingClose"
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClose}
          aria-label={`${title}-Fenster schließen`}
          title={`${title}-Fenster schließen`}
        >
          <X size={14} />
        </button>
        <div className="scoredAgendaList cards" style={scoredAgendaCardsStyle}>
          {visibleLimitCards.map((card) => (
            <div key={card.instanceId} className="scoredAgendaEntry">
              <CardView
                card={card}
                displayMode={cardDisplayMode}
                showAdvancementCounters={false}
                showScoreStateBadges
                actions={cardActionsFor(card)}
                actionDisabled={actionDisabled}
                selected={selectedContext?.kind === "card" && selectedContext.id === card.instanceId}
                onAction={onAction}
                {...(onFocus ? { onFocus } : {})}
                {...(onActionContextSelect ? { onActionContextSelect } : {})}
              />
              <ScoredAgendaStateLines card={card} side={side} />
            </div>
          ))}
          {cards.length > SCORE_AREA_PREVIEW_LIMIT ? <div className="scoredAgendaOverflow">+{cards.length - SCORE_AREA_PREVIEW_LIMIT} weitere</div> : null}
        </div>
      </section>
    </div>
  );
}

function serverLabelFromId(serverId: string): string {
  return serverDisplayLabel(serverId);
}

function runHiddenContextActionHint(view: PlayerView, contextualActions: LegalAction[]): string | null {
  if (view.run?.phase !== "encounter_ice") return null;
  const breakerActions = encounterBreakerActions(view, contextualActions);
  if (breakerActions.length === 0) return null;
  const runnerRig = view.side === "runner" ? (view.own.rig ?? []) : (view.opponent.rig ?? []);
  const breakerIds = new Set(
    breakerActions
      .map((action) => (typeof action.payload?.breakerId === "string" ? action.payload.breakerId : action.source))
      .filter((id): id is string => typeof id === "string" && id !== "basic_action" && id !== "game_rule")
  );
  const breakerNames = runnerRig
    .filter((card) => breakerIds.has(card.instanceId))
    .map((card) => card.title)
    .filter((title): title is string => Boolean(title));
  const uniqueNames = Array.from(new Set(breakerNames));
  const target = runCurrentIceLabel(view) ?? "dieses ICE";
  if (uniqueNames.length === 1) return `Eisbrecher verfügbar: Wähle ${uniqueNames[0]} im Rig für Aktionen gegen ${target}.`;
  if (uniqueNames.length > 1) return `Eisbrecher verfügbar: Wähle ${uniqueNames.slice(0, 2).join(" oder ")} im Rig für Aktionen gegen ${target}.`;
  return `Eisbrecher verfügbar: Wähle den passenden Eisbrecher im Rig für Aktionen gegen ${target}.`;
}

function encounterBreakerActions(view: PlayerView, actions: LegalAction[]): LegalAction[] {
  const activeIceId = activeRunIceInstanceId(view);
  const encounteredIce = view.run?.encounteredIce ?? null;
  const runnerRig = view.side === "runner" ? (view.own.rig ?? []) : (view.opponent.rig ?? []);
  const rigById = new Map(runnerRig.map((card) => [card.instanceId, card]));
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

function normalizeBreakerSubtype(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeBreakerRulesText(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function LegalActionsPanel({
  view,
  primaryActions,
  contextualActions,
  selectedContext,
  hasHiddenContextActions,
  cardContextActive = false,
  hiddenContextHint = null,
  actionCapacities,
  activeAiSide,
  disabled,
  highlighted = false,
  selectedDiscardOptionIds,
  onAction,
  onChoiceOption,
  onChoiceOptions,
  onDiscardChoiceToggle,
  enrichCard,
  connection,
  onClearContext
}: {
  view: PlayerView;
  primaryActions: LegalAction[];
  contextualActions: LegalAction[];
  selectedContext: ActionContext | null;
  hasHiddenContextActions: boolean;
  cardContextActive?: boolean;
  hiddenContextHint?: string | null;
  actionCapacities: Record<Side, number>;
  activeAiSide?: Side;
  disabled: boolean;
  highlighted?: boolean;
  selectedDiscardOptionIds: string[];
  onAction(action: LegalAction): void;
  onChoiceOption(action: LegalAction, choiceId: string, selectedOptionId: string): void;
  onChoiceOptions(action: LegalAction, choiceId: string, selectedOptionIds: string[]): void;
  onDiscardChoiceToggle(optionId: string): void;
  enrichCard(card: VisibleCard): DisplayVisibleCard;
  connection: "offline" | "connecting" | "online";
  onClearContext(): void;
}) {
  const setupChoice = view.pendingChoice?.source === "setup.mulligan" ? view.pendingChoice : undefined;
  const setupAction = setupChoice ? primaryActions.find((action) => action.type === "resolve_choice") : undefined;
  if (setupChoice && setupAction) {
    return (
      <section className={`section setupPanel ${highlighted ? "cueHighlight" : ""}`} data-testid="setup-mulligan-panel">
        <h2>
          {view.side === "runner" ? <RunnerRoleIcon size={16} /> : <CorpRoleIcon size={16} />}
          Setup
        </h2>
        <p className="meta">{setupChoice.prompt}</p>
        <div className="actions setupActions">
          {setupChoice.options.map((option) => (
            <button className="button actionButton primary" key={option.id} onClick={() => onChoiceOption(setupAction, setupChoice.choiceId, option.id)} disabled={disabled} data-testid="setup-choice-button">
              {option.id === "keep" ? <Check size={15} /> : <RotateCcw size={15} />}
              <span className="actionButtonLabel">{option.label}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }
  const discardChoice = view.pendingChoice?.source === "discard_phase" ? view.pendingChoice : undefined;
  const discardAction = discardChoice ? primaryActions.find((action) => action.type === "resolve_choice") : undefined;
  if (discardChoice && discardAction) {
    return <DiscardChoicePanel choice={discardChoice} action={discardAction} selected={selectedDiscardOptionIds} disabled={disabled} highlighted={highlighted} onToggle={onDiscardChoiceToggle} onChoiceOptions={onChoiceOptions} />;
  }
  const genericChoice = view.pendingChoice;
  const genericChoiceAction = genericChoice ? primaryActions.find((action) => action.type === "resolve_choice") : undefined;
  if (genericChoice && genericChoiceAction) {
    if (shouldUseCardChoicePanel(genericChoice)) {
      if (connection !== "online") {
        return (
          <section className={`section setupPanel ${highlighted ? "cueHighlight" : ""}`} data-testid="card-choice-paused-panel">
            <h2>
              <Search size={16} />
              {cardChoiceTitle(genericChoice)}
            </h2>
            <p className="meta">{genericChoice.prompt}</p>
            <p className="meta">Die Kartenwahl wird wieder geöffnet, sobald die Verbindung steht.</p>
          </section>
        );
      }
      return <CardChoicePanel choice={genericChoice} action={genericChoiceAction} disabled={disabled} highlighted={highlighted} enrichCard={enrichCard} onChoiceOptions={onChoiceOptions} />;
    }
    return (
      <section className={`section setupPanel ${highlighted ? "cueHighlight" : ""}`} data-testid="generic-choice-panel">
        <h2>
          <Check size={16} />
          Entscheidung
        </h2>
        <p className="meta">{genericChoice.prompt}</p>
        <div className="actions setupActions">
          {genericChoice.options.map((option) => (
            <button className="button actionButton primary" key={option.id} onClick={() => onChoiceOption(genericChoiceAction, genericChoice.choiceId, option.id)} disabled={disabled} data-testid="generic-choice-button">
              <ActionLeadIcon action={genericChoiceAction} />
              <span className="actionButtonLabel">{option.label}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }
  if (view.phase === "setup") {
    return (
      <section className={`section setupPanel ${highlighted ? "cueHighlight" : ""}`} data-testid="setup-waiting-panel">
        <h2>Setup</h2>
        <p className="meta">{setupWaitingLabel(view)}</p>
      </section>
    );
  }
  const currentTurnSide = turnSideForView(view) ?? view.activeSide;
  const currentTurnClicks = currentTurnSide === view.side ? view.own.clicks : view.opponent.clicks;
  const currentTurnCapacity = actionCapacities[currentTurnSide];
  const currentTurnDisplay = actionSlotDisplay(currentTurnSide, currentTurnClicks, currentTurnCapacity, true);
  return (
    <section className={`section ${highlighted ? "cueHighlight" : ""}`} data-testid="legal-actions">
      <div className="turnActionHeader">
        <h2>{turnActionHeaderLabel(view, currentTurnSide, activeAiSide)}</h2>
        <div className={`actionAvailability side-${currentTurnSide}`} data-testid="action-availability">
          <span className="actionAvailabilityCount">{`noch ${currentTurnDisplay.available}`}</span>
          <ActionSlotMeter side={currentTurnSide} currentClicks={currentTurnClicks} displayCapacity={currentTurnCapacity} active compact slotsOnly />
        </div>
      </div>
      <div className="actions">
        {primaryActions.map((action) => (
          <button className="button actionButton primary" key={action.actionId} onClick={() => onAction(action)} disabled={disabled} data-testid="action-button" data-action-type={action.type}>
            <ActionLeadIcon action={action} />
            <span className="actionButtonLabel">{runAwareActionButtonLabel(view, action)}</span>
            <CostChips action={action} />
          </button>
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
              <button className="button actionButton" key={action.actionId} onClick={() => onAction(action)} disabled={disabled} data-testid="action-button" data-action-type={action.type}>
                <ActionLeadIcon action={action} />
                <span className="actionButtonLabel">{runAwareActionButtonLabel(view, action)}</span>
                <CostChips action={action} />
              </button>
            ))}
            {contextualActions.length === 0 ? <p className="meta">Keine Aktion für diese Auswahl in diesem Fenster.</p> : null}
          </div>
        ) : hasHiddenContextActions ? (
          <p className="meta">{hiddenContextHint ?? "Wähle hier eine Aktion oder wähle im Spielfeld eine eigene Spielkarte bzw. ein sichtbares Spielobjekt für weitere Optionen."}</p>
        ) : null}
        {primaryActions.length === 0 && !selectedContext && !cardContextActive ? <p className="meta">Keine Aktion in diesem Fenster.</p> : null}
      </div>
    </section>
  );
}

function CardChoicePanel({
  choice,
  action,
  disabled,
  highlighted,
  enrichCard,
  onChoiceOptions
}: {
  choice: VisibleChoice;
  action: LegalAction;
  disabled: boolean;
  highlighted: boolean;
  enrichCard(card: VisibleCard): DisplayVisibleCard;
  onChoiceOptions(action: LegalAction, choiceId: string, selectedOptionIds: string[]): void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [showOnlySelectable, setShowOnlySelectable] = useState(false);
  const minSelections = Math.max(0, Math.floor(choice.minSelections));
  const maxSelections = Math.max(minSelections, Math.floor(choice.maxSelections));
  const hasDisplayOnlyOptions = choice.options.some((option) => option.selectable === false);
  const visibleOptions = showOnlySelectable ? choice.options.filter(cardChoiceOptionSelectable) : choice.options;
  const rows = cardChoiceRows(visibleOptions);
  const selectedOptions = selected
    .map((optionId) => choice.options.find((option) => option.id === optionId))
    .filter((option): option is VisibleChoiceOption => Boolean(option));
  const canSubmit = selected.length >= minSelections && selected.length <= maxSelections;
  const singleSelection = maxSelections === 1;
  const title = cardChoiceTitle(choice);
  const prompt = choice.prompt.trim();
  const effectHint = cardChoiceEffectHint(choice);

  useEffect(() => {
    setSelected([]);
    setShowOnlySelectable(false);
  }, [choice.choiceId]);

  const toggleOption = (optionId: string) => {
    const option = choice.options.find((candidate) => candidate.id === optionId);
    if (!option || !cardChoiceOptionSelectable(option)) return;
    setSelected((current) => {
      if (current.includes(optionId)) return current.filter((id) => id !== optionId);
      if (current.length >= maxSelections) return singleSelection ? [optionId] : current;
      return [...current, optionId];
    });
  };

  const dialog = (
    <section className="cardChoiceOverlay" role="dialog" aria-modal="true" aria-labelledby="card-choice-title" data-testid="card-choice-panel">
      <div className={`cardChoiceDialog ${highlighted ? "cueHighlight" : ""}`}>
        <header className="cardChoiceHeader">
          <div>
            <h2 id="card-choice-title">
              <Search size={17} />
              {title}
            </h2>
            {prompt && prompt !== title ? <p className="meta">{prompt}</p> : null}
          </div>
          <div className="cardChoiceHeaderControls">
            {hasDisplayOnlyOptions ? (
              <div className="cardChoiceViewToggle" aria-label="Kartenanzeige">
                <button className={!showOnlySelectable ? "active" : ""} onClick={() => setShowOnlySelectable(false)} type="button" aria-pressed={!showOnlySelectable}>
                  Alle
                </button>
                <button className={showOnlySelectable ? "active" : ""} onClick={() => setShowOnlySelectable(true)} type="button" aria-pressed={showOnlySelectable}>
                  Auswählbar
                </button>
              </div>
            ) : null}
            <span className="cardChoiceCounter">{choiceSelectionRangeLabel(minSelections, maxSelections)}</span>
          </div>
        </header>
        <div className="cardChoiceRows">
          {rows.map((row, rowIndex) => (
            <div className="cardChoiceOverlapRow" key={`choice-row-${rowIndex}`}>
              {row.map((option) => {
                const active = selected.includes(option.id);
                const selectable = cardChoiceOptionSelectable(option);
                const card = option.card ? enrichCard(option.card) : null;
                const cardChoiceDisplayMode: CardDisplayMode = card?.imageUrl ? "placeholder" : "text-card";
                return (
                  <div className={`cardChoiceOptionSlot ${active ? "selected" : ""}${selectable ? "" : " displayOnly"}`} key={option.id}>
                    {card ? (
                      <CardView
                        card={card}
                        displayMode={cardChoiceDisplayMode}
                        choiceSelected={active}
                        {...(selectable ? { onSelect: () => toggleOption(option.id) } : {})}
                      />
                    ) : (
                      <button className={`button actionButton cardChoiceFallback ${active ? "primary" : ""}`} onClick={() => toggleOption(option.id)} disabled={disabled || !selectable} type="button">
                        {active ? <Check size={15} /> : <Clipboard size={15} />}
                        <span className="actionButtonLabel">{option.label}</span>
                      </button>
                    )}
                    <button className={`button cardChoiceSelectButton ${active ? "primary" : ""}`} onClick={() => toggleOption(option.id)} disabled={disabled || !selectable} type="button" aria-pressed={active} data-testid="card-choice-option">
                      {active ? <Check size={14} /> : <Plus size={14} />}
                      <span>{selectable ? active ? "Gewählt" : "Wählen" : "Nur ansehen"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <footer className="cardChoiceFooter">
          <div className="cardChoiceFooterText">
            {effectHint ? <p className="cardChoiceEffectHint">{effectHint}</p> : null}
            <p className="cardChoiceQuestion">{cardChoiceQuestion(choice, selectedOptions)}</p>
          </div>
          <button className="button primary cardChoiceSubmit" onClick={() => onChoiceOptions(action, choice.choiceId, selected)} disabled={disabled || !canSubmit} type="button" data-testid="card-choice-submit">
            <Check size={15} />
            {cardChoiceSubmitLabel(selected.length)}
          </button>
        </footer>
      </div>
    </section>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}

function cardChoiceOptionSelectable(option: VisibleChoiceOption): boolean {
  return option.selectable !== false;
}

function cardChoiceRows(options: VisibleChoiceOption[]): VisibleChoiceOption[][] {
  const rowCount = options.length > 18 ? 3 : options.length > 7 ? 2 : 1;
  const rowSize = Math.max(1, Math.ceil(options.length / rowCount));
  const rows: VisibleChoiceOption[][] = [];
  for (let index = 0; index < options.length; index += rowSize) rows.push(options.slice(index, index + rowSize));
  return rows;
}

function cardChoiceTitle(choice: VisibleChoice): string {
  if (choice.source.includes("self_modifying_code_free_mu")) return "MU freimachen";
  if (choice.source.includes("sneak_preview_source")) return "Quelle wählen";
  if (choice.source.includes("sneak_preview_heap_install")) return "Heap durchsuchen";
  if (choice.source.includes("sneak_preview_free_mu")) return "MU freimachen";
  if (choice.source.includes("search_stack")) return "Stack durchsuchen";
  if (choice.source.includes("arrange_stack")) return "Karten anordnen";
  return "Karten wählen";
}

function choiceSelectionRangeLabel(minSelections: number, maxSelections: number): string {
  if (minSelections === maxSelections) return `${maxSelections} ${maxSelections === 1 ? "Karte" : "Karten"}`;
  return `${minSelections}-${maxSelections} Karten`;
}

function cardChoiceQuestion(choice: VisibleChoice, selectedOptions: VisibleChoiceOption[]): string {
  if (selectedOptions.length === 0) return choice.source.includes("sneak_preview_source") ? "Noch keine Quelle gewählt." : "Noch keine Karte gewählt.";
  if (choice.source.includes("sneak_preview_source")) return "Diese Quelle für Sneak Preview verwenden?";
  if (choice.source.includes("search_stack")) {
    return selectedOptions.length === 1 ? "Diese Auswahl für den Sucheffekt übernehmen?" : `${selectedOptions.length} Karten für den Sucheffekt übernehmen?`;
  }
  return selectedOptions.length === 1 ? "Diese Auswahl übernehmen?" : `${selectedOptions.length} Karten übernehmen?`;
}

function cardChoiceSubmitLabel(selectedCount: number): string {
  if (selectedCount <= 1) return "Auswahl übernehmen";
  return `${selectedCount} Karten übernehmen`;
}

function cardChoiceEffectHint(choice: VisibleChoice): string | null {
  const resolution = choice.stackSearchResolution;
  if (choice.source.includes("self_modifying_code_free_mu")) {
    return "Die gewählten installierten Programme werden getrasht; danach wird das vorgezeigte Programm installiert.";
  }
  if (choice.source.includes("sneak_preview_source")) return "Die Quelle wird vor der Suche festgelegt.";
  if (choice.source.includes("sneak_preview_heap_install")) return "Das gewählte Programm wird kostenlos installiert und am Ende des Zuges in den Grip genommen, falls es noch installiert ist.";
  if (choice.source.includes("sneak_preview_free_mu")) {
    return "Die gewählten installierten Programme werden getrasht; danach wird das Sneak-Preview-Programm kostenlos installiert.";
  }
  if (resolution?.destination === "install_program") {
    return `Die gewählte Programmkarte wird ${resolution.reveal === "public" ? "vorgezeigt und " : ""}direkt installiert${resolution.shuffleAfter ? "; danach wird der Stack gemischt" : ""}${choice.source.includes("sneak_preview") ? "; am Zugende kehrt sie in den Grip zurück, falls sie noch installiert ist" : ""}.`;
  }
  if (resolution?.destination === "grip") {
    return `Die gewählte Karte wird ${resolution.reveal === "public" ? "vorgezeigt und " : ""}in den Grip genommen${resolution.shuffleAfter ? "; danach wird der Stack gemischt" : ""}.`;
  }
  if (choice.source.includes("arrange_stack")) return "Die gewählte Reihenfolge wird für den Stack übernommen.";
  if (choice.source.includes("search_trash")) return "Die gewählte Karte wird aus dem Heap in den Grip genommen.";
  return null;
}

function DiscardChoicePanel({
  choice,
  action,
  selected,
  disabled,
  highlighted,
  onToggle,
  onChoiceOptions
}: {
  choice: NonNullable<PlayerView["pendingChoice"]>;
  action: LegalAction;
  selected: string[];
  disabled: boolean;
  highlighted: boolean;
  onToggle(optionId: string): void;
  onChoiceOptions(action: LegalAction, choiceId: string, selectedOptionIds: string[]): void;
}) {
  const required = choice.maxSelections;
  const selectedOptionIds = selected.filter((optionId) => choice.options.some((option) => option.id === optionId));
  return (
    <section className={`section setupPanel ${highlighted ? "cueHighlight" : ""}`} data-testid="discard-choice-panel">
      <h2>
        <Trash2 size={16} />
        Discard
      </h2>
      <p className="meta">{choice.prompt} · {selectedOptionIds.length}/{required}</p>
      <div className="choiceCards">
        {choice.options.map((option) => {
          const active = selectedOptionIds.includes(option.id);
          return (
            <button className={`button actionButton ${active ? "primary" : ""}`} key={option.id} onClick={() => onToggle(option.id)} disabled={disabled} type="button" data-testid="discard-choice-option" aria-pressed={active}>
              {active ? <Check size={15} /> : <Clipboard size={15} />}
              <span className="actionButtonLabel">{option.label}</span>
            </button>
          );
        })}
      </div>
      <button className="button primary wide" onClick={() => onChoiceOptions(action, choice.choiceId, selectedOptionIds)} disabled={disabled || selectedOptionIds.length !== required} type="button" data-testid="discard-choice-submit">
        <Trash2 size={15} />
        Abwerfen
      </button>
    </section>
  );
}

function CostChips({ action }: { action: LegalAction }) {
  const chips = actionCostChips(action);
  if (chips.length === 0) return null;
  return (
    <span className="costChips" aria-label={`Kosten: ${chips.map((chip) => chip.label).join(" + ")}`} data-testid="cost-chips">
      {chips.map((chip) => (
        <span className={`costChip ${chip.kind}`} key={`${chip.kind}-${chip.amount}`}>
          <span className={chip.kind === "action" ? "costActionIcon" : "costCreditIcon"} aria-hidden="true" />
          {chip.amount}
        </span>
      ))}
    </span>
  );
}

function ActionLeadIcon({ action, size = 15 }: { action: LegalAction; size?: number }) {
  return actionConsumesClick(action) ? <Play size={size} aria-hidden="true" /> : <Zap size={size} aria-hidden="true" />;
}

function setupWaitingLabel(view: PlayerView): string {
  if (view.timingPoint === "setup.mulligan.runner") return "Runner entscheidet über die Starthand.";
  if (view.timingPoint === "setup.mulligan.corp") return "Korp entscheidet über die Starthand.";
  return "Setup läuft.";
}

function UndoPanel({
  open,
  pendingUndo,
  latestEventId,
  connection,
  onRequest,
  onResolve
}: {
  open: boolean;
  pendingUndo: ClientPayload["pendingUndo"] | undefined;
  latestEventId: string | undefined;
  connection: "offline" | "connecting" | "online";
  onRequest(): void;
  onResolve(accepted: boolean): void;
}) {
  if (!open) return null;
  const hasIncomingRequest = Boolean(pendingUndo?.needsResponse);
  const hasOutgoingRequest = Boolean(pendingUndo && !pendingUndo.needsResponse);
  const incomingRequest = pendingUndo?.needsResponse ? pendingUndo : null;
  const undoTitle = hasIncomingRequest || hasOutgoingRequest ? "Zurücknahme angefragt" : "Letzte Aktion zurücknehmen";
  const undoDescription = hasIncomingRequest
    ? `${sideLabel(incomingRequest!.requestedBy)} bittet um Zurücknahme der letzten Aktion.`
    : hasOutgoingRequest
      ? "Warte auf Bestätigung durch das Gegenüber."
      : "Sendet eine Anfrage an Dein Gegenüber.";

  return (
    <section className="undoPanel" id="undo-strip" data-testid="undo-panel" role="region" aria-label="Zurücknahme">
      <div className="undoPanelHeader">
        <h2>{undoTitle}</h2>
        <p className="meta">{undoDescription}</p>
      </div>
      {hasIncomingRequest ? (
        <div className="undoBox">
          <div className="splitButtons">
            <button className="button primary" onClick={() => onResolve(true)}>
              <Check size={15} />
              Zustimmen
            </button>
            <button className="button" onClick={() => onResolve(false)}>
              <X size={15} />
              Ablehnen
            </button>
          </div>
        </div>
      ) : hasOutgoingRequest ? (
        <div className="undoBox">
          <p className="meta">Die letzte Aktion bleibt bestehen, bis die andere Seite zustimmt.</p>
        </div>
      ) : (
        <button className="button wide" onClick={onRequest} disabled={!latestEventId || connection !== "online"}>
          <RotateCcw size={15} />
          Zurücknahme anfragen
        </button>
      )}
    </section>
  );
}

function CardPreviewPanel({
  card,
  displayMode,
  onDisplayMode,
  hiddenSide,
  collapsed,
  onCollapsed
}: {
  card: DisplayVisibleCard | null;
  displayMode: CardDisplayMode;
  onDisplayMode(value: CardDisplayMode): void;
  hiddenSide?: Side;
  collapsed: boolean;
  onCollapsed(value: boolean): void;
}) {
  return (
    <section className={`section cardPreviewPanel ${collapsed ? "collapsed" : ""}`} data-testid="card-preview">
      <div className="previewTitleLine">
        <div>
          <h2>Vorschau</h2>
          <p className="meta">Kartenanzeige</p>
        </div>
        <div className="previewControls">
          {!collapsed ? <CardDisplayModeSelector mode={displayMode} onChange={onDisplayMode} iconOnly /> : null}
          <button
            className="button iconOnly previewToggle"
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Kartenvorschau ausklappen" : "Kartenvorschau einklappen"}
            title={collapsed ? "Kartenvorschau ausklappen" : "Kartenvorschau einklappen"}
            onClick={() => onCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>
      {!collapsed && card ? (
        <div className={`previewModeShell mode-${displayMode}`}>
          <CardView card={card} displayMode={displayMode} {...(hiddenSide ? { hiddenSide } : {})} preview />
        </div>
      ) : null}
      {!collapsed && !card ? (
        <p className="meta">Wähle eine Karte für die Vorschau.</p>
      ) : null}
    </section>
  );
}

function ChroniclePanel({
  events,
  turnContextEvents = events,
  side,
  cardDetailsById,
  displayMode,
  onFocusCard
}: {
  events: PublicGameEvent[];
  turnContextEvents?: PublicGameEvent[];
  side: Side;
  cardDetailsById: Record<string, CatalogCardDetail>;
  displayMode: CardDisplayMode;
  onFocusCard(card: DisplayVisibleCard): void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const contextByEventId = chronicleContextByEventId(turnContextEvents, cardDetailsById);
  const entries = events
    .flatMap((event) => {
      const eventItem = formatChronicleEvent(event, side, contextByEventId[event.eventId] ?? {});
      const items = [eventItem, ...formatChronicleEffectItems(event, side)];
      return items.map((item) => {
        const card = item.cardDefinitionId ? (cardDetailsById[item.cardDefinitionId] ?? null) : eventCardDetail(event, cardDetailsById);
        return { card, item };
      });
    })
    .reverse();
  const groupedEntries: { label: string; entries: typeof entries }[] = [];
  for (const entry of entries) {
    const label = chronicleGroupLabel(entry.item);
    const currentGroup = groupedEntries[groupedEntries.length - 1];
    if (currentGroup?.label === label) {
      currentGroup.entries.push(entry);
    } else {
      groupedEntries.push({ label, entries: [entry] });
    }
  }

  return (
    <section className={`section chroniclePanel ${collapsed ? "collapsed" : ""}`} data-testid="chronicle">
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
          {groupedEntries.map((group) => (
            <div className="chronicleGroupBlock" key={`${group.label}-${group.entries[0]?.item.id ?? "empty"}`}>
              <div className="chronicleGroup">{group.label}</div>
              {group.entries.map((entry) => (
                <ChronicleEntry key={entry.item.id} item={entry.item} card={entry.card} displayMode={displayMode} onFocusCard={onFocusCard} />
              ))}
            </div>
          ))}
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
          <ChronicleCardTrigger
            className="chronicleCardLine"
            card={card}
            item={item}
            displayMode={displayMode}
            disabled={!previewCard}
            title={item.cardTitle}
            onClick={() => previewCard && onFocusCard(previewCard)}
          >
            Karte: {item.cardTitle}
          </ChronicleCardTrigger>
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
  return (
    <>
      {item.title.slice(0, index)}
      <ChronicleCardTrigger
        className={`chronicleCardName ${previewCard ? "hasDetail" : ""}`}
        card={card}
        item={item}
        displayMode={displayMode}
        disabled={!previewCard}
        title={item.cardTitle}
        onClick={() => previewCard && onFocusCard(previewCard)}
      >
        {item.cardTitle}
      </ChronicleCardTrigger>
      {item.title.slice(index + item.cardTitle.length)}
    </>
  );
}

function ChronicleCardTrigger({
  className,
  card,
  item,
  displayMode,
  disabled,
  title,
  onClick,
  children
}: {
  className: string;
  card: CatalogCardDetail | null;
  item: ChronicleItem;
  displayMode: CardDisplayMode;
  disabled: boolean;
  title: string;
  onClick(): void;
  children: ReactNode;
}) {
  const { hoverOpenDelayMs, mode: tooltipMode } = useCardTooltipSettings();
  const { tooltipPercent } = useCardScaleSettings();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tooltipHoverVisible, setTooltipHoverVisible] = useState(false);
  const [tooltipFocusVisible, setTooltipFocusVisible] = useState(false);
  const [tooltipPlacement, setTooltipPlacement] = useState<"above" | "below">("below");
  const [tooltipPositionStyle, setTooltipPositionStyle] = useState<CSSProperties>({});

  const imageUrl = card ? localCardImageUrl(card.catalogCardId) : undefined;
  const showImageTooltip = tooltipMode === "image" && Boolean(imageUrl);
  const rulesLines = card ? rulesTextLines(card.text) : [];
  const hasTooltipTextContent = Boolean(card && (card.title || item.cardDetailLines.length > 0 || rulesLines.length > 0));
  const tooltipEnabled = Boolean(card) && !disabled && (showImageTooltip || hasTooltipTextContent);
  const showTooltip = tooltipEnabled && (tooltipHoverVisible || tooltipFocusVisible);
  const cardType = card?.type ?? "";
  const tooltipId =
    tooltipEnabled && card
      ? `chronicle-card-tooltip-${`${card.catalogCardId}-${item.id}`.replace(/[^A-Za-z0-9_-]/g, "-")}`
      : undefined;
  const hasGeneratedImage = hasGeneratedCardArt(card?.catalogCardId);
  const showHardwareOverlay = Boolean(imageUrl) && displayMode === "placeholder" && isHardwareCardType(cardType) && hasGeneratedImage;
  const showOperationOverlay = Boolean(imageUrl) && displayMode === "placeholder" && isOperationCardType(cardType) && hasGeneratedImage;
  const tooltipStats = card
    ? [
        card.numeric.cost !== null ? { icon: "¢", label: "Kosten", value: String(card.numeric.cost) } : null,
        card.numeric.installCost !== null ? { icon: "↓", label: "Install", value: String(card.numeric.installCost) } : null,
        card.numeric.rezCost !== null ? { icon: "R", label: "Rez", value: String(card.numeric.rezCost) } : null,
        card.numeric.trashCost !== null ? { icon: "🗑", label: "Trash", value: String(card.numeric.trashCost) } : null,
        card.numeric.strength !== null ? { icon: "⚔", label: "Stärke", value: String(card.numeric.strength) } : null,
        card.numeric.memoryCost !== null ? { icon: "MU", label: "MU", value: String(card.numeric.memoryCost) } : null
      ].filter((entry): entry is { icon: string; label: string; value: string } => entry !== null)
    : [];
  const tooltipScale = Math.max(0.5, tooltipPercent / 100);

  const clearOpenTimer = () => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const estimatedTooltipHeight = (): number => {
    if (showImageTooltip) return 320;
    const base = tooltipMode === "enhanced" ? 132 : 78;
    return Math.min(320, Math.round((base + rulesLines.length * 20) * tooltipScale));
  };

  const computedTooltipWidth = (): number => {
    const viewportLimit = Math.max(160, window.innerWidth - 32);
    const unscaled = showImageTooltip ? 220 : 300;
    return Math.min(Math.round(unscaled * tooltipScale), viewportLimit);
  };

  const updateTooltipPlacement = () => {
    const element = triggerRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const tooltipHeight = estimatedTooltipHeight();
    const nextPlacement = spaceBelow < tooltipHeight && spaceAbove > spaceBelow ? "above" : "below";
    if (tooltipEnabled) {
      const tooltipWidth = computedTooltipWidth();
      const margin = 16;
      const left = Math.max(margin, Math.min(rect.left + 6, window.innerWidth - tooltipWidth - margin));
      setTooltipPositionStyle(
        nextPlacement === "below"
          ? { left: `${left}px`, top: `${rect.bottom + 8}px`, width: `${tooltipWidth}px` }
          : { left: `${left}px`, top: `${rect.top - 8}px`, width: `${tooltipWidth}px` }
      );
      setTooltipPlacement(nextPlacement);
    }
  };

  const scheduleOpen = () => {
    if (!tooltipEnabled) return;
    clearCloseTimer();
    if (tooltipHoverVisible) return;
    clearOpenTimer();
    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      setTooltipHoverVisible(true);
    }, hoverOpenDelayMs);
  };

  const scheduleClose = () => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setTooltipHoverVisible(false);
    }, CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS);
  };

  useEffect(() => {
    if (tooltipEnabled) return;
    clearOpenTimer();
    clearCloseTimer();
    setTooltipHoverVisible(false);
    setTooltipFocusVisible(false);
    setTooltipPositionStyle({});
  }, [tooltipEnabled]);

  useEffect(() => {
    if (!showTooltip) return;
    updateTooltipPlacement();
  }, [showTooltip, tooltipMode]);

  useEffect(
    () => () => {
      clearOpenTimer();
      clearCloseTimer();
    },
    []
  );

  return (
    <button
      ref={triggerRef}
      className={className}
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-describedby={tooltipId}
      onFocus={(event) => {
        updateTooltipPlacement();
        if (tooltipEnabled && event.currentTarget.matches(":focus-visible")) setTooltipFocusVisible(true);
      }}
      onBlur={() => setTooltipFocusVisible(false)}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        updateTooltipPlacement();
        scheduleOpen();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "touch") return;
        scheduleClose();
      }}
    >
      {children}
      {showTooltip && tooltipId && card ? (
        <span
          className={`chronicleCardTooltip ${tooltipPlacement} mode-${tooltipMode}${showImageTooltip ? " imageOnly" : ""}${showTooltip ? " visible" : ""}`}
          id={tooltipId}
          role="tooltip"
          style={tooltipPositionStyle}
          onPointerEnter={(event) => {
            if (event.pointerType === "touch") return;
            clearCloseTimer();
            clearOpenTimer();
            if (!tooltipHoverVisible) setTooltipHoverVisible(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "touch") return;
            scheduleClose();
          }}
        >
          {showImageTooltip ? (
            <span className={`chronicleCardImageFrame ${showHardwareOverlay || showOperationOverlay ? "withOverlay" : ""}`}>
              <CardImage className="chronicleCardImage" src={imageUrl} alt={`Kartenbild ${card.title}`} />
              {showHardwareOverlay ? (
                <HardwareImageOverlay
                  title={card.title}
                  rulesText={card.text}
                  className="chronicleHardwareOverlay"
                  maxLines={2}
                  {...(typeof card.numeric.installCost === "number" ? { installCost: card.numeric.installCost } : {})}
                />
              ) : showOperationOverlay ? (
                <OperationImageOverlay
                  title={card.title}
                  rulesText={card.text}
                  className="chronicleHardwareOverlay"
                  maxLines={2}
                  {...(typeof card.numeric.cost === "number" ? { cost: card.numeric.cost } : {})}
                />
              ) : null}
            </span>
          ) : (
            <>
              <strong>{card.title}</strong>
              {tooltipMode === "enhanced" ? (
                <span className="cardTooltipStats">
                  {tooltipStats.map((stat) => (
                    <span key={`${card.catalogCardId}-chronicle-tooltip-stat-${stat.label}`} className="cardTooltipStat" title={stat.label}>
                      <span className="icon">{stat.icon}</span>
                      <span>{stat.value}</span>
                    </span>
                  ))}
                </span>
              ) : null}
              {tooltipMode === "enhanced"
                ? item.cardDetailLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))
                : null}
              <span className="cardTooltipText">
                {rulesLines.map((line, index) => (
                  <span key={`${card.catalogCardId}-chronicle-tooltip-rules-${index}`} className={isSubroutineRuleLine(card.type, card.text, line) ? "subroutineLine" : undefined}>
                    {shouldAddFallbackSubroutineMarker(card.type, card.text, line) ? <SubroutineIcon /> : null}
                    {renderRuleTextSegments(line, `${card.catalogCardId}-chronicle-tooltip-rules-${index}`)}
                  </span>
                ))}
              </span>
            </>
          )}
        </span>
      ) : null}
    </button>
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
      return <RunIcon size={15} />;
    case "agenda":
      return <AgendaIcon size={15} />;
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
    <section className="section diagnosticsDrawer" data-testid="diagnostics-drawer">
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

function reconnectUrlForSession(session: SessionInfo): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.pathname || "/", window.location.origin);
  url.searchParams.set("matchId", session.matchId);
  url.searchParams.set("side", session.side);
  url.searchParams.set("reconnectToken", session.reconnectToken);
  return url.toString();
}

function runtimeRandomId(): string {
  if (typeof globalThis !== "undefined" && typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text.trim()) return false;
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below for http/LAN contexts without Clipboard API permission.
    }
  }
  if (typeof document === "undefined" || !document.body) return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
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
  showExpertStatuses,
  rarityCounts,
  rarityFilter,
  typeCounts,
  typeFilters,
  onSearch,
  onSide,
  onStatus,
  onSelect,
  onToggleExpertStatuses,
  onRarity,
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
  showExpertStatuses: boolean;
  rarityCounts: Record<CatalogRarityFilterKey, number>;
  rarityFilter: CatalogRarityFilterKey;
  typeCounts: Partial<Record<CatalogTypeFilterKey, number>>;
  typeFilters: CatalogTypeFilterState;
  onSearch(value: string): void;
  onSide(value: Side | "all"): void;
  onStatus(value: CatalogStatusKey | "all"): void;
  onSelect(value: string): void;
  onToggleExpertStatuses(value: boolean): void;
  onRarity(value: CatalogRarityFilterKey): void;
  onTypeFilter(key: CatalogTypeFilterKey, selected: boolean): void;
  onSelectAllTypes(): void;
  onClearTypeFilters(): void;
}) {
  const catalogImageUrl = detail ? localCardImageUrl(detail.catalogCardId) : undefined;
  const catalogImageTooltip = catalogImageMetricTooltip(detail);
  const showCatalogHardwareOverlay = Boolean(catalogImageUrl) && Boolean(detail) && isHardwareCardType(detail?.type) && hasGeneratedCardArt(detail?.catalogCardId);
  const showCatalogOperationOverlay = Boolean(catalogImageUrl) && Boolean(detail) && isOperationCardType(detail?.type) && hasGeneratedCardArt(detail?.catalogCardId);
  const catalogImagePreviewMode = showCatalogHardwareOverlay ? "hardware" : showCatalogOperationOverlay ? "operation" : "";
  const visibleStatusKeys = showExpertStatuses ? CATALOG_STATUS_FILTER_KEYS : PRIMARY_CATALOG_STATUS_KEYS;
  const availableStatusKeys = new Set(filters?.statuses ?? CATALOG_STATUS_FILTER_KEYS);
  const statusOptions = visibleStatusKeys.filter((value) => availableStatusKeys.has(value));
  const detailRarityLabel = detail ? catalogRarityLabel(detail) : null;
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
            {cards.length} Karten · {summary.human_playable ?? 0} für Menschen spielbar · {summary.ai_supported ?? 0} KI geeignet
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
            {statusOptions.map((value) => (
              <option value={value} key={value}>
                {CATALOG_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Rarität
          <select value={rarityFilter} onChange={(event) => onRarity(event.target.value as CatalogRarityFilterKey)}>
            {CATALOG_RARITY_FILTERS.map((filter) => (
              <option value={filter.key} key={filter.key}>
                {filter.label} ({rarityCounts[filter.key]})
              </option>
            ))}
          </select>
        </label>
        <label className="catalogExpertToggle">
          <input
            checked={showExpertStatuses}
            onChange={(event) => {
              const next = event.target.checked;
              onToggleExpertStatuses(next);
              if (!next && status !== "all" && !PRIMARY_CATALOG_STATUS_KEYS.includes(status)) onStatus("all");
            }}
            type="checkbox"
          />
          Expertenstatus
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
              <StatusBadges statuses={card.statuses} compact showExpert={showExpertStatuses} />
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
                <div className={`catalogImagePreview ${catalogImagePreviewMode}`} {...(catalogImageTooltip ? { title: catalogImageTooltip } : {})}>
                  <CardImage src={catalogImageUrl} alt={`Kartenbild ${detail.title}`} priority {...(catalogImageTooltip ? { title: catalogImageTooltip } : {})} />
                  {showCatalogHardwareOverlay ? (
                    <HardwareImageOverlay
                      title={detail.title}
                      rulesText={detail.text}
                      className="catalogHardwareOverlay"
                      {...(detail.numeric.installCost !== null ? { installCost: detail.numeric.installCost } : {})}
                    />
                  ) : showCatalogOperationOverlay ? (
                    <OperationImageOverlay
                      title={detail.title}
                      rulesText={detail.text}
                      className="catalogHardwareOverlay"
                      {...(detail.numeric.cost !== null ? { cost: detail.numeric.cost } : {})}
                    />
                  ) : null}
                </div>
              ) : null}
              <StatusBadges statuses={detail.statuses} showExpert={showExpertStatuses} />
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
                {detailRarityLabel ? (
                  <span>
                    <strong>{detailRarityLabel}</strong>
                    Rarität
                  </span>
                ) : null}
              </div>
              {detail.aiHints ? <CatalogAiHintPanel hints={detail.aiHints} /> : null}
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
            Deck-Editor · {deck.name}
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
          {entry.label}: {entry.metadata!.deckName}
        </span>
      ))}
    </div>
  );
}

function DeckEditorPanel({
  localDecks,
  selectedDeck,
  selectedDeckDirty,
  storagePath,
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
  useForMatchLabel = "Im Matchstart auswählen",
  onExport,
  onImportText,
  onImport
}: {
  localDecks: EditableDeck[];
  selectedDeck: EditableDeck | null;
  selectedDeckDirty: boolean;
  storagePath: string;
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
  useForMatchLabel?: string;
  onExport(): void;
  onImportText(value: string): void;
  onImport(): void;
}) {
  const [builderSearch, setBuilderSearch] = useState("");
  const [builderTypeFilters, setBuilderTypeFilters] = useState<CatalogTypeFilterState>({ ...ALL_CATALOG_TYPE_FILTERS });
  const [builderSetFilter, setBuilderSetFilter] = useState<CatalogSetFilterKey>("all");
  const [builderRarityFilter, setBuilderRarityFilter] = useState<CatalogRarityFilterKey>("all");
  const [builderOnlyInDeck, setBuilderOnlyInDeck] = useState(false);
  const [builderFiltersOpen, setBuilderFiltersOpen] = useState(false);
  const [deckDetailsOpen, setDeckDetailsOpen] = useState(true);
  const [deckPickerOpen, setDeckPickerOpen] = useState(true);
  const [deckEditorMode, setDeckEditorMode] = useState<DeckEditorMode>("list");
  const [tableCardMenuKey, setTableCardMenuKey] = useState<string | null>(null);
  const [tableCardWidth, setTableCardWidth] = useState(DECK_TABLE_CARD_WIDTH_DEFAULT);
  const [tableOverlapPercent, setTableOverlapPercent] = useState(DECK_TABLE_OVERLAP_DEFAULT);
  const [tableLibraryWidth, setTableLibraryWidth] = useState(DECK_TABLE_LIBRARY_WIDTH_DEFAULT);
  const [tableLibraryCardWidth, setTableLibraryCardWidth] = useState(DECK_TABLE_LIBRARY_CARD_WIDTH_DEFAULT);
  const [tableLibraryOverlapPercent, setTableLibraryOverlapPercent] = useState(DECK_TABLE_LIBRARY_OVERLAP_DEFAULT);
  const [tableViewSettingsLoaded, setTableViewSettingsLoaded] = useState(false);
  const [tableControlsOpen, setTableControlsOpen] = useState(false);
  const [tableLibraryControlsOpen, setTableLibraryControlsOpen] = useState(false);
  const [tableSelectionMode, setTableSelectionMode] = useState(false);
  const [selectedTableCardKeys, setSelectedTableCardKeys] = useState<string[]>([]);
  const [tableSelectionAnchor, setTableSelectionAnchor] = useState<{ pileId: string; order: number } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deckSideFilter, setDeckSideFilter] = useState<DeckSideFilter>("all");
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const totalCards = selectedDeck?.cards.reduce((sum, entry) => sum + entry.quantity, 0) ?? 0;
  const deckQuantities = useMemo(() => new Map(selectedDeck?.cards.map((entry) => [entry.cardId, entry.quantity]) ?? []), [selectedDeck?.cards]);
  const cardLookup = useMemo(() => new Map(playableCards.map((card) => [card.catalogCardId, card])), [playableCards]);
  const tableLayout = useMemo(() => (selectedDeck ? normalizeDeckTableLayout(selectedDeck, cardLookup, cardDetailsById) : null), [cardDetailsById, cardLookup, selectedDeck]);
  const sourceFilteredPlayableCards = useMemo(() => filterCatalogCardsBySet(playableCards, builderSetFilter), [builderSetFilter, playableCards]);
  const rarityFilteredPlayableCards = useMemo(() => filterCatalogCardsByRarity(sourceFilteredPlayableCards, builderRarityFilter), [builderRarityFilter, sourceFilteredPlayableCards]);
  const builderSetCounts = useMemo(() => summarizeCatalogSetFilters(playableCards), [playableCards]);
  const builderRarityCounts = useMemo(() => summarizeCatalogRarityFilters(sourceFilteredPlayableCards), [sourceFilteredPlayableCards]);
  const builderTypeCounts = useMemo(() => summarizeCatalogTypeFilters(rarityFilteredPlayableCards), [rarityFilteredPlayableCards]);
  const runnerDeckCount = localDecks.filter((deck) => deck.side === "runner").length;
  const corpDeckCount = localDecks.filter((deck) => deck.side === "corp").length;
  const filteredLocalDecks = useMemo(() => (deckSideFilter === "all" ? localDecks : localDecks.filter((deck) => deck.side === deckSideFilter)), [deckSideFilter, localDecks]);
  const selectedDeckSelectValue = selectedDeck && filteredLocalDecks.some((deck) => deck.deckId === selectedDeck.deckId) ? selectedDeck.deckId : "";
  const visibleTypeFilterGroups = selectedDeck ? CATALOG_TYPE_FILTER_GROUPS.filter((group) => group.side === selectedDeck.side) : CATALOG_TYPE_FILTER_GROUPS;
  const libraryCards = useMemo(() => {
    const search = builderSearch.trim().toLowerCase();
    return rarityFilteredPlayableCards
      .filter((card) => {
        if (builderOnlyInDeck && !deckQuantities.has(card.catalogCardId)) return false;
        if (!catalogCardMatchesTypeFilters(card, builderTypeFilters)) return false;
        if (!search) return true;
        const detail = cardDetailsById[card.catalogCardId];
        return [card.title, card.type, card.faction, ...card.subtypes, detail?.text ?? ""].some((value) => value.toLowerCase().includes(search));
      })
      .sort((left, right) => deckBuilderCardGroup(left).localeCompare(deckBuilderCardGroup(right)) || left.title.localeCompare(right.title));
  }, [builderOnlyInDeck, builderSearch, builderTypeFilters, cardDetailsById, deckQuantities, rarityFilteredPlayableCards]);
  const deckRows = useMemo(
    () =>
      (selectedDeck?.cards ?? [])
        .map((entry) => ({ entry, card: cardLookup.get(entry.cardId) ?? null }))
        .sort((left, right) => deckBuilderCardGroup(left.card).localeCompare(deckBuilderCardGroup(right.card)) || (left.card?.title ?? left.entry.cardId).localeCompare(right.card?.title ?? right.entry.cardId)),
    [cardLookup, selectedDeck?.cards]
  );
  const deckTableCostDetailsReady = useMemo(() => (selectedDeck?.cards ?? []).every((entry) => Boolean(cardDetailsById[entry.cardId])), [cardDetailsById, selectedDeck?.cards]);
  const tableLibraryColumnCount = Math.max(1, Math.floor((tableLibraryWidth - 18) / Math.max(70, tableLibraryCardWidth + 12)));
  const selectedTableCardKeySet = useMemo(() => new Set(selectedTableCardKeys), [selectedTableCardKeys]);
  const selectedTableCardIndexes = useMemo(() => {
    const indexes = new Map<string, number>();
    selectedTableCardKeys.forEach((key, index) => indexes.set(key, index + 1));
    return indexes;
  }, [selectedTableCardKeys]);
  const selectedTableCards = useMemo<DeckTableSelectionEntry[]>(() => {
    if (!tableLayout) return [];
    const selectedKeys = new Set(selectedTableCardKeys);
    return [...tableLayout.piles]
      .sort((left, right) => left.order - right.order)
      .flatMap((pile) =>
        [...pile.entries]
          .sort((left, right) => left.order - right.order)
          .filter((entry) => selectedKeys.has(deckTableSelectionKey(pile.id, entry.cardId, entry.order)))
          .map((entry) => ({ pileId: pile.id, cardId: entry.cardId, order: entry.order }))
      );
  }, [selectedTableCardKeys, tableLayout]);
  const deckTableStyle = useMemo(
    () =>
      ({
        "--deck-table-card-width": `${tableCardWidth}px`,
        "--deck-table-library-width": `${tableLibraryWidth}px`,
        "--deck-table-overlap-offset": `-${Math.round(tableCardWidth * 1.4 * (tableOverlapPercent / 100))}px`,
        "--deck-table-library-card-width": `${tableLibraryCardWidth}px`,
        "--deck-table-library-columns": tableLibraryColumnCount,
        "--deck-table-library-overlap-offset": `${6 - Math.round(tableLibraryCardWidth * 1.4 * (tableLibraryOverlapPercent / 100))}px`
      }) as CSSProperties,
    [tableCardWidth, tableLibraryCardWidth, tableLibraryColumnCount, tableLibraryOverlapPercent, tableLibraryWidth, tableOverlapPercent]
  );
  const tableWidthControlValue = DECK_TABLE_LIBRARY_WIDTH_MIN + DECK_TABLE_LIBRARY_WIDTH_MAX - tableLibraryWidth;
  const currentTableViewSettings = (): DeckTableViewSettings => ({
    cardWidth: tableCardWidth,
    overlapPercent: tableOverlapPercent,
    libraryWidth: tableLibraryWidth,
    libraryCardWidth: tableLibraryCardWidth,
    libraryOverlapPercent: tableLibraryOverlapPercent
  });
  const rememberTableViewSettings = (nextSettings: DeckTableViewSettings) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  };
  const updateTableCardWidthSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      cardWidth: normalizeSteppedNumber(value, DECK_TABLE_CARD_WIDTH_DEFAULT, DECK_TABLE_CARD_WIDTH_MIN, DECK_TABLE_CARD_WIDTH_MAX, DECK_TABLE_CARD_WIDTH_STEP)
    };
    setTableCardWidth(next.cardWidth);
    rememberTableViewSettings(next);
  };
  const updateTableOverlapSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      overlapPercent: normalizeSteppedNumber(value, DECK_TABLE_OVERLAP_DEFAULT, DECK_TABLE_OVERLAP_MIN, DECK_TABLE_OVERLAP_MAX, DECK_TABLE_OVERLAP_STEP)
    };
    setTableOverlapPercent(next.overlapPercent);
    rememberTableViewSettings(next);
  };
  const updateTableLibraryWidthSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      libraryWidth: normalizeSteppedNumber(value, DECK_TABLE_LIBRARY_WIDTH_DEFAULT, DECK_TABLE_LIBRARY_WIDTH_MIN, DECK_TABLE_LIBRARY_WIDTH_MAX, DECK_TABLE_LIBRARY_WIDTH_STEP)
    };
    setTableLibraryWidth(next.libraryWidth);
    rememberTableViewSettings(next);
  };
  const updateTableWidthSetting = (value: number) => {
    updateTableLibraryWidthSetting(DECK_TABLE_LIBRARY_WIDTH_MIN + DECK_TABLE_LIBRARY_WIDTH_MAX - value);
  };
  const updateTableLibraryCardWidthSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      libraryCardWidth: normalizeSteppedNumber(value, DECK_TABLE_LIBRARY_CARD_WIDTH_DEFAULT, DECK_TABLE_LIBRARY_CARD_WIDTH_MIN, DECK_TABLE_LIBRARY_CARD_WIDTH_MAX, DECK_TABLE_LIBRARY_CARD_WIDTH_STEP)
    };
    setTableLibraryCardWidth(next.libraryCardWidth);
    rememberTableViewSettings(next);
  };
  const updateTableLibraryOverlapSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      libraryOverlapPercent: normalizeSteppedNumber(value, DECK_TABLE_LIBRARY_OVERLAP_DEFAULT, DECK_TABLE_LIBRARY_OVERLAP_MIN, DECK_TABLE_LIBRARY_OVERLAP_MAX, DECK_TABLE_LIBRARY_OVERLAP_STEP)
    };
    setTableLibraryOverlapPercent(next.libraryOverlapPercent);
    rememberTableViewSettings(next);
  };
  const previewCard = (previewCardId ? cardLookup.get(previewCardId) : null) ?? libraryCards[0] ?? deckRows[0]?.card ?? null;
  const previewQuantity = previewCard ? deckQuantities.get(previewCard.catalogCardId) ?? 0 : 0;
  useEffect(() => {
    if (!selectedDeck || deckSideFilter === "all" || selectedDeck.side === deckSideFilter) return;
    setDeckSideFilter(selectedDeck.side);
  }, [deckSideFilter, selectedDeck?.side]);
  useEffect(() => {
    if (builderSetFilter === "all" || builderSetCounts[builderSetFilter] > 0) return;
    setBuilderSetFilter("all");
  }, [builderSetCounts, builderSetFilter]);
  useEffect(() => {
    if (builderRarityFilter === "all" || builderRarityCounts[builderRarityFilter] > 0) return;
    setBuilderRarityFilter("all");
  }, [builderRarityCounts, builderRarityFilter]);
  useEffect(() => {
    setTableSelectionMode(false);
    setSelectedTableCardKeys([]);
    setTableSelectionAnchor(null);
  }, [deckEditorMode, selectedDeck?.deckId]);
  useEffect(() => {
    const settings = parseDeckTableViewSettings(readLocalStorageWithLegacy(DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY, LEGACY_DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY));
    setTableCardWidth(settings.cardWidth);
    setTableOverlapPercent(settings.overlapPercent);
    setTableLibraryWidth(settings.libraryWidth);
    setTableLibraryCardWidth(settings.libraryCardWidth);
    setTableLibraryOverlapPercent(settings.libraryOverlapPercent);
    setTableViewSettingsLoaded(true);
  }, []);
  useEffect(() => {
    if (!tableViewSettingsLoaded) return;
    window.localStorage.setItem(
      DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        cardWidth: tableCardWidth,
        overlapPercent: tableOverlapPercent,
        libraryWidth: tableLibraryWidth,
        libraryCardWidth: tableLibraryCardWidth,
        libraryOverlapPercent: tableLibraryOverlapPercent
      })
    );
  }, [tableViewSettingsLoaded, tableCardWidth, tableOverlapPercent, tableLibraryWidth, tableLibraryCardWidth, tableLibraryOverlapPercent]);
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
  const clearTableSelection = () => {
    setSelectedTableCardKeys([]);
    setTableSelectionAnchor(null);
  };
  const toggleTableSelectionMode = () => {
    if (tableSelectionMode) clearTableSelection();
    setTableSelectionMode((current) => !current);
  };
  const toggleTableCardSelection = (pileId: string, entry: DeckTableLayoutEntry) => {
    const key = deckTableSelectionKey(pileId, entry.cardId, entry.order);
    setSelectedTableCardKeys((current) => (current.includes(key) ? current.filter((candidate) => candidate !== key) : [...current, key]));
    setTableSelectionAnchor({ pileId, order: entry.order });
  };
  const selectTableCardRange = (pileId: string, order: number) => {
    if (!tableLayout) return;
    const pile = tableLayout.piles.find((candidate) => candidate.id === pileId);
    if (!pile) return;
    const anchorOrder = tableSelectionAnchor?.pileId === pileId ? tableSelectionAnchor.order : order;
    const lower = Math.min(anchorOrder, order);
    const upper = Math.max(anchorOrder, order);
    const rangeKeys = pile.entries
      .filter((entry) => entry.order >= lower && entry.order <= upper)
      .map((entry) => deckTableSelectionKey(pile.id, entry.cardId, entry.order));
    setSelectedTableCardKeys((current) => [...new Set([...current, ...rangeKeys])]);
    setTableSelectionAnchor({ pileId, order });
  };
  const toggleTablePileSelection = (pileId: string) => {
    if (!tableLayout) return;
    const pile = tableLayout.piles.find((candidate) => candidate.id === pileId);
    if (!pile) return;
    const pileKeys = pile.entries.map((entry) => deckTableSelectionKey(pile.id, entry.cardId, entry.order));
    const selectedKeys = new Set(selectedTableCardKeys);
    const allSelected = pileKeys.length > 0 && pileKeys.every((key) => selectedKeys.has(key));
    setTableSelectionMode(true);
    setSelectedTableCardKeys((current) => (allSelected ? current.filter((key) => !pileKeys.includes(key)) : [...new Set([...current, ...pileKeys])]));
    setTableSelectionAnchor(pile.entries[0] ? { pileId, order: pile.entries[0].order } : null);
  };
  const handleTableCardClick = (event: ReactMouseEvent<HTMLElement>, pileId: string, entry: DeckTableLayoutEntry) => {
    event.stopPropagation();
    const shouldSelect = tableSelectionMode || event.ctrlKey || event.metaKey || event.shiftKey;
    if (!shouldSelect) {
      setPreviewCardId(entry.cardId);
      return;
    }
    event.preventDefault();
    setTableCardMenuKey(null);
    setTableSelectionMode(true);
    if (event.shiftKey) selectTableCardRange(pileId, entry.order);
    else toggleTableCardSelection(pileId, entry);
  };
  const updateTableLayout = (nextLayout: DeckTableLayout) => {
    if (!selectedDeck) return;
    onUpdateDeck({
      ...selectedDeck,
      tableLayout: nextLayout,
      cards: deckCardsFromTableLayout(nextLayout)
    });
  };
  const addTableCardToPile = (cardId: string, pileId: string, targetOrder?: number) => {
    if (!tableLayout) return;
    if (deckTableCardTotal(tableLayout, cardId) >= DECK_TABLE_MAX_COPIES_PER_CARD) return;
    clearTableSelection();
    const nextLayout: DeckTableLayout = {
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => {
        if (pile.id !== pileId) return pile;
        return applyDeckTablePileSort({ ...pile, entries: insertDeckTableEntry(pile.entries, { cardId, quantity: 1, order: pile.entries.length }, targetOrder) }, cardLookup, cardDetailsById);
      })
    };
    updateTableLayout(nextLayout);
  };
  const moveTableCardsToPile = (cards: DeckTableSelectionEntry[], targetPileId: string, targetOrder?: number) => {
    if (!tableLayout) return;
    const existingEntries = new Map<string, DeckTableLayoutEntry>();
    for (const pile of tableLayout.piles) {
      for (const entry of pile.entries) existingEntries.set(deckTableSelectionKey(pile.id, entry.cardId, entry.order), entry);
    }
    const seenKeys = new Set<string>();
    const movingEntries = cards
      .map((card) => {
        const key = deckTableSelectionKey(card.pileId, card.cardId, card.order);
        if (seenKeys.has(key)) return null;
        seenKeys.add(key);
        const entry = existingEntries.get(key);
        return entry ? { ...entry, order: card.order } : null;
      })
      .filter((entry): entry is DeckTableLayoutEntry => entry !== null);
    if (movingEntries.length === 0) return;
    const nextLayout: DeckTableLayout = {
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => {
        const entriesWithoutMoved = pile.entries.filter((entry) => !seenKeys.has(deckTableSelectionKey(pile.id, entry.cardId, entry.order)));
        if (pile.id !== targetPileId) return applyDeckTablePileSort({ ...pile, entries: reorderDeckTableEntries(entriesWithoutMoved) }, cardLookup, cardDetailsById);
        return applyDeckTablePileSort({ ...pile, entries: insertDeckTableEntries(entriesWithoutMoved, movingEntries, targetOrder) }, cardLookup, cardDetailsById);
      })
    };
    clearTableSelection();
    updateTableLayout(nextLayout);
  };
  const moveTableCardToPile = (cardId: string, sourcePileId: string, targetPileId: string, quantity = 1, sourceOrder?: number, targetOrder?: number) => {
    if (!tableLayout) return;
    const sourcePile = tableLayout.piles.find((pile) => pile.id === sourcePileId);
    const sourceEntryIndex = sourcePile?.entries.findIndex((entry) => entry.cardId === cardId && (sourceOrder === undefined || entry.order === sourceOrder)) ?? -1;
    const sourceEntry = sourceEntryIndex >= 0 ? sourcePile?.entries[sourceEntryIndex] : undefined;
    if (!sourceEntry) return;
    const moveQuantity = Math.min(sourceEntry.quantity, Math.max(1, Math.floor(quantity)));
    if (sourcePileId === targetPileId && sourceEntry.order === targetOrder) return;
    const nextLayout: DeckTableLayout = {
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => {
        if (pile.id === sourcePileId) {
          const entriesWithoutMoved = pile.entries
            .map((entry, index) => (index === sourceEntryIndex ? { ...entry, quantity: entry.quantity - moveQuantity } : entry))
            .filter((entry) => entry.quantity > 0);
          if (sourcePileId === targetPileId) {
            return applyDeckTablePileSort({ ...pile, entries: insertDeckTableEntry(entriesWithoutMoved, { ...sourceEntry, quantity: moveQuantity }, targetOrder) }, cardLookup, cardDetailsById);
          }
          return applyDeckTablePileSort({
            ...pile,
            entries: reorderDeckTableEntries(entriesWithoutMoved)
          }, cardLookup, cardDetailsById);
        }
        if (pile.id === targetPileId) {
          return applyDeckTablePileSort({ ...pile, entries: insertDeckTableEntry(pile.entries, { ...sourceEntry, quantity: moveQuantity }, targetOrder) }, cardLookup, cardDetailsById);
        }
        return pile;
      })
    };
    clearTableSelection();
    updateTableLayout(nextLayout);
  };
  const duplicateTableCard = (pileId: string, cardId: string, sourceOrder: number, copiesToAdd: number) => {
    if (!tableLayout) return;
    const currentTotal = deckTableCardTotal(tableLayout, cardId);
    const nextCopies = Math.max(0, Math.min(DECK_TABLE_MAX_COPIES_PER_CARD - currentTotal, Math.floor(copiesToAdd)));
    if (nextCopies <= 0) {
      setTableCardMenuKey(null);
      return;
    }
    const nextLayout: DeckTableLayout = {
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => {
        if (pile.id !== pileId) return pile;
        let entries = pile.entries;
        const sourceEntry = pile.entries.find((entry) => entry.cardId === cardId && entry.order === sourceOrder);
        if (!sourceEntry) return pile;
        for (let copy = 0; copy < nextCopies; copy += 1) {
          entries = insertDeckTableEntry(entries, { ...sourceEntry, quantity: 1 }, sourceOrder + copy + 1);
        }
        return applyDeckTablePileSort({ ...pile, entries }, cardLookup, cardDetailsById);
      })
    };
    setTableCardMenuKey(null);
    clearTableSelection();
    updateTableLayout(nextLayout);
  };
  const removeTableCardFromPile = (pileId: string, cardId: string, sourceOrder: number) => {
    if (!tableLayout) return;
    setTableCardMenuKey(null);
    clearTableSelection();
    updateTableLayout({
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => (pile.id === pileId ? applyDeckTablePileSort({ ...pile, entries: reorderDeckTableEntries(pile.entries.filter((entry) => !(entry.cardId === cardId && entry.order === sourceOrder))) }, cardLookup, cardDetailsById) : pile))
    });
  };
  const renameTablePile = (pileId: string, name: string) => {
    if (!tableLayout) return;
    updateTableLayout({ ...tableLayout, piles: tableLayout.piles.map((pile) => (pile.id === pileId ? { ...pile, name: name.slice(0, 40) } : pile)) });
  };
  const setTablePileNamesVisible = (visible: boolean) => {
    if (!tableLayout) return;
    updateTableLayout({ ...tableLayout, showPileNames: visible });
  };
  const setTablePileCount = (pileCount: number) => {
    if (!tableLayout || !selectedDeck) return;
    const nextCount = Math.min(MAX_DECK_TABLE_PILE_COUNT, Math.max(MIN_DECK_TABLE_PILE_COUNT, Math.floor(pileCount)));
    if (nextCount === tableLayout.piles.length) return;
    clearTableSelection();
    const orderedPiles = [...tableLayout.piles].sort((left, right) => left.order - right.order);
    let nextPiles: DeckTablePile[];
    if (nextCount > orderedPiles.length) {
      nextPiles = [
        ...orderedPiles,
        ...Array.from({ length: nextCount - orderedPiles.length }, (_, offset) => {
          const index = orderedPiles.length + offset;
          return {
            id: `pile-${index + 1}`,
            name: defaultDeckTablePileName(selectedDeck.side, index),
            order: index,
            sortMode: "free" as DeckTablePileSortMode,
            entries: []
          };
        })
      ];
    } else {
      nextPiles = orderedPiles.slice(0, nextCount);
      const removedEntries = orderedPiles.slice(nextCount).flatMap((pile) => pile.entries);
      if (removedEntries.length > 0) {
        const targetPile = nextPiles[nextPiles.length - 1]!;
        nextPiles[nextPiles.length - 1] = {
          ...targetPile,
          entries: reorderDeckTableEntries([...targetPile.entries, ...removedEntries])
        };
      }
    }
    updateTableLayout({
      ...tableLayout,
      piles: nextPiles.map((pile, order) => applyDeckTablePileSort({ ...pile, order, entries: reorderDeckTableEntries(pile.entries) }, cardLookup, cardDetailsById))
    });
  };
  const setTablePileSortMode = (pileId: string, sortMode: DeckTablePileSortMode) => {
    if (!tableLayout) return;
    clearTableSelection();
    updateTableLayout({
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => (pile.id === pileId ? applyDeckTablePileSort({ ...pile, sortMode }, cardLookup, cardDetailsById) : pile))
    });
  };
  const moveTablePile = (sourcePileId: string, targetPileId: string) => {
    if (!tableLayout || sourcePileId === targetPileId) return;
    const orderedPiles = [...tableLayout.piles].sort((left, right) => left.order - right.order);
    const sourceIndex = orderedPiles.findIndex((pile) => pile.id === sourcePileId);
    const targetIndex = orderedPiles.findIndex((pile) => pile.id === targetPileId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [movedPile] = orderedPiles.splice(sourceIndex, 1);
    if (!movedPile) return;
    orderedPiles.splice(targetIndex, 0, movedPile);
    updateTableLayout({
      ...tableLayout,
      piles: orderedPiles.map((pile, order) => ({ ...pile, order }))
    });
  };
  const arrangeTableDeck = (mode: DeckTableArrangeMode) => {
    if (!tableLayout || !selectedDeck) return;
    clearTableSelection();
    if (mode === "type") {
      updateTableLayout(distributeDeckTableByType(tableLayout, selectedDeck.side, cardLookup, cardDetailsById));
      return;
    }
    if (mode === "install-piles") {
      if (!deckTableCostDetailsReady) return;
      updateTableLayout(distributeDeckTableByInstallCost(tableLayout, selectedDeck.side, cardLookup, cardDetailsById));
      return;
    }
    updateTableLayout({
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => applyDeckTablePileSort({ ...pile, sortMode: mode }, cardLookup, cardDetailsById))
    });
  };
  const handleTableDrop = (event: ReactDragEvent<HTMLElement>, pileId: string, targetOrder?: number) => {
    event.preventDefault();
    const pilePayloadText = event.dataTransfer.getData("application/x-netgrid-pile");
    if (pilePayloadText) {
      try {
        const payload = JSON.parse(pilePayloadText) as { pileId?: string };
        if (payload.pileId) moveTablePile(payload.pileId, pileId);
      } catch {
        return;
      }
      return;
    }
    const payloadText = event.dataTransfer.getData("application/x-netgrid-card");
    if (!payloadText) return;
    try {
      const payload = JSON.parse(payloadText) as { cards?: DeckTableSelectionEntry[]; cardId?: string; sourcePileId?: string; quantity?: number; sourceOrder?: number };
      if (payload.cards?.length) moveTableCardsToPile(payload.cards, pileId, targetOrder);
      else if (payload.cardId && payload.sourcePileId) moveTableCardToPile(payload.cardId, payload.sourcePileId, pileId, payload.quantity, payload.sourceOrder, targetOrder);
      else if (payload.cardId) addTableCardToPile(payload.cardId, pileId, targetOrder);
    } catch {
      return;
    }
  };
  const deckManagementPanel = (
    <section className={`deckPickerPanel ${deckPickerOpen ? "" : "collapsed"}`}>
      <div className="deckPickerHeader">
        <div>
          <h3>Meine Decks</h3>
          <p className="meta">
            {localDecks.length} gespeichert · Runner {runnerDeckCount} · Korp {corpDeckCount}
          </p>
        </div>
        <button
          className="button iconOnly"
          type="button"
          aria-expanded={deckPickerOpen}
          aria-label={deckPickerOpen ? "Deckbereich einklappen" : "Deckbereich ausklappen"}
          title={deckPickerOpen ? "Deckbereich einklappen" : "Deckbereich ausklappen"}
          onClick={() => setDeckPickerOpen((current) => !current)}
        >
          {deckPickerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {deckPickerOpen ? (
        <>
          <p className="meta deckStorageMeta" title={storagePath || "Deckspeicher"}>
            Deckspeicher {storagePath ? "aktiv" : "wird geladen"}
          </p>
          <div className="deckCreateActions">
            <button className="button deckRunner" onClick={() => createBlankDeck("runner")}>
              <Plus size={15} />
              Neues Runner-Deck
            </button>
            <button className="button deckCorp" onClick={() => createBlankDeck("corp")}>
              <Plus size={15} />
              Neues Korp-Deck
            </button>
            <button className={`button ${importOpen ? "primary" : ""}`} onClick={() => setImportOpen((current) => !current)} type="button" aria-expanded={importOpen}>
              <Upload size={15} />
              Import
            </button>
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
                Korp
              </button>
            </div>
          </div>
          <div className="deckSelectGrid">
            <label>
              Deck anzeigen
              <select value={selectedDeckSelectValue} onChange={(event) => onSelectDeck(event.target.value)} disabled={filteredLocalDecks.length === 0}>
                <option value="">Kein lokales Deck</option>
                {filteredLocalDecks.map((deck) => (
                  <option value={deck.deckId} key={deck.deckId}>
                    {sideLabel(deck.side)} · {deck.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      ) : null}
    </section>
  );
  return (
    <section className="deckPanel panel">
      <div className="deckWorkspace">
        <div className="deckEditor">
          {selectedDeck ? null : deckManagementPanel}
          {selectedDeck ? (
            <>
              <div className={`deckBuilderGrid ${deckEditorMode === "table" ? "deckBuilderGridTableMode" : ""}`} style={deckEditorMode === "table" ? deckTableStyle : undefined}>
                {deckEditorMode === "table" ? null : (
                  <aside className="deckPreviewColumn">
                    {deckManagementPanel}
                    {previewCard ? (
                      <DeckBuilderPreview
                        card={previewCard}
                        detail={cardDetailsById[previewCard.catalogCardId]}
                        quantity={previewQuantity}
                        onAdd={() => onUpdateQuantity(previewCard.catalogCardId, previewQuantity + 1)}
                        onRemove={() => onUpdateQuantity(previewCard.catalogCardId, previewQuantity - 1)}
                      />
                    ) : (
                      <p className="meta deckEmpty">Wähle eine Karte für die Vorschau.</p>
                    )}
                  </aside>
                )}
                <section className={`deckLibraryPanel ${deckEditorMode === "table" ? "deckTableLibraryPanel" : ""}`}>
                  <div className="deckBuilderPanelHeader">
                    <div>
                      <h3>Kartenbibliothek</h3>
                      <p className="meta">
                        {libraryCards.length} von {rarityFilteredPlayableCards.length} sichtbaren gültigen {sideLabel(selectedDeck.side)}-Karten
                      </p>
                    </div>
                    <div className="deckLibraryHeaderActions">
                      {deckEditorMode === "table" ? (
                        <button className={`deckLibraryFilterButton ${tableLibraryControlsOpen ? "active" : ""}`} type="button" onClick={() => setTableLibraryControlsOpen((current) => !current)} aria-expanded={tableLibraryControlsOpen}>
                          <SlidersHorizontal size={14} />
                          Ansicht
                        </button>
                      ) : null}
                      <button className={`deckLibraryFilterButton ${builderFiltersOpen ? "active" : ""}`} type="button" onClick={() => setBuilderFiltersOpen((current) => !current)} aria-expanded={builderFiltersOpen}>
                        <ListFilter size={14} />
                        Filter
                      </button>
                    </div>
                  </div>
                  {builderFiltersOpen ? (
                    <div className="deckBuilderTypes">
                      <div className="deckSourceFilter" role="group" aria-label="Kartenset anzeigen">
                        {DECK_SOURCE_FILTERS.map((filter) => (
                          <button className={builderSetFilter === filter.key ? "active" : ""} disabled={builderSetCounts[filter.key] === 0} key={filter.key} onClick={() => setBuilderSetFilter(filter.key)} type="button" aria-pressed={builderSetFilter === filter.key}>
                            <span>{filter.label}</span>
                            <small>{builderSetCounts[filter.key]}</small>
                          </button>
                        ))}
                      </div>
                      <div className="deckSourceFilter deckRarityFilter" role="group" aria-label="Rarität anzeigen">
                        {CATALOG_RARITY_FILTERS.map((filter) => (
                          <button className={builderRarityFilter === filter.key ? "active" : ""} disabled={builderRarityCounts[filter.key] === 0} key={filter.key} onClick={() => setBuilderRarityFilter(filter.key)} type="button" aria-pressed={builderRarityFilter === filter.key}>
                            <span>{filter.label}</span>
                            <small>{builderRarityCounts[filter.key]}</small>
                          </button>
                        ))}
                      </div>
                      <label className={`deckBuilderToggle ${builderOnlyInDeck ? "checked" : ""}`}>
                        <input checked={builderOnlyInDeck} onChange={(event) => setBuilderOnlyInDeck(event.target.checked)} type="checkbox" />
                        Nur im Deck
                      </label>
                      <div className="deckBuilderTypeActions">
                        <button type="button" onClick={() => setVisibleBuilderTypes(true)}>
                          Alle Typen
                        </button>
                        <button type="button" onClick={() => setVisibleBuilderTypes(false)}>
                          Keine Typen
                        </button>
                      </div>
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
                  ) : null}
                  <label className="deckBuilderSearch">
                    Suche
                    <span className="deckSearchInputWrap">
                      <input value={builderSearch} onChange={(event) => setBuilderSearch(event.target.value)} placeholder="Titel, Regeltext, Typ, Subtyp" />
                      {builderSearch ? (
                        <button aria-label="Suche zurücksetzen" className="deckSearchClearButton" onClick={() => setBuilderSearch("")} type="button">
                          <X size={14} />
                        </button>
                      ) : null}
                    </span>
                  </label>
                  {deckEditorMode === "table" && tableLibraryControlsOpen ? (
                    <div className="deckTableLibraryControls" aria-label="Bibliotheksdarstellung">
                      <label>
                        <span>Kartengröße</span>
                        <input min={DECK_TABLE_LIBRARY_CARD_WIDTH_MIN} max={DECK_TABLE_LIBRARY_CARD_WIDTH_MAX} step={DECK_TABLE_LIBRARY_CARD_WIDTH_STEP} type="range" value={tableLibraryCardWidth} onChange={(event) => updateTableLibraryCardWidthSetting(Number(event.target.value))} />
                      </label>
                      <label>
                        <span>Überlappung</span>
                        <input min={DECK_TABLE_LIBRARY_OVERLAP_MIN} max={DECK_TABLE_LIBRARY_OVERLAP_MAX} step={DECK_TABLE_LIBRARY_OVERLAP_STEP} type="range" value={tableLibraryOverlapPercent} onChange={(event) => updateTableLibraryOverlapSetting(Number(event.target.value))} />
                      </label>
                    </div>
                  ) : null}
                  <div className="deckLibraryList">
                    {libraryCards.map((card, index) => (
                      deckEditorMode === "table" ? (
                        <DeckTableLibraryCard
                          card={card}
                          detail={cardDetailsById[card.catalogCardId]}
                          key={card.catalogCardId}
                          overlapped={index >= tableLibraryColumnCount}
                          quantity={deckQuantities.get(card.catalogCardId) ?? 0}
                          selected={previewCard?.catalogCardId === card.catalogCardId}
                          stackIndex={index + 1}
                          onAddToFirstPile={() => tableLayout && addTableCardToPile(card.catalogCardId, tableLayout.piles[0]?.id ?? "pile-1")}
                          onSelect={() => setPreviewCardId(card.catalogCardId)}
                        />
                      ) : (
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
                      )
                    ))}
                    {libraryCards.length === 0 ? <p className="meta deckEmpty">Keine passende Karte gefunden.</p> : null}
                  </div>
                </section>
                <div className="deckListColumn">
                  {deckEditorMode === "table" ? null : (
                    <section className={`deckDetailsPanel ${deckDetailsOpen ? "" : "collapsed"}`}>
                      <div className="deckDetailsHeader">
                        <div>
                          <h3>Deckdetails</h3>
                        </div>
                        <button
                          className="button iconOnly"
                          type="button"
                          aria-expanded={deckDetailsOpen}
                          aria-label={deckDetailsOpen ? "Deckdetails einklappen" : "Deckdetails ausklappen"}
                          title={deckDetailsOpen ? "Deckdetails einklappen" : "Deckdetails ausklappen"}
                          onClick={() => setDeckDetailsOpen((current) => !current)}
                        >
                          {deckDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {deckDetailsOpen ? (
                        <>
                          <div className="deckSelectGrid">
                            <label>
                              Deckname ändern
                              <input value={selectedDeck.name} onChange={(event) => onUpdateDeck({ ...selectedDeck, name: event.target.value })} />
                            </label>
                          </div>
                          <div className="deckFormGrid">
                            <label>
                              Notiz
                              <input value={selectedDeck.notes ?? ""} onChange={(event) => onUpdateDeck({ ...selectedDeck, notes: event.target.value })} />
                            </label>
                          </div>
                        </>
                      ) : null}
                    </section>
                  )}
                  {deckEditorMode === "table" && tableLayout ? (
                    <DeckTableBoard
                      layout={tableLayout}
                      deckName={selectedDeck.name}
                      cardLookup={cardLookup}
                      cardDetailsById={cardDetailsById}
                      activeMenuKey={tableCardMenuKey}
                      cardWidth={tableCardWidth}
                      controlsOpen={tableControlsOpen}
                      costDetailsReady={deckTableCostDetailsReady}
                      overlapPercent={tableOverlapPercent}
                      tableWidth={tableWidthControlValue}
                      dirty={selectedDeckDirty}
                      selectedCardIndexes={selectedTableCardIndexes}
                      selectedCardKeys={selectedTableCardKeySet}
                      selectedCards={selectedTableCards}
                      selectionMode={tableSelectionMode}
                      onBack={() => setDeckEditorMode("list")}
                      onCardClick={handleTableCardClick}
                      onClearSelection={clearTableSelection}
                      onDuplicateCard={duplicateTableCard}
                      onMenu={setTableCardMenuKey}
                      onDropCard={handleTableDrop}
                      onRenamePile={renameTablePile}
                      onRemoveCard={removeTableCardFromPile}
                      onArrangeDeck={arrangeTableDeck}
                      onSave={onSave}
                      onSelectPile={toggleTablePileSelection}
                      onSetTableWidth={updateTableWidthSetting}
                      onSetCardWidth={updateTableCardWidthSetting}
                      onToggleControls={() => setTableControlsOpen((current) => !current)}
                      onSetOverlapPercent={updateTableOverlapSetting}
                      onSetPileCount={setTablePileCount}
                      onShowPileNames={setTablePileNamesVisible}
                      onSetPileSortMode={setTablePileSortMode}
                      onToggleSelectionMode={toggleTableSelectionMode}
                    />
                  ) : (
                    <section className="deckListPanel">
                      <div className="deckBuilderPanelHeader">
                        <div>
                          <h3>Deckliste</h3>
                          <p className="meta">{totalCards} Karten im aktuellen Entwurf</p>
                        </div>
                        <button className="button deckTableEnterButton" onClick={() => setDeckEditorMode("table")} type="button">
                          <Move size={15} />
                          Auf Tisch bearbeiten
                        </button>
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
                  )}
                  {deckEditorMode === "table" ? null : (
                  <section className="deckControlsPanel">
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
                        {useForMatchLabel}
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
                  </section>
                  )}
                </div>
              </div>
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
      <DeckCardThumb
        cardId={card.catalogCardId}
        title={card.title}
        cardType={card.type}
        preview
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
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

function DeckTableBoard({
  layout,
  deckName,
  cardLookup,
  cardDetailsById,
  activeMenuKey,
  cardWidth,
  controlsOpen,
  costDetailsReady,
  overlapPercent,
  tableWidth,
  dirty,
  selectedCardIndexes,
  selectedCardKeys,
  selectedCards,
  selectionMode,
  onBack,
  onCardClick,
  onClearSelection,
  onDuplicateCard,
  onMenu,
  onDropCard,
  onRenamePile,
  onRemoveCard,
  onArrangeDeck,
  onSave,
  onSelectPile,
  onSetTableWidth,
  onSetCardWidth,
  onSetOverlapPercent,
  onSetPileCount,
  onToggleControls,
  onShowPileNames,
  onSetPileSortMode,
  onToggleSelectionMode
}: {
  layout: DeckTableLayout;
  deckName: string;
  cardLookup: Map<string, CatalogCardSummary>;
  cardDetailsById: Record<string, CatalogCardDetail>;
  activeMenuKey: string | null;
  cardWidth: number;
  controlsOpen: boolean;
  costDetailsReady: boolean;
  overlapPercent: number;
  tableWidth: number;
  dirty: boolean;
  selectedCardIndexes: Map<string, number>;
  selectedCardKeys: Set<string>;
  selectedCards: DeckTableSelectionEntry[];
  selectionMode: boolean;
  onBack(): void;
  onCardClick(event: ReactMouseEvent<HTMLElement>, pileId: string, entry: DeckTableLayoutEntry): void;
  onClearSelection(): void;
  onDuplicateCard(pileId: string, cardId: string, sourceOrder: number, copiesToAdd: number): void;
  onMenu(key: string | null): void;
  onDropCard(event: ReactDragEvent<HTMLElement>, pileId: string, targetOrder?: number): void;
  onRenamePile(pileId: string, name: string): void;
  onRemoveCard(pileId: string, cardId: string, sourceOrder: number): void;
  onArrangeDeck(mode: DeckTableArrangeMode): void;
  onSave(): void;
  onSelectPile(pileId: string): void;
  onSetTableWidth(value: number): void;
  onSetCardWidth(value: number): void;
  onSetOverlapPercent(value: number): void;
  onSetPileCount(value: number): void;
  onToggleControls(): void;
  onShowPileNames(visible: boolean): void;
  onSetPileSortMode(pileId: string, sortMode: DeckTablePileSortMode): void;
  onToggleSelectionMode(): void;
}) {
  const totalCards = layout.piles.reduce((sum, pile) => sum + pile.entries.reduce((entrySum, entry) => entrySum + entry.quantity, 0), 0);
  return (
    <section className="deckTableBoardPanel">
      <div className="deckBuilderPanelHeader deckTableBoardHeader">
        <div>
          <h3>Deck-Tisch</h3>
          <p className="meta">{deckName} · {totalCards} Karten auf {layout.piles.length} Stapeln</p>
        </div>
        <div className="deckTableBoardTools">
          <button className={`button deckTableSelectionButton ${selectionMode ? "active" : ""}`} type="button" onClick={onToggleSelectionMode} aria-pressed={selectionMode}>
            <Check size={15} />
            Auswahl
          </button>
          {selectionMode ? (
            <>
              <span className="deckTableSelectionCount">{selectedCards.length} ausgewählt</span>
              {selectedCards.length > 0 ? (
                <button className="button deckTableSelectionClear" type="button" onClick={onClearSelection}>
                  <X size={14} />
                  Lösen
                </button>
              ) : null}
            </>
          ) : null}
          <span className={`deckTableSaveState ${dirty ? "dirty" : "ok"}`}>{dirty ? "Ungespeichert" : "Gespeichert"}</span>
          <button className="button primary deckTableSaveButton" type="button" onClick={onSave} disabled={!dirty}>
            <Save size={15} />
            Speichern
          </button>
          <button className={`button deckTableViewButton ${controlsOpen ? "active" : ""}`} type="button" onClick={onToggleControls} aria-expanded={controlsOpen}>
            <SlidersHorizontal size={15} />
            Ansicht
          </button>
          <button className="button" type="button" onClick={onBack}>
            Zurück zur Liste
          </button>
        </div>
      </div>
      {controlsOpen ? (
        <div className="deckTableControls" aria-label="Tischdarstellung">
          <label>
            <span>Tischbreite</span>
            <input min={DECK_TABLE_LIBRARY_WIDTH_MIN} max={DECK_TABLE_LIBRARY_WIDTH_MAX} step={DECK_TABLE_LIBRARY_WIDTH_STEP} type="range" value={tableWidth} onChange={(event) => onSetTableWidth(Number(event.target.value))} />
          </label>
          <label>
            <span>Kartengröße</span>
            <input min={DECK_TABLE_CARD_WIDTH_MIN} max={DECK_TABLE_CARD_WIDTH_MAX} step={DECK_TABLE_CARD_WIDTH_STEP} type="range" value={cardWidth} onChange={(event) => onSetCardWidth(Number(event.target.value))} />
          </label>
          <label>
            <span>Überlappung</span>
            <input min={DECK_TABLE_OVERLAP_MIN} max={DECK_TABLE_OVERLAP_MAX} step={DECK_TABLE_OVERLAP_STEP} type="range" value={overlapPercent} onChange={(event) => onSetOverlapPercent(Number(event.target.value))} />
          </label>
          <label>
            <span>Stapel</span>
            <input min={MIN_DECK_TABLE_PILE_COUNT} max={MAX_DECK_TABLE_PILE_COUNT} step={1} type="range" value={layout.piles.length} onChange={(event) => onSetPileCount(Number(event.target.value))} />
            <b>{layout.piles.length}</b>
          </label>
          <label className={`deckBuilderToggle deckTableNameToggle ${layout.showPileNames ? "checked" : ""}`}>
            <input checked={layout.showPileNames} onChange={(event) => onShowPileNames(event.target.checked)} type="checkbox" />
            Stapelnamen
          </label>
          <label>
            <span>Deck ordnen</span>
            <select
              defaultValue=""
              onChange={(event) => {
                const mode = event.currentTarget.value as "" | DeckTableArrangeMode;
                if (mode) onArrangeDeck(mode);
                event.currentTarget.value = "";
              }}
            >
              <option value="">Auswählen</option>
              <option value="type">Nach Typen auf Stapel verteilen</option>
              <option value="install-piles" disabled={!costDetailsReady}>
                {costDetailsReady ? "Nach Kartenkosten auf Stapel verteilen" : "Kartenkosten werden geladen"}
              </option>
              <option value="name">Alle Stapel nach Name</option>
              <option value="install">Alle Stapel nach Installkosten</option>
              <option value="rez">Alle Stapel nach Rez-Kosten</option>
              <option value="trash">Alle Stapel nach Trashkosten</option>
              <option value="cost">Alle Stapel nach Kosten</option>
              <option value="strength">Alle Stapel nach Stärke</option>
              <option value="agenda">Alle Stapel nach Agenda-Punkten</option>
            </select>
          </label>
        </div>
      ) : null}
      <div className="deckTableGrid">
        {layout.piles.map((pile) => (
          <DeckTablePileView
            activeMenuKey={activeMenuKey}
            cardDetailsById={cardDetailsById}
            cardLookup={cardLookup}
            key={pile.id}
            selectedCardIndexes={selectedCardIndexes}
            selectedCardKeys={selectedCardKeys}
            selectedCards={selectedCards}
            selectionMode={selectionMode}
            onCardClick={onCardClick}
            onDuplicateCard={onDuplicateCard}
            onDropCard={onDropCard}
            onMenu={onMenu}
            onRenamePile={onRenamePile}
            onRemoveCard={onRemoveCard}
            onSelectPile={onSelectPile}
            onSetPileSortMode={onSetPileSortMode}
            pile={pile}
            showName={layout.showPileNames}
          />
        ))}
      </div>
    </section>
  );
}

function DeckTablePileView({
  pile,
  showName,
  cardLookup,
  cardDetailsById,
  activeMenuKey,
  selectedCardIndexes,
  selectedCardKeys,
  selectedCards,
  selectionMode,
  onCardClick,
  onDuplicateCard,
  onMenu,
  onDropCard,
  onRenamePile,
  onRemoveCard,
  onSelectPile,
  onSetPileSortMode
}: {
  pile: DeckTablePile;
  showName: boolean;
  cardLookup: Map<string, CatalogCardSummary>;
  cardDetailsById: Record<string, CatalogCardDetail>;
  activeMenuKey: string | null;
  selectedCardIndexes: Map<string, number>;
  selectedCardKeys: Set<string>;
  selectedCards: DeckTableSelectionEntry[];
  selectionMode: boolean;
  onCardClick(event: ReactMouseEvent<HTMLElement>, pileId: string, entry: DeckTableLayoutEntry): void;
  onDuplicateCard(pileId: string, cardId: string, sourceOrder: number, copiesToAdd: number): void;
  onMenu(key: string | null): void;
  onDropCard(event: ReactDragEvent<HTMLElement>, pileId: string, targetOrder?: number): void;
  onRenamePile(pileId: string, name: string): void;
  onRemoveCard(pileId: string, cardId: string, sourceOrder: number): void;
  onSelectPile(pileId: string): void;
  onSetPileSortMode(pileId: string, sortMode: DeckTablePileSortMode): void;
}) {
  const cardCount = pile.entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const pileSelectionKeys = pile.entries.map((entry) => deckTableSelectionKey(pile.id, entry.cardId, entry.order));
  const pileSelected = pileSelectionKeys.length > 0 && pileSelectionKeys.every((key) => selectedCardKeys.has(key));
  return (
    <section
      className="deckTablePile"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDropCard(event, pile.id)}
      aria-label={`${pile.name || "Stapel"} mit ${cardCount} Karten`}
    >
      <div className="deckTablePileHeader">
        <div className="deckTablePileTitleRow">
          <button
            aria-label={`${pile.name || `Stapel ${pile.order + 1}`} verschieben`}
            className="deckTablePileMoveHandle"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-netgrid-pile", JSON.stringify({ pileId: pile.id }));
              event.dataTransfer.effectAllowed = "move";
            }}
            type="button"
          >
            <Move size={12} />
          </button>
          {showName ? (
            <input value={pile.name ?? ""} onChange={(event) => onRenamePile(pile.id, event.target.value)} aria-label="Stapelname" />
          ) : (
            <strong>Stapel {pile.order + 1}</strong>
          )}
          {selectionMode ? (
            <button className={`deckTableSelectPileButton ${pileSelected ? "active" : ""}`} onClick={() => onSelectPile(pile.id)} type="button">
              Alle
            </button>
          ) : null}
        </div>
        <select
          aria-label={`Sortierung für ${pile.name || `Stapel ${pile.order + 1}`}`}
          value={pile.sortMode}
          onChange={(event) => {
            const sortMode = event.currentTarget.value as DeckTablePileSortMode;
            onSetPileSortMode(pile.id, sortMode);
          }}
        >
          <option value="free">{deckTablePileSortModeLabel("free")}</option>
          {(["name", "type", "install", "rez", "trash", "cost", "strength", "agenda"] as DeckTableSortKey[]).map((sortBy) => (
            <option value={sortBy} key={sortBy}>
              {deckTableSortLabel(sortBy)}
            </option>
          ))}
        </select>
      </div>
      <div className="deckTablePileCards">
        {pile.entries.map((entry, index) => {
          const card = cardLookup.get(entry.cardId) ?? null;
          const detail = cardDetailsById[entry.cardId];
          const menuKey = `${pile.id}:${entry.cardId}:${entry.order}`;
          const selectionKey = deckTableSelectionKey(pile.id, entry.cardId, entry.order);
          const selected = selectedCardKeys.has(selectionKey);
          const selectedIndex = selectedCardIndexes.get(selectionKey);
          const dragCards = selected && selectedCards.length > 0 ? selectedCards : [{ pileId: pile.id, cardId: entry.cardId, order: entry.order }];
          return (
            <DeckCardTooltipTrigger
              card={card}
              detail={detail}
              cardId={entry.cardId}
              className={`deckTableCard ${selected ? "selected" : ""}`}
              key={menuKey}
              onSelect={() => undefined}
              style={{ "--deck-table-card-z": index + 1 } as CSSProperties}
            >
              <div
                className="deckTableCardInner"
                draggable
                onClick={(event) => onCardClick(event, pile.id, entry)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/x-netgrid-card", JSON.stringify({ cards: dragCards, cardId: entry.cardId, sourcePileId: pile.id, sourceOrder: entry.order, quantity: 1 }));
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDrop={(event) => {
                  event.stopPropagation();
                  onDropCard(event, pile.id, entry.order);
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  onMenu(activeMenuKey === menuKey ? null : menuKey);
                }}
              >
                {card ? (
                  <DeckCardThumb
                    cardId={card.catalogCardId}
                    title={card.title}
                    cardType={card.type}
                    table
                    {...(detail?.text ? { rulesText: detail.text } : {})}
                    {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
                    {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
                  />
                ) : (
                  <span className="deckTableMissingCard">{entry.cardId}</span>
                )}
                <span className="deckTableCardCaption">{card?.title ?? entry.cardId}</span>
                {selectedIndex ? <span className="deckTableSelectionBadge">{selectedIndex}</span> : null}
                {activeMenuKey === menuKey ? (
                  <span className="deckTableCardMenu" onClick={(event) => event.stopPropagation()}>
                    <button type="button" onClick={() => onDuplicateCard(pile.id, entry.cardId, entry.order, 1)}>
                      Kopie
                    </button>
                    <button type="button" onClick={() => onDuplicateCard(pile.id, entry.cardId, entry.order, DECK_TABLE_MAX_COPIES_PER_CARD)}>
                      Bis 3
                    </button>
                    <button type="button" onClick={() => onRemoveCard(pile.id, entry.cardId, entry.order)}>
                      Entfernen
                    </button>
                  </span>
                ) : null}
              </div>
            </DeckCardTooltipTrigger>
          );
        })}
        {pile.entries.length === 0 ? <p className="meta deckTablePileEmpty">Karte hier ablegen</p> : null}
      </div>
    </section>
  );
}

function DeckTableLibraryCard({
  card,
  detail,
  overlapped,
  quantity,
  selected,
  stackIndex,
  onAddToFirstPile,
  onSelect
}: {
  card: CatalogCardSummary;
  detail: DeckBuilderCardDetail | undefined;
  overlapped: boolean;
  quantity: number;
  selected: boolean;
  stackIndex: number;
  onAddToFirstPile(): void;
  onSelect(): void;
}) {
  return (
    <DeckCardTooltipTrigger
      card={card}
      detail={detail}
      cardId={card.catalogCardId}
      className={`deckTableLibraryCard ${overlapped ? "overlapped" : ""} ${quantity > 0 ? "inDeck" : ""} ${selected ? "selected" : ""}`}
      onSelect={onSelect}
      style={{ "--deck-table-card-z": stackIndex } as CSSProperties}
    >
      <div
        draggable
        onDoubleClick={(event) => {
          event.stopPropagation();
          onAddToFirstPile();
        }}
        onDragStart={(event) => {
          event.dataTransfer.setData("application/x-netgrid-card", JSON.stringify({ cardId: card.catalogCardId }));
          event.dataTransfer.effectAllowed = "copy";
        }}
      >
        <DeckCardThumb
          cardId={card.catalogCardId}
          title={card.title}
          cardType={card.type}
          {...(detail?.text ? { rulesText: detail.text } : {})}
          {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
          {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
        />
        <strong>{card.title}</strong>
        <span>{formatCatalogTypeLine(card)}</span>
        {quantity > 0 ? <b>x{quantity}</b> : null}
      </div>
    </DeckCardTooltipTrigger>
  );
}

function DeckCardTooltipTrigger({
  card,
  detail,
  cardId,
  className,
  style,
  onSelect,
  children
}: {
  card: CatalogCardSummary | null;
  detail: DeckBuilderCardDetail | undefined;
  cardId: string;
  className: string;
  style?: CSSProperties;
  onSelect(): void;
  children: ReactNode;
}) {
  const { hoverOpenDelayMs, mode: tooltipMode } = useCardTooltipSettings();
  const { tooltipPercent } = useCardScaleSettings();
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tooltipPositionStyle, setTooltipPositionStyle] = useState<CSSProperties>({});
  const [tooltipPlacement, setTooltipPlacement] = useState<"above" | "below">("below");
  const [tooltipHoverVisible, setTooltipHoverVisible] = useState(false);
  const [tooltipFocusVisible, setTooltipFocusVisible] = useState(false);

  const detailLines = card && detail ? catalogDetailLines(detail) : [];
  const rulesText = card && detail ? detail.text : "";
  const hasRulesLines = rulesText.length > 0;
  const tooltipText = card ? deckBuilderCardTooltip(card, detail) : cardId;
  const tooltipImageId = detail?.definitionId ?? detail?.catalogCardId ?? card?.catalogCardId ?? cardId;
  const overlayImageId = detail?.definitionId;
  const tooltipImageUrl = tooltipImageId ? localCardImageUrl(tooltipImageId) : undefined;
  const showImageTooltip = tooltipMode === "image" && Boolean(tooltipImageUrl);
  const hasTooltipTextContent = Boolean(card && (card.title || detailLines.length > 0 || hasRulesLines));
  const tooltipEnabled = Boolean(card) && (showImageTooltip || hasTooltipTextContent);
  const tooltipId = tooltipEnabled && card ? `deck-card-tooltip-${card.catalogCardId.replace(/[^A-Za-z0-9_-]/g, "-")}` : undefined;
  const nativeTitle = tooltipEnabled ? undefined : tooltipText;
  const tooltipStats = detail
    ? [
        detail.numeric.cost !== null && detail.numeric.cost !== undefined ? { icon: "¢", label: "Kosten", value: String(detail.numeric.cost) } : null,
        detail.numeric.installCost !== null && detail.numeric.installCost !== undefined ? { icon: "↓", label: "Install", value: String(detail.numeric.installCost) } : null,
        detail.numeric.rezCost !== null && detail.numeric.rezCost !== undefined ? { icon: "R", label: "Rez", value: String(detail.numeric.rezCost) } : null,
        detail.numeric.trashCost !== null && detail.numeric.trashCost !== undefined ? { icon: "🗑", label: "Trash", value: String(detail.numeric.trashCost) } : null,
        detail.numeric.strength !== null && detail.numeric.strength !== undefined ? { icon: "⚔", label: "Stärke", value: String(detail.numeric.strength) } : null,
        detail.numeric.memoryCost !== null && detail.numeric.memoryCost !== undefined ? { icon: "MU", label: "MU", value: String(detail.numeric.memoryCost) } : null,
        detail.numeric.advancementRequirement !== null && detail.numeric.advancementRequirement !== undefined ? { icon: "⟐", label: "Benötigt", value: String(detail.numeric.advancementRequirement) } : null
      ].filter((entry): entry is { icon: string; label: string; value: string } => entry !== null)
    : [];
  const showHardwareOverlay = Boolean(tooltipImageUrl) && card?.type === "hardware" && Boolean(overlayImageId) && hasGeneratedCardArt(overlayImageId);
  const showOperationOverlay = Boolean(tooltipImageUrl) && card?.type === "operation" && Boolean(overlayImageId) && hasGeneratedCardArt(overlayImageId);
  const hasSubroutineMarkers = rulesTextLines(rulesText).some((line) => isSubroutineRuleLine(card?.type ?? "", rulesText, line));
  const tooltipScale = Math.max(0.5, tooltipPercent / 100);
  const showTooltip = tooltipEnabled && (tooltipHoverVisible || tooltipFocusVisible);

  const clearTooltipOpenTimer = () => {
    if (tooltipOpenTimerRef.current !== null) {
      clearTimeout(tooltipOpenTimerRef.current);
      tooltipOpenTimerRef.current = null;
    }
  };

  const clearTooltipCloseTimer = () => {
    if (tooltipCloseTimerRef.current !== null) {
      clearTimeout(tooltipCloseTimerRef.current);
      tooltipCloseTimerRef.current = null;
    }
  };

  const estimatedTooltipHeight = (): number => {
    if (showImageTooltip) return 320;
    const ruleLineCount = rulesTextLines(rulesText).length;
    const base = tooltipMode === "enhanced" ? 132 : 78;
    return Math.min(320, Math.round((base + ruleLineCount * 20) * tooltipScale));
  };

  const computedTooltipWidth = (): number => {
    const viewportLimit = Math.max(160, window.innerWidth - 32);
    const unscaled = showImageTooltip ? 220 : 300;
    return Math.min(Math.round(unscaled * tooltipScale), viewportLimit);
  };

  const updateTooltipPlacement = () => {
    const element = triggerRef.current;
    if (!element) return;
    const cardRect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - cardRect.bottom;
    const spaceAbove = cardRect.top;
    const tooltipHeight = estimatedTooltipHeight();
    const nextTooltipPlacement = spaceBelow < tooltipHeight && spaceAbove > spaceBelow ? "above" : "below";
    if (tooltipEnabled) {
      const tooltipWidth = computedTooltipWidth();
      const margin = 16;
      const left = Math.max(margin, Math.min(cardRect.left + 6, window.innerWidth - tooltipWidth - margin));
      setTooltipPositionStyle(
        nextTooltipPlacement === "below"
          ? { left: `${left}px`, top: `${cardRect.bottom + 8}px`, width: `${tooltipWidth}px` }
          : { left: `${left}px`, top: `${cardRect.top - 8}px`, width: `${tooltipWidth}px` }
      );
    }
    if (tooltipEnabled) setTooltipPlacement(nextTooltipPlacement);
  };

  const scheduleTooltipOpen = () => {
    if (!tooltipEnabled) return;
    clearTooltipCloseTimer();
    if (tooltipHoverVisible) return;
    clearTooltipOpenTimer();
    tooltipOpenTimerRef.current = setTimeout(() => {
      tooltipOpenTimerRef.current = null;
      setTooltipHoverVisible(true);
    }, hoverOpenDelayMs);
  };

  const scheduleTooltipClose = () => {
    clearTooltipOpenTimer();
    clearTooltipCloseTimer();
    tooltipCloseTimerRef.current = setTimeout(() => {
      tooltipCloseTimerRef.current = null;
      setTooltipHoverVisible(false);
    }, CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS);
  };

  useEffect(() => {
    if (tooltipEnabled) return;
    clearTooltipOpenTimer();
    clearTooltipCloseTimer();
    setTooltipHoverVisible(false);
    setTooltipFocusVisible(false);
    setTooltipPositionStyle({});
  }, [tooltipEnabled]);

  useEffect(() => {
    if (!showTooltip) return;
    updateTooltipPlacement();
  }, [showTooltip, tooltipMode]);

  useEffect(
    () => () => {
      clearTooltipOpenTimer();
      clearTooltipCloseTimer();
    },
    []
  );

  return (
    <article
      className={className}
      style={style}
      onClick={onSelect}
      ref={triggerRef}
      title={nativeTitle}
      aria-describedby={tooltipId}
      onFocus={(event) => {
        updateTooltipPlacement();
        if (tooltipEnabled && event.currentTarget.matches(":focus-visible")) setTooltipFocusVisible(true);
      }}
      onBlur={() => setTooltipFocusVisible(false)}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        updateTooltipPlacement();
        scheduleTooltipOpen();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "touch") return;
        scheduleTooltipClose();
      }}
    >
      {children}
      {showTooltip && tooltipId && card ? (
        <span
          className={`cardTooltip ${tooltipPlacement} mode-${tooltipMode}${showImageTooltip ? " imageOnly" : ""}${showTooltip ? " visible" : ""}`}
          id={tooltipId}
          role="tooltip"
          style={tooltipPositionStyle}
          onPointerEnter={(event) => {
            if (event.pointerType === "touch") return;
            clearTooltipCloseTimer();
            clearTooltipOpenTimer();
            if (!tooltipHoverVisible) setTooltipHoverVisible(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "touch") return;
            scheduleTooltipClose();
          }}
        >
          {showImageTooltip ? (
            <>
              {showHardwareOverlay ? <HardwareImageOverlay title={card.title} rulesText={rulesText} installCost={detail?.numeric.installCost} /> : null}
              {showOperationOverlay ? <OperationImageOverlay title={card.title} rulesText={rulesText} cost={detail?.numeric.cost} /> : null}
              <CardImage className="cardTooltipImage" src={tooltipImageUrl} alt={`Kartenbild ${card.title ?? "Karte"}`} />
            </>
          ) : (
            <>
              <strong>{card.title}</strong>
              {tooltipMode === "enhanced" ? (
                <span className="cardTooltipStats">
                  {tooltipStats.map((stat) => (
                    <span key={`${card.catalogCardId}-tooltip-stat-${stat.label}`} className="cardTooltipStat" title={stat.label}>
                      <span className="icon">{stat.icon}</span>
                      <span>{stat.value}</span>
                    </span>
                  ))}
                </span>
              ) : null}
              {tooltipMode === "enhanced"
                ? detailLines.map((line) => (
                    <span key={`${card.catalogCardId}-tooltip-detail-${line}`}>{line}</span>
                  ))
                : null}
              <span className="cardTooltipText">
                {rulesTextLines(rulesText).map((line, index) => (
                  <span key={`${card.catalogCardId}-tooltip-rules-${index}`} className={hasSubroutineMarkers ? "subroutineLine" : undefined}>
                    {shouldAddFallbackSubroutineMarker(card.type, rulesText, line) ? <SubroutineIcon /> : null}
                    {renderRuleTextSegments(line, `${card.catalogCardId}-tooltip-rules-${index}`)}
                  </span>
                ))}
              </span>
            </>
          )}
        </span>
      ) : null}
    </article>
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
  detail: DeckBuilderCardDetail | undefined;
  quantity: number;
  selected: boolean;
  onAdd(): void;
  onRemove(): void;
  onSelect(): void;
}) {
  const metrics = deckBuilderMetricLine(detail);
  return (
    <DeckCardTooltipTrigger
      card={card}
      detail={detail}
      cardId={card.catalogCardId}
      className={`deckLibraryCard ${quantity > 0 ? "inDeck" : ""} ${selected ? "selected" : ""}`}
      onSelect={onSelect}
    >
      <DeckCardThumb
        cardId={card.catalogCardId}
        title={card.title}
        cardType={card.type}
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
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
    </DeckCardTooltipTrigger>
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
  detail: DeckBuilderCardDetail | undefined;
  quantity: number;
  onIncrement(): void;
  onDecrement(): void;
  onRemove(): void;
  onSelect(): void;
}) {
  const metrics = deckBuilderMetricLine(detail);
  return (
    <DeckCardTooltipTrigger
      card={card}
      detail={detail}
      cardId={cardId}
      className="deckListCard"
      onSelect={onSelect}
    >
      <DeckCardThumb
        cardId={card?.catalogCardId ?? cardId}
        title={card?.title ?? cardId}
        {...(card?.type ? { cardType: card.type } : {})}
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
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
    </DeckCardTooltipTrigger>
  );
}

function DeckCardThumb({
  cardId,
  title,
  cardType,
  rulesText,
  installCost,
  cost,
  large = false,
  preview = false,
  table = false
}: {
  cardId: string;
  title: string;
  cardType?: string;
  rulesText?: string;
  installCost?: number;
  cost?: number;
  large?: boolean;
  preview?: boolean;
  table?: boolean;
}) {
  const imageUrl = localCardImageUrl(cardId);
  const hasGeneratedImage = hasGeneratedCardArt(cardId);
  const showHardwareOverlay = Boolean(imageUrl) && isHardwareCardType(cardType) && hasGeneratedImage;
  const showOperationOverlay = Boolean(imageUrl) && isOperationCardType(cardType) && hasGeneratedImage;
  return (
    <span className={`deckCardThumb ${large ? "large" : ""} ${preview ? "preview" : ""} ${table ? "table" : ""} ${imageUrl ? "hasImage" : ""}`} aria-hidden="true">
      {imageUrl ? (
        <>
          <CardImage src={imageUrl} decorative />
          {showHardwareOverlay ? (
            <HardwareImageOverlay
              title={title}
              className={preview ? "deckHardwareOverlay preview" : "deckHardwareOverlay"}
              maxLines={preview ? 2 : 1}
              {...(rulesText ? { rulesText } : {})}
              {...(installCost !== undefined ? { installCost } : {})}
            />
          ) : showOperationOverlay ? (
            <OperationImageOverlay
              title={title}
              className={preview ? "deckHardwareOverlay preview" : "deckHardwareOverlay"}
              maxLines={preview ? 2 : 1}
              {...(rulesText ? { rulesText } : {})}
              {...(cost !== undefined ? { cost } : {})}
            />
          ) : null}
        </>
      ) : (
        <span className="deckCardThumbFallback">{title.slice(0, 1)}</span>
      )}
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

function StatusBadges({ statuses, compact = false, showExpert = false }: { statuses: CatalogStatuses; compact?: boolean; showExpert?: boolean }) {
  const statusKeys = showExpert ? CATALOG_STATUS_FILTER_KEYS : PRIMARY_CATALOG_STATUS_KEYS;
  return (
    <div className={`statusBadges ${compact ? "compact" : ""}`}>
      {statusKeys
        .filter((key) => statuses[key])
        .map((key) => (
          <span className={`statusBadge ${key}`} key={key}>
            {CATALOG_STATUS_LABELS[key]}
          </span>
        ))}
    </div>
  );
}

function CatalogAiHintPanel({ hints }: { hints: CatalogAiHints }) {
  const valueHintEntries = Object.entries(hints.valueHints).filter(([, value]) => Number.isFinite(value));
  return (
    <section className="catalogAiHints">
      <div className="catalogAiHintsHead">
        <strong>KI-Hinweise</strong>
        <span>{CATALOG_STATUS_LABELS.ai_supported}: {hints.aiSupportStatus === "ai_supported" ? "ja" : hints.aiSupportStatus}</span>
      </div>
      <AiHintChips title="Rollen" values={hints.roles} />
      <AiHintChips title="Pläne" values={hints.planRoles} />
      {valueHintEntries.length > 0 ? (
        <div className="catalogAiValueGrid">
          {valueHintEntries.map(([key, value]) => (
            <span key={key}>
              <strong>{value}</strong>
              {formatAiHintLabel(key)}
            </span>
          ))}
        </div>
      ) : null}
      <AiHintChips title="Risiken" values={hints.riskTags} quiet />
      <AiHintChips title="Mechaniken" values={hints.requiredMechanics} quiet />
      <AiHintChips title="Szenarien" values={hints.scenarioRefs.map((ref) => ref.split("#").at(-1) ?? ref)} quiet />
    </section>
  );
}

function AiHintChips({ title, values, quiet = false }: { title: string; values: string[]; quiet?: boolean }) {
  if (values.length === 0) return null;
  return (
    <div className="catalogAiHintRow">
      <span>{title}</span>
      <div>
        {values.map((value) => (
          <small className={quiet ? "quiet" : ""} key={value}>
            {formatAiHintLabel(value)}
          </small>
        ))}
      </div>
    </div>
  );
}

function formatAiHintLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

function ConnectionBadge({ text, state }: { text: string; state: "offline" | "connecting" | "online" }) {
  return <span className={`connection ${state}`}>{text}</span>;
}

function OpponentPanel({
  view,
  connected,
  displayName,
  agendaPointsToWin,
  scoreAreaCards,
  scoreAreaOpen,
  scoreAreaHighlighted,
  onToggleScoreArea
}: {
  view: PlayerView;
  connected: boolean;
  displayName?: string;
  agendaPointsToWin: number;
  scoreAreaCards: VisibleCard[];
  scoreAreaOpen: boolean;
  scoreAreaHighlighted: boolean;
  onToggleScoreArea(): void;
}) {
  const side = opponentSide(view.side);
  const turnSide = turnSideForView(view);
  const isTurn = turnSide === side;
  const RoleIcon = side === "runner" ? RunnerRoleIcon : CorpRoleIcon;
  return (
    <section className={`section sideStatusPanel side-${side} ${isTurn ? "turnActive" : ""}`}>
      <h2><RoleIcon size={16} />{displayName ? `${displayName} · ${sideLabel(side)}` : sideLabel(side)}</h2>
      <div className="stats">
        <CreditBadge credits={view.opponent.credits} />
        <ScoreAreaStat
          value={`${view.opponent.agendaPoints} / ${agendaPointsToWin}`}
          open={scoreAreaOpen}
          highlighted={scoreAreaHighlighted}
          interactive={scoreAreaCards.length > 0}
          onToggle={onToggleScoreArea}
        />
        {side === "runner" ? <Stat value={view.opponent.tags} icon={<TagIcon size={14} />} helpText="Tags markieren den Runner. Viele Tags erlauben der Korp stärkere Folgeaktionen gegen den Runner oder seine Ressourcen." /> : null}
        {side === "runner" ? <Stat value={view.opponent.coreDamage ?? 0} icon={<CoreDamageIcon size={14} />} helpText="Core Damage ist dauerhafter Schaden am Runner. Er senkt die maximale Handkartenzahl und entsteht durch Effekte, die ausdrücklich Core Damage verursachen." /> : null}
      </div>
      <p className="meta statusLine">{connected ? "Verbunden" : "Offline"} · {isTurn ? "Am Zug" : "Wartet"}</p>
    </section>
  );
}

function PlayerPanel({
  view,
  title,
  scoreAreaCards,
  agendaPointsToWin,
  scoreAreaOpen,
  scoreAreaHighlighted,
  onToggleScoreArea
}: {
  view: PlayerView;
  title: string;
  scoreAreaCards: VisibleCard[];
  agendaPointsToWin: number;
  scoreAreaOpen: boolean;
  scoreAreaHighlighted: boolean;
  onToggleScoreArea(): void;
}) {
  const turnSide = turnSideForView(view);
  const isTurn = turnSide === view.side;
  const RoleIcon = view.side === "runner" ? RunnerRoleIcon : CorpRoleIcon;
  return (
    <section className={`section sideStatusPanel side-${view.side} ${isTurn ? "turnActive" : ""}`}>
      <h2><RoleIcon size={16} />{title}</h2>
      <div className="stats">
        <CreditBadge credits={view.own.credits} />
        <ScoreAreaStat
          value={`${view.own.agendaPoints} / ${agendaPointsToWin}`}
          open={scoreAreaOpen}
          highlighted={scoreAreaHighlighted}
          interactive={scoreAreaCards.length > 0}
          onToggle={onToggleScoreArea}
        />
        {view.side === "runner" ? <Stat value={view.own.tags} icon={<TagIcon size={14} />} helpText="Tags markieren den Runner. Viele Tags erlauben der Korp stärkere Folgeaktionen gegen den Runner oder seine Ressourcen." /> : null}
        {view.side === "runner" ? <Stat value={view.own.coreDamage ?? 0} icon={<CoreDamageIcon size={14} />} helpText="Core Damage ist dauerhafter Schaden am Runner. Er senkt die maximale Handkartenzahl und entsteht durch Effekte, die ausdrücklich Core Damage verursachen." /> : null}
      </div>
      <p className="meta statusLine">{isTurn ? "Am Zug" : "Wartet"}</p>
    </section>
  );
}

function ActionSlotMeter({
  side,
  currentClicks,
  displayCapacity,
  active,
  compact = false,
  slotsOnly = false
}: {
  side: Side;
  currentClicks: number;
  displayCapacity: number;
  active: boolean;
  compact?: boolean;
  slotsOnly?: boolean;
}) {
  const display = actionSlotDisplay(side, currentClicks, displayCapacity, active);
  if (slotsOnly) {
    return (
      <div className={`actionSlotsInline ${compact ? "compact" : ""}`} aria-label={`${display.label}${active ? " verfügbar" : " aktuell"}`} data-testid="action-slots">
        <span className="srOnly">{display.label}</span>
        <div className="actionSlots" aria-hidden="true">
          {display.slots.map((slot) => (
            <span className={`actionSlot ${slot.state} ${slot.bonus ? "bonus" : ""}`} key={slot.index} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={`actionResource ${active ? "active" : "inactive"} ${compact ? "compact" : ""}`} aria-label={`${display.label}${active ? " verfügbar" : " aktuell"}`} data-testid="action-slots">
      <div className="resourceStatTop">
        <strong>{display.available}</strong>
        <span className="statLabel">Aktionen</span>
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
    <Stat value={credits} icon={<span className="creditCoin" aria-hidden="true" />} helpText="Credits sind die verfügbare Währung für Karten, Runs, Rezzes und andere Kosten." testId="credit-badge" />
  );
}

function Stat({ label, value, unit, icon, helpText, testId }: { label?: string; value: number | string; unit?: string; icon?: ReactNode; helpText?: string; testId?: string }) {
  const [helpPinned, setHelpPinned] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const statRef = useRef<HTMLDivElement | null>(null);
  const showHelp = Boolean(helpText && (helpPinned || helpVisible));
  const updateTooltipPosition = () => {
    const rect = statRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(260, window.innerWidth - 28);
    const left = Math.min(Math.max(14, rect.right - width), window.innerWidth - width - 14);
    const belowTop = rect.bottom + 8;
    const top = belowTop + 96 < window.innerHeight ? belowTop : Math.max(14, rect.top - 108);
    setTooltipStyle({ left, top, width });
  };
  useEffect(() => {
    if (!showHelp) return;
    updateTooltipPosition();
    window.addEventListener("resize", updateTooltipPosition);
    window.addEventListener("scroll", updateTooltipPosition, true);
    return () => {
      window.removeEventListener("resize", updateTooltipPosition);
      window.removeEventListener("scroll", updateTooltipPosition, true);
    };
  }, [showHelp]);
  return (
    <div
      ref={statRef}
      className={`stat ${helpText ? "hasStatHelp" : ""} ${helpPinned ? "helpPinned" : ""}`}
      tabIndex={helpText ? 0 : undefined}
      aria-label={helpText ? `${label ? `${label}: ` : ""}${value}${unit ? ` ${unit}` : ""}. ${helpText}` : undefined}
      data-testid={testId}
      onMouseEnter={() => {
        if (!helpText) return;
        updateTooltipPosition();
        setHelpVisible(true);
      }}
      onMouseLeave={() => {
        if (!helpPinned) setHelpVisible(false);
      }}
      onFocus={() => {
        if (!helpText) return;
        updateTooltipPosition();
        setHelpVisible(true);
      }}
      onDoubleClick={(event) => {
        if (!helpText) return;
        event.preventDefault();
        updateTooltipPosition();
        setHelpPinned((current) => !current);
      }}
      onBlur={() => {
        setHelpPinned(false);
        setHelpVisible(false);
      }}
    >
      <strong>
        {icon ? <span className="statIcon">{icon}</span> : null}
        <span className="statValue">{value}</span>
        {unit ? <span className="statUnit">{unit}</span> : null}
      </strong>
      {label ? <span className="statLabel">{label}</span> : null}
      {helpText && showHelp ? createPortal(<span className="statHelpTooltip statHelpTooltipFloating" style={tooltipStyle}>{helpText}</span>, document.body) : null}
    </div>
  );
}

function ScoreAreaStat({
  value,
  open,
  highlighted,
  interactive,
  onToggle
}: {
  value: string;
  open: boolean;
  highlighted: boolean;
  interactive: boolean;
  onToggle(): void;
}) {
  const toggleLabel = open ? "Agendas ausblenden" : "Agendas anzeigen";
  const agendaHelpText = "Agenda-Punkte entscheiden das Spiel: Die Korp punktet erzielte Agendas, der Runner gestohlene Agendas.";
  const valueStat = <Stat value={value} icon={<AgendaIcon size={14} />} helpText={agendaHelpText} />;

  if (!interactive) {
    return valueStat;
  }

  return (
    <>
      {valueStat}
      <ScoreAreaToggleButton
        open={open}
        highlighted={highlighted}
        label={`${toggleLabel}. ${agendaHelpText}`}
        helpText={agendaHelpText}
        onToggle={onToggle}
      />
    </>
  );
}

function ScoreAreaToggleButton({
  open,
  highlighted,
  label,
  helpText,
  onToggle
}: {
  open: boolean;
  highlighted: boolean;
  label: string;
  helpText: string;
  onToggle(): void;
}) {
  const [helpPinned, setHelpPinned] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const showHelp = helpPinned || helpVisible;
  const updateTooltipPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(260, window.innerWidth - 28);
    const left = Math.min(Math.max(14, rect.right - width), window.innerWidth - width - 14);
    const belowTop = rect.bottom + 8;
    const top = belowTop + 96 < window.innerHeight ? belowTop : Math.max(14, rect.top - 108);
    setTooltipStyle({ left, top, width });
  };
  useEffect(() => {
    if (!showHelp) return;
    updateTooltipPosition();
    window.addEventListener("resize", updateTooltipPosition);
    window.addEventListener("scroll", updateTooltipPosition, true);
    return () => {
      window.removeEventListener("resize", updateTooltipPosition);
      window.removeEventListener("scroll", updateTooltipPosition, true);
    };
  }, [showHelp]);
  return (
    <button
      ref={buttonRef}
      className={`stat scoreAreaStatCell scoreAreaStatButton hasStatHelp ${open ? "is-open" : ""} ${highlighted ? "cueHighlightSoft" : ""}`}
      type="button"
      onClick={onToggle}
      onMouseEnter={() => {
        updateTooltipPosition();
        setHelpVisible(true);
      }}
      onMouseLeave={() => {
        if (!helpPinned) setHelpVisible(false);
      }}
      onFocus={() => {
        updateTooltipPosition();
        setHelpVisible(true);
      }}
      onBlur={() => {
        setHelpPinned(false);
        setHelpVisible(false);
      }}
      onDoubleClick={(event) => {
        event.preventDefault();
        updateTooltipPosition();
        setHelpPinned((current) => !current);
      }}
      aria-expanded={open}
      aria-label={label}
    >
      <strong className="scoreAreaToggleGlyphs">
        <span className="statIcon"><AgendaIcon size={14} /></span>
        <span className="scoreAreaOpenButtonIcon" aria-hidden="true">
          {open ? <PanelTopClose size={12} /> : <PanelTopOpen size={12} />}
        </span>
      </strong>
      {showHelp ? createPortal(<span className="statHelpTooltip statHelpTooltipFloating" style={tooltipStyle}>{helpText}</span>, document.body) : null}
    </button>
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
        {summary.winner === "action_limit_reached" ? "Limit erreicht" : `${summary.winner === "runner" ? "Runner" : summary.winner === "corp" ? "Korp" : "Draw"} gewinnt`}
        {" · "}
        {summary.replayOk ? "Replay ok" : "Replay prüfen"}
      </p>
      <p className="meta hashLine">{summary.finalStateHash}</p>
      {summary.errors.length > 0 ? <p className="notice">{summary.errors.join(", ")}</p> : null}
    </div>
  );
}

function ArchivesDualStackLane({
  viewerSide,
  visibleCards,
  totalArchivesCount,
  collapsed,
  displayMode,
  selectedContext,
  actionDisabled,
  cardActionsFor,
  onAction,
  onFocus,
  onActionContextSelect,
  enrichCard
}: {
  viewerSide: Side;
  visibleCards: VisibleCard[];
  totalArchivesCount: number;
  collapsed: boolean;
  displayMode: CardDisplayMode;
  selectedContext: ActionContext | null;
  actionDisabled: boolean;
  cardActionsFor(card: VisibleCard): LegalAction[];
  onAction(action: LegalAction): void;
  onFocus(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContextSelect(card: DisplayVisibleCard, hiddenSide?: Side): void;
  enrichCard(card: VisibleCard): DisplayVisibleCard;
}) {
  const { faceupCards, facedownCount } = splitArchiveCardsForDisplay(viewerSide, visibleCards, totalArchivesCount);
  const { archivePercent } = useCardScaleSettings();
  const archiveCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, archivePercent / 100);
  const archiveCardsStyle = useMemo(() => ({ "--archive-card-scale": String(archiveCardScale) } as CSSProperties), [archiveCardScale]);
  const shownFaceupCards = faceupCards.slice(0, ARCHIVES_STACK_PREVIEW_LIMIT);
  const shownFacedownCount = Math.min(ARCHIVES_STACK_PREVIEW_LIMIT, facedownCount);
  const faceupOverflow = Math.max(0, faceupCards.length - shownFaceupCards.length);
  const facedownOverflow = Math.max(0, facedownCount - shownFacedownCount);

  if (collapsed) {
    return <span className="laneCollapsedPlaceholder archiveCollapsedPlaceholder" style={archiveCardsStyle} aria-label="Archive eingeklappt" />;
  }

  if (faceupCards.length === 0 && facedownCount === 0) {
    return (
      <span className="laneEmptyPlaceholder archiveEmptyPlaceholder" style={archiveCardsStyle}>
        Leer
      </span>
    );
  }

  return (
    <div className="archivesDualStack" style={archiveCardsStyle} data-testid="archives-dual-stack">
      {faceupCards.length > 0 ? (
        <div className="archivesPile">
          <div className="archivesPileBody">
            <div className="archivesOverlapRow">
              {shownFaceupCards.map((card) => {
                const displayCard = enrichCard(card);
                return (
                  <CardView
                    key={card.instanceId}
                    card={displayCard}
                    compact
                    displayMode={displayMode}
                    hiddenSide="corp"
                    installedCorpCard={false}
                    selected={selectedContext?.kind === "card" && selectedContext.id === card.instanceId}
                    actions={cardActionsFor(card)}
                    actionDisabled={actionDisabled}
                    onAction={onAction}
                    onFocus={onFocus}
                    onActionContextSelect={onActionContextSelect}
                  />
                );
              })}
              {faceupOverflow > 0 ? <span className="archivesOverflowBadge">+{faceupOverflow}</span> : null}
            </div>
          </div>
        </div>
      ) : null}

      {facedownCount > 0 ? (
        <div className="archivesPile">
          <div className="archivesPileBody">
            <div className="archivesOverlapRow">
              {Array.from({ length: shownFacedownCount }, (_, index) => (
                <CardView
                  key={`archives-facedown-${index}`}
                  card={{ instanceId: `archives-facedown-${index}`, known: false, rezzed: false }}
                  compact
                  displayMode={displayMode}
                  hiddenSide="corp"
                  installedCorpCard={false}
                  actions={[]}
                  actionDisabled
                />
              ))}
              {facedownOverflow > 0 ? <span className="archivesOverflowBadge">+{facedownOverflow}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
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
  actionLabelForAction = contextualCardActionLabel,
  slotClassName,
  positionBadge,
  runPositionActive = false,
  runPositionLabel,
  showAdvancementCounters = true,
  showScoreStateBadges = false,
  choiceSelected = false,
  discardShortcut,
  onFocus,
  onSelect,
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
  actionLabelForAction?: (action: LegalAction) => string;
  slotClassName?: string;
  positionBadge?: string;
  runPositionActive?: boolean;
  runPositionLabel?: string | undefined;
  showAdvancementCounters?: boolean;
  showScoreStateBadges?: boolean;
  choiceSelected?: boolean;
  discardShortcut?: { selected: boolean; disabled: boolean; onToggle(): void };
  onFocus?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onSelect?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContextSelect?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onAction?(action: LegalAction): void;
}) {
  const { hoverOpenDelayMs, mode: tooltipMode } = useCardTooltipSettings();
  const { tooltipPercent } = useCardScaleSettings();
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const tooltipOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTouchTapRef = useRef(0);
  const lastTouchTooltipPinRef = useRef(0);
  const [tooltipPositionStyle, setTooltipPositionStyle] = useState<CSSProperties>({});
  const [tooltipPlacement, setTooltipPlacement] = useState<"above" | "below">("below");
  const [actionMenuPlacement, setActionMenuPlacement] = useState<"above" | "below">("below");
  const [actionMenuPositionStyle, setActionMenuPositionStyle] = useState<CSSProperties>({});
  const [suppressCardTooltip, setSuppressCardTooltip] = useState(false);
  const [tooltipHoverVisible, setTooltipHoverVisible] = useState(false);
  const [tooltipFocusVisible, setTooltipFocusVisible] = useState(false);
  const [tooltipPinnedVisible, setTooltipPinnedVisible] = useState(false);
  const hasCardActions = actions.length > 0;
  const showCardActions = selected && hasCardActions && Boolean(onAction);
  const typeClass = card.known && card.type ? ` ${card.type}` : "";
  const hiddenBackClass = !card.known && hiddenSide ? " hiddenBack" : "";
  const isCompact = compact || displayMode === "compact";
  const modeClass = displayMode === "text-card" ? " textCard" : displayMode === "compact" ? " compactCard" : " placeholderCard";
  const previewCard = preview ? cardWithoutDevelopmentCounters(card) : card;
  const detailLines = card.known ? cardDetailLines(previewCard) : [];
  const rulesText = card.known ? (card.rulesText ?? "") : "";
  const hasRulesText = rulesText.length > 0;
  const hasRulesLines = rulesTextLines(rulesText).length > 0;
  const hasSubroutineMarkers = rulesTextLines(rulesText).some((line) => isSubroutineRuleLine(card.type ?? "", rulesText, line));
  const tooltipText = card.known ? [card.title, ...detailLines, rulesText].filter(Boolean).join("\n") : undefined;
  const tooltipImageUrl = card.known ? (card.definitionId ? localCardImageUrl(card.definitionId) : undefined) ?? card.imageUrl : undefined;
  const showImageTooltip = tooltipMode === "image" && Boolean(tooltipImageUrl);
  const hasTooltipTextContent = Boolean(card.title) || detailLines.length > 0 || hasRulesLines;
  const tooltipAvailable = card.known && !showCardActions && (showImageTooltip || hasTooltipTextContent);
  const canPinTooltip = tooltipAvailable && !onSelect;
  const tooltipEnabled = tooltipAvailable && (!suppressCardTooltip || tooltipPinnedVisible);
  const showTooltip = tooltipEnabled && (tooltipHoverVisible || tooltipFocusVisible || tooltipPinnedVisible);
  const tooltipId = tooltipEnabled ? `card-tooltip-${card.instanceId.replace(/[^A-Za-z0-9_-]/g, "-")}` : undefined;
  const tooltipOwnerId = `card-tooltip-owner-${card.instanceId.replace(/[^A-Za-z0-9_-]/g, "-")}`;
  const nativeTitle = tooltipEnabled || showCardActions || suppressCardTooltip ? undefined : tooltipText;
  const tooltipStats = card.known
    ? [
        card.cost !== undefined ? { icon: "¢", label: "Kosten", value: String(card.cost) } : null,
        card.installCost !== undefined ? { icon: "↓", label: "Install", value: String(card.installCost) } : null,
        card.rezCost !== undefined ? { icon: "R", label: "Rez", value: String(card.rezCost) } : null,
        card.trashCost !== undefined ? { icon: "🗑", label: "Trash", value: String(card.trashCost) } : null,
        card.strength !== undefined ? { icon: "⚔", label: "Stärke", value: String(card.strength) } : null,
        card.memoryCost !== undefined ? { icon: "MU", label: "MU", value: String(card.memoryCost) } : null
      ].filter((entry): entry is { icon: string; label: string; value: string } => entry !== null)
    : [];
  const cardImageUrl = card.known && displayMode === "placeholder" ? card.imageUrl : undefined;
  const visualImageUrl = cardImageUrl;
  const isHardwareImageCard = Boolean(visualImageUrl) && card.known && isHardwareCardType(card.type) && hasGeneratedCardArt(card.definitionId);
  const isOperationImageCard = Boolean(visualImageUrl) && card.known && isOperationCardType(card.type) && hasGeneratedCardArt(card.definitionId);
  const showArtBlock = !visualImageUrl && displayMode === "placeholder";
  const metaText = card.known ? detailLines.join(" · ") : "Verdeckt";
  const showMetaLine = !visualImageUrl && Boolean(metaText) && (!card.known || !compact || displayMode === "compact" || preview);
  const showRulesPreview = !visualImageUrl && card.known && hasRulesText && !isCompact;
  const tooltipScale = Math.max(0.5, tooltipPercent / 100);
  const installedState = installedCorpCard ? corpInstalledCardState(card) : null;
  const installedStateLabel = installedState === "unrezzed" ? "Ungerezzt" : installedState === "rezzed" ? "Gerezzt" : installedState === "hidden" ? "Verdeckt / ungerezzt" : null;
  const advancementCount = showAdvancementCounters && !preview ? Math.max(0, Math.floor(card.advancementCounters ?? 0)) : 0;
  const advancementLabel = advancementCount > 0 ? developmentCountLabel(advancementCount) : null;
  const strengthModifier = preview ? 0 : Math.max(0, Math.floor(card.strengthModifier ?? 0));
  const scoreStateBadges = showScoreStateBadges ? scoreCardStateBadges(card) : [];
  const scoredAgendaCreditSource = showScoreStateBadges ? scoredAgendaCreditCounterSource(card.definitionId) : null;
  const scoredAgendaCredits = scoredAgendaCreditSource ? counterAmount(card, "power") : 0;
  const storedCredits = preview ? 0 : storedCreditAmount(card);
  const recurringCredits = preview ? 0 : recurringCreditAmount(card);
  const shellCounters = preview ? 0 : shellCounterAmount(card);
  const dataRavenCounters = preview ? 0 : dataRavenCounterAmount(card);
  const storedCreditSource = storedCreditSourceLabel(card);
  const storedCreditsAria =
    storedCredits > 0 && storedCreditSource
      ? `${storedCredits} ${storedCredits === 1 ? "Credit" : "Credits"} auf ${storedCreditSource}`
      : null;
  const recurringCreditsAria = recurringCredits > 0 ? `${recurringCredits} wiederkehrende ${creditLabel(recurringCredits)}` : null;
  const shellCountersAria = shellCounters > 0 ? `${shellCounters} Shell-Counter` : null;
  const dataRavenCountersAria = dataRavenCounters > 0 ? `${dataRavenCounters} Data-Raven-Counter` : null;
  const counterAriaSuffix = [storedCreditsAria, recurringCreditsAria, shellCountersAria, dataRavenCountersAria].filter(Boolean).join(", ");
  const cardStateAria = counterAriaSuffix ? `, ${counterAriaSuffix}` : "";
  const cardAriaLabel = showAdvancementCounters && advancementLabel
    ? card.known
      ? `Karte ${card.title}, ${advancementLabel}${cardStateAria}`
      : `Verdeckte Karte, ${advancementLabel}`
    : card.known
      ? `Karte ${card.title}${cardStateAria}`
      : "Verdeckte Karte";

  const estimatedTooltipHeight = (): number => {
    if (showImageTooltip) return 320;
    const ruleLineCount = rulesTextLines(rulesText).length;
    const base = tooltipMode === "enhanced" ? 132 : 78;
    return Math.min(320, Math.round((base + ruleLineCount * 20) * tooltipScale));
  };

  const computedTooltipWidth = (): number => {
    const viewportLimit = Math.max(160, window.innerWidth - 32);
    const unscaled = showImageTooltip ? 220 : 300;
    return Math.min(Math.round(unscaled * tooltipScale), viewportLimit);
  };

  const clearTooltipOpenTimer = () => {
    if (tooltipOpenTimerRef.current !== null) {
      clearTimeout(tooltipOpenTimerRef.current);
      tooltipOpenTimerRef.current = null;
    }
  };

  const clearTooltipCloseTimer = () => {
    if (tooltipCloseTimerRef.current !== null) {
      clearTimeout(tooltipCloseTimerRef.current);
      tooltipCloseTimerRef.current = null;
    }
  };

  const updateOverlayPlacement = () => {
    const element = cardRef.current;
    if (!element) return;
    const cardRect = element.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const viewportWidth = visualViewport?.width ?? window.innerWidth;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const viewportBottom = viewportHeight;
    const spaceBelow = viewportBottom - cardRect.bottom;
    const spaceAbove = cardRect.top;
    const tooltipHeight = estimatedTooltipHeight();
    const nextTooltipPlacement = spaceBelow < tooltipHeight && spaceAbove > spaceBelow ? "above" : "below";
    if (tooltipEnabled) {
      const tooltipWidth = computedTooltipWidth();
      const margin = 16;
      const left = Math.max(margin, Math.min(cardRect.left + 6, window.innerWidth - tooltipWidth - margin));
      setTooltipPositionStyle(
        nextTooltipPlacement === "below"
          ? { left: `${left}px`, top: `${cardRect.bottom + 8}px`, width: `${tooltipWidth}px` }
          : { left: `${left}px`, top: `${cardRect.top - 8}px`, width: `${tooltipWidth}px` }
      );
    }
    const estimatedActionMenuHeight = Math.min(260, Math.max(56, actions.length * 51 + Math.max(0, actions.length - 1) * 5));
    const nextActionMenuPlacement = spaceBelow < estimatedActionMenuHeight && spaceAbove > spaceBelow ? "above" : "below";
    if (tooltipEnabled) setTooltipPlacement(nextTooltipPlacement);
    if (hasCardActions) {
      const margin = viewportWidth < 360 ? 8 : 16;
      const availableWidth = Math.max(160, viewportWidth - margin * 2);
      const preferredWidth = Math.max(cardRect.width, Math.min(availableWidth, 224));
      const actionMenuWidth = Math.min(availableWidth, Math.min(260, preferredWidth));
      const cardCenter = cardRect.left + cardRect.width / 2;
      const left = Math.max(margin, Math.min(cardCenter - actionMenuWidth / 2, viewportWidth - actionMenuWidth - margin));
      const top = nextActionMenuPlacement === "below" ? cardRect.bottom + 7 : Math.max(margin, cardRect.top - estimatedActionMenuHeight - 7);
      setActionMenuPlacement(nextActionMenuPlacement);
      setActionMenuPositionStyle({
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
        bottom: "auto",
        width: `${actionMenuWidth}px`,
        minWidth: `${Math.min(cardRect.width, actionMenuWidth)}px`,
        maxHeight: `${Math.max(72, viewportHeight - margin * 2)}px`
      });
    }
  };

  const scheduleTooltipOpen = () => {
    if (!tooltipEnabled) return;
    clearTooltipCloseTimer();
    if (tooltipHoverVisible) return;
    clearTooltipOpenTimer();
    tooltipOpenTimerRef.current = setTimeout(() => {
      tooltipOpenTimerRef.current = null;
      setTooltipHoverVisible(true);
    }, hoverOpenDelayMs);
  };

  const scheduleTooltipClose = () => {
    clearTooltipOpenTimer();
    clearTooltipCloseTimer();
    tooltipCloseTimerRef.current = setTimeout(() => {
      tooltipCloseTimerRef.current = null;
      setTooltipHoverVisible(false);
    }, CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS);
  };

  useEffect(() => {
    if (tooltipAvailable) return;
    clearTooltipOpenTimer();
    clearTooltipCloseTimer();
    setTooltipHoverVisible(false);
    setTooltipFocusVisible(false);
    setTooltipPinnedVisible(false);
    setTooltipPositionStyle({});
  }, [tooltipAvailable]);

  const togglePinnedTooltip = () => {
    if (!canPinTooltip) return;
    clearTooltipOpenTimer();
    clearTooltipCloseTimer();
    setSuppressCardTooltip(false);
    setTooltipHoverVisible(false);
    setTooltipFocusVisible(false);
    setTooltipPinnedVisible((visible) => {
      const nextVisible = !visible;
      if (nextVisible) {
        window.dispatchEvent(new CustomEvent(CARD_TOOLTIP_PIN_EVENT, { detail: { ownerId: tooltipOwnerId } }));
      }
      return nextVisible;
    });
    updateOverlayPlacement();
  };

  const closePinnedTooltip = () => {
    clearTooltipOpenTimer();
    clearTooltipCloseTimer();
    setTooltipHoverVisible(false);
    setTooltipFocusVisible(false);
    setTooltipPinnedVisible(false);
  };

  useEffect(() => {
    if (!showTooltip) return;
    updateOverlayPlacement();
  }, [showTooltip, tooltipMode]);

  useEffect(() => {
    const closeWhenOtherTooltipPins = (event: Event) => {
      const ownerId = event instanceof CustomEvent ? (event.detail as { ownerId?: unknown } | null)?.ownerId : undefined;
      if (ownerId === tooltipOwnerId) return;
      setTooltipPinnedVisible(false);
      setTooltipHoverVisible(false);
      setTooltipFocusVisible(false);
    };
    window.addEventListener(CARD_TOOLTIP_PIN_EVENT, closeWhenOtherTooltipPins);
    return () => window.removeEventListener(CARD_TOOLTIP_PIN_EVENT, closeWhenOtherTooltipPins);
  }, [tooltipOwnerId]);

  useEffect(() => {
    if (!showCardActions) {
      setActionMenuPositionStyle({});
      return;
    }
    updateOverlayPlacement();
  }, [showCardActions, actions.length]);

  useEffect(
    () => () => {
      clearTooltipOpenTimer();
      clearTooltipCloseTimer();
    },
    []
  );

  const tooltipElement = showTooltip && tooltipId ? (
    <span
      className={`cardTooltip ${tooltipPlacement} mode-${tooltipMode}${showImageTooltip ? " imageOnly" : ""}${tooltipPinnedVisible ? " pinned" : ""}${showTooltip ? " visible" : ""}`}
      id={tooltipId}
      role="tooltip"
      style={tooltipPositionStyle}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        closePinnedTooltip();
      }}
      onPointerDown={(event) => {
        if (tooltipPinnedVisible) event.stopPropagation();
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        clearTooltipCloseTimer();
        clearTooltipOpenTimer();
        if (!tooltipHoverVisible) setTooltipHoverVisible(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "touch") return;
        scheduleTooltipClose();
      }}
    >
      {showImageTooltip ? (
        <CardImage
          className="cardTooltipImage"
          src={tooltipImageUrl}
          alt={`Kartenbild ${card.title ?? "Karte"}`}
        />
      ) : (
        <>
          <strong>{card.title}</strong>
          {tooltipMode === "enhanced" ? (
            <span className="cardTooltipStats">
              {tooltipStats.map((stat) => (
                <span
                  key={`${card.instanceId}-tooltip-stat-${stat.label}`}
                  className="cardTooltipStat"
                  title={stat.label}
                >
                  <span className="icon">{stat.icon}</span>
                  <span>{stat.value}</span>
                </span>
              ))}
            </span>
          ) : null}
          {tooltipMode === "enhanced"
            ? detailLines.map((line) => <span key={line}>{line}</span>)
            : null}
          <span className="cardTooltipText">
            {rulesTextLines(rulesText).map((line, index) => (
              <span
                key={`${card.instanceId}-tooltip-rules-${index}`}
                className={hasSubroutineMarkers ? "subroutineLine" : undefined}
              >
                {shouldAddFallbackSubroutineMarker(
                  card.type ?? "",
                  rulesText,
                  line,
                ) ? (
                  <SubroutineIcon />
                ) : null}
                {renderRuleTextSegments(
                  line,
                  `${card.instanceId}-tooltip-rules-${index}`,
                )}
              </span>
            ))}
          </span>
        </>
      )}
    </span>
  ) : null;

  return (
    <div className={`cardSlot${slotClassName ? ` ${slotClassName}` : ""}${showCardActions ? " actionMenuOpen" : ""}${runPositionActive ? " runPositionActiveSlot" : ""}`}>
      {positionBadge ? (
        <span className="cardPositionBadge" aria-label={`ICE ${positionBadge}: Installationsreihenfolge von innen nach außen`}>
          {positionBadge}
        </span>
      ) : null}
      {runPositionActive ? (
        <span className="runPositionMarker" tabIndex={0} aria-label={runPositionLabel ?? "Aktuelles ICE"} data-tooltip={runPositionLabel ?? "Aktuelles ICE"} title={runPositionLabel ?? "Aktuelles ICE"}>
          <Crosshair size={14} strokeWidth={2.4} aria-hidden="true" />
        </span>
      ) : null}
      <button
        ref={cardRef}
        type="button"
        className={`card${card.known ? typeClass : " hidden"}${hiddenBackClass}${modeClass}${visualImageUrl ? " withImage" : ""}${preview ? " preview" : ""}${installedState === "unrezzed" ? " unrezzedInstalled" : ""}${installedState === "rezzed" ? " rezzedInstalled" : ""}${hasCardActions ? " hasActions" : ""}${selected ? " selectedActionSource" : ""}${choiceSelected ? " choiceSelected" : ""}${discardShortcut?.selected ? " discardSelected" : ""}${runPositionActive ? " runPositionActive" : ""}`}
        onClick={() => {
          if (showCardActions) setSuppressCardTooltip(true);
          updateOverlayPlacement();
          if (onSelect) onSelect(card, hiddenSide);
          onFocus?.(card, hiddenSide);
        }}
        onFocus={(event) => {
          updateOverlayPlacement();
          if (tooltipEnabled && event.currentTarget.matches(":focus-visible")) setTooltipFocusVisible(true);
          onFocus?.(card, hiddenSide);
        }}
        onBlur={() => setTooltipFocusVisible(false)}
        onDoubleClick={(event) => {
          if (!canPinTooltip) return;
          if (Date.now() - lastTouchTooltipPinRef.current < 700) return;
          event.preventDefault();
          togglePinnedTooltip();
        }}
        onPointerEnter={(event) => {
          updateOverlayPlacement();
          if (event.pointerType === "touch") return;
          scheduleTooltipOpen();
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== "touch" || !canPinTooltip) return;
          const now = Date.now();
          const elapsed = now - lastTouchTapRef.current;
          lastTouchTapRef.current = now;
          if (elapsed > 60 && elapsed < 420) {
            event.preventDefault();
            lastTouchTooltipPinRef.current = now;
            togglePinnedTooltip();
          }
        }}
        onPointerLeave={(event) => {
          setSuppressCardTooltip(false);
          if (event.pointerType === "touch") return;
          scheduleTooltipClose();
        }}
        aria-label={cardAriaLabel}
        aria-pressed={onSelect ? choiceSelected : undefined}
        aria-describedby={tooltipId}
        title={nativeTitle}
        data-testid={onSelect ? "card-choice-card" : card.known ? "known-card" : "hidden-card"}
        data-known={card.known ? "true" : "false"}
      >
        {visualImageUrl ? <CardImage className="cardImage" src={visualImageUrl} decorative /> : null}
        {isHardwareImageCard ? (
          <HardwareImageOverlay
            title={card.title ?? "Hardware"}
            rulesText={rulesText}
            {...(card.installCost !== undefined ? { installCost: card.installCost } : {})}
          />
        ) : isOperationImageCard ? (
          <OperationImageOverlay title={card.title ?? "Operation"} rulesText={rulesText} {...(card.cost !== undefined ? { cost: card.cost } : {})} />
        ) : null}
        {showArtBlock ? <span className="cardArt" aria-hidden="true" /> : null}
        {visualImageUrl ? null : <span className="cardTitle">{card.known ? card.title : "Verdeckte Karte"}</span>}
        {installedState && installedStateLabel ? <InstalledStateMark state={installedState} label={installedStateLabel} /> : null}
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
        {storedCredits > 0 && storedCreditSource ? <StoredCreditsBadge amount={storedCredits} sourceLabel={storedCreditSource} /> : null}
        {recurringCredits > 0 ? <RecurringCreditBadge amount={recurringCredits} /> : null}
        {scoredAgendaCredits > 0 && scoredAgendaCreditSource ? <ScoredAgendaCreditsBadge amount={scoredAgendaCredits} sourceLabel={scoredAgendaCreditSource} /> : null}
        {shellCounters > 0 ? <ShellCounterBadge amount={shellCounters} /> : null}
        {dataRavenCounters > 0 ? <DataRavenCounterBadge amount={dataRavenCounters} /> : null}
        {scoreStateBadges.length > 0 ? <ScoreCardStateBadges badges={scoreStateBadges} /> : null}
      </button>
      {discardShortcut ? (
        <button
          className={`cardDiscardShortcut${discardShortcut.selected ? " active" : ""}`}
          type="button"
          aria-label={discardShortcut.selected ? "Diese Handkarte nicht abwerfen" : "Diese Handkarte abwerfen"}
          aria-pressed={discardShortcut.selected}
          title={discardShortcut.selected ? "Discard-Auswahl aufheben" : "Für Discard auswählen"}
          data-testid="hand-discard-shortcut"
          disabled={discardShortcut.disabled}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSuppressCardTooltip(true);
            discardShortcut.onToggle();
          }}
        >
          {discardShortcut.selected ? <Check size={11} strokeWidth={2.5} /> : <Trash2 size={11} strokeWidth={2.35} />}
        </button>
      ) : null}
      {tooltipElement && typeof document !== "undefined" ? createPortal(tooltipElement, document.body) : null}
      {hasCardActions ? (
        <button
          className={`cardActionMarker${showCardActions ? " active" : ""}`}
          type="button"
          data-card-action-surface="true"
          aria-label={showCardActions ? "Kartenoptionen einklappen" : "Kartenoptionen anzeigen"}
          aria-expanded={showCardActions}
          aria-haspopup="menu"
          data-testid="card-action-marker"
          onPointerDown={(event) => {
            if (event.pointerType === "touch") {
              setSuppressCardTooltip(true);
              updateOverlayPlacement();
            }
          }}
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
          <Play size={10} strokeWidth={2.35} />
        </button>
      ) : null}
      {showCardActions ? <CardActionsPopover actions={actions} disabled={actionDisabled} placement={actionMenuPlacement} style={actionMenuPositionStyle} actionLabelForAction={actionLabelForAction} onAction={onAction!} /> : null}
    </div>
  );
}

type ScoredAgendaStateTone = "credit" | "agenda" | "action" | "effect" | "depleted";

type ScoredAgendaStateLine = {
  key: string;
  value: string;
  label: string;
  tone: ScoredAgendaStateTone;
};

function ScoredAgendaStateLines({ card, side }: { card: DisplayVisibleCard; side: Side }) {
  const lines = scoredAgendaStateLines(card, side);
  if (lines.length === 0) return null;
  return (
    <div className="scoredAgendaStateList" aria-label={`${card.title ?? "Karte"} Status`}>
      {lines.map((line) => (
        <p className="scoredAgendaStateLine" key={`${card.instanceId}-${line.key}`}>
          <span className={`scoredAgendaStatePill ${line.tone}`}>{line.value}</span>
          <span>{line.label}</span>
        </p>
      ))}
    </div>
  );
}

function scoredAgendaStateLines(card: DisplayVisibleCard, side: Side): ScoredAgendaStateLine[] {
  const lines: ScoredAgendaStateLine[] = [];
  const bonusAgendaPoints = counterAmount(card, "agenda");
  if (bonusAgendaPoints > 0) {
    const totalAgendaPoints = (card.agendaPoints ?? 0) + bonusAgendaPoints;
    lines.push({
      key: "agenda-bonus",
      value: `+${bonusAgendaPoints} Agenda`,
      label: `Gesamt ${totalAgendaPoints} ${agendaPointLabel(totalAgendaPoints)}`,
      tone: "agenda"
    });
  }

  const effectLine = scoredAgendaEffectLineForScoreArea(card.definitionId, side);
  if (effectLine) lines.push(effectLine);
  return lines;
}

function scoreCardStateBadges(card: DisplayVisibleCard): ScoredAgendaStateLine[] {
  const badges: ScoredAgendaStateLine[] = [];
  const bonusAgendaPoints = counterAmount(card, "agenda");
  if (bonusAgendaPoints > 0) {
    badges.push({
      key: "agenda-bonus-badge",
      value: `+${bonusAgendaPoints} Agenda`,
      label: "Bonus-Agenda-Punkte",
      tone: "agenda"
    });
  }
  return badges;
}

function ScoreCardStateBadges({ badges }: { badges: ScoredAgendaStateLine[] }) {
  return (
    <span className="scoreCardStateBadges" aria-hidden="true">
      {badges.map((badge) => (
        <span className={`scoreCardStateBadge ${badge.tone}`} key={badge.key}>
          {badge.value}
        </span>
      ))}
    </span>
  );
}

function counterAmount(card: DisplayVisibleCard, counter: "agenda" | "power" | "shell" | "recurring_credit"): number {
  const amount = card.counters?.[counter];
  return typeof amount === "number" && Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
}

function creditLabel(amount: number): string {
  return amount === 1 ? "Credit" : "Credits";
}

function agendaPointLabel(amount: number): string {
  return amount === 1 ? "Agenda-Punkt" : "Agenda-Punkte";
}

function CardActionsPopover({
  actions,
  disabled,
  placement,
  style,
  actionLabelForAction,
  onAction
}: {
  actions: LegalAction[];
  disabled: boolean;
  placement: "above" | "below";
  style?: CSSProperties;
  actionLabelForAction(action: LegalAction): string;
  onAction(action: LegalAction): void;
}) {
  return (
    <div className={`cardActionsPopover ${placement}`} role="menu" aria-label="Kartenaktionen" style={style} data-card-action-surface="true">
      {actions.map((action) => {
        const label = compactCardActionMenuLabel(action, actionLabelForAction(action));
        return (
          <button className="button actionButton cardActionButton" key={action.actionId} onClick={() => onAction(action)} disabled={disabled} type="button" role="menuitem" data-testid="card-action-button" data-action-type={action.type}>
            <ActionLeadIcon action={action} size={14} />
            <span className="actionButtonLabel">{label}</span>
            <CostChips action={action} />
          </button>
        );
      })}
    </div>
  );
}

function compactCardActionMenuLabel(action: LegalAction, label: string): string {
  if (action.type !== "pump_breaker" && action.type !== "break_subroutine") return label;
  return label.replace(/\s+\([^)]*\)$/, "");
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

function InstalledStateMark({ state, label }: { state: "hidden" | "unrezzed" | "rezzed" | "known"; label: string }) {
  if (state === "known") return null;
  return (
    <span className={`installedStateMark ${state}`} aria-label={label} data-tooltip={label} data-testid="installed-state-mark">
      {state === "rezzed" ? <span className="installedStateLetter" aria-hidden="true">R</span> : <EyeOff size={11} strokeWidth={2.4} aria-hidden="true" />}
    </span>
  );
}

function StrengthBoostBadge({ amount }: { amount: number }) {
  return (
    <span className="strengthBoostBadge" aria-label={`+${amount} Stärke`} data-testid="strength-boost-badge">
      +{amount} Stärke
    </span>
  );
}

function StoredCreditsBadge({ amount, sourceLabel }: { amount: number; sourceLabel: string }) {
  return (
    <CardCreditCounter
      amount={amount}
      ariaLabel={`${amount} ${amount === 1 ? "Credit" : "Credits"} auf ${sourceLabel}`}
      className="storedCreditsBadge brokerStoredCreditsBadge"
      testId="stored-credits-badge"
    />
  );
}

function RecurringCreditBadge({ amount }: { amount: number }) {
  return (
    <CardCreditCounter
      amount={amount}
      ariaLabel={`${amount} wiederkehrende ${creditLabel(amount)}`}
      className="recurringCreditBadge"
      testId="recurring-credit-badge"
    />
  );
}

function ScoredAgendaCreditsBadge({ amount, sourceLabel }: { amount: number; sourceLabel: string }) {
  return (
    <CardCreditCounter
      amount={amount}
      ariaLabel={`${amount} ${creditLabel(amount)} auf ${sourceLabel}`}
      className="scoredAgendaCreditsBadge"
      testId="scored-agenda-credits-badge"
    />
  );
}

function CardCreditCounter({ amount, ariaLabel, className, testId }: { amount: number; ariaLabel: string; className: string; testId: string }) {
  const { safeAmount, showCount, iconCount, iconColumns } = cardCreditCounterVisual(amount);
  return (
    <span
      className={`${className} cardCreditCounterBadge ${showCount ? "counted" : "iconsOnly"}`}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {showCount ? <span className="cardCreditCounterAmount">{safeAmount}</span> : null}
      <span
        className="cardCreditCounterIcons"
        style={{ "--card-credit-columns": iconColumns } as CSSProperties}
        aria-hidden="true"
      >
        {Array.from({ length: iconCount }, (_, index) => (
          <span className="cardCreditCounterIcon" key={`card-credit-counter-icon-${index}`} />
        ))}
      </span>
    </span>
  );
}

function ShellCounterBadge({ amount }: { amount: number }) {
  return (
    <span className="shellCounterBadge" aria-label={`${amount} Shell-Counter`} data-testid="shell-counter-badge">
      {amount} Shell
    </span>
  );
}

function DataRavenCounterBadge({ amount }: { amount: number }) {
  return (
    <span className="dataRavenCounterBadge" aria-label={`${amount} Data-Raven-Counter`} data-testid="data-raven-counter-badge">
      {amount} Raven
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
    valueLabel("Stärke", card.strength),
    selectedServerLabel(card),
    storedCreditsLabel(card),
    recurringCreditLabel(card),
    shellCounterLabel(card),
    dataRavenCounterLabel(card)
  ]
    .filter(Boolean)
    .join(" · ");
  return [typeLine, numberLine].filter(Boolean);
}

function selectedServerLabel(card: VisibleCard): string | null {
  if (!card.selectedServerLabel) return null;
  return `Zielserver ${card.selectedServerLabel}`;
}

function storedCreditsLabel(card: VisibleCard): string | null {
  const sourceLabel = storedCreditSourceLabel(card);
  if (!sourceLabel) return null;
  const amount = storedCreditAmount(card);
  if (amount <= 0) return null;
  return `${sourceLabel} ${amount} ${amount === 1 ? "Credit" : "Credits"}`;
}

function shellCounterLabel(card: VisibleCard): string | null {
  const amount = shellCounterAmount(card);
  if (amount <= 0) return null;
  return `${amount} Shell-Counter`;
}

function recurringCreditLabel(card: VisibleCard): string | null {
  const amount = recurringCreditAmount(card);
  if (amount <= 0) return null;
  return `${amount} wiederkehrende ${creditLabel(amount)}`;
}

function dataRavenCounterLabel(card: VisibleCard): string | null {
  const amount = dataRavenCounterAmount(card);
  if (amount <= 0) return null;
  return `${amount} Data-Raven-Counter`;
}

function shellCounterAmount(card: VisibleCard): number {
  const amount = card.counters?.shell ?? 0;
  return Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
}

function recurringCreditAmount(card: VisibleCard): number {
  const amount = card.counters?.recurring_credit ?? 0;
  return Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
}

function dataRavenCounterAmount(card: VisibleCard): number {
  if (card.definitionId !== "onr_v1_236_data-raven") return 0;
  const amount = card.counters?.power ?? 0;
  return Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
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

function zoneSideClass(side: Side): "runnerZoneSideLabel" | "corpZoneSideLabel" {
  return side === "runner" ? "runnerZoneSideLabel" : "corpZoneSideLabel";
}

type ZoneIdentityIconKind = "hq" | "rd" | "archives" | "remote" | "rig" | "grip" | "heap" | "stack";

function serverZoneIdentityIconKind(serverId: PlayerView["servers"][number]["id"]): ZoneIdentityIconKind {
  if (serverId === "hq") return "hq";
  if (serverId === "rd") return "rd";
  if (serverId === "archives") return "archives";
  return "remote";
}

function ZoneIdentityIcon({ side, kind, label, className = "" }: { side: Side; kind: ZoneIdentityIconKind; label: string; className?: string }) {
  let Icon: typeof Building2;
  switch (kind) {
    case "hq":
      Icon = Building2;
      break;
    case "rd":
      Icon = Brain;
      break;
    case "archives":
      Icon = Clipboard;
      break;
    case "remote":
      Icon = Shield;
      break;
    case "rig":
      Icon = Cable;
      break;
    case "heap":
      Icon = Trash2;
      break;
    case "stack":
      Icon = Layers3;
      break;
    case "grip":
    default:
      Icon = CopyPlus;
      break;
  }
  return (
    <span className={`zoneIdentityIcon ${zoneSideClass(side)} ${className}`} role="img" aria-label={`${label}: Zonen-Icon`} title={`${label}: Zonen-Icon`}>
      <Icon size={14} strokeWidth={2.2} />
    </span>
  );
}

function SideZoneFrame({
  side,
  label,
  countLabel,
  iconKind,
  highlighted = false,
  className = "",
  title,
  ariaLabel,
  collapsed = false,
  onToggleCollapse,
  collapseLabel,
  children
}: {
  side: Side;
  label: string;
  countLabel: string;
  iconKind?: ZoneIdentityIconKind;
  highlighted?: boolean;
  className?: string;
  title?: string;
  ariaLabel?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  collapseLabel?: string;
  children?: ReactNode;
}) {
  const hasBody = children !== undefined && children !== null && !collapsed;
  return (
    <div className={`sideZoneFrame ${side} ${hasBody ? "" : "sideZoneFrameCountOnly"} ${highlighted ? "cueHighlightSoft" : ""} ${className}`} title={title} aria-label={ariaLabel}>
      <div className="sideZoneLead">
        {iconKind ? <ZoneIdentityIcon side={side} kind={iconKind} label={label} /> : null}
        <div className="sideZoneLeadTop">
          <h2 className={`sideZoneTitle rigGroupSideLabel ${zoneSideClass(side)}`}>{label}</h2>
          <ZoneSideCount side={side} value={countLabel} />
          {onToggleCollapse ? <ZoneCollapseButton side={side} label={collapseLabel ?? label} collapsed={collapsed} onToggle={onToggleCollapse} /> : null}
        </div>
      </div>
      {hasBody ? <div className="sideZoneBody">{children}</div> : null}
    </div>
  );
}

function ZoneCollapseButton({ side, label, collapsed, onToggle }: { side: Side; label: string; collapsed: boolean; onToggle: () => void }) {
  const actionLabel = `${label} ${collapsed ? "ausklappen" : "einklappen"}`;
  return (
    <button className={`zoneCollapseButton ${zoneSideClass(side)}`} type="button" onClick={onToggle} title={actionLabel} aria-label={actionLabel} aria-expanded={!collapsed}>
      {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
    </button>
  );
}

function ZoneSideCount({ side, value }: { side: Side; value: string }) {
  return (
    <span className={`sideZoneCount ${zoneSideClass(side)}`} aria-label={value}>
      {value}
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
  if (response.retentionProtected) payload.retentionProtected = response.retentionProtected;
  if (response.retentionProtectedAt) payload.retentionProtectedAt = response.retentionProtectedAt;
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
  if (response.pendingUndo) payload.pendingUndo = response.pendingUndo;
  if (winner) payload.winner = winner;
  if (response.finalStateHash) payload.finalStateHash = response.finalStateHash;
  if (response.resultSummary) payload.resultSummary = response.resultSummary;
  if (response.retentionProtected) payload.retentionProtected = response.retentionProtected;
  if (response.retentionProtectedAt) payload.retentionProtectedAt = response.retentionProtectedAt;
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

function normalizeWebSocketUrl(value: string): string {
  return value.trim().replace(/\s+(?=\/ws(?:$|[?#]))/, "");
}

async function bootstrap(session: SessionInfo): Promise<ClientPayload | LobbyClientPayload | null> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_HTTP}/api/matches/${encodeURIComponent(session.matchId)}/bootstrap?side=${session.side}`, {
      headers: { authorization: `Bearer ${session.sessionToken}` },
      cache: "no-store"
    });
  } catch {
    throw new ServerConnectionError();
  }
  if (!response.ok) return null;
  return (await response.json()) as ClientPayload | LobbyClientPayload;
}

async function fetchOpenLanMatches(): Promise<OpenMatchesResponse> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_HTTP}/api/matches/open`, { cache: "no-store" });
  } catch {
    throw new ServerConnectionError();
  }
  if (!response.ok) {
    let payload: OpenMatchesResponse | undefined;
    try {
      payload = (await response.json()) as OpenMatchesResponse;
    } catch {
      payload = undefined;
    }
    if (payload?.error?.message) return { error: { message: payload.error.message } };
    if (response.status === 404) {
      return { error: { message: "Dein Multiplayer-Server unterstützt die LAN-Liste noch nicht. Bitte den Server neu starten oder auf den aktuellen Stand bringen." } };
    }
    return { error: { message: "Offene Spiele konnten nicht geladen werden." } };
  }
  return (await response.json()) as OpenMatchesResponse;
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

function shortMatchId(matchId: string): string {
  const normalized = matchId.replace(/^match_/, "");
  return normalized.length > 10 ? normalized.slice(0, 10) : normalized;
}

function cardPreviewCollapsedStorageKeyFor(matchId: string, side: Side): string {
  return `${CARD_PREVIEW_COLLAPSED_STORAGE_PREFIX}.${matchId}.${side}`;
}

function openMatchAgeLabel(ageSeconds: number): string {
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0) return "gerade erstellt";
  if (ageSeconds < 60) return `${ageSeconds}s`;
  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h`;
}

function parseRunOverlayPositionPreference(raw: string | null): RunOverlayPositionPreference {
  if (!raw) return { kind: "default" };
  try {
    return normalizeRunOverlayPositionPreference(JSON.parse(raw));
  } catch {
    return { kind: "default" };
  }
}

function normalizeRunOverlayPositionPreference(value: unknown): RunOverlayPositionPreference {
  if (!value || typeof value !== "object") return { kind: "default" };
  const candidate = value as { kind?: unknown; xPercent?: unknown; yPercent?: unknown };
  if (candidate.kind !== "custom" || !finiteRunOverlayPercent(candidate.xPercent) || !finiteRunOverlayPercent(candidate.yPercent)) {
    return { kind: "default" };
  }
  return { kind: "custom", xPercent: candidate.xPercent, yPercent: candidate.yPercent };
}

function serializeRunOverlayPositionPreference(position: RunOverlayPositionPreference): string {
  return JSON.stringify(position);
}

function clampRunOverlayPosition(
  xPercent: number,
  yPercent: number,
  viewportWidth: number,
  viewportHeight: number,
  overlayWidth: number,
  overlayHeight: number
): RunOverlayPositionPreference {
  const margin = 8;
  const safeWidth = Math.max(1, viewportWidth);
  const safeHeight = Math.max(1, viewportHeight);
  const maxLeft = Math.max(margin, safeWidth - overlayWidth - margin);
  const maxTop = Math.max(margin, safeHeight - overlayHeight - margin);
  const leftPx = clampRunOverlayValue((xPercent / 100) * safeWidth, margin, maxLeft);
  const topPx = clampRunOverlayValue((yPercent / 100) * safeHeight, margin, maxTop);
  return {
    kind: "custom",
    xPercent: roundRunOverlayPercent((leftPx / safeWidth) * 100),
    yPercent: roundRunOverlayPercent((topPx / safeHeight) * 100)
  };
}

function finiteRunOverlayPercent(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function clampRunOverlayValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundRunOverlayPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function rememberDisplayName(name: string): void {
  const trimmed = name.trim();
  if (trimmed) window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, trimmed);
}

function readLocalStorageWithLegacy(key: string, legacyKey: string): string | null {
  const current = window.localStorage.getItem(key);
  if (current !== null) return current;
  const legacy = window.localStorage.getItem(legacyKey);
  if (legacy !== null) window.localStorage.setItem(key, legacy);
  return legacy;
}

function removeLocalStorageKeys(key: string, legacyKey: string): void {
  window.localStorage.removeItem(key);
  window.localStorage.removeItem(legacyKey);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_HTTP}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    throw new ServerConnectionError();
  }
  return (await response.json()) as T;
}

class ServerConnectionError extends Error {
  constructor() {
    super(SERVER_UNREACHABLE_NOTICE);
    this.name = "ServerConnectionError";
  }
}

function serverErrorNotice(error: unknown, fallback: string): string {
  if (error instanceof ServerConnectionError) return error.message;
  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) return SERVER_UNREACHABLE_NOTICE;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function seriesAudioOutcome(result: GameResultSummary): GameResultSummary["viewerOutcome"] {
  if (result.series?.status !== "finished") return result.viewerOutcome;
  return result.series.viewerSeriesOutcome;
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

function playActionCueSound(kind: ActionSoundKind, volume: number, repeatCount = 1): void {
  const context = audioContext();
  if (!context) return;
  const safeVolume = Math.min(1, Math.max(0, volume));
  if (kind === "draw") {
    playCardDrawSnap(context, safeVolume, repeatCount);
    return;
  }
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

function playCardDrawSnap(context: AudioContext, volume: number, repeatCount: number): void {
  const safeCount = Math.min(5, Math.max(1, Math.floor(repeatCount)));
  for (let index = 0; index < safeCount; index += 1) {
    const start = context.currentTime + index * 0.085;
    const noiseBuffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * 0.035)), context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) {
      const decay = 1 - i / samples.length;
      samples[i] = (Math.random() * 2 - 1) * decay;
    }
    const noise = context.createBufferSource();
    const noiseGain = context.createGain();
    const highpass = context.createBiquadFilter();
    noise.buffer = noiseBuffer;
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(1800, start);
    noiseGain.gain.setValueAtTime(Math.max(0.0001, volume * 0.14), start);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);
    noise.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(context.destination);
    noise.start(start);
    noise.stop(start + 0.05);

    const click = context.createOscillator();
    const clickGain = context.createGain();
    click.type = "square";
    click.frequency.setValueAtTime(1220, start);
    click.frequency.exponentialRampToValueAtTime(520, start + 0.035);
    clickGain.gain.setValueAtTime(0.0001, start);
    clickGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.07), start + 0.004);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.04);
    click.connect(clickGain);
    clickGain.connect(context.destination);
    click.start(start);
    click.stop(start + 0.055);
  }
}

function actionSoundPattern(kind: ActionSoundKind): Array<{ frequency: number; duration: number; gain: number; type: OscillatorType }> {
  switch (kind) {
    case "draw":
      return [{ frequency: 660, duration: 0.11, gain: 0.07, type: "sine" }];
    case "credit":
      return [
        { frequency: 988, duration: 0.035, gain: 0.055, type: "triangle" },
        { frequency: 1480, duration: 0.05, gain: 0.035, type: "triangle" }
      ];
    case "install_hidden":
      return [{ frequency: 185, duration: 0.12, gain: 0.05, type: "triangle" }];
    case "install_known":
      return [
        { frequency: 262, duration: 0.05, gain: 0.045, type: "triangle" },
        { frequency: 392, duration: 0.08, gain: 0.04, type: "triangle" }
      ];
    case "play":
      return [
        { frequency: 440, duration: 0.09, gain: 0.06, type: "sine" },
        { frequency: 554, duration: 0.1, gain: 0.05, type: "sine" }
      ];
    case "rez":
      return [
        { frequency: 110, duration: 0.08, gain: 0.055, type: "sawtooth" },
        { frequency: 330, duration: 0.14, gain: 0.04, type: "triangle" }
      ];
    case "run":
      return [
        { frequency: 294, duration: 0.045, gain: 0.05, type: "triangle" },
        { frequency: 587, duration: 0.065, gain: 0.035, type: "square" }
      ];
    case "access":
      return [{ frequency: 740, duration: 0.11, gain: 0.055, type: "triangle" }];
    case "agenda":
      return [
        { frequency: 523, duration: 0.1, gain: 0.07, type: "sine" },
        { frequency: 784, duration: 0.14, gain: 0.06, type: "sine" }
      ];
    case "trash":
      return [
        { frequency: 196, duration: 0.055, gain: 0.055, type: "sawtooth" },
        { frequency: 98, duration: 0.12, gain: 0.035, type: "triangle" }
      ];
    case "tag_or_damage":
      return [
        { frequency: 247, duration: 0.08, gain: 0.08, type: "square" },
        { frequency: 220, duration: 0.1, gain: 0.06, type: "square" }
      ];
    case "choice":
      return [{ frequency: 660, duration: 0.075, gain: 0.045, type: "triangle" }];
    case "game_end":
      return [
        { frequency: 523, duration: 0.1, gain: 0.07, type: "sine" },
        { frequency: 659, duration: 0.1, gain: 0.06, type: "sine" }
      ];
    case "runner_turn":
      return [
        { frequency: 523, duration: 0.08, gain: 0.075, type: "triangle" },
        { frequency: 784, duration: 0.12, gain: 0.06, type: "sine" }
      ];
    case "corp_turn":
      return [
        { frequency: 220, duration: 0.09, gain: 0.08, type: "sawtooth" },
        { frequency: 147, duration: 0.13, gain: 0.055, type: "triangle" }
      ];
    case "turn":
    default:
      return [{ frequency: 247, duration: 0.09, gain: 0.04, type: "triangle" }];
  }
}
