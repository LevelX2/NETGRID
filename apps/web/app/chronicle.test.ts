import { describe, expect, it } from "vitest";
import type { PublicGameEvent, Side } from "@netgrid/shared";
import {
  chronicleActionUseByEventId,
  chronicleRunGroupLabelFromEvent,
  chronicleStartTurnEffectGroupFromEvent,
  chronicleTurnNumberByEventId,
  chronicleTurnSideByEventId,
  formatChronicleEffectItems,
  formatChronicleEvent,
  shouldSuppressChronicleEventItem,
} from "./chronicle";

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
  "game_created",
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
        label: "Korp verliert durch Zeitablauf.",
      }),
      "runner",
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
        setupDecision: "keep",
      }),
      "runner",
    );
    const corpMulligan = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        setupStep: "mulligan",
        setupSide: "corp",
        setupDecision: "mulligan",
      }),
      "runner",
    );
    const legacy = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        setupStep: "mulligan",
        setupSide: "runner",
      }),
      "runner",
    );

    expect(runnerKeep.title).toBe("Runner hat die Starthand behalten.");
    expect(runnerKeep.chips).toEqual(
      expect.arrayContaining(["Setup", "Starthand", "Behalten"]),
    );
    expect(corpMulligan.title).toBe("Korp hat einen Mulligan genommen.");
    expect(corpMulligan.chips).toEqual(
      expect.arrayContaining(["Setup", "Starthand", "Mulligan"]),
    );
    expect(legacy.title).toBe(
      "Runner hat die Mulligan-Entscheidung abgeschlossen.",
    );
    expect(legacy.title).not.toContain("Setup-Entscheidung");
  });

  it("redacts hidden Corp installs from the Runner perspective", () => {
    const item = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "corp",
        label: "Korp installiert eine Karte.",
        redactedKind: "installed_card",
      }),
      "runner",
      {
        cardTitle: "Simple Agenda",
        cardText: "2 Agenda-Punkte.",
        cardDetailLines: ["Korp · agenda"],
      },
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
        serverLabel: "R&D",
      }),
      "runner",
    );

    expect(item.title).toBe("Du hast einen Run auf R&D gestartet.");
    expect(item.chips).toContain("Run");
    expect(item.chips).toContain("R&D");
  });

  it("labels Wilson runs without adding cap details to chronicle chips", () => {
    const item = formatChronicleEvent(
      makeEvent("start_run", {
        actor: "runner",
        aiReasonCode: "runner.run_only_action.preferred",
        label: "Wilson-Run auf HQ",
        serverLabel: "HQ",
        runnerAbility: "gain_run_only_action",
        runOnlyAction: true,
        runSpendingCap: 3,
      }),
      "corp",
    );

    expect(item.title).toBe(
      "Die Runner-KI hat einen Wilson-Run auf HQ gestartet.",
    );
    expect(item.chips).toEqual(["Runner", "KI", "Run", "HQ"]);
    expect(item.chips).not.toContain("Wilson");
    expect(item.chips).not.toContain("Limit 3 Credits");
  });

  it("formats runner event runs as run starts for the chronicle group", () => {
    const event = makeEvent("play_event", {
      actor: "runner",
      aiReasonCode: "runner.plan.remote_contest",
      cardDefinitionId: "onr_proteus_106_disgruntled-ice-technician",
      title: "Disgruntled Ice Technician",
      label: "Disgruntled Ice Technician auf Remote 1",
      runnerEventRun: true,
      serverLabel: "Remote 1",
    });
    const item = formatChronicleEvent(event, "corp", {
      cardTitle: "Disgruntled Ice Technician",
      cardType: "event",
    });

    expect(item.title).toBe(
      "Die Runner-KI hat Disgruntled Ice Technician gespielt und einen Run auf Remote 1 gestartet.",
    );
    expect(item.category).toBe("run");
    expect(item.importance).toBe("important");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Event", "Run", "Remote 1"]),
    );
    expect(item.groupLabel).toBe("Run auf Remote 1");
    expect(chronicleRunGroupLabelFromEvent(event)).toBe("Run auf Remote 1");
  });

  it("describes the full Social Engineering choice chain and run start", () => {
    const hiddenChoice = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        aiReasonCode: "runner.social_engineering",
        sourceDefinitionId: "onr_v1_111_social-engineering",
        hiddenZoneBarrier: true,
      }),
      "corp",
    );
    const wrongGuess = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        sourceDefinitionId: "onr_v1_111_social-engineering",
        hiddenZoneBarrier: true,
        amounts: {
          secretHiddenAmountRevealed: 3,
          secretGuessAmount: 4,
        },
        targets: {
          secretSpendGuessRunGuessCorrect: false,
        },
      }),
      "corp",
    );
    const correctGuess = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        sourceDefinitionId: "onr_v1_111_social-engineering",
        hiddenZoneBarrier: true,
        amounts: {
          secretHiddenAmountRevealed: 3,
          secretGuessAmount: 3,
        },
        targets: {
          secretSpendGuessRunGuessCorrect: true,
        },
      }),
      "corp",
    );
    const noIceTarget = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        sourceDefinitionId: "onr_v1_111_social-engineering",
        hiddenZoneBarrier: true,
        amounts: {
          secretHiddenAmountRevealed: 2,
          secretGuessAmount: 4,
        },
        targets: {
          secretSpendGuessRunGuessCorrect: false,
          secretSpendGuessRunNoIceTarget: true,
        },
      }),
      "corp",
    );
    const targetChoiceEvent = makeEvent("resolve_choice", {
      actor: "runner",
      aiReasonCode: "runner.social_engineering",
      sourceDefinitionId: "onr_v1_111_social-engineering",
      hiddenZoneBarrier: true,
      serverId: "hq",
      serverLabel: "HQ",
      socialEngineeringRun: true,
      amounts: {
        chosenIcePosition: 0,
      },
      targets: {
        secretSpendGuessRunGuessCorrect: false,
        autoPassChosenIce: true,
      },
    });
    const targetChoice = formatChronicleEvent(targetChoiceEvent, "corp");

    expect(hiddenChoice.title).toBe(
      "Die Runner-KI hat für Social Engineering verdeckt Credits gewählt.",
    );
    expect(hiddenChoice.description).toBe(
      "Der Betrag bleibt bis zum Korp-Guess verdeckt.",
    );
    expect(hiddenChoice.chips).toEqual(
      expect.arrayContaining(["Social Engineering", "Verdeckte Wahl"]),
    );
    expect(wrongGuess.title).toBe(
      "Social Engineering: Korp hat falsch geraten; Runner wählt Server und ICE.",
    );
    expect(wrongGuess.description).toBe(
      "Runner versteckte 3 Credits; die Korp riet 4 Credits. Der Runner darf danach einen Server und ein ICE für den Auto-Pass-Run wählen.",
    );
    expect(wrongGuess.chips).toEqual(
      expect.arrayContaining([
        "Social Engineering",
        "Guess falsch",
        "Runner 3",
        "Korp 4",
        "Zielwahl",
      ]),
    );
    expect(correctGuess.title).toBe(
      "Social Engineering: Korp hat richtig geraten; Runner verliert 3 Credits.",
    );
    expect(correctGuess.description).toBe(
      "Runner versteckte 3 Credits; die Korp riet 3 Credits.",
    );
    expect(correctGuess.chips).toEqual(
      expect.arrayContaining([
        "Social Engineering",
        "Guess richtig",
        "Runner 3",
        "Korp 3",
        "-3 Credits",
      ]),
    );
    expect(noIceTarget.title).toBe(
      "Social Engineering: Korp hat falsch geraten; kein ICE-Ziel verfügbar.",
    );
    expect(noIceTarget.description).toBe(
      "Runner versteckte 2 Credits; die Korp riet 4 Credits. Es gibt kein installiertes ICE, das für den Auto-Pass gewählt werden kann.",
    );
    expect(noIceTarget.chips).toEqual(
      expect.arrayContaining([
        "Social Engineering",
        "Guess falsch",
        "Runner 2",
        "Korp 4",
        "Kein ICE",
      ]),
    );
    expect(targetChoice.title).toBe(
      "Die Runner-KI hat durch Social Engineering HQ und ICE 1 gewählt; Run auf HQ gestartet und Auto-Pass für dieses ICE vorgemerkt.",
    );
    expect(targetChoice.description).toBe(
      "Die Korp bekommt vor dem Auto-Pass die normale Rez-Gelegenheit.",
    );
    expect(targetChoice.category).toBe("run");
    expect(targetChoice.cardDefinitionId).toBe("onr_v1_111_social-engineering");
    expect(targetChoice.cardTitle).toBe("Social Engineering");
    expect(targetChoice.groupLabel).toBe("Run auf HQ");
    expect(targetChoice.chips).toEqual(
      expect.arrayContaining([
        "Social Engineering",
        "Run",
        "HQ",
        "ICE 1",
        "Auto-Pass",
      ]),
    );
    expect(chronicleRunGroupLabelFromEvent(targetChoiceEvent)).toBe(
      "Run auf HQ",
    );
  });

  it("explains public post-pass ICE return decisions", () => {
    const returned = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "corp",
        corpPostPassIceAbility: "return_passed_ice_to_hq",
        sourceDefinitionId: "onr_proteus_043_twisty-passages",
        sourceTitle: "Twisty Passages",
        passedIceDefinitionId: "onr_proteus_043_twisty-passages",
        returnedCardDefinitionId: "onr_proteus_043_twisty-passages",
        serverLabel: "R&D",
        decision: "return_to_hq",
        returnedToHq: true,
        paymentAmount: 1,
      }),
      "runner",
    );
    const paid = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "corp",
        corpPostPassIceAbility: "return_passed_ice_to_hq",
        sourceDefinitionId: "onr_proteus_043_twisty-passages",
        sourceTitle: "Twisty Passages",
        passedIceDefinitionId: "onr_proteus_043_twisty-passages",
        serverLabel: "R&D",
        decision: "pay",
        paymentAmount: 1,
        paidCredits: 1,
      }),
      "runner",
    );

    expect(returned.title).toBe(
      "Die Korp hat Twisty Passages nach dem Passieren auf R&D ins HQ zurückgenommen.",
    );
    expect(returned.description).toBe(
      "Twisty Passages wurde statt 1 Credit zu zahlen uninstalliert und im HQ gespeichert.",
    );
    expect(returned.category).toBe("run");
    expect(returned.importance).toBe("important");
    expect(returned.visibility).toBe("public");
    expect(returned.cardDefinitionId).toBe("onr_proteus_043_twisty-passages");
    expect(returned.cardTitle).toBe("Twisty Passages");
    expect(returned.chips).toEqual(
      expect.arrayContaining(["Twisty Passages", "Post-Pass", "HQ", "R&D"]),
    );
    expect(paid.title).toBe(
      "Die Korp hat 1 Credit für Twisty Passages nach dem Passieren bezahlt.",
    );
    expect(paid.description).toBe(
      "Twisty Passages bleibt auf R&D installiert; der Run läuft weiter.",
    );
    expect(paid.chips).toEqual(
      expect.arrayContaining(["Twisty Passages", "Post-Pass", "1 Credit"]),
    );
  });

  it("describes Runner jack-out as a run abort without access", () => {
    const item = formatChronicleEvent(
      makeEvent("jack_out", {
        actor: "runner",
        label: "Jack-out",
        serverLabel: "R&D",
      }),
      "corp",
    );

    expect(item.title).toBe("Der Runner hat den Run abgebrochen.");
    expect(item.description).toBe("Auf R&D wurde keine Karte zugegriffen.");
    expect(item.category).toBe("run");
    expect(item.chips).toEqual([
      "Runner",
      "Run",
      "Jack-out",
      "Kein Zugriff",
      "R&D",
    ]);
  });

  it("describes Viral 15 paid jack-out as rig protection", () => {
    const item = formatChronicleEvent(
      makeEvent("jack_out", {
        actor: "runner",
        serverLabel: "R&D",
        v1922CorpIceAbility: "viral_15_jack_out_tax",
        sourceDefinitionId: "onr_v1_276_viral-15",
        jackOutAdditionalCost: 1,
        runnerCreditsAfter: 4,
      }),
      "corp",
    );

    expect(item.title).toBe("Der Runner hat den Run für 1 Credit abgebrochen.");
    expect(item.description).toBe(
      "Viral 15: Jack-out bezahlt; auf R&D wurde keine Karte zugegriffen und kein Programm getrasht.",
    );
    expect(item.cardDefinitionId).toBe("onr_v1_276_viral-15");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Viral 15", "1 Credit", "Rig geschützt"]),
    );
  });

  it("shows Viral 15 program-trash choice opening and resolution", () => {
    const opened = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        sourceDefinitionId: "onr_v1_276_viral-15",
        hiddenZoneBarrier: true,
        passIceTrashProgramPrompt: true,
        passIceTrashProgramCandidateCount: 2,
      }),
      "corp",
    );
    const resolved = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        sourceDefinitionId: "onr_v1_276_viral-15",
        hiddenZoneAction: "v1922_viral_15_program_trash",
        programTrashCount: 1,
        trashedCardDefinitionId: "onr_v1_039_krash",
      }),
      "corp",
    );

    expect(opened.title).toBe(
      "Der Runner hat trotz Viral 15 weitergemacht; Programmtrash muss gewählt werden.",
    );
    expect(opened.description).toBe(
      "2 installierte Programme stehen in der Runner-privaten Auswahl.",
    );
    expect(opened.chips).toEqual(
      expect.arrayContaining([
        "Viral 15",
        "Programmtrash-Choice",
        "2 Kandidaten",
      ]),
    );
    expect(resolved.title).toBe(
      "Der Runner hat Krash durch Viral 15 getrasht.",
    );
    expect(resolved.description).toBe(
      "Der Programmtrash wurde über eine Runner-private Auswahl aufgelöst; verdeckte Hand- oder Stack-Daten bleiben verborgen.",
    );
    expect(resolved.category).toBe("danger");
    expect(resolved.importance).toBe("critical");
    expect(JSON.stringify(resolved)).not.toMatch(
      /cardInstances|privatePayload|runner_card_/,
    );
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
        startupImmolatorExhausted: true,
      }),
      "runner",
      { cardTitle: "Startup Immolator" },
    );

    expect(item.title).toBe(
      "Du hast Startup Immolator erschöpft, das passierte ICE getrasht und 3 Credits bezahlt.",
    );
    expect(item.description).toBe(
      "Quelle und Ziel sind öffentlich: Startup Immolator wurde erschöpft; das Ziel-ICE wurde in die Archive bewegt.",
    );
    expect(item.category).toBe("run");
    expect(item.visibility).toBe("public");
    expect(item.cardDefinitionId).toBe("onr_v1_068_startup-immolator");
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Startup Immolator",
        "ICE getrasht",
        "Archive",
        "3 Credits",
      ]),
    );
  });

  it("keeps I Spy successful-run follow-up in the run chronicle group", () => {
    const item = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        aiReasonCode: "successful_run_followup",
        label: "I Spy: Spy-Counter platzieren",
        sourceDefinitionId: "onr_v1_032_i-spy",
        runnerUtilityAbility: "i_spy_put_spy_counter",
        counterType: "spy",
        addedCounterAmount: 1,
        serverLabel: "HQ",
      }),
      "corp",
    );

    expect(item.title).toBe(
      "Die Runner-KI hat mit I Spy einen Spy-Counter in HQ platziert.",
    );
    expect(item.description).toBe(
      "Solange der Spy-Counter dort liegt, bleiben installierte Korp-Karten in oder auf HQ für den Runner sichtbar.",
    );
    expect(item.category).toBe("run");
    expect(item.importance).toBe("important");
    expect(item.cardDefinitionId).toBe("onr_v1_032_i-spy");
    expect(item.cardTitle).toBe("I Spy");
    expect(item.groupLabel).toBe("Run auf HQ");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Runner", "KI", "I Spy", "+1 Spy", "HQ"]),
    );
    expect(item.chips).not.toContain("Kartenaktion");
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
        rezCostPaid: 2,
      }),
      "corp",
      { cardTitle: "Crystal Wall", cardType: "ice" },
    );

    expect(item.title).toBe(
      "Du hast Crystal Wall mit Olivia Salazar für 2 Credits gerezzt. Die Begegnung beginnt.",
    );
    expect(item.description).toBe(
      "Olivia Salazar reduziert die effektiven Rez-Kosten von 4 Credits auf 2 Credits; das ICE wird am Runende derezzt.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Olivia Salazar",
        "2 Credits",
        "Temporär",
        "Rez",
        "Begegnung",
      ]),
    );
  });

  it("formats hosted Coup agenda credits with the remaining amount", () => {
    const item = formatChronicleEvent(
      makeEvent("activated_card_ability", {
        actor: "corp",
        label: "Political Coup: 3 Credits nehmen",
        cardDefinitionId: "onr_v1_209_political-coup",
        title: "Political Coup",
        cardImplementationAbility: "activated",
        gainedCredits: 3,
        hostedCreditsTaken: 3,
        hostedCreditsAfter: 9,
        resolvedEffects: [
          {
            effectId: "onr_v1_209_political-coup.effect.0.take_hosted_credits",
            kind: "take_hosted_credits",
            visibility: "public",
            side: "corp",
            amount: 3,
            remainingCounters: 9,
            sourceDefinitionId: "onr_v1_209_political-coup",
            sourceTitle: "Political Coup",
            reason: "card_resolver",
          },
        ],
      }),
      "corp",
    );

    expect(item.title).toBe(
      "Du hast Political Coup genutzt und 3 Credits von der Karte genommen.",
    );
    expect(item.category).toBe("economy");
    expect(item.importance).toBe("normal");
    expect(item.chips).toContain("Ability");
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
        remainingCounters: 3,
      }),
      "runner",
      { cardTitle: "Broker" },
    );
    const take = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        label: "Broker: 3 Credits nehmen",
        title: "Broker",
        resourceAbility: "broker_take_credits",
        gainedCredits: 3,
        remainingCounters: 0,
      }),
      "runner",
      { cardTitle: "Broker" },
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
        shellCounterAmount: 2,
      }),
      "runner",
      { cardTitle: "Simple Fracter" },
    );
    const remove = formatChronicleEvent(
      makeEvent("end_turn", {
        actor: "runner",
        label: "The Shell Traders: 1 Shell-Counter entfernen",
        title: "Simple Fracter",
        shellTradersAbility: "start_turn_remove_shell_counter",
        remainingCounters: 0,
        installedFromSpecialZone: true,
      }),
      "runner",
      { cardTitle: "Simple Fracter" },
    );

    expect(setAside.title).toBe(
      "Du hast Simple Fracter mit 2 Shell-Countern beiseitegelegt.",
    );
    expect(setAside.chips).toContain("Set Aside");
    expect(setAside.chips).toContain("Simple Fracter");
    expect(setAside.chips).toContain("2 Shell");
    expect(remove.title).toBe(
      "Du hast 1 Shell-Counter von Simple Fracter entfernt; Karte kostenlos installiert.",
    );
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
        remainingCounters: 1,
      }),
      "runner",
    );
    const startTurn = formatChronicleEvent(
      makeEvent("end_turn", {
        actor: "runner",
        label: "The Shell Traders: 1 Shell-Counter entfernen",
        title: "The Shell Traders",
        shellTradersAbility: "start_turn_remove_shell_counter",
        targetCardDefinitionId: "simple_decoder",
        remainingCounters: 0,
        installedFromSpecialZone: true,
      }),
      "runner",
    );

    expect(paid.title).toBe(
      "Du hast 1 Shell-Counter von Simple Fracter entfernt.",
    );
    expect(startTurn.title).toBe(
      "Du hast 1 Shell-Counter von Simple Decoder entfernt; Karte kostenlos installiert.",
    );
    expect(JSON.stringify([paid, startTurn])).not.toContain(
      "von The Shell Traders entfernt",
    );
  });

  it("keeps end-turn entries and shows card credit payouts as separate economy entries", () => {
    const event = makeEvent("end_turn", {
      actor: "runner",
      gainedCredits: 2,
      runnerCreditsAfter: 12,
      corpRezzedIceThisTurnCount: 2,
      sourceDefinitionId: "onr_v1_162_field-reporter-for-ice-and-data",
    });
    const item = formatChronicleEvent(event, "runner");
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe("Du hast den Zug beendet.");
    expect(item.category).toBe("turn");
    expect(effects).toHaveLength(1);
    expect(effects[0]?.title).toBe(
      "Die Korp hat in diesem Zug 2 ICE gerezzt. Du erhältst durch Field Reporter for Ice and Data 2 Credits.",
    );
    expect(effects[0]?.category).toBe("economy");
    expect(effects[0]?.importance).toBe("important");
    expect(effects[0]?.cardDefinitionId).toBe(
      "onr_v1_162_field-reporter-for-ice-and-data",
    );
    expect(effects[0]?.chips).toEqual(
      expect.arrayContaining([
        "Zugende",
        "+2 Credits",
        "2 ICE gerezzt",
        "Field Reporter for Ice and Data",
      ]),
    );
  });

  it("names generic card abilities from their public action label", () => {
    const item = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        label:
          "Self-Modifying Code: trashen und Programm aus Stack installieren",
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast Self-Modifying Code aktiviert: trashen und Programm aus Stack installieren.",
    );
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
        cardDefinitionId: "simple_barrier_ice",
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast Simple Barrier ICE in HQ mit SeeYa aufgedeckt.",
    );
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
        revealedAgendaDefinitionIds:
          "simple_agenda,onr_v1_203_hostile-takeover",
        revealedCount: 2,
        gainedCredits: 2,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Die Korp hat 2 Agenden aus HQ durch Corporate Negotiating Center vorgezeigt und 2 Credits erhalten.",
    );
    expect(item.description).toBe(
      "Gezeigt: Simple Agenda, Hostile Takeover. Timing: Start-of-turn.",
    );
    expect(item.category).toBe("agenda");
    expect(item.visibility).toBe("public");
    expect(item.cardDefinitionId).toBe(
      "onr_v1_314_corporate-negotiating-center",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Corporate Negotiating Center",
        "HQ Reveal",
        "2 Agenden",
        "+2 Credits",
        "Start-of-turn",
      ]),
    );
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
        gainedCredits: 2,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast Force Shield mit Smith's Pawnshop getrasht und 2 Credits erhalten.",
    );
    expect(item.category).toBe("economy");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Smith's Pawnshop", "+2 Credits", "Trash"]),
    );
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
        title: "Worm",
      }),
      "runner",
    );
    const installed = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "search_stack",
        searchReveal: "public",
        searchDestination: "install_program",
        searchShuffleAfter: true,
        installSucceeded: true,
        title: "Worm",
      }),
      "runner",
    );

    expect(failed.title).toBe(
      "Du hast Worm aus dem Stack vorgezeigt, aber nicht installiert.",
    );
    expect(failed.chips).toContain("Nicht installiert");
    expect(installed.title).toBe(
      "Du hast Worm aus dem Stack vorgezeigt und im Rig installiert.",
    );
  });

  it("shows Self-Modifying Code stack choices with the selected program", () => {
    const activated = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        title: "Self-Modifying Code",
        sourceDefinitionId: "onr_v1_059_self-modifying-code",
        label:
          "Self-Modifying Code: trashen und Programm aus Stack installieren",
      }),
      "runner",
    );
    const installed = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "self_modifying_code_install_program",
        publicRevealDefinitionId: "simple_decoder",
        installedProgramDefinitionId: "simple_decoder",
        searchDestination: "runner_rig",
        installed: true,
        shuffled: true,
      }),
      "runner",
    );

    expect(activated.title).toBe(
      "Du hast Self-Modifying Code aktiviert: trashen und Programm aus Stack installieren.",
    );
    expect(installed.title).toBe(
      "Du hast Simple Decoder aus dem Stack vorgezeigt und im Rig installiert.",
    );
    expect(installed.chips).toEqual(
      expect.arrayContaining([
        "Self-Modifying Code",
        "Vorgezeigt",
        "Installiert",
        "Shuffle",
      ]),
    );
    expect(installed.title).not.toContain("Entscheidung beantwortet");
  });

  it("shows The Short Circuit activation and selected program concretely", () => {
    const activated = formatChronicleEvent(
      makeEvent("gain_credit", {
        actor: "runner",
        hiddenZoneAction: "v1911_short_circuit_search",
        sourceDefinitionId: "onr_v1_177_the-short-circuit",
      }),
      "runner",
    );
    const resolved = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "v1911_short_circuit_search",
        sourceDefinitionId: "onr_v1_177_the-short-circuit",
        publicRevealDefinitionId: "simple_decoder",
        cardDefinitionId: "simple_decoder",
        searchDestination: "runner_grip",
        shuffled: true,
      }),
      "corp",
    );

    expect(activated.title).toBe(
      "Du hast The Short Circuit genutzt und eine Stack-Suche geöffnet.",
    );
    expect(activated.chips).toEqual(
      expect.arrayContaining(["The Short Circuit", "Stack-Suche"]),
    );
    expect(resolved.title).toBe(
      "Der Runner hat The Short Circuit genutzt, Simple Decoder der Korp gezeigt und in die Hand genommen.",
    );
    expect(resolved.description).toBe("Der Stack wurde danach gemischt.");
    expect(resolved.chips).toEqual(
      expect.arrayContaining([
        "The Short Circuit",
        "Vorgezeigt",
        "Hand",
        "Shuffle",
      ]),
    );
    expect(resolved.title).not.toContain("Entscheidung beantwortet");
  });

  it("shows Mystery Box Runner-AI install choices with selected program and run context", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction:
          "p3_38_look_top_stack_show_to_corp_then_install_matching",
        sourceDefinitionId: "onr_v1_043_mystery-box",
        revealCount: 5,
        revealedCardDefinitionIds: "simple_decoder,simple_fracter",
        publicRevealDefinitionId: "simple_decoder",
        installedProgramDefinitionId: "simple_decoder",
        installed: true,
        installedProgramCount: 1,
        selfTrashed: true,
        shufflePerformed: true,
        shuffled: true,
        aiReasonCode: "runner_stack_top_program_install",
      }),
      "corp",
    );

    expect(item.title).toBe(
      "Die Runner-KI hat Simple Decoder mit Mystery Box gewählt und im Rig installiert.",
    );
    expect(item.description).toBe(
      "Die obersten 5 Stack-Karten wurden der Korp gezeigt; Mystery Box wurde getrasht; der Stack wurde danach gemischt.",
    );
    expect(item.category).toBe("run");
    expect(item.groupLabel).toBe("Run");
    expect(item.cardDefinitionId).toBe("simple_decoder");
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Runner",
        "KI",
        "Mystery Box",
        "Top 5",
        "Korp-Reveal",
        "Installiert",
        "Source-Trash",
        "Shuffle",
      ]),
    );
    expect(item.title).not.toContain("Entscheidung beantwortet");
  });

  it("shows Mystery Box no-program reviews without the generic choice fallback", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        hiddenZoneAction:
          "p3_38_look_top_stack_show_to_corp_then_install_matching",
        sourceDefinitionId: "onr_v1_043_mystery-box",
        revealCount: 5,
        revealedCardDefinitionIds: "simple_barrier_ice,simple_economy_event",
        revealedProgramCount: 0,
        programFound: false,
        installedProgramCount: 0,
        selfTrashed: false,
        shufflePerformed: true,
        shuffled: true,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Die Korp hat Mystery Box bestätigt; kein installierbares Programm wurde gefunden.",
    );
    expect(item.description).toBe(
      "Die obersten 5 Stack-Karten wurden der Korp gezeigt; Mystery Box bleibt installiert; der Stack wurde danach gemischt.",
    );
    expect(item.category).toBe("run");
    expect(item.groupLabel).toBe("Run");
    expect(item.cardDefinitionId).toBe("onr_v1_043_mystery-box");
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Korp",
        "Mystery Box",
        "Top 5",
        "Korp-Reveal",
        "Keine Installation",
        "Bleibt installiert",
        "Shuffle",
      ]),
    );
    expect(item.title).not.toContain("Entscheidung beantwortet");
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
        advancementCountersAfter: 2,
      }),
      "corp",
    );

    expect(resolved.title).toBe(
      "Du hast 2 Advancement-Counter durch Systematic Layoffs auf Corporate War gelegt.",
    );
    expect(resolved.chips).toEqual(
      expect.arrayContaining([
        "Systematic Layoffs",
        "+2 Advancement",
        "1 Ziel",
      ]),
    );
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
        shuffled: true,
      }),
      "runner",
    );
    const memoryPending = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "self_modifying_code_install_program",
        publicRevealDefinitionId: "simple_decoder",
        searchDestination: "install_program",
        installDeferredForMemory: true,
        installed: false,
        shuffled: true,
      }),
      "runner",
    );
    const memoryResolved = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneAction: "self_modifying_code_free_mu",
        publicRevealDefinitionId: "simple_decoder",
        installedProgramDefinitionId: "simple_decoder",
        trashedCount: 1,
        trashedCardDefinitionIds: "simple_fracter",
        installed: true,
      }),
      "runner",
    );

    expect(blocked.title).toBe(
      "Du hast Simple Decoder aus dem Stack vorgezeigt, aber nicht installiert.",
    );
    expect(blocked.description).toBe("Grund: nicht genug Credits.");
    expect(memoryPending.title).toBe(
      "Du hast Simple Decoder aus dem Stack vorgezeigt; MU muss freigemacht werden.",
    );
    expect(memoryResolved.title).toBe(
      "Du hast Simple Decoder nach MU-Auswahl im Rig installiert.",
    );
    expect(memoryResolved.description).toBe("Für MU getrasht: Simple Fracter.");
  });

  it("shows Runner program trash-before-install choices with installed and trashed programs", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        aiReasonCode: "runner_program_install_memory_cleanup",
        sourceDefinitionId: "onr_proteus_090_highlighter",
        runnerProgramTrashBeforeInstall: true,
        runnerProgramTrashBeforeInstallResolved: true,
        trashedCount: 1,
        trashedCardDefinitionIds: "simple_fracter",
        installed: true,
        memoryUsedAfter: 4,
        memoryLimitAfter: 4,
      }),
      "corp",
    );

    expect(item.title).toBe(
      "Die Runner-KI hat Highlighter im Rig installiert; Simple Fracter wurde für MU getrasht.",
    );
    expect(item.description).toBe("MU nach Installation: 4/4.");
    expect(item.category).toBe("card");
    expect(item.importance).toBe("important");
    expect(item.cardDefinitionId).toBe("onr_proteus_090_highlighter");
    expect(item.cardTitle).toBe("Highlighter");
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Runner",
        "KI",
        "Highlighter",
        "Programmtrash",
        "Installiert",
        "MU freigemacht",
        "Simple Fracter",
      ]),
    );
    expect(item.title).not.toContain("Entscheidung beantwortet");
  });

  it("shows access ambush payment choices in the chronicle", () => {
    const paid = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        ambushDefinitionId: "onr_proteus_057_doppelganger-antibody",
        ambushPaidCost: 2,
      }),
      "runner",
    );
    const declined = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        ambushDefinitionId: "onr_proteus_057_doppelganger-antibody",
        ambushPaidCost: 0,
        ambushPaymentDeclined: true,
      }),
      "runner",
    );

    expect(paid.title).toBe(
      "Die Korp hat 2 Credits für den Access-Ambush von Doppelganger Antibody bezahlt.",
    );
    expect(paid.chips).toEqual(
      expect.arrayContaining([
        "Access-Ambush",
        "Doppelganger Antibody",
        "2 Credits",
      ]),
    );
    expect(paid.title).not.toContain("Entscheidung beantwortet");
    expect(declined.title).toBe(
      "Die Korp hat den Access-Ambush von Doppelganger Antibody nicht bezahlt.",
    );
    expect(declined.chips).toEqual(
      expect.arrayContaining(["Access-Ambush", "Nicht bezahlt"]),
    );
  });

  it("names access ambush choices from resolved effects when payment payload is missing", () => {
    const resolved = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "doppelganger_counter",
            kind: "counter_change",
            visibility: "hidden_info_barrier",
            side: "runner",
            counterType: "link_reduction_counter",
            addedCounterAmount: 1,
            remainingCounters: 1,
            sourceDefinitionId: "onr_proteus_057_doppelganger-antibody",
            sourceTitle: "Doppelganger Antibody",
          },
        ],
      }),
      "runner",
    );

    expect(resolved.title).toBe(
      "Die Korp hat den Access-Ambush von Doppelganger Antibody ausgelöst.",
    );
    expect(resolved.chips).toEqual(
      expect.arrayContaining([
        "Access-Ambush",
        "Doppelganger Antibody",
        "Ausgelöst",
      ]),
    );
    expect(resolved.title).not.toContain("Entscheidung");
  });

  it("shows access ambush counter effects in the chronicle", () => {
    const event = makeEvent("resolve_choice", {
      actor: "corp",
      ambushDefinitionId: "onr_proteus_057_doppelganger-antibody",
      ambushPaidCost: 2,
      resolvedEffects: [
        {
          effectId: "doppelganger_counter",
          kind: "counter_change",
          visibility: "hidden_info_barrier",
          side: "runner",
          counterType: "link_reduction_counter",
          addedCounterAmount: 1,
          remainingCounters: 1,
          sourceDefinitionId: "onr_proteus_057_doppelganger-antibody",
          sourceTitle: "Doppelganger Antibody",
        },
      ],
    });

    const effects = formatChronicleEffectItems(event, "runner");

    expect(effects[0]?.title).toBe(
      "Du hast 1 Doppelganger-Counter durch Doppelganger Antibody erhalten.",
    );
    expect(effects[0]?.chips).toEqual(
      expect.arrayContaining([
        "Access-Ambush",
        "Doppelganger Antibody",
        "+1 Doppelganger-Counter",
      ]),
    );
    expect(effects[0]?.title).not.toContain("verdeckter Effekt");
  });

  it("names Experimental AI access ambush program trash with counters and public target", () => {
    const event = makeEvent("access_card", {
      actor: "runner",
      hiddenZoneAction: "v1919_access_ambush_trash_installed",
      ambushDefinitionId: "onr_v1_323_experimental-ai",
      advancementCounterCount: 1,
      targetTrashCount: 1,
      trashedCount: 1,
      trashedCardDefinitionIds: "onr_v1_007_blink",
      resolvedEffects: [
        {
          effectId: "experimental_ai_trash",
          kind: "trash_card",
          visibility: "hidden_info_barrier",
          side: "runner",
          amount: 1,
          reason: "access_effect",
          sourceDefinitionId: "onr_v1_323_experimental-ai",
          sourceTitle: "Experimental AI",
          cardDefinitionId: "onr_v1_007_blink",
        },
      ],
    });
    const unnamedTargetEvent = makeEvent("access_card", {
      actor: "runner",
      hiddenZoneAction: "v1919_access_ambush_trash_installed",
      ambushDefinitionId: "onr_v1_323_experimental-ai",
      advancementCounterCount: 1,
      targetTrashCount: 1,
      trashedCount: 1,
      resolvedEffects: [
        {
          effectId: "experimental_ai_trash_unknown",
          kind: "trash_card",
          visibility: "hidden_info_barrier",
          side: "runner",
          amount: 1,
          reason: "access_effect",
          sourceDefinitionId: "onr_v1_323_experimental-ai",
          sourceTitle: "Experimental AI",
        },
      ],
    });

    const effects = formatChronicleEffectItems(event, "corp");
    const unnamedEffects = formatChronicleEffectItems(
      unnamedTargetEvent,
      "corp",
    );

    expect(effects[0]?.title).toBe(
      "Experimental AI wurde beim Zugriff ausgelöst: 1 Advancement-Counter trashte Blink.",
    );
    expect(effects[0]?.chips).toEqual(
      expect.arrayContaining([
        "Access-Ambush",
        "Experimental AI",
        "1 Advancement-Counter",
        "Blink",
      ]),
    );
    expect(effects[0]?.cardDefinitionId).toBe("onr_v1_323_experimental-ai");
    expect(effects[0]?.title).not.toContain("verdeckte Karte");
    expect(unnamedEffects[0]?.title).toBe(
      "Experimental AI wurde beim Zugriff ausgelöst: 1 Advancement-Counter trashte 1 Programm.",
    );
    expect(unnamedEffects[0]?.title).not.toContain("Blink");
  });

  it("shows Playful AI die results and follow-up choices in the chronicle", () => {
    const played = formatChronicleEvent(
      makeEvent("play_event", {
        actor: "runner",
        title: "Playful AI",
        cardDefinitionId: "onr_v1_104_playful-ai",
        abilityId: "playful_ai_dice_loop",
        v1921DieRoll: 3,
        playfulAiChoiceOpened: true,
      }),
      "runner",
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
        playfulAiComplete: true,
      }),
      "runner",
    );

    expect(played.title).toBe(
      "Du hast Playful AI gespielt und eine 3 gewürfelt.",
    );
    expect(played.description).toBe(
      "Der Wurf öffnet eine Entscheidung: Credits nehmen oder Würfel beiseitelegen.",
    );
    expect(played.chips).toEqual(
      expect.arrayContaining(["Playful AI", "Wurf 3", "Choice"]),
    );
    expect(resolved.title).toBe(
      "Du hast Playful AI aufgelöst: 1 Credit genommen und 2 Würfel beiseitegelegt.",
    );
    expect(resolved.description).toBe(
      "Danach wurden 2 beiseitegelegte Würfel geworfen: 4, 5. Die Playful-AI-Schleife ist abgeschlossen.",
    );
    expect(resolved.chips).toEqual(
      expect.arrayContaining([
        "Playful AI",
        "+1 Credit",
        "2 beiseite",
        "Würfe 4, 5",
      ]),
    );
  });

  it("shows current engine Playful AI random dice payload fields in the chronicle", () => {
    const played = formatChronicleEvent(
      makeEvent("play_event", {
        actor: "runner",
        title: "Playful AI",
        cardDefinitionId: "onr_v1_104_playful-ai",
        sourceDefinitionId: "onr_v1_104_playful-ai",
        abilityId: "random_dice_loop",
        v1921RunnerEventAbility: "random_dice_loop",
        v1921DieRoll: 5,
        randomDiceLoopRolls: "5",
        randomDiceSplitChoiceOpened: false,
        randomDiceLoopComplete: true,
        randomDiceLoopRemainingDice: 0,
      }),
      "runner",
    );
    const resolved = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        title: "Playful AI",
        sourceDefinitionId: "onr_v1_104_playful-ai",
        abilityId: "random_dice_loop",
        v1921RunnerEventAbility: "random_dice_loop",
        v1921DieRoll: 5,
        randomDiceLoopRolls: "4,5",
        randomDiceSplitGainedCredits: 1,
        randomDiceSplitSetAsideDice: 2,
        randomDiceLoopRolledDice: 2,
        randomDiceLoopQueuedBeforeRolls: 2,
        randomDiceLoopQueuedAfterRolls: 0,
        randomDiceLoopComplete: true,
      }),
      "runner",
    );

    expect(played.title).toBe(
      "Du hast Playful AI gespielt und eine 5 gewürfelt.",
    );
    expect(played.description).toBe(
      "Die Playful-AI-Schleife ist ohne weitere Entscheidung abgeschlossen.",
    );
    expect(played.chips).toEqual(
      expect.arrayContaining(["Playful AI", "Wurf 5", "Fertig"]),
    );
    expect(resolved.title).toBe(
      "Du hast Playful AI aufgelöst: 1 Credit genommen und 2 Würfel beiseitegelegt.",
    );
    expect(resolved.description).toBe(
      "Danach wurden 2 beiseitegelegte Würfel geworfen: 4, 5. Die Playful-AI-Schleife ist abgeschlossen.",
    );
    expect(resolved.chips).toEqual(
      expect.arrayContaining([
        "Playful AI",
        "+1 Credit",
        "2 beiseite",
        "Würfe 4, 5",
      ]),
    );
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
        playfulAiChoiceOpened: true,
      }),
      "runner",
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
        playfulAiComplete: true,
      }),
      "runner",
    );

    expect(partial.description).toBe(
      "Danach wurde 1 von 2 beiseitegelegten Würfeln geworfen: 1. Der letzte Wurf öffnet eine weitere Entscheidung; ein Würfel bleibt danach noch offen.",
    );
    expect(partial.chips).toEqual(
      expect.arrayContaining(["2 beiseite", "Wurf 1", "1 offen"]),
    );
    expect(gainAll.description).toBe(
      "Die Playful-AI-Schleife ist abgeschlossen.",
    );
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
        gainedCredits: 10,
        runnerCreditsAfter: 20,
        hiddenZoneBarrier: true,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast Edited Shipping Manifests gespielt: Korp verliert 1 Credit, Runner erhält 1 Tag, Runner erhält 10 Credits.",
    );
    expect(item.description).toBe(
      "Der erfolgreiche Run wurde ohne Zugriff auf verdeckte Korp-Karten ersetzt.",
    );
    expect(item.category).toBe("danger");
    expect(item.importance).toBe("important");
    expect(item.visibility).toBe("public");
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Access ersetzt",
        "Korp -1",
        "+1 Tag",
        "Runner +10",
      ]),
    );
    expect(JSON.stringify(item)).not.toContain("cardInstances");
    expect(JSON.stringify(item)).not.toContain('"hq"');
    expect(JSON.stringify(item)).not.toContain('"rd"');
  });

  it("describes Record Reconstructor Archives replacement on immediate and protected runs", () => {
    const immediate = formatChronicleEvent(
      makeEvent("activated_card_ability", {
        actor: "runner",
        title: "Record Reconstructor",
        sourceDefinitionId: "onr_v1_142_record-reconstructor",
        accessReplacement: "archives_faceup_to_rd",
        shuffledFaceUpArchivesCount: 4,
        movedCount: 2,
        hiddenZoneBarrier: true,
      }),
      "runner",
    );
    const protectedRun = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        sourceDefinitionId: "onr_v1_142_record-reconstructor",
        accessReplacement: "archives_faceup_to_rd",
        shuffledFaceUpArchivesCount: 3,
        movedCount: 2,
        hiddenZoneBarrier: true,
      }),
      "runner",
    );

    expect(immediate.title).toBe(
      "Du hast Record Reconstructor genutzt: 2 offene Archives-Karten oben auf R&D gelegt.",
    );
    expect(immediate.description).toBe(
      "4 offene Archives-Karten wurden vorher gemischt; es gab keinen normalen Archives-Zugriff.",
    );
    expect(immediate.chips).toEqual(
      expect.arrayContaining([
        "Record Reconstructor",
        "Archives",
        "R&D",
        "2 bewegt",
      ]),
    );
    expect(protectedRun.title).toBe(
      "Du hast Record Reconstructor abgeschlossen: 2 offene Archives-Karten oben auf R&D gelegt.",
    );
    expect(protectedRun.description).toBe(
      "3 offene Archives-Karten wurden vorher gemischt; es gab keinen normalen Archives-Zugriff.",
    );
    expect(JSON.stringify(protectedRun)).not.toContain("cardInstances");
  });

  it("describes Technician Lover private look in the use message and suppresses the confirmation event", () => {
    const activated = makeEvent("activated_card_ability", {
      actor: "runner",
      title: "Technician Lover",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: "rd",
      privateLookCount: 1,
      sourceDefinitionId: "onr_v1_183_technician-lover",
      sourceTitle: "Technician Lover",
      aiReasonCode: "runner_private_look",
    });
    const resolved = makeEvent("resolve_choice", {
      actor: "runner",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: "rd",
      privateLookCount: 1,
      sourceDefinitionId: "onr_v1_183_technician-lover",
      sourceTitle: "Technician Lover",
      aiReasonCode: "runner_private_look",
    });

    const activatedItem = formatChronicleEvent(activated, "corp");
    const resolvedItem = formatChronicleEvent(resolved, "corp");

    expect(activatedItem.title).toBe(
      "Die Runner-KI hat Technician Lover genutzt und die oberste R&D-Karte angesehen.",
    );
    expect(activatedItem.category).toBe("hidden");
    expect(activatedItem.visibility).toBe("public");
    expect(activatedItem.chips).toEqual(
      expect.arrayContaining(["Technician Lover", "R&D", "1 angesehen"]),
    );
    expect(resolvedItem.title).toBe(activatedItem.title);
    expect(resolvedItem.title).not.toContain("Entscheidung beantwortet");
    expect(shouldSuppressChronicleEventItem(resolved)).toBe(true);
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
        selfTrashed: true,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Die Korp hat Schlaghund aktiviert und eine 4 gewürfelt.",
    );
    expect(item.description).toBe(
      "6 Tags reichen aus: 10 Meat Damage und Schlaghund wird getrasht.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining(["Schlaghund", "Wurf 4", "6 Tags", "Damage"]),
    );
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
        rioRunEnded: true,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast Simple Barrier ICE passiert und Rio de Janeiro City Grid würfelt eine 1.",
    );
    expect(item.description).toBe(
      "Der Run endet durch Rio de Janeiro City Grid.",
    );
    expect(item.cardDefinitionId).toBe("simple_barrier_ice");
    expect(item.cardTitle).toBe("Simple Barrier ICE");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Rio", "Remote 1", "Wurf 1", "Run endet"]),
    );
  });

  it("shows Vacuum Link die rolls and their run-rewind meaning", () => {
    const rewound = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        serverLabel: "HQ",
        rezzedIceRewindDieRoll: 3,
        rezzedIceRewindApplied: true,
        rezzedIceRewindRezzedIceBack: 3,
        rezzedIceRewindTargetIceIndex: 1,
      }),
      "runner",
    );
    const noRewind = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        serverLabel: "HQ",
        rezzedIceRewindDieRoll: 5,
        rezzedIceRewindApplied: false,
      }),
      "corp",
    );

    expect(rewound.title).toBe(
      "Du hast Vacuum Link ausgelöst und eine 3 gewürfelt: 3 gerezzte ICE zurück, sonst zum ersten ICE; Runner darf ausstöpseln.",
    );
    expect(rewound.description).toBe(
      "Wurf 3: Runner wird um 3 gerezzte ICE zurückgesetzt oder darf ausstöpseln; wenn nicht so viele ICE vorhanden sind, geht es zum ersten ICE. Ziel ist ICE 2.",
    );
    expect(rewound.cardDefinitionId).toBe("onr_v1_275_vacuum-link");
    expect(rewound.cardTitle).toBe("Vacuum Link");
    expect(rewound.chips).toEqual(
      expect.arrayContaining([
        "Vacuum Link",
        "Wurf 3",
        "Run zurückgesetzt",
        "3 ICE zurück",
        "Ziel ICE 2",
      ]),
    );
    expect(noRewind.title).toBe(
      "Der Runner hat Vacuum Link ausgelöst und eine 5 gewürfelt: kein Zurücksetzen.",
    );
    expect(noRewind.description).toBe(
      "Wurf 5: Kein Zurücksetzen; der Run läuft weiter.",
    );
    expect(noRewind.chips).toEqual(
      expect.arrayContaining(["Vacuum Link", "Wurf 5", "Weiter"]),
    );
    expect(JSON.stringify(rewound)).not.toContain("cardInstances");
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
            cardsTrashed: 2,
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
            cardsTrashed: 2,
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
            endedRun: true,
          },
        ],
      }),
      "runner",
    );

    expect(items.map((item) => item.title)).toEqual([
      "Wall of Ice: Subroutine 1 macht 2 Net Damage.",
      "Wall of Ice: Subroutine 2 macht 2 Net Damage.",
      "Wall of Ice: Subroutine 3 beendet den Run.",
    ]);
    expect(items[0]?.description).toBe("2 Karten wurden in den Heap bewegt.");
    expect(items[0]?.chips).toEqual(
      expect.arrayContaining([
        "Subroutine 1",
        "2 Net Damage",
        "2 Heap",
        "Wall of Ice",
      ]),
    );
    expect(JSON.stringify(items)).not.toContain("runner_card_");
  });

  it("explains prevented subroutine damage with original, prevented and final amounts", () => {
    const preventedItems = formatChronicleEffectItems(
      makeEvent("resolve_choice", {
        actor: "runner",
        sourceDefinitionId: "onr_v1_061_shield",
        title: "Shield",
        eventModificationDecision: "apply",
        eventModificationOutcome: "prevented",
        originalAmount: 2,
        preventedAmount: 2,
        finalAmount: 0,
        damageResolved: true,
        damageType: "net",
        damageAmount: 0,
        cardsTrashed: 0,
        resolvedEffects: [
          {
            effectId: "subroutine_1",
            kind: "resolve_subroutine",
            visibility: "public",
            side: "runner",
            sourceDefinitionId: "onr_proteus_012_bug-zapper",
            sourceTitle: "Bug Zapper",
            subroutineIndex: 0,
            subroutineType: "do_damage",
            damageType: "net",
            amount: 0,
            cardsTrashed: 0,
          },
          {
            effectId: "subroutine_2",
            kind: "resolve_subroutine",
            visibility: "public",
            side: "runner",
            sourceDefinitionId: "onr_proteus_012_bug-zapper",
            sourceTitle: "Bug Zapper",
            subroutineIndex: 1,
            subroutineType: "end_the_run",
            endedRun: true,
          },
        ],
      }),
      "runner",
    );

    expect(preventedItems.map((item) => item.title)).toEqual([
      "Bug Zapper: Subroutine 1 macht 2 Net Damage; 2 durch Shield verhindert, Ergebnis 0 Net Damage.",
      "Bug Zapper: Subroutine 2 beendet den Run.",
    ]);
    expect(preventedItems[0]?.description).toBe(
      "Kein Net Damage bleibt übrig.",
    );
    expect(preventedItems[0]?.chips).toEqual(
      expect.arrayContaining([
        "Subroutine 1",
        "2 Net Damage",
        "2 verhindert",
        "0 Net Damage",
        "Shield",
        "Bug Zapper",
      ]),
    );
    expect(JSON.stringify(preventedItems)).not.toContain("runner_card_");

    const partialItem = formatChronicleEffectItems(
      makeEvent("resolve_choice", {
        actor: "runner",
        sourceDefinitionId: "onr_v1_061_shield",
        title: "Shield",
        eventModificationDecision: "apply",
        eventModificationOutcome: "partially_prevented",
        originalAmount: 3,
        preventedAmount: 2,
        finalAmount: 1,
        damageResolved: true,
        damageType: "net",
        damageAmount: 1,
        cardsTrashed: 1,
        resolvedEffects: [
          {
            effectId: "subroutine_1",
            kind: "resolve_subroutine",
            visibility: "public",
            side: "runner",
            sourceDefinitionId: "onr_proteus_012_bug-zapper",
            sourceTitle: "Bug Zapper",
            subroutineIndex: 0,
            subroutineType: "do_damage",
            damageType: "net",
            amount: 1,
            cardsTrashed: 1,
          },
        ],
      }),
      "runner",
    )[0];

    expect(partialItem?.title).toBe(
      "Bug Zapper: Subroutine 1 macht 3 Net Damage; 2 durch Shield verhindert, Ergebnis 1 Net Damage.",
    );
    expect(partialItem?.description).toBe(
      "eine Karte wurde in den Heap bewegt.",
    );
  });

  it("names the program trashed by Banpei's trash-a-program subroutine", () => {
    const items = formatChronicleEffectItems(
      makeEvent("continue_run", {
        actor: "runner",
        encounterContinue: true,
        result: "ended",
        resolvedEffects: [
          {
            effectId: "subroutine_1",
            kind: "resolve_subroutine",
            visibility: "public",
            side: "runner",
            sourceDefinitionId: "onr_v1_223_banpei",
            sourceTitle: "Banpei",
            subroutineIndex: 0,
            subroutineType: "trash_installed_program",
            cardDefinitionId: "simple_decoder",
            cardTitle: "Simple Decoder",
            cardsTrashed: 1,
          },
          {
            effectId: "subroutine_2",
            kind: "resolve_subroutine",
            visibility: "public",
            side: "runner",
            sourceDefinitionId: "onr_v1_223_banpei",
            sourceTitle: "Banpei",
            subroutineIndex: 1,
            subroutineType: "end_the_run",
            endedRun: true,
          },
        ],
      }),
      "runner",
    );

    expect(items.map((item) => item.title)).toEqual([
      "Banpei: Subroutine 1 trasht Simple Decoder.",
      "Banpei: Subroutine 2 beendet den Run.",
    ]);
    expect(items[0]?.description).toBe(
      "Simple Decoder wurde in den Heap bewegt.",
    );
    expect(items[0]?.chips).toEqual(
      expect.arrayContaining([
        "Subroutine 1",
        "Simple Decoder",
        "Programm getrasht",
        "Banpei",
      ]),
    );
  });

  it("suppresses redundant Encounter summaries when concrete subroutine lines exist", () => {
    const event = makeEvent("continue_run", {
      actor: "runner",
      encounterContinue: true,
      result: "ended",
      unbrokenSubroutineCount: 2,
      trashedCardDefinitionId: "onr_v1_042_self-modifying-code",
      trashedCardType: "program",
      trashedCount: 1,
      resolvedEffects: [
        {
          effectId: "subroutine_1",
          kind: "resolve_subroutine",
          visibility: "public",
          side: "runner",
          sourceDefinitionId: "onr_v1_223_banpei",
          sourceTitle: "Banpei",
          subroutineIndex: 0,
          subroutineType: "trash_installed_program",
          cardDefinitionId: "onr_v1_042_self-modifying-code",
          cardTitle: "Self-Modifying Code",
          cardsTrashed: 1,
        },
        {
          effectId: "subroutine_2",
          kind: "resolve_subroutine",
          visibility: "public",
          side: "runner",
          sourceDefinitionId: "onr_v1_223_banpei",
          sourceTitle: "Banpei",
          subroutineIndex: 1,
          subroutineType: "end_the_run",
          endedRun: true,
        },
      ],
    });
    const eventItem = formatChronicleEvent(event, "runner");
    const visibleItems = shouldSuppressChronicleEventItem(event)
      ? formatChronicleEffectItems(event, "runner")
      : [eventItem, ...formatChronicleEffectItems(event, "runner")];

    expect(shouldSuppressChronicleEventItem(event)).toBe(true);
    expect(visibleItems.map((item) => item.title)).toEqual([
      "Banpei: Subroutine 1 trasht Self-Modifying Code.",
      "Banpei: Subroutine 2 beendet den Run.",
    ]);
    expect(JSON.stringify(visibleItems)).not.toContain(
      "ungebrochene Subroutinen ausgelöst",
    );
    expect(visibleItems[0]?.chips).toEqual(
      expect.arrayContaining(["Banpei", "Self-Modifying Code", "Subroutine 1"]),
    );
  });

  it("suppresses declined rez windows as non-events in the visible chronicle", () => {
    const event = makeEvent("decline_rez", {
      actor: "corp",
      label: "Nicht rezzen",
      serverLabel: "Remote 1",
    });

    expect(formatChronicleEvent(event, "corp").title).toBe(
      "Du hast nicht gerezzt. Der Run geht weiter.",
    );
    expect(shouldSuppressChronicleEventItem(event)).toBe(true);
  });

  it("names Core Command Jettison Ice targets and paid rez costs in the chronicle", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        v1922RunnerEventAbility:
          "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
        targetCardDefinitionId: "simple_barrier_ice",
        targetServerLabel: "R&D",
        rezCostPaid: 3,
        trashedCount: 1,
      }),
      "runner",
      { cardTitle: "Simple Barrier ICE" },
    );

    expect(item.title).toBe(
      "Du hast Simple Barrier ICE in R&D getrasht und 3 Credits bezahlt.",
    );
    expect(item.category).toBe("card");
    expect(item.importance).toBe("important");
    expect(item.cardDefinitionId).toBe("simple_barrier_ice");
    expect(item.chips).toEqual([
      "Runner",
      "Core Command",
      "Trash",
      "3 Credits",
      "R&D",
    ]);
  });

  it("summarizes Synchronized Attack on HQ retain choices without hidden card details", () => {
    const aiChoice = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        v1922RunnerEventAbility: "successful_hq_run_corp_pay_to_retain_hq",
        sourceDefinitionId: "onr_v1_113_synchronized-attack-on-hq",
        retainedCount: 2,
        discardedCount: 3,
        aiExplanation: "legal choice",
      }),
      "runner",
    );
    const humanChoice = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        v1922RunnerEventAbility: "successful_hq_run_corp_pay_to_retain_hq",
        retainedCount: 1,
        discardedCount: 1,
      }),
      "runner",
    );

    expect(aiChoice.title).toBe(
      "Die Korp-KI behält mit Synchronized Attack on HQ 2 HQ-Karten, wirft 3 HQ-Karten verdeckt ab und bezahlt dafür 4 Credits.",
    );
    expect(aiChoice.category).toBe("hidden");
    expect(aiChoice.visibility).toBe("public");
    expect(aiChoice.cardDefinitionId).toBe(
      "onr_v1_113_synchronized-attack-on-hq",
    );
    expect(aiChoice.chips).toEqual([
      "Korp",
      "KI",
      "Synchronized Attack",
      "2 behalten",
      "3 verdeckt abgeworfen",
      "4 Credits",
    ]);
    expect(JSON.stringify(aiChoice)).not.toContain("card-");
    expect(aiChoice.title).not.toContain("Entscheidung beantwortet");
    expect(humanChoice.title).toBe(
      "Die Korp behält mit Synchronized Attack on HQ 1 HQ-Karte, wirft 1 HQ-Karte verdeckt ab und bezahlt dafür 2 Credits.",
    );
  });

  it("names Forged Activation Orders target and Corp rez-or-trash decisions in the chronicle", () => {
    const runnerChoice = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        v1922RunnerEventAbility: "force_rez_or_trash_ice",
        targetServerLabel: "HQ",
        targetIcePositionLabel: "ICE 2 in HQ",
        targetVisibility: "installed_ice_position",
      }),
      "runner",
    );
    const corpRez = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        v1922RunnerEventAbility: "force_rez_or_trash_ice",
        corpDecision: "rez_ice",
        targetCardDefinitionId: "simple_barrier_ice",
        targetServerLabel: "HQ",
        targetIcePositionLabel: "ICE 2 in HQ",
        rezCostPaid: 3,
        aiExplanation: "legal choice",
      }),
      "runner",
    );
    const corpTrash = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        v1922RunnerEventAbility: "force_rez_or_trash_ice",
        corpDecision: "trash_ice",
        targetServerLabel: "HQ",
        targetIcePositionLabel: "ICE 2 in HQ",
        targetVisibility: "hidden_installed_ice_position",
        trashedCount: 1,
        aiExplanation: "legal choice",
      }),
      "runner",
    );

    expect(runnerChoice.title).toBe(
      "Du hast ICE 2 in HQ für Forged Activation Orders gewählt.",
    );
    expect(runnerChoice.title).not.toContain("Entscheidung beantwortet");
    expect(runnerChoice.chips).toEqual([
      "Runner",
      "Forged Activation Orders",
      "Ziel",
      "ICE 2 in HQ",
    ]);
    expect(corpRez.title).toBe(
      "Die Korp-KI hat entschieden, Simple Barrier ICE als ICE 2 in HQ zu rezzen.",
    );
    expect(corpRez.description).toBe("Rez-Kosten: 3 Credits.");
    expect(corpRez.chips).toEqual([
      "Korp",
      "KI",
      "Forged Activation Orders",
      "Rez",
      "3 Credits",
      "ICE 2 in HQ",
    ]);
    expect(corpTrash.title).toBe(
      "Die Korp-KI hat entschieden, ICE 2 in HQ zu trashen.",
    );
    expect(corpTrash.title).not.toContain("Simple Barrier ICE");
    expect(corpTrash.chips).toEqual([
      "Korp",
      "KI",
      "Forged Activation Orders",
      "Trash",
      "ICE 2 in HQ",
    ]);
  });

  it("describes V1.8.1 Pattel and Pox run-success counters", () => {
    const cockroach = formatChronicleEffectItems(
      makeEvent("access_card", {
        actor: "runner",
        resolvedEffects: [
          {
            effectId: "run_1.cockroach.successful_run.cockroach",
            kind: "counter_change",
            visibility: "public",
            side: "corp",
            amount: 2,
            counterType: "cockroach",
            addedCounterAmount: 1,
            remainingCounters: 2,
            reason: "cockroach_successful_hq_run",
            sourceDefinitionId: "onr_v1_013_cockroach",
            sourceTitle: "Cockroach",
          },
        ],
      }),
      "runner",
    )[0]!;
    const pattel = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        v181RunnerProgramAbility: "pattels_virus_counter",
        targetCardDefinitionId: "onr_v1_279_wall-of-static",
        remainingCounters: 2,
      }),
      "runner",
      { cardTitle: "Wall of Static" },
    );
    const pox = formatChronicleEvent(
      makeEvent("access_card", {
        actor: "runner",
        v181RunnerProgramAbility: "pox_counter",
        targetServerLabel: "R&D",
        poxCountersAfter: 3,
      }),
      "runner",
    );

    expect(cockroach.title).toBe(
      "Die Korp hat 1 Cockroach-Counter durch Cockroach erhalten.",
    );
    expect(cockroach.description).toBe(
      "Diese Cockroach-Counter zählen als Virus-Counter, weil Cockroach ein Programm-Virus ist, und werden durch Virus-Purge entfernt.",
    );
    expect(cockroach.chips).toEqual(
      expect.arrayContaining([
        "Korp",
        "Cockroach",
        "+1 Cockroach-Counter",
        "2 gesamt",
        "Virus/Purge",
        "Erfolgreicher HQ-Run",
      ]),
    );
    expect(pattel.title).toBe(
      "Du hast 1 Virus-Counter mit Pattel's Virus auf Wall of Static gelegt.",
    );
    expect(pattel.cardDefinitionId).toBe("onr_v1_279_wall-of-static");
    expect(pattel.chips).toEqual(
      expect.arrayContaining(["Pattel's Virus", "+1 Virus", "2 auf ICE"]),
    );
    expect(pox.title).toBe("Du hast 1 Pox-Counter auf R&D gelegt.");
    expect(pox.chips).toEqual(
      expect.arrayContaining(["Pox", "+1 Virus", "R&D", "3 dort"]),
    );
  });

  it("describes recurring-credit installs and Pox ICE install tax", () => {
    const invisibility = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "runner",
        title: "Invisibility",
        zoneLabel: "Rig",
        recurringCreditsLoaded: 9,
      }),
      "runner",
      { cardTitle: "Invisibility" },
    );
    const taxedIce = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "corp",
        title: "Wall of Static",
        serverLabel: "R&D",
        zoneLabel: "ICE",
        iceInstallAdditionalCost: 2,
        iceInstallTotalCost: 5,
      }),
      "corp",
      { cardTitle: "Wall of Static" },
    );
    const paidProgram = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "runner",
        title: "Hammer",
        zoneLabel: "Rig",
        installCostPaid: 2,
        runnerInstallNormalCreditsPaid: 1,
        runnerInstallHostedCreditsPaid: 1,
        runnerInstallPaymentSourceDefinitionIds:
          "onr_v1_075_zetatech-software-installer",
      }),
      "runner",
      { cardTitle: "Hammer" },
    );

    expect(invisibility.description).toBe(
      "9 Recurring Credits wurden auf die Karte gelegt.",
    );
    expect(invisibility.chips).toContain("9 Recurring");
    expect(taxedIce.description).toBe(
      "Die Installation enthält 2 Credits Zusatzkosten; Gesamtkosten: 5 Credits.",
    );
    expect(taxedIce.chips).toEqual(
      expect.arrayContaining(["+2 Installkosten", "5 gesamt"]),
    );
    expect(paidProgram.description).toBe(
      "Installationskosten: 1 Credit aus dem Creditpool, 1 Credit aus Installationsquellen.",
    );
    expect(paidProgram.chips).toEqual(
      expect.arrayContaining([
        "2 Credits bezahlt",
        "1 Pool",
        "1 Quelle",
        "Zetatech Software Installer",
      ]),
    );
  });

  it("names older hardware decks trashed by Runner deck replacement", () => {
    const item = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "runner",
        title: "Artemis 2020",
        cardDefinitionId: "onr_v1_122_artemis-2020",
        zoneLabel: "Rig",
        deckUniqueReplacement: true,
        trashedDeckDefinitionIds: "onr_v1_137_parraline-5750",
      }),
      "runner",
      { cardTitle: "Artemis 2020" },
    );

    expect(item.title).toBe(
      "Du hast Artemis 2020 im Rig installiert; Parraline 5750 wurde getrasht, weil nur ein Hardware-Deck installiert sein darf.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining(["Deck-Einzigartigkeit", "Trash", "1 Deck"]),
    );
  });

  it("names Restrictive Net Zoning selected servers in the chronicle", () => {
    const item = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "runner",
        title: "Restrictive Net Zoning",
        zoneLabel: "Resource",
        selectedServerId: "remote_1",
        selectedServerLabel: "Remote 1",
      }),
      "runner",
      { cardTitle: "Restrictive Net Zoning" },
    );

    expect(item.title).toBe(
      "Du hast Restrictive Net Zoning auf Remote 1 ausgerichtet installiert.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining(["Install", "Resource", "Remote 1"]),
    );
  });

  it("names Security Net Optimization selected servers in the chronicle", () => {
    const item = formatChronicleEvent(
      makeEvent("score_agenda", {
        actor: "corp",
        title: "Security Net Optimization",
        cardDefinitionId: "onr_v1_215_security-net-optimization",
        selectedServerId: "remote_1",
        selectedServerLabel: "Remote 1",
      }),
      "runner",
      { cardTitle: "Security Net Optimization" },
    );

    expect(item.title).toBe(
      "Die Korp hat Security Net Optimization gescored und Remote 1 gewählt.",
    );
    expect(item.chips).toEqual(expect.arrayContaining(["Score", "Remote 1"]));
  });

  it("uses the localized display title from context for scored agendas", () => {
    const item = formatChronicleEvent(
      makeEvent("score_agenda", {
        actor: "corp",
        title: "AI Chief Financial Officer",
        cardDefinitionId: "onr_v1_188_ai-chief-financial-officer",
      }),
      "runner",
      { agendaPoints: 2, cardTitle: "KI-Finanzvorstand" },
    );

    expect(item.title).toBe(
      "Die Korp hat KI-Finanzvorstand gescored und 2 Agenda-Punkte erhalten.",
    );
    expect(item.cardTitle).toBe("KI-Finanzvorstand");
    expect(item.chips).toEqual(expect.arrayContaining(["Score", "+2 Agenda"]));
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
        dataFortReclamationRezCandidateCount: 2,
      }),
      "runner",
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
        corpCreditsSpent: 2,
      }),
      "corp",
    );
    const aardvark = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "aardvark_rez_trash_worm",
        publicRevealDefinitionId: "onr_v1_327_aardvark",
      }),
      "runner",
    );

    expect(dataFortInstall.title).toBe(
      "Die Korp hat 3 Karten mit Data Fort Reclamation installiert.",
    );
    expect(dataFortInstall.visibility).toBe("redacted");
    expect(dataFortInstall.chips).toEqual(
      expect.arrayContaining([
        "Data Fort",
        "3 Install",
        "2 ICE",
        "12 Temp-Credits",
      ]),
    );
    expect(dataFortRez.title).toBe(
      "Du hast 2 Karten aus Data Fort Reclamation gerezzt.",
    );
    expect(dataFortRez.chips).toEqual(
      expect.arrayContaining(["Data Fort", "2 Rez", "4 Temp", "2 Credits"]),
    );
    expect(aardvark.title).toBe(
      "Die Korp hat Aardvark gerezzt und Worm getrasht.",
    );
    expect(aardvark.cardDefinitionId).toBe("onr_v1_327_aardvark");
    expect(aardvark.chips).toEqual(
      expect.arrayContaining(["Aardvark", "Rez", "Worm Trash"]),
    );
  });

  it("names the ICE rezzed by Priority Requisition", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v162_priority_requisition_free_rez",
        priorityRequisitionFreeRez: true,
        priorityRequisitionTargetDefinitionId: "onr_v1_230_cortical-scanner",
        rezCostPaid: 0,
      }),
      "corp",
      { cardTitle: "Cortical Scanner" },
    );

    expect(item.title).toBe(
      "Du hast Cortical Scanner durch Priority Requisition kostenlos gerezzt.",
    );
    expect(item.category).toBe("card");
    expect(item.visibility).toBe("public");
    expect(item.cardDefinitionId).toBe("onr_v1_230_cortical-scanner");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Priority Requisition", "Rez", "0 Credits"]),
    );
  });

  it("summarizes Superior Net Barriers reveal and credit counts", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "superior_net_barriers_reveal_walls",
        agendaAbility: "superior_net_barriers",
        revealedCount: 2,
        rezzedMatchingIceCount: 1,
        countedMatchingIceCount: 3,
        gainedCredits: 3,
      }),
      "corp",
    );

    expect(item.title).toBe(
      "Du hast Superior Net Barriers genutzt: 2 Walls aufgedeckt, 3 Credits erhalten.",
    );
    expect(item.category).toBe("agenda");
    expect(item.visibility).toBe("public");
    expect(item.description).toBe(
      "3 Walls waren aufgedeckt oder gerezzt; davon 1 bereits gerezzt.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Superior Net Barriers",
        "2 Reveal",
        "1 Rez",
        "+3 Credits",
      ]),
    );
  });

  it("keeps Encounter continuation chronicle text consistent when subroutines end the run", () => {
    const item = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        result: "ended",
        encounterContinue: true,
        encounterWillEndRun: true,
        unbrokenSubroutineCount: 1,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast ungebrochene Subroutinen ausgelöst und der Run endete.",
    );
    expect(item.chips).toContain("Subroutinen");
  });

  it("includes trashed program titles in Encounter continuation summaries", () => {
    const item = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        result: "ended",
        encounterContinue: true,
        encounterWillEndRun: true,
        unbrokenSubroutineCount: 2,
        trashedCardDefinitionId: "simple_decoder",
        trashedCardType: "program",
        trashedCount: 1,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast ungebrochene Subroutinen ausgelöst, Simple Decoder getrasht und der Run endete.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Subroutinen",
        "Simple Decoder",
        "Programm getrasht",
      ]),
    );
  });

  it("shows fully broken Encounter continuation as passed ICE", () => {
    const item = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        result: "continued",
        encounterContinue: true,
        encounterWillEndRun: false,
        unbrokenSubroutineCount: 0,
      }),
      "runner",
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
        breakerStrengthAfter: 1,
      }),
      "corp",
    );
    const breakAction = formatChronicleEvent(
      makeEvent("break_subroutine", {
        actor: "runner",
        title: "Krash",
        aiReasonCode: "runner.encounter.break_etr",
        breakSubroutineBaseCost: 2,
        subroutineIndex: 0,
        targetIceTitle: "Filter",
      }),
      "corp",
    );

    expect(pump.title).toBe("Die Runner-KI hat Krash gepumpt.");
    expect(pump.description).toBe(
      "2 Credits: +1 Stärke für diese Begegnung; Stärke danach 1.",
    );
    expect(pump.chips).toEqual(
      expect.arrayContaining(["Breaker", "+1 Stärke", "2 Credits"]),
    );
    expect(breakAction.title).toBe(
      "Die Runner-KI hat mit Krash Subroutine 1 auf Filter gebrochen.",
    );
    expect(breakAction.description).toBe(
      "2 Credits: Subroutine 1 auf Filter gebrochen.",
    );
    expect(breakAction.chips).toEqual(
      expect.arrayContaining([
        "Subroutine",
        "Subroutine 1",
        "Gebrochen",
        "2 Credits",
        "Krash",
        "Filter",
      ]),
    );
  });

  it("describes successful Blink die rolls on break actions", () => {
    const item = formatChronicleEvent(
      makeEvent("break_subroutine", {
        actor: "runner",
        label: "Blink: Subroutine 1 brechen",
        aiReasonCode: "runner.encounter.break_etr",
        targetIceTitle: "Crystal Wall",
        subroutineIndex: 0,
        blinkDieRoll: 5,
        blinkBreakSuccess: true,
        blinkDamageAmount: 0,
      }),
      "corp",
    );

    expect(item.title).toBe(
      "Die Runner-KI hat mit Blink Subroutine 1 auf Crystal Wall nach Wurf 5 gebrochen.",
    );
    expect(item.description).toBe(
      "Blink würfelt eine 5: Subroutine 1 auf Crystal Wall wurde gebrochen.",
    );
    expect(item.cardDefinitionId).toBe("onr_v1_007_blink");
    expect(item.cardTitle).toBe("Blink");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Blink", "Wurf 5", "Gebrochen", "Crystal Wall"]),
    );
    expect(JSON.stringify(item)).not.toContain("Net Damage");
  });

  it("describes failed Blink die rolls without claiming a break", () => {
    const item = formatChronicleEvent(
      makeEvent("break_subroutine", {
        actor: "runner",
        title: "Blink",
        targetIceTitle: "Crystal Wall",
        subroutineIndex: 0,
        blinkDieRoll: 2,
        blinkBreakSuccess: false,
        blinkDamageAmount: 2,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast mit Blink Subroutine 1 auf Crystal Wall nach Wurf 2 nicht gebrochen.",
    );
    expect(item.description).toBe(
      "Blink würfelt eine 2: Subroutine 1 auf Crystal Wall wurde nicht gebrochen; der Runner erleidet 2 Net Damage.",
    );
    expect(item.importance).toBe("critical");
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Blink",
        "Wurf 2",
        "Nicht gebrochen",
        "2 Net Damage",
        "Crystal Wall",
      ]),
    );
    expect(JSON.stringify(item)).not.toContain("Grip");
    expect(JSON.stringify(item)).not.toContain("Heap");
  });

  it("describes Dropp errata break as all subroutines and run-ending", () => {
    const item = formatChronicleEvent(
      makeEvent("break_subroutine", {
        actor: "runner",
        title: "Dropp™",
        aiReasonCode: "runner.encounter.break_etr",
        breakSubroutineBaseCost: 0,
        breakSubroutineCount: 2,
        subroutineIndexes: "0,1",
        breakAllMatchingSubroutines: true,
        breakerEndsRunAfterBreak: true,
        targetIceTitle: "Banpei",
      }),
      "corp",
    );

    expect(item.title).toBe(
      "Die Runner-KI hat mit Dropp™ alle Subroutinen auf Banpei gebrochen und den Run beendet.",
    );
    expect(item.description).toBe(
      "0 Credits: alle Subroutinen auf Banpei gebrochen; der Run endet durch diesen Break-Effekt, ohne dass das ICE als passiert gilt.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Subroutine",
        "alle Subroutinen",
        "Gebrochen",
        "Run endet",
        "ICE nicht passiert",
        "Dropp™",
        "Banpei",
      ]),
    );
  });

  it("names visible Runner installs from the public label and Rig zone", () => {
    const item = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "runner",
        label: "Simple Killer installieren",
        zoneLabel: "Rig",
      }),
      "runner",
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
        aiExplanation: "Credits verbessern Rez- und Score-Fenster.",
      }),
      "runner",
      {
        cardTitle: "Simple Economy Operation",
        cardText: "Erhalte 4 Credits.",
      },
    );

    expect(item.title).toBe(
      "Die Korp-KI hat Simple Economy Operation gespielt und Credits erhalten.",
    );
    expect(item.description).toBeUndefined();
    expect(item.chips).toContain("KI");
    expect(JSON.stringify(item)).not.toContain(
      "Credits verbessern Rez- und Score-Fenster.",
    );
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
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "runner", {
      cardTitle: "Annual Reviews",
    });
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe(
      "Die Korp-KI hat Annual Reviews gespielt und 3 Karten gezogen.",
    );
    expect(item.chips).toContain("Operation");
    expect(item.chips).toContain("3 Karten");
    expect(effects).toEqual([]);
  });

  it("names Skivviss as the reason for automatic Corp extra draws", () => {
    const event = makeEvent("end_turn", {
      actor: "runner",
      resolvedEffects: [
        {
          effectId: "corp.start.skivviss",
          kind: "draw_cards",
          visibility: "public",
          side: "corp",
          amount: 2,
          sourceDefinitionId: "onr_v1_064_skivviss",
          sourceTitle: "Skivviss",
          reason: "start_of_turn",
        },
      ],
    });

    const effects = formatChronicleEffectItems(event, "runner");

    expect(effects[0]?.title).toBe(
      "Skivviss: Die Korp zieht zu Beginn ihres Zugs 2 zusätzliche Karten.",
    );
    expect(effects[0]?.description).toBe(
      "Grund: 2 Skivviss-Counter auf der Korp.",
    );
    expect(effects[0]?.chips).toEqual(
      expect.arrayContaining([
        "Skivviss",
        "Automatisch",
        "Korp-Zugstart",
        "2 Skivviss-Counter",
        "2 Zusatzkarten",
      ]),
    );
    expect(formatChronicleEffectItems(event, "corp")[0]?.title).toBe(
      "Skivviss: Du ziehst zu Beginn deines Zugs 2 zusätzliche Karten.",
    );
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
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "runner", {
      cardTitle: "Livewire's Contacts",
    });
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe(
      "Du hast Livewire's Contacts gespielt und 3 Credits erhalten.",
    );
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
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "runner", {
      cardTitle: "Closed Accounts",
    });
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe(
      "Die Korp hat Closed Accounts gespielt und Runner verliert 7 Credits.",
    );
    expect(item.category).toBe("danger");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Operation", "Runner -7 Credits"]),
    );
    expect(effects).toEqual([]);
  });

  it("merges simple play add_tags effects into the played card entry", () => {
    const event = makeEvent("play_operation", {
      actor: "corp",
      title: "Datapool® by Zetatech",
      cardDefinitionId: "onr_v1_287_datapool-by-zetatech",
      tagsAdded: 2,
      runnerTagsAfter: 3,
      resolvedEffects: [
        {
          effectId: "onr_v1_287_datapool-by-zetatech.effect.0.add_tags",
          kind: "add_tags",
          visibility: "public",
          side: "runner",
          amount: 2,
          runnerTagsAfter: 3,
          sourceDefinitionId: "onr_v1_287_datapool-by-zetatech",
          sourceTitle: "Datapool® by Zetatech",
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "runner", {
      cardTitle: "Datapool® by Zetatech",
    });
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe(
      "Die Korp hat Datapool® by Zetatech gespielt und Runner erhält 2 Tags.",
    );
    expect(item.category).toBe("danger");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Operation", "+2 Tags"]),
    );
    expect(effects).toEqual([]);
  });

  it("merges ordered Netwatch Credit Voucher tag and credit effects into the played card entry", () => {
    const event = makeEvent("play_operation", {
      actor: "corp",
      title: "Netwatch Credit Voucher",
      cardDefinitionId: "onr_v1_293_netwatch-credit-voucher",
      tagsAdded: 1,
      runnerTagsAfter: 2,
      gainedCredits: 1,
      corpCreditsAfter: 6,
      resolvedEffects: [
        {
          effectId: "onr_v1_293_netwatch-credit-voucher.effect.0.add_tags",
          kind: "add_tags",
          visibility: "public",
          side: "runner",
          amount: 1,
          runnerTagsAfter: 2,
          sourceDefinitionId: "onr_v1_293_netwatch-credit-voucher",
          sourceTitle: "Netwatch Credit Voucher",
          reason: "card_resolver",
        },
        {
          effectId: "onr_v1_293_netwatch-credit-voucher.effect.1.gain_credits",
          kind: "gain_credits",
          visibility: "public",
          side: "corp",
          amount: 1,
          sourceDefinitionId: "onr_v1_293_netwatch-credit-voucher",
          sourceTitle: "Netwatch Credit Voucher",
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "runner", {
      cardTitle: "Netwatch Credit Voucher",
    });
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe(
      "Die Korp hat Netwatch Credit Voucher gespielt und Runner erhält 1 Tag und Korp erhält 1 Credit.",
    );
    expect(item.title.indexOf("Runner erhält 1 Tag")).toBeLessThan(
      item.title.indexOf("Korp erhält 1 Credit"),
    );
    expect(item.category).toBe("danger");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Operation", "+1 Tag", "+1 Credit"]),
    );
    expect(effects).toEqual([]);
  });

  it("merges tagged Corp Operation damage effects into the played card entry", () => {
    for (const [title, cardDefinitionId, amount] of [
      ["Punitive Counterstrike", "onr_v1_301_punitive-counterstrike", 2],
      ["Scorched Earth", "onr_v1_302_scorched-earth", 4],
      ["Urban Renewal", "onr_v1_307_urban-renewal", 5],
    ] as const) {
      const event = makeEvent("play_operation", {
        actor: "corp",
        title,
        cardDefinitionId,
        damageResolved: true,
        damageType: "meat",
        damageAmount: amount,
        cardsTrashed: amount,
        resolvedEffects: [
          {
            effectId: `${cardDefinitionId}.effect.0.damage`,
            kind: "damage",
            visibility: "public",
            side: "runner",
            amount,
            damageType: "meat",
            cardsTrashed: amount,
            sourceDefinitionId: cardDefinitionId,
            sourceTitle: title,
            reason: "card_resolver",
          },
        ],
      });

      const item = formatChronicleEvent(event, "runner", { cardTitle: title });
      const effects = formatChronicleEffectItems(event, "runner");

      expect(item.title).toBe(
        `Die Korp hat ${title} gespielt und Runner erleidet ${amount} Meat Damage.`,
      );
      expect(item.category).toBe("danger");
      expect(item.chips).toEqual(
        expect.arrayContaining(["Operation", `${amount} Meat Damage`]),
      );
      expect(JSON.stringify(item)).not.toMatch(
        /grip|stack|cardInstances|privatePayload/,
      );
      expect(effects).toEqual([]);
    }
  });

  it("merges tagged activated meat-damage abilities into the ability entry", () => {
    for (const [title, cardDefinitionId, amount] of [
      ["Solo Squad", "onr_v1_342_solo-squad", 1],
      ["On-Call Solo Team", "onr_v1_208_on-call-solo-team", 1],
      ["Strike Force Kali", "onr_v1_217_strike-force-kali", 2],
    ] as const) {
      const event = makeEvent("activated_card_ability", {
        actor: "corp",
        title,
        cardDefinitionId,
        cardImplementationAbility: "activated",
        damageResolved: true,
        damageType: "meat",
        damageAmount: amount,
        cardsTrashed: amount,
        resolvedEffects: [
          {
            effectId: `${cardDefinitionId}.effect.0.damage`,
            kind: "damage",
            visibility: "public",
            side: "runner",
            amount,
            damageType: "meat",
            cardsTrashed: amount,
            sourceDefinitionId: cardDefinitionId,
            sourceTitle: title,
            reason: "card_resolver",
          },
        ],
      });

      const item = formatChronicleEvent(event, "runner", { cardTitle: title });
      const effects = formatChronicleEffectItems(event, "runner");

      expect(item.title).toBe(
        `Die Korp hat ${title} genutzt und Runner erleidet ${amount} Meat Damage.`,
      );
      expect(item.title).not.toContain("gespielt");
      expect(item.category).toBe("danger");
      expect(item.chips).toEqual(
        expect.arrayContaining(["Ability", `${amount} Meat Damage`]),
      );
      expect(JSON.stringify(item)).not.toMatch(
        /grip|stack|cardInstances|privatePayload/,
      );
      expect(effects).toEqual([]);
    }
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
          reason: "card_resolver",
        },
        {
          effectId: "onr_v1_288_day-shift.effect.1.gain_credits",
          kind: "gain_credits",
          visibility: "public",
          side: "corp",
          amount: 1,
          sourceDefinitionId: "onr_v1_288_day-shift",
          sourceTitle: "Day Shift",
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "runner");
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe(
      "Die Korp hat Day Shift gespielt und 2 Karten gezogen und 1 Credit erhalten.",
    );
    expect(item.title.indexOf("2 Karten gezogen")).toBeLessThan(
      item.title.indexOf("1 Credit erhalten"),
    );
    expect(item.chips).toEqual(
      expect.arrayContaining(["Operation", "2 Karten", "+1 Credit"]),
    );
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
          reason: "card_resolver",
        },
        {
          effectId: "onr_v1_295_night-shift.effect.1.draw_cards",
          kind: "draw_cards",
          visibility: "public",
          side: "corp",
          amount: 1,
          sourceDefinitionId: "onr_v1_295_night-shift",
          sourceTitle: "Night Shift",
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "runner");
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe(
      "Die Korp hat Night Shift gespielt und 2 Credits erhalten und eine Karte gezogen.",
    );
    expect(item.title.indexOf("2 Credits erhalten")).toBeLessThan(
      item.title.indexOf("eine Karte gezogen"),
    );
    expect(item.chips).toEqual(
      expect.arrayContaining(["Operation", "+2 Credits", "Karte ziehen"]),
    );
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
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "corp");
    const effects = formatChronicleEffectItems(event, "corp");
    const serialized = JSON.stringify(item);

    expect(item.title).toBe(
      "Der Runner hat Jack 'n' Joe gespielt und 3 Karten gezogen.",
    );
    expect(serialized).toContain("Jack 'n' Joe");
    expect(serialized).toContain("3 Karten");
    expect(serialized).not.toContain("Score!");
    expect(serialized).not.toContain("Livewire");
    expect(effects).toEqual([]);
  });

  it("adds City Surveillance draw-tax details to card draw event chronicle entries", () => {
    const event = makeEvent("play_event", {
      actor: "runner",
      cardDefinitionId: "onr_v1_095_jack-n-joe",
      drawnCount: 3,
      citySurveillanceSourceCount: 1,
      citySurveillanceCreditsPaid: 2,
      citySurveillanceTagsAdded: 1,
      citySurveillanceTags: 1,
      runnerCreditsAfter: 0,
      runnerTagsAfter: 1,
      resolvedEffects: [
        {
          effectId: "onr_v1_095_jack-n-joe.effect.0.draw_cards",
          kind: "draw_cards",
          visibility: "public",
          side: "runner",
          amount: 3,
          sourceDefinitionId: "onr_v1_095_jack-n-joe",
          sourceTitle: "Jack 'n' Joe",
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "corp");
    const effects = formatChronicleEffectItems(event, "corp");

    expect(item.title).toBe(
      "Der Runner hat Jack 'n' Joe gespielt und 3 Karten gezogen.",
    );
    expect(item.description).toBe(
      "City Surveillance: Der Runner hat 2 Credits gezahlt und 1 Tag erhalten.",
    );
    expect(item.importance).toBe("important");
    expect(item.chips).toEqual(
      expect.arrayContaining(["City Surveillance", "-2 Credits", "+1 Tag"]),
    );
    expect(effects).toEqual([]);
  });

  it("adds City Surveillance draw-tax details to other runner draw card events", () => {
    const event = makeEvent("play_event", {
      actor: "runner",
      cardDefinitionId: "onr_v1_079_bodyweight-synthetic-blood",
      title: "Bodyweight™ Synthetic Blood",
      drawnCount: 5,
      citySurveillanceSourceCount: 1,
      citySurveillanceCreditsPaid: 5,
      citySurveillanceTagsAdded: 0,
      citySurveillanceTags: 0,
      runnerCreditsAfter: 1,
      runnerTagsAfter: 0,
      resolvedEffects: [
        {
          effectId: "onr_v1_079_bodyweight-synthetic-blood.effect.0.draw_cards",
          kind: "draw_cards",
          visibility: "public",
          side: "runner",
          amount: 5,
          sourceDefinitionId: "onr_v1_079_bodyweight-synthetic-blood",
          sourceTitle: "Bodyweight™ Synthetic Blood",
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "corp");

    expect(item.title).toBe(
      "Der Runner hat Bodyweight™ Synthetic Blood gespielt und 5 Karten gezogen.",
    );
    expect(item.description).toBe(
      "City Surveillance: Der Runner hat 5 Credits gezahlt und keinen Tag erhalten.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining(["City Surveillance", "-5 Credits", "Kein Tag"]),
    );
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
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "runner");
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe(
      "Du hast Newsgroup Filter genutzt und 2 Credits erhalten.",
    );
    expect(item.category).toBe("economy");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Ability", "+2 Credits"]),
    );
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
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "runner");
    const effects = formatChronicleEffectItems(event, "runner");
    const serialized = JSON.stringify(item);

    expect(item.title).toBe(
      "Die Korp hat ESA Contract genutzt und 2 Karten gezogen.",
    );
    expect(item.chips).toEqual(expect.arrayContaining(["Ability", "2 Karten"]));
    expect(serialized).not.toContain("simple_agenda");
    expect(serialized).not.toContain("simple_economy_operation");
    expect(effects).toEqual([]);
  });

  it("distinguishes Employee Empowerment optional start draw from its agenda action", () => {
    const optionalDraw = makeEvent("resolve_choice", {
      actor: "corp",
      sourceDefinitionId: "onr_v1_199_employee-empowerment",
      cardDefinitionId: "onr_v1_199_employee-empowerment",
      employeeEmpowermentStartDrawDecision: "draw",
      drawnCards: 1,
      resolvedEffects: [
        {
          effectId: "corp.start.employee_empowerment.employee_1",
          kind: "draw_cards",
          visibility: "public",
          side: "corp",
          amount: 1,
          sourceDefinitionId: "onr_v1_199_employee-empowerment",
          sourceTitle: "Employee Empowerment",
          reason: "start_of_turn",
        },
      ],
    });
    const skip = makeEvent("resolve_choice", {
      actor: "corp",
      sourceDefinitionId: "onr_v1_199_employee-empowerment",
      cardDefinitionId: "onr_v1_199_employee-empowerment",
      employeeEmpowermentStartDrawDecision: "skip",
    });
    const action = makeEvent("activated_card_ability", {
      actor: "corp",
      title: "Employee Empowerment",
      cardDefinitionId: "onr_v1_199_employee-empowerment",
      cardImplementationAbility: "activated",
      drawnCards: 2,
      resolvedEffects: [
        {
          effectId: "onr_v1_199_employee-empowerment.effect.0.draw_cards",
          kind: "draw_cards",
          visibility: "public",
          side: "corp",
          amount: 2,
          sourceDefinitionId: "onr_v1_199_employee-empowerment",
          sourceTitle: "Employee Empowerment",
          reason: "card_resolver",
        },
      ],
    });

    expect(formatChronicleEvent(optionalDraw, "runner").title).toBe(
      "Die Korp hat Employee Empowerment genutzt und eine Karte zusätzlich gezogen.",
    );
    expect(formatChronicleEvent(optionalDraw, "runner").chips).toEqual(
      expect.arrayContaining(["Start-of-turn", "Zusatzkarte"]),
    );
    expect(formatChronicleEvent(skip, "runner").title).toBe(
      "Die Korp hat Employee Empowerment übersprungen.",
    );
    expect(formatChronicleEvent(action, "runner").title).toBe(
      "Die Korp hat Employee Empowerment genutzt und 2 Karten gezogen.",
    );
  });

  it("merges activated economy ability effects with card context", () => {
    for (const [title, cardDefinitionId, amount] of [
      ["Marine Arcology", "onr_v1_206_marine-arcology", 3],
      ["Political Overthrow", "onr_v1_210_political-overthrow", 3],
      ["South African Mining Corp", "onr_v1_343_south-african-mining-corp", 6],
    ] as const) {
      const event = makeEvent("activated_card_ability", {
        actor: "corp",
        title,
        cardDefinitionId,
        cardImplementationAbility: "activated",
        gainedCredits: amount,
        corpCreditsAfter: 10 + amount,
        resolvedEffects: [
          {
            effectId: `${cardDefinitionId}.effect.0.gain_credits`,
            kind: "gain_credits",
            visibility: "public",
            side: "corp",
            amount,
            sourceDefinitionId: cardDefinitionId,
            sourceTitle: title,
            reason: "card_resolver",
          },
        ],
      });

      const item = formatChronicleEvent(event, "runner", { cardTitle: title });
      const effects = formatChronicleEffectItems(event, "runner");

      expect(item.title).toBe(
        `Die Korp hat ${title} genutzt und ${amount} Credits erhalten.`,
      );
      expect(item.title).not.toContain("gespielt");
      expect(item.chips).toEqual(
        expect.arrayContaining(["Ability", `+${amount} Credits`]),
      );
      expect(effects).toEqual([]);
    }
  });

  it("shows Too Many Doors as paid by both sides after reveal", () => {
    const event = makeEvent("resolve_choice", {
      actor: "runner",
      sourceDefinitionId: "onr_v1_272_too-many-doors",
      secretSpendRevealed: true,
      secretSpendCorp: 1,
      secretSpendRunner: 2,
      tooManyDoorsEndRun: true,
      corpCreditsAfter: 4,
      runnerCreditsAfter: 3,
    });

    const item = formatChronicleEvent(event, "runner");

    expect(item.title).toBe(
      "Too Many Doors aufgedeckt: Korp 1 Credit, Runner 2 Credits; Run endet.",
    );
    expect(item.description).toBe(
      "Nach der Zahlung: Korp 4 Credits, Runner 3 Credits.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "Too Many Doors",
        "Korp -1",
        "Runner -2",
        "Run endet",
      ]),
    );
  });

  it("merges Silicon Saloon Franchise ordered gain and draw effects without revealing drawn cards", () => {
    const event = makeEvent("activated_card_ability", {
      actor: "runner",
      title: "Silicon Saloon Franchise",
      cardDefinitionId: "onr_v1_179_silicon-saloon-franchise",
      cardImplementationAbility: "activated",
      gainedCredits: 1,
      runnerCreditsAfter: 6,
      drawnCount: 1,
      runnerGripAfter: 5,
      resolvedEffects: [
        {
          effectId: "onr_v1_179_silicon-saloon-franchise.effect.0.gain_credits",
          kind: "gain_credits",
          visibility: "public",
          side: "runner",
          amount: 1,
          sourceDefinitionId: "onr_v1_179_silicon-saloon-franchise",
          sourceTitle: "Silicon Saloon Franchise",
          reason: "card_resolver",
        },
        {
          effectId: "onr_v1_179_silicon-saloon-franchise.effect.1.draw_cards",
          kind: "draw_cards",
          visibility: "public",
          side: "runner",
          amount: 1,
          sourceDefinitionId: "onr_v1_179_silicon-saloon-franchise",
          sourceTitle: "Silicon Saloon Franchise",
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "corp", {
      cardTitle: "Silicon Saloon Franchise",
    });
    const effects = formatChronicleEffectItems(event, "corp");
    const serialized = JSON.stringify(item);

    expect(item.title).toBe(
      "Der Runner hat Silicon Saloon Franchise genutzt und 1 Credit erhalten und eine Karte gezogen.",
    );
    expect(item.title).not.toContain("gespielt");
    expect(item.title.indexOf("1 Credit erhalten")).toBeLessThan(
      item.title.indexOf("eine Karte gezogen"),
    );
    expect(item.chips).toEqual(
      expect.arrayContaining(["Ability", "+1 Credit", "Karte ziehen"]),
    );
    expect(serialized).not.toMatch(
      /grip|stack|cardInstances|privatePayload|drawnCardDefinitionId/,
    );
    expect(effects).toEqual([]);
  });

  it("merges hosted-credit lifecycle effects into rez, install and score entries", () => {
    for (const [
      actionType,
      actor,
      title,
      cardDefinitionId,
      amount,
      expectedTitle,
    ] of [
      [
        "rez_ice",
        "corp",
        "BBS Whispering Campaign",
        "onr_v1_309_bbs-whispering-campaign",
        16,
        "Die Korp hat BBS Whispering Campaign gerezzt und 16 Credits auf die Karte gelegt.",
      ],
      [
        "rez_ice",
        "corp",
        "Rockerboy Promotion",
        "onr_v1_337_rockerboy-promotion",
        15,
        "Die Korp hat Rockerboy Promotion gerezzt und 15 Credits auf die Karte gelegt.",
      ],
      [
        "install_card",
        "runner",
        "Short-Term Contract",
        "onr_v1_178_short-term-contract",
        12,
        "Du hast Short-Term Contract im Rig installiert und 12 Credits auf die Karte gelegt.",
      ],
      [
        "score_agenda",
        "corp",
        "Corporate Coup",
        "onr_v1_193_corporate-coup",
        15,
        "Die Korp hat Corporate Coup gescored und 15 Credits auf die Karte gelegt.",
      ],
      [
        "score_agenda",
        "corp",
        "Political Coup",
        "onr_v1_209_political-coup",
        12,
        "Die Korp hat Political Coup gescored und 12 Credits auf die Karte gelegt.",
      ],
      [
        "rez_ice",
        "corp",
        "Braindance Campaign",
        "onr_v1_311_braindance-campaign",
        12,
        "Die Korp hat Braindance Campaign gerezzt und 12 Credits auf die Karte gelegt.",
      ],
      [
        "rez_ice",
        "corp",
        "Holovid Campaign",
        "onr_v1_326_holovid-campaign",
        12,
        "Die Korp hat Holovid Campaign gerezzt und 12 Credits auf die Karte gelegt.",
      ],
      [
        "score_agenda",
        "corp",
        "Detroit Police Contract",
        "onr_v1_198_detroit-police-contract",
        12,
        "Die Korp hat Detroit Police Contract gescored und 12 Credits auf die Karte gelegt.",
      ],
    ] as const) {
      const event = makeEvent(actionType, {
        actor,
        title,
        cardDefinitionId,
        hostedCreditsAdded: amount,
        hostedCreditsAfter: amount,
        resolvedEffects: [
          {
            effectId: `${cardDefinitionId}.lifecycle.add_hosted_credits`,
            kind: "add_hosted_credits",
            visibility: "public",
            side: actor,
            amount,
            remainingCounters: amount,
            sourceDefinitionId: cardDefinitionId,
            sourceTitle: title,
            reason: "card_resolver",
          },
        ],
      });

      const item = formatChronicleEvent(event, "runner", { cardTitle: title });
      const effects = formatChronicleEffectItems(event, "runner");

      expect(item.title).toBe(expectedTitle);
      expect(item.chips).toEqual(
        expect.arrayContaining([`+${amount} Credits auf Karte`]),
      );
      expect(JSON.stringify(item)).not.toMatch(
        /"cardInstances"|"privatePayload"|"hq"|"rd"|"grip"|"stack"/,
      );
      expect(effects).toEqual([]);
    }
  });

  it("formats Corporate War score credit swings from score payload fields", () => {
    const success = formatChronicleEvent(
      makeEvent("score_agenda", {
        actor: "corp",
        title: "Corporate War",
        cardDefinitionId: "onr_v1_196_corporate-war",
        corporateWarThresholdMet: true,
        onScoreGainCredits: 12,
        corpCreditsAfter: 24,
      }),
      "runner",
      { cardTitle: "Corporate War" },
    );
    const miss = formatChronicleEvent(
      makeEvent("score_agenda", {
        actor: "corp",
        title: "Corporate War",
        cardDefinitionId: "onr_v1_196_corporate-war",
        corporateWarThresholdMet: false,
        onScoreGainCredits: 0,
        onScoreLostAllCredits: true,
        corpCreditsAfter: 0,
      }),
      "runner",
      { cardTitle: "Corporate War" },
    );

    expect(success.title).toBe(
      "Die Korp hat Corporate War gescored und 12 Credits erhalten.",
    );
    expect(success.category).toBe("economy");
    expect(success.chips).toEqual(
      expect.arrayContaining(["Score", "+12 Credits"]),
    );
    expect(miss.title).toBe(
      "Die Korp hat Corporate War gescored und alle Credits verloren.",
    );
    expect(miss.category).toBe("danger");
    expect(miss.chips).toEqual(
      expect.arrayContaining(["Score", "Alle Credits verloren"]),
    );
    expect(JSON.stringify([success, miss])).not.toMatch(
      /"cardInstances"|"privatePayload"|"hq"|"rd"|"grip"|"stack"/,
    );
  });

  it("merges score-agenda credit resolver effects into score entries", () => {
    const event = makeEvent("score_agenda", {
      actor: "corp",
      title: "Hostile Takeover",
      cardDefinitionId: "onr_v1_203_hostile-takeover",
      resolvedEffects: [
        {
          effectId: "onr_v1_203_hostile-takeover.score.gain_credits",
          kind: "gain_credits",
          visibility: "public",
          side: "corp",
          amount: 5,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_203_hostile-takeover",
          sourceTitle: "Hostile Takeover",
        },
      ],
    });

    const item = formatChronicleEvent(event, "runner", {
      cardTitle: "Hostile Takeover",
    });
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe(
      "Die Korp hat Hostile Takeover gescored und 5 Credits erhalten.",
    );
    expect(item.category).toBe("economy");
    expect(item.chips).toEqual(expect.arrayContaining(["Score", "+5 Credits"]));
    expect(effects).toEqual([]);
  });

  it("merges hosted-credit take effects into activated ability entries", () => {
    for (const [
      actor,
      title,
      cardDefinitionId,
      amount,
      remaining,
      expectedTitle,
    ] of [
      [
        "corp",
        "BBS Whispering Campaign",
        "onr_v1_309_bbs-whispering-campaign",
        2,
        14,
        "Die Korp hat BBS Whispering Campaign genutzt und 2 Credits von der Karte genommen.",
      ],
      [
        "corp",
        "Rockerboy Promotion",
        "onr_v1_337_rockerboy-promotion",
        3,
        12,
        "Die Korp hat Rockerboy Promotion genutzt und 3 Credits von der Karte genommen.",
      ],
      [
        "runner",
        "Short-Term Contract",
        "onr_v1_178_short-term-contract",
        2,
        10,
        "Du hast Short-Term Contract genutzt und 2 Credits von der Karte genommen.",
      ],
      [
        "corp",
        "Corporate Coup",
        "onr_v1_193_corporate-coup",
        3,
        12,
        "Die Korp hat Corporate Coup genutzt und 3 Credits von der Karte genommen.",
      ],
      [
        "corp",
        "Political Coup",
        "onr_v1_209_political-coup",
        3,
        9,
        "Die Korp hat Political Coup genutzt und 3 Credits von der Karte genommen.",
      ],
      [
        "runner",
        "Broker",
        "onr_v1_154_broker",
        6,
        0,
        "Du hast Broker genutzt und 6 Credits von der Karte genommen.",
      ],
      [
        "corp",
        "Department of Truth Enhancement",
        "onr_v1_318_department-of-truth-enhancement",
        6,
        0,
        "Die Korp hat Department of Truth Enhancement genutzt und 6 Credits von der Karte genommen.",
      ],
    ] as const) {
      const event = makeEvent("activated_card_ability", {
        actor,
        title,
        cardDefinitionId,
        cardImplementationAbility: "activated",
        hostedCreditsTaken: amount,
        hostedCreditsAfter: remaining,
        gainedCredits: amount,
        resolvedEffects: [
          {
            effectId: `${cardDefinitionId}.effect.0.take_hosted_credits`,
            kind: "take_hosted_credits",
            visibility: "public",
            side: actor,
            amount,
            remainingCounters: remaining,
            sourceDefinitionId: cardDefinitionId,
            sourceTitle: title,
            reason: "card_resolver",
          },
        ],
      });

      const item = formatChronicleEvent(event, "runner", { cardTitle: title });
      const effects = formatChronicleEffectItems(event, "runner");

      expect(item.title).toBe(expectedTitle);
      expect(item.title).not.toContain("gespielt");
      expect(item.chips).toEqual(
        expect.arrayContaining([
          "Ability",
          `+${amount} Credits`,
          `${amount} Credits von Karte`,
          `${remaining} Credits übrig`,
        ]),
      );
      expect(effects).toEqual([]);
    }
  });

  it("merges Spinn Public Relations hosted-credit loading into activated ability entries", () => {
    const event = makeEvent("activated_card_ability", {
      actor: "corp",
      title: "Spinn Public Relations",
      cardDefinitionId: "onr_v1_344_spinn-public-relations",
      cardImplementationAbility: "activated",
      hostedCreditsAdded: 3,
      hostedCreditsAfter: 3,
      resolvedEffects: [
        {
          effectId:
            "onr_v1_344_spinn-public-relations.effect.0.add_hosted_credits",
          kind: "add_hosted_credits",
          visibility: "public",
          side: "corp",
          amount: 3,
          remainingCounters: 3,
          sourceDefinitionId: "onr_v1_344_spinn-public-relations",
          sourceTitle: "Spinn Public Relations",
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "runner", {
      cardTitle: "Spinn Public Relations",
    });
    const effects = formatChronicleEffectItems(event, "runner");

    expect(item.title).toBe(
      "Die Korp hat Spinn Public Relations genutzt und 3 Credits auf die Karte gelegt.",
    );
    expect(item.title).not.toContain("gespielt");
    expect(item.chips).toEqual(
      expect.arrayContaining(["Ability", "+3 Credits auf Karte"]),
    );
    expect(effects).toEqual([]);
  });

  it("merges manual hosted-credit loading into activated ability entries", () => {
    for (const [actor, title, cardDefinitionId, expectedTitle] of [
      [
        "runner",
        "Broker",
        "onr_v1_154_broker",
        "Du hast Broker genutzt und 3 Credits auf die Karte gelegt.",
      ],
      [
        "corp",
        "Department of Truth Enhancement",
        "onr_v1_318_department-of-truth-enhancement",
        "Die Korp hat Department of Truth Enhancement genutzt und 3 Credits auf die Karte gelegt.",
      ],
    ] as const) {
      const event = makeEvent("activated_card_ability", {
        actor,
        title,
        cardDefinitionId,
        cardImplementationAbility: "activated",
        hostedCreditsAdded: 3,
        hostedCreditsAfter: 3,
        resolvedEffects: [
          {
            effectId: `${cardDefinitionId}.effect.0.add_hosted_credits`,
            kind: "add_hosted_credits",
            visibility: "public",
            side: actor,
            amount: 3,
            remainingCounters: 3,
            sourceDefinitionId: cardDefinitionId,
            sourceTitle: title,
            reason: "card_resolver",
          },
        ],
      });

      const item = formatChronicleEvent(event, "runner", { cardTitle: title });
      const effects = formatChronicleEffectItems(event, "runner");

      expect(item.title).toBe(expectedTitle);
      expect(item.title).not.toContain("gespielt");
      expect(item.chips).toEqual(
        expect.arrayContaining(["Ability", "+3 Credits auf Karte"]),
      );
      expect(effects).toEqual([]);
    }
  });

  it("shows trash-on-empty for hosted-credit campaign and contract abilities", () => {
    const event = makeEvent("activated_card_ability", {
      actor: "runner",
      title: "Short-Term Contract",
      cardDefinitionId: "onr_v1_178_short-term-contract",
      cardImplementationAbility: "activated",
      hostedCreditsTaken: 1,
      hostedCreditsAfter: 0,
      gainedCredits: 1,
      sourceTrashed: true,
      resolvedEffects: [
        {
          effectId:
            "onr_v1_178_short-term-contract.effect.0.take_hosted_credits",
          kind: "take_hosted_credits",
          visibility: "public",
          side: "runner",
          amount: 1,
          remainingCounters: 0,
          sourceDefinitionId: "onr_v1_178_short-term-contract",
          sourceTitle: "Short-Term Contract",
          reason: "card_resolver",
        },
        {
          effectId:
            "onr_v1_178_short-term-contract.effect.1.trash_source_when_empty",
          kind: "trash_source_when_empty",
          visibility: "public",
          side: "runner",
          amount: 1,
          sourceDefinitionId: "onr_v1_178_short-term-contract",
          sourceTitle: "Short-Term Contract",
          reason: "card_resolver",
        },
      ],
    });

    const item = formatChronicleEvent(event, "corp", {
      cardTitle: "Short-Term Contract",
    });
    const effects = formatChronicleEffectItems(event, "corp");

    expect(item.title).toBe(
      "Der Runner hat Short-Term Contract genutzt und 1 Credit von der Karte genommen und Short-Term Contract getrasht.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining([
        "1 Credit von Karte",
        "0 Credits übrig",
        "Quelle getrasht",
      ]),
    );
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
            reason: "card_resolver",
          },
        ],
      }),
      "runner",
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe(
      "Du hast 12 Credits durch Loan from Chiba erhalten.",
    );
    expect(items[0]?.category).toBe("economy");
    expect(items[0]?.cardDefinitionId).toBe("onr_v1_168_loan-from-chiba");
    expect(items[0]?.chips).toEqual(expect.arrayContaining(["+12 Credits"]));
  });

  it("shows Loan from Chiba leave-play payment and loss effects", () => {
    const paidItems = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "runner",
        cardDefinitionId: "onr_v1_168_loan-from-chiba",
        title: "Loan from Chiba",
        resolvedEffects: [
          {
            effectId: "loan.leave.pay",
            kind: "pay_credits_or_lose_game",
            visibility: "public",
            side: "runner",
            amount: 10,
            paidCredits: 10,
            gameLost: false,
            sourceDefinitionId: "onr_v1_168_loan-from-chiba",
            sourceTitle: "Loan from Chiba",
            reason: "source_left_play",
          },
        ],
      }),
      "runner",
    );
    expect(paidItems[0]?.title).toBe(
      "Loan from Chiba verlässt das Spiel; Runner zahlt 10 Credits.",
    );
    expect(paidItems[0]?.chips).toEqual(
      expect.arrayContaining(["10 Credits gezahlt"]),
    );

    const lostItems = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "runner",
        cardDefinitionId: "onr_v1_168_loan-from-chiba",
        title: "Loan from Chiba",
        resolvedEffects: [
          {
            effectId: "loan.leave.lose",
            kind: "pay_credits_or_lose_game",
            visibility: "public",
            side: "runner",
            amount: 10,
            paidCredits: 0,
            gameLost: true,
            winner: "corp",
            sourceDefinitionId: "onr_v1_168_loan-from-chiba",
            sourceTitle: "Loan from Chiba",
            reason: "source_left_play",
          },
        ],
      }),
      "runner",
    );
    expect(lostItems[0]?.title).toBe(
      "Loan from Chiba verlässt das Spiel; Runner verliert das Spiel.",
    );
    expect(lostItems[0]?.importance).toBe("critical");
    expect(lostItems[0]?.chips).toEqual(
      expect.arrayContaining(["Spielverlust"]),
    );
  });

  it("highlights stolen agendas with visible agenda points", () => {
    const item = formatChronicleEvent(
      makeEvent("steal_agenda", {
        actor: "runner",
        title: "Project Agenda",
        agendaPoints: 2,
      }),
      "runner",
      {
        cardTitle: "Project Agenda",
      },
    );

    expect(item.title).toBe(
      "Du hast Project Agenda gestohlen und 2 Agenda-Punkte erhalten.",
    );
    expect(item.category).toBe("agenda");
    expect(item.importance).toBe("critical");
    expect(item.chips).toContain("+2 Agenda");
  });

  it("names Red Herrings payments when a paid agenda steal resolves", () => {
    const item = formatChronicleEvent(
      makeEvent("steal_agenda", {
        actor: "runner",
        title: "Project Agenda",
        agendaPoints: 2,
        stealAdditionalCost: 5,
        stealCost: 5,
        stealCostSourceTitles: "Red Herrings",
      }),
      "runner",
      {
        cardTitle: "Project Agenda",
      },
    );

    expect(item.title).toBe(
      "Du hast Project Agenda gestohlen und 2 Agenda-Punkte erhalten und 5 Credits wegen Red Herrings bezahlt.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining(["+2 Agenda", "5 Credits", "Red Herrings"]),
    );
  });

  it("names accessed cards when the access event reveals one", () => {
    const item = formatChronicleEvent(
      makeEvent("access_card", {
        actor: "runner",
        title: "Simple Economy Operation",
        serverLabel: "HQ",
      }),
      "runner",
      {
        cardTitle: "Simple Economy Operation",
      },
    );

    expect(item.title).toBe(
      "Du hast auf Simple Economy Operation in HQ zugegriffen.",
    );
    expect(item.cardTitle).toBe("Simple Economy Operation");
    expect(item.chips).toContain("HQ");
  });

  it("keeps the accessed server visible for access follow-up actions", () => {
    const steal = formatChronicleEvent(
      makeEvent("steal_agenda", {
        actor: "runner",
        title: "Project Agenda",
        agendaPoints: 2,
        serverLabel: "HQ",
      }),
      "runner",
      { cardTitle: "Project Agenda" },
    );
    const trash = formatChronicleEvent(
      makeEvent("trash_accessed_card", {
        actor: "runner",
        title: "PAD Campaign",
        serverLabel: "R&D",
      }),
      "runner",
      { cardTitle: "PAD Campaign" },
    );
    const done = formatChronicleEvent(
      makeEvent("decline_trash", {
        actor: "runner",
        serverLabel: "Archives",
      }),
      "runner",
    );

    expect(steal.title).toBe(
      "Du hast Project Agenda aus HQ gestohlen und 2 Agenda-Punkte erhalten.",
    );
    expect(trash.title).toBe("Du hast PAD Campaign aus R&D getrasht.");
    expect(done.title).toBe("Du hast den Archiv-Zugriff abgeschlossen.");
    expect(steal.chips).toContain("HQ");
    expect(trash.chips).toContain("R&D");
    expect(done.chips).toContain("Archive");
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
        title: "Jackhammer",
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast Jackhammer aus dem Stack vorgezeigt und in den Grip genommen.",
    );
    expect(item.category).toBe("card");
    expect(item.visibility).toBe("public");
    expect(item.cardDefinitionId).toBe("onr_v1_036_jackhammer");
    expect(item.chips).toEqual([
      "Runner",
      "Stack",
      "Vorgezeigt",
      "den Grip",
      "Shuffle",
    ]);
  });

  it("describes card-implementation stack-to-hand searches with the revealed selected card", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "p3_37_search_stack_to_grip",
        sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
        selectedCount: 1,
        movedCardCount: 1,
        searchDestination: "runner_grip",
        publicRevealKind: "reveal",
        publicRevealDefinitionId: "onr_v1_039_krash",
        cardDefinitionId: "onr_v1_039_krash",
        shuffled: true,
        aiReasonCode: "runner_stack_search_program",
      }),
      "corp",
    );

    expect(item.title).toBe(
      "Die Runner-KI hat Krash aus dem Stack vorgezeigt und auf die Hand genommen.",
    );
    expect(item.category).toBe("card");
    expect(item.visibility).toBe("public");
    expect(item.cardDefinitionId).toBe("onr_v1_039_krash");
    expect(item.chips).toEqual([
      "Runner",
      "KI",
      "Stack",
      "Vorgezeigt",
      "Hand",
      "Shuffle",
    ]);
    expect(item.title).not.toContain("Entscheidung beantwortet");
  });

  it("redacts private card-implementation stack-to-hand searches", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "p3_37_search_stack_to_grip",
        sourceDefinitionId: "onr_v1_105_mantis-fixer-at-large",
        selectedCount: 1,
        movedCardCount: 1,
        searchDestination: "runner_grip",
        shuffled: true,
        aiReasonCode: "runner_stack_search_card",
      }),
      "corp",
    );

    expect(item.title).toBe(
      "Die Runner-KI hat eine Karte verdeckt aus dem Stack auf die Hand genommen.",
    );
    expect(item.category).toBe("hidden");
    expect(item.visibility).toBe("redacted");
    expect(item.cardDefinitionId).toBeUndefined();
    expect(JSON.stringify(item)).not.toContain("Mantis");
    expect(item.chips).toEqual([
      "Runner",
      "KI",
      "Stack",
      "Verdeckt",
      "Hand",
      "Shuffle",
    ]);
  });

  it("names the public heap card returned by Junkyard BBS", () => {
    const item = formatChronicleEvent(
      makeEvent("activated_card_ability", {
        actor: "runner",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "p3_38_move_top_trash_to_grip",
        sourceDefinitionId: "onr_v1_165_junkyard-bbs",
        cardDefinitionId: "onr_v1_165_junkyard-bbs",
        returnedCardDefinitionId: "onr_v1_157_crash-everett-inventive-fixer",
        returnedCount: 1,
        sourceZone: "heap",
        destinationZone: "grip",
        returnedToGrip: true,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast Junkyard BBS genutzt und Crash Everett, Inventive Fixer aus dem Heap in den Grip genommen.",
    );
    expect(item.category).toBe("card");
    expect(item.importance).toBe("important");
    expect(item.visibility).toBe("public");
    expect(item.cardDefinitionId).toBe(
      "onr_v1_157_crash-everett-inventive-fixer",
    );
    expect(item.cardTitle).toBe("Crash Everett, Inventive Fixer");
    expect(item.chips).toEqual([
      "Runner",
      "Junkyard BBS",
      "Heap",
      "Grip",
      "Crash Everett, Inventive Fixer",
    ]);
  });

  it("describes Aujourd'Oui top-five program choices with revealed selected programs only", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1911_aujourdoui_top5",
        sourceDefinitionId: "onr_v1_151_aujourdoui",
        selectedCount: 2,
        publicRevealKind: "reveal",
        publicRevealDefinitionId: "simple_decoder",
        publicRevealDefinitionIds: "simple_decoder,simple_fracter",
        shuffled: true,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast Aujourd'Oui genutzt, Simple Decoder, Simple Fracter vorgezeigt, in den Grip genommen und danach den Stack gemischt.",
    );
    expect(item.category).toBe("card");
    expect(item.visibility).toBe("public");
    expect(item.cardDefinitionId).toBe("simple_decoder");
    expect(item.chips).toEqual([
      "Runner",
      "Aujourd'Oui",
      "Top 5",
      "2 Programme",
      "Vorgezeigt",
      "Grip",
      "Shuffle",
    ]);
  });

  it("describes Aujourd'Oui empty top-five choices with the required shuffle", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1911_aujourdoui_top5",
        sourceDefinitionId: "onr_v1_151_aujourdoui",
        selectedCount: 0,
        shuffled: true,
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Du hast Aujourd'Oui genutzt, keine Programme aus den obersten 5 genommen und danach den Stack gemischt.",
    );
    expect(item.category).toBe("card");
    expect(item.visibility).toBe("public");
    expect(item.chips).toEqual([
      "Runner",
      "Aujourd'Oui",
      "Top 5",
      "0 Programme",
      "Keine Auswahl",
      "Shuffle",
    ]);
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
        title: "Jackhammer",
      }),
      "corp",
    );

    expect(item.title).toBe(
      "Der Runner hat eine Karte verdeckt aus dem Stack in den Grip genommen.",
    );
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
        baseTraceStrength: 4,
      }),
      "runner",
      { cardTitle: "Hunter" },
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
        runnerLink: 0,
      }),
      "runner",
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
        tagsAdded: 1,
      }),
      "runner",
    );

    expect(started.title).toBe("Du hast mit Hunter einen Trace 4 ausgelöst.");
    expect(started.category).toBe("danger");
    expect(started.cardDefinitionId).toBe("onr_v1_249_hunter");
    expect(corpBid.title).toBe("Die Korp-KI hat im Trace 2 Credits geboten.");
    expect(corpBid.description).toBe("Trace-Stärke: 6, Runner-Link: 0.");
    expect(corpBid.chips).toContain("Korp-Gebot 2");
    expect(runnerBid.title).toBe(
      "Trace entschieden: Korp 2 Credits, Du 1 Credit; Trace erfolgreich.",
    );
    expect(runnerBid.description).toBe(
      "Endstand: Trace 6 gegen Runner-Stärke 1.",
    );
    expect(runnerBid.chips).toEqual([
      "Runner",
      "Trace",
      "Korp 2",
      "Runner 1",
      "6:1",
      "Erfolg",
      "+1 Tag",
    ]);
  });

  it("describes trace base-link and post-bid link choices", () => {
    const baseLink = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        traceStep: "base_link",
        sourceDefinitionId: "onr_v1_284_chance-observation",
        corpBid: 1,
        traceStrength: 6,
        baseLinkUsed: true,
        traceBaseLinkSourceDefinitionId: "onr_v1_003_baedekers-net-map",
        traceBaseLinkCostPaid: 0,
        baseLinkValue: 1,
        runnerLink: 1,
      }),
      "runner",
    );
    const postBidLink = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        traceStep: "post_bid_link",
        eventModificationDecision: "apply",
        sourceDefinitionId: "onr_v1_284_chance-observation",
        postBidTraceLinkSourceDefinitionId: "onr_v1_003_baedekers-net-map",
        postBidTraceLinkCostPaid: 1,
        postBidTraceLinkDelta: 1,
        postBidTraceLinkBonus: 1,
        corpBid: 1,
        traceStrength: 6,
        runnerLink: 2,
        runnerBid: 4,
        runnerStrength: 6,
        traceSuccessful: false,
        tagsAdded: 0,
      }),
      "runner",
    );
    const postBidPass = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        traceStep: "post_bid_link",
        sourceDefinitionId: "onr_v1_284_chance-observation",
        postBidTraceLinkBonus: 1,
        corpBid: 1,
        traceStrength: 6,
        runnerLink: 2,
        runnerBid: 4,
        runnerStrength: 6,
        traceSuccessful: false,
      }),
      "runner",
    );

    expect(baseLink.title).toBe(
      "Du hast Baedeker's Net Map als Base Link 1 genutzt.",
    );
    expect(baseLink.description).toBe("Runner-Link: 1.");
    expect(baseLink.chips).toEqual(
      expect.arrayContaining([
        "Trace",
        "Base Link",
        "Baedeker's Net Map",
        "Link 1",
      ]),
    );
    expect(baseLink.title).not.toContain("Entscheidung beantwortet");
    expect(postBidLink.title).toBe(
      "Du hast Baedeker's Net Map für +1 Link genutzt; Trace abgewehrt.",
    );
    expect(postBidLink.description).toBe(
      "Endstand: Trace 6 gegen Runner-Stärke 6; Post-Bid-Link: +1.",
    );
    expect(postBidLink.chips).toEqual(
      expect.arrayContaining([
        "Trace",
        "Baedeker's Net Map",
        "+1 Link",
        "-1 Credit",
        "6:6",
        "Fehlschlag",
      ]),
    );
    expect(postBidLink.title).not.toContain("Entscheidung beantwortet");
    expect(postBidPass.title).toBe(
      "Trace entschieden: Korp 1 Credit, Du 4 Credits; Trace abgewehrt.",
    );
    expect(postBidPass.description).toBe(
      "Endstand: Trace 6 gegen Runner-Stärke 6; Post-Bid-Link: +1.",
    );
  });

  it("keeps Cinderella trace outcome and break costs distinct", () => {
    const traceEvent = makeEvent("resolve_choice", {
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
      trashedCardDefinitionId: "onr_v1_028_force-shield",
      damageAmount: 2,
      damageType: "meat",
      damageCannotBePrevented: true,
    });
    const trace = formatChronicleEvent(traceEvent, "runner");
    const traceEffects = formatChronicleEffectItems(traceEvent, "runner");
    const breakAction = formatChronicleEvent(
      makeEvent("break_subroutine", {
        actor: "runner",
        title: "Replicator",
        subroutineIndex: 0,
        targetIceTitle: "Cinderella",
        breakSubroutineBaseCost: 0,
      }),
      "runner",
    );

    expect(trace.title).toBe(
      "Trace entschieden: Korp 1 Credit, Du 0 Credits; Trace erfolgreich.",
    );
    expect(trace.description).toBe(
      "Endstand: Trace 7 gegen Runner-Stärke 0; Karteneffekt: 1 Hardware getrasht, 2 Meat-Schaden nicht verhinderbar, Run endet.",
    );
    expect(trace.chips).toEqual(
      expect.arrayContaining([
        "Trace",
        "Erfolg",
        "Hardware -1",
        "2 Schaden",
        "Run endet",
      ]),
    );
    expect(traceEffects).toHaveLength(1);
    expect(traceEffects[0]?.title).toBe(
      "Cinderella: Force Shield getrasht und 2 Meat Damage verursacht.",
    );
    expect(traceEffects[0]?.description).toBe(
      "Der erfolgreiche Trace beendet den Run; der Schaden kann nicht verhindert werden.",
    );
    expect(traceEffects[0]?.chips).toEqual(
      expect.arrayContaining([
        "Trace-Erfolg",
        "Force Shield",
        "2 Meat Damage",
        "Nicht verhinderbar",
        "Run endet",
      ]),
    );
    expect(breakAction.title).toBe(
      "Du hast mit Replicator Subroutine 1 auf Cinderella gebrochen.",
    );
    expect(breakAction.description).toBe(
      "0 Credits: Subroutine 1 auf Cinderella gebrochen.",
    );
    expect(breakAction.chips).toEqual(
      expect.arrayContaining([
        "Subroutine 1",
        "0 Credits",
        "Replicator",
        "Cinderella",
      ]),
    );
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
        hackerTrackerCountersAdded: 1,
      }),
      "runner",
    );
    const lockCleared = formatChronicleEvent(
      makeEvent("trigger_ability", {
        actor: "runner",
        v1920RunnerRunLockAbility: "fang_2_0_pay_to_run",
        fangRunLockCreditCost: 2,
        fangRunLockCleared: true,
      }),
      "runner",
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
        futureAgendaPointForfeitPending: 3,
      }),
      "runner",
      { cardTitle: "Arasaka Owns You" },
    );

    expect(trace.description).toContain("Karteneffekt beendet den Run");
    expect(trace.chips).toContain("HTC +1");
    expect(lockCleared.title).toBe(
      "Du hast die Run-Sperre für 2 Credits entfernt.",
    );
    expect(arasaka.title).toBe(
      "Du hast Arasaka Owns You gespielt und 4 Schaden ersetzt.",
    );
    expect(arasaka.chips).toContain("Flatline verhindert");
  });

  it("describes Fall Guy tag prevention during Marked Accounts access", () => {
    const event = makeEvent("resolve_choice", {
      actor: "runner",
      eventModificationDecision: "apply",
      eventModificationOutcome: "avoided",
      imminentEventType: "add_tag",
      originalAmount: 1,
      preventedTags: 1,
      finalAmount: 0,
      sourceDefinitionId: "onr_v1_161_fall-guy",
      sourceTrashed: true,
      trashedCardDefinitionId: "onr_v1_161_fall-guy",
      ambushDefinitionId: "onr_proteus_005_marked-accounts",
      accessEffectSourceDefinitionId: "onr_proteus_005_marked-accounts",
      accessedFromZone: "rd",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_access_ambush",
    });

    const runnerItem = formatChronicleEvent(event, "runner");
    const corpItem = formatChronicleEvent(event, "corp");

    expect(runnerItem.title).toBe(
      "Du hast Fall Guy getrasht und 1 Tag durch Marked Accounts verhindert.",
    );
    expect(corpItem.title).toBe(
      "Der Runner hat Fall Guy getrasht und 1 Tag durch Marked Accounts verhindert.",
    );
    expect(runnerItem.category).toBe("danger");
    expect(runnerItem.importance).toBe("important");
    expect(runnerItem.cardDefinitionId).toBe("onr_v1_161_fall-guy");
    expect(runnerItem.cardTitle).toBe("Fall Guy");
    expect(runnerItem.chips).toEqual(
      expect.arrayContaining([
        "Tag verhindert",
        "1 verhindert",
        "Fall Guy",
        "Marked Accounts",
        "Source-Trash",
      ]),
    );
    expect(runnerItem.title).not.toContain("Entscheidung beantwortet");
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
        valuPakProgramInstallActionsRemaining: 5,
      }),
      "runner",
    );
    const edgerunner = formatChronicleEvent(
      makeEvent("play_operation", {
        actor: "corp",
        cardDefinitionId: "onr_v1_289_edgerunner-inc-temps",
        title: "Edgerunner, Inc., Temps",
        v1922CorpOperationAbility: "install_action_bundle",
        gainedActions: 3,
        edgerunnerTempsInstallActionsRemaining: 3,
      }),
      "runner",
    );
    const securityPurge = formatChronicleEvent(
      makeEvent("score_agenda", {
        actor: "corp",
        cardDefinitionId: "onr_v1_216_security-purge",
        title: "Security Purge",
        agendaAbility: "agenda_purge",
        publicRevealDefinitionIds:
          "onr_v1_274_tutor,simple_economy_operation,simple_economy_asset",
        revealedCount: 3,
        revealedIceCount: 1,
        pendingTrashCount: 2,
        installedIceCount: 0,
        trashedCount: 0,
        agendaPurgeTargetChoiceOpened: true,
      }),
      "runner",
    );
    const securityPurgeResolve = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        sourceDefinitionId: "onr_v1_216_security-purge",
        agendaAbility: "agenda_purge",
        hiddenZoneAction: "agenda_purge_install_targets",
        revealedCount: 3,
        revealedIceCount: 1,
        installedIceCount: 1,
        trashedCount: 2,
        agendaPurgeTargetChoiceResolved: true,
        publicRevealDefinitionIds:
          "onr_v1_274_tutor,simple_economy_operation,simple_economy_asset",
        installedIceDefinitionIds: "onr_v1_274_tutor",
        installedIceServerLabels: "R&D",
        trashedDefinitionIds: "simple_economy_operation,simple_economy_asset",
      }),
      "runner",
    );
    const shield = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "runner",
        sourceDefinitionId: "onr_v1_061_shield",
        title: "Shield",
        eventModificationDecision: "apply",
        preventedAmount: 2,
        damageAmount: 0,
      }),
      "runner",
    );
    const boardwalk = formatChronicleEvent(
      makeEvent("gain_credit", {
        actor: "runner",
        sourceDefinitionId: "onr_v1_008_boardwalk",
        title: "Boardwalk",
        v1921RunnerProgramAbility: "deterministic_die_probe",
        v1921DieRoll: 4,
      }),
      "runner",
    );
    const flak = formatChronicleEvent(
      makeEvent("break_subroutine", {
        actor: "runner",
        cardDefinitionId: "onr_v1_027_flak",
        title: "Flak",
      }),
      "runner",
    );

    expect(valuPak.title).toBe(
      "Du hast Valu-Pak Software Bundle gespielt und 5 Programminstall-Aktionen erhalten.",
    );
    expect(valuPak.description).toBe(
      "1 temporärer Credit ist nur für Programminstallationen verfügbar.",
    );
    expect(valuPak.chips).toContain("+5 Aktionen");
    expect(edgerunner.title).toBe(
      "Die Korp hat Edgerunner, Inc., Temps gespielt und 3 Installaktionen erhalten.",
    );
    expect(edgerunner.chips).toContain("3 offen");
    expect(securityPurge.title).toBe(
      "Die Korp hat Security Purge gescored und 3 R&D-Karten aufgedeckt.",
    );
    expect(securityPurge.description).toContain(
      "Aufgedeckt: Tutor, Simple Economy Operation, Simple Economy Asset.",
    );
    expect(securityPurge.description).toContain(
      "ICE zur Installation: Tutor; die Korp wählt Zielserver.",
    );
    expect(securityPurgeResolve.title).toBe(
      "Die Korp hat Tutor durch Security Purge vor R&D installiert und gerezzt.",
    );
    expect(securityPurgeResolve.description).toContain(
      "Aufgedeckt: Tutor, Simple Economy Operation, Simple Economy Asset.",
    );
    expect(securityPurgeResolve.description).toContain(
      "Installiert und gerezzt: Tutor vor R&D.",
    );
    expect(securityPurgeResolve.description).toContain("Getrasht:");
    expect(shield.title).toBe("Du hast 2 Schaden mit Shield verhindert.");
    expect(shield.chips).toContain("2 verhindert");
    expect(boardwalk.title).toBe(
      "Du hast Boardwalk aktiviert und eine 4 gewürfelt.",
    );
    expect(boardwalk.chips).toContain("Wurf 4");
    expect(flak.title).toBe("Du hast mit Flak eine Subroutine gebrochen.");
  });

  it("describes Project Zurich overadvance and recurring Corp start credits", () => {
    const scoreItem = formatChronicleEvent(
      makeEvent("score_agenda", {
        actor: "corp",
        cardDefinitionId: "onr_proteus_008_project-zurich",
        title: "Project Zurich",
        agendaPoints: 2,
        projectZurichOveradvance: 4,
        overadvanceRecurringCredits: 2,
      }),
      "runner",
    );
    const startItems = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "runner",
        resolvedEffects: [
          {
            effectId: "corp.start.scored_agenda.credit.pro013_zurich",
            kind: "gain_credits",
            visibility: "public",
            side: "corp",
            amount: 2,
            reason: "start_of_turn",
            sourceDefinitionId: "onr_proteus_008_project-zurich",
            sourceTitle: "Project Zurich",
          },
        ],
      }),
      "runner",
    );

    expect(scoreItem.title).toBe(
      "Die Korp hat Project Zurich gescored und 2 Agenda-Punkte erhalten und 2 Credits zu Beginn jedes Korp-Zugs vorbereitet.",
    );
    expect(scoreItem.description).toBe(
      "Overadvance: 4 zusätzliche Advancement-Counter. Project Zurich gibt der Korp zu Beginn jedes ihrer Züge 2 Credits.",
    );
    expect(scoreItem.chips).toEqual(
      expect.arrayContaining([
        "Project Zurich",
        "Overadvance 4",
        "+2 Credits/Zug",
      ]),
    );
    expect(startItems[0]?.title).toBe("Project Zurich gibt Korp 2 Credits.");
    expect(startItems[0]?.chips).toEqual(
      expect.arrayContaining(["+2 Credits", "Automatisch"]),
    );
  });

  it("describes Corp advances as installations and developments without leaking hidden titles", () => {
    const hidden = formatChronicleEvent(
      makeEvent("advance_card", {
        actor: "corp",
        serverLabel: "Remote 2",
        redactedKind: "installed_card",
        title: "Simple Agenda",
      }),
      "runner",
      {
        cardTitle: "Simple Agenda",
        cardType: "agenda",
      },
    );
    const visibleAgenda = formatChronicleEvent(
      makeEvent("advance_card", {
        actor: "corp",
        serverLabel: "Remote 2",
      }),
      "runner",
      {
        cardTitle: "Hostile Takeover",
        cardType: "agenda",
      },
    );

    expect(hidden.title).toBe(
      "Die Korp hat eine Installation in Remote 2 ausgebaut.",
    );
    expect(hidden.visibility).toBe("redacted");
    expect(hidden.chips).toEqual([
      "Korp",
      "+1 Entwicklung",
      "Remote 2",
      "Verdeckt",
    ]);
    expect(JSON.stringify(hidden)).not.toContain("Simple Agenda");
    expect(visibleAgenda.title).toBe(
      "Die Korp hat das Projekt Hostile Takeover weiterentwickelt.",
    );
    expect(visibleAgenda.chips).toContain("+1 Entwicklung");
  });

  it("exposes action ordinal metadata only for entries that spent actions", () => {
    const paid = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "corp",
        actionCostClicks: 1,
        turnActionOrdinalStart: 2,
        turnActionOrdinalEnd: 2,
        redactedKind: "installed_card",
      }),
      "runner",
    );
    const free = formatChronicleEvent(
      makeEvent("rez_ice", { actor: "corp" }),
      "runner",
    );
    const multi = formatChronicleEvent(
      makeEvent("purge_virus_counters", {
        actor: "corp",
        actionCostClicks: 3,
        purgedCounterType: "virus",
        purgedVirusCounters: 4,
        turnActionOrdinalStart: 1,
        turnActionOrdinalEnd: 3,
      }),
      "runner",
    );

    expect(paid.actionUse).toMatchObject({
      label: "2",
      title: "2. Aktion in diesem Zug",
      clicks: 1,
    });
    expect(free.actionUse).toBeUndefined();
    expect(multi.actionUse).toMatchObject({
      label: "1-3",
      title: "Aktionen 1 bis 3 in diesem Zug",
      clicks: 3,
    });
    expect(multi.title).toBe("Die Korp hat 4 Virus-Counter entfernt.");
    expect(multi.description).toBe("Kosten: 3 Aktionen; keine Credits.");
    expect(multi.chips).toEqual(
      expect.arrayContaining(["Purge", "3 Aktionen", "4 entfernt"]),
    );
  });

  it("derives chronicle action numbers across extra actions when payload ordinals reset", () => {
    const events = [
      makeEvent("gain_credit", {
        actor: "corp",
        eventId: "evt_1",
        actionCostClicks: 1,
        turnActionOrdinalStart: 1,
        turnActionOrdinalEnd: 1,
      }),
      makeEvent("gain_credit", {
        actor: "corp",
        eventId: "evt_2",
        actionCostClicks: 1,
        turnActionOrdinalStart: 2,
        turnActionOrdinalEnd: 2,
      }),
      makeEvent("play_operation", {
        actor: "corp",
        eventId: "evt_overtime",
        actionCostClicks: 1,
        turnActionOrdinalStart: 3,
        turnActionOrdinalEnd: 3,
        cardDefinitionId: "onr_v1_297_overtime-incentives",
        title: "Overtime Incentives",
      }),
      makeEvent("gain_credit", {
        actor: "corp",
        eventId: "evt_extra_1",
        actionCostClicks: 1,
        turnActionOrdinalStart: 2,
        turnActionOrdinalEnd: 2,
      }),
      makeEvent("gain_credit", {
        actor: "corp",
        eventId: "evt_extra_2",
        actionCostClicks: 1,
        turnActionOrdinalStart: 3,
        turnActionOrdinalEnd: 3,
      }),
    ];
    const actionUseByEventId = chronicleActionUseByEventId(events);
    const firstExtraActionUse = actionUseByEventId.evt_extra_1;
    const secondExtraActionUse = actionUseByEventId.evt_extra_2;
    expect(firstExtraActionUse).toBeDefined();
    expect(secondExtraActionUse).toBeDefined();
    const firstExtra = formatChronicleEvent(events[3]!, "runner", {
      actionUse: firstExtraActionUse ?? null,
    });
    const secondExtra = formatChronicleEvent(events[4]!, "runner", {
      actionUse: secondExtraActionUse ?? null,
    });

    expect(actionUseByEventId.evt_overtime).toMatchObject({
      label: "3",
      title: "3. Aktion in diesem Zug",
    });
    expect(firstExtra.actionUse).toMatchObject({
      label: "4",
      title: "4. Aktion in diesem Zug",
    });
    expect(secondExtra.actionUse).toMatchObject({
      label: "5",
      title: "5. Aktion in diesem Zug",
    });
  });

  it("shows turn numbers for turn entries when provided by context", () => {
    const runnerTurnEnd = formatChronicleEvent(
      makeEvent("end_turn", {
        actor: "runner",
      }),
      "runner",
      { turnNumber: 6 },
    );
    const corpMandatoryDraw = formatChronicleEvent(
      makeEvent("mandatory_draw", {
        actor: "corp",
      }),
      "runner",
      { turnNumber: 5 },
    );

    expect(runnerTurnEnd.title).toBe(
      "Du hast den Zug beendet (Zug 6 - Runner).",
    );
    expect(runnerTurnEnd.chips).toContain("Zug 6 - Runner");
    expect(runnerTurnEnd.groupLabel).toBe("Zug 6 - Runner");
    expect(corpMandatoryDraw.chips).toContain("Zug 5 - Korp");
    expect(corpMandatoryDraw.groupLabel).toBe("Zug 5 - Korp");
  });

  it("counts Korp and Runner turns as one shared sequence", () => {
    const events = [
      makeEvent("mandatory_draw", {
        actor: "corp",
        eventId: "evt_corp_draw_1",
      }),
      makeEvent("gain_credit", { actor: "corp", eventId: "evt_corp_credit_1" }),
      makeEvent("end_turn", { actor: "corp", eventId: "evt_corp_end_1" }),
      makeEvent("resolve_choice", {
        actor: "corp",
        eventId: "evt_corp_discard_1",
        discardResolved: true,
        hiddenZoneAction: "discard_phase",
      }),
      makeEvent("draw_card", { actor: "runner", eventId: "evt_runner_draw_1" }),
      makeEvent("play_event", {
        actor: "runner",
        eventId: "evt_runner_forged",
        cardDefinitionId: "onr_v1_086_forged-activation-orders",
      }),
      makeEvent("resolve_choice", {
        actor: "corp",
        eventId: "evt_corp_forged_response",
        v1922RunnerEventAbility: "force_rez_or_trash_ice",
      }),
      makeEvent("end_turn", { actor: "runner", eventId: "evt_runner_end_1" }),
      makeEvent("resolve_choice", {
        actor: "runner",
        eventId: "evt_runner_discard_1",
        discardResolved: true,
        hiddenZoneAction: "discard_phase",
      }),
      makeEvent("mandatory_draw", {
        actor: "corp",
        eventId: "evt_corp_draw_2",
      }),
      makeEvent("end_turn", { actor: "corp", eventId: "evt_corp_end_2" }),
      makeEvent("end_turn", { actor: "runner", eventId: "evt_runner_end_2" }),
    ];
    const turnNumbers = chronicleTurnNumberByEventId(events);
    const turnSides = chronicleTurnSideByEventId(events);

    expect(turnNumbers).toMatchObject({
      evt_corp_draw_1: 1,
      evt_corp_end_1: 1,
      evt_corp_discard_1: 1,
      evt_runner_draw_1: 2,
      evt_runner_forged: 2,
      evt_corp_forged_response: 2,
      evt_runner_end_1: 2,
      evt_runner_discard_1: 2,
      evt_corp_draw_2: 3,
      evt_corp_end_2: 3,
      evt_runner_end_2: 4,
    });
    expect(turnSides.evt_corp_forged_response).toBe("runner");

    expect(turnSides.evt_runner_end_1).toBe("runner");
  });

  it("groups start-turn effects carried by discard resolution under the next turn", () => {
    const discardEvent = makeEvent("resolve_choice", {
      actor: "runner",
      discardResolved: true,
      hiddenZoneAction: "discard_phase",
      resolvedEffects: [
        {
          effectId: "corp.start.skivviss",
          kind: "draw_cards",
          visibility: "public",
          side: "corp",
          amount: 3,
          reason: "start_of_turn",
          sourceDefinitionId: "onr_v1_064_skivviss",
          sourceTitle: "Skivviss",
        },
      ],
    });
    const skivvissItem = formatChronicleEffectItems(discardEvent, "runner")[0];

    expect(skivvissItem?.title).toBe(
      "Skivviss: Die Korp zieht zu Beginn ihres Zugs 3 zusätzliche Karten.",
    );
    expect(
      skivvissItem
        ? chronicleStartTurnEffectGroupFromEvent(discardEvent, 30, skivvissItem)
        : null,
    ).toEqual({ label: "Zug 31 - Korp", kind: "corp" });
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
            reason: "unsuccessful_run",
          },
        ],
      }),
      "corp",
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe(
      "Du hast 2 Credits durch Tokyo-Chiba Infighting erhalten.",
    );
    expect(items[0]?.category).toBe("economy");
    expect(items[0]?.cardDefinitionId).toBe(
      "onr_v1_371_tokyo-chiba-infighting",
    );
    expect(items[0]?.cardTitle).toBe("Tokyo-Chiba Infighting");
    expect(items[0]?.chips).toContain("+2 Credits");
  });

  it("shows Quest for Cattekin die rolls and outcomes for start-turn effects", () => {
    const items = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "quest-noop",
            kind: "counter_change",
            visibility: "public",
            side: "runner",
            amount: 0,
            reason: "start_of_turn",
            sourceDefinitionId: "onr_v1_172_quest-for-cattekin",
            sourceTitle: "Quest for Cattekin",
            v1921DieRoll: 4,
            questForCattekinOutcome: "no_effect",
          },
          {
            effectId: "quest-core",
            kind: "damage",
            visibility: "public",
            side: "runner",
            amount: 1,
            reason: "start_of_turn",
            sourceDefinitionId: "onr_v1_172_quest-for-cattekin",
            sourceTitle: "Quest for Cattekin",
            v1921DieRoll: 1,
            questForCattekinOutcome: "core_damage",
            damageCannotBePrevented: true,
            damageType: "core",
          },
          {
            effectId: "quest-net",
            kind: "damage",
            visibility: "public",
            side: "runner",
            amount: 1,
            reason: "start_of_turn",
            sourceDefinitionId: "onr_v1_172_quest-for-cattekin",
            sourceTitle: "Quest for Cattekin",
            v1921DieRoll: 2,
            questForCattekinOutcome: "net_damage",
            damageCannotBePrevented: true,
            damageType: "net",
          },
          {
            effectId: "quest-action",
            kind: "gain_actions",
            visibility: "public",
            side: "runner",
            amount: 1,
            reason: "start_of_turn",
            sourceDefinitionId: "onr_v1_172_quest-for-cattekin",
            sourceTitle: "Quest for Cattekin",
            v1921DieRoll: 6,
            questForCattekinOutcome: "permanent_action",
            sourceTrashed: true,
            permanentActionGain: true,
          },
        ],
      }),
      "runner",
    );

    expect(items.map((item) => item.title)).toEqual([
      "Quest for Cattekin würfelt eine 4: kein weiterer Effekt.",
      "Quest for Cattekin würfelt eine 1: Du erleidest 1 Core Damage.",
      "Quest for Cattekin würfelt eine 2: Du erleidest 1 Net Damage.",
      "Quest for Cattekin würfelt eine 6: Du erhältst dauerhaft 1 zusätzliche Aktion.",
    ]);
    expect(items[0]?.chips).toEqual(
      expect.arrayContaining(["Quest for Cattekin", "Wurf 4", "Kein Effekt"]),
    );
    expect(items[1]?.description).toBe(
      "Der Schaden von Quest for Cattekin kann nicht verhindert werden.",
    );
    expect(items[3]?.chips).toEqual(
      expect.arrayContaining(["Wurf 6", "Extra-Aktion", "Dauerhaft", "Trash"]),
    );
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
            reason: "region_install",
          },
        ],
      }),
      "corp",
    );

    expect(items[0]?.title).toBe(
      "Tokyo-Chiba Infighting wurde sofort gerezzt.",
    );
    expect(items[0]?.importance).toBe("important");
    expect(items[0]?.chips).toContain("Automatisch");
  });

  it("formats generic rez-on-install effects", () => {
    const items = formatChronicleEffectItems(
      makeEvent("install_card", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "install-rez",
            kind: "rez_card",
            visibility: "public",
            side: "corp",
            cardDefinitionId: "onr_v1_356_namatoki-plaza",
            cardTitle: "Namatoki Plaza",
            sourceDefinitionId: "onr_v1_356_namatoki-plaza",
            sourceTitle: "Namatoki Plaza",
            reason: "install_rez",
          },
        ],
      }),
      "runner",
    );

    expect(items[0]?.title).toBe("Namatoki Plaza wurde sofort gerezzt.");
    expect(items[0]?.importance).toBe("important");
    expect(items[0]?.visibility).toBe("public");
    expect(items[0]?.chips).toEqual(
      expect.arrayContaining(["Rez", "Automatisch"]),
    );
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
            serverLabel: "Remote 1",
          },
        ],
      }),
      "corp",
    );
    expect(visibleItems[0]?.title).toBe(
      "Crystal Palace Station Grid wurde durch Paris City Grid ins Archiv gelegt.",
    );
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
            serverLabel: "Remote 1",
          },
        ],
      }),
      "runner",
    );
    expect(hiddenItems[0]?.title).toBe(
      "Eine vorhandene Region wurde durch Paris City Grid ins Archiv gelegt.",
    );
    expect(JSON.stringify(hiddenItems)).not.toContain(
      "Crystal Palace Station Grid",
    );
    expect(JSON.stringify(hiddenItems)).not.toContain(
      "onr_v1_355_crystal-palace-station-grid",
    );
  });

  it("formats self-trash effects without repeating the source card name", () => {
    const items = formatChronicleEffectItems(
      makeEvent("start_run", {
        actor: "runner",
        resolvedEffects: [
          {
            effectId: "top-runners-trash",
            kind: "trash_source",
            visibility: "public",
            side: "runner",
            sourceDefinitionId: "onr_v1_184_top-runners-conference",
            sourceTitle: "Top Runners' Conference",
            reason: "run_start",
          },
        ],
      }),
      "runner",
    );

    expect(items[0]?.title).toBe(
      "Top Runners' Conference wurde getrasht, weil Runner einen Run startet.",
    );
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
            redactedKind: "region_replacement",
          },
        ],
      }),
      "runner",
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
            sourceTitle: "Runner Secret Source",
          },
        ],
      }),
      "corp",
    );

    expect(hiddenBarrierItems[0]?.title).toBe(
      "Ein verdecktes Region Upgrade wurde ersetzt.",
    );
    expect(hiddenBarrierItems[0]?.visibility).toBe("redacted");
    expect(hiddenBarrierItems[0]?.category).toBe("hidden");
    expect(hiddenBarrierItems[0]?.cardDefinitionId).toBeUndefined();
    expect(hiddenBarrierItems[0]?.cardTitle).toBeUndefined();
    expect(JSON.stringify(hiddenBarrierItems[0])).not.toMatch(
      /Simple Agenda|simple_agenda|Secret Region Upgrade|secret_region_upgrade/,
    );
    expect(privateSideItems[0]?.title).toBe(
      "Eine verdeckte Karte wurde in den Heap gelegt.",
    );
    expect(privateSideItems[0]?.visibility).toBe("redacted");
    expect(JSON.stringify(privateSideItems[0])).not.toMatch(
      /Jackhammer|onr_v1_036_jackhammer|Runner Secret Source|runner_secret_source/,
    );
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
            amount: 2,
            sourceDefinitionId: "onr_v1_184_top-runners-conference",
            sourceTitle: "Top Runners' Conference",
            reason: "start_of_turn",
          },
        ],
      }),
      "runner",
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe(
      "Top Runners' Conference gibt Runner 2 Credits.",
    );
    expect(items[0]?.category).toBe("economy");
    expect(items[0]?.cardDefinitionId).toBe(
      "onr_v1_184_top-runners-conference",
    );
    expect(items[0]?.chips).toEqual(
      expect.arrayContaining(["+2 Credits", "Automatisch"]),
    );
  });

  it("shows P3.7 turn-start credit and action effects with card names", () => {
    const items = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "runner",
        resolvedEffects: [
          {
            effectId: "corp.start.polymer.card_211",
            kind: "gain_credits",
            visibility: "public",
            side: "corp",
            amount: 1,
            sourceDefinitionId: "onr_v1_211_polymer-breakthrough",
            sourceTitle: "Polymer Breakthrough",
            reason: "start_of_turn",
          },
          {
            effectId: "corp.start.remote.card_335",
            kind: "gain_actions",
            visibility: "public",
            side: "corp",
            amount: 1,
            sourceDefinitionId: "onr_v1_335_remote-facility",
            sourceTitle: "Remote Facility",
            reason: "start_of_turn",
          },
          {
            effectId: "corp.start.subsidiary.card_218",
            kind: "gain_actions",
            visibility: "public",
            side: "corp",
            amount: 1,
            sourceDefinitionId: "onr_v1_218_subsidiary-branch",
            sourceTitle: "Subsidiary Branch",
            reason: "start_of_turn",
          },
        ],
      }),
      "runner",
    );

    expect(items).toHaveLength(3);
    expect(items[0]?.title).toBe("Polymer Breakthrough gibt Korp 1 Credit.");
    expect(items[1]?.title).toBe("Remote Facility gibt Korp 1 Aktion.");
    expect(items[2]?.title).toBe("Subsidiary Branch gibt Korp 1 Aktion.");
    expect(JSON.stringify(items)).not.toContain("genutzt");
  });

  it("shows P3.7 Runner turn-start hosted-credit and credit effects", () => {
    const items = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "runner.start.floating.card_163",
            kind: "gain_credits",
            visibility: "public",
            side: "runner",
            amount: 1,
            sourceDefinitionId: "onr_v1_163_floating-runner-bbs",
            sourceTitle: "Floating Runner BBS",
            reason: "start_of_turn",
          },
          {
            effectId: "runner.start.rigged.card_174",
            kind: "take_hosted_credits",
            visibility: "public",
            side: "runner",
            amount: 1,
            counterType: "bit",
            removedCounterAmount: 1,
            remainingCounters: 11,
            sourceDefinitionId: "onr_v1_174_rigged-investments",
            sourceTitle: "Rigged Investments",
            reason: "start_of_turn",
          },
        ],
      }),
      "runner",
    );

    expect(items).toHaveLength(2);
    expect(items[0]?.title).toBe("Floating Runner BBS gibt Runner 1 Credit.");
    expect(items[1]?.title).toBe(
      "Rigged Investments gibt Runner 1 Credit von der Karte.",
    );
    expect(items[1]?.chips).toEqual(
      expect.arrayContaining([
        "+1 Credit",
        "1 Credit von Karte",
        "11 Credits übrig",
        "Automatisch",
      ]),
    );
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
            reason: "start_of_turn",
          },
        ],
      }),
      "runner",
    );

    expect(items[0]?.title).toBe(
      "Du hast Recurring Credits auf The Shell Traders aufgefrischt.",
    );
    expect(items[0]?.category).toBe("card");
    expect(items[0]?.chips).toEqual(
      expect.arrayContaining([
        "Recurring Credits",
        "1 bereit",
        "+1",
        "Automatisch",
      ]),
    );
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
            reason: "start_of_turn",
          },
        ],
      }),
      "runner",
    );

    expect(items[0]?.title).toBe(
      "Du hast 1 Shell-Counter von Simple Fracter entfernt.",
    );
    expect(items[0]?.groupLabel).toBe("Zug - Runner");
    expect(items[0]?.cardDefinitionId).toBe("simple_fracter");
    expect(items[0]?.cardTitle).toBe("Simple Fracter");
    expect(items[0]?.chips).toEqual(
      expect.arrayContaining([
        "The Shell Traders",
        "Shell-Counter",
        "1 entfernt",
        "1 übrig",
      ]),
    );
  });

  it("shows Braindance Campaign turn-start drain as one credit message", () => {
    const items = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "runner",
        resolvedEffects: [
          {
            effectId: "corp.start.braindance_campaign.card_311",
            kind: "take_hosted_credits",
            visibility: "public",
            side: "corp",
            amount: 2,
            counterType: "bit",
            removedCounterAmount: 2,
            remainingCounters: 10,
            sourceDefinitionId: "onr_v1_311_braindance-campaign",
            sourceTitle: "Braindance Campaign",
            reason: "start_of_turn",
          },
        ],
      }),
      "corp",
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe(
      "Braindance Campaign gibt Korp 2 Credits von der Karte.",
    );
    expect(items[0]?.category).toBe("economy");
    expect(items[0]?.chips).toEqual(
      expect.arrayContaining([
        "+2 Credits",
        "2 Credits von Karte",
        "10 Credits übrig",
        "Automatisch",
      ]),
    );
    expect(JSON.stringify(items)).not.toContain("genutzt");
    expect(JSON.stringify(items)).not.toContain("gespielt");
  });

  it("shows hosted-credit start-of-turn trash-on-empty as a follow-up effect", () => {
    const items = formatChronicleEffectItems(
      makeEvent("end_turn", {
        actor: "runner",
        resolvedEffects: [
          {
            effectId: "corp.start.holovid_campaign.card_326",
            kind: "take_hosted_credits",
            visibility: "public",
            side: "corp",
            amount: 1,
            counterType: "bit",
            removedCounterAmount: 1,
            remainingCounters: 0,
            sourceDefinitionId: "onr_v1_326_holovid-campaign",
            sourceTitle: "Holovid Campaign",
            reason: "start_of_turn",
          },
          {
            effectId: "corp.start.holovid_campaign.trash.card_326",
            kind: "trash_source_when_empty",
            visibility: "public",
            side: "corp",
            amount: 1,
            sourceDefinitionId: "onr_v1_326_holovid-campaign",
            sourceTitle: "Holovid Campaign",
            reason: "start_of_turn",
          },
        ],
      }),
      "runner",
    );

    expect(items).toHaveLength(2);
    expect(items[0]?.title).toBe(
      "Holovid Campaign gibt Korp 1 Credit von der Karte.",
    );
    expect(items[1]?.title).toBe("Holovid Campaign wurde getrasht.");
  });

  it("shows Detroit and Spinn start-of-turn hosted-credit takes with card names", () => {
    for (const [title, definitionId, amount, remaining, expectedTitle] of [
      [
        "Detroit Police Contract",
        "onr_v1_198_detroit-police-contract",
        2,
        10,
        "Detroit Police Contract gibt Korp 2 Credits von der Karte.",
      ],
      [
        "Spinn Public Relations",
        "onr_v1_344_spinn-public-relations",
        1,
        2,
        "Spinn Public Relations gibt Korp 1 Credit von der Karte.",
      ],
    ] as const) {
      const items = formatChronicleEffectItems(
        makeEvent("end_turn", {
          actor: "runner",
          resolvedEffects: [
            {
              effectId: `${definitionId}.start.take_hosted_credits`,
              kind: "take_hosted_credits",
              visibility: "public",
              side: "corp",
              amount,
              counterType: "bit",
              removedCounterAmount: amount,
              remainingCounters: remaining,
              sourceDefinitionId: definitionId,
              sourceTitle: title,
              reason: "start_of_turn",
            },
          ],
        }),
        "runner",
      );

      expect(items).toHaveLength(1);
      expect(items[0]?.title).toBe(expectedTitle);
      expect(items[0]?.cardTitle).toBe(title);
      expect(JSON.stringify(items)).not.toContain("genutzt");
    }
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
            reason: "start_of_turn",
          },
        ],
      }),
      "runner",
    );

    expect(items[0]?.title).toBe(
      "Du hast Hostile Takeover durch Bizarre Encryption Scheme gestohlen.",
    );
    expect(items[0]?.category).toBe("agenda");
    expect(items[0]?.chips).toEqual(
      expect.arrayContaining(["Agenda", "+2 Agenda", "Automatisch"]),
    );
  });

  it("names access-effect damage with source and discarded cards", () => {
    const items = formatChronicleEffectItems(
      makeEvent("resolve_choice", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "bel_digmo.access.damage",
            kind: "damage",
            visibility: "hidden_info_barrier",
            side: "runner",
            amount: 1,
            damageType: "net",
            cardsTrashed: 1,
            reason: "access_effect",
            sourceDefinitionId: "onr_proteus_071_bel-digmo-antibody",
            sourceTitle: "Bel-Digmo Antibody",
          },
        ],
      }),
      "runner",
    );

    expect(items[0]?.title).toBe(
      "Du hast 1 Net Damage durch Bel-Digmo Antibody erlitten.",
    );
    expect(items[0]?.description).toBe(
      "eine Karte wurde dadurch in den Heap bewegt.",
    );
    expect(items[0]?.chips).toEqual(
      expect.arrayContaining(["Access-Effekt", "Bel-Digmo Antibody", "1 Heap"]),
    );
    expect(items[0]?.groupLabel).toBe("Run");
  });

  it("explains additional R&D accesses from Highlighter counters", () => {
    const firstAccess = formatChronicleEvent(
      makeEvent("access_card", {
        actor: "runner",
        title: "Pattel Antibody",
        cardDefinitionId: "onr_proteus_068_pattel-antibody",
        serverLabel: "R&D",
        accessIndex: 0,
        baseAccessCount: 1,
        highlighterCounterCount: 3,
        highlighterAccessBonus: 2,
        effectiveAccessCount: 3,
      }),
      "runner",
    );
    const secondAccess = formatChronicleEvent(
      makeEvent("access_card", {
        actor: "runner",
        title: "Bel-Digmo Antibody",
        cardDefinitionId: "onr_proteus_071_bel-digmo-antibody",
        serverLabel: "R&D",
        accessIndex: 1,
        baseAccessCount: 1,
        highlighterCounterCount: 3,
        highlighterAccessBonus: 2,
        effectiveAccessCount: 3,
      }),
      "runner",
    );

    expect(firstAccess.title).toBe(
      "Du hast auf Pattel Antibody in R&D zugegriffen.",
    );
    expect(secondAccess.title).toBe(
      "Du hast auf Bel-Digmo Antibody in R&D zugegriffen, weil die Korp 3 Highlighter-Counter hat.",
    );
    expect(secondAccess.description).toBe(
      "Das ist Zugriff 2 von 3; Highlighter erlaubt diesen zusätzlichen R&D-Zugriff.",
    );
    expect(secondAccess.chips).toEqual(
      expect.arrayContaining(["3 Highlighter", "Zugriff 2/3"]),
    );
  });

  it("explains Proteus free trash for normally untrashable access cards", () => {
    const item = formatChronicleEvent(
      makeEvent("trash_accessed_card", {
        actor: "runner",
        title: "Dog Pile",
        freeAccessTrash: true,
        proteusRunnerVirusFreeTrashCounterType: "garbage",
      }),
      "runner",
    );

    expect(item.title).toBe("Du hast Dog Pile getrasht.");
    expect(item.description).toBe(
      "Garbage In erlaubt diesen kostenlosen Trash auch für Karten, die normalerweise nicht getrasht werden können.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining(["Trash", "Garbage In", "Kostenlos"]),
    );
  });

  it("shows Proteus successful-run counters with their concrete target", () => {
    const items = formatChronicleEffectItems(
      makeEvent("decline_trash", {
        actor: "runner",
        resolvedEffects: [
          {
            effectId: "run_rd.highlighter.successful_run.highlighter",
            kind: "counter_change",
            visibility: "public",
            side: "corp",
            amount: 1,
            counterType: "highlighter",
            addedCounterAmount: 1,
            remainingCounters: 1,
            reason: "proteus_runner_virus_successful_run",
            sourceDefinitionId: "onr_proteus_090_highlighter",
            sourceTitle: "Highlighter",
          },
          {
            effectId: "run_rd.viral_pipeline.successful_run.socket_rd",
            kind: "counter_change",
            visibility: "public",
            side: "corp",
            amount: 1,
            counterType: "socket_rd",
            addedCounterAmount: 1,
            remainingCounters: 1,
            reason: "proteus_runner_virus_successful_run",
            sourceDefinitionId: "onr_proteus_099_viral-pipeline",
            sourceTitle: "Viral Pipeline",
            serverLabel: "R&D",
          },
          {
            effectId: "run_rd.cascade.successful_run.cascade",
            kind: "counter_change",
            visibility: "public",
            side: "corp",
            amount: 1,
            counterType: "cascade",
            addedCounterAmount: 1,
            remainingCounters: 1,
            reason: "proteus_runner_virus_successful_run",
            sourceDefinitionId: "onr_v1_010_cascade",
            sourceTitle: "Cascade",
            serverLabel: "R&D",
          },
        ],
      }),
      "runner",
    );

    expect(items.map((item) => item.title)).toEqual([
      "Die Korp hat 1 Highlighter-Counter durch Highlighter erhalten.",
      "R&D hat 1 Socket-Counter durch Viral Pipeline erhalten.",
      "Die Korp hat 1 Cascade-Counter durch Cascade erhalten.",
    ]);
    expect(items.at(2)?.description).toBe(
      "Nach einem erfolgreichen Run auf R&D hat die Korp 1 Cascade-Counter erhalten. Je 2 Cascade-Counter zwingen die Korp zu Beginn ihres Zugs, 1 offene Karte aus R&D ins Archiv zu legen.",
    );
  });

  it("describes Pattel access counters by affected icebreakers or absence", () => {
    const withTargets = formatChronicleEffectItems(
      makeEvent("resolve_choice", {
        actor: "corp",
        targetCount: 2,
        targetCardDefinitionIds:
          "onr_v1_005_bartmoss-memorial-icebreaker,onr_v1_074_worm",
        resolvedEffects: [
          {
            effectId: "pattel.access.counters",
            kind: "counter_change",
            visibility: "public",
            side: "runner",
            amount: 2,
            counterType: "breaker_strength_penalty",
            addedCounterAmount: 2,
            remainingCounters: 2,
            sourceDefinitionId: "onr_proteus_068_pattel-antibody",
            sourceTitle: "Pattel Antibody",
          },
        ],
      }),
      "runner",
    );
    const withoutTargets = formatChronicleEffectItems(
      makeEvent("resolve_choice", {
        actor: "corp",
        targetCount: 0,
        targetCardDefinitionIds: "",
        resolvedEffects: [
          {
            effectId: "pattel.access.no_counters",
            kind: "counter_change",
            visibility: "public",
            side: "runner",
            amount: 0,
            counterType: "breaker_strength_penalty",
            addedCounterAmount: 0,
            remainingCounters: 0,
            reason: "access_effect",
            sourceDefinitionId: "onr_proteus_068_pattel-antibody",
            sourceTitle: "Pattel Antibody",
          },
        ],
      }),
      "runner",
    );

    expect(withTargets[0]?.title).toBe(
      "1 Pattel-Counter auf Bartmoss Memorial Icebreaker und Worm gelegt.",
    );
    expect(withTargets[0]?.description).toBe(
      "Jeder betroffene Icebrecher hat 1 Pattel-Counter erhalten.",
    );
    expect(withTargets[0]?.groupLabel).toBe("Run");
    expect(withoutTargets[0]?.title).toBe(
      "Es wurden keine Pattel-Counter auf Icebrecher gelegt, da keine im Spiel waren.",
    );
  });

  it("names legacy Pattel payment choices from counter effects", () => {
    const item = formatChronicleEvent(
      makeEvent("resolve_choice", {
        actor: "corp",
        resolvedEffects: [
          {
            effectId: "pattel.access.counters",
            kind: "counter_change",
            visibility: "public",
            side: "runner",
            amount: 1,
            counterType: "breaker_strength_penalty",
            addedCounterAmount: 1,
            remainingCounters: 1,
            sourceDefinitionId: "onr_proteus_068_pattel-antibody",
            sourceTitle: "Pattel Antibody",
          },
        ],
      }),
      "runner",
    );

    expect(item.title).toBe(
      "Die Korp hat 3 Credits für den Access-Ambush von Pattel Antibody bezahlt.",
    );
    expect(item.chips).toEqual(
      expect.arrayContaining(["Access-Ambush", "Pattel Antibody", "3 Credits"]),
    );
  });
});

function makeEvent(
  actionType: string,
  payload: Record<string, unknown> = {},
): PublicGameEvent {
  const actor =
    sideValue(payload.actor) ??
    (actionType === "mandatory_draw" || actionType === "play_operation"
      ? "corp"
      : "runner");
  const eventId =
    typeof payload.eventId === "string" ? payload.eventId : `evt_${actionType}`;
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
      ...payloadWithoutEventId,
    },
  };
}

function sideValue(value: unknown): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}
