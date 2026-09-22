import type { ApiServerMessage } from "@netgrid/shared";

type ActionReceipt = Extract<
  ApiServerMessage,
  { type: "action_receipt" }
>["payload"];

export type MatchNotice = {
  text: string;
  actionFailure?: ActionReceipt;
  staleRecovery?: {
    matchId: string;
    side: "corp" | "runner";
    stateVersion: number;
  };
};

export function noticeAfterStateUpdate(
  notice: MatchNotice,
  state: NonNullable<MatchNotice["staleRecovery"]>,
): MatchNotice {
  const recovery = notice.staleRecovery;
  return recovery &&
    recovery.matchId === state.matchId &&
    recovery.side === state.side &&
    state.stateVersion >= recovery.stateVersion
    ? { text: "" }
    : notice;
}

export function noticeAfterActionReceipt(
  notice: MatchNotice,
  receipt: ActionReceipt,
): MatchNotice {
  if (!receipt.accepted) return { ...notice, actionFailure: receipt };
  if (
    receipt.matchId !== undefined &&
    receipt.side !== undefined &&
    noticeAfterStateUpdate(notice, {
      matchId: receipt.matchId,
      side: receipt.side,
      stateVersion: receipt.stateVersionAfter,
    }) !== notice
  )
    return { text: "" };
  const failure = notice.actionFailure;
  if (
    failure &&
    receipt.matchId !== undefined &&
    receipt.side !== undefined &&
    receipt.matchId === failure.matchId &&
    receipt.side === failure.side
  ) {
    return { text: "" };
  }
  return notice;
}

export function noticeAfterServerError(
  notice: MatchNotice,
  errorCode: string,
  text: string,
  recovery?: MatchNotice["staleRecovery"],
): MatchNotice {
  if (
    (errorCode === "stale_state" || errorCode === "ERR_STALE_STATE") &&
    recovery
  )
    return { text, staleRecovery: recovery };
  // The server sends the rejected receipt before its localized error.
  // Other errors and ordinary notices do not belong to that action.
  return notice.actionFailure?.errorCode === errorCode
    ? { text, actionFailure: notice.actionFailure }
    : { text };
}
