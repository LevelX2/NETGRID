---
activityId: act-2026-05-17-visible-match-timer-concept
status: inbox
kind: concept
area: engine
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Sichtbares Timer-System für Chat und Spiel

## Ziel

Für NETGRID soll ein sichtbares Zeit-/Timer-System konzipiert werden, bevor Engine-, Multiplayer- und UI-Verträge umgesetzt werden.

## Kontext und Quellen

- Nutzeranforderung vom 2026-05-17: Laufende Uhr im Chat- oder Spielbereich; optional Maximalzeiten für Chat, Zug, Entscheidungsphase, Partie oder Aktionen.

## Scope

- Entscheiden, welche Timerarten benötigt werden: Spieler, Zug, Run, Entscheidungsphase, Aktion, Partie oder global.
- Multiplayer-Synchronisation, Serverautorität und Reconnect-Verhalten beschreiben.
- Regelbasierte Folgen modellieren: Warnung, Timeout, Auto-Pass, Aktionsverlust, Spielverlust.
- UI-Ort und Konfiguration als kleines Folgepaket schneiden.

## Nicht im Scope

- Keine direkte Implementierung harter Zeitregeln in diesem Konzeptpaket.
- Keine Änderung an `applyAction`-Regeln, bevor Timerautorität entschieden ist.

## Akzeptanzkriterien

- [ ] Timerarten und Prioritäten sind entschieden oder als Varianten bewertet.
- [ ] Server-/Engine-Autorität und Multiplayer-Sync sind beschrieben.
- [ ] Warnungen und harte Limits haben ein konfigurierbares Modell.
- [ ] Hidden-Info-, Replay- und StateHash-Folgen sind benannt.
- [ ] Konkrete Implementierungs-Folgeactivities sind klein geschnitten.

## Umsetzungshinweise

- Harte Zeitfolgen betreffen Engine-Korrektheit und müssen replaybar sein; reine sichtbare Uhr kann als UI-Vorstufe getrennt werden.

## Ergebnisnotiz

Noch offen.
