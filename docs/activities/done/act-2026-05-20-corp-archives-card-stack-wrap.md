---
activityId: act-2026-05-20-corp-archives-card-stack-wrap
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-20
startedAt: 2026-05-20
completedAt: 2026-05-20
branch:
releaseTarget: Board zone layout
blockedBy: []
relatedActivities:
  - act-2026-05-17-runner-zones-board-style-collapse
  - act-2026-05-17-board-zone-identity-icons
  - act-2026-05-19-board-zones-chronicle-side-tint-experiment
resultArtifacts:
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check -- apps/web/app/globals.css docs/activities/done/act-2026-05-20-corp-archives-card-stack-wrap.md
  - Browser-/Playwright-Visual-Smoke gegen http://127.0.0.1:3100 mit Archiv- und Heap-Fixture bei Desktop 1000x720 und schmalem Viewport 390x720
---

# Korp-Archiv: Kartenstapel umbrechen statt extrem überlappen

## Ziel

Die Archiv-Zone in der Korp-/Board-Darstellung soll öffentliche Archivkarten lesbar und vollständig innerhalb der Zone anzeigen. Wenn horizontal nicht genug Platz vorhanden ist, müssen Karten in eine zweite Zeile umbrechen. Eine extreme Überdeckung, abgeschnittene linke Kartenkante oder ein unnötig tief nach unten laufendes Archivfeld ist nicht akzeptabel.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-20 mit Screenshot: Im Archiv liegt eine sichtbare Karte, die Darstellung ist links abgeschnitten und die Karten-/Stapelposition wirkt zu weit nach unten gezogen. Die Karten liegen beziehungsweise würden so eng überlappen, dass Inhalte nicht mehr sinnvoll erkennbar sind.
- Erwartung aus dem Nutzerfeedback:
  - Karten dürfen nicht so eng zusammenliegen.
  - Bei zu wenig Platz soll der Stapel in eine zweite Zeile umbrechen.
  - Überdeckung maximal etwa 50 bis 60 Prozent, nicht stärker.
  - Karten dürfen nicht am linken Rand abgeschnitten werden.
  - Die Zone soll nicht unnötig nach unten wachsen, nur weil die Kartenpositionierung falsch berechnet wird.
- Verwandtes erledigtes Paket `act-2026-05-17-runner-zones-board-style-collapse`: Heap und Archive wurden einklappbar und an Board-Zonensprache angeglichen. Der neue Befund ist ein Follow-up zur konkreten ausgeklappten Archiv-Kartenstapel-Darstellung.

## Scope

- Archiv-/Ablagestapel-Layout im Webclient prüfen:
  - `Archive` aus Korp-Sicht beziehungsweise zentrale Korp-Archiv-Zone,
  - öffentliche sichtbare Archivkarten,
  - ausgeklappter Zustand,
  - schmale Zonenbreite wie im Screenshot.
- Kartenstapel-Algorithmus oder CSS so anpassen, dass:
  - Karten nicht links abgeschnitten werden,
  - Karten maximal ungefähr halb bis 60 Prozent überdecken,
  - bei zu wenig Breite eine zweite Reihe entsteht,
  - mehrere Reihen stabil innerhalb der Zone liegen,
  - die Zone nur kontrolliert wächst und nicht durch absolute Positionierung unnötig tief wird.
- Prüfen, ob derselbe Stapel-/Preview-Helfer auch Runner-Heap oder andere öffentliche Ablagestapel betrifft. Falls ja, denselben Fix dort übernehmen, aber nur für die gemeinsame Layoutfamilie.
- Browser-/Visual-Smoke mit einem Archivstapel prüfen:
  - mindestens eine sichtbare Archivkarte,
  - mehrere sichtbare Archivkarten,
  - enger Desktop-/Narrow-Viewport,
  - keine linke Beschneidung und keine unlesbare Extremüberlappung.

## Nicht im Scope

- Keine Änderung an Archivregeln, Archives-Zugriff, Trash-/Move-Regeln oder LegalActions.
- Keine Änderung an Hidden-Info-Verträgen: verdeckte Archivkarten, HQ-/R&D-Daten, FullState und private Payloads dürfen nicht durch Layout oder Debugdaten sichtbar werden.
- Kein Redesign des gesamten Boards.
- Keine Änderung am Collapse-Verhalten außer dort, wo es direkt nötig ist, damit der ausgeklappte Stapel korrekt misst.
- Keine neuen offiziellen Artworks oder externen Assets.

## Akzeptanzkriterien

- [ ] Ein Archiv mit einer sichtbaren Karte wird nicht links abgeschnitten und liegt sichtbar innerhalb der Zone.
- [ ] Ein Archiv mit mehreren sichtbaren Karten überlappt Karten höchstens moderat, ungefähr bis maximal 50 bis 60 Prozent.
- [ ] Wenn die verfügbare Breite nicht reicht, umbrechen die Karten in eine zweite oder weitere Zeile statt immer enger übereinander zu rutschen.
- [ ] Die Archiv-Zone wächst nur kontrolliert entsprechend der Reihenanzahl und nicht wegen fehlerhafter absoluter Positionierung unnötig weit nach unten.
- [ ] Runner-Heap oder andere öffentliche Ablagestapel bleiben lesbar, falls sie denselben Layout-Helfer nutzen.
- [ ] Hidden-Info-Grenzen bleiben unverändert; es werden nur bereits öffentliche/sichtbare Karten dargestellt.
- [ ] Ein Browser-/Visual-Check belegt Desktop und schmalen Viewport für den Screenshot-nahen Fall.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `apps/web/app/page.tsx` rund um Archive-/Heap-/SideZoneFrame-Rendering,
  - `apps/web/app/globals.css` für Kartenstapel-, Zone- und Collapse-Styles,
  - bestehende Board-/Visual-Tests oder Browser-Smoke-Helfer.
- Falls Karten aktuell per `position: absolute` und negativem Offset gestapelt werden, besser auf ein Layout mit stabiler Containerbreite, `flex-wrap`/Grid oder berechneten Reihen umstellen.
- Die Karten dürfen weiterhin kompakt überlappen, aber die Überdeckung muss begrenzt und die linke Kante geschützt sein.

## Ergebnisnotiz

Umgesetzt. Archiv- und Runner-Heap-Stapel nutzen jetzt ein umbruchfähiges Grid mit geschützter linker Kante und einem Karten-Schritt von 50 px bei 108 px Kartenbreite; die Überdeckung liegt damit bei etwa 54 Prozent statt bei der vorherigen Extremüberdeckung. Die Stapel wachsen zeilenweise kontrolliert statt horizontal immer enger zu überlappen oder links abgeschnitten zu werden.

Verifikation: `@netgrid/web`-Typecheck grün, `git diff --check` grün. Der Browser-/Playwright-Smoke gegen die laufende lokale App hat für Archiv und Heap bei Desktop und schmalem Viewport gemessen: Kartenbreite 108 px, Schritt 50 px, acht Karten umbrechen in drei Reihen, `minLeft` bleibt auf der Row-Kante und eine Einzelkarte bleibt in einer Reihe sichtbar.
