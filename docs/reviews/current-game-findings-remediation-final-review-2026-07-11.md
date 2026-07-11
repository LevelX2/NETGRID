# Final Review: Fehler- und Verbesserungsbefunde aus dem aktuellen Spiel

Datum: 2026-07-11  
Arbeitsbranch: `codex/current-game-findings-20260711`  
Prozess: `docs/architecture/current-game-findings-remediation-process-2026-07-11.md`

## Ergebnis

Die zehn Punkte des Spielberichts und der übergreifende Chronicle-Befund sind
vollständig bearbeitet. Acht Punkte führten zu generischen Implementierungs-
oder Darstellungskorrekturen. Zwei Punkte wurden mit Regel- beziehungsweise
Match-Evidence als Nichtfehler geschlossen:

- `Lockjaw` verwendet regelkonform Tap als Kosten; ein Trash wäre falsch.
- `Colonel Failure` konnte in den beanstandeten HQ-Rez-Fenstern wegen seines
  Rez-Preises 17 bei nur 7 bis 9 Corp-Credits nicht legal gerezzt werden.

Hidden-Info, LegalActions, Replay, StateHash und die technische Virus-Counter-
Semantik bleiben erhalten. Es wurden keine Karten-ID-Sonderregeln für KI oder
Chronicle eingebaut und keine lokalen Matchdaten versioniert.

## Befundmatrix

| Nr. | Ausgangspunkt | Ergebnis | Evidence / Regression | Commit |
| ---: | --- | --- | --- | --- |
| 1 | Pattel-Counter wurden generisch als Virus angezeigt | ICE zeigt `Pattel-Counter` und einen erklärenden Tooltip; intern bleibt `virus`, Purge löscht den Counter, Stärke sinkt pro Counter um 1 | Engine-Release-Smoke, Action-Board-Test, Typechecks | `fbbb823f0` |
| 2 | `Corporate Shuffle` erschien nur als generische Entscheidung | Chronicle benennt das öffentliche Mischen und Ziehen ohne HQ-Identitäten offenzulegen; generische „Entscheidung beantwortet“-Zeilen ohne Mehrwert werden unterdrückt | Hidden-Zone- und Chronicle-Regressionen | `6de173f6a` |
| 3 | Snowbank-Zahloption war rot wie Damage/Run-Ende | Reine Pay-to-continue-Aktionen erhalten den Warning-Ton; gemischte Damage- oder Run-End-Aktionen bleiben gefährlich | Action-Board-Regressionen | `7dbe0c71c` |
| 4 | angebliches `Locked Draw` sollte trashen statt tappen | Kein solches Kartenobjekt vorhanden; gemeint ist `Lockjaw`, dessen Kartentext `[T]` als Kosten verlangt. Tap- und Zonenverhalten sind festgeschrieben | gezielte Lockjaw-Regelregression | `0e66f0291` |
| 5 | Dr.-Dreff-Ablauf war generisch und zeitlich unklar | Chronicle beschreibt Auswahl, temporäre Begegnung, Abschluss/Trash und Ablehnung; die Intervention bleibt Teil desselben erfolgreichen Runs | Successful-Run-, Replay-/Hash- und Chronicle-Regressionen | `943448126` |
| 6 | Central-Root und Karten aus HQ/R&D/Archives waren nicht getrennt | Engine liefert ein hidden-info-sicheres `accessOrigin`; UI und Chronicle unterscheiden Root-Upgrades von Karten aus Zentralzonen | Access-Flow-, Ableitungs- und Chronicle-Regressionen | `23be2f32c` |
| 7 | Runner- und Corp-Fenster verwendeten dieselbe Iconsprache | Side wird datengetrieben an Ereignisfenster gereicht; Runner und Corp unterscheiden sich in Form, Akzent und Ecksymbol, bestehende Assets bleiben erhalten | Window-Icon-/Layering-Tests und Web-Typecheck | `06b9b7e2d` |
| 8 | `Reclamation Project` hatte unklare Auswahl- und Reveal-Zeilen | Auswahl erlaubt null Karten; leere Auswahl löst direkt auf; öffentliche Reveal-Titel erscheinen nur bei tatsächlichem Reveal, null Auswahl wird ausdrücklich benannt | Hidden-Zone- und Chronicle-Regressionen | `6de173f6a` |
| 9 | Corp-KI rezzt äußeres HQ-ICE angeblich nie | Match `match_8d959dc447958cef` rekonstruiert: `Colonel Failure` war nie bezahlbar; bezahlbares äußeres `Bug Zapper` wurde korrekt gerezzt. Kein KI-Fix erforderlich | SQLite-/LegalAction-/Decision-Trace-Review | `b33b7afd5` |
| 10 | Auto-End schloss Access-/Bestätigungsabläufe zu früh | Auto-End ist bei aktivem Run, Access-/Expose-Review, Damage, Bestätigung sowie sichtbaren oder wartenden Action-Cues gesperrt | 104 fokussierte Webtests, Web-Typecheck, Chromium-E2E | `7640ff018` |

## Chronicle-Querschnitt

Die Chronicle zeigt öffentliche fachliche Ergebnisse statt technischer
Choice-Fallbacks. Kartenidentitäten aus verdeckten Zonen werden nur dann
genannt, wenn der konkrete Effekt sie dem jeweiligen Viewer offenlegt. Das gilt
gemeinsam für `Corporate Shuffle`, `Reclamation Project` und `Dr. Dreff`.

## Gesamtverifikation

- 9 fokussierte Vitest-Dateien: 444 Tests bestanden
- Lockjaw-Regression: 1 bestanden, 63 nicht passende Tests gefiltert
- `corepack pnpm typecheck`: alle sieben Workspace-Projekte bestanden
- `corepack pnpm test:contracts`: 10 Shared- und 5 Contracttests bestanden
- `corepack pnpm check:package-boundaries`: 1.702 Dateien geprüft, Gate grün
- `corepack pnpm e2e`: 8 Chromium-Fälle bestanden
- `git diff --check`: grün

Der erste E2E-Anlauf war kein Produktfehler: Ein zu knapp gesetzter Shell-
Timeout ließ den von diesem Worktree gestarteten Next-Testprozess zurück. Nach
eindeutiger Prozessprüfung und Entfernung dieses Testprozessbaums lief das
unveränderte isolierte E2E-Gate vollständig grün.

## Restpunkte

- Eine spätere optionale KI-Erklärungs-UI könnte ausdrücklich zwischen
  „nicht gewollt“ und „nicht legal/nicht bezahlbar“ unterscheiden. Das ändert
  die korrekte Entscheidung im analysierten Match nicht.
- Die seitenspezifischen Ereignisicons verwenden bewusst vorhandene
  Code-/Asset-Bausteine; ein eigenständiges Visual-Redesign war kein Ziel.
- Main-Integration und Worktree-Entfernung erfolgen erst nach dem defensiven
  Abgleich mit dem aktuellen lokalen `main`.

## Freigabe

Der Arbeitsbranch erfüllt die fachlichen und technischen Done-Gates des
Paketprozesses. Er ist zur defensiven lokalen Main-Integration freigegeben.
