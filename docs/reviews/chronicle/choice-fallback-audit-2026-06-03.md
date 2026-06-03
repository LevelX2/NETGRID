# Chronicle Choice Fallback Audit

Stand: 2026-06-03

## Zweck

`resolve_choice` ist ein technischer Sammeltyp. Die Spielchronik darf daraus für konkrete Karten- und Mechanikentscheidungen keine generische Meldung wie `Du hast eine Entscheidung beantwortet.` anzeigen.

Der Audit macht diese Klasse von Problemen reproduzierbar: Er extrahiert literal beschriebene `resolve_choice`-Payloads aus `apps/web/app/chronicle.test.ts`, rendert sie mit `formatChronicleEvent` aus Runner- und Corp-Sicht und schlägt fehl, sobald ein gerenderter Titel den generischen Choice-Fallback oder das Engine-Default-Label enthält.

## Befehl

```powershell
corepack pnpm check:chronicle-choice-fallbacks
```

Aktueller Lauf:

```text
CHRONICLE_CHOICE_FALLBACK_AUDIT OK fixtures=60 checked=120 skipped=0 fallbacks=0
```

Optional kann ein JSON-Report geschrieben werden:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/check-chronicle-choice-fallbacks.ts --write-report
```

Für eine menschenlesbare Übersicht der konkreten Meldungsschablonen:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/check-chronicle-choice-fallbacks.ts --write-template-report
```

Aktueller Schablonenreport: `docs/reviews/chronicle/choice-message-template-report-2026-06-03.md`.

## Abdeckung

Der Check deckt die vorhandenen Web-Chronicle-Fixtures ab. Er ist damit ein Gate gegen Regressionen in bereits bekannten Choice-Formaten.

Er ist noch kein Vollscan aller Karten und Engine-Pfade. Dafür müssen weitere reale Engine-Szenarien oder generierte PublicEvent-Fixtures in die Chronicle-Testbasis übernommen werden. Der sinnvolle Ausbaupfad ist:

1. Neue gefundene generische Chronikmeldung als `resolve_choice`-Fixture in `chronicle.test.ts` ablegen.
2. Den Chronicle-Formatter oder den Engine-Payload-Kontrakt spezialisieren.
3. `check:chronicle-choice-fallbacks` muss danach grün bleiben.

## Grenzen

Der Audit wertet nur literal auswertbare `makeEvent("resolve_choice", { ... })`-Aufrufe aus. Dynamische Testdaten werden bewusst übersprungen, damit der Check deterministisch und einfach bleibt.

Wenn ein neuer Choice-Pfad nur in Engine-Integrationstests existiert, muss er entweder als PublicEvent-Fixture in die Web-Chronicle-Tests kopiert oder durch einen späteren Engine-Event-Export in den Audit eingespeist werden.
