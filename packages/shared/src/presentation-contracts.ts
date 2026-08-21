export const API_USER_ERROR_CODES = [
  "ERR_STALE_STATE",
  "ERR_WRONG_SIDE",
  "ERR_UNKNOWN_ACTION",
  "ERR_INVALID_TARGET",
  "ERR_CANNOT_PAY_COST",
  "ERR_INVALID_CHOICE",
  "ERR_INVARIANT_FAILED",
  "ai_action_forbidden",
  "ai_debug_contract_missing",
  "ai_decision_action_not_legal",
  "ai_decision_failed",
  "ai_deck_snapshot_empty",
  "ai_deck_snapshot_invalid",
  "ai_deck_snapshot_missing",
  "ai_deck_snapshot_side_mismatch",
  "ai_deck_snapshot_stale",
  "ai_deck_snapshot_unknown_card",
  "ai_engine_action_rejected",
  "ai_forfeit_forbidden",
  "ai_no_action",
  "ai_not_active",
  "ai_randomized_selection_requires_execution",
  "ai_session_forbidden",
  "bad_message",
  "bad_request",
  "chat_empty",
  "countdown_not_active",
  "countdown_not_due",
  "host_required",
  "invalid_token",
  "join_corp_deck_missing",
  "join_deck_invalid",
  "join_runner_deck_missing",
  "leave_requires_joiner",
  "lobby_not_available",
  "lobby_not_ready",
  "match_active",
  "match_not_active",
  "match_not_cancellable",
  "match_not_leavable",
  "match_pending",
  "match_terminal",
  "not_found",
  "not_joined",
  "preview_mode_forbidden",
  "preview_side_forbidden",
  "preview_side_not_active",
  "rate_limited",
  "reconnected_elsewhere",
  "series_finished",
  "series_game_not_finished",
  "series_next_exists",
  "series_not_available",
  "server_operation_failed",
  "side_taken",
  "side_unavailable",
  "stale_match",
  "stale_state",
  "time_expired",
  "unauthorized",
  "undo_blocked",
  "undo_not_available",
  "wrong_session",
] as const;

export type ApiUserErrorCode = (typeof API_USER_ERROR_CODES)[number];

export type ApiUserErrorDescriptor = {
  code: ApiUserErrorCode;
};

export type ApiUserErrorPayload = ApiUserErrorDescriptor & {
  diagnosticCode?: string;
  currentStateVersion?: number;
  playerView?: import("./index").PlayerView;
};

export type ApiLobbyPresentationDescriptor = {
  code: "lobby_waiting_for_participant_deck";
  participant: "player_b";
};

const API_USER_ERROR_CODE_SET = new Set<string>(API_USER_ERROR_CODES);

export function isApiUserErrorCode(value: string): value is ApiUserErrorCode {
  return API_USER_ERROR_CODE_SET.has(value);
}
