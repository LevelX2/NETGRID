import { describe, expect, it } from "vitest";
import { buildActionCardSemanticProfilesByDefinitionId } from "./action-card-semantic-profiles";

describe("ActionCardSemanticProfiles", () => {
  it("keeps legacy hint role fields as compatibility signals", () => {
    const profiles = Object.values(buildActionCardSemanticProfilesByDefinitionId());
    const tacticCompatibilityLeaks = profiles.flatMap((profile) =>
      profile.tacticSignals.filter(legacyCompatibilitySignal),
    );
    const compatibilitySignals = profiles.flatMap(
      (profile) => profile.compatibilitySignals ?? [],
    );

    expect(tacticCompatibilityLeaks).toEqual([]);
    expect(compatibilitySignals.some(legacyCompatibilitySignal)).toBe(true);
  });
});

function legacyCompatibilitySignal(signal: string): boolean {
  return (
    signal.startsWith("role:") ||
    signal.startsWith("plan_role:") ||
    signal.startsWith("line_support:") ||
    signal.startsWith("strategic_role:")
  );
}
