# Review: Run-/Access-Interaktionsambiente

Datum: 2026-07-09
Branch: `codex/run-access-ambience`

## Umfang

Die Interaktionsfenster für Runs und verwandte Aktionssituationen erhalten dezente Hintergrundgrafiken als optisches Signal. Die Grafiken liegen als abgeschwächte, nicht dominante Ambiente-Ebene hinter dem eigentlichen Fensterinhalt.

Abgedeckte Zustände:

- `movement`: Eis passieren, Run-Fortschritt und Movement-/Approach-Fenster
- `access`: Kartenzugriff, Reveal-/Expose-Fenster
- `damage`: Net-/Brain-/Meat-Damage-Fenster
- `trace`: Trace-Fenster
- `pump`: Pump-/Breaker-/Icebreaker-Fenster
- `trash`: Trashfenster und Security-Purge-/Trash-Auswahlfenster

## Artefakte

Neue Bildassets:

- `apps/web/public/backgrounds/run-movement-ambience.png`
- `apps/web/public/backgrounds/access-scan-ambience.png`
- `apps/web/public/backgrounds/damage-impact-ambience.png`
- `apps/web/public/backgrounds/trace-signal-ambience.png`
- `apps/web/public/backgrounds/pump-breaker-ambience.png`
- `apps/web/public/backgrounds/trash-shred-ambience.png`

Neue UI-Zuordnung:

- `apps/web/app/action-board-ui.ts` klassifiziert LegalActions, Choices und Run-Phasen nach Ambiente-Zustand.
- `apps/web/app/globals.css` hinterlegt die sechs Ambiente-Varianten als dezente `::before`-Ebene.
- Run-Timeline, Access-/Expose-Modals, Damage-Overlay, generische Choice-Panels, Card-Choice-Panels, LegalActionsPanel und Security-Purge-Panel verwenden die Zuordnung.

## Prüfergebnis

Statische und fokussierte Prüfungen:

- `corepack pnpm --filter @netgrid/web exec vitest run action-board-ui.test.ts run-layering.test.ts damage-impact-overlay.test.ts --passWithNoTests`
- `corepack pnpm --filter @netgrid/web typecheck`
- `git diff --check`

Ergebnis: alle Prüfungen erfolgreich. `git diff --check` meldete nur Line-Ending-Hinweise zu CRLF-Normalisierung, keine Whitespace-Fehler.

Asset-Prüfung:

- Alle sechs Ambiente-Grafiken wurden lokal visuell geprüft.
- Alle sechs Dateien haben `1672x941` Pixel.
- Die Motive sind abstrakt/stimmungsvoll, textfrei und ohne offizielle Fremd-Artworks.

Browser-Smoke:

- Nicht separat ausgeführt. Die Änderung ist CSS-/Komponenten-basiert und wurde durch fokussierte Rendering-/UI-Tests sowie Typecheck abgesichert.
