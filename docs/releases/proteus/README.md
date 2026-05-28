# Proteus-Dokumentation

`docs/releases/proteus/` bündelt die Artefakte für den importierten Proteus-Kartenstand. Import, Coverage, Slicing und Mechanikverträge bleiben die führenden Handoffs; die abgeschlossenen Detail-Slices geben einzelne Karten beziehungsweise Foundations eng begrenzt für die Runtime frei. Nach PRO015 stehen 134 von 154 Proteus-Karten als konkrete CardImplementation-Dateien bereit; 20 fehlen noch. Proteus ist weiterhin nicht decklegal, nicht formatlegal und nicht AI-unterstützt.

## Enthaltene Artefakte

- `spoiler-import-report.md`: Importbericht zum Proteus-Spoiler und zur blockierten display-only Kartenbasis.
- `mechanics-coverage-analysis.md`: Coverage-Klassifikation der importierten Proteus-Karten.
- `release-slicing-plan.md`: priorisierte Umsetzungsschnitte für spätere Proteus-Arbeit.
- `phase-1-slice-handoff-2026-05-24.md`: planning-only Zerlegung des zu großen Phase-1-Baseline-Pakets in sieben kleinere Activities mit benötigten Funktionsbausteinen je Kartenfamilie.
- `detailed-phase-slice-plan-2026-05-24.md`: konsolidierte Detailplanung für Phase 1 bis 9 mit empfohlenen Unter-Slices, Funktionsbausteinen, Abhängigkeiten und Handoff-Regel für spätere Activities.
- `proteus-cardimplementation-detailplan-2026-05-26.md`: führender Detailplan; ab PRO007 in größere Mechanikfamilien-Pakete umgedeutet, aktuell PRO001 bis PRO020.
- `proteus-activity-status-2026-05-26.md`: führende Board-/Status-Hygiene ab PRO002; trennt `done + implemented`, `done + superseded`, `in-progress + blocked` und offene PRO-Pakete und legt fest, dass Implementierungsfortschritt aus CardImplementation-Dateien plus Registry gezählt wird, nicht aus Activity-Ordnerpositionen.
- `proteus-cardimplementation-package-standard.md`: Paketstandard und Verify-Harness ab PRO003; definiert Activity-Template, Done-Gates und den Befehl `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"` für Abdeckung, Restliste und Driftprüfung.
- `bad-publicity-loss-gate-contract.md`: planning-only Vertrag für Bad-Publicity-7+-Game-End.
- `variable-ice-contract.md`: planning-only Vertrag für variable Proteus-ICE.
- `hidden-runner-resources-contract-2026-05-17.md`: planning-only Vertrag für verdeckte Runner-Resources.
- `cybernetics-deck-hardware-contract.md`: planning-only Vertrag für Cybernetics-/Deck-Hardware.
- `virus-antibody-counter-contract.md`: planning-only Vertrag für Virus-/Antibody-Counter.
- `purge-action-debt-contract.md`: planning-only Vertrag für Proteus-Purge und Action-Debt.

## Gate

Proteus bleibt außerhalb explizit abgeschlossener Implementierungsslices blockiert. Abgeschlossen sind die Done-Activities für Phase 1a, 1b, 1d, 1g, 2a bis 2d, 3a bis 3c, 3e, 4a, 5b, 7a bis 7d, 8a bis 8f, 9d sowie PRO007, PRO008, PRO009, PRO009-1, PRO009-2, PRO010, PRO010-1, PRO011, PRO011-1, PRO012, PRO012-1, PRO013, PRO013-1, PRO014, PRO014-1, PRO014-2 und PRO015. Die freigegebenen Karten sind `human_playable`, aber nicht `deck_legal`, nicht `format_legal` und nicht `ai_supported`. PRO015 ergänzt fünf Bad-Publicity-Run-/Replacement-Karten mit run-scoped History, Grip-Replacement und stale-sicherer Korp-Choice; das bestehende Bad-Publicity-7+-Gate bleibt die einzige Game-End-Autorität. Der Harness steht danach bei 154/134/20 ohne Drift. Jeder spätere Slice braucht eigene Requirements, Tests und Gate-Nachweise. Die übrigen Phase-Activities bleiben entlang von `detailed-phase-slice-plan-2026-05-24.md` weiter zu bearbeiten.

Phase 1c ist aktuell blockiert: `Emergency Rig` enthält in den lokalen Quellen eine positive, aber unbegrenzte `X`-Counter-Auswahl ohne Kosten- oder Wertbezug. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1c-free-rez-ice-counter-lifecycle.md` dokumentiert; `Rent-to-Own Contract` wird nicht isoliert promotet, solange der gemeinsame Slice nicht vollständig erfüllbar ist.

Phase 1e ist aktuell blockiert: `Pavit Bharat` braucht vor Umsetzung einen Hidden-HQ-to-Fort-Installationsvertrag für Typfilter, Slots, Kosten und öffentliche Count-/Positionsredaction; `Simon Francisco` braucht einen Central-Access-Reihenfolge-/Queue-Vertrag für Access-Count-Reduktion nach Access. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1e-hidden-fort-manipulation-access.md` dokumentiert; `Herman Revista` und `Marcel DeSoleil` werden nicht isoliert promotet, solange der gemeinsame Slice nicht vollständig erfüllbar oder sauber zerlegt ist.

Phase 1f ist aktuell blockiert: `Obfuscated Fortress` braucht vor Umsetzung einen verbindlichen Run-Payment-Source-Vertrag, ob normale Credits, Bad-Publicity-Credits, temporäre Run-Credits, Hosted-/Recurring-Credits und Stealth-Bits in Ansage, Spend-Cap und Endabrechnung zählen. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1f-run-spend-cap.md` dokumentiert.

Phase 4b bleibt als alte Scope-Blocker-Activity nur Statusreferenz: Die PRO011-Zielkarten `Airport Locker`, `Chiba Bank Account`, `Liberated Savings Account`, `Swiss Bank Account` und `Time to Collect` sind durch PRO011 umgesetzt. Daraus folgt keine zusätzliche Komplettzählung der Umbrella-Activity.

Phase 4c bleibt als alte Scope-Blocker-Activity nur Statusreferenz: Die PRO011-Zielkarten `HQ Mole`, `R&D Mole` und `Simulacrum` sind durch PRO011 umgesetzt. Daraus folgt keine zusätzliche Komplettzählung der Umbrella-Activity.

Phase 4d bleibt als alte Scope-Blocker-Activity nur Statusreferenz: Die PRO012-Zielkarten `Bolt-Hole`, `Expendable Family Member`, `Back Door to Netwatch`, `Get Ready to Rumble` und `Wired Switchboard` sind durch PRO012 umgesetzt. Daraus folgt keine zusätzliche Komplettzählung der Umbrella-Activity.

Phase 4e bleibt als alte Scope-Blocker-Activity nur Statusreferenz: Die PRO012-Zielkarten `Credit Subversion`, `Death from Above` und `Mercenary Subcontract` sind durch PRO012 umgesetzt. Daraus folgt keine zusätzliche Komplettzählung der Umbrella-Activity.

Phase 5a bleibt als alte Umbrella-Activity nur Statusreferenz: PRO004 hat die einfachen Icebreaker umgesetzt, PRO009 hat `Black Widow`, `Fubar`, `Morphing Tool`, `Bulldozer` und `Lockjaw` umgesetzt. Daraus folgt keine zusätzliche Komplettzählung der Umbrella-Activity. Der Status ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-5a-icebreaker-core-matchers-pump-break.md` dokumentiert.

Phase 5c bleibt als alte Umbrella-Activity nicht gesondert komplett freigegeben: `Cruising for Netwatch` und `Stakeout` sind durch PRO005 umgesetzt, die PRO008-Zielkarten `On the Fast Track`, `Prearranged Drop`, `Back Door to Rivals` und `Runner Sensei` sind durch PRO008 umgesetzt. Der Status ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-5c-simple-runner-economy-draw-setup.md` dokumentiert.

Phase 5d bleibt als alte Umbrella-Activity nicht gesondert komplett freigegeben: Die PRO008-Zielkarten `All-Hands`, `Rush Hour`, `Decoy Signal`, `Demolition Run`, `Remote Detonator`, `Disgruntled Ice Technician`, `Drone for a Day`, `Reconnaissance` und `Weefle Initiation` sind durch PRO008 umgesetzt. Der Status ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-5d-visible-runner-run-events.md` dokumentiert.

Phase 5e bleibt als alte Umbrella-Activity nur Statusreferenz: PRO009 hat `Personal Touch, The` und `Eurocorpse (TM) Spin Chip` mit gezieltem permanentem Icebreaker-Strength-Counter beziehungsweise hostgebundenen Zahlungsbits umgesetzt. Daraus folgt keine zusätzliche Komplettzählung der Umbrella-Activity. Der Status ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-5e-icebreaker-modifier-support-hardware.md` dokumentiert.

Phase 6a bleibt als alte Scope-Blocker-Activity nur Statusreferenz: Die PRO013-Zielkarten `Corporate Headhunters`, `Fetal AI`, `Marked Accounts`, `Project Zurich` und `World Domination` sind durch PRO013 umgesetzt. Daraus folgt keine zusätzliche Komplettzählung der Umbrella-Activity.

Phase 6b bleibt als alte Umbrella-Activity nur Statusreferenz: PRO006 und PRO010 haben die dort enthaltenen Simple-/Trace-/Conditional-ICE-Zielkarten umgesetzt. Daraus folgt keine zusätzliche Komplettzählung der Umbrella-Activity. Der Status ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-6b-corp-ice-simple-resolver.md` dokumentiert.

Phase 6c ist aktuell blockiert: `Credit Consolidation` ist zwar einfach, aber `Data Sifters`, `Manhunt`, `Schlaghund Pointers` und `Underworld Mole` benötigen Runner-History-Conditions, Trace-Erfolg nach Trace-Marge, ein Trace-Zusatzkostenmodell beziehungsweise Zielauswahl aus im letzten Runner-Zug installierten Resources. Diese generischen Operation-/Trace-Bausteine fehlen. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-6c-corp-operation-trace-tag-economy.md` dokumentiert.

Phase 6d/PRO014 ist abgeschlossen und mit PRO014-1 sowie PRO014-2 nachgehärtet; dokumentiert ist dies in `docs/activities/done/act-2026-05-28-proteus-pro014-corp-asset-upgrade-utility-suite.md`, `docs/activities/done/act-2026-05-28-proteus-pro014-1-corp-utility-hardening.md` und `docs/activities/done/act-2026-05-28-proteus-pro014-2-raymond-temporary-credit-scope.md`. PRO014-2 modelliert Raymond-Ellison-Credits als explizite Korp-Credits für Kosten während des aktuellen Runs, nicht als impliziten Seiteneffekt jedes globalen Korp-`spendCredits`-Pfads. Die alte Umbrella-Activity bleibt als Referenz ohne doppelte Zählung bestehen.

Phase 2e/2f/PRO015 ist abgeschlossen; dokumentiert ist dies in `docs/activities/done/act-2026-05-28-proteus-pro015-bad-publicity-run-replacement-suite.md`. Die alten Umbrella-Activities für Phase 2e und 2f bleiben nur Referenzen ohne doppelte Zählung.

Phase 6e bleibt als alte Scope-Blocker-Activity nur Statusreferenz: Die PRO013-Zielkarten `Blackmail`, `Pirate Broadcast` und `Promises, Promises` sind durch PRO013 umgesetzt. Daraus folgt keine zusätzliche Komplettzählung der Umbrella-Activity.

Phase 9a ist aktuell blockiert: `Roadblock` braucht einen Encounter-Entry-Random-Pass-/Derez- und encounter-only Strength-Bonus-Pfad; `Executive Boot Camp` braucht Random-Discard aus HQ als Korp-Kosten plus rungebundene temporäre Korp-Credits; `Lisa Blight` braucht Random-Discard-Kosten und ein Zielmodell zum Kopieren einer bestehenden Subroutine in diesem Fort. `Forward's Legacy` wäre voraussichtlich isoliert umsetzbar, wird aber nicht allein promotet, solange der gemeinsame Random/Dice-Slice nicht vollständig erfüllbar oder sauber neu geschnitten ist. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-9a-random-dice-foundation.md` dokumentiert.

Phase 9b ist aktuell blockiert: `AI Board Member`, `Project Venice` und `Corporate Guard(R) Temps` brauchen turngebundene zusätzliche beziehungsweise restricted/forfeit Actions; `Please Don't Choke Anyone` braucht ein Korp-Agenda-Damage-Replacement-Fenster nach Runner-Prevention; `Bargain with Viacox` braucht forced start-of-turn Random-Actions mit Hidden-Grip-Reveal und Play-/Install-Revalidierung. `Lucidrine™ Drip Feed` wird nicht isoliert promotet, solange der gemeinsame Action-Economy-/Action-Debt-Vertrag nicht vollständig ist. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-9b-action-economy-debt.md` dokumentiert.

Phase 9c ist aktuell blockiert: `Hijack` braucht einen Grip-Installationschoice für Programm oder Hardware mit temporären Install-Credits; `Test Spin` braucht nach Search-Install einen verpflichtenden Run-Followup und danach deterministisches Stack-Zurückmischen oder Kosten-/Meat-Damage-Penalty, falls das Programm nicht mehr im Spiel ist. Die vorhandenen Hidden-Zone-Search-Bausteine decken nur einfachere Stack-/Heap-Programmsuchen und Installationen ab. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-9c-hidden-zone-search-install-tutor.md` dokumentiert.

Phase 9e ist aktuell blockiert: `Ice and Data Special Report` hat in der lokalen Quelle die Kostenzeile `Cost: 3 (0)`, während Import und Kartendaten bewusst `numeric.cost: null` führen. Ohne dokumentierte Quellen-/Regelentscheidung darf weder Kosten 3 noch Kosten 0 noch ein anderer Sonderkostenpfad als LegalAction-Vertrag angenommen werden. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-9e-rule-blocked-preflight.md` dokumentiert.

Die Cluster in diesen Dokumenten sind Planungs- und Mechanikfamilien, keine Runtime-Sammeldateien. `release-slicing-plan.md` ordnet 154/154 Proteus-Karten einer primären Zielphase zu und ergänzt eine CardImplementation-/Ability-Bedarfsanalyse je Phase: vorhandene deklarative `kind`-/Modifier-/Hook-Familien werden zuerst wiederverwendet, echte Lücken werden als generische Engine-Helper geplant, und neue Proteus-ID-Branches im Runtime-Code sind ausgeschlossen. Jede spätere Proteus-Karte braucht eine eigene CardImplementation-Datei unter `packages/engine/src/card-implementations/`; gemeinsame Helper sind nur für echte mechanische Wiederverwendung vorgesehen. UI, Catalog und KI bleiben außerhalb der Regelautorität und dürfen keine Hidden-Info- oder Regelentscheidungen übernehmen.
