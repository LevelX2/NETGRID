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

  it("shows a zero line and overkill labels instead of an unlabeled Grip-Pool delta", () => {
    const source = pageSource();

    expect(source).toContain('className="damageImpactZero"');
    expect(source).toContain("Null-Linie");
    expect(source).toContain("über Flatline-Schwelle");
    expect(source).toContain("Überhang +");
    expect(source).not.toContain("<span>-{cue.amount}</span>");
  });

  it("renders prevented zero damage without the impact meter", () => {
    const source = pageSource();

    expect(source).toContain("const preventedDamage = cue.amount === 0 && !cue.flatline;");
    expect(source).toContain('preventedDamage ? "is-prevented" : ""');
    expect(source).toContain("`${damageTypeLabel(cue.damageType)} verhindert`");
    expect(source).toContain("!preventedDamage ? (");
    expect(source).toContain("Verhindert");
  });
});
