# The Shell Traders: Quelleninstallation und kumulative Bewertung

Stand: 2026-08-27
Status: Implementiert, fokussiert und durch erneute 40er-Metaserie verifiziert

## Ausgangsbefund

Die 40-Seed-Metaserie 316 (`Rent-I-Con: Das Shellspiel` gegen
`Neon Guillotine`) zeigte einen stabilen Zweckkonversionsfehler: The Shell
Traders war in 33 Spielen auf der Hand sichtbar und wurde über beide
20er-Hälften hinweg kein einziges Mal gewählt. Die Engine bot die
Installationsaktion legal an, und die DeckDoctrine erkannte bereits die
kohärente Linie `runner.engine.delayed_install` mit dem Provider
`runner.staging.delayed_install` und der Additivität
`additive_by_trigger_cadence`.

Die Ursache lag in der Handentwicklung: Der persistente Installer kannte
weder eine eigene Rolle noch einen persistenten Engine-Typ. Deshalb wurde die
erste Kopie als `unknown` mit schwacher Passung bewertet; weitere Kopien
fielen in die generische redundante Duplikatbewertung.

## Gültiger Bewertungsvertrag

- Ein persistenter, wiederholbarer `install`-Effekt mit dem Ziel
  `setup.install_countdown` wird kartengenerisch als
  `delayed_install_engine` mit der Fähigkeit `install` erkannt.
- Die Installation der Quelle gehört weiterhin ausschließlich
  `runner.develop_board_and_hand`. Nach Installation und neu beobachtetem
  Zustand bleiben Zielwahl und Countdown-Fortschritt Eigentum von
  `runner.shell_traders_pipeline`.
- Eine erste Kopie wird nur bei kohärenter Delayed-Install-DeckDoctrine,
  sichtbarem kostenpflichtigem Programm-/Hardwareziel oder bereits
  gestagtem Shell-Counter-Bedarf zugelassen. Ohne diese Evidence bleibt die
  Route blockiert.
- Mehrere Quellen sind wegen zusätzlicher Startzug-Trigger kumulativ. Der
  Grenznutzen sinkt deterministisch mit den bestehenden Faktoren
  `1,0 / 0,6 / 0,3 / 0,15`; dadurch bleiben zweite und dritte Kopie bei realem
  Bedarf nützlich, ohne beliebig viele Kopien gleich hoch zu bewerten.
- Die Entscheidung verwendet ausschließlich eigene sichtbare Hand-, Rig-,
  Set-aside-, Doctrine- und aktuelle LegalAction-Daten. Es entstand weder
  eine neue Choice- noch eine zweite Strategieautorität.

## Verifikation

- Der historische Entscheidungszustand
  `cp-081-g3-terminal-reserve-consumption-d336.json` bewertet The Shell
  Traders nun als `delayed_install_engine`, `strong`, `useful_now`,
  `ready_now` und `new_coverage`; die vorhandene Installationsaktion bleibt
  exakt gebunden. Der Install-Fit steigt im Zustand von `80` auf `950` und
  die Gesamtpriorität von `57` auf `1000`.
- Ein Plan-First-Regressionstest wählt dieselbe Installationsaktion über
  `runner.develop_board_and_hand`; Root/Executor und Action-ID bleiben
  unverändert.
- 80 fokussierte Shell-, Doctrine-, Handentwicklungs-, Cashout-, Rotation-
  und Contract-Tests sowie alle 293 Tests von
  `plan-first-live-runtime.test.ts` sind grün. Der AI-Typecheck und die
  Formatprüfung sind grün.
- Der generische Quellenstruktur- und Metadatencheck ist grün. Der
  übergeordnete Karten-ID-Guard bleibt an zehn bereits vorhandenen,
  sachfremden Ausnahmen rot; der Shell-Traders-Fix erzeugt keinen neuen
  Treffer.
- Die vorläufige Working-Tree-Verhaltensbaseline umfasst 60 Spiele und ist
  zur Kontrollbaseline vom 2026-08-25 kompatibel. Sie enthält weiterhin
  dieselben drei klassifizierten Action-Limit-Spiele und denselben
  vorzeitigen Runner-Endzug, aber keine Illegal Actions, Replayfehler,
  Fallbacks, Timeouts, Runtimefehler oder Hidden-Info-Funde. Da das
  Standardpanel kein Shell-Traders-Deck enthält und beide Läufe rote
  Action-Limit-Spiele besitzen, ist sie nur Regressions- und keine
  Stärke-Evidence.

## Laufzeitnachfund aus dem Kontrolllauf

Der erste technische Anlauf für Pairing 317 erreichte im Seed
`meta-317-postfix-final-007` zwei installierte Exemplare von The Shell Traders.
Die Engine öffnete korrekt `runner_start_order_175` mit beiden Quellen, die KI
kannte den kartengenerischen Delayed-Install-Countdown jedoch noch nicht als
zulässiges Profil dieser reinen Quellenreihenfolge. Der Anlauf wurde deshalb
vor dem finalen Nenner als Laufzeitfehler ausgeschlossen.

Der Choice-Pfad erkennt nun
`hiddenReplacementLongtail.kind = delayed_install_with_counter_countdown` mit
der vorgeschriebenen Hidden-Info-Sichtbarkeit kartengenerisch. Er wählt in der
exakt gebundenen Engine-Reihenfolge nur eine der gleichartigen fälligen
Quellen; die spätere Zielkarte bleibt vollständig Eigentum der bestehenden
Shell-Traders-Pipeline. Action-ID, Executor und Choice-Vertrag ändern sich
nicht. Der Same-Seed-Replay `match_d4954b170d7fea7c` lief anschließend mit
432 Entscheidungen, sieben erfolgreich aufgelösten Runner-Startreihenfolgen,
`FLAGS=0` und terminalem Runner-Sieg durch Korp-Deckout durch.

Ein zweiter ausgeschlossener Anlauf erreichte im Seed
`meta-317-final-033` nach einer Trace-Gebotswahl ein Engine-gebundenes
Runner-Zahlungsfenster. Die KI hatte die ursprüngliche Planherkunft korrekt
gesichert, konnte aber die einzige verfügbare Swiss-Bank-Unterstützung nicht
unter diesem Owner ausführen. Nach der Unterstützung ging außerdem die
aktualisierte Fensterbindung verloren, weil der neue Portfolio-Stand noch die
alte `stateVersion` trug. Beide Fehler lagen in der generischen
Zahlungsfortsetzung und nicht in The Shell Traders oder im Deck.

Die Plan-First-Laufzeit führt nun genau eine, auf die ursprüngliche Action
gebundene Runner-Zahlungsunterstützung unter dem erhaltenen Root und Executor
aus. Bei mehreren Alternativen bleibt die strategische Wahl beim zuständigen
Plan. Fenster-ID, ursprüngliche Action-ID und Zustandsversion werden bei jedem
Schritt fail-closed geprüft und fortgeschrieben. Der erfolgreiche
Same-Seed-Replay `match_c68f8cab1dd40c03` wählte bei Entscheidung 177 die
Swiss-Bank-Unterstützung und setzte bei Entscheidung 178 dieselbe
`runner.pressure_central`-Planinstanz mit `runner.resolve_choice` fort. Er lief
mit 206 Entscheidungen, `FLAGS=0` und terminalem Runner-Agendasieg durch.

Der danach vollständig neu gestartete Nenner deckte im Seed
`meta-317-final-clean-003` eine angrenzende Fortsetzungslücke auf: Ein
planselektiertes Draw-Event öffnete zuerst das Runner-Zahlungsfenster und
anschließend über City Surveillance mehrere Draw-Tax-Choices. Beim Persistieren
der abgeschlossenen Zahlungsfortsetzung wurde die mögliche nachfolgende
Draw-Choice noch auf der ursprünglichen Zustandsversion gehalten. Der technische
Anlauf wurde erneut vollständig verworfen.

Die Zahlungsfortsetzung übernimmt eine solche vorhandene Immediate-Choice-
Bindung nun ausschließlich bei exakter Übereinstimmung von ursprünglicher
Action, Root, Executor und konsekutiver Engine-Zustandsversion. Sie schreibt nur
deren Zustandsanker fort; die Auswahl der Draw-Tax- und Draw-Replacement-Choice
bleibt bei den vorhandenen Engine- und Choice-Ownern. Der Same-Seed-Replay
`match_80208fec6e8cb955` lief mit 482 Entscheidungen, `FLAGS=0` und terminalem
Runner-Sieg durch Korp-Deckout durch.

## Restgrenze

### Finale Post-Fix-Metaserie 317

Der vollständig neu gestartete finale Nenner umfasst genau 40 terminale
Basisspiele auf dem unveränderten Quellcommit
`7e8d4c2b15d89129fa8ff50d27aafc6bd1eb504b`. Alle 11.335 Entscheidungen,
40 Verlustperspektiven und 52 Karten im Deckpaar sind erfasst; es bestehen
keine Runtime-, Fallback-, Timeout-, Auswahlabweichungs- oder Capture-Flags.
Rent-I-Con gewann 31:9; die beiden 20er-Hälften endeten 13:7 und 18:2. Wegen
anderer Seeds und eines anderen KI-Commits ist die alte 34:6-Serie kein
gepaarter Stärkevergleich.

Der direkte Shell-Nutzungsnachweis ist dagegen eindeutig:

- Paarung 316 vor dem Fix: 33 Spiele mit Handkontakt, 1.676 legale
  Entscheidungszustände und `0:0` Nutzungen.
- Paarung 317 nach dem Fix: 28 Spiele mit Handkontakt, 1.556 legale
  Entscheidungszustände und `601:215` Kartenaktionen. Darin enthalten sind
  49 Quelleninstallationen (`26:23`), 97 Set-aside-Schritte und 670
  Countdown-Schritte.
- The Shell Traders wurde in allen 28 Partien genutzt, in denen die Karte in
  der Hand beobachtet wurde. Gleichzeitig blieben die Schutzgrenzen aktiv:
  redundante Ziele und Null-Counter-Vorbereitung wurden abgelehnt.

Die Metaebene bestätigt damit den namensgebenden Deckplan: Shell Traders
staffelt teure Programme und Hardware, mehrere Quellen beschleunigen den
Countdown und Rent-I-Con wird innerhalb derselben Rig-/Wirtschaftslinie
häufig installiert, gepumpt und zum Brechen eingesetzt. Der Runner startete
410 Runs, führte 342 Zugriffe aus und stahl 119 Agenden. Seine klare
Restschwäche sind vier Flatlines nach zu schwacher früherer Tag-, Credit- und
Handkartenreserve.

SP-179 ist nur für Shell Traders geschlossen verifiziert. Temple Microcode
Outlet verbesserte sich von `4:0` auf stabile `7:5` Nutzungen. Social
Engineering blieb trotz 777 legaler Zustände `0:0`; Disgruntled Ice
Technician wurde bei 944 legalen Zuständen nur `1:0` genutzt. Diese getrennten
Owner- und Bewertungsfragen bleiben offen.

Die Corp-Doktrin funktioniert teilweise: fünf Agendasiege und vier Flatlines
belegen beide Gewinnwege, aber Datapool, Netwatch Credit Voucher und Trojan
Horse bleiben serienübergreifend `0:0`. Solo Squad ist neu bei 188 legalen
Zuständen `0:0`; Dedicated Response Team und Schlaghund erreichen jeweils nur
`1:1`. Das ist vor einem Deckumbau als KI-Konversionsproblem zu isolieren.
Der Bericht enthält deshalb bewusst keinen Austauschvorschlag. Eine
Deckänderung oder Umbenennung wurde weder vorgenommen noch freigegeben.

Die vollständige HTML-Auswertung ist als Report
`meta-series-317-shell-postfix` zusammen mit Pairing 317, den 40 Spielen,
allen Kartenmetriken, Fällen SP-174/SP-179/SP-180/SP-182 bis SP-184 und vier
Fixnachweisen im zentralen Selfplay-Evidenzregister gespeichert und an das
eigene Gmail-Konto zugestellt.
