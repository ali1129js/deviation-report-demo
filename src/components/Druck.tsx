import type { ReactNode } from "react";
import type { Bericht } from "../lib/schema";
import { isoZuDeutsch } from "../lib/date";

const F = ({ l, children }: { l: string; children: ReactNode }) => (
  <div className="df">
    <span>{l}</span>
    <div>{children || "—"}</div>
  </div>
);
const zeit = (ts: string) =>
  ts ? new Date(ts).toLocaleString("de-DE", { timeZone: "Europe/Berlin" }) : "";

export function Druck({ bericht, zurueck }: { bericht: Bericht; zurueck: () => void }) {
  const d = bericht.daten;
  return (
    <>
      <div className="aktionen no-print">
        <button onClick={zurueck}>← Zurück</button>
        <button className="primaer" onClick={() => window.print()}>
          Drucken / als PDF
        </button>
      </div>
      <article className="blatt">
        <header className="blatt-kopf">
          <div>
            <h1>Abweichungsbericht</h1>
            <p>Northwind Snacks · Werk Nordheide</p>
          </div>
          <div className="rechts">
            <strong>{bericht.nummer}</strong>
            <span>
              {bericht.status === "abgeschlossen" ? "Abgeschlossen" : "ENTWURF"}
            </span>
          </div>
        </header>
        <h2>1 Was ist passiert?</h2>
        <F l="Kurztitel">{d.titel}</F>
        <F l="Entdeckt durch">{d.entdecktDurch}</F>
        <F l="Beschreibung">{d.beschreibung}</F>
        <h2>2 Ort</h2>
        <div className="drei">
          <F l="Linie">{d.linie}</F>
          <F l="Bereich">{d.bereich}</F>
          <F l="Maschine">{d.maschine}</F>
        </div>
        <h2>3 Zeitpunkt · 4 Auftrag / Charge</h2>
        <div className="drei">
          <F l="Datum / Uhrzeit">{d.datum && `${isoZuDeutsch(d.datum)} ${d.uhrzeit}`}</F>
          <F l="Auftrag">{d.auftrag}</F>
          <F l="Charge">{d.charge}</F>
          <F l="Produkt">{d.produkt}</F>
          <F l="Menge">{d.menge ?? ""}</F>
        </div>
        <h2>5 Auswirkung / Risiko</h2>
        <div className="drei">
          <F l="Risiko">{d.risiko}</F>
          <F l="Ware gesperrt">{d.ware_gesperrt ? "ja" : "nein"}</F>
        </div>
        <F l="Auswirkung">{d.auswirkung}</F>
        <h2>6 Sofortmaßnahme</h2>
        <F l="Maßnahme">{d.sofortmassnahme}</F>
        <h2>7 Ursache (vorläufig)</h2>
        <F l="Kategorie">{d.ursacheKategorie}</F>
        <F l="Vermutung">{d.ursache}</F>
        <h2>8 Unterschriften (4-Augen-Prinzip)</h2>
        <div className="sig">
          <div>
            <span>Erstellt</span>
            <b>{d.ersteller.name}</b>
            <small>{zeit(d.ersteller.zeit)}</small>
          </div>
          <div>
            <span>Geprüft</span>
            <b>{d.pruefer.name}</b>
            <small>{zeit(d.pruefer.zeit)}</small>
          </div>
        </div>
        <footer className="blatt-fuss">Demo – fiktive Daten</footer>
      </article>
    </>
  );
}
