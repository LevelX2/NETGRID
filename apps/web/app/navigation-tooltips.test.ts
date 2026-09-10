import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const appShellSource = readFileSync(
  resolve(process.cwd(), "features/app-shell/AppShell.tsx"),
  "utf8",
);
const cssSource = readFileSync(
  resolve(process.cwd(), "app/globals.css"),
  "utf8",
);

describe("active workspace navigation tooltips", () => {
  it("uses accessible descriptive tooltips instead of native title attributes", () => {
    expect(appShellSource).toContain('className="workspaceNavTooltip"');
    expect(appShellSource).toContain('role="tooltip"');
    expect(appShellSource).toContain("aria-describedby={tooltipId}");
    expect(appShellSource).not.toContain("title={item.title}");
    for (const key of [
      "activeGameHelp",
      "catalogHelp",
      "decksHelp",
      "gamesHelp",
      "recentHelp",
      "optionsHelp",
    ]) {
      expect(appShellSource).toContain(`t("${key}")`);
    }
  });

  it("delays hover discovery without delaying keyboard focus", () => {
    expect(cssSource).toMatch(
      /\.activeWorkspaceButton:hover \.workspaceNavTooltip[\s\S]*?transition-delay: 1s;/,
    );
    expect(cssSource).toMatch(
      /\.activeWorkspaceButton:focus-visible \.workspaceNavTooltip[\s\S]*?transition-delay: 0s;/,
    );
  });
});
