# V1.1.2K Card Release Plan

Stand: 2026-05-07
Status: umgesetzt

## Ziel

V1.1.2K ist ein kleines Kartenrelease auf dem abgeschlossenen V1.1.2-Stand. Es aktiviert genau 20 weitere lokal geprüfte O:NR-v1-Karten als `implemented`, `playable` und `deck_legal`.

Der Release nutzt ausschließlich vorhandene Engine-Mechaniken und vorhandene Resolver: Runner-Programminstallation mit MU, Icebreaker-Pump/Break, Corp-Operationen mit Credits/Draw/Tag-Bedingung, ICE-Rez, End-the-run-Subroutinen und bereits implementierten Net-Damage.

## Freizugebende Karten

Runner:

- Black Dahlia
- Codecracker
- Cyfermaster™
- Loony Goon
- Shaka
- Wizard's Book

Corp ICE:

- Laser Wire
- Nerve Labyrinth
- π in the 'Face
- Quandary
- Razor Wire
- Reinforced Wall
- Rock Is Strong
- Scramble
- Shotgun Wire
- Sleeper
- Wall of Ice
- Wall of Static

Corp Operations:

- Netwatch Credit Voucher
- Night Shift

## Umsetzungsschnitt

- `packages/shared/src/index.ts` enthält die 20 Kartendefinitionen bereits.
- Neue Release-Freigabe erfolgt nur über das Runtime-Katalog-Gate.
- `data/manifests/card-implementation-manifest-1.1.2k.json` dokumentiert die 20 zusätzlichen Karten.
- `data/scenarios/v112k-card-release-smoke.json` beschreibt den Smoke.
- Tests werden nach den bestehenden V1.0.5K/V1.0.6K-Mustern in Engine, Catalog, Decks, Server und AI ergänzt.

## Grenzen

Keine weiteren Karten, kein V1.1.3, keine neuen Mechanikfamilien, keine Prevention/Avoid/Replacement, keine generischen Asset-/Node-/Upgrade-Fähigkeiten, keine scored-agenda-Aktivfähigkeiten, keine kartenbezogenen Zufallswerte und keine offiziellen Assets oder externen Kartendatenquellen.
