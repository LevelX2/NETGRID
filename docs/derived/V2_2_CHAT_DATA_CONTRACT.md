# V2.2 Chat-Datenvertrag

Stand: 2026-05-17
Status: Preflight-Vertrag, keine Implementierungsfreigabe
Zielrelease: V2.2 Minimal Chat Gate

## Ausgangslage

V1.0.3 erlaubt bereits einen kleinen privaten Lobbychat für Mensch-gegen-Mensch-Lobbys. Dieser Chat ist auf die private Startlobby der zwei teilnehmenden Sessions begrenzt, behandelt Nachrichten als Text, rendert sie escaped, begrenzt die Länge und verschwindet nach Matchstart.

Die V2.2-Roadmap erlaubt Match- oder Lobbychat nur mit Report-, Block-, Retention- und Datenschutzmodell. Sie sperrt globalen öffentlichen Chat, trennt Chat-Payloads von GameEvents, verbietet Chat als Regel- oder Action-Kanal und hält Chatdaten aus Replays heraus, solange keine explizite Entscheidung vorliegt.

## Zielvertrag

Chat ist User-generated Content und bleibt eine Plattform-/Lobby-/Match-Metadatenschicht. Chat ist keine Rules-Engine-Eingabe, kein Regelereignis, kein Replay-Event und kein KI-Signal.

| Bereich | Vertrag |
| --- | --- |
| Datenklasse | `D2_user_generated_content` nach Moderations-/RBAC-Vertrag |
| Mindestfelder | `chatMessageId`, `matchId` oder `lobbyId`, `senderAccountOrSessionRef`, Anzeigename-Projektion, Zeitstempel, Text, optional `reported/hidden/deleted` Status |
| Textgrenze | kurze Textnachrichten; V1.0.3-Grenze 300 Zeichen bleibt brauchbarer Default, bis V2.2 explizit anders entscheidet |
| Berechtigung | Laden und Senden nur für berechtigte Lobby-/Matchteilnehmer; Reconnect liefert Chat nur nach erneuter Berechtigungsprüfung |
| Speicherung | getrennt von `GameState`, `GameEvent`, Replay-Timeline, AI-Debug und Decision-Daten |
| Darstellung | Text escaped rendern; keine HTML-/Markdown-Auswertung, keine Datei-, Bild- oder Link-Vorschau ohne eigenes Gate |
| Missbrauchsschutz | Rate Limits, Report-Referenz, Block-Auswirkung und Retention-Status sind Pflichtgates vor Erweiterung |

## Harte Nicht-Zugehörigkeit

Chatdaten dürfen nicht in diese Flächen wandern:

- `GameState`, `GameEvent`, `PublicGameEvent` oder Engine-Eventlog.
- deterministisches Replay, Replay-Timeline, `ReplayView`, Replay-Export oder Public-Replay-Projektion.
- `StateHash`, RandomDrawRecords oder Replay-StateHash-Checks.
- `PlayerAction`, `LegalAction`, Action-IDs, Kosten, Ziele oder Choices.
- `AIInput`, KI-Gedächtnis, KI-Soaks, KI-Coaching oder `DecisionDebug`.
- Hidden-Info-Barriere-Marker, private Payloads, FullState, `cardInstances` oder Decksnapshots.
- technische Logs, Observability oder Moderation-Audit als Rohtext ohne Redaction-/Retention-Policy.

Wenn Chat später als Moderation-Evidence referenziert wird, geschieht das über Evidence-Referenzen und Datenklasse `D2_user_generated_content`, nicht durch Kopie in Engine-, Replay- oder KI-Daten.

## Bestehender Lobbychat

Der bestehende private Lobbychat bleibt eng interpretiert:

- private Zwei-Personen-Lobby vor Matchstart.
- kein globaler, öffentlicher oder plattformweiter Chat.
- keine Attachments, keine Linkvorschau, keine Rich-Text-Auswertung.
- keine Moderations-, Account- oder Reportfunktion in V1.0.3 selbst.
- keine Engine-/Replay-/StateHash-/KI-Wirkung.

V2.2 darf diesen Vertrag erweitern, aber nicht still umdeuten. Matchchat oder länger gespeicherter Lobbychat braucht eigene Datenmodell-, Datenschutz-, Moderations- und Testgates.

## Chatdatenmodell V2.2

Der V2.2-Chatvertrag beschreibt nur die fachliche Datenform. Er ist keine Storage- oder API-Implementierungsfreigabe.

### Nachricht

| Feld | Datenklasse | Pflicht | Vertrag |
| --- | --- | --- | --- |
| `chatMessageId` | interne Referenz | ja | Opaque ID der Chatnachricht; nicht aus Engine-Events, Action-IDs, Replay-IDs oder CardInstance-IDs ableiten. |
| `conversationScope` | Metadatum | ja | `lobby` oder `match`; kein globaler, öffentlicher oder plattformweiter Chat. |
| `lobbyId` | `D0_public_lobby_metadata` | bedingt | Nur bei Lobbychat gesetzt; berechtigt nicht automatisch zu Matchdaten. |
| `matchId` | `D0_public_lobby_metadata` | bedingt | Nur bei Matchchat gesetzt; bleibt Plattform-/Metadatenreferenz, keine Engine-State-Referenz. |
| `senderAccountId` | `D1_account_pii` | bedingt | Nur für Accountnutzer; Export und Moderation sehen nur nach V2.0/V2.6 erlaubte Projektionen. |
| `senderSessionRef` | technische Referenz | bedingt | Nur für nicht angemeldete oder lobbygebundene Sessions; keine Roh-Sessiontokens, Token-Hashes oder Cookies. |
| `senderDisplayNameSnapshot` | `D1_account_pii`/Metadatum | ja | Anzeigeprojektion zum Sendezeitpunkt; bei Accountlöschung anonymisierbar. |
| `senderSide` | Metadatum | optional | `runner`, `corp` oder leer; darf keine Hidden-Info-Perspektive oder Deckdaten öffnen. |
| `createdAt` | Metadatum | ja | Serverzeitpunkt der Annahme. |
| `text` | `D2_user_generated_content` | ja | Kurzer Rohtext nach Längen- und Inhaltsgrenzen; Anzeige immer escaped, keine HTML-/Markdown-Auswertung. |
| `textLength` | Metadatum | ja | Länge der angenommenen Nachricht zur Validierung, Rate-Limit-Diagnose und UI. |
| `visibilityStatus` | Metadatum | ja | `visible`, `hidden_by_moderation` oder `deleted`; gelöschte Nachrichten zeigen keinen Rohtext im normalen Chatverlauf. |
| `reportStatus` | Metadatum | ja | `none`, `reported` oder `evidence_locked`; steuert Retention-Ausnahme, nicht Spielregeln. |
| `deletedAt` | Metadatum | optional | Zeitpunkt einer Nutzer-, System- oder Moderationslöschung. |
| `deletedByRef` | Audit-Referenz | optional | Redigierte Referenz auf Nutzer, Moderator oder System; keine Roh-Sessiondaten. |
| `retentionClass` | Policy-Metadatum | ja | `unreported_chat`, `reported_chat_evidence`, `deleted_chat_pointer`, `moderation_audit` oder `backup_residual`. |

Nicht Teil des Chatdatenmodells sind `GameState`, `GameEvent`, `PublicGameEvent`, `PlayerAction`, `LegalAction`, `ReplayView`, `RandomDrawRecord`, `StateHash`, `AIInput`, `DecisionDebug`, FullState, `privatePayload`, `cardInstances`, Decksnapshots, Roh-Tokens, Token-Hashes, lokale Pfade und Observability-Rohlogs.

### Referenzen

| Referenz | Darf zeigen auf | Darf nicht zeigen auf |
| --- | --- | --- |
| Chat zu Lobby/Match | `lobbyId` oder `matchId` als Metadatenanker | Engine-Eventlog, StateHash-Historie, Hidden-Zonen, Decksnapshots |
| Chat zu Sender | Account-ID oder redigierte Sessionreferenz | Roh-Sessiontoken, Cookie, Token-Hash, Invite-/Reconnect-/Join-Rohwert |
| Report zu Chat | `chatMessageId`, `matchId`/`lobbyId`, Reporter, Kategorie, redigierte Evidence-Projektion | kopierter FullState, `privatePayload`, `AIInput`, `DecisionDebug`, gegnerische Hidden-Daten |
| Moderationsaudit zu Chat | `auditId`, Actor, Aktion, Datenklasse, Ziel-ID, Grund, Ergebnis | Chatrohtext, Hidden-Karten, private CardInstance-IDs, Roh-Tokens |
| Export zu Chat | eigene gesendete Nachrichten und eigene Reporteingaben nach Policy | fremde Moderatornotizen, fremde Reports, Break-Glass-Inhalte, öffentliche Replay-Erweiterung |

## Retention-Vertrag

Die konkreten Fristen bleiben deployer- oder releasekonfigurierbare Produktwerte. V2.2 legt aber verbindliche Klassen, Löschwirkungen und Grenzen fest.

| Retention-Klasse | Inhalt | Standardwirkung | Grenze |
| --- | --- | --- | --- |
| `unreported_chat` | sichtbare, nicht gemeldete Lobby-/Matchnachrichten | läuft spätestens mit Match-/Lobby-Retention oder kürzer aus; keine dauerhafte Archivierung | darf nicht in Replay, KI, Debug oder Public Events gespiegelt werden |
| `reported_chat_evidence` | gemeldete Nachricht mit minimalem Kontext und Reportreferenz | bleibt bis zum Ende der Moderationsretention aus V2.6 erhalten, auch wenn normale Chatretention früher endet | nur `D2_user_generated_content`; keine Hidden-Info-Freigabe und kein FullState |
| `deleted_chat_pointer` | ID, Scope, Löschzeitpunkt, Löschgrundklasse, optional Reportverweis | Rohtext im normalen Chatverlauf entfernt; Pointer verhindert verwaiste Reports und doppelte Moderationsentscheidungen | Pointer darf keinen Chatrohtext und keine Roh-Sessiondaten enthalten |
| `moderation_audit` | Ansicht, Entscheidung, Sanktion, Break-Glass-Anfrage oder Retentionaktion | nach V2.6-Auditretention; manipulationsarm und stark redigiert | Audit ist keine Chatarchiv-Kopie und keine Hidden-Info-Quelle |
| `backup_residual` | bereits erzeugte Backups vor Löschung oder Retentionjob | keine Sofortlöschung versprechen; läuft nach Backup-Retention aus V2.0 aus | Löschstatus muss diese Ausnahme sichtbar machen |

Gelöschte unberichtete Chatnachrichten verlieren ihren Rohtext im Primärbestand. Gelöschte berichtete Chatnachrichten dürfen als Moderations-Evidence weiterbestehen, wenn `reportStatus` oder ein Reportanker dies verlangt. Diese Ausnahme ist eine Moderationsretention, keine allgemeine Chatarchivierung.

## Export- und Löschvertrag

| Vorgang | Chatwirkung | Kompatibilität |
| --- | --- | --- |
| Account-Self-Export | exportiert eigene gesendete Chatnachrichten, eigene Reporttexte und eigene Reportstatus-Projektionen, soweit Retention sie noch hält | folgt V2.0: kein FullState, keine gegnerischen Hidden-Daten, keine Tokens, kein `AIInput`, kein `DecisionDebug` |
| Account-Löschung | anonymisiert oder entfernt `senderAccountId` und Anzeigeprojektionen aus normalen Chatdaten; widerruft keine Matchhistorie und mutiert keinen Engine-State | folgt V2.0: Replay-StateHash, GameEvents und PublicGameEvents bleiben unverändert |
| Chatnachricht löschen | entfernt Rohtext aus normalem Chatverlauf und setzt `visibilityStatus = deleted`; bei Report bleibt Evidence-Projektion bis Moderationsretention erhalten | folgt V2.6: Report-/Auditdaten können als Ausnahme weiterlaufen |
| Report abschließen ohne Sanktion | Evidence läuft nach Report-Retention aus; normale Chatretention wird nicht verlängert, wenn keine Policy-Ausnahme mehr besteht | folgt V2.6-Alpha-Default `Report ohne Sanktion` |
| Report mit Sanktion | Evidence und Audit laufen nach Sanktions-/Appeal-Retention aus | folgt V2.6-Alpha-Default `Report mit Sanktion` und `Moderationsaudit` |
| Backup-Auslauf | bereits vorhandene Backups laufen nach Backup-Retention aus; Primärdatenstatus muss Lösch-/Retentionausnahme anzeigen | folgt V2.0: keine falsche Sofortlöschung |

Account-Self-Export darf fremde Chatnachrichten nur enthalten, wenn sie Teil der eigenen Reporteingabe oder einer redigierten eigenen Reportstatus-Projektion sind. Moderatornotizen, fremde Reports, Break-Glass-Begründungen und interne Sanktionserwägungen bleiben außerhalb des V2.2-Account-Self-Exports.

## Architekturgrenzen für Implementierungsslices

| Grenze | Pflicht |
| --- | --- |
| Engine | Chat wird nie von `applyAction` verarbeitet und erzeugt keine `PlayerAction`, `LegalAction`, Kosten, Ziele oder Choices. |
| Replay | Chattexte, Chat-IDs und Reporttexte bleiben aus Replay-Timeline, Replay-Export, Public-Replay-Projektion und Replay-StateHash-Prüfung. |
| StateHash | Chatannahme, Chatlöschung, Report und Moderationsstatus verändern keinen Engine-StateHash. |
| KI | `AIInput`, KI-Gedächtnis, KI-Soaks, KI-Coaching und `DecisionDebug` enthalten keine Chatdaten. |
| Moderation | Chat kann `D2_user_generated_content`-Evidence sein, öffnet aber nie automatisch `D4`, `D5` oder `D6`. |
| Logs | Fehler-, Audit- und Observabilityflächen verwenden Redaction und dürfen keine Chatrohtexte ohne eigene Policy speichern. |

## Offene Datenschutz- und Moderationsentscheidungen

| Thema | Entscheidung vor Implementierung |
| --- | --- |
| Retention-Fristen | konkrete Zahlenwerte für unberichteten Chat, Reportabschluss, Sanktion/Appeal, Audit und Backup-Auslauf festlegen |
| Export-/Lösch-UI | Nutzertexte für Self-Export, Löschstatus, Moderationsausnahme und Backup-Auslauf festlegen |
| Reportmodell | Report gegen Nachricht, Nutzer, Match oder Lobby; Statusmodell und Evidence-Referenzen festlegen |
| Blockieren | Entscheiden, ob Block nur neue Nachrichten ausblendet, Senden verhindert oder Match-/Invite-Flows beeinflusst |
| Moderationszugriff | Rollen, Redaction und Audit nach V2.6 konkretisieren; kein pauschaler FullState-/KI-Debug-Zugriff |
| Hidden-Info in Chat | Soziale Offenlegung durch Nutzer bleibt nicht Engine-relevant; Moderation darf daraus keine Hidden-Datenfreigabe ableiten |
| Rate Limits | Nachrichtenfrequenz, Burst, Cooldown, reconnect-nahe Wiederholungen und Abuse-Signale festlegen |
| UI-Meldung | Meldepfad, Block-UI und sichere Nutzertexte definieren |
| LLM-Moderation | nicht freigegeben; nur späteres eigenes Gate mit Datenschutz-, Audit- und Fehlentscheidungsmodell |

## Review- und Testchecks für spätere Slices

Ein Implementierungspaket für V2.2 muss mindestens prüfen:

1. Chat-Sendepfad akzeptiert nur berechtigte Lobby-/Matchteilnehmer und schreibt nicht in Engine-State.
2. Reconnect-Payload enthält Chat nur für berechtigte Teilnehmer und keine Tokens, Session-IDs, Decklisten, Hidden Cards, `cardInstances`, `AIInput` oder `DecisionDebug`.
3. Replay-Index, Replay-View, Replay-Export und Public-Replay-Projektion enthalten keine Chattexte oder Chat-Metadaten ohne eigenes Chat-/Moderations-Gate.
4. `StateHash` bleibt bei identischer Engine-Historie unabhängig von Chatnachrichten stabil.
5. KI-Input-DTOs und DecisionDebug enthalten keine Chattexte, Chat-IDs oder Reporttexte.
6. Report-/Block-/Retention-Pfade nutzen Chatreferenzen und redigierte Evidence, keine kopierten FullState- oder Hidden-Daten.
7. Observability-, Fehler- und Auditlogs redigieren Tokens, private Matchdaten und Chatrohtexte gemäß Policy.

## Folgepakete

Angelegt:

1. `act-2026-05-17-v2-chat-redaction-boundary-tests` - Redaction-/Boundary-Testplan für Chat gegen Replay, StateHash, AIInput und DecisionDebug.
2. `act-2026-05-17-v2-chat-data-model-retention-policy` - Datenmodell-, Retention-, Export- und Löschvertrag für Chatnachrichten.
3. `act-2026-05-17-v2-chat-report-block-ui-contract` - Report-/Block-/UI-Vertrag für Lobby-/Matchchat ohne globale Chatfreigabe.

Bestehende angrenzende Pakete bleiben relevant: `act-2026-05-17-v2-moderation-evidence-export-contract` und `act-2026-05-17-v2-moderator-runbook-draft`.

## Entscheidung

V2.2 Chat bleibt blockiert, bis Datenschutz, Report/Block, Retention, Moderationszugriff und Redaction-Tests konkretisiert sind. Der erlaubte Zielpfad ist ein berechtigungsgebundener Lobby-/Matchchat als UGC-Schicht. Chat wird nicht Teil von GameEvents, Replay, StateHash, AIInput oder DecisionDebug.
