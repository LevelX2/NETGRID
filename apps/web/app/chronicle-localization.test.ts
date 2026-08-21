import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";

import deMessages from "../messages/de.json";
import enMessages from "../messages/en.json";
import frMessages from "../messages/fr.json";
import type { AppLocale } from "../i18n/locale";
import {
  formatChronicleEffectItems,
  formatChronicleEvent,
  type ChronicleTranslate,
} from "./chronicle";

const messagesByLocale = { de: deMessages, en: enMessages, fr: frMessages };

const translate = (locale: AppLocale): ChronicleTranslate =>
  createTranslator({
    locale,
    messages: messagesByLocale[locale],
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
  it("renders the same public event independently in every locale", () => {
    const gained = event("gain_credits", { amount: 3 });
    const de = formatChronicleEvent(gained, "runner", {
      translate: translate("de"),
    });
    const en = formatChronicleEvent(gained, "runner", {
      translate: translate("en"),
    });
    const fr = formatChronicleEvent(gained, "runner", {
      translate: translate("fr"),
    });

    expect(de.title).toBe("Du: 3 Credits erhalten.");
    expect(en.title).toBe("You: gained 3 credits.");
    expect(fr.title).toBe("Vous : avez gagné 3 crédits.");
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

  it("names keep and mulligan setup decisions instead of using a generic choice message", () => {
    const kept = event("resolve_choice", {
      actor: "runner",
      setupStep: "mulligan",
      setupSide: "runner",
      setupDecision: "keep",
    });
    const mulligan = event("resolve_choice", {
      actor: "corp",
      setupStep: "mulligan",
      setupSide: "corp",
      setupDecision: "mulligan",
      aiReasonCode: "setup_mulligan",
    });

    const deKept = formatChronicleEvent(kept, "runner", {
      translate: translate("de"),
    });
    const enMulligan = formatChronicleEvent(mulligan, "runner", {
      translate: translate("en"),
    });

    expect(deKept).toMatchObject({
      title: "Du: Starthand behalten (kein Mulligan).",
      category: "system",
      visibility: "system",
      groupLabel: "System",
    });
    expect(enMulligan).toMatchObject({
      title: "The Corp AI: took a mulligan and drew a new opening hand.",
      category: "system",
      visibility: "system",
      groupLabel: "System",
    });
    expect(`${deKept.title} ${enMulligan.title}`).not.toContain(
      "resolved a choice",
    );
  });

  it("locates hidden Corp installs without exposing their card identity", () => {
    const hiddenIce = event("install_card", {
      actor: "corp",
      aiReasonCode: "install_ice",
      redactedKind: "installed_card",
      serverId: "remote_2",
      installPlacement: "ice",
      cardDefinitionId: "secret_ice",
    });
    const hiddenRoot = event("install_card", {
      actor: "corp",
      aiReasonCode: "install_root",
      redactedKind: "installed_card",
      serverId: "hq",
      installPlacement: "root",
      cardDefinitionId: "secret_agenda_or_asset_or_upgrade",
    });
    const presentations = {
      secret_ice: { title: "Secret ICE", type: "ice" },
      secret_agenda_or_asset_or_upgrade: {
        title: "Secret Root Card",
        type: "agenda",
      },
    };

    const enIce = formatChronicleEvent(hiddenIce, "runner", {
      translate: translate("en"),
      cardPresentationsById: presentations,
    });
    const deRoot = formatChronicleEvent(hiddenRoot, "runner", {
      translate: translate("de"),
      cardPresentationsById: presentations,
    });

    expect(enIce.title).toBe(
      "The Corp AI: installed an ICE protecting Remote 2.",
    );
    expect(deRoot.title).toBe(
      "Die Korp-KI: eine verdeckte Karte im Root von HQ installiert.",
    );
    expect(enIce.visibility).toBe("redacted");
    expect(deRoot.visibility).toBe("redacted");
    expect(JSON.stringify([enIce, deRoot])).not.toMatch(
      /Secret ICE|Secret Root Card|secret_ice|secret_agenda/,
    );
  });

  it("describes a hidden turn-end discard instead of showing a generic choice", () => {
    const discard = event("resolve_choice", {
      actor: "corp",
      label: "Discard wurde abgeschlossen.",
      choiceKind: "select_cards",
      discardResolved: true,
      discardSide: "corp",
      discardCount: 1,
      discardZone: "archives",
      redactedKind: "hidden_zone",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "discard_phase",
      aiReasonCode: "plan_first.corp.hand_and_agenda_management",
    });

    const en = formatChronicleEvent(discard, "runner", {
      translate: translate("en"),
    });
    const de = formatChronicleEvent(discard, "runner", {
      translate: translate("de"),
    });

    expect(en).toMatchObject({
      title:
        "The Corp AI: discarded 1 card to Archives at the end of the turn.",
      category: "hidden",
      visibility: "redacted",
      icon: "discard",
    });
    expect(de.title).toBe(
      "Die Korp-KI: am Zugende 1 Karte ins Archiv abgeworfen.",
    );
    expect(`${en.title} ${de.title}`).not.toMatch(
      /resolved a choice|Auswahl aufgelöst/,
    );
  });

  it("describes the public steps and lethal access effect of the R&D run", () => {
    const presentations = {
      krash: { title: "Krash", type: "program" },
      brain_wash: { title: "Brain Wash", type: "ice" },
      fetal_ai: { title: "Fetal AI", type: "agenda" },
    };
    const context = {
      translate: translate("de"),
      cardPresentationsById: presentations,
      runServerLabel: "R&D",
    };
    const pump = formatChronicleEvent(
      event("pump_breaker", {
        cardDefinitionId: "krash",
        pumpStrengthAmount: 1,
      }),
      "runner",
      context,
    );
    const broken = formatChronicleEvent(
      event("break_subroutine", {
        cardDefinitionId: "krash",
        targetIceDefinitionId: "brain_wash",
        targetIceTitle: "Brain Wash",
        subroutineIndex: 0,
      }),
      "runner",
      context,
    );
    const passed = formatChronicleEvent(
      event("continue_run", {
        encounterContinue: true,
        unbrokenSubroutineCount: 0,
        sourceDefinitionId: "brain_wash",
      }),
      "runner",
      context,
    );
    const continued = formatChronicleEvent(
      event("continue_run", { runPhase: "movement" }),
      "runner",
      context,
    );
    const access = event("access_card", {
      serverLabel: "R&D",
      cardDefinitionId: "fetal_ai",
      title: "Fetal AI",
      damageResolved: true,
      damageType: "net",
      damageAmount: 2,
      flatline: true,
      gameEndReason: "flatline",
      publicRevealKind: "reveal",
      publicRevealDefinitionId: "fetal_ai",
      resolvedEffects: [
        {
          effectId: "fetal-ai-damage",
          kind: "damage",
          visibility: "hidden_info_barrier",
          side: "runner",
          amount: 2,
          damageType: "net",
          reason: "access_effect",
          sourceDefinitionId: "fetal_ai",
          sourceTitle: "Fetal AI",
        },
      ],
      redactedKind: "hidden_zone",
      hiddenZoneBarrier: true,
    });
    const accessItem = formatChronicleEvent(access, "runner", context);
    const effectItems = formatChronicleEffectItems(
      access,
      "runner",
      presentations,
      translate("de"),
    );
    const damageItem = effectItems.find((item) => item.id.includes(":effect:"));
    const terminalItem = effectItems.find((item) =>
      item.id.includes(":game-end:"),
    );

    expect(pump.title).toBe("Du: Stärke von Krash um 1 erhöht.");
    expect(broken.title).toBe("Du: erste Subroutine von Brain Wash gebrochen.");
    expect(passed.title).toBe("Du: Brain Wash passiert.");
    expect(continued.title).toBe("Du: Run auf R&D fortgesetzt.");
    expect(accessItem.title).toBe("Du: auf Fetal AI in R&D zugegriffen.");
    expect(damageItem).toMatchObject({
      title: "Du: 2 Net Damage durch Fetal AI erlitten und dadurch flatlined.",
      category: "danger",
      importance: "critical",
      visibility: "public",
    });
    expect(terminalItem).toMatchObject({
      title: "Du hast das Spiel durch Flatline verloren.",
      category: "danger",
      importance: "critical",
      visibility: "public",
    });
  });

  it("names damage from a publicly identified installed access card", () => {
    const access = event("access_card", {
      serverLabel: "Remote 1",
      cardDefinitionId: "fetal_ai",
      title: "Fetal AI",
      damageResolved: true,
      damageType: "net",
      damageAmount: 2,
      flatline: false,
      resolvedEffects: [
        {
          effectId: "fetal-ai-remote-damage",
          kind: "damage",
          visibility: "hidden_info_barrier",
          side: "runner",
          amount: 2,
          damageType: "net",
          reason: "access_effect",
          sourceDefinitionId: "fetal_ai",
          sourceTitle: "Fetal AI",
        },
      ],
      redactedKind: "hidden_zone",
      hiddenZoneBarrier: true,
    });
    const context = {
      translate: translate("en"),
      cardPresentationsById: {
        fetal_ai: { title: "Fetal AI", type: "agenda" },
      },
    };
    const accessItem = formatChronicleEvent(access, "runner", context);

    const [damageItem] = formatChronicleEffectItems(
      access,
      "runner",
      context.cardPresentationsById,
      translate("en"),
    );

    expect(accessItem).toMatchObject({
      title: "You: accessed Fetal AI in Remote 1.",
      visibility: "public",
      cardDefinitionId: "fetal_ai",
      cardTitle: "Fetal AI",
    });
    expect(damageItem).toMatchObject({
      title: "You: suffered 2 net damage from Fetal AI.",
      category: "danger",
      importance: "important",
      visibility: "public",
      cardDefinitionId: "fetal_ai",
      cardTitle: "Fetal AI",
    });
    expect(damageItem?.title).not.toBe("A hidden effect resolved.");
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

    for (const locale of ["de", "en", "fr"] as const) {
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
