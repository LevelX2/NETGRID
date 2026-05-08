"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { applyTutorialAction, createTutorialSession, getTutorialGlossary, listTutorialScenarios, tutorialAiSparringSuggestion, type TutorialAiSparringSuggestion, type TutorialSession } from "../tutorial";

const SCENARIOS = listTutorialScenarios();
const GLOSSARY = getTutorialGlossary();

export default function TutorialPage() {
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0]?.scenarioId ?? "");
  const [session, setSession] = useState<TutorialSession | null>(() => (SCENARIOS[0] ? createTutorialSession(SCENARIOS[0].scenarioId) : null));
  const [aiSuggestion, setAiSuggestion] = useState<TutorialAiSparringSuggestion | null>(null);
  const [error, setError] = useState<string>("");

  const scenario = useMemo(() => SCENARIOS.find((entry) => entry.scenarioId === scenarioId), [scenarioId]);
  const currentStep = session && scenario ? scenario.steps[session.stepIndex] ?? scenario.steps[scenario.steps.length - 1] : undefined;

  const loadScenario = (nextScenarioId: string) => {
    setScenarioId(nextScenarioId);
    setAiSuggestion(null);
    setError("");
    try {
      setSession(createTutorialSession(nextScenarioId));
    } catch (nextError) {
      setSession(null);
      setError(nextError instanceof Error ? nextError.message : "Tutorial konnte nicht geladen werden.");
    }
  };

  const runAction = (actionId: string) => {
    if (!session) return;
    setError("");
    setAiSuggestion(null);
    try {
      setSession(applyTutorialAction(session, actionId));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Die Aktion konnte nicht ausgeführt werden.");
    }
  };

  const showAiSparring = () => {
    if (!session) return;
    setAiSuggestion(tutorialAiSparringSuggestion(session) ?? null);
  };

  return (
    <main style={{ margin: "0 auto", maxWidth: 1100, padding: "1.25rem", display: "grid", gap: "1rem" }}>
      <header style={{ display: "grid", gap: "0.35rem" }}>
        <h1 style={{ margin: 0 }}>Tutorial und Regelhilfe</h1>
        <p style={{ margin: 0, opacity: 0.82 }}>
          Separater Tutorialmodus ({session?.mode ?? "tutorial_local"}) mit LegalAction-basierten Hinweisen und replaybarer StateHash-Prüfung.
        </p>
      </header>

      <section style={{ display: "grid", gap: "0.6rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          Lektion
          <select value={scenarioId} onChange={(event) => loadScenario(event.target.value)}>
            {SCENARIOS.map((entry) => (
              <option key={entry.scenarioId} value={entry.scenarioId}>
                {entry.title}
              </option>
            ))}
          </select>
        </label>
        {error ? <p style={{ margin: 0, color: "#b42318" }}>{error}</p> : null}
      </section>

      {session && scenario && currentStep ? (
        <section style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <h2 style={{ margin: 0 }}>{scenario.title}</h2>
            <p style={{ margin: 0 }}>
              Schritt {session.stepIndex + 1} von {scenario.steps.length} · Timing: <code>{session.state.timingPoint}</code>
            </p>
            <p style={{ margin: 0 }}>{session.hint.text}</p>
            <p style={{ margin: 0 }}>
              Replay/StateHash: <code>{session.replayCheck.ok ? "ok" : "prüfen"}</code> · <code>{session.replayCheck.finalStateHash}</code>
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {session.legalActions.map((action) => (
              <button key={action.actionId} type="button" onClick={() => runAction(action.actionId)} title={action.label}>
                {action.label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gap: "0.35rem" }}>
            <button type="button" onClick={showAiSparring}>
              KI-Sparring-Vorschlag anzeigen
            </button>
            {aiSuggestion ? (
              <p style={{ margin: 0 }}>
                {aiSuggestion.side === "runner" ? "Runner" : "Korp"}: <code>{aiSuggestion.label}</code> ({aiSuggestion.explanation})
              </p>
            ) : null}
          </div>

          <details>
            <summary>Schritt- und Scope-Details</summary>
            <pre style={pre}>{JSON.stringify({ currentStep, allowedMechanics: scenario.allowedMechanics, deckSnapshotRefs: scenario.deckSnapshotRefs }, null, 2)}</pre>
          </details>
        </section>
      ) : null}

      <section style={{ display: "grid", gap: "0.45rem" }}>
        <h2 style={{ margin: 0 }}>Glossar</h2>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          {GLOSSARY.map((entry) => (
            <li key={entry.term}>
              <strong>{entry.term}:</strong> {entry.definition}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

const pre: CSSProperties = {
  margin: 0,
  overflowX: "auto",
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  padding: "0.5rem",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "0.82rem"
};
