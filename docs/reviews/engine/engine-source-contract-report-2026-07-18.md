# Engine Source Contract Report 2026-07-18

Status: E15 verified current state

## Ergebnis

Die Engine-Struktur ist nach E01 bis E15 ausführbar abgesichert. Der produktive
Graph besitzt keine relativen Importzyklen, keine untypisierten Runtime-
Delegate-Grenzen und keine nummerierten CardImplementation-Registries. Große
Damage-, Access-, Run-, Turn- und Ability-Hotspots besitzen fachliche Module
mit festen Größenlimits.

## Ausführbare Verträge

| Vertrag                                           | Nachweis auf E15-Stand                    |
| ------------------------------------------------- | ----------------------------------------- |
| Produktive Engine-Quellen                         | 998 Dateien im Strukturguard              |
| Relative Importzyklen                             | 0                                         |
| Typisierte Runtime-Port-Bindings                  | 430                                       |
| Runtime-Delegate-Store/-Dateien                   | 0                                         |
| Produktive `ResolvedGameEffect`-Assertions        | 0                                         |
| Unregistrierte versionierte Ability-Payloadfelder | 0                                         |
| CardImplementation-Architekturfindings            | 0 in allen sieben Kategorien              |
| Card-Function-Abstraction                         | 132 überprüfte Baseline-Funde, kein Drift |
| Engine-Testdateien                                | 201 vor E15-Source-Contract-Test          |
| Engine-Tests                                      | 1.739 vor E15-Source-Contract-Test        |

Die maßgeblichen Befehle sind:

```text
pnpm check:engine-source-structure
pnpm check:engine-source-structure:selftest
pnpm check:engine-cardimplementation-architecture-target
pnpm check:card-function-abstraction
pnpm check:package-boundaries
pnpm check:test-discovery
pnpm --filter @netgrid/engine typecheck
pnpm --filter @netgrid/engine test
```

## Teststruktur

Die bisherige Release-Sammeldatei `mechanic-package-smokes-v16-v199.test.ts`
mit 8.648 Zeilen ist in sieben fachlich benannte Releasebereiche geteilt. Die
4.205-zeilige `card-release-smokes.test.ts` ist in vier Card-Release-Suites
geteilt. Alle 1.739 bestehenden Testfälle blieben erhalten; lediglich die
physischen Dateien änderten sich von 192 auf 201.

`test-suite-structure.test.ts` verlangt die elf neuen Dateien, verbietet die
beiden alten Sammeldateien, begrenzt Release-Smokes auf 3.000 Zeilen und setzt
für jede Engine-Testdatei eine Obergrenze von 7.000 Zeilen. Damit kann kein
neuer Testmonolith in der bisherigen Größenordnung entstehen.

## Kommentierungsvertrag

Kommentare wurden nur an nicht offensichtlichen Autoritäts- und
Sicherheitsgrenzen ergänzt:

- Damage-Fensterreihenfolge und erster Zufallszug,
- persistierte Prevention-Kandidatenreihenfolge,
- Access-Reveal als Hidden-Info-Barriere,
- Exklusivität von CardImplementation und Legacy-Access-Fallback,
- Run-End-Mutationsreihenfolge,
- deterministische Registry-Gruppenreihenfolge.

Selbsterklärende Mutation und reine Delegation bleiben bewusst unkommentiert.
Die ausführlichen Verantwortungs- und Abhängigkeitsverträge liegen in den
Current-State-Seiten unter `docs/architecture/engine/`.
