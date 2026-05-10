import { describe, expect, it } from "vitest";
import { createTutorialSession, getTutorialGlossary, listTutorialScenarios, tutorialAiSparringSuggestion } from "./tutorial";

describe("V1.6.0 tutorial and rule-help", () => {
  it("provides a separated tutorial scenario catalog for core lessons", () => {
    const scenarios = listTutorialScenarios();
    expect(scenarios.length).toBeGreaterThanOrEqual(8);
    expect(scenarios.map((entry) => entry.scenarioId)).toEqual(
      expect.arrayContaining([
        "v160_setup_mulligan",
        "v160_clicks_credits_draw",
        "v160_run_basics",
        "v160_encounter_breaker",
        "v160_access_basics",
        "v160_score_basics",
        "v160_game_end_basics",
        "v160_damage_flatline"
      ])
    );
  });

  it("creates replay-checkable tutorial sessions with legal-action based hints", () => {
    for (const scenario of listTutorialScenarios()) {
      const session = createTutorialSession(scenario.scenarioId);
      expect(session.mode).toBe("tutorial_local");
      expect(session.legalActions.length).toBeGreaterThan(0);
      expect(session.hint.legalActionIds.length).toBeGreaterThan(0);
      const legalIds = new Set(session.legalActions.map((action) => action.actionId));
      expect(session.hint.legalActionIds.every((actionId) => legalIds.has(actionId))).toBe(true);
      expect(session.replayCheck.ok).toBe(true);
      expect(session.replayCheck.finalStateHash).toMatch(/^fnv1a:/);
    }
  });

  it("keeps AI sparring suggestions on existing legal actions", () => {
    const session = createTutorialSession("v160_run_basics");
    const suggestion = tutorialAiSparringSuggestion(session);
    if (!suggestion) {
      expect(session.legalActions.length).toBe(0);
      return;
    }
    expect(session.legalActions.some((action) => action.actionId === suggestion.actionId)).toBe(true);
  });

  it("exposes a project-internal glossary with required terms", () => {
    const glossary = getTutorialGlossary();
    const terms = new Set(glossary.map((entry) => entry.term));
    for (const term of ["Korp", "Runner", "Klick", "Credit", "HQ", "F&E (R&D)", "Archive", "Fort", "Run", "Begegnung", "Zugriff", "Agenda", "Tag", "Schaden", "LegalAction"]) {
      expect(terms.has(term)).toBe(true);
    }
  });
});
