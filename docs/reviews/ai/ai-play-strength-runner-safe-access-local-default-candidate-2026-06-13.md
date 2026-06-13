# Runner Safe Access Local Default Candidate

Status: `default_off_candidate`

Datum: 2026-06-13

Bezugsprozess: AI-MAT3-14 aus `docs/architecture/ai/ai-play-strength-maturation-3-process-2026-06-13.md`.

## Ergebnis

`runner_safe_access` bleibt nicht aktiv, ist aber nach aktueller ShadowLeague-Readiness ein lokaler Default-off-Kandidat.

Aktueller Stand nach dem TargetChoice-Korpusausbau:

| Feld | Wert |
| --- | ---: |
| Corpus-Szenarien | 54 |
| Scope-Kandidaten | 54 |
| Erlaubte Runner-Safe-Access-Fälle | 18 |
| Would-Override | 18 |
| Actual-Override | 0 |

## Bewertung

Der Scope ist weiterhin eng: Er erlaubt nur Runner-Start-Run-Fälle, die aus side-sicheren LegalActions, strukturierten ActionSemanticCandidates und sicheren RunTarget-Bewertungen ableitbar sind. RemoteContest bleibt getrennt report-only und wird durch diese Bewertung nicht lokal aktiviert.

Default-off-Kandidat bedeutet hier:

- keine Runtime-Default-Aktivierung,
- keine neue LegalAction-Erzeugung,
- keine `selectedChoices`- oder TargetChoice-Produktion,
- keine Hidden-Info-Allowlist-Erweiterung,
- nur spätere lokale Pilot-Policy darf den Scope bewusst auswählbar machen.

## Schlussfolgerung

`runner_safe_access` darf in AI-MAT3-17 als Kandidat in eine lokale Default-Policy aufgenommen werden, aber nur mit `enabledByDefault: false` und mit weiterem Report-/Env-Gate. Eine produktive oder automatische Aktivierung ist aus diesem Paket ausdrücklich nicht freigegeben.
