# AI Opening, Trace und Forced-Decision Evidence 2026-07-12

## Datenbasis

- Ausgangspunkt: erstes Spiel der zuletzt abgeschlossenen Matchserie, Match
  `match_a199d04c94d5a906`.
- Beobachtete historische Corp-Starthand: Closed Accounts, City Surveillance,
  Audit of Call Records, Scorched Earth und Systematic Layoffs.
- Beobachtetes Trace-Fenster: Basisstärke 5 gegen 11 sichtbare Runner-Credits,
  während Closed Accounts und Scorched Earth als bekannte Folgepayoffs in HQ
  lagen.
- Diagnosefund: alternativlose Zugenden und Single-Option-Choices konnten in
  der Auswertung wie vermeidbare schlechte Entscheidungen erscheinen.

## Ursache 1 – Opening-Rollen waren nicht ausführbarkeitsgebunden

Die Corp-Starthandbewertung zählte Kartenrollen, unterschied aber nicht sicher
zwischen bloß vorhandenen Strategieteilen und einer in der Starthand
ausführbaren Linie. Zusätzlich konnten breite Rolleninferenzen Operationen und
Assets fälschlich als frühe Liquidität behandeln. `Systematic Layoffs` wurde
wegen einer Teilzeichenkette in seiner Rolle sogar als Agenda gezählt.

Die Bewertung verwendet nun echten sichtbaren Kartentyp beziehungsweise den
strukturierten Hint-Typ für Agenda und ICE. Liquidität zählt nur, wenn ein Hint
tatsächlich Corp-Credits erzeugt. Die Deckstrategie wirkt über ihre primären
und sekundären Linien hinein; eine Linie zählt nur als ausführbar, wenn ihre
Anker, Enabler, Bedingungen, Schutz- und Liquiditätsanforderungen in der
konkreten Hand zusammenpassen.

Die historische Hand erhält dadurch:

- `opening_agendas:0`;
- `opening_ice:0`;
- `opening_economy:0`;
- `opening_executable_strategy_lines:none`;
- `opening_viability_cap:42`.

Legitime Gegenbeispiele bleiben erhalten: Eine liquide Fast-Advance-Hand darf
ohne ICE gehalten werden; eine geschützte Tag-Punish-Hand mit Quelle und
Payoffs ebenfalls.

## Ursache 2 – Trace-Gebote kannten den Folgepayoff nicht

Die bisherige Schwierigkeitsheuristik bot auf `hard` konservativ bis 2 und
bewertete nicht, ob der laufende Trace eine unmittelbar ausführbare
Tag-Punish-Linie eröffnet. Der Choice-Resolver kennt jetzt ausschließlich aus
side-sicherem Kontext:

- öffentliche Trace-Stärke und Runner-Link;
- sichtbare Runner-Credits;
- eigene Credits und verbleibende Klicks;
- bekannte eigene HQ-Payoffs mit strukturiertem
  `tag_punish_payoff` und `requires_runner_tagged`;
- bekannte Kosten des billigsten Folgepayoffs.

Das kleinste garantiert erfolgreiche Gebot ist
`Runner-Link + Runner-Credits - Trace-Stärke + 1`. Es wird nur gewählt, wenn
danach mindestens ein Klick und genügend Credits für den billigsten sichtbaren
Payoff verbleiben. Im historischen 5-gegen-11-Fenster ist das `bid_7`. Ohne
Payoff, ohne Folgeklick oder ohne bezahlbare Reserve bleibt das konservative
Gebot erhalten.

## Ursache 3 – Entscheidungsmöglichkeit und Rohscore waren vermischt

Jede Runtime-Entscheidung trägt jetzt eine Klassifikation:

- `competitive`: mindestens eine echte Auswahlmöglichkeit;
- `forced_terminal`: nur eine terminale Aktion wie `end_turn`;
- `forced_choice`: ein Choice-Fenster mit höchstens einer auswählbaren Option.

LegalAction-Anzahl und Zahl handlungsrelevanter Alternativen werden separat in
Evidence und Simulationseintrag festgehalten. Forced-Fälle behalten ihren
vollständigen Rohscore und Debug-Breakdown, werden beim Mining aber nicht mehr
als `clearly_dominated_plan_choice` gewertet. Ein Trace mit mehreren
Gebotsoptionen bleibt ausdrücklich `competitive`, auch wenn seine einzige
LegalAction `resolve_choice` lautet.

## Testrealismus

Die neuen Regressionen testen nicht nur Hilfsfunktionen:

- Die historische Starthand wird aus einem echten Engine-Setup mit realer
  Corp-PlayerView, realem `setup.mulligan` und echter `resolve_choice`-
  LegalAction aufgebaut und durch `chooseCorpAction` geführt.
- Das historische Trace-Fenster läuft durch den öffentlichen
  `chooseCorpAction`- und Choice-Vertrag bis zur ausgewählten Option `bid_7`.
- Das alternative-freie Zugende läuft durch den öffentlichen Chooser und
  muss trotz `forced_terminal` seinen Score-Breakdown behalten.
- Unit-Gegenproben sichern bezahlbare, unbezahltbare, payofflose und weiterhin
  legitime Opening-/Trace-Situationen ab.

## Grenzen

- Keine Engine-Regel, LegalAction oder PlayerView wurde geändert.
- Keine verdeckte Runner-Zone wird ausgewertet.
- Keine Karte wird über ihren Namen sonderbehandelt; produktive Entscheidungen
  verwenden strukturierte Typen, Hint-Effekte, Bedingungen und Strategielinien.
- Credit-vs-Draw, BBS-Nutzung, finite Economy und Planportfolio bleiben bewusst
  außerhalb dieses Pakets.
