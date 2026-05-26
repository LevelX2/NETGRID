# AI Hint Ontology Phase 3a Doctrine Diagnostics 2026-05-25

## Kurzfazit

Phase 3a führt eine zentrale read-only Aggregation für strukturierte AI-Hint-Ontology-Felder ein. Die Aggregation liest die in Phase 2 gepflegten Felder aus `data/ai/ai-card-hints-active.json` und erstellt daraus eine diagnostische Decksummary.

Nicht geändert wurden Engine-Regeln, LegalActions, AI-Profile, Planergewichte, Action-Scores, `aiSupportStatus`, Legacy-`roles` oder Legacy-`planRoles`.

## Implementierter Scope

Neue Datei:

- `packages/ai/src/hint-ontology-doctrine.ts`

Neue zentrale Funktion:

- `buildAiDeckOntologySummary(snapshot)`

Neue Summary-Typen:

- `AiDeckOntologySummary`
- `AiDeckOntologyEffectCounts`
- `AiDeckOntologyConditionCounts`
- `AiDeckOntologyLineSupportCounts`
- `AiDeckOntologyBreakerCoverageSummary`
- `AiDeckOntologyRemoteRoleSummary`
- `AiDeckOntologyQualitySummary`
- `AiDeckOntologyScoredAgendaActionSummary`
- `AiDeckOntologyTagPunishSummary`
- `AiDeckOntologyValidationSummary`

Die Funktion ist über `packages/ai/src/index.ts` exportiert, damit Diagnose- und Review-Harnesses sie nutzen können.

## Was aggregiert wird

Die Summary enthält:

- Gesamtzahl und eindeutige Karten des Decksnapshots
- Anzahl strukturierter Karten und strukturierte Kartenmenge nach Quantity
- Effektcounts nach `kind`, `timing`, `scope` und `resource`
- Condition-Counts
- `lineSupport`-Counts und Card-IDs je Strategic Line
- Breaker-Coverage-Profile inklusive Stärke, Pump-/Breakkosten, Side Effects und Restrictions
- Corp-Remote-Rollen inklusive Threat-Level und Server-Scope
- Scored-Agenda-Action-Karten und deren strukturierte Effektarten
- Tag/Punish-Funnel-Signale:
  - Tag-Source-Karten
  - Tag-Punish-Payoff-Karten
  - ob das Deck beides enthält
- Quality-Summary:
  - `hintReviewed`
  - `benchmarkCovered`
  - `strategyCovered`
  - `needsHumanReview`
  - `low` confidence
- Ontology-Validation-Summary pro Deck:
  - Error-/Warning-Anzahl
  - Karten mit Errors/Warnings

## Read-only-Grenze

Die neue Aggregation ist nicht in folgende Pfade eingebunden:

- `buildDeckDoctrineProfile`
- `corp-plans.ts`
- `runner-plans.ts`
- `deck-doctrine.ts` PlanWeights
- Mulligan-Gewichte
- Action-Auswahl
- `buildAiDecisionInputDto` Sanitizing

Damit ist die Änderung bewusst nur diagnostisch. Planner können die neuen Daten erst in einem späteren, separaten Consumer-Slice nutzen.

## Tests

Neue Testdatei:

- `packages/ai/src/hint-ontology-doctrine.test.ts`

Abgedeckt:

- Corp-Deck aggregiert scored-agenda economy/extra-action, Tag-Source, Tag-Punish-Payoff, Remote-Rolle und Line-Support.
- Runner-Deck aggregiert Breaker-Coverage, Search, Trash-Credits, Topdeck-Info und Runner-Line-Support.
- Quality-Lücken werden sichtbar, ohne PlanWeights oder MulliganWeights zu erzeugen.

Bestehende Phase-1-/Phase-2-Tests bleiben unverändert grün.

## Keine Verhaltensänderung

Die neue Summary verwendet nur:

- eigene Decksnapshot-Karten
- aktive AI-Hints
- Phase-1-Ontology-Validation

Sie nutzt keine Hidden Info, keine gegnerische Deckliste und keine Game-State-Instanzen. Sie erzeugt keine Legalität und keine Defaults für Planer.

## Nächster Schritt

Der nächste sinnvolle Slice ist weiterhin klein und read-only:

1. optionaler Diagnosebericht in bestehenden AI-Benchmark-/Review-Harnesses, der `AiDeckOntologySummary` pro Deck ausgibt;
2. danach ein erster echter Consumer-Slice, aber nur für ein enges Feld, z. B. scored-agenda action taxonomy oder breaker cost profile;
3. Entscheidungswirkung erst mit fokussierten Tests und Vorher-/Nachher-Benchmark.
