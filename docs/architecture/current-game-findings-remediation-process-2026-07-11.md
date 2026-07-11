# Fehler- und Verbesserungsbefunde aus dem aktuellen Spiel

## Status

P1 bis P11 sind auf `codex/current-game-findings-20260711` abgeschlossen und
verifiziert. Der Arbeitsbranch ist zur defensiven lokalen Main-Integration
freigegeben.

Final Review:
`docs/reviews/current-game-findings-remediation-final-review-2026-07-11.md`.

## Quelle und Zielprüfung

Quelle ist der am 2026-07-11 übergebene Bericht „NETGRID – im aktuellen Spiel
festgestellte Fehler und Verbesserungspunkte“ mit zehn Einzelpunkten und einem
übergreifenden Befund zu generischen Choice-Meldungen.

Der Endzustand ist für eine automatische sequenzielle Abarbeitung ausreichend
bestimmbar. Die Karten-, Engine-, Chronicle-, Access-, UI-, KI- und Auto-End-
Verträge sind im Workspace auffindbar. Zwei Befunde verlangen vor einer Änderung
einen belegten Abgleich: Der Name `Locked Draw` existiert nicht im aktuellen
Kartenbestand, während `Lockjaw` ausdrücklich eine Tap-Kostenfähigkeit besitzt;
die HQ-Rez-Beobachtung muss aus Matchdaten und Decision Trace bewertet werden.

## Gesamtziel

Die belastbaren Fehler aus dem Spielbericht werden ohne Hidden-Info-Leak und ohne
Regelabweichung behoben. Nichtfehler oder Namensverwechslungen werden mit
Quellennachweis als solche abgesichert. Counter, Chronicle, Run-/Access-Zeitfolge,
Aktionsgewichtung, Ereignisicons, KI-Rez-Entscheidung und automatischer Zugabschluss
bilden danach denselben fachlichen Zustand ab. Jedes Paket besitzt Regressionen,
einen eigenen Commit und ein dokumentiertes Done-Gate.

## Annahmen

- „Locked Draw“ bezeichnet mangels eines solchen Kartenobjekts wahrscheinlich
  `Lockjaw`. Maßgeblich ist der aktuelle Proteus-Quelltext
  `[T]: Give one of your icebreakers +2 strength ...`; Tap ist daher korrekt und
  Trash wäre eine Regelverletzung.
- Pattel-Counter auf ICE bleiben intern Virus-Counter. Die Anzeige darf sie
  fachlich als Pattel-Counter benennen, solange Purge und Stärkeabzug unverändert
  funktionieren.
- Generische Choice-Ereignisse ohne öffentlichen Mehrwert dürfen aus der
  Chronicle verschwinden. Öffentliche Reveal-/Move- oder Run-Entscheidungen
  erhalten ausschließlich sichtbare Details.
- Für seitenspezifische Ereignisicons werden die bestehenden Assets
  wiederverwendet und durch eine datengetriebene Runner-/Corp-Form- und
  Akzentsprache ergänzt; neue offizielle Kartenassets sind nicht erforderlich.
- Der jüngste lokale Match mit den beschriebenen HQ-Runs ist die primäre Evidence
  für den Rez-Befund. Ist keine eindeutige Partie auffindbar, wird nur eine
  reproduzierbare generische Regression aus vorhandenen LegalActions abgeleitet.

## Nicht-Ziele

- Keine Regeländerung gegen Kartentext oder aktuelle Errata.
- Keine allgemeine Neugestaltung aller Fenster oder Chronicle-Einträge.
- Keine Offenlegung verdeckter HQ-, R&D- oder Choice-Informationen.
- Keine pauschale Änderung des Corp-KI-Rez-Rankings ohne Trace-Evidence.
- Keine Legacy- oder Rückwärtskompatibilitätsarbeit für alte lokale Replays.
- Kein Push, Pull Request oder Remote-Merge.

## Controller-Invarianten

1. Genau ein Paket ist aktiv; kein Paket wird übersprungen.
2. Engine und `LegalActions` bleiben alleinige Regelautorität.
3. Jede öffentliche Meldung enthält nur Informationen, die für die jeweilige
   Seite bereits sichtbar sind.
4. Run, temporäre Begegnung, Access und Auto-End werden nicht vor offenen
   Choices, Bestätigungen oder Reveals abgeschlossen.
5. Ein Paket wird erst nach fokussierten Tests und `git diff --check` committed.
6. Fremde Änderungen im Hauptworkspace werden nicht gestaged, committed,
   verworfen oder überschrieben.
7. Neue Erkenntnisse erweitern den aktuellen Scope nur als dokumentiertes
   Follow-up; sie werden nicht still in ein aktives Paket aufgenommen.

## Automatische Fehlerbehandlung

- Fehlende Worktree-Abhängigkeiten werden mit `corepack pnpm install
  --frozen-lockfile` hergestellt.
- Rote fokussierte Tests werden eng im aktiven Paket diagnostiziert; das nächste
  Paket startet erst nach grünem Done-Gate.
- Ein nicht reproduzierbarer Nutzerbefund wird als `not_reproduced` mit gelesener
  Quelle, untersuchtem Vertrag und verbleibender Removal Condition dokumentiert.
- Bei weitergelaufenem `main` wird `main` defensiv in den Arbeitsbranch
  integriert und danach erneut geprüft.

## Sicherheitsblocker

- Ein notwendiger Chronicle-Text würde verdeckte Kartenidentitäten offenlegen.
- Engine und aktuelle Regelquelle widersprechen einander ohne führende
  Entscheidung.
- Der HQ-Rez-Fix wäre nur durch Zugriff auf Full State statt Corp-PlayerView,
  LegalActions und erlaubte Metadaten möglich.
- Die finale Main-Integration würde fremde uncommittete Änderungen überschreiben.

## State Machine

`Preflight -> P1 -> P2 -> P3 -> P4 -> P5 -> P6 -> P7 -> P8 -> P9 -> P10 -> P11 -> main-Abgleich -> Gesamtgate -> Merge -> Cleanup`

## Paketfolge und Paketdetails

### P1: Prozessvertrag und Baseline

- Ziel: Scope, Reihenfolge, Sicherheitsgrenzen und Verifikation festschreiben.
- Eingang: Wiki-first Einstieg, aktiver Release-Implementation-Agent, sauberer
  Arbeits-Worktree auf aktuellem `main`-Commit.
- Arbeit: Dieses Prozessartefakt erstellen und Ausgangslage dokumentieren.
- Kernartefakte: dieses Dokument.
- Checks: `git status --short`, `git diff --check`.
- Done-Gate: Alle zehn Punkte und der Chronicle-Querschnitt sind genau einem
  Folgepaket zugeordnet.
- Commit: `docs: plan current game findings remediation`.

### P2: Pattel-Counter-Vertrag

- Ziel: Pattel-Counter auf ICE mit Anzahl und Stärkehinweis anzeigen, intern aber
  purgefähige Virus-Counter beibehalten; Schreibweise `Pattel’s Virus` prüfen.
- Eingang: P1 abgeschlossen.
- Arbeit: PlayerView-/CounterDisplay-Projektion und UI-Tooltip datengetrieben
  präzisieren; Engine-/Purge-Vertrag regressieren.
- Kernartefakte: Engine-Viewprojektion, Web-Counterdarstellung und fokussierte
  Tests.
- Checks: Engine-View-/Purge-Tests, Web-UI-Tests, Package-Typechecks,
  `git diff --check`.
- Done-Gate: ICE zeigt `Pattel-Counter`, erklärt `-1 Stärke` je Counter und Purge
  entfernt weiterhin die zugrunde liegenden Virus-Counter.
- Commit: `fix(ui): name Pattel counters on ice`.

### P3: Chronicle-Choice-Vertrag und Classic-Operationen

- Ziel: Generische Choice-Meldung entfernen und Corporate Shuffle sowie
  Reclamation Project fachlich und visibility-sicher protokollieren.
- Eingang: P2 abgeschlossen.
- Arbeit: öffentliche Payloads der beiden Operationen prüfen/ergänzen;
  Chronicle-Zusammenfassungen für konkrete Vorgänge und Nullauswahl einführen;
  wertlose Fallback-Choices unterdrücken.
- Kernartefakte: Engine-Hidden-Zone-/Operation-Resolver, `chronicle.ts` und Tests.
- Checks: Engine-Choice-/Visibility-/Replay-Tests, Chronicle-Tests,
  Package-Typechecks, `git diff --check`.
- Done-Gate: Corporate Shuffle leakt keine HQ-Identität; Reclamation Project
  zeigt und benennt nur regelgemäß aufgedeckte ICE; kein generischer KI-Satz.
- Commit: `fix(chronicle): describe public card choices safely`.

### P4: Snowbank und Pay-or-End-the-Run-Ton

- Ziel: „Runner zahlt ...“ bei `unless the Runner pays` neutral oder warnend,
  nicht rot darstellen; tatsächliche negative Auflösung bleibt rot.
- Eingang: P3 abgeschlossen.
- Arbeit: Button-Ton aus konkreter Subroutinenoption statt aus dem gesamten
  Continue-Action-Typ ableiten und verwandte Pay-or-End-Fälle regressieren.
- Kernartefakte: `action-board-ui.ts` und fokussierte UI-/Engine-Fixtures.
- Checks: Action-Board-Tests, Snowbank-/Printed-Subroutine-Test,
  Web-Typecheck, `git diff --check`.
- Done-Gate: Zahlung ist `warning` oder neutral; Runende und schwere Folgen sind
  weiterhin `danger`.
- Commit: `fix(web): distinguish pay-to-continue actions`.

### P5: `Locked Draw`/Lockjaw-Regelabgleich

- Ziel: Den gemeldeten Trash-vs.-Tap-Befund gegen aktuelle Kartendaten und
  Runtime beweisbar klären.
- Eingang: P4 abgeschlossen.
- Arbeit: Karteninventar, Quelltext, Implementation und Mehrfachnutzung prüfen;
  Regression für Tap, Verbleib im Rig, Sperre bis Refresh und erneute Nutzung
  nach Refresh vervollständigen. Keine Trash-Änderung ohne passende Regelquelle.
- Kernartefakte: Proteus-Kartenfixture, Lockjaw-Implementation/-Regression und
  Ergebnisnotiz in diesem Dokument.
- Checks: fokussierter Lockjaw-Engine-Test, CardImplementation-Coverage,
  `git diff --check`.
- Done-Gate: Befund ist entweder mit korrekter Karte behoben oder als
  quellenbelegter Nichtfehler geschlossen; keine Mehrfachnutzung im getappten
  Zustand.
- Ergebnis: Als Namensverwechslung/Nichtfehler geschlossen. Im aktuellen
  Kartenbestand existiert nur `Lockjaw` (`onr_proteus_091_lockjaw`); der
  versionierte Proteus-Kartentext verlangt ausdrücklich `[T]`. Die Regression
  belegt Tap, Verbleib im Rig, Sperre bis zum Refresh und erneute Nutzbarkeit im
  folgenden Runner-Zug. Eine Trash-Änderung wäre regelwidrig.
- Commit: `test(engine): lock Lockjaw tap semantics`.

### P6: Dr.-Dreff-Runfenster und Chronicle

- Ziel: Choice, temporäre ICE-Begegnung, Trash und erfolgreicher Run bleiben in
  richtiger Reihenfolge im selben Run; Chronicle nennt nur sichtbare Details.
- Eingang: P5 abgeschlossen.
- Arbeit: bestehenden temporären HQ-ICE-Vertrag und Payloads prüfen, fehlende
  Run-State-/Chronicle-Regressionen ergänzen und belegte Abweichungen beheben.
- Kernartefakte: Dr.-Dreff-Run-Resolver, Engine-Run-Tests und Chronicle-Tests.
- Checks: fokussierte Engine-Run-/Visibility-/Replay-Tests, Chronicle-Tests,
  Package-Typechecks, `git diff --check`.
- Done-Gate: once-per-run, Vorenthaltung der ICE-Identität, temporäre Begegnung,
  anschließender Trash und später erfolgreicher Run sind durch Tests belegt.
- Commit: `fix(run): keep Dr Dreff inside successful run`.

### P7: Zentrale Root- und Serverzugriffe

- Ziel: HQ-/R&D-/Archives-Root getrennt von Karten aus dem zentralen Server
  präsentieren und protokollieren.
- Eingang: P6 abgeschlossen.
- Arbeit: Access-Metadaten und UI-Sequenzlabels nach Origin klassifizieren;
  Remote-Verhalten unverändert lassen.
- Kernartefakte: Access-Flow/-Presentation, `AccessReviewModals`, Chronicle und
  Tests.
- Checks: zentrale Single-/Multiaccess-Tests, Web-Presentation-/Chronicle-Tests,
  Typechecks, `git diff --check`.
- Done-Gate: Root-Upgrade und HQ-/R&D-/Archives-Karte sind in Fenster und
  Chronicle eindeutig getrennt, ohne verdeckte Identität zu leaken.
- Commit: `fix(access): distinguish central roots from server cards`.

### P8: Seitenspezifische Fenstericons

- Ziel: Runner- und Corp-Fenster durch konsistente Form- und Akzentsprache
  schneller erkennbar machen.
- Eingang: P7 abgeschlossen.
- Arbeit: Side als expliziten Iconvertrag führen; Runner/Corp mit eigenem
  Corner-Glyph, Form und dezentem Akzent für Action-, Choice-, Trigger-, Run-,
  Access- und Bestätigungsfenster auszeichnen.
- Kernartefakte: `WindowEventIcon`, Klassifizierung, CSS und Komponententests.
- Checks: fokussierte Web-Tests, Web-Typecheck, visuelle Browserprüfung,
  `git diff --check`.
- Done-Gate: beide Seiten sind bei gleichem Ereignistyp unterscheidbar; Layout
  und bestehende Motive bleiben stabil.
- Commit: `feat(web): distinguish Runner and Corp window icons`.

### P9: HQ-ICE-Rez-Trace und KI-Korrektur

- Ziel: Das nicht gerezzte äußere HQ-ICE aus LegalActions und Decision Trace
  nachvollziehen und nur bei belegtem Fehlranking korrigieren.
- Eingang: P8 abgeschlossen.
- Arbeit: jüngste passende Matches mit dem lokalen Inspektionspfad analysieren;
  Credits, Rez-LegalAction, Alternativen, Reserve-/Nutzenbewertung und ICE-Wirkung
  rekonstruieren; gegebenenfalls generische Rankingkorrektur mit Regression.
- Kernartefakte: versionierbarer Analyse-/Reviewbericht, fokussierte AI-Tests;
  große Rohtraces nur unter `data/local/`.
- Checks: gezielte AI-Tests, `check:ai` soweit betroffen, Typecheck,
  `git diff --check`.
- Done-Gate: Entscheidung ist fachlich erklärt oder ein belegter generischer
  Rankingfehler ist korrigiert; keine konkrete Karten-ID-Sonderregel.
- Commit: `fix(ai): align HQ ice rez decisions` oder bei korrekter Entscheidung
  `docs(ai): explain HQ ice rez decision`.

### P10: Auto-End-Auflösungsbarriere

- Ziel: Automatisches Zugende erst nach vollständig geschlossenem Access, Run,
  Choice, Trigger und sichtbarer Bestätigung auslösen.
- Eingang: P9 abgeschlossen.
- Arbeit: Auto-End-Prädikat um explizite unresolved-interaction-Signale ergänzen;
  R&D, HQ, Archives, Remote, Multiaccess, Ambush, Trash/Steal/Payment und reine
  Reveal-Bestätigung regressieren.
- Kernartefakte: `action-board-ui.ts`, Page-Integration und fokussierte Webtests.
- Checks: Action-Board-/Access-UI-Tests, Web-Typecheck, repräsentativer E2E- oder
  Browser-Smoke, `git diff --check`.
- Done-Gate: `end_turn` wird trotz letzter Aktion nicht automatisch eingereicht,
  solange irgendeine fachliche oder lokale Interaktion offen ist.
- Commit: `fix(web): block auto end during unresolved interactions`.

### P11: Gesamtverifikation, Review und Wissenspflege

- Ziel: Paketresultate, Abweichungen und aktuelle Gates dauerhaft festhalten.
- Eingang: P2 bis P10 abgeschlossen.
- Arbeit: Final Review schreiben, dieses Dokument auf abgeschlossen setzen,
  wiederverwendbare Erkenntnisse in Current State/Status und Monatslog
  zurückführen.
- Kernartefakte: Review unter `docs/reviews/`, dieses Prozessdokument,
  `docs/codex/CODEX_STATUS.md`, Wissensbasis und Monatslog.
- Checks: alle fokussierten Suiten, `corepack pnpm typecheck`, relevante
  Contract-/Package-Gates, `git diff --check`.
- Done-Gate: Jeder Ausgangspunkt besitzt Ergebnis, Evidence, Tests und bekannten
  Restpunkt; Branch ist sauber.
- Commit: `docs: close current game findings remediation`.

## Verifikationsregeln

- Paketnahe Vitest-Dateien werden direkt und mit Paketfilter ausgeführt.
- Engine-Änderungen benötigen mindestens Regel-, Visibility- und Replay-/Hash-
  Evidence, sofern Ereignispayload oder Zustandsfolge betroffen ist.
- Web-Änderungen benötigen fokussierte Vitest-Suiten und
  `corepack pnpm --filter @netgrid/web typecheck`.
- AI-Änderungen benötigen eine reproduzierbare Rankingregression; ein grüner
  technischer Test ist keine Behauptung globaler strategischer Optimalität.
- Nach jedem Paket: `git diff --check`, ausschließlich Paketdateien stagen,
  committen, sauberen Status prüfen.
- Vor Merge: aktuelles `main` integrieren, fokussierte Gesamtsuite plus
  `corepack pnpm typecheck` und relevante Current-State-Gates erneut ausführen.

## Paketabschluss

| Paket | Ergebnis | Commit |
| --- | --- | --- |
| P1 | Prozess und `/Goal` festgeschrieben | `9c0b19b83` |
| P2 | Pattel-Anzeige bei unveränderter Virus-Semantik | `fbbb823f0` |
| P3 | öffentliche Choice-Chronicle und Reclamation-Nullauswahl | `6de173f6a` |
| P4 | Pay-to-continue-Warning-Ton | `7dbe0c71c` |
| P5 | Lockjaw-Tap als Regelvertrag bestätigt | `0e66f0291` |
| P6 | Dr.-Dreff-Run-/Chronicle-Ablauf | `943448126` |
| P7 | Central-Root-/Zonen-Herkunft im Access | `23be2f32c` |
| P8 | seitenspezifische Window-Icon-Sprache | `06b9b7e2d` |
| P9 | HQ-Rez als Nichtfehler aus Matchtrace erklärt | `b33b7afd5` |
| P10 | Auto-End-Auflösungsbarriere | `7640ff018` |
| P11 | Gesamtverifikation, Review und Wissenspflege | dieser Abschlusscommit |

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree:
  `C:\Projekte\NETGRID_CURRENT_GAME_FINDINGS_20260711`.
- Arbeitsbranch: `codex/current-game-findings-20260711`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge
  verwendet.
- Ausgangspunkt ist `main` bei `2ac4ea4e7`.
- Die bei Preflight vorhandenen fremden Änderungen im Hauptworkspace bleiben
  unangetastet. Verhindern sie den Merge, gilt dies als Integrationsblocker und
  wird nicht durch Stash, Reset oder Fremdcommit umgangen.
- Bevorzugte Integration ist Fast-Forward; ein Merge-Commit verlangt eine
  dokumentierte Begründung.
- Worktree-Entfernung und `/Goal complete` erfolgen erst nach verifiziertem
  lokalen Main-Merge.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess „Fehler- und Verbesserungsbefunde aus dem aktuellen
Spiel“ vollständig und sequenziell von P1 bis P11 ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die verpflichtende NETGRID-Wissensbasis,
agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite
ausschließlich im Worktree
C:\Projekte\NETGRID_CURRENT_GAME_FINDINGS_20260711 auf Branch
codex/current-game-findings-20260711. Nutze den Hauptworkspace nur für den
finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische
Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, führe dessen
Checks aus, dokumentiere Ergebnisse und committe das Paket. Stoppe bei einem
Sicherheitsblocker mit Removal Condition. Integriere nach P11 aktuelles main,
verifiziere den Arbeitsbranch, merge lokal nach main, prüfe main, entferne den
Worktree und markiere /Goal erst danach als complete. Kein Push und kein PR.
```

## Abschlusskriterien

- Alle zehn Nutzerpunkte und der Choice-Querschnitt sind umgesetzt oder mit
  belastbarer Regel-/Trace-Evidence als Nichtfehler geschlossen.
- Hidden-Info-, LegalAction-, Replay- und StateHash-Verträge bleiben intakt.
- Jeder Paketcommit besitzt grüne fokussierte Checks und `git diff --check`.
- Final Review, Current State, Status und Monatslog stimmen überein.
- Arbeitsbranch ist lokal in `main` integriert, `main` ist verifiziert und der
  Worktree ist entfernt.
