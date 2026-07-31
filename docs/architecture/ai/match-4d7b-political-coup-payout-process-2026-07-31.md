# Match 4D7B Political-Coup-Auszahlung – Umsetzungsprozess

Status: in Arbeit  
Datum: 2026-07-31  
Quelle: aktives Match `match_4d7bd0eba9138d83`, Decision 57,
StateVersion 123

## Zielprüfung

Der Fund ist umsetzungsreif. Political Coup wurde bei Event 102 korrekt mit
zwölf Credits geladen. Bei Decision 57 waren die Standardaktion für einen
Credit und die Engine-zertifizierte Kartenfähigkeit für drei allgemeine
Credits gleichzeitig legal und kosteten jeweils einen Klick. Der produktive
`corp.economy`-Plan band trotzdem ausschließlich die Standardaktion.

## Gesamtziel

Die historische Entscheidung wird vor dem Fix spielgleich als rote
Regression gesichert. Danach erkennt `corp.economy` generisch sofortige,
garantierte und uneingeschränkte Credit-Auszahlungen aus eigenen sichtbaren
Kartenzonen einschließlich der Score Area und zieht eine strikt bessere
Auszahlung der Standard-Credit-Aktion vor. Veraltete
`focusedDecisionTest`-Referenzen werden automatisch erkannt.

## Annahmen

- Die Engine bleibt alleinige Autorität für LegalAction, Kosten,
  Auszahlungsmenge und verbleibenden Kartenpool.
- Der Plan darf konkrete Karteninstanzen binden, aber keine Karten-ID-Policy
  enthalten.
- Eine Auszahlung ist nur dann strikt besser als Basic Credit, wenn ihre
  Engine-Projektion aktuell, garantiert, allgemein verwendbar und nach Kosten
  netto größer ist.
- Nach jeder Auszahlung wird aus dem neuen Zustand neu geplant; eine
  Mehrfachauszahlung wird nicht vorab erzwungen.

## Nicht-Ziele

- keine Political-Coup- oder Political-Overthrow-Sonderregel;
- keine Änderung der Engine-Kartenmechanik;
- keine pauschale Bevorzugung zufälliger, temporärer, eingeschränkter oder
  nachteiliger Credits;
- keine neue Resolver-, Override- oder Fallback-Autorität;
- keine Änderung oder Neustart der Hauptinstanz auf Port 3100/8787.

## Controller-Invarianten

- Fachlicher Owner ist ausschließlich `corp.economy`.
- Der Economy-Plan bindet die exakte aktuelle `activated_card_ability` und
  ihre Karteninstanz.
- Choice-Resolver und Rohscore dürfen weder Action-ID noch Karten- oder
  Strategieziel neu bestimmen.
- `corp.complete_turn` darf erst gewinnen, wenn keine produktive gebundene
  Auszahlung mehr existiert.
- Der bestehende Plan-first-, LegalAction-, Replay- und Hidden-Info-Vertrag
  bleibt unverändert.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Nur `behavior_regression` zählt als roter Verhaltensnachweis.
- Engine-, Runtime-, Fixture- oder Redaction-Drift wird vor dem Fix als
  Infrastrukturproblem behandelt.
- Benötigt die Lösung nicht sichtbare Zustände oder eine zweite
  Entscheidungsautorität, stoppt der Prozess.
- Fremde Main-Änderungen werden defensiv integriert; fachlich
  widersprüchliche Konflikte blockieren den Abschluss.

## State Machine

`preflight -> red_evidence -> economy_fix -> reference_gate -> broad_verify -> merged -> cleaned`

Genau ein Zustand und ein Paket sind aktiv. Ein Paket wird erst nach grünem
Done-Gate committed.

## Paketfolge

### P0 – Prozess und Preflight

- Ziel, Ownership, Nicht-Ziele und Gates festhalten.
- Worktree und Branch verifizieren.
- Check: `git diff --check`.
- Commit: `docs(ai): plane Political-Coup-Auszahlungsfix`.

### P1 – Spielgleiche rote Evidence

- Decision 57 mit `strict`-Warmup aus der Runtime-SQLite capturen.
- Erwartung: exakt gebundene Political-Coup-Auszahlung beziehungsweise eine
  generische akzeptable Auszahlung mit größerem Nettoertrag; Basic Credit ist
  in dieser Lage verboten.
- Enge Gegenproben: gleicher Nettoertrag darf nicht pauschal verdrängt werden;
  eingeschränkte oder unvollständig gequotete Auszahlung bleibt ungebunden.
- Zieltest muss vor dem Fix `behavior_regression`, Gegenproben müssen grün
  ergeben.
- Commit: `test(ai): capture Political-Coup payout regression`.

### P2 – Generische sichtbare Karten-Auszahlung

- Den bestehenden Economy-Auszahlungsvertrag von Remote-Assets auf
  Engine-zertifizierte sichtbare eigene Kartenquellen verallgemeinern.
- Score-Area-Agendas über PlayerView und exakte LegalAction aufnehmen.
- Planung, Kandidatenbindung, Bewertung, Revalidation und Debug-Evidence
  gemeinsam erweitern.
- Zielcheckpoint und Gegenproben grün; angrenzende Economy-Tests grün.
- Commit: `fix(ai): prefer certified visible-card payouts`.

### P3 – Referenzgate

- `focusedDecisionTest`-Metadaten gegen vorhandene Datei und benannten Test
  prüfen oder veraltete Referenzen auf aktuelle Regressionsevidence umstellen.
- Gate-Selbsttest und relevante Hint-Gates grün.
- Commit: `test(ai): validate focused decision references`.

### P4 – Breite Verifikation und Review

- AI-Typecheck, Plans-, Runtime- und Checkpoint-Teilmengen ausführen.
- Drei AI-Shards als vollständiges Gate ausführen.
- Evidence-/Final-Review und Wissenslog aktualisieren.
- Commit: `docs(ai): close Political-Coup payout remediation`.

### P5 – Integration und Cleanup

- Aktuelles `main` in den Arbeitsbranch integrieren, finale Checks wiederholen.
- Branch lokal bevorzugt per Fast-Forward nach `main` mergen.
- Main sauber prüfen.
- Worktree entfernen und in Git sowie Dateisystem verifizieren.
- Gemergten Arbeitsbranch mit `git branch -d` löschen.

## Verifikationsregeln

- Äußeres Zeitfenster für thematische AI-Tests mindestens 180 Sekunden,
  vollständige Gates mindestens 600 Sekunden.
- Keine Erwartung wird nach dem Fix an das neue Ergebnis angepasst.
- Zielcheckpoint und Gegenproben werden vor und nach dem Fix dokumentiert.
- `git diff --check` vor jedem Commit.

## Verbindliches Goal

`/Goal` Arbeite diesen Prozess vollständig und sequenziell von P0 bis P5 im
Worktree `C:\Projekte\NETGRID_AI_POLITICAL_COUP_PAYOUT` auf Branch
`codex/ai-political-coup-payout` ab, merge den abgeschlossenen Arbeitsbranch
lokal nach `main`, verifiziere Main und entferne anschließend Worktree und
Arbeitsbranch nachweislich. Stelle keine Zwischenfragen, solange die
festgelegten automatischen Fortsetzungen greifen; stoppe nur an einem
Sicherheits- oder Fachblocker.

## Abschlusskriterien

- historische Regression auf aktuellem Code zuerst rot und danach grün;
- generische Score-Area-/Visible-Card-Auszahlung ohne Karten-ID-Sonderregel;
- Ownership bleibt bei `corp.economy`;
- veraltete fokussierte Testreferenzen werden erkannt;
- fokussierte und vollständige AI-Gates sind grün;
- Review, Main-Merge, Worktree- und Branch-Cleanup sind abgeschlossen.
