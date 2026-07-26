import { createHash, randomBytes } from "node:crypto";
import {
  assertValidAiDeckSnapshotForRuntime,
  buildAiDecisionInput,
  chooseAiAction,
  isAiDeckSnapshotRuntimeError,
  selectAiDecisionSideForState,
  type AiDeckSnapshotRuntimeErrorCode,
  type AiDeckSnapshotRuntimeExpectation,
} from "@netgrid/ai";
import { buildEngineDeck, type DeckSnapshot } from "@netgrid/decks";
import {
  applyAction,
  applyRandomizedIceInstallSelection,
  createGame,
  getLegalActions,
  getPlayerView,
  hashState,
  isHiddenInfoBarrierEvent,
  replayEvents,
  quoteRandomizedIceInstallSelection,
} from "@netgrid/engine";
import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  CURRENT_RULES_BASELINE,
  CARD_DEFINITIONS_BY_ID,
  sanitizeAiDecisionDebug,
  type ApiAiPacingMode,
  type ApiAiTurnPresentationState,
  type ApiConnectionQuality,
  type ApiGameResultReason,
  type ApiGameResultSummary,
  type ApiLifecycleResultSummary,
  type ApiLobbyChatMessage,
  type ApiLobbyParticipantPayload,
  type ApiLobbyPayload,
  type ApiMatchCardPool,
  type ApiMatchFormat,
  type ApiMatchMode,
  type ApiMatchResultSnapshot,
  type ApiMatchStartLobbyPayload,
  type ApiMatchStatus,
  type ApiSeriesPlayerSlot,
  type ApiRecentGameResult,
  type ApiRecentResultEntry,
  type ApiRecentSeriesGameResult,
  type ApiRecentSeriesResult,
  type ApiSeriesResultSummary,
  type ApiSeriesStatus,
  type ApiServicePayload,
  type ApiSidePayload,
  type ApiPlayerClockConfig,
  type ApiPlayerClockSnapshot,
  type ApiPendingUndoRequest,
  type ApiPlayerIdentityKind,
  type ApiPublicMatchListEntry,
  type ApiReplayAnalysisFrame,
  type AiDecision,
  type AiDifficulty,
  type AiDecisionDebug,
  type AiDecisionInput,
  type DeckPublicMetadata,
  type EngineError,
  type EngineRandomizedIceInstallSelectionCommand,
  type EngineResult,
  type GameEvent,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type PlayerController,
  type PlayerView,
  type PublicGameEvent,
  type RulesBaseline,
  type ReplayableEngineAction,
  type Side,
  type Winner,
} from "@netgrid/shared";
import {
  deckSetupForParticipants,
  resolveParticipantDeckSetup,
  resolveParticipantDeckPair,
  type AiDeckPolicy,
  type MatchDeckSelectionInput,
  type ParticipantDeckPairInput,
  type ResolvedDeckSetup,
  type ResolvedParticipantDeckPair,
  type ResolvedParticipantDeckSetup,
} from "./deck-setup";
import {
  projectEngineEventToServerRecord,
  projectEngineEventToPublicEvent,
  projectReplayEventsForPerspective,
  type ReplayPerspective,
  type ServerEventRecord,
} from "./event-projection";
import {
  envValue,
  LOCAL_DEFAULT_SERVER_BASE_URL,
  LOCAL_DEFAULT_TOKEN_SALT,
  LOCAL_DEFAULT_WEB_BASE_URL,
} from "./internet-hardening";
import { buildSidePayload } from "./multiplayer-payload";
import {
  buildSpectatorProjectionV1,
  type SpectatorProjectionV1,
} from "./spectator-projection";
import { chronicleTurnNumberForEvent } from "./chronicle-turn-context";
import type {
  BackupManifest,
  StorageHealth,
  StorageMaintenanceCleanupApplyInput,
  StorageMaintenanceCleanupApplyResult,
  StorageMaintenanceCleanupFilters,
  StorageMaintenanceCleanupPolicy,
  StorageMaintenanceCleanupPolicyInput,
  StorageMaintenanceCleanupPolicyRunResult,
  StorageMaintenanceCleanupPreview,
  StorageMaintenanceAiDecisionTraceDetail,
  StorageMaintenanceAiDecisionTraceIndexEntry,
  StorageMaintenanceAiDecisionTraceMatchEntry,
  StorageMaintenanceMatchDetail,
  StorageMaintenanceMatchEntry,
  StorageMaintenanceMatchFilters,
  StorageMaintenanceOptimizeResult,
  StorageMaintenanceSnapshotCompactionResult,
  StorageMaintenanceSummary,
} from "./storage-sqlite";

export type MatchStatus = ApiMatchStatus;
export type HostSideSelection = Side | "random";
export type MatchMode = ApiMatchMode;
export type MatchFormat = ApiMatchFormat;
export type MatchCardPool = ApiMatchCardPool;
export type AiPacingMode = ApiAiPacingMode;
export type AiDecisionTraceMode = "off" | "summary" | "detailed";
export type TokenKind = "join" | "session" | "reconnect";
export type UndoStatus = "requested" | "accepted" | "declined" | "blocked";
export type SeriesPlayerSlot = ApiSeriesPlayerSlot;
export type SeriesStatus = ApiSeriesStatus;
export type ConnectionQuality = ApiConnectionQuality;

const AI_DECISION_DETAIL_SECTION_TRACE_LIMIT = 8;
const AI_DECISION_DETAIL_SECTION_PRIORITY_IDS = [
  "runner_run_plan",
  "tactical_plan",
] as const;

export type MatchSettings = {
  agendaPointsToWin: number;
  matchFormat: MatchFormat;
  seriesGamesPlanned?: number;
  cardPool?: MatchCardPool;
  playerClock?: ApiPlayerClockConfig;
};

const RULE_AGENDA_POINTS_TO_WIN = 7;
const SERIES_WIN_MATCH_POINTS = 10;

export type GameResultReason = ApiGameResultReason;

export type SeriesGameResult = {
  matchId: string;
  gameNumber: number;
  winner: Side | "draw";
  reason?: GameResultReason;
  runnerPlayer: SeriesPlayerSlot;
  corpPlayer: SeriesPlayerSlot;
  runnerAgendaPoints: number;
  corpAgendaPoints: number;
  finishedAt: string;
  finalStateHash: string;
};

export type MatchSeriesState = {
  seriesId: string;
  mode: "two_game_side_swap";
  status: SeriesStatus;
  gameNumber: number;
  gamesPlanned: number;
  runnerPlayer: SeriesPlayerSlot;
  corpPlayer: SeriesPlayerSlot;
  results: SeriesGameResult[];
  previousMatchId?: string;
  nextMatchId?: string;
};

export type SeriesResultSummary = ApiSeriesResultSummary;
export type GameResultSummary = ApiGameResultSummary;
export type LifecycleResultSummary = ApiLifecycleResultSummary;
export type LobbyParticipantPayload = ApiLobbyParticipantPayload;
export type LobbyChatMessage = ApiLobbyChatMessage;

export type MatchStartLobbyState = {
  hostReady: boolean;
  joinerReady: boolean;
  countdownSeconds: 3 | 5 | 10;
  countdownStartedAt?: string;
  countdownEndsAt?: string;
  agendaPointsToWin: number;
  matchFormat: MatchFormat;
  seriesGamesPlanned?: number;
  cardPool: MatchCardPool;
  sideAssignmentMode?: "fixed" | "random_pending";
  sideAssignment: {
    runnerPlayer: SeriesPlayerSlot;
    corpPlayer: SeriesPlayerSlot;
  };
  chatMessages: LobbyChatMessage[];
};

export type MatchStartLobbyPayload = ApiMatchStartLobbyPayload;

export type MatchRecord = {
  matchId: string;
  status: MatchStatus;
  mode: MatchMode;
  matchVersion: number;
  seed?: string;
  baseline: RulesBaseline;
  settings: MatchSettings;
  deckSetup: {
    runnerSnapshotId: string;
    corpSnapshotId: string;
    runner: DeckPublicMetadata;
    corp: DeckPublicMetadata;
    assignment?: {
      runnerPlayer: SeriesPlayerSlot;
      corpPlayer: SeriesPlayerSlot;
    };
    participants?: Record<
      SeriesPlayerSlot,
      {
        runnerSnapshotId: string;
        corpSnapshotId: string;
        runner: DeckPublicMetadata;
        corp: DeckPublicMetadata;
      }
    >;
    aiDeckPolicy?: AiDeckPolicy;
  };
  aiControllers?: Partial<Record<Side, PlayerController>>;
  aiPacingMode?: AiPacingMode;
  aiTraceMode?: AiDecisionTraceMode;
  participantIdentities?: Partial<
    Record<SeriesPlayerSlot, Exclude<ApiPlayerIdentityKind, "ai">>
  >;
  isPublic: boolean;
  series?: MatchSeriesState;
  retentionProtection?: {
    protected: boolean;
    protectedAt?: string;
    protectedBySide?: Side;
  };
  playerClock?: PlayerClockState;
  createdAt: string;
  updatedAt: string;
  winner?: Side | "draw";
};

export type PlayerClockActivityState = {
  key: string;
  decisionOwnerSide: Side;
  startedAtMs: number;
  chargedMs: number;
};

export type PlayerClockBaseState = {
  consumedMs: { runner: number; corp: number };
  activity?: PlayerClockActivityState;
};

export type PlayerClockState = PlayerClockBaseState &
  (
    | {
        mode: "none";
      }
    | {
        mode: "player_clock";
        startingTimeMs: number;
        gracePeriodMs: number;
        remainingMs: { runner: number; corp: number };
        expiredSide?: Side;
      }
  );

export type SessionRecord = {
  sessionId: string;
  matchId: string;
  side: Side;
  displayName: string;
  sessionTokenHash: string;
  reconnectTokenHash: string;
  connected: boolean;
  createdAt: string;
  lastSeenAt: string;
};

export type TokenRecord = {
  tokenId: string;
  matchId: string;
  kind: TokenKind;
  allowedSide: Side;
  tokenHash: string;
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
  usedAt?: string;
};

export type StateSnapshot = {
  snapshotId: string;
  matchId: string;
  stateVersion: number;
  matchVersion: number;
  stateHash: string;
  gameState: GameState;
  createdAt: string;
  hiddenInfoBarrier: boolean;
};

export type EventRecord = ServerEventRecord;

export type ActionReceipt = {
  idempotencyKey: string;
  matchId: string;
  side: Side;
  accepted: boolean;
  stateVersionBefore: number;
  stateVersionAfter: number;
  stateHashAfter: string;
  errorCode?: string;
};

export type UndoSnapshot = {
  undoRequestId: string;
  matchId: string;
  targetEventId: string;
  snapshotId: string;
  requestedBy: Side;
  status: UndoStatus;
  hiddenInfoSafe: boolean;
};

export type PendingUndoRequest = ApiPendingUndoRequest;

export type ActionPersistenceBaseline = {
  expectedMatchVersion: number;
  expectedStateVersion: number;
  publicEventCount: number;
  engineEventCount: number;
  actionReceiptCount: number;
  aiDecisionTraceCount: number;
  loadedActionReceiptCount: number;
  loadedAiDecisionTraceCount: number;
};

export type ActionPersistenceLoadInput = {
  side: Side;
  idempotencyKey?: string;
};

export type StoredMatch = {
  match: MatchRecord;
  sessions: SessionRecord[];
  tokens: TokenRecord[];
  gameState: GameState;
  lifecycleResult?: LifecycleResultSummary;
  resultSnapshot?: ApiMatchResultSnapshot;
  startLobby?: MatchStartLobbyState;
  privateDeckSnapshots?: {
    participants: Record<
      SeriesPlayerSlot,
      { runner: DeckSnapshot; corp: DeckSnapshot }
    >;
  };
  eventLog: EventRecord[];
  actionReceipts: ActionReceipt[];
  undoSnapshots: UndoSnapshot[];
  stateSnapshots: StateSnapshot[];
  aiDecisionTraces?: AiDecisionTraceRecord[];
  pendingUndo?: PendingUndoRequest;
  actionPersistenceBaseline?: ActionPersistenceBaseline;
};

export type AiDecisionTraceRecord = {
  traceId: string;
  matchId: string;
  eventId: string;
  stateVersion: number;
  matchVersion: number;
  side: Side;
  turn: number;
  decisionIndex: number;
  selectedActionId?: string;
  selectedActionType?: string;
  planKind?: string;
  score?: number;
  confidence?: number;
  createdAt: string;
  schemaVersion: string;
  traceJson: Record<string, unknown>;
};

export type MultiplayerStorage = {
  load(
    matchId: string,
    options?: { includeStateSnapshots?: boolean },
  ): Promise<StoredMatch | undefined>;
  save(record: StoredMatch): Promise<void>;
  loadForAction?(
    matchId: string,
    input: ActionPersistenceLoadInput,
  ): Promise<StoredMatch | undefined>;
  saveActionDelta?(record: StoredMatch): Promise<void>;
  list?(): Promise<StoredMatch[]>;
  listOpenMatchCandidates?(): Promise<StoredMatch[]>;
  listPublicMatchCandidates?(): Promise<StoredMatch[]>;
  listResultSnapshotCandidates?(): Promise<StoredMatch[]>;
  listResultSnapshotCandidatesByMatchIds?(
    matchIds: readonly string[],
  ): Promise<StoredMatch[]>;
  health?(): Promise<StorageHealth>;
  backup?(
    reason?: BackupManifest["reason"],
  ): Promise<{ backupDir: string; manifest: BackupManifest }>;
  maintenanceSummary?(): Promise<StorageMaintenanceSummary>;
  maintenanceMatches?(
    filters?: StorageMaintenanceMatchFilters,
  ): Promise<StorageMaintenanceMatchEntry[]>;
  maintenanceMatchDetail?(
    matchId: string,
  ): Promise<StorageMaintenanceMatchDetail | undefined>;
  maintenanceAiDecisionTraceMatches?(): Promise<
    StorageMaintenanceAiDecisionTraceMatchEntry[]
  >;
  maintenanceAiDecisionTraceIndex?(
    matchId: string,
    filters?: { afterDecisionIndex?: number },
  ): Promise<StorageMaintenanceAiDecisionTraceIndexEntry[]>;
  maintenanceAiDecisionTraceDetail?(
    traceId: string,
  ): Promise<StorageMaintenanceAiDecisionTraceDetail | undefined>;
  maintenanceCleanupPreview?(
    filters: StorageMaintenanceCleanupFilters,
  ): Promise<StorageMaintenanceCleanupPreview>;
  maintenanceCleanupApply?(
    input: StorageMaintenanceCleanupApplyInput,
  ): Promise<StorageMaintenanceCleanupApplyResult>;
  maintenanceCleanupPolicy?(): Promise<StorageMaintenanceCleanupPolicy>;
  setMaintenanceCleanupPolicy?(
    policy: StorageMaintenanceCleanupPolicyInput,
  ): Promise<StorageMaintenanceCleanupPolicy>;
  runMaintenanceCleanupPolicy?(): Promise<StorageMaintenanceCleanupPolicyRunResult>;
  maintenanceCompactSnapshots?(): Promise<StorageMaintenanceSnapshotCompactionResult>;
  maintenanceOptimize?(): Promise<StorageMaintenanceOptimizeResult>;
  maintenanceSetRetentionProtection?(
    matchId: string,
    protectedValue: boolean,
  ): Promise<StorageMaintenanceMatchDetail | undefined>;
  close?(): void;
};

export type MatchPersistenceObserver = (record: StoredMatch) => Promise<void>;

export type SidePayload = ApiSidePayload;
export type AiTurnPresentationState = ApiAiTurnPresentationState;
export type LobbyPayload = ApiLobbyPayload;
export type ServicePayload = ApiServicePayload;

export type { ReplayPerspective } from "./event-projection";

export type ReplayIndexEntry = {
  replayId: string;
  matchId: string;
  status: MatchStatus;
  baseline: RulesBaseline;
  matchMode: MatchMode;
  matchFormat: MatchFormat;
  createdAt: string;
  updatedAt: string;
  winner?: Side | "draw";
  finalStateHash: string;
  replayCheckStatus: "unchecked" | "verified";
  replayOk?: boolean;
  participantNames: {
    runner?: string;
    corp?: string;
  };
  participantSides: Record<SeriesPlayerSlot, Side>;
};

export type OpenMatchListEntry = {
  matchId: string;
  hostDisplayName: string;
  mode: "human_vs_human";
  status: "pending";
  createdAt: string;
  ageSeconds: number;
};

export type PublicMatchListEntry = ApiPublicMatchListEntry;

export type RecentGameResultEntry = ApiRecentResultEntry;

export type ReplayStateHashCheck = {
  ok: boolean;
  expected: string;
  actual?: string;
  reason?: string;
};

export type ReplayTimelineStep = {
  eventId: string;
  index: number;
  side?: Side;
  actionType: string;
  timingPoint: string;
  label: string;
  serverLabel?: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  stateHashAfter: string;
  stateHashCheck: ReplayStateHashCheck;
  visibilityClass: PublicGameEvent["visibilityClass"] | "public";
  hiddenInfoBarrier: boolean;
  randomDrawCounters: number[];
  eventFamily: string;
  learningHint: string;
  decisionDebug?: Record<string, unknown>;
};

export type ReplayRandomDrawEntry = {
  counter: number;
  purpose: string;
  valueHash: string;
};

export type ReplayExploitSuggestion = {
  candidateId: string;
  eventId: string;
  reason: string;
  status: "review_suggestion";
};

export type ReplayView = {
  replayId: string;
  matchId: string;
  perspective: ReplayPerspective;
  metadata: ReplayIndexEntry;
  publicEvents: PublicGameEvent[];
  timeline: ReplayTimelineStep[];
  frames: ApiReplayAnalysisFrame[];
  replayErrors: string[];
  randomDrawRecords: ReplayRandomDrawEntry[];
  exploitSuggestions: ReplayExploitSuggestion[];
  localAnalysis: boolean;
};

export type ReplayAccessInput = {
  side?: Side;
  sessionToken?: string;
};

export type ReplayExportArtifact = {
  version: "1.5.0";
  exportedAt: string;
  baseline: RulesBaseline;
  perspective: Side;
  replay: ReplayView;
};

export type GamebookExportArtifact = {
  version: "gamebook-v1";
  exportedAt: string;
  markdown: string;
};

export type SafeErrorPayload = {
  code: string;
  message: string;
  currentStateVersion?: number;
  playerView?: PlayerView;
};

export type CreateMatchResult = {
  matchId: string;
  matchStatus: MatchStatus;
  isPublic: boolean;
  pendingDeckHandshake?: boolean;
  hostSide: Side;
  hostSessionToken: string;
  hostReconnectToken: string;
  joinUrl?: string;
  webSocketUrl: string;
  mode: MatchMode;
  baseline: RulesBaseline;
  playerView: PlayerView;
  legalActions: LegalAction[];
  matchVersion: number;
  lobby?: MatchStartLobbyPayload;
  pendingChoice?: PlayerView["pendingChoice"];
  playerClock?: ApiPlayerClockSnapshot;
  aiTurnPresentation?: AiTurnPresentationState;
  winner?: Side | "draw";
  finalStateHash?: string;
  resultSummary?: GameResultSummary;
};

export type JoinMatchResult = {
  matchId: string;
  isPublic: boolean;
  sessionToken: string;
  reconnectToken: string;
  side: Side;
  webSocketUrl: string;
  playerView: PlayerView;
  legalActions: LegalAction[];
  matchVersion: number;
  matchStatus?: MatchStatus;
  lobby?: MatchStartLobbyPayload;
  pendingChoice?: PlayerView["pendingChoice"];
  pendingUndo?: PendingUndoRequest & { needsResponse: boolean };
  aiTurnPresentation?: AiTurnPresentationState;
  playerClock?: ApiPlayerClockSnapshot;
  winner?: Side | "draw";
  finalStateHash?: string;
  resultSummary?: GameResultSummary;
};

export type ReconnectResult = JoinMatchResult & {
  eventTail: PublicGameEvent[];
};

export type MaintenanceRecoveryAccessResult = {
  matchId: string;
  side: Side;
  access: string;
  displayName: string;
  webSocketUrl: string;
  matchStatus: MatchStatus;
  matchVersion: number;
  issuedAt: string;
};

export type LobbyActionResult =
  | {
      ok: true;
      actorPayload: LobbyPayload | SidePayload;
      opponentPayload?: LobbyPayload | SidePayload;
      activated?: boolean;
    }
  | {
      ok: false;
      error: SafeErrorPayload;
      payload?: LobbyPayload | SidePayload;
    };

export type LifecycleActionResult =
  | {
      ok: true;
      actorPayload: LobbyPayload | SidePayload;
      opponentPayload?: LobbyPayload | SidePayload;
      newMatch?: CreateMatchResult;
    }
  | {
      ok: false;
      error: SafeErrorPayload;
      payload?: LobbyPayload | SidePayload;
    };

export type SubmitActionResult =
  | {
      ok: true;
      receipt: ActionReceipt;
      actorPayload: SidePayload;
      opponentPayload: SidePayload;
      publicEvent?: PublicGameEvent;
    }
  | {
      ok: false;
      receipt?: ActionReceipt;
      error: SafeErrorPayload;
      payload?: SidePayload;
    };

export type UndoResult =
  | {
      ok: true;
      requesterPayload: SidePayload;
      opponentPayload: SidePayload;
      undoRequest?: PendingUndoRequest;
    }
  | {
      ok: false;
      error: SafeErrorPayload;
      payload?: SidePayload;
    };

export type AdvanceAiResult =
  | {
      ok: true;
      requesterPayload: SidePayload;
      opponentPayload: SidePayload;
      publicEvent?: PublicGameEvent;
    }
  | {
      ok: false;
      error: SafeErrorPayload;
      payload?: SidePayload;
    };

export type AiDecisionPreview = {
  matchId: string;
  matchVersion: number;
  stateVersion: number;
  requestedBy: Side;
  side: Side;
  generatedAt: string;
  actionId: string;
  actionType: LegalAction["type"];
  actionLabel: string;
  reasonCode: string;
  explanation: string;
  fallbackUsed: boolean;
  timeoutUsed?: boolean;
  confidence?: number;
  selectedChoices?: PlayerAction["selectedChoices"];
  detail: Record<string, unknown>;
};

export type PreviewAiResult =
  | {
      ok: true;
      preview: AiDecisionPreview;
    }
  | {
      ok: false;
      error: SafeErrorPayload;
    };

type AiDecisionChooser = typeof chooseAiAction;
type EngineActionApplier = typeof applyAction;
type EngineRandomizedIceInstallSelectionApplier =
  typeof applyRandomizedIceInstallSelection;
type AiStepFailureCode =
  | "ai_no_action"
  | "ai_decision_action_not_legal"
  | "ai_engine_action_rejected"
  | AiDeckSnapshotRuntimeErrorCode;
type AiStepResult =
  | { ok: true }
  | {
      ok: false;
      code: AiStepFailureCode;
      engineErrorCode?: EngineError["code"];
    };

export class InMemoryMatchStorage implements MultiplayerStorage {
  private readonly records = new Map<string, StoredMatch>();

  async load(
    matchId: string,
    _options: { includeStateSnapshots?: boolean } = {},
  ): Promise<StoredMatch | undefined> {
    const record = this.records.get(matchId);
    return record ? clone(record) : undefined;
  }

  async save(record: StoredMatch): Promise<void> {
    this.records.set(record.match.matchId, clone(record));
  }

  async list(): Promise<StoredMatch[]> {
    return [...this.records.values()].map((record) => clone(record));
  }

  async health(): Promise<StorageHealth> {
    return { ok: true, kind: "memory", matchCount: this.records.size };
  }
}

export class MultiplayerService {
  private readonly locks = new Map<string, Promise<void>>();
  private readonly tokenSalt: string;
  private readonly webBaseUrl: string;
  private readonly serverBaseUrl: string;
  private readonly allowHiddenInfoUndo: boolean;
  private readonly now: () => string;
  private readonly chooseAiAction: AiDecisionChooser;
  private readonly applyEngineAction: EngineActionApplier;
  private readonly applyEngineRandomizedIceInstallSelection: EngineRandomizedIceInstallSelectionApplier;
  private readonly persistenceObservers = new Set<MatchPersistenceObserver>();

  constructor(
    private readonly storage: MultiplayerStorage,
    options: {
      tokenSalt?: string;
      publicWebBaseUrl?: string;
      publicServerBaseUrl?: string;
      allowHiddenInfoUndo?: boolean;
      now?: () => string;
      chooseAiAction?: AiDecisionChooser;
      applyAction?: EngineActionApplier;
      applyRandomizedIceInstallSelection?: EngineRandomizedIceInstallSelectionApplier;
    } = {},
  ) {
    this.tokenSalt =
      options.tokenSalt ??
      envValue(process.env, "NETGRID_TOKEN_SALT") ??
      LOCAL_DEFAULT_TOKEN_SALT;
    this.webBaseUrl = trimTrailingSlash(
      options.publicWebBaseUrl ??
        envValue(process.env, "NETGRID_WEB_BASE_URL") ??
        LOCAL_DEFAULT_WEB_BASE_URL,
    );
    this.serverBaseUrl = trimTrailingSlash(
      options.publicServerBaseUrl ??
        envValue(process.env, "NETGRID_SERVER_BASE_URL") ??
        LOCAL_DEFAULT_SERVER_BASE_URL,
    );
    this.allowHiddenInfoUndo = options.allowHiddenInfoUndo ?? false;
    this.now = options.now ?? (() => new Date().toISOString());
    this.chooseAiAction = options.chooseAiAction ?? chooseAiAction;
    this.applyEngineAction = options.applyAction ?? applyAction;
    this.applyEngineRandomizedIceInstallSelection =
      options.applyRandomizedIceInstallSelection ??
      applyRandomizedIceInstallSelection;
  }

  addPersistenceObserver(observer: MatchPersistenceObserver): () => void {
    this.persistenceObservers.add(observer);
    return () => this.persistenceObservers.delete(observer);
  }

  async reconcilePersistedMatches(
    observer: MatchPersistenceObserver,
  ): Promise<number> {
    if (!this.storage.list) return 0;
    const records = await this.storage.list();
    for (const record of records) await observer(record);
    return records.length;
  }

  private async persist(record: StoredMatch): Promise<void> {
    ensureMatchResultSnapshot(record);
    await this.storage.save(record);
    for (const observer of this.persistenceObservers) await observer(record);
  }

  private async persistAction(record: StoredMatch): Promise<void> {
    ensureMatchResultSnapshot(record);
    if (record.actionPersistenceBaseline && this.storage.saveActionDelta) {
      await this.storage.saveActionDelta(record);
    } else {
      await this.storage.save(record);
    }
    for (const observer of this.persistenceObservers) await observer(record);
  }

  private async ensurePersistedResultSnapshots(
    candidates: StoredMatch[],
  ): Promise<StoredMatch[]> {
    const records: StoredMatch[] = [];
    for (const candidate of candidates) {
      if (
        !isCompletedGameStatus(candidate.match.status) ||
        candidate.resultSnapshot
      ) {
        records.push(candidate);
        continue;
      }
      const record = await this.storage.load(candidate.match.matchId);
      if (!record) continue;
      if (ensureMatchResultSnapshot(record)) await this.storage.save(record);
      records.push(record);
    }
    return records;
  }

  async createMatch(
    input: {
      hostSide: HostSideSelection;
      playMode?: "human_vs_ai";
      humanSide?: HostSideSelection;
      displayName?: string;
      identityKind?: Exclude<ApiPlayerIdentityKind, "ai">;
      participantIdentities?: Partial<
        Record<SeriesPlayerSlot, Exclude<ApiPlayerIdentityKind, "ai">>
      >;
      seed?: string;
      settings?: Partial<MatchSettings>;
      countdownSeconds?: number;
      series?: {
        seriesId: string;
        gameNumber: number;
        gamesPlanned: number;
        runnerPlayer: SeriesPlayerSlot;
        corpPlayer: SeriesPlayerSlot;
        previousResults: SeriesGameResult[];
        previousMatchId?: string;
      };
      mode?: MatchMode;
      runnerDifficulty?: AiDifficulty;
      corpDifficulty?: AiDifficulty;
      aiPacingMode?: AiPacingMode;
      aiTraceMode?: AiDecisionTraceMode;
      isPublic?: boolean;
    } & MatchDeckSelectionInput,
  ): Promise<CreateMatchResult> {
    const seed = input.seed?.trim() || `match-${randomId("seed")}`;
    const matchId = randomId("match");
    const requestedHumanSide = input.humanSide ?? input.hostSide;
    const resolvedHumanSide =
      requestedHumanSide === "random"
        ? deterministicHostSide(seed)
        : requestedHumanSide;
    const mode =
      input.playMode === "human_vs_ai"
        ? resolvedHumanSide === "runner"
          ? "human_runner_vs_corp_ai"
          : "human_corp_vs_runner_ai"
        : (input.mode ?? "human_vs_human");
    const hostSide =
      mode === "human_runner_vs_corp_ai" || mode === "ai_vs_ai"
        ? "runner"
        : mode === "human_corp_vs_runner_ai"
          ? "corp"
          : input.hostSide === "random"
            ? deterministicHostSide(seed)
            : input.hostSide;
    const joinSide = opposite(hostSide);
    const runnerPlayer =
      input.series?.runnerPlayer ??
      (mode === "ai_vs_ai" || hostSide === "runner" ? "player_a" : "player_b");
    const corpPlayer =
      input.series?.corpPlayer ??
      (mode === "ai_vs_ai"
        ? "player_b"
        : hostSide === "corp"
          ? "player_a"
          : "player_b");
    const aiPlayer = aiPlayerForMode(mode);
    const aiDeckPolicy = aiPlayer
      ? (input.aiDeckPolicy ?? "selected")
      : undefined;
    const aiPacingMode = input.aiPacingMode ?? (aiPlayer ? "paced" : undefined);
    const aiTraceMode = normalizeAiDecisionTraceMode(input.aiTraceMode);
    const isPublic = input.isPublic !== false;
    const now = this.now();
    const hostSessionToken = generateToken();
    const hostReconnectToken = generateToken();
    const joinToken = mode === "human_vs_human" ? generateToken() : undefined;
    const matchFormat = normalizeMatchFormat(input.settings?.matchFormat);
    const seriesGamesPlanned =
      matchFormat === "two_game_side_swap"
        ? normalizeSeriesGamesPlanned(
            input.series?.gamesPlanned ?? input.settings?.seriesGamesPlanned,
          )
        : undefined;
    const cardPool = normalizeMatchCardPool(input.settings?.cardPool);
    const playerClockConfig =
      mode === "ai_vs_ai"
        ? { mode: "none" as const }
        : normalizePlayerClockConfig(input.settings?.playerClock);
    const countdownSeconds = normalizeCountdownSeconds(input.countdownSeconds);
    const sideAssignmentMode =
      mode === "human_vs_human" && input.hostSide === "random"
        ? "random_pending"
        : "fixed";
    const pendingDeckHandshake =
      mode === "human_vs_human" &&
      Boolean(input.participantADecks) &&
      !input.participantBDecks;
    if (pendingDeckHandshake) {
      const hostDeckPair = resolveParticipantDeckPair(
        input.participantADecks!,
        { cardPool },
      );
      const pendingAgendaPointsToWin = agendaPointsToWinFor(
        matchFormat,
        input.settings?.agendaPointsToWin,
      );
      const session: SessionRecord = {
        sessionId: randomId("session"),
        matchId,
        side: hostSide,
        displayName: input.displayName?.trim() || "Teilnehmer A",
        sessionTokenHash: this.hashToken(hostSessionToken),
        reconnectTokenHash: this.hashToken(hostReconnectToken),
        connected: false,
        createdAt: now,
        lastSeenAt: now,
      };
      const record: StoredMatch = {
        match: {
          matchId,
          status: "pending",
          mode,
          matchVersion: 1,
          seed,
          baseline: CURRENT_RULES_BASELINE,
          settings: {
            agendaPointsToWin: pendingAgendaPointsToWin,
            matchFormat,
            ...(seriesGamesPlanned ? { seriesGamesPlanned } : {}),
            cardPool,
            ...(playerClockConfig.mode === "player_clock"
              ? { playerClock: playerClockConfig }
              : {}),
          },
          ...(playerClockConfig.mode === "player_clock"
            ? { playerClock: initialPlayerClockState(playerClockConfig) }
            : {}),
          deckSetup: {
            runnerSnapshotId: hostDeckPair.runnerSnapshot.deckSnapshotId,
            corpSnapshotId: hostDeckPair.corpSnapshot.deckSnapshotId,
            runner: hostDeckPair.runnerSnapshot.publicMetadata,
            corp: hostDeckPair.corpSnapshot.publicMetadata,
            participants: {
              player_a: publicParticipantDeckPair(hostDeckPair),
              player_b: publicParticipantDeckPair(hostDeckPair),
            },
          },
          ...(aiPacingMode ? { aiPacingMode } : {}),
          ...(aiTraceMode !== "off" ? { aiTraceMode } : {}),
          participantIdentities: {
            ...(input.participantIdentities ?? {}),
            player_a:
              input.participantIdentities?.player_a ??
              input.identityKind ??
              "guest",
          },
          ...(matchFormat === "two_game_side_swap"
            ? {
                series: {
                  seriesId: input.series?.seriesId ?? randomId("series"),
                  mode: "two_game_side_swap",
                  status: "active",
                  gameNumber: input.series?.gameNumber ?? 1,
                  gamesPlanned: seriesGamesPlanned ?? 2,
                  runnerPlayer,
                  corpPlayer,
                  results: clone(input.series?.previousResults ?? []),
                  ...(input.series?.previousMatchId
                    ? { previousMatchId: input.series.previousMatchId }
                    : {}),
                },
              }
            : {}),
          isPublic,
          createdAt: now,
          updatedAt: now,
        },
        sessions: [session],
        tokens: [
          this.tokenRecord(matchId, hostSide, "session", hostSessionToken, now),
          this.tokenRecord(
            matchId,
            hostSide,
            "reconnect",
            hostReconnectToken,
            now,
          ),
          ...(joinToken
            ? [this.tokenRecord(matchId, joinSide, "join", joinToken, now)]
            : []),
        ],
        privateDeckSnapshots: {
          participants: {
            player_a: {
              runner: clone(hostDeckPair.runnerSnapshot),
              corp: clone(hostDeckPair.corpSnapshot),
            },
            player_b: {
              runner: clone(hostDeckPair.runnerSnapshot),
              corp: clone(hostDeckPair.corpSnapshot),
            },
          },
        },
        gameState: undefined as unknown as GameState,
        startLobby: {
          hostReady: false,
          joinerReady: false,
          countdownSeconds,
          agendaPointsToWin: pendingAgendaPointsToWin,
          matchFormat,
          ...(seriesGamesPlanned ? { seriesGamesPlanned } : {}),
          cardPool,
          sideAssignmentMode,
          sideAssignment: { runnerPlayer, corpPlayer },
          chatMessages: [],
        },
        eventLog: [],
        actionReceipts: [],
        undoSnapshots: [],
        stateSnapshots: [],
      };
      await this.persist(record);
      const lobbyPayload = this.lobbyPayloadFor(record, hostSide);
      return {
        matchId,
        matchStatus: record.match.status,
        isPublic: record.match.isPublic,
        pendingDeckHandshake: true,
        hostSide,
        hostSessionToken,
        hostReconnectToken,
        ...(joinToken
          ? {
              joinUrl: `${this.webBaseUrl}/?matchId=${encodeURIComponent(matchId)}&joinToken=${encodeURIComponent(joinToken)}`,
            }
          : {}),
        webSocketUrl: this.webSocketUrl(),
        mode,
        baseline: record.match.baseline,
        playerView: undefined as unknown as PlayerView,
        legalActions: [],
        matchVersion: record.match.matchVersion,
        ...(lobbyPayload.playerClock
          ? { playerClock: lobbyPayload.playerClock }
          : {}),
        ...(lobbyPayload.startLobby ? { lobby: lobbyPayload.startLobby } : {}),
      };
    }
    const participantDeckInput =
      mode === "ai_vs_ai" && !input.participantBDecks && input.participantADecks
        ? { ...input, participantBDecks: input.participantADecks }
        : input;
    const deckResolutionPolicy =
      input.series && aiDeckPolicy ? "selected" : aiDeckPolicy;
    const participantDecks = resolveParticipantDeckSetup(participantDeckInput, {
      seed,
      ...(aiPlayer ? { aiPlayer } : {}),
      ...(mode === "ai_vs_ai"
        ? { aiPlayers: ["player_a", "player_b"] as SeriesPlayerSlot[] }
        : {}),
      ...(deckResolutionPolicy ? { aiDeckPolicy: deckResolutionPolicy } : {}),
      cardPool,
    });
    const deckSetup = deckSetupForParticipants(participantDecks, {
      runnerPlayer,
      corpPlayer,
    });
    const settings: MatchSettings = {
      agendaPointsToWin: agendaPointsToWinFor(
        matchFormat,
        input.settings?.agendaPointsToWin,
      ),
      matchFormat,
      ...(seriesGamesPlanned ? { seriesGamesPlanned } : {}),
      cardPool,
      ...(playerClockConfig.mode === "player_clock"
        ? { playerClock: playerClockConfig }
        : {}),
    };
    const baseline = baselineForMode(mode, deckSetup);
    const controllers = controllersForMode(mode, hostSide, {
      runnerDifficulty: input.runnerDifficulty ?? "normal",
      corpDifficulty: input.corpDifficulty ?? "normal",
    });
    assertValidAiDeckSnapshotsForControllers(deckSetup, controllers);
    const gameState = createGame({
      matchId,
      seed,
      baseline,
      agendaPointsToWin: settings.agendaPointsToWin,
      controllers,
      runnerDeck: deckSetup.runnerDeck,
      corpDeck: deckSetup.corpDeck,
      runnerDeckMetadata: deckSetup.runnerSnapshot.publicMetadata,
      corpDeckMetadata: deckSetup.corpSnapshot.publicMetadata,
    });

    const session: SessionRecord = {
      sessionId: randomId("session"),
      matchId,
      side: hostSide,
      displayName:
        input.displayName?.trim() ||
        (mode === "ai_vs_ai"
          ? "Beobachter"
          : hostSide === "runner"
            ? "Runner"
            : "Korp"),
      sessionTokenHash: this.hashToken(hostSessionToken),
      reconnectTokenHash: this.hashToken(hostReconnectToken),
      connected: false,
      createdAt: now,
      lastSeenAt: now,
    };

    const record: StoredMatch = {
      match: {
        matchId,
        status: mode === "human_vs_human" ? "pending" : "active",
        mode,
        matchVersion: 1,
        seed,
        baseline,
        settings,
        deckSetup: {
          runnerSnapshotId: deckSetup.runnerSnapshot.deckSnapshotId,
          corpSnapshotId: deckSetup.corpSnapshot.deckSnapshotId,
          runner: deckSetup.runnerSnapshot.publicMetadata,
          corp: deckSetup.corpSnapshot.publicMetadata,
          assignment: { runnerPlayer, corpPlayer },
          participants: publicParticipantDeckSetup(participantDecks),
          ...(aiDeckPolicy ? { aiDeckPolicy } : {}),
        },
        ...(mode === "human_vs_human"
          ? {}
          : { aiControllers: aiControllersFor(controllers) }),
        ...(aiPacingMode ? { aiPacingMode } : {}),
        ...(aiTraceMode !== "off" ? { aiTraceMode } : {}),
        ...(mode !== "ai_vs_ai"
          ? {
              participantIdentities: {
                ...(input.participantIdentities ?? {}),
                player_a:
                  input.participantIdentities?.player_a ??
                  input.identityKind ??
                  "guest",
              },
            }
          : {}),
        isPublic,
        ...(settings.matchFormat === "two_game_side_swap"
          ? {
              series: input.series
                ? {
                    seriesId: input.series.seriesId,
                    mode: "two_game_side_swap",
                    status: "active",
                    gameNumber: input.series.gameNumber,
                    gamesPlanned: seriesGamesPlanned ?? 2,
                    runnerPlayer,
                    corpPlayer,
                    results: clone(input.series.previousResults),
                    ...(input.series.previousMatchId
                      ? { previousMatchId: input.series.previousMatchId }
                      : {}),
                  }
                : {
                    seriesId: randomId("series"),
                    mode: "two_game_side_swap",
                    status: "active",
                    gameNumber: 1,
                    gamesPlanned: seriesGamesPlanned ?? 2,
                    runnerPlayer,
                    corpPlayer,
                    results: [],
                  },
            }
          : {}),
        playerClock: initialPlayerClockState(playerClockConfig),
        createdAt: now,
        updatedAt: now,
      },
      sessions: [session],
      tokens: [
        this.tokenRecord(matchId, hostSide, "session", hostSessionToken, now),
        this.tokenRecord(
          matchId,
          hostSide,
          "reconnect",
          hostReconnectToken,
          now,
        ),
        ...(joinToken
          ? [this.tokenRecord(matchId, joinSide, "join", joinToken, now)]
          : []),
      ],
      gameState,
      privateDeckSnapshots: {
        participants: privateParticipantDeckSetup(participantDecks),
      },
      eventLog: gameState.eventLog.map((event) =>
        toEventRecord(matchId, event, false),
      ),
      actionReceipts: [],
      undoSnapshots: [],
      stateSnapshots: [
        this.snapshotFor(matchId, gameState, 1, "snap_initial", false),
      ],
    };

    if (mode !== "ai_vs_ai") this.maybeRunAiAfterTransition(record);
    this.syncPlayerClock(record, now);
    await this.persist(record);
    const payload = this.payloadFor(record, hostSide);
    return {
      matchId,
      matchStatus: record.match.status,
      isPublic: record.match.isPublic,
      hostSide,
      hostSessionToken,
      hostReconnectToken,
      ...(joinToken
        ? {
            joinUrl: `${this.webBaseUrl}/?matchId=${encodeURIComponent(matchId)}&joinToken=${encodeURIComponent(joinToken)}`,
          }
        : {}),
      webSocketUrl: this.webSocketUrl(),
      mode,
      baseline,
      playerView: payload.playerView,
      legalActions: payload.legalActions,
      matchVersion: record.match.matchVersion,
      ...(payload.pendingChoice
        ? { pendingChoice: payload.pendingChoice }
        : {}),
      ...(payload.playerClock ? { playerClock: payload.playerClock } : {}),
      ...(payload.aiTurnPresentation
        ? { aiTurnPresentation: payload.aiTurnPresentation }
        : {}),
      ...(payload.winner ? { winner: payload.winner } : {}),
      ...(payload.finalStateHash
        ? { finalStateHash: payload.finalStateHash }
        : {}),
      ...(payload.resultSummary
        ? { resultSummary: payload.resultSummary }
        : {}),
    };
  }

  async startNextSeriesGame(
    matchId: string,
    input: { side: Side; sessionToken: string; displayName?: string },
  ): Promise<CreateMatchResult | { error: SafeErrorPayload }> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record)
        return {
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      const series = record.match.series;
      if (
        !series ||
        record.match.settings.matchFormat !== "two_game_side_swap"
      ) {
        return {
          error: safeError(
            "series_not_available",
            "Für dieses Match ist keine private Matchserie aktiv.",
          ),
        };
      }
      if (!isSeriesGameCompleteForNext(record)) {
        return {
          error: safeError(
            "series_game_not_finished",
            "Das nächste Serienspiel ist erst nach Spielende verfügbar.",
          ),
        };
      }

      this.finalizeSeriesGame(record);
      if (
        series.status === "finished" ||
        series.results.length >= series.gamesPlanned
      ) {
        await this.persist(record);
        return {
          error: safeError(
            "series_finished",
            "Die private Matchserie ist bereits abgeschlossen.",
          ),
        };
      }
      if (series.nextMatchId) {
        await this.persist(record);
        return {
          error: safeError(
            "series_next_exists",
            "Das nächste Serienspiel wurde bereits erstellt.",
          ),
        };
      }

      const requesterPlayer = seriesPlayerForSide(series, input.side);
      const opponentPlayer = oppositeSeriesPlayer(requesterPlayer);
      const nextHostSide =
        record.match.mode === "ai_vs_ai" ? "runner" : opposite(input.side);
      const nextGameNumber = series.gameNumber + 1;
      const nextMode = nextModeForSideSwap(record.match.mode);
      const aiDifficulty =
        record.match.aiControllers?.runner?.difficulty ??
        record.match.aiControllers?.corp?.difficulty ??
        "normal";
      const nextRunnerPlayer =
        record.match.mode === "ai_vs_ai"
          ? series.corpPlayer
          : nextHostSide === "runner"
            ? requesterPlayer
            : opponentPlayer;
      const nextCorpPlayer =
        record.match.mode === "ai_vs_ai"
          ? series.runnerPlayer
          : nextHostSide === "corp"
            ? requesterPlayer
            : opponentPlayer;
      const participantDecks = participantDeckInputsForRecord(record);
      const next = await this.createMatch({
        hostSide: nextHostSide,
        displayName: input.displayName ?? session.displayName,
        seed: `${record.gameState.seed}:series-game-${nextGameNumber}`,
        mode: nextMode,
        ...(nextMode === "human_runner_vs_corp_ai"
          ? { corpDifficulty: aiDifficulty }
          : {}),
        ...(nextMode === "human_corp_vs_runner_ai"
          ? { runnerDifficulty: aiDifficulty }
          : {}),
        ...(nextMode === "ai_vs_ai"
          ? {
              runnerDifficulty:
                record.match.aiControllers?.corp?.difficulty ?? "normal",
              corpDifficulty:
                record.match.aiControllers?.runner?.difficulty ?? "normal",
            }
          : {}),
        ...(record.match.aiPacingMode
          ? { aiPacingMode: record.match.aiPacingMode }
          : {}),
        ...(record.match.aiTraceMode
          ? { aiTraceMode: record.match.aiTraceMode }
          : {}),
        isPublic: record.match.isPublic,
        ...(record.match.deckSetup.aiDeckPolicy
          ? { aiDeckPolicy: record.match.deckSetup.aiDeckPolicy }
          : {}),
        settings: record.match.settings,
        participantADecks: participantDecks.player_a,
        participantBDecks: participantDecks.player_b,
        series: {
          seriesId: series.seriesId,
          gameNumber: nextGameNumber,
          gamesPlanned: series.gamesPlanned,
          runnerPlayer: nextRunnerPlayer,
          corpPlayer: nextCorpPlayer,
          previousResults: series.results,
          previousMatchId: record.match.matchId,
        },
      });
      series.nextMatchId = next.matchId;
      record.match.updatedAt = this.now();
      await this.persist(record);
      return next;
    });
  }

  async getJoinInfo(
    matchId: string,
    token?: string,
  ): Promise<
    | { matchId: string; status: MatchStatus; availableSide?: Side }
    | SafeErrorPayload
  > {
    const record = await this.mustLoad(matchId);
    if (!record)
      return safeError(
        "not_found",
        "Dieses private Match ist nicht verfügbar.",
      );
    if (!token) return { matchId, status: record.match.status };
    const tokenRecord = this.findToken(record, token, "join");
    if (!tokenRecord)
      return safeError(
        "invalid_token",
        "Der Join-Link ist nicht gültig oder abgelaufen.",
      );
    return {
      matchId,
      status: record.match.status,
      availableSide: tokenRecord.allowedSide,
    };
  }

  async joinMatch(
    matchId: string,
    input: {
      token?: string;
      displayName?: string;
      identityKind?: Exclude<ApiPlayerIdentityKind, "ai">;
    } & ParticipantDeckPairInput,
  ): Promise<JoinMatchResult | { error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record)
      return {
        error: safeError(
          "not_found",
          "Dieses private Match ist nicht verfügbar.",
        ),
      };
    if (isTerminalStatus(record.match.status))
      return {
        error: safeError(
          "match_terminal",
          "Dieses private Match ist bereits abgeschlossen.",
        ),
      };
    const tokenRecord = this.resolveJoinTokenForJoinInput(record, input.token);
    if (!tokenRecord)
      return {
        error: safeError(
          "invalid_token",
          "Der Join-Link ist nicht gültig oder abgelaufen.",
        ),
      };
    if (
      record.sessions.some(
        (session) => session.side === tokenRecord.allowedSide,
      )
    ) {
      return {
        error: safeError(
          "side_taken",
          "Dieses private Match ist für diesen Link nicht mehr verfügbar.",
        ),
      };
    }

    const now = this.now();
    const sessionToken = generateToken();
    const reconnectToken = generateToken();
    record.sessions.push({
      sessionId: randomId("session"),
      matchId,
      side: tokenRecord.allowedSide,
      displayName: input.displayName?.trim() || "Teilnehmer B",
      sessionTokenHash: this.hashToken(sessionToken),
      reconnectTokenHash: this.hashToken(reconnectToken),
      connected: false,
      createdAt: now,
      lastSeenAt: now,
    });
    record.match.participantIdentities = {
      ...(record.match.participantIdentities ?? {}),
      player_b: input.identityKind ?? "guest",
    };
    record.tokens = record.tokens.map((candidate) =>
      candidate.tokenId === tokenRecord.tokenId
        ? { ...candidate, usedAt: now }
        : candidate,
    );
    record.tokens.push(
      this.tokenRecord(
        matchId,
        tokenRecord.allowedSide,
        "session",
        sessionToken,
        now,
      ),
    );
    record.tokens.push(
      this.tokenRecord(
        matchId,
        tokenRecord.allowedSide,
        "reconnect",
        reconnectToken,
        now,
      ),
    );
    if (
      (record.match.status === "pending" && !record.gameState) ||
      record.match.status === "waiting_for_joiner_decks"
    ) {
      const joinerDecks: ParticipantDeckPairInput = {
        ...(input.runnerDeckSnapshotId
          ? { runnerDeckSnapshotId: input.runnerDeckSnapshotId }
          : {}),
        ...(input.corpDeckSnapshotId
          ? { corpDeckSnapshotId: input.corpDeckSnapshotId }
          : {}),
        ...(input.runnerDeckSnapshot
          ? { runnerDeckSnapshot: input.runnerDeckSnapshot }
          : {}),
        ...(input.corpDeckSnapshot
          ? { corpDeckSnapshot: input.corpDeckSnapshot }
          : {}),
      };
      if (
        !joinerDecks.runnerDeckSnapshot &&
        !joinerDecks.runnerDeckSnapshotId
      ) {
        return {
          error: safeError(
            "join_runner_deck_missing",
            "Bitte wähle ein Runner-Deck für den Beitritt.",
          ),
        };
      }
      if (!joinerDecks.corpDeckSnapshot && !joinerDecks.corpDeckSnapshotId) {
        return {
          error: safeError(
            "join_corp_deck_missing",
            "Bitte wähle ein Korp-Deck für den Beitritt.",
          ),
        };
      }
      try {
        this.activatePendingDeckHandshake(record, joinerDecks);
      } catch (error) {
        return {
          error: safeError("join_deck_invalid", deckErrorMessage(error)),
        };
      }
    } else {
      record.match.status = "active";
    }
    record.match.matchVersion += 1;
    record.match.updatedAt = now;
    if (record.match.status === "active")
      this.maybeRunAiAfterTransition(record);
    await this.persist(record);

    const currentStatus = record.match.status as MatchStatus;
    if (
      currentStatus === "ready_check" ||
      currentStatus === "countdown" ||
      currentStatus === "pending" ||
      !record.gameState
    ) {
      const lobbyPayload = this.lobbyPayloadFor(
        record,
        tokenRecord.allowedSide,
      );
      return {
        matchId,
        isPublic: record.match.isPublic,
        sessionToken,
        reconnectToken,
        side: tokenRecord.allowedSide,
        webSocketUrl: this.webSocketUrl(),
        playerView: undefined as unknown as PlayerView,
        legalActions: [],
        matchVersion: record.match.matchVersion,
        matchStatus: record.match.status,
        ...(lobbyPayload.playerClock
          ? { playerClock: lobbyPayload.playerClock }
          : {}),
        ...(lobbyPayload.startLobby ? { lobby: lobbyPayload.startLobby } : {}),
      };
    }

    const payload = this.payloadFor(record, tokenRecord.allowedSide);
    return {
      matchId,
      isPublic: record.match.isPublic,
      sessionToken,
      reconnectToken,
      side: tokenRecord.allowedSide,
      webSocketUrl: this.webSocketUrl(),
      playerView: payload.playerView,
      legalActions: payload.legalActions,
      matchVersion: record.match.matchVersion,
      ...(payload.pendingChoice
        ? { pendingChoice: payload.pendingChoice }
        : {}),
      ...(payload.playerClock ? { playerClock: payload.playerClock } : {}),
      ...(payload.aiTurnPresentation
        ? { aiTurnPresentation: payload.aiTurnPresentation }
        : {}),
      ...(payload.winner ? { winner: payload.winner } : {}),
      ...(payload.finalStateHash
        ? { finalStateHash: payload.finalStateHash }
        : {}),
      ...(payload.resultSummary
        ? { resultSummary: payload.resultSummary }
        : {}),
    };
  }

  async reconnectMatch(
    matchId: string,
    input: { side: Side; reconnectToken: string; displayName?: string },
  ): Promise<ReconnectResult | { error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record)
      return {
        error: safeError(
          "not_found",
          "Dieses private Match ist nicht verfügbar.",
        ),
      };
    const token = this.findToken(record, input.reconnectToken, "reconnect");
    if (!token)
      return {
        error: safeError("invalid_token", "Reconnect ist nicht möglich."),
      };
    const session = record.sessions.find(
      (candidate) =>
        candidate.side === input.side &&
        candidate.reconnectTokenHash === token.tokenHash,
    );
    if (!session)
      return {
        error: safeError("invalid_token", "Reconnect ist nicht möglich."),
      };

    const now = this.now();
    const sessionToken = generateToken();
    const reconnectToken = generateToken();
    this.revokeTokenByHash(record, "session", session.sessionTokenHash, now);
    this.revokeTokenByHash(
      record,
      "reconnect",
      session.reconnectTokenHash,
      now,
    );
    record.sessions = record.sessions.map((candidate) =>
      candidate.sessionId === session.sessionId
        ? {
            ...candidate,
            displayName:
              identityKindForSide(record, candidate.side) === "account"
                ? candidate.displayName
                : input.displayName?.trim() || candidate.displayName,
            sessionTokenHash: this.hashToken(sessionToken),
            reconnectTokenHash: this.hashToken(reconnectToken),
            lastSeenAt: now,
          }
        : candidate,
    );
    record.tokens.push(
      this.tokenRecord(matchId, input.side, "session", sessionToken, now),
    );
    record.tokens.push(
      this.tokenRecord(matchId, input.side, "reconnect", reconnectToken, now),
    );
    this.syncPlayerClock(record, now);
    record.match.matchVersion += 1;
    record.match.updatedAt = now;
    await this.persist(record);

    const payload = this.shouldUseLobbyPayload(record)
      ? this.lobbyPayloadFor(record, input.side)
      : this.payloadFor(record, input.side);
    return {
      matchId,
      isPublic: record.match.isPublic,
      sessionToken,
      reconnectToken,
      side: input.side,
      webSocketUrl: this.webSocketUrl(),
      playerView: isSidePayload(payload)
        ? payload.playerView
        : (undefined as unknown as PlayerView),
      legalActions: isSidePayload(payload) ? payload.legalActions : [],
      matchVersion: record.match.matchVersion,
      eventTail: payload.eventTail,
      matchStatus: payload.matchStatus,
      ...(!isSidePayload(payload) && payload.startLobby
        ? { lobby: payload.startLobby }
        : {}),
      ...(isSidePayload(payload) && payload.pendingChoice
        ? { pendingChoice: payload.pendingChoice }
        : {}),
      ...(payload.playerClock ? { playerClock: payload.playerClock } : {}),
      ...(isSidePayload(payload) && payload.pendingUndo
        ? { pendingUndo: payload.pendingUndo }
        : {}),
      ...(isSidePayload(payload) && payload.aiTurnPresentation
        ? { aiTurnPresentation: payload.aiTurnPresentation }
        : {}),
      ...(isSidePayload(payload) && payload.winner
        ? { winner: payload.winner }
        : {}),
      ...(isSidePayload(payload) && payload.finalStateHash
        ? { finalStateHash: payload.finalStateHash }
        : {}),
      ...(isSidePayload(payload) && payload.resultSummary
        ? { resultSummary: payload.resultSummary }
        : {}),
    };
  }

  async bootstrap(
    matchId: string,
    side: Side,
    sessionToken: string,
  ): Promise<SidePayload | { error: SafeErrorPayload }>;
  async bootstrap(
    matchId: string,
    side: Side,
    sessionToken: string,
    options: { allowLobby: true },
  ): Promise<ServicePayload | { error: SafeErrorPayload }>;
  async bootstrap(
    matchId: string,
    side: Side,
    sessionToken: string,
    options?: { allowLobby?: boolean },
  ): Promise<ServicePayload | { error: SafeErrorPayload }> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record)
        return {
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, side, sessionToken);
      if (!session)
        return {
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      session.lastSeenAt = this.now();
      this.syncPlayerClock(record);
      if (this.storage instanceof InMemoryMatchStorage)
        await this.persist(record);
      if (this.shouldUseLobbyPayload(record)) {
        const lobby = this.lobbyPayloadFor(record, side);
        return options?.allowLobby
          ? lobby
          : ({
              error: safeError(
                "match_pending",
                "Das Match ist noch nicht aktiv.",
              ),
            } as { error: SafeErrorPayload });
      }
      return this.payloadFor(record, side);
    });
  }

  async setConnected(
    matchId: string,
    side: Side,
    sessionToken: string,
    connected: boolean,
  ): Promise<ServicePayload | { error: SafeErrorPayload }> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record)
        return {
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, side, sessionToken);
      if (!session)
        return {
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      session.connected = connected;
      session.lastSeenAt = this.now();
      this.syncPlayerClock(record);
      let persistentLifecycleChange = false;
      if (
        !connected &&
        record.match.status === "countdown" &&
        record.startLobby
      ) {
        this.cancelCountdownFor(record, side);
        persistentLifecycleChange = true;
      }
      const persistTransientConnectionState =
        this.storage instanceof InMemoryMatchStorage;
      if (persistentLifecycleChange || persistTransientConnectionState) {
        record.match.matchVersion += 1;
        record.match.updatedAt = this.now();
        await this.persist(record);
      }
      if (this.shouldUseLobbyPayload(record))
        return this.lobbyPayloadFor(record, side);
      return this.payloadFor(record, side);
    });
  }

  async setLobbyReady(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
    ready: boolean;
  }): Promise<LobbyActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId, {
        includeStateSnapshots: false,
      });
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (
        !record.startLobby ||
        (record.match.status !== "ready_check" &&
          record.match.status !== "countdown")
      ) {
        return {
          ok: false,
          error: safeError(
            "lobby_not_available",
            "Die Startlobby ist aktuell nicht verfügbar.",
          ),
        };
      }

      this.setReadyFlagForSession(record, session, input.ready);
      if (!input.ready) this.clearCountdown(record);
      else if (
        record.startLobby.hostReady &&
        record.startLobby.joinerReady &&
        record.match.status !== "countdown"
      ) {
        this.startLobbyCountdown(record);
      }
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      await this.persist(record);
      return this.lobbyResultFor(record, input.side);
    });
  }

  async cancelLobbyCountdown(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
  }): Promise<LobbyActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId, {
        includeStateSnapshots: false,
      });
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (
        !record.startLobby ||
        (record.match.status !== "ready_check" &&
          record.match.status !== "countdown")
      ) {
        return {
          ok: false,
          error: safeError(
            "lobby_not_available",
            "Die Startlobby ist aktuell nicht verfügbar.",
          ),
        };
      }

      this.setReadyFlagForSession(record, session, false);
      this.clearCountdown(record);
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      await this.persist(record);
      return this.lobbyResultFor(record, input.side);
    });
  }

  async cancelMatch(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
  }): Promise<LifecycleActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId, {
        includeStateSnapshots: false,
      });
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (isTerminalStatus(record.match.status))
        return {
          ok: true,
          actorPayload: this.safePayloadFor(record, input.side),
        };
      if (!isHostSession(record, session))
        return {
          ok: false,
          error: safeError(
            "host_required",
            "Nur der Host kann dieses Match abbrechen.",
          ),
          payload: this.safePayloadFor(record, input.side),
        };
      const activeAiSimulation =
        record.match.mode === "ai_vs_ai" && record.match.status === "active";
      if (
        !isCancellableLobbyStatus(record.match.status) &&
        !activeAiSimulation
      ) {
        return {
          ok: false,
          error: safeError(
            "match_not_cancellable",
            "Dieses Match kann nicht mehr abgebrochen werden.",
          ),
          payload: this.safePayloadFor(record, input.side),
        };
      }

      this.terminalizeLifecycle(record, "cancelled", "cancel", input.side);
      await this.persist(record);
      return this.lifecycleResultFor(record, input.side);
    });
  }

  async leaveMatch(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
  }): Promise<LifecycleActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId, {
        includeStateSnapshots: false,
      });
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (isTerminalStatus(record.match.status))
        return {
          ok: true,
          actorPayload: this.safePayloadFor(record, input.side),
        };
      if (isHostSession(record, session))
        return {
          ok: false,
          error: safeError(
            "leave_requires_joiner",
            "Der Host bricht die Lobby über Abbrechen ab.",
          ),
          payload: this.safePayloadFor(record, input.side),
        };
      if (
        record.match.status === "pending" ||
        record.match.status === "waiting_for_joiner_decks" ||
        record.match.status === "waiting_for_runner" ||
        record.match.status === "waiting_for_corp" ||
        record.match.status === "ready_check" ||
        record.match.status === "countdown"
      ) {
        this.removeJoinerFromOpenLobby(record, session);
        await this.persist(record);
        return this.lifecycleResultFor(record, input.side);
      }
      return {
        ok: false,
        error: safeError(
          "match_not_leavable",
          "Dieses Match kann nicht als Lobby verlassen werden.",
        ),
        payload: this.safePayloadFor(record, input.side),
      };
    });
  }

  async forfeitMatch(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
  }): Promise<LifecycleActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (record.match.status === "forfeited")
        return {
          ok: true,
          actorPayload: this.payloadFor(record, input.side),
          opponentPayload: this.payloadFor(record, opposite(input.side)),
        };
      if (record.match.status !== "active" || !record.gameState) {
        return {
          ok: false,
          error: safeError(
            "match_not_active",
            "Aufgeben ist nur in aktiven Spielen möglich.",
          ),
          payload: this.safePayloadFor(record, input.side),
        };
      }
      if (this.isAiSide(record, input.side))
        return {
          ok: false,
          error: safeError(
            "ai_forfeit_forbidden",
            "Die KI gibt in V1.0.4 nicht aktiv auf.",
          ),
        };

      const now = this.now();
      const winnerSide = opposite(input.side);
      const finalEngineStateHash = hashState(record.gameState);
      record.match.status = "forfeited";
      record.match.winner = winnerSide;
      record.match.matchVersion += 1;
      record.match.updatedAt = now;
      record.lifecycleResult = {
        status: "forfeited",
        reason: "forfeit",
        occurredAt: now,
        actorSide: input.side,
        winnerSide,
        loserSide: input.side,
        finalEngineStateHash,
      };
      delete record.pendingUndo;
      this.finalizeSeriesGame(record);
      await this.persist(record);
      return this.lifecycleResultFor(record, input.side);
    });
  }

  async recreateMatch(
    matchId: string,
    input: { side: Side; sessionToken: string; displayName?: string },
  ): Promise<LifecycleActionResult> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticateForRecreate(
        record,
        input.side,
        input.sessionToken,
      );
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (record.match.status === "active") {
        return {
          ok: false,
          error: safeError(
            "match_active",
            "Ein aktives Match kann erst nach Aufgabe oder Spielende neu erstellt werden.",
          ),
          payload: this.payloadFor(record, input.side),
        };
      }
      if (
        (record.match.status === "cancelled" ||
          record.match.status === "abandoned" ||
          !isTerminalStatus(record.match.status)) &&
        !isHostSession(record, session)
      ) {
        return {
          ok: false,
          error: safeError(
            "host_required",
            "Nur der Host kann diese Lobby neu erstellen.",
          ),
          payload: this.safePayloadFor(record, input.side),
        };
      }

      const recreateInput = this.recreateInputFor(
        record,
        session,
        input.displayName,
      );
      if (!isTerminalStatus(record.match.status))
        this.terminalizeLifecycle(record, "cancelled", "cancel", input.side);
      else this.revokeAllTokens(record, this.now());
      await this.persist(record);
      const newMatch = await this.createMatch(recreateInput);
      return {
        ok: true,
        actorPayload: this.safePayloadFor(record, input.side),
        ...(record.sessions.some(
          (candidate) => candidate.side === opposite(input.side),
        )
          ? {
              opponentPayload: this.safePayloadFor(
                record,
                opposite(input.side),
              ),
            }
          : {}),
        newMatch,
      };
    });
  }

  async sendLobbyChat(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
    text: string;
  }): Promise<LobbyActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (
        !record.startLobby ||
        (record.match.status !== "ready_check" &&
          record.match.status !== "countdown")
      ) {
        return {
          ok: false,
          error: safeError(
            "lobby_not_available",
            "Der Lobbychat ist aktuell nicht verfügbar.",
          ),
        };
      }
      const text = input.text.trim().slice(0, 300);
      if (!text)
        return {
          ok: false,
          error: safeError(
            "chat_empty",
            "Leere Chatnachrichten werden nicht gesendet.",
          ),
          payload: this.lobbyPayloadFor(record, input.side),
        };

      const lastId = record.startLobby.chatMessages.at(-1)?.id ?? 0;
      record.startLobby.chatMessages = [
        ...record.startLobby.chatMessages.slice(-49),
        {
          id: lastId + 1,
          side: input.side,
          displayName: session.displayName,
          sentAt: this.now(),
          text,
        },
      ];
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      await this.persist(record);
      return this.lobbyResultFor(record, input.side);
    });
  }

  async activateLobbyCountdown(matchId: string): Promise<LobbyActionResult> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      if (!record.startLobby || record.match.status !== "countdown") {
        return {
          ok: false,
          error: safeError(
            "countdown_not_active",
            "Der Countdown läuft nicht.",
          ),
        };
      }
      if (
        new Date(record.startLobby.countdownEndsAt ?? "").getTime() >
        new Date(this.now()).getTime()
      ) {
        return {
          ok: false,
          error: safeError("countdown_not_due", "Der Countdown läuft noch."),
          payload: this.lobbyPayloadFor(
            record,
            record.sessions[0]?.side ?? "runner",
          ),
        };
      }
      if (!record.startLobby.hostReady || !record.startLobby.joinerReady) {
        this.clearCountdown(record);
        await this.persist(record);
        return {
          ok: false,
          error: safeError(
            "lobby_not_ready",
            "Beide Personen müssen bereit sein.",
          ),
          payload: this.lobbyPayloadFor(
            record,
            record.sessions[0]?.side ?? "runner",
          ),
        };
      }

      this.activateReadyLobby(record);
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      this.maybeRunAiAfterTransition(record);
      this.syncPlayerClock(record);
      await this.persist(record);
      return this.lobbyResultFor(
        record,
        record.sessions[0]?.side ?? "runner",
        true,
      );
    });
  }

  async submitAction(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
    actionId: string;
    clientKnownStateVersion: number;
    idempotencyKey: string;
    selectedTargets?: Record<string, string>;
    selectedChoices?: Record<string, unknown>;
  }): Promise<SubmitActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoadForAction(input.matchId, {
        side: input.side,
        idempotencyKey: input.idempotencyKey,
      });
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (this.isAiSide(record, input.side)) {
        return {
          ok: false,
          error: safeError(
            "ai_action_forbidden",
            "Die Beobachtersession darf keine Aktion für eine KI-Seite ausführen.",
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }
      if (record.match.status !== "active") {
        return {
          ok: false,
          error: safeError(
            "match_not_active",
            "Das Match ist noch nicht aktiv.",
          ),
        };
      }
      if (!record.gameState)
        return {
          ok: false,
          error: safeError(
            "match_not_active",
            "Das Match wartet noch auf vollständige Deckauswahl.",
          ),
        };
      if (this.syncPlayerClock(record)) {
        await this.persistAction(record);
        return {
          ok: false,
          error: safeError(
            "time_expired",
            "Die Spielerzeit ist abgelaufen.",
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }

      const duplicate = record.actionReceipts.find(
        (receipt) =>
          receipt.side === input.side &&
          receipt.idempotencyKey === input.idempotencyKey,
      );
      if (duplicate) {
        return {
          ok: true,
          receipt: duplicate,
          actorPayload: this.payloadFor(record, input.side),
          opponentPayload: this.payloadFor(record, opposite(input.side)),
        };
      }

      if (input.clientKnownStateVersion !== record.gameState.stateVersion) {
        const receipt = this.receiptFor(
          record,
          input.side,
          input.idempotencyKey,
          false,
          "stale_state",
        );
        record.actionReceipts.push(receipt);
        await this.persistAction(record);
        return {
          ok: false,
          receipt,
          error: safeError(
            "stale_state",
            "Der Spielzustand ist veraltet.",
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }

      const action: PlayerAction = {
        matchId: input.matchId,
        side: input.side,
        actionId: input.actionId,
        clientKnownStateVersion: input.clientKnownStateVersion,
        idempotencyKey: input.idempotencyKey,
        ...(input.selectedTargets
          ? { selectedTargets: input.selectedTargets }
          : {}),
        ...(input.selectedChoices
          ? { selectedChoices: input.selectedChoices }
          : {}),
      };
      const snapshot = this.snapshotFor(
        input.matchId,
        record.gameState,
        record.match.matchVersion,
        `snap_before_${record.gameState.stateVersion + 1}`,
        false,
      );
      const result = applyAction(record.gameState, action, {
        publicEventsMode: "latest",
      });
      if (!result.ok) {
        const receipt = this.receiptFor(
          record,
          input.side,
          input.idempotencyKey,
          false,
          result.error.code,
        );
        record.actionReceipts.push(receipt);
        await this.persistAction(record);
        return {
          ok: false,
          receipt,
          error: safeError(
            result.error.code,
            "Diese Aktion ist nicht legal.",
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }

      const barrier = isHiddenInfoBarrier(result.event);
      const undoSnapshot = { ...snapshot, hiddenInfoBarrier: barrier };
      record.stateSnapshots.push(undoSnapshot);
      record.gameState = result.state;
      record.eventLog.push(toEventRecord(input.matchId, result.event, barrier));
      const receipt = {
        idempotencyKey: input.idempotencyKey,
        matchId: input.matchId,
        side: input.side,
        accepted: true,
        stateVersionBefore: result.event.stateVersionBefore,
        stateVersionAfter: result.event.stateVersionAfter,
        stateHashAfter: result.stateHash,
      };
      record.actionReceipts.push(receipt);
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      if (result.state.winner) {
        this.finalizeFinishedMatch(record);
      }
      this.maybeRunAiAfterTransition(record);
      this.syncPlayerClock(record);
      await this.persistAction(record);
      const success: SubmitActionResult = {
        ok: true,
        receipt,
        actorPayload: this.payloadFor(record, input.side),
        opponentPayload: this.payloadFor(record, opposite(input.side)),
      };
      const publicEvent = result.publicEvents.at(-1);
      if (publicEvent) success.publicEvent = publicEvent;
      return success;
    });
  }

  async advanceAi(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
    knownStateVersion?: number;
    knownMatchVersion?: number;
    mode?: "single_step" | "until_human";
  }): Promise<AdvanceAiResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoadForAction(input.matchId, {
        side: input.side,
      });
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (this.isAiSide(record, input.side) && record.match.mode !== "ai_vs_ai")
        return {
          ok: false,
          error: safeError(
            "ai_session_forbidden",
            "Nur eine menschliche Session darf die KI fortsetzen.",
          ),
        };
      if (record.match.mode === "ai_vs_ai" && !isHostSession(record, session))
        return {
          ok: false,
          error: safeError(
            "host_required",
            "Nur die Beobachtersession darf die Simulation fortsetzen.",
          ),
        };
      if (record.match.status !== "active" || !record.gameState)
        return {
          ok: false,
          error: safeError(
            "match_not_active",
            "Das Match ist noch nicht aktiv.",
          ),
        };
      if (this.syncPlayerClock(record)) {
        await this.persistAction(record);
        return {
          ok: false,
          error: safeError(
            "time_expired",
            "Die Spielerzeit ist abgelaufen.",
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }
      const activeAiSide = this.aiControllableSide(record);
      if (!activeAiSide) {
        return {
          ok: false,
          error: safeError(
            "ai_not_active",
            "Aktuell ist keine KI am Zug.",
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }
      if (
        input.knownStateVersion !== undefined &&
        input.knownStateVersion !== record.gameState.stateVersion
      ) {
        return {
          ok: false,
          error: safeError(
            "stale_state",
            "Der Spielzustand ist veraltet.",
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }
      if (
        input.knownMatchVersion !== undefined &&
        input.knownMatchVersion !== record.match.matchVersion
      ) {
        return {
          ok: false,
          error: safeError(
            "stale_match",
            "Der Matchzustand ist veraltet.",
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }

      const beforeEventCount = record.eventLog.length;
      const aiStepResult =
        input.mode === "until_human" && record.match.mode !== "ai_vs_ai"
          ? this.runAiUntilNextHuman(record)
          : this.runAiStep(record);
      this.syncPlayerClock(record);

      if (
        !aiStepResult.ok &&
        aiStepResult.code === "ai_decision_action_not_legal"
      ) {
        await this.persistAction(record);
        return {
          ok: false,
          error: safeError(
            "ai_decision_action_not_legal",
            "Die KI wählte keine aktuell legale Aktion.",
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }
      if (
        !aiStepResult.ok &&
        aiStepResult.code === "ai_engine_action_rejected"
      ) {
        await this.persistAction(record);
        const engineErrorSuffix = aiStepResult.engineErrorCode
          ? ` (${aiStepResult.engineErrorCode})`
          : "";
        return {
          ok: false,
          error: safeError(
            "ai_engine_action_rejected",
            `Die von der KI gewählte LegalAction wurde von der Engine abgelehnt${engineErrorSuffix}.`,
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }
      if (!aiStepResult.ok && isAiDeckSnapshotErrorCode(aiStepResult.code)) {
        await this.persistAction(record);
        return {
          ok: false,
          error: safeError(
            aiStepResult.code,
            aiDeckSnapshotErrorMessage(aiStepResult.code),
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }

      if (record.eventLog.length === beforeEventCount) {
        await this.persistAction(record);
        return {
          ok: false,
          error: safeError(
            "ai_no_action",
            "Die KI konnte aktuell keine Aktion ausführen.",
            record.gameState,
            input.side,
          ),
          payload: this.payloadFor(record, input.side),
        };
      }

      await this.persistAction(record);
      const result: AdvanceAiResult = {
        ok: true,
        requesterPayload: this.payloadFor(record, input.side),
        opponentPayload: this.payloadFor(record, opposite(input.side)),
      };
      const publicEvent = record.eventLog.at(-1)?.publicPayload;
      if (publicEvent) result.publicEvent = publicEvent;
      return result;
    });
  }

  async previewAi(input: {
    matchId: string;
    requesterSide: Side;
    targetSide: Side;
    sessionToken: string;
    knownStateVersion?: number;
    knownMatchVersion?: number;
  }): Promise<PreviewAiResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId, {
        includeStateSnapshots: false,
      });
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(
        record,
        input.requesterSide,
        input.sessionToken,
      );
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (input.targetSide !== input.requesterSide)
        return {
          ok: false,
          error: safeError(
            "preview_side_forbidden",
            "Die Session darf nur die eigene Seite bewerten.",
          ),
        };
      if (
        record.match.mode !== "human_runner_vs_corp_ai" &&
        record.match.mode !== "human_corp_vs_runner_ai"
      )
        return {
          ok: false,
          error: safeError(
            "preview_mode_forbidden",
            "Die KI-Vorschau ist auf private Human-vs-KI-Spielersessions begrenzt.",
          ),
        };
      if (this.isAiSide(record, input.requesterSide))
        return {
          ok: false,
          error: safeError(
            "ai_session_forbidden",
            "Nur die menschliche Seite darf eine eigene KI-Vorschau anfordern.",
          ),
        };
      if (record.match.status !== "active" || !record.gameState)
        return {
          ok: false,
          error: safeError(
            "match_not_active",
            "Das Match ist noch nicht aktiv.",
          ),
        };
      const decisionSide = selectAiDecisionSideForState(record.gameState).side;
      if (!decisionSide || decisionSide !== input.targetSide) {
        return {
          ok: false,
          error: safeError(
            "preview_side_not_active",
            "Die eigene Seite darf im aktuellen Zustand nicht entscheiden.",
            record.gameState,
            input.requesterSide,
          ),
        };
      }
      if (
        input.knownStateVersion !== undefined &&
        input.knownStateVersion !== record.gameState.stateVersion
      ) {
        return {
          ok: false,
          error: safeError(
            "stale_state",
            "Der Spielzustand ist veraltet.",
            record.gameState,
            input.requesterSide,
          ),
        };
      }
      if (
        input.knownMatchVersion !== undefined &&
        input.knownMatchVersion !== record.match.matchVersion
      ) {
        return {
          ok: false,
          error: safeError(
            "stale_match",
            "Der Matchzustand ist veraltet.",
            record.gameState,
            input.requesterSide,
          ),
        };
      }

      const legalActions = getLegalActions(record.gameState, input.targetSide);
      if (legalActions.length === 0) {
        return {
          ok: false,
          error: safeError(
            "ai_no_action",
            "Die KI hat aktuell keine legalen Aktionen.",
            record.gameState,
            input.requesterSide,
          ),
        };
      }
      const controller = record.match.aiControllers?.[input.targetSide];
      let aiInput: AiDecisionInput;
      try {
        const ownDeckSnapshot = assertRecordAiDeckSnapshotForRuntime(
          record,
          input.targetSide,
        );
        aiInput = buildAiDecisionInput(record.gameState, input.targetSide, {
          difficulty: controller?.difficulty ?? "normal",
          profileId:
            controller?.profileId ??
            `${input.targetSide}-session-preview-v0.9-${controller?.difficulty ?? "normal"}`,
          decisionId: `${record.match.matchId}:${record.gameState.stateVersion}:${input.targetSide}:session-preview`,
          actionNumber: record.gameState.stateVersion,
          ownDeckSnapshot,
          expectedDeckSnapshot: aiDeckSnapshotExpectationFor(
            record,
            input.targetSide,
          ),
        });
      } catch (error) {
        if (isAiDeckSnapshotRuntimeError(error)) {
          return {
            ok: false,
            error: safeError(
              error.code,
              aiDeckSnapshotErrorMessage(error.code),
              record.gameState,
              input.requesterSide,
            ),
          };
        }
        throw error;
      }
      const decision = this.chooseAiAction(aiInput, {
        persistTacticalPlanMemory: false,
        quoteRandomizedIceInstallSelection: (request) =>
          quoteRandomizedIceInstallSelection(record.gameState, request),
      });
      if (
        decision.selectionKind === "engine_randomized_ice_install_selection"
      ) {
        return {
          ok: false,
          error: safeError(
            "ai_randomized_selection_requires_execution",
            "Diese KI-Entscheidung wird erst bei der Ausführung durch die Engine ausgewählt.",
            record.gameState,
            input.requesterSide,
          ),
        };
      }
      const legalAction = legalActionForAiDecision(decision, legalActions);
      if (!legalAction) {
        return {
          ok: false,
          error: safeError(
            "ai_decision_action_not_legal",
            "Die KI wählte keine aktuell legale Aktion.",
            record.gameState,
            input.requesterSide,
          ),
        };
      }
      const safeDebug = sanitizeAiDecisionDebug(decision.decisionDebug);
      const detail = safeDebug
        ? aiDecisionTraceJson(
            safeDebug,
            input.targetSide,
            legalAction,
            "detailed",
          )
        : minimalAiPreviewDetail(input.targetSide, legalAction, decision);
      const preview: AiDecisionPreview = {
        matchId: record.match.matchId,
        matchVersion: record.match.matchVersion,
        stateVersion: record.gameState.stateVersion,
        requestedBy: input.requesterSide,
        side: input.targetSide,
        generatedAt: this.now(),
        actionId: legalAction.actionId,
        actionType: legalAction.type,
        actionLabel: legalAction.label,
        reasonCode: decision.reasonCode,
        explanation: decision.explanation,
        fallbackUsed: decision.fallbackUsed,
        ...(decision.timeoutUsed ? { timeoutUsed: true } : {}),
        ...(typeof decision.confidence === "number"
          ? { confidence: decision.confidence }
          : {}),
        ...(decision.selectedChoices
          ? { selectedChoices: decision.selectedChoices }
          : {}),
        detail,
      };
      return {
        ok: true,
        preview,
      };
    });
  }

  async requestUndo(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
    targetEventId: string;
    reason?: string;
  }): Promise<UndoResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (record.match.status !== "active" || !record.gameState)
        return {
          ok: false,
          error: safeError(
            "match_not_active",
            "Undo ist aktuell nicht möglich.",
          ),
        };
      const targetIndex = record.eventLog.findIndex(
        (event) => event.eventId === input.targetEventId,
      );
      if (targetIndex < 0)
        return {
          ok: false,
          error: safeError(
            "undo_not_available",
            "Undo ist aktuell nicht möglich.",
          ),
          payload: this.payloadFor(record, input.side),
        };
      const crossesHiddenInfoBarrier = record.eventLog
        .slice(targetIndex)
        .some((event) => event.hiddenInfoBarrier);
      if (crossesHiddenInfoBarrier && !this.allowHiddenInfoUndo) {
        const blockedSnapshot: UndoSnapshot = {
          undoRequestId: randomId("undo"),
          matchId: input.matchId,
          targetEventId: input.targetEventId,
          snapshotId: "blocked",
          requestedBy: input.side,
          status: "blocked",
          hiddenInfoSafe: false,
        };
        record.undoSnapshots.push(blockedSnapshot);
        await this.persist(record);
        return {
          ok: false,
          error: safeError(
            "undo_blocked",
            "Undo ist nach verdeckter Information nicht möglich.",
          ),
          payload: this.payloadFor(record, input.side),
        };
      }
      const snapshot = record.stateSnapshots.find(
        (candidate) =>
          candidate.snapshotId ===
          `snap_before_${record.eventLog[targetIndex]?.stateVersionAfter}`,
      );
      if (!snapshot)
        return {
          ok: false,
          error: safeError(
            "undo_not_available",
            "Undo ist aktuell nicht möglich.",
          ),
          payload: this.payloadFor(record, input.side),
        };
      const undoRequest: PendingUndoRequest = {
        undoRequestId: randomId("undo"),
        requestedBy: input.side,
        targetEventId: input.targetEventId,
        ...(input.reason ? { reason: input.reason.slice(0, 160) } : {}),
      };
      const undoSnapshot: UndoSnapshot = {
        undoRequestId: undoRequest.undoRequestId,
        matchId: input.matchId,
        targetEventId: input.targetEventId,
        snapshotId: snapshot.snapshotId,
        requestedBy: input.side,
        status: "requested",
        hiddenInfoSafe: !crossesHiddenInfoBarrier,
      };
      record.undoSnapshots.push(undoSnapshot);
      const opponentSide = opposite(input.side);

      if (this.isAiSide(record, opponentSide)) {
        delete record.pendingUndo;
        undoSnapshot.status = "accepted";
        const restored = this.applyAcceptedUndo(record, undoSnapshot);
        if (!restored)
          return {
            ok: false,
            error: safeError(
              "undo_not_available",
              "Undo ist aktuell nicht möglich.",
            ),
            payload: this.payloadFor(record, input.side),
          };
        record.match.matchVersion += 1;
        record.match.updatedAt = this.now();
        await this.persist(record);
        return {
          ok: true,
          requesterPayload: this.payloadFor(record, input.side),
          opponentPayload: this.payloadFor(record, opponentSide),
          undoRequest,
        };
      }

      record.pendingUndo = undoRequest;
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      await this.persist(record);
      return {
        ok: true,
        requesterPayload: this.payloadFor(record, input.side),
        opponentPayload: this.payloadFor(record, opponentSide),
        undoRequest,
      };
    });
  }

  async acceptUndo(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
    undoRequestId: string;
  }): Promise<UndoResult> {
    return this.resolveUndo(input, "accepted");
  }

  async declineUndo(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
    undoRequestId: string;
  }): Promise<UndoResult> {
    return this.resolveUndo(input, "declined");
  }

  async replayMatch(
    matchId: string,
  ): Promise<{ ok: boolean; finalStateHash: string; errors: string[] }> {
    const record = await this.mustLoad(matchId);
    if (!record)
      return { ok: false, finalStateHash: "", errors: ["Match not found."] };
    if (!record.gameState)
      return {
        ok: false,
        finalStateHash: "",
        errors: ["Match is not active."],
      };
    const initial = record.stateSnapshots[0]?.gameState;
    if (!initial)
      return {
        ok: false,
        finalStateHash: hashState(record.gameState),
        errors: ["Initial snapshot missing."],
      };
    const replay = replayEvents(initial, record.gameState.eventLog);
    return {
      ok: replay.ok,
      finalStateHash: replay.actualFinalStateHash,
      errors: replay.errors,
    };
  }

  async listReplayIndex(): Promise<ReplayIndexEntry[]> {
    if (!this.storage.list) return [];
    const records = await this.storage.list();
    return records
      .filter((record) => Boolean(record.gameState))
      .map((record) => replayIndexEntryFor(record))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async listPublicReplayIndex(): Promise<ReplayIndexEntry[]> {
    const records = this.storage.listPublicMatchCandidates
      ? await this.storage.listPublicMatchCandidates()
      : this.storage.list
        ? await this.storage.list()
        : [];
    return records
      .filter(
        (record) =>
          record.match.isPublic &&
          isTerminalStatus(record.match.status) &&
          Boolean(record.gameState),
      )
      .map((record) => replayIndexEntryFor(record))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async listOpenMatches(): Promise<OpenMatchListEntry[]> {
    const records = this.storage.listOpenMatchCandidates
      ? await this.storage.listOpenMatchCandidates()
      : this.storage.list
        ? await this.storage.list()
        : [];
    const nowIso = this.now();
    const nowMs = Date.parse(nowIso);
    return records
      .filter(
        (record) =>
          record.match.mode === "human_vs_human" &&
          record.match.status === "pending" &&
          record.match.isPublic,
      )
      .map((record) => {
        const openJoinToken = this.openJoinToken(record);
        if (!openJoinToken) return undefined;
        const hostDisplayName =
          record.sessions[0]?.displayName?.trim() || "Teilnehmer A";
        const createdMs = Date.parse(record.match.createdAt);
        const ageSeconds =
          Number.isFinite(createdMs) && Number.isFinite(nowMs)
            ? Math.max(0, Math.floor((nowMs - createdMs) / 1000))
            : 0;
        return {
          matchId: record.match.matchId,
          hostDisplayName,
          mode: "human_vs_human" as const,
          status: "pending" as const,
          createdAt: record.match.createdAt,
          ageSeconds,
        };
      })
      .filter((entry): entry is OpenMatchListEntry => Boolean(entry))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async listPublicMatches(): Promise<PublicMatchListEntry[]> {
    const candidates = this.storage.listPublicMatchCandidates
      ? await this.storage.listPublicMatchCandidates()
      : this.storage.list
        ? await this.storage.list()
        : [];
    const records = await this.ensurePersistedResultSnapshots(
      candidates.filter((record) => record.match.isPublic),
    );
    return records
      .map((record): PublicMatchListEntry | undefined => {
        let status: PublicMatchListEntry["status"] | undefined;
        if (
          record.match.mode === "human_vs_human" &&
          record.match.status === "pending" &&
          this.openJoinToken(record)
        ) {
          status = "open";
        } else if (record.match.status === "active") {
          status = "active";
        } else if (
          isCompletedGameStatus(record.match.status) &&
          record.gameState
        ) {
          status = "finished";
        }
        if (!status) return undefined;

        const participantNames = participantNamesForReplay(record);
        if (
          !participantNames.runner &&
          (record.match.mode === "human_corp_vs_runner_ai" ||
            record.match.mode === "ai_vs_ai")
        ) {
          participantNames.runner = "Runner-KI";
        }
        if (
          !participantNames.corp &&
          (record.match.mode === "human_runner_vs_corp_ai" ||
            record.match.mode === "ai_vs_ai")
        ) {
          participantNames.corp = "Corp-KI";
        }
        const host = record.sessions[0];
        return {
          matchId: record.match.matchId,
          status,
          matchMode: record.match.mode,
          matchFormat: record.match.settings.matchFormat,
          cardPool: record.match.settings.cardPool ?? "originalset",
          createdAt: record.match.createdAt,
          updatedAt: record.match.updatedAt,
          participantNames,
          ...(status === "open" && host
            ? {
                hostDisplayName: host.displayName?.trim() || "Teilnehmer A",
                hostSide: host.side,
                availableSide: opposite(host.side),
              }
            : {}),
          ...(record.match.series
            ? { seriesGamesPlanned: record.match.series.gamesPlanned }
            : {}),
          ...(record.resultSnapshot?.winner
            ? { winner: record.resultSnapshot.winner }
            : record.gameState.winner
              ? { winner: record.gameState.winner }
              : {}),
          ...(status === "finished" && record.resultSnapshot
            ? { result: record.resultSnapshot }
            : {}),
        };
      })
      .filter((entry): entry is PublicMatchListEntry => Boolean(entry))
      .sort(
        (left, right) =>
          publicMatchStatusPriority(left.status) -
            publicMatchStatusPriority(right.status) ||
          right.updatedAt.localeCompare(left.updatedAt) ||
          left.matchId.localeCompare(right.matchId),
      );
  }

  async loadPublicSpectatorView(
    matchId: string,
  ): Promise<
    | { ok: true; spectator: SpectatorProjectionV1 }
    | { ok: false; error: SafeErrorPayload }
  > {
    const record = await this.mustLoad(matchId);
    if (
      !record ||
      !record.match.isPublic ||
      record.match.status !== "active" ||
      !record.gameState
    ) {
      return {
        ok: false,
        error: safeError(
          "not_found",
          "Dieses laufende öffentliche Spiel ist nicht verfügbar.",
        ),
      };
    }
    return {
      ok: true,
      spectator: buildSpectatorProjectionV1(record, {
        kind: "public_live_v1",
        eventCursor: record.gameState.stateVersion,
        maxEvents: 40,
      }),
    };
  }

  async listRecentGameResults(limit = 20): Promise<RecentGameResultEntry[]> {
    const candidates = this.storage.listResultSnapshotCandidates
      ? await this.storage.listResultSnapshotCandidates()
      : this.storage.list
        ? await this.storage.list()
        : [];
    const records = await this.ensurePersistedResultSnapshots(
      candidates.filter((record) => record.match.isPublic),
    );
    return recentGameResultEntriesFor(records, limit);
  }

  async listPersonalRecentGameResults(
    matchIds: readonly string[],
    limit = 20,
  ): Promise<RecentGameResultEntry[]> {
    const uniqueMatchIds = [...new Set(matchIds)];
    if (uniqueMatchIds.length === 0) return [];
    const candidates = this.storage.listResultSnapshotCandidatesByMatchIds
      ? await this.storage.listResultSnapshotCandidatesByMatchIds(
          uniqueMatchIds,
        )
      : this.storage.listResultSnapshotCandidates
        ? (await this.storage.listResultSnapshotCandidates()).filter((record) =>
            uniqueMatchIds.includes(record.match.matchId),
          )
        : this.storage.list
          ? (await this.storage.list()).filter((record) =>
              uniqueMatchIds.includes(record.match.matchId),
            )
          : [];
    const records = await this.ensurePersistedResultSnapshots(candidates);
    return recentGameResultEntriesFor(records, limit);
  }

  async loadReplayDiagnostics(
    matchId: string,
    perspective: ReplayPerspective,
  ): Promise<
    { ok: true; replay: ReplayView } | { ok: false; error: SafeErrorPayload }
  > {
    const record = await this.mustLoad(matchId);
    if (!record || !record.gameState)
      return {
        ok: false,
        error: safeError("not_found", "Dieses Replay ist nicht verfügbar."),
      };
    if (!isReplayPerspective(perspective))
      return {
        ok: false,
        error: safeError("bad_request", "Die Replay-Perspektive ist ungültig."),
      };

    const checks = replayStateHashChecks(record);
    const metadata = replayIndexEntryFor(record, checks);
    const projectedEvents = replayEventsForPerspective(record, perspective);
    const publicEvents = projectedEvents.map(replayChronicleEvent);
    const localAnalysis = perspective === "local_analysis";
    const timeline = projectedEvents.map((event, index) =>
      replayTimelineStepFor({
        event,
        index,
        perspective,
        stateHashCheck: checks.byEventId[event.eventId] ?? {
          ok: false,
          expected: event.stateHashAfter,
          reason: "state_hash_check_missing",
          randomDrawCounters: [],
        },
      }),
    );
    const replay: ReplayView = {
      replayId: metadata.replayId,
      matchId: metadata.matchId,
      perspective,
      metadata,
      publicEvents,
      timeline,
      frames: isTerminalStatus(record.match.status)
        ? replayAnalysisFrames(record)
        : [],
      replayErrors: checks.errors,
      randomDrawRecords: replayRandomDrawEntries(record),
      exploitSuggestions: replayExploitSuggestions(timeline),
      localAnalysis,
    };
    return { ok: true, replay };
  }

  async loadReplayView(
    matchId: string,
    perspective: ReplayPerspective,
    access: ReplayAccessInput = {},
  ): Promise<
    { ok: true; replay: ReplayView } | { ok: false; error: SafeErrorPayload }
  > {
    const record = await this.mustLoad(matchId);
    if (
      !record ||
      !record.gameState ||
      !isTerminalStatus(record.match.status)
    ) {
      return {
        ok: false,
        error: safeError("not_found", "Dieses Replay ist nicht verfügbar."),
      };
    }
    if (!record.match.isPublic) {
      const session =
        access.side && access.sessionToken
          ? this.authenticateForRecreate(
              record,
              access.side,
              access.sessionToken,
            )
          : undefined;
      if (!session) {
        return {
          ok: false,
          error: safeError("not_found", "Dieses Replay ist nicht verfügbar."),
        };
      }
    }
    return this.loadReplayDiagnostics(matchId, perspective);
  }

  async exportReplayDiagnostics(
    matchId: string,
    perspective: ReplayPerspective,
  ): Promise<
    | { ok: true; artifact: ReplayExportArtifact }
    | { ok: false; error: SafeErrorPayload }
  > {
    if (perspective === "local_analysis") {
      return {
        ok: false,
        error: safeError(
          "bad_request",
          "Die lokale Analyseperspektive ist nur in der lokalen Replay-Ansicht verfügbar.",
        ),
      };
    }
    const loaded = await this.loadReplayDiagnostics(matchId, perspective);
    if (!loaded.ok) return loaded;
    return {
      ok: true,
      artifact: {
        version: "1.5.0",
        exportedAt: this.now(),
        baseline: loaded.replay.metadata.baseline,
        perspective,
        replay: loaded.replay,
      },
    };
  }

  async exportReplay(
    matchId: string,
    perspective: ReplayPerspective,
    access: ReplayAccessInput = {},
  ): Promise<
    | { ok: true; artifact: ReplayExportArtifact }
    | { ok: false; error: SafeErrorPayload }
  > {
    if (perspective === "local_analysis") {
      return {
        ok: false,
        error: safeError(
          "bad_request",
          "Die lokale Analyseperspektive ist nur in der lokalen Replay-Ansicht verfügbar.",
        ),
      };
    }
    const loaded = await this.loadReplayView(matchId, perspective, access);
    if (!loaded.ok) return loaded;
    return {
      ok: true,
      artifact: {
        version: "1.5.0",
        exportedAt: this.now(),
        baseline: loaded.replay.metadata.baseline,
        perspective,
        replay: loaded.replay,
      },
    };
  }

  async exportGamebook(
    matchId: string,
    access: ReplayAccessInput = {},
  ): Promise<
    | { ok: true; artifact: GamebookExportArtifact }
    | { ok: false; error: SafeErrorPayload }
  > {
    const record = await this.mustLoad(matchId);
    if (!record || !record.gameState || !isTerminalStatus(record.match.status))
      return {
        ok: false,
        error: safeError(
          "not_found",
          "Dieses Spielprotokoll ist nicht verfügbar.",
        ),
      };
    if (!record.match.isPublic) {
      const session =
        access.side && access.sessionToken
          ? this.authenticateForRecreate(
              record,
              access.side,
              access.sessionToken,
            )
          : undefined;
      if (!session)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses Spielprotokoll ist nicht verfügbar.",
          ),
        };
    }
    return {
      ok: true,
      artifact: {
        version: "gamebook-v1",
        exportedAt: this.now(),
        markdown: renderGamebook(record),
      },
    };
  }

  async loadForTest(matchId: string): Promise<StoredMatch | undefined> {
    return this.storage.load(matchId);
  }

  async storageHealth(): Promise<StorageHealth> {
    if (this.storage.health) return this.storage.health();
    return { ok: true, kind: "memory" };
  }

  async backupStorageForTest(
    reason?: BackupManifest["reason"],
  ): Promise<{ backupDir: string; manifest: BackupManifest }> {
    if (!this.storage.backup) throw new Error("storage_backup_unavailable");
    return this.storage.backup(reason);
  }

  async storageMaintenanceSummary(): Promise<
    StorageMaintenanceSummary | undefined
  > {
    return this.storage.maintenanceSummary?.();
  }

  async storageMaintenanceMatches(
    filters?: StorageMaintenanceMatchFilters,
  ): Promise<StorageMaintenanceMatchEntry[] | undefined> {
    return this.storage.maintenanceMatches?.(filters);
  }

  async storageMaintenanceMatchDetail(
    matchId: string,
  ): Promise<StorageMaintenanceMatchDetail | undefined> {
    return this.storage.maintenanceMatchDetail?.(matchId);
  }

  async storageMaintenanceAiDecisionTraceMatches(): Promise<
    StorageMaintenanceAiDecisionTraceMatchEntry[] | undefined
  > {
    return this.storage.maintenanceAiDecisionTraceMatches?.();
  }

  async storageMaintenanceAiDecisionTraceIndex(
    matchId: string,
    filters?: { afterDecisionIndex?: number },
  ): Promise<StorageMaintenanceAiDecisionTraceIndexEntry[] | undefined> {
    return this.storage.maintenanceAiDecisionTraceIndex?.(matchId, filters);
  }

  async storageMaintenanceAiDecisionTraceDetail(
    traceId: string,
  ): Promise<StorageMaintenanceAiDecisionTraceDetail | undefined> {
    return this.storage.maintenanceAiDecisionTraceDetail?.(traceId);
  }

  async enableStorageMaintenanceAiDecisionTrace(
    matchId: string,
    mode: Exclude<AiDecisionTraceMode, "off"> = "detailed",
  ): Promise<StorageMaintenanceAiDecisionTraceMatchEntry | undefined> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record) return undefined;
      if (
        !record.match.aiControllers ||
        Object.keys(record.match.aiControllers).length === 0
      )
        throw new Error("ai_trace_match_has_no_ai");
      if (isTerminalStatus(record.match.status))
        throw new Error("ai_trace_match_terminal");
      const now = this.now();
      record.match.aiTraceMode = mode;
      record.match.updatedAt = now;
      await this.persist(record);
      const matches = await this.storageMaintenanceAiDecisionTraceMatches();
      return (
        matches?.find((match) => match.matchId === matchId) ?? {
          matchId,
          status: record.match.status,
          mode: record.match.mode,
          aiTraceMode: mode,
          traceCount: record.aiDecisionTraces?.length ?? 0,
          createdAt: record.match.createdAt,
          updatedAt: record.match.updatedAt,
        }
      );
    });
  }

  async storageMaintenanceCleanupPreview(
    filters: StorageMaintenanceCleanupFilters,
  ): Promise<StorageMaintenanceCleanupPreview | undefined> {
    return this.storage.maintenanceCleanupPreview?.(filters);
  }

  async storageMaintenanceCleanupApply(
    input: StorageMaintenanceCleanupApplyInput,
  ): Promise<StorageMaintenanceCleanupApplyResult | undefined> {
    return this.storage.maintenanceCleanupApply?.(input);
  }

  async storageMaintenanceCleanupPolicy(): Promise<
    StorageMaintenanceCleanupPolicy | undefined
  > {
    return this.storage.maintenanceCleanupPolicy?.();
  }

  async setStorageMaintenanceCleanupPolicy(
    policy: StorageMaintenanceCleanupPolicyInput,
  ): Promise<StorageMaintenanceCleanupPolicy | undefined> {
    return this.storage.setMaintenanceCleanupPolicy?.(policy);
  }

  async runStorageMaintenanceCleanupPolicy(): Promise<
    StorageMaintenanceCleanupPolicyRunResult | undefined
  > {
    return this.storage.runMaintenanceCleanupPolicy?.();
  }

  async storageMaintenanceCompactSnapshots(): Promise<
    StorageMaintenanceSnapshotCompactionResult | undefined
  > {
    return this.storage.maintenanceCompactSnapshots?.();
  }

  async storageMaintenanceOptimize(): Promise<
    StorageMaintenanceOptimizeResult | undefined
  > {
    return this.storage.maintenanceOptimize?.();
  }

  async storageMaintenanceSetRetentionProtection(
    matchId: string,
    protectedValue: boolean,
  ): Promise<StorageMaintenanceMatchDetail | undefined> {
    return this.storage.maintenanceSetRetentionProtection?.(
      matchId,
      protectedValue,
    );
  }

  async issueMaintenanceRecoveryAccess(
    matchId: string,
    input: { side: Side; displayName?: string },
  ): Promise<MaintenanceRecoveryAccessResult | { error: SafeErrorPayload }> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record)
        return {
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      if (isTerminalStatus(record.match.status))
        return {
          error: safeError(
            "match_terminal",
            "Für abgeschlossene Matches wird kein Fortsetzungszugang erstellt.",
          ),
        };
      const session = record.sessions.find(
        (candidate) => candidate.side === input.side,
      );
      if (!session)
        return {
          error: safeError(
            "side_unavailable",
            "Für diese Seite gibt es keine wiederherstellbare Spielersession.",
          ),
        };

      const now = this.now();
      const access = generateToken();
      this.revokeTokenByHash(record, "session", session.sessionTokenHash, now);
      this.revokeTokenByHash(
        record,
        "reconnect",
        session.reconnectTokenHash,
        now,
      );
      record.sessions = record.sessions.map((candidate) =>
        candidate.sessionId === session.sessionId
          ? {
              ...candidate,
              displayName: input.displayName?.trim() || candidate.displayName,
              reconnectTokenHash: this.hashToken(access),
              connected: false,
              lastSeenAt: now,
            }
          : candidate,
      );
      record.tokens.push(
        this.tokenRecord(matchId, input.side, "reconnect", access, now),
      );
      record.match.matchVersion += 1;
      record.match.updatedAt = now;
      await this.persist(record);

      return {
        matchId,
        side: input.side,
        access,
        displayName: input.displayName?.trim() || session.displayName,
        webSocketUrl: this.webSocketUrl(),
        matchStatus: record.match.status,
        matchVersion: record.match.matchVersion,
        issuedAt: now,
      };
    });
  }

  async setMatchRetentionProtection(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
    protected: boolean;
  }): Promise<
    | { ok: true; payload: LobbyPayload | SidePayload }
    | { ok: false; error: SafeErrorPayload }
  > {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      const now = this.now();
      record.match.retentionProtection = input.protected
        ? {
            protected: true,
            protectedAt: now,
            protectedBySide: input.side,
          }
        : { protected: false };
      record.match.updatedAt = now;
      record.match.matchVersion += 1;
      await this.persist(record);
      return { ok: true, payload: this.safePayloadFor(record, input.side) };
    });
  }

  closeStorage(): void {
    this.storage.close?.();
  }

  private async resolveUndo(
    input: {
      matchId: string;
      side: Side;
      sessionToken: string;
      undoRequestId: string;
    },
    status: "accepted" | "declined",
  ): Promise<UndoResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record)
        return {
          ok: false,
          error: safeError(
            "not_found",
            "Dieses private Match ist nicht verfügbar.",
          ),
        };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session)
        return {
          ok: false,
          error: safeError("unauthorized", "Die Session ist nicht gültig."),
        };
      if (!record.gameState)
        return {
          ok: false,
          error: safeError(
            "match_not_active",
            "Undo ist aktuell nicht möglich.",
          ),
        };
      const pending = record.pendingUndo;
      if (
        !pending ||
        pending.undoRequestId !== input.undoRequestId ||
        pending.requestedBy === input.side
      ) {
        return {
          ok: false,
          error: safeError(
            "undo_not_available",
            "Undo ist aktuell nicht möglich.",
          ),
          payload: this.payloadFor(record, input.side),
        };
      }
      const undoRecord = record.undoSnapshots.find(
        (candidate) => candidate.undoRequestId === input.undoRequestId,
      );
      if (!undoRecord) {
        delete record.pendingUndo;
        record.match.matchVersion += 1;
        record.match.updatedAt = this.now();
        await this.persist(record);
        return {
          ok: false,
          error: safeError(
            "undo_not_available",
            "Undo ist aktuell nicht möglich.",
          ),
          payload: this.payloadFor(record, input.side),
        };
      }
      undoRecord.status = status;
      delete record.pendingUndo;
      if (status === "accepted") {
        const restored = this.applyAcceptedUndo(record, undoRecord);
        if (!restored) {
          record.match.matchVersion += 1;
          record.match.updatedAt = this.now();
          await this.persist(record);
          return {
            ok: false,
            error: safeError(
              "undo_not_available",
              "Undo ist aktuell nicht möglich.",
            ),
            payload: this.payloadFor(record, input.side),
          };
        }
      }
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      await this.persist(record);
      return {
        ok: true,
        requesterPayload: this.payloadFor(record, pending.requestedBy),
        opponentPayload: this.payloadFor(record, opposite(pending.requestedBy)),
      };
    });
  }

  private applyAcceptedUndo(
    record: StoredMatch,
    undoRecord: UndoSnapshot,
  ): boolean {
    const snapshot = record.stateSnapshots.find(
      (candidate) => candidate.snapshotId === undoRecord.snapshotId,
    );
    if (!snapshot) return false;
    const targetIndex = record.eventLog.findIndex(
      (event) => event.eventId === undoRecord.targetEventId,
    );
    const eventLog = record.gameState.eventLog.filter(
      (event) => event.stateVersionAfter <= snapshot.stateVersion,
    );
    record.gameState = { ...clone(snapshot.gameState), eventLog };
    record.eventLog =
      targetIndex >= 0
        ? record.eventLog.slice(0, targetIndex)
        : record.eventLog;
    const retainedEventIds = new Set(
      record.eventLog.map((event) => event.eventId),
    );
    if (record.aiDecisionTraces) {
      record.aiDecisionTraces = record.aiDecisionTraces.filter((trace) =>
        retainedEventIds.has(trace.eventId),
      );
    }
    record.actionReceipts = record.actionReceipts.filter(
      (receipt) => receipt.stateVersionAfter <= snapshot.stateVersion,
    );
    record.stateSnapshots = record.stateSnapshots.filter(
      (candidate) => candidate.stateVersion <= snapshot.stateVersion,
    );
    return true;
  }

  private shouldUseLobbyPayload(record: StoredMatch): boolean {
    return (
      !record.gameState ||
      record.match.status === "pending" ||
      record.match.status === "waiting_for_runner" ||
      record.match.status === "waiting_for_corp" ||
      record.match.status === "waiting_for_joiner_decks" ||
      record.match.status === "ready_check" ||
      record.match.status === "countdown" ||
      record.match.status === "cancelled" ||
      record.match.status === "abandoned"
    );
  }

  private safePayloadFor(
    record: StoredMatch,
    side: Side,
  ): LobbyPayload | SidePayload {
    if (record.match.mode === "ai_vs_ai" && record.gameState)
      return this.payloadFor(record, side);
    return this.shouldUseLobbyPayload(record)
      ? this.lobbyPayloadFor(record, side)
      : this.payloadFor(record, side);
  }

  private lifecycleResultFor(
    record: StoredMatch,
    actorSide: Side,
  ): Extract<LifecycleActionResult, { ok: true }> {
    const opponentSide = opposite(actorSide);
    return {
      ok: true,
      actorPayload: this.safePayloadFor(record, actorSide),
      ...(record.sessions.some((session) => session.side === opponentSide)
        ? { opponentPayload: this.safePayloadFor(record, opponentSide) }
        : {}),
    };
  }

  private terminalizeLifecycle(
    record: StoredMatch,
    status: "cancelled" | "abandoned",
    reason: "cancel" | "leave",
    actorSide: Side,
  ): void {
    const now = this.now();
    this.clearCountdown(record);
    record.match.status = status;
    delete record.match.winner;
    delete record.pendingUndo;
    record.lifecycleResult = {
      status,
      reason,
      occurredAt: now,
      actorSide,
    };
    this.revokeAllTokens(record, now);
    record.match.matchVersion += 1;
    record.match.updatedAt = now;
  }

  private removeJoinerFromOpenLobby(
    record: StoredMatch,
    session: SessionRecord,
  ): void {
    const now = this.now();
    this.clearCountdown(record);
    this.revokeTokenByHash(record, "session", session.sessionTokenHash, now);
    this.revokeTokenByHash(
      record,
      "reconnect",
      session.reconnectTokenHash,
      now,
    );
    record.sessions = record.sessions.filter(
      (candidate) => candidate.sessionId !== session.sessionId,
    );
    record.tokens = record.tokens.map((token) => {
      if (
        token.kind !== "join" ||
        token.allowedSide !== session.side ||
        token.revokedAt
      )
        return token;
      const reopened = { ...token };
      delete reopened.usedAt;
      return reopened;
    });
    if (record.startLobby) {
      record.startLobby.hostReady = false;
      record.startLobby.joinerReady = false;
    }
    record.match.status = "pending";
    delete record.lifecycleResult;
    record.match.matchVersion += 1;
    record.match.updatedAt = now;
  }

  private recreateInputFor(
    record: StoredMatch,
    session: SessionRecord,
    displayName: string | undefined,
  ): Parameters<MultiplayerService["createMatch"]>[0] {
    const participants = participantDeckInputsForRecord(record);
    const requesterPlayer = playerSlotForSession(record, session);
    const opponentPlayer = oppositeSeriesPlayer(requesterPlayer);
    const includeOpponentDecks =
      record.match.mode !== "human_vs_human" ||
      record.match.status === "finished" ||
      record.match.status === "forfeited";
    const runnerDifficulty = record.match.aiControllers?.runner?.difficulty;
    const corpDifficulty = record.match.aiControllers?.corp?.difficulty;
    return {
      hostSide: session.side,
      mode: record.match.mode,
      displayName: displayName ?? session.displayName,
      ...(record.match.participantIdentities
        ? { participantIdentities: record.match.participantIdentities }
        : {}),
      settings: record.match.settings,
      ...(record.startLobby?.countdownSeconds
        ? { countdownSeconds: record.startLobby.countdownSeconds }
        : {}),
      participantADecks: participants[requesterPlayer],
      ...(includeOpponentDecks
        ? { participantBDecks: participants[opponentPlayer] }
        : {}),
      ...(record.match.deckSetup.aiDeckPolicy
        ? { aiDeckPolicy: record.match.deckSetup.aiDeckPolicy }
        : {}),
      ...(record.match.aiPacingMode
        ? { aiPacingMode: record.match.aiPacingMode }
        : {}),
      isPublic: record.match.isPublic,
      ...(runnerDifficulty ? { runnerDifficulty } : {}),
      ...(corpDifficulty ? { corpDifficulty } : {}),
    };
  }

  private activatePendingDeckHandshake(
    record: StoredMatch,
    joinerDecks: ParticipantDeckPairInput,
  ): void {
    const hostDecks = record.privateDeckSnapshots?.participants?.player_a;
    if (!hostDecks) throw new Error("host_decks_missing");
    const cardPool = normalizeMatchCardPool(record.match.settings.cardPool);
    const joinerPair = resolveParticipantDeckPair(joinerDecks, { cardPool });
    const participants: ResolvedParticipantDeckSetup = {
      player_a: {
        runnerSnapshot: clone(hostDecks.runner),
        corpSnapshot: clone(hostDecks.corp),
        runnerDeck: buildDeckFromSnapshot(hostDecks.runner),
        corpDeck: buildDeckFromSnapshot(hostDecks.corp),
      },
      player_b: joinerPair,
    };
    const hostSide = record.sessions[0]?.side ?? "runner";
    const runnerPlayer: SeriesPlayerSlot =
      hostSide === "runner" ? "player_a" : "player_b";
    const corpPlayer: SeriesPlayerSlot =
      hostSide === "corp" ? "player_a" : "player_b";
    const deckSetup = deckSetupForParticipants(participants, {
      runnerPlayer,
      corpPlayer,
    });
    const baseline = baselineForMode(record.match.mode, deckSetup);
    const matchFormat = normalizeMatchFormat(record.match.settings.matchFormat);
    const agendaPointsToWin = agendaPointsToWinFor(
      matchFormat,
      record.match.settings.agendaPointsToWin > 0
        ? record.match.settings.agendaPointsToWin
        : undefined,
    );
    record.gameState = undefined as unknown as GameState;
    record.match.baseline = baseline;
    record.match.status = "ready_check";
    record.match.settings = {
      ...record.match.settings,
      agendaPointsToWin,
      matchFormat,
      cardPool,
    };
    record.match.playerClock = initialPlayerClockState(
      normalizePlayerClockConfig(record.match.settings.playerClock),
    );
    record.match.deckSetup = {
      runnerSnapshotId: deckSetup.runnerSnapshot.deckSnapshotId,
      corpSnapshotId: deckSetup.corpSnapshot.deckSnapshotId,
      runner: deckSetup.runnerSnapshot.publicMetadata,
      corp: deckSetup.corpSnapshot.publicMetadata,
      assignment: { runnerPlayer, corpPlayer },
      participants: publicParticipantDeckSetup(participants),
    };
    if (record.match.series) {
      record.match.series.runnerPlayer = runnerPlayer;
      record.match.series.corpPlayer = corpPlayer;
    }
    record.privateDeckSnapshots = {
      participants: privateParticipantDeckSetup(participants),
    };
    record.startLobby = {
      hostReady: false,
      joinerReady: false,
      countdownSeconds: record.startLobby?.countdownSeconds ?? 3,
      agendaPointsToWin,
      matchFormat,
      ...(record.match.series
        ? { seriesGamesPlanned: record.match.series.gamesPlanned }
        : {}),
      cardPool,
      sideAssignmentMode: record.startLobby?.sideAssignmentMode ?? "fixed",
      sideAssignment: { runnerPlayer, corpPlayer },
      chatMessages: record.startLobby?.chatMessages ?? [],
    };
    record.eventLog = [];
    record.stateSnapshots = [];
  }

  private syncPlayerClock(record: StoredMatch, nowIso = this.now()): boolean {
    const clock = record.match.playerClock;
    if (
      !clock ||
      record.match.status !== "active" ||
      !record.gameState ||
      record.gameState.winner ||
      (clock.mode === "player_clock" && clock.expiredSide)
    )
      return false;
    const nowMs = Date.parse(nowIso);
    if (!Number.isFinite(nowMs)) return false;
    const owner = this.playerClockDecisionOwner(record);
    if (!owner) {
      delete clock.activity;
      return false;
    }
    const key = this.playerClockActivityKey(record, owner);
    if (
      !clock.activity ||
      clock.activity.key !== key ||
      clock.activity.decisionOwnerSide !== owner
    ) {
      clock.activity = {
        key,
        decisionOwnerSide: owner,
        startedAtMs: nowMs,
        chargedMs: 0,
      };
      return false;
    }
    const elapsedMs = Math.max(0, nowMs - clock.activity.startedAtMs);
    if (clock.mode === "none") {
      const consumedDeltaMs = Math.max(0, elapsedMs - clock.activity.chargedMs);
      if (consumedDeltaMs <= 0) return false;
      clock.consumedMs[owner] += consumedDeltaMs;
      clock.activity.chargedMs += consumedDeltaMs;
      return false;
    }
    const chargeableMs = Math.max(
      0,
      elapsedMs - clock.gracePeriodMs - clock.activity.chargedMs,
    );
    if (chargeableMs <= 0) return false;
    clock.remainingMs[owner] = Math.max(
      0,
      clock.remainingMs[owner] - chargeableMs,
    );
    clock.activity.chargedMs += chargeableMs;
    if (clock.remainingMs[owner] <= 0) {
      this.terminalizeTimeExpired(record, owner, nowIso);
      return true;
    }
    return false;
  }

  private playerClockDecisionOwner(record: StoredMatch): Side | undefined {
    if (!record.gameState || record.match.status !== "active") return undefined;
    const runnerActions = getLegalActions(record.gameState, "runner");
    const corpActions = getLegalActions(record.gameState, "corp");
    if (runnerActions.length > 0 && corpActions.length === 0) return "runner";
    if (corpActions.length > 0 && runnerActions.length === 0) return "corp";
    const pendingChoiceSide = record.gameState.pendingChoice?.side;
    if (pendingChoiceSide === "runner" || pendingChoiceSide === "corp")
      return pendingChoiceSide;
    if (runnerActions.length > 0 && record.gameState.activeSide === "runner")
      return "runner";
    if (corpActions.length > 0 && record.gameState.activeSide === "corp")
      return "corp";
    return undefined;
  }

  private playerClockActivityKey(record: StoredMatch, owner: Side): string {
    const state = record.gameState;
    const actions = state
      ? getLegalActions(state, owner)
          .map((action) => action.actionId)
          .sort()
          .join(",")
      : "";
    const choice = state?.pendingChoice
      ? `${state.pendingChoice.choiceId}:${state.pendingChoice.side}:${state.pendingChoice.stateVersion}`
      : "none";
    return [
      state?.stateVersion ?? "no_state",
      owner,
      state?.phase ?? "unknown",
      state?.timingPoint ?? "unknown",
      choice,
      actions,
    ].join("|");
  }

  private terminalizeTimeExpired(
    record: StoredMatch,
    expiredSide: Side,
    nowIso: string,
  ): void {
    if (!record.gameState || record.match.status !== "active") return;
    const winnerSide = opposite(expiredSide);
    const finalEngineStateHash = hashState(record.gameState);
    record.match.status = "finished";
    record.match.winner = winnerSide;
    record.match.matchVersion += 1;
    record.match.updatedAt = nowIso;
    if (record.match.playerClock?.mode === "player_clock")
      record.match.playerClock.expiredSide = expiredSide;
    record.lifecycleResult = {
      status: "finished",
      reason: "time_expired",
      occurredAt: nowIso,
      actorSide: expiredSide,
      winnerSide,
      loserSide: expiredSide,
      finalEngineStateHash,
    };
    delete record.pendingUndo;
    record.eventLog.push(
      timeExpiredEventRecord(
        record,
        expiredSide,
        winnerSide,
        nowIso,
        finalEngineStateHash,
      ),
    );
    this.finalizeSeriesGame(record);
    this.revokeAllTokens(record, nowIso);
  }

  private playerClockSnapshotFor(
    record: StoredMatch,
    nowIso = this.now(),
  ): ApiPlayerClockSnapshot | undefined {
    const clock = record.match.playerClock;
    if (!clock) return undefined;
    const nowMs = Date.parse(nowIso);
    const activity = clock.activity;
    const elapsedActivityMs =
      activity && Number.isFinite(nowMs)
        ? Math.max(0, nowMs - activity.startedAtMs)
        : undefined;
    const decisionOwnerSide = activity?.decisionOwnerSide;
    if (clock.mode === "none") {
      const effectiveConsumed = { ...clock.consumedMs };
      if (decisionOwnerSide && elapsedActivityMs !== undefined && activity) {
        effectiveConsumed[decisionOwnerSide] += Math.max(
          0,
          elapsedActivityMs - activity.chargedMs,
        );
      }
      return {
        schemaVersion: "player-clock-v1",
        mode: "none",
        consumedMs: effectiveConsumed,
        ...(decisionOwnerSide ? { decisionOwnerSide } : {}),
        ...(activity ? { activityStartedAtMs: activity.startedAtMs } : {}),
        ...(elapsedActivityMs !== undefined ? { elapsedActivityMs } : {}),
        warningLevel: "none",
      };
    }
    const chargeableElapsedMs =
      activity && elapsedActivityMs !== undefined
        ? Math.max(0, elapsedActivityMs - clock.gracePeriodMs)
        : undefined;
    const graceRemainingMs =
      activity && elapsedActivityMs !== undefined
        ? Math.max(0, clock.gracePeriodMs - elapsedActivityMs)
        : undefined;
    const effectiveRemaining = { ...clock.remainingMs };
    if (decisionOwnerSide && chargeableElapsedMs !== undefined && activity) {
      effectiveRemaining[decisionOwnerSide] = Math.max(
        0,
        effectiveRemaining[decisionOwnerSide] -
          Math.max(0, chargeableElapsedMs - activity.chargedMs),
      );
    }
    const activeRemaining = decisionOwnerSide
      ? effectiveRemaining[decisionOwnerSide]
      : undefined;
    const criticalThresholdMs = Math.min(60_000, clock.startingTimeMs);
    const warningLevel: ApiPlayerClockSnapshot["warningLevel"] =
      clock.expiredSide
        ? "expired"
        : activeRemaining !== undefined && activeRemaining < criticalThresholdMs
          ? "critical"
          : chargeableElapsedMs !== undefined && chargeableElapsedMs > 0
            ? "charging"
            : graceRemainingMs !== undefined && graceRemainingMs > 0
              ? "grace"
              : "none";
    return {
      schemaVersion: "player-clock-v1",
      mode: "player_clock",
      remainingMs: effectiveRemaining,
      consumedMs: { ...clock.consumedMs },
      startingTimeMs: clock.startingTimeMs,
      gracePeriodMs: clock.gracePeriodMs,
      ...(decisionOwnerSide ? { decisionOwnerSide } : {}),
      ...(activity ? { activityStartedAtMs: activity.startedAtMs } : {}),
      ...(elapsedActivityMs !== undefined ? { elapsedActivityMs } : {}),
      ...(graceRemainingMs !== undefined ? { graceRemainingMs } : {}),
      ...(chargeableElapsedMs !== undefined ? { chargeableElapsedMs } : {}),
      warningLevel,
      ...(clock.expiredSide ? { expiredSide: clock.expiredSide } : {}),
    };
  }

  private payloadFor(record: StoredMatch, side: Side): SidePayload {
    const playerClockSnapshot = this.playerClockSnapshotFor(record);
    return buildSidePayload(record, side, {
      isAiSide: (candidateSide) => this.isAiSide(record, candidateSide),
      safeDisplayNameFor: (candidateSide) =>
        this.safeDisplayNameFor(record, candidateSide),
      aiTurnPresentationFor: (candidateSide) =>
        this.aiTurnPresentationFor(record, candidateSide),
      resultSummaryFor: (candidateSide, finalStateHash) =>
        resultSummaryFor(record, candidateSide, finalStateHash),
      retentionProtectionPayload: retentionProtectionPayload(record),
      ...(playerClockSnapshot ? { playerClockSnapshot } : {}),
    });
  }

  private lobbyPayloadFor(record: StoredMatch, side: Side): LobbyPayload {
    const lobby = record.startLobby;
    const opponent = record.sessions.find(
      (session) => session.side === opposite(side),
    );
    const playerClockSnapshot = this.playerClockSnapshotFor(record);
    return {
      matchId: record.match.matchId,
      matchStatus: record.match.status,
      matchVersion: record.match.matchVersion,
      isPublic: record.match.isPublic,
      side,
      eventTail: [],
      opponentStatus: {
        side: opposite(side),
        connected: opponent?.connected ?? false,
        ...(this.safeDisplayNameFor(record, opposite(side))
          ? { displayName: this.safeDisplayNameFor(record, opposite(side))! }
          : {}),
      },
      ...(record.lifecycleResult
        ? { lifecycleResult: record.lifecycleResult }
        : {}),
      ...(playerClockSnapshot ? { playerClock: playerClockSnapshot } : {}),
      ...retentionProtectionPayload(record),
      ...((record.match.status === "pending" && !record.gameState) ||
      record.match.status === "waiting_for_joiner_decks"
        ? {
            pendingDeckHandshake: {
              required: true,
              message: "Die Lobby wartet auf die Deckauswahl von Teilnehmer B.",
            },
          }
        : {}),
      ...(lobby && record.match.status !== "waiting_for_joiner_decks"
        ? { startLobby: this.publicStartLobbyFor(record, lobby) }
        : {}),
    };
  }

  private publicStartLobbyFor(
    record: StoredMatch,
    lobby: MatchStartLobbyState,
  ): MatchStartLobbyPayload {
    return {
      hostReady: lobby.hostReady,
      joinerReady: lobby.joinerReady,
      countdownSeconds: lobby.countdownSeconds,
      ...(lobby.countdownStartedAt
        ? { countdownStartedAt: lobby.countdownStartedAt }
        : {}),
      ...(lobby.countdownEndsAt
        ? { countdownEndsAt: lobby.countdownEndsAt }
        : {}),
      agendaPointsToWin: lobby.agendaPointsToWin,
      matchFormat: lobby.matchFormat,
      ...(lobby.seriesGamesPlanned
        ? { seriesGamesPlanned: lobby.seriesGamesPlanned }
        : {}),
      cardPool: lobby.cardPool,
      ...(lobby.sideAssignmentMode
        ? { sideAssignmentMode: lobby.sideAssignmentMode }
        : {}),
      sideAssignment: { ...lobby.sideAssignment },
      participants: {
        player_a: this.publicLobbyParticipantFor(record, lobby, "player_a"),
        player_b: this.publicLobbyParticipantFor(record, lobby, "player_b"),
      },
      chatMessages: lobby.chatMessages.map((message) => ({ ...message })),
    };
  }

  private publicLobbyParticipantFor(
    record: StoredMatch,
    lobby: MatchStartLobbyState,
    player: SeriesPlayerSlot,
  ): LobbyParticipantPayload {
    const side = sideForSeriesPlayer(lobby.sideAssignment, player);
    const session = record.sessions.find(
      (candidate) => candidate.side === side,
    );
    const decks = record.privateDeckSnapshots?.participants?.[player];
    const hasParticipantSession = Boolean(session);
    const hideSide = lobby.sideAssignmentMode === "random_pending";
    return {
      displayName:
        session?.displayName ??
        (player === "player_a" ? "Teilnehmer A" : "Teilnehmer B"),
      ...(hideSide ? {} : { side }),
      runnerDeckReady: hasParticipantSession && Boolean(decks?.runner),
      corpDeckReady: hasParticipantSession && Boolean(decks?.corp),
      connected: session?.connected ?? false,
      connectionQuality: connectionQualityFor(session, this.now()),
      ready: player === "player_a" ? lobby.hostReady : lobby.joinerReady,
    };
  }

  private safeDisplayNameFor(
    record: StoredMatch,
    side: Side,
  ): string | undefined {
    const controller = record.match.aiControllers?.[side];
    if (controller?.displayName) return controller.displayName;
    const session = record.sessions.find(
      (candidate) => candidate.side === side,
    );
    if (session?.displayName) return session.displayName;
    return undefined;
  }

  private lobbyResultFor(
    record: StoredMatch,
    actorSide: Side,
    activated = false,
  ): Extract<LobbyActionResult, { ok: true }> {
    const actorPayload =
      activated || record.match.status === "active"
        ? this.payloadFor(record, actorSide)
        : this.lobbyPayloadFor(record, actorSide);
    const opponentSide = opposite(actorSide);
    const opponentPayload = record.sessions.some(
      (session) => session.side === opponentSide,
    )
      ? activated || record.match.status === "active"
        ? this.payloadFor(record, opponentSide)
        : this.lobbyPayloadFor(record, opponentSide)
      : undefined;
    return {
      ok: true,
      actorPayload,
      ...(opponentPayload ? { opponentPayload } : {}),
      ...(activated ? { activated: true } : {}),
    };
  }

  private setReadyFlagForSession(
    record: StoredMatch,
    session: SessionRecord,
    ready: boolean,
  ): void {
    if (!record.startLobby) return;
    const player = playerSlotForSession(record, session);
    if (player === "player_a") record.startLobby.hostReady = ready;
    else record.startLobby.joinerReady = ready;
  }

  private cancelCountdownFor(record: StoredMatch, side: Side): void {
    const session = record.sessions.find(
      (candidate) => candidate.side === side,
    );
    if (session) this.setReadyFlagForSession(record, session, false);
    this.clearCountdown(record);
  }

  private clearCountdown(record: StoredMatch): void {
    if (!record.startLobby) return;
    delete record.startLobby.countdownStartedAt;
    delete record.startLobby.countdownEndsAt;
    if (!record.gameState && record.match.status === "countdown")
      record.match.status = "ready_check";
  }

  private startLobbyCountdown(record: StoredMatch): void {
    if (!record.startLobby) return;
    const startedAt = this.now();
    const endsAt = new Date(
      new Date(startedAt).getTime() + record.startLobby.countdownSeconds * 1000,
    ).toISOString();
    record.startLobby.countdownStartedAt = startedAt;
    record.startLobby.countdownEndsAt = endsAt;
    record.match.status = "countdown";
  }

  private activateReadyLobby(record: StoredMatch): void {
    const lobby = record.startLobby;
    const participants = record.privateDeckSnapshots?.participants;
    if (!lobby || !participants) throw new Error("lobby_not_ready");
    const resolved: ResolvedParticipantDeckSetup = {
      player_a: {
        runnerSnapshot: clone(participants.player_a.runner),
        corpSnapshot: clone(participants.player_a.corp),
        runnerDeck: buildDeckFromSnapshot(participants.player_a.runner),
        corpDeck: buildDeckFromSnapshot(participants.player_a.corp),
      },
      player_b: {
        runnerSnapshot: clone(participants.player_b.runner),
        corpSnapshot: clone(participants.player_b.corp),
        runnerDeck: buildDeckFromSnapshot(participants.player_b.runner),
        corpDeck: buildDeckFromSnapshot(participants.player_b.corp),
      },
    };
    const hostSide = record.sessions[0]?.side ?? "runner";
    const deckSetup = deckSetupForParticipants(resolved, lobby.sideAssignment);
    const baseline = baselineForMode(record.match.mode, deckSetup);
    const controllers = controllersForMode(record.match.mode, hostSide, {
      runnerDifficulty: "normal",
      corpDifficulty: "normal",
    });
    assertValidAiDeckSnapshotsForControllers(deckSetup, controllers);
    const gameState = createGame({
      matchId: record.match.matchId,
      seed: record.match.seed ?? record.match.matchId,
      baseline,
      agendaPointsToWin: lobby.agendaPointsToWin,
      controllers,
      runnerDeck: deckSetup.runnerDeck,
      corpDeck: deckSetup.corpDeck,
      runnerDeckMetadata: deckSetup.runnerSnapshot.publicMetadata,
      corpDeckMetadata: deckSetup.corpSnapshot.publicMetadata,
    });
    record.gameState = gameState;
    record.match.status = "active";
    record.match.baseline = baseline;
    record.match.settings = {
      ...record.match.settings,
      agendaPointsToWin: lobby.agendaPointsToWin,
      matchFormat: lobby.matchFormat,
      cardPool: lobby.cardPool,
    };
    record.eventLog = gameState.eventLog.map((event) =>
      toEventRecord(record.match.matchId, event, false),
    );
    record.stateSnapshots = [
      this.snapshotFor(
        record.match.matchId,
        gameState,
        record.match.matchVersion,
        "snap_initial",
        false,
      ),
    ];
    delete record.startLobby;
  }

  private finalizeFinishedMatch(record: StoredMatch): void {
    if (!record.gameState?.winner) return;
    record.match.status = "finished";
    record.match.winner = record.gameState.winner;
    this.finalizeSeriesGame(record);
  }

  private finalizeSeriesGame(record: StoredMatch): void {
    const series = record.match.series;
    const state = record.gameState;
    const winner = record.lifecycleResult?.winnerSide ?? state?.winner;
    if (!series || !state || !winner) return;
    const finalStateHash =
      record.lifecycleResult?.finalEngineStateHash ?? hashState(state);
    if (
      !series.results.some((result) => result.matchId === record.match.matchId)
    ) {
      const runnerAgendaPoints = getPlayerView(state, "runner").own
        .agendaPoints;
      const corpAgendaPoints = getPlayerView(state, "corp").own.agendaPoints;
      const lifecycleReason = record.lifecycleResult?.reason;
      const reason: GameResultReason =
        lifecycleReason === "forfeit" || lifecycleReason === "time_expired"
          ? lifecycleReason
          : resultReason(
              state,
              winner,
              runnerAgendaPoints,
              corpAgendaPoints,
              record.match.settings.agendaPointsToWin,
            );
      series.results.push({
        matchId: record.match.matchId,
        gameNumber: series.gameNumber,
        winner,
        reason,
        runnerPlayer: series.runnerPlayer,
        corpPlayer: series.corpPlayer,
        runnerAgendaPoints,
        corpAgendaPoints,
        finishedAt: record.match.updatedAt,
        finalStateHash,
      });
    }
    series.status =
      series.results.length >= series.gamesPlanned
        ? "finished"
        : "between_games";
  }

  private maybeRunAiAfterTransition(record: StoredMatch): void {
    for (
      let count = 0;
      count < 4 &&
      record.match.status === "active" &&
      record.gameState?.pendingChoice?.source === "setup.mulligan" &&
      this.aiControllableSide(record);
      count += 1
    ) {
      if (!this.runAiStep(record).ok) return;
    }
    if (record.match.aiPacingMode === "fast") this.runAiUntilNextHuman(record);
  }

  private runAiUntilNextHuman(record: StoredMatch): AiStepResult {
    let state = record.gameState;
    if (!state) return { ok: false, code: "ai_no_action" };
    let lastResult: AiStepResult = { ok: false, code: "ai_no_action" };
    for (
      let count = 0;
      count < 40 &&
      record.match.status === "active" &&
      !state.winner &&
      this.aiControllableSide(record);
      count += 1
    ) {
      const stepResult = this.runAiStep(record);
      if (!stepResult.ok) return stepResult;
      lastResult = stepResult;
      state = record.gameState;
      if (!state) return { ok: false, code: "ai_no_action" };
    }
    return lastResult;
  }

  private runAiStep(record: StoredMatch): AiStepResult {
    const state = record.gameState;
    if (
      !state ||
      record.match.status !== "active" ||
      state.winner ||
      !this.aiControllableSide(record)
    )
      return { ok: false, code: "ai_no_action" };
    const side = selectAiDecisionSideForState(state).side;
    if (!side) return { ok: false, code: "ai_no_action" };
    if (!this.isAiSide(record, side))
      return { ok: false, code: "ai_no_action" };
    const legalActions = getLegalActions(state, side);
    if (legalActions.length === 0) return { ok: false, code: "ai_no_action" };
    const controller = record.match.aiControllers?.[side];
    let input: AiDecisionInput;
    try {
      const ownDeckSnapshot = assertRecordAiDeckSnapshotForRuntime(
        record,
        side,
      );
      input = buildAiDecisionInput(state, side, {
        difficulty: controller?.difficulty ?? "normal",
        profileId:
          controller?.profileId ??
          `${side}-server-ai-v0.9-${controller?.difficulty ?? "normal"}`,
        decisionId: `${record.match.matchId}:${state.stateVersion}:${side}`,
        actionNumber: state.stateVersion,
        ownDeckSnapshot,
        expectedDeckSnapshot: aiDeckSnapshotExpectationFor(record, side),
      });
    } catch (error) {
      if (isAiDeckSnapshotRuntimeError(error))
        return { ok: false, code: error.code };
      throw error;
    }
    const decision = this.chooseAiAction(input, {
      quoteRandomizedIceInstallSelection: (request) =>
        quoteRandomizedIceInstallSelection(state, request),
    });
    const directLegalAction =
      decision.selectionKind === "engine_randomized_ice_install_selection"
        ? undefined
        : legalActionForAiDecision(decision, legalActions);
    if (
      decision.selectionKind !== "engine_randomized_ice_install_selection" &&
      !directLegalAction
    )
      return { ok: false, code: "ai_decision_action_not_legal" };
    const snapshot = this.snapshotFor(
      record.match.matchId,
      state,
      record.match.matchVersion,
      `snap_before_${state.stateVersion + 1}`,
      false,
    );
    let result: Extract<EngineResult, { ok: true }>;
    let legalAction: LegalAction;
    if (decision.selectionKind === "engine_randomized_ice_install_selection") {
      const randomizedResult = this.applyEngineRandomizedIceInstallSelection(
        state,
        {
          ...decision.engineCommand,
          idempotencyKey:
            decision.engineCommand.idempotencyKey ??
            `ai-${side}-${state.stateVersion}`,
        },
        { publicEventsMode: "latest" },
      );
      if (!randomizedResult.ok) {
        return {
          ok: false,
          code: "ai_engine_action_rejected",
          engineErrorCode: randomizedResult.error.code,
        };
      }
      result = randomizedResult;
      legalAction = randomizedResult.receipt.selectedLegalAction;
    } else {
      const directResult = this.applyEngineAction(
        state,
        {
          matchId: record.match.matchId,
          side,
          actionId: directLegalAction!.actionId,
          clientKnownStateVersion: state.stateVersion,
          ...(decision.selectedChoices
            ? { selectedChoices: decision.selectedChoices }
            : {}),
          idempotencyKey: `ai-${side}-${state.stateVersion}`,
        },
        { publicEventsMode: "latest" },
      );
      if (!directResult.ok) {
        return {
          ok: false,
          code: "ai_engine_action_rejected",
          engineErrorCode: directResult.error.code,
        };
      }
      result = directResult;
      legalAction = directLegalAction!;
    }
    const event: GameEvent = {
      ...result.event,
      publicPayload: {
        ...result.event.publicPayload,
        aiReasonCode: decision.reasonCode,
        aiExplanation: decision.explanation,
        ...(decision.decisionDebug
          ? {
              aiDecisionDebug: replayDecisionDebug(
                decision.decisionDebug,
                side,
              ),
            }
          : {}),
        ...(decision.fallbackUsed ? { aiFallbackUsed: true } : {}),
        ...(decision.timeoutUsed ? { aiTimeoutUsed: true } : {}),
        ...(typeof decision.confidence === "number"
          ? { aiConfidence: decision.confidence }
          : {}),
      },
    };
    const barrier = isHiddenInfoBarrier(event);
    record.stateSnapshots.push({ ...snapshot, hiddenInfoBarrier: barrier });
    const occurredAt = this.now();
    const trace = aiDecisionTraceFor(
      record,
      event,
      side,
      legalAction,
      decision,
      normalizeAiDecisionTraceMode(record.match.aiTraceMode),
      occurredAt,
    );
    if (trace) {
      const traces = record.aiDecisionTraces ?? [];
      traces.push(trace);
      record.aiDecisionTraces = traces;
    }
    record.gameState = result.state;
    record.eventLog.push(toEventRecord(record.match.matchId, event, barrier));
    record.match.matchVersion += 1;
    record.match.updatedAt = occurredAt;
    if (result.state.winner) this.finalizeFinishedMatch(record);
    return { ok: true };
  }

  private aiTurnPresentationFor(
    record: StoredMatch,
    side: Side,
  ): AiTurnPresentationState | undefined {
    if (!record.gameState || !record.match.aiControllers) return undefined;
    if (record.match.status !== "active") {
      return {
        canAdvanceAi: false,
        pacingMode: record.match.aiPacingMode ?? "fast",
      };
    }
    const activeAiSide = this.aiControllableSide(record);
    return {
      ...(activeAiSide ? { activeAiSide } : {}),
      canAdvanceAi: Boolean(
        record.match.status === "active" &&
        activeAiSide &&
        (record.match.mode === "ai_vs_ai" || !this.isAiSide(record, side)) &&
        !record.gameState.winner,
      ),
      pacingMode: record.match.aiPacingMode ?? "fast",
    };
  }

  private aiControllableSide(record: StoredMatch): Side | undefined {
    const state = record.gameState;
    if (!state) return undefined;
    const side = selectAiDecisionSideForState(state).side;
    return side && this.isAiSide(record, side) ? side : undefined;
  }

  private isAiSide(record: StoredMatch, side: Side): boolean {
    return record.match.aiControllers?.[side]?.type === "ai";
  }

  private async mustLoad(
    matchId: string,
    options?: { includeStateSnapshots?: boolean },
  ): Promise<StoredMatch | undefined> {
    return this.storage.load(matchId, options);
  }

  private async mustLoadForAction(
    matchId: string,
    input: ActionPersistenceLoadInput,
  ): Promise<StoredMatch | undefined> {
    if (this.storage.loadForAction && this.storage.saveActionDelta) {
      const record = await this.storage.loadForAction(matchId, input);
      if (!record || record.actionPersistenceBaseline) return record;
    }
    return this.storage.load(matchId, { includeStateSnapshots: false });
  }

  private authenticate(
    record: StoredMatch,
    side: Side,
    sessionToken: string,
  ): SessionRecord | undefined {
    const hash = this.hashToken(sessionToken);
    const token = record.tokens.find(
      (candidate) =>
        candidate.kind === "session" &&
        candidate.tokenHash === hash &&
        !candidate.revokedAt,
    );
    if (!token) return undefined;
    return record.sessions.find(
      (session) => session.side === side && session.sessionTokenHash === hash,
    );
  }

  private authenticateForRecreate(
    record: StoredMatch,
    side: Side,
    sessionToken: string,
  ): SessionRecord | undefined {
    const active = this.authenticate(record, side, sessionToken);
    if (active) return active;
    if (!isTerminalStatus(record.match.status)) return undefined;
    const hash = this.hashToken(sessionToken);
    return record.sessions.find(
      (session) => session.side === side && session.sessionTokenHash === hash,
    );
  }

  private findToken(
    record: StoredMatch,
    token: string,
    kind: TokenKind,
  ): TokenRecord | undefined {
    const hash = this.hashToken(token);
    return record.tokens.find(
      (candidate) =>
        candidate.kind === kind &&
        candidate.tokenHash === hash &&
        !candidate.revokedAt &&
        !candidate.usedAt,
    );
  }

  private resolveJoinTokenForJoinInput(
    record: StoredMatch,
    token: string | undefined,
  ): TokenRecord | undefined {
    const candidate = token?.trim();
    if (candidate) return this.findToken(record, candidate, "join");
    if (
      record.match.mode !== "human_vs_human" ||
      record.match.status !== "pending" ||
      !record.match.isPublic
    )
      return undefined;
    return this.openJoinToken(record);
  }

  private openJoinToken(record: StoredMatch): TokenRecord | undefined {
    return record.tokens.find(
      (candidate) =>
        candidate.kind === "join" &&
        !candidate.revokedAt &&
        !candidate.usedAt &&
        !record.sessions.some(
          (session) => session.side === candidate.allowedSide,
        ),
    );
  }

  private revokeAllTokens(record: StoredMatch, now: string): void {
    record.tokens = record.tokens.map((token) =>
      token.revokedAt ? token : { ...token, revokedAt: now },
    );
  }

  private revokeTokenByHash(
    record: StoredMatch,
    kind: TokenKind,
    tokenHash: string,
    now: string,
  ): void {
    record.tokens = record.tokens.map((token) =>
      token.kind === kind && token.tokenHash === tokenHash && !token.revokedAt
        ? { ...token, revokedAt: now }
        : token,
    );
  }

  private tokenRecord(
    matchId: string,
    side: Side,
    kind: TokenKind,
    token: string,
    now: string,
  ): TokenRecord {
    return {
      tokenId: randomId("token"),
      matchId,
      kind,
      allowedSide: side,
      tokenHash: this.hashToken(token),
      createdAt: now,
    };
  }

  private hashToken(token: string): string {
    return `sha256:${createHash("sha256").update(`${this.tokenSalt}:${token}`).digest("hex")}`;
  }

  private receiptFor(
    record: StoredMatch,
    side: Side,
    idempotencyKey: string,
    accepted: boolean,
    errorCode?: string,
  ): ActionReceipt {
    if (!record.gameState) throw new Error("match_not_active");
    return {
      idempotencyKey,
      matchId: record.match.matchId,
      side,
      accepted,
      stateVersionBefore: record.gameState.stateVersion,
      stateVersionAfter: record.gameState.stateVersion,
      stateHashAfter: hashState(record.gameState),
      ...(errorCode ? { errorCode } : {}),
    };
  }

  private snapshotFor(
    matchId: string,
    gameState: GameState,
    matchVersion: number,
    snapshotId: string,
    hiddenInfoBarrier: boolean,
  ): StateSnapshot {
    return {
      snapshotId,
      matchId,
      stateVersion: gameState.stateVersion,
      matchVersion,
      stateHash: hashState(gameState),
      gameState: cloneGameStateWithoutEventLog(gameState),
      createdAt: this.now(),
      hiddenInfoBarrier,
    };
  }

  private webSocketUrl(): string {
    return `${this.serverBaseUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:")}/ws`;
  }

  private async withMatchLock<T>(
    matchId: string,
    work: () => Promise<T>,
  ): Promise<T> {
    const previous = this.locks.get(matchId) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const lock = previous.then(() => current);
    this.locks.set(matchId, lock);
    await previous;
    try {
      return await work();
    } finally {
      release();
      if (this.locks.get(matchId) === lock) this.locks.delete(matchId);
    }
  }
}

function isSidePayload(payload: ServicePayload): payload is SidePayload {
  return "playerView" in payload;
}

function retentionProtectionPayload(record: StoredMatch): {
  retentionProtected: boolean;
  retentionProtectedAt?: string;
} {
  if (record.match.retentionProtection?.protected !== true)
    return { retentionProtected: false };
  return {
    retentionProtected: true,
    ...(record.match.retentionProtection.protectedAt
      ? { retentionProtectedAt: record.match.retentionProtection.protectedAt }
      : {}),
  };
}

function isTerminalStatus(status: MatchStatus): boolean {
  return (
    status === "cancelled" ||
    status === "abandoned" ||
    status === "forfeited" ||
    status === "finished"
  );
}

function isCompletedGameStatus(
  status: MatchStatus,
): status is Extract<MatchStatus, "finished" | "forfeited"> {
  return status === "finished" || status === "forfeited";
}

function publicMatchStatusPriority(
  status: PublicMatchListEntry["status"],
): number {
  if (status === "open") return 0;
  if (status === "active") return 1;
  return 2;
}

function isSeriesGameCompleteForNext(record: StoredMatch): boolean {
  if (!record.gameState) return false;
  if (record.match.status === "finished" && Boolean(record.gameState.winner))
    return true;
  return (
    record.match.status === "forfeited" &&
    record.lifecycleResult?.reason === "forfeit" &&
    Boolean(record.lifecycleResult.winnerSide)
  );
}

function isCancellableLobbyStatus(status: MatchStatus): boolean {
  return (
    status === "pending" ||
    status === "waiting_for_runner" ||
    status === "waiting_for_corp" ||
    status === "waiting_for_joiner_decks" ||
    status === "ready_check" ||
    status === "countdown"
  );
}

function isHostSession(record: StoredMatch, session: SessionRecord): boolean {
  return record.sessions[0]?.sessionId === session.sessionId;
}

function normalizeMatchFormat(
  matchFormat: MatchFormat | undefined,
): MatchFormat {
  if (matchFormat === "two_game_side_swap") return "two_game_side_swap";
  return "rules_match";
}

function normalizeSeriesGamesPlanned(value: number | undefined): number {
  return boundedWholeNumber(value, 2, 2, 6);
}

function normalizeMatchCardPool(
  cardPool: MatchCardPool | undefined,
): MatchCardPool {
  if (
    cardPool === "originalset_classic" ||
    cardPool === "originalset_proteus" ||
    cardPool === "originalset_classic_proteus"
  )
    return cardPool;
  return "originalset";
}

function normalizePlayerClockConfig(
  config: ApiPlayerClockConfig | undefined,
): ApiPlayerClockConfig {
  if (!config || config.mode !== "player_clock") return { mode: "none" };
  const startingTimeMs = boundedWholeNumber(
    config.startingTimeMs,
    5 * 60_000,
    60_000,
    120 * 60_000,
  );
  const gracePeriodMs = boundedWholeNumber(
    config.gracePeriodMs,
    10_000,
    0,
    60_000,
  );
  return { mode: "player_clock", startingTimeMs, gracePeriodMs };
}

function normalizeAiDecisionTraceMode(value: unknown): AiDecisionTraceMode {
  return value === "summary" || value === "detailed" ? value : "off";
}

function initialPlayerClockState(
  config: ApiPlayerClockConfig,
): PlayerClockState {
  if (config.mode !== "player_clock") {
    return {
      mode: "none",
      consumedMs: { runner: 0, corp: 0 },
    };
  }
  return {
    mode: "player_clock",
    startingTimeMs: config.startingTimeMs ?? 5 * 60_000,
    gracePeriodMs: config.gracePeriodMs ?? 10_000,
    remainingMs: {
      runner: config.startingTimeMs ?? 5 * 60_000,
      corp: config.startingTimeMs ?? 5 * 60_000,
    },
    consumedMs: { runner: 0, corp: 0 },
  };
}

function timeExpiredEventRecord(
  record: StoredMatch,
  expiredSide: Side,
  winnerSide: Side,
  occurredAt: string,
  finalStateHash: string,
): EventRecord {
  const stateVersion = record.gameState?.stateVersion ?? 0;
  const event: PublicGameEvent = {
    eventId: `time_expired_${record.match.matchVersion}`,
    type: "time_expired",
    stateVersionBefore: stateVersion,
    stateVersionAfter: stateVersion,
    stateHashAfter: finalStateHash,
    publicPayload: {
      type: "time_expired",
      actionType: "time_expired",
      actor: expiredSide,
      winnerSide,
      loserSide: expiredSide,
      occurredAt,
      label: `${expiredSide === "runner" ? "Runner" : "Korp"} verliert durch Zeitablauf.`,
    },
  };
  return {
    eventId: event.eventId,
    matchId: record.match.matchId,
    stateVersionBefore: stateVersion,
    stateVersionAfter: stateVersion,
    stateHashAfter: finalStateHash,
    publicPayload: event,
    privatePayloadLocalOnly: false,
    hiddenInfoBarrier: false,
  };
}

function boundedWholeNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function agendaPointsToWinFor(
  _matchFormat: MatchFormat,
  explicit: number | undefined,
): number {
  if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0)
    return Math.floor(explicit);
  return RULE_AGENDA_POINTS_TO_WIN;
}

function normalizeCountdownSeconds(value: number | undefined): 3 | 5 | 10 {
  return value === 5 || value === 10 ? value : 3;
}

function sideForSeriesPlayer(
  assignment: MatchStartLobbyState["sideAssignment"],
  player: SeriesPlayerSlot,
): Side {
  return assignment.runnerPlayer === player ? "runner" : "corp";
}

function playerSlotForSession(
  record: StoredMatch,
  session: SessionRecord,
): SeriesPlayerSlot {
  return record.sessions[0]?.sessionId === session.sessionId
    ? "player_a"
    : "player_b";
}

function connectionQualityFor(
  session: SessionRecord | undefined,
  now: string,
): ConnectionQuality {
  if (!session?.connected) return "offline";
  const age = new Date(now).getTime() - new Date(session.lastSeenAt).getTime();
  if (Number.isFinite(age) && age > 30_000) return "unstable";
  return "online";
}

function toEventRecord(
  matchId: string,
  event: GameEvent,
  barrier: boolean,
): EventRecord {
  return projectEngineEventToServerRecord(matchId, event, barrier);
}

function replayIndexEntryFor(
  record: StoredMatch,
  checks?: ReturnType<typeof replayStateHashChecks>,
): ReplayIndexEntry {
  const names = participantNamesForReplay(record);
  const winner = record.match.winner ?? record.gameState.winner ?? undefined;
  return {
    replayId: `replay:${record.match.matchId}`,
    matchId: record.match.matchId,
    status: record.match.status,
    baseline: record.match.baseline,
    matchMode: record.match.mode,
    matchFormat: record.match.settings.matchFormat,
    createdAt: record.match.createdAt,
    updatedAt: record.match.updatedAt,
    ...(winner ? { winner } : {}),
    finalStateHash: hashState(record.gameState),
    replayCheckStatus: checks ? "verified" : "unchecked",
    ...(checks ? { replayOk: checks.errors.length === 0 } : {}),
    participantNames: names,
    participantSides: replayParticipantSides(record),
  };
}

function legalActionForAiDecision(
  decision: AiDecision,
  legalActions: readonly LegalAction[],
): LegalAction | undefined {
  if (decision.selectionKind === "engine_randomized_ice_install_selection") {
    return undefined;
  }
  return legalActions.find(
    (candidate) => candidate.actionId === decision.actionId,
  );
}

function participantNamesForReplay(
  record: StoredMatch,
): ReplayIndexEntry["participantNames"] {
  const bySide: ReplayIndexEntry["participantNames"] = {};
  for (const session of record.sessions) {
    if (session.side === "runner" && !bySide.runner)
      bySide.runner = session.displayName;
    if (session.side === "corp" && !bySide.corp)
      bySide.corp = session.displayName;
  }
  if (record.match.aiControllers?.runner) bySide.runner = "Runner-KI";
  if (record.match.aiControllers?.corp) bySide.corp = "Corp-KI";
  return bySide;
}

function replayParticipantSides(
  record: StoredMatch,
): Record<SeriesPlayerSlot, Side> {
  const assignment =
    record.match.deckSetup.assignment ?? record.startLobby?.sideAssignment;
  if (assignment) {
    return {
      player_a: assignment.runnerPlayer === "player_a" ? "runner" : "corp",
      player_b: assignment.runnerPlayer === "player_b" ? "runner" : "corp",
    };
  }
  const playerASide = record.sessions[0]?.side ?? "runner";
  return { player_a: playerASide, player_b: opposite(playerASide) };
}

function replayEventsForPerspective(
  record: StoredMatch,
  perspective: ReplayPerspective,
): PublicGameEvent[] {
  return projectReplayEventsForPerspective(record.eventLog, perspective);
}

function replayChronicleEvent(event: PublicGameEvent): PublicGameEvent {
  const { aiDecisionDebug: _aiDecisionDebug, ...publicPayload } =
    event.publicPayload;
  return { ...event, publicPayload };
}

function replayStateHashChecks(record: StoredMatch): {
  byEventId: Record<
    string,
    ReplayStateHashCheck & { randomDrawCounters: number[] }
  >;
  errors: string[];
} {
  const byEventId: Record<
    string,
    ReplayStateHashCheck & { randomDrawCounters: number[] }
  > = {};
  const errors: string[] = [];
  const initial = record.stateSnapshots[0]?.gameState;
  if (!initial) {
    errors.push("initial_snapshot_missing");
    return { byEventId, errors };
  }

  let replayState = clone(initial);
  for (const event of record.gameState.eventLog) {
    const replayAction = replayActionFromEvent(event);
    if (!replayAction) {
      if (event.type === "game_created") {
        const actual = hashState(replayState);
        const ok = actual === event.stateHashAfter;
        byEventId[event.eventId] = {
          ok,
          expected: event.stateHashAfter,
          actual,
          ...(ok ? {} : { reason: "state_hash_mismatch" }),
          randomDrawCounters: [],
        };
        if (!ok) errors.push(`state_hash_mismatch:${event.eventId}`);
        continue;
      }
      byEventId[event.eventId] = {
        ok: false,
        expected: event.stateHashAfter,
        reason: "missing_replay_action",
        randomDrawCounters: [],
      };
      errors.push(`missing_replay_action:${event.eventId}`);
      continue;
    }

    const beforeRandomCounter = replayState.randomCounter;
    const result = isRandomizedIceInstallSelectionCommand(replayAction)
      ? applyRandomizedIceInstallSelection(replayState, replayAction)
      : applyAction(replayState, replayAction);
    if (!result.ok) {
      byEventId[event.eventId] = {
        ok: false,
        expected: event.stateHashAfter,
        reason: result.error.code,
        randomDrawCounters: [],
      };
      errors.push(`replay_failed:${event.eventId}:${result.error.code}`);
      continue;
    }

    const counters: number[] = [];
    for (
      let counter = beforeRandomCounter;
      counter < result.state.randomCounter;
      counter += 1
    )
      counters.push(counter);
    const ok = result.stateHash === event.stateHashAfter;
    byEventId[event.eventId] = {
      ok,
      expected: event.stateHashAfter,
      actual: result.stateHash,
      ...(ok ? {} : { reason: "state_hash_mismatch" }),
      randomDrawCounters: counters,
    };
    if (!ok) errors.push(`state_hash_mismatch:${event.eventId}`);
    replayState = result.state;
  }

  return { byEventId, errors };
}

function replayAnalysisFrames(record: StoredMatch): ApiReplayAnalysisFrame[] {
  const statesByVersion = new Map<
    number,
    { state: GameState; persistedHash?: string }
  >();
  for (const snapshot of record.stateSnapshots) {
    statesByVersion.set(snapshot.stateVersion, {
      state: snapshot.gameState,
      persistedHash: snapshot.stateHash,
    });
  }
  statesByVersion.set(record.gameState.stateVersion, {
    state: record.gameState,
    persistedHash: hashState(record.gameState),
  });

  const eventByStateVersion = new Map(
    record.gameState.eventLog.map((event) => [event.stateVersionAfter, event]),
  );
  return [...statesByVersion.values()]
    .sort((left, right) => left.state.stateVersion - right.state.stateVersion)
    .map(({ state, persistedHash }, index) => {
      const event = eventByStateVersion.get(state.stateVersion);
      const actualHash = hashState(state);
      return replayAnalysisFrameFor(state, {
        index,
        ...(event ? { sourceEventId: event.eventId } : {}),
        stateHashVerified:
          actualHash === persistedHash &&
          (!event || actualHash === event.stateHashAfter),
      });
    });
}

function replayAnalysisFrameFor(
  state: GameState,
  input: { index: number; sourceEventId?: string; stateHashVerified: boolean },
): ApiReplayAnalysisFrame {
  return {
    index: input.index,
    ...(input.sourceEventId ? { sourceEventId: input.sourceEventId } : {}),
    stateVersion: state.stateVersion,
    stateHash: hashState(state),
    stateHashVerified: input.stateHashVerified,
    activeSide: state.activeSide,
    phase: state.phase,
    timingPoint: state.timingPoint,
    playerViews: {
      runner: replayPlayerViewFor(state, "runner"),
      corp: replayPlayerViewFor(state, "corp"),
    },
  };
}

function replayPlayerViewFor(state: GameState, side: Side): PlayerView {
  const { pendingChoice: _pendingChoice, ...view } = getPlayerView(state, side);
  return {
    ...view,
    publicEvents: [],
    legalActions: [],
  };
}

function replayActionFromEvent(
  event: GameEvent,
): ReplayableEngineAction | undefined {
  const payload = event.privatePayload;
  if (!payload || typeof payload !== "object") return undefined;
  for (const side of ["runner", "corp"] as const) {
    const local = payload[side];
    if (!local || typeof local !== "object" || !("action" in local)) continue;
    const action = (local as { action?: unknown }).action;
    if (!action || typeof action !== "object") continue;
    if (
      "kind" in action &&
      action.kind === "engine_randomized_ice_install_selection"
    ) {
      const command =
        action as Partial<EngineRandomizedIceInstallSelectionCommand>;
      if (!command.quote || typeof command.quote !== "object") return undefined;
      return command as EngineRandomizedIceInstallSelectionCommand;
    }
    const candidate = action as Partial<PlayerAction>;
    if (candidate.side !== "runner" && candidate.side !== "corp") continue;
    if (
      typeof candidate.matchId !== "string" ||
      typeof candidate.actionId !== "string" ||
      typeof candidate.clientKnownStateVersion !== "number"
    )
      continue;
    if (typeof candidate.idempotencyKey !== "string") continue;
    return candidate as PlayerAction;
  }
  return undefined;
}

function isRandomizedIceInstallSelectionCommand(
  action: ReplayableEngineAction,
): action is EngineRandomizedIceInstallSelectionCommand {
  return (
    "kind" in action &&
    action.kind === "engine_randomized_ice_install_selection"
  );
}

function replayTimelineStepFor(input: {
  event: PublicGameEvent;
  index: number;
  perspective: ReplayPerspective;
  stateHashCheck: ReplayStateHashCheck & { randomDrawCounters: number[] };
}): ReplayTimelineStep {
  const { event, stateHashCheck } = input;
  const actor = sideValue(event.publicPayload.actor);
  const actionType = stringValue(event.publicPayload.actionType) ?? event.type;
  const label = stringValue(event.publicPayload.label) ?? actionType;
  const decisionDebug = replayDecisionDebugForPerspective(
    event.publicPayload.aiDecisionDebug,
    actor,
    input.perspective,
  );
  return {
    eventId: event.eventId,
    index: input.index,
    ...(actor ? { side: actor } : {}),
    actionType,
    timingPoint: stringValue(event.publicPayload.timingPoint) ?? "unknown",
    label,
    ...(stringValue(event.publicPayload.serverLabel)
      ? { serverLabel: stringValue(event.publicPayload.serverLabel)! }
      : {}),
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    stateHashCheck,
    visibilityClass: event.visibilityClass ?? "public",
    hiddenInfoBarrier: event.visibilityClass === "hidden_info_barrier",
    randomDrawCounters: stateHashCheck.randomDrawCounters,
    eventFamily: replayEventFamily(actionType, event.publicPayload),
    learningHint: replayLearningHint(actionType, event.publicPayload),
    ...(decisionDebug ? { decisionDebug } : {}),
  };
}

function replayDecisionDebugForPerspective(
  debug: unknown,
  actor: Side | undefined,
  perspective: ReplayPerspective,
): Record<string, unknown> | undefined {
  if (!debug || typeof debug !== "object" || Array.isArray(debug))
    return undefined;
  if (perspective !== "local_analysis" && actor && perspective !== actor) {
    return {
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      redacted: true,
      reason: "side_private_ai_debug",
    };
  }
  return replayDecisionDebug(debug, actor);
}

function replayDecisionDebug(
  debug: unknown,
  actor: Side | undefined,
): Record<string, unknown> | undefined {
  const safeDebug = sanitizeAiDecisionDebug(debug);
  if (!safeDebug) return undefined;
  const result: Record<string, unknown> = {};
  result.schemaVersion = safeDebug.schemaVersion;
  result.aiLevel = safeDebug.aiLevel;
  if (typeof safeDebug.summary === "string") result.summary = safeDebug.summary;
  if (typeof safeDebug.planKind === "string")
    result.planKind = safeDebug.planKind;
  if (typeof safeDebug.memoryVersion === "string")
    result.memoryVersion = safeDebug.memoryVersion;
  if (Array.isArray(safeDebug.rankedAlternatives))
    result.rankedAlternatives = safeDebug.rankedAlternatives.slice(0, 24);
  if (Array.isArray(safeDebug.actionAlternatives))
    result.actionAlternatives = safeDebug.actionAlternatives.slice(0, 32);
  if (Array.isArray(safeDebug.scoreBreakdown))
    result.scoreBreakdown = safeDebug.scoreBreakdown.slice(0, 16);
  if (Array.isArray(safeDebug.whyNot))
    result.whyNot = safeDebug.whyNot.slice(0, 8);
  if (Array.isArray(safeDebug.longTermPlan))
    result.longTermPlan = safeDebug.longTermPlan.slice(0, 8);
  if (Array.isArray(safeDebug.warnings))
    result.warnings = safeDebug.warnings.slice(0, 8);
  if (Array.isArray(safeDebug.detailSections)) {
    result.detailSections = aiDecisionTraceDetailSections(
      safeDebug.detailSections,
    );
  }
  if (Array.isArray(safeDebug.facts))
    result.facts = safeDebug.facts.slice(0, 8);
  if (Array.isArray(safeDebug.hypotheses))
    result.hypotheses = safeDebug.hypotheses.slice(0, 8);
  if (Array.isArray(safeDebug.uncertainty))
    result.uncertainty = safeDebug.uncertainty.slice(0, 8);
  if (typeof safeDebug.fallbackUsed === "boolean")
    result.fallbackUsed = safeDebug.fallbackUsed;
  if (typeof safeDebug.timeoutUsed === "boolean")
    result.timeoutUsed = safeDebug.timeoutUsed;
  if (typeof safeDebug.confidence === "number")
    result.confidence = safeDebug.confidence;
  if (actor) result.actor = actor;
  return result;
}

export function replayDecisionDebugFromTrace(
  trace: AiDecisionTraceRecord,
): Record<string, unknown> | undefined {
  const debugSchemaVersion = trace.traceJson.debugSchemaVersion;
  if (typeof debugSchemaVersion !== "string") return undefined;
  return replayDecisionDebug(
    {
      ...trace.traceJson,
      schemaVersion: debugSchemaVersion,
    },
    trace.side,
  );
}

function aiDecisionTraceFor(
  record: StoredMatch,
  event: GameEvent,
  side: Side,
  legalAction: LegalAction,
  decision: AiDecision,
  mode: AiDecisionTraceMode,
  createdAt: string,
): AiDecisionTraceRecord | undefined {
  if (mode === "off" || !decision.decisionDebug) return undefined;
  const safeDebug = sanitizeAiDecisionDebug(decision.decisionDebug);
  if (!safeDebug) return undefined;
  const traceJson = aiDecisionTraceJson(safeDebug, side, legalAction, mode);
  const baseline = record.actionPersistenceBaseline;
  const newTraceCount = baseline
    ? Math.max(
        0,
        (record.aiDecisionTraces?.length ?? 0) -
          baseline.loadedAiDecisionTraceCount,
      )
    : 0;
  const decisionIndex =
    (baseline?.aiDecisionTraceCount ?? record.aiDecisionTraces?.length ?? 0) +
    newTraceCount +
    1;
  const selectedActionType = legalAction.type;
  const planKind =
    typeof traceJson.planKind === "string" ? traceJson.planKind : undefined;
  const score =
    typeof traceJson.score === "number" ? traceJson.score : undefined;
  const confidence =
    typeof traceJson.confidence === "number" ? traceJson.confidence : undefined;
  const chronologicalEvents = [
    ...record.eventLog.map((entry) => entry.publicPayload),
    projectEngineEventToPublicEvent(event),
  ];
  const turn =
    chronicleTurnNumberForEvent(chronologicalEvents, event.eventId) ?? 1;
  return {
    traceId: `ai_trace_${record.match.matchId}_${decisionIndex}`,
    matchId: record.match.matchId,
    eventId: event.eventId,
    stateVersion: event.stateVersionBefore,
    matchVersion: record.match.matchVersion,
    side,
    turn,
    decisionIndex,
    selectedActionId: legalAction.actionId,
    selectedActionType,
    ...(planKind ? { planKind } : {}),
    ...(score !== undefined ? { score } : {}),
    ...(confidence !== undefined ? { confidence } : {}),
    createdAt,
    schemaVersion: "ai-decision-trace-v1",
    traceJson,
  };
}

function aiDecisionTraceJson(
  debug: AiDecisionDebug,
  actor: Side,
  legalAction: LegalAction,
  mode: Exclude<AiDecisionTraceMode, "off">,
): Record<string, unknown> {
  const debugSelectedActionType =
    typeof debug.selectedActionType === "string"
      ? debug.selectedActionType
      : undefined;
  const result: Record<string, unknown> = {
    schemaVersion: "ai-decision-trace-v1",
    traceMode: mode,
    debugSchemaVersion: debug.schemaVersion,
    actor,
    aiLevel: debug.aiLevel,
    selectedActionId: legalAction.actionId,
    selectedActionType: legalAction.type,
    debugSelectionMatchesApplied:
      debugSelectedActionType === undefined ||
      debugSelectedActionType === legalAction.type,
  };
  if (
    debugSelectedActionType !== undefined &&
    debugSelectedActionType !== legalAction.type
  ) {
    result.debugSelectedActionType = debugSelectedActionType;
  }
  for (const field of [
    "summary",
    "planId",
    "planKind",
    "profileId",
    "memoryVersion",
  ] as const) {
    const value = debug[field];
    if (typeof value === "string") result[field] = value;
  }
  for (const field of ["score", "confidence", "timeBudgetMs"] as const) {
    const value = debug[field];
    if (typeof value === "number" && Number.isFinite(value))
      result[field] = value;
  }
  for (const field of ["fallbackUsed", "timeoutUsed"] as const) {
    const value = debug[field];
    if (typeof value === "boolean") result[field] = value;
  }
  for (const field of [
    "visibleReasons",
    "whyNot",
    "longTermPlan",
    "warnings",
    "uncertainty",
  ] as const) {
    const value = debug[field];
    if (Array.isArray(value)) result[field] = value.slice(0, 8);
  }
  if (Array.isArray(debug.rankedAlternatives))
    result.rankedAlternatives = debug.rankedAlternatives.slice(
      0,
      mode === "summary" ? 6 : 24,
    );
  if (Array.isArray(debug.actionAlternatives))
    result.actionAlternatives = debug.actionAlternatives.slice(0, 32);
  if (Array.isArray(debug.scoreBreakdown))
    result.scoreBreakdown = debug.scoreBreakdown.slice(0, 16);
  if (debug.decisionChain) {
    result.decisionChain = aiDecisionTraceDecisionChain(
      debug.decisionChain,
      mode,
    );
  }
  if (mode === "detailed") {
    for (const field of [
      "facts",
      "hypotheses",
      "invalidations",
      "beliefUncertainty",
      "evidence",
    ] as const) {
      const value = debug[field];
      if (Array.isArray(value)) result[field] = value.slice(0, 12);
    }
    if (Array.isArray(debug.detailSections)) {
      result.detailSections = aiDecisionTraceDetailSections(
        debug.detailSections,
      );
    }
    if (debug.opponentModel) result.opponentModel = debug.opponentModel;
  }
  return result;
}

function aiDecisionTraceDecisionChain(
  chain: NonNullable<AiDecisionDebug["decisionChain"]>,
  mode: Exclude<AiDecisionTraceMode, "off">,
): Record<string, unknown> {
  if (mode === "detailed") {
    return {
      traceLevel: "detailed",
      ...chain,
    };
  }
  const choiceResolution = chain.finalSelection.choiceResolution;
  return {
    traceLevel: "summary",
    schemaVersion: chain.schemaVersion,
    legalActionCount: chain.legalActionCount,
    excludedActionCount: chain.exclusions.length,
    ...(chain.rawScoreWinner ? { rawScoreWinner: chain.rawScoreWinner } : {}),
    ...(chain.planSelection ? { planSelection: chain.planSelection } : {}),
    ...(chain.planArbitration
      ? { planArbitration: chain.planArbitration }
      : {}),
    priorityCandidates: chain.priorityCandidates,
    initialSelection: chain.initialSelection,
    adjustmentCount: chain.adjustments.length,
    adjustments: chain.adjustments,
    finalSelection: {
      actionId: chain.finalSelection.actionId,
      selectedOptionCount: chain.finalSelection.selectedOptionCount,
      ...(choiceResolution
        ? {
            choiceResolution: {
              choiceId: choiceResolution.choiceId,
              kind: choiceResolution.kind,
              source: choiceResolution.source,
              selectedOptionCount: choiceResolution.selectedOptionIds.length,
            },
          }
        : {}),
    },
  };
}

function aiDecisionTraceDetailSections(
  sections: NonNullable<AiDecisionDebug["detailSections"]>,
): NonNullable<AiDecisionDebug["detailSections"]> {
  const selected = sections.slice(0, AI_DECISION_DETAIL_SECTION_TRACE_LIMIT);
  for (const priorityId of AI_DECISION_DETAIL_SECTION_PRIORITY_IDS) {
    if (selected.some((section) => section.id === priorityId)) continue;
    const prioritySection = sections.find(
      (section) => section.id === priorityId,
    );
    if (!prioritySection) continue;
    let replacementIndex = -1;
    for (let index = selected.length - 1; index >= 0; index -= 1) {
      if (!aiDecisionDetailSectionIsPriority(selected[index]?.id)) {
        replacementIndex = index;
        break;
      }
    }
    if (replacementIndex >= 0) {
      selected[replacementIndex] = prioritySection;
    } else if (selected.length < AI_DECISION_DETAIL_SECTION_TRACE_LIMIT) {
      selected.push(prioritySection);
    }
  }
  return selected.sort(
    (left, right) => sections.indexOf(left) - sections.indexOf(right),
  );
}

function aiDecisionDetailSectionIsPriority(id: string | undefined): boolean {
  return AI_DECISION_DETAIL_SECTION_PRIORITY_IDS.some(
    (priorityId) => priorityId === id,
  );
}

function minimalAiPreviewDetail(
  actor: Side,
  legalAction: LegalAction,
  decision: AiDecision,
): Record<string, unknown> {
  return {
    schemaVersion: "ai-decision-preview-v1",
    actor,
    selectedActionId: legalAction.actionId,
    selectedActionType: legalAction.type,
    debugSelectionMatchesApplied: true,
    summary: decision.explanation,
    confidence: decision.confidence,
    fallbackUsed: decision.fallbackUsed,
    timeoutUsed: Boolean(decision.timeoutUsed),
    visibleReasons: decision.evidence?.slice(0, 8) ?? [decision.reasonCode],
    actionAlternatives: [
      {
        rank: 1,
        actionId: legalAction.actionId,
        actionType: legalAction.type,
        label: legalAction.label,
        source: String(legalAction.source),
        selected: true,
        whyChosen: ["selected_action"],
      },
    ],
    scoreBreakdown: [],
  };
}

function replayRandomDrawEntries(record: StoredMatch): ReplayRandomDrawEntry[] {
  return record.gameState.randomDrawRecords.map((entry) => ({
    counter: entry.counter,
    purpose: publicReplayRandomPurpose(entry.purpose),
    valueHash: `fnv1a:${fnv1a(String(entry.value))}`,
  }));
}

function publicReplayRandomPurpose(purpose: string): string {
  return purpose.includes("engine.randomized_ice_install_selection")
    ? "engine_randomized_ice_install_selection"
    : purpose;
}

function replayExploitSuggestions(
  timeline: ReplayTimelineStep[],
): ReplayExploitSuggestion[] {
  const suggestions: ReplayExploitSuggestion[] = [];
  const lastRunnerRunByServer = new Map<string, number>();
  for (let index = 0; index < timeline.length; index += 1) {
    const current = timeline[index];
    if (!current) continue;
    if (
      current.side === "runner" &&
      current.actionType === "start_run" &&
      isRdLabel(current.serverLabel)
    ) {
      const lastRunIndex = current.serverLabel
        ? lastRunnerRunByServer.get(current.serverLabel)
        : undefined;
      if (lastRunIndex !== undefined) {
        let corpInterruption = false;
        for (
          let stepIndex = lastRunIndex + 1;
          stepIndex < index;
          stepIndex += 1
        ) {
          if (timeline[stepIndex]?.side === "corp") {
            corpInterruption = true;
            break;
          }
        }
        if (!corpInterruption) {
          suggestions.push({
            candidateId: `candidate:${current.eventId}:repeat_rd`,
            eventId: current.eventId,
            reason:
              "Mehrfacher R&D-Run ohne sichtbare Zwischenänderung prüfen.",
            status: "review_suggestion",
          });
        }
      }
      if (current.serverLabel)
        lastRunnerRunByServer.set(current.serverLabel, index);
    }
    if (current.decisionDebug && current.decisionDebug.fallbackUsed === true) {
      suggestions.push({
        candidateId: `candidate:${current.eventId}:fallback`,
        eventId: current.eventId,
        reason: "KI-Fallback in kritischem Timingfenster prüfen.",
        status: "review_suggestion",
      });
    }
  }
  return dedupeReplaySuggestions(suggestions);
}

function dedupeReplaySuggestions(
  items: ReplayExploitSuggestion[],
): ReplayExploitSuggestion[] {
  const seen = new Set<string>();
  const unique: ReplayExploitSuggestion[] = [];
  for (const item of items) {
    const key = `${item.eventId}:${item.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function replayEventFamily(
  actionType: string,
  payload: Record<string, unknown>,
): string {
  if (
    payload.traceStarted === true ||
    typeof payload.traceStep === "string" ||
    typeof payload.traceSuccessful === "boolean"
  )
    return "trace_and_tags";
  if (
    payload.replacementWindowOpened === true ||
    typeof payload.replacementDecision === "string" ||
    typeof payload.eventModificationDecision === "string"
  )
    return "replacement_and_prevention";
  if (
    payload.damageResolved === true ||
    typeof payload.damageType === "string" ||
    typeof payload.flatline === "boolean"
  )
    return "damage_and_survival";
  if (
    typeof payload.specialZone === "string" ||
    typeof payload.controlChange === "string"
  )
    return "special_zones_and_control";
  if (
    actionType === "mandatory_draw" ||
    actionType === "draw_card" ||
    actionType === "gain_credit" ||
    actionType === "end_turn"
  )
    return "turn_and_economy";
  if (
    actionType === "start_run" ||
    actionType === "continue_run" ||
    actionType === "jack_out" ||
    actionType === "break_subroutine" ||
    actionType === "pump_breaker" ||
    actionType === "access_card" ||
    actionType === "trash_accessed_card" ||
    actionType === "decline_trash"
  )
    return "run_and_access";
  if (actionType === "score_agenda" || actionType === "steal_agenda")
    return "agenda";
  if (actionType === "resolve_choice") return "choice";
  if (
    actionType === "trash_resource" ||
    actionType === "remove_tag" ||
    actionType === "purge_virus_counters"
  )
    return "tags_and_board";
  if (
    actionType.includes("set_aside") ||
    actionType.includes("removed_from_game") ||
    actionType.includes("change_card_control")
  )
    return "special_zones_and_control";
  if (actionType.includes("damage") || actionType.includes("flatline"))
    return "damage_and_survival";
  if (actionType.includes("trace") || actionType.includes("tag"))
    return "trace_and_tags";
  if (actionType.includes("replacement") || actionType.includes("prevention"))
    return "replacement_and_prevention";
  return "general";
}

function replayLearningHint(
  actionType: string,
  payload: Record<string, unknown>,
): string {
  const family = replayEventFamily(actionType, payload);
  if (family === "trace_and_tags")
    return "Trace- und Tag-Schritte zeigen nur legale Bids und sichtbare Folgen pro Perspektive.";
  if (family === "replacement_and_prevention")
    return "Replacement-/Prevention-Fenster erklären nur legale Optionen und Ergebnisse.";
  if (family === "damage_and_survival")
    return "Damage-Folgen bleiben side-sicher; verdeckte Karten bleiben redigiert.";
  if (family === "special_zones_and_control")
    return "Special-Zone- und Kontrollwechsel-Hinweise bleiben abstrakt und leak-frei.";
  if (actionType === "start_run")
    return "Run-Entscheidungen bleiben legal-action-basiert und side-sicher.";
  if (
    actionType === "access_card" ||
    actionType === "steal_agenda" ||
    actionType === "trash_accessed_card"
  )
    return "Access-Folgen nur aus sichtbaren Access-Fakten und LegalActions ableiten.";
  if (actionType === "resolve_choice")
    return "Choices im Replay zeigen nur erlaubte Optionen der jeweiligen Perspektive.";
  if (actionType === "mandatory_draw" || actionType === "draw_card")
    return "Kartenzug-Hinweise erklären Reihenfolge und Timing ohne Kartennamen-Leaks.";
  if (actionType === "score_agenda")
    return "Scoring-Fenster sind regelautoritativ aus der Engine; Replay erklärt nur den Ablauf.";
  return "Analysehinweise bleiben beschreibend und ersetzen keine Regelautorität.";
}

function isRdLabel(label: string | undefined): boolean {
  if (!label) return false;
  const normalized = label.toLowerCase();
  return normalized.includes("r&d") || normalized.includes("f&e");
}

function sideValue(value: unknown): Side | undefined {
  return value === "runner" || value === "corp" ? value : undefined;
}

function isReplayPerspective(value: unknown): value is ReplayPerspective {
  return value === "runner" || value === "corp" || value === "local_analysis";
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isHiddenInfoBarrier(event: GameEvent): boolean {
  return isHiddenInfoBarrierEvent(event);
}

function ensureMatchResultSnapshot(record: StoredMatch): boolean {
  if (record.resultSnapshot) return false;
  const snapshot = matchResultSnapshotFor(record);
  if (!snapshot) return false;
  record.resultSnapshot = snapshot;
  return true;
}

function matchResultSnapshotFor(
  record: StoredMatch,
): ApiMatchResultSnapshot | undefined {
  if (record.match.status !== "finished" && record.match.status !== "forfeited")
    return undefined;
  const state = record.gameState;
  const winner =
    record.lifecycleResult?.winnerSide ?? record.match.winner ?? state?.winner;
  if (!state || !winner) return undefined;
  const runnerAgendaPoints = getPlayerView(state, "runner").own.agendaPoints;
  const corpAgendaPoints = getPlayerView(state, "corp").own.agendaPoints;
  const actionEvents = record.eventLog.filter(
    (event) => event.publicPayload.type !== "game_created",
  );
  const countType = (type: string) =>
    actionEvents.filter((event) => event.publicPayload.type === type).length;
  const finalStateHash =
    record.lifecycleResult?.finalEngineStateHash ?? hashState(state);
  const runnerMatchPoints = singleGameMatchPointsFor(
    winner,
    "runner",
    runnerAgendaPoints,
  );
  const corpMatchPoints = singleGameMatchPointsFor(
    winner,
    "corp",
    corpAgendaPoints,
  );
  const lifecycleReason = record.lifecycleResult?.reason;
  const reason: ApiGameResultReason =
    lifecycleReason === "forfeit" || lifecycleReason === "time_expired"
      ? lifecycleReason
      : resultReason(
          state,
          winner,
          runnerAgendaPoints,
          corpAgendaPoints,
          record.match.settings.agendaPointsToWin,
        );
  return {
    schemaVersion: "netgrid-match-result-v1",
    matchId: record.match.matchId,
    matchStatus: record.match.status,
    matchMode: record.match.mode,
    matchFormat: record.match.settings.matchFormat,
    finishedAt: record.match.updatedAt,
    startedAt: record.match.createdAt,
    winner,
    ...(winner === "runner" || winner === "corp" ? { winnerSide: winner } : {}),
    reason,
    runner: {
      displayName: publicDisplayNameForSide(record, "runner"),
      identityKind: identityKindForSide(record, "runner"),
      agendaPoints: runnerAgendaPoints,
      matchPoints: runnerMatchPoints,
      ...(record.match.deckSetup.runner.deckName
        ? { deckName: record.match.deckSetup.runner.deckName }
        : {}),
    },
    corp: {
      displayName: publicDisplayNameForSide(record, "corp"),
      identityKind: identityKindForSide(record, "corp"),
      agendaPoints: corpAgendaPoints,
      matchPoints: corpMatchPoints,
      ...(record.match.deckSetup.corp.deckName
        ? { deckName: record.match.deckSetup.corp.deckName }
        : {}),
    },
    actionCount: actionEvents.length,
    runCount: countType("start_run"),
    agendaPointsToWin: record.match.settings.agendaPointsToWin,
    successfulRunCount: countType("access_card"),
    stolenAgendaCount: countType("steal_agenda"),
    scoredAgendaCount: countType("score_agenda"),
    finalStateHash,
    ...(record.match.series
      ? {
          series: {
            seriesId: record.match.series.seriesId,
            gameNumber: record.match.series.gameNumber,
            gamesPlanned: record.match.series.gamesPlanned,
            status: record.match.series.status,
          },
        }
      : {}),
  };
}

function resultSummaryFor(
  record: StoredMatch,
  viewerSide: Side,
  finalStateHash: string,
): GameResultSummary | undefined {
  ensureMatchResultSnapshot(record);
  const snapshot = record.resultSnapshot;
  if (!snapshot) return undefined;
  const winner = snapshot.winner;
  return {
    winner,
    ...(snapshot.winnerSide ? { winnerSide: snapshot.winnerSide } : {}),
    ...(record.lifecycleResult?.loserSide
      ? { loserSide: record.lifecycleResult.loserSide }
      : {}),
    viewerOutcome:
      winner === "draw" ? "draw" : winner === viewerSide ? "won" : "lost",
    reason: snapshot.reason,
    matchFormat: snapshot.matchFormat,
    agendaPointsToWin:
      snapshot.agendaPointsToWin ?? record.match.settings.agendaPointsToWin,
    runnerAgendaPoints: snapshot.runner.agendaPoints,
    corpAgendaPoints: snapshot.corp.agendaPoints,
    actionCount: snapshot.actionCount,
    runCount: snapshot.runCount,
    successfulRunCount: snapshot.successfulRunCount ?? 0,
    stolenAgendaCount: snapshot.stolenAgendaCount ?? 0,
    scoredAgendaCount: snapshot.scoredAgendaCount ?? 0,
    startedAt: snapshot.startedAt,
    finishedAt: snapshot.finishedAt,
    finalStateHash: snapshot.finalStateHash || finalStateHash,
    ...(record.lifecycleResult?.finalEngineStateHash
      ? { finalEngineStateHash: record.lifecycleResult.finalEngineStateHash }
      : {}),
    ...(record.match.series
      ? { series: seriesSummaryFor(record, viewerSide) }
      : {}),
  };
}

function recentGameResultEntriesFor(
  records: StoredMatch[],
  limit: number,
): RecentGameResultEntry[] {
  const normalizedLimit = Number.isFinite(limit) ? Math.floor(limit) : 20;
  const cappedLimit = Math.max(1, Math.min(50, normalizedLimit));
  const seriesGroups = new Map<string, StoredMatch[]>();
  const entries: RecentGameResultEntry[] = [];
  for (const record of records.filter((candidate) =>
    Boolean(candidate.resultSnapshot),
  )) {
    const seriesId = record.match.series?.seriesId;
    if (seriesId)
      seriesGroups.set(seriesId, [
        ...(seriesGroups.get(seriesId) ?? []),
        record,
      ]);
    else {
      const entry = recentGameResultEntryFor(record);
      if (entry) entries.push(entry);
    }
  }
  for (const group of seriesGroups.values()) {
    const entry = recentSeriesResultEntryFor(group);
    if (entry) entries.push(entry);
  }
  return entries
    .sort((left, right) => right.finishedAt.localeCompare(left.finishedAt))
    .slice(0, cappedLimit);
}

function recentGameResultEntryFor(
  record: StoredMatch,
): RecentGameResultEntry | undefined {
  const snapshot = record.resultSnapshot;
  if (!snapshot) return undefined;
  return {
    ...snapshot,
    entryType: "single_game",
    resultId: `match:${record.match.matchId}`,
    isPublic: record.match.isPublic,
  };
}

function recentSeriesResultEntryFor(
  records: StoredMatch[],
): ApiRecentSeriesResult | undefined {
  const latestRecord = records
    .slice()
    .sort((left, right) =>
      right.match.updatedAt.localeCompare(left.match.updatedAt),
    )[0];
  const latestSeries = latestRecord?.match.series;
  if (!latestRecord || !latestSeries) return undefined;
  const resultsByMatchId = new Map<string, SeriesGameResult>();
  for (const record of records) {
    for (const result of record.match.series?.results ?? [])
      resultsByMatchId.set(result.matchId, result);
  }
  const games = [...resultsByMatchId.values()].sort(
    (left, right) =>
      left.gameNumber - right.gameNumber ||
      left.finishedAt.localeCompare(right.finishedAt),
  );
  if (games.length === 0) return undefined;
  const playerStats: ApiRecentSeriesResult["players"] = {
    player_a: {
      displayName: publicDisplayNameForSeriesPlayer(latestRecord, "player_a"),
      identityKind: identityKindForSeriesPlayer(latestRecord, "player_a"),
      matchPoints: 0,
      agendaPoints: 0,
      wins: 0,
    },
    player_b: {
      displayName: publicDisplayNameForSeriesPlayer(latestRecord, "player_b"),
      identityKind: identityKindForSeriesPlayer(latestRecord, "player_b"),
      matchPoints: 0,
      agendaPoints: 0,
      wins: 0,
    },
  };
  const gameEntries: ApiRecentSeriesGameResult[] = games.map((result) => {
    const gameRecord = records.find(
      (record) => record.match.matchId === result.matchId,
    );
    const winnerPlayer = winningSeriesPlayer(result);
    if (winnerPlayer !== "draw") playerStats[winnerPlayer].wins += 1;
    playerStats[result.runnerPlayer].agendaPoints += result.runnerAgendaPoints;
    playerStats[result.corpPlayer].agendaPoints += result.corpAgendaPoints;
    const runnerMatchPoints = seriesMatchPointsFor(result, result.runnerPlayer);
    const corpMatchPoints = seriesMatchPointsFor(result, result.corpPlayer);
    playerStats[result.runnerPlayer].matchPoints += runnerMatchPoints;
    playerStats[result.corpPlayer].matchPoints += corpMatchPoints;
    return {
      matchId: result.matchId,
      isPublic: gameRecord?.match.isPublic === true,
      gameNumber: result.gameNumber,
      finishedAt: result.finishedAt,
      winner: result.winner,
      ...(winnerPlayer === "draw" ? {} : { winnerPlayer }),
      reason: result.reason ?? "unknown",
      runnerPlayer: result.runnerPlayer,
      corpPlayer: result.corpPlayer,
      runnerDisplayName: playerStats[result.runnerPlayer].displayName,
      corpDisplayName: playerStats[result.corpPlayer].displayName,
      runnerAgendaPoints: result.runnerAgendaPoints,
      corpAgendaPoints: result.corpAgendaPoints,
      runnerMatchPoints,
      corpMatchPoints,
      finalStateHash: result.finalStateHash,
    };
  });
  const outcome =
    playerStats.player_a.matchPoints > playerStats.player_b.matchPoints
      ? "player_a"
      : playerStats.player_b.matchPoints > playerStats.player_a.matchPoints
        ? "player_b"
        : "draw";
  const finishedAt = gameEntries.reduce(
    (latest, game) => (game.finishedAt > latest ? game.finishedAt : latest),
    latestRecord.match.updatedAt,
  );
  const startedAt = records.reduce(
    (earliest, record) =>
      record.match.createdAt < earliest ? record.match.createdAt : earliest,
    latestRecord.match.createdAt,
  );
  return {
    entryType: "series",
    resultId: `series:${latestSeries.seriesId}`,
    seriesId: latestSeries.seriesId,
    isPublic: records.every((record) => record.match.isPublic),
    mode: latestSeries.mode,
    status: latestSeries.status,
    matchMode: latestRecord.match.mode,
    matchFormat: "two_game_side_swap",
    startedAt,
    finishedAt,
    gamesPlayed: gameEntries.length,
    gamesPlanned: latestSeries.gamesPlanned,
    ...(outcome === "draw" ? {} : { winnerPlayer: outcome }),
    outcome,
    decision: outcome === "draw" ? "draw" : "match_points",
    players: playerStats,
    games: gameEntries,
  };
}

function singleGameMatchPointsFor(
  winner: Winner,
  side: Side,
  agendaPoints: number,
): number {
  if (winner === "draw") return agendaPoints;
  return winner === side ? SERIES_WIN_MATCH_POINTS : agendaPoints;
}

function publicDisplayNameForSeriesPlayer(
  record: StoredMatch,
  player: SeriesPlayerSlot,
): string {
  if (record.match.mode === "ai_vs_ai")
    return player === "player_a" ? "KI A" : "KI B";
  const series = record.match.series;
  if (!series) return player === "player_a" ? "Spieler A" : "Spieler B";
  if (series.runnerPlayer === player)
    return publicDisplayNameForSide(record, "runner");
  if (series.corpPlayer === player)
    return publicDisplayNameForSide(record, "corp");
  return player === "player_a" ? "Spieler A" : "Spieler B";
}

function identityKindForSeriesPlayer(
  record: StoredMatch,
  player: SeriesPlayerSlot,
): ApiPlayerIdentityKind {
  if (record.match.mode === "ai_vs_ai") return "ai";
  const series = record.match.series;
  if (series?.runnerPlayer === player)
    return identityKindForSide(record, "runner");
  if (series?.corpPlayer === player) return identityKindForSide(record, "corp");
  return record.match.participantIdentities?.[player] ?? "guest";
}

function identityKindForSide(
  record: StoredMatch,
  side: Side,
): ApiPlayerIdentityKind {
  if (record.match.aiControllers?.[side]?.type === "ai") return "ai";
  const assignment =
    record.match.deckSetup.assignment ?? record.startLobby?.sideAssignment;
  const player = record.match.series
    ? seriesPlayerForSide(record.match.series, side)
    : assignment
      ? side === "runner"
        ? assignment.runnerPlayer
        : assignment.corpPlayer
      : record.sessions[0]?.side === side
        ? "player_a"
        : "player_b";
  return record.match.participantIdentities?.[player] ?? "guest";
}

function publicDisplayNameForSide(record: StoredMatch, side: Side): string {
  if (record.match.aiControllers?.[side]?.type === "ai")
    return side === "runner" ? "Runner-KI" : "Korp-KI";
  const sessionName = record.sessions
    .find((session) => session.side === side)
    ?.displayName?.trim();
  if (sessionName) return sessionName;
  return side === "runner" ? "Runner" : "Korp";
}

function seriesSummaryFor(
  record: StoredMatch,
  viewerSide: Side,
): SeriesResultSummary {
  const series = record.match.series;
  if (!series) throw new Error("series_missing");
  const viewerPlayer =
    record.match.mode === "ai_vs_ai"
      ? "player_a"
      : seriesPlayerForSide(series, viewerSide);
  const wins = { player_a: 0, player_b: 0 };
  const agendaPoints = { player_a: 0, player_b: 0 };
  const matchPoints = { player_a: 0, player_b: 0 };
  let draws = 0;
  for (const result of series.results) {
    const winningPlayer = winningSeriesPlayer(result);
    if (winningPlayer === "draw") draws += 1;
    else wins[winningPlayer] += 1;
    agendaPoints[result.runnerPlayer] += result.runnerAgendaPoints;
    agendaPoints[result.corpPlayer] += result.corpAgendaPoints;
    matchPoints.player_a += seriesMatchPointsFor(result, "player_a");
    matchPoints.player_b += seriesMatchPointsFor(result, "player_b");
  }
  const opponentPlayer = oppositeSeriesPlayer(viewerPlayer);
  const seriesDecision = seriesDecisionFor(
    matchPoints[viewerPlayer],
    matchPoints[opponentPlayer],
  );
  return {
    seriesId: series.seriesId,
    mode: series.mode,
    status: series.status,
    gameNumber: series.gameNumber,
    gamesPlanned: series.gamesPlanned,
    viewerPlayer,
    viewerWins: wins[viewerPlayer],
    opponentWins: wins[opponentPlayer],
    draws,
    viewerMatchPoints: matchPoints[viewerPlayer],
    opponentMatchPoints: matchPoints[opponentPlayer],
    viewerAgendaPoints: agendaPoints[viewerPlayer],
    opponentAgendaPoints: agendaPoints[opponentPlayer],
    viewerSeriesOutcome: seriesDecision.outcome,
    seriesDecision: seriesDecision.decision,
    nextAvailable: series.status === "between_games" && !series.nextMatchId,
    ...(series.nextMatchId ? { nextMatchId: series.nextMatchId } : {}),
  };
}

function seriesDecisionFor(
  viewerMatchPoints: number,
  opponentMatchPoints: number,
): { outcome: "won" | "lost" | "draw"; decision: "match_points" | "draw" } {
  if (viewerMatchPoints > opponentMatchPoints)
    return { outcome: "won", decision: "match_points" };
  if (viewerMatchPoints < opponentMatchPoints)
    return { outcome: "lost", decision: "match_points" };
  return { outcome: "draw", decision: "draw" };
}

function seriesMatchPointsFor(
  result: SeriesGameResult,
  player: SeriesPlayerSlot,
): number {
  const side = player === result.runnerPlayer ? "runner" : "corp";
  const agendaPoints =
    side === "runner" ? result.runnerAgendaPoints : result.corpAgendaPoints;
  if (result.winner === "draw") return agendaPoints;
  return winningSeriesPlayer(result) === player
    ? SERIES_WIN_MATCH_POINTS
    : agendaPoints;
}

function winningSeriesPlayer(
  result: SeriesGameResult,
): SeriesPlayerSlot | "draw" {
  if (result.winner === "draw") return "draw";
  return result.winner === "runner" ? result.runnerPlayer : result.corpPlayer;
}

function seriesPlayerForSide(
  series: MatchSeriesState,
  side: Side,
): SeriesPlayerSlot {
  return side === "runner" ? series.runnerPlayer : series.corpPlayer;
}

function oppositeSeriesPlayer(player: SeriesPlayerSlot): SeriesPlayerSlot {
  return player === "player_a" ? "player_b" : "player_a";
}

function publicParticipantDeckSetup(
  participants: ResolvedParticipantDeckSetup,
): NonNullable<MatchRecord["deckSetup"]["participants"]> {
  return {
    player_a: publicParticipantDeckPair(participants.player_a),
    player_b: publicParticipantDeckPair(participants.player_b),
  };
}

function publicParticipantDeckPair(
  pair: ResolvedParticipantDeckPair,
): NonNullable<MatchRecord["deckSetup"]["participants"]>[SeriesPlayerSlot] {
  return {
    runnerSnapshotId: pair.runnerSnapshot.deckSnapshotId,
    corpSnapshotId: pair.corpSnapshot.deckSnapshotId,
    runner: pair.runnerSnapshot.publicMetadata,
    corp: pair.corpSnapshot.publicMetadata,
  };
}

function privateParticipantDeckSetup(
  participants: ResolvedParticipantDeckSetup,
): NonNullable<
  NonNullable<StoredMatch["privateDeckSnapshots"]>["participants"]
> {
  return {
    player_a: {
      runner: clone(participants.player_a.runnerSnapshot),
      corp: clone(participants.player_a.corpSnapshot),
    },
    player_b: {
      runner: clone(participants.player_b.runnerSnapshot),
      corp: clone(participants.player_b.corpSnapshot),
    },
  };
}

function buildDeckFromSnapshot(
  snapshot: DeckSnapshot,
): ReturnType<typeof buildEngineDeck> {
  return buildEngineDeck(snapshot);
}

function deckErrorMessage(error: unknown): string {
  if (isAiDeckSnapshotRuntimeError(error))
    return aiDeckSnapshotErrorMessage(error.code);
  const code = error instanceof Error ? error.message : String(error);
  if (code === "deck_snapshot_wrong_side")
    return "Das gewählte Deck hat die falsche Seite.";
  if (
    code === "deck_snapshot_not_validated" ||
    code === "deck_snapshot_invalid"
  )
    return "Das gewählte Deck ist nicht matchstartfähig. Bitte prüfe die Validierungsfehler.";
  if (code === "deck_snapshot_card_pool_mismatch")
    return "Das gewählte Deck passt nicht zum Kartenpool dieses Spiels.";
  if (code === "ai_deck_snapshot_not_supported")
    return "Das gewählte KI-Deck ist nicht KI-freigegeben. Bitte nutze feste Standard-Decks, deterministisch zufällige KI-Decks oder ein KI-sicheres Snapshot-Deck.";
  if (code === "deck_snapshot_needs_revalidation")
    return "Das gewählte Deck muss nach der aktuellen Formatversion neu validiert werden.";
  if (code === "deck_snapshot_not_found")
    return "Das gewählte Deck wurde nicht gefunden.";
  return "Die gewählten Decks sind nicht matchstartfähig.";
}

function participantDeckInputsForRecord(
  record: StoredMatch,
): Record<SeriesPlayerSlot, ParticipantDeckPairInput> {
  const participants = record.privateDeckSnapshots?.participants;
  if (!participants) throw new Error("participant_deck_snapshots_missing");
  return {
    player_a: {
      runnerDeckSnapshot: clone(participants.player_a.runner),
      corpDeckSnapshot: clone(participants.player_a.corp),
    },
    player_b: {
      runnerDeckSnapshot: clone(participants.player_b.runner),
      corpDeckSnapshot: clone(participants.player_b.corp),
    },
  };
}

function resultReason(
  state: GameState,
  winner: Side | "draw",
  runnerAgendaPoints: number,
  corpAgendaPoints: number,
  agendaPointsToWin: number,
): GameResultReason {
  if (winner === "draw") return "draw";
  if (state.gameEndReason === "bad_publicity_7") return "bad_publicity_7";
  if (state.gameEndReason === "agenda_points") return "agenda_points";
  if (state.gameEndReason === "corp_deck_empty") return "corp_deck_empty";
  if (state.gameEndReason === "flatline") return "flatline";
  if (
    runnerAgendaPoints >= agendaPointsToWin ||
    corpAgendaPoints >= agendaPointsToWin
  )
    return "agenda_points";
  return "unknown";
}

function safeError(
  code: string,
  message: string,
  state?: GameState,
  side?: Side,
): SafeErrorPayload {
  return {
    code,
    message,
    ...(state ? { currentStateVersion: state.stateVersion } : {}),
    ...(state && side ? { playerView: getPlayerView(state, side) } : {}),
  };
}

function assertValidAiDeckSnapshotsForControllers(
  deckSetup: ResolvedDeckSetup,
  controllers: { runner: PlayerController; corp: PlayerController },
): void {
  if (controllers.runner.type === "ai") {
    assertValidAiDeckSnapshotForRuntime(deckSetup.runnerSnapshot, {
      side: "runner",
      ...aiDeckSnapshotExpectationFromSnapshot(deckSetup.runnerSnapshot),
    });
  }
  if (controllers.corp.type === "ai") {
    assertValidAiDeckSnapshotForRuntime(deckSetup.corpSnapshot, {
      side: "corp",
      ...aiDeckSnapshotExpectationFromSnapshot(deckSetup.corpSnapshot),
    });
  }
}

function assertRecordAiDeckSnapshotForRuntime(
  record: StoredMatch,
  side: Side,
): DeckSnapshot {
  const assignment = record.match.deckSetup.assignment;
  if (!assignment) throw new Error("deck_assignment_missing");
  const player =
    side === "runner" ? assignment.runnerPlayer : assignment.corpPlayer;
  return assertValidAiDeckSnapshotForRuntime(
    record.privateDeckSnapshots?.participants[player][side],
    {
      side,
      ...aiDeckSnapshotExpectationFor(record, side),
    },
  ) as DeckSnapshot;
}

function aiDeckSnapshotExpectationFor(
  record: StoredMatch,
  side: Side,
): Omit<AiDeckSnapshotRuntimeExpectation, "side"> {
  const metadata =
    side === "runner"
      ? record.match.deckSetup.runner
      : record.match.deckSetup.corp;
  return aiDeckSnapshotExpectationFromMetadata(
    side === "runner"
      ? record.match.deckSetup.runnerSnapshotId
      : record.match.deckSetup.corpSnapshotId,
    metadata,
  );
}

function aiDeckSnapshotExpectationFromSnapshot(
  snapshot: DeckSnapshot,
): Omit<AiDeckSnapshotRuntimeExpectation, "side"> {
  return {
    deckSnapshotId: snapshot.deckSnapshotId,
    cardPoolSnapshotId: snapshot.cardPoolSnapshotId,
    formatProfileId: snapshot.formatProfileId,
    deckHash: snapshot.deckHash,
  };
}

function aiDeckSnapshotExpectationFromMetadata(
  deckSnapshotId: string,
  metadata: DeckPublicMetadata,
): Omit<AiDeckSnapshotRuntimeExpectation, "side"> {
  return {
    deckSnapshotId,
    cardPoolSnapshotId: metadata.cardPoolSnapshotId,
    formatProfileId: metadata.formatProfileId,
    deckHash: metadata.deckHash,
  };
}

function isAiDeckSnapshotErrorCode(
  code: AiStepFailureCode,
): code is AiDeckSnapshotRuntimeErrorCode {
  switch (code) {
    case "ai_deck_snapshot_missing":
    case "ai_deck_snapshot_empty":
    case "ai_deck_snapshot_side_mismatch":
    case "ai_deck_snapshot_unknown_card":
    case "ai_deck_snapshot_invalid":
    case "ai_deck_snapshot_stale":
      return true;
    default:
      return false;
  }
}

function aiDeckSnapshotErrorMessage(
  code: AiDeckSnapshotRuntimeErrorCode,
): string {
  switch (code) {
    case "ai_deck_snapshot_missing":
      return "Der KI-Deck-Snapshot fehlt. Die KI-Entscheidung wurde abgebrochen.";
    case "ai_deck_snapshot_empty":
      return "Der KI-Deck-Snapshot enthält keine Karten. Die KI-Entscheidung wurde abgebrochen.";
    case "ai_deck_snapshot_side_mismatch":
      return "Der KI-Deck-Snapshot passt nicht zur KI-Seite. Die KI-Entscheidung wurde abgebrochen.";
    case "ai_deck_snapshot_unknown_card":
      return "Der KI-Deck-Snapshot enthält eine Karte außerhalb des Runtime-Card-Pools. Die KI-Entscheidung wurde abgebrochen.";
    case "ai_deck_snapshot_stale":
      return "Der KI-Deck-Snapshot passt nicht zum gestarteten Deck. Die KI-Entscheidung wurde abgebrochen.";
    case "ai_deck_snapshot_invalid":
      return "Der KI-Deck-Snapshot ist ungültig. Die KI-Entscheidung wurde abgebrochen.";
  }
}

function opposite(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function nextModeForSideSwap(mode: MatchMode): MatchMode {
  if (mode === "human_runner_vs_corp_ai") return "human_corp_vs_runner_ai";
  if (mode === "human_corp_vs_runner_ai") return "human_runner_vs_corp_ai";
  if (mode === "ai_vs_ai") return "ai_vs_ai";
  return "human_vs_human";
}

function aiPlayerForMode(mode: MatchMode): SeriesPlayerSlot | undefined {
  if (mode === "human_vs_human") return undefined;
  return mode === "ai_vs_ai" ? "player_a" : "player_b";
}

function deterministicHostSide(seed: string): Side {
  const value = createHash("sha256").update(seed).digest()[0] ?? 0;
  return value % 2 === 0 ? "runner" : "corp";
}

function baselineForMode(
  _mode: MatchMode,
  _deckSetup: ResolvedDeckSetup,
): RulesBaseline {
  return CURRENT_RULES_BASELINE;
}

function controllersForMode(
  mode: MatchMode,
  hostSide: Side,
  difficulties: {
    runnerDifficulty: AiDifficulty;
    corpDifficulty: AiDifficulty;
  },
): { runner: PlayerController; corp: PlayerController } {
  if (mode === "ai_vs_ai") {
    return {
      runner: {
        controllerId: "runner-ai",
        side: "runner",
        type: "ai",
        displayName: "Runner KI",
        difficulty: difficulties.runnerDifficulty,
        profileId: `runner-ai-v0.9-${difficulties.runnerDifficulty}`,
      },
      corp: {
        controllerId: "corp-ai",
        side: "corp",
        type: "ai",
        displayName: "Korp KI",
        difficulty: difficulties.corpDifficulty,
        profileId: `corp-ai-v0.9-${difficulties.corpDifficulty}`,
      },
    };
  }
  if (mode === "human_runner_vs_corp_ai") {
    return {
      runner: {
        controllerId: "runner-human",
        side: "runner",
        type: "human_remote",
        displayName: "Runner",
      },
      corp: {
        controllerId: "corp-ai",
        side: "corp",
        type: "ai",
        displayName: "Korp KI",
        difficulty: difficulties.corpDifficulty,
        profileId: `corp-ai-v0.9-${difficulties.corpDifficulty}`,
      },
    };
  }
  if (mode === "human_corp_vs_runner_ai") {
    return {
      runner: {
        controllerId: "runner-ai",
        side: "runner",
        type: "ai",
        displayName: "Runner KI",
        difficulty: difficulties.runnerDifficulty,
        profileId: `runner-ai-v0.9-${difficulties.runnerDifficulty}`,
      },
      corp: {
        controllerId: "corp-human",
        side: "corp",
        type: "human_remote",
        displayName: "Korp",
      },
    };
  }
  return {
    runner: {
      controllerId: hostSide === "runner" ? "runner-host" : "runner-guest",
      side: "runner",
      type: "human_remote",
      displayName: "Runner",
    },
    corp: {
      controllerId: hostSide === "corp" ? "corp-host" : "corp-guest",
      side: "corp",
      type: "human_remote",
      displayName: "Korp",
    },
  };
}

function aiControllersFor(controllers: {
  runner: PlayerController;
  corp: PlayerController;
}): Partial<Record<Side, PlayerController>> {
  const result: Partial<Record<Side, PlayerController>> = {};
  if (controllers.runner.type === "ai") result.runner = controllers.runner;
  if (controllers.corp.type === "ai") result.corp = controllers.corp;
  return result;
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

function clone<T>(value: T): T {
  return structuredClone(value) as T;
}

function renderGamebook(record: StoredMatch): string {
  const lines = ["# Spielprotokoll", ""];
  const result = record.resultSnapshot ?? matchResultSnapshotFor(record);
  lines.push(
    "## Beteiligte",
    "",
    `**Runner:** ${publicDisplayNameForSide(record, "runner")}`,
    `**Korp:** ${publicDisplayNameForSide(record, "corp")}`,
    "",
  );
  const initial = record.stateSnapshots.find(
    (snapshot) => snapshot.snapshotId === "snap_initial",
  )?.gameState;
  if (initial) {
    lines.push("## Spielvorbereitung", "");
    lines.push(
      `**Korp – Starthand:** ${cardNames(initial, initial.corp.hq).join(", ")}`,
      "",
    );
    lines.push(
      `**Runner – erste Starthand:** ${cardNames(initial, initial.runner.grip).join(", ")}`,
      "",
    );
  }
  const turns: Record<Side, number> = { corp: 0, runner: 0 };
  let activeSide: Side | undefined;
  for (const event of record.gameState.eventLog) {
    const payload = event.publicPayload;
    const side = sideValue(payload.actor);
    if (!side) continue;
    const before = gamebookStateBefore(record, event);
    const after = gamebookStateAfter(record, event);
    if (
      event.type === "resolve_choice" &&
      gamebookRecordValue(payload, "setupStep")
    ) {
      const decision = stringValue(payload.setupDecision);
      if (decision === "mulligan" && after) {
        lines.push(
          `Der ${sideLabel(side)} nimmt einen Mulligan.`,
          "",
          `**${sideLabel(side)} – neue Starthand:** ${cardNames(after, handFor(after, side)).join(", ")}`,
          "",
        );
      } else if (decision === "keep") {
        lines.push(`Der ${sideLabel(side)} behält die Starthand.`, "");
      }
      continue;
    }
    const actionStart = gamebookNumberValue(payload.turnActionOrdinalStart);
    const actionEnd = gamebookNumberValue(payload.turnActionOrdinalEnd);
    const startsTurn =
      activeSide === undefined ||
      (side !== activeSide &&
        (event.type === "mandatory_draw" || actionStart === 1));
    if (startsTurn) {
      activeSide = side;
      turns[side] += 1;
      if (before) {
        lines.push(
          `## ${sideLabel(side)} – Zug ${turns[side]}`,
          "",
          `**Hand zu Zugbeginn:** ${cardNames(before, handFor(before, side)).join(", ")}`,
          gamebookCredits(before),
          "",
        );
      }
    }
    if (actionStart !== undefined) {
      const actionLabel =
        actionEnd !== undefined && actionEnd > actionStart
          ? `Aktion ${actionStart} und ${actionEnd}`
          : `Aktion ${actionStart}`;
      lines.push(
        `### ${actionLabel} – ${gamebookActionTitle(event, before)}`,
        "",
      );
    }
    const description = gamebookEventDescription(
      event,
      before,
      after,
      activeSide,
    );
    if (description) lines.push(description, "");
  }
  if (result) {
    lines.push(
      "## Endergebnis",
      "",
      `**Gewinner:** ${gamebookWinnerLabel(result.winner, result)}`,
      `**Endstand:** Runner ${result.runner.agendaPoints} Agendapunkte · Korp ${result.corp.agendaPoints} Agendapunkte`,
      `**Beendet durch:** ${gamebookResultReasonLabel(result.reason)}`,
      gamebookCredits(record.gameState),
      "",
    );
  }
  return `${lines.join("\n")}\n`;
}

function cardNames(state: GameState, ids: readonly string[]): string[] {
  return ids.map((id) => {
    const definitionId = state.cardInstances[id]?.definitionId;
    return definitionId
      ? (CARD_DEFINITIONS_BY_ID[definitionId]?.title ?? definitionId)
      : id;
  });
}

function gamebookStateBefore(
  record: StoredMatch,
  event: GameEvent,
): GameState | undefined {
  return (
    record.stateSnapshots.find(
      (snapshot) =>
        snapshot.snapshotId === `snap_before_${event.stateVersionAfter}`,
    )?.gameState ??
    record.stateSnapshots.find(
      (snapshot) => snapshot.stateVersion === event.stateVersionBefore,
    )?.gameState
  );
}

function gamebookStateAfter(
  record: StoredMatch,
  event: GameEvent,
): GameState | undefined {
  return (
    record.stateSnapshots.find(
      (snapshot) =>
        snapshot.snapshotId === `snap_before_${event.stateVersionAfter + 1}`,
    )?.gameState ??
    (record.gameState.stateVersion === event.stateVersionAfter
      ? record.gameState
      : undefined)
  );
}

function sideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}

function handFor(state: GameState, side: Side): string[] {
  return side === "corp" ? state.corp.hq : state.runner.grip;
}

function creditsFor(state: GameState, side: Side): number {
  return side === "corp" ? state.corp.credits : state.runner.credits;
}

function gamebookCredits(state: GameState): string {
  return `**Credits:** Runner ${state.runner.credits} · Korp ${state.corp.credits}`;
}

function gamebookWinnerLabel(
  winner: Side | "draw",
  result: ApiMatchResultSnapshot,
): string {
  if (winner === "draw") return "Unentschieden";
  const player = winner === "runner" ? result.runner : result.corp;
  return `${player.displayName} als ${sideLabel(winner)}`;
}

function gamebookResultReasonLabel(reason: ApiGameResultReason): string {
  if (reason === "agenda_points") return "Agenda-Ziel";
  if (reason === "bad_publicity_7") return "7 Bad Publicity";
  if (reason === "corp_deck_empty") return "Korp-Deck leer";
  if (reason === "flatline") return "Flatline";
  if (reason === "forfeit") return "Aufgabe";
  if (reason === "time_expired") return "abgelaufene Spielerzeit";
  return "Unentschieden";
}

function gamebookActionTitle(event: GameEvent, before?: GameState): string {
  const title = cardTitleForEvent(event, before);
  if (event.type === "start_run")
    return `Run auf ${stringValue(event.publicPayload.serverLabel) ?? "einen Server"}`;
  if (title) {
    if (event.type === "install_card") return `${title} installieren`;
    if (event.type === "play_event" || event.type === "play_operation")
      return `${title} spielen`;
    if (event.type === "rez_card" || event.type === "rez_ice")
      return `${title} rezz(en)`;
    return title;
  }
  return stringValue(event.publicPayload.label) ?? event.type;
}

function gamebookEventDescription(
  event: GameEvent,
  before?: GameState,
  after?: GameState,
  turnSide?: Side,
): string | undefined {
  const side = sideValue(event.publicPayload.actor);
  if (!side) return undefined;
  const actor = side === turnSide ? "" : `${sideLabel(side)} `;
  const title = cardTitleForEvent(event, before);
  const creditStatus = after ? ` ${gamebookCredits(after)}` : "";
  if (event.type === "mandatory_draw" || event.type === "draw_card") {
    const drawn = before && after ? addedCards(before, after, side) : [];
    return drawn.length > 0
      ? `${actor}zieht ${drawn.join(", ")}.${creditStatus}`
      : `${actor}zieht eine Karte.${creditStatus}`;
  }
  if (event.type === "install_card") {
    const server =
      stringValue(event.publicPayload.serverLabel) ?? serverForEvent(event);
    const placement = stringValue(event.publicPayload.installPlacement);
    const position =
      title && after
        ? installedPosition(after, title, server, placement)
        : undefined;
    return `${actor}installiert ${title ?? "eine Karte"}${server ? ` in ${server}` : ""}${position ? `, ${position}` : ""}.${creditStatus}`;
  }
  if (event.type === "play_event" || event.type === "play_operation") {
    const effects = resolvedEffectText(event.publicPayload);
    return `${actor}spielt ${title ?? "eine Karte"}.${effects ? ` ${effects}` : ""}${creditStatus}`;
  }
  if (event.type === "start_run")
    return `${actor}startet einen Run auf ${stringValue(event.publicPayload.serverLabel) ?? "einen Server"}.${creditStatus}`;
  if (event.type === "access_card")
    return `${actor}greift auf ${title ?? "eine Karte"} zu.${creditStatus}`;
  if (event.type === "end_turn")
    return `${actor}beendet den Zug.${creditStatus}`;
  if (event.type === "advance_card") {
    const advanced = before && after ? advancedCard(before, after) : undefined;
    return `${actor}platziert ${advanced?.count ?? 1} Fortschrittsmarker auf ${advanced?.title ?? title ?? "eine Karte"}.${creditStatus}`;
  }
  if (event.type === "score_agenda")
    return `${actor}erzielt ${title ?? "eine Agenda"}.${creditStatus}`;
  const label = stringValue(event.publicPayload.label);
  return label ? `${actor}${label}.${creditStatus}` : undefined;
}

function cardTitleForEvent(
  event: GameEvent,
  before?: GameState,
): string | undefined {
  const direct = stringValue(event.publicPayload.title);
  if (direct) return direct;
  const definitionId = stringValue(event.publicPayload.cardDefinitionId);
  if (definitionId) return CARD_DEFINITIONS_BY_ID[definitionId]?.title;
  const side = sideValue(event.publicPayload.actor);
  const privatePayload = side ? event.privatePayload?.[side] : undefined;
  const source =
    privatePayload && gamebookRecordValue(privatePayload, "legalAction")
      ? stringValue(
          (privatePayload.legalAction as Record<string, unknown>).source,
        )
      : undefined;
  const sourceDefinitionId =
    source && before?.cardInstances[source]?.definitionId;
  return sourceDefinitionId
    ? CARD_DEFINITIONS_BY_ID[sourceDefinitionId]?.title
    : undefined;
}

function serverForEvent(event: GameEvent): string | undefined {
  const side = sideValue(event.publicPayload.actor);
  const privatePayload = side ? event.privatePayload?.[side] : undefined;
  const payload =
    privatePayload && gamebookRecordValue(privatePayload, "legalAction")
      ? (privatePayload.legalAction as Record<string, unknown>).payload
      : undefined;
  const serverId =
    payload && gamebookRecordValue(payload, "serverId")
      ? stringValue((payload as Record<string, unknown>).serverId)
      : undefined;
  if (!serverId) return undefined;
  if (serverId === "new_remote") return "einem neuen Remote";
  if (serverId === "rd") return "R&D";
  if (serverId === "hq") return "HQ";
  if (serverId === "archives") return "Archives";
  return serverId.replace("_", " ").replace(/^remote /, "Remote ");
}

function installedPosition(
  state: GameState,
  title: string,
  server?: string,
  placement?: string,
): string | undefined {
  const candidate = Object.entries(state.cardInstances).find(
    ([, card]) =>
      CARD_DEFINITIONS_BY_ID[card.definitionId]?.title === title &&
      (card.zone.zone === "serverIce" || card.zone.zone === "serverRoot"),
  );
  if (!candidate) return undefined;
  const zone = candidate[1].zone;
  if (zone.zone !== "serverIce" && zone.zone !== "serverRoot") return undefined;
  const serverState = state.corp.servers.find(
    (item) => item.id === zone.serverId,
  );
  if (!serverState) return undefined;
  if (placement === "ice")
    return `Position ${serverState.ice.indexOf(candidate[0]) + 1} vor dem Server`;
  return "im Remote-Bereich";
}

function advancedCard(
  before: GameState,
  after: GameState,
): { title: string; count: number } | undefined {
  for (const [instanceId, afterCard] of Object.entries(after.cardInstances)) {
    const beforeCard = before.cardInstances[instanceId];
    if (
      !beforeCard ||
      afterCard.advancementCounters <= beforeCard.advancementCounters
    )
      continue;
    return {
      title:
        CARD_DEFINITIONS_BY_ID[afterCard.definitionId]?.title ?? "eine Karte",
      count: afterCard.advancementCounters - beforeCard.advancementCounters,
    };
  }
  return undefined;
}

function addedCards(before: GameState, after: GameState, side: Side): string[] {
  const beforeHand = new Set(handFor(before, side));
  return cardNames(
    after,
    handFor(after, side).filter((id) => !beforeHand.has(id)),
  );
}

function resolvedEffectText(
  payload: Record<string, unknown>,
): string | undefined {
  const gained = gamebookNumberValue(payload.gainedCredits);
  return gained !== undefined
    ? `Effekt: ${sideLabel(sideValue(payload.actor) ?? "corp")} erhält ${gained} Credits.`
    : undefined;
}

function gamebookRecordValue(
  value: unknown,
  key: string,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    key in value
  );
}

function gamebookNumberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function cloneGameStateWithoutEventLog(gameState: GameState): GameState {
  return {
    ...clone({ ...gameState, eventLog: [] }),
    eventLog: [],
  };
}

function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, "");
}
