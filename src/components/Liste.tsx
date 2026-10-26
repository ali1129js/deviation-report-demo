import type { Ansicht } from "../App";
import { isoZuDeutsch } from "../lib/date";
import { loesche, type Datenbank } from "../lib/storage";

interface Props {
  db: Datenbank;
  aendern: (f: (db: Datenbank) => Datenbank) => void;
  oeffne: (a: Ansicht) => void;
}

export function Liste({ db, aendern, oeffne }: Props) {
  return (
    <section>
      <h1>Abweichungsberichte</h1>
      <p className="muted">
        Fiktive Verpackungslinie: Northwind Snacks, Linie 3 – Müsliriegel. Daten bleiben
        im Browser (localStorage).
      </p>
      {db.berichte.length === 0 ? (
        <div className="card leer">
          Noch keine Berichte. Lege einen neuen an oder importiere das Beispiel-PDF.
        </div>
      ) : (
        <div className="raster">
          {db.berichte.map((b) => (
            <article key={b.id} className="card bericht-karte">
              <div className="zeile">
                <strong>{b.nummer}</strong>
                <span className={`status ${b.status}`}>
                  {b.status === "entwurf" ? "Entwurf" : "Abgeschlossen"}
                </span>
              </div>
              <h3>{b.daten.titel || "(ohne Titel)"}</h3>
              <p className="muted">
                {isoZuDeutsch(b.daten.datum)} · {b.daten.maschine || "—"} · Charge{" "}
                {b.daten.charge || "—"}
              </p>
              {b.daten.risiko && (
                <span className={`risiko ${b.daten.risiko}`}>
                  Risiko {b.daten.risiko}
                </span>
              )}
              <div className="aktionen">
                <button onClick={() => oeffne({ art: "editor", id: b.id })}>
                  Öffnen
                </button>
                <button onClick={() => oeffne({ art: "druck", id: b.id })}>
                  Druckansicht
                </button>
                {b.status === "entwurf" && (
                  <button
                    className="gefahr"
                    onClick={() =>
                      confirm(`${b.nummer} löschen?`) && aendern((d) => loesche(d, b.id))
                    }
                  >
                    Löschen
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
