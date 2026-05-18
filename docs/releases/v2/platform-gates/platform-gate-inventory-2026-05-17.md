# V2.x Platform-Gate-Inventar

Stand: 2026-05-17  
Status: Planungsinventar, keine Implementierungsfreigabe

## Ausgangslage

V1.9.22 ist abgeschlossen und bestätigt die vollständige V1.9.10-bis-V1.9.22-Originalset-Completion-Kette. Das ist kein automatischer V2.x-Start: Produkt-, Auth-, Datenschutz-, Moderations-, Betriebs- und Rechtsgates bleiben separate Entscheidungen.

V2.3a ist abgeschlossen, aber nur als privater LAN-Open-Lobby-Mini-Slice. Der Final Review grenzt ausdrücklich öffentliche Lobby, Accounts, Rankings, Turnier-/Spectator-Funktionen und Chat-Ausbau aus.

Neue tragfähige V2-Vorarbeiten vom 2026-05-17:

- `docs/releases/v2/v2-0-auth-privacy-cloud-decks/auth-privacy-decision-spike.md`
- `docs/releases/v2/v2-0-auth-privacy-cloud-decks/account-session-auth-contract.md`
- `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md`

## Readiness-Tabelle

Statuslegende:

- `bereit für kleinen Implementierungsslice`: Ein enges Folgepaket kann Code schreiben, ohne V2.x öffentlich freizugeben.
- `bereit für Analyse`: Nächster Schritt ist Vertrag, Testmatrix, Runbook oder Policy.
- `blockiert`: Harte Gate-Entscheidung fehlt vor Umsetzung.
- `später`: bewusst nachgelagert.

| Release | Thema | Status | Bereits tragfähig | Blocker / harte Gates | Nächster kleinster Schritt |
| --- | --- | --- | --- | --- | --- |
| V2.0 | Closed Accounts Alpha | bereit für kleinen Implementierungsslice | Auth-/Privacy-Decision und Account-/Session-/Passkey-Vertrag sind vorhanden; lokale Gastmodi bleiben abgegrenzt | Same-Site-/Cookie-Deployment, Passkey-Testbarkeit, Export/Löschung, Cloud-Deck-Grenze, ToS/Privacy-Text | `act-2026-05-17-v2-account-session-foundation`, danach Export-/Löschvertrag und Cloud-Deck-Boundary |
| V2.1 | Private Friends/Invites | bereit für Analyse | Account-Vertrag erlaubt spätere Account-IDs und Privacy-Controls | Account-Foundation nicht implementiert, Blocking/Presence/Friend-Privacy fehlt | erst nach V2.0-Foundation ein Friends-/Invite-Privacy-Vertrag |
| V2.2 | Minimal Chat Gate | bereit für Analyse | bestehender Lobbychat ist von GameEvents/StateHash getrennt; Moderationsvertrag definiert Datenklassen | Report/Block/Retention, Chat-Export/Löschung, Spam/Rate-Limits, kein Chat in KI/Replay ohne Entscheidung | `act-2026-05-17-v2-chat-contract-preflight` |
| V2.3 | Public Lobby Alpha | blockiert | V2.3a liefert privaten LAN-Listen-/Join-Vorstufenschnitt mit Payload-Redaction | Auth, Moderation, Abuse, Observability, Datenschutz, Public Risk Review; V2.3a ist keine Public-Lobby-Freigabe | nach Gate-Freeze ein Public-Lobby-Risk-Review, nicht jetzt |
| V2.4 | Spectator Private/Delayed | bereit für Analyse | Replay-Perspektiven und Hidden-Info-Barrieren existieren; Public-Replay bleibt getrennt | Spectator-Delay, Rollen/Sichtbarkeit, Consent, Hidden-Info-Leaktests | `act-2026-05-17-v2-spectator-projection-spike` |
| V2.5 | Matchmaking Casual | später | keine direkte technische Basis außer Matchstart/Join-Flows | Account/Guest-Identity, Abuse/Moderation, Queue/Load, Smurfing, Region/Latenz | zurückstellen bis V2.0/V2.3/V2.6 tragfähig |
| V2.6 | Moderation Console | bereit für Analyse | Moderation/Evidence/RBAC-Vertrag ist vorhanden | RBAC-Tests, Evidence-Export, Moderator-Runbook, Retention-Policy | `act-2026-05-17-v2-moderation-rbac-redaction-tests`, Evidence-Export-Vertrag, Runbook |
| V2.7 | Observability/Scale | bereit für Analyse | V1.0.9 Private Internet Hardening, Connection-Audit, Health, Rate-Limits und Storage-Maintenance existieren | Public-Observability-Redaction, Metrics/Traces ohne PII, Betriebskosten/Alerting, Skalierungsmodell | `act-2026-05-17-v2-observability-redaction-baseline` |
| V2.8 | Public Replay | bereit für Analyse | Private Replay-Browser, side-sichere Perspektiven, StateHash-Prüfung und exportierbare Runner/Korp-Perspektiven existieren | Consent, Public/private Replay-Policy, Hidden-Info-Barrieren, Decklisten, Asset-Gate, Moderationsintegration | `act-2026-05-17-v2-public-replay-policy-projection` |

## Gate-Entscheidungen

| Gate | aktueller Stand | Konsequenz |
| --- | --- | --- |
| Auth | Decision und Account-/Session-Vertrag vorhanden | kleiner Foundation-Slice möglich, keine Public-Freigabe |
| Datenschutz | Auth-/Privacy-Decision vorhanden, Export-/Löschvertrag offen | V2.0 nicht vollständig startklar |
| Moderation | RBAC-/Evidence-Vertrag vorhanden | Tests/Runbook/Exportvertrag nötig, keine Konsole |
| Betrieb | V1.0.9 und private Maintenance vorhanden | Public Observability/Scale noch Analyse |
| Rechts-/Assetpfad | private lokale Assetgrenzen bekannt | Public Assets/Card Art/Frames/Backs weiter blockiert |
| Public Replay/Spectator | private Replaybasis vorhanden | Public Replay/Spectator nur nach Policy/Consent/Redaction |
| KI-/LLM-Grenzen | LegalActions/PlayerView/PublicEvents und accountfreie KI bestätigt | keine LLM-Sanktion, keine Chat-/Accountdaten als KI-Input |

## Priorisierte nächste Pakete

Diese bestehenden Pakete sind die kleinsten sinnvollen nächsten Schritte:

1. `act-2026-05-17-v2-account-session-foundation` - einziger enger V2.0-Implementierungsslice, weil der Vertrag gefreezt ist.
2. `act-2026-05-17-v2-privacy-export-delete-contract` - schließt das V2.0-Datenschutzloch für Export, Löschung und Retention.
3. `act-2026-05-17-v2-cloud-deck-boundary` - trennt Account-Decks von lokalen Decks und Match-Snapshots.
4. `act-2026-05-17-v2-observability-redaction-baseline` - verhindert Public-/Account-Leaks in Logs und Metriken.
5. `act-2026-05-17-v2-moderation-rbac-redaction-tests` - macht den Moderationsvertrag testbar.
6. `act-2026-05-17-v2-public-replay-policy-projection` - klärt Public Replay, bevor Spectator oder Public Sharing startet.

## Nicht-Freigaben

Dieses Inventar gibt nicht frei:

- öffentliche Registrierung.
- Public Lobby Alpha.
- Matchmaking.
- Chat-Ausbau.
- Spectator/Public Replay.
- Moderationskonsole.
- OAuth, Passwortdatenbank oder LLM-Moderation.
- neue Karten, Mechaniken, RulesBaseline, Replay-StateHash-Änderungen oder KI-Deckpools.

## Gesamteinschätzung

V2.x ist jetzt besser sortiert als in der alten Roadmap: V2.0 und V2.6 haben belastbare Vertragsgrundlagen, V2.3a ist korrekt als private LAN-Vorstufe erledigt, und der Originalset-/Kartenpfad blockiert V2.x nicht mehr. Der nächste tragfähige Code-Slice ist nur die Account-Session-Foundation. Alles Öffentliche bleibt hinter Datenschutz-, Moderations-, Observability-, Public-Replay-/Spectator- und Rechts-/Asset-Gates.
