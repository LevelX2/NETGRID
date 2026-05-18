# V2.3 Public Lobby UI- und Filtervertrag

Stand: 2026-05-17
Status: Planungsvertrag, keine Implementierungsfreigabe
Zielrelease: V2.3 Public Lobby Alpha

## Zweck und Grenze

Dieser Vertrag definiert, welche Public-Lobby-Filter, Listenmetadaten, UI-Zustände und Redaction-Grenzen ein späterer V2.3-Alpha-Slice verwenden darf. Er ergänzt die Public-Lobby-Risiko- und Redaction-Artefakte und schneidet den Handoff für spätere UI- und API-Arbeiten.

Der Vertrag gibt keine Public-Lobby-API, keine UI-Implementierung, kein Matchmaking, keinen Public Chat, keine Spectator- oder Public-Replay-Fläche, keine Account-Implementierung, keine Moderationskonsole, keine KI-Erweiterung und keine Karten- oder Asset-Freigabe frei.

## Quellen

- `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-risk-review-2026-05-17.md`
- `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-gap-review-2026-05-17.md`
- `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-redaction-rate-limit-test-matrix.md`
- `docs/releases/v2/platform-gates/platform-gate-inventory-2026-05-17.md`
- `docs/releases/v2/v2-0-auth-privacy-cloud-decks/privacy-export-delete-contract.md`
- `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md`
- `docs/releases/v2/v2-7-observability/observability-redaction-baseline.md`
- `docs/releases/v2/v2-8-public-replay/public-replay-policy-projection.md`
- `docs/releases/v2/v2-3-public-lobby-alpha/lan-open-lobby-mini-implementation-review.md`

## Ausgangslage

V2.3a liefert eine private LAN-Vorstufe mit minimaler Open-Lobby-Liste, Join-Flow-Reuse, serverseitiger Revalidierung und Payload-Redaction. Diese Basis darf für V2.3 wiederverwendet werden, ersetzt aber kein Public-Gate.

V2.3 Public Lobby bleibt blockiert, bis Auth/Identität, Datenschutz, Moderation, Redaction, Rate Limits, Operability, Rollback und dieser UI-/Filtervertrag gatefähig sind. Die Public-Lobby-Liste darf ausschließlich D0-Public-Lobby-Metadaten zeigen.

## Erlaubte Filter

Alle Filter sind serverseitig allowlist-basiert. Nicht bekannte oder nicht freigegebene Filter werden vor Query-Ausführung neutral abgelehnt. Die UI darf keine freien Suchfelder anbieten, die PII, Accountdaten, Decknamen, Decklisten, Tokens oder private Matchdaten treffen könnten.

| Filter | Erlaubte Werte | UI-Verhalten | Harte Grenze |
| --- | --- | --- | --- |
| Format | serverseitig freigegebene `formatProfileId`-Werte und `all` | Select/Segment für freigegebene Formate, Anzeige mit neutralem Formatnamen | keine Decknamen, Decklisten, Deckhashes, private Snapshot-IDs oder Identity-/Kartenfilter |
| Modus | `human_vs_human`; weitere Modi nur nach eigenem Gate, z. B. `human_vs_ai` mit expliziter Public-KI-Freigabe | Modusfilter zeigt nur aktiv freigegebene Modi | kein Ranked, kein Turnier, kein automatisches Matchmaking, keine KI-Debug- oder Strategieangaben |
| Sichtbarkeit | `public_alpha` | Public-Lobby-Ansicht zeigt nur öffentlich freigegebene Alpha-Einträge | `private_invite`, `friend_only`, `lan_only`, moderiert oder blockiert erscheinen nicht als Public-Eintrag und nicht als ausgegraute Detailzeile |
| Region | serverseitige Region-Buckets wie `auto`, `eu`, `na`, `local_unknown` | Region als grober Hinweis oder Filter, wenn verlässlich | keine IP, kein Hostname, keine Netzwerktopologie, kein lokaler Pfad, keine exakte Standortableitung |
| Latenz | Buckets wie `low`, `medium`, `high`, `unknown` | Latenzbadge oder Sortierhinweis ohne exakte Messreihe | keine Roh-IP, keine feingranularen Zeitreihen, kein Client-Fingerprinting |
| Verfügbarkeit | `open`, `starting_soon`, `full`, `unavailable` | Filter kann offene Einträge bevorzugen; nicht joinbare Einträge dürfen neutral verschwinden oder als nicht verfügbar markiert sein | keine internen Statusdetails wie Moderationsflag, Blockentscheidung, aktive Deckprüfung oder exakter Lifecycle-Grund |
| Platz/Seite | `any_side`, `runner_needed`, `corp_needed`, `seat_available` | nur abstrakte Sitz- oder Seitenverfügbarkeit | keine Deckwahl, Identity, Kartenpooldetails, PlayerView, private Startlobby-Ready-Daten oder Gegnerstrategie |

Erlaubte Sortierungen sind nur `created_recent`, `availability`, `latency_bucket` und optional `region_bucket`. Sortierung nach Anzeigename, Accountalter, Spielstärke, Reportstatus, Deckmerkmalen oder Matchhistorie ist nicht freigegeben.

## Erlaubte Listenmetadaten

Ein Public-Lobby-Listeneintrag darf nur Felder aus dieser Tabelle enthalten. Ein späterer API-Slice muss daraus ein konkretes Schema ableiten und per Contract-Test gegen zusätzliche Felder absichern.

| Feldklasse | Beispiel | Zweck | Grenze |
| --- | --- | --- | --- |
| Public-Lobby-Referenz | `publicLobbyId` oder kurze Anzeige-ID | Auswahl eines Listeneintrags | opaque, kurzlebig, nicht als Join-Capability nutzbar, nicht aus Account-, Token-, Storage- oder interner Match-ID ableitbar |
| Status | `open`, `starting_soon`, `full`, `unavailable` | UI-Badge und Join-Button-Zustand | keine internen Lifecycle-, Moderations-, Block- oder Fehlergründe |
| Modus | `human_vs_human` | Erwartung an Matchart | kein Ranked-/Turnier-/Matchmaking-Signal |
| Format | freigegebener Formatname oder `formatProfileId` | Kompatibilität vor Join | keine Deckliste, kein Deckname, kein Deckhash, keine private Snapshot-ID |
| Cardpool-Version | abstrakte Version oder Familie | Regel-/Kartenpool-Kompatibilität | keine CardInstance-IDs, keine Kartenliste, keine Hidden-Zonen |
| Sichtbarkeitsklasse | `public_alpha` | klare Alpha-Einordnung | keine private, friend-only oder LAN-only Sichtbarkeit in der Public-Liste |
| Host-Anzeige | consent-basierter Anzeigename oder neutrales Label | Orientierung für Menschen | keine Account-ID, E-Mail, Kontaktkanal, Invite-/Recovery-Info oder stabile Tracking-ID |
| Sitzstatus | `1/2`, `Runner frei`, `Korp frei` | Erkennen, ob Join möglich ist | keine Deckwahl, Identity, Hand-/Boarddaten oder private Ready-Details |
| Alter/Ablauf | Zeitbucket wie `gerade eben`, `vor wenigen Minuten`, `läuft bald ab` | Aktualität und Stale-Erwartung | keine feingranularen Audit-Zeitreihen oder Trackingdaten |
| Region/Latenz | `eu`, `unknown`, `low` | grobe Verbindungserwartung | keine IP, kein Hostname, keine Netzwerktopologie |
| Join-Erwartung | `account_required`, `guest_allowed`, `join_may_require_revalidation` | UI-Button und Hinweis | keine Accountdetails, keine Sessionzustände, keine Capability-Information |

Metadaten dürfen nicht in Browser-Storage persistiert werden, außer als flüchtiger UI-Cache ohne Tokens, Accountdaten, Deckdaten, Hidden-Info und private IDs. Cache-Einträge müssen beim Alpha-Kill-Switch, Logout, Profilwechsel oder Redaction-Policy-Wechsel verworfen werden.

## Verbotene Felder

Diese Felder und Feldfamilien sind in REST, WebSocket, Reconnect, DOM, Browser-Storage, Logs, Metriken, Audit, UI-Fehlern und Supportdiagnosen für die Public Lobby verboten:

- Account-IDs, E-Mail-Adressen, Kontaktkanäle, Roh-IP, Cookies, `ng_account_session`, Account-Session-Status anderer Nutzer.
- `sessionToken`, `reconnectToken`, `joinToken`, Account-/Invite-/Recovery-Tokens und alle Token-Hashes wie `sessionTokenHash`, `tokenHash`, `sha256:*`.
- Decknamen, Decklisten, `cards`, `deckHash`, `cloudDeckId`, private Deck-Snapshot-IDs, Identity- oder Kartenlistenfilter.
- `GameState`, FullState-Fragmente, `privatePayload`, `cardInstances`, verdeckte Karten, private PlayerViews, LegalActions, Pending Choices und Undo-Previews.
- Replay-IDs, Public-Replay-URLs, Spectator-Links, `local_analysis`, private Replay-Perspektiven und StateSnapshots.
- `AIInput`, `DecisionDebug`, Belief-Fakten, Strategiehints, KI-Scoring oder KI-Debuglabels.
- Reportstatus anderer Nutzer, Sanktionen, Blocklisten, Break-Glass-Status, interne Moderationsnotizen.
- Stacktraces, lokale Pfade, Datenbankpfade, Storage-Key-Material, vollständige URLs mit Query-Geheimnissen.

## Verbotene Korrelationen

Auch erlaubte Einzelfelder dürfen nicht so kombiniert werden, dass sie private Daten ableitbar machen.

| Korrelation | Risiko | Vertrag |
| --- | --- | --- |
| stabiler Hostname plus exakte Zeit plus Region/Latenz | Nutzertracking und Re-Identifikation | Host-Anzeige muss consent-basiert oder neutral sein; Zeit und Latenz bleiben Buckets; Public-Lobby-IDs rotieren |
| Format plus Cardpool plus Side plus Identity-/Deckhinweis | Deck- oder Strategieableitung | keine Identity-, Deck-, Karten- oder Snapshot-Hinweise in Liste, Filter, Fehlern oder Tooltips |
| fehlender Eintrag plus Join-Fehlerdetails | Enumeration privater, moderierter, blockierter oder abgelaufener Matches | unbekannt, privat, moderiert, blockiert, abgelaufen und nicht existent bleiben öffentlich ununterscheidbar |
| Rate-Limit-Bucket plus Actor-Kategorie plus Region | PII-Ersatz über Ops-Signale | nur nicht reversible technische Buckets; keine Roh-IP, Account-ID oder Sessionreferenz in UI oder Public-Audit |
| Public-Lobby-ID plus Replay-/Spectator-Link | implizite Public-Replay- oder Spectator-Freigabe | Lobby listet keine Replay-/Spectator-Bezüge; V2.8/V2.4 bleiben eigene Gates |
| blockierte oder reportbezogene Sichtbarkeit plus UI-Status | Auslesen fremder Blocklisten oder Sanktionen | UI zeigt nur neutral nicht verfügbar oder aktualisiert die Liste ohne Detailgrund |
| KI-Modus plus KI-Profil plus Fehlerdetails | KI-Debug- oder Strategiekanal | nur abstrakter Modus nach Gate; keine AIInput-, DecisionDebug- oder Scoringdaten |

## Sichere UI-Zustände

Die UI-Texte sind Produktvorschläge für spätere Umsetzung. Sie sind absichtlich neutral und dürfen keine Account-, Match-, Deck-, Token-, Hidden-Info-, Moderations- oder Operability-Details ausgeben.

| Zustand | Auslöser | Sicheres UI-Verhalten | Sicherer Text |
| --- | --- | --- | --- |
| leer | Liste enthält keine sichtbaren Einträge | leere Liste mit Refresh-Möglichkeit | `Keine öffentlichen Spiele verfügbar.` |
| gefiltert leer | erlaubte Filter liefern keine sichtbaren Treffer | Filter bleiben sichtbar, Reset möglich | `Keine Spiele für diese Filter gefunden.` |
| laden | Liste oder Refresh läuft | vorhandene Einträge nicht als aktuell garantieren | `Spiele werden geladen ...` |
| rate-limited | Listen-, Refresh-, Filter- oder Join-Bucket greift | Refresh/Join temporär deaktivieren, `Retry-After` nur grob anzeigen | `Bitte warte kurz, bevor du die Liste erneut aktualisierst.` |
| stale | Eintrag ist beim Join nicht mehr gültig | Eintrag entfernen oder Liste neu laden; kein Grunddetail | `Dieses Spiel ist nicht mehr verfügbar. Die Liste wurde aktualisiert.` |
| nicht verfügbar | Feature, Server oder Region nicht erreichbar | Public-Lobby-Fläche deaktivieren, Join-Link-Fallback nur falls privat erlaubt | `Öffentliche Spiele sind gerade nicht verfügbar.` |
| Join abgelehnt | Join-Revalidierung scheitert | neutraler Fehler, Liste aktualisieren | `Beitritt nicht möglich. Bitte wähle ein anderes Spiel oder versuche es später erneut.` |
| Alpha deaktiviert | Kill-Switch oder Rollback aktiv | Public-Lobby-Bereich ausblenden oder deaktiviert zeigen | `Öffentliche Lobby ist in dieser Alpha derzeit deaktiviert.` |
| Auth erforderlich | Accountpflicht oder Public-Guest deaktiviert | Login/Identitätsentscheidung anzeigen ohne Zielaccountdetails | `Zum Beitreten ist eine bestätigte Sitzung erforderlich.` |
| Filter abgelehnt | nicht erlaubter Filter oder manipulierter Query | Filter auf sicheren Zustand zurücksetzen | `Dieser Filter ist nicht verfügbar.` |
| allgemeiner Fehler | unbekannter Server-/Netzfehler | keine Stacktrace- oder Diagnosedaten | `Liste konnte nicht geladen werden. Bitte versuche es später erneut.` |

UI darf keine Rohwerte aus Queryparametern, abgelehnten Filtern oder Serverfehlern echoen. Fehlercodes dürfen nur als stabile, neutrale Produktcodes für Support kopierbar sein, nicht als interne Exception-, Token-, Match- oder Moderationsreferenz.

## API-Handoff

Ein späterer API-Slice muss vor Implementierung mindestens diese Verträge konkretisieren:

1. Ein versioniertes Public-Lobby-DTO mit Allowlist aus diesem Dokument.
2. Serverseitige Filtervalidierung mit Reject vor Query-Ausführung für unbekannte oder verbotene Filter.
3. Kurzlebige, opaque Public-Lobby-Referenzen, die keine Join-Capabilities ersetzen.
4. Join-Reuse über den bestehenden serverautoritativen Join-Pfad mit erneuter Validierung von Identität, Sichtbarkeit, Status, Format-/Deck-Gate, Rate-Limit und Stale-State.
5. Neutrale Fehlerfamilien für unbekannt, privat, moderiert, blockiert, abgelaufen, voll, nicht joinbar und nicht existent.
6. Redigierte Audit-/Ops-Signale nach V2.7, ohne Roh-IP, Account-ID, Tokens, Deckdaten, Hidden-Info oder KI-Debugdaten.
7. Contract-Tests gegen die V2.3 Redaction- und Rate-Limit-Testmatrix.

## UI-Handoff

Ein späterer UI-Slice darf nur vorbereiten:

- Filtersteuerung für die erlaubten Filter und Sortierungen.
- Listenrendering ausschließlich aus erlaubten D0-Metadaten.
- sichere Zustände aus diesem Vertrag.
- Refresh-/Debounce-Verhalten ohne Crawling-Anreiz.
- Join-Button, der den bestehenden Join-Flow nutzt und Stale-/Denied-Zustände neutral behandelt.
- Feature-Flag-/Kill-Switch-Anzeige ohne interne Operability-Details.

Nicht übernommen werden dürfen: freie Suche, Nutzerprofile, öffentliche Chatflächen, Report-/Moderationskonsole, Spectator-/Replay-Links, Matchmaking, Ranked-/Turnierfilter, Deck-/Identity-/Kartenfilter, KI-Debuganzeigen, Accountdetails anderer Nutzer oder private LAN-/Friend-only-Einträge in der Public-Liste.

## Akzeptanzkriterien für spätere Umsetzung

- Public-Lobby-DTO enthält nur erlaubte Feldklassen und wird per Allowlist-Test abgesichert.
- Jeder Filter hat eine serverseitige Allowlist, Rate-Limit-Abdeckung und Negativtests gegen PII-, Deck-, Token- und Accountfelder.
- DOM, Browser-Storage, REST, WebSocket, Reconnect, Logs, Metriken und Audit bestehen Leak-Scans gegen verbotene Felder und Korrelationen.
- UI-Zustände verwenden neutrale Texte und verraten keine fremden Account-, Match-, Deck-, Moderations-, Hidden-Info- oder Operability-Details.
- Join aus der Liste bleibt Reuse des bestehenden Join-Pfads und wird beim Join erneut revalidiert.
- Alpha-Deaktivierung/Kill-Switch entfernt Public-Lobby-Funktionalität ohne alte Cache- oder Stale-Einträge weiter anzuzeigen.

## Entscheidung

V2.3 Public Lobby darf einen UI-/Filtervertrag verwenden, aber nur als D0-Metadatenfläche mit serverseitig erlaubten Filtern, neutralen UI-Zuständen und strikter Redaction. Die Lobby-Liste ist kein Suchindex über Personen, Decks, Matches, Replays, Moderation oder KI-Daten. V2.3 bleibt bis zu den benannten Gates blockiert und erhält durch dieses Dokument keine Implementierungsfreigabe.
