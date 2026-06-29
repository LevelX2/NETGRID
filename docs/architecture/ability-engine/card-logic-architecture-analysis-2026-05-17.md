# Kartenlogik- und Ability-Engine-Analyse

Datum: 2026-05-17

Primärer Agent: `architecture-review-agent`

## Kurzfazit

Das Projekt hat bereits eine zentrale `CardDefinition`-Datenstruktur und mehrere wiederverwendbare Mechanikhelfer. Es gibt aber noch keine vollständig deklarative Card-Definition-Architektur, in der Karten über abstrakte Effektbausteine beschrieben und danach generisch von der Engine ausgeführt werden.

Die Stammdaten und angezeigten Regeltexte liegen überwiegend in `packages/shared/src/index.ts`. Die ausführbare Kartenlogik liegt dagegen noch stark verteilt in `packages/engine/src/index.ts` und wird häufig über konkrete Card-IDs, Payload-Felder, Run-Flags und Einzelresolver gesteuert.

Die jüngsten Hotfix-Fälle vom 2026-05-17 zeigen, dass viele konkrete Fehler nicht isoliert zufällig entstanden sind. Sie wurden durch strukturelle Schwächen begünstigt:

- Modifier sind nicht zentral genug modelliert.
- Trigger und Timing sind nicht explizit genug.
- Kostenberechnung, Action-Verfügbarkeit und Bezahlung sind noch zu oft getrennte Codepfade.
- UI und Chronik müssen Payload-Konventionen interpretieren, statt direkt auf typisierte Effektauflösungen zurückzugreifen.
- Zielauswahl und spätere Zielbindung sind nur teilweise als wiederverwendbares Modell vorhanden.

## Technischer Aufbau einer Karte

### Stammdaten und Regeltext

Der zentrale Typ ist `CardDefinition` in `packages/shared/src/index.ts`.

Wichtige Felder:

- `id`
- `title`
- `side`
- `type`
- `subtypes`
- `cost`, `installCost`, `rezCost`, `trashCost`
- `memoryCost`, `memoryLimitBonus`, `maxHandSizeBonus`
- `strength`
- `advancementRequirement`, `agendaPoints`
- `recurringCredits`
- `rulesText`
- `abilities`
- `modifiers`
- `subroutines`
- `mechanics`

Der angezeigte Kartentext steht im Feld `rulesText`. Beispiele:

- `MRAM Chip`: `maxHandSizeBonus: 2`, `rulesText: "Hand size +2..."`
- `Olivia Salazar`: Rez-Kostenreduktion und temporäres Derezzen im `rulesText`.
- `Wall of Ice`: vier einzelne Subroutinen über `subroutines`.
- `Restrictive Net Zoning`: Zielserverwahl nur im Text und dann in Engine-Sonderlogik.

Die konkrete Kartenliste wird in `packages/shared/src/index.ts` über `ONR_V1_LIMITED_PLAYABLE_CARDS` und `DEMO_CARDS` aufgebaut. Die Engine löst Instanzen über `definitionFor(state, id)` auf `DEMO_CARDS_BY_ID` zurück.

### Ausführbare Logik

Die ausführbare Logik steht überwiegend in `packages/engine/src/index.ts`.

Zentrale Einstiegspunkte:

- `getLegalActions(state, side)`: erzeugt verfügbare Aktionen abhängig von Timing und Seite.
- `applyAction(state, playerAction)`: regeneriert LegalActions, prüft `actionId`, `stateVersion`, Choice-Gültigkeit und ruft `performAction`.
- `performAction(state, legalAction, playerAction)`: großer Switch über `ActionType`.
- `rezCard`, `continueRun`, `runnerEncounterActions`, `corpApproachActions`, `runnerMainActions`, `corpMainActions`: enthalten viel Kartenlogik.

Die Engine ist diszipliniert darin, `PlayerAction`s gegen aktuelle `LegalAction`s zu revalidieren. Das ist ein starkes Fundament. Die Logik, wie eine Karte ihre Aktionen und Effekte bekommt, ist aber noch nicht einheitlich genug.

## Zentrale Effektbibliothek

Es gibt einen Anfang einer Effektbibliothek:

- `EffectCommand` in `packages/shared/src/index.ts`
- `executeEffectCommands` in `packages/engine/src/index.ts`
- `ResolvedGameEffect` und `ResolvedGameEffectKind` in `packages/shared/src/index.ts`

Vorhandene Commands:

- `gain_credits`
- `spend_credits`
- `draw_card`
- `do_damage`
- `add_tag`
- `remove_tag`
- `change_breaker_strength`
- `break_subroutine`
- `set_pending_choice`
- `complete_pending_choice`
- `emit_event`

Wichtige Einschränkung: `emit_event` ist im Executor noch nicht produktiv und wirft bewusst einen Fehler. Viele echte Karteneffekte laufen deshalb nicht über Commands, sondern über Engine-Helfer und Sonderresolver.

### Bewertung wiederkehrender Effektfamilien

| Effektfamilie | Aktueller Stand |
| --- | --- |
| `gainCredits` | Über `credits()`, `automaticGainCreditsEffect`, teils `EffectCommand.gain_credits`; nicht einheitlich. |
| `loseCredits` | Über `spendCredits` oder direkte Subroutine-Logik; kein vollwertiger Effektbaustein. |
| `drawCards` | Über `drawRunnerCard`, `drawCorpCard`, `drawCorpCards`, `EffectCommand.draw_card`. |
| `takeDamage` | Relativ stark über `doDamage`, `ImminentEvent`, Prevention/Replacement-Fenster. |
| `trashCard` | Viele zonenspezifische Funktionen, kein zentraler generischer Move-/Trash-Baustein. |
| `installCard` | Stark in `performAction/install_card` hardcoded. |
| `revealCard` | Hidden-Zone- und Payload-Sonderpfade; kein allgemeiner Reveal-Effektvertrag. |
| `modifyStrength` | `strengthModifier`, Run-Remainder-Bonus, ICE-Strength-Helfer; mehrere Modelle parallel. |
| `modifyHandSize` | `maxHandSizeBonus` plus spezifische Berechnung in `maxHandSize`. |
| `reduceRezCost` | `rezCostForCard`, globale Reduktionen und Olivia-Sonderpfad. |
| `breakSubroutine` | Über `run.brokenSubroutineIndexes` und Breaker-Actions. |
| `endRun` | Über `finishRun`; nicht als deklarativer Effektbaustein. |
| `accessCard` | Run-/Access-Sonderpfade. |
| `moveCardBetweenZones` | Viele spezialisierte Funktionen. |
| `addCounters/removeCounters` | `addCardCounter`, `setCardCounter`, `spendCardCounter`; funktional, aber nicht als Card-DSL integriert. |

## Trigger- und Timing-System

Es gibt explizite Timingpunkte:

- `corp_draw.mandatory_draw`
- `corp_action.main`
- `runner_action.main`
- `run.approach_ice`
- `run.encounter_ice`
- `run.jack_out_window`
- `access.resolve_card`
- weitere Setup-/Discard-/Checkpoint-Timings

Das Timing wird in `getLegalActions` ausgewertet. Das ist sauber als Engine-Gate, aber noch nicht als generische Trigger-Registry.

Beispiele:

- Start-of-turn-Effekte laufen in `startRunnerTurn`, `applyRunnerStartOfTurnEffects`, `applyCorpStartOfTurnEffects`.
- `Corporate Negotiating Center` öffnet manuell eine Pending Choice über `startCorporateNegotiatingCenterChoice`.
- `Startup Immolator` nutzt einen Run-Zwischenzustand `startupImmolatorPendingPassedIceId`.
- `Grubb` nutzt wegen seines Kartentexts `run.remainderStrengthBonusByBreaker`; `Krash` wurde am 2026-06-29 als normale encounter-gebundene Icebreaker-Pump korrigiert.
- Olivia Salazar nutzt einen eigenen Approach-Rez-Pfad und Run-End-Derez-Flags.

Es gibt also Timingfenster, aber noch kein Modell wie:

```ts
trigger: {
  event: "onEncounterIce",
  condition: ...,
  window: "paidAbility",
  once: "perRun",
  effect: ...
}
```

## Action-System

### Stärken

Das Action-System ist der solideste Teil:

- UI, KI und Server sollen `LegalAction`s nutzen.
- `applyAction` akzeptiert nur Actions, die aus dem aktuellen State neu generiert wurden.
- `stateVersion` schützt gegen stale Actions.
- `ChoiceRequest` und `ChoiceRequirement` modellieren Auswahlfenster.
- `PlayerView` liefert `legalActions` an die UI.

### Schwächen

Kosten und Verfügbarkeit sind noch nicht einheitlich:

- `rezCostForCard` berechnet normale ICE-Rez-Kosten.
- Olivia Salazar berechnet halbe effektive Kosten separat.
- Runner-Installkosten, Run-Kosten, Access-Trash-Kosten und Tag-Removal-Kosten haben eigene Spend-Pipelines.
- UI-Kostenchips lesen `LegalAction.costs`, aber manche Zusatzkosten oder Quellen stecken in Payload-Feldern.
- Nicht verfügbare Aktionen werden meist gar nicht angeboten; es gibt noch kein einheitliches "nicht verfügbar, weil..."-Modell.

Konsequenz: Eine Karte wie Olivia Salazar konnte in einem Pfad korrekt als Regeltext/Karte existieren, aber in der Affordability-Erzeugung fehlen.

## Analyse der konkreten Problemfälle

### MRAM Chip

Aktueller Stand:

- `MRAM Chip` hat `maxHandSizeBonus: 2`.
- `maxHandSize(state, "runner")` addiert `runnerInstalledMaxHandSizeModifier(state)`.
- PlayerViews projizieren `maxHandSize`.

Architekturbefund:

Der Fehler wurde dadurch begünstigt, dass Handgröße kein generischer Modifier ist, sondern eine konkrete Berechnungsfunktion mit Spezialquellen. Für MRAM ist das aktuell repariert, aber neue Handgrößenkarten können denselben Fehler wieder erzeugen, wenn sie nicht in die passende Berechnung eingebunden werden.

### Krash / Crash-Stärkeboost

Aktueller Stand:

- Gemeint ist `Krash`, nicht `Crash`.
- `Krash` ist als Icebreaker-Definition generisch angelegt.
- Korrektur 2026-06-29: Der gedruckte Text nennt keine Laufzeit "for the remainder of this run"; der Pump gilt daher nur für den aktuellen ICE-Encounter.
- Der frühere Run-Sonderfall für `[GRUBB_ID, KRASH_ID]` ist überholt. `Grubb` bleibt wegen seines ausdrücklichen Kartentexts im Run-Bonuspfad, `Krash` nicht.

Architekturbefund:

Das ist funktional, aber kein allgemeines Modifier-Modell. Die Engine braucht einen Duration-Modifier mit Scope `encounter`, `run`, `turn`, `game` und Source-Bindung.

### Olivia Salazar

Aktueller Stand:

- Olivia ist in `packages/shared/src/index.ts` als Upgrade mit Rez-Kostenreduktion beschrieben.
- `corpApproachActions` erzeugt eigene Olivia-Rez-Aktionen.
- `rezCard` revalidiert Timing, Serverbindung, Quelle, Nutzung pro Run und Kosten.
- Run-End-Derez wird über Run-Flags modelliert.

Architekturbefund:

Der Fehler wurde durch getrennte Kostenpfade begünstigt. Normale Rez-Kostenreduktion, source-bound optionale Kostenreduktion und Bezahlbarkeit sollten über eine Cost-Pipeline laufen.

### Startup Immolator / Startup Emulator

Aktueller Stand:

- Lokaler Kartenanker ist `Startup Immolator`.
- Nach vollständig gebrochenem ICE wird im `run.jack_out_window` eine `trigger_ability` angeboten.
- Engine revalidiert Quelle, Timing, Ziel-ICE und Rez-Kosten.
- Der dokumentierte Hotfix betraf vor allem Sichtbarkeit in Webclient und Chronik.

Architekturbefund:

Der Trigger selbst ist sehr spezifisch: `fullyBrokenIceIds`, `startupImmolatorPendingPassedIceId`, `startupImmolatorUsedSourceIdsThisTurn`. Das sollte mittelfristig ein generisches Post-Encounter-Triggerfenster werden.

### Corporate Negotiating Center

Aktueller Stand:

- Start-of-turn öffnet eine corp-private Hidden-Zone-Choice.
- Die Auflösung schreibt öffentliche Reveal-Daten in den Payload.
- Chronik kennt dafür einen Sonderfall `v1917_corporate_negotiating_center_hq_agenda_reveal`.

Architekturbefund:

Reveal und Chronik sind noch zu stark payloadgetrieben. Ein Reveal-Effekt sollte automatisch einen side-sicheren PublicPayload und einen Chronik-Eintrag erzeugen.

### Wall of Ice

Aktueller Stand:

- `Wall of Ice` hat vier Subroutinen in `subroutines`.
- `continueRun` iteriert die Subroutinen.
- `appendResolvedSubroutineEffect` erzeugt inzwischen einzelne `resolve_subroutine`-Effekte.
- Die Web-Chronik kann daraus getrennte Einträge erzeugen.

Architekturbefund:

Das ist ein guter Zielpfad: typisierte `ResolvedGameEffect`s statt monolithischer Payloads. Noch wird es manuell in `continueRun` erzeugt.

### Loan from Chiba

Aktueller Stand:

- Installieren gibt 12 normale Credits.
- Es werden keine Recurring-Credit-Counter gesetzt.
- Der Engine-Test `installs Loan from Chiba as a 12-credit gain without recurring counters` schützt das.

Architekturbefund:

Der frühere Recurring-State war ein Drift zwischen Mechanik-/Planungslabel und tatsächlichem Kartentext. Die Definition sollte künftig zwischen `mechanics` als grobem Tag und ausführbarem Effektvertrag unterscheiden.

### Restrictive Net Zoning

Aktueller Stand:

- Runner-Install-Actions werden pro Server mit `selectedServerId` und `selectedServerLabel` erzeugt.
- Die installierte Karte speichert `selectedServerId`.
- `VisibleCard` projiziert `selectedServerLabel`.
- Installkosten-Tax liest die persistente Serverbindung.

Architekturbefund:

Der konkrete Fix ist solide. Strukturell fehlt aber ein allgemeines Target-Binding-Modell:

```ts
targets: [{ id: "chosenServer", kind: "server", bindToSource: true }]
```

Dann müssten Choice, Persistenz, PlayerView, Chronik und spätere Modifier nicht je Karte neu verbunden werden.

## Einordnung: Einzelfehler oder strukturelle Schwäche?

Die Fehler sind konkrete Einzelfehler, aber sie folgen klaren strukturellen Mustern.

### Strukturelle Muster

- Kartenlogik ist zu oft ID-basiert hardcoded.
- `mechanics` sind Tags, keine ausführbaren Verträge.
- `rulesText` ist Anzeige, nicht Quelle der Engine-Logik.
- `abilities` sind nur für einfache Breaker wirklich wiederverwendbar.
- Effektauflösung, PublicPayload und Chronik sind nicht automatisch gekoppelt.
- Modifier-Laufzeiten sind uneinheitlich modelliert.
- Cost-Reduction und Affordability können auseinanderlaufen.
- Targets werden teils nur als Payload-Felder gespeichert.

## Zielmodell für die Karten-Engine

### Card Definition

Künftige Karten sollten neben Stammdaten einen ausführbaren Ability-Vertrag besitzen:

```ts
type CardRuntimeDefinition = {
  id: CardDefinitionId;
  staticData: CardDefinition;
  abilities: RuntimeAbility[];
};

type RuntimeAbility = {
  id: string;
  kind: "paid" | "triggered" | "static" | "replacement" | "prevention";
  trigger?: TriggerDefinition;
  timing: TimingPointId[];
  conditions?: ConditionDefinition[];
  costs?: CostDefinition[];
  targets?: TargetDefinition[];
  choices?: ChoiceDefinition[];
  effects: EffectDefinition[];
  visibility: VisibilityDefinition;
  limits?: AbilityLimitDefinition[];
};
```

### Zentrale Effektbausteine

Priorisierte zentrale Bausteine:

- `gainCredits`
- `spendCredits`
- `drawCards`
- `doDamage`
- `preventDamage`
- `addTags` / `removeTags`
- `moveCard`
- `trashCard`
- `installCard`
- `rezCard` / `derezCard`
- `revealCards`
- `shuffleZone`
- `reorderZone`
- `addCounters` / `removeCounters` / `spendCounters`
- `modifyValue`
- `breakSubroutine`
- `resolveSubroutine`
- `endRun`
- `openChoice`
- `emitPublicEffect`

### Trigger

Trigger sollten auf Engine-Events hören:

- `onInstall`
- `onRez`
- `onDerez`
- `onScore`
- `onSteal`
- `onTurnStart`
- `onTurnEnd`
- `onRunStart`
- `onApproachIce`
- `onEncounterIce`
- `onSubroutineBroken`
- `onPassIce`
- `onAccess`
- `onTrash`
- `onRunEnd`

Trigger erzeugen entweder automatische Effekte oder LegalActions in definierten Fenstern.

### Kosten, Bedingungen und Ziele

Eine Cost-Pipeline sollte alle Phasen abdecken:

1. Basiskosten bestimmen.
2. Modifier anwenden.
3. alternative Quellen und Restricted Credits prüfen.
4. Bezahlbarkeit bestimmen.
5. `LegalAction.costs` und Explain-Daten erzeugen.
6. Bei `applyAction` dieselbe Pipeline erneut ausführen.
7. Zahlung atomar ausführen.

Target-Bindings sollten persistent und typisiert sein:

```ts
type BoundTarget = {
  sourceCardInstanceId: CardInstanceId;
  targetId: string;
  kind: "server" | "card" | "subroutine" | "side";
  value: string;
  publicLabel?: string;
  visibility: EventVisibilityClass;
};
```

### Modifier

Modifier sollten als aktive Objekte modelliert werden:

```ts
type ActiveModifier = {
  id: string;
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  kind:
    | "maxHandSize"
    | "memoryLimit"
    | "iceStrength"
    | "breakerStrength"
    | "rezCost"
    | "installCost"
    | "trashCost"
    | "breakSubroutineCost"
    | "jackOutCost";
  amount: number;
  appliesTo: ModifierScope;
  duration: "encounter" | "run" | "turn" | "whileInstalled" | "whileRezzed" | "game";
  expiresAt?: ExpiryDefinition;
  visibility: EventVisibilityClass;
};
```

Damit würden MRAM, Krash, Olivia, Virizz, Pox, Restrictive Net Zoning und Wall-/Code-Gate-Rez-Kostenreduktionen über dasselbe Modell laufen.

### Chronik

Die Chronik sollte vorrangig aus `ResolvedGameEffect[]` entstehen. Jede Effektauflösung sollte mindestens liefern:

- `kind`
- `sourceDefinitionId`
- `sourceTitle`
- `target`
- `amount`
- `visibility`
- `reason`
- optionale `chronicleKey`

Payload-Sonderfelder bleiben für Übergangskompatibilität möglich, sollten aber nicht die führende Quelle sein.

### UI

Die UI sollte aus denselben Daten lesen wie die Engine:

- verfügbare Actions aus `LegalAction`
- Kosten aus `LegalAction.costs` plus Cost-Breakdown
- Ziele aus `targetRequirements` und gebundenen Targets
- Choices aus `ChoiceRequest`
- nicht verfügbare Actions aus optionalen `UnavailableActionExplanation`s
- Chronik aus `ResolvedGameEffect`

## Testmodell

Für jede freigegebene Karte sollte es mindestens folgende Testfamilien geben:

- Definitionstest: Stammdaten, `rulesText`, Kosten, Typen, Mechanics, Runtime-Ability-Vertrag.
- LegalAction-Test: Aktion erscheint nur im korrekten Timingfenster.
- Affordability-Test: normale Kosten, modifizierte Kosten und nicht bezahlbare Fälle.
- Revalidation-Test: stale State, wrong side, entfernte Quelle, geänderte Kosten, falsches Ziel.
- Effect-Test: State-Änderung und `ResolvedGameEffect`.
- Visibility-Test: PlayerView/PublicEvent ohne Hidden-Info-Leak.
- Replay/StateHash-Test.
- Chronik-Test.
- UI-Test für Labels, Kostenchips, Zielnamen und Choice-Optionen.

## Refactoring-Roadmap

### Phase 1: Analyse absichern und Ist-Architektur dokumentieren

- Diese Analyse mit Codeanker pflegen.
- `packages/shared/src/index.ts`-Definitionen, `packages/engine/src/index.ts`-Resolver und `mechanics/*`-Helfer inventarisieren.
- Jede Karte einer Resolverfamilie zuordnen.
- Hardcoded-Card-ID-Pfade katalogisieren.

### Phase 2: zentrale Effektbausteine identifizieren und konsolidieren

- `EffectCommand` erweitern und produktiv machen.
- Move-/Trash-/Install-/Reveal-/Counter-Bausteine zentralisieren.
- Bestehende Spezialresolver schrittweise auf Effektbausteine umstellen.

### Phase 3: Modifier-, Trigger- und Timing-System härten

- `ActiveModifier`-Store einführen.
- `TriggerRegistry` auf Engine-Events aufbauen.
- Run-/Encounter-/Turn-Cleanup über Modifier-Expiry statt Einzel-Flags modellieren.
- MRAM, Krash und Olivia als Pilotfälle migrieren.

### Phase 4: Action-Verfügbarkeit, Kostenprüfung und UI-Anzeige vereinheitlichen

- Cost-Pipeline einführen.
- `LegalAction.costs` um Breakdown/Source-Daten ergänzen.
- Nicht verfügbare Actions optional erklärbar machen.
- UI-Kostenchips aus derselben Cost-Pipeline ableiten.

### Phase 5: Chronik-/Reveal-/Zielauswahl-System an Engine koppeln

- `ResolvedGameEffect` als primären Chronikvertrag etablieren.
- Reveal-Effekte typisieren.
- Bound Targets für Karten wie Restrictive Net Zoning einführen.
- Payload-Sonderfälle in `apps/web/app/chronicle.ts` reduzieren.

### Phase 6: Kartentests und Regressionstests ergänzen

- Bekannte Fehlerfälle als permanente Regressionen sichern:
  - MRAM Handgröße
  - Krash encounter-gebundener Pump und Grubb runweiter Pump
  - Olivia reduzierte Rez-Kosten
  - Startup Immolator Post-Pass-Aktion
  - Corporate Negotiating Center Reveal
  - Wall of Ice Einzel-Subroutinen
  - Loan from Chiba Install-Credits ohne Recurring-Counter
  - Restrictive Net Zoning Zielserverbindung
- Neue Kartenfreigaben nur mit Definition-, LegalAction-, Revalidation-, Visibility-, Replay- und Chroniktest.
