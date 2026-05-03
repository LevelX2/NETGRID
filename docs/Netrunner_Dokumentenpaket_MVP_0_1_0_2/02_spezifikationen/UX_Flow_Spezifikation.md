# Netrunner-Webapplikation – UX- und Flow-Spezifikation

**Status:** verbindliche Arbeitsfassung  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.1 und MVP 0.2  
**Primäres Ziel:** eindeutige, spielbare und sichtbarkeitskonforme Benutzerführung für lokale KI-Partien und private Human-vs-Human-Partien

## 1. Zweck

Dieses Dokument beschreibt die Benutzerführung, Screens, Zustände, Interaktionsregeln und UI-Abnahmekriterien für die Netrunner-Webapplikation. Es ergänzt die API-, WebSocket-, Rules-Engine-, Visibility- und Testdokumente aus Sicht des Frontends.

Die UI ist im MVP kein eigener Regelinterpret. Sie zeigt `PlayerView`, `LegalActions`, `ChoiceRequests`, EventLog und Verbindungsstatus an. Alle regelrelevanten Entscheidungen werden als Absichten an Server oder Engine gesendet. Die UI darf keine eigenen Spielzustandsänderungen berechnen, die nicht vom autoritativen State bestätigt wurden.

## 2. Leitprinzipien

1. Sichtbarkeit hat Vorrang vor Komfort.
2. Die UI rendert ausschließlich gefilterte Daten aus der eigenen PlayerView.
3. LegalActions sind die einzige Quelle für klickbare Spielaktionen.
4. Pending- und Wartezustände müssen immer klar sein.
5. Jede gesendete Action wird bis zum Receipt oder StateUpdate als in Bearbeitung angezeigt.
6. Bei Stale-State-Fehlern resynchronisiert die UI, statt lokale Annahmen zu treffen.
7. Reconnect muss den aktuellen Zustand wiederherstellen, ohne zusätzliche Informationen zu offenbaren.
8. Undo wird explizit kommuniziert und nach Hidden-Info-Barrier blockiert.
9. Debugdaten dürfen im normalen Spielerclient keine privaten Gegenseiteninformationen enthalten.

## 3. Nutzerrollen

| Rolle | Beschreibung | Relevante UI-Fähigkeiten |
|---|---|---|
| Runner-Spieler | Spielt Runner-Seite | Eigene Hand, Rig, Stack-/Heap-Zählung, Credits, Clicks, Tags falls später relevant, Runner-LegalActions. |
| Corp-Spieler | Spielt Corp-Seite | Eigene HQ-Karten, R&D-/Archives-Zählungen, installierte Server, unrezzed/rezzed Karten, Corp-LegalActions. |
| Host | Erstellt privates Match | Seite wählen, Invite-Link kopieren, Matchstatus sehen. |
| Gast | Tritt per Invite-Link bei | Freie Seite bestätigen, Session starten. |
| Entwickler/Tester | Lokale Debugsicht | StateVersion, StateHash, EventIds, Protokollstatus, Replay-Hinweise ohne normale Visibility zu verletzen. |

Eine Person kann mehrere Rollen haben, etwa Host und Runner. Die Rechte ergeben sich aus SessionToken und SideToken, nicht aus UI-Auswahl allein.

## 4. Screens und Routen

Empfohlene Routen:

| Route | Screen | Zweck |
|---|---|---|
| `/` | Start | Neues lokales oder privates Spiel starten. |
| `/local` | Lokales Spiel gegen KI | MVP-0.1-Spiel gegen einfache Corp-KI. |
| `/matches/new` | Privates Match erstellen | Host-Seite, Seed optional, Demo-Decks auswählen. |
| `/matches/:matchId/lobby` | Waiting Lobby | Invite-Link anzeigen, Gegnerstatus, Seitenbelegung. |
| `/join/:inviteToken` | Join | Token prüfen, freie Seite anzeigen, Beitritt bestätigen. |
| `/matches/:matchId` | Game Board | Laufende Partie mit PlayerView, LegalActions, Choices und EventLog. |
| `/matches/:matchId/reconnect` | Reconnect | Session wieder aufnehmen, aktuellen State laden. |
| `/matches/:matchId/replay` | Replay/Export optional | Gefilterte Historie oder lokale Debug-Wiedergabe. |

Die genaue URL-Struktur darf angepasst werden, wenn die API-Verträge erhalten bleiben.

## 5. Startscreen

### 5.1 Inhalt

Der Startscreen zeigt mindestens:

- Anwendungstitel,
- Button „Lokales Spiel gegen KI“,
- Button „Privates Spiel erstellen“,
- kurze Information zum MVP-Umfang,
- Hinweis, dass Demo-Decks verwendet werden,
- optional Link zu Regeln/Dokumentation.

### 5.2 Nicht anzeigen

Nicht anzeigen:

- freie Deckbauoptionen,
- öffentliche Matchliste,
- Rangliste,
- Nutzerkonten,
- offizielle Turnierlegalität der Demo-Decks.

### 5.3 Akzeptanz

Der Nutzer kann ohne technische Vorarbeit ein lokales Spiel starten oder ein privates Match erstellen. Nicht verfügbare Funktionen werden nicht als aktive Buttons angeboten.

## 6. Lokales Spiel gegen KI

### 6.1 Ablauf

1. Nutzer wählt lokales Spiel.
2. System erzeugt GameState mit festen Demo-Decks und Seed.
3. Nutzer spielt Runner.
4. Corp-KI entscheidet aus LegalActions.
5. Nach jeder Action aktualisiert UI PlayerView, LegalActions und EventLog.

### 6.2 KI-Transparenz

Die UI darf anzeigen, dass die Corp-KI gehandelt hat, aber sie darf nicht die komplette Entscheidungsgrundlage der KI offenlegen, wenn diese private Corp-Informationen enthält. Öffentliche KI-Aktionen erscheinen im EventLog. Private Details bleiben gefiltert.

### 6.3 Fehlerzustände

| Zustand | UI-Verhalten |
|---|---|
| Engine lehnt Action ab | Fehlermeldung anzeigen, LegalActions neu laden. |
| KI findet keine legale Action | Debughinweis lokal, Partie pausiert oder KI passt, abhängig von Engine-Regel. |
| Replay/StateHash weicht ab | Debughinweis lokal, keine Partie automatisch fortsetzen. |

## 7. Privates Match erstellen

### 7.1 Eingaben

Mindestfelder:

| Feld | Typ | Pflicht | Bemerkung |
|---|---|---:|---|
| Eigene Seite | Auswahl Runner/Corp/zufällig | Ja | Bestimmt Host-SideToken. |
| Seed | Text/Zahl optional | Nein | Für reproduzierbare Tests; leer erzeugt Server-Seed. |
| Decksatz | Auswahl | Ja | Für MVP feste Demo-Decks. |

### 7.2 Ergebnis

Nach erfolgreicher Erstellung zeigt die UI:

```text
Privates Match erstellt
Du spielst: Runner
Status: Wartet auf Corp-Spieler
Einladungslink: [Kopieren]
```

Der Token selbst soll nicht separat als Klartextfeld hervorgehoben werden. Kopieren des Links ist ausreichend.

### 7.3 Fehlermeldungen

| Fehler | Anzeige |
|---|---|
| Rate Limit | „Derzeit können keine weiteren Matches erstellt werden.“ |
| Ungültige Seite | „Diese Seitenauswahl ist nicht verfügbar.“ |
| Serverfehler | „Match konnte nicht erstellt werden. Bitte erneut versuchen.“ |

Fehlermeldungen enthalten keine Secrets, internen IDs oder Stacktraces.

## 8. Waiting Lobby

### 8.1 Inhalt

Die Waiting Lobby zeigt:

- eigene Seite,
- Matchstatus,
- ob Gegner beigetreten ist,
- kopierbaren Invite-Link,
- optional Seed/RulesVersion für Testumgebung,
- Verbindung zum Server.

### 8.2 Zustände

| Zustand | Anzeige | Erlaubte Aktion |
|---|---|---|
| Wartet auf Gegner | Lobbytext, Invite-Link | Link kopieren, Match verlassen optional. |
| Gegner verbunden | Bereitstatus | Spiel öffnen. |
| Gegner disconnected | Hinweis | Warten. |
| Match bereits voll | Gast sieht Ablehnung | Keine. |
| Token ungültig | Gast sieht generische Ablehnung | Zur Startseite. |

### 8.3 Visibility

Host darf in der Lobby keine Karten oder Deckreihenfolgen des Gegners sehen. Die Lobby enthält nur Match-Metadaten.

## 9. Join-Screen

### 9.1 Ablauf

1. Gast öffnet Invite-Link.
2. Client ruft Join-Bootstrap auf.
3. Server prüft Token.
4. UI zeigt verfügbare Seite und Matchstatus.
5. Gast bestätigt Beitritt.
6. Server erstellt SessionToken für Gast.
7. Client verbindet WebSocket und öffnet Game Board.

### 9.2 Fehlerfälle

| Fehler | UI-Anzeige | Security-Anforderung |
|---|---|---|
| Token ungültig | „Einladung ist ungültig oder abgelaufen.“ | Keine Matchdetails. |
| Match voll | „Dieses Match ist bereits vollständig.“ | Keine fremden Sessiondaten. |
| Match beendet | „Dieses Match ist beendet.“ | Nur generische Endinfo. |
| Seite nicht verfügbar | „Diese Seite ist nicht verfügbar.“ | Kein Tokenvergleich offenlegen. |

## 10. Game Board – Grundlayout

Das Game Board besteht aus folgenden Bereichen:

| Bereich | Inhalt |
|---|---|
| Header | Matchstatus, eigene Seite, Verbindung, StateVersion optional. |
| Corp-Bereich | Credits, Clicks, Score Area, Server, HQ/R&D/Archives abhängig von Sicht. |
| Runner-Bereich | Credits, Clicks, Score Area, Grip/Stack/Heap, Rig. |
| Board-Zentrum | Run-Zustand, aktueller Server, Encounter, Access, PendingChoice. |
| LegalActions-Panel | Klickbare Aktionen aus Engine/Server. |
| Choice-Panel | Aktuelle Entscheidungen mit Optionen. |
| EventLog | Öffentliche und eigene private Ereignisse. |
| Status-/Fehlerleiste | Pending, stale, reconnect, undo, errors. |
| Debug Panel optional | Nur lokale/dev Informationen, gefiltert. |

## 11. Anzeige verdeckter Informationen

### 11.1 Runner-Sicht

Runner darf sehen:

- eigene Grip-Karten,
- eigene installierte Karten,
- eigene Heap-Karten,
- eigene Credits, Clicks und Scores,
- öffentliche Corp-Karten,
- rezzed ICE und rezzed Assets/Upgrades,
- accessed Karten während zulässiger Access-Fenster,
- öffentliche Events.

Runner darf nicht sehen:

- Corp-HQ-Karten außer aktuell erlaubtem Access,
- R&D-Reihenfolge,
- unrezzed installierte Corp-Kartentitel,
- verdeckte Archives-Karten, soweit nicht accessed,
- private Corp-Choices,
- Corp-SessionToken.

### 11.2 Corp-Sicht

Corp darf sehen:

- eigene HQ-Karten,
- eigene R&D/Archives-Struktur nach zulässiger Sicht,
- eigene installierte Karten auch unrezzed,
- Runner-öffentliche Karten,
- Runner-Score Area,
- Runner-Rig und Heap,
- öffentliche Events.

Corp darf nicht sehen:

- Runner-Grip-Karten,
- Runner-Stack-Reihenfolge,
- private Runner-Choices,
- Runner-SessionToken.

### 11.3 Darstellung unbekannter Karten

Unbekannte Karten werden als Platzhalter gerendert:

```text
Unrezzed ICE
Unbekannte Karte
Verdeckte HQ-Karte
Verdeckte R&D-Karte
```

Der Platzhalter darf CardInstanceIds nur verwenden, wenn diese nicht als verdeckte eindeutige Trackinginformation missbraucht werden können. Für normale UI sollten stabile, seitenspezifische ViewIds verwendet werden.

## 12. LegalActions-Panel

### 12.1 Quelle

Das Panel rendert ausschließlich `legal_actions` aus Server/Engine. Buttons werden nicht aus UI-Zustand abgeleitet.

### 12.2 Action-Zustände

| Zustand | UI-Verhalten |
|---|---|
| Legal | Button aktiv. |
| Nicht legal | Button nicht vorhanden oder deaktiviert mit generischem Grund. |
| Pending Send | Button deaktiviert; Spinner oder „wird gesendet“. |
| Receipt accepted | Pending endet; neue View wird erwartet. |
| Receipt rejected | Fehlermeldung; LegalActions neu laden. |
| Stale State | Eingabe blockiert; Resync anzeigen. |
| Gegner entscheidet | Eigene normale Actions ausblenden; Wartehinweis. |
| Choice offen | Nur Choice-Optionen anzeigen. |

### 12.3 Idempotenz in UI

Jede gesendete Action erhält einen neuen `idempotencyKey`. Bei Netzwerkwiederholung wird derselbe Key für dieselbe beabsichtigte Action verwendet, bis ein Receipt vorliegt. Bei Änderung von Targets oder Choices muss ein neuer Key erzeugt werden.

## 13. Choice-Panel

### 13.1 Allgemeine Regeln

ChoiceRequests sind modale oder hervorgehobene Entscheidungen. Solange ein ChoiceRequest offen ist, zeigt die UI keine irrelevanten Grundaktionen. Die Darstellung muss klar machen, welche Seite entscheiden muss.

### 13.2 Typische Choices im MVP

| Choice | Seite | UI-Anforderung |
|---|---|---|
| Corp rezzt ICE oder nicht | Corp | Rezzable ICE, Kosten, aktuelle Credits, Pass-Option. |
| Runner nutzt Breaker | Runner | Breaker, Subroutines, Kosten, Credits, Pass-Option. |
| Runner greift Karte an | Runner | Access-Kontext, bekannte Karte falls erlaubt, Steal/Trash/No action. |
| Corp scored Agenda | Corp | Scorebare Agenda und Kosten/Voraussetzung. |
| Undo-Zustimmung | Gegner | Akzeptieren/Ablehnen, generischer Kontext. |

### 13.3 Private Choice-Texte

Choice-Texte dürfen private Informationen nur für die entscheidende Seite enthalten. Die Gegenseite sieht nur einen Wartezustand, etwa:

```text
Corp entscheidet.
Runner entscheidet.
Gegner prüft Undo-Anfrage.
```

## 14. EventLog

### 14.1 Inhalt

Das EventLog zeigt:

- öffentliche Spielaktionen,
- eigene private Details,
- StateVersion nach Event optional,
- Undo-Verfügbarkeit,
- generische Hidden-Info-Barrier-Marker,
- Connection-Systemevents,
- Match-Ende.

### 14.2 Nicht anzeigen

Nicht anzeigen:

- private Kartentitel der Gegenseite,
- fremde Hand-/Deckreihenfolge,
- Klartexttokens,
- interne Stacktraces,
- vollständige GameState-Dumps.

### 14.3 Event-Hervorhebung

Empfohlene Labels:

| Label | Bedeutung |
|---|---|
| Öffentlich | Beide Seiten sehen denselben Basiseintrag. |
| Privat | Nur eigene Zusatzinformation sichtbar. |
| System | Verbindung, Reconnect, Undo, Matchstatus. |
| Nicht undo-fähig | Nach Hidden-Info-Barrier oder irreversiblem Schritt. |

## 15. Run-Flow im Board

### 15.1 Zustände

| Run-Zustand | Anzeige |
|---|---|
| Kein Run | Normales Board, Run-Buttons falls legal. |
| Run initiiert | Zielserver, Runner, Serverpfad. |
| Approach ICE | Aktuelles ICE als rezzed/unrezzed gemäß Sicht. |
| Corp Rez Window | Corp Choice; Runner Wartezustand. |
| Encounter ICE | Rezzed ICE, Subroutines, Breaker-Optionen. |
| Subroutines resolve | Ergebnis im EventLog. |
| Movement | Nächstes ICE oder Server. |
| Access | Access-Panel für Runner; Corp sieht nur zulässige Details. |
| Run beendet | Outcome und neues Board. |

### 15.2 Subroutine-Darstellung

Subroutines werden bei rezzed ICE einzeln angezeigt. Gebrochene Subroutines werden markiert. Ungebrochene Subroutines werden als aufzulösen angezeigt. Bei unrezzed ICE sieht Runner keine Subroutinedetails.

## 16. Reconnect-Flow

### 16.1 Auslöser

Reconnect tritt ein bei:

- Browser-Neuladen,
- WebSocket-Abbruch,
- Serverneustart mit persistiertem Match,
- Netzwerkwechsel,
- Tab-Wechsel nach längerer Zeit.

### 16.2 UI-Ablauf

1. Client erkennt Verbindungsverlust.
2. UI zeigt Reconnect-Banner.
3. Eingaben werden blockiert.
4. Client nutzt gespeichertes SessionToken.
5. Server liefert aktuelle PlayerView, LegalActions und PendingChoice.
6. UI ersetzt lokalen Zustand vollständig durch Serverdaten.
7. Banner verschwindet oder zeigt Fehlschlag.

### 16.3 Akzeptanz

Reconnect ist bestanden, wenn der Spieler nach Wiederverbindung keine zusätzliche private Information sieht, die nicht auch im normalen StateUpdate verfügbar wäre.

## 17. Undo-Flow

### 17.1 Undo anfragen

Die UI bietet Undo nur an, wenn der Server oder die PlayerView `undoAvailable=true` oder entsprechende Action anbietet. Die UI darf Undo-Verfügbarkeit nicht selbst aus EventLog ableiten.

### 17.2 Zustimmung

Ablauf:

1. Spieler klickt „Undo anfragen“.
2. Server prüft grundsätzliche Möglichkeit.
3. Gegenseite erhält Undo-Dialog.
4. Gegenseite akzeptiert oder lehnt ab.
5. Server setzt Zustand zurück oder schließt Anfrage.
6. Beide Seiten erhalten StateUpdate und Systemevent.

### 17.3 Blockierung

Nach Hidden-Info-Barrier zeigt die UI einen generischen Grund:

```text
Undo ist nach diesem Informationsgewinn nicht mehr verfügbar.
```

Nicht anzeigen:

- welche konkrete Karte gesehen wurde,
- welche Zone die Blockierung im Detail verursacht hat, sofern dies private Information offenlegt,
- interne Barrier-IDs.

## 18. Fehler- und Stale-State-Verhalten

| Fehler | UI-Verhalten |
|---|---|
| `ACTION_NOT_LEGAL` | Button entfernen/LegalActions neu laden; generische Meldung. |
| `ACTION_STALE_STATE_VERSION` | Eingaben blockieren; frische View laden. |
| `ACTION_WRONG_SIDE` | Meldung „Aktion für diese Seite nicht verfügbar.“ |
| `TOKEN_INVALID` | Session beenden; generische Reconnect-/Join-Meldung. |
| `MATCH_LOCKED` | Kurz warten, erneuter Sync. |
| WebSocket dropped | Reconnect-Banner, Eingaben blockieren. |
| Serverfehler | Keine privaten Details; Debug nur lokal/serverseitig. |

## 19. Responsives Verhalten

MVP-Priorität ist Desktop/Tablet. Mobile muss nicht komfortabel sein, darf aber nicht unbedienbar sein. Mindestanforderungen:

- LegalActions bleiben erreichbar,
- ChoiceDialoge sind vollständig sichtbar,
- EventLog kann gescrollt werden,
- keine Überlagerung verdeckt Pflichtentscheidungen,
- Kartenplatzhalter sind klar unterscheidbar.

## 20. Barrierearme Mindestanforderungen

- Buttons haben verständliche Labels.
- Pending- und Fehlerzustände sind nicht nur farblich kodiert.
- Modale Choice-Dialoge sind per Tastatur erreichbar.
- Fokus springt bei ChoiceRequest in den Entscheidungsbereich.
- EventLog-Einträge sind chronologisch und textlich verständlich.

## 21. Debug Panel

### 21.1 Erlaubte Felder

Im lokalen Debug Panel erlaubt:

- MatchId,
- StateVersion,
- StateHash,
- TimingPoint,
- aktive Seite,
- ConnectionStatus,
- letzte EventIds,
- ProtocolVersion,
- PlayerViewSchemaVersion.

### 21.2 Verbotene Felder im normalen Spielerclient

- vollständiger GameState,
- gegnerische private Kartentitel,
- R&D-/Stack-Reihenfolge,
- Klartexttokens,
- Server-Secrets,
- interne ungefilterte EventPayloads.

## 22. UI-Testfälle

| Test | Erwartung |
|---|---|
| Start lokales Spiel | Board öffnet mit Runner-Sicht und LegalActions. |
| Privates Match erstellen | Lobby zeigt Invite-Link und Host-Seite. |
| Gast joined | Beide Clients öffnen Board mit korrekter Seite. |
| Runner sieht unrezzed ICE | Platzhalter, kein Kartentitel. |
| Corp sieht eigenes unrezzed ICE | Kartentitel sichtbar. |
| Gegner entscheidet | Wartetext, keine fremden ChoiceDetails. |
| Stale Action | UI resynchronisiert und zeigt keine doppelte Transition. |
| WebSocket-Abbruch | Reconnect-Banner und Eingabeblockade. |
| Reconnect | Aktuelle PlayerView ohne Zusatzinfos. |
| Undo vor Barrier | Anfrage und Zustimmung funktionieren. |
| Undo nach Barrier | Generische Blockierung. |
| EventLog | Keine privaten Gegenseiteninformationen. |

## 23. Definition of Done für UX

Die UX gilt für MVP 0.2 als ausreichend, wenn:

- alle Pflichtscreens vorhanden sind,
- zwei Spieler in getrennten Browsern eine Partie abschließen können,
- Pending-, Choice-, Reconnect- und Undo-Zustände eindeutig erkennbar sind,
- LegalActions die einzige Eingabequelle für Spielaktionen sind,
- die UI keine verbotenen privaten Informationen rendert,
- Fehlermeldungen keine privaten Details enthalten,
- manuelle Demo nach Demo-Testskript ohne Bedienblocker möglich ist,
- E2E-Tests für Join, Action Submit, Reconnect und Undo bestehen.
