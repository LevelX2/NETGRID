# Corp-Agenda-, Defense- und Discard-Remediation

Status: aktiv

Quelle: laufendes Match `match_5f7924e4893ba855`, StateVersion 65,
33 von 33 Corp-KI-Entscheidungen geprüft.

## Gesamtziel

/Goal Arbeite die Remediation der im Match reproduzierten Corp-KI-Fehler
vollständig und sequenziell ab. Sichere die historischen Situationen zuerst
als rote Decision-Checkpoints, ermögliche gebundene Agenda-plus-ICE-Zuglinien
ausschließlich über Score- und Defense-Pläne, korrigiere die generische
Cleanup-Abwurfentscheidung und die nachgewiesene Marked-Accounts-Semantik,
verifiziere fokussiert und breit und merge den abgeschlossenen Arbeitsbranch
lokal nach `main`.

Arbeitsbranch: `codex/ai-agenda-defense-discard`

Worktree: `C:\Projekte\NETGRID_AI_AGENDA_DEFENSE_DISCARD`

## Ausgangslage

- Der Eröffnungszug installierte Data Wall vor HQ und Banpei vor R&D und war
  fachlich plausibel.
- `corp.score_agenda`, `corp.remote_scoring` und `corp.rush_score` erkannten
  Marked Accounts und Netwatch Operations Office.
- Der produktive Chooser verwarf Agenda-Installationen mit
  `corp_score_protection_required:new_remote`.
- Derselbe Chooser verwarf alle ICE-Installationen auf dem leeren Remote mit
  `corp_ice_install_has_no_engine_certified_access_probability_reduction`.
- Dadurch erreichten weder `Agenda -> ICE` noch `ICE -> Agenda` die
  Zugvariantenprüfung. In Zug 7 und Zug 9 waren Agenda, mehrere ICE, Aktionen
  und ausreichende Rez-Reserve gleichzeitig sichtbar.
- Die Cleanup-Heuristik verwarf Marked Accounts und behielt drei Jack Attacks.
  Das Planinventar bezeichnete diese drei ICE unmittelbar vorher als
  `redundant`.
- Marked Accounts löst laut Engine bei Access aus installiertem Remote, HQ
  oder R&D aus, nicht aus Archives. Der aktive Hint führt den Effekt
  widersprüchlich als `scored_activated`.

## Annahmen

- Ein gebundener Score-Plan darf einen Defense-Child für genau den geplanten
  Scoring-Remote anfordern.
- Der Defense-Plan darf ein ICE als zukünftige Schutzressource installieren,
  wenn die Restzuglinie dessen gebundenes Schutzziel im selben Zug
  materialisiert.
- Ein bezahlbar rezzbares ICE ist stärker als ein reiner Bluff. Ein noch nicht
  sofort rezzbares ICE darf nur dosiert als Zukunftsschutz oder Bluff
  berücksichtigt werden und bleibt Defense-Plan-Verantwortung.
- Jack Attack ist nicht pauschal schlecht: Ein Exemplar kann ein erstes ICE am
  Scoring-Remote oder eine zusätzliche Schicht vor HQ/R&D sein. Mehrere
  Handdubletten dürfen aber nicht jeweils den vollen Tag-Enabler-Wert erhalten.
- Agendas werden nicht absolut gegen jeden Abwurf gesperrt. Eine Agenda mit
  erreichbarem Score-/Access-Punish-Plan darf jedoch nicht gegenüber mehreren
  redundant nutzbaren ICE-Dubletten verlieren.

## Nicht-Ziele

- Keine Karten-ID-Sonderentscheidung im produktiven Chooser.
- Keine Defense-Sonderlocke außerhalb des Defense-Plans.
- Keine Nutzung verdeckter Runner-Informationen.
- Keine Änderung der Rules Engine oder LegalActions ohne nachgewiesene Lücke.
- Keine Behebung der im Deck-Audit zusätzlich gemeldeten, für dieses Verhalten
  nicht ursächlichen Corporate-Coup- und Dr.-Dreff-Vertragsfindings.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Rules Engine und LegalActions bleiben alleinige Regel- und Aktionsautorität.
- Genau ein Paket ist aktiv.
- Historische Zielerwartungen werden nach dem roten Nachweis nicht
  abgeschwächt.
- Draw- oder Zufallsgrenzen führen zur Neuplanung.
- Deterministische, gebundene Phasen bleiben innerhalb ihrer gültigen
  Commitment-Linie.
- Main-Server, Standardports und Runtime-SQLite werden aus dem Worktree nicht
  gestartet, gestoppt oder verändert.

## Paketfolge

### Paket A1: Preflight und Prozessvertrag

Ziel: Worktree, Branch, Scope, Invarianten und Abnahme festschreiben.

Done-Gate:

- Hauptworkspace war sauber.
- Worktree und Branch sind eindeutig.
- Dieses Prozessartefakt ist versioniert.
- `git diff --check` ist grün.

Commit: `docs(ai): define agenda defense discard remediation`

### Paket A2: Rote Match-Evidence

Ziel: Zug 7, Zug 9 und den Marked-Accounts-Abwurf spielgleich capturen.

Arbeit:

- Checkpoint für Zug 7 nach Efficiency Experts: Agenda-plus-ICE muss als
  zulässige positive Restzuglinie gegenüber Draw/Credit erscheinen.
- Checkpoint für Zug 9: Agenda-plus-ICE beziehungsweise ICE-plus-Agenda muss
  gegenüber wiederholtem neutralem Credit bevorzugt werden.
- Checkpoint für Cleanup: Eine der drei Jack-Attack-Instanzen ist vor Marked
  Accounts abzuwerfen.
- Enge Gegenproben für zu geringe Credits, fehlende Agenda, fehlendes ICE und
  nicht redundante Schutzressourcen.

Done-Gate:

- Captures besitzen `warmupDriftCount = 0`.
- Rote Zieltests melden ausschließlich `behavior_regression`.
- Gegenproben sind bereits grün.
- Evidence ist separat committed.

Commit: `test(ai): capture agenda defense discard regressions`

### Paket A3: Gebundene Agenda-plus-ICE-Zuglinien

Ziel: Der TurnPlanner kann einen zukünftigen Scoring-Remote als gebundenes
Defense-Ziel bewerten und mindestens die Reihenfolgen `Agenda -> ICE` und
`ICE -> Agenda` vergleichen.

Arbeit:

- Prospektive Schutzwirkung nur für einen exakten Score-Parent und Server
  zulassen.
- Rez-Reserve und ICE-Qualität nach Defense-Plan-Vertrag bewerten.
- Erstes Remote-ICE sowie zusätzliche sinnvolle zentrale ICE-Schichten
  ermöglichen.
- Unbezahlbare oder zielungebundene Remote-ICE-Bluffs nicht pauschal
  bevorzugen.
- Debug-Evidence für Parent, Need, Ziel und Rez-/Bluff-Status ergänzen.

Done-Gate:

- Zug-7- und Zug-9-Checkpoint grün.
- Gegenproben grün.
- Fokussierte TurnPlanner-/Defense-Tests grün.

Commit: `fix(ai): plan bound agenda defense turn lines`

### Paket A4: Cleanup- und Keep-Score-Korrektur

Ziel: Cleanup konsumiert relevante Handdispositionen, Access-Punish-Wert und
abnehmenden Dublettenwert.

Arbeit:

- Planrelevante Retention generisch an Cleanup weitergeben.
- Tag-Enabler-Bonus für zusätzliche identische ICE begrenzen.
- Erreichbare Agenda-Score- und Access-Punish-Rollen einbeziehen.
- Jack Attack als nutzbares erstes Remote-ICE oder zentrale Zusatzschicht
  erhalten, aber nicht drei Exemplare gleich hoch bewerten.
- Marked Accounts nicht gegenüber drei redundant nutzbaren Jack Attacks
  abwerfen.

Done-Gate:

- Cleanup-Checkpoint und Gegenproben grün.
- Bestehende Runner-/Corp-Discard-Tests grün.

Commit: `fix(ai): align corp cleanup with plan retention`

### Paket A5: Marked-Accounts-Hint und Consumer-Vertrag

Ziel: Aktiver und kompilierter Hint bilden den Access-Vertrag außerhalb
Archives korrekt ab.

Done-Gate:

- Hint-, Compiler- und Kartenconsumer-Gates grün.
- Deck-Audit enthält kein neues Marked-Accounts-Finding.
- Nicht ursächliche bestehende Findings bleiben sichtbar dokumentiert.

Commit: `fix(ai): align marked accounts access semantics`

### Paket A6: Breite Verifikation und Abschlussdokumentation

Ziel: Match-Checkpoints, Gegenproben, AI-Typecheck, drei AI-Shards,
Deck-Consumer-Audit und relevante Baseline-/Strukturgates verifizieren.

Done-Gate:

- Alle bearbeiteten Checkpoints grün.
- `corepack pnpm --filter @netgrid/ai typecheck` grün.
- Relevante AI-Shards und Gates grün.
- `git diff --check` grün.
- Evidence-, Final-Review- und Wissenslog aktualisiert.

Commit: `docs(ai): finalize agenda defense discard remediation`

### Paket A7: Lokale Integration und Cleanup

Ziel: Arbeitsbranch lokal nach `main` integrieren und Worktree sowie Branch
verifiziert entfernen.

Done-Gate:

- Arbeitsbranch sauber und vollständig committed.
- Aktuelles `main` ist integriert und relevante Checks bleiben grün.
- Merge nach `main` erfolgreich.
- Worktree fehlt in Git-Liste und Dateisystem.
- Gemergter Branch ist mit `git branch -d` entfernt.

## Automatische Fehlerbehandlung

- Testfehler werden ausschließlich im aktiven Paket eingegrenzt.
- Infrastrukturdrift eines Checkpoints ist kein roter Verhaltensnachweis.
- Ein auf aktuellem Code bereits grüner historischer Fall wird nicht
  nachträglich verschärft, sondern als nicht reproduzierbar dokumentiert.
- Bei Konflikten mit neuem `main` werden beide fachlichen Intentionen geprüft.

## Sicherheitsblocker

Ohne Workaround stoppen bei Hidden-Info-Abhängigkeit, fehlender LegalAction,
Engine-Regelregression, nicht kollisionsfreiem Main-Merge oder nicht sauberem
Worktree vor dem Entfernen.

## Abschlusskriterien

Der Prozess ist erst abgeschlossen, wenn die drei Match-Regressionen und ihre
Gegenproben grün sind, die Lösung generisch innerhalb der Planmodule bleibt,
die breite Verifikation besteht, `main` den Stand enthält und Worktree sowie
Arbeitsbranch verifiziert entfernt wurden.
