# Proteus Activity-Status und Board-Hygiene

Stand: 2026-05-27

Dieses Artefakt ist ab PRO002 die führende Übersicht für Proteus-Board- und Status-Hygiene. Es ersetzt nicht den Detailplan `proteus-cardimplementation-detailplan-2026-05-26.md`; es erklärt, wie Activities, PRO-Pakete und tatsächliche CardImplementation-Abdeckung zusammenhängen.

## Führende Zählweise

Implementierungsfortschritt wird nicht aus `docs/activities/done` gezählt.

Führend ist die eindeutige CardImplementation-Abdeckung:

1. `data/cards/proteus-cards.json` ist die Gesamtbasis: 154 Proteus-Karten.
2. Implementierte Proteus-Karten werden aus eindeutigen `cardDefinitionId`-Werten in `packages/engine/src/card-implementations/proteus/*.ts` gezählt.
3. Diese Dateien müssen gegen `packages/engine/src/card-implementations/registry.ts` gegengeprüft werden.
4. `data/manifests/proteus-card-support.json` ist Plausibilitäts- und Driftprüfung, nicht führende Wahrheit.
5. `docs/activities/**/*.md` sind Arbeits- und Planungsstatus, kein Implementierungsnachweis.

PRO001 hat dafür bereits den Guard in `packages/engine/src/card-implementations/coverage.test.ts` ergänzt: `reconciles Proteus manifest support against concrete files and registry`. Dieser Guard prüft 154 Karten in `data/cards/proteus-cards.json`, 154 Manifest-Einträge, eindeutige CardImplementation-Dateien, Registry-Parität, `implemented`-Manifestparität, `resolverRef = engine:<cardId>` für implementierte Karten und `resolverRef = null` für nicht implementierte Karten. PRO002 etabliert keine zweite konkurrierende Zählweise.

Aktueller Stand nach PRO009:

| Kennzahl | Wert | Führende Quelle |
| --- | ---: | --- |
| Proteus-Gesamtbasis | 154 | `data/cards/proteus-cards.json` |
| Konkrete Proteus-CardImplementation-Dateien | 87 | `packages/engine/src/card-implementations/proteus/*.ts` |
| Registry-paritätische Implementierungen | 87 | `coverage.test.ts`-Guard gegen Registry |
| Fehlende konkrete CardImplementation-Dateien | 67 | Gesamtbasis minus konkrete Dateien |
| Manifest-`implemented`-Einträge | 87 | Driftprüfung in `data/manifests/proteus-card-support.json` |

PRO006-1 ist ausschließlich Test- und Typ-Härtung für den bereits umgesetzten PRO006-Scope. Es setzt keine neue Proteus-Karte um, ändert keine Manifest-Freigaben und zieht keine PRO010-Mechaniken vor. `trash_program` bleibt für PRO006 ein automatischer Printed-Subroutine-Effekt; Payment- und Zielwahlvarianten gehören zu PRO010.

PRO007 ist umgesetzt: `Credit Consolidation`, `Data Sifters`, `Manhunt`, `Schlaghund Pointers` und `Underworld Mole` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden generische Runner-History-Conditions für getrashte Nodes, installierte Resources und Run-Versuche im Spiel, Trace-Margin-Tags, Trace-Zielauswahl für last-turn Resources und ein deklaratives Trace-Zusatzkostenmodell. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO008 ist umgesetzt: `On the Fast Track`, `Prearranged Drop`, `Back Door to Rivals`, `Runner Sensei`, `All-Hands`, `Rush Hour`, `Decoy Signal`, `Demolition Run`, `Remote Detonator`, `Disgruntled Ice Technician`, `Drone for a Day`, `Reconnaissance` und `Weefle Initiation` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden generische Runner-Event-Run-Flags, Advertisement-/Transactions-Trash-History, einmaliger Agenda-Access-Credit-Reward, Trace-Link-Rewards, erfolgreiche-Run-Followups, Event-Source-Post-Pass-Derez, Rezzed-ICE-Trash-Replacements, Corp-Rez-Rewards und rungebundene Damage-Prevention-Pools. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO008-1 ist ausschließlich Härtung für den bereits umgesetzten PRO008-Scope. Trace-Avoid-Rewards werden aus den konkret genutzten Base-Link-/Post-Bid-Link-Abilities gezählt statt aus allen Reward-Effekten derselben Karte rekonstruiert; Remote Detonator nutzt im Followup-Pfad den Descriptor-`tagAmount`. Es setzt keine neue Proteus-Karte um, ändert keine Manifest-Freigaben und hält den Implementierungsstand bei 80/154.

PRO009 ist umgesetzt: `Black Widow`, `Fubar`, `Morphing Tool`, `Bulldozer`, `Lockjaw`, `Personal Touch, The` und `Eurocorpse (TM) Spin Chip` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden generische Install-Choices für ICE-Ziele und Icebreaker-Subtypes, source-bound Strength-Modifier, subtype-gebundene Breaker-Matcher, rungebundene Followup-Breaks, einzelne Run-Strength-Boosts, gezielte permanente Icebreaker-Strength-Counter und hostgebundene Zahlungsbits. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

Keine Proteus-Karte wird durch dieses Artefakt `deck_legal`, `format_legal` oder `ai_supported`.

## PRO-Restzuschnitt

Der führende Detailplan `proteus-cardimplementation-detailplan-2026-05-26.md` wurde ab `PRO007` in größere Mechanikfamilien-Pakete umgedeutet. Neue Umsetzungsaufträge arbeiten mit `PRO001` bis `PRO020`.

| PRO | Status | Umfang |
| --- | --- | --- |
| PRO007 | umgesetzt | 5 Corp-Operations: Economy, History, Trace, Tags, Resource-Targeting. |
| PRO008 | umgesetzt | 13 Runner-Events: Economy, Run-Flags, Trace-Rewards, Followups. |
| PRO009 | umgesetzt | 7 Icebreaker-/Modifier-/Supportkarten. |
| PRO010 | neu zu schneiden | 10 Corp-ICE: Trace, Conditional, Post-Pass und Lifecycle. |
| PRO011 | neu zu schneiden | 8 Hidden-Resource-Economy-/Access-Karten. |
| PRO012 | neu zu schneiden | 8 Hidden-Resource-Prevention-/Sabotage-Karten. |
| PRO013 | neu zu schneiden | 8 Agenda-/Steal-/Overadvance-Karten. |
| PRO014 | neu zu schneiden | 8 Corp-Asset-/Upgrade-Utility-Karten. |
| PRO015 | neu zu schneiden | 5 Bad-Publicity-Run-/Replacement-Karten. |
| PRO016 | neu zu schneiden | 4 Random-/Dice-/Encounter-Karten. |
| PRO017 | neu zu schneiden | 6 Action-Economy-/Action-Debt-Karten. |
| PRO018 | neu zu schneiden | 2 Hidden-Zone-Search-/Install-Tutor-Karten. |
| PRO019 | neu zu schneiden | 8 regelvertragliche Baseline-/Utility-Karten. |
| PRO020 | noch nicht ausführbar | Finaler Proteus-Abschluss nach leerer Restliste. |

## Geprüfte Activity-Menge

Geprüft wurden alle Activity-Unterordner unter `docs/activities/`: `inbox/`, `in-progress/`, `done/` und die vorhandenen sonstigen Unterordner. Proteus-relevant gezählt wurden Activity-Dateien mit Proteus-Bezug im Dateinamen.

| Kategorie | Anzahl | Bedeutung |
| --- | ---: | --- |
| `done + implemented/foundation` | 31 | Erledigte Runtime-, Foundation- oder gezielte Härtungsslices; Implementierungsfortschritt wird trotzdem nur über Dateien plus Registry gezählt. |
| `done + planning/contract/historical` | 13 | Erledigte Import-, Analyse-, Vertrags-, Harness- oder Planungsactivities ohne direkte CardImplementation-Zählung. |
| `done + superseded` | 8 | Grobe Phase-Activities, die ersetzt oder aufgeteilt wurden; sie zählen nie als Kartenimplementierung. |
| `in-progress + blocked` | 23 | Offene Detail-Activities mit fehlender PRO-, Regel- oder generischer Vertragsarbeit. |
| `inbox/open` | 0 | Keine Proteus-Activity liegt aktuell in `docs/activities/inbox/`. |
| Gesamt | 75 | Proteus-Activity-Dateien im Board. |

## Done + implemented/foundation

Diese Activities sind erledigt, aber die Kartenzahl wird nur aus konkreten Dateien plus Registry abgeleitet.

| Activity | Status | Phase/Slice | Karten / Artefaktart |
| --- | --- | --- | --- |
| `done/act-2026-05-24-proteus-phase-1a-reuse-only-baseline.md` | `done` | Phase 1a | 5 Karten: `Toughonium™ Wall`, `Networked Center`, `Research Bunker`, `Weapons Depot`, `Streetware Distributor`. |
| `done/act-2026-05-24-proteus-phase-1b-dynamic-public-etr-ice.md` | `done` | Phase 1b | 2 Karten: `Minotaur`, `Riddler`. |
| `done/act-2026-05-24-proteus-phase-1d-public-fort-pass-windows.md` | `done` | Phase 1d | 2 Karten: `Lesley Major`, `Rasmin Bridger`. |
| `done/act-2026-05-24-proteus-phase-1g-post-pass-derez-utility.md` | `done` | Phase 1g | 1 Karte: `Disintegrator`. |
| `done/act-2026-05-24-proteus-phase-2a-bad-publicity-foundation.md` | `done` | Phase 2a | Generischer `add_bad_publicity`-Foundation-Slice, keine Kartenpromotion. |
| `done/act-2026-05-24-proteus-phase-2b-scored-agenda-bad-publicity.md` | `done` | Phase 2b | 1 Karte: `Charity Takeover`. |
| `done/act-2026-05-24-proteus-phase-2c-direct-runner-event-bp-damage.md` | `done` | Phase 2c | 1 Karte: `Faked Hit`. |
| `done/act-2026-05-24-proteus-phase-2d-installed-card-cost-bp.md` | `done` | Phase 2d | 1 Karte: `Poisoned Water Supply`. |
| `done/act-2026-05-24-proteus-phase-3a-variable-ice-foundation.md` | `done` | Phase 3a | 2 Karten: `Digiconda`, `Food Fight`. |
| `done/act-2026-05-24-proteus-phase-3b-variable-cost-strength-subtype-ice.md` | `done` | Phase 3b | 9 Karten: `Caryatid`, `Credit Blocks`, `Galatea`, `Gatekeeper`, `Homing Missile`, `Lesser Arcana`, `Sandstorm`, `Sphinx 2006`, `Sumo 2008`. |
| `done/act-2026-05-24-proteus-phase-3c-relative-board-count-ice.md` | `done` | Phase 3c | 4 Karten: `Bug Zapper`, `Dog Pile`, `Hunting Pack`, `Mastermind`. |
| `done/act-2026-05-24-proteus-phase-3e-ice-repositioning.md` | `done` | Phase 3e | 2 Karten: `Mobile Barricade`, `Walking Wall`. |
| `done/act-2026-05-24-proteus-phase-4a-hidden-resource-activation-foundation.md` | `done` | Phase 4a | Hidden-Runner-Resource-Foundation, keine Zielkartenpromotion. |
| `done/act-2026-05-26-proteus-pro004-1-multibreak-hardening.md` | `done` | PRO004-1 | Multi-Break-Härtung, Proteus-Testkatalog und Regressionstests; keine neue Kartenpromotion. |
| `done/act-2026-05-26-proteus-pro005-simple-runner-economy-draw-events.md` | `done` | PRO005 | 2 Karten: `Cruising for Netwatch`, `Stakeout`; Phase 5c bleibt für PRO014 blockiert. |
| `done/act-2026-05-26-proteus-pro006-simple-corp-ice-resolver.md` | `done` | PRO006 | 4 Karten: `Brain Wash`, `Colonel Failure`, `Misleading Access Menus`, `Snowbank`; Phase 6b-Rest geht in PRO010. |
| `done/act-2026-05-26-proteus-pro006-1-simple-ice-hardening.md` | `done` | PRO006-1 | Test-/Typ-Härtung für PRO006; keine neue Kartenpromotion, Implementierungszählung bleibt 62/154, Phase-6b-Rest geht in PRO010. |
| `done/act-2026-05-27-proteus-pro007-corp-operation-economy-trace-history.md` | `done` | PRO007 | 5 Karten: `Credit Consolidation`, `Data Sifters`, `Manhunt`, `Schlaghund Pointers`, `Underworld Mole`; neue Implementierungszählung 67/154, Phase 6c abgeschlossen. |
| `done/act-2026-05-27-proteus-pro008-runner-event-run-economy-followup.md` | `done` | PRO008 | 13 Karten: `All-Hands`, `Decoy Signal`, `Demolition Run`, `Disgruntled Ice Technician`, `Drone for a Day`, `On the Fast Track`, `Prearranged Drop`, `Reconnaissance`, `Remote Detonator`, `Rush Hour`, `Weefle Initiation`, `Back Door to Rivals`, `Runner Sensei`; neue Implementierungszählung 80/154. |
| `done/act-2026-05-27-proteus-pro008-1-trace-reward-followup-hardening.md` | `done` | PRO008-1 | Trace-Avoid-Reward-Zählung und Remote-Detonator-Descriptor-Followup gehärtet; keine neue Kartenpromotion, Implementierungszählung bleibt 80/154. |
| `done/act-2026-05-27-proteus-pro009-runner-icebreaker-choice-modifier-suite.md` | `done` | PRO009 | 7 Karten: `Black Widow`, `Fubar`, `Morphing Tool`, `Bulldozer`, `Lockjaw`, `Personal Touch, The`, `Eurocorpse (TM) Spin Chip`; neue Implementierungszählung 87/154. |
| `done/act-2026-05-24-proteus-phase-5b-runner-protection-programs.md` | `done` | Phase 5b | 2 Karten: `Enterprise, Inc., Shields`, `Skullcap`. |
| `done/act-2026-05-24-proteus-phase-7a-hardware-deck-foundation.md` | `done` | Phase 7a | 1 Karte: `Deck, The`. |
| `done/act-2026-05-24-proteus-phase-7b-icebreaker-credit-decks.md` | `done` | Phase 7b | 2 Karten: `Cortical Cybermodem`, `Sunburst Cranial Interface`. |
| `done/act-2026-05-24-proteus-phase-7c-damage-prevention-hardware.md` | `done` | Phase 7c | 1 Karte: `Cortical Stimulators`. |
| `done/act-2026-05-24-proteus-phase-7d-base-link-trace-deck.md` | `done` | Phase 7d | Nachweis-Slice für den bereits in 7a umgesetzten Base-Link-/Trace-Anteil von `Deck, The`. |
| `done/act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation.md` | `done` | Phase 8a | Proteus-Purge-/Counter-Foundation, keine Kartenpromotion. |
| `done/act-2026-05-24-proteus-phase-8b-corp-antibody-access.md` | `done` | Phase 8b | 4 Karten: `Bel-Digmo Antibody`, `Doppelganger Antibody`, `Pattel Antibody`, `Stereogram Antibody`. |
| `done/act-2026-05-24-proteus-phase-8c-viral-breeding-ground-agenda.md` | `done` | Phase 8c | 1 Karte: `Viral Breeding Ground`. |
| `done/act-2026-05-24-proteus-phase-8d-runner-virus-run-counters.md` | `done` | Phase 8d | 4 Karten: `Highlighter`, `Taxman`, `Vienna 22`, `Viral Pipeline`. |
| `done/act-2026-05-24-proteus-phase-8e-virus-access-trash-program-effects.md` | `done` | Phase 8e | 2 Karten: `Crumble`, `Garbage In`. |
| `done/act-2026-05-24-proteus-phase-8f-random-bad-publicity-virus-longtail.md` | `done` | Phase 8f | 2 Karten: `Armageddon`, `Scaldan`. |
| `done/act-2026-05-24-proteus-phase-9d-data-fort-creation-lock.md` | `done` | Phase 9d | 1 Karte: `Precision Bribery`. |

## Done + planning/contract/historical

Diese Activities sind erledigt, aber kein Nachweis für konkrete Proteus-CardImplementation-Dateien.

| Activity | Status | Phase/Slice | Einordnung |
| --- | --- | --- | --- |
| `done/act-2026-05-17-proteus-spoiler-ingestion.md` | `done` | Proteus planning | Import/Kartenbasis. |
| `done/act-2026-05-17-proteus-mechanics-coverage-analysis.md` | `done` | Proteus planning | Mechanik-Analyse. |
| `done/act-2026-05-17-proteus-release-slicing-plan.md` | `done` | Proteus planning | Release-Slicing. |
| `done/act-2026-05-17-proteus-bad-publicity-loss-gate.md` | `done` | Proteus planning | Vertrag/Gate. |
| `done/act-2026-05-17-proteus-bad-publicity-engine-harness.md` | `done` | Proteus planning | Harness/Planungsnachweis, keine CardImplementation-Zählung. |
| `done/act-2026-05-17-proteus-variable-ice-contracts.md` | `done` | Proteus planning | Vertrag. |
| `done/act-2026-05-17-proteus-variable-ice-harness-slice.md` | `done` | Proteus planning | Historischer Harness/Planungsnachweis. |
| `done/act-2026-05-17-proteus-hidden-resources-contract.md` | `done` | Proteus planning | Vertrag. |
| `done/act-2026-05-17-proteus-hidden-resource-foundation-slice.md` | `done` | Proteus planning | Foundation-/Planungsslice, keine Kartenpromotion. |
| `done/act-2026-05-17-proteus-cybernetics-deck-hardware-contract.md` | `done` | Proteus planning | Vertrag. |
| `done/act-2026-05-17-proteus-virus-antibody-contracts.md` | `done` | Proteus planning | Vertrag; spätere Phase-8-Slices sind getrennt zu zählen. |
| `done/act-2026-05-17-proteus-purge-action-debt-contract.md` | `done` | Proteus planning | Vertrag. |
| `done/act-2026-05-17-proteus-visible-baseline-card-slice.md` | `done` | Proteus planning | Vorbereitung der später aufgeteilten Phase-1-Slices. |

## Done + superseded

Diese Activities liegen in `done/`, zählen aber ausdrücklich nicht als Implementierungsnachweis.

| Activity | Status | Phase/Slice | Ersetzt durch / Einordnung |
| --- | --- | --- | --- |
| `done/act-2026-05-24-proteus-phase-2-bad-publicity-cards.md` | `done` | Phase 2 | Durch 2a bis 2f aufgeteilt. |
| `done/act-2026-05-24-proteus-phase-3-variable-complex-ice.md` | `done` | Phase 3 | Durch 3a bis 3e aufgeteilt. |
| `done/act-2026-05-24-proteus-phase-4-hidden-runner-resources.md` | `done` | Phase 4 | Durch 4a bis 4e aufgeteilt. |
| `done/act-2026-05-24-proteus-phase-5-visible-runner-breaker-event-economy.md` | `superseded` | Phase 5 | Durch 5a bis 5e aufgeteilt. |
| `done/act-2026-05-24-proteus-phase-6-agenda-ambush-access-corp-resolvers.md` | `superseded` | Phase 6 | Durch 6a bis 6e aufgeteilt. |
| `done/act-2026-05-24-proteus-phase-7-cybernetics-deck-hardware.md` | `superseded` | Phase 7 | Durch 7a bis 7d aufgeteilt. |
| `done/act-2026-05-24-proteus-phase-8-virus-antibody-purge.md` | `superseded` | Phase 8 | Durch 8a bis 8f aufgeteilt. |
| `done/act-2026-05-24-proteus-phase-9-random-hidden-search-action-economy-longtail.md` | `superseded` | Phase 9 | Durch 9a bis 9e aufgeteilt. |

## In-progress + blocked

Diese Activities sind offen und bleiben blockiert. Die PRO-Referenzen stehen jetzt zusätzlich im Frontmatter der jeweiligen Datei.

| Activity | Status | Phase/Slice | Kartenliste / Blockerart | PRO-Referenzen |
| --- | --- | --- | --- | --- |
| `in-progress/act-2026-05-24-proteus-phase-1-visible-baseline-cards.md` | `blocked` | Phase 1 | Umbrella-Activity mit bereits erledigten und offenen Phase-1-Karten. | `PRO004`, `PRO006`, `PRO019` |
| `in-progress/act-2026-05-24-proteus-phase-1c-free-rez-ice-counter-lifecycle.md` | `blocked` | Phase 1c | `Emergency Rig`, `Rent-to-Own Contract`; X-Counter-/Rent-Isolation. | `PRO019` |
| `in-progress/act-2026-05-24-proteus-phase-1e-hidden-fort-manipulation-access.md` | `blocked` | Phase 1e | `Herman Revista`, `Marcel DeSoleil`, `Pavit Bharat`, `Simon Francisco`; Fort-Utility und Hidden-Fort-/Access-Verträge. | `PRO019` |
| `in-progress/act-2026-05-24-proteus-phase-1f-run-spend-cap.md` | `blocked` | Phase 1f | `Obfuscated Fortress`; Run-Payment-Source-/Spend-Cap-Vertrag. | `PRO019` |
| `in-progress/act-2026-05-24-proteus-phase-2e-run-access-history-bp.md` | `blocked` | Phase 2e | `Frame-Up`, `Live News Feed`, `Subliminal Corruption`; Bad-Publicity-Run-/History-Folgen. | `PRO015` |
| `in-progress/act-2026-05-24-proteus-phase-2f-replacement-choice-bp.md` | `blocked` | Phase 2f | `Identity Donor`, `Senatorial Field Trip`; Bad-Publicity-Replacement/Choice. | `PRO015` |
| `in-progress/act-2026-05-24-proteus-phase-3d-pass-trigger-uninstall-trash-ice.md` | `blocked` | Phase 3d | `Datacomb`, `Death Yo-Yo`, `Marionette`, `Scaffolding`, `Tumblers`, `Twisty Passages`; Post-Pass-/ICE-Lifecycle. | `PRO010` |
| `in-progress/act-2026-05-24-proteus-phase-4b-hidden-economy-bank-resources.md` | `blocked` | Phase 4b | `Chiba Bank Account`, `Liberated Savings Account`, `Swiss Bank Account`, `Airport Locker`, `Time to Collect`; Hidden-Bank-/Economy-Fenster. | `PRO011` |
| `in-progress/act-2026-05-24-proteus-phase-4c-hidden-access-mole-resources.md` | `blocked` | Phase 4c | `HQ Mole`, `R&D Mole`, `Simulacrum`; Hidden-Access-/Mole-Fenster. | `PRO011` |
| `in-progress/act-2026-05-24-proteus-phase-4d-hidden-prevention-damage-tag-resources.md` | `blocked` | Phase 4d | `Bolt-Hole`, `Expendable Family Member`, `Back Door to Netwatch`, `Get Ready to Rumble`, `Wired Switchboard`; Hidden-Prevention und Advanced Prevention. | `PRO012` |
| `in-progress/act-2026-05-24-proteus-phase-4e-hidden-trash-sabotage-cost-penalty.md` | `blocked` | Phase 4e | `Credit Subversion`, `Death from Above`, `Mercenary Subcontract`; Hidden-Successful-Run-/Access-Sabotage. | `PRO012` |
| `in-progress/act-2026-05-24-proteus-phase-5a-icebreaker-core-matchers-pump-break.md` | `blocked` | Phase 5a | PRO004- und PRO009-Zielkarten sind umgesetzt; die alte Umbrella-Activity bleibt nur als Statusreferenz ohne zusätzliche Komplettzählung. | `PRO004`, `PRO009` |
| `in-progress/act-2026-05-24-proteus-phase-5c-simple-runner-economy-draw-setup.md` | `blocked` | Phase 5c | PRO005 und die PRO008-Zielkarten für History-/Trace-Rewards sind umgesetzt; keine zusätzliche Komplettfreigabe der alten Umbrella-Activity. | `PRO005`, `PRO008` |
| `in-progress/act-2026-05-24-proteus-phase-5d-visible-runner-run-events.md` | `blocked` | Phase 5d | PRO008-Zielkarten `All-Hands`, `Rush Hour`, `Decoy Signal`, `Demolition Run`, `Remote Detonator`, `Disgruntled Ice Technician`, `Drone for a Day`, `Reconnaissance`, `Weefle Initiation` sind umgesetzt; keine zusätzliche Komplettfreigabe der alten Umbrella-Activity. | `PRO008` |
| `in-progress/act-2026-05-24-proteus-phase-5e-icebreaker-modifier-support-hardware.md` | `blocked` | Phase 5e | PRO009-Zielkarten `Personal Touch, The` und `Eurocorpse (TM) Spin Chip` sind umgesetzt; die alte Umbrella-Activity bleibt nur als Statusreferenz ohne zusätzliche Komplettzählung. | `PRO009` |
| `in-progress/act-2026-05-24-proteus-phase-6a-agenda-scoring-steal-baseline.md` | `blocked` | Phase 6a | `Corporate Headhunters`, `Fetal AI`, `Marked Accounts`, `Project Zurich`, `World Domination`; Agenda-Score-/Steal-Baseline. | `PRO013` |
| `in-progress/act-2026-05-24-proteus-phase-6b-corp-ice-simple-resolver.md` | `blocked` | Phase 6b | PRO006 ist umgesetzt; offene Trace-/Conditional-/Lifecycle-ICE gehen in Corp ICE Suite. | `PRO006`, `PRO010` |
| `in-progress/act-2026-05-24-proteus-phase-6c-corp-operation-trace-tag-economy.md` | `done` | Phase 6c | PRO007 umgesetzt: `Credit Consolidation`, `Data Sifters`, `Manhunt`, `Schlaghund Pointers`, `Underworld Mole`. | `PRO007` |
| `in-progress/act-2026-05-24-proteus-phase-6d-corp-asset-upgrade-utility.md` | `blocked` | Phase 6d | `Department of Misinformation`, `Government Contract`, `LDL Traffic Analyzers`, `Panic Button`, `Cybertech Think Tank`, `Raymond Ellison`, `Siren`, `Syd Meyer Superstores`; Asset/Upgrade Utility. | `PRO014` |
| `in-progress/act-2026-05-24-proteus-phase-6e-runner-agenda-overadvance-events.md` | `blocked` | Phase 6e | `Blackmail`, `Pirate Broadcast`, `Promises, Promises`; Runner Agenda/Overadvance Events. | `PRO013` |
| `in-progress/act-2026-05-24-proteus-phase-9a-random-dice-foundation.md` | `blocked` | Phase 9a | `Forward's Legacy`, `Roadblock`, `Executive Boot Camp`, `Lisa Blight`; Random Foundation und Encounter/Cost/Subroutine. | `PRO016` |
| `in-progress/act-2026-05-24-proteus-phase-9b-action-economy-debt.md` | `blocked` | Phase 9b | `Lucidrine™ Drip Feed`, `AI Board Member`, `Please Don't Choke Anyone`, `Project Venice`, `Corporate Guard(R) Temps`, `Bargain with Viacox`; Action Economy/Replacement. | `PRO017` |
| `in-progress/act-2026-05-24-proteus-phase-9c-hidden-zone-search-install-tutor.md` | `blocked` | Phase 9c | `Hijack`, `Test Spin`; Hidden-Zone Search/Install Tutor. | `PRO018` |
| `in-progress/act-2026-05-24-proteus-phase-9e-rule-blocked-preflight.md` | `blocked` | Phase 9e | `Ice and Data Special Report`; Rule-Blocked Preflight. | `PRO019` |

## PRO-Referenzabdeckung

| PRO | Status im Board nach PRO002 | Activity-/Artefaktbezug |
| --- | --- | --- |
| PRO001 | Bereits durch PRO001-Guard abgedeckt | `coverage.test.ts`: Manifest-/Registry-/Datei-Reconciliation |
| PRO002 | Dieses Statusartefakt | `proteus-activity-status-2026-05-26.md` |
| PRO003 | erledigt durch Paketstandard und Verify-Harness | `proteus-cardimplementation-package-standard.md`; `coverage.test.ts`: Proteus-Abdeckung, Restliste und Driftprüfung |
| PRO004 | umgesetzt; PRO004-1 Nacharbeit erledigt | Sechs Simple-Icebreaker-Core-Karten (`Big Frackin' Gun`, `Boring Bit`, `Corrosion`, `Redecorator`, `Skeleton Passkeys`, `Wrecking Ball`) sind konkrete Dateien, registriert und im Manifest engine-/human-playable. PRO004-1 ergänzt Multi-Break-Härtung und einen Proteus-Testkatalog; Phase 5a bleibt für PRO011/PRO012 blockiert. |
| PRO005 | umgesetzt | Zwei Simple-Runner-Economy-/Draw-Events (`Cruising for Netwatch`, `Stakeout`) sind konkrete Dateien, registriert und im Manifest engine-/human-playable. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO006 | umgesetzt; PRO006-1 Nacharbeit erledigt | Vier Simple-Corp-ICE-Resolver (`Brain Wash`, `Colonel Failure`, `Misleading Access Menus`, `Snowbank`) sind konkrete Dateien, registriert und im Manifest engine-/human-playable. PRO006-1 ergänzt Typ-/Mapping-Härtung für variable `end_the_run_unless_runner_pays`-Beträge und Colonel-Failure-Regressionen für 0/1 installierte Programme. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. Phase-6b-Rest geht in PRO010; `trash_program` bleibt im PRO006-Scope automatischer Subroutine-Effekt. |
| PRO007 | umgesetzt | Corp Operation Economy/Trace/History: `Credit Consolidation`, `Data Sifters`, `Manhunt`, `Schlaghund Pointers`, `Underworld Mole` sind konkrete Dateien, registriert und im Manifest engine-/human-playable. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO008 | umgesetzt; PRO008-1 Nacharbeit erledigt | Runner Event Run/Economy/Followup Suite mit 13 Runner-Events ist umgesetzt, registriert und im Manifest engine-/human-playable. PRO008-1 härtet Trace-Avoid-Rewards und den Remote-Detonator-Followup. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO009 | umgesetzt | Runner Icebreaker Choice/Modifier Suite mit 7 Icebreaker-/Modifier-/Supportkarten ist umgesetzt, registriert und im Manifest engine-/human-playable. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO010 | neu zu schneiden | Corp ICE Trace/Conditional/Lifecycle Suite mit 10 Corp-ICE-Karten. |
| PRO011 | neu zu schneiden | Hidden Resource Economy/Access Suite mit 8 Karten. |
| PRO012 | neu zu schneiden | Hidden Resource Prevention/Sabotage Suite mit 8 Karten. |
| PRO013 | neu zu schneiden | Agenda/Steal/Overadvance Suite mit 8 Karten. |
| PRO014 | neu zu schneiden | Corp Asset/Upgrade Utility Suite mit 8 Karten. |
| PRO015 | neu zu schneiden | Bad-Publicity Run/Replacement Suite mit 5 Karten. |
| PRO016 | neu zu schneiden | Random/Dice/Encounter Suite mit 4 Karten. |
| PRO017 | neu zu schneiden | Action Economy/Action Debt Suite mit 6 Karten. |
| PRO018 | neu zu schneiden | Hidden-Zone Search/Install Tutor Suite mit 2 Karten. |
| PRO019 | neu zu schneiden | Rule-Contract Baseline Utilities mit 8 Karten. |
| PRO020 | noch nicht ausführbar | Finaler Proteus-Abschluss erst nach leerer Restliste. |

## Arbeitsregel ab PRO002

- `done/status: superseded` und ersetzte grobe Phase-Activities dürfen nicht als `implemented` gezählt werden.
- Blockierte Detail-Activities bleiben offen, bis das jeweilige PRO-Paket oder der nötige Vertrag explizit umgesetzt ist.
- Neue PRO-Activities sollen höchstens ein PRO-Paket schneiden; bei Bedarf darf nach Detailplan mit Suffixen wie `PRO016a` gearbeitet werden, ohne die führende PRO001-bis-PRO020-Nummerierung zu ändern.
- Abschluss eines PRO-Implementierungspakets braucht mindestens: konkrete CardImplementation-Datei pro Karte, Registry-Eintrag, grüne PRO001-Reconciliation, passende Manifest-Driftprüfung, LegalAction-/`applyAction`-Revalidierung und Hidden-Info-/Replay-/StateHash-Nachweis.
