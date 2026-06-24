# Web-UI-Stabilisierung und Strukturvervollständigung

Status: Paket 0 angelegt, Umsetzung läuft im Worktree `C:\Projekte\NETGRID_WEB_UI_STABILIZATION_STRUCTURE` auf Branch `codex/web-ui-stabilization-structure`.

Quelle: Nutzerauftrag vom 2026-06-24 mit direkter Ausführung über `$paketprozess-worktree-goal`.

## Ziel

Der Webclient soll wieder vollständig verifizierbar sein und danach nur dort strukturell weiter geschnitten werden, wo ein klarer, risikoarmer und behavior-preserving Nutzen vorliegt.

Finale Gates:

- `corepack pnpm --filter @netgrid/web typecheck`
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/web build`
- `git diff --check`
- keine neuen Importzyklen
- LegalAction-, Hidden-Info-, Replay-, Randomness- und StateHash-Grenzen bleiben unverändert

## Sicherheitsgrenzen

- Die Rules Engine bleibt einzige Regelautorität.
- Die UI zeigt und sendet nur vorhandene LegalActions.
- Keine verdeckten Kartendaten in PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads, Reconnect-Payloads, Undo-Previews, Replays, Logs oder Client-Fehlern.
- Keine Spielregel-, KI-, API-, Replay- oder StateHash-Änderung ohne zwingenden Vertragsgrund.
- Refactorings müssen behavior-preserving bleiben.
- Keine neue State-Management-Library, kein CSS-Framework-Wechsel, kein React-/Next-Framework-Wechsel.

## Ausgangsinventur

Git:

- Startbranch: `main`
- Start-HEAD: `ddcdd6dace8444df264e0bc35ea9fb1f67a16c8f`
- Arbeitsbranch: `codex/web-ui-stabilization-structure`
- Worktree: `C:\Projekte\NETGRID_WEB_UI_STABILIZATION_STRUCTURE`

Install:

- `corepack pnpm install --frozen-lockfile` erfolgreich.
- Hinweis von pnpm: Build-Scripts für `esbuild@0.27.7` und `sharp@0.34.5` wurden nicht automatisch ausgeführt.

Baseline-Checks:

- `corepack pnpm --filter @netgrid/web typecheck`: rot.
- `corepack pnpm --filter @netgrid/web test`: grün, 33 Dateien, 423 Tests.
- `corepack pnpm --filter @netgrid/web build`: rot nach erfolgreicher Compilation beim TypeScript-Schritt.
- `git diff --check`: grün.

Bekannte TypeScript-Fehler:

- `apps/web/app/action-board-ui.test.ts`: `data_raven` ist nicht Teil von `CounterType`.
- `apps/web/app/action-board-ui.test.ts`: `pattel_antibody` ist nicht Teil von `CounterType`.
- `apps/web/app/action-board-ui.ts`: `doppelganger_antibody` und `pattel_antibody` sind nicht mit `CounterType | undefined` vergleichbar.
- `apps/web/app/chronicle.ts`: `pattel_antibody` ist nicht mit `CounterType | undefined` vergleichbar.

Aktueller Shared-Vertrag:

- `CounterType` in `packages/shared/src/index.ts` enthält unter anderem `advancement`, `virus`, `cockroach`, `cascade`, `doom`, `crumble`, `garbage`, `highlighter`, `scaldan`, `tax`, `vienna`, `socket_archives`, `socket_hq`, `socket_rd`, `pipe`, `spy`, `mark`, `dividend`, `core_damage`, `shell`, `bit`.
- Die Werte `data_raven`, `doppelganger_antibody` und `pattel_antibody` fehlen im Shared-Vertrag, werden aber in Engine-/Runtime-/Web-Kontexten verwendet.

Größte UI-Dateien zu Beginn:

| Datei | Zeilen |
| --- | ---: |
| `apps/web/app/globals.css` | 11195 |
| `apps/web/app/page.tsx` | 4168 |
| `apps/web/app/action-board-ui.ts` | 1610 |
| `apps/web/features/debug/AiDecisionDebugOverlay.tsx` | 1319 |
| `apps/web/features/decks/DeckEditorPanel.tsx` | 1221 |
| `apps/web/features/catalog/CatalogPanel.tsx` | 484 |

## Paketfolge

1. Prozessartefakt und Ausgangsinventur.
2. `CounterType`-Vertrag für `data_raven`, `doppelganger_antibody`, `pattel_antibody` fachlich synchronisieren.
3. `DamageImpactOverlay`-Test auf aktuellen Modulort und Verhalten prüfen oder anpassen.
4. Baseline vollständig wiederherstellen.
5. Import-/Utility-Zielstruktur dokumentieren und kleine reine Helper zielgerichtet verschieben.
6. Session-Bootstrap und Match-Transport aus `page.tsx` lösen, sofern behavior-preserving möglich.
7. Catalog-Workspace-Controller aus `page.tsx` lösen, sofern behavior-preserving möglich.
8. Ersatzmonolithen nur bei konkretem Schnitt verbessern.
9. CSS-Domänenstruktur nur bei grünen Gates und niedrigem Kaskadenrisiko schneiden.
10. Abschlussbericht, Projektlog, finale Gates, Merge nach `main`, Worktree entfernen.

## Paketentscheidungen

### Paket 0

Entscheidung: Separater Worktree und Branch wurden erstellt. Die technische Baseline ist rot ausschließlich an der `CounterType`-Synchronisierung; die Web-Tests sind bereits grün. Das DamageImpactOverlay-Paket wird dennoch geprüft, weil die Vorgabe einen Strukturvertrag verlangt.

Checks:

- `corepack pnpm --filter @netgrid/web typecheck`: rot, CounterType-Vertrag.
- `corepack pnpm --filter @netgrid/web test`: grün.
- `corepack pnpm --filter @netgrid/web build`: rot, CounterType-Vertrag.
- `git diff --check`: grün.

### Paket 1

Entscheidung: Die drei roten Werte werden nicht als neue `CounterType`-Werte ergänzt. Die Engine und die CardImplementation-Verträge verwenden bereits kanonische Shared-Counter:

| Fachlicher Counter | Kanonischer `CounterType` | Produzent |
| --- | --- | --- |
| Data-Raven-Counter | `trace_tag_counter` | `packages/engine/src/card-implementations/onr-v1/corp/ice/data-raven.ts` |
| Doppelganger-Counter | `link_reduction_counter` | `packages/engine/src/card-implementations/proteus/corp/assets/doppelganger-antibody.ts` |
| Pattel-Counter | `breaker_strength_penalty` | `packages/engine/src/card-implementations/proteus/corp/assets/pattel-antibody.ts` |

Begründung:

- `data_raven`, `doppelganger_antibody` und `pattel_antibody` waren Web-/Chronicle-Alt- oder Anzeigenamen, aber keine aktuellen Shared-Vertragswerte.
- Die Engine erzeugt und serialisiert die kanonischen Werte bereits über LegalActions, ResolvedEffects und VisibleCard-CounterDisplays.
- Die sichtbaren UI-Labels bleiben kartenspezifisch: Data-Raven-Counter, Doppelganger-Counter und Pattel-Counter.
- `counterLabel` akzeptiert alte Strings weiterhin als robuste Legacy-Beschriftung, ohne den aktuellen `CounterType`-Vertrag zu erweitern.

Geänderte Bereiche:

- `apps/web/app/action-board-ui.ts`
- `apps/web/app/action-board-ui.test.ts`
- `apps/web/app/chronicle.ts`
- `apps/web/app/chronicle.test.ts`
- `apps/web/features/cards/CardBadges.tsx`
- `apps/web/features/chronicle/ChroniclePanel.tsx`

Checks:

- `corepack pnpm --filter @netgrid/web typecheck`: grün.
- `corepack pnpm --filter @netgrid/shared typecheck`: grün.
- `corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts chronicle.test.ts`: grün; wegen Vitest-Argumentübergabe lief die vollständige Web-Suite, 33 Dateien, 423 Tests.
- `corepack pnpm --filter @netgrid/engine test -- src/game/counters/proteus-antibody-access.test.ts src/index-tests/originalset/per-card-followups.test.ts src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts`: grün; wegen Vitest-Argumentübergabe lief die vollständige Engine-Suite, 173 Dateien, 1517 Tests.
- `corepack pnpm --filter @netgrid/web build`: grün.
- `git diff --check`: grün.

### Paket 2

Entscheidung: Der Test bleibt ein gezielter Source-Vertragstest, liest aber nicht mehr `page.tsx`. Er prüft ausschließlich die aktuelle Feature-Datei `apps/web/features/actions/DamageImpactOverlay.tsx`.

Begründung:

- Für dieses Paket wurde keine neue Render-Test-Infrastruktur eingeführt.
- Der alte Root-Dateipfad war als Architekturvertrag ungeeignet, weil `DamageImpactOverlay` bereits ausgelagert ist.
- Die geprüften Verträge sind weiterhin behavior-orientiert: manuelle Bestätigung, keine Auto-Dismiss-Quelle, Null-Linie, Overkill, Prevented-State ohne Meter, Queue-Hinweis, Flatline- und Core-Damage-Copy.

Checks:

- `corepack pnpm --filter @netgrid/web test -- damage-impact-overlay.test.ts`: grün; wegen Vitest-Argumentübergabe lief die vollständige Web-Suite, 33 Dateien, 424 Tests.
- `corepack pnpm --filter @netgrid/web typecheck`: grün.
- `git diff --check`: grün.

### Paket 3

Offen.

### Paket 4

Offen. Die Import-/Verantwortungsmatrix wird vor Moves neu mit gezielten, reproduzierbaren Suchbefehlen ermittelt.

### Paket 5

Offen.

### Paket 6

Offen.

### Paket 7

Offen.

### Paket 8

Offen.

## Abschlusskriterien

Das Goal wird erst abgeschlossen, wenn alle finalen Gates grün sind, ein Abschlussbericht vorliegt, der Projektlog aktualisiert wurde, der Arbeitsbranch sauber in den lokalen `main` integriert ist und der separate Worktree entfernt wurde.
