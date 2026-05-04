# MVP 0.94-0.99 Planning Review - M3 bis M10

Status: historischer Planungsreview, durch V0.94-V0.99 umgesetzt
Stand: 2026-05-04

Hinweis: Dieses Artefakt dokumentiert die Vorplanung vor den späteren Requirements-, Implementierungs- und Final-Reviews. Der aktuelle Umsetzungsstand ist in den jeweiligen V0.94- bis V0.99-Final-Reviews maßgeblich.

## Ergebnis

Die Detailplanung für M3 bis M10 ist vollständig genug, um spätere Requirements-Freeze-Threads versioniert zu starten. V0.94 und V0.95 lagen bereits als Detailpläne vor und bleiben gültig. V0.96 bis V0.99 wurden als neue Detailpläne ergänzt.

Wichtigste Entscheidung:

- V0.94 bleibt der nächste konkrete Requirements-Freeze, sofern die Reihenfolge nicht ausdrücklich geändert wird.
- V0.96 bis V0.99 dürfen noch nicht direkt implementiert werden. Sie sind Detailplanung für spätere gated Requirements und Implementierungsphasen.
- Jede Version muss vor Implementierung eigene Requirements, Spec, Testmatrix und Requirements Review erzeugen.

## Geprüfte Grundlage

- `docs/codex/CODEX_STATUS.md`
- `docs/derived/MECHANICS_COMPLETION_PLAN.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/mechanics-coverage-0.92.json`
- `docs/derived/MECHANIC_M1_EFFECT_TIMING_SPEC.md`
- `docs/derived/SETUP_GAME_END_0.93_SPEC.md`
- `docs/derived/MVP_0.93_FINAL_REVIEW.md`
- `docs/derived/MVP_0.94_0.95_ASSUMPTION_REVIEW.md`
- `docs/derived/MVP_0.94_DETAILED_PLAN.md`
- `docs/derived/MVP_0.95_DETAILED_PLAN.md`
- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`

## Versionsabdeckung

| Version | Phase | Planungsstatus | Kernmechaniken | Wichtigste Integration |
|---|---|---|---|---|
| V0.94 | M3 | vorhanden, geprüft | Damage, Flatline | RandomDrawRecords, Hidden-Info-Barriere, Game-End-Grund |
| V0.95 | M4 | vorhanden, geprüft | Resources, Tag-Resource-Trash | CardType/Rig, Tags, Public Board State |
| V0.96 | M5 | neu erstellt | Trace, Link, Bidding | `pendingChoice`, Credits, Tags, AI-Bid-Policy |
| V0.97 | M6 | neu erstellt | Jack-out, Breach, Multiaccess | RunState, AccessQueue, HQ/R&D/Archives-Visibility |
| V0.98 | M7/M8 | neu erstellt | Identity-Abilities, Modifiers, Search/Reveal/Expose/Arrange/Shuffle/Swap | Ability Registry, Modifier, Hidden-Zone-Choices |
| V0.99 | M9/M10 | neu erstellt | Hosting, Viren, Purge, Counter, Recurring Credits, Bad Publicity | CardInstance-Relationen, Counter-API, CostRequirement |

## Abdeckung gegen Mechanik-Coverage

| Coverage ID | Zielgate | Abdeckung |
|---|---|---|
| `mechanic.damage.flatline` | V0.94 | Damage/Flatline-Plan mit Randomness, Flatline, Undo, Replay, AI und Multiplayer. |
| `mechanic.resources` | V0.95 | Resource-/Tag-Interaktionsplan mit Kartentyp, Rig, Install, Trash und Manifest-Gate. |
| `mechanic.trace.link_bidding` | V0.96 | Neuer Trace-/Link-/Bidding-Plan mit Choice-Sequenz und Bid-Revalidierung. |
| `mechanic.runs.jackout_multiaccess_breach` | V0.97 | Neuer Run-/Breach-/Multiaccess-Plan mit AccessQueue und Hidden-Info-Barrieren. |
| `mechanic.identities.abilities` | V0.98a | Neuer Identity-/Modifier-Plan mit Setup, Static, Triggered und Usage-Markern. |
| `mechanic.hidden_zone_tools` | V0.98b | Neuer Search-/Reveal-/Expose-/Arrange-/Shuffle-/Swap-Plan mit side-sicheren Choices. |
| `mechanic.hosting.viruses.counters` | V0.99a-c | Neuer Counter-/Hosting-/Virus-/Purge-Plan mit Host-Invarianten. |
| M10 Spezialressourcen | V0.99d-e | Recurring Credits, Bad Publicity, Charge, Mark, Dividends und Spezialcounter geplant. |

Nicht abgedeckt in V0.94-V0.99 und bewusst später:

- `mechanic.event_modification`: Prevention, Avoid, Interrupts, Replacement bleiben M11.
- `mechanic.deckbuilding.formats`: Faction, Influence, Agenda-Dichte, Rotation bleiben M12.
- `mechanic.special_cases`: Set Aside, Remove from Game, Ownership/Control-Wechsel bleiben M13/V1.x.

## Integrationsprüfung

| Mechanismus | Bewertung | Konsequenz |
|---|---|---|
| LegalActions/PlayerActions | Alle Phasen planen Actions aus LegalActions; keine UI-Regelautorität. | In jedem Requirements-Freeze negative stale/side/target/cost Tests einplanen. |
| `applyAction` | Neue Mechaniken müssen Side, StateVersion, Kosten, Timing, Ziele und Choices erneut prüfen. | Testmatrix je Gate enthält Revalidierung. |
| `pendingChoice` | V0.96 und V0.98 nutzen die vorhandene Choice-Pipeline; V0.97 nur bei echter Choice. | Keine zweite Choice-Infrastruktur zulassen. |
| EffectCommand | V0.94-V0.99 bauen auf Commands oder gleichwertigen Engine-Helfern auf. | Vor Implementierung Command-Erweiterungen pro Gate einfrieren. |
| EventVisibilityClass | Damage, Access, Search/Arrange und Hosted Hidden Info sind explizite Hidden-Info-Risiken. | Jeder Plan enthält PublicEvent-/PlayerView-/WebSocket-/Reconnect-Gates. |
| RandomDrawRecords | Damage, HQ-Multiaccess und Shuffle brauchen deterministische Randomness. | Zweckstrings und StateHash-Szenarien verpflichtend. |
| AI Contract | Jede neue Mechanik muss LegalActions-only und side-sichere Reason-Codes bewahren. | AI-Smokes je Version, keine FullState-Abkürzung. |
| Manifest/Decklegalität | Import/Katalog/Assetstatus darf keine Spielbarkeit erzeugen. | Manifest-Gate je Version und Coverage-Abgleich vor Matchstart. |

## Testplanung quer über M3-M10

Jedes Gate braucht:

- Unit-Tests für Typen, Kosten, Timing, Side, Ziele und Invarianten.
- Szenario-Fixtures für Normalfall, illegalen Fall und Visibility-Fall.
- Replay/StateHash-Tests mit relevanten RandomDrawRecords.
- Visibility-Leaktests für PlayerViews, PublicEvents, WebSocket, Reconnect, Undo, Errors, Logs, AI-Input und UI-Diagnostics.
- AI-Smokes pro betroffener Entscheidungssituation.
- Multiplayer-Smokes für Submit, Idempotency, Stale Action, Reconnect und Undo-Barrieren.
- Build-/Workspace-Gates: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`.

Zusatz pro Version:

| Version | Spezielle Testpflicht |
|---|---|
| V0.94 | Random Grip-Trash, Flatline, Damage-Undo-Barriere. |
| V0.95 | Resource-Rig, tagbasierter Resource-Trash, Resource-Manifest-Gate. |
| V0.96 | Corp-/Runner-Bids, Link-Berechnung, Trace-Ergebnis, AI-Bid-Policy. |
| V0.97 | AccessQueue, R&D/HQ/Archives-Multiaccess, Jack-out-Timing, DOM/Payload-Leaktests. |
| V0.98 | Identity-Trigger/Modifier, Search/Arrange-Choice-Sicherheit, Shuffle-RandomRecords. |
| V0.99 | Counter-Invarianten, Host-Trash-Folge, Purge, Recurring-Credit-Revalidierung, Bad-Publicity-Verfall. |

## Historische offene Entscheidungen vor Requirements-Freeze

Diese Punkte blockierten nicht die Detailplanung. Sie wurden später in den jeweiligen Requirements- und Spezifikationsartefakten geklärt:

| Version | Entscheidung |
|---|---|
| V0.94 | Exakte Damage-/Flatline-Semantik und Sichtbarkeit getrashter Grip-Karten nach CR-Abgleich. |
| V0.95 | Exakte Corp-Basic-Action-Kosten für Resource-Trash und erste Resource-Testkarte. |
| V0.96 | Trace-Gleichstandsregel, Zeitpunkt öffentlicher Bid-Information und erste Trace-Folgeeffekte. |
| V0.97 | Jack-out-Fenster, Archives-facedown-Sichtbarkeit und Access-Queue-Darstellung in PlayerViews. |
| V0.98 | Welche Identity-Fähigkeiten als erste sichere Runner-/Corp-Piloten dienen und wie Expose sichtbar wird. |
| V0.99 | Host-Trash-Folgen, Counter-Sichtbarkeiten und ob Spezialcounter ohne konkrete Karten nur spezifiziert bleiben. |

## Historische Gate-Empfehlung

Empfohlene Reihenfolge vor der Umsetzung war:

1. V0.94 Requirements Freeze und Implementierung.
2. V0.95 Requirements Freeze und Implementierung.
3. V0.96 Requirements Freeze und Implementierung.
4. V0.97 Requirements Freeze und Implementierung.
5. V0.98a Identity/Modifier, danach V0.98b Hidden-Zone-Tools.
6. V0.99a Counter, V0.99b Hosting, V0.99c Virus/Purge, V0.99d Recurring/Bad Publicity, V0.99e Spezialcounter nur bei Kartenbedarf.

Die Reihenfolge wurde anschließend durch V0.94 bis V0.99 umgesetzt und final reviewed. Für neue Arbeit sind die Final-Reviews und die aktuelle Mechanik-Coverage maßgeblich.
