"use client";

import {
  Activity,
  Bot,
  Cable,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  CopyPlus,
  Download,
  Eye,
  FlaskConical,
  Award,
  Image,
  Keyboard,
  Layers3,
  Link2,
  ListFilter,
  Move,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  PanelTopOpen,
  Pause,
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
  ZoomIn
} from "lucide-react";
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type {
  ApiClientGameMode,
  ApiCreateMatchResponse,
  ApiGameResultSummary,
  ApiJoinMatchResponse,
  ApiLifecycleResultSummary,
  ApiLobbyParticipantPayload,
  ApiLobbyPayload,
  ApiMatchFormat,
  ApiMatchCardPool,
  ApiMatchStartLobbyPayload,
  ApiMatchStatus,
  ApiPlayerClockSnapshot,
  ApiRecentResultEntry,
  ApiSeriesResultSummary,
  ApiServerMessage,
  ApiSidePayload,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
  Winner,
} from "@netgrid/shared";
import { formatChronicleEvent } from "./chronicle";
import { deckAgendaStatusForEditor, type DeckAgendaStatus } from "./deck-editor-ui";
import {
  actionSoundCountForAction,
  actionSoundForActionType,
  deriveDamageImpactCues,
  deriveOpponentActionCues,
  turnStartAudioCue,
  type BoardHighlight,
  type DamageImpactCue,
  type OpponentActionCue,
  type TurnStartAudioState
} from "./action-cues";
import {
  ACTION_CUE_POSITION_STORAGE_KEY,
  DEFAULT_CUE_POSITION,
  LEGACY_ACTION_CUE_POSITION_STORAGE_KEY,
  actionButtonLabel,
  actionConsumesClick,
  actionContextStillVisible,
  actionCostChips,
  aiPacingFallbackDelayMs,
  aiPacingDelayMs,
  actionMatchesContext,
  activeRunIceInstanceId,
  approachIceExposeViewingIceId,
  automaticCorpMandatoryDrawAction,
  automaticEndTurnAction,
  baseActionSlotCapacity,
  installedCorpExposeReviewCardId,
  fieldCardChoiceOptionForCard,
  groupRunnerRigCards,
  iceModifierBadgesForServer,
  orderedCardContextActions,
  parseCuePositionPreference,
  isSingleInstalledCorpExposeChoice,
  latestRetainableAccessRevealEvent,
  retainedAccessRevealEvent,
  retainedExposeReviewEvent,
  runTargetServerIds,
  runAwareActionButtonLabel,
  runWindowActions,
  runnerRigMemorySummary,
  runPositionStatusLabel,
  serializeCuePositionPreference,
  showInstalledCorpState,
  shouldUseFieldCardChoice,
  serverBoardRows,
  serverDisplayLabel,
  splitLegalActions,
  type ActionContext,
  type CuePositionPreference,
  type CuePositionPreset,
  type IceModifierBadgeView,
} from "./action-board-ui";
import {
  deriveMatchStart,
  humanAiSideLabel,
  matchCardPoolCardLabel,
  matchFormatCardLabel,
  matchStartLobbyBlocksSetup,
  matchStartPlayerClockLabel,
  matchStartSummary,
  parseJoinLinkInput,
  playModeCardLabel,
  sideSelectionLabel,
  type MatchFormatSelection,
  type MatchCardPoolSelection,
  type HumanAiSideSelection,
  type HumanSideSelection,
  type PlayMode
} from "./match-start";
import { formatMatchTimerDuration, matchTimerDecisionKey, matchTimerScopeLabel } from "./match-timer-ui";
import { parseMatchStartSettingsFromStorage, serializeMatchStartSettingsForStorage, type MatchStartPlayerClockGraceSeconds, type MatchStartPlayerClockMinutes, type MatchStartPlayerClockMode } from "./match-start-storage";
import { createMatchSeed, normalizeMatchSeed } from "./match-seed";
import {
  CATALOG_STATUS_FILTER_KEYS,
  CATALOG_STATUS_LABELS,
  CATALOG_AI_HINT_FILTERS,
  CATALOG_BLOCK_STATUS_FILTERS,
  CATALOG_RARITY_FILTERS,
  filterCatalogCardsByBlockStatus,
  filterCatalogCardsByAiHint,
  catalogCardMatchesTypeFilters,
  catalogRarityLabel,
  catalogSetFilterOptions,
  filterCatalogCardsByRarity,
  filterCatalogCardsBySetId,
  filterCatalogCardsBySet,
  filterCatalogCardsByType,
  isCatalogVisibleCard,
  nextCatalogSelection,
  summarizeCatalogStatuses,
  summarizeCatalogRarityFilters,
  summarizeCatalogSetFilters,
  summarizeCatalogTypeFilters,
  summarizeCatalogBlockStatusFilters,
  summarizeCatalogAiHintFilters,
  type CatalogAiHintFilterKey,
  type CatalogBlockStatusFilterKey,
  type CatalogSetIdFilterOption,
  type CatalogRarityFilterKey,
  type CatalogStatusKey,
  type CatalogTypeFilterState
} from "./catalog-ui";
import { type DeckStrategyProfileViewerResponse } from "./deck-strategy-profile-ui";
import { isCardActionSurfaceTarget } from "./card-action-menu-ui";
import { actionNeedsRegionReplacementConfirmation } from "./action-payload";
import {
  clearStoredSession,
  loadCurrentTabSession,
  loadRecentSession,
  loadStoredSession,
  persistSession,
  rememberRecentSession,
  removeRecentSession,
  storedSessionMatches,
  type RecentSessionInfo,
  type SessionInfo
} from "./session-recovery";
import {
  latestMaintenanceAiTraceId,
  type MaintenanceAiTraceDetail,
  type MaintenanceAiTraceIndexEntry
} from "./maintenance";
import {
  ACTION_CUE_SETTINGS_STORAGE_KEY,
  ACTION_PANEL_OVERLAY_POSITION_STORAGE_KEY,
  AI_DECISION_DEBUG_OVERLAY_POSITION_STORAGE_KEY,
  AI_PACING_MODE_STORAGE_KEY,
  AUDIO_STORAGE_KEY,
  CARD_DISPLAY_MODE_STORAGE_KEY,
  CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY,
  CARD_TOOLTIP_SETTINGS_STORAGE_KEY,
  CHRONICLE_DETAIL_MODE_STORAGE_KEY,
  COLOR_SCHEME_STORAGE_KEY,
  DECK_STORAGE_KEY,
  DISPLAY_NAME_STORAGE_KEY,
  GAMEPLAY_SETTINGS_STORAGE_KEY,
  LEGACY_ACTION_CUE_SETTINGS_STORAGE_KEY,
  LEGACY_ACTION_PANEL_OVERLAY_POSITION_STORAGE_KEY,
  LEGACY_AI_DECISION_DEBUG_OVERLAY_POSITION_STORAGE_KEY,
  LEGACY_AI_PACING_MODE_STORAGE_KEY,
  LEGACY_AUDIO_STORAGE_KEY,
  LEGACY_CARD_DISPLAY_MODE_STORAGE_KEY,
  LEGACY_CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY,
  LEGACY_CARD_TOOLTIP_SETTINGS_STORAGE_KEY,
  LEGACY_CHRONICLE_DETAIL_MODE_STORAGE_KEY,
  LEGACY_DECK_STORAGE_KEY,
  LEGACY_DISPLAY_NAME_STORAGE_KEY,
  LEGACY_GAMEPLAY_SETTINGS_STORAGE_KEY,
  LEGACY_MATCH_START_SETTINGS_STORAGE_KEY,
  MATCH_START_SETTINGS_STORAGE_KEY,
  cardPreviewCollapsedStorageKeyFor
} from "../lib/storage-keys";
import { readLocalStorageWithLegacy, rememberDisplayName, removeLocalStorageKeys } from "../lib/local-storage";
import { copyTextToClipboard } from "../lib/clipboard";
import { downloadTextFile } from "../lib/download";
import { runtimeRandomId } from "../lib/runtime-id";
import { reconnectUrlForSession } from "../lib/session-url";
import {
  bootstrap,
  enableAiDecisionDebugTracing,
  fetchAiDecisionDebugTraceDetail,
  fetchAiDecisionDebugTraceIndex,
  fetchAiDecisionPreview,
  fetchOpenLanMatches,
  fetchRecentGameResults,
  fromInitialResponse,
  fromJoinedResponse,
  lobbyFromInitialResponse,
  lobbyFromJoinedResponse,
  normalizeWebSocketUrl,
  postJson,
  serverErrorNotice,
  type AiDecisionPreview,
  type OpenMatchEntry
} from "../lib/client-api";
import { playActionCueSound, playResultSound, primeAudio, seriesAudioOutcome } from "../lib/audio";
import {
  clampOverlayPosition,
  parseOverlayPositionPreference,
  serializeOverlayPositionPreference,
  type OverlayPositionPreference
} from "../lib/overlay-position";
import {
  ActiveMatchWorkspaceNav,
  AppBrand,
  ConnectionBadge,
  type ActiveMatchWorkspace,
  type ConnectionState
} from "../features/app-shell/AppShell";
import {
  ConfirmationDialog,
  type ConfirmationDialogRequest
} from "../features/app-shell/ConfirmationDialog";
import { OptionsDialog } from "../features/app-shell/OptionsDialog";
import { UndoPanel } from "../features/app-shell/UndoPanel";
import { OptionsPanel } from "../features/settings/OptionsPanel";
import { CatalogPanel } from "../features/catalog/CatalogPanel";
import type { CatalogCardDetail, CatalogCardSummary, CatalogListResponse } from "../features/catalog/catalog-types";
import { DeckEditorPanel } from "../features/decks/DeckEditorPanel";
import { DeckMetadataLine, DeckSlotSelect } from "../features/decks/DeckSelectionControls";
import type {
  DeckLibraryResponse,
  DeckSnapshot,
  DeckSnapshotsResponse,
  DeckTemplate,
  DeckTemplatesResponse,
  DeckValidationResponse,
  DeckValidationResult
} from "../features/decks/deck-api-types";
import {
  deckFingerprint,
  deckMetadataFromEditable,
  type DeckCardEntry,
  type EditableDeck
} from "../features/decks/deck-table-model";
import {
  DEFAULT_CORP_SNAPSHOT_ID,
  DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID,
  DEFAULT_DECK_CARD_POOL_VERSION,
  DEFAULT_DECK_FORMAT_PROFILE_ID,
  DEFAULT_DECK_FORMAT_PROFILE_VERSION,
  DEFAULT_IDENTITY_BY_SIDE,
  DEFAULT_RUNNER_SNAPSHOT_ID,
  PROTEUS_DECK_CARD_POOL_VERSION,
  PROTEUS_DECK_FORMAT_PROFILE_ID,
  PROTEUS_DECK_FORMAT_PROFILE_VERSION,
  catalogCardAllowedForDeckEditor,
  editableDeckAllowedForMatchCardPool,
  snapshotAllowedForMatchCardPool
} from "../features/decks/deck-match-filters";
import {
  enrichVisibleCard,
  visibleCardFromCatalogDetail,
  visibleKnownCardIds,
  type DisplayVisibleCard
} from "../features/cards/card-view-model";
import {
  CardImagePreferenceContext,
  CardScaleSettingsContext,
  CardTooltipSettingsContext,
  useCardScaleSettings,
  usePreferredCardImageSource
} from "../features/cards/card-display-settings";
import { usePersistentCardScaleSettings } from "../features/cards/usePersistentCardScaleSettings";
import {
  cardDetailLines,
  cardWithoutDevelopmentCounters
} from "../features/cards/card-detail-lines";
import {
  scoreCardStateBadges
} from "../features/cards/ScoredAgendaState";
import { CardView } from "../features/cards/CardView";
import { CardPreviewPanel } from "../features/cards/CardPreviewPanel";
import { GameOverModal } from "../features/results/GameOverModal";
import { SimulationResult, type AiSimulationSummary } from "../features/results/SimulationResult";
import {
  HandCardsRow,
  SideZoneFrame,
  ZoneCollapseButton,
  ZoneIdentityIcon,
  serverZoneIdentityIconKind,
  zoneSideClass
} from "../features/game-board/ZoneFrame";
import {
  CARD_SCALE_PERCENT_MIN,
  CARD_TOOLTIP_HOVER_OPEN_DELAY_MS,
  CARD_TOOLTIP_OUTSIDE_CARD_CLICK_CLOSE_DELAY_MS,
  CARD_TOOLTIP_PIN_EVENT,
  aiPacingModeHelp,
  normalizeActionPanelMode,
  normalizeAiPacingMode,
  normalizeCardDisplayMode,
  normalizeCardTooltipHoverDelayMs,
  normalizeCardTooltipMode,
  normalizeChronicleDetailMode,
  normalizeCueAutoDismissMs,
  normalizeResourceStripMode,
  type ActionPanelMode,
  type AiPacingMode,
  type CardDisplayMode,
  type CardScaleSettings,
  type CardTooltipHoverDelayMs,
  type CardTooltipMode,
  type CardTooltipSettings,
  type ChronicleDetailMode,
  type ColorScheme,
  type CueAutoDismissMs,
  type ResourceStripMode
} from "../features/settings/settings-model";
import { PlayerClockStrip, playerClockGraceDisplay } from "../features/game-board/PlayerClock";
import { ArchivesDualStackLane } from "../features/game-board/ArchivesDualStackLane";
import {
  RunnerOpponentZonesStrip,
  RunnerRigStrip,
  type FieldChoiceCardProps
} from "../features/game-board/RunnerBoardStrips";
import { ScoredAgendaOverlay } from "../features/game-board/ScoredAgendaOverlay";
import { RunTimelineOverlay } from "../features/game-board/RunTimelineOverlay";
import { SpecialZonesStrip } from "../features/game-board/SpecialZonesStrip";
import { ActionSlotMeter, ActiveMatchResourceStrip } from "../features/game-board/ResourceStrip";
import { ServerCounterStrip } from "../features/game-board/CounterStrips";
import { OpponentPanel, PlayerPanel } from "../features/game-board/SideStatusPanels";
import {
  ActionPanelDockPlaceholder,
  CostChips
} from "../features/actions/ActionControls";
import { LegalActionsPanel } from "../features/actions/LegalActionsPanel";
import { DamageImpactOverlay } from "../features/actions/DamageImpactOverlay";
import { OpponentActionOverlay } from "../features/actions/OpponentActionOverlay";
import { OpponentCueTitle } from "../features/actions/OpponentCueTitle";
import { FloatingActionPanelOverlay } from "../features/actions/FloatingActionPanelOverlay";
import {
  AccessRevealModal,
  ExposeReviewModal
} from "../features/actions/AccessReviewModals";
import {
  accessRevealFromCurrentRun,
  accessRevealFromLatestEvent,
  archivesRevealFromLatestEvent,
  exposeReviewFromLatestEvent,
  retainedArchivesRevealEvent,
  revealedEventCardIds
} from "../features/actions/access-review-derivation";
import { eventActionType, localActionSoundKey, localActionSoundKind, publicEventsAfter } from "../features/actions/local-action-sounds";
import { runHiddenContextActionHint } from "../features/actions/run-hidden-context-hint";
import { RecentGamesPanel } from "../features/recent/RecentGamesPanel";
import { recentSessionHeadline, recentSessionStatusLabel } from "../features/recent/recent-session-labels";
import { effectiveAiTurnPresentation, removePendingUndo } from "../features/match-session/client-payload-helpers";
import { ChroniclePanel, chronicleContextByEventId } from "../features/chronicle/ChroniclePanel";
import {
  FloatingAiDecisionDebugOverlay,
  type AiDecisionDebugOverlayStatus
} from "../features/debug/AiDecisionDebugOverlay";
import { DiagnosticsDrawer, shortDiagnosticsHash } from "../features/debug/DiagnosticsDrawer";
import { AiPacingControls } from "../features/debug/AiPacingControls";
import { StartLobbyPanel } from "../features/match-start/StartLobbyPanel";
import {
  formatLobbyTime,
  isInvalidatingTerminalStatus,
  matchFormatLabel,
  openMatchAgeLabel,
  playerSlotForSide,
  resultReasonLabel,
  seriesStatusText,
  shouldForgetRecoveryStatus,
  shortMatchId
} from "../features/match-start/lobby-format";
import {
  centralServerCountLabel,
  formatCardCount,
  formatHandLimitCount,
  iceStackSlotClass,
  opponentSide,
  serverHighlighted,
  serverLanesForSide,
  sideFromPublicPayload,
  sideLabel,
  sideStatusLineForView,
  turnActionHeaderLabel,
  turnSideForView,
  updateActionSlotCapacity,
  zoneHighlighted
} from "../features/game-board/board-view-helpers";

const RunIcon = Route;
const APP_NAME = "NETGRID";
const APP_STATUS_LABEL = "V1.9.22";
const APP_BRAND_ASSET_VERSION = "2026-05-10-brand-fix-2";
const APP_ICON_SRC = `/brand/netgrid-icon-cyber-v1.png?v=${APP_BRAND_ASSET_VERSION}`;
const APP_WORDMARK_SRC = `/brand/netgrid-wordmark-cyber-v1.png?v=${APP_BRAND_ASSET_VERSION}`;

type MatchStatus = ApiMatchStatus;
type GameMode = ApiClientGameMode;
type MatchFormat = ApiMatchFormat;
type MatchCardPool = ApiMatchCardPool;
type AiDifficulty = "easy" | "normal" | "hard";
type AiDeckPolicy = "fixed" | "selected" | "seeded_random" | "same_as_participant_a";
type AiTraceStartMode = "off" | "detailed";
type EntryTab = "play" | "catalog" | "decks" | "recent" | "options";
type DeckSideFilter = Side | "all";
type RunOverlayPositionPreference = OverlayPositionPreference;

type SeriesResultSummary = ApiSeriesResultSummary;
type GameResultSummary = ApiGameResultSummary;
type LifecycleResultSummary = ApiLifecycleResultSummary;
type ClientPayload = ApiSidePayload;
type LocalMatchClockAnchor = {
  matchId: string;
  matchStartedAtMs: number;
  decisionKey: string;
  decisionStartedAtMs: number;
};

type LobbyParticipant = ApiLobbyParticipantPayload;
type MatchStartLobby = ApiMatchStartLobbyPayload;
type LobbyClientPayload = ApiLobbyPayload;
type ServerMessage = ApiServerMessage;
type CreateMatchResponse = ApiCreateMatchResponse;
type JoinMatchResponse = ApiJoinMatchResponse;

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

type VisibleChoice = NonNullable<PlayerView["pendingChoice"]>;
type VisibleChoiceOption = VisibleChoice["options"][number];

type FocusedCard = {
  card: VisibleCard;
  matchId: string;
  hiddenSide?: Side;
};

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

const CORP_OPPONENT_HQ_PREVIEW_LIMIT = 18;
const CARD_DISPLAY_BASE_MIN_WIDTH = 108;

export default function Page() {
  const [entryTab, setEntryTab] = useState<EntryTab>("play");
  const [activeMatchWorkspace, setActiveMatchWorkspace] = useState<ActiveMatchWorkspace>("game");
  const [mode, setMode] = useState<"host" | "join">("host");
  const [recoveryTabSelected, setRecoveryTabSelected] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("human_vs_human");
  const [humanSideSelection, setHumanSideSelection] = useState<HumanSideSelection>("random");
  const [humanAiSideSelection, setHumanAiSideSelection] = useState<HumanAiSideSelection>("random");
  const [matchFormat, setMatchFormat] = useState<MatchFormat>("rules_match");
  const [matchCardPool, setMatchCardPool] = useState<MatchCardPool>("originalset");
  const [playerClockMode, setPlayerClockMode] = useState<MatchStartPlayerClockMode>("none");
  const [playerClockMinutes, setPlayerClockMinutes] = useState<MatchStartPlayerClockMinutes>(10);
  const [playerClockGraceSeconds, setPlayerClockGraceSeconds] = useState<MatchStartPlayerClockGraceSeconds>(10);
  const [runnerDifficulty, setRunnerDifficulty] = useState<AiDifficulty>("normal");
  const [corpDifficulty, setCorpDifficulty] = useState<AiDifficulty>("normal");
  const [aiDeckPolicy, setAiDeckPolicy] = useState<AiDeckPolicy>("selected");
  const [aiTraceStartMode, setAiTraceStartMode] = useState<AiTraceStartMode>("off");
  const [testSetupMode, setTestSetupMode] = useState(false);
  const [displayName, setDisplayName] = useState("Teilnehmer A");
  const [matchStartSettingsLoaded, setMatchStartSettingsLoaded] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<3 | 5 | 10>(3);
  const [seed, setSeed] = useState("");
  const [joinLinkInput, setJoinLinkInput] = useState("");
  const [joinMatchId, setJoinMatchId] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [discoverableInLan, setDiscoverableInLan] = useState(true);
  const [openLanMatches, setOpenLanMatches] = useState<OpenMatchEntry[]>([]);
  const [openLanLoading, setOpenLanLoading] = useState(false);
  const [openLanError, setOpenLanError] = useState("");
  const [openLanUpdatedAt, setOpenLanUpdatedAt] = useState<string | null>(null);
  const [recentGameResults, setRecentGameResults] = useState<ApiRecentResultEntry[]>([]);
  const [recentGameResultsLoading, setRecentGameResultsLoading] = useState(false);
  const [recentGameResultsError, setRecentGameResultsError] = useState("");
  const [recentGameResultsUpdatedAt, setRecentGameResultsUpdatedAt] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [payload, setPayload] = useState<ClientPayload | null>(null);
  const [lobby, setLobby] = useState<LobbyClientPayload | null>(null);
  const [matchClockNowMs, setMatchClockNowMs] = useState(() => Date.now());
  const [matchClockAnchor, setMatchClockAnchor] = useState<LocalMatchClockAnchor | null>(null);
  const [lobbyChatText, setLobbyChatText] = useState("");
  const [simulation, setSimulation] = useState<AiSimulationSummary | null>(null);
  const [simulationPending, setSimulationPending] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("offline");
  const [notice, setNotice] = useState("");
  const [undoNotice, setUndoNotice] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSide, setCatalogSide] = useState<Side | "all">("all");
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatusKey | "all">("all");
  const [catalogExpertStatuses, setCatalogExpertStatuses] = useState(false);
  const [catalogTypeFilters, setCatalogTypeFilters] = useState<CatalogTypeFilterState>({ ...ALL_CATALOG_TYPE_FILTERS });
  const [catalogSetFilter, setCatalogSetFilter] = useState("all");
  const [catalogFiltersOpen, setCatalogFiltersOpen] = useState(false);
  const [catalogBlockStatusFilter, setCatalogBlockStatusFilter] = useState<CatalogBlockStatusFilterKey>("all");
  const [catalogRarityFilter, setCatalogRarityFilter] = useState<CatalogRarityFilterKey>("all");
  const [catalogAiHintFilter, setCatalogAiHintFilter] = useState<CatalogAiHintFilterKey>("all");
  const [catalogCards, setCatalogCards] = useState<CatalogCardSummary[]>([]);
  const [catalogFilters, setCatalogFilters] = useState<CatalogListResponse["filters"] | null>(null);
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
  const [preferGermanCardImages, setPreferGermanCardImages] = useState(false);
  const [showSetBadges, setShowSetBadges] = useState(true);
  const [cardPreviewCollapsed, setCardPreviewCollapsed] = useState(false);
  const [boardZoneCollapsed, setBoardZoneCollapsed] = useState<Record<string, boolean>>({});
  const [scoreAreaOverlays, setScoreAreaOverlays] = useState<Record<Side, boolean>>({ runner: false, corp: false });
  const [scoreAreaOverlayPositions, setScoreAreaOverlayPositions] = useState<Record<Side, RunOverlayPositionPreference>>({
    runner: { kind: "default" },
    corp: { kind: "default" }
  });
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [undoPanelOpen, setUndoPanelOpen] = useState(false);
  const [focusedCard, setFocusedCard] = useState<FocusedCard | null>(null);
  const [dismissedAccessEventIds, setDismissedAccessEventIds] = useState<string[]>([]);
  const [dismissedExposeReviewEventId, setDismissedExposeReviewEventId] = useState<string | null>(null);
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
  const [cardImageSkinSettingsLoaded, setCardImageSkinSettingsLoaded] = useState(false);
  const [chronicleDetailMode, setChronicleDetailMode] = useState<ChronicleDetailMode>("full");
  const [chronicleDetailModeLoaded, setChronicleDetailModeLoaded] = useState(false);

  const boardZoneCollapsedFor = (key: string): boolean => Boolean(boardZoneCollapsed[key]);
  const toggleBoardZoneCollapsed = (key: string) => {
    setBoardZoneCollapsed((current) => ({ ...current, [key]: !current[key] }));
  };
  const [actionCueQueue, setActionCueQueue] = useState<OpponentActionCue[]>([]);
  const [currentActionCue, setCurrentActionCue] = useState<OpponentActionCue | null>(null);
  const [damageImpactQueue, setDamageImpactQueue] = useState<DamageImpactCue[]>([]);
  const [currentDamageImpact, setCurrentDamageImpact] = useState<DamageImpactCue | null>(null);
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
  const [autoCorpMandatoryDrawEnabled, setAutoCorpMandatoryDrawEnabled] = useState(false);
  const [autoDiscardEnabled, setAutoDiscardEnabled] = useState(false);
  const [priorityWindowHoldEnabled, setPriorityWindowHoldEnabled] = useState(false);
  const [topbarStickyEnabled, setTopbarStickyEnabled] = useState(true);
  const [resourceStripMode, setResourceStripMode] = useState<ResourceStripMode>("auto");
  const [actionPanelMode, setActionPanelMode] = useState<ActionPanelMode>("docked");
  const [aiDecisionDebugOverlayEnabled, setAiDecisionDebugOverlayEnabled] = useState(false);
  const [actionPanelOverlayPosition, setActionPanelOverlayPosition] = useState<RunOverlayPositionPreference>(() =>
    typeof window === "undefined"
      ? { kind: "default" }
      : parseOverlayPositionPreference(readLocalStorageWithLegacy(ACTION_PANEL_OVERLAY_POSITION_STORAGE_KEY, LEGACY_ACTION_PANEL_OVERLAY_POSITION_STORAGE_KEY))
  );
  const [aiDecisionDebugOverlayPosition, setAiDecisionDebugOverlayPosition] = useState<RunOverlayPositionPreference>(() =>
    typeof window === "undefined"
      ? { kind: "default" }
      : parseOverlayPositionPreference(readLocalStorageWithLegacy(AI_DECISION_DEBUG_OVERLAY_POSITION_STORAGE_KEY, LEGACY_AI_DECISION_DEBUG_OVERLAY_POSITION_STORAGE_KEY))
  );
  const [aiDecisionDebugStatus, setAiDecisionDebugStatus] = useState<AiDecisionDebugOverlayStatus>("off");
  const [aiDecisionDebugError, setAiDecisionDebugError] = useState("");
  const [aiDecisionDebugPreview, setAiDecisionDebugPreview] = useState<AiDecisionPreview | null>(null);
  const [aiDecisionDebugPreviewError, setAiDecisionDebugPreviewError] = useState("");
  const [aiDecisionDebugTraceIndex, setAiDecisionDebugTraceIndex] = useState<MaintenanceAiTraceIndexEntry[]>([]);
  const [aiDecisionDebugTrace, setAiDecisionDebugTrace] = useState<MaintenanceAiTraceDetail | null>(null);
  const [topbarHeightPx, setTopbarHeightPx] = useState(0);
  const [statusPanelsVisible, setStatusPanelsVisible] = useState(true);
  const [gameplaySettingsLoaded, setGameplaySettingsLoaded] = useState(false);
  const [discardChoiceSelection, setDiscardChoiceSelection] = useState<{ choiceId: string; selectedOptionIds: string[] } | null>(null);
  const [fieldCardChoiceSelection, setFieldCardChoiceSelection] = useState<{ choiceId: string; selectedOptionIds: string[] } | null>(null);
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
  const autoCorpMandatoryDrawSubmittedKeyRef = useRef<string | null>(null);
  const autoDiscardSubmittedKeyRef = useRef<string | null>(null);
  const pendingAiAdvanceKeyRef = useRef<string | null>(null);
  const aiDecisionDebugEnabledMatchRef = useRef<string | null>(null);
  const aiDecisionDebugTraceIdRef = useRef<string | null>(null);
  const localAiPacingModeRef = useRef<AiPacingMode>("paced");
  const hasStoredMatchStartSettingsRef = useRef(false);
  const topbarRef = useRef<HTMLElement | null>(null);
  const statusPanelsRef = useRef<HTMLElement | null>(null);
  const lastActionSlotTurnRef = useRef<{ matchId: string; activeSide: Side } | null>(null);
  const cardPreviewCollapsedStorageKey = session ? cardPreviewCollapsedStorageKeyFor(session.matchId, session.side) : null;

  const selectStartTab = (nextMode: "host" | "join" | "resume") => {
    if (nextMode === "resume") {
      setRecoveryTabSelected(true);
      return;
    }
    setRecoveryTabSelected(false);
    setMode(nextMode);
  };

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
      if (storedMatchStartSettings.matchCardPool) setMatchCardPool(storedMatchStartSettings.matchCardPool);
      if (storedMatchStartSettings.playerClockMode) setPlayerClockMode(storedMatchStartSettings.playerClockMode);
      if (storedMatchStartSettings.playerClockMinutes) setPlayerClockMinutes(storedMatchStartSettings.playerClockMinutes);
      if (storedMatchStartSettings.playerClockGraceSeconds !== undefined) setPlayerClockGraceSeconds(storedMatchStartSettings.playerClockGraceSeconds);
      if (storedMatchStartSettings.runnerDifficulty) setRunnerDifficulty(storedMatchStartSettings.runnerDifficulty);
      if (storedMatchStartSettings.corpDifficulty) setCorpDifficulty(storedMatchStartSettings.corpDifficulty);
      if (storedMatchStartSettings.aiDeckPolicy) setAiDeckPolicy(storedMatchStartSettings.aiDeckPolicy);
      if (typeof storedMatchStartSettings.testSetupMode === "boolean") setTestSetupMode(storedMatchStartSettings.testSetupMode);
      if (storedMatchStartSettings.countdownSeconds) setCountdownSeconds(storedMatchStartSettings.countdownSeconds);
      if (typeof storedMatchStartSettings.seed === "string") setSeed(normalizeMatchSeed(storedMatchStartSettings.seed));
      else setSeed(createMatchSeed());
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
      setSeed(createMatchSeed());
    }
    setMatchStartSettingsLoaded(true);
    const storedSession = loadCurrentTabSession();
    if (matchId && reconnectToken && (reconnectSide === "runner" || reconnectSide === "corp")) {
      setEntryTab("play");
      selectStartTab("join");
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
        setRecoveryTabSelected(true);
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
      selectStartTab("join");
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
    setRecoveryTabSelected(true);
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
    const stored = readLocalStorageWithLegacy(CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY, LEGACY_CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { preferGermanCardImages?: unknown; showSetBadges?: unknown };
        if (typeof parsed.preferGermanCardImages === "boolean") setPreferGermanCardImages(parsed.preferGermanCardImages);
        if (typeof parsed.showSetBadges === "boolean") setShowSetBadges(parsed.showSetBadges);
      } catch {
        removeLocalStorageKeys(CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY, LEGACY_CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY);
      }
    }
    setCardImageSkinSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!cardImageSkinSettingsLoaded) return;
    window.localStorage.setItem(CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY, JSON.stringify({ preferGermanCardImages, showSetBadges }));
  }, [cardImageSkinSettingsLoaded, preferGermanCardImages, showSetBadges]);

  useEffect(() => {
    setChronicleDetailMode(normalizeChronicleDetailMode(readLocalStorageWithLegacy(CHRONICLE_DETAIL_MODE_STORAGE_KEY, LEGACY_CHRONICLE_DETAIL_MODE_STORAGE_KEY)));
    setChronicleDetailModeLoaded(true);
  }, []);

  useEffect(() => {
    if (!chronicleDetailModeLoaded) return;
    window.localStorage.setItem(CHRONICLE_DETAIL_MODE_STORAGE_KEY, chronicleDetailMode);
  }, [chronicleDetailModeLoaded, chronicleDetailMode]);

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
        const parsed = JSON.parse(stored) as { autoCorpMandatoryDrawEnabled?: unknown; autoDiscardEnabled?: unknown; autoEndTurnEnabled?: unknown; priorityWindowHoldEnabled?: unknown; topbarStickyEnabled?: unknown; resourceStripMode?: unknown; actionPanelMode?: unknown; aiDecisionDebugOverlayEnabled?: unknown };
        if (typeof parsed.autoCorpMandatoryDrawEnabled === "boolean") setAutoCorpMandatoryDrawEnabled(parsed.autoCorpMandatoryDrawEnabled);
        if (typeof parsed.autoEndTurnEnabled === "boolean") setAutoEndTurnEnabled(parsed.autoEndTurnEnabled);
        if (typeof parsed.autoDiscardEnabled === "boolean") setAutoDiscardEnabled(parsed.autoDiscardEnabled);
        if (typeof parsed.priorityWindowHoldEnabled === "boolean") setPriorityWindowHoldEnabled(parsed.priorityWindowHoldEnabled);
        if (typeof parsed.topbarStickyEnabled === "boolean") setTopbarStickyEnabled(parsed.topbarStickyEnabled);
        if (typeof parsed.aiDecisionDebugOverlayEnabled === "boolean") setAiDecisionDebugOverlayEnabled(parsed.aiDecisionDebugOverlayEnabled);
        setResourceStripMode(normalizeResourceStripMode(parsed.resourceStripMode));
        setActionPanelMode(normalizeActionPanelMode(parsed.actionPanelMode));
      } catch {
        removeLocalStorageKeys(GAMEPLAY_SETTINGS_STORAGE_KEY, LEGACY_GAMEPLAY_SETTINGS_STORAGE_KEY);
      }
    }
    setGameplaySettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!gameplaySettingsLoaded) return;
    window.localStorage.setItem(GAMEPLAY_SETTINGS_STORAGE_KEY, JSON.stringify({ autoCorpMandatoryDrawEnabled, autoDiscardEnabled, autoEndTurnEnabled, priorityWindowHoldEnabled, topbarStickyEnabled, resourceStripMode, actionPanelMode, aiDecisionDebugOverlayEnabled }));
  }, [gameplaySettingsLoaded, autoCorpMandatoryDrawEnabled, autoDiscardEnabled, autoEndTurnEnabled, priorityWindowHoldEnabled, topbarStickyEnabled, resourceStripMode, actionPanelMode, aiDecisionDebugOverlayEnabled]);

  useEffect(() => {
    window.localStorage.setItem(ACTION_PANEL_OVERLAY_POSITION_STORAGE_KEY, serializeOverlayPositionPreference(actionPanelOverlayPosition));
  }, [actionPanelOverlayPosition]);

  useEffect(() => {
    window.localStorage.setItem(AI_DECISION_DEBUG_OVERLAY_POSITION_STORAGE_KEY, serializeOverlayPositionPreference(aiDecisionDebugOverlayPosition));
  }, [aiDecisionDebugOverlayPosition]);

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
        matchCardPool,
        playerClockMode,
        playerClockMinutes,
        playerClockGraceSeconds,
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
    matchCardPool,
    playerClockMode,
    playerClockMinutes,
    playerClockGraceSeconds,
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
    if (!session.sessionToken.trim() || !session.webSocketUrl.trim()) {
      setConnection("offline");
      return;
    }
    connectWebSocket(session);
    return () => socketRef.current?.close();
  }, [session?.matchId, session?.sessionToken]);

  const blockStatusFilteredCatalogCards = useMemo(() => filterCatalogCardsByBlockStatus(catalogCards, catalogBlockStatusFilter), [catalogBlockStatusFilter, catalogCards]);
  const catalogBlockStatusCounts = useMemo(() => summarizeCatalogBlockStatusFilters(catalogCards), [catalogCards]);
  const catalogSetOptions = useMemo(() => catalogSetFilterOptions(blockStatusFilteredCatalogCards), [blockStatusFilteredCatalogCards]);
  const setFilteredCatalogCards = useMemo(() => filterCatalogCardsBySetId(blockStatusFilteredCatalogCards, catalogSetFilter), [blockStatusFilteredCatalogCards, catalogSetFilter]);
  const aiHintFilteredCatalogCards = useMemo(() => filterCatalogCardsByAiHint(setFilteredCatalogCards, catalogAiHintFilter), [setFilteredCatalogCards, catalogAiHintFilter]);
  const rarityFilteredCatalogCards = useMemo(() => filterCatalogCardsByRarity(aiHintFilteredCatalogCards, catalogRarityFilter), [aiHintFilteredCatalogCards, catalogRarityFilter]);
  const filteredCatalogCards = useMemo(() => filterCatalogCardsByType(rarityFilteredCatalogCards, catalogTypeFilters), [catalogTypeFilters, rarityFilteredCatalogCards]);
  const filteredCatalogSummary = useMemo(() => summarizeCatalogStatuses(filteredCatalogCards), [filteredCatalogCards]);
  const catalogAiHintCounts = useMemo(() => summarizeCatalogAiHintFilters(setFilteredCatalogCards), [setFilteredCatalogCards]);
  const catalogRarityCounts = useMemo(() => summarizeCatalogRarityFilters(aiHintFilteredCatalogCards), [aiHintFilteredCatalogCards]);
  const catalogTypeCounts = useMemo(() => summarizeCatalogTypeFilters(rarityFilteredCatalogCards), [rarityFilteredCatalogCards]);

  useEffect(() => {
    if (catalogSetFilter === "all") return;
    if (!catalogSetOptions.some((option) => option.key === catalogSetFilter)) setCatalogSetFilter("all");
  }, [catalogSetFilter, catalogSetOptions]);

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
        setSelectedCatalogId((current) => nextCatalogSelection(current, visibleCards, catalogTypeFilters));
      })
      .catch(() => {
        setCatalogCards([]);
        setCatalogFilters(null);
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
  useEffect(() => {
    if (!payload || !activeView) {
      setMatchClockAnchor(null);
      return;
    }
    const decisionKey = matchTimerDecisionKey({ matchId: payload.matchId, playerView: activeView, legalActions: payload.legalActions, winner: payload.winner });
    const now = Date.now();
    setMatchClockNowMs(now);
    setMatchClockAnchor((current) => {
      if (!current || current.matchId !== payload.matchId) {
        return {
          matchId: payload.matchId,
          matchStartedAtMs: now,
          decisionKey,
          decisionStartedAtMs: now
        };
      }
      if (current.decisionKey !== decisionKey) {
        return {
          ...current,
          decisionKey,
          decisionStartedAtMs: now
        };
      }
      return current;
    });
  }, [
    activeView,
    payload?.legalActions,
    payload?.matchId,
    payload?.winner
  ]);

  useEffect(() => {
    if (!payload || !activeView) return;
    setMatchClockNowMs(Date.now());
    const handle = window.setInterval(() => setMatchClockNowMs(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, [activeView, payload?.matchId]);

  const activeDiscardChoice = activeView?.pendingChoice?.source === "discard_phase" ? activeView.pendingChoice : null;
  const activeDiscardOptionIds = useMemo(() => new Set(activeDiscardChoice?.options.map((option) => option.id) ?? []), [activeDiscardChoice]);
  const currentDiscardChoiceSelection = discardChoiceSelection;
  const selectedDiscardOptionIds =
    currentDiscardChoiceSelection && currentDiscardChoiceSelection.choiceId === activeDiscardChoice?.choiceId
      ? currentDiscardChoiceSelection.selectedOptionIds.filter((optionId) => activeDiscardOptionIds.has(optionId))
      : [];
  const selectedDiscardOptionIdSet = useMemo(() => new Set(selectedDiscardOptionIds), [selectedDiscardOptionIds.join("|")]);
  const activeFieldCardChoice = activeView?.pendingChoice && shouldUseFieldCardChoice(activeView.pendingChoice, activeView) ? activeView.pendingChoice : null;
  const activeFieldCardChoiceOptionIds = useMemo(() => new Set(activeFieldCardChoice?.options.filter((option) => option.selectable !== false).map((option) => option.id) ?? []), [activeFieldCardChoice]);
  const currentFieldCardChoiceSelection = fieldCardChoiceSelection;
  const selectedFieldCardChoiceOptionIds =
    currentFieldCardChoiceSelection && currentFieldCardChoiceSelection.choiceId === activeFieldCardChoice?.choiceId
      ? currentFieldCardChoiceSelection.selectedOptionIds.filter((optionId) => activeFieldCardChoiceOptionIds.has(optionId))
      : [];
  const selectedFieldCardChoiceOptionIdSet = useMemo(() => new Set(selectedFieldCardChoiceOptionIds), [selectedFieldCardChoiceOptionIds.join("|")]);
  const activeFieldCardChoiceAction = activeFieldCardChoice
    ? payload?.legalActions.find(
        (action) =>
          action.type === "resolve_choice" &&
          action.payload?.choiceId === activeFieldCardChoice.choiceId,
      )
    : undefined;
  const latestEventId = payload?.eventTail.at(-1)?.eventId;
  const canReconnect = Boolean(session?.reconnectToken);
  const runnerSnapshots = deckSnapshots.filter((snapshot) => snapshot.side === "runner" && snapshot.validation.ok && snapshotAllowedForMatchCardPool(snapshot, matchCardPool));
  const corpSnapshots = deckSnapshots.filter((snapshot) => snapshot.side === "corp" && snapshot.validation.ok && snapshotAllowedForMatchCardPool(snapshot, matchCardPool));
  const matchStartLocalDecks = localDecks.filter((deck) => editableDeckAllowedForMatchCardPool(deck, matchCardPool));
  const defaultCorpSnapshot = corpSnapshots.find((snapshot) => snapshot.deckSnapshotId === DEFAULT_CORP_SNAPSHOT_ID) ?? corpSnapshots[0] ?? null;
  const selectedRunnerSnapshot = runnerSnapshots.find((snapshot) => snapshot.deckSnapshotId === selectedRunnerSnapshotId) ?? runnerSnapshots[0] ?? null;
  const selectedCorpSnapshot = corpSnapshots.find((snapshot) => snapshot.deckSnapshotId === selectedCorpSnapshotId) ?? defaultCorpSnapshot;
  const selectedParticipantBRunnerSnapshot = runnerSnapshots.find((snapshot) => snapshot.deckSnapshotId === selectedParticipantBRunnerSnapshotId) ?? runnerSnapshots[0] ?? null;
  const selectedParticipantBCorpSnapshot = corpSnapshots.find((snapshot) => snapshot.deckSnapshotId === selectedParticipantBCorpSnapshotId) ?? corpSnapshots[0] ?? null;
  const runnerLocalDeck = matchStartLocalDecks.find((deck) => deck.deckId === selectedRunnerLocalDeckId && deck.side === "runner") ?? null;
  const corpLocalDeck = matchStartLocalDecks.find((deck) => deck.deckId === selectedCorpLocalDeckId && deck.side === "corp") ?? null;
  const participantBRunnerLocalDeck = matchStartLocalDecks.find((deck) => deck.deckId === selectedParticipantBRunnerLocalDeckId && deck.side === "runner") ?? null;
  const participantBCorpLocalDeck = matchStartLocalDecks.find((deck) => deck.deckId === selectedParticipantBCorpLocalDeckId && deck.side === "corp") ?? null;
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
    matchCardPool,
    humanSideSelection,
    humanAiSideSelection,
    aiDeckPolicy,
    testSetupMode
  }).concat(playerClockMode === "player_clock" ? [`Spielerzeit ${playerClockMinutes} Min · ${playerClockGraceSeconds} s Kulanz`] : ["Ohne Spielerzeit"]);
  const playerClockDetailControlsDisabled = matchStartSettingsLoaded ? playerClockMode === "none" : false;
  const aiSlotDisabled = hasAiOpponent && aiDeckPolicy !== "selected";
  const aiDeckPolicyUsesPrimaryDeckSlots = aiDeckPolicy === "selected" || aiDeckPolicy === "same_as_participant_a";
  const openLanJoinableIds = new Set(openLanMatches.map((entry) => entry.matchId));
  const joinMatchIdTrimmed = joinMatchId.trim();
  const joinTokenTrimmed = joinToken.trim();
  const canJoinViaOpenLan = joinMatchIdTrimmed.length > 0 && joinTokenTrimmed.length === 0 && openLanJoinableIds.has(joinMatchIdTrimmed);
  const canSubmitJoin = joinMatchIdTrimmed.length > 0 && (joinTokenTrimmed.length > 0 || canJoinViaOpenLan);
  const visibleDeckMetadataEntries =
    gameMode === "ai_vs_ai"
      ? aiDeckPolicyUsesPrimaryDeckSlots
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
    () => allCatalogCards.filter((card) => catalogCardAllowedForDeckEditor(card, selectedLocalDeck)),
    [allCatalogCards, selectedLocalDeck?.formatProfileId, selectedLocalDeck?.side]
  );
  const gripPreviewCard = activeView?.own.gripOrHq.find((card) => card.known) ?? null;
  const rigPreviewCard = activeView?.own.rig?.find((card) => card.known) ?? null;
  const currentFocusedCard = focusedCard?.matchId === payload?.matchId ? focusedCard : null;
  const previewSelection =
    currentFocusedCard ??
    (activeView?.run?.approachedIce ? { card: activeView.run.approachedIce, hiddenSide: "corp" as const } : null) ??
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
  const fieldChoiceOptionForCard = (card: VisibleCard): VisibleChoiceOption | null => {
    return activeFieldCardChoice && activeView ? fieldCardChoiceOptionForCard(activeFieldCardChoice, activeView, card) : null;
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
  const toggleFieldCardChoiceOption = (optionId: string) => {
    if (!activeFieldCardChoice) return;
    const minSelections = Math.max(0, Math.floor(activeFieldCardChoice.minSelections));
    const maxSelections = Math.max(minSelections, Math.floor(activeFieldCardChoice.maxSelections));
    setFieldCardChoiceSelection((current) => {
      const currentSelected = current?.choiceId === activeFieldCardChoice.choiceId ? current.selectedOptionIds.filter((id) => activeFieldCardChoiceOptionIds.has(id)) : [];
      const nextSelected = currentSelected.includes(optionId)
        ? currentSelected.filter((id) => id !== optionId)
        : currentSelected.length >= maxSelections
          ? maxSelections === 1
            ? [optionId]
            : currentSelected
          : [...currentSelected, optionId];
      return { choiceId: activeFieldCardChoice.choiceId, selectedOptionIds: nextSelected };
    });
  };
  const clearFieldCardChoiceSelection = () => {
    if (!activeFieldCardChoice) return;
    setFieldCardChoiceSelection({ choiceId: activeFieldCardChoice.choiceId, selectedOptionIds: [] });
  };
  const fieldChoiceCardProps = (card: VisibleCard): FieldChoiceCardProps => {
    const option = fieldChoiceOptionForCard(card);
    if (!option) return {};
    if (isSingleInstalledCorpExposeChoice(activeFieldCardChoice)) {
      const disabled =
        Boolean(payload?.winner) ||
        connection !== "online" ||
        !activeFieldCardChoiceAction;
      const submitExposeTarget = () => {
        if (!activeFieldCardChoice || !activeFieldCardChoiceAction) return;
        submitChoiceOptions(
          activeFieldCardChoiceAction,
          activeFieldCardChoice.choiceId,
          [option.id],
        );
      };
      return {
        choiceSelected: false,
        choiceShortcut: {
          selected: false,
          disabled,
          onToggle: submitExposeTarget,
          label: "Karte ansehen",
          selectedLabel: "Karte ansehen",
          icon: "eye",
        },
        onSelect: submitExposeTarget,
      };
    }
    const selected = selectedFieldCardChoiceOptionIdSet.has(option.id);
    return {
      choiceSelected: selected,
      choiceShortcut: {
        selected,
        disabled: Boolean(payload?.winner) || connection !== "online",
        onToggle: () => toggleFieldCardChoiceOption(option.id),
        label: "Für Auswahl markieren",
        selectedLabel: "Aus Auswahl entfernen"
      },
      onSelect: () => toggleFieldCardChoiceOption(option.id)
    };
  };
  const latestAccessRevealEvent = payload ? latestRetainableAccessRevealEvent(payload.eventTail) : null;
  const lastDismissedAccessEventId = dismissedAccessEventIds.at(-1) ?? null;
  const accessRevealEvent = payload ? retainedAccessRevealEvent(payload.eventTail, lastDismissedAccessEventId) : null;
  const archivesRevealEvent = payload ? retainedArchivesRevealEvent(payload.eventTail, dismissedAccessEventIds) : null;
  const archivesReveal = payload ? archivesRevealFromLatestEvent(archivesRevealEvent ?? undefined, catalogDetailsById, payload.side) : null;
  const currentAccessReveal = payload ? accessRevealFromCurrentRun(payload.playerView, catalogDetailsById, payload.legalActions, payload.side, payload.eventTail, latestAccessRevealEvent) : null;
  const retainedEventAccessReveal = payload ? accessRevealFromLatestEvent(accessRevealEvent ?? undefined, catalogDetailsById, payload.legalActions, payload.side, payload.eventTail) : null;
  const accessReveal = archivesReveal ?? currentAccessReveal ?? retainedEventAccessReveal;
  const showAccessReveal = Boolean(accessReveal && !dismissedAccessEventIds.includes(accessReveal.eventId));
  const exposeReviewEvent = payload ? retainedExposeReviewEvent(payload.eventTail, dismissedExposeReviewEventId) : null;
  const exposeReview = payload ? exposeReviewFromLatestEvent(exposeReviewEvent ?? undefined, catalogDetailsById, payload.side) : null;
  const viewedApproachIceId = approachIceExposeViewingIceId(payload?.legalActions ?? []);
  const viewedInstalledExposeCardId = installedCorpExposeReviewCardId(activeView?.pendingChoice);
  const showExposeReview = Boolean(exposeReview && dismissedExposeReviewEventId !== exposeReview.eventId && !showAccessReveal && !viewedApproachIceId && !viewedInstalledExposeCardId);
  const resultSummary = payload?.resultSummary ?? null;
  const resultKey = resultSummary ? `${payload?.matchId ?? "match"}:${resultSummary.finalStateHash}` : null;
  const showResultModal = Boolean(resultSummary && resultKey && dismissedResultKey !== resultKey);
  const canReturnToStart = Boolean(payload && (resultSummary || payload.winner || payload.matchStatus === "finished" || payload.matchStatus === "forfeited"));
  const canStartNextSeriesGame = Boolean(resultSummary?.series?.nextAvailable);
  const opponentDisplayName = payload?.opponentStatus.displayName ?? lobby?.opponentStatus.displayName ?? null;
  const canForfeit = Boolean(payload && payload.matchStatus === "active" && !payload.winner);
  const matchClockDisplay =
    payload && activeView && matchClockAnchor?.matchId === payload.matchId
      ? {
          matchElapsed: formatMatchTimerDuration(matchClockNowMs - matchClockAnchor.matchStartedAtMs),
          decisionElapsed: formatMatchTimerDuration(matchClockNowMs - matchClockAnchor.decisionStartedAtMs),
          scopeLabel: payload.winner ? "Spiel beendet" : matchTimerScopeLabel(activeView, payload.legalActions),
          graceLabel: playerClockGraceDisplay(payload.playerClock, matchClockNowMs)
        }
      : null;
  const activeMatchIsGame = activeMatchWorkspace === "game";
  useEffect(() => {
    const topbar = topbarRef.current;
    if (!topbar) {
      setTopbarHeightPx(0);
      return;
    }
    const updateHeight = () => setTopbarHeightPx(Math.ceil(topbar.getBoundingClientRect().height));
    updateHeight();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }
    const observer = new ResizeObserver(updateHeight);
    observer.observe(topbar);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [activeMatchIsGame, payload?.matchId]);

  useEffect(() => {
    if (!activeMatchIsGame) {
      setStatusPanelsVisible(true);
      return;
    }
    const statusPanels = statusPanelsRef.current;
    if (!statusPanels) {
      setStatusPanelsVisible(true);
      return;
    }
    let animationFrame = 0;
    const topOffset = topbarStickyEnabled ? topbarHeightPx : 0;
    const hideBelow = topOffset + 24;
    const showAbove = topOffset + 72;
    const updateVisibility = () => {
      animationFrame = 0;
      const rect = statusPanels.getBoundingClientRect();
      setStatusPanelsVisible((current) => {
        if (current && rect.bottom <= hideBelow) return false;
        if (!current && rect.bottom >= showAbove) return true;
        return current;
      });
    };
    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateVisibility);
    };
    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [activeMatchIsGame, payload?.matchId, topbarHeightPx, topbarStickyEnabled]);

  const activeCueHighlight = currentActionCue?.highlight ?? null;
  const hasDecisionCue = Boolean(currentActionCue?.requiresLocalAttention || activeView?.pendingChoice || (activeView?.activeSide === activeView?.side && payload?.legalActions.length));
  const legalActionSplit = useMemo(() => splitLegalActions(payload?.legalActions ?? []), [payload?.legalActions]);
  const runActions = useMemo(() => (activeView ? runWindowActions(activeView, payload?.legalActions ?? []) : []), [activeView, payload?.legalActions]);
  const selectedPanelContext = selectedActionContext?.kind === "server" ? selectedActionContext : null;
  const selectedPanelContextActions = selectedPanelContext ? legalActionSplit.contextualActions.filter((action) => actionMatchesContext(action, selectedPanelContext)) : [];
  const runActionIds = new Set(runActions.map((action) => action.actionId));
  const floatingPanelPrimaryActions = activeView?.run ? legalActionSplit.primaryActions.filter((action) => !runActionIds.has(action.actionId)) : legalActionSplit.primaryActions;
  const floatingPanelContextualActions = activeView?.run ? selectedPanelContextActions.filter((action) => !runActionIds.has(action.actionId)) : selectedPanelContextActions;
  const floatingPanelNeededDuringRun = Boolean(activeView?.run && (activeView.pendingChoice || floatingPanelPrimaryActions.length > 0 || floatingPanelContextualActions.length > 0));
  const showFloatingActionPanel = Boolean(activeMatchIsGame && activeView && actionPanelMode === "floating" && (!activeView.run || floatingPanelNeededDuringRun));
  const aiDecisionDebugMatchId = activeMatchIsGame && session && payload ? session.matchId : "";
  const showAiDecisionDebugOverlay = Boolean(activeMatchIsGame && aiDecisionDebugOverlayEnabled && session);
  const floatingPanelHasHiddenContextActions = Boolean(!activeView?.run && legalActionSplit.contextualActions.length > 0 && selectedActionContext?.kind !== "card");
  const cardActionsFor = (card: VisibleCard): LegalAction[] => {
    if (!card.known) return [];
    return orderedCardContextActions(
      legalActionSplit.contextualActions.filter((action) => actionMatchesContext(action, { kind: "card", id: card.instanceId, label: card.title ?? "Karte" }))
    );
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
  const resourceStripVisible = resourceStripMode === "on" || (resourceStripMode === "auto" && !statusPanelsVisible);
  const activeMatchClassName = [
    "app",
    "activeMatch",
    topbarStickyEnabled ? "" : "topbarStickyDisabled",
    actionPanelMode === "floating" ? "actionPanelFloatingMode" : "",
    `resourceStrip-${resourceStripMode}`,
    resourceStripVisible ? "resourceStripVisible" : ""
  ].filter(Boolean).join(" ");

  useEffect(() => {
    if (!aiDecisionDebugOverlayEnabled || !aiDecisionDebugMatchId) {
      setAiDecisionDebugStatus("off");
      setAiDecisionDebugError("");
      setAiDecisionDebugPreview(null);
      setAiDecisionDebugPreviewError("");
      setAiDecisionDebugTraceIndex([]);
      setAiDecisionDebugTrace(null);
      aiDecisionDebugEnabledMatchRef.current = null;
      aiDecisionDebugTraceIdRef.current = null;
      return;
    }
    let closed = false;
    const enableTracing = async () => {
      if (aiDecisionDebugEnabledMatchRef.current === aiDecisionDebugMatchId) {
        setAiDecisionDebugStatus((current) => current === "off" ? "waiting" : current);
        return;
      }
      setAiDecisionDebugStatus("activating");
      setAiDecisionDebugError("");
      setAiDecisionDebugPreview(null);
      setAiDecisionDebugPreviewError("");
      setAiDecisionDebugTraceIndex([]);
      setAiDecisionDebugTrace(null);
      aiDecisionDebugTraceIdRef.current = null;
      try {
        await enableAiDecisionDebugTracing(aiDecisionDebugMatchId);
        if (closed) return;
        aiDecisionDebugEnabledMatchRef.current = aiDecisionDebugMatchId;
        setAiDecisionDebugStatus("waiting");
      } catch (error) {
        if (closed) return;
        setAiDecisionDebugStatus("error");
        setAiDecisionDebugError(error instanceof Error ? error.message : "KI-Trace konnte nicht aktiviert werden.");
      }
    };
    void enableTracing();
    return () => {
      closed = true;
    };
  }, [aiDecisionDebugOverlayEnabled, aiDecisionDebugMatchId]);

  useEffect(() => {
    if (!aiDecisionDebugOverlayEnabled || !aiDecisionDebugMatchId || aiDecisionDebugStatus === "off" || aiDecisionDebugStatus === "error") return;
    let closed = false;
    const loadLatestTrace = async () => {
      try {
        const traces = await fetchAiDecisionDebugTraceIndex(aiDecisionDebugMatchId);
        if (closed) return;
        setAiDecisionDebugTraceIndex(traces);
        const latestTraceId = latestMaintenanceAiTraceId(traces);
        if (!latestTraceId) {
          setAiDecisionDebugStatus("waiting");
          return;
        }
        if (latestTraceId !== aiDecisionDebugTraceIdRef.current) {
          const detail = await fetchAiDecisionDebugTraceDetail(latestTraceId);
          if (closed) return;
          aiDecisionDebugTraceIdRef.current = latestTraceId;
          setAiDecisionDebugTrace(detail);
        }
        setAiDecisionDebugStatus("live");
        setAiDecisionDebugError("");
      } catch (error) {
        if (closed) return;
        setAiDecisionDebugStatus("error");
        setAiDecisionDebugError(error instanceof Error ? error.message : "KI-Trace konnte nicht geladen werden.");
      }
    };
    void loadLatestTrace();
    const timer = window.setInterval(() => void loadLatestTrace(), 1500);
    return () => {
      closed = true;
      window.clearInterval(timer);
    };
  }, [aiDecisionDebugOverlayEnabled, aiDecisionDebugMatchId, aiDecisionDebugStatus]);

  useEffect(() => {
    if (!aiDecisionDebugOverlayEnabled || !session || !payload || !aiTurnPresentation?.canAdvanceAi || payload.winner) {
      setAiDecisionDebugPreview(null);
      setAiDecisionDebugPreviewError("");
      return;
    }
    let closed = false;
    const loadPreview = async () => {
      try {
        const preview = await fetchAiDecisionPreview(session, payload);
        if (closed) return;
        setAiDecisionDebugPreview(preview);
        setAiDecisionDebugPreviewError("");
      } catch (error) {
        if (closed) return;
        setAiDecisionDebugPreview(null);
        setAiDecisionDebugPreviewError(error instanceof Error ? error.message : "KI-Preview konnte nicht geladen werden.");
      }
    };
    void loadPreview();
    return () => {
      closed = true;
    };
  }, [
    aiDecisionDebugOverlayEnabled,
    session?.matchId,
    session?.side,
    session?.sessionToken,
    payload?.matchId,
    payload?.matchVersion,
    payload?.playerView.stateVersion,
    payload?.winner,
    aiTurnPresentation?.activeAiSide,
    aiTurnPresentation?.canAdvanceAi
  ]);

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
    if (!activeFieldCardChoice) {
      setFieldCardChoiceSelection(null);
      return;
    }
    setFieldCardChoiceSelection((current) => {
      if (!current || current.choiceId !== activeFieldCardChoice.choiceId) return { choiceId: activeFieldCardChoice.choiceId, selectedOptionIds: [] };
      const nextSelected = current.selectedOptionIds.filter((optionId) => activeFieldCardChoiceOptionIds.has(optionId));
      return nextSelected.length === current.selectedOptionIds.length ? current : { choiceId: activeFieldCardChoice.choiceId, selectedOptionIds: nextSelected };
    });
  }, [activeFieldCardChoice?.choiceId, activeFieldCardChoiceOptionIds]);

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
    if (entryTab !== "decks" || !selectedLocalDeck) return;
    const catalogCardById = new Map(allCatalogCards.map((card) => [card.catalogCardId, card]));
    const missingIds = selectedLocalDeck.cards
      .map((entry) => entry.cardId)
      .filter((cardId) => {
        if (catalogDetailsById[cardId]) return false;
        const catalogCard = catalogCardById.get(cardId);
        return !catalogCard || catalogCard.type === "agenda";
      });
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
  }, [entryTab, selectedLocalDeck, allCatalogCards, catalogDetailsById]);

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
    setDamageImpactQueue([]);
    setCurrentDamageImpact(null);
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
    const contextByEventId = chronicleContextByEventId(payload.playerView.publicEvents, catalogDetailsById, { preferGermanCardImages });
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
    const damageImpacts = deriveDamageImpactCues({
      viewerSide: payload.side,
      playerView: payload.playerView,
      events: payload.eventTail,
      lastPresentedEventId: lastSeen
    });
    lastSeenCueEventIdRef.current = latestId;
    if (cues.length > 0) setActionCueQueue((current) => [...current, ...cues]);
    if (damageImpacts.length > 0) setDamageImpactQueue((current) => [...current, ...damageImpacts]);
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
  }, [actionCuesEnabled, automaticEffectCuesEnabled, audioEnabled, audioVolume, payload?.eventTail, payload?.playerView.stateVersion, payload?.side, catalogDetailsById, preferGermanCardImages]);

  useEffect(() => {
    if (currentActionCue || actionCueQueue.length === 0) return;
    const [nextCue, ...rest] = actionCueQueue;
    if (!nextCue) return;
    setCurrentActionCue(nextCue);
    setActionCueQueue(rest);
  }, [actionCueQueue, currentActionCue]);

  useEffect(() => {
    if (currentDamageImpact || damageImpactQueue.length === 0) return;
    const [nextCue, ...rest] = damageImpactQueue;
    if (!nextCue) return;
    setCurrentDamageImpact(nextCue);
    setDamageImpactQueue(rest);
  }, [damageImpactQueue, currentDamageImpact]);

  useEffect(() => {
    if (!currentActionCue) return;
    if (audioEnabled && currentActionCue.sound) playActionCueSound(currentActionCue.sound, audioVolume, currentActionCue.soundCount);
    if (localAiPacingMode === "manual" && currentActionCue.source === "ai" && aiTurnPresentation?.canAdvanceAi) return;
    if (actionCueAutoDismissMs === 0) return;
    const timeout = window.setTimeout(() => setCurrentActionCue(null), actionCueAutoDismissMs);
    return () => window.clearTimeout(timeout);
  }, [actionCueAutoDismissMs, aiTurnPresentation?.canAdvanceAi, audioEnabled, audioVolume, currentActionCue, localAiPacingMode]);

  useEffect(() => {
    if (!payload || !aiTurnPresentation?.canAdvanceAi || payload.winner || connection !== "online" || priorityWindowHoldEnabled) return;
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
  }, [actionCueAutoDismissMs, actionCueQueue.length, aiTurnPresentation?.canAdvanceAi, connection, currentActionCue, localAiPacingMode, payload?.matchId, payload?.matchVersion, payload?.playerView.stateVersion, payload?.winner, priorityWindowHoldEnabled]);

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
        ...(hasAiOpponent && aiTraceStartMode !== "off" ? { aiTraceMode: aiTraceStartMode } : {}),
        ...(isHumanVsHuman ? { countdownSeconds } : {}),
        ...(isHumanVsHuman ? { discoverableInLan } : {}),
        settings: {
          matchFormat,
          cardPool: matchCardPool,
          agendaPointsToWin: effectiveAgendaTarget,
          playerClock:
            playerClockMode === "player_clock"
              ? {
                  mode: "player_clock",
                  startingTimeMs: playerClockMinutes * 60_000,
                  gracePeriodMs: playerClockGraceSeconds * 1000
                }
              : { mode: "none" }
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
    const aiTraceNotice = hasAiOpponent && aiTraceStartMode !== "off" ? " KI-Trace läuft ab Start." : "";
    if (created.lobby || created.pendingDeckHandshake || !created.playerView) {
      setPayload(null);
      setLobby(lobbyFromInitialResponse(created, created.hostSide));
      const sideNotice = created.lobby?.sideAssignmentMode === "random_pending" ? "Seite wird beim Start ausgelost" : `Du startest als ${sideLabel(created.hostSide)}`;
      setNotice(`Lobby erstellt. ${sideNotice}.${aiTraceNotice}`);
      return;
    }
    setPayload(fromInitialResponse(created, created.hostSide));
    setLobby(null);
    setNotice(`Match erstellt. Du startest als ${sideLabel(created.hostSide)}.${aiTraceNotice}`);
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
        settings: { cardPool: matchCardPool },
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

  const refreshRecentGameResults = async () => {
    setRecentGameResultsLoading(true);
    setRecentGameResultsError("");
    try {
      const response = await fetchRecentGameResults();
      if (response.error) {
        setRecentGameResults([]);
        setRecentGameResultsError(response.error.message);
        setRecentGameResultsUpdatedAt(new Date().toISOString());
        return;
      }
      setRecentGameResults(response.results ?? []);
      setRecentGameResultsUpdatedAt(new Date().toISOString());
    } catch (error) {
      setRecentGameResults([]);
      setRecentGameResultsError(serverErrorNotice(error, "Letzte Spiele konnten nicht geladen werden."));
      setRecentGameResultsUpdatedAt(new Date().toISOString());
    } finally {
      setRecentGameResultsLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== "join" || session || recoveryTabSelected) return;
    void refreshOpenLanMatches();
    const timer = window.setInterval(() => {
      void refreshOpenLanMatches(true);
    }, 7000);
    return () => {
      window.clearInterval(timer);
    };
  }, [mode, recoveryTabSelected, session?.matchId]);

  useEffect(() => {
    if (entryTab !== "recent" || session) return;
    void refreshRecentGameResults();
  }, [entryTab, session?.matchId]);

  useEffect(() => {
    if (activeMatchWorkspace !== "recent" || !session) return;
    void refreshRecentGameResults();
  }, [activeMatchWorkspace, session?.matchId]);

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
      setSession(baseSession.sessionToken.trim() && baseSession.webSocketUrl.trim() ? baseSession : null);
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
      selectStartTab("join");
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
    selectStartTab("join");
    setJoinMatchId(recentSession.matchId);
    setJoinToken("");
    setNotice("Beitreten ist vorbereitet. Die Match-ID ist eingetragen; bitte den aktuellen Join- oder Wiederverbindungs-Token aus dem Link ergänzen.");
  };

  const discardRecentSession = () => {
    if (!recentSession) return;
    const discardedSession = recentSession;
    removeRecentSession(discardedSession);
    clearStoredSession(discardedSession);
    const nextRecentSession = loadRecentSession();
    setRecentSession(nextRecentSession);
    if (nextRecentSession) {
      setRecoveryTabSelected(true);
      setNotice("Gespeichertes Spiel verworfen. Ein weiteres gespeichertes Spiel ist verfügbar.");
    } else {
      selectStartTab("host");
      setNotice("Gespeichertes Spiel verworfen. Es gibt kein Spiel zum Fortsetzen.");
    }
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
    if (!autoCorpMandatoryDrawEnabled || !gameplaySettingsLoaded || !session || !payload || connection !== "online") return;
    const action = automaticCorpMandatoryDrawAction(payload.playerView, payload.legalActions, session.side);
    if (!action) return;
    const key = `${session.matchId}:${session.side}:${payload.playerView.stateVersion}:${action.actionId}`;
    if (autoCorpMandatoryDrawSubmittedKeyRef.current === key) return;
    if (submitAction(action, { immediateAudio: false })) autoCorpMandatoryDrawSubmittedKeyRef.current = key;
  }, [autoCorpMandatoryDrawEnabled, gameplaySettingsLoaded, session, payload, connection, submitAction]);

  useEffect(() => {
    if (!autoEndTurnEnabled || !gameplaySettingsLoaded || !session || !payload || connection !== "online") return;
    const action = automaticEndTurnAction(payload.playerView, payload.legalActions, session.side, { accessRevealVisible: showAccessReveal });
    if (!action) return;
    const key = `${session.matchId}:${session.side}:${payload.playerView.stateVersion}:${action.actionId}`;
    if (autoEndTurnSubmittedKeyRef.current === key) return;
    if (submitAction(action, { immediateAudio: false })) autoEndTurnSubmittedKeyRef.current = key;
  }, [autoEndTurnEnabled, gameplaySettingsLoaded, session, payload, connection, submitAction, showAccessReveal]);

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
      message: "Diese Aufgabe beendet nur dieses Spiel. In einer Matchserie kann ein offenes Folgespiel danach weiter gestartet werden. Der Engine-State bleibt der letzte echte Spielzustand.",
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
      setAiDecisionDebugPreview(null);
      setAiDecisionDebugPreviewError("");
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
    setUndoNotice("");
    socketRef.current?.send(JSON.stringify({ type: "request_undo", payload: { targetEventId: latestEventId } }));
  };

  const resolveUndo = (accepted: boolean) => {
    if (!payload?.pendingUndo || !ensureSocketConnected()) return;
    setUndoNotice("");
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
    const useProteusProfile = matchCardPool === "originalset_proteus";
    const deck: EditableDeck = {
      deckId: `local_${side}_${runtimeRandomId().slice(0, 8)}`,
      deckVersion: "0.6.0-local",
      name: side === "runner" ? "Neues Runner-Deck" : "Neues Korp-Deck",
      side,
      identityCardId: templateIdentity ?? DEFAULT_IDENTITY_BY_SIDE[side],
      cardPoolSnapshotId: DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID,
      cardPoolVersion: useProteusProfile ? PROTEUS_DECK_CARD_POOL_VERSION : DEFAULT_DECK_CARD_POOL_VERSION,
      formatProfileId: useProteusProfile ? PROTEUS_DECK_FORMAT_PROFILE_ID : DEFAULT_DECK_FORMAT_PROFILE_ID,
      formatProfileVersion: useProteusProfile ? PROTEUS_DECK_FORMAT_PROFILE_VERSION : DEFAULT_DECK_FORMAT_PROFILE_VERSION,
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
      body: JSON.stringify({ deck, matchCardPool })
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
    const socketUrl = normalizeWebSocketUrl(nextSession.webSocketUrl);
    if (!socketUrl) {
      setConnection("offline");
      setNotice("WebSocket-Verbindung konnte nicht gestartet werden.");
      return;
    }
    let socket: WebSocket;
    try {
      socket = new WebSocket(socketUrl);
    } catch {
      setConnection("offline");
      setNotice("WebSocket-Verbindung konnte nicht gestartet werden.");
      return;
    }
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
                  ...(message.payload.playerClock ? { playerClock: message.payload.playerClock } : {}),
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
          playerView: message.payload.playerView,
          ...(message.payload.playerClock ? { playerClock: message.payload.playerClock } : {})
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
      if (message.payload.code.startsWith("undo_")) {
        setUndoNotice(message.payload.message);
        setUndoPanelOpen(true);
      }
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
  const startLobbyBlocksSetup = Boolean(session && lobby && matchStartLobbyBlocksSetup(lobby.matchStatus));
  const showingSessionRecovery = Boolean(session && !payload && !lobby);
  const hasRecoveryStartTab = Boolean(showingSessionRecovery || recentSession);
  const activeStartTab = recoveryTabSelected && hasRecoveryStartTab ? "resume" : mode;
  const canResumeRecentSession = Boolean(recentSession && storedSessionMatches(recentSession));
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
      <CardImagePreferenceContext.Provider value={{ preferGermanCardImages, showSetBadges }}>
      <CardTooltipSettingsContext.Provider value={{ hoverOpenDelayMs: cardTooltipHoverDelayMs, mode: cardTooltipMode }}>
      <main className="app" data-theme={colorScheme}>
        <header className="topbar">
          <div className="topbarStatusGroup">
            <AppBrand appName={APP_NAME} iconSrc={APP_ICON_SRC} wordmarkSrc={APP_WORDMARK_SRC} />
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
            <button className={`entryTab ${entryTab === "recent" ? "active" : ""}`} onClick={() => setEntryTab("recent")} type="button" aria-current={entryTab === "recent" ? "page" : undefined}>
              <Award size={16} />
              Letzte Spiele
            </button>
            <button className={`entryTab ${entryTab === "options" ? "active" : ""}`} onClick={() => setEntryTab("options")} type="button" aria-current={entryTab === "options" ? "page" : undefined}>
              <SlidersHorizontal size={16} />
              Optionen
            </button>
          </nav>
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
          {notice ? <p className="notice entryNotice">{notice}</p> : null}
          {entryTab === "play" && !startLobbyBlocksSetup ? (
          <section className="setupPanel">
            <div className={`tabs ${hasRecoveryStartTab ? "threeTabs" : ""}`}>
              <button className={`tab ${activeStartTab === "host" ? "active" : ""}`} onClick={() => selectStartTab("host")}>
                Match erstellen
              </button>
              <button className={`tab ${activeStartTab === "join" ? "active" : ""}`} onClick={() => selectStartTab("join")}>
                Beitreten
              </button>
              {hasRecoveryStartTab ? (
                <button className={`tab ${activeStartTab === "resume" ? "active" : ""}`} onClick={() => selectStartTab("resume")}>
                  {showingSessionRecovery ? "Wieder verbinden" : "Fortsetzen"}
                </button>
              ) : null}
            </div>

            {activeStartTab === "resume" && showingSessionRecovery && session ? (
              <section className="resumeSessionInline" aria-label="Sitzung wiederherstellen">
                <div className="resumeSessionSummary">
                  <p className="eyebrow">Aktive lokale Sitzung</p>
                  <h2>Match {session.matchId}</h2>
                  <p className="meta">
                    {sideLabel(session.side)} · {session.displayName}
                    {connection !== "online" ? " · nicht verbunden" : ""}
                  </p>
                </div>
                <div className="resumeSessionActions">
                  <span className="resumeActionTooltip" data-tooltip={canReconnect ? "Aktive lokale Sitzung wieder verbinden" : "Für diese Sitzung liegt kein Wiederverbindungs-Token vor."}>
                    <button className="button primary" onClick={reconnect} type="button" disabled={!canReconnect}>
                      <Cable size={15} />
                      Wieder verbinden
                    </button>
                  </span>
                  <span className="resumeActionTooltip" data-tooltip={canReconnect ? "Wiederverbindungslink kopieren" : "Für diese Sitzung liegt kein Wiederverbindungs-Token vor."}>
                    <button className="button" onClick={copyReconnectLink} type="button" disabled={!canReconnect}>
                      <Link2 size={15} />
                      Link kopieren
                    </button>
                  </span>
                  <span className="resumeActionTooltip" data-tooltip="Löst nur die lokale Browser-Sitzung. Das serverseitige Match bleibt unverändert.">
                    <button className="button" onClick={leaveMatch} type="button">
                      <Trash2 size={15} />
                      Lokale Sitzung lösen
                    </button>
                  </span>
                </div>
              </section>
            ) : activeStartTab === "resume" && recentSession ? (
              <section className="resumeSessionInline" aria-label="Gespeichertes Spiel fortsetzen">
                <div className="resumeSessionSummary">
                  <p className="eyebrow">Gespeichertes Spiel</p>
                  <h2>{recentSessionHeadline(recentSession)}</h2>
                  <p className="meta">
                    {recentSession.displayName} · {recentSessionStatusLabel(recentSession.matchStatus)}
                    {canResumeRecentSession ? " · Fortsetzen verfügbar" : " · Token neu eintragen"}
                  </p>
                  <details className="matchIdDetails">
                    <summary>Match-ID anzeigen</summary>
                    <code>{recentSession.matchId}</code>
                  </details>
                </div>
                <div className="resumeSessionActions">
                  <span className="resumeActionTooltip" data-tooltip={canResumeRecentSession ? "Gespeicherte Sitzung fortsetzen" : "Für dieses Spiel liegt kein verwertbares Session-Token mehr vor."}>
                    <button className="button primary" onClick={resumeRecentSession} type="button" disabled={!canResumeRecentSession}>
                      <Cable size={15} />
                      Fortsetzen
                    </button>
                  </span>
                  <span className="resumeActionTooltip" data-tooltip="Öffnet Beitreten mit dieser Match-ID. Den Token musst du aus dem Link ergänzen.">
                    <button className="button" onClick={reconnectFromRecentSession} type="button">
                      <Link2 size={15} />
                      Über Token verbinden
                    </button>
                  </span>
                  <span className="resumeActionTooltip" data-tooltip="Entfernt nur dieses gespeicherte Spiel aus diesem Browser. Das serverseitige Match bleibt unverändert.">
                    <button className="button" onClick={discardRecentSession} type="button">
                      <Trash2 size={15} />
                      Verwerfen
                    </button>
                  </span>
                </div>
              </section>
            ) : activeStartTab === "host" ? (
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
                <section className="matchStartSection" aria-label="Kartenpool">
                  <p className="eyebrow">Kartenpool</p>
                  <div className="choiceCardGrid formatCards">
                    {(["originalset", "originalset_proteus"] as MatchCardPoolSelection[]).map((option) => {
                      const label = matchCardPoolCardLabel(option);
                      return (
                        <button
                          key={option}
                          className={`choiceCard ${matchCardPool === option ? "active" : ""}`}
                          onClick={() => setMatchCardPool(option)}
                          type="button"
                          aria-pressed={matchCardPool === option}
                          data-testid={option === "originalset" ? "match-card-pool-originalset" : "match-card-pool-originalset-proteus"}
                        >
                          <Layers3 size={18} />
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
                {gameMode !== "ai_vs_ai" || aiDeckPolicyUsesPrimaryDeckSlots ? (
                  <div className="deckSlotGrid">
                    <DeckSlotSelect
                      label={gameMode === "ai_vs_ai" ? "Runner-KI · Runner-Deck" : "Teilnehmer A · Runner-Deck"}
                      snapshots={runnerSnapshots}
                      localDecks={matchStartLocalDecks.filter((deck) => deck.side === "runner")}
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
                      localDecks={matchStartLocalDecks.filter((deck) => deck.side === "corp")}
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
                      Spielerzeit
                      <select value={playerClockMode} onChange={(event) => setPlayerClockMode(event.target.value as MatchStartPlayerClockMode)}>
                        <option value="none">Keine Zeitbegrenzung</option>
                        <option value="player_clock">Zeitbegrenzung aktiv</option>
                      </select>
                    </label>
                    <label>
                      Zeit pro Seite
                      <select value={playerClockMinutes} onChange={(event) => setPlayerClockMinutes(Number(event.target.value) as MatchStartPlayerClockMinutes)} disabled={playerClockDetailControlsDisabled}>
                        <option value={5}>5 Minuten</option>
                        <option value={10}>10 Minuten</option>
                        <option value={15}>15 Minuten</option>
                        <option value={20}>20 Minuten</option>
                        <option value={30}>30 Minuten</option>
                        <option value={45}>45 Minuten</option>
                      </select>
                    </label>
                    <label>
                      Kulanz je Entscheidung
                      <select value={playerClockGraceSeconds} onChange={(event) => setPlayerClockGraceSeconds(Number(event.target.value) as MatchStartPlayerClockGraceSeconds)} disabled={playerClockDetailControlsDisabled}>
                        <option value={0}>0 Sekunden</option>
                        <option value={5}>5 Sekunden</option>
                        <option value={10}>10 Sekunden</option>
                        <option value={15}>15 Sekunden</option>
                        <option value={30}>30 Sekunden</option>
                      </select>
                    </label>
                    <label>
                      Seed
                      <input value={seed} onChange={(event) => setSeed(event.target.value)} />
                    </label>
                    {hasAiOpponent ? (
                      <label>
                        Diagnose
                        <select value={aiTraceStartMode} onChange={(event) => setAiTraceStartMode(event.target.value as AiTraceStartMode)}>
                          <option value="off">Keine KI-Aufzeichnung</option>
                          <option value="detailed">KI-Trace ab Start</option>
                        </select>
                      </label>
                    ) : null}
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
                          <option value="same_as_participant_a">Gleiche Decks wie Teilnehmer A</option>
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
                        localDecks={matchStartLocalDecks.filter((deck) => deck.side === "runner")}
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
                        localDecks={matchStartLocalDecks.filter((deck) => deck.side === "corp")}
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
                    localDecks={matchStartLocalDecks.filter((deck) => deck.side === "runner")}
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
                    localDecks={matchStartLocalDecks.filter((deck) => deck.side === "corp")}
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
            summary={filteredCatalogSummary}
            setFilter={catalogSetFilter}
            setOptions={catalogSetOptions}
            selectedId={selectedCatalogId}
            filtersOpen={catalogFiltersOpen}
            showExpertStatuses={catalogExpertStatuses}
            blockStatusCounts={catalogBlockStatusCounts}
            blockStatusFilter={catalogBlockStatusFilter}
            aiHintCounts={catalogAiHintCounts}
            aiHintFilter={catalogAiHintFilter}
            rarityCounts={catalogRarityCounts}
            rarityFilter={catalogRarityFilter}
            typeCounts={catalogTypeCounts}
            typeFilters={catalogTypeFilters}
            onSearch={setCatalogSearch}
            onSide={setCatalogSide}
            onStatus={setCatalogStatus}
            onSetFilter={setCatalogSetFilter}
            onSelect={setSelectedCatalogId}
            onFiltersOpen={setCatalogFiltersOpen}
            onToggleExpertStatuses={setCatalogExpertStatuses}
            onBlockStatusFilter={setCatalogBlockStatusFilter}
            onAiHintFilter={setCatalogAiHintFilter}
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
          {entryTab === "recent" ? (
            <RecentGamesPanel
              results={recentGameResults}
              loading={recentGameResultsLoading}
              error={recentGameResultsError}
              updatedAt={recentGameResultsUpdatedAt}
              onRefresh={refreshRecentGameResults}
            />
          ) : null}
          {entryTab === "options" ? (
            <OptionsPanel
              actionCueAutoDismissMs={actionCueAutoDismissMs}
              actionCuesEnabled={actionCuesEnabled}
              automaticEffectCuesEnabled={automaticEffectCuesEnabled}
              autoCorpMandatoryDrawEnabled={autoCorpMandatoryDrawEnabled}
              autoDiscardEnabled={autoDiscardEnabled}
              autoEndTurnEnabled={autoEndTurnEnabled}
              topbarStickyEnabled={topbarStickyEnabled}
              resourceStripMode={resourceStripMode}
              actionPanelMode={actionPanelMode}
              aiDecisionDebugOverlayEnabled={aiDecisionDebugOverlayEnabled}
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
              preferGermanCardImages={preferGermanCardImages}
              showSetBadges={showSetBadges}
              chronicleDetailMode={chronicleDetailMode}
              colorScheme={colorScheme}
              cuePosition={cuePosition}
              aiPacingMode={localAiPacingMode}
              onActionCueAutoDismissMs={setActionCueAutoDismissMs}
              onActionCuesEnabled={setActionCuesEnabled}
              onAutomaticEffectCuesEnabled={setAutomaticEffectCuesEnabled}
              onAutoCorpMandatoryDrawEnabled={setAutoCorpMandatoryDrawEnabled}
              onAutoDiscardEnabled={setAutoDiscardEnabled}
              onAutoEndTurnEnabled={setAutoEndTurnEnabled}
              onTopbarStickyEnabled={setTopbarStickyEnabled}
              onResourceStripMode={setResourceStripMode}
              onActionPanelMode={setActionPanelMode}
              onAiDecisionDebugOverlayEnabled={setAiDecisionDebugOverlayEnabled}
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
              onPreferGermanCardImages={setPreferGermanCardImages}
              onShowSetBadges={setShowSetBadges}
              onChronicleDetailMode={setChronicleDetailMode}
              onColorScheme={setColorScheme}
              onCuePosition={setCuePosition}
              onAiPacingMode={updateLocalAiPacingMode}
            />
          ) : null}
          </div>
        </div>
      </main>
      </CardTooltipSettingsContext.Provider>
      </CardImagePreferenceContext.Provider>
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
    <CardImagePreferenceContext.Provider value={{ preferGermanCardImages, showSetBadges }}>
    <CardTooltipSettingsContext.Provider value={{ hoverOpenDelayMs: cardTooltipHoverDelayMs, mode: cardTooltipMode }}>
    <main className={activeMatchClassName} data-theme={colorScheme}>
      <header className="topbar" ref={topbarRef}>
        <div className="topbarStatusGroup">
          <AppBrand appName={APP_NAME} iconSrc={APP_ICON_SRC} wordmarkSrc={APP_WORDMARK_SRC} />
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
          {canStartNextSeriesGame ? (
            <button className="button primary" onClick={startNextSeriesGame} disabled={seriesTransitioning} title="Nächstes Serienspiel mit Seitenwechsel erstellen" type="button">
              <Play size={16} />
              {seriesTransitioning ? "Erstelle..." : "Matchserie fortsetzen"}
            </button>
          ) : null}
          {canReturnToStart ? (
            <button className={canStartNextSeriesGame ? "button" : "button primary"} onClick={leaveMatch} title="Zurück zum Startbildschirm" type="button">
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
        undoNotice={undoNotice}
        latestEventId={latestEventId}
        connection={connection}
        onRequest={requestUndo}
        onResolve={resolveUndo}
      />
      {activeMatchIsGame ? (
      <DamageImpactOverlay
        cue={currentDamageImpact}
        queued={damageImpactQueue.length}
        onDismiss={() => setCurrentDamageImpact(null)}
      />
      ) : null}
      {activeMatchIsGame ? (
      <OpponentActionOverlay
        cue={currentActionCue}
        queued={actionCueQueue.length}
        position={cuePosition}
        cardDetailsById={catalogDetailsById}
        displayMode={cardDisplayMode}
        canAdvanceAi={Boolean(aiTurnPresentation?.canAdvanceAi && connection === "online")}
        renderTitle={(cue) => {
          const titleCard = cue.cardDefinitionId ? (catalogDetailsById[cue.cardDefinitionId] ?? null) : null;
          return (
            <OpponentCueTitle
              cue={cue}
              card={titleCard}
              previewCard={titleCard ? visibleCardFromCatalogDetail(titleCard) : null}
              displayMode={cardDisplayMode}
              onFocusCard={focusCard}
            />
          );
        }}
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
          onChoiceOption={submitChoiceOption}
        />
      ) : null}
      {showFloatingActionPanel && activeView ? (
        <FloatingActionPanelOverlay
          position={actionPanelOverlayPosition}
          onPosition={setActionPanelOverlayPosition}
          onDock={() => setActionPanelMode("docked")}
        >
          <LegalActionsPanel
            view={activeView}
            primaryActions={floatingPanelPrimaryActions}
            contextualActions={floatingPanelContextualActions}
            selectedContext={selectedPanelContext}
            hasHiddenContextActions={floatingPanelHasHiddenContextActions}
            cardContextActive={selectedActionContext?.kind === "card"}
            hiddenContextHint={hiddenContextHint}
            actionCapacities={actionSlotCapacities}
            priorityWindowHoldEnabled={priorityWindowHoldEnabled}
            {...(aiTurnPresentation?.activeAiSide ? { activeAiSide: aiTurnPresentation.activeAiSide } : {})}
            disabled={Boolean(payload.winner) || connection !== "online"}
            highlighted={hasDecisionCue}
            selectedDiscardOptionIds={selectedDiscardOptionIds}
            selectedFieldCardChoiceOptionIds={selectedFieldCardChoiceOptionIds}
            onAction={submitAction}
            onChoiceOption={submitChoiceOption}
            onChoiceOptions={submitChoiceOptions}
            onDiscardChoiceToggle={toggleDiscardOption}
            onFieldCardChoiceClear={clearFieldCardChoiceSelection}
            onPriorityWindowHoldEnabled={setPriorityWindowHoldEnabled}
            enrichCard={enrichCard}
            connection={connection}
            onClearContext={() => setSelectedActionContext(null)}
          />
        </FloatingActionPanelOverlay>
      ) : null}
      {showAiDecisionDebugOverlay ? (
        <FloatingAiDecisionDebugOverlay
          position={aiDecisionDebugOverlayPosition}
          status={aiDecisionDebugStatus}
          error={aiDecisionDebugError}
          preview={aiDecisionDebugPreview}
          previewError={aiDecisionDebugPreviewError}
          trace={aiDecisionDebugTrace}
          traceCount={aiDecisionDebugTraceIndex.length}
          onPosition={setAiDecisionDebugOverlayPosition}
          onClose={() => setAiDecisionDebugOverlayEnabled(false)}
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

      {activeMatchIsGame && activeView ? (
      <ActiveMatchResourceStrip
        view={activeView}
        agendaPointsToWin={effectiveAgendaTarget}
        actionCapacities={actionSlotCapacities}
        ariaHidden={!resourceStripVisible}
        topOffsetPx={topbarStickyEnabled ? topbarHeightPx : 0}
      />
      ) : null}

      {activeMatchIsGame ? (
      <div className={`main${rightRailCollapsed ? " rightRailCollapsed" : ""}`} data-testid="active-game">
        <aside className="column panel sidePanel" ref={statusPanelsRef}>
          <OpponentPanel
            view={activeView}
            scoreAreaCards={scoreAreaCardsBySide(opponentSide(activeView.side))}
            scoreAreaOpen={scoreAreaOverlays[opponentSide(activeView.side)]}
            agendaPointsToWin={effectiveAgendaTarget}
            scoreAreaHighlighted={zoneHighlighted(activeCueHighlight, opponentSide(activeView.side), "scoreArea")}
            onToggleScoreArea={() => toggleScoreAreaOverlay(opponentSide(activeView.side))}
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
          {actionPanelMode === "floating" ? (
            <ActionPanelDockPlaceholder
              runActive={Boolean(activeView.run)}
              floatingVisible={showFloatingActionPanel}
              onDock={() => setActionPanelMode("docked")}
            />
          ) : (
            <LegalActionsPanel
              view={activeView}
              primaryActions={legalActionSplit.primaryActions}
              contextualActions={selectedPanelContextActions}
              selectedContext={selectedPanelContext}
              hasHiddenContextActions={legalActionSplit.contextualActions.length > 0 && selectedActionContext?.kind !== "card"}
              cardContextActive={selectedActionContext?.kind === "card"}
              hiddenContextHint={hiddenContextHint}
              actionCapacities={actionSlotCapacities}
              priorityWindowHoldEnabled={priorityWindowHoldEnabled}
              {...(aiTurnPresentation?.activeAiSide ? { activeAiSide: aiTurnPresentation.activeAiSide } : {})}
              disabled={Boolean(payload.winner) || connection !== "online"}
              highlighted={hasDecisionCue}
              selectedDiscardOptionIds={selectedDiscardOptionIds}
              selectedFieldCardChoiceOptionIds={selectedFieldCardChoiceOptionIds}
              onAction={submitAction}
              onChoiceOption={submitChoiceOption}
              onChoiceOptions={submitChoiceOptions}
              onDiscardChoiceToggle={toggleDiscardOption}
              onFieldCardChoiceClear={clearFieldCardChoiceSelection}
              onPriorityWindowHoldEnabled={setPriorityWindowHoldEnabled}
              onFloatPanel={() => setActionPanelMode("floating")}
              enrichCard={enrichCard}
              connection={connection}
              onClearContext={() => setSelectedActionContext(null)}
            />
          )}
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
          {matchClockDisplay || payload.playerClock ? (
            <div className="clockCluster" aria-label="Uhrenbereich">
              {matchClockDisplay ? (
                <div className="matchClockStrip" aria-label="Uhr für dieses Match" data-testid="match-clock">
                  <span className="matchClockIcon" aria-hidden="true">
                    <Clock size={15} />
                  </span>
                  <span>
                    <strong>Match</strong> {matchClockDisplay.matchElapsed}
                  </span>
                  <span>
                    <strong>{matchClockDisplay.scopeLabel}</strong> {matchClockDisplay.decisionElapsed}
                  </span>
                  {matchClockDisplay.graceLabel ? <small>{matchClockDisplay.graceLabel}</small> : null}
                </div>
              ) : null}
              {payload.playerClock ? <PlayerClockStrip snapshot={payload.playerClock} nowMs={matchClockNowMs} /> : null}
            </div>
          ) : null}
          {activeView.side === "corp" ? (
            <section className="opponentRunnerBoardStrip" aria-label="Runner-Bereich">
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
              <RunnerRigStrip
                view={activeView}
                cardDetailsById={catalogDetailsById}
                displayMode={cardDisplayMode}
                selectedContext={selectedActionContext}
                contextualActions={legalActionSplit.contextualActions}
                actionDisabled={Boolean(payload.winner) || connection !== "online"}
                highlightedZone={activeCueHighlight}
                fieldChoiceCardProps={fieldChoiceCardProps}
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
              fieldChoiceCardProps={fieldChoiceCardProps}
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
                    const isOpponentCorpHq = activeView.side === "runner" && server.id === "hq";
                    const isCorpHqComposite = isOwnCorpHq || isOpponentCorpHq;
                    const opponentCorpHqCount = isOpponentCorpHq ? Math.max(0, Math.floor(activeView.opponent.handCount)) : 0;
                    const opponentCorpHqPreviewCount = Math.min(opponentCorpHqCount, CORP_OPPONENT_HQ_PREVIEW_LIMIT);
                    const opponentCorpHqPreviewCards = Array.from({ length: opponentCorpHqPreviewCount }, (_, index): DisplayVisibleCard => ({
                      instanceId: `corp-opponent-hq-hidden-${index}`,
                      known: false,
                      rezzed: false,
                      owner: "corp"
                    }));
                    const serverCollapsed = boardZoneCollapsedFor(`corp:${server.id}`);
                    const laneClassName = (lane: { kind: "ice" | "root"; cards: VisibleCard[] }) =>
                      `lane ${lane.kind === "ice" ? "iceLane" : "rootLane"}${lane.kind === "ice" && lane.cards.length >= 7 ? " scrollableIceLane" : ""}`;
                    const renderLaneCards = (lane: { kind: "ice" | "root"; label: "ICE" | "Root"; cards: VisibleCard[] }) => {
                      if (server.id === "archives" && lane.kind === "root") {
                        return (
                          <ArchivesDualStackLane
                            viewerSide={activeView.side}
                            visibleCards={lane.cards}
                            totalArchivesCount={activeView.side === "runner" ? (activeView.opponent.discardCount ?? lane.cards.length) : lane.cards.length}
                            emptyLabel={lane.label}
                            collapsed={false}
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
                            {lane.label}
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
                            {...(lane.kind === "ice" ? { modifierBadges: iceModifierBadgesForServer(server) } : {})}
                            scoreStateBadges={scoreCardStateBadges(displayCard, scoreAreaCardsBySide("corp"))}
                            runPositionActive={lane.kind === "ice" && activeRunIceId === card.instanceId}
                            {...(lane.kind === "ice" && activeRunIceId === card.instanceId
                              ? { runPositionLabel: runPositionStatusLabel(activeView) ?? "Aktuelles ICE" }
                              : {})}
                            viewMarkerActive={
                              (lane.kind === "ice" && viewedApproachIceId === card.instanceId) ||
                              viewedInstalledExposeCardId === card.instanceId
                            }
                            {...fieldChoiceCardProps(card)}
                            onAction={submitAction}
                            onFocus={focusCard}
                            onActionContextSelect={selectActionCard}
                          />
                        );
                      });
                    };
                    return (
                      <article
                        className={`server ${isCorpHqComposite ? "corpHqServer" : ""} ${serverCollapsed ? "serverCollapsed" : ""} ${serverHighlighted(activeCueHighlight, server.id) ? "cueHighlight" : ""} ${activeRunTargetIds.includes(server.id) ? "activeRunTarget" : ""} ${selectedActionContext?.kind === "server" && selectedActionContext.id === server.id ? "selectedActionSource" : ""}`}
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
                            </div>
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
                            <div className="serverLeadBottom">
                              <ZoneIdentityIcon side="corp" kind={serverZoneIdentityIconKind(server.id)} label={serverDisplayLabel(server.id)} />
                              <ZoneCollapseButton
                                side="corp"
                                label={serverDisplayLabel(server.id)}
                                collapsed={serverCollapsed}
                                onToggle={() => toggleBoardZoneCollapsed(`corp:${server.id}`)}
                              />
                            </div>
                          </div>
                          {!serverCollapsed ? <div className="serverBody">
                            <ServerCounterStrip displays={server.counterDisplays} serverLabel={serverDisplayLabel(server.id)} />
                            <div className={isCorpHqComposite ? "corpHqComposite" : "pairedServerLanes"}>
                              {isOwnCorpHq ? (
                                <>
                                  <div className={`corpHqHandPanel ${zoneHighlighted(activeCueHighlight, activeView.side, "hq") ? "cueHighlightSoft" : ""}`}>
                                    <HandCardsRow className="corpHqHandCards" style={handCardsStyle} count={activeView.own.gripOrHq.length}>
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
                                            scoreStateBadges={scoreCardStateBadges(displayCard, scoreAreaCardsBySide("corp"))}
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
                                    </HandCardsRow>
                                  </div>
                                  <div className="pairedServerLanes corpHqServerLanes">
                                    {lanes.map((lane) => (
                                      <div className="serverLaneGroup pairedServerLane" key={lane.label}>
                                        <div className={laneClassName(lane)} style={boardLaneStyle}>
                                          {renderLaneCards(lane)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : isOpponentCorpHq ? (
                                <>
                                  <div className={`corpHqHandPanel corpOpponentHqHandPanel ${zoneHighlighted(activeCueHighlight, activeView.side, "hq") ? "cueHighlightSoft" : ""}`}>
                                    {opponentCorpHqPreviewCards.length > 0 ? (
                                      <div
                                        className="corpOpponentHqPreview"
                                        style={{
                                          ...zoneCardsStyle,
                                          "--corp-hq-visible-steps": String(Math.max(0, opponentCorpHqPreviewCards.length - 1))
                                        } as CSSProperties}
                                        aria-label={`Korp-HQ: ${formatHandLimitCount(activeView.opponent.handCount, activeView.opponent.maxHandSize)}, verdeckte Karten`}
                                      >
                                        {opponentCorpHqPreviewCards.map((card) => (
                                          <CardView key={card.instanceId} card={card} compact displayMode={cardDisplayMode} hiddenSide="corp" onFocus={focusCard} />
                                        ))}
                                        {opponentCorpHqCount > CORP_OPPONENT_HQ_PREVIEW_LIMIT ? <span className="archivesOverflowBadge">+{opponentCorpHqCount - CORP_OPPONENT_HQ_PREVIEW_LIMIT}</span> : null}
                                      </div>
                                    ) : (
                                      <p className="archivesPileEmpty">Keine Karten in HQ.</p>
                                    )}
                                  </div>
                                  <div className="pairedServerLanes corpHqServerLanes">
                                    {lanes.map((lane) => (
                                      <div className="serverLaneGroup pairedServerLane" key={lane.label}>
                                        <div className={laneClassName(lane)} style={boardLaneStyle}>
                                          {renderLaneCards(lane)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                lanes.map((lane) => (
                                  <div className="serverLaneGroup pairedServerLane" key={lane.label}>
                                    <div className={laneClassName(lane)} style={boardLaneStyle}>
                                      {renderLaneCards(lane)}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div> : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null
            )}
          </div>
          <section className="section panel boardSection zoneBoardSection">
            {activeView.side === "runner" ? (
              <div className="runnerGripHeapLayout">
                <SideZoneFrame
                  side="runner"
                  label="Grip"
                  countLabel={formatHandLimitCount(activeView.own.gripOrHq.length, activeView.own.maxHandSize)}
                  iconKind="grip"
                  highlighted={zoneHighlighted(activeCueHighlight, activeView.side, "grip")}
                  className="runnerGripZone"
                  style={zoneCardsStyle}
                  collapsed={boardZoneCollapsedFor("runner:grip")}
                  onToggleCollapse={() => toggleBoardZoneCollapsed("runner:grip")}
                >
                  <HandCardsRow style={handCardsStyle} count={activeView.own.gripOrHq.length}>
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
                  </HandCardsRow>
                </SideZoneFrame>
                <SideZoneFrame
                  side="runner"
                  label="Stack"
                  countLabel={formatCardCount(activeView.own.stackOrRdCount)}
                  iconKind="stack"
                  highlighted={zoneHighlighted(activeCueHighlight, activeView.side, "stack")}
                  className="runnerStackZone"
                  style={zoneCardsStyle}
                  collapsed={boardZoneCollapsedFor("runner:stack")}
                  onToggleCollapse={() => toggleBoardZoneCollapsed("runner:stack")}
                >
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
                <SideZoneFrame
                  side="runner"
                  label="Heap"
                  countLabel={formatCardCount(activeView.own.heapOrArchives.length)}
                  iconKind="heap"
                  highlighted={zoneHighlighted(activeCueHighlight, activeView.side, "heap")}
                  className="runnerHeapZone"
                  style={zoneCardsStyle}
                  collapsed={boardZoneCollapsedFor("runner:heap")}
                  onToggleCollapse={() => toggleBoardZoneCollapsed("runner:heap")}
                  collapseLabel="Heap"
                >
                  {activeView.own.heapOrArchives.length > 0 ? (
                    <div
                      className="runnerHeapOverlapRow"
                      style={{
                        ...zoneCardsStyle,
                        "--zone-stack-visible-steps": String(Math.max(0, activeView.own.heapOrArchives.length - 1))
                      } as CSSProperties}
                    >
                      {activeView.own.heapOrArchives.map((card) => {
                        const displayCard = enrichCard(card);
                        return (
                          <CardView
                            key={card.instanceId}
                            card={displayCard}
                            compact
                            displayMode={cardDisplayMode}
                            inactiveZone="heap"
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
                  ) : (
                    <p className="archivesPileEmpty" style={zoneCardsStyle}>Keine Karten im Heap.</p>
                  )}
                </SideZoneFrame>
                {activeView.own.rig ? (
                  <SideZoneFrame
                    side="runner"
                    label="Rig"
                    countLabel={formatCardCount(activeView.own.rig.length)}
                    iconKind="rig"
                    highlighted={zoneHighlighted(activeCueHighlight, activeView.side, "rig")}
                    className="runnerRigZone"
                    style={zoneCardsStyle}
                    collapsed={boardZoneCollapsedFor("runner:rig")}
                    onToggleCollapse={() => toggleBoardZoneCollapsed("runner:rig")}
                    collapseLabel="Rig"
                  >
                    {ownRigGroups.length > 0 ? (
                      <div className="rigGroups rigGroupsHorizontal rigGroupsTrack runnerRigZoneGroups">
                        {ownRigGroups.map((group) => (
                          <div
                            className="rigGroup rigGroupHorizontal"
                            key={group.key}
                            style={ownRigCardsStyle}
                          >
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
                                    {...fieldChoiceCardProps(card)}
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
                      <p className="archivesPileEmpty" style={zoneCardsStyle}>Keine Karten im Rig.</p>
                    )}
                  </SideZoneFrame>
                ) : null}
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
                detailMode={chronicleDetailMode}
                preferGermanCardImages={preferGermanCardImages}
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
              summary={filteredCatalogSummary}
              setFilter={catalogSetFilter}
              setOptions={catalogSetOptions}
              selectedId={selectedCatalogId}
              filtersOpen={catalogFiltersOpen}
              showExpertStatuses={catalogExpertStatuses}
              blockStatusCounts={catalogBlockStatusCounts}
              blockStatusFilter={catalogBlockStatusFilter}
              aiHintCounts={catalogAiHintCounts}
              aiHintFilter={catalogAiHintFilter}
              rarityCounts={catalogRarityCounts}
              rarityFilter={catalogRarityFilter}
              typeCounts={catalogTypeCounts}
              typeFilters={catalogTypeFilters}
              onSearch={setCatalogSearch}
              onSide={setCatalogSide}
              onStatus={setCatalogStatus}
              onSetFilter={setCatalogSetFilter}
              onSelect={setSelectedCatalogId}
              onFiltersOpen={setCatalogFiltersOpen}
              onToggleExpertStatuses={setCatalogExpertStatuses}
              onBlockStatusFilter={setCatalogBlockStatusFilter}
              onAiHintFilter={setCatalogAiHintFilter}
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
          {activeMatchWorkspace === "recent" ? (
            <RecentGamesPanel
              results={recentGameResults}
              loading={recentGameResultsLoading}
              error={recentGameResultsError}
              updatedAt={recentGameResultsUpdatedAt}
              onRefresh={refreshRecentGameResults}
            />
          ) : null}
          {activeMatchWorkspace === "options" ? (
            <OptionsPanel
              actionCueAutoDismissMs={actionCueAutoDismissMs}
              actionCuesEnabled={actionCuesEnabled}
              automaticEffectCuesEnabled={automaticEffectCuesEnabled}
              autoCorpMandatoryDrawEnabled={autoCorpMandatoryDrawEnabled}
              autoDiscardEnabled={autoDiscardEnabled}
              autoEndTurnEnabled={autoEndTurnEnabled}
              topbarStickyEnabled={topbarStickyEnabled}
              resourceStripMode={resourceStripMode}
              actionPanelMode={actionPanelMode}
              aiDecisionDebugOverlayEnabled={aiDecisionDebugOverlayEnabled}
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
              preferGermanCardImages={preferGermanCardImages}
              showSetBadges={showSetBadges}
              chronicleDetailMode={chronicleDetailMode}
              colorScheme={colorScheme}
              cuePosition={cuePosition}
              aiPacingMode={localAiPacingMode}
              session={session}
              onActionCueAutoDismissMs={setActionCueAutoDismissMs}
              onActionCuesEnabled={setActionCuesEnabled}
              onAutomaticEffectCuesEnabled={setAutomaticEffectCuesEnabled}
              onAutoCorpMandatoryDrawEnabled={setAutoCorpMandatoryDrawEnabled}
              onAutoDiscardEnabled={setAutoDiscardEnabled}
              onAutoEndTurnEnabled={setAutoEndTurnEnabled}
              onTopbarStickyEnabled={setTopbarStickyEnabled}
              onResourceStripMode={setResourceStripMode}
              onActionPanelMode={setActionPanelMode}
              onAiDecisionDebugOverlayEnabled={setAiDecisionDebugOverlayEnabled}
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
              onPreferGermanCardImages={setPreferGermanCardImages}
              onShowSetBadges={setShowSetBadges}
              onChronicleDetailMode={setChronicleDetailMode}
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
          playerName={session.displayName}
          onDismiss={() => {
            if (resultKey) setDismissedResultKey(resultKey);
          }}
          onNewMatch={leaveMatch}
          nextSeriesPending={seriesTransitioning}
          retentionProtected={payload?.retentionProtected === true}
          onRetentionProtection={setRetentionProtection}
          {...(opponentDisplayName ? { opponentName: opponentDisplayName } : {})}
          {...(canStartNextSeriesGame ? { onNextSeriesGame: startNextSeriesGame } : {})}
        />
      ) : null}
      {activeMatchIsGame && showAccessReveal && accessReveal ? (
        <AccessRevealModal
          reveal={accessReveal}
          displayMode={cardDisplayMode}
          disabled={Boolean(payload.winner) || connection !== "online"}
          onAction={submitAction}
          onDismiss={() =>
            setDismissedAccessEventIds((eventIds) =>
              eventIds.includes(accessReveal.eventId)
                ? eventIds
                : [...eventIds, accessReveal.eventId].slice(-30),
            )
          }
        />
      ) : null}
      {activeMatchIsGame && showExposeReview && exposeReview ? (
        <ExposeReviewModal
          review={exposeReview}
          displayMode={cardDisplayMode}
          onDismiss={() => setDismissedExposeReviewEventId(exposeReview.eventId)}
        />
      ) : null}
      {optionsDialogOpen ? (
        <OptionsDialog onDismiss={() => setOptionsDialogOpen(false)}>
          <OptionsPanel
            actionCueAutoDismissMs={actionCueAutoDismissMs}
            actionCuesEnabled={actionCuesEnabled}
            automaticEffectCuesEnabled={automaticEffectCuesEnabled}
            autoCorpMandatoryDrawEnabled={autoCorpMandatoryDrawEnabled}
            autoDiscardEnabled={autoDiscardEnabled}
            autoEndTurnEnabled={autoEndTurnEnabled}
            topbarStickyEnabled={topbarStickyEnabled}
            resourceStripMode={resourceStripMode}
            actionPanelMode={actionPanelMode}
            aiDecisionDebugOverlayEnabled={aiDecisionDebugOverlayEnabled}
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
            preferGermanCardImages={preferGermanCardImages}
            showSetBadges={showSetBadges}
            chronicleDetailMode={chronicleDetailMode}
            colorScheme={colorScheme}
            cuePosition={cuePosition}
            aiPacingMode={localAiPacingMode}
            modal
            session={session}
            onActionCueAutoDismissMs={setActionCueAutoDismissMs}
            onActionCuesEnabled={setActionCuesEnabled}
            onAutomaticEffectCuesEnabled={setAutomaticEffectCuesEnabled}
            onAutoCorpMandatoryDrawEnabled={setAutoCorpMandatoryDrawEnabled}
            onAutoDiscardEnabled={setAutoDiscardEnabled}
            onAutoEndTurnEnabled={setAutoEndTurnEnabled}
            onTopbarStickyEnabled={setTopbarStickyEnabled}
            onResourceStripMode={setResourceStripMode}
            onActionPanelMode={setActionPanelMode}
            onAiDecisionDebugOverlayEnabled={setAiDecisionDebugOverlayEnabled}
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
            onPreferGermanCardImages={setPreferGermanCardImages}
            onShowSetBadges={setShowSetBadges}
            onChronicleDetailMode={setChronicleDetailMode}
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
    </CardImagePreferenceContext.Provider>
    </CardScaleSettingsContext.Provider>
  );
}
