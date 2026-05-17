---
activityId: act-2026-05-17-turn-start-audio-cue
status: inbox
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Zugbeginn: deutlichen Runner-/Korp-Sound anbieten

## Ziel

Beim Wechsel des aktiven Spielers soll ein klar wahrnehmbarer, optional abschaltbarer Sound oder eine kurze Ansage signalisieren, wer jetzt am Zug ist.

## Kontext und Quellen

- Nutzeranforderung vom 2026-05-17: Sound soll deutlicher als ein Klick sein und Runner/Korp unterscheiden.
- Verwandte erledigte Activity: `docs/activities/done/act-2026-05-17-audio-cue-sound-design-review.md`; dieses Paket ist ein konkretes Follow-up für Turn-/Rollenwechsel.

## Scope

- Turn-/Phase-Transition-System als Trigger anbinden.
- Doppelte Sounds bei Re-Renders oder State-Syncs vermeiden.
- User Settings für stumm/Signalton/Sprachansage und Lautstärke prüfen oder ergänzen.
- Multiplayer-Verhalten festlegen: aktiver Spieler, beide Spieler oder konfigurierbar.

## Nicht im Scope

- Keine vollständige Soundbibliothek für alle Ereignisse.
- Keine externen lizenzierten Sprachassets ohne Asset-/Rechts-Gate.

## Akzeptanzkriterien

- [ ] Bei Zugbeginn wird genau ein passender Runner-/Korp-Cue ausgelöst.
- [ ] Sound ist abschaltbar und respektiert vorhandene Audioeinstellungen.
- [ ] Reconnect/State-Sync triggert keine alten Turn-Sounds erneut.
- [ ] Tests oder manueller Browser-Smoke decken mindestens einen Rollenwechsel ab.

## Umsetzungshinweise

- Falls Sprachansagen genutzt werden, nur eigene/generierte oder lokal freigegebene Assets verwenden.

## Ergebnisnotiz

Noch offen.
