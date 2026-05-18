# V2.3 Public Lobby Redaction- und Rate-Limit-Testmatrix

Stand: 2026-05-17
Status: Planungsmatrix, keine Implementierungsfreigabe
Zielrelease: V2.3 Public Lobby Alpha

## Zweck

Diese Matrix definiert die Testspur für einen späteren Public-Lobby-Alpha-Slice. Sie erweitert die private V2.3a-LAN-Lobby-Testbasis um öffentliche Redaction-, Rate-Limit-, Abuse- und Ops-Signal-Gates.

Die Matrix gibt keine Public Lobby, keine Public-Lobby-API, keine Testimplementierung, kein Matchmaking, keine Accounts, keinen globalen Chat, keine Moderationskonsole, keine Replay-/Spectator-Freigabe, keine KI-Erweiterung und keine Kartenfreigabe frei.

## Quellen

- `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-gap-review-2026-05-17.md`
- `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-risk-review-2026-05-17.md`
- `docs/releases/v2/v2-3-public-lobby-alpha/lan-open-lobby-mini-test-matrix.md`
- `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md`
- `docs/releases/v2/v2-6-moderation/rbac-redaction-test-matrix.md`
- `docs/releases/v2/v2-7-observability/observability-redaction-baseline.md`
- `tests/specs/visibility-contract.test.ts`

## Testobjekte

| Objekt | Öffentliche Erwartung | Harte Grenze |
| --- | --- | --- |
| Lobby-Liste | Liefert nur freigegebene D0-Public-Lobby-Metadaten. | Keine Tokens, Account-IDs, Deckdaten, Hidden-Info, FullState- oder Debugdaten. |
| Filter und Refresh | Nutzt nur erlaubte Filterfelder und serverseitige Begrenzung. | Keine freien PII-, Decknamen-, Decklisten- oder privaten Snapshot-Suchen. |
| Join aus Liste | Nutzt den bestehenden serverautoritativen Join-Pfad mit erneuter Validierung. | Keine zweite Join-Autorität und keine Capability- oder Existenzleaks. |
| Stale Entries | Lehnt nicht mehr joinbare Einträge neutral ab und aktualisiert die Liste. | Keine Statusdetails zu privaten, aktiven, gelöschten oder moderierten Matches. |
| Fehlerpayloads | Enthalten stabile, neutrale Error-Codes. | Keine Rohfehler, Stacktraces, lokalen Pfade, Tokens oder privaten IDs. |
| Ops-/Audit-Signale | Schreiben redigierte, korrelierbare Abuse- und Rate-Limit-Ereignisse. | Keine PII, Roh-IP, Tokens, Token-Hashes, Deckdetails, Hidden-Info oder KI-Debugdaten. |

## Erlaubte Public-Lobby-Metadaten

Ein späterer Umsetzungsslice muss die finalen Feldnamen festlegen. Die Tests müssen aber erzwingen, dass jedes gelistete Feld einer der folgenden erlaubten Klassen entspricht.

| Feldklasse | Beispiele | Testanforderung |
| --- | --- | --- |
| Public Lobby Identifier | kurzlebige `publicLobbyId` oder kurze `matchId`-Projektion | Nicht als Join-Capability nutzbar, nicht aus Account-, Token- oder Speicher-IDs ableitbar. |
| Status | `open`, `full`, `starting_soon`, `unavailable` | Keine internen Status wie Moderationsflags, private Lifecycle-Details oder Fehlerursachen. |
| Modus | Casual, Testspiel, privater Public-Alpha-Modus | Keine Ranked-, Turnier- oder Matchmaking-Freigabe durch das Feld. |
| Formatprofil | abstrakte `formatProfileId` oder Anzeigename | Keine Deckliste, kein Deckhash, keine privaten Snapshot-IDs. |
| Cardpool-Version | abstrakte Version oder Snapshot-Familie | Keine CardInstance-IDs und keine privaten Kartenlisten. |
| Sichtbarkeitsklasse | `public_alpha` oder equivalent | Keine private LAN- oder Friend-only-Lobby als Public-Eintrag. |
| Host-Anzeige | consent-basierter Anzeigename oder redigiertes Label | Keine Account-ID, E-Mail, Kontaktkanal, Invite-Code oder Recovery-Information. |
| Sitz-/Seitenstatus | freie Plätze, Seitenbedarf, Human/KI-Modus als abstrakte Angabe | Keine Deckwahl, verdeckte Karten, PlayerView oder KI-Input. |
| Zeit/Alter | Erstellzeit-Bucket, Alter, Ablauf-Bucket | Keine präzisen internen Audit-Zeitreihen, die Nutzertracking erleichtern. |
| Region/Latenz | Region-Code oder Latenzbucket | Keine IP, kein Hostname, kein lokaler Pfad, keine Netzwerktopologie. |

## Verbotene Felder und Muster

Diese Muster müssen in Listen-, Filter-, Refresh-, Join-, Stale-, Fehler-, WebSocket-, Reconnect-, DOM-, Browser-Storage-, Log-, Metrics- und Audit-Surfaces negativ geprüft werden.

| Verbotsklasse | Beispiele | Erwartung |
| --- | --- | --- |
| Roh-Tokens | `sessionToken`, `reconnectToken`, `joinToken`, Account-/Invite-/Recovery-Token | Nie in Payload, DOM, Storage, Logs, Metrics oder Audit. |
| Token-Hashes | `tokenHash`, `sessionTokenHash`, `inviteTokenHash`, `sha256:*` | Nie öffentlich oder als Moderations-/Ops-Signal ausgeben. |
| Account-/PII-Daten | Account-ID, E-Mail, Kontaktkanal, Roh-IP, Cookie, `ng_account_session` | Nur redigierte, nicht personenbezogene Kategorien; keine Gegner- oder Lobby-Payloads mit Account-IDs. |
| Deckdaten | Deckname, Deckliste, `cards`, `deckHash`, `cloudDeckId`, private Snapshot-ID | Nur abstraktes Formatprofil und Cardpool-Version. |
| Match-Hidden-Info | `privatePayload`, `cardInstances`, verdeckte Karten, private PlayerViews, Undo-Preview | Default-deny; keine Public-Lobby- oder Fehlerkanäle. |
| FullState/Replays | `GameState`, FullState-Fragmente, private Replay-Perspektiven, `local_analysis` | Keine implizite Public-Replay- oder Spectator-Freigabe. |
| KI-Debug | `AIInput`, `DecisionDebug`, Belief State, Strategieinput | Nie Public-Lobby-, Moderations- oder Ops-Standarddaten. |
| Server-/Runtime-Interna | Stacktraces, lokale Pfade, Datenbankpfade, Storage-Key-Material | Immer redigieren oder neutralisieren. |
| Moderationsdetails | Reportstatus anderer Nutzer, Sanktionen, Blocklisten, Break-Glass-Status | Nicht über Lobby- oder Fehlerpfade ableitbar. |

## Redaction-Testmatrix

| Test-ID | Bereich | Szenario | Erwarteter Status | Erwartete Audit-/Ops-Signale | Erwartete Negativprüfung |
| --- | --- | --- | --- | --- | --- |
| V23-PL-RD001 | Allowlist | Public-Lobby-Liste enthält nur erlaubte D0-Feldklassen. | `200` | `public_lobby_list_viewed`, Zählwert/Bucket, keine Detaildaten | Keine nicht erlaubten Top-Level- oder verschachtelten Felder. |
| V23-PL-RD002 | Token-Redaction | Seed-Daten enthalten Session-, Reconnect-, Join-, Invite- und Recovery-Token. | `200` oder neutraler Fehler je nach Fixture | Redigiertes Ereignis ohne Tokenbezug | Keine Roh-Tokens in REST, WS, DOM, Storage, Logs, Metrics, Audit. |
| V23-PL-RD003 | Token-Hash-Redaction | Fixture enthält Token-Hash- und `sha256:*`-Muster. | `200` oder neutraler Fehler | Nur `redaction_violation_blocked` in Testharness, kein Hashwert | Keine Hashmuster in öffentlichen oder Ops-Surfaces. |
| V23-PL-RD004 | Deckdaten-Redaction | Public-Eintrag verweist intern auf Decknamen, Deckliste, Deckhash und Snapshot-ID. | `200` | `public_lobby_list_viewed` mit Format/Cardpool-Bucket | Keine Decknamen, Kartenliste, `cards`, `deckHash`, `cloudDeckId`, private Snapshot-ID. |
| V23-PL-RD005 | PII-Redaction | Host/Joiner besitzt Account-ID, E-Mail, Kontaktkanal, Roh-IP und Cookie. | `200` | Account-/IP-Bucket redigiert oder weggelassen | Keine Account-ID, E-Mail, Roh-IP, Cookie oder Kontaktinformation. |
| V23-PL-RD006 | Hidden-Info-Redaction | Match hat PlayerViews, verdeckte Karten, `privatePayload`, `cardInstances`, Undo-Preview. | `200` | Keine Hidden-Info-Auditdetails | Keine FullState-, PlayerView-private-, CardInstance- oder Hidden-Card-Fragmente. |
| V23-PL-RD007 | KI-Debug-Redaction | Match wurde mit KI oder Simulation erstellt und enthält `AIInput`/`DecisionDebug`. | `200` | Optionaler AI-Profil-Bucket ohne Debug | Keine `AIInput`, `DecisionDebug`, Belief-Fakten oder Strategieinputs. |
| V23-PL-RD008 | Fehlerpayload | Interner Serverfehler wird im Public-Lobby-Kontext simuliert. | `500` mit neutralem `errorCode` | `public_lobby_error`, redigierter Fehlercode, kein Stacktrace | Keine Stacktraces, lokalen Pfade, Tokens, IDs, Deck- oder Hidden-Daten. |
| V23-PL-RD009 | WebSocket/Reconnect | Lobby-Status wird über WS/Reconnect aktualisiert. | Verbindung bleibt zulässig oder neutral geschlossen | `public_lobby_ws_update` oder `public_lobby_ws_denied` redigiert | Keine privaten Match-, Token-, Deck-, PlayerView- oder FullState-Daten. |
| V23-PL-RD010 | Browser-Surface | Liste, Fehler und Refresh werden im Browser gerendert und gespeichert. | UI bleibt bedienbar | Kein zusätzliches Audit nötig außer Serverereignissen | DOM, sessionStorage und localStorage enthalten keine verbotenen Muster. |
| V23-PL-RD011 | Moderationsgrenze | Match oder Nutzer ist intern report- oder blockbezogen markiert. | `200`, `404` oder `409` nach Sichtbarkeitsvertrag | Nur redigierter `moderation_visibility_filter_applied`-Bucket | Keine Reportdetails, Sanktionen, Blocklisten oder Break-Glass-Hinweise. |
| V23-PL-RD012 | Public Replay Grenze | Match besitzt Replay-/StateHash-/Analysis-Daten. | `200` für Lobbyliste | Kein Replay-Audit durch Lobbyliste | Keine Replay-Perspektiven, `local_analysis`, StateSnapshots oder public Replay URLs. |

## Rate-Limit- und Abuse-Testmatrix

Public-Tests müssen private LAN-Komfortannahmen ausdrücklich von öffentlichem Abuse-Risiko trennen. V2.3a-LAN-Tests dürfen kleine, vertrauenswürdige Setups prüfen. V2.3-Public-Tests müssen unbekannte Nutzer, Bots, Crawling, Enumeration und Spam als Standardrisiko behandeln.

| Test-ID | Bereich | Szenario | LAN-Komfort-Erwartung | Public-Erwartung | Status / Audit |
| --- | --- | --- | --- | --- | --- |
| V23-PL-RL001 | Listenabruf normal | Authentifizierter oder geregelter Public-Guest ruft Liste im normalen Takt ab. | V2.3a bleibt flüssig ohne Public-Gate. | Antwort ist erlaubt, paginiert/begrenzt und redigiert. | `200`, `public_lobby_list_viewed`, `rateLimitCategory=public_lobby_list`. |
| V23-PL-RL002 | Listenabruf Burst | Ein Client ruft die Liste mehrfach pro Sekunde ab. | LAN darf einfache Refresh-Nutzung tolerieren. | Burst wird gedrosselt, ohne vorhandene Matches zu leaken. | `429`, `Retry-After`, `public_lobby_rate_limited`, Bucket ohne Roh-IP. |
| V23-PL-RL003 | Bot-Crawling | Viele Listenseiten/Filter werden automatisiert iteriert. | Nicht aus LAN-Scope ableitbar. | Pagination, Filter und IP-/Account-/Session-Buckets greifen. | `429`, `public_lobby_crawl_suspected`, redigierte Filterfamilie. |
| V23-PL-RL004 | Manueller Refresh | Nutzer klickt Refresh mehrfach in kurzer Zeit. | UI darf komfortabel bleiben. | Soft-Limit oder Debounce, danach neutrale Drosselmeldung. | `200` bis Limit, dann `429`, Audit mit `manual_refresh`. |
| V23-PL-RL005 | Filter-Spam | Wechselnde Format-/Modus-/Region-Filter werden schnell abgefragt. | LAN-Filter nicht Public-relevant. | Filterfamilie wird begrenzt; verbotene Filter werden abgelehnt. | `400` für unzulässige Filter, `429` bei Spam, redigiertes Audit. |
| V23-PL-RL006 | Verbotene Suchfelder | Anfrage enthält PII-, Decknamen-, Decklisten- oder Account-ID-Filter. | Nicht erlaubt. | Anfrage wird vor Query-Ausführung abgelehnt. | `400`, `public_lobby_filter_rejected`, keine Echo-Ausgabe des Rohwerts. |
| V23-PL-RL007 | Join normal | Nutzer joint einen sichtbaren, noch offenen Eintrag. | V2.3a-Join-Reuse bleibt Muster. | Bestehender Join-Pfad validiert Identität, Capability, Deck, Status und Abuse-Bucket erneut. | `200` oder bestehender Join-Erfolg, `public_lobby_join_attempt`, redigiert. |
| V23-PL-RL008 | Join-Spam gleicher Eintrag | Ein Client versucht wiederholt denselben Eintrag zu joinen. | LAN darf klare Fehlermeldung zeigen. | Join-Bucket greift, Fehler bleibt neutral. | `429`, `public_lobby_join_rate_limited`, keine Matchdetails. |
| V23-PL-RL009 | Join-Enumeration | Client probiert zufällige oder sequenzielle Public-Lobby-IDs. | Nicht aus LAN-Scope ableitbar. | Ungültig, privat, abgelaufen und nicht existent sind nicht unterscheidbar. | `404`, optional später `429`, `public_lobby_enumeration_suspected`. |
| V23-PL-RL010 | Stale Entry | Eintrag war sichtbar, ist beim Join aber aktiv, voll, abgelaufen oder entfernt. | V2.3a lehnt side-sicher ab und aktualisiert Liste. | Neutraler Konflikt ohne Detailgrund; UI lädt Liste neu. | `409`, `public_lobby_stale_join_rejected`, kein interner Status. |
| V23-PL-RL011 | Moderiert/blocked | Ein Eintrag wird durch Moderations-, Block- oder Sichtbarkeitsregel ausgefiltert. | Nicht aus LAN-Scope ableitbar. | Listing/Join unterscheidet nicht zwischen privat, moderiert, blocked und nicht existent. | `404` oder fehlender Listeneintrag, `public_lobby_visibility_filtered`. |
| V23-PL-RL012 | Unauthentifiziert | Public-Guest ist deaktiviert oder Accountpflicht gilt. | LAN kann accountfrei bleiben. | Mutierende Join-/Create-Pfade verlangen Identität nach Auth-Vertrag. | `401`, `auth_required`, keine Account- oder Sessiondetails. |
| V23-PL-RL013 | CSRF/Origin | Mutierender Public-Join kommt von nicht erlaubtem Origin oder ohne CSRF-Gate. | LAN-Origin darf eigenes Profil haben. | Server blockiert vor Join-Logik. | `403`, `origin_or_csrf_denied`, kein Capability-Detail. |
| V23-PL-RL014 | Stale-List Refresh | Liste enthält abgelaufene Einträge durch Race oder Cache. | Liste aktualisiert sich. | Abgelaufene Einträge werden nicht wiederbelebt; Audit zählt Filterung. | `200`, `public_lobby_stale_entries_filtered`. |
| V23-PL-RL015 | Health-/Metrics-Abuse | Client versucht über Lobby-Fehler oder Health-Links Betriebsdaten zu sammeln. | Nicht LAN-Komfort. | Public-Lobby-Pfad gibt keine Rohlogs/Metrics frei. | `404`/`403`/`429`, `public_lobby_ops_probe_blocked`. |

## Audit- und Ops-Signal-Vertrag für Tests

Tests dürfen redigierte Ops-Signale erwarten, aber keine Rohdaten. Zulässige Signalbestandteile:

| Signalbestandteil | Erlaubt | Verboten |
| --- | --- | --- |
| Ereignisfamilie | `public_lobby_list_viewed`, `public_lobby_rate_limited`, `public_lobby_join_attempt`, `public_lobby_stale_join_rejected` | Roh-Request, Stacktrace, FullState |
| Route-Familie | `public_lobby_list`, `public_lobby_refresh`, `public_lobby_join` | vollständige URL mit Tokens oder Query-PII |
| Actor-Kategorie | `anonymous`, `guest`, `account`, `support_probe` als Kategorie | Account-ID, E-Mail, Cookie, Roh-IP |
| Rate-Limit-Key | nicht reversibler Bucket oder interne Referenz | Roh-IP, Sessiontoken, Tokenhash |
| Matchreferenz | kurze, public-sichere Lobby-Referenz oder weggelassen | Join-Capability, private Match-ID, CardInstance-ID |
| Ergebnis | `allowed`, `denied`, `rate_limited`, `filtered`, `stale` | interner Moderations- oder Hidden-Info-Grund |
| Zeit | Zeitstempel oder Zeitbucket | fein granulare Trackingdaten, die PII ersetzen |
| Redaction | `redacted=true`, `redactionPolicyVersion` | Originalwert neben Redaction-Marker |

## Mindest-Testset für einen späteren Umsetzungsslice

Ein späterer `release-implementation-agent` muss vor Public-Alpha-Gate mindestens diese Testgruppen implementieren oder bewusst mit Blocker begründen:

1. Contract-Test für die Public-Lobby-Listen-Allowlist.
2. Combined Leak Scan über REST, WebSocket, Reconnect, DOM, Browser-Storage, Logs, Metrics und Audit.
3. Negative Redaction-Fixtures für Tokens, Token-Hashes, Deckdaten, PII, `privatePayload`, `cardInstances`, FullState, `AIInput` und `DecisionDebug`.
4. Rate-Limit-Tests für Listenabruf, Auto-/Manual-Refresh, Filterspam und Joinversuche.
5. Enumeration- und Stale-Entry-Tests mit neutralen `404`/`409`/`429`-Fehlern.
6. Origin-/CSRF-/Auth-Grenztests für mutierende Join-Pfade.
7. Audit-Redaction-Tests gegen die V2.7-Observability-Baseline.
8. Regressionstest, dass V2.3a-LAN-Komfort nicht als Public-Freigabe behandelt wird.

## Handoff

Für die spätere Umsetzung gilt:

- V2.3a darf nur Listenform, UI-Ort, Join-Reuse, serverseitige Revalidierung, Stale-Handling und Redaction-Testmuster liefern.
- Public-Lobby-Metadaten sind D0-Daten und bleiben strikt allowlist-basiert.
- Rate Limits müssen mindestens nach Route-Familie, Actor-Kategorie und technischer Bucket-Klasse getrennt testbar sein.
- Fehler müssen neutral sein: unbekannt, privat, moderiert, abgelaufen und nicht joinbar dürfen keine öffentlich unterscheidbaren Details preisgeben.
- Audit- und Ops-Signale müssen abuse-tauglich, aber redigiert sein; sie dürfen selbst keine neue Hidden-Info-, PII-, Token- oder Deckdatenquelle werden.
- Public Chat, Ranked, Matchmaking, Spectator, Public Replay, Moderationskonsole, KI-Debugflächen und neue Karten-/Mechanikfreigaben bleiben außerhalb dieses Handoffs.

## Requirements-Coverage

| Akzeptanzbereich | Abdeckung |
| --- | --- |
| Erlaubte und verbotene Felder | Abschnitte "Erlaubte Public-Lobby-Metadaten", "Verbotene Felder und Muster", V23-PL-RD001 bis V23-PL-RD012. |
| Rate-Limit-/Spam-Fälle mit Status und Audit | V23-PL-RL001 bis V23-PL-RL015 inklusive Status- und Audit-Erwartung. |
| LAN-Komfort vs. Public-Abuse-Risiko | Rate-Limit-Matrix trennt private V2.3a-Erwartung von Public-Erwartung. |
| Handoff an Umsetzungsslice | Abschnitte "Mindest-Testset für einen späteren Umsetzungsslice" und "Handoff". |
