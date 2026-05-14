# V1.9.11 Detailed Plan - Hidden-Zone Search, Reveal, Reorder und Shuffle

Status: ready_for_implementation
Stand: 2026-05-12
Primärer Agent: release-implementation-agent

## Scope Freeze

V1.9.11 bearbeitet ausschließlich die Hidden-Zone-Familie für genau diese 16 Karten:

| Karte | ID | Seite | Typ | Primärer Pfad |
| --- | --- | --- | --- | --- |
| Mouse | `onr_v1_042_mouse` | Runner | Program | installierter Reveal-/Expose-Helfer |
| SeeYa | `onr_v1_058_seeya` | Runner | Program | installierter Reveal-/Expose-Helfer |
| Self-Modifying Code | `onr_v1_059_self-modifying-code` | Runner | Program | Stack-Search mit Reveal und Shuffle |
| Forgotten Backup Chip | `onr_v1_087_forgotten-backup-chip` | Runner | Event | Heap-/Stack-Search-Tool |
| Fortress Respecification | `onr_v1_088_fortress-respecification` | Runner | Event | Server-/Fort-Reveal/Expose |
| Gideon's Pawnshop | `onr_v1_089_gideons-pawnshop` | Runner | Event | Hidden-Zone-Auswahl mit Shuffle |
| Ice and Data's Guide to the Net | `onr_v1_092_ice-and-datas-guide-to-the-net` | Runner | Event | Reveal-/Look-Pfad |
| Mantis, Fixer-at-Large | `onr_v1_099_mantis-fixer-at-large` | Runner | Event | Search-/Reveal-Pfad |
| Sneak Preview | `onr_v1_110_sneak-preview` | Runner | Event | Reveal-/Preview-Pfad |
| Aujourd'Oui | `onr_v1_151_aujourdoui` | Runner | Resource | installierter Search-/Reveal-Helfer |
| N.E.T.O. | `onr_v1_169_n-e-t-o` | Runner | Resource | installierter Hidden-Zone-Helfer |
| Ronin Around | `onr_v1_175_ronin-around` | Runner | Resource | installierter Look-/Reorder-Helfer |
| The Short Circuit | `onr_v1_177_the-short-circuit` | Runner | Resource | installierter Reveal-/Search-Helfer |
| Corporate Downsizing | `onr_v1_194_corporate-downsizing` | Corp | Agenda | scored-agenda Hidden-Zone-Tool |
| Ice Pick Willie | `onr_v1_250_ice-pick-willie` | Corp | ICE | subroutinegebundener Search-/Reveal-Effekt |
| Too Many Doors | `onr_v1_272_too-many-doors` | Corp | ICE | subroutinegebundener Reveal-/Reorder-Effekt |

Keine V1.9.12+-Karte, keine Counter-/Trace-/Damage-/Run-Flow-Erweiterung und keine pauschale O:NR-v1-Freigabe ist Teil dieses Releases.

## Zielbild

Die Engine stellt eine wiederverwendbare Hidden-Zone-Resolverfamilie bereit, die Stack/R&D/HQ/Archive/Heap/Search-/Reveal-/Reorder-/Shuffle-Fälle über LegalActions oder PendingChoices abwickelt. Der jeweils gegnerische PlayerView sieht nur öffentlich erlaubte Zusammenfassungen; private Optionen und Kartenidentitäten bleiben side-sicher.

## Umsetzungsschnitt

1. Bestehende V0.98-Pfade (`v098.search_stack`, `v098.arrange_stack_top2`, Reveal/Expose) zu einer wiederverwendbaren ONR-v1-Familie erweitern, ohne den V0.98-Vertrag zu brechen.
2. Kartenadapter pro Zielkarte ergänzen. Karten dürfen erst `playable_mvp` werden, wenn der Adapter real testbar ist.
3. LegalAction-/applyAction-Verträge für alle neuen Targets und Choices ergänzen: Side, actionId, stateVersion, Timingpunkt, Kosten und Choice-Auswahl werden erneut validiert.
4. PlayerView/PublicEvent/Replay redigieren: öffentliche Payloads enthalten Mengen, Zonentypen und erlaubte Titel nur bei echtem Reveal/Expose.
5. KI-Hints und KI-Fallbacks ergänzen: KI darf Hidden-Zone-Choices nur aus der eigenen PlayerView, sichtbaren Optionen und bestehenden LegalActions beantworten.
6. Manifest, Mechanics-Coverage, Szenario- und AI-Smoke-Artefakte für genau die 16 Karten aktualisieren.

## Gate-Kriterien

- Alle 16 Karten sind über Engine-/Catalog-/Manifest-/AI-Artefakte konsistent.
- Jede neue Choice ist side-sicher und stale-action-resistent.
- Search/Reorder/Shuffle invalidieren bekannte Positionsannahmen deterministisch.
- Replay und StateHash sind nach Choice-Auflösung reproduzierbar.
- Keine verdeckte gegnerische Karte erscheint in PlayerViews, PublicEvents, WebSocket-/Reconnect-Payloads, Undo-Previews, KI-Inputs, öffentlichen Replays, Logs oder Client-Fehlern.
- `corepack pnpm --filter @netgrid/engine test`, `@netgrid/ai`, `@netgrid/catalog`, `@netgrid/web`, `@netgrid/server`, `typecheck`, `test`, `lint` und `build` sind für den Releaseabschluss dokumentiert.

## Risiken

| Risiko | Gegenmaßnahme |
| --- | --- |
| Search-Choices zeigen gegnerische Hidden-Zone-Karten. | Choice-Visibility `hidden_info_barrier`; Optionen nur für die berechtigte Side; PublicPayload zählt statt benennt. |
| Reorder/Shuffle bricht Replay oder KI-Memory. | Deterministische Shuffle-Labels und explizite Known-Position-Invalidation in Tests. |
| Installierte Helferkarten werden durch bloße Datenaufnahme spielbar. | Kein Status-Promotion ohne Resolver, Tests, AI-Hints und SzenarioRefs. |
| Scope wächst in V1.9.12+-Mechaniken hinein. | Karten mit zusätzlichem Counter/Trace/Damage-Bedarf bleiben deferred oder erhalten nur den Hidden-Zone-Teil, wenn das ohne falsche Spielbarkeit möglich ist. |

## Abschlussentscheidung

V1.9.11 ist mit diesem Plan umsetzungsbereit, aber noch nicht implementiert. Der Cursor bleibt bis zum Completion-Gate auf V1.9.11.
