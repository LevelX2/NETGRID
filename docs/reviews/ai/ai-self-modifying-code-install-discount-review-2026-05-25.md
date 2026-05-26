# Self-Modifying Code Install Discount Review

Datum: 2026-05-25

## Kurzfazit

`install_discount` war bei `Self-Modifying Code` fachlich falsch. Die Karte sucht während eines Runs ein Programm im Stack und installiert es, wenn möglich, aber sie sagt nicht "at no cost" und die Implementation modelliert `installCost: "normal"`.

Der aktive Hint wurde minimal korrigiert: Der manuelle `effects.kind = "install_discount"`-Eintrag wurde entfernt. `aiSupportStatus` bleibt unverändert. Es gibt keine Engine-, Runtime-, Planner- oder Consumer-Wirkung.

## Kartentext

`[T]: Search your stack for a program and install that program, if you can. Shuffle your stack afterwards. Use this ability only during a run.`

Wichtig ist der Unterschied zu `Mystery Box`: Dort steht ausdrücklich, dass das Programm "at no cost" installiert wird. Bei `Self-Modifying Code` fehlt diese kostenlose Installationssemantik.

## Implementation-Befund

Datei: `packages/engine/src/card-implementations/onr-v1/runner/programs/self-modifying-code.ts`

Die Implementation nutzt:

- Ability-Timing: `during_run`
- Effekt: `search_stack_install`
- Filter: `program`
- `installCost: "normal"`
- `shuffleAfterwards: true`
- `visibility: "hidden_info_barrier"`

Damit bildet die Implementation Search + Install-Target + normale Kostenbehandlung ab. Sie bildet keinen Discount und keine kostenlose Installation ab.

## Aktiver Hint-Befund

Vor dem Review enthielt `data/ai/ai-card-hints-active.json` bei `Self-Modifying Code`:

- `effect:search`
- `effect:install_discount`
- `condition:requires_during_run`
- `condition:requires_installed_program`
- `lineSupport: ["rig_first", "breaker_search_first"]`
- `quality.needsHumanReview: false`

Der `install_discount`-Effect war die einzige fachliche Abweichung. Entfernt wurde nur dieser Effect. Rollen, Planrollen, Qualität, `lineSupport`, `aiSupportStatus` und Szenarioreferenzen blieben unverändert.

## Derived-Facts-Befund

Nach der Korrektur leitet `check:ai-derived-facts` für `Self-Modifying Code` ab:

- `effect:search`
- `condition:requires_during_run`
- `targetProfiles.zone = "stack"`
- `targetProfiles.targetCardType = "program"`
- `targetProfiles.installsTarget = true`
- `targetProfiles.installCost = "normal"`
- `targetProfiles.shuffleAfter = true`

`Self-Modifying Code` hat danach:

- `missingManualOverlay: []`
- `descriptorGaps: []`
- kein `manual_ontology_without_generated_match` für `install_discount`

## Compiled-Index-Befund

Nach der Korrektur ist `Self-Modifying Code` kein Human-Review-Kandidat mehr:

- `needsManualReview: false`
- `recommendedNextAction: "ready_for_overlay_only_strategy_fields"`
- `migrationReadiness: "ready"`

Die verbleibenden SMC-Warnings sind normale Monolith-vs-Generated-Vergleichssignale:

- mechanische Monolith-Felder langfristig generated machen
- `targetProfiles` ist generated und fehlt im aktiven Monolithen
- `manualNotes` bleibt overlay-only

## Vergleich mit Mystery Box

`Self-Modifying Code`:

- sucht im Stack ein Programm
- installiert es, wenn möglich
- nutzt normale Kostenbehandlung
- ist nur während eines Runs nutzbar
- kein `install_discount`

`Mystery Box`:

- zeigt die obersten fünf Stack-Karten
- installiert ein Programm ausdrücklich "at no cost"
- mischt danach den Stack
- ist nur während eines Runs und einmal pro Run nutzbar
- behält `install_discount` und `targetProfiles.installCost = "free"`

Der AI-Hint-/Derived-Facts-Pfad behandelt die beiden Karten damit nicht mehr gleich.

## Entscheidung

Option A trifft zu: `install_discount` war bei `Self-Modifying Code` falsch.

Keine Schema-Erweiterung ist nötig. Das vorhandene read-only `targetProfiles.installCost` reicht aus:

- SMC: `installCost = "normal"`
- Mystery Box: `installCost = "free"`

## Geändert

- `data/ai/ai-card-hints-active.json`: `install_discount` bei `Self-Modifying Code` entfernt.
- `data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json`: SMC nicht mehr als Manual-Overlay-Bedarf markiert.
- Derived-/Compiled-Reports aktualisiert.
- AI-Gate-Tests auf die neuen Kennzahlen und SMC-Erwartung angepasst.
- Reviews/README aktualisiert.

## Bewusst Nicht Geändert

- Keine Engine-Implementation.
- Keine LegalAction-Logik.
- Keine Planner- oder Consumer-Logik.
- Keine Runtime-Nutzung des Compilers oder modularer Overlays.
- Keine Änderung an `aiSupportStatus`.
- Keine Massenmigration weiterer Hints.
- Keine Ontology-/Known-List-Erweiterung.

## Kennzahlen

Vorher:

- Derived-Facts Warnings: 40
- `cardsNeedingManualOverlay`: 4
- Compiled-Index Warnings: 80
- Human-Review-Kandidaten: 1 (`Self-Modifying Code`)

Nachher:

- Derived-Facts Warnings: 38
- `cardsNeedingManualOverlay`: 3
- Compiled-Index Warnings: 79
- Human-Review-Kandidaten: 0

## Nächster Schritt

Der nächste praktische Schritt ist die Priorisierung der verbleibenden mechanischen Monolith-Duplikationen. Dort sollte entschieden werden, welche `effects`, `conditions`, `breakerProfile`, `remoteRole` und `targetProfiles` langfristig generated werden sollen, ohne die Runtime-Quelle zu ersetzen.
