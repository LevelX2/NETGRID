# AI Concept vs Implementation Delta Review

Datum: 2026-06-06  
Status: Delta-Analyse im Lean Local Mode  
Aktiver Agent: architecture-review-agent  
Scope: Analyse und Review-Artefakt; keine Runtime-Änderung, keine neue Kartensemantik, keine neuen Taktiksignale

## Kurzfazit

Das ursprüngliche KI-Zielbild ist **teilweise umgesetzt**.

- **Vollständig umgesetzt** ist der Sicherheitsrahmen: Die KI wählt weiterhin nur vorhandene Engine-`LegalActions`, der Server revalidiert die gewählte Action über aktuelle LegalActions und `applyAction`, und Hidden-Info bleibt durch `PlayerView`/DTO-/PublicEvent-Grenzen geschützt.
- **Teilweise umgesetzt** ist die Zielkette ab `TacticalPlan`: Seit AI-PLAN-1/AI-PLAN-2 gibt es live echte `TacticalPlan`-/`PlanStep`-Objekte, Mapping über `ActionSemanticCandidate`, erste Plantypen, minimale PlanMemory-Fortschreibung, Breaker-Coverage-Blocker, Broker-Bank-Stabilisierung und Opportunistic-Central-TTL.
- **Nur diagnostisch oder parallel vorhanden** sind die konzeptuellen `DeckDoctrine`-/`NeutralDoctrine`-/`TacticalGoalState`-Modelle aus `semantic-ai-core-meta.ts`. Sie deklarieren ausdrücklich `noRuntimeConsumer`, `productiveUseAllowed: false` und `noRuntimeEffect: true`.
- **Weiterhin fehlt** der Kern des ursprünglichen Zielmodells zwischen Deck und aktueller Aktion: ein echtes `DeckCapabilityProfile`, live genutzte Strategieanker/Rollen aus kanonischer Kartensemantik, TacticalGoals als Doctrine-/Boardstate-Zwischenschicht, eine robuste PlanMemory-Isolation pro Match, Capability-aware Search/Install/Memory-Auswahl und mehrzügige Bank-/Score-Window-Pläne.

Die größte aktuelle Lücke ist nicht mehr "es gibt gar keine Planebene", sondern: Die neue Planebene wird live noch überwiegend aus aktuellen `LegalActions`, sichtbarem Boardzustand und lokalen Heuristiken erzeugt. Sie versteht noch nicht zuverlässig das Deck als Fähigkeitsraum und nutzt die neue Karten-/Ability-Semantik im Livepfad nur unvollständig.

## Quellen und geprüfte Fundstellen

- Zielbild: `docs/architecture/ai/ki-zielbild-metaebene-2026-06-01-v5.md`
- Roadmap: `docs/architecture/ai/ki-roadmap-neue-ki-spieler-2026-06-02-v1.md`
- Guide: `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`
- Vorreview vor AI-PLAN-1: `docs/reviews/ai/ai-plan-layer-current-state-review-2026-06-05.md`
- AI-PLAN-1 Review: `docs/reviews/ai/ai-tactical-plan-layer-implementation-2026-06-05.md`
- AI-PLAN-2 Review: `docs/reviews/ai/ai-plan-2-plan-memory-capability-selection-2026-06-05.md`
- Live-Einstieg: `packages/ai/src/index.ts:3130`, `packages/ai/src/index.ts:3213`, `packages/ai/src/index.ts:3273`
- Server-Revalidierung: `apps/server/src/multiplayer.ts:2618`, `apps/server/src/multiplayer.ts:2626`, `apps/server/src/multiplayer.ts:2630`
- TacticalPlans: `packages/ai/src/tactical-plans.ts:23`, `packages/ai/src/tactical-plans.ts:195`, `packages/ai/src/tactical-plans.ts:368`, `packages/ai/src/tactical-plans.ts:561`, `packages/ai/src/tactical-plans.ts:895`
- DeckDoctrine live: `packages/ai/src/deck-doctrine.ts:60`, `packages/ai/src/deck-doctrine.ts:76`, `packages/ai/src/deck-doctrine.ts:95`, `packages/ai/src/deck-doctrine.ts:186`, `packages/ai/src/deck-doctrine.ts:280`
- Semantic META diagnostisch: `packages/ai/src/semantic-ai-core-meta.ts:139`, `packages/ai/src/semantic-ai-core-meta.ts:184`, `packages/ai/src/semantic-ai-core-meta.ts:1424`, `packages/ai/src/semantic-ai-core-meta.ts:1505`
- ActionSemanticCandidate: `packages/ai/src/action-semantic-candidate.ts:205`, `packages/ai/src/action-semantic-candidate.ts:293`, `packages/ai/src/action-semantic-candidate.ts:723`, `packages/ai/src/action-semantic-candidate.ts:905`, `packages/ai/src/action-semantic-candidate.ts:1127`, `packages/ai/src/action-semantic-candidate.ts:1368`
- Tests: `packages/ai/src/tactical-plans.test.ts:168`, `packages/ai/src/tactical-plans.test.ts:197`, `packages/ai/src/tactical-plans.test.ts:234`, `packages/ai/src/semantic-ai-runtime-cutover.test.ts:253`, `packages/ai/src/semantic-ai-runtime-cutover.test.ts:401`, `packages/ai/src/semantic-ai-runtime-cutover.test.ts:438`, `packages/ai/src/semantic-ai-runtime-cutover.test.ts:533`, `packages/ai/src/semantic-ai-runtime-cutover.test.ts:607`

Hinweis zum bekannten Stand: Der Auftrag nennt AI-PLAN-1 als umgesetzt. Im aktuellen Repo ist zusätzlich AI-PLAN-2 vorhanden und relevant, insbesondere für PlanMemory, Breaker-Capability-Auswahl, Broker-Stabilisierung und Central-Run-TTL. Diese Analyse bewertet deshalb die aktuelle Programmlogik inklusive AI-PLAN-2.

## Ampelübersicht

| Konzeptbaustein | Zielbild | aktueller Stand | Live genutzt? | Delta | Priorität |
| --- | --- | --- | --- | --- | --- |
| CardImplementation / Kartendefinition | Regeltechnische Wahrheit der Karte | Engine-/Runtime-Karten und sichtbare `VisibleCard`-Felder vorhanden | Ja, indirekt über Engine, PlayerView und LegalActions | Live-KI liest nur side-safe sichtbare/own-private Projektionen, nicht vollständige Implementation-Semantik | niedrig |
| kanonische Kartensemantik | kontrollierte Wirkungsbeschreibung je Karte/Ability | Semantikdaten und Join-Schema vorhanden | Teilweise | Live-Planaufruf übergibt keine `cardSemanticProfilesByCardId`; dadurch bleiben Card-/Ability-Semantik und TargetProfiles im Planpfad unvollständig | hoch |
| Taktiksignale | funktionale KI-Sprache | flächenhaft aufgebaut; `ActionSemanticCandidate` kann `actionTacticSignals`/`cardContextSignals` tragen | Teilweise | Direct Semantic Runtime nutzt weiter `roles`/`planRoles`; Planmapping bekommt meist nur Basic-Action-Semantik | hoch |
| Strategieanker mit Rolle | seltene Decklinienanker mit Rolle/Confidence/Evidence | Daten/Guide/Diagnostik vorhanden | kaum | Live-Doctrine basiert auf alten Rollen/PlanRoles und Archetype-Heuristiken, nicht auf StrategySupportPairs als führendem Modell | hoch |
| DeckDoctrine / Deckstrategieprofil | echte Deckstrategie, NeutralDoctrine bei ankerlosen Decks | `AiDeckDoctrineProfile` live; META-`DeckDoctrine` diagnostisch | Ja, aber vor allem Legacy/Mulligan/Debug; nicht in `tactical-plans.ts` | Live-Profil ist Rollen-/PlanWeights-Profil; kein DeckCapabilityProfile, keine echte NeutralDoctrine im Live-Profil | hoch |
| taktische Zwischenziele | Doctrine + Boardstate -> kurzfristige Ziele | `TacticalGoalState` nur in META-Diagnostik | Nein | `TacticalPlan` wird direkt aus LegalActions/Boardzustand erzeugt, nicht aus live TacticalGoals | hoch |
| TacticalPlan / PlanStep | Planebene vor LegalAction-Auswahl | `TacticalPlan`, `PlanStep`, PlanMemory live vorhanden | Ja | erster sinnvoller Schnitt, aber noch LegalAction-getrieben und nicht capability-/doctrine-getrieben | mittel |
| ActionSemanticCandidate | side-safe Projektion jeder LegalAction | Schema und Builder vorhanden; Planmapping nutzt Builder | Teilweise | nicht universeller Live-Auswahlpfad; bei reaktiven Aktionen wird PlanRuntime übersprungen; Card-Semantic-Join nicht live verdrahtet | mittel |
| LegalAction-Auswahl | Auswahl einer legal angebotenen Aktion | `chooseSemanticRuntimeAction` wählt vorhandene Action; Server revalidiert | Ja | Finales Ranking bleibt großteils direkte Action-Score-Heuristik, Plan mapped nur auf vorhandene Choices | mittel |

## Grundkette im Detail

| Ebene | Code vorhanden? | Daten-/Diagnosemodell? | Live im Entscheidungspfad? | Verantwortliche Fundstellen | Lücke |
| --- | --- | --- | --- | --- | --- |
| CardImplementation / Kartendefinition | Ja | Nein, echte Engine-/Runtime-Daten | Ja, als Quelle für PlayerView/LegalActions | `buildAiDecisionInput` in `packages/ai/src/index.ts:3130`; Serverpfad `apps/server/src/multiplayer.ts:2618` | KI darf zu Recht nicht FullState lesen; für Deckfähigkeiten fehlt eine side-safe verdichtete Capability-Schicht |
| kanonische Kartensemantik | Ja, als Semantikdaten/Schema | Ja | Teilweise | `ActionCardSemanticProfile` in `action-semantic-candidate.ts:271`; Join in `action-semantic-candidate.ts:1368` | Live-Aufruf aus `index.ts:3303` übergibt keine Card-Semantic-Profile; damit bleibt der Join im normalen Planpfad leer |
| Taktiksignale | Ja | Ja | Teilweise | Candidate-Felder `cardContextSignals`/`actionTacticSignals` in `action-semantic-candidate.ts:223`; Mapping-Verbrauch in `tactical-plans.ts:456` | Direct Runtime nutzt weiter `rolesForAction` (`index.ts:12614`) und `rolesForCardId` (`index.ts:12783`) |
| Strategieanker mit Rolle | Ja | Ja | kaum | META-Doctrine `semantic-ai-core-meta.ts:139`; `DeckDoctrineFromProfile` `semantic-ai-core-meta.ts:2068` | Live-`deck-doctrine.ts` zählt alte Rollen/PlanRoles (`deck-doctrine.ts:186`) und erzeugt Archetype-Tags/PlanWeights |
| DeckDoctrine / Deckstrategieprofil | Ja | Ja | Ja, aber nicht als Zielmodell | `buildDeckDoctrineProfile` `deck-doctrine.ts:60`; Inputbau `index.ts:3144` | Live-Profil kennt keine Rolle-Statuswerte wie `present_in_deck_unseen`, `visible_or_installable`, `active`, keine Searchability, kein Capability-Inventar |
| taktische Zwischenziele | Ja | Ja | Nein | `TacticalGoalState` `semantic-ai-core-meta.ts:184`; `noRuntimeConsumer` `semantic-ai-core-meta.ts:1508` | TacticalGoals sind noch kein produktiver Controller zwischen Doctrine und Plan |
| TacticalPlan / PlanStep | Ja | Ja | Ja | Typen `tactical-plans.ts:23`; Evaluator `tactical-plans.ts:203`; Memory `tactical-plans.ts:262` | Pläne entstehen aus aktuellen LegalActions/Board, nicht aus DeckDoctrine/TacticalGoalState |
| ActionSemanticCandidate | Ja | Ja | Teilweise | Builder `action-semantic-candidate.ts:293`; Mapping `tactical-plans.ts:368` | Kandidaten werden für Planmapping gebaut, aber Direct Runtime scoret weiterhin separat |
| LegalAction-Auswahl | Ja | Nein, echte Auswahl | Ja | `chooseSemanticRuntimeAction` `index.ts:3273`; mapped choice `index.ts:3389`; revalidate/apply `multiplayer.ts:2626` | Bei No-Plan oder Reactive-Choice fällt die KI auf direkte LegalAction-Bewertung zurück |

## Wichtigste Deltas

### Hoch: Live-DeckDoctrine ist noch nicht das Zielbild-Deckstrategieprofil

`buildAiDecisionInput` baut aus `ownDeckSnapshot` ein `ownDeckDoctrine` (`packages/ai/src/index.ts:3144`). `buildDeckDoctrineProfile` zählt Rollen, fehlende Rollen, Unsupported-Risiken, Archetype-Tags, `planWeights`, MulliganWeights und Evidence (`packages/ai/src/deck-doctrine.ts:60` bis `:99`).

Das ist nützlich, aber es ist keine DeckDoctrine v2 aus dem Zielbild. Die Rollen kommen aus `CARD_ROLES_BY_CARD`, AI-Hint-`roles`, AI-Hint-`planRoles` und einfachen Runtime-Inferenzen (`packages/ai/src/deck-doctrine.ts:186` bis `:192`). Ein ankerloses Deck erhält im Live-Profil keine echte NeutralDoctrine, sondern über `topArchetypes` einen Fallback-Archetype wie `rig_builder` oder `glacier` (`packages/ai/src/deck-doctrine.ts:280` bis `:286`).

Delta:

- keine DeckCapabilityProfile-Schicht
- keine Strategie-Hypothesen mit Rollenstatus aus StrategySupportPairs
- keine Unterscheidung zwischen `absent_from_deck`, `present_in_deck_unseen`, `visible_or_installable`, `active`
- keine Live-NeutralDoctrine-Regel im aktuellen `AiDeckDoctrineProfile`
- keine Nutzung durch `packages/ai/src/tactical-plans.ts`

### Hoch: TacticalPlans sind live, aber noch LegalAction- und Board-getrieben

AI-PLAN-1/2 hat eine echte `TacticalPlan`-Zwischenebene eingeführt (`packages/ai/src/tactical-plans.ts:122`). `chooseSemanticRuntimeAction` baut bei nicht-reaktiven Entscheidungen `ActionSemanticCandidate`s und ruft `evaluateTacticalPlans` auf (`packages/ai/src/index.ts:3297` bis `:3308`). Der ausgewählte PlanStep wird anschließend auf vorhandene LegalActions gemappt (`packages/ai/src/tactical-plans.ts:368`).

Der Planbuilder selbst arbeitet aber vor allem aus aktuellen LegalActions und sichtbaren Server-/Rig-/Credit-Informationen:

- Runner-Pläne entstehen aus aktuellen Remote-/Central-Run-Actions (`packages/ai/src/tactical-plans.ts:566` bis `:583`).
- Breaker-Blocker entstehen aus sichtbarer rezzter ICE und sichtbarem Rig (`packages/ai/src/tactical-plans.ts:1129` bis `:1142`).
- Bank-Pläne erkennen Actions über Labels wie "auf broker legen" und "von broker nehmen" (`packages/ai/src/tactical-plans.ts:1232` bis `:1248`).
- Corp-Score-Pläne entstehen aus aktuell legalem `score_agenda`/`advance_card` (`packages/ai/src/tactical-plans.ts:899` bis `:947`).

Delta:

- Kein `TacticalGoalState` als produktive Vorstufe.
- Keine DeckDoctrine-/DeckCapability-Inputs im Planbuilder.
- Kein abstrakter Score-Window-Plan `install root -> protect -> rez reserve -> advance -> score`; live sind nur aktuell legale Score-/Advance-/Rez-Schritte modelliert.
- Kein robustes PlanBlocker-Set für `missing_mu`, `target_unreachable`, echte `too_expensive`-Blocker oder Suchreichweite.

### Hoch: ActionSemanticCandidate ist noch nicht die einheitliche Live-Semantikquelle

`ActionSemanticCandidate` enthält genau die gewünschte Projektionsoberfläche: Source, Ability, Semantiktyp, Taktiksignale, Strategie-Support, Conditions, Risks, Constraints, Cost, Timing und TargetContext (`packages/ai/src/action-semantic-candidate.ts:205` bis `:239`).

Im aktuellen Planpfad wird der Builder aufgerufen (`packages/ai/src/index.ts:3303`), aber ohne `selectedTargetsByActionId`, `availableTargetsByActionId` und ohne `cardSemanticProfilesByCardId`. Dadurch sind Basic-Action-Semantik, Source/Ability soweit aus `LegalAction` ableitbar, Cost und Timing verfügbar; der wichtige Card-/Ability-Semantik-Join aus `applyCardSemanticJoin` (`packages/ai/src/action-semantic-candidate.ts:1368`) wird live nicht gefüttert.

Die direkte Semantic Runtime berechnet außerdem weiter eigene `SemanticRuntimeChoice`s und Score-Komponenten (`packages/ai/src/index.ts:3429` bis `:3454`). Bei reaktiven Actions wird PlanRuntime bewusst übersprungen (`packages/ai/src/index.ts:3287` bis `:3300`).

Delta:

- Nicht jede Liveentscheidung basiert auf `ActionSemanticCandidate`.
- Kandidaten sind Mapping-Hilfe, nicht die einzige Scoring-Wahrheit.
- `activated_card_ability`/`trigger_ability` bleiben bei fehlender AbilityRef oft `ability_unresolved`.
- TargetProfiles und StrategySupportPairs sind im Liveplan nicht zuverlässig verfügbar.

### Mittel: PlanMemory existiert, ist aber lokal und zu grob isoliert

AI-PLAN-2 ergänzt ein kleines `TacticalPlanMemorySnapshot` (`packages/ai/src/tactical-plans.ts:154`) und speichert ihn in einer Modul-Map (`packages/ai/src/tactical-plans.ts:193`). Die Fortschreibung hebt gleiche Planlinien stark an (`previous_plan_continuity` +80, `packages/ai/src/tactical-plans.ts:301` bis `:331`) und lässt opportunistische Central-Runs nach TTL auslaufen (`packages/ai/src/tactical-plans.ts:332` bis `:350`).

Der Schlüssel ist aber nur `${input.profileId}:${input.side}` (`packages/ai/src/tactical-plans.ts:297` bis `:299`). Der Server-Default für `profileId` ist je Seite/Schwierigkeit stabil (`apps/server/src/multiplayer.ts:2619` bis `:2624`), nicht match-spezifisch. Damit kann die PlanMemory-Linie in einer laufenden Node-Instanz theoretisch über Matches mit gleichem Profil/Side nachwirken. Der Snapshot enthält keine Hidden-Info-Kartendaten, aber er kann Verhalten verfälschen.

Delta:

- keine serverpersistente, matchgebundene PlanMemory
- keine explizite Invalidierung bei Matchwechsel
- keine Rekonstruktion aus PublicEvents plus Match-Kontext
- keine Tests für Match-Isolation des PlanMemory-Schlüssels

### Mittel: Direct Runtime Ranking bleibt Action-Score-Heuristik

Wenn ein PlanStep auf LegalActions mappt, wählt `tacticalPlanMappedChoice` aus den bereits nach Semantic-Runtime-Score sortierten Choices (`packages/ai/src/index.ts:3389` bis `:3402`). Die Score-Komponenten stammen weiter aus `semanticRuntimeScoreBreakdown` (`packages/ai/src/index.ts:3941`) und lokalen Funktionen wie `semanticRuntimeRunnerScoreComponents` (`packages/ai/src/index.ts:4215`) oder `semanticRuntimeCorpScoreComponents` (`packages/ai/src/index.ts:4902`).

Das ist pragmatisch und funktioniert für erste Pläne. Es ist aber noch nicht die Zielarchitektur "TacticalGoal -> PlanStep -> semantisch verstandene LegalActions -> Auswahl". Die finale Aktion wird weiterhin stark durch generische Action-Type-Prioritäten, Rollenheuristiken, Cost-Penalty und spezielle Score-Komponenten geprägt.

## Was bereits gut umgesetzt ist

- Die Engine bleibt Regelautorität: Der Server baut AI-Input, ruft `chooseAiAction`, sucht die gewählte Action erneut in aktuellen LegalActions und führt `applyAction` aus (`apps/server/src/multiplayer.ts:2626` bis `:2640`).
- `ActionSemanticCandidate` hat ein belastbares Schema für Source, Ability, Target, Cost, Timing, Conditions, Risks, Constraints und HardGates.
- `TacticalPlan`/`PlanStep` ist als echte Zwischenebene vorhanden, mit Lifecycle, Target, RequiredCapabilities, Blockers, ScoreBreakdown und Debug.
- PlanStep-to-LegalAction-Mapping ist vorhanden und side-safe auf vorhandene Engine-LegalActions beschränkt.
- Die acht im Auftrag genannten ersten Plantypen sind als `TacticalPlanType` vorhanden (`packages/ai/src/tactical-plans.ts:23` bis `:31`).
- Breaker-Coverage-Blocker und sichtbare ICE-Coverage-Differenzierung sind umgesetzt.
- Opportunistic-Central-TTL und Rückkehr zum Coverage-Plan sind testgedeckt.
- Broker-/Bank-Aufbau und Cashout werden als eigene Runner-Pläne erkannt und stabilisiert.
- Reaktive Fenster bleiben hart priorisiert und überspringen PlanRuntime bewusst, was für Access, Choice, Encounter und Pflichtfenster sinnvoll ist.

## Was noch fehlt

### Matchstart-Deckanalyse und DeckCapabilityProfile

Es gibt eine Deckanalyse aus eigenem Snapshot, aber kein DeckCapabilityProfile mit:

- Breaker-Coverage-Matrix nach ICE-Klasse
- Economy-/Bank-Karten als Build-/Cashout-Capability
- Suchkarten und Suchreichweite
- Memory/MU-Kapazität und installierbare Programme
- Remote-/Central-Plananker
- Status `im Deck vorhanden`, `in Hand`, `installiert`, `suchbar`, `nicht erreichbar`

Aktuell erkennt die Planebene installierbare Breaker aus sichtbarer Hand/Rig und aktuelle LegalActions, nicht aus dem ganzen Deckfähigkeitsraum.

### Live-Doctrine als Zielmodell

Das live genutzte `AiDeckDoctrineProfile` ist kein echtes Zielmodell aus Strategieankern. Es ist ein nützliches Rollen-/PlanWeights-Profil, aber keine `DeckDoctrine v2`. Die korrekte NeutralDoctrine-Regel existiert in `semantic-ai-core-meta.ts`, ist dort aber diagnostisch und ohne Runtime-Consumer.

### Produktive TacticalGoals

`TacticalGoalState` existiert als Meta-Schema, nicht als Live-Controller. Boardstate kann zwar faktisch Action-/Planprioritäten treiben, aber nicht als erklärbare Goal-Schicht, die Doctrine überstimmt und PlanBlocker erzeugt.

### Persistente, matchgebundene Planfortschreibung

PlanMemory ist vorhanden, aber nur pro Prozess und `profileId:side`. Es ist weder serverpersistent noch match-spezifisch gekeyt. Eine robuste Version müsste mindestens Match-ID oder Decision-ID-Kontext enthalten und bei Matchende/Neustart sauber invalidieren.

### Fähigkeitsscharfe PlanBlocker

Vorhanden sind insbesondere `missing_breaker_coverage`, `missing_credits`, `missing_legal_action`, `missing_remote_protection`, `timing_window_unavailable`, `reactive_window`. Es fehlen oder sind nicht aktiv ausmodelliert:

- `missing_mu`
- `too_expensive` als echte Planblockade statt nur Score-/Funding-Heuristik
- `target_unreachable` unabhängig von Runner-Breaker-Coverage
- `search_target_not_in_deck`
- `search_action_available_but_no_matching_target`
- `bank_empty` / `bank_capacity_missing`
- `score_window_unprotected` mit mehrzügigem Schutz-/Reserveplan

## Deckanalyse

### Wird am Matchbeginn oder vor der KI-Entscheidung ein echtes Deckstrategieprofil erstellt?

Vor der KI-Entscheidung: ja, wenn ein eigener privater Decksnapshot vorhanden ist. Der Server übergibt `record.privateDeckSnapshots?.[side]` (`apps/server/src/multiplayer.ts:2618`), und `buildAiDecisionInput` baut daraus `ownDeckDoctrine` (`packages/ai/src/index.ts:3144` bis `:3148`).

Echtes Deckstrategieprofil im Zielbild: nur teilweise. `buildDeckDoctrineProfile` liefert `archetypeTags`, `roleCounts`, `roleDensity`, `planWeights`, `mulliganWeights`, `riskFlags`, `confidence` und Evidence. Es liefert keine StrategyHypotheses, keine RoleStatusProfile, keine CapabilityMatrix und keine NeutralDoctrine.

### Welche Informationen enthält es wirklich?

Tatsächlich enthalten:

- Decksnapshot-ID, DeckHash, Side, optional Format
- Confidence
- Archetype-Tags
- RoleCounts und RoleDensity
- PlanWeights
- MulliganWeights
- RiskFlags für Unsupported/MissingRoles
- Evidence-Dichten

Nicht enthalten:

- einzelne Kartenpositionen oder Deckreihenfolge
- Fähigkeitserreichbarkeit
- Suche/Draw-Wahrscheinlichkeit
- "in deck vs. in hand vs. installed vs. searchable"
- Memory-/MU-Plan
- Strategieanker mit Rolle/Confidence/Evidence als führende Runtime-Wahrheit

### Werden Breaker, Suchkarten, Economy-/Bank-Karten, Memory, Remote-/Central-Pläne erkannt?

Teilweise:

- Breaker werden über Rollen/VisibleCard-Text und sichtbare Hand/Rig erkannt.
- Economy/Draw/Setup/Pressure fließen über Rollen und Score-Komponenten ein.
- Broker-/Bank wird im Planpfad primär über LegalAction-Labels erkannt.
- Remote-/Central-Pläne entstehen aus aktuellen Run-Actions und sichtbarem Serverwert.
- Memory/MU wird in älteren Heuristiken punktuell betrachtet, aber nicht als PlanBlocker `missing_mu` im neuen TacticalPlan-Pfad.

Nicht vorhanden ist eine vollständige DeckCapabilityProfile-Erkennung aus dem ganzen Deck.

### Wird zwischen "im Deck vorhanden", "in Hand", "installiert", "suchbar", "nicht erreichbar" unterschieden?

Nur punktuell:

- "in Hand" und "installiert" werden über `PlayerView.own.gripOrHq` und Rig sichtbar genutzt.
- "im Deck vorhanden" ist über den Snapshot indirekt zählbar, wird aber nicht als Capability-Status in TacticalPlans überführt.
- "suchbar" wird nicht deck- und target-aware modelliert; `search_for_answer` entsteht, wenn passende Actiontypen legal sind.
- "nicht erreichbar" gibt es für bekannte ICE-Pfade via `assessKnownRezzedIcePath`, nicht allgemein als Target-/Deck-Capability-Status.

### Fließt diese Deckanalyse in TacticalPlans ein?

Nicht im neuen Planbuilder. `packages/ai/src/tactical-plans.ts` referenziert `input.legalActions`, `playerView`, sichtbare Karten und `previousPlan`, aber keine `ownDeckDoctrine`. DeckDoctrine wirkt weiterhin vor allem in Legacy-/Mulligan-/Debug-Pfaden und Rollen-/Score-Heuristiken, nicht als direkter Input der neuen TacticalPlan-Erzeugung.

## Doctrine und Strategie

### Entsteht eine echte DeckDoctrine oder nur ein Live-Profil mit PlanWeights?

Live entsteht ein `AiDeckDoctrineProfile` mit PlanWeights. Die echte konzeptuelle `DeckDoctrine` aus `semantic-ai-core-meta.ts` entsteht diagnostisch in Reports/Fixtures und ist nicht produktiv.

### Wird NeutralDoctrine korrekt behandelt?

Diagnostisch ja: `buildDeckDoctrineFromProfile` setzt `neutralDoctrine` und erzeugt Support-Priorities ohne PrimaryPlan (`packages/ai/src/semantic-ai-core-meta.ts:2068` bis `:2104`).

Live nein: `topArchetypes` fällt bei leeren Scores auf einen Archetype-Fallback zurück (`packages/ai/src/deck-doctrine.ts:280` bis `:286`). Das ist kein echtes NeutralDoctrine-Verhalten.

### Werden Strategieanker/Rollen ausgewertet oder nur alte Rollen/Heuristiken?

Live überwiegend alte Rollen/Heuristiken:

- `deck-doctrine.ts` kombiniert Card-Role-Manifest, Hint-`roles`, Hint-`planRoles` und Runtime-Inferenzen.
- Direct Semantic Runtime nutzt `rolesForAction` und `rolesForCardId`.
- `ActionSemanticCandidate.strategySupport` existiert, wird aber im normalen Live-Planaufruf nicht mit CardSemanticProfiles befüllt.

### Kann Boardstate die Doctrine überstimmen?

Faktisch ja, weil die aktuelle TacticalPlan-Erzeugung fast vollständig aus Boardstate/LegalActions entsteht. Architekturkonzeptionell noch nicht: Es gibt keine produktive Doctrine -> TacticalGoal -> PivotRule-Schicht. Die Meta-Datei enthält Boardstate-Pivot-Beispiele, aber sie sind diagnostisch.

## TacticalGoals und TacticalPlans

### Gibt es live TacticalGoalState?

Nein. `TacticalGoalState` ist in `semantic-ai-core-meta.ts` vorhanden, aber der META1-Report meldet `noRuntimeConsumer: true`, `productiveUseAllowed: false` und `noRuntimeEffect: true`.

### Gibt es echte TacticalPlans?

Ja. `TacticalPlan` ist live an `chooseSemanticRuntimeAction` angebunden. Die Planebene wird bei nicht-reaktiven Entscheidungen evaluiert und kann die finale Action über Mapping beeinflussen.

### Gibt es PlanSteps?

Ja. `PlanStepKind` umfasst `install_breaker`, `draw_for_answer`, `search_for_answer`, `gain_credits`, `build_bank_counter`, `cash_out_bank`, `run_target`, `probe_central`, `rez_outer_ice`, `advance_score_card`, `score_agenda`.

### Gibt es PlanBlocker?

Teilweise. Das Typmodell enthält Blocker wie `missing_breaker_coverage`, `missing_credits`, `missing_legal_action`, `missing_remote_protection`, `timing_window_unavailable`, `reactive_window`. Live deutlich ausgearbeitet ist vor allem `missing_breaker_coverage` für sichtbare rezzte ICE-Pfade.

Nicht oder kaum live ausgearbeitet sind `missing_mu`, echte `too_expensive`-Blocker und allgemeines `target_unreachable`.

### Werden Pläne über mehrere Entscheidungen fortgeschrieben?

Ja, minimal: `TacticalPlanMemorySnapshot` speichert die vorherige Planlinie und `progressTacticalPlans` erhöht bei gleicher Planlinie die Priorität. Das ist ein echter Fortschritt gegenüber AI-PLAN-1.

Grenze: Memory ist in einer lokalen Map, keyed nur nach `profileId:side`, nicht match-spezifisch.

### Gibt es Rückkehr zu einem blockierten Hauptplan nach opportunistischem Alternativplan?

Ja, für den schmalen Fall `runner.opportunistic_central_run`: TTL läuft nach einer Entscheidung auf 0, danach wird bei vorhandenem `runner.obtain_breaker_coverage` die Central-Probe aufgegeben und der Coverage-/Blockerplan gewählt. Das ist in `semantic-ai-runtime-cutover.test.ts:533` bis `:604` testgedeckt.

## ActionSemanticCandidate-Nutzung

### Wird ActionSemanticCandidate im Livepfad wirklich verwendet?

Ja, aber nicht als alleinige Auswahlarchitektur. `chooseSemanticRuntimeAction` baut Kandidaten für `evaluateTacticalPlans`, und `mapPlanStepToLegalActions` nutzt sie fürs Mapping. Die Direct Runtime Choices werden aber separat aus `scoreSemanticRuntimeAction` gebaut.

### Wird jede LegalAction semantisch projiziert?

Für den Planpfad bei nicht-reaktiven Entscheidungen: ja, `buildActionSemanticCandidates` mappt alle aktuellen LegalActions.

Für den gesamten Livepfad: nein. Wenn eine reaktive Choice vorhanden ist, wird `evaluateTacticalPlans` übersprungen. Außerdem bleibt das finale Direct Ranking auch sonst auf `SemanticRuntimeChoice`-Scoring basiert.

### Werden source, ability, target, cost und timing ausreichend genutzt?

Teilweise:

- Source wird aus `abilityRef.sourceCardInstanceId`, Action-Source oder Basic/Game-Rule erkannt.
- Ability wird aus `abilityRef.abilityId`, Payload-`abilityId` oder expliziten side-safe Bindings erkannt.
- TargetContext wird side-safe projiziert, aber der Live-Aufruf übergibt keine `selectedTargetsByActionId`/`availableTargetsByActionId`.
- Cost wird aus Action-Costs und bekannten Payload-Feldern normalisiert.
- Timing wird aus `timingPoint` normalisiert.

Schema und Basistechnik sind gut. Für komplexe Kartenfähigkeiten fehlen im Livepfad noch die Card-/Ability-Semantikprofile und vollständige TargetProfile-Anbindung.

### Wo gibt es noch schema gaps?

- Ability-unresolved bei mehreren Fähigkeiten ohne AbilityRef.
- TargetContext-unavailable bei zielrelevanten Actions ohne side-safe Targetdaten.
- Card-semantics-unavailable wird im Livepfad nicht einmal zuverlässig sichtbar, weil keine Profile übergeben werden.
- Bank-/Broker-Erkennung fällt teilweise auf Labeltext zurück.
- Search-/Tutor-Actions wissen nicht, welches Ziel im Deck existiert und welches Ziel legal auswählbar wäre.

## PlanStep-to-LegalAction

### Wird eine aktuell legale Aktion als Schritt in einem Plan bewertet?

Ja. `mapPlanStepToLegalActions` mappt PlanStep und `ActionSemanticCandidate` zurück auf vorhandene LegalActions. Der Server führt danach weiterhin nur eine vorhandene Engine-Action aus.

### Oder bewertet die KI weiterhin primär LegalActions direkt?

Beides. Die neue Planebene kann die Auswahl auf gemappte Actions lenken. Innerhalb der gemappten Actions und im Fallback bewertet die Semantic Runtime weiter direkt LegalActions über Score-Komponenten.

### Welche Plantypen sind implementiert?

Alle konkret angefragten Typen existieren:

| Plantyp | Aktueller Stand | Fehlender Zielbildanteil |
| --- | --- | --- |
| `runner.obtain_breaker_coverage` | Live; install/draw/search/gain-credit je sichtbarer Lage | kein DeckCapabilityProfile, keine Search-Target-Garantie, kein MU-Blocker |
| `runner.contest_remote` | Live; Remote-Root-Wert, leere Remote abandoned, Blocker bei bekannter ICE-Coverage | kein Doctrine-/Scoreline-Ziel, kein langfristiger Remote-Plan |
| `runner.opportunistic_central_run` | Live; HQ/R&D als Probe, TTL/Rückkehr testgedeckt | TTL nur schmal, Zielwert kommt aus Direct Runtime, kein eigener Central-Plan mit Freshness-Horizon |
| `runner.build_credit_bank` | Live; Broker-/Bank-Build-Action bei stabilen Credits | label-/signalnah, kein Bankstand-/Kapazitätsmodell |
| `runner.cash_out_credit_bank` | Live; bei niedrigen Credits oder FundingNeed | kein konkreter Planbedarf mit Betrag/Horizon außer Heuristik |
| `corp.create_score_window` | Live für aktuelle `score_agenda`/`advance_card` | kein mehrzügiger Plan `build_remote -> protect -> rez reserve -> advance -> score` |
| `corp.build_credit_bank` | Live für Bank-Build-Action bei Credits >= 4 | kein Cashout-Plan, kein Score-/Rez-Bedarf als Auszahlungskopplung |
| `corp.rez_defense` | Live für `rez_ice`-Fenster | kein strategischer Rez-Plan außerhalb aktueller Rez-Fenster |

### Welche Plantypen fehlen?

Nicht zwingend neue Top-Level-Typen, aber fehlende Untermodelle:

- `DeckStartAnalysis / DeckCapabilityProfile`
- `runner.search_for_specific_capability`
- `runner.resolve_missing_mu`
- `runner.install_specific_breaker_for_server`
- `corp.build_remote`
- `corp.protect_score_remote`
- `corp.cash_out_credit_bank`
- `corp.recover_rez_reserve`
- `generic.wait_due_to_reactive_window` als expliziter Planstatus

## Beispiele

### Beispiel A: Runner muss Remote contesten, hat aber keinen passenden Icebreaker

Erwartung: `remote_contest -> missing_breaker_coverage -> obtain_breaker_coverage -> search/draw/install/gain_credit`

Aktueller Stand:

- Wird teilweise so modelliert.
- Sichtbare rezzte ICE ohne erreichbaren Access erzeugt `missing_breaker_coverage`.
- Es entstehen ein blockierter `runner.contest_remote` und ein aktiver `runner.obtain_breaker_coverage`.
- Der nächste Step wird aus sichtbarer Lage gewählt: installierbarer passender Breaker, Credits für passenden Handbreaker, Search/Event/Ability, Draw oder Gain Credit.
- Tests decken Draw und Gain-Credit für Handbreaker ab (`semantic-ai-runtime-cutover.test.ts:253`, `:279`; `tactical-plans.test.ts:168`, `:234`).

Delta:

- Die KI weiß noch nicht aus einem DeckCapabilityProfile, welche Breaker im Deck existieren.
- Suche wird nur als verfügbare Actiontyp-Klasse erkannt, nicht als target-aware Suche nach konkreter Breaker-Coverage.
- Memory/MU und konkrete Installkosten werden nur punktuell berücksichtigt.

### Beispiel B: R&D ist offen, Remote-Plan ist blockiert

Erwartung: `opportunistic_central_run` mit TTL, danach Rückkehr zum eigentlichen Blockerplan.

Aktueller Stand:

- Der schmale Kern ist umgesetzt.
- Wenn ein Remote-Run blockiert ist und HQ legal offen ist, kann `runner.opportunistic_central_run` gewählt werden (`semantic-ai-runtime-cutover.test.ts:401`).
- Nach einer Central-Probe läuft die TTL aus und die Planebene kehrt bei weiterem Blocker zu `runner.obtain_breaker_coverage` zurück (`semantic-ai-runtime-cutover.test.ts:533` bis `:604`).

Delta:

- Es gibt keine vollwertige Central-Planbewertung mit eigenem TTL-/Freshness-Horizon je HQ/R&D/Archives.
- R&D-/HQ-Wert kommt vor allem aus Direct Runtime Memory-Score-Komponenten, nicht aus einem TacticalGoal.

### Beispiel C: Broker-artige Economy-Karte

Erwartung: `build_credit_bank` in ruhigen Zügen, `cash_out_credit_bank` bei konkretem Finanzierungsbedarf.

Aktueller Stand:

- Runner-Bankaufbau und Cashout sind eigene Pläne.
- Stable Credits plus Bank-Build-Action wählen `runner.build_credit_bank`.
- Niedrige Credits oder FundingNeed wählen `runner.cash_out_credit_bank`.
- Nach stabilem Bankbuild wird sofortiger Cashout blockiert (`semanticRuntimePlanMemoryActionExclusion`, `packages/ai/src/index.ts:4031` bis `:4049`).
- Tests decken Build, Cashout und Nicht-Cashout nach Build ab (`semantic-ai-runtime-cutover.test.ts:438` bis `:531`).

Delta:

- Erkennung ist stark labelbasiert (`tactical-plans.ts:1232` bis `:1248`).
- Kein robustes Bank-Counter-/Kapazitäts-/Payout-Betragsmodell.
- FundingNeed ist noch grob: Low Credits oder Run-Kostenheuristik, nicht Planbedarf mit konkretem Betrag und Horizon.

### Beispiel D: Corp Score Window

Erwartung: `create_score_window -> build_remote / rez_defense / gain_credits / advance / score`

Aktueller Stand:

- `corp.create_score_window` existiert für aktuell legales `score_agenda` und `advance_card`.
- `corp.rez_defense` existiert für aktuelle Rez-Fenster.
- Advance auf nacktes Remote wird bei sicherer Alternative punktuell vermieden (`tactical-plans.ts:919` bis `:928`).
- `corp.rez_defense` ist testgedeckt (`semantic-ai-runtime-cutover.test.ts:607` bis `:633`).

Delta:

- Kein echter mehrzügiger Score-Window-Plan.
- Keine PlanSteps für `install agenda/root`, `install ice`, `build rez reserve`, `advance`, `score` als zusammenhängende Linie.
- Kein `corp.cash_out_credit_bank` für Score-/Rez-Bedarf.
- Boardstate-Schutz wird heuristisch bewertet, nicht als `RequiredCapability`/`PlanBlocker` über mehrere Entscheidungen.

## Konkrete Folgeaufgaben

1. **DeckStartAnalysis / DeckCapabilityProfile**

   Baue aus eigenem Decksnapshot, eigener Hand, installierten Karten, sichtbaren Set-aside-/Heap-Zonen und LegalActions ein side-safe CapabilityProfile. Mindestfelder: BreakerCoverageMatrix, SearchTargets, Economy/Bank, Memory/MU, Central-/Remote-Payoffs, RoleStatus `absent/present/visible/installable/active`.

2. **PlanMemory match-spezifisch isolieren**

   Erweitere den Memory-Key mindestens um Match-Kontext oder Decision-ID-Präfix und füge Reset/Invalidation bei Matchende oder neuem Match ein. Danach Tests für zwei parallele gleiche Profile ohne Memory-Bleed.

3. **Capability-aware `obtain_breaker_coverage`**

   Ersetze die reine LegalAction-/Hand-/Draw-Heuristik durch Mapping auf DeckCapabilityProfile: passender Breaker in Hand installieren, suchbare Coverage suchen, MU lösen, fehlende Credits beschaffen, sonst Draw. Dabei `missing_mu`, `too_expensive` und `search_target_not_available` als PlanBlocker ergänzen.

4. **ActionSemanticCandidate als einheitliche Plan-Mapping-Quelle stärken**

   Füttere den Live-Builder mit side-safe Card-/Ability-Semantic-Profilen, TargetProfile-Daten und verfügbaren Zieloptionen. Ziel: PlanStep-Mapping soll StrategySupport, Conditions, Risks, Constraints, Costs und Timing wirklich verwenden, nicht nur ActionType/Label/BasicSemantics.

5. **ScoreWindow- und Bank-Pläne mehrzügig machen**

   Erweitere zuerst schmal: Corp `create_score_window` mit Steps `build_remote`, `protect_remote`, `build_rez_reserve`, `advance`, `score`; Runner/Corp Bank-Pläne mit Bankstand, Kapazität, Payout-Betrag und konkretem Planbedarf.

## Keine Aktion

Diese Analyse hat keine Runtime-Änderung, keine neue Kartensemantik und keine neuen Taktiksignale eingebaut.

## Erwartete Verifikation

Für dieses reine Review-Artefakt sind sinnvoll:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts src/action-semantic-candidate.test.ts src/semantic-ai-core-meta.test.ts`
- `git diff --check`
