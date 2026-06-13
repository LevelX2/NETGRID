# AI Corp Score Window Env-Gated Rationale

Status: complete

## Ergebnis

`corp_score_window` bleibt `keep_env_gated`.

## Dry-Run-Metriken

| Metrik | Wert |
| --- | ---: |
| scenarioCount | 54 |
| eligible | 4 |
| wouldOverride | 4 |
| recommendation | keep_env_gated |

Blocked Reasons:

```text
corp_score_window_wrong_side: 27
```

## Begründung

- `score_agenda` ist der sichere Kernfall.
- `advance_card` bleibt nicht automatisch score-sicher, weil Advancement-Stand, Kosten, Remote-Sicherheit und Folgefenster zusammenhängen.
- `rez_ice` bleibt draußen, weil Rez-Fenster Schutz-, Bluff-, Tempo- und Scoreline-Bedeutung mischen.
- Remote-/Ambush-Unsicherheit ist für Corp-Score-Fenster weiterhin ein zentraler Störfaktor.
- Corp-Window-Komplexität ist höher als BasicSetup oder RunnerSafeAccess, weil ein falsches Delay direkt Agenda-Steal-Folgen haben kann.
- Der aktuelle Corpus hat nur 4 erlaubte Fälle; das bleibt zu dünn für einen lokalen Default.

## Schluss

`corp_score_window` darf weiter per lokalem Env-Gate getestet werden, aber nicht als Default vorbereitet werden.

```text
recommendation: keep_env_gated
runtime_consumer: none
productive_use_allowed: false
```

## Check

```text
semantic-shadow-league.test.ts: grün
git diff --check: grün
```
