# V2.2 Chat-Report-, Block- und UI-Vertrag

Stand: 2026-05-17
Status: Produktvertrag, keine Implementierungsfreigabe
Zielrelease: V2.2 Minimal Chat Gate

## Zweck und Grenze

Dieser Vertrag konkretisiert den Report-, Block- und UI-Zustandspfad für späteren berechtigungsgebundenen Lobby- oder Matchchat. Er ergänzt `docs/derived/V2_2_CHAT_DATA_CONTRACT.md` und bindet den Moderationshandoff an die Evidence-Grenzen aus `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md` sowie `docs/derived/V2_6_MODERATION_EVIDENCE_EXPORT_CONTRACT.md`.

Der Vertrag gibt keinen globalen oder öffentlichen Chat frei. Er führt keine Moderationskonsole, keine automatisierte Sanktion, keine LLM-Moderation und keine UI-Implementierung ein. Chat-, Report- und Blockdaten bleiben außerhalb von Engine, `GameState`, `GameEvent`, `PublicGameEvent`, Replay, StateHash, `LegalAction`, `PlayerAction`, `AIInput` und `DecisionDebug`.

## Ausgangslage

V2.2 darf Chat nur als User-generated-Content-Schicht planen. Der vorhandene private Lobbychat ist eng auf die Startlobby begrenzt und ist kein GameEvent. Der Chat-Datenvertrag hält bereits fest, dass Chatdaten `D2_user_generated_content` sind, getrennt gespeichert werden und erst nach Report-, Block-, Retention-, Datenschutz- und Redaction-Gates erweitert werden dürfen.

Dieser Vertrag schließt den bisher offenen V2.2-Teil zu Reportzielen, Block-Semantik, sicheren UI-Zuständen und Moderationshandoff.

## Reportziele

Reports sind Nutzeraktionen gegen eine klar begrenzte Plattform- oder Chatreferenz. Ein Report darf mehrere Evidence-Referenzen enthalten, aber genau ein primäres Ziel besitzen.

| Primäres Ziel | Ziel-ID | Typische Nutzung | Pflichtreferenzen | Harte Grenze |
| --- | --- | --- | --- | --- |
| `chat_message` | `chatMessageId` | konkrete Nachricht melden | `conversationScope`, `lobbyId` oder `matchId`, Reporter, gemeldeter Sender, Zeitstempel | keine Engine-Event-, Replay- oder Action-ID als Ersatz verwenden |
| `user` | `reportedAccountId` oder redigierte `reportedSessionRef` | Verhalten einer Person melden, auch wenn mehrere Nachrichten betroffen sind | Nutzer-/Sessionreferenz, Kontext, optional mehrere `chatMessageId`-Referenzen | keine Roh-Sessiontokens, Cookies, Token-Hashes oder Gegnerpayloads |
| `match` | `matchId` | Verhalten rund um ein konkretes Match melden | Match-Metadatenanker, Reporter-Seite, optional Chat-/Public-safe-Evidence | kein FullState, keine Hidden-Zonen, keine Decklisten, keine `privatePayload` |
| `lobby` | `lobbyId` | Verhalten in einer privaten oder später berechtigten Lobby melden | Lobby-Metadatenanker, Teilnehmerprojektionen, optional Chatnachrichten | keine Public-Lobby-Freigabe und kein globaler Chatkontext |

### Reportdaten

Ein späterer V2.2-Report speichert mindestens:

- `reportId`, `createdAt`, `reporterAccountId` oder redigierte Reporter-Sessionreferenz.
- `targetType`: `chat_message`, `user`, `match` oder `lobby`.
- `targetRef`: opaque Zielreferenz passend zum Zieltyp.
- `category`: enges Produktschema, zum Beispiel `harassment`, `hate_or_slur`, `threat`, `spam`, `cheating_claim`, `privacy`, `other`.
- optionaler `reportText` als `D2_user_generated_content`.
- `conversationScope`, falls Chatbezug besteht: `lobby` oder `match`.
- `evidenceRefs`: referenzierte Evidence-Quellen, keine kopierten Engine-, Replay-, KI- oder Hidden-Info-Payloads.
- `status`: `received`, `in_review`, `action_taken`, `closed_no_action`, `closed_duplicate` oder `withdrawn`.
- `retentionClass`: bei Chatbezug mindestens `reported_chat_evidence`; für Auditdaten `moderation_audit`.

Reporttexte und Reportstatus verändern keine Spielregeln, keine laufende Partie, keine LegalActions, keinen Replay-StateHash und keine KI-Entscheidung.

## Evidence-Referenzen

Reports übergeben Evidence als Referenzen an V2.6, nicht als Vollkopien sensibler Spielzustände.

| Evidence-Referenz | Erlaubter Inhalt | Verboten |
| --- | --- | --- |
| `chat_message_ref` | `chatMessageId`, Scope, Zeitstempel, Senderprojektion, kurzer reportbezogener Kontext nach Retention-Policy | vollständige fremde Chatverläufe ohne Reportbezug, Roh-Sessiondaten |
| `conversation_context_ref` | begrenztes Kontextfenster um gemeldete Chatnachrichten, nur berechtigte Teilnehmerprojektionen | globale Chatlogs, nicht betroffene Lobbys oder Matches |
| `public_match_ref` | `matchId`, Modus, Format, Zeitfenster, finaler StateHash, Replay-OK-Status, public-safe Eventfamilien | FullState, `privatePayload`, verdeckte Karten, gegnerische Decklisten |
| `ops_abuse_ref` | redigierte Rate-Limit-, Join-, Origin- oder WebSocket-Kategorien im relevanten Zeitfenster | Tokens, Token-Hashes, IP-Vollhistorie ohne eigene Policy, lokale Pfade |
| `audit_ref` | Reportannahme, Evidence-View, Block-/Moderationsaktion, Actor, Rolle, Ergebnis | Chatrohtext im Audit, Hidden-Daten, private CardInstance-IDs |

Falls eine spätere Moderationsentscheidung Break-Glass braucht, bleibt das ein V2.6-Vorgang. V2.2 Reports dürfen Break-Glass weder auslösen noch vorbereitend Hidden-Daten kopieren. Ein Evidence-Export darf Break-Glass nur als Audit-Metadatum erwähnen.

## Block-Semantik

Blockieren ist eine Nutzerpräferenz und Abuse-Schutzschicht. Es ist kein Spielmechanismus und keine Sanktion.

| Bereich | Vertrag |
| --- | --- |
| Ziel | Account bevorzugt; falls kein Account existiert, redigierte Match-/Lobby-Sessionreferenz mit kurzer Lebensdauer. |
| Richtung | Block ist einseitig: Der blockierende Nutzer entscheidet, welche Interaktion er empfängt. |
| Sichtbarkeit | Neue Nachrichten blockierter Ziele werden für den Blockierenden ausgeblendet oder durch neutralen Platzhalter ersetzt. |
| Senden | In direkten Zwei-Personen-Lobby-/Matchchat-Kontexten darf der Server neue Chatlieferung zwischen Blockierendem und Blockiertem verhindern. In Mehrpersonen-Kontexten wird nur die Zustellung an den Blockierenden unterdrückt, solange kein eigenes Gate etwas anderes entscheidet. |
| Bestehende Nachrichten | Vorhandene Nachrichten können lokal ausgeblendet werden; gemeldete Nachrichten bleiben als Evidence-Referenz erhalten, wenn Retention dies verlangt. |
| Matchablauf | Block verändert keine laufende Partie, keine PlayerActions, keine Turn-Timer, keinen Forfeit und keinen StateHash. Verlassen, Abbruch oder Forfeit bleiben separate Match-Lifecycle-Aktionen. |
| Lobby | Block darf neue private Einladungen, direkte Lobby-Chat-Zustellung und spätere Friend-/Invite-Flows vom blockierten Ziel zum Blockierenden verhindern. Er kickt niemanden automatisch aus einer laufenden Lobby. |
| Freunde/Invites | Friend-Requests, Direktinvites und erneute direkte Kontakte blockierter Accounts werden dem Blockierenden nicht zugestellt; der Absender bekommt nur eine neutrale Nichtzustellbarkeit. |
| Matchmaking | Kein V2.2-Scope. Eine spätere Matchmaking-Schicht darf Blocklisten berücksichtigen, braucht aber eigenes Abuse-/Privacy-Gate. |
| Moderation | Block kann optional mit einem Report kombiniert werden, ist aber keine Moderationsentscheidung und keine Sanktion. |

### Blockstatus

Ein späteres Datenmodell darf folgende Status verwenden:

| Status | Bedeutung |
| --- | --- |
| `not_blocked` | keine aktive Blockregel zwischen Betrachter und Ziel. |
| `blocked_by_self` | Betrachter blockiert das Ziel; UI blendet Zielinteraktionen aus oder deaktiviert direkte Zustellung. |
| `blocked_by_other` | nur intern relevant; UI darf daraus keine stabile Blockliste anderer Nutzer offenlegen. |
| `mutual_block` | beide Richtungen bestehen; UI zeigt für den Betrachter nur die eigene Blockentscheidung. |
| `unblocked` | frühere Blockregel aufgehoben; Audit-/Retention-Metadaten können nach Policy bleiben. |

`blocked_by_other` darf dem betroffenen Nutzer nicht als soziale Information präsentiert werden. Serverantworten verwenden neutrale Texte wie nicht zustellbar oder nicht verfügbar, damit Blocklisten nicht auslesbar werden.

## UI-Zustände und sichere Texte

Die folgenden Texte sind Produktvorschläge für spätere UI-Slices. Sie sind sicher formuliert, weil sie keine Moderatorentscheidung, keine versteckte Blockliste, keine Hidden-Info und keine technische Interna offenlegen.

### Nachricht melden

| Zustand | UI-Verhalten | Sicherer Text |
| --- | --- | --- |
| `report_available` | Menüpunkt an Nachricht oder Nutzer sichtbar | `Nachricht melden` |
| `report_dialog_open` | Dialog mit Ziel, Kategorie und optionalem Text | `Melde diese Nachricht an die Moderation. Bitte beschreibe kurz, was geprüft werden soll.` |
| `report_submit_disabled` | Pflichtangabe fehlt oder Rate-Limit aktiv | `Bitte wähle einen Grund aus.` |
| `report_submitting` | Anfrage läuft | `Meldung wird gesendet ...` |
| `report_received` | Server hat Report angenommen | `Meldung erhalten. Danke, wir prüfen den Fall.` |
| `already_reported_by_self` | Nutzer hat dieselbe Zielreferenz bereits gemeldet | `Du hast das bereits gemeldet.` |
| `message_unavailable` | Nachricht gelöscht, ausgeblendet oder nicht mehr in Retention | `Diese Nachricht ist nicht mehr verfügbar.` |
| `report_denied_not_participant` | Nutzer ist für Lobby/Match nicht berechtigt | `Du kannst nur Inhalte aus deinen eigenen Lobbys oder Matches melden.` |
| `report_rate_limited` | Missbrauchsschutz greift | `Bitte warte kurz, bevor du eine weitere Meldung sendest.` |
| `report_failed_generic` | unbekannter Fehler | `Meldung konnte nicht gesendet werden. Bitte versuche es später erneut.` |

Der Dialog darf keine Zusage zu Sanktionen oder Bearbeitungszeit machen. Reporter-Self-Status bleibt auf eigene Reports begrenzt.

### Person blockieren

| Zustand | UI-Verhalten | Sicherer Text |
| --- | --- | --- |
| `block_available` | Menüpunkt an Nutzer oder Chatnachricht sichtbar | `Person blockieren` |
| `block_confirm` | Bestätigung vor Aktivierung | `Du siehst von dieser Person keine neuen Chatnachrichten mehr. Das ändert die laufende Partie nicht.` |
| `block_submitting` | Anfrage läuft | `Blockierung wird gespeichert ...` |
| `blocked_by_self` | Ziel ist blockiert | `Du hast diese Person blockiert.` |
| `blocked_message_placeholder` | ausgeblendete Nachricht im Verlauf | `Nachricht von blockierter Person ausgeblendet.` |
| `direct_send_blocked` | Nutzer versucht Direktchat an blockiertes Ziel | `Du hast diese Person blockiert. Hebe die Blockierung auf, bevor du eine Nachricht sendest.` |
| `delivery_unavailable` | Absender kann Ziel nicht erreichen, ohne fremde Blockentscheidung zu verraten | `Nachricht konnte nicht zugestellt werden.` |
| `block_failed_generic` | unbekannter Fehler | `Blockierung konnte nicht gespeichert werden. Bitte versuche es später erneut.` |

### Entblocken

| Zustand | UI-Verhalten | Sicherer Text |
| --- | --- | --- |
| `unblock_available` | Aktion in Nutzer- oder Chatmenü | `Blockierung aufheben` |
| `unblock_confirm` | Bestätigung | `Neue Nachrichten dieser Person können wieder angezeigt werden. Frühere Meldungen bleiben davon unberührt.` |
| `unblock_submitting` | Anfrage läuft | `Blockierung wird aufgehoben ...` |
| `unblocked` | Erfolg | `Blockierung aufgehoben.` |
| `unblock_failed_generic` | unbekannter Fehler | `Blockierung konnte nicht aufgehoben werden. Bitte versuche es später erneut.` |

### Gemeldete oder moderationell verborgene Nachrichten

| Zustand | UI-Verhalten | Sicherer Text |
| --- | --- | --- |
| `reported_by_self_marker` | unaufdringlicher Status an eigener Meldung | `Gemeldet` |
| `evidence_locked` | Reportretention hält Nachricht trotz normaler Löschung | `Diese Nachricht ist Teil einer Meldung und wird nach Moderationsrichtlinie aufbewahrt.` |
| `hidden_by_moderation` | Nachricht im normalen Chatverlauf verborgen | `Nachricht verborgen.` |
| `deleted_message` | Rohtext gelöscht | `Nachricht gelöscht.` |
| `report_status_closed` | Self-Status, ohne interne Notizen | `Prüfung abgeschlossen.` |

UI darf keine internen Moderatornotizen, Break-Glass-Gründe, fremde Reports, fremde Blockentscheidungen oder Sanktionserwägungen anzeigen.

## Datenschutz- und Exportwirkung

| Vorgang | Wirkung |
| --- | --- |
| Account-Self-Export | darf eigene Reports, eigene Reporttexte, eigene Blocklist-Projektion und eigene gesendete Chatnachrichten enthalten, soweit Retention sie hält. |
| Account-Löschung | anonymisiert oder entfernt Accountbezüge in Chat-/Report-/Blockmetadaten nach V2.0; Evidence kann nach V2.6-Retention weiterlaufen. |
| Nachricht löschen | entfernt Rohtext aus normalem Chatverlauf; Report-Evidence kann als referenzierte D2-Projektion erhalten bleiben. |
| Blockliste löschen | entfernt aktive Zustell-/Anzeigepräferenz; Audit-/Abuse-Metadaten laufen nach Policy aus. |
| Report zurückziehen | kann Reporter-Self-Status ändern, löscht aber nicht automatisch Evidence, wenn Moderations- oder Abuse-Retention greift. |

Blocklisten sind personenbezogene Nutzerpräferenzen. Sie dürfen nicht öffentlich, nicht gegenüber blockierten Personen und nicht in Gegnerpayloads offengelegt werden.

## Review- und Testchecks für spätere Umsetzung

Ein späterer Implementierungsslice braucht mindestens diese Gates:

1. Reportannahme akzeptiert nur berechtigte Lobby-/Matchteilnehmer oder berechtigte Accountkontexte.
2. Reportziele `chat_message`, `user`, `match` und `lobby` sind schematisch getrennt und nutzen opaque Referenzen.
3. Evidence-Referenzen enthalten keine `GameState`, `GameEvent`, `PublicGameEvent`, `privatePayload`, `cardInstances`, Hidden-Zonen, Decklisten, Tokens, Token-Hashes, `AIInput`, `DecisionDebug` oder lokalen Pfade.
4. Blockieren verändert keine Engine-Historie, keinen Replay-Export, keinen StateHash und keine LegalActions.
5. Reconnect-Payloads enthalten keine fremden Blockentscheidungen und keine erweiterten Chatdaten ohne Berechtigung.
6. UI-Texte verraten keine fremden Blocklisten, keine Sanktionen, keine Moderatornotizen und keine Hidden-Info.
7. Report-/Block-/Audit-Logs sind tokenfrei und enthalten keinen Chatrohtext außerhalb der festgelegten Evidence-/Retention-Policy.
8. Account-Self-Export und Evidence-Export verwenden getrennte Schemas und vermischen keine Zwecke.

## Offene Policy-Fragen

| Thema | Entscheidung vor Implementierung |
| --- | --- |
| Konkrete Retentionwerte | Fristen für unberichteten Chat, gemeldete Chat-Evidence, Reports, Block-Audit, Sanktionen und Backups festlegen. |
| Reportkategorien | finales Kategorienschema und zulässige Freitextlänge bestimmen. |
| Kontextfenster | Anzahl oder Zeitfenster benachbarter Chatnachrichten definieren, die als Evidence referenziert werden dürfen. |
| Session-only Blocking | Lebensdauer und Migration von Session-Blockierungen zu Account-Blockierungen nach Login entscheiden. |
| Multi-User-Lobby | Zustellungslogik bei blockierten Personen in mehr als Zwei-Personen-Kontexten vor Public- oder Gruppenlobbys separat freigeben. |
| Appeals und Nutzerkommunikation | Status- und Widerspruchstexte nach Moderationsrunbook entscheiden. |
| Abuse-Rate-Limits | Limits für Reports, Blocks, Unblocks und wiederholte Meldungen festlegen. |

## Handoff

Ein späterer `release-implementation-agent`-Slice darf aus diesem Vertrag nur eng vorbereiten:

- Report-/Block-Schema und Storage getrennt von Engine und Replay.
- Servervalidierung für berechtigte Reportziele und Blockzustellung.
- Redaction-/Negativtests gegen Hidden-Info-, Token-, Replay-, StateHash- und KI-Leaks.
- UI-Zustandsabbildung mit den sicheren Texten aus diesem Vertrag.

Nicht freigegeben bleiben globale Chats, öffentliche Chatflächen, Moderationskonsole, LLM-Moderation, automatisierte Sanktionen, Public Replay, Engine-/Replay-/StateHash-/KI-Änderungen und Matchmaking-Blocklisten.

## Entscheidung

V2.2 kann Report-, Block- und UI-Zustände als Produktvertrag weiterführen, ohne Chat öffentlich freizugeben. Der erlaubte Pfad ist ein berechtigungsgebundener Lobby-/Matchchat mit referenzierter Moderations-Evidence, einseitiger Blockpräferenz, sicheren UI-Texten und harten Grenzen gegen Engine, Replay, StateHash, Hidden Info und KI.
