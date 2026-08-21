# KI-Selbstspielzyklus 006 – vollständige Matchanalyse

Stand: 2026-08-19
Status: vollständig analysiert; zwei generische Determinismusfehler behoben,
mit fokussierten Tests und zwei vollständigen Realpfad-Replays verifiziert

## Reproduktionsvertrag

- Auswahlseed: `2a2ae05031d207c0a8b0f85df8161fbb`
- Spielseed: `selfplay-006-f5225f80419cf17644a329406d500a17`
- Runner: **King of the Road**, 45 Karten,
  `standard_standard_runner_adb10896_1.0.0`, `fnv1a:db67cbcc`
- Corp: **Shadoe Tag & Bag**, 48 Karten und 17 Agendapunkte,
  `standard_standard_corp_shadoe_tag_bag_1.0.0`, `fnv1a:f0c0544f`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, normale KI,
  Detailtrace

Alle Läufe verwendeten den normalen Multiplayer-/KI-Pfad, isolierte
SQLite-Datenbanken und die lokale read-only Maintenance-Analyse-API. Die
Standardports und die Main-Datenbank blieben unberührt.

## Ergebnisse und deterministische Gegenprobe

| Stand                                               | Ergebnis wie im Programm             | Entscheidungen | Kernaussage                                                                    |
| --------------------------------------------------- | ------------------------------------ | -------------: | ------------------------------------------------------------------------------ |
| Ausgangslauf A `match_9b559755a4a11a9c`             | Runner 10 – Corp 0; Agendapunkte 8:0 |             76 | Data Wall wird zuerst vor R&D installiert                                      |
| identischer Ausgangslauf B `match_506fac4c8636d28f` | Corp 10 – Runner 6; Agendapunkte 7:6 |            342 | Data Wall wird trotz identischem Seed zuerst vor HQ installiert                |
| nach RNG-Fix A `match_03f9a6a555df732c`             | Corp 10 – Runner 6; Agendapunkte 7:6 |            342 | erste Zufallsentscheidung stimmt, spätere gleichwertige Breakerwahl divergiert |
| nach RNG-Fix B `match_f4ed6e0ae740a170`             | Corp 10 – Runner 6; Agendapunkte 7:6 |            331 | erste Abweichung bei D123 durch matchabhängigen Planungsfingerprint            |
| final A `match_e03400af85946596`                    | Corp 10 – Runner 6; Agendapunkte 7:6 |            342 | Referenzlauf                                                                   |
| final B `match_ad6bdd795029066f`                    | Corp 10 – Runner 6; Agendapunkte 7:6 |            342 | 342 von 342 Action-IDs, Actiontypen und Planowner identisch                    |

StateHashes verschiedener Match-IDs sind absichtlich verschieden, weil die
Match-ID zur Replay- und State-Zuordnung im Zustand verbleibt. Die relevante
deterministische Gegenprobe ist deshalb die vollständige fachliche
Entscheidungsfolge. Innerhalb eines Replays prüfen die bestehenden
Engine-Tests weiterhin den exakten StateHash.

## Vollständiger Decision-Denominator des finalen Referenzlaufs

Alle 342 Entscheidungen des finalen Referenzlaufs wurden genau einmal über
die Maintenance-Analyse-API klassifiziert:

- `plausibel`: 173 mit persistiertem TurnPlanner-Audit;
- `trace-limitiert`: 169 reguläre Engine- oder einfache Planentscheidungen
  ohne persistierten TurnPlanner-Abschnitt;
- `Finding`: 0 innerhalb der finalen Folge;
- `prüfbedürftig`: 0 einzelne Entscheidung; zwei strategische Muster werden
  auf Metaebene in der Indizienmatrix geführt;
- keine Fallbacks, Timeouts, Apply-/Debug-Abweichungen oder
  Maintenance-Warnungen;
- historische LegalActions, Engine-Evidence und actor-private
  Analysesnapshots sind für alle 342 Entscheidungen persistiert.

Die beiden Determinismusfindings entstanden durch den vollständigen Vergleich
der identischen Läufe, nicht durch eine illegale Einzelentscheidung im
finalen Replay.

## Bestätigtes Finding 1 – Match-ID beeinflusst den Engine-Zufallsdraw

Beide Ausgangsläufe besitzen dieselbe Starthand. Bereits D4 wählt jedoch für
dieselbe Data-Wall-Nahgleichstandsmenge einmal R&D und einmal HQ. Die
Engine-Quote, Kandidatenkanonisierung und der RandomCounter sind korrekt; der
Randomisierungszweck enthält zusätzlich die zufällige Match-ID. Da
`nextRandom` den Zweck in die Seedableitung einbezieht, verändert eine reine
Transportidentität den Draw.

Der generische Fix entfernt die Match-ID aus den fachlichen
Randomisierungszwecken für ICE-Nahgleichstände und verdeckte Trace-Gebote.
Quote und Receipt behalten die Match-ID weiterhin und revalidieren sie gegen
den aktuellen Zustand. Der Test
`selects the same near-tie candidate for one seed across match ids` sichert
die konkrete Fundstelle; der analoge Trace-Test sichert dieselbe
Architekturregel für die zweite betroffene Familie.

## Bestätigtes Finding 2 – StateHash beeinflusst stabile Planner-Tie-Breaks

Nach dem ersten Fix stimmen die Läufe bis D122 überein. Bei D123 können
Tinweasel und Wizard’s Book dieselbe Quandary-Subroutine gleichwertig
brechen. Der TurnPlanner wählt in den beiden Matches verschiedene Breaker.
Die Kandidatenwerte und Owner sind identisch, aber der
`sideSafePlanningFingerprint` enthält die öffentlichen Event-StateHashes.
Diese enthalten wiederum die Match-ID und verändern Kandidaten- und
Line-Fingerprints, die als stabiler letzter Tie-Break dienen.

Der generische Fix schließt `matchId`, `stateHash`, `stateHashAfter` und
`finalStateHash` rekursiv aus fachlichen Planungsfingerprints aus. Sichtbare
Spielinhalte, StateVersion, Actionsemantik und alle Validierungsverträge
bleiben erhalten. Der Ownership-Test
`keeps transport match and StateHash identities out of planner tie-breaking`
sichert den Vertrag.

## Gewinneranalyse – warum Shadoe Tag & Bag gewann

Die Corp gewann nicht über ihren namensgebenden Killplan, sondern über einen
erfolgreichen strategischen Pivot zur Remote-Scoreline:

- Sie baute die erste Remote schrittweise auf und zwang den Runner bei D137
  durch Filter und Hunter zu einem teuren Contest. Der Runner stahl Political
  Coup zwar bei D149, deckte damit aber die Verteidigungsstruktur auf.
- D158–D165 nutzte die Corp zwei Overtime Incentives, installierte eine zweite
  Political Coup, avancierte viermal und scorete im selben Zug.
- Vor dem zweiten Score legte sie eine weitere Wall-of-Static-Schicht. Der
  Runner investierte D219–D222 drei Klicks in Credits und den Remote-Run,
  konnte die rezzte Wall jedoch nicht brechen; D224 beendete den Run.
- Danach konvertierte `corp.score_agenda` Corporate Coup, Data Fort
  Reclamation und Subsidiary Branch ohne Ownerwechsel. Vier gescorte Agenden
  ergaben sieben Punkte.
- Economy und Defense blieben Support; 30 Scoreplan-, 29 Economy- und 26
  Defense-Entscheidungen zeigen einen ausgewogenen Pivot statt eines
  planlosen Credit-Holds.

## Verliereranalyse – warum King of the Road verlor

Die unmittelbare Ursache war `agenda_points`: Der Runner stand bei sechs
Punkten, die Corp scorete D342 den siebten Punkt. Die strukturelle
Verlustkette war:

1. Der Runner erzeugte mit 19 Runs hohen Druck, vor allem auf R&D, und stahl
   drei Agenden für sechs Punkte.
2. Die Corp schichtete R&D und die Score-Remote. Der Runner musste 16
   Subroutinen brechen und konnte nur einen der 19 Runs als vollständig
   erfolgreichen Run im Ergebniszähler abschließen.
3. Der entscheidende Remote-Contest D222 scheiterte nicht an einer falschen
   Breakerwahl, sondern an fehlender Wall-Abdeckung. Das ICE war vor dem Run
   verdeckt; der Rez war eine legitime Informationseröffnung.
4. Beim Stand 6:6 lagen D334 vier ICE und eine vierfach avancierte Karte in
   der Score-Remote. Der Runner hatte 14 Credits, aber weder in Hand noch im
   verbleibenden Stack eine Wall-Lösung. Raptor und Shaka im Stack waren
   Sentry-Breaker. Die Remote war damit aus öffentlicher und eigener
   Decksicht nicht passierbar.
5. Der Archives-Run bei D334 wirkt isoliert schwach, ist aber keine belegte
   Fehlentscheidung: HQ und Remote waren wegen fehlender Coverage nicht
   admissibel, R&D war durch Cadence/Route blockiert, und ein Draw konnte im
   verbleibenden Deck keine Wall-Abdeckung finden.

Ein Teil der Niederlage ist somit Matchup und Deckzusammensetzung: Die Corp
fand mehrere harte Wall-/Code-Gate-Schichten, während der Runner im Endspiel
keine Wall-Antwort mehr besaß. Varianz spielte beim verdeckten Wall-Rez eine
Rolle. Veränderbar bleibt eher die frühere strategische Frage, ob der Runner
vor dem Aufbau der Vierfach-Remote noch aggressiver auf Scoretempo oder
Coverage-Lebenszyklus hätte reagieren können; für eine konkrete bessere
damalige LegalAction fehlt noch der Beleg.

## Neue Ideen und offene Verdachtsmuster

### Unvollständige Tag-&-Bag-Quote

Im kurzen Ausgangslauf A besaß die Corp mehrfach Chance Observation und
Scorched Earth. Der strategische Intent erkannte `corp.tag_trace_punish`
korrekt, und eine Engine-Quote wurde angefragt. Die Aktion blieb dennoch mit
`corp_conditional_punish_action_quote_unknown` unbewertet. Der persistierte
Trace nennt nicht den konkreten Incomplete-Grund. Das kann ein echter
Capability-/Quote-Fehler oder eine korrekte Ablehnung wegen der
Runner-Response-Envelope sein. Ohne den genauen Engine-Grund wäre ein Fix ein
unzulässiger Karten- oder Schwellen-Shortcut. Der Fall wird deshalb mit Seed,
Deck und D32–D48 als Verdacht gespeichert.

Neue generische Idee: Der Decision Trace sollte für angefragte, aber
unvollständige mehrstufige Engine-Routen die side-sicheren strukturierten
Incomplete-Gründe persistieren. Erst damit lässt sich zwischen fehlender
Capability-Bindung, nicht ausführbarer Sequenz und tatsächlich ungünstiger
Response-Envelope unterscheiden.

### Matchpoint-Coverage als strategischer Lebenszyklus

Der Endzustand verdichtet die schon in SP-013 sichtbare Frage nach endlicher
Coverage. Hier ist die Lage schärfer, aber zugleich eine Gegenprobe: Es wurde
nicht nur ein endlicher Universal-Breaker zu früh verbraucht; das konkrete
Deck hatte im verbleibenden Stack überhaupt keine Wall-Antwort. Ein
generischer Planner darf keine nicht vorhandene Karte herbeiziehen. Sinnvoll
wäre stattdessen eine frühere Deckprofil-Warnung „Matchpoint-Remote kann bei
dieser sichtbaren ICE-Verteilung dauerhaft unpassierbar werden“, die nur
existierende Deckrollen und öffentlich sichtbare Serverentwicklung nutzt.

## Prozessoptimierung dieses Zyklus

Der bisherige Einzelschrittbetrieb führte für dieselbe Paarung nach mehr als
900 Sekunden nur zu einem weiterhin aktiven Match. Der neue explizite
`batch`-Modus führt bis zu 40 unveränderte `runAiStep`-Übergänge unter
demselben Match-Lock aus und persistiert weiterhin jedes Event, jedes Receipt
und jeden Detailtrace. `single_step` und `until_human` behalten ihre bisherige
Semantik.

Gemessene Wirkung:

- 76 Entscheidungen in zwei Batch-Aufrufen in rund vier Sekunden;
- 342 Entscheidungen in neun Batch-Aufrufen in rund 25 Sekunden;
- vollständige Maintenance-Evidence und identische Decision-Denominator;
- fokussierter Servertest sichert, dass Batch mehr als einen und höchstens 40
  Schritte ausführt und Event-/Traceanzahl exakt erhalten bleiben.

Nicht entfernt werden die sicherheitsrelevanten Gates: frische Datenbasis je
Replay nach Codeänderung, vollständige Entscheidungsanalyse, fokussierte
Tests, identischer Seed, Matrixpflege sowie Main-/Arbeitsbranch-Abgleich je
abgeschlossenem Zyklus.

## Verifikation

- Engine-Randomisierung: 9/9 fokussierte Tests grün;
- TurnPlanner-Verträge: 22/22 fokussierte Tests grün;
- Batch-Multiplayerpfad: fokussierter Test grün;
- zwei finale Realpfad-Replays mit 342/342 identischen Action-IDs,
  Actiontypen und Planownern;
- keine Fallbacks, Timeouts oder Auditabweichungen im finalen Replay.
