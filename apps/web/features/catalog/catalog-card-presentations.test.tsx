import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import {
  publicCardPresentation,
  publicCardTitle,
} from "../../app/public-card-presentation";
import {
  CatalogCardPresentationsProvider,
  catalogCardPresentationsFor,
  useCatalogCardPresentations,
} from "./catalog-card-presentations";

describe("catalog card presentations", () => {
  it("projects only sanitized title data and retains catalog identities", () => {
    const sourceRows = [
      {
        catalogCardId: 587,
        title: "Runner Identity",
        type: "identity",
        rulesText: "must not cross the presentation boundary",
      },
      {
        catalogCardId: 597,
        title: "Simple Fracter",
        type: "program",
        engine: { hidden: true },
      },
      {
        catalogCardId: 42,
        title: "Gypsy™ Schedule Analyzer",
        type: "hardware",
        planningAnnotations: { hidden: true },
      },
    ];
    const presentations = catalogCardPresentationsFor(sourceRows);

    expect(presentations).toEqual({
      587: { title: "Runner Identity", type: "identity" },
      597: { title: "Simple Fracter", type: "program" },
      42: {
        title: "Gypsy™ Schedule Analyzer",
        type: "hardware",
      },
    });
  });

  it("keeps migrated cards fail-closed without the injected DTO", () => {
    expect(publicCardTitle(597)).toBeUndefined();
    expect(publicCardPresentation(597)).toBeUndefined();
    expect(
      publicCardTitle(42),
    ).toBeUndefined();
    expect(
      publicCardPresentation(42),
    ).toBeUndefined();
    expect(
      publicCardTitle(597, {
        597: { title: "Simple Fracter", type: "program" },
      }),
    ).toBe("Simple Fracter");
    expect(
      publicCardTitle(42, {
        42: {
          title: "Gypsy™ Schedule Analyzer",
          type: "hardware",
        },
      }),
    ).toBe("Gypsy™ Schedule Analyzer");
  });

  it("makes an asynchronously replaceable DTO value visible to components", () => {
    function Probe() {
      const presentations = useCatalogCardPresentations();
      return createElement(
        "span",
        null,
        publicCardTitle(597, presentations),
      );
    }

    expect(renderToStaticMarkup(createElement(Probe))).toBe("<span></span>");
    expect(
      renderToStaticMarkup(
        createElement(CatalogCardPresentationsProvider, {
          value: {
            597: {
              title: "Simple Fracter",
              type: "program",
            },
          },
          children: createElement(Probe),
        }),
      ),
    ).toBe("<span>Simple Fracter</span>");
  });
});
