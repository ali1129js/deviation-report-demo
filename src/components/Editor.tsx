import { useEffect, useState, type ReactNode } from "react";
import type { Ansicht } from "../App";
import {
  BEREICHE,
  KATEGORIEN,
  LINIEN,
  MASCHINEN,
  RISIKEN,
  type Bericht,
  type BerichtDaten,
} from "../lib/schema";
import {
  aktualisiere,
  schliesseAb,
  ValidierungsFehler,
  type Datenbank,
} from "../lib/storage";
import { pruefeAbschluss, type Problem } from "../lib/validierung";
import { heute, jetztUhrzeit } from "../lib/date";

interface Props {
  bericht: Bericht;
  aendern: (f: (db: Datenbank) => Datenbank) => void;
  oeffne: (a: Ansicht) => void;
  setFehler: (s: string | null) => void;
}

function Abschnitt({
  nr,
  titel,
  children,
}: {
  nr: number;
  titel: string;
  children: ReactNode;
}) {
  return (
    <section className="card abschnitt">
      <h2>
        <span className="nr">{nr}</span> {titel}
      </h2>
      <div className="felder">{children}</div>
    </section>
  );
}

export function Editor({ bericht, aendern, oeffne, setFehler }: Props) {
  const [d, setD] = useState<BerichtDaten>(bericht.daten);
  const [probleme, setProbleme] = useState<Problem[]>([]);
  useEffect(() => setD(bericht.daten), [bericht.daten]);
  const zu = bericht.status === "abgeschlossen";

  const set = <K extends keyof BerichtDaten>(k: K, v: BerichtDaten[K]) =>
    setD((x) => ({ ...x, [k]: v }));
  const fehlerVon = (f: string) =>
    probleme
      .filter((p) => p.feld === f)
      .map((p) => p.text)
      .join(" · ");

  const text = (
    k: keyof BerichtDaten,
    label: string,
    opt: { lang?: boolean; ph?: string; liste?: readonly string[] } = {}
  ) => (
    <label className={opt.lang ? "breit" : ""}>
      {label}
      {opt.lang ? (
        <textarea
          rows={3}
          disabled={zu}
          value={String(d[k] ?? "")}
          placeholder={opt.ph}
          onChange={(e) => set(k, e.target.value as never)}
        />
      ) : (
        <input
          disabled={zu}
          value={String(d[k] ?? "")}
          placeholder={opt.ph}
          list={opt.liste ? `dl-${k}` : undefined}
          onChange={(e) => set(k, e.target.value as never)}
        />
      )}
      {opt.liste && (
        <datalist id={`dl-${k}`}>
          {opt.liste.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
      {fehlerVon(k) && <small className="feldfehler">{fehlerVon(k)}</small>}
    </label>
  );

  const speichern = () => aendern((db) => aktualisiere(db, bericht.id, d));
  const unterschreiben = (rolle: "ersteller" | "pruefer") =>
    set(rolle, {
      name: d[rolle].name,
      zeit: d[rolle].name.trim() ? new Date().toISOString() : "",
    });
  const abschliessen = () => {
    const p = pruefeAbschluss(d);
    setProbleme(p);
    if (p.length) return setFehler(`Abschluss nicht möglich: ${p.length} offene Punkte.`);
    aendern((db) => {
      try {
        return schliesseAb(aktualisiere(db, bericht.id, d), bericht.id);
      } catch (e) {
        if (e instanceof ValidierungsFehler) setProbleme(e.probleme);
        throw e;
      }
    });
  };

  return (
    <div className="editor">
      <div className="zeile kopfzeile">
        <h1>
          {bericht.nummer}{" "}
          <span className={`status ${bericht.status}`}>
            {zu ? "Abgeschlossen" : "Entwurf"}
          </span>
        </h1>
        <div className="aktionen">
          {!zu && <button onClick={speichern}>Speichern</button>}
          <button
            onClick={() => {
              if (!zu) speichern();
              oeffne({ art: "druck", id: bericht.id });
            }}
          >
            Druckansicht
          </button>
          {!zu && (
            <button className="primaer" onClick={abschliessen}>
              Abschließen
            </button>
          )}
        </div>
      </div>
      {probleme.length > 0 && (
        <div className="card fehler">
          <strong>Offene Punkte:</strong>
          <ul>
            {probleme.map((p, i) => (
              <li key={i}>{p.text}</li>
            ))}
          </ul>
        </div>
      )}

      <Abschnitt nr={1} titel="Was ist passiert?">
        {text("titel", "Kurztitel", { ph: "z. B. Siegelnaht undicht" })}
        {text("entdecktDurch", "Entdeckt durch")}
        {text("beschreibung", "Beschreibung", {
          lang: true,
          ph: "Was wurde beobachtet? Wie viel, wie oft?",
        })}
      </Abschnitt>

      <Abschnitt nr={2} titel="Ort / Linie / Maschine">
        {text("linie", "Linie", { liste: LINIEN })}
        {text("bereich", "Bereich", { liste: BEREICHE })}
        {text("maschine", "Maschine", { liste: MASCHINEN })}
      </Abschnitt>

      <Abschnitt nr={3} titel="Zeitpunkt">
        <label>
          Datum
          <input
            type="date"
            disabled={zu}
            value={d.datum}
            onChange={(e) => set("datum", e.target.value)}
          />
          {fehlerVon("datum") && (
            <small className="feldfehler">{fehlerVon("datum")}</small>
          )}
        </label>
        <label>
          Uhrzeit
          <input
            type="time"
            disabled={zu}
            value={d.uhrzeit}
            onChange={(e) => set("uhrzeit", e.target.value)}
          />
          {fehlerVon("uhrzeit") && (
            <small className="feldfehler">{fehlerVon("uhrzeit")}</small>
          )}
        </label>
        {!zu && (
          <button
            className="klein"
            onClick={() =>
              setD((x) => ({ ...x, datum: heute(), uhrzeit: jetztUhrzeit() }))
            }
          >
            Jetzt
          </button>
        )}
      </Abschnitt>

      <Abschnitt nr={4} titel="Auftrag / Charge">
        {text("auftrag", "Auftrag", { ph: "A3-2026-0412" })}
        {text("charge", "Charge", { ph: "NW-261026-L3A" })}
        {text("produkt", "Produkt", {
          liste: ["Hafer-Knusper 6er", "Beeren-Riegel 12er"],
        })}
        <label>
          Betroffene Menge (Packungen)
          <input
            type="number"
            min={0}
            disabled={zu}
            value={d.menge ?? ""}
            onChange={(e) =>
              set(
                "menge",
                e.target.value === ""
                  ? null
                  : Math.max(0, Math.trunc(Number(e.target.value)))
              )
            }
          />
        </label>
      </Abschnitt>

      <Abschnitt nr={5} titel="Auswirkung / Risiko">
        <fieldset className="radio">
          <legend>Risiko</legend>
          {RISIKEN.map((r) => (
            <label key={r} className={`risiko-wahl ${r}`}>
              <input
                type="radio"
                disabled={zu}
                checked={d.risiko === r}
                onChange={() => set("risiko", r)}
              />{" "}
              {r}
            </label>
          ))}
          {fehlerVon("risiko") && (
            <small className="feldfehler">{fehlerVon("risiko")}</small>
          )}
        </fieldset>
        <label className="check">
          <input
            type="checkbox"
            disabled={zu}
            checked={d.ware_gesperrt}
            onChange={(e) => set("ware_gesperrt", e.target.checked)}
          />{" "}
          Betroffene Ware gesperrt
          {fehlerVon("ware_gesperrt") && (
            <small className="feldfehler">{fehlerVon("ware_gesperrt")}</small>
          )}
        </label>
        {text("auswirkung", "Auswirkung auf Produkt / Kunde", { lang: true })}
      </Abschnitt>

      <Abschnitt nr={6} titel="Sofortmaßnahme">
        {text("sofortmassnahme", "Was wurde sofort getan?", { lang: true })}
      </Abschnitt>

      <Abschnitt nr={7} titel="Ursache (vorläufig)">
        <label>
          Kategorie
          <select
            disabled={zu}
            value={d.ursacheKategorie ?? ""}
            onChange={(e) =>
              set(
                "ursacheKategorie",
                (e.target.value || null) as BerichtDaten["ursacheKategorie"]
              )
            }
          >
            <option value="">– bitte wählen –</option>
            {KATEGORIEN.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          {fehlerVon("ursacheKategorie") && (
            <small className="feldfehler">{fehlerVon("ursacheKategorie")}</small>
          )}
        </label>
        {text("ursache", "Vermutete Ursache", { lang: true })}
      </Abschnitt>

      <Abschnitt nr={8} titel="Unterschriften (4-Augen-Prinzip)">
        {(["ersteller", "pruefer"] as const).map((rolle) => (
          <div key={rolle} className="unterschrift">
            <label>
              {rolle === "ersteller" ? "Erstellt von" : "Geprüft von (andere Person)"}
              <input
                disabled={zu || !!d[rolle].zeit}
                value={d[rolle].name}
                onChange={(e) => set(rolle, { name: e.target.value, zeit: "" })}
              />
            </label>
            {d[rolle].zeit ? (
              <p className="signiert">
                ✓ unterschrieben{" "}
                {new Date(d[rolle].zeit).toLocaleString("de-DE", {
                  timeZone: "Europe/Berlin",
                })}
                {!zu && (
                  <button
                    className="klein"
                    onClick={() => set(rolle, { name: d[rolle].name, zeit: "" })}
                  >
                    zurücknehmen
                  </button>
                )}
              </p>
            ) : (
              !zu && (
                <button
                  className="klein"
                  disabled={!d[rolle].name.trim()}
                  onClick={() => unterschreiben(rolle)}
                >
                  Unterschreiben
                </button>
              )
            )}
            {fehlerVon(rolle) && <small className="feldfehler">{fehlerVon(rolle)}</small>}
          </div>
        ))}
        <p className="muted breit">
          Ersteller/in und Prüfer/in müssen zwei verschiedene Personen sein. Abschluss
          erst mit beiden Unterschriften.
        </p>
      </Abschnitt>
    </div>
  );
}
