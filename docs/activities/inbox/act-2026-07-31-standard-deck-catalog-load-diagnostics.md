---
activityId: act-2026-07-31-standard-deck-catalog-load-diagnostics
status: inbox
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Standarddeck-Katalogfehler sichtbar und behebbar machen

## Ziel

Die Match-Erstellung darf einen fehlgeschlagenen Ladevorgang des öffentlichen
Standarddeck-Katalogs nicht mehr wie eine regulär leere Deckauswahl darstellen.
Gast- und Accountnutzer erhalten direkt an der Deckauswahl einen verständlichen,
diagnostizierbaren Fehlerzustand und können den Ladevorgang ohne Verlust ihrer
Startkonfiguration wiederholen.

## Kontext und Quellen

- Nutzerbeobachtung vom 31.07.2026: Auf dem Startbildschirm waren als Gast keine
  Standarddecks sichtbar; nach der Anmeldung erschienen nur die eigenen Decks.
- Der laufende Server lieferte gleichzeitig über
  `GET /api/decks/standards` weiterhin 42 aktive Standarddecks und 42 gültige
  Snapshots. Es lag daher kein Verlust der kuratierten Deckdaten vor.
- `apps/web/app/page.tsx` lädt Standarddecks unabhängig vom Account, verwirft
  bei jedem Fehler jedoch stillschweigend Decks und Snapshots und setzt beide
  Listen auf leer. Ein eigener Fehlerzustand oder Retry fehlt.
- `apps/web/features/account/account-deck-client.ts` lädt den Katalog direkt
  vom konfigurierten NETGRID-Server. Accountdecks und Standarddecks sind
  getrennte Requests; deshalb kann die Accountbibliothek gesund aussehen,
  während der Standarddeck-Katalog ausgefallen ist.
- Die globale Anzeige `Verbunden` beschreibt die Match-/Transportverbindung
  und ist kein Nachweis dafür, dass der Standarddeck-Katalog erfolgreich
  geladen wurde.
- Beim beobachteten lokalen Vorfall lief `next dev` weiter, während ein
  Produktions-Build das gemeinsame `.next`-Verzeichnis aktualisierte. Das ist
  ein plausibler Auslöser des inkonsistenten Webzustands, aber kein Grund, der
  Nutzungsoberfläche ohne echte Evidenz pauschal einen Versionskonflikt zu
  melden.

## Scope

- Für den Standarddeck-Katalog einen expliziten Ladezustand modellieren:
  `loading`, `ready` und `error`, einschließlich des letzten fehlgeschlagenen
  Versuchs.
- Einen initialen Katalogfehler nicht mehr durch kommentarloses Leeren von
  `standardDecks` und `deckSnapshots` verschlucken.
- Einen fehlenden oder fachlich unbrauchbaren Erfolgs-Payload erkennen. Ein
  erfolgreicher Katalog muss mindestens je einen gültigen Runner- und
  Korp-Snapshot enthalten; andernfalls ist er für die Match-Erstellung nicht
  `ready`.
- Direkt im Match-Startbereich bei den betroffenen Deckfeldern eine kompakte
  Fehlermeldung mit der Aktion `Standarddecks erneut laden` anzeigen.
- Der Retry läuft ohne kompletten Seitenreload und erhält die bereits gewählten
  Startoptionen sowie verfügbare persönliche Decks.
- Hängende Requests über einen begrenzten Timeout in einen sichtbaren
  Fehlerzustand überführen; parallele oder veraltete Ladeergebnisse dürfen
  keinen neueren erfolgreichen Stand überschreiben.
- Sanitizte Diagnosedetails zugänglich machen: Server-Origin, Zeitpunkt,
  Versuchszähler, HTTP-Status und stabiler Fehlercode beziehungsweise
  Netzwerk-/Timeout-Kategorie. Keine Cookies, Tokens, Header, Request-Bodies
  oder vollständigen Response-Bodies anzeigen oder persistieren.
- Einen konkreten lokalen Handlungshinweis geben, wenn Retry und Seitenreload
  nicht helfen: Webclient über den regulären Startpfad neu starten. Einen
  Frontend-/Backend-Versionskonflikt nur nennen, wenn er tatsächlich durch ein
  belastbares Signal nachgewiesen wurde.
- Die Match-Erstellung nur für Deckplätze blockieren, die einen Standard- oder
  Zufallsstandard benötigen, solange dafür keine Kandidaten verfügbar sind.
  Ein angemeldeter Nutzer darf mit zwei gültigen persönlichen Decks weiterhin
  starten.
- Gast- und Accountzustand verwenden denselben öffentlichen Katalogzustand;
  eine Anmeldung allein darf den Standarddeckfehler weder verdecken noch als
  regulär leere Standardauswahl erscheinen lassen.

## Nicht im Scope

- Keine Änderungen an Inhalt, Kuration, Validierung oder Snapshots der
  Standarddecks.
- Kein Umbau der Accountdeck-Bibliothek und keine Änderung ihrer
  Authentifizierungs- oder Speicherverträge.
- Kein allgemeines Health-Dashboard und kein neuer systemweiter
  Frontend-/Backend-Versions-Handshake.
- Keine automatische Beendigung oder Neustartsteuerung lokaler Prozesse aus
  der Weboberfläche.
- Keine Änderung an Engine, LegalActions, Replay, StateHash oder
  Hidden-Info-Verträgen.
- Die Isolation von `next build` und einem gleichzeitig laufenden `next dev`
  ist ein separates Betriebs-/Tooling-Thema und wird nicht in diesen
  UI-Schnitt hineingezogen.

## Akzeptanzkriterien

- [ ] Ein erfolgreicher Katalog mit gültigen Runner- und Korp-Snapshots zeigt
  die Standarddecks für Gäste und Accountnutzer wie bisher an.
- [ ] Netzwerkfehler, HTTP-Fehler, Timeout und fachlich unbrauchbarer
  Erfolgs-Payload erzeugen einen sichtbaren Katalogfehler statt einer
  scheinbar regulär leeren Standarddeckliste.
- [ ] Die Fehlermeldung steht im Match-Startbereich an den betroffenen
  Deckauswahlen und bleibt von der allgemeinen Anzeige `Verbunden` eindeutig
  getrennt.
- [ ] `Standarddecks erneut laden` kann nach einem Fehler erfolgreich laden,
  entfernt danach den Fehlerzustand und erhält die übrigen Startoptionen.
- [ ] Ein später fehlgeschlagener Refresh löscht keinen zuvor erfolgreich
  geladenen, weiterhin nutzbaren Katalog; der veraltete Stand und der
  Refresh-Fehler werden unterscheidbar angezeigt.
- [ ] Standard-/Zufallsstandard-Starts ohne Kandidaten werden mit konkreter
  Begründung verhindert; zwei gültige persönliche Decks bleiben für
  Accountnutzer nutzbar.
- [ ] Diagnosedetails enthalten nur Server-Origin, Zeitpunkt,
  Versuchszähler, Status und sanitizte Fehlerkategorie und leaken keine
  Zugangsdaten oder Response-Inhalte.
- [ ] Web-Regressionstests decken mindestens Gastfehler, Accountfehler mit
  weiterhin sichtbaren persönlichen Decks, Timeout, erfolgreichen Retry,
  Erhalt eines letzten gültigen Katalogs und die Startblockade ab.
- [ ] Web-Typecheck, relevante Web-Tests, Web-Build und
  `format:changed` sind erfolgreich.

## Umsetzungshinweise

- Primärer Owner ist `small-adjustments-agent`; der Schnitt bleibt im Webclient
  und erweitert nicht den Serververtrag, solange die vorhandene Antwort
  ausreichend ist.
- Den Katalog-Ladeablauf möglichst aus `apps/web/app/page.tsx` in einen kleinen,
  fokussiert testbaren State-/Request-Helper oder Hook ziehen, statt weitere
  lose Booleans und Notices in die Seite einzubauen.
- `AccountClientError` kann HTTP-Status und stabilen Fehlercode liefern.
  Netzwerkfehler und Abbruch/Timeout benötigen eine eigene sanitizte
  Klassifikation.
- Der sichtbare Hinweis soll den tatsächlichen Befund benennen
  (`Standarddecks konnten nicht geladen werden`) und nicht spekulativ
  `Versionen passen nicht zusammen` behaupten.
- Das vorhandene `DeckSlotSelect` sollte einen klaren Availability-/Fehlertext
  erhalten, ohne die allgemeine Matchtransport-Anzeige umzudeuten.

## Ergebnisnotiz

Noch offen.
