# Runner-Damage-Threat-Model v2: Final Review 2026-07-17

## Ergebnis

Die Runner-KI trennt jetzt dauerhaftes Wissen über ein sichtbares Damage-Deck
von der akuten Gefahr, im aktuellen Spielzustand flatzulinen. Die beiden
Achsen besitzen eigene Typen, Evidence und Consumer. Das bisherige skalare
Threat-Aggregat und der parallele Bool-Detector sind entfernt.

Die Änderung macht die KI vorsichtiger, sobald belastbare Signale vorliegen,
aber nicht pauschal passiv: Ein einmal bestätigtes Damage-Archetypwissen bleibt
erhalten, während die akute Vorsicht turn-basiert sinkt. Sichere Pfade,
unmittelbare Payoffs, Agenda-Scores und die replay-stabile Probevariation
bleiben wirksam.

## Führender Vertrag

`runnerDamageThreatAssessment` liefert genau drei Bereiche:

- `deckBelief`: dauerhaftes, ausschließlich aus sichtbarer Evidence
  abgeleitetes Wissen mit `none`, `suspected` oder `confirmed`;
- `flatlineRisk`: aktuelle Gefahr mit `none`, `suspected`, `confirmed` oder
  `critical`;
- gemeinsame Evidence, die beide Entscheidungen im Trace nachvollziehbar
  macht.

Spiegelnde Legacy-Felder wie ein gemeinsames `level`,
`knownPunishSignalCount`, `recommendedHandFloor` oder
`criticalRunSuppression` auf Aggregatebene existieren nicht mehr. Consumer
müssen sich ausdrücklich für Deckwissen oder akutes Risiko entscheiden.

## Evidence-Klassifikation

Die Bewertung unterscheidet strukturell:

1. tatsächlich aufgelösten Korp-Schaden mit positiver Schadensmenge oder
   Flatline;
2. sichtbare, vollständig verhinderte Damage-Versuche;
3. Runner-Self-Damage, der kein Korp-Decksignal erzeugt;
4. sichtbare Damage-Quellen;
5. Trace-/Tag-Delivery mit passendem strukturiertem Hint;
6. Damage- oder Tag-Punish-Payoffs;
7. niedrig-konfidenten Freitext-Fallback, der allein keine bestätigte Lage
   erzeugen darf.

Ein generisches Trace-Ereignis und ein Tag ohne passende sichtbare
Punish-Evidence bestätigen kein Damage-Deck. Ein bestätigtes Belief benötigt
aufgelösten Korp-Schaden oder unabhängige sichtbare Definitionen, etwa
Delivery plus Payoff. Unbekannte Karten in Korp-HQ oder R&D werden nicht
ausgewertet.

## Zeitmodell

`turnSerial` wird jetzt als öffentliche deterministische Information in
`PlayerView` und `PublicGameEvent` projiziert. Aktuell erlittener Schaden gilt
für das laufende und das unmittelbar folgende Turn-Fenster. Ältere
Checkpoint-Fixtures ohne Turn-Serie behalten ausschließlich einen eng
begrenzten StateVersion-Fallback.

Dadurch bleibt das Deck-Belief über das Spiel erhalten, ohne dass ein alter
einmaliger Schadensfall dauerhaft dieselbe Survival-Priorität erzeugt.

## Consumer-Audit

Alle tatsächlichen Consumer wurden auf `flatlineRisk` migriert:

- Handpuffer-Score;
- Survival-/Handpuffer-Plan;
- Creditreserve für Installationen;
- Economy-Posture und gewünschte Liquidität;
- serverbezogene Run-Abwertung;
- Locked-Hand-Reaktionsreserve;
- replay-stabile Probevariation.

Die Hint-Kette wurde vom strukturierten Kartenhint über Signalaggregation,
Deck-Belief, Flatline-Risiko, Scorekomponente, Plan und Arbitration geprüft.
`check:ai:full` bestätigt die bestehenden kompilierten Hints und Derived Facts
ohne Fehler. Für diese Änderung war keine Karten-ID-Sonderregel und keine
Hintänderung erforderlich.

## Handpuffer-Vertrag

Das dauerhafte Handziel wird auf die effektive Maximalhand begrenzt. Bei
Core-Damage kann eine volle Zwei- oder Drei-Karten-Hand deshalb nicht durch
einen normalen Draw dauerhaft sicherer werden.

- Auf dem letzten Klick erzeugt ein voller reduzierter Grip keinen falschen
  Survival-Draw.
- Ein temporäres Überziehen ist nur bei mindestens zwei Klicks, bestätigtem
  oder kritischem akuten Risiko und einem konkret legalen Run auf einen
  riskanten Server erlaubt.
- Ein legaler unmittelbarer Agenda-Score sperrt diese Ausnahme. Im F450-
  Gegenbeispiel gewinnt der sichere Drei-Punkte-Score wieder gegen Draw und
  möglichen späteren Risky Run.
- Im F5D-Checkpoint mit vollem reduziertem Grip und letztem Klick nimmt die KI
  den sicheren Credit statt nutzlos zu ziehen oder marginale Memory zu
  installieren.

## Bewusste Risikostreuung

Die vorhandene replay-stabile Probevariation bleibt erhalten und konsumiert
jetzt das akute Flatline-Risiko. Grenzfälle bleiben seed- und
Decision-Kontext-abhängig, ohne Replay-Determinismus zu verlieren:

- ohne Damage-Evidence sind drei von vier Probe-Buckets offen;
- bei Verdacht zwei;
- bei bestätigtem Risiko einer;
- bei kritischem Risiko keiner.

Unmittelbarer sichtbarer Payoff, Matchpoint und sichere bekannte Pfade werden
weiterhin separat bewertet und nicht durch eine pauschale Damage-Deck-Sperre
ersetzt.

## Entfernte Altstrukturen

- `runner-visible-damage-pressure.ts`;
- dessen isolierter Bool-Test;
- alle spiegelnden Legacy-Felder von `RunnerDamageThreatAssessment`;
- alte `damageThreatLevel`-Consumer- und Evidence-Namen.

Damit existiert nur noch eine führende Evidence-Pipeline.

## Verifikation

- 8 fokussierte Consumer-/Plan-/F5D-Dateien: 111/111 Tests grün;
- Modell-, F450- und F5D-Grenzverbund nach dem letzten Fix: 22/22 grün;
- zwei Runtime-Survival-Gegenproben: 2/2 grün;
- Shared-, Engine- und AI-Typecheck: grün;
- `check:ai:full`: grün;
- AI-Hints: 618 aktive Karten, keine Gate-Fehler;
- vollständige dreigeteilte AI-Suite: 348/354 Dateien und 2462/2471 Tests
  grün.

Die neun roten Vollsuite-Tests sind die auf dem synchronisierten Main-Stand
bereits dokumentierten Baselines und liegen außerhalb dieses Slices:

- zwei AI-Hint-Quality-Gates;
- drei ECFE3CE-Broker-Planarbitrationen;
- ein Combined-Target-Broker-Checkpoint;
- ein komfortabler Broker-Cashout-Vertrag;
- DFE6-F01;
- die MRGSG-R&D-Planfortsetzung.

Der zunächst zusätzlich rote F450-Gegencheckpoint war ein echtes Delta dieses
Slices und wurde nicht als Baseline akzeptiert. Der neue Regressionstest und
der vollständige F450-Checkpoint sind nach der Korrektur grün.

## Grenzen und Nicht-Ziele

- Keine Änderung der Damage-Regeln oder LegalActions.
- Keine Vorhersage verdeckter Korp-Karten.
- Keine absolute Vorgabe, frühe Check-Runs immer auszuführen oder immer zu
  vermeiden.
- Keine Lösung der offenen Broker-Portfolio- oder Hint-Quality-Baselines.
- Kein Push und keine Remote-Integration.

## Lokaler Integrationsstand

Der Arbeitsbranch wurde konfliktfrei mit dem aktuellen lokalen `main` samt
SeeYa-Informationswert-Slice synchronisiert. Nach dem finalen Dokumentations-
Commit ist ein lokaler Fast-Forward-Merge nach `main` vorgesehen; Push oder PR
sind nicht Teil dieses Auftrags.
