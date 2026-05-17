import type {
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  Winner,
} from "./index";

export type ApiMatchStatus =
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

export type ApiMatchMode =
  | "human_vs_human"
  | "human_runner_vs_corp_ai"
  | "human_corp_vs_runner_ai";

export type ApiClientGameMode = ApiMatchMode | "ai_vs_ai";
export type ApiMatchFormat = "single_game" | "rules_match" | "two_game_side_swap";
export type ApiAiPacingMode = "fast" | "paced" | "manual";
export type ApiSeriesPlayerSlot = "player_a" | "player_b";
export type ApiSeriesStatus = "active" | "between_games" | "finished";
export type ApiConnectionQuality = "online" | "unstable" | "offline";
export type ApiGameResultReason =
  | "agenda_points"
  | "corp_deck_empty"
  | "flatline"
  | "draw"
  | "forfeit"
  | "unknown";

export type ApiSeriesResultSummary = {
  seriesId: string;
  mode: "two_game_side_swap";
  status: ApiSeriesStatus;
  gameNumber: number;
  gamesPlanned: number;
  viewerPlayer: ApiSeriesPlayerSlot;
  viewerWins: number;
  opponentWins: number;
  draws: number;
  viewerMatchPoints: number;
  opponentMatchPoints: number;
  viewerAgendaPoints: number;
  opponentAgendaPoints: number;
  viewerSeriesOutcome: "won" | "lost" | "draw";
  seriesDecision: "wins" | "match_points" | "agenda_points" | "draw";
  nextAvailable: boolean;
  nextMatchId?: string;
};

export type ApiGameResultSummary = {
  winner: Winner;
  winnerSide?: Side;
  loserSide?: Side;
  viewerOutcome: "won" | "lost" | "draw";
  reason: ApiGameResultReason;
  matchFormat: ApiMatchFormat;
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
  series?: ApiSeriesResultSummary;
};

export type ApiLifecycleResultSummary = {
  status: Extract<ApiMatchStatus, "cancelled" | "abandoned" | "forfeited">;
  reason: "cancel" | "leave" | "forfeit";
  occurredAt: string;
  actorSide: Side;
  winnerSide?: Side;
  loserSide?: Side;
  finalEngineStateHash?: string;
};

export type ApiPendingUndoRequest = {
  undoRequestId: string;
  requestedBy: Side;
  targetEventId: string;
  reason?: string;
};

export type ApiAiTurnPresentationState = {
  activeAiSide?: Side;
  canAdvanceAi: boolean;
  pacingMode: ApiAiPacingMode;
};

export type ApiOpponentStatus = {
  side: Side;
  connected: boolean;
  displayName?: string;
};

export type ApiLobbyParticipantPayload = {
  displayName: string;
  side?: Side;
  runnerDeckReady: boolean;
  corpDeckReady: boolean;
  connected: boolean;
  connectionQuality: ApiConnectionQuality;
  ready: boolean;
};

export type ApiLobbyChatMessage = {
  id: number;
  side: Side;
  displayName: string;
  sentAt: string;
  text: string;
};

export type ApiMatchStartLobbyPayload = {
  hostReady: boolean;
  joinerReady: boolean;
  countdownSeconds: 3 | 5 | 10;
  countdownStartedAt?: string;
  countdownEndsAt?: string;
  agendaPointsToWin: number;
  matchFormat: ApiMatchFormat;
  sideAssignment: {
    runnerPlayer: ApiSeriesPlayerSlot;
    corpPlayer: ApiSeriesPlayerSlot;
  };
  participants: Record<ApiSeriesPlayerSlot, ApiLobbyParticipantPayload>;
  chatMessages: ApiLobbyChatMessage[];
};

export type ApiSidePayload = {
  matchId: string;
  matchStatus: ApiMatchStatus;
  matchVersion: number;
  side: Side;
  playerView: PlayerView;
  legalActions: LegalAction[];
  eventTail: PublicGameEvent[];
  opponentStatus: ApiOpponentStatus;
  pendingChoice?: PlayerView["pendingChoice"];
  pendingUndo?: ApiPendingUndoRequest & { needsResponse: boolean };
  aiTurnPresentation?: ApiAiTurnPresentationState;
  winner?: Winner;
  finalStateHash?: string;
  resultSummary?: ApiGameResultSummary;
  lifecycleResult?: ApiLifecycleResultSummary;
  retentionProtected?: boolean;
  retentionProtectedAt?: string;
};

export type ApiLobbyPayload = {
  matchId: string;
  matchStatus: ApiMatchStatus;
  matchVersion: number;
  side: Side;
  eventTail: PublicGameEvent[];
  opponentStatus: ApiOpponentStatus;
  lifecycleResult?: ApiLifecycleResultSummary;
  pendingDeckHandshake?: {
    required: boolean;
    message: string;
  };
  startLobby?: ApiMatchStartLobbyPayload;
  retentionProtected?: boolean;
  retentionProtectedAt?: string;
};

export type ApiServicePayload = ApiSidePayload | ApiLobbyPayload;

export type ApiServerMessage =
  | {
      type: "state_update";
      payload: {
        matchStatus: ApiMatchStatus;
        matchVersion: number;
        playerView: PlayerView;
        pendingUndo?: NonNullable<ApiSidePayload["pendingUndo"]> | null;
      };
    }
  | { type: "lobby_update"; payload: ApiLobbyPayload }
  | {
      type: "legal_actions";
      payload: { stateVersion?: number; legalActions: LegalAction[] };
    }
  | { type: "event_log_update"; payload: { events: PublicGameEvent[] } }
  | { type: "opponent_status"; payload: ApiOpponentStatus }
  | { type: "undo_request"; payload: NonNullable<ApiSidePayload["pendingUndo"]> }
  | { type: "ai_turn"; payload: ApiAiTurnPresentationState | null | undefined }
  | {
      type: "match_finished";
      payload: {
        matchStatus: ApiMatchStatus;
        winner: Winner;
        finalStateHash: string;
        resultSummary?: ApiGameResultSummary;
      };
    }
  | {
      type: "error";
      payload: { code: string; message: string; currentStateVersion?: number; playerView?: PlayerView };
    }
  | {
      type: "action_receipt";
      payload: {
        accepted: boolean;
        stateVersionAfter: number;
        errorCode?: string;
        idempotencyKey?: string;
        matchId?: string;
        side?: Side;
        stateVersionBefore?: number;
        stateHashAfter?: string;
      };
    }
  | { type: "choice_request"; payload: { choice: PlayerView["pendingChoice"] | null } }
  | { type: "pong"; payload: { clientTime?: number; serverTime: number } };

export type ApiCreateMatchResponse = {
  matchId: string;
  matchStatus?: ApiMatchStatus;
  pendingDeckHandshake?: boolean;
  hostSide: Side;
  hostSessionToken: string;
  hostReconnectToken: string;
  joinUrl?: string;
  webSocketUrl: string;
  mode: ApiMatchMode;
  playerView?: PlayerView;
  legalActions: LegalAction[];
  matchVersion: number;
  lobby?: ApiMatchStartLobbyPayload;
  aiTurnPresentation?: ApiAiTurnPresentationState;
  winner?: Winner;
  finalStateHash?: string;
  resultSummary?: ApiGameResultSummary;
  retentionProtected?: boolean;
  retentionProtectedAt?: string;
  error?: { message: string };
};

export type ApiJoinMatchResponse = {
  matchId: string;
  side: Side;
  sessionToken: string;
  reconnectToken: string;
  webSocketUrl: string;
  playerView?: PlayerView;
  legalActions: LegalAction[];
  matchVersion: number;
  matchStatus?: ApiMatchStatus;
  lobby?: ApiMatchStartLobbyPayload;
  eventTail?: PublicGameEvent[];
  pendingUndo?: ApiPendingUndoRequest & { needsResponse: boolean };
  aiTurnPresentation?: ApiAiTurnPresentationState;
  winner?: Winner;
  finalStateHash?: string;
  resultSummary?: ApiGameResultSummary;
  retentionProtected?: boolean;
  retentionProtectedAt?: string;
  error?: { message: string };
};
