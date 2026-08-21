import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const modalSource = readFileSync(
  new URL("../features/results/GameOverModal.tsx", import.meta.url),
  "utf8",
);

function selectorBlocks(selector: string): string[] {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, "g"))].map(
    (match) => match[1] ?? "",
  );
}

describe("mobile game-over layout", () => {
  it("keeps the result dialog above the sticky active-match chrome", () => {
    const overlayRules = selectorBlocks(".gameOverOverlay").join("\n");

    expect(overlayRules).toContain("z-index: 270");
  });

  it("bounds the panel to the dynamic viewport and keeps overflowing content scrollable", () => {
    const panelRules = selectorBlocks(".gameOverPanel").join("\n");

    expect(panelRules).toContain("100dvh");
    expect(panelRules).toContain("overflow-y: auto");
    expect(panelRules).toContain("overscroll-behavior: contain");
    expect(panelRules).toContain("env(safe-area-inset-top)");
    expect(panelRules).toContain("env(safe-area-inset-bottom)");
  });

  it("keeps the action footer reachable while the result content scrolls", () => {
    const footerRules = selectorBlocks(".gameOverFooter").join("\n");

    expect(footerRules).toContain("position: sticky");
    expect(footerRules).toContain("bottom: -14px");
    expect(footerRules).toContain("background: rgb(18 25 30 / 0.98)");
  });

  it("retains every optional and primary result action in the shared footer", () => {
    expect(modalSource).toContain('t("viewReplay")');
    expect(modalSource).toContain("retentionLabel");
    expect(modalSource).toContain('t("viewBoard")');
    expect(modalSource).toContain('t("nextSeriesGame")');
    expect(modalSource).toContain("exitLabel");
  });
});
