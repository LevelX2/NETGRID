---
activityId: act-2026-06-07-deckeditor-runner-strategic-intent-view
status: done
kind: fix
area: web
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/api/decks/strategy-profile/strategy-profile-data.ts
  - apps/web/app/deck-strategy-profile-ui.ts
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
  - apps/web/app/api/decks/strategy-profile/strategy-profile-data.test.ts
  - apps/web/app/deck-strategy-profile-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/deck-strategy-profile-ui.test.ts app/api/decks/strategy-profile/strategy-profile-data.test.ts
  - corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit
  - git diff --check
  - Browser-DOM-Smoke http://127.0.0.1:3100 Deck-Editor / Blink Pressure Rig
---

# Abgeleitete Runner-KI-Spielabsicht im Deckeditor anzeigen

## Ziel

Der Deckeditor soll neben dem bestehenden diagnostischen `KI-Deckprofil` die neue abgeleitete Runner-Strategieansicht anzeigen, damit sichtbar wird, wie die KI ein Runner-Deck runtime-nah interpretiert.

## Kontext und Quellen

- Nutzer-Nacharbeitsableitung vom 2026-06-07 aus eingefügtem Reviewtext.
- AI-STRAT-1 bis AI-STRAT-4 haben `RunnerStrategicIntentProfile`, `RunnerRunTargetEvaluation`, `RunnerEconomyPosture`, `RunnerTacticalGoal` und redigierte Debug-Facts eingeführt.
- `docs/reviews/ai/ai007-deck-doctrine-strategy-viewer-2026-05-31.md`: bestehender Deckeditor-Viewer für diagnostisches `KI-Deckprofil`.
- `docs/reviews/ai/ai-strat-runner-intent-goals-final-report-2026-06-07.md`
- `packages/ai/src/runner-strategic-intent.ts`
- `packages/ai/src/runner-tactical-goals.ts`

## Scope

- Vorhandene Deckeditor-/KI-Analyse-Komponenten und API-Pfade prüfen.
- Einen read-only Abschnitt ergänzen, z. B. `Abgeleitete KI-Spielabsicht` oder `KI Strategic Intent`.
- Für Runner-Decks verständlich anzeigen:
  - primärer Gewinnplan,
  - Ausführungsstil,
  - Setup-Engine,
  - Druckvektoren,
  - Risikoprofil,
  - abgelehnte Intents,
  - Confidence und kurze redigierte Evidence-/Quellenhinweise.
- Anzeige klar vom diagnostischen Strategieprofil trennen:
  - Diagnoseprofil = Rohaggregation und viewer-/diagnoseorientiert,
  - abgeleitete Spielabsicht = Runtime-nahe Interpretation aus Diagnoseprofil plus DeckCapabilities.
- Für `Blink Pressure Rig` als Golden-Deck-Erwartung die generischen Begriffe sichtbar machen:
  - Agenda-Steal,
  - Run-Event-Tempo,
  - Breaker-Suche,
  - Rig-Aufbau,
  - Economy-Aufbau vor Druck,
  - zentraler Probe-/Access-Druck,
  - situativer Remote Contest,
  - riskante Universalbreaker-Coverage,
  - abgelehntes HQ-Depletion-, Bad-Publicity- und dediziertes R&D-/HQ-Multiaccess-Muster.

## Nicht im Scope

- Keine neuen Strategy-IDs.
- Keine neuen Taktiksignale oder Kartentaxonomie-Dateien.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash- oder Zufallspfadänderung.
- Keine vollständige Deckliste, Deckreihenfolge, private Snapshot-ID, `cardInstances`, `privatePayload` oder Hidden-Info in der Anzeige.
- Kein Redesign des gesamten Deckeditors.
- Keine produktive KI-Gewichtungsänderung.

## Akzeptanzkriterien

- [x] Der Deckeditor zeigt bei Runner-Decks einen separaten Abschnitt für die abgeleitete KI-Spielabsicht.
- [x] Das bestehende diagnostische `KI-Deckprofil` bleibt erhalten und wird nicht als Runtime-Intent umetikettiert.
- [x] Die Anzeige ist deutsch lesbar und nutzt generische Labels statt interner Roh-IDs, wo sinnvoll.
- [x] Für `Blink Pressure Rig` entspricht die Anzeige dem AI-STRAT-Golden-Deck-Befund.
- [x] Keine verbotenen Debug-/Hidden-Info-Felder erscheinen in UI, API-Payload oder Tests.
- [x] Fokussierter Web-/Component-Test oder bestehender Deckeditor-Test ist ergänzt, sofern im Projekt vorhanden.
- [x] Relevante Typechecks und `git diff --check` sind grün.

## Umsetzungshinweise

- Falls der bestehende `/api/decks/strategy-profile`-Pfad erweitert wird, die Antwort redigiert und rückwärtskompatibel halten.
- Prüfen, ob `buildRunnerStrategicIntentProfile` direkt aus dem vorhandenen StrategyProfile plus DeckCapabilityProfile im Serverpfad gebaut werden kann.
- Für Corp-Decks entweder keinen Abschnitt anzeigen oder klar `nicht verfügbar`/`nur Runner` ausweisen, ohne neue Corp-Intent-Logik zu erfinden.

## Ergebnisnotiz

Erledigt: Der bestehende `KI-Deckprofil`-API-/UI-Pfad liefert für Runner-Decks zusätzlich ein redigiertes ViewModel `runnerStrategicIntent` aus `buildDeckStrategyProfile`, `buildDeckCapabilityProfile` und `buildRunnerStrategicIntentProfile`. Der Deckeditor rendert daraus den separaten Abschnitt `Abgeleitete KI-Spielabsicht` mit Gewinnplan, Ausführungsstil, Setup-Engine, Druckvektoren, Risikoprofil, abgelehnten Mustern, Confidence und redigierten Quellenhinweisen. Für Korp-Decks wird kein Runner-Intent angezeigt.

Verifiziert mit fokussierten Web-Tests, Web-Typecheck, `git diff --check` und einem Browser-DOM-Smoke auf `Blink Pressure Rig`. Offene Folgepunkte: keine innerhalb dieses Pakets; zusätzliche Golden-Deck-Kalibrierung bleibt im separaten Paket `act-2026-06-07-runner-strategic-intent-golden-decks`.
