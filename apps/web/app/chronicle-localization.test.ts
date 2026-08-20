import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";

import deMessages from "../messages/de.json";
import enMessages from "../messages/en.json";
import {
  formatChronicleEffectItems,
  formatChronicleEvent,
  type ChronicleTranslate,
} from "./chronicle";

const translate = (locale: "de" | "en"): ChronicleTranslate =>
  createTranslator({
    locale,
    messages: locale === "de" ? deMessages : enMessages,
    namespace: "Chronicle",
  }) as unknown as ChronicleTranslate;

function event(
  actionType: string,
  payload: Record<string, unknown> = {},
): PublicGameEvent {
  return {
    eventId: `evt_${actionType}`,
    type: actionType,
    stateVersionBefore: 3,
    stateVersionAfter: 4,
    stateHashAfter: "fnv1a:test",
    publicPayload: { actor: "runner", actionType, ...payload },
  };
}

describe("semantic chronicle localization", () => {
  it("renders the same public event independently in both locales", () => {
    const gained = event("gain_credits", { amount: 3 });
    const de = formatChronicleEvent(gained, "runner", {
      translate: translate("de"),
    });
    const en = formatChronicleEvent(gained, "runner", {
      translate: translate("en"),
    });

    expect(de.title).toBe("Du: 3 Credits erhalten.");
    expect(en.title).toBe("You: gained 3 credits.");
    expect(de.category).toBe(en.category);
    expect(de.id).toBe(en.id);
  });

  it("uses public card semantics without changing technical identity", () => {
    const installed = event("install_card", {
      cardDefinitionId: "public_card",
    });
    const presentations = {
      public_card: { title: "Public Card", type: "program" },
    };
    const de = formatChronicleEvent(installed, "runner", {
      translate: translate("de"),
      cardPresentationsById: presentations,
    });
    const en = formatChronicleEvent(installed, "runner", {
      translate: translate("en"),
      cardPresentationsById: presentations,
    });

    expect(de.cardDefinitionId).toBe("public_card");
    expect(en.cardDefinitionId).toBe("public_card");
    expect(de.title).toContain("Public Card");
    expect(en.title).toContain("Public Card");
  });

  it("keeps hidden effect identities redacted in every locale", () => {
    const hidden = event("resolve_choice", {
      resolvedEffects: [
        {
          effectId: "hidden-effect",
          kind: "trash_card",
          visibility: "private_to_side",
          side: "corp",
          sourceDefinitionId: "secret_card",
          sourceTitle: "Secret Card",
          amount: 1,
        },
      ],
    });

    for (const locale of ["de", "en"] as const) {
      const [item] = formatChronicleEffectItems(
        hidden,
        "runner",
        undefined,
        translate(locale),
      );
      expect(item?.visibility).toBe("redacted");
      expect(JSON.stringify(item)).not.toContain("Secret Card");
      expect(JSON.stringify(item)).not.toContain("secret_card");
    }
  });
});
