# Web-UI-Stabilisierung und Strukturvervollständigung - Abschlussbericht

Datum: 2026-06-24

Arbeitsbranch: `codex/web-ui-stabilization-structure`

Prozessartefakt: `docs/architecture/ui/web-ui-stabilization-and-structure-goal-2026-06-24.md`

## Gesamtstatus

Der Webclient ist technisch wieder vollständig verifizierbar. Die roten CounterType-/Build-Probleme sind behoben, der DamageImpactOverlay-Test hängt nicht mehr an `page.tsx`, wiederverwendbare Web-Utilities wurden aus `app` in Feature-Zielorte verschoben und Root-Controller-Verantwortung wurde bei WebSocket-Transport und Catalog-Workspace reduziert.

## CounterType-Entscheidung

`data_raven`, `doppelganger_antibody` und `pattel_antibody` wurden nicht in `CounterType` ergänzt.

Die Engine verwendet bereits kanonische Shared-Counter:

| Fachlicher Counter | Kanonischer `CounterType` |
| --- | --- |
| Data-Raven-Counter | `trace_tag_counter` |
| Doppelganger-Counter | `link_reduction_counter` |
| Pattel-Counter | `breaker_strength_penalty` |

Web, Chronicle und Tests wurden auf diese Werte synchronisiert. Sichtbare Labels bleiben fachlich kartenspezifisch.

## Behobene Blocker

- Web-Typecheck-Fehler durch falsche Counternamen in Web/Chronicle behoben.
- Web-Build wieder grün.
- `damage-impact-overlay.test.ts` prüft die aktuelle Feature-Datei `apps/web/features/actions/DamageImpactOverlay.tsx` statt den historischen Root-Pfad.

## Strukturpakete

- `card-image-service`, `catalog-ui` und `deck-editor-ui` wurden an Feature-Zielorte verschoben; alte `app`-Dateien bleiben als Re-Export-Shims erhalten.
- WebSocket-Lebenszyklus und Socket-Senden liegen in `features/match-session/useMatchTransport.ts`.
- Catalog-Workspace-State, Filter, Fetching und Detailcache liegen in `features/catalog/useCatalogWorkspace.ts`.
- `page.tsx` enthält keine direkten Requests auf `/api/cards/catalog` mehr.

## Bewusst Nicht Geschnitten

- `AiDecisionDebugOverlay.tsx` bleibt vorerst zusammen, weil Export, Redaction, Plan-Projektion, Memory-Projektion und UI-Helfer eng gekoppelt sind. Ein sinnvoller Schnitt braucht eigene Redaction-/Projection-Tests.
- `DeckEditorPanel.tsx` bleibt vorerst zusammen; Agenda-Regeln liegen bereits in `features/decks/deck-editor-model.ts`.
- `globals.css` wurde nicht aufgeteilt, weil ein CSS-Domänensplit ohne visuelle Desktop-/Mobile-Gates die Kaskade riskieren würde.

## Größen

| Datei | Start | Ende |
| --- | ---: | ---: |
| `apps/web/app/page.tsx` | 4168 | 3845 |
| `apps/web/app/globals.css` | 11195 | 11195 |
| `apps/web/features/debug/AiDecisionDebugOverlay.tsx` | 1319 | 1319 |
| `apps/web/features/decks/DeckEditorPanel.tsx` | 1221 | 1221 |

## Checks

Ausgeführt und grün:

- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/web typecheck`
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/web build`
- `corepack pnpm --filter @netgrid/engine test -- src/game/counters/proteus-antibody-access.test.ts src/index-tests/originalset/per-card-followups.test.ts src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts`
- lokale statische relative TS-Importanalyse über `apps/web`: 0 Zyklen
- `git diff --check`

Hinweis: `next build` schaltet lokal `apps/web/next-env.d.ts` auf `./.next/types/routes.d.ts` um. Diese generierte Nebenwirkung wurde nicht übernommen.

## Restrisiken

- Der neue Catalog-Hook ist durch bestehende Web-Tests und Build abgesichert, aber nicht durch dedizierte Hook-Tests.
- Der Match-Transport-Hook ist durch Typecheck, Web-Tests und Build abgesichert; ein Browser-/WebSocket-Smoke wäre als nächste QA-Stufe sinnvoll.
- CSS bleibt strukturell groß und sollte separat mit visueller Regression geschnitten werden.

## Restaufgaben

1. CSS-Domänensplit mit Screenshot-Gates vorbereiten.
2. AI-Debug-Export-/Projection-Helper mit Redaction-Tests extrahieren.
3. Match-Transport und Catalog-Workspace mit fokussierten Hook-Tests absichern.
