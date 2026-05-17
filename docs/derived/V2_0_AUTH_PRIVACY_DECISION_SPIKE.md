# V2.0 Auth- und Datenschutz-Entscheidungsschnitt

Stand: 2026-05-17  
Status: Decision-Spike, keine Implementierungsfreigabe

## Findings

### Hoch: Account-Auth darf nicht auf dem aktuellen Browser-Recovery-Tokenmodell aufsetzen

Fundstellen:

- `apps/web/app/session-recovery.ts:61` speichert die laufende Match-Session in `sessionStorage`.
- `apps/web/app/session-recovery.ts:120` bis `apps/web/app/session-recovery.ts:155` serialisiert `sessionToken` und `reconnectToken` zusätzlich als recoverable Session in `localStorage`.
- `apps/web/app/page.tsx:11481` nutzt den Match-`sessionToken` als Bearer Token für Bootstrap.

Risiko: Das ist für den privaten Match-Recovery-Pfad tragbar, aber kein ausreichender Account-Identitätsanker. Ein kompromittiertes Browserprofil dürfte sonst Cloud-Decks, Accountdaten oder Export-/Löschfunktionen übernehmen.

Empfehlung: V2.0-Accounts bekommen eine eigene Account-Session-Schicht mit serverseitiger Revocation und bevorzugt `HttpOnly`, `Secure`, `SameSite=Lax` oder `Strict` Cookie. Falls die aktuelle getrennte Web-/API-Origin das nicht sauber erlaubt, ist ein Reverse-Proxy-/Same-Site-Deployment oder ein eigener Auth-Preflight Blocker vor Auth-Code.

### Hoch: Bestehende Match-Tokens sind gute Match-Capabilities, aber keine Account-Sessions

Fundstellen:

- `apps/server/src/multiplayer.ts:87` trennt `join`, `session` und `reconnect`.
- `apps/server/src/multiplayer.ts:192` bis `apps/server/src/multiplayer.ts:214` speichert pro Match Session- und Token-Hashes mit optionalem `expiresAt`, `revokedAt` und `usedAt`.
- `apps/server/src/multiplayer.ts:1019` bis `apps/server/src/multiplayer.ts:1047` rotiert Session- und Reconnect-Tokens beim Reconnect.
- `apps/server/src/multiplayer.ts:2171` bis `apps/server/src/multiplayer.ts:2224` authentifiziert über Token-Hashes und salted SHA-256.

Risiko: Account-Revocation, Account-Deletion und Cloud-Deck-Zugriff lassen sich nicht sauber ausdrücken, solange Account und Match-Capability dasselbe Tokenkonzept nutzen. Außerdem ist `expiresAt` im Modell vorhanden, wird aber aktuell nicht enforced.

Empfehlung: Match-Tokens bleiben per-match Capabilities für Spielen, Reconnect und Join. Account-Sessions werden separat modelliert. Account-gebundene Matches erhalten optional `accountId` an der `SessionRecord`-Seite, aber `applyAction`, `PlayerView`, `LegalActions`, Replay und KI bleiben accountunabhängig.

### Hoch: Datenschutzmodell muss Display-Namen, Replay-Index und Wartungsflächen als personenbezogen behandeln

Fundstellen:

- `apps/server/src/storage-sqlite.ts:602` bis `apps/server/src/storage-sqlite.ts:626` persistiert Sessions und Token-Hashes.
- `apps/server/src/storage-sqlite.ts:1009` bis `apps/server/src/storage-sqlite.ts:1027` zeigt Wartungsteilnehmer mit `displayName`, Verbindung und `lastSeenAt`.
- `apps/web/app/replays/page.tsx:12` bis `apps/web/app/replays/page.tsx:27` zeigt Replay-Index-Metadaten inklusive Teilnehmernamen.
- `apps/server/src/multiplayer.ts:1615` bis `apps/server/src/multiplayer.ts:1629` exportiert Replays für Runner/Korp, aber nicht `local_analysis`.

Risiko: Für V2.0 sind Display-Namen, Account-IDs, optionale E-Mail-Adressen, Session-Metadaten und Replay-Zuordnungen personenbezogene Daten. Bestehende private Wartungs- und Replay-Flächen sind nicht automatisch public- oder account-tauglich.

Empfehlung: V2.0 definiert Redaction-Profile für `local_admin`, `account_self`, `opponent`, `moderator` und `public_none`. Export/Löschung müssen Display-Namen, Account-Links, Cloud-Decks und Sessiondaten behandeln; Hidden-Info, Gegner-Decklisten, FullState, Token-Hashes, `AIInput` und `DecisionDebug` bleiben ausgeschlossen.

### Mittel: V1.0.9 liefert eine nutzbare Sicherheitsbasis, aber kein Account-Gate

Fundstellen:

- `apps/server/src/internet-hardening.ts:60` bis `apps/server/src/internet-hardening.ts:77` erzwingt im privaten Internetprofil HTTPS-Base-URLs, Origin-Allowlist und eigenen Token-Salt.
- `apps/server/src/internet-hardening.ts:89` bis `apps/server/src/internet-hardening.ts:105` setzt CORS-Origin-Prüfung.
- `apps/server/src/internet-hardening.ts:160` bis `apps/server/src/internet-hardening.ts:184` definiert Rate-Limits für sensible Flows.
- `apps/server/src/internet-hardening.ts:220` bis `apps/server/src/internet-hardening.ts:231` redigiert Token-, Hash-, Decklisten- und PrivatePayload-Muster.

Risiko: Diese Basis reduziert Token- und Origin-Risiken, ersetzt aber keine Account-Recovery-, Session-Revocation-, CSRF- und Cookie-Entscheidung.

Empfehlung: V2.0 nutzt diese Basis weiter und ergänzt explizite Account-Auth-Tests: Cookie-Flags, CSRF/Origin, Session-Revocation, Logout-all-devices, Token-Leak-Scan, Export/Delete und Browser-Storage-Scan.

## Entscheidung

Empfohlener erster V2.0-Pfad: geschlossene private Accounts mit Allowlist/Invite und Passkey-first Auth. Kein OAuth-Provider, keine Passwortdatenbank und keine öffentliche Registrierung im ersten Slice.

Konkret:

1. Lokaler Gast-/Privatmodus bleibt erhalten und bleibt der robuste Fallback für lokale/private Spiele.
2. Accounts werden nur für bekannte Nutzer über Admin-Invite oder manuell angelegten Account aktiviert.
3. Passkeys/WebAuthn sind der Zielpfad für Anmeldung; Recovery läuft über Admin-Reset oder zweite registrierte Passkey-Credential, nicht über E-Mail-Zwang.
4. Account-Sessions sind getrennt von Match-Sessions und müssen serverseitig widerrufbar sein.
5. Match-Join-, Match-Session- und Match-Reconnect-Tokens bleiben als per-match Capabilities bestehen.
6. Cloud-Decks sind optional und accountgebunden, aber strikt von Match-Snapshots getrennt.
7. `AIInput`, `DecisionDebug`, KI-Profile und Live-KI bekommen keine Accountdaten. Erlaubt bleibt nur eine lokale, explizite Schwierigkeitseinstellung.

Blocker vor Auth-Code:

- Same-Site-/Reverse-Proxy- oder Cookie-Strategie für `HttpOnly Secure` Account-Sessions.
- Passkey/WebAuthn-RP-ID- und HTTPS-Teststrategie.
- Retention-Entscheidung für Backups, Logs, Replay-Index und gelöschte Accounts.

## Minimaldatenmodell

V2.0 sollte zunächst diese fachlichen Tabellen/Collections spezifizieren, ohne bestehende Engine- oder Match-State-Verträge zu verändern:

| Modell | Zweck | Datenschutzgrenze |
| --- | --- | --- |
| `accounts` | `accountId`, Anzeigename, Status, Rolle `user/admin`, Zeitstempel, optionaler Kontaktkanal | Kontaktkanal optional; keine Accountdaten in PlayerView/KI |
| `account_credentials` | Passkey-Credential-ID, Public Key, Sign Counter, Name, `revokedAt` | keine Passwörter, keine geheimen Rohdaten |
| `account_sessions` | Account-Session-Hash, Gerätelabel optional, `createdAt`, `lastSeenAt`, `expiresAt`, `revokedAt` | keine Roh-Tokens in DB, kein User-Agent/IP ohne eigene Entscheidung |
| `account_invites` | Invite-/Recovery-Token-Hash, Zielaccount, Ablauf, Nutzung, Revocation | einlösbar nur einmal, nie in Logs |
| `account_decks` | optionale Cloud-Deck-Drafts mit Formatprofil und Owner | keine gegnerischen Decklisten, keine Match-Hidden-Daten |
| `account_exports` | Exportauftrag, Status, Ablauf, Artefakt-Metadaten | Export enthält nur eigene accountbezogene Daten |
| `account_erasure_requests` | Löschauftrag, Status, erledigte Bereiche, Retention-Ausnahmen | Match-Historie wird anonymisiert oder entkoppelt |

Bestehende Match-Strukturen erhalten nur optionale Account-Links an der Session/Teilnehmer-Metadatenebene. `GameState`, `PlayerAction`, `LegalAction`, `PublicGameEvent`, Replay-StateHash und KI-Verträge bleiben unverändert.

## Export und Löschung

Mindestentscheidung für V2.0:

- Export enthält Accountprofil, eigene Cloud-Decks, eigene Einstellungen, eigene Match-Metadaten und eigene side-sichere Replay-Exporte.
- Export enthält keine Tokens, Token-Hashes, FullState, private Deck-Snapshots des Gegners, Hidden Cards, `privatePayload`, `AIInput`, `DecisionDebug` oder lokale Dateipfade.
- Löschung widerruft Account-Sessions, löscht Cloud-Decks und Profilfelder, anonymisiert historische Anzeigenamen und entfernt Account-Links aus Match-Metadaten.
- Backups bekommen eine Retention-Aussage statt eines falschen Sofortlöschversprechens.
- Aktive Matches müssen vor Löschung beendet, verlassen oder ausdrücklich entkoppelt werden.

## Redaction-Grenzen

Verboten in Logs, Fehlern, Diagnose, Metriklabels, Browser-Storage-Inspektion, Replay-Export und Admin-Listen:

- Roh-Tokens: `sessionToken`, `reconnectToken`, `joinToken`, Account-Session-Token, Invite-/Recovery-Code.
- Token-Hashes außerhalb interner DB.
- E-Mail/Kontaktkanal, falls später eingeführt.
- vollständige Decklisten außerhalb eigener Cloud-Deck-/Exportansicht.
- `privatePayload`, `cardInstances`, FullState, Hidden-Zoneninhalte, lokale Pfade.
- `AIInput`, `DecisionDebug` und nutzerbezogene KI-Anpassung.

Erlaubt, wenn für den Kontext nötig:

- pseudonyme `accountId` nur in interner Admin-/Audit-Sicht.
- Anzeigename in Lobby/Match nur als bewusst sichtbare Nutzerangabe.
- aggregierte, accountfreie Metriken wie Status, Baseline, Formatprofil, Cardpool-Version, AI-Version.

## Folgepakete

Neu geschnitten:

1. `act-2026-05-17-v2-account-session-auth-contract` - Account-/Session-/Passkey-Vertrag mit Cookie-/CSRF-/Revocation-Testmatrix.
2. `act-2026-05-17-v2-account-session-foundation` - kleiner Server-Foundation-Slice nach Vertragsfreeze.
3. `act-2026-05-17-v2-privacy-export-delete-contract` - Export-/Lösch-/Retention-Vertrag.

Bereits vorhandene Folgepakete bleiben passend:

- `act-2026-05-17-v2-cloud-deck-boundary` hängt fachlich an diesem Ergebnis.
- `act-2026-05-17-v2-observability-redaction-baseline` deckt Betriebsdaten-Redaction ab.
- `act-2026-05-17-v2-platform-gate-inventory` kann diese Entscheidung in die V2.x-Gesamtmatrix aufnehmen.

## Gesamteinschätzung

Die aktuelle Architektur ist für private Match-Capabilities, Reconnect und side-sichere Payloads belastbar. Für V2.0 sollte Accounts nicht als Ersatz dieser Match-Tokens verstanden werden, sondern als zusätzliche, widerrufbare Identitäts- und Cloud-Daten-Schicht. Ohne Cookie-/Passkey-/Retention-Entscheidung wäre eine Account-Implementierung verfrüht.
