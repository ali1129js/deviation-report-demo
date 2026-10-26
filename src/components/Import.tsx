import { useState } from "react";
import {
  parseProtokoll,
  type ImportFelder,
  type ImportVorschau,
} from "../lib/import/parser";
import { ladePdfJs, textAusPdf } from "../lib/import/pdfText";
import { BEISPIEL_TEXT } from "../lib/import/beispiel";
import { isoZuDeutsch } from "../lib/date";

const LABEL: Record<keyof ImportFelder, string> = {
  beschreibung: "Beschreibung",
  entdecktDurch: "Entdeckt durch",
  linie: "Linie",
  bereich: "Bereich",
  maschine: "Maschine",
  datum: "Datum",
  uhrzeit: "Uhrzeit",
  auftrag: "Auftrag",
  charge: "Charge",
  produkt: "Produkt",
  menge: "Menge",
};

export function Import({
  uebernehmen,
  abbrechen,
}: {
  uebernehmen: (f: ImportFelder) => void;
  abbrechen: () => void;
}) {
  const [text, setText] = useState("");
  const [vorschau, setVorschau] = useState<ImportVorschau | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const auswerten = (t: string) => {
    setText(t);
    setVorschau(parseProtokoll(t));
  };
  const ausPdf = async (buf: ArrayBuffer) => {
    setLaedt(true);
    setFehler(null);
    try {
      auswerten(await textAusPdf(buf, await ladePdfJs()));
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e));
    } finally {
      setLaedt(false);
    }
  };
  const beispielPdf = async () => {
    const r = await fetch(`${import.meta.env.BASE_URL}beispiel-protokoll.pdf`);
    await ausPdf(await r.arrayBuffer());
  };

  return (
    <section className="import">
      <h1>PDF-Import</h1>
      <p className="muted">
        Ein Linienprotokoll (PDF mit Textebene) einlesen. Nichts wird gespeichert, bevor
        du die Vorschau bestätigst.
      </p>
      <div className="card zeile">
        <label className="datei">
          PDF wählen
          <input
            type="file"
            accept="application/pdf"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await ausPdf(await f.arrayBuffer());
            }}
          />
        </label>
        <button onClick={beispielPdf}>Beispiel-PDF laden</button>
        <button onClick={() => auswerten(BEISPIEL_TEXT)}>Beispieltext einfügen</button>
        {laedt && <span className="muted">lese PDF …</span>}
      </div>
      {fehler && <div className="card fehler">{fehler}</div>}
      {vorschau && (
        <div className="import-raster">
          <div className="card">
            <h2>Erkannter Text</h2>
            <textarea
              rows={14}
              value={text}
              onChange={(e) => auswerten(e.target.value)}
            />
          </div>
          <div className="card">
            <h2>Vorschau der Übernahme</h2>
            <table className="vorschau">
              <tbody>
                {(Object.keys(LABEL) as (keyof ImportFelder)[]).map((k) => (
                  <tr key={k} className={vorschau.felder[k] === undefined ? "fehlt" : ""}>
                    <th>{LABEL[k]}</th>
                    <td>
                      {vorschau.felder[k] === undefined
                        ? "—"
                        : k === "datum"
                          ? isoZuDeutsch(String(vorschau.felder[k]))
                          : String(vorschau.felder[k])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vorschau.hinweise.length > 0 && (
              <ul className="hinweise">
                {vorschau.hinweise.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
            <div className="aktionen">
              <button
                className="primaer"
                disabled={Object.keys(vorschau.felder).length === 0}
                onClick={() => uebernehmen(vorschau.felder)}
              >
                Als neuen Bericht übernehmen
              </button>
              <button onClick={abbrechen}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
