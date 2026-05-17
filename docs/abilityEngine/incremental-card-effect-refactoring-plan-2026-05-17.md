# Inkrementeller Refactoring-Plan für die Kartenlogik

Datum: 2026-05-17

Grundlage: `docs/abilityEngine/card-logic-architecture-analysis-2026-05-17.md`

Primärer Agent: `architecture-review-agent`

## Ziel und Leitplanken

Die Kartenlogik soll schrittweise von verstreuter Sonderfall-Logik zu einer deklarativen, wiederverwendbaren Card-Effect-Architektur wachsen. Das bestehende Spielverhalten bleibt währenddessen führend. Jede Änderung muss additiv, klein und mit Regressionstests abgesichert sein.

Nicht-Ziele:

- keine Komplettmigration aller Karten in einem Schritt
- keine Umbenennung oder Verschiebung großer Engine-Blöcke als erster Schritt
- keine Änderung an PublicEvent-, PlayerView- oder UI-Verträgen ohne klaren Nutzen und Tests
- kein Entfernen bestehender Sonderfälle, bevor die neue API dieselben Fälle nachweislich abdeckt

## Priorisierung

Kartentests sind als Sicherheitsnetz P0 und begleiten jede Phase. Das erste eigentliche Architektur-Refactoring sollte die Cost-Pipeline sein: Sie adressiert mehrere konkrete Fehlerklassen, kann zunächst nur als Wrapper um bestehende Funktionen eingeführt werden und muss das State-Modell nicht anfassen. Das ActiveModifier-System ist fachlich ebenso wichtig, greift aber tiefer in Run-, Encounter- und Turn-Cleanup ein und ist deshalb riskanter.

| Priorität | Bereich | Nutzen | Risiko | Begründung |
| --- | --- | --- | --- | --- |
| P0 | Kartentests | sehr hoch | niedrig | Verhindert Regressionen während jeder Migration. Bestehende Hotfix-Fälle liefern klare Testanker. |
| P1 | Cost-Pipeline | sehr hoch | niedrig bis mittel | Olivia, Rez-Modifier, Startup Immolator, Access-Trash und Installkosten zeigen direkte Nutzenfläche. Kann additiv eingeführt werden. |
| P2 | ActiveModifier-System | hoch | mittel | MRAM, Krash, Virizz, ICE-Strength und Handlimit brauchen gemeinsames Modell. Höheres Risiko wegen StateHash und Cleanup. |
| P3 | Reveal-/Chronik-Kopplung | hoch | niedrig bis mittel | Wall of Ice zeigt guten Pfad über `ResolvedGameEffect`; Corporate Negotiating Center zeigt verbleibende Payload-Sonderfälle. |
| P4 | Target Binding | mittel bis hoch | mittel | Restrictive Net Zoning ist guter Pilot; berührt PlayerView, Action-ID, Persistenz und UI. |
| P5 | EffectCommand-/EffectExecutor-Ausbau | hoch | mittel | Fundament für deklarative Effekte, aber der produktive Code nutzt heute viele direkte Engine-Helfer. |
| P6 | Trigger Registry | hoch | hoch | Wichtiges Zielmodell, aber erst sinnvoll, wenn Kosten, Modifier, Targets und Effekte stabiler sind. |

## P0: Kartentests als Sicherheitsnetz

### Aktuelle relevante Dateien und Funktionen

- `packages/engine/src/index.test.ts`
- `apps/web/app/chronicle.test.ts`
- `apps/web/app/action-board-ui.test.ts`
- `tests/specs/visibility-contract.test.ts`
- Engine-Funktionen: `getLegalActions`, `applyAction`, `performAction`, `replayEvents`, `hashState`, `getPlayerView`

### Schwäche im Ist-Zustand

Die Tests enthalten bereits viele Regressionen, aber sie sind historisch nach Releases und Hotfixes gewachsen. Für Refactoring fehlt noch ein enger, wiederverwendbarer Teststandard je Kartenfamilie:

- LegalAction erscheint im richtigen Timing.
- Kosten werden in LegalAction und `applyAction` gleich berechnet.
- Quelle, Ziel und StateVersion werden revalidiert.
- PublicPayload/PlayerView leaken keine Hidden Info.
- Replay/StateHash bleibt stabil.
- Chronik zeigt typisierte Effektauflösung korrekt.

### Zielstruktur

Ein kleines Test-Raster pro Migrierungsphase:

- `engine`: Action-Erzeugung, Affordability, Bezahlung, Revalidation, StateHash
- `web`: Kostenchips, Zielnamen, Chronik
- `visibility`: PlayerView/PublicEvent ohne Hidden-Info-Leak

### Minimale erste Änderung

Vor der Cost-Pipeline-Migration Tests für die Pilotkarten als Baseline absichern:

- Olivia Salazar:
  - reduzierte Rez-Aktion erscheint, wenn normale Rez-Kosten unbezahlbar wären.
  - normale Rez-Aktion bleibt korrekt, wenn die Corp die normalen Kosten zahlen kann.
- Fortress Architects oder Jerusalem City Grid: globale beziehungsweise servergebundene Rez-Kostenreduktion bleibt unverändert.
- Startup Immolator: zahlt exakt Ziel-ICE-Rez-Kosten.
- Loan from Chiba: optionaler Zusatzguard, nur wenn der Test schnell und stabil formulierbar ist; für den P1-Cost-Pipeline-Pilot ist Loan kein Kernfall.

### Risiken

- Testfixtures können zu stark auf konkrete Action-Labels statt Verträge prüfen.
- Zu breite E2E-Tests verlangsamen Refactoring.

### Notwendige Tests

- `corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Olivia Salazar|Fortress Architects|Startup Immolator|Loan from Chiba"`
- `corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts app/chronicle.test.ts -t "Olivia Salazar|Startup Immolator|Loan from Chiba"`
- Nach jeder Phase: `corepack pnpm --filter @netgrid/engine typecheck`, betroffene Web-Typechecks und `git diff --check`

### Beispielkarten

- `onr_v1_363_olivia-salazar`
- `onr_v1_324_fortress-architects`
- `onr_v1_360_jerusalem-city-grid`
- `onr_v1_068_startup-immolator`
- `onr_v1_168_loan-from-chiba`

## P1: Cost-Pipeline als erster Architektur-Schnitt

### Aktuelle relevante Dateien und Funktionen

- `packages/shared/src/index.ts`
  - `Cost`
  - `LegalAction`
  - `TargetRequirement`
- `packages/engine/src/index.ts`
  - `corpApproachActions`
  - `rezCostForCard`
  - `rezCostReductionSourceDefinitionIdsFor`
  - `rezCard`
  - `effectiveAccessTrashCost`
  - `spendRunnerAccessTrashCredits`
  - `spendRunnerInstallCredits`
  - `spendRunnerRunCredits`
  - `runnerEncounterActions`
  - `runnerMainActions`
  - `corpMainActions`
  - `action`
- `apps/web/app/action-board-ui.ts`
  - `actionCostChips`
  - `withActionCostPrefix`
  - `installContextLabel`

Hinweis: `packages/engine/src/mechanics/payment-costs.ts` existiert bereits, enthält aber aktuell Economy-Asset-Profile und keine allgemeine Cost-Pipeline. Für die neue Pipeline ist ein klarer neuer Pfad besser, zum Beispiel `packages/engine/src/ability-engine/cost-pipeline.ts`.

### Konkrete Schwäche im Ist-Zustand

Kosten werden mehrfach und je Familie anders verarbeitet:

- normale ICE-Rez-Kosten über `rezCostForCard`
- Olivia-Sonderkosten lagen vor dem P1-Pilot in einem eigenen Sonderpfad und sollen nun über `quoteCorpRezCost(..., { oliviaSalazarSourceCardId })` laufen.
- tatsächliche Bezahlung in `rezCard`
- Runner-Installkosten über `spendRunnerInstallCredits`
- Run-Kosten über `spendRunnerRunCredits`
- Access-Trash-Kosten über `effectiveAccessTrashCost` und `spendRunnerAccessTrashCredits`
- UI-Kostenanzeige über `LegalAction.costs`

Dadurch können Action-Erzeugung, Bezahlbarkeit, Anzeige und `applyAction`-Revalidierung auseinanderlaufen. Olivia Salazar war der konkrete Fehleranker.

### Zielstruktur

Eine zentrale Pipeline erzeugt zuerst ein unverbindliches, temporäres Kostenangebot. `CostQuote` ist kein persistenter Vertrag und darf nicht als vollständiges Objekt in `LegalAction.payload`, `GameState`, `PublicEvent` oder `PlayerView` gespeichert werden.

Die Quote dient nur dazu,

- `LegalAction.costs` zu erzeugen,
- bestehende kompatible PublicPayload-Felder zu befüllen,
- die UI-Kostenanzeige stabil zu halten,
- und bei `applyAction`/`rezCard` aus dem aktuellen `GameState` neu berechnet zu werden.

Beim Ausführen einer Action muss die Quote immer neu aus dem aktuellen State berechnet und revalidiert werden. Eine alte `LegalAction` darf nicht allein deshalb akzeptiert werden, weil sie früher einmal legal war.

Das Zielbild für die Typen:

```ts
export type CostPurpose =
  | "corp_rez"
  | "runner_install"
  | "runner_run"
  | "access_trash"
  | "tag_remove"
  | "ability";

export type CostModifierQuote = {
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  label: string;
  amount: number;
  kind: "reduction" | "increase" | "alternate_payment" | "restricted_credit";
};

export type CostQuote = {
  purpose: CostPurpose;
  side: Side;
  source?: CardInstanceId | "basic_action" | "game_rule";
  targetCardId?: CardInstanceId;
  baseCredits: number;
  finalCredits: number;
  costs: Cost[];
  modifiers: CostModifierQuote[];
  canPay: boolean;
  publicPayload: Record<string, string | number | boolean>;
};

export type CorpRezCostOptions = {
  oliviaSalazarSourceCardId?: CardInstanceId;
};
```

Später soll die Pipeline Zahlungsquellen und Spend-Pläne modellieren können. Das gehört ausdrücklich nicht in den P1-Pilot, solange Olivia Salazar, Fortress Architects und Jerusalem City Grid ohne neue Payment-Source-API stabil bleiben:

```ts
export type PaymentSourceQuote = {
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  kind: "credit_pool" | "recurring_credit" | "restricted_credit" | "alternate_cost";
  amountAvailable: number;
  restrictionLabel?: string;
};

export type CostSpendPlan = {
  creditsFromPool: number;
  paymentsFromSources: PaymentSourceQuote[];
};
```

Erste konkrete Funktionen:

```ts
quoteCorpRezCost(state, iceId, options?)
quoteRunnerInstallCost(state, cardId, options?)
quoteRunnerRunCreditCost(state, amount, sourceCardId?)
quoteAccessTrashCost(state, accessedCardId)
assertCorpRezCostQuoteValid(state, iceId, legalAction)
payCostQuote(state, quote)
```

### Minimale erste Änderung

Nur Corp-ICE-Rez-Kosten migrieren:

1. Neue Datei `packages/engine/src/ability-engine/cost-pipeline.ts`.
2. `quoteCorpRezCost(state, iceId, { oliviaSalazarSourceCardId?: CardInstanceId })` einführen.
3. Intern weiter die bestehenden Funktionen nutzen:
   - `rezCostForCard`
   - `rezCostReductionSourceDefinitionIdsFor`
   - `oliviaSalazarRezSourcesForRunIce`
4. `corpApproachActions` erzeugt normale und Olivia-Rez-Actions aus `CostQuote.costs` und `CostQuote.publicPayload`.
5. `rezCard` revalidiert bei Olivia und normalem Rez über denselben Quote.
6. Keine Änderung an `LegalAction`-Shape im ersten Commit.

Damit bleibt das Verhalten gleich, aber der erste zentrale Pfad existiert.

Wichtig gegen neue Doppelwahrheit:

- Im Pilot wrappt `quoteCorpRezCost` nur bestehende Engine-Logik:
  - `rezCostForCard` bleibt die interne Quelle für die aktuell gültigen normalen Rez-Kosten.
  - `rezCostReductionSourceDefinitionIdsFor` bleibt die Quelle für die vorhandenen Reduktionsquellen im Payload.
  - `oliviaSalazarRezSourcesForRunIce` bleibt die Quelle für erlaubte Olivia-Quellen.
  - Ein eigener `oliviaSalazarRezCostForCard`-Sonderpfad soll nicht als dauerhafte zweite Wahrheit bestehen; falls er temporär bleibt, muss er dieselbe Berechnung wie `quoteCorpRezCost(..., { oliviaSalazarSourceCardId })` liefern und darf keine produktive Call Site mehr besitzen, sobald die Quote angebunden ist.
- Bereits im P1-Pilot auf Quote umgestellt werden:
  - `corpApproachActions` für normale Corp-ICE-Rez-Actions im Approach-Fenster.
  - `corpApproachActions` für Olivia-Salazar-Rez-Actions.
  - `rezCard` für die Revalidation von `rez_ice`-Actions aus diesen LegalActions.
- Bewusst noch nicht migriert werden:
  - Runner-Installkosten und `spendRunnerInstallCredits`.
  - Runner-Runkosten und `spendRunnerRunCredits`.
  - Access-Trash-Kosten und `spendRunnerAccessTrashCredits`.
  - Ability-Kosten, Klickkosten, Trash-as-cost, Agenda-Point-Kosten und alternative Kosten.
  - UI-Verträge, `PlayerView`, `PublicEvent` und Chronicle-Formate.
- Alte Sonderpfade dürfen erst reduziert werden, wenn die Quote-Erzeugung und `rezCard`-Revalidation durch Tests für normale Rez-Kosten, Olivia, Fortress Architects, Jerusalem City Grid und Startup Immolator abgesichert sind und `git diff` keine unbeabsichtigten PublicPayload- oder Action-ID-Änderungen zeigt.

### Risiken

- `rezCostForCard` und `quoteCorpRezCost` könnten temporär doppelte Wahrheit werden.
- Action-IDs hängen an Payload-Feldern; Payload darf nicht unnötig verändert werden.
- Revalidation in `rezCard` darf keine legalen historischen Fälle blockieren.
- StateHash darf sich durch reine Quote-Erzeugung nicht ändern.

### Harte Leitplanken für P1

- `CostQuote` ist ein berechnetes Angebot, kein State-Vertrag.
- `CostQuote` wird nicht vollständig in `LegalAction.payload` gespeichert.
- `CostQuote.publicPayload` darf nur bestehende, öffentliche und getestete Payload-Felder erzeugen:
  - `rezCostPaid`
  - `rezCostReductionAmount`
  - `rezCostReductionSourceDefinitionIds`
  - `oliviaSalazarRezSourceCardId`
  - `oliviaSalazarRezSourceDefinitionId`
  - `oliviaSalazarRezCostBase`
  - `oliviaSalazarTemporaryDerez`
- Neue Payload-Felder sind im P1-Pilot nicht erlaubt, außer sie sind zwingend nötig und durch Engine-, Web- und Visibility-Tests abgesichert.
- Vor jeder Payload-Änderung muss geprüft werden:
  - Bleiben vorhandene Action-IDs stabil?
  - Ändert sich Sortierung oder Duplikaterkennung von `LegalActions`?
  - Gibt es Reconnect-, Replay- oder StateVersion-Nebenwirkungen?
  - Werden UI-Tests dadurch instabil?
- Falls eine Action-ID-Änderung unvermeidlich ist, muss sie im Committext begründet und durch Regressionstests abgesichert werden.
- Quote-Funktionen sind rein berechnend: `quoteCorpRezCost(state, iceId, options)` verändert keinen `GameState`, keine `RunState`-Felder, keine `CardInstance`, keine PublicPayload, keine replay-relevanten Daten und keinen StateHash.
- P1 enthält keine ActiveModifier-State-Migration, keine Trigger Registry, keine EffectCommand-Komplettmigration, kein Target Binding, keinen Reveal-/Chronik-Umbau, keine Runner-Installkosten, keine Access-Trash-Kosten, keine Ability-Kosten und keine UI-Vertragsänderung.

### Revalidation in `rezCard`

`rezCard` beziehungsweise `assertCorpRezCostQuoteValid` muss beim Ausführen neu aus dem aktuellen `GameState` prüfen:

- Ziel-ICE existiert noch.
- Ziel-ICE ist weiterhin das aktuell relevante ICE im aktuellen Timing-Fenster.
- ICE ist weiterhin rezbar.
- Die Corp kann die neu berechneten `finalCredits` zahlen.
- `legalAction.costs[0]?.credits` entspricht der neu berechneten Quote.
- Bei Olivia:
  - Olivia-Source existiert noch.
  - Olivia-Source ist noch gültig, rezzed und aktiv.
  - Olivia darf in diesem Run noch verwendet werden.
  - Run-Kontext und angegriffener Server passen weiterhin.
  - temporäres Derez-Verhalten am Run-Ende bleibt unverändert.
- Normale Rez-Reduktionen wie Fortress Architects und Jerusalem City Grid bleiben korrekt berücksichtigt.
- Ungültige oder manipulierte Payload-Source-IDs werden abgelehnt.

### Notwendige Tests

- P0-Baseline vor Produktionscode:
  - Olivia Salazar: reduzierte Rez-Action erscheint, wenn normale Rez-Kosten unbezahlbar wären.
  - Olivia Salazar: normale Rez-Action bleibt korrekt, wenn bezahlbar.
  - Fortress Architects oder Jerusalem City Grid: globale beziehungsweise servergebundene Rez-Reduktion bleibt unverändert.
  - Startup Immolator: zahlt weiterhin exakt die Ziel-ICE-Rez-Kosten.
  - Loan from Chiba: optional, nur wenn schnell stabil formulierbar.
- P1 nach Quote-Einführung:
  - `quoteCorpRezCost` mutiert State nicht:

```ts
const beforeHash = hashState(state);
const beforeState = structuredClone(state);
const quote = quoteCorpRezCost(state, iceId, options);
expect(hashState(state)).toBe(beforeHash);
expect(state).toEqual(beforeState);
```

  - normale Rez-Quote entspricht bisheriger `rezCostForCard`-Logik.
  - Olivia-Quote nutzt `oliviaSalazarSourceCardId` als eindeutigen Source-Identifier.
  - `corpApproachActions` erzeugt dieselben sichtbaren Kosten wie vorher.
  - `rezCard` revalidiert aus dem aktuellen State und akzeptiert keine veraltete oder manipulierte Quote.
  - falsche Olivia-Quelle wird abgelehnt.
  - Olivia-Nutzung ist nur einmal pro Run möglich.
  - temporäres Derez am Run-Ende bleibt unverändert.
  - Fortress-/Jerusalem-Reduktionen bleiben korrekt.
  - Startup Immolator bleibt als Guard unverändert.

### Beispielkarten

- Pilot 1: `Olivia Salazar`
- Pilot 2: `Fortress Architects`
- Pilot 3: `Jerusalem City Grid`
- Guard: `Startup Immolator`

## P2: ActiveModifier-System

### Aktuelle relevante Dateien und Funktionen

- `packages/shared/src/index.ts`
  - `ModifierDefinition`
  - `RunState`-Felder wie `breakSubroutineAdditionalCost`, `futureEncounterIceStrengthBonus`, `remainderStrengthBonusByBreaker`, `oliviaSalazarTemporaryRezzedIceIds`
- `packages/engine/src/index.ts`
  - `maxHandSize`
  - `runnerInstalledMaxHandSizeModifier`
  - `corpAgendaMaxHandSizeModifier`
  - `iceStrengthFor`
  - `runRemainderStrengthBonusForBreaker`
  - `runnerEncounterActions`
  - `performAction/pump_breaker`
  - `continueRun`
  - `finishRun`
  - `resetBreakerStrength`

### Konkrete Schwäche im Ist-Zustand

Modifier sind je Mechanik anders gespeichert:

- MRAM: `maxHandSizeBonus` auf `CardDefinition`, ausgewertet in `runnerInstalledMaxHandSizeModifier`.
- Krash: `run.remainderStrengthBonusByBreaker`.
- normale Breaker-Pumps: `CardInstance.strengthModifier`, Cleanup über `resetBreakerStrength`.
- Virizz: `run.breakSubroutineAdditionalCost`.
- Tutor/Future-ICE-Strength: `run.futureEncounterIceStrengthBonus`.
- Olivia: `run.oliviaSalazarTemporaryRezzedIceIds`.

Dadurch ist jede Laufzeit anders: encounter, run, turn, while-installed und while-rezzed sind nicht zentral modelliert.

### Zielstruktur

Ein aktiver Modifier-Store, zunächst engine-intern:

```ts
export type ActiveModifierDuration =
  | "encounter"
  | "run"
  | "turn"
  | "while_installed"
  | "while_rezzed"
  | "game";

export type ActiveModifierKind =
  | "max_hand_size"
  | "ice_strength"
  | "breaker_strength"
  | "rez_cost"
  | "install_cost"
  | "trash_cost"
  | "break_subroutine_cost"
  | "jack_out_cost";

export type ActiveModifier = {
  id: string;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  kind: ActiveModifierKind;
  side?: Side;
  amount: number;
  duration: ActiveModifierDuration;
  target?: {
    kind: "card" | "server" | "subtype" | "side" | "run";
    id?: string;
    subtype?: string;
  };
  visibility: EventVisibilityClass;
};
```

### Minimale erste Änderung

Nicht sofort den State umbauen. Zuerst eine reine Query-Schicht:

1. Neue Datei `packages/engine/src/ability-engine/active-modifiers.ts`.
2. Funktion `collectActiveModifiers(state): ActiveModifier[]`.
3. Diese Funktion rekonstruiert bestehende Modifier aus dem aktuellen State, ohne State-Shape zu ändern.
4. Pilot-Abfragen:
   - `maxHandSize` nutzt weiterhin bestehende Berechnung, aber Test prüft, dass `collectActiveModifiers` MRAM/Main-Office abbildet.
   - `runRemainderStrengthBonusForBreaker` bleibt aktiv, aber `collectActiveModifiers` bildet Krash ab.
5. Erst im zweiten Schritt einzelne Berechnungen auf `sumActiveModifiers` umstellen.

### Risiken

- Direkte Persistenz in `GameState` würde Replay/StateHash sofort betreffen. Deshalb zuerst nur rekonstruierende Query-Schicht.
- Doppelzählung möglich, wenn bestehende Berechnung und neue Modifier-Summe parallel wirken.
- UI könnte Modifier anzeigen wollen, bevor Sichtbarkeitsregeln sauber sind.

### Notwendige Tests

- MRAM:
  - Handgröße steigt in PlayerView.
  - `collectActiveModifiers` enthält `max_hand_size +2`.
- Krash:
  - runweiter Pump bleibt bis Run-Ende.
  - Query-Schicht enthält `breaker_strength` mit `duration: "run"`.
- Virizz:
  - Break-Kostenmodifikator bleibt rest-of-run.
  - Query-Schicht bildet `break_subroutine_cost` ab.

### Beispielkarten

- `MRAM Chip`
- `Militech MRAM Chip`
- `Krash`
- `Virizz`
- `Main-Office Relocation`

## P3: Reveal-/Chronik-Kopplung

### Aktuelle relevante Dateien und Funktionen

- `packages/shared/src/index.ts`
  - `ResolvedGameEffect`
  - `ResolvedGameEffectKind`
- `packages/engine/src/index.ts`
  - `buildEvent`
  - `publicContextForAction`
  - `appendResolvedSubroutineEffect`
  - `startCorporateNegotiatingCenterChoice`
  - `resolveCorporateNegotiatingCenterChoice`
  - `revealCorpRdTop`
  - `redactPublicEventForSide`
- `packages/engine/src/mechanics/public-payload-schema.ts`
  - `buildPublicAbilitySchemaContext`
- `apps/web/app/chronicle.ts`
  - `formatChronicleEvent`
  - `formatChronicleEffectItems`
  - `resolvedEffectsFromPayload`

### Konkrete Schwäche im Ist-Zustand

Wall of Ice nutzt bereits `ResolvedGameEffect` für einzelne Subroutinen. Corporate Negotiating Center nutzt dagegen einen Payload-Sonderfall mit `hiddenZoneAction`, `publicRevealDefinitionIds`, `publicRevealTitles`, `revealedCount` und eigener Chroniklogik.

Damit muss jede neue Reveal-Karte UI- und Chronikfelder korrekt setzen. Das ist fehleranfällig.

### Zielstruktur

Reveal wird als Effekt modelliert:

```ts
type RevealCardsEffect = ResolvedGameEffect & {
  kind: "reveal_cards";
  zone: "hq" | "rd" | "archives" | "grip" | "stack";
  revealedDefinitionIds: CardDefinitionId[];
  revealedTitles?: string[];
  revealKind: "reveal" | "expose" | "access";
};
```

Die Chronik liest bevorzugt `resolvedEffects`, nicht `hiddenZoneAction`.

### Minimale erste Änderung

1. `ResolvedGameEffectKind` um `reveal_cards` erweitern.
2. Helper `publicRevealCardsEffect(...)` in der Engine anlegen.
3. `resolveCorporateNegotiatingCenterChoice` schreibt zusätzlich zum bestehenden Payload ein `resolvedEffects`-Element.
4. `apps/web/app/chronicle.ts` bekommt einen generischen `reveal_cards`-Formatter.
5. Bestehende Payload-Felder bleiben als Übergang erhalten.

### Risiken

- Hidden-Info-Leak durch versehentlich zu viele Reveal-IDs.
- Doppelte Chronik, wenn altes Payload-Sonderformat und neuer Effekt beide dargestellt werden.
- AI/PublicPayload-Sanitizer muss `ResolvedGameEffect` korrekt behandeln.

### Notwendige Tests

- Corporate Negotiating Center:
  - Runner sieht nur gezeigte Agendas.
  - Chronik zeigt generischen Reveal-Effekt.
  - nicht gezeigte HQ-Karten bleiben verborgen.
- Wall of Ice:
  - bestehende Subroutine-Chronik bleibt unverändert.
- Security Purge oder Ice Pick Willie:
  - R&D-Reveal bleibt side-sicher.

### Beispielkarten

- `Corporate Negotiating Center`
- `Wall of Ice`
- `Security Purge`
- `Ice Pick Willie`

## P4: Target Binding

### Aktuelle relevante Dateien und Funktionen

- `packages/shared/src/index.ts`
  - `TargetRequirement`
  - `CardInstance.selectedServerId`
  - `VisibleCard.selectedServerId`
  - `VisibleCard.selectedServerLabel`
- `packages/engine/src/index.ts`
  - `runnerMainActions`
  - `restrictiveNetZoningInstallTax`
  - `performAction/install_card`
  - `serverChoiceDisplayLabel`
  - `visibleOwnCard`
  - `makeActionId`
- `apps/web/app/action-board-ui.ts`
  - `installContextLabel`
- `apps/web/app/page.tsx`
  - `selectedServerLabel`
  - `cardDetailLines`

### Konkrete Schwäche im Ist-Zustand

Restrictive Net Zoning ist aktuell sauber repariert, aber der Pfad ist speziell:

- Action-Payload enthält `selectedServerId` und `selectedServerLabel`.
- `performAction/install_card` prüft genau diese Karte.
- `CardInstance.selectedServerId` ist generisch benannt, aber fachlich nur wenige Karten nutzen es.
- PlayerView erzeugt `selectedServerLabel` nur für `onr_v1_173_restrictive-net-zoning`.

Neue Karten mit Zielbindung würden erneut Sonderlogik brauchen.

### Zielstruktur

Ein generisches Bound-Target-Modell:

```ts
export type BoundTarget = {
  id: string;
  sourceCardInstanceId: CardInstanceId;
  kind: "server" | "card" | "subroutine" | "side";
  value: string;
  publicLabel?: string;
  visibility: EventVisibilityClass;
  createdAtStateVersion: number;
};
```

Kurzfristig kann `CardInstance.selectedServerId` bestehen bleiben. `BoundTarget` wird zunächst daraus rekonstruiert.

### Minimale erste Änderung

1. Neue Query-Funktion `boundTargetsForCard(state, cardId)`.
2. Für Restrictive Net Zoning gibt diese Funktion ein `server`-Target zurück.
3. `visibleOwnCard` nutzt die Query statt direkter Card-ID-Prüfung.
4. `restrictiveNetZoningInstallTax` bleibt zunächst unverändert.

### Risiken

- PlayerView-Vertrag darf nicht brechen.
- Action-ID-Stabilität hängt an `selectedServerId`.
- Remote-Server-Labels dürfen keine Hidden-Info über installierte Karten leaken.

### Notwendige Tests

- Restrictive Net Zoning:
  - zentrale Server und Remote Server zeigen Labels.
  - Zielbindung bleibt nach Reconnect sichtbar.
  - Tax wirkt nur auf gewählten Server.
- Security Net Optimization:
  - vorhandene servergebundene Agenda-Payloads bleiben stabil.

### Beispielkarten

- `Restrictive Net Zoning`
- `Security Net Optimization`
- `Pox`

## P5: EffectCommand-/EffectExecutor-Ausbau

### Aktuelle relevante Dateien und Funktionen

- `packages/shared/src/index.ts`
  - `EffectCommand`
  - `EffectDefinition`
  - `ResolvedGameEffect`
- `packages/engine/src/index.ts`
  - `applyEffectCommands`
  - `executeEffectCommands`
  - `credits`
  - `doDamage`
  - `trashRunnerInstalledCardToHeap`
  - `trashCorpInstalledCardToArchives`
  - `drawRunnerCard`
  - `drawCorpCard`
  - `appendResolvedEffectsToPayload`

### Konkrete Schwäche im Ist-Zustand

`EffectCommand` existiert, aber viele echte Karteneffekte umgehen ihn. Außerdem erzeugt `executeEffectCommands` keine `ResolvedGameEffect`s. `emit_event` ist ausdrücklich nicht produktiv.

Das verhindert eine deklarative Definition wie "on install: gain 12 credits and emit public effect" für Loan from Chiba.

### Zielstruktur

Der Executor sollte optional Effektresultate sammeln:

```ts
type EffectExecutionResult = {
  state: GameState;
  resolvedEffects: ResolvedGameEffect[];
};

executeEffectCommands(state, commands, { collectEffects: true });
```

Neue Commands zuerst klein halten:

- `gain_credits`
- `draw_card`
- `add_counter`
- `remove_counter`
- `move_card`
- `trash_card`
- `reveal_cards`

### Minimale erste Änderung

1. `executeEffectCommands` intern so erweitern, dass es optional `ResolvedGameEffect[]` zurückgeben kann.
2. Bestehende Aufrufer ohne Option bleiben unverändert.
3. Loan from Chiba als Pilot nicht vollständig migrieren, sondern nur den vorhandenen `resolvedEffects`-Block durch einen Helper ersetzen:
   - `resolveGainCreditsEffect(...)`
   - später `executeEffectCommands(..., collectEffects: true)`

### Risiken

- State-Mutationen und Effektresultate können auseinanderfallen.
- Falsch typisierte Effekte können Chronik/AI beeinflussen.
- Hidden-Info-Barrieren müssen pro Command bewusst modelliert werden.

### Notwendige Tests

- Loan from Chiba:
  - State: +12 Credits.
  - PublicPayload: `gain_credits`-Effekt.
  - keine Recurring-Counter.
- Wall of Ice:
  - `resolve_subroutine`-Effekte bleiben stabil.
- MIT West Tier oder Annual Reviews:
  - Draw-Effekte bleiben unverändert, falls später migriert.

### Beispielkarten

- `Loan from Chiba`
- `Wall of Ice`
- `Annual Reviews`
- `MIT West Tier`

## P6: Trigger Registry

### Aktuelle relevante Dateien und Funktionen

- `packages/shared/src/index.ts`
  - `TimingPointId`
  - `AbilityDefinition`
  - `ChoiceRequest`
- `packages/engine/src/index.ts`
  - `getLegalActions`
  - `startRunnerTurn`
  - `applyRunnerStartOfTurnEffects`
  - `applyCorpStartOfTurnEffects`
  - `continueRun`
  - `movePastCurrentIce`
  - `finishRun`
  - `runnerAccessActions`
  - `startupImmolatorPostPassActions`
  - `startCorporateNegotiatingCenterChoice`

### Konkrete Schwäche im Ist-Zustand

Trigger sind konkrete Funktionsaufrufe in Engine-Phasen. Es gibt kein einheitliches Modell für:

- `onInstall`
- `onRez`
- `onTurnStart`
- `onEncounterIce`
- `onSubroutineBroken`
- `onPassIce`
- `onAccess`
- paid ability windows
- once-per-run/turn limits

### Zielstruktur

Eine Registry, die aus Engine-Events optionale Actions oder automatische Effekte erzeugt:

```ts
type EngineTriggerEvent =
  | { type: "turn_start"; side: Side }
  | { type: "install"; cardId: CardInstanceId }
  | { type: "approach_ice"; iceId: CardInstanceId }
  | { type: "pass_ice"; iceId: CardInstanceId; fullyBroken: boolean }
  | { type: "access_card"; cardId: CardInstanceId };

type TriggerResolver = {
  id: string;
  sourceDefinitionId: CardDefinitionId;
  eventType: EngineTriggerEvent["type"];
  createActions?(state: GameState, event: EngineTriggerEvent): LegalAction[];
  resolveAutomatic?(state: GameState, event: EngineTriggerEvent): ResolvedGameEffect[];
};
```

### Minimale erste Änderung

Nicht sofort Start-of-turn global migrieren. Besser:

1. Neue Datei `packages/engine/src/ability-engine/trigger-registry.ts`.
2. Registry enthält nur `Startup Immolator` als Pilot für `pass_ice`.
3. `startupImmolatorPostPassActions` bleibt bestehen, delegiert aber an Registry.
4. Tests beweisen identisches Verhalten.

### Risiken

- Trigger können mehrfach feuern, wenn Event-Erzeugung und Fensterrouting nicht exakt sind.
- PendingChoice und aktive Seite können durch automatische Trigger in falscher Reihenfolge landen.
- Hidden-Info und Replay müssen pro Trigger gesichert werden.

### Notwendige Tests

- Startup Immolator:
  - Action nur nach vollständig gebrochenem und passiertem ICE.
  - nicht nach teilweise gebrochenem ICE.
  - nicht mehrfach pro Turn.
- Corporate Negotiating Center:
  - bleibt zunächst bewusst außerhalb der Registry; Test schützt Verhalten.

### Beispielkarten

- Pilot: `Startup Immolator`
- später: `Corporate Negotiating Center`
- später: `The Shell Traders`
- später: Ambush-on-access-Karten wie `Setup!` und `TRAP!`

## Erste Umsetzungsempfehlung: Cost-Pipeline

### Warum dieser Einstieg

Die Cost-Pipeline hat das beste Verhältnis aus Nutzen und Risiko:

- Sie adressiert einen realen Hotfix-Fall: Olivia Salazar.
- Sie berührt eine zentrale Regelautorität: LegalAction-Erzeugung und `applyAction`-Revalidierung.
- Sie kann zunächst nur für Rez-Kosten eingeführt werden.
- Sie muss keine neuen GameState-Felder einführen.
- Sie kann bestehende Kostenfunktionen weiterverwenden.
- UI bleibt im ersten Schritt unverändert, weil `LegalAction.costs` gleich bleibt.

### Inkrementelle Migrationsstrategie

#### Schritt 1: Engine-lokale Quote-Schicht einführen

Neue Datei:

- `packages/engine/src/ability-engine/cost-pipeline.ts`

Neue engine-lokale Typen:

```ts
export type CostPurpose = "corp_rez";

export type CorpRezCostOptions = {
  oliviaSalazarSourceCardId?: CardInstanceId;
};

export type CostQuote = {
  purpose: CostPurpose;
  side: "corp";
  targetCardId: CardInstanceId;
  baseCredits: number;
  finalCredits: number;
  costs: Cost[];
  modifiers: CostModifierQuote[];
  canPay: boolean;
  publicPayload: Record<string, string | number | boolean>;
};
```

`CostQuote` bleibt in dieser Form engine-lokal und transient. Sie wird nicht als Objekt persistiert, sondern nur in `costs` und die bestehenden PublicPayload-Felder übersetzt. `applyAction`/`rezCard` berechnen dieselbe Quote aus dem aktuellen `GameState` neu.

Neue Hilfsfunktionen:

- `quoteCorpRezCost(state, iceId, options?)`
- `costQuoteToLegalActionCosts(quote)`
- `costQuotePublicPayload(quote)`
- `assertCorpRezCostQuoteValid(state, iceId, legalAction)`

#### Schritt 2: `corpApproachActions` umstellen

Betroffene Funktion:

- `packages/engine/src/index.ts::corpApproachActions`

Änderung:

- normale Rez-Action nutzt `quoteCorpRezCost(state, run.approachedIceId)`
- Olivia-Rez-Action nutzt `quoteCorpRezCost(state, run.approachedIceId, { oliviaSalazarSourceCardId: sourceId })`
- Labels bleiben zunächst wie heute.
- Payload-Felder bleiben kompatibel:
  - `rezCostPaid`
  - `rezCostReductionAmount`
  - `rezCostReductionSourceDefinitionIds`
  - `oliviaSalazarRezSourceCardId`
  - `oliviaSalazarRezSourceDefinitionId`
  - `oliviaSalazarRezCostBase`
  - `oliviaSalazarTemporaryDerez`

#### Schritt 3: `rezCard` revalidieren lassen

Betroffene Funktion:

- `packages/engine/src/index.ts::rezCard`

Änderung:

- Bei normalem Rez und Olivia-Rez wird Quote neu berechnet.
- `legalAction.costs[0]?.credits` muss `quote.finalCredits` entsprechen.
- Das Ziel-ICE muss existieren, weiterhin das aktuelle ICE im Approach-Timing sein und weiterhin rezbar sein.
- Die Corp muss die neu berechneten `finalCredits` zahlen können.
- Olivia-spezifische Timing-/Source-Prüfungen bleiben zunächst in `rezCard`, werden aber an `quoteCorpRezCost` angenähert:
  - Source existiert, ist rezzed und liegt gültig im angegriffenen Fort.
  - Source wurde in diesem Run noch nicht verwendet.
  - manipulierte `oliviaSalazarRezSourceCardId` wird abgelehnt.
  - `oliviaSalazarTemporaryRezzedIceIds` und Derez am Run-Ende bleiben unverändert.

#### Schritt 4: Tests ergänzen

Konkrete Tests:

- `packages/engine/src/index.test.ts`
  - "quoteCorpRezCost does not mutate state"
  - "quoteCorpRezCost matches current rezCostForCard"
  - "Olivia Salazar offers reduced rez through cost pipeline"
  - "Olivia Salazar revalidates reduced cost after source is removed"
  - "Olivia Salazar rejects manipulated source id"
  - "Olivia Salazar can be used only once per run"
  - "Fortress Architects normal rez reduction is quoted and paid"
  - "Jerusalem City Grid server rez reduction is quoted and paid"
  - "Startup Immolator still pays current rez cost"
- `apps/web/app/action-board-ui.test.ts`
  - Kostenchips für reduzierte Rez-Kosten bleiben stabil.
- `apps/web/app/chronicle.test.ts`
  - Olivia-Chronik nennt Quelle und gezahlte Kosten weiter.

#### Schritt 5: Weitere Kostenfamilien nacheinander

Nach grünem Rez-Pilot:

1. Runner-Run-Kosten:
   - `runnerEncounterActions`
   - `spendRunnerRunCredits`
   - Karten: `Krash`, `Startup Immolator`, `Core Command: Jettison Ice`
2. Runner-Installkosten:
   - `runnerMainActions`
   - `spendRunnerInstallCredits`
   - Karten: `Valu-Pak Software Bundle`, normale Programme, MRAM
3. Access-Trash-Kosten:
   - `effectiveAccessTrashCost`
   - `spendRunnerAccessTrashCredits`
   - Karten: `New Galveston City Grid`, `Scatter Shot`, `Poltergeist`
4. Ability-Kosten:
   - resource/action assets
   - recurring credits
   - agenda-point costs

Zahlungsquellen wie Recurring Credits, Restricted Credits, alternative Kosten, Klickkosten, Trash-as-cost, Agenda-Point-Kosten und Access-Trash-Kosten werden erst nach stabilem Rez-Pilot über ein späteres `PaymentSourceQuote`/`CostSpendPlan`-Modell produktiv eingeführt. Der P1-Pilot darf dafür höchstens die Typ-Idee dokumentieren, aber keine große Payment-Source-Implementierung starten.

## Konkrete Code-Änderungsvorschläge

### Neue Dateien

- `packages/engine/src/ability-engine/cost-pipeline.ts`
- später: `packages/engine/src/ability-engine/active-modifiers.ts`
- später: `packages/engine/src/ability-engine/target-bindings.ts`
- später: `packages/engine/src/ability-engine/reveal-effects.ts`
- später: `packages/engine/src/ability-engine/trigger-registry.ts`

### Neue Typen

Zuerst engine-lokal:

- `CostPurpose`
- `CostModifierQuote`
- `CostQuote`
- `CorpRezCostOptions`

Später shared, wenn UI/AI die Daten direkt brauchen:

- `CostBreakdown`
- `ActiveModifier`
- `BoundTarget`
- `RevealCardsResolvedEffect`
- `TriggerDefinition`

### Neue Hilfsfunktionen

Erster Commit:

- `quoteCorpRezCost`
- `costQuotePublicPayload`
- `assertCorpRezCostQuoteValid`

Folgecommits:

- `collectActiveModifiers`
- `sumActiveModifiers`
- `boundTargetsForCard`
- `publicRevealCardsEffect`
- `formatRevealCardsEffect`
- `triggerActionsForEvent`

### Betroffene bestehende Funktionen

Erste Migration:

- `corpApproachActions`
- `rezCard`
- `rezCostForCard`
- `rezCostReductionSourceDefinitionIdsFor`

Spätere Migrationen:

- `runnerEncounterActions`
- `spendRunnerRunCredits`
- `spendRunnerInstallCredits`
- `spendRunnerAccessTrashCredits`
- `effectiveAccessTrashCost`
- `maxHandSize`
- `iceStrengthFor`
- `runRemainderStrengthBonusForBreaker`
- `continueRun`
- `appendResolvedSubroutineEffect`
- `resolveCorporateNegotiatingCenterChoice`
- `visibleOwnCard`
- `startupImmolatorPostPassActions`

### Konkrete Tests

Engine:

- `packages/engine/src/index.test.ts::Olivia Salazar`
- `packages/engine/src/index.test.ts::V1.9.20 Global Modifier/Special-State`
- `packages/engine/src/index.test.ts::Startup Immolator`
- neue Tests für Cost-Quote-Revalidation

Web:

- `apps/web/app/action-board-ui.test.ts::Olivia Salazar`
- `apps/web/app/chronicle.test.ts::Olivia Salazar`
- `apps/web/app/chronicle.test.ts::Corporate Negotiating Center`
- `apps/web/app/chronicle.test.ts::Wall of Ice`

Shared:

- `packages/shared/src/index.test.ts`, sobald neue shared Typen eingeführt werden.

### Reihenfolge der Commits

1. `test: guard current card cost behavior`
   - Nur Tests für Olivia, Fortress/Jerusalem und Startup Immolator ergänzen.
   - Kein Produktionscode.

2. `refactor(engine): add corp rez cost quote pipeline`
   - Neue `cost-pipeline.ts`.
   - Engine-lokaler Wrapper um `rezCostForCard`, `rezCostReductionSourceDefinitionIdsFor` und Olivia-Helfer.
   - `CorpRezCostOptions` nutzt ausschließlich `oliviaSalazarSourceCardId`.
   - Quote-Purity-Test mit `hashState` und Deep-Equality.
   - Noch keine PublicPayload- oder UI-Vertragsänderung.

3. `refactor(engine): use cost quote for corp rez legal actions`
   - `corpApproachActions` nutzt Quote für normale und Olivia-Rez-Actions.
   - Keine PublicPayload-Änderung außer identischer Feldherkunft.
   - Action-ID-Stabilität über bestehende Payload-Felder prüfen.

4. `refactor(engine): revalidate corp rez costs through quote`
   - `rezCard` nutzt Quote zur Kostenprüfung.
   - Olivia-Spezialprüfungen bleiben erhalten.
   - Veraltete oder manipulierte Olivia-Quelle wird abgelehnt.
   - Fortress-/Jerusalem-Reduktionen und Startup Immolator bleiben Guards.

5. `test(web): lock cost display and chronicle for quoted rez actions`
   - Web-Tests für Kostenchips und Chronik.

6. `refactor(engine): add active modifier query layer`
   - `collectActiveModifiers` als reine Query ohne State-Migration.
   - Tests für MRAM und Krash als Abbild, nicht als neue Wirkung.

7. `refactor(engine/web): add reveal resolved effect pilot`
   - `reveal_cards` als additive `ResolvedGameEffectKind`.
   - Corporate Negotiating Center schreibt alten Payload plus neuen Effekt.

8. `refactor(engine): add bound target query for server-bound cards`
   - `boundTargetsForCard`.
   - Restrictive Net Zoning nutzt Query für PlayerView-Anzeige.

9. `refactor(engine): expand effect command result collection`
   - Optionaler Effekt-Collector im Executor.
   - Loan from Chiba als erster kleiner Pilot.

10. `refactor(engine): route Startup Immolator through trigger registry pilot`
    - Registry nur für einen Trigger.
    - Bestehende Funktion delegiert statt ersetzt.

## Abbruchkriterien pro Phase

Eine Phase wird nicht weiter ausgedehnt, wenn eines dieser Signale auftritt:

- StateHash oder Replay ändern sich ohne absichtlichen Grund.
- PublicPayload enthält neue ungetestete Hidden-Zone-Daten.
- UI muss mehr als additive Felder interpretieren, bevor Engine-Tests grün sind.
- Eine migrierte Karte braucht mehr Sonderlogik als vorher.
- Mehr als drei Karten werden in einem Commit produktiv umgestellt.

## Entscheidung

Empfohlener Start: P1 Cost-Pipeline, aber mit P0-Testguard als erstem Commit.

Begründung: Diese Reihenfolge reduziert das Risiko, berührt zunächst nur Kostenangebote und Revalidierung, lässt bestehende Sonderfälle lauffähig und schafft sofort Nutzen für eine bekannte Fehlerklasse. ActiveModifier, Trigger Registry und EffectExecutor bleiben geplant, werden aber erst nach einem stabilen Cost-Pipeline-Pilot produktiv migriert.
