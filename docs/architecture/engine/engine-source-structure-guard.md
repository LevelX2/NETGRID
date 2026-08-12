# Engine Source Structure Guard

Status: current  
Stand: 2026-08-12

## Zweck

`corepack pnpm check:engine-source-structure` schützt die produktive Rules Engine gegen neue Importzyklen, untypisierte Runtime-Komposition, rückwärts gerichtete Schichtabhängigkeiten und die Wiedereinführung bereits entfernter Legacy-Strukturen.

Der Guard analysiert produktive TypeScript-Dateien unter `packages/engine/src` mit dem TypeScript-Parser.

## Aktuell geschützte Verträge

### Importgraph und Schichten

- Relative Imports im produktiven Engine-Graph müssen azyklisch bleiben.
- `game/engine-runtime-internal/` darf von außen nur über `game/engine-runtime.ts` betreten werden.
- `ability-engine/` und `card-implementations/` dürfen nicht zurück in `game/` importieren.
- Zwei aktuell ausdrücklich inventarisierte Ability-Engine-Kanten sind noch als abzubauende Layer-Schuld erlaubt:
  - `ability-engine/active-modifiers.ts -> game/state/temporary-breaker-strength.ts`
  - `ability-engine/card-implementation-runtime-activated-costs.ts -> game/payment/runner-payment-support.ts`
- Neue unerlaubte Kanten und inzwischen verschwundene, aber noch eingetragene Schuld sind beide Fehler.

### Runtime-Komposition

Die früheren Runtime-Delegate-Dateien, der dynamische Delegate-Store und der Delegate-Barrel dürfen nicht wieder eingeführt werden.

`runtime-port-contracts.ts`, `runtime-port-bindings.ts` und die fachlichen Runtime-Portmodule müssen ohne `any` bleiben. Die deklarativen Portmodule dürfen keine ausführbaren Runtime-Statements enthalten.

Innerhalb von `game/engine-runtime-internal/` darf das stabile `deps`-Objekt nicht per Object-Destructuring als Momentaufnahme eingefroren werden. Factories müssen spätere Vervollständigung der Komposition weiterhin über das gemeinsame Dependency-Objekt sehen.

### Ability-Verträge

Alle `definition-*-contracts.ts` unter `ability-engine/` sind reine deklarative Typverträge. Ausführbare Statements in diesen Dateien sind ein Strukturfehler.

### CardSpec-, Registry- und Coverage-Grenze

- Nummerierte `card-implementation-group-NNN.ts`-Subregistries sind verboten.
- `card-implementations/coverage-source-locations.ts` muss entfernt bleiben; CardSpec-Source-Refs sind die Quellautorität.
- `card-implementations/coverage.ts` muss aus `@netgrid/cards/engine` mindestens
  `cardSpecImplementationDefinitionIds`, `cardSpecRuntimeDefinitionIds` und
  `cardSpecSourceRefByDefinitionId` konsumieren.

### Öffentliche Effektverträge

Produktive Engine-Dateien dürfen `ResolvedGameEffect` nicht durch Type Assertions umgehen. Ein Effekt muss seinen gemeinsamen Vertrag beim Producer erfüllen.

## Fail-closed-Ratchet

Die ausdrücklich inventarisierten Ausnahmen sind kein Dauerbestand. Der Guard behandelt sowohl neue Schulden als auch veraltete Allowlist-Einträge als Fehler. Wird eine der zwei verbleibenden Layer-Kanten entfernt, muss ihr Allowlist-Eintrag im selben Änderungsschnitt verschwinden.

## Selftest

`corepack pnpm check:engine-source-structure:selftest` erzeugt isolierte Gegenbeispiele für die geschützten Fehlerklassen und beweist, dass der Guard nicht nur einen grünen Ist-Zustand beschreibt, sondern Verstöße tatsächlich erkennt.
