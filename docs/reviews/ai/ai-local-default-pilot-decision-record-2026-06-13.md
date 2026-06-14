# Local Default Pilot Decision Record

Status: `prepared_no_runtime_activation`

Datum: 2026-06-13

Bezug: AI-MAT5-7

## Entscheidung

Kein Pilot-Scope wird global oder stillschweigend aktiviert. Die lokale Default-Frage wird als explizite Env-Entscheidung vorbereitet:

- `basic_setup`: bleibt default-off, ist aber Kandidat für einen eigenen lokalen Default-Env-Pfad.
- `runner_safe_access`: bleibt explicit-env, obwohl die strukturierte Ausrichtung stark ist.
- `corp_score_window`: bleibt env-gated.

## Basic Setup

Bewertung:

- Corpus Readiness: ausreichend für einen lokalen Kandidatenpfad.
- False-Positive-Risiko: niedrig, weil der Scope auf einfache Setup-, Draw-, Economy- und Install-Aktionen begrenzt ist.
- Hidden-Info-Risiko: niedrig, solange LegalActions, SemanticDecisionFrame und Redaction-Gates unverändert bleiben.

Empfehlung: `default-off / candidate default-on`.

Das bedeutet: `basic_setup` darf als explizit auswählbarer lokaler Default vorbereitet werden, aber nicht als globaler Runtime-Default. Ein späterer Codepfad muss zusätzlich prüfen, dass `NETGRID_AI_PLAY_STRENGTH_PILOT` nicht gesetzt ist und keine anderen Scopes implizit aktiviert werden.

## Runner Safe Access

Bewertung:

- Structured Alignment: vorhanden über RunTarget-Bewertung, Zielklassifikation und Pilot-Gates.
- Risk Blocks: vorhanden für Universaldruck, negative Credits, unklare Steal-/Trash-Kosten und nicht-zentrale Targets.
- False-Positive-Risiko: mittel, weil Access-Fenster, Remote-Payoff und TargetChoice-Verhalten noch stärker zusammenwachsen.
- Hidden-Info-Risiko: niedrig, solange nur side-sichere Action- und RunTarget-Daten verwendet werden.

Empfehlung: explicit-env beibehalten.

`runner_safe_access` ist spielstärker relevant, aber als lokaler Default risikoreicher als `basic_setup`. Der Scope bleibt daher bewusst über `NETGRID_AI_PLAY_STRENGTH_PILOT=runner_safe_access` aktivierbar und wird nicht in einen lokalen Default-Pfad gehoben.

## Corp Score Window

Bewertung:

- Corpus Readiness: unzureichend für Default.
- False-Positive-Risiko: hoch, weil Score-, Advance-, Remote-Sicherheits- und TargetChoice-Payload-Entscheidungen zusammenwirken.
- Hidden-Info-Risiko: niedrig bei unveränderten Gates, aber fachlicher Fehlgriff wäre teuer.

Empfehlung: `keep env-gated`.

`corp_score_window` bleibt ausschließlich explizit env-gated. Eine spätere Neubewertung braucht mehr reale Score-/Advance-Fälle, stabile TargetChoice-Coverage und keine neuen Forbidden-Mistake-Signale.

## Maschinenlesbare Policy-Anker

Die Policy in `packages/ai/src/decision/pilot/local-default-pilot-policy.ts` spiegelt diese Entscheidung mit `nextStep`, `corpusReadiness`, `falsePositiveRisk` und `hiddenInfoRisk`.

Verbindliche Grenze: `enabledByDefault` bleibt für alle Scopes `false`, und `defaultEnabledScopes` bleibt leer.
