# AI-Hint Ontology Redesign Proposal

Datum: 2026-05-25

## Kurzfazit

Das aktuelle AI-Hint-System reicht langfristig nicht aus. Es funktioniert kurzfristig, weil `roles`, `planRoles` und `aiSupportStatus` einfache, robuste Signale liefern und die Planer sie ohne tiefen Datenvertrag lesen können. Für strategisch bessere KI-Entscheidungen ist das aber zu grob: Rollen sind freie Strings, Planrollen werden wie Rollen behandelt, viele Felder sind faktisch Review-Kommentare, und wichtige strategische Eigenschaften werden heute im Strategy-Code aus Boardzustand, Text, Payloads oder LegalActions rekonstruiert.

Das Zielbild ist kein Regelmodell neben der Engine. AI-Hints sollen keine LegalActions erzeugen, keine Engine-Regeln überschreiben und keine Hidden Info liefern. Sie sollen stattdessen eine side-safe strategische Ontologie bilden: Was ist die sichtbare Funktion einer Karte, wann ist sie wertvoll, welche Kosten-/Reserve-Risiken hat sie, welche strategische Linie unterstützt sie und welche Diagnose-Gates sichern die Qualität?

Der empfohlene nächste Implementierungsschritt ist Phase 1: ein read-only Schema mit Type-/Validation-Gates für optionale Felder wie `effects`, `conditions`, `costProfile`, `breakerProfile`, `remoteRole`, `lineSupport`, `opponentSignals` und `quality`. Danach sollten nur High-Impact-Pilotkarten migriert werden.

## Warum das aktuelle System nicht das Zielbild ist

### Freie Strings funktionieren, aber skalieren nicht

`roles` und `planRoles` funktionieren kurzfristig, weil sie billig zu pflegen und robust gegen unvollständige Daten sind. Der Planer kann mit einfachen Checks wie `role.startsWith("breaker_")`, `role.includes("economy")` oder `role === "pressure_rnd"` arbeiten.

Langfristig entstehen daraus Probleme:

- Synonyme: `rd_pressure` und `pressure_rnd`, `hq_run` und `pressure_hq`, `wall_breaker` und `breaker_fracter`.
- Semantische Vermischung: `remote_upgrade_tax` kann eine Planrolle, eine Kartenrolle oder ein Effekt sein.
- Seltene Einzelrollen: viele Rollen kommen nur einmal vor und haben keinen stabilen Consumer.
- Substring-Kopplung: eine Rolle wirkt manchmal nur, weil sie zufällig `economy`, `remote`, `tag` oder `tax` enthält.
- Keine Parameter: `economy` sagt nicht, ob es 3 Credits, 12 Credits, ein endlicher Pool, recurring Credits, Trash-only Credits oder ein riskanter Kredit mit Lose-Condition ist.
- Keine Bedingungen: `tag_punishment` sagt nicht, ob Runner tagged sein muss, ob es Trace braucht, ob es Meat Damage oder Economic Punish ist.

### `roles` und `planRoles` sind ontologisch vermischt

Der Consumer-Audit zeigt: Die KI führt `roles` und `planRoles` in `deck-doctrine.ts`, `runner-plans.ts`, `corp-plans.ts` und `index.ts` praktisch zusammen. Dadurch wirkt `build_rig` wie eine Eigenschaft der Karte und `economy` wie eine Planrolle.

Das ist rückwärtskompatibel nützlich, aber unsauber:

- Eine Rolle sollte beschreiben, was die Karte ist oder tut.
- Eine Planrolle sollte beschreiben, welche strategische Linie sie unterstützt.
- Eine Wirkung sollte beschreiben, welche side-safe Bewertungsfunktion sie hat.
- Eine Bedingung sollte beschreiben, wann die Wirkung zählt.

Diese Ebenen sind heute nicht getrennt.

### Schwach wirkende Felder

`valueHints`, `riskTags`, `requiredMechanics` und `scenarioRefs` sind wertvoll für Review und Support, aber aktuell kaum direkte Planerinputs.

- `valueHints`: klingt nach Entscheidungsgewicht, wird aber nicht breit als gewichtete Quelle konsumiert.
- `riskTags`: enthält wichtige Safety-/Timing-Informationen, ist aber kein Risk-Modell im Planer.
- `requiredMechanics`: beschreibt Engine-/Supportbedarf, nicht Strategiewert.
- `scenarioRefs`: belegt Test-/Supportkontext, beeinflusst aber keine Entscheidung.

Diese Felder sollten entweder ausdrücklich Review-only bleiben oder in strukturierte, typisierte Felder überführt werden.

### Der Strategy-Code rekonstruiert zu viel

Viele strategische Eigenschaften werden heute aus Action-Payloads, VisibleCards, PublicEvents, Belief/Memory, Effective-Run-Quote oder Kartentext rekonstruiert:

- scored-agenda activated abilities
- Future-Run-/Future-Encounter-Effekte
- Tag/Punish-Funnel
- dedicated trash credits
- R&D-Freshness
- remote safety
- cheap-contest risk
- setup-to-pressure conversion
- score-window compression

Das ist teilweise richtig, weil Boardzustand und LegalActions die Wahrheit liefern. Aber statische Kartenfunktion, Kostenprofil und strategischer Zweck sollten in Hints/Doctrine strukturierter ausdrückbar sein.

## Zielbild der Hint-Ontologie

### 1. `identity`

Stabile Identität und Katalogabgleich:

```json
{
  "cardId": "onr_v1_xxx",
  "side": "runner",
  "cardType": "program",
  "subtypes": ["icebreaker", "killer"]
}
```

### 2. `support`

Support ist mehrdimensional und sollte nicht nur `ai_supported` sein:

```json
{
  "support": {
    "engineSupported": true,
    "deckLegal": true,
    "formatLegal": true,
    "aiHintPresent": true,
    "aiHintQualityReviewed": true,
    "aiStrategyCovered": false,
    "aiBenchmarkCovered": true,
    "aiSupportStatus": "ai_supported"
  }
}
```

### 3. `legacyRoles`

Rückwärtskompatibilität:

```json
{
  "legacyRoles": {
    "roles": ["program", "breaker_killer"],
    "planRoles": ["build_rig", "safe_probe_run"]
  }
}
```

### 4. `effects`

Maschinenlesbare Wirkungen als Bewertungs-/Doctrine-Hilfe, nicht als Engine-Regel:

```json
{
  "effects": [
    {
      "kind": "economy",
      "timing": "action",
      "scope": "runner",
      "amount": 3,
      "resource": "credits",
      "repeatable": false,
      "finite": false
    }
  ]
}
```

### 5. `conditions`

Side-safe Voraussetzungen:

```json
{
  "conditions": [
    {
      "kind": "requires_runner_tagged"
    },
    {
      "kind": "requires_successful_run"
    }
  ]
}
```

### 6. `costProfile`

Bewertbare Kosten:

```json
{
  "costProfile": {
    "clicks": 1,
    "credits": 2,
    "memory": 1,
    "counters": 0,
    "reserveRisk": "medium",
    "opportunityCost": "low"
  }
}
```

### 7. `breakerProfile`

Breaker-spezifische Bewertungsdaten:

```json
{
  "breakerProfile": {
    "coverage": ["wall"],
    "baseStrength": 1,
    "pumpCost": 3,
    "breakCost": 0,
    "sideEffects": ["credit_intensive"],
    "restrictions": []
  }
}
```

### 8. `remoteRole`

Remote-/Fort-Funktion:

```json
{
  "remoteRole": {
    "kind": "run_tax",
    "threatLevel": "medium",
    "serverScope": "fort"
  }
}
```

### 9. `lineSupport`

Strategische Linien:

```json
{
  "lineSupport": [
    "rig_first",
    "economy_first",
    "early_rnd_pressure",
    "remote_scoring_build",
    "tag_trace_punish"
  ]
}
```

### 10. `opponentSignals`

Nur öffentliche, sichtbare Archetype-Signale:

```json
{
  "opponentSignals": [
    {
      "kind": "corp_tag_punish",
      "visibleEvidenceOnly": true
    }
  ]
}
```

Das darf nie heißen: "Gegnerdeck enthält X." Es heißt nur: "Diese sichtbare Karte ist ein öffentliches Signal für eine Linie."

### 11. `quality`

Review- und Teststatus:

```json
{
  "quality": {
    "reviewedBy": "ai-hint-audit",
    "reviewedDate": "2026-05-25",
    "confidence": "medium",
    "benchmarkDeckCoverage": true,
    "focusedDecisionTest": "packages/ai/src/index.test.ts",
    "needsHumanReview": false
  }
}
```

## Schema-Vorschlag

```json
{
  "cardId": "onr_v1_xxx",
  "side": "runner",
  "cardType": "program",
  "subtypes": ["icebreaker"],
  "aiSupportStatus": "ai_supported",
  "support": {
    "engineSupported": true,
    "deckLegal": true,
    "formatLegal": true,
    "aiHintPresent": true,
    "aiHintQualityReviewed": true,
    "aiStrategyCovered": false,
    "aiBenchmarkCovered": true
  },
  "quality": {
    "hintReviewed": true,
    "strategyCovered": false,
    "benchmarkCovered": true,
    "confidence": "medium",
    "needsHumanReview": false
  },
  "roles": ["program", "icebreaker"],
  "planRoles": ["build_rig"],
  "effects": [
    {
      "kind": "economy",
      "timing": "action",
      "scope": "runner",
      "amount": 3,
      "resource": "credits",
      "repeatable": true,
      "finite": false
    }
  ],
  "conditions": [
    {
      "kind": "requires_during_run"
    }
  ],
  "costProfile": {
    "clicks": 1,
    "credits": 2,
    "memory": 1,
    "counters": 0,
    "reserveRisk": "low",
    "opportunityCost": "medium"
  },
  "breakerProfile": {
    "coverage": ["wall", "sentry", "code_gate", "ap", "trace", "universal"],
    "baseStrength": 2,
    "pumpCost": 1,
    "breakCost": 0,
    "sideEffects": ["forgo_actions", "stealth_loss", "random_failure"],
    "restrictions": []
  },
  "remoteRole": {
    "kind": "scoring_protection",
    "threatLevel": "medium",
    "serverScope": "fort"
  },
  "lineSupport": [
    "rig_first",
    "economy_first",
    "early_rnd_pressure",
    "remote_scoring_build",
    "tag_trace_punish"
  ],
  "opponentSignals": [
    {
      "kind": "corp_tag_punish",
      "visibleEvidenceOnly": true
    }
  ]
}
```

## Beispielkarten

### Runner Breaker und Rig

#### Japanese Water Torture

Heute: Breaker-Rollen beschreiben grob Wall-/Breaker-Funktion; Future-Action-Debt und günstiges Wall-Breaking sind nur begrenzt als Kostenprofil sichtbar.

Neu:

```json
{
  "breakerProfile": {
    "coverage": ["wall"],
    "baseStrength": 2,
    "pumpCost": 0,
    "breakCost": 0,
    "sideEffects": ["future_action_debt"],
    "restrictions": []
  },
  "costProfile": {
    "reserveRisk": "low",
    "opportunityCost": "medium"
  },
  "lineSupport": ["rig_first", "remote_contest"]
}
```

Nutzen: Runner-Breaker-Coverage, Corp-Effective-Remote-Safety und Cheap-Contest-Bewertung. Risiko: Falsche Kostenpflege würde Remote-Safety massiv verfälschen.

#### Krash

Heute: `breaker_decoder`/`flex_breaker`-nahe Rollen; Pump-/Partial-Pump-Risiko kommt aus Planner/Run-Quote.

Neu:

```json
{
  "breakerProfile": {
    "coverage": ["code_gate"],
    "baseStrength": 1,
    "pumpCost": 1,
    "breakCost": 1,
    "sideEffects": [],
    "restrictions": []
  }
}
```

Nutzen: Pump-Viability und Access-Reserve. Risiko: Doppelte Pflege neben Engine darf nicht Break-Legalität ersetzen.

#### Worm

Heute: `breaker_fracter`, `efficient_breaker`.

Neu:

```json
{
  "breakerProfile": {
    "coverage": ["wall"],
    "baseStrength": 1,
    "pumpCost": 3,
    "breakCost": 0,
    "sideEffects": ["credit_intensive_pump"]
  }
}
```

Nutzen: Coverage bleibt klar, aber Pump-Kosten werden abbildbar. Risiko: Falsche Stärke-/Kostenwerte würden Pfadkosten verzerren.

### Runner Search, Trash und R&D

#### Mystery Box

Heute: nach Semantic-Audit mit `stack_search`, `recover_rig`, `hidden_zone_tool`.

Neu:

```json
{
  "effects": [
    {
      "kind": "search",
      "timing": "during_run",
      "scope": "runner",
      "zone": "stack_top",
      "lookCount": 5,
      "targetCardType": "program",
      "installsTarget": true
    }
  ],
  "conditions": [{ "kind": "requires_during_run" }],
  "lineSupport": ["breaker_search_first", "rig_first"]
}
```

Nutzen: Search/Tutor-Linien, Coverage-Exit. Risiko: Top-five ist nicht Full-Stack-Search; das muss strukturiert unterscheidbar sein.

#### Self-Modifying Code

Heute: `stack_search`, `build_rig`, `recover_rig`.

Neu:

```json
{
  "effects": [
    {
      "kind": "search",
      "timing": "during_run",
      "scope": "runner",
      "zone": "stack",
      "targetCardType": "program",
      "installsTarget": true
    }
  ],
  "conditions": [{ "kind": "requires_during_run" }],
  "costProfile": { "clicks": 0, "credits": 0, "reserveRisk": "medium" },
  "lineSupport": ["breaker_search_first", "rig_first", "remote_contest"]
}
```

Nutzen: Search vor Coverage, in-run install, Memory/Reserve. Risiko: Installkosten zahlt Engine; Hint darf nur Bewertung liefern.

#### Scatter Shot und Poltergeist

Heute: `trash_cost_payment`, `recurring_credit`, `runner_access_trash_economy`.

Neu:

```json
{
  "effects": [
    {
      "kind": "dedicated_trash_credit",
      "timing": "on_access",
      "scope": "runner",
      "amount": 2,
      "resource": "trash_credits",
      "targetCardType": "upgrade",
      "recurring": true
    }
  ],
  "lineSupport": ["remote_contest"]
}
```

Für Poltergeist wäre `targetCardType: "asset"` beziehungsweise Node/Asset nach lokaler Typologie.

Nutzen: Trash-Budget und Reserve-Schutz. Risiko: Falscher Zielkartentyp erzeugt falsche Trash-Priorität.

#### R&D-Protocol Files und Deep Thought

Heute: Hidden-Zone-/R&D-Pressure-Rollen, aber Topdeck-Wissen und Freshness kommen aus Memory.

Neu:

```json
{
  "effects": [
    {
      "kind": "topdeck_info",
      "timing": "successful_run",
      "scope": "rd",
      "lookCount": 5
    }
  ],
  "lineSupport": ["early_rnd_pressure", "interface_pressure"]
}
```

Nutzen: R&D-Freshness und known-top sequence. Risiko: echte R&D-Reihenfolge darf nie in AIInput leaken; nur legal known info.

#### Edited Shipping Manifests und MIT West Tier

Heute: ESM ist HQ-Pressure/Economy mit Access-Replacement; MIT West Tier ist Draw/Zone-Reset.

Neu:

```json
{
  "effects": [
    {
      "kind": "run_replacement",
      "timing": "successful_run",
      "scope": "hq",
      "replacesAccess": true
    },
    {
      "kind": "economy",
      "timing": "successful_run",
      "scope": "runner",
      "amount": 10,
      "resource": "credits"
    }
  ],
  "conditions": [{ "kind": "requires_successful_run" }]
}
```

MIT West Tier:

```json
{
  "effects": [
    {
      "kind": "draw",
      "timing": "action",
      "scope": "runner",
      "amount": 5
    },
    {
      "kind": "zone_shuffle",
      "scope": "runner",
      "fromZones": ["grip", "heap", "stack"],
      "toZone": "stack"
    }
  ]
}
```

Nutzen: Draw-vs-Setup-Entscheidung und Access-Replacement-Wert. Risiko: Ersatzwirkungen müssen mit Engine-Events abgeglichen bleiben.

### Corp Scored Agendas

#### Political Overthrow

Heute: Score-Area-Action wird durch KI-Code text-/payload-basiert als scored-agenda economy klassifiziert; Hint ist noch Legacy/Longtail.

Neu:

```json
{
  "effects": [
    {
      "kind": "economy",
      "timing": "scored_activated",
      "scope": "corp",
      "amount": 3,
      "resource": "credits",
      "repeatable": true
    }
  ],
  "costProfile": { "clicks": 1, "credits": 0, "reserveRisk": "low" },
  "lineSupport": ["economy_rez_reserve", "score_closeout"]
}
```

Nutzen: Corp-Basic-Credit-Vergleich. Risiko: Hints dürfen keine nicht legale Aktivierung behaupten.

#### Corporate Boon

Neu:

```json
{
  "effects": [
    {
      "kind": "extra_action",
      "timing": "scored_activated",
      "scope": "corp",
      "amount": 1,
      "resource": "actions",
      "finite": true,
      "oncePerTurn": true
    }
  ],
  "lineSupport": ["score_window_compression", "remote_scoring_build"]
}
```

Nutzen: Advance-to-Score-Compression. Risiko: Extra-Actions sind timing-sensitiv.

#### AI Chief Financial Officer und Employee Empowerment

Neu:

```json
{
  "effects": [
    {
      "kind": "draw",
      "timing": "scored_activated",
      "scope": "corp",
      "amount": 5
    },
    {
      "kind": "zone_shuffle",
      "scope": "corp",
      "fromZones": ["hq", "archives"],
      "toZone": "rd"
    }
  ],
  "lineSupport": ["economy_rez_reserve", "central_stabilize"]
}
```

Employee Empowerment:

```json
{
  "effects": [
    { "kind": "draw", "timing": "start_of_turn", "scope": "corp", "amount": 1 },
    {
      "kind": "draw",
      "timing": "scored_activated",
      "scope": "corp",
      "amount": 2
    }
  ]
}
```

Nutzen: HQ-density, draw pressure, economy loop avoidance. Risiko: Draw can worsen agenda flood; consumer must use board state.

#### Netwatch Operations Office und Strike Force Kali

Neu:

```json
{
  "effects": [
    {
      "kind": "tag_source",
      "timing": "scored_activated",
      "scope": "corp",
      "traceBase": 2
    }
  ],
  "conditions": [{ "kind": "requires_trace_success" }],
  "lineSupport": ["tag_trace_punish"]
}
```

Strike Force Kali:

```json
{
  "effects": [
    {
      "kind": "damage_payoff",
      "timing": "scored_activated",
      "scope": "corp",
      "amount": 2,
      "damageType": "meat"
    }
  ],
  "conditions": [{ "kind": "requires_runner_tagged" }],
  "lineSupport": ["tag_trace_punish", "score_closeout"]
}
```

Nutzen: Tag/Punish-Funnel. Risiko: Tags müssen am Corp-Decision-Window bestehen.

### Corp Tag/Punish Operations

#### Scorched Earth und Urban Renewal

Heute: `damage_operation`, `tag_punishment_operation`, `bait_runner`.

Neu:

```json
{
  "effects": [
    {
      "kind": "damage_payoff",
      "timing": "action",
      "scope": "corp",
      "amount": 4,
      "damageType": "meat"
    }
  ],
  "conditions": [{ "kind": "requires_runner_tagged" }],
  "lineSupport": ["tag_trace_punish", "score_closeout"]
}
```

Urban Renewal hätte `amount: 5`.

Nutzen: Terminal-Conversion. Risiko: Hidden Runner-Hand darf nicht zur Flatline-Wahrscheinlichkeit genutzt werden.

### Corp Future-Effect ICE

#### Tutor

Heute: Per-card-longtail; Engine/Run-Quote projiziert Future-Effect.

Neu:

```json
{
  "effects": [
    {
      "kind": "future_encounter_effect",
      "timing": "encounter",
      "scope": "run",
      "addsSubroutine": "end_the_run",
      "appliesTo": "later_ice"
    }
  ],
  "conditions": [{ "kind": "requires_remaining_ice" }],
  "lineSupport": ["ice_tax_glacier", "remote_scoring_build"]
}
```

Nutzen: Must-break Bewertung nur bei späterem ICE. Risiko: Wenn falsch konsumiert, kehrt der alte Tutor-last-ICE-Fehler zurück.

#### Virizz und Viral 15

Neu:

```json
{
  "effects": [
    {
      "kind": "break_cost_modifier",
      "timing": "encounter",
      "scope": "run",
      "amount": 1,
      "appliesTo": "later_break_subroutines"
    }
  ],
  "conditions": [{ "kind": "requires_remaining_ice" }]
}
```

Viral 15 zusätzlich:

```json
{
  "effects": [
    {
      "kind": "jackout_tax",
      "timing": "during_run",
      "scope": "run",
      "amount": 1
    },
    {
      "kind": "program_trash_pressure",
      "timing": "after_pass_ice",
      "scope": "run"
    }
  ]
}
```

Nutzen: Effective-Run-Quote und unbrokenRunEffect. Risiko: Effekte sind run-state-dependent.

### Corp Remote Protection

#### Crystal Palace Station Grid

Heute: nach Audit `run_tax`, Remote-Upgrade-Support; keine Economy/Counter-Rollen.

Neu:

```json
{
  "effects": [
    {
      "kind": "break_cost_modifier",
      "timing": "encounter",
      "scope": "fort",
      "amount": 1,
      "appliesTo": "break_subroutine"
    }
  ],
  "remoteRole": {
    "kind": "run_tax",
    "threatLevel": "medium",
    "serverScope": "fort"
  },
  "lineSupport": ["remote_scoring_build", "ice_tax_glacier"]
}
```

Nutzen: Remote-Safety und Runner-Trash-Budget. Risiko: Too broad protection role would overvalue early trash or safe remotes.

#### Tesseract Fort Construction und Red Herrings

Tesseract:

```json
{
  "effects": [
    {
      "kind": "future_encounter_effect",
      "timing": "encounter",
      "scope": "fort",
      "addsSubroutine": "pay_or_end_the_run"
    }
  ],
  "remoteRole": { "kind": "run_tax", "serverScope": "fort" }
}
```

Red Herrings:

```json
{
  "effects": [
    {
      "kind": "access_tax",
      "timing": "on_access",
      "scope": "fort",
      "amount": 5,
      "appliesTo": "steal_agenda"
    }
  ],
  "remoteRole": { "kind": "scoring_protection", "serverScope": "fort" }
}
```

Nutzen: Trash timing, steal reserve, scoring protection. Risiko: Access tax only matters with agendas and steal windows.

#### Namatoki Plaza und Data Wall

Namatoki:

```json
{
  "effects": [
    {
      "kind": "remote_capacity",
      "timing": "persistent",
      "scope": "fort",
      "additionalAgendaOrAssetSlots": 1
    }
  ],
  "remoteRole": { "kind": "remote_capacity", "serverScope": "remote" },
  "lineSupport": ["remote_scoring_build"]
}
```

Data Wall:

```json
{
  "effects": [
    {
      "kind": "end_the_run",
      "timing": "encounter",
      "scope": "ice",
      "subroutineCount": 1
    }
  ],
  "remoteRole": { "kind": "basic_ice_protection", "threatLevel": "low" }
}
```

Nutzen: Data Wall bleibt formal ETR, aber Cheap-Contest-Risk muss aus Runner-Rig berechnet werden. Risiko: Hints dürfen nicht sagen "sicherer Remote", wenn sichtbarer Breaker ihn kostenlos bricht.

## Verbraucherarchitektur

### `ai-hints.ts`

Bleibt Loader und Typgrenze:

- lädt Legacy-Hints
- validiert neue optionale Ontologie-Felder
- exportiert `AiCardHintV2`
- bietet Fallback von Legacy-Rollen auf alte Verbraucher

### Neues Modul `hint-ontology.ts`

Empfohlen:

- `KnownAiRole`
- `KnownPlanRole`
- `KnownEffectKind`
- `KnownConditionKind`
- `KnownStrategicTag`
- `KnownRemoteRole`
- Parser/Validator für optionale Felder
- Diagnosefunktion für unknown/unused/suspicious

### Neues Modul `ai-role-taxonomy.ts`

Optional, wenn Rollenkompatibilität getrennt bleiben soll:

- Aliasgruppen
- deprecated roles
- code-only roles
- migration hints
- synonym reports

### `deck-doctrine.ts`

Sollte strukturierte Felder aggregieren:

- Economy-Dichte nicht nur aus `economy`, sondern aus `effects.kind = economy`
- Tag/Punish-Dichte aus `tag_source`, `tag_payoff`, Conditions
- Scoring-Remote-Tools aus `remoteRole`
- Breaker-Coverage aus `breakerProfile`
- Strategic-line priors aus `lineSupport`

### `runner-plans.ts`

Direkt nutzen sollte Runner:

- `breakerProfile`
- `effects.kind = search`, `trash_recovery`, `dedicated_trash_credit`, `topdeck_info`, `multiaccess`
- `conditions` für timing-sensitive Bewertung
- `costProfile.reserveRisk`
- `lineSupport` nur als kleiner Bias, nicht als Action-Zwang

### `corp-plans.ts`

Direkt nutzen sollte Corp:

- `effects.kind = scored_activated economy/draw/extra_action/tag_source/damage_payoff`
- `remoteRole`
- `effects.kind = run_tax`, `access_tax`, `remote_capacity`
- `effects.kind = future_run_effect`, `future_encounter_effect`, `break_cost_modifier`
- `conditions` für tagged-runner, trace success, remaining ICE
- `lineSupport` für remote scoring, central stabilize, tag_trace_punish

### Diagnose/Review-only

Review-only bleiben sollten:

- `scenarioRefs`
- raw `requiredMechanics`
- reviewer notes
- quality status without direct strategy semantics

### Kompatibilität

Alte Hints bleiben gültig. Neue Felder sind optional. Consumer dürfen nie voraussetzen, dass alle 410 Karten V2-Felder haben. Gates stellen sicher:

- Wenn ein Planner ein neues Feld konsumiert, existiert mindestens eine Fixture-Karte mit diesem Feld.
- Unknown effect/condition kinds failen.
- Missing V2 fields warnen erst für Benchmark-/Pilotkarten, nicht global.

## Migration

### Phase 1: Read-only schema + validation

- `hint-ontology.ts` einführen.
- Schema erlauben, aber nicht planwirksam machen.
- Keine Massenmigration.
- Gate: unknown effect/condition/remoteRole/lineSupport failt.

### Phase 2: High-Impact-Pilotkarten

Pilotgruppen:

- scored-agenda actions
- breaker cost profiles
- search/tutor
- dedicated trash credits
- future-run ICE
- remote run-tax/scoring protection
- tag/punish source/payoff/condition

Nur Karten mit bestehenden Tests oder hoher Benchmark-Relevanz migrieren.

### Phase 3: Planer konsumieren neue Felder

- Erst fokussiert.
- Jede neue Entscheidungswirkung mit Tests.
- Keine breite Gewichtungsänderung.
- Legacy-Rollen bleiben Fallback.

### Phase 4: Quality gates

- Alle neuen Felder typisiert.
- Benchmark-Deckkarten zuerst.
- Unknown effect/condition fails.
- Known-role/plan-role gates bleiben.
- Consumer coverage tests: konsumiertes Feld braucht Datenfixture.

### Phase 5: AI-Support-Qualitätsstatus erweitern

`ai_supported` bleibt Legal-/Supportstatus, aber zusätzliche Status werden geführt:

- `ai_hint_quality_reviewed`
- `ai_strategy_covered`
- `ai_benchmark_covered`
- `needs_human_review`

## Tests und Gates

Empfohlene Gates:

- Schema validation.
- No unknown effect kinds.
- No unknown condition kinds.
- No roles outside `KnownRole`.
- No planRoles outside `KnownPlanRole`.
- All benchmark-deck cards have `qualityReviewed` status or `needsHumanReview`.
- All scored-agenda actions have structured effects.
- All breakers have `breakerProfile`.
- All search/tutor cards have target/timing.
- All tag/punish cards have source/payoff/condition split.
- All future-run ICE has future-effect structure.
- No effect grants legality.
- No hidden-info fields.
- Consumer coverage tests:
  - if planner consumes a field, at least one fixture card provides it;
  - if field exists in schema, either a consumer or documented review-only status exists.

## Risikoanalyse

### Overfitting auf Benchmark-Decks

Benchmark-Coverage ist wichtig, aber Holdouts dürfen nicht Tuning-Ziel werden. Gates sollten Benchmarkkarten priorisieren, nicht deren Ergebnisse optimieren.

### Doppelte Regelmodellierung

Effekte dürfen keine Kosten, Legalität oder Timingentscheidung ersetzen. Sie beschreiben Bewertungssemantik; Engine und LegalActions bleiben Wahrheit.

### Veraltete Hints nach Engine-Änderungen

Jede Engine-Änderung an Karteneffektfamilien braucht einen Hint-Contract-Check oder Review. Sonst laufen Ontologie und Engine auseinander.

### Rollen-/Effekt-Wildwuchs

Freie Strings dürfen nicht wiederkehren. Effektarten, Conditions und LineSupport müssen Union Types oder Allowlist-Gates haben.

### Strukturierte Felder ohne Consumer

Jedes neue Feld braucht `consumerStatus`: `active`, `diagnostic_only`, `review_only`, `planned`. Sonst entstehen neue tote Daten.

### Hints werden faktisch zu mächtig

Planer dürfen Hints nur als Bias nutzen. Wenn Hint und LegalAction widersprechen, gewinnt LegalAction/Engine.

### Hidden-Info-Risiken

`opponentSignals` müssen ausschließlich sichtbare Evidenz beschreiben. Keine gegnerischen Decklisten, Handkarten, R&D/HQ-Reihenfolge oder zukünftigen Draws.

### Inkonsistente Mischwelt

Legacy und V2 werden lange koexistieren. Migration muss Pilotgruppen, Fallbacks und Gates explizit trennen.

### Zu strenge Tests

Warnings für bekannte Altlasten sind besser als sofortige harte Fails. Harte Fails nur bei unbekannten Schemawerten, P0-Denylists, fehlenden Benchmark-Hints oder Hidden-Info-Feldern.

## Empfohlene nächste Schritte

1. `hint-ontology.ts` mit read-only Types und Validatoren anlegen.
2. Keine Planerwirkung in diesem ersten Implementierungsschritt.
3. 10-20 Pilotkarten für scored-agenda abilities, Future-ICE, Search/Tutor, BreakerProfile und Tag/Punish modellieren.
4. Consumer-Coverage-Tests schreiben.
5. Erst danach fokussierte Planer-Verbraucher aktivieren.
