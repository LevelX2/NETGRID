# Run Runtime Architecture

Status: Current State seit E13 des Engine Architecture Refresh 2026-07-18

## Zweck

Die Run-Domäne trennt Hostverträge, Window-Ports, Successful-Run-Interventionen
und Run-End-Aufräumlogik. Der zuvor geduldete Importzyklus zwischen
Fort-Pass-Fenster, After-Passing-Last-Ice-Kontext und Run-Window-Host ist
entfernt. Die Aufteilung ändert keine Spielregel.

## Struktur

| Modulgruppe                             | Verantwortung                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `run-flow-contracts.ts`                 | Vollständiger äußerer Hostvertrag und erzeugte Adapter-Schnittstellen              |
| `run-flow-hosts.ts`                     | Einmalige, typisierte Bindung der Run-Unterdomänen an den Engine-Runtime-Host      |
| `windows/fort-pass-window-contracts.ts` | Niedriger gemeinsamer Port für Fort-Pass- und Rez-Fenster ohne Rückimport          |
| `run-end-cleanup-contracts.ts`          | Host-, Ergebnis- und Continuation-Verträge des Run-Endes                           |
| `run-end-counter-triggers.ts`           | Successful-/Unsuccessful-Run-Counter, Virus-Prevention und daraus folgende Choices |
| `run-end-cleanup.ts`                    | Geordnete Run-End-Zustandsmaschine und allgemeine Cleanup-Schritte                 |
| `successful-run-contracts.ts`           | Host- und Ergebnisverträge erfolgreicher Run-Interventionen                        |
| `successful-run-followups.ts`           | Direkte Trigger, Force-Rez-/Reverse-Ice-/Counter-Folgefähigkeiten und Extra-Runs   |
| `successful-run-interventions.ts`       | Intervention-Choices, Before-Access-Ersatzpfade und verzögerte Successful Runs     |

## Abhängigkeitsrichtung

```text
fort-pass-window-contracts ---> fort-pass-window
             |                       |
             v                       v
       run-window-host ---> after-passing-last-ice-window

run-end-cleanup-contracts ---> run-end-counter-triggers ---> run-end-cleanup

successful-run-contracts ---> successful-run-followups
             |                         |
             +-------------------------v
                       successful-run-interventions
```

Der Strukturguard weist im produktiven Engine-Graph keine relativen
Importzyklen mehr aus. `run-flow-hosts.ts` komponiert die Unterdomänen, wird von
ihnen aber nicht zurückimportiert.

## Nicht offensichtliche Verträge

- Run-Window-Reihenfolge und Timingpunkte werden nicht aus Importreihenfolge
  abgeleitet. Die Registry und der persistierte Run-Zustand bleiben Autorität.
- Fort-Pass- und Root-Rez-Fenster teilen nur einen deklarativen Port. Dadurch
  kann keines der Fenster die Implementierung des anderen zurückimportieren.
- Run-End-Cleanup ist geordnet: Trigger und Zahlungen lesen Run-Marker, bevor
  diese entfernt oder temporäre Werte zurückgesetzt werden.
- Eine Tag-Prevention-Continuation setzt den Cleanup an der gespeicherten
  Stelle fort; bereits ausgeführte Schritte dürfen nicht wiederholt werden.
- Successful-Run-Interventionen werden vor Access abgeschlossen. Verzögerte
  Successful Runs behalten ihre Ice- und Source-Referenzen bis zum passenden
  Passed-Ice-Übergang.
- Jeder Zufallspfad bleibt Seed-/RandomCounter-gesteuert; die Extraktionen
  fügen weder Ziehungen hinzu noch verändern sie deren Reihenfolge.

## Ausführbare Grenzen

`scripts/check-engine-source-structure.mjs` akzeptiert keine relativen
Importzyklen mehr und begrenzt die neuen Run-Module. Die vollständige
Engine-Suite deckt Run, Window, Successful-Run, Replay, StateHash und
Run-End-Continuations gemeinsam ab.
