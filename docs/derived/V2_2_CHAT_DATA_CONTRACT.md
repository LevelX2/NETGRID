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

## Offene Datenschutz- und Moderationsentscheidungen

| Thema | Entscheidung vor Implementierung |
| --- | --- |
| Retention | Dauer für unberichteten Chat, berichteten Chat, gelöschten Chat und Backup-Auslauf festlegen |
| Export/Löschung | Account-Self-Export, Löschauftrag, Anonymisierung und Report-Ausnahme mit V2.0/V2.6 abstimmen |
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
