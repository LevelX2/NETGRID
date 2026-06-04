# META 15 Complex Scope Enablement

Stand: 2026-06-04
Status: abgeschlossen
Quelle: `docs/architecture/ai/semantic-ai-meta13-meta18-takeover-automation-process-2026-06-04.md`

## Ziel

META 15 entsperrt komplexe Scopes nicht durch Raten, sondern durch explizite Context-Anforderungen, Gates und Blocker. Produktivaktivierung komplexer Scopes ist in META 15 nicht erlaubt.

## Scope-Ergebnis

| Scope | Ergebnis | Produktiv erlaubt |
| --- | --- | --- |
| `access_trash_steal` | `agreement_ready` | false |
| `trace_payment` | `shadow_ready` | false |
| `damage_prevention` | `shadow_ready` | false |
| `multi_target_multi_ability` | `still_blocked_with_requirements` | false |

## Anforderungen

### access_trash_steal

Benötigt:

```text
accessTargetContext
accessedCardVisibilityPolicy
trashCostKnown
stealCostKnown
declineReason
```

Gates:

```text
no_hidden_identity_for_wrong_side
engine_provided_access_choices_only
no_full_state_access_choice
```

### trace_payment

Benötigt:

```text
traceBase
boostOptions
paymentAmount
payer
beneficiary
expectedOutcome_side_safe
```

Gates:

```text
no_payment_option_guessing
no_hidden_hand_or_deck_input
engine_payment_choices_only
```

### damage_prevention

Benötigt:

```text
damageType
damageAmount
preventableAmount
preventionSource
survivalUrgency
timingWindow
```

Gates:

```text
damage_type_known
prevention_inside_timing_window
engine_prevention_choices_only
```

### multi_target_multi_ability

Benötigt:

```text
explicitAbilityId
engineProvidedTargetOptions
targetPriorityModel
whyNotForNonSelectedTargets
```

Blocker:

```text
multi_ability_card_unresolved
```

## Quality Gates

| Gate | Wert |
| --- | --- |
| noHiddenInfoViolation | true |
| noIllegalAction | true |
| targetContextCompleteForEvaluatedCases | true |
| abilityResolvedForMultiAbilityCases | true |
| costTimingKnownWhenRequired | true |
| unsafeDivergenceCount | 0 |
| blockedCasesRemainBlocked | true |

## Go/No-Go

Ergebnis: `complex_scopes_shadow_or_blocked`.

Nächster Schritt: `META16_broad_scoped_production_expansion`.

Nicht erlaubt:

```text
complex_scope_productive_activation
hidden_identity_guessing
target_reconstruction_from_boardstate
legacy_removed
```
