# AI-Hints Semantic Quality Audit

Datum: 2026-05-25

## Kurzfazit

AI-Hints sind weiterhin ein relevanter Spielstärkehebel, aber nicht für alle zuletzt diskutierten Probleme. Der Consumer-Contract-Audit zeigt: Entscheidungswirksam sind vor allem `roles`, `planRoles` und `aiSupportStatus`; `valueHints`, `riskTags`, `requiredMechanics` und `scenarioRefs` sind aktuell überwiegend Review-/Support-Kontext. Deshalb bewertet dieser Audit primär konsumierte Rollen/Planrollen und nicht reine Dokumentationsfelder.

Der semantische Audit fand drei eindeutig belegte, enge Hintkorrekturen:

- `Crystal Palace Station Grid`: war fälschlich als Economy/Counter-Upgrade markiert, obwohl Kartentext und Engine-Implementation reinen Fort-Break-Tax liefern. Jetzt als `run_tax` und Remote-Upgrade-Support beschrieben, ohne die Runner-Trash-Rolle in Agenda-Steal-Tax umzubiegen.
- `Mystery Box`: sucht und installiert Programme aus den obersten Stack-Karten, hatte aber keine konsumierte Search-/Recovery-Rolle. Jetzt mit `hidden_zone_tool`, `stack_search` und `recover_rig` geschärft.
- `Scatter Shot`: hat dedizierte recurring Trash-Credits für Upgrades, war aber nur Per-Card-Longtail. Jetzt analog zu Poltergeist mit `recurring_credit`, `trash_cost_payment` und `runner_access_trash_economy` markiert.

Keine `aiSupportStatus`-Demotion wurde vorgenommen. Keine Engine-, Deck-, Profil- oder Strategieänderung.

## Methodik

Geprüfte Quellen:

- `data/ai/ai-card-hints-active.json`
- `docs/reviews/ai/ai-hint-consumer-contract-audit-2026-05-25.md`
- `docs/reviews/ai/ai-hint-consumer-contract-inventory-2026-05-25.json`
- `data/ai/card-role-manifest-0.9.json`
- `packages/ai/src/ai-hints.ts`
- `packages/ai/src/deck-doctrine.ts`
- `packages/ai/src/corp-plans.ts`
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/index.ts`
- `data/cards/originalset-v1-cards.json`
- relevante Engine-Implementierungen für konkrete Evidenzfälle
- bestehende Reviews `ai-hints-support-contract-review-2026-05-22.md` und `ai-hints-role-gap-report-2026-05-17.md`

Prüfschnitt:

- Kartentext gegen aktive Hintrollen.
- Engine-Implementation gegen aktive Hintrollen, wenn ein konkreter Widerspruch vermutet wurde.
- Rollen gegen Verbraucherstatus aus dem Consumer-Contract-Inventar.
- Priorisierte Kartencluster: Breaker/Search, Economy/Setup, R&D/HQ/Trash, Remote/Scoring/Upgrades, Economy/Nodes/Operations, Agenda/Scored-Abilities, Tag/Punish und ICE.

## Bezug zum Consumer-Contract-Audit

Der vorherige Audit wurde bereits committed:

- Commit: `f9da93da`
- Message: `docs(ai): audit hint consumer contract`

Für diesen Audit gilt daraus:

- `roles` und `planRoles` werden von der KI praktisch zusammengeführt.
- Direkt wirksam sind konsumierte Rollen wie `breaker_*`, `economy`, `draw`, `build_rig`, `recover_economy`, `pressure_rnd`, `pressure_hq`, `multiaccess`, `corp_install_ice`, `corp_rez_ice`, `etr_ice`, `remote_upgrade_tax`, `protect_remote`, `build_scoring_remote`, `tag_punishment`, `tag_ice`, `trace_ice`.
- Reine `valueHints`-Korrekturen sind nur schwach wirksam, solange kein Consumer sie explizit liest.
- Strukturierte Themen wie scored-agenda abilities, Future-Run-Effekte, Cheap-Contest-Risiko, Remote-Portfolio-Rollen, HQ-Density und Tag/Punish-Funnel brauchen eher eine Ontologie-Erweiterung als viele Einzelrollen.

## Direkt korrigierte Hints

| Priorität | Karte                                    | Änderung                                                                                                                                                            | Evidenz                                                                                                                                                     |
| --------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0        | `onr_v1_355_crystal-palace-station-grid` | Entfernt `counter`, `remote_upgrade_economy`, `power_counter`, `economy`. Ergänzt `run_tax`, `remote_upgrade_support`, Tax-/Remote-Werte und Fort-Modifier-Risiken. | Kartentext: Runner zahlt +1 je gebrochener Subroutine auf diesem Fort. Engine: `break_subroutine_cost` Modifier, keine Counter-/Economy-Funktion.           |
| P1        | `onr_v1_043_mystery-box`                 | Ergänzt `hidden_zone_tool`, `stack_search`, `recover_rig`.                                                                                                          | Kartentext: zeigt Top 5 des Stacks, installiert Programm kostenlos, mischt danach. Search-/Tutor-Verbraucher lesen `search`/`stack_search`/Recovery-Rollen. |
| P1        | `onr_v1_057_scatter-shot`                | Ergänzt `recurring_credit`, `trash_cost_payment`, `runner_access_trash_economy`.                                                                                    | Kartentext: recurring Bits ausschließlich zum Trashing von Upgrades; aktueller Trash-Budget-Slice nutzt dedizierte Trash-Credit-Semantik.                   |

## P0/P1-Befunde

### P0

`Crystal Palace Station Grid` war der einzige klare P0-Fund: Die alte Economy-/Counter-Markierung widersprach dem Text und der Implementation. Wegen der jüngsten Trash-Budget- und Remote-Safety-Slices ist diese Karte benchmark- und entscheidungsrelevant. Die Korrektur nutzt die konsumierte Rolle `run_tax` und vermeidet bewusst Scoring-Protection-Rollen, damit die Runner-Trash-Klassifikation weiterhin den Tax-Charakter statt eine Agenda-Steal-Tax-Rolle sieht.

### P1

`Mystery Box` und `Scatter Shot` waren klare P1-Funde:

- `Mystery Box` hatte zwar `build_rig`, aber keine konsumierte Search-Rolle. Dadurch konnte sie in Search-/Tutor-/Coverage-Linien schwächer erscheinen als funktional vergleichbare Karten.
- `Scatter Shot` hatte keine dedizierte Trash-Credit-Rolle, obwohl `Poltergeist` diese Semantik bereits ausdrückt. Dadurch war die Karte für Trash-Budget-/Reserve-Entscheidungen semantisch unterbeschrieben.

Weitere P1-Kandidaten wurden nicht direkt geändert, weil sie eher Ontologie- oder Strategy-Code-Themen sind:

- Scored-agenda activated abilities wie `Political Overthrow`, `Marine Arcology`, `Corporate Boon`, `Employee Empowerment`, `AI Chief Financial Officer`: Der recent KI-Code klassifiziert sie aus sichtbarer Score-Area-Action/Text/Payload. Hintrollen sind weiterhin uneinheitlich, aber ein blindes Rollennachziehen würde die aktuelle Strategielogik duplizieren.
- Future-effect ICE wie `Tutor`, `Virizz`, `Viral 15`: Engine- und Effective-Run-Quote-Projektion sind der korrekte Hauptverbraucher. Es fehlt eine strukturierte `future_run_effect`-/`future_encounter_effect`-Ontologie; zusätzliche Einzelrollen wären derzeit nur teilweise konsumiert.
- Tag/Punish-Karten: `tag_source` vs `tag_payoff` vs `tagged_runner_payoff` ist noch nicht konsequent modelliert. Der neue Tag/Punish-Funnel liefert dafür bessere Diagnosegrundlage; keine pauschale Rollenänderung in diesem Audit.

## P2/P3-Befunde

P2:

- Mehrere Runner-Economy-Karten beschreiben finite/action-cost economy nur über grobe Rollen (`economy`, `recover_economy`) und Review-Tags. Beispiele: `Short-Term Contract`, `Loan from Chiba`, `Organ Donor`.
- R&D-/HQ-Pressure-Karten sind meist funktional korrekt markiert, aber Synonyme bleiben uneinheitlich: `rd_pressure` vs `pressure_rnd`, `hq_run` vs `pressure_hq`.
- Remote-Upgrades verwenden teils konsumierte Rollen, teils Einzelrollen: `Namatoki Plaza`, `Jenny Jett`, `Olivia Salazar`, `Rio de Janeiro City Grid`.

P3:

- Viele Per-Card-Longtail-Rollen sind als Review-Wissen okay, aber nicht direkt entscheidungswirksam: `per_card_longtail`, `runner_program_ability`, `corp_operation_choice`, `corp_rez_root_upgrade`.
- Kartenformrollen wie `program`, `hardware`, `operation`, `asset`, `resource`, `corp`, `runner` sind für Inventar und Baseline brauchbar, aber selten strategisch präzise.

## Prüfgruppen

### A. Runner Breaker / Coverage / Search

Breaker-Coverage ist bei den geprüften Hauptbreakern überwiegend korrekt konsumierbar:

- `Worm`: `breaker_fracter`, `efficient_breaker`, `build_rig`, `safe_probe_run`; korrekt als Wall/Fracter-Coverage wirksam.
- Wall-/Killer-/Decoder-/Fracter-Gruppen: Die aktiven Breaker enthalten überwiegend `breaker_*`-Rollen; alte Synonyme wie `wall_breaker`, `barrier_breaker`, `code_gate_breaker`, `sentry_breaker` bleiben aber als schwächer wirksame Rollen im Inventar.

Search/Tutor:

- `Self-Modifying Code`, `Temple Microcode Outlet`, `Mantis, Fixer-at-Large`, `Forgotten Backup Chip`, `Gideon's Pawnshop` sind grundsätzlich mit `stack_search`, `program_search`, `trash_recovery`, `build_rig` oder `recover_rig` markiert.
- `Mystery Box` war unterbeschrieben und wurde korrigiert.
- `Sneak Preview` bleibt Human-Review-Kandidat: Es ist Search/Trash-Recovery plus temporäre Install-Logik, aber die Rolle `temporary_program_install` wird kaum konsumiert.
- `Startup Immolator` ist nicht primär Search, sondern ICE-Trash nach vollständigem Break; derzeit Per-Card-Longtail. Kein Hint-Fix ohne dedizierte ICE-Trash-Ontologie.
- `Edited Shipping Manifests` ist mit `economy` und `pressure_hq` nützlich, hat aber Tag-Self- und Access-Replacement-Semantik, die eher Code-/Event-Projektion als Hintrolle ist.

### B. Runner Economy / Hand / Setup

- `Short-Term Contract` ist als endliche Click-Economy gut markiert, inklusive `finite_credit_pool`/`click_cost` RiskTags, aber diese RiskTags sind nicht planwirksam.
- `MRAM Chip` und `Militech MRAM Chip` tragen aktuell `memory`, obwohl der Text Hand Size erhöht. Das ist semantisch unscharf, aber für Setup-/Capacity-Bewertung teilweise wirksam. Human Review statt Direktfix, weil der Planer `memory` stark konsumiert und keine separate Hand-size-Rolle existiert.
- `Loan from Chiba` ist als Economy korrekt, aber die Verlustbedingung lebt in `riskTags`/`valueHints`, nicht im Planer.
- `Score!`, `Livewire's Contacts`, `Jack 'n' Joe`, `Bodyweight Synthetic Blood` sind grob korrekt.
- `Organ Donor` bleibt P2/Human Review: Economy durch Handtrash ist real, aber riskant; ohne cost/condition ontology wäre `economy` potenziell zu aggressiv.

### C. Runner Run Pressure / R&D-HQ / Trash

- `Custodial Position`, `Executive Wiretaps`, `R&D-Protocol Files`, `Romp through HQ`, `Kilroy Was Here` tragen konsumierte Pressure-/Multiaccess-/Target-Rollen.
- `Deep Thought` ist eher Topdeck-/Counter-Wissen als immediate pressure; `hidden_zone_tool` ist nutzbar, aber Freshness-/Topdeck-Wert kommt aus Memory/Events.
- `Microtech AI Interface` ist mit `run_pressure`/`access` ausreichend grob, aber eine `rd_topdeck_manipulation`-Ontologie fehlt.
- `Poltergeist` war bereits gut als dedizierte Trash-Economy markiert.
- `Scatter Shot` wurde auf denselben dedizierten Trash-Credit-Verbrauchspfad geschärft.

### D. Corp Remote / Scoring / Upgrades

- `Red Herrings`, `Tesseract Fort Construction`, `Namatoki Plaza`, `Jenny Jett`, `Data Masons` sind deutlich besser als historische Generikhints und nutzen teilweise konsumierte Remote-/Tax-/Protection-Rollen.
- `Crystal Palace Station Grid` war der klare falsche Remote-Hint und wurde korrigiert.
- `Rio de Janeiro City Grid`, `Olivia Salazar`, `Antiquated Interface Routines`, `Chicago Branch` bleiben stärker per-card-/review-lastig. Sie brauchen eher strukturierte RemoteRole-/Effect-Felder als weitere Einzelrollen.
- Cheap-Remote-Safety und Remote-Portfolio-Disziplin sind nicht sauber über Hints ausdrückbar; sie müssen weiter aus Board, sichtbarem Runner-Rig und Effective-Run-Quote kommen.

### E. Corp Economy / Nodes / Operations

- `ACME Savings and Loan`, `BBS Whispering Campaign`, `Braindance Campaign`, `Accounts Receivable`, `Night Shift`, `Day Shift`, `Annual Reviews` sind als Economy/Draw im aktuellen Verbrauch ausreichend grob.
- Endliche Pools, Trash-Kosten, riskante Wirtschaft und HQ-/Archives-Management sind in `valueHints`/`riskTags` oft erkennbar, aber noch nicht planwirksam.
- `Off-Site Backups` und andere Archive-/HQ-Management-Karten sollten perspektivisch Effektfelder bekommen, damit sie nicht nur als Operation/Longtail erscheinen.

### F. Corp Agenda / Scored-Abilities / Score Conversion

- Der recent scored-agenda-ability-Fix löst die wichtigste Auswahl-Lücke für sichtbare Score-Area-`activated_card_ability`, insbesondere `Political Overthrow`.
- Hintseitig bleiben scored abilities uneinheitlich:
  - `Corporate Coup` / `Political Coup`: `economy_agenda`, `agenda_counters`
  - `Political Overthrow` / `Marine Arcology` / `Corporate War`: noch stark Longtail/Agenda-Ability
  - `Corporate Boon`: `action`
  - `Employee Empowerment`: `economy`, obwohl der sichtbare Effekt primär Draw ist
  - `Netwatch Operations Office` / `Private Cybernet Police`: `tag_agenda`, `trace_agenda`
  - `On-Call Solo Team` / `Strike Force Kali`: `tag_damage_agenda`
- Keine Direktkorrektur, weil der aktuelle KI-Code diese Fähigkeiten text-/payload-basiert klassifiziert und weitere Hintrollen ohne Ontologie potenziell doppelt oder falsch wirken würden.

### G. Corp Tag / Punish

- Payoff-Karten wie `Scorched Earth`, `Urban Renewal`, `Punitive Counterstrike`, `Closed Accounts`, `Datapool`, `Power Grid Overload`, `Corporate Detective Agency` sind als Punish grob erkennbar.
- Tagquellen wie `Audit of Call Records`, `Chance Observation`, `Trojan Horse`, `Netwatch Operations Office`, `Private Cybernet Police` sind getrennt erkennbar, aber uneinheitlich (`tag_operation`, `trace_operation`, `tag_enabler`, `tag_agenda`, `trace_agenda`).
- Voraussetzung `Runner tagged` ist nicht sauber als maschinenlesbare Condition modelliert. RiskTags wie `requires_visible_tag` sind nicht Planerinput.
- Die Tag/Punish-Funnel-Metriken sind der richtige nächste Diagnosepfad. Ein Rolleneditch ohne Funnel-Ergebnis wäre verfrüht.

### H. Corp ICE

- Standard-ICE wie `Data Wall`, `Wall of Static`, `Wall of Ice`, `Hunter`, `Data Raven`, `Fetch 4.0.1`, `Bolter Cluster`, `Neural Blade`, `Shock.r` sind überwiegend mit konsumierten ICE-/ETR-/Damage-/Trace-/Tag-Rollen markiert.
- Future-effect ICE (`Tutor`, `Virizz`, `Viral 15`) sind AI-supported, aber hintseitig noch stark `per_card_longtail`. Die Engine projiziert diese Effekte bereits in Effective-Run-Quote und `unbrokenRunEffect`; eine Hintkorrektur nur mit ad-hoc Rollen wäre nicht robust.
- Es fehlt eine strukturierte Ontologie für `future_run_effect`, `future_encounter_effect`, `next_ice_lock`, `break_cost_modifier`, `jackout_tax`, `program_trash_after_pass`.

## Human-Review-Kandidaten

| Priorität | Karte/Gruppe                                                                                                     | Grund                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| P1        | `Political Overthrow`, `Marine Arcology`, `Corporate Boon`, `Employee Empowerment`, `AI Chief Financial Officer` | Scored abilities sind code-seitig erkannt, aber hintseitig nicht einheitlich als scored activated effect modelliert.         |
| P1        | `Tutor`, `Virizz`, `Viral 15`                                                                                    | Future-effect ICE brauchen strukturierte Effect-Rollen statt Per-Card-Longtail.                                              |
| P1        | Tag/Punish-Quellen und Payoffs                                                                                   | Tagquelle, Trace-Tag, tagged-runner payoff, economic punish und damage punish sollten getrennte Conditions/Effekte bekommen. |
| P2        | `MRAM Chip`, `Militech MRAM Chip`                                                                                | Hand-size wird aktuell als `memory` modelliert; wirksam, aber semantisch unscharf.                                           |
| P2        | `Organ Donor`                                                                                                    | Economy-Funktion mit Handtrash-Kosten; ohne CostProfile riskant.                                                             |
| P2        | `Sneak Preview`                                                                                                  | Search/Recovery plus temporäre Install- und Return-to-Hand-Semantik; braucht Effect-/Timing-Profil.                          |

## Not-Hint-Probleme

Diese Themen sollten nicht durch neue Rollen verbogen werden:

- Cheaply contestable remotes: muss aus sichtbarem Runner-Rig, Credits, ICE-Pfad, Steal-/Trash-Reserve und Same-Turn-Score-Fenster berechnet werden.
- HQ agenda density / dilution: ist Corp-Hand-/Board-Zustand, nicht statische Karteneigenschaft.
- R&D Freshness: entsteht aus Access-/Steal-/Trash-/Shuffle-/Topdeck-Memory, nicht aus Kartenrolle allein.
- Future-effect pump viability: muss aus aktueller ICE-Position, Remaining Path und Effective-Run-Quote kommen.
- Tag/Punish Terminalfenster: braucht aktuelle Tags am Corp-Decision-Window und LegalAction-Funnel, nicht nur Deck-/Hint-Signale.

## Empfohlene Gates/Scripts

1. `ai-hints-consumer-contract-check`: aktive Hints laden, alle Rollen/Planrollen gegen Consumer-Aliaslisten klassifizieren, rare/dead roles reporten.
2. `ai-hints-breaker-coverage-check`: jede AI-supported Icebreaker-Karte muss mindestens eine konsumierte Coverage-Rolle haben oder bewusst `breaker_generic` tragen.
3. `ai-hints-search-recovery-check`: Search-/Tutor-/Recovery-Karten nach Kartentext/requiredMechanics müssen eine konsumierte `search`/`recovery`/`build_rig`-Rolle haben.
4. `ai-hints-scored-agenda-effect-check`: scored activated abilities mit Economy/Draw/Trace/Damage/Extra-Action müssen künftig strukturierte `effects` bekommen.
5. `ai-hints-tag-punish-contract-check`: Tagquellen, Trace-Tag, tagged-runner payoffs und Punish-Conditions getrennt reporten.
6. `ai-hints-future-ice-effect-check`: Future-run-/Future-encounter-ICE als strukturierte Effekte reporten, nicht nur per-card-longtail.
7. `ai-supported-benchmark-review-gate`: Karten in Benchmark-/Real-Scene-/Local-Holdout-Decks mit P0/P1-Hinweisen müssen Reviewstatus haben.

## Nächste Schritte

Eine weitere Hint-Korrekturrunde ist sinnvoll, aber erst nach einem kleinen Ontologie-Entwurf für `effects`, `conditions`, `costProfile`, `remoteRole` und `lineSupport`. Ohne diese Struktur entstehen sonst neue seltene Rollen, die kaum konsumiert werden. Für direkte Spielstärke ist die nächste saubere Runde:

1. scored-agenda ability Hint-Ontologie,
2. Future-effect ICE Ontologie,
3. Tag/Punish source/payoff/condition Ontologie,
4. Breaker cost profile und Search/Recovery Contract-Gate.
