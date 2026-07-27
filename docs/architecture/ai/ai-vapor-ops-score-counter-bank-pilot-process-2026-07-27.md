# Vapor Ops Counter-Bank im Agenda-Scoreplan – Pilotprozess

Status: **lokal verifiziert, bereit für Main-Integration**

Stand: 2026-07-27

## Quelle und Zielprüfung

Quelle ist die Analyse des abgeschlossenen Corp-KI-Spiels `match_efa2150596c7b527`
und die anschließend abgestimmte Spielabsicht: Vapor Ops wird in einer bereits
gesicherten, wiederverwendbaren Remote vor einer Agenda aufgebaut, hält dort
Advancement Counter vor und überträgt sie später für eine konkrete
Agenda-Scorelinie. Wird die Remote rechtzeitig als nicht mehr gesichert
erkannt, kann Vapor die Counter im Corp-Main-Window in Credits umwandeln.

Der Auftrag ist präzise genug für die automatische Umsetzung. Der Pilot bleibt
absichtlich auf Vapor Ops als erster Counter-Bank-Karte begrenzt, verwendet
aber keine Karten-ID-basierte Aktionswahl.

## Gesamtziel

Der produktive Corp-Plan `corp.score_agenda` soll Vapor Ops als
Engine-zertifizierten, Remote-gebundenen Counter-Bank-Vorbereitungspfad
besitzen:

1. Eine bereits ausreichend geschützte Remote kann Vapor vor einer Agenda
   aufnehmen.
2. Die Corp baut dort Counter nur bis zu einer begründeten Score-Schwelle auf
   und reserviert sie für den Scoreplan.
3. Nach dem Agenda-Install bindet der bestehende generische
   `move_advancement`-Konversionspfad die Bank an die exakte Agenda.
4. Fällt die vorbereitete Remote vor dem Runner-Zug erkennbar unter die
   Sicherheitsbedingung, kann die Corp Vapor im eigenen Main-Window rezz(en)
   und die Counter kontrolliert liquidieren.

## Annahmen und Nicht-Ziele

- Eine sichere Remote wird ausschließlich aus bestehender, sichtbarer und
  finanzierbarer Defense-Evidence abgeleitet. Unbekannte Evidence zählt nicht
  als sichere Remote.
- Der Pilot eröffnet keine neue Remote, installiert kein ICE als Nebenwirkung
  und modelliert keine zweite Vapor-Bank. Der vorhandene Defense-Plan bleibt
  alleiniger Owner von ICE-Installationen.
- Es wird kein allgemeiner Node-Plan geschaffen. Andere zulässige
  Vapor-Ziele, etwa advancebare Ambushes, bleiben außerhalb dieses
  Agenda-Score-Piloten.
- Eine reservierte Counter-Bank wird nicht beiläufig als Economy verwendet.
  Ihre Liquidation ist nur ein eigener Rückzugsweg, wenn ihr Score-Zweck
  verloren gegangen ist.
- Die KI erfindet keine künftigen Aktionen. Sie handelt nur aus aktuellen
  `LegalActions`; eine Engine-Quote beschreibt ausschließlich die sichtbare,
  aktuelle Counter-Bank-Fähigkeit und die Bindung zum späteren Revalidieren.

## Controller-Invarianten

- Rules Engine und `applyAction` bleiben alleinige Regelautorität.
- Die Engine-Quote enthält nur für die Corp sichtbare eigene Karten- und
  Kostenfakten; sie gelangt weder in gegnerische PlayerViews noch PublicEvents.
- Jeder Install-, Advance-, Rez-, Cashout- und Transfer-Schritt wird gegen
  aktuelle `LegalActions`, `stateVersion`, Quelle, Remote und Ziel erneut
  gebunden.
- Ein HQ-Überlauf ist kein eigenständiger Zweck, Vapor zu installieren.
  Ein Überlauf kann nur dieselbe bereits zulässige Score-Vorbereitung
  begleiten, nie ihren Parent ersetzen.

## State Machine

```text
unbound
  -> install_counter_bank          (exakte Vapor-Installation in bestehende sichere Remote)
  -> build_counter_bank            (sichtbare Basic-Advance-Aktion auf genau Vapor)
  -> reserve_counter_bank          (Schwelle erreicht; keine beiläufige Cashout-Aktion)
  -> agenda_score_handoff          (Agenda wird in dieselbe Remote installiert)
  -> rez_counter_bank_if_required  (nur wenn aktuelle Transfer-Action Rez voraussetzt)
  -> convert_agenda                (bestehende generische move_advancement-Route)
  -> advance_or_score

build_counter_bank | reserve_counter_bank
  -> liquidate_counter_bank        (Remote-Safety verloren, kein höherer Scorepfad,
                                    aktuelle Corp-Main-LegalActions)

jeder Zustand
  -> abandoned                     (Vapor entfernt, Quote stale/unklar, Remote/Ziel fehlt)
```

`liquidate_counter_bank` ist kein Reaktionsfenster innerhalb eines
Runner-Runs. Die Entscheidung muss im Corp-Main-Window vor dem nächsten
Runner-Zug fallen.

## Paketfolge

### VOP-01 – Prozess- und Vertragsbaseline

- Ziel: Scope, State Machine, Nicht-Ziele und Testmatrix verbindlich
  festhalten.
- Kernartefakt: dieser Prozess.
- Done-Gate: Die spätere Umsetzung kann keinen allgemeinen Node-Plan,
  keine HQ-Overflow-Ablage und keine Hidden-Info-Annahme einführen.
- Commit: `docs(ai): define vapor ops counter-bank pilot process`

### VOP-02 – Engine-zertifizierte Counter-Bank-Evidence

- Ziel: Eine versionierte, Corp-private strukturierte Quote beschreibt die
  aktuelle Counter-Bank-/Transferfähigkeit einer sichtbaren eigenen Karte,
  inklusive Quelle, Counterbestand, Rez-Erfordernis, Transferzielklasse und
  `stateVersion`.
- Kernartefakte: Shared-DTO/Schema, Engine-PlayerView-Producer,
  Engine- und Redaction-Tests.
- Done-Gate: Eine stale, fremde oder unvollständige Quote ist nicht verwendbar;
  die Quote erzeugt keine neue LegalAction und leakt nicht.
- Commit: `feat(engine): expose corp counter-bank preparation evidence`

### VOP-03 – Agenda-Scoreplan, Reservierung und Rückzug

- Ziel: `corp.score_agenda` besitzt einen typisierten Counter-Bank-Parent
  für eine vorhandene sichere Remote, bindet die exakte Vapor-Installation und
  deren Advances, übergibt an die bestehende Score-Konversion und liquidiert
  nur als expliziten Fallback. Generisches HQ-Overflow schließt ungebundenes
  Vapor aus.
- Kernartefakte: Plan-State/Signals, Live-Runtime-Producer,
  Score-Modul, fokussierte AI-Tests.
- Done-Gate: Alle selektierten Aktionen sind aktuelle LegalActions und der
  Parent ist an Remote, Vapor-Instanz und State-Evidence gebunden.
- Commit: `feat(ai): prepare vapor counter banks for agenda scoring`

Umgesetzt am 2026-07-27:

- `corp.score_agenda` besitzt nun die abgegrenzten Phasen für Installation,
  Aufbau, Agenda-Handoff, erforderliches Rez und Liquidation einer
  Counter-Bank.
- Die Sicherheitsprüfung verwendet die vorhandene sichtbare
  Remote-Contestability-Analyse einschließlich Runner-Rig und
  Kreditressourcen; sie akzeptiert nur eine aktuell nicht erreichbare,
  bestehende Remote mit mindestens einem bewertbaren ICE.
- Die Schwelle stammt aus den sichtbaren Agenda-Anforderungen, ansonsten aus
  dem eigenen Deck-Snapshot. Ohne eine solche eigene Evidence wird keine
  Bank-Schwelle erfunden.
- Ein gültiges Counter-Bank-Zitat sperrt Vapor für die generische
  HQ-Overflow-Konversion. Cashout ist ausschließlich bei verlorener
  Sicherheitsbedingung, ohne aktuelle Score-Handoff-Route und nur im
  `corp_action.main` zulässig.

### VOP-04 – Szenarien, Regression und Abschlussreview

- Ziel: Den gesamten Pfad sowie Ablehnungen und Liquidation regressionssicher
  testen, Architektur- und Abschlussnachweis ergänzen.
- Kernartefakte: Szenario-/Checkpointtests und Final Review.
- Done-Gate: Die fokussierte Suite, AI-Typecheck, `check:ai`, relevante
  Engine-/Shared-Typechecks sowie Format- und Diff-Gate sind grün.
- Commit: `test(ai): cover vapor counter-bank score pilot`

Abschlussreview am 2026-07-27:

- Die fokussierten Tests decken sichere Installation, deckabgeleiteten
  Aufbau ohne Agenda, Agenda-Handoff, verlorene Remote-Sicherheit, fehlendes
  Corp-Main-Window, stale/inkonsistente Quote und Nicht-Agenda-Ziele ab.
- Der Live-Runtime-Test zeigt zusätzlich, dass eine gültige Vapor-Installation
  bei HQ-Überlauf den Scoreplan als Parent behält und nicht als generische
  Overflow-Konversion ausgeführt wird.
- Erfolgreiche Gates im Worktree:
  `@netgrid/ai typecheck`, die beiden fokussierten Vitest-Dateien (161 Tests),
  `pnpm check:ai`, `@netgrid/shared typecheck`, `@netgrid/engine typecheck`,
  `git diff --check` und der Prettier-Check der geänderten Dateien.

## Testmatrix

| Fall | Erwartung |
| --- | --- |
| Sichere leere Remote, Vapor auf der Hand, keine Agenda | exakte Installation und späterer Counter-Aufbau |
| Unsichere oder unbekannte Remote | keine Vapor-Installation |
| Höherer aktueller Score- oder Defense-Plan | Vorbereitung wird verdrängt |
| Agenda nach vorbereiteter Bank | Install in derselben Remote, aktueller Rez/Transfer, Score-Fortsetzung |
| Bank übertrifft Agenda-Bedarf | nur von der Engine erlaubte, für die Route nötige Counterwahl |
| Remote-Safety vor Runner-Zug verloren | expliziter Cashout im Corp-Main-Window |
| Runner läuft bereits erfolgreich | keine imaginierte Run-Reaktion |
| Vapor getrasht oder Quote stale | Plan wird abgebrochen |
| HQ-Überlauf ohne Parent | keine Vapor-Ablage |
| Nicht-Agenda als mögliches Transferziel | Agenda-Scoreplan beansprucht den Transfer nicht |

## Verifikation und Integration

- Jedes Paket endet mit fokussierten Tests, `git diff --check` und einem
  ausschließlich zugehörigen Commit.
- Die Umsetzung läuft ausschließlich im Worktree
  `C:\\Projekte\\NETGRID_AI_VAPOR_OPS_SCORE_COUNTER_BANK` auf
  `codex/ai-vapor-ops-score-counter-bank`.
- Vor dem finalen lokalen Merge wird aktuelles `main` defensiv integriert,
  dann laufen die vollständigen einschlägigen Gates erneut.
- Nach erfolgreicher Main-Prüfung werden Worktree und Arbeitsbranch
  verifiziert entfernt. Kein Push und kein Pull Request gehören zum Auftrag.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Vapor-Ops-Score-Counter-Bank-Pilot vollständig und
sequenziell von VOP-01 bis VOP-04 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, die Paketregeln und diesen Prozess. Arbeite
ausschließlich im Worktree C:\\Projekte\\NETGRID_AI_VAPOR_OPS_SCORE_COUNTER_BANK
auf Branch codex/ai-vapor-ops-score-counter-bank. Nutze den Hauptworkspace nur
für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen
Checks aus und committe es. Bei einem Sicherheitsblocker: stoppe, dokumentiere
den Blocker mit Removal Condition. Nach VOP-04: main integrieren, final prüfen,
lokal nach main mergen, Worktree und Branch verifiziert entfernen und das Goal
erst dann abschließen.
```

## Abschlusskriterien

Der Pilot ist erst abgeschlossen, wenn alle vier Paket-Commits auf `main`
liegen, keine illegale oder Hidden-Info-gefährdende Entscheidung möglich ist,
die Tests die State Machine abdecken und Worktree sowie Arbeitsbranch entfernt
sind.
