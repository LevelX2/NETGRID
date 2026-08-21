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
});
