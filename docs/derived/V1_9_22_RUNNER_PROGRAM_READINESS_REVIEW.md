# V1.9.22 Runner Program Readiness Review

Stand: 2026-05-13 17:38 CEST
Status: WIP-Readiness, keine Runtime- oder Release-Promotion

## Befund

Die 14 Runner-Programm-Zielkarten des V1.9.22-Slices sind im Scope und im Catalog-WIP-Guard enthalten:

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
- Shield
- Speed Trap
- Startup Immolator
- Zetatech Software Installer

Die führende Funktionsmatrix bestätigt für alle 14 Karten `Programminstallation und MU; Memory-/MU-Modifikator`; für Flak, Hammer, Japanese Water Torture und Reflector zusätzlich `Icebreaker: Pump/Break im Encounter`, bei Japanese Water Torture konkret `Wall brechen`.

## Entscheidung für den nächsten Umsetzungsschnitt

Ein reiner Runtime-Definition-Schnitt ohne exakte Installkosten, MU-Werte, Strength-, Pump- und Break-Werte wäre zu ungenau für `human_playable` oder `deck_legal`. Der nächste sichere Teilschnitt ist daher:

1. Programmscope im Manifest als `planned_no_promotion` belassen.
2. Nur dann Runtime-Definitionen ergänzen, wenn die konkrete lokale Kosten-/MU-/Breaker-Wertbasis im Worktree bestätigt wird oder der Schnitt ausdrücklich als nicht-promotender Display-/No-LegalAction-Guard formuliert bleibt.
3. Bei fehlenden Werten zuerst einen kleinen Install-No-Promotion-Guard ergänzen, der verhindert, dass die Programmkarten durch generische Programmlogik versehentlich LegalActions öffnen.

## Removal Condition

Der Programmschnitt kann in Code gehen, sobald mindestens eine der folgenden Bedingungen erfüllt ist:

- Für eine eng begrenzte Programmkarte liegen lokal bestätigte Installkosten, MU und bei Breakern Pump-/Break-Vertrag vor.
- Oder der Schnitt bleibt ausdrücklich nicht-promotend und ergänzt nur Runtime-/Catalog-/Engine-Guards, die keine `install_card`, `pump_breaker` oder `break_subroutine`-LegalActions freigeben.

## Gate-Auswirkung

V1.9.22 bleibt `implementing`. Dieser Review ist kein fachlicher P0-Blocker für den Release, sondern eine Schutzmarke gegen erfundene Kosten oder Breakerwerte.
