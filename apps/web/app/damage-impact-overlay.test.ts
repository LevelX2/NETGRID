import { readFileSync } from "node:fs";
import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";
import deMessages from "../messages/de.json";

describe("DamageImpactOverlay lifecycle", () => {
  const overlaySource = () =>
    readFileSync(
      new URL("../features/actions/DamageImpactOverlay.tsx", import.meta.url),
      "utf8",
    );
  const pageSource = () =>
    readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  const cssSource = () =>
    readFileSync(new URL("./globals.css", import.meta.url), "utf8");

  it("requires manual confirmation instead of auto-dismissing damage impact", () => {
    const source = overlaySource();

    expect(source).not.toContain(
      "setTimeout(() => setCurrentDamageImpact(null)",
    );
    expect(source).toContain('aria-label={t("confirmWindow")}');
    expect(source).toMatch(
      /<Check size=\{14\} aria-hidden="true" \/>\s+\{t\("continue"\)\}\s+<\/button>/,
    );
    expect(deMessages.Actions.damage.confirmWindow).toBe(
      "Damage-Fenster bestätigen",
    );
  });

  it("puts the grip transition directly above the damage segments", () => {
    const source = overlaySource();
    const translate = createTranslator({
      locale: "de",
      messages: deMessages,
      namespace: "Actions.damage",
    });

    expect(source).toContain("<strong>{gripLabel}</strong>");
    expect(source).toContain("<DamageImpactMeter cue={cue} />");
    expect(
      translate("impactTitle", { amount: 2, type: translate("type.meat") }),
    ).toBe("2 Meat Damage");
    expect(translate("gripTransition", { before: 3, after: 1 })).toBe(
      "3 → 1 Karte im Grip",
    );
    expect(translate("gripTransition", { before: 3, after: 0 })).toBe(
      "3 → 0 Karten im Grip",
    );
  });

  it("renders prevented zero damage without the impact meter", () => {
    const source = overlaySource();

    expect(source).toContain(
      "const preventedDamage = cue.amount === 0 && !cue.flatline;",
    );
    expect(source).toContain('preventedDamage ? "is-prevented" : ""');
    expect(source).toContain('t("preventedTitle"');
    expect(source).toContain("!preventedDamage ? <DamageImpactMeter");
    expect(source).toContain('"preventedSource"');
  });

  it("uses the defined success token for visible remaining grip segments", () => {
    const css = cssSource();

    expect(css).toMatch(
      /\.damageImpactSegment\.remaining\s*\{[\s\S]*?var\(--ok\)/,
    );
    expect(css).toMatch(
      /\.damageImpactOverlay\.is-prevented\s*\{[\s\S]*?var\(--ok\)/,
    );
    expect(css).not.toMatch(
      /\.damageImpactSegment\.remaining\s*\{[\s\S]*?var\(--success\)/,
    );
  });

  it("keeps queue, flatline, and core-damage copy explicit", () => {
    const source = overlaySource();

    expect(source).toContain('t("queued"');
    expect(source).toMatch(/cue\.flatline\s*\?\s*t\("flatline"\)/);
    expect(source).toContain('cue.damageType === "core"');
    expect(source).toContain('t("coreDamageValue"');
    expect(source).toContain("runnerMaxHandSizeAfter");
    expect(source).toContain('interactionAmbienceClassName("damage")');
    expect(source).toContain('t("damageSummary"');
  });

  it("does not clear a terminal damage presentation when the match ends", () => {
    const source = pageSource();
    const matchEndEffect = source.match(
      /useEffect\(\(\) => \{\s+if \(!matchEnded\) return;[\s\S]*?\}, \[matchEnded, resultKey\]\);/,
    )?.[0];

    expect(matchEndEffect).toBeTruthy();
    expect(matchEndEffect).not.toContain("setDamageImpactQueue([])");
    expect(matchEndEffect).not.toContain("setCurrentDamageImpact(null)");
  });
});
