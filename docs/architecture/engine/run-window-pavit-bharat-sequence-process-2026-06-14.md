# Run Window Pavit Bharat Sequence Process

Status: implementation_preflight

Quelle/Vorgabe: Nutzerauftrag vom 2026-06-14 auf Basis des Textfile-Status `engine/run-window-pavit-bharat-sequence`.

## Zielprüfung

Der aktuelle `main`-Stand hatte bereits wesentliche Vorarbeiten aus `run-window-sequence-foundation-followup-process-2026-06-13.md`: `run_window_sequence` als Surface-Familie, `game/run/windows/after-passing-last-ice-window.ts`, Pavit-Basisregressionen und eine erste Run-Window-Registry. Dieser Folgeprozess wiederholt diese erledigten Teile nicht, sondern härtet den Struktur- und Payload-Schnitt:

- `run-rez-window.ts` soll weiter Orchestrator werden und keine zentrale Typ-/Registry-Ablage bleiben.
- Die Run-Window-Registry liegt im `game/run/windows`-Bereich.
- Das After-Last-ICE-Fenster verlangt den echten `run.jack_out_window`-Timingpunkt.
- Pavit Bharat schreibt öffentliche Sequenzpayloads über einen `run_window_sequence`-Payload-Patch.
- HQ-Auswahl-IDs bleiben actor-private Choice-Daten und werden nicht als freies LegalAction-Payload-Feld weitergetragen.

## Nicht-Ziele

- Keine neue KI-Wirkung, keine Planner-Gewichtung, keine AI-Freigabe.
- Keine neue LegalAction-Erzeugung außerhalb der Engine.
- Keine breite Run-/Encounter-DSL.
- Keine Kartenpool-, Decklegal-, Replay-, StateHash- oder Randomness-Vertragsänderung.
- Keine offiziellen Assets oder externen Kartendaten-Abhängigkeiten.

## Paketabbildung

| Paket                                                               | Ergebnis                                                                                                                                                                                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1 RunWindowHost und RunWindowResult herausziehen                   | `RunRezWindowHost`, `RunRezWindowResult` und die Root-/SpeedTrap-Result-Typen liegen in `packages/engine/src/game/run/windows/run-window-host.ts`; `run-rez-window.ts` re-exportiert nur noch.                                 |
| P2 RunWindowRegistry verschieben und typisieren                     | `run-window-registry.ts` und der Registry-Test liegen unter `packages/engine/src/game/run/windows/`; Resolver-IDs und Window-Zuordnung bleiben explizit getestet.                                                              |
| P3 AfterPassingLastIceWindow modellieren                            | `afterPassingLastIceWindowContext(...)` prüft zusätzlich `run.jack_out_window`; der Test schließt falsche Timingpunkte aus.                                                                                                    |
| P4 Pavit CardImplementation an ordered_fort_rebuild_sequence binden | Bestehende Pavit-CardImplementation bleibt der schmale On-Rez-Vertical-Slice mit `replace_source_fort_cards_from_hq` und `ordered_fort_rebuild_sequence`.                                                                      |
| P5 Pavit LegalAction nur im korrekten Fenster                       | Pavit-Rez-LegalActions bleiben nur lösbar, wenn der Runner nach dem letzten ICE im Jack-out-Fenster am Source-Fort steht; falscher Timingpunkt ist regressionsgetestet.                                                        |
| P6 Actor-private HQ-Auswahl gleicher Anzahl                         | Bestehende hidden-info-barrier Choice bleibt aktiv; Anzahl und Duplikate werden revalidiert.                                                                                                                                   |
| P7 Fort-Karten nach HQ, Replacement ins gleiche Fort                | Bestehender Runtime-Pfad bleibt: Root und ICE werden nach HQ zurückgeführt, legale HQ-Karten frei ins gleiche Fort installiert.                                                                                                |
| P8 Payload nur über PayloadPatch + SurfacePolicy-Familie            | Öffentliche Pavit-Sequenzpayloads laufen über `applyRunWindowPayloadPatch(...)` mit `run_window_sequence`; ausgewählte HQ-IDs werden nicht mehr als `fortReplacementHqCardIds` in den finalen LegalAction-Payload geschrieben. |
| P9 Contract-Matrix erweitern                                        | Run-Window-Registry-Test und dieses Artefakt dokumentieren Resolver, Fenster, Sequenzart, Sichtbarkeit und harte Hidden-Info-Grenzen.                                                                                          |
| P10 Checks ausführen und rote Tests beheben                         | Fokussierte Engine-Typecheck- und Vitest-Läufe sind im Abschluss zu dokumentieren; finale Vollverifikation folgt vor Merge.                                                                                                    |

## Contract-Matrix

| Contract                        | Einstieg                           | Timing                                                              | Actor-private Daten                     | Public/Opponent/Replay Payload                                                 |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| `corp_root_rez_window`          | `RUN_WINDOW_ACTION_RESOLVERS`      | Run-Approach oder Root-Rez-Fenster je Resolver                      | keine neuen Hidden-Zone-Listen          | nur Resolver-Payloads, SurfacePolicy-Grenzen je Sequenz                        |
| `corp_fort_pass_window`         | `RUN_WINDOW_ACTION_RESOLVERS`      | `run.jack_out_window` nach letztem ICE                              | keine neuen Hidden-Zone-Listen          | Server, Counts, öffentliche Definitionen                                       |
| `after_passing_last_ice`        | `afterPassingLastIceWindowContext` | `run.jack_out_window`, Position `server`, `lastPassedIceId` im Fort | keine                                   | Serverkontext ohne Kartenlisten                                                |
| `ordered_fort_rebuild_sequence` | Pavit Bharat `on_rez`              | Source-Fort, nach letztem ICE, im Jack-out-Fenster                  | HQ-Auswahl bleibt Choice-/Actor-private | `hiddenZoneAction`, SourceDefinitionId, ServerId und Counts; keine HQ-Card-IDs |

## Abschlusskriterien

- Engine-Typecheck grün.
- Fokussierte RunWindow-/Pavit-Tests grün.
- `git diff --check` und `format:changed -- main` grün.
- Finaler Paketlauf verifiziert, lokal nach `main` integriert, Worktree entfernt und Wissensbasis aktualisiert.
