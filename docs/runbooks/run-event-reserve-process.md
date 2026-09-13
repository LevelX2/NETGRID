# Run-Event-Handreserve und Massenziehprüfung

Status: Beide Pakete abgenommen; lokale Integration und Cleanup folgen. Quelle:
Nutzerauftrag zu `match_cd4828fc5a7c0c7f`.

## Ziel und Grenzen

Run-Events verwenden bei der Zulassung die Ressourcen nach ihren Startkosten.
Massenziehen bei voller Hand wird am vorhandenen Entwicklungs-Owner geprüft;
nur belegter generischer Korrekturbedarf wird umgesetzt. Kein Deckumbau,
keine Änderung der Engine-Legalität, kein Abschwächen der Run-Abbruchsicherheit.
Die Vorgabe ist ausreichend bestimmt; ein unsicherer Draw-Nutzen wird als
Prüfergebnis dokumentiert, nicht als automatischer Verhaltenspatch behandelt.

## Steuerung

Genau ein Paket ist aktiv: vorbereitet → aktiv → geprüft → committed.
Bei Fehlern denselben Pfad eng untersuchen; fremde Änderungen erhalten.
Fehlende fachliche Fakten bleiben sichtbar und fail-closed. Nur ein echter
Sicherheitsblocker unterbricht die Umsetzung; Ursache und Removal Condition
werden dann hier festgehalten. Keine parallelen Agenten.

Worktree: `C:/Projekte/NETGRID_run_event_reserve`.
Branch: `codex/run-event-reserve`; Integrationsbranch: lokales `main`.
Der Hauptcheckout enthält fremde Web-/Engine-/UI-Dokumentationsänderungen.
Sie sind außerhalb dieses Prozesses und werden weder gestaged noch ersetzt.
Kein Serverbetrieb, keine Datenbankzugriffe, keine Remote-Integration.

## Paket 1: Ressourcen nach Run-Startkosten

- Eingang: gespeicherte Analyse D55/D56, AI-Preflight, isolierter Worktree.
- Owner: `runner.pressure_central` / `runner.contest_remote`; gemeinsame
  Runquote produziert Fakten, `runner.convert_run_window` revalidiert.
- Arbeit: Quelle des falschen Handpuffers korrigieren, vorhandene Credit-/
  Startkostenprojektion prüfen, keine zweite Entscheidungsautorität.
- Artefakte: Runbewertung, fokussierte Runtime-/Quotentests, Runner-Vertrag.
- Done: Originalfehler und ausreichender Puffer als Gegenfall geprüft;
  aktuelle Actions, Plan/Step/Route und sichere Fortsetzung nachgewiesen;
  `git diff --check` grün.
- Commit: `fix(ai): quote run reserves after entry card costs`.

Ergebnis: Gemeinsame Routen- und Reservequote konsumieren die bereits
vorhandene Handprojektion nach Runstart. Vier neue Engine-basierte Prüfungen
grün, inklusive exakter Plan-/Step-/Actionbindung und Replay/StateHash.
Gegenlauf ohne Patch: zwei der vier Tests reproduzieren falschen Handpuffer
und Jack-out. Mit Patch insgesamt 111/115 angrenzende Tests grün. Dieselben
vier übrigen Fehler sind unverändert auf Basis `dc2d478c1` reproduziert:
Matchpoint-Universal-Fixture ohne vollständige Rig-Kosten sowie drei
Encounter-Fixtures mit unvollständigen Continue-Subroutine-Bindungen.
Kein Typ-, Hint- oder Strukturvertrag erweitert; deshalb keine Vollshards
oder pauschalen Paket-Typechecks. Die öffentliche Ownerkarte bleibt gültig.

## Paket 2: Massenziehen am Zugende

- Eingang: Paket 1 committed; D29 mit acht Karten, einem Klick, Draw fünf.
- Owner: `runner.develop_board_and_hand`; konkrete Antwortsuche bleibt bei
  ihrem bereits bestehenden Coverage-/Remote-Owner.
- Arbeit: Draw-Nutzen, Kosten, Kapazität und Abwürfe verfolgen. Einen
  belegten Mangel generisch beheben, ansonsten begründete Nichtänderung.
- Artefakte: bestehender Handentwicklungs-Pfad, direkte Tests, Runner-Vertrag.
- Done: voller-Hand-/letzter-Klick-Fall und produktiver Gegenfall geprüft;
  keine pauschale Draw-Sperre, fokussierte Checks und Diffprüfung grün.
- Commit: `fix(ai): require useful hand development for excess draw`
  beziehungsweise bei unverändertem Verhalten `test(ai): verify excess draw purpose`.

Ergebnis: Der zusätzliche allgemeine Kartenentwicklungsplan umging die
bestehende Draw-Kapazitätsprüfung. Sein Bedarf verwendet jetzt die gequotete
Netto-Handbilanz; gebundene Coverage-/Defense-Antworten bleiben eigenständig.
45 direkte Tests grün. Historische D26/D29-Captures über die read-only
Maintenance-API jeweils einmal geladen; alle Input-/Hash-/Side-Safety-
Validierungen grün. D29 lehnt den zweiten Draw ab, D26 behält die konkrete
Antwortsuche trotz Überlauf. Ohne Patch reproduziert D29 den alten Fehler.
Keine zusätzlichen Typ-/Hint-/Strukturverträge und kein Deckumbau.

## Abschluss

Paketweise nur direkt betroffene Tests; Typecheck bei Typoberflächenänderung,
Strukturgates bei Strukturänderung. Keine vorsorglichen Vollshards.
Ergebnisse pro Paket ergänzen und getrennt committen. Aktuelles `main`
defensiv einbinden, betroffene Checks prüfen und lokal integrieren.
Aktuelle Erkenntnisse in den Runner-Vertrag überführen; dieses dann rein
historische Prozessartefakt entfernen. Sauberen Worktree und gemergten Branch
entfernen und Git-/Dateisystemzustand prüfen. Goal erst danach abschließen.

Goal-Kern: Beide Pakete sequenziell im genannten Worktree vollständig
abarbeiten, fokussiert verifizieren, separat committen, lokal nach `main`
integrieren und Cleanup verifizieren; ohne Zwischenfragen fortsetzen,
solange keine entscheidungsrelevante externe Lücke besteht.
