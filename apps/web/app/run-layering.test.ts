import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readCssWithImports(url: URL, seen = new Set<string>()): string {
  const key = url.href;
  if (seen.has(key)) return "";
  seen.add(key);
  const source = readFileSync(url, "utf8");
  return source.replace(/^@import\s+"(.+)";/gm, (_match, specifier: string) => readCssWithImports(new URL(specifier, url), seen));
}

const css = readCssWithImports(new URL("./globals.css", import.meta.url));

function zLayer(name: string): number {
  const match = css.match(new RegExp(`--${name}:\\s*(\\d+);`));
  expect(match, `missing --${name}`).not.toBeNull();
  return Number(match![1]);
}

function selectorBlock(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`));
  expect(match, `missing ${selector}`).not.toBeNull();
  return match![1]!;
}

describe("run window layering", () => {
  it("keeps the run overlay above normal board surfaces and below card detail overlays", () => {
    expect(selectorBlock(".runTimelineOverlay")).toContain("z-index: var(--z-run-overlay)");
    expect(selectorBlock(".cardChoiceOverlay")).toContain("z-index: var(--z-card-choice-overlay)");
    expect(selectorBlock(".accessRevealOverlay")).toContain("z-index: var(--z-access-reveal-overlay)");
    expect(selectorBlock(".cardTooltip")).toContain("z-index: var(--z-card-tooltip-overlay)");

    const runOverlay = zLayer("z-run-overlay");
    expect(runOverlay).toBeGreaterThan(180);
    expect(runOverlay).toBeGreaterThan(95);
    expect(runOverlay).toBeLessThan(zLayer("z-card-choice-overlay"));
    expect(runOverlay).toBeLessThan(zLayer("z-access-reveal-overlay"));
    expect(runOverlay).toBeLessThan(zLayer("z-card-tooltip-overlay"));
  });

  it("keeps stack-search card choices readable instead of overlapped", () => {
    expect(selectorBlock(".cardChoiceDialog.readableCards .cardChoiceOverlapRow")).toContain("display: grid");
    expect(selectorBlock(".cardChoiceDialog.readableCards .cardChoiceOverlapRow")).toContain("minmax(184px, 1fr)");
    expect(selectorBlock(".cardChoiceDialog.readableCards .cardChoiceOverlapRow")).toContain("grid-auto-rows: auto");
    expect(selectorBlock(".cardChoiceDialog.readableCards .cardChoiceOverlapRow")).toContain("align-items: flex-start");
    expect(selectorBlock(".cardChoiceDialog.readableCards .cardChoiceOptionSlot")).toContain("flex: 1 1 auto");
    expect(selectorBlock(".cardChoiceDialog.readableCards .cardChoiceOptionSlot")).toContain("min-width: 0");
    expect(selectorBlock(".cardChoiceDialog.readableCards .cardChoiceOptionSlot + .cardChoiceOptionSlot")).toContain("margin-left: 0");
    expect(selectorBlock(".cardChoiceOrderBadge")).toContain("position: absolute");
    expect(selectorBlock(".cardChoiceOrderBadge")).toContain("pointer-events: none");
  });

  it("keeps access reveal cards primary with compact round actions", () => {
    expect(selectorBlock(".accessRevealBody")).toContain("grid-template-columns: minmax(220px, 292px) minmax(150px, 180px)");
    expect(selectorBlock(".accessRevealCard")).toContain("width: min(292px, 100%)");
    expect(selectorBlock(".accessRevealActions .button")).toContain("border-radius: 999px");
    expect(selectorBlock(".accessRevealActionButton")).toContain("height: auto");
    expect(selectorBlock(".accessRevealActionButton")).toContain("grid-template-columns: auto minmax(0, 1fr) auto");
  });

  it("defines subtle ambience backgrounds for interaction windows", () => {
    for (const asset of [
      "/backgrounds/run-movement-ambience.png",
      "/backgrounds/access-scan-ambience.png",
      "/backgrounds/damage-impact-ambience.png",
      "/backgrounds/trace-signal-ambience.png",
      "/backgrounds/pump-breaker-ambience.png",
      "/backgrounds/trash-shred-ambience.png",
    ]) {
      expect(css).toContain(`url("${asset}")`);
    }
    for (const ambience of [
      "ambience-movement",
      "ambience-access",
      "ambience-damage",
      "ambience-trace",
      "ambience-pump",
      "ambience-trash",
    ]) {
      expect(css).toContain(`.${ambience}`);
    }
    expect(css).toContain("--interaction-ambience-opacity: 0.12");
    expect(css).toContain("--interaction-ambience-opacity: 0.13");
    expect(css).toContain("--interaction-ambience-opacity: 0.14");
    expect(css).toContain("var(--interaction-ambience-image)");
  });
});
