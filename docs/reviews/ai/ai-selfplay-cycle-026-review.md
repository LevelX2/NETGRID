# KI-Selbstspielzyklus 026 – Bit-Denial zwischen Scoretempo und Deckdruck

Stand: 2026-08-20
Status: drei vollständige Realpfad-Partien ohne neue belegte KI-Entscheidungslücke

## Reproduktionsvertrag

- Auswahlseed: `d819e4973f794b2fb2852e02bbfb6b21`
- Runner: **Bit-Denial Lock**, 45 Karten,
  `standard_standard_runner_bit_denial_lock_1.0.0`, `fnv1a:d4d08930`
- Corp: **Rent to Own War Engine**, 47 Karten,
  `standard_standard_corp_rent_to_own_war_engine_1.0.0`, `fnv1a:2b45c878`
- Spielseeds:
  - `selfplay-026-6fe7a1ca895bf3103a5f4270994618c2`
  - `selfplay-026-a1cd27a0be3c1f9f51ba63d91e717791`
  - `selfplay-026-5450fe1b2c93ce619cc880a5d07ee86a`
- Ausgangsstand: `6454b96ba0ad37a6835585e1a9a7424204ce6c1c`
- Auswahl: SHA-256 über `seed:side` modulo 24 Runner- beziehungsweise
  23 Corp-Kandidaten
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Port 8912 und derselben fortgeschriebenen
SQLite-Evidence. Es wurde keine Datenbank gelöscht.

## Ergebnis wie im Programm

| Partie | Standarddecks | Endergebnis | Agendapunkte | Ende | Entscheidungen |
| ------ | ------------- | ----------: | ------------: | ---- | --------------: |
| Seed 1 | **Bit-Denial Lock** gegen **Rent to Own War Engine** | Corp **10 – 1** Runner | **9:1** | Agendapunkte | 186 |
| Seed 2 | **Bit-Denial Lock** gegen **Rent to Own War Engine** | Runner **10 – 0** Corp | **9:0** | Agendapunkte | 332 |
| Seed 3 | **Bit-Denial Lock** gegen **Rent to Own War Engine** | Runner **10 – 0** Corp | **8:0** | Agendapunkte | 231 |

Die Match-IDs lauten `match_51b0f2c29dd14cd1`,
`match_2e869ecd0375bfb6` und `match_d3fb759ceea742f0`. Ihre terminalen
StateHashes sind `fnv1a:d76337e0`, `fnv1a:7545e15c` und `fnv1a:6db762e7`.

## Vollständiger Decision-Denominator

Alle 749 Entscheidungen wurden vollständig geladen und genau einmal
klassifiziert:

- Seed 1: Indizes 1 bis 186;
- Seed 2: Indizes 1 bis 332;
- Seed 3: Indizes 1 bis 231;
- ausschließlich `ai-decision-trace-v2`;
- LegalActions, Engine-Evidence, actor-private Analysesnapshots und
  Checkpoint-Capture 749/749 persistiert;
- `FLAGS=0`: keine Lücke, kein Duplikat, Fallback, Timeout,
  Auswahlmismatch, Engine-Rejection, nicht zertifizierte Planquote,
  Unknown-Assessment oder fehlende Auditsektion;
- 38 Runstarts, 25 erfolgreiche Runs, acht gestohlene und drei von der Corp
  gescorte Agenden;
- der getrennte unbeschränkte Eventpass enthält 187, 333 und 232 Events und
  jeweils den terminalen Zustand.

Zwei Endturns mit Restklicks in Seed 2 wurden als benannte Ausnahme vollständig
geprüft. In D307 und D315 besitzt der Runner sechs Agendapunkte, 31 Karten im
Stack und die Corp 17 beziehungsweise 16 Karten bei null Punkten. Der
zuständige `runner.defense_and_recovery`-Owner wählt ausdrücklich
`forgo_terminal_deck_pressure`; sämtliche freiwilligen Actions sind vollständig
und widerspruchsfrei dispositioniert. Das ist der bereits getestete günstige
Matchpoint-Deckrace-Vertrag, nicht die in SP-065 behobene falsche
Standardkapazitäts-Erschöpfung.

## Gewinneranalyse

**Seed 1:** Die Corp scoret drei Agenden zum 9:1. Der Runner startet nur fünf
Runs, davon zwei erfolgreich, und stiehlt eine Ein-Punkt-Agenda. Das frühe
Scoretempo dominiert den Bit-Denial-Aufbau.

**Seed 2:** Der Runner gewinnt 9:0 nach 19 Runs, 14 Erfolgen und vier Steals.
Beim Stand 6:0 wartet er zweimal unter dem expliziten günstigen Deckrace-
Vertrag, setzt danach den Zugriff fort und stiehlt in D332 die letzte Agenda.

**Seed 3:** Neun erfolgreiche von 14 Runs liefern drei Steals und 8:0. Die
Corp bleibt bei null Credits im Schlussfenster und kann den finalen Zugriff
nicht mehr mit einer Rezroute stoppen.

## Verliereranalyse und Metaebene

1. Die Runner-Niederlage in Seed 1 ist ein Scoretempo-/Zugriffsresultat: drei
   Corp-Scores stehen nur zwei erfolgreichen Runs gegenüber.
2. Die Corp-Niederlagen in Seeds 2 und 3 entstehen ohne eigenen Score. Acht
   Agenda-Steals über wiederholten Zentral- und Remotezugriff dominieren.
3. Das 1:2 der Paarung zeigt starke Seedvarianz: dasselbe Corp-Deck konvertiert
   einmal 9 Punkte und zweimal null. Daraus folgt keine pauschale Score- oder
   Defense-Schwelle.
4. Der Drilldown auf D307/D315 bestätigt SP-065 als behoben: Restklicks werden
   nicht als erschöpfte Standardkapazität aufgegeben, sondern unter einem
   separaten P5-Terminalvertrag nach vollständiger Owner-Ablehnung.
5. Kein einzelner sicher besserer legaler Verliererpfad und keine neue
   Planabdeckungslücke sind belegt. Paarung 026 schließt ohne Codeänderung.

## Verifikation

- drei terminale Realpfad-Partien mit 749/749 fehlerfrei auditierten
  Entscheidungen;
- vollständige getrennte Eventhistorien einschließlich Terminalzustand;
- benannter Drilldown auf beide Restklick-Endturns, Score-/Steal-Timeline und
  letzte Verliererzustände;
- keine Codeänderung und deshalb kein zusätzlicher Testlauf.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
