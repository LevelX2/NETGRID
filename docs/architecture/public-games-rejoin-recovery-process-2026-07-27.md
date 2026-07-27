# Öffentliche Spiele trotz Recovery-Sitzung und Account-Rejoin

Status: in Arbeit (`REC-001` aktiv)  
Stand: 2026-07-27  
Arbeitsbranch: `codex/public-games-rejoin-recovery`  
Arbeits-Worktree: `C:\Projekte\NETGRID_PUBLIC_GAMES_REJOIN_RECOVERY`

## Quelle und Vorgabe

Ein Playtest zeigte zwei zusammenhängende Lücken:

1. Eine lokal gespeicherte, aber nicht wiederverbindbare Match-Sitzung hält
   den Startbereich im Recovery-Zustand. Öffnet der Nutzer dort `Spiele`,
   bleibt die öffentliche Liste beim anfänglichen Leerwert, obwohl
   `GET /api/public/matches` Matches liefert.
2. Ein angemeldeter, serverseitig an einen aktiven Matchslot gebundener Spieler
   kann bei verlorenem Browser-Token sein eigenes Spiel nicht selbst wieder
   übernehmen. Er wäre auf einen Betreiber-Recovery-Token angewiesen.

## Zielprüfung

Die Vorgabe ist präzise genug für die automatische Umsetzung. Der Endzustand
ist eindeutig: öffentliche Listen müssen unabhängig von einer lokalen
Recovery-Sitzung laden; ein angemeldeter, gebundener Teilnehmer erhält für
sein aktives eigenes öffentliches Match eine sichtbare Rejoin-Aktion. Die
bestehende Account-Teilnehmerbindung ist die alleinige Besitzautorität.

## Gesamtziel

`/Goal` Arbeite den Prozess „Öffentliche Spiele trotz Recovery-Sitzung und
kontogebundener Rejoin“ vollständig und sequenziell von REC-001 bis REC-004
ab und merge den abgeschlossenen Arbeitsbranch lokal nach `main`.

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, die verpflichtenden
Wiki-Einstiegsseiten, die betroffenen Package-`AGENTS.md` und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_PUBLIC_GAMES_REJOIN_RECOVERY` auf Branch
`codex/public-games-rejoin-recovery`. Nutze den Hauptworkspace nur für den
finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische
Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, schreibe oder
aktualisiere die Paketartefakte, führe Paketchecks aus und committe jedes
abgeschlossene Paket. Bei einem Sicherheitsblocker stoppe ohne Rückfrage und
schreibe einen Blocker-Report mit Removal Condition. Nach allen Paketen:
final verifizieren, lokal nach `main` mergen, `main` prüfen, den sauberen
Arbeits-Worktree entfernen, seine Entfernung in Git und Dateisystem
verifizieren, den gemergten Arbeitsbranch löschen und das Goal erst dann als
complete markieren.

## Annahmen

- Die vorhandene Tabelle `account_match_participants` ist für neuere
  Account-Matches die alleinige serverseitige Besitzquelle. Anzeigenamen,
  Browser-Speicher und öffentliche Identitätskategorien reichen nicht aus.
- Der Rejoin rotiert die bisherige Session- und Reconnect-Capability des
  betreffenden Slots und liefert deren neue Rohwerte ausschließlich an die
  gültige Account-Session zurück.
- Der sichtbare Rejoin-Button erscheint nur für ein aktives öffentliches Match
  des angemeldeten Accounts. Der Server entscheidet dennoch selbst und darf
  nicht auf den Button vertrauen.
- Die Benutzeraktion führt in denselben side-gefilterten PlayerView-/WebSocket-
  Pfad wie der bestehende Reconnect.

## Nicht-Ziele

- Keine allgemeine Freigabe von Matchaktionen durch Account-Cookies.
- Kein Rejoin für Gäste, ungebundene historische Matches, fremde Accounts,
  Zuschauer oder abgeschlossene Matches.
- Keine Account-ID, Account-Anmeldenamen, Session- oder Reconnect-Tokens im
  öffentlichen Listenpayload.
- Keine Änderung an Rules Engine, LegalActions, Karten, KI, Replay oder
  Zuschauerprojektion.
- Kein Push oder Pull Request.

## Controller-Invarianten

1. Genau ein Paket ist aktiv; kein Paket wird übersprungen.
2. Die öffentliche Liste wird geladen, sobald sie sichtbar ist – auch bei
   lokaler Recovery-Sitzung und ohne Reconnect-Token.
3. Der Server authentifiziert den Account, prüft die persistierte
   Teilnehmerbindung, bestimmt den Slot und die Seite autoritativ und rotiert
   nur die Credentials dieses Slots.
4. Fremde, nicht authentifizierte, terminale und nicht gebundene Rejoin-Anfragen
   geben weder PlayerView noch Credentials preis.
5. Jede Mutation verlangt erlaubte Origin und Account-CSRF; alle neuen Tokens
   sind hochentropisch, nur gehasht persistiert und nie geloggt.
6. Jeder Paketabschluss umfasst passende Tests, `git diff --check` und einen
   eigenen Commit.

## Automatische Fehlerbehandlung

- Ein nicht wiederverbindbarer lokaler Browserzustand bleibt löschbar, darf
  aber weder globale Discovery noch Konto-Rejoin blockieren.
- Ein verlorenes oder fremdes Match wird serverseitig als nicht verfügbar
  behandelt; die UI erhält keine Besitzdetails.
- Scheitert ein Paketcheck, wird die Ursache im aktiven Paket eng behoben.
- Konflikte mit weitergelaufenem `main` werden nach beiden Intentionen gelöst;
  ein widersprüchlicher Sicherheitsvertrag wird als Blocker dokumentiert.

## Sicherheitsblocker

- Account-Cookie allein erlaubt Rejoin eines nicht gebundenen oder fremden
  Matchslots.
- Rejoin liefert falsche Seite, Gegner-PlayerView, Hidden Info oder Tokens an
  andere Antworten als die erfolgreiche eigene Account-Session.
- Rejoin lässt terminale Matches reaktivieren oder umgeht Status-/Version-/
  Engine-Grenzen.
- Öffentliche Listenantworten enthalten Accountbindung oder Capabilities.

## State Machine

```text
prepared
  -> REC-001 active -> committed
  -> REC-002 active -> committed
  -> REC-003 active -> committed
  -> REC-004 active -> committed
  -> final verification
  -> main merge
  -> worktree cleanup
  -> branch cleanup
  -> complete
```

## Paketfolge

| Paket | Titel | Commit-Vorschlag |
| --- | --- | --- |
| REC-001 | Vertrag und Prozess festlegen | `docs: define recovery list and account rejoin contract` |
| REC-002 | Öffentliche Liste im Recovery-Zustand laden | `fix(web): refresh public games during session recovery` |
| REC-003 | Autoritativen Account-Rejoin ergänzen | `feat(account): allow bound players to rejoin active matches` |
| REC-004 | Rejoin in der Spieleliste und Abschlussgates | `feat(web): rejoin own active matches from games` |

## Paketdetails

### REC-001 – Vertrag und Prozess festlegen

Ziel: Scope, negative Grenzen und Abnahmebedingungen sind dokumentiert.

Arbeit:

- Dieses Prozessartefakt mit `/Goal`, Sicherheitsvertrag und Paketfolge
  anlegen.
- Die bestehende Recovery-, öffentliche Listen- und Accountbinding-Kette
  auf die benötigten Eingriffspunkte eingrenzen.

Checks: `git diff --check`.

Done-Gate: Kein Paket muss aus UI- oder Accountdaten Besitz herleiten.

### REC-002 – Öffentliche Liste im Recovery-Zustand laden

Ziel: Sichtbarkeit, nicht das Vorhandensein einer `SessionInfo`, steuert das
Nachladen der öffentlichen Spiele.

Arbeit:

- Den sichtbaren Setup- und Active-Match-Shell eindeutig modellieren.
- Öffentliche Liste beim Öffnen und Aktualisieren auch bei Recovery-Sitzung
  nachladen.
- Eine Regression abdecken: sichtbarer Tab `Spiele`, lokale nicht
  wiederverbindbare Session und erfolgreiche öffentliche API-Antwort.

Checks: gezielte Webtests, Typecheck der betroffenen Pakete,
`git diff --check`.

Done-Gate: Der leer gerenderte Recovery-Standardwert kann nicht mehr als
angeblich leere Serverliste stehen bleiben.

### REC-003 – Autoritativen Account-Rejoin ergänzen

Ziel: Ein gültig angemeldeter, gebundener Account kann exakt seinen aktiven
Spielerslot wieder übernehmen, ohne einen alten Browser-Token vorlegen zu
müssen.

Arbeit:

- Einen engen authentifizierten Account-Rejoin-Vertrag in Shared/Server
  ergänzen.
- Accountbinding für Match und Slot serverseitig abfragen.
- Slot und aktuelle Seite aus dem autoritativen Matchrecord ableiten.
- Bestehende Credentials des Slots widerrufen, neue erzeugen, side-gefilterten
  Payload erzeugen und atomar persistieren.
- Auth-, Origin-, CSRF-, fremder Account-, Gast-, Terminal- und
  Tokenrotations-Negativtests ergänzen.

Checks: relevante Server- und Account-HTTP-Tests, `git diff --check`.

Done-Gate: Kein Client kann Seite, Slot oder Besitz vorgeben; ein erfolgreicher
Rejoin verhält sich wie ein neuer sicherer Reconnect dieses Slots.

### REC-004 – Rejoin in der Spieleliste und Abschlussgates

Ziel: Der angemeldete Eigentümer erkennt ein eigenes aktives öffentliches
Match und kann es aus `Spiele` direkt fortsetzen.

Arbeit:

- Einen redigierten Account-Read-Pfad für rejoinbare öffentliche Match-IDs
  ergänzen.
- In der öffentlichen Spieleliste nur für diese IDs `Spiel fortsetzen`
  rendern; sonst bleiben `Zuschauen` und Replay unverändert.
- Erfolgreiche Antwort als lokale Session persistieren und den bestehenden
  PlayerView-/WebSocket-Pfad nutzen.
- UI-, API- und Browser-Smoke prüfen; Review und Wissen/Log nachführen.

Checks: relevante Web- und Servertests, Typecheck, Build soweit verfügbar,
`git diff --check`.

Done-Gate: Eigentümer-Rejoin ist sichtbar und sicher; fremde aktive Matches
bleiben reine Zuschauerfälle.

## Verifikationsregeln

- Tests prüfen alle serialisierten Antwortkörper auf Tokens und Hidden Info,
  mit Ausnahme der erfolgreichen, authentifizierten eigenen Rejoin-Antwort.
- Tests prüfen die Rotation: alte Session- und Reconnect-Tokens funktionieren
  nach erfolgreichem Account-Rejoin nicht mehr.
- Die UI testet die Recovery-Regression unabhängig vom Account-Rejoin.
- Breite Gates folgen erst nach den paketnahen Tests.

## Worktree-, Git- und Integrationsregeln

- Alle Änderungen entstehen in diesem Arbeits-Worktree; `main` und fremde
  Worktrees bleiben bis zum finalen Merge unangetastet.
- Vor dem Merge wird weitergelaufenes `main` defensiv integriert.
- Der Merge nach `main` erfolgt bevorzugt per Fast-Forward.
- Danach werden der exakt benannte Worktree und der vollständig gemergte Branch
  ohne Force entfernt und doppelt verifiziert.

## Controller-Prompt-Kern

Arbeite REC-001 bis REC-004 ohne Scope-Ausweitung sequenziell ab. Behalte
Accountbindung, Capability-Token, side-filtered PlayerViews und die Rules
Engine als alleinige Autoritäten bei. Behandle Account-Rejoin als enge,
authentifizierte Recovery-Ausnahme, nicht als generelle Account-Autorisierung
für Matchaktionen. Committe jeden grünen Paketabschluss separat.

## Abschlusskriterien

- Die Recovery-Session blockiert die öffentliche Liste nicht mehr.
- Nur ein gebundener eingeloggter Teilnehmer kann sein aktives eigenes
  öffentliches Match rejoinen.
- Alte Slot-Capabilities werden rotiert; fremde und terminale Fälle bleiben
  sicher abgewiesen.
- Alle Paketcommits, finalen Checks, Main-Merge, Worktree-Cleanup und
  Branch-Cleanup sind nachgewiesen.
