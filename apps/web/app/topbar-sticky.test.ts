import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("global sticky header", () => {
  it("pins the topbar independently of an active match", () => {
    expect(globalsCss).toMatch(
      /\.app\s*>\s*\.topbar\s*\{[^}]*position:\s*sticky[^}]*top:\s*0/s,
    );
    expect(globalsCss).not.toMatch(/\.app\.activeMatch\s*>\s*\.topbar/);
  });

  it("keeps the entry navigation below the measured topbar", () => {
    expect(globalsCss).toMatch(
      /\.entryTabs\s*\{[^}]*position:\s*sticky[^}]*top:\s*var\(--entry-tabs-sticky-top,\s*0px\)/s,
    );
    expect(globalsCss).toMatch(
      /\.setup\.v07Entry\s*>\s*\.entryTabs\s*\{[^}]*position:\s*sticky[^}]*z-index:\s*20[^}]*background:\s*var\(--entry-tabs-bg\)/s,
    );
    expect(pageSource).toContain('"--entry-tabs-sticky-top": `${topbarHeightPx}px`');
    expect(pageSource).toContain('<header className="topbar" ref={topbarRef}>');
  });

  it("places the entry navigation close to the topbar", () => {
    expect(globalsCss).toMatch(
      /\.setup\.v07Entry\s*\{[^}]*padding:\s*4px\s+14px\s+40px/s,
    );
  });

  it("disables both parts through the existing header setting", () => {
    expect(globalsCss).toMatch(
      /\.app\.topbarStickyDisabled\s*>\s*\.topbar\s*\{[^}]*position:\s*relative/s,
    );
    expect(globalsCss).toMatch(
      /\.app\.topbarStickyDisabled\s+\.entryTabs\s*\{[^}]*position:\s*relative/s,
    );
    expect(pageSource).toContain(
      'className={`app ${topbarStickyEnabled ? "" : "topbarStickyDisabled"}`}',
    );
  });
});
