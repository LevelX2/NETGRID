import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import deMessages from "../messages/de.json";

describe("DamageImpactOverlay lifecycle", () => {
  const overlaySource = () =>
    readFileSync(
      new URL("../features/actions/DamageImpactOverlay.tsx", import.meta.url),
      "utf8",
    );

  it("requires manual confirmation instead of auto-dismissing damage impact", () => {
    const source = overlaySource();

    expect(source).not.toContain("setTimeout(() => setCurrentDamageImpact(null)");
    expect(source).toContain('aria-label={t("confirmWindow")}');
    expect(source).toMatch(/<Check size=\{14\} \/>\s+\{t\("continue"\)\}\s+<\/button>/);
    expect(deMessages.Actions.damage.confirmWindow).toBe("Damage-Fenster bestätigen");
  });

  it("shows a zero line and overkill labels instead of an unlabeled Grip-Pool delta", () => {
    const source = overlaySource();

    expect(source).toContain('className="damageImpactZero"');
    expect(source).toContain('t("zeroLine")');
    expect(source).toContain('t("flatlineOverkillSummary"');
    expect(source).toContain('t("overkill"');
    expect(deMessages.Actions.damage.zeroLine).toBe("Null-Linie");
    expect(source).not.toContain("<span>-{cue.amount}</span>");
  });

  it("renders prevented zero damage without the impact meter", () => {
    const source = overlaySource();

    expect(source).toContain("const preventedDamage = cue.amount === 0 && !cue.flatline;");
    expect(source).toContain('preventedDamage ? "is-prevented" : ""');
    expect(source).toContain('t("preventedTitle"');
    expect(source).toContain("!preventedDamage ? (");
    expect(source).toContain('t("prevented")');
  });

  it("keeps queue, flatline, and core-damage copy explicit", () => {
    const source = overlaySource();

    expect(source).toContain('t("queued"');
    expect(source).toContain('cue.flatline ? t("flatline")');
    expect(source).toContain('cue.damageType === "core"');
    expect(source).toContain('t("type.core")');
    expect(source).toContain("runnerMaxHandSizeAfter");
    expect(source).toContain('interactionAmbienceClassName("damage")');
    expect(source).toContain('t("damageSummary"');
  });
});
