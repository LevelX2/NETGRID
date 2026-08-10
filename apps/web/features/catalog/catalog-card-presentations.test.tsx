import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import {
  publicCardPresentation,
  publicCardTitle,
} from "../../app/legacy-card-definition-compatibility";
import {
  CatalogCardPresentationsProvider,
  catalogCardPresentationsFor,
  useCatalogCardPresentations,
} from "./catalog-card-presentations";

describe("catalog card presentations", () => {
  it("projects only sanitized title data and retains catalog identities", () => {
    const sourceRows = [
      {
        catalogCardId: "runner_identity_001",
        title: "Runner Identity",
        type: "identity",
        rulesText: "must not cross the presentation boundary",
      },
      {
        catalogCardId: "simple_fracter",
        title: "Simple Fracter",
        type: "program",
        engine: { hidden: true },
      },
      {
        catalogCardId: "onr_classic_038_gypsytm-schedule-analyzer",
        title: "Gypsy™ Schedule Analyzer",
        type: "hardware",
        planningAnnotations: { hidden: true },
      },
    ];
    const presentations = catalogCardPresentationsFor(sourceRows);

    expect(presentations).toEqual({
      runner_identity_001: { title: "Runner Identity", type: "identity" },
      simple_fracter: { title: "Simple Fracter", type: "program" },
      "onr_classic_038_gypsytm-schedule-analyzer": {
        title: "Gypsy™ Schedule Analyzer",
        type: "hardware",
      },
    });
  });

  it("keeps migrated cards fail-closed without the injected DTO", () => {
    expect(publicCardTitle("simple_fracter")).toBeUndefined();
    expect(publicCardPresentation("simple_fracter")).toBeUndefined();
    expect(
      publicCardTitle("onr_classic_038_gypsytm-schedule-analyzer"),
    ).toBeUndefined();
    expect(
      publicCardPresentation("onr_classic_038_gypsytm-schedule-analyzer"),
    ).toBeUndefined();
    expect(
      publicCardTitle("simple_fracter", {
        simple_fracter: { title: "Simple Fracter", type: "program" },
      }),
    ).toBe("Simple Fracter");
    expect(
      publicCardTitle("onr_classic_038_gypsytm-schedule-analyzer", {
        "onr_classic_038_gypsytm-schedule-analyzer": {
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
        publicCardTitle("simple_fracter", presentations),
      );
    }

    expect(renderToStaticMarkup(createElement(Probe))).toBe("<span></span>");
    expect(
      renderToStaticMarkup(
        createElement(CatalogCardPresentationsProvider, {
          value: {
            simple_fracter: {
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
