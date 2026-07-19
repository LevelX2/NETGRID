---
processId: process-2026-07-19-deck-table-numeric-sort-fix
status: in_progress
sourceActivity: act-2026-07-19-decktable-corp-cost-sort-clarity
primaryAgent: release-implementation-agent
branch: codex/deck-table-numeric-sort-fix
worktree: C:\Projekte\NETGRID_DECK_TABLE_NUMERIC_SORT_FIX
startedAt: 2026-07-19
completedAt:
---

# Zahlenbasierte Decktisch-Sortierung dauerhaft instand setzen

## Quelle/Vorgabe

Der Nutzer hat wiederholt beobachtet, dass ICE im Decktisch trotz ausgewählter
Sortierung nach Rez-Kosten oder Stärke alphabetisch stehen bleiben. Der
Screenshot belegt den Namens-Fallback. Der Fehler besteht laut Nutzer auch nach
20 Minuten und darf daher nicht als normale Detail-Ladezeit behandelt werden.

## Zielprüfung

Die Vorgabe ist für eine direkte Umsetzung ausreichend präzise. Der erwartete
Endzustand, die betroffenen Webmodule, die Nicht-Ziele und die prüfbaren
Sortierergebnisse sind aus dem Nutzerfund und der bestehenden Activity
`act-2026-07-19-decktable-corp-cost-sort-clarity` bestimmbar.

## Gesamtziel

Numerische Decktisch-Sortierungen erhalten die benötigten Kartendetails
zuverlässig und unabhängig von einem möglicherweise hängenden globalen
Detail-Ladevorgang. Rez-Kosten und Stärke sortieren ICE dauerhaft nach dem
gewählten Zahlenwert; fehlende Werte führen nicht unbemerkt zu einer dauerhaft
alphabetischen Darstellung. Für ICE irreführende Installkosten werden in der
Korp-Oberfläche nicht als scheinbar funktionsfähige ICE-Kostensortierung
angeboten.

## Annahmen

- Der Screenshot zeigt einen echten alphabetischen Fallback bei ausgewählter
  Rez-Kosten-Sortierung.
- Eine Ladezeit von mehr als 20 Minuten ist ein Fehlerzustand und kein
  akzeptabler Zwischenzustand.
- Kartendetails des aktuell gewählten Decks haben Vorrang vor dem Vorladen des
  gesamten spielbaren Katalogs.
- Fehlende numerische Werte bleiben deterministisch am Ende; Gleichstände
  werden nach Typ und Name aufgelöst.

## Nicht-Ziele

- Keine Änderung von Kartenwerten oder Engine-Regeln.
- Kein Redesign des Deckeditors.
- Keine Änderung an LegalActions, Hidden-Info, Replay oder StateHash.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Änderungen erfolgen ausschließlich im Prozess-Worktree.
- Jedes Paket erhält eigene Checks, `git diff --check` und einen Commit.
- Rote relevante Tests blockieren das nächste Paket.
- Fremde Änderungen und andere Worktrees bleiben unberührt.

## Automatische Fehlerbehandlung

- Einen fehlgeschlagenen fokussierten Test eng am betroffenen Modul debuggen.
- Netzwerk- oder Browserdiagnosen dürfen keine Nutzdecks verändern.
- Bei einem fachlichen Widerspruch zwischen Sortierlabel und Kartenfeld wird
  die sichtbare Option an die vorhandene Feldsemantik angepasst, nicht das
  Kartenmodell umgedeutet.

## Sicherheitsblocker

Hidden-Info-, Engine- oder Datenmodelländerungen außerhalb lokaler
Katalogdetails sind nicht erforderlich. Sollte die Behebung eine solche
Grenze berühren, stoppt der Prozess. Removal Condition: ein nachgewiesener
minimaler Web-UI-/Katalogdetail-Pfad ohne Regelautoritätsänderung.

## State Machine

`P0_PROCESS -> P1_DATA_PATH -> P2_UI_CONTRACT -> P3_CLOSEOUT -> MERGED -> CLEANED`

Bei einem nicht erfüllten Done-Gate verbleibt der Prozess im aktuellen Zustand.

## Paketfolge

1. `P0_PROCESS` – Prozessartefakt und isolierten Arbeitsvertrag anlegen.
2. `P1_DATA_PATH` – dauerhaften Namens-Fallback reproduzieren und die
   Kartendetail-Lieferung des aktuellen Decks robust machen.
3. `P2_UI_CONTRACT` – side-gerechte Sortieroptionen und nachvollziehbaren
   Lade-/Fehlervertrag absichern.
4. `P3_CLOSEOUT` – Activity und Prozessdokumentation abschließen, final
   verifizieren und lokal integrieren.

## Paketdetails

### P0_PROCESS – Prozessvertrag

- Ziel: Worktree, Branch, Scope und Gates verbindlich dokumentieren.
- Eingangsvoraussetzungen: sauberer Hauptworkspace; freier Zielpfad und Branch.
- Kernartefakt: dieses Prozessdokument.
- Checks: `git status --short`, `git diff --check`.
- Done-Gate: Prozessartefakt ist vollständig und separat committed.
- Commit: `docs(ui): define deck table numeric sort fix process`

### P1_DATA_PATH – Kartendetails und Zahlen-Sortierung

- Ziel: Ein hängender oder langsamer Katalog-Prefetch darf Details des aktuellen
  Decks und damit Rez-/Stärke-Sortierungen nicht dauerhaft blockieren.
- Arbeit: Detail-Ladepfad und Deckauswahl analysieren; fokussierte
  Regressionstests ergänzen; Details des aktuellen Decks priorisiert und
  fortschreitend übernehmen; Comparator-Vertrag absichern.
- Kernartefakte: `apps/web/features/catalog/`, `apps/web/app/page.tsx`,
  `apps/web/features/decks/deck-table-model.ts` und fokussierte Tests.
- Checks: betroffene Vitest-Suites, Web-Typecheck, `git diff --check`.
- Done-Gate: Ein absichtlich hängender Detailabruf blockiert erfolgreiche
  Deckkartendetails nicht; das ICE-Muster sortiert nach Rez und Stärke korrekt.
- Commit: `fix(web): unblock deck table numeric sorting details`

### P2_UI_CONTRACT – sichtbarer Sortiervertrag

- Ziel: Numerische Sortierungen dürfen fehlende Details nicht als scheinbar
  erfolgreiche Namenssortierung präsentieren; Korp-/Runner-Optionen entsprechen
  den vorhandenen Kostenfeldern.
- Arbeit: Optionen side-gerecht ableiten, Ladebereitschaft zugänglich darstellen
  oder numerische Auswahl bis zur Deckdetail-Bereitschaft sperren und UI-Tests
  ergänzen.
- Kernartefakte: `DeckEditorPanel.tsx`, `DeckTableBoard.tsx` und Tests.
- Checks: fokussierte Tests, Web-Typecheck, `git diff --check`.
- Done-Gate: Rez/Stärke funktionieren global und pro Stapel; Korp-ICE wird nicht
  irreführend über Installkosten sortiert; der Ladezustand ist eindeutig.
- Commit: `fix(web): clarify deck table numeric sort availability`

### P3_CLOSEOUT – Abschluss und Integration

- Ziel: belastbaren Abschlussstand dokumentieren und nach `main` integrieren.
- Arbeit: bestehende Activity nach `done` überführen, Ergebnis und Checks
  dokumentieren, Prozessstatus abschließen, finale Checks durchführen.
- Checks: fokussierte Tests, Web-Typecheck, `git diff --check`, sauberer Branch.
- Done-Gate: alle Akzeptanzkriterien erfüllt; Arbeitsbranch nach aktuellem
  `main` verifiziert; lokaler Merge, Worktree- und Branch-Cleanup nachgewiesen.
- Commit: `docs(ui): close deck table numeric sort fix process`

## Verifikationsregeln

- Fokussierte Unit-Tests müssen vollständige Details, verspätete Details,
  mindestens einen dauerhaft hängenden Fremdabruf, fehlende Zahlenwerte und
  deterministische Gleichstände abdecken.
- Der Web-Typecheck muss bestehen.
- Browserprüfung verwendet ausschließlich ein diagnostisches Wegwerfdeck und
  entfernt es anschließend wieder.
- Jeder Paketabschluss enthält `git diff --check`.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/deck-table-numeric-sort-fix`
- Arbeits-Worktree: `C:\Projekte\NETGRID_DECK_TABLE_NUMERIC_SORT_FIX`
- Hauptworkspace: `C:\Projekte\NETGRID`, ausschließlich für finalen Merge und
  Abschlussprüfung.
- Bevorzugter Merge: Fast-Forward nach lokalem `main`.
- Nach erfolgreichem Merge: Arbeits-Worktree ohne `--force` entfernen,
  Entfernung in Git und Dateisystem prüfen, gemergten Branch mit `git branch -d`
  löschen.

## Controller-Prompt-Kern

`/Goal Arbeite den Prozess deck-table-numeric-sort-fix vollständig und
sequenziell von P0_PROCESS bis P3_CLOSEOUT ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies AGENTS.md, AGENTS.local.md, die verpflichtenden
Wiki-Einstiege und dieses Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_DECK_TABLE_NUMERIC_SORT_FIX auf Branch
codex/deck-table-numeric-sort-fix. Arbeite immer nur am aktuellen Paket, führe
Paketchecks und git diff --check aus und committe jedes abgeschlossene Paket.
Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen,
Arbeits-Worktree und gemergten Branch verifiziert entfernen und das Goal erst
dann als complete markieren.`

## Abschlusskriterien

- Der Screenshotfall kann nicht dauerhaft alphabetisch bleiben, sobald die
  Details der Deckkarten erreichbar sind.
- Ein hängender Katalogabruf blockiert andere Kartendetails nicht.
- Rez-Kosten und Stärke sind mit konkreten ICE-Folgen getestet.
- Kostenoptionen sind side-gerecht und während fehlender Details eindeutig.
- Alle Paketcommits sind lokal nach `main` integriert.
- Arbeits-Worktree und Arbeitsbranch sind nachweislich entfernt.
