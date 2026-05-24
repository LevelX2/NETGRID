# Proteus-Planungsdokumentation

`docs/releases/proteus/` bündelt die planning-only Artefakte für den importierten Proteus-Kartenstand. Die Dokumente beschreiben Import, Coverage, Slicing und Mechanikverträge, geben aber keine Runtime-Implementierung, Decklegalität, Kartenpromotion oder AI-Unterstützung frei.

## Enthaltene Artefakte

- `spoiler-import-report.md`: Importbericht zum Proteus-Spoiler und zur blockierten display-only Kartenbasis.
- `mechanics-coverage-analysis.md`: Coverage-Klassifikation der importierten Proteus-Karten.
- `release-slicing-plan.md`: priorisierte Umsetzungsschnitte für spätere Proteus-Arbeit.
- `phase-1-slice-handoff-2026-05-24.md`: planning-only Zerlegung des zu großen Phase-1-Baseline-Pakets in sieben kleinere Activities mit benötigten Funktionsbausteinen je Kartenfamilie.
- `bad-publicity-loss-gate-contract.md`: planning-only Vertrag für Bad-Publicity-7+-Game-End.
- `variable-ice-contract.md`: planning-only Vertrag für variable Proteus-ICE.
- `hidden-runner-resources-contract-2026-05-17.md`: planning-only Vertrag für verdeckte Runner-Resources.
- `cybernetics-deck-hardware-contract.md`: planning-only Vertrag für Cybernetics-/Deck-Hardware.
- `virus-antibody-counter-contract.md`: planning-only Vertrag für Virus-/Antibody-Counter.
- `purge-action-debt-contract.md`: planning-only Vertrag für Proteus-Purge und Action-Debt.

## Gate

Proteus bleibt bis zu separaten Release- und Implementierungspaketen blockiert. Jeder spätere Slice braucht eigene Requirements, Tests und Gate-Nachweise; diese Übersicht ist nur der kanonische Einstieg in die vorbereitenden Artefakte.

Die Cluster in diesen Dokumenten sind Planungs- und Mechanikfamilien, keine Runtime-Sammeldateien. `release-slicing-plan.md` ordnet 154/154 Proteus-Karten einer primären Zielphase zu und ergänzt eine CardImplementation-/Ability-Bedarfsanalyse je Phase: vorhandene deklarative `kind`-/Modifier-/Hook-Familien werden zuerst wiederverwendet, echte Lücken werden als generische Engine-Helper geplant, und neue Proteus-ID-Branches im Runtime-Code sind ausgeschlossen. Jede spätere Proteus-Karte braucht eine eigene CardImplementation-Datei unter `packages/engine/src/card-implementations/`; gemeinsame Helper sind nur für echte mechanische Wiederverwendung vorgesehen. UI, Catalog und KI bleiben außerhalb der Regelautorität und dürfen keine Hidden-Info- oder Regelentscheidungen übernehmen.
