import { describe, expect, it } from "vitest";
import {
  aiDecisionDebugDeckStrategySummary,
  aiDecisionDebugHqHandRows,
} from "./ai-decision-debug-ui";

describe("aiDecisionDebugDeckStrategySummary", () => {
  it("formats redacted strategic runtime deck analysis for the AI overlay", () => {
    const summary = aiDecisionDebugDeckStrategySummary({
      detailSections: [
        {
          id: "strategic_runtime",
          title: "Strategic Runtime",
          items: [
            "deck_strategy_profile:ai_internal_strategy_profile",
            "deck_strategy_side:runner",
            "deck_strategy_card_count:45",
            "deck_strategy_primary_count:1",
            "deck_strategy_secondary_count:1",
            "deck_strategy_primary:runner.rnd_pressure:72:high:productive",
            "deck_strategy_secondary:runner.remote_contest:51:medium:productive",
            "deck_strategy_warning:missing_compiled_hint:runner_x",
            "strategic_intent_state:runner.rnd_pressure",
            "strategic_intent_family:runner_central_pressure",
            "strategic_intent_phase:pressure",
            "strategic_intent_target:central",
            "strategic_intent_target_id:rd",
            "strategic_intent_reserve:credits:4:6:true",
            "strategic_intent_transition:continued",
            "strategic_intent_completeness:complete",
            "strategic_intent_blocker:support_gap:soft",
          ],
        },
      ],
    });

    expect(summary.rows).toContainEqual([
      "Deckprofil",
      "KI-internes Strategieprofil",
    ]);
    expect(summary.rows).toContainEqual(["Deckbasis", "Runner · 45 Karten"]);
    expect(summary.rows).toContainEqual([
      "Primäre Strategie",
      "R&D-Druck (runner.rnd_pressure) · Score 72 · hohe Sicherheit · produktiv nutzbar",
    ]);
    expect(summary.rows).toContainEqual([
      "Sekundäre Strategien",
      "Remote contesten (runner.remote_contest) · Score 51 · mittlere Sicherheit · produktiv nutzbar",
    ]);
    expect(summary.rows).toContainEqual([
      "Aktuelle Linie",
      "R&D-Druck (runner.rnd_pressure)",
    ]);
    expect(summary.rows).toContainEqual(["Ziel", "Zentralserver · R&D"]);
    expect(summary.rows).toContainEqual([
      "Reserve",
      "4 Credits benötigt · 6 verfügbar · erfüllt",
    ]);
    expect(summary.blockers).toEqual(["Support-Lücke · weich"]);
    expect(summary.warnings).toEqual(["missing compiled hint:runner x"]);
    expect(JSON.stringify(summary)).not.toMatch(
      /cardInstances|privatePayload|FullState|sessionToken|reconnectToken|joinToken|decklist|hidden-card/i,
    );
  });

  it("reports neutral strategy when no productive deck strategy is available", () => {
    const summary = aiDecisionDebugDeckStrategySummary({
      detailSections: [
        {
          id: "strategic_runtime",
          items: [
            "deck_strategy_profile:ai_internal_strategy_profile",
            "deck_strategy_primary_count:0",
            "deck_strategy_secondary_count:0",
            "strategic_intent_state:runner.neutral",
          ],
        },
      ],
    });

    expect(summary.rows).toContainEqual([
      "Primäre Strategie",
      "neutral / keine produktive Primärstrategie",
    ]);
    expect(summary.rows).toContainEqual(["Sekundäre Strategien", "keine"]);
    expect(summary.rows).toContainEqual([
      "Aktuelle Linie",
      "Neutrale Runner-Linie (runner.neutral)",
    ]);
  });
});

describe("aiDecisionDebugHqHandRows", () => {
  it("formats safe, ambiguous and unknown HQ hand memory from redacted ledger summary", () => {
    const rows = aiDecisionDebugHqHandRows({
      handCount: 4,
      knownCount: 2,
      allCardsKnown: false,
      safeKnownCards: [
        {
          definitionId: "simple_economy_operation",
          title: "Simple Economy Operation",
          type: "operation",
          count: 2,
        },
      ],
      summary: {
        safeKnownCount: 2,
        ambiguousCount: 1,
        unknownCount: 1,
        candidateGroupCount: 1,
      },
      candidateGroups: [
        {
          category: "hidden_root_install",
          serverId: "remote_1",
          ambiguousCount: 1,
          unknownCandidateCount: 0,
          departureCount: 1,
        },
      ],
    });

    expect(rows).toContainEqual([
      "HQ-Hand-Wissen",
      "2 sicher bekannt / 1 unklar / 1 unbekannt · teilweise",
    ]);
    expect(rows).toContainEqual([
      "HQ-Hand-Inhalt",
      "Simple Economy Operation x2 (operation) · 1 unklar · 1 unbekannt",
    ]);
    expect(rows).toContainEqual([
      "HQ-Hand-Kandidaten",
      "Remote 1: Root-Install-Kandidaten · 1 unklar · 1 abgegangen",
    ]);
    expect(JSON.stringify(rows)).not.toMatch(
      /cardInstances|privatePayload|FullState|sessionToken|reconnectToken|joinToken|decklist|hidden-card/i,
    );
  });

  it("keeps the old known-count display when the ledger summary is missing", () => {
    const rows = aiDecisionDebugHqHandRows({
      handCount: 3,
      knownCount: 1,
      allCardsKnown: false,
      knownCards: [
        {
          definitionId: "simple_agenda",
          title: "Simple Agenda",
          type: "agenda",
          count: 1,
        },
      ],
    });

    expect(rows).toEqual([
      ["HQ-Hand-Wissen", "1/3 Karten namentlich bekannt · teilweise"],
      ["HQ-Hand-Inhalt", "Simple Agenda (agenda) · 2 unbekannt"],
    ]);
  });
});
