# AI Basic Setup Local-Default Dry-Run

Status: complete

## Ziel

Prüfen, ob `basic_setup` lokal default-on werden könnte, ohne die Runtime zu ändern.

## Ergebnis

`basic_setup` bleibt nicht default-on. Der Scope bleibt diagnostisch verwendbar, hat aber im aktuellen ShadowLeague-Corpus einen bekannten No-Go-Fall.

| Metrik | Wert |
| --- | ---: |
| scenarioCount | 54 |
| eligible | 23 |
| wouldOverride | 23 |
| badOverrideRisk | 1 |

Known No-Go:

```text
corp_real_advance_score_window
```

Blocked Reasons:

```text
basic_setup_action_type_blocked: 30
```

## Empfehlung

`recommendation: do_not_default`

Begründung: Der Dry-Run findet mindestens einen Fall, in dem ein BasicSetup-Override mit einer bestehenden ShadowLeague-Risikosignatur zusammenfällt. Damit ist die frühere `default_off_candidate`-Einstufung nicht automatisch eine Default-on-Freigabe.

## Nicht geändert

- Keine Runtime-Aktivierung.
- Keine Änderung am Env-Vertrag.
- Keine Änderung an `LegalActions`, Engine, Replay, StateHash oder Randomness.
- Keine produktive Auswahl außerhalb bestehender LegalActions.

## Check

```text
semantic-shadow-league.test.ts: grün
@netgrid/ai typecheck: grün
```
