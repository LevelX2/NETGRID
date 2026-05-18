---
activityId: act-2026-05-17-ai-match-progression-benchmark
status: done
kind: fix
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
  - docs/reviews/ai/match-progression-benchmark-2026-05-17.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - corepack pnpm --filter @netgrid/ai test -- index.test.ts
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# Matchprogression-Benchmark für KI-Stagnation einführen

## Ziel

Die KI-Qualität soll nicht nur über Safety und lokale Einzelentscheidungen bewertet werden. Ein kleiner Benchmark soll sichtbar machen, ob Selfplay-Partien Score-, Steal- und Remote-Progression erzeugen oder im Action-Limit stagnieren.

## Kontext und Quellen

- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`, Abschnitte `P0: Matchprogression-Benchmark statt nur Safety-Gate`, `Simulation, Soaks, Benchmarks und Exploit-Regression` und `Größte Schwächen`.
- Die Analyse nennt Action-Limit-Stagnation als stärkstes Signal, dass die KI zwar fair, aber strategisch noch schwach ist.
- Bestehende Datenanker laut Analyse: `data/ai/ai-benchmark-profiles-1.4.3.json` und AI-Tests/Reports.

## Scope

- Ein kleines Metrikset definieren:
  - Agenda-Score-Fortschritt der Korp,
  - Runner-Steals oder sinnvoller Zentralserverdruck,
  - Remote-Progression inklusive Advance/Score-Fenster,
  - Wechsel zwischen HQ/R&D/Remote-Druck,
  - Action-Limit-Rate und Abbruchgrund.
- Einen Baseline-vs-current-Report erzeugen oder die bestehende Benchmark-Struktur so erweitern, dass diese Metriken maschinenlesbar ausgegeben werden.
- Metriken zunächst als Diagnose verwenden, nicht als hartes Release-Gate mit starren Schwellen.
- Safety-Deltas gemeinsam mit Progression ausweisen, damit stärkere KI nicht durch Hidden-Info- oder LegalAction-Abkürzungen erkauft wird.

## Nicht im Scope

- Keine sofortige strategische KI-Überarbeitung.
- Keine harte Mindest-Winrate als Gate.
- Keine Änderung an Engine, LegalActions, Replay oder StateHash.
- Keine FullState- oder Decklisten-Nutzung für bessere Matchprogression.

## Akzeptanzkriterien

- [x] Der Benchmark berichtet Progression-Metriken und Action-Limit-Rate für mindestens ein wiederholbares Profil.
- [x] Baseline und aktueller Kandidat sind vergleichbar, inklusive Seed-/Deck-/Profilangaben.
- [x] Safety-Regressionssignale bleiben sichtbar und werden nicht von Progression-Metriken überdeckt.
- [x] Ein Ergebnisreport unter `docs/derived/` oder ein vorhandener AI-Reportpfad dokumentiert Befund, Grenzen und empfohlene Folgepakete.
- [x] Der Benchmark ist stabil genug, um P1-KI-Tuning an Runner- und Korp-Plänen zu messen.

## Umsetzungshinweise

- Zuerst kleine Metriken sammeln; keine große Liga-Infrastruktur in dieses Paket ziehen.
- Bei flaky oder langsamen Läufen die Daten als separaten manuellen Report markieren, statt den normalen Testlauf zu destabilisieren.
- No-Cheat-Gate: Simulation bleibt `PlayerView`-/`LegalActions`-/side-safe-Event-basiert.

## Ergebnisnotiz

Abgeschlossen. `runMatchProgressionBenchmark` und `formatMatchProgressionBenchmarkReport` erzeugen einen diagnostischen Baseline-vs-Candidate-Report mit Action-Limit-Rate, Agenda-Punkten, Score-/Steal-Aktionen, Zentral-/Remote-Druck, Remote-Install-/Advance-Signalen und Safety-Metriken. Der erste Report liegt unter `docs/reviews/ai/match-progression-benchmark-2026-05-17.md` und bestätigt: Baseline und aktueller Candidate bleiben sicher, stagnieren im kurzen Diagnosefenster aber vollständig im Action-Limit.
