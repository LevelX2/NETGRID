# AI-Hint Ontology Roadmap

Datum: 2026-05-25

## Ziel

Diese Roadmap beschreibt eine kleine, rückwärtskompatible Erweiterung des AI-Hint-Vertrags. Sie ist keine Engine-Regel, keine LegalAction-Freigabe und keine Strategieänderung. Alle vorgeschlagenen Felder sind optional und dürfen nur Doctrine-/Planbewertung, Diagnose und Review verbessern.

## Grundsätze

- `roles`, `planRoles` und `aiSupportStatus` bleiben kompatibel.
- Neue Felder sind side-safe und dürfen keine gegnerischen Hidden-Zonen, Decklisten oder künftigen Draws beschreiben.
- Legalität bleibt ausschließlich Engine-/LegalAction-getrieben.
- PlayerView, PublicEvents, Replay und StateHash bleiben unverändert.
- Migration soll inkrementell nach Kartenfamilien erfolgen, nicht als 410-Karten-Massenänderung.

## Vorgeschlagene Felder

```json
{
  "effects": [
    {
      "kind": "economy",
      "scope": "corp",
      "timing": "scored_activated",
      "amount": 3,
      "resource": "credits",
      "finite": false
    }
  ],
  "conditions": [
    {
      "kind": "requires_tagged_runner"
    }
  ],
  "costProfile": {
    "clicks": 1,
    "credits": 0,
    "reserveRisk": "low"
  },
  "strategicTags": ["score_window_compression"],
  "remoteRole": "scoring_protection",
  "lineSupport": ["remote_scoring_build", "score_closeout"],
  "qualityReviewed": true
}
```

## Effektarten

Empfohlene `effects.kind`-Werte:

- `economy`
- `draw`
- `extra_action`
- `tag_source`
- `tag_payoff`
- `damage_payoff`
- `economic_punish`
- `trace`
- `score_counter`
- `advance_burst`
- `run_tax`
- `access_tax`
- `break_cost_modifier`
- `future_run_effect`
- `future_encounter_effect`
- `breaker_coverage`
- `search`
- `trash_recovery`
- `dedicated_trash_credit`
- `remote_protection`
- `remote_capacity`
- `topdeck_info`

Empfohlene `scope`-Werte:

- `runner`
- `corp`
- `run`
- `encounter`
- `access`
- `server`
- `fort`
- `hq`
- `rd`
- `archives`
- `remote`

Empfohlene `timing`-Werte:

- `action`
- `when_scored`
- `scored_activated`
- `start_of_turn`
- `during_run`
- `on_encounter`
- `on_access`
- `successful_run`
- `passive`

## Condition-Arten

Empfohlene `conditions.kind`-Werte:

- `requires_tagged_runner`
- `requires_runner_tagged_at_corp_turn`
- `requires_agenda_in_remote`
- `requires_known_top_rd`
- `requires_remaining_ice`
- `requires_ice_subtype`
- `requires_counter`
- `requires_trace_success`
- `requires_successful_run`
- `requires_accessed_card_type`

## Beispiele

### Scored-agenda economy

```json
{
  "cardId": "onr_v1_210_political-overthrow",
  "effects": [
    {
      "kind": "economy",
      "scope": "corp",
      "timing": "scored_activated",
      "amount": 3,
      "resource": "credits",
      "finite": false
    }
  ],
  "costProfile": {
    "clicks": 1,
    "credits": 0,
    "reserveRisk": "low"
  },
  "strategicTags": ["scored_agenda_economy"]
}
```

### Scored-agenda tag/punish

```json
{
  "cardId": "onr_v1_208_on-call-solo-team",
  "effects": [
    {
      "kind": "damage_payoff",
      "scope": "corp",
      "timing": "scored_activated",
      "amount": 1,
      "damageType": "meat"
    }
  ],
  "conditions": [{ "kind": "requires_tagged_runner" }],
  "strategicTags": ["tag_punish_payoff"]
}
```

### Future-run ICE

```json
{
  "cardId": "onr_v1_274_tutor",
  "effects": [
    {
      "kind": "future_encounter_effect",
      "scope": "run",
      "timing": "on_encounter",
      "addsSubroutine": "end_the_run"
    }
  ],
  "conditions": [{ "kind": "requires_remaining_ice" }],
  "strategicTags": ["future_run_tax"]
}
```

### Breaker cost profile

```json
{
  "cardId": "onr_v1_074_worm",
  "effects": [
    {
      "kind": "breaker_coverage",
      "scope": "runner",
      "iceSubtypes": ["wall"]
    }
  ],
  "costProfile": {
    "pumpCredits": 3,
    "breakCredits": 0,
    "baseStrength": 1,
    "reserveRisk": "medium"
  },
  "strategicTags": ["breaker_fracter"]
}
```

### Search/tutor

```json
{
  "cardId": "onr_v1_059_self-modifying-code",
  "effects": [
    {
      "kind": "search",
      "scope": "runner",
      "timing": "during_run",
      "zone": "stack",
      "targetCardType": "program",
      "installsTarget": true
    }
  ],
  "strategicTags": ["breaker_search", "rig_recovery"]
}
```

### Dedicated trash credits

```json
{
  "cardId": "onr_v1_057_scatter-shot",
  "effects": [
    {
      "kind": "dedicated_trash_credit",
      "scope": "runner",
      "timing": "access",
      "amount": 2,
      "targetCardType": "upgrade",
      "recurring": true
    }
  ],
  "strategicTags": ["trash_reserve_support"]
}
```

### Remote scoring protection

```json
{
  "cardId": "onr_v1_366_red-herrings",
  "effects": [
    {
      "kind": "access_tax",
      "scope": "fort",
      "timing": "on_access",
      "amount": 5,
      "appliesTo": "steal_agenda"
    }
  ],
  "remoteRole": "scoring_protection",
  "lineSupport": ["remote_scoring_build", "score_closeout"]
}
```

### HQ-density/dilution support

HQ-Density ist primär Board-/Handzustand, nicht Kartenhint. Karten dürfen aber Effekte wie Draw, Shuffle oder HQ/Archives/R&D-Zonenbewegung beschreiben:

```json
{
  "cardId": "onr_v1_188_ai-chief-financial-officer",
  "effects": [
    {
      "kind": "draw",
      "scope": "corp",
      "timing": "scored_activated",
      "amount": 5
    },
    {
      "kind": "zone_shuffle",
      "scope": "corp",
      "fromZones": ["hq", "archives"],
      "toZone": "rd"
    }
  ],
  "strategicTags": ["hq_density_management"]
}
```

## Migrationsreihenfolge

1. Scored-agenda activated abilities.
2. Future-run-/Future-encounter-ICE.
3. Tag/Punish source/payoff/condition.
4. Breaker cost profiles.
5. Dedicated trash credits and access/trash support.
6. Remote scoring protection and remote portfolio role.
7. Strategic-line support.

## Nicht-Ziele

- Keine LegalAction-Freischaltung.
- Keine Engine-Regeln.
- Keine Hidden-Info-Projektion.
- Keine Profilumschaltung.
- Keine pauschale `ai_supported`-Demotion.
- Keine Massenmigration ohne Review-Gate.
