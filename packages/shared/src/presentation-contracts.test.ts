import { describe, expect, it } from "vitest";

import {
  API_USER_ERROR_CODES,
  isApiUserErrorCode,
} from "./presentation-contracts";

describe("locale-neutral presentation contracts", () => {
  it("publishes a closed and unique user-error code catalog", () => {
    expect(new Set(API_USER_ERROR_CODES).size).toBe(
      API_USER_ERROR_CODES.length,
    );
    expect(isApiUserErrorCode("stale_state")).toBe(true);
    expect(isApiUserErrorCode("interne deutsche Diagnose")).toBe(false);
  });

  it("keeps localized prose outside the shared error catalog", () => {
    expect(JSON.stringify(API_USER_ERROR_CODES)).not.toMatch(
      /[äöüß]|bitte|match ist/i,
    );
  });
});
