# KI-Selbstspielzyklus 029 – Fubar-Fortsetzung bestätigt SP-070 unabhängig

Stand: 2026-08-20
Status: drei vollständige Realpfad-Partien; SP-070 auf integriertem `main` reproduziert und verifiziert

## Reproduktionsvertrag

- Auswahlseed: `aa4c95e52e7b4b4b9137693b5398f558`
- Runner: **Proteus Runner – Breaker Lab & Virus Pressure**, 45 Karten,
  `standard_standard_proteus_runner_breaker_lab_2026_05_25_1.0.0`,
  `fnv1a:70ae3c9a`
- Corp: **Vom Tablet**, 45 Karten,
  `standard_standard_corp_mp6g9eku_1.0.0`, `fnv1a:715d8a19`
- Spielseeds: `selfplay-029-75b73681c30b42808e55b079a69712cd`,
  `selfplay-029-bdc4bc055d654ce092b29d99c6426f86` und
  `selfplay-029-f1d6ae2d84ba46a0a8184c2b2a3d1c16`
- Ausgangsstand: `362855fe50d8e615ba94e2fada254dd5d76ef01c`
- Verifikationsstand: `09592b004d11b80236997edf7fe98299f5b46589`
- Auswahl: SHA-256 über `seed:side` modulo 24 Runner- beziehungsweise
  23 Corp-Kandidaten
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf Port 8912 und der fortgeschriebenen isolierten
SQLite-Evidence; keine Datenbank wurde gelöscht.

## Ergebnis wie im Programm

| Partie | Endergebnis | Agendapunkte | Ende | Entscheidungen |
| ------ | ----------: | ------------: | ---- | --------------: |
| Seed 1 | Corp **10 – 4** Runner | **7:4** | Agendapunkte | 220 |
| Seed 2 | Runner **10 – 6** Corp | **10:6** | Agendapunkte | 400 |
| Seed 3 | Runner **10 – 5** Corp | **7:5** | Agendapunkte | 256 |

Finale Match-IDs und StateHashes:
`match_13ed5ec8694aa455` / `fnv1a:9750ac28`,
`match_2c1e6c60de0d2dc4` / `fnv1a:c4d7c0a1` und
`match_8030543119c53f8d` / `fnv1a:2ef3de73`.

## Vollständiger Decision-Denominator

Alle 876 Entscheidungen wurden genau einmal klassifiziert: 220, 400 und 256
Traces, ausschließlich `ai-decision-trace-v2`. LegalActions,
Engine-Evidence, actor-private Analysesnapshots und Checkpoint-Capture sind
876/876 persistiert. `FLAGS=0`: keine Lücke, Duplikate, Fallbacks, Timeouts,
Auswahlmismatches, Engine-Rejections, Unknown-Assessments oder fehlenden
Auditsektionen. Der getrennte, unscoped Eventpass enthält 221, 401 und 257
Events und jeweils den terminalen Zustand. Insgesamt: 62 Runstarts, 15
erfolgreiche Runs, sieben Steals und zehn Corp-Scores.

## Gewinner-, Verlierer- und Metaanalyse

**Seed 1:** Auf dem Ausgangsstand installierte der Runner Fubar, startete in
D48 den gebundenen Remote-Contest und besaß in D49 die kostenlose passende
Wall-Subtype-Action. `runner.convert_run_window` wählte trotzdem
`continue_run`; vier Wiederholungen im selben Zug endeten am ungebrochenen
Wall of Static. Das war dieselbe Ursache wie der unabhängig in Paarung 014
gefundene SP-070-Fall. Auf integriertem Stand wählt D49 innerhalb desselben
Contest-Roots die Wall-Subtype-Action, D50 bricht die ETR-Subroutine und D51
setzt das Engine-Fenster fort. Der Runner erzielt dadurch vier Punkte; die
Corp gewinnt später dennoch mit drei regulären Scores 7:4.

**Seed 2:** Der Runner gewinnt 10:6 mit sieben erfolgreichen Runs und drei
Steals gegen vier Corp-Scores. Die zuvor geprüften defensiven Endturns bei
günstigem terminalem Deckrennen tragen weiter die explizite
`forgo_terminal_deck_pressure`-Disposition und sind weder SP-065 noch eine
neue Verlustursache.

**Seed 3:** Sieben erfolgreiche Runs und drei Steals bringen dem Runner den
7:5-Sieg. Die Corp setzt drei Scorelinien um; keine einzelne ownerlose oder
nachweislich dominante verworfene Aktion erklärt die Niederlage.

Über alle Seeds ist SP-070 damit nicht nur durch den fokussierten
Ownership-Test aus Commit `67855074b` abgesichert, sondern durch eine zweite,
unabhängige Deckpaarung: Die kostenlose exakte Subtype-Vorbereitung bleibt
beim bestehenden Run-Window-Owner, Root und Executor bleiben gebunden und die
nachfolgende Break-Action wird nicht von einem Resolver oder Parallelplan
gewählt. SP-068 bis SP-072 bleiben für Paarung 014 reserviert; Zyklus 029
eröffnet keinen neuen Fall.

## Verifikation

- Vorher-Reproduktion: `match_b117c52f54737aa2`, D49 sowie D68/D70/D72/D74;
- Fix- und Ownership-Regressionen im integrierten funktionalen Commit
  `67855074b`;
- drei frische terminale Realpfad-Replays auf Merge `09592b004`, 876/876,
  `FLAGS=0`;
- Seed 1: D49 Subtype-Vorbereitung, D50 gebundener Break, D51
  Engine-Fortsetzung; keine Wiederholung der vier ETR-Runs.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
