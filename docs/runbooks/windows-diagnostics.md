# Windows-Diagnosepakete

Der installierte Launcher erzeugt ein Diagnosepaket ausschließlich über
„Diagnosepaket erstellen …“ im Tray. Es wird lokal an einem vom Nutzer
gewählten Ziel gespeichert und niemals automatisch hochgeladen.

Enthalten sind:

- Produktversion, Betriebssystem, Architektur, UI-Sprache und Erstellzeit;
- die Runtimekonfiguration mit redigierten Secret-, Token-, Passwort-, Auth-
  und Sessionwerten;
- ausschließlich bekannte `launcher-*.log*`- und `updater-*.log*`-Dateien,
  begrenzt auf das letzte Megabyte und erneut redigiert.

Ausgeschlossen sind Datenbanken, gespeicherte Partien, Replays,
Maintenance-Credentials, Passwörter, Tokens, private Kartenbilder und andere
Dateien aus dem Datenroot. Reparse-Point-Logs werden nicht verfolgt.

Der Launcher-Smoke legt absichtlich ein Tokensalz in Konfiguration und Log,
eine SQLite-Datei und ein privates Kartenbild an. Das Gate akzeptiert das ZIP
nur, wenn kein Secret und keine ausgeschlossene Datei enthalten ist und die
Redaktionsmarkierung nachweisbar vorkommt.
