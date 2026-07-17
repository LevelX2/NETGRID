import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAppBuildInfo } from "../lib/app-build-info";

describe("web client release status", () => {
  it("shows product version V0.9 with the current clean build number", () => {
    const pageSource = readFileSync(
      new URL("./page.tsx", import.meta.url),
      "utf8",
    );
    const buildInfo = createAppBuildInfo({
      buildNumber: "5527",
      commit: "8265b038d",
      sourceDate: "2026-07-17T07:41:53+02:00",
      dirty: "false",
    });

    expect(pageSource).toContain(
      "const APP_STATUS_LABEL = NETGRID_APP_STATUS_LABEL;",
    );
    expect(buildInfo.statusLabel).toBe("V0.9 · Build 5527");
    expect(buildInfo.sourceDate).toBe("17.07.2026, 07:41 Uhr");
    expect(buildInfo.developmentStatus).toBe("Lokaler Entwicklungsstand");
  });

  it("marks a build with uncommitted changes as a development build", () => {
    const buildInfo = createAppBuildInfo({
      buildNumber: "5527",
      commit: "8265b038d",
      sourceDate: "2026-07-17T07:41:53+02:00",
      dirty: "true",
    });

    expect(buildInfo.statusLabel).toBe("V0.9 · Build 5527-dev");
    expect(buildInfo.developmentStatus).toBe(
      "Lokaler Entwicklungsstand mit nicht committeten Änderungen",
    );
  });

  it("uses the match end state to suppress transient active-match overlays", () => {
    const pageSource = readFileSync(
      new URL("./page.tsx", import.meta.url),
      "utf8",
    );
    const normalizedPageSource = pageSource.replace(/\s+/g, " ");

    expect(pageSource).toContain("const matchEnded = Boolean(");
    expect(pageSource).toContain(
      "const overlayPresentation = matchOverlayPresentation({",
    );
    expect(normalizedPageSource).toContain(
      "const showAccessReveal = overlayPresentation.showAccessReveal;",
    );
    expect(normalizedPageSource).toContain(
      "const showResultModal = overlayPresentation.showResultModal;",
    );
    expect(normalizedPageSource).toContain(
      "const showFloatingActionPanel = Boolean( activeMatchIsGame && !matchEnded",
    );
    expect(normalizedPageSource).toContain(
      "{activeMatchIsGame && !matchEnded && activeView?.run ? (",
    );
  });
});
