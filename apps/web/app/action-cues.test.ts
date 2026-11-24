import { describe, expect, it } from "vitest";
import { createTranslator } from "use-intl/core";
import enMessages from "../messages/en.json";
import type { PlayerView, PublicGameEvent, Side } from "@netgrid/shared";
import {
  actionSoundCountForAction,
  actionSoundForActionType,
  coalesceActionCues,
  cueHasHiddenLeak,
  damageAudioCueFromPublicPayload,
  deriveDamageImpactCues,
  deriveOpponentActionCues as deriveOpponentActionCuesWithoutCatalog,
  eventsAfter,
  turnStartAudioCue,
  type CueDerivationInput,
} from "./action-cues";
import { actionCueAfterAiAdvanceRequest } from "./access-presentation";
import {
  chronicleActionUseByEventId,
  type ChronicleTranslate,
} from "./chronicle";

const TEST_CARD_PRESENTATIONS = {
  588: { title: "Simple Agenda", type: "agenda" },
  589: { title: "Simple Barrier ICE", type: "ice" },
  591: { title: "Simple Decoder", type: "program" },
} as const;

function deriveOpponentActionCues(input: CueDerivationInput) {
  return deriveOpponentActionCuesWithoutCatalog({
    ...input,
    contextByEventId: Object.fromEntries(
      input.events.map((event) => [
        event.eventId,
        {
          ...(input.contextByEventId?.[event.eventId] ?? {}),
          cardPresentationsById: TEST_CARD_PRESENTATIONS,
        },
      ]),
    ),
  });
}

describe("deriveOpponentActionCues", () => {
  it("keeps credit balances with each confirmed action for either player", () => {
    const gain = { side: "runner", before: 5, after: 6 } as const;
    const payment = { side: "corp", before: 7, after: 3 } as const;
    const events = [
      event(95, "gain_credit", {
        actor: "runner",
        amount: 1,
        creditChanges: [gain],
      }),
      event(96, "rez_ice", {
        actor: "corp",
        rezCostPaid: 4,
        creditChanges: [payment],
      }),
      event(97, "activated_card_ability", {
        actor: "runner",
        hostedCreditsAfter: 3,
      }),
    ];
    const input = {
      viewerSide: "runner" as const,
      playerView: view("runner"),
      events,
    };
    const cues = deriveOpponentActionCues({
      ...input,
      includeOwnCreditChanges: true,
      locallySoundedEventIds: new Set([95]),
    });
    expect(cues.map((cue) => cue.creditChanges)).toEqual([[gain], [payment]]);
    expect(cues[0]?.sound).toBeUndefined();
    expect(cues[1]?.sound).toBe("ice_rez");
    expect(deriveOpponentActionCues(input).map((cue) => cue.eventId)).toEqual([
      96,
    ]);
  });

  it("localizes the shared window and floating cue model on the viewing client", () => {
    const input = {
      viewerSide: "runner" as const,
      playerView: view("runner"),
      events: [
        event(100, "gain_credit", {
          actor: "corp",
          amount: 2,
          actionCostClicks: 1,
          turnActionOrdinalStart: 1,
          turnActionOrdinalEnd: 1,
        }),
      ],
    };
    const english = deriveOpponentActionCues({
      ...input,
      translate: testTranslate({
        "actor.corp": "The Corp",
        "event.creditsGained": "{subject}: gained {amount} credits.",
        "actionUse.single": "Action {start} this turn",
      }),
    });
    const french = deriveOpponentActionCues({
      ...input,
      translate: testTranslate({
        "actor.corp": "La Corpo",
        "event.creditsGained": "{subject} : a gagné {amount} crédits.",
        "actionUse.single": "Action {start} de ce tour",
      }),
    });

    expect(english[0]).toMatchObject({
      actorLabel: "The Corp",
      title: "The Corp: gained 2 credits.",
      actionUse: { title: "Action 1 this turn" },
    });
    expect(french[0]).toMatchObject({
      actorLabel: "La Corpo",
      title: "La Corpo : a gagné 2 crédits.",
      actionUse: { title: "Action 1 de ce tour" },
    });
    expect(english[0]?.title).not.toMatch(/erhält|Aktion in diesem Zug/);
    expect(french[0]?.title).not.toMatch(/erhält|Aktion in diesem Zug/);
  });

  it("presents a contiguous AI pump series in one action cue", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [
        event(101, "pump_breaker", {
          actor: "runner",
          title: "Krash",
          aiReasonCode: "runner.encounter.pump_breaker",
          pumpBreakerId: "breaker_1",
          pumpStrengthAmount: 1,
          pumpBreakerCreditCost: 2,
          breakerStrengthAfter: 1,
          creditChanges: [{ side: "runner", before: 7, after: 5 }],
        }),
        event(102, "pump_breaker", {
          actor: "runner",
          title: "Krash",
          aiReasonCode: "runner.encounter.pump_breaker",
          pumpBreakerId: "breaker_1",
          pumpStrengthAmount: 1,
          pumpBreakerCreditCost: 2,
          breakerStrengthAfter: 2,
        }),
        event(103, "pump_breaker", {
          actor: "runner",
          title: "Krash",
          aiReasonCode: "runner.encounter.pump_breaker",
          pumpBreakerId: "breaker_1",
          pumpStrengthAmount: 1,
          pumpBreakerCreditCost: 2,
          breakerStrengthAfter: 3,
          creditChanges: [{ side: "runner", before: 5, after: 3 }],
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({
      eventId: 101,
      source: "ai",
      creditChanges: [{ side: "runner", before: 7, after: 3 }],
      title:
        "Die Runner-KI hat Krash von Stärke 0 auf 3 gepumpt (3× gepumpt, +3 Stärke, 6 Credits insgesamt).",
      description:
        "3× gepumpt: +3 Stärke für diese Begegnung; 6 Credits insgesamt.",
    });
  });

  it("suppresses technical rez-pass cues but keeps an actual ICE rez decline visible", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(104, "decline_rez", {
          actor: "corp",
          runRootRezPass: true,
        }),
        event(105, "decline_rez", {
          actor: "corp",
          runFortPassPass: true,
        }),
        event(106, "decline_rez", {
          actor: "corp",
          runApproachRootRezPass: true,
        }),
        event(107, "decline_rez", {
          actor: "corp",
        }),
      ],
    });

    expect(cues.map((cue) => cue.eventId)).toEqual([107]);
    expect(cues[0]?.actionType).toBe("decline_rez");
  });

  it("keeps a visible effect cue emitted while a technical rez pass is suppressed", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(108, "decline_rez", {
          actor: "corp",
          runApproachRootRezPass: true,
          resolvedEffects: [
            {
              effectId: 0,
              kind: "damage",
              visibility: "hidden_info_barrier",
              side: "runner",
              amount: 1,
              damageType: "net",
              cardsTrashed: 1,
              reason: "access_effect",
              sourceDefinitionId: 9119,
              sourceTitle: "Simple Damage Source",
            },
          ],
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({
      eventId: 108,
      source: "system",
      title: "Du hast 1 Net Damage durch Simple Damage Source erlitten.",
    });
  });

  it("keeps forced effect cues localized without falling back to legacy German", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(109, "decline_rez", {
          actor: "corp",
          runApproachRootRezPass: true,
          resolvedEffects: [
            {
              effectId: 0,
              kind: "damage",
              visibility: "hidden_info_barrier",
              side: "runner",
              amount: 1,
              damageType: "net",
              cardsTrashed: 1,
              reason: "access_effect",
              sourceDefinitionId: 9119,
              sourceTitle: "Simple Damage Source",
            },
          ],
        }),
      ],
      translate: createTranslator({
        locale: "en",
        messages: enMessages,
        namespace: "Chronicle",
        onError: (error) => {
          throw error;
        },
      }) as unknown as ChronicleTranslate,
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.title).toBe(
      "You: suffered 1 net damage from Simple Damage Source on access.",
    );
    expect(cues[0]?.visibility).toBe("public");
    expect(cues[0]?.actorLabel).toBe("The game");
    expect(cues[0]?.title).not.toContain("erlitten");
  });

  it("maps opponent AI events to stable cues without exposing raw reason codes", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(2, "mandatory_draw", {
          actor: "corp",
          aiReasonCode: "corp.mandatory_draw",
          aiExplanation: "Die Korp braucht ihre Pflichtkarte.",
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.cueId).toBe("runner:2");
    expect(cues[0]?.source).toBe("ai");
    expect(cues[0]?.title).toBe("Die Korp-KI hat ihre Pflichtkarte gezogen.");
    expect(cues[0]?.description).toBeUndefined();
    expect(cues[0]?.aiExplanation).toBe("Die Korp braucht ihre Pflichtkarte.");
    expect(JSON.stringify(cues[0])).not.toContain("ce");
  });

  it("shows each resolved City Surveillance choice exactly once", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [
        event(110, "resolve_choice", {
          actor: "runner",
          aiReasonCode: "plan_first.engine_window",
          sourceDefinitionId: 525,
          drawTaxSourceCount: 1,
          drawTaxDecision: "pay",
          drawTaxCreditsPaid: 1,
          drawTaxTagsAdded: 0,
        }),
        event(111, "resolve_choice", {
          actor: "runner",
          aiReasonCode: "plan_first.engine_window",
          sourceDefinitionId: 525,
          tagsAdded: 1,
          runnerTagsAfter: 1,
          drawTaxSourceCount: 1,
          drawTaxDecision: "tag",
          drawTaxCreditsPaid: 0,
          drawTaxTagsAdded: 1,
          drawTaxTags: 1,
        }),
      ],
    });

    expect(cues.map((cue) => cue.title)).toEqual([
      "Die Runner-KI hat 1 Credit für City Surveillance bezahlt.",
      "Die Runner-KI hat durch City Surveillance 1 Tag erhalten.",
    ]);
  });

  it("redacts hidden Corp installs and keeps the highlight abstract", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(3, "install_card", {
          actor: "corp",
          label: "Korp installiert eine Karte.",
          redactedKind: "installed_card",
          cardDefinitionId: 588,
          title: "Simple Agenda",
          serverId: "r1",
          serverLabel: "Remote 1",
          zoneLabel: "Root",
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.visibility).toBe("redacted");
    expect(cues[0]?.title).toBe(
      "Die Korp hat eine verdeckte Karte in Remote 1 installiert.",
    );
    expect(cues[0]?.highlight).toEqual({
      kind: "server",
      serverId: "r1",
      serverLabel: "Remote 1",
      lane: "root",
    });
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
    expect(JSON.stringify(cues[0])).not.toContain("Simple Agenda");
    expect(JSON.stringify(cues[0])).not.toContain(588);
  });

  it("filters own actions and derives visible card highlights only from PlayerView-visible cards", () => {
    const playerView = view("runner", {
      own: {
        ...view("runner").own,
        rig: [
          {
            instanceId: "card_simple_killer",
            known: true,
            title: "Simple Killer",
            definitionId: 598,
            type: "program",
          },
        ],
      },
    });
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView,
      events: [
        event(112, "install_card", {
          actor: "runner",
          cardDefinitionId: 598,
          title: "Simple Killer",
        }),
        event(113, "trash_resource", {
          actor: "corp",
          cardDefinitionId: 598,
          title: "Simple Killer",
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.eventId).toBe(113);
    expect(cues[0]?.highlight).toEqual({
      kind: "zone",
      side: "runner",
      zone: "rig",
    });
  });

  it("keeps Rio de Janeiro City Grid roll cues visible for both players", () => {
    const rioEvent = event(114, "continue_run", {
      actor: "runner",
      v1921UpgradeAbility: "rio_de_janeiro_passed_ice",
      sourceDefinitionId: 579,
      passedIceDefinitionId: 589,
      serverLabel: "Remote 1",
      v1921DieRoll: 1,
      rioRunEnded: true,
    });

    const runnerCues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [rioEvent],
    });
    const corpCues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [rioEvent],
    });

    expect(runnerCues).toHaveLength(1);
    expect(corpCues).toHaveLength(1);
    expect(runnerCues[0]?.source).toBe("system");
    expect(runnerCues[0]?.actorLabel).toBe("Spiel");
    expect(runnerCues[0]?.title).toBe(
      "Du hast Simple Barrier ICE passiert und Rio de Janeiro City Grid würfelt eine 1.",
    );
    expect(corpCues[0]?.title).toBe(
      "Der Runner hat Simple Barrier ICE passiert und Rio de Janeiro City Grid würfelt eine 1.",
    );
    expect(runnerCues[0]?.cardDefinitionId).toBe(589);
    expect(runnerCues[0]?.cardTitle).toBe("Simple Barrier ICE");
    expect(runnerCues[0]?.description).toBe(
      "Der Run endet durch Rio de Janeiro City Grid.",
    );
    expect(runnerCues[0]?.highlight).toEqual({
      kind: "run",
      serverLabel: "Remote 1",
    });
    expect(runnerCues[0]?.sound).toBe("run");
    expect(cueHasHiddenLeak(runnerCues[0]!)).toBe(false);
    expect(cueHasHiddenLeak(corpCues[0]!)).toBe(false);
  });

  it("shows an ending ICE subroutine instead of an ICE-passed flyover", () => {
    const endRunEvent = event(115, "continue_run", {
      actor: "runner",
      result: "ended",
      encounterContinue: true,
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 1,
      sourceDefinitionId: 9110,
      resolvedEffects: [
        {
          effectId: 0,
          kind: "resolve_subroutine",
          visibility: "public",
          side: "runner",
          sourceDefinitionId: 9110,
          sourceTitle: "Kipa",
          subroutineIndex: 0,
          subroutineType: "end_the_run",
          endedRun: true,
        },
      ],
    });
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [endRunEvent],
      translate: testTranslate({
        "side.runner": "Runner",
        "category.run": "Run",
        "effect.numberedEndRunSubroutine":
          "{source}: Subroutine {number} beendet den Run.",
        "effect.numberedSubroutineChip": "Subroutine {number}",
        "effect.runEndedChip": "Run beendet",
      }),
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.title).toBe("Kipa: Subroutine 1 beendet den Run.");
    expect(cues[0]?.title).not.toContain("passiert");
  });

  it("keeps Vacuum Link die roll cues visible for both players", () => {
    const vacuumEvent = event(116, "continue_run", {
      actor: "runner",
      serverLabel: "HQ",
      rezzedIceRewindDieRoll: 3,
      rezzedIceRewindApplied: true,
      rezzedIceRewindRezzedIceBack: 3,
      rezzedIceRewindTargetIceIndex: 1,
    });

    const runnerCues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [vacuumEvent],
    });
    const corpCues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [vacuumEvent],
    });

    expect(runnerCues).toHaveLength(1);
    expect(corpCues).toHaveLength(1);
    expect(runnerCues[0]?.source).toBe("system");
    expect(runnerCues[0]?.actorLabel).toBe("Spiel");
    expect(runnerCues[0]?.title).toBe(
      "Du hast Vacuum Link ausgelöst und eine 3 gewürfelt: 3 gerezzte ICE zurück, sonst zum ersten ICE; Runner darf ausstöpseln.",
    );
    expect(runnerCues[0]?.description).toBe(
      "Wurf 3: Runner wird um 3 gerezzte ICE zurückgesetzt oder darf ausstöpseln; wenn nicht so viele ICE vorhanden sind, geht es zum ersten ICE. Ziel ist ICE 2.",
    );
    expect(runnerCues[0]?.cardDefinitionId).toBe(487);
    expect(runnerCues[0]?.cardTitle).toBe("Vacuum Link");
    expect(runnerCues[0]?.highlight).toEqual({
      kind: "run",
      serverLabel: "HQ",
    });
    expect(runnerCues[0]?.sound).toBe("run");
    expect(corpCues[0]?.title).toBe(
      "Der Runner hat Vacuum Link ausgelöst und eine 3 gewürfelt: 3 gerezzte ICE zurück, sonst zum ersten ICE; Runner darf ausstöpseln.",
    );
    expect(cueHasHiddenLeak(runnerCues[0]!)).toBe(false);
    expect(cueHasHiddenLeak(corpCues[0]!)).toBe(false);
  });

  it("shows access-effect damage cues for both players", () => {
    const accessDamageEvent = event(117, "resolve_choice", {
      actor: "corp",
      resolvedEffects: [
        {
          effectId: 0,
          kind: "damage",
          visibility: "hidden_info_barrier",
          side: "runner",
          amount: 1,
          damageType: "net",
          cardsTrashed: 1,
          reason: "access_effect",
          sourceDefinitionId: 9111,
          sourceTitle: "Bel-Digmo Antibody",
        },
      ],
    });

    const runnerCues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [accessDamageEvent],
    });
    const corpCues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [accessDamageEvent],
    });

    expect(
      runnerCues.some(
        (cue) =>
          cue.title ===
          "Du hast 1 Net Damage durch Bel-Digmo Antibody erlitten.",
      ),
    ).toBe(true);
    expect(
      corpCues.some(
        (cue) =>
          cue.title ===
          "Der Runner hat 1 Net Damage durch Bel-Digmo Antibody erlitten.",
      ),
    ).toBe(true);
    expect(runnerCues.at(-1)?.source).toBe("system");
    expect(runnerCues.at(-1)?.sound).toBeUndefined();
    expect(
      damageAudioCueFromPublicPayload(accessDamageEvent.publicPayload),
    ).toEqual({ sound: "damage_net", soundCount: 1 });
  });

  it("queues a separate visible tag-result window with the exact gained amount", () => {
    const tagEvent = event(118, "resolve_choice", {
      actor: "runner",
      traceStep: "runner_bid",
      sourceDefinitionId: 108,
      corpBid: 3,
      traceValue: 6,
      runnerBid: 0,
      runnerStrength: 0,
      traceSuccessful: true,
      tagsAdded: 6,
      runnerTagsAfter: 6,
    });

    const runnerCues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [tagEvent],
    });
    const corpCues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [tagEvent],
    });
    const runnerTagCue = runnerCues.find((cue) =>
      cue.cueId.includes(":effect:"),
    );
    const corpTagCue = corpCues.find((cue) => cue.cueId.includes(":effect:"));

    expect(runnerTagCue).toMatchObject({
      cueId: `runner:${tagEvent.eventId}:effect:0`,
      actor: "runner",
      source: "system",
      title: "Du hast 6 Tags erhalten.",
      description: "Du hast jetzt 6 Tags.",
      cardDefinitionId: 108,
      iconBadge: "+6",
      sound: "gain_tag",
      visibility: "public",
    });
    expect(
      actionSoundForActionType("resolve_choice", "public", {
        tagsAdded: 6,
      }),
    ).toBe("gain_tag");
    expect(corpTagCue?.title).toBe("Der Runner hat 6 Tags erhalten.");
    expect(cueHasHiddenLeak(runnerTagCue!)).toBe(false);
    expect(cueHasHiddenLeak(corpTagCue!)).toBe(false);

    const localizedCues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [tagEvent],
      translate: testTranslate({
        "actor.runner": "The Runner",
        "actor.game": "The game",
        "actor.you": "You",
        "side.runner": "Runner",
        "event.choiceResolved": "{subject}: resolved a choice.",
        "trace.resolvedWithTags":
          "Trace strength {traceValue} against Runner link {runnerStrength}: {outcome}; {tagOutcome}.",
        "trace.payments":
          "Bids: {corp} {corpBid} credits, {runner} {runnerBid} credits.",
        "trace.successful": "trace successful",
        "trace.tagsRunner": "the Runner gained {amount} tags",
        "trace.resolvedStatus":
          "Final result: trace {traceValue} against Runner strength {runnerStrength}.",
        "trace.label": "Trace",
        "trace.corpBidChip": "Corp {amount}",
        "trace.runnerBidChip": "Runner {amount}",
        "trace.resultChip": "{traceValue}:{runnerStrength}",
        "trace.resultWindowLabel": "Trace result",
        "effect.tagGainTitleRunner": "The Runner gained {amount} tags.",
        "effect.tagGainCurrentRunner": "The Runner now has {amount} tags",
        "effect.tagGainedChip": "Tag gained",
        "effect.tagsAddedChip": "+{amount} tags",
        "effect.tagsCurrentChip": "Now {amount} tags",
        "group.danger": "Danger",
      }),
    });
    const localizedTagCue = localizedCues.find((cue) =>
      cue.cueId.includes(":effect:"),
    );

    expect(localizedCues[0]).toMatchObject({
      title:
        "Trace strength 6 against Runner link 0: trace successful; the Runner gained 6 tags.",
      description:
        "Bids: You 3 credits, Runner 0 credits. Final result: trace 6 against Runner strength 0.",
      presentationKind: "trace_result",
      presentationLabel: "Trace result",
      iconBadge: "6:0",
    });
    expect(localizedTagCue).toMatchObject({
      cueId: `corp:${tagEvent.eventId}:effect:0`,
      title: "The Runner gained 6 tags.",
      description: "The Runner now has 6 tags.",
      iconBadge: "+6",
      sound: "gain_tag",
      visibility: "public",
    });
    expect(localizedTagCue?.title).not.toContain("erhalten");
  });

  it("forces a dedicated trace-result cue for the resolving side", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(119, "resolve_choice", {
          actor: "runner",
          traceRulesProfile: "classic_blind",
          traceBidsRevealed: true,
          traceStep: "runner_bid",
          corpBid: 2,
          traceValue: 2,
          runnerBid: 1,
          runnerStrength: 1,
          traceSuccessful: true,
          tagsAdded: 0,
          runnerRunEnded: true,
          runnerRunLockCreditCost: 1,
        }),
      ],
      translate: testTranslate({
        "actor.you": "You",
        "actor.game": "The game",
        "side.corp": "Corp",
        "side.runner": "Runner",
        "category.danger": "Danger",
        "group.turn": "Turn",
        "trace.resolved":
          "Trace strength {traceValue} against Runner link {runnerStrength}: {outcome}.",
        "trace.payments":
          "Bids: {corp} {corpBid} credits, {runner} {runnerBid} credits.",
        "trace.successful": "successful",
        "trace.resolvedStatusWithRunLock":
          "Final: {traceValue}:{runnerStrength}; run ended; lock {runLockCreditCost}.",
        "trace.label": "Trace",
        "trace.corpBidChip": "Corp {amount}",
        "trace.runnerBidChip": "Runner {amount}",
        "trace.resultChip": "{traceValue}:{runnerStrength}",
        "trace.runEndedChip": "Run ends",
        "trace.runLockChip": "Run lock {amount}",
        "trace.resultWindowLabel": "Trace result",
      }),
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({
      cueId: "runner:119",
      opponent: false,
      presentationKind: "trace_result",
      presentationLabel: "Trace result",
      iconBadge: "2:1",
      title: "Trace strength 2 against Runner link 1: successful.",
      description:
        "Bids: Corp 2 credits, You 1 credits. Final: 2:1; run ended; lock 1.",
    });
  });

  it.each(["runner", "corp"] as const)(
    "updates Hunter's trace window in place after Fall Guy for %s",
    (viewerSide) => {
      const trace = event(120, "resolve_choice", {
        actor: "runner",
        traceStep: "runner_bid",
        traceSuccessful: true,
        traceValue: 5,
        runnerStrength: 0,
        sourceDefinitionId: 461,
        tagsAdded: 0,
        eventModificationWindowOpened: true,
        imminentEventId: "hunter_tag",
        imminentEventType: "add_tag",
      });
      const unrelated = event(121, "resolve_choice", {
        actor: "runner",
        imminentEventType: "add_tag",
        imminentEventId: "unrelated_tag",
        eventModificationDecision: "apply",
        preventedTags: 1,
        sourceDefinitionId: 373,
        tagsAdded: 0,
      });
      const avoided = event(122, "resolve_choice", {
        ...unrelated.publicPayload,
        imminentEventId: "hunter_tag",
        eventModificationOutcome: "avoided",
      });
      const input = { viewerSide, playerView: view(viewerSide) };
      const [pending] = deriveOpponentActionCues({ ...input, events: [trace] });
      expect(pending).toMatchObject({
        presentationKind: "trace_result",
        iconBadge: "5:0",
        traceTagOutcome: { pending: true },
      });
      expect(JSON.stringify(pending)).not.toContain("fall-guy");
      expect(actionCueAfterAiAdvanceRequest(pending!)).toBe(pending);

      const updates = deriveOpponentActionCues({
        ...input,
        events: [trace, unrelated, avoided],
        lastPresentedEventId: unrelated.eventId,
      });
      expect(updates).toEqual([
        expect.objectContaining({
          cueId: pending!.cueId,
          eventId: trace.eventId,
          title: pending!.title,
          traceTagOutcome: {
            pending: false,
            tagsAdded: 0,
            preventedTags: 1,
            preventionCardIds: [373],
          },
        }),
      ]);
      expect(coalesceActionCues(pending!, [], updates)).toEqual({
        current: updates[0],
        queue: [],
      });
      expect(coalesceActionCues(null, [pending!], updates)).toEqual({
        current: null,
        queue: updates,
      });
      expect(
        deriveOpponentActionCues({ ...input, events: [trace, avoided] }),
      ).toEqual(updates);

      const passed = event(123, "resolve_choice", {
        actor: "runner",
        imminentEventId: "hunter_tag",
        imminentEventType: "add_tag",
        eventModificationDecision: "pass",
        eventModificationOutcome: "original_resolved",
        tagsAdded: 1,
      });
      expect(
        deriveOpponentActionCues({ ...input, events: [trace, passed] }),
      ).toEqual([
        expect.objectContaining({
          cueId: pending!.cueId,
          traceTagOutcome: {
            pending: false,
            tagsAdded: 1,
            preventedTags: 0,
            preventionCardIds: [],
          },
        }),
      ]);
    },
  );

  it("keeps a blind Corp bid hidden while marking it as a trace cue", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(124, "resolve_choice", {
          actor: "corp",
          traceRulesProfile: "classic_blind",
          traceBidsRevealed: false,
          traceBidCommittedSide: "corp",
          traceStep: "corp_bid",
          redactedKind: "choice",
        }),
      ],
      translate: testTranslate({
        "actor.corp": "The Corp",
        "category.danger": "Danger",
        "group.turn": "Turn",
        "trace.blindBidOther": "{subject} submitted a hidden trace bid.",
        "trace.label": "Trace",
        "trace.blindBidChip": "Hidden bid",
        "trace.bidWindowLabel": "Trace bid",
      }),
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({
      presentationKind: "trace_bid",
      presentationLabel: "Trace bid",
      title: "The Corp submitted a hidden trace bid.",
      visibility: "redacted",
    });
    expect(cues[0]).not.toHaveProperty("iconBadge");
    expect(cues[0]?.title).not.toMatch(/\b0\b/);
  });

  it("derives damage impact cues from public counts without leaking hidden source ids", () => {
    const cues = deriveDamageImpactCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(125, "resolve_choice", {
          damageResolved: true,
          damageType: "net",
          damageAmount: 2,
          cardsTrashed: 2,
          runnerGripBefore: 4,
          runnerGripAfter: 2,
          flatline: false,
          sourceDefinitionId: 9112,
          sourceTitle: "Hidden Trap",
        }),
      ],
    });

    expect(cues).toEqual([
      {
        cueId: "runner:125:damage-impact",
        eventId: 125,
        viewerSide: "runner",
        damageType: "net",
        amount: 2,
        cardsTrashed: 2,
        runnerGripBefore: 4,
        runnerGripAfter: 2,
        flatline: false,
        runnerMaxHandSizeAfter: 5,
        sourceLabel: "Korp-Effekt",
      },
    ]);
    expect(JSON.stringify(cues)).not.toContain(9112);
    expect(JSON.stringify(cues)).not.toContain("Hidden Trap");
    expect(
      damageAudioCueFromPublicPayload({
        damageResolved: true,
        damageType: "net",
        damageAmount: 2,
      }),
    ).toEqual({
      sound: "damage_net",
      soundCount: 2,
    });
  });

  it("marks flatline damage impact from side-safe public counts", () => {
    const cues = deriveDamageImpactCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [
        event(126, "play_operation", {
          actor: "corp",
          damageResolved: true,
          damageType: "meat",
          damageAmount: 4,
          cardsTrashed: 0,
          runnerGripBefore: 3,
          runnerGripAfter: 0,
          flatline: true,
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({
      damageType: "meat",
      amount: 4,
      runnerGripBefore: 3,
      runnerGripAfter: 0,
      flatline: true,
      runnerMaxHandSizeAfter: 5,
      sourceLabel: "Korp-Effekt",
    });
    expect(
      damageAudioCueFromPublicPayload({
        damageResolved: true,
        damageType: "meat",
        damageAmount: 4,
        flatline: true,
      }),
    ).toEqual({ sound: "flatline", soundCount: 1 });
  });

  it.each([
    ["net", "damage_net"],
    ["meat", "damage_meat"],
    ["core", "damage_core"],
  ] as const)(
    "maps public %s damage to its dedicated sound",
    (damageType, sound) => {
      expect(
        damageAudioCueFromPublicPayload({
          damageResolved: true,
          damageType,
          damageAmount: 9,
        }),
      ).toEqual({ sound, soundCount: 3 });
    },
  );

  it("does not guess a damage type from hidden or incomplete data", () => {
    expect(
      damageAudioCueFromPublicPayload({
        damageResolved: true,
        damageAmount: 2,
        sourceDefinitionId: 9113,
      }),
    ).toBeNull();
  });

  it("names a publicly revealed lethal access source in the damage window", () => {
    const cues = deriveDamageImpactCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(127, "access_card", {
          damageResolved: true,
          damageType: "net",
          damageAmount: 2,
          cardsTrashed: 0,
          runnerGripBefore: 1,
          runnerGripAfter: 0,
          flatline: true,
          publicRevealKind: "reveal",
          publicRevealDefinitionId: 62,
          cardDefinitionId: 62,
          title: "Fetal AI",
        }),
      ],
    });

    expect(cues[0]).toMatchObject({
      sourceLabel: "Fetal AI",
      damageType: "net",
      amount: 2,
      flatline: true,
    });
  });

  it("does not show zero damage as prevented unless damage was actually prevented", () => {
    const cues = deriveDamageImpactCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(128, "continue_run", {
          damageResolved: true,
          damageType: "net",
          damageAmount: 0,
          cardsTrashed: 0,
          flatline: false,
          sourceDefinitionId: 79,
        }),
        event(129, "resolve_choice", {
          damageResolved: true,
          damageType: "net",
          damageAmount: 0,
          cardsTrashed: 0,
          preventedAmount: 1,
          flatline: false,
        }),
      ],
    });

    expect(cues.map((cue) => cue.eventId)).toEqual([129]);
    expect(cues[0]).toMatchObject({
      damageType: "net",
      amount: 0,
      flatline: false,
    });
    expect(
      damageAudioCueFromPublicPayload({
        damageResolved: true,
        damageType: "net",
        damageAmount: 0,
      }),
    ).toBeNull();
  });

  it("falls back to public PlayerView max hand size for damage impact grip labels", () => {
    const cues = deriveDamageImpactCues({
      viewerSide: "corp",
      playerView: view("corp", {
        opponent: {
          ...view("corp").opponent,
          maxHandSize: 5,
        },
      }),
      events: [
        event(126, "play_operation", {
          damageResolved: true,
          damageType: "meat",
          damageAmount: 4,
          cardsTrashed: 0,
          runnerGripBefore: 2,
          runnerGripAfter: 0,
          flatline: true,
        }),
      ],
    });

    expect(cues[0]).toMatchObject({
      runnerGripBefore: 2,
      runnerGripAfter: 0,
      runnerMaxHandSizeAfter: 5,
    });
  });

  it("keeps reconnect damage impact cues behind the last presented event id", () => {
    const cues = deriveDamageImpactCues({
      viewerSide: "runner",
      playerView: view("runner"),
      lastPresentedEventId: 130,
      events: [
        event(130, "resolve_choice", {
          damageResolved: true,
          damageType: "net",
          damageAmount: 1,
          flatline: false,
        }),
        event(131, "resolve_choice", {
          damageResolved: true,
          damageType: "core",
          damageAmount: 1,
          runnerGripBefore: 5,
          runnerGripAfter: 4,
          coreDamageAfter: 1,
          runnerMaxHandSizeAfter: 4,
          flatline: false,
        }),
      ],
    });

    expect(cues.map((cue) => cue.eventId)).toEqual([131]);
    expect(cues[0]).toMatchObject({
      damageType: "core",
      coreDamageAfter: 1,
      runnerMaxHandSizeAfter: 4,
    });
  });

  it("adds related cards only when the card is visible to the viewer", () => {
    const innerIce = {
      instanceId: "ice_0",
      known: true,
      title: "Inner ICE",
      definitionId: 9114,
      type: "ice" as const,
    };
    const visibleIce = {
      instanceId: "ice_1",
      known: true,
      title: "Gate ICE",
      definitionId: 9116,
      type: "ice" as const,
    };
    const playerView = view("runner", {
      servers: [
        {
          id: "r1",
          label: "Remote 1",
          ice: [innerIce, visibleIce],
          root: [],
        },
      ],
    });

    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView,
      events: [
        event(132, "rez_ice", {
          actor: "corp",
          cardDefinitionId: 9116,
          title: "Gate ICE",
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.relatedCard).toEqual(visibleIce);
    expect(cues[0]?.relatedCardPositionBadge).toBe("2");
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("shows an opponent's played event from the public discard pile", () => {
    const panzerRun = {
      instanceId: "runner_panzer_run_1",
      known: true,
      title: "Panzer Run",
      definitionId: 46,
      type: "event" as const,
    };
    const playerView = view("corp", {
      opponent: {
        ...view("corp").opponent,
        discardCount: 1,
        discardCards: [panzerRun],
      },
    });

    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView,
      events: [
        event(133, "play_event", {
          actor: "runner",
          cardDefinitionId: 46,
          title: "Panzer Run",
          gainedCredits: 4,
          drawnCount: 2,
          aiReasonCode: "runner.event.economy",
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.relatedCard).toEqual(panzerRun);
    expect(cues[0]?.visibility).toBe("public");
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("does not create a duplicate cue for visible access reveals", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [
        event(134, "access_card", {
          actor: "runner",
          cardDefinitionId: 9117,
          title: "Public Agenda",
        }),
      ],
    });

    expect(cues).toHaveLength(0);
  });

  it("does not create duplicate outcome cues for a public access reveal", () => {
    const access = event(134, "access_card", {
      actor: "runner",
      cardDefinitionId: 552,
      title: "Setup!",
      serverLabel: "R&D",
    });
    const trash = event(135, "trash_accessed_card", {
      actor: "runner",
      cardDefinitionId: 552,
      title: "Setup!",
      serverLabel: "R&D",
    });
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [access, trash],
    });

    expect(cues).toEqual([]);
  });

  it("keeps a public trash cue after a redacted R&D access", () => {
    const access = event(134, "access_card", {
      actor: "runner",
      serverLabel: "R&D",
      redactedKind: "hidden_zone",
    });
    const trash = event(135, "trash_accessed_card", {
      actor: "runner",
      cardDefinitionId: 9118,
      title: "Public After Trash",
      serverLabel: "R&D",
    });
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [access, trash],
    });

    expect(cues.map((cue) => cue.eventId)).toEqual([134, 135]);
    expect(JSON.stringify(cues[0])).not.toContain("Public After Trash");
    expect(JSON.stringify(cues[0])).not.toContain(9118);
  });

  it("shows Technician Lover private look on use and suppresses the confirmation cue", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [
        event(136, "activated_card_ability", {
          actor: "runner",
          title: "Technician Lover",
          hiddenZoneBarrier: true,
          hiddenZoneAction: "p3_33_private_look",
          privateLookZone: "rd",
          privateLookCount: 1,
          sourceDefinitionId: 395,
          sourceTitle: "Technician Lover",
          aiReasonCode: "runner_private_look",
        }),
        event(137, "resolve_choice", {
          actor: "runner",
          hiddenZoneBarrier: true,
          hiddenZoneAction: "p3_33_private_look",
          privateLookZone: "rd",
          privateLookCount: 1,
          sourceDefinitionId: 395,
          sourceTitle: "Technician Lover",
          aiReasonCode: "runner_private_look",
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.eventId).toBe(136);
    expect(cues[0]?.title).toBe(
      "Die Runner-KI hat Technician Lover genutzt und die oberste R&D-Karte angesehen.",
    );
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("shows The Short Circuit program reveal in opponent action cues", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [
        event(138, "resolve_choice", {
          actor: "runner",
          hiddenZoneAction: "v1911_short_circuit_search",
          sourceDefinitionId: 389,
          publicRevealDefinitionId: 591,
          cardDefinitionId: 591,
          searchDestination: "runner_grip",
          shuffled: true,
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.title).toBe(
      "Der Runner hat The Short Circuit genutzt, Simple Decoder der Korp gezeigt und in die Hand genommen.",
    );
    expect(cues[0]?.description).toBe("Der Stack wurde danach gemischt.");
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("shows Corporate Negotiating Center reveal cues with gained credits", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      includeOwnActions: true,
      events: [
        event(139, "resolve_choice", {
          actor: "corp",
          hiddenZoneBarrier: true,
          hiddenZoneAction:
            "v1917_corporate_negotiating_center_hq_agenda_reveal",
          sourceDefinitionId: 526,
          sourceTitle: "Corporate Negotiating Center",
          publicRevealKind: "reveal",
          publicRevealDefinitionIds:
            "588,415",
          publicRevealTitles: "Simple Agenda||Hostile Takeover",
          revealedAgendaDefinitionIds:
            "588,415",
          revealedCount: 2,
          gainedCredits: 2,
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.title).toBe(
      "Du hast 2 Agenden aus HQ durch Corporate Negotiating Center vorgezeigt und 2 Credits erhalten.",
    );
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("shows current Corporate Negotiating Center reveal cues with gained credits", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(139, "resolve_choice", {
          actor: "corp",
          hiddenZoneBarrier: true,
          hiddenZoneAction: "corp_hq_agenda_reveal",
          sourceDefinitionId: 526,
          sourceTitle: "Corporate Negotiating Center",
          publicRevealKind: "reveal",
          publicRevealDefinitionIds: 588,
          publicRevealTitles: "Simple Agenda",
          revealedAgendaDefinitionIds: 588,
          revealedCount: 1,
          gainedCredits: 1,
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.title).toBe(
      "Die Korp hat eine Agenda aus HQ durch Corporate Negotiating Center vorgezeigt und 1 Credit erhalten.",
    );
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("shows Corporate Negotiating Center no-agenda cues explicitly", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(140, "resolve_choice", {
          actor: "corp",
          hiddenZoneBarrier: true,
          hiddenZoneAction: "corp_hq_agenda_reveal",
          sourceDefinitionId: 526,
          sourceTitle: "Corporate Negotiating Center",
          publicRevealKind: "reveal",
          publicRevealDefinitionIds: "",
          publicRevealTitles: "",
          revealedAgendaDefinitionIds: "",
          revealedCount: 0,
          gainedCredits: 0,
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.title).toBe(
      "Die Korp hat keine Agenda aus HQ durch Corporate Negotiating Center vorgezeigt.",
    );
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("shows the Corporate Downsizing zero selection in an AI action cue", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(141, "resolve_choice", {
          actor: "corp",
          aiReasonCode: "corp.score_agenda",
          hiddenZoneBarrier: true,
          hiddenZoneAction: "scored_agenda_hq_agenda_shuffle_credits",
          sourceDefinitionId: 406,
          sourceTitle: "Corporate Downsizing",
          publicRevealKind: "reveal",
          publicRevealDefinitionIds: "",
          publicRevealTitles: "",
          shownCardDefinitionIds: "",
          shownCount: 0,
          shuffledIntoRndCount: 0,
          combinedAgendaPoints: 0,
          gainedCredits: 0,
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.title).toBe(
      "Die Korp-KI hat mit Corporate Downsizing keine Agenda aus HQ vorgezeigt, keine Karte in R&D gemischt und 0 Credits erhalten.",
    );
    expect(cues[0]?.description).toBe(
      "Kombinierte Agendapunkte: 0 Agendapunkte.",
    );
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("shows public Corporate Downsizing agenda titles in human Corp action cues", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(142, "resolve_choice", {
          actor: "corp",
          hiddenZoneBarrier: true,
          hiddenZoneAction: "scored_agenda_hq_agenda_shuffle_credits",
          sourceDefinitionId: 406,
          sourceTitle: "Corporate Downsizing",
          publicRevealKind: "reveal",
          publicRevealDefinitionIds:
            "588,415",
          publicRevealTitles: "Simple Agenda||Hostile Takeover",
          shownCardDefinitionIds: "588,415",
          shownCount: 2,
          shuffledIntoRndCount: 2,
          combinedAgendaPoints: 5,
          gainedCredits: 10,
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.title).toBe(
      "Die Korp hat 2 Agenden aus HQ mit Corporate Downsizing vorgezeigt, 2 Karten in R&D gemischt und 10 Credits erhalten.",
    );
    expect(cues[0]?.description).toBe(
      "Gezeigt: Simple Agenda und Hostile Takeover. Kombinierte Agendapunkte: 5 Agendapunkte.",
    );
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("keeps automatic system cues behind the local option", () => {
    const systemEvent = event(143, "gain_credit", { amount: 2 });

    expect(
      deriveOpponentActionCues({
        viewerSide: "runner",
        playerView: view("runner"),
        events: [systemEvent],
      }),
    ).toHaveLength(0);

    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [systemEvent],
      includeAutomaticEffectCues: true,
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.source).toBe("system");
    expect(cues[0]?.actorLabel).toBe("Spiel");
    expect(cues[0]?.opponent).toBe(false);
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("skips old reconnect events and does not show a pure turn-handoff cue", () => {
    const playerView = view("runner", {
      activeSide: "runner",
      legalActions: [legalAction("runner", "start_run")],
    });
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView,
      lastPresentedEventId: 130,
      events: [
        event(130, "gain_credit", { actor: "corp", amount: 1 }),
        event(131, "end_turn", { actor: "corp" }),
      ],
    });

    expect(cues).toHaveLength(0);
    expect(actionSoundForActionType("end_turn", "public")).toBeUndefined();
  });

  it("derives one side-specific turn-start cue only for live side changes", () => {
    const previous = {
      matchId: "match_1",
      stateVersion: 8,
      activeSide: "corp" as const,
      phase: "corp_action_phase" as const,
    };

    expect(
      turnStartAudioCue(
        {
          matchId: "match_1",
          stateVersion: 9,
          activeSide: "runner",
          phase: "runner_action_phase",
        },
        previous,
      ),
    ).toEqual({
      key: "match_1:9:runner",
      side: "runner",
      sound: "runner_turn",
    });

    expect(
      turnStartAudioCue(
        {
          matchId: "match_1",
          stateVersion: 9,
          activeSide: "corp",
          phase: "corp_draw_phase",
        },
        { ...previous, phase: "setup" },
      ),
    ).toEqual({ key: "match_1:9:corp", side: "corp", sound: "corp_turn" });

    expect(
      turnStartAudioCue(
        {
          matchId: "match_1",
          stateVersion: 10,
          activeSide: "corp",
          phase: "corp_action_phase",
        },
        {
          matchId: "match_1",
          stateVersion: 9,
          activeSide: "corp",
          phase: "corp_draw_phase",
        },
      ),
    ).toBeNull();

    expect(
      turnStartAudioCue(
        {
          matchId: "match_1",
          stateVersion: 10,
          activeSide: "runner",
          phase: "runner_action_phase",
        },
        { ...previous, activeSide: "runner", phase: "runner_action_phase" },
      ),
    ).toBeNull();

    expect(
      turnStartAudioCue(
        {
          matchId: "match_2",
          stateVersion: 1,
          activeSide: "corp",
          phase: "corp_action_phase",
        },
        previous,
      ),
    ).toBeNull();
  });

  it("does not cue non-action setup transitions as turn starts", () => {
    expect(
      turnStartAudioCue(
        {
          matchId: "match_1",
          stateVersion: 3,
          activeSide: "runner",
          phase: "setup",
        },
        {
          matchId: "match_1",
          stateVersion: 2,
          activeSide: "corp",
          phase: "setup",
        },
      ),
    ).toBeNull();
  });

  it("keeps opponent actions informational when local play can continue", () => {
    const playerView = view("runner", {
      activeSide: "runner",
      legalActions: [legalAction("runner", "start_run")],
    });
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView,
      events: [
        event(144, "gain_credit", { actor: "corp", amount: 1 }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.eventId).toBe(144);
    expect(cues[0]).not.toHaveProperty("requiresLocalAttention");
  });

  it("keeps a Corp end-of-turn discard informational after the Runner becomes active", () => {
    const playerView = view("runner", {
      activeSide: "runner",
      legalActions: [legalAction("runner", "start_run")],
    });
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView,
      events: [
        event(145, "resolve_choice", {
          actor: "corp",
          discardResolved: true,
          discardCount: 1,
          discardZone: "archives",
          hiddenZoneAction: "discard_phase",
        }),
      ],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({
      eventId: 145,
      actionType: "resolve_choice",
      title: "Die Korp hat eine Karte abgeworfen.",
    });
    expect(cues[0]).not.toHaveProperty("requiresLocalAttention");
  });

  it("keeps card draw audio generic and repeats only for visible draw amount", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [event(146, "draw_card", { actor: "runner", amount: 3 })],
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.sound).toBe("draw");
    expect(cues[0]?.soundCount).toBe(3);
    expect(actionSoundCountForAction("draw_card", { amount: 12 })).toBe(5);
    expect(actionSoundCountForAction("mandatory_draw", {})).toBe(1);
    expect(actionSoundCountForAction("gain_credit", { amount: 3 })).toBe(1);
  });

  it("covers non-card system sounds without leaking hidden details", () => {
    expect(actionSoundForActionType("resolve_choice", "public")).toBe("choice");
    expect(actionSoundForActionType("purge_virus_counters", "public")).toBe(
      "trash",
    );
    expect(actionSoundForActionType("game_end", "public")).toBe("game_end");
    expect(actionSoundForActionType("install_card", "redacted")).toBe(
      "install_hidden",
    );
    expect(actionSoundForActionType("start_run", "public")).toBe("run_start");
    expect(actionSoundForActionType("continue_run", "public")).toBe("run");
    expect(actionSoundForActionType("rez_ice", "public")).toBe("ice_rez");
    expect(actionSoundForActionType("score_agenda", "public")).toBe(
      "agenda_corp",
    );
    expect(actionSoundForActionType("steal_agenda", "public")).toBe(
      "agenda_runner",
    );
  });

  it("numbers opponent paid actions from the public turn sequence, including extra actions", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event(2, "gain_credit", {
          actor: "corp",
          actionCostClicks: 1,
          turnActionOrdinalStart: 1,
          turnActionOrdinalEnd: 1,
        }),
        event(3, "play_operation", {
          actor: "corp",
          actionCostClicks: 1,
          turnActionOrdinalStart: 2,
          turnActionOrdinalEnd: 2,
        }),
        event(4, "install_card", {
          actor: "corp",
          actionCostClicks: 1,
          turnActionOrdinalStart: 3,
          turnActionOrdinalEnd: 3,
          serverId: "r1",
          serverLabel: "Remote 1",
          zoneLabel: "Root",
        }),
        event(5, "gain_credit", {
          actor: "corp",
          actionCostClicks: 1,
          turnActionOrdinalStart: 1,
          turnActionOrdinalEnd: 1,
        }),
        event(6, "gain_credit", {
          actor: "corp",
          actionCostClicks: 1,
          turnActionOrdinalStart: 1,
          turnActionOrdinalEnd: 1,
        }),
        event(7, "draw_card", {
          actor: "corp",
          actionCostClicks: 1,
          turnActionOrdinalStart: 6,
          turnActionOrdinalEnd: 6,
        }),
        event(8, "gain_credit", {
          actor: "corp",
          actionCostClicks: 1,
          turnActionOrdinalStart: 7,
          turnActionOrdinalEnd: 7,
        }),
      ],
    });

    expect(cues.map((cue) => cue.actionUse?.label)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
    ]);
    expect(cues[6]?.actionUse?.title).toBe("7. Aktion in diesem Zug");
  });

  it("shares the chronicle range and leaves the resulting effect unnumbered", () => {
    const events = [
      event(147, "play_operation", {
        actor: "corp",
        actionCostClicks: 2,
        turnActionOrdinalStart: 3,
        turnActionOrdinalEnd: 4,
        resolvedEffects: [
          {
            effectId: 0,
            kind: "damage",
            visibility: "hidden_info_barrier",
            side: "runner",
            damageType: "net",
            amount: 1,
            cardsTrashed: 1,
            reason: "access_effect",
            sourceDefinitionId: 9119,
            sourceTitle: "Simple Damage Source",
          },
        ],
      }),
      event(148, "mandatory_draw", { actor: "corp" }),
    ];
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events,
    });
    const chronicleUses = chronicleActionUseByEventId(events);

    expect(cues).toHaveLength(3);
    expect(cues[0]?.actionUse).toEqual(chronicleUses[events[0]!.eventId]);
    expect(cues[0]?.actionUse?.label).toBe("3-4");
    expect(cues.slice(1).map((cue) => cue.actionUse)).toEqual([
      undefined,
      undefined,
    ]);
  });

  it("does not replay an older event tail when undo removes the last presented event", () => {
    const events = [
      event(38, "start_run", {
        actor: "runner",
        aiExplanation: "Alter Runner-Run.",
      }),
      event(39, "access_card", {
        actor: "runner",
        aiExplanation: "Alter Zugriff.",
      }),
      event(42, "install_card", {
        actor: "corp",
        label: "Korp installiert eine Karte.",
      }),
    ];

    expect(eventsAfter(events, 43)).toEqual([]);
    expect(
      deriveOpponentActionCues({
        viewerSide: "corp",
        playerView: view("corp"),
        events,
        lastPresentedEventId: 43,
      }),
    ).toEqual([]);
  });
});

function testTranslate(messages: Record<string, string>): ChronicleTranslate {
  return (key, values = {}) =>
    (messages[key] ?? key).replace(/\{(\w+)\}/g, (_match, name: string) =>
      String(values[name] ?? `{${name}}`),
    );
}

function event(
  eventId: number,
  actionType: string,
  payload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: "fnv1a:test",
    publicPayload: {
      actionType,
      label: actionType,
      ...payload,
    },
  };
}

function legalAction(
  side: Side,
  type: string,
): PlayerView["legalActions"][number] {
  return {
    actionId: `${side}.${type}`,
    side,
    type: type as PlayerView["legalActions"][number]["type"],
    label: type,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function view(side: Side, overrides: Partial<PlayerView> = {}): PlayerView {
  return {
    side,
    stateVersion: 1,
    timingPoint: "runner_action.main",
    activeSide: "corp",
    phase: "corp_action_phase",
    own: {
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      identity: {
        instanceId: `${side}_identity`,
        known: true,
        title: side === "corp" ? "Korp Identity" : "Runner Identity",
        definitionId: side === "corp" ? 3 : 587,
        type: "identity",
      },
      gripOrHq: [],
      stackOrRdCount: 5,
      heapOrArchives: [],
      scoreArea: [],
      rig: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 4,
      maxHandSize: 5,
      deckCount: 5,
      discardCount: 0,
      identity: {
        instanceId: `${side === "corp" ? "runner" : "corp"}_identity`,
        known: true,
        title: side === "corp" ? "Runner Identity" : "Korp Identity",
        definitionId: side === "corp" ? 587 : 3,
        type: "identity",
      },
      scoreArea: [],
      rig: [],
    },
    servers: [],
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
    ...overrides,
  };
}
