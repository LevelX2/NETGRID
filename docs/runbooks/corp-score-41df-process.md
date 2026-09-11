# Corp-Scoring aus Match 41df

Status: aktiv, P5. Quelle: Nutzerauftrag vom 11.09.2026 und Maintenance-Audit
von `match_41df30053a8efe3e` (D19, D89, D91, D127, D172, D176, D210).

## Ziel und Grenzen

Die Corp baut einen tatsächlich schützenden Scoring-Server auf, erhält seine
Finanzierung und setzt exponierte Agendas kohärent fort. Öffentlich vorbereitete
Runner-Antworten und erreichbare Run-Budgets beeinflussen die Schutzbewertung.
Notfall-Scoring vergleicht konkrete Risiken statt bloß ICE-Mengen.

Scope ist präzise genug zur direkten Umsetzung. Historische Diagnosen werden
gegen den aktuellen Code geprüft; aktuelle Verbesserungen werden erhalten.
Keine garantierte alternative Matchgewinnquote wird behauptet. Keine
Deckänderungen, neuen Planowner, globalen Kartenheuristiken, Fallbacks,
DB-Zugriffe, Serverstarts, Pushes oder PRs.

## Controller und Arbeitsraum

Goal: P0–P5 sequenziell abschließen, Paketcommits erstellen, lokal nach main
integrieren und eigenen Worktree sowie Branch geprüft entfernen.
Worktree: `C:/Projekte/NETGRID_corp_score_41df`.
Branch: `codex/corp-score-41df`; Basis: `490817184`.
Genau ein Paket aktiv. Übergänge: offen → aktiv → geprüft → committed.
Fehler werden am erzeugenden Owner korrigiert. Fachliche externe Blocker erhalten
konkrete Removal Condition; normale Testfehler werden unmittelbar bearbeitet.
Fremde Arbeit und laufende Hauptinstanz bleiben unberührt.

## Paketfolge und Abnahme

| Paket | Ziel / Arbeit | Owner und Kernartefakte | Done-Gate / Commit |
| --- | --- | --- | --- |
| P0 | Historische actor-sichere API-Fixtures sichern, aktuellen Fehlerpfad reproduzieren | bestehender Replay-Vertrag, gezielter 41df-Test | Capture-Bindungen und erwartete rote Regressionen dokumentiert; `test(ai): capture corp scoring regressions from match 41df` |
| P1 | Nutzlosen Central-Ausbau unter Agenda-Handdruck verhindern und Scorefinanzierung erhalten | Defense-Allokation, typisierte Scorebedarfe | D19/D127/D172 oder eng gebundene Ursachenproben, echte Central-Gefahr weiter zulässig; `fix(ai): preserve scoring resources during defense allocation` |
| P2 | Wirksamen Remote-Schutz gezielt vorbereiten, Funding und benötigte ICE am Parent halten | Defense-Support, Scoring-Remote | Stopper vor bloßem Tax-Aufbau, finanzierbare Fortsetzung und Gegenfall ohne Stopper; `fix(ai): develop effective protection for scoring remotes` |
| P3 | Ausführbare Fortsetzung installierter Agenda vor konkurrierender Vorbereitung erhalten | Score-Owner, gebundene Zugplanung | D91 Advance mit unverändertem Parent/Executor, berechtigte Notfallpräemption bleibt möglich; `fix(ai): retain installed agenda continuation` |
| P4 | Öffentliche Breaker-Vorbereitung samt Hosting und Runner-Aktionsbudget berücksichtigen | Engine-Quote falls nötig, Defense-Schutzprojektion | D89 bzw. exakte Hosting-/Budget-Gegenproben, kein Hidden-Info-Zugriff; `fix(ai): account for visible runner preparation in score defense` |
| P5 | Notfall-Scoreziele nach echter Zugriffschance vergleichen, Verträge pflegen und integrieren | Score-Risiko, Zuglinienbewertung, aktuelle Corp-Verträge | D176/D210 oder Ursachenproben, keine sichere Linie erfunden; `fix(ai): compare emergency score routes by survival risk` |

Je Paket nur direkte Regression und eng angrenzende Tests. Typ-/Strukturgates
nur bei betroffenen Oberflächen. Kein automatischer vollständiger Shard-, Build-
oder E2E-Lauf. `git diff --check` und explizites Staging vor jedem Paketcommit.
Nach allen Paketen Main-Abgleich, relevante Konfliktchecks, lokaler Merge,
Main-Prüfung und verifiziertes Worktree-/Branch-Cleanup. Dieses Prozessartefakt
wird am Abschluss zugunsten aktueller Fachverträge entfernt; Git hält Evidence.

## Fortschritt

- P0 aktiv: Worktree isoliert, Abhängigkeiten offline installiert; vorhandene
  Maintenance-Captures werden ohne erneute Detailabfragen wiederverwendet.

- P0 geprüft: sieben unveränderte API-Replay-Fixtures mit neun positiven
  Bindungsprüfungen, 14 fokussierte Tests grün. Aktueller Chooser reproduziert
  D19/D89/D127/D172/D176/D210; D91 wählt nach Runtime-Restore bereits Advance.
  P3 prüft deshalb zusätzlich die unverändert fortgesetzte Commitment-Bindung.
  P1 aktiv: Central-Konversion trotz `no_progress` und leerer Scorereserve.

- P1 geprüft: drei historische Regressionen zuerst rot, danach 25 Tests grün
  (41df + Defense-Domain). D19/D127 erhalten Finanzierung; D172 verbaut
  keinen sechsten HQ-Layer. Änderung am bestehenden Defense-Owner, keine neue
  Prioritätsklasse. P2 aktiv: Score-Schutzaufbau und fehlender Stopper.

- P2 geprüft: D13 zuerst rot, danach 33 direkte/angrenzende Tests und der
  Live-Gegenfall mit produktivem zusätzlichem ICE grün. Eine weitere reine
  Abschreckungsschicht verdrängt keine zertifizierte Stopper-Finanzierung.
  P3 aktiv: historische Runtime-Bindung ohne Neustart prüfen.

- P3 geprüft: 27 Tests grün. D91 setzt die installierte Agenda sowohl mit
  unverändert restauriertem Live-Commitment als auch nach Neustart fort.
  Dafür ist im aktuellen Code kein zusätzlicher Verhaltenspatch nötig; die
  historische Regression schützt beide Betriebsarten. P4 aktiv.

- P4 geprüft: 107 AI-Tests und 32 Engine-Tests grün; AI-/Engine-Typechecks,
  Struktur-, Reachability-, Hint- und Card-ID-Gates erfolgreich. Freie öffentliche
  Hosts samt Stärkeänderung und Engine-Basisklickhorizont fließen in Scorebedarf
  und Reifeprüfung ein. Zusätzlich kombinierte ETR-Subroutinen an Breakerkosten
  durchgereicht. D89-Gegenprobe mit explizitem Dreiklick-Horizont verwirft den
  erreichbaren Agenda-Remote. Keine Änderung der historischen Capture-Datei.
  P5 aktiv: Notfallvergleich und Integration.
