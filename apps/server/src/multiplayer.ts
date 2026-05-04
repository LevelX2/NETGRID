import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { buildAiDecisionInput, chooseAiAction } from "@netrunner/ai";
import type { DeckSnapshot } from "@netrunner/decks";
import { applyAction, createGame, getLegalActions, getPlayerView, hashState, isHiddenInfoBarrierEvent, replayEvents } from "@netrunner/engine";
import {
  MVP_0_2_BASELINE,
  MVP_0_3_BASELINE,
  MVP_0_4_BASELINE,
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
} from "@netrunner/shared";
import { defaultAgendaPointsToWin, resolveDeckSetup, setupUsesExpandedRules, setupUsesMvp08Rules, type MatchDeckSelectionInput, type ResolvedDeckSetup } from "./deck-setup";

export type MatchStatus = "waiting_for_runner" | "waiting_for_corp" | "active" | "finished";
export type HostSideSelection = Side | "random";
export type MatchMode = "human_vs_human" | "human_runner_vs_corp_ai" | "human_corp_vs_runner_ai";
export type MatchFormat = "single_game" | "rules_match" | "two_game_side_swap";
export type TokenKind = "join" | "session" | "reconnect";
export type UndoStatus = "requested" | "accepted" | "declined" | "blocked";
export type SeriesPlayerSlot = "player_a" | "player_b";
export type SeriesStatus = "active" | "between_games" | "finished";

export type MatchSettings = {
  agendaPointsToWin: number;
  matchFormat: MatchFormat;
};

export type GameResultReason = "agenda_points" | "corp_deck_empty" | "flatline" | "draw" | "unknown";

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
  nextAvailable: boolean;
  nextMatchId?: string;
};

export type GameResultSummary = {
  winner: Side | "draw";
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
  series?: SeriesResultSummary;
};

export type MatchRecord = {
  matchId: string;
  status: MatchStatus;
  mode: MatchMode;
  matchVersion: number;
  baseline: RulesBaseline;
  settings: MatchSettings;
  deckSetup: {
    runnerSnapshotId: string;
    corpSnapshotId: string;
    runner: DeckPublicMetadata;
    corp: DeckPublicMetadata;
  };
  aiControllers?: Partial<Record<Side, PlayerController>>;
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
  privateDeckSnapshots?: { runner: DeckSnapshot; corp: DeckSnapshot };
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
};

export type SidePayload = {
  matchId: string;
  matchStatus: MatchStatus;
  matchVersion: number;
  side: Side;
  playerView: PlayerView;
  legalActions: LegalAction[];
  eventTail: PublicGameEvent[];
  opponentStatus: { side: Side; connected: boolean };
  pendingChoice?: PlayerView["pendingChoice"];
  pendingUndo?: PendingUndoRequest & { needsResponse: boolean };
  winner?: Side | "draw";
  finalStateHash?: string;
  resultSummary?: GameResultSummary;
};

export type SafeErrorPayload = {
  code: string;
  message: string;
  currentStateVersion?: number;
  playerView?: PlayerView;
};

export type CreateMatchResult = {
  matchId: string;
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
  pendingChoice?: PlayerView["pendingChoice"];
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
  pendingChoice?: PlayerView["pendingChoice"];
  winner?: Side | "draw";
  finalStateHash?: string;
  resultSummary?: GameResultSummary;
};

export type ReconnectResult = JoinMatchResult & {
  eventTail: PublicGameEvent[];
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
    this.tokenSalt = options.tokenSalt ?? process.env.NETRUNNER_TOKEN_SALT ?? "local-dev-netrunner-token-salt";
    this.webBaseUrl = trimTrailingSlash(options.publicWebBaseUrl ?? process.env.NETRUNNER_WEB_BASE_URL ?? "http://127.0.0.1:3000");
    this.serverBaseUrl = trimTrailingSlash(options.publicServerBaseUrl ?? process.env.NETRUNNER_SERVER_BASE_URL ?? "http://127.0.0.1:8787");
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async createMatch(input: {
    hostSide: HostSideSelection;
    displayName?: string;
    seed?: string;
    settings?: Partial<MatchSettings>;
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
  } & MatchDeckSelectionInput): Promise<CreateMatchResult> {
    const seed = input.seed?.trim() || `match-${randomId("seed")}`;
    const matchId = randomId("match");
    const mode = input.mode ?? "human_vs_human";
    const hostSide = mode === "human_runner_vs_corp_ai" ? "runner" : mode === "human_corp_vs_runner_ai" ? "corp" : input.hostSide === "random" ? deterministicHostSide(seed) : input.hostSide;
    const joinSide = opposite(hostSide);
    const now = this.now();
    const hostSessionToken = generateToken();
    const hostReconnectToken = generateToken();
    const joinToken = mode === "human_vs_human" ? generateToken() : undefined;
    const deckSetup = resolveDeckSetup(input);
    const matchFormat = input.settings?.matchFormat ?? "rules_match";
    const settings: MatchSettings = {
      agendaPointsToWin: input.settings?.agendaPointsToWin ?? (matchFormat === "two_game_side_swap" ? 7 : defaultAgendaPointsToWin(deckSetup)),
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
      displayName: input.displayName?.trim() || (hostSide === "runner" ? "Runner" : "Corp"),
      sessionTokenHash: this.hashToken(hostSessionToken),
      reconnectTokenHash: this.hashToken(hostReconnectToken),
      connected: false,
      createdAt: now,
      lastSeenAt: now
    };

    const record: StoredMatch = {
      match: {
        matchId,
        status: mode === "human_vs_human" ? (hostSide === "runner" ? "waiting_for_corp" : "waiting_for_runner") : "active",
        mode,
        matchVersion: 1,
        baseline,
        settings,
        deckSetup: {
          runnerSnapshotId: deckSetup.runnerSnapshot.deckSnapshotId,
          corpSnapshotId: deckSetup.corpSnapshot.deckSnapshotId,
          runner: deckSetup.runnerSnapshot.publicMetadata,
          corp: deckSetup.corpSnapshot.publicMetadata
        },
        ...(mode === "human_vs_human" ? {} : { aiControllers: aiControllersFor(controllers) }),
        ...(settings.matchFormat === "two_game_side_swap"
          ? {
              series: input.series
                ? {
                    seriesId: input.series.seriesId,
                    mode: "two_game_side_swap",
                    status: "active",
                    gameNumber: input.series.gameNumber,
                    gamesPlanned: input.series.gamesPlanned,
                    runnerPlayer: input.series.runnerPlayer,
                    corpPlayer: input.series.corpPlayer,
                    results: clone(input.series.previousResults),
                    ...(input.series.previousMatchId ? { previousMatchId: input.series.previousMatchId } : {})
                  }
                : {
                    seriesId: randomId("series"),
                    mode: "two_game_side_swap",
                    status: "active",
                    gameNumber: 1,
                    gamesPlanned: 2,
                    runnerPlayer: hostSide === "runner" ? "player_a" : "player_b",
                    corpPlayer: hostSide === "corp" ? "player_a" : "player_b",
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
      privateDeckSnapshots: { runner: clone(deckSetup.runnerSnapshot), corp: clone(deckSetup.corpSnapshot) },
      eventLog: gameState.eventLog.map((event) => toEventRecord(matchId, event, false)),
      actionReceipts: [],
      undoSnapshots: [],
      stateSnapshots: [this.snapshotFor(matchId, gameState, 1, "snap_initial", false)]
    };

    this.runAiUntilNextHuman(record);
    await this.storage.save(record);
    const payload = this.payloadFor(record, hostSide);
    return {
      matchId,
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
      if (record.match.status !== "finished" || !record.gameState.winner) {
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
      const next = await this.createMatch({
        hostSide: nextHostSide,
        displayName: input.displayName ?? session.displayName,
        seed: `${record.gameState.seed}:series-game-${nextGameNumber}`,
        mode: nextMode,
        ...(nextMode === "human_runner_vs_corp_ai" ? { corpDifficulty: aiDifficulty } : {}),
        ...(nextMode === "human_corp_vs_runner_ai" ? { runnerDifficulty: aiDifficulty } : {}),
        settings: record.match.settings,
        ...(record.privateDeckSnapshots?.runner ? { runnerDeckSnapshot: record.privateDeckSnapshots.runner } : {}),
        ...(record.privateDeckSnapshots?.corp ? { corpDeckSnapshot: record.privateDeckSnapshots.corp } : {}),
        runnerDeckSnapshotId: record.match.deckSetup.runnerSnapshotId,
        corpDeckSnapshotId: record.match.deckSetup.corpSnapshotId,
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

  async joinMatch(matchId: string, input: { token: string; displayName?: string }): Promise<JoinMatchResult | { error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
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
      displayName: input.displayName?.trim() || (tokenRecord.allowedSide === "runner" ? "Runner" : "Corp"),
      sessionTokenHash: this.hashToken(sessionToken),
      reconnectTokenHash: this.hashToken(reconnectToken),
      connected: false,
      createdAt: now,
      lastSeenAt: now
    });
    record.tokens = record.tokens.map((candidate) => (candidate.tokenId === tokenRecord.tokenId ? { ...candidate, usedAt: now } : candidate));
    record.tokens.push(this.tokenRecord(matchId, tokenRecord.allowedSide, "session", sessionToken, now));
    record.tokens.push(this.tokenRecord(matchId, tokenRecord.allowedSide, "reconnect", reconnectToken, now));
    record.match.status = "active";
    record.match.matchVersion += 1;
    record.match.updatedAt = now;
    await this.storage.save(record);

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
      ...(payload.winner ? { winner: payload.winner } : {}),
      ...(payload.finalStateHash ? { finalStateHash: payload.finalStateHash } : {}),
      ...(payload.resultSummary ? { resultSummary: payload.resultSummary } : {})
    };
  }

  async reconnectMatch(matchId: string, input: { side: Side; reconnectToken: string; displayName?: string }): Promise<ReconnectResult | { error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
    const session = record.sessions.find((candidate) => candidate.side === input.side && candidate.reconnectTokenHash === this.hashToken(input.reconnectToken));
    if (!session) return { error: safeError("invalid_token", "Reconnect ist nicht möglich.") };

    const now = this.now();
    const sessionToken = generateToken();
    const reconnectToken = generateToken();
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

    const payload = this.payloadFor(record, input.side);
    return {
      matchId,
      sessionToken,
      reconnectToken,
      side: input.side,
      webSocketUrl: this.webSocketUrl(),
      playerView: payload.playerView,
      legalActions: payload.legalActions,
      matchVersion: record.match.matchVersion,
      eventTail: payload.eventTail,
      ...(payload.pendingChoice ? { pendingChoice: payload.pendingChoice } : {}),
      ...(payload.winner ? { winner: payload.winner } : {}),
      ...(payload.finalStateHash ? { finalStateHash: payload.finalStateHash } : {}),
      ...(payload.resultSummary ? { resultSummary: payload.resultSummary } : {})
    };
  }

  async bootstrap(matchId: string, side: Side, sessionToken: string): Promise<SidePayload | { error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
    const session = this.authenticate(record, side, sessionToken);
    if (!session) return { error: safeError("unauthorized", "Die Session ist nicht gültig.") };
    session.lastSeenAt = this.now();
    await this.storage.save(record);
    return this.payloadFor(record, side);
  }

  async setConnected(matchId: string, side: Side, sessionToken: string, connected: boolean): Promise<SidePayload | { error: SafeErrorPayload }> {
    const record = await this.mustLoad(matchId);
    if (!record) return { error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
    const session = this.authenticate(record, side, sessionToken);
    if (!session) return { error: safeError("unauthorized", "Die Session ist nicht gültig.") };
    session.connected = connected;
    session.lastSeenAt = this.now();
    record.match.matchVersion += 1;
    record.match.updatedAt = this.now();
    await this.storage.save(record);
    return this.payloadFor(record, side);
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
        return { ok: false, error: safeError("match_not_active", "Das Match ist noch nicht aktiv."), payload: this.payloadFor(record, input.side) };
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
      this.runAiUntilNextHuman(record);
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

  async requestUndo(input: { matchId: string; side: Side; sessionToken: string; targetEventId: string; reason?: string }): Promise<UndoResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
      if (record.match.status !== "active") return { ok: false, error: safeError("match_not_active", "Undo ist aktuell nicht möglich."), payload: this.payloadFor(record, input.side) };
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
    const initial = record.stateSnapshots[0]?.gameState;
    if (!initial) return { ok: false, finalStateHash: hashState(record.gameState), errors: ["Initial snapshot missing."] };
    const replay = replayEvents(initial, record.gameState.eventLog);
    return { ok: replay.ok, finalStateHash: replay.actualFinalStateHash, errors: replay.errors };
  }

  async loadForTest(matchId: string): Promise<StoredMatch | undefined> {
    return this.storage.load(matchId);
  }

  private async resolveUndo(input: { matchId: string; side: Side; sessionToken: string; undoRequestId: string }, status: "accepted" | "declined"): Promise<UndoResult> {
    return this.withMatchLock(input.matchId, async () => {
      const record = await this.mustLoad(input.matchId);
      if (!record) return { ok: false, error: safeError("not_found", "Dieses private Match ist nicht verfügbar.") };
      const session = this.authenticate(record, input.side, input.sessionToken);
      if (!session) return { ok: false, error: safeError("unauthorized", "Die Session ist nicht gültig.") };
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

  private payloadFor(record: StoredMatch, side: Side): SidePayload {
    const playerView = getPlayerView(record.gameState, side);
    const opponent = record.sessions.find((session) => session.side === opposite(side));
    const pendingUndo = record.pendingUndo
      ? { ...record.pendingUndo, needsResponse: record.pendingUndo.requestedBy !== side }
      : undefined;
    const finalStateHash = record.gameState.winner ? hashState(record.gameState) : undefined;
    const resultSummary = record.gameState.winner && finalStateHash ? resultSummaryFor(record, side, finalStateHash) : undefined;
    return {
      matchId: record.match.matchId,
      matchStatus: record.match.status,
      matchVersion: record.match.matchVersion,
      side,
      playerView,
      legalActions: getLegalActions(record.gameState, side),
      eventTail: record.eventLog.slice(-20).map((event) => event.publicPayload),
      opponentStatus: { side: opposite(side), connected: this.isAiSide(record, opposite(side)) || (opponent?.connected ?? false) },
      ...(playerView.pendingChoice ? { pendingChoice: playerView.pendingChoice } : {}),
      ...(pendingUndo ? { pendingUndo } : {}),
      ...(record.gameState.winner && finalStateHash ? { winner: record.gameState.winner, finalStateHash } : {}),
      ...(resultSummary ? { resultSummary } : {})
    };
  }

  private finalizeFinishedMatch(record: StoredMatch): void {
    if (!record.gameState.winner) return;
    record.match.status = "finished";
    record.match.winner = record.gameState.winner;
    this.finalizeSeriesGame(record);
  }

  private finalizeSeriesGame(record: StoredMatch): void {
    const series = record.match.series;
    const winner = record.gameState.winner;
    if (!series || !winner) return;
    const finalStateHash = hashState(record.gameState);
    if (!series.results.some((result) => result.matchId === record.match.matchId)) {
      const runnerAgendaPoints = getPlayerView(record.gameState, "runner").own.agendaPoints;
      const corpAgendaPoints = getPlayerView(record.gameState, "corp").own.agendaPoints;
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

  private runAiUntilNextHuman(record: StoredMatch): void {
    for (let count = 0; count < 40 && record.match.status === "active" && !record.gameState.winner && this.isAiSide(record, record.gameState.activeSide); count += 1) {
      const side = record.gameState.activeSide;
      const legalActions = getLegalActions(record.gameState, side);
      if (legalActions.length === 0) return;
      const controller = record.match.aiControllers?.[side];
      const input = buildAiDecisionInput(record.gameState, side, {
        difficulty: controller?.difficulty ?? "normal",
        profileId: controller?.profileId ?? `${side}-server-ai-v0.9-${controller?.difficulty ?? "normal"}`,
        decisionId: `${record.match.matchId}:${record.gameState.stateVersion}:${side}`,
        actionNumber: record.gameState.stateVersion
      });
      const decision = chooseAiAction(input);
      const legalAction = legalActions.find((candidate) => candidate.actionId === decision.actionId) ?? legalActions.slice().sort((left, right) => left.actionId.localeCompare(right.actionId))[0];
      if (!legalAction) return;
      const snapshot = this.snapshotFor(record.match.matchId, record.gameState, record.match.matchVersion, `snap_before_${record.gameState.stateVersion + 1}`, false);
      const result = applyAction(record.gameState, {
        matchId: record.match.matchId,
        side,
        actionId: legalAction.actionId,
        clientKnownStateVersion: record.gameState.stateVersion,
        ...(decision.selectedChoices ? { selectedChoices: decision.selectedChoices } : {}),
        idempotencyKey: `ai-${side}-${record.gameState.stateVersion}`
      });
      if (!result.ok) return;
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
      if (result.state.winner) {
        this.finalizeFinishedMatch(record);
      }
    }
  }

  private isAiSide(record: StoredMatch, side: Side): boolean {
    return record.match.aiControllers?.[side]?.type === "ai";
  }

  private async mustLoad(matchId: string): Promise<StoredMatch | undefined> {
    return this.storage.load(matchId);
  }

  private authenticate(record: StoredMatch, side: Side, sessionToken: string): SessionRecord | undefined {
    const hash = this.hashToken(sessionToken);
    return record.sessions.find((session) => session.side === side && session.sessionTokenHash === hash);
  }

  private findToken(record: StoredMatch, token: string, kind: TokenKind): TokenRecord | undefined {
    const hash = this.hashToken(token);
    return record.tokens.find((candidate) => candidate.kind === kind && candidate.tokenHash === hash && !candidate.revokedAt && !candidate.usedAt);
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
  const winner = record.gameState.winner;
  if (!winner) return undefined;
  const runnerAgendaPoints = getPlayerView(record.gameState, "runner").own.agendaPoints;
  const corpAgendaPoints = getPlayerView(record.gameState, "corp").own.agendaPoints;
  const actionEvents = record.eventLog.filter((event) => event.publicPayload.type !== "game_created");
  const countType = (type: string) => actionEvents.filter((event) => event.publicPayload.type === type).length;
  return {
    winner,
    viewerOutcome: winner === "draw" ? "draw" : winner === viewerSide ? "won" : "lost",
    reason: resultReason(record.gameState, winner, runnerAgendaPoints, corpAgendaPoints, record.match.settings.agendaPointsToWin),
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
    ...(record.match.series ? { series: seriesSummaryFor(record, viewerSide) } : {})
  };
}

function seriesSummaryFor(record: StoredMatch, viewerSide: Side): SeriesResultSummary {
  const series = record.match.series;
  if (!series) throw new Error("series_missing");
  const viewerPlayer = seriesPlayerForSide(series, viewerSide);
  const wins = { player_a: 0, player_b: 0 };
  let draws = 0;
  for (const result of series.results) {
    const winningPlayer = winningSeriesPlayer(result);
    if (winningPlayer === "draw") draws += 1;
    else wins[winningPlayer] += 1;
  }
  const opponentPlayer = oppositeSeriesPlayer(viewerPlayer);
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
    nextAvailable: series.status === "between_games" && !series.nextMatchId,
    ...(series.nextMatchId ? { nextMatchId: series.nextMatchId } : {})
  };
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

function resultReason(state: GameState, winner: Side | "draw", runnerAgendaPoints: number, corpAgendaPoints: number, agendaPointsToWin: number): GameResultReason {
  if (winner === "draw") return "draw";
  if (state.gameEndReason === "flatline") return "flatline";
  if (runnerAgendaPoints >= agendaPointsToWin || corpAgendaPoints >= agendaPointsToWin) return "agenda_points";
  if (winner === "runner" || state.gameEndReason === "corp_deck_empty") return "corp_deck_empty";
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

function deterministicHostSide(seed: string): Side {
  const value = createHash("sha256").update(seed).digest()[0] ?? 0;
  return value % 2 === 0 ? "runner" : "corp";
}

function baselineForMode(mode: MatchMode, deckSetup: ResolvedDeckSetup): RulesBaseline {
  if (setupUsesMvp08Rules(deckSetup)) return MVP_0_8_BASELINE;
  if (setupUsesExpandedRules(deckSetup)) return MVP_0_4_BASELINE;
  return mode === "human_vs_human" ? MVP_0_2_BASELINE : MVP_0_3_BASELINE;
}

function controllersForMode(
  mode: MatchMode,
  hostSide: Side,
  difficulties: { runnerDifficulty: AiDifficulty; corpDifficulty: AiDifficulty }
): { runner: PlayerController; corp: PlayerController } {
  if (mode === "human_runner_vs_corp_ai") {
    return {
      runner: { controllerId: "runner-human", side: "runner", type: "human_remote", displayName: "Runner" },
      corp: { controllerId: "corp-ai", side: "corp", type: "ai", displayName: "Corp KI", difficulty: difficulties.corpDifficulty, profileId: `corp-ai-v0.9-${difficulties.corpDifficulty}` }
    };
  }
  if (mode === "human_corp_vs_runner_ai") {
    return {
      runner: { controllerId: "runner-ai", side: "runner", type: "ai", displayName: "Runner KI", difficulty: difficulties.runnerDifficulty, profileId: `runner-ai-v0.9-${difficulties.runnerDifficulty}` },
      corp: { controllerId: "corp-human", side: "corp", type: "human_remote", displayName: "Corp" }
    };
  }
  return {
    runner: { controllerId: hostSide === "runner" ? "runner-host" : "runner-guest", side: "runner", type: "human_remote", displayName: "Runner" },
    corp: { controllerId: hostSide === "corp" ? "corp-host" : "corp-guest", side: "corp", type: "human_remote", displayName: "Corp" }
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
