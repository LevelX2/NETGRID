# Engine Runtime Finalization Post ARCH-108

## Ausgangspunkt

STATUS-1 hatte `packages/engine/src/index.ts` als zentralen Engine-/Host-Monolithen mit 32.111 LOC beschrieben. Über die ARCH-91-bis-107-Schnitte wurden PerformAction, ApplyAction, EventContext, LegalAction, MainAction, Run/Access, State-Services und anschließend die Runtime-Staging-Datei aus `index.ts` herausgelöst.

ARCH-108 schließt diese Index-/Runtime-Fassadenphase ab. Es wurde keine Gameplay-Domain verschoben und keine Regel-, Payload-, Replay-, PendingChoice- oder ActionID-Semantik geändert.

## Aktueller Stand

| Datei                                                                        | Stand nach ARCH-108 | Rolle                                 |
| ---------------------------------------------------------------------------- | ------------------: | ------------------------------------- |
| `packages/engine/src/index.ts`                                               |              79 LOC | explizite Package-Public-Fassade      |
| `packages/engine/src/game/engine-runtime.ts`                                 |              79 LOC | explizite Runtime-Public-Fassade      |
| `packages/engine/src/game/engine-runtime-internal/public-api.ts`             |              79 LOC | explizites internes Public-API-Barrel |
| `packages/engine/src/game/engine-runtime-internal/runtime-implementation.ts` |            gelöscht | kein Staging-Restcontainer mehr       |
| `packages/engine/src/game/engine-runtime-internal/runtime-bootstrap.ts`      |       ca. 2.930 LOC | importzeitliche Runtime-Konfiguration |
| `packages/engine/src/game/engine-runtime-internal/runtime-delegates.ts`      |       ca. 1.726 LOC | mechanische Delegate-Bindungen        |

Größte interne Runtime-Module bleiben unter dem Gate von 3.200 LOC. Die größten bekannten Module sind:

| Modul                           | Rolle                                        |
| ------------------------------- | -------------------------------------------- |
| `choice-hidden-zone-runtime.ts` | Choice-/HiddenZone-Runtime-Bridges           |
| `card-runtime-hosts.ts`         | CardImplementation-/Ability-Host-Bridges     |
| `turn-runtime-resolvers.ts`     | Turn-nahe Runtime-Resolver                   |
| `state-runtime-resolvers.ts`    | State-nahe Runtime-Resolver                  |
| `state-runtime-services.ts`     | State-Service-Adapter                        |
| `action-runtime-hosts.ts`       | Apply-/Legal-/MainAction-nahe Host-Bridges   |
| `flow-runtime-hosts.ts`         | Run-/Access-/Damage-/Trace-nahe Host-Bridges |

## Public API Struktur

`@netgrid/engine` exportiert explizit aus `game/engine-runtime.ts`. `game/engine-runtime.ts` exportiert explizit aus `engine-runtime-internal/public-api.ts`. `public-api.ts` exportiert die öffentlichen Werte und Typen direkt aus ihren Besitzer-Modulen oder aus `@netgrid/shared`.

Es gibt keinen blinden Reexport mehr aus:

- `packages/engine/src/index.ts` nach `./game/engine-runtime`
- `packages/engine/src/game/engine-runtime.ts` nach `./engine-runtime-internal`
- `packages/engine/src/game/engine-runtime-internal/public-api.ts` nach `./runtime-implementation`

Bei Zweifeln bleibt ein bestehender Export erhalten. ARCH-108 entfernt keine Public API.

## Importgrenzen

Verbindliche Grenzen:

- Produktive `game/* -> index` Imports bleiben 0.
- Tiefe Fachmodule importieren nicht aus `game/engine-runtime.ts`.
- Tiefe Fachmodule importieren nicht aus `game/engine-runtime-internal/*`.
- `engine-runtime-internal/*` importiert nicht aus `index.ts`.
- `index.ts` und `game/engine-runtime.ts` enthalten keine Gameplay- oder Host-Implementierung.

## LOC-Gates

`runtime-module-size.test.ts` sichert:

- `packages/engine/src/index.ts <= 150 LOC`
- `packages/engine/src/game/engine-runtime.ts <= 150 LOC`
- `runtime-implementation.ts <= 200 LOC`, falls die Datei wieder angelegt wird
- `runtime-bootstrap.ts <= 3.200 LOC`
- `runtime-delegates.ts <= 2.000 LOC`
- kein produktives `engine-runtime-internal/*.ts` Modul über 3.200 LOC
- keine blinden Public-Facade-Reexports
- keine produktiven Imports aus Public- oder Runtime-Fassaden in tiefe Fachmodule

## Verbleibende technische Schulden

`runtime-bootstrap.ts` ist noch groß und importzeitlich empfindlich. Änderungen dort müssen die Konfigurationsreihenfolge respektieren und dürfen keine Gameplay-Logik neu modellieren.

`runtime-delegates.ts` ist mechanisch und breit. Neue Fachlogik gehört nicht dorthin; bestehende Delegates sollten später nur durch gezielte Domain-Schnitte verschwinden.

Mehrere interne Runtime-Domainmodule bleiben groß, aber unter Ceiling. Die nächsten sinnvollen Arbeiten sind gezielte interne Domainverbesserungen an Choice/HiddenZone, CardRuntime, Turn, State oder Flow, nicht weitere Public-Facade-Arbeit.

`public-context.ts` bleibt eine eigene vertragsnahe spätere Boundary. PublicPayload, PlayerView, PublicEvent, Replay, StateHash, PendingChoice-Werte und ActionIDs wurden in dieser Phase bewusst nicht migriert.

## Regeln für künftige Änderungen

Nicht mehr in `index.ts` oder `game/engine-runtime.ts` ergänzen:

- Gameplay-Implementierung
- Host-Factories
- State-Primitives
- Choice-/HiddenZone-/Lifecycle-Logik
- RuntimeDeps-Konfiguration
- CardImplementation-Runtime-Logik

Neue öffentliche Exports werden explizit in `public-api.ts`, `game/engine-runtime.ts` und `index.ts` aufgenommen. Neue private Runtime-Fachlogik gehört in ein passendes `game/*`-Modul oder ein eng benanntes Modul unter `engine-runtime-internal`, solange die Import- und LOC-Gates grün bleiben.

## Nächster Schritt

Die Index-/Runtime-Fassadenrestrukturierung ist abgeschlossen. Weitere Architekturarbeit sollte als interne Domainmodul-Verbesserung laufen, zum Beispiel Bootstrap-Abbau, Choice/HiddenZone-Verfeinerung, CardRuntime-Host-Verkleinerung oder PublicContext-Readiness-Audit.
