---
activityId: act-2026-05-17-turn-start-audio-cue
status: done
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/action-cues.ts
  - apps/web/app/action-cues.test.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/action-cues.test.ts --passWithNoTests
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
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

- [x] Bei Zugbeginn wird genau ein passender Runner-/Korp-Cue ausgelöst.
- [x] Sound ist abschaltbar und respektiert vorhandene Audioeinstellungen.
- [x] Reconnect/State-Sync triggert keine alten Turn-Sounds erneut.
- [x] Tests oder manueller Browser-Smoke decken mindestens einen Rollenwechsel ab.

## Umsetzungshinweise

- Falls Sprachansagen genutzt werden, nur eigene/generierte oder lokal freigegebene Assets verwenden.

## Ergebnisnotiz

Erledigt: Der Web-Client leitet aus dem Wechsel von `activeSide` in eine passende Action-Phase einen dedizierten, synthetischen Runner- oder Korp-Zugbeginn-Cue ab. Audio bleibt vollständig optional und nutzt die bestehenden Audio-/Lautstärkeeinstellungen; externe Sprach- oder Soundassets wurden nicht ergänzt.

Der initiale Payload nach Reconnect oder Session-Wechsel primt nur den letzten Turn-State und spielt keinen alten Cue. State-Syncs ohne Seitenwechsel bleiben stumm. Der bisherige generische End-Turn-Sound wurde aus der Action-Sound-Zuordnung herausgenommen, damit der neue Zugbeginn-Cue nicht zusätzlich zu einem End-Turn-Klick doppelt ausgelöst wird.

Multiplayer-Verhalten: Jeder Client, der Audio aktiviert hat, hört den Zugbeginn-Cue für die nun aktive Seite. Eine getrennte Einstellung nur für den aktiven Spieler wurde nicht eingeführt, weil die vorhandenen Audiooptionen bereits Stumm/Lautstärke abdecken und das Paket kein Dialog-Redesign vorsieht.

Verifiziert mit fokussiertem Cue-Test für Runner-/Korp-Seitenwechsel, Reconnect-/Match-Wechsel-Nullfall und Setup-Phase sowie Web-Typecheck und `git diff --check`.

Offene Punkte: keine.
