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
CHRONICLE_CHOICE_FALLBACK_AUDIT OK cases=65 webFixtures=60 engineScenarios=4 engineEvents=5 checked=130 skipped=0 fallbacks=0
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

Der Check deckt zwei Quellen ab:

- `web_fixture`: literal auswertbare `makeEvent("resolve_choice", { ... })`-Fixtures aus `apps/web/app/chronicle.test.ts`.
- `engine_scenario`: echte Engine-Flows, die LegalActions ausführen, anschließend `getPlayerView(...).publicEvents` aus Runner- und Corp-Sicht lesen und die realen `resolve_choice`-Events rendern.

Aktuell sind vier Engine-Szenarien enthalten: Trace-Gebote über `Audit of Call Records`, Damage-Prevention über `Force Shield`, Tag-Prevention über `Fall Guy` bei `Marked Accounts` und Runner-Discard-Phase.

Er ist noch kein Vollscan aller Karten und Engine-Pfade. Dafür müssen weitere reale Engine-Szenarien oder generierte PublicEvent-Fixtures ergänzt werden. Der sinnvolle Ausbaupfad ist:

1. Neue gefundene generische Chronikmeldung als `resolve_choice`-Fixture in `chronicle.test.ts` ablegen.
2. Den Chronicle-Formatter oder den Engine-Payload-Kontrakt spezialisieren.
3. `check:chronicle-choice-fallbacks` muss danach grün bleiben.

## Grenzen

Der Web-Fixture-Teil wertet nur literal auswertbare `makeEvent("resolve_choice", { ... })`-Aufrufe aus. Dynamische Testdaten werden bewusst übersprungen, damit der Check deterministisch und einfach bleibt.

Wenn ein neuer Choice-Pfad nur in Engine-Integrationstests existiert, kann er entweder als PublicEvent-Fixture in die Web-Chronicle-Tests kopiert oder als weiteres Engine-Szenario im Audit-Script ergänzt werden.
