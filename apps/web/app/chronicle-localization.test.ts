import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";

import deMessages from "../messages/de.json";
import enMessages from "../messages/en.json";
import frMessages from "../messages/fr.json";
import type { AppLocale } from "../i18n/locale";
import {
  chronicleAccessOutcomePlan,
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

  it("localizes a paired recurring-credit payout as one singular credit entry", () => {
    const payout = event("end_turn", {
      actor: "runner",
      resolvedEffects: [
        {
          effectId: "gain",
          kind: "gain_credits",
          visibility: "public",
          side: "corp",
          amount: 1,
          reason: "installed_economy_start_of_corp_turn",
          sourceDefinitionId: "onr_v1_329_investment-firm",
          sourceCardInstanceId: "investment_firm_1",
          sourceTitle: "Investment Firm",
        },
        {
          effectId: "counter",
          kind: "counter_change",
          visibility: "public",
          side: "corp",
          amount: 1,
          reason: "installed_economy_start_of_corp_turn",
          counterType: "recurring_credit",
          removedCounterAmount: 1,
          remainingCounters: 1,
          sourceDefinitionId: "onr_v1_329_investment-firm",
          sourceCardInstanceId: "investment_firm_1",
          sourceTitle: "Investment Firm",
        },
      ],
    });

    const corpItems = formatChronicleEffectItems(
      payout,
      "corp",
      undefined,
      translate("de"),
    );
    const runnerItems = formatChronicleEffectItems(
      payout,
      "runner",
      undefined,
      translate("de"),
    );

    expect(corpItems).toHaveLength(1);
    expect(runnerItems).toHaveLength(1);
    expect(corpItems[0]?.title).toBe(
      "Du: 1 Credit durch Investment Firm erhalten.",
    );
    expect(runnerItems[0]?.title).toBe(
      "Die Korp: 1 Credit durch Investment Firm erhalten.",
    );
  });

  it("shows Karl de Veres' public credit after a successful run", () => {
    const runEnd = event("continue_run", {
      actor: "runner",
      runSuccessful: true,
      serverLabel: "R&D",
      successfulRunRunnerCreditGain: 1,
      gainedCredits: 1,
      karlSuccessfulRunCreditGain: 1,
      karlSuccessfulRunSourceDefinitionIds:
        "onr_v1_166_karl-de-veres-corporate-stooge",
      runnerCreditsAfter: 6,
      aiReasonCode: "plan_first.runner.pressure_central",
    });
    const presentations = {
      "onr_v1_166_karl-de-veres-corporate-stooge": {
        title: "Karl de Veres, Corporate Stooge",
        type: "resource" as const,
      },
    };

    const [de] = formatChronicleEffectItems(
      runEnd,
      "corp",
      presentations,
      translate("de"),
    );
    const [en] = formatChronicleEffectItems(
      runEnd,
      "corp",
      presentations,
      translate("en"),
    );

    expect(de).toMatchObject({
      title:
        "Die Runner-KI: 1 Credit durch Karl de Veres, Corporate Stooge erhalten.",
      category: "economy",
      importance: "important",
      visibility: "public",
      actor: "runner",
      cardDefinitionId: "onr_v1_166_karl-de-veres-corporate-stooge",
      cardTitle: "Karl de Veres, Corporate Stooge",
    });
    expect(de?.chips).toContain("+1 Credit");
    expect(en?.title).toBe(
      "The Runner AI: gained 1 credit from Karl de Veres, Corporate Stooge.",
    );
  });

  it("shows credits taken with Short-Term Contract instead of a generic ability", () => {
    const contract = event("activated_card_ability", {
      actor: "runner",
      cardDefinitionId: "onr_v1_178_short-term-contract",
      cardImplementationAbility: "activated",
      hostedCreditsTaken: 2,
      hostedCreditsAfter: 10,
      remainingCounters: 10,
      gainedCredits: 2,
      runnerCreditsAfter: 7,
      aiReasonCode: "runner_credit_bank_cash_out",
      resolvedEffects: [
        {
          effectId: "short-term-contract.take-hosted-credits",
          kind: "take_hosted_credits",
          visibility: "public",
          side: "runner",
          amount: 2,
          remainingCounters: 10,
          sourceDefinitionId: "onr_v1_178_short-term-contract",
          sourceTitle: "Short-Term Contract",
          reason: "card_resolver",
        },
      ],
    });
    const presentations = {
      "onr_v1_178_short-term-contract": {
        title: "Short-Term Contract",
        type: "resource" as const,
      },
    };

    const de = formatChronicleEvent(contract, "corp", {
      translate: translate("de"),
      cardPresentationsById: presentations,
    });
    const en = formatChronicleEvent(contract, "corp", {
      translate: translate("en"),
      cardPresentationsById: presentations,
    });
    const effects = formatChronicleEffectItems(
      contract,
      "corp",
      presentations,
      translate("de"),
    );

    expect(de).toMatchObject({
      title: "Die Runner-KI: 2 Credits von Short-Term Contract erhalten.",
      category: "economy",
      visibility: "public",
      cardDefinitionId: "onr_v1_178_short-term-contract",
      cardTitle: "Short-Term Contract",
    });
    expect(de.chips).toContain("Short-Term Contract");
    expect(de.chips).toContain("+2");
    expect(en.title).toBe(
      "The Runner AI: gained 2 credits from Short-Term Contract.",
    );
    expect(effects).toEqual([]);
    expect(`${de.title} ${en.title}`).not.toMatch(
      /Fähigkeit.+aufgelöst|resolved an ability/,
    );
  });

  it("localizes trace bids, results, and payload-based tag gains", () => {
    const corpBid = event("resolve_choice", {
      actor: "corp",
      traceStep: "corp_bid",
      corpBid: 3,
      traceValue: 7,
      runnerLink: 0,
    });
    const traceResult = event("resolve_choice", {
      actor: "runner",
      traceStep: "runner_bid",
      sourceDefinitionId: "onr_proteus_050_manhunt",
      sourceTitle: "Manhunt",
      corpBid: 3,
      runnerBid: 0,
      traceValue: 7,
      runnerStrength: 0,
      traceSuccessful: true,
      tagsAdded: 1,
      runnerTagsAfter: 1,
    });

    const deBid = formatChronicleEvent(corpBid, "corp", {
      translate: translate("de"),
    });
    const enResult = formatChronicleEvent(traceResult, "corp", {
      translate: translate("en"),
    });

    expect(deBid).toMatchObject({
      title: "Du hast im Trace 3 Credits geboten.",
      description: "Trace-Wert: 7, Runner-Link: 0.",
      category: "danger",
      visibility: "public",
    });
    expect(enResult).toMatchObject({
      title:
        "Trace resolved: You 3 credits, Runner 0 credits; trace successful; the Runner gained 1 tag.",
      description: "Final result: trace 7 against Runner strength 0.",
      category: "danger",
      visibility: "public",
    });

    const [de] = formatChronicleEffectItems(
      traceResult,
      "corp",
      undefined,
      translate("de"),
    );
    const [en] = formatChronicleEffectItems(
      traceResult,
      "corp",
      undefined,
      translate("en"),
    );
    const [fr] = formatChronicleEffectItems(
      traceResult,
      "corp",
      undefined,
      translate("fr"),
    );

    expect(de).toMatchObject({
      id: "evt_resolve_choice:tag-gain",
      title: "Der Runner hat 1 Tag erhalten.",
      description: "Auslöser: Manhunt. Der Runner hat jetzt 1 Tag.",
    });
    expect(en).toMatchObject({
      id: de?.id,
      title: "The Runner gained 1 tag.",
      description: "Source: Manhunt. The Runner now has 1 tag.",
    });
    expect(fr).toMatchObject({
      id: de?.id,
      title: "Le Runner a reçu 1 balise.",
      description: "Source : Manhunt. Le Runner a maintenant 1 balise.",
    });
    expect(de?.chips).toContain("+1 Tag");
    expect(en?.chips).toContain("+1 tag");
    expect(fr?.chips).toContain("+1 balise");
  });

  it("describes a blind Asp trace and its run-lock payment from public semantics", () => {
    const hiddenBid = event("resolve_choice", {
      actor: "corp",
      choiceKind: "bid_amount",
      redactedKind: "choice",
      traceRulesProfile: "classic_blind",
      traceBidsRevealed: false,
      traceBidCommittedSide: "corp",
      traceStep: "corp_bid",
      traceLimit: 5,
      runnerLink: 0,
    });
    const aspResult = event("resolve_choice", {
      actor: "runner",
      traceRulesProfile: "classic_blind",
      traceBidsRevealed: true,
      sourceDefinitionId: "onr_v1_221_asp",
      traceStep: "runner_bid",
      corpBid: 2,
      traceValue: 2,
      runnerBid: 1,
      runnerStrength: 1,
      traceSuccessful: true,
      tagsAdded: 0,
      runnerRunEnded: true,
      runnerRunLockCreditCost: 1,
    });
    const lockCleared = event("trigger_ability", {
      actor: "runner",
      actionCostClicks: 1,
      runnerRunLockCreditCost: 1,
      runnerRunLockCleared: true,
      abilityId: "pay_to_remove_run_lock",
      aiReasonCode: "plan_first.runner.pressure_central",
    });

    const hiddenBidItem = formatChronicleEvent(hiddenBid, "runner", {
      translate: translate("de"),
    });
    const aspResultItem = formatChronicleEvent(aspResult, "corp", {
      translate: translate("de"),
    });
    const lockClearedItem = formatChronicleEvent(lockCleared, "corp", {
      translate: translate("de"),
    });

    expect(hiddenBidItem).toMatchObject({
      title: "Die Korp hat ein verdecktes Trace-Gebot abgegeben.",
      category: "danger",
      visibility: "redacted",
    });
    expect(hiddenBidItem.title).not.toMatch(/\b0\b/);
    expect(aspResultItem).toMatchObject({
      title:
        "Trace entschieden: Du 2 Credits, Runner 1 Credit; Trace erfolgreich.",
      description:
        "Endstand: Trace 2 gegen Runner-Stärke 1; der Karteneffekt beendet den Run und sperrt weitere Runs bis zur Zahlung von 1 Credit.",
      category: "danger",
      visibility: "public",
    });
    expect(aspResultItem.chips).toEqual(
      expect.arrayContaining(["Run endet", "Run-Sperre 1"]),
    );
    expect(lockClearedItem).toMatchObject({
      title: "Die Runner-KI hat 1 Credit bezahlt und die Run-Sperre entfernt.",
      category: "run",
    });
    expect(lockClearedItem.title).not.toContain("eine Karte");
  });

  it("names a hosted-credit payout from Streetware Distributor", () => {
    const payout = event("end_turn", {
      actor: "corp",
      resolvedEffects: [
        {
          effectId: "runner.start.streetware.streetware_1",
          kind: "take_hosted_credits",
          visibility: "public",
          side: "runner",
          amount: 1,
          counterType: "bit",
          removedCounterAmount: 1,
          remainingCounters: 2,
          reason: "start_of_turn",
          sourceDefinitionId: "onr_proteus_150_streetware-distributor",
          sourceTitle: "Streetware Distributor",
        },
      ],
    });

    const [item] = formatChronicleEffectItems(
      payout,
      "runner",
      undefined,
      translate("de"),
    );
    const [englishItem] = formatChronicleEffectItems(
      payout,
      "runner",
      undefined,
      translate("en"),
    );

    expect(item).toMatchObject({
      title: "Du: 1 Credit von Streetware Distributor erhalten.",
      category: "economy",
      visibility: "public",
      actor: "runner",
      cardDefinitionId: "onr_proteus_150_streetware-distributor",
      cardTitle: "Streetware Distributor",
    });
    expect(englishItem?.title).toBe(
      "You: gained 1 credit from Streetware Distributor.",
    );
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

  it("names the program publicly revealed with Temple Microcode Outlet", () => {
    const templeSearch = event("resolve_choice", {
      actor: "runner",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_search_stack_to_grip",
      sourceDefinitionId: "temple_microcode_outlet",
      selectedCount: 1,
      movedCardCount: 1,
      searchDestination: "runner_grip",
      publicRevealKind: "reveal",
      publicRevealDefinitionId: "codecracker",
      cardDefinitionId: "codecracker",
      shuffled: true,
      aiReasonCode: "runner_stack_search_program",
    });
    const presentations = {
      temple_microcode_outlet: {
        title: "Temple Microcode Outlet",
        type: "event",
      },
      codecracker: { title: "Codecracker", type: "program" },
    };

    const de = formatChronicleEvent(templeSearch, "corp", {
      translate: translate("de"),
      cardPresentationsById: presentations,
    });
    const en = formatChronicleEvent(templeSearch, "corp", {
      translate: translate("en"),
      cardPresentationsById: presentations,
    });

    expect(de).toMatchObject({
      title:
        "Die Runner-KI hat mit Temple Microcode Outlet Codecracker aus dem Stack vorgezeigt und auf die Hand genommen.",
      category: "card",
      importance: "important",
      visibility: "public",
      cardDefinitionId: "codecracker",
      cardTitle: "Codecracker",
    });
    expect(de.chips).toContain("Temple Microcode Outlet");
    expect(de.chips).toContain("Codecracker");
    expect(en.title).toBe(
      "The Runner AI used Temple Microcode Outlet to reveal Codecracker from the stack and add it to their grip.",
    );
    expect(`${de.title} ${en.title}`).not.toMatch(
      /Auswahl aufgelöst|resolved a choice/,
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
    expect(broken.title).toBe(
      "Du: Subroutine 1 von Brain Wash mit Krash gebrochen.",
    );
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

  it("describes pay-or-end-run ICE as the runner's concrete payment", () => {
    const snowbank = event("continue_run", {
      actor: "runner",
      aiReasonCode: "runner.continue_encounter",
      encounterContinue: true,
      resolvedEffects: [
        {
          effectId: "subroutine_1",
          kind: "resolve_subroutine",
          visibility: "public",
          side: "runner",
          reason: "ice_subroutine",
          sourceDefinitionId: "snowbank",
          sourceTitle: "Snowbank",
          subroutineIndex: 0,
          subroutineType: "end_the_run_unless_runner_pays",
          paidCredits: 1,
        },
      ],
    });

    const [de] = formatChronicleEffectItems(
      snowbank,
      "corp",
      undefined,
      translate("de"),
    );
    const [en] = formatChronicleEffectItems(
      snowbank,
      "corp",
      undefined,
      translate("en"),
    );

    expect(de).toMatchObject({
      title: "Die Runner-KI: 1 Credit bezahlt, um Snowbank zu passieren.",
      category: "run",
      groupLabel: "Run auf einen Server",
      importance: "normal",
      visibility: "public",
      cardDefinitionId: "snowbank",
      cardTitle: "Snowbank",
    });
    expect(en?.title).toBe("The Runner AI: paid 1 credit to pass Snowbank.");
    expect(en?.groupLabel).toBe("Run on a server");
    expect(`${de?.title} ${en?.title}`).not.toMatch(
      /automatischer Effekt|automatic effect/,
    );
  });

  it("numbers multiaccess cards and combines access with steal or trash outcomes", () => {
    const firstAccess = {
      ...event("access_card", {
        actor: "runner",
        aiReasonCode: "runner.access",
        breachId: "breach_rd",
        accessIndex: 0,
        effectiveAccessCount: 2,
        serverLabel: "R&D",
        cardDefinitionId: "project_babylon",
        title: "Project Babylon",
        redactedKind: "hidden_zone",
        hiddenZoneBarrier: true,
      }),
      eventId: "evt_access_1",
    };
    const stolen = {
      ...event("steal_agenda", {
        actor: "runner",
        aiReasonCode: "runner.steal",
        breachId: "breach_rd",
        accessIndex: 0,
        serverLabel: "R&D",
        cardDefinitionId: "project_babylon",
        title: "Project Babylon",
        redactedKind: "hidden_zone",
        hiddenZoneBarrier: true,
      }),
      eventId: "evt_steal_1",
    };
    const secondAccess = {
      ...event("access_card", {
        actor: "runner",
        aiReasonCode: "runner.access",
        breachId: "breach_rd",
        accessIndex: 1,
        effectiveAccessCount: 2,
        serverLabel: "R&D",
        cardDefinitionId: "pad_campaign",
        title: "PAD Campaign",
        redactedKind: "hidden_zone",
        hiddenZoneBarrier: true,
      }),
      eventId: "evt_access_2",
    };
    const trashed = {
      ...event("trash_accessed_card", {
        actor: "runner",
        aiReasonCode: "runner.trash",
        breachId: "breach_rd",
        accessIndex: 1,
        serverLabel: "R&D",
        cardDefinitionId: "pad_campaign",
        title: "PAD Campaign",
        redactedKind: "hidden_zone",
        hiddenZoneBarrier: true,
      }),
      eventId: "evt_trash_2",
    };
    const events = [firstAccess, stolen, secondAccess, trashed];
    const plan = chronicleAccessOutcomePlan(events);
    const firstAccessItem = formatChronicleEvent(firstAccess, "corp", {
      translate: translate("de"),
    });
    const stolenItem = formatChronicleEvent(stolen, "corp", {
      translate: translate("de"),
      accessContext: plan.accessContextByOutcomeEventId[stolen.eventId]!,
    });
    const trashedItem = formatChronicleEvent(trashed, "corp", {
      translate: translate("de"),
      accessContext: plan.accessContextByOutcomeEventId[trashed.eventId]!,
    });

    expect(firstAccessItem.title).toBe(
      "Karte 1 von 2: Die Runner-KI hat in R&D auf Project Babylon zugegriffen.",
    );
    expect(plan.suppressedAccessEventIds).toEqual(
      new Set(["evt_access_1", "evt_access_2"]),
    );
    expect(stolenItem.title).toBe(
      "Karte 1 von 2: Die Runner-KI hat in R&D auf Project Babylon zugegriffen und die Agenda gestohlen.",
    );
    expect(stolenItem.visibility).toBe("public");
    expect(trashedItem.title).toBe(
      "Karte 2 von 2: Die Runner-KI hat in R&D auf PAD Campaign zugegriffen und die Karte getrasht.",
    );
    expect(trashedItem.visibility).toBe("public");
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
