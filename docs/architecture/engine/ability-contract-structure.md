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

`RunState.startOfRunIceRepositionOpen` markiert das Fenster vor der ersten
Begegnung beziehungsweise Passage. Die Engine bietet kanonische mobile
ICE-Aktionen auch vor bereits gerezztem äußerem ICE und vor dem Zugriff auf
einen ICE-leeren Fort an. Begegnung, Passage und das Schließen des leeren
Startfensters entfernen die Markierung; eine spätere Approach-Position öffnet
sie nicht erneut. Der Dispatcher führt auch
`move_self_to_outermost_position_on_other_fort` über den Fort-Run-Resolver aus.
Das ist keine allgemeine Root-Rez-Freigabe am Runstart. Eine bereits geöffnete
Corp-Priorität führt nach der letzten verfügbaren Root-Rez am leeren Fort
regulär in das Runner-Fortsetzungsfenster zurück.

Für mobiles ICE quotiert
`game/view/visible-mobile-ice-move-quote.ts` die physische Bewegung und Zahlung
sowie den öffentlichen ICE-Pfad vor und nach dem Zonenwechsel. Die Quote
`corpMobileIceMoveQuoteJson` bindet Action, Quelle, Herkunfts-/Zielfort und
StateVersion. Version `corp-mobile-ice-move-v2` bindet zusätzlich einen nötigen
festen Rez und die Credits sowie Agenda-Punkte nach der vollständigen Folge.
Die Projektion der ungerezzten eigenen Quelle verwendet die bestehenden
Rez-Kosten- und Post-Rez-Verträge. Agenda-Punkte bezahlt sie auf ihrem eigenen
State-Klon mit derselben deterministischen Transition
`game/state/corp-agenda-point-cost.ts` wie die Ausführung. Ungerezzte weitere
Zielschichten, variable Rezzes und unprojizierte On-Rez-Effekte bleiben
unvollständig. Die Quote ist Corp-privat; gegnerische Handkarten werden nicht
projiziert. `applyAction` validiert und bezahlt weiterhin jeden tatsächlich
angebotenen Schritt erneut.

Die normale Runner-Run-Aktion kann eine akteursprivate
`runnerPostBreakTrashQuoteJson` tragen. Der Producer
`game/turn/runner-post-break-trash-quote.ts` bindet eigene Hand-/Rig-Quellen und
aktuell gerezzte ICE-Ziele an Aktion, Server und StateVersion. Die Kosten kommen
aus demselben `rezCostForCard` wie das spätere Post-Pass-Fenster; unbekannte
ICE-Identitäten und gegnerische Handkarten werden nicht projiziert. Diese Quote
garantiert keine zukünftige Legalität. Die später tatsächlich angebotene
Post-Pass-Trash-Aktion trägt ihre kanonische Capability-ID und `abilityRef`;
`applyAction` validiert und bezahlt die aktuelle Engine-Aktion erneut.

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

Bei Corp-ICE-Installkosten übernimmt die Engine die Richtung jedes aktiven
Modifikators in `CostModifierQuote.kind`: `increase` bleibt Aufschlag,
`reduce` wird `reduction`. Quote, LegalAction-Kosten und Payload müssen dieselbe
Aufteilung und denselben Endbetrag ausweisen. Ein Aufschlag darf weder als
Reduktionsbetrag noch als Reduktionsquelle erscheinen. Die Defense-KI prüft
diese Übereinstimmung vor der Zulassung ihrer Installationsroute.

Die gemeinsame Corp-Installations-/Rez-Zahlung in
`card-lifecycle-runtime-hosts.ts` verbraucht auch rungebundene Credits.
Alle temporären Pools sind bereits im angezeigten Guthaben enthalten.
Eine Zahlung wird daher nur einmal zugeordnet: zuerst dem aktuellen
Tracepool, danach dem Runpool, zuletzt dem Installations-/Rez-Pool des Zuges.
Die jeweilige Abschlussbereinigung entfernt ausschließlich ungenutzte Reste.

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
Program-Hosts über den gemeinsamen `canHostProgramOnDaemon`-Vertrag. Die
Zielquote berücksichtigt ausdrücklich entfernbare installierte Programme im
jeweiligen Host. Auch ein voller Host bleibt damit wählbar, wenn die neue
Karte nach entsprechendem Trash dessen MU- und Kartenanzahlgrenzen einhält.
Karteneignung und übrige Hostingregeln werden dabei nicht gelockert.

Der Runner wählt vor Counterentfernung und Installation zwischen normalem
Programmspeicher und einem passenden installierten Host. Reicht dessen
Kapazität nicht aus, folgt eine an diesen Host gebundene Programmtrashwahl;
sie bietet ausschließlich dessen installierte Programme an. Das Freigeben
von Hostspeicher verändert die normalen Runner-MU nicht. Die normale
Installation verwendet weiterhin ihre eigene MU-Freigabe.

Hostexistenz, ausgewählte Programme, verbleibende Kapazität, Zielkarte,
Quelle und letzter Counter werden bei der Auflösung erneut validiert.
Unzureichende, fremde, doppelte und veraltete Auswahlen scheitern ohne
Zustandsänderung. Erst nach erfolgreicher Freigabe werden letzter Counter
und Installation abgeschlossen. Die gemeinsame Rig-Finalisierung setzt `hostedOn` und
belastet bei Hosting keine Runner-MU; On-install-Effekte bleiben erhalten.
Bezahlte Counterentfernung und Zugbeginn nutzen dieselbe Platzierungswahl;
der Zugbeginn wird erst nach abgeschlossener Platzierung beziehungsweise
anschließender Speicherfreigabe fortgesetzt. Die Originalset-Regressionen
prüfen volle/freie normale MU, bezahlte und Startzug-Installation, Evil Twin,
Cloaks Installations-Credits, Mehrfachtrash, Revalidierung und Replay/StateHash.

## Öffentliche Runner-Vorbereitung

`visibleProgramHostInstallVariants` projiziert aus sichtbarem Programm und Rig
freie zulässige Hosts, belegte MU, Anzahlgrenzen, Subtypgrenzen und die resultierende
Breaker-Stärke. Unbekannte erforderliche Fakten liefern eine explizite unvollständige
Quote. Dies autorisiert keine Installation; LegalActions und applyAction bleiben
maßgeblich. Die Projektion umfasst freie Hostplätze, keine zukünftigen Programm-
Trash- oder Austauschentscheidungen.

Die PlayerView veröffentlicht außerdem `runnerNextTurnCreditClicks` als konservativen
Basishorizont: normale nächste Runner-Aktionen abzüglich bestehender Aktionsschuld
und eines reservierten Run-Klicks. Zusätzliche freiwillige Kartenaktionen, neue
Handkarten und optionale Einkommen sind nicht enthalten. Die Projektion liest
keine gegnerische Hand und verändert den Spielzustand nicht.

## Verpflichtende Kreditzahlungen

Im aktuellen ICE-Approach kann eine kostenlose reine Root-Rez die gebundene
Discount-Rez des bereits angegriffenen ICE vorbereiten. Die actor-private
`CorpRootRezDiscountedIceQuote` verwendet dieselben Quellenlimits und
`quoteCorpRezCost` wie die wirkliche nächste Aktion. Sie verändert keinen
Zustand und enthält keine zukünftige Action-ID. Rezz-Effekte außerhalb der
reinen Discount-Fähigkeit, variable ICE und Zusatzkosten erhalten diese
begrenzte Quote nicht. Ausführung und StateHash bleiben unverändert; jede
tatsächliche Folgeaktion wird nach dem Rez neu erzeugt und validiert.

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

## Aktivierte Fähigkeiten nach der letzten Runneraktion

Die Runner-Hauptphase hält bezahlbare deklarative aktivierte Fähigkeiten
auch bei null verbleibenden Basisaktionen offen. Der kanonische Generator
prüft Timing, aktuelle Kosten, Counter, Ziele und Limits; eine fehlende
Basisaktion sperrt nur tatsächlich aktionspflichtige Fähigkeiten. Vor dem
Zugende stehen daher kostenlose Socket-Konversionen weiter zur Verfügung.
`applyAction` revalidiert unverändert Seite, StateVersion und Kosten.
