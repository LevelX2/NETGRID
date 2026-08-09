# CardSpec Capability- und Consumer-Inventar

- Status: **abgeschlossen**
- Stand: 2026-08-09
- Inventarbasis: `1c57fb0094c477fa84514657677883f042d39106`
- Architekturquelle:
  [Central Card Specification and Registry – Zielarchitektur](../../architecture/central-card-specification-and-registry-target-state-2026-08-09.md)
- Prozesspaket: `CS01`
- Lokale maschinenlesbare Evidence:
  `data/local/card-spec-registry-migration-cs01/card-spec-capability-consumer-inventory.json`
- Reproduzierbarer lokaler Audit:
  `data/local/card-spec-registry-migration-cs01/audit-card-spec-migration-space.ts`

## Ergebnis

Der vollständige aktuelle Migrationsraum ist inventarisiert:

- alle 620 Karten gehören genau einer von drei disjunkten Migrationsklassen
  an;
- alle 48 Top-level-Familien von `CardImplementationDefinition` sind mit
  Anzahl, Runtime-Owner, Adressierbarkeit, Serialisierbarkeit und
  Prospective-Klasse erfasst;
- 16 Familien sind `statically_compilable`, 31 benötigen eine
  `requires_engine_quote`-Projektion und `regionBaseline` ist als eine bewusst
  inventarisierte Klasse `unknown` fail-closed markiert;
- alle produktiven Direktconsumer der fünf heutigen Autoritätsflächen sind
  einer Zielprojektion und einer Paketgrenze zugeordnet;
- alle 32 aktiven Top-level-Hintfelder sowie die zwei nur typisierten, heute
  inaktiven Felder sind als Public Identity, mechanisch abgeleitet, echte
  PlanningAnnotation, aufzuspaltende Mischfamilie, Coverage/Evidence oder
  Editorinhalt disponiert;
- zehn heterogene Stresskarten decken die fünf Pflichtkarten und alle fünf
  zusätzlichen Pflichtfamilien ab.

`unknown` bedeutet hier nicht unentdeckt. `regionBaseline` ist vollständig
gezählt und lokalisiert, besitzt aber keinen produktiven Runtimeconsumer. Das
Feld darf bis zum Ownernachweis weder statisch kompiliert noch in eine
PlanningAnnotation übernommen werden.

## Methodik und Reproduktion

Der Audit lädt den finalen Runtimegraphen aus
`packages/engine/src/card-implementations/registry.ts`, liest die vier
Karten-JSONs und die aktive Hintdatei, klassifiziert Sourceconsumer
lexikalisch mit Reachability-Korrekturen und schreibt je Karte, Familie,
Consumer und Hintfeld einen maschinenlesbaren Datensatz. Seine Assertions
scheitern fail-closed, wenn die 620er-Partition, die 48er-Familienmenge, die
Hintfeldklassifikation oder die zwei bekannten Hintausnahmen abweichen.

Lokaler Repro-Befehl vom Worktree-Root:

```powershell
node --import ./node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/loader.mjs data/local/card-spec-registry-migration-cs01/audit-card-spec-migration-space.ts
```

Erwartete Kernausgabe:

| Prüfpunkt                    | Erwartung                                         |
| ---------------------------- | ------------------------------------------------- |
| Karten                       | 620 eindeutige IDs                                |
| Implementierungsdefinitionen | 583                                               |
| Capability-Familien          | 48                                                |
| Aktive Hints                 | 618                                               |
| Migrationspartition          | 583 `implementation_backed_declarative`, 1, 36    |
| Registry-JSON                | 186.575 UTF-8-Bytes                               |
| JSON-Roundtrip               | `isDeepStrictEqual === true`                      |
| Verbotene Runtimewerte       | 0                                                 |
| Produktive Direktconsumer    | 105 CardDefinitions, 87 Registry, 66 aktive Hints |

Zusätzliche reproduzierbare Suchflächen:

```powershell
rg -l '\b(CARD_DEFINITIONS(?:_BY_ID)?|getCardDefinition(?:ById)?)\b' packages apps scripts -g '*.ts' -g '*.tsx' -g '*.mjs'
rg -l 'card-implementations/registry' packages apps scripts -g '*.ts' -g '*.tsx' -g '*.mjs'
rg -n 'data/cards/.*-cards\.json|data\\cards\\.*-cards\.json|(?:proteus|classic)-cards\.json' packages apps scripts -g '*.ts' -g '*.tsx' -g '*.mjs'
rg -n 'data/manifests/.*-card-support\.json|data\\manifests\\.*-card-support\.json' packages apps scripts -g '*.ts' -g '*.tsx' -g '*.mjs'
rg -l 'ai-card-hints-active\.json|AI_HINTS_BY_CARD|RUNTIME_CARDS|createAiHintsByCard|ai-hints' packages apps scripts -g '*.ts' -g '*.tsx' -g '*.mjs'
rg -n --glob '*.ts' --glob '!*.test.ts' '\bnew\s+(Map|Set|Date|RegExp)\b|\b(Map|Set|Date|RegExp)\s*<|Math\.random|crypto\.|process\.env|performance\.|Date\.now|Symbol\(|BigInt\(|=>|\bfunction\b' packages/engine/src/card-implementations
```

Tests und Fixtures werden über `.test.`, `.spec.`, `test-support`, `test`,
`test-fixtures`, `fixtures` und `index-tests` getrennt. `scripts/`,
`packages/ai/src/simulation/` sowie der nur von dort erreichbare Pfad
`runtime/simulation-card-target.ts` sind Tool-/Simulationsconsumer.

## Kartenpartition

| Migrationsklasse                              | Anzahl | Auswahlregel und Disposition                                                                                                         |
| --------------------------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------ |
| `implementation_backed_declarative`           |    583 | ID ist Schlüssel von `CARD_IMPLEMENTATIONS_BY_DEFINITION_ID`; bestehende deklarative Enginefläche wird in CardSpec.engine überführt. |
| `definition_only_no_engine_behavior_required` |      1 | `onr_v1_220_tycho-extension`; normale Agenda-Basismechanik, keine zusätzliche Kartenimplementierung erforderlich.                    |
| `definition_only_test_fixture`                |     36 | Testset-only; 34 außerhalb des aktuellen Release-Scope und zwei Catalog-Previews mit `coverage_missing`.                             |

Setverteilung der 583 Implementierungen: Testset 2, Classic 54, Proteus 154,
Originalset v1 373. Die 36 Definition-only-Testfixtures sind:

`catalog_preview_operation_001`, `catalog_preview_resource_001`,
`corp_identity_001`, `efficient_fracter`, `runner_identity_001`,
`simple_agenda`, `simple_barrier_ice`, `simple_code_gate_ice`,
`simple_decoder`, `simple_draw_event`, `simple_draw_operation`,
`simple_economy_event`, `simple_economy_operation`, `simple_fracter`,
`simple_killer`, `simple_priority_agenda`, `simple_run_event`,
`simple_sentry_ice`, `simple_setup_hardware`, `simple_tag_ice`,
`simple_tag_punishment_operation`, `simple_taxing_barrier_ice`,
`simple_upgrade`, `v08_adaptive_killer`,
`v08_archive_planning_operation`, `v08_burst_credit_event`,
`v08_credit_surge_operation`, `v08_deep_draw_event`, `v08_gate_ice`,
`v08_memory_chip`, `v08_overclock_run_event`, `v08_precise_decoder`,
`v08_project_agenda`, `v08_steady_fracter`, `v08_wall_ice` und
`v08_watchdog_ice`.

Die beiden Catalog-Previews sind zugleich die einzigen Karten ohne aktiven
Hint. Ihre bewusste Exklusion muss später über Publication-/Registry-Policy
ausgedrückt werden; ein still fehlender Hint ist kein Zielvertrag.

## Serialisierbarkeit

Ein rekursiver Graphscan über alle 583 finalen Definitionsobjekte fand:

- keine Funktionen oder Closures;
- kein `undefined`, `NaN`, `Infinity`, `-Infinity`, `Symbol` oder `BigInt`;
- keine `Map`, `Set`, `Date`, `RegExp` oder fremden Prototypen;
- keine Zyklen;
- keine umgebungsabhängigen finalen Werte.

`JSON.stringify(CARD_IMPLEMENTATIONS)` erzeugt 186.575 UTF-8-Bytes; Parse und
Deep-Equality-Roundtrip sind grün. Pure Builderfunktionen in `helpers.ts` und
lokale Sets/Callbacks in `coverage.ts` gehören nicht zum finalen Registrygraph.
In konkreten Authoringmodulen wurden keine Registrywerte aus `process.env`,
`Math.random`, `Date.now`, Crypto oder Performance APIs gefunden. Damit ist
jede der 48 aktuellen Familien in ihrer finalen Form grundsätzlich
serialisierbar; ihre Prospective-Klasse entscheidet getrennt, ob ihre
Verfügbarkeit statisch oder nur per Engine-Quote bestimmt werden darf.

## Capability- und Longtail-Inventar

`Defs/Nodes` zählt Definitionen mit dem Top-level-Feld und die darin
adressierbaren beziehungsweise mechanisch getrennten Knoten. `J` bedeutet:
finale Werte sind plain JSON und bestehen den Deep-Roundtrip.

| Familie                            | Defs/Nodes | Runtime-Owner und heutige Adressierung                                                                   | Prospective-Klasse      |
| ---------------------------------- | ---------: | -------------------------------------------------------------------------------------------------------- | ----------------------- |
| `abilities`                        |  176/194 J | Ability Engine, Play-/Actionhosts, Trace/Payment/View; 102 activated + 92 on_play, 0 Keys, indexgebunden | `requires_engine_quote` |
| `accessEffects`                    |    21/23 J | Access-/Run-Flow-Runtime; bedingte Accessauflösungen und Choices                                         | `requires_engine_quote` |
| `accessHooks`                      |      2/2 J | Hidden-Zone-Choice und Access-/Flow-Bootstrap                                                            | `requires_engine_quote` |
| `advanceable`                      |    10/10 J | Corp-Advance, Fort-Pass, Counter-Bank; passiver Marker                                                   | `statically_compilable` |
| `agendaAccessReplacement`          |      1/1 J | Access Actions/Resolution; aktueller Zugriff und Hidden Zone                                             | `requires_engine_quote` |
| `corpRootRezCreditOutcome`         |      2/2 J | Root-Rez-Credit-Outcome; statischer Descriptor, stateful Timing                                          | `statically_compilable` |
| `corpTrashInstalledRunnerSource`   |      1/1 J | Trigger-Ausführung und Corp Main; Action plus Target                                                     | `requires_engine_quote` |
| `corpUtility`                      |    25/25 J | Ability Runtime, Prevention, Hidden Zone, Corp Operation, Punish Quotes                                  | `requires_engine_quote` |
| `damagePreventionSources`          |    20/21 J | Prevention, Card View, Corp-Punish-Quote; Window/Cost/Actions                                            | `requires_engine_quote` |
| `flatlineReplacementSources`       |      3/3 J | Damage Replacement; Choice über aktuellen Grip-/Installzustand                                           | `requires_engine_quote` |
| `fortCapacityModifiers`            |      1/1 J | Lookup Runtime; passiver deterministischer Modifier                                                      | `statically_compilable` |
| `fortRunWindows`                   |    22/22 J | Rez/Encounter/Fort-Pass/Run/Views; 1 aktueller Key                                                       | `requires_engine_quote` |
| `hardwareDeck`                     |    14/14 J | Damage Prevention; passiver Typmarker                                                                    | `statically_compilable` |
| `hiddenReplacementLongtail`        |      6/6 J | Card Resolver, Flow, Hidden Arrange, Run, Corp Operation                                                 | `requires_engine_quote` |
| `hostedProgramCapacity`            |      4/4 J | Lookup Runtime; passive Hostinggrenze                                                                    | `statically_compilable` |
| `hostedProgramModifiers`           |      2/2 J | Lookup Runtime und Card View; passiver Modifier                                                          | `statically_compilable` |
| `iceEncounter`                     |      2/2 J | Encounter Entry, Run Derivation/View; Random oder temporäre Credits                                      | `requires_engine_quote` |
| `icebreakerAbilities`              |    47/91 J | Icebreaker Ability Engine; 91 Actionknoten, 0 Keys, indexgebunden                                        | `requires_engine_quote` |
| `icebreakerEncounterStrengthBonus` |      1/1 J | Runtime/Encounter/View; statischer gebundener Descriptor                                                 | `statically_compilable` |
| `icebreakerSubtypeChange`          |      2/2 J | Trigger, Encounter, Runner Main; Action plus Choice                                                      | `requires_engine_quote` |
| `installAdditionalCosts`           |      2/2 J | Runtime Bootstrap; statische Zusatzkosten                                                                | `statically_compilable` |
| `installCapabilities`              |    13/14 J | Lookup, Installrestriktionen, Install Card, Runner Main                                                  | `statically_compilable` |
| `installTargetBinding`             |      3/3 J | Resolver, Install Card, Runner Main, Card View; persistente Bindung                                      | `requires_engine_quote` |
| `leavePlayCleanup`                 |      1/1 J | Lookup Runtime; deterministische Lifecycle-Haftung                                                       | `statically_compilable` |
| `lifecycle`                        |    58/58 J | Lifecycle Start/End/Immediate, Install/Rez/Run, Trigger, Views                                           | `requires_engine_quote` |
| `modifiers`                        |    51/58 J | Modifier Interpreter, Access, State/Zone, Rez/Run, Quotes                                                | `statically_compilable` |
| `printedSubroutines`               |   89/145 J | Subroutine Interpreter, Runtime, Trace, Visible Run                                                      | `requires_engine_quote` |
| `regionBaseline`                   |      8/8 J | Kein produktiver Consumer; nur Typen, Authoring und Coverage                                             | `unknown`               |
| `relativeIce`                      |      4/4 J | Lookup, Run Derivation, Trace Quote, Card View; 3 `subroutineId`                                         | `requires_engine_quote` |
| `remainingReplacementLongtail`     |      7/7 J | Damage/Trace, Corp Rez, Root Outcome, Run Duration/Rez                                                   | `requires_engine_quote` |
| `restrictedHostedCreditSource`     |    26/26 J | Run-Payment und Card View; Restriktion statisch, Spend stateful                                          | `statically_compilable` |
| `runEncounterInterventions`        |      2/2 J | Root Outcome, Encounter Entry, Run-Rez-Window                                                            | `requires_engine_quote` |
| `runnerCounterEffects`             |      6/6 J | Damage-/Trace-Runtime und Validation                                                                     | `requires_engine_quote` |
| `runnerEventLongtail`              |      9/9 J | Card Runtime Resolver; random/hidden/search/install/run                                                  | `requires_engine_quote` |
| `runnerEventTargetedEffect`        |      1/1 J | Lifecycle Runtime und Runner Main; Target Choice                                                         | `requires_engine_quote` |
| `runnerRunStrengthBoost`           |      1/1 J | Trigger und Run Actions; aktuelle Action/Target/Window                                                   | `requires_engine_quote` |
| `runnerUtilityLongtail`            |    19/19 J | Effective Values, Access, Economy, Damage/Trace, Run                                                     | `requires_engine_quote` |
| `scoredAgenda`                     |    25/25 J | Scored-Agenda-Runtime, Rez Cost, View/Quote; 2 Keys                                                      | `requires_engine_quote` |
| `selfRezAdditionalCosts`           |      1/1 J | Corp Rez Cost und Rez Card; statische Zusatzkosten                                                       | `statically_compilable` |
| `selfRezCostModifiers`             |      4/4 J | Corp Rez Cost; statische bedingte Modifier                                                               | `statically_compilable` |
| `selfStealCosts`                   |      1/1 J | Steal Cost Modifiers; statische Accesskosten                                                             | `statically_compilable` |
| `successfulRunFollowups`           |      7/7 J | Successful-Run Followups/Interventions; 2 Keys                                                           | `requires_engine_quote` |
| `tagPreventionSources`             |      7/7 J | Prevention Sources; Window/Cost/Actions                                                                  | `requires_engine_quote` |
| `trashPreventionSources`           |      3/4 J | Prevention Sources; Window/Cost/Actions                                                                  | `requires_engine_quote` |
| `unique`                           |      9/9 J | Lookup Runtime; statische Uniqueness-Constraint                                                          | `statically_compilable` |
| `uniqueDirectLongtail`             |      8/8 J | Damage/Trace, Runner Turn Start, Successful Run                                                          | `requires_engine_quote` |
| `variableRez`                      |    11/11 J | Runtime Resolver, Rez Cost, Run View/Window; X/Choice                                                    | `requires_engine_quote` |
| `virusCounter`                     |    18/18 J | Access Count, Effective Values, Lookup, Install/Run/View                                                 | `requires_engine_quote` |

Im gesamten Registrygraph existieren nur fünf heutige `abilityKey`-Werte
(einer in `fortRunWindows`, zwei in `scoredAgenda`, zwei in
`successfulRunFollowups`) und drei `subroutineId`-Werte in `relativeIce`.
Materialisierte, von Plan, Choice, Action oder Debug referenzierte Knoten
benötigen deshalb im Ziel stabile fachliche `capabilityKey`-Werte. Arrayindizes
sind kein stabiler Vertrag. Passive statische Knoten benötigen nur dann einen
Key, wenn Quote, Plan oder Debug sie einzeln referenzieren.

`regionBaseline` stoppt seine eigene Migration fail-closed: CS03 muss entweder
einen tatsächlichen Engine-Owner und eine nichtduplizierte Semantik beweisen
oder das Feld entfernen. Keine Planning-/Public-Projektion darf es vorab als
verfügbare Capability veröffentlichen.

## Consumer-Inventar und Zielgrenzen

| Heutige Autorität           |       Direkte produktive Consumer | Klassifikation                                   | Verbindliches Ziel                                                                                                                                                       |
| --------------------------- | --------------------------------: | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CardDefinitions in Shared   | 105 plus 2 Quell-/Reexportdateien | 64 Engine, 38 AI, 1 Server, 2 Web                | Engine nach `/engine`; AI nach `/planning` oder für reine Identität `/public`; Server/Web ausschließlich side-safe `/public` beziehungsweise serverseitig sanitizte DTOs |
| CardImplementation-Registry |                                87 | ausschließlich Engine                            | `/engine`; eine mechanische Registryautorität                                                                                                                            |
| Raw Card JSON               |                                 4 | Catalog, Shared-Quelle/Reexport, Web-Assetlookup | CardSpec Printing/Public/Publication und Engineprojektion; kein Browser-Raw-JSON                                                                                         |
| Supportmanifeste            |                                 1 | Catalog Loader                                   | Publication nur redaktionell; Support/Coverage/Playability abgeleitet                                                                                                    |
| Aktive Hints                |             66 plus 1 Autorloader | 65 AI, 1 Web API                                 | AI `/planning` plus kompilierte Engine-Deskriptoren; Web nur sanitizte serverseitige Editor-/Diagnoseprojektion                                                          |

Die lokale Evidence enthält für jeden Treffer `source`, `path`, `layer`,
`scope` und `target`. Die folgenden dauerhaften Gruppierungen sind vollständig
und bilden die Migrationseinheiten für spätere Pakete:

### CardDefinitions

- Engine (64): `ability-engine`, `mechanics`, `coverage`, Root-Exports,
  `game`-Validierung/Win/Create/Events/Install/Turn sowie 35
  `engine-runtime-internal`-Hosts und -Resolver und acht `game/view`-Quotes.
  Mechanische oder effektive Werte gehen nach `/engine`; Views bleiben
  side-safe Engineprojektionen.
- AI (38): 15 Root-/Action-/Decision-/Plan-/Analyseconsumer und 23 live
  `runtime`-Consumer. Capability-/Prospective-Daten gehen nach `/planning`;
  aktuelle Legalität und effektive Werte bleiben Engine-Quote. Reine Titel-
  und Typauflösung geht nach `/public`.
- Server (1): `apps/server/src/multiplayer.ts`. Normale Payloads erhalten nur
  `/public`; die privilegierte lokale AI-Debugausnahme bleibt serverseitig und
  muss ihre DTO explizit sanitizen.
- Web (2): `apps/web/app/action-board-ui.ts` und
  `apps/web/app/chronicle.ts`; ausschließlich `/public`.
- Die Quell-/Reexportdateien `packages/shared/src/card-definitions.ts` und
  `packages/shared/src/index.ts` verlieren ihre Definitionsautorität. Die
  unbenutzten Raw-JSON-Sideeffect-Imports im Root-Reexport entfallen.

### CardImplementation-Registry

Alle 87 produktiven Direktimporte liegen in Engine. Sie verteilen sich auf
Ability Engine, Access, Choices, Damage, Economy, Runtimehosts/-resolver,
Install, Payment, Play, Rez, Run, Trace, Validation, Views, Engine-Index und
`mechanics/card-implementation-derived-sets.ts`. Sie wechseln geschlossen auf
`@netgrid/cards/engine` beziehungsweise den Engine-`CardRegistry`.

`coverage.ts` und `card-implementation-derived-sets.ts` werden DerivedViews
oder Gates. Sie dürfen keine zweite Support- oder Definitionsautorität
bleiben. Set-Subregistries sind während der jeweiligen Setmigration
Authoringquellen und werden nach dem Cutover entfernt.

### Raw Card JSON und Supportmanifeste

Die vier produktiven Raw-Card-Consumer sind:

1. `packages/catalog/src/card-set-loader.ts` für alle vier Sets;
2. `packages/shared/src/card-definitions.ts` mit zusätzlichen manuellen
   TypeScript-Definitionen und Classic-/Proteus-Fallbacks;
3. `packages/shared/src/index.ts` mit unbenutzten Classic-/Proteus-Imports;
4. `apps/web/app/api/card-images/card-image-lookup.ts` mit Classic-/Proteus-
   Pfadkonstanten.

Catalog erhält `/public`, Printing und Publication; Engine- und Publicwerte
werden aus CardSpec kompiliert. Der Web-Assetlookup verwendet künftig
PrintingSpec/`printingId`, nicht Raw JSON. Die Shared-Quelle wird vollständig
abgelöst. Die beiden Tools `check-icebreaker-run-semantics.mjs` und
`generate-localized-agenda-skin-data.mjs` wechseln auf Registry-/Publicexports.

Der einzige produktive Manifestimport ist
`packages/catalog/src/card-set-loader.ts`. Publication darf nur redaktionelle
Zustände wie `active`, `experimental`, `disabled` und Blockhinweise enthalten.
`implemented`, `engine_supported`, `playable`, `human_playable`,
`ai_supported`, `resolverRef`, `coverage`, `aiHintRef` und `scenarioRefs`
werden abgeleitet und nicht als zweite Wahrheit migriert. Die Proteus-
Readiness-Tools wechseln auf abgeleitete Coverage/Evidence oder entfallen.

### Aktive Hints

`packages/ai/src/ai-hints.ts` ist der heutige Autorloader. Er importiert Raw
Hints, erzeugt `AI_HINTS_BY_CARD` und koppelt zusätzlich `RUNTIME_CARDS` aus
Catalog ein. Die 65 produktiven AI-Consumer verteilen sich auf 41 live
Runtimepfade, 16 Rootpfade, drei Actionpfade sowie je einen Access-, Decision-,
Diagnostics-, Plan- und Runnerpfad. Sie wechseln auf `/planning`; mechanische
Deskriptoren werden aus `engine` kompiliert.

Vier AI-Dateien importieren die Raw-Hintdatei direkt: die Autorquelle
`ai-hints.ts` sowie die drei produktiven Consumer `deck-doctrine-strategy.ts`,
`hint-ontology-doctrine.ts` und
`runner-deck-engine-doctrine.ts`. Diese Direktimporte entfallen. Der 66.
produktive Direktconsumer ist
`apps/web/app/api/cards/catalog-data.ts`; er besitzt eine duplizierte Hint-
Typeoberfläche und liefert Daten an eine Browserroute. Er darf künftig nur
eine serverseitig erzeugte, sanitizte Editor-/Diagnoseprojektion ausgeben;
`/engine` und `/planning` bleiben browsergesperrt.

## Hintfeld-Disposition

Aktiv sind 32 Top-level-Felder in 618 Hints. Sieben davon sind im zentralen
`AiCardHint & AiHintOntologyExtension`-Vertrag nicht deklariert:
`constraints`, `hiddenInfoPolicy`, `no_signal_reason`, `requiredMechanics`,
`riskTags`, `scenarioRefs` und `strategicRole`. Die heutige Type Assertion
verdeckt diese Drift. Das spätere Unknown-Key-Gate muss jeden nicht explizit
klassifizierten Key fail-closed ablehnen.

| Zielklasse                 | Felder                                                                                                                                                                                   | Disposition                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public Identity            | `cardId` (618), `side` (618), `cardType` (618)                                                                                                                                           | In `/public`, keine PlanningAnnotation.                                                                                                            |
| Mechanisch abgeleitet      | `effects` (588), `actionCapacityProfiles` (46), `conditions` (408), `functionSignals` (599), `requiredMechanics` (618), `breakerProfile` (54), `hiddenInfoPolicy` (7), `constraints` (1) | Aus `engine`/Public-Verträgen kompilieren; keine manuelle zweite Wahrheit.                                                                         |
| Echte PlanningAnnotation   | `strategyAnchors` (273), `lineSupport` (253), `strategicRole` (353), `strategySupportPairs` (198), `actionStrategySupportPairs` (65)                                                     | Typisierte strategische Interpretation ohne Mechanikduplikat.                                                                                      |
| Planning mit Mechanikabzug | `strategicExchangeKinds` (20), `remoteRole` (59)                                                                                                                                         | Nur strategische Interpretation beziehungsweise `kind`/`threatLevel`; exakte Kosten, Schäden, Ressourcen, Score- und Server-Scope-Fakten ableiten. |
| Zwingend aufspalten        | `actionTacticSignals` (588), `tacticSignals` (312), `riskTags` (618), `roles` (618), `planRoles` (618), `valueHints` (617), `costProfile` (111), `targetProfiles` (139)                  | Nach den folgenden deterministischen Regeln teilen; niemals das Gesamtfeld übernehmen.                                                             |
| Derived Coverage/Evidence  | `aiSupportStatus` (618), `quality` (618), `scenarioRefs` (618)                                                                                                                           | Coverage ableiten; Quality/Scenarios als Evidence, nicht Runtime-Planning.                                                                         |
| Editor/Migration           | `manualNotes` (324), `no_signal_reason` (1), `strategicNotes` (2)                                                                                                                        | Kein Runtimeexport; `strategicNotes` erst nach Typisierung als Annotation zulässig.                                                                |
| Heute inaktiv              | `descriptorGaps` (0, Editor), `opponentSignals` (0, Planning)                                                                                                                            | `opponentSignals` nur mit `visibleEvidenceOnly`, niemals Hidden-Info.                                                                              |

### Deterministische Splitregeln

- `actionTacticSignals`: Präfixe `effect:`, `effect_timing:` und
  `effect_scope:` sind mechanisch abzuleiten. Strategische Ontologiesignale
  wie Economy-, Protection-, Pressure-, Payoff-, Survival- oder
  Coverage-Nutzung dürfen nur als typisierte PlanningAnnotation fortbestehen.
  Unbekannte Präfixe werden nicht übernommen, sondern als Editor-Gap
  abgelehnt.
- `tacticSignals`: Tokens, die Timing, Bedingung, Capability, Schaden, Tag,
  Trace, ETR, Access, Counter oder Zieltyp behaupten, werden aus Engine
  kompiliert. Nur explizit typisierte `urgency`, `value`, `use`, `payoff`,
  `support`, `pressure` oder Route-Interpretationen dürfen PlanningAnnotation
  sein. Jeder heutige Token benötigt beim Compiler-Cutover einen Eintrag in
  einer geschlossenen Mappingtabelle; Default ist fail-closed Editor-Gap.
- `riskTags`: objektive Fakten wie Kosten, Damage, Random, Once-per-Turn,
  Hidden Zone, Run-/Access-/Trace-/Prevention-Window, Counter und
  Replayanforderung werden abgeleitet. Nur evaluative Risiken wie hohe
  Opportunity Cost, Credit Intensive, Flatline Risk oder schlechte
  Tradequalität werden typisiert annotiert. Default ist fail-closed.
- `roles`: Side, Cardtype und Subtype werden Public Identity; mechanische
  Capabilityrollen werden kompiliert; Planowner, Route und strategische Rolle
  werden typisiert annotiert; Quality-/Coveragewerte gehen in Evidence. Die
  heutigen 247 Tokens werden über eine geschlossene Werttabelle migriert.
- `planRoles`: reine Action-/Ability-/Installfamilien werden abgeleitet.
  Planowner, Route und strategische Verwendung bleiben Annotation. Die
  heutigen 113 Tokens erhalten eine geschlossene Werttabelle; Default ist
  fail-closed.
- `valueHints`: `damage`, `installCreditGain`, `leavePlayPayCost` und
  `startOfTurnCreditLoss` einschließlich Betrag sind mechanisch. `economy` und
  `remoteRootValue` sind nur als ausdrücklich nichtmechanische Bewertung
  zulässig und dürfen nie Auszahlung oder Kosten duplizieren.
- `costProfile`: `clicks`, `credits`, `memory`, `counters` und `agendaPoints`
  werden abgeleitet. `reserveRisk` und `opportunityCost` dürfen typisierte
  Bewertung sein.
- `targetProfiles`: `schemaVersion`, `kind`, `targetType`, `timing`, Zone,
  Installkosten, erforderliche Subtypes, Server Scope, Mindestanzahl,
  Run-Constraint und Hidden-Info-Policy werden abgeleitet. `purpose`,
  `preferences` und `avoid` dürfen strategische Annotation sein, sofern sie
  keine Legalität behaupten.
- `remoteRole`: strategisches `kind` und `threatLevel` dürfen Annotation sein;
  exakter `serverScope` wird mechanisch abgeleitet.
- `strategicExchangeKinds`: strategische Austauschbewertung darf Annotation
  sein; exakte Self-Tag-, Self-Damage-, Ressourcen- oder Scorewirkung wird
  abgeleitet.

## Stresskarten

| Karte                                                      | Pflichtabdeckung   | Belastete Familien und Grund                                                         |
| ---------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------ |
| Broker (`onr_v1_154_broker`)                               | Pflichtkarte       | `abilities`: zwei activated once-per-turn Hosted-Credit-Actions ohne Keys            |
| Loan from Chiba (`onr_v1_168_loan-from-chiba`)             | Pflichtkarte       | `lifecycle`: Installgewinn, Turn-Start-Verlust, Leave-Play-Haftung, End-Turn-Cleanup |
| Black Widow (`onr_proteus_080_black-widow`)                | Pflichtkarte       | `installTargetBinding`, Encounter-Bonus und zwei Breakerabilities                    |
| Morphing Tool (`onr_proteus_092_morphing-tool`)            | Pflichtkarte       | Install-Choice, persistente Bindung, Subtype-Mutation und Breakeractions             |
| Sneak Preview (`onr_v1_110_sneak-preview`)                 | Pflichtkarte       | Hidden-Stack-/Trash-Choice, freier Install und deferred Return                       |
| Data Masons (`onr_v1_317_data-masons`)                     | passiver Modifier  | Zwei passive Rez-Cost-/Ice-Strength-Modifier und Ordering                            |
| Digiconda (`onr_proteus_020_digiconda`)                    | Corp-/Variable-Rez | `variableRez.x_strength`, X-Quote                                                    |
| Virus Test Site (`onr_v1_348_virus-test-site`)             | Access/Ambush      | `advanceable` plus drei `accessEffects`, Multi-Node-Key-Stress                       |
| Data Fort Reclamation (`onr_v1_197_data-fort-reclamation`) | Scored Agenda      | Keyed Hidden-HQ-Install-/Rez-Sequenz mit temporären Credits                          |
| Roving Submarine (`onr_v1_368_roving-submarine`)           | Run Window         | Run-Start-Restriktion, Installcapability und gezielter `regionBaseline`-Unknown-Test |

Diese Auswahl umfasst statische und Quote-basierte Familien, passive und
adressierbare Knoten, Hidden Information, persistente Bindungen, Variable-X,
Lifecycle-Haftungen, Run-/Access-/Score-Windows und die einzige bewusste
Unknown-Klasse. Dieter Esslin bleibt als alternative Access-/Ambush-
Benchmarkkarte verfügbar, falls spätere Behavior-Baseline-Kontinuität
wichtiger als Multi-Node-Adressierungsstress wird.

## Verbindliche Folgegates

1. CS02 führt keine neue Capabilityfamilie ein und verschiebt noch keine
   Setdefinition. Es schafft ausschließlich die serialisierbare Vertrags- und
   Paketgrenze.
2. CS03/CS04 übernehmen alle 48 Familien in einen geschlossenen Compiler-/
   Quote-Dispatch. Ein unbekannter Feldname oder Hintkey scheitert fail-closed.
3. `regionBaseline` bleibt blockiert, bis Owner und Semantik bewiesen oder das
   Feld entfernt sind.
4. Adressierbare Nodes erhalten stabile `capabilityKey`-Werte; Arrayindizes
   werden nicht als Vertrag konserviert.
5. Browser dürfen nur `/public` beziehungsweise explizit sanitizte DTOs
   erreichen. `/engine` und `/planning` erhalten Subpath-, Browser- und
   Hidden-Info-Guards.
6. Publication enthält keine manuellen Engine-/AI-/Playability-/Coverage-
   Behauptungen.
7. Die zwei Catalog-Preview-Karten erhalten eine ausdrückliche Publication-
   Exklusion; ihr fehlender Hint wird nicht durch einen Dummy-Hint kaschiert.
8. Gemischte Hinttokens werden nur über geschlossene, getestete
   Mappingtabellen migriert; Default ist Editor-Gap und kein Runtimefallback.

Damit ist keine Capability-, Longtail-, Hint- oder Consumerfamilie
unentdeckt. Die einzige Prospective-Klasse `unknown` ist bewusst inventarisiert
und besitzt eine konkrete fail-closed Disposition.
