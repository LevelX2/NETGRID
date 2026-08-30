# KI-Selbstspielzyklus 025 – Universal Fast Advance konvertiert drei Seeds

Stand: 2026-08-20
Status: drei vollständige Realpfad-Partien ohne neue belegte KI-Entscheidungslücke

## Reproduktionsvertrag

- Auswahlseed: `4ed10a4bd3ca4c3cb9a263a82f227b25`
- Runner: **Blink Pressure Rig**, 45 Karten,
  `standard_standard_runner_blink_pressure_rig_1.0.0`, `fnv1a:c5525778`
- Corp: **Universal Fast Advance**, 45 Karten,
  `standard_standard_corp_universal_fast_advance_1.0.0`, `fnv1a:94aba061`
- Spielseeds:
  - `selfplay-025-db534ac22ad0af52f067c9719e3ba965`
  - `selfplay-025-ca4997909880ae580e5873688c61319a`
  - `selfplay-025-9157b6b1b187c6afe9a04b7290e94f9f`
- Ausgangsstand: `c74b83ae635c04fd1123d036f8543bbff44d2e11`
- Auswahl: SHA-256 über `seed:side` modulo 24 Runner- beziehungsweise
  23 Corp-Kandidaten
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Port 8912 und derselben fortgeschriebenen
SQLite-Evidence des parallelen Worktrees. Es wurde keine Datenbank gelöscht.

## Ergebnis wie im Programm

| Partie | Standarddecks                                           |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | ------------------------------------------------------- | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | **Blink Pressure Rig** gegen **Universal Fast Advance** | Corp **10 – 4** Runner |      **7:4** | Agendapunkte |            182 |
| Seed 2 | **Blink Pressure Rig** gegen **Universal Fast Advance** | Corp **10 – 5** Runner |      **9:5** | Agendapunkte |            271 |
| Seed 3 | **Blink Pressure Rig** gegen **Universal Fast Advance** | Corp **10 – 2** Runner |      **8:2** | Agendapunkte |            217 |

Die Match-IDs lauten `match_226e4c6674177cb3`,
`match_ea337a3c4df41334` und `match_3e3d32db23aa4bc4`. Ihre terminalen
StateHashes sind `fnv1a:1a1f0eb9`, `fnv1a:7d07aa8e` und `fnv1a:8c6b8a4a`.

## Vollständiger Decision-Denominator

Alle 670 Entscheidungen wurden vollständig geladen und genau einmal
klassifiziert:

- Seed 1: Indizes 1 bis 182;
- Seed 2: Indizes 1 bis 271;
- Seed 3: Indizes 1 bis 217;
- ausschließlich `ai-decision-trace-v2`;
- LegalActions, Engine-Evidence, actor-private Analysesnapshots und
  Checkpoint-Capture 670/670 persistiert;
- `FLAGS=0`: keine Lücke, kein Duplikat, Fallback, Timeout,
  Auswahlmismatch, Engine-Rejection, nicht zertifizierte Planquote,
  Unknown-Assessment oder fehlende Auditsektion;
- 32 Runstarts, 24 erfolgreiche Runs, fünf gestohlene und zehn von der Corp
  gescorte Agenden;
- der getrennte unbeschränkte Eventpass enthält 183, 272 und 218 Events und
  jeweils den terminalen Zustand.

Die neutrale Engine-Evidence `source:unknown` und Informationsgrenzen zu
verdecktem ICE wurden nicht als Fehler gezählt: In keinem der benannten Fälle
lag zugleich ein Vertragsflag, Fallback oder eine nicht zertifizierte
produktive Planquote vor.

## Gewinneranalyse

**Seed 1:** Universal Fast Advance scoret drei Agenden und gewinnt 7:4 in
Corp-Zug 25. Der Runner führt zehn erfolgreiche Runs aus und stiehlt zweimal,
kann die drei tatsächlich konvertierten Scorefenster aber nicht verhindern.

**Seed 2:** Die Corp scoret vier Agenden zum 9:5. Der Runner baut vor dem
gegnerischen Matchpoint einen großen Creditpuffer auf, setzt nach dem 3:6 aber
sofort mehrere Zentral- und Remote-Runs um und stiehlt noch eine Agenda zum
5:6. Neun erfolgreiche von 13 Runs reichen nicht für die letzte Agenda.

**Seed 3:** Drei Corp-Scores beenden die Partie 8:2. Der Runner startet neun
Runs, von denen fünf erfolgreich sind, und stiehlt eine Agenda. Wiederholte
R&D-Verteidigung und die schnelle Scorekonversion begrenzen den Zugriff.

## Verliereranalyse und Metaebene

1. Terminal verliert der Runner dreimal durch Corp-Agendapunkte. Quantitativ
   stehen zehn Corp-Scores fünf Runner-Steals gegenüber.
2. Das Deckmatchup begünstigt die Corp-Konversion: Universal Fast Advance
   erreicht in allen Seeds drei oder vier abgeschlossene Scorelinien, während
   Blink Pressure Rig trotz 24 erfolgreicher Zugriffe nur fünf Agenden findet.
3. Die Ausprägung variiert: Seed 1 besitzt ausschließlich erfolgreiche Runs,
   Seed 2 einen langen 5:6-Matchpointkampf und Seed 3 nur fünf erfolgreiche
   von neun Runs. Die gemeinsame Ursache ist deshalb nicht ein einzelner
   ausgelassener Runner-Zug.
4. Der auffällige Creditaufbau in Seed 2 findet beim Stand 3:4 statt. Nach dem
   tatsächlichen gegnerischen Matchpoint 3:6 löst der vorhandene Runowner den
   Hold auf und setzt produktive Contestpfade um. Das ist eine Gegenindikation
   zu SP-053, keine Wiederholung des behobenen Matchpoint-Holds.
5. Die vollständigen LegalActions und Why-not-Ketten zeigen keine
   unklassifizierte dominante Alternative. Paarung 025 schließt daher ohne
   Codeänderung und ohne künstlich erzeugten Fall.

## Verifikation

- drei terminale Realpfad-Partien mit 670/670 fehlerfrei auditierten
  Entscheidungen;
- vollständige getrennte Eventhistorien einschließlich Terminalzustand;
- Drilldown auf Score-/Steal-Timeline, letzte Verliererzüge,
  Matchpoint-Contest und auffällige Economy-Sequenzen begrenzt;
- keine Codeänderung und deshalb kein zusätzlicher Testlauf.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
