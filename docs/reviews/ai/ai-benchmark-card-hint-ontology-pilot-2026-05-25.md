# AI Benchmark Card Hint Ontology Pilot 2026-05-25

## Kurzfazit

Phase 2 migriert die ersten Benchmark- und High-Impact-Karten auf read-only strukturierte AI-Hint-Ontology-Felder. Die Änderung ist bewusst daten- und reviewseitig: keine Engine-Regel, keine LegalAction, keine Planerwirkung und keine Consumer-Anbindung in `corp-plans.ts`, `runner-plans.ts` oder `deck-doctrine.ts`.

Der aktive Benchmark-Korpus umfasst 190 eindeutige Karten. Davon haben jetzt 82 Benchmarkkarten strukturierte Ontology-Felder. Insgesamt wurden 118 Karten strukturiert beschrieben, weil die Pilotgruppen auch einzelne nicht im aktuellen Benchmark-Korpus liegende High-Impact-Karten enthalten, z. B. `Political Overthrow`.

## Benchmark-Korpus

Quellen:

- `data/decks/deck-snapshots-0.8.json`
- `data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json`
- `data/ai/ai-real-scene-benchmark-deck-snapshots-2026-05-24.json`
- bestehender `check:ai-hint-quality` Benchmark-Deck-Coverage-Pfad

Zahlen:

- Eindeutige Benchmarkkarten: 190
- Runner: 94
- Corp: 96
- `holdout_only`: 50
- Fehlende Hints: 0

Card-Type-Verteilung:

- `identity`: 2
- `agenda`: 20
- `ice`: 31
- `operation`: 22
- `asset`: 11
- `upgrade`: 11
- `program`: 39
- `event`: 26
- `hardware`: 15
- `resource`: 13

## Strukturierte Migration

Migriert:

- Strukturierte Karten gesamt: 118
- Strukturierte Benchmarkkarten: 82
- Benchmarkkarten mit nur Legacy-Rollen und Quality-Markierung: 108
- Karten mit `quality.needsHumanReview = true`: 126
- Benchmarkkarten mit `quality.needsHumanReview = true`: 120

Die hohe `needsHumanReview`-Zahl ist beabsichtigt: alle Benchmarkkarten sind jetzt als `benchmarkCovered` sichtbar, aber Legacy-only-Karten bleiben niedrig-konfident und reviewpflichtig, bis sie in späteren Batches fachlich strukturiert werden.

Strukturierte Benchmarkkarten nach Typ:

- `program`: 21
- `event`: 13
- `resource`: 2
- `agenda`: 11
- `ice`: 10
- `operation`: 15
- `asset`: 4
- `upgrade`: 6

## Abgeschlossene Pilotgruppen

### Scored-Agenda-Abilities

Strukturiert wurden unter anderem:

- `Political Overthrow`
- `Corporate Coup`
- `Political Coup`
- `Corporate Boon`
- `Employee Empowerment`
- `AI Chief Financial Officer`
- `Marine Arcology`
- `Netwatch Operations Office`
- `Private Cybernet Police`
- `On-Call Solo Team`
- `Strike Force Kali`
- `Hostile Takeover`
- `Priority Requisition`
- `Superior Net Barriers`
- `Project Babylon`
- `Corporate War`

Abgedeckte Felder:

- `effects.kind = scored_agenda_action`
- `economy`, `counter_economy`, `draw`, `extra_action`, `trace`, `tag`, `damage`, `tag_punish_payoff`
- `conditions.requires_scored_agenda`, `requires_runner_tagged`, `requires_trace_success`
- `lineSupport` für `economy_rez_reserve`, `fast_advance_or_counter_ops`, `tag_trace_punish`, `score_closeout`

Unsicher markiert bleiben komplexere oder kontextstarke Agendas wie `AI Chief Financial Officer`, `Superior Net Barriers` und `Corporate War`.

### Breaker / Breaker-Coverage

Strukturiert wurden:

- `Japanese Water Torture`
- `Krash`
- `Worm`
- `Pile Driver`
- `Cyfermaster`
- `Raffles`
- `Raptor`
- `Shaka`
- `Codecracker`
- `Tinweasel`
- `Wizard's Book`
- `Black Dahlia`
- `Loony Goon`
- `Wild Card`
- `AI Boon`
- `Bartmoss Memorial Icebreaker`
- `Blink`
- `Dropp`
- `Replicator`
- `Reflector`

Abgedeckte Felder:

- `breakerProfile.coverage`
- `baseStrength`
- `pumpCost`
- `breakCost`
- side effects wie `forgo_actions`, `stealth_loss`, `random_failure`, `ends_run_after_use`, `program_trash_risk`, `once_per_subroutine`
- `costProfile` mit Installkosten, Memory und grobem Reserve-/Opportunity-Risiko

Sonderbreaker mit Zufall, Spezialsubroutinen oder unvollständigem Kostenmodell bleiben `needsHumanReview`.

### Search / Tutor / Recovery

Strukturiert wurden:

- `Self-Modifying Code`
- `Mystery Box`
- `Mantis, Fixer-at-Large`
- `Temple Microcode Outlet`
- `Forgotten Backup Chip`
- `Gideon's Pawnshop`
- `If You Want It Done Right . . .`
- `Sneak Preview`
- `Startup Immolator`

Abgedeckte Felder:

- `effects.kind = search`
- `install_discount`
- `conditions.requires_during_run`
- `conditions.requires_installed_program`
- `lineSupport = rig_first`, `breaker_search_first`

`Gideon's Pawnshop` und `If You Want It Done Right . . .` bleiben wegen breiterer Ziel-/Timing-Semantik reviewpflichtig.

### Dedicated Credits / Trash / Access / Central Pressure

Strukturiert wurden:

- `Poltergeist`
- `Scatter Shot`
- `Kilroy Was Here`
- `Core Command: Jettison Ice`
- `Edited Shipping Manifests`
- `Executive Wiretaps`
- `Custodial Position`
- `R&D-Protocol Files`
- `Deep Thought`
- `Microtech AI Interface`

Abgedeckte Felder:

- `trash_credit`
- `multiaccess`
- `topdeck_info`
- `access_replacement`
- `program_trash`
- passende Runner-`lineSupport`-Werte für R&D-/HQ-/Interface- und Remote-Contest-Druck

### Corp Remote / Upgrades / Regions

Strukturiert wurden:

- `Crystal Palace Station Grid`
- `Tesseract Fort Construction`
- `Red Herrings`
- `Namatoki Plaza`
- `Jenny Jett`
- `Olivia Salazar`
- `Rio de Janeiro City Grid`
- `Restrictive Net Zoning`
- `Black Ice Quality Assurance`
- `Data Masons`
- `Antiquated Interface Routines`
- `Chicago Branch`

Abgedeckte Felder:

- `remoteRole`
- `run_tax`
- `agenda_steal_tax`
- `remote_capacity`
- `remote_protection`
- `future_encounter_effect`
- `score_acceleration`
- Corp-`lineSupport` für `remote_scoring_build`, `ice_tax_glacier`, `fast_advance_or_counter_ops`, `score_closeout`

`Restrictive Net Zoning` bleibt bewusst reviewpflichtig, weil es als Runner-Karte eine Corp-Remote-Kostenwirkung modelliert.

### Corp ICE

Strukturiert wurden:

- `Tutor`
- `Virizz`
- `Viral 15`
- `Ball and Chain`
- `Canis Major`
- `Canis Minor`
- `Bolter Cluster`
- `Neural Blade`
- `Shock.r`
- `Fetch 4.0.1`
- `Hunter`
- `Data Raven`
- `Data Wall`
- `Wall of Static`
- `Wall of Ice`
- `Banpei`
- `Sentinels Prime`
- `Cinderella`
- `Cortical Scrub`
- `Cerberus`

Abgedeckte Felder:

- `future_run_effect`
- `future_encounter_effect`
- `trace`
- `tag`
- `tag_source`
- `damage`
- `program_trash`
- `hardware_trash`
- `run_tax`
- `remote_protection`

Diese Felder sind read-only und ersetzen nicht `effectiveRunQuote`, LegalActions oder Engine-Encounter-Logik.

### Corp Tag / Punish

Strukturiert wurden:

- `Scorched Earth`
- `Urban Renewal`
- `Punitive Counterstrike`
- `Closed Accounts`
- `Datapool`
- `Audit of Call Records`
- `Chance Observation`
- `Trojan Horse`
- `Netwatch Credit Voucher`
- `Corporate Detective Agency`
- `Power Grid Overload`
- scored-agenda Tag/Punish-Karten aus der Agenda-Gruppe

Abgedeckte Felder:

- `tag_source`
- `tag_punish_payoff`
- `damage`
- `resource_trash`
- `hardware_trash`
- `conditions.requires_runner_tagged`
- `conditions.requires_trace_success`
- `lineSupport.tag_trace_punish`

`Datapool` bleibt reviewpflichtig, weil das neue Schema den genauen Payoff noch nicht fein genug ausdrückt.

### Economy / Draw

Strukturiert wurden unter anderem:

- Runner: `Short-Term Contract`, `Loan from Chiba`, `Score!`, `Newsgroup Filter`, `Cloak`, `Vewy Vewy Quiet`, `Zetatech Software Installer`
- Corp: `Accounts Receivable`, `Efficiency Experts`, `Night Shift`, `Day Shift`, `Annual Reviews`, `ACME Savings and Loan`, `Off-Site Backups`, `Corporate Negotiating Center`, `BBS Whispering Campaign`, `Braindance Campaign`

Abgedeckte Felder:

- `economy`
- `counter_economy`
- `draw`
- `install_discount`
- `zone_shuffle`
- `costProfile.reserveRisk`
- `costProfile.opportunityCost`
- `remoteRole.asset_economy`

Komplexere Economy-Karten mit Nebenwirkungen oder HQ-Offenlegung bleiben reviewpflichtig.

## Offene Gruppen

Noch Legacy-only sind vor allem:

- einfache Demo-/V0.8-Testkarten
- Identitäten
- Memory-/Handsize-/Hardware-Kapazitätskarten
- einige Runner-Events mit Run-/Breach-Sondersemantik
- mehrere Standard-ICE und Longtail-ICE, die nicht in den ersten High-Impact-Gruppen lagen
- mehrere Real-Scene-Holdout-only Karten, die nur als Warnsignal markiert, aber nicht holdout-optimiert wurden

Diese Karten haben `quality.benchmarkCovered = true`, aber meist `hintReviewed = false`, `confidence = low` und `needsHumanReview = true`.

## Keine Planerwirkung

Nicht geändert:

- keine Legacy-`roles`
- keine Legacy-`planRoles`
- kein `aiSupportStatus`
- keine Engine-/Shared-Datei
- keine Consumer-Anbindung in `corp-plans.ts`, `runner-plans.ts` oder `deck-doctrine.ts`
- keine Profil- oder Benchmark-Optimierung

Die neuen Felder werden nur durch `validateAiHintOntologyFields` geprüft und bleiben bis zu einem späteren Consumer-Slice diagnostisch.

## Ontology- und Gate-Ergebnis

Ontology-Validation:

- Alle 410 aktiven Hints validieren ohne Ontology-Errors.
- Die neuen strukturierten Felder verwenden nur Phase-1-Known-Lists.
- Keine Hidden-Info-Felder wurden eingeführt.
- Keine `opponentSignals` wurden in diesem Batch gesetzt.

`check:ai-hint-quality`:

- `hints=410`
- `roles=251`
- `planRoles=102`
- `errors=0`
- `warnings=150`
- `benchmarkCards=190`

Die bestehenden Warnings bleiben die bekannten Singleton-/Synonym-Warnungen aus dem Gate-Slice. Da keine Legacy-Rollen geändert wurden, ist keine neue Rollenwarnung intendiert.

## Kritische und unsichere Karten

`needsHumanReview = true` wurde bewusst gesetzt für Karten, deren Strukturwirkung zwar wichtig ist, aber für eine spätere Consumer-Anbindung noch präziser geprüft werden sollte:

- komplexe scored-agenda Effekte: `AI Chief Financial Officer`, `Superior Net Barriers`, `Corporate War`
- Sonderbreaker: `Tinweasel`, `AI Boon`, `Blink`, `Reflector`
- Search-/Tutor-Sonderfälle: `Gideon's Pawnshop`, `If You Want It Done Right . . .`
- Remote-/HQ-Dichte- oder gegnerische Kostenwirkung: `Namatoki Plaza`, `Restrictive Net Zoning`, `Corporate Negotiating Center`
- komplexe Tag-/Punish-Payoffs: `Datapool`
- riskante Economy: `ACME Savings and Loan`

## Nächste Phase

Der nächste sinnvolle Schritt ist ein erster kleiner Consumer-Slice, nicht eine weitere breite Datenmigration:

1. Read-only Doctrine-Aggregation für strukturierte `scored_agenda_action`, `counter_economy`, `extra_action`, `tag_source` und `tag_punish_payoff`.
2. Noch keine direkte Action-Score-Änderung.
3. Erst Diagnosefelder und Focus-Tests, die zeigen, dass strukturierte Felder side-safe und vollständig ankommen.
4. Danach ein enger Planer-Slice, z. B. scored-agenda abilities oder breaker cost profile, mit messbarer Entscheidungswirkung.
