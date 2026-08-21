# KI-Selbstspielzyklus 020 – Matchpoint bricht No-Run-Economy-Hold

Stand: 2026-08-20
Status: generische Matchpoint-Prioritätslücke behoben; Last Call at R&D
gewinnt alle drei finalen Partien

## Reproduktionsvertrag

- Auswahlseed: `459e6e771a184526840c0b00801c86a9`
- Runner: **Last Call at R&D**, 45 Karten,
  `standard_standard_runner_last_call_at_rd_1.0.0`, `fnv1a:61769222`
- Corp: **Universal Fast Advance**, 45 Karten,
  `standard_standard_corp_universal_fast_advance_1.0.0`, `fnv1a:94aba061`
- Spielseeds:
  - `selfplay-020-64e6d6e34c904b4fbd0e4f2c761d1504`
  - `selfplay-020-bedb70b2ec954080bd3ba718e74f0960`
  - `selfplay-020-11dde778b49a45d0a0a160ddca15d572`
- Ausgangsstand: `ab635a26851cbfaefdd8803c5f7836a86373c61b`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Port 8912 mit unverändert persistenter
SQLite-Evidence. Die aktive Standarddeckauswahl verwendete SHA-256 über
`seed:side` modulo 24 Runner- beziehungsweise 23 Corp-Kandidaten.

## Ergebnis wie im Programm

| Partie | Standarddecks                                  |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | ---------------------------------------------- | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | **Last Call at R&D** gegen **Universal Fast Advance** | Runner **10 – 4** Corp |      **8:4** | Agendapunkte |            289 |
| Seed 2 | **Last Call at R&D** gegen **Universal Fast Advance** | Runner **10 – 5** Corp |      **7:5** | Agendapunkte |            210 |
| Seed 3 | **Last Call at R&D** gegen **Universal Fast Advance** | Runner **10 – 5** Corp |      **9:5** | Agendapunkte |            627 |

Die finalen Match-IDs lauten `match_6bc3bdaf2afee4e8`,
`match_0832954754829205` und `match_9fad13ecbda112d9`.

## Vollständiger Decision-Denominator

Alle 1.126 finalen Entscheidungen wurden vollständig geladen und
klassifiziert:

- Seed 1: Indizes 1 bis 289;
- Seed 2: Indizes 1 bis 210;
- Seed 3: Indizes 1 bis 627;
- ausschließlich `ai-decision-trace-v2`;
- LegalActions, Engine-Evidence, actor-private Analysesnapshots und
  Checkpoint-Capture 1.126/1.126 persistiert;
- keine Lücke, kein Duplikat, Fallback, Timeout, Auswahlmismatch,
  Engine-Rejection, unbekanntes Assessment oder fehlende Auditsektion;
- 51 Runstarts, zehn gestohlene und sechs von der Corp gescorte Agenden.

Der vor diesem Zyklus noch offene SP-047-Zählerbefund ist auch in diesen
Replays sichtbar: Die Result-Snapshots melden 4/4/4 erfolgreiche Runs, die
vollständigen actor-private Snapshots enthalten 13/13/22 unterschiedliche
erfolgreiche Access-Run-IDs. Die Ursache und der separate Fix werden in der
gemeinsamen Matrix geführt; dieser Zyklus führt keinen Ersatzwert ein.

## SP-053 – No-Run-Economy-Hold verdrängt Matchpoint-Contest

Der erste dritte Seed `match_1d2972c61a85c449` endete nach 296
Entscheidungen mit 7:2 für die Corp. Nachdem die Corp 5 Punkte erreicht hatte,
wählte `runner.recurring_economy` über 18 Züge hinweg 72-mal den Basiscredit
und erhöhte die Liquidität bis auf 100. Gleichzeitig lagen legal gebundene
HQ- und Remote-Runs anderer Planowner vor. Der P3-Hold des installierten
No-Run-Economy-Commitments verdrängte diese P4-Contestpfade, obwohl die Corp
mit der nächsten Agenda gewinnen konnte.

Der bestehende Recurring-Economy-Owner gibt seinen Hold jetzt frei, sobald
die Gegenseite höchstens zwei Punkte vom Sieg entfernt ist und die Engine
eine legale Runoberfläche quotet. Er wählt dabei keinen Server und keine
Run-Action. `runner.pressure_central`, `runner.contest_remote` und die
Run-Target-Evaluation behalten die vollständige Ziel-, Passierbarkeits- und
Payload-Autorität. Existiert dort kein produktiver Plan, können Economy- und
Coverageowner weiterhin normal handeln.

Im finalen `match_9fad13ecbda112d9` wird der Recurring-Economy-Hold in D189
bei 2:5 und 55 Credits blockiert. `runner.pressure_central` wählt den
gebundenen HQ-Run mit unverändertem Root und Leaf. Die Partie enthält danach
24 statt sieben Runs und endet regulär 9:5 für den Runner.

## Gewinneranalyse

**Seed 1:** Die Corp scoret in D64 und D77 früh vier Punkte. Der Runner
konvertiert anschließend drei erfolgreiche Zugriffslinien in Steals und
gewinnt in D289 mit 8:4. Die Corp verfügt am Ende über 30 Credits; die
Niederlage folgt hier nicht aus fehlender Liquidität, sondern aus drei
späteren Agenda-Zugriffen.

**Seed 2:** Beide Seiten erreichen 5 Punkte. Der Runner stiehlt in D189 und
D210 zwei aufeinanderfolgende Agenden und gewinnt 7:5. Die Corp endet mit nur
zwei Credits; die gespeicherten Defense- und Scorepläne sind vollständig
klassifiziert, belegen aber keine noch bezahlbare dominante Gegenlinie.

**Seed 3:** Die Corp erreicht in D187 den Stand 5:2. Der reparierte
Matchpoint-Preempt löst in D189 einen HQ-Run aus und beendet das endlose
Economy-Hold. Der Runner stiehlt in D268, D596 und D627 drei weitere Agenden
und gewinnt 9:5. Die lange Partie ist kein Beweis, dass jeder Matchpoint-Run
sofort trifft; sie belegt aber, dass die zuständigen Runowner wieder handeln.

## Verliereranalyse und Metaebene

1. Universal Fast Advance scoret in allen drei Seeds insgesamt sechs
   Agenden. Seed 1 und 2 sind knappe 4:5- beziehungsweise 5:5-Zwischenstände;
   ein pauschaler Fast-Advance- oder Scorefix wäre durch die Evidenz nicht
   gedeckt.
2. SP-053 ist kein Serverbewertungsfehler. Der Recurring-Economy-Owner
   blockierte als höher priorisierter Hold die bereits vorhandenen Runowner.
   Der Fix liegt deshalb am Investmenthorizont und erzeugt keine parallele
   Runentscheidung.
3. Die Grenze bleibt eng: Vor dem ersten automatischen Payout und ohne
   gegnerischen Matchpoint darf ein schwacher Run weiterhin hinter dem
   No-Run-Commitment warten. Bekannte Agenda- und eigene Matchpointpfade
   behalten ihre bisherigen, stärkeren Preempt-Verträge.
4. Der SP-047-Zählerbefund bleibt von SP-053 getrennt. Ergebnis- und
   Entscheidungsevidenz werden nicht durch einen lokalen Berichtsfallback
   vermischt.

## Verifikation

- drei finale Realpfad-Partien mit 1.126/1.126 auditierten Entscheidungen;
- der fokussierte Investmenthorizont-Test ist mit 5/5 grün;
- drei fokussierte Planownership-Fälle sind grün: gegnerischer Matchpoint,
  bekannte Agenda sowie unveränderter schwacher Hold nach erstem Payout;
- der AI-Paket-Typecheck erreicht ausschließlich die bereits vorhandenen
  fünf Baselinefehler: eine optionale `appliesToRunner`-Property und vier
  nicht vorhandene CardSpec-Migrationsreports;
- der neue Test sichert, dass der Hold blockiert wird und
  `runner.contest_remote` die exakte Run-Action unter unveränderter
  Plan-/Step-Ownership auswählt;
- ein breiter Lauf derselben historisch zustandsbehafteten Plan-Testdatei
  zeigt weiterhin 13 unabhängige Reihenfolge-/Baselineabweichungen; sie sind
  nicht durch SP-053 entstanden und wurden nicht in diesen Scope gezogen.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
