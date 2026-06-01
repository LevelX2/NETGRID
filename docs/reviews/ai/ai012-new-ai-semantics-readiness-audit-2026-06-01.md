# AI012 New AI Semantics Readiness Audit

Aufgabe-ID: AI012

## Kurzfazit

Der Zielpfad ist fachlich tragfähig, aber noch nicht umsetzungsbereit für
Legacy-Entfernung oder Planner-Umschaltung.

- Der AI Hint Inspector ist für die Karten-Hauptansicht weitgehend auf das neue
  Zielmodell reduziert: mechanische Facts, Function-Signals, Strategy Anchors,
  `lineSupport`, `strategicRole`, Quality und kompakte Prüfpunkte stehen offen;
  `roles`, `planRoles`, Legacy-Klassifikationen und Rohkontext liegen im
  geschlossenen Entwicklerbereich.
- Der DeckDoctrine Strategy Viewer ist noch nicht auf das Zielmodell reduziert:
  `Legacy-Signal-Counts` sind eine normale sichtbare Sektion, obwohl sie keine
  neue Semantik und keine Planner-Freigabe darstellen.
- Die Function-Signal-Ableitung liest aktuell keine `roles`, `planRoles`,
  `valueHints` oder `lineSupport`. Sie leitet 51 Signale über 57 Regeln aus
  strukturierten Feldern ab: 39 Regeln aus `effects`, 9 aus
  `breakerProfile.coverage` und 9 aus `remoteRole`.
- Der direkte Pfad aus CardImplementation/Card Definition ist aber noch kein
  finaler Descriptor-Vertrag. Der Full-Derived-Facts-Lauf ist ein read-only
  Text-/Descriptor-Scan: 527/564 Implementations vorhanden, 388 Karten mit
  Generated Facts, 139 Legacy-Fallback-only-Karten und 37 fehlende
  Implementations.
- Runtimewirksam bleiben vor allem die alten Rollenpfade: `card-role-manifest`,
  `roles`, `planRoles` und daraus gebaute `ownDeckDoctrine.planWeights`.
  Gleichzeitig sind einzelne neue strukturierte Felder bereits runtimewirksam,
  insbesondere `breakerProfile`/`costProfile`, `remoteRole` plus Run-Tax-Effekte
  sowie `effects`/`conditions` für Tag/Punish und scored-agenda-Ontologie.

## Ausgangslage

AI003 bis AI012 haben die KI-Semantik in Richtung strukturierter, read-only
Mechanik- und Strategiediagnose verschoben.

Führender Datenstand am 2026-06-01:

| Artefakt                       |                                                                                                       Stand |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------: |
| Aktive AI-Hints                |                                                                                                  564 Karten |
| Compiled AI-Hints              |                                                                                                  564 Karten |
| Aktive `roles`                 |                                                                       564 Karten, 251 Werte, 1621 Vorkommen |
| Aktive `planRoles`             |                                                                        564 Karten, 102 Werte, 977 Vorkommen |
| Aktive normierte `lineSupport` |                                                                         189 Karten, 15 Werte, 234 Vorkommen |
| Aktive `strategicRole`         |                                                                                                  189 Karten |
| Compiled mechanische Facts     | 376 `effects`, 271 `conditions`, 69 `costProfile`, 42 `breakerProfile`, 53 `remoteRole`, 3 `targetProfiles` |
| Inspector Function-Signals     |                                                                                                  330 Karten |
| Inspector Strategy Anchors     |                                                                                                  226 Karten |

AI012 prüft nur Readiness. Es wurden keine Hinweise migriert, keine
Planner-Pfade umgestellt und keine UI- oder Runtime-Datei geändert.

## Pipeline-Iststand

### Daten direkt aus CardImplementation/Card Definition

Der direkte Ableitungspfad ist:

1. `scripts/check-ai-derived-facts-full.mjs` baut ein Full-Inventar aus allen
   aktiven Hints und scannt CardImplementation-Dateien unter
   `packages/engine/src/card-implementations/onr-v1` und
   `packages/engine/src/card-implementations/proteus`.
2. `scripts/check-ai-derived-facts.mjs` liest den Implementation-Text und
   erzeugt `derivedFacts` als read-only Analyse. Die Quelle ist ausdrücklich
   kein Runtime- oder LegalAction-Pfad.
3. `scripts/build-ai-compiled-hints.mjs` merged `data/ai/ai-card-hints-active.json`
   mit Generated Facts und optionalen Overlays zu
   `data/ai/ai-card-hints-compiled.json`.
4. `scripts/check-ai-strategy-taxonomy.mjs` validiert Strategieziele,
   `lineSupport`, `strategicRole` und Function-Signal-Regeln.
5. `scripts/build-ai-hint-inspector-index.mjs` baut den UI-/Diagnoseindex
   `data/ai/ai-hint-inspector-index.json`.
6. `packages/ai/src/deck-doctrine-strategy.ts` nutzt compiled Hints und
   Inspector Index für das diagnostische DeckStrategyProfile.

Der direkte Ableitungspfad erzeugt heute vor allem:

- `effects`
- `conditions`
- `costProfile`
- `breakerProfile`
- `remoteRole`
- `targetProfiles`

Der Full-Coverage-Report weist aus:

| Messpunkt                  | Wert |
| -------------------------- | ---: |
| Aktive Hints im Scope      |  564 |
| Implementations gefunden   |  527 |
| Karten mit Generated Facts |  388 |
| Generated plus Overlay     |    6 |
| Generated clean            |   60 |
| Descriptor-/Schema-Gaps    |  322 |
| Legacy-Fallback-only       |  139 |
| Fehlende Implementations   |   37 |
| Hard Errors                |    0 |

Wichtig: Der Inspector meldet `generatedFactsFound` nur, wenn compiled Felder
gegenüber active/overlay sichtbar hinzugekommen sind. Der Full-Report meldet
dagegen alle aus Implementations ableitbaren Facts. Darum sind die Zähler nicht
identisch.

### Felder in `ai-card-hints-compiled.json`

`ai-card-hints-compiled.json` enthält weiterhin den kompletten aktiven
Kompatibilitätsbestand plus neue mechanische Felder:

- Legacy-/Kompatibilitätsfelder: `roles`, `planRoles`, `valueHints`,
  `requiredMechanics`, `riskTags`, `scenarioRefs`.
- Neue strukturierte Felder: `effects`, `conditions`, `costProfile`,
  `breakerProfile`, `remoteRole`, `targetProfiles`, `lineSupport`,
  `strategicRole`, `quality`.
- Quelle laut Artefakt:
  `full active legacy hints plus generated mechanical facts plus optional manual overlays; hints do not create LegalActions`.

Feldherkunft:

| Feld             | Active Karten | Generated Karten | Compiled Karten | Active-only ohne Generated |
| ---------------- | ------------: | ---------------: | --------------: | -------------------------: |
| `effects`        |           162 |              370 |             376 |                          6 |
| `conditions`     |            86 |              266 |             271 |                          5 |
| `costProfile`    |            69 |                5 |              69 |                         68 |
| `breakerProfile` |            20 |               42 |              42 |                          0 |
| `remoteRole`     |            17 |               53 |              53 |                          0 |
| `targetProfiles` |             0 |                3 |               3 |                          0 |

`costProfile` ist damit der größte strukturierte Active-only-Bestand. Es ist
nicht Legacy im Sinne von `roles`, aber noch nicht ausreichend direkt aus
CardImplementation/Card Definition abgeleitet.

### Function-Signals

Die aktuelle Function-Signal-Ableitung ist formal sauber getrennt:

| Quelle                    | Regeln |
| ------------------------- | -----: |
| `effects`                 |     39 |
| `breakerProfile.coverage` |      9 |
| `remoteRole`              |      9 |

Nicht als Function-Signal-Quelle verwendet:

- `roles`
- `planRoles`
- `valueHints`
- `lineSupport`
- `requiredMechanics`
- `riskTags`
- `scenarioRefs`
- `quality`
- `conditions`
- `costProfile`
- `targetProfiles`

Offene Descriptor-Gaps aus dem Function-Signal-Vertrag:

| Gap                                               | Karten | Beispiele                                                                                               |
| ------------------------------------------------- | -----: | ------------------------------------------------------------------------------------------------------- |
| `remote_contest_pressure_not_first_class`         |     17 | `onr_v1_018_dogcatcher`, `onr_v1_019_dropp`, `onr_v1_042_mouse`                                         |
| `interface_closeout_density_requires_aggregation` |      8 | `onr_v1_032_i-spy`, `onr_v1_043_mystery-box`, `onr_v1_050_r-and-d-protocol-files`                       |
| `cheap_ice_and_rush_shape_partial`                |      3 | `onr_v1_349_aardvark`, `onr_v1_351_bizarre-encryption-scheme`, `onr_v1_370_tesseract-fort-construction` |

### Strategy Anchors

Strategy Anchors entstehen heute aus drei neuen Quellen und einer
Kompatibilitätszählung:

| Quelle                                        | Heute genutzt?         | Wirkung                                                                     |
| --------------------------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| `derivedStrategyAnchors` aus Function-Signals | ja                     | Diagnose und DeckStrategyProfile                                            |
| normierter `lineSupport`                      | ja                     | Diagnose und DeckStrategyProfile-Anchor-Evidence                            |
| `strategicRole`                               | ja, verstärkend        | DeckStrategyProfile stärkt nur vorhandene Anchor/lineSupport-Evidence       |
| Legacy `roles`/`planRoles`                    | nicht als neuer Anchor | werden nur als `legacySignalCounts` gezählt; alte Runtime nutzt sie separat |

Aktive und compiled Hints enthalten aktuell keine Legacy-`lineSupport`-Werte
mehr. Alle 234 `lineSupport`-Vorkommen im Inspector sind
`normalized_strategy_id`.

## Legacy-Abhängigkeiten

| Legacy-Feld                                    | Heute angezeigt?                                                                   | Heute runtimewirksam?                                                                    | Consumer                                                                                      | Ersatz durch neue Semantik vorhanden?                                                                               | Kann in UI ausgeblendet werden?                                 | Kann später aus Runtime weg?                      | Risiko  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------- | ------- |
| `roles`                                        | ja, Inspector-Entwicklerdetails, Legacy-Fallback-Panel, DeckStrategy Legacy Counts | ja                                                                                       | `buildDeckDoctrineProfile`, `rolesForCardId`, `rolesForAction`, Runner-/Corp-Planner, Reports | teilweise: Function-Signals und strukturierte Facts ersetzen viele Bedeutungen, aber nicht alle Planner-Heuristiken | ja, Hauptansicht; Debug behalten                                | ja, erst nach Planner-/Doctrine-Ersatz            | hoch    |
| `planRoles`                                    | ja, wie `roles`                                                                    | ja                                                                                       | `buildDeckDoctrineProfile`, `ownDeckDoctrine.planWeights`, Runner-/Corp-Planner               | teilweise; neue StrategyProfile-Werte sind diagnostisch, nicht runtimewirksam                                       | ja, Hauptansicht; Debug behalten                                | ja, erst nach PlanWeight-/Planner-Ersatz          | hoch    |
| Legacy-`lineSupport`                           | Code unterstützt Anzeige/Klassifikation, aktueller Datenstand 0 Legacy-Werte       | nein im aktuellen Planner; diagnostisches `lineSupport` nutzt nur normierte Strategy-IDs | Inspector, Taxonomy, DeckStrategyProfile                                                      | ja: normierte Strategy-IDs                                                                                          | ja, bereits aus Hauptansicht ferngehalten, falls nicht normiert | praktisch ja; Alias-Code erst nach Gate entfernen | niedrig |
| Alias-/Migrationsklassifikationen              | ja, Entwicklerdetails und Reports                                                  | nein                                                                                     | `check-ai-strategy-taxonomy`, Inspector Index                                                 | ja, durch normierte IDs und Function-Signals                                                                        | ja, nur Debug/Migration                                         | ja, nach Abschluss der Migration                  | niedrig |
| `valueHints`                                   | ja, alter Fallback und Entwicklerdetails                                           | keine direkte Planner-Verbrauchsstelle gefunden                                          | UI, Taxonomie-/Overlay-/Qualitätschecks                                                       | teilweise durch `effects`, `costProfile`, `remoteRole`                                                              | ja                                                              | ja, nach Report-/Check-Umstellung                 | mittel  |
| `requiredMechanics`                            | ja, Entwicklerdetails und alter Fallback                                           | nicht im aktuellen Planner; diagnostisch in DeckStrategyProfile für Memory/Hand-size     | UI, DeckStrategyProfile, Checks                                                               | teilweise durch mechanische Facts                                                                                   | ja, Hauptansicht; Debug behalten                                | ja, nach Diagnoseersatz                           | mittel  |
| `riskTags`                                     | ja, Entwicklerdetails und alter Fallback                                           | nicht im aktuellen Planner; diagnostisch für Risky-Economy im DeckStrategyProfile        | UI, DeckStrategyProfile, Checks                                                               | teilweise durch `costProfile.reserveRisk` und Effects                                                               | ja, Hauptansicht; Debug behalten                                | ja, nach Diagnoseersatz                           | mittel  |
| `scenarioRefs`                                 | ja, Entwicklerdetails und alter Fallback                                           | nein                                                                                     | Approval Consistency, UI                                                                      | kein semantischer Ersatz nötig; Evidence-/Gate-Feld                                                                 | ja                                                              | nicht dringend; eher Evidence behalten            | niedrig |
| `manualNotes`/`strategicNotes`                 | ja, Entwicklerdetails                                                              | nein                                                                                     | Overlay-/Compiled-Checks, UI                                                                  | durch Review-Artefakte oder Quality-Felder                                                                          | ja                                                              | ja, wenn Overlays anders dokumentieren            | niedrig |
| `legacyFallbackOnly`/Fallback-Klassifikationen | ja, Support/Hinweise und Reports                                                   | nicht selbst runtimewirksam, zeigt aber aktive Legacy-Abhängigkeit an                    | Inspector, DeckStrategy-Warnings, Derived-Facts-Reports                                       | ja, sobald Generated Facts/Descriptors vollständig sind                                                             | nur kompakt in Hauptansicht; Details Debug                      | ja, nach Coverage-Gate                            | mittel  |
| `data/ai/card-role-manifest-0.9.json`          | nicht prominent in UI                                                              | ja                                                                                       | `CARD_ROLES_BY_CARD`, `buildDeckDoctrineProfile`, `rolesForCardId`                            | nein, noch kein vollständiger Runtime-Ersatz                                                                        | UI nicht relevant                                               | ja, aber spät und nur mit Planner-Umstellung      | hoch    |

Trennung nach Zweck:

- Anzeige/Debug: Legacy-Fallback-Panel, Inspector-Entwicklerdetails,
  Taxonomie- und Migrationseinordnung.
- Reports/Checks: `check-ai-strategy-taxonomy`, `check-ai-hint-quality`,
  `check-ai-manual-overlays`, `check-ai-hint-compiled-index`.
- DeckDoctrine Runtime: `buildDeckDoctrineProfile` nutzt
  `card-role-manifest`, `roles`, `planRoles` und Inferenzrollen.
- Runner-/Corp-Planer: `rolesForAction` und `rolesForCardId` steuern weiterhin
  viele Aktionsheuristiken.
- Action-Scoring: alte Rollen und `ownDeckDoctrine.planWeights` fließen in
  Score-/Priority-Berechnungen; neue StrategyProfile-Werte sind dort noch nicht
  angeschlossen.

## Neue maßgebliche UI-Semantik

### Gewünschte Hauptansicht

Die fachliche Standardansicht sollte künftig genau diese Gruppen offen zeigen:

1. Mechanische Facts: `effects`, `conditions`, `costProfile`,
   `breakerProfile`, `remoteRole`, `targetProfiles`.
2. Taktiksignale / Function-Signals: aus Inspector Index oder derselben stabilen
   Ableitung.
3. Strategieanker: `derivedStrategyAnchors` und normierter `lineSupport`.
4. `strategicRole`: nur gültige kontrollierte Werte.
5. `quality`: nur vorhandene Quality-Felder.
6. Prüfpunkte: `descriptor_gap`, `deferred_requires_human_review`,
   `missing_compiled_hint`, invalid/hard problems und kompakter Legacy-Hinweis.

### AI Hint Inspector

Der Inspector kann die Trennung bereits weitgehend:

- `apps/web/app/api/cards/catalog-data.ts` baut ein ViewModel mit getrennten
  Gruppen: `mechanicalFacts`, `functionSignals`, `strategyAnchors`,
  `lineSupport`, `strategicRole`, `quality`, `legacyRoles` und `warnings`.
- `apps/web/app/ai-hint-inspector-ui.ts` rendert offene Sektionen
  `Supportstatus`, `Aktive KI-Semantik`, `Strategieanker` und
  `Hinweise / Prüfpunkte`.
- `Legacy / Entwicklerdetails anzeigen` ist standardmäßig geschlossen.
- Nicht-normalisierter `lineSupport` wird über `isActiveLineSupport` aus der
  aktiven Strategy-Anchor-Sektion herausgehalten.

Offene UI-Fragen:

- Der Supportstatus und die Hinweise zeigen noch sichtbare Legacy-Zähler. Das
  ist als Warnhinweis sinnvoll, muss aber textlich klarer als
  "noch Kompatibilität/Debug, nicht neue Semantik" markiert werden.
- Das alte `CatalogLegacyAiHintPanel` existiert weiterhin als Fallback, falls
  kein Inspector vorhanden ist. Im aktuellen 564er-Stand ist das praktisch kein
  Hauptpfad, aber der Folgeprompt sollte entscheiden, ob dieser Fallback weiter
  sichtbar bleibt.
- Die Anzeige sagt nicht bei jedem Feld, ob es runtimewirksam,
  diagnostisch-only oder nur Evidence ist.

### DeckDoctrine Strategy Viewer

Der DeckStrategy Viewer ist noch nicht auf die Ziel-Hauptansicht reduziert:

- `apps/web/app/api/decks/strategy-profile/strategy-profile-data.ts` baut
  `legacySignalGroups` aus `legacySignalCounts`.
- `apps/web/app/page.tsx` rendert `Legacy-Signal-Counts` als normale Sektion
  direkt nach `Function-Signal-Counts`.
- Das ist für Debug wertvoll, aber für die normale fachliche Ansicht zu
  prominent.

Empfehlung für den UI-Folgeprompt:

- Legacy-Signal-Counts in einen standardmäßig geschlossenen Debug-/Migration-
  Bereich verschieben.
- Pro Feldgruppe anzeigen, ob sie `runtimewirksam`, `diagnostisch` oder
  `Migration/Legacy` ist.
- Das alte `KI-Hinweise`-Fallback-Panel nur noch als expliziten
  Entwickler-/Migrationspfad verwenden.

## Direkte CardImplementation -> Function-Signal Ableitung

### Was heute direkt genug ist

Function-Signals entstehen aktuell nicht aus Legacy-Feldern, sondern aus
strukturierten compiled Hints. Für `breakerProfile` und `remoteRole` ist die
Pipeline bereits gut anschlussfähig:

- `breakerProfile`: 42 compiled Karten, 42 generated Karten, 0 active-only ohne
  Generated Facts.
- `remoteRole`: 53 compiled Karten, 53 generated Karten, 0 active-only ohne
  Generated Facts.
- `targetProfiles`: 3 compiled Karten, 3 generated Karten, aber derzeit keine
  Function-Signal-Regelquelle.

Für `effects`/`conditions` ist der Stand breit, aber noch mit kleinen
Active-only-Resten:

- `effects`: 376 compiled Karten, 370 generated Karten, 6 active-only ohne
  Generated Facts.
- `conditions`: 271 compiled Karten, 266 generated Karten, 5 active-only ohne
  Generated Facts.

### Was noch nicht direkt genug ist

- `costProfile` ist fast komplett active-only: 69 compiled Karten, aber nur 5
  generated Karten und 68 active-only ohne Generated Facts.
- Die Derivation ist noch ein text-/patternbasierter Scanner, kein stabiler
  exportierter CardImplementation-Descriptor-Vertrag.
- 139 Karten bleiben Legacy-Fallback-only.
- 37 aktive Hints haben keine Implementation im Full-Coverage-Pfad.
- 322 Karten haben Descriptor-/Schema-Gaps im Full-Report.
- Drei bekannte Funktionslücken sind nicht sauber per einzelner
  CardImplementation-Fact ableitbar: Remote-Contest-Intent, Cheap-ICE/Rush-Shape
  und Interface-Closeout-Density.

### Doppelte Wahrheit

Die gefährlichste doppelte Wahrheit liegt nicht in Function-Signals selbst,
sondern in parallelen Verbrauchspfaden:

- Function-Signals und StrategyProfile sagen neue Diagnose.
- Runtime-DeckDoctrine und Planner verwenden weiterhin `roles`/`planRoles` und
  `card-role-manifest`.
- Einzelne strukturierte Felder sind bereits runtimewirksam, aber nicht
  vollflächig. Dadurch kann die UI mehr semantische Reife suggerieren, als die
  aktuelle Action-Auswahl tatsächlich nutzt.

## Geprüfte Annahmen

| Annahme                                                                                                 | Bewertung           | Begründung / Entscheidungsbedarf                                                                                               |
| ------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| A: Normale Economy, Breaker, Draw/Search/Setup brauchen keinen `lineSupport`, sondern Function-Signals. | bestätigt           | AI009 bis AI012 folgen dieser Grenze; Function-Signals decken Economy, Setup, Breaker und Access-Signale ab.                   |
| B: `lineSupport` ist nur für echte Strategieanker, Payoffs, Engines oder klare Strategiebelege.         | bestätigt           | Aktueller Bestand enthält nur normierte Strategy-IDs; normale Supportkarten wurden bewusst nicht pauschal verankert.           |
| C: `strategicRole` ist optional und nur bei klarer Rolle sinnvoll.                                      | bestätigt           | Aktuelle 189 `strategicRole`-Karten entsprechen normierten `lineSupport`-Karten; keine Pflicht für alle strukturierten Karten. |
| D: Function-Signals sollen nicht manuell in jeder Karte gepflegt werden.                                | bestätigt           | `functionTags` sind verboten; Ableitung kommt aus `function-signal-derivation-v1.json` und strukturierten Facts.               |
| E: Legacy-`roles`/`planRoles` bleiben nur solange, bis neue Semantik und Plannerpfade sie ersetzen.     | teilweise bestätigt | Sie sind fachlich Legacy, aber heute noch runtimewirksam und dürfen nicht entfernt werden.                                     |
| F: UI-Hauptansichten sollen Zielmodell zeigen, nicht Altlast.                                           | teilweise bestätigt | Inspector ist weitgehend vorbereitet; DeckStrategy Viewer und Fallback-Panel brauchen noch Trennung.                           |

## Informationsbedarf für Folgeprompts

### UI-Folgeprompt

Betroffene Dateien:

- `apps/web/app/api/cards/catalog-data.ts`
- `apps/web/app/ai-hint-inspector-ui.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/api/decks/strategy-profile/strategy-profile-data.ts`
- `apps/web/app/deck-strategy-profile-ui.ts`
- Tests:
  - `apps/web/app/ai-hint-inspector-ui.test.ts`
  - `apps/web/app/api/cards/catalog-data.test.ts`
  - `apps/web/app/api/decks/strategy-profile/strategy-profile-data.test.ts`
  - `apps/web/app/deck-strategy-profile-ui.test.ts`

ViewModel-Felder:

- Karten-Inspector: `supportStatus`, `compiledHint`, `mechanicalFacts`,
  `functionSignals`, `strategyAnchors`, `lineSupport`, `strategicRole`,
  `quality`, `legacyRoles`, `warnings`.
- DeckStrategy Viewer: `statusEntries`, `strategies`, `sideProfileGroups`,
  `evidenceGroups`, `functionSignalCounts`, `legacySignalGroups`, `warnings`.

Legacy-Felder aus der Hauptansicht:

- `roles`
- `planRoles`
- Legacy-/Alias-`lineSupport`
- `valueHints`
- `requiredMechanics`
- `riskTags`
- `scenarioRefs`
- `manualNotes`
- `strategicNotes`
- `legacySignalGroups`

Legacy-Felder, die in Debug/Migration bleiben sollten:

- `roles`/`planRoles` mit Klassifikation
- `card-role-manifest`-Hinweis, falls später sichtbar gemacht
- `legacyFallbackOnly`
- Alias-/Migrationseinordnung
- alte Evidence-Felder wie `scenarioRefs`

Aktuell missverständlich:

- DeckStrategy `Legacy-Signal-Counts` wirkt wie ein normaler fachlicher
  Bestandteil.
- `Aktive KI-Semantik` sagt "ohne Runtime- oder Plannerwirkung", aber einzelne
  strukturierte Felder sind inzwischen teilweise runtimewirksam. Die UI braucht
  differenzierte Feldwirkung statt pauschaler Aussage.
- Der Legacy-Zähler in Support/Hinweisen ist sinnvoll, aber ohne kurze
  Einordnung als Kompatibilitätsrest leicht überinterpretierbar.

Fehlende Tests:

- Inspector-Hauptansicht zeigt keine `roles`, `planRoles`, `valueHints`,
  `riskTags`, `scenarioRefs`.
- Nicht-normalisierter `lineSupport` bleibt in Debug.
- DeckStrategy Viewer zeigt Legacy Counts nur noch in einem geschlossenen
  Debug-/Migrationsteil.
- ViewModel enthält pro Gruppe eine Wirkungsmarkierung:
  `runtime`, `diagnostic`, `migration`.

### Pipeline-Folgeprompt

Betroffene Deriver/Scripts:

- `scripts/check-ai-derived-facts.mjs`
- `scripts/check-ai-derived-facts-full.mjs`
- `scripts/build-ai-compiled-hints.mjs`
- `scripts/build-ai-hint-inspector-index.mjs`
- `scripts/check-ai-strategy-taxonomy.mjs`
- `data/ai/function-signal-derivation-v1.json`

Nicht direkt ableitbare oder unvollständige Signale:

- Remote-Contest-/Remote-Trash-Intent als First-Class-Runner-Ziel.
- Cheap-ICE/Rush-Shape aus Kosten, ETR und Agenda-/Remote-Kontext.
- Interface-Closeout als Aggregation über Multiaccess-Dichte und Reachability.
- `costProfile` breiter aus CardDefinition/Implementation.
- `targetProfiles` für Search/Install/Look/Reorder als Signalquelle.

Benötigte neue Deskriptoren:

- strukturierter Remote-Contest-/Trash-Intent
- strukturierter Cheap-ICE-/Rush-Shape-Descriptor
- Interface-/Multiaccess-Density-Aggregationsdescriptor
- Kosten-/Reserve-/Opportunity-Descriptor statt active-only `costProfile`
- TargetProfile-Descriptor für Search, Install, Look/Reorder und Shuffle
- Wirkungsstatus pro Semantikfeld: generated, active-manual, overlay, runtime,
  diagnostic-only

Legacy-Quellen, die ersetzt werden müssen:

- `card-role-manifest-0.9.json`
- `roles`
- `planRoles`
- `buildDeckDoctrineProfile`
- `rolesForCardId`/`rolesForAction`
- `ownDeckDoctrine.planWeights`

Neue Checks:

- Function-Signal-Regeln dürfen weiterhin nur erlaubte strukturierte Quellen
  verwenden, nicht `roles`, `planRoles`, `valueHints` oder `lineSupport`.
- UI-Hauptansichten dürfen keine Legacy-Felder direkt rendern.
- Active-only strukturierte Felder ohne Generated-Fact-Gegenstück müssen
  gezählt werden, insbesondere `costProfile`.
- DeckStrategy/Planner-Verbraucher müssen Feldwirkung explizit markieren:
  diagnostic-only versus runtime.

Sichere Reihenfolge:

1. UI-Hauptansicht und Debug-Bereiche trennen.
2. Descriptor-/Generated-Fact-Gaps schließen, besonders `costProfile` und
   Remote-/Interface-Gaps.
3. Diagnostisches DeckStrategyProfile stabilisieren.
4. Einzelne Planner-Consumer von Legacy-Rollen auf neue strukturierte Semantik
   umstellen.
5. `buildDeckDoctrineProfile` und `card-role-manifest` erst danach ablösen.
6. Legacy-Felder nur entfernen, wenn Checks und Benchmark/Smoke-Gates den
   Ersatz belegen.

## Risiken

- Legacy zu früh entfernen: Runner-/Corp-Planer und `ownDeckDoctrine` verlieren
  Verhalten.
- Legacy zu lange sichtbar lassen: UI bleibt fachlich verwirrend und wirkt wie
  gleichrangige Semantik.
- Function-Signals aus falscher Quelle ableiten: DeckStrategyProfile würde
  falsche Strategien behaupten.
- Neue Semantik nur anzeigen, aber nicht Runtime-Wirkung markieren: Nutzer
  erwarten Planner-Verhalten, das noch nicht existiert.
- Direkte CardImplementation-Ableitung bleibt textscanbasiert: Änderungen an
  Implementation-Code können Fakten unbemerkt abbrechen.
- UI verschweigt Legacy, obwohl es runtimewirksam ist: Debugbarkeit und
  Risikoabschätzung gehen verloren.
- Planner nutzt später Strategie ohne Reachability-/Boardstate-Gates: alte
  Fehlentscheidungen durch nicht erreichbare oder nicht bezahlbare Linien kehren
  zurück.

## Bewusst nicht geändert

- Keine Engine-Regeländerung.
- Keine LegalAction-Änderung.
- Keine Runtime-/Plannerlogik.
- Keine Action Scores oder PlanWeights.
- Keine Profil-/Default-Umschaltung.
- Keine Hintmigration.
- Keine Entfernung von `roles`, `planRoles`, `lineSupport` oder
  `card-role-manifest`.
- Keine UI-Codeänderung.
- Keine Catalog-/Proteus-Baseline-Korrektur.

## Checks

Die Review-Datei und der README-Eintrag wurden als reine Dokumentation angelegt.
Ausgeführt:

- `corepack pnpm exec prettier --write docs/reviews/ai/ai012-new-ai-semantics-readiness-audit-2026-06-01.md docs/reviews/ai/README.md`
- `git diff --check`
- `git diff --cached --check`
