# Matchstart Entry UX 1.1.2 Spec

Stand: 2026-05-07
Status: Spezifikation eingefroren

## Zweck

Diese Spezifikation beschreibt Track B von V1.1.2. Der Spielstart soll als klare NETGRID-Startkonsole wirken statt als lange Liste gleichrangiger Optionen. Die Änderung ist reine Web-UI-Arbeit und darf den Matchstart-Serververtrag, Engine-State, Replay, StateHash, Kartenpool und Sicherheitsgrenzen nicht verändern.

## Ausgangszustand

Aktuell zeigt der Spiel-Reiter im Startscreen:

- Tabs `Match erstellen` und `Beitreten`.
- Bei Match erstellen eine `formGrid` mit `Spielart`, Seitenwahl, Spielziel, Name, Countdown, Testkonstellation, KI-Schwierigkeiten, Seed, KI-Deckpolitik, Deckslots und Primärbutton.
- Bei Beitreten getrennte Felder `Match` und `Token`.

Das ist funktional, aber nicht kuratiert. Für die erste Produktwahrnehmung sollen nur die primären Entscheidungen sichtbar sein; Sonderfälle bleiben erreichbar.

## Informationsarchitektur

### Oberstruktur

Der bestehende Einstieg bleibt:

- Hauptreiter `Spiel`, `Katalog`, `Meine Decks`, `Optionen`.
- Innerhalb `Spiel`: `Match erstellen` und `Beitreten`.

Keine Landingpage, kein Marketing-Hero, keine Startseite ohne direkte Bedienung.

### Match erstellen

Reihenfolge:

1. Spielart-Kacheln.
2. Format-Kacheln.
3. Primäre Eingaben.
4. Startzusammenfassung.
5. Primärbutton.
6. Erweiterte Optionen.

### Beitreten

Reihenfolge:

1. Join-Link.
2. Name.
3. eigene Runner-/Korp-Decks.
4. Primärbutton.
5. Manuelle Eingabe.

## Spielart-Kacheln

### Kacheln

| State | Titel | Zusatztext | Icon |
| --- | --- | --- | --- |
| `human_vs_human` | `Privates Duell` | `Zwei Menschen per Link` | `Link2` oder `UserPlus` |
| `human_vs_ai` | `Gegen KI` | `Schnelles Spiel gegen eine KI-Seite` | `Bot` |
| `ai_vs_ai` | `Simulation` | `KI gegen KI zum Beobachten und Testen` | `Activity` oder `Sparkles` |

### Verhalten

- Default bleibt `human_vs_human`.
- Kachel klickt nur `setPlayMode`.
- Ableitung bleibt in `deriveMatchStart`.
- Keine neue persistierte Server-Mode-Variante.
- `ai_vs_ai` bleibt Simulation, nicht normales Multiplayer-Match.

### Accessibility

- Kacheln sind echte Buttons oder Radios.
- Aktive Kachel hat `aria-pressed` oder `aria-checked`.
- Fokuszustand ist sichtbar.
- Text passt bei schmalen Viewports.

## Format-Kacheln

| State | Titel | Zusatztext |
| --- | --- | --- |
| `rules_match` | `Regelmatch` | `7 Agendapunkte, ein Spiel` |
| `two_game_side_swap` | `Matchserie` | `Zwei Spiele mit Seitenwechsel` |

Regeln:

- Default bleibt `rules_match`.
- `Einzelspiel · Deckziel` bleibt entfernt.
- Format-Kacheln setzen nur `matchFormat`.

## Primärfluss Human-vs-Human

Sichtbar:

- Name.
- Teilnehmer A Runner-Deck.
- Teilnehmer A Korp-Deck.
- Hinweis: `Teilnehmer B wählt eigene Decks beim Beitritt.`
- Format.
- Startzusammenfassung.
- Button `Lobby erstellen`.

Eingeklappt:

- Seitenzuteilung.
- Countdown.
- Seed.
- Testkonstellation.
- Teilnehmer-B-Deckslots bei Testkonstellation.

## Primärfluss Human-vs-KI

Sichtbar:

- Name.
- Deine Seite: `Auslosen`, `Runner`, `Korp`.
- eigene benötigte Deckslots.
- KI-Kurzstatus, z. B. `KI-Stufe: Normal`.
- Format.
- Startzusammenfassung.
- Button `Match erstellen`.

Eingeklappt:

- getrennte Runner-/Korp-KI-Schwierigkeit, falls beide sichtbar werden müssen.
- KI-Deckpolitik.
- explizite KI-Deckslots bei `selected`.
- Seed.

## Primärfluss Simulation

Sichtbar:

- Simulation als aktive Spielart.
- Runner-KI und Korp-KI.
- KI-Deckpolitik.
- Button `Simulation starten`.
- Simulationsergebnis wie bisher.

Eingeklappt:

- Seed und seltene Diagnoseoptionen.

## Erweiterte Optionen

Der Bereich heißt sichtbar `Erweiterte Optionen`.

Er darf als `<details>` oder eigenes Disclosure umgesetzt werden. Er muss:

- tastaturbedienbar sein,
- Zustand stabil halten,
- keine Layoutsprünge im Standardfluss verursachen,
- auf Mobil sauber unter den Primäreingaben liegen.

## Beitreten per Join-Link

### Primärfeld

Feld:

- Label: `Join-Link`
- Test-ID: `join-link-input`

Parser:

- Akzeptiert absolute oder relative URLs mit `matchId` und `joinToken`.
- Ignoriert zusätzliche unbekannte Query-Parameter.
- Trimmt Whitespace.
- Bei ungültiger Eingabe bleibt manuelle Eingabe möglich und zeigt nur eine neutrale Fehlermeldung.

### Manuelle Eingabe

Disclosure:

- Label: `Manuell eingeben`.
- Felder `Match` und `Token` bleiben.
- Test-ID: `manual-join-options`.

### Sicherheitsregeln

- Join-Link darf im Input sichtbar sein, aber nicht in Recent Session, Summary, Notice oder Log kopiert werden.
- `rememberRecentSession` darf weiterhin keine Tokens speichern.
- Leak-Scans prüfen DOM/Storage gegen Token-Kopien außerhalb erlaubter Eingabefelder.

## Startzusammenfassung

Test-ID: `match-start-summary`.

Beispiele:

- `Privates Duell`
- `Seite wird ausgelost`
- `Regelmatch bis 7 Agendapunkte`
- `Teilnehmer B wählt Decks beim Beitritt`

Für Human-vs-KI:

- `Gegen KI`
- `Deine Seite wird ausgelost`
- `KI-Decks: Standard`
- `Regelmatch bis 7 Agendapunkte`

Nicht anzeigen:

- gegnerische Decknamen,
- Deckhashes,
- Kartentitel aus verdeckten Zonen,
- Join-/Session-/Reconnect-Tokens,
- raw Match-IDs, sofern nicht ausdrücklich in manuellem Diagnosekontext.

## Visuelles Design

Ziel: private NETGRID-Konsole.

Erlaubt:

- dezente CSS-Linien-/Rasterstruktur,
- bestehendes NETGRID-Branding,
- Lucide Icons,
- Runner-/Korp-Akzente,
- flache Panels mit 8px Radius.

Nicht erlaubt:

- offizielle Netrunner-/NSG-Assets,
- Cardbacks,
- Cardframes,
- Marketing-Hero,
- rein dekorative große Bildflächen,
- verschachtelte Karten-in-Karten-Strukturen.

## CSS- und Layout-Regeln

- Kachelgrid: Desktop 3 Spalten für Spielart, mobil 1 Spalte.
- Format: Desktop 2 Spalten, mobil 1 Spalte.
- Stabile Mindesthöhe für Kacheln.
- Kein Font-Scaling mit Viewportbreite.
- Keine negativen Letter-Spacings.
- Text darf nicht über Button-/Kachelgrenzen laufen.
- Schmaler Viewport 390x844 muss ohne horizontales Scrollen bedienbar bleiben.

## Test-IDs

Beizubehalten:

- `setup-screen`
- `create-match`
- `join-match`

Neu:

- `play-mode-human-vs-human`
- `play-mode-human-vs-ai`
- `play-mode-ai-vs-ai`
- `match-format-rules-match`
- `match-format-series`
- `advanced-match-options`
- `join-link-input`
- `manual-join-options`
- `match-start-summary`

## Umsetzungshinweise

Empfohlen:

- Reine Helper in `apps/web/app/match-start.ts`:
  - `matchStartSummary`
  - `playModeCardLabel`
  - `matchFormatCardLabel`
  - `parseJoinLinkInput`
- Kleine lokale UI-Komponenten in `page.tsx` oder neue Datei `match-start-ui.tsx`, falls `page.tsx` sonst weiter unübersichtlich wird.
- E2E-Helfer nicht mehr über `getByLabel("Spielart").selectOption`, sondern über Test-IDs.

## Done

Track B ist done, wenn:

- der Standard-Startscreen auf den ersten Blick Spielart, Format, Name, Decks und Primäraktion zeigt,
- Sonderoptionen erreichbar, aber nicht dominant sind,
- Beitreten per Join-Link funktioniert,
- alle bisherigen Flows weiter grün sind,
- kein Hidden-Info- oder Token-Leak entsteht,
- Visual QA auf Desktop/Tablet/schmalem Viewport bestanden ist.
