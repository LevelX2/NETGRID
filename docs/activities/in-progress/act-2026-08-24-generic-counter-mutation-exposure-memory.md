---
activityId: act-2026-08-24-generic-counter-mutation-exposure-memory
status: in_progress
kind: implementation
area: engine-ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-08-24
startedAt: 2026-08-24
completedAt:
branch: codex/generic-counter-mutation-exposure-memory
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Generische Counter-Mutationen und Expositionswissen

## Gesamtziel

Counter-Änderungen werden side-sicher und deterministisch mit Operation, Scope,
Ausgangswert, Änderungsmenge und Restwert veröffentlicht. Schwellenabhängige
öffentliche Wirkungen können denselben Vertrag nutzen. Endet eine persistente
Server-Exposition, übernimmt das Corp-Belief-State die unmittelbar davor
sichtbaren Kartenidentitäten und Positionen in sein vorhandenes, aus
PublicEvents rekonstruiertes Wissen.

## Architekturvertrag

- Die Engine bleibt alleinige Autorität für Counter-Zustand, Schwellenwirkung
  und öffentliche Payloads.
- Die KI konsumiert nur `PlayerView`, side-sichere `PublicEvents` und eigene
  bekannte Karten; sie erkennt weder Karten-IDs noch Regeln aus Text.
- Das vorhandene `CorpOpponentModel` bleibt Besitzer des rekonstruierten
  Wissens. Es entsteht kein paralleler Speicher und keine Planentscheidung.
- Mehrere Mutationen eines Übergangs werden als kanonisch sortierte Aggregate
  veröffentlicht, nicht als künstliche Einzelereignisse pro Counter.
- Ein verbleibender aktiver Schwellenzustand beendet seine Wirkung nicht;
  insbesondere bleibt I-Spy-Exposition bei `2 -> 1` aktiv und endet erst bei
  `1 -> 0`.

## Paketfolge

### CEM-01: Counter-Audit und Shared-Vertrag

Systematisch alle Counter-Speicher, Add-/Remove-/Set-/Purge-Pfade und heutigen
öffentlichen Felder erfassen. Einen kleinen gemeinsamen Mutationstyp mit
Operation, typisiertem Scope, `before`, `amount` und `after` einführen und
dessen side-sichere, deterministische Serialisierung testen.

Done-Gate: Audit ist im Codezuschnitt nachvollziehbar; Vertragstests und
`git diff --check` sind grün; eigener Commit.

### CEM-02: Engine-Projektion und relevante Migration

Eine zentrale Engine-Hilfsfunktion für die öffentliche Counter-Mutation
einführen und alle bereits öffentlich berichteten Counter-Entfernungspfade auf
den Vertrag umstellen. Bestehende Legacy-Einzelfelder dürfen nur bleiben,
wenn aktuelle Verbraucher sie nachweislich benötigen; sie sind keine zweite
Wahrheit.

Done-Gate: fokussierte Engine-Tests belegen Einzelentfernung, Gruppenmutation,
Scope und Restwert; `git diff --check` grün; eigener Commit.

### CEM-03: Schwellenübergang persistenter Exposition

Den strukturierten Counter-Effekt so auswerten, dass der zuständige
Engine-Pfad den Übergang von aktiv zu inaktiv erkennt. Beim Ende öffentlicher
Server-Exposition wird im selben PublicEvent ein deterministischer,
side-sicherer Snapshot der unmittelbar zuvor sichtbaren installierten Karten
mit Definition und Position veröffentlicht. Bei weiterhin aktiver Schwelle
entsteht kein Ende-Snapshot.

Done-Gate: Engine-Tests belegen mindestens `2 -> 1`, `1 -> 0`, Karten-Snapshot,
keine Hidden-Info-Ausweitung und deterministische Reihenfolge; eigener Commit.

### CEM-04: Corp-Belief-State

Aktive persistente Exposition und den Expositions-Ende-Snapshot in die
vorhandene Rekonstruktion von `runnerKnownCorpCardMemory` integrieren. Nach dem
Ende bleibt Wissen nur solange gültig, wie konkrete Karte und Position nach
den vorhandenen Invalidierungsregeln gebunden bleiben.

Done-Gate: fokussierte AI-Tests belegen aktiven Status, Zugwechsel,
Schwellenende, Austausch, Bewegung und verdeckte Neuinstallation sowie
Hidden-Info-Äquivalenz; AI-Typecheck und `git diff --check` grün; eigener
Commit.

### CEM-05: Integration und Cleanup

Direkt betroffene Engine-/AI-Tests, Paket-Typechecks und Boundary-/Authority-
Checks ausführen. Aktuellen `main` in den Arbeitsbranch einbinden, relevante
Checks bei Überlappung wiederholen, lokal nach `main` mergen und Worktree sowie
Branch verifiziert entfernen.

Done-Gate: alle festgelegten Checks grün, lokaler Merge abgeschlossen,
Worktree in Git und Dateisystem entfernt, gemergter Branch gelöscht und Goal
erst danach abgeschlossen.

## Nicht im Scope

- Universelles Regel- oder Effekt-Simulationssystem für alle Karten.
- Karten-ID-Sonderfälle, `rulesText`-Parsing oder neue KI-Planfamilien.
- Änderung der I-Spy-Kosten oder der grundsätzlichen Counter-Regeln.
- Neue öffentliche PlayerView-Hidden-Info-Felder außerhalb bereits
  öffentlich sichtbarer Identitäten.
- Push oder Remote-Integration.

## Arbeitsvertrag

Arbeitsworktree: `C:\Projekte\NETGRID_COUNTER_MUTATION_EXPOSURE_MEMORY`

Arbeitsbranch: `codex/generic-counter-mutation-exposure-memory`

`/Goal Implementiere CEM-01 bis CEM-05 vollständig und sequenziell. Arbeite
ausschließlich im genannten Worktree; nutze den Hauptworkspace nur für den
finalen lokalen Merge. Bearbeite immer genau ein Paket, führe dessen direkte
Tests und git diff --check aus und committe es separat. Bei einem echten
Sicherheits- oder Vertragsblocker dokumentiere Ursache und Removal Condition.
Nach Abschluss aktuellen main einbinden, zielgerichtet verifizieren, lokal
nach main mergen, den Worktree in Git und im Dateisystem verifiziert entfernen,
den vollständig gemergten Branch löschen und das Goal erst danach als complete
markieren.`
