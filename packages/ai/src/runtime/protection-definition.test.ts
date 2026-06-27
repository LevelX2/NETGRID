import { describe, expect, it } from "vitest";

import { isProtectionDefinitionId } from "./protection-definition";

describe("protection definition", () => {
  it("recognizes exact remote protection definition ids", () => {
    expect(isProtectionDefinitionId("onr_v1_361_namatoki-plaza")).toBe(true);
    expect(isProtectionDefinitionId("onr_v1_366_red-herrings")).toBe(true);
    expect(
      isProtectionDefinitionId("onr_v1_370_tesseract-fort-construction"),
    ).toBe(true);
  });

  it("ignores protection-like definition id text without an exact id match", () => {
    expect(isProtectionDefinitionId("custom-red-herrings-proxy")).toBe(false);
    expect(isProtectionDefinitionId("test_tesseract_remote")).toBe(false);
    expect(isProtectionDefinitionId("namatoki_like_upgrade")).toBe(false);
  });
});
