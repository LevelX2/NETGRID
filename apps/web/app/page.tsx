"use client";

import {
  Check,
  Clock,
  CopyPlus,
  Download,
  Eye,
  FlaskConical,
  Award,
  Gamepad2,
  Image,
  Layers3,
  ListFilter,
  Move,
  Moon,
  PanelRightOpen,
  PanelTopOpen,
  Pause,
  Play,
  Plus,
  Save,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  User,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import type {
  ApiClientGameMode,
  ApiCreateMatchResponse,
  ApiGameResultSummary,
  ApiJoinMatchResponse,
  ApiLifecycleResultSummary,
  ApiLobbyParticipantPayload,
  ApiLobbyPayload,
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
  PublicGameEvent,
  Side,
  VisibleCard,
  VisibleRunnerPaymentSupportAbility,
  Winner,
} from "@netgrid/shared";
import { formatChronicleEvent } from "./chronicle";
import {
  deckAgendaStatusForEditor,
  type DeckAgendaStatus,
} from "./deck-editor-ui";
import {
  actionSoundCountForAction,
  actionSoundForActionType,
  damageAudioCueFromPublicPayload,
  deriveDamageImpactCues,
  deriveOpponentActionCues,
  turnStartAudioCue,
  type BoardHighlight,
  type DamageImpactCue,
  type OpponentActionCue,
  type TurnStartAudioState,
} from "./action-cues";
import {
  actionCueAfterAiAdvanceRequest,
  accessPresentationOwnsActionCue,
  coalesceAccessActionCues,
  interactionPresentationBlocksAi,
  observerAccessAutoDismissMs,
} from "./access-presentation";
import {
  appendPendingAccessPresentationEvents,
  dismissPendingAccessPresentationEvent,
} from "./access-presentation-queue";
import {
  confirmedNextAccessAction,
  shouldKeepAccessRevealOpen,
  type PendingAccessContinuation,
} from "./access-reveal-ui";
import { matchOverlayPresentation } from "./match-overlay-presentation";
import { latestSuccessfulRunOutcomePresentation } from "./successful-run-outcome-presentation";
import {
  humanAiDecisionProbeActionContext,
  humanAiDecisionProbeAvailable,
  humanAiDecisionProbeMatchesPayload,
} from "./human-ai-decision-probe";
import {
  ACTION_CUE_POSITION_STORAGE_KEY,
  DEFAULT_CUE_POSITION,
  actionConsumesClick,
  actionContextStillVisible,
  actionCostChips,
  aiAdvanceRequestMode,
  aiPacingFallbackDelayMs,
  aiPacingDelayMs,
  actionMatchesContext,
  activeRunIceInstanceId,
  approachIceExposeViewingIceId,
  automaticCorpMandatoryDrawAction,
  automaticCorpRunPassAction,
  automaticEndTurnAction,
  baseActionSlotCapacity,
  exposedCardInstanceIdsForEvent,
  installedCorpExposeReviewCardId,
  fieldCardChoiceOptionsForCard,
  groupRunnerRigCards,
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
  serializeCuePositionPreference,
  shouldUseFieldCardChoice,
  serverDisplayLabel,
  splitLegalActions,
  type ActionContext,
  type CuePositionPreference,
  type CuePositionPreset,
  type IceModifierBadgeView,
} from "./action-board-ui";
import {
  deriveMatchStart,
  matchStartLobbyBlocksSetup,
  matchStartPlayerClockLabel,
  matchStartSummary,
  parseJoinLinkInput,
  type HumanAiSideSelection,
  type HumanSideSelection,
  type MatchFormatSelection,
  type MatchStartSeriesGames,
  type PlayMode,
} from "./match-start";
import { isHumanVsAiMatchMode } from "./match-deck-details";
import {
  formatMatchTimerDuration,
  matchTimerDecisionKey,
  matchTimerScopeLabel,
} from "./match-timer-ui";
import {
  parseMatchStartSettingsFromStorage,
  serializeMatchStartSettingsForStorage,
  type MatchStartPlayerClockGraceSeconds,
  type MatchStartPlayerClockMinutes,
  type MatchStartPlayerClockMode,
} from "./match-start-storage";
import { createMatchSeed, normalizeMatchSeed } from "./match-seed";
import {
  catalogCardMatchesTypeFilters,
  catalogRarityLabel,
  filterCatalogCardsBySet,
  summarizeCatalogSetFilters,
} from "./catalog-ui";
import { type DeckStrategyProfileViewerResponse } from "./deck-strategy-profile-ui";
import { isCardActionSurfaceTarget } from "./card-action-menu-ui";
import {
  actionBelongsToRunnerPaymentSupportWindow,
  createHiddenResourcePaymentPreselection,
  hiddenResourcePaymentPreselectionEquals,
  hiddenResourcePaymentPreselectionIsAvailable,
  paymentSupportSubmitKey,
  pendingPaymentSupportContinuation,
  resolveHiddenResourcePaymentPreselection,
  resolvePaymentSupportContinuation,
  shouldSubmitPaymentSupportAction,
  type HiddenResourcePaymentPreselection,
  type PendingPaymentSupportContinuation,
} from "./hidden-resource-payment-preselection";
import { actionNeedsRegionReplacementConfirmation } from "./action-payload";
import {
  clearStoredSession,
  loadRecentSession,
  loadStoredSession,
  persistSession,
  rememberRecentSession,
  removeRecentSession,
  storedSessionMatches,
  subscribeToRecoverableSessionChanges,
  type RecentSessionInfo,
  type SessionInfo,
} from "./session-recovery";
import {
  preparedAiDecisionDebugMatchesState,
  preparedAiDecisionDebugTrace,
  retainPreparedAiDecisionDebugTurnPlanTrace,
} from "./ai-decision-debug-prepared-trace";
import type { MaintenanceAiTraceDetail } from "./maintenance";
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
  DISPLAY_NAME_STORAGE_KEY,
  GAMEPLAY_SETTINGS_STORAGE_KEY,
  MATCH_START_SETTINGS_STORAGE_KEY,
  cardPreviewCollapsedStorageKeyFor,
} from "../lib/storage-keys";
import {
  readLocalStorage,
  rememberDisplayName,
  removeLocalStorageKey,
} from "../lib/local-storage";
import { copyTextToClipboard } from "../lib/clipboard";
import { downloadTextFile } from "../lib/download";
import { runtimeRandomId } from "../lib/runtime-id";
import { reconnectUrlForSession } from "../lib/session-url";
import { NETGRID_APP_STATUS_LABEL } from "../lib/app-build-info";
import {
  bootstrap,
  fetchAiDecisionPreview,
  fetchPreparedAiDecisionDebug,
  fetchPublicMatches,
  fetchPersonalRecentGameResults,
  fromInitialResponse,
  fromJoinedResponse,
  lobbyFromInitialResponse,
  lobbyFromJoinedResponse,
  postJson,
  serverErrorNotice,
  type AiDecisionPreview,
  type PreparedAiDecisionDebug,
  type PublicMatchEntry,
} from "../lib/client-api";
import {
  playActionCueSound,
  playMatchStartJingle,
  playResultSound,
  primeAudio,
  seriesAudioOutcome,
} from "../lib/audio";
import {
  clampOverlayPosition,
  parseOverlayPositionPreference,
  serializeOverlayPositionPreference,
  type OverlayPositionPreference,
} from "../lib/overlay-position";
import {
  AppBrand,
  ConnectionBadge,
  type ActiveMatchWorkspace,
  type ConnectionState,
} from "../features/app-shell/AppShell";
import { ActiveMatchWorkspaceArea } from "../features/app-shell/ActiveMatchWorkspaceArea";
import { ActiveMatchTopbar } from "../features/app-shell/ActiveMatchTopbar";
import { useObservedElementHeight } from "../features/app-shell/useObservedElementHeight";
import {
  ConfirmationDialog,
  type ConfirmationDialogRequest,
} from "../features/app-shell/ConfirmationDialog";
import { OptionsDialog } from "../features/app-shell/OptionsDialog";
import { UndoPanel } from "../features/app-shell/UndoPanel";
import { OptionsPanel } from "../features/settings/OptionsPanel";
import { CatalogPanel } from "../features/catalog/CatalogPanel";
import { useCatalogWorkspace } from "../features/catalog/useCatalogWorkspace";
import { DeckEditorPanel } from "../features/decks/DeckEditorPanel";
import type {
  DeckLibraryResponse,
  DeckSnapshot,
  DeckTemplate,
  DeckTemplatesResponse,
  DeckValidationResponse,
  DeckValidationResult,
} from "../features/decks/deck-api-types";
import {
  deckFingerprint,
  deckMetadataFromEditable,
  type DeckCardEntry,
  type EditableDeck,
} from "../features/decks/deck-table-model";
import {
  DEFAULT_CORP_SNAPSHOT_ID,
  DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID,
  DEFAULT_IDENTITY_BY_SIDE,
  DEFAULT_RUNNER_SNAPSHOT_ID,
  catalogCardAllowedForDeckEditor,
  deckProfileForMatchCardPool,
  editableDeckAllowedForMatchCardPool,
  snapshotAllowedForMatchCardPool,
} from "../features/decks/deck-match-filters";
import {
  mergeVisibleGuestDecks,
  visibleGuestDecks,
} from "../features/decks/deck-library-visibility";
import {
  RANDOM_STANDARD_DECK_SOURCE,
  randomStandardSnapshotForSlot,
  resolveDeckSlotSelection,
  type DeckSlotSource,
} from "../features/decks/deck-slot-selection";
import {
  enrichVisibleCard,
  visibleCardFromCatalogDetail,
  visibleKnownCardIds,
  type DisplayVisibleCard,
} from "../features/cards/card-view-model";
import {
  CardImagePreferenceContext,
  CardScaleSettingsContext,
  CardTooltipSettingsContext,
  useCardScaleSettings,
  usePreferredCardImageSource,
} from "../features/cards/card-display-settings";
import { usePersistentCardScaleSettings } from "../features/cards/usePersistentCardScaleSettings";
import {
  cardDetailLines,
  cardWithoutDevelopmentCounters,
} from "../features/cards/card-detail-lines";
import { scoreCardStateBadges } from "../features/cards/ScoredAgendaState";
import { CardPreviewPanel } from "../features/cards/CardPreviewPanel";
import { GameOverModal } from "../features/results/GameOverModal";
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
  type ResourceStripMode,
} from "../features/settings/settings-model";
import {
  PlayerClockStrip,
  playerClockGraceDisplay,
} from "../features/game-board/PlayerClock";
import {
  RunnerOpponentZonesStrip,
  RunnerRigStrip,
  type FieldChoiceCardProps,
} from "../features/game-board/RunnerBoardStrips";
import { ActiveServerGrid } from "../features/game-board/ActiveServerGrid";
import { ActiveRunnerZoneBoard } from "../features/game-board/ActiveRunnerZoneBoard";
import { ScoredAgendaOverlay } from "../features/game-board/ScoredAgendaOverlay";
import { RunTimelineOverlay } from "../features/game-board/RunTimelineOverlay";
import { SpecialZonesStrip } from "../features/game-board/SpecialZonesStrip";
import {
  ActionSlotMeter,
  ActiveMatchResourceStrip,
} from "../features/game-board/ResourceStrip";
import {
  OpponentPanel,
  PlayerPanel,
} from "../features/game-board/SideStatusPanels";
import {
  ActionPanelDockPlaceholder,
  CostChips,
} from "../features/actions/ActionControls";
import { LegalActionsPanel } from "../features/actions/LegalActionsPanel";
import { DamageImpactOverlay } from "../features/actions/DamageImpactOverlay";
import { OpponentActionOverlay } from "../features/actions/OpponentActionOverlay";
import { OpponentCueTitle } from "../features/actions/OpponentCueTitle";
import { FloatingActionPanelOverlay } from "../features/actions/FloatingActionPanelOverlay";
import {
  AccessRevealModal,
  ExposeReviewModal,
} from "../features/actions/AccessReviewModals";
import { SuccessfulRunOutcomeModal } from "../features/actions/SuccessfulRunOutcomeModal";
import {
  accessRevealFromCurrentRun,
  accessRevealFromLatestEvent,
  archivesRevealFromLatestEvent,
  exposeReviewFromLatestEvent,
  gypsyScheduleAnalyzerRevealFromPendingChoice,
  hqAgendaRevealFromLatestEvent,
  retainedArchivesRevealEvent,
  retainedHqAgendaRevealEvent,
  retainedSecurityPurgeRevealEvent,
  revealedEventCardIds,
  securityPurgeRevealFromLatestEvent,
} from "../features/actions/access-review-derivation";
import {
  eventActionType,
  localActionSoundKey,
  localActionSoundKind,
  publicEventsAfter,
} from "../features/actions/local-action-sounds";
import { runHiddenContextActionHint } from "../features/actions/run-hidden-context-hint";
import { RecentGamesPanel } from "../features/recent/RecentGamesPanel";
import { PublicGamesPanel } from "../features/games/PublicGamesPanel";
import { shouldRefreshPublicGames } from "../features/games/public-games-model";
import {
  effectiveAiTurnPresentation,
  removePendingUndo,
} from "../features/match-session/client-payload-helpers";
import { useMatchTransport } from "../features/match-session/useMatchTransport";
import {
  ChroniclePanel,
  chronicleContextByEventId,
} from "../features/chronicle/ChroniclePanel";
import {
  FloatingAiDecisionDebugOverlay,
  type AiDecisionDebugOverlayStatus,
} from "../features/debug/AiDecisionDebugOverlay";
import {
  DiagnosticsDrawer,
  shortDiagnosticsHash,
} from "../features/debug/DiagnosticsDrawer";
import { AiPacingControls } from "../features/debug/AiPacingControls";
import { MatchHostConsole } from "../features/match-start/MatchHostConsole";
import { accountMatchStartPreferencesFromUi } from "../features/match-start/account-match-start-preferences";
import { MatchJoinConsole } from "../features/match-start/MatchJoinConsole";
import { MatchResumePanel } from "../features/match-start/MatchResumePanel";
import { StartLobbyPanel } from "../features/match-start/StartLobbyPanel";
import {
  isInvalidatingTerminalStatus,
  matchFormatLabel,
  playerSlotForSide,
  resultReasonLabel,
  seriesStatusText,
  shouldForgetRecoveryStatus,
} from "../features/match-start/lobby-format";
import {
  formatCardCount,
  opponentSide,
  sideFromPublicPayload,
  sideLabel,
  sideStatusLineForView,
  turnActionHeaderLabel,
  turnSideForView,
  updateActionSlotCapacity,
  zoneHighlighted,
} from "../features/game-board/board-view-helpers";
import { AccountPanel } from "../features/account/AccountPanel";
import {
  loadAccountActivePublicMatchIds,
  rejoinAccountPublicMatch,
} from "../features/account/account-client";
import {
  loadAccountMatchStartPreferences,
  resetAccountMatchStartPreferences,
  saveAccountMatchStartPreferences,
  type AccountMatchStartDeckSelection,
  type AccountMatchStartPreferences,
} from "../features/account/account-match-start-preferences-client";
import { useAccountSession } from "../features/account/useAccountSession";
import {
  createAccountDeck,
  deleteAccountDeck,
  loadAccountDecks,
  snapshotAccountDeck,
  updateAccountDeck,
  type AccountDeck,
  type AccountDeckQuota,
  type StandardDeck,
} from "../features/account/account-deck-client";
import {
  INITIAL_STANDARD_DECK_CATALOG_STATE,
  beginStandardDeckCatalogLoad,
  completeStandardDeckCatalogLoad,
  failStandardDeckCatalogLoad,
  requestStandardDeckCatalog,
  standardDeckCatalogBlocksSources,
  standardDeckCatalogDiagnostic,
} from "../features/account/standard-deck-catalog-state";

const APP_NAME = "NETGRID";
const APP_STATUS_LABEL = NETGRID_APP_STATUS_LABEL;
const APP_BRAND_ASSET_VERSION = "2026-05-10-brand-fix-2";
const APP_ICON_SRC = `/brand/netgrid-icon-cyber-v1.png?v=${APP_BRAND_ASSET_VERSION}`;
const APP_WORDMARK_SRC = `/brand/netgrid-wordmark-cyber-v1.png?v=${APP_BRAND_ASSET_VERSION}`;

type MatchStatus = ApiMatchStatus;
type GameMode = ApiClientGameMode;
type MatchFormat = MatchFormatSelection;
type MatchCardPool = ApiMatchCardPool;
type AiDifficulty = "easy" | "normal" | "hard";
type AiDeckPolicy =
  | "fixed"
  | "selected"
  | "seeded_random"
  | "same_as_participant_a";
type AiTraceStartMode = "off" | "detailed";
type EntryTab =
  | "play"
  | "games"
  | "catalog"
  | "decks"
  | "recent"
  | "options"
  | "account";
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

const CARD_DISPLAY_BASE_MIN_WIDTH = 108;

export default function Page() {
  const router = useRouter();
  const [entryTab, setEntryTab] = useState<EntryTab>("play");
  const [activeMatchWorkspace, setActiveMatchWorkspace] =
    useState<ActiveMatchWorkspace>("game");
  const [mode, setMode] = useState<"host" | "join">("host");
  const [recoveryTabSelected, setRecoveryTabSelected] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("human_vs_human");
  const [humanSideSelection, setHumanSideSelection] =
    useState<HumanSideSelection>("random");
  const [humanAiSideSelection, setHumanAiSideSelection] =
    useState<HumanAiSideSelection>("random");
  const [matchFormat, setMatchFormat] = useState<MatchFormat>("rules_match");
  const [seriesGamesPlanned, setSeriesGamesPlanned] =
    useState<MatchStartSeriesGames>(2);
  const [matchCardPool, setMatchCardPool] =
    useState<MatchCardPool>("originalset");
  const [playerClockMode, setPlayerClockMode] =
    useState<MatchStartPlayerClockMode>("none");
  const [playerClockMinutes, setPlayerClockMinutes] =
    useState<MatchStartPlayerClockMinutes>(10);
  const [playerClockGraceSeconds, setPlayerClockGraceSeconds] =
    useState<MatchStartPlayerClockGraceSeconds>(10);
  const [runnerDifficulty, setRunnerDifficulty] =
    useState<AiDifficulty>("normal");
  const [corpDifficulty, setCorpDifficulty] = useState<AiDifficulty>("normal");
  const [aiDeckPolicy, setAiDeckPolicy] = useState<AiDeckPolicy>("selected");
  const [aiTraceStartMode, setAiTraceStartMode] =
    useState<AiTraceStartMode>("detailed");
  const [testSetupMode, setTestSetupMode] = useState(false);
  const [displayName, setDisplayName] = useState("Teilnehmer A");
  const accountSession = useAccountSession();
  const accountIdRef = useRef<string | null>(null);
  const accountMatchStartPreferencesBaselineRef = useRef<string | null>(null);
  const accountMatchStartPreferencesRef =
    useRef<AccountMatchStartPreferences | null>(null);
  const previousAccountSessionStatusRef = useRef<
    "guest" | "authenticated" | null
  >(null);
  const [
    accountMatchStartPreferencesLoadedFor,
    setAccountMatchStartPreferencesLoadedFor,
  ] = useState<string | null>(null);
  const [
    accountMatchStartPreferencesResetting,
    setAccountMatchStartPreferencesResetting,
  ] = useState(false);
  const [matchStartSettingsLoaded, setMatchStartSettingsLoaded] =
    useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<3 | 5 | 10>(3);
  const [seed, setSeed] = useState("");
  const [joinLinkInput, setJoinLinkInput] = useState("");
  const [joinMatchId, setJoinMatchId] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [openLanMatches, setOpenLanMatches] = useState<PublicMatchEntry[]>([]);
  const [openLanLoading, setOpenLanLoading] = useState(false);
  const [openLanError, setOpenLanError] = useState("");
  const [openLanUpdatedAt, setOpenLanUpdatedAt] = useState<string | null>(null);
  const [accountRejoinableMatchIds, setAccountRejoinableMatchIds] = useState<
    string[]
  >([]);
  const [accountRejoiningMatchId, setAccountRejoiningMatchId] = useState<
    string | null
  >(null);
  const [recentGameResults, setRecentGameResults] = useState<
    ApiRecentResultEntry[]
  >([]);
  const [recentGameResultsLoading, setRecentGameResultsLoading] =
    useState(false);
  const [recentGameResultsError, setRecentGameResultsError] = useState("");
  const [recentGameResultsUpdatedAt, setRecentGameResultsUpdatedAt] = useState<
    string | null
  >(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [payload, setPayload] = useState<ClientPayload | null>(null);
  const [lobby, setLobby] = useState<LobbyClientPayload | null>(null);
  const [matchStartLogoMatchId, setMatchStartLogoMatchId] = useState<
    string | null
  >(null);
  const [matchClockNowMs, setMatchClockNowMs] = useState(() => Date.now());
  const [matchClockAnchor, setMatchClockAnchor] =
    useState<LocalMatchClockAnchor | null>(null);
  const [lobbyChatText, setLobbyChatText] = useState("");
  const [connection, setConnection] = useState<ConnectionState>("offline");
  const [notice, setNotice] = useState("");
  const [undoNotice, setUndoNotice] = useState("");
  const [deckSnapshots, setDeckSnapshots] = useState<DeckSnapshot[]>([]);
  const [deckTemplates, setDeckTemplates] = useState<DeckTemplate[]>([]);
  const [runnerDeckSource, setRunnerDeckSource] =
    useState<DeckSlotSource>("snapshot");
  const [corpDeckSource, setCorpDeckSource] =
    useState<DeckSlotSource>("snapshot");
  const [participantBRunnerDeckSource, setParticipantBRunnerDeckSource] =
    useState<DeckSlotSource>("snapshot");
  const [participantBCorpDeckSource, setParticipantBCorpDeckSource] =
    useState<DeckSlotSource>("snapshot");
  const [selectedRunnerSnapshotId, setSelectedRunnerSnapshotId] = useState(
    DEFAULT_RUNNER_SNAPSHOT_ID,
  );
  const [selectedCorpSnapshotId, setSelectedCorpSnapshotId] = useState(
    DEFAULT_CORP_SNAPSHOT_ID,
  );
  const [
    selectedParticipantBRunnerSnapshotId,
    setSelectedParticipantBRunnerSnapshotId,
  ] = useState(DEFAULT_RUNNER_SNAPSHOT_ID);
  const [
    selectedParticipantBCorpSnapshotId,
    setSelectedParticipantBCorpSnapshotId,
  ] = useState(DEFAULT_CORP_SNAPSHOT_ID);
  const [selectedRunnerLocalDeckId, setSelectedRunnerLocalDeckId] =
    useState("");
  const [selectedCorpLocalDeckId, setSelectedCorpLocalDeckId] = useState("");
  const [
    selectedParticipantBRunnerLocalDeckId,
    setSelectedParticipantBRunnerLocalDeckId,
  ] = useState("");
  const [
    selectedParticipantBCorpLocalDeckId,
    setSelectedParticipantBCorpLocalDeckId,
  ] = useState("");
  const [runnerLocalSnapshot, setRunnerLocalSnapshot] =
    useState<DeckSnapshot | null>(null);
  const [corpLocalSnapshot, setCorpLocalSnapshot] =
    useState<DeckSnapshot | null>(null);
  const [localDecks, setLocalDecks] = useState<EditableDeck[]>([]);
  const [localDecksLoaded, setLocalDecksLoaded] = useState(false);
  const [guestDeckBacking, setGuestDeckBacking] = useState<EditableDeck[]>([]);
  const [accountDeckRecords, setAccountDeckRecords] = useState<AccountDeck[]>(
    [],
  );
  const [accountDeckQuota, setAccountDeckQuota] =
    useState<AccountDeckQuota | null>(null);
  const [standardDecks, setStandardDecks] = useState<StandardDeck[]>([]);
  const [standardDecksLoaded, setStandardDecksLoaded] = useState(false);
  const [standardDeckCatalogState, setStandardDeckCatalogState] = useState(
    INITIAL_STANDARD_DECK_CATALOG_STATE,
  );
  const standardDeckCatalogRequestIdRef = useRef(0);
  const standardDeckCatalogAttemptRef = useRef(0);
  const [accountDeckBusy, setAccountDeckBusy] = useState(false);
  const [savedDeckFingerprints, setSavedDeckFingerprints] = useState<
    Record<string, string>
  >({});
  const [deckLibraryStoragePath, setDeckLibraryStoragePath] = useState("");
  const [selectedLocalDeckId, setSelectedLocalDeckId] = useState<string | null>(
    null,
  );
  const [deckValidation, setDeckValidation] =
    useState<DeckValidationResult | null>(null);
  const [validatedSnapshot, setValidatedSnapshot] =
    useState<DeckSnapshot | null>(null);
  const [deckImportText, setDeckImportText] = useState("");
  const [deckExportText, setDeckExportText] = useState("");
  const [cardDisplayMode, setCardDisplayMode] =
    useState<CardDisplayMode>("placeholder");
  const [preferGermanCardImages, setPreferGermanCardImages] = useState(false);
  const [showSetBadges, setShowSetBadges] = useState(true);
  const [cardPreviewCollapsed, setCardPreviewCollapsed] = useState(false);
  const [boardZoneCollapsed, setBoardZoneCollapsed] = useState<
    Record<string, boolean>
  >({});
  const [scoreAreaOverlays, setScoreAreaOverlays] = useState<
    Record<Side, boolean>
  >({ runner: false, corp: false });
  const [scoreAreaOverlayPositions, setScoreAreaOverlayPositions] = useState<
    Record<Side, RunOverlayPositionPreference>
  >({
    runner: { kind: "default" },
    corp: { kind: "default" },
  });
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [undoPanelOpen, setUndoPanelOpen] = useState(false);
  const [focusedCard, setFocusedCard] = useState<FocusedCard | null>(null);
  const [dismissedAccessEventIds, setDismissedAccessEventIds] = useState<
    string[]
  >([]);
  const [pendingAccessPresentationEvents, setPendingAccessPresentationEvents] =
    useState<PublicGameEvent[]>([]);
  const [dismissedExposeReviewEventId, setDismissedExposeReviewEventId] =
    useState<string | null>(null);
  const [
    dismissedSuccessfulRunOutcomeEventId,
    setDismissedSuccessfulRunOutcomeEventId,
  ] = useState<string | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [matchDetailsOpen, setMatchDetailsOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("black");
  const [colorSchemeLoaded, setColorSchemeLoaded] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.45);
  const [audioSettingsLoaded, setAudioSettingsLoaded] = useState(false);
  const [localAiPacingMode, setLocalAiPacingMode] =
    useState<AiPacingMode>("paced");
  const [aiPacingModeLoaded, setAiPacingModeLoaded] = useState(false);
  const [cardDisplayModeLoaded, setCardDisplayModeLoaded] = useState(false);
  const [cardImageSkinSettingsLoaded, setCardImageSkinSettingsLoaded] =
    useState(false);
  const [chronicleDetailMode, setChronicleDetailMode] =
    useState<ChronicleDetailMode>("full");
  const [chronicleDetailModeLoaded, setChronicleDetailModeLoaded] =
    useState(false);

  const boardZoneCollapsedFor = (key: string): boolean =>
    Boolean(boardZoneCollapsed[key]);
  const toggleBoardZoneCollapsed = (key: string) => {
    setBoardZoneCollapsed((current) => ({ ...current, [key]: !current[key] }));
  };
  const [actionCueQueue, setActionCueQueue] = useState<OpponentActionCue[]>([]);
  const [currentActionCue, setCurrentActionCue] =
    useState<OpponentActionCue | null>(null);
  const [damageImpactQueue, setDamageImpactQueue] = useState<DamageImpactCue[]>(
    [],
  );
  const [currentDamageImpact, setCurrentDamageImpact] =
    useState<DamageImpactCue | null>(null);
  const [aiPacingFallbackVisible, setAiPacingFallbackVisible] = useState(false);
  const [dismissedResultKey, setDismissedResultKey] = useState<string | null>(
    null,
  );
  const [seriesTransitioning, setSeriesTransitioning] = useState(false);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [confirmationDialog, setConfirmationDialog] =
    useState<ConfirmationDialogRequest | null>(null);
  const [actionCuesEnabled, setActionCuesEnabled] = useState(true);
  const [actionCueAutoDismissMs, setActionCueAutoDismissMs] =
    useState<CueAutoDismissMs>(2500);
  const [automaticEffectCuesEnabled, setAutomaticEffectCuesEnabled] =
    useState(false);
  const [actionCueSettingsLoaded, setActionCueSettingsLoaded] = useState(false);
  const [autoEndTurnEnabled, setAutoEndTurnEnabled] = useState(false);
  const [autoCorpMandatoryDrawEnabled, setAutoCorpMandatoryDrawEnabled] =
    useState(false);
  const [autoDiscardEnabled, setAutoDiscardEnabled] = useState(false);
  const [corpRunAutoPassKey, setCorpRunAutoPassKey] = useState<string | null>(
    null,
  );
  const [priorityWindowHoldEnabled, setPriorityWindowHoldEnabled] =
    useState(false);
  const [paymentSupportPreselection, setPaymentSupportPreselection] =
    useState<HiddenResourcePaymentPreselection | null>(null);
  const [paymentSupportContinuation, setPaymentSupportContinuation] =
    useState<PendingPaymentSupportContinuation | null>(null);
  const [topbarStickyEnabled, setTopbarStickyEnabled] = useState(true);
  const [cyberspaceBackgroundEnabled, setCyberspaceBackgroundEnabled] =
    useState(true);
  const [resourceStripMode, setResourceStripMode] =
    useState<ResourceStripMode>("auto");
  const [actionPanelMode, setActionPanelMode] =
    useState<ActionPanelMode>("docked");
  const [aiDecisionDebugOverlayEnabled, setAiDecisionDebugOverlayEnabled] =
    useState(false);
  const [exposedCardHighlightEnabled, setExposedCardHighlightEnabled] =
    useState(true);
  const [exposedCardHighlightIds, setExposedCardHighlightIds] = useState<
    string[]
  >([]);
  const [actionPanelOverlayPosition, setActionPanelOverlayPosition] =
    useState<RunOverlayPositionPreference>(() =>
      typeof window === "undefined"
        ? { kind: "default" }
        : parseOverlayPositionPreference(
            readLocalStorage(ACTION_PANEL_OVERLAY_POSITION_STORAGE_KEY),
          ),
    );
  const [aiDecisionDebugOverlayPosition, setAiDecisionDebugOverlayPosition] =
    useState<RunOverlayPositionPreference>(() =>
      typeof window === "undefined"
        ? { kind: "default" }
        : parseOverlayPositionPreference(
            readLocalStorage(AI_DECISION_DEBUG_OVERLAY_POSITION_STORAGE_KEY),
          ),
    );
  const [aiDecisionDebugStatus, setAiDecisionDebugStatus] =
    useState<AiDecisionDebugOverlayStatus>("off");
  const [aiDecisionDebugError, setAiDecisionDebugError] = useState("");
  const [
    aiDecisionDebugFailedPreparationKey,
    setAiDecisionDebugFailedPreparationKey,
  ] = useState("");
  const [preparedAiDecisionDebug, setPreparedAiDecisionDebug] =
    useState<PreparedAiDecisionDebug | null>(null);
  const [aiDecisionDebugTurnPlanTrace, setAiDecisionDebugTurnPlanTrace] =
    useState<MaintenanceAiTraceDetail | null>(null);
  const [aiDecisionDebugPreview, setAiDecisionDebugPreview] =
    useState<AiDecisionPreview | null>(null);
  const [aiDecisionDebugPreviewError, setAiDecisionDebugPreviewError] =
    useState("");
  const [aiDecisionDebugPreviewLoading, setAiDecisionDebugPreviewLoading] =
    useState(false);
  const [statusPanelsVisible, setStatusPanelsVisible] = useState(true);
  const [gameplaySettingsLoaded, setGameplaySettingsLoaded] = useState(false);
  const [discardChoiceSelection, setDiscardChoiceSelection] = useState<{
    choiceId: string;
    selectedOptionIds: string[];
  } | null>(null);
  const [fieldCardChoiceSelection, setFieldCardChoiceSelection] = useState<{
    choiceId: string;
    selectedOptionIds: string[];
  } | null>(null);
  const [cuePosition, setCuePosition] =
    useState<CuePositionPreference>(DEFAULT_CUE_POSITION);
  const [cuePositionLoaded, setCuePositionLoaded] = useState(false);
  const [cardTooltipHoverDelayMs, setCardTooltipHoverDelayMs] =
    useState<CardTooltipHoverDelayMs>(CARD_TOOLTIP_HOVER_OPEN_DELAY_MS);
  const [cardTooltipMode, setCardTooltipMode] =
    useState<CardTooltipMode>("enhanced");
  const [cardTooltipSettingsLoaded, setCardTooltipSettingsLoaded] =
    useState(false);
  const {
    cardTooltipScalePercent,
    cardHandScalePercent,
    cardArchiveScalePercent,
    cardZoneScalePercent,
    cardBoardScalePercent,
    cardRigScalePercent,
    cardSpecialZoneScalePercent,
    setCardTooltipScalePercent,
    setCardHandScalePercent,
    setCardArchiveScalePercent,
    setCardZoneScalePercent,
    setCardBoardScalePercent,
    setCardRigScalePercent,
    setCardSpecialZoneScalePercent,
  } = usePersistentCardScaleSettings();
  const [selectedActionContext, setSelectedActionContext] =
    useState<ActionContext | null>(null);
  const [actionSlotCapacities, setActionSlotCapacities] = useState<
    Record<Side, number>
  >({
    runner: baseActionSlotCapacity("runner"),
    corp: baseActionSlotCapacity("corp"),
  });
  const [recentSession, setRecentSession] = useState<RecentSessionInfo | null>(
    null,
  );
  const sessionRef = useRef<SessionInfo | null>(null);
  const lobbyRef = useRef<LobbyClientPayload | null>(null);
  const lastAnimatedMatchIdRef = useRef<string | null>(null);
  const resultAudioPrimedRef = useRef(false);
  const lastAudioResultKeyRef = useRef<string | null>(null);
  const lastSeenCueEventIdRef = useRef<string | null>(null);
  const lastSeenAccessPresentationEventIdRef = useRef<string | null>(null);
  const lastSeenExposeHighlightEventIdRef = useRef<string | null>(null);
  const exposedCardHighlightTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const lastTurnStartAudioStateRef = useRef<TurnStartAudioState | null>(null);
  const lastTurnStartAudioCueKeyRef = useRef<string | null>(null);
  const locallyPlayedActionSoundKeysRef = useRef<Set<string>>(new Set());
  const autoEndTurnSubmittedKeyRef = useRef<string | null>(null);
  const autoCorpMandatoryDrawSubmittedKeyRef = useRef<string | null>(null);
  const autoDiscardSubmittedKeyRef = useRef<string | null>(null);
  const corpRunAutoPassSubmittedKeyRef = useRef<string | null>(null);
  const paymentSupportSubmittedKeyRef = useRef<string | null>(null);
  const paymentSupportContinuationSubmittedKeyRef = useRef<string | null>(null);
  const pendingAccessContinuationRef = useRef<PendingAccessContinuation | null>(
    null,
  );
  const pendingAiAdvanceKeyRef = useRef<string | null>(null);
  const reconnectInFlightRef = useRef(false);
  const accountRejoinInFlightRef = useRef(false);
  const aiDecisionDebugPreviewRequestKeyRef = useRef<string | null>(null);
  const aiDecisionDebugPreviewContextRef = useRef<ActionContext | null>(null);
  const localAiPacingModeRef = useRef<AiPacingMode>("paced");
  const hasStoredMatchStartSettingsRef = useRef(false);
  const statusPanelsRef = useRef<HTMLElement | null>(null);
  const lastActionSlotTurnRef = useRef<{
    matchId: string;
    activeSide: Side;
  } | null>(null);
  const cardPreviewCollapsedStorageKey = session
    ? cardPreviewCollapsedStorageKeyFor(session.matchId, session.side)
    : null;
  const activeMatchIsGame = activeMatchWorkspace === "game";
  const { elementRef: topbarRef, heightPx: topbarHeightPx } =
    useObservedElementHeight<HTMLElement>(
      `${activeMatchIsGame ? "game" : "entry"}:${payload?.matchId ?? ""}`,
    );

  const selectStartTab = (nextMode: "host" | "join" | "resume") => {
    if (nextMode === "resume") {
      setRecoveryTabSelected(true);
      return;
    }
    setRecoveryTabSelected(false);
    setMode(nextMode);
  };

  const updatePlayMode = (nextPlayMode: PlayMode) => {
    setPlayMode(nextPlayMode);
  };

  function presentMatchStartLogo(matchId: string) {
    if (lastAnimatedMatchIdRef.current === matchId) return;
    lastAnimatedMatchIdRef.current = matchId;
    if (audioEnabled) playMatchStartJingle(audioVolume);
    setMatchStartLogoMatchId(matchId);
  }

  useEffect(() => {
    if (!matchStartLogoMatchId) return;
    const timeout = window.setTimeout(
      () => setMatchStartLogoMatchId(null),
      2200,
    );
    return () => window.clearTimeout(timeout);
  }, [matchStartLogoMatchId]);

  const updateCardPreviewCollapsed = (collapsed: boolean) => {
    setCardPreviewCollapsed(collapsed);
    if (cardPreviewCollapsedStorageKey)
      window.localStorage.setItem(
        cardPreviewCollapsedStorageKey,
        collapsed ? "true" : "false",
      );
  };

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(
    () =>
      subscribeToRecoverableSessionChanges((storedSession) => {
        const currentSession = sessionRef.current;
        if (
          !storedSession ||
          !currentSession ||
          storedSession.matchId !== currentSession.matchId ||
          storedSession.side !== currentSession.side
        )
          return;
        if (
          storedSession.sessionToken === currentSession.sessionToken &&
          storedSession.reconnectToken === currentSession.reconnectToken &&
          storedSession.webSocketUrl === currentSession.webSocketUrl
        )
          return;
        sessionRef.current = storedSession;
        setSession(storedSession);
      }),
    [],
  );

  const {
    closeSocket,
    ensureSocketConnected,
    reconnectSocket,
    sendSocketMessage,
  } = useMatchTransport({
    session,
    onMessage: applyServerMessage,
    setConnection,
    setNotice,
  });
  const {
    allCatalogCards,
    catalogDetailsById,
    catalogPanelProps,
    ensureCatalogDetails,
  } = useCatalogWorkspace(
    payload
      ? { eventTail: payload.eventTail, playerView: payload.playerView }
      : null,
  );

  useEffect(() => {
    lobbyRef.current = lobby;
  }, [lobby]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("matchId");
    const token = params.get("joinToken");
    const reconnectToken = params.get("reconnectToken");
    const reconnectSessionToken = params.get("sessionToken");
    const reconnectSide = params.get("side");
    const recovery = params.get("recovery") === "1";
    const storedDisplayName = readLocalStorage(
      DISPLAY_NAME_STORAGE_KEY,
    )?.trim();
    const rawMatchStartSettings = readLocalStorage(
      MATCH_START_SETTINGS_STORAGE_KEY,
    );
    const storedMatchStartSettings = parseMatchStartSettingsFromStorage(
      rawMatchStartSettings,
    );
    if (rawMatchStartSettings && !storedMatchStartSettings)
      removeLocalStorageKey(MATCH_START_SETTINGS_STORAGE_KEY);
    if (storedMatchStartSettings) {
      hasStoredMatchStartSettingsRef.current = true;
      if (storedMatchStartSettings.mode) setMode(storedMatchStartSettings.mode);
      if (storedMatchStartSettings.playMode)
        setPlayMode(storedMatchStartSettings.playMode);
      if (storedMatchStartSettings.humanSideSelection)
        setHumanSideSelection(storedMatchStartSettings.humanSideSelection);
      if (storedMatchStartSettings.humanAiSideSelection)
        setHumanAiSideSelection(storedMatchStartSettings.humanAiSideSelection);
      if (storedMatchStartSettings.matchFormat)
        setMatchFormat(storedMatchStartSettings.matchFormat);
      if (storedMatchStartSettings.seriesGamesPlanned)
        setSeriesGamesPlanned(storedMatchStartSettings.seriesGamesPlanned);
      if (storedMatchStartSettings.matchCardPool)
        setMatchCardPool(storedMatchStartSettings.matchCardPool);
      if (storedMatchStartSettings.playerClockMode)
        setPlayerClockMode(storedMatchStartSettings.playerClockMode);
      if (storedMatchStartSettings.playerClockMinutes)
        setPlayerClockMinutes(storedMatchStartSettings.playerClockMinutes);
      if (storedMatchStartSettings.playerClockGraceSeconds !== undefined)
        setPlayerClockGraceSeconds(
          storedMatchStartSettings.playerClockGraceSeconds,
        );
      if (storedMatchStartSettings.runnerDifficulty)
        setRunnerDifficulty(storedMatchStartSettings.runnerDifficulty);
      if (storedMatchStartSettings.corpDifficulty)
        setCorpDifficulty(storedMatchStartSettings.corpDifficulty);
      if (storedMatchStartSettings.aiDeckPolicy)
        setAiDeckPolicy(storedMatchStartSettings.aiDeckPolicy);
      if (typeof storedMatchStartSettings.testSetupMode === "boolean")
        setTestSetupMode(storedMatchStartSettings.testSetupMode);
      if (storedMatchStartSettings.countdownSeconds)
        setCountdownSeconds(storedMatchStartSettings.countdownSeconds);
      setSeed(createMatchSeed());
      if (storedMatchStartSettings.runnerDeckSource)
        setRunnerDeckSource(storedMatchStartSettings.runnerDeckSource);
      if (storedMatchStartSettings.corpDeckSource)
        setCorpDeckSource(storedMatchStartSettings.corpDeckSource);
      if (storedMatchStartSettings.participantBRunnerDeckSource)
        setParticipantBRunnerDeckSource(
          storedMatchStartSettings.participantBRunnerDeckSource,
        );
      if (storedMatchStartSettings.participantBCorpDeckSource)
        setParticipantBCorpDeckSource(
          storedMatchStartSettings.participantBCorpDeckSource,
        );
      if (typeof storedMatchStartSettings.selectedRunnerSnapshotId === "string")
        setSelectedRunnerSnapshotId(
          storedMatchStartSettings.selectedRunnerSnapshotId,
        );
      if (typeof storedMatchStartSettings.selectedCorpSnapshotId === "string")
        setSelectedCorpSnapshotId(
          storedMatchStartSettings.selectedCorpSnapshotId,
        );
      if (
        typeof storedMatchStartSettings.selectedParticipantBRunnerSnapshotId ===
        "string"
      )
        setSelectedParticipantBRunnerSnapshotId(
          storedMatchStartSettings.selectedParticipantBRunnerSnapshotId,
        );
      if (
        typeof storedMatchStartSettings.selectedParticipantBCorpSnapshotId ===
        "string"
      )
        setSelectedParticipantBCorpSnapshotId(
          storedMatchStartSettings.selectedParticipantBCorpSnapshotId,
        );
      if (
        typeof storedMatchStartSettings.selectedRunnerLocalDeckId === "string"
      )
        setSelectedRunnerLocalDeckId(
          storedMatchStartSettings.selectedRunnerLocalDeckId,
        );
      if (typeof storedMatchStartSettings.selectedCorpLocalDeckId === "string")
        setSelectedCorpLocalDeckId(
          storedMatchStartSettings.selectedCorpLocalDeckId,
        );
      if (
        typeof storedMatchStartSettings.selectedParticipantBRunnerLocalDeckId ===
        "string"
      )
        setSelectedParticipantBRunnerLocalDeckId(
          storedMatchStartSettings.selectedParticipantBRunnerLocalDeckId,
        );
      if (
        typeof storedMatchStartSettings.selectedParticipantBCorpLocalDeckId ===
        "string"
      )
        setSelectedParticipantBCorpLocalDeckId(
          storedMatchStartSettings.selectedParticipantBCorpLocalDeckId,
        );
    } else {
      hasStoredMatchStartSettingsRef.current = false;
      setSeed(createMatchSeed());
    }
    setMatchStartSettingsLoaded(true);
    const storedSession = loadStoredSession();
    if (
      matchId &&
      reconnectToken &&
      (reconnectSide === "runner" || reconnectSide === "corp")
    ) {
      setEntryTab("play");
      selectStartTab("join");
      void reconnectSession(
        {
          matchId,
          side: reconnectSide,
          sessionToken:
            reconnectSessionToken ||
            (storedSession?.matchId === matchId &&
            storedSession.side === reconnectSide
              ? storedSession.sessionToken
              : ""),
          reconnectToken,
          webSocketUrl:
            storedSession?.matchId === matchId &&
            storedSession.side === reconnectSide
              ? storedSession.webSocketUrl
              : "",
          displayName: storedDisplayName || "Du",
        },
        "Wiederverbindung konnte nicht geladen werden.",
        recovery,
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
              void reconnectSession(
                storedSession,
                "Session konnte nicht geladen werden.",
              );
              return;
            }
            setNotice("Session konnte nicht geladen werden.");
          })
          .catch(() => {
            if (storedSession.reconnectToken)
              void reconnectSession(
                storedSession,
                "Session konnte nicht geladen werden.",
              );
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
          void reconnectSession(
            storedSession,
            "Session konnte nicht geladen werden.",
          );
        } else setNotice("Session konnte nicht geladen werden.");
      })
      .catch(() => {
        if (storedSession.reconnectToken)
          void reconnectSession(
            storedSession,
            "Session konnte nicht geladen werden.",
          );
        else setNotice("Session konnte nicht geladen werden.");
      });
  }, []);

  useEffect(() => {
    if (!accountSession.account) return;
    setDisplayName(accountSession.account.displayName);
    window.localStorage.setItem(
      DISPLAY_NAME_STORAGE_KEY,
      accountSession.account.displayName,
    );
  }, [accountSession.account]);

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
    if (colorSchemeLoaded)
      window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, colorScheme);
  }, [colorScheme, colorSchemeLoaded]);

  useEffect(() => {
    const stored = readLocalStorage(CARD_DISPLAY_MODE_STORAGE_KEY);
    if (stored !== null) setCardDisplayMode(normalizeCardDisplayMode(stored));
    setCardDisplayModeLoaded(true);
  }, []);

  useEffect(() => {
    if (!cardDisplayModeLoaded) return;
    window.localStorage.setItem(CARD_DISPLAY_MODE_STORAGE_KEY, cardDisplayMode);
  }, [cardDisplayModeLoaded, cardDisplayMode]);

  useEffect(() => {
    const stored = readLocalStorage(CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          preferGermanCardImages?: unknown;
          showSetBadges?: unknown;
        };
        if (typeof parsed.preferGermanCardImages === "boolean")
          setPreferGermanCardImages(parsed.preferGermanCardImages);
        if (typeof parsed.showSetBadges === "boolean")
          setShowSetBadges(parsed.showSetBadges);
      } catch {
        removeLocalStorageKey(CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY);
      }
    }
    setCardImageSkinSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!cardImageSkinSettingsLoaded) return;
    window.localStorage.setItem(
      CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY,
      JSON.stringify({ preferGermanCardImages, showSetBadges }),
    );
  }, [cardImageSkinSettingsLoaded, preferGermanCardImages, showSetBadges]);

  useEffect(() => {
    setChronicleDetailMode(
      normalizeChronicleDetailMode(
        readLocalStorage(CHRONICLE_DETAIL_MODE_STORAGE_KEY),
      ),
    );
    setChronicleDetailModeLoaded(true);
  }, []);

  useEffect(() => {
    if (!chronicleDetailModeLoaded) return;
    window.localStorage.setItem(
      CHRONICLE_DETAIL_MODE_STORAGE_KEY,
      chronicleDetailMode,
    );
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
    if (stored !== null)
      window.localStorage.removeItem(cardPreviewCollapsedStorageKey);
    setCardPreviewCollapsed(false);
  }, [cardPreviewCollapsedStorageKey]);

  useEffect(() => {
    const stored = readLocalStorage(AI_PACING_MODE_STORAGE_KEY);
    if (stored !== null) setLocalAiPacingMode(normalizeAiPacingMode(stored));
    setAiPacingModeLoaded(true);
  }, []);

  useEffect(() => {
    if (!aiPacingModeLoaded) return;
    window.localStorage.setItem(AI_PACING_MODE_STORAGE_KEY, localAiPacingMode);
  }, [aiPacingModeLoaded, localAiPacingMode]);

  useEffect(() => {
    if (accountSession.status === "loading") return;
    let cancelled = false;
    async function loadDeckLibrary() {
      if (accountSession.account) {
        try {
          const data = await loadAccountDecks();
          if (cancelled) return;
          setAccountDeckRecords(data.decks);
          setAccountDeckQuota(data.quota);
          setDeckLibraryStoragePath("NETGRID-Server · persönliche Decks");
          applyLoadedDecks(data.decks.map((record) => record.deck));
        } catch (error) {
          if (!cancelled) {
            setLocalDecks([]);
            setAccountDeckRecords([]);
            setAccountDeckQuota(null);
            setNotice(
              error instanceof Error
                ? error.message
                : "Persönliche Decks konnten nicht geladen werden.",
            );
          }
        } finally {
          if (!cancelled) setLocalDecksLoaded(true);
        }
        return;
      }
      try {
        const response = await fetch("/api/decks/library", {
          cache: "no-store",
        });
        const data = (await response.json()) as DeckLibraryResponse;
        if (!response.ok || data.error)
          throw new Error(data.error?.message ?? "deck_library_load_failed");
        const decks = data.decks ?? [];
        if (cancelled) return;
        setAccountDeckRecords([]);
        setAccountDeckQuota(null);
        setGuestDeckBacking(decks);
        setDeckLibraryStoragePath(data.storagePath ?? "");
        applyLoadedDecks(visibleGuestDecks(decks));
      } catch (error) {
        if (!cancelled) {
          setGuestDeckBacking([]);
          applyLoadedDecks([]);
          setNotice(
            error instanceof Error
              ? error.message
              : "Datei-Deckbibliothek nicht erreichbar.",
          );
        }
      } finally {
        if (!cancelled) setLocalDecksLoaded(true);
      }
    }
    void loadDeckLibrary();
    return () => {
      cancelled = true;
    };
  }, [accountSession.status, accountSession.account?.accountId]);

  const reloadStandardDeckCatalog = useCallback(() => {
    const requestId = standardDeckCatalogRequestIdRef.current + 1;
    standardDeckCatalogRequestIdRef.current = requestId;
    const attempt = standardDeckCatalogAttemptRef.current + 1;
    standardDeckCatalogAttemptRef.current = attempt;
    setStandardDeckCatalogState((current) =>
      beginStandardDeckCatalogLoad(current, attempt),
    );
    void requestStandardDeckCatalog()
      .then((data) => {
        if (standardDeckCatalogRequestIdRef.current !== requestId) return;
        setStandardDecks(data.catalog.decks);
        setDeckSnapshots(data.catalog.snapshots);
        setStandardDeckCatalogState((current) =>
          completeStandardDeckCatalogLoad(current, new Date().toISOString()),
        );
      })
      .catch((error) => {
        if (standardDeckCatalogRequestIdRef.current !== requestId) return;
        const occurredAt = new Date().toISOString();
        setStandardDeckCatalogState((current) =>
          failStandardDeckCatalogLoad(
            current,
            standardDeckCatalogDiagnostic(error, attempt, occurredAt),
          ),
        );
      })
      .finally(() => {
        if (standardDeckCatalogRequestIdRef.current === requestId)
          setStandardDecksLoaded(true);
      });
  }, []);

  useEffect(() => {
    reloadStandardDeckCatalog();
    return () => {
      standardDeckCatalogRequestIdRef.current += 1;
    };
  }, [reloadStandardDeckCatalog]);

  useEffect(() => {
    const firstRunner =
      deckSnapshots.find((snapshot) => snapshot.side === "runner")
        ?.deckSnapshotId ?? "";
    const firstCorp =
      deckSnapshots.find((snapshot) => snapshot.side === "corp")
        ?.deckSnapshotId ?? "";
    if (
      !deckSnapshots.some(
        (snapshot) =>
          snapshot.side === "runner" &&
          snapshot.deckSnapshotId === selectedRunnerSnapshotId,
      )
    )
      setSelectedRunnerSnapshotId(firstRunner);
    if (
      !deckSnapshots.some(
        (snapshot) =>
          snapshot.side === "corp" &&
          snapshot.deckSnapshotId === selectedCorpSnapshotId,
      )
    )
      setSelectedCorpSnapshotId(firstCorp);
    if (
      !deckSnapshots.some(
        (snapshot) =>
          snapshot.side === "runner" &&
          snapshot.deckSnapshotId === selectedParticipantBRunnerSnapshotId,
      )
    )
      setSelectedParticipantBRunnerSnapshotId(firstRunner);
    if (
      !deckSnapshots.some(
        (snapshot) =>
          snapshot.side === "corp" &&
          snapshot.deckSnapshotId === selectedParticipantBCorpSnapshotId,
      )
    )
      setSelectedParticipantBCorpSnapshotId(firstCorp);
  }, [deckSnapshots]);

  useEffect(() => {
    if (!localDecksLoaded) return;
    const fallbackRunnerDeckId =
      localDecks.find((deck) => deck.side === "runner")?.deckId ?? "";
    const fallbackCorpDeckId =
      localDecks.find((deck) => deck.side === "corp")?.deckId ?? "";
    if (
      !localDecks.some(
        (deck) =>
          deck.side === "runner" && deck.deckId === selectedRunnerLocalDeckId,
      )
    )
      setSelectedRunnerLocalDeckId(fallbackRunnerDeckId);
    if (
      !localDecks.some(
        (deck) =>
          deck.side === "corp" && deck.deckId === selectedCorpLocalDeckId,
      )
    )
      setSelectedCorpLocalDeckId(fallbackCorpDeckId);
    if (
      !localDecks.some(
        (deck) =>
          deck.side === "runner" &&
          deck.deckId === selectedParticipantBRunnerLocalDeckId,
      )
    )
      setSelectedParticipantBRunnerLocalDeckId(fallbackRunnerDeckId);
    if (
      !localDecks.some(
        (deck) =>
          deck.side === "corp" &&
          deck.deckId === selectedParticipantBCorpLocalDeckId,
      )
    )
      setSelectedParticipantBCorpLocalDeckId(fallbackCorpDeckId);
  }, [
    localDecks,
    localDecksLoaded,
    selectedRunnerLocalDeckId,
    selectedCorpLocalDeckId,
    selectedParticipantBRunnerLocalDeckId,
    selectedParticipantBCorpLocalDeckId,
  ]);

  useEffect(() => {
    const storedAudio = readLocalStorage(AUDIO_STORAGE_KEY);
    if (storedAudio) {
      try {
        const parsed = JSON.parse(storedAudio) as {
          enabled?: boolean;
          volume?: number;
        };
        setAudioEnabled(Boolean(parsed.enabled));
        if (typeof parsed.volume === "number")
          setAudioVolume(Math.min(1, Math.max(0, parsed.volume)));
      } catch {
        removeLocalStorageKey(AUDIO_STORAGE_KEY);
      }
    }
    setAudioSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!audioSettingsLoaded) return;
    window.localStorage.setItem(
      AUDIO_STORAGE_KEY,
      JSON.stringify({ enabled: audioEnabled, volume: audioVolume }),
    );
  }, [audioSettingsLoaded, audioEnabled, audioVolume]);

  useEffect(() => {
    const stored = readLocalStorage(ACTION_CUE_SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          enabled?: boolean;
          autoDismissMs?: number;
          automaticEffectsEnabled?: boolean;
        };
        if (typeof parsed.enabled === "boolean")
          setActionCuesEnabled(parsed.enabled);
        if (typeof parsed.automaticEffectsEnabled === "boolean")
          setAutomaticEffectCuesEnabled(parsed.automaticEffectsEnabled);
        setActionCueAutoDismissMs(
          normalizeCueAutoDismissMs(parsed.autoDismissMs),
        );
      } catch {
        removeLocalStorageKey(ACTION_CUE_SETTINGS_STORAGE_KEY);
      }
    }
    setActionCueSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!actionCueSettingsLoaded) return;
    window.localStorage.setItem(
      ACTION_CUE_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        enabled: actionCuesEnabled,
        autoDismissMs: actionCueAutoDismissMs,
        automaticEffectsEnabled: automaticEffectCuesEnabled,
      }),
    );
  }, [
    actionCueSettingsLoaded,
    actionCuesEnabled,
    actionCueAutoDismissMs,
    automaticEffectCuesEnabled,
  ]);

  useEffect(() => {
    const stored = readLocalStorage(GAMEPLAY_SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          autoCorpMandatoryDrawEnabled?: unknown;
          autoDiscardEnabled?: unknown;
          autoEndTurnEnabled?: unknown;
          priorityWindowHoldEnabled?: unknown;
          topbarStickyEnabled?: unknown;
          cyberspaceBackgroundEnabled?: unknown;
          resourceStripMode?: unknown;
          actionPanelMode?: unknown;
          aiDecisionDebugOverlayEnabled?: unknown;
          exposedCardHighlightEnabled?: unknown;
        };
        if (typeof parsed.autoCorpMandatoryDrawEnabled === "boolean")
          setAutoCorpMandatoryDrawEnabled(parsed.autoCorpMandatoryDrawEnabled);
        if (typeof parsed.autoEndTurnEnabled === "boolean")
          setAutoEndTurnEnabled(parsed.autoEndTurnEnabled);
        if (typeof parsed.autoDiscardEnabled === "boolean")
          setAutoDiscardEnabled(parsed.autoDiscardEnabled);
        if (typeof parsed.priorityWindowHoldEnabled === "boolean")
          setPriorityWindowHoldEnabled(parsed.priorityWindowHoldEnabled);
        if (typeof parsed.topbarStickyEnabled === "boolean")
          setTopbarStickyEnabled(parsed.topbarStickyEnabled);
        if (typeof parsed.cyberspaceBackgroundEnabled === "boolean")
          setCyberspaceBackgroundEnabled(parsed.cyberspaceBackgroundEnabled);
        if (typeof parsed.aiDecisionDebugOverlayEnabled === "boolean")
          setAiDecisionDebugOverlayEnabled(
            parsed.aiDecisionDebugOverlayEnabled,
          );
        if (typeof parsed.exposedCardHighlightEnabled === "boolean")
          setExposedCardHighlightEnabled(parsed.exposedCardHighlightEnabled);
        setResourceStripMode(
          normalizeResourceStripMode(parsed.resourceStripMode),
        );
        setActionPanelMode(normalizeActionPanelMode(parsed.actionPanelMode));
      } catch {
        removeLocalStorageKey(GAMEPLAY_SETTINGS_STORAGE_KEY);
      }
    }
    setGameplaySettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!gameplaySettingsLoaded) return;
    window.localStorage.setItem(
      GAMEPLAY_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        autoCorpMandatoryDrawEnabled,
        autoDiscardEnabled,
        autoEndTurnEnabled,
        priorityWindowHoldEnabled,
        topbarStickyEnabled,
        cyberspaceBackgroundEnabled,
        resourceStripMode,
        actionPanelMode,
        aiDecisionDebugOverlayEnabled,
        exposedCardHighlightEnabled,
      }),
    );
  }, [
    gameplaySettingsLoaded,
    autoCorpMandatoryDrawEnabled,
    autoDiscardEnabled,
    autoEndTurnEnabled,
    priorityWindowHoldEnabled,
    topbarStickyEnabled,
    cyberspaceBackgroundEnabled,
    resourceStripMode,
    actionPanelMode,
    aiDecisionDebugOverlayEnabled,
    exposedCardHighlightEnabled,
  ]);

  useEffect(() => {
    window.localStorage.setItem(
      ACTION_PANEL_OVERLAY_POSITION_STORAGE_KEY,
      serializeOverlayPositionPreference(actionPanelOverlayPosition),
    );
  }, [actionPanelOverlayPosition]);

  useEffect(() => {
    window.localStorage.setItem(
      AI_DECISION_DEBUG_OVERLAY_POSITION_STORAGE_KEY,
      serializeOverlayPositionPreference(aiDecisionDebugOverlayPosition),
    );
  }, [aiDecisionDebugOverlayPosition]);

  useEffect(() => {
    const stored = readLocalStorage(CARD_TOOLTIP_SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          hoverOpenDelayMs?: unknown;
          mode?: unknown;
        };
        setCardTooltipHoverDelayMs(
          normalizeCardTooltipHoverDelayMs(parsed.hoverOpenDelayMs),
        );
        setCardTooltipMode(normalizeCardTooltipMode(parsed.mode));
      } catch {
        removeLocalStorageKey(CARD_TOOLTIP_SETTINGS_STORAGE_KEY);
      }
    }
    setCardTooltipSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!cardTooltipSettingsLoaded) return;
    window.localStorage.setItem(
      CARD_TOOLTIP_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        hoverOpenDelayMs: cardTooltipHoverDelayMs,
        mode: cardTooltipMode,
      }),
    );
  }, [cardTooltipSettingsLoaded, cardTooltipHoverDelayMs, cardTooltipMode]);

  useEffect(() => {
    setCuePosition(
      parseCuePositionPreference(
        readLocalStorage(ACTION_CUE_POSITION_STORAGE_KEY),
      ),
    );
    setCuePositionLoaded(true);
  }, []);

  useEffect(() => {
    if (!cuePositionLoaded) return;
    window.localStorage.setItem(
      ACTION_CUE_POSITION_STORAGE_KEY,
      serializeCuePositionPreference(cuePosition),
    );
  }, [cuePositionLoaded, cuePosition]);

  useEffect(() => {
    if (
      !matchStartSettingsLoaded ||
      !localDecksLoaded ||
      accountSession.status !== "guest" ||
      previousAccountSessionStatusRef.current === "authenticated"
    )
      return;
    window.localStorage.setItem(
      MATCH_START_SETTINGS_STORAGE_KEY,
      serializeMatchStartSettingsForStorage({
        mode,
        playMode,
        humanSideSelection,
        humanAiSideSelection,
        matchFormat:
          matchFormat === "two_game_side_swap"
            ? "two_game_side_swap"
            : "rules_match",
        seriesGamesPlanned,
        matchCardPool,
        playerClockMode,
        playerClockMinutes,
        playerClockGraceSeconds,
        runnerDifficulty,
        corpDifficulty,
        aiDeckPolicy,
        testSetupMode,
        countdownSeconds,
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
      }),
    );
  }, [
    matchStartSettingsLoaded,
    mode,
    playMode,
    humanSideSelection,
    humanAiSideSelection,
    matchFormat,
    seriesGamesPlanned,
    matchCardPool,
    playerClockMode,
    playerClockMinutes,
    playerClockGraceSeconds,
    runnerDifficulty,
    corpDifficulty,
    aiDeckPolicy,
    testSetupMode,
    countdownSeconds,
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
    localDecksLoaded,
    accountSession.status,
  ]);

  useEffect(() => {
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
    const decisionKey = matchTimerDecisionKey({
      matchId: payload.matchId,
      playerView: activeView,
      legalActions: payload.legalActions,
      winner: payload.winner,
    });
    const now = Date.now();
    setMatchClockNowMs(now);
    setMatchClockAnchor((current) => {
      if (!current || current.matchId !== payload.matchId) {
        return {
          matchId: payload.matchId,
          matchStartedAtMs: now,
          decisionKey,
          decisionStartedAtMs: now,
        };
      }
      if (current.decisionKey !== decisionKey) {
        return {
          ...current,
          decisionKey,
          decisionStartedAtMs: now,
        };
      }
      return current;
    });
  }, [activeView, payload?.legalActions, payload?.matchId, payload?.winner]);

  useEffect(() => {
    if (!payload || !activeView) return;
    setMatchClockNowMs(Date.now());
    const handle = window.setInterval(
      () => setMatchClockNowMs(Date.now()),
      1000,
    );
    return () => window.clearInterval(handle);
  }, [activeView, payload?.matchId]);

  const activeDiscardChoice =
    activeView?.pendingChoice?.source === "discard_phase"
      ? activeView.pendingChoice
      : null;
  const activeDiscardOptionIds = useMemo(
    () =>
      new Set(activeDiscardChoice?.options.map((option) => option.id) ?? []),
    [activeDiscardChoice],
  );
  const currentDiscardChoiceSelection = discardChoiceSelection;
  const selectedDiscardOptionIds =
    currentDiscardChoiceSelection &&
    currentDiscardChoiceSelection.choiceId === activeDiscardChoice?.choiceId
      ? currentDiscardChoiceSelection.selectedOptionIds.filter((optionId) =>
          activeDiscardOptionIds.has(optionId),
        )
      : [];
  const selectedDiscardOptionIdSet = useMemo(
    () => new Set(selectedDiscardOptionIds),
    [selectedDiscardOptionIds.join("|")],
  );
  const activeFieldCardChoice =
    activeView?.pendingChoice &&
    shouldUseFieldCardChoice(activeView.pendingChoice, activeView)
      ? activeView.pendingChoice
      : null;
  const activeFieldCardChoiceOptionIds = useMemo(
    () =>
      new Set(
        activeFieldCardChoice?.options
          .filter((option) => option.selectable !== false)
          .map((option) => option.id) ?? [],
      ),
    [activeFieldCardChoice],
  );
  const currentFieldCardChoiceSelection = fieldCardChoiceSelection;
  const selectedFieldCardChoiceOptionIds =
    currentFieldCardChoiceSelection &&
    currentFieldCardChoiceSelection.choiceId === activeFieldCardChoice?.choiceId
      ? currentFieldCardChoiceSelection.selectedOptionIds.filter((optionId) =>
          activeFieldCardChoiceOptionIds.has(optionId),
        )
      : [];
  const selectedFieldCardChoiceOptionIdSet = useMemo(
    () => new Set(selectedFieldCardChoiceOptionIds),
    [selectedFieldCardChoiceOptionIds.join("|")],
  );
  const activeFieldCardChoiceAction = activeFieldCardChoice
    ? payload?.legalActions.find(
        (action) =>
          action.type === "resolve_choice" &&
          action.payload?.choiceId === activeFieldCardChoice.choiceId,
      )
    : undefined;
  const latestEventId = payload?.eventTail.at(-1)?.eventId;
  const canReconnect = Boolean(session?.reconnectToken);
  const runnerSnapshots = deckSnapshots.filter(
    (snapshot) =>
      snapshot.side === "runner" &&
      snapshot.validation.ok &&
      snapshotAllowedForMatchCardPool(snapshot, matchCardPool),
  );
  const corpSnapshots = deckSnapshots.filter(
    (snapshot) =>
      snapshot.side === "corp" &&
      snapshot.validation.ok &&
      snapshotAllowedForMatchCardPool(snapshot, matchCardPool),
  );
  const matchStartLocalDecks = localDecks.filter((deck) =>
    editableDeckAllowedForMatchCardPool(deck, matchCardPool),
  );
  const defaultCorpSnapshot =
    corpSnapshots.find(
      (snapshot) => snapshot.deckSnapshotId === DEFAULT_CORP_SNAPSHOT_ID,
    ) ??
    corpSnapshots[0] ??
    null;
  const selectedRunnerSnapshot =
    runnerSnapshots.find(
      (snapshot) => snapshot.deckSnapshotId === selectedRunnerSnapshotId,
    ) ??
    runnerSnapshots[0] ??
    null;
  const selectedCorpSnapshot =
    corpSnapshots.find(
      (snapshot) => snapshot.deckSnapshotId === selectedCorpSnapshotId,
    ) ?? defaultCorpSnapshot;
  const selectedParticipantBRunnerSnapshot =
    runnerSnapshots.find(
      (snapshot) =>
        snapshot.deckSnapshotId === selectedParticipantBRunnerSnapshotId,
    ) ??
    runnerSnapshots[0] ??
    null;
  const selectedParticipantBCorpSnapshot =
    corpSnapshots.find(
      (snapshot) =>
        snapshot.deckSnapshotId === selectedParticipantBCorpSnapshotId,
    ) ??
    corpSnapshots[0] ??
    null;
  const runnerLocalDeck =
    matchStartLocalDecks.find(
      (deck) =>
        deck.deckId === selectedRunnerLocalDeckId && deck.side === "runner",
    ) ?? null;
  const corpLocalDeck =
    matchStartLocalDecks.find(
      (deck) => deck.deckId === selectedCorpLocalDeckId && deck.side === "corp",
    ) ?? null;
  const participantBRunnerLocalDeck =
    matchStartLocalDecks.find(
      (deck) =>
        deck.deckId === selectedParticipantBRunnerLocalDeckId &&
        deck.side === "runner",
    ) ?? null;
  const participantBCorpLocalDeck =
    matchStartLocalDecks.find(
      (deck) =>
        deck.deckId === selectedParticipantBCorpLocalDeckId &&
        deck.side === "corp",
    ) ?? null;
  const currentAccountMatchStartPreferences =
    accountMatchStartPreferencesFromUi({
      playMode,
      humanSideSelection,
      humanAiSideSelection,
      matchFormat,
      seriesGamesPlanned,
      matchCardPool,
      runnerDifficulty,
      corpDifficulty,
      aiDeckPolicy,
      countdownSeconds,
      playerClockMode,
      playerClockMinutes,
      playerClockGraceSeconds,
      runnerDeckSource,
      corpDeckSource,
      selectedRunnerSnapshotId,
      selectedCorpSnapshotId,
      selectedRunnerLocalDeckId,
      selectedCorpLocalDeckId,
      runnerSnapshots,
      corpSnapshots,
    });
  const currentAccountMatchStartPreferencesSignature = JSON.stringify(
    currentAccountMatchStartPreferences,
  );
  accountMatchStartPreferencesRef.current = currentAccountMatchStartPreferences;

  function resetAccountMatchStartPreferencesToDefaults() {
    setMode("host");
    setPlayMode("human_vs_human");
    setHumanSideSelection("random");
    setHumanAiSideSelection("random");
    setMatchFormat("rules_match");
    setSeriesGamesPlanned(2);
    setMatchCardPool("originalset");
    setRunnerDifficulty("normal");
    setCorpDifficulty("normal");
    setAiDeckPolicy("selected");
    setCountdownSeconds(3);
    setPlayerClockMode("none");
    setPlayerClockMinutes(10);
    setPlayerClockGraceSeconds(10);
    setRunnerDeckSource("snapshot");
    setCorpDeckSource("snapshot");
    setSelectedRunnerSnapshotId(DEFAULT_RUNNER_SNAPSHOT_ID);
    setSelectedCorpSnapshotId(DEFAULT_CORP_SNAPSHOT_ID);
  }

  function applyAccountMatchStartDeckSelection(
    side: "runner" | "corp",
    cardPool: MatchCardPool,
    selection: AccountMatchStartDeckSelection | undefined,
  ): boolean {
    const fallback = () => {
      const snapshots = deckSnapshots.filter(
        (snapshot) =>
          snapshot.side === side &&
          snapshot.validation.ok &&
          snapshotAllowedForMatchCardPool(snapshot, cardPool),
      );
      const defaultSnapshot =
        snapshots.find((snapshot) =>
          side === "runner"
            ? snapshot.deckSnapshotId === DEFAULT_RUNNER_SNAPSHOT_ID
            : snapshot.deckSnapshotId === DEFAULT_CORP_SNAPSHOT_ID,
        ) ?? snapshots[0];
      if (side === "runner") {
        setRunnerDeckSource("snapshot");
        if (defaultSnapshot)
          setSelectedRunnerSnapshotId(defaultSnapshot.deckSnapshotId);
      } else {
        setCorpDeckSource("snapshot");
        if (defaultSnapshot)
          setSelectedCorpSnapshotId(defaultSnapshot.deckSnapshotId);
      }
      return false;
    };
    if (!selection) return fallback();
    if (selection.kind === "random_standard") {
      if (side === "runner") setRunnerDeckSource("random_standard");
      else setCorpDeckSource("random_standard");
      return true;
    }
    if (selection.kind === "account") {
      const accountDeck = localDecks.find(
        (deck) =>
          deck.deckId === selection.cloudDeckId &&
          deck.side === side &&
          editableDeckAllowedForMatchCardPool(deck, cardPool),
      );
      if (!accountDeck) return fallback();
      if (side === "runner") {
        setRunnerDeckSource("local");
        setSelectedRunnerLocalDeckId(accountDeck.deckId);
      } else {
        setCorpDeckSource("local");
        setSelectedCorpLocalDeckId(accountDeck.deckId);
      }
      return true;
    }
    const standard = deckSnapshots.find(
      (snapshot) =>
        snapshot.sourceDeckId === selection.standardDeckId &&
        snapshot.side === side &&
        snapshot.validation.ok &&
        snapshotAllowedForMatchCardPool(snapshot, cardPool),
    );
    if (!standard) return fallback();
    if (side === "runner") {
      setRunnerDeckSource("snapshot");
      setSelectedRunnerSnapshotId(standard.deckSnapshotId);
    } else {
      setCorpDeckSource("snapshot");
      setSelectedCorpSnapshotId(standard.deckSnapshotId);
    }
    return true;
  }

  function applyAccountMatchStartPreferences(
    preferences: AccountMatchStartPreferences,
  ) {
    setMode("host");
    setPlayMode(preferences.playMode);
    setHumanSideSelection(preferences.humanSideSelection);
    setHumanAiSideSelection(preferences.humanAiSideSelection);
    setMatchFormat(preferences.matchFormat);
    setSeriesGamesPlanned(preferences.seriesGamesPlanned);
    setMatchCardPool(preferences.matchCardPool);
    setRunnerDifficulty(preferences.runnerDifficulty);
    setCorpDifficulty(preferences.corpDifficulty);
    setAiDeckPolicy(preferences.aiDeckPolicy);
    setCountdownSeconds(preferences.countdownSeconds);
    setPlayerClockMode(preferences.playerClockMode);
    setPlayerClockMinutes(preferences.playerClockMinutes);
    setPlayerClockGraceSeconds(preferences.playerClockGraceSeconds);
    const runnerDeckUsable = applyAccountMatchStartDeckSelection(
      "runner",
      preferences.matchCardPool,
      preferences.runnerDeck,
    );
    const corpDeckUsable = applyAccountMatchStartDeckSelection(
      "corp",
      preferences.matchCardPool,
      preferences.corpDeck,
    );
    return { runnerDeckUsable, corpDeckUsable };
  }

  useEffect(() => {
    if (accountSession.status === "loading") return;
    const accountId = accountSession.account?.accountId;
    if (!accountId) {
      accountMatchStartPreferencesBaselineRef.current = null;
      setAccountMatchStartPreferencesLoadedFor(null);
      return;
    }
    if (
      !matchStartSettingsLoaded ||
      !localDecksLoaded ||
      !standardDecksLoaded ||
      accountMatchStartPreferencesLoadedFor === accountId
    )
      return;
    let cancelled = false;
    void loadAccountMatchStartPreferences()
      .then((response) => {
        if (cancelled) return;
        accountMatchStartPreferencesBaselineRef.current = null;
        if (!response.preferences) {
          resetAccountMatchStartPreferencesToDefaults();
        } else {
          const applied = applyAccountMatchStartPreferences(
            response.preferences,
          );
          const invalidSlots = new Set(response.invalidDeckSlots);
          if (!applied.runnerDeckUsable) invalidSlots.add("runner");
          if (!applied.corpDeckUsable) invalidSlots.add("corp");
          if (invalidSlots.size > 0)
            setNotice(
              `Gespeicherte ${[...invalidSlots]
                .map((side) => (side === "runner" ? "Runner-" : "Korp-"))
                .join(
                  "und ",
                )}Deckauswahl ist nicht mehr gültig. Die Standardauswahl wird verwendet.`,
            );
        }
        setAccountMatchStartPreferencesLoadedFor(accountId);
      })
      .catch((error) => {
        if (!cancelled)
          setNotice(
            error instanceof Error
              ? error.message
              : "Account-Vorbelegungen konnten nicht geladen werden.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [
    accountMatchStartPreferencesLoadedFor,
    accountSession.account?.accountId,
    accountSession.status,
    localDecksLoaded,
    matchStartSettingsLoaded,
    standardDecksLoaded,
  ]);

  useEffect(() => {
    const accountId = accountSession.account?.accountId;
    if (
      accountSession.status !== "authenticated" ||
      !accountId ||
      accountMatchStartPreferencesLoadedFor !== accountId
    )
      return;
    if (accountMatchStartPreferencesBaselineRef.current === null) {
      accountMatchStartPreferencesBaselineRef.current =
        currentAccountMatchStartPreferencesSignature;
      return;
    }
    if (
      accountMatchStartPreferencesBaselineRef.current ===
      currentAccountMatchStartPreferencesSignature
    )
      return;
    const timeout = window.setTimeout(() => {
      const preferences = accountMatchStartPreferencesRef.current;
      if (!preferences) return;
      void saveAccountMatchStartPreferences(
        preferences,
        accountSession.csrfToken,
      )
        .then((response) => {
          accountMatchStartPreferencesBaselineRef.current = JSON.stringify(
            response.preferences ?? preferences,
          );
          if (response.invalidDeckSlots.length > 0)
            setNotice(
              "Eine gespeicherte Deckauswahl ist nicht mehr gültig. Die Standardauswahl wird verwendet.",
            );
        })
        .catch((error) => {
          setNotice(
            error instanceof Error
              ? error.message
              : "Account-Vorbelegungen konnten nicht gespeichert werden.",
          );
        });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [
    accountMatchStartPreferencesLoadedFor,
    accountSession.account?.accountId,
    accountSession.csrfToken,
    accountSession.status,
    currentAccountMatchStartPreferencesSignature,
  ]);

  const resetSavedAccountMatchStartPreferences = async () => {
    if (!accountSession.account) return;
    setAccountMatchStartPreferencesResetting(true);
    try {
      await resetAccountMatchStartPreferences(accountSession.csrfToken);
      resetAccountMatchStartPreferencesToDefaults();
      accountMatchStartPreferencesBaselineRef.current = null;
      setNotice("Gespeicherte Account-Vorbelegungen wurden zurückgesetzt.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Account-Vorbelegungen konnten nicht zurückgesetzt werden.",
      );
    } finally {
      setAccountMatchStartPreferencesResetting(false);
    }
  };

  useEffect(() => {
    if (accountSession.status === "loading") return;
    const previous = previousAccountSessionStatusRef.current;
    previousAccountSessionStatusRef.current = accountSession.status;
    if (accountSession.status !== "guest" || previous !== "authenticated")
      return;
    const stored = parseMatchStartSettingsFromStorage(
      readLocalStorage(MATCH_START_SETTINGS_STORAGE_KEY),
    );
    if (!stored) return;
    hasStoredMatchStartSettingsRef.current = true;
    if (stored.mode) setMode(stored.mode);
    if (stored.playMode) setPlayMode(stored.playMode);
    if (stored.humanSideSelection)
      setHumanSideSelection(stored.humanSideSelection);
    if (stored.humanAiSideSelection)
      setHumanAiSideSelection(stored.humanAiSideSelection);
    if (stored.matchFormat) setMatchFormat(stored.matchFormat);
    if (stored.seriesGamesPlanned)
      setSeriesGamesPlanned(stored.seriesGamesPlanned);
    if (stored.matchCardPool) setMatchCardPool(stored.matchCardPool);
    if (stored.runnerDifficulty) setRunnerDifficulty(stored.runnerDifficulty);
    if (stored.corpDifficulty) setCorpDifficulty(stored.corpDifficulty);
    if (stored.aiDeckPolicy) setAiDeckPolicy(stored.aiDeckPolicy);
    if (typeof stored.testSetupMode === "boolean")
      setTestSetupMode(stored.testSetupMode);
    if (stored.countdownSeconds) setCountdownSeconds(stored.countdownSeconds);
    if (stored.playerClockMode) setPlayerClockMode(stored.playerClockMode);
    if (stored.playerClockMinutes)
      setPlayerClockMinutes(stored.playerClockMinutes);
    if (stored.playerClockGraceSeconds !== undefined)
      setPlayerClockGraceSeconds(stored.playerClockGraceSeconds);
    setSeed(createMatchSeed());
    if (stored.runnerDeckSource) setRunnerDeckSource(stored.runnerDeckSource);
    if (stored.corpDeckSource) setCorpDeckSource(stored.corpDeckSource);
    if (stored.participantBRunnerDeckSource)
      setParticipantBRunnerDeckSource(stored.participantBRunnerDeckSource);
    if (stored.participantBCorpDeckSource)
      setParticipantBCorpDeckSource(stored.participantBCorpDeckSource);
    if (typeof stored.selectedRunnerSnapshotId === "string")
      setSelectedRunnerSnapshotId(stored.selectedRunnerSnapshotId);
    if (typeof stored.selectedCorpSnapshotId === "string")
      setSelectedCorpSnapshotId(stored.selectedCorpSnapshotId);
    if (typeof stored.selectedParticipantBRunnerSnapshotId === "string")
      setSelectedParticipantBRunnerSnapshotId(
        stored.selectedParticipantBRunnerSnapshotId,
      );
    if (typeof stored.selectedParticipantBCorpSnapshotId === "string")
      setSelectedParticipantBCorpSnapshotId(
        stored.selectedParticipantBCorpSnapshotId,
      );
    if (typeof stored.selectedRunnerLocalDeckId === "string")
      setSelectedRunnerLocalDeckId(stored.selectedRunnerLocalDeckId);
    if (typeof stored.selectedCorpLocalDeckId === "string")
      setSelectedCorpLocalDeckId(stored.selectedCorpLocalDeckId);
    if (typeof stored.selectedParticipantBRunnerLocalDeckId === "string")
      setSelectedParticipantBRunnerLocalDeckId(
        stored.selectedParticipantBRunnerLocalDeckId,
      );
    if (typeof stored.selectedParticipantBCorpLocalDeckId === "string")
      setSelectedParticipantBCorpLocalDeckId(
        stored.selectedParticipantBCorpLocalDeckId,
      );
  }, [accountSession.status]);
  const randomStandardMetadata = { deckName: "Zufälliges Standard-Deck" };
  const participantARunnerMetadata =
    runnerDeckSource === RANDOM_STANDARD_DECK_SOURCE
      ? randomStandardMetadata
      : runnerDeckSource === "local"
        ? deckMetadataFromEditable(runnerLocalDeck)
        : selectedRunnerSnapshot?.publicMetadata;
  const participantACorpMetadata =
    corpDeckSource === RANDOM_STANDARD_DECK_SOURCE
      ? randomStandardMetadata
      : corpDeckSource === "local"
        ? deckMetadataFromEditable(corpLocalDeck)
        : selectedCorpSnapshot?.publicMetadata;
  const participantBRunnerMetadata =
    participantBRunnerDeckSource === RANDOM_STANDARD_DECK_SOURCE
      ? randomStandardMetadata
      : participantBRunnerDeckSource === "local"
        ? deckMetadataFromEditable(participantBRunnerLocalDeck)
        : selectedParticipantBRunnerSnapshot?.publicMetadata;
  const participantBCorpMetadata =
    participantBCorpDeckSource === RANDOM_STANDARD_DECK_SOURCE
      ? randomStandardMetadata
      : participantBCorpDeckSource === "local"
        ? deckMetadataFromEditable(participantBCorpLocalDeck)
        : selectedParticipantBCorpSnapshot?.publicMetadata;
  const matchStart = deriveMatchStart({
    playMode,
    humanSideSelection,
    humanAiSideSelection,
  });
  const gameMode: GameMode =
    matchStart.technicalMode ??
    (playMode === "human_vs_ai" ? "human_runner_vs_corp_ai" : "human_vs_human");
  const hasAiOpponent = matchStart.hasAiOpponent;
  const isHumanVsHuman = playMode === "human_vs_human";
  const isHumanVsAi = playMode === "human_vs_ai";
  const isAiVsAiMatch = session?.mode === "ai_vs_ai";
  const humanOpponentIsAi = isHumanVsAiMatchMode(session?.mode);
  const effectiveStartMatchFormat = matchFormat;
  const isAiVsAiStartSeries =
    gameMode === "ai_vs_ai" &&
    effectiveStartMatchFormat === "two_game_side_swap";
  const aiTurnPresentation = effectiveAiTurnPresentation(payload);
  const hasPendingAiCue =
    currentActionCue?.source === "ai" ||
    actionCueQueue.some((cue) => cue.source === "ai");
  const aiPacingFallbackDelay = aiPacingFallbackDelayMs(
    localAiPacingMode,
    hasPendingAiCue,
  );
  const resultSummary = payload?.resultSummary ?? null;
  const resultKey = resultSummary
    ? `${payload?.matchId ?? "match"}:${resultSummary.finalStateHash}`
    : null;
  const matchEnded = Boolean(
    payload?.winner ||
    resultSummary ||
    payload?.matchStatus === "finished" ||
    payload?.matchStatus === "forfeited" ||
    payload?.matchStatus === "cancelled",
  );
  const showAiPacingFallbackControls = Boolean(
    aiTurnPresentation?.canAdvanceAi &&
    !matchEnded &&
    (isAiVsAiMatch ||
      (aiPacingFallbackDelay !== null &&
        (aiPacingFallbackDelay === 0 || aiPacingFallbackVisible))),
  );
  const startSummary = matchStartSummary({
    playMode,
    matchFormat:
      effectiveStartMatchFormat === "two_game_side_swap"
        ? "two_game_side_swap"
        : "rules_match",
    seriesGamesPlanned,
    matchCardPool,
    humanSideSelection,
    humanAiSideSelection,
    aiDeckPolicy,
    testSetupMode,
  }).concat(
    gameMode !== "ai_vs_ai" && playerClockMode === "player_clock"
      ? [
          `Spielerzeit ${playerClockMinutes} Min · ${playerClockGraceSeconds} s Kulanz`,
        ]
      : ["Ohne Spielerzeit"],
  );
  const playerClockDetailControlsDisabled = matchStartSettingsLoaded
    ? playerClockMode === "none"
    : false;
  const aiSlotDisabled = hasAiOpponent && aiDeckPolicy !== "selected";
  const aiDeckPolicyUsesPrimaryDeckSlots =
    aiDeckPolicy === "selected" || aiDeckPolicy === "same_as_participant_a";
  const standardDeckCatalogBlocksStart = standardDeckCatalogBlocksSources(
    standardDeckCatalogState,
    [
      runnerDeckSource,
      corpDeckSource,
      ...((isHumanVsHuman && testSetupMode) ||
      ((isHumanVsAi || isAiVsAiStartSeries) && aiDeckPolicy === "selected")
        ? [participantBRunnerDeckSource, participantBCorpDeckSource]
        : []),
    ],
  );
  const openLanJoinableIds = new Set(
    openLanMatches
      .filter((entry) => entry.status === "open")
      .map((entry) => entry.matchId),
  );
  const joinMatchIdTrimmed = joinMatchId.trim();
  const joinTokenTrimmed = joinToken.trim();
  const canJoinViaOpenLan =
    joinMatchIdTrimmed.length > 0 &&
    joinTokenTrimmed.length === 0 &&
    openLanJoinableIds.has(joinMatchIdTrimmed);
  const canSubmitJoin =
    joinMatchIdTrimmed.length > 0 &&
    (joinTokenTrimmed.length > 0 || canJoinViaOpenLan);
  const visibleDeckMetadataEntries =
    gameMode === "ai_vs_ai"
      ? aiDeckPolicyUsesPrimaryDeckSlots
        ? [
            {
              label: isAiVsAiStartSeries ? "KI A · Runner" : "Runner-KI",
              metadata: participantARunnerMetadata,
            },
            {
              label: isAiVsAiStartSeries ? "KI A · Korp" : "Korp-KI",
              metadata: participantACorpMetadata,
            },
            ...(isAiVsAiStartSeries && aiDeckPolicy === "selected"
              ? [
                  {
                    label: "KI B · Runner",
                    metadata: participantBRunnerMetadata,
                  },
                  { label: "KI B · Korp", metadata: participantBCorpMetadata },
                ]
              : []),
          ]
        : []
      : [
          { label: "Dein Runner-Deck", metadata: participantARunnerMetadata },
          { label: "Dein Korp-Deck", metadata: participantACorpMetadata },
          ...(aiSlotDisabled || (isHumanVsHuman && !testSetupMode)
            ? []
            : [
                {
                  label: hasAiOpponent ? "KI Runner" : "B Runner",
                  metadata: participantBRunnerMetadata,
                },
                {
                  label: hasAiOpponent ? "KI Korp" : "B Korp",
                  metadata: participantBCorpMetadata,
                },
              ]),
        ];
  const selectedLocalDeck =
    localDecks.find((deck) => deck.deckId === selectedLocalDeckId) ?? null;
  const selectedDeck = selectedLocalDeck;
  const selectedDeckDirty = selectedLocalDeck
    ? savedDeckFingerprints[selectedLocalDeck.deckId] !==
      deckFingerprint(selectedLocalDeck)
    : false;
  const playableCatalogCards = useMemo(
    () =>
      allCatalogCards.filter((card) =>
        catalogCardAllowedForDeckEditor(card, selectedDeck),
      ),
    [allCatalogCards, selectedDeck?.formatProfileId, selectedDeck?.side],
  );
  const gripPreviewCard =
    activeView?.own.gripOrHq.find((card) => card.known) ?? null;
  const rigPreviewCard =
    activeView?.own.rig?.find((card) => card.known) ?? null;
  const currentFocusedCard =
    focusedCard?.matchId === payload?.matchId ? focusedCard : null;
  const previewSelection =
    currentFocusedCard ??
    (activeView?.run?.approachedIce
      ? { card: activeView.run.approachedIce, hiddenSide: "corp" as const }
      : null) ??
    (activeView?.run?.encounteredIce
      ? { card: activeView.run.encounteredIce, hiddenSide: "corp" as const }
      : null) ??
    (gripPreviewCard ? { card: gripPreviewCard } : null) ??
    (rigPreviewCard ? { card: rigPreviewCard } : null);
  const previewCard = previewSelection?.card ?? null;
  const previewHiddenSide = previewSelection?.hiddenSide;
  const enrichCard = (card: VisibleCard) =>
    enrichVisibleCard(card, catalogDetailsById);
  const enrichedPreviewCard = previewCard ? enrichCard(previewCard) : null;
  const focusCard = (card: DisplayVisibleCard, hiddenSide?: Side) => {
    if (!payload?.matchId) return;
    setFocusedCard({
      card,
      matchId: payload.matchId,
      ...(hiddenSide ? { hiddenSide } : {}),
    });
  };
  const selectActionCard = (card: DisplayVisibleCard, hiddenSide?: Side) => {
    focusCard(card, hiddenSide);
    if (card.known) {
      setSelectedActionContext((current) =>
        current?.kind === "card" && current.id === card.instanceId
          ? null
          : { kind: "card", id: card.instanceId, label: card.title ?? "Karte" },
      );
    }
  };
  const discardOptionForCard = (
    card: VisibleCard,
  ): VisibleChoiceOption | null => {
    if (!activeDiscardChoice) return null;
    return (
      activeDiscardChoice.options.find(
        (option) => option.value === card.instanceId,
      ) ?? null
    );
  };
  const fieldChoiceOptionsForCard = (
    card: VisibleCard,
  ): VisibleChoiceOption[] => {
    return activeFieldCardChoice && activeView
      ? fieldCardChoiceOptionsForCard(activeFieldCardChoice, activeView, card)
      : [];
  };
  const toggleDiscardOption = (optionId: string) => {
    if (!activeDiscardChoice) return;
    const required = activeDiscardChoice.maxSelections;
    setDiscardChoiceSelection((current) => {
      const currentSelected =
        current?.choiceId === activeDiscardChoice.choiceId
          ? current.selectedOptionIds.filter((id) =>
              activeDiscardOptionIds.has(id),
            )
          : [];
      const nextSelected = currentSelected.includes(optionId)
        ? currentSelected.filter((id) => id !== optionId)
        : currentSelected.length >= required
          ? currentSelected
          : [...currentSelected, optionId];
      return {
        choiceId: activeDiscardChoice.choiceId,
        selectedOptionIds: nextSelected,
      };
    });
  };
  const toggleFieldCardChoiceCardOptions = (optionIds: string[]) => {
    if (!activeFieldCardChoice || optionIds.length === 0) return;
    const minSelections = Math.max(
      0,
      Math.floor(activeFieldCardChoice.minSelections),
    );
    const maxSelections = Math.max(
      minSelections,
      Math.floor(activeFieldCardChoice.maxSelections),
    );
    setFieldCardChoiceSelection((current) => {
      const currentSelected =
        current?.choiceId === activeFieldCardChoice.choiceId
          ? current.selectedOptionIds.filter((id) =>
              activeFieldCardChoiceOptionIds.has(id),
            )
          : [];
      const selectedForCard = optionIds.filter((id) =>
        currentSelected.includes(id),
      );
      const allCardOptionsSelected =
        selectedForCard.length === optionIds.length;
      if (allCardOptionsSelected) {
        return {
          choiceId: activeFieldCardChoice.choiceId,
          selectedOptionIds: currentSelected.filter(
            (id) => !optionIds.includes(id),
          ),
        };
      }
      const nextOptionId = optionIds.find(
        (id) => !currentSelected.includes(id),
      );
      if (!nextOptionId || currentSelected.length >= maxSelections) {
        if (nextOptionId && maxSelections === 1) {
          return {
            choiceId: activeFieldCardChoice.choiceId,
            selectedOptionIds: [nextOptionId],
          };
        }
        return {
          choiceId: activeFieldCardChoice.choiceId,
          selectedOptionIds: currentSelected,
        };
      }
      return {
        choiceId: activeFieldCardChoice.choiceId,
        selectedOptionIds: [...currentSelected, nextOptionId],
      };
    });
  };
  const clearFieldCardChoiceSelection = () => {
    if (!activeFieldCardChoice) return;
    setFieldCardChoiceSelection({
      choiceId: activeFieldCardChoice.choiceId,
      selectedOptionIds: [],
    });
  };
  const fieldChoiceCardProps = (card: VisibleCard): FieldChoiceCardProps => {
    const options = fieldChoiceOptionsForCard(card);
    const option = options[0] ?? null;
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
    const optionIds = options.map((candidate) => candidate.id);
    const selectedCount = optionIds.filter((optionId) =>
      selectedFieldCardChoiceOptionIdSet.has(optionId),
    ).length;
    const selected = selectedCount > 0;
    const multiOptionCard = optionIds.length > 1;
    return {
      choiceSelected: selected,
      choiceShortcut: {
        selected,
        disabled: Boolean(payload?.winner) || connection !== "online",
        onToggle: () => toggleFieldCardChoiceCardOptions(optionIds),
        label: multiOptionCard
          ? `Für Auswahl markieren (${selectedCount}/${optionIds.length})`
          : "Für Auswahl markieren",
        selectedLabel: multiOptionCard
          ? `${selectedCount}/${optionIds.length} ausgewählt`
          : "Aus Auswahl entfernen",
      },
      onSelect: () => toggleFieldCardChoiceCardOptions(optionIds),
    };
  };
  const successfulRunOutcome = payload
    ? latestSuccessfulRunOutcomePresentation(
        payload.eventTail,
        dismissedSuccessfulRunOutcomeEventId,
      )
    : null;
  const showSuccessfulRunOutcome = Boolean(successfulRunOutcome && !matchEnded);
  const successfulRunOutcomeCard = successfulRunOutcome
    ? (catalogDetailsById[successfulRunOutcome.sourceDefinitionId] ?? null)
    : null;
  const latestAccessRevealEvent = payload
    ? latestRetainableAccessRevealEvent(payload.eventTail)
    : null;
  const lastDismissedAccessEventId = dismissedAccessEventIds.at(-1) ?? null;
  const retainedAccessReveal = payload
    ? retainedAccessRevealEvent(payload.eventTail, lastDismissedAccessEventId)
    : null;
  const queuedAccessRevealEvent =
    (pendingAccessContinuationRef.current &&
    latestAccessRevealEvent?.eventId !==
      pendingAccessContinuationRef.current.accessEventId
      ? latestAccessRevealEvent
      : null) ??
    pendingAccessPresentationEvents.find(
      (event) => !dismissedAccessEventIds.includes(event.eventId),
    ) ??
    null;
  const accessRevealEvent = queuedAccessRevealEvent ?? retainedAccessReveal;
  const accessRevealUsesCurrentState = Boolean(
    accessRevealEvent &&
    latestAccessRevealEvent?.eventId === accessRevealEvent.eventId,
  );
  const hqAgendaRevealEvent = payload
    ? retainedHqAgendaRevealEvent(payload.eventTail, dismissedAccessEventIds)
    : null;
  const hqAgendaReveal = payload
    ? hqAgendaRevealFromLatestEvent(
        hqAgendaRevealEvent ?? undefined,
        catalogDetailsById,
        payload.side,
      )
    : null;
  const archivesRevealEvent = payload
    ? retainedArchivesRevealEvent(payload.eventTail, dismissedAccessEventIds)
    : null;
  const archivesReveal = payload
    ? archivesRevealFromLatestEvent(
        archivesRevealEvent ?? undefined,
        catalogDetailsById,
        payload.side,
      )
    : null;
  const gypsyReveal = payload
    ? gypsyScheduleAnalyzerRevealFromPendingChoice(
        payload.playerView,
        catalogDetailsById,
        payload.legalActions,
        payload.side,
        payload.eventTail,
      )
    : null;
  const securityPurgeInstallChoiceActive =
    payload?.playerView.pendingChoice?.source.startsWith(
      "card_implementation.agenda_purge_install_targets:",
    ) === true;
  const securityPurgeRevealEvent = payload
    ? retainedSecurityPurgeRevealEvent(
        payload.eventTail,
        dismissedAccessEventIds,
        {
          suppressTargetChoiceOpened: securityPurgeInstallChoiceActive,
        },
      )
    : null;
  const securityPurgeReveal = payload
    ? securityPurgeRevealFromLatestEvent(
        securityPurgeRevealEvent ?? undefined,
        catalogDetailsById,
        payload.side,
      )
    : null;
  const currentAccessReveal =
    payload && accessRevealUsesCurrentState
      ? accessRevealFromCurrentRun(
          payload.playerView,
          catalogDetailsById,
          payload.legalActions,
          payload.side,
          payload.eventTail,
          accessRevealEvent,
        )
      : null;
  const retainedEventAccessReveal = payload
    ? accessRevealFromLatestEvent(
        accessRevealEvent ?? undefined,
        catalogDetailsById,
        accessRevealUsesCurrentState && !matchEnded ? payload.legalActions : [],
        payload.side,
        payload.eventTail,
      )
    : null;
  const accessReveal =
    gypsyReveal ??
    hqAgendaReveal ??
    archivesReveal ??
    securityPurgeReveal ??
    currentAccessReveal ??
    retainedEventAccessReveal;
  const overlayPresentation = matchOverlayPresentation({
    accessRevealAvailable: Boolean(accessReveal),
    accessRevealDismissed: Boolean(
      accessReveal && dismissedAccessEventIds.includes(accessReveal.eventId),
    ),
    accessRevealKind: accessReveal?.kind ?? null,
    accessOutcomeKind: accessReveal?.outcomeKind ?? null,
    matchEnded,
    damagePresentationPending:
      Boolean(currentDamageImpact) || damageImpactQueue.length > 0,
    resultAvailable: Boolean(resultSummary && resultKey),
    resultDismissed: Boolean(resultKey && dismissedResultKey === resultKey),
    runnerWonByAgendaPoints:
      resultSummary?.winner === "runner" &&
      resultSummary.reason === "agenda_points",
  });
  const showAccessReveal = overlayPresentation.showAccessReveal;
  const dismissAccessPresentation = useCallback((eventId: string) => {
    setPendingAccessPresentationEvents((events) =>
      dismissPendingAccessPresentationEvent(events, eventId),
    );
    setDismissedAccessEventIds((eventIds) =>
      eventIds.includes(eventId) ? eventIds : [...eventIds, eventId].slice(-30),
    );
    setCurrentDamageImpact((current) =>
      current?.eventId === eventId ? null : current,
    );
  }, []);
  const accessDamageImpact =
    currentDamageImpact &&
    accessReveal?.kind === "access" &&
    currentDamageImpact.eventId === accessReveal.eventId
      ? currentDamageImpact
      : null;
  const standaloneDamageImpact = accessDamageImpact
    ? null
    : currentDamageImpact;
  const accessOutcomeAwaitingConfirmation = Boolean(
    showAccessReveal &&
    accessReveal?.kind === "access" &&
    accessReveal.outcomeStatus,
  );
  const interactionPresentationBlocked = interactionPresentationBlocksAi({
    damageOpen: Boolean(currentDamageImpact),
    accessOutcomeOpen: accessOutcomeAwaitingConfirmation,
    successfulRunOutcomeOpen: showSuccessfulRunOutcome,
  });
  const exposeReviewEvent = payload
    ? retainedExposeReviewEvent(payload.eventTail, dismissedExposeReviewEventId)
    : null;
  const exposeReview = payload
    ? exposeReviewFromLatestEvent(
        exposeReviewEvent ?? undefined,
        catalogDetailsById,
        payload.side,
      )
    : null;
  const viewedApproachIceId = approachIceExposeViewingIceId(
    payload?.legalActions ?? [],
  );
  const viewedInstalledExposeCardId = installedCorpExposeReviewCardId(
    activeView?.pendingChoice,
  );
  const showExposeReview = Boolean(
    exposeReview &&
    !matchEnded &&
    dismissedExposeReviewEventId !== exposeReview.eventId &&
    !showAccessReveal &&
    !showSuccessfulRunOutcome &&
    !viewedApproachIceId &&
    !viewedInstalledExposeCardId,
  );
  const showResultModal = overlayPresentation.showResultModal;
  const canReturnToStart = Boolean(
    payload &&
    (resultSummary ||
      payload.winner ||
      payload.matchStatus === "finished" ||
      payload.matchStatus === "forfeited" ||
      payload.matchStatus === "cancelled"),
  );
  const canStartNextSeriesGame = Boolean(resultSummary?.series?.nextAvailable);
  const opponentDisplayName =
    payload?.opponentStatus.displayName ??
    lobby?.opponentStatus.displayName ??
    null;
  const canForfeit = Boolean(
    payload &&
    payload.matchStatus === "active" &&
    !payload.winner &&
    !isAiVsAiMatch,
  );
  const canCancelSimulation = Boolean(
    isAiVsAiMatch && payload?.matchStatus === "active" && !payload.winner,
  );
  const matchClockDisplay =
    payload && activeView && matchClockAnchor?.matchId === payload.matchId
      ? {
          matchElapsed: formatMatchTimerDuration(
            matchClockNowMs - matchClockAnchor.matchStartedAtMs,
          ),
          decisionElapsed: formatMatchTimerDuration(
            matchClockNowMs - matchClockAnchor.decisionStartedAtMs,
          ),
          scopeLabel: payload.winner
            ? "Spiel beendet"
            : matchTimerScopeLabel(activeView, payload.legalActions),
          graceLabel: playerClockGraceDisplay(
            payload.playerClock,
            matchClockNowMs,
          ),
        }
      : null;
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
  }, [
    activeMatchIsGame,
    payload?.matchId,
    topbarHeightPx,
    topbarStickyEnabled,
  ]);

  const activeCueHighlight = currentActionCue?.highlight ?? null;
  const hasDecisionCue = Boolean(
    !matchEnded &&
    (currentActionCue?.requiresLocalAttention ||
      activeView?.pendingChoice ||
      (activeView?.activeSide === activeView?.side &&
        payload?.legalActions.length)),
  );
  const legalActionSplit = useMemo(
    () => splitLegalActions(payload?.legalActions ?? []),
    [payload?.legalActions],
  );
  const runActions = useMemo(
    () =>
      activeView
        ? runWindowActions(activeView, payload?.legalActions ?? [])
        : [],
    [activeView, payload?.legalActions],
  );
  const selectedPanelContext =
    selectedActionContext?.kind === "server" ? selectedActionContext : null;
  const selectedPanelContextActions = selectedPanelContext
    ? legalActionSplit.contextualActions.filter((action) =>
        actionMatchesContext(action, selectedPanelContext),
      )
    : [];
  const runActionIds = new Set(runActions.map((action) => action.actionId));
  const floatingPanelPrimaryActions = activeView?.run
    ? legalActionSplit.primaryActions.filter(
        (action) => !runActionIds.has(action.actionId),
      )
    : legalActionSplit.primaryActions;
  const floatingPanelContextualActions = activeView?.run
    ? selectedPanelContextActions.filter(
        (action) => !runActionIds.has(action.actionId),
      )
    : selectedPanelContextActions;
  const floatingPanelNeededDuringRun = Boolean(
    activeView?.run &&
    (activeView.pendingChoice ||
      floatingPanelPrimaryActions.length > 0 ||
      floatingPanelContextualActions.length > 0),
  );
  const showFloatingActionPanel = Boolean(
    activeMatchIsGame &&
    !matchEnded &&
    activeView &&
    actionPanelMode === "floating" &&
    (!activeView.run || floatingPanelNeededDuringRun),
  );
  const aiDecisionDebugMatchId =
    activeMatchIsGame && session && payload ? session.matchId : "";
  const showAiDecisionDebugOverlay = Boolean(
    activeMatchIsGame && aiDecisionDebugOverlayEnabled && session,
  );
  const canRequestHumanAiDecisionPreview = humanAiDecisionProbeAvailable(
    session,
    payload,
  );
  const humanAiAdvice = aiDecisionDebugPreview
    ? humanAiAdviceSentence(aiDecisionDebugPreview)
    : null;
  const aiDecisionDebugPreviewStateKey =
    session && payload
      ? `${session.matchId}:${session.side}:${payload.matchVersion}:${payload.playerView.stateVersion}`
      : "";
  const aiDecisionDebugPreparationKey =
    aiDecisionDebugOverlayEnabled &&
    session &&
    payload &&
    aiTurnPresentation?.canAdvanceAi
      ? `${session.matchId}:${payload.matchVersion}:${payload.playerView.stateVersion}`
      : "";
  const aiDecisionDebugPreparationReady = Boolean(
    session &&
    payload &&
    preparedAiDecisionDebugMatchesState(preparedAiDecisionDebug, {
      matchId: session.matchId,
      matchVersion: payload.matchVersion,
      stateVersion: payload.playerView.stateVersion,
    }),
  );
  const aiDecisionDebugShouldWaitForPreparation = Boolean(
    aiDecisionDebugPreparationKey &&
    aiDecisionDebugFailedPreparationKey !== aiDecisionDebugPreparationKey &&
    !aiDecisionDebugPreparationReady,
  );
  const aiDecisionDebugTrace = useMemo(
    () =>
      preparedAiDecisionDebug
        ? preparedAiDecisionDebugTrace(preparedAiDecisionDebug)
        : null,
    [preparedAiDecisionDebug],
  );
  const floatingPanelHasHiddenContextActions = Boolean(
    !activeView?.run &&
    legalActionSplit.contextualActions.length > 0 &&
    selectedActionContext?.kind !== "card",
  );
  const cardActionsFor = (card: VisibleCard): LegalAction[] => {
    if (!card.known) return [];
    return orderedCardContextActions(
      legalActionSplit.contextualActions.filter((action) =>
        actionMatchesContext(action, {
          kind: "card",
          id: card.instanceId,
          label: card.title ?? "Karte",
        }),
      ),
    );
  };
  const togglePaymentSupportAbility = (
    card: VisibleCard,
    ability: VisibleRunnerPaymentSupportAbility,
  ) => {
    if (!payload || !activeView || activeView.side !== "runner") return;
    if (
      hiddenResourcePaymentPreselectionEquals(
        paymentSupportPreselection,
        card.instanceId,
        ability.abilityIndex,
      )
    ) {
      setPaymentSupportPreselection(null);
      paymentSupportSubmittedKeyRef.current = null;
      setNotice(`${ability.label}: Vormerkung aufgehoben.`);
      return;
    }
    const next = createHiddenResourcePaymentPreselection({
      matchId: payload.matchId,
      view: activeView,
      card,
      ability,
    });
    if (!next) return;
    setPaymentSupportPreselection(next);
    paymentSupportSubmittedKeyRef.current = null;
    setNotice(
      `${ability.label} ist für die nächste passende Zahlung vorgemerkt.`,
    );
  };
  const runActionForServer = (serverId: string): LegalAction | null => {
    const serverContext = {
      kind: "server" as const,
      id: serverId,
      label: serverDisplayLabel(serverId),
    };
    const runActions = legalActionSplit.contextualActions.filter(
      (action) =>
        action.type === "start_run" &&
        actionMatchesContext(action, serverContext),
    );
    return runActions.length === 1 ? runActions[0]! : null;
  };
  const activeRunTargetIds = activeView ? runTargetServerIds(activeView) : [];
  const activeRunIceId = activeView ? activeRunIceInstanceId(activeView) : null;
  const hiddenContextHint = activeView
    ? runHiddenContextActionHint(activeView, legalActionSplit.contextualActions)
    : null;
  const ownRigGroups = activeView
    ? groupRunnerRigCards(activeView.own.rig ?? [], {
        includeEmptyProgramGroup: Boolean(
          runnerRigMemorySummary(activeView, "own"),
        ),
      })
    : [];
  const scoreAreaCardsBySide = (side: Side): VisibleCard[] => {
    if (!activeView) return [];
    return side === activeView.side
      ? activeView.own.scoreArea
      : activeView.opponent.scoreArea;
  };
  const agendaPointsBySide = (side: Side): number => {
    if (!activeView) return 0;
    return side === activeView.side
      ? activeView.own.agendaPoints
      : activeView.opponent.agendaPoints;
  };
  const toggleScoreAreaOverlay = (side: Side) => {
    setScoreAreaOverlays((value) => ({ ...value, [side]: !value[side] }));
  };
  const effectiveAgendaTarget = activeView?.agendaPointsToWin ?? 7;
  const resourceStripVisible =
    resourceStripMode === "on" ||
    (resourceStripMode === "auto" && !statusPanelsVisible);
  const activeMatchClassName = [
    "app",
    "activeMatch",
    topbarStickyEnabled ? "" : "topbarStickyDisabled",
    cyberspaceBackgroundEnabled ? "cyberspaceBackgroundEnabled" : "",
    actionPanelMode === "floating" ? "actionPanelFloatingMode" : "",
    `resourceStrip-${resourceStripMode}`,
    resourceStripVisible ? "resourceStripVisible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!aiDecisionDebugOverlayEnabled || !aiDecisionDebugMatchId) {
      setAiDecisionDebugStatus("off");
      setAiDecisionDebugError("");
      setPreparedAiDecisionDebug(null);
      setAiDecisionDebugTurnPlanTrace(null);
      return;
    }
    setAiDecisionDebugTurnPlanTrace(null);
    setAiDecisionDebugStatus("waiting");
    setAiDecisionDebugError("");
  }, [aiDecisionDebugOverlayEnabled, aiDecisionDebugMatchId]);

  useEffect(() => {
    if (!aiDecisionDebugPreparationKey || !session || !payload) {
      setPreparedAiDecisionDebug(null);
      setAiDecisionDebugFailedPreparationKey("");
      return;
    }
    let current = true;
    setAiDecisionDebugStatus("activating");
    setAiDecisionDebugError("");
    setAiDecisionDebugFailedPreparationKey("");
    void fetchPreparedAiDecisionDebug(session, payload)
      .then((prepared) => {
        if (!current) return;
        setPreparedAiDecisionDebug(prepared);
        setAiDecisionDebugTurnPlanTrace((retained) =>
          retainPreparedAiDecisionDebugTurnPlanTrace(retained, prepared),
        );
        setAiDecisionDebugFailedPreparationKey("");
        setAiDecisionDebugStatus("live");
      })
      .catch((error) => {
        if (!current) return;
        setPreparedAiDecisionDebug(null);
        setAiDecisionDebugFailedPreparationKey(aiDecisionDebugPreparationKey);
        setAiDecisionDebugStatus("error");
        setAiDecisionDebugError(
          error instanceof Error
            ? error.message
            : "Die nächste KI-Entscheidung konnte nicht vorbereitet werden.",
        );
      });
    return () => {
      current = false;
    };
  }, [aiDecisionDebugPreparationKey, payload, session]);

  useEffect(() => {
    aiDecisionDebugPreviewRequestKeyRef.current = null;
    setAiDecisionDebugPreview(null);
    setAiDecisionDebugPreviewError("");
    setAiDecisionDebugPreviewLoading(false);
    const previewContext = aiDecisionDebugPreviewContextRef.current;
    if (previewContext) {
      setSelectedActionContext((current) =>
        current?.kind === previewContext.kind &&
        current.id === previewContext.id
          ? null
          : current,
      );
      aiDecisionDebugPreviewContextRef.current = null;
    }
  }, [aiDecisionDebugPreviewStateKey]);

  const requestHumanAiDecisionPreview = useCallback(async () => {
    if (
      !canRequestHumanAiDecisionPreview ||
      !session ||
      !payload ||
      !aiDecisionDebugPreviewStateKey
    )
      return;
    const requestKey = aiDecisionDebugPreviewStateKey;
    aiDecisionDebugPreviewRequestKeyRef.current = requestKey;
    setAiDecisionDebugPreviewLoading(true);
    setAiDecisionDebugPreview(null);
    setAiDecisionDebugPreviewError("");
    try {
      const preview = await fetchAiDecisionPreview(session, payload);
      if (aiDecisionDebugPreviewRequestKeyRef.current !== requestKey) return;
      const legalAction = payload.legalActions.find(
        (action) => action.actionId === preview.actionId,
      );
      if (
        !humanAiDecisionProbeMatchesPayload(preview, session, payload) ||
        !legalAction
      ) {
        setAiDecisionDebugPreview(null);
        setAiDecisionDebugPreviewError(
          "Der KI-Vorschlag ist für den aktuellen Zustand nicht mehr gültig.",
        );
        return;
      }
      setAiDecisionDebugPreview(preview);
      setAiDecisionDebugPreviewError("");
    } catch (error) {
      if (aiDecisionDebugPreviewRequestKeyRef.current !== requestKey) return;
      setAiDecisionDebugPreview(null);
      setAiDecisionDebugPreviewError(
        error instanceof Error
          ? error.message
          : "KI-Vorschlag konnte nicht geladen werden.",
      );
    } finally {
      if (aiDecisionDebugPreviewRequestKeyRef.current === requestKey)
        setAiDecisionDebugPreviewLoading(false);
    }
  }, [
    aiDecisionDebugPreviewStateKey,
    canRequestHumanAiDecisionPreview,
    payload,
    session,
  ]);

  useEffect(() => {
    if (runnerSnapshots.length === 0) return;
    const firstRunnerSnapshotId = runnerSnapshots[0]?.deckSnapshotId ?? "";
    const runnerSnapshotIds = new Set(
      runnerSnapshots.map((snapshot) => snapshot.deckSnapshotId),
    );
    if (!runnerSnapshotIds.has(selectedRunnerSnapshotId))
      setSelectedRunnerSnapshotId(firstRunnerSnapshotId);
    if (!runnerSnapshotIds.has(selectedParticipantBRunnerSnapshotId))
      setSelectedParticipantBRunnerSnapshotId(firstRunnerSnapshotId);
  }, [
    runnerSnapshots,
    selectedRunnerSnapshotId,
    selectedParticipantBRunnerSnapshotId,
  ]);

  useEffect(() => {
    if (corpSnapshots.length === 0) return;
    const firstCorpSnapshotId = corpSnapshots[0]?.deckSnapshotId ?? "";
    const corpSnapshotIds = new Set(
      corpSnapshots.map((snapshot) => snapshot.deckSnapshotId),
    );
    if (!corpSnapshotIds.has(selectedCorpSnapshotId))
      setSelectedCorpSnapshotId(firstCorpSnapshotId);
    if (!corpSnapshotIds.has(selectedParticipantBCorpSnapshotId))
      setSelectedParticipantBCorpSnapshotId(firstCorpSnapshotId);
  }, [
    corpSnapshots,
    selectedCorpSnapshotId,
    selectedParticipantBCorpSnapshotId,
  ]);

  useEffect(() => {
    if (!selectedActionContext) return;
    if (
      !activeView ||
      payload?.winner ||
      !actionContextStillVisible(selectedActionContext, activeView)
    )
      setSelectedActionContext(null);
  }, [activeView, payload?.winner, selectedActionContext]);

  useEffect(() => {
    if (!matchEnded) return;
    setSelectedActionContext(null);
    setFocusedCard(null);
    setScoreAreaOverlays((current) =>
      current.runner || current.corp ? { runner: false, corp: false } : current,
    );
    setActionCueQueue([]);
    setCurrentActionCue(null);
    setDamageImpactQueue([]);
    setCurrentDamageImpact(null);
  }, [matchEnded, resultKey]);

  useEffect(() => {
    if (selectedActionContext?.kind !== "card") return;
    const closeCardActionMenu = (event: PointerEvent) => {
      if (isCardActionSurfaceTarget(event.target)) return;
      setSelectedActionContext(null);
    };
    window.addEventListener("pointerdown", closeCardActionMenu, {
      capture: true,
    });
    return () =>
      window.removeEventListener("pointerdown", closeCardActionMenu, {
        capture: true,
      });
  }, [selectedActionContext]);

  useEffect(() => {
    if (!activeDiscardChoice) {
      setDiscardChoiceSelection(null);
      autoDiscardSubmittedKeyRef.current = null;
      return;
    }
    setDiscardChoiceSelection((current) => {
      if (!current || current.choiceId !== activeDiscardChoice.choiceId)
        return {
          choiceId: activeDiscardChoice.choiceId,
          selectedOptionIds: [],
        };
      const nextSelected = current.selectedOptionIds.filter((optionId) =>
        activeDiscardOptionIds.has(optionId),
      );
      return nextSelected.length === current.selectedOptionIds.length
        ? current
        : {
            choiceId: activeDiscardChoice.choiceId,
            selectedOptionIds: nextSelected,
          };
    });
  }, [activeDiscardChoice?.choiceId, activeDiscardOptionIds]);

  useEffect(() => {
    if (!activeFieldCardChoice) {
      setFieldCardChoiceSelection(null);
      return;
    }
    setFieldCardChoiceSelection((current) => {
      if (!current || current.choiceId !== activeFieldCardChoice.choiceId)
        return {
          choiceId: activeFieldCardChoice.choiceId,
          selectedOptionIds: [],
        };
      const nextSelected = current.selectedOptionIds.filter((optionId) =>
        activeFieldCardChoiceOptionIds.has(optionId),
      );
      return nextSelected.length === current.selectedOptionIds.length
        ? current
        : {
            choiceId: activeFieldCardChoice.choiceId,
            selectedOptionIds: nextSelected,
          };
    });
  }, [activeFieldCardChoice?.choiceId, activeFieldCardChoiceOptionIds]);

  useEffect(() => {
    if (!payload || !activeView) return;
    const ownSide = activeView.side;
    const opponent = opponentSide(ownSide);
    const turnKey = {
      matchId: payload.matchId,
      activeSide: activeView.activeSide,
    };
    const previousTurnKey = lastActionSlotTurnRef.current;
    const resetActiveSide =
      !previousTurnKey ||
      previousTurnKey.matchId !== turnKey.matchId ||
      previousTurnKey.activeSide !== turnKey.activeSide;
    lastActionSlotTurnRef.current = turnKey;

    setActionSlotCapacities((current) => {
      const next = { ...current };
      updateActionSlotCapacity(
        next,
        ownSide,
        activeView.own.clicks,
        activeView.activeSide === ownSide,
        resetActiveSide,
        activeView.publicEvents,
      );
      updateActionSlotCapacity(
        next,
        opponent,
        activeView.opponent.clicks,
        activeView.activeSide === opponent,
        resetActiveSide,
        activeView.publicEvents,
      );
      return next.runner === current.runner && next.corp === current.corp
        ? current
        : next;
    });
  }, [
    activeView?.activeSide,
    activeView?.own.clicks,
    activeView?.opponent.clicks,
    activeView?.side,
    payload?.matchId,
    payload?.playerView.stateVersion,
  ]);

  useEffect(() => {
    if (entryTab !== "decks" || !selectedDeck) return;
    const missingIds = selectedDeck.cards
      .map((entry) => entry.cardId)
      .filter((cardId) => !catalogDetailsById[cardId]);
    void ensureCatalogDetails(missingIds);
  }, [entryTab, selectedDeck, catalogDetailsById, ensureCatalogDetails]);

  useEffect(() => {
    if (entryTab !== "decks" || playableCatalogCards.length === 0) return;
    const missingIds = playableCatalogCards
      .map((card) => card.catalogCardId)
      .filter((cardId) => !catalogDetailsById[cardId]);
    void ensureCatalogDetails(missingIds);
  }, [
    entryTab,
    playableCatalogCards,
    catalogDetailsById,
    ensureCatalogDetails,
  ]);

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
    lastSeenAccessPresentationEventIdRef.current =
      payload?.eventTail.at(-1)?.eventId ?? null;
    setDismissedAccessEventIds([]);
    setPendingAccessPresentationEvents([]);
    pendingAccessContinuationRef.current = null;
    setDismissedSuccessfulRunOutcomeEventId(null);
  }, [payload?.matchId]);

  const clearExposedCardHighlights = useCallback(() => {
    if (exposedCardHighlightTimerRef.current !== null) {
      clearTimeout(exposedCardHighlightTimerRef.current);
      exposedCardHighlightTimerRef.current = null;
    }
    setExposedCardHighlightIds([]);
  }, []);

  useEffect(() => {
    lastSeenExposeHighlightEventIdRef.current =
      payload?.eventTail.at(-1)?.eventId ?? null;
    clearExposedCardHighlights();
  }, [clearExposedCardHighlights, payload?.matchId]);

  useEffect(() => {
    if (exposedCardHighlightEnabled) return;
    clearExposedCardHighlights();
  }, [clearExposedCardHighlights, exposedCardHighlightEnabled]);

  useEffect(
    () => () => {
      if (exposedCardHighlightTimerRef.current !== null)
        clearTimeout(exposedCardHighlightTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!payload) return;
    const latestId = payload.eventTail.at(-1)?.eventId ?? null;
    const lastSeen = lastSeenExposeHighlightEventIdRef.current;
    if (lastSeen === null) {
      lastSeenExposeHighlightEventIdRef.current = latestId;
      return;
    }
    if (latestId === lastSeen) return;
    const exposedCardIds = publicEventsAfter(
      payload.eventTail,
      lastSeen,
    ).flatMap(exposedCardInstanceIdsForEvent);
    lastSeenExposeHighlightEventIdRef.current = latestId;
    if (!exposedCardHighlightEnabled || exposedCardIds.length === 0) return;
    if (exposedCardHighlightTimerRef.current !== null)
      clearTimeout(exposedCardHighlightTimerRef.current);
    setExposedCardHighlightIds((current) => [
      ...new Set([...current, ...exposedCardIds]),
    ]);
    exposedCardHighlightTimerRef.current = setTimeout(() => {
      exposedCardHighlightTimerRef.current = null;
      setExposedCardHighlightIds([]);
    }, 10_000);
  }, [exposedCardHighlightEnabled, payload?.eventTail, payload?.matchId]);

  useEffect(() => {
    if (!payload) return;
    const latestId = payload.eventTail.at(-1)?.eventId ?? null;
    const lastSeen = lastSeenAccessPresentationEventIdRef.current;
    if (lastSeen === null) {
      lastSeenAccessPresentationEventIdRef.current = latestId;
      return;
    }
    if (latestId === lastSeen) return;
    const newEvents = publicEventsAfter(payload.eventTail, lastSeen);
    lastSeenAccessPresentationEventIdRef.current = latestId;
    if (newEvents.length === 0) return;
    setPendingAccessPresentationEvents((current) =>
      appendPendingAccessPresentationEvents(
        current,
        newEvents,
        dismissedAccessEventIds,
      ),
    );
  }, [payload?.matchId, payload?.eventTail, dismissedAccessEventIds]);

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
  }, [
    payload?.pendingUndo?.undoRequestId,
    payload?.pendingUndo?.needsResponse,
  ]);

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
      phase: payload.playerView.phase,
    };
    const cue = turnStartAudioCue(current, lastTurnStartAudioStateRef.current);
    lastTurnStartAudioStateRef.current = current;
    if (
      !audioEnabled ||
      !cue ||
      lastTurnStartAudioCueKeyRef.current === cue.key
    )
      return;
    lastTurnStartAudioCueKeyRef.current = cue.key;
    playActionCueSound(cue.sound, audioVolume);
  }, [
    audioEnabled,
    audioVolume,
    payload?.matchId,
    payload?.playerView.activeSide,
    payload?.playerView.phase,
    payload?.playerView.stateVersion,
  ]);

  useEffect(() => {
    if (!payload) return;
    const latestId = payload.eventTail.at(-1)?.eventId ?? null;
    const lastSeen = lastSeenCueEventIdRef.current;
    if (lastSeen === null) {
      lastSeenCueEventIdRef.current = latestId;
      return;
    }
    const newEvents = publicEventsAfter(payload.eventTail, lastSeen);
    const contextByEventId = chronicleContextByEventId(
      payload.playerView.publicEvents,
      catalogDetailsById,
      { preferGermanCardImages },
    );
    const cues =
      !matchEnded && actionCuesEnabled
        ? deriveOpponentActionCues({
            viewerSide: payload.side,
            playerView: payload.playerView,
            events: payload.eventTail,
            lastPresentedEventId: lastSeen,
            includeAutomaticEffectCues: automaticEffectCuesEnabled,
            contextByEventId,
          })
        : [];
    const damageImpacts = deriveDamageImpactCues({
      viewerSide: payload.side,
      playerView: payload.playerView,
      events: payload.eventTail,
      lastPresentedEventId: lastSeen,
    });
    lastSeenCueEventIdRef.current = latestId;
    if (cues.length > 0) {
      const coalescedCues = coalesceAccessActionCues(
        currentActionCue,
        actionCueQueue,
        cues,
      );
      setCurrentActionCue(coalescedCues.current);
      setActionCueQueue(coalescedCues.queue);
    }
    if (damageImpacts.length > 0)
      setDamageImpactQueue((current) => [...current, ...damageImpacts]);
    if (!audioEnabled || newEvents.length === 0) return;
    const overlayEventIds = new Set(cues.map((cue) => cue.eventId));
    for (const event of newEvents) {
      const damageAudioCue = damageAudioCueFromPublicPayload(
        event.publicPayload,
      );
      if (damageAudioCue) {
        playActionCueSound(
          damageAudioCue.sound,
          audioVolume,
          damageAudioCue.soundCount,
        );
        continue;
      }
      if (overlayEventIds.has(event.eventId)) continue;
      const item = formatChronicleEvent(
        event,
        payload.side,
        contextByEventId[event.eventId] ?? {},
      );
      const actionType = eventActionType(event);
      const actor = sideFromPublicPayload(event.publicPayload.actor);
      if (
        actor === payload.side &&
        locallyPlayedActionSoundKeysRef.current.delete(
          localActionSoundKey(actor, event.stateVersionBefore, actionType),
        )
      )
        continue;
      const sound = actionSoundForActionType(
        actionType,
        item.visibility,
        event.publicPayload,
      );
      if (sound)
        playActionCueSound(
          sound,
          audioVolume,
          actionSoundCountForAction(actionType, event.publicPayload),
        );
    }
  }, [
    actionCuesEnabled,
    automaticEffectCuesEnabled,
    audioEnabled,
    audioVolume,
    actionCueQueue,
    currentActionCue,
    matchEnded,
    payload?.eventTail,
    payload?.playerView.stateVersion,
    payload?.side,
    catalogDetailsById,
    preferGermanCardImages,
  ]);

  useEffect(() => {
    if (!successfulRunOutcome?.sourceDefinitionId) return;
    void ensureCatalogDetails([successfulRunOutcome.sourceDefinitionId]);
  }, [ensureCatalogDetails, successfulRunOutcome?.sourceDefinitionId]);

  useEffect(() => {
    const outcomeEventId = successfulRunOutcome?.eventId;
    const sourceDefinitionId = successfulRunOutcome?.sourceDefinitionId;
    if (!showSuccessfulRunOutcome || !outcomeEventId || !sourceDefinitionId)
      return;
    setCurrentActionCue((current) =>
      current?.eventId === outcomeEventId ||
      current?.cardDefinitionId === sourceDefinitionId
        ? null
        : current,
    );
    setActionCueQueue((current) =>
      current.filter(
        (cue) =>
          cue.eventId !== outcomeEventId &&
          cue.cardDefinitionId !== sourceDefinitionId,
      ),
    );
  }, [
    showSuccessfulRunOutcome,
    successfulRunOutcome?.eventId,
    successfulRunOutcome?.sourceDefinitionId,
  ]);

  useEffect(() => {
    if (!showAccessReveal) return;
    setCurrentActionCue((current) =>
      current && accessPresentationOwnsActionCue(current.actionType)
        ? null
        : current,
    );
    setActionCueQueue((current) =>
      current.filter((cue) => !accessPresentationOwnsActionCue(cue.actionType)),
    );
  }, [accessReveal?.eventId, showAccessReveal]);

  useEffect(() => {
    if (
      !isAiVsAiMatch ||
      !showAccessReveal ||
      !accessReveal ||
      overlayPresentation.concludingAgendaAccessAwaitingConfirmation
    )
      return;
    const autoDismissMs = observerAccessAutoDismissMs({
      observerMode: isAiVsAiMatch,
      pacingMode: localAiPacingMode,
      configuredAutoDismissMs: actionCueAutoDismissMs,
    });
    if (autoDismissMs === null) return;
    const eventId = accessReveal.eventId;
    const timeout = window.setTimeout(
      () => dismissAccessPresentation(eventId),
      autoDismissMs,
    );
    return () => window.clearTimeout(timeout);
  }, [
    accessReveal?.eventId,
    accessReveal?.outcomeStatus,
    actionCueAutoDismissMs,
    dismissAccessPresentation,
    isAiVsAiMatch,
    localAiPacingMode,
    overlayPresentation.concludingAgendaAccessAwaitingConfirmation,
    showAccessReveal,
  ]);

  useEffect(() => {
    if (
      interactionPresentationBlocked ||
      showAccessReveal ||
      currentActionCue ||
      actionCueQueue.length === 0
    )
      return;
    const [nextCue, ...rest] = actionCueQueue;
    if (!nextCue) return;
    setCurrentActionCue(nextCue);
    setActionCueQueue(rest);
  }, [
    actionCueQueue,
    currentActionCue,
    interactionPresentationBlocked,
    showAccessReveal,
  ]);

  useEffect(() => {
    if (currentDamageImpact || damageImpactQueue.length === 0) return;
    const [nextCue, ...rest] = damageImpactQueue;
    if (!nextCue) return;
    setCurrentDamageImpact(nextCue);
    setDamageImpactQueue(rest);
  }, [damageImpactQueue, currentDamageImpact]);

  useEffect(() => {
    if (!currentActionCue) return;
    if (interactionPresentationBlocked || showAccessReveal) return;
    if (audioEnabled && currentActionCue.sound)
      playActionCueSound(
        currentActionCue.sound,
        audioVolume,
        currentActionCue.soundCount,
      );
    if (
      localAiPacingMode === "manual" &&
      currentActionCue.source === "ai" &&
      aiTurnPresentation?.canAdvanceAi
    )
      return;
    if (actionCueAutoDismissMs === 0) return;
    const timeout = window.setTimeout(
      () => setCurrentActionCue(null),
      actionCueAutoDismissMs,
    );
    return () => window.clearTimeout(timeout);
  }, [
    actionCueAutoDismissMs,
    aiTurnPresentation?.canAdvanceAi,
    audioEnabled,
    audioVolume,
    currentActionCue,
    interactionPresentationBlocked,
    localAiPacingMode,
    showAccessReveal,
  ]);

  useEffect(() => {
    if (
      !payload ||
      !aiTurnPresentation?.canAdvanceAi ||
      payload.winner ||
      connection !== "online" ||
      priorityWindowHoldEnabled ||
      aiDecisionDebugShouldWaitForPreparation ||
      interactionPresentationBlocked
    )
      return;
    const delayMs = aiPacingDelayMs(
      localAiPacingMode,
      Boolean(currentActionCue) || actionCueQueue.length > 0,
      actionCueAutoDismissMs,
    );
    if (delayMs === null) return;
    const advanceKey = `${payload.matchId}:${payload.matchVersion}:${payload.playerView.stateVersion}:${localAiPacingMode}`;
    if (pendingAiAdvanceKeyRef.current === advanceKey) return;
    pendingAiAdvanceKeyRef.current = advanceKey;
    const timeout = window.setTimeout(() => {
      if (
        localAiPacingModeRef.current !== localAiPacingMode ||
        localAiPacingModeRef.current === "manual"
      ) {
        if (pendingAiAdvanceKeyRef.current === advanceKey)
          pendingAiAdvanceKeyRef.current = null;
        return;
      }
      if (currentActionCue) setCurrentActionCue(actionCueAfterAiAdvanceRequest);
      const sent = advanceAi(
        aiAdvanceRequestMode(localAiPacingModeRef.current, isAiVsAiMatch),
      );
      if (!sent && pendingAiAdvanceKeyRef.current === advanceKey)
        pendingAiAdvanceKeyRef.current = null;
    }, delayMs);
    const retryTimeout = window.setTimeout(
      () => {
        if (pendingAiAdvanceKeyRef.current === advanceKey)
          pendingAiAdvanceKeyRef.current = null;
      },
      Math.max(delayMs + 2500, 3200),
    );
    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(retryTimeout);
      if (pendingAiAdvanceKeyRef.current === advanceKey)
        pendingAiAdvanceKeyRef.current = null;
    };
  }, [
    actionCueAutoDismissMs,
    actionCueQueue.length,
    aiTurnPresentation?.canAdvanceAi,
    aiDecisionDebugShouldWaitForPreparation,
    connection,
    currentActionCue,
    interactionPresentationBlocked,
    isAiVsAiMatch,
    localAiPacingMode,
    payload?.matchId,
    payload?.matchVersion,
    payload?.playerView.stateVersion,
    payload?.winner,
    priorityWindowHoldEnabled,
  ]);

  useEffect(() => {
    if (
      !aiTurnPresentation?.canAdvanceAi ||
      payload?.winner ||
      aiPacingFallbackDelay === null
    ) {
      setAiPacingFallbackVisible(false);
      return;
    }
    if (aiPacingFallbackDelay === 0) {
      setAiPacingFallbackVisible(true);
      return;
    }
    setAiPacingFallbackVisible(false);
    const timeout = window.setTimeout(
      () => setAiPacingFallbackVisible(true),
      aiPacingFallbackDelay,
    );
    return () => window.clearTimeout(timeout);
  }, [
    aiPacingFallbackDelay,
    aiTurnPresentation?.canAdvanceAi,
    payload?.matchId,
    payload?.matchVersion,
    payload?.playerView.stateVersion,
    payload?.winner,
  ]);

  const createMatch = async () => {
    setNotice("");
    if (standardDeckCatalogBlocksStart) {
      setNotice(
        "Standarddecks konnten nicht geladen werden. Wähle zwei persönliche Decks oder lade den Standarddeck-Katalog erneut.",
      );
      return;
    }
    if (
      accountSession.account &&
      accountMatchStartPreferencesLoadedFor !== accountSession.account.accountId
    ) {
      setNotice(
        "Deine Account-Vorbelegungen werden noch geladen. Bitte starte das Match gleich erneut.",
      );
      return;
    }
    if (accountSession.account) {
      try {
        const saved = await saveAccountMatchStartPreferences(
          currentAccountMatchStartPreferences,
          accountSession.csrfToken,
        );
        accountMatchStartPreferencesBaselineRef.current = JSON.stringify(
          saved.preferences ?? currentAccountMatchStartPreferences,
        );
        if (saved.invalidDeckSlots.length > 0)
          setNotice(
            "Eine gespeicherte Deckauswahl ist nicht mehr gültig. Die Standardauswahl wird verwendet.",
          );
      } catch (error) {
        setNotice(
          error instanceof Error
            ? `Deine Account-Vorbelegungen konnten vor dem Start nicht gespeichert werden (${error.message}). Das Match startet trotzdem.`
            : "Deine Account-Vorbelegungen konnten vor dem Start nicht gespeichert werden. Das Match startet trotzdem.",
        );
      }
    }
    const matchSeed = normalizeMatchSeed(seed);
    setSeed(matchSeed);
    let deckPayload: Record<string, unknown>;
    try {
      deckPayload = await matchDeckPayload(matchSeed);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Deckauswahl ist nicht matchstartfähig.",
      );
      return;
    }
    let created: CreateMatchResponse;
    try {
      created = await postJson<CreateMatchResponse>("/api/matches", {
        ...matchStart.createRequest,
        displayName,
        seed: matchSeed,
        runnerDifficulty,
        corpDifficulty,
        ...(hasAiOpponent ? { aiPacingMode: "paced" } : {}),
        ...(hasAiOpponent && aiTraceStartMode !== "off"
          ? { aiTraceMode: aiTraceStartMode }
          : {}),
        ...(isHumanVsHuman ? { countdownSeconds } : {}),
        isPublic,
        settings: {
          matchFormat: effectiveStartMatchFormat,
          ...(effectiveStartMatchFormat === "two_game_side_swap"
            ? { seriesGamesPlanned }
            : {}),
          cardPool: matchCardPool,
          agendaPointsToWin: effectiveAgendaTarget,
          playerClock:
            gameMode !== "ai_vs_ai" && playerClockMode === "player_clock"
              ? {
                  mode: "player_clock",
                  startingTimeMs: playerClockMinutes * 60_000,
                  gracePeriodMs: playerClockGraceSeconds * 1000,
                }
              : { mode: "none" },
        },
        ...deckPayload,
      });
    } catch (error) {
      setNotice(
        serverErrorNotice(error, "Match konnte nicht erstellt werden."),
      );
      return;
    }
    if (created.error) {
      setNotice(created.error.message);
      return;
    }
    if (created.mode === "ai_vs_ai") updateLocalAiPacingMode("paced");
    rememberDisplayName(displayName);
    setSeed(createMatchSeed());
    const nextSession: SessionInfo = {
      matchId: created.matchId,
      side: created.hostSide,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
      webSocketUrl: created.webSocketUrl,
      displayName,
      mode: created.mode,
      ...(created.pendingDeckHandshake ? { pendingDeckHandshake: true } : {}),
      ...(created.joinUrl ? { joinUrl: created.joinUrl } : {}),
    };
    persistSession(nextSession);
    setSession(nextSession);
    const aiTraceNotice =
      hasAiOpponent && aiTraceStartMode !== "off"
        ? " KI-Trace läuft ab Start."
        : "";
    const resolvedDeckNotice = created.playerView?.deckMetadata
      ? ` Decks: ${created.playerView.deckMetadata.own.deckName} gegen ${created.playerView.deckMetadata.opponent.deckName}.`
      : "";
    if (created.lobby || created.pendingDeckHandshake || !created.playerView) {
      setPayload(null);
      setLobby(lobbyFromInitialResponse(created, created.hostSide));
      const sideNotice =
        created.lobby?.sideAssignmentMode === "random_pending"
          ? "Seite wird beim Start ausgelost"
          : `Du startest als ${sideLabel(created.hostSide)}`;
      setNotice(`Lobby erstellt. ${sideNotice}.${aiTraceNotice}`);
      return;
    }
    presentMatchStartLogo(created.matchId);
    setPayload(fromInitialResponse(created, created.hostSide));
    setLobby(null);
    setNotice(
      created.mode === "ai_vs_ai"
        ? `Simulation bereit. Beide KI-Seiten sind sichtbar; sie startet getaktet und kann jederzeit pausiert, schrittweise fortgesetzt oder abgebrochen werden.${resolvedDeckNotice}${aiTraceNotice}`
        : `Match erstellt. Du startest als ${sideLabel(created.hostSide)}.${resolvedDeckNotice}${aiTraceNotice}`,
    );
  };

  const startNextSeriesGame = async () => {
    if (
      !session ||
      !resultSummary?.series?.nextAvailable ||
      seriesTransitioning
    )
      return;
    setSeriesTransitioning(true);
    setNotice("");
    try {
      const next = await postJson<
        CreateMatchResponse & { error?: { message: string } }
      >(`/api/matches/${encodeURIComponent(session.matchId)}/series-next`, {
        side: session.side,
        sessionToken: session.sessionToken,
        displayName: session.displayName,
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
        mode: next.mode,
        ...(next.joinUrl ? { joinUrl: next.joinUrl } : {}),
      };
      persistSession(nextSession);
      setSession(nextSession);
      presentMatchStartLogo(next.matchId);
      setPayload(fromInitialResponse(next, next.hostSide));
      setLobby(null);
      setDismissedResultKey(null);
      setNotice(
        next.joinUrl
          ? "Nächstes Serienspiel erstellt. Teile den neuen Join-Link."
          : "Nächstes Serienspiel erstellt.",
      );
    } catch (error) {
      setNotice(
        serverErrorNotice(
          error,
          "Nächstes Serienspiel konnte nicht erstellt werden.",
        ),
      );
    } finally {
      setSeriesTransitioning(false);
    }
  };

  async function matchDeckPayload(matchSeed: string) {
    return {
      participantADecks: await deckPairPayload(
        runnerDeckSource,
        selectedRunnerSnapshotId,
        selectedRunnerLocalDeckId,
        corpDeckSource,
        selectedCorpSnapshotId,
        selectedCorpLocalDeckId,
        matchSeed,
        "participant_a",
      ),
      ...((isHumanVsHuman && testSetupMode) ||
      ((isHumanVsAi || isAiVsAiStartSeries) && aiDeckPolicy === "selected")
        ? {
            participantBDecks: await deckPairPayload(
              participantBRunnerDeckSource,
              selectedParticipantBRunnerSnapshotId,
              selectedParticipantBRunnerLocalDeckId,
              participantBCorpDeckSource,
              selectedParticipantBCorpSnapshotId,
              selectedParticipantBCorpLocalDeckId,
              matchSeed,
              "participant_b",
            ),
          }
        : {}),
      ...(hasAiOpponent ? { aiDeckPolicy } : {}),
    };
  }

  async function deckPairPayload(
    runnerSource: DeckSlotSource,
    runnerSnapshotId: string,
    runnerLocalDeckId: string,
    corpSource: DeckSlotSource,
    corpSnapshotId: string,
    corpLocalDeckId: string,
    randomSeed: string,
    slotOwner: "participant_a" | "participant_b",
  ) {
    return {
      ...(await deckSidePayload(
        "runner",
        runnerSource,
        runnerSnapshotId,
        runnerLocalDeckId,
        randomSeed,
        `${slotOwner}:runner`,
      )),
      ...(await deckSidePayload(
        "corp",
        corpSource,
        corpSnapshotId,
        corpLocalDeckId,
        randomSeed,
        `${slotOwner}:corp`,
      )),
    };
  }

  async function deckSidePayload(
    side: Side,
    source: DeckSlotSource,
    snapshotId: string,
    localDeckId: string,
    randomSeed: string,
    slotKey: string,
  ) {
    const snapshots = side === "runner" ? runnerSnapshots : corpSnapshots;
    const sideLocalDecks = matchStartLocalDecks.filter(
      (candidate) => candidate.side === side,
    );
    const selection = resolveDeckSlotSelection({
      source,
      selectedSnapshotId: snapshotId,
      selectedLocalDeckId: localDeckId,
      snapshots,
      localDecks: sideLocalDecks,
    });
    if (!selection)
      throw new Error(
        `Kein matchstartfähiges ${sideLabel(side)}-Deck verfügbar.`,
      );
    if (selection.source === RANDOM_STANDARD_DECK_SOURCE) {
      const randomSnapshot = randomStandardSnapshotForSlot({
        snapshots,
        seed: randomSeed,
        slotKey,
      });
      if (!randomSnapshot)
        throw new Error(
          `Kein zufälliges ${sideLabel(side)}-Standard-Deck verfügbar.`,
        );
      return side === "runner"
        ? { runnerDeckSnapshotId: randomSnapshot.deckSnapshotId }
        : { corpDeckSnapshotId: randomSnapshot.deckSnapshotId };
    }
    if (selection.source === "local") {
      const deck = sideLocalDecks.find(
        (candidate) => candidate.deckId === selection.localDeckId,
      )!;
      if (savedDeckFingerprints[deck.deckId] !== deckFingerprint(deck))
        throw new Error(
          `Bitte speichere das ${sideLabel(side)}-Deck vor dem Matchstart.`,
        );
      const snapshot = await validateDeckForMatch(deck);
      return side === "runner"
        ? { runnerDeckSnapshot: snapshot }
        : { corpDeckSnapshot: snapshot };
    }
    return side === "runner"
      ? { runnerDeckSnapshotId: selection.snapshotId }
      : { corpDeckSnapshotId: selection.snapshotId };
  }

  const refreshAccountRejoinablePublicMatchIds = async () => {
    const accountId = accountSession.account?.accountId;
    if (!accountId) {
      setAccountRejoinableMatchIds([]);
      return;
    }
    try {
      const response = await loadAccountActivePublicMatchIds();
      if (accountIdRef.current !== accountId) return;
      setAccountRejoinableMatchIds(response.matchIds);
    } catch {
      if (accountIdRef.current === accountId) setAccountRejoinableMatchIds([]);
    }
  };

  const refreshOpenLanMatches = async (silent = false) => {
    if (!silent) setOpenLanLoading(true);
    setOpenLanError("");
    try {
      const response = await fetchPublicMatches();
      if (response.error) {
        setOpenLanMatches([]);
        setOpenLanError(response.error.message);
        setOpenLanUpdatedAt(new Date().toISOString());
        return;
      }
      setOpenLanMatches(response.matches ?? []);
      setOpenLanUpdatedAt(new Date().toISOString());
      void refreshAccountRejoinablePublicMatchIds();
    } catch (error) {
      setOpenLanMatches([]);
      setOpenLanError(
        serverErrorNotice(
          error,
          "Öffentliche Spiele konnten nicht geladen werden.",
        ),
      );
      setOpenLanUpdatedAt(new Date().toISOString());
    } finally {
      if (!silent) setOpenLanLoading(false);
    }
  };

  const refreshRecentGameResults = async () => {
    if (!accountSession.account) {
      setRecentGameResults([]);
      setRecentGameResultsError("");
      setRecentGameResultsUpdatedAt(null);
      return;
    }
    setRecentGameResultsLoading(true);
    setRecentGameResultsError("");
    try {
      const response = await fetchPersonalRecentGameResults();
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
      setRecentGameResultsError(
        serverErrorNotice(error, "Meine Spiele konnten nicht geladen werden."),
      );
      setRecentGameResultsUpdatedAt(new Date().toISOString());
    } finally {
      setRecentGameResultsLoading(false);
    }
  };

  useEffect(() => {
    accountIdRef.current = accountSession.account?.accountId ?? null;
    if (!accountIdRef.current) setAccountRejoinableMatchIds([]);
  }, [accountSession.account?.accountId]);

  useEffect(() => {
    const visible = shouldRefreshPublicGames({
      hasActivePlayerView: Boolean(session && payload && activeView),
      entryTab,
      activeMatchWorkspace,
    });
    if (!visible) return;
    void refreshOpenLanMatches();
    const timer = window.setInterval(() => {
      void refreshOpenLanMatches(true);
    }, 7000);
    return () => {
      window.clearInterval(timer);
    };
  }, [
    activeMatchWorkspace,
    entryTab,
    session?.matchId,
    accountSession.account?.accountId,
  ]);

  useEffect(() => {
    if (entryTab !== "recent" || session || !accountSession.account) return;
    void refreshRecentGameResults();
  }, [entryTab, session?.matchId, accountSession.account?.accountId]);

  useEffect(() => {
    if (
      activeMatchWorkspace !== "recent" ||
      !session ||
      !accountSession.account
    )
      return;
    void refreshRecentGameResults();
  }, [
    activeMatchWorkspace,
    session?.matchId,
    accountSession.account?.accountId,
  ]);

  const updateJoinLinkInput = (value: string) => {
    setJoinLinkInput(value);
    const parsed = parseJoinLinkInput(value);
    if (!parsed) return;
    setJoinMatchId(parsed.matchId);
    setJoinToken(parsed.joinToken);
  };

  const selectOpenLanMatch = (entry: PublicMatchEntry) => {
    if (entry.status !== "open" || session) return;
    setEntryTab("play");
    selectStartTab("join");
    setJoinMatchId(entry.matchId);
    setJoinToken("");
    setJoinLinkInput("");
  };

  const rejoinAccountPublicGame = async (entry: PublicMatchEntry) => {
    const account = accountSession.account;
    if (
      entry.status !== "active" ||
      !account ||
      !accountSession.csrfToken ||
      accountRejoinInFlightRef.current
    )
      return;
    accountRejoinInFlightRef.current = true;
    setAccountRejoiningMatchId(entry.matchId);
    try {
      const rejoined = await rejoinAccountPublicMatch({
        matchId: entry.matchId,
        csrfToken: accountSession.csrfToken,
      });
      if (rejoined.error) {
        setNotice(rejoined.error.message);
        return;
      }
      if (!rejoined.playerView) {
        setNotice(
          "Dieses Match kann nicht als aktives Spiel fortgesetzt werden.",
        );
        return;
      }
      closeSocket();
      const nextSession: SessionInfo = {
        matchId: rejoined.matchId,
        side: rejoined.side,
        sessionToken: rejoined.sessionToken,
        reconnectToken: rejoined.reconnectToken,
        webSocketUrl: rejoined.webSocketUrl,
        displayName: account.displayName,
      };
      persistSession(nextSession);
      setSession(nextSession);
      setPayload(fromJoinedResponse(rejoined));
      setLobby(null);
      setEntryTab("play");
      setActiveMatchWorkspace("game");
      setNotice("Spiel fortgesetzt.");
      void refreshOpenLanMatches(true);
    } catch (error) {
      setNotice(
        serverErrorNotice(error, "Spiel konnte nicht fortgesetzt werden."),
      );
    } finally {
      accountRejoinInFlightRef.current = false;
      setAccountRejoiningMatchId(null);
    }
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
        selectedParticipantBCorpLocalDeckId,
        normalizeMatchSeed(seed),
        "participant_b",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Deckauswahl ist nicht matchstartfähig.",
      );
      return;
    }
    let joined: JoinMatchResponse;
    try {
      joined = await postJson<JoinMatchResponse>(
        `/api/matches/${encodeURIComponent(joinMatchIdTrimmed)}/join`,
        {
          token: joinTokenTrimmed,
          displayName,
          ...deckPayload,
        },
      );
    } catch (error) {
      setNotice(
        serverErrorNotice(error, "Beitritt konnte nicht gestartet werden."),
      );
      return;
    }
    if (joined.error) {
      if (canJoinViaOpenLan) {
        setNotice(
          "Das ausgewählte Spiel ist nicht mehr offen. Die LAN-Liste wurde aktualisiert.",
        );
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
      displayName,
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

  const reconnectSession = async (
    baseSession: SessionInfo,
    fallbackNotice = "Wiederverbindung konnte nicht gestartet werden.",
    recovery = false,
  ) => {
    if (reconnectInFlightRef.current) return false;
    reconnectInFlightRef.current = true;
    try {
      let reconnected: JoinMatchResponse;
      try {
        reconnected = await postJson<JoinMatchResponse>(
          `/api/matches/${encodeURIComponent(baseSession.matchId)}/reconnect`,
          {
            side: baseSession.side,
            ...(recovery
              ? { reconnectToken: baseSession.reconnectToken, recovery: true }
              : {
                  sessionToken: baseSession.sessionToken,
                  reconnectToken: baseSession.reconnectToken,
                }),
            displayName: baseSession.displayName,
          },
        );
      } catch (error) {
        setNotice(serverErrorNotice(error, fallbackNotice));
        return false;
      }
      if (reconnected.error) {
        setNotice(reconnected.error.message);
        setSession(
          baseSession.sessionToken.trim() && baseSession.webSocketUrl.trim()
            ? baseSession
            : null,
        );
        setPayload(null);
        setLobby(null);
        setConnection("offline");
        return false;
      }
      const nextSession = {
        ...baseSession,
        sessionToken: reconnected.sessionToken,
        reconnectToken: reconnected.reconnectToken,
        webSocketUrl: reconnected.webSocketUrl,
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
      reconnectSocket();
      return true;
    } finally {
      reconnectInFlightRef.current = false;
    }
  };

  const reconnect = async () => {
    if (!session || !canReconnect) return;
    await reconnectSession(session);
  };

  function applyRemotePayload(
    remotePayload: ClientPayload | LobbyClientPayload,
  ) {
    if ("playerView" in remotePayload) {
      if (lobbyRef.current?.matchId === remotePayload.matchId)
        presentMatchStartLogo(remotePayload.matchId);
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
      closeSocket();
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
    if (
      !nextSession ||
      nextSession.matchId !== recentSession.matchId ||
      nextSession.side !== recentSession.side
    ) {
      setEntryTab("play");
      selectStartTab("join");
      setJoinMatchId(recentSession.matchId);
      setJoinToken("");
      setNotice(
        "Fortsetzen braucht ein Token aus diesem Tab. Für die Wiederverbindung bitte den Link oder Token erneut eintragen.",
      );
      return;
    }
    setSession(nextSession);
    setRecentSession(null);
    setNotice("Letzte Sitzung wird fortgesetzt.");
    let bootstrapped: ClientPayload | LobbyClientPayload | null;
    try {
      bootstrapped = await bootstrap(nextSession);
    } catch (error) {
      setNotice(
        serverErrorNotice(error, "Letzte Sitzung konnte nicht geladen werden."),
      );
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
    setNotice(
      "Beitreten ist vorbereitet. Die Match-ID ist eingetragen; bitte den aktuellen Join- oder Wiederverbindungs-Token aus dem Link ergänzen.",
    );
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
      setNotice(
        "Gespeichertes Spiel verworfen. Ein weiteres gespeichertes Spiel ist verfügbar.",
      );
    } else {
      selectStartTab("host");
      setNotice(
        "Gespeichertes Spiel verworfen. Es gibt kein Spiel zum Fortsetzen.",
      );
    }
  };

  const playImmediateActionAudio = (
    action: LegalAction,
    stateVersion: number,
  ) => {
    if (!audioEnabled) return;
    const sound = localActionSoundKind(action);
    if (!sound) return;
    playActionCueSound(sound, audioVolume);
    const keys = locallyPlayedActionSoundKeysRef.current;
    keys.add(localActionSoundKey(action.side, stateVersion, action.type));
    const oldestKey = keys.values().next().value;
    if (keys.size > 20 && oldestKey) keys.delete(oldestKey);
  };

  const submitAction = (
    action: LegalAction,
    options: { immediateAudio?: boolean; confirmed?: boolean } = {},
  ): boolean => {
    if (!session || !payload || !ensureSocketConnected()) return false;
    if (
      !options.confirmed &&
      actionNeedsRegionReplacementConfirmation(action)
    ) {
      setConfirmationDialog({
        title: "Region ersetzen",
        message:
          "Diese Installation ersetzt die vorhandene Region. Die bisherige Region wird ins Archiv gelegt.",
        confirmLabel: "Fortfahren",
        onConfirm: () => {
          submitAction(action, { ...options, confirmed: true });
        },
      });
      return false;
    }
    const stateVersion = payload.playerView.stateVersion;
    if (options.immediateAudio !== false)
      playImmediateActionAudio(action, stateVersion);
    if (
      selectedActionContext &&
      actionMatchesContext(action, selectedActionContext)
    )
      setSelectedActionContext(null);
    const paymentSupportContinuation = pendingPaymentSupportContinuation(
      session.matchId,
      action,
      stateVersion,
    );
    if (actionBelongsToRunnerPaymentSupportWindow(action)) {
      setPaymentSupportPreselection(null);
      paymentSupportSubmittedKeyRef.current = null;
      paymentSupportContinuationSubmittedKeyRef.current = null;
      // A support ability is chosen inside an already-authoritative payment
      // window. Its original action is still revalidated from fresh
      // LegalActions below, but the player must not be asked to select the
      // same break/pump/install action a second time.
      setPaymentSupportContinuation(paymentSupportContinuation);
    }
    sendSocketMessage("submit_action", {
      matchId: session.matchId,
      side: session.side,
      actionId: action.actionId,
      clientKnownStateVersion: stateVersion,
      idempotencyKey: `${session.side}-${stateVersion}-${action.actionId}-${runtimeRandomId()}`,
    });
    return true;
  };

  useEffect(() => {
    const continuation = pendingAccessContinuationRef.current;
    if (!continuation) return;
    if (!session || !payload || connection !== "online") {
      pendingAccessContinuationRef.current = null;
      return;
    }
    if (
      latestAccessRevealEvent &&
      latestAccessRevealEvent.eventId !== continuation.accessEventId
    ) {
      pendingAccessContinuationRef.current = null;
      setPendingAccessPresentationEvents((events) =>
        dismissPendingAccessPresentationEvent(
          events,
          continuation.accessEventId,
        ),
      );
      setDismissedAccessEventIds((eventIds) =>
        eventIds.includes(continuation.accessEventId)
          ? eventIds
          : [...eventIds, continuation.accessEventId].slice(-30),
      );
      return;
    }
    if (continuation.nextAccessSubmitted) return;
    const nextAccessAction = confirmedNextAccessAction(
      continuation,
      payload.playerView,
      payload.legalActions,
    );
    if (!nextAccessAction) return;
    continuation.nextAccessSubmitted = true;
    if (!submitAction(nextAccessAction))
      continuation.nextAccessSubmitted = false;
  }, [
    connection,
    latestAccessRevealEvent?.eventId,
    payload?.legalActions,
    payload?.playerView,
    session,
  ]);

  useEffect(() => {
    if (!paymentSupportPreselection) return;
    if (!session || !payload || session.side !== "runner") {
      setPaymentSupportPreselection(null);
      paymentSupportSubmittedKeyRef.current = null;
      return;
    }
    if (
      !hiddenResourcePaymentPreselectionIsAvailable(
        paymentSupportPreselection,
        session.matchId,
        payload.playerView,
      )
    ) {
      setPaymentSupportPreselection(null);
      paymentSupportSubmittedKeyRef.current = null;
      setNotice("Die vorgemerkte Bankfähigkeit ist nicht mehr verfügbar.");
      return;
    }
    if (
      paymentSupportPreselection.selectedRunId === undefined &&
      payload.playerView.run?.runId
    ) {
      setPaymentSupportPreselection({
        ...paymentSupportPreselection,
        selectedRunId: payload.playerView.run.runId,
      });
    }
  }, [paymentSupportPreselection, session, payload]);

  useEffect(() => {
    if (
      !paymentSupportPreselection ||
      !session ||
      !payload ||
      session.side !== "runner" ||
      connection !== "online"
    )
      return;
    const resolution = resolveHiddenResourcePaymentPreselection(
      paymentSupportPreselection,
      payload.legalActions,
    );
    if (resolution.kind === "waiting") return;
    if (resolution.kind === "invalid") {
      setPaymentSupportPreselection(null);
      paymentSupportSubmittedKeyRef.current = null;
      setNotice(
        "Die vorgemerkte Bankfähigkeit ist hier nicht verfügbar. Bitte wähle im Zahlungsfenster.",
      );
      return;
    }
    const submitKey = paymentSupportSubmitKey(
      session.matchId,
      resolution.windowId,
      resolution.action,
    );
    if (
      !shouldSubmitPaymentSupportAction(
        paymentSupportSubmittedKeyRef.current,
        submitKey,
      )
    )
      return;
    if (submitAction(resolution.action, { immediateAudio: false })) {
      paymentSupportSubmittedKeyRef.current = submitKey;
      setPaymentSupportContinuation(
        pendingPaymentSupportContinuation(
          session.matchId,
          resolution.action,
          payload.playerView.stateVersion,
        ),
      );
      setPaymentSupportPreselection(null);
      setNotice(`${resolution.action.label} wird für diese Zahlung verwendet.`);
    }
  }, [paymentSupportPreselection, session, payload, connection, submitAction]);

  useEffect(() => {
    if (!paymentSupportContinuation) return;
    if (
      !session ||
      !payload ||
      session.side !== "runner" ||
      session.matchId !== paymentSupportContinuation.matchId
    ) {
      setPaymentSupportContinuation(null);
      paymentSupportContinuationSubmittedKeyRef.current = null;
      return;
    }
    if (connection !== "online") return;
    const resolution = resolvePaymentSupportContinuation(
      paymentSupportContinuation,
      payload.playerView.stateVersion,
      payload.legalActions,
    );
    if (resolution.kind === "waiting") return;
    if (resolution.kind === "invalid") {
      setPaymentSupportContinuation(null);
      paymentSupportContinuationSubmittedKeyRef.current = null;
      setNotice(
        "Die Zahlung braucht eine weitere Entscheidung. Bitte wähle im Zahlungsfenster.",
      );
      return;
    }
    const submitKey = paymentSupportSubmitKey(
      session.matchId,
      paymentSupportContinuation.windowId,
      resolution.action,
    );
    if (
      !shouldSubmitPaymentSupportAction(
        paymentSupportContinuationSubmittedKeyRef.current,
        submitKey,
      )
    )
      return;
    if (submitAction(resolution.action, { immediateAudio: false })) {
      paymentSupportContinuationSubmittedKeyRef.current = submitKey;
      setPaymentSupportContinuation(null);
      setNotice(
        "Die vorgemerkte Bankfähigkeit wurde genutzt; die Zahlung wird fortgesetzt.",
      );
    }
  }, [paymentSupportContinuation, session, payload, connection, submitAction]);

  const currentCorpRunAutoPassKey =
    session && payload?.playerView.run?.runId
      ? `${session.matchId}:${payload.playerView.run.runId}`
      : null;

  useEffect(() => {
    if (
      corpRunAutoPassKey &&
      corpRunAutoPassKey !== currentCorpRunAutoPassKey
    ) {
      setCorpRunAutoPassKey(null);
      corpRunAutoPassSubmittedKeyRef.current = null;
    }
  }, [corpRunAutoPassKey, currentCorpRunAutoPassKey]);

  useEffect(() => {
    if (
      !session ||
      !payload ||
      session.side !== "corp" ||
      connection !== "online" ||
      !currentCorpRunAutoPassKey ||
      corpRunAutoPassKey !== currentCorpRunAutoPassKey
    )
      return;
    const action = automaticCorpRunPassAction(
      payload.playerView,
      payload.legalActions,
      session.side,
    );
    if (!action) return;
    const key = `${currentCorpRunAutoPassKey}:${payload.playerView.stateVersion}:${action.actionId}`;
    if (corpRunAutoPassSubmittedKeyRef.current === key) return;
    if (submitAction(action, { immediateAudio: false }))
      corpRunAutoPassSubmittedKeyRef.current = key;
  }, [
    session,
    payload,
    connection,
    currentCorpRunAutoPassKey,
    corpRunAutoPassKey,
    submitAction,
  ]);

  useEffect(() => {
    if (
      !autoCorpMandatoryDrawEnabled ||
      !gameplaySettingsLoaded ||
      !session ||
      !payload ||
      connection !== "online"
    )
      return;
    const action = automaticCorpMandatoryDrawAction(
      payload.playerView,
      payload.legalActions,
      session.side,
    );
    if (!action) return;
    const key = `${session.matchId}:${session.side}:${payload.playerView.stateVersion}:${action.actionId}`;
    if (autoCorpMandatoryDrawSubmittedKeyRef.current === key) return;
    if (submitAction(action, { immediateAudio: false }))
      autoCorpMandatoryDrawSubmittedKeyRef.current = key;
  }, [
    autoCorpMandatoryDrawEnabled,
    gameplaySettingsLoaded,
    session,
    payload,
    connection,
    submitAction,
  ]);

  useEffect(() => {
    if (
      !autoEndTurnEnabled ||
      !gameplaySettingsLoaded ||
      !session ||
      !payload ||
      connection !== "online"
    )
      return;
    const action = automaticEndTurnAction(
      payload.playerView,
      payload.legalActions,
      session.side,
      {
        accessRevealVisible: showAccessReveal || showSuccessfulRunOutcome,
        exposeReviewVisible: showExposeReview,
        damageImpactVisible: Boolean(currentDamageImpact),
        confirmationVisible: Boolean(confirmationDialog),
        actionCueVisible:
          Boolean(currentActionCue) || actionCueQueue.length > 0,
      },
    );
    if (!action) return;
    const key = `${session.matchId}:${session.side}:${payload.playerView.stateVersion}:${action.actionId}`;
    if (autoEndTurnSubmittedKeyRef.current === key) return;
    if (submitAction(action, { immediateAudio: false }))
      autoEndTurnSubmittedKeyRef.current = key;
  }, [
    autoEndTurnEnabled,
    gameplaySettingsLoaded,
    session,
    payload,
    connection,
    submitAction,
    showAccessReveal,
    showSuccessfulRunOutcome,
    showExposeReview,
    currentDamageImpact,
    confirmationDialog,
    currentActionCue,
    actionCueQueue.length,
  ]);

  const submitChoiceOption = (
    action: LegalAction,
    choiceId: string,
    selectedOptionId: string,
  ) => {
    if (!session || !payload || !ensureSocketConnected()) return;
    const stateVersion = payload.playerView.stateVersion;
    playImmediateActionAudio(action, stateVersion);
    sendSocketMessage("submit_action", {
      matchId: session.matchId,
      side: session.side,
      actionId: action.actionId,
      clientKnownStateVersion: stateVersion,
      selectedChoices: { choiceId, selectedOptionIds: [selectedOptionId] },
      idempotencyKey: `${session.side}-${stateVersion}-${action.actionId}-${selectedOptionId}-${runtimeRandomId()}`,
    });
  };

  const submitChoiceOptions = (
    action: LegalAction,
    choiceId: string,
    selectedOptionIds: string[],
    options: { immediateAudio?: boolean } = {},
  ): boolean => {
    if (!session || !payload || !ensureSocketConnected()) return false;
    const stateVersion = payload.playerView.stateVersion;
    if (options.immediateAudio !== false)
      playImmediateActionAudio(action, stateVersion);
    sendSocketMessage("submit_action", {
      matchId: session.matchId,
      side: session.side,
      actionId: action.actionId,
      clientKnownStateVersion: stateVersion,
      selectedChoices: { choiceId, selectedOptionIds },
      idempotencyKey: `${session.side}-${stateVersion}-${action.actionId}-${selectedOptionIds.join(".")}-${runtimeRandomId()}`,
    });
    return true;
  };

  useEffect(() => {
    if (
      !autoDiscardEnabled ||
      !gameplaySettingsLoaded ||
      !session ||
      !payload ||
      connection !== "online" ||
      !activeDiscardChoice
    )
      return;
    const discardAction = payload.legalActions.find(
      (action) =>
        action.type === "resolve_choice" &&
        action.payload?.choiceId === activeDiscardChoice.choiceId,
    );
    const required = activeDiscardChoice.maxSelections;
    if (
      !discardAction ||
      required <= 0 ||
      selectedDiscardOptionIds.length !== required
    )
      return;
    const key = `${session.matchId}:${session.side}:${payload.playerView.stateVersion}:${discardAction.actionId}:${selectedDiscardOptionIds.join(".")}`;
    if (autoDiscardSubmittedKeyRef.current === key) return;
    if (
      submitChoiceOptions(
        discardAction,
        activeDiscardChoice.choiceId,
        selectedDiscardOptionIds,
        { immediateAudio: false },
      )
    )
      autoDiscardSubmittedKeyRef.current = key;
  }, [
    autoDiscardEnabled,
    gameplaySettingsLoaded,
    session,
    payload,
    connection,
    activeDiscardChoice,
    selectedDiscardOptionIds,
    submitChoiceOptions,
  ]);

  const setReady = (ready: boolean) => {
    if (!session || !ensureSocketConnected()) return;
    sendSocketMessage("set_ready", { ready });
  };

  const cancelCountdown = () => {
    if (!session || !ensureSocketConnected()) return;
    sendSocketMessage("cancel_countdown", {});
  };

  const cancelMatchLifecycle = async () => {
    if (!session) return;
    let result: LifecycleActionResponse;
    try {
      result = await postJson<LifecycleActionResponse>(
        `/api/matches/${encodeURIComponent(session.matchId)}/cancel`,
        {
          side: session.side,
          sessionToken: session.sessionToken,
        },
      );
    } catch (error) {
      setNotice(
        serverErrorNotice(error, "Match konnte nicht abgebrochen werden."),
      );
      return;
    }
    if (!result.ok) {
      setNotice(result.error.message);
      return;
    }
    applyRemotePayload(result.actorPayload);
    setNotice(
      isAiVsAiMatch
        ? "Simulation abgebrochen. Der letzte echte Spielzustand bleibt sichtbar; es wurde kein Sieger erzeugt."
        : "Match abgebrochen. Der alte Link und die alten Tokens sind ungültig.",
    );
  };

  const leaveMatchLifecycle = async () => {
    if (!session) {
      leaveMatch();
      return;
    }
    let result: LifecycleActionResponse;
    try {
      result = await postJson<LifecycleActionResponse>(
        `/api/matches/${encodeURIComponent(session.matchId)}/leave`,
        {
          side: session.side,
          sessionToken: session.sessionToken,
        },
      );
    } catch (error) {
      setNotice(
        serverErrorNotice(error, "Lobby konnte nicht verlassen werden."),
      );
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
    if (
      !session ||
      !payload ||
      payload.matchStatus !== "active" ||
      payload.winner
    )
      return;
    let result: LifecycleActionResponse;
    try {
      result = await postJson<LifecycleActionResponse>(
        `/api/matches/${encodeURIComponent(session.matchId)}/forfeit`,
        {
          side: session.side,
          sessionToken: session.sessionToken,
        },
      );
    } catch (error) {
      setNotice(
        serverErrorNotice(error, "Spiel konnte nicht aufgegeben werden."),
      );
      return;
    }
    if (!result.ok) {
      setNotice(result.error.message);
      return;
    }
    applyRemotePayload(result.actorPayload);
    setNotice(
      "Spiel aufgegeben. Der Engine-State bleibt der letzte echte Spielzustand.",
    );
  };

  const requestForfeitMatch = () => {
    if (
      !session ||
      !payload ||
      payload.matchStatus !== "active" ||
      payload.winner
    )
      return;
    setConfirmationDialog({
      title: "Spiel aufgeben?",
      message:
        "Diese Aufgabe beendet nur dieses Spiel. In einer Matchserie kann ein offenes Folgespiel danach weiter gestartet werden. Der Engine-State bleibt der letzte echte Spielzustand.",
      confirmLabel: "Aufgeben",
      tone: "danger",
      onConfirm: forfeitMatch,
    });
  };

  const requestCancelSimulation = () => {
    if (!canCancelSimulation) return;
    updateLocalAiPacingMode("manual");
    setConfirmationDialog({
      title: "Simulation abbrechen?",
      message:
        "Die KI-gegen-KI-Simulation endet ohne Sieger. Der letzte echte Engine-Zustand bleibt auf dem Board sichtbar.",
      confirmLabel: "Simulation abbrechen",
      tone: "danger",
      onConfirm: cancelMatchLifecycle,
    });
  };

  const setRetentionProtection = async (protectedValue: boolean) => {
    if (!session) return;
    let result: RetentionProtectionResponse;
    try {
      result = await postJson<RetentionProtectionResponse>(
        `/api/matches/${encodeURIComponent(session.matchId)}/retention-protection`,
        {
          side: session.side,
          sessionToken: session.sessionToken,
          protected: protectedValue,
        },
      );
    } catch (error) {
      setNotice(
        serverErrorNotice(error, "Löschschutz konnte nicht geändert werden."),
      );
      return;
    }
    if (!result.ok) {
      setNotice(
        "error" in result
          ? result.error.message
          : "Löschschutz konnte nicht geändert werden.",
      );
      return;
    }
    applyRemotePayload(result.payload);
    setNotice(
      protectedValue
        ? "Dieses Spiel ist gegen automatisches Löschen geschützt."
        : "Löschschutz ist aufgehoben.",
    );
  };

  const recreateMatch = async () => {
    if (!session) return;
    let recreated: CreateMatchResponse | LifecycleActionResponse;
    try {
      recreated = await postJson<CreateMatchResponse | LifecycleActionResponse>(
        `/api/matches/${encodeURIComponent(session.matchId)}/recreate`,
        {
          side: session.side,
          sessionToken: session.sessionToken,
          displayName: session.displayName,
        },
      );
    } catch (error) {
      setNotice(
        serverErrorNotice(error, "Match konnte nicht neu erstellt werden."),
      );
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
      mode: recreated.mode,
      ...(recreated.pendingDeckHandshake ? { pendingDeckHandshake: true } : {}),
      ...(recreated.joinUrl ? { joinUrl: recreated.joinUrl } : {}),
    };
    persistSession(nextSession);
    setSession(nextSession);
    setDismissedResultKey(null);
    if (
      recreated.lobby ||
      recreated.pendingDeckHandshake ||
      !recreated.playerView
    ) {
      setPayload(null);
      setLobby(lobbyFromInitialResponse(recreated, recreated.hostSide));
    } else {
      presentMatchStartLogo(recreated.matchId);
      setPayload(fromInitialResponse(recreated, recreated.hostSide));
      setLobby(null);
    }
    setEntryTab("play");
    setNotice(
      recreated.joinUrl
        ? "Neues Match erstellt. Teile den neuen Join-Link."
        : "Neues Match erstellt.",
    );
  };

  const returnToSetupFromLobby = () => {
    if (!session || !lobby) {
      leaveMatch();
      setEntryTab("play");
      return;
    }
    const isHost = lobby.startLobby
      ? playerSlotForSide(lobby.startLobby, lobby.side) === "player_a"
      : true;
    if (isHost) void cancelMatchLifecycle();
    else void leaveMatchLifecycle();
  };

  const sendLobbyChat = () => {
    if (!session || !ensureSocketConnected()) return;
    const text = lobbyChatText.trim();
    if (!text) return;
    sendSocketMessage("send_lobby_chat", { text });
    setLobbyChatText("");
  };

  const advanceAi = (
    mode: "single_step" | "until_human" = "single_step",
  ): boolean => {
    if (!session || !payload || !aiTurnPresentation?.canAdvanceAi) return false;
    if (aiDecisionDebugShouldWaitForPreparation) {
      setNotice(
        "Die nächste KI-Entscheidung wird noch für die Debuganzeige vorbereitet.",
      );
      return false;
    }
    if (!ensureSocketConnected()) return false;
    try {
      setPreparedAiDecisionDebug(null);
      setAiDecisionDebugPreview(null);
      setAiDecisionDebugPreviewError("");
      sendSocketMessage("advance_ai", {
        knownStateVersion: payload.playerView.stateVersion,
        knownMatchVersion: payload.matchVersion,
        mode,
      });
      return true;
    } catch {
      pendingAiAdvanceKeyRef.current = null;
      setNotice(
        "KI-Schritt konnte nicht gesendet werden. Bitte verbinde Dich erneut oder nutze den KI-Schritt erneut.",
      );
      return false;
    }
  };

  const requestUndo = () => {
    if (!latestEventId || !ensureSocketConnected()) return;
    setPaymentSupportPreselection(null);
    paymentSupportSubmittedKeyRef.current = null;
    setPaymentSupportContinuation(null);
    paymentSupportContinuationSubmittedKeyRef.current = null;
    setUndoNotice("");
    sendSocketMessage("request_undo", { targetEventId: latestEventId });
  };

  const resolveUndo = (accepted: boolean) => {
    if (!payload?.pendingUndo || !ensureSocketConnected()) return;
    if (accepted) {
      setPaymentSupportPreselection(null);
      paymentSupportSubmittedKeyRef.current = null;
      setPaymentSupportContinuation(null);
      paymentSupportContinuationSubmittedKeyRef.current = null;
    }
    setUndoNotice("");
    sendSocketMessage(accepted ? "accept_undo" : "decline_undo", {
      undoRequestId: payload.pendingUndo.undoRequestId,
    });
  };

  const leaveMatch = () => {
    const leavingSession = session;
    closeSocket();
    clearStoredSession(leavingSession ?? undefined);
    if (leavingSession) removeRecentSession(leavingSession);
    setRecentSession(loadRecentSession());
    setSession(null);
    setPayload(null);
    setLobby(null);
    setConnection("offline");
    setSeriesTransitioning(false);
    setNotice("");
  };

  const copyJoinLink = async () => {
    if (!session?.joinUrl) return;
    const copied = await copyTextToClipboard(session.joinUrl);
    setNotice(
      copied
        ? "Join-Link kopiert."
        : "Kopieren war nicht möglich. Bitte Link manuell markieren und kopieren.",
    );
  };

  const copyReconnectLink = async () => {
    if (!session?.reconnectToken) return;
    const copied = await copyTextToClipboard(reconnectUrlForSession(session));
    setNotice(
      copied
        ? "Wiederverbindungslink kopiert."
        : "Kopieren war nicht möglich. Bitte Link manuell markieren und kopieren.",
    );
  };

  const discardLocalActiveSession = () => {
    setConfirmationDialog({
      title: "Lokale Sitzung löschen?",
      message:
        "Das Spiel wird nicht aufgegeben. Für den Wiedereinstieg brauchst Du den Wiederverbindungslink.",
      confirmLabel: "Sitzung löschen",
      tone: "danger",
      onConfirm: () => {
        setOptionsDialogOpen(false);
        leaveMatch();
      },
    });
  };

  const updateDisplayName = (value: string) => {
    if (accountSession.account) return;
    setDisplayName(value);
    rememberDisplayName(value);
  };

  const copyStandardToAccount = async (
    standard: StandardDeck,
    name: string,
  ): Promise<boolean> => {
    if (!accountSession.account) return false;
    const now = new Date().toISOString();
    const copy: EditableDeck = {
      deckId: `local_${standard.side}_${runtimeRandomId().slice(0, 8)}`,
      deckVersion: "0.6.0-local",
      name,
      side: standard.side,
      identityCardId: standard.identityCardId,
      cardPoolSnapshotId: standard.cardPoolSnapshotId,
      ...(standard.cardPoolVersion
        ? { cardPoolVersion: standard.cardPoolVersion }
        : {}),
      formatProfileId: standard.formatProfileId,
      ...(standard.formatProfileVersion
        ? { formatProfileVersion: standard.formatProfileVersion }
        : {}),
      validationStatus: "needs_revalidation",
      cards: standard.cards,
      createdAt: now,
      updatedAt: now,
    };
    setAccountDeckBusy(true);
    try {
      const result = await createAccountDeck(copy, accountSession.csrfToken);
      const nextRecords = [...accountDeckRecords, result.deck];
      setAccountDeckRecords(nextRecords);
      setAccountDeckQuota(result.quota);
      applyLoadedDecks(nextRecords.map((record) => record.deck));
      setSelectedLocalDeckId(result.deck.cloudDeckId);
      selectDeckForSide(result.deck.deck);
      clearDeckValidation();
      setNotice("Standard-Deck als persönliches Deck kopiert.");
      return true;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Standard-Deck konnte nicht kopiert werden.",
      );
      return false;
    } finally {
      setAccountDeckBusy(false);
    }
  };

  const createEmptyDeck = (side: Side) => {
    const now = new Date().toISOString();
    const templateIdentity = deckTemplates.find(
      (candidate) => candidate.side === side,
    )?.identityCardId;
    const deckProfile = deckProfileForMatchCardPool(matchCardPool);
    const deck: EditableDeck = {
      deckId: `local_${side}_${runtimeRandomId().slice(0, 8)}`,
      deckVersion: "0.6.0-local",
      name: side === "runner" ? "Neues Runner-Deck" : "Neues Korp-Deck",
      side,
      identityCardId: templateIdentity ?? DEFAULT_IDENTITY_BY_SIDE[side],
      cardPoolSnapshotId: DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID,
      cardPoolVersion: deckProfile.cardPoolVersion,
      formatProfileId: deckProfile.formatProfileId,
      formatProfileVersion: deckProfile.formatProfileVersion,
      validationStatus: "needs_revalidation",
      cards: [],
      createdAt: now,
      updatedAt: now,
    };
    if (accountSession.account) {
      setAccountDeckBusy(true);
      void createAccountDeck(deck, accountSession.csrfToken)
        .then((result) => {
          const nextRecords = [...accountDeckRecords, result.deck];
          setAccountDeckRecords(nextRecords);
          setAccountDeckQuota(result.quota);
          applyLoadedDecks(nextRecords.map((record) => record.deck));
          setSelectedLocalDeckId(result.deck.cloudDeckId);
          selectDeckForSide(result.deck.deck);
          setNotice("Neues persönliches Deck angelegt.");
        })
        .catch((error) =>
          setNotice(
            error instanceof Error
              ? error.message
              : "Deck konnte nicht angelegt werden.",
          ),
        )
        .finally(() => setAccountDeckBusy(false));
      clearDeckValidation();
      return;
    }
    const nextDecks = [...localDecks, deck];
    setLocalDecks(nextDecks);
    void commitDeckLibrary(
      nextDecks,
      "Neues Deck gespeichert. Füge Karten hinzu und speichere Änderungen bewusst.",
    );
    setSelectedLocalDeckId(deck.deckId);
    selectDeckForSide(deck);
    clearDeckValidation();
  };

  const updateSelectedDeck = (nextDeck: EditableDeck) => {
    setLocalDecks((current) =>
      current.map((deck) =>
        deck.deckId === nextDeck.deckId
          ? { ...nextDeck, updatedAt: new Date().toISOString() }
          : deck,
      ),
    );
    clearDeckValidation();
  };

  const saveSelectedDeck = () => {
    if (!selectedDeck) return;
    if (accountSession.account) {
      void saveAccountDeck(selectedDeck, "Persönliches Deck gespeichert.");
      return;
    }
    void commitDeckLibrary(localDecks, "Deck gespeichert.");
  };

  const updateDeckCardQuantity = (cardId: string, quantity: number) => {
    if (!selectedDeck) return;
    const nextQuantity = Math.max(0, Math.floor(quantity));
    const existing = selectedDeck.cards.some(
      (entry) => entry.cardId === cardId,
    );
    updateSelectedDeck({
      ...selectedDeck,
      cards: (existing
        ? selectedDeck.cards.map((entry) =>
            entry.cardId === cardId
              ? { ...entry, quantity: nextQuantity }
              : entry,
          )
        : [...selectedDeck.cards, { cardId, quantity: nextQuantity }]
      ).filter((entry) => entry.quantity > 0),
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
      updatedAt: now,
    };
    if (accountSession.account) {
      setAccountDeckBusy(true);
      void createAccountDeck(copy, accountSession.csrfToken)
        .then((result) => {
          const nextRecords = [...accountDeckRecords, result.deck];
          setAccountDeckRecords(nextRecords);
          setAccountDeckQuota(result.quota);
          applyLoadedDecks(nextRecords.map((record) => record.deck));
          setSelectedLocalDeckId(result.deck.cloudDeckId);
          selectDeckForSide(result.deck.deck);
          setNotice("Persönliche Deck-Kopie gespeichert.");
        })
        .catch((error) =>
          setNotice(
            error instanceof Error
              ? error.message
              : "Deck-Kopie konnte nicht gespeichert werden.",
          ),
        )
        .finally(() => setAccountDeckBusy(false));
      clearDeckValidation();
      return;
    }
    const nextDecks = [...localDecks, copy];
    setLocalDecks(nextDecks);
    void commitDeckLibrary(nextDecks, "Deck-Kopie gespeichert.");
    setSelectedLocalDeckId(copy.deckId);
    selectDeckForSide(copy);
    clearDeckValidation();
  };

  const deleteSelectedDeck = () => {
    if (!selectedLocalDeck) return;
    if (accountSession.account) {
      setAccountDeckBusy(true);
      void deleteAccountDeck(selectedLocalDeck.deckId, accountSession.csrfToken)
        .then((result) => {
          const nextRecords = accountDeckRecords.filter(
            (record) => record.cloudDeckId !== selectedLocalDeck.deckId,
          );
          setAccountDeckRecords(nextRecords);
          setAccountDeckQuota(result.quota);
          applyLoadedDecks(nextRecords.map((record) => record.deck));
          setNotice("Persönliches Deck gelöscht.");
        })
        .catch((error) =>
          setNotice(
            error instanceof Error
              ? error.message
              : "Deck konnte nicht gelöscht werden.",
          ),
        )
        .finally(() => setAccountDeckBusy(false));
      clearDeckValidation();
      return;
    }
    const nextDecks = localDecks.filter(
      (deck) => deck.deckId !== selectedLocalDeck.deckId,
    );
    setLocalDecks(nextDecks);
    setSelectedLocalDeckId(nextDecks[0]?.deckId ?? null);
    void commitDeckLibrary(nextDecks, "Deck gelöscht.");
    clearDeckValidation();
  };

  const validateSelectedDeck = async () => {
    if (!selectedDeck) return;
    if (accountSession.account) {
      try {
        setAccountDeckBusy(true);
        const saved = await saveAccountDeck(selectedDeck);
        const result = await snapshotAccountDeck(
          saved.deckId,
          accountSession.csrfToken,
        );
        setValidatedSnapshot(result.snapshot);
        setDeckValidation(result.snapshot.validation);
        setNotice("Persönliches Deck gespeichert und validiert.");
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Deck braucht noch Korrekturen.",
        );
      } finally {
        setAccountDeckBusy(false);
      }
      return;
    }
    const result = await fetch("/api/decks/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deck: selectedDeck }),
    }).then((response) => response.json() as Promise<DeckValidationResponse>);
    if (result.error) {
      setNotice(result.error.message);
      return;
    }
    setDeckValidation(result.validation);
    setValidatedSnapshot(result.snapshot);
    setNotice(
      result.validation.ok
        ? "Deck validiert."
        : "Deck braucht noch Korrekturen.",
    );
  };

  const useValidatedDeckForMatch = () => {
    if (!validatedSnapshot) return;
    if (validatedSnapshot.side === "runner") {
      setRunnerLocalSnapshot(validatedSnapshot);
    } else {
      setCorpLocalSnapshot(validatedSnapshot);
    }
    if (selectedDeck) selectDeckForSide(selectedDeck);
    setEntryTab("play");
    setNotice("Deck-Snapshot für Match Setup gesetzt.");
  };

  const useValidatedDeckForNextMatch = () => {
    if (!validatedSnapshot) return;
    if (validatedSnapshot.side === "runner") {
      setRunnerLocalSnapshot(validatedSnapshot);
    } else {
      setCorpLocalSnapshot(validatedSnapshot);
    }
    if (selectedDeck) selectDeckForSide(selectedDeck);
    setNotice("Deck-Snapshot für den nächsten Matchstart vorgemerkt.");
  };

  const exportSelectedDeck = () => {
    if (!selectedDeck) return;
    setDeckExportText(
      `${JSON.stringify({ schemaVersion: "editable-deck-v0.6", deck: selectedDeck }, null, 2)}\n`,
    );
  };

  const importLocalDeck = () => {
    let parsed: { deck?: EditableDeck };
    try {
      parsed = JSON.parse(deckImportText) as { deck?: EditableDeck };
    } catch {
      setNotice("Deck-Import konnte nicht gelesen werden.");
      return;
    }
    if (
      !parsed.deck ||
      (parsed.deck.side !== "runner" && parsed.deck.side !== "corp")
    ) {
      setNotice("Deck-Import konnte nicht gelesen werden.");
      return;
    }
    const now = new Date().toISOString();
    const imported = {
      ...parsed.deck,
      deckId:
        parsed.deck.deckId || `local_import_${runtimeRandomId().slice(0, 8)}`,
      createdAt: parsed.deck.createdAt || now,
      updatedAt: now,
    };
    if (accountSession.account) {
      setAccountDeckBusy(true);
      void createAccountDeck(imported, accountSession.csrfToken)
        .then((result) => {
          const nextRecords = [...accountDeckRecords, result.deck];
          setAccountDeckRecords(nextRecords);
          setAccountDeckQuota(result.quota);
          applyLoadedDecks(nextRecords.map((record) => record.deck));
          setSelectedLocalDeckId(result.deck.cloudDeckId);
          selectDeckForSide(result.deck.deck);
          setNotice("Deck als persönliches Server-Deck importiert.");
        })
        .catch((error) =>
          setNotice(
            error instanceof Error
              ? error.message
              : "Deck-Import konnte nicht gespeichert werden.",
          ),
        )
        .finally(() => setAccountDeckBusy(false));
      clearDeckValidation();
      return;
    }
    const nextDecks = [
      ...localDecks.filter((deck) => deck.deckId !== imported.deckId),
      imported,
    ];
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

  async function saveAccountDeck(
    deck: EditableDeck,
    successNotice?: string,
  ): Promise<EditableDeck> {
    const current = accountDeckRecords.find(
      (record) => record.cloudDeckId === deck.deckId,
    );
    if (!current)
      throw new Error(
        "Persönliches Deck wurde nicht gefunden. Bitte neu laden.",
      );
    setAccountDeckBusy(true);
    try {
      const result = await updateAccountDeck(
        deck,
        current.deckVersion,
        accountSession.csrfToken,
      );
      const nextRecords = accountDeckRecords.map((record) =>
        record.cloudDeckId === result.deck.cloudDeckId ? result.deck : record,
      );
      setAccountDeckRecords(nextRecords);
      setLocalDecks(nextRecords.map((record) => record.deck));
      setSavedDeckFingerprints((currentFingerprints) => ({
        ...currentFingerprints,
        [result.deck.cloudDeckId]: deckFingerprint(result.deck.deck),
      }));
      if (successNotice) setNotice(successNotice);
      return result.deck.deck;
    } finally {
      setAccountDeckBusy(false);
    }
  }

  async function commitDeckLibrary(
    nextDecks: EditableDeck[],
    successNotice: string,
  ) {
    try {
      const result = await persistDeckLibrary(nextDecks);
      setLocalDecks(result.decks);
      setSavedDeckFingerprints(
        Object.fromEntries(
          result.decks.map((deck) => [deck.deckId, deckFingerprint(deck)]),
        ),
      );
      if (result.storagePath) setDeckLibraryStoragePath(result.storagePath);
      setNotice(successNotice);
    } catch {
      setNotice(
        "Deck konnte nicht in der lokalen Datei-Deckbibliothek gespeichert werden.",
      );
    }
  }

  async function persistDeckLibrary(
    nextDecks: EditableDeck[],
  ): Promise<{ decks: EditableDeck[]; storagePath?: string }> {
    const persistenceDecks = mergeVisibleGuestDecks(
      guestDeckBacking.length > 0 ? guestDeckBacking : nextDecks,
      nextDecks,
    );
    const response = await fetch("/api/decks/library", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decks: persistenceDecks }),
    });
    const data = (await response.json()) as DeckLibraryResponse;
    if (!response.ok || data.error)
      throw new Error(data.error?.message ?? "deck_library_save_failed");
    const persistedDecks = data.decks ?? persistenceDecks;
    setGuestDeckBacking(persistedDecks);
    return {
      decks: visibleGuestDecks(persistedDecks),
      ...(data.storagePath ? { storagePath: data.storagePath } : {}),
    };
  }

  function applyLoadedDecks(decks: EditableDeck[]) {
    const firstRunnerDeckId =
      decks.find((deck) => deck.side === "runner")?.deckId ?? "";
    const firstCorpDeckId =
      decks.find((deck) => deck.side === "corp")?.deckId ?? "";
    const hasRunnerDeck = firstRunnerDeckId.length > 0;
    const hasCorpDeck = firstCorpDeckId.length > 0;
    setLocalDecks(decks);
    setSelectedLocalDeckId(decks[0]?.deckId ?? null);
    setSavedDeckFingerprints(
      Object.fromEntries(
        decks.map((deck) => [deck.deckId, deckFingerprint(deck)]),
      ),
    );
    setSelectedRunnerLocalDeckId((current) =>
      hasRunnerDeck &&
      decks.some((deck) => deck.side === "runner" && deck.deckId === current)
        ? current
        : firstRunnerDeckId,
    );
    setSelectedCorpLocalDeckId((current) =>
      hasCorpDeck &&
      decks.some((deck) => deck.side === "corp" && deck.deckId === current)
        ? current
        : firstCorpDeckId,
    );
    setSelectedParticipantBRunnerLocalDeckId((current) =>
      hasRunnerDeck &&
      decks.some((deck) => deck.side === "runner" && deck.deckId === current)
        ? current
        : firstRunnerDeckId,
    );
    setSelectedParticipantBCorpLocalDeckId((current) =>
      hasCorpDeck &&
      decks.some((deck) => deck.side === "corp" && deck.deckId === current)
        ? current
        : firstCorpDeckId,
    );
    if (!hasStoredMatchStartSettingsRef.current) {
      if (hasRunnerDeck) setRunnerDeckSource("local");
      if (hasCorpDeck) setCorpDeckSource("local");
    }
  }

  function selectDeckForSide(deck: EditableDeck) {
    if (deck.side === "runner") {
      setSelectedRunnerLocalDeckId(deck.deckId);
      setRunnerDeckSource("local");
      setSelectedParticipantBRunnerLocalDeckId(deck.deckId);
      setParticipantBRunnerDeckSource("local");
    } else {
      setSelectedCorpLocalDeckId(deck.deckId);
      setCorpDeckSource("local");
      setSelectedParticipantBCorpLocalDeckId(deck.deckId);
      setParticipantBCorpDeckSource("local");
    }
  }

  async function validateDeckForMatch(
    deck: EditableDeck,
  ): Promise<DeckSnapshot> {
    if (accountSession.account) {
      const current = accountDeckRecords.find(
        (record) => record.cloudDeckId === deck.deckId,
      );
      if (!current)
        throw new Error(
          "Persönliches Deck wurde nicht gefunden. Bitte neu laden.",
        );
      let savedDeck = deck;
      if (deckFingerprint(deck) !== savedDeckFingerprints[deck.deckId])
        savedDeck = await saveAccountDeck(deck);
      const result = await snapshotAccountDeck(
        savedDeck.deckId,
        accountSession.csrfToken,
      );
      if (deck.side === "runner") setRunnerLocalSnapshot(result.snapshot);
      else setCorpLocalSnapshot(result.snapshot);
      return result.snapshot;
    }
    const result = await fetch("/api/decks/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deck, matchCardPool }),
    }).then((response) => response.json() as Promise<DeckValidationResponse>);
    if (result.error) throw new Error(result.error.message);
    if (!result.validation.ok || !result.snapshot) {
      const details =
        result.validation.errors.length > 0
          ? ` ${result.validation.errors.join(" ")}`
          : "";
      throw new Error(`${deck.name} ist nicht matchstartfähig.${details}`);
    }
    if (deck.side === "runner") setRunnerLocalSnapshot(result.snapshot);
    else setCorpLocalSnapshot(result.snapshot);
    return result.snapshot;
  }

  function applyServerMessage(message: ServerMessage) {
    if (message.type === "lobby_update") {
      setLobby(message.payload);
      setPayload(null);
      if (sessionRef.current)
        rememberRecentSession(sessionRef.current, message.payload);
      return;
    }
    if (message.type === "state_update") {
      pendingAiAdvanceKeyRef.current = null;
      const activeLobby = lobbyRef.current;
      if (activeLobby) presentMatchStartLogo(activeLobby.matchId);
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
                  isPublic: currentLobby?.isPublic ?? true,
                  side,
                  playerView: message.payload.playerView,
                  ...(message.payload.playerClock
                    ? { playerClock: message.payload.playerClock }
                    : {}),
                  legalActions: [],
                  eventTail: [],
                  opponentStatus: currentLobby?.opponentStatus ?? {
                    side: side === "runner" ? "corp" : "runner",
                    connected: false,
                  },
                }
              : null;
          return nextFromLobby;
        }
        const next = {
          ...current,
          matchStatus: message.payload.matchStatus,
          matchVersion: message.payload.matchVersion,
          playerView: message.payload.playerView,
          ...(message.payload.playerClock
            ? { playerClock: message.payload.playerClock }
            : {}),
        };
        const nextWithUndo = message.payload.pendingUndo
          ? { ...next, pendingUndo: message.payload.pendingUndo }
          : removePendingUndo(next);
        if (message.payload.playerView.winner)
          return { ...next, winner: message.payload.playerView.winner };
        const {
          winner: _winner,
          finalStateHash: _finalStateHash,
          ...withoutWinner
        } = nextWithUndo;
        return withoutWinner;
      });
      setLobby(null);
      return;
    }
    if (message.type === "legal_actions") {
      setPayload((current) =>
        current
          ? { ...current, legalActions: message.payload.legalActions }
          : current,
      );
      return;
    }
    if (message.type === "event_log_update") {
      setPayload((current) =>
        current ? { ...current, eventTail: message.payload.events } : current,
      );
      return;
    }
    if (message.type === "opponent_status") {
      setPayload((current) =>
        current ? { ...current, opponentStatus: message.payload } : current,
      );
      setLobby((current) =>
        current ? { ...current, opponentStatus: message.payload } : current,
      );
      return;
    }
    if (message.type === "ai_turn") {
      pendingAiAdvanceKeyRef.current = null;
      setPayload((current) => {
        if (!current) return current;
        if (message.payload)
          return { ...current, aiTurnPresentation: message.payload };
        const { aiTurnPresentation: _aiTurnPresentation, ...withoutAiTurn } =
          current;
        return withoutAiTurn;
      });
      return;
    }
    if (message.type === "undo_request") {
      setPaymentSupportPreselection(null);
      paymentSupportSubmittedKeyRef.current = null;
      setPaymentSupportContinuation(null);
      paymentSupportContinuationSubmittedKeyRef.current = null;
      setPayload((current) =>
        current ? { ...current, pendingUndo: message.payload } : current,
      );
      return;
    }
    if (message.type === "match_finished") {
      setPayload((current) =>
        current
          ? {
              ...current,
              winner: message.payload.winner,
              finalStateHash: message.payload.finalStateHash,
              ...(message.payload.resultSummary
                ? { resultSummary: message.payload.resultSummary }
                : {}),
              matchStatus: message.payload.matchStatus,
            }
          : current,
      );
      const activeSession = sessionRef.current;
      if (
        activeSession &&
        shouldForgetRecoveryStatus(message.payload.matchStatus)
      ) {
        clearStoredSession(activeSession);
        removeRecentSession(activeSession);
        setRecentSession(loadRecentSession());
      }
      return;
    }
    if (message.type === "error") {
      pendingAiAdvanceKeyRef.current = null;
      setPaymentSupportContinuation(null);
      paymentSupportContinuationSubmittedKeyRef.current = null;
      setNotice(message.payload.message);
      if (message.payload.code.startsWith("undo_")) {
        setUndoNotice(message.payload.message);
        setUndoPanelOpen(true);
      }
      if (message.payload.playerView) {
        setPayload((current) =>
          current
            ? {
                ...current,
                playerView: message.payload.playerView!,
                legalActions: message.payload.playerView!.legalActions,
              }
            : current,
        );
      }
    }
  }

  const statusText = useMemo(() => {
    if (!session) return "Kein Match";
    if (connection === "online") return "Verbunden";
    if (connection === "connecting") return "Verbindet";
    return "Offline";
  }, [connection, session]);
  const startLobbyBlocksSetup = Boolean(
    session && lobby && matchStartLobbyBlocksSetup(lobby.matchStatus),
  );
  const showingSessionRecovery = Boolean(session && !payload && !lobby);
  const hasRecoveryStartTab = Boolean(showingSessionRecovery || recentSession);
  const activeStartTab =
    recoveryTabSelected && hasRecoveryStartTab ? "resume" : mode;
  const canResumeRecentSession = Boolean(
    recentSession && storedSessionMatches(recentSession),
  );
  const updateAudioEnabled = (enabled: boolean) => {
    if (enabled) primeAudio(audioVolume);
    setAudioEnabled(enabled);
  };
  const handCardScale = Math.max(
    CARD_SCALE_PERCENT_MIN / 100,
    cardHandScalePercent / 100,
  );
  const zoneCardScale = Math.max(
    CARD_SCALE_PERCENT_MIN / 100,
    cardZoneScalePercent / 100,
  );
  const boardCardScale = Math.max(
    CARD_SCALE_PERCENT_MIN / 100,
    cardBoardScalePercent / 100,
  );
  const rigCardScale = Math.max(
    CARD_SCALE_PERCENT_MIN / 100,
    cardRigScalePercent / 100,
  );
  const handCardsStyle = useMemo(
    () =>
      ({
        "--cards-min-width": `${Math.round(CARD_DISPLAY_BASE_MIN_WIDTH * handCardScale)}px`,
      }) as CSSProperties,
    [handCardScale],
  );
  const ownRigCardsStyle = useMemo(
    () =>
      ({
        "--cards-min-width": `${Math.round(CARD_DISPLAY_BASE_MIN_WIDTH * rigCardScale)}px`,
      }) as CSSProperties,
    [rigCardScale],
  );
  const zoneCardsStyle = useMemo(
    () => ({ "--zone-card-scale": String(zoneCardScale) }) as CSSProperties,
    [zoneCardScale],
  );
  const boardLaneStyle = useMemo(
    () => ({ "--lane-card-scale": String(boardCardScale) }) as CSSProperties,
    [boardCardScale],
  );

  if (!session || !payload || !activeView) {
    return (
      <CardScaleSettingsContext.Provider
        value={{
          tooltipPercent: cardTooltipScalePercent,
          handPercent: cardHandScalePercent,
          archivePercent: cardArchiveScalePercent,
          zonePercent: cardZoneScalePercent,
          boardPercent: cardBoardScalePercent,
          rigPercent: cardRigScalePercent,
          specialZonePercent: cardSpecialZoneScalePercent,
        }}
      >
        <CardImagePreferenceContext.Provider
          value={{ preferGermanCardImages, showSetBadges }}
        >
          <CardTooltipSettingsContext.Provider
            value={{
              hoverOpenDelayMs: cardTooltipHoverDelayMs,
              mode: cardTooltipMode,
            }}
          >
            <main className="app" data-theme={colorScheme}>
              <header className="topbar">
                <div className="topbarStatusGroup">
                  <AppBrand
                    appName={APP_NAME}
                    iconSrc={APP_ICON_SRC}
                    wordmarkSrc={APP_WORDMARK_SRC}
                  />
                  <div className="topbarMeta">
                    <span className="topbarVersion">{APP_STATUS_LABEL}</span>
                    <ConnectionBadge text={statusText} state={connection} />
                  </div>
                </div>
              </header>
              <div className="setup v07Entry" data-testid="setup-screen">
                <nav className="entryTabs" aria-label="Startbereiche">
                  <button
                    className={`entryTab ${entryTab === "play" ? "active" : ""}`}
                    onClick={() => setEntryTab("play")}
                    type="button"
                    aria-current={entryTab === "play" ? "page" : undefined}
                  >
                    <Play size={16} />
                    Spiel
                  </button>
                  <button
                    className={`entryTab ${entryTab === "games" ? "active" : ""}`}
                    onClick={() => setEntryTab("games")}
                    type="button"
                    aria-current={entryTab === "games" ? "page" : undefined}
                  >
                    <Gamepad2 size={16} />
                    Spiele
                  </button>
                  <button
                    className={`entryTab ${entryTab === "catalog" ? "active" : ""}`}
                    onClick={() => setEntryTab("catalog")}
                    type="button"
                    aria-current={entryTab === "catalog" ? "page" : undefined}
                  >
                    <ListFilter size={16} />
                    Katalog
                  </button>
                  <button
                    className={`entryTab ${entryTab === "decks" ? "active" : ""}`}
                    onClick={() => setEntryTab("decks")}
                    type="button"
                    aria-current={entryTab === "decks" ? "page" : undefined}
                  >
                    <Layers3 size={16} />
                    Deck-Editor
                  </button>
                  <button
                    className={`entryTab ${entryTab === "recent" ? "active" : ""}`}
                    onClick={() => setEntryTab("recent")}
                    type="button"
                    aria-current={entryTab === "recent" ? "page" : undefined}
                  >
                    <Award size={16} />
                    Meine Spiele
                  </button>
                  <button
                    className={`entryTab ${entryTab === "options" ? "active" : ""}`}
                    onClick={() => setEntryTab("options")}
                    type="button"
                    aria-current={entryTab === "options" ? "page" : undefined}
                  >
                    <SlidersHorizontal size={16} />
                    Optionen
                  </button>
                  <button
                    className={`entryTab ${entryTab === "account" ? "active" : ""}`}
                    onClick={() => setEntryTab("account")}
                    type="button"
                    aria-current={entryTab === "account" ? "page" : undefined}
                  >
                    <User size={16} />
                    {accountSession.account ? "Profil" : "Account"}
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
                <div
                  className={`entryContent ${entryTab === "decks" ? "deckEntryContent" : ""}`}
                >
                  {notice ? (
                    <p className="notice entryNotice">{notice}</p>
                  ) : null}
                  {entryTab === "play" && !startLobbyBlocksSetup ? (
                    <section className="setupPanel">
                      <div
                        className={`tabs ${hasRecoveryStartTab ? "threeTabs" : ""}`}
                      >
                        <button
                          className={`tab ${activeStartTab === "host" ? "active" : ""}`}
                          onClick={() => selectStartTab("host")}
                        >
                          Match erstellen
                        </button>
                        <button
                          className={`tab ${activeStartTab === "join" ? "active" : ""}`}
                          onClick={() => selectStartTab("join")}
                        >
                          Beitreten
                        </button>
                        {hasRecoveryStartTab ? (
                          <button
                            className={`tab ${activeStartTab === "resume" ? "active" : ""}`}
                            onClick={() => selectStartTab("resume")}
                          >
                            {showingSessionRecovery
                              ? "Wieder verbinden"
                              : "Fortsetzen"}
                          </button>
                        ) : null}
                      </div>

                      {activeStartTab === "resume" ? (
                        <MatchResumePanel
                          showingSessionRecovery={showingSessionRecovery}
                          session={session}
                          connection={connection}
                          canReconnect={canReconnect}
                          recentSession={recentSession}
                          canResumeRecentSession={canResumeRecentSession}
                          onReconnect={reconnect}
                          onCopyReconnectLink={copyReconnectLink}
                          onLeaveMatch={leaveMatch}
                          onResumeRecentSession={resumeRecentSession}
                          onReconnectFromRecentSession={
                            reconnectFromRecentSession
                          }
                          onDiscardRecentSession={discardRecentSession}
                        />
                      ) : activeStartTab === "host" ? (
                        <>
                          <MatchHostConsole
                            playMode={playMode}
                            matchFormat={effectiveStartMatchFormat}
                            seriesGamesPlanned={seriesGamesPlanned}
                            matchCardPool={matchCardPool}
                            displayName={displayName}
                            identityKind={
                              accountSession.account ? "account" : "guest"
                            }
                            isHumanVsAi={isHumanVsAi}
                            humanAiSideSelection={humanAiSideSelection}
                            gameMode={gameMode}
                            runnerDifficulty={runnerDifficulty}
                            corpDifficulty={corpDifficulty}
                            aiDeckPolicyUsesPrimaryDeckSlots={
                              aiDeckPolicyUsesPrimaryDeckSlots
                            }
                            runnerSnapshots={runnerSnapshots}
                            corpSnapshots={corpSnapshots}
                            localDecks={matchStartLocalDecks}
                            standardDeckCatalogState={standardDeckCatalogState}
                            standardDeckCatalogBlocksStart={
                              standardDeckCatalogBlocksStart
                            }
                            runnerDeckSource={runnerDeckSource}
                            corpDeckSource={corpDeckSource}
                            selectedRunnerSnapshotId={selectedRunnerSnapshotId}
                            selectedCorpSnapshotId={selectedCorpSnapshotId}
                            selectedRunnerLocalDeckId={
                              selectedRunnerLocalDeckId
                            }
                            selectedCorpLocalDeckId={selectedCorpLocalDeckId}
                            isHumanVsHuman={isHumanVsHuman}
                            testSetupMode={testSetupMode}
                            startSummary={startSummary}
                            hasAiOpponent={hasAiOpponent}
                            humanSideSelection={humanSideSelection}
                            countdownSeconds={countdownSeconds}
                            isPublic={isPublic}
                            playerClockMode={playerClockMode}
                            playerClockMinutes={playerClockMinutes}
                            playerClockGraceSeconds={playerClockGraceSeconds}
                            playerClockDetailControlsDisabled={
                              playerClockDetailControlsDisabled
                            }
                            seed={seed}
                            aiTraceStartMode={aiTraceStartMode}
                            aiDeckPolicy={aiDeckPolicy}
                            participantBRunnerDeckSource={
                              participantBRunnerDeckSource
                            }
                            participantBCorpDeckSource={
                              participantBCorpDeckSource
                            }
                            selectedParticipantBRunnerSnapshotId={
                              selectedParticipantBRunnerSnapshotId
                            }
                            selectedParticipantBCorpSnapshotId={
                              selectedParticipantBCorpSnapshotId
                            }
                            selectedParticipantBRunnerLocalDeckId={
                              selectedParticipantBRunnerLocalDeckId
                            }
                            selectedParticipantBCorpLocalDeckId={
                              selectedParticipantBCorpLocalDeckId
                            }
                            aiSlotDisabled={aiSlotDisabled}
                            visibleDeckMetadataEntries={
                              visibleDeckMetadataEntries
                            }
                            onPlayMode={updatePlayMode}
                            onMatchFormat={setMatchFormat}
                            onSeriesGamesPlanned={setSeriesGamesPlanned}
                            onMatchCardPool={setMatchCardPool}
                            onDisplayName={updateDisplayName}
                            onHumanAiSideSelection={setHumanAiSideSelection}
                            onRunnerDifficulty={setRunnerDifficulty}
                            onCorpDifficulty={setCorpDifficulty}
                            onRunnerDeckSource={setRunnerDeckSource}
                            onCorpDeckSource={setCorpDeckSource}
                            onSelectedRunnerSnapshotId={
                              setSelectedRunnerSnapshotId
                            }
                            onSelectedCorpSnapshotId={setSelectedCorpSnapshotId}
                            onSelectedRunnerLocalDeckId={
                              setSelectedRunnerLocalDeckId
                            }
                            onSelectedCorpLocalDeckId={
                              setSelectedCorpLocalDeckId
                            }
                            onReloadStandardDeckCatalog={
                              reloadStandardDeckCatalog
                            }
                            onCreateMatch={createMatch}
                            onHumanSideSelection={setHumanSideSelection}
                            onCountdownSeconds={setCountdownSeconds}
                            onIsPublic={setIsPublic}
                            onPlayerClockMode={setPlayerClockMode}
                            onPlayerClockMinutes={setPlayerClockMinutes}
                            onPlayerClockGraceSeconds={
                              setPlayerClockGraceSeconds
                            }
                            onSeed={setSeed}
                            onAiTraceStartMode={setAiTraceStartMode}
                            onTestSetupMode={setTestSetupMode}
                            onAiDeckPolicy={setAiDeckPolicy}
                            onParticipantBRunnerDeckSource={
                              setParticipantBRunnerDeckSource
                            }
                            onParticipantBCorpDeckSource={
                              setParticipantBCorpDeckSource
                            }
                            onSelectedParticipantBRunnerSnapshotId={
                              setSelectedParticipantBRunnerSnapshotId
                            }
                            onSelectedParticipantBCorpSnapshotId={
                              setSelectedParticipantBCorpSnapshotId
                            }
                            onSelectedParticipantBRunnerLocalDeckId={
                              setSelectedParticipantBRunnerLocalDeckId
                            }
                            onSelectedParticipantBCorpLocalDeckId={
                              setSelectedParticipantBCorpLocalDeckId
                            }
                          />
                          {accountSession.account ? (
                            <div className="accountMatchStartPreferences">
                              <span>
                                {accountMatchStartPreferencesLoadedFor ===
                                accountSession.account.accountId
                                  ? "Deine Matchstart-Vorbelegung wird privat im Account gespeichert."
                                  : "Account-Vorbelegung wird geladen …"}
                              </span>
                              <button
                                className="button subtle"
                                type="button"
                                disabled={
                                  accountMatchStartPreferencesResetting ||
                                  accountMatchStartPreferencesLoadedFor !==
                                    accountSession.account.accountId
                                }
                                onClick={() =>
                                  void resetSavedAccountMatchStartPreferences()
                                }
                              >
                                Vorbelegungen zurücksetzen
                              </button>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <MatchJoinConsole
                          joinMatchIdTrimmed={joinMatchIdTrimmed}
                          joinTokenTrimmed={joinTokenTrimmed}
                          joinLinkInput={joinLinkInput}
                          displayName={displayName}
                          identityKind={
                            accountSession.account ? "account" : "guest"
                          }
                          runnerSnapshots={runnerSnapshots}
                          corpSnapshots={corpSnapshots}
                          localDecks={matchStartLocalDecks}
                          participantBRunnerDeckSource={
                            participantBRunnerDeckSource
                          }
                          participantBCorpDeckSource={
                            participantBCorpDeckSource
                          }
                          selectedParticipantBRunnerSnapshotId={
                            selectedParticipantBRunnerSnapshotId
                          }
                          selectedParticipantBCorpSnapshotId={
                            selectedParticipantBCorpSnapshotId
                          }
                          selectedParticipantBRunnerLocalDeckId={
                            selectedParticipantBRunnerLocalDeckId
                          }
                          selectedParticipantBCorpLocalDeckId={
                            selectedParticipantBCorpLocalDeckId
                          }
                          joinMatchId={joinMatchId}
                          joinToken={joinToken}
                          canSubmitJoin={canSubmitJoin}
                          onJoinLinkInput={updateJoinLinkInput}
                          onDisplayName={updateDisplayName}
                          onParticipantBRunnerDeckSource={
                            setParticipantBRunnerDeckSource
                          }
                          onParticipantBCorpDeckSource={
                            setParticipantBCorpDeckSource
                          }
                          onSelectedParticipantBRunnerSnapshotId={
                            setSelectedParticipantBRunnerSnapshotId
                          }
                          onSelectedParticipantBCorpSnapshotId={
                            setSelectedParticipantBCorpSnapshotId
                          }
                          onSelectedParticipantBRunnerLocalDeckId={
                            setSelectedParticipantBRunnerLocalDeckId
                          }
                          onSelectedParticipantBCorpLocalDeckId={
                            setSelectedParticipantBCorpLocalDeckId
                          }
                          onJoinMatchId={setJoinMatchId}
                          onJoinToken={setJoinToken}
                          onJoinMatch={joinMatch}
                        />
                      )}
                    </section>
                  ) : null}
                  {entryTab === "games" ? (
                    <PublicGamesPanel
                      matches={openLanMatches}
                      loading={openLanLoading}
                      error={openLanError}
                      updatedAt={openLanUpdatedAt}
                      canJoinOpen={!session}
                      rejoinableMatchIds={accountRejoinableMatchIds}
                      rejoiningMatchId={accountRejoiningMatchId}
                      onRefresh={() => void refreshOpenLanMatches()}
                      onJoinOpen={selectOpenLanMatch}
                      onRejoin={rejoinAccountPublicGame}
                    />
                  ) : null}
                  {entryTab === "catalog" ? (
                    <CatalogPanel {...catalogPanelProps} />
                  ) : null}
                  {entryTab === "decks" ? (
                    <DeckEditorPanel
                      localDecks={localDecks}
                      selectedDeck={selectedDeck}
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
                      standardDecks={
                        accountSession.account ? standardDecks : []
                      }
                      standardDeckCatalogPhase={standardDeckCatalogState.phase}
                      standardDeckCatalogRefreshing={
                        standardDeckCatalogState.refreshing
                      }
                      standardCopyBusy={accountDeckBusy}
                      {...(accountSession.account
                        ? { onCopyStandard: copyStandardToAccount }
                        : {})}
                      onReloadStandardDecks={reloadStandardDeckCatalog}
                    />
                  ) : null}
                  {entryTab === "recent" ? (
                    <RecentGamesPanel
                      results={recentGameResults}
                      loading={recentGameResultsLoading}
                      error={recentGameResultsError}
                      updatedAt={recentGameResultsUpdatedAt}
                      accountMode={Boolean(accountSession.account)}
                      onRefresh={refreshRecentGameResults}
                    />
                  ) : null}
                  {entryTab === "options" ? (
                    <OptionsPanel
                      actionCueAutoDismissMs={actionCueAutoDismissMs}
                      actionCuesEnabled={actionCuesEnabled}
                      automaticEffectCuesEnabled={automaticEffectCuesEnabled}
                      autoCorpMandatoryDrawEnabled={
                        autoCorpMandatoryDrawEnabled
                      }
                      autoDiscardEnabled={autoDiscardEnabled}
                      autoEndTurnEnabled={autoEndTurnEnabled}
                      topbarStickyEnabled={topbarStickyEnabled}
                      cyberspaceBackgroundEnabled={cyberspaceBackgroundEnabled}
                      resourceStripMode={resourceStripMode}
                      actionPanelMode={actionPanelMode}
                      aiDecisionDebugOverlayEnabled={
                        aiDecisionDebugOverlayEnabled
                      }
                      exposedCardHighlightEnabled={exposedCardHighlightEnabled}
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
                      cardSpecialZoneScalePercent={cardSpecialZoneScalePercent}
                      cardDisplayMode={cardDisplayMode}
                      preferGermanCardImages={preferGermanCardImages}
                      showSetBadges={showSetBadges}
                      chronicleDetailMode={chronicleDetailMode}
                      colorScheme={colorScheme}
                      cuePosition={cuePosition}
                      aiPacingMode={localAiPacingMode}
                      onActionCueAutoDismissMs={setActionCueAutoDismissMs}
                      onActionCuesEnabled={setActionCuesEnabled}
                      onAutomaticEffectCuesEnabled={
                        setAutomaticEffectCuesEnabled
                      }
                      onAutoCorpMandatoryDrawEnabled={
                        setAutoCorpMandatoryDrawEnabled
                      }
                      onAutoDiscardEnabled={setAutoDiscardEnabled}
                      onAutoEndTurnEnabled={setAutoEndTurnEnabled}
                      onTopbarStickyEnabled={setTopbarStickyEnabled}
                      onCyberspaceBackgroundEnabled={
                        setCyberspaceBackgroundEnabled
                      }
                      onResourceStripMode={setResourceStripMode}
                      onActionPanelMode={setActionPanelMode}
                      onAiDecisionDebugOverlayEnabled={
                        setAiDecisionDebugOverlayEnabled
                      }
                      onExposedCardHighlightEnabled={
                        setExposedCardHighlightEnabled
                      }
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
                      onCardSpecialZoneScalePercent={
                        setCardSpecialZoneScalePercent
                      }
                      onCardDisplayMode={setCardDisplayMode}
                      onPreferGermanCardImages={setPreferGermanCardImages}
                      onShowSetBadges={setShowSetBadges}
                      onChronicleDetailMode={setChronicleDetailMode}
                      onColorScheme={setColorScheme}
                      onCuePosition={setCuePosition}
                      onAiPacingMode={updateLocalAiPacingMode}
                    />
                  ) : null}
                  {entryTab === "account" ? (
                    <AccountPanel accountSession={accountSession} />
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
        rigPercent: cardRigScalePercent,
        specialZonePercent: cardSpecialZoneScalePercent,
      }}
    >
      <CardImagePreferenceContext.Provider
        value={{ preferGermanCardImages, showSetBadges }}
      >
        <CardTooltipSettingsContext.Provider
          value={{
            hoverOpenDelayMs: cardTooltipHoverDelayMs,
            mode: cardTooltipMode,
          }}
        >
          <main className={activeMatchClassName} data-theme={colorScheme}>
            {matchStartLogoMatchId ? (
              <div
                className="matchStartLogoOverlay"
                role="status"
                aria-label="Match startet"
                data-testid="match-start-logo-overlay"
              >
                <div className="matchStartLogoLockup">
                  <img
                    className="matchStartLogoIcon"
                    src={APP_ICON_SRC}
                    alt=""
                  />
                  <img
                    className="matchStartLogoWordmark"
                    src={APP_WORDMARK_SRC}
                    alt=""
                  />
                </div>
              </div>
            ) : null}
            <ActiveMatchTopbar
              topbarRef={topbarRef}
              appName={APP_NAME}
              appStatusLabel={APP_STATUS_LABEL}
              appIconSrc={APP_ICON_SRC}
              appWordmarkSrc={APP_WORDMARK_SRC}
              statusText={statusText}
              connection={connection}
              workspace={activeMatchWorkspace}
              activeMatchIsGame={activeMatchIsGame}
              undoPanelOpen={undoPanelOpen}
              pendingUndo={payload.pendingUndo}
              canReconnect={canReconnect}
              matchDetailsOpen={matchDetailsOpen}
              canStartNextSeriesGame={canStartNextSeriesGame}
              seriesTransitioning={seriesTransitioning}
              canReturnToStart={canReturnToStart}
              canForfeit={canForfeit}
              canCancelSimulation={canCancelSimulation}
              rightRailCollapsed={rightRailCollapsed}
              canRequestHumanAiAdvice={canRequestHumanAiDecisionPreview}
              humanAiAdvice={humanAiAdvice}
              humanAiAdviceError={aiDecisionDebugPreviewError}
              humanAiAdviceLoading={aiDecisionDebugPreviewLoading}
              onWorkspace={setActiveMatchWorkspace}
              onToggleUndoPanel={() => setUndoPanelOpen((open) => !open)}
              onReconnect={reconnect}
              onToggleMatchDetails={() => setMatchDetailsOpen((open) => !open)}
              onStartNextSeriesGame={startNextSeriesGame}
              onLeaveMatch={leaveMatch}
              onRequestForfeitMatch={requestForfeitMatch}
              onRequestCancelSimulation={requestCancelSimulation}
              onToggleRightRail={() =>
                setRightRailCollapsed((current) => !current)
              }
              onRequestHumanAiAdvice={() =>
                void requestHumanAiDecisionPreview()
              }
              onCloseHumanAiAdvice={() => {
                setAiDecisionDebugPreview(null);
                setAiDecisionDebugPreviewError("");
                setAiDecisionDebugPreviewLoading(false);
              }}
            />

            {matchDetailsOpen ? (
              <div
                className="matchStrip"
                id="match-details-strip"
                aria-label="Status zum aktiven Spiel"
              >
                <span title={payload.matchStatus}>
                  <strong>Status</strong> {payload.matchStatus}
                </span>
                <span title={payload.matchId}>
                  <strong>Match</strong> {shortDiagnosticsHash(payload.matchId)}
                </span>
                <span>
                  <strong>Gegenüber</strong>{" "}
                  {opponentDisplayName ??
                    sideLabel(payload.opponentStatus.side)}
                </span>
                {activeView.deckMetadata ? (
                  <span title={activeView.deckMetadata.own.deckName}>
                    <strong>Eigenes Deck</strong>{" "}
                    {activeView.deckMetadata.own.deckName}
                  </span>
                ) : null}
                {activeView.deckMetadata && humanOpponentIsAi ? (
                  <span title={activeView.deckMetadata.opponent.deckName}>
                    <strong>KI-Deck</strong>{" "}
                    {activeView.deckMetadata.opponent.deckName}
                  </span>
                ) : null}
                <span>
                  <strong>Version</strong> {payload.matchVersion}
                </span>
                <span>
                  <strong>State</strong> {activeView.stateVersion}
                </span>
                {notice ? (
                  <span className="matchStripNotice">{notice}</span>
                ) : null}
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
                cue={standaloneDamageImpact}
                queued={damageImpactQueue.length}
                onDismiss={() => setCurrentDamageImpact(null)}
              />
            ) : null}
            {activeMatchIsGame &&
            !matchEnded &&
            !currentDamageImpact &&
            !showAccessReveal &&
            !showSuccessfulRunOutcome ? (
              <OpponentActionOverlay
                cue={currentActionCue}
                queued={actionCueQueue.length}
                position={cuePosition}
                cardDetailsById={catalogDetailsById}
                displayMode={cardDisplayMode}
                canAdvanceAi={Boolean(
                  aiTurnPresentation?.canAdvanceAi && connection === "online",
                )}
                renderTitle={(cue) => {
                  const titleCard = cue.cardDefinitionId
                    ? (catalogDetailsById[cue.cardDefinitionId] ?? null)
                    : null;
                  return (
                    <OpponentCueTitle
                      cue={cue}
                      card={titleCard}
                      previewCard={
                        titleCard
                          ? visibleCardFromCatalogDetail(titleCard)
                          : null
                      }
                      displayMode={cardDisplayMode}
                      onFocusCard={focusCard}
                    />
                  );
                }}
                onPosition={setCuePosition}
                onDismiss={() => setCurrentActionCue(null)}
                onAdvanceAi={() => {
                  setCurrentActionCue(actionCueAfterAiAdvanceRequest);
                  advanceAi(
                    aiAdvanceRequestMode(localAiPacingMode, isAiVsAiMatch),
                  );
                }}
              />
            ) : null}
            {activeMatchIsGame && !matchEnded && activeView?.run ? (
              <RunTimelineOverlay
                view={activeView}
                legalActions={payload.legalActions}
                runActions={runActions}
                cardDetailsById={catalogDetailsById}
                actionDisabled={
                  Boolean(payload.winner) || connection !== "online"
                }
                highlighted={activeCueHighlight?.kind === "run"}
                corpRunAutoPassActive={
                  Boolean(currentCorpRunAutoPassKey) &&
                  corpRunAutoPassKey === currentCorpRunAutoPassKey
                }
                onAction={submitAction}
                onChoiceOption={submitChoiceOption}
                onCorpRunAutoPassEnabled={(enabled) => {
                  setCorpRunAutoPassKey(
                    enabled ? currentCorpRunAutoPassKey : null,
                  );
                  corpRunAutoPassSubmittedKeyRef.current = null;
                }}
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
                  {...(aiTurnPresentation?.activeAiSide
                    ? { activeAiSide: aiTurnPresentation.activeAiSide }
                    : {})}
                  disabled={Boolean(payload.winner) || connection !== "online"}
                  highlighted={hasDecisionCue}
                  selectedDiscardOptionIds={selectedDiscardOptionIds}
                  selectedFieldCardChoiceOptionIds={
                    selectedFieldCardChoiceOptionIds
                  }
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
                status={aiDecisionDebugTrace ? "live" : aiDecisionDebugStatus}
                error={aiDecisionDebugError}
                trace={aiDecisionDebugTrace}
                turnPlanTrace={aiDecisionDebugTurnPlanTrace}
                traceCount={aiDecisionDebugTrace ? 1 : 0}
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
                actionDisabled={
                  Boolean(payload.winner) || connection !== "online"
                }
                selectedContext={selectedActionContext}
                onAction={submitAction}
                onFocus={focusCard}
                onActionContextSelect={selectActionCard}
                onClose={() =>
                  setScoreAreaOverlays((value) => ({ ...value, corp: false }))
                }
                onPosition={(position) =>
                  setScoreAreaOverlayPositions((value) => ({
                    ...value,
                    corp: position,
                  }))
                }
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
                actionDisabled={
                  Boolean(payload.winner) || connection !== "online"
                }
                selectedContext={selectedActionContext}
                onAction={submitAction}
                onFocus={focusCard}
                onActionContextSelect={selectActionCard}
                onClose={() =>
                  setScoreAreaOverlays((value) => ({ ...value, runner: false }))
                }
                onPosition={(position) =>
                  setScoreAreaOverlayPositions((value) => ({
                    ...value,
                    runner: position,
                  }))
                }
              />
            ) : null}

            {activeMatchIsGame && activeView ? (
              <ActiveMatchResourceStrip
                view={activeView}
                agendaPointsToWin={effectiveAgendaTarget}
                actionCapacities={actionSlotCapacities}
                ariaHidden={!resourceStripVisible}
                topOffsetPx={topbarStickyEnabled ? topbarHeightPx : 0}
                observerMode={isAiVsAiMatch}
              />
            ) : null}

            {activeMatchIsGame ? (
              <div
                className={`main${rightRailCollapsed ? " rightRailCollapsed" : ""}`}
                data-testid="active-game"
              >
                <aside className="column panel sidePanel" ref={statusPanelsRef}>
                  <OpponentPanel
                    view={activeView}
                    scoreAreaCards={scoreAreaCardsBySide(
                      opponentSide(activeView.side),
                    )}
                    scoreAreaOpen={
                      scoreAreaOverlays[opponentSide(activeView.side)]
                    }
                    agendaPointsToWin={effectiveAgendaTarget}
                    scoreAreaHighlighted={zoneHighlighted(
                      activeCueHighlight,
                      opponentSide(activeView.side),
                      "scoreArea",
                    )}
                    onToggleScoreArea={() =>
                      toggleScoreAreaOverlay(opponentSide(activeView.side))
                    }
                    {...(payload.opponentStatus.displayName
                      ? { displayName: payload.opponentStatus.displayName }
                      : {})}
                  />
                  {showAiPacingFallbackControls ? (
                    <AiPacingControls
                      presentation={aiTurnPresentation}
                      mode={localAiPacingMode}
                      connection={connection}
                      observerMode={isAiVsAiMatch}
                      onMode={updateLocalAiPacingMode}
                      onAdvance={() => {
                        if (isAiVsAiMatch) updateLocalAiPacingMode("manual");
                        advanceAi(
                          aiAdvanceRequestMode(
                            localAiPacingMode,
                            isAiVsAiMatch,
                          ),
                        );
                      }}
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
                      hasHiddenContextActions={
                        legalActionSplit.contextualActions.length > 0 &&
                        selectedActionContext?.kind !== "card"
                      }
                      cardContextActive={selectedActionContext?.kind === "card"}
                      hiddenContextHint={hiddenContextHint}
                      actionCapacities={actionSlotCapacities}
                      priorityWindowHoldEnabled={priorityWindowHoldEnabled}
                      {...(aiTurnPresentation?.activeAiSide
                        ? { activeAiSide: aiTurnPresentation.activeAiSide }
                        : {})}
                      disabled={
                        Boolean(payload.winner) || connection !== "online"
                      }
                      highlighted={hasDecisionCue}
                      selectedDiscardOptionIds={selectedDiscardOptionIds}
                      selectedFieldCardChoiceOptionIds={
                        selectedFieldCardChoiceOptionIds
                      }
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
                    title={
                      isAiVsAiMatch
                        ? `Runner-KI · ${sideLabel(activeView.side)}`
                        : `Du · ${sideLabel(activeView.side)}`
                    }
                    scoreAreaCards={scoreAreaCardsBySide(activeView.side)}
                    scoreAreaOpen={scoreAreaOverlays[activeView.side]}
                    agendaPointsToWin={effectiveAgendaTarget}
                    scoreAreaHighlighted={zoneHighlighted(
                      activeCueHighlight,
                      activeView.side,
                      "scoreArea",
                    )}
                    onToggleScoreArea={() =>
                      toggleScoreAreaOverlay(activeView.side)
                    }
                  />
                  <SpecialZonesStrip
                    view={activeView}
                    cardDetailsById={catalogDetailsById}
                    displayMode={cardDisplayMode}
                    compact
                    onFocus={focusCard}
                  />
                </aside>

                <section
                  className="board boardPanel"
                  data-testid="active-board"
                >
                  {matchClockDisplay || payload.playerClock ? (
                    <div className="clockCluster" aria-label="Uhrenbereich">
                      {matchClockDisplay ? (
                        <div
                          className="matchClockStrip"
                          aria-label="Uhr für dieses Match"
                          data-testid="match-clock"
                        >
                          <span className="matchClockIcon" aria-hidden="true">
                            <Clock size={15} />
                          </span>
                          <span>
                            <strong>Match</strong>{" "}
                            {matchClockDisplay.matchElapsed}
                          </span>
                          <span>
                            <strong>{matchClockDisplay.scopeLabel}</strong>{" "}
                            {matchClockDisplay.decisionElapsed}
                          </span>
                          {matchClockDisplay.graceLabel ? (
                            <small>{matchClockDisplay.graceLabel}</small>
                          ) : null}
                        </div>
                      ) : null}
                      {payload.playerClock ? (
                        <PlayerClockStrip
                          snapshot={payload.playerClock}
                          nowMs={matchClockNowMs}
                        />
                      ) : null}
                    </div>
                  ) : null}
                  {activeView.side === "corp" ? (
                    <section
                      className="opponentRunnerBoardStrip"
                      aria-label="Runner-Bereich"
                    >
                      <RunnerOpponentZonesStrip
                        view={activeView}
                        cardDetailsById={catalogDetailsById}
                        displayMode={cardDisplayMode}
                        selectedContext={selectedActionContext}
                        contextualActions={legalActionSplit.contextualActions}
                        actionDisabled={
                          Boolean(payload.winner) || connection !== "online"
                        }
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
                        actionDisabled={
                          Boolean(payload.winner) || connection !== "online"
                        }
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
                      actionDisabled={
                        Boolean(payload.winner) || connection !== "online"
                      }
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
                        {payload.winner === "runner"
                          ? "Runner"
                          : payload.winner === "corp"
                            ? "Korp"
                            : "Draw"}{" "}
                        gewinnt.
                      </span>
                    </div>
                  ) : null}
                  <ActiveServerGrid
                    view={activeView}
                    actionDisabled={
                      Boolean(payload.winner) || connection !== "online"
                    }
                    activeHighlight={activeCueHighlight}
                    activeRunTargetIds={activeRunTargetIds}
                    activeRunIceId={activeRunIceId}
                    viewedApproachIceId={viewedApproachIceId}
                    viewedInstalledExposeCardId={viewedInstalledExposeCardId}
                    exposedCardHighlightIds={new Set(exposedCardHighlightIds)}
                    selectedActionContext={selectedActionContext}
                    selectedDiscardOptionIdSet={selectedDiscardOptionIdSet}
                    boardLaneStyle={boardLaneStyle}
                    handCardsStyle={handCardsStyle}
                    zoneCardsStyle={zoneCardsStyle}
                    cardDisplayMode={cardDisplayMode}
                    boardZoneCollapsedFor={boardZoneCollapsedFor}
                    toggleBoardZoneCollapsed={toggleBoardZoneCollapsed}
                    runActionForServer={runActionForServer}
                    cardActionsFor={cardActionsFor}
                    enrichCard={enrichCard}
                    scoreAreaCardsBySide={scoreAreaCardsBySide}
                    discardOptionForCard={discardOptionForCard}
                    toggleDiscardOption={toggleDiscardOption}
                    fieldChoiceCardProps={fieldChoiceCardProps}
                    onAction={submitAction}
                    onFocus={focusCard}
                    onActionContextSelect={selectActionCard}
                    onSelectActionContext={setSelectedActionContext}
                  />
                  <section className="section panel boardSection zoneBoardSection">
                    <ActiveRunnerZoneBoard
                      view={activeView}
                      actionDisabled={
                        Boolean(payload.winner) || connection !== "online"
                      }
                      activeHighlight={activeCueHighlight}
                      selectedActionContext={selectedActionContext}
                      selectedDiscardOptionIdSet={selectedDiscardOptionIdSet}
                      ownRigGroups={ownRigGroups}
                      ownRigCardsStyle={ownRigCardsStyle}
                      handCardsStyle={handCardsStyle}
                      zoneCardsStyle={zoneCardsStyle}
                      cardDisplayMode={cardDisplayMode}
                      boardZoneCollapsedFor={boardZoneCollapsedFor}
                      toggleBoardZoneCollapsed={toggleBoardZoneCollapsed}
                      cardActionsFor={cardActionsFor}
                      enrichCard={enrichCard}
                      discardOptionForCard={discardOptionForCard}
                      toggleDiscardOption={toggleDiscardOption}
                      fieldChoiceCardProps={fieldChoiceCardProps}
                      paymentSupportPreselection={paymentSupportPreselection}
                      onAction={submitAction}
                      onFocus={focusCard}
                      onActionContextSelect={selectActionCard}
                      onTogglePaymentSupportAbility={
                        togglePaymentSupportAbility
                      }
                    />
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
                        {...(previewHiddenSide
                          ? { hiddenSide: previewHiddenSide }
                          : {})}
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
                        <button
                          className="button wide"
                          onClick={() =>
                            setDiagnosticsOpen((current) => !current)
                          }
                        >
                          <PanelRightOpen size={15} />
                          Diagnostics
                        </button>
                      </section>
                      <DiagnosticsDrawer
                        open={diagnosticsOpen}
                        payload={payload}
                        connection={connection}
                      />
                    </>
                  ) : null}
                </aside>
              </div>
            ) : (
              <ActiveMatchWorkspaceArea
                workspace={activeMatchWorkspace}
                catalogPanelProps={catalogPanelProps}
                deckEditorPanelProps={{
                  localDecks,
                  selectedDeck,
                  selectedDeckDirty,
                  storagePath: deckLibraryStoragePath,
                  validation: deckValidation,
                  validatedSnapshot,
                  playableCards: playableCatalogCards,
                  cardDetailsById: catalogDetailsById,
                  importText: deckImportText,
                  exportText: deckExportText,
                  onCreateEmpty: createEmptyDeck,
                  onSelectDeck: setSelectedLocalDeckId,
                  onUpdateDeck: updateSelectedDeck,
                  onSave: saveSelectedDeck,
                  onUpdateQuantity: updateDeckCardQuantity,
                  onDuplicate: duplicateSelectedDeck,
                  onDelete: deleteSelectedDeck,
                  onValidate: validateSelectedDeck,
                  onUseForMatch: useValidatedDeckForNextMatch,
                  useForMatchLabel: "Für nächsten Start vormerken",
                  onExport: exportSelectedDeck,
                  onImportText: setDeckImportText,
                  onImport: importLocalDeck,
                  standardDecks: accountSession.account ? standardDecks : [],
                  standardDeckCatalogPhase: standardDeckCatalogState.phase,
                  standardDeckCatalogRefreshing:
                    standardDeckCatalogState.refreshing,
                  standardCopyBusy: accountDeckBusy,
                  ...(accountSession.account
                    ? { onCopyStandard: copyStandardToAccount }
                    : {}),
                  onReloadStandardDecks: reloadStandardDeckCatalog,
                }}
                publicGamesPanelProps={{
                  matches: openLanMatches,
                  loading: openLanLoading,
                  error: openLanError,
                  updatedAt: openLanUpdatedAt,
                  canJoinOpen: false,
                  rejoinableMatchIds: accountRejoinableMatchIds,
                  rejoiningMatchId: accountRejoiningMatchId,
                  onRefresh: () => void refreshOpenLanMatches(),
                  onJoinOpen: selectOpenLanMatch,
                  onRejoin: rejoinAccountPublicGame,
                }}
                recentGamesPanelProps={{
                  results: recentGameResults,
                  loading: recentGameResultsLoading,
                  error: recentGameResultsError,
                  updatedAt: recentGameResultsUpdatedAt,
                  accountMode: Boolean(accountSession.account),
                  onRefresh: refreshRecentGameResults,
                }}
                optionsPanelProps={{
                  actionCueAutoDismissMs,
                  actionCuesEnabled,
                  automaticEffectCuesEnabled,
                  autoCorpMandatoryDrawEnabled,
                  autoDiscardEnabled,
                  autoEndTurnEnabled,
                  topbarStickyEnabled,
                  cyberspaceBackgroundEnabled,
                  resourceStripMode,
                  actionPanelMode,
                  aiDecisionDebugOverlayEnabled,
                  exposedCardHighlightEnabled,
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
                  cardSpecialZoneScalePercent,
                  cardDisplayMode,
                  preferGermanCardImages,
                  showSetBadges,
                  chronicleDetailMode,
                  colorScheme,
                  cuePosition,
                  aiPacingMode: localAiPacingMode,
                  session,
                  onActionCueAutoDismissMs: setActionCueAutoDismissMs,
                  onActionCuesEnabled: setActionCuesEnabled,
                  onAutomaticEffectCuesEnabled: setAutomaticEffectCuesEnabled,
                  onAutoCorpMandatoryDrawEnabled:
                    setAutoCorpMandatoryDrawEnabled,
                  onAutoDiscardEnabled: setAutoDiscardEnabled,
                  onAutoEndTurnEnabled: setAutoEndTurnEnabled,
                  onTopbarStickyEnabled: setTopbarStickyEnabled,
                  onCyberspaceBackgroundEnabled: setCyberspaceBackgroundEnabled,
                  onResourceStripMode: setResourceStripMode,
                  onActionPanelMode: setActionPanelMode,
                  onAiDecisionDebugOverlayEnabled:
                    setAiDecisionDebugOverlayEnabled,
                  onExposedCardHighlightEnabled: setExposedCardHighlightEnabled,
                  onAudioEnabled: updateAudioEnabled,
                  onAudioVolume: setAudioVolume,
                  onCardTooltipHoverDelayMs: setCardTooltipHoverDelayMs,
                  onCardTooltipMode: setCardTooltipMode,
                  onCardTooltipScalePercent: setCardTooltipScalePercent,
                  onCardHandScalePercent: setCardHandScalePercent,
                  onCardArchiveScalePercent: setCardArchiveScalePercent,
                  onCardZoneScalePercent: setCardZoneScalePercent,
                  onCardBoardScalePercent: setCardBoardScalePercent,
                  onCardRigScalePercent: setCardRigScalePercent,
                  onCardSpecialZoneScalePercent: setCardSpecialZoneScalePercent,
                  onCardDisplayMode: setCardDisplayMode,
                  onPreferGermanCardImages: setPreferGermanCardImages,
                  onShowSetBadges: setShowSetBadges,
                  onChronicleDetailMode: setChronicleDetailMode,
                  onColorScheme: setColorScheme,
                  onCuePosition: setCuePosition,
                  onAiPacingMode: updateLocalAiPacingMode,
                  onCopyReconnectLink: copyReconnectLink,
                  onDiscardLocalSession: discardLocalActiveSession,
                }}
              />
            )}
            {activeMatchIsGame && showResultModal && resultSummary ? (
              <GameOverModal
                result={resultSummary}
                side={session.side}
                playerName={isAiVsAiMatch ? "Runner-KI" : session.displayName}
                observerMode={isAiVsAiMatch}
                onDismiss={() => {
                  if (resultKey) setDismissedResultKey(resultKey);
                }}
                onNewMatch={leaveMatch}
                {...(payload?.isPublic
                  ? {
                      onReplay: () =>
                        router.push(
                          `/replays?matchId=${encodeURIComponent(session.matchId)}`,
                        ),
                    }
                  : {})}
                nextSeriesPending={seriesTransitioning}
                retentionProtected={payload?.retentionProtected === true}
                onRetentionProtection={setRetentionProtection}
                {...(isAiVsAiMatch
                  ? { opponentName: "Korp-KI" }
                  : opponentDisplayName
                    ? { opponentName: opponentDisplayName }
                    : {})}
                {...(canStartNextSeriesGame
                  ? { onNextSeriesGame: startNextSeriesGame }
                  : {})}
              />
            ) : null}
            {activeMatchIsGame &&
            showSuccessfulRunOutcome &&
            successfulRunOutcome ? (
              <SuccessfulRunOutcomeModal
                outcome={successfulRunOutcome}
                displayMode={cardDisplayMode}
                onDismiss={() =>
                  setDismissedSuccessfulRunOutcomeEventId(
                    successfulRunOutcome.eventId,
                  )
                }
                {...(successfulRunOutcomeCard
                  ? {
                      card: visibleCardFromCatalogDetail(
                        successfulRunOutcomeCard,
                      ),
                    }
                  : {})}
              />
            ) : null}
            {activeMatchIsGame &&
            !showSuccessfulRunOutcome &&
            showAccessReveal &&
            accessReveal &&
            !standaloneDamageImpact ? (
              <AccessRevealModal
                reveal={accessReveal}
                displayMode={cardDisplayMode}
                disabled={matchEnded || connection !== "online"}
                damageImpact={accessDamageImpact}
                onAction={(action) => {
                  const breach = payload?.playerView.run?.breach;
                  const continueAccess = shouldKeepAccessRevealOpen(
                    action,
                    accessReveal.hasMoreAccesses,
                  );
                  const submitted = submitAction(action);
                  if (submitted && continueAccess && breach && payload) {
                    pendingAccessContinuationRef.current = {
                      accessEventId: accessReveal.eventId,
                      breachId: breach.breachId,
                      fromStateVersion: payload.playerView.stateVersion,
                      nextAccessSubmitted: false,
                    };
                  }
                  return submitted;
                }}
                onChoiceOption={submitChoiceOption}
                onDamageDismiss={() => setCurrentDamageImpact(null)}
                onDismiss={() =>
                  dismissAccessPresentation(accessReveal.eventId)
                }
              />
            ) : null}
            {activeMatchIsGame && showExposeReview && exposeReview ? (
              <ExposeReviewModal
                review={exposeReview}
                displayMode={cardDisplayMode}
                onDismiss={() =>
                  setDismissedExposeReviewEventId(exposeReview.eventId)
                }
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
                  cyberspaceBackgroundEnabled={cyberspaceBackgroundEnabled}
                  resourceStripMode={resourceStripMode}
                  actionPanelMode={actionPanelMode}
                  aiDecisionDebugOverlayEnabled={aiDecisionDebugOverlayEnabled}
                  exposedCardHighlightEnabled={exposedCardHighlightEnabled}
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
                  cardSpecialZoneScalePercent={cardSpecialZoneScalePercent}
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
                  onAutoCorpMandatoryDrawEnabled={
                    setAutoCorpMandatoryDrawEnabled
                  }
                  onAutoDiscardEnabled={setAutoDiscardEnabled}
                  onAutoEndTurnEnabled={setAutoEndTurnEnabled}
                  onTopbarStickyEnabled={setTopbarStickyEnabled}
                  onCyberspaceBackgroundEnabled={setCyberspaceBackgroundEnabled}
                  onResourceStripMode={setResourceStripMode}
                  onActionPanelMode={setActionPanelMode}
                  onAiDecisionDebugOverlayEnabled={
                    setAiDecisionDebugOverlayEnabled
                  }
                  onExposedCardHighlightEnabled={setExposedCardHighlightEnabled}
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
                  onCardSpecialZoneScalePercent={setCardSpecialZoneScalePercent}
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

function humanAiAdviceSentence(preview: AiDecisionPreview): string {
  const label = preview.actionLabel.trim();
  switch (preview.actionType) {
    case "start_run":
      return label
        ? `Mit deinem Deck würde die KI jetzt einen Run auf ${label} starten.`
        : "Mit deinem Deck würde die KI jetzt einen Run starten.";
    case "play_event":
    case "play_operation":
      return label
        ? `Mit deinem Deck würde die KI jetzt ${label} spielen.`
        : "Mit deinem Deck würde die KI jetzt eine Karte spielen.";
    case "install_card":
      return label
        ? `Mit deinem Deck würde die KI jetzt ${label} installieren.`
        : "Mit deinem Deck würde die KI jetzt eine Karte installieren.";
    case "gain_credit":
      return "Mit deinem Deck würde die KI jetzt Credits nehmen.";
    case "draw_card":
      return "Mit deinem Deck würde die KI jetzt eine Karte ziehen.";
    default:
      return label
        ? `Mit deinem Deck würde die KI jetzt ${label} wählen.`
        : "Mit deinem Deck würde die KI jetzt die nächste verfügbare Aktion wählen.";
  }
}
