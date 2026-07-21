# Final Review: Spielprotokoll-Export

Stand: 2026-07-21
Status: freigabefähig

## Ergebnis

Abgeschlossene Matches können als Markdown-Spielprotokoll heruntergeladen
werden. Der Endpunkt lautet:

`GET /api/replays/:matchId/gamebook`

Das Dokument verwendet ausschließlich Spielbegriffe. Es enthält keine
technischen Kennungen, Hashes, Dateipfade, Sessions oder Debugdaten.

## Produktvertrag

- Die Spielvorbereitung nennt beide Starthände sowie Mulligans und neue
  Starthände.
- Jeder Zug beginnt genau einmal mit Hand und Credits der aktiven Seite.
- Pflicht- und Standardziehungen nennen die gezogene Karte.
- Handlungen sind nach Aktionen gegliedert; mehrklickige Handlungen erhalten
  eine gemeinsame Aktionsüberschrift.
- Karten spielen, Installationen, Server, ICE-Positionen, Credits, Access,
  Advancement, Scoring, Rezzes und weitere aufgezeichnete Reaktionen erscheinen
  in ihrer tatsächlichen Reihenfolge.
- Reaktionen der Korp in einem Runner-Run bleiben im Runner-Zug; sie eröffnen
  keinen künstlichen Korp-Zug.
- Öffentliche terminale Spiele sind wie die bestehenden Full-Information-
  Replays anonym abrufbar. Private Spiele benötigen eine gültige
  Teilnehmersession. Aktive Spiele sind ausgeschlossen.

## Technische Grundlage

Der Export legt keinen zweiten Ereignis- oder Debugspeicher an. Er verwendet
die bereits autoritativ persistierten Engine-Ereignisse einschließlich der
serverseitigen Aktionsbelege und die Voraktions-Snapshots. Damit können
Kartenidentitäten, Ziehungen, Bewegungen, Creditstände und Reaktionen aus
tatsächlich gespeicherten Spielfakten dargestellt werden.

## Verifikation

Bestanden:

- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`
- `git diff --check`

Der HTTP-Test prüft zusätzlich Markdown-Content-Type, Dateianhang,
Spielvorbereitung, Zugprotokoll und das Fehlen von Secrets und internen
Speicherfeldern. Eine lokale Vorschau gegen ein echtes abgeschlossenes Match
bestätigte die erwartete Folge aus Starthand, Mulligan, Pflichtziehung,
Aktionen, Run-Reaktionen und Kartenauflösungen.

## Nicht-Ziele

- Kein Export laufender Spiele.
- Kein Import und keine neue Replay- oder Regelautorität.
- Keine KI-Scoring- oder DecisionDebug-Ausgabe.
- Keine Darstellung von Tokens, Sessions, Accountkennungen oder lokalen
  Speicherinformationen.
