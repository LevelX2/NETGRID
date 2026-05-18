# Originalset-Spotcheck 2026-05-15 Reactive Decks Grid

Status: `done`; die ursprünglichen Teilfixes und die drei nachgezogenen Blocker wurden lokal umgesetzt und geprüft.

Jobbericht: `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-reactive-decks-grid.md`

## Ergebnis

Dieser Lauf hat die gemeinsamen Run-Reaktions-, Hardware-Deck- und Hosted-Program-Flächen gehärtet. Die zunächst offenen Resolver-Slices für Speed Trap, Startup Immolator und Microtech Backup Drive wurden anschließend einzeln umgesetzt und fokussiert getestet.

## Umgesetzt und geprüft

| Karte | Ergebnis | Nachweis |
|---|---|---|
| False Echo | Successful-Run-Fähigkeit revalidiert Side, Timing, Quelle und Fort; rezzt bezahlbare ICE deterministisch von außen nach innen | Engine-Test mit Replay/StateHash und Payload-Leakscan |
| Netspace Inverter | Successful-Run-Fähigkeit reverset die öffentliche ICE-Reihenfolge des angegriffenen Forts ohne unrezzed Definition-Leak | Engine-Test mit Serverreihenfolge, Payload und Replay |
| Arasaka Portable Prototype | Deck-Vertrag mit +3 MU, 3 Icebreaker-Recurring-Credits und exakt 1 Agenda-Punkt-Installkosten | Engine-Test für Kosten-Gate, Forfeit-Revalidation, Deck-Replacement und Payload |
| Pandora's Deck | Deck-Vertrag mit +2 MU, 3 Link-Recurring-Credits und generischem Deck-Replacement | Engine-Test für MU-Aufbau/-Rückbau, Recurring Counter und Replacement |
| Roving Submarine | Region-/Run-Gate-Teilfix: Aktivitätsmarker nach Corp-Install/Advance steuert Runner-Run-LegalActions | Engine-Test für Marker, Run-Erlaubnis und Run-Block |
| Speed Trap | Root-Rez-Interrupt im Run mit Runner-Choice, erfolgreichem Run ohne Access nach letztem ICE und Pass-Weiterlauf | Engine-Tests für Choice, No-Access-Erfolg, Pass und Replay |
| Startup Immolator | Post-Pass-ICE-Trash nach vollständig gebrochenem ICE mit Rez-Kosten-Zahlung und Turn-Exhaust | Engine-Test für Kosten, ICE-Zonenentfernung, Payload und Replay |
| Microtech Backup Drive | Hosted-Program-Kaskaden werden auf Microtech gesichert; Top-Hosted-Aktion nimmt ein Programm in die Grip | Engine-Test über Succubus-/D'Arc-Kaskade, Return-Aktion und Replay |
| Zetatech Software Installer | Bestehender Programminstall-/Overlay-Pfad blieb regressionsgrün | Pflichtchecks |
| Raven Microcyb Eagle | Bestehende Hardware-/Recurring-Fläche blieb regressionsgrün | Pflichtchecks |

## Restnotiz

Zetatech Software Installer und Raven Microcyb Eagle sind in diesem Paket regressionsgrün geblieben. Ihre weitergehenden Komfort-/Edge-Härtungen sind sinnvoll, aber kein Blocker für diesen Spotcheck-Abschluss.

## Checks

- `corepack pnpm --filter @netgrid/engine test` - grün
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün
- `corepack pnpm --filter @netgrid/catalog test` - grün
- `corepack pnpm typecheck` - grün

## Commit-Hinweis

Der Job wird als `done` abgeschlossen. Die Blocker wurden nach dem ersten Teilfix-Commit einzeln umgesetzt und lokal committed.
