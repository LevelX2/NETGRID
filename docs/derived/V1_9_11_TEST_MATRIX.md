# V1.9.11 Test Matrix - Hidden-Zone Search, Reveal, Reorder und Shuffle

Status: frozen
Stand: 2026-05-12

## Scope

Die Matrix deckt die 16 V1.9.11-Karten aus dem Detailplan und die Resolverfamilie `hidden_zone_search_reveal_reorder_resolver` ab.

## Must Cases

| ID | Bereich | Erwartung | Nachweis |
| --- | --- | --- | --- |
| TC-1911-01 | Scope | Exakt 16 Zielkarten sind im Release-Set; keine zusätzliche Karte wird promotet. | `packages/catalog/src/index.test.ts` |
| TC-1911-02 | Stack Search | Runner-Search öffnet private Choice, bewegt gewählte Karte legal und shufflet deterministisch. | `packages/engine/src/index.test.ts` |
| TC-1911-02a | Trash Search | Gideon's Pawnshop durchsucht den Runner-Trash, bewegt genau eine Karte in die Hand, bietet sich nicht selbst an und shufflet den Stack nicht. | `packages/engine/src/index.test.ts` |
| TC-1911-03 | Reorder | Reorder-Choice ändert nur die berechtigte Zone und leakt keine Reihenfolge an die Gegenseite. | `packages/engine/src/index.test.ts` |
| TC-1911-04 | Reveal/Expose | Nur ein explizit revealter CardDefinition-Titel wird öffentlich; übrige Hidden-Zone-Daten bleiben verborgen. | `packages/engine/src/index.test.ts` |
| TC-1911-05 | Corp Hidden-Zone | Corp-seitiger Hidden-Zone-Pfad funktioniert ohne Runner-Leak. | `packages/engine/src/index.test.ts` |
| TC-1911-06 | Illegal/Stale | Falsche Side, alte stateVersion, falsche ChoiceId oder ungültige CardId wird abgelehnt. | `packages/engine/src/index.test.ts` |
| TC-1911-07 | Replay/StateHash | Choice-Auflösung und Shuffle replayen zum identischen StateHash. | `packages/engine/src/index.test.ts` |
| TC-1911-08 | PlayerView | PlayerViews enthalten keine verdeckten gegnerischen Karten-IDs/Titel/Reihenfolgen. | `tests/specs/visibility-contract.test.ts` |
| TC-1911-09 | Server/Reconnect | Reconnect- und WS-Payloads enthalten keine Hidden-Zone-Choice-Daten der Gegenseite. | `apps/server/src/multiplayer.test.ts` |
| TC-1911-10 | Web | Choice UI rendert nur die eigene PendingChoice und bleibt bei gegnerischer Choice abstrakt. | `apps/web/app/page.test.tsx` oder vorhandener Web-Test |
| TC-1911-11 | AI | KI beantwortet Search-/Reorder-Choices deterministisch aus sichtbaren LegalActions. | `packages/ai/src/index.test.ts` |
| TC-1911-12 | Data | Manifest, Mechanics-Coverage, Szenario- und AI-Hints-Artefakte sind JSON-valide und zielmengenkonsistent. | `packages/catalog/src/index.test.ts` |

## Pflichtbefehle für Releaseabschluss

- `v1-9-install-and-check.ps1 -Task catalog`
- `v1-9-install-and-check.ps1 -Task engine`
- `v1-9-install-and-check.ps1 -Task ai`
- `v1-9-install-and-check.ps1 -Task web`
- `v1-9-install-and-check.ps1 -Task server`
- `v1-9-install-and-check.ps1 -Task typecheck`
- `v1-9-install-and-check.ps1 -Task test`
- `v1-9-install-and-check.ps1 -Task lint`
- `v1-9-install-and-check.ps1 -Task build`

## Aktueller Lauf

Implementierung abgeschlossen. Alle Must Cases sind durch die genannten Testflächen oder gleichwertige Paket-/Workspace-Gates abgedeckt.

- Scope/Data: `catalog` grün mit 26 Tests; V1.9.11-Manifest, Coverage, Scenario und AI-Hints sind JSON-valide und zielmengenkonsistent.
- Engine/Replay/Visibility: `engine` grün mit 209 Tests; private Search-/Reorder-Choices, Reveal/Expose und StateHash-Replay sind abgedeckt.
- KI: `ai` grün mit 84 Tests; mehrteilige Reorder-Choices werden legal und side-sicher beantwortet.
- Web/Server: `web` grün mit 76 Tests, `server` grün mit 72 Tests.
- Workspace-Gates: `typecheck`, `test`, `lint` und `build` grün; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
