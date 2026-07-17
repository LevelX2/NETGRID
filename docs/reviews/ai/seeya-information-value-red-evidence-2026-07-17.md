# SeeYa-Informationswert: Red Evidence 2026-07-17

## Status

Die Sollgrenzen sind vor dem Produktionsfix auf unverändertem Code rot
gesichert. Historische Zielwahl-, Wiederholungs- und Broker-Gegenproben bleiben
grün.

## Lauf

```text
Testdateien: 7
Tests: 69
Grün: 60
Rot: 9
Fehlerklasse der vier Match-Checkpoints: behavior_regression
```

## Rote Zielverträge

| Bereich | Roter Vertrag | Aktuelles Fehlverhalten |
| --- | --- | --- |
| 424A-F01 | notwendige Krash-Coverage vor Bankaufbau | Broker wird ausgewählt |
| 424A-F04 | SeeYa als Raw-Sieger mit terminaler Remote-Komponente | Broker wird ausgewählt |
| 424A-F06 | Setup-Draw bei zweitem Bank-Load und letztem Klick | Broker wird ausgewählt |
| 424A-F06-Control | echte fehlende Wall-Coverage bleibt unterscheidbar | Broker wird ausgewählt |
| Credit-Yield | gehostete Bank-Credits sind kein sofort liquider Ertrag | +1800 allgemeiner Credit-Yield |
| Credit-Need | Bank-Load finanziert nicht sofort Niedrig-Credit-/Handziele | +700 und +900 Sofortbedarf |
| Bank-Commitment | zweiter Last-Click-Load bleibt unter echtem Setup-Draw | 1100 statt unter 820 |
| Expose-Install | ohne Reaktionsklick kein terminaler Installationswert | +1800 trotz nur zwei Klicks |
| Expose-Install | ohne Aktivierungscredit kein terminaler Installationswert | +1800 trotz nur drei Credits |

## Grüne Kontrollen vor dem Fix

- FD7671 wählt den wertvollen unbekannten Remote-Root.
- Eine exakt bereits exponierte Position wird nicht erneut gewählt.
- Sind alle Positionen exponiert, wird SeeYa stark abgewertet.
- Ein Kartenwechsel an der Position invalidiert die Erinnerung.
- Unterhalb des Korp-Matchpoints entsteht kein terminaler Bonus.
- Ohne Folgeclick entsteht kein ICE-Disruption-Bonus.
- Mit drei Klicks und vier Credits bleibt die vollständige kurze
  Install-Activate-React-Sequenz positiv.
- 424A-F02, F05, MRAM, Fall Guy, Damage Prevention, Discard und die finanzierte
  Krash-Pfadgegenprobe bleiben grün.

## Unveränderlicher Checkpoint-Vertrag

`cp-424a-04-matchpoint-remote-information` verlangt weiterhin eine
SeeYa-Aktivierung und verbietet den historischen Broker-Load. Vor dem Fix wurde
der Vertrag zusätzlich dahingehend geschärft, dass SeeYa Raw-Score-Sieger sein
und die Score-Komponente `runner_terminal_remote_tool` tatsächlich tragen
muss. Damit kann ein späterer Plan-Override den richtigen Zug nicht aus einer
erneut falschen internen Begründung heraus vortäuschen.
