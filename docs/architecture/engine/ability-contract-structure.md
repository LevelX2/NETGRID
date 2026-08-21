# Ability Contract Structure

Status: current

## Ziel

Die CardImplementation-Verträge sind eine rein deklarative, engine-lokale
Sprache. Sie beschreiben zulässige Fähigkeiten, Effekte und Modifikatoren,
führen aber keine Regeln aus, lesen keinen `GameState` und enthalten keine
konkreten Karten-IDs.

`definition-types.ts` bleibt als kleiner Kompatibilitätsknoten bestehen. Neue
Imports dürfen ihn weiter verwenden; neue Verträge werden jedoch in der
passenden Familie definiert.

## Familien

| Modul                              | Verantwortung                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `definition-core-contracts.ts`     | gemeinsam verwendete Blattverträge für Bedingungen, Kosten, Limits, Access-Zonen und Subroutinen |
| `definition-effect-contracts.ts`   | von der Rules Engine interpretierte Effektkommandos                                              |
| `definition-modifier-contracts.ts` | Kosten-, Stärke-, Prevention-, Trace- und Encounter-Modifikatoren                                |
| `definition-ability-contracts.ts`  | On-play-, Activated-, Lifecycle- und direkte Ability-Verträge                                    |
| `definition-domain-contracts.ts`   | Access-, Run-, Utility-, Lifecycle- und Scored-Agenda-Domänen                                    |
| `definition-card-contracts.ts`     | oberste Ability- und Modifier-Unions für CardImplementations                                     |

Die Abhängigkeitsrichtung verläuft von den Blattverträgen zu Effekten und
Modifikatoren, anschließend zu Ability-/Domänenverträgen und zuletzt zu den
obersten Card-Unions. Zwischen den Familien existiert kein Importzyklus.

## Gleichzeitige Lifecycle-Fähigkeiten

`CardLifecycleTriggeredAbilityImplementation.simultaneousResolution` ist eine
ausdrückliche Autoren-Garantie, keine aus den Effekten geratene Optimierung.
`order_independent_between_copies` erklärt ausschließlich, dass gleichzeitig
fällige Kopien derselben Kartendefinition unter dem aktuellen Regelvertrag in
beliebiger Reihenfolge aufgelöst werden dürfen.

Eine Runtime darf diese Garantie nur verwenden, wenn alle offenen Quellen
Kopien derselben Definition sind, jede fällige Lifecycle-Fähigkeit die Garantie
trägt und keine Quelle einen zusätzlichen Startpfad besitzt. Gemischte,
unmarkierte oder mehrdeutige Mengen bleiben fail-closed bei der regelkonformen
Spielerwahl. Der Vertrag autorisiert weder Karten-ID-Sonderfälle noch eine
allgemeine Äquivalenzanalyse beliebiger Effekte.

## Guard

`check:engine-source-structure` begrenzt `definition-types.ts` auf 20 Zeilen,
erwartet genau sechs Familienmodule, begrenzt jedes auf 1.200 Zeilen und
verwirft ausführbare Statements. Damit kann weder der frühere Monolith noch ein
neuer Runtime-Seiteneffekt unbemerkt zurückkehren.
