import { expect, type Page } from "@playwright/test";

const DOM_FORBIDDEN = [
  /sessionToken/i,
  /reconnectToken/i,
  /joinToken/i,
  /hostSessionToken/i,
  /hostReconnectToken/i,
  /privatePayload/i,
  /cardInstances/i,
  /decklist/i,
  /deckHash/i,
  /cardDefinitionId/i,
  /\/api\/card-images\/back_/i
];

const PAYLOAD_FORBIDDEN = [
  /sessionToken/i,
  /reconnectToken/i,
  /joinToken/i,
  /hostSessionToken/i,
  /hostReconnectToken/i,
  /privatePayload/i,
  /cardInstances/i,
  /decklist/i,
  /\/api\/card-images\/back_/i
];

export type FrameCapture = {
  received: string[];
};

export function captureServerFrames(page: Page): FrameCapture {
  const capture: FrameCapture = { received: [] };
  page.on("websocket", (socket) => {
    socket.on("framereceived", (event) => capture.received.push(String(event.payload)));
  });
  return capture;
}

export async function expectNoDomOrLocalStorageLeaks(page: Page, hiddenTitles: string[] = []): Promise<void> {
  const surface = await page.evaluate(() => {
    const attrs = Array.from(document.querySelectorAll("*"))
      .map((element) =>
        ["src", "alt", "title", "aria-label", "aria-describedby", "class", "data-testid", "data-server-id", "data-action-type"]
          .map((name) => element.getAttribute(name))
          .filter(Boolean)
          .join(" ")
      )
      .filter(Boolean)
      .join("\n");
    const localStorageEntries = Object.entries(window.localStorage).map(([key, value]) => `${key}=${value}`).join("\n");
    return `${document.body.innerText}\n${attrs}\n${localStorageEntries}`;
  });

  for (const pattern of DOM_FORBIDDEN) {
    expect(surface, `DOM/localStorage leak pattern ${pattern}`).not.toMatch(pattern);
  }
  for (const title of hiddenTitles.filter(Boolean)) {
    expect(surface, `hidden card title leaked: ${title}`).not.toContain(title);
  }
}

export function expectNoServerPayloadLeaks(capture: FrameCapture): void {
  const received = capture.received.join("\n");
  for (const pattern of PAYLOAD_FORBIDDEN) {
    expect(received, `received WebSocket payload leak pattern ${pattern}`).not.toMatch(pattern);
  }
}

export async function expectRecentSessionsAreSanitized(page: Page): Promise<void> {
  const recent = await page.evaluate(() => window.localStorage.getItem("netrunner.recentSessions") ?? "");
  for (const pattern of DOM_FORBIDDEN) {
    expect(recent, `recent session leak pattern ${pattern}`).not.toMatch(pattern);
  }
}
