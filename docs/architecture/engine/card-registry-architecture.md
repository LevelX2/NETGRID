# Card Registry Architecture

Status: Current State seit E14 des Engine Architecture Refresh 2026-07-18

## Zweck

Die CardImplementation-Registry besitzt eine fachliche, deterministische
Struktur nach Kartenset, Seite und Kartentyp. Nummerierte Sammeldateien ohne
fachliche Bedeutung sind nicht mehr zulässig. Registry und Coverage bleiben
Metadaten-/Lookup-Schichten und führen keine Regeln aus.

## Registry-Aufbau

`card-implementation-catalog.ts` definiert die vollständige Reihenfolge über
`CARD_IMPLEMENTATION_CATALOG_GROUPS`. Jede Gruppe trägt explizit:

- `set`: `classic`, `onr-v1` oder `proteus`,
- `side`: `corp` oder `runner`,
- `cardType`: den Shared-Kartentyp,
- `implementations`: die konkreten CardImplementation-Definitionen.

Der flache öffentliche Katalog entsteht ausschließlich durch `flatMap` dieser
Gruppen. `registry.ts` baut daraus den Lookup nach `cardDefinitionId`. Es gibt
keine zweite manuell gepflegte flache Liste.

## Determinismus und Parität

Die Reihenfolge der Gruppen ist absichtlich im Katalog ausgeschrieben. Dadurch
bleibt Registry-Iteration unabhängig von Dateisystem-, Glob- oder
Importauflösungsreihenfolgen. Der Test `catalog-structure.test.ts` beweist:

- die exakte Set-/Seite-/Typ-Reihenfolge,
- eindeutige Gruppenschlüssel,
- identische flache Registry und Gruppenkonkatenation,
- eindeutige `cardDefinitionId`s,
- Übereinstimmung jeder Gruppe mit ID-Präfix, Seite und Typ aus den Shared
  CardDefinitions.

Die bestehenden Classic-/Proteus-Manifest- und Coverage-Tests ergänzen diesen
Vertrag um Dateiparität, Resolver-/AI-Referenzen und Supportstatus.

## Coverage-Aufbau

`coverage.ts` leitet den Supportstatus aus Registry und Ability-Verträgen ab.
Die große, rein deklarative Ausnahmekarte konkreter Quellpfade liegt separat in
`coverage-source-locations.ts`. Coverage darf weder LegalActions beeinflussen
noch Kartenverhalten ausführen.

## Ausführbare Grenzen

`scripts/check-engine-source-structure.mjs` verbietet nummerierte
`card-implementation-group-NNN.ts`-Dateien und begrenzt Coverage-Regeldatei und
Source-Location-Daten. Neue Karten werden in genau die passende fachliche
Subregistry aufgenommen; neue unspezifische Chunk-Gruppen sind kein erlaubter
Erweiterungspfad.
