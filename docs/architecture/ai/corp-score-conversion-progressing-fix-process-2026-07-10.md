# Corp-Score-Conversion-Progressing-Fix

## Status

- Status: in Umsetzung
- Datum: 2026-07-10
- Agent: `release-implementation-agent`
- Branch: `codex/ai-score-conversion-progressing-fix`
- Worktree: `C:\Projekte\NETGRID_AI_SCORE_CONVERSION_PROGRESSING_FIX`
- Integrationsbranch: lokales `main`

## Quelle und Freigabe

Der identische 20-Spiel-Retest des universellen Fast-Advance-Decks aktivierte
den neuen Score-Conversion-Controller sechsmal. Vier Pfade schlossen im selben
Zug mit einem Score ab. In den Matchups `original_blink_pressure` mit den Seeds
`universal-fast-advance-02` und `universal-fast-advance-05` installierte die
Corp die Agenda bei vier Klicks und ausreichenden Credits, nahm danach aber
dreimal einen Credit und beendete den Zug.

Der Nutzer hat die Umsetzung dieses zuvor vollständig beschriebenen Befunds
mit „Go“ freigegeben.

## Gesamtziel

Ein bereits als `same_turn_guaranteed` ausgewählter
`corp.create_score_window`-Conversion-Pfad bleibt nach dem ersten legalen
Schritt auch im normalen Planstatus `progressing` verbindlich. Off-Plan-
Aktionen dürfen ihn nur verdrängen, wenn der Pfad nicht mehr legal oder nicht
mehr vollständig erreichbar ist. Anschließend wird derselbe 20-Spiel-Lauf mit
denselben Decks, Seeds und dem 240-Aktionslimit erneut ausgeführt.

## Ursache

`progressTacticalPlans` schreibt einen fortgesetzten aktiven Plan auf
`progressing` um. Der Controller in `semantic-choice-ranking.ts` schützt einen
garantierten Corp-Conversion-Pfad derzeit ausschließlich bei
`mapping.plan.status === "active"`. Dadurch kann nach der Installation ein
positiv bewerteter Basic Credit die gemappte Advance-Aktion verdrängen, obwohl
die Plan-Evidence weiterhin den garantierten Same-Turn-Pfad beschreibt.

## Invarianten

- Die Engine bleibt alleinige Regelautorität.
- Es werden nur aktuelle `LegalActions` gewählt.
- Der Fix ist planstatus- und evidence-basiert, nicht karten-ID-spezifisch.
- Terminale, blockierte oder nicht mehr erreichbare Pfade werden nicht
  erzwungen.
- Hidden-Info-, Replay-, StateHash- und Redaction-Verträge bleiben unverändert.
- Fremde uncommittete Änderungen im Hauptworkspace werden nicht verändert.

## Nicht-Ziele

- keine neue Kartenlogik für Vapor Ops oder Chicago Branch;
- keine Änderung von Kartenregeln, Engine oder LegalAction-Verträgen;
- keine allgemeine Neugewichtung des Corp-Scorings;
- keine Behebung der sechs bestehenden Action-Limits;
- kein Push und kein Pull Request.

## Paketfolge

### P0 – Prozess und Evidence

- Ziel: Worktree, Fehlerbild, Freigabe und Abnahmebedingungen verankern.
- Artefakte: dieses Dokument und der Evidence-Report.
- Checks: `git status --short --branch`, `git diff --check`.
- Done: eigener Paketcommit.
- Commit: `docs(ai): record progressing conversion break evidence`

### P1 – Generische Planstatusbindung

- Ziel: Garantierte Conversion-Pfade in `active` und `progressing` schützen.
- Arbeit: Statusprädikat eng erweitern; positive Regression für den zweiten
  Planzug und negative Regression für nicht garantierte beziehungsweise
  blockierte Pläne ergänzen.
- Checks: fokussierte Semantic-Ranking-, Tactical-Plan- und Runtime-Tests;
  AI-Typecheck; `git diff --check`.
- Done: der belegte Credit-Override ist blockiert, normale Overrides bleiben
  unverändert zulässig.
- Commit: `fix(ai): preserve progressing score conversion plans`

### P2 – Breite Verifikation

- Ziel: angrenzende AI-Verträge und Plancontroller regressionsfrei halten.
- Checks: drei AI-Shards, `check:ai`, Package-Boundaries, Format und
  `git diff --check`.
- Done: alle Gates grün.
- Commit: nur bei erforderlichen Test-/Gate-Artefakten, sonst kein Leercommit.

### P3 – Identischer 20-Spiel-Nachtest und Integration

- Ziel: den Fix mit vier Runner-Decks und denselben fünf Seeds praktisch
  prüfen.
- Arbeit: identischen Lauf mit 240 Aktionen wiederholen; Controller-Pfade,
  Closeouts, Vapor-/Chicago-Nutzung, Safety und A/B-Kennzahlen auswerten;
  Final Review und Wissenslog ergänzen; lokal nach `main` integrieren.
- Done: kein garantierter Installationspfad bricht wegen eines Off-Plan-Credits
  ab; Ergebnis und Grenzen sind dokumentiert.
- Commit: `docs(ai): verify progressing score conversion fix`

## Verifikation

- Fokussierte Regression vor breiten Gates.
- AI-Typecheck und drei disjunkte Shards.
- Der 20-Spiel-Lauf muss 0 illegale Aktionen, Replayfehler,
  Redactionfehler und Fallbacks behalten.
- Action-Limits zählen als Ergebnis, nicht automatisch als Fixfehler.

## Verbindliches `/Goal`

```text
/Goal Arbeite den Corp-Score-Conversion-Progressing-Fix vollständig und
sequenziell von P0 bis P3 ab und merge den fertigen Arbeitsbranch lokal nach
main. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_SCORE_CONVERSION_PROGRESSING_FIX auf Branch
codex/ai-score-conversion-progressing-fix. Nutze den Hauptworkspace nur für
den finalen Merge und den lokalen 20-Spiel-Retest. Arbeite immer nur am
aktuellen Paket, führe die Paketchecks aus und committe jedes abgeschlossene
Paket. Stoppe bei Engine-, Hidden-Info-, Replay- oder Side-Safety-Regression.
Nach Abschluss aktuelles main integrieren, final verifizieren, lokal nach main
mergen, Worktree entfernen und das Goal erst danach abschließen.
```

## Abschlusskriterien

- `progressing` erhält denselben garantierten Conversion-Schutz wie `active`;
- nicht garantierte oder nicht fortsetzbare Pläne werden nicht geschützt;
- die zwei belegten Credit-Abbrüche besitzen eine fokussierte Regression;
- AI-Typecheck, drei AI-Shards und relevante Gates sind grün;
- identischer 20-Spiel-Nachtest ist ausgewertet;
- Arbeitsbranch ist lokal in `main` integriert.
