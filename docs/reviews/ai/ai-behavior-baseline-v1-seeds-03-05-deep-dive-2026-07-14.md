# AI Behavior Baseline v1: Seed 03 und Seed 05 Deep Dive

Status: verifiziert

Kandidat: `4dfe4b80a`

Slot: `strategy_panel_hybrid_score_punish_cheap_bag`

Runner: `Blink Pressure Rig`

Korp: `Cheap Bag of Tricks`

## Methode und Zählweise

Die Analyse verwendet den vorhandenen redaktierten Rohtrace
`data/local/ai-behavior-baseline-v1-match-e676-remediation-2026-07-14-raw.json`.
Es wurde kein weiterer Benchmarklauf gestartet. Jede Aktionsnummer in diesem
Dokument ist einsbasiert; das Rohfeld `actionIndex` ist nullbasiert und daher
um eins kleiner.

Der Trace enthält LegalAction-Anzahlen, Auswahlroute, Scores, Plan-Mapping,
öffentliche Zustandsdaten und sichere Diagnosemerkmale. Er enthält absichtlich
nicht bei jeder Entscheidung sämtliche Karten-IDs und Alternativen. Die
Zuordnung der wiederholten `+2`-Runner-Fähigkeit zu `Newsgroup Filter` und der
Trace-Agenda-Fähigkeit zu `Netwatch Operations Office` ist eine eindeutige
Ableitung aus Deckliste, Effekt, Kartentyp und Aktionsfolge, aber kein
unredigiertes Tracefeld.

## Seed 03

Endstand nach 480 Aktionen: Runner 4, Korp 3; Action Limit nach 79
abgeschlossenen Zügen und dem Beginn des nächsten Zugfensters.

### Chronologische Rekonstruktion

| Züge  | Aktionen | Ablauf und Bewertung                                                                                                                                                                                                                                                                                                                                                                                |
| ----- | -------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–2   |     1–16 | Die Korp installiert sofort ICE vor HQ, R&D und einem neuen Remote. Der Runner probt R&D, nutzt `Loan from Chiba` als temporäre Liquidität, installiert ein teures Programm und startet einen zweiten R&D-Run. Das ist aggressiv, aber deckgerecht und in sich schlüssig.                                                                                                                           |
| 3–6   |    17–38 | Die Korp erweitert Remote 1 und stabilisiert Credits und Hand. Der Runner zieht zunächst drei Karten, spielt danach einen R&D-Run-Event und greift zu. Die frühe Mischung aus Aufbau und Druck ist plausibel.                                                                                                                                                                                       |
| 7–12  |    39–87 | Die Korp finanziert und schützt weiter. Der Runner probt R&D mehrfach und läuft in Zug 12 zusätzlich HQ an, trasht ein Upgrade und stiehlt eine Agenda. Bis hierher setzt er seinen `runner.run_event_tempo`-Intent tatsächlich um.                                                                                                                                                                 |
| 13–16 |   88–111 | Die Korp erzeugt einen Tag. Der Runner bleibt einen ganzen gegnerischen Zug getaggt, baut erst Hand und Credits auf und entfernt den Tag in Zug 16. Das ging gut, ist gegen die bekannten Damage-/Punish-Signale des Decks aber unnötig riskant. Danach folgt noch ein R&D-Run.                                                                                                                     |
| 17–22 |  112–168 | Beide Seiten entwickeln weiter. In Zug 22 läuft der Runner erst R&D und danach Remote 1 an, passiert mehrere ICE und trasht dort ein Asset für 4 Credits. Das ist der stärkste Runner-Zug der Partie und zeigt, dass Run-Auswahl und Remote-Contest grundsätzlich funktionieren.                                                                                                                    |
| 23–26 |  169–204 | Es folgen zwei weitere R&D-Run-Fenster. Der letzte `start_run` liegt bei Aktion 197. Der letzte tatsächliche Access war bereits Aktion 165. Danach gibt es bis zum Limit keinen Run und keinen Access mehr.                                                                                                                                                                                         |
| 27–32 |  205–233 | Die Korp baut Remote 2 aus und installiert dort eine Agenda. Der Runner zieht, nimmt Credits und installiert weitere Karten, darunter Broker-/Loan-Economy. Noch ist der Übergang in einen Aufbauplan nachvollziehbar.                                                                                                                                                                              |
| 33–40 |  234–275 | Der Runner nutzt Broker in Aktionen 239, 249, 260 und 271. Bei Aktion 271 besitzt er 12 Pool-Credits und 9 gespeicherte Broker-Credits; `bankCombinedCreditAccess` ist 21, `bankComfortableCreditPool:true` und `bankConcreteFundingNeed:false`. Trotzdem wird noch einmal eingezahlt. Der vorhandene Detector markiert diesen Schritt bereits korrekt als `bank_over_target_without_funding_need`. |
| 41–60 |  276–380 | Ab Aktion 282 beginnt die eigentliche Schleife. In den zehn Runner-Zügen dieses Abschnitts werden ausschließlich vier Basic-Credit-Aktionen und `end_turn` gewählt; der Pool steigt von 15 auf 55 Credits. Kein Draw, keine Installation, keine Suche und kein Run erfolgt. Die Korp nimmt meist Credits und legt gelegentlich weiteres ICE.                                                        |
| 61–64 |  381–401 | Die Korp installiert in Remote 1 eine weitere Agenda und scored sie in Aktion 395. Sie kann also noch in Fortschritt konvertieren. Der Runner antwortet weiterhin nur mit vier Credits und erreicht 63.                                                                                                                                                                                             |
| 65–80 |  402–480 | Der Runner setzt die identische Vier-Credit-Sequenz fort und erreicht 91 Credits. Die Korp installiert noch mehrfach ICE und baut Rez-Reserve. Aktion 480 beginnt bereits das nächste Choice-Fenster, bevor das globale Limit greift.                                                                                                                                                               |

### Was genau beim Runner falsch läuft

1. Aktionen 239 bis 271 bauen Broker auf. Die ersten Einzahlungen können bei
   sechs Pool-Credits sinnvoll sein. Spätestens Aktion 271 ist das Ziel aber
   ohne konkreten Finanzierungsbedarf erreicht. Die Banklogik beendet danach
   zwar weitere Einzahlungen, erzwingt aber keine Zielkonversion.
2. Ab Aktion 282 gewinnt der Basic-Credit-Klick mit einem konstanten Score von 859. Der vorherige Plan `runner.build_credit_bank` wird weiterhin als
   `progressing` und mit TTL 2 angezeigt, obwohl kein Bankfortschritt mehr
   stattfindet.
3. Jede dieser Entscheidungen hat 14 legale Aktionen und 13 ausführbare
   Alternativen. Der Trace meldet gleichzeitig eine legale Suchaktion, eine
   legale Recovery-Aktion und eine legale Memory-Hardware sowie fehlende
   Sentry-, Special- und Wall-Abdeckung.
4. Installationen liegen beispielhaft bei Score -211 und -671, eine generische
   Fähigkeit bei 17. Der Credit-Klick gewinnt deshalb lokal, obwohl der
   strategische Intent weiterhin `runner.run_event_tempo`, Phase `pressure`,
   Ziel R&D lautet.
5. Der letzte Runner-Draw liegt bei Aktion 241, die letzte Installation bei 242. Die KI erkennt also ihren Setupmangel diagnostisch, verbindet ihn aber
   weder mit einem Such-/Draw-Zwang noch mit einem Abbruch des Creditplans.

Bewertung: Das ist primär ein Runner-Fehler. Die Korp ist langsam und teilweise
übervorsichtig, scored aber noch. Der Runner verliert dagegen vollständig die
Fähigkeit, Ressourcen in Boardentwicklung oder Druck umzusetzen.

### Sekundäre Korp-Probleme

Nach Aktion 276 wählt die Korp 47-mal `gain_credit`, installiert neun Karten,
advanced viermal und scored einmal. Das ist kein vollständiger Stillstand. Sie
baut Remote 2 jedoch sehr tief aus und installiert dort bei Aktion 444 für 8
Credits ein weiteres ICE. Die Bewertung sieht weiterhin
`corp_remote_risk:unsafe_score_action_available` und finanziert deshalb Rez-
Reserve. Das ist lokal begründbar, berücksichtigt aber kaum, dass der Runner
seit Dutzenden Zügen keinen Run mehr begonnen hat. Eine solche
Opponent-Behavior-Evidenz darf höchstens als begrenzter Risikoabschlag wirken;
sie sollte niemals allein ein ungeschütztes Scoring erzwingen.

## Seed 05

Endstand nach 480 Aktionen: Runner 0, Korp 5; Action Limit mitten im Runner-Zug 66.

### Chronologische Rekonstruktion

| Züge  | Aktionen | Ablauf und Bewertung                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | -------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–4   |     1–46 | Die Korp schützt R&D und HQ. Der Runner probt R&D, installiert sehr wahrscheinlich Blink und nutzt die `+2`-Fähigkeit zweimal. Danach folgen ein HQ-Run-Event, ein Asset-Trash und ein weiterer R&D-Run. Das ist gutes, deckgerechtes Tempo.                                                                                                                                              |
| 5–8   |    47–68 | Der Runner entfernt einen Tag und verwendet die `+2`-Fähigkeit dreimal. Später kombiniert er sie mit Event-Economy, `Loan from Chiba` und einem R&D-Run. Mehrfache Nutzung ist hier sinnvoll, weil Credits tatsächlich fehlen und direkt in Aktionen umgesetzt werden.                                                                                                                    |
| 9–12  |    69–99 | Weitere Hand- und Rigentwicklung führt zum letzten normalen `start_run` in Aktion 87. Der Runner passiert R&D-ICE und greift in Aktion 97 zu. Bis hierher funktioniert das Deckkonzept.                                                                                                                                                                                                   |
| 13–18 |  100–143 | Die Korp erzeugt einen Tag und trasht eine Runner-Ressource. Der Runner entfernt den Tag, stabilisiert sich und läuft in Zug 16 noch einmal über ein Run-Event auf HQ; der letzte Access liegt bei Aktion 128. Der letzte Runner-Draw ist Aktion 140, die letzte Installation Aktion 139.                                                                                                 |
| 19–20 |  144–153 | Der Runner startet bei 5 Credits die spätere Schleife und verwendet `Newsgroup Filter` viermal bis 13 Credits. Die erste oder zweite Nutzung kann noch richtig sein; dass auch bei 9 und 11 Credits keine andere Aktion übernimmt, zeigt erstmals die fehlende Sättigung.                                                                                                                 |
| 21–30 |  154–205 | Die Korp rezzed und leert schrittweise `BBS Whispering Campaign`, was gute endliche Economy ist. Der Runner verwendet in jedem eigenen Zug viermal `Newsgroup Filter` und wächst von 13 auf 53 Credits. Es gibt weder Draw noch Installation noch Run.                                                                                                                                    |
| 31–34 |  206–227 | Die Korp installiert eine Agenda, advanced sie fünfmal und scored sie in Aktion 220. Das ist sehr gute, stringente Konversion. Der Runner besitzt währenddessen 53 bis 69 Credits, ignoriert den sichtbar entwickelten Remote aber vollständig. Bei der gescorten Agenda handelt es sich der anschließenden Fähigkeit nach um `Netwatch Operations Office`.                               |
| 35–40 |  228–265 | Die Korp nutzt Netwatch zunächst zweimal, später einmal pro Zug, baut eine zweite Agenda auf und scored sie in Aktion 258. Der Runner bezahlt jeden Trace mit 2 Credits, vermeidet alle Tags und erzeugt im eigenen Zug jeweils 8 Credits zurück. Die Korp erreicht 5 Agenda-Punkte; der Runner setzt seinen Creditvorsprung weiterhin nicht ein.                                         |
| 41–42 |  266–278 | Die Korp nimmt noch zwei Basic Credits und startet einen weiteren Netwatch-Trace. Der Runner steigt trotz Tracekosten von 85 auf 93 Credits. Damit ist sichtbar, dass die Tax-Linie nicht konvertiert.                                                                                                                                                                                    |
| 43–66 |  279–480 | Die endgültige Schleife ist vollständig stabil: Jeder Korp-Zug enthält drei Netwatch-Aktivierungen, jeweils Korp-Choice und Runner-Bid von 2 Credits. Jeder vollständige Runner-Zug enthält vier Newsgroup-Aktivierungen zu je +2. Die Korp entzieht 6, der Runner erzeugt 8; sein Pool wächst netto um 2 pro Zyklus. Tags, Runs, Draws, Installationen, Advances und Scores bleiben aus. |

### Die Runner-Schleife im Detail

- `Newsgroup Filter` wird im Rohtrace als
  `action_semantic_candidate:card_ability.unknown` und Scope `basic_install`
  geführt, obwohl die aktive Kartenontologie den Effekt korrekt als
  wiederholbare `action_economy` mit `amount:2` beschreibt.
- Die Fähigkeit erhält konstant Score 2042. Davon stammen mindestens 1200 aus
  `runner_credit_action_yield`: Der Code vergibt 600 Punkte pro Netto-Credit,
  unabhängig von Creditstand und Finanzierungsbedarf. Draw liegt bei 1248,
  Basic Credit bei 859.
- Ab Aktion 149 erfolgen 95 solcher Aktivierungen; insgesamt verwendet der
  Runner die Fähigkeit 107-mal und erzeugt damit 214 Credits. Es gibt keine
  harte Nutzungsgrenze auf der Karte, und eine solche soll auch nicht
  eingeführt werden. Falsch ist die konstante Grenznutzenbewertung.
- Beispiel Aktion 478: 109 Credits, Reserve 4, neun legale Aktionen, acht
  Alternativen, zwei legale Memory-Hardware-Aktionen und fehlende Abdeckung für
  Code Gate, Sentry, Special und Wall. Trotzdem gewinnt die Fähigkeit 2042 zu
  1248 gegen Draw. Der Trace klassifiziert dies sogar als
  `runnerEconomySkippedForUnknownHigherPriority`, weil die Fähigkeit
  semantisch nicht als Economy angekommen ist.
- Der strategische Intent bleibt während der gesamten Schleife
  `runner.run_event_tempo` in der Pressure-Phase. Das Problem ist daher nicht
  das Fehlen einer Strategie, sondern ihre fehlende Durchsetzung gegen einen
  lokal überbewerteten wiederholbaren Effekt.

### Die Korp-Schleife im Detail

- Netwatch wird zwischen Aktion 230 und 473 genau 40-mal aktiviert. Der Runner
  bezahlt 40-mal 2 Credits und erhält nie einen Tag.
- Beispiel Aktion 467: Die Korp hat 6 Credits, drei Klicks, 33 legale Aktionen
  und 32 Alternativen. Netwatch besitzt nur Rohscore 62; Installation liegt bei
  -976 und Basic Credit bei -1681. Der Plan `corp.apply_punish_pressure`
  überschreibt dennoch die lokale Rangfolge und wählt Netwatch.
- Die Diagnose berechnet `corpTraceTagExpectedSuccess:0.25`. Die zugrunde
  liegende Funktion verwendet ausschließlich den Vergleich der gesamten Korp-
  und Runner-Credits. Basis-Trace, nötiger Runner-Bid, verbleibende Klicks,
  Wiederholungen und gegnerische Regeneration fehlen.
- Jede Netwatch-Aktivierung wird allein aufgrund des gemappten Planschritts als
  `progressing` gespeichert. `planMemoryStatus` prüft keinen erzeugten Tag und
  keine wirksame Ressourcenannäherung. Für fast alle Pläne wird die TTL bei
  jeder Auswahl erneut auf 2 gesetzt. Daher kann der erfolglose Plan nicht
  auslaufen.
- Drei Traces im selben Zug sind nicht grundsätzlich falsch. Bei einem Runner
  mit beispielsweise 4 Credits könnte die Sequenz den dritten Trace
  durchdrücken und danach `Urban Renewal` oder einen anderen Payoff öffnen.
  Hier ist sie falsch, weil 6 Tax einem sichtbaren Regenerationsvermögen von 8
  pro Runner-Zug gegenüberstehen und kein Tag entsteht.

## Fehlerursachen nach Schicht

### 1. Fähigkeitssemantik

`packages/ai/src/actions/basic-action-semantics.ts` setzt jede
`activated_card_ability` zunächst auf `card_ability.unknown`.
`action-card-semantic-join.ts` bindet Karten- und Fähigkeitssignale an, ersetzt
den semantischen Aktionstyp aber nicht durch den eindeutigen Einzeleffekt.

Änderung: Bei side-sicher gebundener Quelle und eindeutig gebundener einzelner
Fähigkeit muss der strukturierte Hint den Aktionstyp spezialisieren dürfen:

- Newsgroup Filter: `economy.gain_credit` mit Nettoertrag 2;
- Netwatch Operations Office: `trace.source` und `tag.source` mit Bedingung
  `requires_trace_success`;
- mehrdeutige Mehrfachfähigkeiten bleiben fail-closed
  `card_ability.unknown`.

Das verändert keine LegalActions und keine Engine-Auflösung, sondern nur die
Interpretation einer bereits legalen Aktion.

### 2. Marginaler Nutzen wiederholbarer Economy

`packages/ai/src/runtime/runner-credit-yield-score.ts` vergibt derzeit
`netGain * 600`. Dieser Wert ist unabhängig von Pool, Reserve, konkretem
Finanzierungsziel und bereits erfolgten Wiederholungen.

Änderung: Der Ertrag bleibt die Ausgangsbasis, wird aber mit einem marginalen
Credit-Nutzen gewichtet:

- volle Bewertung unter Reserve oder bei konkretem kurzfristigem Funding;
- mittlere Bewertung bis zum Zielwert;
- starke Dämpfung oberhalb des Zielwerts, wenn Draw, Suche, Installation oder
  ein bezahlbarer Druckpfad legal ist;
- erneute volle Bewertung, wenn tatsächlich nichts Interessanteres legal oder
  sinnvoll ist.

Damit kann die KI Newsgroup Filter weiterhin drei- oder viermal verwenden,
wenn die Situation es verlangt. Es gibt keinen absoluten Kartencap.

### 3. Erfolgsbasierte Planfortschreibung

`packages/ai/src/plans/plan-memory.ts` behandelt einen gemappten Schritt als
Fortschritt und setzt die TTL fast immer wieder auf 2.

Änderung: Ein Plan braucht eine side-sichere Postcondition, die bei der
nächsten Entscheidung gegen den neuen PlayerView-Zustand geprüft wird:

- `runner.build_credit_base`: Zielreserve oder konkretes Funding erreicht;
- `runner.build_credit_bank`: gewünschter Bankstand erreicht;
- `corp.apply_punish_pressure`: Tag erzeugt, Payoff ausgelöst oder gegnerische
  Ressourcen messbar in Richtung eines realistischen Folgefensters reduziert;
- keine Postcondition erfüllt: TTL reduzieren und nach begrenzter Wiederholung
  Plan als `stalled` beziehungsweise `abandoned` neu bewerten.

Diese Schicht konkurriert nicht mit der neuen Langfrist- und Iterationsplanung.
Die übergeordnete Planung liefert das Ziel; die Postcondition beantwortet nur,
ob der gewählte Schritt dieses Ziel tatsächlich nähergebracht hat.

### 4. Trace-Sequenznutzen

`packages/ai/src/runtime/trace-tag-success-estimate.ts` liefert nur 1, 0,5 oder
0,25 auf Basis des Creditvergleichs.

Änderung: Für wiederholbare Trace-Quellen muss eine kurze Sequenzquote berechnet
werden:

- Basis-Trace und geplanter Korp-Bid;
- minimaler Runner-Bid zum Verhindern;
- Credits beider Seiten und verbleibende Korp-Klicks;
- Anzahl möglicher Wiederholungen;
- sichtbarer unmittelbarer Tag-Payoff;
- beobachteter Credittrend des Runners aus side-sicherer Entscheidungshistorie.

Netwatch bei 115 Runner-Credits ergibt dann eine Tax-Linie ohne realistische
Tagkonversion. Bei knappem Runner-Pool und anschließend legalem Damage-Payoff
kann dieselbe dreifache Verwendung weiterhin hoch priorisiert sein.

### 5. Blink-Deckkonversion

Die Deckontologie beschreibt Blink korrekt als universellen, zufälligen
Breaker. Die Laufdiagnose meldet trotzdem fehlende Standardabdeckung für alle
ICE-Typen. Das ist als Hinweis auf fehlende stabile Coverage verständlich,
darf aber nicht zu einem unerfüllbaren Standard-Breaker-Ziel werden, weil das
Deck keine typgebundenen Breaker enthält.

Änderung: Universelle probabilistische Coverage muss getrennt von stabiler
Coverage behandelt werden:

- Blink installiert und ausreichender Handpuffer: Run mit Risikopreis zulassen;
- Blink vorhanden, Handpuffer zu klein: Draw/Handschutz statt Credits;
- weiterer Blink per Suche oder Recovery verfügbar: als Verbesserung der
  Erfolgswahrscheinlichkeit bewerten;
- kein realer stabiler Breakerpfad im Deck: nicht endlos auf typgebundene
  Coverage warten.

## Verbindlicher Regressionstest-Zuschnitt vor einem Fix

1. **Seed 03, Broker-Abschluss:** Decision-Checkpoint auf Roh-`actionIndex 270`
   beziehungsweise Aktion 271. Bei 21 kombinierten Credits, komfortablem Pool
   und ohne Fundingbedarf darf eine weitere Broker-Einzahlung nicht gewinnen.
2. **Seed 03, Konversion statt Creditloop:** Checkpoint auf Aktion 282 oder 470. Bei hohem Pool, fehlender Coverage sowie legaler Suche, Recovery und
   Memory darf `gain_credit` nicht erneut die finale Wahl sein.
3. **Seed 05, Newsgroup-Sättigung:** Checkpoint auf Aktion 211 im ersten
   sichtbar entwickelten Scorefenster. Bei 53 Credits darf die vierfache
   Economy-Sequenz nicht Draw, Entwicklung und Remote-Reaktion vollständig
   verdrängen. Ein separater Low-Credit-Gegenvertrag muss Mehrfachnutzung
   weiterhin erlauben.
4. **Seed 05, Netwatch-Einzelentscheidung:** Checkpoint auf Aktion 279 oder 467. Bei massivem Runner-Pool und niedriger Trace-Konversion darf der
   Punish-Plan Netwatch nicht allein wegen des Signal-Mappings erzwingen.
5. **Seed 05, Planverlauf:** Sequenzieller Test über mindestens einen
   vollständigen Korp-/Runner-Zyklus. Drei erfolglose Traces, kein Tag und ein
   anschließend nicht sinkender Runner-Pool müssen den Punish-Plan als
   nicht konvertierend markieren und eine Neuplanung auslösen.
6. **Detektor:** Ein Trace-Mining-Test muss wiederholbare Credit-/Trace-
   Fähigkeiten mit hohem beziehungsweise nicht sinkendem Gegnerpool und ohne
   Boardfortschritt als sequenzielle Schleife melden. Die bisherigen
   `bank_over_target_without_funding_need`-Funde reichen dafür nicht.

Erst diese Tests rot herstellen, danach die Semantik-, Score- und
Planfortschrittsänderungen implementieren und anschließend beide Originalseeds
unter unverändertem 480-Aktions-Vertrag erneut laufen lassen.

## Priorisierung

1. Newsgroup-Semantik plus marginale Creditbewertung;
2. erfolgsbasierte Planfortschreibung und TTL;
3. Netwatch-/Trace-Sequenznutzen;
4. Blink-Coverage-Konversion;
5. erst danach vorsichtige Korp-Remote-/Überprotection-Feinabstimmung.

Die ersten vier Punkte erklären die Action Limits direkt. Die
Korp-Remote-Vorsicht in Seed 03 ist real, aber sekundär und sollte nicht durch
einen pauschalen Score- oder Advance-Bonus übersteuert werden.
