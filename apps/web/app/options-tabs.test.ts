import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const optionsSource = readFileSync(
  new URL("../features/settings/OptionsPanel.tsx", import.meta.url),
  "utf8",
).replace(/\r\n?/g, "\n");
const css = readFileSync(
  new URL("./globals.css", import.meta.url),
  "utf8",
).replace(/\r\n?/g, "\n");
const dialogSource = readFileSync(
  new URL("../features/app-shell/OptionsDialog.tsx", import.meta.url),
  "utf8",
);
const localeSource = readFileSync(
  new URL("../i18n/LocaleSelect.tsx", import.meta.url),
  "utf8",
);
const panelBody = optionsSource.slice(
  optionsSource.indexOf("export function OptionsPanel"),
  optionsSource.indexOf("function BuildInfoSettings"),
);

describe("options tabs", () => {
  it("provides exactly three semantic tabs and one labelled tabpanel", () => {
    expect(panelBody).toContain('role="tablist"');
    expect(panelBody).toContain('role="tab"');
    expect(panelBody).toContain('role="tabpanel"');
    expect(panelBody).toContain("aria-selected={activeTab === tab.id}");
    expect(panelBody).toContain("aria-controls={`options-panel-${tab.id}`}");
    expect(panelBody).toContain("aria-labelledby={`options-tab-${activeTab}`}");
    expect(panelBody).toContain('["flow", "display", "system"]');
  });

  it("supports arrow, Home and End keyboard navigation without moving focus away", () => {
    for (const key of [
      "ArrowRight",
      "ArrowDown",
      "ArrowLeft",
      "ArrowUp",
      "Home",
      "End",
    ])
      expect(panelBody).toContain(`event.key === "${key}"`);
    expect(panelBody).toContain("tabRefs.current[nextIndex]?.focus()");
    expect(panelBody).toContain("tabIndex={activeTab === tab.id ? 0 : -1}");
  });

  it("assigns flow, display and system settings to distinct branches", () => {
    expect(panelBody).toContain(
      '<GameplaySettings\n              section="flow"',
    );
    expect(panelBody).toContain(
      '<GameplaySettings\n              section="display"',
    );
    expect(panelBody).toContain("<AiPacingSettings");
    expect(panelBody).toContain("<ActionCueSettings");
    expect(panelBody).toContain("<CardSizeSettings");
    expect(panelBody).toContain("<SessionAccessSettings");
    expect(panelBody).toContain("<BuildInfoSettings />");
    expect(panelBody).toContain("<SystemStatus />");
  });

  it("keeps the self-identifying language selector in both options headers", () => {
    for (const source of [optionsSource, dialogSource]) {
      expect(source).toContain('className="optionsHeaderLocaleSelect"');
      expect(source).toContain('presentation="header"');
    }
    expect(optionsSource).not.toContain("<LocaleSettings />");
    expect(localeSource).toContain("APP_LOCALE_SELF_NAMES");
    expect(localeSource).toContain("<LanguageGlobeIcon />");
    expect(localeSource).toContain('className="optionsHeaderLocaleIconFill"');
    expect(localeSource).toContain('className="optionsHeaderLocaleIconGrid"');
    expect(css).toContain(
      ".optionsPanel > .catalogHeader > .optionsHeaderLocaleSelect",
    );
  });

  it("links contextual flow help and AI descriptions to their controls", () => {
    expect(optionsSource).toContain('role="tooltip"');
    expect(optionsSource).toContain('aria-describedby="help-auto-end-turn"');
    expect(optionsSource).toContain(
      "aria-describedby={`ai-pacing-help-${value}`}",
    );
    expect(optionsSource).toContain('aria-describedby="cue-duration-help"');
    expect(css).toContain(".settingHelp:focus-within .settingHelpTooltip");
  });

  it("keeps all three tabs visible on narrow viewports", () => {
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr));");
    expect(css).toContain("@media (max-width: 520px)");
    expect(css).toContain(".optionsTabs button");
  });
});
