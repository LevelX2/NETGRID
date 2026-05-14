import { describe, expect, it } from "vitest";
import type { PublicGameEvent, Side } from "@netgrid/shared";
import { chronicleTurnNumberByEventId, formatChronicleEffectItems, formatChronicleEvent } from "./chronicle";

const ACTION_TYPES = [
  "mandatory_draw",
  "gain_credit",
  "draw_card",
  "install_card",
  "play_event",
  "play_operation",
  "advance_card",
  "score_agenda",
  "start_run",
  "rez_ice",
  "decline_rez",
  "pump_breaker",
  "break_subroutine",
  "continue_run",
  "access_card",
  "steal_agenda",
  "trash_accessed_card",
  "decline_trash",
  "remove_tag",
  "move_to_set_aside",
  "move_to_removed_from_game",
  "return_from_set_aside",
  "change_card_control",
  "end_turn",
  "game_created"
] as const;

describe("formatChronicleEvent", () => {
  it("formats all current action types without technical metadata", () => {
    for (const actionType of ACTION_TYPES) {
      const item = formatChronicleEvent(makeEvent(actionType), "runner");
      const serialized = JSON.stringify(item);

      expect(item.title.length).toBeGreaterThan(8);
      expect(serialized).not.toContain("fnv1a");
      expect(serialized).not.toContain("stateHashAfter");
      expect(serialized).not.toContain("stateVersionAfter");
      expect(serialized).not.toContain("corp.play_operation");
      expect(serialized).not.toContain("idempotencyKey");
    }
  });

  it("redacts hidden Corp installs from the Runner perspective", () => {
    const item = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "corp",
        label: "Korp installiert eine Karte.",
        redactedKind: "installed_card"
      }),
      "runner",
      {
        cardTitle: "Simple Agenda",
        cardText: "2 Agenda-Punkte.",
        cardDetailLines: ["Korp · agenda"]
      }
    );

    expect(item.title).toBe("Die Korp hat eine verdeckte Karte installiert.");
    expect(item.category).toBe("hidden");
    expect(item.visibility).toBe("redacted");
    expect(JSON.stringify(item)).not.toContain("Simple Agenda");
    expect(item.cardTitle).toBeUndefined();
    expect(item.cardText).toBeUndefined();
    expect(item.cardDetailLines).toEqual([]);
  });

  it("uses Du-perspective for own Runner runs", () => {
    const item = formatChronicleEvent(
      makeEvent("start_run", {
        actor: "runner",
        label: "Run auf R&D",
        serverLabel: "R&D"
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast einen Run auf R&D gestartet.");
    expect(item.chips).toContain("Run");
    expect(item.chips).toContain("R&D");
  });

  it("formats Coup agenda credits as card credits with the remaining amount", () => {
    const item = formatChronicleEvent(
      makeEvent("gain_credit", {
        actor: "corp",
        label: "Political Coup: 3 Credits aus Coup-Counter",
        cardDefinitionId: "onr_v1_209_political-coup",
        title: "Political Coup",
        agendaAbility: "political_coup",
        gainedCredits: 3,
        spentPowerCounters: 3,
        remainingPowerCounters: 9
      }),
      "corp"
    );

    expect(item.title).toBe("Du hast 3 Credits von Political Coup genommen.");
    expect(item.category).toBe("economy");
    expect(item.importance).toBe("important");
    expect(item.chips).toContain("+3 Credits");
    expect(item.chips).toContain("3 Credits von Karte");
    expect(item.chips).toContain("9 Credits übrig");
  });

  it("describes Broker resource actions directly instead of using the generic legal-action fallback", () => {
    const load = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        label: "Broker: 3 Credits auf Broker legen",
        title: "Broker",
        resourceAbility: "broker_load_credits",
        addedCounterAmount: 3,
        remainingCounters: 3
      }),
      "runner",
      { cardTitle: "Broker" }
    );
    const take = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        label: "Broker: 3 Credits nehmen",
        title: "Broker",
        resourceAbility: "broker_take_credits",
        gainedCredits: 3,
        remainingCounters: 0
      }),
      "runner",
      { cardTitle: "Broker" }
    );

    expect(load.title).toBe("Du hast 3 Credits auf Broker gelegt.");
    expect(load.category).toBe("economy");
    expect(load.description).toBeUndefined();
    expect(load.chips).not.toContain("3 Credits auf Karte");
    expect(load.chips).not.toContain("3 Credits auf Broker");
    expect(take.title).toBe("Du hast 3 Credits von Broker genommen.");
    expect(take.chips).not.toContain("+3 Credits");
    expect(take.chips).not.toContain("0 Credits auf Broker");
  });

  it("describes The Shell Traders set-aside and Shell-counter actions", () => {
    const setAside = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        label: "The Shell Traders: Simple Fracter beiseitelegen",
        title: "Simple Fracter",
        shellTradersAbility: "set_aside_from_grip",
        shellCounterAmount: 2
      }),
      "runner",
      { cardTitle: "Simple Fracter" }
    );
    const remove = formatChronicleEvent(
      makeEvent("end_turn", {
        actor: "runner",
        label: "The Shell Traders: 1 Shell-Counter entfernen",
        title: "Simple Fracter",
        shellTradersAbility: "start_turn_remove_shell_counter",
        remainingCounters: 0,
        installedFromSpecialZone: true
      }),
      "runner",
      { cardTitle: "Simple Fracter" }
    );

    expect(setAside.title).toBe("Du hast Simple Fracter mit 2 Shell-Countern beiseitegelegt.");
    expect(setAside.chips).toContain("Set Aside");
    expect(setAside.chips).toContain("2 Shell");
    expect(remove.title).toBe("Du hast 1 Shell-Counter von Simple Fracter entfernt; Karte kostenlos installiert.");
    expect(remove.chips).toContain("Shell -1");
    expect(remove.chips).toContain("Installiert");
  });

  it("names generic card abilities from their public action label", () => {
    const item = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        label: "Self-Modifying Code: trashen und Programm aus Stack installieren"
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast Self-Modifying Code aktiviert: trashen und Programm aus Stack installieren.");
    expect(item.category).toBe("card");
    expect(item.chips).toContain("Kartenaktion");
    expect(item.chips).toContain("Self-Modifying Code");
  });

  it("shows installed expose helpers as card reveals instead of generic credit actions", () => {
    const item = formatChronicleEvent(
      makeEvent("gain_credit", {
        actor: "runner",
        label: "SeeYa: Karte in HQ expose",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1911_expose_server_card",
        revealKind: "expose",
        serverLabel: "HQ",
        title: "Simple Barrier ICE",
        cardDefinitionId: "simple_barrier_ice"
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast Simple Barrier ICE in HQ mit SeeYa aufgedeckt.");
    expect(item.category).toBe("card");
    expect(item.chips).toContain("Expose");
    expect(item.chips).toContain("HQ");
    expect(item.chips).toContain("SeeYa");
  });

  it("does not claim a stack-search program was installed when the engine reports failure", () => {
    const failed = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "search_stack",
        searchReveal: "public",
        searchDestination: "install_program",
        searchShuffleAfter: true,
        installSucceeded: false,
        title: "Worm"
      }),
      "runner"
    );
    const installed = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "search_stack",
        searchReveal: "public",
        searchDestination: "install_program",
        searchShuffleAfter: true,
        installSucceeded: true,
        title: "Worm"
      }),
      "runner"
    );

    expect(failed.title).toBe("Du hast Worm aus dem Stack vorgezeigt, aber nicht installiert.");
    expect(failed.chips).toContain("Nicht installiert");
    expect(installed.title).toBe("Du hast Worm aus dem Stack vorgezeigt und im Rig installiert.");
  });

  it("shows Playful AI die results and follow-up choices in the chronicle", () => {
    const played = formatChronicleEvent(
      makeEvent("play_event", {
        actor: "runner",
        title: "Playful AI",
        cardDefinitionId: "onr_v1_104_playful-ai",
        v1921RunnerEventAbility: "playful_ai_dice_loop",
        v1921DieRoll: 3,
        playfulAiChoiceOpened: true
      }),
      "runner"
    );
    const resolved = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        title: "Playful AI",
        sourceDefinitionId: "onr_v1_104_playful-ai",
        v1921RunnerEventAbility: "playful_ai_dice_loop",
        v1921DieRoll: 5,
        playfulAiDieRolls: [4, 5],
        playfulAiGainedCredits: 2,
        playfulAiSetAsideDice: 1,
        playfulAiRolledDice: 2,
        playfulAiDiceQueuedBeforeRolls: 2,
        playfulAiDiceQueuedAfterRolls: 0,
        playfulAiComplete: true
      }),
      "runner"
    );

    expect(played.title).toBe("Du hast Playful AI gespielt und eine 3 gewürfelt.");
    expect(played.description).toBe("Der Wurf öffnet eine Entscheidung: Credits nehmen oder Würfel beiseitelegen.");
    expect(played.chips).toEqual(expect.arrayContaining(["Playful AI", "Wurf 3", "Choice"]));
    expect(resolved.title).toBe("Du hast Playful AI aufgelöst: 2 Credits genommen und 1 Würfel beiseitegelegt.");
    expect(resolved.description).toBe("Danach wurden 2 beiseitegelegte Würfel geworfen: 4, 5. Die Playful-AI-Schleife ist abgeschlossen.");
    expect(resolved.chips).toEqual(expect.arrayContaining(["Playful AI", "+2 Credits", "1 beiseite", "Würfe 4, 5"]));
  });

  it("keeps Encounter continuation chronicle text consistent when subroutines end the run", () => {
    const item = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        result: "ended",
        encounterContinue: true,
        encounterWillEndRun: true,
        unbrokenSubroutineCount: 1
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast ungebrochene Subroutinen ausgelöst und der Run endete.");
    expect(item.chips).toContain("Subroutinen");
  });

  it("names visible Runner installs from the public label and Rig zone", () => {
    const item = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "runner",
        label: "Simple Killer installieren",
        zoneLabel: "Rig"
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast Simple Killer im Rig installiert.");
    expect(item.cardTitle).toBe("Simple Killer");
    expect(item.chips).toContain("Rig");
  });

  it("marks AI actions without showing explanation text as a chronicle reason line", () => {
    const item = formatChronicleEvent(
      makeEvent("play_operation", {
        actor: "corp",
        title: "Simple Economy Operation",
        aiReasonCode: "corp.economy.operation",
        aiExplanation: "Credits verbessern Rez- und Score-Fenster."
      }),
      "runner",
      {
        cardTitle: "Simple Economy Operation",
        cardText: "Erhalte 4 Credits."
      }
    );

    expect(item.title).toBe("Die Korp-KI hat Simple Economy Operation gespielt und Credits erhalten.");
    expect(item.description).toBeUndefined();
    expect(item.chips).toContain("KI");
    expect(JSON.stringify(item)).not.toContain("Credits verbessern Rez- und Score-Fenster.");
    expect(JSON.stringify(item)).not.toContain("corp.economy.operation");
  });

  it("merges simple play draw effects into the played card entry", () => {
    const event = makeEvent("play_operation", {
      actor: "corp",
      title: "Annual Reviews",
      cardDefinitionId: "onr_v1_282_annual-reviews",
      aiReasonCode: "corp.draw.operation",
      resolvedEffects: [
        {
          effectId: "play_operation.effect.1",
          kind: "draw_cards",
          visibility: "public",
          side: "corp",
          amount: 3,
          sourceDefinitionId: "onr_v1_282_annual-reviews",
          sourceTitle: "Annual Reviews",
          reason: "card_resolver"
        }
      ]
    });

    const item = formatChronicleEvent(event, "runner", { cardTitle: "Annual Reviews" });
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe("Die Korp-KI hat Annual Reviews gespielt und 3 Karten gezogen.");
    expect(item.chips).toContain("Operation");
    expect(item.chips).toContain("3 Karten");
    expect(effects).toEqual([]);
  });

  it("merges simple play credit effects into the played card entry", () => {
    const event = makeEvent("play_event", {
      actor: "runner",
      title: "Livewire's Contacts",
      cardDefinitionId: "onr_v1_097_livewires-contacts",
      resolvedEffects: [
        {
          effectId: "play_event.effect.1",
          kind: "gain_credits",
          visibility: "public",
          side: "runner",
          amount: 3,
          sourceDefinitionId: "onr_v1_097_livewires-contacts",
          sourceTitle: "Livewire's Contacts",
          reason: "card_resolver"
        }
      ]
    });

    const item = formatChronicleEvent(event, "runner", { cardTitle: "Livewire's Contacts" });
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe("Du hast Livewire's Contacts gespielt und 3 Credits erhalten.");
    expect(item.category).toBe("economy");
    expect(item.chips).toContain("Event");
    expect(item.chips).toContain("+3 Credits");
    expect(effects).toEqual([]);
  });

  it("highlights stolen agendas with visible agenda points", () => {
    const item = formatChronicleEvent(
      makeEvent("steal_agenda", {
        actor: "runner",
        title: "Project Agenda",
        agendaPoints: 2
      }),
      "runner",
      {
        cardTitle: "Project Agenda"
      }
    );

    expect(item.title).toBe("Du hast Project Agenda gestohlen und 2 Agenda-Punkte erhalten.");
    expect(item.category).toBe("agenda");
    expect(item.importance).toBe("critical");
    expect(item.chips).toContain("+2 Agenda");
  });

  it("names accessed cards when the access event reveals one", () => {
    const item = formatChronicleEvent(
      makeEvent("access_card", {
        actor: "runner",
        title: "Simple Economy Operation",
        serverLabel: "HQ"
      }),
      "runner",
      {
        cardTitle: "Simple Economy Operation"
      }
    );

    expect(item.title).toBe("Du hast auf Simple Economy Operation zugegriffen.");
    expect(item.cardTitle).toBe("Simple Economy Operation");
    expect(item.chips).toContain("HQ");
  });

  it("describes public stack-search reveals with the selected card and destination", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "search_stack",
        searchReveal: "public",
        searchDestination: "grip",
        searchShuffleAfter: true,
        selectedCount: 1,
        cardDefinitionId: "onr_v1_036_jackhammer",
        title: "Jackhammer"
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast Jackhammer aus dem Stack vorgezeigt und in den Grip genommen.");
    expect(item.category).toBe("card");
    expect(item.visibility).toBe("public");
    expect(item.cardDefinitionId).toBe("onr_v1_036_jackhammer");
    expect(item.chips).toEqual(["Runner", "Stack", "Vorgezeigt", "den Grip", "Shuffle"]);
  });

  it("describes hidden stack-search moves without leaking the selected card", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "search_stack",
        searchReveal: "hidden",
        searchDestination: "grip",
        selectedCount: 1,
        cardDefinitionId: "onr_v1_036_jackhammer",
        title: "Jackhammer"
      }),
      "corp"
    );

    expect(item.title).toBe("Der Runner hat eine Karte verdeckt aus dem Stack in den Grip genommen.");
    expect(item.category).toBe("hidden");
    expect(item.visibility).toBe("redacted");
    expect(item.cardDefinitionId).toBeUndefined();
    expect(JSON.stringify(item)).not.toContain("Jackhammer");
    expect(item.chips).toContain("Verdeckt");
  });

  it("describes Trace start, bids, and outcome with public bid amounts", () => {
    const started = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        encounterContinue: true,
        traceStarted: true,
        sourceDefinitionId: "onr_v1_249_hunter",
        baseTraceStrength: 4
      }),
      "runner",
      { cardTitle: "Hunter" }
    );
    const corpBid = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        aiReasonCode: "corp.trace.bid",
        traceStep: "corp_bid",
        sourceDefinitionId: "onr_v1_249_hunter",
        baseTraceStrength: 4,
        corpBid: 2,
        traceStrength: 6,
        runnerLink: 0
      }),
      "runner"
    );
    const runnerBid = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        traceStep: "runner_bid",
        sourceDefinitionId: "onr_v1_249_hunter",
        baseTraceStrength: 4,
        corpBid: 2,
        traceStrength: 6,
        runnerLink: 0,
        runnerBid: 1,
        runnerStrength: 1,
        traceSuccessful: true,
        tagsAdded: 1
      }),
      "runner"
    );

    expect(started.title).toBe("Du hast mit Hunter einen Trace 4 ausgelöst.");
    expect(started.category).toBe("danger");
    expect(started.cardDefinitionId).toBe("onr_v1_249_hunter");
    expect(corpBid.title).toBe("Die Korp-KI hat im Trace 2 Credits geboten.");
    expect(corpBid.description).toBe("Trace-Stärke: 6, Runner-Link: 0.");
    expect(corpBid.chips).toContain("Korp-Gebot 2");
    expect(runnerBid.title).toBe("Trace entschieden: Korp 2 Credits, Du 1 Credit; Trace erfolgreich.");
    expect(runnerBid.description).toBe("Endstand: Trace 6 gegen Runner-Stärke 1.");
    expect(runnerBid.chips).toEqual(["Runner", "Trace", "Korp 2", "Runner 1", "6:1", "Erfolg", "+1 Tag"]);
  });

  it("describes Corp advances as installations and developments without leaking hidden titles", () => {
    const hidden = formatChronicleEvent(
      makeEvent("advance_card", {
        actor: "corp",
        serverLabel: "Remote 2",
        redactedKind: "installed_card",
        title: "Simple Agenda"
      }),
      "runner",
      {
        cardTitle: "Simple Agenda",
        cardType: "agenda"
      }
    );
    const visibleAgenda = formatChronicleEvent(
      makeEvent("advance_card", {
        actor: "corp",
        serverLabel: "Remote 2"
      }),
      "runner",
      {
        cardTitle: "Hostile Takeover",
        cardType: "agenda"
      }
    );

    expect(hidden.title).toBe("Die Korp hat eine Installation in Fort 2 ausgebaut.");
    expect(hidden.visibility).toBe("redacted");
    expect(hidden.chips).toEqual(["Korp", "+1 Entwicklung", "Fort 2", "Verdeckt"]);
    expect(JSON.stringify(hidden)).not.toContain("Simple Agenda");
    expect(visibleAgenda.title).toBe("Die Korp hat das Projekt Hostile Takeover weiterentwickelt.");
    expect(visibleAgenda.chips).toContain("+1 Entwicklung");
  });

  it("exposes action ordinal metadata only for entries that spent actions", () => {
    const paid = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "corp",
        actionCostClicks: 1,
        turnActionOrdinalStart: 2,
        turnActionOrdinalEnd: 2,
        redactedKind: "installed_card"
      }),
      "runner"
    );
    const free = formatChronicleEvent(makeEvent("rez_ice", { actor: "corp" }), "runner");
    const multi = formatChronicleEvent(
      makeEvent("purge_virus_counters", {
        actor: "corp",
        actionCostClicks: 3,
        turnActionOrdinalStart: 1,
        turnActionOrdinalEnd: 3
      }),
      "runner"
    );

    expect(paid.actionUse).toMatchObject({ label: "2", title: "2. Aktion in diesem Zug", clicks: 1 });
    expect(free.actionUse).toBeUndefined();
    expect(multi.actionUse).toMatchObject({ label: "1-3", title: "Aktionen 1 bis 3 in diesem Zug", clicks: 3 });
  });

  it("shows turn numbers for turn entries when provided by context", () => {
    const runnerTurnEnd = formatChronicleEvent(
      makeEvent("end_turn", {
        actor: "runner"
      }),
      "runner",
      { turnNumber: 6 }
    );
    const corpMandatoryDraw = formatChronicleEvent(
      makeEvent("mandatory_draw", {
        actor: "corp"
      }),
      "runner",
      { turnNumber: 5 }
    );

    expect(runnerTurnEnd.title).toBe("Du hast den Zug beendet (Runnerzug 6).");
    expect(runnerTurnEnd.chips).toContain("Runnerzug 6");
    expect(runnerTurnEnd.groupLabel).toBe("Runner-Zug 6");
    expect(corpMandatoryDraw.chips).toContain("Korpzug 5");
    expect(corpMandatoryDraw.groupLabel).toBe("Korp-Zug 5");
  });

  it("counts Korp and Runner turns as one shared sequence", () => {
    const turnNumbers = chronicleTurnNumberByEventId([
      makeEvent("mandatory_draw", { actor: "corp", eventId: "evt_corp_draw_1" }),
      makeEvent("gain_credit", { actor: "corp", eventId: "evt_corp_credit_1" }),
      makeEvent("end_turn", { actor: "corp", eventId: "evt_corp_end_1" }),
      makeEvent("draw_card", { actor: "runner", eventId: "evt_runner_draw_1" }),
      makeEvent("end_turn", { actor: "runner", eventId: "evt_runner_end_1" }),
      makeEvent("mandatory_draw", { actor: "corp", eventId: "evt_corp_draw_2" }),
      makeEvent("end_turn", { actor: "corp", eventId: "evt_corp_end_2" }),
      makeEvent("end_turn", { actor: "runner", eventId: "evt_runner_end_2" })
    ]);

    expect(turnNumbers).toMatchObject({
      evt_corp_draw_1: 1,
      evt_corp_end_1: 1,
      evt_runner_end_1: 2,
      evt_corp_draw_2: 3,
      evt_corp_end_2: 3,
      evt_runner_end_2: 4
    });
  });

  it("formats resolved automatic effects as separate chronicle items", () => {
    const items = formatChronicleEffectItems(
      makeEvent("continue_run", {
        actor: "runner",
        result: "ended",
        resolvedEffects: [
          {
            effectId: "tokyo-bonus",
            kind: "gain_credits",
            visibility: "public",
            side: "corp",
            amount: 2,
            sourceDefinitionId: "onr_v1_371_tokyo-chiba-infighting",
            sourceTitle: "Tokyo-Chiba Infighting",
            serverLabel: "Remote 1",
            reason: "unsuccessful_run"
          }
        ]
      }),
      "corp"
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Du hast 2 Credits durch Tokyo-Chiba Infighting erhalten.");
    expect(items[0]?.category).toBe("economy");
    expect(items[0]?.cardDefinitionId).toBe("onr_v1_371_tokyo-chiba-infighting");
    expect(items[0]?.cardTitle).toBe("Tokyo-Chiba Infighting");
    expect(items[0]?.chips).toContain("+2 Credits");
  });

  it("formats auto-rezzed region effects", () => {
    const items = formatChronicleEffectItems(
      makeEvent("install_card", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "region-rez",
            kind: "rez_card",
            visibility: "public",
            side: "corp",
            cardDefinitionId: "onr_v1_371_tokyo-chiba-infighting",
            cardTitle: "Tokyo-Chiba Infighting",
            sourceDefinitionId: "onr_v1_371_tokyo-chiba-infighting",
            sourceTitle: "Tokyo-Chiba Infighting",
            reason: "region_install"
          }
        ]
      }),
      "corp"
    );

    expect(items[0]?.title).toBe("Tokyo-Chiba Infighting wurde sofort gerezzt.");
    expect(items[0]?.importance).toBe("important");
    expect(items[0]?.chips).toContain("Automatisch");
  });

  it("formats self-trash effects without repeating the source card name", () => {
    const items = formatChronicleEffectItems(
      makeEvent("start_run", {
        actor: "runner",
        resolvedEffects: [
          {
            effectId: "top-runners-trash",
            kind: "trash_card",
            visibility: "public",
            side: "runner",
            cardDefinitionId: "onr_v1_184_top-runners-conference",
            cardTitle: "Top Runners' Conference",
            sourceDefinitionId: "onr_v1_184_top-runners-conference",
            sourceTitle: "Top Runners' Conference",
            reason: "run_start"
          }
        ]
      }),
      "runner"
    );

    expect(items[0]?.title).toBe("Top Runners' Conference wurde getrasht.");
    expect(items[0]?.chips).toContain("Automatisch");
  });
});

function makeEvent(actionType: string, payload: Record<string, unknown> = {}): PublicGameEvent {
  const actor = sideValue(payload.actor) ?? (actionType === "mandatory_draw" || actionType === "play_operation" ? "corp" : "runner");
  const eventId = typeof payload.eventId === "string" ? payload.eventId : `evt_${actionType}`;
  const payloadWithoutEventId = { ...payload };
  delete payloadWithoutEventId.eventId;
  return {
    eventId,
    type: actionType,
    stateVersionBefore: 4,
    stateVersionAfter: 5,
    stateHashAfter: "fnv1a:73fe4ee3",
    publicPayload: {
      actor,
      actionType,
      label: `${actor}.${actionType}`,
      ...payloadWithoutEventId
    }
  };
}

function sideValue(value: unknown): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}
