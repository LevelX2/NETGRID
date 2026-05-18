# Counter/Hosting 0.99 Specification

Status: Spezifikation für V0.99a und V0.99b
Stand: 2026-05-04

## Regelbasis

- CR 1.9 beschreibt Counter und Tokens als Ressourcen- oder Statusmarker; der Vorrat ist unbegrenzt.
- CR 1.13 beschreibt Hosting als direkte Beziehung zwischen Hosted Object und Host. Hosting ist nicht transitiv, ein Objekt kann nur auf einer Karte gehostet sein, und ein Host-Wechsel entsteht nur durch eine Kartenfähigkeit.
- Hosted Counter zählen nicht als Counter des Hosts oder als Counter eines Spielers.

## Datenmodell

Additiv vorzusehen:

- `CounterType` mit mindestens `virus`, `power`, `agenda`, `recurring_credit`, `bad_publicity`, `charge`, `mark`, `dividend`, `core_damage` und `advancement`.
- `CardInstance.counters?: Partial<Record<CounterType, number>>` für Karten-Counter.
- `CardInstance.hostedOn?: CardInstanceId` für die direkte Host-Beziehung.
- `CardDefinition.recurringCredits?: number` für gedruckte Recurring-Credit-Maxima.
- Neue Demo-Decks `demo_runner_099` und `demo_corp_099`.

## Counter-Vertrag

- Counter-Werte sind immer nicht-negative Integer.
- Counter mit Wert 0 werden nach Möglichkeit entfernt, um StateHash-Churn klein zu halten.
- Advancement-Counter bleiben rückwärtskompatibel über `advancementCounters`; V0.99-Counter dürfen diese vorhandene Score-Logik nicht brechen.
- PublicEvents dürfen Counter-Summen auf offenen Karten nennen, aber keine verdeckten Kartentitel offenlegen.

## Hosting-Vertrag

| Aspekt | V0.99b-Regel |
|---|---|
| Host | Nur die lokale offene Runner-Resource `v099_host_resource`. |
| Hosted Object | Ein offenes Runner-Programm aus der eigenen Grip-Auswahl. |
| Choice | Private Runner-Choice mit Kandidaten nur im Runner-PlayerView. |
| Beziehung | `hostedOn` zeigt direkt auf den Host; keine Zyklen, keine Transitivität. |
| Zone | Hosted-Programm bleibt im Runner-Rig, ist offen und Runner-kontrolliert. |
| Host verlässt Zone | Hosted-Programm wird in V0.99 deterministisch mit in den Heap bewegt. |

## Visibility

- Die Hosting-Choice ist `hidden_info_barrier`, weil Grip-Kandidaten privat sind.
- Öffentliche Events enthalten nur abstrakte Angaben wie `hostedCount` und `hiddenZoneAction`, solange eine private Auswahl beteiligt ist.
- Nach erfolgreichem Hosting ist das gehostete Programm offen im Runner-Rig sichtbar.
- Corp-Reconnect-Payloads dürfen keine vor der Choice gesehenen Grip-Kandidaten enthalten.

## Tests

- V099-T001 Shared Types und Baseline.
- V099-T002 Generic Counter Model.
- V099-T003 Counter Visibility.
- V099-T004 Hosting Choice Side Safety.
- V099-T005 Hosting Invariants.
- V099-T006 Host Trash Cascade.
- V099-T017 No Scope.
