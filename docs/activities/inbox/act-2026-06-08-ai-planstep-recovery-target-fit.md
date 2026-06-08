---
activityId: act-2026-06-08-ai-planstep-recovery-target-fit
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-08
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# AI-MAP-RECOVERY-1: PlanStep-Mapping und Recovery-Zielbewertung schärfen

## Ziel

Die Runner-KI soll Coverage-/Breaker-PlanSteps nur auf LegalActions mappen, die den konkreten Planbedarf tatsächlich erfüllen. Economy- und Recovery-Actions dürfen einen Such-/Coverage-Plan nicht scheinbar lösen, wenn sie den fehlenden Breaker, eine passende Suche oder einen zulässigen Draw-for-Answer nicht näherbringen.

## Kontext und Quellen

- Eingefügter Nutzertext vom 2026-06-08: Ein TacticalPlan erkennt korrekt, dass für Remote/R&D/HQ Wall-Breaker-Coverage fehlt, mappt den nächsten Schritt `search_for_answer` aber auf `Livewire's Contacts spielen`.
- Beobachteter Loop: `Livewire's Contacts` erzeugt Credits, `Junkyard BBS` holt `Livewire's Contacts` aus dem Heap zurück, danach wird Livewire erneut gespielt. Das kann als Economy-Loop situativ korrekt sein, löst aber keinen `missing_wall_coverage`-Blocker.
- `Livewire's Contacts` ist fachlich Economy/Burst Credit, keine Suchkarte und kein Breaker-Finder.
- `Junkyard BBS` ist Recovery/top-trash-recovery und darf einen Coverage-Plan nur erfüllen, wenn die zurückgeholte Karte selbst planrelevant ist.
- Verwandte erledigte Karten-/Engine-Pakete:
  - `docs/activities/done/act-2026-05-17-junkyard-bbs-installed-resource-action.md`
  - `docs/reviews/originalset-spotchecks/register.md`
- Verwandte AI-Artefakte:
  - `docs/architecture/ai/ai-plan-3-8-deck-capability-tactical-plans-automation-process-2026-06-06.md`
  - `docs/reviews/ai/ai-plan-3-8-deck-capability-tactical-plans-final-report-2026-06-06.md`

## Scope

- PlanStep-Mapping für Coverage- und Suchschritte prüfen und schärfen, insbesondere:
  - `search_for_answer`
  - `draw_for_answer`
  - `install_breaker`
  - `gain_credits_for_path`
  - `build_credit_base`
  - `build_credit_bank`
  - Recovery-Mapping in TacticalPlans
- Wenn `requiredCapability` Wall-, Code-Gate-, Sentry- oder Universal-Coverage verlangt, darf `search_for_answer` nur auf planrelevante Actions mappen:
  - direkte Installation eines passenden Breakers,
  - passende Suchkarte oder Suchaktion,
  - Recovery, wenn die zurückgeholte Karte ein passender Breaker, eine passende Suchkarte oder ein zulässiger Draw-for-Answer ist,
  - Draw-for-Answer, wenn keine bessere Suche verfügbar ist.
- Reine Burst-Economy, generische Recovery ohne planrelevantes Ziel, Bank-Aufbau und Low-Value-Runs dürfen diesen Coverage-Step nicht erfüllen.
- Eine `RecoveryTargetEvaluation` oder gleichwertige Bewertung ergänzen:
  - `recoveredCardId/title`
  - `recoveredCardRole`
  - `supportsActiveCapabilityNeed`
  - `supportsCreditNeed`
  - `supportsDrawOrSearchNeed`
  - `supportsSurvivalNeed`
  - `recoveredCardPlanFit: none/low/medium/high`
  - `recoveryLoopRisk`
  - redigierte Evidence
- `Junkyard BBS` hoch bewerten, wenn die oberste Heap-Karte den aktiven Planbedarf erfüllt, z. B. passender Breaker, passende Suchkarte, akzeptierter Draw-for-Answer, Funding-Karte bei Credit-Blocker oder Survival-/Notfallkarte.
- `Junkyard BBS` abwerten, wenn die zurückgeholte Karte den aktiven Blocker nicht löst oder nur einen Economy-Recovery-Loop fortsetzt, während Coverage fehlt.
- `Livewire's Contacts` darf `build_credit_base`, `gain_credits_for_path` oder `recover_economy` unterstützen, aber nicht `search_for_answer` erfüllen.
- Wenn kein gültiger Such-/Draw-/Recovery-Match existiert, soll der Coverage-Plan sichtbar blockiert bleiben, z. B. `blocked_no_valid_search_action`, und auf saubere Fallbacks wie Draw, Creditbase oder Plan-Enabler ausweichen.
- Konservativen Loop-Malus ergänzen:
  - `repeatedRecoverySameCardPenalty`
  - `repeatedEconomyRecoveryLoopPenalty`
  - `noProgressOnRequiredCapabilityPenalty`
  Der Malus greift nur, wenn die Wiederholung den aktiven Plan nicht voranbringt; echter FundingNeed darf ihn reduzieren oder umgehen.
- Redigierte Debug-/Evidence-Felder ergänzen, z. B. `activeRequiredCapability`, `planStepExpectedRole`, `matchedActionRole`, `rejectedFalseMatches`, `recoveryTargetEvaluation`, `recoveredCardPlanFit`, `recoveryLoopRisk`, `why_livewire_not_search`, `why_junkyard_recovery_allowed_or_rejected`, `blocked_no_valid_search_action`.

## Nicht im Scope

- Keine Engine-Änderung und keine LegalAction-Erzeugungsänderung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Zufallspfad.
- Keine neuen Taktiksignale und keine neue Strategy-ID, sofern vorhandene Candidate-/PlanStep-Semantik reicht.
- Keine Hidden-Info-Ausweitung und keine Nutzung verdeckter gegnerischer Karten.
- Keine pauschale Abwertung von `Livewire's Contacts` oder `Junkyard BBS`.
- Keine Kartenfreigabe, kein Kartenpool- oder Manifest-Scope.
- Keine breite Neugewichtung der gesamten Runner-KI außerhalb des PlanStep-/Recovery-Mapping-Schnitts.

## Akzeptanzkriterien

- [ ] Bei fehlender Wall-Coverage erfüllt `Livewire's Contacts` keinen `search_for_answer`-Step.
- [ ] Bei fehlender Wall-Coverage erfüllt `Junkyard BBS` den Coverage-Plan nicht, wenn als Recovery-Ziel nur `Livewire's Contacts` oder eine andere nicht planrelevante Economykarte bekannt ist.
- [ ] `Junkyard BBS` darf den Coverage-Plan erfüllen, wenn die recoverbare Karte ein passender Breaker, eine passende Suchkarte oder ein akzeptierter Draw-for-Answer ist.
- [ ] Bei einem Credit-Blocker statt Coverage-Blocker darf `Livewire's Contacts` weiterhin `gain_credits_for_path` oder Economy-Pläne unterstützen.
- [ ] Ein wiederholter Livewire/Junkyard-Loop ohne Coverage-Fortschritt erhält einen nachvollziehbaren Malus.
- [ ] Der Loop-Malus greift nicht oder schwächer, wenn ein echter FundingNeed durch die wiederholte Economy erfüllt wird.
- [ ] Wenn kein valider Search-/Recovery-Match existiert, bleibt der Coverage-Plan sichtbar blockiert und Debug/Evidence nennt den fehlenden Match.
- [ ] Die finale Action stammt weiterhin aus `input.legalActions`.
- [ ] Debug/Evidence bleibt redigiert und enthält keine Hidden-Info.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/ai/src/tactical-plans.ts`
  - `packages/ai/src/runner-tactical-goals.ts`
  - `packages/ai/src/semantic-ai-runtime-cutover.ts`
  - fokussierte Tests in `packages/ai/src/tactical-plans.test.ts`, `packages/ai/src/runner-tactical-goals.test.ts`, `packages/ai/src/semantic-ai-runtime-cutover.test.ts`
- Bevorzugt vorhandene `ActionSemanticCandidate`-, `DeckCapabilityProfile`- und `RequiredCapability`-Daten verwenden.
- Label-Heuristiken nur als konservativen Fallback nutzen und false-positive Matches sichtbar in `rejectedFalseMatches` dokumentieren.
- Bestehende Junkyard-/Livewire-Runtime-Implementierung nicht ändern; dieses Paket betrifft AI-Planmapping und Bewertung.

## Ergebnisnotiz

Noch offen.
