# SeeYa-Informationswert: Final Review 2026-07-17

## Ergebnis

SeeYa besitzt jetzt einen expliziten kostenbewussten Installations-,
Aktivierungs- und Zielvertrag. Die Korrektur erhöht SeeYas Score nicht. Sie
trennt vielmehr den terminalen Informationswert von bloßer Vorbereitung und
entfernt doppelt gezählte Sofortliquidität aus Bank-Loads.

Im historischen 424A-Matchpoint-Zustand ist SeeYa damit wieder Raw-Score-
Sieger: 1827 Punkte gegenüber 1612 für den zweiten Broker-Load. Die bereits
vorhandenen Schutzschichten gegen leere Wiederholungen und falsche Expose-
Ziele bleiben unverändert grün.

## Analysierte Evidence

- `match_fd7671d270e1a716`: 156/156 Runner-Entscheidungen, historische
  SeeYa-Installation plus sechs Aktivierungen. Fünf Aktivierungen exponierten
  erneut dieselbe unveränderte Position und lieferten keine neue Information.
- `match_424abdd1c7ac054d`: 155/155 Runner-Entscheidungen. D146 / StateVersion
  273 belegt die sinnvolle terminale SeeYa-Nutzung bei Korp 6/7,
  unbekanntem Remote-Root, 8 Runner-Credits und 4 Klicks.
- FD7671 D104 wurde mit aktuellem Code erneut abgespielt. Die KI installiert
  SeeYa dort nicht mehr; sie wählt Jack 'n' Joe, während SeeYa am Credit-Floor
  ausgeschlossen wird. Der historische letzte-Klick-Install ist deshalb kein
  aktueller Produktionsfehler.

## Verbindlicher Sollvertrag

### Installation

Ein Expose-Programm erhält terminalen Installationswert nur, wenn:

- die Korp am Matchpoint steht und ein unbekannter Remote-Root existiert;
- mindestens drei Klicks vorhanden sind;
- sichtbare Credits Installation plus anschließende Aktivierung decken;
- nach Installation und Aktivierung noch eine Reaktionsaktion bleibt;
- normale MU-, Duplicate-, Credit-Floor- und Überlebensregeln die
  Installation nicht ausschließen.

### Aktivierung

Eine bereits legale Expose-Aktion erhält terminale Priorität nur bei:

- gegnerischem Matchpoint;
- mindestens einem noch nicht exakt exponierten Remote-Root;
- bezahlbarer Aktivierung;
- mindestens einem verbleibenden Folgeclick.

Ein derzeit unzahlbarer direkter Run schließt SeeYa nicht automatisch aus:
Die Information kann zuerst klären, ob Pfadöffnung, Funding oder Run auf den
Remote gerichtet werden müssen. Ohne Folgeclick oder ohne neues Ziel entsteht
kein positiver terminaler Vertrag.

### Zielwahl

Die Reihenfolge bleibt side-safe und LegalActions-only:

1. fortgeschrittener unbekannter Remote-Root;
2. sonstiger unbekannter Remote-Root;
3. unbekanntes Remote-ICE;
4. zentrales unbekanntes ICE;
5. zentraler unbekannter Root.

Exakte unveränderte Wiederholungen sind stark abgewertet. Öffentliche
Install-/Move-/Swap-/Trash-Ereignisse machen nur die betroffene Position
wieder unbekannt.

## Umgesetzte Runtime-Änderungen

1. `runner-credit-yield-score` bewertet
   `cardImplementationAddsHostedCredits` nicht länger als sofort liquiden
   Credit-Ertrag.
2. `runner-credit-need-score` projiziert Niedrig-Credit- und Handkarten-
   Funding-Boni weder auf Bank-Load noch auf Cashout; diese Entscheidungen
   gehören dem dedizierten Bank-Consumer.
3. `runner-bank-investment-context` trägt den Zukunftswert nun vollständig:
   erste und mehrklickige Loads bleiben stark, ein erster Last-Click-Load
   bleibt ein guter Zukunftsschritt, ein zweiter Last-Click-Load bleibt
   positiv, aber klarer Hintergrund.
4. `runner-terminal-remote-tool-score` unterscheidet Effekt-Ausführung von
   `install_then_activate` und verlangt für die Installation das vollständige
   sichtbare Klick-/Credit-Budget.
5. Der 424A-F04-Checkpoint verlangt zusätzlich SeeYa als Raw-Score-Sieger und
   die tatsächliche Komponente `runner_terminal_remote_tool`.

Keine Karten-ID-Sonderregel, keine Hintänderung, keine Engine-/LegalAction-
Änderung und keine Hidden-Info-Auswertung wurde eingeführt.

## Vorher/Nachher

| Vertrag | Vorher | Nachher |
| --- | --- | --- |
| 424A-F04 | Broker 2062 vor SeeYa 1827 | SeeYa 1827 vor Broker 1612 |
| 424A-F01 | Broker 4157 vor Krash 2314 | Krash 2314 vor Broker 1312 |
| 424A-F06 | Broker 1612 vor Draw 898 | Draw 898 vor Broker 662 |
| gehosteter Load | allgemeiner Sofort-Yield und Funding-Boni | ausschließlich Bank-Commitment |
| SeeYa-Install mit 2 Klicks | terminaler Bonus +1800 | kein terminaler Installationsbonus |
| SeeYa-Install mit nur Installationscredits | terminaler Bonus +1800 | kein terminaler Installationsbonus |

## Verifikation

- Red Evidence vor Fix: 7 Dateien, 69 Tests, 60 grün, 9 gezielt rot.
- Fokus nach Fix: 7/7 Dateien und 69/69 Tests grün.
- 424A: alle 12 Checkpoint-/Gegenproben grün.
- FD7671: alle 9 Checkpoint-/Gegenproben grün.
- AI-Typecheck: grün.
- Vollständige AI-Suite: 348/354 Dateien und 2457/2466 Tests grün.

Die neun roten Vollsuite-Tests wurden einzeln auf unverändertem `main`
reproduziert und sind keine Regression dieses Slices:

- zwei AI-Hint-Quality-Gates wegen des bestehenden Hintstands;
- drei ECFE3CE-Broker-Planarbitrationen;
- ein Combined-Target-Broker-Checkpoint;
- ein komfortabler Broker-Cashout-Vertrag;
- DFE6-F01 und MRGSG-R&D-Planfortsetzung.

Der SeeYa-Deckaudit deckt 18/18 eindeutige und 45/45 Karten ab. SeeYa hat
keinen Blocking-Fund; die drei Audit-Blocker sind bestehende Force-Shield-
Effektüberlappungen und außerhalb dieses Scopes.

## Grenzen und Nicht-Ziele

- SeeYa wird unterhalb des gegnerischen Matchpoints nicht pauschal bevorzugt.
- Ein unbekanntes zentrales ICE allein rechtfertigt keinen terminalen Bonus.
- Der Slice löst nicht die bekannten übergeordneten Bank-Portfolio-
  Planarbitrationen oder die offene Background-Kadenz aus Match 36BA22D6.
- Kein Push und keine Remote-Integration.
