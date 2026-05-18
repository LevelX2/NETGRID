# CardImplementation Tranche Status

Stand: 2026-05-18

Dieses Dokument beschreibt den aktuellen Zwischenstand der Ability-Engine-Tranche auf dem Branch `refactor/card-definition-rez-cost-modifiers`. Es ist kein Zielbild-Ersatz, sondern ein Arbeitsstand für Folge-Threads.

## 1. Aktueller Architekturstand

Die aktuelle Schichtgrenze lautet:

```text
packages/shared
= CardDefinition / Katalog / Deckbau / Anzeige

packages/engine/src/card-implementations
= konkrete 1:1-Kartenimplementationen nach Set/Side/Kartentyp/Kartenidentität

packages/engine/src/ability-engine
= generische Ability-/Effect-/Modifier-/Interpreter-Bibliothek

apps/web/app/chronicle.ts
= formatiert Chronik aus Event-Kontext + ResolvedGameEffects
```

`packages/shared/src/index.ts` bleibt Katalog- und Deckbauquelle. Ausführbare Engine-Semantik wie Abilities, Effects, Modifier und Interpreter liegt dort nicht.

`packages/engine/src/card-implementations` enthält konkrete Kartenumsetzungen. Eine Datei beschreibt genau eine Karte und bindet diese über `cardDefinitionId` an die Katalogkarte.

`packages/engine/src/ability-engine` enthält die generische Sprache und Ausführungsschicht. Sie kennt keine set-spezifischen Karten und keine konkreten Pilotkarten-IDs.

`apps/web/app/chronicle.ts` darf typisierte `ResolvedGameEffect`s auswerten, muss aber den Kartenbezug aus Event-Kontext, `sourceDefinitionId` oder `sourceTitle` herstellen.

## 2. Nicht mehr erwünschte Muster

Diese Muster sollen in neuen Migrationen vermieden werden:

- neue Engine-Sonderfälle in `packages/engine/src/index.ts`, wenn eine `CardImplementationDefinition` möglich ist
- konkrete Karten-IDs in generischen Ability-, Effect-, Modifier- oder Cost-Pipelines
- Mechanik-Sammeldateien wie `simple-gain-credits.ts`, `simple-draw-cards.ts`, `mixed-effects.ts` oder `rez-cost-modifiers.ts`
- `CardImplementationDefinition`s mit Callbacks, Resolver-Funktionen oder direkter State-Mutation
- ausführbare Engine-Logik in `packages/shared/src/index.ts`
- Chroniktexte in Kartendateien
- Chronikzeilen, die nur isolierte Effekte ohne Kartenbezug darstellen, zum Beispiel nur "Runner erhält 3 Credits"
- doppelte Wirkung durch Legacy-Resolver plus neue CardImplementation
- doppelte Chronik durch Payload-Fallback plus `ResolvedGameEffect`-Formatierung

## 3. Migrierte Karten

### Passive Rez-Cost-Modifier

- Data Masons Hosting
- Encoder Inc
- Skålderviken SA Beta Test Site
- Fortress Architects
- Jerusalem City Grid

Diese Karten beschreiben deklarative `rez_cost`-Modifier in engine-lokalen CardImplementation-Dateien. Die Cost-Pipeline liest sie generisch aus der CardImplementation-Registry.

### Gain-only On-Play

- Accounts Receivable
- Efficiency Experts
- Livewire's Contacts
- Score!

Diese Karten nutzen `on_play`, `costs: "printed"` und einen `gain_credits`-Effect mit `recipient: "controller"`.

### Draw-only On-Play

- Annual Reviews
- Bodyweight Synthetic Blood
- Jack 'n' Joe

Diese Karten nutzen `on_play`, `costs: "printed"` und einen `draw_cards`-Effect mit `recipient: "controller"`.

### Mixed Ordered Effects

- Day Shift: `draw_cards 2`, then `gain_credits 1`
- Night Shift: `gain_credits 2`, then `draw_cards 1`

Die Reihenfolge wird durch die Reihenfolge der `effects` in der CardImplementation bestimmt und im `resolvedEffects`-Array erhalten.

## 4. Bestehende generische Bausteine

Aktuell vorhanden:

- `CardImplementationDefinition`
- `CardAbilityImplementation`
- `CardEffectImplementation`
- `GainCreditsEffectImplementation`
- `DrawCardsEffectImplementation`
- `CardRezCostModifierImplementation`
- `executeCardImplementationEffects`
- CardImplementation-Registry
- CardImplementation-Coverage
- Cost-Pipeline-Anbindung an CardImplementationDefinitions für passive Corp-Rez-Cost-Modifier
- Play-Pfad-Anbindung für `on_play` + `costs: "printed"`
- Chronikformatierung für `card_resolver`-`ResolvedGameEffect`s mit Kartenbezug

`executeCardImplementationEffects` interpretiert `gain_credits` und `draw_cards`. `draw_cards` nutzt eine Engine-Host-Primitive, damit bestehende Draw-Nebenwirkungen wie City Surveillance erhalten bleiben und nicht in der Ability Engine dupliziert werden.

CardImplementation-Effects erzeugen zusätzlich kompatible Payload-Felder und typisierte `ResolvedGameEffect`s. Für `card_resolver`-Effects sind `kind`, `visibility`, `side`, `amount`, `reason`, `sourceDefinitionId` und `sourceTitle` relevant.

## 5. Regeln für neue Kartenmigrationen

Für neue CardImplementation-Migrationen gelten diese Regeln:

- Jede migrierte Karte bekommt eine konkrete Datei nach `set / side / card type / card identity`.
- Jede Kartendatei beschreibt genau eine Karte.
- Eine Karte beschreibt ihre Engine-Wirkung deklarativ über Abilities, Effects oder Modifiers.
- Die Ability Engine interpretiert generisch und kennt keine konkrete Karte.
- Gedruckte Kosten werden nicht in der Implementation dupliziert; `costs: "printed"` verweist auf die normale `CardDefinition`.
- Bestehende PublicPayload-Felder bleiben kompatibel, solange Web, Replay oder Tests sie nutzen.
- `ResolvedGameEffect`s sollen die strukturierte Grundlage für Chronik, AI und spätere PublicEvent-Auswertung bilden.
- Chronik muss den Bezug zur gespielten Karte enthalten.
- Draw-Effekte dürfen keine gezogenen Kartenidentitäten leaken.
- CardImplementation-Coverage muss aktualisiert werden.
- Alte Resolver müssen entfernt oder sauber umgangen werden, damit keine Doppeleffekte entstehen.
- Registry- und Coverage-Konsistenztests müssen weiterhin doppelte IDs und fehlende Coverage sichtbar machen.

## 6. Offene Legacy-Bereiche

Diese Bereiche sind bewusst noch nicht migriert:

- Olivia Salazar
- Startup Immolator
- Loan from Chiba
- Corporate Negotiating Center
- Restrictive Net Zoning
- MRAM / Militech MRAM
- Krash
- Virizz
- weitere Karten mit Targets, Choices, Triggern, Damage, Trash, Reveal, Search oder Conditional Effects

Diese Karten oder Mechaniken können erst migriert werden, wenn die jeweils nötigen generischen Bausteine vorhanden sind. Unsichere Fälle sollen in Coverage konservativ als `pending_implementation` oder `legacy_engine_special_case` sichtbar bleiben.

## 7. Nächste sinnvolle technische Optionen

Option A: Weitere einfache On-Play-Karten migrieren, wenn sie ausschließlich aus vorhandenen Bausteinen bestehen.

Option B: Einen neuen kleinen Effect-Baustein hinzufügen, zum Beispiel `lose_credits`, `damage`, `trash_card`, `add_counter` oder `remove_tag`.

Option C: Chronik und `ResolvedGameEffect`s weiter stabilisieren, insbesondere für gemischte oder mehrere öffentliche Effekte.

Option D: Einen Legacy-Sonderfall wie Loan from Chiba auf CardImplementationDefinition migrieren, wenn dafür nur vorhandene oder sehr kleine neue Bausteine nötig sind.

Option E: Olivia Salazar später als Ability mit Timing, Source-Validation, Limit und temporary derez modellieren.

Keine dieser Optionen sollte verdeckt P3, Trigger Registry, Target Binding oder produktive ActiveModifier-Nutzung starten.

## 8. Tests und Qualitätssicherung

Für neue Migrationen werden erwartet:

- Engine-Typecheck
- fokussierte Engine-Tests für migrierte Karten
- vollständige Engine-Tests
- Web-Chronik-Tests, wenn Chronik oder `ResolvedGameEffect`-Darstellung betroffen ist
- Coverage- und Registry-Konsistenztests
- Hidden-Info-Leak-Tests bei Draw, Reveal, Search und anderen verdeckten Zonen
- Tests gegen Doppeleffekte durch Legacy-Resolver plus neue CardImplementation
- Tests für kompatible PublicPayload-Felder
- Tests für `resolvedEffects`-Reihenfolge bei geordneten Effektsequenzen
- Replay- und StateHash-Checks, wenn der produktive Play- oder Resolve-Pfad betroffen ist

## 9. Aktuelle Arbeitsregel für Folge-Threads

Folge-Threads sollen den Nettozustand dieses Branches als gültige Zwischenarchitektur behandeln. Neue Migrationen sollen die Schichtgrenze respektieren und lieber klein bleiben als zusätzliche generische Pipeline-Sonderfälle einzuführen.
