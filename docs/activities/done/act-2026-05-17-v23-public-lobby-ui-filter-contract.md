---
activityId: act-2026-05-17-v23-public-lobby-ui-filter-contract
status: done
kind: concept
area: web
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget: V2.3
blockedBy: []
resultArtifacts:
  - docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-ui-filter-contract.md
checks:
  - "Test-Path references for V2.3 Public-Lobby UI/filter contract sources"
  - "rg reference check for V2_3_PUBLIC_LOBBY_UI_FILTER_CONTRACT"
  - "git diff --check"
outcome: completed
---

# V2.3 Public Lobby UI- und Filtervertrag

## Ziel

Vor einer Public-Lobby-Alpha soll ein UI-/Filtervertrag festlegen, welche Filter, Statusanzeigen, Sichtbarkeitsklassen und Metadaten öffentlich gezeigt werden dürfen.

## Kontext und Quellen

- `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-risk-review-2026-05-17.md`
- `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-gap-review-2026-05-17.md`
- `docs/releases/v2/platform-gates/platform-gate-inventory-2026-05-17.md`
- `docs/releases/v2/v2-0-auth-privacy-cloud-decks/privacy-export-delete-contract.md`
- `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md`

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

- [x] Erlaubte Filter und Listenmetadaten sind konkret benannt.
- [x] Verbotene Felder und Korrelationen sind explizit aufgeführt.
- [x] UI-Fehler- und Leerezustände leaken keine Account-, Match-, Deck-, Token-, Hidden-Info- oder Moderationsdetails.
- [x] Handoff an spätere UI- und API-Slices ist eindeutig.

## Ergebnisnotiz

Abgeschlossen. `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-ui-filter-contract.md` definiert die erlaubten Public-Lobby-Filter, Listenmetadaten, sicheren UI-Zustände, verbotenen Felder und verbotenen Korrelationen für V2.3 Public Lobby Alpha. Das Artefakt bestätigt weiterhin, dass V2.3 blockiert bleibt und keine UI-, API-, Matchmaking-, Chat-, Spectator-, Replay-, Account-, Moderations-, KI-, Karten- oder Asset-Freigabe erhält. Handoff an spätere UI- und API-Slices ist im Vertrag getrennt beschrieben.
