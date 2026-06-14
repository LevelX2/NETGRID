# Runner Safe Access Explicit Env Record

Status: `keep_explicit_env`

Datum: 2026-06-13

Bezug: AI-MAT5-9

## Entscheidung

`runner_safe_access` bleibt nicht lokaler Default. Der Scope bleibt nur über `NETGRID_AI_PLAY_STRENGTH_PILOT=runner_safe_access` aktivierbar.

## Begründung

Runner Safe Access ist fachlich stark, weil die Pilot-Entscheidung auf strukturierten RunTarget-Daten basiert:

- Ziel muss zentral und erreichbar sein.
- Risk Blocks stoppen universellen Druck, negative Credits und nicht bezahlbare Steal-/Trash-Folgen.
- RemoteContest bleibt getrennt report-only.
- Die Auswahl bleibt LegalActions-only und erzeugt keine eigenen Targets oder Choices.

Trotzdem bleibt das False-Positive-Risiko höher als bei `basic_setup`. Access-Fenster, bekannte Remote-Payoffs, Decline-/Trash-Entscheidungen und TargetChoice-Dry-Runs wachsen gerade erst zusammen. Ein lokaler Default könnte dadurch echte Access-Entscheidungen zu früh breiter machen.

## Policy-Anker

`buildLocalDefaultPilotPolicy()` markiert Runner Safe Access weiterhin als:

- `enabledByDefault: false`
- `envGateRequired: true`
- `nextStep: keep_runner_safe_access_explicit_env`
- `corpusReadiness: structured_but_requires_explicit_env`
- `falsePositiveRisk: medium`
- `hiddenInfoRisk: low`

`NETGRID_AI_PLAY_STRENGTH_LOCAL_DEFAULT=runner_safe_access` bleibt wirkungslos. Nur das explizite Pilot-Env aktiviert den Scope.
