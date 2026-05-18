# V1.0.9 Requirements Review - Private Internet Hardening

Stand: 2026-05-06
Status: reviewed

## Ergebnis

V1.0.9 ist als Private-Internet-Härtungsrelease sinnvoll, konsistent und umsetzungsbereit vorbereitet.

Der Release ist klar auf private Internetfähigkeit begrenzt. Er härtet Transport, Origin/CORS/WebSocket-Zugriff, Rate Limits, Secrets/Token-Redaction, Health/Monitoring und Internet-Smokes. Er startet keine öffentliche Plattform und erweitert keine Engine-, Karten-, Mechanik-, Replay- oder StateHash-Verträge.

## Geprüfte Artefakte

- `docs/releases/v1/v1-0-9-private-internet-hardening/plan.md`
- `docs/releases/v1/v1-0-9-private-internet-hardening/requirements.md`
- `docs/releases/v1/v1-0-9-private-internet-hardening/private-internet-security-spec.md`
- `docs/releases/v1/v1-0-9-private-internet-hardening/private-deployment-ops-spec.md`
- `docs/releases/v1/v1-0-9-private-internet-hardening/test-matrix.md`
- `docs/releases/v1/v1-0-8-storage-backup-hardening/final-review.md`
- `docs/codex/CODEX_STATUS.md`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.ts`
- `scripts/run-e2e.mjs`
- `tests/e2e/`

## Funktionsprüfung

Fragestellung: Was soll die Funktion machen?

Antwort: V1.0.9 soll private Internetspiele für eingeladene Personen ermöglichen und absichern. Die Funktion ist nicht "öffentliche Multiplayerplattform", sondern "privater Tisch über Internet mit TLS, erlaubten Origins, Abuse-Bremsen, sauberer Secret-Behandlung, redaktionierten Betriebsflächen und belastbarem Smoke".

Bewertung: abgebildet.

Begründung:

- Die sechs Releasepakete decken alle notwendigen Betriebsränder ab.
- Die Requirements unterscheiden lokale Entwicklung und privaten Internetbetrieb.
- Die Non-Scope-Grenze verhindert Scope-Kriechen in Accounts, Public Lobby, Matchmaking, Chat, Rankings oder Turniere.

## Konsistenzprüfung

| Bereich | Ergebnis | Begründung |
| --- | --- | --- |
| Scope | pass | V1.0.9 bleibt Security-/Ops-Härtung und erweitert keine Regeln, Karten oder Plattformfeatures. |
| Reihenfolge | pass | Nach V1.0.8 ist private Persistenz robust; der nächste Engpass ist sicherer privater Internetbetrieb. |
| Transport | pass | HTTPS/WSS ist als Pflicht für private Internetprofile definiert; lokale HTTP-Entwicklung bleibt möglich. |
| Origin/CORS | pass | Der bestehende offene CORS-Zustand wird explizit als zu härtender Punkt abgebildet. |
| WebSocket | pass | WS-Origin-Prüfung ist eigener Must-Punkt und verhindert Matchpayloads vor erlaubter Origin. |
| Rate Limits | pass | Sensible Flows sind konkret genannt und testbar geschnitten. |
| Secrets | pass | Internet-Profil verlangt expliziten Token-Salt; Default-Salt bleibt lokal. |
| Redaction | pass | Token-, Hash-, Decklisten- und Hidden-Info-Muster sind für Logs, Health, Fehler, E2E und Payloads abgedeckt. |
| Health/Ops | pass | Health bleibt sicher und minimal; Diagnose wird nicht zum versteckten Admin-Datenkanal. |
| Teststabilität | pass | Rate-Limits müssen deterministisch testbar sein; lange Echtzeitfenster sind nicht verlangt. |
| Zukunftsdesign | pass | Gates sind adapterartig geplant und blockieren spätere Auth-/Public-Gates nicht. |

## Abdeckungsqualität

| Frage | Bewertung | Einschätzung |
| --- | --- | --- |
| Ist die Funktion ausreichend beschrieben? | sehr gut | Ziel, Nicht-Ziel, Betriebsprofile und sechs Pakete sind klar. |
| Sind alle kritischen Sicherheitsaspekte erfasst? | sehr gut | Transport, Origin, WS, Tokens, Logs, Rate Limits, Health und Proxy-Vertrauen sind enthalten. |
| Ist die Teststabilität gut genug geplant? | sehr gut | Deterministische Rate-Limit-Tests, E2E-Erweiterung und dokumentierter Smoke vermeiden reine Handprüfung. |
| Ist das Zukunftsdesign tragfähig? | gut bis sehr gut | Es bleibt privat und bereitet spätere Public-Gates vor, ohne sie vorwegzunehmen. |
| Gibt es riskante Lücken? | keine blockierende | Echter TLS/VPS-Smoke kann je nach Umgebung manuell bleiben, muss aber im Final Review belegt werden. |

## Offene technische Entscheidungen

Keine blockierende Produktentscheidung bleibt offen.

Diese Details dürfen in der Umsetzung entschieden und im Implementation Review dokumentiert werden:

- exakter Name und Parsing der Deployment-Profil-Variable,
- ob unsichere Internet-Konfiguration beim Start oder in einem Config-Check blockiert wird,
- konkrete Rate-Limit-Defaults und Window-Größen,
- interne Datenstruktur für Rate-Limit-Zähler,
- ob WebSocket-Origin-Ablehnung über `verifyClient`, `connection`-Vorprüfung oder äquivalenten Pfad erfolgt,
- exakte Form redaktionierter Ops-Logs,
- ob ein TLS-Smoke lokal automatisiert oder als manueller VPS/LAN-Drill dokumentiert wird.

## Risiken und Gegenmaßnahmen

| Risiko | Bewertung | Gegenmaßnahme |
| --- | --- | --- |
| Origin-Härtung bricht lokale Entwicklung. | mittel | Profiltrennung und lokale HTTP/Origin-Ausnahme. |
| WebSocket-Härtung sendet vor Ablehnung schon Payloads. | hoch | WS-Origin-Must-Test vor `join_match` und Leak-Scan. |
| Rate Limits werden flaky. | mittel | Deterministische Testfenster und kurze Testprofile. |
| Token-Leak durch Join-URL in Logs. | hoch | Redaction-Must, Join-URL-Test und E2E-Logscan. |
| Reverse Proxy erzeugt falsche Client-IP-Annahmen. | mittel | Forwarded-Headers nur in explizitem Trust-Modus. |
| Private Internet wird zur öffentlichen Plattform verwechselt. | hoch | Harte Non-Scope-Anforderungen und Scope-Regressionstest. |

## Gate

`V1_0_9_requirements_freeze_done: true`

`ready_for_V1_0_9_implementation: true`

## Blocker

Keine Blocker.

## Empfohlener nächster Umsetzungsprompt

```txt
Setze V1.0.9 Private Internet Hardening um.

Keine neuen Karten, Mechaniken, Accounts, öffentlichen Lobbys, Matchmaking-, Ranking-, Turnier-, Chat-, Moderations-, Postgres-, Replay-, StateHash-, Randomness- oder Engine-Autoritätsänderungen.

Lies zuerst:
- AGENTS.md
- AGENTS.local.md, falls vorhanden
- KI-Wissen-NETGRID/00 Projektstart.md
- KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md
- docs/codex/CODEX_STATUS.md
- docs/releases/v1/v1-0-9-private-internet-hardening/plan.md
- docs/releases/v1/v1-0-9-private-internet-hardening/requirements.md
- docs/releases/v1/v1-0-9-private-internet-hardening/private-internet-security-spec.md
- docs/releases/v1/v1-0-9-private-internet-hardening/private-deployment-ops-spec.md
- docs/releases/v1/v1-0-9-private-internet-hardening/test-matrix.md
- docs/releases/v1/v1-0-9-private-internet-hardening/requirements-review.md
- docs/releases/v1/v1-0-8-storage-backup-hardening/final-review.md

Aufgabe:
Implementiere die sechs V1.0.9-Pakete: Deployment-Profil mit HTTPS/WSS-Vertrag, REST-CORS-Origin-Allowlist, WebSocket-Origin-Prüfung, deterministische Rate-Limits für sensible Flows, Internet-Profil mit verpflichtendem Token-Salt, Redaction für Tokens/Hashes/Hidden Info, sichere Health-/Ops-Signale und automatisierte plus dokumentierte Internet-Smokes. Dokumentiere Umsetzung und Verifikation in V1_0_9_IMPLEMENTATION_REVIEW.md und V1_0_9_FINAL_REVIEW.md.
```
