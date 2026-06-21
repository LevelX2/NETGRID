# Card Function Rest Family Prioritization - 2026-06-21

## Ausgangsstand

Quelle ist `docs/reviews/engine/card-function-abstraction-2026-06-12.md` mit 271 Known-Findings:

| Kategorie | Anzahl |
| --- | ---: |
| `functional_kind_uses_card_name` | 25 |
| `test_only_card_name` | 59 |
| `allowed_catalog_reference` | 43 |
| `runtime_state_field_uses_card_name` | 87 |
| `mechanics_constant_controls_behavior_by_card_id` | 31 |
| `false_positive` | 26 |

Bereits abgeschlossene Slices: Preying Mantis, Quest for Cattekin, Code Viral Cache, Krumz, Startup Immolator, Siren, Bizarre Encryption Scheme und Pirate Broadcast.

Der Review bleibt ein Inventar mit konservativem Guard. Kartentitel, `cardDefinitionId`-Werte, Registry-/Coverage-Einträge und Testnamen sind weiterhin erlaubt. Relevant für Refactor-Slices sind funktionale `kind`-Werte, Runtime-State-Felder, Payload-Keys, Resolvernamen und verhaltenssteuernde Konstanten.

## Priorisierte Familien

### 1. Scored-Agenda-Familien

Kandidaten:

- Corporate War
- Project Babylon

Ziel-Kinds:

- `score_credit_swing_if_corp_credit_threshold_met`
- `overadvance_bonus_agenda_points`

Ziel-State:

- `scoredAgendaAbilities[]` oder die bestehende Scored-Agenda-Struktur mit neutralen Ability-Descriptors.

Risiko:

- Mittel. Scoring bleibt ein Engine-Kernpfad, aber beide Karten liegen fachlich eng im Scored-Agenda-Bereich.
- Kritisch ist, dass Scoring-Legalität, Advancement-Counter-Zählung, Credit-Swing und Agenda-Punkte unverändert bleiben.

Empfehlung:

- Sofortiger nächster Code-Slice. Das ist der einzige explizite `deferred_refactor_required`-Eintrag in der aktuellen Abstraktionsplan-Tabelle.

### 2. Run-Start-Tax

Kandidat:

- Newsgroup Taunting

Ziel-Kind:

- `run_start_tax`

Ziel-State:

- generische Run-Start-Tax-Quellen mit neutraler Aggregation und neutralen PublicPayload-Feldern wie `runStartTaxCredits` und `runStartTaxSourceDefinitionIds`.

Risiko:

- Mittel. Der Slice berührt Run-Start-Timing und Runner-Zahlungsfenster.
- Hidden-Info-Risiko ist gering, weil rezzed Quellen öffentlich sind; trotzdem dürfen Source-IDs nur über erlaubte öffentliche DefinitionIds in Payloads erscheinen.

Empfehlung:

- Zweiter Code-Slice. Die Familie ist enger als Hidden-Zone-Operationen und eignet sich für eine isolierte Runtime-/Payload-Neutralisierung.

### 3. Counter-Prevention-Replacement

Kandidat:

- Disinfectant

Ziel-Kind:

- `counter_prevention_replacement`

Ziel-State:

- generischer Counter-Prevention-Usage-Ledger, bevorzugt über bestehende limit-key-Strukturen, falls passend.

Risiko:

- Mittel. Der Slice berührt Counter-Gain-/Prevention-Fenster, Kosten und einmal-pro-Turn-pro-Quelle-Limit.
- Kritisch ist, dass nur Virus-Counter im bisherigen Fenster verhindert werden und keine neuen Replacement-Zeitpunkte entstehen.

Empfehlung:

- Dritter Code-Slice. Erst nach Run-Start-Tax, weil Counter-Prevention stärker an Turn-/State-Resolvern hängt.

### 4. Hidden-Zone-Operationen

Kandidaten:

- Fortress Respecification
- Social Engineering
- New Blood
- Shell Traders

Ziel-Kinds:

- `ice_reorder_hidden_zone_effect`
- `secret_guess_run_effect`
- `conceal_reorder_installed_ice`
- `delayed_install_sequence`

Ziel-State:

- getrennte Hidden-Zone-/Choice-Familien mit side-sicherem Pending-Choice-State.

Risiko:

- Hoch. Diese Karten berühren verdeckte Zonen, Hidden Choices, Reorder-/Conceal-Pfade, PublicEvents und mögliche Fehlertexte.

Empfehlung:

- Nicht in diesem Codeprozess refaktorieren. Separaten Hidden-Zone-Card-Function-Prozess mit eigener Side-/Redaction-Matrix planen.

### 5. Recovery-/Operation-Payout

Kandidaten:

- Silver Lining Recovery Protocol
- Omniscience Foundation

Ziel-Kinds:

- `recovery_protocol_after_runner_action`
- `end_turn_tag_on_successful_run_condition`

Ziel-State:

- neutrale Operation-/End-Turn-Payout- oder Conditional-Trigger-Familien.

Risiko:

- Mittel bis hoch. Die Karten hängen an Runner-Aktionen, Run-Erfolg und End-Turn-Timing.

Empfehlung:

- Nach Scored-Agenda, Run-Start-Tax und Counter-Prevention erneut bewerten.

### 6. Compatibility-Konstanten

Kandidat:

- Code Viral Cache Rest-Bootstrap-Funde

Ziel:

- prüfen, ob die vielen `CODE_VIRAL_CACHE`-Funde echte Runtime-Schuld oder generierte Bootstrap-/Compatibility-Duplikate sind.

Risiko:

- Niedrig bis mittel. Die Mechanik ist bereits abgeschlossen; die Restfunde liegen vor allem in Runtime-Bootstrap-/Host-Duplikaten.

Empfehlung:

- Als Artefakt-/Bootstrap-Cleanup behandeln, nicht mit neuen Mechanikfamilien mischen.

## Umsetzungsreihenfolge

1. Scored-Agenda-Familien: Corporate War / Project Babylon.
2. Run-Start-Tax: Newsgroup Taunting.
3. Counter-Prevention-Replacement: Disinfectant.
4. Hidden-Zone-Familie nur planen.
5. Recovery-/Operation-Payouts und Compatibility-Konstanten als spätere Folgeprozesse schneiden.

## Nicht-Ziele dieses Priorisierungsartefakts

- Keine Engine-Logikänderung.
- Keine neue Kartenfreigabe.
- Keine Hidden-Zone-Codeänderung.
- Keine Entfernung erlaubter Katalog- oder Testreferenzen.
