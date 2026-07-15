# Match FD7671 Runner-Remediation: Red Evidence (2026-07-15)

## Quelle und Capture-Grenze

- Match: `match_fd7671d270e1a716`
- Modus: menschliche Corp gegen Runner-KI
- Runner-Profil: `runner-ai-v0.9-hard`
- SQLite-Quelle:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Capture-Code: Ausgangs-`main` auf `c4228e61a`

Die Checkpoints bauen PlayerView und LegalActions erneut über die Engine auf.
Sie enthalten nur das für den Runner redigierte Eventpräfix und erlaubte
Runtime-Metadaten. D53 und D102 besitzen null Warmup-Drift. D132 und D135
werden mit `rebase` erfasst, weil die bereits integrierten E8886-Fixes die
historischen Entscheidungen D123, D124 und D128 bewusst verändert haben. Vor
dem Ziel bleiben drei beziehungsweise sechs aufeinanderfolgende Entscheidungen
kompatibel. Dieser bekannte Warmup-Drift ist vom Zielverhalten getrennt.

## Rote Zielentscheidungen

| Finding    | Anker        | StateHash        | Aktuelle Wahl                                                                         | Erwartung                                                        |
| ---------- | ------------ | ---------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| FD7671-F03 | D53 / SV93   | `fnv1a:177d3952` | Mantis trotz `runner_goal_fit_coverage_search_no_need` durch absoluten Handkartenplan | freier HQ-Check-Run; kein Tutor ohne konkrete Suchlücke          |
| FD7671-F04 | D102 / SV186 | `fnv1a:9a75a429` | Rockerboy aus R&D trashen und die Credits von 5 auf 2 reduzieren                      | im gegnerischen Matchpoint Run-Reserve halten und Trash ablehnen |
| FD7671-F01 | D132 / SV244 | `fnv1a:e9cc46c1` | Basis-Credit statt Run-Lock für 1 Click und 2 Credits lösen                           | Lock lösen, solange Click und erreichbarer Folgerun verbleiben   |
| FD7671-F02 | D135 / SV247 | `fnv1a:4d96ede3` | erneut das erste HQ-ICE wählen                                                        | die noch unbekannte Remote-Root-Position wählen                  |

Der Rex-Fund besitzt absichtlich keinen erfundenen Decision Checkpoint: Die
Corp war menschlich. Der rote Vertragstest prüft stattdessen aktive und
kompilierte Hints. Beide führen derzeit fälschlich `tag`, `tag_pressure` und
`add_tag`, obwohl die vorhandenen Funktionssignale Trace, bedingtes End-the-run
und Run-Lock ausweisen.

## Grüne Gegenproben

Vier synthetische Begleitfälle grenzen die Korrekturen ein:

1. Mit nur einem Click wird der Run-Lock nicht gelöst, weil kein Click für den
   Folgerun bleibt.
2. Eine fokussierte Arbitration-Gegenprobe ohne den negativen
   `coverage_search_no_need`-Befund hält einen Tutorplan gegenüber einem
   Off-plan-Run verbindlich.
3. Mit zwölf Credits bleibt Rockerboy-Trash möglich, weil die Reserve danach
   nicht gefährdet ist.
4. Ist nur ein einziges Installed-Card-Expose-Ziel legal, bleibt genau dieses
   Ziel auswählbar.

## Red-Gate

Der fokussierte Testlauf muss vor dem ersten Produktionsfix genau die vier
historischen Verhaltensfehler und die beiden Rex-Artefakte rot melden. Gültig
sind für die historischen Fälle ausschließlich Fehlercode
`behavior_regression`; Engine-, Runtime-, Fixture-, Redaction- oder
Legalitätsdrift zählen nicht als Freigabe. Die vier Begleitfälle müssen bereits
auf der roten Baseline grün sein.

Nach erfolgreicher Reproduktion werden Fixtures, Tests und dieses Dokument in
einem eigenständigen Red-Evidence-Commit eingefroren.

Ausgeführt:

```text
corepack pnpm --filter @netgrid/ai exec vitest run \
  src/evaluation/decision-checkpoints/match-fd7671-runner-decision-checkpoints.test.ts \
  src/match-fd7671-card-hint-contract.test.ts \
  --maxWorkers=1 --testTimeout=30000 --reporter=verbose
```

Ergebnis: zwei erwartungsgemäß rote Testdateien, sechs rote Tests und vier
grüne Tests. Die vier historischen Fehler tragen jeweils ausschließlich
`behavior_regression`; die zwei weiteren Fehler sind die aktive und die
kompilierte Rex-Hint-Verletzung. Die vier Begleitfälle verteilen sich auf die
historische Checkpoint-Datei und die fokussierten Consumer-Tests und sind grün.
