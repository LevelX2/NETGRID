import { renderToStaticMarkup } from "react-dom/server";
import { IntlProvider } from "use-intl/react";
import { describe, expect, it } from "vitest";
import messages from "../../messages/de.json";
import type { VisibleChoiceRequest } from "../../lib/presented-player-view";
import { TracePaymentChoice } from "./TracePaymentChoice";

const payment = {
  bid: 6,
  minimumSpecializedAmount: 4,
  requiredTraceCounters: 2,
};

function renderChoice(counterAmount: number): string {
  const choice: VisibleChoiceRequest = {
    choiceId: 4,
    source: "trace:1:corp_payment",
    side: "corp",
    prompt: "Zahlungsquellen wählen",
    kind: "select_option",
    minSelections: 0,
    maxSelections: 2,
    stateVersion: 3,
    visibility: "hidden_info_barrier",
    traceCorpPayment: payment,
    options: [
      {
        id: 1,
        label: "Krumz",
        metadata: {
          traceCorpPaymentSource: {
            kind: "corp_trace_bit_pool",
            maxAmount: 3,
            recommendedAmount: 3,
          },
        },
      },
      {
        id: 2,
        label: "Hacker Tracker Central",
        metadata: {
          traceCorpPaymentSource: {
            kind: "corp_trace_counter_pool",
            maxAmount: 3,
            recommendedAmount: counterAmount,
          },
        },
      },
    ],
  };
  return renderToStaticMarkup(
    <IntlProvider locale="de" timeZone="Europe/Berlin" messages={messages}>
      <TracePaymentChoice
        choice={choice}
        payment={payment}
        disabled={false}
        onSubmit={() => undefined}
      />
    </IntlProvider>,
  );
}

describe("compact Corp Trace payment", () => {
  it("shows one bounded input per source and one confirmation", () => {
    const markup = renderChoice(2);
    expect(markup.match(/type="number"/g)).toHaveLength(2);
    expect(markup).toContain("Hacker Tracker Central");
    expect(markup).toContain("Übrige Zahlungsquellen: 1");
    expect(markup).toContain('type="submit">Zahlung bestätigen');
  });

  it("keeps confirmation disabled until the trace counter minimum is covered", () => {
    expect(renderChoice(1)).toContain('type="submit" disabled=""');
  });
});
