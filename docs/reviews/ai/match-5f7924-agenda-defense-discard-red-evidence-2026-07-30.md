# Match 5F7924: rote Agenda-, Defense- und Discard-Evidence

Stand: 2026-07-30

Match: `match_5f7924e4893ba855`

Modus: `human_runner_vs_corp_ai`

## Capture-Vertrag

Alle fünf Checkpoints wurden mit `warmup-policy strict` aus der lokalen
Runtime-SQLite capturt. Jeder Capture meldete `warmupDriftCount = 0`.
Future-Events oder gegnerische Hidden-Info sind nicht Bestandteil der
Entscheidungseingaben.

| Fixture | Decision | StateVersion | Vertrag vor Fix |
|---|---:|---:|---|
| `cp-5f7924-00-opening-central-defense-control-d3.json` | 3 | 3 | Data Wall vor HQ über Defense-Plan |
| `cp-5f7924-01-turn7-agenda-defense-d23.json` | 23 | 44 | Agenda oder ICE am gebundenen neuen Remote statt Draw |
| `cp-5f7924-02-turn9-agenda-defense-d28.json` | 28 | 55 | Agenda oder ICE am gebundenen neuen Remote statt Credit |
| `cp-5f7924-03-marked-accounts-discard-d32.json` | 32 | 59 | Marked Accounts behalten, eine von drei Jack Attacks abwerfen |
| `cp-5f7924-04-conditional-upgrade-discard-control-d26.json` | 26 | 47 | inaktive Dedicated Response Team abwerfen |

## Unveränderter aktueller Code

Befehl:

```text
corepack pnpm exec vitest run packages/ai/src/evaluation/decision-checkpoints/match-5f7924-corp-agenda-defense-discard-decision-checkpoints.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=verbose
```

Ergebnis:

- zwei Kontrollen grün;
- drei Zielverträge rot;
- alle drei roten Zielverträge melden ausschließlich
  `code = behavior_regression`;
- keine Engine-Legality-, Runtime-State-, Fixture-, Redaction- oder
  Migrationsdrift.

## Rote Zielbefunde

### Zug 7, Decision 23

Auswahl: `corp.draw_card`

Verlorene positive Menge:

- Marked Accounts in `new_remote`;
- Netwatch Operations Office in `new_remote`;
- Data Raven als erstes ICE in `new_remote`;
- Jack Attack als erstes ICE in `new_remote`.

Relevante Evidence:

- `corp_score_protection_required:new_remote`;
- `corp_ice_install_has_no_engine_certified_access_probability_reduction`;
- `score_plan_requires_effective_ice_draw:...:new_remote`.

### Zug 9, Decision 28

Auswahl: `corp.gain_credit`

Dieselbe positive Menge bleibt trotz neun Credits, drei Aktionen, einer
spielbaren Agenda und vier verfügbaren ICE vollständig vorgefiltert. Der
TurnPlanner erhält nur den Economy-Head.

### Cleanup, Decision 32

Auswahl: Marked Accounts.

Erwartung:

- `onr_proteus_005_marked-accounts` bleibt im HQ;
- eine Instanz von `onr_v1_251_jack-attack` wird abgeworfen.

Der Fehler liegt nach erfolgreicher Engine-Choice-Auflösung in der
produktiven Discard-Keep-Bewertung.

## Bereits grüne Grenzen

- Die Eröffnung soll weiterhin Data Wall vor HQ priorisieren; ein Rush wird
  nicht blind über die zentrale P3-Verteidigung gehoben.
- Dedicated Response Team bleibt ohne aktives Tag-Payoff der schwächste
  Abwurf. Die Agenda-Retention wird nicht zu einem absoluten
  „niemals Agenda abwerfen“-Verbot.

## Red-Gate

Die drei historischen Zielerwartungen bleiben für den Fix unverändert. Ein
späteres Grün muss aus produktiver Plan-/Cleanup-Logik entstehen.
