---
activityId: act-2026-07-27-account-matchstart-preferences
status: done
kind: concept
area: web
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-27
startedAt: 2026-07-27
completedAt: 2026-07-27
branch: codex/activities-worktree-20260727-205225
releaseTarget: V2.x account follow-up
blockedBy: []
resultArtifacts:
  - apps/server/src/account-match-start-preferences.ts
  - apps/server/src/account-match-start-preferences-http.test.ts
  - apps/web/features/account/account-match-start-preferences-client.ts
  - apps/web/features/match-start/account-match-start-preferences.ts
  - docs/reviews/account-matchstart-preferences-final-review-2026-07-27.md
checks:
  - pnpm --filter @netgrid/server typecheck (grün)
  - pnpm --filter @netgrid/web typecheck (grün)
  - fokussierte Server- und bestehende Account-HTTP-/Session-Regressionen (12 grün)
  - fokussierte Web-Client-/Vorbelegungs-/Local-Storage-Regressionen (6 grün)
  - vollständige Websuite (715 grün)
  - vollständige Serversuite (213/214 grün; ein unveränderter SQLite-OPTIMIZE-Bestandstest auch auf main rot)
  - git diff --check (grün)
---

# Accountgebundene Matchstart-Vorbelegungen

## Ziel

Angemeldete Nutzer sollen beim Öffnen des Spielstarts ihre zuletzt verwendete,
noch gültige Konfiguration als private Vorbelegung erhalten – auch auf einem
anderen Gerät. Der Gastmodus behält die vorhandene browserlokale Speicherung.

## Kontext und Quellen

- Nutzeranforderung vom 2026-07-27: Die beim Anlegen eines neuen Spiels
  gewählten Einstellungen sollen nach der Anmeldung im Benutzerprofil erhalten
  bleiben und beim nächsten Spielstart vorbelegt werden.
- `apps/web/app/match-start-storage.ts` speichert Matchstart-Einstellungen
  bereits versionsgeprüft im Local Storage, aber nur pro Browser und Gerät.
- `apps/web/app/page.tsx` lädt und schreibt diese lokale Vorbelegung.
- Die geschlossene Account-Alpha besitzt bereits authentifizierte,
  accountgebundene Serverdaten und persönliche Decks; Accountdaten bleiben
  außerhalb von Engine, PlayerView, Replay, StateHash und KI.
- `docs/releases/v2/v2-0-auth-privacy-cloud-decks/password-accounts-cloud-decks-final-review-2026-07-18.md`

## Scope

- Einen kleinen, versionierten und serverseitig validierten Account-Vertrag für
  private Matchstart-Präferenzen definieren und persistieren.
- Nach erfolgreicher Sessionwiederherstellung die letzte gültige
  Account-Konfiguration in den Spielstart laden; die Account-Vorbelegung ist
  bei angemeldeten Nutzern geräteübergreifend führend.
- Änderungen an den erlaubten Matchstart-Optionen als letzte persönliche
  Vorbelegung speichern: Spielmodus, eigene Seite, Matchformat und
  Serienlänge, Kartenpool, KI-Schwierigkeit und -Deckstrategie sowie
  Spielerzeit-/Countdown-Optionen.
- Gespeicherte Deckauswahlen nur dann übernehmen, wenn sie für den Account
  sichtbar, dem Account zugeordnet oder ein aktuelles Standarddeck sind; bei
  gelöschten oder im aktuellen Format ungültigen Decks sicher auf die normale
  Auswahl zurückfallen und einen verständlichen Hinweis anzeigen.
- Eine explizite Aktion anbieten, mit der Nutzer ihre gespeicherten
  Matchstart-Vorbelegungen auf Produktstandards zurücksetzen können.
- Account-Export, Accountlöschung, Backup/Restore und die relevanten
  Auth-/CSRF-/Owner-Tests um das neue private Präferenzdatum ergänzen.

## Nicht im Scope

- Keine Persistenz von Match-, Lobby- oder Spielsitzungszuständen und keine
  Wiederaufnahme einer Partie.
- Keine Speicherung von Tokens, Seeds, Einladungslinks, Gegnerdaten,
  gegnerischen Decks, Teilnehmer-B-Deckauswahl oder Debug-/Trace-Optionen.
- Keine öffentlichen Profile, Freundeslisten, Matchmaking- oder
  Cloud-Synchronisierung für Gäste.
- Keine Änderung an Rules Engine, LegalActions, `applyAction`, PlayerViews,
  Replay, StateHash oder KI-Inputs.
- Keine automatische Übernahme alter browserlokaler Einstellungen in ein
  Accountprofil ohne ausdrückliche, später zu entscheidende Nutzeraktion.

## Akzeptanzkriterien

- [ ] Ein angemeldeter Nutzer erhält nach erneuter Anmeldung oder auf einem
      zweiten Gerät die zuletzt gespeicherten, gültigen Matchstart-Vorbelegungen.
- [ ] Die gespeicherten Werte werden serverseitig auf eine explizite
      Allowlist, Typen und zulässige Werte geprüft; unbekannte oder ungültige
      Felder verändern keine Vorbelegung.
- [ ] Account A kann Präferenzen von Account B weder lesen noch ändern;
      schreibende Requests folgen dem bestehenden Session-, CSRF- und
      Origin-Vertrag.
- [ ] Ungültig gewordene Deck- oder Formatreferenzen blockieren keinen
      Matchstart, werden nicht still an einen neuen Deckwert umgebogen und fallen
      nachvollziehbar auf die reguläre Auswahl zurück.
- [ ] Der Gastmodus nutzt weiterhin ausschließlich die bestehende lokale
      Speicherung und wird durch An- oder Abmeldung nicht mit fremden
      Accountwerten vermischt.
- [ ] Export, Löschung, Backup und Wiederherstellung behandeln die
      Präferenzdaten konsistent.
- [ ] Es gibt Server-, Client- und Regressionstests für Laden, Speichern,
      Zurücksetzen, Mehrgerätefall, Owner-Grenze und die ausgeschlossenen
      sensitiven Felder.
- [ ] Kein Account-Präferenzwert gelangt in Match-, WebSocket-, Lobby-,
      Gegner-, PlayerView-, Replay-, StateHash- oder KI-Payloads.

## Umsetzungshinweise

- Primärer Folgeagent: `release-implementation-agent`.
- Den vorhandenen Schema- und HTTP-Vertrag der Account-Alpha erweitern,
  statt eine zweite lokale Accountdatenbank oder einen clientseitigen
  Pseudo-Login einzuführen.
- Das bereits vorhandene versionsgeprüfte Modell in
  `apps/web/app/match-start-storage.ts` kann als UI-nahe Ausgangsform dienen;
  serverseitig ist ein eigener, schlanker und bewusst allowlist-basierter
  DTO-Vertrag vorzuziehen.
- Die Servervorbelegung erst anwenden, wenn die Account-Sitzung eindeutig
  feststeht, damit kein sichtbares Umschalten zwischen Gast- und
  Accountwerten zu einer unbeabsichtigten Speicherung führt.
- Für parallele Geräte genügt für diese Komforteinstellung ein klar
  dokumentiertes „zuletzt gespeichert gewinnt“; es ist keine
  Matchkonfliktauflösung.
- Bei Bedarf nach dem kleinen Schnitt separate Folge-Activities für weitere
  Profileinstellungen anlegen; keine allgemeine Einstellungs-Cloud in dieses
  Paket ziehen.

## Ergebnisnotiz

Erledigt. Der neue private, versionierte Accountdatensatz speichert nur
Allowlist-geprüfte Matchstart-Vorbelegungen und primäre, servervalidierte
Deckreferenzen. Session, CSRF, Origin, Owner-Grenze, zweiter Geräte-Login,
Fallback ungültiger Decks, Reset, Export, Accountlöschung und SQLite-
Backup/Restore sind abgedeckt. Gast-Local-Storage bleibt getrennt und wird bei
Abmeldung wiederhergestellt; Match-, Lobby-, PlayerView-, Replay-, StateHash-
und KI-Verträge bleiben unverändert. Die vollständige Serversuite enthält
einen unveränderten, auf `main` reproduzierten SQLite-OPTIMIZE-Bestandstest;
alle betroffenen und neuen Accountprüfungen sind grün.
