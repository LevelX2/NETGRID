# AI-Hint Ontology Phase 1 Validation

Datum: 2026-05-25

## Kurzfazit

Phase 1 des AI-Hint-Ontology-Redesigns ist als read-only Type-/Validation-Modul umgesetzt. Es gibt noch keine Planerwirkung, keine Doctrine-Aggregation, keine Hintmigration und keine neue Legalität.

Neue strukturierte Felder können jetzt in Tests oder Pilotfixtures validiert werden:

- `effects`
- `conditions`
- `costProfile`
- `breakerProfile`
- `remoteRole`
- `lineSupport`
- `opponentSignals`
- `quality`

Die aktuellen 410 aktiven Legacy-Hints bleiben rückwärtskompatibel gültig und erzeugen keine Ontology-Errors.

## Implementiert

Neue Datei:

- `packages/ai/src/hint-ontology.ts`

Neue Tests:

- `packages/ai/src/hint-ontology.test.ts`

Das Modul exportiert Known-Listen und Union Types für:

- `KnownHintEffectKind`
- `KnownHintEffectTiming`
- `KnownHintEffectScope`
- `KnownHintEffectResource`
- `KnownHintConditionKind`
- `KnownHintCostRisk`
- `KnownHintBreakerCoverage`
- `KnownHintBreakerSideEffect`
- `KnownHintRemoteRoleKind`
- `KnownHintRemoteThreatLevel`
- `KnownHintLineSupport`
- `KnownHintOpponentSignalKind`
- `KnownHintQualityConfidence`

Außerdem exportiert es:

- `AiHintStructuredEffect`
- `AiHintCondition`
- `AiHintCostProfile`
- `AiHintBreakerProfile`
- `AiHintRemoteRole`
- `AiHintOpponentSignal`
- `AiHintQuality`
- `AiHintOntologyExtension`
- `validateAiHintOntologyExtension`
- `validateAiHintOntologyFields`

## Noch nicht implementiert

Bewusst nicht umgesetzt:

- keine Planerwirkung in `runner-plans.ts`
- keine Planerwirkung in `corp-plans.ts`
- keine neue Doctrine-Aggregation
- keine AI-Hint-Massenmigration
- keine Änderung von `aiSupportStatus`
- keine Engine-/Shared-Änderung
- keine LegalAction- oder Playability-Ableitung aus Hints

## Known Lists

Startmenge für `effect.kind`:

- `economy`
- `draw`
- `damage`
- `tag`
- `trace`
- `run_tax`
- `breaker`
- `search`
- `remote_protection`
- `score_acceleration`
- `trash_credit`
- `multiaccess`
- `topdeck_info`
- `zone_shuffle`
- `extra_action`
- `counter_economy`
- `scored_agenda_action`
- `future_run_effect`
- `future_encounter_effect`
- `access_replacement`
- `install_discount`
- `rez_discount`
- `program_trash`
- `hardware_trash`
- `resource_trash`
- `tag_punish_payoff`
- `tag_source`

Startmengen existieren außerdem für Timing, Scope, Resource, Conditions, Cost-Risk, Breaker-Coverage, Breaker-Side-Effects, Remote-Roles, Line-Support, Opponent-Signals und Quality-Confidence.

## Validation-Scope

Die Validation ist rein diagnostisch:

- akzeptiert Legacy-Hints ohne neue Felder
- validiert optionale strukturierte Felder, wenn vorhanden
- meldet unbekannte Effect-/Timing-/Scope-/Resource-/Condition-Werte
- meldet unbekannte Breaker-Coverage und Breaker-Side-Effects
- meldet unbekannte Remote-Roles und Line-Support
- validiert einfache Shape-Regeln für Arrays, Objekte, Zahlen und Booleans
- erzeugt Issues/Errors/Warnings, aber keine Scores, Defaults oder PlanWeights

## Hidden-Info-Safety

Folgende Feldnamen werden als `hidden_info_risk` geblockt:

- `opponentDeckList`
- `corpHiddenRndOrder`
- `runnerHiddenStackOrder`
- `hiddenHqCards`
- `privatePayload`
- `fullGameState`
- `cardInstances`
- `actualDeckOrder`
- `actualStackOrder`
- `actualRndOrder`

Zusätzlich gilt:

- `opponentSignals` müssen `visibleEvidenceOnly: true` haben.
- Opponent-Signals sind nur sichtbare Archetype-Hinweise, kein gegnerisches Decklistenwissen.

## Backward Compatibility

Test `accepts all current legacy active hints without ontology errors` validiert alle 410 aktiven Hints aus `data/ai/ai-card-hints-active.json`.

Ergebnis:

- Ontology-Errors: 0
- Aktive Legacy-Hints bleiben gültig.

## `check:ai-hint-quality` Integration

Das bestehende `corepack pnpm check:ai-hint-quality` wurde bewusst nicht direkt mit dem TS-Modul verdrahtet.

Begründung:

- Das Script läuft als Root-MJS unter Node.
- Das Ontology-Modul ist TypeScript im `@netgrid/ai` Package.
- Eine direkte Runtime-Integration würde zusätzliche TS/loader/tsx-Tooling-Friktion erzeugen.
- Für Phase 1 ist ein stabiler AI-Testpfad sauberer als eine fragile Cross-Import-Lösung.

Das Gate bleibt weiterhin aktiv für Rollen-/Planrollen-, Benchmark-Hint- und Crystal-Palace-Denylist-Prüfungen. Ontology-Validation läuft in `@netgrid/ai` Tests. Eine spätere CLI-Integration ist sinnvoll, sobald Ontology-Felder in aktiven Hints landen.

## Tests

Fokussierte Testfälle:

1. Legacy-Hints validieren ohne Ontology-Errors.
2. Political-Overthrow-artiger scored-agenda economy effect ist gültig.
3. Japanese-Water-Torture-artiges BreakerProfile ist gültig.
4. Tutor-/Virizz-artiger future-run ICE effect ist gültig.
5. Unbekannter Effect-Kind erzeugt Error.
6. Unbekannte Condition erzeugt Error.
7. Hidden-Info-Feld erzeugt `hidden_info_risk`.
8. Opponent-Signal ohne `visibleEvidenceOnly: true` erzeugt Error.
9. Ontology-Modul importiert keine Planer- oder Doctrine-Module.

## Nächste Phase

Empfohlener nächster Schritt:

1. Pilotkarten mit read-only structured fields modellieren.
2. Weiterhin keine Planerwirkung.
3. Pilotkarten:
   - `Political Overthrow`
   - `Corporate Boon`
   - `Tutor`
   - `Virizz`
   - `Japanese Water Torture`
   - `Mystery Box`
   - `Scatter Shot`
   - `Scorched Earth`
   - `Crystal Palace Station Grid`
   - `Red Herrings`
4. Danach erst fokussierte Consumer-Anbindung mit Tests.
