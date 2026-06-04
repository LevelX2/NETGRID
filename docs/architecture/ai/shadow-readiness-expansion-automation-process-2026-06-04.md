# Shadow Readiness Expansion Automationsprozess

Stand: 2026-06-04
Status: Prozessdefinition fuer sequenzielle Codex-Ausfuehrung nach AI060
Primaerer Agent: `release-implementation-agent`
Arbeitsbranch: `codex/ai061-sr-ai067-shadow-readiness-expansion`
Arbeits-Worktree: `C:\Projekte\NETGRID_AI061_SR_AI067_SHADOW_READINESS_EXPANSION`

## Zweck

Dieser Prozess ist der naechste Meta-Schritt nach `AI051` bis `AI060`.

AI060 meldet `limited_shadow_ready`. Harte Safety-Gates sind gruen, aber die
semantische Shadow-Entscheidung ist wegen TargetContext-, Ability-, Card- und
Cost/Timing-Gaps noch nicht breit genug entscheidungsfaehig. Der Prozess
reduziert diese Gaps, foerdert ausgewaehlte sichere Fixtures und bewertet
Shadow Readiness erneut.

Ziel:

```text
limited_shadow_ready -> broad_shadow_ready
```

Nicht-Ziel:

```text
limited_shadow_ready -> cutover
```

## Verbindliche Invarianten

- Kein produktiver Cutover.
- Keine produktive Action-Auswahl.
- Keine Planner-Gewichte.
- Keine Legalitaetserzeugung.
- Keine Hidden-Info-Projektion.
- Keine Public Payload Changes.
- `actualDecision` bleibt immer `legacyDecision`.
- Die semantische Shadow-Entscheidung bleibt `developer_only`,
  `diagnostic_only` und ohne Runtime-Wirkung.
- `semanticAiShadowModeEnabled` bleibt default `false`.
- Hidden-Info-Blocker bleiben Regression Guards und werden nicht entsperrt.
- Unsichere Semantik bleibt Gap, nicht Guess.

Verbindliche Kernformel bleibt:

```text
legacyDecision = chooseLegacyAiAction(input)
semanticShadowDecision = chooseSemanticAiActionShadow(input)
actualDecision = legacyDecision
writeDeveloperOnlyShadowTrace(legacyDecision, semanticShadowDecision)
```

## Eingangszustand

Fuehrende Eingangsnachweise:

- `docs/reviews/ai/ai051-060-controlled-shadow-mode-final-report-2026-06-04.md`
- `docs/reviews/ai/ai060-shadow-readiness-review-2026-06-04.md`
- `docs/reviews/ai/ai058-shadow-evaluation-batch-report-2026-06-04.md`

AI060-Eingangsmetriken:

| Metric | Value |
| --- | --- |
| `semanticDecisionAvailableRate` | `0.2424` |
| `semanticBlockedByGapRate` | `0.6667` |
| Runtime-backed fixture rate | `0` |
| Hard gate failures | `0` |

AI060 Top-Gaps:

| Gap | Count |
| --- | --- |
| `target_context_unavailable` | `13` |
| `card_semantics_unavailable` | `7` |
| `ability_unresolved` | `6` |
| `cost_unknown` | `4` |
| `hidden_info_blocked` | `3` |

## State Machine

```text
worktree_preflight
-> process_defined
-> AI061_SR_planned
-> AI061_SR_done
-> AI062_SR_done
-> AI063_SR_done
-> AI064_SR_done
-> AI065_SR_done
-> AI066_SR_done
-> AI067_SR_done
-> integration_preflight
-> merged_to_main
-> worktree_removed
-> complete
```

Blocker-Pfad:

```text
current_step -> blocked
```

Ein Blocker ist nur ein Safety-Stop, keine Human-Review-Pause.

## Schrittfolge

| Step | Titel | Ziel | Done-Gate |
| --- | --- | --- | --- |
| `AI061-SR` | TargetContext Projection Expansion | `target_context_unavailable` senken, nur mit side-safe Engine-/LegalAction-Evidence. | Vorher/Nachher-Liste, keine Hidden-Info-Leaks, keine Targeting-KI, keine neue Legalitaet. |
| `AI062-SR` | Ability Binding Expansion | `ability_unresolved` senken, nur mit expliziter oder eng begrenzt side-safe abgeleiteter Ability-Bindung. | Mehr Card-Actions mit Binding; Multi-Ability ohne eindeutige ID bleibt unresolved. |
| `AI063-SR` | Card-Semantics Join Coverage | `card_semantics_unavailable` senken, CardContextSignals und ActionTacticSignals trennen. | CardContext besser, ActionTactic nur bei ability-resolved, keine blinde Signaluebernahme. |
| `AI064-SR` | Cost/Timing Evidence Expansion | `cost_unknown` und Timing-Unklarheit senken. | Kosten-/Timing-Evidence nur aus LegalAction/Engine-Angebot, keine geratenen Kosten. |
| `AI065-SR` | Runtime-backed Shadow Fixture Promotion | Ausgewaehlte sichere synthetische Fixtures auf saved-state-Referenzen foerdern. | Runtime-backed fixture rate > 0, deterministische Referenzen, Hidden-Info-riskante Faelle nicht foerdern. |
| `AI066-SR` | Shadow Evaluation Re-Run | Shadow-Batch nach Expansion erneut auswerten. | Hard Gates 0, Overrides 0, Runtime Effects 0, Availability steigt, blocked-by-gap sinkt. |
| `AI067-SR` | Shadow Readiness Re-Review | Readiness nach Gap-Loop neu bewerten. | Status `limited_shadow_ready` oder `broad_shadow_ready`; Cutover bleibt false; Abschlussreport vorhanden. |

## Automatische Fortsetzung

Der Prozess stellt keine Zwischenfragen, solange eine konservative Fortsetzung
moeglich ist.

Erlaubte konservative Entscheidungen:

- TargetContext nur markieren, wenn Ziel, legale Zieloptionen,
  TargetProfile-Status und HiddenInfoPolicy side-safe dokumentiert sind.
- Ability Binding nur markieren, wenn `abilityRef`, `effectRef`,
  `payload.abilityId`, `payload.abilityFamily` oder eine eng begrenzte
  Single-Legal-Ability-Spur vorhanden ist.
- Card-Semantik nur als CardContext verwenden, solange keine eindeutige
  Ability-Bindung vorhanden ist.
- Cost/Timing nur aus LegalAction-/Engine-Angebot normalisieren.
- Hidden-Info-Boundary-Fixtures bleiben blockiert.
- Nicht eindeutig reduzierte Gaps bleiben sichtbar.

## Safety-Blocker

Bei einem dieser Befunde stoppt der Prozess ohne Rueckfrage und schreibt einen
Blocker-Report mit Removal Condition:

- Hidden-Info-Leak.
- Illegale semantische Entscheidung.
- `actualDecision` weicht von `legacyDecision` ab.
- Shadow-Code erreicht `applyAction`, erzeugt `PlayerAction` oder mutiert
  Engine-State.
- Shadow-Interna erscheinen in PublicEvent, PlayerView, WebSocket, Reconnect,
  Undo, Replay, Client-Fehlern oder Public-Debug.
- Planner-/Runtime-Wirkung.
- Unklassifizierbare fremde Worktree-Aenderungen.
- Kaputte Repo-Grundlage, die nicht eng step-lokal reparierbar ist.

Blocker-Artefakte:

```text
docs/reviews/ai/ai061-sr-ai067-shadow-readiness-expansion-blocker-2026-06-04.md
docs/reviews/ai/ai061-sr-ai067-shadow-readiness-expansion-blocker-2026-06-04.json
```

## Verifikation

Jeder Step erzeugt:

- Markdown-Report unter `docs/reviews/ai/`.
- JSON-Report unter `docs/reviews/ai/`.
- Check-Skript unter `scripts/`.
- Step-spezifische Tests, wenn AI-Code betroffen ist.

Pflichtchecks nach Codeaenderung:

```text
corepack pnpm --filter @netgrid/ai test -- shadow-readiness-expansion.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Vor Abschluss:

```text
node scripts/check-ai061-sr-target-context-projection-expansion.mjs
node scripts/check-ai062-sr-ability-binding-expansion.mjs
node scripts/check-ai063-sr-card-semantics-join-coverage.mjs
node scripts/check-ai064-sr-cost-timing-evidence-expansion.mjs
node scripts/check-ai065-sr-runtime-backed-shadow-fixture-promotion.mjs
node scripts/check-ai066-sr-shadow-evaluation-rerun.mjs
node scripts/check-ai067-sr-shadow-readiness-rereview.mjs
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## Git- und Integrationsregeln

- Umsetzung ausschliesslich im Arbeits-Worktree
  `C:\Projekte\NETGRID_AI061_SR_AI067_SHADOW_READINESS_EXPANSION`.
- Hauptworkspace `C:\Projekte\NETGRID` nur fuer den lokalen Merge nach `main`.
- Ein lokaler Commit je gruenem Step.
- Kein Push durch diesen Prozess ohne ausdruecklichen Nutzerwunsch.
- Bevorzugt Fast-Forward-Merge nach `main`.
- Nach erfolgreichem Merge `git status --short --branch` und
  `git diff --check` auf `main`.
- Separaten Worktree erst nach erfolgreichem Merge entfernen.

## Abschlusskriterien

Der Block ist abgeschlossen, wenn:

1. `AI061-SR` bis `AI067-SR` in Reihenfolge abgeschlossen sind.
2. Alle Step-Reports und JSON-Artefakte vorliegen.
3. Alle Step-Checks gruen sind.
4. Hard Gates weiter 0 Fehler melden.
5. `actualDecision` weiter Legacy bleibt.
6. Hidden-Info-Guards weiter blockieren.
7. Readiness neu bewertet ist.
8. Kein Cutover freigegeben wurde.
9. Der Branch lokal nach `main` gemerged ist.
10. Der separate Worktree entfernt ist.
