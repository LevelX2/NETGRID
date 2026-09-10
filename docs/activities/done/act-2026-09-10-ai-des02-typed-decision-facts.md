---
activityId: act-2026-09-10-ai-des02-typed-decision-facts
status: done
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-09-10
startedAt: 2026-09-10
completedAt: 2026-09-10
branch: codex/ai-des02-typed-decision-facts
owner: 01a08be8-5094-7bd2-986b-f072d5073e01
resultArtifacts:
  - packages/ai/src/access/runner-access-facts.ts
  - packages/ai/src/runtime/typed-decision-facts.test.ts
  - docs/architecture/ai/planning-architecture.md
checks:
  - "AI-Typecheck: grün"
  - "check:ai: Hint-Metadaten, Struktur, Reachability und Karten-ID-Guards grün"
  - "9 fokussierte Testdateien: 682 Tests grün"
  - "AI-Shards: 5371 grün, zunächst 10 Fehler; sechs Fixture-Vertragslücken im abschließenden fokussierten Lauf behoben, vier unabhängige Main-Baseline-Fehler bestätigt"
  - "git diff --cached --check: grün"
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

- [x] Die genannten Consumer lesen keine Zahlen oder fachlichen Zustände mehr
  aus Evidence-Präfixen; die verantwortlichen Erzeuger liefern die Daten.
- [x] Erklärende Textänderungen verändern weder Budget, Zulassung noch Rangfolge.
- [x] Known-/Unknown-Gegenfälle und aktuelle Plan-/Actionbindungen sind geprüft.
- [x] AI-Typecheck, passende thematische Tests und betroffene Strukturgates sind grün.
- Paketcommit, lokale Integration und geprüftes Worktree-Cleanup folgen nach Skill.

## Quellen

- Review: `C:/Users/Lui/Downloads/netgrid-ai-design-review-2026-09-10.md`, DES-02.
- `packages/ai/AGENTS.md`, `docs/architecture/ai/change-compass.md`.
- `docs/architecture/ai/planning-architecture.md` und `turn-campaign-planner.md`.

## Ergebnisnotiz

Umgesetzt ausschließlich DES-02. Die bestehenden Access-Payoff-Erzeuger
liefern bekannte Zieldefinitionen und allgemeine Trash-Credits vollständig
über die Runbewertung. `unknown`, `not_applicable` und bekannte Nullbudgets
bleiben getrennt; erforderliche fehlende Fakten scheitern strukturiert.
Auch die bislang durch Evidence-Kürzung verlorenen Fakten bleiben erhalten.
Score veröffentlicht typisierte Routenbewertungen und den positiven Nachweis
einer Engine-gequoteten Same-Turn-Konversion. Die betroffenen Schutz- und
Projektconsumer lesen keine Erklärungstexte mehr; Routenkompatibilität erhält
insbesondere unterschiedliche Choice-Bindungen.

Tests variieren Texte bis hin zu leeren und widersprüchlichen Diagnosen,
prüfen HQ-/R&D-/Remote-Fakten, zweckgebundene Trash-Mittel, Unknown-/Fehlerfälle
und die Übergabe von Pressure-Parent zu Access-Executor. Die finalen neun
Testdateien bestehen mit 682 Tests. Die Pflichtfelder wurden in den konkreten
betroffenen Fixtures ergänzt, ohne die produktive Validierung abzuschwächen.

Der gesamte Lauf mit drei festen AI-Shards endete nach 534,9 Sekunden mit
5371 bestandenen und zehn fehlgeschlagenen Tests. Sechs davon waren die
inzwischen korrigierten Remote-Fixtures; deren vollständige Datei ist im
abschließenden 682er-Lauf grün. Vier unabhängige Fehler wurden auf dem sauberen
Main `5e53c5963` (nur Claim gegenüber Prüfcommit `815eea3a8`) identisch reproduziert:

- `decision/module-boundaries.test.ts`: bestehender Import von
  `runtime/runner-access-trash-impact` in `decision/known-remote-access-commitment`.
- `semantic-ai-runtime-cutover-runner-safety.test.ts`: Crybaby-Trash statt Decline.
- `match-5285-runner-harmful-non-etr-break-decision-checkpoints.test.ts`: bestehende RunTarget-Erwartung.
- `match-mrgsg-decision-checkpoints.test.ts`: bestehende RunTarget-Erwartung bei offenem R&D.

Diese Fehler wurden nicht in DES-02 gezogen. Ein erneuter vollständiger Lauf
nach den letzten eng begrenzten Anpassungen ist nicht erfolgt; die direkt
betroffenen Pfade, der endgültige AI-Typecheck und die Strukturgates sind
erneut grün. Kein Web-/Serverstart, kein E2E-/Workspace-Build und kein
Spielstärkenbenchmark: Engine, UI, Hints und Strategiegewichte bleiben im
bisherigen fachlichen Zuschnitt. `target-architecture.md` und
`change-compass.md` wurden auf Folgen geprüft und bleiben inhaltlich gültig.
Der aktuelle Vertrag steht in `planning-architecture.md`; dieses erledigte
Paket besitzt nach Integration keinen dauerhaften Archivnutzen.
