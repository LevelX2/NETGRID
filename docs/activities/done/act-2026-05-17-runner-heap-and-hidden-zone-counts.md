---
activityId: act-2026-05-17-runner-heap-and-hidden-zone-counts
status: done
kind: fix
area: ui
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/engine test -- -t "resolves net damage from a local sentry as hidden-info barrier without public grip leaks"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
---

# Runner-Ablagestapel und öffentliche Zonenzähler anzeigen

## Ziel

Der Runner-Ablagestapel (`Heap`) soll im Spielbrett sichtbar und einsehbar sein. Zusätzlich sollen öffentliche Zoneninformationen wie Runner-Handkartenzahl und Stack-/Heap-Zähler klar angezeigt werden, ohne verdeckte Karteninhalte zu leaken.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Im aktuellen Spiel ist der Runner-Ablagestapel nicht auffindbar. Sichtbar ist nur das Runner-Rig.
- Nutzerbefund: Die Anzahl der Runner-Handkarten ist ebenfalls nicht klar sichtbar.
- Regel-/Visibility-Erwartung: Der Runner-Heap ist ein offener Ablagestapel und darf jederzeit eingesehen werden. Die Runner-Grip-Inhalte bleiben verborgen, aber die Anzahl der Karten ist öffentliche Information.
- Das Fehlen dieser Elemente erschwert Spielverständnis, Run-/Trash-/Damage-Nachvollzug und KI-/Board-Review.

## Scope

- Prüfen, welche Runner-Zonen im `PlayerView` bereits enthalten sind: Rig, Grip-Zähler, Stack-Zähler, Heap-Karten.
- Runner-Heap im Board sichtbar machen, inklusive Kartenliste oder aufklappbarer Ansicht.
- Runner-Handkartenzahl (`Grip`) gut sichtbar anzeigen, ohne Karteninhalte preiszugeben.
- Stack-/Heap-Zähler prüfen und bei Bedarf ergänzen oder besser platzieren.
- Perspektiven prüfen: Runner- und Korp-Ansicht müssen dieselben öffentlichen Heap-Inhalte sehen; Grip-Inhalte bleiben nur dem Runner bekannt.
- Reconnect- und Spectator-/Replay-nahe Views gegen dieselbe Sichtbarkeitsregel prüfen, soweit vorhanden.

## Nicht im Scope

- Keine Änderung an Heap-/Grip-/Stack-Regeln in der Engine, außer fehlende öffentliche Daten fehlen tatsächlich im `PlayerView`.
- Keine Anzeige verdeckter Runner-Hand- oder Stack-Karten für die Korp.
- Keine Änderung an Damage-, Trash- oder Draw-Regeln.
- Kein Redesign des gesamten Boards.

## Akzeptanzkriterien

- [ ] Runner-Heap ist im Spielbrett sichtbar und einsehbar.
- [ ] Karten im Runner-Heap werden beiden Seiten öffentlich korrekt angezeigt.
- [ ] Runner-Grip-Inhalt bleibt für die Korp verborgen.
- [ ] Runner-Handkartenzahl ist sichtbar.
- [ ] Stack-/Heap-Zähler sind geprüft und bei Bedarf sichtbar ergänzt.
- [ ] Reconnect-Ansichten zeigen dieselben öffentlichen Zoneninformationen.
- [ ] Hidden-Info-Tests oder Web-/Visibility-Regressionen decken Heap-Sichtbarkeit und Grip-Redaction ab.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind `getPlayerView`/Visible-Zonen im Engine-/Shared-Vertrag sowie die Board-Renderingpfade in `apps/web/app/page.tsx`.
- Falls `PlayerView` Heap-Karten bereits liefert, ist es primär ein Web-Rendering-/Layoutproblem.
- Falls `PlayerView` nur Counts liefert oder Heap fehlt, braucht es eine kleine Visibility-Vertragsergänzung mit Tests.
- UI-seitig kann der Heap ähnlich wie Archive-/Ablagestapel-Previews behandelt werden: kompakt im Board, bei Bedarf aufklappbar.

## Ergebnisnotiz

Erledigt. `PlayerView.opponent` liefert für die Korp-Sicht jetzt die öffentlichen Runner-Heap-Karten als `discardCards`, ohne Grip- oder Stack-Inhalte offenzulegen. Das Board zeigt in der Korp-Perspektive HQ, Runner-Grip-Zähler, Runner-Stack-Zähler und den einsehbaren Runner-Heap; die Runner-Perspektive bleibt unverändert. Der bestehende Hidden-Info-Test deckt nun ab, dass die getrashte Heap-Karte öffentlich sichtbar ist, die übrigen Grip-Karten aber redacted bleiben.
