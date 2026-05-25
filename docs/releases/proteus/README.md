# Proteus-Dokumentation

`docs/releases/proteus/` bündelt die Artefakte für den importierten Proteus-Kartenstand. Import, Coverage, Slicing und Mechanikverträge bleiben die führenden Handoffs; seit den abgeschlossenen Detail-Slices bis Phase 3e gibt es zusätzlich eine eng begrenzte Runtime-Freigabe für 30 Karten. Phase 4a ergänzt ohne Kartenpromotion die generische Hidden-Runner-Resource-Aktivierungsgrundlage. Proteus ist weiterhin nicht decklegal, nicht formatlegal und nicht AI-unterstützt.

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

Proteus bleibt außerhalb explizit abgeschlossener Implementierungsslices blockiert. Abgeschlossen sind die Done-Activities für Phase 1a, 1b, 1d, 1g, 2a bis 2d, 3a bis 3c, 3e sowie 4a. Die freigegebenen Karten sind `human_playable`, aber nicht `deck_legal`, nicht `format_legal` und nicht `ai_supported`. Phase 3a ersetzt den alten Digiconda-/Food-Fight-Harness durch generische `variableRez`-/`variableIceState`-Bausteine; Phase 3b erweitert diese Familie um alternative öffentliche ICE-Subtypen, wiederverwendete bezahlte ETR-Subroutinen und Homing-Missile-Trace-Basis/-Limit. Phase 3c ergänzt generische öffentliche Relative-ICE-Zählung für gerezzte ICE außerhalb der aktuellen ICE im selben Fort. Phase 3e ergänzt eine generische Start-of-run-Same-Fort-Self-Reposition für ICE inklusive unrezzed Reveal über `faceup`. Phase 4a ergänzt generische Reveal-and-trash-Metadaten für verdeckte Runner-Resources in Event-Modification- und aktivierten CardImplementation-Kostenpfaden; sie promotet noch keine Phase-4-Zielkarte. Jeder spätere Slice braucht eigene Requirements, Tests und Gate-Nachweise. Die übrigen Phase-Activities bleiben entlang von `detailed-phase-slice-plan-2026-05-24.md` weiter zu bearbeiten.

Phase 1c ist aktuell blockiert: `Emergency Rig` enthält in den lokalen Quellen eine positive, aber unbegrenzte `X`-Counter-Auswahl ohne Kosten- oder Wertbezug. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1c-free-rez-ice-counter-lifecycle.md` dokumentiert; `Rent-to-Own Contract` wird nicht isoliert promotet, solange der gemeinsame Slice nicht vollständig erfüllbar ist.

Phase 1e ist aktuell blockiert: `Pavit Bharat` braucht vor Umsetzung einen Hidden-HQ-to-Fort-Installationsvertrag für Typfilter, Slots, Kosten und öffentliche Count-/Positionsredaction; `Simon Francisco` braucht einen Central-Access-Reihenfolge-/Queue-Vertrag für Access-Count-Reduktion nach Access. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1e-hidden-fort-manipulation-access.md` dokumentiert; `Herman Revista` und `Marcel DeSoleil` werden nicht isoliert promotet, solange der gemeinsame Slice nicht vollständig erfüllbar oder sauber zerlegt ist.

Phase 1f ist aktuell blockiert: `Obfuscated Fortress` braucht vor Umsetzung einen verbindlichen Run-Payment-Source-Vertrag, ob normale Credits, Bad-Publicity-Credits, temporäre Run-Credits, Hosted-/Recurring-Credits und Stealth-Bits in Ansage, Spend-Cap und Endabrechnung zählen. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1f-run-spend-cap.md` dokumentiert.

Die Cluster in diesen Dokumenten sind Planungs- und Mechanikfamilien, keine Runtime-Sammeldateien. `release-slicing-plan.md` ordnet 154/154 Proteus-Karten einer primären Zielphase zu und ergänzt eine CardImplementation-/Ability-Bedarfsanalyse je Phase: vorhandene deklarative `kind`-/Modifier-/Hook-Familien werden zuerst wiederverwendet, echte Lücken werden als generische Engine-Helper geplant, und neue Proteus-ID-Branches im Runtime-Code sind ausgeschlossen. Jede spätere Proteus-Karte braucht eine eigene CardImplementation-Datei unter `packages/engine/src/card-implementations/`; gemeinsame Helper sind nur für echte mechanische Wiederverwendung vorgesehen. UI, Catalog und KI bleiben außerhalb der Regelautorität und dürfen keine Hidden-Info- oder Regelentscheidungen übernehmen.
