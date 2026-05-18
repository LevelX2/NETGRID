---
activityId: act-2026-05-17-v2-auth-privacy-decision-spike
status: done
kind: architecture
area: server
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: V2.0
blockedBy: []
resultArtifacts:
  - docs/releases/v2/v2-0-auth-privacy-cloud-decks/auth-privacy-decision-spike.md
  - docs/activities/inbox/act-2026-05-17-v2-account-session-auth-contract.md
  - docs/activities/inbox/act-2026-05-17-v2-account-session-foundation.md
  - docs/activities/inbox/act-2026-05-17-v2-privacy-export-delete-contract.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - Quellenprüfung in Roadmap, Server-Multiplayer, SQLite-Storage, Internet-Hardening, Web-Session-Recovery und Replay-Flächen
  - git diff --check
---

# V2.0 Auth- und Datenschutz-Entscheidungsschnitt

## Ziel

Vor einer Account-Implementierung soll der kleinste tragfähige V2.0-Entscheidungsschnitt entstehen: Accountmodell, Auth-Variante, Session-Revocation, Gast-/Privatmodus, Datenexport, Löschung und personenbezogene Redaction.

## Kontext und Quellen

- V2.0 Roadmap: `Closed Accounts Alpha` mit bekannten Nutzern, Session Management, optionalen Cloud-Decks, Export/Löschung, Datenschutzmodell, Auth-Provider- oder Passkey/OAuth-Entscheidung.
- Langfristige Roadmap: Accounts sind ein hartes Gate für Freunde, Profile, Stats, Ranked, Moderation und Public-Funktionen.
- Bestehender privater Betrieb nutzt lokale/private Tokens und darf nicht versehentlich durch Accounts ersetzt oder verschlechtert werden.

## Scope

- Bestehende Session-/Token-/Reconnect-Flows auf Accountfähigkeit prüfen.
- Entscheidungsvorlage für Auth-Optionen erstellen: private Accounts, Passkeys, OAuth, lokaler Gastmodus.
- Minimaldatenmodell für Accounts, Sessions, Revocation, Export und Löschung skizzieren.
- Privacy-/Redaction-Anforderungen für Logs, Diagnose, Browser-Storage und Adminsicht erfassen.
- Klären, ob lokale Gast-/Privatmodi parallel erhalten bleiben sollen.
- Folgepakete für konkrete Implementierung nur anlegen, wenn die Entscheidung sauber genug ist.

## Nicht im Scope

- Keine Auth-Implementierung.
- Keine Cloud-Deck-Implementierung.
- Keine öffentlichen Lobbys, Freunde, Chat, Rankings oder Profile.
- Keine Nutzung von Accountdaten als KI-Input.

## Akzeptanzkriterien

- [x] Es gibt eine konkrete Empfehlung für den ersten V2.0-Auth-Pfad oder eine klar begründete Blockerliste.
- [x] Datenexport, Löschung, Session-Revocation und Gastmodus sind als Produktentscheidungen sichtbar.
- [x] Redaction-Grenzen für Logs, Fehler und Diagnoseflächen sind benannt.
- [x] KI-Debug, AIInput und DecisionDebug bleiben ausdrücklich accountunabhängig und privat.
- [x] Konkrete Implementierungs-Folgeactivities sind klein geschnitten oder bewusst zurückgestellt.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Bei Sicherheits- oder Datenschutzunsicherheit lieber als Blocker dokumentieren als eine Implementierung vorwegnehmen.
- Keine externen Rechtsannahmen als gesichert formulieren.

## Ergebnisnotiz

Erledigt. `docs/releases/v2/v2-0-auth-privacy-cloud-decks/auth-privacy-decision-spike.md` empfiehlt für V2.0 geschlossene private Accounts mit Allowlist/Invite und Passkey-first Auth, ohne OAuth-Provider, Passwortdatenbank oder öffentliche Registrierung im ersten Slice. Account-Sessions werden getrennt von bestehenden Match-Join-/Session-/Reconnect-Tokens als widerrufbare Schicht mit `HttpOnly Secure` Cookie-Zielmodell geplant; lokaler Gast-/Privatmodus bleibt erhalten.

Datenexport, Löschung, Session-Revocation, Redaction-Grenzen, Browser-Storage-Risiken und accountfreie KI-Verträge sind dokumentiert. Drei Folgeactivities sind geschnitten: Account-/Session-/Passkey-Vertrag, Account-Session-Foundation und Export-/Löschvertrag. Verifikation: Quellenprüfung der bestehenden Roadmap-, Server-, Storage-, Web-Session- und Replay-Flächen sowie `git diff --check`.
