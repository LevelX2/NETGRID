# V2.0 Passwort-Accounts und persönliche Server-Decks – Paketprozess

Stand: 2026-07-18

Status: aktiv – P04 abgeschlossen, P05 als Nächstes

Quelle: `docs/releases/v2/v2-0-auth-privacy-cloud-decks/user-profiles-password-cloud-decks-staged-plan-2026-07-18.md`

## Zielprüfung

Die Vorgabe ist für eine automatische sequenzielle Umsetzung ausreichend
präzise. Gesamtziel, Reihenfolge, Sicherheitsgrenzen, Nicht-Ziele,
Kernartefakte und Release-Gates sind im freigegebenen Stufenplan beschrieben.

Konservative Annahmen:

- Die erste Accountstufe bleibt geschlossen und verwendet Admin-Anlage oder
  einmalige Einladung; es gibt keine öffentliche Selbstregistrierung.
- Der Anmeldename ist der erste Login-Schlüssel. E-Mail wird noch nicht
  erhoben oder als Recovery-Kanal verwendet.
- Der lokale Gast-/Privatmodus bleibt erhalten.
- Das Defaultlimit beträgt 50 aktive persönliche Decks pro Account.
- Projekt-Snapshots werden nur nach expliziter Kuration als Standard-Decks
  sichtbar; KI-, Test- und historische Decks bleiben intern.
- SQLite bleibt für die private Alpha der autoritative Storage. Postgres,
  Multi-Instance- und Public-Scale-Arbeit sind nicht Teil dieses Prozesses.

## Gesamtziel

NETGRID erhält eine geschlossene Passwort-Account-Alpha mit sicheren,
serverseitig widerrufbaren Account-Sessions und einer Web-Anmeldung. Ein
eingeloggter Account kann bis zu 50 persönliche Decks serverseitig speichern,
kuratierte Standard-Decks direkt spielen oder als eigenes Deck kopieren. Die
vorhandenen Match-Capabilities, Engine-, Hidden-Info-, Replay-, StateHash- und
KI-Grenzen bleiben unverändert.

## Nicht-Ziele

- keine E-Mail-Verifikation oder E-Mail-Recovery;
- keine Passkeys, TOTP oder MFA;
- keine öffentliche Registrierung oder öffentliche Profile;
- keine Freunde, öffentliche Lobby, Rankings, Statistiken oder Deckfreigaben;
- keine Postgres-, Multi-Instance- oder horizontale Skalierungsarbeit;
- keine neue Spielmechanik, Karte oder KI-Freigabe;
- keine Accountdaten in `GameState`, `PlayerView`, `LegalAction`,
  `PublicGameEvent`, Replay-StateHash, `AIInput` oder `DecisionDebug`.

## Controller-Invarianten

- Es ist immer genau ein Paket aktiv.
- Kein Paket wird übersprungen.
- Jedes Paket endet erst nach seinen paketnahen Checks, `git diff --check`,
  Ergebnisdokumentation und eigenem Commit.
- Der Hauptworkspace `C:\Projekte\NETGRID` bleibt bis zum finalen lokalen
  Merge unberührt.
- Alle Umsetzungsänderungen erfolgen im Worktree
  `C:\Projekte\NETGRID_V2_PASSWORD_ACCOUNTS_CLOUD_DECKS` auf Branch
  `codex/v2-password-accounts-cloud-decks`.
- Account-Session-Tokens, Passwort-, Invite- und Reset-Rohwerte werden weder
  persistiert noch geloggt oder über Browser-Storage transportiert.
- Account-Sessions und Match-Join-/Session-/Reconnect-Capabilities bleiben
  getrennte Authentisierungsräume.
- Persönliche Decks sind Owner-only-Drafts. Matchstart nutzt ausschließlich
  neu validierte immutable Snapshots.
- Gegnerpayloads, Replays, Logs und KI erhalten keine fremden Decklisten,
  Account-IDs oder persönlichen Deck-IDs.
- Maintenance-Authentisierung bleibt ein getrennter Adminvertrag.

## Automatische Fehlerbehandlung

- Rote paketnahe Tests werden innerhalb des aktiven Pakets eng diagnostiziert
  und behoben; kein Wechsel zum Folgepaket.
- Ein nicht zum Paket gehörender Fund wird als Follow-up dokumentiert und
  erweitert den Scope nicht stillschweigend.
- Bei gleichzeitigem Main-Fortschritt wird `main` vor dem finalen Merge in den
  Arbeitsbranch integriert. Konflikte werden inhaltlich gelesen und erhalten
  beide kompatiblen Intentionen.
- Ein Testtimeout oder abgebrochener Prozess zählt als fehlgeschlagener Check.
- Ein Sicherheitsblocker erzeugt einen Blocker-Report mit Removal Condition;
  der Prozess stoppt, ohne unsicheren Fallback einzubauen.

## Sicherheitsblocker

Die Umsetzung stoppt, wenn einer dieser Fälle nicht sauber lösbar ist:

- sichere Same-Site-/Cookie-Strategie im bestehenden Deploymentprofil nicht
  herstellbar;
- Account- und Match-Tokens lassen sich in API oder Webclient nicht klar
  trennen;
- Migration oder Backup/Restore kann Account-/Deckdaten verlieren;
- Owner-Autorisierung persönlicher Decks ist nicht serverseitig erzwingbar;
- Standard-/interne Deckklassifikation würde einen aktiven KI- oder Testvertrag
  unbemerkt entfernen;
- Hidden-Info-, Replay- oder StateHash-Gates werden durch Account-/Deckarbeit
  verletzt.

## State Machine

```text
prepared
  -> package_01_contract_schema
  -> package_02_account_password_service
  -> package_03_account_http_api
  -> package_04_account_web_ui
  -> package_05_account_decks_server
  -> package_06_account_decks_web
  -> package_07_release_closeout
  -> final_verification
  -> merged_to_main
  -> worktree_removed
  -> branch_removed
  -> complete
```

Bei Paketfehlern bleibt der Zustand auf dem aktuellen Paket. Ein Übergang ist
nur erlaubt, wenn das jeweilige Done-Gate dokumentiert erfüllt ist.

## Paketfolge

| Paket | Titel | Kernziel | Commit-Vorschlag |
| --- | --- | --- | --- |
| P01 | Vertrag, Schema und Deckkuratierung | Passwort-first-Vertrag, gemeinsame SQLite-Migration und sichtbarer Standarddeck-Katalog einfrieren | `docs: freeze password account and standard deck contracts` |
| P02 | Account- und Passwort-Service | Passwort-Credential, sichere Verifikation, Accountanlage, Sessions und Revocation implementieren | `feat(server): add password account service` |
| P03 | Geschlossene Account-HTTP-API | Bootstrap/Invite, Login, Session, Logout, Passwortwechsel, CSRF/Origin/Rate-Limit anbinden | `feat(server): expose closed account auth api` |
| P04 | Account-Weboberfläche | Anmelden, Einladung/Accountanlage, Profil, Logout und Sessionwiederherstellung umsetzen | `feat(web): add closed account login and profile flow` |
| P05 | Persönliche Decks und Standards im Server | Owner-Storage, 50er-Quote, CRUD, Standard-Kopie und Matchstart-Handoff implementieren | `feat(server): add account deck library and standard decks` |
| P06 | Deckeditor und Matchstart | `Standard-Decks`/`Meine Decks`, Kopieren, CRUD, Import und Auswahl integrieren | `feat(web): integrate account and standard deck libraries` |
| P07 | Releaseabschluss | Gesamtchecks, Security-/Privacy-Matrix, Reviews, Status und Runbook abschließen | `docs: close v2 password accounts and cloud decks alpha` |

## Paketdetails

### P01 – Vertrag, Schema und Deckkuratierung

Eingangsvoraussetzungen:

- freigegebener Stufenplan;
- vorhandene Account-Session-Foundation;
- vorhandene SQLite-, Deck-Draft- und Match-Snapshot-Verträge.

Konkrete Arbeit:

- Passkey-first-Vertrag in einen Passwort-first-Alpha-Vertrag mit späterem
  Passkey-Ziel überführen;
- Account-, Passwort-, Session-, Invite/Bootstrap- und Account-Deck-Schema
  sowie Migration/Backup-Grenzen spezifizieren;
- Standarddeck-Metadatenvertrag mit `standard`, `internal_ai`, `test_fixture`
  und `retire` festlegen;
- bestehenden Snapshotbestand kuratieren, ohne KI-/Testverbraucher zu
  verändern;
- Requirements, Testmatrix und API-Spezifikation anlegen.

Kernartefakte:

- `docs/releases/v2/v2-0-auth-privacy-cloud-decks/`;
- `data/decks/`;
- neue Schema-/Katalogverträge in Server-/Webnähe.

Checks:

- Schema-/JSON-Validierung;
- relevante Deck-/Snapshot-Tests;
- `git diff --check`.

Done-Gate:

- keine offene Schema-, Credential-, Cookie-, Decksichtbarkeits- oder
  Migrationfrage, die P02 bis P06 strukturell verändern würde.

### P02 – Account- und Passwort-Service

Eingangsvoraussetzung: P01 committed.

Konkrete Arbeit:

- Accountstorage in die autoritative SQLite-Migrationskette integrieren;
- Passwort-Credentials mit speicherhartem, versioniertem KDF, Salt,
  Blockliste und Rehashfähigkeit implementieren;
- normalisierte eindeutige Anmeldenamen, Accountstatus und Adminanlage;
- Account-Sessions mit Ablauf, Credential-Version und Revocation;
- Export-/Löschgrundlagen und redigierte Self-Views ergänzen.

Kernartefakte:

- `apps/server/src/account-session.ts` und neue eng geschnittene Module;
- SQLite-Storage/Migration;
- paketnahe Tests.

Checks:

- Server-Account-/Storage-Tests;
- Server-Typecheck;
- Token-/Password-Leaktests;
- `git diff --check`.

Done-Gate:

- Klartextpasswort und Session-Rohwert erscheinen in keiner Persistenz oder
  Self-/Fehlersicht; Ablauf und Revocation sind grün.

### P03 – Geschlossene Account-HTTP-API

Eingangsvoraussetzung: P02 committed.

Konkrete Arbeit:

- Admin-Bootstrap oder einmalige Einladung ohne öffentliche Registrierung;
- Login, Session-Self, Logout, Revoke-all, Passwortänderung und Admin-Reset;
- `HttpOnly Secure SameSite`-Cookie im privaten Internetprofil;
- CSRF, Origin-Allowlist, Rate Limits, neutrale Fehler und Redaction;
- Account- und Match-Capability-Middleware negativ gegeneinander testen.

Kernartefakte:

- `apps/server/src/http-server.ts` und kleine Authmodule;
- Server-API-/Securitytests;
- Runbook-Konfiguration.

Checks:

- paketnahe HTTP-/Auth-/Internet-Hardening-Tests;
- Server-Typecheck;
- Browser-/Payload-/Log-Leakprüfung;
- `git diff --check`.

Done-Gate:

- geschlossener Account kann angelegt, angemeldet und vollständig abgemeldet
  werden; Account-Cookie kann keine Matchaction autorisieren und umgekehrt.

### P04 – Account-Weboberfläche

Eingangsvoraussetzung: P03 committed.

Konkrete Arbeit:

- Startzustand für Gast oder Account;
- Login-/Bootstrap-/Inviteformular;
- Account-Self-/Profilanzeige;
- Logout, alle Geräte abmelden und Passwort ändern;
- CSRF nur im Speicher halten; Account-Session-Rohwert nie über JavaScript
  zugänglich machen;
- bestehende Match-Recovery unverändert lassen.

Kernartefakte:

- neue kleine Account-Komponenten/Hooks unter `apps/web/`;
- minimale Integration in die Startkonsole;
- Web-Unit-/Browser-E2E-Tests.

Checks:

- Web-Tests und Typecheck;
- Browser-Storage-Scan;
- Gast-/Match-Recovery-Regression;
- `git diff --check`.

Done-Gate:

- Accountflow ist benutzbar, Gastmodus bleibt benutzbar und kein
  Account-Session-Rohwert liegt in `localStorage` oder `sessionStorage`.

### P05 – Persönliche Decks und Standards im Server

Eingangsvoraussetzung: P04 committed.

Konkrete Arbeit:

- accountgebundener Deckstorage mit Optimistic Locking und 50er-Quote;
- Owner-only List/Get/Create/Update/Delete;
- kuratierter Standarddeck-Katalog;
- Standarddeck als persönliches Deck kopieren;
- expliziter lokaler Import;
- serverseitige Revalidierung und immutable Snapshot-Erzeugung;
- Export/Löschung und Backup/Restore um Account-Decks ergänzen.

Kernartefakte:

- Server-Deckstorage/-Service/-API;
- Standarddeck-Katalog unter `data/decks/`;
- API-/Owner-/Quote-/Visibilitytests.

Checks:

- Account A gegen Account B;
- 50/51-Grenze und konkurrierende Anlage;
- Standard-Unveränderlichkeit;
- Deckpayload-, Replay-, Gegner- und KI-Leaktests;
- Server- und Deck-Typecheck;
- `git diff --check`.

Done-Gate:

- persönliche Decks sind Owner-only, Quote atomar und Match-Snapshots von
  Draftänderung oder Accountlöschung unabhängig.

### P06 – Deckeditor und Matchstart

Eingangsvoraussetzung: P05 committed.

Konkrete Arbeit:

- UI-Kategorien `Standard-Decks` und `Meine Decks`;
- Standard direkt spielen oder als eigenes Deck kopieren;
- persönliche Decks anlegen, umbenennen, bearbeiten, kopieren, löschen,
  importieren und exportieren;
- 50er-Quote verständlich anzeigen;
- Gastmodus nutzt weiterhin lokale Datei-Decks;
- Accountmodus nutzt serverseitige persönliche Decks;
- Matchstart unterstützt Standard-, persönliche und Gast-Lokaldecks über
  denselben validierten Snapshotvertrag.

Kernartefakte:

- `apps/web/features/decks/` und eng begrenzte Startseitenintegration;
- Web-API-Typen und Tests;
- Browser-E2E.

Checks:

- Web-Unit-/Typecheck-/Buildchecks;
- Browser-E2E für Standardkopie, CRUD, Quote und Matchstart;
- Zwei-Account- und Gastregression;
- DOM-/Storage-/Payload-Leakscan;
- `git diff --check`.

Done-Gate:

- die normale UI zeigt keine internen Projekt-/KI-/Testdecks; alle drei
  erlaubten Deckquellen starten nur über validierte Snapshots.

### P07 – Releaseabschluss

Eingangsvoraussetzung: P06 committed.

Konkrete Arbeit:

- Requirements-, Testmatrix-, Implementation- und Final-Review vervollständigen;
- Runbook für Accountbootstrap, Passwortreset, Backup/Restore und Deckquote;
- Wissensbasis, Status und Log aktualisieren;
- alle aktiven Gates und gezielte Browser-/Securitytests ausführen;
- offene Abweichungen ausschließlich dokumentieren, wenn sie außerhalb des
  freigegebenen Scopes liegen und kein Done-Gate verletzen.

Checks:

- paketnahe Tests;
- `corepack pnpm typecheck`;
- `corepack pnpm test:contracts`;
- relevante Server-/Web-/E2E-Suites;
- `corepack pnpm build`;
- `git diff --check`.

Done-Gate:

- alle Must-Anforderungen und Sicherheitsgrenzen sind nachgewiesen; Branch ist
  sauber und bereit zur Main-Integration.

## Verifikationsregeln

- Paketnahe Tests laufen vor breiten Gates.
- Jeder rote Check wird mit exaktem Befehl und Ursache dokumentiert.
- Hidden-Info-, Replay-, StateHash-, stale-action- und illegal-action-Gates
  dürfen durch Accountarbeit nicht abgeschwächt werden.
- Ein Test gilt nur als grün, wenn er regulär mit Exitcode 0 endet.
- `git diff --check` ist Pflicht vor jedem Paketcommit.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_V2_PASSWORD_ACCOUNTS_CLOUD_DECKS`
- Branch: `codex/v2-password-accounts-cloud-decks`
- Integrationsbranch: lokaler `main`
- Pro abgeschlossenem Paket genau ein klarer Paketcommit; notwendige
  eng gekoppelte Fixcommits werden im Paketreview begründet.
- Nur paketzugehörige Dateien werden gestaged.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerauftrag.
- Vor finalem Merge wird aktuelles `main` in den Arbeitsbranch integriert,
  falls es weitergelaufen ist; danach laufen die relevanten finalen Checks
  erneut.
- Merge nach `main` bevorzugt Fast-Forward.
- Danach werden Worktree-Entfernung in Git und Dateisystem verifiziert und der
  vollständig gemergte Branch mit `git branch -d` gelöscht.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess „V2.0 Passwort-Accounts und persönliche
Server-Decks“ vollständig und sequenziell von P01 bis P07 ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die relevanten package-spezifischen
AGENTS.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_V2_PASSWORD_ACCOUNTS_CLOUD_DECKS auf Branch
codex/v2-password-accounts-cloud-decks. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus,
dokumentiere das Ergebnis und committe jedes abgeschlossene Paket. Bei einem
Sicherheitsblocker stoppe und schreibe einen Blocker-Report mit Removal
Condition. Nach P07 integriere aktuelles main, verifiziere final, merge lokal
nach main, prüfe main, entferne den sauberen Worktree, verifiziere seine
Entfernung in Git und Dateisystem und lösche den vollständig gemergten Branch.
Markiere das Goal erst danach als complete.
```

## Abschlusskriterien

- P01 bis P07 sind jeweils dokumentiert, verifiziert und committed.
- Finale Checks sind grün oder ein echter Sicherheitsblocker ist mit Removal
  Condition dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- `main` ist sauber und `git diff --check` ist grün.
- Arbeits-Worktree existiert weder in `git worktree list --porcelain` noch im
  Dateisystem.
- Der vollständig gemergte Arbeitsbranch ist gelöscht.
- Erst dann wird das `/Goal` als abgeschlossen markiert.
