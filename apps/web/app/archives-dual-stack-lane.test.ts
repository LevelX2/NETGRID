import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { archiveCardStepPx } from "../features/game-board/archive-stack-layout";

const globalsCss = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("archiveCardStepPx", () => {
  it("keeps the default card step while the archive stack fits", () => {
    expect(
      archiveCardStepPx({
        availableWidth: 1320,
        archiveCardScale: 1,
        faceupItemCount: 18,
        facedownItemCount: 5,
        hasToggleColumn: true,
      }),
    ).toBe(50);
  });

  it("compresses the archive card step when both archive piles would exceed the lane", () => {
    expect(
      archiveCardStepPx({
        availableWidth: 850,
        archiveCardScale: 1,
        faceupItemCount: 18,
        facedownItemCount: 5,
        hasToggleColumn: true,
      }),
    ).toBe(28);
  });

  it("clamps to a small visible step instead of returning a negative overlap", () => {
    expect(
      archiveCardStepPx({
        availableWidth: 300,
        archiveCardScale: 1,
        faceupItemCount: 18,
        facedownItemCount: 18,
        hasToggleColumn: true,
      }),
    ).toBe(8);
  });
});

describe("corp server width contract", () => {
  it("keeps empty Archives and HQ content-sized unless their card stack needs compression", () => {
    expect(globalsCss).not.toMatch(/\.server\[data-server-id="archives"\]\s*\{[^}]*flex:\s*1/s);
    expect(globalsCss).toMatch(/\.server\[data-server-id="archives"\]:has\(\.archivesDualStack\)/);
    expect(globalsCss).toMatch(/\.corpHqServer\s*\{[^}]*flex:\s*0 1 auto[^}]*width:\s*fit-content/s);
    expect(globalsCss).toMatch(/\.fixedZoneCards\.corpHqHandCards\s*\{[^}]*width:\s*fit-content/s);
  });
});
