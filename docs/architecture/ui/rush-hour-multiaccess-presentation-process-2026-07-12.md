# Rush-Hour-Mehrfachzugriff eindeutig und verlustfrei präsentieren

## Status

In Umsetzung am 12. Juli 2026.

## Quelle und Vorgabe

Ausgangspunkt ist das lokale Match `match_7bfe82501d0fdcb8`. Rush Hour erzeugte
auf R&D vier regelkorrekte Access-Events:

1. `evt_11`: Data Wall, Zugriff 1 von 4;
2. `evt_12`: Urban Renewal, Zugriff 2 von 4;
3. `evt_13`: eine andere Kopie von Data Wall, Zugriff 3 von 4;
4. `evt_14`: eine andere Kopie von Urban Renewal, Zugriff 4 von 4.

Die Weboberfläche zeigte den Fortschritt nicht im Access-Kartenfenster. Der
vierte Zugriff konnte außerdem verschwinden, weil unmittelbar folgende Events
(`evt_15` Broker installieren und `evt_16` Zug beenden) die bestehende
Retention beendeten, bevor der Zugriff bestätigt war.

Der Nutzer hat die direkte Umsetzung nach vorangegangener Analyse und
Maßnahmenfreigabe mit `$paketprozess-worktree-goal` beauftragt.

## Zielprüfung

Die Vorgabe ist präzise. Der Endzustand betrifft ausschließlich die
hidden-info-sichere Webpräsentation bereits vorhandener Access-Events. Engine,
LegalActions, Replay und Kartenregeln bleiben unverändert.

## Gesamtziel

Jeder neue, für den Viewer öffentliche Access wird genau einmal und bis zur
Bestätigung präsentiert. Das Kartenfenster zeigt bei Mehrfachzugriffen immer
den generischen Fortschritt `Zugriff N von M`, auch wenn mehrere verschiedene
Karteninstanzen dieselbe Kartendefinition besitzen. Spätere unabhängige Events
dürfen einen noch nicht bestätigten Zugriff nicht verdrängen.

## Annahmen

- `accessIndex` ist nullbasiert; `effectiveAccessCount` ist die Gesamtzahl.
- Nur Events mit bereits sichtbarer `cardDefinitionId` und `title` werden als
  Access-Kartenfenster gepuffert.
- Beim Einstieg oder Reconnect wird die vorhandene Historie nicht vollständig
  neu abgespielt. Nur der bereits nach geltendem Vertrag retainbare aktuelle
  Zugriff darf initial erscheinen; danach werden neue Access-Events verfolgt.
- LegalActions gehören ausschließlich zum aktuellen PlayerView-State. Ein
  älterer gepufferter Zugriff wird deshalb rein zur Bestätigung dargestellt,
  wenn der State bereits weitergelaufen ist.

## Nicht-Ziele

- Keine Änderung von Rush Hour oder der Engine-Access-Sequenz.
- Keine Offenlegung redigierter R&D-/HQ-Karten.
- Kein Redesign allgemeiner Action-Cues oder Ereignisfenster.
- Keine Bearbeitung des fremden Worktrees
  `codex/activities-worktree-20260711-access-outcomes`.
- Kein Push und kein Pull Request.

## Controller-Invarianten

1. Die Rules Engine bleibt alleinige Regelautorität.
2. Die UI zeigt nur PlayerView-, LegalAction- und side-gefilterte Eventdaten.
3. Neue öffentliche Access-Events werden in Eventreihenfolge präsentiert.
4. Ein Access bleibt sichtbar beziehungsweise wartend, bis seine Event-ID
   bestätigt wurde.
5. Pro Event-ID erscheint höchstens ein Access-Fenster.
6. Für den aktuellsten Access dürfen nur aktuelle LegalActions angeboten
   werden; ältere Review-Einträge sind bestätigungs-only.
7. Reconnect und Matchwechsel spielen keine alte vollständige Eventhistorie ab.
8. Damage-, Steal-, Trash- und Agenda-Outcome-Stadien des bestehenden
   Access-Vertrags bleiben erhalten.

## Automatische Fehlerbehandlung

- Fehlen sichere öffentliche Kartendaten, wird kein Kartenfenster erzeugt.
- Fehlen gültige Fortschrittsfelder, bleibt die bisherige Darstellung ohne
  erfundene Gesamtzahl erhalten.
- Bei Konflikten mit neuerem `main` werden beide Präsentationsintentionen
  semantisch zusammengeführt; ein widersprüchlicher Visibility-Vertrag ist ein
  Sicherheitsblocker.
- Rote fokussierte Tests oder roter Web-Typecheck stoppen das aktive Paket.

## Sicherheitsblocker

- Eine Lösung, die verdeckte Kartenidentitäten rekonstruiert oder errät, ist
  verboten.
- Eine erforderliche Engine-, PlayerView- oder PublicEvent-Erweiterung liegt
  außerhalb dieses Prozesses.
- Nicht semantisch auflösbare Paralleländerungen am Access-Vertrag blockieren
  den Main-Merge.

## State Machine

```text
baseline
  -> new_public_access_detected
  -> queued
  -> presenting_oldest
  -> acknowledged
  -> presenting_next_or_idle

presenting_oldest --newer game events--> presenting_oldest
presenting_oldest --acknowledge--> presenting_next_or_idle
match/session change --> baseline
```

## Paketfolge

### Paket 1: Preflight und Prozessvertrag

- Eigenen Worktree und Branch anlegen.
- Dieses Prozessartefakt mit Evidence, Invarianten und Paket-Gates erstellen.
- Done-Gate: Worktree korrekt, `git diff --check` grün, eigener Commit.
- Commit: `docs(ui): define Rush Hour multiaccess process`

### Paket 2: Fortschritt und bestätigungsbasierte Präsentation

- Generischen Access-Fortschritt aus öffentlichen Eventfeldern ableiten.
- Neue öffentliche Access-Events nach dem Baseline-Cursor in einer kleinen
  UI-Queue halten und in Eventreihenfolge bestätigen.
- Aktuelle und ältere Review-Stadien sicher von LegalActions trennen.
- Rush-Hour-, Wiederholungs-, Folgeevent- und Reconnect-Gegenfälle testen.
- Done-Gate: fokussierte Webtests, Web-Typecheck und `git diff --check` grün.
- Commit: `fix(web): preserve Rush Hour access presentations`

### Paket 3: Abschlussnachweis und Wissenspflege

- Final Review mit Match-Evidence, Grenzen und Checks schreiben.
- Dauerhaften UI-Vertrag im Juli-Projektlog verdichtet dokumentieren.
- Fokussierte Tests und Web-Typecheck erneut ausführen.
- Done-Gate: Abschlussartefakte aktuell, Checks grün, eigener Commit.
- Commit: `docs(ui): close Rush Hour access presentation fix`

## Verifikationsregeln

- fokussierte Vitest-Läufe für Access-Derivation, Access-Retention,
  Action-Board und Layering;
- `corepack pnpm --filter @netgrid/web typecheck`;
- `git diff --check` nach jedem Paket;
- nach Integration von aktuellem `main` dieselben relevanten Checks erneut.

## Worktree-, Git- und Integrationsregeln

- Hauptworkspace: `C:\Projekte\NETGRID`, nur für den finalen lokalen Merge.
- Worktree: `C:\Projekte\NETGRID_RUSH_HOUR_ACCESS_PRESENTATION`.
- Branch: `codex/rush-hour-access-presentation`.
- Genau ein Paket ist aktiv; jedes Paket erhält einen eigenen Commit.
- Vor dem finalen Merge wird aktuelles `main` in den Arbeitsbranch integriert.
- Danach wird der Arbeitsbranch lokal nach `main` gemergt.
- Nach erfolgreichem Merge werden Worktree und gemergter Branch entfernt und
  beide Entfernungen verifiziert.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess Rush-Hour-Mehrfachzugriff vollständig und sequenziell von Paket 1 bis Paket 3 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies AGENTS.md, AGENTS.local.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_RUSH_HOUR_ACCESS_PRESENTATION auf Branch codex/rush-hour-access-presentation. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket. Bewahre Engine-Autorität und Hidden-Info-Grenzen. Führe Paketchecks aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit Removal Condition. Integriere vor Abschluss aktuelles main, verifiziere erneut, merge lokal nach main, entferne Worktree und Branch verifiziert und markiere das Goal erst danach als complete.
```

## Abschlusskriterien

- Vier Rush-Hour-Access-Events erscheinen als `1 von 4` bis `4 von 4`.
- Verschiedene Instanzen derselben Kartendefinition bleiben als getrennte
  Access-Schritte erkennbar.
- `install_card`, `end_turn` oder andere spätere Events verdrängen keinen noch
  unbestätigten öffentlichen Access.
- Reconnect spielt keine alte vollständige Access-Historie ab.
- Redigierte Zugriffe bleiben hidden-info-sicher.
- Fokussierte Tests, Web-Typecheck und `git diff --check` sind grün.
- Alle Paketcommits sind lokal nach `main` integriert und Worktree/Branch sind
  verifiziert entfernt.
