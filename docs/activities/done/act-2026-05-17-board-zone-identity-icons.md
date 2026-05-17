---
activityId: act-2026-05-17-board-zone-identity-icons
status: done
kind: concept
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: board UX
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/web test
  - Playwright visual check mit temporärem Skript: Korp Desktop 1600x900, Korp Narrow 390x844, Runner Desktop 1280x720
  - git diff --check
---

# Board-Zonen mit wiedererkennbaren Identitäts-Icons ausstatten

## Ziel

Die zentralen Spielfeldbereiche sollen schneller wiedererkennbar werden: Server/Forts wie HQ, R&D, Archive und externe Forts sowie Runner-Elemente wie Rig, Stack, Heap und Crib/Grip sollen ein klares, eigenes visuelles Merkmal erhalten. Die Icons sollen die bestehende Board-Struktur unterstützen, ohne offizielle Symbole oder zusätzliche Regellogik einzuführen.

## Kontext und Quellen

- Nutzeridee vom 2026-05-17: Unter bzw. bei den Bezeichnungen einzelner Board-Strukturen soll ein cleanes, schematisches Icon stehen, z. B. in der linken unteren Ecke der jeweiligen Struktur. Es soll ungefähr die Breite von Schriftzug plus Kartenanzahl aufnehmen und als Identitätsanker dienen.
- Gewünschte Richtung: reduzierte Icons mit neutralem Hintergrund plus Seitenfarbe, also Korpfarbe für Korp-Server/Forts und Runner-Farbe für Runner-Zonen.
- Beispielhafte Bedeutungen: HQ soll als Headquarter erkennbar sein, R&D als Forschung/Entwicklung, Archive als Archiv, externe Forts als eigene Serverstruktur; beim Rig kann das bestehende kleine Run-/Rig-Symbol als Basis erhalten bleiben, aber etwas größer und aussagekräftiger werden.
- Relevante Designreferenzen: `docs/ui-designsets/REALISM_REVIEW.md` empfiehlt eine klare Design-C-nahe Hauptstruktur mit einzelnen Status-/Fokus-Elementen; `docs/ui-designsets/05-logo-exploration/BRANDING_DECISION.md` erlaubt nur eigene, neu gezeichnete oder generische NETGRID-Symbole und schließt offizielle Logos/Faction-Symbole/Cardbacks/Cardframes aus.
- Verwandtes Hotfix-Paket: `docs/activities/in-progress/act-2026-05-17-corp-runner-zones-compact-rig-row.md` betrifft die kompakte Platzierung der Runner-Zonen aus Korp-Sicht. Dieses Paket ist getrennt: Es definiert die allgemeinere Wiedererkennungs- und Icon-Sprache.

## Scope

- Kleines visuelles Konzept für Board-Zonen-Identitätsicons erstellen und direkt in eine erste UI-Umsetzung überführen.
- Icon-Satz oder Icon-Regel für mindestens diese Bereiche festlegen:
  - Korp: HQ, R&D/F&E, Archive, externe Forts/Remote-Forts.
  - Runner: Rig, Stack, Heap, Crib/Grip.
- Icon-Platzierung im Board definieren, bevorzugt als dezentes Element in der linken unteren Ecke oder in einem vergleichbar stabilen Bereich der jeweiligen Zone.
- Icons an vorhandene Seitenfarben anbinden: Korp-Zonen korpseitig, Runner-Zonen runnerseitig.
- Bestehendes Rig-Symbol prüfen und ggf. vergrößern/vereinheitlichen statt komplett ersetzen.
- Desktop und schmale Viewports prüfen, damit Icons weder Titel, Counts, Karten noch Aktionen überdecken.
- Accessible Labels oder Tooltips ergänzen, wenn das Icon allein nicht eindeutig ist.

## Nicht im Scope

- Keine offiziellen Artworks, Logos, Faction-Symbole, Cardbacks, Cardframes oder externen Kartendatenbank-Assets verwenden.
- Keine Änderung an Engine, PlayerView, LegalActions, Replay, StateHash, KI oder Serververträgen.
- Keine versteckten Karteninformationen über Icon, Farbe, Ladezustand, Tooltip oder DOM-Metadaten leaken.
- Kein großes Board-Redesign und keine neue Drag-/Targeting-Interaktion.
- Keine finalen Marken-/App-Logo-Entscheidungen; die Icons sind Board-Orientierungselemente, keine Produktmarke.

## Akzeptanzkriterien

- [x] Es gibt eine konsistente Icon-Sprache für HQ, R&D/F&E, Archive, externe Forts sowie Runner-Rig, Stack, Heap und Crib/Grip.
- [x] Die Icons helfen beim schnellen Scannen, ohne bestehende Labels oder Counts zu ersetzen.
- [x] Korp- und Runner-Zonen sind farblich klar, aber nicht überladen markiert.
- [x] Die Platzierung kollidiert nicht mit Karten, Actions, Counts, Highlight-Zuständen oder Tooltips.
- [x] Hidden-Info-Grenzen bleiben unverändert; Icons sind rein statische UI-Orientierung.
- [x] Asset-/Rechtsgrenzen sind eingehalten: nur eigene, generische oder lokal neu gezeichnete Symbole.
- [x] Mindestens ein UI-/Screenshot-Smoke oder eine gezielte visuelle QA prüft Desktop und schmalen Viewport.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Vor der Umsetzung aktuelle Board-Komponenten und Styles in `apps/web/app/page.tsx`, `apps/web/app/globals.css` und ggf. bestehende Icon-Nutzung prüfen.
- Wenn möglich vorhandene Icon-Bibliothek oder kleine eigene SVG-Komponenten nutzen; keine bitmaplastige Asset-Pipeline für diesen kleinen Orientierungsschnitt einführen.
- Erste solide Symbolideen:
  - HQ: kompaktes Kontrollzentrum/Gebäude.
  - R&D/F&E: Labor-/Knoten-/Forschungsstruktur.
  - Archive: gestapelte Akten/Datenspeicher.
  - Externes Fort: Server-/Fort-Kachel mit Verteidigungsrahmen.
  - Rig: Runner-Netz-/Werkzeugstruktur auf Basis des bestehenden Symbols.
  - Stack: Karten-/Datenstapel ohne Kartenrücken-Anmutung.
  - Heap: Ablage-/Papierkorb-/Discard-Stapel.
  - Crib/Grip: Handkarten-Zähler ohne einzelne Karteninhalte.

## Ergebnisnotiz

- `ZoneIdentityIcon` nutzt vorhandene generische Lucide-Icons als statische Orientierungselemente: HQ `Building2`, R&D/F&E `Brain`, Archive `Clipboard`, externe Forts `Shield`, Rig `Cable`, Grip `CopyPlus`, Heap `Trash2`, Stack `Layers3`.
- Icons sitzen im vorhandenen linken Lead-Bereich neben Labels/Counts und ersetzen diese nicht.
- Runner- und Korp-Farbgebung folgt den bestehenden Zonenakzenten; die Icons enthalten nur statische Labels/Tooltips und keine Spielzustands- oder Hidden-Info-Daten.
- Geprüft wurden Korp Desktop/Narrow sowie Runner Desktop; keine horizontale Überbreite und keine Überdeckung von Karten oder Actions im geprüften Zustand.
