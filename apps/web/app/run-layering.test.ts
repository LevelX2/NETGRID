import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readCssWithImports(url: URL, seen = new Set<string>()): string {
  const key = url.href;
  if (seen.has(key)) return "";
  seen.add(key);
  const source = readFileSync(url, "utf8");
  return source.replace(/^@import\s+"(.+)";/gm, (_match, specifier: string) => readCssWithImports(new URL(specifier, url), seen));
}

const css = readCssWithImports(new URL("./globals.css", import.meta.url));
const scoredAgendaOverlaySource = readFileSync(
  new URL("../features/game-board/ScoredAgendaOverlay.tsx", import.meta.url),
  "utf8",
);
const opponentActionOverlaySource = readFileSync(
  new URL("../features/actions/OpponentActionOverlay.tsx", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const optionsPanelSource = readFileSync(
  new URL("../features/settings/OptionsPanel.tsx", import.meta.url),
  "utf8",
);
const accessReviewModalSource = readFileSync(
  new URL("../features/actions/AccessReviewModals.tsx", import.meta.url),
  "utf8",
);
const damageImpactOverlaySource = readFileSync(
  new URL("../features/actions/DamageImpactOverlay.tsx", import.meta.url),
  "utf8",
);
const windowEventIconSource = readFileSync(
  new URL("../features/actions/WindowEventIcon.tsx", import.meta.url),
  "utf8",
);
const windowEventIconKindSource = readFileSync(
  new URL("../features/actions/window-event-icon-kind.ts", import.meta.url),
  "utf8",
);

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

  it("keeps the access cue mounted in manual and automatic AI advance paths", () => {
    expect(
      pageSource.match(
        /setCurrentActionCue\(actionCueAfterAiAdvanceRequest\)/g,
      ),
    ).toHaveLength(2);
  });

  it("defines subtle ambience backgrounds for interaction windows", () => {
    for (const asset of [
      "/backgrounds/run-movement-ambience.png",
      "/backgrounds/access-scan-ambience.png",
      "/backgrounds/damage-impact-ambience.png",
      "/backgrounds/trace-signal-ambience.png",
      "/backgrounds/pump-breaker-ambience.png",
      "/backgrounds/trash-shred-ambience.png",
      "/backgrounds/agenda-ability-ambience.png",
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
      "ambience-agenda",
    ]) {
      expect(css).toContain(`.${ambience}`);
    }
    expect(css).toContain("--interaction-ambience-opacity: 0.12");
    expect(css).toContain("--interaction-ambience-opacity: 0.13");
    expect(css).toContain("--interaction-ambience-opacity: 0.14");
    expect(css).toContain("var(--interaction-ambience-image)");
    expect(css).toContain(".scoredAgendaPanel");
    expect(scoredAgendaOverlaySource).toContain(
      'interactionAmbienceClassName("agenda")',
    );
    expect(opponentActionOverlaySource).toContain(
      "actionCueInteractionAmbience",
    );
    expect(opponentActionOverlaySource).toContain("WindowEventIcon");
    expect(selectorBlock('.opponentCueOverlay[class*="ambience-"]')).toContain(
      "isolation: isolate",
    );
    expect(
      selectorBlock('.opponentCueOverlay[class*="ambience-"]::before'),
    ).toContain("var(--interaction-ambience-image)");
    expect(
      existsSync(
        new URL(
          "../public/backgrounds/agenda-ability-ambience.png",
          import.meta.url,
        ),
      ),
    ).toBe(true);
  });

  it("keeps damage ambience from overriding the fixed damage overlay placement", () => {
    expect(selectorBlock(".damageImpactOverlay")).toContain("position: fixed");
    expect(selectorBlock(".damageImpactOverlay.ambience-damage")).toContain("position: fixed");
    expect(css).toContain("rgb(8 12 16 / 0.18)");
    expect(css).toContain("border-radius: inherit");
  });

  it("provides a locally toggleable subdued cyberspace board background", () => {
    expect(css).toContain("/backgrounds/cyberspace-board-background.png");
    expect(css).toContain(
      'background: url("/backgrounds/cyberspace-board-background.png")',
    );
    expect(pageSource).toContain("cyberspaceBackgroundEnabled");
    expect(optionsPanelSource).toContain(
      'data-testid="cyberspace-background-toggle"',
    );
    expect(
      existsSync(
        new URL(
          "../public/backgrounds/cyberspace-board-background.png",
          import.meta.url,
        ),
      ),
    ).toBe(true);
  });

  it("keeps the access ambience visible and adds large event icons", () => {
    expect(css).toContain("--interaction-ambience-opacity: 0.32");
    expect(css).toMatch(/\.windowEventIcon\s*\{[\s\S]*?width: 128px;/);
    expect(accessReviewModalSource).toContain(
      '<WindowEventIcon kind="access" side={review.actorSide} />',
    );
    expect(accessReviewModalSource).toContain("<AccessDamageStage");
    expect(accessReviewModalSource).toContain(
      'data-testid="access-damage-stage"',
    );
    expect(opponentActionOverlaySource).toMatch(
      /className="opponentCueMessage">\s*<WindowEventIcon/,
    );
    expect(selectorBlock(".opponentCueMessage")).toContain(
      "grid-template-rows: 128px auto",
    );
    expect(damageImpactOverlaySource).toContain(
      '<WindowEventIcon kind={`${cue.damageType}-damage`} side="runner" />',
    );
    expect(css).toContain(".windowEventIcon-side-runner");
    expect(css).toContain(".windowEventIcon-side-corp");
    expect(windowEventIconSource).toContain("data-window-event-side={side ?? undefined}");
    expect(windowEventIconSource).toContain("data-window-event-side-glyph={side}");
    for (const icon of [
      "agenda",
      "ice-pass",
      "access",
      "trash",
      "trace",
      "pump-break",
      "net-damage",
      "meat-damage",
      "core-damage",
      "draw-card",
      "gain-credit",
      "install-card",
      "play-card",
      "rez-card",
      "advance-card",
      "remove-tag",
      "purge",
      "card-ability",
      "choice",
      "run-end",
      "turn-end",
      "action",
    ]) {
      expect(css).toContain(`url("/icons/window-events/${icon}.png")`);
      expect(
        existsSync(
          new URL(`../public/icons/window-events/${icon}.png`, import.meta.url),
        ),
      ).toBe(true);
    }
    expect(windowEventIconKindSource).toContain(
      'if (ambience === "movement") return "ice-pass"',
    );
    expect(windowEventIconSource).toContain('kind === "gain-tag"');
    expect(windowEventIconSource).toContain("windowEventIconBadge");
    expect(css).toContain(".windowEventIcon-gain-tag");
    expect(css).toContain(".windowEventIconBadge");
    expect(opponentActionOverlaySource).toContain(
      "windowEventIconKindForActionCue",
    );
    for (const target of ["hq", "rd", "archives", "remote"]) {
      expect(css).toContain(`.windowEventIcon-run-${target}`);
    }
    expect(accessReviewModalSource).toContain("Runner erleidet ${cue.amount}");
    expect(accessReviewModalSource).toContain('/[.!?]$/.test(sourceLabel.trim())');
    expect(accessReviewModalSource).toContain("hasSingleRevealedCard");
    expect(accessReviewModalSource).toContain("accessRevealSingleRevealedCard");
  });

  it("serializes access damage and AI pacing through one presentation", () => {
    expect(pageSource).toContain(
      "currentDamageImpact.eventId === accessReveal.eventId",
    );
    expect(pageSource).toContain("interactionPresentationBlocked");
    expect(pageSource).toContain("damageImpact={accessDamageImpact}");
    expect(pageSource).toContain(
      "interactionPresentationBlocksAi({",
    );
    expect(pageSource).toContain("coalesceAccessActionCues(");
    expect(accessReviewModalSource).toContain(
      'data-testid="access-damage-stage"',
    );
    expect(accessReviewModalSource).toContain("reveal.outcomeStatus");
  });

  it("keeps multiaccess reviews match-scoped and acknowledgment-driven", () => {
    expect(pageSource).toContain("setDismissedAccessEventIds([])");
    expect(pageSource).toContain("setPendingAccessPresentationEvents([])");
    expect(pageSource).toContain("appendPendingAccessPresentationEvents(");
    expect(pageSource).toContain("dismissPendingAccessPresentationEvent(");
    expect(accessReviewModalSource).toContain(
      'reveal.progressStatus ?? "Zugriff"',
    );
  });
});
