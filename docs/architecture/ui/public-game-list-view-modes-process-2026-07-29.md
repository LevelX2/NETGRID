# Spieleliste: Matchpunkte und kompakte Ansicht

Status: abgeschlossen
Stand: 2026-07-29
Arbeitsbranch: `codex/game-list-view-modes`
Arbeits-Worktree: `C:\Projekte\NETGRID_GAME_LIST_VIEW_MODES`

## Quelle und Vorgabe

Nutzerbefund vom 2026-07-29:

- Abgeschlossene Einträge der öffentlichen Spieleliste zeigen bislang nur
  Agenda-Punkte. Die bereits im Ergebnis-Snapshot vorhandenen Matchpunkte
  sollen als eigentliche Spielwertung zusätzlich sichtbar werden.
- Für offene, laufende und abgeschlossene Spiele soll neben der bestehenden
  ausführlichen Kartendarstellung eine kompakte, zeilenartige Darstellung
  angeboten werden.
- Ein einfacher Umschalter soll direkt in der Spieleliste zwischen
  `Ausführlich` und `Kompakt` wechseln.
- Beide Änderungen werden als ein gemeinsames Umsetzungspaket bearbeitet.

## Zielprüfung

Die Vorgabe ist für die automatische Umsetzung präzise genug. Endzustand,
betroffener UI-Bereich, vorhandene Datenquelle, Darstellungsvarianten und
Bedienmodell sind bestimmbar.

## Gesamtziel

`/Goal` Arbeite das Paket `GAMES-LIST-001` vollständig im Worktree
`C:\Projekte\NETGRID_GAME_LIST_VIEW_MODES` auf Branch
`codex/game-list-view-modes` ab und merge den abgeschlossenen Arbeitsbranch
lokal nach `main`.

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, die verpflichtenden
Wiki-Einstiegsseiten, `apps/web/AGENTS.md`, die führenden Artefakte zur
öffentlichen Spieleübersicht und dieses Prozessartefakt. Nutze den
Hauptworkspace nur für den finalen Merge. Arbeite ausschließlich am aktuellen
Paket, führe die paketnahen Checks und `git diff --check` aus und committe den
grünen Paketstand. Integriere ein weitergelaufenes `main` defensiv. Verifiziere
danach erneut, merge lokal nach `main`, prüfe den Main-Stand und entferne den
sauberen Worktree sowie den vollständig gemergten Arbeitsbranch. Markiere das
Goal erst nach verifiziertem Cleanup als abgeschlossen.

## Annahmen

- Der Umschalter gilt gemeinsam für die aktuell gefilterte Liste aller drei
  Statusklassen.
- `Ausführlich` bleibt die initiale Darstellung, damit sich der bestehende
  Bedienvertrag nicht unangekündigt ändert.
- Die Darstellungswahl ist lokaler React-Zustand. Eine Persistenz über Reloads,
  Accounts oder Geräte ist nicht Teil der Vorgabe.
- Kompakt bedeutet eine feste einzeilige Darstellung mit Status, Teilnehmern,
  wichtigster Statusinformation und denselben verfügbaren Aktionen wie in der
  ausführlichen Karte. Sekundäre Metadaten, Match-ID und Aktualisierungszeit
  werden in diesem Modus zugunsten der geringen Höhe ausgeblendet.
- Aktionen erscheinen in der kompakten Zeile ausschließlich als Icons. Ihr
  Text bleibt über Tooltip und zugängliche Beschriftung erhalten.
- Matchpunkte werden nur angezeigt, wenn der autoritative Ergebnis-Snapshot
  beide Werte enthält. Ältere Snapshots ohne diese optionalen Felder bleiben
  ohne erfundene Ersatzwertung darstellbar.

## Nicht-Ziele

- Keine Änderung an Matchpunktberechnung, Rules Engine, Serverpersistenz,
  Replay, Zuschauerprojektion oder Hidden-Info-Vertrag.
- Keine neue Filter-, Such-, Sortier- oder Paginationfunktion.
- Keine Änderung an `Meine Spiele`.
- Keine Speicherung der Ansichtspräferenz.
- Kein Push und keine Pull Request-Erstellung.

## Controller-Invarianten

1. Genau ein Paket ist aktiv.
2. Die UI berechnet keine Matchpunkte, sondern rendert nur Snapshotwerte.
3. Kompakt und ausführlich verwenden dieselben gefilterten Einträge und
   dieselben Aktionsregeln.
4. Keine Aktion zum Beitreten, Fortsetzen, Zuschauen, Replay oder
   Spielprotokoll geht in der kompakten Ansicht verloren.
5. Private Daten, LegalActions, Hände, Tokens und Deckinhalte bleiben
   außerhalb des öffentlichen Listenpayloads.
6. Fremde Änderungen und Worktrees bleiben unangetastet.

## Automatische Fehlerbehandlung

- Rote paketnahe Tests werden innerhalb von `GAMES-LIST-001` eng behoben.
- Fehlende optionale Matchpunkte führen zu keiner clientseitigen Herleitung.
- Die kompakte Darstellung bleibt auch auf schmalen Viewports genau eine
  Zeile. Inhalt darf gekürzt werden; Status und Aktionsicons bleiben sichtbar.
- Fachlich widersprüchliche Änderungen auf einem weitergelaufenen `main`
  gelten als Blocker und werden nicht einseitig überschrieben.

## Sicherheitsblocker

- Matchpunkte würden im Client neu berechnet oder aus dem Gewinner erraten.
- Die kompakte Ansicht würde eine bisher erreichbare Aktion entfernen.
- Der öffentliche Payload müsste um private oder vollständige Spielzustände
  erweitert werden.
- Der finale Merge könnte fremde Änderungen im Hauptworkspace verwerfen.

## State Machine

```text
prepared
  -> GAMES-LIST-001 active
  -> implementation verified
  -> package committed
  -> final verification
  -> main merge
  -> worktree cleanup verified
  -> branch cleanup verified
  -> complete
```

## Paketfolge

| Paket          | Titel                                                | Commit-Vorschlag                           |
| -------------- | ---------------------------------------------------- | ------------------------------------------ |
| GAMES-LIST-001 | Matchpunkte und umschaltbare Spielelistendarstellung | `feat(web): add compact public games view` |

## Paketdetails

### GAMES-LIST-001 – Matchpunkte und umschaltbare Spielelistendarstellung

Ziel:

Die öffentliche Spieleliste zeigt bei abgeschlossenen Spielen die vorhandenen
Matchpunkte zusätzlich zu den Agenda-Punkten und lässt sich vollständig
zwischen der bestehenden ausführlichen sowie einer kompakten Zeilenansicht
umschalten.

Eingangsvoraussetzungen:

- Der bestehende `ApiMatchResultSnapshot` enthält optionale Matchpunkte für
  Runner und Korp.
- Filterung, Sortierung und direkte Aktionen der öffentlichen Spieleliste sind
  bereits produktiv.

Konkrete Arbeit:

- Reine Präsentationshelper für Agenda- und Matchpunktestand ergänzen und
  testen.
- Einen zugänglichen Umschalter `Ausführlich`/`Kompakt` im Listenheader
  ergänzen.
- Die Kartenkomponente über einen eindeutigen Darstellungsmodus steuern.
- Eine feste einzeilige kompakte Ansicht für offene, laufende und
  abgeschlossene Spiele gestalten.
- In beiden Ansichten vorhandene Matchpunkte explizit und Agenda-Punkte
  sekundär ausgeben.
- Bestehende Aktionen und Rejoin-Logik unverändert wiederverwenden.
- Prozess, Abschlussreview, Statuswissen und Projektlog aktualisieren, soweit
  die wiederverwendbare UI-Entscheidung dies erfordert.

Kernartefakte:

- `apps/web/features/games/PublicGamesPanel.tsx`
- `apps/web/features/games/public-games-model.ts`
- `apps/web/features/games/public-games-model.test.ts`
- `apps/web/app/globals.css`
- dieses Prozessartefakt und ein Abschlussreview

Checks:

- Paketnahe Vitest-Tests für Spielelistenmodell und relevante Navigation.
- Web-Typecheck.
- Web-/Repository-Formatcheck für geänderte Dateien.
- Browser-Smoke auf isolierten Ports nur, falls ohne Beeinträchtigung der
  Hauptinstanz und mit isolierter Datenbank möglich; andernfalls statische
  UI-/Build-Verifikation.
- `git diff --check`.

Done-Gate:

- Der Standard ist `Ausführlich`; der Umschalter meldet seinen Zustand
  zugänglich.
- `Kompakt` zeigt jede Statusklasse in einer festen 38-Pixel-Zeile ohne
  vertikalen Umbruch.
- Kompakte Aktionen erscheinen als Icons mit Tooltip und zugänglicher
  Beschriftung.
- Beide Modi bieten dieselben statusabhängigen Aktionen.
- Abgeschlossene Spiele zeigen vorhandene Matchpunkte und Agenda-Punkte
  getrennt und eindeutig.
- Snapshots ohne Matchpunkte bleiben korrekt darstellbar.
- Paketnahe Tests, Typecheck und Diff-Check sind grün.

## Verifikationsregeln

- Pure Formatierungs- und Fallbackregeln werden als Unit-Tests abgesichert.
- Die UI erhält keine alternative Matchpunktberechnung.
- Quelltests sichern Umschalter, Darstellungsmodus und unveränderte
  Navigationsziele ergänzend ab, wenn keine bestehende DOM-Testinfrastruktur
  für die Clientkomponente vorhanden ist.
- Ein Build- oder breiterer Webtest wird ausgeführt, wenn die lokale
  Laufzeitdauer im Verhältnis zum UI-Risiko vertretbar ist.

## Worktree-, Git- und Integrationsregeln

- Änderungen entstehen ausschließlich im dokumentierten Arbeits-Worktree.
- Das eine Paket endet nach grünen Checks mit genau einem Paketcommit.
- Ein weitergelaufenes `main` wird vor dem finalen Merge defensiv integriert.
- Der lokale Merge erfolgt bevorzugt per Fast-Forward.
- Nach erfolgreichem Merge werden Worktree und vollständig gemergter Branch
  ohne Force entfernt und sowohl in Git als auch im Dateisystem verifiziert.

## Controller-Prompt-Kern

Setze ausschließlich `GAMES-LIST-001` um. Bewahre Filterung, Sortierung,
Rejoin und alle direkten Aktionen. Rendere Matchpunkte nur aus dem
Ergebnis-Snapshot. Gestalte die kompakte Ansicht einzeilig, sehr niedrig und
zugänglich.
Committe erst nach grünem Done-Gate, merge danach lokal nach `main` und
schließe Worktree sowie Branch verifiziert auf.

## Abschlusskriterien

- Matchpunkte und Agenda-Punkte sind bei abgeschlossenen Spielen eindeutig.
- Ausführliche und kompakte Darstellung sind per Umschalter verfügbar.
- Offene, laufende und abgeschlossene Spiele funktionieren in beiden Modi.
- Tests, Typecheck und `git diff --check` sind grün.
- Paketcommit liegt auf dem Arbeitsbranch.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und Branch sind verifiziert entfernt.
- Das `/Goal` ist erst danach `complete`.

## Abschlussnachweis

`GAMES-LIST-001` wurde als ein gemeinsames Paket umgesetzt. Die öffentliche
Spieleliste startet weiterhin in `Ausführlich` und bietet daneben die
feste 38-Pixel-Zeilenansicht `Kompakt`. Beide Modi verwenden dieselbe
Kartenkomponente, Filterung und Aktionslogik. Abgeschlossene Einträge zeigen
vorhandene Matchpunkte primär und Agenda-Punkte sekundär; fehlen die optionalen
Matchpunktwerte in einem älteren Snapshot, wird keine Ersatzwertung erfunden.
In der kompakten Zeile bleiben Aktionen als Icon-Buttons mit Tooltip und
zugänglicher Beschriftung verfügbar.

Paketcommit: dieser Commit.

Grüne Checks:

- 15 gezielte Webtests in drei Testdateien
- `corepack pnpm --filter @netgrid/web typecheck`
- `corepack pnpm --filter @netgrid/web build`
- Live-Browser-Smoke: kompakt 38 Pixel, ausführlich 115 Pixel; alle kompakten
  Aktionsbuttons 28 × 28 Pixel mit Tooltip und `aria-label`
- Prettier-Prüfung aller Paketdateien
- `git diff --check`

Der lokale Main-Merge und der verifizierte Worktree-/Branch-Cleanup folgen
nach dem Paketcommit gemäß dem Abschlussvertrag dieses Prozesses.
