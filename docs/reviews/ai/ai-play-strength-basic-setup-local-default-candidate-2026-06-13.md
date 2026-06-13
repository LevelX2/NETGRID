# Basic Setup Local Default Candidate

Status: `default_off_candidate`

Datum: 2026-06-13

Bezugsprozess: AI-MAT3-15 aus `docs/architecture/ai/ai-play-strength-maturation-3-process-2026-06-13.md`.

## Ergebnis

`basic_setup` bleibt nicht aktiv, ist aber nach aktueller ShadowLeague-Readiness ein lokaler Default-off-Kandidat.

Aktueller Stand nach dem TargetChoice-Korpusausbau:

| Feld | Wert |
| --- | ---: |
| Corpus-Szenarien | 54 |
| Scope-Kandidaten | 54 |
| Erlaubte Basic-Setup-Fälle | 23 |
| Would-Override | 23 |
| Actual-Override | 0 |

## Bewertung

Der Scope deckt einfache Economy-, Draw-, Install- und Setup-Fälle ab. Er ist breiter als `runner_safe_access`, bleibt aber durch LegalActions, SemanticDecisionFrame, ShadowLeague und Pilot-Registry begrenzt. Die zusätzlichen TargetChoice-Fälle ändern diese Einstufung nicht in eine Aktivierung.

Default-off-Kandidat bedeutet hier:

- keine globale Runtime-Voreinstellung,
- keine automatische Pilot-Übernahme,
- keine Engine-, Replay-, StateHash- oder Randomness-Änderung,
- spätere Policy darf den Scope nur lokal und ausdrücklich auswählbar machen.

## Schlussfolgerung

`basic_setup` darf in AI-MAT3-17 als lokaler Policy-Kandidat vorbereitet werden. Die sichere Form ist `enabledByDefault: false`, mit explizitem Env-/Policy-Gate und weiterhin `actualOverride: 0` in der Reportlage.
