# AI020-1 Runner Hardware Tactic Signal Cleanup

## Kurzfazit

AI020-1 korrigiert die fachliche Grenze zwischen Kartentypisierung und KI-Funktionssprache. Die reinen Hardware-Subtype-Signale `setup.vehicle`, `setup.memory_chip` und `setup.cybernetics` wurden aus Taktiksignal-Katalog, Derivation und aktiven Hardware-Hints entfernt. Die Subtypen `vehicle`, `chip`, `cybernetics` und `deck` bleiben über die Kartendaten erkennbar. Funktionale Hardware-Signale bleiben erhalten; `setup.deck_exclusive` bleibt als echter Only-one-deck-Constraint bewusst bestehen.

## Scope / Out-of-Scope

- Scope: Runner-Hardware aus AI020, Taktiksignal-Katalog, Hardware-Hints, Derivationsregeln, generierte AI-Artefakte, AI020-/AI020-1-Invarianten, Review-Dokumentation und JSON-Report.
- Out-of-Scope: neue Strategy IDs, Planner, ActionScore, PlanWeight, Engine, LegalAction-Erzeugung, Targeting-KI, Profil-/Default-Umschaltung, UI-Derivationslogik, CardImplementation-Logik und neue Consumer.

## Ausgangsbefund aus AI020

AI020 hatte die Hardware-Semantik insgesamt konservativ eingeordnet, aber drei beschreibende Typisierungen als Taktiksignale katalogisiert:

- `setup.vehicle`
- `setup.memory_chip`
- `setup.cybernetics`

Diese Signale beschreiben, was eine Karte formal ist, aber nicht, wofür die KI sie funktional nutzt. Zusätzlich fehlte bei `Militech MRAM Chip` nach der funktionalen Sicht ein `setup.hand_size`-Signal für Hand-size +3.

## Entfernte und Geänderte Signale

Entfernt wurden:

- `setup.vehicle`: Vehicle bleibt Kartensubtyp; Tag-Schutz, Tag-Clear-Credits und Meat-Damage-Prevention bleiben funktionale Signale.
- `setup.memory_chip`: Chip/Memory-Chip bleibt Kartendatum; MU-Erhöhung bleibt `setup.memory`.
- `setup.cybernetics`: Cybernetics bleibt Kartensubtyp oder späteres Targeting-/Constraint-Merkmal; Damage-/Hand-size-/Memory-Funktionen bleiben separat.

Geändert beziehungsweise bestätigt wurden:

- `setup.hand_size`: Derivation für `amount: 3` ergänzt, damit `Militech MRAM Chip` funktional sichtbar bleibt.
- `setup.deck_exclusive`: bewusst behalten, weil Decks eine echte Setup-Exklusivität haben.
- `setup.program_host`: für `Eurocorpse (TM) Spin Chip` als funktionales Hosting-Signal beibehalten.

## Subtypinformationen

Subtypen werden nicht mehr über Taktiksignale transportiert. Die Kartendaten bleiben führend:

- Vehicle: `Armadillo`, `Drifter`, `Nasuko Cycle`.
- Chip: Memory Chips, Speed Chips, MRAM Chips, `Eurocorpse (TM) Spin Chip`.
- Cybernetics: MRAM Chips, Cybermodem-/Stimulator-/Bodyplating-/Full-Body-Fälle.
- Deck: Deck-Hardware plus `setup.deck_exclusive` als funktionaler Slot-Konflikt.

## Kartenkorrekturen

- `Armadillo` und `Drifter`: kein `setup.vehicle`; Tag-Clear-/Recurring-Credit-Funktion bleibt.
- `Nasuko Cycle`: kein `setup.vehicle`; `defense.tag_prevention` bleibt.
- `Tycho Mem Chip`, `WuTech Mem Chip`, `Zetatech Mem Chip`: kein `setup.memory_chip`; `setup.memory` bleibt.
- `Corolla Speed Chip`, `ZZ22 Speed Chip`: kein Chip-Typsignal; `economy.recurring_killer_credit` bleibt.
- `MRAM Chip`, `Militech MRAM Chip`: keine Chip-/Cybernetics-Taktiksignale; `setup.hand_size` bleibt beziehungsweise wurde für +3 ergänzt.
- `Eurocorpse (TM) Spin Chip`: kein Chip-Typsignal; `setup.program_host`, `economy.recurring_breaker_credit` und `hosted_install_target` bleiben.
- `Cortical Cybermodem`, `Sunburst Cranial Interface`, `Deck, The`, `Bodyweight Data Crèche`: kein Deck-/Cybernetics-Typsignal; `setup.deck_exclusive` plus funktionale Memory-/Hand-size-/Credit-/Run-Signale bleiben.
- `Lifesaver Nanosurgeons`: kein Cybernetics-Typsignal; Brain-Damage-Prevention und bedingtes Recovery-Draw bleiben.
- `Lucidrine Drip Feed`: Extra-Action und Brain-Damage-Risiko bleiben sichtbar, ohne Strategieanker.
- `Microtech ’Trode Set`: AP-Mitigation und Break-cost-Penalty bleiben, ohne Breaker-Coverage.
- `Record Reconstructor`: bleibt Archives/R&D-Manipulation und TargetProfile-Kandidat, ohne R&D-Pressure-Anker.

## Strategieanker

Keine neuen Strategy IDs. Strategieanker bleiben auf drei Karten begrenzt:

- HQ Interface: `runner.hq_pressure` und `runner.interface_closeout` als `payoff_anchor`.
- R&D Interface: `runner.rnd_pressure` und `runner.interface_closeout` als `payoff_anchor`.
- Full Body Conversion: `runner.survival_defense` als `defensive_tool` mit mittlerer Confidence wegen Pay-through-Drawback.

## TargetProfiles

- Microtech Backup Drive: `replacement_target` bleibt aktiv.
- Eurocorpse (TM) Spin Chip: `hosted_install_target` bleibt aktiv.
- Record Reconstructor: bleibt Kandidat bis zur separaten LegalAction Semantic Bridge.

## Count-Klärung

AI020s `newTacticSignalCount=27` beschrieb neu katalogisierte Signale. Der AI020-Invariant-Check meldete `signals=26`, weil `risk.hardware_trash_target` nur als Katalog-/Derivations-Abgleich geführt wurde und auf aktiver Runner-Hardware nicht vorkam. AI020-1 entfernt drei beschreibende Subtype-Signale; damit bleiben 24 AI020-Katalogsignale und 23 AI020-Invariant-Signale im aktiven Hardware-Check.

## Deferred Items

- Kein generisches `runner.hardware`, `hardware.chip`, `hardware.cybernetics`, `setup.vehicle` oder `setup.memory_chip`.
- Keine Action-Economy-/Tempo-Strategieanker für Bodyweight Data Crèche oder Lucidrine Drip Feed.
- Record Reconstructor erhält kein aktives TargetProfile, bis die LegalAction Semantic Bridge bereit ist.
- Keine neuen Consumer für die bereinigten Signale.

## Verifikation

Finale Verifikation ist im JSON-Report unter `verification` dokumentiert. AI020- und AI020-1-Invarianten, Strategy-Taxonomy, AI-Gates, AI-Test-Suite, relevante Typechecks und `git diff --check` wurden ohne Fehler geführt.

## Risiken / Folgeempfehlungen

Subtype-basierte Targeting-Fragen, etwa Cybernetics-Ausnahmen bei späteren Hardware-Trash-Effekten, müssen künftig über Kartendaten, Constraints oder TargetProfiles laufen, nicht über Taktiksignale. Falls dafür ein Consumer entsteht, braucht er einen eigenen side-safe Vertrag.
