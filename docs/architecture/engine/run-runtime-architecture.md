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
- Bezahlbare `corp_encounter`-Fähigkeiten öffnen vor der nächsten
  Runner-Encounteraktion ein Corp-Reaktionsfenster. Neben den Aktivierungen
  bietet die Engine einen an `game_rule`, Seite und Server gebundenen
  `continue_run`-Pass an. `corpEncounterPassStateVersion` gilt genau für den
  danach erreichten Zustand; eine weitere Runneraktion eröffnet die
  Reaktionsmöglichkeit erneut. Ohne bezahlbare Fähigkeit entsteht kein
  Pflichtpass. Damit kann weder die KI-Seitenauswahl noch ein Client die
  gegnerische Reaktion durch eine gleichzeitig angebotene Fortsetzung umgehen.
- Für die aktuellen bezahlten ETR-Ergänzungen liefert die Corp-View
  `currentEncounterDefenseQuotes`: exakte Action-ID, Kosten, noch offene
  ETR-Subroutinen und sichtbarer Break-Austausch für die zusätzliche
  Subroutine. Die kanonische Ability-Bindung bleibt Engine-Autorität. Diese
  Quote beschreibt den sichtbaren Breakpfad, keine garantierte Abwehr aller
  Run-Sonderfähigkeiten. Nicht modellierte Breakfähigkeiten bleiben ausdrücklich
  unvollständig; verdeckte Runner-Karten werden nicht ausgewertet.
- Fort-Pass- und Root-Rez-Fenster teilen nur einen deklarativen Port. Dadurch
  kann keines der Fenster die Implementierung des anderen zurückimportieren.
- Gleichzeitig offene Aktivierungstimings werden gemeinsam an die
  CardImplementation-Aktionserzeugung übergeben. Jede gebundene Fähigkeit
  wird einmal über ihr erstes zulässiges Timing angeboten, einschließlich
  dessen Zusatzbedingung. `additionalTimings` erzeugt keine zweite
  Fähigkeitsidentität; die globale Prüfung auf doppelte LegalAction-IDs bleibt
  bestehen. Das gilt insbesondere für `corp_during_run` zusammen mit
  `corp_paid` und für `during_run` zusammen mit `runner_paid`.
- Run-End-Cleanup ist geordnet: Trigger und Zahlungen lesen Run-Marker, bevor
  diese entfernt oder temporäre Werte zurückgesetzt werden.
- Encounter-Eintrittskosten werden vor dem Verbrauch der Next-Encounter-Marker
  bezahlt. Öffnet die Zahlung ein Supportfenster, bewahrt
  `pendingEncounterEntryIceId` die konkrete Eintrittsstelle. Die Engine bietet
  dieselbe gebundene `runner.continue_run`-Fortsetzung an und setzt erst nach
  Zahlung den Encounter samt Markern; die Bewegung wird nicht erneut gespielt.
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
