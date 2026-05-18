# MVP 0.92 Requirements

Status: Requirements Freeze
Stand: 2026-05-03
Phase: Mechanik-Inventar und M1-Spezifikationsgate

## Kurzentscheidung

V0.92 ist ein reines Requirements- und Spezifikationsgate. Es verändert kein Laufzeitverhalten, keine UI, keine Serverpfade, keine KI und keine spielbaren Karten.

V0.92 trennt die Mechanikarbeit fachlich von V0.91. Die V0.91-Assetentscheidung ist nun als private lokale Scan-/Asset-Entscheidung eingeordnet: eigene private Kartenbilder dürfen nur lokal und privat als Anzeige-Artefakte genutzt werden. Sie sind keine öffentliche Lizenz, keine Distributionsfreigabe und kein Engine-, KI-, Match-State-, Replay- oder StateHash-Input.

`ready_for_MVP_0.93_implementation: true`

## Scope

V0.92 umfasst:

- normalisiertes Mechanik-Inventar nach aktuellem V0.9/S01-Stand,
- maschinenlesbare Coverage unter `data/rules/mechanics-coverage-0.92.json`,
- M1-Anforderungen für Effects, Abilities, Timing, Choices und Eventklassifikation,
- M1-Effect-/Timing-Spezifikation,
- V0.93-Testmatrix,
- Requirements Review und Final Review,
- konsistente Status- und Wissensbasis-Einordnung der V0.91-Privatasset-Entscheidung.

## Nicht-Ziele

V0.92 implementiert nicht:

- Engine-, UI-, Server-, KI- oder Test-Laufzeitverhalten,
- Damage, Trace, Resources, Mulligan, Multiaccess, Identity-Abilities, Prevention, Replacement oder Interrupts,
- neue spielbare Karten,
- Kartenbildimport oder Kartenbildanzeige,
- externe Kartenbild-, Logo-, Card-Frame-, Card-Back- oder Kartendatenbank-Abhängigkeiten.

## V0.91-Einordnung

| Feld | Entscheidung |
|---|---|
| Status | `private_local_assets_allowed` |
| Erlaubt | eigene private Kartenscans/lokale Kartenbilder, privat und lokal |
| Verboten | öffentliche Distribution, offizielle Logos, standalone Card Frames, Card Backs, externe Kartendatenbank-Abhängigkeiten |
| Runtime-Grenze | Bilder bleiben Anzeige-Artefakte und dürfen nicht in Engine, KI, GameState, LegalActions, PlayerActions, PublicEvents, Replays, Logs oder StateHash eingehen |
| Mechanik-Gate | V0.92/V0.93 wird durch V0.91 nicht blockiert |

## Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium | Testspur |
|---|---|---|---|
| M092-M0-STATUS-001 | V0.91-Status konsolidieren | Status/Wissensbasis führen V0.91 als private lokale Asset-Entscheidung, nicht als Mechanikblocker. | V092-T001 |
| M092-M0-STATUS-002 | Assetgrenze erhalten | Private Bilder bleiben Anzeige-Artefakte ohne Engine-, KI-, Match-State-, Replay- oder StateHash-Einfluss. | V092-T001 |
| M092-M0-COVERAGE-001 | Menschliche Coverage-Matrix | `MECHANICS_COVERAGE_MATRIX.md` ordnet bekannte Mechanikgruppen nach Status, Risiko, Abhängigkeit und Zielgate ein. | V092-T002 |
| M092-M0-COVERAGE-002 | Maschinenlesbare Coverage | `data/rules/mechanics-coverage-0.92.json` ist parsebar und enthält Gate-Assertions sowie Mechanikgruppen. | V092-T003 |
| M092-M0-COVERAGE-003 | Alte Deviations normalisieren | Alte MVP-0.1-Deviations werden nicht blind kopiert, sondern als resolved, partial, open, blocked oder out_of_scope eingeordnet. | V092-T004 |
| M092-M1-EFFECT-001 | Typisierte Effect-Grundlage spezifizieren | M1 definiert `EffectDefinition`, `EffectCommand`, Kosten, Ziele, Choices und deterministische Ausführung. | V092-T005 |
| M092-M1-EFFECT-002 | Kein Freitextparser | Kartentext darf keine Regelquelle oder automatische Effect-Quelle werden. | V092-T005 |
| M092-M1-EFFECT-003 | Kompatible Adapterstrategie | Bestehende Resolver dürfen in V0.93 über Adapter angebunden werden, solange äußeres Verhalten kompatibel bleibt. | V092-T006 |
| M092-M1-ABILITY-001 | Ability-Registry spezifizieren | M1 definiert Ability-Klassen für paid, triggered, static, setup und spätere interrupt/replacement-Kategorien. | V092-T007 |
| M092-M1-ABILITY-002 | Breaker-Pilot festlegen | Breaker Pump/Break werden in V0.93 intern als Ability-Pilot migriert; öffentliche Action Types bleiben kompatibel. | V092-T007 |
| M092-M1-TIMING-001 | Freigegebene Timingpunkte begrenzen | M1 nutzt nur explizit erlaubte Timingpunkte und führt keine vollständige offizielle Prioritätsmaschine ein. | V092-T008 |
| M092-M1-TIMING-002 | `applyAction` revalidiert Timing | Side, actionId, stateVersion, Timing, Kosten, Ziele und Choices bleiben server-/engineseitig erneut geprüft. | V092-T009 |
| M092-M1-CHOICE-001 | Choice-Grundlage spezifizieren | `pendingChoice`/ChoiceRequest wird additiv für spätere Mechaniken vorbereitet. | V092-T010 |
| M092-M1-CHOICE-002 | Keine neue Choice-Mechanik freischalten | Mulligan, Trace, Prevention, Multiaccess und vergleichbare Choice-Mechaniken bleiben in V0.93 nicht spielbar. | V092-T010 |
| M092-M1-VISIBILITY-001 | Eventklassifikation spezifizieren | M1 kennt `public`, `private_to_side`, `hidden_info_barrier` und `replay_only`. | V092-T011 |
| M092-M1-VISIBILITY-002 | Hidden-Info-Verträge erhalten | PlayerViews, PublicEvents, WebSocket, Reconnect, Undo, KI-Input, Fehler und Logs bleiben side-sicher. | V092-T012 |
| M092-M1-REPLAY-001 | Replay/StateHash schützen | Rebaselines sind nur bei dokumentierter State- oder Eventschema-Änderung erlaubt. | V092-T013 |
| M092-M1-AI-001 | KI bleibt LegalActions-only | Neue Ability-/Choice-Felder dürfen KI-Inputs nicht um FullState oder verdeckte Gegnerdaten erweitern. | V092-T014 |
| M092-M1-MP-001 | Multiplayer-Verträge bleiben kompatibel | WebSocket, Reconnect und Undo müssen optionale Choice-/Eventfelder side-sicher transportieren oder ignorieren. | V092-T015 |
| M092-M1-GATE-001 | V0.93-Freigabe | Requirements, Spec, Testmatrix, Review und Final Review liegen vor und ziehen keine V0.94+-Mechanik hinein. | V092-T016 |

## Should-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| M092-SHOULD-001 | Coverage automatisierbar halten | Spätere Gates können Mechanikstatus aus JSON statt aus Freitext ableiten. |
| M092-SHOULD-002 | Effect Commands klein starten | V0.93 beginnt mit Commands für bestehendes Verhalten statt mit vollständiger Regelpipeline. |
| M092-SHOULD-003 | Public Action API stabil halten | Eine generische `trigger_ability`-Action darf vorbereitet, aber nicht unnötig sichtbar erzwungen werden. |
| M092-SHOULD-004 | M2 sauber vorbereiten | Setup-/Game-End-Normalisierung wird in V0.93 nur spezifiziert. |

## Offene Entscheidungen

| ID | Entscheidung | Blockiert V0.92? | Blockiert V0.93? |
|---|---|---:|---:|
| M092-O-001 | Konkrete lokale Bildquellen und Dateinamen für V0.91 | nein | nein |
| M092-O-002 | Ob `trigger_ability` später öffentlich genutzt wird | nein | nein, solange bestehende Action Types bleiben |
| M092-O-003 | Ob M2 nach V0.93 direkt als V0.94 oder später kommt | nein | nein |

## Gate-Ergebnis

V0.92 ist implementierbar und gibt V0.93 frei. V0.93 darf M1 additiv umsetzen und M2 nur als Requirements planen.

`MVP_0.92_requirements_freeze_done: true`

`ready_for_MVP_0.93_implementation: true`
