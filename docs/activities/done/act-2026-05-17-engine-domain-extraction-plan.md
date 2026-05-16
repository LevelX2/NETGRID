---
activityId: act-2026-05-17-engine-domain-extraction-plan
status: done
kind: architecture
area: engine
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/state-hash.ts
checks:
  - corepack pnpm --filter @netgrid/engine test -- -t "replays actions and reproduces the final StateHash|mulligans deterministically without public hidden-info leaks|rejects stale and wrong-side player actions"
  - corepack pnpm --filter @netgrid/engine typecheck
---

# Engine-Monolith entlang stabiler Domänen extrahieren

## Ziel

`packages/engine/src/index.ts` soll ohne Verhaltensänderung schrittweise in stabile Domänenmodule zerlegt werden, damit Kartenexpansion, Hidden-Info-Prüfung und StateHash-/Replay-Review beherrschbarer bleiben.

## Kontext und Quellen

- Architektur-Check-Finding vom 2026-05-17: `packages/engine/src/index.ts` umfasst ca. 23.786 Zeilen.
- Betroffene Anker: `packages/engine/src/index.ts` um die zentralen Pfade bei ca. Zeile 1942 und 1988.
- Beobachtung: `getLegalActions`, `applyAction`, `getPlayerView`, Replay, Hashing, Redaction und große Kartenresolver leben weiterhin stark gebündelt in einer Datei, obwohl bereits kleinere `mechanics/*`-Module existieren.
- Risiko: Jede neue Kartenfamilie erhöht Kollisions- und Regressionsrisiko genau in der Regelautorität. Reviewbarkeit von Hidden-Info-, Timing- und StateHash-Folgen sinkt.
- Nutzerentscheidung vom 2026-05-17: Engine-/Resolver-Struktur soll möglichst vor den nächsten Erweiterungskarten verbessert werden, damit das System mit mehr Karten sauber wachsen kann.

## Scope

- Keine große Umbenennung oder semantische Neuordnung.
- Zuerst reine Extraktion stabiler Domänen vorbereiten und umsetzen:
  - LegalAction-Ableitung.
  - PlayerView-/Redaction-Helfer.
  - Replay-/Hash-Helfer.
- Danach erst einzelne Resolverfamilien paketweise prüfen.
- Diese Arbeit vor größeren Erweiterungs-/Kartenpaketen priorisieren.
- Bestehende öffentliche Engine-API kompatibel halten.
- Vor jeder Extraktion relevante Regressionen definieren und ausführen.

## Nicht im Scope

- Keine Änderung am `applyAction`-Validierungsvertrag.
- Keine Änderung an `hashState`, `stripForHash`, RandomCounter oder RandomDrawRecords.
- Keine Kartenpromotion und keine neue Kartenmechanik.
- Keine Redaction-Semantik ändern.
- Keine breite Resolver-Neuarchitektur ohne eigenes Gate.

## Akzeptanzkriterien

- [x] Mindestens ein klar begrenzter Domänenbereich ist aus `packages/engine/src/index.ts` extrahiert.
- [x] Öffentliche Engine-API und bestehende Imports bleiben kompatibel oder sind minimal mechanisch angepasst.
- [x] Replay/StateHash-Smokes sind vor und nach der Extraktion grün.
- [x] Hidden-Info-Smokes sind grün.
- [x] LegalAction-Stale-/Wrong-Side-Tests sind grün.
- [x] Keine neue Kartenfunktionalität wurde im gleichen Paket eingeführt.

## Umsetzungshinweise

- Klein anfangen: reine Helfer oder pure Funktionen extrahieren, bevor zentrale Flows verschoben werden.
- Mechanische Extraktion bevorzugen; fachliche Verbesserungen als Folgepakete ablegen.
- Kartenresolver zuletzt anfassen und nur nach Release-/Gate-Bezug.

## Ergebnisnotiz

Abgeschlossen. Als erster risikoarmer Domänenschnitt wurde die StateHash-Kanonisierung aus `packages/engine/src/index.ts` nach `packages/engine/src/state-hash.ts` extrahiert. Der öffentliche Export `hashState` bleibt in `index.ts` kompatibel und delegiert auf das neue Modul. Es wurden keine Engine-Regeln, LegalActions, Redaction-Semantik, Replay-PrivatePayloads, RandomCounter oder Kartenresolver geändert.

Ausgeführt wurden fokussierte Regressionen für Replay/StateHash, Hidden-Info-Barriere und Stale-/Wrong-Side-Revalidation sowie der Engine-Typecheck. Weitere Extraktionen sollten als eigene Pakete klein bleiben, z. B. PlayerView-/Redaction-Helfer oder LegalAction-Ableitungshelfer.
