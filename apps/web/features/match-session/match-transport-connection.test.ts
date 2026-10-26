import { describe, expect, it, vi } from "vitest";
import type { ApiServerMessage } from "@netgrid/shared";
import { openMatchConnection } from "./match-transport-connection";

class TestSocket {
  readonly OPEN = 1;
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  send(value: string) {
    this.sent.push(value);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  receive(message: ApiServerMessage) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

function fixture(reconnecting = false) {
  const socket = new TestSocket();
  const options = {
    session: {
      matchId: "match-test",
      side: "runner" as const,
      sessionToken: "synthetic-session",
      reconnectToken: "synthetic-reconnect",
      displayName: "Test",
      webSocketUrl: "ws://127.0.0.1:8787/ws",
    },
    reconnecting,
    onMessage: vi.fn(),
    setConnection: vi.fn(),
    notice: vi.fn(),
    onAttemptSettled: vi.fn(),
  };
  const connection = openMatchConnection(
    options,
    () => socket as unknown as WebSocket,
  )!;
  return { socket, options, connection };
}
const joined: ApiServerMessage = {
  type: "match_joined",
  payload: { matchId: "match-test", side: "runner" },
};

describe("authenticated match transport", () => {
  it.each([false, true])(
    "ignores late acknowledgements after deliberately closing a connection (joined=%s)",
    (alreadyJoined) => {
      const f = fixture(true);
      f.socket.open();
      if (alreadyJoined) f.socket.receive(joined);
      f.connection.close();
      const stateCount = f.options.setConnection.mock.calls.length;
      f.socket.receive(joined);
      expect(f.options.setConnection).toHaveBeenCalledTimes(stateCount);
      expect(f.options.setConnection).toHaveBeenLastCalledWith("offline");
      expect(f.connection.isJoined()).toBe(false);
      expect(f.connection.send("submit_action", {})).toBe(false);
      expect(f.options.onAttemptSettled).toHaveBeenCalledTimes(1);
    },
  );
  it("ends an unacknowledged join visibly and ignores its late acknowledgement", () => {
    vi.useFakeTimers();
    const f = fixture(true);
    try {
      f.socket.open();
      vi.advanceTimersByTime(10_000);
      expect(f.options.onMessage).toHaveBeenCalledWith({
        type: "error",
        payload: { code: "not_joined" },
      });
      expect(f.options.setConnection).toHaveBeenLastCalledWith("offline");
      f.socket.receive(joined);
      expect(f.connection.isJoined()).toBe(false);
    } finally {
      f.connection.dispose();
      vi.useRealTimers();
    }
  });
  it("keeps an open socket connecting and blocks actions until the exact join acknowledgement", () => {
    const f = fixture();
    f.socket.open();
    expect(f.options.setConnection.mock.calls).toEqual([["connecting"]]);
    expect(JSON.parse(f.socket.sent[0]!)).toMatchObject({
      type: "join_match",
      payload: { matchId: "match-test", side: "runner" },
    });
    expect(f.connection.send("submit_action", {})).toBe(false);
    expect(f.socket.sent).toHaveLength(1);
    f.socket.receive(joined);
    expect(
      f.connection.send("submit_action", { actionId: "offered-action" }),
    ).toBe(true);
    expect(f.options.setConnection).toHaveBeenLastCalledWith("online");
    expect(f.socket.sent).toHaveLength(2);
  });
  it.each(["unauthorized", "rate_limited"] as const)(
    "closes a rejected %s join without reporting success",
    (code) => {
      const f = fixture(true);
      f.socket.open();
      f.socket.receive({ type: "error", payload: { code } });
      expect(f.options.onMessage).toHaveBeenCalledWith({
        type: "error",
        payload: { code },
      });
      expect(f.options.setConnection).toHaveBeenLastCalledWith("offline");
      expect(f.options.notice).not.toHaveBeenCalledWith("reconnectCompleted");
      expect(f.connection.isJoined()).toBe(false);
      expect(f.socket.readyState).toBe(3);
      f.socket.receive(joined);
      expect(f.connection.isJoined()).toBe(false);
    },
  );
  it.each([
    { matchId: "other-match", side: "runner" as const },
    { matchId: "match-test", side: "corp" as const },
  ])("rejects an acknowledgement for another binding (%j)", (payload) => {
    const f = fixture();
    f.socket.open();
    f.socket.receive({ type: "match_joined", payload });
    expect(f.options.onMessage).toHaveBeenCalledWith({
      type: "error",
      payload: { code: "wrong_session" },
    });
    expect(f.connection.isJoined()).toBe(false);
    expect(f.options.setConnection).toHaveBeenLastCalledWith("offline");
  });
  it("reports reconnect success once and only after acknowledgement", () => {
    const f = fixture(true);
    f.socket.open();
    expect(f.options.notice).not.toHaveBeenCalled();
    f.socket.receive(joined);
    f.socket.receive(joined);
    expect(f.options.notice.mock.calls).toEqual([["reconnectCompleted"]]);
    expect(f.options.onAttemptSettled).toHaveBeenCalledTimes(1);
  });
  it("does not let a disposed socket generation change the current connection", () => {
    const old = fixture(true);
    old.socket.open();
    old.connection.dispose();
    const current = fixture(true);
    current.socket.open();
    current.socket.receive(joined);
    const states = old.options.setConnection.mock.calls.length;
    old.socket.receive(joined);
    old.socket.open();
    old.socket.onerror?.();
    expect(old.options.setConnection).toHaveBeenCalledTimes(states);
    expect(old.options.notice).not.toHaveBeenCalledWith("reconnectCompleted");
    expect(current.connection.isJoined()).toBe(true);
  });
  it("keeps an authenticated connection for ordinary rejected actions", () => {
    const f = fixture();
    f.socket.open();
    f.socket.receive(joined);
    const error: ApiServerMessage = {
      type: "error",
      payload: { code: "stale_state" },
    };
    f.socket.receive(error);
    expect(f.options.onMessage).toHaveBeenCalledWith(error);
    expect(f.connection.isJoined()).toBe(true);
  });
  it.each(["close", "error"] as const)(
    "settles a failed reconnect on %s and ignores late acknowledgements",
    (event) => {
      const f = fixture(true);
      f.socket.open();
      if (event === "close") f.socket.close();
      else f.socket.onerror?.();
      f.socket.receive(joined);
      expect(f.connection.send("submit_action", {})).toBe(false);
      expect(f.options.notice).toHaveBeenCalledWith("reconnectServerFailed");
      expect(f.options.onAttemptSettled).toHaveBeenCalledTimes(1);
    },
  );
  it("handles a constructor failure without an open or usable connection", () => {
    const f = fixture();
    const connection = openMatchConnection(f.options, () => {
      throw new Error("invalid URL");
    });
    expect(connection).toBeUndefined();
    expect(f.options.setConnection).toHaveBeenLastCalledWith("offline");
    expect(f.options.notice).toHaveBeenCalledWith("webSocketStartFailed");
    f.connection.dispose();
  });
});
