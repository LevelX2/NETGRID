# Ability Contract Structure

Status: current

## Ziel

Die CardImplementation-Verträge sind eine rein deklarative, engine-lokale
Sprache. Sie beschreiben zulässige Fähigkeiten, Effekte und Modifikatoren,
führen aber keine Regeln aus, lesen keinen `GameState` und enthalten keine
konkreten Karten-IDs.

`definition-types.ts` bleibt als kleiner Kompatibilitätsknoten bestehen. Neue
Imports dürfen ihn weiter verwenden; neue Verträge werden jedoch in der
passenden Familie definiert.

## Familien

| Modul                              | Verantwortung                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `definition-core-contracts.ts`     | gemeinsam verwendete Blattverträge für Bedingungen, Kosten, Limits, Access-Zonen und Subroutinen |
| `definition-effect-contracts.ts`   | von der Rules Engine interpretierte Effektkommandos                                              |
| `definition-modifier-contracts.ts` | Kosten-, Stärke-, Prevention-, Trace- und Encounter-Modifikatoren                                |
| `definition-ability-contracts.ts`  | On-play-, Activated-, Lifecycle- und direkte Ability-Verträge                                    |
| `definition-domain-contracts.ts`   | Access-, Run-, Utility-, Lifecycle- und Scored-Agenda-Domänen                                    |
| `definition-card-contracts.ts`     | oberste Ability- und Modifier-Unions für CardImplementations                                     |

Die Abhängigkeitsrichtung verläuft von den Blattverträgen zu Effekten und
Modifikatoren, anschließend zu Ability-/Domänenverträgen und zuletzt zu den
obersten Card-Unions. Zwischen den Familien existiert kein Importzyklus.

## Stärke beim Verlassen der Runner-Installation

Die Runner-Lifecycle-Pfade für Trash, Batch-Trash, Rückgabe und Entfernung aus
dem Spiel bereinigen die Stärke der verlassenen Installation nach dem
Zonenwechsel. Dasselbe gilt beim Ablegen eines Programms auf Backup-Speicher.
`clearDepartedBreakerStrength` entfernt den Instanzmodifikator sowie an dieses
Ziel gebundene Run-/Zugboni und aufgelöste Runstart-Stärke. Andere Ziele und
deren bereits erzeugte Boni bleiben erhalten, auch wenn die verlassene Karte
deren ursprüngliche Quelle war. Eine Wiederverwendung derselben Karten-ID
übernimmt keine Stärke aus der früheren Installation. Die PlayerView zeigt
den bereinigten Engine-Zustand; die UI kaschiert keine verbliebenen Boni.

## Verfügbarkeit gebundener Effektziele

`canResolveOnPlayCardImplementationAbility` prüft vor dem Erzeugen einer
LegalAction, ob der deklarierte Effekt seine erforderlichen aktuellen Ziele
noch auflösen kann. Ein erfolgreicher Run bleibt Turnhistorie, auch wenn der
betroffene Remote beim anschließenden Trash seiner letzten Karte verschwindet.
Der Effekt `trash_rezzed_ice_on_last_successful_run_fort_and_add_tags` benötigt
dagegen weiterhin einen existierenden Fort. Ein existierender Fort ohne rezzed
ICE erfüllt diese Zielbindung; dessen leere Zielmenge wird regulär gequotet.
Quote und Ausführung behalten ihre strikten Bindungsprüfungen.

## Verzögerte Programminstallation

Beim letzten Shell-Counter prüft die verzögerte Installation legale
Program-Hosts über den gemeinsamen `canHostProgramOnDaemon`-Vertrag. Sind
Hosts verfügbar, wählt der Runner vor Counterentfernung und Installation
zwischen dem normalen Programmspeicher und einem passenden installierten
Host. Nur die normale Installation fordert bei MU-Mangel Programmtrash.
Hostkapazität, Zielkarte, Quelle und letzter Counter werden bei der Wahl
erneut validiert. Die gemeinsame Rig-Finalisierung setzt `hostedOn` und
belastet bei Hosting keine Runner-MU; On-install-Effekte bleiben erhalten.
Bezahlte Counterentfernung und Zugbeginn nutzen dieselbe Platzierungswahl;
der Zugbeginn wird erst nach abgeschlossener Platzierung beziehungsweise
anschließender Speicherfreigabe fortgesetzt.

## Verpflichtende Kreditzahlungen

Aktive verpflichtende Corp-Kreditzahlungen stammen aus dem aktuellen
Engine-Zustand, nicht aus Karten im Archiv oder historischen Kreditaufnahmen.
Die eigene Corp-PlayerView trägt bei aktiver Verpflichtung
`corpEndTurnCreditObligation` mit aktuellem Betrag, StateVersion,
Corp-Zugende als Deadline und Niederlage bei Nichtzahlung. Die Runner-Sicht
erhält dieses private Planungsfeld nicht. Projektion und Anwendung verändern
die bestehende Zahlungs- und Ablöseregel nicht.

## Agenda-Anforderung

`effectiveAgendaDifficulty` verbindet die gedruckte Anforderung mit aktiven
deklarierten `agenda_difficulty`-Modifikatoren und dem ausdrücklich gebundenen
Server-Run-Counter-Zuschlag. PlayerView, Installations-/Score-Quotes,
LegalActions und Ausführung verwenden diese gemeinsame Berechnung.
`fortRunWindows` beschreibt ausschließlich Run-Zulässigkeit; daraus wird kein
Agenda-Rabatt abgeleitet. Ein Regionsrabatt wie Washington wird nur einmal über
den deklarierten Modifikator angewendet.

## Gleichzeitige Lifecycle-Fähigkeiten

`CardLifecycleTriggeredAbilityImplementation.simultaneousResolution` ist eine
ausdrückliche Autoren-Garantie, keine aus den Effekten geratene Optimierung.
`order_independent_between_copies` erklärt ausschließlich, dass gleichzeitig
fällige Kopien derselben Kartendefinition unter dem aktuellen Regelvertrag in
beliebiger Reihenfolge aufgelöst werden dürfen.

Eine Runtime darf diese Garantie nur verwenden, wenn alle offenen Quellen
Kopien derselben Definition sind, jede fällige Lifecycle-Fähigkeit die Garantie
trägt und keine Quelle einen zusätzlichen Startpfad besitzt. Gemischte,
unmarkierte oder mehrdeutige Mengen bleiben fail-closed bei der regelkonformen
Spielerwahl. Der Vertrag autorisiert weder Karten-ID-Sonderfälle noch eine
allgemeine Äquivalenzanalyse beliebiger Effekte.

## Guard

`check:engine-source-structure` begrenzt `definition-types.ts` auf 20 Zeilen,
erwartet genau sechs Familienmodule, begrenzt jedes auf 1.200 Zeilen und
verwirft ausführbare Statements. Damit kann weder der frühere Monolith noch ein
neuer Runtime-Seiteneffekt unbemerkt zurückkehren.
