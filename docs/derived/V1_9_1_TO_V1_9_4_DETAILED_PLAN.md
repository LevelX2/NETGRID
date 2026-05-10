# V1.9.1 bis V1.9.4 Detailed Plan

Stand: 2026-05-10  
Status: requirements-gefroren (Planung, keine Umsetzung)

## Zweck

Dieses Dokument legt die verbindliche Sequenz `V1.9.1 -> V1.9.2 -> V1.9.3 -> V1.9.4` für die optionale V1.9.x-Anschlusslinie fest.  
Jeder Release wird einzeln umgesetzt, vollständig verifiziert und erst nach expliziter Freigabe für den Folgerelease fortgesetzt.

## Verbindliche Eingaben

- `docs/codex/CODEX_STATUS.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/derived/V1_9_1_TO_V1_9_8_OPEN_POINTS_GROBPLAN.md`
- `docs/derived/V1_9_0_FINAL_REVIEW.md`
- `docs/derived/V1_9_0_RELEASE_ASSIGNMENT_PREFLIGHT.md`

## Harte Leitplanken

1. Keine Scope-Erweiterung Richtung V2.x.
2. Engine-Korrektheit zuerst.
3. Hidden-Info-Schutz ist Gate, kein Optionalpunkt.
4. Replay/StateHash-Determinismus ist Pflicht.
5. UI/Server/KI reichen nur LegalActions ein; `applyAction` bleibt End-Validator.
6. Nach jedem Release vollständiger Stopp mit explizitem Freigabe-Gate.

## Release-Reihenfolge (verbindlich)

1. V1.9.1: Deferred-Überhang aus V1.9.0 auflösen (`Cockroach`, `Incubator`, `Grubb`) als Mechanikpaket J.
2. V1.9.2: Hidden-Zone-/Access-/Run-Kern erweitern als Mechanikpaket K.
3. V1.9.3: Trace-/Tag-/Resource-/Action-Fenster konsolidieren als Mechanikpaket L.
4. V1.9.4: Damage-/Prevention-/Core-Erweiterungen vervollständigen als Mechanikpaket M.

## Pflichtartefakte pro Release

Pro Release sind mindestens folgende Artefakte verpflichtend:

- Requirements (`V1_9_x_REQUIREMENTS.md`)
- Spezifikation (`MECHANIKPAKET_<J|K|L|M>_1_9_x_SPEC.md`)
- Testmatrix (`V1_9_x_TEST_MATRIX.md`)
- Requirements Review (`V1_9_x_REQUIREMENTS_REVIEW.md`)
- Release-Preflight (`V1_9_x_RELEASE_ASSIGNMENT_PREFLIGHT.md`)
- Implementation Review (`V1_9_x_IMPLEMENTATION_REVIEW.md`)
- Final Review (`V1_9_x_FINAL_REVIEW.md`)
- Manifest/Mechanik-Coverage/Szenario unter `data/`

## Detailzuschnitt V1.9.1

Ziel: kontrollierte Schließung des expliziten Deferred-Überhangs aus V1.9.0.

Kernkorb:

1. `onr_v1_013_cockroach`
2. `onr_v1_034_incubator`
3. `onr_v1_030_grubb`

Mechanikfokus:

- deterministic random/discard-Umleitung für HQ-Discards bei aktivem Cockroach-Schwellenwert
- Start-of-turn-Multiroll und deterministischer Choice-Resolver für Incubator-Counter-Transformation
- remainder-of-run-breaker-stärke für Grubb ohne globale Breaker-Regression

No-Scope in V1.9.1:

- keine zusätzlichen Kartenfreigaben außerhalb des 3er-Kernkorbs
- keine neuen V2.x-Produktfeatures
- kein automatisches `ai_supported` für neue Karten

## Detailzuschnitt V1.9.2 bis V1.9.4

Diese drei Releases bleiben bis zum jeweiligen Freigabe-Gate planungsseitig eingefroren, aber nicht umgesetzt.  
Der konkrete Kartenkorb wird pro Release erst im jeweiligen `RELEASE_ASSIGNMENT_PREFLIGHT` final als `freigabefähig`/`deferred` geschnitten.

## Gate-Modell zwischen Releases

1. Nach V1.9.1: nur bei explizitem `OK V1.9.2` Start von V1.9.2.
2. Nach V1.9.2: nur bei explizitem `OK V1.9.3` Start von V1.9.3.
3. Nach V1.9.3: nur bei explizitem `OK V1.9.4` Start von V1.9.4.
4. Nach V1.9.4: Abschlussbericht mit Restpunkten und Eingangsliste V1.9.5.

## Risiko- und Stopregister

| Risiko-ID | Risiko | Gegenmaßnahme | Stop-Kriterium |
| --- | --- | --- | --- |
| R-191-SEQ-001 | Scope-Drift in V2.x | harte No-Scope-Gates je Release | Artefakt oder Code außerhalb V1.9.x-Kernlinie |
| R-191-SEQ-002 | Hidden-Info-Leak in Choice-/Discard-Pfaden | side-sichere Payload-/PlayerView-Tests | Leak in PublicEvents, Reconnect, Logs |
| R-191-SEQ-003 | RNG-/Replay-Drift | purpose-gebundene RandomRecords + Replay-Tests | gleicher Seed erzeugt unterschiedliche StateHashes |
| R-191-SEQ-004 | ungeklärte Folgefreigabe | explizites Gate pro Release | fehlendes `OK V1.9.x` |

## Ergebnis dieses Planungsdokuments

Die V1.9.1-bis-V1.9.4-Sequenz ist als strikt gate-gesteuerter Umsetzungsplan fixiert.  
V1.9.1 ist als erster, vollständig konkretisierter Implementierungsschritt freigegeben; V1.9.2 bis V1.9.4 bleiben bis zu ihren jeweiligen Freigaben eingefroren.
