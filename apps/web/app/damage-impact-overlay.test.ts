import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("DamageImpactOverlay lifecycle", () => {
  const pageSource = () =>
    readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

  it("requires manual confirmation instead of auto-dismissing damage impact", () => {
    const source = pageSource();

    expect(source).not.toContain("setTimeout(() => setCurrentDamageImpact(null)");
    expect(source).toContain('aria-label="Damage-Fenster bestätigen"');
    expect(source).toMatch(/<Check size=\{14\} \/>\s+Weiter\s+<\/button>/);
  });
});
