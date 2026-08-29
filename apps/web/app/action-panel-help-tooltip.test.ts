import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("action panel help tooltip", () => {
  it("uses the explanatory NETGRID tooltip without a native title", () => {
    const source = readFileSync(
      new URL("../features/actions/ActionControls.tsx", import.meta.url),
      "utf8",
    );

    const floatButtonSource = source.slice(
      source.indexOf("export function ActionPanelFloatButton"),
      source.indexOf("export function PriorityWindowHoldToggle"),
    );
    expect(floatButtonSource).toContain('className="actionControlHelpTooltip"');
    expect(floatButtonSource).toContain('role="tooltip"');
    expect(floatButtonSource).toContain('t("floatHelp")');
    expect(floatButtonSource).toContain("aria-describedby");
    expect(floatButtonSource).not.toContain("title=");
  });

  it("uses overflow-aware tooltips for generic choice options", () => {
    const source = readFileSync(
      new URL("../features/actions/LegalActionsPanel.tsx", import.meta.url),
      "utf8",
    );

    const genericChoiceSource = source.slice(
      source.indexOf("genericChoice.options.map"),
      source.indexOf('if (view.phase === "setup")'),
    );
    expect(genericChoiceSource).toContain("<OverflowAwareActionButton");
    expect(genericChoiceSource).toContain(
      "const label = choiceOptionPresentationLabel(",
    );
    expect(genericChoiceSource).toContain("label={label}");
    expect(genericChoiceSource).toContain(
      'data-testid="generic-choice-button"',
    );
  });
});
