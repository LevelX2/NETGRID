# V2.3a zu V2.3 Public Lobby Gap Review

Stand: 2026-05-17
Status: Planungsreview, keine Implementierungsfreigabe
Zielrelease: V2.3 Public Lobby Alpha

## Ausgangslage

V2.3a ist als privater LAN-Open-Lobby-Mini-Slice abgeschlossen. Der Slice liefert eine lokale Liste offener Matches, minimale Metadaten, serverseitige Join-Revalidierung, Payload-Redaction und UI-Reuse im Bereich `Beitreten`.

V2.3 Public Lobby Alpha ist ein anderer Risikotyp. Die Roadmap fordert öffentliche Casual-Lobbies, Filter nach Format, Modus und privater Sichtbarkeit, kein Ranked, kein automatisches Matchmaking, Public Platform Risk Review, Spam-/Rate-Limit-Gates, aktive Moderations- und Abuse-Pfade, Health/Observability, Region-/Latenzsignale und einen Rollback-Plan.

V2.3 bleibt blockiert. V2.3a ist eine technische und UX-nahe Vorstufe, aber keine Public-Freigabe.

## Wiederverwendbare Bausteine aus V2.3a

| V2.3a-Baustein | Für V2.3 wiederverwendbar | Public-Anpassung |
| --- | --- | --- |
| `GET /api/matches/open` mit minimaler Antwort | Grundform einer Lobby-Listen-API | Öffentliche Sichtbarkeit, Filter, Rate Limits, Abuse-Signale und Observability müssen vorgeschaltet werden. |
| Filter `pending` und `discoverableInLan` | Muster für serverseitige Sichtbarkeitsentscheidung | Public benötigt eigene Sichtbarkeitsklassen, Account-/Guest-Identität und Moderationsstatus. |
| Minimale Metadaten ohne Tokens/Deckdaten | D0-Public-Metadaten-Basis | Public muss PII, Accountstatus, private Sichtbarkeit, Formatprofil und Cardpool-Version redigiert führen. |
| Join-Reuse statt zweiter Join-Stack | Architekturprinzip bleibt gültig | Join muss Account-/Session-/Rate-Limit-, Deck- und Abuse-Gates erneut validieren. |
| Stale-Join-Handling | Race- und Revalidierungsmodell bleibt gültig | Fehlerpfade dürfen öffentlich keine Existenz-, Token-, Deck- oder Moderationsdetails leaken. |
| Redaction- und Visibility-Tests | Testbasis bleibt wertvoll | Matrix muss um PII, Accountdaten, Rate-Limit-Audit, Moderation, AI-Debug und öffentliche Replay-Grenzen erweitert werden. |
| Web-UI unter `Beitreten` | UX-Ort und Fallback-Prinzip bleiben sinnvoll | Public braucht Filter, Statusklarheit, Missbrauchsresistenz, regionale Hinweise und deaktivierbare Alpha-Fläche. |

## Gap-Liste V2.3a zu V2.3

| Gap | V2.3a-Stand | V2.3-Anforderung | Konsequenz |
| --- | --- | --- | --- |
| Auth/Identität | keine Accounts, private LAN-Teilnehmer | geschlossene Account- oder klar geregelte Guest-Identität | Blockiert durch V2.0-Foundation und Datenschutzvertrag. |
| Datenschutz | keine Public-PII, keine Export-/Löschpflicht im Lobbykontext | Export, Löschung, Retention und Datensparsamkeit für Account-/Lobby-/Chatdaten | V2.3 darf nicht vor Privacy-Contract starten. |
| Moderation | keine öffentliche Nutzerbasis | Report-, Block-, Evidence- und RBAC-Pfade aktiv | V2.6-Vertrag ist Basis, aber Test-/Runbook-Slices fehlen. |
| Abuse/Spam | private kleine LAN-Annahme | Rate Limits, Crawling-Schutz, Spam-Abwehr und Missbrauchstelemetrie | Eigene Rate-Limit-/Redaction-Matrix nötig. |
| Observability | private Health-/Connection-Basis | redigierte Metrics, Alerts, Rate-Limit-Events und Public-Health | V2.7-Redaction-Baseline vor Public Alpha nötig. |
| Rollback | kein Public-Schalter | Alpha muss abschaltbar, rückrollbar und betrieblich beobachtbar sein | Rollback-/Kill-Switch-Vertrag nötig. |
| UI-Filter | keine Public-Filter | Format, Modus, private Sichtbarkeit, Region/Latenz als Anzeige oder Filter | Filtervertrag und redigierte Metadaten fehlen. |
| Deck-/Formatgrenzen | keine Public-Deckliste | Formatprofile, Cardpool-Version, serverseitige Deck-Revalidierung, keine Decklistenleaks | Deck-Metadaten bleiben nur abstrakt. |
| KI-Lobbies | kein neuer KI-Pfad | nur AI-supported Deckpool, keine Userdaten als Strategieinput, kein Debug öffentlich | KI bleibt account- und chatfrei, Debug bleibt verboten. |
| Public Replay/Spectator | nicht enthalten | Replay-Policy getrennt vor Sharing/Spectator | V2.8-/V2.4-Policy darf nicht durch Lobby implizit öffnen. |
| Asset/Recht | keine neuen Assets | keine offiziellen Artworks/Frames/Card Backs ohne Gate | Public Lobby darf kein Asset-Gate umgehen. |

## Risikoabgrenzung

Public-Lobby-Risiken sind nicht LAN-Lobby-Komfort. Der gefährliche Wechsel ist nicht die Liste selbst, sondern die unbekannte Nutzerbasis: Crawling, Spam, Harassment, Account-/PII-Verarbeitung, Supportfälle, Moderation, Betriebsdaten, Metadatenkorrelation und öffentliche Fehlerpfade.

Deshalb ist der korrekte nächste V2.3-Schritt kein Code-Slice, sondern ein Gate-Bündel:

1. Public Platform Risk Review nach Auth-, Datenschutz-, Moderations- und Observability-Vorarbeit.
2. Redaction-/Rate-Limit-Testmatrix für öffentliche Lobbylisten und Joinversuche.
3. Rollback-/Operability-Vertrag für eine abschaltbare Alpha.

## Folgeactivities

| Activity | Zweck | Blocker |
| --- | --- | --- |
| `act-2026-05-17-v23-public-lobby-risk-review` | Public Platform Risk Review mit Bedrohungsmodell, Scope und Startverboten | V2.0-Foundation, Privacy, Moderation-Tests, Observability |
| `act-2026-05-17-v23-public-lobby-redaction-rate-limit-matrix` | Testmatrix für Public-Lobby-Metadaten, PII-/Token-/Deck-Redaction, Rate Limits und Abuse-Events | Public-Lobby-Risk-Review |
| `act-2026-05-17-v23-public-alpha-rollback-operability-contract` | Rollback-, Kill-Switch-, Health- und Incident-Vertrag für Public Alpha | Public-Lobby-Risk-Review und Observability |

## Entscheidung

V2.3a darf in V2.3 wiederverwendet werden, aber nur als technische Basis. V2.3 Public Lobby Alpha bleibt blockiert, bis Auth/Datenschutz, Moderation, Abuse/Rate Limits, Observability und Rollback explizit gatefähig sind.

Dieses Review gibt keine Public Lobby, kein Matchmaking, kein Ranked, keine Accounts, keine Moderationskonsole, keine Spectator-/Replay-Freigabe, keine KI-Erweiterung, keine Kartenfreigabe und keine Asset-Freigabe frei.
