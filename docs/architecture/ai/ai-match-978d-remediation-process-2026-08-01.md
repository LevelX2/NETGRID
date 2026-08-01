# Match 978d – generischer Corp-Scoring- und Defense-Remediation-Prozess

Status: Umsetzung und Worktree-Abnahme abgeschlossen; lokaler Main-Fast-Forward
ausstehend

Quelle: vollständiges 104/104-Entscheidungsaudit von
`match_978da70c2bd72e61` und anschließende Freigabe aller acht Maßnahmen durch
den Projektbetreiber am 1. August 2026.

## Zielprüfung

Der Endzustand ist ausreichend bestimmt. Die beobachtete Corp-Passivität wird
nicht durch einen neuen globalen Bonus oder Kartensonderfälle behandelt,
sondern durch vollständigere Fakten und Vergleiche in den vorhandenen
Plan-Ownern. Die acht Maßnahmen sind sequenziell prüfbar. Unsicherheiten bleiben
diagnostisch sichtbar und werden nicht als produktive Wirkung, Effektlücke oder
Draw-Erlaubnis umgedeutet.

## /Goal

Arbeite die Pakete P0 bis P7 vollständig und sequenziell im Worktree
`C:\Projekte\NETGRID_AI_MATCH_978D_ANALYSIS` auf Branch
`codex/ai-match-978d-analysis` ab. Prüfe und committe jedes abgeschlossene
Paket einzeln. Gleiche danach den Arbeitsbranch mit dem aktuellen lokalen
`main` ab, führe die vollständigen Gates aus, merge lokal nach `main`, prüfe
den integrierten Stand und entferne anschließend den sauberen Worktree sowie
den vollständig gemergten Arbeitsbranch. Kein Push.

## Gesamtziel

Die Corp soll eine belegbar tragfähige Agenda-Scoreline beginnen und resident
fortführen, statt bekannte Schutzwirkung wegen eines unbekannten
Geschwisterpfads zu verlieren, auf der letzten Aktion wirkungslos zu ziehen
oder das Scoreprojekt durch technisch nahe, fachlich schwächere Varianten zu
ersetzen. Defense soll ICE einschließlich unrezzter Staffelung als globale
Allokation bewerten und in aktuellen Rez-Fenstern jede exakt belegte
Zugriffssenkung oder Ressourcenwirkung berücksichtigen. Deckdoktrin soll nur
Strategien primär machen, deren erforderliche Komponenten im Deck tatsächlich
zusammenkommen.

## Annahmen und Nicht-Ziele

- Aktuelle Engine-Quotes, LegalActions und side-sichere PlayerViews bleiben die
  einzigen Regel- und Kostenquellen.
- Unbekannte Wirkung bleibt fail-closed. Eine bekannte tragfähige Teilroute
  darf jedoch von einer anderen unbekannten Teilroute nicht ausgelöscht werden.
- Unrezztes ICE darf als Staffelung, Bluff und vorbereitete Investition positiv
  sein; es gibt weder ein hartes Layer-Limit noch eine Pflicht, jede weitere
  Schicht sofort rezzen zu können.
- Zufall darf nur tatsächlich nahezu gleichwertige zulässige Varianten oder
  die freigegebene Rush-Neigung variieren, keine fachlich bessere Linie
  überstimmen.
- Keine Karten-ID-, Kartennamen- oder Decklisten-Sonderregel. Konkrete
  Instanz-IDs dienen nur der Bindung eines bereits vom Plan gewählten Steps.
- Keine Änderung der Spielregeln, keine Migration historischer Laufzeitdaten
  und keine Rückwärtskompatibilitätsarbeit.

## Controller-Invarianten

1. `corp.defend_servers` bleibt alleiniger Owner von globaler ICE-Allokation,
   Schutzprojektion, ICE-Installation und Rez-Entscheidung.
2. `corp.score_agenda` bleibt alleiniger Owner von Agenda, Zielserver,
   Install/Advance/Score, Deadline und Rush-Risiko.
3. `corp.establish_scoring_remote` besitzt die langfristige Remote-Nutzbarkeit,
   fordert Schutz aber nur als typisierten Defense-Need an.
4. Deckdoktrin liefert Strategieevidence; sie wählt keine Action und erzeugt
   keinen zweiten Plan- oder Choice-Resolver.
5. Jede produktive Action bleibt an Planinstanz, Step, Route, Action-ID,
   StateVersion und gegebenenfalls Karten-/Serverinstanz gebunden.
6. Choice-Resolver vervollständigen ausschließlich die Payload der bereits
   gewählten Action.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Rote Pakettests werden eng im aktuellen Paket diagnostiziert; Folgepakete
  beginnen erst nach grünem Done-Gate.
- Fehlende, veraltete oder falsch gebundene Quotes erzeugen einen sichtbaren
  Blocker und keinen Ersatzwert.
- Unerwartete fremde Änderungen oder nicht eindeutig lösbare Mergekonflikte
  stoppen die Integration, ohne Daten zu verwerfen.
- Standardports 3100/8787 und die Datenbank der Hauptinstanz werden nicht
  gestartet, gestoppt oder ersetzt. Diese Umsetzung benötigt keinen Server.

## State Machine

`P0 Vertrag -> P1 Schutz/Rez -> P2 Draw -> P3 Rush/Scorevergleich -> P4
ICE-Allokation -> P5 Doktrin -> P6 Observability/Determinismus -> P7 Vollgates
-> main-Abgleich -> main-Merge -> Cleanup`

Genau ein Paket ist aktiv. Jeder Übergang verlangt fokussierte Tests,
`git diff --check`, paketgenaues Staging und einen eigenen Commit.

## Paketfolge

### P0 – Prozess- und Regressionvertrag

- Ziel: Owner, Invarianten, Paketgrenzen und spielgleiche Abnahmeevidence
  festschreiben.
- Artefakte: dieses Dokument und der vollständige Matchaudit.
- Done-Gate: Dokumente sind konsistent; `git diff --check` ist grün.
- Commit: `docs(ai): define match 978d remediation process`

### P1 – Exakte Schutz- und Rezbewertung

- Ziel: bekannte Schutzbewertungen über alle Rez-Teilmengen erhalten und
  aktuelle ICE-Rez-Routen aus exakten Zugriffs- beziehungsweise
  Ressourcenquotes vollständig bewerten.
- Arbeit: bekannte und unbekannte Teilmengen getrennt aggregieren; eine
  bekannte beste/fundierte Route bleibt nutzbar, während unbekannte
  Geschwister als Evidence erhalten bleiben; Rez-Entscheidung bleibt beim
  Defense-Plan und respektiert Score-Reserven.
- Tests: Runtime-Unitregression für gemischte Teilmengen sowie real-engine-nahe
  Rezfensterregression entsprechend Auditentscheidung D80; Owner/Step/Route
  müssen `corp.defend_servers` bleiben.
- Done-Gate: das bezahlbare, exakt wirksame ICE wird nicht mehr wegen eines
  unbekannten Geschwisterpfads pauschal abgelehnt.
- Commit: `fix(ai): preserve exact corp defense routes across unknown subsets`

### P2 – Defense-Draw-Horizont

- Ziel: `draw_for_ice` nur bei belegter Effektlücke und realer
  Materialisierungschance vor dem nächsten Runnerzug.
- Arbeit: `subset_assessment_unknown` nicht als Effektlücke behandeln;
  Finanzierung ausschließlich an Economy delegieren; bei exponierter Agenda
  Draw nur zulassen, wenn nach Draw noch ein konkreter Schutzstep vor dem
  Runnerzug möglich ist. Sonst Advance, Funding oder explizites Abbrechen des
  Parents vergleichen.
- Tests: letzte-Aktion-, Full-Hand-, Funding-only- und Unknown-Regressionsfälle.
- Done-Gate: kein letzter-Klick-Draw ohne materialisierbaren Schutzfollow-up.
- Commit: `fix(ai): bind defensive draw to a materializable protection horizon`

### P3 – Rush-Risikobudget und Scorekonversion

- Ziel: den bisherigen qualitativen Bounded-ICE-Schalter durch einen
  planinternen, evidenzbasierten Risikovergleich ersetzen und vollständige
  Scoreprojekte fachlich vergleichen.
- Arbeit: Agenda-/Matchpointwert, sichtbare Breaker, aktuelle sowie bis zum
  nächsten Zugriff verfügbare Runner-Liquidität, öffentliche Banken,
  erwartete Pfadkosten und verbleibende Scoredauer auswerten. Agenda und Remote
  zusätzlich nach Klick-/Creditdauer, Stealwert, vorhandener Remoteinvestition,
  Synergie und residenter Fortsetzung vergleichen. Technische IDs sind nur
  stabiler letzter Tiebreak.
- Tests: akzeptierter und abgelehnter Rush, vorhandenes Remote vor neuem
  Remote, höherwertige Agenda-/Matchpointkonversion sowie Residenz/Ownership.
- Done-Gate: eine fachlich stärkere vollständige Linie verliert nicht gegen
  einen technischen ID-Tiebreak oder einen pauschalen ICE-Prädikatwert.
- Commit: `feat(ai): compare corp rush and score conversion risk end to end`

### P4 – Globale ICE-Opportunitätskosten

- Ziel: weitere Zentral- und Remoteschichten einschließlich unrezzter
  Staffelung als Teil der global besten Zielallokation bewerten.
- Arbeit: Grenzwert einer zusätzlichen Schicht gegen alternative Server,
  Rezreihenfolge, Credits, erwarteten Runneraufwand, Score-Parent und den Wert
  des Zurückhaltens vergleichen; kein festes Layer-Limit. Remote-Härtung bleibt
  typisierter Child-Need des Score-/Remote-Parents.
- Tests: zweite/dritte unrezzte Schicht kann produktiv sein; wirkungslose teure
  Zusatzschicht verdrängt keine bessere Allokation; Remote-Ausbau bleibt beim
  Defense-Owner.
- Done-Gate: die Corp kann ein tragfähiges Score-Remote aufbauen, ohne
  blind ICE zu stapeln oder Score-Ownership zu duplizieren.
- Commit: `feat(ai): value layered ice through global defense allocation`

### P5 – Kompositionsabhängige Deckdoktrin

- Ziel: Strategieanker nur bei vorhandener ausführbarer Komposition primär
  machen.
- Arbeit: Beschleuniger ohne passende Zielagenda und schwer aktivierbare
  Einzelanker als latent/sekundär einstufen; Remote-/Rush-Neigung generisch aus
  Agendaanforderungen, ICE, Wirtschaft und fehlender Beschleunigung ableiten.
- Tests: Deck aus Match 978d erhält keine primäre Fast-Advance- oder
  Recyclingdoktrin allein aus ASD beziehungsweise AI CFO; echte vollständige
  Kompositionen behalten ihre Strategie.
- Done-Gate: `check:ai-deck-doctrine-strategy` und fokussierte Doktrintests grün.
- Commit: `fix(ai): require strategy component composition in deck doctrine`

### P6 – Observability und deterministische Instanzwahl

- Ziel: korrekte öffentliche Punktesumme und replaystabile Wahl gleichwertiger
  Kartenkopien.
- Arbeit: `steal_agenda.totalAgendaPoints` als aggregierten Runnerstand nach
  dem Steal emittieren; semantisch gleichwertige Instanzen über einen stabilen,
  zustandsgebundenen Tiebreak wählen, ohne Kartenidentität zur Strategie zu
  machen.
- Tests: Engine-Event mit vorherigen Punkten; zwei gleiche Operationskopien
  wählen über Wiederholung/Checkpoint dieselbe Instanz und behalten denselben
  Plan/Step/Executor.
- Done-Gate: Event und Strict-Warmup-Checkpoint sind deterministisch grün.
- Commit: `fix(engine-ai): report aggregate steals and stabilize duplicate ties`

### P7 – Vollprüfung, Review und Integration

- Ziel: alle aktiven Gates, Paketverträge und die lokale Integration belegen.
- Checks: fokussierte Tests, `corepack pnpm check:ai`,
  `corepack pnpm check:ai-source-structure`,
  `corepack pnpm check:proteus-ai-readiness`,
  `corepack pnpm check:ai-deck-doctrine-strategy`, AI-Typecheck,
  `corepack pnpm test:ai:shards` sowie betroffene Engine-Tests und
  Workspace-Typechecks.
- Artefakte: Final Review mit Testzahlen, verbleibenden Unsicherheiten und
  Zuordnung aller acht Maßnahmen.
- Done-Gate: Arbeitsbranch sauber; aktuelles `main` integriert; Vollgates grün;
  lokaler Fast-Forward nach `main`; Main-Prüfung grün; Worktree und gemergter
  Branch nachweislich entfernt.
- Commit: `docs(ai): close match 978d remediation`

## Verifikationsregeln

- Fokussierte AI-Tests erhalten mindestens 180 Sekunden äußeres Zeitfenster.
- Vollständige AI-Shards, Typechecks und breite Gates erhalten mindestens
  600 Sekunden äußeres Zeitfenster und werden bei einer fortsetzbaren Cell-ID
  weiter beobachtet, nicht neu gestartet.
- Verhaltenstests prüfen Ergebnis und Ownership: Plan-ID, Step, Route,
  Action-ID und Executor bleiben beim zuständigen Owner.
- Umfangreiche Rohläufe bleiben unter `data/local/` und werden nicht
  versioniert.

## Worktree-, Git- und Abschlussregeln

- Umsetzung ausschließlich im genannten Arbeits-Worktree; Hauptcheckout nur
  für den finalen lokalen Merge.
- Fremde Änderungen werden nicht gestaged, gelöscht oder überschrieben.
- Vor jedem Commit: fokussierte Checks und `git diff --check`.
- Vor dem Merge aktuelles `main` in den Arbeitsbranch integrieren und erneut
  prüfen; kein Push.
- Nach erfolgreichem Main-Merge den exakten Worktree-Pfad validieren,
  ausschließlich eigene ignorierte Analyseartefakte entfernen, Worktree ohne
  `--force` entfernen, Entfernung in Git und Dateisystem prüfen und den
  vollständig gemergten Branch mit `git branch -d` löschen.

## Abschlusskriterien

Alle acht freigegebenen Maßnahmen sind umgesetzt oder mit einer engen,
nachweisbaren Removal Condition als verbleibende Unsicherheit dokumentiert;
alle Pflichtgates sind grün; `main` enthält jeden Paketcommit; es existiert
weder der Arbeits-Worktree noch der gemergte Arbeitsbranch. Erst danach darf
der ausdrücklich autorisierte Rechner-Shutdown ausgelöst werden.
