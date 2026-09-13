# Card Registry Architecture

Status: current  
Stand: 2026-08-12

## Zweck

Die Engine besitzt keine zweite kartenspezifische Autorenquelle. Die kanonischen Kartenspezifikationen liegen in `@netgrid/cards`; die Engine konsumiert daraus die mechanische CardImplementation-Projektion und stellt darauf nur Lookup, Coverage und Regelausführung bereit.

Führende Gesamtarchitektur ist `../central-card-specification-and-registry-target-state-2026-08-09.md`.

## Registry-Aufbau

`packages/engine/src/card-implementations/registry.ts` lädt die beiden CardSpec-Projektionen

- `cardSpecImplementations()` und
- `cardSpecImplementationDefinitionIds()`

aus `@netgrid/cards/engine`.

Vor der Veröffentlichung prüft die Registry fail-closed:

- identische Anzahl von Implementierungen und erwarteten IDs;
- eindeutige `cardDefinitionId`s;
- identische deterministische Reihenfolge beider Projektionen.

Bei Abweichung bricht der Aufbau mit `card_spec_implementation_authority_mismatch` ab. Die veröffentlichte Liste und der Lookup nach `cardDefinitionId` werden anschließend eingefroren.

Damit gibt es keine zweite manuell gepflegte Registry-Reihenfolge, keine dateisystemabhängige Discovery und keinen separaten CardImplementation-Katalog als Autorenautorität.

## Coverage

`packages/engine/src/card-implementations/coverage.ts` ist ausschließlich Metadaten- und Auditlogik. Sie beeinflusst weder Legalität noch Kartenverhalten.

Coverage verwendet aus `@netgrid/cards/engine`:

- `cardSpecImplementationDefinitionIds()` für implementierungsprojizierte Karten;
- `cardSpecRuntimeDefinitionIds()` für CardSpecs mit Runtimevertrag;
- `cardSpecSourceRefByDefinitionId()` für den kanonischen Sourcepfad.

Eine separate `coverage-source-locations.ts` ist ausdrücklich nicht mehr zulässig. Quellpfade stammen aus der CardSpec selbst. Karten mit vollständig generischer Basismechanik können als `no_engine_behavior_required` klassifiziert werden, ohne eine künstliche CardImplementation anzulegen.

## Verantwortungsgrenze

### CardSpec-Verträge statt leerer Mechanics-Profile

`mechanics/agenda-scoring.ts`, `payment-costs.ts` und `hosting-counters.ts`
sind samt ihren leeren Profilpfaden entfernt. Neue Karten verwenden die
CardSpec-Projektionen; leere Tabellen, Lookup-Stubs und synthetische
Hostprofile dürfen keine zweite Kartenautorität begründen.

- Installed-Economy-Fähigkeiten laufen über aktive CardSpec-Verträge.
  Der leere profilbasierte Resolver samt Validator und Ports ist entfernt.
  Die eigenständige Investment-Firm-Credit-Choice bleibt aktiv.
- `hosting-counters.ts` und `COUNTER_UPGRADE_SOURCES` sind entfernt.
  Die daran gebundenen `v1918UpgradeAbility=add_power_counter`-Angebote und
  ihre Ausführung besaßen keinen produktiven Kartenvertrag. Der bestehende
  Dr.-Dreff-Test schützt weiterhin vor diesem unzulässigen Aktionsangebot.
- `agenda-scoring.ts` ist entfernt, einschließlich leerer Overadvance-/Reveal-
  Mengen, Counter-Credit-Profile, gebundener Hostzweige und synthetischer
  Profiltests. Generische CardSpec-Overadvance- und aktivierte Agenda-Fähigkeiten
  bleiben erhalten. Der Counter-Operation-Verbraucher importiert direkt
  `CORP_ADVANCEMENT_COUNTER_OPERATION_SOURCES` aus der CardSpec-Ableitung.

Eine Entfernung umfasst jeweils Producer, Hostports, Verdrahtung und nur die
synthetischen Tests des toten Pfads. Es entstehen keine Ersatzprofile oder
Kompatibilitätsaliase. Reale Karten-, Replay- und Public-Verträge sind über
fokussierte bestehende Regressionen sowie Typ- und Strukturgates zu prüfen.

- CardSpec ist kartenspezifische Autorenwahrheit.
- `CardImplementationDefinition` ist die von der Engine interpretierte mechanische Projektion.
- `registry.ts` stellt deterministischen Lookup bereit.
- `coverage.ts` beschreibt technischen Abdeckungsstatus für Audits und Tests.
- Rules Engine und `applyAction` bleiben alleinige Autorität für Legalität und Ausführung.

## Ausführbare Grenzen

`corepack pnpm check:engine-source-structure` schützt diesen Vertrag unter anderem dadurch, dass

- nummerierte unspezifische CardImplementation-Gruppen verboten sind;
- `coverage-source-locations.ts` nicht wieder eingeführt werden darf;
- Coverage die drei erforderlichen CardSpec-Projektionen importieren muss;
- CardImplementations keine neue Rückwärtsabhängigkeit in die Game-Ausführung erhalten dürfen.

Registry- und Coverage-Tests sichern zusätzlich Eindeutigkeit, Projektion und Kartenparität.
