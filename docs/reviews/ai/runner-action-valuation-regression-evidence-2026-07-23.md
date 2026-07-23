# Evidence: Runner-Aktionsbewertung aus Match fd22cad3

Stand: 2026-07-23

## Fragestellung

Das aktive Match `match_fd22cad3cc454a9e` zeigte zwei auffällige
Runner-Verhaltensklassen:

1. eine zweite Installation von `Psychic Friend` ohne zusätzlichen
   Capability-Gewinn;
2. drei aufeinanderfolgende Zugenden als erste Aktion mit vier verbleibenden
   Klicks.

Dieses Paket friert beide Befunde reproduzierbar ein und macht ihre Häufigkeit
in Selfplay-Läufen sichtbar. Es ändert weder Scoring noch Planwahl,
LegalActions, Tiebreaker oder produktive Ausschlüsse.

## Quellintegrität

- Runtime-Quelle:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Zugriff: ausschließlich read-only über den festen
  `node:sqlite`-Analysepfad
- Matchstatus: aktiv
- Runner-Steuerung: Hard AI
- Erwartete und vorhandene Decisions: 76/76
- Fehlende, verwaiste, doppelte oder falsch zugeordnete Traces: 0
- Capture-Policy: `strict`
- Warmup-Abweichungen aller neuen Checkpoints: 0
- Fixtures enthalten nur reproduzierte PlayerViews, LegalActions und
  redigierte Entscheidungsdaten.

## Historische Checkpoints

| Decision | Reproduzierter Befund                                                  | Vertrag                          |
| -------: | ---------------------------------------------------------------------- | -------------------------------- |
|       14 | erste Installation von `Matador`                                       | grüne Positivkontrolle           |
|       53 | erste Installation von `Psychic Friend`                                | grüne Positivkontrolle           |
|       64 | zweite, negativ bewertete redundante Installation von `Psychic Friend` | erwarteter `behavior_regression` |
|       68 | `end_turn` ohne verbleibenden Klick                                    | grüne Positivkontrolle           |
|       73 | `end_turn` ohne verbleibenden Klick                                    | grüne Positivkontrolle           |
|       74 | `end_turn` als erste Aktion mit vier Klicks                            | erwarteter `behavior_regression` |
|       75 | `end_turn` als erste Aktion mit vier Klicks                            | erwarteter `behavior_regression` |
|       76 | `end_turn` als erste Aktion mit vier Klicks                            | erwarteter `behavior_regression` |

Für Decision 64 ist `gain_credit` als akzeptable Alternative festgehalten.
Für Decisions 74 bis 76 akzeptiert der Vertrag `gain_credit`, `draw_card`
oder das spielbare Event `Meat Upgrade`. Die historischen Fehlentscheidungen
werden damit nicht an genau eine künstliche Ersatzaktion gebunden.

Eine vorhandene eigenständige Positivkontrolle sichert außerdem, dass
`end_turn` mit vier Restklicks korrekt bleiben kann, wenn der nächste
Corp-Draw deterministisch den Deckout und damit den Runner-Sieg auslöst.

Der direkte Checkpoint-Lauf enthält neun grüne Tests: fünf positive Kontrollen
und vier explizite Nachweise, dass ausschließlich
`checkpoint_behavior_failed` mit Klassifikation `behavior_regression`
vorliegt. Fixture-, Redaktions-, Engine-, State- oder Runtime-Drift würde den
Lauf dagegen fehlschlagen lassen.

## Kartenhint- und Consumer-Audit

Der positive Decision-53-Checkpoint liefert denselben Runner-Decksnapshot,
ohne vom absichtlich roten Verhaltensvertrag blockiert zu werden:

- 45 Karten, 23 unterschiedliche Karten;
- 0 Blocking Findings;
- 0 Warnungen;
- Suchkarte:
  `onr_classic_034_boostergang-connections`;
- Primärstrategien:
  `runner.run_event_tempo`, `runner.hq_pressure`,
  `runner.rnd_pressure`;
- Sekundärstrategien:
  `runner.survival_defense`, `runner.interface_closeout`,
  `runner.remote_contest`, `runner.search.breaker`,
  `runner.rig_first`.

Der Audit des roten Decision-64-Checkpoints scheitert ausschließlich an
seinem erwarteten Verhaltensvertrag. Es gibt keinen davon unabhängigen
Hint-, Deck- oder Consumer-Drift.

## Diagnostische Baseline-Metriken

Die Metriken werden ausschließlich aus der vorhandenen redigierten
`ActionSequence` abgeleitet:

- `runnerEndTurnsWithClicks`
- `runnerInevitableCorpDeckoutEndTurnsWithClicks`
- `runnerPrematureEndTurnsWithClicks`
- `runnerPersistentInstallSelections`
- `runnerRedundantPersistentInstallSelections`

Ein Zugende gilt nur dann als vorzeitig, wenn der Runner `end_turn` mit
mindestens einem Restklick auswählt und die vorhandene Evidence nicht
`runner_inevitable_corp_deckout:true` enthält. Eine redundante Installation
wird nur gezählt, wenn die produktive strukturierte Evidence gleichzeitig
`persistentInstallEvaluation:true`,
`persistentInstallDuplicateRole:redundant_duplicate` und einen negativen
`persistentInstallFinalFit` ausweist.

Damit entsteht keine zweite Bewertungslogik. Die Diagnose beobachtet die
bereits getroffene Entscheidung und ihre bereits vorhandene Evidence; sie
verändert die Auswahl nicht.

## Deckübergreifender Lauf

Der vollständige Standardlauf wurde gegen
`ai-behavior-baseline-v1-candidate-19d8375ed-2026-07-20.json`
ausgeführt:

- 60 Spiele;
- 10.929 Entscheidungen;
- zum formalen Baseline-Artefakt vergleichbar;
- 51 Runner-Zugenden mit Restklicks;
- davon 29 belegte deterministische Corp-Deckout-Siege;
- 22 vorzeitige Runner-Zugenden;
- 0,201 vorzeitige Zugenden pro 100 Entscheidungen;
- 228 ausgewählte persistente Installationen;
- 16 redundante negativ bewertete Installationen;
- Redundanzquote 0,070 beziehungsweise 7,0 Prozent.

Der Lauf hat keine Illegal-Action-, Replay-, Fallback-, Timeout-, Runtime-,
Hidden-Info-, No-Legal-Action- oder Redaktionsverletzung. Er ist trotzdem
nicht als vollständig akzeptiert markiert, weil genau ein Spiel das
Aktionslimit erreicht:

- Slot: `strategy_panel_fast_advance_chrome_rush`
- Seed: `ai-behavior-baseline-v1-01`
- 480 Aktionen, 41 Züge
- finaler StateHash: `fnv1a:02fccce8`

Die isolierte Wiederholung reproduziert dieselben 480 Aktionen, 41 Züge und
denselben StateHash. In diesem Spiel werden weder ein vorzeitiges
Runner-Zugende noch eine redundante persistente Installation erkannt. Das
Action-Limit ist damit ein reproduzierbarer eigener Bestandsbefund außerhalb
dieses Test- und Diagnosepakets; es wird nicht verdeckt, aber auch nicht durch
eine sachfremde Laufzeitänderung in diesem Paket behandelt.

## Verifikationsstand

- neue Decision-Checkpoints: 9/9 grün;
- angrenzende Last-two-Decision-Checkpoints: 8/8 grün;
- Checkpoint-Runner-Verträge: 7/7 grün;
- fokussierte Metrik-, Formatter- und Baseline-Tests: 18/18 grün;
- AI-Testshards: 446 Dateien, 3.121 Tests grün;
- `@netgrid/ai`-Typecheck: grün;
- AI-Source-Structure: 691 Produktionsmodule, 0 Runtime- und 0 Typzyklen;
- Hint-Metadata-Gate: 0 Hard Errors;
- Deck-Doctrine-/Strategy-Gate: grün;
- Diff- und Formatprüfung: grün.
