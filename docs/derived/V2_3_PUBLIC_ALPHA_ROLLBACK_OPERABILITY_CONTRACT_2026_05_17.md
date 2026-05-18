# V2.3 Public Alpha Rollback- und Operability-Vertrag

Stand: 2026-05-17
Status: Planungsvertrag, keine Implementierungsfreigabe
Zielrelease: V2.3 Public Lobby Alpha

## Entscheidung

V2.3 Public Lobby Alpha bleibt blockiert, bis Abschaltung, Rollback, redigierte Health-/Alerting-Signale, Safe Mode und Incident-Grenzen implementiert, getestet und in einem Runbook nachweisbar sind.

Dieser Vertrag gibt keine Public Lobby, kein Matchmaking, keine öffentliche Registrierung, keine Moderationskonsole, keinen globalen Chat, keine Spectator-/Replay-Freigabe, keine KI-Erweiterung, keine Kartenfreigabe, keine Asset-Freigabe und keine neue Infrastrukturentscheidung frei.

## Quellen

- `docs/derived/V2_3_PUBLIC_LOBBY_GAP_REVIEW_2026_05_17.md`
- `docs/derived/V2_3_PUBLIC_LOBBY_RISK_REVIEW_2026_05_17.md`
- `docs/derived/V2_X_PLATFORM_GATE_INVENTORY_2026_05_17.md`
- `docs/derived/V2_7_OBSERVABILITY_REDACTION_BASELINE.md`
- `docs/releases/v1/v1-0-9-private-internet-hardening/private-deployment-ops-spec.md`

## Zielbild

Die Public Alpha darf nur als jederzeit abschaltbarer, beobachtbarer und redaktionssicherer Beta-Betrieb starten. Operability bedeutet hier nicht allgemeines Monitoring, sondern ein enges Sicherheits- und Rückbauversprechen:

- Betreiber können Public Discovery zentral deaktivieren.
- API-, UI- und Join-Einstiege lassen sich getrennt schließen.
- Public-Alpha-Signale enthalten keine PII, keine Tokens, keine Decklisten, keine Hidden Info und keine KI-Debugdaten.
- Fehler- und Incident-Kommunikation gibt keine Auskunft über Match-Existenz, Tokenstatus, Accountdetails, Deckdaten oder verdeckte Karten.
- Safe Mode lässt private Kernfunktionen nur weiterlaufen, wenn sie nicht vom Incident betroffen sind.

## Abschaltpunkte

| Abschaltpunkt | Muss abschalten | Darf weiterlaufen | Nachweis vor Alpha |
| --- | --- | --- | --- |
| Globaler Public-Alpha-Schalter | Alle Public-Lobby-Flächen, Public-Listen-API, Public-Filter, Public-Join-Einstiege | lokale Entwicklung, private Direct-Join-Flows, bestehende private Matches | Konfigurations-/Feature-Flag-Test plus UI-/API-Smoke |
| Public-Lobby-Listen-API | öffentliche Listenantworten, Refresh, Filter, Sortierung | private LAN-/lokale Liste nur, wenn getrennt konfiguriert und klar markiert | API-Test: abgeschaltet liefert neutrale, tokenfreie Antwort |
| Public-UI-Einstieg | Public-Tab, Public-Filter, Public-Statusanzeigen, Join aus Public-Liste | manuelle private Join-Link-Eingabe | Web-Test: Einstieg ist unsichtbar oder deaktiviert, kein Polling |
| Public-Join-Adapter | Join aus Public-Lobby-Elementen und Public-Stale-Rejoin | bestehender capability-basierter privater Join, wenn Incident das nicht betrifft | Server-Test: Public-Join blockiert neutral, private Capability bleibt getrennt |
| Public-UGC-/Chat-Kopplung | globale Lobbytexte, freie Such-/Namensfelder, Public-Chat-Expansion | bestehender enger privater Lobbychat nur nach V2.2-Gates | Redaction-Test für UGC-Felder und klare Nicht-Kopplung |
| Public-Replay-/Spectator-Verweise | jede automatische Replay-, Spectator- oder Sharing-Aktivierung | private Replay-/Analyseflächen nach bestehendem Gate | Vertragscheck gegen V2.8/V2.4-Policy |

Die Schalter müssen serverseitig wirksam sein. Ein rein clientseitig versteckter Button reicht nicht.

## Rollbackpfade

### Listen-API

Rollback-Ziel: Die Public-Lobby-Liste liefert keine öffentlichen Matchdaten mehr aus.

Pfad:

1. Globalen Public-Alpha-Schalter deaktivieren.
2. `GET /api/matches/open` oder den späteren Public-Listen-Endpunkt auf private/LAN-Semantik oder neutrale Abschaltantwort zurücksetzen.
3. Öffentliche Filter- und Refresh-Parameter ignorieren oder mit neutralem Fehlercode ablehnen.
4. Rate-Limit- und Abuse-Zähler weiter aggregiert führen, aber ohne Match-, Account-, Token- oder IP-Rohwerte in Logs.
5. Verify-Smoke: keine MatchIds, Join-URLs, Tokens, Deckdaten, Account-IDs oder Hidden-Info-Felder in Response, Logs, Health oder Fehlern.

### UI-Einstieg

Rollback-Ziel: Nutzer können keine Public-Lobby-Fläche mehr entdecken oder pollend offenhalten.

Pfad:

1. Public-Tab und Public-Filter aus `Beitreten` entfernen oder deaktiviert anzeigen.
2. Automatisches Polling für Public-Listen stoppen.
3. Leere/abgeschaltete Zustände mit neutralem Text anzeigen, ohne Incidentdetails, Matchzahlen, Accountdetails oder Betreiberpfade.
4. Private Join-Link-Eingabe getrennt lassen, wenn sie nicht Teil des Incidents ist.
5. Verify-Smoke: kein Public-API-Request beim Laden der privaten Join-Ansicht.

### Join-Pfade

Rollback-Ziel: Public-Lobby-Join wird geschlossen, ohne private Match-Capabilities oder Engine-Regeln zu verändern.

Pfad:

1. Public-Join aus Listenmetadaten blockieren.
2. Bestehenden serverseitigen Join-Flow nicht duplizieren; private Join-Capabilities bleiben die einzige Join-Autorität.
3. Fehler für nicht mehr joinbare oder abgeschaltete Public-Einträge neutralisieren.
4. Stale Public Entries nicht als Existenz-, Token- oder Moderationsorakel auswertbar machen.
5. Verify-Smoke: Public-Join blockiert mit generischem Code; `applyAction`, LegalActions, Replay und StateHash bleiben unberührt.

### Bereits laufende Matches

Rollback-Ziel: Public Discovery schließen, ohne laufende Spiele unnötig zu zerstören.

Pfad:

1. Wenn der Incident nur Discovery/Spam betrifft: laufende Matches fortsetzen, keine neuen Public Joins.
2. Wenn Token-, Account-, Hidden-Info-, Deckdaten- oder Replay-Leak vermutet wird: betroffene Sessions widerrufen oder Matches administrativ abbrechen, ohne FullState in Logs oder Supporttexte zu kopieren.
3. Public-Metadaten für betroffene Matches entfernen oder auf privat setzen.
4. Reconnect nur über bestehende, serverseitig revalidierte Capability-Pfade erlauben.

## Redigierte Health-, Metrics- und Alerting-Signale

Public-Alpha-Operability darf nur technische und redigierte Signale verwenden.

| Signalgruppe | Erlaubt | Verboten |
| --- | --- | --- |
| Health | `ok`, Service, Release, Deployment-Profil, Storage-Status grob, Public-Alpha-Schalterstatus als `enabled`/`disabled`, Schema-Version | MatchIds, Join-URLs, Session-/Reconnect-/Account-Tokens, Token-Hashes, Account-IDs, Decklisten, `GameState`, Hidden Cards |
| Metrics | Request-Zähler, Latenzbuckets, Fehlercodes, Rate-Limit-Kategorie, Public-Lobby-Status, grobe aktive-Lobby-Buckets wie `0`, `1-5`, `6-20`, `20+` | IP-Rohwerte, E-Mail, Displaynamen, Lobbytitel mit UGC, Decknamen, Deckhashes, lokale Pfade, Card-Instanzdaten |
| Alerts | Schwellwertüberschreitung für 5xx-Rate, Listen-Refresh-Spikes, Join-Failure-Spikes, Rate-Limit-Spikes, Redaction-Violation, Health-Down | konkrete Nutzer, Match-IDs, Tokens, Decklisten, private Payload-Auszüge, `AIInput`, `DecisionDebug` |
| Incident-Audit | Zeitpunkt, Eventfamilie, redigierter Fehlercode, Schalteränderung, Rolle des Operators, grobe Ursache | Rohrequest, Cookie, Authorization-Header, FullState, PublicEvent-PrivatePayload, lokale Dateipfade |

Alle neuen Labels müssen mit der V2.7 Observability-Redaction-Baseline vereinbar sein. Neue Betriebslabels sind nur zulässig, wenn sie technisch, stabil redigierbar und nicht als PII-, Deck- oder Hidden-Info-Korrelat nutzbar sind.

## Alert-Gates

Vor Public Alpha müssen mindestens diese Alert-Klassen testbar oder per Runbook simulierbar sein:

| Alert | Auslöser | Pflichtreaktion |
| --- | --- | --- |
| `public_lobby_health_down` | Public-Listen-API oder Join-Adapter wiederholt nicht erreichbar | Public-UI deaktivieren, Status neutral anzeigen, privaten Join nicht automatisch abschalten |
| `public_lobby_error_rate_high` | 5xx- oder neutralisierte Join-Fehler über Schwellwert | Public-Join-Schalter deaktivieren, Logs auf Redaction prüfen |
| `public_lobby_rate_limit_spike` | Listen-/Join-/Refresh-Limits deutlich überschritten | Crawl-/Abuse-Schutz verschärfen, Public-Discovery temporär schließen |
| `observability_redaction_violation` | Redaction-Check erkennt verbotenes Muster | P0/P1-Incident, Public Alpha sofort abschalten, betroffene Logs sichern und bereinigt behandeln |
| `public_lobby_stale_join_spike` | ungewöhnlich viele Stale-Join-Versuche | Public-Listen-Refresh stoppen oder TTL senken, keine Existenzdetails ausgeben |
| `moderation_or_report_backlog_high` | Report-/Abuse-Signal über Review-Kapazität | Public-Alpha-Aufnahme stoppen, keine neuen Public-Lobbies |

Alerttexte dürfen keine Rohdaten enthalten. Der Alert darf auf interne Runbook-Schritte verweisen, aber nicht auf konkrete Nutzer-, Match- oder Deckdaten.

## Safe Mode

Safe Mode ist der minimale Betriebszustand nach Public-Alpha-Problemen.

| Modus | Erlaubt | Blockiert |
| --- | --- | --- |
| `safe_private_only` | lokale Entwicklung, private Direct-Join-Flows, laufende private Matches, Health mit Basisstatus | Public Discovery, Public-Listen-API, Public-Filter, Public-Join aus Liste |
| `safe_readonly_public_status` | neutrale Statusmeldung, grobe Verfügbarkeit, kein Polling | Matchliste, Join, Filter, UGC, Reportdetails, Metrics mit Nutzerbezug |
| `safe_incident_lockdown` | interne redigierte Diagnose, Revocation/Abbruch betroffener Sessions, Restore/Backup nach bestehendem Storage-Vertrag | neue Matches, Public Join, Reconnect für betroffene Sessions, Supporttexte mit privaten Details |

Safe Mode verändert keine Engine-Regeln, keine LegalActions, keine Replay-Historie und keinen StateHash. Wenn ein laufendes Match aus Sicherheitsgründen beendet werden muss, ist das ein Server-/Session-Ereignis außerhalb der Rules Engine und muss redigiert dokumentiert werden.

## Incident-Grenzen

| Klasse | Beispiele | Sofortmaßnahme | Kommunikation |
| --- | --- | --- | --- |
| P0 Hidden-Info/Token/Deck-Leak | Tokens, Token-Hashes, Decklisten, Hidden Cards, FullState, `AIInput` oder `DecisionDebug` in Public-Payload, Logs, Health oder Alert | Public Alpha abschalten, Safe Lockdown, betroffene Logs isolieren, Sessions widerrufen | neutral: Public Alpha pausiert; keine Leakinhalte zitieren |
| P1 Abuse/Availability | Scraping, Join-Spam, hohe 5xx-Rate, Health-Ausfall, Rate-Limit-Bypass | Public-Discovery oder Public-Join abschalten, Limits erhöhen, Runbook ausführen | neutral: Lobby vorübergehend nicht verfügbar |
| P2 UX/Contract Drift | UI zeigt falsche Public-/Private-Sichtbarkeit, Filterstatus unklar, Stale-Fehler zu spezifisch | betroffene UI/Filter abschalten, Patch vorbereiten | neutral: Alpha-Funktion wird aktualisiert |

Support-, Moderator- und Betreiberkommunikation darf niemals private Payloads, Rohlogs, Tokenwerte, Decklisten, lokale Pfade, Hidden-Info-Beispiele oder KI-Debugdaten kopieren. Evidence für Moderation bleibt auf referenzierte und RBAC-geprüfte Artefakte begrenzt.

## Implementierungs- und Testhandoff

Ein späterer `release-implementation-agent` darf erst einen technischen Public-Lobby-Slice vorbereiten, wenn zusätzlich zur Risk-Review folgende Nachweise vorliegen:

1. Public-Lobby-Redaction-/Rate-Limit-Matrix für Liste, Filter, Refresh, Join, Stale Entries, Errors und Abuse-Audit.
2. Serverwirksame Feature-Flags/Kill-Switches für Liste, UI-Einstieg und Public-Join.
3. Health-/Metrics-/Alerting-Redaction-Tests gegen die V2.7-Baseline.
4. UI-Smoke für deaktivierten Public-Alpha-Zustand ohne Public-Polling.
5. API-Smoke für neutrale Abschaltantwort ohne Match-, Token-, Account-, Deck- oder Hidden-Info-Daten.
6. Safe-Mode-Runbook mit Rollbackreihenfolge, Verantwortlichkeit und Wiederanlaufkriterien.
7. Incident-Runbook für P0/P1/P2 mit Redaction- und Kommunikationsregeln.

## Gate-Ergebnis

`ready_for_public_alpha: false`

`ready_for_implementation_slice: false`

V2.3 Public Lobby Alpha bleibt blockiert, bis dieser Vertrag in Code, Tests, Runbook und Final Review nachgewiesen ist. Der erste spätere Umsetzungsslice muss hinter serverseitigen Kill-Switches liegen und darf Public Discovery nicht ohne Redaction-/Rate-Limit-/Safe-Mode-Gate aktivieren.
