---
activityId: act-2026-05-17-docs-designsets-curation
status: done
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-4
parallelWorker: worker-4
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/activities/done/act-2026-05-17-docs-designsets-curation.md
checks:
  - git status --short --branch
  - rg --files docs/ui-designsets
  - docs/ui-designsets/README.md reviewed
  - docs/ui-designsets/REALISM_REVIEW.md reviewed
  - docs/ui-designsets/branding/README.md reviewed
  - docs/ui-designsets/branding/BRANDING_DECISION.md reviewed
  - git diff --check passed
---

# UI-Designsets kuratieren und archivieren

## Ziel

`docs/ui-designsets/` soll zwischen kuratierten Designquellen, vorläufigen Branding-Entscheidungen und alten Entwurfsartefakten unterscheiden, damit spätere UI-Arbeit nicht durch veraltete Draft-Bilder oder unklare Asset-Grenzen irritiert wird.

## Kontext und Quellen

- `docs/ui-designsets/README.md` beschreibt die Mockups als explorative UI-Richtungen, nicht als verbindliche Implementierungsvorgabe.
- `docs/ui-designsets/REALISM_REVIEW.md` empfiehlt Design C als Hauptbasis und Design D als Run-/Encounter-Fokus.
- `docs/ui-designsets/branding/BRANDING_DECISION.md` hält die vorläufige Branding-Entscheidung `NETGRID`.
- Strukturreview vom 2026-05-17: `docs/ui-designsets/` enthält 35 getrackte Dateien mit ca. 38 MiB.

## Scope

- Designsets in Kategorien einordnen:
  - kuratierte Referenz,
  - historische Exploration,
  - ersetzter Draft,
  - vorläufiges Branding,
  - needs-decision wegen Asset-/Rechtsfrage.
- Empfehlen, welche Dateien im aktiven Designbereich bleiben und welche in ein Archiv oder Rollup wandern sollten.
- Prüfen, ob `docs/design/` als Zielstruktur sinnvoller ist als `docs/ui-designsets/`.
- Rechtliche Grenzen zu offiziellen Logos, Card Frames, Card Backs und externen Artworks sichtbar halten.

## Nicht im Scope

- Keine neuen Designs erstellen.
- Keine UI-Implementierung.
- Keine Löschung oder Komprimierung von Bildern ohne separaten Schritt.
- Keine endgültige Markenfreigabe.

## Kuratiertes Rollup

### Kuratierte Referenz

Diese Dateien sollten im aktiven Designbereich sichtbar bleiben, weil sie die derzeit beste umsetzbare UI-Richtung oder die zentrale Bewertung enthalten:

- `docs/ui-designsets/README.md`
- `docs/ui-designsets/REALISM_REVIEW.md`
- `docs/ui-designsets/active/design-c/entry.png`
- `docs/ui-designsets/active/design-c/runner-corrected.png`
- `docs/ui-designsets/active/design-c/corp.png`
- `docs/ui-designsets/active/design-c/entry-card-images.png`
- `docs/ui-designsets/active/design-c/runner-card-images-corrected.png`
- `docs/ui-designsets/active/design-c/corp-card-images-corrected.png`
- `docs/ui-designsets/active/design-d-run-focus/entry.png`
- `docs/ui-designsets/active/design-d-run-focus/runner-corrected.png`
- `docs/ui-designsets/active/design-d-run-focus/corp-corrected.png`

Begründung: Design C bleibt laut Realismusprüfung die Hauptbasis. Design D bleibt als fokussierte Run-/Encounter-Referenz nützlich. Die kartenbildfreundlichen Design-C-Varianten sind nur eine Display-Architektur-Referenz; sie geben kein Asset-Gate frei.

### Vorläufiges Branding

Diese Dateien bleiben auffindbar, aber ausdrücklich vorläufig:

- `docs/ui-designsets/branding/README.md`
- `docs/ui-designsets/branding/BRANDING_DECISION.md`
- `docs/ui-designsets/branding/selected-netgrid/netgrid-lockup-selected.png`
- `docs/ui-designsets/branding/selected-netgrid/netgrid-icon-left-mark-clean.png`
- `docs/ui-designsets/branding/selected-netgrid/netgrid-icon-right-tile-clean.png`
- `docs/ui-designsets/branding/selected-netgrid/netgrid-icon-right-tile-redraw-v2.svg`

Empfehlung: Die `selected-netgrid`-Dateien bleiben aktive Branding-Referenzen. Vor produktiver Nutzung sollten die Icons als einfache eigene SVGs neu gezeichnet und separat freigegeben werden. `BRANDING_DECISION.md` bleibt der führende Einstieg.

### Historische Exploration

Diese Dateien sind für spätere Vergleiche nützlich, aber nicht mehr als aktive UI-Vorgabe zu lesen:

- `docs/ui-designsets/archive/exploration/basisentwuerfe/design-a-dark-tactical-overview.png`
- `docs/ui-designsets/archive/exploration/basisentwuerfe/design-b-operations-dashboard-overview.png`
- `docs/ui-designsets/archive/exploration/basisentwuerfe/design-c-clean-readable-overview.png`
- `docs/ui-designsets/archive/exploration/basisentwuerfe/design-d-cinematic-run-overview.png`
- `docs/ui-designsets/archive/exploration/design-a-dark-tactical/entry.png`
- `docs/ui-designsets/archive/exploration/design-a-dark-tactical/runner.png`
- `docs/ui-designsets/archive/exploration/design-a-dark-tactical/corp.png`
- `docs/ui-designsets/archive/exploration/design-b-operations-dashboard/entry.png`
- `docs/ui-designsets/archive/exploration/design-b-operations-dashboard/runner.png`
- `docs/ui-designsets/archive/exploration/design-b-operations-dashboard/corp.png`
- `docs/ui-designsets/archive/exploration/logo-ideas/logo-mark-exploration.png`
- `docs/ui-designsets/archive/exploration/logo-ideas/wordmark-lockups.png`
- `docs/ui-designsets/archive/exploration/logo-ideas/app-icon-exploration.png`

Empfehlung: Diese Dateien sollten bei einer späteren Strukturpflege in einen Archivbereich wie `docs/ui-designsets/archive/` oder in ein kompaktes `docs/design/archive/` wandern. Alternativ reicht für große, nicht mehr aktive Bildtafeln ein expliziter Entscheid, sie nur über Git-Historie zu behalten. Keine Löschung ohne separaten Auftrag.

### Ersetzte Drafts

Diese Dateien haben korrigierte Varianten oder sind durch die Realismusprüfung abgelöst:

- `docs/ui-designsets/archive/replaced-drafts/design-c/runner-draft.png`
- `docs/ui-designsets/archive/replaced-drafts/design-c/runner-card-images.png`
- `docs/ui-designsets/archive/replaced-drafts/design-c/corp-card-images.png`
- `docs/ui-designsets/archive/replaced-drafts/design-d-run-focus/runner-draft.png`
- `docs/ui-designsets/archive/replaced-drafts/design-d-run-focus/corp-draft.png`

Empfehlung: Bei einer späteren Archivpflege in `archive/replaced-drafts/` verschieben oder nach ausdrücklicher Freigabe aus dem aktiven Arbeitsbaum entfernen. Bis dahin bleiben sie nur historische Vergleichsbilder.

### Needs Decision wegen Asset-/Rechtsfrage

Diese Dateien oder Bildgruppen dürfen nicht direkt als produktive Assets interpretiert werden:

- Alle `*-card-images*.png`-Mockups unter `active/design-c/` und `archive/replaced-drafts/design-c/`: nur Layoutreferenz für künftige eigene/genehmigte Kartenbilder, kein Asset-Gate.
- `archive/exploration/design-a-dark-tactical/*` und `archive/exploration/design-b-operations-dashboard/*`: enthalten nach Realismusprüfung offizielle oder offiziell anmutende Karten-/Frame-/Mechanikrisiken und sollten nur als historische Exploration gelesen werden.
- `archive/exploration/logo-ideas/logo-mark-exploration.png`, `wordmark-lockups.png`, `app-icon-exploration.png`: Ideentafeln, keine finalen Markenassets.
- `selected-netgrid/*`: vorläufige Eigenmarken-Richtung, vor produktiver Nutzung neu zeichnen und freigeben.

Sichtbare Rechtsgrenze: Keine offiziellen Logos, Faction-Symbole, Card Frames, Card Backs, offiziellen Artworks oder externen Kartendatenbank-Stile in produktiver UI, PlayerViews, Replays, Screenshots, App-Icons oder Dokumentationsbilder übernehmen. Bildkarten bleiben ein separates Asset-/Rechts-Gate.

## Zielstruktur-Empfehlung

`docs/ui-designsets/` ist als aktueller Ablageort verständlich und sollte kurzfristig nicht umbenannt werden, weil bestehende Links aus Wissensbasis und Dokumentation darauf zeigen. Für die nächste Strukturpflege ist diese Gliederung sinnvoll:

- `docs/ui-designsets/README.md`: knapper Einstieg mit aktivem Rollup.
- `docs/ui-designsets/active/design-c/`: aktive Hauptreferenz.
- `docs/ui-designsets/active/design-d-run-focus/`: aktive Run-/Encounter-Ergänzung.
- `docs/ui-designsets/branding/`: vorläufiges Branding und `selected-netgrid`.
- `docs/ui-designsets/archive/exploration/`: Design A, Design B, Basisentwürfe und Logo-Ideentafeln.
- `docs/ui-designsets/archive/replaced-drafts/`: Drafts mit korrigierten Nachfolgern.

Ein Wechsel nach `docs/design/` ist erst sinnvoll, wenn neben Mockups auch UI-Komponentenmodelle, Tokens, Screenshots aus echter Implementierung und Designentscheidungen gepflegt werden. Bis dahin würde `docs/design/` eher zusätzliche Linkpflege erzeugen als Klarheit schaffen.

## Empfehlung für spätere README-Ergänzung

Wenn diese Curation in `docs/ui-designsets/README.md` zurückgeführt wird, sollte oben ein kurzer Abschnitt `Aktiver Stand` ergänzt werden:

- Primärreferenz: Design C, korrigierte und kartenbildfreundlich korrigierte Varianten.
- Ergänzung: Design D für Run-/Encounter-Fokus.
- Branding: `branding/BRANDING_DECISION.md` und `branding/selected-netgrid/`, vorläufig und vor Produktivnutzung neu zu zeichnen.
- Archiv: Design A, Design B, Basisentwürfe und ersetzte Drafts sind historische Exploration.
- Asset-Gate: keine offiziellen Logos, Card Frames, Card Backs, offiziellen Artworks oder externen Kartendatenbank-Stile; Kartenbilder nur nach eigenem Asset-/Rechts-Gate.

## Akzeptanzkriterien

- [x] Kuratierte Designreferenzen sind klar von alten Drafts getrennt.
- [x] Branding-Entscheidung bleibt auffindbar.
- [x] Rechtliche Asset-Grenzen sind im Zielzustand sichtbar.
- [x] Es gibt eine Empfehlung, welche Bilddateien aktiv bleiben, archiviert werden oder nur Git-Historie benötigen könnten.

## Umsetzungshinweise

- Keine pauschale Bildlöschung: erst README/Rollup, dann Archiventscheidung.
- Design C und die ausgewählten NETGRID-Icons sind besonders vorsichtig zu behandeln.

## Ergebnisnotiz

Abgeschlossen am 2026-05-17. Die Activity wurde als kuratiertes Dokumentations-Rollup erledigt, weil der Worker-Scope ausschließlich diese Activity-Datei freigegeben hat. Es wurden keine Designs erstellt, keine UI implementiert, keine Bilder gelöscht, verschoben oder komprimiert und keine README im Designset verändert.

Ergebnis:

- Aktive Referenzen: Design C als Hauptbasis, Design D als Run-/Encounter-Ergänzung.
- Branding: `branding/BRANDING_DECISION.md` und `branding/selected-netgrid/*` bleiben vorläufige Referenz, nicht finale Markenfreigabe.
- Archivkandidaten: Basisentwürfe, Design A, Design B, Logo-Ideentafeln und ersetzte Drafts.
- Asset-Grenze: Kartenbilder, offizielle Anmutungen und Marken-/Icon-Assets bleiben gate-pflichtig.

Nachtrag 2026-05-18: Die empfohlene Zielstruktur ist umgesetzt. Aktive Design-C-Referenzen liegen unter `docs/ui-designsets/active/design-c/`, Design-D-Run-Fokus unter `docs/ui-designsets/active/design-d-run-focus/`, Branding unter `docs/ui-designsets/branding/`, historische Explorationen unter `docs/ui-designsets/archive/exploration/` und ersetzte Drafts unter `docs/ui-designsets/archive/replaced-drafts/`. Es wurden keine Bilder gelöscht oder komprimiert.
