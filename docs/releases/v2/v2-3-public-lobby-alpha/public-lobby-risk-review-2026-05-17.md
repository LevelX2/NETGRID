# V2.3 Public Lobby Risk Review

Stand: 2026-05-17
Status: Planungsreview, keine Implementierungsfreigabe
Zielrelease: V2.3 Public Lobby Alpha

## Entscheidung

V2.3 Public Lobby Alpha bleibt blockiert. V2.3a darf nur als technische Basis wiederverwendet werden: Listenform, minimale Metadaten, Join-Flow-Reuse, serverseitige Revalidierung, Stale-Join-Handling und Redaction-Testmuster. Diese Bausteine ersetzen kein Public-Platform-Gate.

Eine Public Alpha darf erst starten, wenn Identität, Datenschutz, Moderation, Redaction, Rate Limits, Operability, Rollback und UI-/Filtervertrag als eigene Gates bestanden sind. Dieses Review gibt keine Public Lobby, kein Matchmaking, keine öffentliche Registrierung, keine Moderationskonsole, keinen globalen Chat, keine Spectator-/Replay-Freigabe, keine KI-Erweiterung, keine Kartenfreigabe und keine Asset-Freigabe frei.

## Quellen

- `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-gap-review-2026-05-17.md`
- `docs/releases/v2/platform-gates/platform-gate-inventory-2026-05-17.md`
- `docs/releases/v2/v2-0-auth-privacy-cloud-decks/account-session-auth-contract.md`
- `docs/releases/v2/v2-0-auth-privacy-cloud-decks/privacy-export-delete-contract.md`
- `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md`
- `docs/releases/v2/v2-6-moderation/rbac-redaction-test-matrix.md`
- `docs/releases/v2/v2-7-observability/observability-redaction-baseline.md`
- `docs/releases/v2/v2-8-public-replay/public-replay-policy-projection.md`

## Schutzgüter

| Schutzgut | Public-Lobby-Risiko | Gate-Erwartung |
| --- | --- | --- |
| Account- und Sessiondaten | Public-Probes gegen Accounts, Cookies, Invite-/Recovery-Flows oder Sessionzustände | Account-Session-Schicht mit Same-Site-/Origin-/CSRF-/Rate-Limit-Vertrag; keine Account-IDs in Gegner- oder Lobby-Payloads |
| Match- und Join-Capabilities | Crawling oder Erraten offener Matches, Stale-Join-Leaks, Tokenexposition | Join bleibt capability-basiert und serverseitig revalidiert; öffentliche Fehler sind neutral |
| Deck-, Format- und Karteninformationen | Decklisten, Deckhashes, private Snapshots oder Cardpool-Details werden aus Lobby-Metadaten ableitbar | nur abstrakte Format-/Cardpool-Versionen; keine Deckliste, kein stabiler Deckhash, keine privaten Snapshot-IDs |
| Hidden-Info und Engine-State | Public-Lobby-, Reconnect-, Replay- oder Fehlerpfade werden zu Hidden-Info-Kanälen | keine FullState-, `privatePayload`-, `cardInstances`-, Hidden-Card-, Replay-Private-View- oder Undo-Preview-Daten |
| User-generated Content | Lobbychat, Reporttexte oder Namen werden ohne Moderation und Retention öffentlich missbrauchbar | Report-/Block-/Moderationsvertrag, UGC-Redaction, Retention und RBAC vor Public-Start |
| Betriebssignale | Logs, Metrics, Health oder Rate-Limit-Events enthalten PII, Tokens, Deckdaten oder lokale Pfade | Observability-Redaction-Baseline und public-sichere technische Labels |
| Public Replay/Spectator | Lobby-Öffnung wird implizit als Replay-/Spectator-Freigabe missverstanden | V2.8/V2.4 bleiben getrennte Policy-Gates |
| Asset-/Rechtsgrenze | Public-Fläche wird mit offiziellen Assets, Frames, Card Backs oder externen Kartendatenbank-Abhängigkeiten verknüpft | eigenes Asset-/Rechtsgate vor öffentlicher Darstellung solcher Assets |

## Bedrohungsmodell

| Akteur | Fähigkeit | Relevante Bedrohung | Gegenmaßnahme vor Alpha |
| --- | --- | --- | --- |
| anonymer Internetnutzer | wiederholte Listenabrufe und Joinversuche | Crawling, Match-Enumeration, Stale-State- und Fehler-Orakel | Account-/Guest-Identität, Rate Limits, neutrale Fehler, minimierte Metadaten |
| angemeldeter Nutzer | echte Lobby-Nutzung mit Missbrauchspotenzial | Spam, Harassment, Reportflut, Blocklisten-Auslesen | Report-/Block-Vertrag, Moderation-RBAC, UGC-Retention, Abuse-Limits |
| automatisierter Bot | hohe Anfragefrequenz und wechselnde Clients | Listen-Scraping, Join-Spam, Health-/Metrics-Abuse | IP-/Account-/Session-bezogene Rate-Limits, Crawl-Schutz, redigierte Audit-Signale |
| neugieriger Gegner | Lobby- und Join-Payloads mit Spielwissen korrelieren | Deck-, Side-, Kartenpool-, Account- oder Hidden-Info-Leak | D0-Metadaten, keine Deckdetails, keine Account-IDs, Revalidierung beim Join |
| Betreiber/Support/Moderator | Zugriff auf Logs, Reports oder Evidence | versehentlicher FullState-, Hidden-Info- oder KI-Debug-Zugriff | RBAC-Matrix, Break-Glass-Default-Deny, auditierte Evidence-Views |
| fehlerhafte Implementierung | nutzt private LAN-Annahmen im Public-Pfad weiter | fehlende Redaction, zu hilfreiche Fehler, offener Rollback | Public-spezifische Testmatrix, Kill-Switch, Rollback-Vertrag |

## Eintrittspunkte und Grenzen

| Eintrittspunkt | Erlaubtes Zielbild | Harte Grenze |
| --- | --- | --- |
| Public-Lobby-Liste | nur redigierte, öffentliche D0-Metadaten mit Filter-/Sortierparametern | keine Tokens, Account-IDs, Decklisten, Deckhashes, private Namen ohne Consent, Hidden-Info oder Debugdaten |
| Public-Lobby-Join | Wiederverwendung des bestehenden Join-Flows mit erneuter Validierung | keine Abkürzung um Match-Capabilities, keine Existenzdetails in Fehlern |
| Filter/Refresh | serverseitig begrenzte Filter nach freigegebenen Metadaten | keine freien Suchfelder über PII, keine Decknamen-/Decklistenfilter |
| Lobby-Chat oder UGC | für Public Alpha nicht automatisch freigegeben | kein globaler Chat, kein öffentlicher UGC ohne V2.2-/V2.6-Gates |
| Health/Observability | redigierte technische Betriebsdaten | keine Rohlogs, keine Token, keine lokalen Pfade, keine privaten Deck- oder Hidden-Daten |
| Replay/Spectator-Verweise | keine implizite Veröffentlichung | Public Replay und Spectator bleiben separate Policy- und Redaction-Gates |

## Startverbote

V2.3 Public Lobby Alpha darf nicht starten, solange einer der folgenden Punkte zutrifft:

1. Kein tragfähiges Account- oder ausdrücklich geregeltes Public-Guest-Identitätsmodell ist aktiv.
2. Account-Session-Cookies, Origin-Prüfung, CSRF und mutierende Auth-/Join-Grenzen sind nicht gatefähig.
3. Datenschutz-Export, Löschung, Retention und Account-/Match-Metadaten-Anonymisierung sind nicht als umsetzbare Tests oder Verträge vorhanden.
4. Report-, Block-, Evidence-, RBAC- und Break-Glass-Grenzen sind nicht testbar.
5. Public-Lobby-Listen und Joinversuche haben keine Redaction-/Rate-Limit-/Abuse-Testmatrix.
6. Listen-, Filter-, Join-, Stale- und Fehlerpayloads wurden nicht gegen Token, Token-Hashes, Deckdaten, PII, Hidden-Info, FullState, `AIInput` und `DecisionDebug` negativ geprüft.
7. Es gibt keinen Kill-Switch, keinen Rollbackpfad, keine Safe-Mode-Grenze und keine redigierten Health-/Alerting-Signale.
8. Public-Lobby-UI zeigt Filter, Sichtbarkeit oder Verfügbarkeit ohne serverseitigen Vertrag für erlaubte Metadaten.
9. Lobbychat, Report-UI, Spectator oder Public Replay würden durch die Lobby implizit aktiviert.
10. Offizielle Artworks, Card Frames, Card Backs, Logos oder externe Kartendatenbank-Abhängigkeiten würden ohne Asset-/Rechtsgate öffentlich eingebunden.
11. KI-Inputs, KI-Debugdaten, Accountdaten oder Chatdaten würden in Strategie-, Replay-, Observability- oder Moderationspfade eingespeist.
12. Der Public-Pfad verlässt sich auf private LAN-Annahmen wie kleine Nutzerzahl, vertrauenswürdiges Netz, manuelle Beobachtung oder unlimitierte Refreshes.

## Mindestgates

| Gate | Mindestnachweis vor Public Alpha | Aktueller Stand |
| --- | --- | --- |
| Auth/Identität | Account-Session-Foundation plus Public-Guest-Entscheidung oder geschlossene Accountpflicht; Join bleibt getrennte Match-Capability | Account-Vertrag und Foundation-Basis vorhanden, Public-Guest nicht entschieden |
| Datenschutz | Export-/Löschtests, Anonymisierung von Account-Metadaten und klare Retention-Ausnahmen | Vertrag vorhanden, Umsetzungsharness fehlt |
| Moderation | RBAC-/Redaction-Tests, Report-/Block-Vertrag, Evidence-Referenzen, Runbook/Exportgrenzen | Vertrag und RBAC-Testbasis vorhanden, Runbook/Evidence-Export offen |
| Redaction/Rate Limit | Matrix für Liste, Filter, Refresh, Join, Stale Entries, Errors und Abuse-Audit | Folgepaket bestätigt |
| Observability | technische Labels und Redaction-Scan für Logs, Health, Metrics, Alerts und Rate-Limit-Events | Baseline vorhanden, Public-Operability-Vertrag offen |
| Rollback/Operability | Kill-Switch, UI-Deaktivierung, API-Abschaltung, Safe Mode, Incident-Grenzen | Folgepaket bestätigt |
| UI-/Filtervertrag | erlaubte Filter, sichtbare Status, leere/error Zustände, Private/Public-Sichtbarkeit und redigierte Metadaten | neues Folgepaket angelegt |
| Public Replay/Spectator | ausdrückliche Nicht-Kopplung oder eigene Policy-Gates | V2.8-Policy vorhanden, kein Lobby-Startrecht |
| Rechts-/Assetgate | keine öffentlichen offiziellen Assets ohne Freigabe | weiterhin blockiert |

## V2.3a-Reuse-Einordnung

V2.3a ist für V2.3 nützlich, aber nur als technische Grundlage:

- Listenform und UI-Ort unter `Beitreten` können als Ausgangspunkt dienen.
- Minimale Matchmetadaten bleiben das richtige Designprinzip.
- Server-Revalidierung und Stale-Join-Handling bleiben Pflicht.
- Redaction-Testmuster aus dem LAN-Slice sind wiederverwendbar.
- Der bestehende Join-Stack soll wiederverwendet werden, damit keine zweite Join-Autorität entsteht.

V2.3a ist keine Public-Freigabe:

- LAN-Discovery ist keine öffentliche Sichtbarkeit.
- Private-LAN-Vertrauen ist kein Abuse-Modell.
- Lokale Lobby-Metadaten sind noch kein Public-D0-Vertrag.
- Bestehende private Fehler- und Refreshpfade sind ohne Public-Testmatrix nicht ausreichend.

## Konkrete Folgepakete

| Paket | Status | Zweck |
| --- | --- | --- |
| `act-2026-05-17-v23-public-lobby-redaction-rate-limit-matrix` | bestätigt, liegt in `docs/activities/inbox/` | Testmatrix für erlaubte/verbotene Public-Lobby-Felder, Rate Limits, Abuse-Events und redigierte Audit-Signale |
| `act-2026-05-17-v23-public-alpha-rollback-operability-contract` | abgeschlossen; Vertrag liegt unter `docs/releases/v2/v2-3-public-lobby-alpha/public-alpha-rollback-operability-contract-2026-05-17.md` | Kill-Switch, Rollback, Health, Alerting, Safe Mode und Incident-Grenzen |
| `act-2026-05-17-v23-public-lobby-ui-filter-contract` | neu angelegt in `docs/activities/inbox/` | UI-/Filtervertrag für erlaubte Filter, Statusanzeigen, leere/error Zustände, Sichtbarkeitsklassen und Metadaten-Redaction |

## Handoff

Ein späterer `release-implementation-agent` darf erst nach den genannten Konzept- und Testpaketen einen kleinen Public-Lobby-Slice vorbereiten. Der erste denkbare technische Slice muss vollständig hinter Feature-Flag/Kill-Switch liegen, nur public-sichere Metadaten ausliefern, Join erneut über bestehende Legal-/Servervalidierung führen und alle Fehler neutralisieren.

Nicht übernommen werden dürfen: Public Chat, Matchmaking, Ranked, Spectator, Public Replay, Cloud-Deck-Erweiterungen, KI-Debugflächen, neue Karten-/Mechanikfreigaben, neue offizielle Assets oder eine zweite Regel-/Join-Autorität.
