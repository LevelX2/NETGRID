---
activityId: act-2026-05-17-corp-agenda-flood-management
status: done
kind: fix
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/corp-plans.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm typecheck
  - git diff --check
---

# Korp-Agenda-Flood-Management side-sicher verbessern

## Ziel

Die Korp-KI soll auf eine hohe eigene HQ-Agenda-Last besser reagieren, ohne versteckte Runner-Informationen zu nutzen oder riskante nackte Agenda-Installationen zu fördern. Eigene private HQ-Information darf legal verwendet werden, muss aber in sichere Remote-, Draw-/Discard- oder Scoring-Linien übersetzt werden.

## Kontext und Quellen

- `docs/derived/AI_CAPABILITY_DEEP_ANALYSIS_2026_05_17.md`, Abschnitt `P1: Agenda-Flood-Management`.
- Die Analyse nennt Agenda-Flood als eigene P1-Schwäche neben Remote-Rezreserve.
- Dieses Paket hängt fachlich an stabiler Remote-/Rezreserve-Planung, weil Flood-Management sonst nur riskanteres Installieren erzeugt.

## Scope

- Fixture für Korp-HQ mit hoher Agenda-Dichte und unterschiedlicher Remote-Schutzlage erstellen.
- Eigene private Korp-Hand legal in der AI-Bewertung nutzen, aber nur zur Bewertung eigener Exposure-/Flood-Risiken.
- Maßnahmen klein halten:
  - geschützte Remote-Installation bevorzugen,
  - Economy/ICE vorbereiten, wenn Remote-Schutz fehlt,
  - Discard-/Draw-Linien nur berücksichtigen, wenn sie bereits legal und sinnvoll sind.
- Regression gegen nackte Agenda-Installationen aus vorhandenen Tests erhalten.

## Nicht im Scope

- Keine neue Discard-, Draw-, Install- oder Scoring-Regel.
- Keine Bewertung von Runner-Hand, Stack oder Deckliste.
- Keine großflächige Corp-Handmanagement-KI.
- Keine Bluff-/Bait-Remote-Strategie außer als späteres separates Paket.

## Akzeptanzkriterien

- [x] In Agenda-Flood-Fixtures reduziert die Korp-KI Zentralserver-Exposure oder bereitet eine geschützte Score-Linie vor.
- [x] Die Änderung erhöht nicht die Fälle, in denen Agendas ohne Schutz in neue Remotes installiert werden.
- [x] Eigene HQ-Agenda-Information bleibt ausschließlich Korp-privat und gelangt nicht in PublicEvents, Runner-Views, Debug oder Replay-Views.
- [x] Tests trennen mindestens die Fälle `geschützter Remote vorhanden`, `Remote ungeschützt`, `keine Credits für Rezreserve`.
- [x] Bestehende Corp-Plan- und AI-Contract-Tests bleiben grün.

## Umsetzungshinweise

- Zuerst die Bewertungsdaten explizit benennen: `ownAgendaPressure`, `protectedRemoteAvailable`, `rezReserveAvailable`.
- Der sicherste erste Schnitt ist eine Bewertungsanpassung, keine neue Aktionsart.
- Falls bessere Discard-/Draw-Linien nötig werden, dafür Folgepakete anlegen.

## Ergebnisnotiz

Umgesetzt. `evaluateAgendaRisk` berücksichtigt jetzt `ownAgendaPressure` aus der eigenen Korp-HQ-PlayerView und gibt nur side-sichere Zähl-/Boolean-Evidence aus. Bei Agenda-Flood bevorzugt die Planbewertung geschützte Remote-Score-Linien, vorbereitetes Remote-ICE oder Economy für fehlende Rezreserve, ohne nackte Agenda-Installationen als Score-Plan zu promoten. Neue AI-Regressionen decken geschützte Remote, ungeschützte Remote und fehlende Rezreserve ab; bestehende nackte-Agenda-Regressionen bleiben im gleichen Testblock erhalten.
