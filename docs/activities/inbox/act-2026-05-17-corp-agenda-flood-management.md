---
activityId: act-2026-05-17-corp-agenda-flood-management
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
  - act-2026-05-17-corp-remote-rez-reserve-plan
resultArtifacts: []
checks: []
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

- [ ] In Agenda-Flood-Fixtures reduziert die Korp-KI Zentralserver-Exposure oder bereitet eine geschützte Score-Linie vor.
- [ ] Die Änderung erhöht nicht die Fälle, in denen Agendas ohne Schutz in neue Remotes installiert werden.
- [ ] Eigene HQ-Agenda-Information bleibt ausschließlich Korp-privat und gelangt nicht in PublicEvents, Runner-Views, Debug oder Replay-Views.
- [ ] Tests trennen mindestens die Fälle `geschützter Remote vorhanden`, `Remote ungeschützt`, `keine Credits für Rezreserve`.
- [ ] Bestehende Corp-Plan- und AI-Contract-Tests bleiben grün.

## Umsetzungshinweise

- Zuerst die Bewertungsdaten explizit benennen: `ownAgendaPressure`, `protectedRemoteAvailable`, `rezReserveAvailable`.
- Der sicherste erste Schnitt ist eine Bewertungsanpassung, keine neue Aktionsart.
- Falls bessere Discard-/Draw-Linien nötig werden, dafür Folgepakete anlegen.

## Ergebnisnotiz

Noch offen.
