# CardImplementation Tranche Status

Stand: 2026-05-19, nach P2.13a

Dieses Dokument beschreibt den aktuellen Zwischenstand der Ability-Engine-Tranche auf dem Branch `refactor/card-definition-rez-cost-modifiers`. Es ist kein Zielbild-Ersatz, sondern der technische Arbeitsstand für Folge-Threads.

## 1. Aktueller Architekturstand

Die aktuelle Schichtgrenze lautet:

```text
packages/shared
= CardDefinition / Katalog / Deckbau / Anzeige

packages/engine/src/card-implementations
= konkrete Kartenimplementationen nach Set/Side/Kartentyp/Kartenidentität

packages/engine/src/ability-engine
= generische Ability-/Effect-/Modifier-/Interpreter-Bibliothek

apps/web/app/chronicle.ts
= Chronikformatierung aus Event-Kontext + resolvedEffects

packages/engine/src/index.ts
= Koordination von LegalActions, Kosten, Zonenbewegung, Revalidation und Legacy-Resten
```

`packages/shared/src/index.ts` bleibt Katalog-, Deckbau- und Anzeigequelle. Neue ausführbare Ability-/Effect-/Modifier-Implementation wird nicht in normalen `CardDefinition`s abgelegt.

`packages/engine/src/card-implementations` enthält die konkrete 1:1-Umsetzung einzelner Karten. Eine Datei beschreibt genau eine Karte, nennt `cardDefinitionId` und enthält einen `// card name:` / `// text:`-Kommentar mit gedrucktem Kartentext.

`packages/engine/src/ability-engine` enthält die generische Sprache und Ausführungsschicht. Neue POC-Bausteine wie `gain_credits`, `draw_cards`, `rez_cost`, `install_cost`, `ice_strength` und `additional_subroutine` werden dort typisiert, abgefragt oder interpretiert. Die generischen Pipelines sollen keine neuen konkreten Karten-IDs für migrierte Karten enthalten.

`apps/web/app/chronicle.ts` formatiert Chronikzeilen aus Event-Kontext und `ResolvedGameEffect`s. CardImplementation-Karten sollen mit Kartenbezug dargestellt werden, nicht als isolierter Effekt.

`packages/engine/src/index.ts` bleibt aktuell Orchestrierungspunkt für Play-/Install-/Rez-/Encounter-Actions und enthält weiterhin Legacy-Sonderfälle. Das ist kein Zielbild für neue Kartenlogik. Neue Karten sollen, wenn möglich, über `CardImplementationDefinition` plus Ability-Engine-Bausteine umgesetzt werden.

## 2. Nicht mehr erwünschte Muster

Diese Muster sollen in neuen Migrationen vermieden werden:

- Mechanik-Sammeldateien wie `simple-gain-credits.ts`, `simple-draw-cards.ts`, `mixed-effects.ts` oder `rez-cost-modifiers.ts`
- neue Engine-Sonderfälle in `index.ts`, wenn eine `CardImplementationDefinition` möglich ist
- konkrete Karten-IDs in generischen Ability-, Effect-, Cost-, Modifier- oder Subroutine-Pipelines
- `CardImplementationDefinition`s mit Callbacks, Resolver-Funktionen oder direkter State-Mutation
- ausführbare Engine-Logik in `packages/shared/src/index.ts`
- Chroniktexte in Kartendateien
- Chronikzeilen ohne Kartenbezug, zum Beispiel nur "Runner erhält 3 Credits"
- doppelte Wirkung durch Legacy-Resolver plus neue CardImplementation
- doppelte Chronik durch Payload-Fallback plus `ResolvedGameEffect`-Formatierung

## 3. Vollständig implementierte Karten

### On-play gain

- Accounts Receivable: `on_play`, `costs: "printed"`, `gain_credits 9`
- Efficiency Experts: `on_play`, `costs: "printed"`, `gain_credits 3`
- Livewire's Contacts: `on_play`, `costs: "printed"`, `gain_credits 3`
- Score!: `on_play`, `costs: "printed"`, `gain_credits 9`

### On-play draw

- Annual Reviews: `on_play`, `costs: "printed"`, `draw_cards 3`
- Bodyweight Synthetic Blood: `on_play`, `costs: "printed"`, `draw_cards 5`
- Jack 'n' Joe: `on_play`, `costs: "printed"`, `draw_cards 3`

### Mixed ordered effects

- Day Shift: `draw_cards 2`, then `gain_credits 1`
- Night Shift: `gain_credits 2`, then `draw_cards 1`

Die Reihenfolge ist die Reihenfolge der `effects`-Liste und bleibt im `resolvedEffects`-Array erhalten.

### Activated abilities

- Newsgroup Filter: `activated_card_ability`, `runner_main`, eine Aktion, `gain_credits 2`
- ESA Contract: `activated_card_ability`, `corp_main`, eine Aktion, `draw_cards 2`

Der ActionType ist bewusst neutral: `activated_card_ability`, nicht `gain_credit`.

### Passive modifier cards

- Data Masons: `rez_cost` reduce 2 für Walls, `ice_strength` increase 1 für Walls
- Encoder, Inc.: `rez_cost` reduce 1 für Code Gates, `additional_subroutine` public `end_the_run` after existing für Code Gates
- Skälderviken SA Beta Test Site: `rez_cost` reduce 2 für Black ICE
- Fortress Architects: `install_cost` reduce 1 für Corp-ICE-Installation

## 4. Partial und Legacy

### Partial

- Jerusalem City Grid
  - implemented: `rez_cost` reduce 2 für Walls auf demselben Fort
  - implemented: `ice_strength` increase 1 für Walls auf demselben Fort
  - offen: Region-Install-/Replacement-Regeln

### Legacy / anderer Scope

- Olivia Salazar: Legacy-Sonderfall. Später als Ability mit Timing, Source-Validation, once-per-run und temporary derez modellieren.
- Startup Immolator: Legacy-Sonderfall. Später möglicher Trigger-/pass-ice-Pilot.
- Loan from Chiba: Legacy-Sonderfall. Später eventuell `on_install`, `start_of_turn`, `leave_play`, lose-game condition und optionale Trash-/Lifecycle-Effekte.
- Corporate Negotiating Center: Legacy-/Reveal-/Chronik-Scope.
- Restrictive Net Zoning: Legacy-/Target-Binding-Scope.
- MRAM / Militech MRAM: Legacy-/ActiveModifier-Query-Stand für Handgrößenmodifier.
- Krash / Virizz: Legacy-/ActiveModifier-Query-Stand für Run- bzw. Breakkostenmodifier. Diese Query-Rekonstruktion ist Übergang, nicht finales Ability-Engine-Zielbild.

## 5. Bestehende generische Bausteine

Aktuell vorhanden:

- `CardImplementationDefinition`
- `CardAbilityImplementation`
- `OnPlayCardAbilityImplementation`
- `ActivatedCardAbilityImplementation`
- `CardAbilityCostImplementation`
- `CardEffectImplementation`
- `GainCreditsEffectImplementation`
- `DrawCardsEffectImplementation`
- `CardRezCostModifierImplementation`
- `CardInstallCostModifierImplementation`
- `CardIceStrengthModifierImplementation`
- `CardAdditionalSubroutineModifierImplementation`
- `CardSubroutineImplementation`
- `executeCardImplementationEffects`
- CardImplementation-Registry
- CardImplementation-Coverage
- gemeinsame Modifier-Query-Helfer in `card-implementation-modifiers.ts`
- Cost-Pipeline-Anbindung für `rez_cost` und `install_cost`
- ICE-Strength-Auswertung für `ice_strength`
- Additional-Subroutine-Auswertung für `additional_subroutine`
- Play-Pfad-Anbindung für `on_play` + `costs: "printed"`
- Activated-Ability-Anbindung für `activated_card_ability`
- `ResolvedGameEffect`s mit `sourceDefinitionId` und `sourceTitle`
- Chronikformatierung für `card_resolver`-Effects mit Kartenbezug

`executeCardImplementationEffects` interpretiert aktuell `gain_credits` und `draw_cards`. `draw_cards` nutzt eine Engine-Host-Primitive, damit bestehende Draw-Nebenwirkungen erhalten bleiben und keine gezogenen Kartenidentitäten öffentlich leaken.

`additional_subroutine` unterstützt aktuell nur öffentliche `end_the_run`-Subroutinen mit `append: "after_existing"`. Dynamische Subroutinen tragen intern eine Attribution mit `sourceCardInstanceId`; öffentliche IDs und Payloads verwenden redigierte Source-Informationen ohne Instance-ID.

## 6. Regeln für neue Kartenmigrationen

Für neue CardImplementation-Migrationen gelten diese Regeln:

- Jede migrierte Karte bekommt eine konkrete Datei nach `set / side / card type / card identity`.
- Jede Kartendatei beschreibt genau eine Karte.
- Jede Kartendatei enthält `// card name:` und `// text:` als Review-Hilfe.
- Eine Karte beschreibt ihre Engine-Wirkung deklarativ über Abilities, Effects oder Modifiers.
- `CardImplementationDefinition`s bleiben callback-frei.
- Die Ability Engine interpretiert generisch und kennt keine konkrete Karte.
- Gedruckte Kosten werden nicht in der Implementation dupliziert; `costs: "printed"` verweist auf die normale `CardDefinition`.
- Keine ausführbare Engine-Logik in Shared/CardDefinition.
- Bestehende PublicPayload-Felder bleiben kompatibel, solange Web, Replay oder Tests sie nutzen.
- `ResolvedGameEffect`s sind die strukturierte Grundlage für Chronik, AI und spätere PublicEvent-Auswertung.
- Chronik muss den Kartenbezug enthalten.
- Hidden-Info-Leaks müssen explizit getestet werden, besonders bei Draw, Reveal, Search und dynamischen Quellen.
- CardImplementation-Coverage muss aktualisiert werden.
- Alte Resolver müssen entfernt oder sauber umgangen werden, damit keine Doppeleffekte entstehen.
- Registry- und Coverage-Konsistenztests müssen doppelte IDs und fehlende Coverage sichtbar machen.
- Neue Mechanik nur als kleiner POC mit fokussierten Tests.

## 7. Known Risks und Follow-ups

- Legacy-Reste in `ability-engine`: Virizz wird noch in `active-modifiers.ts` rekonstruiert; Olivia Salazar hängt noch an `cost-pipeline.ts` und `index.ts`.
- Registry-Duplicate-Schutz ist aktuell testbasiert; später ist ein Runtime-/Build-Time-Guard beim Registry-Aufbau sinnvoll.
- Corp-ICE-Installkostenquote ist in der Cost-Pipeline gebündelt, aber die vollständige Install-Action-Revalidation bleibt vorerst in `index.ts`, weil die Install-Action selbst dort orchestriert wird.
- Dynamische Subroutine-Attribution ist vorbereitet, aber die Chronik nutzt die Modifier-Quelle noch nicht vollständig als Satzbestandteil.
- `additional_subroutine` unterstützt aktuell nur public `end_the_run` after existing.
- `card-implementation-modifiers.ts` ist bewusst auf rezzed Corp-Root-Modifier zugeschnitten.
- Region-Regeln sind noch nicht modelliert.
- Trigger Registry ist noch nicht produktiv.
- Target Binding ist noch nicht ausgebaut.
- ActiveModifier ist noch kein vollständiges produktives Zielsystem für neue CardImplementation-Modifier.
- `index.ts` bleibt ein großer Legacy-Orchestrator und sollte nicht weiter mit vermeidbaren Karten-Sonderfällen wachsen.

## 8. Nächste sinnvolle Optionen

Option A: Region-Regeln für Jerusalem City Grid.

- Vorteil: macht eine `partial_implementation` vollständig.
- Risiko: Server-/Region-Installregeln, Replacement und Trash older region berühren Target-/Install-/Replacement-Grenzen.

Option B: Olivia Salazar.

- Vorteil: wichtiger Legacy-Fall im Rez-Kostenbereich.
- Risiko: Timing, Source-Validation, once-per-run und temporary derez sind komplexer als passive Modifier.

Option C: Startup Immolator.

- Vorteil: guter Trigger-/pass-ice-Pilot.
- Risiko: Timing windows, vollständig gebrochene Subroutinen, Ziel-ICE und Rez-Kostenbezug.

Option D: Loan from Chiba.

- Vorteil: deckt Lifecycle-Fähigkeiten wie `on_install`, `start_of_turn` und `leave_play` ab.
- Risiko: mehrere Trigger/Lifecycle-Effekte, lose-game condition und optionale Trash-/State-Regeln.

Option E: weiterer einfacher activated/on-play Effect-Baustein.

- Vorteil: niedriges Risiko und gute Wiederholung des bestehenden Musters.
- Risiko: bringt weniger neue Architekturfläche.

Option F: additional_subroutine-Folgekarte.

- Vorteil: nutzt den neuen Baustein und testet dynamische Subroutine-Attribution weiter.
- Risiko: Tesseract/Tutor haben komplexere Semantik als Encoder, Inc. und können schnell neue Subroutine-Arten oder Trigger brauchen.

## 9. Tests und Qualitätssicherung

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
- Tests für stale LegalActions bei Kosten-, Timing-, Source- und dynamischer Subroutine-Revalidation
- Replay- und StateHash-Checks, wenn produktive Resolve-Pfade betroffen sind

## 10. Aktuelle Arbeitsregel für Folge-Threads

Folge-Threads sollen den Nettozustand dieses Branches als gültige Zwischenarchitektur behandeln. Neue Migrationen sollen die Schichtgrenze respektieren und lieber klein bleiben als zusätzliche generische Pipeline-Sonderfälle einzuführen.
