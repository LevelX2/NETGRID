import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("web client release status", () => {
  it("shows the visible client version at V1.9.22 after the completion gate", () => {
    const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

    expect(pageSource).toContain('const APP_STATUS_LABEL = "V1.9.22";');
    expect(pageSource).not.toContain('const APP_STATUS_LABEL = "V1.9.21";');
  });

  it("uses the match end state to suppress transient active-match overlays", () => {
    const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

    expect(pageSource).toContain("const matchEnded = Boolean(");
    expect(pageSource).toContain("const showAccessReveal = Boolean(accessReveal && !matchEnded");
    expect(pageSource).toContain("const showFloatingActionPanel = Boolean(activeMatchIsGame && !matchEnded");
    expect(pageSource).toContain("{activeMatchIsGame && !matchEnded && activeView?.run ? (");
  });
});
