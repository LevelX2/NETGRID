# Originalset Semantic Play-Strength Backlog

Datum: 2026-06-12

Status: diagnostischer Backlog. Dieses Artefakt plant Semantik-Nacharbeiten fuer Originalset-nahe Play-Strength-Verbesserungen, aendert aber keine Hints, keine Card-Semantic-Profile, keine Runtime-Auswahl, keine Scores und keine Engine-Regeln.

## Quellen

- `docs/reviews/ai/ai028-r-netgrid-semantic-audit-pack-refresh-2026-06-03.md`
- `docs/reviews/ai/ai019-runner-programs-semantics-review-2026-06-01.md`
- `docs/reviews/ai/ai020-runner-hardware-semantics-review-2026-06-02.md`
- `docs/reviews/ai/ai021-runner-preps-semantics-review-2026-06-02.md`
- `docs/reviews/ai/ai022-runner-resources-semantics-review-2026-06-02.md`
- `docs/reviews/ai/ai023-corp-agendas-semantics-review-2026-06-02.md`
- `docs/reviews/ai/ai024-corp-ice-semantics-review-2026-06-02.md`
- `docs/reviews/ai/ai025-corp-operations-semantics-review-2026-06-02.md`
- `docs/reviews/ai/ai026-corp-nodes-assets-semantics-review-2026-06-02.md`
- `docs/reviews/ai/ai030-corp-upgrades-semantics-review-2026-06-03.md`
- `packages/ai/src/actions/action-semantic-invariants.ts`
- `packages/ai/src/actions/action-semantic-invariants.test.ts`

## Baseline

AI028-R bleibt die aktuelle globale Semantik-Baseline fuer diesen Backlog:

- Semantic Profiles: 564
- Originalset aktiv: 374
- Proteus aktiv: 154
- Testset aktiv: 36, davon V08: 14
- Classic inaktiv: 52
- TargetProfiles: 73
- Conditions: 595
- Risks: 853
- Constraints: 314
- HiddenInfoPolicy-Eintraege: 74
- Error Findings: 0
- Warning Findings: 4

Die grossen Kartenklassen sind reviewseitig abgedeckt: Runner-Programme, Runner-Hardware, Runner-Preps, Runner-Resources, Corp-Agendas, Corp-ICE, Corp-Operations, Corp-Nodes/Assets und Corp-Upgrades. Der Backlog behandelt daher keine neue Flaechenmigration, sondern die verbleibenden Semantik-Warnings und ihre Invariant-Gates.

## Invariant Guard

Jedes Folgepaket aus diesem Backlog muss vor Merge beweisen:

- `buildActionSemanticInvariantReport` bleibt `diagnostic_only`.
- `productiveUseAllowed` bleibt `false`.
- `noEffectFlags` enthalten weiter `no_runtime_scoring`, `no_action_selection`, `no_legal_action_generation` und `no_hidden_info_projection`.
- `packages/ai/src/index.ts`, `packages/ai/src/runtime/semantic-runtime.ts` und `packages/ai/src/runtime/semantic-choice-ranking.ts` importieren weder `action-semantic-invariants` noch `buildActionSemanticInvariantReport`.
- Keine neuen Strategy IDs, Planner-Wirkung, ActionScore-Wirkung, PlanWeight-Wirkung, Targeting-KI, Engine-/Legalitaetswirkung, Profil-/Default-Umschaltung, UI-Derivation oder Hidden-Info-Projektion ohne eigenes Gate.

Pflichtchecks fuer jede Umsetzung:

- `corepack pnpm --filter @netgrid/ai test -- src/actions/action-semantic-invariants.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Folgeauftraege

| Auftrag | Fokus | Ausgangsbefund | Done-Gate | Nicht-Ziel |
| --- | --- | --- | --- | --- |
| AI-ORIG-SEM-1 | Support-only Breaker-Taxonomie | `breaker.code_gate`, `breaker.sentry`, `breaker.wall` sind type-/subtype-foermige Support-Signale. | Katalog-/Hint-Delta oder begruendete Beibehaltung; Invariant-Test gruen. | Keine pauschalen Breaker-Strategy-Anker. |
| AI-ORIG-SEM-2 | Legacy-/Aggregation-Signale | Direkte Nutzung von `action.corp_repeatable_extra_action=2` und `damage.payoff=42`. | Pro Signalklasse Ersatz, Deferred-Entscheidung oder expliziter Legacy-Vertrag; Invariant-Test gruen. | Keine stillschweigende Semantik-Aufwertung alter Aggregationssignale. |
| AI-ORIG-SEM-3 | Descriptor-Schema | 61 Karten tragen Descriptor- oder Function-Signal-Descriptor-Warnings. | Schemaentscheidung mit kleiner Pilotkarte oder bewusstem Deferred-Register; Invariant-Test gruen. | Kein Bulk-Rewrite ohne Kartenklassen-Testanker. |
| AI-ORIG-SEM-4 | Advancement Source/Target Split | `requires_advancement_counter` bleibt breit, bis Action-/Target-Semantik Source und Target trennt. | Source-/Target-Vertrag fuer Advancement-Conditions und kleiner Guard gegen Hidden-Info-Targeting. | Keine neue Scoringwirkung aus Advancement-Texten. |
| AI-ORIG-SEM-5 | Backlog-Refresh nach Folgepaketen | AI028-R ist Stand 2026-06-03 und dieser Backlog ist Stand 2026-06-12. | Counts, Warningklassen und Invariant-Gates nach AI-ORIG-SEM-1 bis -4 neu erfassen. | Keine Semantikdatenaenderung im Refresh selbst. |

## Priorisierung

1. AI-ORIG-SEM-1 zuerst, weil support-only Breaker-Signale klein, klar und risikoarm sind.
2. AI-ORIG-SEM-2 danach, weil Legacy-/Aggregation-Signale direkte Kartenverwendung haben und sonst kuenftige Play-Strength-Auswertungen verwischen.
3. AI-ORIG-SEM-3 nur mit kleinem Pilot und klarer Owner-Grenze, weil Descriptor-Schemaarbeit breit werden kann.
4. AI-ORIG-SEM-4 erst nach stabiler Source-/Target-ActionSemantics, weil Advancement-Faelle sonst zu leicht falsche Targeting-Annahmen erzeugen.

## No-Effect

Dieses Artefakt ist reine Planung. Es erzeugt keine Runtime-, Planner-, ActionScore-, PlanWeight-, Engine-, LegalAction-, Targeting-, UI-, Profil- oder Hidden-Info-Wirkung.
