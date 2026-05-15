# Originalset-Spotcheck 2026-05-15 Reactive Decks Grid

Status: `blocked`; grüne Teilfixes wurden lokal umgesetzt und geprüft.

Jobbericht: `docs/derived/originalset-spotcheck-jobs/blocked/spotcheck-2026-05-15-reactive-decks-grid.md`

## Ergebnis

Dieser Lauf hat die gemeinsamen Run-Reaktions- und Hardware-Deck-Flächen gehärtet, aber das Paket nicht als vollständig erledigt markiert. Drei Karten brauchen jeweils eigene Resolver-Slices, deren Timing-/Choice-Verträge größer sind als ein sicherer Spotcheck-Teilfix.

## Umgesetzt und geprüft

| Karte | Ergebnis | Nachweis |
|---|---|---|
| False Echo | Successful-Run-Fähigkeit revalidiert Side, Timing, Quelle und Fort; rezzt bezahlbare ICE deterministisch von außen nach innen | Engine-Test mit Replay/StateHash und Payload-Leakscan |
| Netspace Inverter | Successful-Run-Fähigkeit reverset die öffentliche ICE-Reihenfolge des angegriffenen Forts ohne unrezzed Definition-Leak | Engine-Test mit Serverreihenfolge, Payload und Replay |
| Arasaka Portable Prototype | Deck-Vertrag mit +3 MU, 3 Icebreaker-Recurring-Credits und exakt 1 Agenda-Punkt-Installkosten | Engine-Test für Kosten-Gate, Forfeit-Revalidation, Deck-Replacement und Payload |
| Pandora's Deck | Deck-Vertrag mit +2 MU, 3 Link-Recurring-Credits und generischem Deck-Replacement | Engine-Test für MU-Aufbau/-Rückbau, Recurring Counter und Replacement |
| Roving Submarine | Region-/Run-Gate-Teilfix: Aktivitätsmarker nach Corp-Install/Advance steuert Runner-Run-LegalActions | Engine-Test für Marker, Run-Erlaubnis und Run-Block |
| Zetatech Software Installer | Bestehender Programminstall-/Overlay-Pfad blieb regressionsgrün | Pflichtchecks |
| Raven Microcyb Eagle | Bestehende Hardware-/Recurring-Fläche blieb regressionsgrün | Pflichtchecks |

## Blocker

| Karte | Blocker | Removal Condition |
|---|---|---|
| Speed Trap | Rez-Interrupt-Fenster nach Upgrade-/Node-Rez fehlt, inklusive Runner-Choice und erfolgreichem Run ohne Access nach letztem ICE | Eigenen Rez-Interrupt-Resolver mit Hidden-Info-sicherer Payload und Replay-Test implementieren |
| Startup Immolator | Post-Encounter-Fenster nach vollständig gebrochenen Subroutinen fehlt; Tap/Exhaust, Runner-Zahlung der Rez-Kosten und ICE-Trash müssen source-bound werden | Eigenen Post-Encounter-Resolver mit Kosten-/Timing-Revalidation und Replay-Test implementieren |
| Microtech Backup Drive | Replacement-Window für simultanen Programtrash, geordnete faceup Hosted-Zone und Top-Hosted-in-Grip-Aktion fehlen | Eigenen Replacement-/Hosted-Order-Resolver mit PlayerView-/Reconnect-Test implementieren |

## Checks

- `corepack pnpm --filter @netgrid/engine test` - grün
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün
- `corepack pnpm --filter @netgrid/catalog test` - grün
- `corepack pnpm typecheck` - grün

## Commit-Hinweis

Der Job wird als `blocked` abgeschlossen, weil die geprüften Teilfixes commitfähig sind, aber der vollständige Kartenumfang noch getrennte Resolver-Arbeit benötigt.
