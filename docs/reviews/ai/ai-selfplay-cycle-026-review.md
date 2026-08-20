# KI-Selbstspielzyklus 026 – Bit-Denial zwischen Scoretempo und Deckdruck

Stand: 2026-08-20
Status: drei vollständige Realpfad-Partien auf integriertem aktuellem `main`
ohne neue belegte KI-Entscheidungslücke

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
- integrierter Prüfstand nach Vorabschluss-Sync:
  `1fdcaad600515ac490433464d0d3f9c8616f103d`
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
| Seed 2 | **Bit-Denial Lock** gegen **Rent to Own War Engine** | Runner **10 – 6** Corp | **8:6** | Agendapunkte | 359 |
| Seed 3 | **Bit-Denial Lock** gegen **Rent to Own War Engine** | Corp **10 – 3** Runner | **8:3** | Agendapunkte | 198 |

Die finalen integrierten Match-IDs lauten `match_d098a509079899ad`,
`match_db81c8201df083f6` und `match_d79f5ebe7a8a903c`. Ihre terminalen
StateHashes sind `fnv1a:f7533b72`, `fnv1a:0679aad0` und `fnv1a:6b4f516e`.

## Vollständiger Decision-Denominator

Alle 743 finalen Entscheidungen wurden vollständig geladen und genau einmal
klassifiziert:

- Seed 1: Indizes 1 bis 186;
- Seed 2: Indizes 1 bis 359;
- Seed 3: Indizes 1 bis 198;
- ausschließlich `ai-decision-trace-v2`;
- LegalActions, Engine-Evidence, actor-private Analysesnapshots und
  Checkpoint-Capture 743/743 persistiert;
- `FLAGS=0`: keine Lücke, kein Duplikat, Fallback, Timeout,
  Auswahlmismatch, Engine-Rejection, nicht zertifizierte Planquote,
  Unknown-Assessment oder fehlende Auditsektion;
- 43 Runstarts, 32 erfolgreiche Runs, fünf gestohlene und acht von der Corp
  gescorte Agenden;
- der getrennte unbeschränkte Eventpass enthält 187, 360 und 199 Events und
  jeweils den terminalen Zustand.

Der erste P026-Lauf auf dem vorherigen Stand war ebenfalls terminal und
vollständig, wurde nach dem verpflichtenden Vorabschluss-Sync aber nicht als
final übernommen: `main` enthielt inzwischen die integrierte P013-
Score-/Defense-Fortsetzung. Seed 1 bleibt über 186 Action-IDs identisch. Seed 2
divergiert erstmals in D118 zur gebundenen Shock.r-Defense statt Basiscredit;
Seed 3 in D20 zur Fetch-4.0.1-Remote-Schicht statt einer weiteren R&D-Schicht.
Die geänderten Suffixe wurden vollständig neu klassifiziert.

## Gewinneranalyse

**Seed 1:** Die Corp scoret drei Agenden zum 9:1. Der Runner startet nur fünf
Runs, davon zwei erfolgreich, und stiehlt eine Ein-Punkt-Agenda. Das frühe
Scoretempo dominiert den Bit-Denial-Aufbau.

**Seed 2:** Der Runner gewinnt 8:6 nach 21 Runs, 17 Erfolgen und drei Steals.
Die Corp konvertiert zwei Agenden und erreicht Matchpoint; der Runner schließt
erst in D359 mit dem dritten Agenda-Steal ab.

**Seed 3:** Die Corp gewinnt 8:3 mit drei eigenen Scores. Der Runner startet 17
Runs, davon 13 erfolgreich, stiehlt aber nur eine Agenda. Die früh abweichende
Remote-/Defense-Allokation wird hier in eine belastbare Scorefolge umgesetzt.

## Verliereranalyse und Metaebene

1. Die Runner-Niederlage in Seed 1 ist ein Scoretempo-/Zugriffsresultat: drei
   Corp-Scores stehen nur zwei erfolgreichen Runs gegenüber.
2. Die Runner-Niederlage in Seed 3 entsteht trotz 13 erfolgreicher Runs, weil
   nur ein Zugriff eine Agenda trifft und die Corp drei Scorelinien schließt.
3. Die Corp-Niederlage in Seed 2 ist ein knapper 6:8-Matchpointkampf; 17
   erfolgreiche Runs liefern dem Runner drei Steals.
4. Das 2:1 für die Corp zeigt weiterhin starke Seedvarianz: Rent to Own
   konvertiert neun, sechs und acht Punkte. Der integrierte P013-Stand stärkt
   konkrete Score-/Defense-Fortsetzungen, ohne jeden Seed gleich zu machen.
5. Kein einzelner sicher besserer legaler Verliererpfad und keine neue
   Planabdeckungslücke sind belegt. Paarung 026 schließt ohne Codeänderung.

## Verifikation

- drei terminale integrierte Realpfad-Partien mit 743/743 fehlerfrei
  auditierten
  Entscheidungen;
- vollständige getrennte Eventhistorien einschließlich Terminalzustand;
- exakte Präfixabgrenzung zum Vor-Sync-Lauf und neue Klassifikation der
  geänderten Suffixe;
- keine Codeänderung und deshalb kein zusätzlicher Testlauf.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
