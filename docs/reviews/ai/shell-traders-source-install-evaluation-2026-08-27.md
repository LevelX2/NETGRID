# The Shell Traders: Quelleninstallation und kumulative Bewertung

Stand: 2026-08-27
Status: Implementiert und fokussiert verifiziert; erneute 40er-Metaserie ausstehend

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

## Restgrenze

SP-179 bleibt bis zu einer neuen post-fix 40er-Metaserie teilweise offen. Der
Fix belegt die Quelleninstallation und ihre Mehrkopienbewertung, nicht die
separaten Nullnutzungsursachen von Disgruntled Ice Technician, Social
Engineering oder Temple Microcode Outlet. Eine Deckänderung oder Umbenennung
ist weder erforderlich noch freigegeben.
