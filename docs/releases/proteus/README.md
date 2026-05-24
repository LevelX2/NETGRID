# Proteus-Dokumentation

`docs/releases/proteus/` bündelt die Artefakte für den importierten Proteus-Kartenstand. Import, Coverage, Slicing und Mechanikverträge bleiben die führenden Handoffs; seit Phase 1a und 1b gibt es zusätzlich eine eng begrenzte Runtime-Freigabe für sieben Baseline-Karten. Proteus ist weiterhin nicht decklegal, nicht formatlegal und nicht AI-unterstützt.

## Enthaltene Artefakte

- `spoiler-import-report.md`: Importbericht zum Proteus-Spoiler und zur blockierten display-only Kartenbasis.
- `mechanics-coverage-analysis.md`: Coverage-Klassifikation der importierten Proteus-Karten.
- `release-slicing-plan.md`: priorisierte Umsetzungsschnitte für spätere Proteus-Arbeit.
- `phase-1-slice-handoff-2026-05-24.md`: planning-only Zerlegung des zu großen Phase-1-Baseline-Pakets in sieben kleinere Activities mit benötigten Funktionsbausteinen je Kartenfamilie.
- `detailed-phase-slice-plan-2026-05-24.md`: konsolidierte Detailplanung für Phase 1 bis 9 mit empfohlenen Unter-Slices, Funktionsbausteinen, Abhängigkeiten und Handoff-Regel für spätere Activities.
- `bad-publicity-loss-gate-contract.md`: planning-only Vertrag für Bad-Publicity-7+-Game-End.
- `variable-ice-contract.md`: planning-only Vertrag für variable Proteus-ICE.
- `hidden-runner-resources-contract-2026-05-17.md`: planning-only Vertrag für verdeckte Runner-Resources.
- `cybernetics-deck-hardware-contract.md`: planning-only Vertrag für Cybernetics-/Deck-Hardware.
- `virus-antibody-counter-contract.md`: planning-only Vertrag für Virus-/Antibody-Counter.
- `purge-action-debt-contract.md`: planning-only Vertrag für Proteus-Purge und Action-Debt.

## Gate

Proteus bleibt außerhalb explizit abgeschlossener Implementierungsslices blockiert. Abgeschlossen sind `docs/activities/done/act-2026-05-24-proteus-phase-1a-reuse-only-baseline.md` und `docs/activities/done/act-2026-05-24-proteus-phase-1b-dynamic-public-etr-ice.md`: `Toughonium™ Wall`, `Networked Center`, `Research Bunker`, `Weapons Depot`, `Streetware Distributor`, `Minotaur` und `Riddler` sind `human_playable`, aber nicht `deck_legal`, nicht `format_legal` und nicht `ai_supported`. Phase 1b ergänzt generische öffentliche Additional-Subroutine-Modifier und ein `corp_encounter`-Aktivierungsfenster ohne neue Proteus-ID-Branches; der ältere Digiconda-/Food-Fight-Harness bleibt technische Schuld für spätere Variable-ICE-Slices. Jeder spätere Slice braucht eigene Requirements, Tests und Gate-Nachweise. Die groben Phase-Activities für Phase 2 bis 9 sind vor Codearbeit entlang von `detailed-phase-slice-plan-2026-05-24.md` weiter zu schneiden.

Phase 1c ist aktuell blockiert: `Emergency Rig` enthält in den lokalen Quellen eine positive, aber unbegrenzte `X`-Counter-Auswahl ohne Kosten- oder Wertbezug. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1c-free-rez-ice-counter-lifecycle.md` dokumentiert; `Rent-to-Own Contract` wird nicht isoliert promotet, solange der gemeinsame Slice nicht vollständig erfüllbar ist.

Die Cluster in diesen Dokumenten sind Planungs- und Mechanikfamilien, keine Runtime-Sammeldateien. `release-slicing-plan.md` ordnet 154/154 Proteus-Karten einer primären Zielphase zu und ergänzt eine CardImplementation-/Ability-Bedarfsanalyse je Phase: vorhandene deklarative `kind`-/Modifier-/Hook-Familien werden zuerst wiederverwendet, echte Lücken werden als generische Engine-Helper geplant, und neue Proteus-ID-Branches im Runtime-Code sind ausgeschlossen. Jede spätere Proteus-Karte braucht eine eigene CardImplementation-Datei unter `packages/engine/src/card-implementations/`; gemeinsame Helper sind nur für echte mechanische Wiederverwendung vorgesehen. UI, Catalog und KI bleiben außerhalb der Regelautorität und dürfen keine Hidden-Info- oder Regelentscheidungen übernehmen.
