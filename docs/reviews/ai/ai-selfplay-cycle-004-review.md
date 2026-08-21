# KI-Selbstspielzyklus 004 – vollständige Matchanalyse

Stand: 2026-08-19
Status: vollständig analysiert; generischen Planvertragsfehler behoben und im
identischen Replay bis zum regulären Matchende verifiziert

## Reproduktionsvertrag

- Auswahlseed: `ced7adaf85f1c327099d7b7bc9535f26`
- Spielseed: `selfplay-004-492b88128585eaac4fe73d7bff7d456d`
- Auswahlmenge: 24 kuratierte Runner- und 23 kuratierte Corp-Standarddecks
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, normale KI,
  Detailtrace
- Runner: `standard_standard_runner_rent_i_con_shellspiel_2026_07_17_1.0.0`,
  45 Karten, `fnv1a:518ccd75`, Rent-I-Con: Das Shellspiel
- Corp: `standard_standard_corp_shadoe_tag_bag_1.0.0`, 48 Karten und
  17 Agendapunkte, `fnv1a:f0c0544f`, Shadoe Tag & Bag

Beide Läufe verwendeten den normalen Multiplayer-/KI-Pfad mit manueller
Einzelschrittsteuerung, jeweils einer frischen isolierten SQLite-Datenbank und
der lokalen read-only Maintenance-Analyse-API. Die Standardports und die
Main-Datenbank blieben unberührt.

| Stand                                   | Ergebnis wie im Programm             | Grund                                                         |                Entscheidungen | finaler StateHash |
| --------------------------------------- | ------------------------------------ | ------------------------------------------------------------- | ----------------------------: | ----------------- |
| Ausgangslauf `match_81da14276d2357ad`   | kein Endergebnis; Zwischenstand 2:6  | KI scheitert fail-closed vor der nächsten Runner-Entscheidung | 282 angewandt, 2 Fehlversuche | `fnv1a:dd586582`  |
| finaler Replay `match_5aba9d2141ec1d24` | Corp 10 – Runner 3; Agendapunkte 7:3 | Corp erreicht sieben Agendapunkte                             |                           327 | `fnv1a:c19c2fd5`  |

Der Ausgangslauf besitzt absichtlich kein künstlich ergänztes Resultat. Er
endet als aktives Match an der reproduzierbaren `ai_decision_failed`-Grenze.
Erst der identische frische Replaylauf ist das gültige Zyklusergebnis.

## Vollständiger Decision-Denominator

Alle 611 persistierten Entscheidungsdatensätze beider Läufe wurden aus den
Maintenance-Detailkontexten genau einmal klassifiziert.

Ausgangslauf, 284 von 284 gespeicherten Datensätzen:

- `plausibel`: 140;
- `Finding`: 2, die wiederholten Fail-closed-Versuche D283 und D284 am
  identischen Zustand;
- `trace-limitiert`: 142 reguläre Entscheidungen mit nicht vorhandenem
  normalisierten TurnPlanner-Abschnitt; Plan-First-Detailtrace,
  LegalAction-Audit und Engine-Evidence sind dennoch vorhanden;
- bis D282 keine Fallbacks, Timeouts, Seiten-, LegalAction-,
  Debug-/Apply- oder Engine-Apply-Abweichungen.

Finaler Replaylauf, 327 von 327:

- `plausibel`: 162;
- `Finding`: 0;
- `prüfbedürftig`: 0;
- `trace-limitiert`: 165 weitere Entscheidungen;
- 327 historische LegalAction-Mitgliedschaften und Engine-Anwendungen sind
  vollständig belegt; keine Fallbacks, Timeouts, Seiten-,
  Debug-/Apply- oder Validierungsabweichungen;
- alle 328 Events einschließlich Terminalzustand sind enthalten, und der
  terminale StateHash stimmt mit dem Matchresultat überein.

## Bestätigtes Finding

### Ausführbarer Plan trägt gleichzeitig einen überholten Supportbedarf

Im Ausgangslauf liegt die Corp bei sechs Agendapunkten und hat Project Babylon
in Remote 1 installiert und einmal entwickelt. Der Runner nimmt D282 einen
Credit. Am unveränderten Folgezustand scheitern D283 und der wiederholte D284
mit `priority_claim_rejected` und dem präzisen Vertragsgrund
`executable_now_with_resource_gap`.

Die Engine veröffentlicht zu diesem Zeitpunkt weiterhin zahlreiche legale
Runner-Aktionen. Der Plan `runner.contest_remote` besitzt eine aktuelle
ausführbare Route, trägt in derselben Bewertung aber noch den gebundenen
älteren Coverage-Bedarf `coverage:breaker_wall`. Damit behauptet dieselbe
Planbewertung gleichzeitig:

1. der aktuelle Route-Head ist jetzt ausführbar;
2. vor der Ausführung fehlt noch zwingende Unterstützung.

Diese Aussagen sind nach dem bestehenden Readiness-Vertrag unvereinbar. Der
Prioritätsvalidator stoppt daher korrekt fail-closed, statt still auf einen
Basic Credit oder einen anderen Plan auszuweichen.

Der generische Fix liegt im Planmodulvertrag: Exakte gebundene
Support-`ResourceGaps` werden nur in die aktuelle Bewertung übernommen, wenn
der Parent noch keinen aktuellen Route-Head besitzt. Sobald derselbe Parent
eine ausführbare Route materialisieren kann, darf der historische
Supportbedarf diese Bewertung nicht zusätzlich als supportabhängig
klassifizieren. Diese Regel gilt gemeinsam für Zentraldruck,
Remote-Contest und Kartenentwicklung; sie kennt weder Deck- noch Kartennamen.

Plan- und Choice-Ownership bleiben unverändert. Im Replay wählt
`runner.contest_remote` D284 Social Engineering. Die geheimen Payments und
die gebundene Fort-/ICE-Wahl bleiben Enginefenster; die Runfortsetzung gehört
weiterhin `runner.convert_run_window`. Es entsteht keine zweite
Entscheidungsautorität und keine erfundene zukünftige Action-ID.

Regressionstest:
`does not retain a superseded support gap when a remote contest route becomes executable`
in `packages/ai/src/plans/runner-tactical-plan-modules.test.ts`.

## Identischer Replaynachweis

Der Replay überschreitet den früheren Abbruchzustand und konvertiert die
dringende Remote-Linie vollständig:

- D282 und D283 finanzieren den erreichbaren Pfad;
- D284 spielt Social Engineering unter dem Remote-Contest-Owner;
- D285–D287 lösen die gebundenen geheimen Choices aus;
- D288–D299 führen durch beide Trace-ICE bis zum Zugriff;
- D300 stiehlt Project Babylon und reduziert den Rückstand auf 3:6.

Der Fix verhindert damit nicht nur die Exception. Er lässt den bereits
zuständigen Plan seine aktuelle legale Route tatsächlich ausführen. Der Lauf
endet anschließend regulär nach 327 Entscheidungen.

## Analyse des finalen Gewinners

Die Corp gewinnt durch eine kohärente Kombination aus früher Defense,
überlegener Economy und fortgesetzter Score-Konversion:

- Filter auf R&D und HQ beendet die ersten beiden Runner-Runs. Später erhält
  Remote 1 drei ICE-Schichten, deren Break- und Trace-Kosten die
  selbstzerstörenden Rent-I-Con-Kopien und Runner-Credits verbrauchen.
- Die Corp scoret vier Agenden: Political Coup, Corporate Coup, Netwatch
  Operations Office und Subsidiary Branch für zusammen sieben Punkte.
- Auch nach zwei erfolgreichen Runner-Diebstählen bleibt
  `corp.score_agenda` resident und führt die nächste Install-, Advance- und
  Score-Linie weiter.
- Economy-Aktionen halten die Corp im mittleren und späten Spiel dauerhaft
  bei mehr als zwanzig Credits. Rezzes und Scorekosten konkurrieren deshalb
  nicht um eine knappe Ressource.
- Kein Corp-EndTurn lässt normale Klicks ungenutzt; alle Score-, Defense-,
  Rez- und Enginefenster bleiben owner- und LegalAction-konsistent.

Die Bezeichnung Tag & Bag verpflichtet die KI nicht zu einer Kartennamenlinie.
In diesem Match ist die sichtbare Agenda-Score-Linie schneller und sicherer;
ein belegter ausgelassener Tag-/Damage-Siegpfad liegt nicht vor.

## Warum der Runner verlor

Der Runner startet neun Runs, erreicht sieben Zugriffe und stiehlt Political
Coup für zwei sowie Project Babylon für einen Punkt. Seine Niederlage entsteht
aus einem klaren Attritions- und Deck-Matchup:

- Das Shellspiel-Deck besitzt keinen dauerhaft installierten Wall-Breaker.
  Rent-I-Con kann jede Subroutine brechen, zerstört sich aber nach dem Run.
  Mehrere frühe R&D- und Remote-Runs verbrauchen die verfügbaren Kopien.
- Die dreifach geschützte Score-Remote verlangt deshalb wiederholt neue
  Coverage. Social Engineering liefert einmal eine alternative
  Bypass-/Trace-Linie und rettet bei D300 Project Babylon.
- Vor der letzten Subsidiary-Branch-Linie meldet die Deckanalyse
  `deckHasAnswer: false` für die fehlende Wall-Abdeckung. Airport Locker hat
  keinen verbleibenden passenden Suchtreffer; Running Interference verteuert
  das Rezzen, bricht aber keine Wall-Subroutine.
- Die Credit-Züge D308–D311 und D319–D322 wirken angesichts des Matchpoints
  passiv, sind nach Alternativenprüfung aber kein belegter Fehler. Der
  Remote-Run ist ohne Wall-Abdeckung nicht passierbar, Archives hat keinen
  Agenda-Payoff, und es existiert keine legal veröffentlichte Recovery-Linie.
- Die Corp entwickelt Subsidiary Branch über zwei Züge und scoret D327 zum
  7:3. Der Runner verliert damit nicht durch einen ignorierten legalen
  Gewinnerpfad, sondern weil seine verbleibenden Karten die sichtbare
  Remote-Defense nicht mehr abdecken.

Gesamturteil: Das ursprüngliche Runtime-Finding ist vollständig behoben. Der
finale Runner-Verlust ist überwiegend ein ungünstiges
Coverage-/Attritions-Matchup und trägt keinen weiteren klaren KI-Fix oder
neuen Verdachtsfall.

## Zyklusübergreifende Einordnung

Der Fall wird als SP-012 in der Indizienmatrix geführt und ergänzt SP-010:
Ein dringender Remote-Parent muss nicht nur Support korrekt aufnehmen und
danach zurückkehren; seine Assessment-Readiness muss beim Auftauchen einer
alternativen aktuellen Route ebenfalls widerspruchsfrei wechseln.

Zyklus 004 liefert zugleich ein wichtiges Gegenbeispiel für SP-011. Zusätzliche
zentrale ICE-Schichten sind nicht allgemein schlecht, nur weil ein
Universal-Breaker sichtbar ist. Gegen das selbstzerstörende Rent-I-Con
erzeugen die Schichten realen Attritionswert. SP-011 bleibt deshalb eng auf
zusätzliche ICE gegen dauerhaft kostenlose passende Abdeckung und einen
fehlenden belegten Grenznutzen begrenzt.

## Verifikation und Dokumentationsprüfung

- Der neue Reproduktionstest war vor dem Fix rot und ist danach grün.
- Die gesamte direkt betroffene Testdatei und die angrenzenden
  Prioritätsvertragsprüfungen bestehen mit 43 von 43 Tests.
- Der identische Replaylauf endet regulär und enthält 327 vollständig
  geprüfte Entscheidungen ohne Fallback, Timeout, Apply- oder
  LegalAction-Abweichung.
- Die Architektur dokumentiert nun die gegenseitige Ausschließlichkeit von
  aktuellem Route-Head und offenem Support-`ResourceGap` in derselben
  Planbewertung.
- Der AI-Typecheck erreicht ausschließlich sechs vorbestehende
  Baselinefehler: zwei `possibly undefined`-Diagnosen außerhalb der
  geänderten Pfade und vier fehlende CardSpec-Migrationsreports. Keine
  Diagnose betrifft den Zyklusfix.

Die zyklusübergreifende Verdichtung liegt in
[der KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
