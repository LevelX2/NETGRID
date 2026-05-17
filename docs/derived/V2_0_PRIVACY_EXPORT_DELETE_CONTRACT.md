# V2.0 Datenschutz-Export- und Löschvertrag

Stand: 2026-05-17
Status: Planungsvertrag, keine Implementierungsfreigabe
Zielrelease: V2.0 Closed Accounts Alpha

## Findings

### Hoch: Export darf keine Regel- oder Hidden-Info-Quelle werden

Betroffene Anker:

- `docs/derived/V2_0_AUTH_PRIVACY_DECISION_SPIKE.md`
- `apps/server/src/multiplayer.ts` mit side-sicheren Replay-Exports und gesperrter `local_analysis`-Exportperspektive
- `apps/server/src/storage-sqlite.ts` mit redigierten Maintenance-Teilnehmer- und Größendaten

Risiko: Account-Export könnte sonst zu einer zweiten Datenöffnung neben PlayerView, Replay und Maintenance werden. Kritisch sind FullState, `privatePayload`, `cardInstances`, verdeckte Karten, gegnerische Decklisten, Token, Token-Hashes, `AIInput` und `DecisionDebug`.

Empfehlung: V2.0-Export nutzt nur eigene Accountdaten, eigene Cloud-Daten und side-sichere Replay-Projektionen. Exportcode darf nicht direkt auf `StoredMatch.gameState`, `privateDeckSnapshots`, `local_analysis`, `AIInput` oder Debugdaten zugreifen.

### Hoch: Löschung darf Replay-StateHash und historische Engine-Events nicht verändern

Betroffene Anker:

- Account-Entscheidung: Accountdaten bleiben getrennt von `GameState`, `PlayerView`, `LegalAction`, `PublicGameEvent`, Replay-StateHash, `AIInput` und `DecisionDebug`.
- `docs/derived/V2_0_ACCOUNT_SESSION_FOUNDATION_IMPLEMENTATION_REVIEW.md`: Account-Session-Schicht ist bisher isoliert.

Risiko: Nachträgliche Löschung darf keine deterministische Matchhistorie brechen. Gleichzeitig dürfen Account-Links und personenbezogene Anzeigenamen nicht unnötig in Metadaten weiterleben.

Empfehlung: Löschung widerruft Account-Sessions, entfernt Cloud-Daten, setzt Accountstatus auf `deleted`, entkoppelt Account-IDs aus Match-Metadaten und anonymisiert zukünftige Account-bezogene Anzeige-Metadaten. Engine-Events, StateHash und Replay-Integrität bleiben unverändert.

### Mittel: Retention ist keine Sofortlöschung

Betroffene Anker:

- SQLite-Backups und Storage-Maintenance aus `apps/server/src/storage-sqlite.ts`.
- Connection-/Maintenance-Flächen aus `apps/server/src/http-server.ts`.

Risiko: Ein Löschknopf kann technisch nicht versprechen, dass alte Backups, bereits rotierte Logs oder Auditdaten sofort verschwinden.

Empfehlung: V2.0 formuliert Retention ehrlich: Primärdaten werden aktiv gelöscht oder anonymisiert; Backups laufen nach definierter Aufbewahrung aus; Logs dürfen keine Roh-Tokens enthalten und müssen redigiert bleiben.

## Exportmatrix

| Datenbereich | Exportierbar für Account-Self | Exportform | Verboten im Export |
| --- | --- | --- | --- |
| Accountprofil | ja | `accountId`, Anzeigename, Status, Rolle, Erstell-/Aktualisierungszeit, optionaler Kontaktstatus | Session-Token, Invite-/Recovery-Rohwerte, interne Adminnotizen |
| Credentials/Passkeys | ja, redigiert | Credential-Metadaten wie Label, erstellt, zuletzt genutzt, widerrufen | Public Key Rohdaten, Credential-Roh-ID in voller Form, Challenge, ClientData |
| Account-Sessions | ja, redigiert | Session-ID, Gerätelabel, erstellt, zuletzt gesehen, Ablauf, Widerrufsstatus | Account-Session-Rohwert, `sessionTokenHash`, IP-Historie, vollständiger User-Agent |
| Cloud-Decks | ja, sobald implementiert | eigene Deck-Drafts, Formatprofil, Owner, Zeitstempel | gegnerische Decklisten, Match-Snapshots anderer Nutzer, Hidden-Info aus Matches |
| Match-Metadaten | ja, begrenzt | eigene Seite, Match-ID, Modus, Format, Baseline, Zeitstempel, Ergebnis, eigene sichtbare Namen | gegnerische Account-ID, gegnerische private Deckdaten, Join-/Reconnect-/Session-Tokens |
| Replay | ja, side-sicher | bestehender Runner- oder Korp-Export für eigene Seite | `local_analysis`, FullState, `privatePayload`, verdeckte Karten außerhalb eigener legaler Perspektive |
| Reports/Moderation | später, eigenes V2.6-Gate | eigene Reporttexte und Status, falls umgesetzt | interne Notizen, fremde Reports, Break-Glass-Inhalte |
| Betriebsdaten | nein, nur redigierte Self-Hinweise | optionaler Exportstatus und Request-Metadaten | Raw Logs, Metriklabels mit PII, Tokens, lokale Dateipfade |

## Exportverbote

Nie exportierbar über V2.0 Account-Self-Export:

- Account-Session-, Match-Session-, Reconnect-, Join-, Invite- oder Recovery-Rohwerte.
- Token-Hashes, Credential-Challenges, Roh-Cookies.
- FullState, `privatePayload`, `cardInstances`, Hidden-Zoneninhalte, gegnerische private Decklisten oder private Match-Snapshots.
- `AIInput`, `DecisionDebug`, Belief-Fakten und KI-interne Hypothesen.
- `local_analysis`-Replayperspektive und lokale Analyseartefakte.
- lokale Dateipfade, SQLite-Dateinamen außerhalb neutraler Exportmetadaten, Backup-Pfade.
- Admin-/Moderatornotizen ohne eigenes Moderations-Export-Gate.

## Lösch- und Anonymisierungsvertrag

| Bereich | Löschung/Anonymisierung | Hinweise |
| --- | --- | --- |
| Accountprofil | Status `deleted`, Account-Sessions widerrufen, personenbezogene Profilfelder entfernen oder neutralisieren | Account-ID kann intern als Tombstone bleiben, damit alte Links nicht wiederverwendet werden. |
| Credentials | Credentials widerrufen und nach Retention löschen | Credential-Rohdaten dürfen vorher schon nicht in Logs stehen. |
| Account-Sessions | alle Sessions widerrufen, Hashes nach kurzer Retention löschen | Laufende Match-Sessions sind separate Match-Capabilities und werden nicht automatisch gelöscht. |
| Cloud-Decks | eigene Cloud-Decks löschen oder in nicht-personenbezogene Match-Snapshots entkoppeln | Match-Snapshots bleiben für Replay/StateHash separat. |
| Display-Namen in Match-Metadaten | accountgebundene Anzeige-Metadaten anonymisieren, z. B. `Gelöschter Nutzer` | Historische Engine-Events und StateHash bleiben unverändert. |
| Replay-Index | Account-Link entfernen, Self-Exportfähigkeit beenden | Public/side-safe Replay-Policy bleibt eigenes Gate. |
| Aktive Matches | Löschung blockieren, bis Match beendet/verlassen/forfaitiert oder ausdrücklich entkoppelt ist | Keine automatische Engine-Mutation durch Account-Löschung. |
| Backups | keine Sofortlöschung versprechen, Ablauf nach Backup-Retention | Löschstatus muss Retention-Ausnahme sichtbar machen. |
| Logs/Audit | redigierte Logs nach Log-Retention auslaufen lassen | Roh-Tokens dürfen ohnehin nicht geloggt werden. |

## Retention-Vorschlag für Alpha

| Datenart | Vorschlag | Begründung |
| --- | --- | --- |
| aktive Account-Sessions | maximal 14 Tage Laufzeit | entspricht Account-Session-Vertrag. |
| widerrufene Session-Metadaten | 14 bis 30 Tage | Missbrauchsdiagnose ohne Langzeitprofil. |
| Export-Artefakte | maximal 24 Stunden Downloadfenster, danach löschen | geringe Datenexposition. |
| Löschaufträge/Tombstones | 180 Tage oder deployerspezifisch | Wiederverwendung und Supportfälle verhindern. |
| SQLite-Backups | bestehende Backup-Retention, klar kommuniziert | keine falsche Sofortlöschung. |
| Serverlogs | kurz und redigiert, ohne Roh-Tokens | Betriebssicherheit ohne PII-Sammlung. |
| Moderations-/Reportdaten | V2.6-Policy | nicht über V2.0 Account-Export vorziehen. |

## Review- und Testchecks

Ein späterer Implementierungsslice muss mindestens diese Checks liefern:

1. Exportpayload enthält eigene Accountdaten, aber keine verbotenen Schlüssel oder Werte: `sessionToken`, `reconnectToken`, `joinToken`, `ng_account_session`, `sessionTokenHash`, `tokenHash`, `privatePayload`, `cardInstances`, `fullGameState`, `AIInput`, `DecisionDebug`, lokale Pfade.
2. Export von Replay nutzt nur `runner` oder `corp` und lehnt `local_analysis` ab.
3. Account-Löschung widerruft alle Account-Sessions und blockiert neue Account-APIs.
4. Account-Löschung verändert keine `GameState`-Hashes, keine `PublicGameEvent`-Historie und keine Replay-StateHash-Prüfung.
5. Account-Löschung entfernt Account-Links aus Match-Metadaten oder anonymisiert sie, ohne Gegnerpayloads zu erweitern.
6. Aktive Matches erzwingen eine explizite Entscheidung: blockieren, verlassen, forfaitieren oder entkoppeln.
7. Backup-/Log-Retention erscheint in Löschstatus oder Admin-Self-View als Retention-Ausnahme.
8. Browser-Storage-Scan findet keine Account-Session-Rohwerte in `localStorage` oder `sessionStorage`.

## Handoff

Nächste sinnvolle Pakete nach diesem Vertrag:

1. Export-Payload-Testmatrix und Schema für Account-Self-Export.
2. Account-Erasure-Harness für Session-Revocation, Cloud-Deck-Löschung und Match-Metadaten-Anonymisierung.
3. Backup-/Log-Retention-Status für Löschaufträge.
4. Cloud-Deck-Boundary konkretisieren, bevor Cloud-Decks implementiert werden.

## Ergebnis

V2.0 darf Accountdaten exportieren und löschen, aber nur als getrennte Datenschutzschicht. Der Export ist kein Debug-, FullState-, Hidden-Info-, KI- oder Moderationskanal. Löschung behandelt Account- und Metadaten, nicht die deterministische Spielhistorie.
