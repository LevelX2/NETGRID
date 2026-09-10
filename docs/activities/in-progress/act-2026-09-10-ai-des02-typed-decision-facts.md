---
activityId: act-2026-09-10-ai-des02-typed-decision-facts
status: in_progress
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-09-10
startedAt: 2026-09-10
branch: codex/ai-des02-typed-decision-facts
owner: 01a08be8-5094-7bd2-986b-f072d5073e01
resultArtifacts: []
checks: []
---

# DES-02: Typisierte Entscheidungsdaten statt Evidence-Protokoll

## Ziel und Auftrag

Genau DES-02 des Designreviews vom 10.09.2026 im eigenen Worktree umsetzen.
Die vorhandenen Runner-Access- sowie Corp-Schutz-/Score-Owner liefern ihre
steuerungswirksamen Fakten typisiert; Erklärungstexte steuern diese Pfade nicht.

## Scope

- Runner: bekannte Zielidentitäten und Trash-Budget vom erzeugenden
  Access-Payoff über die Runbewertung bis zum gebundenen Access-Commitment.
- Corp: Schutzreifebedarf und exakter Same-Turn-Score-Conversion-Nachweis
  vom Score-Owner bis zu Schutzunterstützung und Projektvergleich.
- Explizite Unknown-/Nichtanwendbarkeitszustände; fehlende notwendige Fakten
  dürfen nicht aus Diagnosetext oder einem Ersatzbudget rekonstruiert werden.
- Fokussierte Regressionen für Datenfluss und unveränderte Owner-/Actionbindung,
  einschließlich Unabhängigkeit von erklärenden Evidence-Texten.
- Aktuellen Vertrag knapp im passenden Architekturartefakt festhalten.

## Nicht im Scope

DES-01 und DES-03 bis DES-07, allgemeine Evidence-Schemata, neue Heuristiken,
Gewichte, Spielstärketuning, Owner-/Ordnerumbau, Legacy-Migrationen und Remote-Git.

## Akzeptanzkriterien

- [ ] Die genannten Consumer lesen keine Zahlen oder fachlichen Zustände mehr
  aus Evidence-Präfixen; die verantwortlichen Erzeuger liefern die Daten.
- [ ] Erklärende Textänderungen verändern weder Budget, Zulassung noch Rangfolge.
- [ ] Known-/Unknown-Gegenfälle und aktuelle Plan-/Actionbindungen sind geprüft.
- [ ] AI-Typecheck, passende thematische Tests und betroffene Strukturgates sind grün.
- [ ] Paketcommit, lokale Integration und geprüftes Worktree-Cleanup nach Skill.

## Quellen

- Review: `C:/Users/Lui/Downloads/netgrid-ai-design-review-2026-09-10.md`, DES-02.
- `packages/ai/AGENTS.md`, `docs/architecture/ai/change-compass.md`.
- `docs/architecture/ai/planning-architecture.md` und `turn-campaign-planner.md`.

## Ergebnisnotiz

In Arbeit. Aktiver Agent: `agents/release-implementation-agent.md`.
