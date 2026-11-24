import { renderToStaticMarkup } from "react-dom/server";
import { IntlProvider } from "use-intl/react";
import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import messages from "../../messages/de.json";
import { CardView } from "./CardView";

const ice: VisibleCard = {
  instanceId: "ice",
  definitionId: 459,
  title: "Haunting Inquisition",
  known: true,
  type: "ice",
  rezzed: true,
  strengthModifier: 1,
};

function renderIce(card: VisibleCard, forceCardBack?: "corp") {
  return renderToStaticMarkup(
    <IntlProvider locale="de" messages={messages} timeZone="UTC">
      <CardView
        card={card}
        displayMode="placeholder"
        {...(forceCardBack ? { forceCardBack } : {})}
      />
    </IntlProvider>,
  );
}

function markedIce(amount: number): VisibleCard {
  return {
    ...ice,
    counterDisplays: [
      {
        id: "ice_mark_modifier",
        amount,
        displayKind: "generic_counter",
        label: "ICE-Modifikator",
        ariaLabel: "ICE-Mark-Modifikator",
        counterType: "mark",
        usageHint: "status_marker",
      },
    ],
  };
}

describe("Ice Transmutation on the ICE card", () => {
  it.each([
    [1, "×2"],
    [2, "×3"],
  ])("shows one multiplier for %i marks", (amount, label) => {
    const markup = renderIce(markedIce(amount));
    expect(markup.match(/data-testid="ice-transmutation-badge"/g)).toHaveLength(
      1,
    );
    expect(markup).toContain(`<span>${label}</span>`);
    expect(markup).toContain('data-testid="strength-modifier-badge"');
  });

  it("uses the quoted total including a separately granted subroutine", () => {
    const card = markedIce(1);
    card.effectiveRunQuote = {
      iceInstanceId: ice.instanceId,
      iceDefinitionId: 459,
      effectiveStrength: 6,
      subroutines: [
        { id: "0", type: "set_runner_run_lock_actions" },
        { id: "1", type: "set_runner_run_lock_actions" },
        { id: "2", type: "end_the_run" },
        { id: "3", type: "end_the_run" },
        {
          id: "4",
          type: "end_the_run",
          dynamicSourceKind: "additional_subroutine",
        },
      ],
    };
    const markup = renderIce(card);
    expect(markup).toContain("<span>×2</span>");
    expect(markup).toContain("Die Gesamtzahl der Subroutinen beträgt 5.");
  });

  it("requires a visible card face and a positive mark on that instance", () => {
    for (const markup of [
      renderIce(ice),
      renderIce(markedIce(0)),
      renderIce({ ...markedIce(1), known: false }),
      renderIce(markedIce(1), "corp"),
    ]) {
      expect(markup).not.toContain("ice-transmutation-badge");
      expect(markup).not.toContain("Ice Transmutation");
    }
  });
});
