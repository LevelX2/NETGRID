import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { buildAiDecisionInput, chooseAiAction } from "@netgrid/ai";
import { buildEngineDeck, type DeckSnapshot } from "@netgrid/decks";
import { applyAction, createGame, getLegalActions, getPlayerView, hashState, isHiddenInfoBarrierEvent, redactPublicEventForSide, replayEvents } from "@netgrid/engine";
import {
  MVP_0_2_BASELINE,
  MVP_0_3_BASELINE,
  MVP_0_4_BASELINE,
  MVP_0_94_BASELINE,
  MVP_0_8_BASELINE,
  type AiDifficulty,
  type DeckPublicMetadata,
  type GameEvent,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type PlayerController,
  type PlayerView,
  type PublicGameEvent,
  type RulesBaseline,
  type Side
} from "@netgrid/shared";
import {
  deckSetupForParticipants,
  resolveParticipantDeckSetup,
  resolveParticipantDeckPair,
  setupUsesExpandedRules,
  setupUsesMvp08Rules,
  type AiDeckPolicy,
  type MatchDeckSelectionInput,
  type ParticipantDeckPairInput,
  type ResolvedDeckSetup,
  type ResolvedParticipantDeckPair,
  type ResolvedParticipantDeckSetup
} from "./deck-setup";
import { envValue, LOCAL_DEFAULT_SERVER_BASE_URL, LOCAL_DEFAULT_TOKEN_SALT, LOCAL_DEFAULT_WEB_BASE_URL } from "./internet-hardening";
import type { BackupManifest, StorageHealth } from "./storage-sqlite";

export type MatchStatus =
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
export type HostSideSelection = Side | "random";
export type MatchMode = "human_vs_human" | "human_runner_vs_corp_ai" | "human_corp_vs_runner_ai";
export type MatchFormat = "single_game" | "rules_match" | "two_game_side_swap";
export type AiPacingMode = "fast" | "paced" | "manual";
export type TokenKind = "join" | "session" | "reconnect";
export type UndoStatus = "requested" | "accepted" | "declined" | "blocked";
export type SeriesPlayerSlot = "player_a" | "player_b";
export type SeriesStatus = "active" | "between_games" | "finished";
export type ConnectionQuality = "online" | "unstable" | "offline";

export type MatchSettings = {
  agendaPointsToWin: number;
  matchFormat: MatchFormat;
};

const RULE_AGENDA_POINTS_TO_WIN = 7;

export type GameResultReason = "agenda_points" | "corp_deck_empty" | "flatline" | "draw" | "forfeit" | "unknown";

export type SeriesGameResult = {
  matchId: string;
  gameNumber: number;
  winner: Side | "draw";
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

export type SeriesResultSummary = {
  seriesId: string;
  mode: "two_game_side_swap";
  status: SeriesStatus;
  gameNumber: number;
  gamesPlanned: number;
  viewerPlayer: SeriesPlayerSlot;
  viewerWins: number;
  opponentWins: number;
  draws: number;
  viewerAgendaPoints: number;
  opponentAgendaPoints: number;
  viewerSeriesOutcome: "won" | "lost" | "draw";
  seriesDecision: "wins" | "agenda_points" | "draw";
  nextAvailable: boolean;
  nextMatchId?: string;
};

export type GameResultSummary = {
  winner: Side | "draw";
  winnerSide?: Side;
  loserSide?: Side;
  viewerOutcome: "won" | "lost" | "draw";
  reason: GameResultReason;
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

export type LifecycleResultSummary = {
  status: Extract<MatchStatus, "cancelled" | "abandoned" | "forfeited">;
  reason: "cancel" | "leave" | "forfeit";
  occurredAt: string;
  actorSide: Side;
  winnerSide?: Side;
  loserSide?: Side;
  finalEngineStateHash?: string;
};

export type LobbyParticipantPayload = {
  displayName: string;
  side?: Side;
  runnerDeckReady: boolean;
  corpDeckReady: boolean;
  connected: boolean;
  connectionQuality: ConnectionQuality;
  ready: boolean;
};

export type LobbyChatMessage = {
  id: number;
  side: Side;
  displayName: string;
  sentAt: string;
  text: string;
};

export type MatchStartLobbyState = {
  hostReady: boolean;
  joinerReady: boolean;
  countdownSeconds: 3 | 5 | 10;
  countdownStartedAt?: string;
  countdownEndsAt?: string;
  agendaPointsToWin: number;
  matchFormat: MatchFormat;
  sideAssignment: {
    runnerPlayer: SeriesPlayerSlot;
    corpPlayer: SeriesPlayerSlot;
  };
  chatMessages: LobbyChatMessage[];
};

export type MatchStartLobbyPayload = {
  hostReady: boolean;
  joinerReady: boolean;
  countdownSeconds: 3 | 5 | 10;
  countdownStartedAt?: string;
  countdownEndsAt?: string;
  agendaPointsToWin: number;
  matchFormat: MatchFormat;
  sideAssignment: MatchStartLobbyState["sideAssignment"];
  participants: Record<SeriesPlayerSlot, LobbyParticipantPayload>;
  chatMessages: LobbyChatMessage[];
};

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
  series?: MatchSeriesState;
  createdAt: string;
  updatedAt: string;
  winner?: Side | "draw";
};

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

export type EventRecord = {
  eventId: string;
  matchId: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  stateHashAfter: string;
  publicPayload: PublicGameEvent;
  privatePayloadLocalOnly: boolean;
  hiddenInfoBarrier: boolean;
};

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

export type PendingUndoRequest = {
  undoRequestId: string;
  requestedBy: Side;
  targetEventId: string;
  reason?: string;
};

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
  pendingUndo?: PendingUndoRequest;
};

export type MultiplayerStorage = {
  load(matchId: string): Promise<StoredMatch | undefined>;
  save(record: StoredMatch): Promise<void>;
  list?(): Promise<StoredMatch[]>;
  health?(): Promise<StorageHealth>;
  backup?(reason?: BackupManifest["reason"]): Promise<{ backupDir: string; manifest: BackupManifest }>;
  close?(): void;
};

export type SidePayload = {
  matchId: string;
  matchStatus: MatchStatus;
  matchVersion: number;
  side: Side;
  playerView: PlayerView;
  legalActions: LegalAction[];
  eventTail: PublicGameEvent[];
  opponentStatus: { side: Side; connected: boolean; displayName?: string };
  pendingChoice?: PlayerView["pendingChoice"];
  pendingUndo?: PendingUndoRequest & { needsResponse: boolean };
  aiTurnPresentation?: AiTurnPresentationState;
  winner?: Side | "draw";
  finalStateHash?: string;
  resultSummary?: GameResultSummary;
  lifecycleResult?: LifecycleResultSummary;
};

export type AiTurnPresentationState = {
  activeAiSide?: Side;
  canAdvanceAi: boolean;
  pacingMode: AiPacingMode;
};

export type LobbyPayload = {
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
  startLobby?: MatchStartLobbyPayload;
};

export type ServicePayload = SidePayload | LobbyPayload;

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
  aiTurnPresentation?: AiTurnPresentationState;
  winner?: Side | "draw";
  finalStateHash?: string;
  resultSummary?: GameResultSummary;
};

export type ReconnectResult = JoinMatchResult & {
  eventTail: PublicGameEvent[];
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

export class InMemoryMatchStorage implements MultiplayerStorage {
  private readonly records = new Map<string, StoredMatch>();

  async load(matchId: string): Promise<StoredMatch | undefined> {
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

  async load(matchId: string): Promise<StoredMatch | undefined> {
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
  private readonly now: () => string;

  constructor(
    private readonly storage: MultiplayerStorage = new InMemoryMatchStorage(),
    options: { tokenSalt?: string; publicWebBaseUrl?: string; publicServerBaseUrl?: string; now?: () => string } = {}
  ) {
    this.tokenSalt = options.tokenSalt ?? envValue(process.env, "NETGRID_TOKEN_SALT", "NETRUNNER_TOKEN_SALT") ?? LOCAL_DEFAULT_TOKEN_SALT;
    this.webBaseUrl = trimTrailingSlash(options.publicWebBaseUrl ?? envValue(process.env, "NETGRID_WEB_BASE_URL", "NETRUNNER_WEB_BASE_URL") ?? LOCAL_DEFAULT_WEB_BASE_URL);
    this.serverBaseUrl = trimTrailingSlash(options.publicServerBaseUrl ?? envValue(process.env, "NETGRID_SERVER_BASE_URL", "NETRUNNER_SERVER_BASE_URL") ?? LOCAL_DEFAULT_SERVER_BASE_URL);
    this.now = options.now ?? (() => new Date().toISOString());
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
    const now = this.now();
    const hostSessionToken = generateToken();
    const hostReconnectToken = generateToken();
    const joinToken = mode === "human_vs_human" ? generateToken() : undefined;
    const matchFormat = normalizeMatchFormat(input.settings?.matchFormat);
    const countdownSeconds = normalizeCountdownSeconds(input.countdownSeconds);
    const pendingDeckHandshake = mode === "human_vs_human" && Boolean(input.participantADecks) && !input.participantBDecks;
    if (pendingDeckHandshake) {
      const hostDeckPair = resolveParticipantDeckPair(input.participantADecks ?? legacyParticipantDeckPair(input));
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
          baseline: MVP_0_2_BASELINE,
          settings: {
            agendaPointsToWin: pendingAgendaPointsToWin,
            matchFormat
          },
          deckSetup: {
            runnerSnapshotId: hostDeckPair.runnerSnapshot.deckSnapshotId,
            corpSnapshotId: hostDeckPair.corpSnapshot.deckSnapshotId,
            runner: hostDeckPair.runnerSnapshot.publicMetadata,
            corp: hostDeckPair.corpSnapshot.publicMetadata,
            participants: { player_a: publicParticipantDeckPair(hostDeckPair), player_b: publicParticipantDeckPair(hostDeckPair) }
          },
          ...(aiPacingMode ? { aiPacingMode } : {}),
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
        ...(lobbyPayload.startLobby ? { lobby: lobbyPayload.startLobby } : {})
      };
    }
    const participantDecks = resolveParticipantDeckSetup(input, { seed, ...(aiPlayer ? { aiPlayer } : {}), ...(aiDeckPolicy ? { aiDeckPolicy } : {}) });
    const deckSetup = deckSetupForParticipants(participantDecks, { runnerPlayer, corpPlayer });
    const settings: MatchSettings = {
      agendaPointsToWin: agendaPointsToWinFor(matchFormat, input.settings?.agendaPointsToWin),
      matchFormat
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
      if (record.match.status !== "finished" || !record.gameState?.winner) {
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

  async joinMatch(matchId: string, input: { token: string; displayName?: string } & ParticipantDeckPairInput): Promise<JoinMatchResult | { error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
    if (isTerminalStatus(record.match.status)) return { error: safeError("match_terminal", "Dieses private Match ist bereits abgeschlossen.") };
    const tokenRecord = this.findToken(record, input.token, "join");
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
      ...(isSidePayload(payload) && payload.aiTurnPresentation ? { aiTurnPresentation: payload.aiTurnPresentation } : {}),
      ...(isSidePayload(payload) && payload.winner ? { winner: payload.winner } : {}),
      ...(isSidePayload(payload) && payload.finalStateHash ? { finalStateHash: payload.finalStateHash } : {}),
      ...(isSidePayload(payload) && payload.resultSummary ? { resultSummary: payload.resultSummary } : {})
    };
  }

  async bootstrap(matchId: string, side: Side, sessionToken: string): Promise<SidePayload | { error: SafeErrorPayload }>;
  async bootstrap(matchId: string, side: Side, sessionToken: string, options: { allowLobby: true }): Promise<ServicePayload | { error: SafeErrorPayload }>;
  async bootstrap(matchId: string, side: Side, sessionToken: string, options?: { allowLobby?: boolean }): Promise<ServicePayload | { error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
    const session = this.authenticate(record, side, sessionToken);
    if (!session) return { error: safeError("unauthorized", "Die Session ist nicht gültig.") };
    session.lastSeenAt = this.now();
    await this.storage.save(record);
    if (this.shouldUseLobbyPayload(record)) {
      const lobby = this.lobbyPayloadFor(record, side);
      return options?.allowLobby ? lobby : ({ error: safeError("match_pending", "Das Match ist noch nicht aktiv.") } as { error: SafeErrorPayload });
    }
    return this.payloadFor(record, side);
  }

  async setConnected(matchId: string, side: Side, sessionToken: string, connected: boolean): Promise<ServicePayload | { error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
    const session = this.authenticate(record, side, sessionToken);
    if (!session) return { error: safeError("unauthorized", "Die Session ist nicht gültig.") };
    session.connected = connected;
    session.lastSeenAt = this.now();
    if (!connected && record.match.status === "countdown" && record.startLobby) {
      this.cancelCountdownFor(record, side);
    }
    record.match.matchVersion += 1;
    record.match.updatedAt = this.now();
    await this.storage.save(record);
    if (this.shouldUseLobbyPayload(record)) return this.lobbyPayloadFor(record, side);
    return this.payloadFor(record, side);
  }

  async setLobbyReady(input: { matchId: string; side: Side; sessionToken: string; ready: boolean }): Promise<LobbyActionResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
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
      const record = await this.mustLoad(input.matchId);
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
      const record = await this.mustLoad(input.matchId);
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
      const record = await this.mustLoad(input.matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (isTerminalStatus(record.match.status)) return { ok: true, actorPayload: this.safePayloadFor(record, input.side) };
      if (isHostSession(record, session)) return { ok: false, error: safeError("leave_requires_joiner", "Der Host bricht die Lobby über Abbrechen ab."), payload: this.safePayloadFor(record, input.side) };
      if (record.match.status === "pending" || record.match.status === "waiting_for_joiner_decks" || record.match.status === "waiting_for_runner" || record.match.status === "waiting_for_corp") {
        const now = this.now();
        this.revokeTokenByHash(record, "session", session.sessionTokenHash, now);
        this.revokeTokenByHash(record, "reconnect", session.reconnectTokenHash, now);
        record.sessions = record.sessions.filter((candidate) => candidate.sessionId !== session.sessionId);
        record.match.status = "pending";
        record.match.matchVersion += 1;
        record.match.updatedAt = now;
        await this.storage.save(record);
        return this.lifecycleResultFor(record, input.side);
      }
      if (record.match.status !== "ready_check" && record.match.status !== "countdown") {
        return { ok: false, error: safeError("match_not_leavable", "Dieses Match kann nicht als Lobby verlassen werden."), payload: this.safePayloadFor(record, input.side) };
      }

      this.terminalizeLifecycle(record, "abandoned", "leave", input.side);
      await this.storage.save(record);
      return this.lifecycleResultFor(record, input.side);
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
      const record = await this.mustLoad(input.matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (record.match.status !== "active") {
        return { ok: false, error: safeError("match_not_active", "Das Match ist noch nicht aktiv.") };
      }
      if (!record.gameState) return { ok: false, error: safeError("match_not_active", "Das Match wartet noch auf vollständige Deckauswahl.") };

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
      const result = applyAction(record.gameState, action);
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
      const record = await this.mustLoad(input.matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (this.isAiSide(record, input.side)) return { ok: false, error: safeError("ai_session_forbidden", "Nur eine menschliche Session darf die KI fortsetzen.") };
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

      const beforeEventCount = record.eventLog.length;
      if (input.mode === "until_human") this.runAiUntilNextHuman(record);
      else this.runAiStep(record);

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

  async requestUndo(input: { matchId: string; side: Side; sessionToken: string; targetEventId: string; reason?: string }): Promise<UndoResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (record.match.status !== "active" || !record.gameState) return { ok: false, error: safeError("match_not_active", "Undo ist aktuell nicht möglich.") };
      const targetIndex = record.eventLog.findIndex((event) => event.eventId === input.targetEventId);
      if (targetIndex < 0) return { ok: false, error: safeError("undo_not_available", "Undo ist aktuell nicht möglich."), payload: this.payloadFor(record, input.side) };
      const blocked = record.eventLog.slice(targetIndex).some((event) => event.hiddenInfoBarrier);
      if (blocked) {
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
      record.pendingUndo = undoRequest;
      record.undoSnapshots.push({
        undoRequestId: undoRequest.undoRequestId,
        matchId: input.matchId,
        targetEventId: input.targetEventId,
        snapshotId: snapshot.snapshotId,
        requestedBy: input.side,
        status: "requested",
        hiddenInfoSafe: true
      });
      record.match.matchVersion += 1;
      record.match.updatedAt = this.now();
      await this.storage.save(record);
      return {
        ok: true,
        requesterPayload: this.payloadFor(record, input.side),
        opponentPayload: this.payloadFor(record, opposite(input.side)),
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
      if (!undoRecord) return { ok: false, error: safeError("undo_not_available", "Undo ist aktuell nicht möglich."), payload: this.payloadFor(record, input.side) };
      undoRecord.status = status;
      delete record.pendingUndo;
      if (status === "accepted") {
        const snapshot = record.stateSnapshots.find((candidate) => candidate.snapshotId === undoRecord.snapshotId);
        if (!snapshot) return { ok: false, error: safeError("undo_not_available", "Undo ist aktuell nicht möglich."), payload: this.payloadFor(record, input.side) };
        const targetIndex = record.eventLog.findIndex((event) => event.eventId === undoRecord.targetEventId);
        record.gameState = clone(snapshot.gameState);
        record.eventLog = targetIndex >= 0 ? record.eventLog.slice(0, targetIndex) : record.eventLog;
        record.actionReceipts = record.actionReceipts.filter((receipt) => receipt.stateVersionAfter <= snapshot.stateVersion);
        record.stateSnapshots = record.stateSnapshots.filter((candidate) => candidate.stateVersion <= snapshot.stateVersion);
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
      ...(runnerDifficulty ? { runnerDifficulty } : {}),
      ...(corpDifficulty ? { corpDifficulty } : {})
    };
  }

  private activatePendingDeckHandshake(record: StoredMatch, joinerDecks: ParticipantDeckPairInput): void {
    const hostDecks = record.privateDeckSnapshots?.participants?.player_a;
    if (!hostDecks) throw new Error("host_decks_missing");
    const joinerPair = resolveParticipantDeckPair(joinerDecks);
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
    record.match.settings = { ...record.match.settings, agendaPointsToWin, matchFormat };
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
      sideAssignment: { runnerPlayer, corpPlayer },
      chatMessages: record.startLobby?.chatMessages ?? []
    };
    record.eventLog = [];
    record.stateSnapshots = [];
  }

  private payloadFor(record: StoredMatch, side: Side): SidePayload {
    if (!record.gameState) throw new Error("match_not_active");
    const playerView = getPlayerView(record.gameState, side);
    const opponent = record.sessions.find((session) => session.side === opposite(side));
    const pendingUndo = record.pendingUndo
      ? { ...record.pendingUndo, needsResponse: record.pendingUndo.requestedBy !== side }
      : undefined;
    const lifecycleFinalHash = record.lifecycleResult?.finalEngineStateHash;
    const terminalWinner = record.match.status === "forfeited" ? record.lifecycleResult?.winnerSide : record.gameState.winner;
    const finalStateHash = terminalWinner ? lifecycleFinalHash ?? hashState(record.gameState) : undefined;
    const resultSummary = terminalWinner && finalStateHash ? resultSummaryFor(record, side, finalStateHash) : undefined;
    const aiTurnPresentation = this.aiTurnPresentationFor(record, side);
    return {
      matchId: record.match.matchId,
      matchStatus: record.match.status,
      matchVersion: record.match.matchVersion,
      side,
      playerView,
      legalActions: record.match.status === "active" ? getLegalActions(record.gameState, side) : [],
      eventTail: record.eventLog.slice(-20).map((event) => redactPublicEventForSide(event.publicPayload, side)),
      opponentStatus: {
        side: opposite(side),
        connected: this.isAiSide(record, opposite(side)) || (opponent?.connected ?? false),
        ...(this.safeDisplayNameFor(record, opposite(side)) ? { displayName: this.safeDisplayNameFor(record, opposite(side))! } : {})
      },
      ...(playerView.pendingChoice ? { pendingChoice: playerView.pendingChoice } : {}),
      ...(pendingUndo ? { pendingUndo } : {}),
      ...(aiTurnPresentation ? { aiTurnPresentation } : {}),
      ...(terminalWinner && finalStateHash ? { winner: terminalWinner, finalStateHash } : {}),
      ...(resultSummary ? { resultSummary } : {}),
      ...(record.lifecycleResult ? { lifecycleResult: record.lifecycleResult } : {})
    };
  }

  private lobbyPayloadFor(record: StoredMatch, side: Side): LobbyPayload {
    const lobby = record.startLobby;
    const opponent = record.sessions.find((session) => session.side === opposite(side));
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
    return {
      displayName: session?.displayName ?? (player === "player_a" ? "Teilnehmer A" : "Teilnehmer B"),
      side,
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
    record.match.settings = { ...record.match.settings, agendaPointsToWin: lobby.agendaPointsToWin, matchFormat: lobby.matchFormat };
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
    const winner = state?.winner;
    if (!series || !state || !winner) return;
    const finalStateHash = hashState(state);
    if (!series.results.some((result) => result.matchId === record.match.matchId)) {
      const runnerAgendaPoints = getPlayerView(state, "runner").own.agendaPoints;
      const corpAgendaPoints = getPlayerView(state, "corp").own.agendaPoints;
      series.results.push({
        matchId: record.match.matchId,
        gameNumber: series.gameNumber,
        winner,
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
      if (!this.runAiStep(record)) return;
    }
    if (record.match.aiPacingMode === "fast") this.runAiUntilNextHuman(record);
  }

  private runAiUntilNextHuman(record: StoredMatch): void {
    let state = record.gameState;
    if (!state) return;
    for (let count = 0; count < 40 && record.match.status === "active" && !state.winner && this.aiControllableSide(record); count += 1) {
      if (!this.runAiStep(record)) return;
      state = record.gameState;
      if (!state) return;
    }
  }

  private runAiStep(record: StoredMatch): boolean {
    const state = record.gameState;
    if (!state || record.match.status !== "active" || state.winner || !this.aiControllableSide(record)) return false;
    const side = state.pendingChoice && this.isAiSide(record, state.pendingChoice.side) ? state.pendingChoice.side : state.activeSide;
    if (!this.isAiSide(record, side)) return false;
    const legalActions = getLegalActions(state, side);
    if (legalActions.length === 0) return false;
    const controller = record.match.aiControllers?.[side];
    const input = buildAiDecisionInput(state, side, {
      difficulty: controller?.difficulty ?? "normal",
      profileId: controller?.profileId ?? `${side}-server-ai-v0.9-${controller?.difficulty ?? "normal"}`,
      decisionId: `${record.match.matchId}:${state.stateVersion}:${side}`,
      actionNumber: state.stateVersion
    });
    const decision = chooseAiAction(input);
    const legalAction = legalActions.find((candidate) => candidate.actionId === decision.actionId) ?? legalActions.slice().sort((left, right) => left.actionId.localeCompare(right.actionId))[0];
    if (!legalAction) return false;
    const snapshot = this.snapshotFor(record.match.matchId, state, record.match.matchVersion, `snap_before_${state.stateVersion + 1}`, false);
    const result = applyAction(state, {
      matchId: record.match.matchId,
      side,
      actionId: legalAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices ? { selectedChoices: decision.selectedChoices } : {}),
      idempotencyKey: `ai-${side}-${state.stateVersion}`
    });
    if (!result.ok) return false;
    const event: GameEvent = {
      ...result.event,
      publicPayload: {
        ...result.event.publicPayload,
        aiReasonCode: decision.reasonCode,
        aiExplanation: decision.explanation
      }
    };
    const barrier = isHiddenInfoBarrier(event);
    record.stateSnapshots.push({ ...snapshot, hiddenInfoBarrier: barrier });
    record.gameState = result.state;
    record.eventLog.push(toEventRecord(record.match.matchId, event, barrier));
    record.match.matchVersion += 1;
    record.match.updatedAt = this.now();
    if (result.state.winner) this.finalizeFinishedMatch(record);
    return true;
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
    if (state.pendingChoice && this.isAiSide(record, state.pendingChoice.side)) return state.pendingChoice.side;
    if (this.isAiSide(record, state.activeSide)) return state.activeSide;
    return undefined;
  }

  private isAiSide(record: StoredMatch, side: Side): boolean {
    return record.match.aiControllers?.[side]?.type === "ai";
  }

  private async mustLoad(matchId: string): Promise<StoredMatch | undefined> {
    return this.storage.load(matchId);
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
      gameState: clone(gameState),
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

function isTerminalStatus(status: MatchStatus): boolean {
  return status === "cancelled" || status === "abandoned" || status === "forfeited" || status === "finished";
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
  const publicPayload: PublicGameEvent = {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    ...(event.visibilityClass ? { visibilityClass: event.visibilityClass } : {}),
    publicPayload: event.publicPayload
  };
  return {
    eventId: event.eventId,
    matchId,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    publicPayload,
    privatePayloadLocalOnly: Boolean(event.privatePayload),
    hiddenInfoBarrier: barrier
  };
}

function isHiddenInfoBarrier(event: GameEvent): boolean {
  return isHiddenInfoBarrierEvent(event);
}

function resultSummaryFor(record: StoredMatch, viewerSide: Side, finalStateHash: string): GameResultSummary | undefined {
  const state = record.gameState;
  const winner = record.match.status === "forfeited" ? record.lifecycleResult?.winnerSide : state?.winner;
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
    reason: record.lifecycleResult?.reason === "forfeit" ? "forfeit" : resultReason(state, winner, runnerAgendaPoints, corpAgendaPoints, record.match.settings.agendaPointsToWin),
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

function seriesSummaryFor(record: StoredMatch, viewerSide: Side): SeriesResultSummary {
  const series = record.match.series;
  if (!series) throw new Error("series_missing");
  const viewerPlayer = seriesPlayerForSide(series, viewerSide);
  const wins = { player_a: 0, player_b: 0 };
  const agendaPoints = { player_a: 0, player_b: 0 };
  let draws = 0;
  for (const result of series.results) {
    const winningPlayer = winningSeriesPlayer(result);
    if (winningPlayer === "draw") draws += 1;
    else wins[winningPlayer] += 1;
    agendaPoints[result.runnerPlayer] += result.runnerAgendaPoints;
    agendaPoints[result.corpPlayer] += result.corpAgendaPoints;
  }
  const opponentPlayer = oppositeSeriesPlayer(viewerPlayer);
  const seriesDecision = seriesDecisionFor(wins[viewerPlayer], wins[opponentPlayer], agendaPoints[viewerPlayer], agendaPoints[opponentPlayer]);
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
    viewerAgendaPoints: agendaPoints[viewerPlayer],
    opponentAgendaPoints: agendaPoints[opponentPlayer],
    viewerSeriesOutcome: seriesDecision.outcome,
    seriesDecision: seriesDecision.decision,
    nextAvailable: series.status === "between_games" && !series.nextMatchId,
    ...(series.nextMatchId ? { nextMatchId: series.nextMatchId } : {})
  };
}

function seriesDecisionFor(
  viewerWins: number,
  opponentWins: number,
  viewerAgendaPoints: number,
  opponentAgendaPoints: number
): { outcome: "won" | "lost" | "draw"; decision: "wins" | "agenda_points" | "draw" } {
  if (viewerWins > opponentWins) return { outcome: "won", decision: "wins" };
  if (viewerWins < opponentWins) return { outcome: "lost", decision: "wins" };
  if (viewerAgendaPoints > opponentAgendaPoints) return { outcome: "won", decision: "agenda_points" };
  if (viewerAgendaPoints < opponentAgendaPoints) return { outcome: "lost", decision: "agenda_points" };
  return { outcome: "draw", decision: "draw" };
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

function baselineForMode(mode: MatchMode, deckSetup: ResolvedDeckSetup): RulesBaseline {
  if (setupUsesMvp094Rules(deckSetup)) return MVP_0_94_BASELINE;
  if (setupUsesMvp08Rules(deckSetup)) return MVP_0_8_BASELINE;
  if (setupUsesExpandedRules(deckSetup)) return MVP_0_4_BASELINE;
  return mode === "human_vs_human" ? MVP_0_2_BASELINE : MVP_0_3_BASELINE;
}

function setupUsesMvp094Rules(setup: ResolvedDeckSetup): boolean {
  return (
    setup.runnerSnapshot.rulesBaselineId === "rules-baseline-mvp-0.94" ||
    setup.corpSnapshot.rulesBaselineId === "rules-baseline-mvp-0.94"
  );
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

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
