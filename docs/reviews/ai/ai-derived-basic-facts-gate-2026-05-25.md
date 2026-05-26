# AI-Derived Basic Facts Gate

Datum: 2026-05-25

## Kurzfazit

Der bisherige read-only Prototype ist zu einem stabilen Gate ausgebaut:

```bash
corepack pnpm check:ai-derived-facts
```

Das Gate leitet mechanische Basic-AI-Facts aus den 50 versionierten Pilot-CardImplementation-Dateien ab, validiert die generierten Facts gegen bekannte Ontology-Werte, vergleicht sie mit den bestehenden manuellen AI-Hint-Ontology-Feldern und prüft den committed JSON-Report auf Drift. Es bleibt read-only: keine Engine-Regeländerung, keine Strategieänderung, keine Planerwirkung, keine Profilumschaltung, keine Hintmigration und keine Runtime-Nutzung der Derived Facts.

## Prototype vs Gate

Der Prototype `scripts/prototype-ai-derived-basic-facts.mjs` enthielt Pilotliste, Ableitung, Vergleich und Report-Erzeugung in einem Skript. Diese Logik liegt jetzt im Gate-Skript `scripts/check-ai-derived-facts.mjs`; das alte Prototype-Skript ist nur noch ein dünner Wrapper auf dieselbe Logik.

Neu hinzugekommen:

- Root-Script `check:ai-derived-facts`.
- Separates Pilotkarten-Inventar `data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json`.
- Deterministischer Gate-Report `docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json`.
- Fokussierter AI-Test `packages/ai/src/derived-basic-facts-gate.test.ts`.
- Harte Errors getrennt von Warnings.

## Harte Errors

Das Gate failt bei:

- fehlender Implementation-Datei für eine Pilotkarte,
- aktiver Pilotkarte mit Hint, aber ohne Implementation,
- Pilotkarte ohne Basic-Fact trotz `expectedDerivableKinds`,
- fehlendem erwartetem derived Kind aus dem Pilot-Inventar,
- nicht deterministischem Report,
- Drift zwischen `--check` und committed JSON,
- Hidden-Info-Feld in generated facts,
- unbekanntem Effect-/Condition-/Timing-/Scope-/Resource-/Coverage-/RemoteRole-Wert,
- Crystal-Palace-artigem harten Konflikt: generated `run_tax`, aber manuelles Economy-/Counter-Overlay.

Aktueller Stand:

- Harte Errors: 0
- Harte Konflikte: 0

## Warnings

Warnings blockieren nicht. Sie markieren bekannten Descriptor-/Overlay-Bedarf:

- Generated Fact ohne manuelle Ontology-Entsprechung.
- Manuelle Ontology ohne ableitbaren Implementation-Fact.
- Manual-Overlay-/Descriptor-Bedarf.
- Confidence mismatch.
- Text-/Pattern-basierte Ableitung statt stabiler TS-Descriptor-Import.
- Future-run-/future-encounter-Facts nur grob abgeleitet.
- Search-/Topdeck-Target-Granularität noch nicht vollständig im Schema ausdrückbar.
- komplexe Karte mit bewusstem Human-Review-/Overlay-Bedarf.

Aktueller Stand:

- Warnings: 70
- `text_pattern_derivation`: 50
- `descriptor_or_overlay_gap`: 6
- `manual_ontology_without_generated_match`: 4
- `confidence_mismatch`: 10
- `generated_fact_without_manual_match`: 0

## Pilotkartenumfang

Aufgabe 016 erweitert den read-only Pilot gezielt auf 50 Pilotkarten. Die Erweiterung bleibt auf deterministische Gate-/Report-Artefakte beschränkt:

- `data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json`

Kennzahlen:

- Pilotkarten: 50
- Implementations gefunden: 50
- Karten mit Derived Facts: 50
- Karten mit manueller Ontology-Überschneidung: 50
- Karten mit Manual-Overlay-/Descriptor-Bedarf: 3

Effect-Kinds:

- `access_replacement`: 1
- `breaker`: 20
- `counter_economy`: 2
- `damage`: 3
- `draw`: 2
- `economy`: 1
- `extra_action`: 1
- `future_encounter_effect`: 3
- `future_run_effect`: 3
- `install_discount`: 1
- `program_trash`: 1
- `remote_protection`: 8
- `rez_discount`: 2
- `run_tax`: 4
- `score_acceleration`: 2
- `scored_agenda_action`: 7
- `search`: 2
- `tag_punish_payoff`: 4
- `tag_source`: 3
- `topdeck_info`: 3
- `trace`: 3
- `trash_credit`: 2

Condition-Kinds:

- `requires_accessed_card`: 1
- `requires_during_run`: 7
- `requires_remote_server`: 1
- `requires_runner_tagged`: 4
- `requires_scored_agenda`: 7
- `requires_successful_run`: 2
- `requires_trace_success`: 3

Breaker-Coverage:

- `ap`: 1
- `code_gate`: 5
- `sentry`: 6
- `trace`: 1
- `universal`: 4
- `wall`: 3

Breaker-SideEffects:

- `ends_run_after_use`: 1
- `forgo_actions`: 1
- `once_per_subroutine`: 1
- `program_trash_risk`: 1
- `random_failure`: 3
- `stealth_loss`: 1

## Bekannte Lücken

Nach Descriptor-/Schema-Slice, Gap-Closeout, Self-Modifying-Code-Review und den Batch-3/4/5-Closeouts bleiben drei stabile Manual-Overlay-/Descriptor-Kandidaten:

- `onr_v1_017_deep-thought`
- `onr_v1_355_crystal-palace-station-grid`
- `onr_v1_366_red-herrings`

Geschlossen wurden `Netwatch Operations Office`, `Viral 15` und `Closed Accounts`; Details stehen in `ai-derived-basic-facts-gap-triage-2026-05-25.md`. Die Folge-Triage `ai-derived-basic-facts-descriptor-schema-slice-2026-05-25.md` ergänzt eine read-only TargetProfile-Schema-Erweiterung für `Self-Modifying Code` und `Mystery Box`. Der Closeout `ai-derived-basic-facts-descriptor-gap-closeout-2026-05-25.md` schließt zusätzlich `Japanese Water Torture` über `breakerProfile.sideEffects = ["forgo_actions"]` und `Mystery Box` über `targetProfiles.oncePerRun = true`. Der SMC-Review entfernt den falschen aktiven `install_discount`-Hint; die Karte bleibt über `targetProfiles.installCost = "normal"` mechanisch beschrieben. Wichtig: Die verbleibenden Lücken sind keine AI-Support-Demotion.

## Ontology-Validation

Das Gate spiegelt die Known-Lists aus `packages/ai/src/hint-ontology.ts` bewusst klein in MJS, statt das TypeScript-Modul direkt aus einem Root-Node-Script zu laden. Begründung: Eine direkte TS-/loader-Brücke wäre für dieses read-only Gate fragiler als der Nutzen. Die eigentliche TS-Ontology-Validation bleibt zusätzlich über den AI-Testpfad abgesichert.

Der Descriptor-Schema-Slice ergänzt read-only `targetProfiles` in `packages/ai/src/hint-ontology.ts`. Die Felder sind validiert, aber nicht konsumiert:

- `zone`
- `targetCardType`
- `installsTarget`
- `installCost`
- `shuffleAfter`
- `showToOpponent`
- `oncePerRun`
- `lookCount`

## Read-Only-Grenze

Generated Facts werden nicht von der KI geladen, nicht in Planern konsumiert und nicht in Runtime-Payloads geschrieben. Der Gate-Report enthält keine absoluten Pfade, keine Runtime-State-Daten und keine Hidden-Info-Felder.

## Späterer Compiler-Pfad

Dieses Gate ist der stabile Vorlauf für eine spätere Pipeline:

```text
CardImplementation / Engine Descriptors
  -> generated AI basic facts
  -> manual strategic overlay
  -> compiled active AI hint index
```

Die Engine bleibt Regelautorität. Generated Facts bleiben mechanische Klassifikation. Manuelle Overlays bleiben zuständig für Strategie, LineSupport, Quality, Benchmark-Status und Human-Review.

## Nächster Schritt

Der nächste praktische Schritt ist ein kleinerer Deriver-Hardening-Slice: nicht die Planer anbinden, sondern die Text-/Pattern-Ableitung durch stabilere Descriptor-Inputs ersetzen oder gezielt neue CardImplementation-Descriptoren für die sechs verbleibenden Overlay-/Gap-Kandidaten ergänzen.
