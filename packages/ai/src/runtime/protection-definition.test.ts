import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
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

  it("does not assign protection to an unregistered definition", () => {
    expect(
      isProtectionDefinitionId(syntheticCardDefinitionId("unknown-upgrade")),
    ).toBe(false);
  });
});
