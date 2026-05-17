---
activityId: act-2026-05-17-corp-remote-rez-reserve-plan
status: inbox
kind: fix
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-17-ai-match-progression-benchmark
resultArtifacts: []
checks: []
---

# Korp-Remote-Plan mit Rezreserve stabilisieren

## Ziel

Die Korp-KI soll geschützte Scoring-Remote-Linien kohärenter verfolgen: erst ICE und Economy/Rezreserve, dann Agenda-Installation, Advancement und Score-Fenster. Dabei darf sie nicht in nackte Agenda-Regressionen oder übertrieben passive Reservehaltung kippen.

## Kontext und Quellen

- `docs/derived/AI_CAPABILITY_DEEP_ANALYSIS_2026_05_17.md`, Abschnitte `P1: Corp Remote-Rez-Reserve-Plan`, `Corp-Analyse` und `Größte Schwächen`.
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

- [ ] Korp-KI bevorzugt in Fixtures geschützte Score-Fenster gegenüber vermeidbaren nackten Agenda-Installationen.
- [ ] Rezreserve wird als Mittel zum Score-Plan genutzt, nicht als endloser Passivitätsgrund.
- [ ] Bestehende nackte-Agenda-Regressionsfälle bleiben grün.
- [ ] Matchprogression-Metriken zeigen mindestens keinen schlechteren Action-Limit- oder Remote-Stagnationswert im relevanten Benchmarkprofil.
- [ ] No-Cheat-Gate bleibt gewahrt: keine gegnerischen Hidden-Zonen als Entscheidungsquelle.

## Umsetzungshinweise

- Bestehende `build_scoring_remote`-/`score_next_turn`-Bewertungen nicht breit ersetzen; lieber eine kleine zusätzliche Reservebewertung einsetzen.
- Metriken aus `act-2026-05-17-ai-match-progression-benchmark` als Diagnose nutzen, aber nicht sofort starre Schwellen erzwingen.
- Wenn die Reserve-Logik zu passiv wird, ein eigenes Tuning-Follow-up anlegen statt dieses Paket auszuweiten.

## Ergebnisnotiz

Noch offen.
