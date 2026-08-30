# Agenda-Zugriff und Stehl-Ergebnis in einem Kartenfenster

## Status

Technisch abgeschlossen und zur lokalen Integration freigegeben am 12. Juli 2026.

## Quelle und Vorgabe

Ein aktueller Playtest zeigte bei einem erfolgreichen Run auf R&D zwei direkt
aufeinanderfolgende Präsentationen für dieselbe Agenda:

1. ein textliches Zugriffsfenster mit dem Namen der Agenda, aber ohne Kartenbild;
2. danach ein Kartenfenster mit der aufgedeckten Agenda.

Der bestehende Prozess
`docs/architecture/ui/rd-access-presentation-sequencing-process-2026-07-11.md`
definiert bereits eine einzige kontrollierte Access-Sequenz. Dieser Prozess ist
eine enge Regressionserweiterung dieses Vertrags.

## Zielprüfung

Die Vorgabe ist ausreichend präzise. Der gewünschte Endzustand betrifft nur die
Web-Präsentation: Ein öffentlicher Agenda-Zugriff und sein Stehl-Ergebnis werden
für dieselbe Karte in genau einem Access-Kartenfenster dargestellt.

## Gesamtziel

Bei einem normalen Agenda-Zugriff zeigt NETGRID genau ein Fenster mit Kartenbild,
Zugriffskontext und Ergebnisstatus. Die Rules Engine behält die getrennten
Schritte `access_card` und `steal_agenda`. Zusatzkosten, Access-Ersetzungen,
Choices, Damage und Multiaccess bleiben als fachlich unterscheidbare Stadien
derselben Access-Präsentation erhalten.

## Annahmen

- Der beobachtete erste Dialog ist eine allgemeine Action-Cue-/Run-Präsentation,
  die nicht rechtzeitig von der konkreteren öffentlichen Access-Präsentation
  übernommen oder ersetzt wird.
- Öffentliche `access_card`-Events mit `cardDefinitionId` und `title` dürfen die
  Karte aus Event- und Katalogdaten darstellen.
- Der Fix muss für R&D, HQ, Archive und Remotes generisch bleiben.
- Der separate Inbox-Fund zum gewinnenden Agenda-Steal und Ergebnisfenster
  bleibt außerhalb dieses Prozesses; dieser Prozess darf ihn nicht verschlechtern.

## Nicht-Ziele

- Keine Änderung an Run-, Access-, Stehl-, Kosten- oder Gewinnregeln.
- Keine automatische Zusammenfassung redigierter Zugriffe mit erratener Karte.
- Kein Redesign allgemeiner Action-Cues oder aller Ereignisfenster.
- Keine Engine-, Server-, Replay-, StateHash- oder KI-Änderung.
- Keine Bearbeitung des fremden Worktrees
  `codex/activities-worktree-20260711-access-outcomes`.

## Controller-Invarianten

1. Die UI bleibt reine Präsentationsschicht und nutzt nur PlayerView,
   LegalActions und öffentliche beziehungsweise side-gefilterte Events.
2. Eine öffentliche Access-Präsentation besitzt den Run-/Access-Hinweis und das
   nachgelagerte Stehl-Ergebnis derselben Karte.
3. Für dieselbe Access-Sequenz ist höchstens ein Overlay gleichzeitig sichtbar.
4. Das Kartenbild bleibt vom Zugriff bis zur Ergebnisbestätigung sichtbar.
5. Zusatzkosten oder Ersetzungen werden nicht durch eine Erfolgsmeldung
   übersprungen.
6. Redigierte HQ-/R&D-Zugriffe bleiben ohne Kartenidentität.
7. Multiaccess wird pro Karte sequenziell dargestellt.

## Automatische Fehlerbehandlung

- Kann eine Cue-/Outcome-Zuordnung nicht sicher über öffentliche Eventdaten
  hergestellt werden, bleibt die bestehende getrennte Präsentation erhalten.
- Fehlt ein Katalogeintrag, wird nur die öffentliche Eventinformation genutzt.
- Rote fokussierte Tests oder ein roter Web-Typecheck stoppen das aktuelle Paket.
- Konflikte mit neuem `main` werden semantisch gelöst; bei widersprüchlichen
  Präsentationsverträgen wird ein Blocker mit Removal Condition dokumentiert.

## Sicherheitsblocker

- Jede Lösung, die verdeckte Kartenidentitäten aus R&D oder HQ ableiten müsste,
  ist verboten.
- Eine notwendige Änderung des PublicEvent-, PlayerView- oder Engine-Vertrags
  liegt außerhalb dieses Prozesses.

## State Machine

```text
idle
  -> generic_run_notice
  -> public_agenda_access
  -> public_agenda_access_decision
  -> public_agenda_stolen
  -> idle

generic_run_notice --public agenda arrives--> public_agenda_access
public_agenda_access --no unresolved decision--> public_agenda_stolen
public_agenda_access --cost/replacement/choice--> public_agenda_access_decision
public_agenda_access_decision --resolved--> public_agenda_stolen
```

Die Übergänge aktualisieren ein einziges Kartenfenster; sie öffnen keine
aufeinandergestapelten Dialoge.

## Paketfolge

### Paket 1: Regressionsvertrag und Diagnosegrenze

- Dieses Prozessartefakt erstellen.
- Bestehenden Access-Sequenzvertrag und kollidierenden Fremd-Worktree einordnen.
- Done-Gate: Dokument vorhanden, `git diff --check` grün, eigener Commit.
- Commit: `docs(ui): define agenda access single-window regression`

### Paket 2: Reproduktion und Präsentationsbesitz

- Die beobachtete Eventfolge als fokussierte Regression abbilden.
- Reine Helper für Cue-Besitz, Koaleszierung oder Overlay-Priorität so härten,
  dass ein öffentlicher Agenda-Access die generische Vorstufe übernimmt.
- Gegenfälle für redigierten Access und nicht zuordenbare Outcomes erhalten.
- Done-Gate: fokussierte Vitest-Tests und `git diff --check` grün.
- Commit: `fix(web): coalesce agenda access presentation`

### Paket 3: Kartenfenster und Sonderfall-Stadien

- Sicherstellen, dass Kartenbild, Zugriffskontext und `stolen`-Outcome im selben
  `AccessRevealModal` bleiben.
- Agenda ohne Zusatzkosten, Stehlkosten, nicht bezahlbare Kosten, Ersetzung und
  Multiaccess in der Präsentationsmatrix absichern.
- Done-Gate: Access-/Layering-/Page-Regressionen und Web-Typecheck grün.
- Commit: `test(web): cover agenda access presentation stages`

### Paket 4: Abschlussnachweis und Integration

- Relevante fokussierte Tests und Web-Typecheck erneut ausführen.
- Abschlussstand und Checks in diesem Artefakt dokumentieren.
- `git diff --check` ausführen und Abschlussdokumentation committen.
- Aktuelles `main` in den Arbeitsbranch integrieren, erneut verifizieren und den
  Branch lokal nach `main` mergen.
- Done-Gate: `main` enthält alle Paketcommits, ist sauber und der Worktree ist
  entfernt.
- Commit: `docs(ui): close agenda access presentation regression`

## Verifikationsregeln

- fokussierte Vitest-Läufe für `access-presentation`, `action-cues`,
  `access-review-derivation`, `action-board-ui` und Layering;
- `corepack pnpm --filter @netgrid/web typecheck`;
- `git diff --check` nach jedem Paket;
- browsernahe Prüfung nur dann, wenn die statische und komponentennahe
  Regression die beobachtete Overlay-Reihenfolge nicht vollständig beweist.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_ACCESS_AGENDA_PRESENTATION`
- Branch: `codex/access-agenda-presentation`
- Hauptworkspace: `C:\Projekte\NETGRID`, ausschließlich für den finalen Merge.
- Genau ein Paket ist aktiv; jedes abgeschlossene Paket erhält einen Commit.
- Vor dem finalen Merge wird aktuelles `main` in den Arbeitsbranch integriert.
- Push und Pull Request sind nicht Teil dieses Prozesses.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess Agenda-Zugriff und Stehl-Ergebnis in einem Kartenfenster vollständig und sequenziell von Paket 1 bis Paket 4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies AGENTS.md, AGENTS.local.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_ACCESS_AGENDA_PRESENTATION auf Branch codex/access-agenda-presentation. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket. Bewahre Engine-Autorität und Hidden-Info-Grenzen. Führe Paketchecks aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit Removal Condition. Integriere vor Abschluss aktuelles main, verifiziere erneut, merge lokal nach main, entferne den Worktree und markiere das Goal erst dann als complete.
```

## Abschlusskriterien

- Ein normaler öffentlicher Agenda-Zugriff erzeugt genau ein Access-Kartenfenster.
- Das Fenster zeigt Agenda, Serverkontext und endgültigen Stehlstatus.
- Zusatzkosten, Ersetzungen und Multiaccess bleiben korrekt sequenziert.
- Redigierte Zugriffe bleiben hidden-info-sicher.
- Fokussierte Tests, Web-Typecheck und `git diff --check` sind grün.
- Alle Paketcommits sind lokal nach `main` integriert.

## Verifikationsergebnis

Die beobachtete Sequenz wurde in der aktuellen lokalen Match-Datenbank
read-only nachvollzogen: `start_run` auf R&D, danach ein side-redigiertes
`access_card` und schließlich `steal_agenda` für `Viral Breeding Ground`. Die
Trennung der Engine-Events bleibt damit erhalten; geändert wurde ausschließlich
das Besitz- und Übergabeverhalten der Web-Präsentation.

Die Action-Cue bleibt während des unmittelbar folgenden KI-Schritts nur für
`start_run` und `access_card` montiert. Ein passendes öffentliches
Access-/Stehl-Ergebnis aktualisiert denselben Cue-Slot. Folgt nach einem
redigierten Zugriff kein öffentliches Ergebnis, sondern eine unabhängige
Aktion, ersetzt diese den Access-Cue, damit kein veraltetes Fenster stehen
bleibt. Agenda-Ersetzungen wie `Theorem Proof` behalten ihre eigenen
Installieren-/Ablehnen-Beschriftungen.

Die browsernahe Prüfung lief bewusst isoliert auf Web-Port 3200 und
Memory-Server-Port 8788. Derselbe Overlay-DOM-Knoten wechselte vom Run-Hinweis
zum redigierten R&D-Zugriff; ein öffentlicher HQ-Zugriff erschien als einzelnes
Access-Kartenfenster mit Bild. Der dabei gefundene Gegenfall eines redigierten
Zugriffs ohne öffentliches Ergebnis ist durch die abschließende Regression
abgedeckt. Die isolierten Prozesse und Browserartefakte wurden danach entfernt;
die regulären Ports 3100 und 8787 blieben unberührt.

Abschließende Checks im Paketbranch:

- 6 fokussierte Vitest-Dateien mit 165 bestandenen Tests;
- `corepack pnpm --filter @netgrid/web typecheck` erfolgreich;
- `git diff --check` ohne Befund.
