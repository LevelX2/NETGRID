# V2.6 Moderation, Evidence und RBAC Vertrag

Stand: 2026-05-17  
Status: Planungsvertrag, keine Implementierungsfreigabe  
Zielrelease: V2.6 Moderation Console

## Ausgangslage

Die Roadmap macht Moderation zu einem harten Gate vor öffentlichem Ausbau: V2.2 Chat verlangt Report-, Block-, Retention- und Datenschutzmodell; V2.3 Public Lobby verlangt aktive Moderations- und Abuse-Pfade; V2.6 fordert Reports, Sanktionen, Evidenz, Audit, RBAC und minimale Datenansicht; V2.8 Public Replay braucht Abuse- und Moderationsintegration.

Bestehende technische Anker:

- Startlobby-Chat existiert als `startLobby.chatMessages`, nicht als GameEvent.
- Private Replay-Ansichten können Runner-/Korp-Perspektiven laden; `local_analysis` ist lokal und nicht exportierbar.
- Replay-Index enthält Matchmetadaten, finalen StateHash und Teilnehmernamen.
- Connection-Audit existiert als technische Verbindungs-/WebSocket-Auditfläche.
- Storage-Maintenance kennt Retention-Schutz, aber keine Moderationsretention.

## Geplanter Scope

V2.6 darf nur einen Moderationsvertrag und spätere kleine Slices vorbereiten:

1. Rollenmodell und Zugriffsarten festlegen.
2. Datenklassen und Evidence-Quellen klassifizieren.
3. Hidden-Info-Zugriff default-deny und nur als dokumentierte Ausnahme erlauben.
4. Audit-Log- und Retention-Anforderungen definieren.
5. Test- und Runbook-Folgepakete schneiden.

V2.6 darf keine Regelentscheidung, keine Engine-Änderung, keine Kartenfreigabe und keine automatisierte LLM-Sanktion einführen.

## Rollenmodell

| Rolle | Zweck | Darf | Darf nicht |
| --- | --- | --- | --- |
| `system` | technische Verarbeitung | Reports annehmen, Auditereignisse schreiben, Retention-Jobs ausführen | menschliche Entscheidungen treffen |
| `admin` | Betrieb und Rollenverwaltung | Rollen vergeben, Sanktionen bestätigen, Break-Glass-Fälle freigeben, Retention-Policy verwalten | FullState/Hidden-Daten ohne dokumentierte Ausnahme pauschal ansehen |
| `moderator` | Reportbearbeitung | Reportqueue sehen, redigierte Evidence prüfen, Sanktionen nach Policy vorschlagen/setzen | Token, FullState, private Payloads, gegnerische Decklisten oder KI-Debug pauschal sehen |
| `support_readonly` | Support ohne Sanktion | sichere Matchmetadaten, Status, Replay-Integrität, eigene Reportkommunikation sehen | Sanktionen setzen, Rollen ändern, Hidden-Daten ansehen |
| `reporter_self` | meldender Nutzer | eigenen Reportstatus und eigene eingereichte Evidenz sehen | interne Notizen, andere Reports, gegnerische Hidden-Daten sehen |

RBAC ist serverseitig zu erzwingen. UI-Ausblendung ist kein Gate.

## Datenklassen

| Klasse | Beispiele | Standardzugriff |
| --- | --- | --- |
| `D0_public_lobby_metadata` | Match-ID kurz/lang, Status, Modus, Erstellzeit, freigegebene Lobby-Metadaten | Admin, Moderator, Support |
| `D1_account_pii` | Account-ID, Anzeigename, optionaler Kontaktkanal, Session-Metadaten | Admin eng, Moderator nur redigiert, Support minimal |
| `D2_user_generated_content` | Chattext, Reporttext, Moderationsnotizen | Moderator/Admin, Reporter nur eigene Eingaben |
| `D3_public_replay_projection` | public-safe Replay, StateHash, Eventfamilie, Hidden-Info-Barriere-Marker | Moderator/Admin/Support |
| `D4_side_private_projection` | Runner- oder Korp-Perspektive, eigene private Replay-Projektion | nur betroffene Seite oder Break-Glass-Fall |
| `D5_hidden_match_data` | FullState, `privatePayload`, `cardInstances`, verdeckte Karten, gegnerische Decklisten | default-deny, nur Break-Glass |
| `D6_ai_debug_data` | `AIInput`, `DecisionDebug`, Belief-Fakten/Hypothesen | default-deny, nur KI-Fehlerbericht-Policy, nie für automatische Sanktion |
| `D7_ops_audit_data` | Connection-Audit, Rate-Limit-Events, Health/Metrics | Admin/Support redigiert, Moderator nur falls reportrelevant |

Token, Token-Hashes, Roh-Cookies, Invite-/Recovery-Codes und lokale Dateipfade sind keine Evidence-Daten und bleiben in Moderationsflächen verboten.

## Zugriffsmatrix

| Datenklasse | Admin | Moderator | Support | Reporter |
| --- | --- | --- | --- | --- |
| `D0_public_lobby_metadata` | lesen | lesen | lesen | eigener Kontext |
| `D1_account_pii` | eng lesen | redigiert | minimal | eigene Daten |
| `D2_user_generated_content` | lesen | lesen | keine Sanktion, optional read-only | eigene Meldung |
| `D3_public_replay_projection` | lesen | lesen | lesen | falls geteilt/eigener Match |
| `D4_side_private_projection` | Break-Glass oder eigene Seite | Break-Glass oder Reportseite nach Policy | nein | eigene Seite |
| `D5_hidden_match_data` | Break-Glass | nein, außer gemeinsam freigegebener Break-Glass | nein | nein |
| `D6_ai_debug_data` | redigierter KI-Bugkontext | kein Standardzugriff | nein | nein |
| `D7_ops_audit_data` | lesen | reportbezogen redigiert | lesen, redigiert | nein |

## Evidence-Quellen

### Reports

Ein zukünftiger Report speichert mindestens:

- `reportId`, `createdAt`, `reporterAccountId`, optional `reportedAccountId`.
- `category`, `freeText`, `matchId`, optional `eventId`/`chatMessageId`.
- `reporterSide`, falls Matchbezug besteht.
- Evidence-Referenzen statt kopierter FullState-Daten.
- Status, Bearbeiter, Audit-Referenzen.

Reporttexte sind User-generated Content und dürfen nicht in Engine, Replay-StateHash oder KI-Input eingehen.

### Chatdaten

Der bestehende Lobbychat ist pre-match, max. 300 Zeichen pro Nachricht und wird im Startlobby-Zustand gehalten. Für V2.2/V2.6 gilt:

- Chat bleibt getrennt von GameEvents.
- Chat erscheint nicht in StateHash.
- Chat wird nur mit Match-/Lobbyberechtigung geladen.
- Chat kann Evidence sein, darf aber keine Hidden-Info-Freigabe auslösen.
- Chatdaten brauchen eigene Retention und Lösch-/Exportentscheidung.

### Replay und Matchintegrität

Public-safe Evidence darf verwenden:

- `matchId`, Status, Modus, Format, Baseline, Created/Updated.
- finaler StateHash und Replay-OK-Status.
- redigierte PublicEvents und Hidden-Info-Barriere-Marker.
- side-sichere Runner-/Korp-Perspektive nur nach Policy.

Nicht zulässig ohne Break-Glass:

- `local_analysis`.
- FullState und `privatePayload`.
- verdeckte Kartenidentitäten.
- gegnerische private Decklisten oder Snapshots.
- `AIInput` und `DecisionDebug`.

### Connection Audit und Ops-Daten

Connection-Audit kann Abuse-Indizien liefern: Origin, Rate-Limit-Kategorie, WebSocket-Join-Erfolg/Fehler, MatchId, Side. Diese Daten sind technische Evidenz und müssen tokenfrei bleiben. Moderatorzugriff ist auf reportbezogene, redigierte Auszüge zu begrenzen.

## Hidden-Info-Policy

Default: kein Moderator sieht FullState, verdeckte Karten, private Payloads oder gegnerische Decklisten.

Break-Glass ist nur zulässig, wenn alle Bedingungen erfüllt sind:

1. konkreter Report oder Sicherheitsvorfall mit Matchbezug.
2. schriftlicher Grund und Datenklasse.
3. engster möglicher Zeitraum, Match und Eventbereich.
4. Admin-Freigabe; bei mehr als einer verfügbaren Admin-/Moderatorperson Vier-Augen-Freigabe.
5. Auditereignis mit Actor, Ziel, Datenklasse, Grund, Zeit, Ergebnis.
6. Export der Break-Glass-Evidenz bleibt gesperrt, bis ein separater Evidence-Export-Vertrag existiert.

Hidden-Daten dürfen nicht als Grundlage automatischer Sanktionen dienen. Wenn Hidden-Daten für eine manuelle Entscheidung genutzt wurden, muss der Audit-Eintrag das anzeigen, ohne die Hidden-Daten selbst zu leaken.

## Audit-Anforderungen

Jede Moderationsaktion schreibt ein manipulationsarmes Auditereignis:

- `auditId`, `timestamp`, `actorAccountId`, `actorRole`.
- `action`: `report_viewed`, `evidence_viewed`, `sanction_created`, `sanction_changed`, `role_changed`, `break_glass_requested`, `break_glass_approved`, `export_created`.
- `targetType` und `targetId`.
- `dataClass`.
- `reasonCode` und optional kurze Begründung.
- Ergebnis `allowed`/`denied`.
- keine Tokens, keine Roh-Cookies, keine Invite-Codes, keine FullState-Fragmente.

Audit-Logs dürfen selbst nicht zur Hidden-Info-Quelle werden. `targetId` darf Match- oder Report-ID sein, aber keine private CardInstance-ID.

## Retention und Export

V2.6 muss Policy-Werte festlegen, bevor Implementierung startet. Vorgeschlagene Alpha-Defaults:

| Datenart | Vorschlag | Hinweis |
| --- | --- | --- |
| unberichteter Lobbychat | Match-Retention oder kürzer | keine dauerhafte Chatarchivierung ohne Report |
| Report ohne Sanktion | 90 Tage nach Abschluss | Wert ist Produktentscheidung, keine Rechtsbehauptung |
| Report mit Sanktion | 180 Tage nach Ablauf/Aufhebung | Appeal-Pfad berücksichtigen |
| Moderationsaudit | 365 Tage oder deployerspezifisch | manipulationsarm, stark redigiert |
| Break-Glass-Audit | mindestens so lang wie Sanktion/Appeal | keine Hidden-Inhalte im Audit |
| Evidence-Export | nur manuell, Ablauf/Downloadfenster kurz | kein FullState-Export |

Evidence-Export darf erst nach eigenem Vertrag starten. Exportierbar sind zunächst nur redigierte Reports, Chatnachrichten, public-safe Replay-Auszüge, StateHash-Integritätsdaten und Audit-Zusammenfassungen.

## Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
| --- | --- |
| Moderationskonsole wird faktische FullState-Ansicht | Datenklassen, RBAC und Break-Glass default-deny testen |
| Chat wird Regel- oder KI-Kanal | Chat getrennt von GameEvents, StateHash und AIInput halten |
| Replay-Evidence leakt Hidden Info | Public-safe Projektionen und Hidden-Info-Barriere-Tests als Gate |
| Admin-/Moderatorzugriff wird nicht auditiert | jede Ansicht und jede Aktion auditieren |
| Retention wird als Sofortlöschung missverstanden | Retention-Werte und Backup-Grenzen dokumentieren |
| LLM-/KI-Moderation greift zu früh | automatisierte Sanktion und LLM-Moderation ausdrücklich deferred |

## Akzeptanzkriterien für Umsetzungsslices

- RBAC-Tests belegen erlaubte und verbotene Rollenrechte.
- Redaction-Tests prüfen Tokens, Token-Hashes, FullState, `privatePayload`, `cardInstances`, Decklisten, `AIInput` und `DecisionDebug`.
- Moderations-Evidence nutzt Referenzen und public-safe Projektionen statt kopierter Hidden-Daten.
- Jede Moderationsansicht schreibt Audit oder ist bewusst auditfrei begründet.
- Retention-/Export-Grenzen sind im UI-/API-Vertrag sichtbar.
- Kein Moderationsslice verändert Engine, Replay-StateHash, LegalActions oder Kartenfreigaben.

## Handoff

Nächste kleine Pakete:

1. `act-2026-05-17-v2-moderation-rbac-redaction-tests` - RBAC- und Redaction-Testmatrix für Moderator-/Admin-/Support-Sichten.
2. `act-2026-05-17-v2-moderation-evidence-export-contract` - Evidence-Export-Vertrag mit Datenklassen, Ablauf und Exportverboten.
3. `act-2026-05-17-v2-moderator-runbook-draft` - Moderator-Runbook für Reportbearbeitung, Break-Glass und Appeals.

Bereits vorhandene angrenzende Pakete:

- `act-2026-05-17-v2-observability-redaction-baseline`
- `act-2026-05-17-v2-public-replay-policy-projection`
- `act-2026-05-17-v2-chat-contract-preflight`
- `act-2026-05-17-v2-platform-gate-inventory`
