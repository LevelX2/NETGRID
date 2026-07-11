# Classic Silent Impact v2.2b Extension Review

Stand: 2026-07-11

## Ergebnis

Die zwei von NROHub nachgereichten Silent-Impact-v2.2b-Karten werden nicht als
eigenes Zwei-Karten-Set geführt. `Protected Resources` und `Phone Freak` sind
als `C053` und `C054` vollständig in Classic integriert; Classic umfasst damit
54/54 technisch implementierte, human-playable, deck-/formatlegale und
technisch AI-supported Karten.

Der historische Herkunftsnachweis bleibt getrennt erhalten:

- Transkription und Quelllinks:
  `docs/source/Classic_Silent_Impact_v2.2b_Ergaenzungsspoiler.txt`
- maschinenlesbarer Quellen- und Hashnachweis:
  `data/card-import/source-registry-classic-silent-impact-2026-07-11.json`
- private lokale Bilder:
  `data/local-assets/card-images/onr-1996/v22b-silent-impact/` sowie die
  hochauflösenden Rohdateien unter
  `data/local/card-import/silent-impact-v2.2b-source/`

Die Binärdateien bleiben gemäß Asset-Policy lokal und unversioniert. Die
Web-Bildauflösung ordnet den historischen Bildsatz
`v22b-silent-impact` den neuen Classic-Karten-IDs zu.

## Kartenmechaniken

- `Protected Resources` erzeugt für jeden aktuell bezahlbaren positiven Betrag
  eine LegalAction. Einlagern kostet zusätzlich einen Corp-Credit; Auszahlen
  kostet eine Aktion. Betrag, Quelle, Timing und Zahlungsfähigkeit werden vor
  jeder Mutation erneut validiert, die öffentlichen Bit-Counter bleiben
  replay- und StateHash-fähig.
- `Phone Freak` erhält bei Installation drei öffentliche Bits. Der bestehende
  Restricted-Credit-Vertrag erlaubt sie ausschließlich für Link-Erhöhungen und
  füllt den Pool nach Verwendung zu Beginn des nächsten Runner-Zugs wieder auf.

## Nachweise

- Kartendaten: `data/cards/classic-cards.json`
- Freigabestatus: `data/manifests/classic-card-support.json`
- Szenario: `data/scenarios/classic-silent-impact-smoke.json`
- Engine-Smoke:
  `packages/engine/src/index-tests/mechanics/classic-silent-impact.test.ts`
- CardImplementation-Coverage: Classic 54/54, keine Registry-, Manifest-,
  AI-Hint- oder Szenario-Drifts.

## Verifikation

- Engine-Smoke und CardImplementation-Coverage: 2 Testdateien, 48 Tests grün.
- Katalog: 12 Tests grün.
- Web-Bildlookup: 2 Tests grün; beide neuen IDs lösen zusätzlich im lokalen
  Cache auf die erwarteten `v22b-silent-impact`-PNG-Dateien auf.
- Engine-Typecheck: grün.
- `check:ai`: grün; 618 kompilierte Karten-Hints, keine Fehler.
- SHA-256 der beiden hochauflösenden Rohbilder stimmt mit dem versionierten
  Quellenregister überein.
- `git diff --check`: grün.
