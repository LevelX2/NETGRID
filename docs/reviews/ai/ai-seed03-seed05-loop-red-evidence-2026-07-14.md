# Seed 03 und Seed 05: rote KI-Schleifenverträge

Status: P1 erfüllt; Produktionscode unverändert rot

## Zweck

Die Action-Limit-Schleifen aus den Baseline-v1-Seeds 03 und 05 sind vor dem
Fix als dauerhafte Correctness-Verträge gesichert. Der Capture verwendet den
produktiven Selfplay-Controller, dieselben eingefrorenen Benchmark-Decks,
Seeds, Aktionsindizes, Engine-States, Public-Event-Präfixe, PlayerViews,
LegalActions und Runtime-Memories wie der analysierte Lauf.

Der vorhandene Selfplay-Capture-Hook wurde dafür um einen Baseline-Slot-Adapter
ergänzt. Die redigierte Roh-Evidence allein enthielt keinen vollständigen
GameState und wurde deshalb nicht in eine synthetische Fixture umgedeutet.

## Eingefrorene Einzelentscheidungen

| Vertrag                                        | Seed / Aktion        | Ausgangsfehler                                                                                             | Erwartung                                                      |
| ---------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `baseline-seed03-broker-over-target`           | Seed 03 / Aktion 271 | Broker wird bei 12 Pool- und 9 gespeicherten Credits ohne Fundingbedarf weiter befüllt.                    | Die weitere Broker-Einzahlung ist verboten.                    |
| `baseline-seed03-rich-credit-loop`             | Seed 03 / Aktion 282 | Der Runner beginnt die reine Basic-Credit-Schleife trotz 13 Alternativen und vorhandener Entwicklungswege. | Ein weiterer Basic Credit ist verboten.                        |
| `baseline-seed05-newsgroup-rich-loop`          | Seed 05 / Aktion 211 | Newsgroup Filter gewinnt bei 53 Credits gegen Draw und legale Entwicklung.                                 | Die erneute Newsgroup-Aktivierung ist verboten.                |
| `baseline-seed05-newsgroup-low-credit-control` | Seed 05 / Aktion 27  | Der Runner besitzt erst 2 Credits und benötigt weiterhin Liquidität.                                       | Die zweite Newsgroup-Aktivierung bleibt ausdrücklich zulässig. |
| `baseline-seed05-netwatch-no-conversion`       | Seed 05 / Aktion 467 | Netwatch wird bei 6 Korp- gegen 109 Runner-Credits durch den Punish-Plan erzwungen.                        | Die erneute Netwatch-Aktivierung ist verboten.                 |

Die Netwatch-Quelle liegt in der sichtbaren eigenen Score Area. Der allgemeine
Checkpoint-Matcher berücksichtigt deshalb nun auch diese bereits side-sichere
Zone; das erweitert nur die Testausdruckskraft.

## Sequenzielle Verträge

- `plan-memory-progress.test.ts` bildet zwei aufeinanderfolgende gemappte
  Punish-Schritte ohne sichtbaren Fortschritt ab. Erwartet werden TTL 1 nach
  dem ersten Fehlschlag und `abandoned` mit TTL 0 nach dem zweiten.
- `trace-tag-success-estimate.test.ts` verlangt bei 6 zu 109 Credits keine
  erwartete Trace-Konversion, erhält aber die starke positive Gegenprobe bei
  6 zu 4 Credits.
- `selfplay-trace-mining.test.ts` bildet zwei vollständige Netwatch-/Newsgroup-
  Zyklen ohne Boardfortschritt ab. Beide Seiten müssen als
  `repeatable_action_no_progress_loop` erkannt werden.

Der neue Detector ist diagnostisch, redigiert und keiner automatischen
Bewertungs- oder Trainingswirkung ausgesetzt. Seine Taxonomiezuordnung lautet
`economy_starvation` plus `plan_step_mismatch`.

## Roter Nachweis

Fokussierter Lauf:

```text
vitest run
  packages/ai/src/evaluation/decision-checkpoints/baseline-seed03-seed05-loop-decision-checkpoints.test.ts
  packages/ai/src/plans/plan-memory-progress.test.ts
  packages/ai/src/runtime/trace-tag-success-estimate.test.ts
  packages/ai/src/simulation/selfplay-trace-mining.test.ts
```

Ergebnis vor dem Fix:

- 4 Testdateien rot;
- 7 fachliche Zieltests rot;
- 44 Bestands- und Gegenverträge grün;
- alle vier roten Einzelcheckpoints: `behavior_regression`;
- kein `engine_legality_drift`;
- kein `runtime_state_drift`;
- kein Fixture-, Migrations- oder Redaction-Fehler;
- Low-Credit-Newsgroup-Gegenvertrag grün.

Die Einzelentscheidungen reproduzieren exakt die analysierte falsche Auswahl:
Broker, Basic Credit, Newsgroup Filter und Netwatch Operations Office. Der
Plan-Memory-Test erhält fälschlich erneut TTL 2, die Trace-Schätzung liefert
fälschlich 0,25 und der neue Schleifendetektor liefert noch keinen Fund.

## Fix-Grenzen

- Expectations bleiben unverändert.
- Newsgroup- und Netwatch-Nutzung erhalten keine absolute Aktionsgrenze.
- Erst P2 darf Fähigkeitssemantik und marginale Creditbewertung ändern.
- Erst P3 darf Planfortschritt, Trace-Sequenznutzen und Detector-Logik ändern.
- Blink-Konversion wird in P4 separat gegen die bereits vorhandene universelle
  Coverage-Architektur geprüft; sie wird nicht als Begründung für die P2-/P3-
  Änderungen missbraucht.
