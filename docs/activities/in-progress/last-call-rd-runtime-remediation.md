# Last Call at R&D: Runtime-Remediation

## Status

In Umsetzung auf `codex/last-call-rd-runtime-remediation` im Worktree
`C:\Projekte\NETGRID_LAST_CALL_RD_RUNTIME_REMEDIATION`.

## Quelle und Ziel

Die finale 3×10-Reihe „Last Call at R&D“ enthielt zwei Runtime-Abbrüche. Dieses
Paket reproduziert beide unverändert, behebt jeweils die erzeugende Schicht
ohne neue Entscheidungsautorität und schließt mit fokussierten Tests, KI-Gates,
einem 3×10-Selfplay-Gate sowie lokaler Integration nach `main` ab.

## Annahmen und Nicht-Ziele

- Grundlage ist der aktuelle lokale `main` bei Beginn: `8a84da0d` (vorheriger
  Ausgangsstand: `6afe08efdf`).
- Kein Push, kein Pull Request und keine Kompatibilitäts- oder Migrationsarbeit.
- Diagnose-Traces bleiben lokal und side-sicher; sie werden nicht als dauerhafte
  Roh-Evidence versioniert.
- Die Engine bleibt die einzige Regelautorität. Resolver dürfen nur die bereits
  gebundene Choice-Payload komplettieren.

## Controller-Invarianten

- `actionId`, Root-Plan, Executor, `PlanExecutionOrigin` und gebundene
  Continuation bleiben über ein Choice-Fenster erhalten.
- Scheduler, Plan und Resolver erzeugen keine parallele Strategie-, Ziel- oder
  Serverentscheidung.
- Keine Hidden-Information in Tests, Plan-Inputs, Traces oder Fehlerausgaben.
- Determinismus, Replay und StateHash bleiben erhalten; `fallbackUsed` bleibt
  `false`.

## Paketfolge

### LC01 – Unveränderte Reproduktion und Diagnose

Reproduziere beide vorgegebenen Seeds mit `maxActions: 480`,
`current_candidate` und `hard`; erstelle minimal side-sichere Ausschnitte um
die erste Fehlentscheidung. Nachweis: LegalActions, Choice-Origin oder
Source-/Ability-Bindung, residente Instanzen, Root/Executor, Step/Route,
abgelehnte Kandidaten, erster fehlender Owner und fachliche Bewertung der
angebotenen Action.

Done-Gate: Abbruch und verursachende Schicht sind reproduzierbar belegt.
Commit: `test(ai): capture last-call runtime reproductions` (nur falls
dauerhafte Test-/Diagnose-Evidence entsteht).

### LC02 – Window-Origin binden

Behebe `window_origin_missing` in der erzeugenden Window-/Continuation-Schicht
und ergänze einen fokussierten Ownership-Regressionstest. Der Resolver darf nur
die exakte gebundene Payload vervollständigen.

Done-Gate: enger Test und erster Seed bestehen ohne Abbruch, Illegal Action,
Fallback, Replayfehler oder Action Limit.
Commit: `fix(ai): preserve window origin for last-call choice`.

### LC03 – Jack ’n’ Joe korrekt einordnen

Behebe die fehlende Planmodul-Abdeckung an Engine-LegalAction-Erzeugung oder
dem zuständigen Search-/Coverage-/Development-Owner. Ergänze positive und
negative Ownership-Regressionen; Saloon-/Crèche-Ownership bleibt unverändert.

Done-Gate: enger Test und zweiter Seed bestehen ohne Abbruch, Illegal Action,
Fallback, Replayfehler oder Action Limit.
Commit: `fix(ai): cover productive Jack-n-Joe search actions`.

### LC04 – Integrations-Gates und Abschluss

Führe angrenzende Tests, `check:ai`, Typecheck, volle AI-Shards,
`git diff --check` und das exakt dreipaarige 3×10-Gate aus. Aktualisiere bei
wiederverwendbarer Erkenntnis die zuständige Current-State-Dokumentation.

Done-Gate: alle verlangten Gates grün oder unabhängige Baselinefehler klar
getrennt. Arbeitsbranch ist sauber und paketweise committed.

## Abschlussregeln

Nach den grünen Akzeptanztests wird aktuelles `main` defensiv eingebunden,
der Branch lokal nach `main` integriert, `main` geprüft, anschließend nur der
saubere genannte Worktree entfernt und der gemergte Branch gelöscht. `/Goal`
gilt erst nach beiden Cleanup-Nachweisen als vollständig.
