import type { ApiServerMessage } from "@netgrid/shared";

type ActionReceipt = Extract<
  ApiServerMessage,
  { type: "action_receipt" }
>["payload"];

export type MatchNotice = {
  text: string;
  actionFailure?: ActionReceipt;
};

export function noticeAfterActionReceipt(
  notice: MatchNotice,
  receipt: ActionReceipt,
): MatchNotice {
  if (!receipt.accepted) return { ...notice, actionFailure: receipt };
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
): MatchNotice {
  // The server sends the rejected receipt before its localized error.
  // Other errors and ordinary notices do not belong to that action.
  return notice.actionFailure?.errorCode === errorCode
    ? { text, actionFailure: notice.actionFailure }
    : { text };
}
