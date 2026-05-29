# Proteus Activity-Status und Board-Hygiene

Stand: 2026-05-29

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

Aktueller Stand nach PRO019:

| Kennzahl | Wert | Führende Quelle |
| --- | ---: | --- |
| Proteus-Gesamtbasis | 154 | `data/cards/proteus-cards.json` |
| Konkrete Proteus-CardImplementation-Dateien | 154 | `packages/engine/src/card-implementations/proteus/*.ts` |
| Registry-paritätische Implementierungen | 154 | `coverage.test.ts`-Guard gegen Registry |
| Fehlende konkrete CardImplementation-Dateien | 0 | Gesamtbasis minus konkrete Dateien |
| Manifest-`implemented`-Einträge | 154 | Driftprüfung in `data/manifests/proteus-card-support.json` |

PRO006-1 ist ausschließlich Test- und Typ-Härtung für den bereits umgesetzten PRO006-Scope. Es setzt keine neue Proteus-Karte um, ändert keine Manifest-Freigaben und zieht keine PRO010-Mechaniken vor. `trash_program` bleibt für PRO006 ein automatischer Printed-Subroutine-Effekt; Payment- und Zielwahlvarianten gehören zu PRO010.

PRO007 ist umgesetzt: `Credit Consolidation`, `Data Sifters`, `Manhunt`, `Schlaghund Pointers` und `Underworld Mole` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden generische Runner-History-Conditions für getrashte Nodes, installierte Resources und Run-Versuche im Spiel, Trace-Margin-Tags, Trace-Zielauswahl für last-turn Resources und ein deklaratives Trace-Zusatzkostenmodell. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO008 ist umgesetzt: `On the Fast Track`, `Prearranged Drop`, `Back Door to Rivals`, `Runner Sensei`, `All-Hands`, `Rush Hour`, `Decoy Signal`, `Demolition Run`, `Remote Detonator`, `Disgruntled Ice Technician`, `Drone for a Day`, `Reconnaissance` und `Weefle Initiation` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden generische Runner-Event-Run-Flags, Advertisement-/Transactions-Trash-History, einmaliger Agenda-Access-Credit-Reward, Trace-Link-Rewards, erfolgreiche-Run-Followups, Event-Source-Post-Pass-Derez, Rezzed-ICE-Trash-Replacements, Corp-Rez-Rewards und rungebundene Damage-Prevention-Pools. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO008-1 ist ausschließlich Härtung für den bereits umgesetzten PRO008-Scope. Trace-Avoid-Rewards werden aus den konkret genutzten Base-Link-/Post-Bid-Link-Abilities gezählt statt aus allen Reward-Effekten derselben Karte rekonstruiert; Remote Detonator nutzt im Followup-Pfad den Descriptor-`tagAmount`. Es setzt keine neue Proteus-Karte um, ändert keine Manifest-Freigaben und hält den Implementierungsstand bei 80/154.

PRO009 ist umgesetzt: `Black Widow`, `Fubar`, `Morphing Tool`, `Bulldozer`, `Lockjaw`, `Personal Touch, The` und `Eurocorpse (TM) Spin Chip` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden generische Install-Choices für ICE-Ziele, Encounter-Subtype-Wahlen, source-bound Strength-Modifier, subtype-gebundene Breaker-Matcher, exakt an die nächste ICE-Begegnung gebundene Followup-Breaks, Tap-/Untap-basierte Run-Strength-Boosts, gezielte permanente Icebreaker-Strength-Counter und hostgebundene Zahlungsbits. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO009-2 ist ausschließlich UI-/PlayerView-Härtung für bereits umgesetzte PRO009-Zustände: `selectedSubtype` wird mit Label sichtbar, Black Widows Ziel-ICE wird nur redigiert als erlaubte Titel- oder Positionszusammenfassung angezeigt, Hosting-Beziehungen erhalten `hostedOnLabel`, und `power`-Counter werden als CounterDisplay sichtbar. Es setzt keine neue Proteus-Karte um, ändert keine Manifest-Freigaben und hält den Implementierungsstand bei 97/154.

PRO010 ist umgesetzt: `Chihuahua`, `Coyote`, `Iceberg`, `Washed-Up Solo Construct`, `Datacomb`, `Death Yo-Yo`, `Marionette`, `Scaffolding`, `Tumblers` und `Twisty Passages` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden generische Bausteine für preventable Net-Damage als Trace-Erfolg, Runner-pay-or-trash-program, Future-ICE-Strength-Cancel beim Passieren der Quelle und Korp-Post-Pass-ICE-zurück-nach-HQ-Fenster. PRO010-1 härtet die Priorität gleichzeitiger Post-Pass-Fenster ohne neue Karten- oder Manifestfreigabe: `corpPostPassIceReturnToHq` wird vor `postPassCancellableFutureIceStrength` und `postPassPayOrEndRun` angeboten und ausgeführt. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO011 ist umgesetzt und PRO011-1 ist als reine Timing-/Behavior-Härtung erledigt: `Airport Locker`, `Chiba Bank Account`, `HQ Mole`, `Liberated Savings Account`, `R&D Mole`, `Simulacrum`, `Swiss Bank Account` und `Time to Collect` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden generische Tap-/Reveal-Kosten für verdeckte Runner-Resources, ein Kosten-/Penalty-Support-Fenster für Bankkarten, Run-/Encounter-Bedingungen, ein Access-Start-Fenster vor Queue-Aufbau für HQ/R&D Mole, AP-ICE-Pass über die Run-Fortsetzung und Resource-Trash-Prevention für andere installierte Resources im echten Korp-Zug. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO012 ist umgesetzt: `Back Door to Netwatch`, `Bolt-Hole`, `Credit Subversion`, `Death from Above`, `Expendable Family Member`, `Get Ready to Rumble`, `Mercenary Subcontract` und `Wired Switchboard` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden generische Hidden-Resource-Tap-/Reveal-Kosten für Damage-/Tag-Prevention, Post-Bid-Link, Trace-Erfolg-Cancel, Post-Meat-Damage-Reaktionen, Successful-Run-vor-Access-Followups und Current-Access-Trash. Neue Implementierungszählung: 113/154, 41 fehlend, kein Drift. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO012-1 ist ausschließlich Test- und Resolve-Härtung für den bereits umgesetzten PRO012-Scope. Mercenary Subcontract bleibt im sequenziellen NETGRID-Access-Modell auf genau die aktuelle `run.accessedCardId` bezogen; Multiaccess arbeitet diese Current-Access-Fenster nacheinander ab. Der Resolve-Pfad revalidiert jetzt Quelle, Runner-Resource-Installation, Controller, Tap-Zustand, Ability-Kind, Kostenprofil, Zahlbarkeit, kostenloses Trash-Override, aktuelle Zugriffskarte und Agenda-Ausschluss und zieht die `[4]`-Kosten ein. Ergänzt wurden konkrete Verhaltenstests für Bolt-Hole, Expendable Family Member, Trace-Success-Cancel-Öffnung, Credit Subversion, Death from Above und Mercenary Subcontract. Keine neue Kartenpromotion; Implementierungszählung bleibt 113/154, 41 fehlend, kein Drift.

PRO013 ist umgesetzt und PRO013-1 ist als reine Behavior-Härtung erledigt: `Corporate Headhunters`, `Fetal AI`, `Marked Accounts`, `Project Zurich`, `World Domination`, `Blackmail`, `Pirate Broadcast` und `Promises, Promises` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden current-access Self-Steal-Cost, Agenda-Access-Ambush mit R&D-Reveal-Barriere, source-bound scored-agenda Damage-Handsize-Followup, fixe Score-Agenda-Punkte, overadvance-basierte Start-of-Corp-Turn-Credits, successful-run access replacement für Runner-Agenda-Punkte, deterministische Mehrfach-Run-Sequenzen und ein einmaliger Next-Agenda-Access-Modifier. PRO013-1 erzwingt offene Pirate-Broadcast-Folgeruns als einzige Runner-Aktion, revalidiert den Sequenzstatus beim Run-Start und ergänzt fokussierte Verhaltenstests für die Agenda-/Steal-/Overadvance-Suite. Implementierungszählung bleibt 121/154, 33 fehlend, kein Drift. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO014 ist umgesetzt und PRO014-1 sowie PRO014-2 sind als reine Behavior-Härtungen erledigt: `Department of Misinformation`, `Government Contract`, `LDL Traffic Analyzers`, `Panic Button`, `Cybertech Think Tank`, `Raymond Ellison`, `Siren` und `Syd Meyer Superstores` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. PRO014-1 härtet Siren als Korp-Start-of-run-Redirect-Fenster, Department als explizite Expose-Prevention-Choice, Cybertech als source-bound Meat-Damage-Boost-Choice und Government-Contract-Credits als ausschließlich Install-/Rez-gebundenen temporären Pool. PRO014-2 legt Raymond-Ellison-Credits als expliziten Pool für Korp-Kosten während des aktuellen Runs fest; globale Korp-Zahlungspfade verbrauchen diesen Pool nicht mehr implizit. Ergänzt wurde eine fokussierte PRO014-Verhaltenstestdatei für die Corp-Asset-/Upgrade-Utility-Suite. Implementierungszählung bleibt 129/154, 25 fehlend, kein Drift. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO015 ist umgesetzt und PRO015-1 ist als reine Härtung erledigt: `Frame-Up`, `Identity Donor`, `Live News Feed`, `Senatorial Field Trip` und `Subliminal Corruption` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden run-scoped Bad-Publicity-Aftermath, Run-History-Zähler, Frame-Up-Turn-History, ein Grip-basiertes Meat-Damage-Replacement und eine stale-sichere Last-Rezzed-Black-ICE-Corp-Choice. PRO015-1 engt `Identity Donor` auf echte Korp-Zugphasen ein und härtet die Run-History-Tests über Produktionshooks. Das bestehende Bad-Publicity-7+-Loss-Gate bleibt die einzige Game-End-Autorität. Implementierungszählung bleibt 134/154, 20 fehlend, kein Drift. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO018 ist umgesetzt: `Hijack` und `Test Spin` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden enge generische Verträge für runnerprivate Hidden-Zone-Installationschoices, Hijack-temporäre Installationscredits, Test-Spin-Stack-Programmsuche, deterministisches Shuffle, Run-Followup und Return-or-Penalty-Cleanup. Implementierungszählung steigt auf 146/154, 8 fehlend, kein Drift. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO019 ist umgesetzt: `Emergency Rig`, `Rent-to-Own Contract`, `Herman Revista`, `Marcel DeSoleil`, `Obfuscated Fortress`, `Pavit Bharat`, `Simon Francisco` und `Ice and Data Special Report` sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable. Ergänzt wurden bounded Emergency-Rig-X, Kludge-/Term-Counter-Lifecycle, private Fort-Reorder-Choices, Top-R&D-Trash-Kosten, rungebundenes Runner-Spend-Cap-Ledger, Pavit-HQ-to-Fort-Replacement, Simon-Access-Queue-Reduktion und Ice-and-Data-Expose-in-single-data-fort. Implementierungszählung steigt auf 154/154, 0 fehlend, kein Drift. Keine Decklegalität, Formatlegalität oder AI-Unterstützung.

PRO019-1 ist als reine Rule-Contract-Härtung für den bereits umgesetzten PRO019-Scope erledigt. Simon wird in zentralen HQ-/R&D-Root-Queues tatsächlich accessed und reduziert nur spätere gespeicherte Access-Positionen; Pavit-Rez ist auf das konkrete Serverzugangsfenster und eine Korp-private HQ-Ersatzkartenchoice mit Resolve-Revalidierung eingegrenzt; Obfuscated Fortress zählt Runner-Trace-/Link- und Access-Trash-Zahlungen während des Runs gegen die Ansage; Ice and Data nutzt eine fortgebundene zweistufige Choice. Keine neue CardImplementation, keine Manifest-Freigabe und keine Zähländerung.

Keine Proteus-Karte wird durch dieses Artefakt `deck_legal`, `format_legal` oder `ai_supported`.

## PRO-Restzuschnitt

Der führende Detailplan `proteus-cardimplementation-detailplan-2026-05-26.md` wurde ab `PRO007` in größere Mechanikfamilien-Pakete umgedeutet. Neue Umsetzungsaufträge arbeiten mit `PRO001` bis `PRO020`.

| PRO | Status | Umfang |
| --- | --- | --- |
| PRO007 | umgesetzt | 5 Corp-Operations: Economy, History, Trace, Tags, Resource-Targeting. |
| PRO008 | umgesetzt | 13 Runner-Events: Economy, Run-Flags, Trace-Rewards, Followups. |
| PRO009 | umgesetzt | 7 Icebreaker-/Modifier-/Supportkarten. |
| PRO010 | umgesetzt | 10 Corp-ICE: Trace, Conditional, Post-Pass und Lifecycle. |
| PRO011 | umgesetzt | 8 Hidden-Resource-Economy-/Access-Karten. |
| PRO012 | umgesetzt | 8 Hidden-Resource-Prevention-/Sabotage-Karten. |
| PRO012-1 | umgesetzt | Test-/Resolve-Härtung für PRO012; keine neue Kartenpromotion. |
| PRO013 | umgesetzt | 8 Agenda-/Steal-/Overadvance-Karten. |
| PRO014 | erledigt | 8 Corp-Asset-/Upgrade-Utility-Karten; Implementierungszählung 129/154. |
| PRO014-1 | umgesetzt | Behavior-Härtung für PRO014; keine neue Kartenpromotion. |
| PRO015 | umgesetzt; PRO015-1 Nacharbeit erledigt | 5 Bad-Publicity-Run-/Replacement-Karten; Implementierungszählung 134/154. |
| PRO016 | umgesetzt; PRO016-1 Nacharbeit erledigt | 4 Random-/Dice-/Encounter-Karten; Implementierungszählung nach PRO016: 138/154. |
| PRO017 | umgesetzt; PRO017-1 und PRO017-2 Nacharbeiten erledigt | 6 Action-Economy-/Action-Debt-Karten; Implementierungszählung bleibt 144/154. |
| PRO018 | umgesetzt | 2 Hidden-Zone-Search-/Install-Tutor-Karten; Implementierungszählung steigt auf 146/154. |
| PRO019 | umgesetzt; PRO019-1 Nacharbeit erledigt | 8 regelvertragliche Baseline-/Utility-Karten; Implementierungszählung steigt auf 154/154. |
| PRO020 | ausführbar | Finaler Proteus-Abschluss nach leerer Restliste. |

## Geprüfte Activity-Menge

Geprüft wurden alle Activity-Unterordner unter `docs/activities/`: `inbox/`, `in-progress/`, `done/` und die vorhandenen sonstigen Unterordner. Proteus-relevant gezählt wurden Activity-Dateien mit Proteus-Bezug im Dateinamen.

| Kategorie | Anzahl | Bedeutung |
| --- | ---: | --- |
| `done + implemented/foundation` | 39 | Erledigte Runtime-, Foundation- oder gezielte Härtungsslices; Implementierungsfortschritt wird trotzdem nur über Dateien plus Registry gezählt. |
| `done + planning/contract/historical` | 13 | Erledigte Import-, Analyse-, Vertrags-, Harness- oder Planungsactivities ohne direkte CardImplementation-Zählung. |
| `done + superseded` | 8 | Grobe Phase-Activities, die ersetzt oder aufgeteilt wurden; sie zählen nie als Kartenimplementierung. |
| `in-progress + blocked/status-reference` | 23 | Offene oder nur noch als Referenz geführte Detail-Activities; resolved-by-done-Umbrellas zählen nicht erneut als Implementierung. |
| `inbox/open` | 0 | Keine Proteus-Activity liegt aktuell in `docs/activities/inbox/`. |
| Gesamt | 82 | Proteus-Activity-Dateien im Board. |

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
| `done/act-2026-05-27-proteus-pro009-1-icebreaker-correctness-hardening.md` | `done` | PRO009-1 | Nachhärtung für `Fubar`, `Bulldozer` und `Lockjaw`; keine Zähländerung. |
| `done/act-2026-05-27-proteus-pro009-2-ui-state-surface-hardening.md` | `done` | PRO009-2 | UI-/PlayerView-Härtung für PRO009-Zustände: selectedSubtype-Labels, redigierte Black-Widow-Ziele, Hosting-Labels und Power-Counter; keine Zähländerung. |
| `done/act-2026-05-27-proteus-pro010-corp-ice-trace-conditional-lifecycle-suite.md` | `done` | PRO010 | 10 Corp-ICE: `Chihuahua`, `Coyote`, `Iceberg`, `Washed-Up Solo Construct`, `Datacomb`, `Death Yo-Yo`, `Marionette`, `Scaffolding`, `Tumblers`, `Twisty Passages`; neue Implementierungszählung 97/154. |
| `done/act-2026-05-27-proteus-pro010-1-post-pass-window-priority-hardening.md` | `done` | PRO010-1 | Priorität gleichzeitiger Post-Pass-Fenster gehärtet; keine neue Kartenpromotion, Implementierungszählung bleibt 97/154. |
| `done/act-2026-05-27-proteus-pro011-hidden-resource-economy-access-suite.md` | `done` | PRO011 | 8 Hidden-Resources: `Airport Locker`, `Chiba Bank Account`, `HQ Mole`, `Liberated Savings Account`, `R&D Mole`, `Simulacrum`, `Swiss Bank Account`, `Time to Collect`; neue Implementierungszählung 105/154. |
| `done/act-2026-05-27-proteus-pro011-1-hidden-resource-timing-hardening.md` | `done` | PRO011-1 | Timing-/Behavior-Härtung für PRO011; keine neue Kartenpromotion, Implementierungszählung bleibt 105/154. |
| `done/act-2026-05-27-proteus-pro012-hidden-resource-prevention-sabotage-suite.md` | `done` | PRO012 | 8 Hidden-Resources: `Back Door to Netwatch`, `Bolt-Hole`, `Credit Subversion`, `Death from Above`, `Expendable Family Member`, `Get Ready to Rumble`, `Mercenary Subcontract`, `Wired Switchboard`; neue Implementierungszählung 113/154. |
| `done/act-2026-05-27-proteus-pro012-1-hidden-resource-hardening.md` | `done` | PRO012-1 | Resolve- und Test-Härtung für PRO012-Hidden-Resources; keine neue Kartenpromotion, Implementierungszählung bleibt 113/154. |
| `done/act-2026-05-28-proteus-pro013-agenda-steal-overadvance-suite.md` | `done` | PRO013 | 8 Agenda-/Steal-/Overadvance-Karten; neue Implementierungszählung 121/154. |
| `done/act-2026-05-28-proteus-pro013-1-agenda-suite-hardening.md` | `done` | PRO013-1 | Pirate-Broadcast-Pflichtsequenz und PRO013-Verhaltenstests gehärtet; keine neue Kartenpromotion, Implementierungszählung bleibt 121/154. |
| `done/act-2026-05-28-proteus-pro014-corp-asset-upgrade-utility-suite.md` | `done` | PRO014 | 8 Corp-Asset-/Upgrade-Utility-Karten; neue Implementierungszählung 129/154. |
| `done/act-2026-05-28-proteus-pro014-1-corp-utility-hardening.md` | `done` | PRO014-1 | Siren, Department, Cybertech, Government Contract und PRO014-Verhaltenstests gehärtet; keine neue Kartenpromotion, Implementierungszählung bleibt 129/154. |
| `done/act-2026-05-28-proteus-pro014-2-raymond-temporary-credit-scope.md` | `done` | PRO014-2 | Raymond-Ellison-Run-Credits explizit auf Korp-Kosten während des aktuellen Runs modelliert; keine neue Kartenpromotion, Implementierungszählung bleibt 129/154. |
| `done/act-2026-05-28-proteus-pro015-bad-publicity-run-replacement-suite.md` | `done` | PRO015 | 5 Bad-Publicity-Run-/Replacement-Karten; neue Implementierungszählung 134/154. |
| `done/act-2026-05-28-proteus-pro015-1-bad-publicity-hardening.md` | `done` | PRO015-1 | Identity-Donor-Timing und PRO015-Run-History-Tests gehärtet; keine neue Kartenpromotion, Implementierungszählung bleibt 134/154. |
| `done/act-2026-05-28-proteus-pro016-random-dice-encounter-suite.md` | `done` | PRO016 | 4 Random-/Dice-/Encounter-Karten; neue Implementierungszählung 138/154. |
| `done/act-2026-05-28-proteus-pro016-1-random-dice-hardening.md` | `done` | PRO016-1 | Executive-Boot-Camp-Run-Credits und Lisa-Blight-Subroutine-Duplikate gehärtet; keine neue Kartenpromotion, Implementierungszählung bleibt 138/154. |
| `done/act-2026-05-28-proteus-pro017-action-economy-debt-suite.md` | `done` | PRO017 | 6 Action-Economy-/Action-Debt-Karten; neue Implementierungszählung 144/154. |
| `done/act-2026-05-28-proteus-pro018-hidden-zone-search-install-tutor-suite.md` | `done` | PRO018 | 2 Hidden-Zone-Search-/Install-Tutor-Karten; neue Implementierungszählung 146/154. |
| `done/act-2026-05-29-proteus-pro019-rule-contract-baseline-utilities.md` | `done` | PRO019 | 8 regelvertragliche Baseline-/Utility-Karten; neue Implementierungszählung 154/154. |
| `done/act-2026-05-29-proteus-pro019-1-rule-contract-hardening.md` | `done` | PRO019-1 | Review-Härtung für Simon, Pavit, Obfuscated Fortress und Ice and Data; keine neue Kartenpromotion und keine Zähländerung. |
| `done/act-2026-05-28-proteus-pro017-1-action-economy-hardening.md` | `done` | PRO017-1 | PDCA-Choice, turn-bound Grant-Cleanup und Viacox-"nicht möglich"-Resolve gehärtet; keine neue Kartenpromotion und keine Zähländerung. |
| `done/act-2026-05-28-proteus-pro017-2-pdca-damage-timing-hardening.md` | `done` | PRO017-2 | PDCA-Return-Kontext und zentrale Corp-Damage-Anbindung nach Replacement-/Event-Modification-Fenstern gehärtet; Runner-self-/Core-Damage bleibt ausgeschlossen; keine neue Kartenpromotion und keine Zähländerung. |
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
| `in-progress/act-2026-05-24-proteus-phase-1c-free-rez-ice-counter-lifecycle.md` | `resolved-by-done-activity` | Phase 1c | PRO019 ist in `done/act-2026-05-29-proteus-pro019-rule-contract-baseline-utilities.md` abgeschlossen; alte Activity bleibt nur Referenz ohne doppelte Zählung. | `PRO019` |
| `in-progress/act-2026-05-24-proteus-phase-1e-hidden-fort-manipulation-access.md` | `resolved-by-done-activity` | Phase 1e | PRO019 ist in `done/act-2026-05-29-proteus-pro019-rule-contract-baseline-utilities.md` abgeschlossen; alte Activity bleibt nur Referenz ohne doppelte Zählung. | `PRO019` |
| `in-progress/act-2026-05-24-proteus-phase-1f-run-spend-cap.md` | `resolved-by-done-activity` | Phase 1f | PRO019 ist in `done/act-2026-05-29-proteus-pro019-rule-contract-baseline-utilities.md` abgeschlossen; alte Activity bleibt nur Referenz ohne doppelte Zählung. | `PRO019` |
| `in-progress/act-2026-05-24-proteus-phase-2e-run-access-history-bp.md` | `resolved-by-done-activity` | Phase 2e | PRO015 ist in `done/act-2026-05-28-proteus-pro015-bad-publicity-run-replacement-suite.md` abgeschlossen; Umbrella bleibt nur Referenz ohne doppelte Zählung. | `PRO015` |
| `in-progress/act-2026-05-24-proteus-phase-2f-replacement-choice-bp.md` | `resolved-by-done-activity` | Phase 2f | PRO015 ist in `done/act-2026-05-28-proteus-pro015-bad-publicity-run-replacement-suite.md` abgeschlossen; Umbrella bleibt nur Referenz ohne doppelte Zählung. | `PRO015` |
| `in-progress/act-2026-05-24-proteus-phase-3d-pass-trigger-uninstall-trash-ice.md` | `blocked` | Phase 3d | PRO010-Zielkarten sind umgesetzt; die alte Umbrella-Activity bleibt nur als Statusreferenz ohne zusätzliche Komplettzählung. | `PRO010` |
| `in-progress/act-2026-05-24-proteus-phase-4b-hidden-economy-bank-resources.md` | `blocked` | Phase 4b | PRO011-Zielkarten sind umgesetzt; die alte Scope-Blocker-Activity bleibt nur als Statusreferenz ohne zusätzliche Komplettzählung. | `PRO011` |
| `in-progress/act-2026-05-24-proteus-phase-4c-hidden-access-mole-resources.md` | `blocked` | Phase 4c | PRO011-Zielkarten sind umgesetzt; die alte Scope-Blocker-Activity bleibt nur als Statusreferenz ohne zusätzliche Komplettzählung. | `PRO011` |
| `in-progress/act-2026-05-24-proteus-phase-4d-hidden-prevention-damage-tag-resources.md` | `blocked` | Phase 4d | PRO012-Zielkarten sind umgesetzt; die alte Scope-Blocker-Activity bleibt nur als Statusreferenz ohne zusätzliche Komplettzählung. | `PRO012` |
| `in-progress/act-2026-05-24-proteus-phase-4e-hidden-trash-sabotage-cost-penalty.md` | `blocked` | Phase 4e | PRO012-Zielkarten sind umgesetzt; die alte Scope-Blocker-Activity bleibt nur als Statusreferenz ohne zusätzliche Komplettzählung. | `PRO012` |
| `in-progress/act-2026-05-24-proteus-phase-5a-icebreaker-core-matchers-pump-break.md` | `blocked` | Phase 5a | PRO004- und PRO009-Zielkarten sind umgesetzt; die alte Umbrella-Activity bleibt nur als Statusreferenz ohne zusätzliche Komplettzählung. | `PRO004`, `PRO009` |
| `in-progress/act-2026-05-24-proteus-phase-5c-simple-runner-economy-draw-setup.md` | `blocked` | Phase 5c | PRO005 und die PRO008-Zielkarten für History-/Trace-Rewards sind umgesetzt; keine zusätzliche Komplettfreigabe der alten Umbrella-Activity. | `PRO005`, `PRO008` |
| `in-progress/act-2026-05-24-proteus-phase-5d-visible-runner-run-events.md` | `blocked` | Phase 5d | PRO008-Zielkarten `All-Hands`, `Rush Hour`, `Decoy Signal`, `Demolition Run`, `Remote Detonator`, `Disgruntled Ice Technician`, `Drone for a Day`, `Reconnaissance`, `Weefle Initiation` sind umgesetzt; keine zusätzliche Komplettfreigabe der alten Umbrella-Activity. | `PRO008` |
| `in-progress/act-2026-05-24-proteus-phase-5e-icebreaker-modifier-support-hardware.md` | `blocked` | Phase 5e | PRO009-Zielkarten `Personal Touch, The` und `Eurocorpse (TM) Spin Chip` sind umgesetzt; die alte Umbrella-Activity bleibt nur als Statusreferenz ohne zusätzliche Komplettzählung. | `PRO009` |
| `in-progress/act-2026-05-24-proteus-phase-6a-agenda-scoring-steal-baseline.md` | `done-reference` | Phase 6a | PRO013-Zielkarten sind umgesetzt; alte Umbrella-Activity bleibt Statusreferenz ohne zusätzliche Komplettzählung. | `PRO013` |
| `in-progress/act-2026-05-24-proteus-phase-6b-corp-ice-simple-resolver.md` | `blocked` | Phase 6b | PRO006- und PRO010-Zielkarten sind umgesetzt; die alte Umbrella-Activity bleibt nur als Statusreferenz ohne zusätzliche Komplettzählung. | `PRO006`, `PRO010` |
| `in-progress/act-2026-05-24-proteus-phase-6c-corp-operation-trace-tag-economy.md` | `done` | Phase 6c | PRO007 umgesetzt: `Credit Consolidation`, `Data Sifters`, `Manhunt`, `Schlaghund Pointers`, `Underworld Mole`. | `PRO007` |
| `in-progress/act-2026-05-24-proteus-phase-6d-corp-asset-upgrade-utility.md` | `resolved-by-done-activity` | Phase 6d | PRO014 ist in `done/act-2026-05-28-proteus-pro014-corp-asset-upgrade-utility-suite.md` abgeschlossen; Umbrella bleibt nur Referenz ohne doppelte Zählung. | `PRO014` |
| `in-progress/act-2026-05-24-proteus-phase-6e-runner-agenda-overadvance-events.md` | `done-reference` | Phase 6e | PRO013-Zielkarten sind umgesetzt; alte Umbrella-Activity bleibt Statusreferenz ohne zusätzliche Komplettzählung. | `PRO013` |
| `in-progress/act-2026-05-24-proteus-phase-9a-random-dice-foundation.md` | `resolved-by-done-activity` | Phase 9a | PRO016 ist in `done/act-2026-05-28-proteus-pro016-random-dice-encounter-suite.md` abgeschlossen; Umbrella bleibt nur Referenz ohne doppelte Zählung. | `PRO016` |
| `in-progress/act-2026-05-24-proteus-phase-9b-action-economy-debt.md` | `done-reference` | Phase 9b | Durch PRO017 erledigt; bleibt nur als alte Slice-Referenz ohne zusätzliche Kartenzählung. | `PRO017` |
| `in-progress/act-2026-05-24-proteus-phase-9c-hidden-zone-search-install-tutor.md` | `resolved-by-done-activity` | Phase 9c | PRO018 ist in `done/act-2026-05-28-proteus-pro018-hidden-zone-search-install-tutor-suite.md` abgeschlossen; Umbrella bleibt nur Referenz ohne doppelte Zählung. | `PRO018` |
| `in-progress/act-2026-05-24-proteus-phase-9e-rule-blocked-preflight.md` | `resolved-by-done-activity` | Phase 9e | PRO019 ist in `done/act-2026-05-29-proteus-pro019-rule-contract-baseline-utilities.md` abgeschlossen; alte Rule-Preflight-Activity bleibt nur Referenz ohne doppelte Zählung. | `PRO019` |

## PRO-Referenzabdeckung

| PRO | Status im Board nach PRO002 | Activity-/Artefaktbezug |
| --- | --- | --- |
| PRO001 | Bereits durch PRO001-Guard abgedeckt | `coverage.test.ts`: Manifest-/Registry-/Datei-Reconciliation |
| PRO002 | Dieses Statusartefakt | `proteus-activity-status-2026-05-26.md` |
| PRO003 | erledigt durch Paketstandard und Verify-Harness | `proteus-cardimplementation-package-standard.md`; `coverage.test.ts`: Proteus-Abdeckung, Restliste und Driftprüfung |
| PRO004 | umgesetzt; PRO004-1 Nacharbeit erledigt | Sechs Simple-Icebreaker-Core-Karten (`Big Frackin' Gun`, `Boring Bit`, `Corrosion`, `Redecorator`, `Skeleton Passkeys`, `Wrecking Ball`) sind konkrete Dateien, registriert und im Manifest engine-/human-playable. PRO004-1 ergänzt Multi-Break-Härtung und einen Proteus-Testkatalog; Phase 5a bleibt nur als alte Statusreferenz ohne zusätzliche Komplettzählung. |
| PRO005 | umgesetzt | Zwei Simple-Runner-Economy-/Draw-Events (`Cruising for Netwatch`, `Stakeout`) sind konkrete Dateien, registriert und im Manifest engine-/human-playable. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO006 | umgesetzt; PRO006-1 Nacharbeit erledigt | Vier Simple-Corp-ICE-Resolver (`Brain Wash`, `Colonel Failure`, `Misleading Access Menus`, `Snowbank`) sind konkrete Dateien, registriert und im Manifest engine-/human-playable. PRO006-1 ergänzt Typ-/Mapping-Härtung für variable `end_the_run_unless_runner_pays`-Beträge und Colonel-Failure-Regressionen für 0/1 installierte Programme. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. Phase-6b-Rest geht in PRO010; `trash_program` bleibt im PRO006-Scope automatischer Subroutine-Effekt. |
| PRO007 | umgesetzt | Corp Operation Economy/Trace/History: `Credit Consolidation`, `Data Sifters`, `Manhunt`, `Schlaghund Pointers`, `Underworld Mole` sind konkrete Dateien, registriert und im Manifest engine-/human-playable. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO008 | umgesetzt; PRO008-1 Nacharbeit erledigt | Runner Event Run/Economy/Followup Suite mit 13 Runner-Events ist umgesetzt, registriert und im Manifest engine-/human-playable. PRO008-1 härtet Trace-Avoid-Rewards und den Remote-Detonator-Followup. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO009 | umgesetzt | Runner Icebreaker Choice/Modifier Suite mit 7 Icebreaker-/Modifier-/Supportkarten ist umgesetzt, registriert und im Manifest engine-/human-playable. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO009-2 | umgesetzt | UI-/PlayerView-Härtung für bereits implementierte PRO009-Zustände; keine neue CardImplementation, keine Manifest-Freigabe und keine Zähländerung. |
| PRO010 | umgesetzt | Corp ICE Trace/Conditional/Lifecycle Suite mit 10 Corp-ICE-Karten ist umgesetzt, registriert und im Manifest engine-/human-playable. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO010-1 | umgesetzt | Post-Pass-Window-Priorität für PRO010-Lifecycle-ICE plus Rasmin Bridger gehärtet; keine neue CardImplementation, keine Manifest-Freigabe und keine Zähländerung. |
| PRO011 | umgesetzt | Hidden Resource Economy/Access Suite mit 8 Karten ist umgesetzt, registriert und im Manifest engine-/human-playable. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO011-1 | umgesetzt | Reine Timing-/Behavior-Härtung für PRO011: Bankkarten im Kosten-/Penalty-Support-Fenster, HQ/R&D Mole im Access-Start-Fenster, `Time to Collect` nur in echten Korp-Zugphasen. Keine neue CardImplementation, keine Manifest-Freigabe und keine Zähländerung. |
| PRO012 | umgesetzt | Hidden Resource Prevention/Sabotage Suite mit 8 Karten ist umgesetzt, registriert und im Manifest engine-/human-playable. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO012-1 | umgesetzt | Reine Test-/Resolve-Härtung für PRO012: Mercenary-Current-Access-Revalidierung, sequenzielle Access-Interpretation und konkrete Hidden-Resource-Verhaltenstests. Keine neue CardImplementation, keine Manifest-Freigabe und keine Zähländerung. |
| PRO013 | umgesetzt | Agenda/Steal/Overadvance Suite mit 8 Karten ist umgesetzt, registriert und im Manifest engine-/human-playable. Keine Decklegalität, Formatlegalität oder AI-Unterstützung. |
| PRO013-1 | umgesetzt | Reine Behavior-Härtung für PRO013: Pirate-Broadcast-Folgeruns werden exklusiv erzwungen, StartRun revalidiert den Sequenzstatus, Action-Debt wird nicht im selben Run-Ende verbraucht, und `agenda-suite.test.ts` deckt die acht PRO013-Karten ab. Keine neue CardImplementation, keine Manifest-Freigabe und keine Zähländerung. |
| PRO014 | erledigt | Corp Asset/Upgrade Utility Suite mit 8 Karten. |
| PRO014-1 | umgesetzt | Reine Behavior-Härtung für PRO014: Siren, Department of Misinformation, Cybertech Think Tank und Government Contract laufen über explizite LegalAction-/Choice-/Kosten-Revalidierung; `corp-asset-upgrade-utility.test.ts` deckt die acht PRO014-Karten ab. Keine neue CardImplementation, keine Manifest-Freigabe und keine Zähländerung. |
| PRO014-2 | umgesetzt | Reine Raymond-Ellison-Härtung für PRO014: temporäre Credits gelten für Korp-Kosten während des aktuellen Runs, werden am Run-Ende zurückgegeben und werden nicht mehr implizit durch globale Korp-`spendCredits`-Pfade verbraucht. Keine neue CardImplementation, keine Manifest-Freigabe und keine Zähländerung. |
| PRO015 | umgesetzt; PRO015-1 Nacharbeit erledigt | Bad-Publicity Run/Replacement Suite mit 5 Karten; PRO015-1 ist reine Härtung ohne Zähländerung. |
| PRO016 | umgesetzt; PRO016-1 Nacharbeit erledigt | Random/Dice/Encounter Suite mit 4 Karten; Härtung ohne neue Karten- oder Manifestfreigabe. |
| PRO017 | umgesetzt; PRO017-1 und PRO017-2 Nacharbeiten erledigt | Action Economy/Action Debt Suite mit 6 Karten; Härtungen ohne neue Karten- oder Manifestfreigabe. |
| PRO018 | umgesetzt | Hidden-Zone Search/Install Tutor Suite mit 2 Karten; Harness 146/154. |
| PRO019 | umgesetzt; PRO019-1 Nacharbeit erledigt | Rule-Contract Baseline Utilities mit 8 Karten; Harness 154/154. PRO019-1 härtet zentrale Simon-Access-Queues, Pavit-Rez-/HQ-Choice-Revalidierung, Obfuscated-Fortress-Run-Zahlungszählung und Ice-and-Data-Fortbindung ohne neue Promotion. |
| PRO020 | ausführbar | Finaler Proteus-Abschluss nach leerer Restliste. |

## Arbeitsregel ab PRO002

- `done/status: superseded` und ersetzte grobe Phase-Activities dürfen nicht als `implemented` gezählt werden.
- Blockierte Detail-Activities bleiben offen, bis das jeweilige PRO-Paket oder der nötige Vertrag explizit umgesetzt ist.
- Neue PRO-Activities sollen höchstens ein PRO-Paket schneiden; bei Bedarf darf nach Detailplan mit Suffixen wie `PRO016a` gearbeitet werden, ohne die führende PRO001-bis-PRO020-Nummerierung zu ändern.
- Abschluss eines PRO-Implementierungspakets braucht mindestens: konkrete CardImplementation-Datei pro Karte, Registry-Eintrag, grüne PRO001-Reconciliation, passende Manifest-Driftprüfung, LegalAction-/`applyAction`-Revalidierung und Hidden-Info-/Replay-/StateHash-Nachweis.
