# Abschluss: Match 20EB – Run-Revalidierung, Eurocorpse und Bankkadenz (2026-07-17)

## Ergebnis

Der Nutzerhinweis zu D92 war korrekt und benennt den primären Fehler der
teuren Run-Sequenz: Nach dem öffentlichen Austausch eines Assets gegen eine
Agenda, dem Score dieser Agenda aus Remote 1 und ohne spätere Root-Installation
war der verbleibende Root-Typ eindeutig `upgrade`. Die KI behandelte ihn
dennoch als mögliche Agenda und erzwang über `opponent_matchpoint_contest`
einen Run, dessen Rohbewertung deutlich schlechter als der verfügbare
R&D-Run war.

Der Fehler ist side-safe behoben. D113 ist zusätzlich als defensive
Folgegrenze korrigiert: Wenn ein Root am Server öffentlich sichtbar wird und
der aktuelle Trash-Payoff die verbliebene Liquidität beziehungsweise den
Access-Reservevertrag nicht trägt, revalidiert der aktive RunnerRunPlan den
Payoff und darf legal aussteigen.

## Umgesetzte Korrekturen

### D92 – öffentliche Root-Typableitung

- Die Engine hatte `rootReplacement`, `replacedRootCardType` und den Server des
  Score-Ereignisses bereits öffentlich erzeugt.
- Die positive AI-DTO-Allowlist ließ diese Strukturfelder zuvor nicht durch.
- Das DTO erhält jetzt ausschließlich diese öffentlichen Strukturwerte;
  Karteninstanz-IDs und Kartentitel bleiben hinter der Redaction-Grenze.
- Der Runner-Belief-State leitet konservativ `candidateTypes: ["upgrade"]` ab,
  solange keine spätere Root-Mutation die Schlussfolgerung invalidiert.
- Der zuständige RunTarget-Owner reicht `accessPayoffContestable` an den
  Matchpoint-Consumer weiter. Damit bleibt die Modulgrenze erhalten und der
  Consumer berechnet Access-Payoffs nicht selbst neu.

### D113 – Revalidierung am Server

- Die Revalidierung quotiert den tatsächlich noch verbleibenden Pfad, nicht
  bereits passierte ICE.
- Bei vollständig sichtbaren Asset-/Upgrade-Roots wird die bestehende
  Trash-/Access-Reserve-Projektion mit den aktuellen Credits erneut angewandt.
- Nur ein aktueller, vollständig belegter `known_no_current_payoff` setzt den
  Plan auf `abort_recommended`; unbekannte Roots, Run-Card-Effekte sowie eigene
  Survival-/Win-Zwecke bleiben unberührt.
- Ein solcher aktueller konkreter Abort wird nicht mehr von der pauschalen
  Continue-/Jack-out-Score-Differenz zurückgenommen.

## Eurocorpse und Portfolio-Kadenz

Für beide Nutzerpunkte war auf dem Ausgangsstand bereits die frühere
Match-20EB-Remediation integriert; der Follow-up musste keinen weiteren
Produktionscode ändern.

- Eurocorpse wird nicht leer ohne hostbaren Breaker installiert.
- Ist ein Breaker sofort hostbar, bleiben Installation und konkreter
  Hosting-Schritt bevorzugbar.
- `maxActionsPerTurn: 1` bleibt für Hintergrundpläne eine weiche
  Ranking-Schwelle, keine Aktionssperre.
- Eine wiederholte Bankladung weicht einer wirklich sinnvollen Alternative,
  bleibt aber legal und wird erneut gewählt, wenn keine solche Alternative
  existiert.
- Die historischen `bankPortfolioActionsThisTurn:0` stammen aus dem alten
  Matchtrace und beschreiben nicht den aktuellen Vertrag.

## Dauerhafte Checkpoints

- D92 historisch: R&D wird gewählt; Remote 1 ist nicht akzeptabel.
- D92 Gegenprobe: Eine neue Root-Installation nach dem Score macht Remote 1
  wieder contestbar.
- D113 historisch mit 3 Credits: `jack_out`.
- D113 Gegenprobe mit 12 Credits: `continue_run`.
- Die bestehenden Match-20EB-Eurocorpse-/Bankcheckpoints bleiben unverändert
  grün.

## Verifikation

- D92-/D113-Checkpointdatei und fokussierte Run-Plan-Tests: 27/27 grün.
- Modulgrenzen, Memory-Diagnostik, RunTarget und Follow-up-Checkpoints:
  110/110 grün.
- Eurocorpse, Hosting, Portfolio, Bankkontext, Ranking und beide
  Match-20EB-Checkpointdateien: 154/154 grün.
- AI-Typecheck: grün.
- `check:ai`-Äquivalente direkt ausgeführt:
  - Compiled Hints: `errors=0`;
  - Derived Facts: `errors=0`;
  - Hint Compiled Index: `errors=0`;
  - Manual Overlays: `errors=0`;
  - Action Semantic Signal Catalog: grün.
- Vollständige AI-Testshards:
  - Shard 1: 120 Dateien, 813 Tests, grün;
  - Shard 2: 120 Dateien, 870 Tests, grün;
  - Shard 3: 119 Dateien, 840 Tests, grün;
  - Gesamt: 359 Dateishards, 2.523 Tests, grün.
- `git diff --check`: grün.

Der frische Worktree nutzte bewusst die bereits vorhandene lokale
Dependency-Runtime. Da ein gefilterter `pnpm exec` eine interaktive
Dependency-Neuanlage anstoßen wollte, liefen Vitest, TypeScript und die fünf
`check:ai`-Skripte direkt über dieselben lokalen Binaries beziehungsweise
Node-Skripte. Es wurden keine Abhängigkeiten verändert.

## Paketcommits

1. `62c345acb` – `docs(ai): plan match 20eb run revalidation follow-up`
2. `5805f8407` – `test(ai): capture match 20eb run revalidation regressions`
3. `33d99f707` – `fix(ai): preserve public remote root type deductions`
4. `786cbc3ac` – `fix(ai): revalidate run payoff before continuation`
5. `f6965dc8b` – `fix(ai): route matchpoint contestability through run targets`

Der lokale Main-Abgleich und das Entfernen von Worktree sowie Arbeitsbranch
folgen in P5.
