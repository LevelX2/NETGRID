---
activityId: act-2026-05-24-heap-archive-inactive-card-overlay
status: done
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-24
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts -t "labels inactive heap"
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts -t "inactive heap"
  - corepack pnpm --filter @netgrid/web typecheck
  - Playwright CSS-Smoke mit temporärem Inline-Skript für Heap, faceup Archiv, unrezzed Installed und Archiv-Rückseite
  - git diff --check
---

# Heap/Archiv: abgelegte Karten visuell von aktiven Karten unterscheiden

## Ziel

Karten in Runner-Heap und Korp-Archiv sollen auf dem Board klar als abgelegte, derzeit nicht installierte Karten erkennbar sein. Die Darstellung muss sich deutlich von verdeckten beziehungsweise nicht gerezzten installierten Korp-Karten unterscheiden, weil Heap und Archiv prominent sichtbar sind und sonst wie aktive Boardkarten wirken können.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-24: Heap und Archiv werden prominent angezeigt; dadurch ist nicht immer klar, ob eine sichtbare Karte aktiv verwendbar/installiert ist oder nur in der Ablage liegt.
- Gewünschte Richtung: Overlay vergleichbar mit dem Zustand einer nicht gerezzten Karte, aber klar anders unterscheidbar. Begriffe/Signale: Archiv, Trash, Heap, abgelegt, nicht aktiv.
- Bestehender Code-Spotcheck:
  - `apps/web/app/page.tsx` rendert eigene Runner-Heap-Karten über `activeView.own.heapOrArchives` im `SideZoneFrame` `Heap`.
  - `apps/web/app/page.tsx` rendert gegnerische Runner-Heap-Karten über `RunnerOpponentZonesStrip`.
  - `apps/web/app/page.tsx` rendert Archive über `ArchivesStackView` und `CardView`; verdeckte Archivkarten nutzen bereits `archiveFacedown`.
  - `apps/web/app/globals.css` enthält bereits getrennte Card-Zustände für `.card.unrezzedInstalled` und `.card.archiveFacedown`.
- Verwandte erledigte Activity: `docs/activities/done/act-2026-05-17-board-zone-identity-icons.md` hat Zone-Icons für Archive und Heap eingeführt. Dieses Paket baut darauf auf, ändert aber die Karten-Overlays.

## Scope

- Einen eigenen UI-Zustand für abgelegte Karten einführen, z. B. als `CardView`-Prop `inactiveZone="heap" | "archives"` oder vergleichbar.
- Den Zustand auf Karten anwenden, die in folgenden Boardflächen sichtbar sind:
  - eigener Runner-Heap,
  - gegnerischer Runner-Heap, soweit die Karten öffentlich sichtbar sind,
  - faceup Archive-Karten,
  - aus Korp-Sicht lesbare facedown Archive-Karten, sofern sie nicht als Kartenrückseite angezeigt werden.
- Die Optik klar von `.card.unrezzedInstalled` abgrenzen:
  - keine Wiederverwendung der diagonalen Unrezzed-Schraffur als Hauptsignal,
  - eher matter Grauschleier, horizontales Ablageband oder dezentes Stempel-/Badge-Signal,
  - kleines Label/Icon wie `Heap` oder `Archiv`, idealerweise mit vorhandenen Lucide-Icons wie `Trash2` und `Clipboard`/`Archive`.
- Karten bleiben lesbar, sofern sie vorher lesbar waren; der Overlay darf Titel, Typ, Kosten und Regeltext nicht unbrauchbar verdecken.
- Tooltip-/ARIA-Text ergänzen, damit Screenreader den Ablagezustand unterscheiden können, z. B. `im Heap abgelegt` oder `im Archiv abgelegt`.
- Auf kompakte Darstellung, normale Kartenansicht und Bildkarten achten.

## Nicht im Scope

- Keine Änderung an Engine-Regeln, Zonenmodell, `PlayerView`, `LegalActions`, `applyAction`, Replay, StateHash oder Randomness.
- Keine neue Spielmechanik und keine Änderung daran, ob Karten aus Heap/Archiv später wiederverwendet werden können.
- Keine Änderung an Access-, Trash-, Install-, Rez- oder Suchregeln.
- Keine neuen offiziellen Assets, Card Frames, Logos oder externen Kartendatenbank-Abhängigkeiten.
- Kein Board-Redesign und keine Umplatzierung von Heap oder Archiv.
- Keine Anzeige zusätzlicher verdeckter Kartendaten. Verdeckte Archivkarten aus Runner-Sicht bleiben verdeckt.

## Akzeptanzkriterien

- [x] Sichtbare Karten im Runner-Heap tragen ein klares `Heap`-/Trash-Ablage-Signal und wirken nicht wie installierte aktive Karten.
- [x] Sichtbare Karten im Korp-Archiv tragen ein klares `Archiv`-Ablage-Signal und wirken nicht wie aktive Server-/Root-Karten.
- [x] Der neue Ablagezustand ist visuell klar von nicht gerezzten installierten Karten unterscheidbar.
- [x] Faceup Heap-/Archivkarten bleiben lesbar; Overlay und Badge verdecken keine wichtigen Kartendaten dauerhaft.
- [x] Verdeckte Archivkarten aus Runner-Sicht leaken keine Kartendetails; ein generisches Archivsignal darf keine verdeckten Eigenschaften offenbaren.
- [x] Die bestehende `archiveFacedown`-Darstellung bleibt funktionsfähig und kollidiert nicht mit dem neuen Ablagezustand.
- [x] Tooltip oder `aria-label` nennt den Ablagezustand für bekannte Karten.
- [x] Fokussierte Web-/Komponententests oder ein Browser-Smoke decken mindestens Runner-Heap, faceup Archive und nicht gerezzte installierte Korp-Karten als Vergleichszustand ab.
- [x] `git diff --check` und der passende Web-Typecheck/Testlauf sind grün oder eine begründete Testauslassung ist in der Ergebnisnotiz dokumentiert.

## Umsetzungshinweise

- Wahrscheinlicher kleinster Schnitt:
  - `CardView` um einen optionalen Prop für abgelegte Zone erweitern.
  - daraus eine Klasse wie `inactiveZoneCard heapZoneCard archiveZoneCard` und einen kurzen Badge-Text/Icon ableiten.
  - `cardAriaLabel` um den Ablagezustand ergänzen.
  - Heap- und Archive-Renderstellen in `apps/web/app/page.tsx` setzen den Prop gezielt.
  - Styling in `apps/web/app/globals.css` ergänzen.
- Für die Optik bevorzugt:
  - matte Entsättigung/leichter dunkler Schleier,
  - horizontales oder randnahes Badge statt diagonaler Schraffur,
  - graue/neutrale Ablagefarbe mit kleinem Zone-Icon,
  - keine Verwechslung mit Side-Farben, Run-Markierung, Auswahlmarkierung oder Action-Marker.
- Wenn die neue Darstellung in Bildkarten nicht gut funktioniert, zuerst einen kleinen Badge/Filter-Schnitt liefern und weitere Bildkarten-Feinheiten als Folgepaket dokumentieren.

## Ergebnisnotiz

- `CardView` unterstützt jetzt `inactiveZone="heap" | "archives"` und setzt daraus eine getrennte CSS-Klasse, ein `data-inactive-zone`-Attribut, einen sichtbaren Badge mit `Trash2` beziehungsweise `Clipboard` und einen ARIA-Zusatz wie `im Heap abgelegt` oder `im Archiv abgelegt`.
- Runner-Heap-Karten in eigener und gegnerischer Sicht sowie faceup Archivkarten erhalten den neuen Ablagezustand. Aus Korp-Sicht lesbare facedown Archivkarten erhalten ihn ebenfalls; echte Kartenrückseiten blenden den Badge aus.
- Die Optik nutzt eine matte Abdunklung und ein horizontales Ablageband statt der diagonalen Unrezzed-Schraffur. Nicht gerezzte installierte Korp-Karten behalten den bestehenden gestrichelten `unrezzedInstalled`-Zustand.
- Verifikation: fokussierter Helper-Test, Web-Vitest-Lauf, Web-Typecheck, CSS-basierter Playwright-Smoke für Heap/Archiv/Unrezzed/Verschleierung und `git diff --check`.
- Offene Punkte: keine.
