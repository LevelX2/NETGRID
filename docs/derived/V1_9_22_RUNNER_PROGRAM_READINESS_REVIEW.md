# V1.9.22 Runner Program Readiness Review

Stand: 2026-05-14 00:27 CEST
Status: WIP-Readiness, keine Runtime- oder Release-Promotion

## Befund

Die 14 Runner-Programm-Zielkarten des V1.9.22-Slices sind im Scope und im Catalog-WIP-Guard enthalten. `Shield` ist inzwischen als enger Runtime-WIP umgesetzt; die uebrigen 13 Karten bleiben durch No-Playable-/No-LegalAction-Guards geschützt:

- False Echo
- Flak
- Hammer
- Japanese Water Torture
- Netspace Inverter
- Newsgroup Filter
- Poltergeist
- Rabbit
- Reflector
- Scatter Shot
- Speed Trap
- Startup Immolator
- Zetatech Software Installer

Die führende Funktionsmatrix bestätigt für alle 14 Karten `Programminstallation und MU; Memory-/MU-Modifikator`; für Flak, Hammer, Japanese Water Torture und Reflector zusätzlich `Icebreaker: Pump/Break im Encounter`, bei Japanese Water Torture konkret `Wall brechen`. Für `Shield` liegt aus der lokalen Faktenbasis der enge Vertrag Installkosten 0, MU 1 und bis zu 2 Net-Damage-Prevention pro Runner-Zug vor.

## Entscheidung für den nächsten Umsetzungsschnitt

Ein reiner Runtime-Definition-Schnitt ohne exakte Installkosten, MU-Werte, Strength-, Pump- und Break-Werte wäre zu ungenau für `human_playable` oder `deck_legal`. `Shield` ist die bewusste Ausnahme, weil Kosten, MU, Damage-Typ, Prevention-Betrag und Reset über bestehende Engine-Strukturen lokal bestätigt sind. Der nächste sichere Teilschnitt ist daher:

1. `Shield` im Manifest als `runtime_wip_no_promotion` führen.
2. Die verbleibenden 13 Programmkarten im Manifest als `planned_no_promotion` belassen.
3. Nur dann weitere Runtime-Definitionen ergänzen, wenn die konkrete lokale Kosten-/MU-/Breaker-Wertbasis im Worktree bestätigt wird oder der Schnitt ausdrücklich als nicht-promotender Display-/No-LegalAction-Guard formuliert bleibt.

## Removal Condition

Der nächste Programmschnitt kann in Code gehen, sobald mindestens eine der folgenden Bedingungen erfüllt ist:

- Für eine eng begrenzte Programmkarte liegen lokal bestätigte Installkosten, MU und bei Breakern Pump-/Break-Vertrag vor.
- Oder der Schnitt bleibt ausdrücklich nicht-promotend und ergänzt nur Runtime-/Catalog-/Engine-Guards, die keine `install_card`, `pump_breaker` oder `break_subroutine`-LegalActions freigeben.

## Gate-Auswirkung

V1.9.22 bleibt `implementing`. Dieser Review ist kein fachlicher P0-Blocker für den Release, sondern eine Schutzmarke gegen erfundene Kosten oder Breakerwerte.
