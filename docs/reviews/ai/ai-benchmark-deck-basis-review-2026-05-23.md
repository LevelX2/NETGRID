# AI Benchmark Deck Basis Review 2026-05-23

Quelle: `packages/ai/src/index.ts`, `packages/ai/src/index.test.ts`, `packages/shared/src/demo-decks.ts`, `data/ai/*`, `data/decks/*`, `data/scenarios/ai-*`

## Kurzfazit

Die aktuelle AI-Safety-, Soak-, League- und Progression-Infrastruktur misst fast ausschließlich auf `demo_runner_008` gegen `demo_corp_008`. Dieses Paar ist side-safe, replay-stabil und als Starter-/Harness-Paar brauchbar, aber nur ein `weak_benchmark` für echte Spielstärke: Die Decks sind fiktive kleine Demo-Listen mit sehr dichtem Economy-/Draw-Anteil, kleinem Kartenpool, wenig strategischer Varianz und bisher schlechtem Signal für Corp-Advances und Remote-Trash.

Die späteren Demo-Decks `demo_runner_096` bis `demo_runner_099` und `demo_corp_096` bis `demo_corp_099` sind Mechanik-Harnesses für Trace, Breach, Identity, Hosting, Counter und Bad Publicity. Sie sollten nicht als Progression- oder Spielstärke-Benchmarks verwendet werden.

Im Snapshot-Pool existieren bessere O:NR-nahe Kandidaten (`onr_origin_*`), aber die V1.4.3-League-/Progression-Funktionen verwenden aktuell Runtime-Demo-Deck-IDs und nicht direkt Snapshot-Deckprofile. Für echte Progression-Messung sollte der Benchmark zuerst eine explizite kleine Benchmark-Decksuite aus kuratierten Snapshots oder daraus abgeleiteten `DeckDefinition`s bekommen.

## Aktuelle Verwendungen

| Pfad                                                                | Deckbasis                                                     | Zweck                                               | Bewertung                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| `simulateAiGame()` ohne Deck-Konfiguration                          | `demo_runner_001` / `demo_corp_001`                           | Default-Harness, historische MVP-0.1-Testdecks      | `smoke_only`                                                                |
| `simulateAiSoak()` / `data/ai/ai-soak-seeds-0.9.json`               | `demo_runner_008` / `demo_corp_008`                           | V0.9 Safety-/Quality-Soak über Tuning/Holdout-Seeds | `weak_benchmark`                                                            |
| `runV143SimulationLeague()` / `data/ai/ai-soak-seeds-1.4.3.json`    | `demo_runner_008` / `demo_corp_008`                           | V1.4.3 lokale League über Benchmark-Profile         | `weak_benchmark`                                                            |
| `runDoctrineQualityBenchmark()`                                     | Default aus V1.4.3 Seeds: `demo_runner_008` / `demo_corp_008` | Doctrine-/Safety-Deltas                             | `weak_benchmark`                                                            |
| `runMatchProgressionBenchmark()`                                    | Default aus V1.4.3 Seeds: `demo_runner_008` / `demo_corp_008` | Progression-Diagnose                                | `weak_benchmark`                                                            |
| `runV143ExploitRegressionFixtures()`                                | Default aus V1.4.3 Seeds: `demo_runner_008` / `demo_corp_008` | Exploit-Freshness und sichtbarer ETR-Blocker        | `regression_fixture`                                                        |
| AI side-safe smokes V0.4                                            | `demo_runner_004` / `demo_corp_004`                           | Expanded-demo regression                            | `regression_fixture`                                                        |
| AI side-safe smokes V0.8                                            | `demo_runner_008` / `demo_corp_008`                           | Starter safety smoke                                | `weak_benchmark`                                                            |
| AI side-safe smokes V0.97/V0.98/V0.99                               | `demo_runner_097/098/099` / `demo_corp_097/098/099`           | Release-mechanic harnesses                          | `regression_fixture`                                                        |
| Trace-/Jack-out-Testhelpers                                         | `demo_runner_096` / `demo_corp_096`                           | Trace-Bid-/Run-Fenster-Repros                       | `regression_fixture`                                                        |
| AI deck pool `data/ai/ai-deck-pool-1.0.1.json`                      | `demo_008` snapshots plus `onr_origin_*` snapshots            | seeded random / inventory                           | `demo_008`: `weak_benchmark`; `onr_origin_*`: `curated_benchmark_candidate` |
| AI approval scenario packs `data/scenarios/ai-deck-legal-v19*.json` | keine vollständigen Decks, sondern Kartenfamilien-Szenarien   | AI-support smoke coverage                           | `regression_fixture`                                                        |
| Inline-Testdecks in `packages/ai/src/index.test.ts`                 | synthetische Mini-Decks                                       | einzelne Mechanik-/Decision-Repros                  | `regression_fixture`                                                        |

## Deck-Klassifikation

| Deck oder Snapshot                                | Klasse                        | Begründung                                                                                                                                  |
| ------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `demo_runner_001`                                 | `smoke_only`                  | 12 Karten, einfache Economy/Run/Breaker-Testliste, laut Quelldatei technisches Testdeck und nicht turnierlegal.                             |
| `demo_corp_001`                                   | `smoke_only`                  | 18 Karten, einfache Agenda/Economy/ICE-Testliste mit nur 6 Agenda-Punkten.                                                                  |
| `demo_runner_004`                                 | `regression_fixture`          | Besserer Setup-/Pressure-Harness, aber weiterhin kleine fiktive Demo-Liste.                                                                 |
| `demo_corp_004`                                   | `regression_fixture`          | Testet Tax/Tag/Upgrade-Muster, aber nicht kuratiert genug für Spielstärke.                                                                  |
| `demo_runner_008`                                 | `weak_benchmark`              | Vollständige einfache Breaker-Abdeckung, viel Economy/Draw und Run-Events; als Starter-Progression brauchbar, aber stark fiktiv und eng.    |
| `demo_corp_008`                                   | `weak_benchmark`              | 7 Agenda-Punkte, ICE-Mix, Economy, Asset/Upgrade und Remote-Plan; brauchbarer Starter, aber zu klein und zu glatt für echte Stärke-Messung. |
| `demo_runner_096` / `demo_corp_096`               | `regression_fixture`          | Trace-Bidding-Harness; Corp-Liste hat nur wenige ICE außerhalb Trace-Probe.                                                                 |
| `demo_runner_097` / `demo_corp_097`               | `regression_fixture`          | Breach-/Multiaccess-Harness; nicht als ausgewogenes Deck gebaut.                                                                            |
| `demo_runner_098` / `demo_corp_098`               | `regression_fixture`          | Identity-/Hidden-Zone-Harness mit Einzelkarten für Search/Reveal/Swap.                                                                      |
| `demo_runner_099` / `demo_corp_099`               | `regression_fixture`          | Hosting-/Counter-/Purge-Harness; keine robuste Progression-Liste.                                                                           |
| `demo_runner_123` / `demo_corp_123` snapshots     | `regression_fixture`          | Kleine Mechanic-Unlock-Decks; Runner hat kaum Economy und keine breitere Drucksuite.                                                        |
| `demo_runner_130` / `demo_corp_130` snapshots     | `regression_fixture`          | Private-local Format-Snapshots, inhaltlich sehr nahe an V1.2.3-Minilisten.                                                                  |
| `king_of_the_road_runner_ai_snapshot_v1`          | `weak_benchmark`              | Gute Economy/Draw und viele Breaker, aber keine klare Wall-Abdeckung und kaum Run-Event-/Access-Plan.                                       |
| `onr_origin_runner_ai_snapshot_v1`                | `usable_benchmark`            | Gute Breaker-Abdeckung und zentrale Run-Events/Multiaccess, aber wenig direkte Economy.                                                     |
| `onr_origin_corp_ai_snapshot_v1`                  | `curated_benchmark_candidate` | Scorebare Agendas, solide ICE/Economy, Wall-/Code-Gate-Paket und Remote-Tools.                                                              |
| `onr_origin_runner_ai_event_pressure_snapshot_v1` | `curated_benchmark_candidate` | Breaker-Suite plus Economy, Draw, HQ-Pressure und Interfaces; bester vorhandener Runner-Pressure-Kandidat.                                  |
| `onr_origin_corp_ai_tag_ops_snapshot_v1`          | `usable_benchmark`            | Solides ICE/Economy/Agenda-Gerüst, aber Tag-Ops-Anteil ist conditional und sollte eher Holdout/Variant sein.                                |

## Fachliche Bewertung der wichtigsten Decks

### `demo_runner_008`

- Economy: stark für Demo-Verhältnisse (`simple_economy_event`, `v08_burst_credit_event`).
- Draw/Setup: gut (`simple_draw_event`, `v08_deep_draw_event`, Memory-Chips).
- Breaker: vollständig gegen Barrier/Code Gate/Sentry.
- Druck: einfache Run-Events vorhanden.
- Remote-Contest: kaum spezialisierte Trash-/Contest-Tools.
- Urteil: gut für Safety-Smokes und einfache Progression-Signale, schwach für echte Spielstärke.

### `demo_corp_008`

- Agenda-Dichte: 7 Punkte über drei Agendas, für kleine Matches ausreichend.
- Economy: stark über Operationen und Assets.
- ICE-Mix: Barrier/Code Gate/Sentry plus Tag-ICE vorhanden.
- Remote-Plan: Agenda, Upgrade und Assets vorhanden, aber nur sehr einfache Rollen.
- Urteil: brauchbarer Starter-Scoring-Harness, aber kein belastbares Corp-Remote-Scoring-Benchmarkdeck.

### `onr_origin_runner_ai_event_pressure_snapshot_v1`

- Economy: `Livewire's Contacts`, `Score!` und Draw-Events geben echte Folgeentscheidungen.
- Draw/Setup: `Jack 'n' Joe`, `MIT West Tier`, Mem-Chips.
- Breaker: Walls, Sentries und Universal-/Icebreaker-Optionen vorhanden.
- Druck: HQ-Pressure über `Edited Shipping Manifests` und `HQ Interface`.
- Urteil: bester vorhandener Runner-Pressure-/Run-Event-Kandidat, wenn Snapshot-Ausführung sauber in Benchmarks verdrahtet wird.

### `onr_origin_runner_ai_snapshot_v1`

- Economy: schwächer als die Event-Pressure-Variante.
- Draw/Setup: gut.
- Breaker: vollständig und redundant.
- Druck: R&D-/HQ-Multiaccess über `Custodial Position`, `Executive Wiretaps`, `HQ Interface`.
- Urteil: geeignet als Runner-Rig-/Breaker-Benchmark, aber nicht allein als Economy-Stresstest.

### `onr_origin_corp_ai_snapshot_v1`

- Agenda-Dichte: 8 Punkte, inklusive Hostile Takeover, Project Babylon, Tycho Extension.
- Economy/Draw: Night Shift, Overtime Incentives, Annual Reviews.
- ICE-Mix: Walls und Code Gates solide, Sentry fehlt.
- Remote-Plan: Data Masons und Antiquated Interface Routines stützen ICE-/Remote-Pläne.
- Urteil: bester vorhandener Corp-Central-/ICE-/Economy- und Remote-Scoring-Kandidat, mit offener Sentry-Lücke.

### `onr_origin_corp_ai_tag_ops_snapshot_v1`

- Agenda-Dichte: 7 Punkte, scorebar.
- Economy/Draw: solide.
- ICE-Mix: Walls, Code Gates, Trace-Sentries.
- Tag-/Trace-Paket: trägt ein Tag-Ops-Thema, hat aber mehrere conditional Operationen.
- Urteil: guter Holdout-/Variant-Kandidat, nicht erster Tuning-Standard.

## Empfohlene kleine Benchmark-Decksuite

| Slot                       | Empfehlung                                                                                       | Einsatz                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Corp Remote-Scoring        | `onr_origin_corp_ai_snapshot_v1`                                                                 | Haupt-Corp für Progression-Tuning; misst Remote-Aufbau, Advance-/Score-Horizonte und ICE-/Economy-Planung. |
| Corp Central-/ICE-/Economy | `onr_origin_corp_ai_snapshot_v1` als erster Schritt; später eigene Variante mit Sentry-Ergänzung | Keine zweite vorhandene bessere Central-Liste; Tag-Ops ist eher Holdout.                                   |
| Runner Rig-/Breaker        | `onr_origin_runner_ai_snapshot_v1`                                                               | Misst Setup, Breaker-Installation, Zentraldruck und Multiaccess ohne zu viel Event-Economy.                |
| Runner Pressure-/Run-Event | `onr_origin_runner_ai_event_pressure_snapshot_v1`                                                | Misst Run-Event-Folgeentscheidungen, HQ-Pressure, Interfaces und Economy-Abwägung.                         |
| Holdout-Paar               | `onr_origin_runner_ai_event_pressure_snapshot_v1` gegen `onr_origin_corp_ai_tag_ops_snapshot_v1` | Nicht für Tuning verwenden; prüft Generalisierung gegen Tag-/Trace-/Punish-Paket.                          |
| Safety-Smoke-Paar          | `demo_runner_008` gegen `demo_corp_008`                                                          | Weiterhin für schnelle Safety-, Replay- und Regression-Smokes.                                             |

## Benchmark-Verwendungsmodell

1. Smoke- und Regression-Läufe bleiben auf `demo_008` und den Release-Harness-Decks `096` bis `099`.
2. Progression-Benchmarks sollten nicht mehr nur `demo_008` messen, sondern eine kleine kuratierte Suite:
   - Tuning-Paar A: `onr_origin_runner_ai_snapshot_v1` gegen `onr_origin_corp_ai_snapshot_v1`.
   - Tuning-Paar B: `onr_origin_runner_ai_event_pressure_snapshot_v1` gegen `onr_origin_corp_ai_snapshot_v1`.
   - Holdout-Paar: `onr_origin_runner_ai_event_pressure_snapshot_v1` gegen `onr_origin_corp_ai_tag_ops_snapshot_v1`.
3. `demo_096` bis `demo_099`, V1.2.3-/V1.3.0-Minidecks und inline synthetische Decks bleiben Regression-Fixtures.
4. Spielstärke-Metriken sollten nicht auf rein technischen Testdecks, Einzelmechanik-Harnesses oder sehr kleinen Unlock-Decks bewertet werden.

## Technische Lücke vor Umsetzung

`runV143SimulationLeague`, `runDoctrineQualityBenchmark` und `runMatchProgressionBenchmark` nehmen typseitig zwar `AiSimulationConfig`-Anteile an, `runV143Profile` reicht aktuell aber nur `runnerDeckId`/`corpDeckId` an `simulateAiGame` weiter. Snapshot-basierte Decks aus `deck-snapshots-0.8.json` sind deshalb in der V1.4.3-League nicht als einfache Profil-Decks verdrahtet. Der sauberste nächste Schritt ist kein Deck-Massenumbau, sondern ein kleiner Benchmark-DeckProfile-Adapter, der Snapshot-Decks als explizite `DeckDefinition` plus öffentliche Metadata in die Simulation gibt.

## Entscheidung für den nächsten Progression-Schritt

Der nächste Progression-Ausbau sollte:

- `demo_runner_008`/`demo_corp_008` als Safety-Baseline behalten.
- Eine kuratierte O:NR-Snapshot-Suite für Progression hinzufügen.
- Tuning- und Holdout-Deckpaare trennen.
- Reports klar zwischen `smoke_only`, `regression_fixture`, `weak_benchmark`, `usable_benchmark` und `curated_benchmark_candidate` unterscheiden.

Keine Engine-Regeln, AI-Hints, Supportdaten, Kartentexte oder Decklegalität wurden für diese Bewertung geändert.
