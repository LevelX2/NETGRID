# V2.3a LAN Open Lobby Mini Plan

Status: proposal
Stand: 2026-05-10

## Ziel

V2.3a ist ein kleiner Vorstufenschnitt fuer den spaeteren V2.3-Pfad. In derselben privaten LAN/WLAN-Umgebung soll ein Spieler offene, joinbare Matches sehen und direkt aus einer Liste beitreten koennen, ohne den Join-Link manuell zu kopieren.

Der Schnitt bleibt bewusst klein: kein Matchmaking, keine öffentliche Plattform, keine Engine-Regelaenderung.

## Einordnung in die aktuelle Roadmap

- Aktuelle Pflichtlinie bleibt unveraendert: V1.9.1 bis V1.9.8 vor V2.x.
- V2.3a ist ein vorbereitender Produkt-/UX-Baustein fuer spaetere Lobby-Schritte.
- Die bestehende Join-Link-Logik bleibt erhalten und bleibt der sichere Fallback.

## Produkt- und Feature-Ziele

1. Unter `Beitreten` eine kleine Liste `Offene Spiele im LAN` anzeigen.
2. Nur `pending`-Matches anzeigen, die fuer Join freigegeben sind.
3. Ein Klick auf einen Listeneintrag startet den bestehenden Join-Flow serverseitig.
4. Liste aktualisiert sich periodisch und manuell (Refresh-Button).
5. Bei Leerstand klare Rueckmeldung: `Keine offenen Spiele gefunden`.
6. Host kann pro Match steuern, ob das Match in der LAN-Liste sichtbar ist.
7. Liste zeigt nur side-sichere Metadaten ohne Token/Deckdetails.
8. Bestehender Join-Link-/Token-Pfad bleibt voll funktionsfaehig.
9. Fehlerfaelle (abgelaufen, schon gestartet, schon voll, falscher Status) sind klar und side-sicher.
10. Keine Aenderung an Engine, Replay, StateHash, Randomness oder Action-Autoritaet.

## Muss-Anforderungen

| ID | Muss-Anforderung |
| --- | --- |
| V23A-MUST-001 | Web-UI zeigt unter `Beitreten` eine Liste offener Matches aus dem aktuellen Serverkontext. |
| V23A-MUST-002 | Gelistet werden nur joinbare `pending`-Matches mit `discoverableInLan = true`. |
| V23A-MUST-003 | Jeder Listeneintrag enthaelt nur freigegebene Metadaten: `matchId` (kurz), Host-Anzeigename, Modus, Zeitstempel/Alter, Status. |
| V23A-MUST-004 | Listeneintraege enthalten keine Tokens, keine Decknamen, keine Deckhashes, keine Decklisten, keine Hidden-Info-Felder. |
| V23A-MUST-005 | Auswahl eines Eintrags fuehrt in den bestehenden Join-Prozess; keine parallele zweite Join-Logik. |
| V23A-MUST-006 | Join-Link/Manuelle Eingabe bleiben als Fallback erhalten und regressionsfrei. |
| V23A-MUST-007 | Host kann Sichtbarkeit bei Match-Erstellung auf `LAN sichtbar` an/aus setzen (Default: an fuer private LAN-Profile). |
| V23A-MUST-008 | Liste aktualisiert sich automatisch (z. B. 5-10 Sekunden) und manuell per Refresh. |
| V23A-MUST-009 | Server lehnt Join-Versuche auf inzwischen ungueltige Eintraege side-sicher ab; UI zeigt eine klare Neubewertung an. |
| V23A-MUST-010 | Hidden-Info-, Token- und Payload-Redaction-Gates bleiben fuer REST, WebSocket, Reconnect und Logs gruen. |

## UI-Flow (Stufe 1)

1. Spieler B oeffnet `Beitreten`.
2. Bereich `Offene Spiele im LAN` wird geladen.
3. Spieler B sieht kurze Liste mit sicheren Metadaten.
4. Spieler B waehlt einen Eintrag und klickt `Beitreten`.
5. Der bestehende Join-Endpunkt wird mit den vorhandenen, validierten Join-Daten aufgerufen.
6. Bei Erfolg geht der Flow in die bekannte Deckwahl/Ready-Lobby.
7. Bei Misserfolg wird die Liste aktualisiert und der Grund side-sicher angezeigt.

## Serverseitiger Vertrag (Vorschlag)

### Read-Endpunkt

`GET /api/matches/open`

Response-Element pro Match (Beispielstruktur):

- `matchId` (oder gekuerzte Anzeige-ID + interne ID fuer Join)
- `hostDisplayName`
- `mode` (`human_vs_human`)
- `status` (`pending`)
- `createdAt`
- `ageSeconds`
- `discoverableInLan` (implizit true fuer gelistete Eintraege)

### Write-Pfade

- Join bleibt auf dem bestehenden Join-Endpunkt.
- Match-Erstellung ergaenzt optionales Flag `discoverableInLan`.

## Mechaniken, Kartenfreigabe und Effekt-Vervollstaendigung

1. Keine neue Spielmechanik.
2. Keine Kartenfreigabe.
3. Keine Aenderung an RulesBaseline, LegalActions oder applyAction.
4. Keine Aenderung an Replay-, StateHash- oder RNG-Vertrag.
5. Lobby-Liste ist reine Match-Lifecycle-/UI-Metadatenfunktion.

## KI-Spieler

1. Keine Aenderung am KI-Entscheidungsmodell.
2. Keine neuen KI-Inputs.
3. Keine KI-Debugdaten in Listenmetadaten.
4. Human-vs-KI-Matches werden in V2.3a nicht ueber die offene Liste gematcht.

## Nicht-Ziele

- Kein oeffentliches Lobby-Verzeichnis.
- Kein Internet-Discovery ueber mehrere Hosts.
- Kein automatisches Matchmaking.
- Keine Accounts, Freunde, Rankings, Turniere, Spectator.
- Kein Chat-Ausbau.
- Keine neue Persistenztechnologie.

## Sicherheits- und Privacy-Regeln

- Listenpayloads sind streng minimal.
- Keine Tokens in Liste, Logs, Health, Browser-Storage, Fehlermeldungen.
- Deckdaten bleiben vor Join unsichtbar.
- Rate-Limits fuer Listen- und Join-Probes bleiben aktiv.
- Side-sichere Fehlertexte ohne interne Zustandsdetails.

## Technischer Schnitt (minimal)

- `apps/server/src/http-server.ts`
  - neuer Read-Endpunkt fuer offene Matches.
  - optionales Create-Feld `discoverableInLan` validieren.
- `apps/server/src/multiplayer.ts`
  - helper fuer filterbare Open-Match-Ansicht (`pending`, discoverable, joinbar).
- `apps/server/src/multiplayer.test.ts`
  - Filter-, Sichtbarkeits- und Race-Tests.
- `apps/web/app/page.tsx`
  - Liste im `Beitreten`-Bereich, Auswahl, Refresh, Fehlerdarstellung.
- `apps/web/app/match-start.test.ts`
  - UI-Tests fuer Liste, Auswahl, Fallback.
- `tests/specs/visibility-contract.test.ts`
  - Leak-Checks fuer offenen-Liste-Payload.

## Teststrategie

### Server

- Nur `pending` + `discoverableInLan=true` wird gelistet.
- `active`, `cancelled`, `abandoned`, `forfeited`, `finished` erscheinen nicht.
- Tokens/Deckdaten kommen nie in `GET /api/matches/open`.
- Race: Match wird zwischen Listenabruf und Join aktiv -> Join wird sicher abgelehnt.

### Web

- Leere Liste zeigt klaren Zustand.
- Liste mit Eintraegen erlaubt Auswahl und Join.
- Join-Link-Fallback funktioniert unveraendert.
- Fehlerfall aktualisiert Liste und zeigt klare Meldung.

### E2E

- Zwei Tabs: Host erstellt LAN-sichtbares Match, Joiner sieht es in Liste und joint.
- Host mit `discoverableInLan=false` erscheint nicht.
- Leak-Scan: keine Tokens/Deckdaten im DOM/Netzpayload/Storage.

## Aufwand und Risiko (Schaetzung)

- Implementierung + Tests: ca. 2-4 Arbeitstage.
- Haupt-Risiken:
  - Scope-Creep Richtung Matchmaking/Public Lobby.
  - Informationsleck ueber zu breite Metadaten.
  - Race-Zustaende zwischen Anzeige und Join.

Gegenmassnahmen:

- Harte Scope-Grenzen in Requirements.
- Minimalpayload + Visibility-Contract-Tests.
- Join bleibt serverautoritativ mit finaler Revalidierung.

## Gate / Done fuer V2.3a

V2.3a gilt als done, wenn:

1. Offene LAN-Matches im `Beitreten`-Bereich sichtbar sind.
2. Join aus der Liste stabil funktioniert.
3. Join-Link-/Manuell-Flow regressionsfrei bleibt.
4. Keine Token-/Deck-/Hidden-Info-Leaks auftreten.
5. `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build` gruen sind.

## Empfohlene Folgeentscheidung

Nach V2.3a entscheidet ein kurzer Review:

1. Bei gruenem Gate: Integration als Vorstufe in V2.3 Public Lobby Alpha.
2. Bei erhöhtem Risiko: Rueckbau auf Join-Link-only und Nachschaerfung der Payload-Grenzen.
