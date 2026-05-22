import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

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
    expect(selectorBlock(".cardChoiceDialog.readableCards .cardChoiceOverlapRow")).toContain("minmax(190px, 1fr)");
    expect(selectorBlock(".cardChoiceDialog.readableCards .cardChoiceOptionSlot + .cardChoiceOptionSlot")).toContain("margin-left: 0");
  });
});
