# Aufgabe 046 - Proteus AI-Support-Aktivierung

Aufgabe-ID: Aufgabe 046

## Kurzfazit

Proteus wurde als vollständig implementierter und menschlich spielbarer Kartensatz in den aktiven AI-Support aufgenommen. Alle 154 runtime-sichtbaren Proteus-Karten haben jetzt aktive AI-Hints, `aiSupportStatus: "ai_supported"`, Support-Manifest-Abdeckung und compiled Hint-Einträge. Der Full-Coverage-Pfad erzeugt für 83 Proteus-Karten Generated Facts; 71 Karten bleiben bewusst als Legacy-Fallback im compiled Artefakt, weil der aktuelle Deriver keine strukturierten mechanischen Facts ableitet. Hard Errors und Blocker: 0.

Es wurde keine Engine-Regel, keine LegalAction-Erzeugung, keine Profil-/Default-Umschaltung und keine Hidden-Info-Wirkung eingeführt.

## Ausgangslage

Aufgabe 041/042 hatten den compiled Hint Runtime-Pfad für 410 aktive AI-Hints stabilisiert, Proteus aber noch nicht aktiviert. Der Proteus-Catalog-Drift war damals bewusst out-of-scope. Für Aufgabe 046 gilt Proteus als vollständig implementiert und menschlich spielbar; deshalb wurde der Set-Scope geschlossen statt erneut nur zu beobachten.

## Scope-Entscheidung

Alle runtime-sichtbaren Proteus-Karten wurden als AI-supported aktiviert, weil:

- Runtime-Katalog: 154 Proteus-Karten.
- CardImplementation: 154/154 gefunden.
- Human playable: 154/154.
- Aktiver AI-Hint: 154/154.
- Compiled Hint: 154/154.
- Blocker: 0.

Die Entscheidung ist ein Support-/Diagnose-/Compiled-Hint-Scope-Cut. Sie erzeugt keine neue Legalität; `applyAction` bleibt die Regelautorität.

## Coverage

| Metrik                           | Wert |
| -------------------------------- | ---: |
| Aktive AI-Hints vorher           |  410 |
| Aktive AI-Hints nachher          |  564 |
| Neue Proteus-Hints               |  154 |
| Runtime-sichtbare Proteus-Karten |  154 |
| Proteus-Implementations gefunden |  154 |
| Proteus `ai_supported`           |  154 |
| Proteus compiled Hints           |  154 |
| Proteus Generated-Facts-Karten   |   83 |
| Proteus Legacy-Fallback-only     |   71 |
| Proteus Manual Overlays          |    0 |
| Proteus Hard Errors              |    0 |
| Proteus Blocker                  |    0 |

Compiled-Coverage-Klassen für Proteus:

| Klasse                     | Karten |
| -------------------------- | -----: |
| `descriptor_or_schema_gap` |     83 |
| `legacy_fallback_only`     |     71 |

Die 83 Descriptor-/Schema-Gaps sind keine Blocker: Generated Facts wurden erzeugt, aber der aktive Monolith spiegelt diese mechanischen Felder nicht manuell. Die 71 Legacy-Fallbacks bleiben compiled und AI-supported, aber ohne strukturiert abgeleitete Facts.

## Deriver / Ontology

Der Full-Derived-Facts-Pfad wurde auf Proteus erweitert, indem `scripts/check-ai-derived-facts-full.mjs` neben `onr-v1` auch `packages/engine/src/card-implementations/proteus` scannt. Es wurde keine neue Ontology-Kategorie eingeführt. Der Pilot-/Index-Check `check:ai-derived-facts` bleibt unverändert auf seinen bisherigen 193 Pilotkarten.

## Active Hints und Supportstatus

`data/ai/ai-card-hints-active.json` wurde um 154 minimale Proteus-Hints ergänzt. Die Einträge setzen Side, CardType, Rollen-/Planrollen-Fallbacks und `aiSupportStatus: "ai_supported"`; mechanische Details kommen aus Generated/compiled Facts, soweit ableitbar.

`data/manifests/proteus-card-support.json` wurde auf AI-Support aktualisiert: 154/154 Proteus-Karten sind `human_playable` und `ai_supported`, die alten BlockReasons wurden entfernt und die Support-Szenario-Referenz wurde gesetzt.

## Overlays

Es wurden keine Proteus-Manual-Overlays ergänzt. Die Aktivierung braucht aktuell keine strategischen Proteus-Sonderoverlays; mechanische Ableitung beziehungsweise Legacy-Fallback reicht für den Support-Scope. Overlay-Gate bleibt grün.

## Catalog-Baseline

Der Catalog-Test erwartet jetzt, dass Proteus nicht nur Human-vs-Human-decklegal sichtbar ist, sondern auch AI-Support-Abdeckung hat:

- 154 Proteus-IDs im sichtbaren Baseline-Scope.
- 0 runtime-sichtbare Proteus-Karten ohne aktive AI-Hints.
- 154 Proteus-Karten mit compiled Hint.
- 154 Proteus-Karten mit Implementation-Manifest.
- `ai_supported: true` im Proteus-Supportstatus.

`@netgrid/catalog test` und Catalog-Typecheck sind grün.

## Benchmark

Frischer 8-Slot-Lauf:

- Suite: `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`
- Runnable Slots: 8

| Global            | Baseline | Candidate |  Delta |
| ----------------- | -------: | --------: | -----: |
| Games             |       72 |        72 |      0 |
| Illegal Actions   |        0 |         0 |      0 |
| Replay Failures   |        0 |         0 |      0 |
| Timeout Rate      |        0 |         0 |      0 |
| Fallback Rate     |    0.029 |     0.030 | +0.001 |
| ActionLimitRate   |    0.347 |     0.361 | +0.014 |
| Corp Scores       |       52 |        58 |     +6 |
| Runner Steals     |      130 |       117 |    -13 |
| Score+Steal total |      182 |       175 |     -7 |

Slotbefunde:

| Slot              | Baseline Scores/Steals/Limit | Candidate Scores/Steals/Limit |
| ----------------- | ---------------------------: | ----------------------------: |
| Smoke             |               7 / 14 / 0.667 |               10 / 15 / 0.667 |
| Snapshot Rig      |               9 / 22 / 0.111 |               12 / 17 / 0.111 |
| Snapshot Pressure |              11 / 26 / 0.333 |               12 / 22 / 0.222 |
| Snapshot Holdout  |               9 / 20 / 0.556 |                6 / 21 / 0.556 |
| Local Pair 1      |                    2 / 9 / 0 |                     2 / 8 / 0 |
| Local Pair 2      |                   0 / 19 / 0 |                3 / 15 / 0.222 |
| Real Scene 1      |               8 / 15 / 0.556 |                7 / 13 / 0.778 |
| Real Scene 2      |                6 / 5 / 0.556 |                 6 / 6 / 0.333 |

Interpretation: Der erweiterte AI-Hint-Scope erzeugt keine Safety-Regression. Candidate bleibt global stärker bei Corp Scores und Runner Steals, aber ActionLimit bleibt wegen Local Pair 2 und Real Scene 1 ein dokumentiertes Beobachtungsrisiko.

## Guardrails

| Guardrail                                       | Candidate |
| ----------------------------------------------- | --------: |
| `corpAgendaInstalledInCheaplyContestableRemote` |         0 |
| `corpAdvanceInCheaplyContestableRemote`         |         0 |
| `runnerRunStartedAgainstKnownUnpayableFullPath` |         0 |
| `corpFutureRunIceInstalledAsDeadEffect`         |         1 |
| `corpMultiIceInstallOrderFutureEffectDead`      |         0 |
| `corpRemotePortfolioOverExpanded`               |         0 |
| `corpNewRemoteCreatedWithoutPayloadPlan`        |        10 |

Die Proteus-Aktivierung hat keine Engine-, Legalitäts-, Runtime-Overlay- oder Profilwirkung eingeführt.

## Checks

Grün:

- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-derived-facts-full`
- `corepack pnpm check:ai-derived-facts`
- `corepack pnpm check:ai-hint-compiled-index`
- `corepack pnpm check:ai-manual-overlays`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- Generated-Fact-Batch-Checks 1 bis 12
- `corepack pnpm check:ai-generated-fact-migration-priority`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm --filter @netgrid/catalog exec tsc -p tsconfig.json --noEmit`

Finale Whitespace-/Cached-Diff-Checks wurden nach Prettier und Staging ausgeführt.

## Bewusst nicht geändert

- Keine Engine-Regeländerung.
- Keine LegalActions-Änderung.
- Keine neue Hidden-Info-Nutzung.
- Keine Profil- oder Default-Umschaltung.
- Keine neuen Decks außer temporärem Benchmark-Harness.
- Keine Holdout-Optimierung.
- Keine Proteus-Manual-Overlays ohne konkreten strategischen Bedarf.

## Nächster Schritt

Proteus ist jetzt AI-supported im aktiven compiled Hint Scope. Der nächste praktische Schritt ist eine normale profile-gated Beobachtung mit Proteus im Catalog-/Hint-Scope; Default- oder Release-Entscheidungen bleiben separat.
