# Aufgabe 042 - Full Compiled Hint Coverage

## Kurzfazit

Aufgabe 042 zieht den Aufgabe-041-Durchbruch flächendeckend durch: der Runtime-Loader bleibt auf `data/ai/ai-card-hints-compiled.json`, das compiled Artefakt enthält alle 410 aktiven AI-Hints, und der Compiler nutzt jetzt den Full-Coverage-Report statt des 10-Karten-Pilotpfads.

Der Full-Cutover ist aktiv. Karten mit Generated Facts erhalten strukturierte mechanische Felder, Karten mit Overlays erhalten die strategischen Ergänzungen, und Karten ohne ableitbare Facts laufen weiter als dokumentierter Legacy-Fallback. Hints erzeugen weiterhin keine LegalActions und keine Playability.

## Bezug zu Aufgabe 041

Aufgabe 041 hat den compiled Pfad runtime-wirksam gemacht und 193 Generated-Facts-Karten in ein 410er Artefakt gemischt. Aufgabe 042 erweitert das Inventar auf alle 410 aktiven Karten, scannt alle vorhandenen O:NR-v1-CardImplementations und hebt die Generated-Facts-Abdeckung auf 305 Karten.

## Coverage

| Kennzahl                       | Wert |
| ------------------------------ | ---: |
| Active AI-Hints                |  410 |
| Compiled Entries               |  410 |
| Karten mit Generated Facts     |  305 |
| Karten mit Manual Overlay      |    6 |
| Legacy-Fallback-only           |   68 |
| Descriptor-/Schema-Gaps        |  239 |
| Manual Overlay required        |    0 |
| Blocked missing Implementation |   37 |
| Hard Errors                    |    0 |
| Warnings                       | 1454 |

Coverage nach Side/CardType:

| Gruppe          | Karten |
| --------------- | -----: |
| corp:agenda     |     36 |
| corp:asset      |     43 |
| corp:ice        |     68 |
| corp:identity   |      1 |
| corp:operation  |     32 |
| corp:upgrade    |     27 |
| runner:event    |     49 |
| runner:hardware |     32 |
| runner:identity |      1 |
| runner:program  |     81 |
| runner:resource |     40 |

Coverage-Klassen:

| Klasse                           | Karten |
| -------------------------------- | -----: |
| `generated_mechanical_clean`     |     60 |
| `generated_plus_overlay`         |      6 |
| `descriptor_or_schema_gap`       |    239 |
| `legacy_fallback_only`           |     68 |
| `blocked_missing_implementation` |     37 |

## Abgedeckte Kartenfamilien

Der Full-Deriver erfasst jetzt mechanische Facts unter anderem für Icebreaker-/BreakerProfile, Base-Link-/Trace-Defense, Damage-/Survival-Prevention, Run-/Access-Replacement, Topdeck-/HQ-/Expose-Info, Search/Install Support, Economy, Recurring-/Counter-Economy, Memory-/Hand-size, Trash Credits, Agendas, Corp ICE, Tag/Punish, Ambushes, RemoteRole, Run Tax, Future-run/Future-encounter und Remote-/Upgrade-Support.

Die wichtigsten neuen Full-Coverage-Zuwächse gegenüber Aufgabe 041 sind: 305 Generated-Facts-Karten statt 193, `base_link`/`trace_defense`-Breite, mehr Runner-Hardware-/Resource-Facts, deutlich mehr Corp-ICE-ETR-/Damage-/Trace-Facts und mehr Remote-/Upgrade-Support-Facts.

## Verbleibende Fallbacks

68 Karten bleiben `legacy_fallback_only`, weil der aktuelle Deriver aus der Implementation im sicheren Scope keine mechanischen Facts gewinnt. Das betrifft vor allem komplexere Runner-Events, ältere Spezialprogramme, einige Runner-Resources sowie wenige Corp Operations, Assets und Upgrades.

37 Karten sind `blocked_missing_implementation`. Das sind Identitäten und Test-/Simple-/Stub-Karten ohne O:NR-v1-CardImplementation-Pfad im Scan. Sie werden nicht als `generated_mechanical_clean` geführt und blockieren den Runtime-Cutover nicht, weil ihr aktiver Legacy-Hint erhalten bleibt.

239 Karten haben `descriptor_or_schema_gap`: mechanische Facts wurden erzeugt, aber Vergleich, Descriptor oder Ontology sind noch gröber als die Implementation. Diese Warnings sind bewusst nicht blockierend.

## Artefakte

- Full-Inventar: `data/ai/ai-derived-basic-facts-full-cards-2026-05-25.json`
- Full-Gate: `scripts/check-ai-derived-facts-full.mjs`
- Full-Report: `docs/reviews/ai/aufgabe-042-full-compiled-hint-coverage-report-2026-05-25.json`
- Compiled Runtime Report: `docs/reviews/ai/aufgabe-042-compiled-hint-runtime-full-report-2026-05-25.json`
- Compiled Runtime Artefakt: `data/ai/ai-card-hints-compiled.json`

`data/ai/ai-card-hints-active.json` wurde nicht geändert.

## Runtime-Loader

`packages/ai/src/ai-hints.ts` lädt weiterhin aus `data/ai/ai-card-hints-compiled.json`. Das Artefakt steht jetzt auf `taskId: "Aufgabe 042"` und `schemaVersion: "ai-card-hints-compiled-v2"`.

Bestehende Consumer sehen die strukturierten Felder weiter:

- BreakerProfile für Runner-Breaker.
- TargetProfiles/Search für `Self-Modifying Code` und `Mystery Box`.
- RemoteRole für Remote-/Trash-/Safety-Entscheidungen.
- Tag/Punish-Facts für `Scorched Earth` und verwandte Karten.
- Future-/Later-ICE-Kontext für `Ball and Chain` und `Canis Major`.

## Tests

Ergänzt wurde `packages/ai/src/compiled-hints-runtime.test.ts` für Full Coverage:

- 410 compiled Hints im Runtime-Loader.
- Kein `aiSupportStatus`-Drift.
- Legacy-Fallback bleibt bit-identisch.
- Generated-Facts-Karten behalten Legacy-Felder und erhalten strukturierte Facts.
- Overlay-Felder werden übernommen, mechanische Overlay-Felder bleiben verboten.
- Hidden-Info-/LegalAction-Felder bleiben draußen.
- SMC bleibt ohne `install_discount`.
- `Mystery Box` behält Free-Install-Kontext.
- `BBS Whispering Campaign` bleibt ohne aktuellen Remaining-Pool.
- `Ball and Chain` / `Canis Major`, `Scorched Earth`, `Red Herrings` und BreakerProfile bleiben über Consumer abgedeckt.
- Info-Facts enthalten keine Hidden-Zone-Identitäten.
- `opponentSignals` sind nur mit `visibleEvidenceOnly: true` zulässig.

## 8-Slot-Benchmark

Konfiguration: `runMatchProgressionBenchmarkSuite({ includeHoldout: true, maxActions: 160, baselineProfile: "belief_ai_v1_4_2", candidateProfile: "current_candidate" })`.

- Slots: 8/8 runnable.
- Spiele: 72 je Profil.
- Safety: `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`.
- Candidate vs Baseline:
  - `corpScores`: 61 vs 52.
  - `runnerSteals`: 118 vs 132.
  - `runnerAgendaPoints`: 237 vs 268.
  - `corpAgendaPoints`: 129 vs 107.
  - `actionLimitRate`: 2.778 vs 2.779 als aufsummierte Slotraten.
  - `corpTagPunishPayoffOntologyUsed`: 31 vs 24.
  - `futureEffectSubroutinesEncountered`: 4 vs 4.

Guardrails bleiben grün: keine illegalen Aktionen, keine Replay-Fehler, keine Timeouts, keine Hidden-Info-Verletzung im compiled Hintpfad.

## Bewusst Nicht Geändert

- Keine Engine-Regeländerung.
- Keine Änderung an LegalActions oder `applyAction`.
- Keine neue Legalität aus Hints.
- Keine Änderung an `aiSupportStatus`.
- Keine Profil-/Default-Umschaltung.
- Keine neuen Decks.
- Keine Holdout-Optimierung.
- Keine manuelle Massenänderung an `data/ai/ai-card-hints-active.json`.
- Keine Hidden-Info-Nutzung.
- Keine Proteus-/Catalog-Baseline-Änderung.
- Keine `packages/catalog`- oder Card-Support-Dateien.

`@netgrid/catalog test` bleibt wie in Aufgabe 041 ein bekannter out-of-scope Extra-Check: der rote Proteus-Baseline-Abgleich stammt aus neu implementierten Proteus-Karten und nicht aus Aufgabe 042.

## Nächster Schritt

Der praktische nächste Schritt ist nicht ein weiterer Runtime-Cutover, sondern das gezielte Schließen der größten `descriptor_or_schema_gap`-Gruppen und danach eine kleinere Overlay-Qualitätsrunde für die wichtigsten Legacy-Fallback-Karten. Der compiled Runtimepfad bleibt dabei aktiv.
