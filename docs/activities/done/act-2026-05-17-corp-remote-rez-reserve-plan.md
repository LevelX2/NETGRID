---
activityId: act-2026-05-17-corp-remote-rez-reserve-plan
status: done
kind: fix
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-3
parallelWorker: worker-3
releaseTarget:
blockedBy:
  - act-2026-05-17-ai-match-progression-benchmark
resultArtifacts:
  - packages/ai/src/corp-plans.ts
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
checks:
  - "PASS: corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t \"remote rez reserve|affordable remote ICE|score horizons|naked agenda\""
  - "PASS: corepack pnpm --filter @netgrid/ai typecheck"
  - "PASS: corepack pnpm --filter @netgrid/ai test"
  - "PASS: corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t \"reports match progression metrics\" --reporter verbose"
  - "PASS: git diff --check"
---

# Korp-Remote-Plan mit Rezreserve stabilisieren

## Ziel

Die Korp-KI soll geschützte Scoring-Remote-Linien kohärenter verfolgen: erst ICE und Economy/Rezreserve, dann Agenda-Installation, Advancement und Score-Fenster. Dabei darf sie nicht in nackte Agenda-Regressionen oder übertrieben passive Reservehaltung kippen.

## Kontext und Quellen

- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`, Abschnitte `P1: Corp Remote-Rez-Reserve-Plan`, `Corp-Analyse` und `Größte Schwächen`.
- Bestehende Härtung laut Status: Corp-KI berücksichtigt bereits geschützte Remotes und nackte Agenda-Risiken. Dieses Paket soll daraus eine stabilere mehrschrittige Rezreserve-Linie machen.

## Scope

- Bestehende Corp-Planbewertung in `packages/ai/src/corp-plans.ts` prüfen.
- Eine kleine Plansequenz bewerten: ICE installieren, Credits/Rezreserve aufbauen, Agenda in geschützten Remote installieren, advancen, scoren.
- Sichtbare Runner-Fähigkeit nur side-sicher einbeziehen: installierte Runner-Breaker, Credits, Tags/Link und öffentliche Boardlage.
- Tests für mindestens drei Fälle:
  - Remote mit bezahlbarem ICE wird gegenüber nackter Agenda bevorzugt,
  - fehlende Rezreserve führt vor Agenda-Install zu Economy,
  - ausreichende Reserve erlaubt Score-Linie statt endloser Economy.

## Nicht im Scope

- Keine Nutzung von Runner-Hand, Stack, Deckliste oder verdeckten Runner-Karten.
- Keine Änderung an Install-, Rez-, Advance- oder Score-Regeln.
- Keine vollständige Bluff-/Bait-KI.
- Keine Produktentscheidung zu öffentlichen Matchmaking- oder Liga-Funktionen.

## Akzeptanzkriterien

- [x] Korp-KI bevorzugt in Fixtures geschützte Score-Fenster gegenüber vermeidbaren nackten Agenda-Installationen.
- [x] Rezreserve wird als Mittel zum Score-Plan genutzt, nicht als endloser Passivitätsgrund.
- [x] Bestehende nackte-Agenda-Regressionsfälle bleiben grün.
- [x] Matchprogression-Metriken zeigen mindestens keinen schlechteren Action-Limit- oder Remote-Stagnationswert im relevanten Benchmarkprofil.
- [x] No-Cheat-Gate bleibt gewahrt: keine gegnerischen Hidden-Zonen als Entscheidungsquelle.

## Umsetzungshinweise

- Bestehende `build_scoring_remote`-/`score_next_turn`-Bewertungen nicht breit ersetzen; lieber eine kleine zusätzliche Reservebewertung einsetzen.
- Metriken aus `act-2026-05-17-ai-match-progression-benchmark` als Diagnose nutzen, aber nicht sofort starre Schwellen erzwingen.
- Wenn die Reserve-Logik zu passiv wird, ein eigenes Tuning-Follow-up anlegen statt dieses Paket auszuweiten.

## Ergebnisnotiz

Umgesetzt. `build_scoring_remote` berücksichtigt jetzt side-sicher Remote-ICE-Installationen als ersten Scoring-Remote-Schritt und bewertet eine kleine Rezreserve-Linie für Remote-ICE, Economy, Agenda-Installation und Advance/Score-Fortschritt. Niedrige Credits vor einem geschützten Agenda-Install fördern Economy, ausreichende Reserve beendet die Passivität und bevorzugt die Score-Linie.

Enge Regressionstests decken ab:

- bezahlbares Remote-ICE vor neuer nackter Agenda,
- Economy vor Agenda-Install bei fehlender Remote-ICE-Rezreserve,
- Advance/Score-Linie bei ausreichender Reserve statt endloser Economy.

No-Cheat-Gate bleibt gewahrt: Die Bewertung nutzt eigene Korp-PlayerView/LegalActions, sichtbare Runner-Credits, installierte Runner-Rig-Karten und öffentliche Serverlage, aber keine Runner-Hand, keinen Stack, keine Deckliste und keine Engine-Regeländerung.
