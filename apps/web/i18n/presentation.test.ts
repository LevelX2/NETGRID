import { describe, expect, it } from "vitest";
import { API_USER_ERROR_CODES } from "@netgrid/shared";

import deMessages from "../messages/de.json";
import enMessages from "../messages/en.json";
import frMessages from "../messages/fr.json";
import { USER_ERROR_MESSAGE_KEYS, userErrorMessageKey } from "./presentation";

describe("client-owned semantic presentation", () => {
  it("maps every shared error code to a message available in every locale", () => {
    for (const code of API_USER_ERROR_CODES) {
      const key = userErrorMessageKey(code);
      expect(USER_ERROR_MESSAGE_KEYS[code]).toBe(key);
      expect(deMessages.Errors[key]).toBeTruthy();
      expect(enMessages.Errors[key]).toBeTruthy();
      expect(frMessages.Errors[key]).toBeTruthy();
    }
  });

  it("lets two clients render the same semantics independently", () => {
    const key = userErrorMessageKey("stale_state");
    expect(deMessages.Errors[key]).not.toBe(enMessages.Errors[key]);
    expect(deMessages.Errors[key]).toContain("Spielzustand");
    expect(enMessages.Errors[key]).toContain("game state");
    expect(frMessages.Errors[key]).toContain("jeu");
  });
});
