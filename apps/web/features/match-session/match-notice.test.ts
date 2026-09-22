import { describe, expect, it } from "vitest";
import {
  noticeAfterActionReceipt,
  noticeAfterServerError,
  noticeAfterStateUpdate,
} from "./match-notice";

const rejected = {
  accepted: false,
  errorCode: "ERR_UNKNOWN_ACTION",
  matchId: "match_credit",
  side: "corp" as const,
  stateVersionAfter: 52,
};
const accepted = {
  accepted: true,
  matchId: rejected.matchId,
  side: rejected.side,
  stateVersionAfter: 53,
};

function rejectedCreditNotice() {
  return noticeAfterServerError(
    noticeAfterActionReceipt({ text: "" }, rejected),
    rejected.errorCode,
    "This action is no longer legal.",
  );
}

describe("action error notice lifecycle", () => {
  const recovery = {
    matchId: "match_credit",
    side: "corp" as const,
    stateVersion: 52,
  };
  it.each(["stale_state", "ERR_STALE_STATE"])(
    "clears %s without a rejected receipt after synchronization",
    (code) => {
      const notice = noticeAfterServerError(
        { text: "" },
        code,
        "Reloaded",
        recovery,
      );
      expect(noticeAfterStateUpdate(notice, recovery)).toEqual({ text: "" });
      expect(noticeAfterActionReceipt(notice, accepted)).toEqual({ text: "" });
      expect(
        noticeAfterStateUpdate(notice, { ...recovery, stateVersion: 51 }),
      ).toBe(notice);
      expect(
        noticeAfterStateUpdate(notice, { ...recovery, matchId: "other" }),
      ).toBe(notice);
      expect(
        noticeAfterStateUpdate(notice, { ...recovery, side: "runner" }),
      ).toBe(notice);
    },
  );
  it("preserves a newer unrelated error after stale recovery", () => {
    const stale = noticeAfterServerError(
      { text: "" },
      "stale_state",
      "Reloaded",
      recovery,
    );
    const next = noticeAfterServerError(
      stale,
      "ai_decision_failed",
      "AI failed",
    );
    expect(noticeAfterStateUpdate(next, recovery)).toBe(next);
    expect(noticeAfterActionReceipt(next, accepted)).toBe(next);
  });
  it("clears the localized rejection after a confirmed successful action", () => {
    expect(noticeAfterActionReceipt(rejectedCreditNotice(), accepted)).toEqual({
      text: "",
    });
  });

  it("keeps the error when another action is rejected", () => {
    expect(
      noticeAfterActionReceipt(rejectedCreditNotice(), rejected).text,
    ).toBe("This action is no longer legal.");
  });

  it.each([
    { ...accepted, matchId: "another_match" },
    { ...accepted, side: "runner" as const },
    { accepted: true, side: accepted.side, stateVersionAfter: 53 },
  ])(
    "does not clear an error for a different or unbound receipt",
    (receipt) => {
      const notice = rejectedCreditNotice();
      expect(noticeAfterActionReceipt(notice, receipt)).toBe(notice);
    },
  );

  it("preserves a newer connection error", () => {
    const notice = noticeAfterServerError(
      rejectedCreditNotice(),
      "server_operation_failed",
      "Server unavailable",
    );
    expect(noticeAfterActionReceipt(notice, accepted)).toEqual({
      text: "Server unavailable",
    });
  });

  it("preserves ordinary notices that replaced the action error", () => {
    expect(noticeAfterActionReceipt({ text: "Deck saved" }, accepted)).toEqual({
      text: "Deck saved",
    });
  });

  it("does not clear a server error without a rejected action receipt", () => {
    const notice = noticeAfterServerError(
      { text: "" },
      "ai_decision_failed",
      "AI failed",
    );
    expect(noticeAfterActionReceipt(notice, accepted)).toBe(notice);
  });
});
