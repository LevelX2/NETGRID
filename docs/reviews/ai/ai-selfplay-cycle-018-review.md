# KI-Selbstspielzyklus 018 – Drei-Seed-Folgezyklus Hidden Backdoor Sabotage

Stand: 2026-08-20
Status: drei vollständige Realpfad-Partien ohne neue belegte
KI-Entscheidungslücke; Chrome Rush Bureau gewinnt die Paarung 2:1

## Reproduktionsvertrag

- Auswahlseed: `e2dad3c460a5412bad446d2ac4cb5135`
- Runner: **Proteus Runner - Hidden Backdoor Sabotage**, 46 Karten,
  `standard_standard_proteus_runner_hidden_sabotage_2026_05_25_1.0.0`,
  `fnv1a:d661af9c`
- Corp: **Chrome Rush Bureau**, 64 Karten,
  `standard_standard_corp_chrome_rush_bureau_1.0.0`, `fnv1a:2ebf0f5c`
- Spielseeds:
  - `selfplay-018-9cb673d484b64e1a8d0bbc7edea3b949`
  - `selfplay-018-de9648dfb15a4fbf91e7c8fdf7845ed9`
  - `selfplay-018-cc0b7f510eda4eaebe48bc9312cd181a`
- Ausgangsstand: `058c4546f4c7b9558e6fd2a151008962681b5687`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Port 8912 mit unverändert persistenter
SQLite-Evidence. Die aktive Standarddeckauswahl verwendete erneut SHA-256
über `seed:side` modulo 24 Runner- beziehungsweise 23 Corp-Kandidaten.

## Ergebnis wie im Programm

| Partie | Standarddecks                                             |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | --------------------------------------------------------- | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | **Hidden Backdoor Sabotage** gegen **Chrome Rush Bureau** | Corp **10 – 0** Runner |      **7:0** | Agendapunkte |            107 |
| Seed 2 | **Hidden Backdoor Sabotage** gegen **Chrome Rush Bureau** | Runner **10 – 2** Corp |      **7:2** | Agendapunkte |            194 |
| Seed 3 | **Hidden Backdoor Sabotage** gegen **Chrome Rush Bureau** | Corp **10 – 5** Runner |      **7:5** | Agendapunkte |            319 |

Die Match-IDs lauten `match_ee4ff3e90f1af328`,
`match_73ca95467746fde9` und `match_8e8d8fa7b8772b55`.

## Vollständiger Decision-Denominator

Alle 620 Entscheidungen wurden vollständig geladen und klassifiziert:

- Seed 1: Indizes 1 bis 107;
- Seed 2: Indizes 1 bis 194;
- Seed 3: Indizes 1 bis 319;
- ausschließlich `ai-decision-trace-v2`;
- LegalActions, Engine-Evidence, actor-private Analysesnapshots und
  Checkpoint-Capture 620/620 persistiert;
- keine Lücke, kein Duplikat, Fallback, Timeout, Auswahlmismatch,
  Engine-Rejection, unbekanntes Assessment oder fehlende Auditsektion;
- 25 Runstarts, sechs gestohlene und zehn von der Corp gescorte Agenden.

SP-047 bestätigt sich erneut teilweise: Seed 3 meldet im Result drei
erfolgreiche Runs, während acht verschiedene vollständige Run-Snapshots
`successful: true` und die Accessphase belegen. Seed 1 und 2 stimmen mit eins
beziehungsweise sieben überein.

## Gewinneranalyse

**Seed 1:** Die Corp scoret Corporate Downsizing, Hostile Takeover und Tycho
Extension in nur 17 Zügen. Der Runner erreicht nur einen erfolgreichen Run,
findet die fehlende Code-Gate-Abdeckung nicht rechtzeitig und investiert seine
letzten Züge korrekt in Draw und Credits. Es gibt keinen belegten produktiven
Contestpfad, den der Plan ignoriert hätte.

**Seed 2:** Der Runner gewinnt über vier gestohlene Agenden. Nach einem frühen
R&D-Punkt contestet er drei aufeinanderfolgende Remote-Projekte. Die Corp
installiert und avanciert bei 5:2 beziehungsweise 6:2 weiter im zuständigen
Scoreplan, kann die Remotes mit ein bis drei Credits aber nicht halten.

**Seed 3:** Die Corp scoret fünf Agenden und gewinnt erst in Zug 45 mit 7:5.
Der Runner stiehlt zweimal aus der Remote, bleibt am Matchpoint jedoch ohne
Code-Gate-Abdeckung. `runner.rig_and_coverage` sucht und baut einen
Creditpuffer auf; ein legaler erfolgreicher Schlussrun ist im gespeicherten
Zustand nicht belegt.

## Verliereranalyse und Metaebene

1. Die Runner-Niederlagen unterscheiden sich: Seed 1 ist ein schnelles
   Coverage-/Temporesultat, Seed 3 ein langer 5:6-Matchpointkampf. Beide
   enthalten exakte Draw- und Fundingrouten statt passivem Leerlauf.
2. Die Corp-Niederlage in Seed 2 folgt aus wiederholtem Remote-Contest bei
   knapper Schutzliquidität. Die gleichen Scorepläne gewinnen jedoch Seed 1
   und 3; ein pauschaler Schutz- oder Scoringsonderfix wäre falsch.
3. Chrome Rush Bureau zeigt die in SP-040 gesuchte Gegenindikation: Ein Corp-
   Deck kann bei funktionierendem Scoretempo trotz Runner-Contest zwei von
   drei Seeds gewinnen. Liquidität bleibt situationsabhängig, nicht
   automatisch eine generelle Corp-Schwäche.
4. Die vollständigen Why-not-Ketten zeigen keine unklassifizierte oder
   dominierende Alternative. Paarung 018 schließt deshalb korrekt ohne
   Codeänderung.

## Verifikation

- drei finale Realpfad-Partien mit 620/620 auditierten Entscheidungen;
- keine Codeänderung und deshalb kein zusätzlicher Testlauf;
- Drilldown auf Score-/Steal-Timeline, letzte Verliererzüge, Coverage- und
  Fundingblocker sowie den abweichenden Resultzähler begrenzt.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
