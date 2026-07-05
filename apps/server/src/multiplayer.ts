import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { buildAiDecisionInput, chooseAiAction, selectAiDecisionSideForState } from "@netgrid/ai";
import { buildEngineDeck, type DeckSnapshot } from "@netgrid/decks";
import { applyAction, createGame, getLegalActions, getPlayerView, hashState, isHiddenInfoBarrierEvent, replayEvents } from "@netgrid/engine";
import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  CURRENT_RULES_BASELINE,
  DEMO_CARDS_BY_ID,
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
  type AiDecision,
  type AiDifficulty,
  type AiDecisionDebug,
  type AiDecisionInput,
  type DeckPublicMetadata,
  type GameEvent,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type PlayerController,
  type PlayerView,
  type PublicGameEvent,
  type RulesBaseline,
  type Side,
  type VisibleCard,
  type Winner
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
  type ResolvedParticipantDeckSetup
} from "./deck-setup";
import {
  projectEngineEventToServerRecord,
  projectReplayEventsForPerspective,
  type ReplayPerspective,
  type ServerEventRecord
} from "./event-projection";
import { envValue, LOCAL_DEFAULT_SERVER_BASE_URL, LOCAL_DEFAULT_TOKEN_SALT, LOCAL_DEFAULT_WEB_BASE_URL } from "./internet-hardening";
import { buildSidePayload } from "./multiplayer-payload";
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
  StorageMaintenanceSnapshotCompactionResult,
  StorageMaintenanceSummary
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

export type MatchSettings = {
  agendaPointsToWin: number;
  matchFormat: MatchFormat;
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
  discoverableInLan?: boolean;
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

export type PlayerClockState = PlayerClockBaseState & ({
  mode: "none";
} | {
  mode: "player_clock";
  startingTimeMs: number;
  gracePeriodMs: number;
  remainingMs: { runner: number; corp: number };
  expiredSide?: Side;
});

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

export type StoredMatch = {
  match: MatchRecord;
  sessions: SessionRecord[];
  tokens: TokenRecord[];
  gameState: GameState;
  lifecycleResult?: LifecycleResultSummary;
  startLobby?: MatchStartLobbyState;
  privateDeckSnapshots?: {
    runner: DeckSnapshot;
    corp: DeckSnapshot;
    participants?: Record<SeriesPlayerSlot, { runner: DeckSnapshot; corp: DeckSnapshot }>;
  };
  eventLog: EventRecord[];
  actionReceipts: ActionReceipt[];
  undoSnapshots: UndoSnapshot[];
  stateSnapshots: StateSnapshot[];
  aiDecisionTraces?: AiDecisionTraceRecord[];
  pendingUndo?: PendingUndoRequest;
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
  load(matchId: string, options?: { includeStateSnapshots?: boolean }): Promise<StoredMatch | undefined>;
  save(record: StoredMatch): Promise<void>;
  list?(): Promise<StoredMatch[]>;
  listOpenMatchCandidates?(): Promise<StoredMatch[]>;
  health?(): Promise<StorageHealth>;
  backup?(reason?: BackupManifest["reason"]): Promise<{ backupDir: string; manifest: BackupManifest }>;
  maintenanceSummary?(): Promise<StorageMaintenanceSummary>;
  maintenanceMatches?(filters?: StorageMaintenanceMatchFilters): Promise<StorageMaintenanceMatchEntry[]>;
  maintenanceMatchDetail?(matchId: string): Promise<StorageMaintenanceMatchDetail | undefined>;
  maintenanceAiDecisionTraceMatches?(): Promise<StorageMaintenanceAiDecisionTraceMatchEntry[]>;
  maintenanceAiDecisionTraceIndex?(matchId: string, filters?: { afterDecisionIndex?: number }): Promise<StorageMaintenanceAiDecisionTraceIndexEntry[]>;
  maintenanceAiDecisionTraceDetail?(traceId: string): Promise<StorageMaintenanceAiDecisionTraceDetail | undefined>;
  maintenanceCleanupPreview?(filters: StorageMaintenanceCleanupFilters): Promise<StorageMaintenanceCleanupPreview>;
  maintenanceCleanupApply?(input: StorageMaintenanceCleanupApplyInput): Promise<StorageMaintenanceCleanupApplyResult>;
  maintenanceCleanupPolicy?(): Promise<StorageMaintenanceCleanupPolicy>;
  setMaintenanceCleanupPolicy?(policy: StorageMaintenanceCleanupPolicyInput): Promise<StorageMaintenanceCleanupPolicy>;
  runMaintenanceCleanupPolicy?(): Promise<StorageMaintenanceCleanupPolicyRunResult>;
  maintenanceCompactSnapshots?(): Promise<StorageMaintenanceSnapshotCompactionResult>;
  maintenanceSetRetentionProtection?(matchId: string, protectedValue: boolean): Promise<StorageMaintenanceMatchDetail | undefined>;
  close?(): void;
};

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
};

export type OpenMatchListEntry = {
  matchId: string;
  hostDisplayName: string;
  mode: "human_vs_human";
  status: "pending";
  createdAt: string;
  ageSeconds: number;
};

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
  timeline: ReplayTimelineStep[];
  replayErrors: string[];
  randomDrawRecords: ReplayRandomDrawEntry[];
  exploitSuggestions: ReplayExploitSuggestion[];
  localAnalysis: boolean;
};

export type ReplayExportArtifact = {
  version: "1.5.0";
  exportedAt: string;
  baseline: RulesBaseline;
  perspective: Side;
  replay: ReplayView;
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
      payload: SidePayload;
    }
  | {
      ok: false;
      error: SafeErrorPayload;
      payload?: SidePayload;
    };

type AiDecisionChooser = typeof chooseAiAction;
type AiStepFailureCode = "ai_no_action" | "ai_decision_action_not_legal";
type AiStepResult =
  | { ok: true }
  | { ok: false; code: AiStepFailureCode };

export class InMemoryMatchStorage implements MultiplayerStorage {
  private readonly records = new Map<string, StoredMatch>();

  async load(matchId: string, _options: { includeStateSnapshots?: boolean } = {}): Promise<StoredMatch | undefined> {
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
    return { ok: true, kind: "memory", matchCount: this.records.size, legacyImport: "not_applicable" };
  }
}

export class JsonFileMatchStorage implements MultiplayerStorage {
  private readonly records = new Map<string, StoredMatch>();
  private readonly ready: Promise<void>;

  constructor(private readonly filePath: string) {
    this.ready = this.loadFromDisk();
  }

  async load(matchId: string, _options: { includeStateSnapshots?: boolean } = {}): Promise<StoredMatch | undefined> {
    await this.ready;
    const record = this.records.get(matchId);
    return record ? clone(record) : undefined;
  }

  async save(record: StoredMatch): Promise<void> {
    await this.ready;
    this.records.set(record.match.matchId, clone(record));
    await this.flush();
  }

  async list(): Promise<StoredMatch[]> {
    await this.ready;
    return [...this.records.values()].map((record) => clone(record));
  }

  async health(): Promise<StorageHealth> {
    await this.ready;
    return { ok: true, kind: "json", matchCount: this.records.size, legacyImport: "not_applicable" };
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const content = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(content) as { matches?: StoredMatch[] };
      for (const record of parsed.matches ?? []) this.records.set(record.match.matchId, record);
    } catch (error) {
      if (!isNodeError(error) || error.code !== "ENOENT") throw error;
      await mkdir(dirname(this.filePath), { recursive: true });
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify({ matches: [...this.records.values()] }, null, 2)}\n`, "utf8");
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

  constructor(
    private readonly storage: MultiplayerStorage = new InMemoryMatchStorage(),
    options: {
      tokenSalt?: string;
      publicWebBaseUrl?: string;
      publicServerBaseUrl?: string;
      allowHiddenInfoUndo?: boolean;
      now?: () => string;
      chooseAiAction?: AiDecisionChooser;
    } = {}
  ) {
    this.tokenSalt = options.tokenSalt ?? envValue(process.env, "NETGRID_TOKEN_SALT") ?? LOCAL_DEFAULT_TOKEN_SALT;
    this.webBaseUrl = trimTrailingSlash(options.publicWebBaseUrl ?? envValue(process.env, "NETGRID_WEB_BASE_URL") ?? LOCAL_DEFAULT_WEB_BASE_URL);
    this.serverBaseUrl = trimTrailingSlash(options.publicServerBaseUrl ?? envValue(process.env, "NETGRID_SERVER_BASE_URL") ?? LOCAL_DEFAULT_SERVER_BASE_URL);
    this.allowHiddenInfoUndo = options.allowHiddenInfoUndo ?? false;
    this.now = options.now ?? (() => new Date().toISOString());
    this.chooseAiAction = options.chooseAiAction ?? chooseAiAction;
  }

  async createMatch(input: {
    hostSide: HostSideSelection;
    playMode?: "human_vs_ai";
    humanSide?: HostSideSelection;
    displayName?: string;
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
    discoverableInLan?: boolean;
  } & MatchDeckSelectionInput): Promise<CreateMatchResult> {
    const seed = input.seed?.trim() || `match-${randomId("seed")}`;
    const matchId = randomId("match");
    const requestedHumanSide = input.humanSide ?? input.hostSide;
    const resolvedHumanSide = requestedHumanSide === "random" ? deterministicHostSide(seed) : requestedHumanSide;
    const mode = input.playMode === "human_vs_ai" ? (resolvedHumanSide === "runner" ? "human_runner_vs_corp_ai" : "human_corp_vs_runner_ai") : input.mode ?? "human_vs_human";
    const hostSide = mode === "human_runner_vs_corp_ai" ? "runner" : mode === "human_corp_vs_runner_ai" ? "corp" : input.hostSide === "random" ? deterministicHostSide(seed) : input.hostSide;
    const joinSide = opposite(hostSide);
    const runnerPlayer = input.series?.runnerPlayer ?? (hostSide === "runner" ? "player_a" : "player_b");
    const corpPlayer = input.series?.corpPlayer ?? (hostSide === "corp" ? "player_a" : "player_b");
    const aiPlayer = aiPlayerForMode(mode);
    const aiDeckPolicy = aiPlayer ? input.aiDeckPolicy ?? "selected" : undefined;
    const aiPacingMode = input.aiPacingMode ?? (aiPlayer ? "paced" : undefined);
    const aiTraceMode = normalizeAiDecisionTraceMode(input.aiTraceMode);
    const discoverableInLan = mode === "human_vs_human" ? input.discoverableInLan !== false : false;
    const now = this.now();
    const hostSessionToken = generateToken();
    const hostReconnectToken = generateToken();
    const joinToken = mode === "human_vs_human" ? generateToken() : undefined;
    const matchFormat = normalizeMatchFormat(input.settings?.matchFormat);
    const cardPool = normalizeMatchCardPool(input.settings?.cardPool);
    const playerClockConfig = normalizePlayerClockConfig(input.settings?.playerClock);
    const countdownSeconds = normalizeCountdownSeconds(input.countdownSeconds);
    const sideAssignmentMode = mode === "human_vs_human" && input.hostSide === "random" ? "random_pending" : "fixed";
    const pendingDeckHandshake = mode === "human_vs_human" && Boolean(input.participantADecks) && !input.participantBDecks;
    if (pendingDeckHandshake) {
      const hostDeckPair = resolveParticipantDeckPair(input.participantADecks ?? legacyParticipantDeckPair(input), { cardPool });
      const pendingAgendaPointsToWin = agendaPointsToWinFor(matchFormat, input.settings?.agendaPointsToWin);
      const session: SessionRecord = {
        sessionId: randomId("session"),
        matchId,
        side: hostSide,
        displayName: input.displayName?.trim() || "Teilnehmer A",
        sessionTokenHash: this.hashToken(hostSessionToken),
        reconnectTokenHash: this.hashToken(hostReconnectToken),
        connected: false,
        createdAt: now,
        lastSeenAt: now
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
            cardPool,
            ...(playerClockConfig.mode === "player_clock" ? { playerClock: playerClockConfig } : {})
          },
          ...(playerClockConfig.mode === "player_clock" ? { playerClock: initialPlayerClockState(playerClockConfig) } : {}),
          deckSetup: {
            runnerSnapshotId: hostDeckPair.runnerSnapshot.deckSnapshotId,
            corpSnapshotId: hostDeckPair.corpSnapshot.deckSnapshotId,
            runner: hostDeckPair.runnerSnapshot.publicMetadata,
            corp: hostDeckPair.corpSnapshot.publicMetadata,
            participants: { player_a: publicParticipantDeckPair(hostDeckPair), player_b: publicParticipantDeckPair(hostDeckPair) }
          },
          ...(aiPacingMode ? { aiPacingMode } : {}),
          ...(aiTraceMode !== "off" ? { aiTraceMode } : {}),
          ...(matchFormat === "two_game_side_swap"
            ? {
                series: {
                  seriesId: input.series?.seriesId ?? randomId("series"),
                  mode: "two_game_side_swap",
                  status: "active",
                  gameNumber: input.series?.gameNumber ?? 1,
                  gamesPlanned: input.series?.gamesPlanned ?? 2,
                  runnerPlayer,
                  corpPlayer,
                  results: clone(input.series?.previousResults ?? []),
                  ...(input.series?.previousMatchId ? { previousMatchId: input.series.previousMatchId } : {})
                }
              }
            : {}),
          discoverableInLan,
          createdAt: now,
          updatedAt: now
        },
        sessions: [session],
        tokens: [
          this.tokenRecord(matchId, hostSide, "session", hostSessionToken, now),
          this.tokenRecord(matchId, hostSide, "reconnect", hostReconnectToken, now),
          ...(joinToken ? [this.tokenRecord(matchId, joinSide, "join", joinToken, now)] : [])
        ],
        privateDeckSnapshots: {
          runner: clone(hostDeckPair.runnerSnapshot),
          corp: clone(hostDeckPair.corpSnapshot),
          participants: {
            player_a: { runner: clone(hostDeckPair.runnerSnapshot), corp: clone(hostDeckPair.corpSnapshot) },
            player_b: { runner: clone(hostDeckPair.runnerSnapshot), corp: clone(hostDeckPair.corpSnapshot) }
          }
        },
        gameState: undefined as unknown as GameState,
        startLobby: {
          hostReady: false,
          joinerReady: false,
          countdownSeconds,
          agendaPointsToWin: pendingAgendaPointsToWin,
          matchFormat,
          cardPool,
          sideAssignmentMode,
          sideAssignment: { runnerPlayer, corpPlayer },
          chatMessages: []
        },
        eventLog: [],
        actionReceipts: [],
        undoSnapshots: [],
        stateSnapshots: []
      };
      await this.storage.save(record);
      const lobbyPayload = this.lobbyPayloadFor(record, hostSide);
      return {
        matchId,
        matchStatus: record.match.status,
        pendingDeckHandshake: true,
        hostSide,
        hostSessionToken,
        hostReconnectToken,
        ...(joinToken ? { joinUrl: `${this.webBaseUrl}/?matchId=${encodeURIComponent(matchId)}&joinToken=${encodeURIComponent(joinToken)}` } : {}),
        webSocketUrl: this.webSocketUrl(),
        mode,
        baseline: record.match.baseline,
        playerView: undefined as unknown as PlayerView,
        legalActions: [],
        matchVersion: record.match.matchVersion,
        ...(lobbyPayload.playerClock ? { playerClock: lobbyPayload.playerClock } : {}),
        ...(lobbyPayload.startLobby ? { lobby: lobbyPayload.startLobby } : {})
      };
    }
    const participantDecks = resolveParticipantDeckSetup(input, { seed, ...(aiPlayer ? { aiPlayer } : {}), ...(aiDeckPolicy ? { aiDeckPolicy } : {}), cardPool });
    const deckSetup = deckSetupForParticipants(participantDecks, { runnerPlayer, corpPlayer });
    const settings: MatchSettings = {
      agendaPointsToWin: agendaPointsToWinFor(matchFormat, input.settings?.agendaPointsToWin),
      matchFormat,
      cardPool,
      ...(playerClockConfig.mode === "player_clock" ? { playerClock: playerClockConfig } : {})
    };
    const baseline = baselineForMode(mode, deckSetup);
    const controllers = controllersForMode(mode, hostSide, {
      runnerDifficulty: input.runnerDifficulty ?? "normal",
      corpDifficulty: input.corpDifficulty ?? "normal"
    });
    const gameState = createGame({
      matchId,
      seed,
      baseline,
      agendaPointsToWin: settings.agendaPointsToWin,
      controllers,
      runnerDeck: deckSetup.runnerDeck,
      corpDeck: deckSetup.corpDeck,
      runnerDeckMetadata: deckSetup.runnerSnapshot.publicMetadata,
      corpDeckMetadata: deckSetup.corpSnapshot.publicMetadata
    });

    const session: SessionRecord = {
      sessionId: randomId("session"),
      matchId,
      side: hostSide,
        displayName: input.displayName?.trim() || (hostSide === "runner" ? "Runner" : "Korp"),
      sessionTokenHash: this.hashToken(hostSessionToken),
      reconnectTokenHash: this.hashToken(hostReconnectToken),
      connected: false,
      createdAt: now,
      lastSeenAt: now
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
          ...(aiDeckPolicy ? { aiDeckPolicy } : {})
        },
        ...(mode === "human_vs_human" ? {} : { aiControllers: aiControllersFor(controllers) }),
        ...(aiPacingMode ? { aiPacingMode } : {}),
        ...(aiTraceMode !== "off" ? { aiTraceMode } : {}),
        discoverableInLan,
        ...(settings.matchFormat === "two_game_side_swap"
          ? {
              series: input.series
                ? {
                    seriesId: input.series.seriesId,
                    mode: "two_game_side_swap",
                    status: "active",
                    gameNumber: input.series.gameNumber,
                    gamesPlanned: input.series.gamesPlanned,
                    runnerPlayer,
                    corpPlayer,
                    results: clone(input.series.previousResults),
                    ...(input.series.previousMatchId ? { previousMatchId: input.series.previousMatchId } : {})
                  }
                : {
                    seriesId: randomId("series"),
                    mode: "two_game_side_swap",
                    status: "active",
                    gameNumber: 1,
                    gamesPlanned: 2,
                    runnerPlayer,
                    corpPlayer,
                    results: []
                  }
            }
          : {}),
        playerClock: initialPlayerClockState(playerClockConfig),
        createdAt: now,
        updatedAt: now
      },
      sessions: [session],
      tokens: [
        this.tokenRecord(matchId, hostSide, "session", hostSessionToken, now),
        this.tokenRecord(matchId, hostSide, "reconnect", hostReconnectToken, now),
        ...(joinToken ? [this.tokenRecord(matchId, joinSide, "join", joinToken, now)] : [])
      ],
      gameState,
      privateDeckSnapshots: {
        runner: clone(deckSetup.runnerSnapshot),
        corp: clone(deckSetup.corpSnapshot),
        participants: privateParticipantDeckSetup(participantDecks)
      },
      eventLog: gameState.eventLog.map((event) => toEventRecord(matchId, event, false)),
      actionReceipts: [],
      undoSnapshots: [],
      stateSnapshots: [this.snapshotFor(matchId, gameState, 1, "snap_initial", false)]
    };

    this.maybeRunAiAfterTransition(record);
    this.syncPlayerClock(record, now);
    await this.storage.save(record);
    const payload = this.payloadFor(record, hostSide);
    return {
      matchId,
      matchStatus: record.match.status,
      hostSide,
      hostSessionToken,
      hostReconnectToken,
      ...(joinToken ? { joinUrl: `${this.webBaseUrl}/?matchId=${encodeURIComponent(matchId)}&joinToken=${encodeURIComponent(joinToken)}` } : {}),
      webSocketUrl: this.webSocketUrl(),
      mode,
      baseline,
      playerView: payload.playerView,
      legalActions: payload.legalActions,
      matchVersion: record.match.matchVersion,
      ...(payload.pendingChoice ? { pendingChoice: payload.pendingChoice } : {}),
      ...(payload.playerClock ? { playerClock: payload.playerClock } : {}),
      ...(payload.aiTurnPresentation ? { aiTurnPresentation: payload.aiTurnPresentation } : {}),
      ...(payload.winner ? { winner: payload.winner } : {}),
      ...(payload.finalStateHash ? { finalStateHash: payload.finalStateHash } : {}),
      ...(payload.resultSummary ? { resultSummary: payload.resultSummary } : {})
    };
  }

  async startNextSeriesGame(
    matchId: string,
    input: { side: Side; sessionToken: string; displayName?: string }
  ): Promise<CreateMatchResult | { error: SafeErrorPayload }> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      const series = record.match.series;
      if (!series || record.match.settings.matchFormat !== "two_game_side_swap") {
        return { error: safeError("series_not_available", "Für dieses Match ist keine private Matchserie aktiv.") };
      }
      if (!isSeriesGameCompleteForNext(record)) {
        return { error: safeError("series_game_not_finished", "Das nächste Serienspiel ist erst nach Spielende verfügbar.") };
      }

      this.finalizeSeriesGame(record);
      if (series.status === "finished" || series.results.length >= series.gamesPlanned) {
        await this.storage.save(record);
        return { error: safeError("series_finished", "Die private Matchserie ist bereits abgeschlossen.") };
      }
      if (series.nextMatchId) {
        await this.storage.save(record);
        return { error: safeError("series_next_exists", "Das nächste Serienspiel wurde bereits erstellt.") };
      }

      const requesterPlayer = seriesPlayerForSide(series, input.side);
      const opponentPlayer = oppositeSeriesPlayer(requesterPlayer);
      const nextHostSide = opposite(input.side);
      const nextGameNumber = series.gameNumber + 1;
      const nextMode = nextModeForSideSwap(record.match.mode);
      const aiDifficulty = record.match.aiControllers?.runner?.difficulty ?? record.match.aiControllers?.corp?.difficulty ?? "normal";
      const participantDecks = participantDeckInputsForRecord(record);
      const next = await this.createMatch({
        hostSide: nextHostSide,
        displayName: input.displayName ?? session.displayName,
        seed: `${record.gameState.seed}:series-game-${nextGameNumber}`,
        mode: nextMode,
        ...(nextMode === "human_runner_vs_corp_ai" ? { corpDifficulty: aiDifficulty } : {}),
        ...(nextMode === "human_corp_vs_runner_ai" ? { runnerDifficulty: aiDifficulty } : {}),
        ...(record.match.aiPacingMode ? { aiPacingMode: record.match.aiPacingMode } : {}),
        ...(typeof record.match.discoverableInLan === "boolean" ? { discoverableInLan: record.match.discoverableInLan } : {}),
        ...(record.match.deckSetup.aiDeckPolicy ? { aiDeckPolicy: record.match.deckSetup.aiDeckPolicy } : {}),
        settings: record.match.settings,
        participantADecks: participantDecks.player_a,
        participantBDecks: participantDecks.player_b,
        series: {
          seriesId: series.seriesId,
          gameNumber: nextGameNumber,
          gamesPlanned: series.gamesPlanned,
          runnerPlayer: nextHostSide === "runner" ? requesterPlayer : opponentPlayer,
          corpPlayer: nextHostSide === "corp" ? requesterPlayer : opponentPlayer,
          previousResults: series.results,
          previousMatchId: record.match.matchId
        }
      });
      series.nextMatchId = next.matchId;
      record.match.updatedAt = this.now();
      await this.storage.save(record);
      return next;
    });
  }

  async getJoinInfo(matchId: string, token?: string): Promise<{ matchId: string; status: MatchStatus; availableSide?: Side } | SafeErrorPayload> {
    const record = await this.mustLoad(matchId);
    if (!record) return safeError("not_found", "Dieses private Match ist nicht verfügbar.");
    if (!token) return { matchId, status: record.match.status };
    const tokenRecord = this.findToken(record, token, "join");
    if (!tokenRecord) return safeError("invalid_token", "Der Join-Link ist nicht gültig oder abgelaufen.");
    return { matchId, status: record.match.status, availableSide: tokenRecord.allowedSide };
  }

  async joinMatch(matchId: string, input: { token?: string; displayName?: string } & ParticipantDeckPairInput): Promise<JoinMatchResult | { error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
    if (isTerminalStatus(record.match.status)) return { error: safeError("match_terminal", "Dieses private Match ist bereits abgeschlossen.") };
    const tokenRecord = this.resolveJoinTokenForJoinInput(record, input.token);
    if (!tokenRecord) return { error: safeError("invalid_token", "Der Join-Link ist nicht gültig oder abgelaufen.") };
    if (record.sessions.some((session) => session.side === tokenRecord.allowedSide)) {
      return { error: safeError("side_taken", "Dieses private Match ist für diesen Link nicht mehr verfügbar.") };
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
      lastSeenAt: now
    });
    record.tokens = record.tokens.map((candidate) => (candidate.tokenId === tokenRecord.tokenId ? { ...candidate, usedAt: now } : candidate));
    record.tokens.push(this.tokenRecord(matchId, tokenRecord.allowedSide, "session", sessionToken, now));
    record.tokens.push(this.tokenRecord(matchId, tokenRecord.allowedSide, "reconnect", reconnectToken, now));
    if ((record.match.status === "pending" && !record.gameState) || record.match.status === "waiting_for_joiner_decks") {
      const joinerDecks: ParticipantDeckPairInput = {
        ...(input.runnerDeckSnapshotId ? { runnerDeckSnapshotId: input.runnerDeckSnapshotId } : {}),
        ...(input.corpDeckSnapshotId ? { corpDeckSnapshotId: input.corpDeckSnapshotId } : {}),
        ...(input.runnerDeckSnapshot ? { runnerDeckSnapshot: input.runnerDeckSnapshot } : {}),
        ...(input.corpDeckSnapshot ? { corpDeckSnapshot: input.corpDeckSnapshot } : {})
      };
      if (!joinerDecks.runnerDeckSnapshot && !joinerDecks.runnerDeckSnapshotId) {
        return { error: safeError("join_runner_deck_missing", "Bitte wähle ein Runner-Deck für den Beitritt.") };
      }
      if (!joinerDecks.corpDeckSnapshot && !joinerDecks.corpDeckSnapshotId) {
        return { error: safeError("join_corp_deck_missing", "Bitte wähle ein Korp-Deck für den Beitritt.") };
      }
      try {
        this.activatePendingDeckHandshake(record, joinerDecks);
      } catch (error) {
        return { error: safeError("join_deck_invalid", deckErrorMessage(error)) };
      }
    } else {
      record.match.status = "active";
    }
    record.match.matchVersion += 1;
    record.match.updatedAt = now;
    if (record.match.status === "active") this.maybeRunAiAfterTransition(record);
    await this.storage.save(record);

    const currentStatus = record.match.status as MatchStatus;
    if (currentStatus === "ready_check" || currentStatus === "countdown" || currentStatus === "pending" || !record.gameState) {
      const lobbyPayload = this.lobbyPayloadFor(record, tokenRecord.allowedSide);
      return {
        matchId,
        sessionToken,
        reconnectToken,
        side: tokenRecord.allowedSide,
        webSocketUrl: this.webSocketUrl(),
        playerView: undefined as unknown as PlayerView,
        legalActions: [],
        matchVersion: record.match.matchVersion,
        matchStatus: record.match.status,
        ...(lobbyPayload.playerClock ? { playerClock: lobbyPayload.playerClock } : {}),
        ...(lobbyPayload.startLobby ? { lobby: lobbyPayload.startLobby } : {})
      };
    }

    const payload = this.payloadFor(record, tokenRecord.allowedSide);
    return {
      matchId,
      sessionToken,
      reconnectToken,
      side: tokenRecord.allowedSide,
      webSocketUrl: this.webSocketUrl(),
      playerView: payload.playerView,
      legalActions: payload.legalActions,
      matchVersion: record.match.matchVersion,
      ...(payload.pendingChoice ? { pendingChoice: payload.pendingChoice } : {}),
      ...(payload.playerClock ? { playerClock: payload.playerClock } : {}),
      ...(payload.aiTurnPresentation ? { aiTurnPresentation: payload.aiTurnPresentation } : {}),
      ...(payload.winner ? { winner: payload.winner } : {}),
      ...(payload.finalStateHash ? { finalStateHash: payload.finalStateHash } : {}),
      ...(payload.resultSummary ? { resultSummary: payload.resultSummary } : {})
    };
  }

  async reconnectMatch(matchId: string, input: { side: Side; reconnectToken: string; displayName?: string }): Promise<ReconnectResult | { error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
    const token = this.findToken(record, input.reconnectToken, "reconnect");
    if (!token) return { error: safeError("invalid_token", "Reconnect ist nicht möglich.") };
    const session = record.sessions.find((candidate) => candidate.side === input.side && candidate.reconnectTokenHash === token.tokenHash);
    if (!session) return { error: safeError("invalid_token", "Reconnect ist nicht möglich.") };

    const now = this.now();
    const sessionToken = generateToken();
    const reconnectToken = generateToken();
    this.revokeTokenByHash(record, "session", session.sessionTokenHash, now);
    this.revokeTokenByHash(record, "reconnect", session.reconnectTokenHash, now);
    record.sessions = record.sessions.map((candidate) =>
      candidate.sessionId === session.sessionId
        ? {
            ...candidate,
            displayName: input.displayName?.trim() || candidate.displayName,
            sessionTokenHash: this.hashToken(sessionToken),
            reconnectTokenHash: this.hashToken(reconnectToken),
            lastSeenAt: now
          }
        : candidate
    );
    record.tokens.push(this.tokenRecord(matchId, input.side, "session", sessionToken, now));
    record.tokens.push(this.tokenRecord(matchId, input.side, "reconnect", reconnectToken, now));
    this.syncPlayerClock(record, now);
    record.match.matchVersion += 1;
    record.match.updatedAt = now;
    await this.storage.save(record);

    const payload = this.shouldUseLobbyPayload(record) ? this.lobbyPayloadFor(record, input.side) : this.payloadFor(record, input.side);
    return {
      matchId,
      sessionToken,
      reconnectToken,
      side: input.side,
      webSocketUrl: this.webSocketUrl(),
      playerView: isSidePayload(payload) ? payload.playerView : (undefined as unknown as PlayerView),
      legalActions: isSidePayload(payload) ? payload.legalActions : [],
      matchVersion: record.match.matchVersion,
      eventTail: payload.eventTail,
      matchStatus: payload.matchStatus,
      ...(!isSidePayload(payload) && payload.startLobby ? { lobby: payload.startLobby } : {}),
      ...(isSidePayload(payload) && payload.pendingChoice ? { pendingChoice: payload.pendingChoice } : {}),
      ...(payload.playerClock ? { playerClock: payload.playerClock } : {}),
      ...(isSidePayload(payload) && payload.pendingUndo ? { pendingUndo: payload.pendingUndo } : {}),
      ...(isSidePayload(payload) && payload.aiTurnPresentation ? { aiTurnPresentation: payload.aiTurnPresentation } : {}),
      ...(isSidePayload(payload) && payload.winner ? { winner: payload.winner } : {}),
      ...(isSidePayload(payload) && payload.finalStateHash ? { finalStateHash: payload.finalStateHash } : {}),
      ...(isSidePayload(payload) && payload.resultSummary ? { resultSummary: payload.resultSummary } : {})
    };
  }

  async bootstrap(matchId: string, side: Side, sessionToken: string): Promise<SidePayload | { error: SafeErrorPayload }>;
  async bootstrap(matchId: string, side: Side, sessionToken: string, options: { allowLobby: true }): Promise<ServicePayload | { error: SafeErrorPayload }>;
  async bootstrap(matchId: string, side: Side, sessionToken: string, options?: { allowLobby?: boolean }): Promise<ServicePayload | { error: SafeErrorPayload }> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, side, sessionToken);
      if (!session) return { error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      session.lastSeenAt = this.now();
      this.syncPlayerClock(record);
      if (this.storage instanceof InMemoryMatchStorage) await this.storage.save(record);
      if (this.shouldUseLobbyPayload(record)) {
        const lobby = this.lobbyPayloadFor(record, side);
        return options?.allowLobby ? lobby : ({ error: safeError("match_pending", "Das Match ist noch nicht aktiv.") } as { error: SafeErrorPayload });
      }
      return this.payloadFor(record, side);
    });
  }

  async setConnected(matchId: string, side: Side, sessionToken: string, connected: boolean): Promise<ServicePayload | { error: SafeErrorPayload }> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, side, sessionToken);
      if (!session) return { error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      session.connected = connected;
      session.lastSeenAt = this.now();
      this.syncPlayerClock(record);
      let persistentLifecycleChange = false;
      if (!connected && record.match.status === "countdown" && record.startLobby) {
        this.cancelCountdownFor(record, side);
        persistentLifecycleChange = true;
      }
      const persistTransientConnectionState = this.storage instanceof InMemoryMatchStorage;
      if (persistentLifecycleChange || persistTransientConnectionState) {
        record.match.matchVersion += 1;
        record.match.updatedAt = this.now();
        await this.storage.save(record);
      }
      if (this.shouldUseLobbyPayload(record)) return this.lobbyPayloadFor(record, side);
      return this.payloadFor(record, side);
    });
  }

  async setLobbyReady(input: { matchId: string; side: Side; sessionToken: string; ready: boolean }): Promise<LobbyActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId, { includeStateSnapshots: false });
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (!record.startLobby || (record.match.status !== "ready_check" && record.match.status !== "countdown")) {
        return { ok: false, error: safeError("lobby_not_available", "Die Startlobby ist aktuell nicht verfügbar.") };
      }

      this.setReadyFlagForSession(record, session, input.ready);
      if (!input.ready) this.clearCountdown(record);
      else if (record.startLobby.hostReady && record.startLobby.joinerReady && record.match.status !== "countdown") {
        this.startLobbyCountdown(record);
      }
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      await this.storage.save(record);
      return this.lobbyResultFor(record, input.side);
    });
  }

  async cancelLobbyCountdown(input: { matchId: string; side: Side; sessionToken: string }): Promise<LobbyActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId, { includeStateSnapshots: false });
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (!record.startLobby || (record.match.status !== "ready_check" && record.match.status !== "countdown")) {
        return { ok: false, error: safeError("lobby_not_available", "Die Startlobby ist aktuell nicht verfügbar.") };
      }

      this.setReadyFlagForSession(record, session, false);
      this.clearCountdown(record);
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      await this.storage.save(record);
      return this.lobbyResultFor(record, input.side);
    });
  }

  async cancelMatch(input: { matchId: string; side: Side; sessionToken: string }): Promise<LifecycleActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId, { includeStateSnapshots: false });
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (isTerminalStatus(record.match.status)) return { ok: true, actorPayload: this.safePayloadFor(record, input.side) };
      if (!isHostSession(record, session)) return { ok: false, error: safeError("host_required", "Nur der Host kann dieses Match abbrechen."), payload: this.safePayloadFor(record, input.side) };
      if (!isCancellableLobbyStatus(record.match.status)) {
        return { ok: false, error: safeError("match_not_cancellable", "Dieses Match kann nicht mehr abgebrochen werden."), payload: this.safePayloadFor(record, input.side) };
      }

      this.terminalizeLifecycle(record, "cancelled", "cancel", input.side);
      await this.storage.save(record);
      return this.lifecycleResultFor(record, input.side);
    });
  }

  async leaveMatch(input: { matchId: string; side: Side; sessionToken: string }): Promise<LifecycleActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId, { includeStateSnapshots: false });
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (isTerminalStatus(record.match.status)) return { ok: true, actorPayload: this.safePayloadFor(record, input.side) };
      if (isHostSession(record, session)) return { ok: false, error: safeError("leave_requires_joiner", "Der Host bricht die Lobby über Abbrechen ab."), payload: this.safePayloadFor(record, input.side) };
      if (
        record.match.status === "pending" ||
        record.match.status === "waiting_for_joiner_decks" ||
        record.match.status === "waiting_for_runner" ||
        record.match.status === "waiting_for_corp" ||
        record.match.status === "ready_check" ||
        record.match.status === "countdown"
      ) {
        this.removeJoinerFromOpenLobby(record, session);
        await this.storage.save(record);
        return this.lifecycleResultFor(record, input.side);
      }
      return { ok: false, error: safeError("match_not_leavable", "Dieses Match kann nicht als Lobby verlassen werden."), payload: this.safePayloadFor(record, input.side) };
    });
  }

  async forfeitMatch(input: { matchId: string; side: Side; sessionToken: string }): Promise<LifecycleActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (record.match.status === "forfeited") return { ok: true, actorPayload: this.payloadFor(record, input.side), opponentPayload: this.payloadFor(record, opposite(input.side)) };
      if (record.match.status !== "active" || !record.gameState) {
        return { ok: false, error: safeError("match_not_active", "Aufgeben ist nur in aktiven Spielen möglich."), payload: this.safePayloadFor(record, input.side) };
      }
      if (this.isAiSide(record, input.side)) return { ok: false, error: safeError("ai_forfeit_forbidden", "Die KI gibt in V1.0.4 nicht aktiv auf.") };

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
        finalEngineStateHash
      };
      delete record.pendingUndo;
      this.finalizeSeriesGame(record);
      await this.storage.save(record);
      return this.lifecycleResultFor(record, input.side);
    });
  }

  async recreateMatch(matchId: string, input: { side: Side; sessionToken: string; displayName?: string }): Promise<LifecycleActionResult> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticateForRecreate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (record.match.status === "active") {
        return { ok: false, error: safeError("match_active", "Ein aktives Match kann erst nach Aufgabe oder Spielende neu erstellt werden."), payload: this.payloadFor(record, input.side) };
      }
      if ((record.match.status === "cancelled" || record.match.status === "abandoned" || !isTerminalStatus(record.match.status)) && !isHostSession(record, session)) {
        return { ok: false, error: safeError("host_required", "Nur der Host kann diese Lobby neu erstellen."), payload: this.safePayloadFor(record, input.side) };
      }

      const recreateInput = this.recreateInputFor(record, session, input.displayName);
      if (!isTerminalStatus(record.match.status)) this.terminalizeLifecycle(record, "cancelled", "cancel", input.side);
      else this.revokeAllTokens(record, this.now());
      await this.storage.save(record);
      const newMatch = await this.createMatch(recreateInput);
      return {
        ok: true,
        actorPayload: this.safePayloadFor(record, input.side),
        ...(record.sessions.some((candidate) => candidate.side === opposite(input.side)) ? { opponentPayload: this.safePayloadFor(record, opposite(input.side)) } : {}),
        newMatch
      };
    });
  }

  async sendLobbyChat(input: { matchId: string; side: Side; sessionToken: string; text: string }): Promise<LobbyActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (!record.startLobby || (record.match.status !== "ready_check" && record.match.status !== "countdown")) {
        return { ok: false, error: safeError("lobby_not_available", "Der Lobbychat ist aktuell nicht verfügbar.") };
      }
      const text = input.text.trim().slice(0, 300);
      if (!text) return { ok: false, error: safeError("chat_empty", "Leere Chatnachrichten werden nicht gesendet."), payload: this.lobbyPayloadFor(record, input.side) };

      const lastId = record.startLobby.chatMessages.at(-1)?.id ?? 0;
      record.startLobby.chatMessages = [
        ...record.startLobby.chatMessages.slice(-49),
        {
          id: lastId + 1,
          side: input.side,
          displayName: session.displayName,
          sentAt: this.now(),
          text
        }
      ];
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      await this.storage.save(record);
      return this.lobbyResultFor(record, input.side);
    });
  }

  async activateLobbyCountdown(matchId: string): Promise<LobbyActionResult> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      if (!record.startLobby || record.match.status !== "countdown") {
        return { ok: false, error: safeError("countdown_not_active", "Der Countdown läuft nicht.") };
      }
      if (new Date(record.startLobby.countdownEndsAt ?? "").getTime() > new Date(this.now()).getTime()) {
        return { ok: false, error: safeError("countdown_not_due", "Der Countdown läuft noch."), payload: this.lobbyPayloadFor(record, record.sessions[0]?.side ?? "runner") };
      }
      if (!record.startLobby.hostReady || !record.startLobby.joinerReady) {
        this.clearCountdown(record);
        await this.storage.save(record);
        return { ok: false, error: safeError("lobby_not_ready", "Beide Personen müssen bereit sein."), payload: this.lobbyPayloadFor(record, record.sessions[0]?.side ?? "runner") };
      }

      this.activateReadyLobby(record);
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      this.maybeRunAiAfterTransition(record);
      this.syncPlayerClock(record);
      await this.storage.save(record);
      return this.lobbyResultFor(record, record.sessions[0]?.side ?? "runner", true);
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
      const record = await this.mustLoad(input.matchId, { includeStateSnapshots: false });
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (record.match.status !== "active") {
        return { ok: false, error: safeError("match_not_active", "Das Match ist noch nicht aktiv.") };
      }
      if (!record.gameState) return { ok: false, error: safeError("match_not_active", "Das Match wartet noch auf vollständige Deckauswahl.") };
      if (this.syncPlayerClock(record)) {
        await this.storage.save(record);
        return {
          ok: false,
          error: safeError("time_expired", "Die Spielerzeit ist abgelaufen.", record.gameState, input.side),
          payload: this.payloadFor(record, input.side)
        };
      }

      const duplicate = record.actionReceipts.find((receipt) => receipt.side === input.side && receipt.idempotencyKey === input.idempotencyKey);
      if (duplicate) {
        return {
          ok: true,
          receipt: duplicate,
          actorPayload: this.payloadFor(record, input.side),
          opponentPayload: this.payloadFor(record, opposite(input.side))
        };
      }

      if (input.clientKnownStateVersion !== record.gameState.stateVersion) {
        const receipt = this.receiptFor(record, input.side, input.idempotencyKey, false, "stale_state");
        record.actionReceipts.push(receipt);
        await this.storage.save(record);
        return {
          ok: false,
          receipt,
          error: safeError("stale_state", "Der Spielzustand ist veraltet.", record.gameState, input.side),
          payload: this.payloadFor(record, input.side)
        };
      }

      const action: PlayerAction = {
        matchId: input.matchId,
        side: input.side,
        actionId: input.actionId,
        clientKnownStateVersion: input.clientKnownStateVersion,
        idempotencyKey: input.idempotencyKey,
        ...(input.selectedTargets ? { selectedTargets: input.selectedTargets } : {}),
        ...(input.selectedChoices ? { selectedChoices: input.selectedChoices } : {})
      };
      const snapshot = this.snapshotFor(input.matchId, record.gameState, record.match.matchVersion, `snap_before_${record.gameState.stateVersion + 1}`, false);
      const result = applyAction(record.gameState, action, { publicEventsMode: "latest" });
      if (!result.ok) {
        const receipt = this.receiptFor(record, input.side, input.idempotencyKey, false, result.error.code);
        record.actionReceipts.push(receipt);
        await this.storage.save(record);
        return {
          ok: false,
          receipt,
          error: safeError(result.error.code, "Diese Aktion ist nicht legal.", record.gameState, input.side),
          payload: this.payloadFor(record, input.side)
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
        stateHashAfter: result.stateHash
      };
      record.actionReceipts.push(receipt);
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      if (result.state.winner) {
        this.finalizeFinishedMatch(record);
      }
      this.maybeRunAiAfterTransition(record);
      this.syncPlayerClock(record);
      await this.storage.save(record);
      const success: SubmitActionResult = {
        ok: true,
        receipt,
        actorPayload: this.payloadFor(record, input.side),
        opponentPayload: this.payloadFor(record, opposite(input.side))
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
      const record = await this.mustLoad(input.matchId, { includeStateSnapshots: false });
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (this.isAiSide(record, input.side)) return { ok: false, error: safeError("ai_session_forbidden", "Nur eine menschliche Session darf die KI fortsetzen.") };
      if (record.match.status !== "active" || !record.gameState) return { ok: false, error: safeError("match_not_active", "Das Match ist noch nicht aktiv.") };
      if (this.syncPlayerClock(record)) {
        await this.storage.save(record);
        return { ok: false, error: safeError("time_expired", "Die Spielerzeit ist abgelaufen.", record.gameState, input.side), payload: this.payloadFor(record, input.side) };
      }
      const activeAiSide = this.aiControllableSide(record);
      if (!activeAiSide) {
        return { ok: false, error: safeError("ai_not_active", "Aktuell ist keine KI am Zug.", record.gameState, input.side), payload: this.payloadFor(record, input.side) };
      }
      if (input.knownStateVersion !== undefined && input.knownStateVersion !== record.gameState.stateVersion) {
        return { ok: false, error: safeError("stale_state", "Der Spielzustand ist veraltet.", record.gameState, input.side), payload: this.payloadFor(record, input.side) };
      }
      if (input.knownMatchVersion !== undefined && input.knownMatchVersion !== record.match.matchVersion) {
        return { ok: false, error: safeError("stale_match", "Der Matchzustand ist veraltet.", record.gameState, input.side), payload: this.payloadFor(record, input.side) };
      }

      const beforeEventCount = record.eventLog.length;
      const aiStepResult = input.mode === "until_human"
        ? this.runAiUntilNextHuman(record)
        : this.runAiStep(record);

      if (!aiStepResult.ok && aiStepResult.code === "ai_decision_action_not_legal") {
        await this.storage.save(record);
        return {
          ok: false,
          error: safeError("ai_decision_action_not_legal", "Die KI wählte keine aktuell legale Aktion.", record.gameState, input.side),
          payload: this.payloadFor(record, input.side)
        };
      }

      if (record.eventLog.length === beforeEventCount) {
        await this.storage.save(record);
        return { ok: false, error: safeError("ai_no_action", "Die KI konnte aktuell keine Aktion ausführen.", record.gameState, input.side), payload: this.payloadFor(record, input.side) };
      }

      await this.storage.save(record);
      const result: AdvanceAiResult = {
        ok: true,
        requesterPayload: this.payloadFor(record, input.side),
        opponentPayload: this.payloadFor(record, opposite(input.side))
      };
      const publicEvent = record.eventLog.at(-1)?.publicPayload;
      if (publicEvent) result.publicEvent = publicEvent;
      return result;
    });
  }

  async previewAi(input: {
    matchId: string;
    side: Side;
    sessionToken: string;
    knownStateVersion?: number;
    knownMatchVersion?: number;
  }): Promise<PreviewAiResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId, { includeStateSnapshots: false });
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (this.isAiSide(record, input.side)) return { ok: false, error: safeError("ai_session_forbidden", "Nur eine menschliche Session darf die KI bewerten.") };
      if (record.match.status !== "active" || !record.gameState) return { ok: false, error: safeError("match_not_active", "Das Match ist noch nicht aktiv.") };
      const activeAiSide = this.aiControllableSide(record);
      if (!activeAiSide) {
        return { ok: false, error: safeError("ai_not_active", "Aktuell ist keine KI am Zug.", record.gameState, input.side), payload: this.payloadFor(record, input.side) };
      }
      if (input.knownStateVersion !== undefined && input.knownStateVersion !== record.gameState.stateVersion) {
        return { ok: false, error: safeError("stale_state", "Der Spielzustand ist veraltet.", record.gameState, input.side), payload: this.payloadFor(record, input.side) };
      }
      if (input.knownMatchVersion !== undefined && input.knownMatchVersion !== record.match.matchVersion) {
        return { ok: false, error: safeError("stale_match", "Der Matchzustand ist veraltet.", record.gameState, input.side), payload: this.payloadFor(record, input.side) };
      }

      const legalActions = getLegalActions(record.gameState, activeAiSide);
      if (legalActions.length === 0) {
        return { ok: false, error: safeError("ai_no_action", "Die KI hat aktuell keine legalen Aktionen.", record.gameState, input.side), payload: this.payloadFor(record, input.side) };
      }
      const controller = record.match.aiControllers?.[activeAiSide];
      const ownDeckSnapshot = record.privateDeckSnapshots?.[activeAiSide];
      const aiInput = buildAiDecisionInput(record.gameState, activeAiSide, {
        difficulty: controller?.difficulty ?? "normal",
        profileId: controller?.profileId ?? `${activeAiSide}-server-ai-v0.9-${controller?.difficulty ?? "normal"}`,
        decisionId: `${record.match.matchId}:${record.gameState.stateVersion}:${activeAiSide}`,
        actionNumber: record.gameState.stateVersion,
        ...(ownDeckSnapshot ? { ownDeckSnapshot } : {})
      });
      const decision = this.chooseAiAction(
        aiInput,
        { persistTacticalPlanMemory: false }
      );
      const legalAction = legalActionForAiDecision(decision, legalActions);
      if (!legalAction) {
        return { ok: false, error: safeError("ai_decision_action_not_legal", "Die KI wählte keine aktuell legale Aktion.", record.gameState, input.side), payload: this.payloadFor(record, input.side) };
      }
      const safeDebug = sanitizeAiDecisionDebug(decision.decisionDebug);
      const detail = withAiPrivateHandPreview(
        safeDebug
          ? aiDecisionTraceJson(safeDebug, activeAiSide, legalAction, "detailed")
          : minimalAiPreviewDetail(activeAiSide, legalAction, decision),
        aiInput,
      );
      const preview: AiDecisionPreview = {
        matchId: record.match.matchId,
        matchVersion: record.match.matchVersion,
        stateVersion: record.gameState.stateVersion,
        requestedBy: input.side,
        side: activeAiSide,
        generatedAt: this.now(),
        actionId: legalAction.actionId,
        actionType: legalAction.type,
        actionLabel: legalAction.label,
        reasonCode: decision.reasonCode,
        explanation: decision.explanation,
        fallbackUsed: decision.fallbackUsed,
        ...(decision.timeoutUsed ? { timeoutUsed: true } : {}),
        ...(typeof decision.confidence === "number" ? { confidence: decision.confidence } : {}),
        ...(decision.selectedChoices ? { selectedChoices: decision.selectedChoices } : {}),
        detail
      };
      return { ok: true, preview, payload: this.payloadFor(record, input.side) };
    });
  }

  async requestUndo(input: { matchId: string; side: Side; sessionToken: string; targetEventId: string; reason?: string }): Promise<UndoResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (record.match.status !== "active" || !record.gameState) return { ok: false, error: safeError("match_not_active", "Undo ist aktuell nicht möglich.") };
      const targetIndex = record.eventLog.findIndex((event) => event.eventId === input.targetEventId);
      if (targetIndex < 0) return { ok: false, error: safeError("undo_not_available", "Undo ist aktuell nicht möglich."), payload: this.payloadFor(record, input.side) };
      const crossesHiddenInfoBarrier = record.eventLog.slice(targetIndex).some((event) => event.hiddenInfoBarrier);
      if (crossesHiddenInfoBarrier && !this.allowHiddenInfoUndo) {
        const blockedSnapshot: UndoSnapshot = {
          undoRequestId: randomId("undo"),
          matchId: input.matchId,
          targetEventId: input.targetEventId,
          snapshotId: "blocked",
          requestedBy: input.side,
          status: "blocked",
          hiddenInfoSafe: false
        };
        record.undoSnapshots.push(blockedSnapshot);
        await this.storage.save(record);
        return { ok: false, error: safeError("undo_blocked", "Undo ist nach verdeckter Information nicht möglich."), payload: this.payloadFor(record, input.side) };
      }
      const snapshot = record.stateSnapshots.find((candidate) => candidate.snapshotId === `snap_before_${record.eventLog[targetIndex]?.stateVersionAfter}`);
      if (!snapshot) return { ok: false, error: safeError("undo_not_available", "Undo ist aktuell nicht möglich."), payload: this.payloadFor(record, input.side) };
      const undoRequest: PendingUndoRequest = {
        undoRequestId: randomId("undo"),
        requestedBy: input.side,
        targetEventId: input.targetEventId,
        ...(input.reason ? { reason: input.reason.slice(0, 160) } : {})
      };
      const undoSnapshot: UndoSnapshot = {
        undoRequestId: undoRequest.undoRequestId,
        matchId: input.matchId,
        targetEventId: input.targetEventId,
        snapshotId: snapshot.snapshotId,
        requestedBy: input.side,
        status: "requested",
        hiddenInfoSafe: !crossesHiddenInfoBarrier
      };
      record.undoSnapshots.push(undoSnapshot);
      const opponentSide = opposite(input.side);

      if (this.isAiSide(record, opponentSide)) {
        delete record.pendingUndo;
        undoSnapshot.status = "accepted";
        const restored = this.applyAcceptedUndo(record, undoSnapshot);
        if (!restored) return { ok: false, error: safeError("undo_not_available", "Undo ist aktuell nicht möglich."), payload: this.payloadFor(record, input.side) };
        record.match.matchVersion += 1;
        record.match.updatedAt = this.now();
        await this.storage.save(record);
        return {
          ok: true,
          requesterPayload: this.payloadFor(record, input.side),
          opponentPayload: this.payloadFor(record, opponentSide),
          undoRequest
        };
      }

      record.pendingUndo = undoRequest;
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      await this.storage.save(record);
      return {
        ok: true,
        requesterPayload: this.payloadFor(record, input.side),
        opponentPayload: this.payloadFor(record, opponentSide),
        undoRequest
      };
    });
  }

  async acceptUndo(input: { matchId: string; side: Side; sessionToken: string; undoRequestId: string }): Promise<UndoResult> {
    return this.resolveUndo(input, "accepted");
  }

  async declineUndo(input: { matchId: string; side: Side; sessionToken: string; undoRequestId: string }): Promise<UndoResult> {
    return this.resolveUndo(input, "declined");
  }

  async replayMatch(matchId: string): Promise<{ ok: boolean; finalStateHash: string; errors: string[] }> {
    const record = await this.mustLoad(matchId);
    if (!record) return { ok: false, finalStateHash: "", errors: ["Match not found."] };
    if (!record.gameState) return { ok: false, finalStateHash: "", errors: ["Match is not active."] };
    const initial = record.stateSnapshots[0]?.gameState;
    if (!initial) return { ok: false, finalStateHash: hashState(record.gameState), errors: ["Initial snapshot missing."] };
    const replay = replayEvents(initial, record.gameState.eventLog);
    return { ok: replay.ok, finalStateHash: replay.actualFinalStateHash, errors: replay.errors };
  }

  async listReplayIndex(): Promise<ReplayIndexEntry[]> {
    if (!this.storage.list) return [];
    const records = await this.storage.list();
    return records
      .filter((record) => Boolean(record.gameState))
      .map((record) => replayIndexEntryFor(record))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async listOpenMatches(): Promise<OpenMatchListEntry[]> {
    const records = this.storage.listOpenMatchCandidates ? await this.storage.listOpenMatchCandidates() : this.storage.list ? await this.storage.list() : [];
    const nowIso = this.now();
    const nowMs = Date.parse(nowIso);
    return records
      .filter((record) => record.match.mode === "human_vs_human" && record.match.status === "pending" && record.match.discoverableInLan !== false)
      .map((record) => {
        const openJoinToken = this.openJoinToken(record);
        if (!openJoinToken) return undefined;
        const hostDisplayName = record.sessions[0]?.displayName?.trim() || "Teilnehmer A";
        const createdMs = Date.parse(record.match.createdAt);
        const ageSeconds = Number.isFinite(createdMs) && Number.isFinite(nowMs) ? Math.max(0, Math.floor((nowMs - createdMs) / 1000)) : 0;
        return {
          matchId: record.match.matchId,
          hostDisplayName,
          mode: "human_vs_human" as const,
          status: "pending" as const,
          createdAt: record.match.createdAt,
          ageSeconds
        };
      })
      .filter((entry): entry is OpenMatchListEntry => Boolean(entry))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async listRecentGameResults(limit = 20): Promise<RecentGameResultEntry[]> {
    const records = this.storage.list ? await this.storage.list() : [];
    const normalizedLimit = Number.isFinite(limit) ? Math.floor(limit) : 20;
    const cappedLimit = Math.max(1, Math.min(50, normalizedLimit));
    const seriesGroups = new Map<string, StoredMatch[]>();
    const entries: RecentGameResultEntry[] = [];
    for (const record of records.filter((candidate) => candidate.match.status === "finished" && Boolean(candidate.gameState?.winner))) {
      const seriesId = record.match.series?.seriesId;
      if (seriesId) seriesGroups.set(seriesId, [...(seriesGroups.get(seriesId) ?? []), record]);
      else {
        const entry = recentGameResultEntryFor(record);
        if (entry) entries.push(entry);
      }
    }
    for (const group of seriesGroups.values()) {
      const entry = recentSeriesResultEntryFor(group);
      if (entry) entries.push(entry);
    }
    return entries.sort((left, right) => right.finishedAt.localeCompare(left.finishedAt)).slice(0, cappedLimit);
  }

  async loadReplayView(matchId: string, perspective: ReplayPerspective): Promise<{ ok: true; replay: ReplayView } | { ok: false; error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record || !record.gameState) return { ok: false, error: safeError("not_found", "Dieses Replay ist nicht verfügbar.") };
    if (!isReplayPerspective(perspective)) return { ok: false, error: safeError("bad_request", "Die Replay-Perspektive ist ungültig.") };

    const checks = replayStateHashChecks(record);
    const metadata = replayIndexEntryFor(record, checks);
    const publicEvents = replayEventsForPerspective(record, perspective);
    const localAnalysis = perspective === "local_analysis";
    const timeline = publicEvents.map((event, index) =>
      replayTimelineStepFor({
        event,
        index,
        perspective,
        stateHashCheck: checks.byEventId[event.eventId] ?? {
          ok: false,
          expected: event.stateHashAfter,
          reason: "state_hash_check_missing",
          randomDrawCounters: []
        }
      })
    );
    const replay: ReplayView = {
      replayId: metadata.replayId,
      matchId: metadata.matchId,
      perspective,
      metadata,
      timeline,
      replayErrors: checks.errors,
      randomDrawRecords: replayRandomDrawEntries(record),
      exploitSuggestions: replayExploitSuggestions(timeline),
      localAnalysis
    };
    return { ok: true, replay };
  }

  async exportReplay(matchId: string, perspective: ReplayPerspective): Promise<{ ok: true; artifact: ReplayExportArtifact } | { ok: false; error: SafeErrorPayload }> {
    if (perspective === "local_analysis") {
      return { ok: false, error: safeError("bad_request", "Die lokale Analyseperspektive ist nur in der lokalen Replay-Ansicht verfügbar.") };
    }
    const loaded = await this.loadReplayView(matchId, perspective);
    if (!loaded.ok) return loaded;
    return {
      ok: true,
      artifact: {
        version: "1.5.0",
        exportedAt: this.now(),
        baseline: loaded.replay.metadata.baseline,
        perspective,
        replay: loaded.replay
      }
    };
  }

  async loadForTest(matchId: string): Promise<StoredMatch | undefined> {
    return this.storage.load(matchId);
  }

  async storageHealth(): Promise<StorageHealth> {
    if (this.storage.health) return this.storage.health();
    return { ok: true, kind: "memory", legacyImport: "not_applicable" };
  }

  async backupStorageForTest(reason?: BackupManifest["reason"]): Promise<{ backupDir: string; manifest: BackupManifest }> {
    if (!this.storage.backup) throw new Error("storage_backup_unavailable");
    return this.storage.backup(reason);
  }

  async storageMaintenanceSummary(): Promise<StorageMaintenanceSummary | undefined> {
    return this.storage.maintenanceSummary?.();
  }

  async storageMaintenanceMatches(filters?: StorageMaintenanceMatchFilters): Promise<StorageMaintenanceMatchEntry[] | undefined> {
    return this.storage.maintenanceMatches?.(filters);
  }

  async storageMaintenanceMatchDetail(matchId: string): Promise<StorageMaintenanceMatchDetail | undefined> {
    return this.storage.maintenanceMatchDetail?.(matchId);
  }

  async storageMaintenanceAiDecisionTraceMatches(): Promise<StorageMaintenanceAiDecisionTraceMatchEntry[] | undefined> {
    return this.storage.maintenanceAiDecisionTraceMatches?.();
  }

  async storageMaintenanceAiDecisionTraceIndex(matchId: string, filters?: { afterDecisionIndex?: number }): Promise<StorageMaintenanceAiDecisionTraceIndexEntry[] | undefined> {
    return this.storage.maintenanceAiDecisionTraceIndex?.(matchId, filters);
  }

  async storageMaintenanceAiDecisionTraceDetail(traceId: string): Promise<StorageMaintenanceAiDecisionTraceDetail | undefined> {
    return this.storage.maintenanceAiDecisionTraceDetail?.(traceId);
  }

  async enableStorageMaintenanceAiDecisionTrace(matchId: string, mode: Exclude<AiDecisionTraceMode, "off"> = "detailed"): Promise<StorageMaintenanceAiDecisionTraceMatchEntry | undefined> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record) return undefined;
      if (!record.match.aiControllers || Object.keys(record.match.aiControllers).length === 0) throw new Error("ai_trace_match_has_no_ai");
      if (isTerminalStatus(record.match.status)) throw new Error("ai_trace_match_terminal");
      const now = this.now();
      record.match.aiTraceMode = mode;
      record.match.updatedAt = now;
      await this.storage.save(record);
      const matches = await this.storageMaintenanceAiDecisionTraceMatches();
      return (
        matches?.find((match) => match.matchId === matchId) ?? {
          matchId,
          status: record.match.status,
          mode: record.match.mode,
          aiTraceMode: mode,
          traceCount: record.aiDecisionTraces?.length ?? 0,
          createdAt: record.match.createdAt,
          updatedAt: record.match.updatedAt
        }
      );
    });
  }

  async storageMaintenanceCleanupPreview(filters: StorageMaintenanceCleanupFilters): Promise<StorageMaintenanceCleanupPreview | undefined> {
    return this.storage.maintenanceCleanupPreview?.(filters);
  }

  async storageMaintenanceCleanupApply(input: StorageMaintenanceCleanupApplyInput): Promise<StorageMaintenanceCleanupApplyResult | undefined> {
    return this.storage.maintenanceCleanupApply?.(input);
  }

  async storageMaintenanceCleanupPolicy(): Promise<StorageMaintenanceCleanupPolicy | undefined> {
    return this.storage.maintenanceCleanupPolicy?.();
  }

  async setStorageMaintenanceCleanupPolicy(policy: StorageMaintenanceCleanupPolicyInput): Promise<StorageMaintenanceCleanupPolicy | undefined> {
    return this.storage.setMaintenanceCleanupPolicy?.(policy);
  }

  async runStorageMaintenanceCleanupPolicy(): Promise<StorageMaintenanceCleanupPolicyRunResult | undefined> {
    return this.storage.runMaintenanceCleanupPolicy?.();
  }

  async storageMaintenanceCompactSnapshots(): Promise<StorageMaintenanceSnapshotCompactionResult | undefined> {
    return this.storage.maintenanceCompactSnapshots?.();
  }

  async storageMaintenanceSetRetentionProtection(matchId: string, protectedValue: boolean): Promise<StorageMaintenanceMatchDetail | undefined> {
    return this.storage.maintenanceSetRetentionProtection?.(matchId, protectedValue);
  }

  async issueMaintenanceRecoveryAccess(matchId: string, input: { side: Side; displayName?: string }): Promise<MaintenanceRecoveryAccessResult | { error: SafeErrorPayload }> {
    return this.withMatchLock(matchId, async () => {
      const record = await this.mustLoad(matchId);
      if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      if (isTerminalStatus(record.match.status)) return { error: safeError("match_terminal", "Für abgeschlossene Matches wird kein Fortsetzungszugang erstellt.") };
      const session = record.sessions.find((candidate) => candidate.side === input.side);
      if (!session) return { error: safeError("side_unavailable", "Für diese Seite gibt es keine wiederherstellbare Spielersession.") };

      const now = this.now();
      const access = generateToken();
      this.revokeTokenByHash(record, "session", session.sessionTokenHash, now);
      this.revokeTokenByHash(record, "reconnect", session.reconnectTokenHash, now);
      record.sessions = record.sessions.map((candidate) =>
        candidate.sessionId === session.sessionId
          ? {
              ...candidate,
              displayName: input.displayName?.trim() || candidate.displayName,
              reconnectTokenHash: this.hashToken(access),
              connected: false,
              lastSeenAt: now
            }
          : candidate
      );
      record.tokens.push(this.tokenRecord(matchId, input.side, "reconnect", access, now));
      record.match.matchVersion += 1;
      record.match.updatedAt = now;
      await this.storage.save(record);

      return {
        matchId,
        side: input.side,
        access,
        displayName: input.displayName?.trim() || session.displayName,
        webSocketUrl: this.webSocketUrl(),
        matchStatus: record.match.status,
        matchVersion: record.match.matchVersion,
        issuedAt: now
      };
    });
  }

  async setMatchRetentionProtection(input: { matchId: string; side: Side; sessionToken: string; protected: boolean }): Promise<{ ok: true; payload: LobbyPayload | SidePayload } | { ok: false; error: SafeErrorPayload }> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      const now = this.now();
      record.match.retentionProtection = input.protected
        ? {
            protected: true,
            protectedAt: now,
            protectedBySide: input.side
          }
        : { protected: false };
      record.match.updatedAt = now;
      record.match.matchVersion += 1;
      await this.storage.save(record);
      return { ok: true, payload: this.safePayloadFor(record, input.side) };
    });
  }

  closeStorage(): void {
    this.storage.close?.();
  }

  private async resolveUndo(input: { matchId: string; side: Side; sessionToken: string; undoRequestId: string }, status: "accepted" | "declined"): Promise<UndoResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (!record.gameState) return { ok: false, error: safeError("match_not_active", "Undo ist aktuell nicht möglich.") };
      const pending = record.pendingUndo;
      if (!pending || pending.undoRequestId !== input.undoRequestId || pending.requestedBy === input.side) {
        return { ok: false, error: safeError("undo_not_available", "Undo ist aktuell nicht möglich."), payload: this.payloadFor(record, input.side) };
      }
      const undoRecord = record.undoSnapshots.find((candidate) => candidate.undoRequestId === input.undoRequestId);
      if (!undoRecord) {
        delete record.pendingUndo;
        record.match.matchVersion += 1;
        record.match.updatedAt = this.now();
        await this.storage.save(record);
        return { ok: false, error: safeError("undo_not_available", "Undo ist aktuell nicht möglich."), payload: this.payloadFor(record, input.side) };
      }
      undoRecord.status = status;
      delete record.pendingUndo;
      if (status === "accepted") {
        const restored = this.applyAcceptedUndo(record, undoRecord);
        if (!restored) {
          record.match.matchVersion += 1;
          record.match.updatedAt = this.now();
          await this.storage.save(record);
          return { ok: false, error: safeError("undo_not_available", "Undo ist aktuell nicht möglich."), payload: this.payloadFor(record, input.side) };
        }
      }
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      await this.storage.save(record);
      return {
        ok: true,
        requesterPayload: this.payloadFor(record, pending.requestedBy),
        opponentPayload: this.payloadFor(record, opposite(pending.requestedBy))
      };
    });
  }

  private applyAcceptedUndo(record: StoredMatch, undoRecord: UndoSnapshot): boolean {
    const snapshot = record.stateSnapshots.find((candidate) => candidate.snapshotId === undoRecord.snapshotId);
    if (!snapshot) return false;
    const targetIndex = record.eventLog.findIndex((event) => event.eventId === undoRecord.targetEventId);
    const eventLog = record.gameState.eventLog.filter((event) => event.stateVersionAfter <= snapshot.stateVersion);
    record.gameState = { ...clone(snapshot.gameState), eventLog };
    record.eventLog = targetIndex >= 0 ? record.eventLog.slice(0, targetIndex) : record.eventLog;
    const retainedEventIds = new Set(record.eventLog.map((event) => event.eventId));
    if (record.aiDecisionTraces) {
      record.aiDecisionTraces = record.aiDecisionTraces.filter((trace) => retainedEventIds.has(trace.eventId));
    }
    record.actionReceipts = record.actionReceipts.filter((receipt) => receipt.stateVersionAfter <= snapshot.stateVersion);
    record.stateSnapshots = record.stateSnapshots.filter((candidate) => candidate.stateVersion <= snapshot.stateVersion);
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

  private safePayloadFor(record: StoredMatch, side: Side): LobbyPayload | SidePayload {
    return this.shouldUseLobbyPayload(record) ? this.lobbyPayloadFor(record, side) : this.payloadFor(record, side);
  }

  private lifecycleResultFor(record: StoredMatch, actorSide: Side): Extract<LifecycleActionResult, { ok: true }> {
    const opponentSide = opposite(actorSide);
    return {
      ok: true,
      actorPayload: this.safePayloadFor(record, actorSide),
      ...(record.sessions.some((session) => session.side === opponentSide) ? { opponentPayload: this.safePayloadFor(record, opponentSide) } : {})
    };
  }

  private terminalizeLifecycle(record: StoredMatch, status: "cancelled" | "abandoned", reason: "cancel" | "leave", actorSide: Side): void {
    const now = this.now();
    this.clearCountdown(record);
    record.match.status = status;
    delete record.match.winner;
    delete record.pendingUndo;
    record.lifecycleResult = {
      status,
      reason,
      occurredAt: now,
      actorSide
    };
    this.revokeAllTokens(record, now);
    record.match.matchVersion += 1;
    record.match.updatedAt = now;
  }

  private removeJoinerFromOpenLobby(record: StoredMatch, session: SessionRecord): void {
    const now = this.now();
    this.clearCountdown(record);
    this.revokeTokenByHash(record, "session", session.sessionTokenHash, now);
    this.revokeTokenByHash(record, "reconnect", session.reconnectTokenHash, now);
    record.sessions = record.sessions.filter((candidate) => candidate.sessionId !== session.sessionId);
    record.tokens = record.tokens.map((token) => {
      if (token.kind !== "join" || token.allowedSide !== session.side || token.revokedAt) return token;
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

  private recreateInputFor(record: StoredMatch, session: SessionRecord, displayName: string | undefined): Parameters<MultiplayerService["createMatch"]>[0] {
    const participants = participantDeckInputsForRecord(record);
    const requesterPlayer = playerSlotForSession(record, session);
    const opponentPlayer = oppositeSeriesPlayer(requesterPlayer);
    const includeOpponentDecks = record.match.mode !== "human_vs_human" || record.match.status === "finished" || record.match.status === "forfeited";
    const runnerDifficulty = record.match.aiControllers?.runner?.difficulty;
    const corpDifficulty = record.match.aiControllers?.corp?.difficulty;
    return {
      hostSide: session.side,
      mode: record.match.mode,
      displayName: displayName ?? session.displayName,
      settings: record.match.settings,
      ...(record.startLobby?.countdownSeconds ? { countdownSeconds: record.startLobby.countdownSeconds } : {}),
      participantADecks: participants[requesterPlayer],
      ...(includeOpponentDecks ? { participantBDecks: participants[opponentPlayer] } : {}),
      ...(record.match.deckSetup.aiDeckPolicy ? { aiDeckPolicy: record.match.deckSetup.aiDeckPolicy } : {}),
      ...(record.match.aiPacingMode ? { aiPacingMode: record.match.aiPacingMode } : {}),
      ...(typeof record.match.discoverableInLan === "boolean" ? { discoverableInLan: record.match.discoverableInLan } : {}),
      ...(runnerDifficulty ? { runnerDifficulty } : {}),
      ...(corpDifficulty ? { corpDifficulty } : {})
    };
  }

  private activatePendingDeckHandshake(record: StoredMatch, joinerDecks: ParticipantDeckPairInput): void {
    const hostDecks = record.privateDeckSnapshots?.participants?.player_a;
    if (!hostDecks) throw new Error("host_decks_missing");
    const cardPool = normalizeMatchCardPool(record.match.settings.cardPool);
    const joinerPair = resolveParticipantDeckPair(joinerDecks, { cardPool });
    const participants: ResolvedParticipantDeckSetup = {
      player_a: {
        runnerSnapshot: clone(hostDecks.runner),
        corpSnapshot: clone(hostDecks.corp),
        runnerDeck: buildDeckFromSnapshot(hostDecks.runner),
        corpDeck: buildDeckFromSnapshot(hostDecks.corp)
      },
      player_b: joinerPair
    };
    const hostSide = record.sessions[0]?.side ?? "runner";
    const runnerPlayer: SeriesPlayerSlot = hostSide === "runner" ? "player_a" : "player_b";
    const corpPlayer: SeriesPlayerSlot = hostSide === "corp" ? "player_a" : "player_b";
    const deckSetup = deckSetupForParticipants(participants, { runnerPlayer, corpPlayer });
    const baseline = baselineForMode(record.match.mode, deckSetup);
    const matchFormat = normalizeMatchFormat(record.match.settings.matchFormat);
    const agendaPointsToWin = agendaPointsToWinFor(matchFormat, record.match.settings.agendaPointsToWin > 0 ? record.match.settings.agendaPointsToWin : undefined);
    record.gameState = undefined as unknown as GameState;
    record.match.baseline = baseline;
    record.match.status = "ready_check";
    record.match.settings = { ...record.match.settings, agendaPointsToWin, matchFormat, cardPool };
    record.match.playerClock = initialPlayerClockState(normalizePlayerClockConfig(record.match.settings.playerClock));
    record.match.deckSetup = {
      runnerSnapshotId: deckSetup.runnerSnapshot.deckSnapshotId,
      corpSnapshotId: deckSetup.corpSnapshot.deckSnapshotId,
      runner: deckSetup.runnerSnapshot.publicMetadata,
      corp: deckSetup.corpSnapshot.publicMetadata,
      assignment: { runnerPlayer, corpPlayer },
      participants: publicParticipantDeckSetup(participants)
    };
    if (record.match.series) {
      record.match.series.runnerPlayer = runnerPlayer;
      record.match.series.corpPlayer = corpPlayer;
    }
    record.privateDeckSnapshots = {
      runner: clone(deckSetup.runnerSnapshot),
      corp: clone(deckSetup.corpSnapshot),
      participants: privateParticipantDeckSetup(participants)
    };
    record.startLobby = {
      hostReady: false,
      joinerReady: false,
      countdownSeconds: record.startLobby?.countdownSeconds ?? 3,
      agendaPointsToWin,
      matchFormat,
      cardPool,
      sideAssignmentMode: record.startLobby?.sideAssignmentMode ?? "fixed",
      sideAssignment: { runnerPlayer, corpPlayer },
      chatMessages: record.startLobby?.chatMessages ?? []
    };
    record.eventLog = [];
    record.stateSnapshots = [];
  }

  private syncPlayerClock(record: StoredMatch, nowIso = this.now()): boolean {
    const clock = record.match.playerClock;
    if (!clock || record.match.status !== "active" || !record.gameState || record.gameState.winner || (clock.mode === "player_clock" && clock.expiredSide)) return false;
    const nowMs = Date.parse(nowIso);
    if (!Number.isFinite(nowMs)) return false;
    const owner = this.playerClockDecisionOwner(record);
    if (!owner) {
      delete clock.activity;
      return false;
    }
    const key = this.playerClockActivityKey(record, owner);
    if (!clock.activity || clock.activity.key !== key || clock.activity.decisionOwnerSide !== owner) {
      clock.activity = { key, decisionOwnerSide: owner, startedAtMs: nowMs, chargedMs: 0 };
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
    const chargeableMs = Math.max(0, elapsedMs - clock.gracePeriodMs - clock.activity.chargedMs);
    if (chargeableMs <= 0) return false;
    clock.remainingMs[owner] = Math.max(0, clock.remainingMs[owner] - chargeableMs);
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
    if (pendingChoiceSide === "runner" || pendingChoiceSide === "corp") return pendingChoiceSide;
    if (runnerActions.length > 0 && record.gameState.activeSide === "runner") return "runner";
    if (corpActions.length > 0 && record.gameState.activeSide === "corp") return "corp";
    return undefined;
  }

  private playerClockActivityKey(record: StoredMatch, owner: Side): string {
    const state = record.gameState;
    const actions = state ? getLegalActions(state, owner).map((action) => action.actionId).sort().join(",") : "";
    const choice = state?.pendingChoice ? `${state.pendingChoice.choiceId}:${state.pendingChoice.side}:${state.pendingChoice.stateVersion}` : "none";
    return [state?.stateVersion ?? "no_state", owner, state?.phase ?? "unknown", state?.timingPoint ?? "unknown", choice, actions].join("|");
  }

  private terminalizeTimeExpired(record: StoredMatch, expiredSide: Side, nowIso: string): void {
    if (!record.gameState || record.match.status !== "active") return;
    const winnerSide = opposite(expiredSide);
    const finalEngineStateHash = hashState(record.gameState);
    record.match.status = "finished";
    record.match.winner = winnerSide;
    record.match.matchVersion += 1;
    record.match.updatedAt = nowIso;
    if (record.match.playerClock?.mode === "player_clock") record.match.playerClock.expiredSide = expiredSide;
    record.lifecycleResult = {
      status: "finished",
      reason: "time_expired",
      occurredAt: nowIso,
      actorSide: expiredSide,
      winnerSide,
      loserSide: expiredSide,
      finalEngineStateHash
    };
    delete record.pendingUndo;
    record.eventLog.push(timeExpiredEventRecord(record, expiredSide, winnerSide, nowIso, finalEngineStateHash));
    this.revokeAllTokens(record, nowIso);
  }

  private playerClockSnapshotFor(record: StoredMatch, nowIso = this.now()): ApiPlayerClockSnapshot | undefined {
    const clock = record.match.playerClock;
    if (!clock) return undefined;
    const nowMs = Date.parse(nowIso);
    const activity = clock.activity;
    const elapsedActivityMs = activity && Number.isFinite(nowMs) ? Math.max(0, nowMs - activity.startedAtMs) : undefined;
    const decisionOwnerSide = activity?.decisionOwnerSide;
    if (clock.mode === "none") {
      const effectiveConsumed = { ...clock.consumedMs };
      if (decisionOwnerSide && elapsedActivityMs !== undefined && activity) {
        effectiveConsumed[decisionOwnerSide] += Math.max(0, elapsedActivityMs - activity.chargedMs);
      }
      return {
        schemaVersion: "player-clock-v1",
        mode: "none",
        consumedMs: effectiveConsumed,
        ...(decisionOwnerSide ? { decisionOwnerSide } : {}),
        ...(activity ? { activityStartedAtMs: activity.startedAtMs } : {}),
        ...(elapsedActivityMs !== undefined ? { elapsedActivityMs } : {}),
        warningLevel: "none"
      };
    }
    const chargeableElapsedMs = activity && elapsedActivityMs !== undefined ? Math.max(0, elapsedActivityMs - clock.gracePeriodMs) : undefined;
    const graceRemainingMs = activity && elapsedActivityMs !== undefined ? Math.max(0, clock.gracePeriodMs - elapsedActivityMs) : undefined;
    const effectiveRemaining = { ...clock.remainingMs };
    if (decisionOwnerSide && chargeableElapsedMs !== undefined && activity) {
      effectiveRemaining[decisionOwnerSide] = Math.max(0, effectiveRemaining[decisionOwnerSide] - Math.max(0, chargeableElapsedMs - activity.chargedMs));
    }
    const activeRemaining = decisionOwnerSide ? effectiveRemaining[decisionOwnerSide] : undefined;
    const criticalThresholdMs = Math.min(60_000, clock.startingTimeMs);
    const warningLevel: ApiPlayerClockSnapshot["warningLevel"] = clock.expiredSide
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
      ...(clock.expiredSide ? { expiredSide: clock.expiredSide } : {})
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
    const opponent = record.sessions.find((session) => session.side === opposite(side));
    const playerClockSnapshot = this.playerClockSnapshotFor(record);
    return {
      matchId: record.match.matchId,
      matchStatus: record.match.status,
      matchVersion: record.match.matchVersion,
      side,
      eventTail: [],
      opponentStatus: {
        side: opposite(side),
        connected: opponent?.connected ?? false,
        ...(this.safeDisplayNameFor(record, opposite(side)) ? { displayName: this.safeDisplayNameFor(record, opposite(side))! } : {})
      },
      ...(record.lifecycleResult ? { lifecycleResult: record.lifecycleResult } : {}),
      ...(playerClockSnapshot ? { playerClock: playerClockSnapshot } : {}),
      ...retentionProtectionPayload(record),
      ...((record.match.status === "pending" && !record.gameState) || record.match.status === "waiting_for_joiner_decks"
        ? {
            pendingDeckHandshake: {
              required: true,
              message: "Die Lobby wartet auf die Deckauswahl von Teilnehmer B."
            }
          }
        : {}),
      ...(lobby && record.match.status !== "waiting_for_joiner_decks" ? { startLobby: this.publicStartLobbyFor(record, lobby) } : {})
    };
  }

  private publicStartLobbyFor(record: StoredMatch, lobby: MatchStartLobbyState): MatchStartLobbyPayload {
    return {
      hostReady: lobby.hostReady,
      joinerReady: lobby.joinerReady,
      countdownSeconds: lobby.countdownSeconds,
      ...(lobby.countdownStartedAt ? { countdownStartedAt: lobby.countdownStartedAt } : {}),
      ...(lobby.countdownEndsAt ? { countdownEndsAt: lobby.countdownEndsAt } : {}),
      agendaPointsToWin: lobby.agendaPointsToWin,
      matchFormat: lobby.matchFormat,
      cardPool: lobby.cardPool,
      ...(lobby.sideAssignmentMode ? { sideAssignmentMode: lobby.sideAssignmentMode } : {}),
      sideAssignment: { ...lobby.sideAssignment },
      participants: {
        player_a: this.publicLobbyParticipantFor(record, lobby, "player_a"),
        player_b: this.publicLobbyParticipantFor(record, lobby, "player_b")
      },
      chatMessages: lobby.chatMessages.map((message) => ({ ...message }))
    };
  }

  private publicLobbyParticipantFor(record: StoredMatch, lobby: MatchStartLobbyState, player: SeriesPlayerSlot): LobbyParticipantPayload {
    const side = sideForSeriesPlayer(lobby.sideAssignment, player);
    const session = record.sessions.find((candidate) => candidate.side === side);
    const decks = record.privateDeckSnapshots?.participants?.[player];
    const hasParticipantSession = Boolean(session);
    const hideSide = lobby.sideAssignmentMode === "random_pending";
    return {
      displayName: session?.displayName ?? (player === "player_a" ? "Teilnehmer A" : "Teilnehmer B"),
      ...(hideSide ? {} : { side }),
      runnerDeckReady: hasParticipantSession && Boolean(decks?.runner),
      corpDeckReady: hasParticipantSession && Boolean(decks?.corp),
      connected: session?.connected ?? false,
      connectionQuality: connectionQualityFor(session, this.now()),
      ready: player === "player_a" ? lobby.hostReady : lobby.joinerReady
    };
  }

  private safeDisplayNameFor(record: StoredMatch, side: Side): string | undefined {
    const session = record.sessions.find((candidate) => candidate.side === side);
    if (session?.displayName) return session.displayName;
    const controller = record.match.aiControllers?.[side];
    if (controller?.displayName) return controller.displayName;
    return undefined;
  }

  private lobbyResultFor(record: StoredMatch, actorSide: Side, activated = false): Extract<LobbyActionResult, { ok: true }> {
    const actorPayload = activated || record.match.status === "active" ? this.payloadFor(record, actorSide) : this.lobbyPayloadFor(record, actorSide);
    const opponentSide = opposite(actorSide);
    const opponentPayload = record.sessions.some((session) => session.side === opponentSide)
      ? activated || record.match.status === "active"
        ? this.payloadFor(record, opponentSide)
        : this.lobbyPayloadFor(record, opponentSide)
      : undefined;
    return {
      ok: true,
      actorPayload,
      ...(opponentPayload ? { opponentPayload } : {}),
      ...(activated ? { activated: true } : {})
    };
  }

  private setReadyFlagForSession(record: StoredMatch, session: SessionRecord, ready: boolean): void {
    if (!record.startLobby) return;
    const player = playerSlotForSession(record, session);
    if (player === "player_a") record.startLobby.hostReady = ready;
    else record.startLobby.joinerReady = ready;
  }

  private cancelCountdownFor(record: StoredMatch, side: Side): void {
    const session = record.sessions.find((candidate) => candidate.side === side);
    if (session) this.setReadyFlagForSession(record, session, false);
    this.clearCountdown(record);
  }

  private clearCountdown(record: StoredMatch): void {
    if (!record.startLobby) return;
    delete record.startLobby.countdownStartedAt;
    delete record.startLobby.countdownEndsAt;
    if (!record.gameState && record.match.status === "countdown") record.match.status = "ready_check";
  }

  private startLobbyCountdown(record: StoredMatch): void {
    if (!record.startLobby) return;
    const startedAt = this.now();
    const endsAt = new Date(new Date(startedAt).getTime() + record.startLobby.countdownSeconds * 1000).toISOString();
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
        corpDeck: buildDeckFromSnapshot(participants.player_a.corp)
      },
      player_b: {
        runnerSnapshot: clone(participants.player_b.runner),
        corpSnapshot: clone(participants.player_b.corp),
        runnerDeck: buildDeckFromSnapshot(participants.player_b.runner),
        corpDeck: buildDeckFromSnapshot(participants.player_b.corp)
      }
    };
    const hostSide = record.sessions[0]?.side ?? "runner";
    const deckSetup = deckSetupForParticipants(resolved, lobby.sideAssignment);
    const baseline = baselineForMode(record.match.mode, deckSetup);
    const controllers = controllersForMode(record.match.mode, hostSide, { runnerDifficulty: "normal", corpDifficulty: "normal" });
    const gameState = createGame({
      matchId: record.match.matchId,
      seed: record.match.seed ?? record.match.matchId,
      baseline,
      agendaPointsToWin: lobby.agendaPointsToWin,
      controllers,
      runnerDeck: deckSetup.runnerDeck,
      corpDeck: deckSetup.corpDeck,
      runnerDeckMetadata: deckSetup.runnerSnapshot.publicMetadata,
      corpDeckMetadata: deckSetup.corpSnapshot.publicMetadata
    });
    record.gameState = gameState;
    record.match.status = "active";
    record.match.baseline = baseline;
    record.match.settings = { ...record.match.settings, agendaPointsToWin: lobby.agendaPointsToWin, matchFormat: lobby.matchFormat, cardPool: lobby.cardPool };
    record.eventLog = gameState.eventLog.map((event) => toEventRecord(record.match.matchId, event, false));
    record.stateSnapshots = [this.snapshotFor(record.match.matchId, gameState, record.match.matchVersion, "snap_initial", false)];
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
    const finalStateHash = record.lifecycleResult?.finalEngineStateHash ?? hashState(state);
    if (!series.results.some((result) => result.matchId === record.match.matchId)) {
      const runnerAgendaPoints = getPlayerView(state, "runner").own.agendaPoints;
      const corpAgendaPoints = getPlayerView(state, "corp").own.agendaPoints;
      const lifecycleReason = record.lifecycleResult?.reason;
      const reason: GameResultReason =
        lifecycleReason === "forfeit" || lifecycleReason === "time_expired"
          ? lifecycleReason
          : resultReason(state, winner, runnerAgendaPoints, corpAgendaPoints, record.match.settings.agendaPointsToWin);
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
        finalStateHash
      });
    }
    series.status = series.results.length >= series.gamesPlanned ? "finished" : "between_games";
  }

  private maybeRunAiAfterTransition(record: StoredMatch): void {
    for (let count = 0; count < 4 && record.match.status === "active" && record.gameState?.pendingChoice?.source === "setup.mulligan" && this.aiControllableSide(record); count += 1) {
      if (!this.runAiStep(record).ok) return;
    }
    if (record.match.aiPacingMode === "fast") this.runAiUntilNextHuman(record);
  }

  private runAiUntilNextHuman(record: StoredMatch): AiStepResult {
    let state = record.gameState;
    if (!state) return { ok: false, code: "ai_no_action" };
    let lastResult: AiStepResult = { ok: false, code: "ai_no_action" };
    for (let count = 0; count < 40 && record.match.status === "active" && !state.winner && this.aiControllableSide(record); count += 1) {
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
    if (!state || record.match.status !== "active" || state.winner || !this.aiControllableSide(record)) return { ok: false, code: "ai_no_action" };
    const side = selectAiDecisionSideForState(state).side;
    if (!side) return { ok: false, code: "ai_no_action" };
    if (!this.isAiSide(record, side)) return { ok: false, code: "ai_no_action" };
    const legalActions = getLegalActions(state, side);
    if (legalActions.length === 0) return { ok: false, code: "ai_no_action" };
    const controller = record.match.aiControllers?.[side];
    const ownDeckSnapshot = record.privateDeckSnapshots?.[side];
    const input = buildAiDecisionInput(state, side, {
      difficulty: controller?.difficulty ?? "normal",
      profileId: controller?.profileId ?? `${side}-server-ai-v0.9-${controller?.difficulty ?? "normal"}`,
      decisionId: `${record.match.matchId}:${state.stateVersion}:${side}`,
      actionNumber: state.stateVersion,
      ...(ownDeckSnapshot ? { ownDeckSnapshot } : {})
    });
    const decision = this.chooseAiAction(input);
    const legalAction = legalActionForAiDecision(decision, legalActions);
    if (!legalAction) return { ok: false, code: "ai_decision_action_not_legal" };
    const snapshot = this.snapshotFor(record.match.matchId, state, record.match.matchVersion, `snap_before_${state.stateVersion + 1}`, false);
    const result = applyAction(
      state,
      {
        matchId: record.match.matchId,
        side,
        actionId: legalAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(decision.selectedChoices ? { selectedChoices: decision.selectedChoices } : {}),
        idempotencyKey: `ai-${side}-${state.stateVersion}`
      },
      { publicEventsMode: "latest" }
    );
    if (!result.ok) return { ok: false, code: "ai_no_action" };
    const event: GameEvent = {
      ...result.event,
      publicPayload: {
        ...result.event.publicPayload,
        aiReasonCode: decision.reasonCode,
        aiExplanation: decision.explanation,
        ...(decision.decisionDebug ? { aiDecisionDebug: replayDecisionDebug(decision.decisionDebug, side) } : {}),
        ...(decision.fallbackUsed ? { aiFallbackUsed: true } : {}),
        ...(decision.timeoutUsed ? { aiTimeoutUsed: true } : {}),
        ...(typeof decision.confidence === "number" ? { aiConfidence: decision.confidence } : {})
      }
    };
    const barrier = isHiddenInfoBarrier(event);
    record.stateSnapshots.push({ ...snapshot, hiddenInfoBarrier: barrier });
    const occurredAt = this.now();
    const trace = aiDecisionTraceFor(record, event, side, legalAction, decision, normalizeAiDecisionTraceMode(record.match.aiTraceMode), occurredAt);
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

  private aiTurnPresentationFor(record: StoredMatch, side: Side): AiTurnPresentationState | undefined {
    if (!record.gameState || !record.match.aiControllers) return undefined;
    if (record.match.status !== "active") {
      return {
        canAdvanceAi: false,
        pacingMode: record.match.aiPacingMode ?? "fast"
      };
    }
    const activeAiSide = this.aiControllableSide(record);
    return {
      ...(activeAiSide ? { activeAiSide } : {}),
      canAdvanceAi: Boolean(record.match.status === "active" && activeAiSide && !this.isAiSide(record, side) && !record.gameState.winner),
      pacingMode: record.match.aiPacingMode ?? "fast"
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

  private async mustLoad(matchId: string, options?: { includeStateSnapshots?: boolean }): Promise<StoredMatch | undefined> {
    return this.storage.load(matchId, options);
  }

  private authenticate(record: StoredMatch, side: Side, sessionToken: string): SessionRecord | undefined {
    const hash = this.hashToken(sessionToken);
    const token = record.tokens.find((candidate) => candidate.kind === "session" && candidate.tokenHash === hash && !candidate.revokedAt);
    if (!token) return undefined;
    return record.sessions.find((session) => session.side === side && session.sessionTokenHash === hash);
  }

  private authenticateForRecreate(record: StoredMatch, side: Side, sessionToken: string): SessionRecord | undefined {
    const active = this.authenticate(record, side, sessionToken);
    if (active) return active;
    if (!isTerminalStatus(record.match.status)) return undefined;
    const hash = this.hashToken(sessionToken);
    return record.sessions.find((session) => session.side === side && session.sessionTokenHash === hash);
  }

  private findToken(record: StoredMatch, token: string, kind: TokenKind): TokenRecord | undefined {
    const hash = this.hashToken(token);
    return record.tokens.find((candidate) => candidate.kind === kind && candidate.tokenHash === hash && !candidate.revokedAt && !candidate.usedAt);
  }

  private resolveJoinTokenForJoinInput(record: StoredMatch, token: string | undefined): TokenRecord | undefined {
    const candidate = token?.trim();
    if (candidate) return this.findToken(record, candidate, "join");
    if (record.match.mode !== "human_vs_human" || record.match.status !== "pending" || record.match.discoverableInLan === false) return undefined;
    return this.openJoinToken(record);
  }

  private openJoinToken(record: StoredMatch): TokenRecord | undefined {
    return record.tokens.find(
      (candidate) => candidate.kind === "join" && !candidate.revokedAt && !candidate.usedAt && !record.sessions.some((session) => session.side === candidate.allowedSide)
    );
  }

  private revokeAllTokens(record: StoredMatch, now: string): void {
    record.tokens = record.tokens.map((token) => (token.revokedAt ? token : { ...token, revokedAt: now }));
  }

  private revokeTokenByHash(record: StoredMatch, kind: TokenKind, tokenHash: string, now: string): void {
    record.tokens = record.tokens.map((token) => (token.kind === kind && token.tokenHash === tokenHash && !token.revokedAt ? { ...token, revokedAt: now } : token));
  }

  private tokenRecord(matchId: string, side: Side, kind: TokenKind, token: string, now: string): TokenRecord {
    return {
      tokenId: randomId("token"),
      matchId,
      kind,
      allowedSide: side,
      tokenHash: this.hashToken(token),
      createdAt: now
    };
  }

  private hashToken(token: string): string {
    return `sha256:${createHash("sha256").update(`${this.tokenSalt}:${token}`).digest("hex")}`;
  }

  private receiptFor(record: StoredMatch, side: Side, idempotencyKey: string, accepted: boolean, errorCode?: string): ActionReceipt {
    if (!record.gameState) throw new Error("match_not_active");
    return {
      idempotencyKey,
      matchId: record.match.matchId,
      side,
      accepted,
      stateVersionBefore: record.gameState.stateVersion,
      stateVersionAfter: record.gameState.stateVersion,
      stateHashAfter: hashState(record.gameState),
      ...(errorCode ? { errorCode } : {})
    };
  }

  private snapshotFor(matchId: string, gameState: GameState, matchVersion: number, snapshotId: string, hiddenInfoBarrier: boolean): StateSnapshot {
    return {
      snapshotId,
      matchId,
      stateVersion: gameState.stateVersion,
      matchVersion,
      stateHash: hashState(gameState),
      gameState: cloneGameStateWithoutEventLog(gameState),
      createdAt: this.now(),
      hiddenInfoBarrier
    };
  }

  private webSocketUrl(): string {
    return `${this.serverBaseUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:")}/ws`;
  }

  private async withMatchLock<T>(matchId: string, work: () => Promise<T>): Promise<T> {
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

function retentionProtectionPayload(record: StoredMatch): { retentionProtected: boolean; retentionProtectedAt?: string } {
  if (record.match.retentionProtection?.protected !== true) return { retentionProtected: false };
  return {
    retentionProtected: true,
    ...(record.match.retentionProtection.protectedAt ? { retentionProtectedAt: record.match.retentionProtection.protectedAt } : {})
  };
}

function isTerminalStatus(status: MatchStatus): boolean {
  return status === "cancelled" || status === "abandoned" || status === "forfeited" || status === "finished";
}

function isSeriesGameCompleteForNext(record: StoredMatch): boolean {
  if (!record.gameState) return false;
  if (record.match.status === "finished" && Boolean(record.gameState.winner)) return true;
  return record.match.status === "forfeited" && record.lifecycleResult?.reason === "forfeit" && Boolean(record.lifecycleResult.winnerSide);
}

function isCancellableLobbyStatus(status: MatchStatus): boolean {
  return status === "pending" || status === "waiting_for_runner" || status === "waiting_for_corp" || status === "waiting_for_joiner_decks" || status === "ready_check" || status === "countdown";
}

function isHostSession(record: StoredMatch, session: SessionRecord): boolean {
  return record.sessions[0]?.sessionId === session.sessionId;
}

function normalizeMatchFormat(matchFormat: MatchFormat | undefined): MatchFormat {
  if (matchFormat === "two_game_side_swap") return "two_game_side_swap";
  return "rules_match";
}

function normalizeMatchCardPool(cardPool: MatchCardPool | undefined): MatchCardPool {
  if (cardPool === "originalset_classic" || cardPool === "originalset_proteus" || cardPool === "originalset_classic_proteus") return cardPool;
  return "originalset";
}

function normalizePlayerClockConfig(config: ApiPlayerClockConfig | undefined): ApiPlayerClockConfig {
  if (!config || config.mode !== "player_clock") return { mode: "none" };
  const startingTimeMs = boundedWholeNumber(config.startingTimeMs, 5 * 60_000, 60_000, 120 * 60_000);
  const gracePeriodMs = boundedWholeNumber(config.gracePeriodMs, 10_000, 0, 60_000);
  return { mode: "player_clock", startingTimeMs, gracePeriodMs };
}

function normalizeAiDecisionTraceMode(value: unknown): AiDecisionTraceMode {
  return value === "summary" || value === "detailed" ? value : "off";
}

function initialPlayerClockState(config: ApiPlayerClockConfig): PlayerClockState {
  if (config.mode !== "player_clock") {
    return {
      mode: "none",
      consumedMs: { runner: 0, corp: 0 }
    };
  }
  return {
    mode: "player_clock",
    startingTimeMs: config.startingTimeMs ?? 5 * 60_000,
    gracePeriodMs: config.gracePeriodMs ?? 10_000,
    remainingMs: { runner: config.startingTimeMs ?? 5 * 60_000, corp: config.startingTimeMs ?? 5 * 60_000 },
    consumedMs: { runner: 0, corp: 0 }
  };
}

function timeExpiredEventRecord(record: StoredMatch, expiredSide: Side, winnerSide: Side, occurredAt: string, finalStateHash: string): EventRecord {
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
      label: `${expiredSide === "runner" ? "Runner" : "Korp"} verliert durch Zeitablauf.`
    }
  };
  return {
    eventId: event.eventId,
    matchId: record.match.matchId,
    stateVersionBefore: stateVersion,
    stateVersionAfter: stateVersion,
    stateHashAfter: finalStateHash,
    publicPayload: event,
    privatePayloadLocalOnly: false,
    hiddenInfoBarrier: false
  };
}

function boundedWholeNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function agendaPointsToWinFor(_matchFormat: MatchFormat, explicit: number | undefined): number {
  if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);
  return RULE_AGENDA_POINTS_TO_WIN;
}

function normalizeCountdownSeconds(value: number | undefined): 3 | 5 | 10 {
  return value === 5 || value === 10 ? value : 3;
}

function sideForSeriesPlayer(assignment: MatchStartLobbyState["sideAssignment"], player: SeriesPlayerSlot): Side {
  return assignment.runnerPlayer === player ? "runner" : "corp";
}

function playerSlotForSession(record: StoredMatch, session: SessionRecord): SeriesPlayerSlot {
  return record.sessions[0]?.sessionId === session.sessionId ? "player_a" : "player_b";
}

function connectionQualityFor(session: SessionRecord | undefined, now: string): ConnectionQuality {
  if (!session?.connected) return "offline";
  const age = new Date(now).getTime() - new Date(session.lastSeenAt).getTime();
  if (Number.isFinite(age) && age > 30_000) return "unstable";
  return "online";
}

function toEventRecord(matchId: string, event: GameEvent, barrier: boolean): EventRecord {
  return projectEngineEventToServerRecord(matchId, event, barrier);
}

function replayIndexEntryFor(
  record: StoredMatch,
  checks?: ReturnType<typeof replayStateHashChecks>
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
    participantNames: names
  };
}

function legalActionForAiDecision(decision: AiDecision, legalActions: readonly LegalAction[]): LegalAction | undefined {
  if (!decision.actionId) return undefined;
  return legalActions.find((candidate) => candidate.actionId === decision.actionId);
}

function participantNamesForReplay(record: StoredMatch): ReplayIndexEntry["participantNames"] {
  const bySide: ReplayIndexEntry["participantNames"] = {};
  for (const session of record.sessions) {
    if (session.side === "runner" && !bySide.runner) bySide.runner = session.displayName;
    if (session.side === "corp" && !bySide.corp) bySide.corp = session.displayName;
  }
  return bySide;
}

function replayEventsForPerspective(record: StoredMatch, perspective: ReplayPerspective): PublicGameEvent[] {
  return projectReplayEventsForPerspective(record.eventLog, perspective);
}

function replayStateHashChecks(record: StoredMatch): {
  byEventId: Record<string, ReplayStateHashCheck & { randomDrawCounters: number[] }>;
  errors: string[];
} {
  const byEventId: Record<string, ReplayStateHashCheck & { randomDrawCounters: number[] }> = {};
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
          randomDrawCounters: []
        };
        if (!ok) errors.push(`state_hash_mismatch:${event.eventId}`);
        continue;
      }
      byEventId[event.eventId] = {
        ok: false,
        expected: event.stateHashAfter,
        reason: "missing_replay_action",
        randomDrawCounters: []
      };
      errors.push(`missing_replay_action:${event.eventId}`);
      continue;
    }

    const beforeRandomCounter = replayState.randomCounter;
    const result = applyAction(replayState, replayAction);
    if (!result.ok) {
      byEventId[event.eventId] = {
        ok: false,
        expected: event.stateHashAfter,
        reason: result.error.code,
        randomDrawCounters: []
      };
      errors.push(`replay_failed:${event.eventId}:${result.error.code}`);
      continue;
    }

    const counters: number[] = [];
    for (let counter = beforeRandomCounter; counter < result.state.randomCounter; counter += 1) counters.push(counter);
    const ok = result.stateHash === event.stateHashAfter;
    byEventId[event.eventId] = {
      ok,
      expected: event.stateHashAfter,
      actual: result.stateHash,
      ...(ok ? {} : { reason: "state_hash_mismatch" }),
      randomDrawCounters: counters
    };
    if (!ok) errors.push(`state_hash_mismatch:${event.eventId}`);
    replayState = result.state;
  }

  return { byEventId, errors };
}

function replayActionFromEvent(event: GameEvent): PlayerAction | undefined {
  const payload = event.privatePayload;
  if (!payload || typeof payload !== "object") return undefined;
  for (const side of ["runner", "corp"] as const) {
    const local = payload[side];
    if (!local || typeof local !== "object" || !("action" in local)) continue;
    const action = (local as { action?: unknown }).action;
    if (!action || typeof action !== "object") continue;
    const candidate = action as Partial<PlayerAction>;
    if (candidate.side !== "runner" && candidate.side !== "corp") continue;
    if (typeof candidate.matchId !== "string" || typeof candidate.actionId !== "string" || typeof candidate.clientKnownStateVersion !== "number") continue;
    if (typeof candidate.idempotencyKey !== "string") continue;
    return candidate as PlayerAction;
  }
  return undefined;
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
  const decisionDebug = replayDecisionDebugForPerspective(event.publicPayload.aiDecisionDebug, actor, input.perspective);
  return {
    eventId: event.eventId,
    index: input.index,
    ...(actor ? { side: actor } : {}),
    actionType,
    timingPoint: stringValue(event.publicPayload.timingPoint) ?? "unknown",
    label,
    ...(stringValue(event.publicPayload.serverLabel) ? { serverLabel: stringValue(event.publicPayload.serverLabel)! } : {}),
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    stateHashCheck,
    visibilityClass: event.visibilityClass ?? "public",
    hiddenInfoBarrier: event.visibilityClass === "hidden_info_barrier",
    randomDrawCounters: stateHashCheck.randomDrawCounters,
    eventFamily: replayEventFamily(actionType, event.publicPayload),
    learningHint: replayLearningHint(actionType, event.publicPayload),
    ...(decisionDebug ? { decisionDebug } : {})
  };
}

function replayDecisionDebugForPerspective(debug: unknown, actor: Side | undefined, perspective: ReplayPerspective): Record<string, unknown> | undefined {
  if (!debug || typeof debug !== "object" || Array.isArray(debug)) return undefined;
  if (perspective !== "local_analysis" && actor && perspective !== actor) {
    return { schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION, redacted: true, reason: "side_private_ai_debug" };
  }
  return replayDecisionDebug(debug, actor);
}

function replayDecisionDebug(debug: unknown, actor: Side | undefined): Record<string, unknown> | undefined {
  const safeDebug = sanitizeAiDecisionDebug(debug);
  if (!safeDebug) return undefined;
  const result: Record<string, unknown> = {};
  result.schemaVersion = safeDebug.schemaVersion;
  result.aiLevel = safeDebug.aiLevel;
  if (typeof safeDebug.summary === "string") result.summary = safeDebug.summary;
  if (typeof safeDebug.planKind === "string") result.planKind = safeDebug.planKind;
  if (typeof safeDebug.memoryVersion === "string") result.memoryVersion = safeDebug.memoryVersion;
  if (Array.isArray(safeDebug.rankedAlternatives)) result.rankedAlternatives = safeDebug.rankedAlternatives.slice(0, 24);
  if (Array.isArray(safeDebug.actionAlternatives)) result.actionAlternatives = safeDebug.actionAlternatives.slice(0, 32);
  if (Array.isArray(safeDebug.scoreBreakdown)) result.scoreBreakdown = safeDebug.scoreBreakdown.slice(0, 16);
  if (Array.isArray(safeDebug.whyNot)) result.whyNot = safeDebug.whyNot.slice(0, 8);
  if (Array.isArray(safeDebug.longTermPlan)) result.longTermPlan = safeDebug.longTermPlan.slice(0, 8);
  if (Array.isArray(safeDebug.warnings)) result.warnings = safeDebug.warnings.slice(0, 8);
  if (Array.isArray(safeDebug.detailSections)) result.detailSections = safeDebug.detailSections.slice(0, 8);
  if (Array.isArray(safeDebug.facts)) result.facts = safeDebug.facts.slice(0, 8);
  if (Array.isArray(safeDebug.hypotheses)) result.hypotheses = safeDebug.hypotheses.slice(0, 8);
  if (Array.isArray(safeDebug.uncertainty)) result.uncertainty = safeDebug.uncertainty.slice(0, 8);
  if (typeof safeDebug.fallbackUsed === "boolean") result.fallbackUsed = safeDebug.fallbackUsed;
  if (typeof safeDebug.timeoutUsed === "boolean") result.timeoutUsed = safeDebug.timeoutUsed;
  if (typeof safeDebug.confidence === "number") result.confidence = safeDebug.confidence;
  if (actor) result.actor = actor;
  return result;
}

function aiDecisionTraceFor(record: StoredMatch, event: GameEvent, side: Side, legalAction: LegalAction, decision: AiDecision, mode: AiDecisionTraceMode, createdAt: string): AiDecisionTraceRecord | undefined {
  if (mode === "off" || !decision.decisionDebug) return undefined;
  const safeDebug = sanitizeAiDecisionDebug(decision.decisionDebug);
  if (!safeDebug) return undefined;
  const traceJson = aiDecisionTraceJson(safeDebug, side, legalAction, mode);
  const decisionIndex = (record.aiDecisionTraces?.length ?? 0) + 1;
  const selectedActionType = legalAction.type;
  const planKind = typeof traceJson.planKind === "string" ? traceJson.planKind : undefined;
  const score = typeof traceJson.score === "number" ? traceJson.score : undefined;
  const confidence = typeof traceJson.confidence === "number" ? traceJson.confidence : undefined;
  return {
    traceId: `ai_trace_${record.match.matchId}_${decisionIndex}`,
    matchId: record.match.matchId,
    eventId: event.eventId,
    stateVersion: event.stateVersionBefore,
    matchVersion: record.match.matchVersion,
    side,
    turn: event.stateVersionBefore,
    decisionIndex,
    selectedActionId: decision.actionId,
    selectedActionType,
    ...(planKind ? { planKind } : {}),
    ...(score !== undefined ? { score } : {}),
    ...(confidence !== undefined ? { confidence } : {}),
    createdAt,
    schemaVersion: "ai-decision-trace-v1",
    traceJson
  };
}

function aiDecisionTraceJson(debug: AiDecisionDebug, actor: Side, legalAction: LegalAction, mode: Exclude<AiDecisionTraceMode, "off">): Record<string, unknown> {
  const debugSelectedActionType = typeof debug.selectedActionType === "string" ? debug.selectedActionType : undefined;
  const result: Record<string, unknown> = {
    schemaVersion: "ai-decision-trace-v1",
    debugSchemaVersion: debug.schemaVersion,
    actor,
    aiLevel: debug.aiLevel,
    selectedActionId: legalAction.actionId,
    selectedActionType: legalAction.type,
    debugSelectionMatchesApplied: debugSelectedActionType === undefined || debugSelectedActionType === legalAction.type
  };
  if (debugSelectedActionType !== undefined && debugSelectedActionType !== legalAction.type) {
    result.debugSelectedActionType = debugSelectedActionType;
  }
  for (const field of ["summary", "planId", "planKind", "profileId", "memoryVersion"] as const) {
    const value = debug[field];
    if (typeof value === "string") result[field] = value;
  }
  for (const field of ["score", "confidence", "timeBudgetMs", "doctrinePlanWeight"] as const) {
    const value = debug[field];
    if (typeof value === "number" && Number.isFinite(value)) result[field] = value;
  }
  for (const field of ["fallbackUsed", "timeoutUsed"] as const) {
    const value = debug[field];
    if (typeof value === "boolean") result[field] = value;
  }
  for (const field of ["visibleReasons", "whyNot", "longTermPlan", "warnings", "uncertainty"] as const) {
    const value = debug[field];
    if (Array.isArray(value)) result[field] = value.slice(0, 8);
  }
  if (Array.isArray(debug.rankedAlternatives)) result.rankedAlternatives = debug.rankedAlternatives.slice(0, mode === "summary" ? 6 : 24);
  if (Array.isArray(debug.actionAlternatives)) result.actionAlternatives = debug.actionAlternatives.slice(0, 32);
  if (Array.isArray(debug.scoreBreakdown)) result.scoreBreakdown = debug.scoreBreakdown.slice(0, 16);
  if (mode === "detailed") {
    for (const field of ["facts", "hypotheses", "invalidations", "beliefUncertainty", "evidence"] as const) {
      const value = debug[field];
      if (Array.isArray(value)) result[field] = value.slice(0, 12);
    }
    if (Array.isArray(debug.detailSections)) result.detailSections = debug.detailSections.slice(0, 8);
    if (debug.opponentModel) result.opponentModel = debug.opponentModel;
    if (debug.ownDeckDoctrine) result.ownDeckDoctrine = debug.ownDeckDoctrine;
  }
  return result;
}

function minimalAiPreviewDetail(actor: Side, legalAction: LegalAction, decision: AiDecision): Record<string, unknown> {
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
        whyChosen: ["selected_action"]
      }
    ],
    scoreBreakdown: []
  };
}

function withAiPrivateHandPreview(detail: Record<string, unknown>, input: AiDecisionInput): Record<string, unknown> {
  return {
    ...detail,
    aiPrivateHandPreview: aiPrivateHandPreview(input)
  };
}

function aiPrivateHandPreview(input: AiDecisionInput): Record<string, unknown> {
  const legalActionsBySource = new Map<string, LegalAction[]>();
  for (const action of input.legalActions) {
    const source = typeof action.source === "string" ? action.source : "";
    if (!source || source === "basic_action" || source === "game_rule") continue;
    const actions = legalActionsBySource.get(source) ?? [];
    actions.push(action);
    legalActionsBySource.set(source, actions);
  }
  return {
    schemaVersion: "ai-private-hand-preview-v1",
    visibility: "preview_only_not_persisted",
    side: input.side,
    credits: input.playerView.own.credits,
    handCount: input.playerView.own.gripOrHq.length,
    cards: input.playerView.own.gripOrHq.slice(0, 12).map((card, index) =>
      aiPrivateHandCardPreview(card, index, input.playerView.own.credits, legalActionsBySource.get(card.instanceId) ?? []),
    )
  };
}

function aiPrivateHandCardPreview(card: VisibleCard, index: number, credits: number, legalActions: LegalAction[]): Record<string, unknown> {
  const playCost = aiPrivateHandCardCost(card);
  const missingCredits = playCost === undefined ? undefined : Math.max(0, playCost - credits);
  const rulesText = aiPrivateHandCardRulesText(card);
  return {
    index,
    instanceId: card.instanceId,
    definitionId: card.definitionId ?? "",
    title: card.title ?? card.definitionId ?? "Unbekannte Karte",
    type: card.type ?? "unknown",
    ...(rulesText ? { rulesText } : {}),
    ...(card.subtypes && card.subtypes.length > 0 ? { subtypes: card.subtypes.slice(0, 4) } : {}),
    ...(playCost !== undefined ? { playCost } : {}),
    ...(missingCredits !== undefined ? { missingCredits } : {}),
    availability:
      legalActions.length > 0
        ? "legal_now"
        : missingCredits !== undefined && missingCredits > 0
          ? "missing_credits"
          : "not_legal_now",
    legalActions: legalActions.slice(0, 4).map((action) => ({
      actionId: action.actionId,
      actionType: action.type,
      label: action.label,
      creditCost: actionCreditCost(action)
    }))
  };
}

function aiPrivateHandCardRulesText(card: VisibleCard): string | undefined {
  const rulesText =
    card.rulesText ??
    (card.definitionId ? DEMO_CARDS_BY_ID[card.definitionId]?.rulesText : undefined);
  if (typeof rulesText !== "string") return undefined;
  const normalized = rulesText.trim();
  return normalized.length > 0 ? normalized.slice(0, 1200) : undefined;
}

function aiPrivateHandCardCost(card: VisibleCard): number | undefined {
  if (typeof card.installCost === "number") return card.installCost;
  if (typeof card.cost === "number") return card.cost;
  return undefined;
}

function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0);
}

function replayRandomDrawEntries(record: StoredMatch): ReplayRandomDrawEntry[] {
  return record.gameState.randomDrawRecords.map((entry) => ({
    counter: entry.counter,
    purpose: entry.purpose,
    valueHash: `fnv1a:${fnv1a(String(entry.value))}`
  }));
}

function replayExploitSuggestions(timeline: ReplayTimelineStep[]): ReplayExploitSuggestion[] {
  const suggestions: ReplayExploitSuggestion[] = [];
  const lastRunnerRunByServer = new Map<string, number>();
  for (let index = 0; index < timeline.length; index += 1) {
    const current = timeline[index];
    if (!current) continue;
    if (current.side === "runner" && current.actionType === "start_run" && isRdLabel(current.serverLabel)) {
      const lastRunIndex = current.serverLabel ? lastRunnerRunByServer.get(current.serverLabel) : undefined;
      if (lastRunIndex !== undefined) {
        let corpInterruption = false;
        for (let stepIndex = lastRunIndex + 1; stepIndex < index; stepIndex += 1) {
          if (timeline[stepIndex]?.side === "corp") {
            corpInterruption = true;
            break;
          }
        }
        if (!corpInterruption) {
          suggestions.push({
            candidateId: `candidate:${current.eventId}:repeat_rd`,
            eventId: current.eventId,
            reason: "Mehrfacher R&D-Run ohne sichtbare Zwischenänderung prüfen.",
            status: "review_suggestion"
          });
        }
      }
      if (current.serverLabel) lastRunnerRunByServer.set(current.serverLabel, index);
    }
    if (current.decisionDebug && current.decisionDebug.fallbackUsed === true) {
      suggestions.push({
        candidateId: `candidate:${current.eventId}:fallback`,
        eventId: current.eventId,
        reason: "KI-Fallback in kritischem Timingfenster prüfen.",
        status: "review_suggestion"
      });
    }
  }
  return dedupeReplaySuggestions(suggestions);
}

function dedupeReplaySuggestions(items: ReplayExploitSuggestion[]): ReplayExploitSuggestion[] {
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

function replayEventFamily(actionType: string, payload: Record<string, unknown>): string {
  if (payload.traceStarted === true || typeof payload.traceStep === "string" || typeof payload.traceSuccessful === "boolean") return "trace_and_tags";
  if (payload.replacementWindowOpened === true || typeof payload.replacementDecision === "string" || typeof payload.eventModificationDecision === "string") return "replacement_and_prevention";
  if (payload.damageResolved === true || typeof payload.damageType === "string" || typeof payload.flatline === "boolean") return "damage_and_survival";
  if (typeof payload.specialZone === "string" || typeof payload.controlChange === "string") return "special_zones_and_control";
  if (actionType === "mandatory_draw" || actionType === "draw_card" || actionType === "gain_credit" || actionType === "end_turn") return "turn_and_economy";
  if (actionType === "start_run" || actionType === "continue_run" || actionType === "jack_out" || actionType === "break_subroutine" || actionType === "pump_breaker" || actionType === "access_card" || actionType === "trash_accessed_card" || actionType === "decline_trash") return "run_and_access";
  if (actionType === "score_agenda" || actionType === "steal_agenda") return "agenda";
  if (actionType === "resolve_choice") return "choice";
  if (actionType === "trash_resource" || actionType === "remove_tag" || actionType === "purge_virus_counters") return "tags_and_board";
  if (actionType.includes("set_aside") || actionType.includes("removed_from_game") || actionType.includes("change_card_control")) return "special_zones_and_control";
  if (actionType.includes("damage") || actionType.includes("flatline")) return "damage_and_survival";
  if (actionType.includes("trace") || actionType.includes("tag")) return "trace_and_tags";
  if (actionType.includes("replacement") || actionType.includes("prevention")) return "replacement_and_prevention";
  return "general";
}

function replayLearningHint(actionType: string, payload: Record<string, unknown>): string {
  const family = replayEventFamily(actionType, payload);
  if (family === "trace_and_tags") return "Trace- und Tag-Schritte zeigen nur legale Bids und sichtbare Folgen pro Perspektive.";
  if (family === "replacement_and_prevention") return "Replacement-/Prevention-Fenster erklären nur legale Optionen und Ergebnisse.";
  if (family === "damage_and_survival") return "Damage-Folgen bleiben side-sicher; verdeckte Karten bleiben redigiert.";
  if (family === "special_zones_and_control") return "Special-Zone- und Kontrollwechsel-Hinweise bleiben abstrakt und leak-frei.";
  if (actionType === "start_run") return "Run-Entscheidungen bleiben legal-action-basiert und side-sicher.";
  if (actionType === "access_card" || actionType === "steal_agenda" || actionType === "trash_accessed_card") return "Access-Folgen nur aus sichtbaren Access-Fakten und LegalActions ableiten.";
  if (actionType === "resolve_choice") return "Choices im Replay zeigen nur erlaubte Optionen der jeweiligen Perspektive.";
  if (actionType === "mandatory_draw" || actionType === "draw_card") return "Kartenzug-Hinweise erklären Reihenfolge und Timing ohne Kartennamen-Leaks.";
  if (actionType === "score_agenda") return "Scoring-Fenster sind regelautoritativ aus der Engine; Replay erklärt nur den Ablauf.";
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

function resultSummaryFor(record: StoredMatch, viewerSide: Side, finalStateHash: string): GameResultSummary | undefined {
  const state = record.gameState;
  const winner = record.lifecycleResult?.winnerSide ?? (record.match.status === "forfeited" ? record.lifecycleResult?.winnerSide : state?.winner);
  if (!winner) return undefined;
  const runnerAgendaPoints = getPlayerView(state, "runner").own.agendaPoints;
  const corpAgendaPoints = getPlayerView(state, "corp").own.agendaPoints;
  const actionEvents = record.eventLog.filter((event) => event.publicPayload.type !== "game_created");
  const countType = (type: string) => actionEvents.filter((event) => event.publicPayload.type === type).length;
  return {
    winner,
    ...(record.lifecycleResult?.winnerSide ? { winnerSide: record.lifecycleResult.winnerSide } : {}),
    ...(record.lifecycleResult?.loserSide ? { loserSide: record.lifecycleResult.loserSide } : {}),
    viewerOutcome: winner === "draw" ? "draw" : winner === viewerSide ? "won" : "lost",
    reason: record.lifecycleResult?.reason === "forfeit" || record.lifecycleResult?.reason === "time_expired" ? record.lifecycleResult.reason : resultReason(state, winner, runnerAgendaPoints, corpAgendaPoints, record.match.settings.agendaPointsToWin),
    matchFormat: record.match.settings.matchFormat,
    agendaPointsToWin: record.match.settings.agendaPointsToWin,
    runnerAgendaPoints,
    corpAgendaPoints,
    actionCount: actionEvents.length,
    runCount: countType("start_run"),
    successfulRunCount: countType("access_card"),
    stolenAgendaCount: countType("steal_agenda"),
    scoredAgendaCount: countType("score_agenda"),
    startedAt: record.match.createdAt,
    finishedAt: record.match.updatedAt,
    finalStateHash,
    ...(record.lifecycleResult?.finalEngineStateHash ? { finalEngineStateHash: record.lifecycleResult.finalEngineStateHash } : {}),
    ...(record.match.series ? { series: seriesSummaryFor(record, viewerSide) } : {})
  };
}

function recentGameResultEntryFor(record: StoredMatch): RecentGameResultEntry | undefined {
  const state = record.gameState;
  const winner = state?.winner;
  if (!state || !winner || record.match.status !== "finished") return undefined;
  const runnerAgendaPoints = getPlayerView(state, "runner").own.agendaPoints;
  const corpAgendaPoints = getPlayerView(state, "corp").own.agendaPoints;
  const actionEvents = record.eventLog.filter((event) => event.publicPayload.type !== "game_created");
  const finalStateHash = record.lifecycleResult?.finalEngineStateHash ?? hashState(state);
  const runnerMatchPoints = singleGameMatchPointsFor(winner, "runner", runnerAgendaPoints);
  const corpMatchPoints = singleGameMatchPointsFor(winner, "corp", corpAgendaPoints);
  return {
    entryType: "single_game",
    resultId: `match:${record.match.matchId}`,
    matchId: record.match.matchId,
    matchStatus: "finished",
    matchMode: record.match.mode,
    matchFormat: record.match.settings.matchFormat,
    finishedAt: record.match.updatedAt,
    startedAt: record.match.createdAt,
    winner,
    ...(winner === "runner" || winner === "corp" ? { winnerSide: winner } : {}),
    reason: resultReason(state, winner, runnerAgendaPoints, corpAgendaPoints, record.match.settings.agendaPointsToWin),
    runner: {
      displayName: publicDisplayNameForSide(record, "runner"),
      agendaPoints: runnerAgendaPoints,
      matchPoints: runnerMatchPoints,
      ...(record.match.deckSetup.runner.deckName ? { deckName: record.match.deckSetup.runner.deckName } : {})
    },
    corp: {
      displayName: publicDisplayNameForSide(record, "corp"),
      agendaPoints: corpAgendaPoints,
      matchPoints: corpMatchPoints,
      ...(record.match.deckSetup.corp.deckName ? { deckName: record.match.deckSetup.corp.deckName } : {})
    },
    actionCount: actionEvents.length,
    runCount: actionEvents.filter((event) => event.publicPayload.type === "start_run").length,
    finalStateHash,
    ...(record.match.series
      ? {
          series: {
            seriesId: record.match.series.seriesId,
            gameNumber: record.match.series.gameNumber,
            gamesPlanned: record.match.series.gamesPlanned,
            status: record.match.series.status
          }
        }
      : {})
  };
}

function recentSeriesResultEntryFor(records: StoredMatch[]): ApiRecentSeriesResult | undefined {
  const latestRecord = records.slice().sort((left, right) => right.match.updatedAt.localeCompare(left.match.updatedAt))[0];
  const latestSeries = latestRecord?.match.series;
  if (!latestRecord || !latestSeries) return undefined;
  const resultsByMatchId = new Map<string, SeriesGameResult>();
  for (const record of records) {
    for (const result of record.match.series?.results ?? []) resultsByMatchId.set(result.matchId, result);
  }
  const games = [...resultsByMatchId.values()].sort((left, right) => left.gameNumber - right.gameNumber || left.finishedAt.localeCompare(right.finishedAt));
  if (games.length === 0) return undefined;
  const playerStats: ApiRecentSeriesResult["players"] = {
    player_a: { displayName: publicDisplayNameForSeriesPlayer(latestRecord, "player_a"), matchPoints: 0, agendaPoints: 0, wins: 0 },
    player_b: { displayName: publicDisplayNameForSeriesPlayer(latestRecord, "player_b"), matchPoints: 0, agendaPoints: 0, wins: 0 }
  };
  const gameEntries: ApiRecentSeriesGameResult[] = games.map((result) => {
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
      finalStateHash: result.finalStateHash
    };
  });
  const outcome = playerStats.player_a.matchPoints > playerStats.player_b.matchPoints ? "player_a" : playerStats.player_b.matchPoints > playerStats.player_a.matchPoints ? "player_b" : "draw";
  const finishedAt = gameEntries.reduce((latest, game) => game.finishedAt > latest ? game.finishedAt : latest, latestRecord.match.updatedAt);
  const startedAt = records.reduce((earliest, record) => record.match.createdAt < earliest ? record.match.createdAt : earliest, latestRecord.match.createdAt);
  return {
    entryType: "series",
    resultId: `series:${latestSeries.seriesId}`,
    seriesId: latestSeries.seriesId,
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
    games: gameEntries
  };
}

function singleGameMatchPointsFor(winner: Winner, side: Side, agendaPoints: number): number {
  if (winner === "draw") return agendaPoints;
  return winner === side ? SERIES_WIN_MATCH_POINTS : agendaPoints;
}

function publicDisplayNameForSeriesPlayer(record: StoredMatch, player: SeriesPlayerSlot): string {
  const series = record.match.series;
  if (!series) return player === "player_a" ? "Spieler A" : "Spieler B";
  if (series.runnerPlayer === player) return publicDisplayNameForSide(record, "runner");
  if (series.corpPlayer === player) return publicDisplayNameForSide(record, "corp");
  return player === "player_a" ? "Spieler A" : "Spieler B";
}

function publicDisplayNameForSide(record: StoredMatch, side: Side): string {
  const sessionName = record.sessions.find((session) => session.side === side)?.displayName?.trim();
  if (sessionName) return sessionName;
  const aiSide = aiSideForMode(record.match.mode);
  if (aiSide === side) return side === "runner" ? "Runner-KI" : "Korp-KI";
  return side === "runner" ? "Runner" : "Korp";
}

function aiSideForMode(mode: MatchMode): Side | undefined {
  if (mode === "human_runner_vs_corp_ai") return "corp";
  if (mode === "human_corp_vs_runner_ai") return "runner";
  return undefined;
}

function seriesSummaryFor(record: StoredMatch, viewerSide: Side): SeriesResultSummary {
  const series = record.match.series;
  if (!series) throw new Error("series_missing");
  const viewerPlayer = seriesPlayerForSide(series, viewerSide);
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
  const seriesDecision = seriesDecisionFor(matchPoints[viewerPlayer], matchPoints[opponentPlayer]);
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
    ...(series.nextMatchId ? { nextMatchId: series.nextMatchId } : {})
  };
}

function seriesDecisionFor(
  viewerMatchPoints: number,
  opponentMatchPoints: number
): { outcome: "won" | "lost" | "draw"; decision: "match_points" | "draw" } {
  if (viewerMatchPoints > opponentMatchPoints) return { outcome: "won", decision: "match_points" };
  if (viewerMatchPoints < opponentMatchPoints) return { outcome: "lost", decision: "match_points" };
  return { outcome: "draw", decision: "draw" };
}

function seriesMatchPointsFor(result: SeriesGameResult, player: SeriesPlayerSlot): number {
  const side = player === result.runnerPlayer ? "runner" : "corp";
  const agendaPoints = side === "runner" ? result.runnerAgendaPoints : result.corpAgendaPoints;
  if (result.winner === "draw") return agendaPoints;
  return winningSeriesPlayer(result) === player ? SERIES_WIN_MATCH_POINTS : agendaPoints;
}

function winningSeriesPlayer(result: SeriesGameResult): SeriesPlayerSlot | "draw" {
  if (result.winner === "draw") return "draw";
  return result.winner === "runner" ? result.runnerPlayer : result.corpPlayer;
}

function seriesPlayerForSide(series: MatchSeriesState, side: Side): SeriesPlayerSlot {
  return side === "runner" ? series.runnerPlayer : series.corpPlayer;
}

function oppositeSeriesPlayer(player: SeriesPlayerSlot): SeriesPlayerSlot {
  return player === "player_a" ? "player_b" : "player_a";
}

function publicParticipantDeckSetup(participants: ResolvedParticipantDeckSetup): NonNullable<MatchRecord["deckSetup"]["participants"]> {
  return {
    player_a: publicParticipantDeckPair(participants.player_a),
    player_b: publicParticipantDeckPair(participants.player_b)
  };
}

function publicParticipantDeckPair(pair: ResolvedParticipantDeckPair): NonNullable<MatchRecord["deckSetup"]["participants"]>[SeriesPlayerSlot] {
  return {
    runnerSnapshotId: pair.runnerSnapshot.deckSnapshotId,
    corpSnapshotId: pair.corpSnapshot.deckSnapshotId,
    runner: pair.runnerSnapshot.publicMetadata,
    corp: pair.corpSnapshot.publicMetadata
  };
}

function privateParticipantDeckSetup(participants: ResolvedParticipantDeckSetup): NonNullable<NonNullable<StoredMatch["privateDeckSnapshots"]>["participants"]> {
  return {
    player_a: { runner: clone(participants.player_a.runnerSnapshot), corp: clone(participants.player_a.corpSnapshot) },
    player_b: { runner: clone(participants.player_b.runnerSnapshot), corp: clone(participants.player_b.corpSnapshot) }
  };
}

function buildDeckFromSnapshot(snapshot: DeckSnapshot): ReturnType<typeof buildEngineDeck> {
  return buildEngineDeck(snapshot);
}

function legacyParticipantDeckPair(input: MatchDeckSelectionInput): ParticipantDeckPairInput {
  return {
    ...(input.runnerDeckSnapshotId ? { runnerDeckSnapshotId: input.runnerDeckSnapshotId } : {}),
    ...(input.corpDeckSnapshotId ? { corpDeckSnapshotId: input.corpDeckSnapshotId } : {}),
    ...(input.runnerDeckSnapshot ? { runnerDeckSnapshot: input.runnerDeckSnapshot } : {}),
    ...(input.corpDeckSnapshot ? { corpDeckSnapshot: input.corpDeckSnapshot } : {})
  };
}

function deckErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : String(error);
  if (code === "deck_snapshot_wrong_side") return "Das gewählte Deck hat die falsche Seite.";
  if (code === "deck_snapshot_not_validated" || code === "deck_snapshot_invalid") return "Das gewählte Deck ist nicht matchstartfähig. Bitte prüfe die Validierungsfehler.";
  if (code === "deck_snapshot_card_pool_mismatch") return "Das gewählte Deck passt nicht zum Kartenpool dieses Spiels.";
  if (code === "ai_deck_snapshot_not_supported") return "Das gewählte KI-Deck ist nicht KI-freigegeben. Bitte nutze feste Standard-Decks, deterministisch zufällige KI-Decks oder ein KI-sicheres Snapshot-Deck.";
  if (code === "deck_snapshot_needs_revalidation") return "Das gewählte Deck muss nach der aktuellen Formatversion neu validiert werden.";
  if (code === "deck_snapshot_not_found") return "Das gewählte Deck wurde nicht gefunden.";
  return "Die gewählten Decks sind nicht matchstartfähig.";
}

function participantDeckInputsForRecord(record: StoredMatch): Record<SeriesPlayerSlot, ParticipantDeckPairInput> {
  const participants = record.privateDeckSnapshots?.participants;
  if (participants?.player_a && participants.player_b) {
    return {
      player_a: { runnerDeckSnapshot: clone(participants.player_a.runner), corpDeckSnapshot: clone(participants.player_a.corp) },
      player_b: { runnerDeckSnapshot: clone(participants.player_b.runner), corpDeckSnapshot: clone(participants.player_b.corp) }
    };
  }
  const fallbackRunner = record.privateDeckSnapshots?.runner;
  const fallbackCorp = record.privateDeckSnapshots?.corp;
  if (fallbackRunner && fallbackCorp) {
    return {
      player_a: { runnerDeckSnapshot: clone(fallbackRunner), corpDeckSnapshot: clone(fallbackCorp) },
      player_b: { runnerDeckSnapshot: clone(fallbackRunner), corpDeckSnapshot: clone(fallbackCorp) }
    };
  }
  return {
    player_a: { runnerDeckSnapshotId: record.match.deckSetup.runnerSnapshotId, corpDeckSnapshotId: record.match.deckSetup.corpSnapshotId },
    player_b: { runnerDeckSnapshotId: record.match.deckSetup.runnerSnapshotId, corpDeckSnapshotId: record.match.deckSetup.corpSnapshotId }
  };
}

function resultReason(state: GameState, winner: Side | "draw", runnerAgendaPoints: number, corpAgendaPoints: number, agendaPointsToWin: number): GameResultReason {
  if (winner === "draw") return "draw";
  if (state.gameEndReason === "bad_publicity_7") return "bad_publicity_7";
  if (state.gameEndReason === "agenda_points") return "agenda_points";
  if (state.gameEndReason === "corp_deck_empty") return "corp_deck_empty";
  if (state.gameEndReason === "flatline") return "flatline";
  if (runnerAgendaPoints >= agendaPointsToWin || corpAgendaPoints >= agendaPointsToWin) return "agenda_points";
  return "unknown";
}

function safeError(code: string, message: string, state?: GameState, side?: Side): SafeErrorPayload {
  return {
    code,
    message,
    ...(state ? { currentStateVersion: state.stateVersion } : {}),
    ...(state && side ? { playerView: getPlayerView(state, side) } : {})
  };
}

function opposite(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function nextModeForSideSwap(mode: MatchMode): MatchMode {
  if (mode === "human_runner_vs_corp_ai") return "human_corp_vs_runner_ai";
  if (mode === "human_corp_vs_runner_ai") return "human_runner_vs_corp_ai";
  return "human_vs_human";
}

function aiPlayerForMode(mode: MatchMode): SeriesPlayerSlot | undefined {
  return mode === "human_vs_human" ? undefined : "player_b";
}

function deterministicHostSide(seed: string): Side {
  const value = createHash("sha256").update(seed).digest()[0] ?? 0;
  return value % 2 === 0 ? "runner" : "corp";
}

function baselineForMode(_mode: MatchMode, _deckSetup: ResolvedDeckSetup): RulesBaseline {
  return CURRENT_RULES_BASELINE;
}

function controllersForMode(
  mode: MatchMode,
  hostSide: Side,
  difficulties: { runnerDifficulty: AiDifficulty; corpDifficulty: AiDifficulty }
): { runner: PlayerController; corp: PlayerController } {
  if (mode === "human_runner_vs_corp_ai") {
    return {
      runner: { controllerId: "runner-human", side: "runner", type: "human_remote", displayName: "Runner" },
      corp: { controllerId: "corp-ai", side: "corp", type: "ai", displayName: "Korp KI", difficulty: difficulties.corpDifficulty, profileId: `corp-ai-v0.9-${difficulties.corpDifficulty}` }
    };
  }
  if (mode === "human_corp_vs_runner_ai") {
    return {
      runner: { controllerId: "runner-ai", side: "runner", type: "ai", displayName: "Runner KI", difficulty: difficulties.runnerDifficulty, profileId: `runner-ai-v0.9-${difficulties.runnerDifficulty}` },
      corp: { controllerId: "corp-human", side: "corp", type: "human_remote", displayName: "Korp" }
    };
  }
  return {
    runner: { controllerId: hostSide === "runner" ? "runner-host" : "runner-guest", side: "runner", type: "human_remote", displayName: "Runner" },
    corp: { controllerId: hostSide === "corp" ? "corp-host" : "corp-guest", side: "corp", type: "human_remote", displayName: "Korp" }
  };
}

function aiControllersFor(controllers: { runner: PlayerController; corp: PlayerController }): Partial<Record<Side, PlayerController>> {
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

function cloneGameStateWithoutEventLog(gameState: GameState): GameState {
  return {
    ...clone({ ...gameState, eventLog: [] }),
    eventLog: []
  };
}

function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
