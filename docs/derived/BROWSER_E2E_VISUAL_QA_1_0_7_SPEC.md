# Browser-E2E und Visual QA 1.0.7 Spezifikation

Stand: 2026-05-06
Status: requirements_spec

## Zweck

Diese Spezifikation beschreibt den technischen Zielzustand für V1.0.7. Der Release macht Browser- und Layoutprüfungen wiederholbar, ohne die Spielregeln oder den Produktumfang zu erweitern.

## Werkzeugmodell

Primäre Empfehlung: Playwright.

Begründung:

- zwei unabhängige Browser-Kontexte sind für Human-vs-Human-Smokes notwendig,
- Viewport-Größen sind zuverlässig setzbar,
- Screenshots, Traces und DOM-Prüfungen sind lokal reproduzierbar,
- der bisherige In-App-Browser konnte den schmalen Viewport-Smoke nicht zuverlässig ausführen.

Falls Playwright beim Umsetzen technisch blockiert, ist ein gleichwertiger Browser-Automationspfad zulässig, wenn er zwei Kontexte, Viewports, Screenshots und DOM-Prüfungen reproduzierbar abdeckt.

## Gate-Befehl

Der Umsetzungsschnitt soll einen klaren lokalen Gate-Befehl bereitstellen, zum Beispiel:

```txt
corepack pnpm e2e
```

oder:

```txt
corepack pnpm test:e2e
```

Der genaue Name wird in der Umsetzung festgelegt und im Final Review dokumentiert. Wichtig ist, dass der Befehl nicht mit den normalen Unit-/Contract-Tests verwechselt wird.

## Server- und Web-Harness

Der Browser-Gate braucht:

- Web-App auf einer lokalen URL.
- Multiplayer-Server auf einer lokalen URL.
- deterministische Seeds für Testmatches.
- isolierte Runtime-Datei oder In-Memory-/Temp-Storage für Testläufe.
- sauberes Beenden gestarteter Prozesse.

Mindestanforderung an Testdaten-Isolation:

- Der E2E-Lauf darf nicht in die normale Datei `data/runtime/multiplayer/matches.json` schreiben.
- Testartefakte dürfen unter ignorierten Pfaden wie `test-results/`, `playwright-report/` oder einem temporären Laufzeitordner entstehen.
- Tokens dürfen in Reports nicht als sichtbare Produktdaten erscheinen; falls technische Traces sie enthalten, gelten die Artefakte als lokale Testartefakte und werden nicht versioniert.

## Teststruktur

Empfohlene Struktur:

```txt
tests/e2e/
  netgrid-smoke.spec.ts
  helpers/
    app-harness.ts
    match-flow.ts
    leak-scan.ts
```

Die genaue Struktur darf abweichen, solange die Zuständigkeiten getrennt bleiben:

- Harness: Start/Stop, URLs, Storage-Isolation.
- Match-Flows: Browserhandlungen und REST-/WebSocket-Hilfen.
- Leak-Scan: DOM-, Storage-, Payload- und Screenshot-nahe Prüfungen.

## Browser-Kontexte

Human-vs-Human-Flows müssen mindestens zwei getrennte Browser-Kontexte verwenden:

- Host-Kontext mit eigener Storage-Isolation.
- Joiner-Kontext mit eigener Storage-Isolation.

Ein zweiter Tab im selben Kontext reicht nicht für alle Session-/Storage-Fragen aus. Für einzelne UI-Checks darf ein zweiter Tab zusätzlich genutzt werden.

## Viewport-Matrix

Mindestmatrix:

| Viewport | Größe | Pflichtflows |
| --- | --- | --- |
| Desktop | 1280x720 | Human-vs-KI, Human-vs-Human, Board, Card Display |
| Tablet | 1024x768 | aktive Spieloberfläche, RunTimeline, Server, Action Panel |
| Schmal | 390x844 | Textfit, Cues, Actions, Card Preview, RunTimeline |

Für jeden Viewport muss der Gate mindestens eine aktive Spielsituation prüfen. Der schmale Viewport muss explizit den offenen V1.0.6-Restpunkt abdecken.

## Flow A: Human-vs-KI

Pflichtschritte:

1. Web-App öffnen.
2. Human-vs-KI starten, bevorzugt mit menschlicher Runner-Seite und festem Seed.
3. Aktives Spiel erreichen.
4. Prüfen:
   - `Aktionen`-Anzeige ist sichtbar.
   - Credit-Badge ist sichtbar und unterscheidbar.
   - Kostenchips erscheinen an mindestens einer Aktion.
   - KI-Takt ist sichtbar und nicht rohes `paced`.
5. Eine menschliche Aktion ausführen.
6. KI-Schritt oder KI-Cue beobachten.
7. Prüfen:
   - Cue leakt keine verdeckte Karte.
   - alte Cues werden nicht beim Reload nachgespielt.

## Flow B: Human-vs-Human

Pflichtschritte:

1. Host-Kontext erstellt ein Human-vs-Human-Match.
2. Join-Link wird aus der UI oder API entnommen.
3. Joiner-Kontext öffnet den Join-Link.
4. Joiner wählt Decks und tritt bei.
5. Beide Seiten sehen Startbereitschaftslobby.
6. Beide Seiten setzen Ready.
7. Countdown führt in ein aktives Spiel.
8. Prüfen:
   - Gegnernamen sind side-sicher sichtbar.
   - keine Decklisten oder Deckhashes erscheinen.
   - Recent Sessions enthalten keine Tokens.

## Flow C: Lifecycle und Reconnect

Pflichtabdeckung:

- Pending Match abbrechen.
- Aus terminalem Zustand neu erstellen.
- Joiner verlässt Lobby.
- Aktives Spiel aufgeben.
- Host oder Joiner lädt neu und nutzt Fortsetzen/Reconnect.
- Lokales Verwerfen entfernt nur lokale Session-Referenz.

Der Flow darf aus mehreren Tests bestehen, damit einzelne Fehler klarer diagnostiziert werden.

## Flow D: Board, Run und Kontextaktionen

Pflichtabdeckung:

- zentrale Server sind sichtbar und unterscheidbar.
- direkter Server-Run-Button, falls legal, ist bedienbar und zeigt Kosten kompakt.
- ein Run-Zielrahmen markiert genau den angegriffenen Server.
- RunTimeline zeigt deutsche Labels.
- Runner-Rig ist gruppiert.
- Breaker-/Rig-Actions erscheinen nicht als unverständliche flache Aktionsliste, wenn sie kartenbezogen sind.
- Rez-/Unrez-Zustand bleibt side-sicher.

## Flow E: Card Display und aktuelle UI-Details

Pflichtabdeckung:

- Bild-, Text- und Kompaktmodus sind umschaltbar.
- Textmodus erzeugt keine große leere Art-Fläche.
- Kompaktmodus spart Platz und Regeltext bleibt per Fokus/Hover erreichbar.
- Stärke-Bonusmarke ist lesbar, falls ein Testzustand sie erzeugt.
- Tooltips bleiben im Viewport.
- verdeckte Karten zeigen keine Titel, IDs, Bilder, Card-Backs oder spezifischen Tooltips.

## Leak-Scan-Regeln

Mindestens zu scannen:

- DOM-Text,
- `src`, `alt`, `title`, `aria-label`, `aria-describedby`,
- bekannte lokale Storage Keys,
- sichtbare Netzwerkpayloads, soweit Playwright sie sinnvoll abfangen kann,
- WebSocket-Nachrichten, falls der Test sie beobachtet.

Gesperrte Begriffe oder Muster in falscher Sicht:

- `sessionToken`,
- `reconnectToken`,
- `joinToken`,
- `hostSessionToken`,
- `hostReconnectToken`,
- `cardInstances`,
- `privatePayload`,
- `decklist`,
- `deckHash`,
- `cardDefinitionId` für verdeckte gegnerische Karten,
- `/api/card-images/back_`,
- konkrete verdeckte Kartentitel.

Die Liste ist bewusst nicht abschließend. Implementation Review und Final Review müssen dokumentieren, welche konkreten Muster geprüft wurden.

## Visual-QA-Regeln

V1.0.7 nutzt keine harten pixelgenauen Goldens. Stattdessen gilt:

- Screenshots/Traces werden für Diagnose erzeugt.
- Layoutfehler werden über sichtbare Elemente, Bounding Boxes, Textüberlauf und Überlappung geprüft.
- Text in Buttons, Chips, Slots, Tooltips, Preview, Cue und Panels darf nicht unlesbar auslaufen.
- Cues dürfen wichtige Entscheidungen nicht dauerhaft verdecken und müssen dismissbar bleiben.
- Schmale Viewports dürfen auf Stapelung/Scroll umstellen, aber nicht zentrale Aktionen unerreichbar machen.

## Testselektoren

Stabile Testselektoren sind zulässig:

- bevorzugt `data-testid`,
- nur für interaktive oder wiederkehrende Testziele,
- keine verdeckten Daten im Selektorwert,
- keine technischen Produktlabels für normale Nutzer.

## Dokumentation nach Umsetzung

Nach der Umsetzung sollen entstehen:

- `docs/derived/V1_0_7_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_0_7_FINAL_REVIEW.md`

Der Final Review soll mindestens enthalten:

- verwendeter Gate-Befehl,
- Browser/Version oder Playwright-Projekt,
- getestete Viewports,
- Flow-Ergebnisse,
- Leak-Scan-Ergebnis,
- Screenshot-/Trace-Artefaktpfade,
- bekannte Restpunkte,
- Gate-Ergebnis.
