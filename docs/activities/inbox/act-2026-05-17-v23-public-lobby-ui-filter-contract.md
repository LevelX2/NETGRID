---
activityId: act-2026-05-17-v23-public-lobby-ui-filter-contract
status: inbox
kind: concept
area: web
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: V2.3
blockedBy:
  - act-2026-05-17-v23-public-lobby-risk-review
resultArtifacts: []
checks: []
---

# V2.3 Public Lobby UI- und Filtervertrag

## Ziel

Vor einer Public-Lobby-Alpha soll ein UI-/Filtervertrag festlegen, welche Filter, Statusanzeigen, Sichtbarkeitsklassen und Metadaten öffentlich gezeigt werden dürfen.

## Kontext und Quellen

- `docs/derived/V2_3_PUBLIC_LOBBY_RISK_REVIEW_2026_05_17.md`
- `docs/derived/V2_3_PUBLIC_LOBBY_GAP_REVIEW_2026_05_17.md`
- `docs/derived/V2_X_PLATFORM_GATE_INVENTORY_2026_05_17.md`
- `docs/derived/V2_0_PRIVACY_EXPORT_DELETE_CONTRACT.md`
- `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md`

## Scope

- Erlaubte Public-Lobby-Filter für Format, Modus, öffentliche/private Sichtbarkeit, Region-/Latenzhinweis und Verfügbarkeit definieren.
- Erlaubte und verbotene Public-Lobby-Metadaten für Listenitems festlegen.
- Sichere UI-Zustände für leer, gefiltert, rate-limited, stale, nicht verfügbar, Join abgelehnt und Alpha deaktiviert beschreiben.
- Vertrag für Redaction von PII, Deckdaten, Tokens, Hidden-Info, Replay-/Spectator-Bezügen und KI-Debugdaten formulieren.

## Nicht im Scope

- Keine UI-Implementierung.
- Keine Public-Lobby-API-Implementierung.
- Kein Matchmaking.
- Kein Chat-, Report-, Spectator- oder Public-Replay-Start.
- Keine Account-, Moderations- oder Observability-Implementierung.

## Akzeptanzkriterien

- [ ] Erlaubte Filter und Listenmetadaten sind konkret benannt.
- [ ] Verbotene Felder und Korrelationen sind explizit aufgeführt.
- [ ] UI-Fehler- und Leerezustände leaken keine Account-, Match-, Deck-, Token-, Hidden-Info- oder Moderationsdetails.
- [ ] Handoff an spätere UI- und API-Slices ist eindeutig.

## Ergebnisnotiz

Noch offen.
