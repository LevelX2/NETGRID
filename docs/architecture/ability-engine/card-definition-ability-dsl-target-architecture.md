# NETGRID CardDefinition / Ability DSL Target Architecture

Hinweis zum aktuellen Umsetzungsstand nach P2.13a: Die neue Kartenlogik liegt derzeit bewusst engine-lokal in `packages/engine/src/card-implementations` und `packages/engine/src/ability-engine`. Die normale Shared-`CardDefinition` bleibt Katalog-, Deckbau- und Anzeigequelle. Der detaillierte Arbeitsstand steht in `card-implementation-tranche-status.md`.

## 1. Zielbild

NETGRID-Karten sollen langfristig nicht durch verstreute Engine-Sonderfälle umgesetzt werden, sondern ihre Spielwirkung möglichst vollständig über CardDefinition-nahe, maschinenlesbare Datenstrukturen beschreiben.

Eine Karte soll in ihrer Definition ausdrücken können:

- statische Werte wie Kosten, Stärke, Einfluss, Subtypen und Basiseigenschaften
- Kosten und alternative Kostenmodelle
- Bedingungen für LegalAction-Erzeugung und Revalidierung
- Zielauswahl und Zielbindung
- passive Modifier
- aktive Abilities
- Trigger
- Dauer und Ablaufzeitpunkt
- Sichtbarkeit
- Effektauflösung
- Chronik- und `ResolvedEffect`-Ausgabe
- Einschränkungen wie `once_per_run`, `once_per_turn`, `same_server` oder Subtype-Anforderungen

Die Engine soll diese Beschreibung generisch interpretieren. Eine neue Karte soll nach Möglichkeit durch CardDefinition-/Ability-/Modifier-Daten formulierbar sein, ohne dass generische Pipelines neue kartenbezogene `if`-Zweige bekommen.

## 2. Grundprinzipien

1. `CardDefinition` ist die Quelle der Kartenabsicht.
2. Engine-Pipelines interpretieren generische Strukturen.
3. Generische Engine-Funktionen sollen keine konkreten Karten-IDs als Entscheidungslogik enthalten.
4. Karten-IDs sind in Tests, CardDefinitions, Registries und Migrationstabellen erlaubt, aber nicht als dauerhafte Sonderfalllogik in Cost-, Modifier-, Trigger- oder Effect-Pipelines.
5. Kosten, Ziele, Bedingungen und Effekte müssen aus derselben Quelle ableitbar sein.
6. LegalAction-Erzeugung und `applyAction`-Revalidierung müssen dieselbe semantische Quelle verwenden.
7. `PublicPayload`, `PlayerView`, Chronik und AI-Auswertung sollen aus typisierten `ResolvedEffects` und öffentlichen Definitionsteilen entstehen.
8. Übergänge müssen inkrementell, getestet und rückwärtskompatibel erfolgen.

## 3. Was langfristig vermieden werden soll

Diese Muster sind als Dauerzustand zu vermeiden:

- `if (definition.id === "karte_x")` in generischen Engine-Pipelines
- mehrere Funktionen rekonstruieren Betrag, Bedingung und Source derselben Karte separat
- Kartentext und ausführbare Logik laufen auseinander
- UI zeigt Kosten oder Ziele aus anderen Daten als die Engine prüft
- Chronik wird über ad hoc Payload-Sonderfelder statt über typisierte Effekte erzeugt
- Modifier-Laufzeiten wie `run`, `encounter`, `turn` oder `while_installed` werden pro Karte anders gespeichert
- neue Karten erzwingen neue Engine-Sonderfälle

Sonderfalllogik ist während der Migration akzeptabel, wenn sie eng begrenzt, getestet und als Übergang sichtbar ist. Sie darf aber nicht zum neuen Zielmodell werden.

## 4. Erlaubte Übergangszustände

Die Migration soll nicht als Big-Bang-Umbau erfolgen. Bestehendes Verhalten bleibt führend, und jeder Schritt muss einzeln prüfbar bleiben.

```text
Level 0: verstreute Engine-Sonderfälle
Level 1: zentrale Pipeline, aber noch hardcodierte Kartenlogik
Level 2: engine-lokale deklarative Regeltabelle
Level 3: CardDefinition-nahe Modifier-/Ability-Daten
Level 4: vollständige generische Interpretation durch Cost-, Modifier-, Trigger- und Effect-Engine
```

Aktuelle Einordnung:

- P1 Cost-Pipeline: Level 1. Corp-ICE-Rez-Kosten haben eine zentrale Quote-Schicht, enthalten aber noch kartennahe Übergangslogik.
- P2 ActiveModifier Query: Vorbereitung für Level 3/4. `collectActiveModifiers(state)` rekonstruiert bestehende Modifier rein lesend, ohne produktive Berechnungspfade umzustellen.
- P2.1 Corp-Rez-Cost-Modifikatoren als lokale Regeltabelle: historischer Level-2-Zwischenschritt.
- P2.2 bis P2.13a CardImplementation-Tranche: Level 2/3. Konkrete Karten liegen jetzt in engine-lokalen `CardImplementationDefinition`s; generische Ability-/Effect-/Modifier-Bausteine liegen in `ability-engine`.
- Ziel für passive Modifier: Level 3/4. Passive Modifier sollen deklarativ in CardImplementation-/Ability-Daten beschrieben und von generischen Query-/Cost-/Modifier-Pipelines gelesen werden.
- Ziel für komplexe Fähigkeiten wie Olivia Salazar: später Level 3/4 über Ability-, Trigger-, Cost- und Effect-Strukturen.

## 5. Beispiel: passiver Rez-Cost-Modifier

Aktueller engine-lokaler Beispielstil für Data Masons:

```ts
{
  cardDefinitionId: "onr_v1_317_data-masons",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 2,
      appliesTo: {
        cardType: "ice",
        subtype: "wall"
      },
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public"
    }
  ]
}
```

Zielbeispiel für Jerusalem City Grid:

```ts
{
  cardDefinitionId: "onr_v1_360_jerusalem-city-grid",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 2,
      appliesTo: {
        cardType: "ice",
        subtype: "wall",
        sameServerAsSource: true
      },
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public"
    }
  ]
}
```

In diesem Zielzustand braucht `cost-pipeline.ts` keine konkrete Kenntnis von Data Masons, Encoder, Inc., Skälderviken SA Beta Test Site oder Jerusalem City Grid mehr. Die Pipeline sammelt generisch aktive `rez_cost`-Modifier, prüft deren `appliesTo`-Bedingungen gegen das Ziel-ICE und erzeugt daraus `CostModifierQuote`, LegalAction-Kosten und kompatible öffentliche Payload-Felder.

Fortress Architects ist inzwischen kein Rez-Cost-Beispiel mehr, sondern ein `install_cost`-POC für Corp-ICE-Installation.

## 6. Beispiel: optionale Fähigkeit

Olivia Salazar ist kein einfacher passiver Modifier wie Fortress Architects. Die Karte beschreibt eine optionale Fähigkeit im Rez-Fenster eines Runs und verbindet Timing, Zielkontext, Kostenmodifikation, Limit und Folgeeffekt.

Langfristig ist Olivia eher eine deklarative Ability mit:

- Timing: Approach ICE / Rez Window
- Bedingung: Source ist rezzed im angegriffenen Server-Root
- Kosten-/Modifierwirkung: aktuelle Rez-Kosten halbieren
- Limit: einmal pro Run und Source
- Nebeneffekt: temporäres Derez am Run-Ende
- Revalidation: Quelle, Timing, ICE und Kosten müssen beim Ausführen erneut gültig sein

Grobe Zielskizze, kein fertiges API-Versprechen:

```ts
{
  id: "onr_v1_363_olivia-salazar",
  abilities: [
    {
      timing: "run.approach_ice",
      kind: "cost_modifier_ability",
      appliesTo: {
        action: "corp_rez",
        target: "approached_ice",
        sameServerAsSource: true
      },
      modifier: {
        kind: "rez_cost",
        operation: "halve_current_cost_round_down"
      },
      limit: {
        kind: "once_per_run_per_source"
      },
      afterResolution: [
        {
          kind: "temporary_derez_at_run_end",
          target: "rezzed_ice"
        }
      ]
    }
  ]
}
```

Die zentrale Anforderung bleibt: LegalAction-Erzeugung und Ausführung dürfen nicht auseinanderlaufen. Eine alte LegalAction darf nur gelten, wenn dieselbe Ability aus aktuellem `GameState` noch legal ist und die neu berechnete Quote zu den Action-Kosten passt.

## 7. Verhältnis zu bestehenden Phasen

P1 Cost-Pipeline bleibt sinnvoll als zentrale Auswertungsstelle für Corp-Rez-Kosten. Sie soll aber nicht dauerhaft Kartenwissen sammeln, sondern generische Cost-Modifier aus Definitionen, aktiven Modifiersichten und optionalen Abilities auswerten.

P2 ActiveModifier Query bleibt sinnvoll als Sicht auf aktive Modifier. Die Query-Schicht darf bestehende Zustände rekonstruieren und später als Übergang zur CardDefinition-nahen Modifier-Welt dienen, ohne selbst persistenter State zu werden.

P2.1 lokale Regeltabelle ist ein Zwischenschritt, nicht der Zielzustand. Sie reduziert doppelte Betrag-/Source-/Bedingungslogik in der Cost-Pipeline, bleibt aber engine-lokal und enthält weiterhin konkrete Karten-IDs.

P2.2 sollte passive Corp-Rez-Cost-Modifier aus der lokalen Cost-Pipeline-Regeltabelle in CardDefinition-nahe Modifier-Daten verschieben. Danach sollte `cost-pipeline.ts` nicht mehr direkt wissen müssen, welche Karte Data Masons Hosting, Encoder Inc, Skålderviken SA Beta Test Site, Fortress Architects oder Jerusalem City Grid ist.

P3 Reveal/Chronik, P4 Target Binding, P5 EffectCommand und P6 Trigger Registry bleiben separate spätere Schritte. Sie sollen nicht verdeckt in P2.2 oder andere Modifier-Refactorings hineinwachsen.

## 8. Akzeptanzkriterien für künftige Refactorings

Ein Refactoring bewegt sich in Richtung Zielbild, wenn:

- konkrete Karten-IDs aus generischen Engine-Pipelines verschwinden
- Kartenwirkung näher an CardDefinition-/Ability-/Modifier-Daten rückt
- LegalAction-Erzeugung und Revalidation dieselbe Quelle nutzen
- Payload und Chronik aus typisierten Daten entstehen
- Tests belegen, dass Verhalten gleich bleibt
- keine neue Doppelwahrheit entsteht

Ein Refactoring ist verdächtig, wenn:

- eine neue Pipeline neue `if cardId`-Sonderfälle sammelt
- dieselbe Kartenwirkung an mehreren Stellen rekonstruiert wird
- UI oder Chronik neue Sonderfelder ohne typisierte Effektbasis braucht
- neue Karten nur durch neue Engine-Sonderfälle umsetzbar sind

## 9. Konkrete nächste technische Ableitung

Der ursprüngliche nächste Schritt nach P2.1 war:

```text
P2.2: Passive Corp-Rez-Cost-Modifier aus der lokalen Regelstruktur in CardDefinition-nahe Modifier-Daten verschieben.
```

Dieser Schritt ist inzwischen als engine-lokale CardImplementation-Tranche umgesetzt und weiter ausgebaut. Der aktuelle Stand umfasst zusätzlich `on_play`, `activated_card_ability`, `gain_credits`, `draw_cards`, ordered effect sequences, `resolvedEffects`, Chronik mit Kartenbezug, `install_cost`, `ice_strength`, `additional_subroutine`, dynamische Subroutine-Attribution und gemeinsame Modifier-Query-Helfer.

Dabei soll `cost-pipeline.ts` nicht mehr direkt wissen, welche Karte Data Masons, Encoder, Inc., Skälderviken SA Beta Test Site oder Jerusalem City Grid ist. Fortress Architects ist als `install_cost`-POC eingeordnet.

Die Pipeline soll nur noch generisch:

- aktive Corp-Root-Karten sammeln
- deren Definitionen nach `rez_cost`-Modifiern durchsuchen
- `appliesTo`-Bedingungen auswerten
- `CostModifierQuote` erzeugen
- `PublicPayload` kompatibel halten

Für die nächsten konkreten Optionen siehe `card-implementation-tranche-status.md`.

## 10. Offene Fragen

- Der genaue Ort der CardDefinition-nahen Modifier-Daten ist noch zu entscheiden: direkt im bestehenden `CardDefinition`-Typ, als engine-lokale Erweiterung beim Laden der Demo-Karten oder als eigene Registry, die später mit den Definitionen zusammengeführt wird.
- Die finale Typform für `appliesTo`, `activeWhile`, Limits und Ability-Timing ist noch nicht festgelegt. Die Beispiele in diesem Dokument sind Zielskizzen, keine verbindliche API.
- Für komplexe optionale Abilities muss noch geklärt werden, wie generische Ability-Daten LegalAction-IDs, Payload-Kompatibilität und stale-action Revalidation ohne Hidden-Info-Leak stabil abbilden.
- Für Chronik und AI-Auswertung ist noch zu definieren, welche `ResolvedEffect`-Strukturen öffentliche Definitionsteile referenzieren dürfen und welche Details nur intern bleiben.
