# Accountgebundener Rejoin öffentlicher Spiele – Final Review (2026-07-27)

## Ergebnis

Bestanden. Die öffentliche Spieleliste lädt auch dann, wenn eine lokale,
nicht wiederverbindbare Session vorhanden ist. Ein angemeldeter Spieler kann
ein eigenes aktives öffentliches Spiel über die Liste fortsetzen, ohne einen
vorhandenen Browser- oder Maintenance-Token vorzulegen.

## Sicherheitsvertrag

- Die öffentliche Liste bleibt unverändert öffentlich und neutral: Sie
  enthält keine Account-ID, Besitzmarkierung, Slot-, Seiten- oder Token-Daten.
- Der angemeldete Client fragt separat und nur mit Account-Cookie die IDs
  eigener aktiver öffentlicher Spiele ab. Die Antwort ist `no-store` und
  enthält ausschließlich bereits öffentliche Match-IDs.
- Der Mutationsendpunkt verlangt Account-Session, zulässige Origin und
  sessiongebundenes CSRF-Token. Er bestimmt Binding, Slot und Seite vollständig
  serverseitig aus `account_match_participants` und dem Matchrecord.
- Ein Rejoin rotiert die Session- und Reconnect-Credentials genau für den
  gebundenen Slot, widerruft die alten Hashes und erzeugt nur dessen
  side-gefilterte Payload. Account-Cookies werden damit nicht zu einer
  allgemeinen Match-Aktionsberechtigung.
- Fremde Accounts, nicht öffentliche oder terminale Matches liefern dieselbe
  neutrale Nichtverfügbar-Antwort. Die UI-Berechtigung ist nur Komfort; der
  Server autorisiert jede Ausführung erneut.

## Abnahmebelege

- Server-HTTP-Test: Account-Auth, CSRF, Fremdaccount, eigene/terminale
  Capability-Liste und Credential-Rotation.
- Webtests: Recovery-Listen-Trigger, Capability-Modell und Account-Client.
- Shared-, Server- und Web-Typecheck sowie `git diff --check` bestanden.
- Der projektweite Typecheck ist grün. Der projektweite Testlauf bleibt wegen
  31 bestehender KI-Plan-Testfehler in `packages/ai` rot; ein repräsentativer
  Fehler (`known-ice-run-risk.test.ts`, 7 Fehler) reproduziert sich unverändert
  auf `main`. Das Rejoin-Paket verändert keinen KI-Pfad.

Führender Prozess: `docs/architecture/public-games-rejoin-recovery-process-2026-07-27.md`.
