import { describe, expect, it } from "vitest";

import { isProtectionDefinitionId } from "./protection-definition";

describe("protection definition", () => {
  it("recognizes remote protection from structured card effects", () => {
    expect(isProtectionDefinitionId(573)).toBe(false);
    expect(isProtectionDefinitionId(578)).toBe(true);
    expect(
      isProtectionDefinitionId(582),
    ).toBe(true);
  });

  it("does not infer protection from definition-id text", () => {
    expect(isProtectionDefinitionId("custom-red-herrings-proxy")).toBe(false);
    expect(isProtectionDefinitionId("test_tesseract_remote")).toBe(false);
    expect(isProtectionDefinitionId("namatoki_like_upgrade")).toBe(false);
  });
});
