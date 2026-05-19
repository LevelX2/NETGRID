# V1 CardImplementation Master Plan

Stand: 2026-05-19, nach P2.13a und Dokumentationsupdate.

Dieses Dokument ist der zentrale Plan für die Migration des vollständigen Originalset-V1-Kartenpools auf die engine-lokale NETGRID-CardImplementation-Architektur. Es ist ein Planungsartefakt, keine Umsetzungsfreigabe für alle Karten gleichzeitig.

## 1. Architekturgrenze

```text
packages/shared
= CardDefinition / Katalog / Deckbau / Anzeige

packages/engine/src/card-implementations
= konkrete Kartenimplementationen nach Set/Side/Kartentyp/Kartenidentität

packages/engine/src/ability-engine
= generische Ability-/Effect-/Modifier-/Trigger-/Condition-/Target-Bibliothek und Interpreter

apps/web/app/chronicle.ts
= Chronikformatierung aus Event-Kontext und ResolvedGameEffects

packages/engine/src/index.ts
= Orchestrierung und Legacy-Reste; nicht Zielbild für neue Kartenlogik
```

Die normale Shared-CardDefinition bleibt Katalog-, Deckbau- und Anzeigequelle. Ausführbare Kartenlogik gehört nicht in `packages/shared/src/index.ts`. Konkrete Karten-IDs sind in CardImplementation-Dateien, Tests, Coverage und Registry erlaubt; generische Ability-/Effect-/Cost-/Modifier-Pipelines sollen keine dauerhaften Karten-Sonderfälle enthalten.

## 2. Quellenbasis

Gelesene lokale Quellen:

- `docs/architecture/ability-engine/card-definition-ability-dsl-target-architecture.md`
- `docs/architecture/ability-engine/card-implementation-tranche-status.md`
- `data/cards/originalset-v1-cards.json`
- `docs/source/Runnerspoiler 1.0.txt`
- `docs/source/Corpspoiler 1.0.txt`
- `packages/engine/src/card-implementations/`
- `packages/engine/src/ability-engine/`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `apps/web/app/chronicle.ts`
- `apps/web/app/chronicle.test.ts`

Die Inventartabelle in `card-implementation-v1-card-inventory.md` umfasst alle 374 Karten. IDs und project-normalisierte Typdaten stammen aus `data/cards/originalset-v1-cards.json`; die Printed-Text-Spalte und die geprüften Zahlenwerte sind gegen die Originalspoiler unter `docs/source/` validiert. Bei Widersprüchen zwischen JSON-Text und Spoilertext ist der Spoilertext im Inventory maßgeblich und der Fall im Validierungsbefund dokumentiert.

## 3. Umfang und Statusverteilung

| Status | Anzahl | Bedeutung |
|---|---:|---|
| implemented | 15 | Vollständige aktuell relevante Kartenwirkung ist über CardImplementationDefinition abgebildet. |
| partial_implementation | 1 | Eine echte CardImplementationDefinition bildet einen klar benannten Teil ab; offene gedruckte Textteile sind dokumentiert. |
| legacy_engine_special_case | 9 | Die Karte läuft noch über alte Engine-Sonderlogik oder alte Modifier-Rekonstruktion. |
| pending_implementation | 349 | Karte ist bekannt, aber noch nicht belastbar in CardImplementation-Architektur eingeordnet. |
| no_engine_behavior_required | 0 | Derzeit keine Karte so markiert; dieser Status braucht immer explizite Begründung. |

Kartentypverteilung:

| Side / Type | Anzahl |
|---|---:|
| corp/agenda | 33 |
| corp/asset | 41 |
| corp/ice | 60 |
| corp/operation | 27 |
| corp/upgrade | 26 |
| runner/event | 43 |
| runner/hardware | 21 |
| runner/hardware-chip | 2 |
| runner/hardware-deck | 6 |
| runner/program | 75 |
| runner/resource | 40 |

## 4. Vollständig umgestellte Karten

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

### Activated abilities

- Newsgroup Filter: `activated_card_ability`, `runner_main`, action cost 1, `gain_credits 2`
- ESA Contract: `activated_card_ability`, `corp_main`, action cost 1, `draw_cards 2`

### Passive modifier cards

- Data Masons: `rez_cost` reduce 2 for Walls; `ice_strength` increase 1 for Walls
- Encoder, Inc.: `rez_cost` reduce 1 for Code Gates; `additional_subroutine` public ETR after existing for Code Gates
- Skälderviken SA Beta Test Site: `rez_cost` reduce 2 for Black ICE
- Fortress Architects: `install_cost` reduce 1 for Corp ICE installation

## 5. Partial und Legacy

- Jerusalem City Grid bleibt `partial_implementation`: implemented sind `rez_cost` reduce 2 und `ice_strength` increase 1 für Walls auf demselben Fort; offen bleiben Region-Regeln.
- Olivia Salazar bleibt Legacy: Timing, Source-Validation, once-per-run, temporary derez.
- Startup Immolator bleibt Legacy: pass-ice trigger, fully-broken condition, ICE target, dynamic cost.
- Loan from Chiba bleibt Legacy: on-install/start-of-turn/leave-play/loss-condition lifecycle.
- Corporate Negotiating Center bleibt Legacy/Reveal-Scope.
- Restrictive Net Zoning bleibt Legacy/Target-Binding-Scope.
- MRAM / Militech MRAM bleiben Hand-size ActiveModifier/Shared-Legacy.
- Krash / Virizz bleiben run-duration ActiveModifier-Legacy.

## 6. Wiederkehrende Architektur-Pattern

Der ausführliche Pattern-Katalog steht in `card-implementation-v1-pattern-catalog.md`. Die wichtigsten Familien sind simple `on_play` effects, activated abilities, passive modifiers, triggered abilities, counters/hosted credits, run/access replacement, ICE/subroutines und Region/server-scoped effects.

## 7. Zielbild pro Karte

Das Detailinventar steht in `card-implementation-v1-card-inventory.md`. Für jede V1-Karte sind dort CardDefinitionId, Name, Side/Type/Subtypes, gedruckter Text, relevante Zahlen, aktueller Status, Implementierungsort, Ziel-CardImplementation, vorhandene und fehlende Primitive, Migrationswelle, Risiko und Testplan festgehalten.

## 8. Migrationsstrategie

Die Wellen stehen in `card-implementation-v1-migration-waves.md`. Kurzfassung:

- Welle 0: bestehende Tranche stabilisieren.
- Welle 1: weitere einfache on_play Karten.
- Welle 2: weitere activated abilities.
- Welle 3: passive Modifier-Familien.
- Welle 4: lifecycle and timing triggers.
- Welle 5: run/access replacement.
- Welle 6: ICE/subroutine system.
- Welle 7: reveal/expose/search/hidden info.
- Welle 8: target binding and server-scoped state.
- Welle 9: region/replacement rules.
- Welle 10: high-complexity cards.

## 9. Top-10 nächste POC-Kandidaten

1. Jerusalem City Grid Region-Regeln: macht den letzten partial passive-modifier-Fall vollständig; Risiko Server-/Region-Replacement.
2. Olivia Salazar: wichtiger Rez-Fenster-Legacy-Fall; Risiko Timing, once-per-run, temporary derez.
3. Startup Immolator: guter pass_ice/target/cost POC; Risiko Timing und fully-broken condition.
4. Loan from Chiba: Lifecycle-Pilot; Risiko mehrere Trigger plus lose-game condition.
5. Corporate Negotiating Center: Hidden-Info-/Reveal-Pilot; Risiko PublicPayload/Chronik-Redaktion.
6. Restrictive Net Zoning: Target-Binding-/server-scoped-modifier-Pilot; Risiko persistent target and server labels.
7. MRAM / Militech MRAM: passive hand_size modifier; Risiko Shared-Feld-Migration und ActiveModifier-Grenze.
8. Krash / Virizz: run-duration modifier migration; Risiko duration cleanup and break-cost/strength semantics.
9. Tesseract Fort Construction / Tutor: additional_subroutine Folgekarte; Risiko komplexere Subroutine-Semantik als Encoder, Inc.
10. Eine einfache pending Prep/Operation mit nur `lose_credits`, tag oder damage: niedriger Scope für neuen Effect-Pilot, falls Text eindeutig ist.

## 10. Coverage-Zielbild

- Keine V1-Karte ohne Coverage-Eintrag.
- Jede CardImplementationDefinition braucht `implemented` oder `partial_implementation`.
- `partial_implementation` muss fehlende gedruckte Textteile nennen.
- `legacy_engine_special_case` muss aktuellen Implementierungsort nennen.
- `pending_implementation` muss Grund nennen oder aus Default-Status kommen, bis eine Karte bewusst eingeordnet wird.
- `no_engine_behavior_required` nur mit sicherer Begründung.

## 11. Bekannte Risiken

- Legacy-Reste in `index.ts` und `active-modifiers.ts`.
- Olivia-Sonderlogik in `cost-pipeline.ts`.
- Registry-Duplicate-Schutz ist testbasiert.
- Install-Action-Revalidation bleibt teilweise in `index.ts`.
- Region-Regeln, Trigger Registry, Target Binding und Reveal/Search sind noch nicht final.
- `additional_subroutine` ist aktuell bewusst auf public ETR after_existing begrenzt.
- `card-implementation-modifiers.ts` ist bewusst auf rezzed Corp-Root-Modifier zugeschnitten.
- Hidden-Info bei reveal/search/random braucht eigene Guards.
- AI-Auswertung braucht langfristig typisierte Kosten, Ziele und Effekte.

## 12. Regeln für Folge-Threads

- Zuerst Zielbilddokument und dieses Masterplan-Dokument lesen.
- Zuerst Coverage und Registry prüfen.
- Keine neue Kartenlogik in `index.ts`, wenn CardImplementation möglich ist.
- Keine Mechanik-Sammeldateien.
- Eine konkrete Datei pro Karte nach Set/Side/Kartentyp/Kartenidentität.
- `// card name:` und `// text:` Kommentare bleiben Pflicht.
- CardImplementationDefinitions bleiben deklarativ und callback-frei.
- Keine ausführbare Engine-Logik in Shared/CardDefinition.
- Keine konkreten Karten-IDs in generischen Ability-/Cost-/Modifier-Pipelines.
- Bei Unsicherheit `partial_implementation` oder `pending_implementation`, nicht falsches `implemented`.
- Tests vor und nach Migration, inklusive Hidden-Info und Doppeleffekt-Guards.


## Validierungsbefund / Korrekturen 2026-05-19

Die V1-Planungsbasis wurde gegen die Originalspoiler validiert. Das Inventory enthält weiterhin 374 Karten (187 Runner, 187 Corp) und hat für alle Karten einen Titel+Side-Match in den Spoilerquellen. Gegenüber der JSON-/vorherigen Inventory-Fassung wurden 204 Printed-Text-Zellen, 14 Zahlen-/Kosten-/Strength-/Difficulty-/Trash-Zellen und 349 Target-/Primitive-/Wave-/Risk-/Testplan-Zuordnungen korrigiert.

Kritische bereinigte Fälle sind Butcher Boy, R&D-Protocol Files, Chester Mix und Encoder, Inc. Die Korrekturen betreffen die Planungsgrundlage; Produktionscode, CardDefinitions, Coverage-Code und Tests wurden nicht geändert.
