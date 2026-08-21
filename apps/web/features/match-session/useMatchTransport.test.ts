import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import deMessages from "../../messages/de.json";
import enMessages from "../../messages/en.json";
import frMessages from "../../messages/fr.json";

const transportSource = readFileSync(
  resolve(process.cwd(), "features/match-session/useMatchTransport.ts"),
  "utf8",
);
const pageSource = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");

const transportNoticeKeys = [
  "webSocketStartFailed",
  "reconnectCompleted",
  "reconnectServerFailed",
  "reconnecting",
  "serverOffline",
] as const;

describe("localized match transport notices", () => {
  it("resolves every transport status through the current Notices translator", () => {
    expect(pageSource).toContain("translateNotice: (key) => noticeT(key)");
    for (const key of transportNoticeKeys) {
      expect(transportSource).toContain(`translateNoticeRef.current("${key}")`);
    }
    expect(transportSource).not.toContain("Wiederverbindung abgeschlossen.");
    expect(transportSource).not.toContain("WebSocket-Verbindung konnte");
  });

  it("provides distinct German, English, and French transport statuses", () => {
    for (const key of transportNoticeKeys) {
      expect(enMessages.Notices[key]).toBeTruthy();
      expect(deMessages.Notices[key]).toBeTruthy();
      expect(frMessages.Notices[key]).toBeTruthy();
      expect(enMessages.Notices[key]).not.toBe(deMessages.Notices[key]);
      expect(enMessages.Notices[key]).not.toBe(frMessages.Notices[key]);
    }
    expect(enMessages.Notices.reconnectCompleted).toBe(
      "Reconnection completed.",
    );
  });
});
