# MVP 0.9 Implementation Review

Status: bestanden
Stand: 2026-05-03

## Ergebnis

`ready_for_hardening: true`

V0.9 wurde als stärkere KI innerhalb des eingefrorenen Scopes umgesetzt. Die KI bleibt LegalActions-only und erhält keine FullState- oder verdeckte Gegnerinformation.

## Umgesetzt

- V0.9-Rollen- und Profilartefakte unter `data/ai/`.
- Scorer-basierte Runner- und Corp-Entscheidungen statt reiner Prioritätsliste.
- Difficulty-Gewichte für Easy, Normal und Hard ohne erweiterten Informationszugriff.
- Side-sichere Evidence, Confidence, Reason-Codes und Erklärtexte in `AiDecision`.
- ObservedFacts-Rekonstruktion aus side-gefilterten Events.
- Qualitätsmetriken in AI-Simulationen: FallbackRate, TimeoutRate, Reason-Code-Coverage, ActionType-Coverage, RoleCoverage, Progress und Holdout-Markierung.
- V0.9-Soak-Helfer über Tuning- und Holdout-Seeds.
- Server-AI-Profile auf V0.9-Profil-IDs umgestellt.

## Safety Review

| Gate | Ergebnis |
|---|---|
| AI-Decision-Code arbeitet aus `AiDecisionInput` | pass |
| Keine FullState-, Token- oder `cardInstances`-Felder in Standard-Summaries | pass |
| Hidden-State-Invarianztest | pass |
| KI wählt nur aktuelle LegalActions | pass |
| `applyAction` bleibt Regelautorität | pass |
| Reason-Codes und Evidence sind leak-gescannt | pass |
| Difficulty erhöht Qualität, nicht Wissen | pass |
| Soak läuft ohne IllegalAction, ReplayFailure oder Timeout | pass |

## Checks

- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai test`: pass, 15 Tests.
- `corepack pnpm --filter @netrunner/server test`: pass, 12 Tests.
- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`: pass, 20 Tests.
- V0.9-Soak-Smoke: pass, 27 Läufe, 0 IllegalActions, 0 ReplayFailures, FallbackRate 0,02, TimeoutRate 0.

## Annahmen und Grenzen

- V0.9 nutzt V0.8-Starterdecks als primäre Qualitätsbasis.
- Die Scorer sind heuristisch und bewusst klein; sie sind keine Balancing-Garantie.
- Es gibt weiterhin keinen Engine-basierten FullState-Lookahead in der Decision-Funktion.
- V0.10, öffentliche Plattformfunktionen und Asset-Arbeit bleiben ausgeschlossen.

## Nächster Schritt

V0.9 Final Review, volle Workspace-Checks, Statuspflege, Wissenspflege und grüner lokaler Commit.
