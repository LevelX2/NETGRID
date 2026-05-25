# Derived Basic AI Facts Architecture Prototype

Datum: 2026-05-25
Branch: `codex/ai-legal-action-diagnosis`
Scope: read-only Architektur-/Prototype-Slice, keine Runtime-, Strategie-, Engine- oder Hintdatenänderung.

## Kurzfazit

Mechanische Basic-AI-Facts lassen sich für einen relevanten Teil der Karten bereits aus Card-Implementations und Engine-Descriptors ableiten. Der Prototype-Report für 24 High-Impact-Pilotkarten findet alle Implementations und erzeugt für alle Karten mindestens einen mechanischen Fact. Alle 24 Karten haben Überschneidungen mit der manuellen Ontology; 9 Karten brauchen weiter ein manuelles Overlay oder präzisere Descriptoren.

Die sinnvolle Zielarchitektur ist deshalb nicht “Hints abschaffen”, sondern:

1. Engine/CardImplementation bleibt Regelautorität.
2. Ein read-only Generator leitet mechanische Basic-Facts ab.
3. Manuelle AI-Hints werden strategisches Overlay.
4. Ein Compiler/Gate vergleicht Generated Facts und Overlay, bevor `ai-card-hints-active.json` langfristig als kompiliertes Artefakt behandelt wird.

Dieser Slice ändert keine aktiven Hints und bindet nichts an Planer an.

## Quellen-Audit

### CardImplementation / Engine

Die folgenden Strukturen sind heute bereits maschinenlesbar genug:

- `CardImplementationDefinition.abilities`
  - `kind: "activated"`
  - `timing: "corp_main" | "runner_main" | "during_run"`
  - `effects` wie `gain_credits`, `draw_cards`, `gain_actions`, `trace`, `damage`, `search_stack_install`, `look_top_stack_show_to_corp_then_install_matching`
- `CardImplementationDefinition.icebreakerAbilities`
  - `break_subroutine`
  - `increase_strength`
  - `matches: { kind: "ice_subtype" }` oder `matches: { kind: "any" }`
  - Creditkosten, variable Pump-Profile und öffentliche Sichtbarkeit
- `CardImplementationDefinition.printedSubroutines`
  - `run_duration_additional_subroutine`
  - `run_duration_break_subroutine_cost`
  - `run_duration_jack_out_cost`
  - `run_duration_trash_program_after_passing_rezzed_ice_unless_jack_out`
- `CardImplementationDefinition.modifiers`
  - `break_subroutine_cost`
  - `steal_cost`
  - `activeWhile: "rezzed"`
  - Server-/Root-Scope
- `CardImplementationDefinition.restrictedHostedCreditSource`
  - dedizierte Credits für Trash-Kontexte
- `CardImplementationDefinition.successfulRunAccessReplacement`
  - Access-Replacement und Topdeck-Info
- Agenda-Implementations
  - `on_score`
  - `scoredAgenda`
  - `activated` Score-Area-Fähigkeiten

Diese Strukturen sind gut für Klassifikation, aber nicht für Legalitätsentscheidung durch Hints. Legalität bleibt bei LegalActions und `applyAction`.

### Nur teilweise strukturiert

Einige Informationen sind vorhanden, aber noch nicht als idealer Descriptor:

- Future-run/Future-encounter-ICE sind als Subroutine-Kinds sichtbar, brauchen aber oft semantische Übersetzung für `run_tax`, `program_trash` oder `remote_protection`.
- Japanese-Water-Torture-artige Action-Debt steht im Kartentext/Kommentar und nicht vollständig als strukturierter Resolver-Effect.
- Conditions wie “Runner attempted run last turn” sind in Operations codiert, haben aber noch kein passendes Ontology-Condition-Kind.
- Search-Ziele und Timing sind häufig strukturiert, aber Target-Granularität wie “program from stack” ist im aktuellen Ontology-Schema noch nicht vollständig ausdrückbar.
- Active-State wie `rezzed` oder `sameServerAsSource` ist strukturiert, darf aber nur als Board-State-Gate verstanden werden, nicht als statischer Safety-Wert.

### Nur Runtime-/LegalAction-Payload

Diese Informationen sollten nicht statisch aus Hints rekonstruiert werden:

- tatsächliche Legalität einer Aktion im aktuellen State
- aktuelle Kostenquote nach allen Modifiers
- konkrete Run-/Encounter-Kosten
- aktuelle Trace-Wahrscheinlichkeit
- aktuelle Score-/Advance-/Rez-Zahlbarkeit
- sichtbare oder verdeckte Install-/Access-Ziele
- temporäre Board-State-Wahrheiten wie rezzed/unrezzed, active/inactive, paid/unpaid

Diese Fakten gehören in LegalActions, Board-State, `effectiveRunQuote`, Revalidation und Replay.

### AI-Hint- und Gate-Struktur

Der aktuelle Hint-Pfad besteht aus:

- `data/ai/ai-card-hints-active.json`
- `packages/ai/src/ai-hints.ts`
- `packages/ai/src/hint-ontology.ts`
- `packages/ai/src/hint-ontology-doctrine.ts`
- spezialisierte Consumer:
  - `breaker-ontology-consumer.ts`
  - `remote-role-ontology-consumer.ts`
  - `tag-punish-ontology-consumer.ts`
- `scripts/check-ai-hint-quality.mjs`
- `data/ai/card-role-manifest-0.9.json`
- `docs/reviews/ai/ai-hint-consumer-contract-inventory-2026-05-25.json`

Diese Struktur ist gut für read-only Validierung und Consumer-Gates. Sie ist noch nicht ideal für mechanische Facts, weil `ai-card-hints-active.json` aktuell sowohl mechanische Beschreibung als auch strategisches Overlay enthält.

## Derivable Basic AI Facts

### A. Sicher ableitbar

| Mechanikquelle                          | Derived Basic AI Fact                                                | Grund                                                        |
| --------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `gain_credits`                          | `effects.kind = economy`                                             | Amount, Timing und Scope sind meist explizit.                |
| `draw_cards`                            | `effects.kind = draw`                                                | Amount und Timing sind explizit.                             |
| `gain_actions`                          | `effects.kind = extra_action`                                        | Score-Area-/Action-Timing ist aus Ability-Kontext ableitbar. |
| `trace` + `onSuccess.add_tags`          | `trace`, `tag_source`, `requires_trace_success`                      | Source/Payoff-Kette ist strukturiert.                        |
| `condition.runner_is_tagged`            | `requires_runner_tagged`                                             | Direkte Play-/Ability-Condition.                             |
| `damage`                                | `damage`; mit tagged Condition auch `tag_punish_payoff`              | Mechanischer Schaden ist explizit.                           |
| `lose_credits` gegen Runner             | `counter_economy`; mit tagged Condition auch `tag_punish_payoff`     | Mechanischer Economy-Hit ist explizit.                       |
| `icebreakerAbilities.break_subroutine`  | `breakerProfile.coverage`, `breakCost`                               | Coverage und Kosten sind strukturiert.                       |
| `icebreakerAbilities.increase_strength` | `pumpCost`                                                           | Creditkosten und Variable sind strukturiert.                 |
| `restrictedHostedCreditSource`          | `trash_credit`                                                       | Restriktion ist maschinenlesbar.                             |
| `search_stack_install`                  | `search`, ggf. `requires_during_run`                                 | Timing und Target sind erkennbar.                            |
| `successfulRunAccessReplacement`        | `access_replacement`, `topdeck_info`, `requires_successful_run`      | Zugang wird als strukturierter Follow-up modelliert.         |
| Agenda `activated`                      | `scored_agenda_action`, `scored_activated`, `requires_scored_agenda` | CardType + Ability-Kontext reichen.                          |
| `steal_cost` Modifier                   | `remoteRole.agenda_steal_tax`                                        | Semantik ist eng und gut abgrenzbar.                         |
| `break_subroutine_cost` Modifier        | `remoteRole.run_tax`, `run_tax`                                      | Semantik ist eng und gut abgrenzbar.                         |

### B. Wahrscheinlich ableitbar, aber vorsichtig

| Thema                   | Ableitung                                                            | Vorsicht                                                           |
| ----------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Future-run ICE          | `future_run_effect`, `run_tax`, `program_trash`, `remote_protection` | Effektklasse ist ableitbar, strategische Stärke nicht.             |
| Future-encounter ICE    | `future_encounter_effect`                                            | Aktuelles Pilot-Script trennt run/encounter noch grob.             |
| RemoteRole              | `run_tax`, `agenda_steal_tax`, `remote_capacity`, `ice_modifier`     | Active-State und Serverkontext müssen aus Board/Engine kommen.     |
| Counter economy         | `counter_economy`, `economy`                                         | Hosted-credit- und Counter-Quellen brauchen oft Lifecycle-Kontext. |
| Search/Tutor            | `search`, Target-/Timing-Hints                                       | Target-Granularität braucht Schema-Erweiterung.                    |
| Action-cost economy     | `economy`, `costProfile.clicks`                                      | OpportunityCost bleibt strategisch.                                |
| Scored agenda abilities | `scored_agenda_action` + mechanischer Effekt                         | Priorität gegenüber Score/Safety bleibt Consumer-Logik.            |

### C. Manuell bleiben

Diese Felder sollten nicht generiert werden:

- `lineSupport`
- strategische Priorität
- Phase-/Plan-Guidance
- `opponentSignals`
- `quality`, `confidence`, `needsHumanReview`, `benchmarkCovered`
- archetypabhängige Bewertung
- “Übergangsbreaker” vs Kernbreaker
- Bait-vs-Scoring-Remote-Intent
- Risky Economy und Reserve-Risiko jenseits mechanischer Kosten
- “hold until closeout”
- “do not overvalue early”
- Priorität in konkreten Deckdoctrines

## Prototype-Generator

Neuer read-only Prototype:

- Script: `scripts/prototype-ai-derived-basic-facts.mjs`
- Report: `docs/reviews/ai/ai-derived-basic-facts-prototype-2026-05-25.json`
- Modus:
  - `--write` schreibt den Review-Report.
  - `--check` vergleicht Report gegen aktuelle Ableitung.
- Keine Runtime-Imports.
- Keine Engine-/AI-Entscheidungslogik.
- Keine Änderung an Hints.
- Keine LegalAction-Erzeugung.

Der Prototype scannt bewusst nur Pilotkarten und klassifiziert mechanische Patterns aus Implementation-Texten. Das ist kein endgültiger Generator; es ist ein belastbarer Spike, um zu sehen, welche Descriptoren heute schon reichen.

### Pilot-Ergebnis

| Kennzahl                                         | Wert |
| ------------------------------------------------ | ---: |
| Pilotkarten                                      |   24 |
| Implementation-Dateien gefunden                  |   24 |
| Karten mit abgeleiteten Facts                    |   24 |
| Karten mit Überschneidung zur manuellen Ontology |   24 |
| Karten mit Manual-Overlay-/Differenzbedarf       |    9 |

Abgeleitete Effect-Kinds:

- `breaker`
- `search`
- `topdeck_info`
- `install_discount`
- `trash_credit`
- `access_replacement`
- `scored_agenda_action`
- `economy`
- `counter_economy`
- `extra_action`
- `draw`
- `trace`
- `tag_source`
- `damage`
- `tag_punish_payoff`
- `future_run_effect`
- `remote_protection`
- `run_tax`
- `program_trash`

Abgeleitete Condition-Kinds:

- `requires_during_run`
- `requires_successful_run`
- `requires_scored_agenda`
- `requires_trace_success`
- `requires_runner_tagged`

### Auffällige Differenzen

- `Japanese Water Torture`: Coverage und Kosten sind ableitbar; Action-Debt ist nur aus Text/Kommentar sichtbar und braucht einen strukturierten Effect oder manuelles Overlay.
- `Self-Modifying Code`: Search und Timing sind ableitbar; `requires_installed_program` und bestehende `install_discount`-Interpretation brauchen Schema-/Review-Klärung.
- `Mystery Box`: Search, Topdeck-Info und Free-Install sind ableitbar; Target-/Installed-Program-Condition ist nicht vollständig im Ontology-Schema.
- `Deep Thought`: Topdeck-Info ist ableitbar; R&D-Pressure-Condition bleibt eher strategisch.
- `Netwatch Operations Office`: Trace/Tag-Source ist ableitbar; manuelle `tag`-Wirkung ist semantisch nah, aber nicht identisch.
- `Viral 15`: Future-run und Program-Trash sind ableitbar; Run-Tax-Interpretation braucht semantische Vorsicht.
- `Crystal Palace Station Grid`: `run_tax` und RemoteRole sind ableitbar; `remote_protection` bleibt strategische Folgerung aus Run-Tax.
- `Red Herrings`: Agenda-Steal-Tax ist ableitbar; Access-Condition und Remote-Protection sind Kontext/Strategie.
- `Closed Accounts`: `counter_economy` wird mechanisch erkannt, war manuell nicht als eigener Effect gesetzt.

## Zielarchitektur

### Datenfluss

```text
CardImplementation / Engine Descriptors
  -> derive-ai-basic-facts
  -> generated basic facts

Manual Strategic Overlay
  -> lineSupport / priority / quality / confidence / notes

Generated Basic Facts + Manual Overlay
  -> compiled active AI hint index
  -> existing ai-hints.ts runtime loader
```

### Verantwortlichkeiten

| Ebene                     | Verantwortlich für                                     | Nicht verantwortlich für            |
| ------------------------- | ------------------------------------------------------ | ----------------------------------- |
| Engine/CardImplementation | Regeln, Legalität, State-Änderung, Runtime-Descriptors | KI-Priorität                        |
| Derived Basic Facts       | mechanische Klassifikation                             | Strategie, Gewichtung, LegalActions |
| Manual Overlay            | strategische Bedeutung, Reviewstatus, Phase-Support    | mechanische Regeln duplizieren      |
| Compiled Index            | schnelle Runtime-Ladung, Backward Compatibility        | Regelautorität                      |
| Gates                     | Drift und Unknowns finden                              | automatische Balance-Entscheidung   |

## Dateiorganisation

### Empfohlene Struktur

Langfristig sollte `ai-card-hints-active.json` nicht mehr der manuelle Monolith sein, sondern ein kompiliertes Artefakt.

```text
data/ai/generated/ai-basic-facts.generated.json
data/ai/overlays/onr-v1/runner/programs.json
data/ai/overlays/onr-v1/runner/resources.json
data/ai/overlays/onr-v1/runner/hardware.json
data/ai/overlays/onr-v1/runner/events.json
data/ai/overlays/onr-v1/corp/agendas.json
data/ai/overlays/onr-v1/corp/ice.json
data/ai/overlays/onr-v1/corp/operations.json
data/ai/overlays/onr-v1/corp/assets.json
data/ai/overlays/onr-v1/corp/upgrades.json
data/ai/ai-card-hints-active.json
```

### Alternative nach Set / Side / Type

```text
data/ai/hints/onr-v1/runner/programs.json
data/ai/hints/onr-v1/runner/events.json
data/ai/hints/onr-v1/runner/hardware.json
data/ai/hints/onr-v1/runner/resources.json
data/ai/hints/onr-v1/corp/agendas.json
data/ai/hints/onr-v1/corp/ice.json
data/ai/hints/onr-v1/corp/operations.json
data/ai/hints/onr-v1/corp/assets.json
data/ai/hints/onr-v1/corp/upgrades.json
```

Diese Alternative ist einfacher, trennt aber Generated Facts und Overlay weniger klar. Für Drift-Gates ist die `generated/` + `overlays/`-Trennung besser.

## Compile-/Gate-Modell

### Phase A: Read-only Report

- Prototype-Report bleibt in `docs/reviews/ai/`.
- Keine Runtime-Nutzung.
- Keine CI-Pflicht.
- Ziel: Ableitbarkeit und Drift-Kategorien verstehen.

### Phase B: `check:ai-derived-facts`

- Generator wird stabilisiert.
- Output bleibt Review-/Report-JSON.
- Gate warnt bei:
  - mechanischem Fact in Implementation vorhanden, aber manuell anders beschrieben
  - manueller mechanischer Fact ohne Implementation-Basis
  - Implementation mit neuem Effect-Kind ohne Deriver-Mapping

### Phase C: Pilot-Compile für 20-40 Karten

- `generated/ai-basic-facts.generated.json`
- manuelle Overlays bleiben klein.
- `ai-card-hints-active.json` wird noch nicht ersetzt, sondern gegen Compile-Ergebnis verglichen.

### Phase D: Kompilierter Active Index

- `ai-card-hints-active.json` wird aus Generated Facts + Overlay erzeugt.
- Runtime lädt weiterhin denselben schnellen Index.
- Backward Compatibility bleibt erhalten.

## Risiken

- Generator könnte schleichend zu zweiter Regelengine werden. Gegenmaßnahme: nur Klassifikation, keine Legalität, keine Kostenwahrheit.
- Regex-/Textscan-Prototyp ist nicht robust genug für Produktion. Gegenmaßnahme: später TS-Descriptor-Import oder explizite Export-Metadaten.
- Mechanische Facts können strategische Stärke suggerieren. Gegenmaßnahme: Strategy Overlay bleibt getrennt.
- Manual Overlay kann veralten. Gegenmaßnahme: Drift-Gates.
- Hidden-Info-Risiko bei Search/Topdeck. Gegenmaßnahme: nur mechanische Fähigkeit klassifizieren, nie konkrete aktuelle Zoneninhalte.
- Runtime-Payload-Fakten dürfen nicht statisch werden. Gegenmaßnahme: LegalAction-/Board-State-Vorrang dokumentieren und testen.

## Empfehlung

Der nächste sinnvolle Implementierungsschritt ist kein Planerumbau. Sinnvoll ist ein stabilerer `check:ai-derived-facts`-Pfad mit 20-40 Pilotkarten, der:

- CardImplementation-Descriptors statt Regex bevorzugt,
- generated Facts und manuelles Overlay getrennt vergleicht,
- Drift als Warning ausgibt,
- keine Hints kompiliert und keine Runtime beeinflusst.

Danach kann ein kleiner Compile-Prototyp für die bereits migrierten Ontology-Pilotkarten folgen.
