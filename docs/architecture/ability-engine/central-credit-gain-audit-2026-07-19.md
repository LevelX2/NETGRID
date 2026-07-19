# Zentrale Credit-Gain-Pipeline: Audit

Status: CGP-01 abgeschlossen

Stand: 2026-07-19

Scope: produktiver TypeScript-Code unter `packages/engine/src/`, ohne Tests und
Test-Fixtures

## Suchvertrag

Das Audit kombiniert folgende Suchen:

```text
state.(corp|runner).credits += / -= / =
host.state.(corp|runner).credits += / -= / =
credits(state, ...)
gainCredits(state, ...)
EffectCommand: gain_credits
ResolvedGameEffect: gain_credits
gainedCredits-Producer
```

Die Suche wird nach CGP-04 wiederholt. Ein Pfad gilt erst als abgedeckt, wenn
seine tatsächliche Mutationsgrenze oder sein Host-Callback auf die zentrale
Pipeline zeigt; ein bloß vorhandenes `gainedCredits`-Payloadfeld genügt nicht.

## Klassifikation

| Klasse             | Bedeutung                                                                  | Zielbehandlung                                      |
| ------------------ | -------------------------------------------------------------------------- | --------------------------------------------------- |
| `standard_gain`    | normaler Creditgewinn in den Pool                                          | zentrale Gain-Pipeline, Modifier zulässig           |
| `temporary_grant`  | zeitgebundene Credits werden dem Pool und einem Rückgabeledger hinzugefügt | zentrale Pipeline mit `countsAsStandardGain: false` |
| `hosted_take_gain` | Credits wechseln von einer installierten Quelle in den normalen Pool       | zentrale Gain-Pipeline, Quelle erhalten             |
| `setup_adjustment` | Startwert/Setup-Modifier vor normalem Spiel                                | explizite rohe Setup-Grenze, kein Trigger           |
| `set_effect`       | Regel setzt Creditstand auf einen Wert                                     | getrennte Set-Semantik                              |
| `spend`            | Kostenbezahlung                                                            | getrennte Payment-Pipeline                          |
| `loss`             | Creditverlust ohne Bezahlung                                               | getrennte Loss-Pipeline                             |
| `temporary_return` | ungenutzte temporäre Credits werden entfernt                               | getrennte Cleanup-/Loss-Semantik                    |

## Direkte Mutationen: vollständige Ausgangsmatrix

### Echte Pool-Creditgewinne – zu migrieren

| Pfad                                                                | Ausgangswirkung                                             | Klasse                  | Migrationskontext                                      |
| ------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------- | ------------------------------------------------------ |
| `game/access/access-breach-lifecycle.ts`                            | Prearranged Drop: Runner +6 beim Agenda-Access              | `standard_gain`         | Karten-/Access-Effekt, Source aus Pending-Flag-Vertrag |
| `game/play/corp-operation-resolution.ts`                            | drei alte Operationsresolver: Korp +4/+7/+3                 | `standard_gain`         | gespielte Operation als Quelle                         |
| `game/rez/rez-card.ts`                                              | Runner-Gewinn beim Korp-Rez im Run                          | `standard_gain`         | persistente Run-Quelle                                 |
| `game/run/encounter-printed-effects.ts`                             | Trace-Avoid-Rewards für Runner                              | `standard_gain`         | installierte Reward-Quellen                            |
| `game/trace/trace-orchestration.ts`                                 | derselbe Trace-Avoid-Vertrag bei Operations                 | `standard_gain`         | installierte Reward-Quellen                            |
| `game/run/encounter-printed-nontrace-effects.ts`                    | `corp_gain_credit`-Subroutine                               | `standard_gain`         | ICE/Subroutine                                         |
| `game/run/run-access-transition.ts`                                 | erfolgreicher Run gewährt Runner Credits                    | `standard_gain`         | Run-Event/-Quelle                                      |
| `ability-engine/effect-families/resource-cost-link-effects.ts`      | eigenes ICE trashen und Credits gewinnen                    | `standard_gain`         | aktivierte Quellenkarte                                |
| `game/run/run-movement.ts`                                          | passiertes ICE nach HQ zurücknehmen und Credits gewinnen    | `standard_gain`         | ICE-Lifecycle-Quelle                                   |
| `game/run/run-flow-hosts.ts`                                        | Run-End-Callbacks `gainRunner`/`gainCorp`                   | `standard_gain`         | Source wird vom Run-End-Vertrag durchgereicht          |
| `game/run/run-rez-window.ts`                                        | alte Asset-Rez-Gewinne +3/+4 und Obligation-Debt-Rez-Gewinn | `standard_gain`         | gerezzte Assetquelle                                   |
| `game/engine-runtime-internal/public-event-runtime-bootstrap.ts`    | alte Runner-Events +4/+6                                    | `standard_gain`         | gespielte Prep, Gain-Ordinal 1                         |
| `game/engine-runtime-internal/turn-corp-start-runtime-resolvers.ts` | Overadvance-Agenda-Credits am Korp-Zugstart                 | `standard_gain`         | Score-Area-Quelle                                      |
| `game/engine-runtime-internal/card-lifecycle-runtime-hosts.ts`      | separater Elena-Bonus `+1`                                  | abzulösender Sonderpfad | in Modifier derselben Gain-Auflösung überführen        |

### Temporäre Pool-Zuflüsse – zu migrieren, aber nicht als normaler Gain

| Pfad                                                             | Ausgangswirkung                                         | Klasse            | Migrationskontext                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------- | ----------------- | --------------------------------------------------------------------- |
| `ability-engine/effect-families/hidden-zone-resource-effects.ts` | temporäre Korp-Install/Rez-Credits und Korp-Run-Credits | `temporary_grant` | Poolmutation plus Rückgabeledger; keine Elena-/Standard-Gain-Modifier |
| `ability-engine/effect-families/resource-cost-link-effects.ts`   | Advancement-Counter werden zu temporären Run-Credits    | `temporary_grant` | Poolmutation plus Run-Ledger                                          |

### Bewusste direkte Ausnahmen

| Pfad                                                                           | Wirkung                                  | Klasse             | Begründung                            |
| ------------------------------------------------------------------------------ | ---------------------------------------- | ------------------ | ------------------------------------- |
| `game/create-game.ts::addCredits`                                              | Identity-Setup-Credits                   | `setup_adjustment` | vor normaler Action-/Triggerauflösung |
| `game/engine-runtime-internal/scored-economy-runtime-hosts.ts::setCorpCredits` | Creditstand wird auf festen Wert gesetzt | `set_effect`       | kein Gewinn um einen Betrag           |

### Keine Gains – bleiben getrennt

Die übrigen direkten Mutationen der Ausgangssuche sind `spend`, `loss` oder
`temporary_return`:

- `game/hidden-zone/nonsearch-choice-handlers.ts`;
- `game/play/corp-operation-resolution.ts` (Runner verliert 2);
- `game/state/economy-mutation.ts::spendCredits`;
- `ability-engine/effect-runtime-helpers.ts::loseCredits` und
  `spendCreditsIfAvailable`;
- `game/run/encounter-printed-nontrace-effects.ts` (Runner verliert Credits);
- `game/run/run-access-transition.ts` (Runner bezahlt/Korp verliert);
- `game/run/run-duration-payment.ts`;
- `game/engine-runtime-internal/flow-runtime-bootstrap.ts`;
- `game/run/run-movement.ts` (Korp bezahlt);
- `game/run/run-end-cleanup.ts`;
- `game/run/successful-run-interventions.ts`;
- `game/engine-runtime-internal/pending-choice-runtime-hosts.ts`;
- `game/engine-runtime-internal/state-runtime-resolvers.ts`;
- `game/engine-runtime-internal/turn-corp-start-runtime-resolvers.ts`
  (Kosten/Steuerverlust);
- `game/engine-runtime-internal/turn-end-runtime-resolvers.ts`;
- `game/engine-runtime-internal/turn-runner-start-runtime-resolvers.ts`.

Diese Pfade werden vom späteren statischen Guard nach Klassifikation nicht als
neue Pool-Gains beanstandet.

## Vorhandene gemeinsame Mutator- und Hostpfade

### `game/state/economy-mutation.ts::credits`

Der aktuelle Helfer addiert nur einen Betrag. Er kennt weder Quelle,
Gain-Klasse, Modifier, abgefangene Credits noch Ergebnisattribution. Folgende
produktive Pfade benutzen ihn direkt oder über einen Host-Callback und müssen
auf den neuen Vertrag zeigen:

- `engine-runtime-internal/corp-runtime-resolvers.ts`;
- `engine-runtime-internal/hidden-zone-nonsearch-runtime.ts`;
- `engine-runtime-internal/hidden-zone-nonsearch-dice-loop-runtime.ts`;
- `engine-runtime-internal/card-runtime-resolvers.ts`;
- `engine-runtime-internal/corp-zone-runtime-hosts.ts`;
- `engine-runtime-internal/play-board-runtime-hosts.ts`;
- `engine-runtime-internal/scored-economy-runtime-hosts.ts`;
- `engine-runtime-internal/state-runtime-resolvers.ts` für
  `EffectCommand.gain_credits`;
- `game/damage/damage-replacement.ts`;
- `engine-runtime-internal/turn-corp-start-runtime-resolvers.ts`;
- `engine-runtime-internal/turn-end-runtime-resolvers.ts`;
- `engine-runtime-internal/turn-runner-start-runtime-resolvers.ts`;
- `game/run/run-flow-hosts.ts`.

### `ability-engine/effect-runtime-helpers.ts::gainCredits`

Dieser Helfer ist bislang der einzige Pfad, der
`actionEconomy.corpCreditForfeitDebt` berücksichtigt. Er wird von der
deklarativen Credit-Effect-Familie für drei Varianten verwendet:

- fester `gain_credits`-Effekt;
- Gain anhand Runner-Trash-Historie;
- Gain pro Advancement-Counter.

Die Debt-Behandlung wird in den zentralen Kern verschoben. Der
Ability-Interpreter erhält den Kern über eine injizierte Runtime-Grenze, damit
die generische Ability-Schicht keine Kartenregistry oder Game-Runtime
importieren muss.

### `ability-engine/card-implementation-effect-adapters.ts`

`takeHostedCredits` entfernt Bit-Counter von einer Quelle und ruft danach den
alten `credits`-Host auf. Dieser Pfad wird als `hosted_take_gain` mit
Quellenattribution in die zentrale Pipeline eingebunden.

## Source- und Modifiervertrag

Der neue Request ist eine diskriminierte Union:

```text
standard card effect:
  side, baseAmount, sourceDefinitionId, optional sourceCardId,
  sourceKind=card_effect, gainOrdinal >= 1, reason

other standard gain:
  side, baseAmount, sourceKind, optional öffentliche Quelle, reason

temporary grant:
  side, baseAmount, sourceKind=temporary_grant,
  countsAsStandardGain=false, reason
```

Für einen Runner-`event` mit `gainOrdinal === 1` sammelt der Kern installierte
`first_prep_credit_gain_bonus`-Modifier. Der Bonus wird vor der einzigen
Poolmutation auf den Grundbetrag gerechnet. `gainOrdinal > 1`, Korp-Karten,
nicht gespielte Events und temporäre Grants erhalten keinen Elena-Bonus.

Der Ergebnisvertrag unterscheidet:

- `baseAmount`;
- `bonusAmount`;
- `requestedAmount = baseAmount + bonusAmount`;
- `interceptedAmount` (z. B. Korp-Forfeit-Debt);
- `creditedAmount`;
- Creditstand danach;
- öffentliche Modifier-SourceDefinitionIds.

## Architektur-Guard

Nach der Migration wird ein versionierter Engine-Check eingeführt, der
produktive direkte `+=`-Poolgewinne außerhalb der zentralen Mutationsdatei und
der expliziten Setup-Grenze verbietet. Direkte `-=`, verlustbegrenzte
Zuweisungen und der dokumentierte `setCorpCredits`-Pfad werden nicht mit einem
unsicheren Regex pauschal verboten; sie bleiben durch ihre bestehenden
Payment-/Loss-Tests geschützt.

## CGP-01 Done-Nachweis

- alle direkten produktiven Creditmutationen aus der Ausgangssuche sind einer
  Klasse zugeordnet;
- alle vorhandenen gemeinsamen Gain-Helfer und Hostbrücken sind erfasst;
- deklarative, Resolver-, Run-, Access-, Trace-, Turn-, Hosted- und temporäre
  Pfade sind im Migrationsscope enthalten;
- Setup, Set, Spend, Loss und Temporary Return sind begründete Nicht-Gain-
  Grenzen;
- Elena wird als Modifier derselben Gain-Auflösung statt als separater Gain
  festgelegt.
