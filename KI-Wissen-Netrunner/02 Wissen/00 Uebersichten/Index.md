# Index

## Einstieg

- [[Projektueberblick]]: Zielbild, Scope, Architekturgrundsätze und MVP-Phasen.
- [[Aktueller Projektstatus]]: aktueller Stand von Workspace, Setup, Quellen und offenen Punkten.
- [[Quellenlage und Aktualitaet]]: vorhandene, fehlende und ergänzende Projektquellen.
- [[Roadmap nach MVP 0.2]]: konsolidierte Roadmap ab V0.3 und Begründung der KI-/Simulationsphase.
- [[Roadmap nach MVP 0.4]]: produktnähere Folge-Roadmap mit Kartenimport, Deckeditor, UI-Schnitt in V0.7, Basisset-Spielbarkeit, besserer KI und V0.91-Kartenbild-Asset-Gate.
- S01: Sonderphase für Spielende, Ergebnisfenster, Spielziel, private Matchserie und Audio; Repository-Artefakte unter `docs/derived/S01_*.md`.
- [[../Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen]]: Workflow für wiki-first Arbeit und Rückführung von Erkenntnissen.

## Kernwissen

- [[Projektueberblick]]: verdichtetes Projektbild für neue Threads.
- [[Quellenlage und Aktualitaet]]: Quellenpriorität und bekannte Lücken.
- [[Roadmap nach MVP 0.2]]: Folgephasen, V0.3-Scope und aktuelle Planungsentscheidung.
- [[Roadmap nach MVP 0.4]]: aktuelle Folgephasen nach abgeschlossenem MVP 0.4.

## Prozesse

- [[../Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen]]: Standardablauf für Projektarbeit, Quellenprüfung und Wissenspflege.

## Betrieb

- [[../../03 Betrieb/Log]]
- [[../../03 Betrieb/Qualitaetspruefung]]

## Wichtige Repository-Dateien

- `AGENTS.md`: verbindliche Codex-Regeln für das Repository.
- `docs/codex/CODEX_STATUS.md`: aktueller Codex-Setup- und Phasenstand.
- `docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md`: Codex-Runbook für Setup, MVP 0.1 und MVP 0.2.
- `docs/derived/MVP_0.9_DETAILED_PLAN.md`: detaillierte spätere V0.9-Planung für bessere KI nach V0.8.
- `docs/derived/MVP_0.91_DETAILED_PLAN.md`: detaillierte spätere V0.91-Planung für Kartenbild-Asset-Gate und Bild-Import nach V0.9.
- `docs/derived/MVP_0.91_REQUIREMENTS.md`: eingefrorene V0.91-Anforderungen; private lokale Scan-/Asset-Nutzung ist nur als Anzeige-Artefakt erlaubt.
- `docs/derived/CARD_IMAGE_ASSET_GATE_0.91_SPEC.md`: Quellen-, Nutzungs- und Asset-Policy-Grenzen für Kartenbilder.
- `docs/derived/MVP_0.92_REQUIREMENTS.md`: eingefrorene V0.92-Anforderungen für Mechanik-Inventar und M1-Gate.
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`: normalisierte Mechanik-Coverage nach V0.99.
- `docs/derived/MECHANIC_M1_EFFECT_TIMING_SPEC.md`: Spezifikation für V0.93 Effects, Abilities, Timing, Choices und Eventklassifikation.
- `docs/derived/MVP_0.93_REQUIREMENTS.md`: umgesetzte V0.93-Anforderungen für das M1-Engine-Fundament und M2 als Requirements-only Scope.
- `docs/derived/SETUP_GAME_END_0.93_SPEC.md`: M2-Spezifikation für Setup, Mulligan, Siegwerte, Deckout/Flatline-Vorbereitung, Identity Setup und Archives/facedown.
- `docs/derived/MVP_0.93_FINAL_REVIEW.md`: Final Review für V0.93 mit Checkliste, Grenzen und Gate-Ergebnis.
- `docs/derived/MVP_0.94_0.95_ASSUMPTION_REVIEW.md`: Annahmenprüfung und Reihenfolgeentscheidung für Damage/Flatline und Resources.
- `docs/derived/MVP_0.94_DETAILED_PLAN.md`: detaillierte Planung für V0.94 Damage und Flatline.
- `docs/derived/MVP_0.94_REQUIREMENTS.md`: eingefrorene V0.94-Anforderungen für Damage und Flatline.
- `docs/derived/DAMAGE_FLATLINE_0.94_SPEC.md`: V0.94-Spezifikation für Damage, Random Grip-Trash, Flatline und Sichtbarkeit.
- `docs/derived/MVP_0.94_TEST_MATRIX.md`: V0.94-Testmatrix für Damage/Flatline.
- `docs/derived/MVP_0.94_REQUIREMENTS_REVIEW.md`: Requirements Review und Implementierungsfreigabe für V0.94.
- `docs/derived/MVP_0.94_IMPLEMENTATION_REVIEW.md`: Implementation Review für den umgesetzten V0.94-Damage-/Flatline-Slice.
- `docs/derived/MVP_0.94_FINAL_REVIEW.md`: Final Review und Gate-Ergebnis für V0.94.
- `data/rules/mechanics-coverage-0.94.json`: maschinenlesbare Coverage nach V0.94; Damage/Flatline ist `implemented_limited`, V0.95+-Mechaniken bleiben offen.
- `docs/derived/MVP_0.95_DETAILED_PLAN.md`: detaillierte Planung für V0.95 Resources und Tag-Interaktion.
- `docs/derived/MVP_0.95_REQUIREMENTS.md`: eingefrorene V0.95-Anforderungen für Runner-Resources und tag-basiertes Resource-Trash.
- `docs/derived/RESOURCE_TAG_INTERACTION_0.95_SPEC.md`: V0.95-Spezifikation für Resource-Install, Corp-Resource-Trash, Sichtbarkeit, Events und No-Scope-Grenzen.
- `docs/derived/MVP_0.95_TEST_MATRIX.md`: V0.95-Testmatrix für Requirements, Engine, Visibility, Replay/StateHash, AI und Multiplayer-Smokes.
- `docs/derived/MVP_0.95_REQUIREMENTS_REVIEW.md`: Requirements Review und Implementierungsfreigabe für V0.95.
- `docs/derived/MVP_0.95_IMPLEMENTATION_REVIEW.md`: Implementation Review für den umgesetzten V0.95-Resource-/Tag-Slice.
- `docs/derived/MVP_0.95_FINAL_REVIEW.md`: Final Review und Gate-Ergebnis für V0.95.
- `data/rules/mechanics-coverage-0.95.json`: maschinenlesbare Coverage nach V0.95; Resources sind `implemented_limited`, V0.96+-Mechaniken bleiben offen.
- `docs/derived/MVP_0.96_REQUIREMENTS.md`: eingefrorene V0.96-Anforderungen für Trace, Link und Bidding.
- `docs/derived/TRACE_LINK_BIDDING_0.96_SPEC.md`: V0.96-Spezifikation für Trace-Start, Corp-Bid, Runner-Bid, Ergebnis, Sichtbarkeit und No-Scope-Grenzen.
- `docs/derived/MVP_0.96_TEST_MATRIX.md`: V0.96-Testmatrix für Requirements, Engine, Visibility, Replay/StateHash, AI und Multiplayer-Smokes.
- `docs/derived/MVP_0.96_REQUIREMENTS_REVIEW.md`: Requirements Review und Implementierungsfreigabe für V0.96.
- `docs/derived/MVP_0.96_IMPLEMENTATION_REVIEW.md`: Implementation Review für den umgesetzten V0.96-Trace-/Link-/Bidding-Slice.
- `docs/derived/MVP_0.96_FINAL_REVIEW.md`: Final Review und Gate-Ergebnis für V0.96.
- `data/rules/mechanics-coverage-0.96.json`: maschinenlesbare Coverage nach V0.96; Trace/Link/Bidding ist `implemented_limited`, V0.97+-Mechaniken bleiben offen.
- `docs/derived/MVP_0.97_REQUIREMENTS.md`: eingefrorene V0.97-Anforderungen für Run, Jack-out, Breach und Multiaccess.
- `docs/derived/RUN_BREACH_MULTIACCESS_0.97_SPEC.md`: V0.97-Spezifikation für Jack-out-Fenster, Breach-State, Access-Queue und Multiaccess-Sichtbarkeit.
- `docs/derived/MVP_0.97_TEST_MATRIX.md`: V0.97-Testmatrix für Requirements, Engine, Visibility, Replay/StateHash, AI und Multiplayer-Smokes.
- `docs/derived/MVP_0.97_REQUIREMENTS_REVIEW.md`: Requirements Review und Implementierungsfreigabe für V0.97.
- `docs/derived/MVP_0.97_IMPLEMENTATION_REVIEW.md`: Implementation Review für den umgesetzten V0.97-Run-/Breach-/Multiaccess-Slice.
- `docs/derived/MVP_0.97_FINAL_REVIEW.md`: Final Review und Gate-Ergebnis für V0.97.
- `data/rules/mechanics-coverage-0.97.json`: maschinenlesbare Coverage nach V0.97; Run/Jack-out/Breach/Multiaccess ist `implemented_limited`, V0.98+-Mechaniken bleiben offen.
- `docs/derived/MVP_0.98_REQUIREMENTS.md`: eingefrorene V0.98-Anforderungen für Identity/Modifier und Hidden-Zone-Tools.
- `docs/derived/IDENTITY_MODIFIERS_0.98_SPEC.md`: V0.98a-Spezifikation für Identity-Fähigkeiten, Setup-Marker und statische Modifier.
- `docs/derived/HIDDEN_ZONE_TOOLS_0.98_SPEC.md`: V0.98b-Spezifikation für Search, Reveal, Expose, Arrange, Shuffle und Swap.
- `docs/derived/MVP_0.98_TEST_MATRIX.md`: V0.98-Testmatrix für Identity-, Hidden-Zone-, Visibility-, Replay/StateHash-, AI- und Multiplayer-Smokes.
- `docs/derived/MVP_0.98_REQUIREMENTS_REVIEW.md`: Requirements Review und Implementierungsfreigabe für V0.98a.
- `docs/derived/MVP_0.98_IMPLEMENTATION_REVIEW.md`: Implementation Review für den umgesetzten V0.98-Identity-/Hidden-Zone-Slice.
- `docs/derived/MVP_0.98_FINAL_REVIEW.md`: Final Review und Gate-Ergebnis für V0.98.
- `data/rules/mechanics-coverage-0.98.json`: maschinenlesbare Coverage nach V0.98; Identity/Modifier und Hidden-Zone-Tools sind `implemented_limited`, V0.99 war zu diesem Zeitpunkt noch offen.
- `docs/derived/MVP_0.99_REQUIREMENTS.md`: eingefrorene V0.99-Anforderungen für Counter, Hosting, Viren, Purge, Recurring Credits und Bad Publicity.
- `docs/derived/COUNTER_HOSTING_0.99_SPEC.md`: V0.99a/b-Spezifikation für Counter-Felder, `hostedOn`, Hosting-Choice, Host-Trash-Kaskade und Sichtbarkeit.
- `docs/derived/VIRUS_PURGE_0.99_SPEC.md`: V0.99c-Spezifikation für Virus-Counter und Corp-`purge_virus_counters`.
- `docs/derived/RECURRING_BAD_PUBLICITY_0.99_SPEC.md`: V0.99d-Spezifikation für Recurring Credits und Bad Publicity.
- `docs/derived/MVP_0.99_TEST_MATRIX.md`: V0.99-Testmatrix für Requirements, Engine, Visibility, Replay/StateHash, AI und Multiplayer-Smokes.
- `docs/derived/MVP_0.99_REQUIREMENTS_REVIEW.md`: Requirements Review und Implementierungsfreigabe für V0.99a bis V0.99d.
- `docs/derived/MVP_0.99_IMPLEMENTATION_REVIEW.md`: Implementation Review für den umgesetzten V0.99-Hosting-/Counter-Slice.
- `docs/derived/MVP_0.99_FINAL_REVIEW.md`: Final Review und Gate-Ergebnis für V0.99.
- `data/rules/mechanics-coverage-0.99.json`: maschinenlesbare Coverage nach V0.99; Hosting, Viren, Purge, Counter-Familien, Recurring Credits und Bad Publicity sind `implemented_limited`, M11+-Mechaniken bleiben offen.
- `docs/derived/S01_REQUIREMENTS.md`: eingefrorene S01-Anforderungen für Ergebnisfenster, sichere Statistik, Spielziel-Auswahl, private Matchserie und Audio.
- `docs/derived/S01_MATCH_SERIES_SPEC.md`: Spezifikation der privaten Zwei-Spiel-Serie mit Seitenwechsel.
