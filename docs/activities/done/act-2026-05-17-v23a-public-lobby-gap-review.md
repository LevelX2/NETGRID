---
activityId: act-2026-05-17-v23a-public-lobby-gap-review
status: done
kind: concept
area: server
priority: high
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: V2.3
blockedBy: []
resultArtifacts:
  - docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-gap-review-2026-05-17.md
  - docs/activities/inbox/act-2026-05-17-v23-public-lobby-risk-review.md
  - docs/activities/inbox/act-2026-05-17-v23-public-lobby-redaction-rate-limit-matrix.md
  - docs/activities/inbox/act-2026-05-17-v23-public-alpha-rollback-operability-contract.md
checks:
  - git diff --check
---

# V2.3a zu Public-Lobby-Alpha Gap Review

## Ziel

Der abgeschlossene V2.3a-LAN-Open-Lobby-Slice soll gezielt gegen V2.3 Public Lobby Alpha abgeglichen werden, damit klar ist, was wiederverwendbar ist und welche Public-Risiken noch eigene Pakete brauchen.

## Kontext und Quellen

- `docs/releases/v2/v2-3-public-lobby-alpha/lan-open-lobby-mini-final-review.md`: LAN Open Lobby Mini Slice ist abgeschlossen.
- V2.3 Roadmap: öffentliche Casual-Lobbies, Filter, kein Ranked, kein automatisches Matchmaking, Public Platform Risk Review, Spam-/Rate-Limit-Gates, Moderations- und Abuse-Pfade, Health/Observability, Rollback-Plan.
- V2.3a war ausdrücklich keine öffentliche Lobby und kein Matchmaking.

## Scope

- V2.3a-Anforderungen gegen V2.3-Public-Anforderungen mappen.
- Wiederverwendbare Bausteine markieren: minimale Metadaten, Join-Flow-Reuse, serverseitige Revalidierung, Redaction-Tests.
- Fehlende Public-Gates markieren: Abuse, Rate Limits, Moderation, Observability, Rollback, Datenschutz, UI-Filter, Region/Latenz.
- Daraus kleine Folgeactivities anlegen, wenn der Gap konkret genug ist.

## Nicht im Scope

- Keine Public-Lobby-Implementierung.
- Kein Matchmaking.
- Kein Ranked.
- Keine Accounts- oder Moderationsimplementierung.

## Akzeptanzkriterien

- [x] Es gibt eine Gap-Liste V2.3a -> V2.3.
- [x] Public-Lobby-Risiken sind nicht mit LAN-Lobby-Komfort verwechselt.
- [x] Wiederverwendbare technische Bausteine sind benannt.
- [x] Mindestens zwei konkrete Folgepakete sind vorgeschlagen oder angelegt.

## Umsetzungshinweise

- Primärer Folgeagent: `release-planning-agent`.
- Gute Folgepakete wären z. B. `Lobby-Rate-Limit-Test`, `Public-Lobby-Redaction-Matrix`, `Rollback-Schalter für Public Alpha`.

## Ergebnisnotiz

Abgeschlossen. `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-gap-review-2026-05-17.md` trennt V2.3a-Reuse von echten Public-Gates und bestätigt V2.3 weiter als blockiert. Drei konkrete Folgeactivities sind angelegt und wegen der vorgelagerten Auth-, Datenschutz-, Moderations- und Observability-Gates blockiert: `act-2026-05-17-v23-public-lobby-risk-review`, `act-2026-05-17-v23-public-lobby-redaction-rate-limit-matrix` und `act-2026-05-17-v23-public-alpha-rollback-operability-contract`.
