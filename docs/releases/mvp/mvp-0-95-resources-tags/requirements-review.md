# MVP 0.95 Requirements Review

Status: bestanden
Stand: 2026-05-04

## Review-Ergebnis

Die V0.95-Requirements sind ausreichend eng, testbar und an die bestehende Mechanik-Coverage anschlussfähig. Die CR-v26.03-Regelreferenz wurde für Resources und Corp-Resource-Trash bei getaggtem Runner gezielt geprüft.

`requirements_review_passed: true`

`MVP_0.95_requirements_freeze_done: true`

`ready_for_MVP_0.95_implementation: true`

## Geprüfte Artefakte

- `docs/releases/mvp/mvp-0-95-resources-tags/plan.md`
- `docs/releases/mvp/mvp-0-95-resources-tags/requirements.md`
- `docs/releases/mvp/mvp-0-95-resources-tags/resource-tag-interaction-spec.md`
- `docs/releases/mvp/mvp-0-95-resources-tags/test-matrix.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/mechanics-coverage-0.94.json`
- `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`

## Befund

- Resource-Install, Resource-Sichtbarkeit und Corp-Resource-Trash sind klar als V0.95-Scope definiert.
- `trash_resource` hat eindeutige Kosten: 1 Klick und 2 Credits.
- Corp darf `trash_resource` nur bei getaggtem Runner erhalten.
- `applyAction`-Revalidierung ist als Must explizit gefordert.
- Resource-Trash ist als public board interaction eingeordnet und öffnet keine neue Hidden-Info-Barriere.
- Testmatrix deckt Must-Requirements, negative Revalidierung, Visibility, Replay/StateHash, AI, Multiplayer und No-Scope-Regression ab.

## Grenzen

Nicht freigegeben sind Trace, Link/Bidding, Jack-out-/Breach-/Multiaccess-Ausbau, Identity-Abilities, Hidden-Zone-Manipulation, Hosting, Viren, Counter-Familien und Prevention/Avoid/Interrupt/Replacement.

## Entscheidung

V0.95 darf implementiert werden, sobald V0.94 final abgeschlossen ist. Diese Voraussetzung ist erfüllt. Die Implementierung muss nach dem V0.95-Finalgate dokumentiert, reviewed, getestet und lokal committed werden, bevor V0.96 beginnt.
