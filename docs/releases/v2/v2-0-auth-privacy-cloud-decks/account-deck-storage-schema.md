# V2.0 Account- und Deck-Storage-Schema

Stand: 2026-07-18

Status: Schema-Freeze für SQLite-Version 2

## Physische Grenze

Match-, Account- und persönliche Decktabellen liegen in derselben durch
`NETGRID_SQLITE_STORAGE_PATH` bestimmten SQLite-Datei. Fachliche Services
bleiben getrennt. Backup, Restore, Integritätsprüfung und Schema-Metadaten
behandeln die Datei als eine atomare Deploymenteinheit.

## Tabellen

### `accounts`

- `account_id TEXT PRIMARY KEY`
- `login_name TEXT NOT NULL`
- `login_name_normalized TEXT NOT NULL UNIQUE`
- `display_name TEXT NOT NULL`
- `status TEXT NOT NULL` mit `active`, `disabled`, `deleted`
- `role TEXT NOT NULL` mit `user`, `admin`
- `credential_version INTEGER NOT NULL DEFAULT 1`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `deleted_at TEXT`

### `account_password_credentials`

- `account_id TEXT PRIMARY KEY` und FK auf `accounts`
- `algorithm TEXT NOT NULL` (`scrypt`)
- `parameters_version INTEGER NOT NULL`
- `salt TEXT NOT NULL`
- `password_hash TEXT NOT NULL`
- `key_length`, `cost`, `block_size`, `parallelization`, `max_memory`
  jeweils `INTEGER NOT NULL`
- `changed_at TEXT NOT NULL`
- `must_change INTEGER NOT NULL DEFAULT 0`

### `account_sessions`

- `session_id TEXT PRIMARY KEY`
- `account_id TEXT NOT NULL` und FK auf `accounts`
- `session_token_hash TEXT NOT NULL UNIQUE`
- `csrf_token_hash TEXT NOT NULL`
- `credential_version INTEGER NOT NULL`
- `auth_strength TEXT NOT NULL DEFAULT 'password'`
- `created_at`, `last_seen_at`, `expires_at TEXT NOT NULL`
- `revoked_at TEXT`
- `device_label TEXT`

### `account_invites` und `account_reset_tokens`

Beide Tabellen besitzen interne ID, zweckgebundenen eindeutigen Token-Hash,
Zielaccount, Ersteller, `created_at`, `expires_at`, `used_at` und
`revoked_at`. Invite kann einen vorab angelegten Account aktivieren; Reset
ändert niemals selbst das Passwort, sondern autorisiert genau eine
Passwortsetzung.

### `account_decks`

- `cloud_deck_id TEXT PRIMARY KEY`
- `owner_account_id TEXT NOT NULL` und FK auf `accounts`
- `deck_version INTEGER NOT NULL`
- `name`, `side`, `identity_card_id`, `card_pool_snapshot_id`,
  `format_profile_id TEXT NOT NULL`
- optionale `card_pool_version`, `format_profile_version`
- `validation_status TEXT NOT NULL`
- `deck_json TEXT NOT NULL` mit Schema `netgrid-account-deck-v1`
- `created_at`, `updated_at TEXT NOT NULL`
- `deleted_at TEXT`

Indexe:

- `account_decks(owner_account_id, deleted_at, updated_at)`;
- `account_sessions(account_id, revoked_at, expires_at)`;
- Invite-/Reset-Token-Hash jeweils eindeutig.

## Migration

Schema 1 wird in einer Transaktion auf Schema 2 erweitert. Bestehende Matches
werden nicht umgeschrieben. Die bisherige isolierte Account-Foundation kann
vorhandene Tabellen ergänzen, aber keine Spalten oder Tokenwerte verlieren.
Nach Migration müssen `PRAGMA foreign_key_check` und `PRAGMA integrity_check`
grün sein.

## Deckquote

Das Anlegen oder Kopieren eines Decks läuft in `BEGIN IMMEDIATE`, zählt die
nicht gelöschten Decks des Owners und schreibt nur bei `count < limit`. Das
Produktlimit ist 50 und über `NETGRID_ACCOUNT_DECK_LIMIT` konfigurierbar.

## Backup und Löschung

Die bestehende SQLite-Dateisicherung enthält automatisch Account- und
Decktabellen. Accountlöschung widerruft Sessions, löscht oder tombstoned
Credentials und persönliche Decks und entkoppelt Accountmetadaten, verändert
aber keine Match-Engine-Historie oder Match-Snapshots.
