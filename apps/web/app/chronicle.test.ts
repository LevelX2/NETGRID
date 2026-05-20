import { describe, expect, it } from "vitest";
import type { PublicGameEvent, Side } from "@netgrid/shared";
import { chronicleActionUseByEventId, chronicleTurnNumberByEventId, formatChronicleEffectItems, formatChronicleEvent } from "./chronicle";

const ACTION_TYPES = [
  "mandatory_draw",
  "gain_credit",
  "draw_card",
  "activated_card_ability",
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
  "jack_out",
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
  "time_expired",
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

  it("formats player-clock time expiry as a critical public chronicle item", () => {
    const item = formatChronicleEvent(
      makeEvent("time_expired", {
        actor: "corp",
        winnerSide: "runner",
        loserSide: "corp",
        label: "Korp verliert durch Zeitablauf."
      }),
      "runner"
    );

    expect(item.title).toBe("Korp verliert durch Zeitablauf.");
    expect(item.category).toBe("danger");
    expect(item.importance).toBe("critical");
    expect(item.chips).toContain("Spielerzeit");
  });

  it("formats setup mulligan choices with the public decision", () => {
    const runnerKeep = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        setupStep: "mulligan",
        setupSide: "runner",
        setupDecision: "keep"
      }),
      "runner"
    );
    const corpMulligan = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        setupStep: "mulligan",
        setupSide: "corp",
        setupDecision: "mulligan"
      }),
      "runner"
    );
    const legacy = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        setupStep: "mulligan",
        setupSide: "runner"
      }),
      "runner"
    );

    expect(runnerKeep.title).toBe("Runner hat die Starthand behalten.");
    expect(runnerKeep.chips).toEqual(expect.arrayContaining(["Setup", "Starthand", "Behalten"]));
    expect(corpMulligan.title).toBe("Korp hat einen Mulligan genommen.");
    expect(corpMulligan.chips).toEqual(expect.arrayContaining(["Setup", "Starthand", "Mulligan"]));
    expect(legacy.title).toBe("Runner hat die Mulligan-Entscheidung abgeschlossen.");
    expect(legacy.title).not.toContain("Setup-Entscheidung");
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

  it("describes Runner jack-out as a run abort without access", () => {
    const item = formatChronicleEvent(
      makeEvent("jack_out", {
        actor: "runner",
        label: "Jack-out",
        serverLabel: "R&D"
      }),
      "corp"
    );

    expect(item.title).toBe("Der Runner hat den Run abgebrochen.");
    expect(item.description).toBe("Auf R&D wurde keine Karte zugegriffen.");
    expect(item.category).toBe("run");
    expect(item.chips).toEqual(["Runner", "Run", "Jack-out", "Kein Zugriff", "R&D"]);
  });

  it("describes Startup Immolator source, cost and ICE trash movement", () => {
    const item = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        label: "Startup Immolator: ICE trashen",
        sourceDefinitionId: "onr_v1_068_startup-immolator",
        targetIceDefinitionId: "simple_barrier_ice",
        trashedCardDefinitionId: "simple_barrier_ice",
        v1922RunnerProgramAbility: "startup_immolator_trash_ice",
        rezCostPaid: 3,
        trashedCount: 1,
        startupImmolatorExhausted: true
      }),
      "runner",
      { cardTitle: "Startup Immolator" }
    );

    expect(item.title).toBe("Du hast Startup Immolator erschöpft, das passierte ICE getrasht und 3 Credits bezahlt.");
    expect(item.description).toBe("Quelle und Ziel sind öffentlich: Startup Immolator wurde erschöpft; das Ziel-ICE wurde in die Archive bewegt.");
    expect(item.category).toBe("run");
    expect(item.visibility).toBe("public");
    expect(item.cardDefinitionId).toBe("onr_v1_068_startup-immolator");
    expect(item.chips).toEqual(expect.arrayContaining(["Startup Immolator", "ICE getrasht", "Archive", "3 Credits"]));
  });

  it("describes Olivia Salazar reduced ICE rez with source, ICE and paid cost", () => {
    const item = formatChronicleEvent(
      makeEvent("rez_ice", {
        actor: "corp",
        label: "Olivia Salazar: Crystal Wall für 2 Credits rezzen",
        cardDefinitionId: "onr_v1_232_crystal-wall",
        title: "Crystal Wall",
        cardType: "ice",
        oliviaSalazarRezSourceDefinitionId: "onr_v1_363_olivia-salazar",
        oliviaSalazarRezCostBase: 4,
        oliviaSalazarTemporaryDerez: true,
        rezCostPaid: 2
      }),
      "corp",
      { cardTitle: "Crystal Wall", cardType: "ice" }
    );

    expect(item.title).toBe("Du hast Crystal Wall mit Olivia Salazar für 2 Credits gerezzt. Die Begegnung beginnt.");
    expect(item.description).toBe("Olivia Salazar reduziert die effektiven Rez-Kosten von 4 Credits auf 2 Credits; das ICE wird am Runende derezzt.");
    expect(item.chips).toEqual(expect.arrayContaining(["Olivia Salazar", "2 Credits", "Temporär", "Rez", "Begegnung"]));
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
    expect(setAside.chips).toContain("Simple Fracter");
    expect(setAside.chips).toContain("2 Shell");
    expect(remove.title).toBe("Du hast 1 Shell-Counter von Simple Fracter entfernt; Karte kostenlos installiert.");
    expect(remove.chips).toContain("Shell -1");
    expect(remove.chips).toContain("Installiert");
  });

  it("prefers Shell Traders target card names over the source title for counter removal", () => {
    const paid = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        label: "The Shell Traders: Shell-Counter entfernen",
        title: "The Shell Traders",
        sourceDefinitionId: "onr_v1_176_the-shell-traders",
        abilityId: "remove_shell_counter",
        targetCardDefinitionId: "simple_fracter",
        remainingCounters: 1
      }),
      "runner"
    );
    const startTurn = formatChronicleEvent(
      makeEvent("end_turn", {
        actor: "runner",
        label: "The Shell Traders: 1 Shell-Counter entfernen",
        title: "The Shell Traders",
        shellTradersAbility: "start_turn_remove_shell_counter",
        targetCardDefinitionId: "simple_decoder",
        remainingCounters: 0,
        installedFromSpecialZone: true
      }),
      "runner"
    );

    expect(paid.title).toBe("Du hast 1 Shell-Counter von Simple Fracter entfernt.");
    expect(startTurn.title).toBe("Du hast 1 Shell-Counter von Simple Decoder entfernt; Karte kostenlos installiert.");
    expect(JSON.stringify([paid, startTurn])).not.toContain("von The Shell Traders entfernt");
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

  it("shows Corporate Negotiating Center HQ agenda reveals with public card names", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1917_corporate_negotiating_center_hq_agenda_reveal",
        sourceDefinitionId: "onr_v1_314_corporate-negotiating-center",
        sourceTitle: "Corporate Negotiating Center",
        publicRevealKind: "reveal",
        publicRevealDefinitionIds: "simple_agenda,onr_v1_203_hostile-takeover",
        publicRevealTitles: "Simple Agenda||Hostile Takeover",
        revealedAgendaDefinitionIds: "simple_agenda,onr_v1_203_hostile-takeover",
        revealedCount: 2,
        gainedCredits: 2
      }),
      "runner"
    );

    expect(item.title).toBe("Die Korp hat 2 Agenden aus HQ durch Corporate Negotiating Center vorgezeigt.");
    expect(item.description).toBe("Gezeigt: Simple Agenda, Hostile Takeover. Timing: Start-of-turn.");
    expect(item.category).toBe("agenda");
    expect(item.visibility).toBe("public");
    expect(item.cardDefinitionId).toBe("onr_v1_314_corporate-negotiating-center");
    expect(item.chips).toEqual(expect.arrayContaining(["Corporate Negotiating Center", "HQ Reveal", "2 Agenden", "+2 Credits", "Start-of-turn"]));
  });

  it("shows Smith's Pawnshop choices with the corrected 2-credit gain", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        sourceDefinitionId: "onr_v1_180_smiths-pawnshop",
        smithsPawnshopTriggered: true,
        trashedCardDefinitionId: "onr_v1_028_force-shield",
        trashedCardTitle: "Force Shield",
        creditsGained: 2,
        gainedCredits: 2
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast Force Shield mit Smith's Pawnshop getrasht und 2 Credits erhalten.");
    expect(item.category).toBe("economy");
    expect(item.chips).toEqual(expect.arrayContaining(["Smith's Pawnshop", "+2 Credits", "Trash"]));
    expect(JSON.stringify(item)).not.toContain("1 Credit");
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

  it("shows Self-Modifying Code stack choices with the selected program", () => {
    const activated = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        title: "Self-Modifying Code",
        sourceDefinitionId: "onr_v1_059_self-modifying-code",
        label: "Self-Modifying Code: trashen und Programm aus Stack installieren"
      }),
      "runner"
    );
    const installed = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "self_modifying_code_install_program",
        publicRevealDefinitionId: "simple_decoder",
        installedProgramDefinitionId: "simple_decoder",
        searchDestination: "runner_rig",
        installed: true,
        shuffled: true
      }),
      "runner"
    );

    expect(activated.title).toBe("Du hast Self-Modifying Code aktiviert: trashen und Programm aus Stack installieren.");
    expect(installed.title).toBe("Du hast Simple Decoder aus dem Stack vorgezeigt und im Rig installiert.");
    expect(installed.chips).toEqual(expect.arrayContaining(["Self-Modifying Code", "Vorgezeigt", "Installiert", "Shuffle"]));
    expect(installed.title).not.toContain("Entscheidung beantwortet");
  });

  it("shows The Short Circuit activation and selected program concretely", () => {
    const activated = formatChronicleEvent(
      makeEvent("gain_credit", {
        actor: "runner",
        hiddenZoneAction: "v1911_short_circuit_search",
        sourceDefinitionId: "onr_v1_177_the-short-circuit"
      }),
      "runner"
    );
    const resolved = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "v1911_short_circuit_search",
        sourceDefinitionId: "onr_v1_177_the-short-circuit",
        publicRevealDefinitionId: "simple_decoder",
        cardDefinitionId: "simple_decoder",
        searchDestination: "runner_grip",
        shuffled: true
      }),
      "corp"
    );

    expect(activated.title).toBe("Du hast The Short Circuit genutzt und eine Stack-Suche geöffnet.");
    expect(activated.chips).toEqual(expect.arrayContaining(["The Short Circuit", "Stack-Suche"]));
    expect(resolved.title).toBe("Der Runner hat The Short Circuit genutzt, Simple Decoder der Korp gezeigt und in die Hand genommen.");
    expect(resolved.description).toBe("Der Stack wurde danach gemischt.");
    expect(resolved.chips).toEqual(expect.arrayContaining(["The Short Circuit", "Vorgezeigt", "Hand", "Shuffle"]));
    expect(resolved.title).not.toContain("Entscheidung beantwortet");
  });

  it("shows Systematic Layoffs advancement choices with target context", () => {
    const resolved = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        sourceDefinitionId: "onr_v1_304_systematic-layoffs",
        v1919OperationAbility: "add_advancement_counters",
        targetCardDefinitionId: "onr_v1_196_corporate-war",
        targetCardDefinitionIds: "onr_v1_196_corporate-war",
        addedAdvancementCounters: 2,
        targetCount: 1,
        advancementCountersAfter: 2
      }),
      "corp"
    );

    expect(resolved.title).toBe("Du hast 2 Advancement-Counter durch Systematic Layoffs auf Corporate War gelegt.");
    expect(resolved.chips).toEqual(expect.arrayContaining(["Systematic Layoffs", "+2 Advancement", "1 Ziel"]));
    expect(resolved.title).not.toContain("Entscheidung beantwortet");
  });

  it("shows Self-Modifying Code blocked and MU follow-up choices concretely", () => {
    const blocked = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "self_modifying_code_install_program",
        publicRevealDefinitionId: "simple_decoder",
        searchDestination: "runner_stack",
        installed: false,
        installBlockedReason: "insufficient_credits",
        shuffled: true
      }),
      "runner"
    );
    const memoryPending = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "self_modifying_code_install_program",
        publicRevealDefinitionId: "simple_decoder",
        searchDestination: "install_program",
        installDeferredForMemory: true,
        installed: false,
        shuffled: true
      }),
      "runner"
    );
    const memoryResolved = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "self_modifying_code_free_mu",
        publicRevealDefinitionId: "simple_decoder",
        installedProgramDefinitionId: "simple_decoder",
        trashedCount: 1,
        trashedCardDefinitionIds: "simple_fracter",
        installed: true
      }),
      "runner"
    );

    expect(blocked.title).toBe("Du hast Simple Decoder aus dem Stack vorgezeigt, aber nicht installiert.");
    expect(blocked.description).toBe("Grund: nicht genug Credits.");
    expect(memoryPending.title).toBe("Du hast Simple Decoder aus dem Stack vorgezeigt; MU muss freigemacht werden.");
    expect(memoryResolved.title).toBe("Du hast Simple Decoder nach MU-Auswahl im Rig installiert.");
    expect(memoryResolved.description).toBe("Für MU getrasht: Simple Fracter.");
  });

  it("shows Playful AI die results and follow-up choices in the chronicle", () => {
    const played = formatChronicleEvent(
      makeEvent("play_event", {
        actor: "runner",
        title: "Playful AI",
        cardDefinitionId: "onr_v1_104_playful-ai",
        abilityId: "playful_ai_dice_loop",
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
        abilityId: "playful_ai_dice_loop",
        v1921DieRoll: 5,
        playfulAiDieRolls: [4, 5],
        playfulAiGainedCredits: 1,
        playfulAiSetAsideDice: 2,
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
    expect(resolved.title).toBe("Du hast Playful AI aufgelöst: 1 Credit genommen und 2 Würfel beiseitegelegt.");
    expect(resolved.description).toBe("Danach wurden 2 beiseitegelegte Würfel geworfen: 4, 5. Die Playful-AI-Schleife ist abgeschlossen.");
    expect(resolved.chips).toEqual(expect.arrayContaining(["Playful AI", "+1 Credit", "2 beiseite", "Würfe 4, 5"]));
  });

  it("shows partial Playful AI queued dice without treating the roll history as newly rolled dice", () => {
    const partial = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        title: "Playful AI",
        sourceDefinitionId: "onr_v1_104_playful-ai",
        abilityId: "playful_ai_dice_loop",
        v1921DieRoll: 1,
        playfulAiDieRolls: [1],
        playfulAiGainedCredits: 0,
        playfulAiSetAsideDice: 2,
        playfulAiRolledDice: 1,
        playfulAiDiceQueuedBeforeRolls: 2,
        playfulAiDiceQueuedAfterRolls: 1,
        playfulAiRemainingDice: 1,
        playfulAiChoiceOpened: true
      }),
      "runner"
    );
    const gainAll = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        title: "Playful AI",
        sourceDefinitionId: "onr_v1_104_playful-ai",
        abilityId: "playful_ai_dice_loop",
        playfulAiDieRolls: [],
        playfulAiGainedCredits: 3,
        playfulAiSetAsideDice: 0,
        playfulAiRolledDice: 0,
        playfulAiDiceQueuedBeforeRolls: 0,
        playfulAiDiceQueuedAfterRolls: 0,
        playfulAiComplete: true
      }),
      "runner"
    );

    expect(partial.description).toBe("Danach wurde 1 von 2 beiseitegelegten Würfeln geworfen: 1. Der letzte Wurf öffnet eine weitere Entscheidung; ein Würfel bleibt danach noch offen.");
    expect(partial.chips).toEqual(expect.arrayContaining(["2 beiseite", "Wurf 1", "1 offen"]));
    expect(gainAll.description).toBe("Die Playful-AI-Schleife ist abgeschlossen.");
    expect(gainAll.chips).not.toEqual(expect.arrayContaining(["Wurf 3"]));
  });

  it("describes Edited Shipping Manifests access replacement without hidden card identities", () => {
    const item = formatChronicleEvent(
      makeEvent("play_event", {
        actor: "runner",
        title: "Edited Shipping Manifests",
        cardDefinitionId: "onr_v1_084_edited-shipping-manifests",
        accessReplacement: "corp_lose_credits_runner_tag_corp_draw",
        creditLoss: 1,
        corpCreditsAfter: 7,
        tagsAdded: 1,
        runnerTagsAfter: 1,
        corpDrawnCount: 1,
        hiddenZoneBarrier: true
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast Edited Shipping Manifests gespielt: Korp verliert 1 Credit, Runner erhält 1 Tag, Korp zieht eine Karte.");
    expect(item.description).toBe("Der erfolgreiche Run wurde ohne Zugriff auf verdeckte Korp-Karten ersetzt.");
    expect(item.category).toBe("danger");
    expect(item.importance).toBe("important");
    expect(item.visibility).toBe("public");
    expect(item.chips).toEqual(expect.arrayContaining(["Access ersetzt", "Korp -1", "+1 Tag", "Korp zieht 1"]));
    expect(JSON.stringify(item)).not.toContain("cardInstances");
    expect(JSON.stringify(item)).not.toContain("\"hq\"");
    expect(JSON.stringify(item)).not.toContain("\"rd\"");
  });

  it("shows Schlaghund tag-check damage without internal state", () => {
    const item = formatChronicleEvent(
      makeEvent("gain_credit", {
        actor: "corp",
        title: "Schlaghund",
        cardDefinitionId: "onr_v1_339_schlaghund",
        v1921AssetAbility: "schlaghund_tag_damage",
        v1921DieRoll: 4,
        runnerTags: 6,
        tagThresholdMet: true,
        damageResolved: true,
        damageType: "meat",
        damageAmount: 10,
        selfTrashed: true
      }),
      "runner"
    );

    expect(item.title).toBe("Die Korp hat Schlaghund aktiviert und eine 4 gewürfelt.");
    expect(item.description).toBe("6 Tags reichen aus: 10 Meat Damage und Schlaghund wird getrasht.");
    expect(item.chips).toEqual(expect.arrayContaining(["Schlaghund", "Wurf 4", "6 Tags", "Damage"]));
    expect(JSON.stringify(item)).not.toContain("cardInstances");
  });

  it("shows Rio de Janeiro City Grid after passed ICE without hidden server data", () => {
    const item = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        v1921UpgradeAbility: "rio_de_janeiro_passed_ice",
        sourceDefinitionId: "onr_v1_367_rio-de-janeiro-city-grid",
        passedIceDefinitionId: "simple_barrier_ice",
        serverLabel: "Remote 1",
        v1921DieRoll: 1,
        rioRunEnded: true
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast simple_barrier_ice passiert und Rio de Janeiro City Grid würfelt eine 1.");
    expect(item.description).toBe("Der Run endet durch Rio de Janeiro City Grid.");
    expect(item.chips).toEqual(expect.arrayContaining(["Rio", "Fort 1", "Wurf 1", "Run endet"]));
  });

  it("shows Wall of Ice subroutine damage and end-the-run as separate chronicle steps", () => {
    const items = formatChronicleEffectItems(
      makeEvent("continue_run", {
        actor: "runner",
        damageResolved: true,
        damageType: "net",
        damageAmount: 4,
        cardsTrashed: 4,
        resolvedEffects: [
          {
            effectId: "subroutine_1",
            kind: "resolve_subroutine",
            visibility: "public",
            side: "runner",
            sourceDefinitionId: "onr_v1_278_wall-of-ice",
            sourceTitle: "Wall of Ice",
            subroutineIndex: 0,
            subroutineType: "do_damage",
            damageType: "net",
            amount: 2,
            cardsTrashed: 2
          },
          {
            effectId: "subroutine_2",
            kind: "resolve_subroutine",
            visibility: "public",
            side: "runner",
            sourceDefinitionId: "onr_v1_278_wall-of-ice",
            sourceTitle: "Wall of Ice",
            subroutineIndex: 1,
            subroutineType: "do_damage",
            damageType: "net",
            amount: 2,
            cardsTrashed: 2
          },
          {
            effectId: "subroutine_3",
            kind: "resolve_subroutine",
            visibility: "public",
            side: "runner",
            sourceDefinitionId: "onr_v1_278_wall-of-ice",
            sourceTitle: "Wall of Ice",
            subroutineIndex: 2,
            subroutineType: "end_the_run",
            endedRun: true
          }
        ]
      }),
      "runner"
    );

    expect(items.map((item) => item.title)).toEqual([
      "Wall of Ice: Subroutine 1 macht 2 Net Damage.",
      "Wall of Ice: Subroutine 2 macht 2 Net Damage.",
      "Wall of Ice: Subroutine 3 beendet den Run."
    ]);
    expect(items[0]?.description).toBe("2 Karten wurden in den Heap bewegt.");
    expect(items[0]?.chips).toEqual(expect.arrayContaining(["Subroutine 1", "2 Net Damage", "2 Heap", "Wall of Ice"]));
    expect(JSON.stringify(items)).not.toContain("runner_card_");
  });

  it("names Core Command Jettison Ice targets and paid rez costs in the chronicle", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        v1922RunnerEventAbility: "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
        targetCardDefinitionId: "simple_barrier_ice",
        targetServerLabel: "R&D",
        rezCostPaid: 3,
        trashedCount: 1
      }),
      "runner",
      { cardTitle: "Simple Barrier ICE" }
    );

    expect(item.title).toBe("Du hast Simple Barrier ICE in R&D getrasht und 3 Credits bezahlt.");
    expect(item.category).toBe("card");
    expect(item.importance).toBe("important");
    expect(item.cardDefinitionId).toBe("simple_barrier_ice");
    expect(item.chips).toEqual(["Runner", "Core Command", "Trash", "3 Credits", "R&D"]);
  });

  it("describes V1.8.1 Pattel and Pox run-success counters", () => {
    const pattel = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        v181RunnerProgramAbility: "pattels_virus_counter",
        targetCardDefinitionId: "onr_v1_279_wall-of-static",
        remainingCounters: 2
      }),
      "runner",
      { cardTitle: "Wall of Static" }
    );
    const pox = formatChronicleEvent(
      makeEvent("access_card", {
        actor: "runner",
        v181RunnerProgramAbility: "pox_counter",
        targetServerLabel: "R&D",
        poxCountersAfter: 3
      }),
      "runner"
    );

    expect(pattel.title).toBe("Du hast 1 Virus-Counter mit Pattel's Virus auf Wall of Static gelegt.");
    expect(pattel.cardDefinitionId).toBe("onr_v1_279_wall-of-static");
    expect(pattel.chips).toEqual(expect.arrayContaining(["Pattel's Virus", "+1 Virus", "2 auf ICE"]));
    expect(pox.title).toBe("Du hast 1 Pox-Counter auf R&D gelegt.");
    expect(pox.chips).toEqual(expect.arrayContaining(["Pox", "+1 Virus", "R&D", "3 dort"]));
  });

  it("describes recurring-credit installs and Pox ICE install tax", () => {
    const invisibility = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "runner",
        title: "Invisibility",
        zoneLabel: "Rig",
        recurringCreditsLoaded: 9
      }),
      "runner",
      { cardTitle: "Invisibility" }
    );
    const taxedIce = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "corp",
        title: "Wall of Static",
        serverLabel: "R&D",
        zoneLabel: "ICE",
        iceInstallAdditionalCost: 2,
        iceInstallTotalCost: 5
      }),
      "corp",
      { cardTitle: "Wall of Static" }
    );

    expect(invisibility.description).toBe("9 Recurring Credits wurden auf die Karte gelegt.");
    expect(invisibility.chips).toContain("9 Recurring");
    expect(taxedIce.description).toBe("Die Installation enthält 2 Credits Zusatzkosten; Gesamtkosten: 5 Credits.");
    expect(taxedIce.chips).toEqual(expect.arrayContaining(["+2 Installkosten", "5 gesamt"]));
  });

  it("names Restrictive Net Zoning selected servers in the chronicle", () => {
    const item = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "runner",
        title: "Restrictive Net Zoning",
        zoneLabel: "Resource",
        selectedServerId: "remote_1",
        selectedServerLabel: "Remote Server 1"
      }),
      "runner",
      { cardTitle: "Restrictive Net Zoning" }
    );

    expect(item.title).toBe("Du hast Restrictive Net Zoning auf Remote Server 1 ausgerichtet installiert.");
    expect(item.chips).toEqual(expect.arrayContaining(["Install", "Resource", "Remote Server 1"]));
  });

  it("describes Data Fort Reclamation and Aardvark hidden-zone choices", () => {
    const dataFortInstall = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1922_data_fort_reclamation_install_sequence",
        installedCount: 3,
        installedIceCount: 2,
        installedRootCount: 1,
        temporaryCreditsProvided: 12,
        dataFortReclamationRezCandidateCount: 2
      }),
      "runner"
    );
    const dataFortRez = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1922_data_fort_reclamation_rez_sequence",
        rezzedCount: 2,
        rezzedIceCount: 1,
        rezzedRootCount: 1,
        temporaryCreditsSpent: 4,
        corpCreditsSpent: 2
      }),
      "corp"
    );
    const aardvark = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "aardvark_rez_trash_worm",
        publicRevealDefinitionId: "onr_v1_327_aardvark"
      }),
      "runner"
    );

    expect(dataFortInstall.title).toBe("Die Korp hat 3 Karten mit Data Fort Reclamation installiert.");
    expect(dataFortInstall.visibility).toBe("redacted");
    expect(dataFortInstall.chips).toEqual(expect.arrayContaining(["Data Fort", "3 Install", "2 ICE", "12 Temp-Credits"]));
    expect(dataFortRez.title).toBe("Du hast 2 Karten aus Data Fort Reclamation gerezzt.");
    expect(dataFortRez.chips).toEqual(expect.arrayContaining(["Data Fort", "2 Rez", "4 Temp", "2 Credits"]));
    expect(aardvark.title).toBe("Die Korp hat Aardvark gerezzt und Worm getrasht.");
    expect(aardvark.cardDefinitionId).toBe("onr_v1_327_aardvark");
    expect(aardvark.chips).toEqual(expect.arrayContaining(["Aardvark", "Rez", "Worm Trash"]));
  });

  it("names the ICE rezzed by Priority Requisition", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v162_priority_requisition_free_rez",
        priorityRequisitionFreeRez: true,
        priorityRequisitionTargetDefinitionId: "onr_v1_230_cortical-scanner",
        rezCostPaid: 0
      }),
      "corp",
      { cardTitle: "Cortical Scanner" }
    );

    expect(item.title).toBe("Du hast Cortical Scanner durch Priority Requisition kostenlos gerezzt.");
    expect(item.category).toBe("card");
    expect(item.visibility).toBe("public");
    expect(item.cardDefinitionId).toBe("onr_v1_230_cortical-scanner");
    expect(item.chips).toEqual(expect.arrayContaining(["Priority Requisition", "Rez", "0 Credits"]));
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

  it("shows fully broken Encounter continuation as passed ICE", () => {
    const item = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        result: "continued",
        encounterContinue: true,
        encounterWillEndRun: false,
        unbrokenSubroutineCount: 0
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast das ICE passiert.");
    expect(item.chips).toContain("ICE passiert");
    expect(JSON.stringify(item)).not.toContain("ungebrochene Subroutinen");
  });

  it("describes breaker pump and break actions with action-specific effects", () => {
    const pump = formatChronicleEvent(
      makeEvent("pump_breaker", {
        actor: "runner",
        title: "Krash",
        aiReasonCode: "runner.encounter.pump_breaker",
        pumpStrengthAmount: 1,
        pumpBreakerCreditCost: 2,
        breakerStrengthAfter: 1
      }),
      "corp"
    );
    const breakAction = formatChronicleEvent(
      makeEvent("break_subroutine", {
        actor: "runner",
        title: "Krash",
        aiReasonCode: "runner.encounter.break_etr",
        breakSubroutineBaseCost: 2,
        subroutineIndex: 0,
        targetIceTitle: "Filter"
      }),
      "corp"
    );

    expect(pump.title).toBe("Die Runner-KI hat Krash gepumpt.");
    expect(pump.description).toBe("2 Credits: +1 Stärke für diese Begegnung; Stärke danach 1.");
    expect(pump.chips).toEqual(expect.arrayContaining(["Breaker", "+1 Stärke", "2 Credits"]));
    expect(breakAction.title).toBe("Die Runner-KI hat mit Krash Subroutine 1 auf Filter gebrochen.");
    expect(breakAction.description).toBe("2 Credits: Subroutine 1 auf Filter gebrochen.");
    expect(breakAction.chips).toEqual(expect.arrayContaining(["Subroutine", "Subroutine 1", "Gebrochen", "2 Credits", "Krash", "Filter"]));
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

  it("merges simple play lose-credit effects into the played card entry", () => {
    const event = makeEvent("play_operation", {
      actor: "corp",
      title: "Closed Accounts",
      cardDefinitionId: "onr_v1_285_closed-accounts",
      creditsLost: 7,
      runnerCreditsAfter: 0,
      resolvedEffects: [
        {
          effectId: "onr_v1_285_closed-accounts.effect.0.lose_credits",
          kind: "lose_credits",
          visibility: "public",
          side: "runner",
          amount: 7,
          sourceDefinitionId: "onr_v1_285_closed-accounts",
          sourceTitle: "Closed Accounts",
          reason: "card_resolver"
        }
      ]
    });

    const item = formatChronicleEvent(event, "runner", { cardTitle: "Closed Accounts" });
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe("Die Korp hat Closed Accounts gespielt und Runner verliert 7 Credits.");
    expect(item.category).toBe("danger");
    expect(item.chips).toEqual(expect.arrayContaining(["Operation", "Runner -7 Credits"]));
    expect(effects).toEqual([]);
  });

  it("merges ordered Day Shift card resolver effects into the played card entry", () => {
    const event = makeEvent("play_operation", {
      actor: "corp",
      title: "Day Shift",
      cardDefinitionId: "onr_v1_288_day-shift",
      drawnCards: 2,
      gainedCredits: 1,
      resolvedEffects: [
        {
          effectId: "onr_v1_288_day-shift.effect.0.draw_cards",
          kind: "draw_cards",
          visibility: "public",
          side: "corp",
          amount: 2,
          sourceDefinitionId: "onr_v1_288_day-shift",
          sourceTitle: "Day Shift",
          reason: "card_resolver"
        },
        {
          effectId: "onr_v1_288_day-shift.effect.1.gain_credits",
          kind: "gain_credits",
          visibility: "public",
          side: "corp",
          amount: 1,
          sourceDefinitionId: "onr_v1_288_day-shift",
          sourceTitle: "Day Shift",
          reason: "card_resolver"
        }
      ]
    });

    const item = formatChronicleEvent(event, "runner");
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe("Die Korp hat Day Shift gespielt und 2 Karten gezogen und 1 Credit erhalten.");
    expect(item.title.indexOf("2 Karten gezogen")).toBeLessThan(item.title.indexOf("1 Credit erhalten"));
    expect(item.chips).toEqual(expect.arrayContaining(["Operation", "2 Karten", "+1 Credit"]));
    expect(JSON.stringify(item)).not.toContain("Jack 'n' Joe");
    expect(effects).toEqual([]);
  });

  it("merges ordered Night Shift card resolver effects into the played card entry", () => {
    const event = makeEvent("play_operation", {
      actor: "corp",
      title: "Night Shift",
      cardDefinitionId: "onr_v1_295_night-shift",
      gainedCredits: 2,
      drawnCards: 1,
      resolvedEffects: [
        {
          effectId: "onr_v1_295_night-shift.effect.0.gain_credits",
          kind: "gain_credits",
          visibility: "public",
          side: "corp",
          amount: 2,
          sourceDefinitionId: "onr_v1_295_night-shift",
          sourceTitle: "Night Shift",
          reason: "card_resolver"
        },
        {
          effectId: "onr_v1_295_night-shift.effect.1.draw_cards",
          kind: "draw_cards",
          visibility: "public",
          side: "corp",
          amount: 1,
          sourceDefinitionId: "onr_v1_295_night-shift",
          sourceTitle: "Night Shift",
          reason: "card_resolver"
        }
      ]
    });

    const item = formatChronicleEvent(event, "runner");
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe("Die Korp hat Night Shift gespielt und 2 Credits erhalten und eine Karte gezogen.");
    expect(item.title.indexOf("2 Credits erhalten")).toBeLessThan(item.title.indexOf("eine Karte gezogen"));
    expect(item.chips).toEqual(expect.arrayContaining(["Operation", "+2 Credits", "Karte ziehen"]));
    expect(effects).toEqual([]);
  });

  it("uses card resolver source titles when the play payload has no title", () => {
    const event = makeEvent("play_event", {
      actor: "runner",
      cardDefinitionId: "onr_v1_095_jack-n-joe",
      drawnCount: 3,
      resolvedEffects: [
        {
          effectId: "onr_v1_095_jack-n-joe.effect.0.draw_cards",
          kind: "draw_cards",
          visibility: "public",
          side: "runner",
          amount: 3,
          sourceDefinitionId: "onr_v1_095_jack-n-joe",
          sourceTitle: "Jack 'n' Joe",
          reason: "card_resolver"
        }
      ]
    });

    const item = formatChronicleEvent(event, "corp");
    const effects = formatChronicleEffectItems(event, "corp");
    const serialized = JSON.stringify(item);

    expect(item.title).toBe("Der Runner hat Jack 'n' Joe gespielt und 3 Karten gezogen.");
    expect(serialized).toContain("Jack 'n' Joe");
    expect(serialized).toContain("3 Karten");
    expect(serialized).not.toContain("Score!");
    expect(serialized).not.toContain("Livewire");
    expect(effects).toEqual([]);
  });

  it("merges activated card implementation credit effects with card context", () => {
    const event = makeEvent("activated_card_ability", {
      actor: "runner",
      title: "Newsgroup Filter",
      cardDefinitionId: "onr_v1_045_newsgroup-filter",
      cardImplementationAbility: "activated",
      gainedCredits: 2,
      runnerCreditsAfter: 7,
      resolvedEffects: [
        {
          effectId: "onr_v1_045_newsgroup-filter.effect.0.gain_credits",
          kind: "gain_credits",
          visibility: "public",
          side: "runner",
          amount: 2,
          sourceDefinitionId: "onr_v1_045_newsgroup-filter",
          sourceTitle: "Newsgroup Filter",
          reason: "card_resolver"
        }
      ]
    });

    const item = formatChronicleEvent(event, "runner");
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe("Du hast Newsgroup Filter genutzt und 2 Credits erhalten.");
    expect(item.category).toBe("economy");
    expect(item.chips).toEqual(expect.arrayContaining(["Ability", "+2 Credits"]));
    expect(effects).toEqual([]);
  });

  it("merges activated card implementation draw effects without revealing drawn cards", () => {
    const event = makeEvent("activated_card_ability", {
      actor: "corp",
      title: "ESA Contract",
      cardDefinitionId: "onr_v1_321_esa-contract",
      cardImplementationAbility: "activated",
      drawnCards: 2,
      resolvedEffects: [
        {
          effectId: "onr_v1_321_esa-contract.effect.0.draw_cards",
          kind: "draw_cards",
          visibility: "public",
          side: "corp",
          amount: 2,
          sourceDefinitionId: "onr_v1_321_esa-contract",
          sourceTitle: "ESA Contract",
          reason: "card_resolver"
        }
      ]
    });

    const item = formatChronicleEvent(event, "runner");
    const effects = formatChronicleEffectItems(event, "runner");
    const serialized = JSON.stringify(item);

    expect(item.title).toBe("Die Korp hat ESA Contract genutzt und 2 Karten gezogen.");
    expect(item.chips).toEqual(expect.arrayContaining(["Ability", "2 Karten"]));
    expect(serialized).not.toContain("simple_agenda");
    expect(serialized).not.toContain("simple_economy_operation");
    expect(effects).toEqual([]);
  });

  it("shows Loan from Chiba install credit gains as a public economy effect", () => {
    const items = formatChronicleEffectItems(
      makeEvent("install_card", {
        actor: "runner",
        title: "Loan from Chiba",
        cardDefinitionId: "onr_v1_168_loan-from-chiba",
        resolvedEffects: [
          {
            effectId: "runner.install.loan_from_chiba.card_123",
            kind: "gain_credits",
            visibility: "public",
            side: "runner",
            amount: 12,
            sourceDefinitionId: "onr_v1_168_loan-from-chiba",
            sourceTitle: "Loan from Chiba",
            reason: "card_resolver"
          }
        ]
      }),
      "runner"
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Du hast 12 Credits durch Loan from Chiba erhalten.");
    expect(items[0]?.category).toBe("economy");
    expect(items[0]?.cardDefinitionId).toBe("onr_v1_168_loan-from-chiba");
    expect(items[0]?.chips).toEqual(expect.arrayContaining(["+12 Credits"]));
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

  it("keeps Cinderella trace outcome and break costs distinct", () => {
    const trace = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        traceStep: "runner_bid",
        sourceDefinitionId: "onr_v1_228_cinderella",
        corpBid: 1,
        traceStrength: 7,
        runnerBid: 0,
        runnerStrength: 0,
        traceSuccessful: true,
        traceSuccessEffect: "hardware_trash_meat_damage_end_run",
        trashedCount: 1,
        damageAmount: 2,
        damageCannotBePrevented: true
      }),
      "runner"
    );
    const breakAction = formatChronicleEvent(
      makeEvent("break_subroutine", {
        actor: "runner",
        title: "Replicator",
        subroutineIndex: 0,
        targetIceTitle: "Cinderella",
        breakSubroutineBaseCost: 0
      }),
      "runner"
    );

    expect(trace.title).toBe("Trace entschieden: Korp 1 Credit, Du 0 Credits; Trace erfolgreich.");
    expect(trace.description).toBe("Endstand: Trace 7 gegen Runner-Stärke 0; Karteneffekt: 1 Hardware getrasht, 2 Meat-Schaden nicht verhinderbar, Run endet.");
    expect(trace.chips).toEqual(expect.arrayContaining(["Trace", "Erfolg", "Hardware -1", "2 Schaden", "Run endet"]));
    expect(breakAction.title).toBe("Du hast mit Replicator Subroutine 1 auf Cinderella gebrochen.");
    expect(breakAction.description).toBe("0 Credits: Subroutine 1 auf Cinderella gebrochen.");
    expect(breakAction.chips).toEqual(expect.arrayContaining(["Subroutine 1", "0 Credits", "Replicator", "Cinderella"]));
  });

  it("describes Hacker Tracker, Fang 2.0 and Arasaka Owns You follow-up payloads", () => {
    const trace = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        traceStep: "runner_bid",
        sourceDefinitionId: "onr_v1_241_fang-2-0",
        corpBid: 6,
        traceStrength: 11,
        runnerBid: 0,
        runnerStrength: 0,
        traceSuccessful: true,
        tagsAdded: 0,
        fangRunEnded: true,
        fangRunLockCreditCost: 2,
        hackerTrackerCountersAdded: 1
      }),
      "runner"
    );
    const lockCleared = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        v1920RunnerRunLockAbility: "fang_2_0_pay_to_run",
        fangRunLockCreditCost: 2,
        fangRunLockCleared: true
      }),
      "runner"
    );
    const arasaka = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        v1919RunnerEventAbility: "arasaka_owns_you_flatline_replacement",
        sourceDefinitionId: "onr_v1_078_arasaka-owns-you",
        originalAmount: 4,
        preventedAmount: 4,
        drawnCards: 4,
        removedTags: 2,
        coreDamageRemoved: 1,
        futureAgendaPointForfeitPending: 3
      }),
      "runner",
      { cardTitle: "Arasaka Owns You" }
    );

    expect(trace.description).toContain("Fang 2.0 beendet den Run");
    expect(trace.chips).toContain("HTC +1");
    expect(lockCleared.title).toBe("Du hast die Fang-2.0-Run-Sperre für 2 Credits entfernt.");
    expect(arasaka.title).toBe("Du hast Arasaka Owns You gespielt und 4 Schaden ersetzt.");
    expect(arasaka.chips).toContain("Flatline verhindert");
  });

  it("describes complex card payloads from the Originalset spot-check clearly", () => {
    const valuPak = formatChronicleEvent(
      makeEvent("play_event", {
        actor: "runner",
        cardDefinitionId: "onr_v1_117_valu-pak-software-bundle",
        title: "Valu-Pak Software Bundle",
        v1922RunnerEventAbility: "program_install_action_bundle",
        gainedActions: 5,
        temporaryProgramInstallCredits: 1,
        valuPakProgramInstallActionsRemaining: 5
      }),
      "runner"
    );
    const edgerunner = formatChronicleEvent(
      makeEvent("play_operation", {
        actor: "corp",
        cardDefinitionId: "onr_v1_289_edgerunner-inc-temps",
        title: "Edgerunner, Inc., Temps",
        v1922CorpOperationAbility: "install_action_bundle",
        gainedActions: 3,
        edgerunnerTempsInstallActionsRemaining: 3
      }),
      "runner"
    );
    const securityPurge = formatChronicleEvent(
      makeEvent("score_agenda", {
        actor: "corp",
        cardDefinitionId: "onr_v1_216_security-purge",
        title: "Security Purge",
        agendaAbility: "v1922_security_purge",
        revealedCount: 3,
        installedIceCount: 2,
        trashedCount: 1
      }),
      "runner"
    );
    const shield = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        sourceDefinitionId: "onr_v1_061_shield",
        title: "Shield",
        eventModificationDecision: "apply",
        preventedAmount: 2,
        damageAmount: 0
      }),
      "runner"
    );
    const boardwalk = formatChronicleEvent(
      makeEvent("gain_credit", {
        actor: "runner",
        sourceDefinitionId: "onr_v1_008_boardwalk",
        title: "Boardwalk",
        v1921RunnerProgramAbility: "deterministic_die_probe",
        v1921DieRoll: 4
      }),
      "runner"
    );
    const flak = formatChronicleEvent(
      makeEvent("break_subroutine", {
        actor: "runner",
        cardDefinitionId: "onr_v1_027_flak",
        title: "Flak"
      }),
      "runner"
    );

    expect(valuPak.title).toBe("Du hast Valu-Pak Software Bundle gespielt und 5 Programminstall-Aktionen erhalten.");
    expect(valuPak.description).toBe("1 temporärer Credit ist nur für Programminstallationen verfügbar.");
    expect(valuPak.chips).toContain("+5 Aktionen");
    expect(edgerunner.title).toBe("Die Korp hat Edgerunner, Inc., Temps gespielt und 3 Installaktionen erhalten.");
    expect(edgerunner.chips).toContain("3 offen");
    expect(securityPurge.title).toBe("Die Korp hat Security Purge gescored und 3 R&D-Karten aufgedeckt.");
    expect(securityPurge.description).toBe("2 ICE installiert und gerezzt; 1 Nicht-ICE getrasht.");
    expect(shield.title).toBe("Du hast 2 Schaden mit Shield verhindert.");
    expect(shield.chips).toContain("2 verhindert");
    expect(boardwalk.title).toBe("Du hast Boardwalk aktiviert und eine 4 gewürfelt.");
    expect(boardwalk.chips).toContain("Wurf 4");
    expect(flak.title).toBe("Du hast mit Flak eine Subroutine gebrochen.");
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

  it("derives chronicle action numbers across extra actions when payload ordinals reset", () => {
    const events = [
      makeEvent("gain_credit", {
        actor: "corp",
        eventId: "evt_1",
        actionCostClicks: 1,
        turnActionOrdinalStart: 1,
        turnActionOrdinalEnd: 1
      }),
      makeEvent("gain_credit", {
        actor: "corp",
        eventId: "evt_2",
        actionCostClicks: 1,
        turnActionOrdinalStart: 2,
        turnActionOrdinalEnd: 2
      }),
      makeEvent("play_operation", {
        actor: "corp",
        eventId: "evt_overtime",
        actionCostClicks: 1,
        turnActionOrdinalStart: 3,
        turnActionOrdinalEnd: 3,
        cardDefinitionId: "onr_v1_297_overtime-incentives",
        title: "Overtime Incentives"
      }),
      makeEvent("gain_credit", {
        actor: "corp",
        eventId: "evt_extra_1",
        actionCostClicks: 1,
        turnActionOrdinalStart: 2,
        turnActionOrdinalEnd: 2
      }),
      makeEvent("gain_credit", {
        actor: "corp",
        eventId: "evt_extra_2",
        actionCostClicks: 1,
        turnActionOrdinalStart: 3,
        turnActionOrdinalEnd: 3
      })
    ];
    const actionUseByEventId = chronicleActionUseByEventId(events);
    const firstExtraActionUse = actionUseByEventId.evt_extra_1;
    const secondExtraActionUse = actionUseByEventId.evt_extra_2;
    expect(firstExtraActionUse).toBeDefined();
    expect(secondExtraActionUse).toBeDefined();
    const firstExtra = formatChronicleEvent(events[3]!, "runner", {
      actionUse: firstExtraActionUse ?? null
    });
    const secondExtra = formatChronicleEvent(events[4]!, "runner", {
      actionUse: secondExtraActionUse ?? null
    });

    expect(actionUseByEventId.evt_overtime).toMatchObject({ label: "3", title: "3. Aktion in diesem Zug" });
    expect(firstExtra.actionUse).toMatchObject({ label: "4", title: "4. Aktion in diesem Zug" });
    expect(secondExtra.actionUse).toMatchObject({ label: "5", title: "5. Aktion in diesem Zug" });
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
      makeEvent("resolve_choice", { actor: "corp", eventId: "evt_corp_discard_1", discardResolved: true, hiddenZoneAction: "discard_phase" }),
      makeEvent("draw_card", { actor: "runner", eventId: "evt_runner_draw_1" }),
      makeEvent("end_turn", { actor: "runner", eventId: "evt_runner_end_1" }),
      makeEvent("resolve_choice", { actor: "runner", eventId: "evt_runner_discard_1", discardResolved: true, hiddenZoneAction: "discard_phase" }),
      makeEvent("mandatory_draw", { actor: "corp", eventId: "evt_corp_draw_2" }),
      makeEvent("end_turn", { actor: "corp", eventId: "evt_corp_end_2" }),
      makeEvent("end_turn", { actor: "runner", eventId: "evt_runner_end_2" })
    ]);

    expect(turnNumbers).toMatchObject({
      evt_corp_draw_1: 1,
      evt_corp_end_1: 1,
      evt_corp_discard_1: 1,
      evt_runner_draw_1: 2,
      evt_runner_end_1: 2,
      evt_runner_discard_1: 2,
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

  it("formats region replacement trash effects without leaking hidden old names", () => {
    const visibleItems = formatChronicleEffectItems(
      makeEvent("install_card", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "region-replace-visible",
            kind: "trash_card",
            visibility: "public",
            side: "corp",
            reason: "region_limit",
            cardDefinitionId: "onr_v1_355_crystal-palace-station-grid",
            cardTitle: "Crystal Palace Station Grid",
            sourceDefinitionId: "onr_v1_365_paris-city-grid",
            sourceTitle: "Paris City Grid",
            serverLabel: "Remote 1"
          }
        ]
      }),
      "corp"
    );
    expect(visibleItems[0]?.title).toBe("Crystal Palace Station Grid wurde durch Paris City Grid ins Archiv gelegt.");
    expect(visibleItems[0]?.chips).toContain("Region");

    const hiddenItems = formatChronicleEffectItems(
      makeEvent("install_card", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "region-replace-hidden",
            kind: "trash_card",
            visibility: "public",
            side: "corp",
            reason: "region_limit",
            redactedKind: "installed_card",
            sourceDefinitionId: "onr_v1_365_paris-city-grid",
            sourceTitle: "Paris City Grid",
            serverLabel: "Remote 1"
          }
        ]
      }),
      "runner"
    );
    expect(hiddenItems[0]?.title).toBe("Eine vorhandene Region wurde durch Paris City Grid ins Archiv gelegt.");
    expect(JSON.stringify(hiddenItems)).not.toContain("Crystal Palace Station Grid");
    expect(JSON.stringify(hiddenItems)).not.toContain("onr_v1_355_crystal-palace-station-grid");
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

  it("redacts automatic hidden card movements before titles and card fields are exposed", () => {
    const hiddenBarrierItems = formatChronicleEffectItems(
      makeEvent("install_card", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "region-replacement",
            kind: "trash_card",
            visibility: "hidden_info_barrier",
            side: "corp",
            cardDefinitionId: "simple_agenda",
            cardTitle: "Simple Agenda",
            sourceDefinitionId: "secret_region_upgrade",
            sourceTitle: "Secret Region Upgrade",
            redactedKind: "region_replacement"
          }
        ]
      }),
      "runner"
    );
    const privateSideItems = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "runner",
        resolvedEffects: [
          {
            effectId: "runner-private-trash",
            kind: "trash_card",
            visibility: "private_to_side",
            side: "runner",
            cardDefinitionId: "onr_v1_036_jackhammer",
            cardTitle: "Jackhammer",
            sourceDefinitionId: "runner_secret_source",
            sourceTitle: "Runner Secret Source"
          }
        ]
      }),
      "corp"
    );

    expect(hiddenBarrierItems[0]?.title).toBe("Ein verdecktes Region Upgrade wurde ersetzt.");
    expect(hiddenBarrierItems[0]?.visibility).toBe("redacted");
    expect(hiddenBarrierItems[0]?.category).toBe("hidden");
    expect(hiddenBarrierItems[0]?.cardDefinitionId).toBeUndefined();
    expect(hiddenBarrierItems[0]?.cardTitle).toBeUndefined();
    expect(JSON.stringify(hiddenBarrierItems[0])).not.toMatch(/Simple Agenda|simple_agenda|Secret Region Upgrade|secret_region_upgrade/);
    expect(privateSideItems[0]?.title).toBe("Eine verdeckte Karte wurde in den Heap gelegt.");
    expect(privateSideItems[0]?.visibility).toBe("redacted");
    expect(JSON.stringify(privateSideItems[0])).not.toMatch(/Jackhammer|onr_v1_036_jackhammer|Runner Secret Source|runner_secret_source/);
  });

  it("shows Top Runners' Conference start-of-turn credits from automatic effects", () => {
    const items = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "runner.start.top_runners_conference.card_123",
            kind: "gain_credits",
            visibility: "public",
            side: "runner",
            amount: 3,
            sourceDefinitionId: "onr_v1_184_top-runners-conference",
            sourceTitle: "Top Runners' Conference",
            reason: "start_of_turn"
          }
        ]
      }),
      "runner"
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Du hast 3 Credits durch Top Runners' Conference erhalten.");
    expect(items[0]?.category).toBe("economy");
    expect(items[0]?.cardDefinitionId).toBe("onr_v1_184_top-runners-conference");
    expect(items[0]?.chips).toEqual(expect.arrayContaining(["+3 Credits", "Automatisch"]));
  });

  it("shows recurring-credit refreshes from automatic start-of-turn effects", () => {
    const items = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "runner.start.recurring_credit.card_456",
            kind: "counter_change",
            visibility: "public",
            side: "runner",
            amount: 1,
            counterType: "recurring_credit",
            remainingCounters: 1,
            addedCounterAmount: 1,
            sourceDefinitionId: "onr_v1_176_the-shell-traders",
            sourceTitle: "The Shell Traders",
            reason: "start_of_turn"
          }
        ]
      }),
      "runner"
    );

    expect(items[0]?.title).toBe("Du hast Recurring Credits auf The Shell Traders aufgefrischt.");
    expect(items[0]?.category).toBe("card");
    expect(items[0]?.chips).toEqual(expect.arrayContaining(["Recurring Credits", "1 bereit", "+1", "Automatisch"]));
  });

  it("shows Shell Traders start-of-turn counter removal on the prepared target card", () => {
    const items = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "runner.start.shell_traders.shell_1.simple_fracter_1",
            kind: "counter_change",
            visibility: "public",
            side: "runner",
            amount: 1,
            counterType: "shell",
            removedCounterAmount: 1,
            remainingCounters: 1,
            sourceDefinitionId: "onr_v1_176_the-shell-traders",
            sourceTitle: "The Shell Traders",
            cardDefinitionId: "simple_fracter",
            cardTitle: "Simple Fracter",
            reason: "start_of_turn"
          }
        ]
      }),
      "runner"
    );

    expect(items[0]?.title).toBe("Du hast 1 Shell-Counter von Simple Fracter entfernt.");
    expect(items[0]?.groupLabel).toBe("Runner-Zug");
    expect(items[0]?.cardDefinitionId).toBe("simple_fracter");
    expect(items[0]?.cardTitle).toBe("Simple Fracter");
    expect(items[0]?.chips).toEqual(expect.arrayContaining(["The Shell Traders", "Shell-Counter", "1 entfernt", "1 übrig"]));
  });

  it("shows Braindance Campaign turn-start drain as one credit message", () => {
    const items = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "runner",
        resolvedEffects: [
          {
            effectId: "corp.start.braindance_campaign.card_311",
            kind: "gain_credits",
            visibility: "public",
            side: "corp",
            amount: 2,
            sourceDefinitionId: "onr_v1_311_braindance-campaign",
            sourceTitle: "Braindance Campaign",
            reason: "start_of_turn"
          },
          {
            effectId: "corp.start.braindance_campaign.bits.card_311",
            kind: "counter_change",
            visibility: "public",
            side: "corp",
            amount: 2,
            counterType: "bit",
            removedCounterAmount: 2,
            remainingCounters: 2,
            sourceDefinitionId: "onr_v1_311_braindance-campaign",
            sourceTitle: "Braindance Campaign",
            reason: "start_of_turn"
          }
        ]
      }),
      "corp"
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Du hast 2 Credits von Braindance Campaign genommen.");
    expect(items[0]?.category).toBe("economy");
    expect(items[0]?.chips).toEqual(expect.arrayContaining(["+2 Credits", "Automatisch"]));
    expect(JSON.stringify(items)).not.toContain("aufgefrischt");
    expect(JSON.stringify(items)).not.toContain("bereit");
  });

  it("shows delayed agenda steals from automatic start-of-turn effects", () => {
    const items = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "runner.start.bizarre_encryption.card_789",
            kind: "steal_agenda",
            visibility: "public",
            side: "runner",
            amount: 2,
            cardDefinitionId: "onr_v1_203_hostile-takeover",
            cardTitle: "Hostile Takeover",
            sourceDefinitionId: "onr_v1_351_bizarre-encryption-scheme",
            sourceTitle: "Bizarre Encryption Scheme",
            reason: "start_of_turn"
          }
        ]
      }),
      "runner"
    );

    expect(items[0]?.title).toBe("Du hast Hostile Takeover durch Bizarre Encryption Scheme gestohlen.");
    expect(items[0]?.category).toBe("agenda");
    expect(items[0]?.chips).toEqual(expect.arrayContaining(["Agenda", "+2 Agenda", "Automatisch"]));
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
