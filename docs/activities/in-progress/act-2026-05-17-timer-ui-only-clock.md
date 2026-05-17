---
activityId: act-2026-05-17-timer-ui-only-clock
status: in-progress
kind: implementation
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-5
releaseTarget:
blockedBy:
  - docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md
resultArtifacts: []
checks: []
---

# Sichtbare UI-Uhr ohne Regelwirkung

## Ziel

Im Spielbereich soll eine kompakte sichtbare Uhr erscheinen, die Matchlaufzeit und aktuelle Entscheidungs-/Seitenzeit zeigt, ohne Engine-, Server- oder Regelwirkung.

## Kontext und Quellen

- `docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md`

## Scope

- UI-only-Anzeige für Matchlaufzeit und aktive Seite/Entscheidungsalter.
- Anzeige darf lokal zwischen vorhandenen Server-/PlayerView-Updates weiterzählen.
- UI-Text bleibt deutsch und side-sicher.
- Optionaler Platz im Chat-/Lobbybereich nur, wenn ohne Layoutdrift möglich.

## Nicht im Scope

- Keine harten Zeitlimits.
- Kein Auto-Pass, Aktionsverlust, Forfeit oder Spielverlust.
- Keine Änderung an `applyAction`, `LegalActions`, `PlayerActions`, `GameState`, Replay, StateHash oder KI.
- Kein neuer Server-/WebSocket-Vertrag.

## Akzeptanzkriterien

- [ ] Sichtbare Uhr ist im aktiven Matchbereich vorhanden und stört Board-/Action-Flächen nicht.
- [ ] Uhr basiert nur auf bereits side-sicheren Daten und lokaler Anzeigezeit.
- [ ] Uhr erzeugt keine Actions und verändert keine Engine-/Serverdaten.
- [ ] Reconnect/Reload zeigt eine plausible neue Anzeige ohne alte lokale Timerreste.
- [ ] Web-Typecheck und relevante UI-Tests laufen.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Wenn ein autoritativer Server-Snapshot fehlt, Anzeige klar als Orientierung behandeln und nicht als Deadline.

## Ergebnisnotiz

Noch offen.
