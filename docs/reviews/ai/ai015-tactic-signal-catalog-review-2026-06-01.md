# AI015 Taktiksignal-Katalog und Ableitungsregeln prüfen

Aufgabe-ID: AI015

## Findings

### Hoch: `score.agenda_action` ankert aktuell zu breit auf `corp.fast_advance`

Fundstellen: `data/ai/function-signal-derivation-v1.json` Regel `score.agenda_action`; DeckDoctrine nutzt `score.agenda_action` zusätzlich als `scoreAcceleration`-/`scorePlan`-Support in `packages/ai/src/deck-doctrine-strategy.ts`.

Risiko: Jede scored Agenda Action wird als Fast-Advance-Anchor behandelt. Das ist für echte Score-/Advance-Beschleunigung plausibel, aber für reine scored Utility oder Punish-Payoffs zu breit. Beispiel: `On-Call Solo Team` bekommt neben `damage.payoff` und `tag.payoff` auch `score.agenda_action` und daraus `corp.fast_advance`, obwohl die Karte fachlich primär Tag/Damage-Payoff ist.

Empfehlung: `score.agenda_action` zunächst als taktisches Supportsignal behalten, aber nicht automatisch `corp.fast_advance` ankern. Für Fast-Advance sollte eine engere Ableitung an `advance_burst`, `score_acceleration`, Advancement-Counter oder Score-Kosten-/Timing-Descriptors hängen.

### Hoch: `tag.payoff` ankert zu breit auf `corp.damage_kill`

Fundstellen: `data/ai/function-signal-derivation-v1.json` Regeln `tag.payoff`; Beispiele aus `data/ai/ai-card-hints-compiled.json` zeigen `tag_punish_payoff` mit `resource=credits`, `resource=cards` oder ohne `resource`.

Risiko: `tag.payoff` erzeugt aktuell immer `corp.tag_trace_punish` und `corp.damage_kill`. Das ist für `On-Call Solo Team`, `Scorched Earth` oder `Punitive Counterstrike` korrekt, aber für `Closed Accounts`, `Corporate Detective Agency` oder `Power Grid Overload` zu breit, weil diese Karten keinen Damage-Kill-Payoff darstellen.

Empfehlung: `tag.payoff -> corp.tag_trace_punish` behalten. `corp.damage_kill` nur über `damage.payoff` oder über `tag_punish_payoff` mit `resource=damage` und passendem Scope ankern.

### Mittel: ICE-/Modifier-Facts haben Lücken im Taktiksignal-Katalog

Fundstellen: `Black Ice Quality Assurance` und `Ice Transmutation` haben mechanische Facts wie `remote_protection`, `global_modifier`, `resource=strength`, `resource=subroutines`, `scope=ice`, aber keine abgeleiteten Taktiksignale.

Risiko: Die AI014-Hauptansicht zeigt bei solchen Karten korrekt "Mechanische Daten vorhanden, aber noch keine Taktiksignale abgeleitet". Fachlich fehlt aber die Zwischenebene für ICE-Stärke, Subroutine-Wiederholung, Breakkosten-/Tax und ICE-Subtype-Synergie.

Empfehlung: Späterer enger Descriptor-/Derivation-Batch für `ice.modifier_strength`, `ice.subroutine_modifier`, `tax.ice_break_cost` oder vergleichbare grobe Funktionsklassen. Nicht jede Spezialwirkung braucht ein eigenes Signal; amount, resource, timing und scope sollten Detailfelder bleiben.

### Mittel: Ambush-/Access-Punish mit persistentem Runner-Tax ist noch nicht präzise genug

Fundstelle: `Doppelganger Antibody` erzeugt nur `economy.counter`, obwohl die Karte fachlich eher Ambush/Access-Punish plus persistenter Runner-Credit-Tax ist.

Risiko: `economy.counter` ist als neutrales Economy-Signal zu grob und beschreibt hier die gegnerische Belastung nicht ausreichend. Dadurch bleibt die Karte ohne `corp.ambush_bluff`- oder Tax-Anker, obwohl die mechanischen Facts `persistent_counter_effect`, `scope=runner`, `timing=on_access` und `requires_accessed_card` enthalten.

Empfehlung: Späterer Batch für `access.punish`-/`tax.runner_persistent`-Ableitung aus `persistent_counter_effect` plus `requires_accessed_card`, ohne bestehende Karten jetzt zu migrieren.

### Niedrig: Strategy-Goal-`anchorSignals` enthalten geplante oder historische Signalnamen

Fundstelle: `data/ai/strategy-goals-v1.json` nennt unter anderem `pressure.rnd`, `remote.scoring_pressure`, `score.fast_advance`, `damage.kill`, `ice.cheap_etr`, die im aktuellen Function-Signal-Derivation-Katalog nicht als Signale existieren.

Risiko: Aktuell bricht nichts, weil reale derived Strategy Anchors aus `function-signal-derivation-v1.json` kommen und die Taxonomieprüfung grün ist. Für Folgearbeiten ist aber unklar, welche `anchorSignals` normative Zielsignale und welche historische Planbegriffe sind.

Empfehlung: In einem späteren read-only Taxonomie-Cleanup `strategyGoals.anchorSignals` gegen den echten Taktiksignal-Katalog normalisieren oder explizit als Ziel-/Plan-Hints kennzeichnen.

## Kurzfazit

Der kontrollierte Katalog umfasst 51 eindeutige Taktiksignal-IDs in 57 Ableitungsregeln. Im aktuellen Inspector-Index kommen 44 dieser Signale tatsächlich vor; 330 von 564 Karten haben mindestens ein Taktiksignal, 62 Karten haben mechanische Facts, aber kein Taktiksignal. Die Grundarchitektur ist tragfähig: Function-Signals werden read-only aus strukturierten Hints abgeleitet, nicht aus Legacy-`roles`, `planRoles` oder `lineSupport`. Vor weiterer Kartenarbeit sollten aber die zu breiten Anchor-Regeln und die erkannten ICE-/Ambush-Lücken geschnitten werden.

## Begriffsklärung

- Taktiksignal: Eine grobe funktionale Aussage, wofür die KI eine Karte nutzen kann, zum Beispiel `damage.payoff`, `breaker.wall` oder `access.rnd_multiaccess`. Es ist keine LegalAction und kein PlanWeight.
- Strategieanker: Eine side-spezifische große Deckstrategie wie `corp.damage_kill` oder `runner.rnd_pressure`. Ein Taktiksignal darf nur dann einen Strategieanker auslösen, wenn Side, CardType, Scope und fachliche Bedeutung eng genug sind.
- Strategische Rolle: Rolle einer Karte innerhalb einer Strategie, zum Beispiel `punish_payoff`, `engine_anchor`, `scoring_tool` oder `tax_tool`.
- Mechanische Facts: Strukturierte, regelnähere Felder wie `effects`, `conditions`, `breakerProfile`, `remoteRole`, `costProfile` und `targetProfiles`, aus denen Taktiksignale abgeleitet werden.

## Ausgangszahlen

| Kennzahl | Wert |
| --- | ---: |
| Ableitungsregeln | 57 |
| Eindeutige katalogisierte Taktiksignale | 51 |
| Aktuell vorkommende Taktiksignale im Inspector-Index | 44 |
| Karten mit mindestens einem Taktiksignal | 330 / 564 |
| Karten mit mechanischen Facts, aber ohne Taktiksignal | 62 |
| Karten mit derived Strategy Anchors | 226 |
| Runner-side-spezifische Signale | 13 |
| Corp-side-spezifische Signale | 17 |
| Neutrale Signale ohne Side-Gate | 21 |
| Signale mit `strategyAnchorFor` | 30 |
| reine Supportsignale ohne `strategyAnchorFor` | 21 |

## Ableitungsquellen

`data/ai/function-signal-derivation-v1.json` ist die führende Katalogquelle. Die aktuelle Ableitung nutzt:

- `effects`: 39 Regeln, 35 eindeutige effects-only Signale.
- `breakerProfile.coverage`: 9 Regeln, 9 Breaker-/Coverage-Signale.
- `remoteRole`: 9 Regeln, 6 remoteRole-only Signale plus `tag.payoff` als gemischtes Signal.
- `conditions`: als Quelle im Code unterstützt, aktuell aber ohne Regel.

Die Ableitung im Inspector erfolgt in `scripts/build-ai-hint-inspector-index.mjs` über `deriveFunctionSignalsFromHint`. Die Policy in `function-signal-derivation-v1.json` hält fest: `roles` und `planRoles` sind nur Legacy-Kontext, `lineSupport` ist nur Legacy-Strategiekontext, und `valueHints` sind keine Function-Truth. Die ausgewerteten Regeln bestätigen das: Es gibt keine Function-Signal-Ableitung aus Legacy-`roles`, `planRoles` oder `lineSupport`.

## Signalgruppen

| Gruppe | Katalogsignale | Vorkommende Signale | Karten-Signal-Vorkommen |
| --- | ---: | ---: | ---: |
| Economy | 11 | 10 | 121 |
| Setup / Draw / Search / Recovery | 4 | 4 | 39 |
| Breaker / Coverage | 9 | 8 | 42 |
| Access / Multiaccess / Info | 5 | 5 | 14 |
| Remote / Scoring Protection / Steal Tax | 6 | 5 | 34 |
| Score / Advance / Scored Ability | 2 | 2 | 15 |
| Tag / Trace / Punish | 3 | 3 | 46 |
| Damage / Kill | 1 | 1 | 38 |
| Ambush / Access Punish | 1 | 1 | 5 |
| Defense / Survival | 3 | 3 | 44 |
| ICE / ETR / Tax / Modifier | 3 | 2 | 62 |
| Run Tempo / Bypass / Force-Rez | 3 | 0 | 0 |

## Aktueller Taktiksignal-Katalog

| Signal | Gruppe | Seite | Bedeutung / Regelquelle | Vorkommen | StrategyAnchor | Beispiele und Unsicherheiten |
| --- | --- | --- | --- | ---: | --- | --- |
| `access.hq_multiaccess` | Access / Multiaccess | runner | HQ-Multiaccess aus `effects.kind=multiaccess`, `scope=hq` | 2 | `runner.hq_pressure`, `runner.interface_closeout` | `All-Hands`, `Executive Wiretaps`; Anchor plausibel. |
| `access.rnd_multiaccess` | Access / Multiaccess | runner | R&D-Multiaccess aus `effects.kind=multiaccess`, `scope=rnd` | 2 | `runner.rnd_pressure`, `runner.interface_closeout` | `Rush Hour`, `Custodial Position`; Anchor plausibel. |
| `access.punish` | Ambush / Access Punish | corp | negativer Access-Effekt aus `effects.kind=access_punish` | 5 | `corp.ambush_bluff` | `Experimental AI`, `Vacant Soulkiller`, `Crybaby`; gutes Ambush-Signal, aber persistent Tax ist separat offen. |
| `breaker.ap` | Breaker / Coverage | neutral | AP-Coverage aus `breakerProfile.coverage` | 2 | - | `Flak`, `Reflector`; reines Supportsignal. |
| `breaker.black_ice` | Breaker / Coverage | neutral | Black-ICE-Coverage aus `breakerProfile.coverage` | 0 | - | Katalogsignal ohne aktuelle Vorkommen; Supportsignal. |
| `breaker.code_gate` | Breaker / Coverage | neutral | Code-Gate-Coverage aus `breakerProfile.coverage` | 7 | - | `Skeleton Passkeys`, `Codecracker`, `Raffles`; Supportsignal, kein Strategieanker. |
| `breaker.sentry` | Breaker / Coverage | neutral | Sentry-Coverage aus `breakerProfile.coverage` | 13 | - | `AI Boon`, `Big Frackin' Gun`; Supportsignal. |
| `breaker.trace` | Breaker / Coverage | neutral | Trace-Coverage aus `breakerProfile.coverage` | 1 | - | `Replicator`; Supportsignal. |
| `breaker.universal` | Breaker / Coverage | neutral | Universal-Coverage aus `breakerProfile.coverage` | 4 | - | `Blink`, `Dropp`, `Krash`; Supportsignal. |
| `breaker.unknown_special` | Breaker / Coverage | neutral | Sonder-Coverage aus `breakerProfile.coverage` | 2 | - | `Fubar`, `Morphing Tool`; bewusst unscharf. |
| `breaker.wall` | Breaker / Coverage | neutral | Wall-Coverage aus `breakerProfile.coverage` | 12 | - | `Bulldozer`, `Corrosion`, `Dwarf`; Supportsignal. |
| `breaker.watchdog` | Breaker / Coverage | neutral | Watchdog-Coverage aus `breakerProfile.coverage` | 1 | - | `Dogcatcher`; Supportsignal. |
| `damage.payoff` | Damage / Kill | corp | Runner-Damage aus `effects.kind=damage`, `scope=runner` | 38 | `corp.damage_kill` | `Fetal AI`, `On-Call Solo Team`, `Scorched Earth`; Anchor plausibel, Side/Scope-Gate vorhanden. |
| `defense.damage_prevention` | Defense / Survival | runner | Damage-/Flatline-Prevention | 22 | `runner.survival_defense` | `Skullcap`, `Bolt-Hole`; Anchor plausibel. |
| `defense.tag_prevention` | Defense / Survival | runner | Tag-Prevention | 7 | `runner.survival_defense` | `Fall Guy`, `Leland`; Anchor plausibel. |
| `defense.trace_defense` | Defense / Survival | runner | Trace-Defense oder Link | 15 | `runner.survival_defense` | `The Deck`, `Runner Sensei`; Anchor plausibel, Link bleibt grob. |
| `economy.action` | Economy | neutral | action-basierte Economy | 7 | - | `Broker`, `Short-Term Contract`; Supportsignal. |
| `economy.advanceable` | Economy | corp | advanceable Economy | 0 | `corp.economy_rez_reserve` | Katalogregel ohne aktuelle Vorkommen; auf Descriptor-Bedarf prüfen. |
| `economy.burst` | Economy | neutral | Burst-Economy über `advance_burst` | 3 | - | `Project Consultants`; als Economy-Support ok, StrategyAnchor bewusst nein. |
| `economy.counter` | Economy | neutral | Counter-basierte Economy | 18 | - | `Doppelganger Antibody`, `Loan from Chiba`; zu grob für gegnerischen Tax/Ambush. |
| `economy.finite_pool` | Economy | neutral | endlicher Credit-Pool | 10 | - | `Detroit Police Contract`, `BBS Whispering Campaign`; Supportsignal. |
| `economy.generic` | Economy | neutral | generische Economy | 44 | - | breites Supportsignal; kein Strategieanker. |
| `economy.recurring` | Economy | neutral | wiederkehrende Economy | 4 | - | `Braindance Campaign`, `Investment Firm`; Supportsignal. |
| `economy.rez_discount` | Economy / Rez Support | corp | Rez-Discount | 7 | `corp.economy_rez_reserve` | `Priority Requisition`, `Data Masons`; Anchor plausibel. |
| `economy.start_of_turn` | Economy | neutral | Start-of-turn-Economy | 3 | - | Campaigns; Supportsignal. |
| `economy.trace_credit` | Economy | neutral | Trace-Credit-Support | 2 | - | `Pocket Virtual Reality`, `Hacker Tracker Central`; Supportsignal. |
| `economy.trash_credit` | Remote Trash | runner | Runner-Trash-Credits | 23 | `runner.remote_trash` | `Cloak`, `Invisibility`; Anchor plausibel. |
| `ice.etr` | ICE / ETR / Tax | corp | End-the-run-ICE | 54 | `corp.ice_tax_glacier` | breites Glacier-Supportsignal; kann Tax/Glacier-Dichte überschätzen. |
| `ice.future_pressure` | ICE / ETR / Tax | corp | späterer Encounter-Effekt | 8 | `corp.ice_tax_glacier` | `Minotaur`, `Ball and Chain`; grob, aber side/scope-gated. |
| `tax.ice` | ICE / Tax | corp | ICE-run-tax mit `scope=ice` | 0 | `corp.ice_tax_glacier` | Regel trifft aktuell nicht, weil viele Facts `scope=run_path` nutzen. |
| `info.expose` | Info | neutral | Expose-Info | 5 | - | `I Spy`, `SeeYa`; Supportsignal. |
| `info.hq` | HQ Info | runner | HQ-Info | 2 | `runner.hq_pressure` | `Boardwalk`; Anchor plausibel. |
| `info.rnd_topdeck` | R&D Info | runner | R&D-Topdeck-Info | 3 | `runner.rnd_pressure` | `Deep Thought`; Anchor plausibel. |
| `remote.agenda_steal_tax` | Remote / Steal Tax | corp | Agenda-Steal-Tax aus `remoteRole` | 1 | `corp.remote_scoring` | `Red Herrings`; Anchor plausibel. |
| `remote.ambush` | Ambush | corp | Ambush-Remote aus `remoteRole` | 5 | `corp.ambush_bluff` | `Setup!`, `Vacant Soulkiller`; Anchor plausibel. |
| `remote.asset_economy` | Remote Economy | corp | Asset-Economy-Remote | 16 | `corp.asset_economy` | `ACME Savings and Loan`, Campaigns; Anchor plausibel. |
| `remote.bait` | Remote Bait | corp | Bait-Remote | 0 | `corp.ambush_bluff` | Katalogsignal ohne aktuelle Vorkommen. |
| `remote.scoring_protection` | Remote Protection | corp | Scoring-Protection-Remote | 5 | `corp.remote_scoring` | `Encoder, Inc.`, `Rio de Janeiro City Grid`; Anchor plausibel. |
| `tax.remote` | Remote Tax | neutral | Remote/Fort/Run-Tax aus `remoteRole` | 7 | - | `Newsgroup Taunting`, City Grids; wahrscheinlich corp-spezifisch statt neutral prüfen. |
| `run.event_tempo` | Run Tempo | runner | Future-run-effect | 0 | `runner.run_event_tempo` | Katalogsignal ohne aktuelle Vorkommen; späterer Batch. |
| `run.extra_action` | Run Tempo | runner | Extra Action für Runner | 0 | `runner.run_event_tempo` | Katalogsignal ohne aktuelle Vorkommen; späterer Batch. |
| `run.lock` | Run Tempo | runner | Run-Lock / Server-Lock | 0 | `runner.run_event_tempo` | Katalogsignal ohne aktuelle Vorkommen; späterer Batch. |
| `score.advance_burst` | Score / Advance | corp | Advancement-Burst | 3 | `corp.fast_advance` | `Project Consultants`, `Systematic Layoffs`; Anchor plausibel. |
| `score.agenda_action` | Scored Ability | corp | scored Agenda Action | 12 | `corp.fast_advance` | Zu breit; `On-Call Solo Team` zeigt falsche Fast-Advance-Nähe. |
| `setup.draw` | Setup / Draw | neutral | Draw oder Shuffle-Draw | 19 | - | Supportsignal. |
| `setup.install_discount` | Setup | neutral | Install-Discount | 7 | - | Supportsignal. |
| `setup.recovery` | Recovery | runner | Karten-/Program-Recovery | 3 | `runner.breaker_search` | `Forgotten Backup Chip`; Anchor plausibel, aber nicht jede Recovery ist Breaker-Suche. |
| `setup.search` | Search | runner | Search/Tutor | 10 | `runner.breaker_search` | `Self-Modifying Code`, `Airport Locker`; Anchor plausibel bei Runner Rig. |
| `tag.payoff` | Tag / Punish | corp | Payoff bei Tags aus `effects` oder `remoteRole` | 17 | `corp.tag_trace_punish`, `corp.damage_kill` | `corp.damage_kill` zu breit bei Credits/Cards-Payoffs. |
| `tag.source` | Tag Source | corp | Tag-Erzeugung | 20 | `corp.tag_trace_punish` | Anchor plausibel. |
| `trace.source` | Trace Source | corp | Trace-Quelle | 9 | `corp.tag_trace_punish` | Anchor plausibel. |

## Side- und Scope-Regeln

- Strategy Goals müssen side-präfixiert bleiben (`runner.*`, `corp.*`).
- Taktiksignale müssen nicht immer side-präfixiert sein. Neutrale Supportsignale sind sinnvoll bei Economy, Draw, Breaker-Coverage und generischer Info, solange sie keinen Strategieanker auslösen.
- Jedes Signal mit `strategyAnchorFor` braucht ein Side-Gate. Das bestehende Taxonomie-Gate prüft das bereits hart.
- Effect-basierte StrategyAnchor-Regeln sollten zusätzlich Scope oder `match.scope` haben. Das bestehende Gate warnt, wenn dieser Scope fehlt.
- `tax.remote` ist fachlich neutral benannt, kommt aber aktuell nur auf Corp-Remote-/Fort-Tax vor. Später prüfen: entweder corp-gated belassen oder UI/Inspector muss Scope und Seite deutlicher anzeigen.

## StrategyAnchor-Grenzen

Aktuell haben 30 Signale eine `strategyAnchorFor`-Ableitung. 21 Signale sind Support-only.

### Anchor-fähig und plausibel

- Runner: `access.rnd_multiaccess`, `access.hq_multiaccess`, `info.rnd_topdeck`, `info.hq`, `economy.trash_credit`, `setup.search`, `setup.recovery`, `defense.damage_prevention`, `defense.tag_prevention`, `defense.trace_defense`.
- Corp: `damage.payoff`, `tag.source`, `trace.source`, `access.punish`, `remote.ambush`, `remote.bait`, `remote.scoring_protection`, `remote.agenda_steal_tax`, `remote.asset_economy`, `economy.rez_discount`, `economy.advanceable`, `score.advance_burst`, `ice.etr`, `ice.future_pressure`, `tax.ice`.
- Geplant ohne aktuelle Vorkommen: `run.event_tempo`, `run.extra_action`, `run.lock`.

### Anchor-fähig, aber zu prüfen

- `score.agenda_action`: sollte nicht automatisch `corp.fast_advance` ankern.
- `tag.payoff`: sollte nur dann `corp.damage_kill` ankern, wenn der Payoff wirklich Damage ist.
- `ice.etr`: als `corp.ice_tax_glacier`-Anchor akzeptabel, aber sehr breit; als Supportdimension gut, als starker Einzelanker vorsichtig gewichten.

### Support-only

`breaker.*`, `economy.action`, `economy.burst`, `economy.counter`, `economy.finite_pool`, `economy.generic`, `economy.recurring`, `economy.start_of_turn`, `economy.trace_credit`, `info.expose`, `setup.draw`, `setup.install_discount`, `tax.remote`.

## Erkannte Lücken

| Lücke | Beispielkarten | Fehlendes Signal | Mögliche Ableitung | Descriptor-Bedarf | Empfehlung |
| --- | --- | --- | --- | --- | --- |
| ICE-Stärke erhöhen | `Black Ice Quality Assurance`, `Superior Net Barriers`, `Encryption Breakthrough` | `ice.modifier_strength` oder `tax.ice_strength_modifier` | `effects.kind=global_modifier` oder `remote_protection`, `resource=strength`, `scope=ice` | nein, vorhandene Felder reichen teilweise | späterer enger Batch; nicht direkt Fast/Remote ankern. |
| ICE-Subroutinen wiederholen/ändern | `Ice Transmutation`, `Encoder, Inc.`, `Tesseract Fort Construction` | `ice.subroutine_modifier` | `resource=subroutines`, `scope=ice` oder `scope=fort` | eventuell `targetProfiles` für ICE/Fort genauer | späterer Descriptor-/Derivation-Batch. |
| ICE-Breakkosten-/Tax erhöhen | `Canis Minor`, `Viral 15`, `Data Masons` | `tax.ice_break_cost` oder Erweiterung von `tax.ice` | `run_tax` mit `resource=strength`/`credits`, `scope=run_path` und ICE-Kontext | ja, wenn Breakkosten statt Run-Kosten unterschieden werden sollen | erst nach Descriptor-Schnitt. |
| ICE-Subtype-Synergie | Black-ICE-/AP-/Watchdog-Bezüge | kein eigenes Signal nötig, solange Coverage reicht | `breakerProfile.coverage`, Runtime-Subtypes | ja, falls echte Subtype-Strategie entsteht | vorerst nicht erweitern. |
| Ambush / Access-Punish mit persistentem Counter | `Doppelganger Antibody`, `Crybaby`, `Data Raven` | `access.punish_counter`, `tax.runner_persistent` | `persistent_counter_effect`, `timing=on_access`, `scope=runner`, `requires_accessed_card` | teilweise ja, Counter-Entfernung/TAX-Art fehlt | späterer Ambush-Tax-Batch. |
| Scored Agenda Utility | `On-Call Solo Team`, `Corporate Boon`, `Employee Empowerment` | `score.scored_utility` | `scored_agenda_action` ohne Advance-/Scorebeschleunigung | nein | `score.agenda_action` von `corp.fast_advance` entkoppeln. |
| echte Score-Acceleration | `Project Consultants`, `Management Shake-Up`, `Washington, D.C., City Grid` | `score.advance_burst` aus `score_acceleration` ergänzen | `effects.kind=score_acceleration`, `resource=advancement_counters` | nein | späterer enger Batch; `score.advance_burst` nicht nur `advance_burst`. |
| Runner Remote Contest | Remote-Contest-Planung aus AI003 | `remote.scoring_pressure`/`pressure.remote` existieren nur als StrategyGoal-Anchor-Hints | derzeit kein mechanisches First-Class-Signal | ja | als Descriptor-Gap belassen. |
| Corp Central Defense / Archives | Strategy-Goals nennen `defense.central`, `ice.central`, `protection.hq/rnd` | keine aktuellen Function-Signals | vermutlich Deck-/Server-Kontext, nicht einzelne Karten | ja | nicht im Karten-Function-Katalog erzwingen. |

## Empfehlungen für spätere Umsetzung

1. Erst ein read-only Gate ergänzen, das `strategyGoals.anchorSignals` gegen echte Function-Signals klassifiziert: `active`, `planned`, `legacy_hint`.
2. `score.agenda_action` als scored Utility behandeln und `corp.fast_advance` nur über echte Advancement-/Score-Beschleunigung ableiten.
3. `tag.payoff -> corp.damage_kill` an `resource=damage` binden; sonst nur `corp.tag_trace_punish`.
4. ICE-Modifier als kleinen Descriptor-Batch schneiden: Stärke, Subroutine, Tax/Breakkosten, Scope `ice` vs `fort` vs `run_path`.
5. Ambush-/Access-Punish-Tax als eigenen Batch schneiden, besonders persistent Counter und Runner-Credit-Tax.
6. Keine neuen Feinsignale für jede Spezialkarte erfinden. Detail bleibt in `amount`, `resource`, `timing`, `scope`, `condition`, `repeatable`, `target`, `risk`.

## Checks

Grün:

- `corepack pnpm check:ai-strategy-taxonomy`
- `corepack pnpm check:ai-hint-inspector-index`
- `git diff --check`
- `git diff --cached --check`

Ein separates JSON-Report-Artefakt wurde nicht erstellt, weil AI015 keine neue Maschine- oder Gate-Schnittstelle ergänzt. Der vollständige Katalog ist in diesem Review als versioniertes Markdown-Artefakt enthalten.

## Bewusst nicht geändert

- Keine Kartenmigration.
- Keine Hintänderung.
- Keine Function-Signal-Ableitungsänderung.
- Keine neuen Taktiksignale.
- Keine neuen Strategieanker.
- Keine Plannerwirkung.
- Keine Action-Score- oder PlanWeight-Änderung.
- Keine Engine-/Legalitätswirkung.
- Keine Profil-/Default-Umschaltung.
- Keine Catalog-/Proteus-Baseline-Korrektur.
